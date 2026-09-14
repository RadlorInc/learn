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

## The process (changed 2026-09-14)

⚠️ **For Grade 3 Modules 2–6 and Grades 4–8 the founder chose "no review, build all"** — no script document, no
approval step. The topic split for every grade is in [curriculum.md](curriculum.md); every module is written straight
into data following [AUTHORING.md](AUTHORING.md), which is the complete brief (rules, answer types, every picture kind).
Module 1 below keeps its approved script document and its own test.

1. **Write** `src/features/lessons/content/<moduleId>.ts` (e.g. `g4m2.ts`) exactly per AUTHORING.md, and register it in
   `content/index.ts`. Data only — the engine (`script.ts`, `Pictures.tsx`, `Diagrams.tsx`, the player) is shared.
2. **Answer key, independently.** Someone who has NOT written the module runs `node scripts/lesson-questions.mjs <moduleId>`
   (questions + pictures, no answers) and writes `src/__tests__/answerKeys/<moduleId>.ts`. A module without a key fails.
3. **Gate:** `src/__tests__/lessonsAllModules.test.ts` — titles match curriculum.md, the 9-screen structure, well-formed
   answers whose last worked step states them, hints/Screen 9 that don't leak numbers, every picture renders, and the
   key agrees. Where lesson and key disagree, re-solve by hand; do not "fix" whichever is inconvenient.
4. **Look:** `/lesson-preview?module=<moduleId>` (dev only) shows every screen, Screen 8, twin and practice picture with
   its answer. Read every Screen 8 / practice picture asking "does this show the answer?".

## Building (where things live)

| file | what |
|---|---|
| `src/features/lessons/script.ts` | the flow (pure), `Picture` / `Answer` types, `isCorrect`, `showAnswer` |
| `src/features/lessons/Diagrams.tsx` | every Grades 3–8 diagram (bars, number lines, clocks, rulers, grids, shapes, graphs, coordinate plane…) |
| `src/features/lessons/AnswerInput.tsx` | number / fraction / time / choice answer boxes (shape decided per lesson, never per problem) |
| `src/features/lessons/modules.ts` | every grade's modules (titles from the curriculum PDFs), `findLesson`, `mixedPractice` |
| `src/features/lessons/grade3Module1.ts` + `lessonsGrade3Module1.test.ts` | Module 1 (uses `op`, derived answers; its test reads the approved script doc word for word) |
| `/modules?grade=N` · `/lesson?module=…` · `/lesson?id=…` · `/practice?module=…` | grade tabs home, topic path, player, mixed practice |

## Open limits (as of 2026-09-14)

- Progress is per-device (`src/infra/storage/lessonProgress.ts`), not synced; parents/teachers
  cannot pick topics yet. Both need a `chapters` row per lesson id (a migration).
- Every child sees grade tabs 3–8 (no grade is assigned yet). Founder's call 2026-09-14: parents will see all modules and pick the topics — not built yet.
- Objects are simple code-drawn shapes; Topic 1 of Module 1 has drawn art (Higgsfield).
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
