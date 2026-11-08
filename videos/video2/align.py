"""Cale l'animation sur ta voix.
Usage : python3 align.py voix.(wav|mp3|m4a|mp4) [modele=small]
1. node render.js prep         (écrit out/layout.json avec les mots du script)
2. python3 align.py ma_voix.m4a
3. node render.js prep && python3 audio.py out/layout.json out/ && node render.js pass all|subs|vis
Sorties : out/words.json (horaires par mot du script), out/voix.wav (voix normalisée), rapport dans le terminal.
"""
import json, re, subprocess, sys, unicodedata, difflib, wave
import numpy as np
from faster_whisper import WhisperModel

audio = sys.argv[1]; size = sys.argv[2] if len(sys.argv) > 2 else 'small'
L = json.load(open('out/layout.json')); words = L['words']
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', audio, '-vn', '-ac', '1', '-ar', '16000', 'out/voix16.wav'], check=True)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', audio, '-vn', '-ac', '2', '-ar', '44100', 'out/voix.wav'], check=True)
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', 'out/voix.wav'], capture_output=True, text=True).stdout)

def norm(s):
    s = unicodedata.normalize('NFD', s.lower()); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]', '', s)

prompt = ' '.join(w['raw'] for w in words)
model = WhisperModel(size, device='cpu', compute_type='int8')
with wave.open('out/voix16.wav') as wf: pcm = np.frombuffer(wf.readframes(wf.getnframes()), np.int16).astype(np.float32) / 32768
segs, info = model.transcribe(pcm, language='fr', word_timestamps=True, beam_size=5, condition_on_previous_text=False, temperature=0.0)  # pas d'initial_prompt : un long texte indice fait dérailler Whisper
heard = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words if norm(w.word)]
json.dump([{'w':h[0],'t0':round(h[1],2),'t1':round(h[2],2)} for h in heard], open('out/transcription.json','w'), ensure_ascii=False)
print('TRANSCRIPTION :', ' '.join(h[0] for h in heard))
print(f'{len(heard)} mots entendus, {len(words)} dans le script, voix {dur:.1f} s')

# alignement (Needleman-Wunsch) script <-> transcription
S = [norm(w['raw']) for w in words]; H = [norm(h[0]) for h in heard]
n, m = len(S), len(H); GAP = -.45
def sim(a, b):
    if not a or not b: return -1
    r = difflib.SequenceMatcher(None, a, b).ratio(); return (r * 2 - 1) if r >= .5 else -.8
D = [[0] * (m + 1) for _ in range(n + 1)]; P = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1): D[i][0] = i * GAP; P[i][0] = 1
for j in range(1, m + 1): D[0][j] = j * GAP; P[0][j] = 2
for i in range(1, n + 1):
    for j in range(1, m + 1):
        c = [(D[i-1][j-1] + sim(S[i-1], H[j-1]), 0), (D[i-1][j] + GAP, 1), (D[i][j-1] + GAP, 2)]
        D[i][j], P[i][j] = max(c)
pair = {}; i, j = n, m
while i > 0 or j > 0:
    k = P[i][j]
    if i > 0 and j > 0 and k == 0:
        if sim(S[i-1], H[j-1]) > 0: pair[i-1] = j-1
        i -= 1; j -= 1
    elif i > 0 and (j == 0 or k == 1): i -= 1
    else: j -= 1
t0 = [None] * n; t1 = [None] * n
for i, j in pair.items(): t0[i], t1[i] = heard[j][1], heard[j][2]
exact = len(pair)
# mots non entendus : interpolation entre voisins, au prorata du nombre de lettres
i = 0
while i < n:
    if t0[i] is None:
        k = i
        while k < n and t0[k] is None: k += 1
        a = t1[i-1] if i > 0 else 0.0; b = t0[k] if k < n else dur
        tot = sum(len(S[x]) + 1 for x in range(i, k)); cur = a
        for x in range(i, k):
            d = (b - a) * (len(S[x]) + 1) / tot; t0[x], t1[x] = cur, cur + d * .92; cur += d
        i = k
    else: i += 1
# monotonie + bornes
for i in range(n):
    if i and t0[i] < t1[i-1] - .02: t0[i] = max(t0[i], t1[i-1] - .02)
    if t1[i] <= t0[i]: t1[i] = t0[i] + .08
json.dump({'total': round(dur, 3), 'words': [{'t0': round(a, 3), 't1': round(b, 3)} for a, b in zip(t0, t1)]}, open('out/words.json', 'w'))
print(f'{exact}/{n} mots du script retrouvés dans la voix ({100*exact/n:.0f} %), {n-exact} interpolés')
miss = [words[i]['raw'] for i in range(n) if i not in pair]
if miss: print('interpolés (à vérifier) :', ', '.join(miss))
