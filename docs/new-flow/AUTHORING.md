# Writing a new-flow module (Grades 3–8)

This is the complete brief for writing one module's lessons as data. Read all of it. The engine is fixed:
**you write data only** — `src/features/lessons/content/g<grade>m<module>.ts` — and never edit the engine files
(`script.ts`, `Pictures.tsx`, `Diagrams.tsx`, `LessonPlayer.tsx`, …). If a topic truly cannot be drawn with the
pictures below, say so in your report instead of inventing a picture kind.

The founder's two source documents, summarised (they are the law):

- **"Math Problem Exp and Exercise Format"** — 5 steps: (1) a real-life picture they already know, (2) ONE big idea in
  one short sentence they can reuse, (3) a picture that moves — ONE drawing, do not mix two different drawings in the
  lesson, (4) one problem worked all the way through with easy numbers, saying WHY each step, (5) warn them about the
  ONE mix-up kids usually make, then hand over a problem that is almost a copy. One idea per screen. Short sentences.
  Big picture. Nothing to solve before "Now you try". Small numbers in the demo; save hard numbers for practice.
- **"Step By Step Script"** — the 9 screens below, then 5 practice problems.

## The 9 screens (what each lesson object must contain)

| # | in the data | rule |
|---|---|---|
| 1 Hello | `screens[0]` | the real-life picture + the question. Do NOT ask for an answer. |
| 2 | `screens[1]` | why we can't just do it yet / why the obvious way fails |
| 3 | `screens[2]` | `title: 'The big idea'`, `text` === `bigIdea` exactly. One sentence (two at most). |
| 4 · 5 · 6 | `screens[3..5]` | the idea step by step with the SAME picture. At least one picture has `motion: true`. |
| 7 | `screens[6]` | `title: 'One thing not to do'` — the one common mistake. Usually a `cards` picture (wrong ✕ / right ✓). |
| 8 Now you try | `turn` | almost a copy of the example, one number changed. `prompt`, `hint1` (after 1 miss), `hint2` (after 2), `twin` |
| 9 You got it | `won`, `twinWon` | one sentence + a "math word" sticker. `twinWon` talks ONLY about the twin (only the twin's numbers). |
| Practice | `practice` ×5 | `why` exactly: `'Almost a copy of the lesson'`, `'Same idea, new numbers'`, `'Still "<idea in 2–4 words>"'`, `'A little harder'`, `'Same math in a story'` |

Screens 1–7 have no answers. 7 taps before Screen 8, about 90 seconds.

## Hard rules (each is checked by `src/__tests__/lessonsAllModules.test.ts` or by the answer-key review)

1. **Titles and ids** — topic titles are copied EXACTLY from `docs/new-flow/curriculum.md`, in order. Ids are
   `g<grade>m<module>-t<n>` (`g4m2-t3`). The lesson `title` is that topic title.
2. **Screen 8 and practice pictures show the QUESTION, never the answer.** No shaded answer, no point at the answer,
   no filled-in total, no label that is the answer. If the answer is 12, nothing in that picture may read 12.
   Leave the unknown as `'?'` or blank (`answer: null` on `columns`, `hands: false` on a clock, `value: null`).
3. **Every problem** (turn, twin, 5 practice) has `answer` AND `steps` (do NOT use `op` — that is Module 1 only).
   `steps`: 2–4 short sentences that say WHY, and **the last step must contain the answer written exactly as the app
   writes it** (see "Answers" below — e.g. `'So the answer is 3/4.'`, `'It is 7:35.'`, `'So 1,250 grams.'`).
4. **The twin** has its own `hint1` and `hint2`. No hint may contain the answer.
5. **`twinWon`** (`text` and `sticker`) may only use numbers that appear in the twin's text or its answer.
6. **Math words** (the vocabulary: "numerator", "denominator", "quotient", "array", "perimeter", "ratio",
   "coefficient"…) are NOT used on Screens 1–7 — say it in plain words there. The math word appears on the Screen 9
   sticker, e.g. `sticker: 'The bottom number is called the denominator.'`. (Words a child already knows from earlier
   topics — "fraction", "multiply" — are fine.)
7. **One picture kind per lesson** for the teaching (Screens 1–6), plus `eq` / `cards` / `table` helpers. Do not mix
   a number line and a bar model in one lesson.
8. **Numbers stay inside the grade and module.** Demo numbers small; practice 4 a little harder; practice 5 a story.
   All answers exact (no "about" answers unless the topic IS estimating, and then state the rounding rule).
9. **Language**: US English and US units where the topic is customary (inches, feet, pounds, cups); metric where the
   curriculum says metric. Short sentences. Talk to the child ("you"). No characters, no names talking — a name in a
   word problem ("Sam has 3 packs") is fine. No emoji. Warm: never "wrong", "fail", "easy".
10. **Choices** (`{ choices, correct }`) only when the answer is genuinely a word or a pick (acute/right/obtuse,
    `<`/`>`/`=`, prime/composite, positive/negative/no trend, which point). 2–4 choices, all plausible. Otherwise the
    child types the answer.

## Answers (`Answer` type in `script.ts`)

| the child answers | write | the app shows it as | also accepted |
|---|---|---|---|
| a number | `answer: 1250` · `answer: -3` · `answer: 2.75` | `1,250` · `−3` · `2.75` | `1250`, `2 3/4` for 2.75 |
| a fraction | `answer: { frac: [3, 4] }` | `3/4` | any equal value: `6/8`, `0.75` |
| a mixed number | `answer: { frac: [1, 2], whole: 2 }` | `2 1/2` | `5/2`, `2.5` |
| a fraction that must be in simplest form | `answer: { frac: [3, 4], exact: true }` | `3/4` | only `3/4` |
| a clock time | `answer: { time: [7, 35] }` | `7:35` | — |
| a pick | `answer: { choices: ['acute', 'right', 'obtuse'], correct: 2 }` | `obtuse` | — |

Numbers ≥ 1,000 are shown with commas (`1,250`), negatives with a real minus sign (`−3`). A negative fraction:
`{ frac: [-1, 4] }` shows `−1/4`. Percent answers are numbers (`answer: 25`, the text asks "what percent?").

⚠️ Trailing zeros are dropped: `answer: 4.50` shows `4.5`. So for money, pick amounts whose cents do not end in 0
(`4.75`, `12.35`), or ask for a whole number of dollars or cents. The last worked step must contain the answer as
shown, e.g. `'So it costs $4.75.'` contains `4.75`.

## Pictures (`Picture` type in `script.ts`, drawn by `Diagrams.tsx` / `Pictures.tsx`)

See every one drawn with sample data at **`/lesson-preview`** (dev server). Coordinates are data units, never pixels.

- **`eq`** `{ kind: 'eq', text: '4 × 3 = 12', lines?: ['…', '…'] }` — big text; `lines` reveal one by one (equation steps).
- **`cards`** `{ kind: 'cards', wrong: '1/2 + 1/4 = 2/6', right: '1/2 + 1/4 = 3/4' }` — Screen 7's Not this / Do this.
- **`table`** `{ kind: 'table', head?: ['x', '1', '2'], rows: [['y', '3', '?']], rowHead?: true, mark?: [[r, c]] }` —
  every row as long as `head`. `mark` highlights cells.
- **`bars`** fraction bars, all the same length: `{ kind: 'bars', bars: [{ parts: 4, shaded: 1, shade2?: 2, split?: 2, label?: '1/4' }], motion? }`
  — `shaded` teal, then `shade2` yellow (to show adding); `split` draws dashed cuts inside every part (animated).
- **`tape`** tape diagram: `{ kind: 'tape', rows: [{ label?: 'Boys', cells: [{ w: 1, text?: '6', shade?: true }], brace?: '30 kids' }], motion? }`
  — cell widths are relative across ALL rows (use it for ratios, parts of a whole, "times as many", percents).
- **`numline`** `{ kind: 'numline', min: 0, max: 1, ticks: 4, labels?: ['0','1/4','2/4','3/4','1'] | 'ends' | 'none',
  points?: [{ at: 0.75, label?, open? }], jumps?: [{ from: 0, to: 0.25, label? }], ray?: { from: 2, dir: 'left', open: true }, motion? }`
  — `ticks` = number of equal gaps (≤ 24); default labels are the tick values; points/jumps must be within min..max.
- **`clock`** `{ kind: 'clock', h: 7, m: 35, hands?: false, fives?: true }` — `fives` prints 05…55 round the outside.
- **`measure`** `{ kind: 'measure', tool: 'ruler' | 'scale' | 'jug' | 'thermometer', min?: 0, max: 6, step: 0.25, labelEvery?: 1, value?: 3.5 | null, unit: 'inches' }`
  — ruler draws an object bar from 0 to `value`; scale a dial needle; jug water level; thermometer red fill. ≤ 60 steps.
- **`blocks`** base-ten: `{ kind: 'blocks', hundreds: 2, tens: 3, ones: 12, trade?: 'ones' | 'tens', motion? }` — `trade` rings ten of them.
- **`columns`** written sum: `{ kind: 'columns', rows: ['348', '275'], op: '+' | '−' | '×', carry?: '11 ', places?: ['H','T','O'], answer?: '623' | null, motion? }`
  — rows are right-aligned by character, so pad decimals yourself (`['12.50', ' 3.75']`). `carry` aligns right too
  (a space where there is no carry). `answer: null` draws an empty answer box; omit `answer` for no answer row.
- **`longdiv`** `{ kind: 'longdiv', divisor: '4', dividend: '96', quotient?: '24', work?: ['−8 ', '16', '−16', ' 0'] }`
  — each work line is aligned to the dividend's columns (a leading `−` is drawn just left of its digits).
- **`grid`** square tiles: `{ kind: 'grid', rows: 3, cols: 5, shade?: [{ r: 0, c: 0, h: 1, w: 5, tone?: 1|2|3|4 }], hide?: [{ r, c, h, w }], top?: '5 ft', left?: '3 ft', split?: { col?: 2, row?: 1 }, motion? }`
  — `hide` cuts cells out (L-shapes); a 10×10 grid is a hundredths / percent grid. ≤ 20 × 20.
- **`area`** area model: `{ kind: 'area', cols: ['20', '3'], rows: ['10', '4'], cells?: [['200', '30'], ['80', null]], widths?: [20, 3], heights?, motion? }`.
- **`poly`** shapes on a plane (y up): `{ kind: 'poly', grid?: true, shapes: [{ pts: [[0,0],[4,0],[0,3]], sides?: ['4 cm', '?', '3 cm'], angles?: [null, '37°', null], names?: ['A','B','C'], right?: [0], ticks?: [0, 2], tone?: 0-4, dashed?, open? }],
  segs?: [{ a: [0,0], b: [0,3], label?, dashed?, arrow?: 'end' | 'both', dots?, tone?: 2 }], circles?: [{ c: [0,0], r: 3, label?: 'r = 3 cm', show?: 'r' | 'd' }], labels?: [{ at: [2,1], text: 'A', tone? }], motion? }`
  — `sides[i]` labels the side from point i to point i+1. Use for polygons, perimeter, composite shapes, symmetry
  lines (dashed seg), points/lines/rays (segs with dots/arrows), parallel & perpendicular lines, transformations
  (original `tone: 1`, image `tone: 2, dashed: true`), the Pythagorean theorem, circles.
- **`angle`** `{ kind: 'angle', deg: 130, protractor?: true, parts?: [35, 55], partLabels?: ['35°', '?'], label?: '?', motion? }`
  — one ray along the bottom, one at `deg`; `parts` splits it into adjacent angles (labels default to `N°`).
  ⚠️ With a protractor the reading IS visible — only use a protractor on teaching screens, or when the question is
  not "how many degrees".
- **`chart`** `{ kind: 'chart', type: 'bar' | 'picture' | 'dot' | 'hist', labels: [...], values: [...], scale?: 2, max?, unit?: 'books', key?: '2 books', xLabel?, yLabel?, motion? }`
  — `picture`: stars, each = `scale` (a half star for an odd remainder); `dot`: a line plot (values = how many ✕ above each label).
- **`plot`** scatter plot: `{ kind: 'plot', points: [[1,2],[2,3]], xMax: 10, yMax: 10, xStep?, yStep?, fit?: [[0,1],[10,9]], xLabel?, yLabel?, motion? }`.
- **`coord`** coordinate plane: `{ kind: 'coord', min: 0 | -6, max: 10, step?: 1, points?: [{ x: 2, y: 3, label?: 'A' }], lines?: [{ a: [0,1], b: [2,5], extend?: true, dashed?, label?: 'rise 4', tone?: 2 }], motion? }`
  — `extend` draws the whole line across the grid; dashed short lines with labels show rise and run.
- **`cubes`** unit cubes: `{ kind: 'cubes', l: 4, w: 3, h: 2, layers?: 1, motion? }` — `layers` < h draws the rest as a dashed outline.
- **`solid`** `{ kind: 'solid', shape: 'prism' | 'cylinder' | 'cone' | 'sphere' | 'pyramid', labels?: { r?, h?, l?, w? } }`.
- **`chips`** signed counters: `{ kind: 'chips', pos: 3, neg: 5, pairs?: 3, motion? }` — `pairs` rings zero pairs.
- **`balance`** `{ kind: 'balance', left: 'x + 4', right: '9' }` — an equation as a level balance.
- **`spinner`** `{ kind: 'spinner', parts: ['red', 'blue', 'red', 'green'], tones?: [3, 4, 3, 1] }` — equal parts.
- Module 1's object pictures also work (`groups`, `array`, `rings`, `share`, `line`, `triangle`, `scatter`) with
  objects `'cookie' | 'chair' | 'plant' | 'muffin' | 'dot' | 'sock' | 'finger' | 'straw' | 'wheel' | 'apple' | 'sticker' | 'crayon'`.

Write multiplication as `×`, division as `÷`, minus as `−` in text that the child reads (`eq`, `cards`, screen text).
Fractions in text are written `3/4` and mixed numbers `2 1/2`.

## Teaching screens are a TEACHER, not a page — `beats` (2026-09-16)

A screen used to show its whole paragraph and its whole picture at once, and it read like somebody
reading a page out loud. It does not any more. **She says one line, puts something on the board, says
the next line.** That is the format, and every teaching screen is written in it.

```ts
{ title: 'Smaller unit: multiply',
  // `text` is the WHOLE screen, still — speech, /lesson-preview and every gate read it.
  text: 'Meters are smaller, so it takes more of them to cover the same distance. Smaller unit, more of them. That means we multiply. 5 × 1,000 = 5,000. So the run is 5,000 m long.',
  beats: [
    { say: 'Meters are smaller, so it takes more of them to cover the same distance.', pic: 0 },
    { say: 'Smaller unit, more of them. That means we multiply.', write: 'smaller unit → multiply' },
    { say: '5 × 1,000 = 5,000. So the run is 5,000 m long.', pic: 1 },
  ],
  pictures: [twoWays(...), eq('5 × 1,000 = 5,000')] },
```

| field | what it is |
|---|---|
| `say` | one line she says. Short — one idea. 2–4 beats a screen. |
| `write` | a line she writes on the board with that say. It stays up. |
| `pic` | the index in `pictures` she puts up with that say. A picture **no beat names is up from the start**. |

### The rules (each one is gated, or is a defect you cannot see)

1. **`beats.map(say).join(' ')` must equal `text`, exactly.** `text` stays the whole screen; it is
   what speech, the preview and every other gate read. Write the beats by CUTTING the text at
   sentence boundaries, then reword — and change both together. Gated.
2. **`pic` must index a real picture.** A `pic` past the end draws nothing and hides nothing: the
   screen looks right while the staging you wrote simply does not happen. Gated.
3. **Everything on the board is DRAWN, by one pen (2026-09-19, founder: "left canvas pe SVG drawing chahiye").**
   Every picture, every `eq`, `table` and `cards`, and every `write` line is SVG; the pen (`usePen` in
   `LessonPlayer.tsx`) traces each line and shape and writes each letter — outline first, then ink — in
   document order. There is no `effect` field any more. The only exception is Module 1's object pictures
   (`groups` `array` `share` `rings` `triangle` `scatter`: drawn art in HTML), which pop up. A new picture kind
   must render SVG or it silently loses the drawing — gated against the real renderer.
   Text in a diagram goes through `T` (or `Ink`) in `Diagrams.tsx`, which splits it into one `tspan` per letter
   so the pen can write it; a raw `<text>` is still drawn, but all its letters at once.
4. **Screen 1 gets NO beats, and its `text` is not reworded either** — the split that makes its
   closing question into the button is a regex over that text.
   ⚠️ So screen 1 keeps the old written-page voice while the rest of the lesson is spoken. That is a
   known seam, not an oversight; changing it means changing how the button is built. Its closing question is split out into the button ("How many…?
   Let's see ▶"); with beats the question would be in both places.
5. **The big idea screen (index 2) GETS BEATS like every other teaching screen** — cut `bigIdea` at
   its sentence break and put the picture up on the first. Its `text` must still equal `bigIdea`
   exactly, so do not reword it. **One beat per sentence** — so a single-sentence `bigIdea` gets ONE
   beat, and a three-sentence one gets three. ⚠️ Never cut mid-sentence to reach some beat count: it
   leaves a beat starting lowercase, which reads as a bug in the source even though it sounds fine.
   One beat is a complete conversion for that screen.
6. **Never write what the picture already is.** If the picture IS `4:15`, she draws it — she does not
   also write `4:15` beside it. Use `pic`, not `write`. ⚠️ This includes a picture's own LABELS: a
   `grid` carrying `left: '3 rows'`, a `tape` with a `brace`, a `numline`'s tick labels. Read the
   picture's data, not just its kind, before writing a board line. ⚠️ And some kinds paint a value
   the data does not name: an `angle` with `parts: [40, 50]` and no `partLabels` still draws `40°`
   and `50°`, a `bars` prints its `label`, a `numline` prints its ticks. When in doubt, open
   `/lesson-preview` or read the component in `Diagrams.tsx` — the data is not the whole picture.
6b. **Name every picture in a beat**, unless you mean it to be up before she says anything. The one
   that catches people is the second picture on a worked screen — the `eq` holding the result. Left
   unnamed it is on the board from the moment the screen opens, and the screen gives away its own
   answer. Not gated: nothing can tell a deliberate opening picture from a spoiled reveal.
7. **Beat order is board order.** Everything is laid out in the order the beats fire, so a thing
   already up never moves. Beats may name pictures in any order (`pic: 1` before `pic: 0`) when that
   is the teaching order — the board follows the beats, not the array.

### What she writes

Two kinds of line go on the board, and no third:

- **a rule in her words** — `smaller unit → multiply`, `more than → +`, `open dot = not included`,
  `3n = 3 × n`. The one a child could carry to the next problem.
- **a working note** — a result she records as she goes, the way `g3m2-t1` writes `Hour: 4` and then
  `Minutes: 15` before putting them together. Fine, and often the honest thing on a worked screen.

What is **never** a board line is the equation or value the picture already shows. That is rule 6,
and it is the one this collides with: on most worked screens the `eq` picture IS the equation, so
writing it again is duplication, not teaching. If neither a rule nor a working note fits a screen,
she does not write on it — she talks and puts a picture up. That is normal; both worked examples
have such screens.

One beat may carry **both** `pic` and `write` — she draws a thing and writes the rule under it in one
breath. Allowed, and right when the drawing and the rule are the same move; keep them separate when
they are two moves, or the board crowds.

### The voice

US English, spoken, warm, to the child. Contractions where a teacher would use them. Cut a beat at
the point she would stop to write. Some beats say nothing on the board at all — she is talking, and
that is right.

⚠️ **`text` is also what "Read it to me" speaks aloud**, so write lines that survive being spoken.
An aside that looks warm on screen ("nope", "Same deal.") can land oddly in a synthetic voice — keep
it warm, keep it a sentence.

**Numbers are numerals** — `It is not 34.`, never `thirty-four`. This is a math screen and the digits
are what the child is looking at. ⚠️ **The one exception is COUNTING ALOUD**, where she is making a
rhythm rather than naming a value: `g3m2-t1` says *"Five, ten, fifteen."* and that is right — write
the count the way she would say it, and the value she lands on as a numeral (`That is 15 minutes.`).

Read the two worked examples before writing: **`g5m1-t5`** (`content/g5m1.ts`, metric units) and
**`g3m2-t1`** (`content/g3m2.ts`, reading a clock). Match those.

⚠️ **Grade 3 Module 1 (`grade3Module1.ts`) is the exception: its wording is founder-APPROVED and
checked against the script document word for word.** Its screens get beats by CUTTING the existing
text only. Do not reword one syllable of it.

## Practice is ADAPTIVE where a topic has a ladder (2026-09-17, Grade 5 · Module 1 first)

Founder's call: **difficulty is not bigger numbers — a harder question is a different KIND of question.** A laddered topic's
practice is generated, not the 5 written problems. Engine: `src/features/lessons/adaptive.ts`; ladders:
`src/features/lessons/ladders/<module>.ts` (registered in `ladders/index.ts`); per-topic standing per device:
`src/infra/storage/lessonStanding.ts`.

- **A ladder** = 4–5 `Level`s, easiest first. Each has a `style` (authors only, never shown) and `make(r)`, which picks its
  own numbers with the seeded rng and returns `{ text, picture, answer, steps }`. The answer and steps are computed from the
  numbers, so they cannot disagree. Typical climb: with a scaffold/picture → bare numbers → pick the true one / spot the
  mistake → missing number, work backwards → story → two-step story. Choose what fits the skill.
- **The rules** (in `step`, never shown to the child): two first-try rights → up a level · right after a miss (or after
  tapping Hint) → stay · worked steps → down a level · two first-try rights at the top → mastered, practice ends · or 12
  problems. First visit starts one level up if Screen 8 was right first try; a return visit starts where the child left off.
- **Topics come back.** The 3rd problem of a lesson's practice is from the weakest earlier topic of the module that the child
  finished and has not mastered (its own big idea, worked steps, and a link to its lesson). Module practice is 10
  problems, each from the weakest topic (a topic already asked counts two levels up, so two weak topics cannot take them all).
- **The gate** (`src/__tests__/lessonLadders.test.ts`): every topic of a module in `LADDERED` has a ladder; no two levels ask
  the same kind of question once every number is stripped (watched failing on a numbers-only ladder); 60 samples per level
  are well formed, reach their answer in the last step, and do not show it in the picture (a table is read row-joined — a
  place chart spells 1,100 as 1|1|0|0); and every sample agrees with an **independent solver**
  (`src/__tests__/ladderKeys/<module>.ts`) written from `npx tsx scripts/ladder-questions.mts <module> [n] [topics]` alone,
  never from `ladders/`. On g5m1 the solver found one real defect the writer's own checks missed: two correct choices when
  the multiplier equalled an addend.
- **Every built module is laddered (2026-09-17)** — 36 modules, 282 topics, `LADDERED` lists them all. One writer agent per
  module, then one blind solver per module. When a solver disagrees, measure which side is wrong before fixing either.
- **What the gate reads as "the picture shows the answer"** — learned by getting it wrong three times, keep it this way:
  - a number the picture's own text LABELS print, with each list of strings also read joined (a place chart spells
    1,100 as 1|1|0|0). Numbers the renderer draws from numeric data (a clock's 1–12, a jug's marks, a line's ends, a
    needle) are SCALES, not reveals — reading a scale is the skill;
  - a right choice matched as a whole word in a single label, or equal to a joined row (732|408 joined contains "324" by
    accident; "unlikely" does not show "likely");
  - `Level.dataShown: true` exempts a level whose picture IS the data the answer comes from (a median in its data set) —
    only on chart/table/numline pictures.
- ⚠️ **The gate cannot see a SIZE leak**: a "?" side, circle, tape cell or angle drawn at its answer's size lets a child
  measure the answer. An audit on 2026-09-17 found 8 across the ladders and they were fixed (g3m5, g3m6, g4m5, g6m6,
  g7m4 ×2), and two blind keys (g3m6, g6m6) were found REQUIRING the leak — their picture checks now reject it. Draw every
  unknown at a neutral size. Typed-angle levels keep true sizes (nobody reads 115° by eye); CHOICE levels must not.
- **The fraction answer box has a "−" key** when any answer in the lesson (ladder samples included) is a negative fraction
  — it had none, and g8m2-t2's −3/4 could not be typed by anyone (`answerBoxCanExpress.test.ts`, watched red on it).
- **To ladder a new module:** writer → blind solver → add the id to `LADDERED` → gate green.
  The lesson's written `practice` stays in the data (the all-modules gate and answer keys still check it) but a laddered
  lesson's player no longer asks it.

## A complete example (the shape to copy)

```ts
import type { Lesson } from '../script'

export const G3M2: Lesson[] = [
  {
    id: 'g3m2-t1', title: 'Read the clock to 5 minutes', skill: 'Tell time to the nearest 5 minutes',
    bigIdea: 'The long hand counts by 5s. Each number on the clock is 5 more minutes.',
    screens: [
      { title: 'When does the show start?', text: 'The show starts when the clock looks like this. What time is it?',
        pictures: [{ kind: 'clock', h: 4, m: 15 }] },
      { title: 'The numbers are not the minutes', text: 'The long hand points at the 3. But it is not 3 minutes. The numbers count the hours, not the minutes.',
        pictures: [{ kind: 'clock', h: 4, m: 15 }] },
      { title: 'The big idea', text: 'The long hand counts by 5s. Each number on the clock is 5 more minutes.',
        pictures: [{ kind: 'clock', h: 4, m: 15, fives: true }] },
      { title: 'Read the short hand first', text: 'The short hand is just past the 4. So the hour is 4.',
        pictures: [{ kind: 'clock', h: 4, m: 15 }] },
      { title: 'Count by 5s', text: 'Start at the top. Count 5s to the long hand: 5, 10, 15.',
        pictures: [{ kind: 'clock', h: 4, m: 15, fives: true }, { kind: 'eq', text: '5, 10, 15', lines: ['15 minutes'] }] },
      { title: 'Put it together', text: 'Hour 4, 15 minutes. We write 4:15.',
        pictures: [{ kind: 'eq', text: '4:15' }] },
      { title: 'One thing not to do', text: "Don't read the number the long hand points to. Pointing at 3 means 15 minutes, not 3.",
        pictures: [{ kind: 'cards', wrong: '4:03', right: '4:15' }] },
    ],
    turn: {
      text: 'What time does this clock show?', picture: { kind: 'clock', h: 2, m: 25 },
      answer: { time: [2, 25] }, steps: ['The short hand is just past the 2, so the hour is 2.', 'The long hand is on the 5. Count by 5s: 5, 10, 15, 20, 25.', 'It is 2:25.'],
      prompt: 'Read the short hand for the hour. Count by 5s for the minutes.',
      hint1: 'Which number is the short hand just past?',
      hint2: 'The long hand is on the 5. Count by 5s five times.',
      twin: { text: 'What time does this clock show?', picture: { kind: 'clock', h: 9, m: 40 },
        answer: { time: [9, 40] }, steps: ['The short hand is past the 9, so the hour is 9.', 'The long hand is on the 8. Count by 5s eight times: 40.', 'It is 9:40.'],
        hint1: 'Which number is the short hand just past?', hint2: 'The long hand is on the 8. Count by 5s eight times.' },
    },
    won: { text: 'You found the hour, then counted by 5s.', sticker: 'The long hand is the minute hand. It counts by 5s.' },
    twinWon: { text: 'You found the hour, then counted by 5s to 40.', sticker: 'The long hand is the minute hand. It counts by 5s.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'What time is it?', picture: { kind: 'clock', h: 6, m: 10 }, answer: { time: [6, 10] }, steps: ['Hour: 6.', 'Long hand on the 2: 5, 10.', 'It is 6:10.'] } },
      …
      { why: 'Same math in a story', problem: { text: 'Mia starts reading when the clock shows this. What time does she start?', picture: { kind: 'clock', h: 7, m: 55 }, answer: { time: [7, 55] }, steps: ['…', 'It is 7:55.'] } },
    ],
  },
]
```

(⚠️ In that example the Screen 8 clock shows the hands — that is the QUESTION for a "read the clock" topic, so it is
allowed. For a "what time will it be after 20 minutes?" question, the picture shows the START time, never the end.)

## Your deliverable

1. `src/features/lessons/content/<moduleId>.ts` exporting `export const <MODULEID_UPPER>: Lesson[]` (e.g. `G4M2`), one
   lesson per curriculum topic, in order.
2. Nothing else. Do not edit `content/index.ts`, tests, or engine files — the integrator registers the module.
3. Before you finish, check every answer by hand, twice, and read every Screen 8 / practice picture asking "does
   this show the answer?". Then report: the file path, anything you could not draw, and any topic you think is
   pitched wrong for the grade.

## Drawn backdrops (Screen 1)
A topic's Screen 1 may carry `scene: '<topic id>'`, drawn behind its picture from `public/assets/lessons/<topic id>.webp`
(Grade 3 Topic 1 uses `table`; every Grade 5 topic has its own, 2026-09-14). Made with Higgsfield Nano Banana 2 at 1k 16:9,
`table.webp` as the style reference, objects at the sides and bottom and a plain centre so the diagram stays readable;
saved at 1200 px wide, WebP q72 (~30 KB). `lessonScenes.test.ts` fails if a named scene has no file.
