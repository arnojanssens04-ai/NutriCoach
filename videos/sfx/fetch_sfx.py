"""Télécharge des sons du SFX Kit (Wyzowl, licence CC0) dans videos/sfx/kit/sounds/ et vérifie leur somme de contrôle.
Usage : python3 fetch_sfx.py roles          -> tous les sons utilisés par roles.json
        python3 fetch_sfx.py id1 id2 ...    -> des sons précis
        python3 fetch_sfx.py all            -> les 320 sons (67 Mo)
Sources : GitHub raw (wyzowl/sfx-kit) puis, en secours, Hugging Face (datasets/wyzowl/sfx-kit)."""
import hashlib, json, os, sys, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__)); KIT = os.path.join(HERE, 'kit')
S = {s['id']: s for s in json.load(open(os.path.join(KIT, 'sounds.json')))['sounds']}
BASES = ['https://raw.githubusercontent.com/wyzowl/sfx-kit/main/', 'https://huggingface.co/datasets/wyzowl/sfx-kit/resolve/main/']
def get(sid):
    s = S[sid]; dst = os.path.join(KIT, s['file'])
    if os.path.exists(dst) and hashlib.sha256(open(dst, 'rb').read()).hexdigest() == s['sha256']: return 'déjà là'
    os.makedirs(os.path.dirname(dst), exist_ok=True); err = None
    for b in BASES:
        try:
            data = urllib.request.urlopen(b + s['file'], timeout=60).read()
            if hashlib.sha256(data).hexdigest() != s['sha256']: err = 'somme de contrôle différente'; continue
            open(dst, 'wb').write(data); return 'ok (%s)' % b.split('/')[2]
        except Exception as e: err = str(e)
    return 'ÉCHEC : %s' % err
if __name__ == '__main__':
    a = sys.argv[1:]
    if a == ['roles']: ids = sorted(set(v if isinstance(v, str) else v['sound'] for v in json.load(open(os.path.join(HERE, 'roles.json')))['roles'].values()))
    elif a == ['all']: ids = list(S)
    else: ids = a
    bad = 0
    for i in ids:
        r = get(i); print('%-34s %s' % (i, r)); bad += r.startswith('ÉCHEC')
    sys.exit(1 if bad else 0)
