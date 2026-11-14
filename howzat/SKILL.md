# Howzat Tech daily reel

Make one Hinglish "ye kaise hota hai?" explainer reel (15–20 s) for Instagram @howzat.tech and post it.
Owner: Shrey Jain. Talk to him in Hinglish (Hindi in Roman script), short and simple.
Reel 1 (Google Maps traffic, `scripts/2026-10-31_google-maps.json`, engine files in `engine/`) is the
reference for quality and pacing (the look is now the soft flat theme in section 5). Reels are now short (15–20 s) so the free ElevenLabs credits last a
reel a day: about 320 credits per reel, 10,000 a month.

## 0. Setup (fresh container)
- `cd howzat/engine && npm i @fontsource/poppins @fontsource/jetbrains-mono`
- `pip install --break-system-packages kokoro-onnx soundfile librosa`
- Kokoro model (reference voice only) into `howzat/engine/models/` (do not commit):
  `https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx` and `voices-v1.0.bin`.
- Chromium + Playwright are pre-installed; ffmpeg is available.

## 1. Topic
First check `log.json`: if it already has an entry for today's India date (Asia/Kolkata), a reel is already up
today, so do nothing else and stop without messaging Shrey.

**Topic mix: trains at most 2 a week (Shrey, 2026-11-11; replaces the train-only niche of 2026-11-09).** Trains
did best (railway 3/3 since 2026-11-09, 1,368–3,417 views) but Shrey doesn't want a train-only page. So:
- `"pillar": "railway"` at most 2 reels per Monday–Sunday week (India date) and never on 2 days in a row. Count
  them with the `pillar` field in `log.json`. (The week of 2026-11-09 already had 3, so no train reel before
  Monday 2026-11-16.)
- All other days: the best-scoring non-railway topic from any pillar: cricket (Hawk-Eye 1,597; aim for one
  cricket reel a week), scams/safety, paisa/prices, phone/WhatsApp/apps, travel, city life. Same data rule as
  below: it needs conflict or a mini story plus the viewer's own stakes; a neutral "how X works" lost 10×.
- Never the same `pillar` as yesterday.
- The "tum vs someone" mini story format works for every pillar (tum WL 12 vs dost WL 90, tum upper vs aunty
  lower). Railway reels end "Aise aur railway raaz... follow karo!" with `#railwayraaz`, and within railway
  don't repeat the last railway `angle` (booking, money, delays, rules, safety, tech). Other reels end
  "Aise aur raaz ke liye... follow karo!".

**Data first, never random (Shrey's rule, 2026-11-07).** Pick the topic from what got the most reach:
1. Refresh the numbers: in Shrey's Chrome open `https://www.instagram.com/howzat.tech/reels/` in a new MCP tab, run
   `[...document.querySelectorAll('a[href*="/reel/"]')].map(a => [a.getAttribute('href'), a.innerText])`
   (the number on each tile = views), close the tab. Update `views` in `insights.json` for every reel (match the
   `/reel/<code>/` with `log.json` permalinks; add new reels with their `angle` and `conflict`), set `checked`.
   No Zapier calls for this: the Zapier connection has no Insights permission, and the task budget is tight.
2. Learn: only compare reels at least 48 h old. A winner has ≥ 3× the median views. If new data changes the
   "What works" list below, update it (short, with numbers).
3. What works (2026-11-08, 9 reels ≥ 48 h old, median 155):
   - Winners, 1,118–1,589 views: Hawk-Eye/DRS (cricket + umpire-vs-machine controversy), Tatkal (everyone's
     pain + a villain: 58% bots), Google Maps (true story: one man fooled Maps with 99 phones). Gym myth-buster
     extra: 685.
   - Losers, 115–155 views (10× less): UPI, CAPTCHA, Shazam, FASTag, squat study. All neutral "X kaise kaam
     karta hai" with no villain and nothing at stake for the viewer.
   - 2026-11-09: Waiting list (trains, tum vs dost story) 2,599 in 10 h = best ever. Digital arrest (scam
     villain + money) only 292 at 46 h, so a villain alone isn't enough: the niche (trains) matters most.
   - 2026-11-10: railway 2/2 since the niche lock and still climbing: Waiting list 3,211 at 41 h, Lower berth
     1,352 at 30 h. Median of the 10 reels ≥ 48 h old is now 227.
   - 2026-11-11: railway 3/3 since the lock: Train priority (delays, tum vs Vande Bharat) 1,536 at 20 h, Lower
     berth 1,368 at 51 h, Waiting list 3,417 at 3 days. Median of the 12 reels ≥ 48 h old is now ~500.
   - 2026-11-15: Current booking (railway, practical tip, no real villain) only 150 at 3.5 days: the first railway
     flop, so trains alone aren't enough either. IPL max-fee (cricket + paisa + villain) 1,353 in ~1 day. Shaadi
     card (safety) 187 at 40 h, like digital arrest (307): scam reels stay low. Median of 14 reels ≥ 48 h ~500.
   - Not the reason: length, posting time, look and voice were the same for all of them.
   - So: mass Indian passion (cricket, trains, paisa, phone/WhatsApp life) + conflict (villain, scam, cheat,
     controversy, unfair system, or a true mini story with a character) + the viewer's own stakes (paise,
     ticket, time, safety).
