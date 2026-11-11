"""Repère où est ton visage dans la vidéo source, pour que rien ne le recouvre.
Usage : python3 faces.py in/voix-video.mp4      -> out/zones.json (+ out/zones/frames.json)
- closeups : intervalles où tu es très près de la caméra (visage énorme ou non détecté) : les petits visuels y sont masqués
- frames   : boîte du visage toutes les 0,25 s (en pixels 1080x1920), utilisée par check_overlap.py"""
import cv2, json, sys, os
import numpy as np
src = sys.argv[1]; os.makedirs('out/zones', exist_ok=True)
cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS); step = max(1, int(fps * .25))
H = cv2.data.haarcascades
CASC = [cv2.CascadeClassifier(H + n) for n in ('haarcascade_frontalface_default.xml', 'haarcascade_frontalface_alt2.xml', 'haarcascade_frontalface_alt.xml')]
PROF = cv2.CascadeClassifier(H + 'haarcascade_profileface.xml')
def rot(img, ang):
    h, w = img.shape[:2]; M = cv2.getRotationMatrix2D((w / 2, h / 2), ang, 1); return cv2.warpAffine(img, M, (w, h)), cv2.invertAffineTransform(M)
def back(M, x, y, w, h):  # boîte (x,y,w,h) dans l'image tournée -> boîte englobante dans l'image d'origine
    pts = np.array([[x, y], [x + w, y], [x, y + h], [x + w, y + h]], np.float32); o = pts @ M[:, :2].T + M[:, 2]
    x0, y0 = o.min(0); x1, y1 = o.max(0); return [x0, y0, x1 - x0, y1 - y0]
PREV = [None]
def detect(g):
    """plusieurs détecteurs, plusieurs inclinaisons de tête, plus un profil : on garde le plus grand visage trouvé"""
    cands = []
    for ang in (0, -15, 15, -30, 30):
        gi, M = rot(g, ang) if ang else (g, None)
        for c in CASC[:2]:
            for (x, y, w, h) in c.detectMultiScale(gi, 1.08, 4, minSize=(40, 40)):
                cands.append(back(M, x, y, w, h) if ang else [x, y, w, h])
        if ang == 0:
            for (x, y, w, h) in PROF.detectMultiScale(gi, 1.1, 4, minSize=(40, 40)): cands.append([x, y, w, h])
            fl = cv2.flip(gi, 1)
            for (x, y, w, h) in PROF.detectMultiScale(fl, 1.1, 4, minSize=(40, 40)): cands.append([g.shape[1] - x - w, y, w, h])
    Hh, Ww = g.shape[:2]
    cands = [c for c in cands if .12 * Ww <= c[2] <= .62 * Ww and .75 <= c[2] / max(1, c[3]) <= 1.3 and .12 * Hh <= c[1] + c[3] / 2 <= .66 * Hh]   # taille, forme et hauteur plausibles pour un visage
    if not cands: return None
    def iou(a_, b_):
        x0, y0 = max(a_[0], b_[0]), max(a_[1], b_[1]); x1, y1 = min(a_[0] + a_[2], b_[0] + b_[2]), min(a_[1] + a_[3], b_[1] + b_[3])
        i_ = max(0, x1 - x0) * max(0, y1 - y0); return i_ / (a_[2] * a_[3] + b_[2] * b_[3] - i_)
    best = None
    for c in cands:
        votes = sum(1 for d in cands if iou(c, d) > .35)                       # combien de détecteurs / inclinaisons s'accordent
        sc = votes * 100 + (60 * iou(c, PREV[0]) * 100 if PREV[0] is not None else 0) + c[2]   # + cohérence avec l'image précédente
        if best is None or sc > best[0]: best = (sc, c, votes)
    return best[1] if (best[2] >= 2 or (PREV[0] is not None and iou(best[1], PREV[0]) > .3)) else None
rows = []; i = 0
while True:
    ok, fr = cap.read()
    if not ok: break
    if i % step == 0:
        im = cv2.resize(fr, (360, 640)); g = cv2.equalizeHist(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)); b = detect(g); PREV[0] = b if b is not None else PREV[0]
        rows.append({'t': round(i / fps, 2), 'face': [int(v * 3) for v in b] if b is not None else None})
    i += 1
# trous courts (<= 0,75 s) : on garde la boîte voisine la plus proche, le visage n'a pas disparu
for k, r in enumerate(rows):
    if r['face'] is None:
        L = next((rows[j] for j in range(k - 1, max(-1, k - 4), -1) if rows[j]['face']), None); Rr = next((rows[j] for j in range(k + 1, min(len(rows), k + 4)) if rows[j]['face']), None)
        if L and Rr: r['face'] = [int((L['face'][q] + Rr['face'][q]) / 2) for q in range(4)]; r['interp'] = True
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
# 'nodet' : visage introuvable (gros plan réel : le visage remplit l'écran jusqu'à ~1560 px).
# Séries d'au moins 3 mesures sans visage, regroupées si elles sont séparées de moins de 0,6 s.
runs = []; cur = []
for r in rows:
    if not r['face']: cur.append(r['t'])
    else:
        if len(cur) >= 3: runs.append([cur[0], cur[-1]])
        cur = []
if len(cur) >= 3: runs.append([cur[0], cur[-1]])
nodet = []
for a_, b_ in runs:
    if nodet and a_ - nodet[-1][1] <= .6: nodet[-1][1] = b_
    else: nodet.append([a_, b_])
nodet = [[round(max(0, a_ - .35), 2), round(b_ + .45, 2)] for a_, b_ in nodet]
json.dump({'closeups': iv, 'nodet': nodet, 'faces': [[r['t']] + r['face'] for r in rows if r['face']]}, open('out/zones.json', 'w'))
print('visage introuvable (vrai gros plan) :', nodet or 'aucun')
print('gros plans (visage énorme ou non détecté) :', iv or 'aucun')
