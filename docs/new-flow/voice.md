# Lesson voice — expressive, in Josh

Founder, 2026-09-19: the recorded voice was right, but it **read** every line flat, like somebody reading a page. Two
causes: the lines were written like a textbook, and every clip went through Chatterbox Turbo with no expression.
Samples of four fixes were heard (a `/voice-samples.html` page, deleted 2026-09-26 with the Stevie and Teddy voices); on
2026-09-22 the founder replaced them with the rules below. **Every lesson is in Josh** (`JOSH_MODULES` in
`src/infra/storage/voicePref.ts`); Josh is the only recorded voice since 2026-09-26.

⚠️ **Status (2026-09-22): a pilot.** Only `g5m1-t1` and `g5m1-t2` are written this way, and the 0.5/0.5 and 0.7/0.3
settings come from the document, not from listening. Listen to both topics in the app before writing the next one.

## The rules (founder's two documents, 2026-09-22: "Chatterbox_Audio_Fix" and "Topic_Explanation")

They replace the 2026-09-19 pilot's four styles. **g5m1-t1 and g5m1-t2 are rewritten to them; no other lesson yet.**

### How a teaching screen reads (Screens 2–7)
- A teacher talking to ONE child. Short sentences, one idea each; mix a short line with a longer one.
- Ask a real question at least once, then answer it ("Is there a faster way? Yes.").
- Spoken glue that is allowed: "Look." "Wait." "Here's the part people mix up." "Okay. Your turn."
- Never: "Welcome, student." "Let's dive in." "Great job engaging." "In this module." "As previously discussed."
- Order: situation (Screen 1) → question → one big idea (ONE sentence) → walk the example → the watch-out →
  "Okay. Your turn." (the last beat of Screen 7; Screen 8 is the look-alike problem).
- About 80–160 words for the teach. Longer is split into beats, never a wall.

### Punctuation is the performance
- `.` full stop, `,` a breath, `?` lift and wait, a new beat is a new move, `—` only for a real turn in thought.
- **No `...`, no stacked `!`, no emoji, no ALL-CAPS sentence.** CAPS on one or two words, only the warning word
  ("does not mean ADD 10", "don't slide LEFT").
- ⚠️ **CAPS are for the SCREEN only.** Chatterbox reads a capitalised word letter by letter (`ADD` → "A-D-D"; founder,
  2026-09-22), so `speakable()` lowercases every CAPS word before the voice sees it (AM/PM excepted) and the gate fails
  on any that remain.
- **No tags at all** — no `[happy]`, `[sigh]`, `[pause:…]`, no SSML. `[happy]` is not a Chatterbox command and may be
  read out loud.

### Math on the screen vs math in the mouth
The screen keeps symbols (`1/10`, `×`, `37 × 10`); the render text (`say` in `content/voice/<module>.ts`, or
`speakable()`) says them in words: "one tenth", "times", "a zero". Never "slash", "over" or "open parenthesis".

### The styles — expression comes from the model settings, not markup
| style | model | when |
|---|---|---|
| **A** | Chatterbox Turbo, the words as written | a line nobody has re-voiced yet (the default) |
| **B** | original Chatterbox, `exaggeration=0.5, cfg_weight=0.5` | the everyday teacher |
| **B+** | original Chatterbox, `exaggeration=0.7, cfg_weight=0.3` | the watch-out (Screen 7), more punch |

Settings are `STYLES` in `scripts/chatterbox-render.py`. If the reference voice talks fast, lower `cfg_weight`
toward 0.3. ⚠️ High exaggeration speeds the talk up.

### Unchanged
The chalkboard hangs its marks on words (`at: 'mix'`); a reworded line must keep them, or move the mark — gated by
`lessonsAllModules`. Screen 1 and the problem wording are not reworded (AUTHORING.md rule 4).

## Rendering

⚠️ **Since 2026-09-26 the clips are not in git.** They live in the public `lesson-audio` Storage bucket under
content-hash names (`sha256(bytes)[0:16].mp3`); `scripts/audio/manifest.json` says which line is which object, and each
lesson module carries a small index of its own lines (`src/features/lessons/voice-index/`). The player plays a clip only
when the line's key **and** its check match that index. Never unzip clips into `public/audio/` — `.gitignore` refuses
`public/audio/**/*.mp3`, and the app no longer reads them from there.

1. `npx tsx scripts/lesson-voice-corpus.mts` rebuilds the corpus (`key`, `check`, render `text`, `style`); the key and
   check are the line as the lesson says it. A row is **rendered** when its key is in `scripts/audio/manifest.json`.
2. `python3 scripts/kaggle-josh-notebook.py <grade|module> <branch>` writes a notebook for the rows NOT in the manifest
   (push the corpus and manifest to `<branch>` first — the notebook clones it). It stops at cell 1 if nothing is queued.
3. **Merging a zip:** `unzip -n <zip> -d audio-src/` (the zip holds `nzFihrBIvB34imQBuxub/<key>.mp3`; `audio-src/` is the
   gitignored local clip folder — fill it on a fresh machine with `AUDIO_BASE_URL=<bucket base> node
   scripts/audio/fetch-src.mjs`), then `node scripts/audio/build-manifest.mjs`. It fails on a missing clip, an orphan,
   a duplicate or a hash collision; commit `scripts/audio/manifest.json` and `src/features/lessons/voice-index/`.
4. **Upload before the app needs them.** Put ONLY the new mp3s on a side ref — a commit on an orphan branch holding
   `public/audio/nzFihrBIvB34imQBuxub/<key>.mp3`, tagged `audio-src-<date>` and pushed (a tag does not deploy; it is also
   the backup of those clips) — then run the `upload-audio` workflow **from the PR branch** with `source_ref` = that tag
   (`gh workflow run upload-audio.yml --ref <pr-branch> -f mode=dry-run -f source_ref=<tag>`, then `-f mode=upload`).
   ⚠️ NOT from `main`: the workflow uploads what the manifest OF THE BRANCH IT RUNS ON names, so a run from `main` finds
   nothing missing and goes green having uploaded nothing. The dry run must report exactly as many *missing* as there
   are new clips. docs/legal/AUDIO-ROUND2.md has the key create → run → revoke steps. The uploader checks every object
   already in the bucket against the manifest and needs source files only for the missing ones. Merge the PR only
   after the upload run ends "all N manifest objects present", N = that branch's manifest object count.

⚠️ **The chalkboard is timed by an estimate**, not the clip: each beat starts when its clip starts, but a mark inside
the beat goes up at (word position ÷ words) × `beatMs(line)`. Expressive pauses move the real word later than the
estimate, so watch the pilot for marks that land early.
