"""IPL auction max-fee reel: mix narration + synced SFX + a soft background beat -> out/mix.wav"""
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


def sweep(f0, f1, d):
    t = tt(d); f = f0 + (f1 - f0) * (t / d) ** 1.5
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.08) * 0.6
def passby(d=1.8):   # car zooming past: filtered noise swelling then fading + engine hum
    t = tt(d); k = t / d; n = rng.standard_normal(len(t))
    env = np.exp(-((k - 0.62) / 0.22) ** 2)
    hum = np.sin(2 * np.pi * np.cumsum(90 + 50 * np.tanh((k - 0.62) * -6)) / SR)
    return (bp(n, 250, 2500) * 0.8 + 0.5 * lp(hum, 600)) * env


kC = CK('25 CRORE')
sold = kC + 0.85
kP, kS = CK('par player'), CK('sirf 18')
kV, kM, kSk = CK('Videshi star'), CK('mega auction'), CK('skip karte')
kMi, kJ, kSt, kN = CK('mini auction'), CK('me jackpot'), CK('Starc ko'), CK('24.75')
kR, kVi, kX = CK('Isliye rule'), CK('videshi ko'), CK('MAX 18')
kB, kBC, kW = CK('Baaki 7'), CK('BCCI ke'), CK('welfare me')
n6 = len(TL['lines']) - 1
t0 = LS(n6) - 0.4
fc = next(c for c in TL['chunks'] if c['line'] == n6 and 'follow' in c['text'].lower())
tap = max(t0 + 0.95, fc['s'] + 0.2)
stop = kJ + 0.7
ev = [
    (0.0, whoosh(0.5), 0.08), (0.02, pop(), 0.09), (0.08, pop(), 0.07),
    # gavel comes in, SOLD!
    (kC + 0.2, pop(), 0.08), (sold, thud(), 0.16), (sold, click(), 0.14), (sold + 0.02, ding(), 0.11), (sold + 0.05, pop(), 0.09),
    # contract: 25.20 struck out -> 18
    (LS(1) - 0.25, whoosh(0.6), 0.12), (kP - 0.05, pop(), 0.09), (kP + 0.1, pop(), 0.07),
    (kS - 0.05, sweep(1400, 500, 0.25), 0.06), (kS + 0.1, pop(), 0.08), (kS + 0.2, pop(), 0.07),
    (kS + 0.35, thud(), 0.13), (kS + 0.37, buzz(), 0.06),
    # mega auction skipped
    (LS(2) - 0.25, whoosh(0.6), 0.12), (kV - 0.05, pop(), 0.09), (kV + 0.05, pop(), 0.07),
    (kSk - 0.05, whoosh(0.9), 0.08), (kSk + 0.15, thud(), 0.13), (kSk + 0.17, buzz(), 0.07), (kSk + 0.2, pop(), 0.08),
    # mini auction -> slot machine JACKPOT -> 24.75 crore
    (LS(3) - 0.25, whoosh(0.6), 0.12), (kMi - 0.1, pop(), 0.09), (kMi + 0.1, pop(), 0.07),
    (kJ + 0.05, pop(), 0.08), (kJ - 0.15, click(), 0.12),
    (stop - 0.18, pop(), 0.07), (stop - 0.06, pop(), 0.07), (stop + 0.06, pop(), 0.07),
    (stop, chime(), 0.14), (stop + 0.05, ding(), 0.08),
    (kSt + 0.05, pop(), 0.08), (kN - 0.05, pop(), 0.09), (kN + 0.82, ding(), 0.11), (kN + 1.0, pop(), 0.07),
    # rule card, bar rises, hits the 18 cap
    (LS(4) - 0.25, whoosh(0.6), 0.12), (kR - 0.05, pop(), 0.09),
    (kR + 0.4, sweep(250, 900, max(0.4, kX + 0.2 - kR - 0.4)), 0.05),
    (kX + 0.05, pop(), 0.08), (kX + 0.1, alert(), 0.09), (kX + 0.35, thud(), 0.13), (kX + 0.37, pop(), 0.08),
    # purse -> 18 to player, 7.2 to BCCI vault, welfare
    (LS(5) - 0.25, whoosh(0.6), 0.12), (kB - 0.15, pop(), 0.09), (kB + 0.05, pop(), 0.07), (kB + 0.2, pop(), 0.07),
    (kBC - 0.05, pop(), 0.09), (kBC + 0.7, thud(), 0.11), (kBC + 0.72, ding(), 0.09),
    (kW + 0.05, pop(), 0.08), (kW + 0.1, chime(), 0.09),
    # follow ending
    (t0 - 0.25, whoosh(0.6), 0.12), (t0 + 0.1, pop(), 0.10), (t0 + 0.45, pop(), 0.09),
    (tap, click(), 0.16), (tap, ding(), 0.13), (tap + 0.25, pop(), 0.10),
    (TL['dur'] + 0.9, whoosh(0.6), 0.10),
]
# bidding war: a blip each time a paddle goes up, counter ticks
k = 0
while 0.2 + k * 0.32 < kC + 0.6:
    ev.append((0.2 + k * 0.32, blip(1000 + 60 * (k % 6)), 0.035)); k += 1
# slot reels spinning
for k in range(8):
    ev.append((kJ + 0.05 + k * 0.08, blip(1600 + 90 * (k % 3)), 0.02))
# 24.75 counter ticks
for k in range(9):
    ev.append((kN + k * 0.09, blip(900 + 70 * k), 0.025))
# notes flying into the vault
for k in range(7):
    ev.append((kBC + 0.05 + k * 0.08, whoosh(0.3), 0.03))
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
