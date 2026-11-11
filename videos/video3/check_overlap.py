"""Contrôle : combien du visage est recouvert par les sous-titres / visuels, image par image (toutes les 0,25 s).
Usage : python3 check_overlap.py     (après les rendus ; lit out/zones/frames.json et les .mov transparents)"""
import json, subprocess, numpy as np
R = {r['t']: r['face'] for r in json.load(open('out/zones/frames.json'))}
def alpha(f, ts):
    out = []
    for t in ts:
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(t), '-i', f, '-frames:v', '1', '-vf', 'alphaextract,scale=270:480,format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
        out.append(np.frombuffer(raw, np.uint8).reshape(480, 270) > 20 if len(raw) == 270 * 480 else np.zeros((480, 270), bool))
    return out
import os
NODET = json.load(open('out/zones.json')).get('nodet', []) if os.path.exists('out/zones.json') else []
for t in list(R):
    if not R[t] and any(a <= t <= b for a, b in NODET): R[t] = [0, 0, 1080, 1560]   # gros plan : visage jusqu'à ~1560 px
# zoom : le visage grossit autour de (zoomCenter) ; début de vidéo : visage non fiable -> on suppose la tête jusqu'à 1180 px
try:
    LY = json.load(open('out/layout.json')); ZP = LY['zooms']; ZC = LY['zoomCenter']; INTRO = LY.get('introEnd', 0)
except Exception: ZP, ZC, INTRO = [], {'x': 540, 'y': 700}, 0
sm = lambda x: x * x * (3 - 2 * x)
def zoom(t):
    s = 1.0
    for z in ZP:
        u = min(1, max(0, (t - z['t0']) / z['in'])); v = min(1, max(0, (t - z['t0'] - z['in'] - z['hold']) / z['out'])); s += z['amp'] * sm(u) * (1 - sm(v))
    return s
for t in list(R):
    if t < INTRO + .3: R[t] = [0, 0, 1080, 1180]
    elif R[t] and R[t] != [0, 0, 1080, 1560]:
        s = zoom(t); x, y, w, h = R[t]; R[t] = [ZC['x'] + (x - ZC['x']) * s, ZC['y'] + (y - ZC['y']) * s, w * s, h * s]
ts = [t for t in R if R[t]]
A = [a | b for a, b in zip(alpha('out/calque_transparent.mov', ts), alpha('out/calque_transparent.mov', ts))]
face_hit = []; hair_hit = []; worst = 0
for t, a in zip(ts, A):
    x, y, w, h = [v / 4 for v in R[t]]
    fb = a[int(y):int(y + h), int(x):int(x + w)]; hb = a[max(0, int(y - .5 * h)):int(y), int(x):int(x + w)]
    f = fb.mean() if fb.size else 0; hh = hb.mean() if hb.size else 0
    worst = max(worst, f)
    if f > 0.005: face_hit.append((t, round(f * 100, 1)))
    if hh > 0.02: hair_hit.append((t, round(hh * 100, 1)))
print(f'{len(ts)} instants contrôlés (visage détecté)')
print('VISAGE recouvert (>0,5 %) :', face_hit if face_hit else 'jamais')
print('CHEVEUX / front (au-dessus du visage) touchés (>2 %) :', f'{len(hair_hit)} instants, max {max([h for _, h in hair_hit])} %, aux temps {[t for t, _ in hair_hit][:12]}' if hair_hit else 'jamais')
