# New teaching flow — how to make the next module

**Read this before writing or building any new-flow lesson.** It is the whole process, so a new
session produces Module 2 exactly the way Module 1 was produced (2026-09-13).

## What the new flow is

Every lesson is ONE skill, taught in the fixed 9-screen structure of the founder's
**"Step By Step Script.docx"** (adding fractions with different bottom numbers), using the 5-step
template of **"Math Problem Exp and Exercise Format.docx"**:

| Screen | What it is | Rule |
|---|---|---|
| 1 Hello | real-life picture + the question | no answer asked |
| 2 | why we can't just do it yet (the obstacle) | |
| 3 The big idea | ONE sentence the child can reuse | shown again on a practice miss |
| 4 · 5 · 6 | the idea shown step by step with one picture | at least one step animates |
| 7 One thing not to do | the one common mistake: wrong card ✕ / right card ✓ | one warning only |
| 8 Now you try | almost a copy of the example, one number changed | hint after 1 miss · hint after 2 · then worked steps + a twin |
| 9 You got it | one sentence + "math word" sticker | the math word appears ONLY here. After the twin it uses the twin's numbers ("Text after the twin"); if the twin was also missed 3 times it becomes "Let's keep practicing" with the big idea — never "You got it" |
| Practice | 5 problems: copy · new numbers · same idea · a little harder · word problem | miss → big idea; 2nd miss → worked steps + "watch the lesson again" |

Designer rules from the docs: one idea per screen, short sentences, one picture, small numbers,
no extra characters talking, read-aloud optional, **7 taps before Screen 8**, ~90 seconds.

## The process — always in this order, with a founder check between steps

1. **Topic split.** Split the module into single-skill topics a Grade 3 child can hold — one idea
   each, picture before number, each topic built on the one before, nothing above grade level.
   The approved split for Grade 3 is below; use it, do not re-split.
2. **Write the scripts** as a document for review: `docs/new-flow/grade3-moduleN-scripts.md`,
   copying the exact layout of [grade3-module1-scripts.md](grade3-module1-scripts.md) (Skill/Grade/
   Time header, Screens 1–9 with Title/Picture/Text/Button/Motion/Note, practice table with
   "Why it's here", an **Answers:** line). Mark at the top that every number was written for the
   draft. Check every answer, hint and twin by hand; keep numbers inside that module's range.
   **Stop and get the founder's approval.**
3. **Build** only after approval (see "Building" below).
4. **Verify** (see "Checks").

## Building a module (Module 1 is the reference implementation)

