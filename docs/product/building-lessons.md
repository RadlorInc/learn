# Building lessons

How a Grade 3–8 module and a KG–2 story chapter are made, from the code as it is on 2026-09-28. What to teach is in
[curriculum.md](curriculum.md); how the lines are voiced is in [voice.md](voice.md); what a child earns is in
[points.md](points.md).

## The process (both kinds)

1. **Topic split.** One skill per topic, picture before number, each topic built on the one before. It goes into
   [curriculum.md](curriculum.md), and **the founder approves it**.
2. **Script.** Every screen's words, pictures and problems, written out for the founder to read. **The founder
   approves it** before anything is built. The founder approves content; nobody else can.
3. **Build.** Written as data by one person, registered by another (below).
4. **Answer key, blind.** Someone who did not write the module solves its questions from what a child sees.
5. **Verify.** The gates are green, and a person has looked at every screen and every board.
6. **Ship.** Every pull request opens as a Draft; only the founder marks one ready.

⚠️ Grade 3 Modules 2–6 and Grades 4–8 skipped steps 1–2 for scripts (the founder's call, 2026-09-14: "no review, build
all"). Grade 3 Module 1 is the only module whose wording the founder approved line by line, and
`src/__tests__/lessonsGrade3Module1.test.ts` holds it word for word: do not reword a syllable of it. When a script is
approved, hold its wording in a test the same way.

## Grade 3–8: the lesson

A lesson is one `Lesson` object (`src/features/lessons/script.ts`). The engine is shared: **a module is data only**.
If a topic cannot be drawn with the pictures that exist, say so rather than invent one.

| screen | in the data | rule |
|---|---|---|
| 1 Hello | `screens[0]` | a real-life picture and the question. No answer asked. Its closing question becomes the button |
| 2 | `screens[1]` | why we can't just do it yet |
| 3 | `screens[2]` | `title: 'The big idea'`, `text` exactly equal to `bigIdea`: **one sentence** |
| 4, 5, 6 | `screens[3..5]` | the worked example, slowly, with the same numbers as Screen 1 |
| 7 | `screens[6]` | `title: 'One thing not to do'`: the one usual mistake, wrong ✕ then right ✓ |
| 8 Now you try | `turn` | almost a copy of the example. `prompt`, `hint1` (after 1 miss), `hint2` (after 2), then worked steps and a `twin` |
| 9 You got it | `won`, `twinWon` | one sentence and a "math word" sticker; `twinWon` uses only the twin's numbers (a twin missed 3 times gets "Let's keep practicing") |
| Practice | `practice` ×5 | `why` in order: `Almost a copy of the lesson`, `Same idea, new numbers`, (any: the idea in a few words), `A little harder`, `Same math in a story` |

Every screen has a `title`, `text` and at least one picture, and at least one picture in the lesson has `motion: true`.
A screen may carry `scene: '<topic id>'`, a drawn backdrop at
`public/assets/lessons/<topic id>.webp` (every Grade 5 topic has one).

### Problems and answers

- Every problem (turn, twin, 5 practice) has `answer` and `steps`. `op` is Grade 3 Module 1 only.
- `steps`: 2–4 short sentences that say why. **The last step contains the answer exactly as the app writes it.**
- `answer` is a number (`1250`, `-3`, `2.75`), `{ frac: [3, 4] }` (any equal value accepted; add `whole` for a mixed
  number, `exact: true` for simplest form only), `{ time: [7, 35] }`, or `{ choices, correct }`.
- The app writes `1,250` and `−3`, and **drops trailing zeros** (`4.50` shows `4.5`), so pick money whose cents do
  not end in 0. A percent is a number.
- Choices only when the answer really is a word or a pick (acute/right/obtuse, `<` `>` `=`, prime/composite): 2–4,
  all plausible. Otherwise the child types.
- The twin has its own `hint1` and `hint2`. No hint states its answer.

### Pictures

The kinds are the `Picture` type in `script.ts`, drawn by `Diagrams.tsx`. See every kind drawn at `/lesson-preview`
(dev server only). Coordinates are data units, never pixels. What people trip on:

- **Screen 8 and practice pictures show the question, never the answer.** No shaded answer, no filled-in total, no
  label that reads the answer. Leave the unknown blank or `'?'` (`answer: null` on `columns`, `hands: false` on a
  clock, `value: null` on `measure`).
- **Size leaks.** A "?" side, circle, tape cell or angle drawn at its answer's size lets a child measure the answer.
  No gate sees this; draw unknowns at a neutral size. An `angle` with a protractor shows its reading.
- Some kinds print values their data does not name: `angle` `parts` draw their degrees, `bars` print their `label`,
  `numline` prints its ticks. Open the preview, do not trust the data alone.
- One picture kind for the teaching (plus `eq`, `cards`, `table` helpers). Do not mix a number line and a bar model.

### Words

- US English and units (metric where the curriculum says metric). Short sentences, to the child. No emoji. Warm:
  never "wrong", "fail", "easy". A name in a word problem is fine; no characters talk.
- **Numbers are numerals** (`It is not 34.`), except counting aloud ("Five, ten, fifteen.").
- **Math words** ("denominator", "array", "perimeter") only on the Screen 9 sticker. Words a child already has
  ("fraction", "multiply") are fine anywhere.
- `×`, `÷` and `−` in anything the child reads; fractions `3/4`, mixed numbers `2 1/2`. `( )` are "parentheses", never
  "brackets" (a shelf bracket is an object and stays).
- Numbers stay inside the grade, small in the demo. Answers exact, unless the topic is estimating (state the rule).

### The teacher: beats and the chalkboard

Screens 2–7 are spoken by a teacher, one line at a time, while she draws on a board. The rules:

- `beats: [{ say, write?, pic? }]`, 2–4 per screen. **The `say`s joined by one space equal `text`, exactly.** Cut at
  sentence boundaries; change both together. `write` (a line on the board) and `pic` (which picture goes up) stage
  the pictures only on a screen without a chalkboard.
- **Screen 1 has no beats** and is not reworded (its question becomes the button). Screen 3 is one sentence, one beat.
- Screens 2–6 ask a real question at least once, then answer it ("Is there a faster way? Yes."). At most one `!` a
  screen, no `...`. Never "Welcome, student", "Let's dive in", "Great job engaging", "In this module", "As previously
  discussed".
- **Screen 7** opens with the beat `Here's the part people mix up.`, names the usual wrong move with one or two CAPS
  warning words ("does not mean ADD 10"), says what to do instead, and ends with the beat `Okay. Your turn.` CAPS
  appear nowhere else.
- Length: the founder's documents say about 80–160 words for Screens 1–7; the house style runs 150–210, and the
  founder kept it (2026-09-22). Not gated.
- **Every teaching screen has a `chalk` board**, shown instead of the pictures, so it carries the whole drawing (keep
  `pictures`: the gates render them). The board is 600 × 400, drawn with the helpers in
  `src/features/lessons/chalk.ts`; colours `w` white, `y` yellow for the result, `b` blue, `r` coral for a warning,
  `d` dim. One file per topic, `content/chalk/<module>/t<n>.ts`, attached with `attachChalk` in the module file.
- **Each mark hangs on a word of its beat** (`[beat, 'word']`) and goes up as she says it. Draw what she says, at that
  word, and nothing before she says it: a result goes up when it is said. Text size 22–40, nothing overlapping, nothing
  near the edge. Screen 7: the wrong move crossed out in coral, the right one in yellow.
- The mark goes up when her clip actually says that word (`word-times/`, rebuilt as in
  [the audio runbook](../runbooks/audio-upload.md)); a new line has the length estimate until then.
- **Look at every board**: `npx tsx scripts/chalk-shot.tsx <topic id> <out.png>`, then open the PNG.

The examples to copy are `g5m1-t1` and `g5m1-t2` (`content/g5m1.ts`, `content/chalk/g5m1/`, `content/voice/g5m1.ts`).

### Practice ladders

Every topic's practice is generated from a **ladder** (`src/features/lessons/ladders/<module>.ts`, registered in
`ladders/index.ts`), and a laddered lesson's player does not ask the five written `practice` problems. They stay in the
data because the gates and the answer key check them.

