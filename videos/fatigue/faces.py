"""Repère où est ton visage dans la vidéo source, pour que rien ne le recouvre.
Usage : python3 faces.py in/voix-video.mp4      -> out/zones.json (+ out/zones/frames.json)
- closeups : intervalles où tu es très près de la caméra (visage énorme ou non détecté) : les petits visuels y sont masqués
- frames   : boîte du visage toutes les 0,25 s (en pixels 1080x1920), utilisée par check_overlap.py"""
import cv2, json, sys, os
src = sys.argv[1]; os.makedirs('out/zones', exist_ok=True)
cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS); step = max(1, int(fps * .25))
det = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
rows = []; i = 0
while True:
    ok, fr = cap.read()
    if not ok: break
    if i % step == 0:
        im = cv2.resize(fr, (270, 480)); f = det.detectMultiScale(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY), 1.1, 5, minSize=(30, 30))
        b = max(f, key=lambda x: x[2] * x[3]).tolist() if len(f) else None
        rows.append({'t': round(i / fps, 2), 'face': [int(v * 4) for v in b] if b else None})
    i += 1
json.dump(rows, open('out/zones/frames.json', 'w'))
# visage énorme (> 420 px de large), ou non détecté pendant au moins 1,25 s d'affilée (5 mesures)
bad = []; run = []
for r in rows:
    if r['face'] and r['face'][2] <= 420:
        if len(run) >= 5: bad += run
        run = []
        continue
    if r['face']: bad.append(r['t']); run = []
    else: run.append(r['t'])
if len(run) >= 5: bad += run
bad = sorted(bad)
iv = []; s = p = None
for t in bad:
    if s is None: s = t
    elif t - p > .6: iv.append([s, p]); s = t
    p = t
if s is not None: iv.append([s, p])
iv = [[round(max(0, a - .35), 2), round(b + .45, 2)] for a, b in iv]
json.dump({'closeups': iv, 'faces': [[r['t']] + r['face'] for r in rows if r['face']]}, open('out/zones.json', 'w'))
print('gros plans (visage énorme ou non détecté) :', iv or 'aucun')
