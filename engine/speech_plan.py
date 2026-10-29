"""Speech planning and prosody rendering for BrainSnck narration.

Pipeline (per scene):  say text  ->  speech plan (JSON)  ->  validate  ->  render ops  ->  TTS audio

* The plan says HOW the text should be spoken: intent, emotion, pace, which words carry emphasis (0-3) and where
  the pauses go. Normally Claude writes it while writing the script (it can reason about meaning and contrast);
  `heuristic_plan` is a restrained fallback built only from the script's own marks.
* `validate_plan` checks the JSON, makes sure the plan reproduces the exact words of `say` in order, clamps ranges
  and lists every control the chosen voice engine cannot render.
* `plan_to_ops` turns a plan into the chunks the engine actually speaks. Only controls listed in CAPS[engine]
  change the audio; everything else is reported as unsupported, never silently pretended.

What each engine can genuinely do (see CAPS):
  pause       exact silence between chunks
  rate        speaking speed per chunk (the model takes one speed per call)
  stress      add a primary-stress mark to an unstressed word's phonemes (Kokoro only; already-stressed
              content words cannot be pushed further by this model)
Emphasis 2 and 3 slow the phrase that contains them a little (3 more than 2); the phrase is never cut apart, because
a listening test (Oct 2026) preferred the plain reading every time a strong word was split off with a beat and gain.
Not controllable with these models: pitch contour/range, loudness, per-word duration inside a phrase, timbre/emotion.
Emotion is approximated only through pace and pause length.
"""
import re

EMOTIONS = {  # emotion -> (pace multiplier, pause multiplier)
    'neutral': (1.0, 1.0), 'curious': (1.0, 1.0), 'excited': (1.03, 0.9), 'amazed': (0.98, 1.15),
    'reassuring': (0.96, 1.1), 'empathetic': (0.94, 1.2), 'urgent': (1.08, 0.7), 'disappointed': (0.94, 1.2),
    'sarcastic': (0.98, 1.1), 'persuasive': (1.0, 1.0), 'playful': (1.03, 0.95), 'serious': (0.97, 1.1),
}
ENERGY = {'low': 0.97, 'moderate': 1.0, 'high': 1.03}
CAPS = {
    'kokoro': {'pause', 'rate', 'stress'},
    'piper': {'pause', 'rate'},
}
SENTENCE_GAP = {'?': .32, '!': .26, '.': .22}   # natural breath at a sentence end that has no planned pause
STRONG_SPEED, MODERATE_SPEED = .93, .96          # pace of a phrase holding emphasis 3 / 2


class PlanError(ValueError):
    """The plan cannot be used (bad structure or it changes the words)."""


def strip_marks(text):
    return ' '.join(text.replace('*', '').split())


def words(text):
    return strip_marks(text).split()


# ---------------------------------------------------------------- fallback planner
def heuristic_plan(say):
    """Restrained plan from the script's own marks only: *span* = moderate emphasis (strong if it is the payoff
    after a ' — ' beat in an exclamation), '...' = long pause, ' — ' = short beat. Everything else stays unmarked."""
    toks = say.split()
    segs, cur, in_em, pauses = [], [], False, []

    def flush(em):
        if cur:
            segs.append({'text': ' '.join(cur), 'emphasis': em, 'reason': 'marked in script' if em else 'unmarked'})
            cur.clear()

    for i, t in enumerate(toks):
        starts, ends = t.startswith('*'), bool(re.search(r'.\*[^\w]*$', t)) or t == '*'
        if starts and not in_em:
            flush(0); in_em = True
        cur.append(t.replace('*', ''))
        if in_em and ends:
            after_beat = len(segs) > 0 and segs[-1]['text'].endswith('—')
            exclaim = bool(re.search(r'!\s*$', t)) or bool(re.match(r'^[^.?!]*!', ' '.join(toks[i + 1:])))
            flush(3 if after_beat and exclaim else 2); in_em = False
        elif not in_em and (t.endswith('...') or t == '—' or re.search(r'[.!?]$', t)):
            flush(0)
    flush(2 if in_em else 0)
    for s in segs:
        if s['text'].endswith('...'):
            pauses.append({'after_text': s['text'], 'duration_ms': 420, 'reason': 'ellipsis: dramatic pause'})
        elif s['text'].endswith('—'):
            pauses.append({'after_text': s['text'], 'duration_ms': 200, 'reason': 'dash: beat before the reveal'})
    emotion = 'excited' if '!' in say else ('curious' if '?' in say else 'neutral')
    return {'text': strip_marks(say), 'intent': 'inform', 'emotion': emotion,
            'delivery': {'pace': 1.0, 'energy': 'moderate', 'pitch_style': 'natural', 'overall_style': 'conversational'},
            'segments': segs, 'pauses': pauses, 'source': 'heuristic'}


