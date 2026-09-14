# Session Handoff — Milo Story Mode

> 🆕 **THE NEW TEACHING FLOW COVERS GRADES 3–8 (2026-09-14) — READ [docs/new-flow/README.md](docs/new-flow/README.md) AND [docs/new-flow/AUTHORING.md](docs/new-flow/AUTHORING.md) BEFORE ANY LESSON WORK.**
> All **36 modules / 260 topics** are written as data in `src/features/lessons/content/g<grade>m<module>.ts` (topic split:
> [docs/new-flow/curriculum.md](docs/new-flow/curriculum.md)); Grade 3 · Module 1 stays in `grade3Module1.ts`. Every legacy
> chapter is hidden (`LEGACY_CHAPTERS_HIDDEN`). The child's home is **`/modules`** (grade tabs 3–8); the UI is the
> founder's SampleUI template (`Frame.tsx`, `PracticeLayout.tsx`) — build into those, do not re-lay-out a screen.
> ⚠️ **Grade 3 Modules 2–6 and Grades 4–8 were built WITHOUT founder review of the scripts** (founder's call: "no review,
> build all"). Story in the 📚 block below.

> 🗑️ **2026-09-13: the old chapter design docs were DELETED** (chapter-craft ×3, the story/curriculum
> plans, diagnostic-engine, skill-graph ×3 and related). Everything below about the legacy chapters
> and the diagnostic is history; the code is hidden, not deleted. `git log --diff-filter=D -- docs/`
> recovers any of them.
>
> ---
>
> ## 📍 WHERE THE 9–11 BAND IS — read this before touching it
>
> **The port is FINISHED at TEN** (founder's call, 2026-08-14: treat 9–11 like 12–18, same engine,
> same format, **AR as the thing that makes it its own band**) — eight ported plus **two BUILT NEW on
> 2026-08-22**, The Packing Shed and The Minibus Run, which is what finally closed the
> multiplication/division content hole the diagnostic had been routing children into. And
> **two more are deliberately staying storybook — founder's call, 2026-08-16: *"woh dono chapter
> waise hi rahenge… bina neon mein"***. So this table is the finished state, not a to-do list.
> ⚠️ **The two halves work completely differently — check which kind you are in before you touch
> one.** Do NOT port `OrderDesk` or `LevelRun`; they are storybook `SkillBeat` on purpose, and both
> pass the C7 gate as they are. The band is mixed by design.
>
> | | chapter | file | answers with |
> |---|---|---|---|
> | ✅ | `decimals` | `teen/games/CoinTrayGame.tsx` | two wells · hand or taps |
> | ✅ | `factorsMultiples` | `teen/games/FactorLabGame.tsx` | a count · hand or taps |
> | ✅ | `fractionsCompare` | `teen/games/PizzaCounterGame.tsx` | a count (never 0) |
> | ✅ | `measurementUnits` | `teen/games/HeightBarGame.tsx` | two places · tens then ones |
> | ✅ | `anglesSymmetry` | `teen/games/AngleShopGame.tsx` | a degree OR a set of axes · tilt |
> | ✅ | `wordProblems` | `teen/games/MissionBriefGame.tsx` | the shell's AnswerPad |
> | ✅ | `areaPerimeter` | `teen/games/EmptyPlotGame.tsx` | a PLACE on a plan · **hands apart** |
> | ✅ | `dataGraphs` | `teen/games/LoadingBayGame.tsx` | a stack OR a count · hand or taps |
> | 🆕 | `timesTables` | `teen/games/PackingShedGame.tsx` | a TYPED total · taps only (answers reach 116) |
> | 🆕 | `division` | `teen/games/BusRunGame.tsx` | a count ≤ 10 · **hand** or taps |
> | 🔒 | `bigNumbers` | `story/OrderDesk.tsx` | storybook · SkillBeat — **staying storybook, do not port** |
> | 🔒 | `rounding` | `story/LevelRun.tsx` | storybook · SkillBeat — **staying storybook, do not port** |
>
> **⚠️ THE 3D IS GONE.** `story/FloorPlot.tsx` (1,380 lines of react-three-fiber) and `story/plotSite.ts`
> (628 lines of procedural site) are DELETED — founder's call, 2026-08-15: *"totally remove that 3d
> concept"*. ✅ The four dead dependencies (`three` / `@react-three/fiber` / `@react-three/drei` /
> `@types/three`) were **uninstalled 2026-08-16**; production dependencies are 10 → 7.
>
> **To add or change a ported chapter:** it is a data file — palette, `makeTask` L1/L2/L3, a
> self-running tutorial, a `GameConfig`. Mirror `CoinTrayGame.tsx`. Shared parts are
> `teen/games/parts/kidKit.tsx` (palette · `KeyRow` · `Cue` · `PIP`/`PAD` · `useLatest`) and the
> engine is `teen/games/parts/GameShell.tsx`.
> - `band: '9-11'` is what buys the ten-round loop. ⚠️ It used to also mean *no*
>   resume-at-difficulty; **every band resumes now** — founder's call, 2026-08-20. See 🎚️.
> - `hand: {…}` is the whole AR wiring — the shell owns the camera, both doors, the dwell and the
>   gate. Readings in use: a finger COUNT (five chapters — and in The Loading Bay ONE count means a
>   stack number on one round type and a quantity on another), a TILT (The Angle Shop) and a two-hand
>   SPAN (The Empty Plot, and the first one ever scored — see 🏗️ for the noise arithmetic).
> - `coverage: {…}` withholds the mastery exit until every reading has been asked.
> - ⚠️ **The maths still lives in `story/<module>.ts`** (`cents` · `factors` · `pizza` · `inches` ·
>   `angles` · `words` · `plotMaths` · `cargo` · **`packing`** · **`busRun`**), untouched by the port
>   and still carrying every gate. **Put a rule there, not
>   in the data file** — that split is the only reason ten chapters can share one engine.
> - ⚠️ **Author an instrument BIG.** `FitSlot` runs at `max={1}` on landscape: it only ever shrinks.
> - Previews are **`/teen-preview?c=<id>`**. `/story?ch=` now rejects all EIGHT keys by design; only
>   `bignum` and `round` still resolve there.
>
> **The band-level gate is `src/__tests__/bandOnGameShell.test.ts`** — it holds the rules that used to
> be repeated per chapter (rounds, resume, the fist guard, the dwell key, both doors, coverage).
>
> ⚠️ **Biggest outstanding gaps, in order:** ✅ the camera path has been driven on the shell (The
> Empty Plot, span → dwell → graded) · ✅ the scratch-pad collision is FIXED (2026-08-16) · ✅ the
> walkthrough's missing `FitSlot` is FIXED (2026-08-16 — it had NO scale-to-fit on the legacy path,
> which is the path every 9–11 chapter takes) · **the EXPLORE beats were dropped and not replaced**
> (the largest remaining loss — The Height Bar's span reading now ships in no beat at all) · **the
> re-teach has never been seen fire anywhere in the band** · ⚠️ **AR has never been driven with a
> REAL HAND on a real camera** — MediaPipe is proven to boot on prod under the enforced CSP
> (`Graph successfully started running.`, 0 violations), but the band's defining feature is
> unverified end to end and only the founder can close it. Everything is committed and LIVE; prod is
> on **sw v138** (2026-08-23).
>
> 🔎 **THE DIAGNOSTIC — WHERE IT STANDS (2026-08-22), read before touching it**
>
> It was rebuilt from the answer surface up on 2026-08-22 and now names the exact planted root gap
> **96–98%** of the time (was **26–34%**), telling a child with a real gap they are on track **0%**
> of the time (was 10–38%). The contract is `src/__tests__/diagnosticAccuracy.test.ts` — it plants a
> gap, answers with each item's REAL guess rate, and gates exact-root, missed-gap, false-alarm,
> route and LENGTH. Spec: `docs/diagnostic-engine.md` (deleted 2026-09-13, in git history).
>
> ⚠️ **THE PRICE IS LENGTH, AND IT IS NOT SMALL.** Every answer is confirmed (a lead of two to pass,
> **three** to fail), so a child with a gap answers **29–50** questions and a child with NO gap still
> answers **20–36**. The intro copy says "about ten minutes" now — it said "2 minutes" while the
> thing was a coin flip. Founder's call, accuracy over length, stated twice.
>
> ⚠️⚠️ **AND THE HONEST CAVEAT: EVERY ONE OF THOSE NUMBERS COMES FROM A SIMULATION.** No real child
> has taken the new probe. It has been driven against seven learner models, five of which it was NOT
> designed for, and it degrades gracefully — see the 🔬 block. **The one thing that would settle it
> is a real child with a known weakness**, and only the founder can do that.
>
> ⚠️ **THE BOTTLENECK IS NOW THE SKILL GRAPH, NOT THE ENGINE.** `skillGraph.ts` is still v0.9 DRAFT:
> 130 prerequisite edges, none teacher-validated, and its own header says *"a wrong edge = a wrong
> root gap; do not ship the guarantee on a band until that band's spine edges are validated."* All
> 130 were measured on 2026-08-22 — **twelve decide a gap, twenty-one decide nothing** →
> `docs/skill-graph-audit.md` §1 (deleted 2026-09-13, in git history) is the teacher's one-hour list.
> **Until that hour happens, 96–98% means "the engine finds what the graph says", NOT "the engine
> finds the child's real gap."**
>
> 🚪 **AND SINCE 2026-08-25 IT IS OPTIONAL.** Nobody is forced through it: the offer carries a
> one-tap "Skip for now" that issues a `gradeStartPlan`, and it is re-offered exactly once (on the
> menu, after the child finishes a plan chapter) before retiring to the parent dashboard. **The
> probe itself is completely unchanged** — not shortened, no new modes, both 17–18 doors, the
> never-say-"on-track" rule intact. The short pass was measured and REJECTED as a length lever: it
> misses a third to a half of gaps in the bands where it saves any time, and 17–18 has none at all.
> ⚠️ So *"the diagnostic routes a child to their root gap"* is now true only of the children whose
> parents chose it; everybody else walks a grade-start plan that `advanceAfterChapter` refines from
> real play. Both are plans — nobody is handed 72 chapters.
>
> ✅ **AND IT IS LIVE NOW** — pushed 2026-08-23 as part of `9cc7787..6dd9224`. Production serves the
> 96–98% probe; verified on the live site (the door reads *"about 10 minutes"*, 0 console errors).
> The caveats above are unchanged by shipping: the numbers are still simulated and the graph is still
> v0.9 DRAFT.

> 📍 **WHERE THINGS LIVE NOW (2026-08-19).** **TWO repos, two Vercel projects, two hosts.**
>
> | | |
> |---|---|
> | **the product** | `RadlorInc/learn` → **`https://adaptivelearn.radlor.com`** — this repo |
> | **the company site** | `RadlorInc/website` → **`https://radlor.com`** — at `../radlor-site` |
>
> ⚠️ **Both repos must stay PUBLIC until Vercel is Pro** — Hobby refuses a private *org-owned* repo
> through the Git integration. `git remote` here is `https://github.com/RadlorInc/learn.git`.
> ⚠️ **The org was RENAMED `RadlorMain` → `RadlorInc` on 2026-08-20.** Repo ID `1248492657` is
> unchanged, so Vercel's link survives — but GitHub 301s the old name only until somebody claims
> it, so nothing may reference `RadlorMain`. Both remotes were re-pointed and verified.
> Support address **support@radlor.com** (⚠️ may have no mailbox — see 🇺🇸 §⑥); mi2utor is retired.
>
> ⚠️ **THE TWO PROPERTIES DESCRIBE ONE ENTITY AND THAT IS LOAD-BEARING.** Both emit
> `SoftwareApplication` with the identical `@id` `https://adaptivelearn.radlor.com/#app`, and both
> point `publisher` at `https://radlor.com/#organization` — **declared once on radlor.com and only
> REFERENCED here.** Retyping either string silently splits the product in half. They live in
> `src/app/site.ts` (`APP_ID`/`COMPANY_ID`) and `../radlor-site/site.ts`, and
> `src/__tests__/publicSeo.test.ts` asserts the exact values.
>
> ⚠️ **`SOCIAL` IN `../radlor-site/site.ts` IS LOAD-BEARING AND FOUR OF ITS SIX LINKS LIVE IN A
> GODADDY PANEL.** It feeds `Organization.sameAs`, the footer and `llms.txt` from one list. Four go
> through our own `*.radlor.com` forwards, so a forward silently repointed at a platform homepage
> tells every answer engine that the entity called Radlor **is Facebook**. **Run `npm run
> check:social` after any GoDaddy edit and before any deploy that touches it** — ⚠️ that script and its
> npm alias live in **`../radlor-site`, NOT this repo** (verified 2026-08-21: there is no `check:social`
> in this package.json and no `scripts/check-social.sh` here), so run it from there. It follows each
> link to its final URL and fails on a bare homepage.
>
> ⚠️ **radlor.com's production domain is the APEX.** `www` 308s to it. Flipping that breaks every
> canonical, because the `@id` above is the apex. Full story + the traps in the 🇺🇸 and 🏗️ blocks.
>
> ---
>
> _(Everything below is the running session history — newest first, most recent ~5 sessions only.
> Older blocks are in [docs/handoff-archive.md](docs/handoff-archive.md), which is NOT auto-loaded —
> `grep` it. This file is inlined into every session's context, so move blocks out rather than
> letting it grow.
> ⚠️ **AT 2026-09-10, AFTER THE 🧹 BLOCK LANDED: four blocks, 63.5 KB against a ~60 KB target.**
> 📊 2026-09-05 (/admin) **was moved out** as the previous note instructed, and its live items were
> lifted first — they are ▶ OPEN items 3–9 of the 🧹 block, not lost.
> ⚠️ **AT 2026-09-12: 61.8 KiB, four blocks — ⚖️ 2026-09-06 WENT OUT as the previous note
> instructed, and its live legal items were lifted first** into the 🎓 block's ▶ OPEN, items 4–7
> (§8's unwritten refund sentence, the unanswered attorney question on radlor.com's Terms, §11 not
> rewritten, Stripe cancellation). Account deletion, `migrate-prod` and Sydney were already carried
> in the 🧹 block and were not duplicated.
> ⚠️ **Still ~1.8 KiB over, and the arithmetic says that is structural rather than sloppy:** the header
> you are reading is 13 KB, the archive footer ~9.6 KB, and the four session blocks run 8.5–11.0 KB
> each. **~60 KB buys FOUR blocks here, not five** — the "roughly five" in the paragraph above is
> optimistic and has been since the blocks got this dense. Do not fix it by writing thinner blocks;
> fix it by moving one out.
> ⚠️ **AT 2026-09-13 (🎨 block added): 🚀 2026-09-09/10 WENT OUT to the archive, its live items lifted
> into the 🎨 block's ▶ OPEN first** (the two probe rows, /auth contrast, the six Dependabot PRs, `backup.yml`
> not calling `assert-prod-ref.sh`, the rollback rule). **The next block out is 🧹 2026-09-10** — lift its
> Vercel storage / PR #95 / `answer`-event items when it goes.
> ⚠️ Measure with `wc -c` AND DIVIDE BY 1024, not 1000 — this note's own figures are KiB, and
> quoting 63.1 for a 63,075-byte file (as a draft of this very line did) overstates it by 1.5 KB.
> ⚠️ Not a character count either — the emoji here are multi-byte and python's `len()`
> under-reports this file by ~1.6 KB, which is how the figure in this very note was wrong once.
> Adding the 🚀 launch-week block moved 🗣️ 2026-09-04/05 to the archive. ⚠️ Its standing rule did NOT
> go with it: the speak-verb contract (`speak()` supersedes, `speakAfterCurrent()` queues,
> `speakPaced()` for a lesson) and its gate `src/__tests__/voiceBoundaryVerb.test.ts` live permanently
> in `docs/chapter-craft.md` §3 (deleted 2026-09-13, in git history).
> ⚠️ Count the blocks by eye rather than by grepping one set of emoji: the 🗣️ block was invisible
> to a `^> [⚖️📊🧪🔊]` sweep on the day it landed, and a miscount here is a miscounted budget.)_

