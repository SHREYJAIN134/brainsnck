"""Map caption timings from the Kokoro reference narration onto a new narration of the same script
(DTW over MFCCs), then snap boundaries to real pauses in the new audio.
usage: python3 align.py ref.wav ref_timings.js new_audio out_timings.js
"""
import json, sys
import numpy as np
import librosa

ref_wav, ref_tl, new_audio, out_js = sys.argv[1:5]
SR, HOP = 16000, 160  # 10 ms frames


def feats(path):
    y, _ = librosa.load(path, sr=SR)
    m = librosa.feature.mfcc(y=y, sr=SR, n_mfcc=20, hop_length=HOP, n_fft=512)[1:]
    m = (m - m.mean(1, keepdims=True)) / (m.std(1, keepdims=True) + 1e-6)
    return y, m


TL = json.loads(open(ref_tl).read().split('=', 1)[1].strip().rstrip(';'))
yr, A = feats(ref_wav)
yn, B = feats(new_audio)
D, wp = librosa.sequence.dtw(X=A, Y=B, metric='cosine', step_sizes_sigma=np.array([[1, 1], [0, 1], [1, 0], [1, 2], [2, 1]]),
                             weights_add=np.array([0, 0, 0, 0, 0]), weights_mul=np.array([1, 1, 1, 2, 2]))
wp = wp[::-1]
ref_t = wp[:, 0] * HOP / SR
new_t = wp[:, 1] * HOP / SR


def mapt(t):
    i = np.searchsorted(ref_t, t)
    i = min(max(i, 0), len(ref_t) - 1)
    # median of the new times for the matching reference frame
    same = new_t[ref_t == ref_t[i]]
    return float(np.median(same))


# pauses in the new audio
iv = librosa.effects.split(yn, top_db=32, frame_length=512, hop_length=128)
gaps = [((iv[i][1] + iv[i + 1][0]) / 2 / SR, (iv[i + 1][0] - iv[i][1]) / SR) for i in range(len(iv) - 1)]
gaps = [(m, g) for m, g in gaps if g >= 0.12]
speech_start, speech_end = iv[0][0] / SR, iv[-1][1] / SR

out_chunks = []
for c in TL['chunks']:
    out_chunks.append(dict(c, s=round(mapt(c['s']), 3), e=round(mapt(c['e']), 3)))
# snap each chunk start to the nearest pause within 0.45 s (not for the very first)
used = set()
for k, c in enumerate(out_chunks):
    if k == 0:
        c['s'] = round(max(0.0, speech_start - 0.02), 3); continue
    best = None
    for gi, (m, g) in enumerate(gaps):
        if gi in used: continue
        d = abs(m - c['s'])
        if d < 0.45 and (best is None or d < best[0]): best = (d, gi, m)
    if best:
        used.add(best[1]); c['s'] = round(best[2], 3)
# keep order and contiguity
for a, b in zip(out_chunks, out_chunks[1:]):
    if b['s'] <= a['s'] + 0.25: b['s'] = round(a['s'] + 0.25, 3)
    a['e'] = b['s'] if b['s'] - a['e'] < 0.9 else a['e']
out_chunks[-1]['e'] = round(speech_end + 0.1, 3)
lines = []
for l in TL['lines']:
    cs = [c for c in out_chunks if c['line'] == l['i']]
    lines.append({'i': l['i'], 's': cs[0]['s'], 'e': cs[-1]['e']})
dur = round(len(yn) / SR, 3)
open(out_js, 'w').write('window.TL = ' + json.dumps({'lines': lines, 'chunks': out_chunks, 'dur': dur}, ensure_ascii=False) + ';\n')
for c in out_chunks:
    print(f"{c['s']:6.2f} {c['e']:6.2f}  {c['text']}")
print('dur', dur, 'snapped', len(used), 'of', len(out_chunks) - 1)
