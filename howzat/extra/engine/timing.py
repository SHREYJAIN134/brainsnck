"""Caption timings.
python3 timing.py estimate            -> timings.js from a reading-speed estimate (for building scenes)
python3 timing.py align voice.wav     -> timings.js fitted to the real narration (pauses + speech time)
"""
import json, os, re, sys, importlib
chunks = importlib.import_module(os.environ.get('SCRIPT', 'script')).chunks
OUT = os.environ.get('OUT', 'timings.js')

CH = chunks()


def syl(text):
    n = 0
    for w in re.findall(r"[a-zA-Z']+", text.lower()):
        w = w.replace("'", '')
        n += max(1, len(re.findall(r'[aeiou]+', w)))
    return max(1, n)


def gap_kind(i):
    """How likely a pause follows chunk i: 3 = line end, 2 = sentence end, 1 = comma, 0 = none."""
    if i == len(CH) - 1: return 3
    t = CH[i]['say'].rstrip()
    if CH[i + 1]['line'] != CH[i]['line']: return 3
    if t.endswith(('.', '?', '!', ':')): return 2
    if t.endswith(','): return 1
    return 0


W = [syl(c['say']) for c in CH]


def write(starts, ends, dur):
    out = []
    for c, s, e in zip(CH, starts, ends):
        out.append({'line': c['line'], 'text': c['text'], 's': round(s, 3), 'e': round(e, 3), **({'kw': c['kw'], 'col': c['col']} if c.get('kw') else {})})
    lines = []
    for li in sorted({c['line'] for c in out}):
        cs = [c for c in out if c['line'] == li]
        lines.append({'i': li, 's': cs[0]['s'], 'e': cs[-1]['e']})
    open(OUT, 'w').write('window.TL = ' + json.dumps({'lines': lines, 'chunks': out, 'dur': round(dur, 3)}) + ';\n')
    for c in out:
        print(f"{c['s']:6.2f} {c['e']:6.2f}  L{c['line']:<2} {c['text']}")
    print('dur', round(dur, 2))


def estimate():
    rate = float(os.environ.get('RATE', 4.5))  # syllables per second
    pause = {0: 0.0, 1: 0.18, 2: 0.42, 3: 0.6}
    t = 0.3; s, e = [], []
    for i, w in enumerate(W):
        s.append(t); t += w / rate; e.append(t); t += pause[gap_kind(i)]
    write(s, e, t + 0.2)


def align(path):
    import numpy as np, librosa
    SR = 16000
    y, _ = librosa.load(path, sr=SR)
    iv = librosa.effects.split(y, top_db=35, frame_length=1024, hop_length=160)
    # merge micro-gaps (< 90 ms) inside words
    segs = []
    for a, b in iv:
        if segs and (a - segs[-1][1]) / SR < 0.09: segs[-1][1] = b
        else: segs.append([a, b])
    segs = [(a / SR, b / SR) for a, b in segs if (b - a) / SR > 0.05]
    gaps = [(segs[k][1], segs[k + 1][0]) for k in range(len(segs) - 1)]
    speech = sum(b - a for a, b in segs)

    def at_speech(x):  # wall-clock time at which x seconds of speech have elapsed
        acc = 0.0
        for a, b in segs:
            if acc + (b - a) >= x: return a + (x - acc)
            acc += b - a
        return segs[-1][1]

    tot = sum(W); cum = np.cumsum(W)
    est_end = [at_speech(speech * c / tot) for c in cum]
    # snap chunk ends to pauses: strong boundaries first, each pause used once, order kept
    ends = list(est_end); snapped = {}
    used = set()
    for kind, win in ((3, 1.2), (2, 0.9), (1, 0.55), (0, 0.25)):
        for i in range(len(CH) - 1):
            if gap_kind(i) != kind or i in snapped: continue
            lo = max([snapped[j][0] for j in snapped if j < i], default=-1)
            hi = min([snapped[j][0] for j in snapped if j > i], default=len(gaps))
            best = None
            for gi in range(lo + 1, hi):
                if gi in used: continue
                g0, g1 = gaps[gi]; m = (g0 + g1) / 2
                d = abs(m - est_end[i])
                if d < win and (best is None or d < best[0]): best = (d, gi)
            if best:
                used.add(best[1]); snapped[i] = (best[1], gaps[best[1]])
    # build starts/ends: snapped boundaries are exact; others spread by speech time between anchors
    bounds = [(-1, segs[0][0], segs[0][0])]  # (chunk index, end-of-speech, start-of-next)
    for i in sorted(snapped): bounds.append((i, snapped[i][1][0], snapped[i][1][1]))
    bounds.append((len(CH) - 1, segs[-1][1], segs[-1][1]))
    starts = [0.0] * len(CH); endt = [0.0] * len(CH)
    for (i0, _, s0), (i1, e1, _) in zip(bounds, bounds[1:]):
        idx = list(range(i0 + 1, i1 + 1))
        if not idx: continue
        sub = [(max(a, s0), min(b, e1)) for a, b in segs if b > s0 and a < e1]
        sp = sum(b - a for a, b in sub) or (e1 - s0)

        def at(x):
            acc = 0.0
            for a, b in sub:
                if acc + (b - a) >= x: return a + (x - acc)
                acc += b - a
            return e1
        wsum = sum(W[k] for k in idx); acc = 0
        for k in idx:
            starts[k] = at(sp * acc / wsum) if acc else s0
            acc += W[k]; endt[k] = at(sp * acc / wsum)
    starts[0] = max(0.0, segs[0][0] - 0.05)
    for k in range(len(CH) - 1):  # keep caption up through short gaps
        if starts[k + 1] - endt[k] < 0.8: endt[k] = starts[k + 1]
    print('speech segments', len(segs), 'gaps', len(gaps), 'snapped', len(snapped), 'of', sum(1 for i in range(len(CH) - 1) if gap_kind(i)))
    write(starts, endt, len(y) / SR)


