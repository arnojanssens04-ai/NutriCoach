"""Bruitages synthétisés (numpy seul) à partir de out/layout.json (événements calés sur les mots).
Usage : python3 audio.py out/layout.json out/
Sorties : sfx_all.wav (tout), sfx_vis.wav (visuels), sfx_subs.wav (sous-titres). Pas de musique.
Même gain maître pour les trois : pic du mix complet à -1 dB.
"""
import json, sys, wave
import numpy as np

SR = 44100
L = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
N = int(SR * (L['total'] + .5))
rng = np.random.default_rng(11)


def lowpass(x, cut):
    y = np.zeros_like(x); acc = 0.0
    a = 1 - np.exp(-2 * np.pi * cut / SR)
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc); y[i] = acc
    return y


def whoosh(dur=.5, f0=300, f1=3500, **_):
    n = int(dur * SR); t = np.linspace(0, 1, n)
    y = lowpass(rng.standard_normal(n), f0 * (f1 / f0) ** (np.sin(t * np.pi / 2)))
    y = y - lowpass(y, f0 * (f1 / f0) ** (np.sin(t * np.pi / 2)) * .25)
    y *= np.sin(np.pi * t) ** 1.6
    return y / (np.abs(y).max() + 1e-9)


def pop(f=700, dur=.16, **_):
    n = int(dur * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * np.cumsum(f * np.exp(-t * 18) + f * .35) / SR) * np.exp(-t * 28)
    y[:60] += rng.standard_normal(60) * .25 * np.linspace(1, 0, 60)
    return y


def stamp(**_):
    n = int(.7 * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * np.cumsum(48 + 110 * np.exp(-t * 16)) / SR) * np.exp(-t * 6.5)
    y[:300] += rng.standard_normal(300) * .35 * np.linspace(1, 0, 300)
    return y


def bell(f=1318, dur=1.5, **_):
    n = int(dur * SR); t = np.arange(n) / SR; y = np.zeros(n)
    for m, a, d in [(1, 1, .9), (2.01, .45, .5), (3.02, .25, .3), (4.1, .12, .2), (5.43, .08, .12)]:
        y += a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / d)
    return y * np.minimum(1, t / .002)


def sparkle(f0=1500, n=6, gap=.055, **_):
    y = np.zeros(int((n * gap + .5) * SR))
    for k in range(n):
        b = bell(f0 * 1.25 ** k, .45) * .5; i = int(k * gap * SR); y[i:i + len(b)] += b[:len(y) - i]
    return y


def notes(fs=(784, 622), gap=.14, **_):
    y = np.zeros(int((len(fs) * gap + 1.3) * SR))
    for k, f in enumerate(fs):
        b = bell(f, 1.2); i = int(k * gap * SR); y[i:i + len(b)] += b[:len(y) - i]
    return y


MAKE = dict(whoosh=whoosh, pop=pop, stamp=stamp, bell=bell, sparkle=sparkle, notes=notes)


def mix(events):
    buf = np.zeros(N)
    for e in events:
        sig = MAKE[e['type']](**{k: v for k, v in e.items() if k not in ('type', 't', 'g')}) * e.get('g', 1)
        i = max(0, int(e['t'] * SR)); sig = sig[:N - i]
        buf[i:i + len(sig)] += sig
    return buf


vis, subs = mix(L['events']['vis']), mix(L['events']['subs'])
allm = vis + subs
g = .89 / max(1e-9, np.abs(allm).max())


def save(name, x):
    x = np.clip(x * g, -1, 1)
    with wave.open(OUT + name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.stack([x, np.roll(x, 14)], 1) * 32767).astype('<i2').tobytes())
    print(name, 'pic %.1f dB' % (20 * np.log10(max(1e-9, np.abs(x).max()))))


save('sfx_all.wav', allm); save('sfx_vis.wav', vis); save('sfx_subs.wav', subs)
