"""Bruitages synthétisés (numpy seul) calés sur index.html, sans musique.
Usage : python3 audio.py sortie.wav
Les temps ci-dessous sont ceux de index.html.
"""
import sys
import numpy as np

SR = 44100
DUR = 4.5
N = int(SR * DUR)
rng = np.random.default_rng(7)
L = np.zeros(N)
R = np.zeros(N)


def add(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    sig = sig[: max(0, N - i)]
    if i < 0 or not len(sig):
        return
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(sig)] += sig * gain * l * 1.41
    R[i:i + len(sig)] += sig * gain * r * 1.41


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


def lowpass(x, cut):
    """filtre passe-bas à une pôle, fréquence de coupure variable (tableau)"""
    y = np.zeros_like(x)
    acc = 0.0
    a = 1 - np.exp(-2 * np.pi * cut / SR)
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def whoosh(dur=0.55, f0=300, f1=4200):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    noise = rng.standard_normal(n)
    cut = f0 * (f1 / f0) ** (np.sin(t * np.pi / 2))
    y = lowpass(noise, cut)
    y = y - lowpass(y, cut * 0.25)  # passe-bande grossier
    e = np.sin(np.pi * t) ** 1.6
    y *= e
    return y / (np.abs(y).max() + 1e-9)


def pop(f=700, dur=0.16):
    n = int(dur * SR)
    t = np.arange(n) / SR
    fr = f * np.exp(-t * 18) + f * 0.35
    ph = 2 * np.pi * np.cumsum(fr) / SR
    y = np.sin(ph) * np.exp(-t * 28)
    y[:60] += rng.standard_normal(60) * 0.25 * np.linspace(1, 0, 60)
    return y


def thump():
    n = int(0.7 * SR)
    t = np.arange(n) / SR
    fr = 48 + 110 * np.exp(-t * 16)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    y = np.sin(ph) * np.exp(-t * 6.5)
    y[:300] += rng.standard_normal(300) * 0.35 * np.linspace(1, 0, 300)
    return y


def bell(f, dur=1.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for m, a, d in [(1, 1, .9), (2.01, .45, .5), (3.02, .25, .3), (4.1, .12, .2), (5.43, .08, .12)]:
        y += a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / d)
    y *= np.minimum(1, t / 0.002)
    return y


def coin_rattle(dur=0.6):
    n = int(dur * SR)
    y = np.zeros(n)
    for k in range(9):
        i = int((k * 0.045 + rng.random() * 0.02) * SR)
        f = 3800 + rng.random() * 2600
        m = int(0.07 * SR)
        t = np.arange(m) / SR
        y[i:i + m] += (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 1.52 * t)) * np.exp(-t / 0.018) * (1 - k / 12) * .5
    return y[:n]


def sparkle(f0=1500, steps=6, gap=0.055):
    y = np.zeros(int((steps * gap + 0.5) * SR))
    for k in range(steps):
        b = bell(f0 * (1.25 ** k) / 1.0, .45) * .5
        i = int(k * gap * SR)
        y[i:i + len(b)] += b[: len(y) - i]
    return y


# ---------------- bruitages ----------------
add(whoosh(.5, 250, 4200), .08, .55, 0)
add(thump(), .5, .8, 0); add(bell(1318, 1.2), .52, .2, -.1); add(bell(1760, 1.4), .6, .22, .1)
add(sparkle(1100, 6, .05), .62, .1, 0)
add(pop(900, .2), .7, .35, -.3); add(bell(1568, .6), .7, .1, -.3)
add(whoosh(.5, 300, 4300), .82, .5, .2)
for i, t in enumerate([1.0, 1.1, 1.2, 1.3, 1.4]): add(pop(520 + 45 * i, .1), t, .15, -.3 + i * .15)
add(pop(700, .25), 2.05, .4, .3)
for i, f in enumerate([988, 784, 659]): add(bell(f, 1.2), 2.05 + i * .12, .13, .3 - i * .2)
add(whoosh(.45, 800, 2400), 4.0, .35, 0)

# ---------------- masterisation ----------------
out = np.stack([L, R], 1)
out = np.tanh(out * 1.1)
out /= max(1e-9, np.abs(out).max()) / 0.89
import wave
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32767).astype('<i2').tobytes())
print('ok', sys.argv[1])
