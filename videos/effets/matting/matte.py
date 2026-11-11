"""Détourage de la personne (MODNet, Apache-2.0, via onnxruntime) : crée un masque alpha pour mettre du texte DERRIÈRE la personne.
Usage : python3 matte.py image.jpg masque.png          (une image)
        python3 matte.py --video in.mp4 dossier_masques/ [--every 1]   (une image par masque, nommée m%05d.png)
Le modèle est téléchargé une fois : Hugging Face Xenova/modnet (onnx/model.onnx)."""
import os, sys, time, urllib.request
import numpy as np, cv2, onnxruntime as ort
HERE = os.path.dirname(os.path.abspath(__file__)); MODEL = os.path.join(HERE, 'model.onnx')
if not os.path.exists(MODEL): urllib.request.urlretrieve('https://huggingface.co/Xenova/modnet/resolve/main/onnx/model.onnx', MODEL)
sess = ort.InferenceSession(MODEL, providers=['CPUExecutionProvider']); IN = sess.get_inputs()[0].name
def matte(bgr, ref=512):
    h, w = bgr.shape[:2]; s = ref / min(h, w); nh, nw = int(round(h * s / 32) * 32), int(round(w * s / 32) * 32)
    x = cv2.resize(bgr, (nw, nh), interpolation=cv2.INTER_AREA)[..., ::-1].astype(np.float32) / 255; x = (x - .5) / .5
    m = sess.run(None, {IN: x.transpose(2, 0, 1)[None]})[0][0, 0]
    return cv2.resize(np.clip(m, 0, 1), (w, h), interpolation=cv2.INTER_CUBIC)
if __name__ == '__main__':
    if sys.argv[1] == '--video':
        cap = cv2.VideoCapture(sys.argv[2]); out = sys.argv[3]; os.makedirs(out, exist_ok=True); i = 0; t0 = time.time(); prev = None
        while True:
            ok, fr = cap.read()
            if not ok: break
            m = matte(fr); m = m if prev is None else .6 * m + .4 * prev; prev = m          # lissage temporel léger (anti-scintillement)
            cv2.imwrite(os.path.join(out, 'm%05d.png' % i), (m * 255).astype(np.uint8)); i += 1
        print(i, 'masques en %.0f s' % (time.time() - t0))
    else:
        t0 = time.time(); m = matte(cv2.imread(sys.argv[1])); cv2.imwrite(sys.argv[2], (m * 255).astype(np.uint8)); print('masque en %.1f s' % (time.time() - t0))
