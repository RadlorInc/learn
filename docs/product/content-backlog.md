# Content backlog

Lesson and chapter content still to write, read, hear or fix. Each line says what, why, and its status as of
2026-09-28. When an item is done, delete its line in the same pull request. The curriculum itself is in
[curriculum.md](curriculum.md); how content is built is in [building-lessons.md](building-lessons.md).

## To write

- **Grade 2 place value to 1,000 (a hundreds shelf).** The Tens & Ones chapter (`placeValue`, `BuildingBlocks.tsx`)
  is Grade 1: tens and ones, targets 11 to 99, and since 2026-09-27 a child can build at most 100. Grade 2's place
  value is hundreds, tens and ones to 1,000, and no Grade 2 chapter covers it. It needs a hundreds shelf and a chapter
  of its own (or a Grade 2 tier of this one), not a higher cap on this one. *Status: the founder's call (2026-09-27),
  build later, not now.*
- **A recorded voice for practice problems.** The ladders generate practice with random numbers, so there is no fixed
  set of lines to record, and practice problems are not spoken. Recording number and phrase pieces and joining them
  is the only way named so far. *Status: the founder, not now.*

## To read or hear (written, never checked by a person)

- **The founder has not reviewed the scripts of Grade 3 Modules 2–6 or Grades 4–8**, nor the Grades 4–8 topic split.
  They were built without review on the founder's call ("no review, build all", 2026-09-14); Grade 5 Module 1's 20
  lessons (re-split 2026-09-15) likewise. Only Grade 3 Module 1 was approved line by line. *Status: open.*
- **Nobody has read the Grade 6–8 teaching text** since every explanation was rewritten to the founder's documents
  (2026-09-22/23). Reading one topic per module is a cheap spot check. *Status: open.*
- **No person has read a practice ladder.** Every ladder's maths agrees with a blind solver, which checks answers,
  not wording or whether a question is pitched right for the grade. *Status: open.*
- **Nobody has listened to the recorded clips.** The gates prove every line has a clip of a sane length, not that it
  sounds right, and the B and B+ settings came from the founder's documents, not from listening
  ([voice.md](voice.md)). A listening sample, 30 clips per grade from KG to Grade 8, was prepared outside the repo.
  Flagged for a listen first: clip `3z57ji` ("Look at 128. It's 1 hundred, 2 tens and 8 ones.", fast at about 5.1
  words a second), `u67m7k`, `1tw090y`, and the counting lists `1dgztg3` and `1xpi1j0`. While listening, watch for
  chalk marks that land before their word is said. *Status: open.*
- **Spanish drafts of the practice-session lines** (`src/features/lessons/sessionCopy.ts`) and of the child's
  consent pause screen are unreviewed; the child screens have no language switch. *Status: open.*

## To fix or decide

- **22 Screen 1s open on bare working, not a picture of the story** (building-lessons: Screen 1 is "a real-life
  picture and the question"). A tester found it in Grade 6 Module 3 (fixed, 9 October 2026); the same shape, a Screen 1
  whose only picture is `eq`, `columns` or `longdiv`, was counted on 9 October in g4m1-t1, t5, t6, t7; g4m3-t3, t6;
  g5m1-t3, t4, t6, t9, t10, t11, t14, t15, t16, t18; g5m4-t1, t4, t5, t6; g6m5-t5; g8m2-t8. Some may be on purpose
  (g4m1-t7 "Did Maya add right?", g5m1-t18 "A number sentence on the board"). *Status: the founder decides whether
  to redraw them; no gate until then.*

- **The five written practice problems of every topic** (1,410 in all) are no longer asked: every topic is laddered,
  so the player generates practice instead. They are still checked by `lessonsAllModules.test.ts` and the answer keys,
  and feed a mixed-practice fallback that no module uses. Keep them as a record, or delete them with that fallback.
  *Status: open.*
- **`speakable()` does not read `in` as inches.** Writers give such a line its own `say`
  ([voice.md](voice.md)). *Status: open; a known limit.*

- **Grade 6 has no negative-numbers module** (CCSS 6.NS.5–7); signed numbers first appear in Grade 7 Module 2. Also in
  `docs/legal/READINESS.md` (content loop). *Status: open.*
- **Teaching pictures that give away their answer.** The clearest is g8m4-t6 Screen 4; such pictures need a variant
  with the result cell blank. *Status: open (found 2026-09-16).*
- **Size leaks** in practice pictures: g4m4-t3 level 3 and g5m2-t7 level 2 draw the unknown near its answer size, and
  14 estimate-only levels would leak if they became multiple choice. *Status: open (found 2026-09-17).*
- **"Spot the mistake" levels where "it is right" is rarely or never the answer** (g5m6, g6m6 flagged): a child can
  rule that choice out without the maths. *Status: open (found 2026-09-17).*
- **Tape-diagram text is about 8 px on a 375 px phone**, in every module that uses it. *Status: open (found 2026-09-15).*
- **Portrait phones crop Screen 1 backdrops**; only Grade 3 Topic 1 and Grade 5 have drawn backdrops. *Status: the
  founder's call.*

## Decided, no change

- **Topic length.** Several topics' teaching runs 215–240 words, against the founder's documents' 80–160 and the house
  style's 150–210. *Status: the founder kept the house style (2026-09-22).*
- **Algebra I (the accelerated Grade 8).** Grade 8 is the regular track. *Status: the founder's call; not built.*