def neutral_plan(say):
    """Planner switched off: plain delivery, no emphasis, pauses only where sentences end."""
    sents = [s for s in re.split(r'(?<=[.!?])\s+', strip_marks(say)) if s]
    return {'text': strip_marks(say), 'intent': 'inform', 'emotion': 'neutral',
            'delivery': {'pace': 1.0, 'energy': 'moderate', 'pitch_style': 'natural', 'overall_style': 'neutral'},
            'segments': [{'text': s, 'emphasis': 0, 'reason': 'planner off'} for s in sents], 'pauses': [],
            'source': 'off'}


# ---------------------------------------------------------------- validation
def validate_plan(plan, say, engine='kokoro'):
    """Return (normalised plan, warnings). Raise PlanError if the plan is unusable."""
    if not isinstance(plan, dict):
        raise PlanError('plan must be a JSON object')
    segs = plan.get('segments')
    if not isinstance(segs, list) or not segs:
        raise PlanError('plan.segments must be a non-empty list')
    warn, caps = [], CAPS.get(engine, set())
    out = {'text': strip_marks(say), 'intent': str(plan.get('intent', 'inform')), 'source': plan.get('source', 'script')}

    emo = str(plan.get('emotion', 'neutral')).lower()
    if emo not in EMOTIONS:
        warn.append(f"emotion '{emo}' unknown, using neutral"); emo = 'neutral'
    out['emotion'] = emo
    d = dict(plan.get('delivery') or {})
    try:
        pace = float(d.get('pace', 1.0))
    except (TypeError, ValueError):
        warn.append('delivery.pace not a number, using 1.0'); pace = 1.0
    if not .8 <= pace <= 1.25:
        warn.append(f'delivery.pace {pace} clamped to 0.8-1.25'); pace = min(1.25, max(.8, pace))
    energy = str(d.get('energy', 'moderate')).lower()
    if energy not in ENERGY:
        warn.append(f"delivery.energy '{energy}' unknown, using moderate"); energy = 'moderate'
    if str(d.get('pitch_style', 'natural')).lower() not in ('natural', 'neutral', ''):
        warn.append(f"delivery.pitch_style '{d.get('pitch_style')}' not renderable on {engine}: pitch is not controllable")
    out['delivery'] = {'pace': pace, 'energy': energy, 'pitch_style': 'natural',
                       'overall_style': str(d.get('overall_style', 'conversational'))}

    clean = []
    for i, s in enumerate(segs):
        if not isinstance(s, dict) or not isinstance(s.get('text'), str) or not s['text'].strip():
            raise PlanError(f'segment {i} needs a non-empty "text"')
        try:
            em = int(round(float(s.get('emphasis', 0))))
        except (TypeError, ValueError):
            raise PlanError(f'segment {i} emphasis must be 0-3')
        if not 0 <= em <= 3:
            raise PlanError(f'segment {i} emphasis {em} outside 0-3')
        if str(s.get('pitch', 'neutral')).lower() not in ('neutral', 'natural', ''):
            warn.append(f"segment '{s['text']}': pitch '{s.get('pitch')}' not controllable on {engine}, ignored")
        if str(s.get('duration', 'normal')).lower() not in ('normal', ''):
            warn.append(f"segment '{s['text']}': duration '{s.get('duration')}' only applies to whole chunks; "
                        f"realised through chunk pace")
        if str(s.get('intensity', 'normal')).lower() not in ('normal', ''):
            warn.append(f"segment '{s['text']}': intensity '{s.get('intensity')}' not controllable on {engine}, ignored")
        if em and 'stress' not in caps:
            warn.append(f"segment '{s['text']}': {engine} cannot mark word stress; emphasis via pace/pauses only")
        clean.append({'text': strip_marks(s['text']), 'emphasis': em, 'reason': str(s.get('reason', '')),
                      'duration': str(s.get('duration', 'normal')).lower()})

    # text preservation: the plan must speak exactly the script's words, in order
    if ' '.join(c['text'] for c in clean).split() != words(say):
        raise PlanError('plan segments do not reproduce the exact text of "say" (words added, dropped or reordered)')
    out['segments'] = clean

    pauses, used = [], set()
    for p in plan.get('pauses') or []:
        at = strip_marks(str(p.get('after_text', '')))
        idx = next((j for j, c in enumerate(clean) if c['text'] == at and j not in used), None)
        if idx is None:
            idx = next((j for j, c in enumerate(clean) if c['text'].endswith(at) and at and j not in used), None)
        if idx is None:
            warn.append(f"pause after '{at}' is not at a segment boundary, ignored"); continue
        try:
            ms = float(p.get('duration_ms', 250))
        except (TypeError, ValueError):
            warn.append(f"pause after '{at}' has no numeric duration, ignored"); continue
        if not 0 <= ms <= 1200:
            warn.append(f"pause after '{at}' {ms}ms clamped to 0-1200"); ms = min(1200, max(0, ms))
        if idx == len(clean) - 1:
            warn.append(f"pause after the last segment '{at}' dropped (scene gap handles it)"); continue
        used.add(idx)
        pauses.append({'after': idx, 'duration_ms': ms, 'reason': str(p.get('reason', ''))})
    out['pauses'] = pauses

    n_words = len(words(say))
    n_em = sum(len(c['text'].split()) for c in clean if c['emphasis'] >= 2)
    if n_words and n_em / n_words > (.35 if n_words >= 12 else .5):
        warn.append(f'over-emphasis: {n_em}/{n_words} words at emphasis >= 2; most words should stay unmarked')
    if sum(1 for c in clean if c['emphasis'] == 3) > 2:
        warn.append('more than two strong (3) emphases in one scene; delivery will feel theatrical')
    return out, warn


