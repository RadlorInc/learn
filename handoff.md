# Session Handoff — Milo Story Mode

> 🆕 **THE NEW TEACHING FLOW COVERS GRADES 3–8 (2026-09-14) — READ [docs/new-flow/README.md](docs/new-flow/README.md) AND [docs/new-flow/AUTHORING.md](docs/new-flow/AUTHORING.md) BEFORE ANY LESSON WORK.**
> All **36 modules / 282 topics** (counted 2026-09-16, Grade 3 Module 1's 8 included) are written as data in `src/features/lessons/content/g<grade>m<module>.ts` (topic split:
> [docs/new-flow/curriculum.md](docs/new-flow/curriculum.md)); Grade 3 · Module 1 stays in `grade3Module1.ts`. Every legacy
> chapter is hidden (`LEGACY_CHAPTERS_HIDDEN`). The child's home is **`/modules`** (grade tabs 3–8); the UI is the
> founder's SampleUI template (`Frame.tsx`, `PracticeLayout.tsx`) — build into those, do not re-lay-out a screen.
> ⚠️ **Grade 3 Modules 2–6 and Grades 4–8 were built WITHOUT founder review of the scripts** (founder's call: "no review,
> build all"). Story in the 📚 block below.
> 🏠 **2026-09-14: `/parent` is the MathPath home** (sidebar menus per role, "Coming soon" placeholders, `RoleGate` on the teacher/parent-only pages) and **every Grade 5 topic has a drawn backdrop.** This folder is on `main`; the classroom work is parked on `classroom-parked`. Story in the 🧩 block below.
> 🔢 **2026-09-15: Grade 5 · Module 1 is 20 lessons**, re-split from the textbook contents page the founder photographed (lesson and part names only; the content is ours). Wide tables now zoom to fit a phone in every module. **LIVE** (PR #109, sw v189). The founder has not read the 20 lessons. Story in the 🔢 block below.
> 🪜 **2026-09-17: practice is ADAPTIVE in all 36 modules — each level is a different KIND of question, every ladder agreed with a blind solver, and review brings weak topics back.** Branch `adaptive-practice`, uncommitted. No human has read a ladder. Story in the 🪜 block below.
> 🔐 **2026-09-17: children sign in with a username + password set by their parent or teacher; the parent dashboard asks a PIN every time; closing an account removes the children's logins.** LIVE (PRs #115–#117 + this one). ⚠️ `.env.local` now points at PRODUCTION. Story in the 🔐 block below.
> 🧑‍🏫 **2026-09-16: every lesson is a TEACHER — she says a line, then writes or draws it on the board (`Screen.beats`).** **Production has it on 2 sample topics only; all 282 are converted on branch `lesson-teacher-voice`, pushed, NOT merged** (unread wording, sw not bumped). New lesson work follows the beats section of AUTHORING.md — the gate refuses a teaching screen without beats. Story in the 🧑‍🏫 block below.

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
> ⚠️ **AT 2026-09-15 (🔢 block added): 🧭 2026-09-13 WENT OUT, its live items lifted into 🔢's ▶ OPEN item 4.** The next block out is 🎨 2026-09-13 (evening).
> ⚠️ **AT 2026-09-16 (🧑‍🏫 block added): 🎨 2026-09-13 (evening) WENT OUT, its live items lifted into 🧑‍🏫's ▶ OPEN items 7–11.** The next block out is 📚 2026-09-14 — lift its ▶ OPEN (parents' topic-save write never proven, the ~1.2 MB eager bundle, per-device progress, the 🧹 items it carries) first.
> ⚠️ **AT 2026-09-17 (🪜 block added): 📚 2026-09-14 WENT OUT, its ▶ OPEN lifted into 🪜's item 6.** The next block out is 🧩 2026-09-14/15.)_
> ⚠️ **AT 2026-09-17 (🔐 block added): 🧩 2026-09-14/15 WENT OUT, its ▶ OPEN lifted into 🔐's item 9.** The next block out is 🔢 2026-09-15 — lift its ▶ OPEN (founder read of g5m1, tape text size) first.

> 🔐 **2026-09-17 (later) — CHILDREN SIGN IN AS THEMSELVES, THE PARENT DASHBOARD IS BEHIND A PIN, AND CLOSING AN ACCOUNT TAKES THE CHILDREN'S LOGINS WITH IT. PLUS ONE ADD BUTTON, A SEARCHABLE LESSON LIBRARY, AND THE VOICE QUEUE AT ZERO.** Every piece below was measured LIVE on 2026-09-17; re-measure with `curl -s https://adaptivelearn.radlor.com/sw.js | head -1`.

## ① WHAT SHIPPED (all merged and deployed)
| PR | what | sw |
|---|---|---|
| [#113](https://github.com/RadlorInc/learn/pull/113) | the last 2,527 voice clips (Screen 1/8/9, hints, twin, feedback, 27 Stevie) — every fixed lesson line has a clip; `lessonVoiceClips.test.ts` caps the queue at **0** | v193 |
| [#115](https://github.com/RadlorInc/learn/pull/115) | **child logins** · one "+ Add learner" button · Lesson library with grade filter, search, "+ Add to <child>'s lessons" (writes `lesson_ids`; first add = only that module, "Show every topic" undoes) | v194 |
| [#116](https://github.com/RadlorInc/learn/pull/116) | a child's `/modules` no longer flashes "← Switch" before "Sign out" | v195 |
| [#117](https://github.com/RadlorInc/learn/pull/117) | **parent PIN** on every `/parent` screen | v196 |
| this PR | `delete_my_account` removes children's logins · dead "Are you a student?" link (→ `/auth/child`, 404) removed | v197 |

## ② HOW IT WORKS — read before touching auth
- **Child login** = an auth account `<username>@learner.adaptivelearn.invalid` (`src/core/childLogin.ts`; ⚠️ changing that domain locks out every child) linked by a `learner_access` row with **`access_role = 'self'`**. The ONLY writer is `/api/child-login` (service role; caller from the verified token; ownership = `learners.created_by`, read with the CALLER's token). Parent: "Child logins" card on `/parent`; teacher: "Student logins" on `/parent/grades`. Login box takes email OR username; `profiles.role = 'learner'` routes to `/modules` (a UX label, not a permission — the child can rewrite it and gains nothing).
- **Parent PIN**: `app/parent/layout.tsx` → `ParentPinGate`, asked every time the dashboard opens. Table `parent_pins` (RLS on, NO policies, no client grants) + four SECURITY DEFINER RPCs keyed on `auth.uid()`. 5 wrong → 15 min lock, doubling, cap 24h. "Forgot PIN" lapses after **24h**; the right PIN cancels it. **A screen gate, not a data boundary.** Fails OPEN on PGRST202 (function missing) so a deploy ahead of its migration cannot lock parents out.
- **Migrations applied BY HAND to production** (files renamed to ledger versions): `20260917072319_child_logins` (CHECK admits 'self') · `20260917083255_parent_pin` · `20260917083744_reload_api_schema_parent_pin` (a harmless NOTIFY) · `20260917090504_delete_account_removes_child_logins` (REDEFINES DEFINER `delete_my_account`: body was production's verbatim, md5 `afa5cfcc…`, + four named changes; live md5 after = `9ed5e910…`, equal to the file).

## ③ MEASURED
- Founder drove on production: set ahmed's username/password → signed in as ahmed → `/modules`; ahmed opening `/parent` → back to lessons; set PIN, left and came back → asked again; one wrong PIN → "4 tries left"; ahmed not asked for a PIN.
- DB after: ahmed's account `self`, 1 access row, role `learner`, confirmed; 1 PIN, hashed, failed_count 1 (the wrong try).
- From OUTSIDE with production's anon key: all three PIN RPCs and a `parent_pins` read → **42501**, same as known-refused `prune_error_events`/`delete_my_account`.
- Tests: `childLogin.test.ts` (route vs stubbed Supabase), `parentPin.test.ts` (real schema, as anon/authenticated), `lessonLibrary.test.ts`, `accountDeletion.test.ts` (child logins go, another family's / a co-parent's / an adult's stay). Planted breaks watched red for each.

## ④ ⚠️ DEFECTS OF MINE, AND ONE FOUND
- ⚠️ **`.env.local` pointed at the decommissioned Sydney project `qaymxunzlarwusogwyak`** — local dev had been talking to the OLD database. My first outside probe of the PIN migration hit it and reported "function not found"; I sent a schema reload to production before noticing (hence `…083744`). **Founder repointed `.env.local` to production 2026-09-17 — local dev now writes REAL data.** It has no `SUPABASE_SERVICE_ROLE_KEY`, so child logins answer `not_configured` locally.
- Vercel's **Preview** environment has no `NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY` (Production only), so a preview deploy cannot reach Supabase at all — nothing auth-related can be tested on a preview.
- The live site took ~10 min after `promote` to serve a new sw — Vercel was still building. Check `vercel ls adaptivelearn --prod` before calling a deploy stuck.

## ▶ OPEN
1. 🔴 **Bootstrap gap:** until a parent sets a PIN, whoever holds the session can set it (asked on first dashboard visit).
2. 🔴 **Not driven:** "Forgot PIN" end to end; a lock after 5 wrong tries on production; closing a real account with a child login (only the pglite test has done it).
3. ⏭️ The child session can still reach the API directly with its token — RLS limits it to its own record (measured policies), but no impersonated query has proved it on production (the MCP connection is read-only and cannot `set role`).
4. ⏭️ Child logins: no teacher bulk-create; username change needs the password re-typed; a child's forgotten password = the adult sets a new one.
5. ⏭️ Enable Preview env vars in Vercel if previews should be testable.
6. ⏭️ `classroom-parked` still has a class-code child sign-in (`/auth/child`) — superseded by username logins; decide before reviving that branch.
7. ⏭️ Carried from the 🪜 block: no human has read a ladder; "X is right" rarely the answer; ladders bundle 907 KB; standing per device.
8. ⏭️ Carried from the 🧑‍🏫 block: founder read of the rewritten wording; pictures that show their own answer.
9. ⏭️ **LIFTED from 🧩 2026-09-14/15 (archived):** sign in once as a TEACHER on production (role menu, wrong-role URL) · placeholders to build (Assign lessons, Performance, Settings; teacher Class Home, Roster, Groups, Assign, Class dashboard, Classroom plan) · backdrops for other grades · decide `classroom-parked`, delete `old-lesson-edits` · **§8 refund sentence unwritten and LIVE** · **was radlor.com's Terms reviewed by an attorney? (asked twice)** · **Terms §11 not rewritten around what survives deletion** · Stripe cancellation not wired.

> 🪜 **2026-09-17 — PRACTICE IS ADAPTIVE IN EVERY MODULE: A HARDER QUESTION IS A DIFFERENT KIND OF QUESTION, NOT BIGGER NUMBERS. ALL 36 MODULES / 282 TOPICS / 5 STYLES EACH, EVERY ONE CHECKED BY A BLIND SOLVER.** ✅ **LIVE — as measured 2026-09-17:** PR [#112](https://github.com/RadlorInc/learn/pull/112) merged `9514cb3b` (it also shipped `lesson-teacher-voice`: every lesson a teacher), Deploy green, `release` = `9514cb3b`, `sw.js` serves **v192**; on production g5m1-t12 practice climbed bare → story → missing → two-step and mastered after 8, g3m2-t1 fetched Teddy clips (206), 0 console errors. Re-measure: `curl -s https://adaptivelearn.radlor.com/sw.js | head -1`. Voice queue: **0** since PR #113 (the 2,527 fixed lines rendered and merged); the notebook clones `adaptive-practice` · `tsc` 0 · vitest **108 files, 3984 passed**, 20 skipped · `next build` OK · rules, gate semantics and the leak classes in **docs/new-flow/AUTHORING.md → "Practice is ADAPTIVE"**.

## ① 🗣️ THE FOUNDER'S CALL
*"Questions are preset, but our main thing is the adaptive system — not only numbers growing; in some grades the question STYLE changes with difficulty."* Chosen: **template + numbers** (generated, answers computed) · adaptive in **lesson practice, module practice and across topics** · pilot g5m1 · **a ladder per topic**. Then: *"sab grade ke sab modules ke sab topic karo."*

## ② 🧩 WHAT EXISTS
- `adaptive.ts` (pure, seeded): `step` (2 first-try → up · miss or Hint → stay · worked → down · 2 first-try at top → mastered · cap 12), `advance` (3rd problem = the weakest finished, unmastered earlier topic, moving ITS standing), `nextModuleTopic` (10 problems; never-played = level 3, +2 per time already asked).
- `ladders/<module>.ts` ×36 (g5m1 split a–d) → `ladders/index.ts`; `lessonStanding.ts` per-device kv. `LessonPlayer` / `ModulePractice` use a ladder when a lesson has one (all do now; `mixedPractice` and each lesson's written `practice` are dead to the player but still gated).
- Gate `lessonLadders.test.ts`: `LADDERED` = all 36 written out · no two levels the same kind once numbers are stripped · 60 samples/level well formed, last step states the answer, labels don't print it · **agrees with `ladderKeys/<module>.ts`**, a solver written by a separate agent from `scripts/ladder-questions.mts` output only.
- `AnswerInput`: **the fraction box got a "−" key** — g8m2-t2's −3/4 (LIVE since 2026-09-14) could not be typed by anyone. `answerBoxCanExpress.test.ts` watched red naming it; driven in the browser, −3/4 marked right.

## ③ 🔴 WHAT THE BLIND SOLVERS AND AUDITS CAUGHT (writers' own checks passed every one)
- **Wrong answers:** g6m4-t4 ("7 is 60% of what number?" → 35: percent from one random pick, tape and answer from another); g4m1-t7 negative claims ("= −1,343").
- **Two right choices:** g5m1-t17 (`(4 + 3) × 4` / `4 × (3 + 4)`); g8m6-t4 (a row total + a column total both double-counts AND leaves out); g8m2 six levels with "Yes, it is 5" beside "No, it is 5".
- **Readable two ways / misleading pictures:** dozens, all fixed — water stops (27/28/29), halfway numbers in "closer to", "Max counted 3 marks", shading = left vs eaten, a picture showing a different blank, answers off their own number line.
- **Size leaks (the gate cannot see them):** an audit of every level found 8 real ones — a "?" side/height/base/circle drawn at its answer, choice angles drawn true next to far-off distractors, bare-fraction levels with shaded bars. All fixed. ⚠️ **Two blind keys (g3m6, g6m6) REQUIRED the leak** (they checked "?" was drawn at the answer); their checks now reject it.
- **The gate itself was wrong three times** and was corrected, each with a positive control: whole-token reveal missed a place chart; reading rendered markup flagged every clock and jug (cried wolf); substring choice-matching flagged "likely" inside "unlikely" and "324" inside "732408". `Level.dataShown` added for data displays.
- **Module practice** drilled two topics ten times for a child missing everything (never-played weighed 50) — driven on g3m1, test watched red on the old weight.
- **Measured, not amplified:** a writer's claim that nearby seeds give near-identical first draws (false: 0.266/0.627/0.734…); a solver's "smaller run closer in 17%" after the fix (false: 0/300).

## ④ 🔎 NOT VERIFIED / OPEN
1. 🔴 **No human has read any ladder.** `npx tsx scripts/ladder-questions.mts <module> 3` prints them. Writers flagged, per module, levels that go past their lesson (e.g. g6m4 "work backwards" percent levels, g7m1-t4 L4 time-on-top vs the warning card, g8m1 negative powers, g8m4 off-scale triangles up to 35%) — search their reports' themes in the ladder files' `style` names.
2. 🔴 **"X is right" is never or rarely the answer** in several spot-the-mistake levels (g5m6, g6m6 flagged) — a child can rule it out without the math.
3. ⏭️ **Borderline size leaks left:** g4m4-t3 L3 and g5m2-t7 L2 (bars that nearly show the comparison); 14 estimate-only levels (to-scale tapes, typed angles) — cheap now, real leaks if a level becomes multiple choice.
4. ⏭️ **Bundle:** ladders are a 907 KB (262 KB gz) eager chunk on /lesson and /practice (`ponytail:` in `ladders/index.ts`).
5. ⏭️ Standing is per device (sync needs the progress migration). Level order within a ladder is authored judgement; only play data can test it.
6. ⏭️ Written `practice` arrays and `mixedPractice` are now unused by the player — delete, or keep as reference, founder's call.
7. ✅ **Voice clips merged and WIRED (2026-09-17):** `public/audio/<voice id>/` holds all 2,522 Teddy + 2,274 Stevie explanation clips (zip `clips-lessons-20260916-145109`, 0 missing) with a manifest each; `LessonPlayer` sets `setSceneVoice(lessonVoice(grade))`, so beats and the big idea play Teddy in Grades 3–5 and Stevie in 6–8 — driven: g3m2-t1 fetched Teddy clips, g7m2-t3 Stevie, both 206. Since PR #113 only generated practice QUESTIONS still use browser speech (founder: not now). ✅ **The queue is 0** (PR #113 merged the 2,527 remaining clips, including the 27 Stevie lines once deduplicated into Teddy); `lessonVoiceClips.test.ts` caps it at 0. ⚠️ The notebook clones `BRANCH = 'lesson-teacher-voice'`, and the fixed corpora are on `adaptive-practice` — push them there (or change BRANCH) before the next Kaggle run, or it renders nothing new.
8. ⏭️ **LIFTED from 📚 2026-09-14 (archived):** prove the parents' topic-save write with one real signed-in save · founder unread Grade 3 M2–6 / Grades 4–8 lessons · no grade assigned to a child · its 🧹 list (PR #95, `answer` event, `auth_events` unread, purge cliff 2026-09-27, `profiles.is_internal`, account deletion never run end to end, `migrate-prod` inert, Sydney rollback, `entitled_chapters` no caller, auth migrations `20260908120000`/`20260908120100` await hand-apply, `counting` flake).

> 🧑‍🏫 **2026-09-16 — THE LESSONS SPEAK LIKE A TEACHER: SHE SAYS A LINE, THEN WRITES OR DRAWS IT ON THE BOARD. ALL 36 MODULES / 282 TOPICS CONVERTED, AND THE CHATTERBOX NOTEBOOK FOR THEIR EXPLANATION LINES.** Three states, do not confuse them:
> - **LIVE — as measured 2026-09-16:** PR [#110](https://github.com/RadlorInc/learn/pull/110) (`fa4dff8e`, sw **v190**: `beats` + the write-on sweep) and PR [#111](https://github.com/RadlorInc/learn/pull/111) (`65a4f8db`, sw **v191**: `effect: 'draw'`, per-path tracing). **Only the two samples** `g3m2-t1` and `g5m1-t5` carry beats in production. Measured on the live `g3m2-t1` screen 2: 64 strokes tracing, face circle dash 791.361px / offset 249.561px, 0 console errors. Re-measure: `curl -s https://adaptivelearn.radlor.com/sw.js | head -1`.
> - **PUSHED, NOT MERGED, NOT DEPLOYED:** branch **`lesson-teacher-voice`** (`74bfa328`) — every other module converted, the gate extended, the two animation fixes below, the notebook and the corpora. ⚠️ **sw NOT bumped** (preflight requires it before `main`), and the wording is unread.
> - `tsc` 0 · vitest **3334 passed**, 20 skipped (was 3052; **+282** per-lesson teacher-flow checks).

## ① 🗣️ WHAT THE FOUNDER ASKED, IN ORDER
*"The explanation feels like someone just reading — I want a teacher: she says something, then writes something. US vocabulary, punctuation."* → the canvas should fill **as the voice speaks** → things should **animate in**, not appear → **writing OR drawing effect per need** → *"convert all modules' all topics"* → a zip of the voice lines, **explanations only, no questions** → *"the Kaggle notebook like before"* → *"push the branch."*

## ② 🧩 THE FORMAT (`Screen.beats` in `script.ts`; rules in **docs/new-flow/AUTHORING.md**, section "Teaching screens are a TEACHER")
`{ say, write?, pic?, effect?: 'write' | 'draw' | 'pop' }`. `say` appears line by line (dimming as she moves on); `write` is a board card that stays; `pic` puts `pictures[n]` up on that beat — a picture no beat names is up from the start; board items are laid out in **beat order** so nothing already up moves. Paced by `speakSteps` when "Read it to me" is on, by reading time when off (`1500 + 55ms/char`, cap 6.5s). `write` = a left-to-right `clip-path` sweep (`lp-write`); `draw` = each stroke traced over **its own** `getTotalLength()` via Web Animations (a fixed dash covers a short path whole — the first version only faded small shapes), ink fading behind (`lp-fill`). **Screen 1 gets no beats** (a regex over its text builds the button) and keeps its written voice — a known seam, not an oversight. `text` stays the whole screen: speech, `/lesson-preview` and every older gate read it.
Numbers in the corpus: **1,692 screens · 4,689 spoken lines · 709 board lines · 1,126 traced pictures · 596 screens with nothing traceable** (their pictures are `table`/`eq`/`cards`, which are DOM).

## ③ 🏭 HOW 282 TOPICS WERE CONVERTED
One agent per module from the brief, two pilots first (`g3m4`, `g6m5`), ~6 at a time. **The fan-out found FOUR contradictions in a brief written carefully** — each by an agent doing the work: the two worked examples disagreed about the big-idea screen; "numbers are numerals" vs the example's *"Five, ten, fifteen"* (counting aloud is the exception); "a board line is a rule" vs the example's `Hour: 4` (a working note is allowed); beat count on a multi-sentence big idea (one per sentence). **Grade 3 Module 1 was CUT, not rewritten** — 199 lines added, **0 removed**; its approved text is byte-identical. The measured SVG/DOM kind list is in AUTHORING.md.

## ④ 🐛 DEFECTS FOUND — every one looked like it worked
- **The gate could not see a skipped module.** It inspected only screens that already HAD beats, and `built` **excludes `g3m1`** — the one module with approved wording was the one whose beats nothing checked; its own two tests never mention `beats`. Now a sweep over EVERY module asserts each teaching screen has beats and Screen 1 has none. Watched red: a drifted `say` in **g3m1**, and a screen with its beats removed (`… has no beats — it still reads like a page`).
- **`effect: 'draw'` on a non-SVG picture is inert** — gated against the real renderer, never a kind list. Watched red on a `table`.
- **A trace on a `motion: true` picture ran while its part was at opacity 0** (parts fade in at 0 / 0.7 / 1.4 / 1.8s, the trace ended ~1.3s) — the part then just appeared, drawn. Each stroke now waits for its own part.
- ⚠️ **…and that fix was inert while measuring clean: `"lp-ink".includes("lp-in")` is TRUE.** The walk up from a stroke matched its own ink fade at delay 0 and stopped; my diagnostic had the same flaw, so it reported "0 strokes affected". Caught only because two of my own measurements disagreed. Now an exact name match, and **`lp-ink` renamed `lp-fill`** so a substring test cannot resurrect it. Positive control on `g6m6-t1` "Cut and slide": traces start 722 / 1444 / 1866ms against parts at 700 / 1400 / 1800. ⚠️ **PRODUCTION (v191) STILL HAS THE PRE-FIX CODE**, and `g5m1-t5` screens 4 and 6 trace a `motion: true` tape — the defect's shape. Those two screens were NOT measured.
- **`display: contents` on the write-on wrapper** generated no box, so the sweep had nothing to clip — caught before shipping by `getAnimations()`.
- **`npm run test:chapters` as documented dies `ERR_CONNECTION_REFUSED` on every navigation**: `playwright.config.ts` defaults to **:3017**, `.claude/launch.json` runs `milo-dev` on **:3000** — 217 "broken chapters" that are a harness that cannot look. Recorded in the config (`260564f0`), not fixed; workaround `E2E_BASE_URL=http://localhost:3000`.

## ⑤ 🎙️ THE VOICE NOTEBOOK (`scripts/chatterbox-kaggle.ipynb`, on the branch)
**Explanations only** (founder's call): every beat `say` + each lesson's `bigIdea`. **Out:** Screen 1 text, turn/twin/practice text, prompts, both hints, worked `steps`, win screens — verified absent by positive control (six known question/hint/step/win lines → 0, a known beat → 1). 64 lines end in `?`; they are rhetorical and kept. Corpora from `npx tsx scripts/lesson-voice-corpus.mts` → `scripts/.voice-corpus-lessons-{teddy,stevie}.json`: **Teddy (Grades 3–5) 2,522 · Stevie (6–8) 2,274 · 4,796 unique** (4,971 occurrences; keys are `clipKey()`, so identical text is one clip and a re-run only re-keys changed lines). Stevie = `IvUJKFyjVb5hItY9dJAT`, Teddy = `XjGYkUkzth8BPs29fmcV` (refs in `scripts/chatterbox-ref/`). The notebook clones **`--branch lesson-teacher-voice`**, renders Teddy then Stevie, writes `public/audio/<voice>/<key>.mp3`, and zips **a folder per voice** (merge = `unzip clips-lessons-*.zip -d public/audio/`, then push to the branch, then Run All again). Venv cell untouched apart from the clone line (diffed).
⚠️ **A dry run with a stand-in renderer found a bug the OLD notebook had too:** minute-resolution zip names, so a second Run All in the same minute **overwrote the first run's zip** (14 clips → an empty zip; on Colab those zips are on Drive). Seconds did not fix it; a run now takes the first zip name not on disk — three back-to-back runs → three zips, the 14-clip one intact. A fresh clone of the pushed branch was checked to hold both corpora, both reference wavs and the renderer.

## ⑥ 🔎 NOT VERIFIED
- **The rewritten wording — no human has read any of ~1,690 screens.** The gate checks structure only.
- **Anything on a GPU** — model download, cloning, the audio itself. The stand-in tested the loop only.
- **A real voice pacing the beats on a device.** Every drive was with audio off.
- **Rule 6b (name every picture in a beat) is ungated**, and many worked screens **show their own answer in the picture data** (a `bars` labelled `'5/8'`, an `area` holding both products). Clearest: **g8m4-t6 screen 4** — the triangle reads `70°` and the `eq` reads `180 − 110 = 70`. Beats cannot hide that; it needs blank-cell picture variants, which were fenced off so a prose pass could not break a diagram.

## ▶ OPEN
1. 🔴 **Founder read of the rewritten wording** — `/lesson-preview?module=<id>`. Then bump sw and merge `lesson-teacher-voice` → `main` (that deploys every module's teacher flow AND the trace fixes production is missing).
2. 🔴 **Wire the rendered clips into the lesson player.** "Read it to me" on `/lesson` is still browser speech; the lookup (`src/core/voiceClips.ts`, `public/audio/<voice>/`) only serves the hidden old chapters. Do it before anyone judges how the lessons sound.
3. 🔴 **Founder runs the notebook on Kaggle**; merge each zip before the next Run All.
4. ⏭️ **Pictures that show their own answer** — a blank-cell variant pass (④ and ⑥).
5. ⏭️ Silent-mode pacing is slow on long lines (g5m1-t5 screen 5's third beat lands ~9.6s in). Tap-to-advance instead of a timer is the founder's call, never asked back.
6. ⏭️ Pick one e2e port (3000 or 3017) — `playwright.config.ts` names both options.
7. 🔴 **LIFTED from 🎨 2026-09-13 (evening):** finger-test the scratch pad on a real tablet (only a mouse has drawn on it).
8. 🔴 **LIFTED — audio on by default?** The founder's answer arrived as the single word "the". Ask again.
9. 🔴 **LIFTED — two probe rows in `diagnostic_leads`:** `select public.delete_lead_by_email('probe-lead-alive-20260909@example.invalid');` and the same for `probe-postfix-20260909@example.invalid`.
10. ⏭️ **LIFTED:** ~~pin the Supabase CLI in CI~~ ✅ pinned to 2.117.0 in all five `setup-cli` steps (2026-09-17, after `latest` hit a GitHub API rate limit and failed a real deploy) · /auth consent line 4.16:1 against a 4.5 floor, its link 3.04:1 · six Dependabot PRs · `backup.yml` does not call `scripts/assert-prod-ref.sh` · the cards screen has no "Don't add the 8s" sub-line (add to the scripts first if wanted).
11. ⏭️ **LIFTED — the rollback rule:** moving `release` backwards deploys NOTHING (Vercel builds a commit, not a pointer); revert-and-push-forward works (~280s), and the sw VERSION goes FORWARD on a rollback. Commands in `docs/runbooks/launch-day.md`.
12. ⏭️ Carried: the 🔢, 🧩 and 📚 blocks' ▶ OPEN.

> 🔢 **2026-09-15 — GRADE 5 · MODULE 1 RE-SPLIT FROM 8 TOPICS TO THE 20 LESSONS OF THE TEXTBOOK CONTENTS PAGE THE FOUNDER PHOTOGRAPHED (lesson and part names only; every story, screen and number is ours), 12 NEW BACKDROPS, AND WIDE TABLES THAT NO LONGER RUN OFF A PHONE.** PR [#109](https://github.com/RadlorInc/learn/pull/109) merged `18693401` · **LIVE — as measured 2026-09-15:** Deploy run green (ci, rls-tests, promote), `release` = `18693401`, `sw.js` serves **v189**, `/lesson?id=g5m1-t20` shows its backdrop and story, `/lesson?id=g5m1-t2` at 375px fits its chart (zoom 0.89, 0 overflow), 0 console errors. Re-measure: `curl -s https://adaptivelearn.radlor.com/sw.js | head -1`. `tsc` 0 · vitest **106 files, 3052 passed**, 20 skipped · `next build` 0 · **sw v188 → v189** (art changed under the same file names, and assets are cache-first per VERSION — v189 must ship with it).

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
1. ✅ Deployed (see the first line).
2. 🔴 **Founder read of g5m1** at `/lesson-preview?module=g5m1`, especially the shortened titles against the photo. To change a title, change `curriculum.md` and the lesson together.
3. ⏭️ Tape diagram text size on phones, in every module.
4. ⏭️ **LIFTED from 🧭 2026-09-13:**
   - The landing heading/paragraph still describe the placement check, which is off (as of 2026-09-13; not re-checked).
   - "Read it to me" is browser speech only.
   - PR #95 (stop `main` previews) status unconfirmed.
5. ⏭️ Carried: the 🧩, 📚 and 🎨 blocks' ▶ OPEN.

_Older sessions (2026-06-15 → **2026-09-15**, including 🧩 **the MathPath home day** (2026-09-14/15: role menus and guards, Grade 5 backdrops, classroom parked), moved 2026-09-17 — ⚠️ **its ▶ OPEN was LIFTED into the 🔐 2026-09-17 block's item 9**; including 🎨 **the kid-first UI day** (2026-09-13 evening: the founder's SampleUI template on every screen, the modules home, mixed practice, the scratch pad, and Practice bouncing straight back home because `window.location` was read before an in-app navigation changed it), moved 2026-09-16 — ⚠️ **its live items were LIFTED into the 🧑‍🏫 2026-09-16 block's ▶ OPEN, items 7–11**; including 🧭 **the pivot day** (2026-09-13: every old chapter hidden, the 9-screen flow live with Grade 3 Module 1, the voice clips deleted, Vercel from 272 deployments to 2), moved 2026-09-15 — ⚠️ **its live items (landing copy, browser-only read-aloud, PR #95) were LIFTED into the 🔢 2026-09-15 block's ▶ OPEN, item 4**; including 🎓 **the classroom block** (2026-09-11/12: a teacher's syllabus had silently become each rostered child's app; child logins; set work), moved 2026-09-15 — ⚠️ **its code is PARKED on branch `classroom-parked`, never merged, migration applied nowhere; its legal items were LIFTED into the 🧩 2026-09-14/15 block's ▶ OPEN, items 5–8**; including 🧹 **the deployment-storage day** (2026-09-10: 53 GB of builds on a 10 GB plan, 80 dead previews deleted, `main` previews stopped by PR #95), moved 2026-09-14 — ⚠️ **its live items were LIFTED into the 📚 2026-09-14 block's ▶ OPEN, item 6**; including 🚀 **launch week** (2026-09-09/10: moving `release` backwards deploys nothing, `/api/lead` reported success on a failed write, Dependabot alerts had never been on, 17-18 fully voiced), moved 2026-09-13 — ⚠️ **its live items were LIFTED into the 🎨 block's ▶ OPEN, items 7–9**; including 🎙️ **the Chatterbox voice block** (2026-09-07→09: whole-line TTS on a free GPU, four bands voiced), moved 2026-09-13 — ⚠️ its one live thread (15-16 voice, Kaggle render) is MOOT: the clips were deleted that day; including ⚖️ **the legal day** (the Terms said things the product does not do — "delete your account at any time" had nothing behind it at all; both documents behind the draft banner, and account deletion built and proven not to orphan before a line of it was written), moved 2026-09-12 — ⚠️ **its live legal items were LIFTED into the 🎓 2026-09-11/12 block's ▶ OPEN, items 4–7**; including 📊 **the /admin day** (four panels that could not have been honest, the privilege escalation caught one step before production, the funnel that was not a funnel, and the discovery that CI had never gated anything), moved 2026-09-10 — ⚠️ **its live items were LIFTED into the 🧹 2026-09-10 block's ▶ OPEN, items 3–9**, and one of its own ▶ OPEN lines was already stale when it went (Vercel's Production Branch is `release`, measured — the CI gate is live, do not re-do it); including 🗣️ **the voice-cutoff day** (nothing Milo says is cut off by the next thing, in any band — and the audit that proved it was only half done the first time), moved 2026-09-10 — ⚠️ **its rule is NOT archived with it**: the speak-verb contract and `voiceBoundaryVerb.test.ts` are written up in **docs/chapter-craft.md §3**, and `scripts/break-check.sh` (ported there from `video_reviewer`, and existing in BOTH repos with different runners) is described in CLAUDE.md; including 🔊 **the voice-on-the-CDN day** (three silent defects in one chain, the first honest cost accounting, and the stitcher that failed its listening test) and 🧪 **the Chatterbox evaluation** (Resemble AI TTS in a scratch venv, Nano off the table, the GPU-cost argument), both moved 2026-09-09 — ⚠️ 🔊's live ▶ OPEN was lifted into the 🎙️ 2026-09-07→09 block (the stitcher is now moot — whole-line via GPU replaced it) and 🧪 is superseded by that block; including ✅ **the region-move CUTOVER day** (eleven dispatches, ten red, every red a real defect in the workflow — and the auth trigger a schema dump does not carry), moved 2026-09-06 — ⚠️ its still-live items (the Sydney rollback, `SUPABASE_SERVICE_ROLE_KEY` never exercised, the missing `production-db` environment, the uncommitted /menu RPC half, `entitled_chapters` with no caller) are carried in the ⚖️ 2026-09-06 block's ▶ OPEN item 7; including 🚀 **the Pro / region-move GO day** (the one-job workflow that diffs the same query on both databases) and 🌏 **the load-measurement day** (the database was in Sydney while every user was in the US, and the nightly backup had never run), both moved 2026-09-05 — ⚠️ their still-live items are carried in the ✅ region-move block above and — since 📊 2026-09-05 was itself archived on 2026-09-10 — in the 🧹 2026-09-10 block's ▶ OPEN (`backup.yml` is FIXED, PR #91; the `production-db` environment and the two Supabase secrets remain); including 🎙️ **the first voice-rendering session** (17–18 got its 161 clips, 3–5 got Teddy Twinkle and 872 of 1,411 lines), moved 2026-09-04 the same day it was superseded — ⚠️ everything it left uncommitted was committed and deployed in the 🔊 block above, and its still-live items (nobody has heard it on a device, OrderDesk/LevelRun have no clips, the MCP key) are carried there; including 🌙 **the nightly-E2E day** (12 runs red since the day it was created, the AR escape hatch half off a 640×320 screen, and the CI-only text-metric difference), moved 2026-09-04 — ⚠️ its still-live items (the scheduled-run green, the hull silence, the `counting` flake, and every launch blocker in its ▶ OPEN) are carried in the 🔊 2026-09-04 block above; including 🗒️ **the second tester pass** (Great job!, the hull silence diary, the typed directions line in all 72 chapters), moved 2026-09-04 — ⚠️ its still-live items (the hull silence, the `counting` flake) are carried in the 🌙 block's ▶ OPEN, and its "PR #69 is open" line was already stale when archived (merged 2026-08-31 as `9a4bcc3`); including 📏🎓 **the student-review days** (the run resumes, Ready everywhere, praise to 6–8, the number-tag overhang) and 🐇 **the line behind mother** (even spacing for one species, and the tautology guarding the approved picture), all moved 2026-09-03 — ⚠️ their still-live items (recorded clips for 3–11, the `counting` flake in `ready-bar.spec.ts`) are already carried in the 🌙 block's ▶ OPEN and the 🎙️ 2026-09-03/04 block; including 🔒 **Stage 3** (the chapter gate and the screens — a lock that names what is behind it, and a paywall built inert but tested refusing), moved 2026-08-31 — ⚠️ its still-live items (the deferred watched purchase, B12, `DRAFT = true`, the free-set pick, the nine Dependabot PRs, Vercel Analytics, the prose drift) were lifted into the 🌙 block's ▶ OPEN rather than archived with it; including 💳 **Stage 2b** (the price ladder, checkout and the webhook — and the finding I published without measuring it), 🧾 **Stage 2a** (the seat materialiser) and 🚪 **the funnel day** (the check became optional, the demo route, and the `onComplete` corpse), all moved 2026-08-30 — ⚠️ their still-live items (B12, `DRAFT = true`, the nine Dependabot PRs, Vercel Analytics, the anon-INSERT prose drift) were checked against the 🔒 Stage 3 block first and are all recorded there; including 💳 **the billing-schema apply day** (applied to production and completely inert, and the rollback capture that caught a migration silently reverting a security fix), moved 2026-08-28 — ⚠️ its still-live items (B12, the nine untriaged Dependabot PRs, and RLS gating the RECORD rather than chapter CONTENT) were checked against the newer blocks first and are all still recorded there; including 🧾💳 **the Stage-1 billing schema day** (RLS, entitlement, the guard at all three write paths), moved 2026-08-27; including 🧾 **the ledger-repair day** (58 repo migrations relabelled to the versions production recorded, `perf_advisors` applied, and the dry-run computed rather than credentialled), moved 2026-08-25 — ⚠️ its one still-live item (the anon-INSERT prose drift) was lifted into the current ▶ OPEN rather than archived with it; including 🔐 **the road-to-a-paywall day** (the RLS suite that had never run once, three privacy gaps between the published copy and the system, the anon INSERT closed, and the security regression caught four minutes after shipping), moved 2026-08-25 — ⚠️ its still-live blockers (B1/B2 `DRAFT = true`) were lifted into the current ▶ OPEN rather than archived with it; including 🚦 **the production-readiness day** (three workflows green while doing nothing, the dead error sink, eight chapters unstartable on a landscape phone), moved 2026-08-25; including 🔬 the seven-learner-models day (moved 2026-08-24), 🕸️ the skill-graph sensitivity audit and 🎯 the diagnostic's 96–98% rebuild, both moved 2026-08-24; plus 🇺🇸 the US-spelling / SEO / region-migration day, 🔗 the social-handles day, ❓ the question-quality sweep and 🎚️ the adaptive-loop day, all moved 2026-08-22) live in [docs/handoff-archive.md](docs/handoff-archive.md) — not loaded at session start. `grep` it for a chapter or a decision. Moved there to keep this file inside its size budget: the two 2026-08-14 blocks (🧱 all six neon chapters onto GameShell · 🎛️ the band moving onto the 12–18 engine) on 2026-08-16, 🏗️ **The Empty Plot** (the last neon chapter + the 3D deletion + the explainer-film pipeline) on 2026-08-17, 📊 **The Loading Bay** (the first storybook chapter onto GameShell, and the mastery exit finally seen to fire) and 🚀 **the first launch-hardening day** (0 security advisories, crash screens, self-hosted fonts, the enforced CSP, legal plumbing, the launch runbook) both on 2026-08-17, and 🔒 **launch hardening round two** (the walkthrough dead end, the CSP gate that had been red for a day, `media-src` silently killing the recorded voice on mobile) on 2026-08-18, and 🕳️ **the plan-pointer P0** (`ChapterPortal` dropping `onComplete`, so no child's diagnostic plan advanced for three months — plus the one-emoji-to-crawlers SEO fix and the inert short-landscape gate) on 2026-08-18, and 🧭 **the 2026-08-18 architecture/security/devops day** (the layering refactor, V13–V20, the two vacuous scheduled sweeps) on 2026-08-19, and ⚡ **the performance pass** (57 MB of art revalidated on every request, every backdrop shipped as full-size PNG, every creature journey relaying out the document — plus the /game fit controller that turned out to be dead code) on 2026-08-19, and 🛡️ **the five-role red-team day** (the AR camera door that could strand a child for ever, the placement check dying on one Back press, and the regression I shipped inside my own fix) on 2026-08-20, and — moved 2026-08-24 — 🚚 **The Packing Shed + The Minibus Run** (the two 9–11 chapters that closed the multiplication/division content hole) and 🎯 **the diagnostic rebuild** (26–34% → 81–87%, the answer-surface fix and the first accuracy gate), and — moved 2026-08-23 — 📐 **the tester's-four-bugs / responsiveness-sweep / `useOnceGuard` day** (the StrictMode ref guard that froze ten chapters' demos in dev only, 683 → 2 sub-44px tap targets, and 20/20 storybook coverage), and — on 2026-08-21 — ⚡ **the font pass** (Gaegu preloading 90 subsets), 🔎 **the public-SEO pass**, 🏷️ **the AdaptiveLearn rename**, and 🏗️ **the move onto the company account** (whose still-open items were carried forward into the 🧭 block rather than archived with it)._
