# Rewriting a topic's explanation (founder, 2026-09-22)

Every topic's teach (Screens 2–7) is rewritten to the founder's two documents — **"Topic_Explanation"** and
**"Chatterbox_Audio_Fix"** — and every teaching screen gets a **chalkboard that draws exactly what she says**.
The finished examples are **`g5m1-t1` and `g5m1-t2`** (`content/g5m1.ts`, `content/chalk/g5m1/t1.ts`, `t2.ts`,
`content/voice/g5m1.ts`). Read them first, and match them. Voice rules: [voice.md](voice.md). Lesson rules: [AUTHORING.md](AUTHORING.md).

**Done means:** `npx vitest run src/__tests__/lessonExplainStyle.test.ts src/__tests__/lessonsAllModules.test.ts -t <module>`
is green for the module, and you have LOOKED at every board with `npx tsx scripts/chalk-shot.tsx <topic> <out.png>`.

## What you change, and what you never touch

| change | never touch |
|---|---|
| Screens 2–7: `text`, `beats` (and screen `title`s 2, 4, 5, 6 if they no longer fit) | Screen 1 (its text becomes the button) |
| `bigIdea` (Screen 3's text must equal it exactly) | `turn`, `twin`, `practice`, `won`, `twinWon`, `skill`, `title`, `id` |
| every teaching screen's `chalk` | the ladders, answer keys, engine files |
| the module's render rows in `content/voice/<module>.ts` | other modules' files |

Keep each screen's `pictures` array (the gates render them, and they are the fallback), and keep every `pic` index valid.
Keep the lesson's worked example — the same numbers as Screen 1. The math must stay exactly right.

## The text — strictly the documents

- A teacher talking to ONE child. Short sentences, one idea each; mix a short line with a longer one. Warm, calm.
- Order across the screens: **situation** (Screen 1, fixed) → **the question / why we can't just do it yet** (Screen 2) →
  **the big idea, ONE sentence** (Screen 3, one beat) → **walk the example out loud, slowly** (Screens 4–6) →
  **the watch-out** (Screen 7) → hand-off.
- Ask a **real question at least once** in Screens 2–6, then answer it ("Is there a faster way? Yes.").
- Allowed glue: "Look." "Wait." "Here's the part people mix up." "Okay. Your turn."
  Never: "Welcome, student." "Let's dive in." "Great job engaging." "In this module." "As previously discussed."
- **Screen 7** is exactly: beat 1 `Here's the part people mix up.` · the usual wrong move in plain words with ONE (at most
  two) CAPS warning word ("does not mean ADD 10", "don't slide LEFT") · why / what to do instead · last beat `Okay. Your turn.`
- Punctuation is the performance: `.` full stop, `,` a breath, `?` lift. `—` only for a real turn in thought.
  ⚠️ The CAPS word is for the child's EYE: the voice is given it in lowercase (Chatterbox spells capitals: ADD → "A-D-D"),
  which `speakable()` does for you — never put CAPS in a `say`.
  **No `...`, no emoji, no stacked `!`, at most one `!` per screen** (the teach usually needs none). No CAPS outside Screen 7.
- About **80–160 words** for Screens 1–7 together; longer is split into beats, never a wall. 2–4 beats a screen.
- AUTHORING.md still holds: numerals on screen (`37 × 10`), no math-vocabulary words on Screens 1–7, never "wrong",
  "fail", "easy", US English, beats cut at sentence boundaries and joined with one space equal `text`.

## The voice rows — `content/voice/<module>.ts`

One row per teaching line and the big idea: `'<line exactly>': { style: 'B' }` — **`B+` for Screen 7's lines except
`Okay. Your turn.`** (which is `B`). Add `say` only when the line has something `speakable()` (in `voice/styles.ts`)
cannot say — the gate names it: "voice reads a symbol: …". Then `say` is the same words with the math spoken:
`2/8` → "two eighths", `4:15` → "four fifteen", `(x + 2)` → "x plus 2, all together", `3²` is handled, `km/h` → "kilometers
per hour". Never "slash", "over" (unless teaching the fraction bar), "open parenthesis". **Lines outside the teach**
(Screen 1, the Screen 8 question, hints, Screen 9) are spoken too and the same gate checks them — give any that fail a
row with style `A` and a `say`. A line said in two topics needs ONE row (a repeated key is a TypeScript error).

## The chalkboard — it is what the child SEES while she talks

A screen with `chalk` shows the chalkboard **instead of** its pictures, so the board must carry the whole drawing:
the chart, the bars, the number line, the equation. Board is **600 × 400**. Helpers in `src/features/lessons/chalk.ts`:
`write` `line` `box` `wash` `cells` `arrow` `span` `hop` `cross` `ring` `person` `clock` `ticks` `clockFace` `hand`
`clockHop`. Colours: `w` white (default), `y` yellow (the result / what matters), `b` blue (the other direction / second
thing), `r` coral (warning, ✕), `d` dim (labels, headings).

- One file per topic: `content/chalk/<module>/t<n>.ts` exporting `T<n>: (ChalkMark[] | undefined)[]` indexed by screen
  (index 0 = Screen 1 = `undefined`), a module `index.ts` exporting `<MODULE>_CHALK`, and at the bottom of the module file
  `attachChalk(<MODULE>, <MODULE>_CHALK)`. Copy the shape of `content/chalk/g5m1/`.
- **Every mark is tied to a word she says**: `[beat, 'word']`. It appears as she says that word. Draw the thing the word
  names, at that word — the "4" at "4", the arrow at "slide", the ✕ at "not". The word must be in that beat (the gate checks).
- **Draw what she says, precisely, and nothing she has not said yet.** A result goes up when she says it, never before.
  If she says "10 tens make 1 hundred", the board gets `10 tens = 1 hundred` at "hundred". If a line needs no drawing,
  it gets none.
- Legible and tidy: text size 22–40 (labels 20–24), nothing overlapping, nothing within ~10px of the edge, rows aligned.
  Laid out top to bottom in beat order, so nothing already up has to move.
- Screen 3 (big idea) shows the idea as a picture, not the sentence written out.
- Screen 7: the wrong move crossed out (`cross`, coral) and the right one in yellow, like g5m1-t1/t2.

**Look at every board.** `npx tsx scripts/chalk-shot.tsx <topic> /tmp/x.png`, then open the PNG. Ask of each board: does
it draw what each line says, at the right word? Is every mark legible? Does anything overlap or run off? Does the board
show an answer before she says it? Fix and look again. A board you have not looked at is not done.