| file | what |
|---|---|
| `src/features/lessons/script.ts` | the flow (pure) + `Picture` / `Op` types + `answerOf` / `workedSteps`. Shared — only add a new `Picture` kind or `Op` type if a module needs one |
| `src/features/lessons/grade3Module1.ts` | **copy this shape** to `grade3ModuleN.ts`: one `Lesson` per topic, text copied verbatim from the approved doc. Each needs `won` AND `twinWon` (only the twin's numbers); the twin's hints are derived (`hintsFor`) |
| `src/features/lessons/Pictures.tsx` | the code-drawn pictures; add a renderer here for any new `Picture` kind |
| `src/features/lessons/LessonList.tsx` · `LessonPlayer.tsx` · `src/app/lesson/page.tsx` | list, player, route. ⚠️ List and route currently know only `GRADE3_MODULE1` — a second module means turning that into a list of modules |
| `src/__tests__/lessonsGrade3Module1.test.ts` | **copy this** per module |

- Lesson ids: `g3m<module>-t<topic>` (e.g. `g3m2-t4`).
- **Answers are derived** from each problem's `op`, never typed into the lesson data. Where a
  problem is not multiplication/division (time, rounding, fractions, area…), add an `Op` type with
  its own `answerOf` and `workedSteps` case.
- ⚠️ **The test's expected answers are WRITTEN OUT from the approved doc's "Answers:" lines**, not
  imported — a check that derives its expectation from the lesson data passes on any typo. Plant
  one wrong number and watch the test go red before trusting it.

## Checks before calling a module done

- `npx tsc --noEmit` · `npm test` · `npx next build`, then bump `public/sw.js` VERSION.
- **Play it in the browser**: one topic through every branch (3 misses → twin → practice misses →
  replay → finish), every other topic straight through, and LOOK at every picture — Module 1's two
  display bugs (rows wrapping into a line, a turned tray overlapping a button) were visible only on
  screen. CSS animations freeze in a background tab; read `getAnimations()` rather than trusting a
  screenshot taken mid-animation.

## Open limits (as of 2026-09-13)

- Progress is per-device (`src/infra/storage/lessonProgress.ts`), not synced; parents/teachers
  cannot pick topics yet. Both need a `chapters` row per lesson id (a migration).
- Lessons are shown to every age band. Objects are simple code-drawn shapes, not art.
- The legacy chapters are hidden behind `LEGACY_CHAPTERS_HIDDEN` in `src/core/chapters.ts`.

## The approved Grade 3 topic split (founder-approved 2026-09-13)

**Module 1 · Multiplication and division with 2, 3, 4, 5, 10** — ✅ scripted and built
1 Plates of cookies (equal groups) · 2 Rows of chairs (arrays) · 3 Turn the tray (3×4 = 4×3) ·
4 Counting by 2s, 5s, 10s · 5 Counting by 3s and 4s · 6 Share the apples fairly (how many in each) ·
7 How many bags can we fill? (how many groups) · 8 The missing number (4 × ? = 20)

**Module 2 · Place value through metric measurement**
| # | What the child sees | The one idea |
|---|---|---|
| 1 | Read the clock to 5 minutes | Each number on the clock is 5 minutes |
| 2 | Read the clock to 1 minute | Count the little marks after the 5s |
| 3 | How long did it take? | Elapsed time by jumping on a line |
| 4 | Heavy or light (grams, kilograms) | Measuring how heavy |
| 5 | How much water? (liters, milliliters) | Measuring how much a container holds |
| 6 | Round to the nearest 10 | Which ten is it closer to? |
| 7 | Round to the nearest 100 | Which hundred is it closer to? |
| 8 | Add big numbers (trade 10 ones for a ten) | Regrouping when adding |
| 9 | Take away big numbers (break a ten) | Regrouping when subtracting |

**Module 3 · Multiplication and division with 0, 1, 6, 7, 8, 9**
| # | What the child sees | The one idea |
|---|---|---|
| 1 | Empty plates (×0) | Zero groups or groups of zero make 0 |
| 2 | One on each plate (×1) | Times 1 keeps the number the same |
| 3 | 6s: five groups and one more | 6 × 4 = 5 × 4 + 4 |
| 4 | 7s | Build 7s from facts you know |
| 5 | 8s: double the 4s | 8 × 3 = double 4 × 3 |
| 6 | 9s: ten groups minus one | 9 × 6 = 10 × 6 − 6 |
| 7 | Break the big fact apart | 7 × 8 = 5 × 8 + 2 × 8 |
| 8 | Multiply by tens (3 × 40) | 3 groups of 4 tens = 12 tens |
| 9 | Two-step stories | Solve the first part, then the second |

**Module 4 · Multiplication and area**
| # | What the child sees | The one idea |
|---|---|---|
| 1 | Cover the floor with tiles | Area = how many squares cover it |
| 2 | Count the rows instead | Area = rows × tiles in a row |
| 3 | Break the rug into two pieces | Split a rectangle, add the parts |
| 4 | An L-shaped room | Area of shapes made of rectangles |

**Module 5 · Fractions as numbers**
| # | What the child sees | The one idea |
|---|---|---|
| 1 | Cut the sandwich fairly | Equal parts only |
| 2 | One piece: 1/4 | Bottom number = how many pieces make the whole |
| 3 | Three pieces: 3/4 | Top number = how many pieces you have |
| 4 | Fractions on a number line | Equal jumps from 0 to 1 |
| 5 | Same amount, different pieces | 1/2 = 2/4 |
| 6 | A whole pizza: 4/4 = 1 | Whole numbers as fractions |
| 7 | Which is bigger? Same pieces cut | 3/8 vs 5/8 |
| 8 | Which is bigger? Same pieces taken | 1/3 vs 1/6 (more pieces → smaller pieces) |

**Module 6 · Shapes, measuring and graphs**
| # | What the child sees | The one idea |
|---|---|---|
| 1 | Picture graph, each picture = 2 | Reading a scaled picture graph |
| 2 | Bar graph | Reading bars against a scale |
| 3 | Measure to the half inch | A ruler has halves and quarters |
| 4 | Line plot of our measurements | Showing measurements on a line |
| 5 | Four-sided shapes | Squares, rectangles, rhombuses — what makes them different |
| 6 | Walk around the fence | Perimeter = the distance around |
| 7 | Same fence, different garden | Same perimeter, different area |

## What to say to start the next session

> Read docs/new-flow/README.md. Write the Module 2 scripts for review, exactly like Module 1.