> 📚 **2026-09-14 — GRADES 3 TO 8, ALL 36 MODULES, WRITTEN AND GATED; A GENERAL LESSON ENGINE (fractions, decimals, negatives, times, choices, 21 diagram kinds); AND PARENTS CHOOSE TOPICS.** Branch `new-flow-all-grades` (worktree `../milo-lesson-art`) · `tsc` 0 · vitest **104 files, 2998 passed** · `next build` OK · **sw v185 → v186** · shipped as one PR from `new-flow-all-grades` (founder: "push and deploy to production"). ✅ **Migration APPLIED TO PRODUCTION 2026-09-14** (founder: "apply the migration to production") by hand via Supabase MCP `apply_migration`; the ledger recorded **`20260914015455`**, so the repo file was renamed to match. Target confirmed as `wrnjqjhrbnqxornmfisf` three ways: the literal in `scripts/assert-prod-ref.sh`, the `PROD_PROJECT_REF` variable, and the Supabase host in the LIVE bundle. (Merging never applies migrations here: `migrate-prod` needs `migrate-staging`, which is skipped.) Before it the same day: PR [#103](https://github.com/RadlorInc/learn/pull/103) merged and live (sw v185) — Higgsfield art for Topic 1 (`public/assets/lessons`), no scroll on Screen 8, **← Back on Screens 2–8**.

## ① 📚 WHAT THE FOUNDER DECIDED
"Build the rest of the modules from grade 3 to grade 8" from the two docs + the curriculum PDFs. Answers: **no review, build all** · Grade 3 first, then 4→8 · **Grade 8 regular track** (Algebra I not built) · **"we will show all the modules to the parents … they can select the topics"**. ⚠️ The Grades 4–8 topic split in curriculum.md is mine; the founder has not read it.

## ② 🧩 THE ENGINE (lessons are data from here on)
- **`script.ts`**: `Answer` = number | `{frac,whole?,exact?}` | `{time}` | `{choices,correct}`; `isCorrect` accepts equal values (6/8 for 3/4, `1,250`, `−3`), `showAnswer` writes them back. A `Problem` has `op` (Module 1 only) **or** `answer` + `steps`; twins without `op` carry their own hints. **`AnswerInput.tsx`**: one box / top-over-bottom fraction (+ whole box) / h:mm / choice buttons; the "−" key and the whole box are decided **per lesson, never per problem** (a key that appears only for a negative answer tells the sign).
- **`Diagrams.tsx`** (21 kinds): bars, tape, numline (+rays/jumps), clock, ruler/scale/jug/thermometer, base-ten blocks, written sums, long division, tile grid, area model, poly (shapes/transformations/circles), angle + protractor, bar/picture/dot/histogram charts, scatter plot, coordinate plane, table, iso cubes, solids, signed counters, balance, spinner. **`/lesson-preview`** (dev only, 404 in prod): a sample of each; `?module=g4m2` every picture + answer of a module; `?picker=1` the parent picker.
- **`modules.ts`**: every grade's modules (titles from the PDFs), `findLesson`, `chosenModules(lessonIds)`. Routes `/modules?grade=N`, `/lesson?module=…`, `/lesson?id=…`, `/practice?module=…`.

## ③ 🏭 HOW 260 TOPICS WERE MADE, AND THE GATE THAT HOLDS THEM
One writer agent per module (brief = AUTHORING.md), then **a separate solver agent per module that saw only `node scripts/lesson-questions.mjs <id>`** (questions + pictures, no answers) and wrote `src/__tests__/answerKeys/<id>.ts`. **`lessonsAllModules.test.ts`** (1119 tests): titles equal curriculum.md (parser positive-controlled), 9-screen shape, well-formed answers whose last worked step states them, hint/Screen-9 number rules, picture sanity + server render with no `NaN/undefined/Infinity` (watched trip on a broken numline), and **the key agrees** (watched red on a planted 24→25). **All 35 keys agreed with their lessons — zero answer mismatches.** Defects caught along the way: long division's `−` took a column (engine fixed, g4m3/g5m1 realigned), g6m7 table rows one cell short, negative fractions shown with a hyphen.
⚠️ **What no machine checked:** wording and grade pitch (founder unread), and most pictures by eye. I looked at the diagram gallery, Module 2/4 samples, and drove clock, fraction, choice and negative answers through the real player; everything else is render-checked only.
⚠️ Five Grade 7 writers died mid-run on a usage limit (too many agents at once); resumed via SendMessage and finished. Keep concurrency to ~6 agents.

## ④ 👪 PARENTS CHOOSE TOPICS
`/parent/topics?learner=<id>` (button "📚 Choose topics" on `/parent`, owner only) → `TopicPicker.tsx`: "Every topic" or grade tabs → module/topic checkboxes → `setLearnerLessons` writes `learners.lesson_ids text[]` (null = every topic). The child's `/modules`, `/menu`, topic path and practice use `chosenModules`. Driven on the preview + a faked session learner: home showed only the chosen grades/modules, the path "0 of 2 done". **Applied and verified from the catalog:** column `text[]`, nullable, no default · check `lesson_ids IS NULL OR cardinality(lesson_ids) <= 500` · comment present · the 4 `learners` policies unchanged · 28 learners, 0 with a choice · `has_column_privilege('authenticated', …, 'UPDATE')` true · security advisors: nothing new (all pre-existing). Pre-apply diff: no column existed, update policy exactly `created_by = auth.uid()`, grants table-level (no column grants to miss). ❌ **The write path is NOT proven:** the MCP SQL connection is read-only (`25006 cannot execute … in a read-only transaction`), so the planned rolled-back "parent updates own child / refused on another family's" probe could not run — it failed at its first write, and 0 rows changed. **The proof is one real save by a signed-in parent** (▶ OPEN 2).

## ▶ OPEN
1. 🔴 **Confirm it is LIVE** once merged: `curl -s https://adaptivelearn.radlor.com/sw.js | head -1` must read v186, and `/modules` must show grade tabs 3–8. If the Deploy run is red, read the log before believing either colour (`rls-tests` has gone red on a CLI rate limit before).
2. 🔴 **Prove the write:** as a signed-in parent, Choose topics → save a few → the button reads "N chosen" → Start learning shows only those. Then set it back to "Every topic". Until someone does this, the save path has only been reasoned about.
3. 🔴 **The founder has read none of Grade 3 M2–6 or Grades 4–8.** `/lesson-preview?module=<id>` is the fastest way to read a module. Notable writer compromises: g4m5 protractor readings are multiples of 10; g6m6 has no 360° around a point (angle picture is a half circle); g7m4 and g8m5 use π ≈ 3.14 with exact answers; g8m1 exponent answers are typed as the exponent number; g6m5/g7m3 expressions are always choices.
4. ⏭️ **Bundle:** every grade loads eagerly — one ~1.2 MB (≈275 KB gz) chunk on the child's screens (`ponytail:` note in `content/index.ts`).
5. ⏭️ Lesson progress is still per-device; no grade is assigned to a child (tabs show every grade, or only the chosen topics' grades).
6. ⏭️ **LIFTED from 🧹 2026-09-10:** PR #95 status unconfirmed here; the `answer` event awaits founder approval; `auth_events` after two sign-ins never read; `ADMIN_MIN_COHORT=1` founder-only; **purge cliff 2026-09-27** (520 events in one night) unless the rollup lands; `profiles.is_internal` client-writable (grants nothing); account deletion never executed end to end; `migrate-prod` inert; Sydney rollback (~$10/mo); `entitled_chapters` has no caller; auth migrations `20260908120000`/`20260908120100` await hand-apply; `counting` flake in `ready-bar.spec.ts`.
7. ⏭️ Carried: the 🎨, 🧭 and 🎓 blocks' ▶ OPEN (🎨 items 4 and 5 are DONE — each module has its own Learn link; Back shipped in #103).

> 🎨 **2026-09-13 (evening) — THE LESSONS GOT A KID-FIRST UI: THE FOUNDER'S SampleUI TEMPLATE ON EVERY SCREEN, A MODULES HOME, MIXED PRACTICE, AND A SCRATCH PAD — plus an in-app navigation bug that bounced Practice straight back home.** PR [#101](https://github.com/RadlorInc/learn/pull/101) (`lesson-kid-ux`) · `tsc` 0 · vitest 102 files, **1861 passed** · `next build` OK · **sw v183 → v184** · **merged `6d143b11` and LIVE — as measured 2026-09-13 21:35 IST:** production `dpl_3ipU…` (release `6d143b11`), `sw.js` flipped v183 → **v184** and `/modules` 404 → **200** while polled; on the live site Practice opens "Problem 1 of 8" with the pad, 0 console errors. Re-measure rather than trust this sentence: `curl -s https://adaptivelearn.radlor.com/sw.js | head -1`.

## ① 🎨 WHAT THE FOUNDER ASKED FOR, IN ORDER
A UI/UX pass "psychological as per the kid" → the founder's own **`~/Downloads/SampleUI.html` as the template** → then, screen by screen: Screen 1's closing question becomes the button ("How many cookies are there? **Let's see ▶**"); desktop must not leave the sides empty; **title top left · dots centred · button bottom right**; the topic map **vertical in portrait, horizontal in landscape**; "One thing not to do" as big **Not this / Do this** cards; a **modules home** (list left, **1. Learn** / **2. Practice** cards right); **practice laid out like the template with a scratch pad**, then the same for a lesson's practice and for Screen 8. Founder picks along the way: **no Milo character on the screens**, keep "Screen N of 9" visible, map not list. ⚠️ **Their answer on audio-on-by-default came through as the single word "the" — unresolved, nothing changed.**

## ② 🧩 WHAT IS BUILT (`src/features/lessons/`)
- **`Frame.tsx`** — every teaching screen: coral bar · title · `lp-row` (picture + words; `stack` for the cards screen) · footer grid (empty · dots · action). Landscape = `(orientation: landscape) and (min-width: 700px)`; a short-landscape block keeps the button on screen at 844×390.
- **`PracticeLayout.tsx`** + **`ScratchPad.tsx`** — Screen 8, a lesson's 5 practice problems, and module practice. The pad is a canvas (Pencil / Eraser / Clear pad, pointer events, `touch-action: none`), wiped by `clearKey` on each new problem. **Hint** shows the big idea without counting as a miss — **not on Screen 8**, whose hints must follow the approved script's order.
- **`modules.ts`** — `GRADE3_MODULES` (titles from the README split; Modules 2–6 have `lessons: []` → "Coming soon", **never a lock**) and **`mixedPractice`**: each topic's LAST practice problem (the story one), first half and second half interleaved (t1, t5, t2, t6…). `ModuleHome.tsx` · `ModulePractice.tsx` · routes `/modules`, `/practice`.
- Also: a tap cue on every scratch picture ("Tap the picture to add one." — empty plates gave no hint they were tappable), pictures sized by one `--lp-u` variable, green "Right!" banner, math-word sticker.
- ⚠️ **Deliberately NOT copied from the template, because they break the product rules:** red "Not yet" banners (hints are warm yellow), locked topics, emoji icons, confetti, the "Ava ★ 62%" score. **Also removed from the child's view:** the practice `why` labels ("A little harder") and "You got 3 of 5 on your own".
- `/menu` renders `ModuleHome`; the gate in `legacyChaptersHidden.test.ts` was changed to expect `<ModuleHome` (watched red with `<LessonList`).

## ③ 🐛 THE BUG: `window.location` IS READ BEFORE AN IN-APP NAVIGATION CHANGES IT
`/lesson` and the new `/practice` read the query via `useSyncExternalStore(…, () => window.location.search)`. Loading the URL directly worked; **tapping Practice on `/modules` bounced straight back**, because the page rendered with the OLD location, found no module and redirected. The same code meant "Watch the lesson" from practice would have opened the topic list. **Both now use `useSearchParams()` inside `<Suspense>`** — `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md` (a static page needs the boundary or the build fails). ⚠️ Found only by clicking through; every earlier drive typed URLs, which is a world where this bug cannot occur.

## ④ 🔎 VERIFIED, AND WHAT WAS NOT
- Driven at 1440×900, 375×812, 844×390: modules → Practice → two misses (big idea, then worked steps) → "Watch the lesson" opens `g3m1-t1`; a full lesson through Screen 8 (3 misses → hint 1, hint 2, worked → twin with a wiped pad → solved → Screen 9) → practice → "Watch the lesson again" replays and returns to the same problem. Pad ink measured by pixel count before/after each wipe. ⚠️ **One of those checks was vacuous first** (eraser still selected, so "the pad clears" compared 0 to 0) and was redone with ink on the pad.
- `modulePractice.test.ts`: order and story-problem choice written out by hand; each watched red on a planted defect.
- ❌ **NOT verified:** drawing with a **real finger** on a tablet · the signed-in `/menu` · phone layout of lesson practice / Screen 8 · the practice finish screens · any upright tablet size.

## ▶ OPEN
1. ✅ **Deployed — and the first attempt did not, for a reason worth knowing.** The post-merge Deploy run went red in `ci / rls-tests` **before any test ran**: `supabase/setup-cli@v1` with `version: latest` → *"Failed to resolve latest Supabase CLI release: rate limit exceeded"*, so `promote` was skipped and production silently stayed on #98. `gh run rerun --failed` went green and promoted. ⚠️ **`version: latest` makes every deploy depend on a GitHub API rate limit** — pin the CLI (a background task was offered for it; not done). A red here is NOT evidence about RLS: read the log before believing either colour.
   🗑️ **Vercel, as measured 2026-09-13 21:40:** deleted `dpl_EYZw…` (#97 production, still held the voice clips) and `dpl_ALHW…` (the `main` build of #101 — served nobody) on the founder's go, behind a guard that read the live deployment first and refuses if it cannot. **4 remain:** live `dpl_3ipU…` (#101), rollback `dpl_31kg…` (#98), two PR #101 previews. ⚠️ **The dashboard still read Deployment Storage 58.04 GB / 10 GB with 5 deployments** — up from 53.43 GB when there were 350, so that figure is NOT current stored bytes (lagged or period-accumulated; Vercel's docs did not say which — unverified). Do not delete more builds to move that number; ask Vercel or read it after Pro. Every merge still makes 3 builds until PR [#95](https://github.com/RadlorInc/learn/pull/95) (stop `main` previews) lands.
2. 🔴 **Finger-test the scratch pad on a real tablet** — the pad is the new core interaction and only a mouse has drawn on it.
3. 🔴 **Audio on by default?** — the founder's answer was lost ("the"). Ask again.
4. 🔴 **Module 2 scripts** (README process). When a second module is built: `ModuleHome`'s Learn button always opens `/lesson` (Module 1's path) — it must take the module; `LessonList` and `/lesson` still import `GRADE3_MODULE1` directly.
5. ⏭️ The template's **Back** button (bottom left) was left out: the approved script calls Screens 1–7 "Next only". Founder's call if wanted.
6. ⏭️ The cards screen has no "Don't add the 8s" sub-line — the approved scripts have no such text; add it to the scripts first if wanted.
7. 🔴 **LIFTED from 🚀 2026-09-09/10 — two probe rows still in `diagnostic_leads`:** `select public.delete_lead_by_email('probe-lead-alive-20260909@example.invalid');` and the same for `probe-postfix-20260909@example.invalid`.
8. ⏭️ **LIFTED — accessibility:** /auth's consent line 4.16:1 against a 4.5 floor, its link 3.04:1 (recorded, unfixed). ⏭️ **Six Dependabot PRs** open (0 security alerts). ⏭️ `backup.yml` does not call `scripts/assert-prod-ref.sh`.
9. ⏭️ **LIFTED — the rollback rule:** moving `release` backwards deploys NOTHING (Vercel builds a commit, not a pointer); **revert-and-push-forward works (~280s)**, and the sw VERSION goes forward on a rollback, never back. Commands in `docs/runbooks/launch-day.md`.
10. ⏭️ Carried: everything in the 🧭, 🎓 and 🧹 blocks' ▶ OPEN. The local `adult-surface-responsive` checkout has an uncommitted `.claude/launch.json` entry (`newflow-dev`, port 3000, runs `../milo-newflow`).

> 🧭 **2026-09-13 — THE PIVOT: EVERY OLD CHAPTER HIDDEN, THE NEW 9-SCREEN TEACHING FLOW LIVE WITH GRADE 3 · MODULE 1, THE VOICE CLIPS DELETED, AND VERCEL FROM 272 DEPLOYMENTS TO 2.** PR [#97](https://github.com/RadlorInc/learn/pull/97) + [#98](https://github.com/RadlorInc/learn/pull/98) merged and LIVE (production `dpl_31kg…` = `4e28e34`) · `tsc` 0 · vitest 101 files, 1858 passed, 20 skipped · `next build` 0 · sw v183.

## ① 🧭 WHAT THE FOUNDER DECIDED, IN ORDER
From two founder docs ("Math Problem Exp and Exercise Format", "Step By Step Script" — adding fractions with different bottom numbers): **(a)** a standalone demo of the script, published at https://fraction-lesson-demo.vercel.app (its own Vercel project); **(b)** hide every existing chapter now, delete them later, live even while empty; **(c)** the check and the demo turned OFF; **(d)** Grade 3 modules split into single-skill topics pitched at a Grade 3 child (45 topics, approved — in the README); **(e)** Module 1's 8 scripts written as a review doc, approved, built; **(f)** 19 old-flow docs deleted (chapter-craft ×3, story/curriculum plans, diagnostic + skill-graph docs); **(g)** voice clips deleted and old deployments cleared.

## ② 🧩 WHAT IS LIVE
- **One switch** `LEGACY_CHAPTERS_HIDDEN` hides every legacy chapter from every LIST and refuses it at every PLAY route (`/game`, `GuardedChapter` → `/teen-preview` + `/demo`, `/story`, `/diagnostic` layout incl. recheck) with `NewLessonsSoon`. `CHAPTER_IDS`/`CHAPTER_NAMES` stay whole so history and /admin resolve. **Nothing deleted; flip to `false` restores it all.**
- **The child's home `/menu` is `LessonList`** (Grade 3 · Module 1, "Next up" = first unfinished). ⚠️ "Start learning" on `/parent` used to send a brand-new child to the (blocked) check — fixed: while hidden, every child goes to `/menu`. The landing page's button is "Sign up free" → `/auth`.
- **The lesson engine** (`src/features/lessons/`): `script.ts` is the pure flow (7 Next-only screens → Screen 8 hint/hint/worked+twin → Screen 9 → 5 practice; practice miss = big idea, 2nd miss = worked steps + replay that returns to the same problem). Answers and worked steps are DERIVED from each problem's `op`. Screen 9 after a solved twin uses `twinWon`; a twin missed 3× shows "Let's keep practicing", never "You got it". Scratch number lines have NO length in the data (`scratchLineMax`) because every one of them had ended on or one jump past the answer.
- **Nightly E2E + weekly layout sweeps are PAUSED** by a `legacy-gate` job that warns on every run (exit 2 if the flag is unreadable) — they play legacy chapters.

## ③ 🔎 VERIFIED, AND WHAT CAUGHT WHAT
- `lessonsGrade3Module1.test.ts`: answers WRITTEN OUT from the doc's "Answers:" lines; all doc Title/Text/Prompt/Hint/Sticker lines word-for-word (168+); no scratch picture gives the answer away; twin hints + twin Screen 9 use only the twin's numbers. Every new check watched red on its planted defect.
- **An independent code review found two real bugs 25 green tests could not see** — the twin showed the FIRST problem's hints (Topic 4 twin hinted 35 for an answer of 60), and the number-line leak above. Both fixed. Looking at the screen found two more (rows wrapping into a line; a turned tray overlapping a button).
- ⚠️ **One approved-script CHANGE, called out:** Topic 7's twin was 16 wheels ÷ 4 = 4 (answer = given); now 20 ÷ 4 = 5, doc and app.
- Driven on production: `/lesson?id=g3m1-t1` Screens 1–8, 0 console errors. **NOT driven: the signed-in `/menu` and `/parent`** (needs a real account).

## ④ 🚚 DEPLOY — GITHUB WAS FLAKY, AND WHAT THAT COST
GitHub 502'd PR creation and merges repeatedly (both PRs were created despite the 502 — check before retrying, never duplicate). Deploy #97: `rls-tests` "failed to be acquired (5 attempts)" — never started; a full re-run passed. Deploy #98: CI green but `promote` was rejected twice by GitHub (`fatal error in commit_refs`, then `Internal Server Error`); **`release` was fast-forwarded by hand** to the CI-passed `4e28e34` (`git push origin origin/main:refs/heads/release`), and that Deploy run still reads "failure" — `red-main.yml` may have opened an issue; it is safe to close.

## ⑤ 🗑️ VOICE + VERCEL STORAGE
- `public/audio` (694 MB, 29,329 files) deleted — it was copied into every deployment. The player falls back to browser speech when the manifest 404s (measured on prod). Clips remain in git history. Render scripts left in place.
- Vercel `adaptivelearn`: **272 deployments → 2** (live `dpl_31kg…` + previous `dpl_EYZw…` for rollback, which still carries the clips ~735 MB). The 45 "milo-story-mode" deployments were the SAME project from before the rename. ⚠️ **A guard lesson:** old production deployments list `adaptivelearn.radlor.com` in `alias` HISTORICALLY — the guard refused all 143; the correct check is the live lookup `/v13/deployments/adaptivelearn.radlor.com`. Other Vercel projects untouched.

## ▶ OPEN
1. 🔴 **Landing copy**: the heading/paragraph still describe the placement check, which is off. Founder to send copy.
2. 🔴 **Read the storage figure** once Vercel's usage refreshes (expect ~1 GB). Delete `dpl_EYZw…` once the current build is trusted. PR [#95](https://github.com/RadlorInc/learn/pull/95) (stop `main` previews) still open — founder did not pick it.
3. 🔴 **Module 2 scripts** for review (README process). Then turn `GRADE3_MODULE1` in `LessonList`/`/lesson` into a list of modules.
4. ⏭️ Lesson progress is per-device only; parents/teachers cannot pick topics; every age band sees Grade 3 — all need a `chapters` row per lesson id (a migration) and a decision.
5. ⏭️ Pictures are code-drawn shapes, not art. "Read it to me" is now browser speech only.
6. ⏭️ **Branches:** `main` = live. `adult-surface-responsive` (this folder) carries the classroom work + cherry-picks of the new flow but NOT PR #98's clip deletion or the merge commits — rebase/merge from `main` before continuing there; its classroom migration is still applied nowhere. Worktree `../milo-newflow` can be removed.
7. ⏭️ Carried: everything in the 🎓 and 🧹 blocks' ▶ OPEN (Terms §8/§11, attorney question, Stripe cancellation, account deletion never executed, `migrate-prod` inert, Sydney rollback).

> 🎓 **2026-09-11/12 — THE CLASSROOM, BUILT IN ONE GO: a teacher's syllabus, her set work, and children who sign in as themselves. The headline finding is a LIVE BUG it fixes — a teacher adding a child to her class silently replaced that child's whole app with her own chapter list. Plus a repo-wide over-engineering pass that deleted 193 lines.** `tsc` 0 · **1862 passed, 2 skipped (101 files)** · `next build` 0, 40 pages (was 37) · eslint **373**, down from 375 · ⚠️ **NOTHING COMMITTED, and the migration is applied NOWHERE.**

## ① 🔀 ONE COLUMN WAS DOING TWO JOBS, AND THE SECOND JOB WAS NOBODY'S INTENTION
`learners.grade_id` meant *which class this child is on the roster of* AND — via `grade_chapters` — *which chapters this child may play*: `/menu` looked up the grade and narrowed the menu to it. So the moment a teacher put a child on a roster, **her syllabus became that child's app.** Nothing failed, both halves were individually correct, and no gate could see it. Founder's rule, stated on 2026-09-12: *the teacher's topics stay in her account; the chapters a child sees come from the parent.*
**The fix removes code.** `/menu` no longer reads `grade_chapters`; the child's list is a new nullable `learners.chapter_ids` set by the parent. ⚠️ **The "I don't know which chapters to pick" door needed NO code** — unset already falls through to `chaptersForAge(band)`. `grade_chapters` keeps working untouched as the syllabus and as the topic menu for exercises.

## ② 🧒 CHILD LOGINS TURNED OUT CHEAP, AND THE REASON IS WORTH KNOWING BEFORE YOU TOUCH IT
Estimated as weeks and a security-model change. It is neither, because of one property nobody had written down: **every policy protecting a child reads `learner_access.parent_id = auth.uid()`** — the column is named for a parent but means *a principal who may act on this learner*. Give the CHILD's own auth uid a row there (new `access_role` **`self`**) and sessions, progress, stats, state, events and diagnostics all admit them **with no policy rewritten.**
Accounts are created at **`/api/child/signup`**, server-side with the service role, because a child has no email: the address is synthesized and created pre-confirmed (`handle_new_user` only makes a profile once `email_confirmed_at` is set, and nobody can confirm a `.invalid`). ⚠️ **A draft `claim_learner` SECURITY DEFINER RPC was written and then DELETED** — the route needs the service role regardless, so the RPC was a second, weaker door onto the same room. **The migration adds no definer function and changes no existing policy.**
⚠️ **THE RESIDUAL RISK, WHICH CANNOT BE CODED AWAY:** anyone holding a class code can claim any UNCLAIMED child by typing their name. A name is a username, not a secret — that was the ask. What limits it: a claim is one-shot, the teacher can see it, the code rotates. **A duplicate name REFUSES rather than guessing** (guessing hands one child the other's account). If a real school needs more, the answer is a per-child PIN, not a longer code.

## ③ 📝 EXERCISES — A ROW AND A BUTTON, NOT A QUESTION ENGINE
`exercises` (class · topic · count · difficulty · `unlocked_at`) + `exercise_results`. **Topic is a chapter id; difficulty is that chapter's own 1–3 tier, applied through the EXISTING `setChapterLevel` store — so no chapter changed.** Locked is **invisible, not disabled**: RLS refuses to SELECT a locked row to anyone but the owning teacher.
⚠️ **A NAMED CEILING: question COUNT is stored and displayed but not enforced.** `SkillBeat.rounds` is per-beat chapter data, so a real override would touch every chapter. Upgrade path is a rounds override threaded through `SkillBeat`/`GameShell`.
⚠️ Results are filed in **`finishAndSync`**, not `/game`'s `handleComplete` — the documented dead wire both registry factories discard. Filing there would have been the plan-pointer P0 all over again.

## ④ 🛡️ FOUR GATES CAUGHT ME, ALL CORRECTLY — THIS IS THE SYSTEM WORKING
A new table holding children's data owes four things, and each went red before it went green: the **deletion census** (threw on a table with no clause, then again because the fixture did not SEED it), the **data export** (`exercise_results` → `teacherExercises` in the download), **§6 of the Terms**, and the **security baseline**. `/menu` reading entitlement also tripped the chapter-gate call-site count and is now listed there **with a written reason** — it picks which home screen to render and cannot lock a chapter.
⚠️⚠️ **AND MY OWN RLS HARNESS WAS BLIND FIRST.** Written with `set local role` the settings are TRANSACTION-scoped and were gone by the next query, so everything ran as superuser with RLS off — and the *"the teacher can see her own exercise"* **positive control passed happily while measuring nothing.** Caught only because two NEGATIVE cases went red. A blind probe and a broken policy are the same result unless something is expected to be refused. ⚠️ It then went red a second time for a second real reason: `authenticated` had no table GRANT, because I was leaning on a Supabase default privilege — the M6 trap. Granted explicitly now.
Six mutations planted and each caught by exactly its own assertion. ⚠️ **NOT via `scripts/break-check.sh`** — it stashes untracked files, and all of this is uncommitted, which its own header warns costs you a confusing exit 3. Used the sanctioned fallback: file copy + `trap … EXIT INT TERM`, no git.

## ⑤ 🧹 AND A DELETION PASS: −193 LINES
`preteen/kit.tsx` was **44% dead** (chapter-era leftovers; the 9–11 band moved to `kidKit.tsx`), plus five `art.tsx` exports the archive had **already recorded as stranded and nobody had cut**, `CONSENT_LINE` (a stale pre-component duplicate), `/name-entry`, and three dead singles. ⚠️ **One "dead" finding was wrong in an instructive way: `getLevelName` was not dead, it was BYPASSED** — `menu`, `parent` and `profile` had each hand-inlined the same 8-name array. An unreferenced-export scan cannot tell *nobody needs this* from *everybody reimplemented it*. Consolidated: 4 definitions → 1.

## ▶ OPEN
1. 🔴 **APPLY `20260912100000_classroom.sql` — it is applied NOWHERE and the client half is uncommitted.** It is EXPAND-ONLY (every object new, the one added column nullable), so it is safe to apply BEFORE the client, which is the order this repo needs since `main` auto-deploys. ⚠️ Two auth migrations (`20260908120000`, `20260908120100`) are still queued ahead of it.
2. 🔴 **NOTHING ABOUT THE CHILD FLOW HAS RUN AGAINST A REAL DATABASE.** Local dev has no `SUPABASE_SERVICE_ROLE_KEY`, so `/api/child/signup` returned `not_configured` 503 — correct behaviour (no anon fallback, deliberately) and it means the create-and-link path is proven only against a stubbed fetch (`childSignupRoute.test.ts`, 9 tests, 3 mutation-tested). **No child has ever signed in.** The RLS half IS proven, in pglite.
3. 🔴 **Child logins are a security-model change and this is launch week.** The founder asked for everything in one go and it is built; shipping order is a separate call.
4. 🔴 **LIFTED from ⚖️ 2026-09-06 — §8's refund sentence is unwritten and LIVE on the page.** The only open Terms marker that is not a lawyer question. One sentence from the founder closes it.
5. 🔴 **LIFTED — UNANSWERED, ASKED TWICE: was radlor.com's Terms of Use actually reviewed by an attorney?** It is live with the banner off and `[DATE]` resolved. If the review happened, nothing to do; if not, unreviewed terms are presented as binding on a public site.
6. 🔴 **LIFTED — §11 has not been rewritten around what survives.** `src/core/accountDeletion.ts` is the one declaration; `diagnostic_leads` is named there as unreachable by deletion.
7. ⏭️ **LIFTED — Stripe cancellation is not wired**, and must be before the first live purchase or a deleted account keeps being charged. Harmless today: zero subscriptions exist.
8. ⏭️ **Question count is not enforced** (see ③); the teacher's number is displayed, the chapter runs its own loop.
9. ⏭️ Carried, unchanged: everything in the 🧹 block's ▶ OPEN (PR #95 unmerged, the storage figure unread, account deletion never executed, `migrate-prod` inert, Sydney ~$10/mo, the `/menu` 6→2 RPC half) and the 🚀 block's launch blockers. **Nobody has HEARD a voice clip**; 15-16 voice remaining (7,202 lines).

_Older sessions (2026-06-15 → **2026-09-10**, including 🧹 **the deployment-storage day** (2026-09-10: 53 GB of builds on a 10 GB plan, 80 dead previews deleted, `main` previews stopped by PR #95), moved 2026-09-14 — ⚠️ **its live items were LIFTED into the 📚 2026-09-14 block's ▶ OPEN, item 6**; including 🚀 **launch week** (2026-09-09/10: moving `release` backwards deploys nothing, `/api/lead` reported success on a failed write, Dependabot alerts had never been on, 17-18 fully voiced), moved 2026-09-13 — ⚠️ **its live items were LIFTED into the 🎨 block's ▶ OPEN, items 7–9**; including 🎙️ **the Chatterbox voice block** (2026-09-07→09: whole-line TTS on a free GPU, four bands voiced), moved 2026-09-13 — ⚠️ its one live thread (15-16 voice, Kaggle render) is MOOT: the clips were deleted that day; including ⚖️ **the legal day** (the Terms said things the product does not do — "delete your account at any time" had nothing behind it at all; both documents behind the draft banner, and account deletion built and proven not to orphan before a line of it was written), moved 2026-09-12 — ⚠️ **its live legal items were LIFTED into the 🎓 2026-09-11/12 block's ▶ OPEN, items 4–7**; including 📊 **the /admin day** (four panels that could not have been honest, the privilege escalation caught one step before production, the funnel that was not a funnel, and the discovery that CI had never gated anything), moved 2026-09-10 — ⚠️ **its live items were LIFTED into the 🧹 2026-09-10 block's ▶ OPEN, items 3–9**, and one of its own ▶ OPEN lines was already stale when it went (Vercel's Production Branch is `release`, measured — the CI gate is live, do not re-do it); including 🗣️ **the voice-cutoff day** (nothing Milo says is cut off by the next thing, in any band — and the audit that proved it was only half done the first time), moved 2026-09-10 — ⚠️ **its rule is NOT archived with it**: the speak-verb contract and `voiceBoundaryVerb.test.ts` are written up in **docs/chapter-craft.md §3**, and `scripts/break-check.sh` (ported there from `video_reviewer`, and existing in BOTH repos with different runners) is described in CLAUDE.md; including 🔊 **the voice-on-the-CDN day** (three silent defects in one chain, the first honest cost accounting, and the stitcher that failed its listening test) and 🧪 **the Chatterbox evaluation** (Resemble AI TTS in a scratch venv, Nano off the table, the GPU-cost argument), both moved 2026-09-09 — ⚠️ 🔊's live ▶ OPEN was lifted into the 🎙️ 2026-09-07→09 block (the stitcher is now moot — whole-line via GPU replaced it) and 🧪 is superseded by that block; including ✅ **the region-move CUTOVER day** (eleven dispatches, ten red, every red a real defect in the workflow — and the auth trigger a schema dump does not carry), moved 2026-09-06 — ⚠️ its still-live items (the Sydney rollback, `SUPABASE_SERVICE_ROLE_KEY` never exercised, the missing `production-db` environment, the uncommitted /menu RPC half, `entitled_chapters` with no caller) are carried in the ⚖️ 2026-09-06 block's ▶ OPEN item 7; including 🚀 **the Pro / region-move GO day** (the one-job workflow that diffs the same query on both databases) and 🌏 **the load-measurement day** (the database was in Sydney while every user was in the US, and the nightly backup had never run), both moved 2026-09-05 — ⚠️ their still-live items are carried in the ✅ region-move block above and — since 📊 2026-09-05 was itself archived on 2026-09-10 — in the 🧹 2026-09-10 block's ▶ OPEN (`backup.yml` is FIXED, PR #91; the `production-db` environment and the two Supabase secrets remain); including 🎙️ **the first voice-rendering session** (17–18 got its 161 clips, 3–5 got Teddy Twinkle and 872 of 1,411 lines), moved 2026-09-04 the same day it was superseded — ⚠️ everything it left uncommitted was committed and deployed in the 🔊 block above, and its still-live items (nobody has heard it on a device, OrderDesk/LevelRun have no clips, the MCP key) are carried there; including 🌙 **the nightly-E2E day** (12 runs red since the day it was created, the AR escape hatch half off a 640×320 screen, and the CI-only text-metric difference), moved 2026-09-04 — ⚠️ its still-live items (the scheduled-run green, the hull silence, the `counting` flake, and every launch blocker in its ▶ OPEN) are carried in the 🔊 2026-09-04 block above; including 🗒️ **the second tester pass** (Great job!, the hull silence diary, the typed directions line in all 72 chapters), moved 2026-09-04 — ⚠️ its still-live items (the hull silence, the `counting` flake) are carried in the 🌙 block's ▶ OPEN, and its "PR #69 is open" line was already stale when archived (merged 2026-08-31 as `9a4bcc3`); including 📏🎓 **the student-review days** (the run resumes, Ready everywhere, praise to 6–8, the number-tag overhang) and 🐇 **the line behind mother** (even spacing for one species, and the tautology guarding the approved picture), all moved 2026-09-03 — ⚠️ their still-live items (recorded clips for 3–11, the `counting` flake in `ready-bar.spec.ts`) are already carried in the 🌙 block's ▶ OPEN and the 🎙️ 2026-09-03/04 block; including 🔒 **Stage 3** (the chapter gate and the screens — a lock that names what is behind it, and a paywall built inert but tested refusing), moved 2026-08-31 — ⚠️ its still-live items (the deferred watched purchase, B12, `DRAFT = true`, the free-set pick, the nine Dependabot PRs, Vercel Analytics, the prose drift) were lifted into the 🌙 block's ▶ OPEN rather than archived with it; including 💳 **Stage 2b** (the price ladder, checkout and the webhook — and the finding I published without measuring it), 🧾 **Stage 2a** (the seat materialiser) and 🚪 **the funnel day** (the check became optional, the demo route, and the `onComplete` corpse), all moved 2026-08-30 — ⚠️ their still-live items (B12, `DRAFT = true`, the nine Dependabot PRs, Vercel Analytics, the anon-INSERT prose drift) were checked against the 🔒 Stage 3 block first and are all recorded there; including 💳 **the billing-schema apply day** (applied to production and completely inert, and the rollback capture that caught a migration silently reverting a security fix), moved 2026-08-28 — ⚠️ its still-live items (B12, the nine untriaged Dependabot PRs, and RLS gating the RECORD rather than chapter CONTENT) were checked against the newer blocks first and are all still recorded there; including 🧾💳 **the Stage-1 billing schema day** (RLS, entitlement, the guard at all three write paths), moved 2026-08-27; including 🧾 **the ledger-repair day** (58 repo migrations relabelled to the versions production recorded, `perf_advisors` applied, and the dry-run computed rather than credentialled), moved 2026-08-25 — ⚠️ its one still-live item (the anon-INSERT prose drift) was lifted into the current ▶ OPEN rather than archived with it; including 🔐 **the road-to-a-paywall day** (the RLS suite that had never run once, three privacy gaps between the published copy and the system, the anon INSERT closed, and the security regression caught four minutes after shipping), moved 2026-08-25 — ⚠️ its still-live blockers (B1/B2 `DRAFT = true`) were lifted into the current ▶ OPEN rather than archived with it; including 🚦 **the production-readiness day** (three workflows green while doing nothing, the dead error sink, eight chapters unstartable on a landscape phone), moved 2026-08-25; including 🔬 the seven-learner-models day (moved 2026-08-24), 🕸️ the skill-graph sensitivity audit and 🎯 the diagnostic's 96–98% rebuild, both moved 2026-08-24; plus 🇺🇸 the US-spelling / SEO / region-migration day, 🔗 the social-handles day, ❓ the question-quality sweep and 🎚️ the adaptive-loop day, all moved 2026-08-22) live in [docs/handoff-archive.md](docs/handoff-archive.md) — not loaded at session start. `grep` it for a chapter or a decision. Moved there to keep this file inside its size budget: the two 2026-08-14 blocks (🧱 all six neon chapters onto GameShell · 🎛️ the band moving onto the 12–18 engine) on 2026-08-16, 🏗️ **The Empty Plot** (the last neon chapter + the 3D deletion + the explainer-film pipeline) on 2026-08-17, 📊 **The Loading Bay** (the first storybook chapter onto GameShell, and the mastery exit finally seen to fire) and 🚀 **the first launch-hardening day** (0 security advisories, crash screens, self-hosted fonts, the enforced CSP, legal plumbing, the launch runbook) both on 2026-08-17, and 🔒 **launch hardening round two** (the walkthrough dead end, the CSP gate that had been red for a day, `media-src` silently killing the recorded voice on mobile) on 2026-08-18, and 🕳️ **the plan-pointer P0** (`ChapterPortal` dropping `onComplete`, so no child's diagnostic plan advanced for three months — plus the one-emoji-to-crawlers SEO fix and the inert short-landscape gate) on 2026-08-18, and 🧭 **the 2026-08-18 architecture/security/devops day** (the layering refactor, V13–V20, the two vacuous scheduled sweeps) on 2026-08-19, and ⚡ **the performance pass** (57 MB of art revalidated on every request, every backdrop shipped as full-size PNG, every creature journey relaying out the document — plus the /game fit controller that turned out to be dead code) on 2026-08-19, and 🛡️ **the five-role red-team day** (the AR camera door that could strand a child for ever, the placement check dying on one Back press, and the regression I shipped inside my own fix) on 2026-08-20, and — moved 2026-08-24 — 🚚 **The Packing Shed + The Minibus Run** (the two 9–11 chapters that closed the multiplication/division content hole) and 🎯 **the diagnostic rebuild** (26–34% → 81–87%, the answer-surface fix and the first accuracy gate), and — moved 2026-08-23 — 📐 **the tester's-four-bugs / responsiveness-sweep / `useOnceGuard` day** (the StrictMode ref guard that froze ten chapters' demos in dev only, 683 → 2 sub-44px tap targets, and 20/20 storybook coverage), and — on 2026-08-21 — ⚡ **the font pass** (Gaegu preloading 90 subsets), 🔎 **the public-SEO pass**, 🏷️ **the AdaptiveLearn rename**, and 🏗️ **the move onto the company account** (whose still-open items were carried forward into the 🧭 block rather than archived with it)._