- A ladder is 4–5 levels, easiest first, and **a harder level is a different kind of question, not bigger numbers**
  (picture → bare numbers → missing number → story → spot the mistake). Each level has a `style` (for authors only)
  and `make(r)`, which picks its numbers from the seeded `r` and computes `answer` and `steps` from them.
- `dataShown: true` only when the picture is the data the answer is read from (a chart, table or number line).
- The rules the child never sees (`adaptive.ts`): two first-try rights → up a level; right after a miss → stay; worked
  steps → down a level; two first-try rights at the top → mastered. A checkpoint every 5 answers; the topic is done
  when mastered or after 12 answers across sessions. The third problem of a lesson's practice reviews the weakest
  earlier topic of the module that is finished and not mastered. Module practice is 10 problems from the weakest topics.

### Registering a module (done by the integrator)

| where | what |
|---|---|
| `src/features/lessons/content/<module>.ts` | the lessons, `export const G4M2: Lesson[]` |
| `content/index.ts` | `CONTENT` entry |
| `modules.ts` | the module title in `TITLES` |
| `catalogue.ts` | its line in `LOADERS`, then `npx tsx scripts/lesson-catalogue.mts > src/features/lessons/catalogue.json` |
| `ladders/<module>.ts`, `ladders/index.ts` | the ladders |
| `content/chalk/<module>/` | the boards |
| `content/voice/<module>.ts`, `content/voice/styles.ts` | the render rows ([voice.md](voice.md)) |
| `src/infra/storage/voicePref.ts` | the module in `JOSH_MODULES`; the voice gate then fails until its clips exist, so it joins in the PR that brings them |
| `src/__tests__/lessonLadders.test.ts` | the module in `LADDERED`, written out by hand |
| `src/__tests__/answerKeys/<module>.ts`, `ladderKeys/<module>.ts` | the blind keys |