4. Score every topic in `topics.json` without `"status": "posted"`, plus 2–3 fresh ideas from today's news (web
   search): passion 0–2 + conflict/story 0–2 + viewer's stakes 0–2 + fresh news angle 0–1, minus 2 for a
   neutral "how X works". Write `score` and a one-line `why` on each. Pick the highest score that the topic mix
   rule above allows (fresh ideas can be from any pillar). Check `log.json` so no topic repeats.
5. Line 1 of the script is a scene with tension or a character (like the 3 winners), never a bare number or
   an app name.

Research the chosen topic with web search before writing: every fact and number must come from a reliable
source (keep 1–3). If the research finds a better hook than the one in `topics.json`, use it.
In 15–20 s there is room for one idea only: one wow fact, the "kaise" in 2–3 steps, the payoff.
If a company's internals aren't public, say "aam taur pe" instead of claiming exact details. No politics,
religion, medical or financial advice.

## 2. Script
Write `scripts/<YYYY-MM-DD>_<slug>.json` like the reference: `title`, `lines` (6–8 lines, 35–45 spoken words
total; the whole typed text, tags and spaces included, must be at most 270 characters: count it), and `caption`, `hashtags`, `sources`, `cover` (2–3 short title lines, one punchy word for the pill).
- Lines: Hinglish, short, punchy; hook in line 1 (a surprising fact or mini story), 2–3 steps, a quick payoff,
  and a short last line asking people to follow for more (at most 6 words, must contain "follow"), e.g.
  "Aise aur raaz ke liye... follow karo!". Shrey's rule (2026-11-05): no more "Ye reel dost ko bhejo" endings.
- ElevenLabs tags in English brackets (they cost credits too), at most 2 in the whole script: [curious], [excited], [whispers], [mischievously],
  [laughs], [sarcastic]. "..." for pauses, CAPS for one stressed word.
- Also write `engine/script_<slug>.py` with `LINES` in the format of `engine/script_maps.py`: per line
  `(speed, pause, [(caption_roman, tts_devanagari, keyword, colour)])`. Captions are the spoken words without tags,
  2–4 words per chunk; the Devanagari text is only for the Kokoro reference voice (same words, Devanagari script).

