"""Bande-son synthétisée (numpy seul) : bruitages calés sur l'animation + musique douce.
Usage : python3 audio.py sortie.wav
Les temps ci-dessous sont ceux de index.html.
"""
import sys
import numpy as np

SR = 44100
MUSIC = False  # True pour remettre la musique de fond
DUR = 10.0
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
# Scène A
add(whoosh(.55, 250, 3800), 0.18, .55, -.2)           # « ça va dépendre de toi »
for i, t in enumerate([0.3, 0.42, 0.54, 0.66, 0.78]):
    add(pop(520 + 45 * i, .1), t, .16, -.3 + i * .15)
add(whoosh(.5, 300, 4600), 1.6, .5, .2)               # « si tu es prêt à dépenser »
for i, t in enumerate([1.75, 1.85, 1.95, 2.05, 2.15]):
    add(pop(560 + 40 * i, .1), t, .14, .3 - i * .15)
add(whoosh(.7, 200, 6500), 2.55, .7, 0)              # montée avant le prix
add(sparkle(900, 7, .06), 2.55, .12, 0)
# le prix tombe : thump + cha-ching
add(thump(), 3.28, .95, 0)
add(bell(1568, 1.5), 3.30, .30, -.1)
add(bell(2093, 1.9), 3.40, .36, .1)
add(coin_rattle(), 3.38, .35, 0)
add(coin_rattle(), 3.62, .22, -.4)
add(whoosh(.5, 800, 2200), 4.1, .35, 0)               # transition
# Scène B
add(whoosh(.55, 250, 3600), 4.55, .5, 0)
for i, t in enumerate([4.7, 4.82, 4.94, 5.06]):
    add(pop(500 + 50 * i, .1), t, .15, -.3 + i * .2)
add(whoosh(.5, 300, 4200), 5.5, .45, .1)
for i, t in enumerate([5.65, 5.75, 5.85, 5.95]):
    add(pop(560 + 40 * i, .1), t, .14, .3 - i * .2)
add(bell(880, 1.4), 6.1, .22, 0)                      # « ton stress » s'allume
add(bell(1320, 1.4), 6.16, .16, 0)
for i, t in enumerate([7.0, 7.45, 7.9, 8.35]):        # 4 pastilles
    add(pop(520 * 1.26 ** i, .2), t + .12, .4, -.6 + i * .4)
    add(bell(784 * 1.26 ** i, .7), t + .12, .12, -.6 + i * .4)
add(sparkle(1200, 8, .05), 8.9, .12, 0)

# ---------------- musique ----------------
t = np.arange(N) / SR
bpm = 96
beat = 60 / bpm
chords = [(130.81, 196.0, 261.63, 329.63),   # C
          (110.0, 164.81, 220.0, 261.63),    # Am
          (87.31, 130.81, 174.61, 261.63),   # F
          (98.0, 146.83, 196.0, 293.66)]     # G
bar = beat * 4
pad = np.zeros(N)
for k in range(int(DUR / bar) + 1):
    ch = chords[k % 4]
    s, e = int(k * bar * SR), min(N, int((k + 1) * bar * SR + 0.6 * SR))
    tt = t[s:e] - k * bar
    seg = np.zeros(e - s)
    for f in ch:
        seg += np.sin(2 * np.pi * f * tt) + .5 * np.sin(2 * np.pi * f * 1.003 * tt + 1) + .2 * np.sin(2 * np.pi * f * 2 * tt)
    a = np.minimum(1, tt / .5) * np.minimum(1, (bar + .6 - tt) / .6)
    pad[s:e] += seg * a
pad /= np.abs(pad).max()
# arpège pluck pentatonique
pent = [523.25, 587.33, 659.25, 783.99, 880.0]
arp = np.zeros(N)
seq = [0, 2, 4, 2, 1, 3, 4, 3]
for i in range(int(DUR / (beat / 2))):
    tt0 = i * beat / 2
    if tt0 < 0.4:
        continue
    f = pent[seq[i % len(seq)]] * (1 if (i // 8) % 2 == 0 else .75)
    m = int(0.5 * SR)
    tt = np.arange(m) / SR
    pl = (np.sin(2 * np.pi * f * tt) + .3 * np.sin(2 * np.pi * f * 2 * tt)) * np.exp(-tt / .16) * np.minimum(1, tt / .003)
    s = int(tt0 * SR)
    arp[s:s + m] += pl[: N - s]
arp /= np.abs(arp).max()
# douce pulsation grave
kick = np.zeros(N)
for i in range(int(DUR / beat)):
    tt0 = i * beat
    if tt0 < 3.2:
        continue
    m = int(.35 * SR)
    tt = np.arange(m) / SR
    fr = 45 + 60 * np.exp(-tt * 30)
    y = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-tt / .1)
    s = int(tt0 * SR)
    kick[s:s + m] += y[: N - s]
musenv = np.minimum(1, t / 1.2) * np.where(t > DUR - 1.0, np.clip((DUR - t) / 1.0, 0, 1), 1)
duck = 1 - .35 * np.exp(-np.clip(t - 3.28, 0, None) * 4) * (t > 3.28) * (t < 4.3)
music = (pad * .22 + arp * .14 + kick * .18 * (t > 3.2)) * musenv * duck
if MUSIC:
    L += music
    R += np.roll(music, 380) * .98   # léger effet stéréo

# ---------------- masterisation ----------------
out = np.stack([L, R], 1)
out = np.tanh(out * 1.1)
out /= max(1e-9, np.abs(out).max()) / 0.89
import wave
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32767).astype('<i2').tobytes())
print('ok', sys.argv[1])
