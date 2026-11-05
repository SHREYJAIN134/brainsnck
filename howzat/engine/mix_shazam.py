"""Shazam reel: mix narration + synced SFX + a soft background beat -> out/mix.wav"""
import json, sys
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 44100
TL = json.loads(open('timings.js').read().split('=', 1)[1].strip().rstrip(';'))
DUR = float(sys.argv[1])
voice, sr = sf.read('voice.wav')
assert sr == SR
rng = np.random.default_rng(11)
tt = lambda d: np.arange(int(d * SR)) / SR
LS = lambda i: TL['lines'][i]['s']
CK = lambda p: next(c['s'] for c in TL['chunks'] if c['text'].startswith(p))


def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], btype='band', fs=SR, output='sos'), x)
def lp(x, f): return sosfilt(butter(2, f, btype='low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, btype='high', fs=SR, output='sos'), x)


def whoosh(d=0.55):
    t = tt(d); n = rng.standard_normal(len(t)); k = t / d
    return (bp(n, 300, 1500) * (1 - k) + bp(n, 1500, 6000) * k) * np.sin(np.pi * k) ** 2 * 0.9
def tone(f, d, tau): t = tt(d); return np.sin(2 * np.pi * f * t) * np.exp(-t / tau)
def ding(): x = np.zeros(int(0.9 * SR)); a = tone(1046.5, 0.9, 0.22); b = tone(1568, 0.8, 0.3); x += a; o = int(0.09 * SR); x[o:o + len(b)] += b[:len(x) - o]; return x * 0.5
def chime():
    x = np.zeros(int(1.3 * SR))
    for i, f in enumerate([784, 988, 1175, 1568]):
        s = tone(f, 0.9, 0.25); o = int(i * 0.07 * SR); x[o:o + len(s)] += s
    return x * 0.35
def click(): t = tt(0.05); return np.sin(2 * np.pi * 2200 * t) * np.exp(-t / 0.008) + bp(rng.standard_normal(len(t)), 2000, 6000) * np.exp(-t / 0.004) * 0.4
def pop(): t = tt(0.09); f = 900 * np.exp(-t / 0.04) + 250; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.035)
def blip(f=1320): return tone(f, 0.07, 0.02)
def buzz():
    t = tt(0.32); x = np.sign(np.sin(2 * np.pi * 140 * t)) * 0.5 + np.sin(2 * np.pi * 70 * t)
    return lp(x, 1800) * np.minimum(1, t / 0.01) * np.exp(-t / 0.18)
def alert():
    x = np.zeros(int(0.5 * SR))
    for i, f in enumerate([880, 660]):
        s = tone(f, 0.22, 0.12) + 0.3 * tone(2 * f, 0.22, 0.08); o = int(i * 0.18 * SR); x[o:o + len(s)] += s
    return x * 0.6
def thud():
    t = tt(0.6); f = 50 + 60 * np.exp(-t / 0.08)
    return np.tanh(1.5 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22))
def msg(up=True):
    a, b = (880, 1320) if up else (1320, 990)
    x = np.zeros(int(0.25 * SR)); s1 = tone(a, 0.12, 0.05); s2 = tone(b, 0.15, 0.06); x[:len(s1)] += s1; o = int(0.07 * SR); x[o:o + len(s2)] += s2
    return x * 0.6


kS = CK('Shazam ne'); tR = kS + 0.15
t1, kN, kP = LS(1), CK('Wo gaana'), CK('PHOTO')
kT, kJ = CK('Sabse tez'), CK('ban jaate')
t3, kC = LS(3), CK('se banta')
t4, kM = LS(4), CK('milaan')
t5, kB = LS(5), CK('phir bhi'); k0, k1 = t5 + 0.35, kB - 0.25
kD = CK('DJ dost')
ev = [
    (0.0, whoosh(0.5), 0.08),
    (0.9, pop(), 0.09),
    (tR, ding(), 0.15), (tR + 0.05, chime(), 0.12), (tR + 0.2, pop(), 0.10), (tR + 0.3, pop(), 0.08),
    (t1 - 0.25, whoosh(0.6), 0.12), (t1 + 0.05, pop(), 0.10),
    (kN + 0.75, buzz(), 0.13), (kN + 0.75, pop(), 0.08), (kN + 0.85, pop(), 0.07),
    (kP - 0.1, whoosh(0.35), 0.07), (kP, click(), 0.18), (kP + 0.03, thud(), 0.10), (kP + 0.05, pop(), 0.09),
    (kT + 0.15, pop(), 0.08),
    (kJ + 0.15, chime(), 0.14), (kJ + 0.3, pop(), 0.08),
    (t3 - 0.25, whoosh(0.6), 0.12),
    (kC - 0.1, pop(), 0.08),
    (t4 - 0.15, whoosh(0.4), 0.09), (t4 + 0.05, pop(), 0.09),
    (kM, ding(), 0.12),
    (t5 - 0.25, whoosh(0.6), 0.12), (t5 + 0.2, pop(), 0.08),
    (k0 - 0.1, whoosh(0.9), 0.10),
    (k1, alert(), 0.12), (k1, thud(), 0.14),
    (kB, chime(), 0.15), (kB + 0.05, thud(), 0.12), (kB + 0.25, ding(), 0.11), (kB + 0.45, pop(), 0.08),
    (LS(6) - 0.65, whoosh(0.6), 0.12),
    (LS(6) - 0.2, msg(False), 0.12),
    (LS(6) + 0.4, msg(True), 0.12),
    (kD + 0.5, msg(False), 0.12),
    (kD + 0.9, pop(), 0.10), (kD + 0.9, ding(), 0.10),
    (TL['dur'] + 0.9, whoosh(0.6), 0.10),
]
# party noise bubbles popping in
for k in range(6):
    ev.append((0.15 + k * 0.17, pop(), 0.06))