## 3. Voice (ElevenLabs, voice "Bunty – Punchy, Crisp and Reel King", model Eleven v4)
Shrey is on the ElevenLabs **free plan**: Bunty works on the website only, not through the API. So:
1. Claude in Chrome (Shrey's real Chrome; load the chrome-browser skill first): open
   `https://elevenlabs.io/app/speech-synthesis/text-to-speech` in a new tab in the MCP tab group.
2. Voice: if it doesn't already show Bunty, open the voice picker → **My voices** → hover Bunty → **Use**.
   (Shrey may switch to another ElevenLabs account when credits run out: if Bunty isn't in My voices, find
   "Bunty – Punchy, Crisp and Reel King" in the Voice Library and add it first; if it isn't there, fail.)
   Model must be **Eleven v4**.
   Credits: read the account's remaining credits on the site. Credits ≈ 1.17 × characters (reel 1: an
   818-character script used 952), so a 270-character script costs about 320. If remaining < 1.2 × the script's characters,
   don't generate: post nothing, tell Shrey "ElevenLabs credits khatam (<remaining> bache) — dusre account se
   login karo", and stop.
3. Click the text box, select all and delete any old text, type the full script (all lines joined with spaces,
   tags included). Click **Generate speech** once. No retakes, ever.
   Note the remaining credits after generating; they go in the final message (section 9).
4. When it finishes, pause playback, click the download icon in the bottom player (Generation 1).
5. `device_list_dir` on `C:\Users\SHREY JAIN\Downloads`, take the newest `ElevenLabs_*Bunty*.mp3` (modified in the
   last few minutes), and `device_stage_files` it into the container. Close your Chrome tab.
If ElevenLabs is logged out or out of credits: post nothing, tell Shrey in one short message what failed, and stop.
If Chrome/the computer can't be reached (Shrey's rule, 2026-11-13): post nothing and don't wait for Shrey: schedule
a one-time retry 30 minutes later exactly as step 5 of the scheduled-task prompt says, every 30 minutes until the
reel runs (section 1 stops a run once today's India date is in `log.json`), and give up only after 23:30 IST. (If Shrey ever says he upgraded to a paid plan, the API route through
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
- `theme.js` is the look, "soft flat": one plain, soft background colour, soft flat accents (`C.yel`, `C.pink`,
  `C.cyan`, `C.grn`, `C.org`, `C.red`), dark navy cards (`C.box`), ink outlines (`INK`) and hard offset shadows
  (`hardShadow()`), keyword pills, sparkle bursts, flat colour-band wipes, the "follow for more" ending
  `sceneFollow`, end card with the logo and "Follow @howzat.tech". Don't change it. Shrey wants plain colours that are easy on the eyes: **no glow, no
  neon, no gradients, no blur, no harsh saturated colours** in scene code (use the `C` palette; theme.js already
  ignores `shadowBlur`). Start `<slug>.js` with `window.BG = '<colour>';` and choose the colour by the script's
  vibe (Shrey leaves it to you), e.g. `#33407a` soft navy (internet, security, "andar ka raaz"), `#5a4e8c` dusty
  purple (apps, fun, mystery), `#2f6b70` soft teal (money, travel, India systems, everyday life). Other colours
  are fine if they stay soft and muted, mid-dark enough for white captions, and not red or pink (red alerts
  vanish on them). Try not to repeat the last `bg` in `log.json`.
- Make `<slug>.js` from `maps.js`: keep everything up to and including `phoneBody()` (helpers, background,
  chips, map, phone, eye), replace the Maps scenes with this topic's scenes, and define
  `window.TOPIC` (header word, e.g. 'UPI'), `function sceneList()` returning `[[start, end, fn], ...]`
  (use `LS(i)`/`LE(i)` line times and `CK('chunk text')` chunk times; last scene ends at `END + 0.4`),
  `function STEPS()` (2–3 short step labels with their start times), and `function reelBursts(t)` (sparkle
  bursts on the 2–3 key reveals). Keep `captions`/`draw` from `theme.js`.
  The last line always uses `sceneFollow` from `theme.js`: end `sceneList()` with
  `[LS(N) - 0.4, END + 0.4, sceneFollow]` (N = last line). It shows the @howzat.tech profile card, taps the
  Follow button on the caption chunk that contains "follow" and pops a FOLLOW FOR MORE pill. No "send to a
  friend" chat scene any more. Point `index.html` at `<slug>.js`
  instead of `maps.js`.
- Every line gets a visual that moves with it: phones, maps, servers, cards, counters, arrows, packets. Original
  drawings only: no brand logos, no real people, no copied footage. Keep important things between y 300 and
  y 1420 (captions sit at y ~1505; Instagram covers the bottom).
- Look at full-size preview frames of the 4–5 busiest moments (`python3 render.py preview t1,t2,...`), fix
  overlaps, then render once: duration = `TL.dur + 0.9 + 1.6` → `python3 render.py render <dur>`.

## 6. Sound
Copy `mix_maps.py`, replace its `ev` list with this reel's events (whoosh on scene changes, pop on chips, ding on a
correct/tick moment, alert + thud on a big reveal, msg sounds in chat scenes), keep the beat and ducking.
`python3 mix_<slug>.py <dur>`, then
`ffmpeg -i out/video.mp4 -i out/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -movflags +faststart out/final.mp4`.
Follow ending (t0 = last line start − 0.4; tap = start of the last line's chunk containing "follow" + 0.2, at
least t0 + 0.95): whoosh at t0 − 0.25, pop at t0 + 0.1 and t0 + 0.45, click + ding at tap, pop at tap + 0.25.
Check: the voice must be clearly louder than the background (about 14 dB, as in reel 1).

