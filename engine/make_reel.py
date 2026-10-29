"""BrainSnck reel maker: script JSON  ->  1080x1920 MP4 (voice, captions, motion graphics, music, SFX).

usage: python3 make_reel.py script.json out.mp4 [--preview]
"""
import json, math, os, re, shutil, subprocess, sys, time, urllib.parse, urllib.request, wave
import numpy as np
from scipy.signal import resample_poly

import audio

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, '..', 'cache', 'icons')
FPS = 30
SR = audio.SR

THEMES = {  # background palette (deep, mid, light) + accent
    'ocean':   (['#03162E', '#0B4F8A', '#0FA3B1'], '#38E1FF'),
    'space':   (['#07051A', '#2A1B5E', '#5B2A86'], '#B388FF'),
    'tech':    (['#050B18', '#0D2A4A', '#123E6B'], '#00E5A8'),
    'bio':     (['#14061F', '#4A1250', '#B0306A'], '#FF7AB6'),
    'nature':  (['#06190F', '#14532D', '#3F8F3A'], '#B6F36B'),
    'history': (['#1A1006', '#5C3A12', '#A0682A'], '#FFC66B'),
    'bokeh':   (['#0B0B1E', '#262A6B', '#5A4FCF'], '#7CF5FF'),
}
PRON = {'brainsnck': 'Brain Snack', '@brainsnck': 'Brain Snack'}  # how the voice should say tricky words


# ---------------- icons ----------------
_index = None


def resolve_icon(name):
    """Find a Fluent 3D illustration by name and cache it locally. Returns the file name."""
    global _index
    if _index is None:
        _index = [l.strip() for l in open(os.path.join(HERE, 'emoji_index.txt')) if l.strip()]
    key = name.lower().strip()
    folder = lambda p: p.split('/')[1].lower()
    hits = [p for p in _index if folder(p) == key] or [p for p in _index if folder(p).startswith(key)] \
        or [p for p in _index if key in folder(p)]
    if not hits:
        raise SystemExit(f'icon not found: {name}')
    path = sorted(hits, key=len)[0]
    fn = os.path.basename(path)
    os.makedirs(CACHE, exist_ok=True)
    dst = os.path.join(CACHE, fn)
    if not os.path.exists(dst):
        url = 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/' + urllib.parse.quote(path)
        with urllib.request.urlopen(url, timeout=60) as r, open(dst, 'wb') as f:
            f.write(r.read())
    return fn


# ---------------- voice ----------------
# A script picks its narrator with "voice": a name from config.json "voices" (e.g. "female" / "male"),
# or an explicit {"model": ..., "speaker": ...}. Default is the first voice in config.json.
_models = {}
VOICE = None


def voice_spec(v):
    if isinstance(v, dict):
        return v
    cfg_path = os.path.join(HERE, '..', 'config.json')
    voices = json.load(open(cfg_path)).get('voices', []) if os.path.exists(cfg_path) else []
    for item in voices:
        if v is None or item.get('name') == v:
            return item
    if v is None:
        return {'model': 'en-us-libritts-high', 'speaker': 108}
    raise SystemExit(f'unknown voice: {v}')


def voice_model(name):
    if name not in _models:
        if name == 'kokoro':
            from kokoro_onnx import Kokoro
            vd = os.path.join(HERE, 'voices')
            _models[name] = Kokoro(os.path.join(vd, 'kokoro-v1.0.onnx'), os.path.join(vd, 'voices-v1.0.bin'))
        else:
            from piper import PiperVoice
            _models[name] = PiperVoice.load(os.path.join(HERE, 'voices', name + '.onnx'))
    return _models[name]


RENDER_LOG = []  # what the renderer actually applied, per chunk (written next to the build for checking)


