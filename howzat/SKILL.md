# Howzat Tech daily reel

Make one Hinglish "ye kaise hota hai?" explainer reel (45–55 s) for Instagram @howzat.tech and post it.
Owner: Shrey Jain. Talk to him in Hinglish (Hindi in Roman script), short and simple.
Reel 1 (Google Maps traffic, `scripts/2026-10-31_google-maps.json`, engine files in `engine/`) is the
reference for quality, look and pacing: match it.

## 0. Setup (fresh container)
- `cd howzat/engine && npm i @fontsource/poppins @fontsource/jetbrains-mono`
- `pip install --break-system-packages kokoro-onnx soundfile librosa`
- Kokoro model (reference voice only) into `howzat/engine/models/` (do not commit):
  `https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx` and `voices-v1.0.bin`.
- Chromium + Playwright are pre-installed; ffmpeg is available.

## 1. Topic
First check `log.json`: if it already has an entry for today's India date (Asia/Kolkata), a reel is already up
today, so do nothing else and stop without messaging Shrey.

Take the first entry in `topics.json` without `"status": "posted"`. Check the last entries in `log.json` so no
topic repeats. Research it with web search: every fact and number must come from a reliable source (keep 1–3).
If a company's internals aren't public, say "aam taur pe" instead of claiming exact details. No politics,
religion, medical or financial advice.

## 2. Script
Write `scripts/<YYYY-MM-DD>_<slug>.json` like the reference: `title`, `lines` (12–16 lines, 110–140 spoken words
total), and `caption`, `hashtags`, `sources`, `cover` (2–3 short title lines, one punchy word for the pill).
- Lines: Hinglish, short, punchy; hook in line 1 (a surprising fact or mini story), 3–5 steps, a twist, and a
  last line "Ye reel us dost ko bhejo jo ..." CTA.
- ElevenLabs tags in English brackets, at most one per line: [curious], [excited], [whispers], [mischievously],
  [laughs], [sarcastic]. "..." for pauses, CAPS for one stressed word.
- Also write `engine/script_<slug>.py` with `LINES` in the format of `engine/script_maps.py`: per line
  `(speed, pause, [(caption_roman, tts_devanagari, keyword, colour)])`. Captions are the spoken words without tags,
  2–4 words per chunk; the Devanagari text is only for the Kokoro reference voice (same words, Devanagari script).

