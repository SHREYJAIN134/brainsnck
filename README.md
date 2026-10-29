# BrainSnck

Automated science-fact reels for Instagram [@BrainSnck](https://www.instagram.com/brainsnck/).
The steps each scheduled run follows are in `skills/brainsnck-reel/SKILL.md`; settings are in `config.json`.

## Speech planner

Each scene's narration goes through `engine/speech_plan.py` before the voice speaks it: a speech plan (intent,
emotion, pace, emphasis 0-3 per word or phrase, pauses) is validated against the exact script text, then rendered
with the controls the voice model really has (pauses, pace per phrase and stress marks on unstressed words;
emphasised sentences are read a little slower). Plans come from the script's `speech` field; without one, a cautious
plan is built from the script's own marks. `config.json` → `"speech_planner"`: `script` (default), `heuristic`, or
`off` for plain delivery. Tests: `cd engine && python3 -m unittest discover -s tests`. Before/after listening test:
`cd engine && python3 eval_speech.py ../out/speech_eval`.

## Credits

- Narration: [Kokoro-82M](https://github.com/hexgrad/kokoro) voices (Apache 2.0), run with [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx) (MIT).
- Illustrations: [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (MIT).
- Fonts: Anton and Montserrat (SIL Open Font License). Animation: GSAP.
- Music and sound effects are synthesized from scratch by `engine/audio.py`.
