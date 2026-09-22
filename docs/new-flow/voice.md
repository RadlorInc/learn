# Lesson voice — expressive, in Stevie

Founder, 2026-09-19: the recorded voice was right, but it **read** every line flat, like somebody reading a page. Two
causes: the lines were written like a textbook, and every clip went through Chatterbox Turbo with no expression.
Samples of four fixes were heard (`/voice-samples.html`); on 2026-09-22 the founder replaced them with the rules below. **Every lesson moves to Stevie**; a lesson switches when its clips are merged
(`LESSON_VOICE` in `src/infra/storage/voicePref.ts`; g5m1-t1/t2 moved to Josh on 2026-09-22).

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

`npx tsx scripts/lesson-voice-corpus.mts` rebuilds both corpora with each row's `style` and render `text`; the key is
still the line as the lesson says it. Rows already on disk are skipped. For a Kaggle run, pack the missing rows with
`scripts/chatterbox-render.py` and the reference wav (the 2026-09-19 pilot zip is the template: a notebook that finds
its corpus under `/kaggle/input`, one process, one zip out).

**Merging a zip:** `unzip <clips>.zip -d public/audio/`, then rebuild that voice's manifest from the files on disk:

```bash
node -e "const fs=require('fs'),d='public/audio/IvUJKFyjVb5hItY9dJAT';fs.writeFileSync(d+'/manifest.json',JSON.stringify(fs.readdirSync(d).filter(f=>f.endsWith('.mp3')).map(f=>f.slice(0,-4)).sort()))"
```

then lower the queued count in `src/__tests__/lessonVoiceClips.test.ts`.

⚠️ **The chalkboard is timed by an estimate**, not the clip: each beat starts when its clip starts, but a mark inside
the beat goes up at (word position ÷ words) × `beatMs(line)`. Expressive pauses move the real word later than the
estimate, so watch the pilot for marks that land early.
