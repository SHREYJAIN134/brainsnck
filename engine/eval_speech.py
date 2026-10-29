"""Before/after evaluation of the speech planner on nine kinds of text.

usage: python3 eval_speech.py OUT_DIR

"Before" = planner off (plain delivery, sentence gaps only). "After" = a context-aware plan (written by Claude, the
same way a scheduled run writes one) rendered by speech_plan.plan_to_ops. Writes OUT_DIR/eval_report.json and
OUT_DIR/speech_ab.m4a (each case: a spoken label, then Before, then After). Objective numbers check that the
controls were really applied; whether it sounds more natural needs a human listener.
"""
import json, os, subprocess, sys, wave
import numpy as np

import make_reel as mr
import speech_plan as sp

N = 'neutral'


def seg(text, em=0, why=''):
    return {'text': text, 'emphasis': em, 'reason': why}


def plan(emotion, segs, pauses=(), pace=1.0, intent=''):
    return {'intent': intent, 'emotion': emotion, 'delivery': {'pace': pace, 'energy': 'moderate',
            'pitch_style': 'natural', 'overall_style': 'conversational'}, 'segments': segs,
            'pauses': [{'after_text': a, 'duration_ms': ms, 'reason': r} for a, ms, r in pauses]}


CASES = [
    ('neutral information', None,
     "The Moon is about three hundred eighty four thousand kilometers from Earth.",
     plan(N, [seg("The Moon is about three hundred eighty four thousand kilometers from Earth.", 0, 'plain fact')],
          intent='state a fact')),
    ('correction', 'Did you send the report today?',
     "I sent it yesterday.",
     plan(N, [seg('I sent it'), seg('yesterday.', 3, 'corrects the time in the question')],
          intent='correct the assumed day')),
    ('question and answer', None,
     "Why is the sky blue? Because air scatters blue light more than red.",
     plan('curious', [seg('Why is the sky blue?'), seg('Because air scatters'), seg('blue', 2, 'contrast with red'),
                      seg('light more than red.')],
          [('Why is the sky blue?', 380, 'let the question land before the answer')], intent='pose then answer')),
    ('excited dialogue', None,
     "We actually did it! The rocket landed perfectly!",
     plan('excited', [seg('We actually'), seg('did it!', 2, 'the achievement'), seg('The rocket landed'),
                      seg('perfectly!', 2, 'the surprising quality')], intent='celebrate')),
    ('empathetic dialogue', None,
     "I know this is hard. Take a breath. You're not alone in this.",
     plan('empathetic', [seg('I know this is hard.'), seg('Take a breath.'), seg("You're"),
                         seg('not alone', 2, 'the reassurance'), seg('in this.')],
          [('I know this is hard.', 450, 'give the acknowledgement room'), ('Take a breath.', 500, 'time to breathe')],
          pace=.97, intent='comfort')),
    ('persuasive statement', None,
     "You don't need more time. You need a better plan.",
     plan('persuasive', [seg("You don't need"), seg('more time.', 2, 'the rejected option'), seg('You need a'),
                         seg('better plan.', 3, 'the conclusion, contrasted with more time')],
          [('more time.', 350, 'set up the turn')], intent='persuade')),
    ('ambiguous emphasis (no context)', None,
     "I never said he stole the money.",
     plan(N, [seg('I'), seg('never', 1, 'restrained default: a plain denial'), seg('said he stole the money.')],
          intent='deny; no context, so no contrast is invented')),
    ('mixed paragraph', None,
     "Have you ever wondered why cats purr? Scientists still aren't completely sure! Some think it even helps them heal. Pretty amazing, right?",
     plan('curious', [seg('Have you ever wondered why cats purr?'), seg("Scientists still aren't"),
                      seg('completely', 2, 'the surprise: experts do not know'), seg('sure!'),
                      seg('Some think it even helps them'), seg('heal.', 2, 'the new, surprising idea'),
                      seg('Pretty amazing, right?')],
          [('Have you ever wondered why cats purr?', 380, 'question hangs'), ('heal.', 420, 'let it sink in')],
          intent='intrigue')),
    ('long passage', None,
     "An octopus has three hearts and blue blood. Two hearts pump blood through the gills, while the third keeps it "
     "moving through the rest of the body. When the octopus swims, that third heart actually stops beating. That is "
     "one reason these clever animals prefer to crawl instead of swim.",
     plan('amazed', [seg('An octopus has'), seg('three hearts', 2, 'first surprising fact'), seg('and'),
                     seg('blue blood.', 2, 'second surprising fact'),
                     seg('Two hearts pump blood through the gills,'),
                     seg('while the third keeps it moving through the rest of the body.'),
                     seg('When the octopus swims,'), seg('that third heart actually'),
                     seg('stops beating.', 3, 'the reveal'),
                     seg('That is one reason these clever animals prefer to crawl instead of swim.')],
          [('blue blood.', 380, 'pause after the hook'), ('Two hearts pump blood through the gills,', 150, 'clause'),
           ('When the octopus swims,', 200, 'set up the reveal')], intent='explain and surprise')),
]


