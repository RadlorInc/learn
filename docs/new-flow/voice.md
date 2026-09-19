# Lesson voice — expressive, in Stevie

Founder, 2026-09-19: the recorded voice was right, but it **read** every line flat, like somebody reading a page. Two
causes: the lines were written like a textbook, and every clip went through Chatterbox Turbo with no expression.
Samples of four fixes were heard (`/voice-samples.html`), and a partner's feedback was that **no one style wins every
line**. So each line gets its own style. **Every lesson moves to Stevie**; a lesson switches when its clips are merged
(`STEVIE_NOW` in `src/infra/storage/voicePref.ts`).

⚠️ **Status (2026-09-19): a pilot.** Only `g5m1-t1` and `g5m1-t2` are written this way, and the style rule below is
drawn from **7 sample lines, each rendered once** — a render varies by chance, so some of those preferences may be luck.
Listen to the pilot in the app, in order, before writing the next lesson this way.

## The four styles

| style | model | when |
|---|---|---|
| **A** | Chatterbox Turbo, the words as written | a plain explanation — the default |
| **A+** | Turbo with an emotion tag in front: `[happy]` (also `[surprised]`) | a reveal, a trick, a win |
| **B** | original Chatterbox, expressiveness 0.8 | a warning ("here's a trap"), a pattern that builds |
| **B+** | B with `—` pauses, and a sound tag where one fits (`[sigh]`) | a line with a turn in it ("… — but this time, to the right") |

The model settings are `STYLES` in `scripts/chatterbox-render.py`. ⚠️ Each model has its own tags: Turbo knows
`[happy] [surprised] [chuckle] [sigh] [gasp] …` but ignores the expressiveness dial; the original knows sound tags
(`[sigh] [gasp] [giggle] [laughter] …`) but not `[happy]`. ⚠️ And each turns punctuation into speech differently:
**Turbo keeps `...` as a pause, the original turns `...` into a comma** — so A/A+ pause with `...`, B/B+ with `—`.

## Writing a line

1. **Say it the way a teacher would, on screen as well.** Contractions, `!`, a question to the child ("See the
   pattern?"). The screen and the voice use the SAME words — the child reads what she hears.
2. **The render text (`say` in `content/voice/<module>.ts`) adds only** a tag, pauses and punctuation, and spells
   symbols the way she would say them (`1/10` → "one tenth", `×` → "times"; `speakable()` does the common ones for
   a line with no row). Never a word that is not on screen.
3. **At most one emotion tag per screen.** A tag on every line is as flat as none.
4. **No counting lists** ("3... 6... 9... 12!") — disliked in every style in the samples. Put the numbers in a sentence.
5. The chalkboard hangs its marks on words (`at: 'lose'`); a reworded line must keep them, or move the mark.
   Gated: `lessonsAllModules` names the mark and the line.
6. Screen 1 and the problem wording are not reworded (AUTHORING.md rule 4, and the answer checks).

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
