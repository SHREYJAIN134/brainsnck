# Howzat Tech (@howzat.tech)

Hinglish "ye kaise hota hai?" explainer reels, about 15–20 s, one a day.
Topic mix since 2026-11-11: trains at most 2 reels a week (never 2 days in a row); other days cricket, scams,
paisa, phone/apps and more, always with a story or villain. See SKILL.md section 1.

- `topics.json`: topic bank (30 ideas with hooks).
- `scripts/`: voice scripts with ElevenLabs audio tags (voice: Bunty, model Eleven v4).
- `engine/`: canvas animation (`maps.js` scenes + `theme.js` pop look), `render.py` (Playwright → MP4),
  `mix_maps.py` (voice + SFX + beat), `align.py` (maps caption timings from the Kokoro reference
  narration onto the ElevenLabs narration with DTW, then snaps to pauses).
- Instagram: account id 17841461730434810, posted through Zapier (Instagram for Business).
- Free ElevenLabs plan: library voices (Bunty) work only on the website, not the API; captions must credit
  "Voice: elevenlabs.io".

Reel 1 (2026-10-31): Google Maps traffic — https://www.instagram.com/reel/DfJzMydkab3/

Daily procedure: see `SKILL.md`.