**Every new topic, chapter or module needs its row in `lesson_catalog`, in a migration in the same pull request.**
The database pays progress and points only for ids in that table (2026-09-28); `pointsCapAndCatalog.test.ts` fails
until the app's list and the table agree. Until the migration is applied, answers for the new id wait on the child's
device and upload afterwards. A new grade, or a module or topic number past two digits, also needs the column checks
widened: the database accepts only `g3`–`g8` topic ids.

### The blind keys

- **Answer key.** Someone who has not written the module runs `npx tsx scripts/lesson-questions.mjs <module>` (the
  questions and pictures, no answers) and writes `src/__tests__/answerKeys/<module>.ts`: for each topic, 7 answers
  (your turn, twin, practice 1–5) as a child would type them, or the exact choice text. (As of 2026-09-28 plain `node`
  cannot run that script: the content files now import the chalk helpers.)
- **Ladder solver.** Someone who has not read `ladders/` runs `npx tsx scripts/ladder-questions.mts <module>` and writes
  `src/__tests__/ladderKeys/<module>.ts`, a function per topic that answers any sampled question.
- Never give a solver a format example that is a real answer in the module.
- When a key and a lesson disagree, solve it by hand. Do not "fix" whichever side is inconvenient.

### The gates that hold a module

| `src/__tests__/…test.ts` | what it holds |
|---|---|
| `lessonsAllModules` | titles and ids equal [curriculum.md](curriculum.md); the 9-screen shape; answers well formed and stated by the last step; no answer in hints or Screen 9; pictures draw; the answer key agrees; beats equal `text`; chalk marks on real words and on the board |
| `lessonExplainStyle` | the teacher's style above, and every spoken line sayable (`-t <module>` runs one module) |
| `lessonLadders` | ladders of ≥ 4 distinct kinds for every module in `LADDERED`; 60 samples a level well formed, answered, hidden; the solver agrees |
| `lessonsGrade3Module1` | Grade 3 Module 1's approved wording and answers |
| `answerBoxCanExpress`, `lessonScenes`, `lessonCatalogueSplit` | every answer typeable; every backdrop file exists; `catalogue.json` matches |
| `lessonVoiceClips` | every line a lesson speaks has its clip ([voice.md](voice.md)) |

**Done** means those are green for the module and a person has opened `/lesson-preview?module=<module>` and asked of
every Screen 8 and practice picture: does this show the answer?

## KG–2: the story chapter

A chapter is a small game that teaches one skill; it plays at `/game`, never in the lesson player.

- **Registry.** One entry in `CHAPTERS` (`src/core/chapters.ts`): `id` (letters and digits only, at most 40: the
  database stores progress under `c:<id>`), `name` (the title), `hint` (the one typed direction line), `grade`
  (0 = KG), and the rest. Add the id to `ChapterType`, a row to `STORY_CHAPTERS` (`storyChapters.tsx`: backdrop colour
  and loader), and the component under `src/features/chapters/story/`. `CHAPTER_COMPONENTS` in `registry.tsx` fails
  to compile while a chapter is missing. Then update the hand-written lists in `storyModules.test.ts`.
- **Engine.** A chapter is scenes in `StoryWorld`; the teaching is a `Beat` run by `SkillBeat`: `make(tier)` builds a
  question at tier 1–3, `prompt`/`say` ask it, `Play` takes the answer, `Reteach` explains again after 3 misses in a
  row. Mastery is the same rule as a topic's: two first-try rights at the top tier. **One sitting is 5 questions**,
  then the spot is saved and the next sitting carries on. There is no mascot.
- **Progress.** Every correct answer is recorded exactly as a topic's is: one `lesson_progress` row keyed
  `c:<chapter>`, "first try" or "after a miss", points from the database. Finishing the run marks it done.
- **Voice and the question lock.** When a question loads, every line it can lead to is fetched **before** the child
  taps, so what the device asks for never depends on the answer. Declare those lines in the beat's `feedbackLines` and
  `reteachLines` (a guided round calls `useQuestion`); a line left out is spoken by the device voice instead of Josh.
  See [voice.md](voice.md).
- **Directions.** The `hint` is drawn on a card; a chapter that draws its own banner on the top row carries the line
  itself and must be listed in `OWNS_CHROME_ROW` (`src/features/chapters/directions.tsx`).

Gates: `storyModules`, `chapterVoiceCorpus` (every spoken line has a clip row, none says "Milo"), `questionLines35a/b`
and `questionLines68a/b` (what each chapter really says after a tap was declared), `questionLock`, `moneyAnswerBudget`,
`chapterTake`, `chapterRecordsLikeLesson`, `chapterCompletion`, `chapterCastDistinct`, `chapterDirections`,
`storybookQuestions`, `questionQualitySweep`, `gameChapterVoice`, `noChildDataInAudioUrl`.
