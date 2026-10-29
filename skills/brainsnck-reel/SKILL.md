---
name: brainsnck-reel
description: Make one BrainSnck Instagram reel end to end (pick a fresh topic, fact-check, write the script, render it with the engine, host it, post or send for approval, log it). Use for every scheduled BrainSnck run or when asked to make a BrainSnck reel.
---

# BrainSnck reel run

One run = one reel. Work through the steps in order. If any step fails, do not post anything:
send the person one short message saying which step failed and why, then stop.

The repo is `SHREYJAIN134/brainsnck` (GitHub). Everything that must survive between runs lives there:
the engine, `config.json`, `log/topics.json` and the posted videos (as release assets).

## 1. Get the repo and set up

1. Attach the repo with push access (`add_repo`, access `push`) and clone it into the working directory.
2. Run `./setup.sh`. It installs what is missing and downloads the voice. It must end with `setup ok`.
3. Read `config.json`. Today's date in India time decides the mode:
   - on or before `approval_until` → **approval mode** (the person approves each reel before it posts)
   - after it → **auto mode**

## 2. Pick a topic

Read `log/topics.json`. Choose a topic inside `config.niche` that:
- repeats no fact and no near-identical title from the log
- is a different sub-area from the last 2 entries (for example, not space twice in a row)
- has three facts that are surprising, easy to picture, and checkable

Good shapes: "3 facts about X that sound fake", "3 things your body does without you noticing".
Avoid health advice, politics, religion, tragedies and anything about real private people.

## 3. Check every fact on the web

For each fact, search and open at least one reliable source (space agencies, Smithsonian, universities,
encyclopaedias, major science outlets). Use the source's numbers, and say "about"/"around" for rounded ones.
If a fact cannot be confirmed, replace it. Put the source URLs in the script's `sources`.

## 4. Write the script

Save to `scripts/<YYYY-MM-DD>_<HHMM>_<slug>.json`. Shape (see `scripts/space_fake_facts.json` for a full example):

```json
{"title": "...", "series": "BrainSnck", "handle": "@BrainSnck", "theme": "space",
 "scenes": [hook, fact, fact, fact, cta], "caption": "...", "hashtags": ["#brainsnck", "..."], "sources": ["..."],
 "thumb": {"title": "3 space facts that sound *fake*", "icon": "Ringed planet", "minis": ["Glowing star", "Comet"]}}
```

`thumb` drives the cover image: a punchy title (≤ 32 characters, so it fits on two lines; emphasise one word),
one hero icon and up to two small icons. Optional `badge` (default "DID YOU KNOW?").

Write `say` lines the way a person talks, so the narration sounds human, not read out:
- Short sentences, contractions ("it's", "you're"), and a reaction now and then ("Wait, what?", "Crazy, right?").
- `...` makes a real pause (use once or twice per reel, e.g. "Okay... three facts"), and ` — ` a short beat
  before a reveal ("it burns around — *20%* of your energy!"). Neither shows in the captions.
- `!` and `?` change the intonation; `*emphasis*` also slows that sentence slightly. Don't overuse any of them:
  one or two per scene.
- Example: `scripts/brain_facts_v2.json`.

`voice`: the narrator, `"female"` or `"male"` (defined in `config.voices`). Reels alternate: use the voice that the
most recent entry in `log/topics.json` did **not** use (if that entry has no `voice`, treat it as `"male"`).

Every scene has `layout` and `say` (what the voice reads). Wrap stressed words in `*...*`; a span may cover
several words (`*a billion tons*`). Fact scenes are numbered automatically.

| layout | fields |
|---|---|
| `hook` | `text` (on-screen title, ≤ 36 chars), `icon`, `minis` (0–2 small icons) |
| `ring` | `headline`, `icon`, `value` (0–100, a percent), `sync` (word in `say` where the ring fills), `label`, `note` |
| `counter` | `headline`, `icon`, `value`, optional `prefix` / `suffix` / `decimals` / `from`, `sync`, `label`, `note` |
| `compare` | `headline`, `left` and `right` = `{icon, title, value, color, hi}`, `left_sync`, `right_sync` |
| `list` | `headline`, `items` (2–3 of `{icon, text, sync}`) |
| `big` | `headline`, `icon`, `label`, `note` |
| `cta` | `text`, `icon` (use `Brain`), `pointer` (use `Backhand index pointing up`) |

Rules that keep the layout clean:
- Use three different fact layouts per reel.
- `headline` ≤ 21 characters so it stays on one line. Compare `value` ≤ 9 characters, compare `title` ≤ 13.
- Counter: `bignum` text (prefix + number + suffix) ≤ 6 characters, e.g. `86B`, `8 MIN`.
- `sync` must be a word that appears in that scene's `say`.
- Whole reel ≤ `config.max_reel_seconds` (about 85–100 spoken words in total).
- Icons are Microsoft Fluent 3D emoji names; check they exist with `grep -i "^assets/<name>/" engine/emoji_index.txt`.
- `theme`: `space`, `ocean`, `nature`, `bio` (brain and body), `tech`, `history`, or `bokeh` (anything else).
- The `cta` scene says: "Follow BrainSnck for a new brain snack every day."
- `caption`: one hook line with one emoji, the three facts as a numbered list, then a question and
  "Follow @BrainSnck for a daily brain snack." `hashtags`: `config.hashtag_count` tags, always including `#brainsnck`.