def silences(x, min_s=.12):
    hop = int(.01 * mr.SR)
    rms = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x) - hop, hop)])
    quiet = rms < max(rms.max() * .02, 1e-4)
    runs, n = [], 0
    for q in quiet:
        if q:
            n += 1
        else:
            if n * .01 >= min_s:
                runs.append(n * .01)
            n = 0
    return runs


def speak(say, speech, planner):
    mr.PLANNER = planner
    mr.RENDER_LOG.clear(); mr.PLAN_REPORT.clear()
    x, _ = mr.say_scene(say, speech)
    return x, list(mr.RENDER_LOG), list(mr.PLAN_REPORT)


def main(out):
    os.makedirs(out, exist_ok=True)
    female = mr.voice_spec('female')
    label_voice = mr.voice_spec('male')
    report, track = [], []
    gap = np.zeros(int(.7 * mr.SR))
    for n, (name, context, say, pl) in enumerate(CASES, 1):
        mr.VOICE = label_voice
        lab, _, _ = speak(f'Case {n}. {name}.', None, 'off')
        before_lab, _, _ = speak('Before.', None, 'off')
        after_lab, _, _ = speak('After.', None, 'off')
        mr.VOICE = female
        b, blog, _ = speak(say, None, 'off')
        a, alog, arep = speak(say, pl, 'script')
        p, _ = sp.validate_plan(pl, say, 'kokoro')
        ops = sp.plan_to_ops(p, 'kokoro')
        sb, sa = silences(b), silences(a)
        report.append({
            'case': name, 'context': context, 'text': say, 'plan_source': arep[0]['source'],
            'plan_warnings': arep[0]['warnings'],
            'emphasis': [(s['text'], s['emphasis']) for s in p['segments'] if s['emphasis']],
            'before': {'seconds': round(len(b) / mr.SR, 2), 'pauses_s': [round(s, 2) for s in sb]},
            'after': {'seconds': round(len(a) / mr.SR, 2), 'pauses_s': [round(s, 2) for s in sa],
                      'chunks': len(ops), 'speeds': [op['speed'] for op in ops],
                      'strong_chunks_gain_db': [op['gain_db'] for op in ops if op['gain_db']],
                      'stress_requested': sum(1 for r in alog if r['stress_requested']),
                      'stress_applied': sum(1 for r in alog if r['stress_applied'])},
        })
        norm = lambda y: y / (np.abs(y).max() + 1e-9) * .85
        track += [norm(lab), gap, norm(before_lab), gap[:int(.3 * mr.SR)], norm(b), gap,
                  norm(after_lab), gap[:int(.3 * mr.SR)], norm(a), gap, gap]
        print(f"{n}. {name}: before {report[-1]['before']['seconds']}s, {len(sb)} pauses | after "
              f"{report[-1]['after']['seconds']}s, {len(sa)} pauses, {len(ops)} chunks, "
              f"stress {report[-1]['after']['stress_applied']}/{report[-1]['after']['stress_requested']}, "
              f"warnings {len(arep[0]['warnings'])}", flush=True)
    with open(os.path.join(out, 'eval_report.json'), 'w') as f:
        json.dump(report, f, indent=1, ensure_ascii=False)
    y = np.concatenate(track)
    wav = os.path.join(out, 'speech_ab.wav')
    with wave.open(wav, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(mr.SR)
        w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-c:a', 'aac', '-b:a', '128k',
                    os.path.join(out, 'speech_ab.m4a')], check=True)


if __name__ == '__main__':
    main(sys.argv[1])
