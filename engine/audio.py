"""Original, synthesized music bed and sound effects for BrainSnck reels (no samples, no copyright)."""
import numpy as np
from scipy import signal

SR = 44100
rng = np.random.default_rng(7)


def _t(d):
    return np.arange(int(d * SR)) / SR


def _bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band')
    return signal.lfilter(b, a, x)


def _lp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), 'low')
    return signal.lfilter(b, a, x)


def _hp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), 'high')
    return signal.lfilter(b, a, x)


# ---------------- drums ----------------
def kick():
    t = _t(.4)
    f = 44 + 90 * np.exp(-t * 28)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8)
    click = _hp(rng.standard_normal(len(t)), 2000) * np.exp(-t * 400) * .25
    return np.tanh((x + click) * 1.6) * .8


def clap():
    t = _t(.3)
    n = rng.standard_normal(len(t))
    env = np.exp(-t * 26)
    for d in (.0, .012, .024):  # three quick hits sound like a clap
        env += np.where(t >= d, np.exp(-(t - d) * 160), 0) * .6
    return _bp(n, 900, 3200) * env * .32


def hat(open_=False):
    t = _t(.18 if open_ else .06)
    return _hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * (18 if open_ else 70)) * .16


# ---------------- tonal ----------------
def saw_pad(freqs, dur):
    t = _t(dur)
    x = np.zeros_like(t)
    for f in freqs:
        for det in (-.004, 0, .004):
            ff = f * (1 + det)
            for k in range(1, 9):
                x += np.sin(2 * np.pi * ff * k * t + k) / k
    x = _lp(x, 1400)
    att, rel = .25, .35
    env = np.minimum(1, t / att) * np.minimum(1, (dur - t) / rel).clip(0, 1)
    return x * env * .018


def bass(f, dur):
    t = _t(dur)
    x = np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * 2 * f * t)
    env = np.minimum(1, t / .01) * np.exp(-t * 1.6) * np.minimum(1, (dur - t) / .05).clip(0, 1)
    return np.tanh(x * 1.4) * env * .3


def pluck(f, dur=.35):
    t = _t(dur)
    x = sum(np.sin(2 * np.pi * f * k * t) / k ** 1.4 for k in range(1, 6))
    return x * np.exp(-t * 9) * .08


def music(total, bpm=100):
    """Am-F-C-G loop with kick/clap/hat, bass, pad and a plucked arp."""
    n = int(total * SR) + SR
    out = np.zeros(n)
    beat = 60 / bpm
    bar = beat * 4
    chords = [([220.0, 261.63, 329.63], 110.0), ([174.61, 220.0, 261.63], 87.31),
              ([261.63, 329.63, 392.0], 130.81), ([196.0, 246.94, 293.66], 98.0)]

    def add(x, at, g=1.0):
        i = int(at * SR)
        if i >= n:
            return
        x = x[: n - i]
        out[i:i + len(x)] += x * g

    t, k = 0.0, 0
    while t < total:
        ch, root = chords[k % 4]
        add(saw_pad(ch, bar + .3), t)
        for b in range(4):
            bt = t + b * beat
            add(bass(root, beat * .9), bt)
            if b in (0, 2) or (b == 3 and k % 2 == 1):
                add(kick(), bt)
            if b in (1, 3):
                add(clap(), bt)
            add(hat(), bt + beat / 2)
            add(hat(open_=(b == 3)), bt + beat * .75, .7)
            arp = ch[(b + k) % 3] * 2
            add(pluck(arp), bt + beat / 2)
        t += bar
        k += 1
    out = out[: int(total * SR)]
    # filter sweep in over the first second, fade out at the end
    tt = np.arange(len(out)) / SR
    intro = np.clip(tt / 1.0, 0, 1)
    out = _lp(out, 9000) * (0.35 + 0.65 * intro)
    fade = np.clip((total - tt) / 1.4, 0, 1)
    return out * fade


# ---------------- sound effects ----------------
def whoosh(d=.5):
    t = _t(d)
    n = rng.standard_normal(len(t))
    lo = _bp(n, 300, 1200)
    hi = _bp(n, 1500, 6000)
    k = t / d
    env = np.sin(np.pi * k) ** 2
    return (lo * (1 - k) + hi * k) * env * .55


def pop():
    t = _t(.12)
    f = 380 + 900 * (1 - np.exp(-t * 40))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35) * .5


def tick():
    t = _t(.03)
    return np.sin(2 * np.pi * 2300 * t) * np.exp(-t * 180) * .28


def ding():
    t = _t(1.2)
    x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * dcy) for f, a, dcy in
            [(1318.5, .5, 3.5), (1975.5, .25, 5), (2637, .15, 7), (659.25, .2, 3)])
    return x * .45


def impact():
    t = _t(.9)
    f = 38 + 60 * np.exp(-t * 12)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4.5)
    crack = _bp(rng.standard_normal(len(t)), 200, 5000) * np.exp(-t * 22) * .5
    return np.tanh((boom + crack) * 1.5) * .6


def riser(d):
    t = _t(d)
    f = 300 + 900 * (t / d) ** 2
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * .35 + _bp(rng.standard_normal(len(t)), 2000, 8000) * .25
    return x * (t / d) ** 1.5 * .35


def click():
    t = _t(.05)
    return (_hp(rng.standard_normal(len(t)), 1500) * .6 + np.sin(2 * np.pi * 900 * t)) * np.exp(-t * 120) * .5


def sparkle():
    t = _t(1.0)
    x = np.zeros_like(t)
    for i in range(9):
        st = i * .06
        f = 1800 + rng.random() * 2600
        x += np.where(t >= st, np.sin(2 * np.pi * f * (t - st)) * np.exp(-(t - st) * 14), 0) * .12
    return x


SFX = {'whoosh': whoosh, 'pop': pop, 'tick': tick, 'ding': ding, 'impact': impact,
       'click': click, 'sparkle': sparkle}


def render_sfx(events, total):
    out = np.zeros(int(total * SR) + SR)
    for ev in events:
        name, at, g = ev[0], ev[1], (ev[2] if len(ev) > 2 else 1.0)
        x = riser(ev[3]) if name == 'riser' else SFX[name]()
        i = max(0, int(at * SR))
        x = x[: len(out) - i]
        out[i:i + len(x)] += x * g
    return out[: int(total * SR)]