def tts(text, speed=1.0, stress=None):
    """Speak one phrase. `speed` multiplies the voice's own speed. `stress` lists word positions that should carry
    stress (Kokoro only: a primary-stress mark is added to those words' phonemes). Returns float audio at SR."""
    v = VOICE or voice_spec(None)
    if v.get('engine') == 'kokoro':
        k, lang = voice_model('kokoro'), v.get('lang', 'en-us')
        applied = False
        if stress:
            import speech_plan
            ph = k.tokenizer.phonemize(text, lang)
            ph2, applied = speech_plan.stressed_phonemes(ph, len(text.split()), stress)
            if applied:
                x, sr = k.create(ph2, voice=v['voice'], speed=v.get('speed', 1.0) * speed, lang=lang, is_phonemes=True)
        if not applied:
            x, sr = k.create(text, voice=v['voice'], speed=v.get('speed', 1.0) * speed, lang=lang)
        RENDER_LOG.append({'text': text, 'speed': round(v.get('speed', 1.0) * speed, 3),
                           'stress_requested': stress or [], 'stress_applied': bool(applied)})
        return resample_poly(np.asarray(x, dtype=np.float64), 147, 80)  # 24k -> 44.1k
    from piper import SynthesisConfig
    cfg = SynthesisConfig(speaker_id=v.get('speaker'), length_scale=v.get('length_scale', 0.9) / speed,
                          noise_scale=0.6, noise_w_scale=0.75)
    chunks = [c.audio_float_array for c in voice_model(v['model']).synthesize(text, syn_config=cfg)]
    x = np.concatenate(chunks) if chunks else np.zeros(1)
    return resample_poly(x, 2, 1).astype(np.float64)  # 22.05k -> 44.1k


def voiced_span(x):
    hop = int(.01 * SR)
    rms = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x) - hop, hop)])
    on = np.where(rms > max(rms.max() * .06, 1e-4))[0]
    return (on[0] * hop / SR, (on[-1] + 1) * hop / SR) if len(on) else (0, len(x) / SR)


def syllables(w):
    w = PRON.get(w.lower().strip('.,!?;:'), w).lower()
    if ' ' in w:
        return sum(syllables(p) for p in w.split())
    digits = re.sub(r'\D', '', w)
    if digits:
        return 1.6 * len(digits) + (2 if '%' in w else 0) + .4
    core = re.sub(r'[^a-z]', '', w)
    n = len(re.findall(r'[aeiouy]+', core))
    if core.endswith('e') and n > 1 and not core.endswith('le'):
        n -= 1
    return max(1, n)


def speak_text(sentence):
    out = []
    for w in sentence.replace('*', '').split():
        k = w.lower().strip('.,!?;:')
        out.append(w.lower().replace(k, PRON[k]) if k in PRON else w)
    return ' '.join(out)


PLANNER = 'script'  # config.json "speech_planner": 'script' (use the scene's plan) | 'heuristic' | 'off'
PLAN_REPORT = []


def plan_for(text, speech=None):
    """Pick and validate the speech plan for one scene (see speech_plan.py)."""
    import speech_plan as sp
    engine = (VOICE or voice_spec(None)).get('engine', 'piper')
    if PLANNER == 'off':
        plan, source, notes = sp.neutral_plan(text), 'off', []
    elif PLANNER == 'script' and speech:
        try:
            plan, warn = sp.validate_plan(speech, text, engine)
            PLAN_REPORT.append({'say': text, 'source': 'script', 'warnings': warn})
            return plan
        except sp.PlanError as e:
            plan, source, notes = sp.heuristic_plan(text), 'heuristic (script plan rejected)', [str(e)]
    else:
        plan, source, notes = sp.heuristic_plan(text), 'heuristic', []
    plan, warn = sp.validate_plan(plan, text, engine)
    PLAN_REPORT.append({'say': text, 'source': source, 'warnings': notes + warn})
    return plan


def trim(x, pad=.03):
    a0, a1 = voiced_span(x)
    return x[max(0, int((a0 - pad) * SR)): int((a1 + pad) * SR)]