# listening timer ticks
for k in range(5):
    ev.append((0.25 + k * 0.37, blip(1500), 0.03))
# loudest points light up, one by one
for i in range(14):
    ev.append((kT + 0.1 + i * 0.035, blip(1200 + 40 * i), 0.025))
# stars appear
for i in range(14):
    ev.append((kJ + i * 0.04, pop(), 0.035))
# star pairs joined
for k in range(8):
    ev.append((t3 + 0.05 + k * 0.1, blip(900 + 80 * k), 0.035))
# codes fly out
for k in range(8):
    ev.append((kC + k * 0.07, pop(), 0.05))
# database scanning
st = t4 + 0.1
while st < kM:
    ev.append((st, click(), 0.04)); st += 0.09
for k in range(8):
    ev.append((kM + k * 0.05, blip(1500), 0.03))
# noise wiping the codes
st = k0
while st < k1:
    ev.append((st, buzz(), 0.03)); st += 0.22

# soft beat, 96 bpm
bpm = 96; beat = 60 / bpm
n = int(DUR * SR); music = np.zeros(n)
kick = lambda: np.sin(2 * np.pi * np.cumsum(45 + 90 * np.exp(-tt(0.35) / 0.04)) / SR) * np.exp(-tt(0.35) / 0.12)
hat = lambda: hp(rng.standard_normal(int(0.05 * SR)), 7000) * np.exp(-tt(0.05) / 0.012)
clap = lambda: bp(rng.standard_normal(int(0.18 * SR)), 900, 3500) * np.exp(-tt(0.18) / 0.05)
bass_notes = [55.0, 55.0, 65.41, 49.0]  # A1 A1 C2 G1, one per bar
def place(buf, st, x, g):
    i = int(st * SR); x = x[:max(0, len(buf) - i)]; buf[i:i + len(x)] += x * g
b = 0
while b * beat < DUR:
    t0 = b * beat
    if b % 4 in (0, 2): place(music, t0, kick(), 0.9)
    if b % 4 in (1, 3): place(music, t0, clap(), 0.35)
    place(music, t0 + beat / 2, hat(), 0.25); place(music, t0, hat(), 0.12)
    if b % 4 == 0:
        f = bass_notes[(b // 4) % 4]; d = beat * 3.6; t = tt(d)
        place(music, t0, lp(np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t), 400) * np.minimum(1, t / 0.02) * np.exp(-t / 1.2), 0.5)
    b += 1
music = music / np.abs(music).max()

out = np.zeros(n)
v = voice[:n]; out[:len(v)] += v
# duck the beat under the voice
env = np.convolve(np.abs(np.pad(v, (0, n - len(v)))), np.ones(int(0.15 * SR)) / int(0.15 * SR), mode='same')
duck = 1 - 0.5 * np.clip(env / (env.max() * 0.25), 0, 1)
end_i = int((TL['dur'] + 0.9) * SR)
mg = np.full(n, 0.10); mg[end_i:] = 0.16
out += music * mg * duck
for st, x, g in ev:
    place(out, st, x, g)
fade = int(0.4 * SR); out[-fade:] *= np.linspace(1, 0, fade)
pk = np.abs(out).max()
if pk > 0.95: out *= 0.95 / pk
print('mix peak', round(float(pk), 3), 'events', len(ev))
sf.write('out/mix.wav', out, SR, subtype='PCM_16')