## 7. Cover
1080×1920 JPEG in the same soft flat style: the reel's plain background colour, one key visual from the reel,
and the `cover` title (white lines with a thick ink outline, one flat yellow pill line with ink outline and hard
shadow, a solid orange tag). No glow, no gradients, no dimming. Keep the title between y 600 and y 1300.
Then put the cover on the very first frame of the video (Instagram uses frame 0 as the cover when no
`cover_url` is sent, which is the case with the one-call publish in section 8):
`ffmpeg -i out/final.mp4 -i <cover>.jpg -filter_complex "[0:v][1:v]overlay=enable='eq(n,0)'[v]" -map "[v]" -map 0:a -c:v libx264 -crf 18 -pix_fmt yuv420p -r 30 -c:a copy -movflags +faststart out/post.mp4`
and host/post `out/post.mp4`.

## 8. Host and publish
1. Host on the `media` branch exactly as `skills/brainsnck-reel/SKILL.md` section 6 describes, file names
   `videos/<YYYY-MM-DD>_<HHMM>_howzat-<slug>.mp4` and `.jpg`. Confirm both raw URLs give HTTP 200.
2. Publish with Zapier Instagram for Business raw requests (`selected_api` InstagramBusinessCLIAPI,
   `connection_id` `02430411-5018-80e8-bb13-f7b4036307c6`, IG account id `17841461730434810` = howzat.tech;
   never post to BrainSnck's id). The BrainSnck task uses the same Zapier connection. Zapier charges
   **2 tasks per MCP tool call**. Zapier budget (Shrey's rule, set 2026-11-01):
   - **Before 2026-11-13 (India date): Pro trial** (1,000 tasks, trial ends 2026-11-13, no payment method saved,
     so nothing is charged). Use as many Zapier calls as the reel needs: the one call below, and the full
     fallback if it errors.
   - **From 2026-11-13: free plan, at most 2 tasks per reel = exactly ONE execute call.** No
     `inspect_zapier_actions` (the schema is written below), no raw requests, no retries, no GETs. If that one
     call errors: wait 3 minutes and open `https://www.instagram.com/howzat.tech/reels/` in Chrome; if the new
     reel is there, use it; otherwise post nothing, send Shrey the error word for word plus "2-task limit ki
     wajah se fallback nahi chalaya", and stop.
   No status-check GET and no permalink GET on any day:
   - **One call:** `execute_zapier_write_action` with `selected_api` InstagramBusinessCLIAPI, action
     `publish_video`, params `video` = the hosted `.mp4` raw URL (the `out/post.mp4` file), `caption`, `instagramPageId`
     `17841461730434810` (label Howzat.Tech). It returns the media `id`. Call it once only.
   - **Fallback, trial only (before 2026-11-13), only if that call returned an error** (it can give up with
     "Video is still processing", as on 2026-11-01): wait 3 minutes, open `https://www.instagram.com/howzat.tech/reels/` in Chrome; if a new
     reel is already there, it posted, use it. Otherwise use the raw requests (`connection_id`
     `02430411-5018-80e8-bb13-f7b4036307c6`): POST `https://graph.facebook.com/v21.0/17841461730434810/media`
     with JSON `{"media_type": "REELS", "share_to_feed": true, "video_url": ..., "cover_url": ..., "caption": ...}`,
     wait 4 minutes (`sleep 240`), then POST `https://graph.facebook.com/v21.0/17841461730434810/media_publish`
     with `{"creation_id": "<id>"}`. If the publish error only says the media isn't ready yet, wait 2 more
     minutes and retry it (at most 2 retries); any other error: report and stop.
   - Permalink without Zapier: in Shrey's Chrome open `https://www.instagram.com/howzat.tech/reels/` in a new MCP
     tab, take the newest `/reel/<code>/` link (it must not already be in `log.json`), close the tab. If that
     doesn't work, use `https://www.instagram.com/howzat.tech/` as the permalink.
   Caption = `caption` + blank line + "Voice: elevenlabs.io" + blank line + hashtags (always include
   #howzattech). The "Voice: elevenlabs.io" credit is required on the ElevenLabs free plan.
   If Instagram or Zapier returns an error (including Zapier being out of tasks), report it word for word and stop.

## 9. Log and report
Mark the topic `"status": "posted"` in `topics.json`, append to `log.json` (`date`, `slug`, `title`, `pillar`,
`bg`, `sources`, `video_url`, `cover_url`, `permalink`), commit the script, scene file and logs, push to `main`. The BrainSnck task pushes to the same repo, so if a push
is rejected, `git fetch` + `git rebase` and push again (never `--force`).
Send Shrey one short Hinglish message: the reel title, the Instagram link and the ElevenLabs credits left. If
fewer than ~400 credits are left, add that the next reel won't fit and he should log in with another account.