def say_scene(text, speech=None):
    """Plan, then speak one scene chunk by chunk. Returns audio and per-word timings (display words)."""
    import speech_plan as sp
    engine = (VOICE or voice_spec(None)).get('engine', 'piper')
    ops = sp.plan_to_ops(plan_for(text, speech), engine)
    parts, words, t = [], [], 0.0
    for op in ops:
        x = trim(tts(speak_text(op['tts_text']), op['speed'], op['stress']))
        if op['gain_db']:
            x = x * 10 ** (op['gain_db'] / 20)
        a0, a1 = voiced_span(x)
        disp = op['words']
        if disp:
            wts = [.35 + syllables(w['w']) for w in disp]
            gaps = [.9 if re.search(r'[,;:]$', w['w']) else 0 for w in disp]
            scale = (a1 - a0) / (sum(wts) + sum(gaps[:-1]))
            cur = t + a0
            for i, (w, wt, g) in enumerate(zip(disp, wts, gaps)):
                d = wt * scale
                clean = re.sub(r"[^\w%'?!.$×-]", '', w['w']).rstrip('.,')
                raw = w['w'].lower()
                if i == len(disp) - 1 and not re.search(r'[.,!?;:]$', raw):
                    raw += ','  # a spoken pause also ends the caption chunk
                words.append({'w': clean, 'start': round(cur, 3), 'end': round(cur + d, 3), 'em': w['em'], 'raw': raw})
                cur += d + g * scale
        parts.append(x)
        t += len(x) / SR
        if op['pause_after'] > 0:
            parts.append(np.zeros(int(op['pause_after'] * SR)))
            t += op['pause_after']
    return np.concatenate(parts), words


def chunk_captions(words, max_words=3, max_chars=17):
    chunks, cur = [], []
    for w in words:
        if cur and (len(cur) >= max_words or sum(len(c['w']) + 1 for c in cur) + len(w['w']) > max_chars):
            chunks.append(cur); cur = []
        cur.append(w)
        if re.search(r'[.,!?;:]$', w['raw']):
            chunks.append(cur); cur = []
    if cur:
        chunks.append(cur)
    out = []
    for i, c in enumerate(chunks):
        nxt = chunks[i + 1][0]['start'] if i + 1 < len(chunks) else None
        end = c[-1]['end'] + .3
        if nxt is not None and nxt - c[-1]['end'] < .7:
            end = nxt - .02
        out.append({'start': c[0]['start'], 'end': round(end, 3),
                    'words': [{k: w[k] for k in ('w', 'start', 'end', 'em')} for w in c]})
    return out


def find_word(words, key, default):
    key = key.lower()
    for w in words:
        if key in w['raw']:
            return w
    return default