## 5. Preview, render, check

1. Preview stills, one inside each scene (scene times print in `out/<name>_build/data.js`):
   `python3 engine/make_reel.py scripts/<file>.json out/<name>.mp4 --preview 2,8,14,20,26`
   Look at every still. Fix any wrapped headline, clipped value or overlapping text in the script and preview again.
2. Full render, in the foreground with a 10-minute timeout (about 5 minutes):
   `python3 engine/make_reel.py scripts/<file>.json out/<name>.mp4`
3. Check: `ffprobe` duration matches the build; `ebur128` integrated loudness is −14 ± 1 LUFS;
   `blackdetect` and `freezedetect` report nothing; a contact sheet of 10 frames looks right.
4. Cover image (every reel gets one): `cd engine && python3 make_thumb.py ../scripts/<file>.json ../out/<name>.jpg`
   Look at it in full and as the profile-grid crop (`crop((0, 240, 1080, 1680))`): the title must be whole and readable,
   nothing important outside the crop. Fix the `thumb` block and re-render if not.

## 6. Host the video

Instagram only takes a public URL. Videos live on the `media` branch, which is kept as a single commit
holding only the last 3 days of videos so the repo does not grow (GitHub releases are not allowed from these sessions).

1. `git fetch origin media`, then make a worktree on a new orphan branch:
   `git worktree add --orphan -b media-new <tmpdir>`
2. Copy into `<tmpdir>/videos/` the new MP4 and its cover JPEG with the same base name
   (`<YYYY-MM-DD>_<HHMM>_<slug>.mp4` and `.jpg`), plus any files from `origin/media:videos/` whose date prefix
   is within the last 3 days (`git show origin/media:videos/<f> > <tmpdir>/videos/<f>`).
   Keep the branch README: `git show origin/media:README.md > <tmpdir>/README.md`.
3. Commit and force-push it over the media branch: `git push --force origin media-new:media`.
4. The URLs are `https://raw.githubusercontent.com/SHREYJAIN134/brainsnck/media/videos/<file>.mp4` and `.jpg`.
   Confirm with `curl -sIL <url>` that each ends in HTTP 200 and `content-length` equals the file size.

## 7. Publish (Zapier, Instagram for Business)

Full caption = `caption` + blank line + hashtags joined by spaces.

- **Approval mode:** send the person the video and its cover image (`SendUserFile`, status `proactive`) and one
  message with the caption, the three sources, and: reply "post" to publish or tell me what to change. Then stop.
  Publish only after they reply "post" in this session. Apply any change they ask for, re-render, re-check, send again.
- **Auto mode:** publish straight away.

To publish, use the Instagram Graph API through Zapier's raw request actions (the ready-made `publish_video`
action gives up while Instagram is still processing the video, so it is not used). Every call goes to
`selected_api` `InstagramBusinessCLIAPI` with `connection_id` = `config.zapier_instagram_connection_id`;
`IG` below means `config.instagram_page_id`.

1. Check the account: `inspect_zapier_actions` on `instagram_for_business_publish_video` with
   `enum_property` `instagramPageId` must list `IG` with the label BrainSnck. If not, stop and ask.
2. Create the container (`instagram_for_business_make_api_mutating_request`, method POST,
   url `https://graph.facebook.com/v21.0/IG/media`, header `Content-Type: application/json`,
   body JSON `{"media_type": "REELS", "share_to_feed": true, "video_url": <mp4 url>, "cover_url": <jpg url>,
   "caption": <full caption>}`). It returns the container `id`. Always include `cover_url`.
3. Poll (`instagram_for_business_make_api_get_request`, url `https://graph.facebook.com/v21.0/<container id>`,
   querystring `fields=status_code,status`) about once a minute (wait with a Monitor running `sleep 60`)
   until `status_code` is `FINISHED`. Stop and report if it is `ERROR`/`EXPIRED` or not finished after 10 minutes.
4. Publish: POST `https://graph.facebook.com/v21.0/IG/media_publish` with body `{"creation_id": "<container id>"}`.
   It returns the media id. Then GET `https://graph.facebook.com/v21.0/<media id>?fields=permalink` for the link.

If Instagram returns an error, report it word for word and stop. Create at most two containers per run,
and before a second one check `GET .../IG/media?fields=id,caption,timestamp&limit=5` so nothing posts twice.

## 8. Log and report

Append to `log/topics.json`: `date`, `time`, `slug`, `title`, `voice`, `facts` (one line each), `sources`,
`video_url`, `cover_url`, `status` (`posted` with the media id/permalink if returned, or `awaiting approval`).
Commit the script and the log, push to `main`.
Finish with one short message: the title, the status and the link.