# ---------------------------------------------------------------- rendering
def plan_to_ops(plan, engine='kokoro'):
    """Turn a validated plan into spoken chunks:
    [{'tts_text', 'words': [{'w', 'em'}], 'stress': [word idx], 'speed', 'pause_after'}]

    Chunks break only at planned pauses and sentence ends, so each sentence keeps its natural intonation.
    A chunk holding emphasis 3 is read a little slower than one holding emphasis 2; emphasised unstressed words
    get a stress mark.
    """
    caps = CAPS.get(engine, set())
    pace_e, pause_e = EMOTIONS[plan['emotion']]
    base = plan['delivery']['pace'] * pace_e * ENERGY[plan['delivery']['energy']]
    pause_at = {p['after']: p['duration_ms'] / 1000 * pause_e for p in plan['pauses']}
    segs = plan['segments']
    ops, cur = [], []

    def close(pause):
        if not cur:
            return
        text = ' '.join(s['text'] for s in cur)
        ws, stress = [], []
        for s in cur:
            for w in s['text'].split():
                if not re.search(r'\w', w):
                    continue  # a bare dash is delivery, not a word
                if s['emphasis'] >= 1:
                    stress.append(len(ws))
                ws.append({'w': w, 'em': s['emphasis'] >= 2})
        top = max(s['emphasis'] for s in cur)
        speed = base * (1.03 if text.rstrip().endswith('!') else 1.0)
        if top == 3:
            speed *= STRONG_SPEED
        elif top == 2 or any(s.get('duration') == 'long' for s in cur):
            speed *= MODERATE_SPEED
        tts = re.sub(r'\s*—\s*', ', ', text).strip().rstrip(',').strip()
        if text.rstrip().endswith('—') or not re.search(r'([.!?,;:…]|\.\.\.)$', tts):
            tts += ','  # chunk ends mid-sentence: keep the intonation suspended, not falling
        ops.append({'tts_text': tts, 'words': ws, 'stress': stress if 'stress' in caps else [],
                    'speed': round(min(1.4, max(.6, speed)), 3), 'pause_after': round(pause, 3)})
        cur.clear()

    for i, s in enumerate(segs):
        cur.append(s)
        last = i == len(segs) - 1
        if i in pause_at:
            close(pause_at[i] if 'pause' in caps else 0.0)
        elif re.search(r'[.!?]$', s['text']) and not last:
            close(SENTENCE_GAP[s['text'][-1]] * pause_e if 'pause' in caps else 0.0)
    close(0.0)
    return ops


# ---------------------------------------------------------------- Kokoro stress marks
_VOWELS = set('aeiouæɑɒɔəɛɜɪʊʌɚɐɘɵʉɨøœɤyʏ')


def add_stress(phoneme_word):
    """Give an unstressed phoneme word a primary stress mark before its first vowel (no-op if already stressed)."""
    if 'ˈ' in phoneme_word:
        return phoneme_word
    w = phoneme_word.replace('ˌ', '')
    for i, c in enumerate(w):
        if c in _VOWELS:
            return w[:i] + 'ˈ' + w[i:]
    return phoneme_word


def stressed_phonemes(phonemes, n_words, stress_idx):
    """Apply add_stress to the given word positions. Returns (phonemes, applied) — applied is False when the
    phoneme words don't line up 1:1 with the text words (numbers, abbreviations), in which case nothing changes."""
    parts = phonemes.split()
    if len(parts) != n_words or not stress_idx:
        return phonemes, False
    for i in stress_idx:
        parts[i] = add_stress(parts[i])
    return ' '.join(parts), True