# ---------------- build ----------------
def build(spec, build_dir):
    global VOICE, PLANNER
    VOICE = voice_spec(spec.get('voice'))
    cfg_path = os.path.join(HERE, '..', 'config.json')
    PLANNER = (json.load(open(cfg_path)).get('speech_planner', 'script') if os.path.exists(cfg_path) else 'script')
    PLAN_REPORT.clear(); RENDER_LOG.clear()
    print(f"voice: {VOICE.get('name', '?')} ({VOICE.get('engine', 'piper')}: {VOICE.get('voice') or VOICE.get('model')}"
          f"{'' if VOICE.get('speaker') is None else ', speaker ' + str(VOICE['speaker'])})")
    theme = spec.get('theme', 'bokeh')
    palette, accent = THEMES[theme]
    seed = sum(ord(c) for c in spec.get('title', 'x')) * 7919 + 13

    # icons
    for sc in spec['scenes']:
        for k in ('icon', 'pointer'):
            if sc.get(k):
                sc[k] = resolve_icon(sc[k])
        sc['minis'] = [resolve_icon(m) for m in sc.get('minis', [])]
        for side in ('left', 'right'):
            if side in sc:
                sc[side]['icon'] = resolve_icon(sc[side]['icon'])
        for it in sc.get('items', []):
            it['icon'] = resolve_icon(it['icon'])

    # voice + timings
    lead = .6
    pos = lead
    voice_track = []
    all_words = []
    n = 0
    for i, sc in enumerate(spec['scenes']):
        x, words = say_scene(sc['say'], sc.get('speech'))
        for w in words:
            w['start'] = round(w['start'] + pos, 3); w['end'] = round(w['end'] + pos, 3)
        sc['start'], sc['vend'], sc['words'] = pos, pos + len(x) / SR, words
        voice_track.append((pos, x))
        all_words += words
        if sc['layout'] not in ('hook', 'cta'):
            n += 1; sc['n'] = n
        pos = sc['vend'] + (.55 if i < len(spec['scenes']) - 1 else 0)
    total = spec['scenes'][-1]['vend'] + 2.0
    scs = spec['scenes']
    for i, sc in enumerate(scs):
        sc['tin'] = 0.0 if i == 0 else round(sc['start'] - .4, 3)
    for i, sc in enumerate(scs):
        sc['tout'] = scs[i + 1]['tin'] if i + 1 < len(scs) else total

    ev = [('impact', .03, .7)]
    for i, sc in enumerate(scs):
        L, tin, ws = sc['layout'], sc['tin'], sc['words']
        if i:
            ev.append(('whoosh', tin - .15, .7))
        if sc.get('n'):
            ev.append(('pop', tin + .1, .35))
        if L == 'hook':
            sc['tmain'] = .05
            ev += [('pop', .12, .5), ('sparkle', .45, .5)]
        elif L in ('counter', 'ring'):
            sc['tcount'] = sc.get('tcount', 1.1 if L == 'counter' else 1.3)
            w = find_word(ws, str(sc.get('sync', sc['value'])), ws[min(3, len(ws) - 1)])
            sc['tmain'] = round(max(tin + .65, w['start'] + .15 - sc['tcount']), 3)
            if L == 'counter':
                for k in range(1, 15):
                    ev.append(('tick', sc['tmain'] + sc['tcount'] * (1 - math.sqrt(1 - k / 15)), .8))
            else:
                ev.append(('riser', sc['tmain'], .9, sc['tcount']))
            ev.append(('ding', sc['tmain'] + sc['tcount'], .55))
            if sc.get('note_sync'):
                sc['tnote'] = find_word(ws, sc['note_sync'], ws[-1])['start']
                ev.append(('pop', sc['tnote'], .4))
        elif L == 'compare':
            sc['tmain'] = round(tin + .6, 3)
            sc['tval1'] = max(sc['tmain'] + .55, find_word(ws, sc.get('left_sync', '~'), {'start': sc['tmain'] + .8})['start'])
            sc['tval2'] = max(sc['tval1'] + .4, find_word(ws, sc.get('right_sync', '~'), {'start': sc['tval1'] + .6})['start'])
            ev += [('whoosh', sc['tmain'] - .05, .45), ('whoosh', sc['tmain'] + .1, .35), ('impact', sc['tmain'] + .45, .35),
                   ('pop', sc['tval1'], .45), ('pop', sc['tval2'], .45)]
        elif L == 'list':
            sc['tmain'] = round(tin + .6, 3)
            k = len(sc['items'])
            sc['titems'] = [find_word(ws, it.get('sync', '~'), {'start': sc['tmain'] + j * (sc['vend'] - sc['tmain']) / k})['start']
                            for j, it in enumerate(sc['items'])]
            ev += [('pop', t, .45) for t in sc['titems']]
        elif L == 'big':
            sc['tmain'] = round(tin + .5, 3)
            ev.append(('pop', sc['tmain'], .5))
        elif L == 'cta':
            sc['tmain'] = round(tin + .05, 3)
            sc['tclick'] = round(max(sc['tmain'] + 1.7, sc['vend'] - .2), 3)
            ev += [('pop', sc['tmain'] + .05, .45), ('sparkle', sc['tmain'] + .3, .5),
                   ('click', sc['tclick'], .9), ('sparkle', sc['tclick'] + .02, .9), ('ding', sc['tclick'] + .05, .4)]

    # ---- audio mix
    nS = int(total * SR)
    vo = np.zeros(nS)
    for at, x in voice_track:
        i = int(at * SR); x = x[: nS - i]; vo[i:i + len(x)] += x
    vo *= .9 / (np.abs(vo).max() + 1e-9)
    mus = audio.music(total)
    mus *= .055 / (np.sqrt(np.mean(mus ** 2)) + 1e-9)
    act = np.abs(vo)
    k = int(.08 * SR)
    act = np.convolve(act, np.ones(k) / k, 'same')
    act = np.convolve((act > .02).astype(float), np.ones(int(.25 * SR)) / int(.25 * SR), 'same')
    mus *= 1 - .5 * np.clip(act, 0, 1)
    fx = audio.render_sfx(ev, total) * .55
    mix = vo + mus + fx
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    with open(os.path.join(build_dir, 'speech_report.json'), 'w') as f:
        json.dump({'planner': PLANNER, 'voice': VOICE, 'plans': PLAN_REPORT, 'render': RENDER_LOG}, f, indent=1)
    for r in PLAN_REPORT:
        for w in r['warnings']:
            print(f"  speech plan ({r['source']}): {w}")
    wav_path = os.path.join(build_dir, 'mix.wav')
    with wave.open(wav_path, 'wb') as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(SR)
        wf.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())

    # ---- page
    for sc in scs:
        sc.pop('words', None)
    data = {'seed': seed % 2147483646 + 1, 'theme': theme, 'palette': palette, 'accent': accent,
            'em': '#FFE14D', 'series': spec.get('series', 'BrainSnck'), 'handle': spec.get('handle', '@BrainSnck'),
            'scenes': scs, 'captions': chunk_captions(all_words), 'total': round(total, 3)}
    for f in ('engine.html', 'engine.js', 'gsap.min.js'):
        shutil.copy(os.path.join(HERE, f), build_dir)
    os.replace(os.path.join(build_dir, 'engine.html'), os.path.join(build_dir, 'index.html'))
    shutil.copytree(os.path.join(HERE, 'fonts'), os.path.join(build_dir, 'fonts'), dirs_exist_ok=True)
    os.makedirs(os.path.join(build_dir, 'icons'), exist_ok=True)
    for fn in os.listdir(CACHE):
        shutil.copy(os.path.join(CACHE, fn), os.path.join(build_dir, 'icons', fn))
    with open(os.path.join(build_dir, 'data.js'), 'w') as f:
        f.write('window.REEL = ' + json.dumps(data) + ';')
    return data, wav_path


