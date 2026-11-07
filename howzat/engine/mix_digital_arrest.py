"""Digital arrest reel: mix narration + synced SFX + a soft background beat -> out/mix.wav"""
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


kC, kA = CK('CBI officer'), CK('aap ARREST')
kS, k4 = CK('Is scam'), CK('4 hazaar')
kD, kP = CK('Pehle darr'), CK('tumhare parcel')
kT, kW = CK('Phir nakli'), CK('nakli warrant')
kCh, kM = CK('Chup raho'), CK('aur paise')
kSa, kN = CK('Sach'), CK('arrest nahi')
n6 = len(TL['lines']) - 1
t0 = LS(n6) - 0.4
fc = next(c for c in TL['chunks'] if c['line'] == n6 and 'follow' in c['text'].lower())
tap = max(t0 + 0.95, fc['s'] + 0.2)
ev = [
    (0.0, whoosh(0.5), 0.08), (0.05, pop(), 0.09),
    # accept the video call -> ARREST stamp
    (kC - 0.2, click(), 0.14), (kC - 0.15, pop(), 0.09),
    (kA + 0.05, alert(), 0.10), (kA + 0.25, thud(), 0.16), (kA + 0.3, pop(), 0.08), (kA + 0.45, pop(), 0.08),
    # SCAM stamp + crore counter + notes into the sack
    (LS(1) - 0.25, whoosh(0.6), 0.12), (kS + 0.25, thud(), 0.13), (kS + 0.3, pop(), 0.08),
    (k4 - 0.2, pop(), 0.09), (k4 + 0.35, pop(), 0.07), (k4 + 1.3, ding(), 0.13), (k4 + 1.32, thud(), 0.08),
    # step 1: darr, parcel me drugs
    (LS(2) - 0.25, whoosh(0.6), 0.12), (kD, pop(), 0.09), (kD + 0.25, msg(True), 0.10), (kD + 0.32, pop(), 0.08),
    (kP, thud(), 0.08), (kP + 0.35, alert(), 0.10), (kP + 0.55, thud(), 0.15), (kP + 0.6, pop(), 0.08), (kP + 0.75, pop(), 0.08),
    # step 2: nakli thana, nakli warrant
    (LS(3) - 0.25, whoosh(0.6), 0.12), (kT, pop(), 0.09), (kT + 0.8, thud(), 0.13), (kT + 0.82, pop(), 0.07),
    (kW - 0.05, whoosh(0.4), 0.10), (kW + 0.7, thud(), 0.15), (kW + 0.72, buzz(), 0.08),
    # step 3: chup raho, paise bhejo
    (LS(4) - 0.25, whoosh(0.6), 0.12), (kCh, pop(), 0.09), (kCh + 0.15, msg(False), 0.10), (kCh + 0.5, buzz(), 0.07),
    (kM - 0.05, whoosh(0.35), 0.08), (kM + 0.45, click(), 0.15), (kM + 0.47, chime(), 0.10),
    (kM + 0.75, alert(), 0.08), (kM + 0.78, pop(), 0.08),
    # sach: police video call pe arrest nahi karti
    (LS(5) - 0.25, whoosh(0.6), 0.12), (kSa + 0.1, pop(), 0.09), (kSa + 0.6, thud(), 0.12), (kSa + 0.62, buzz(), 0.08),
    (kN - 0.05, ding(), 0.14), (kN, chime(), 0.11), (kN + 0.4, pop(), 0.09), (kN + 0.55, pop(), 0.09),
    # follow ending
    (t0 - 0.25, whoosh(0.6), 0.12), (t0 + 0.1, pop(), 0.10), (t0 + 0.45, pop(), 0.09),
    (tap, click(), 0.16), (tap, ding(), 0.13), (tap + 0.25, pop(), 0.10),
    (TL['dur'] + 0.9, whoosh(0.6), 0.10),
]
# incoming call ringtone
st = 0.15
while st < kC - 0.4:
    ev.append((st, blip(1320), 0.05)); ev.append((st + 0.1, blip(990), 0.05)); st += 0.45
# crore counter ticks
for k in range(15):
    ev.append((k4 + k * 0.085, blip(900 + 60 * k), 0.025))
# notes into the sack
for k in range(10):
    ev.append((k4 + 0.55 + k * 0.13, blip(2000 + 50 * k), 0.03))
# notes flying out after SEND
for k in range(8):
    ev.append((kM + 0.5 + k * 0.08, blip(2100 + 90 * k), 0.035))

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
