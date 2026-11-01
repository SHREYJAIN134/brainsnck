"""Squat reel: narration + synced SFX + soft ambient beat -> out/mix.wav   usage: python3 mix.py <duration>"""
import json, sys
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 44100
TL = json.loads(open('timings3.js').read().split('=', 1)[1].strip().rstrip(';'))
DUR = float(sys.argv[1])
voice, sr = sf.read('voice3.wav')
assert sr == SR
rng = np.random.default_rng(7)
tt = lambda d: np.arange(int(d * SR)) / SR
LS = lambda i: TL['lines'][i]['s']
CK = lambda p: next(c['s'] for c in TL['chunks'] if c['text'].startswith(p))


def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], btype='band', fs=SR, output='sos'), x)
def lp(x, f): return sosfilt(butter(2, f, btype='low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, btype='high', fs=SR, output='sos'), x)
def whoosh(d=0.5):
    t = tt(d); n = rng.standard_normal(len(t)); k = t / d
    return (bp(n, 250, 1200) * (1 - k) + bp(n, 1200, 5000) * k) * np.sin(np.pi * k) ** 2 * 0.8
def tone(f, d, tau): t = tt(d); return np.sin(2 * np.pi * f * t) * np.exp(-t / tau)
def pop(): t = tt(0.09); f = 800 * np.exp(-t / 0.04) + 220; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.035)
def tick(f=1800): t = tt(0.04); return np.sin(2 * np.pi * f * t) * np.exp(-t / 0.006)
def ding():
    x = np.zeros(int(1.0 * SR)); a = tone(880, 1.0, 0.3); b = tone(1318.5, 0.9, 0.35); x += a; o = int(0.08 * SR); x[o:o + len(b)] += b[:len(x) - o]
    return x * 0.5
def rise(d=0.7):  # bar growing
    t = tt(d); f = 300 + 500 * (t / d) ** 1.5
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) ** 2 * 0.35
def thud():
    t = tt(0.5); f = 48 + 50 * np.exp(-t / 0.07)
    return np.tanh(1.4 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2))
def place(buf, st, x, g):
    i = int(max(0, st) * SR); x = x[:max(0, len(buf) - i)]; buf[i:i + len(x)] += x * g


END = TL['chunks'][-1]['e'] + 0.5
ev = [(0.0, whoosh(0.5), 0.08), (CK('Muscle gym') + 0.55, thud(), 0.12), (CK('gym ke BAAD') - 0.05, whoosh(0.4), 0.06),
      (CK('gym ke BAAD') + 0.6, ding(), 0.12)]
for i in range(1, len(TL['lines'])): ev.append((LS(i) - 0.32, whoosh(0.55), 0.08))
ev += [(CK('fibres pe tension') + 0.25, thud(), 0.12), (CK('fibres pe tension') + 0.3, pop(), 0.10),
       (CK('Andar ke sensors') + 0.15, pop(), 0.06), (CK('Andar ke sensors') + 0.25, pop(), 0.06), (CK('Andar ke sensors') + 0.35, pop(), 0.06),
       (CK('on ho jaata'), pop(), 0.12), (CK('on ho jaata') + 0.05, ding(), 0.12),
       (CK('Teen ghante') + 0.2, rise(0.6), 0.10), (CK('double se'), ding(), 0.12),
       (CK('aur do din'), rise(0.6), 0.08), (CK('aur do din') + 0.25, rise(0.6), 0.08), (CK('aur do din') + 0.4, pop(), 0.08),
       (CK('protein jod'), pop(), 0.08), (CK('fibres mote') + 0.2, ding(), 0.12),
       (CK('1.6 gram'), pop(), 0.12), (CK('1.6 gram') + 0.75, ding(), 0.12),
       (CK('ek rep'), pop(), 0.12), (CK('ya thoda weight') + 0.1, pop(), 0.12), (CK('dono chalega'), ding(), 0.14),
       (CK('same weight'), thud(), 0.14),
       (END, whoosh(0.6), 0.10), (END + 0.4, pop(), 0.12), (END + 0.5, ding(), 0.10)]
# bell ringing ticks
st = CK('isse alarm')
for k in range(10): ev.append((st + k * 0.08, tick(2400 if k % 2 else 2000), 0.05))
# stair steps
st = CK('Har hafte')
for k in range(6): ev.append((st + k * 0.1, pop(), 0.05))
# calendar flips
st = CK('jo saal bhar')
for k in range(12): ev.append((st + k / 9, tick(1500), 0.04))

# soft ambient beat, 84 bpm, A minor pads
n = int(DUR * SR); music = np.zeros(n)
bpm = 96; beat = 60 / bpm
kick = lambda: np.sin(2 * np.pi * np.cumsum(42 + 70 * np.exp(-tt(0.35) / 0.04)) / SR) * np.exp(-tt(0.35) / 0.11)
hat = lambda: hp(rng.standard_normal(int(0.04 * SR)), 8000) * np.exp(-tt(0.04) / 0.01)
chords = [[220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 246.94, 293.66], [164.81, 207.65, 246.94]]  # Am F G E
b = 0
while b * beat < DUR:
    t0 = b * beat
    if b % 4 in (0, 2): place(music, t0, kick(), 0.6)
    place(music, t0 + beat / 2, hat(), 0.16)
    if b % 8 == 0:
        d = beat * 8.2; t = tt(d); x = np.zeros(len(t))
        for f in chords[(b // 8) % 4]:
            x += np.sin(2 * np.pi * f * t + 0.3 * np.sin(2 * np.pi * 0.2 * t)) + 0.2 * np.sin(2 * np.pi * 2 * f * t)
        env = np.minimum(1, t / 1.2) * np.minimum(1, (d - t) / 1.2)
        place(music, t0, lp(x, 1400) * env, 0.22)
        f0 = chords[(b // 8) % 4][0] / 4
        place(music, t0, lp(np.sin(2 * np.pi * f0 * t), 200) * env, 0.5)
    b += 1
music = music / np.abs(music).max()

out = np.zeros(n)
v = voice[:n]; out[:len(v)] += v
env = np.convolve(np.abs(np.pad(v, (0, n - len(v)))), np.ones(int(0.15 * SR)) / int(0.15 * SR), mode='same')
duck = 1 - 0.45 * np.clip(env / (env.max() * 0.25 + 1e-9), 0, 1)
mg = np.full(n, 0.12); mg[int(END * SR):] = 0.2
out += music * mg * duck
for st, x, g in ev: place(out, st, x, g)
fade = int(0.5 * SR); out[-fade:] *= np.linspace(1, 0, fade)
pk = np.abs(out).max()
if pk > 0.95: out *= 0.95 / pk
print('mix peak', round(float(pk), 3), 'events', len(ev))
sf.write('out/mix3.wav', out, SR, subtype='PCM_16')
