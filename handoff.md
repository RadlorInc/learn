# Session Handoff — Milo Story Mode

> 🆕 **THE NEW TEACHING FLOW COVERS GRADES 3–8 (2026-09-14) — READ [docs/new-flow/README.md](docs/new-flow/README.md) AND [docs/new-flow/AUTHORING.md](docs/new-flow/AUTHORING.md) BEFORE ANY LESSON WORK.**
> All **36 modules / 260 topics** are written as data in `src/features/lessons/content/g<grade>m<module>.ts` (topic split:
> [docs/new-flow/curriculum.md](docs/new-flow/curriculum.md)); Grade 3 · Module 1 stays in `grade3Module1.ts`. Every legacy
> chapter is hidden (`LEGACY_CHAPTERS_HIDDEN`). The child's home is **`/modules`** (grade tabs 3–8); the UI is the
> founder's SampleUI template (`Frame.tsx`, `PracticeLayout.tsx`) — build into those, do not re-lay-out a screen.
> ⚠️ **Grade 3 Modules 2–6 and Grades 4–8 were built WITHOUT founder review of the scripts** (founder's call: "no review,
> build all"). Story in the 📚 block below.
> 🏠 **2026-09-14: `/parent` is the MathPath home** (sidebar menus per role, "Coming soon" placeholders, `RoleGate` on the teacher/parent-only pages) and **every Grade 5 topic has a drawn backdrop.** This folder is on `main`; the classroom work is parked on `classroom-parked`. Story in the 🧩 block below.

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
> to a `^> [⚖️📊🧪🔊]` sweep on the day it landed, and a miscount here is a miscounted budget.
> ⚠️ **AT 2026-09-15 (🧩 block added): 🎓 2026-09-11/12 WENT OUT, legal items lifted into 🧩's ▶ OPEN.** The next block out is 🧭 2026-09-13.
> ⚠️ **AT 2026-09-15 (🔢 block added): 🧭 2026-09-13 WENT OUT, its live items lifted into 🔢's ▶ OPEN item 4.** The next block out is 🎨 2026-09-13 (evening).)_

> 🔢 **2026-09-15 — GRADE 5 · MODULE 1 RE-SPLIT FROM 8 TOPICS TO THE 20 LESSONS OF THE TEXTBOOK CONTENTS PAGE THE FOUNDER PHOTOGRAPHED (lesson and part names only; every story, screen and number is ours), 12 NEW BACKDROPS, AND WIDE TABLES THAT NO LONGER RUN OFF A PHONE.** ⚠️ **UNCOMMITTED on `main` — not pushed, not deployed (the founder did not ask).** `tsc` 0 · vitest **106 files, 3052 passed**, 20 skipped · `next build` 0 · **sw v188 → v189** (art changed under the same file names, and assets are cache-first per VERSION — v189 must ship with it).

## ① 📸 WHAT THE FOUNDER ASKED
Two photos of a Grade 5 Module 1 contents page (Topics A–D, Lessons 1–20) plus `~/Downloads/grade-5-module-1.pdf` (Eureka Math 2015 student workbook, 16 decimal-heavy lessons): the PDF holds only ~5 of the photo's lessons. Then: *"build the photo's topics and lessons in our app — names only, content ours, same rules as the other modules, don't ask me anything."*

## ② 🧩 WHAT CHANGED
- **`docs/new-flow/curriculum.md`**: Grade 5 Module 1 is 20 topics, one per photo lesson, titles shortened to the app's style (the objectives run 60–90 characters and the topic path's labels are ~210px). Parts: A 1–6 place value · B 7–11 multiplication · C 12–16 division · D 17–20 multi-step. Module title → *Place value concepts for multiplication and division with whole numbers* (`modules.ts`).
- **`content/g5m1.ts` 8 → 20 lessons.** Four writer agents wrote parts A–D in parallel from one plan (Screen 1 settings fixed so the art matches), then merged into one file (helpers suffixed A–D; the merge was checked deep-equal to the parts before they were deleted). Old t1 → t1, t3 → t2, t2 → t3, t4 → t4, t5 → t9, t7 → t15 were reused where they fit the new idea; t16 and t17 keep only their old stories (stickers, bags of fruit).
- **Answer key** rewritten by two blind solvers from `lesson-questions.mjs` output: **140 of 140 agree** (watched red: a planted `26323` names t10's turn). ⚠️ **My brief to the solvers used three real answers as format examples** (`110640`, `3 × (4 + 5)`, `>`); both say they re-derived every answer independently. README step 2 now forbids it.
- **Backdrops:** 8 old files renamed to their new topic (`git mv`: t2↔t3, t5→t9, t6→t16, t7→t15, t8→t17); 12 new (t5–t8, t10–t14, t18–t20). Nano Banana 2 at 1k with `table.webp` as the reference: **18 credits, 738.5 → 720.5**. I looked at all 12 and zoomed into three for stray lettering; none has text. `lessonScenes.test.ts` count 46 → 58, watched red both ways (a file removed names `g5m1-t20`; a scene removed names `g5m1-t12`).
- **Pictures the solvers flagged, all changed:**
  - t1 practice 3's chart showed Hundreds = 0 for "how many hundreds make 4,000"; it is now an `eq`.
  - t6's "how many fit" tapes always drew one cup as 1/4, whatever the real share; they are now `eq`.
  - The off-scale tapes in t18 practice 4 and t20 practice 5 are now `eq`.
  - t18 practice 3 is drawn to scale.
  - t17 practice 4's comparison is on one line.
  - t18 practice 2 asks "in all".
- **Engine, every module:**
  - `Diagrams.tsx` `Table` zooms a table down to fit its box. It uses `useLayoutEffect` and refits on window resize and `document.fonts` `loadingdone`; it is not a ResizeObserver, because the zoom changes the box's height. Headings drop to 13px on phones.
  - `Frame.tsx` `stage` gets `minWidth: 0`: in a row the stage grew to its widest picture and the shell cut the rest off.
  - Measured at 375px: g5m1 t1/t2 and g4m1-t1 charts were cut off (t2 lost Tens and Ones, the digits the question is about). Now every screen through Screen 8 fits. The sweep was watched: zoom off gives 105px of overflow.
  - At ≥1000px wide the table is identical (22px, 14px padding, no zoom). Below 1000px the cell side padding is `clamp(5px, 1.4vw, 14px)`.

## ③ 🔎 NOT VERIFIED, AND WHAT TO KNOW
- **The founder has read none of the 20 lessons.** Writers' pitch notes:
  - t7 is Grade 4 review (a one-digit multiplier, the same idea as g4m3-t2).
  - t10 practice 3–4 have six-digit answers.
  - In t13 practice 2 (58 ÷ 29), the first guess is 1.
  - In t18 the child never makes a story; they solve one or pick its expression.
  - t17 is 5 picks out of 7.
- **The part names A–D exist only in curriculum.md and file comments.** The child's path shows 20 stops with no part headings, and module practice is now 20 mixed problems.
- **Progress is per-device and keyed by lesson id,** so a device that finished old g5m1-t1…t8 shows the NEW t1…t8 as done. Parent `lesson_ids` choices naming g5m1 topics now point at different lessons (0 learners had any choice on 2026-09-14; not re-measured).
- **Tape diagrams are ~8px text on a 375px phone,** in every module (`Tape`'s viewBox is 648 wide). Not touched.

## ▶ OPEN
1. 🔴 **Commit → PR → deploy when the founder asks.** sw v189 goes with the renamed art.
2. 🔴 **Founder read of g5m1** at `/lesson-preview?module=g5m1`, especially the shortened titles against the photo. To change a title, change `curriculum.md` and the lesson together.
3. ⏭️ Tape diagram text size on phones, in every module.
4. ⏭️ **LIFTED from 🧭 2026-09-13:**
   - The landing heading/paragraph still describe the placement check, which is off (as of 2026-09-13; not re-checked).
   - "Read it to me" is browser speech only.
   - PR #95 (stop `main` previews) status unconfirmed.
5. ⏭️ Carried: the 🧩, 📚 and 🎨 blocks' ▶ OPEN.

> 🧩 **2026-09-14/15 — THE MATHPATH HOME PAGE WITH ROLE MENUS AND ROLE GUARDS, DRAWN BACKDROPS FOR ALL 46 GRADE 5 TOPICS, AND A TANGLED BRANCH SORTED OUT: THE CLASSROOM WORK PARKED, THIS FOLDER BACK ON `main`.** PRs [#107](https://github.com/RadlorInc/learn/pull/107) + [#108](https://github.com/RadlorInc/learn/pull/108) merged (`c66e78b4`, `20c12fc0`) · #106 closed as superseded · `tsc` 0 · vitest **106 files, 3004 passed** · `next build` OK · **sw v186 → v188** · **LIVE — as measured 2026-09-14:** Deploy run green, `release` = `20c12fc0`, `sw.js` serves **v188**, `/assets/lessons/g5m6-t1.webp` 200, `/lesson?id=g5m3-t1` shows its backdrop with 0 console errors, the live CSS carries `.home-nav`/`.home-app`. Re-measure: `curl -s https://adaptivelearn.radlor.com/sw.js | head -1`.

## ① 🏠 THE HOME PAGE (`/parent`), FROM THE FOUNDER'S `mathpath-home-dashboard.html` MOCKUP
- Sidebar (a sideways bar under 1024px) · greeting · stat cards (learners, **lessons finished "· this device"** — progress is per-device kv, so it reads 0 on a parent's phone for a child who played on the tablet —, XP) · a lessons table per learner that follows `chosenModules(lesson_ids)` · quick actions. The old dashboard (picker, stats card, Choose topics, chapter progress, activity, data rights) sits below unchanged. Styles: `.home-*` in `globals.css`.
- **Every sidebar option of the mockup, for both roles, picked by `profiles.role`** (no switch — founder: "access as per the role"). Family: Home, Learners, Lesson library, Assign lessons, Performance, Plan & billing, Settings, Help. Teacher: Class Home, Roster, Groups, Lesson library, Assign, Class dashboard, Classroom plan, Help. `FAMILY_NAV`/`TEACHER_NAV` at the top of `parent/page.tsx`: `href` = a real page, `view` = in place, **`soon` = a "Coming soon" placeholder** (founder: "if an option is not there, put a placeholder"). Real today: Home, Learners, Lesson library (all 36 modules), Plan & billing, Help; Settings links Close account; teacher placeholders link `/parent/grades` where honest.
- **`RoleGate`** (`src/shared/ui/RoleGate.tsx`): `/parent/grades` + `/triage` teacher-only, `/parent/plan` parent-only; `/parent`, `/invites`, `/account` shared. Wrong role → `/parent`. UX gate only (RLS is the boundary); fails OPEN on a role-read error. `roleGate.test.ts` writes the page→role map by hand; watched red on three planted breaks.
- ⚠️ **Measured in production (read-only) before shipping: both `grades` rows belong to ONE parent-role account, 0 to teachers.** That parent now bounces off the grades screen; data untouched. Switch that account to `teacher` if they need it.
- Also carried in #107: the nine responsive parent/auth screens (`3f80ada2`, Stitch designs), which had sat unmerged on `adult-surface-responsive`.

## ② 🎨 GRADE 5 BACKDROPS (the Topic 1 treatment, per topic)
Grade 5 is diagrams only (no object sprites), so what carries over from Grade 3 Topic 1's art is the Screen 1 **`scene`** backdrop. All **46 topics** have `scene: '<topic id>'` → `public/assets/lessons/g5m<m>-t<t>.webp`, matched to the story. Nano Banana 2 1k 16:9, **`table.webp` imported as the style reference**, objects at sides/bottom with a plain centre; 1200px WebP q72, 1.4 MB total. `scene` is now any file name; **`lessonScenes.test.ts`** fails if a named scene has no file (watched red with 46 missing). Recipe in `docs/new-flow/AUTHORING.md`. **73.5 Higgsfield credits** (46 + 1 redo — the tile shop first drew books — + 2 style tests), balance 812 → 738.5. All 46 reviewed by eye; `g5m3-t5`'s flour bag says "FLOUR" (kept).

## ③ 🧶 WHY EVERYTHING LOOKED JUMBLED, AND HOW IT WAS SORTED
Three versions were running at once: production = `main` (new modules, old home) · localhost = this folder on `adult-surface-responsive`, **26 commits behind `main`** (new home, old modules) · the new work in unmerged PRs. Fix: rebuilt the home page on a fresh branch from `main` (two conflicts resolved: kept `main`'s `LEGACY_CHAPTERS_HIDDEN` guards and its Choose topics button), stacked #108 on #107, merged both, then moved this folder to `main`.
- **Classroom + child logins PARKED on branch `classroom-parked`** (founder agreed to sort it the safe way): it assigns legacy chapters, which are hidden, and needs a security-model migration (`20260912100000_classroom.sql`, applied nowhere). Rework onto the new lessons before it ships. `adult-surface-responsive` is superseded.
- **This folder's uncommitted Grade 3 Module 1 edits** (`LessonPlayer.tsx`, `Pictures.tsx`, `grade3Module1.ts`, `script.ts`, `public/assets/lessons/`) were committed to a **LOCAL-ONLY branch `old-lesson-edits`** (`b17dd26a`, not pushed) before the checkout. They predate `main`'s general engine; check before carrying anything forward.
- ⚠️ My first `gh pr merge` was blocked by the harness permission classifier; merges went through once the founder explicitly asked for production.

## ④ 🔎 NOT VERIFIED
- The home page and the wrong-role redirect with a **real signed-in parent and teacher** — every drive used temporary fake data (removed before commit) or a signed-out visit (`/parent/plan`, `/parent/grades/triage` → `/auth`).
- On a **portrait phone** the backdrop is `background-size: cover` on a tall stage, so side objects are cropped (e.g. `g5m3-t1` shows cabinets, not the pizzas). Lesson works; offered a mobile position tweak, not done.

## ▶ OPEN
1. 🔴 **Sign in once as a parent and once as a teacher on production:** the new home, each role's menu, and a wrong-role URL (`/parent/grades` as a parent) landing on `/parent`.
2. ⏭️ **Placeholders to build:** Assign lessons, Performance, Settings (family); Class Home, Roster, Groups, Assign, Class dashboard, Classroom plan (teacher). Swap each `soon` for `href`/`view` in the nav lists.
3. ⏭️ Backdrops for Grades 3 (M2–6), 4, 6, 7, 8 if wanted — same recipe; and the phone crop above.
4. ⏭️ Decide the classroom's future on the new lessons (`classroom-parked`); delete `old-lesson-edits` once checked.
5. 🔴 **LIFTED from 🎓 2026-09-11/12 — §8's refund sentence is unwritten and LIVE on the Terms page.** One sentence from the founder closes it.
6. 🔴 **LIFTED — UNANSWERED, ASKED TWICE: was radlor.com's Terms of Use reviewed by an attorney?**
7. 🔴 **LIFTED — Terms §11 not rewritten around what survives deletion** (`src/core/accountDeletion.ts`).
8. ⏭️ **LIFTED — Stripe cancellation not wired** (must be before the first live purchase; zero subscriptions today).
9. ⏭️ Carried: the 📚, 🎨 and 🧭 blocks' ▶ OPEN. ⚠️ 🧭 item 6 (branches) is now STALE — see ③.

> 📚 **2026-09-14 — GRADES 3 TO 8, ALL 36 MODULES, WRITTEN AND GATED; A GENERAL LESSON ENGINE (fractions, decimals, negatives, times, choices, 21 diagram kinds); AND PARENTS CHOOSE TOPICS.** Branch `new-flow-all-grades` (worktree `../milo-lesson-art`) · `tsc` 0 · vitest **104 files, 2998 passed** · `next build` OK · **sw v185 → v186** · PR [#104](https://github.com/RadlorInc/learn/pull/104) **merged `1b31cf06` and LIVE — as measured 2026-09-14:** Deploy run green, `sw.js` serves **v186**, `/modules` shows grade tabs 3–8, `/lesson?id=g8m4-t7` plays to Screen 8 with its diagram and 0 console errors, `/lesson-preview` shows the not-found screen in production. Re-measure rather than trust this sentence: `curl -s https://adaptivelearn.radlor.com/sw.js | head -1`. ✅ **Migration APPLIED TO PRODUCTION 2026-09-14** (founder: "apply the migration to production") by hand via Supabase MCP `apply_migration`; the ledger recorded **`20260914015455`**, so the repo file was renamed to match. Target confirmed as `wrnjqjhrbnqxornmfisf` three ways: the literal in `scripts/assert-prod-ref.sh`, the `PROD_PROJECT_REF` variable, and the Supabase host in the LIVE bundle. (Merging never applies migrations here: `migrate-prod` needs `migrate-staging`, which is skipped.) Before it the same day: PR [#103](https://github.com/RadlorInc/learn/pull/103) merged and live (sw v185) — Higgsfield art for Topic 1 (`public/assets/lessons`), no scroll on Screen 8, **← Back on Screens 2–8**.

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
1. ✅ **Live** (see the block's first line). ⏭️ Local dev's `.env.local` points at Supabase project `qaymxunzlarwusogwyak`, NOT production `wrnjqjhrbnqxornmfisf` — probably the decommissioned Sydney project; localhost is not testing against production data.
2. 🔴 **Prove the write:** as a signed-in parent, Choose topics → save a few → the button reads "N chosen" → Start learning shows only those. Then set it back to "Every topic". Until someone does this, the save path has only been reasoned about.
3. 🔴 **The founder has read none of Grade 3 M2–6 or Grades 4–8.** `/lesson-preview?module=<id>` is the fastest way to read a module. Notable writer compromises: g4m5 protractor readings are multiples of 10; g6m6 has no 360° around a point (angle picture is a half circle); g7m4 and g8m5 use π ≈ 3.14 with exact answers; g8m1 exponent answers are typed as the exponent number; g6m5/g7m3 expressions are always choices.
4. ⏭️ **Bundle:** every grade loads eagerly — one ~1.2 MB (≈275 KB gz) chunk on the child's screens (`ponytail:` note in `content/index.ts`).
5. ⏭️ Lesson progress is still per-device; no grade is assigned to a child (tabs show every grade, or only the chosen topics' grades).
6. ⏭️ **LIFTED from 🧹 2026-09-10:** PR #95 status unconfirmed here; the `answer` event awaits founder approval; `auth_events` after two sign-ins never read; `ADMIN_MIN_COHORT=1` founder-only; **purge cliff 2026-09-27** (520 events in one night) unless the rollup lands; `profiles.is_internal` client-writable (grants nothing); account deletion never executed end to end; `migrate-prod` inert; Sydney rollback (~$10/mo); `entitled_chapters` has no caller; auth migrations `20260908120000`/`20260908120100` await hand-apply; `counting` flake in `ready-bar.spec.ts`.
7. ⏭️ Carried: the 🎨 and 🧭 blocks' ▶ OPEN; 🎓's legal items now live in the 🧩 block (🎨 items 4 and 5 are DONE — each module has its own Learn link; Back shipped in #103).

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

_Older sessions (2026-06-15 → **2026-09-13**, including 🧭 **the pivot day** (2026-09-13: every old chapter hidden, the 9-screen flow live with Grade 3 Module 1, the voice clips deleted, Vercel from 272 deployments to 2), moved 2026-09-15 — ⚠️ **its live items (landing copy, browser-only read-aloud, PR #95) were LIFTED into the 🔢 2026-09-15 block's ▶ OPEN, item 4**; including 🎓 **the classroom block** (2026-09-11/12: a teacher's syllabus had silently become each rostered child's app; child logins; set work), moved 2026-09-15 — ⚠️ **its code is PARKED on branch `classroom-parked`, never merged, migration applied nowhere; its legal items were LIFTED into the 🧩 2026-09-14/15 block's ▶ OPEN, items 5–8**; including 🧹 **the deployment-storage day** (2026-09-10: 53 GB of builds on a 10 GB plan, 80 dead previews deleted, `main` previews stopped by PR #95), moved 2026-09-14 — ⚠️ **its live items were LIFTED into the 📚 2026-09-14 block's ▶ OPEN, item 6**; including 🚀 **launch week** (2026-09-09/10: moving `release` backwards deploys nothing, `/api/lead` reported success on a failed write, Dependabot alerts had never been on, 17-18 fully voiced), moved 2026-09-13 — ⚠️ **its live items were LIFTED into the 🎨 block's ▶ OPEN, items 7–9**; including 🎙️ **the Chatterbox voice block** (2026-09-07→09: whole-line TTS on a free GPU, four bands voiced), moved 2026-09-13 — ⚠️ its one live thread (15-16 voice, Kaggle render) is MOOT: the clips were deleted that day; including ⚖️ **the legal day** (the Terms said things the product does not do — "delete your account at any time" had nothing behind it at all; both documents behind the draft banner, and account deletion built and proven not to orphan before a line of it was written), moved 2026-09-12 — ⚠️ **its live legal items were LIFTED into the 🎓 2026-09-11/12 block's ▶ OPEN, items 4–7**; including 📊 **the /admin day** (four panels that could not have been honest, the privilege escalation caught one step before production, the funnel that was not a funnel, and the discovery that CI had never gated anything), moved 2026-09-10 — ⚠️ **its live items were LIFTED into the 🧹 2026-09-10 block's ▶ OPEN, items 3–9**, and one of its own ▶ OPEN lines was already stale when it went (Vercel's Production Branch is `release`, measured — the CI gate is live, do not re-do it); including 🗣️ **the voice-cutoff day** (nothing Milo says is cut off by the next thing, in any band — and the audit that proved it was only half done the first time), moved 2026-09-10 — ⚠️ **its rule is NOT archived with it**: the speak-verb contract and `voiceBoundaryVerb.test.ts` are written up in **docs/chapter-craft.md §3**, and `scripts/break-check.sh` (ported there from `video_reviewer`, and existing in BOTH repos with different runners) is described in CLAUDE.md; including 🔊 **the voice-on-the-CDN day** (three silent defects in one chain, the first honest cost accounting, and the stitcher that failed its listening test) and 🧪 **the Chatterbox evaluation** (Resemble AI TTS in a scratch venv, Nano off the table, the GPU-cost argument), both moved 2026-09-09 — ⚠️ 🔊's live ▶ OPEN was lifted into the 🎙️ 2026-09-07→09 block (the stitcher is now moot — whole-line via GPU replaced it) and 🧪 is superseded by that block; including ✅ **the region-move CUTOVER day** (eleven dispatches, ten red, every red a real defect in the workflow — and the auth trigger a schema dump does not carry), moved 2026-09-06 — ⚠️ its still-live items (the Sydney rollback, `SUPABASE_SERVICE_ROLE_KEY` never exercised, the missing `production-db` environment, the uncommitted /menu RPC half, `entitled_chapters` with no caller) are carried in the ⚖️ 2026-09-06 block's ▶ OPEN item 7; including 🚀 **the Pro / region-move GO day** (the one-job workflow that diffs the same query on both databases) and 🌏 **the load-measurement day** (the database was in Sydney while every user was in the US, and the nightly backup had never run), both moved 2026-09-05 — ⚠️ their still-live items are carried in the ✅ region-move block above and — since 📊 2026-09-05 was itself archived on 2026-09-10 — in the 🧹 2026-09-10 block's ▶ OPEN (`backup.yml` is FIXED, PR #91; the `production-db` environment and the two Supabase secrets remain); including 🎙️ **the first voice-rendering session** (17–18 got its 161 clips, 3–5 got Teddy Twinkle and 872 of 1,411 lines), moved 2026-09-04 the same day it was superseded — ⚠️ everything it left uncommitted was committed and deployed in the 🔊 block above, and its still-live items (nobody has heard it on a device, OrderDesk/LevelRun have no clips, the MCP key) are carried there; including 🌙 **the nightly-E2E day** (12 runs red since the day it was created, the AR escape hatch half off a 640×320 screen, and the CI-only text-metric difference), moved 2026-09-04 — ⚠️ its still-live items (the scheduled-run green, the hull silence, the `counting` flake, and every launch blocker in its ▶ OPEN) are carried in the 🔊 2026-09-04 block above; including 🗒️ **the second tester pass** (Great job!, the hull silence diary, the typed directions line in all 72 chapters), moved 2026-09-04 — ⚠️ its still-live items (the hull silence, the `counting` flake) are carried in the 🌙 block's ▶ OPEN, and its "PR #69 is open" line was already stale when archived (merged 2026-08-31 as `9a4bcc3`); including 📏🎓 **the student-review days** (the run resumes, Ready everywhere, praise to 6–8, the number-tag overhang) and 🐇 **the line behind mother** (even spacing for one species, and the tautology guarding the approved picture), all moved 2026-09-03 — ⚠️ their still-live items (recorded clips for 3–11, the `counting` flake in `ready-bar.spec.ts`) are already carried in the 🌙 block's ▶ OPEN and the 🎙️ 2026-09-03/04 block; including 🔒 **Stage 3** (the chapter gate and the screens — a lock that names what is behind it, and a paywall built inert but tested refusing), moved 2026-08-31 — ⚠️ its still-live items (the deferred watched purchase, B12, `DRAFT = true`, the free-set pick, the nine Dependabot PRs, Vercel Analytics, the prose drift) were lifted into the 🌙 block's ▶ OPEN rather than archived with it; including 💳 **Stage 2b** (the price ladder, checkout and the webhook — and the finding I published without measuring it), 🧾 **Stage 2a** (the seat materialiser) and 🚪 **the funnel day** (the check became optional, the demo route, and the `onComplete` corpse), all moved 2026-08-30 — ⚠️ their still-live items (B12, `DRAFT = true`, the nine Dependabot PRs, Vercel Analytics, the anon-INSERT prose drift) were checked against the 🔒 Stage 3 block first and are all recorded there; including 💳 **the billing-schema apply day** (applied to production and completely inert, and the rollback capture that caught a migration silently reverting a security fix), moved 2026-08-28 — ⚠️ its still-live items (B12, the nine untriaged Dependabot PRs, and RLS gating the RECORD rather than chapter CONTENT) were checked against the newer blocks first and are all still recorded there; including 🧾💳 **the Stage-1 billing schema day** (RLS, entitlement, the guard at all three write paths), moved 2026-08-27; including 🧾 **the ledger-repair day** (58 repo migrations relabelled to the versions production recorded, `perf_advisors` applied, and the dry-run computed rather than credentialled), moved 2026-08-25 — ⚠️ its one still-live item (the anon-INSERT prose drift) was lifted into the current ▶ OPEN rather than archived with it; including 🔐 **the road-to-a-paywall day** (the RLS suite that had never run once, three privacy gaps between the published copy and the system, the anon INSERT closed, and the security regression caught four minutes after shipping), moved 2026-08-25 — ⚠️ its still-live blockers (B1/B2 `DRAFT = true`) were lifted into the current ▶ OPEN rather than archived with it; including 🚦 **the production-readiness day** (three workflows green while doing nothing, the dead error sink, eight chapters unstartable on a landscape phone), moved 2026-08-25; including 🔬 the seven-learner-models day (moved 2026-08-24), 🕸️ the skill-graph sensitivity audit and 🎯 the diagnostic's 96–98% rebuild, both moved 2026-08-24; plus 🇺🇸 the US-spelling / SEO / region-migration day, 🔗 the social-handles day, ❓ the question-quality sweep and 🎚️ the adaptive-loop day, all moved 2026-08-22) live in [docs/handoff-archive.md](docs/handoff-archive.md) — not loaded at session start. `grep` it for a chapter or a decision. Moved there to keep this file inside its size budget: the two 2026-08-14 blocks (🧱 all six neon chapters onto GameShell · 🎛️ the band moving onto the 12–18 engine) on 2026-08-16, 🏗️ **The Empty Plot** (the last neon chapter + the 3D deletion + the explainer-film pipeline) on 2026-08-17, 📊 **The Loading Bay** (the first storybook chapter onto GameShell, and the mastery exit finally seen to fire) and 🚀 **the first launch-hardening day** (0 security advisories, crash screens, self-hosted fonts, the enforced CSP, legal plumbing, the launch runbook) both on 2026-08-17, and 🔒 **launch hardening round two** (the walkthrough dead end, the CSP gate that had been red for a day, `media-src` silently killing the recorded voice on mobile) on 2026-08-18, and 🕳️ **the plan-pointer P0** (`ChapterPortal` dropping `onComplete`, so no child's diagnostic plan advanced for three months — plus the one-emoji-to-crawlers SEO fix and the inert short-landscape gate) on 2026-08-18, and 🧭 **the 2026-08-18 architecture/security/devops day** (the layering refactor, V13–V20, the two vacuous scheduled sweeps) on 2026-08-19, and ⚡ **the performance pass** (57 MB of art revalidated on every request, every backdrop shipped as full-size PNG, every creature journey relaying out the document — plus the /game fit controller that turned out to be dead code) on 2026-08-19, and 🛡️ **the five-role red-team day** (the AR camera door that could strand a child for ever, the placement check dying on one Back press, and the regression I shipped inside my own fix) on 2026-08-20, and — moved 2026-08-24 — 🚚 **The Packing Shed + The Minibus Run** (the two 9–11 chapters that closed the multiplication/division content hole) and 🎯 **the diagnostic rebuild** (26–34% → 81–87%, the answer-surface fix and the first accuracy gate), and — moved 2026-08-23 — 📐 **the tester's-four-bugs / responsiveness-sweep / `useOnceGuard` day** (the StrictMode ref guard that froze ten chapters' demos in dev only, 683 → 2 sub-44px tap targets, and 20/20 storybook coverage), and — on 2026-08-21 — ⚡ **the font pass** (Gaegu preloading 90 subsets), 🔎 **the public-SEO pass**, 🏷️ **the AdaptiveLearn rename**, and 🏗️ **the move onto the company account** (whose still-open items were carried forward into the 🧭 block rather than archived with it)._