## 3. Voice (ElevenLabs, voice "Bunty – Punchy, Crisp and Reel King", model Eleven v4)
Shrey is on the ElevenLabs **free plan**: Bunty works on the website only, not through the API. So:
1. Claude in Chrome (Shrey's real Chrome; load the chrome-browser skill first): open
   `https://elevenlabs.io/app/speech-synthesis/text-to-speech` in a new tab in the MCP tab group.
2. Voice: if it doesn't already show Bunty, open the voice picker → **My voices** → hover Bunty → **Use**.
   Model must be **Eleven v4**.
3. Click the text box, select all and delete any old text, type the full script (all lines joined with spaces,
   tags included). Click **Generate speech** once. No retakes, ever.
4. When it finishes, pause playback, click the download icon in the bottom player (Generation 1).
5. `device_list_dir` on `C:\Users\SHREY JAIN\Downloads`, take the newest `ElevenLabs_*Bunty*.mp3` (modified in the
   last few minutes), and `device_stage_files` it into the container. Close your Chrome tab.
If Chrome/the computer can't be reached, or ElevenLabs is logged out or out of credits: post nothing, tell Shrey
in one short message what failed, and stop. (If Shrey ever says he upgraded to a paid plan, the API route through
Zapier ElevenLabs `text_to_speech` with voice_id `FZkK3TvQ0pjyDmT8fzIW`, model `eleven_v4`, works instead; its
`audio_url` is copied into the repo with the Zapier GitHub `create_file` action, content = that URL.)

## 4. Captions in sync
1. Reference voice: `python3 gen_voice.py hm_omega <work>/ref script_<slug> models` (from `engine/`).
2. `python3 align.py <work>/ref/voice.wav <work>/ref/timings.js <bunty.mp3> <work>/timings.js`
   It maps chunk times onto Bunty with DTW and snaps them to his pauses. Check the printout: line starts should
   sit on the pauses; fix any obviously wrong boundary by hand (nearest pause).
3. `ffmpeg -i <bunty.mp3> -ac 1 -ar 44100 -af loudnorm=I=-16:TP=-1.5:LRA=11 <work>/voice.wav`

## 5. Animation
Work in a copy of `engine/` (`<work>/`, link `node_modules`, put `timings.js` and `voice.wav` there).
- `theme.js` is the look (poppy purple gradient, glow chips, keyword pills, sparkle bursts, colour wipes, end card
  with the logo and "Follow @howzat.tech"). Don't change it.
- Make `<slug>.js` from `maps.js`: keep everything up to and including `phoneBody()` (helpers, background,
  chips, map, phone, eye), replace the Maps scenes with this topic's scenes, and define
  `window.TOPIC` (header word, e.g. 'UPI'), `function sceneList()` returning `[[start, end, fn], ...]`
  (use `LS(i)`/`LE(i)` line times and `CK('chunk text')` chunk times; last scene ends at `END + 0.4`),
  `function STEPS()` (4–5 short step labels with their start times), and `function reelBursts(t)` (sparkle
  bursts on the 4–6 key reveals). Keep `captions`/`draw` from `theme.js`. Point `index.html` at `<slug>.js`
  instead of `maps.js`.
- Every line gets a visual that moves with it: phones, maps, servers, cards, counters, arrows, packets. Original
  drawings only: no brand logos, no real people, no copied footage. Keep important things between y 300 and
  y 1420 (captions sit at y ~1505; Instagram covers the bottom).
- Look at full-size preview frames of the 6–8 busiest moments (`python3 render.py preview t1,t2,...`), fix
  overlaps, then render once: duration = `TL.dur + 0.9 + 1.6` → `python3 render.py render <dur>`.

## 6. Sound
Copy `mix_maps.py`, replace its `ev` list with this reel's events (whoosh on scene changes, pop on chips, ding on a
correct/tick moment, alert + thud on a big reveal, msg sounds in chat scenes), keep the beat and ducking.
`python3 mix_<slug>.py <dur>`, then
`ffmpeg -i out/video.mp4 -i out/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -movflags +faststart out/final.mp4`.
Check: the voice must be clearly louder than the background (about 14 dB, as in reel 1).

## 7. Cover
1080×1920 JPEG: a dimmed frame of the reel plus the `cover` title (white lines, one yellow pill line, an orange
gradient tag), like reel 1's cover. Keep the title between y 600 and y 1300.

## 8. Host and publish
1. Host on the `media` branch exactly as `skills/brainsnck-reel/SKILL.md` section 6 describes, file names
   `videos/<YYYY-MM-DD>_<HHMM>_howzat-<slug>.mp4` and `.jpg`. Confirm both raw URLs give HTTP 200.
2. Publish with Zapier Instagram for Business raw requests (`selected_api` InstagramBusinessCLIAPI,
   `connection_id` `02430411-5018-80e8-bb13-f7b4036307c6`, IG account id `17841461730434810` = howzat.tech;
   never post to BrainSnck's id). Shrey's Zapier is on the free plan, so use as few Zapier calls as possible:
   - POST `https://graph.facebook.com/v21.0/17841461730434810/media` with JSON
     `{"media_type": "REELS", "share_to_feed": true, "video_url": ..., "cover_url": ..., "caption": ...}`
   - wait 2 minutes (`sleep 120`), then GET `https://graph.facebook.com/v21.0/<container id>?fields=status_code`;
     if not `FINISHED`, wait 2 more minutes and check again (at most 3 checks).
   - POST `https://graph.facebook.com/v21.0/17841461730434810/media_publish` with `{"creation_id": "<id>"}`.
   - GET `https://graph.facebook.com/v21.0/<media id>?fields=permalink`.
   Caption = `caption` + blank line + "Voice: elevenlabs.io" + blank line + hashtags (always include
   #howzattech). The "Voice: elevenlabs.io" credit is required on the ElevenLabs free plan.
   If Instagram or Zapier returns an error (including Zapier being out of tasks), report it word for word and stop.

## 9. Log and report
Mark the topic `"status": "posted"` in `topics.json`, append to `log.json` (`date`, `slug`, `title`,
`sources`, `video_url`, `cover_url`, `permalink`), commit the script, scene file and logs, push to `main`. The BrainSnck task pushes to the same repo, so if a push
is rejected, `git fetch` + `git rebase` and push again (never `--force`).
Send Shrey one short Hinglish message: the reel title and the Instagram link.