def align2(path):
    """Global DP: anchor chunk boundaries to pauses so speech time between anchors matches syllable counts."""
    import numpy as np, librosa
    SR = 16000
    y, _ = librosa.load(path, sr=SR)
    iv = librosa.effects.split(y, top_db=35, frame_length=1024, hop_length=160)
    segs = []
    for a, b in iv:
        if segs and (a - segs[-1][1]) / SR < 0.09: segs[-1][1] = b
        else: segs.append([a, b])
    segs = [(a / SR, b / SR) for a, b in segs if (b - a) / SR > 0.05]
    G = len(segs) - 1  # gap g lies between segs[g] and segs[g+1]
    cum = np.cumsum([0] + [b - a for a, b in segs])  # speech before seg k = cum[k]
    N = len(CH)
    Wc = np.cumsum([0] + W)
    rate = cum[-1] / Wc[-1]
    kinds = [gap_kind(i) for i in range(N)]
    miss = {3: 8.0, 2: 5.0, 1: 1.2, 0: 0.0}
    glen = [segs[g + 1][0] - segs[g][1] for g in range(G)]
    def unused_gap(g): return 3.0 if glen[g] > 0.35 else (1.2 if glen[g] > 0.2 else 0.4)
    INF = 1e18
    # node (i, g): boundary after chunk i is at gap g. start node (-1, -1), end node (N-1, G)
    best = {(-1, -1): (0.0, None)}
    order = [(i, g) for i in range(N - 1) for g in range(G)] + [(N - 1, G)]
    for (i, g) in order:
        if i < N - 1 and kinds[i] == 0 and glen[g] < 0.2:
            pass
        bc, bp = INF, None
        for (pi, pg), (pc, _) in list(best.items()):
            if pi >= i or pg >= g or i - pi > 9 or g - pg > 7: continue
            sp = cum[g + 1] - cum[pg + 1]  # speech between the two gaps
            pred = rate * (Wc[i + 1] - Wc[pi + 1])
            sig = 0.18 + 0.12 * np.sqrt(Wc[i + 1] - Wc[pi + 1])
            c = pc + ((sp - pred) / sig) ** 2
            c += sum(miss[kinds[k]] for k in range(pi + 1, i))
            c += sum(unused_gap(q) for q in range(pg + 1, g))
            if c < bc: bc, bp = c, (pi, pg)
        if bp is not None: best[(i, g)] = (bc, bp)
    node = (N - 1, G); anchors = []
    while node != (-1, -1):
        anchors.append(node); node = best[node][1]
    anchors = anchors[::-1][:-1]
    snapped = {i: (g, (segs[g][1], segs[g + 1][0])) for i, g in anchors}
    bounds = [(-1, segs[0][0], segs[0][0])]
    for i in sorted(snapped): bounds.append((i, snapped[i][1][0], snapped[i][1][1]))
    bounds.append((N - 1, segs[-1][1], segs[-1][1]))
    starts = [0.0] * N; endt = [0.0] * N
    for (i0, _, s0), (i1, e1, _) in zip(bounds, bounds[1:]):
        idx = list(range(i0 + 1, i1 + 1))
        if not idx: continue
        sub = [(max(a, s0), min(b, e1)) for a, b in segs if b > s0 and a < e1]
        spt = sum(b - a for a, b in sub) or (e1 - s0)
        def at(x):
            acc = 0.0
            for a, b in sub:
                if acc + (b - a) >= x: return a + (x - acc)
                acc += b - a
            return e1
        wsum = sum(W[k] for k in idx); acc = 0
        for k in idx:
            starts[k] = at(spt * acc / wsum) if acc else s0
            acc += W[k]; endt[k] = at(spt * acc / wsum)
    starts[0] = max(0.0, segs[0][0] - 0.05)
    for k in range(N - 1):
        if starts[k + 1] - endt[k] < 0.8: endt[k] = starts[k + 1]
    print('segments', len(segs), 'anchored', len(snapped), 'of', N - 1, 'rate', round(rate, 3))
    write(starts, endt, len(y) / SR)


if __name__ == '__main__':
    {'estimate': lambda: estimate(), 'align': lambda: align(sys.argv[2]), 'align2': lambda: align2(sys.argv[2])}[sys.argv[1]]()
