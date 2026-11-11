"""Applique les petits zooms rapides sur TA vidéo, pose les calques (visuels + sous-titres) et garde l'audio d'origine.
Usage : python3 zoom_render.py out/sur_ta_video_haute_qualite.mp4        (vidéo finale, CRF 12, audio copié)
        python3 zoom_render.py --still 9.2                                (image de contrôle : out/s-9.2.png, avec out/ov-9.2.png)
Les zooms viennent de out/layout.json. Le zoom ne touche QUE la vidéo : sous-titres et cartes restent fixes.
Couleurs : décodage et ré-encodage en BT.709, comme la source."""
import json, subprocess, sys, os
AUD = os.environ.get('AUDIO')   # wav voix + bruitages (sinon : audio d'origine copié tel quel)
import numpy as np, cv2
W, H, FPS = 1080, 1920, 30
SRC = 'in/src.mp4'
L = json.load(open('out/layout.json')); Z = L['zooms']; ZC = L['zoomCenter']
sm = lambda x: x * x * (3 - 2 * x)
def zoom(t):
    s = 1.0
    for z in Z:
        u = min(1, max(0, (t - z['t0']) / z['in'])); v = min(1, max(0, (t - z['t0'] - z['in'] - z['hold']) / z['out'])); s += z['amp'] * sm(u) * (1 - sm(v))
    return s
def apply(fr, s):
    if s <= 1.0005: return fr
    M = np.float32([[s, 0, ZC['x'] - s * ZC['x']], [0, s, ZC['y'] - s * ZC['y']]])
    return cv2.warpAffine(fr, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
DEC = 'scale=in_color_matrix=bt709:in_range=tv:out_range=pc:flags=accurate_rnd+full_chroma_int,format=rgb24'

if sys.argv[1] == '--still':
    t = float(sys.argv[2]); tag = sys.argv[2]
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(t), '-i', SRC, '-frames:v', '1', '-vf', DEC, '-f', 'rawvideo', '-'], capture_output=True).stdout
    fr = apply(np.frombuffer(raw, np.uint8).reshape(H, W, 3), zoom(t)).astype(np.float32)
    ov = cv2.imread(f'out/ov-{tag}.png', cv2.IMREAD_UNCHANGED).astype(np.float32)          # BGRA
    a = ov[..., 3:4] / 255; fr = fr[..., ::-1] * (1 - a) + ov[..., :3] * a                  # fr RGB -> BGR pour mélanger
    cv2.imwrite(f'out/s-{tag}.png', np.clip(fr, 0, 255).astype(np.uint8)); sys.exit(0)

OUT = sys.argv[1]
dec = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', SRC, '-vf', DEC, '-f', 'rawvideo', '-'], stdout=subprocess.PIPE)
enc = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
    '-i', 'out/calque_transparent.mov', '-i', SRC] + (['-i', AUD] if AUD else []) + [
    '-filter_complex', '[0:v]scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,format=yuv420p[b];[b][1:v]overlay=shortest=1,format=yuv420p[v]',
    '-map', '[v]', '-map', '3:a' if AUD else '2:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-profile:v', 'high',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', *(['-c:a', 'aac', '-b:a', '256k'] if AUD else ['-c:a', 'copy']), '-movflags', '+faststart', OUT], stdin=subprocess.PIPE)
n = 0
while True:
    buf = dec.stdout.read(W * H * 3)
    if len(buf) < W * H * 3: break
    fr = apply(np.frombuffer(buf, np.uint8).reshape(H, W, 3), zoom(n / FPS))
    enc.stdin.write(np.ascontiguousarray(fr).tobytes()); n += 1
enc.stdin.close(); enc.wait(); print('ok', OUT, n, 'images')