def open_page(p, build_dir):
    try:
        browser = p.chromium.launch(args=['--font-render-hinting=none'])
    except Exception:
        browser = p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',
                                    args=['--font-render-hinting=none'])
    page = browser.new_page(viewport={'width': 1080, 'height': 1920}, device_scale_factor=1)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto('file://' + os.path.join(build_dir, 'index.html'))
    page.wait_for_function('window.reelReady !== undefined')
    page.evaluate('window.reelReady')
    if errors:
        raise SystemExit('page error: ' + '; '.join(errors))
    return browser, page


def loudnorm_filter(wav_path, target=-14.0):
    """Two-pass loudness normalisation: measure the mix first, then correct it exactly (single-pass
    loudnorm can land 1-2 LU short on quieter voices)."""
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', wav_path, '-af',
                        f'loudnorm=I={target}:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True)
    try:
        m = json.loads(r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1])
        return (f"loudnorm=I={target}:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
                f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    except (ValueError, KeyError):
        return f'loudnorm=I={target}:TP=-1.5:LRA=11'


def render(build_dir, data, wav_path, out_path, stills=None):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser, page = open_page(p, build_dir)
        if stills:
            for t in stills:
                page.evaluate(f'window.seek({t})')
                page.screenshot(path=os.path.join(build_dir, f'still_{t:05.2f}.jpg'), type='jpeg', quality=88)
            browser.close()
            return
        nf = int(math.ceil(data['total'] * FPS))
        ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'mjpeg', '-i', '-',
                               '-i', wav_path, '-af', loudnorm_filter(wav_path), '-ar', str(SR), '-ac', '2',
                               '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p',
                               '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out_path],
                              stdin=subprocess.PIPE)
        t0 = time.time()
        for i in range(nf):
            page.evaluate(f'window.seek({i / FPS})')
            ff.stdin.write(page.screenshot(type='jpeg', quality=92))
            if i % 150 == 0:
                print(f'  frame {i}/{nf}  {time.time() - t0:.0f}s', flush=True)
        ff.stdin.close(); ff.wait()
        browser.close()


if __name__ == '__main__':
    spec_path, out_path = sys.argv[1], sys.argv[2]
    spec = json.load(open(spec_path))
    build_dir = os.path.abspath(os.path.splitext(out_path)[0] + '_build')
    os.makedirs(build_dir, exist_ok=True)
    data, wav = build(spec, build_dir)
    print(f'built: {data["total"]:.1f}s, {len(data["captions"])} caption chunks')
    if '--preview' in sys.argv:
        ts = [float(a) for a in sys.argv[sys.argv.index('--preview') + 1].split(',')]
        render(build_dir, data, wav, out_path, stills=ts)
    else:
        render(build_dir, data, wav, out_path)
    if spec.get('caption'):
        with open(os.path.splitext(out_path)[0] + '_caption.txt', 'w') as f:
            f.write(spec['caption'].strip() + '\n\n' + ' '.join(spec.get('hashtags', [])) + '\n')
    print('done', out_path)
