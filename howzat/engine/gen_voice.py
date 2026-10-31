"""Generate narration with Kokoro (Hindi voice) line by line and write caption timings.
usage: python3 gen_voice.py <voice> <out_dir>
writes <out_dir>/voice.wav (44.1 kHz) and <out_dir>/timings.js (window.TL)
"""
import json, re, sys
import numpy as np
import librosa
import soundfile as sf
from kokoro_onnx import Kokoro
from kokoro_onnx.tokenizer import Tokenizer
from script_maps import LINES

VOICE = sys.argv[1]
OUT = sys.argv[2]
SR = 44100
LEAD = 0.30

k = Kokoro('models/kokoro-v1.0.onnx', 'models/voices-v1.0.bin')
tok = Tokenizer()


def weight(dev):
    ph = tok.phonemize(dev, lang='hi')
    w = len(re.sub(r'[ˈˌ\s.,!?…।]', '', ph))
    w += 9 * dev.count('...') + 4 * dev.count(',')  # pauses inside the line
    return max(w, 1)


audio = [np.zeros(int(LEAD * SR))]
t = LEAD
lines_out, chunks_out = [], []
for li, (speed, pause, chunks) in enumerate(LINES):
    text = ' '.join(c[1] for c in chunks)
    s, sr = k.create(text, voice=VOICE, speed=speed, lang='hi')
    s = librosa.resample(s.astype(np.float32), orig_sr=sr, target_sr=SR)
    s, _ = librosa.effects.trim(s, top_db=38)
    d = len(s) / SR
    lines_out.append({'i': li, 's': round(t, 3), 'e': round(t + d, 3)})
    ws = [weight(c[1]) for c in chunks]
    tot = sum(ws); cs = t
    for (rom, dev, kw, col), w in zip(chunks, ws):
        cd = d * w / tot
        chunks_out.append({'s': round(cs, 3), 'e': round(cs + cd, 3), 'text': rom, 'kw': kw, 'col': col, 'line': li})
        cs += cd
    audio.append(s); t += d
    audio.append(np.zeros(int(pause * SR))); t += pause

# captions stay up until the next one starts (short gaps only)
for a, b in zip(chunks_out, chunks_out[1:]):
    if b['s'] - a['e'] < 0.9:
        a['e'] = b['s']
voice = np.concatenate(audio)
voice = voice / max(1e-6, np.abs(voice).max()) * 0.9
sf.write(f'{OUT}/voice.wav', voice, SR, subtype='PCM_16')
TL = {'lines': lines_out, 'chunks': chunks_out, 'dur': round(t, 3)}
open(f'{OUT}/timings.js', 'w').write('window.TL = ' + json.dumps(TL, ensure_ascii=False) + ';\n')
for l in lines_out:
    print(l['i'], l['s'], l['e'], ' '.join(c['text'] for c in chunks_out if c['line'] == l['i']))
print('total', round(t, 2))
