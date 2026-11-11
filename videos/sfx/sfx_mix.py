"""Place des bruitages du SFX Kit (CC0) sur une timeline et les mélange à la voix.

Usage :
  python3 sfx_mix.py events.json --out out/sfx [--voice voix.wav] [--speech words.json] [--sfx-db 0]

events.json : liste d'événements. Chaque événement vise un MOMENT (t, en secondes) de la vidéo :
  {"t": 61.5,  "role": "stamp"}                              # rôle défini dans roles.json
  {"t": 36.2,  "role": "countup", "dur": 0.8}                # action qui dure 0,8 s : le son est ajusté à cette durée
  {"t": 38.95, "sound": "tone-ding-high", "gain_db": -2}     # identifiant précis du SFX Kit
t = le moment où le point de synchronisation du son (sync.at) doit tomber. Début du son = t - sync.at / rate.

Sorties :
  <out>.wav        : bruitages seuls (stéréo 48 kHz)
  <out>_mix.wav    : voix + bruitages (si --voice)
  <out>_rapport.txt: ce qui a été placé, où, à quelle vitesse, avec quelle baisse sous la voix

--speech : fichier JSON avec {"words":[{"t0":..,"t1":..}, ...]} (words.json de l'alignement, ou transcription.json).
           Sert à baisser chaque son de `under_voiceover_db` là où il recouvre la voix (règle du kit).
Les sons manquants sont téléchargés avec fetch_sfx.py.
"""
import argparse, json, os, subprocess, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__)); KIT = os.path.join(HERE, 'kit'); SR = 48000
SOUNDS = {s['id']: s for s in json.load(open(os.path.join(KIT, 'sounds.json')))['sounds']}
ROLES = json.load(open(os.path.join(HERE, 'roles.json')))['roles']


def decode(path, sr=SR):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(sr), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).T.copy()


def load_sound(sid):
    s = SOUNDS[sid]; p = os.path.join(KIT, s['file'])
    if not os.path.exists(p):
        subprocess.run([sys.executable, os.path.join(HERE, 'fetch_sfx.py'), sid], check=True, capture_output=True)
    return s, decode(p)


def resample(x, rate):
    """rate > 1 : plus rapide et plus aigu (comme le dit le guide du kit)."""
    if abs(rate - 1) < 1e-3: return x
    n = int(x.shape[1] / rate); src = np.arange(n) * rate
    return np.stack([np.interp(src, np.arange(x.shape[1]), ch) for ch in x])


def speech_mask(path, total):
    if not path: return np.zeros(total, np.float32)
    w = json.load(open(path))['words']; m = np.zeros(total, np.float32)
    iv = sorted((x['t0'], x['t1']) for x in w if x.get('t1') is not None)
    merged = []
    for a, b in iv:
        if merged and a - merged[-1][1] < .25: merged[-1][1] = b
        else: merged.append([a, b])
    for a, b in merged: m[int(max(0, a) * SR):int(b * SR) + 1] = 1
    k = int(.04 * SR); return np.convolve(m, np.ones(k) / k, 'same')   # fondu de 40 ms


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('events'); ap.add_argument('--out', required=True)
    ap.add_argument('--voice'); ap.add_argument('--speech'); ap.add_argument('--sfx-db', type=float, default=0.0)
    ap.add_argument('--duration', type=float, help='durée totale (par défaut : celle de la voix ou du dernier événement + 3 s)')
    a = ap.parse_args()
    ev = json.load(open(a.events)); voice = decode(a.voice) if a.voice else None
    total_s = a.duration or (voice.shape[1] / SR if voice is not None else max(e['t'] for e in ev) + 3)
    total = int(total_s * SR) + SR; bus = np.zeros((2, total), np.float32); mask = speech_mask(a.speech, total); rep = []
    for e in sorted(ev, key=lambda e: e['t']):
        sid = e.get('sound') or ROLES[e['role']]['sound']; fit = e.get('fit', ROLES.get(e.get('role'), {}).get('fit', False)) if 'role' in e else False
        s, x = load_sound(sid); rate = 1.0
        if e.get('dur') and (fit or e.get('fit')) and s.get('span_seconds'):          # ajuster l'action à sa durée
            lo, hi = s['adapt']['rate']; rate = float(np.clip(s['span_seconds'] / e['dur'], lo, hi))
        if e.get('rate'): rate = float(e['rate'])
        elif 'role' in e and ROLES[e['role']].get('rate'): rate = float(ROLES[e['role']]['rate'])      # octave, etc. définie dans roles.json
        x = resample(x, rate); at = s['sync']['at'] / rate; start = e['t'] - at
        if e.get('dur') and rate != 1 and e['dur'] < x.shape[1] / SR:                  # trop long malgré le rythme : on coupe avec un fondu
            n = int(e['dur'] * SR + at * SR); fade = min(int(.04 * SR), n); x = x[:, :n].copy(); x[:, -fade:] *= np.linspace(1, 0, fade)
        i0 = int(round(start * SR)); lo_cut = max(0, -i0)
        if lo_cut: x = x[:, lo_cut:]; i0 = 0
        n = min(x.shape[1], total - i0); x = x[:, :n]
        g = 10 ** ((e.get('gain_db', ROLES.get(e.get('role'), {}).get('gain_db', 0)) + a.sfx_db) / 20)
        under = s.get('under_voiceover_db', 0); duck = 10 ** (under / 20)
        env = 1 - mask[i0:i0 + n] * (1 - duck)                                         # baisse seulement là où la voix parle
        ducked = float((1 - env).max() > 0.01)
        bus[:, i0:i0 + n] += x * g * env
        rep.append('%7.2f s  %-34s moment visé %.2f s | début %.3f s | vitesse ×%.2f | baisse sous voix %s' % (e['t'], sid, e['t'], start, rate, ('%+d dB' % under) if ducked else 'non (pas de voix)'))
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    def write(path, y):
        pk = np.abs(y).max()
        if pk > .89: y = y * (.89 / pk)
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', path], input=y.T.astype(np.float32).tobytes(), check=True)
    write(a.out + '.wav', bus)
    if voice is not None:
        mix = np.zeros_like(bus); n = min(voice.shape[1], total); mix[:, :n] = voice[:, :n]; write(a.out + '_mix.wav', mix + bus)
    open(a.out + '_rapport.txt', 'w').write('\n'.join(rep) + '\n'); print('\n'.join(rep)); print('→', a.out + '.wav', '+ _mix.wav' if voice is not None else '')


if __name__ == '__main__': main()
