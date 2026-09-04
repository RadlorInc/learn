# Session Handoff — Milo Story Mode

> 📐 **READ [docs/chapter-craft.md](docs/chapter-craft.md) FIRST, EVERY SESSION, BEFORE TOUCHING ANY 3–11 STORY CHAPTER.**
> It is the standing answer to *how we want the animation, the art and the voice* — the shape of a
> chapter, how cycles and travel must agree, what may be an answer object, how to choose a backdrop,
> how to generate a new drawn cycle, how Milo speaks, and how to verify any of it.
> Everything in it was paid for by a founder catching it on a screenshot. **Most of those rules were
> already learned in chapter 1, forgotten, and re-learned the hard way in a later chapter** — that
> file exists so the next session starts from them instead of rediscovering them.
> When a new correction lands, put the GENERAL rule there, not just the fix.
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
> route and LENGTH. Spec: [docs/diagnostic-engine.md](docs/diagnostic-engine.md).
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
> [docs/skill-graph-audit.md](docs/skill-graph-audit.md) §1 is the teacher's one-hour list.
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
> letting it grow. The craft rules live in chapter-craft.md, not here.)_

> 🔊 **2026-09-04 — THE VOICE WAS ON THE CDN THE WHOLE TIME AND NOBODY WAS ASKING FOR IT. THREE SILENT DEFECTS IN ONE CHAIN, ALL DEPLOYED AND VERIFIED FROM THE RUNNING SITE; PLUS THE FIRST HONEST ACCOUNTING OF WHAT THE REMAINING VOICE WORK COSTS.** `tsc` 0 · **1710 passed, 1 skipped by design** · `next build` 0 · **SIX commits, all pushed and live**: `590232b` `9eb78bd` `33bb2cf` `aec3ee0` `31437c2` `cce03b2` · sw v153 → **v158**.

## ① 🔇 THE CHAIN, AND WHY EVERY LINK REPORTED SUCCESS
The founder: *"3–5 aur 17–18 mein voice hi naii aa rahi"*, then *"12–14, 15–16 Chrome mein theek
hai, 17–18 nahi"*, then *"Safari mein Stevie aati hai, Chrome mein kuch nahi"*. Three different
faults wearing one symptom, each measured rather than reasoned about:
1. **Nothing was deployed.** Prod's Stevie manifest held **433** keys (0 of 70 sampled 17–18
   lines) and `/audio/XjGY…/manifest.json` answered **404** — the 3–5 voice folder did not exist
   there. 1,109 clips and the band routing had sat uncommitted since the previous session.
2. **`sw.js` had no `/audio/` branch**, so the manifest fell to the app-pages case —
   stale-while-revalidate — and a device that had loaded the app kept the old key list. Measured
   live: `caches.match(manifest)` in `milo-shell-v154` → **true**.
3. **The 30-day header.** `/audio/:path*` served `max-age=2592000, stale-while-revalidate=31536000`,
   right for a clip and wrong for the index. Read out of the founder's own Chrome: plain `fetch()`
   → **433 keys**, `fetch(…{cache:'no-cache'})` → **670**, with the new service worker already
   active. That is why 12–14/15–16 played (their keys were in the stale copy) and 17–18 did not.

⚠️ **THE WHOLE CLASS IS "A STALE INDEX IS NOT AN ERROR, IT IS A SHORTER LIST."** Every dropped key
is a clean miss, every miss falls back to browser speech, and Chrome ships no usable voice on most
machines — so the app, the CDN, the build and every log reported success while a child heard
silence. **Anything that GATES a lookup must revalidate even when the things it gates may not.**
Both halves shipped: the header (`max-age=0, must-revalidate` on `manifest.json`/`fragments.json`,
placed AFTER the general rule because the last match wins — above it, it is inert, which is the
version I wrote first and `assetCacheHeaders.test.ts` caught), and `cache: 'no-cache'` on the two
fetches, because a header cannot reach a browser that already holds the 30-day copy.

## ② ⚠️ CLIP-ONLY WITHOUT A STITCHER IS SILENCE, NOT FALLBACK — AND THE NOTE IS AT THE SWITCH
`setClipOnly` does not mean "prefer clips": it suppresses the browser fallback, so a line with no
clip is **silent**, and nothing logs it. 12–14 survives it ONLY because its templated lines are
stitched from `frag/`. The next person to reason *"12–14 works fine, turn it on for 3–5"* ships a
child a silent chapter. Written on `setClipOnly` itself and on the GameShell effect that flips it —
where somebody stands when they widen that band check — not in a doc.

## ③ 💸 THE MISS LINE WAS BEING RECORDED TEN TIMES OVER
GameShell spoke `It was X. <encouragement>` as ONE utterance, so the clip layer saw one line and
every reveal needed recording once per encouragement — and there are ten. **3,640 lines / 114,506
chars as one utterance against 374 / ~4,600 split**, for audio nobody can tell apart. Now two
utterances, and 9–11's whole wrong-answer bucket is **374/374** for the price of a rounding error.
⚠️ `speakSteps`, never `speak` + `speakAfterCurrent`: `_speaking` only turns true at the clip's
`onStart`, so a synchronous second call takes the else branch and `_doSpeak` **cancels** the line
still loading — the first half vanishes on exactly the machines that have clips.
⚠️ And `voice-generate.mts` could lose a whole run to one bad packet: an uncaught `fetch` rejection
(`ETIMEDOUT`, twice) threw out of the render loop and killed the process **before the manifest
write**, leaving hundreds of clips on disk and unlisted — ① in miniature. One retry, then skip.

## ④ 📊 WHAT IS RENDERED, AND WHAT THE REST COSTS
Live on prod: manifest **2,646 keys** (was 433). 3–5 Teddy 872 · 17–18 complete on Stevie · 9–11
**teach 69/69, miss 374/374, scored 1590/3172, reteach 0**. Rendered cheapest-first *within* each
value bucket — measured, that buys 1,361 lines against 719 for the same spend.
⚠️ **The key quota fact: the API key carried its own 40,000 cap** while the plan showed 121,022,
so a run 401'd at a third of the month. Raised; watch for it before concluding a month is spent.

| band | corpus (**FLOOR**) | rendered | remaining, stitched |
|---|---|---|---|
| 3–5 | ≥1,411 | 872 | 26k — whole-line **by design** (a three-year-old's line must not be stitched) |
| 6–8 | ≥2,602 ⚠️ | 0 | ≥82k |
| 9–11 | ≥7,904 | 1,946 | ≥114k |
| 12–14 | ≥1,666 | 180 | ≥19k |
| 15–16 | ≥11,858 | 326 | ≥25k |
| 17–18 | ≥8,638 | 149 | ≥30k |
| **total remaining** | | | **~296k stitched vs ≥2,343,335 whole-line** |

Credits ≈ characters (29 clips = 1,897, measured). At 121,022/month (reset **4 Oct**) the stitched
path finishes without buying anything; whole-line does not finish at all.
⚠️ 6–8's number is a floor TWICE: only 9 of 12 chapters are reachable, because `placeValue`,
`additionTo100`, `subtractionTo100` and `money` return an empty `prompt` and speak from their own
components. **They are missing from the corpus, not empty.**

## ⑤ 🔬 THE MEASUREMENT THE WHOLE STITCHER DECISION RESTS ON — AND ITS HONEST WORDING
Founder's challenge: *"our questions aren't limited, they're adaptive — did generating audio for a
limited set break that?"* No: the wiring is one-way (the chapter builds its line, the player hashes
it, a miss falls back) and the corpus is built by DRIVING the real generators. But the second half
of his question was right and cost me a claim. Escalating the sweep:

| chapter | whole lines 1.5k→24k | templates | literal runs |
|---|---|---|---|
| goingViral 15–16 | 821 → **1,299** | **13** flat | **34** flat |
| coinTray 9–11 | 920 → **1,653** | 391 → **425 flat at 6k** | 434 |
| packingShed 9–11 | 1,839 → **2,501** | 706 → **848 flat** | 819 |
| walkHome 17–18 | 1,562 → **9,123** ↑ | 301 → **513** ↑ | 121 → 137 |

Pushed the worst case further, runs only — **1.5k/6k/24k/48k/96k → 125, 130, 138, 140, 144**
(+4.0%, +6.2%, +1.4%, +2.9%). Over **64× the draws: lines 17×, templates 1.9×, runs 1.15×**.
⚠️ **So the right words are "bounded in practice, still creeping" — NOT "saturated".** I first
wrote *"nearly flat"*, and the founder's correction is the rule worth keeping: **a word like
"nearly flat" does the work of "saturated" without having measured it.** Quote a run count with the
draw count it was measured at. The argument survives its own worst case — walkHome's NEW templates
are new combinations of runs it already has — but it is a working ceiling (~150 runs), not a proof.
⚠️ **And every whole-line figure in this repo is now a FLOOR and must travel as `>=`** — the
drivers sample 1,500 draws, which is not a generator's space. Written into all three corpus
drivers' headers so the next reader cannot pick the number up as a total.

## ▶ OPEN
1. 🔴 **THE DECISION: build the fragment stitcher, or keep buying whole lines.** ~36k credits are
   left this month. Whole-line spends them on ~500 9–11 round lines; the stitcher makes the same
   36k go roughly 8× further and applies to every band. Costs engineering time, not credits.
   12–14's stitcher (`/audio/<voice>/frag/`, `fragment-templates.json`, `stitchKeys`) is the model.
2. 🔴 **6–8 has no clips at all**, and 4 of its 12 chapters cannot even be enumerated yet (④).
3. ⏭️ **3–5 has 539 lines left** (whole-line by design) — one command, ~26k.
4. ⏭️ The teen bands' reveal halves are unrendered, so 15–16/17–18 now play a clip for the
   encouragement and browser speech for `It was X.` — mixed within one breath. Rendering them needs
   the 37 configs that ARE now exported (this session) driven for `revealText`.
5. 🕒 **Nightly E2E has still never gone green on a SCHEDULED run against a main containing the
   fix** (carried from the archived 🌙 block). `gh run list --workflow "Nightly E2E"`, look for
   `schedule` + `success` at or after `22d75fb`.
6. 🔴 **The hull silence is still unmeasured** — `docs/voice-check-for-tester.md` is ready to
   forward, `__miloSpeech()` verified live (carried from 🌙).
7. ⏭️ The `counting` case of `ready-bar.spec.ts` is still flaky (carried from 🌙).
8. 🔴 **Launch blockers, carried from 🌙 and unchanged**: the watched test-mode Stripe purchase is
   deferred with a hard deadline BEFORE STAGE 4 ([docs/billing-stage-3.md](docs/billing-stage-3.md)
   §0) · B12 Supabase Pro before any live key · **`DRAFT = true` — the privacy policy and ToS are
   still placeholders, and you cannot charge a parent under one** · the free chapter set is still a
   PROPOSAL · **nine Dependabot PRs open and untriaged (#28–#47)**, do not merge as a batch ·
   Vercel Web Analytics still off · two prose-drift notes (the `error_events` fkey comment, the
   anon-INSERT comments saying "not applied" when it was applied 2026-08-24).
9. ⏭️ **Nobody has HEARD any of this on a real device.** Every check this session and last is a
   network request plus a patched `play()`; the preview pane produces no audio. The first real
   listen is what decides whether Teddy's `[clearly]`/`[gently]` tags — written for Stevie — suit a
   cartoon-child voice, and whether the 3–5 ABCD bead chants are too long for the band.
   (Carried from the archived 🎙️ 2026-09-03/04 block.)
10. ⏭️ **`OrderDesk` and `LevelRun` — the two 9–11 chapters that stay storybook — have no clips**,
   and are not in any corpus: they run the `SkillBeat` engine, not GameShell, so `_voiceCorpus911`
   cannot see them. Same builder shape as the 6–8 driver would do it. (Carried from 🎙️.)
11. ⏭️ The ElevenLabs **MCP** still holds the rotated key; its 401 is what produced the stale
   "key is dead" line on 2026-09-03. Measure the key with `curl`, never through it. (Carried from 🎙️.)
12. ⏭️ Uncommitted and untouched all session: the `/menu` 6→2 RPC half (`menu/page.tsx`, the three
   repositories) — deliberately kept out of the voice deploys.

> ✅ **2026-09-03 (evening) — THE REGION MOVE RAN. THE NEW us-east-1 DATABASE IS A VERIFIED COPY OF SYDNEY, AND NOTHING IS POINTED AT IT YET.** Eleven dispatches, ten red, and **every red was a real defect in the workflow I wrote — not one in production, and not one "just re-run it"**. Sydney was READ ONLY throughout: zero writes, all day. Green run **33783519089**: `✓ posture + fingerprint identical` · **RLS suite 74 assertions, all pass** on the new project. Verified again independently (I queried BOTH databases myself rather than reading the workflow's own diff): users 11/11 · identities 12/12 · profiles 11/11 · learners 19/19 · chapters 72/72 · learner_progress 31/31 · ledger 77/77 · cron jobs 4/4 · policies 35/35 · `on_auth_user_created` present on both.

## ⚠️ THE ONE THAT WOULD HAVE SHIPPED SILENTLY, AND WHAT CAUGHT IT
The restore completed, the posture diff said **identical**, and the RLS suite then failed inserting a
learner whose owner had no `profiles` row. Measured on both: production has one non-internal trigger
in the `auth` schema — `on_auth_user_created` → `public.handle_new_user` — and the restored project
had **none**. **A schema dump does not carry triggers defined on a MANAGED schema's tables.**
**What it would have cost:** existing profiles ride in the data dump, so all 11 accounts look
perfect and every count matches. It is every **FUTURE** parent who breaks — an auth row, no profile,
and `learners.created_by` references `profiles`, so they cannot add a child. Nothing errors.
⚠️⚠️ **And the fingerprint said "identical" while that was true of one side.** It counted tables,
functions, policies, rows and cron jobs — and **no triggers**, i.e. it agreed about everything except
the thing that differed. Both trigger counts are in `security_posture.sql` now. The RLS suite is what
actually caught this; that file is why it will not have to next time.

## 🧨 THE TEN REDS, BECAUSE THE LIST IS THE POINT
| # | died at | the actual mechanism |
|---|---|---|
| 1 | guard | `NEW_DB_URL` password (Session pooler needs `postgres.<ref>`, and a symbol in the password breaks URI parsing) |
| 2 | dump | my grep was `^COPY auth.users `; pg_dump writes `COPY "auth"."users"`. **A correct dump reported as missing** |
| 3 | restore | the ledger table was hand-written `(version, statements, name)` — production also has `created_by`. A second copy of a schema we do not own |
| 4–6 | restore | **three dispatches in two minutes, two of them six seconds apart on ONE database.** One dropped schema public while the other created types in it. No concurrency group; `deploy.yml` has had one since it was written |
| 7 | restore | `data.sql` already carries all 22 auth tables → loading `auth.sql` too sent every auth row twice (`duplicate key … flow_state_pkey`) |
| 8 | restore | `data.sql` also carries 7 `storage` tables, owned by `supabase_storage_admin`: `permission denied for table buckets_vectors`. All seven measured **0 rows** on production, so they are filtered out of the dump |
| 9 | dump | the CLI's own `-x 'storage.*'` **left every storage table in and silently dropped the ledger block** — the exclusion excluded only the thing we needed |
| 10 | verify | the auth trigger, above |

## ⚠️ AND ONE OF THOSE TEN WAS MY MEASUREMENT, NOT THE CODE — WORTH MORE THAN THE OTHER NINE
I reported *"data.sql carries the ledger"* and deleted the separate ledger dump on the strength of it.
It came from `grep -A80 'COPY blocks in data.sql'`, whose window ran **past the end of that inventory
and into the `ledger.sql` inventory printed right after it** — so a line belonging to one file was
read as belonging to another. **A byte-count window crossing the boundary it was meant to respect**,
which [CLAUDE.md](CLAUDE.md) already records as a technique that does not work — used here on a LOG
rather than on source, which is why it did not look like that rule. Two commits acted on it before
the workflow printed `data.sql`'s own structure and settled it.
⚠️ **The auth half of the same reading was right, and the difference is the lesson:** it had TWO
instruments behind it (data.sql's own inventory, and the duplicate-key error). The ledger half had one.
⚠️ A second one, caught before it shipped: the first control on the storage filter ran `awk` against a
fixture that was not named `data.sql`, wrote a zero-byte file, and three greps read the empty output
and reported *"storage gone, rows gone"*. It survived only because *"ledger lost"* was in the same
batch and could not be true. **The re-run asserts the output is non-empty before believing any of it.**

## 🧰 WHAT THE WORKFLOW IS NOW
Guard (4 ref checks → optional `wipe_target` → target must be empty) → dump Sydney read-only
(`schema` · `data`, storage blocks cut out by an awk range · `ledger` · `ledger_schema` · the auth
triggers via `pg_get_triggerdef`), each with its own positive control → restore (default privileges
revoked FIRST → 5 extensions → schema → ledger DDL → ledger rows → data → **auth triggers** → 4 cron
jobs) → verify (`security_posture.sql` on BOTH databases, diffed; then the RLS suite on the new one).
`concurrency: migrate-region-<ref>`. No artifact is ever uploaded — the repo is public and the dump
carries children's data; every diagnostic prints table NAMES only, never a row.

## ✅ AND THEN THE CUTOVER RAN THE SAME EVENING — PRODUCTION IS NOW us-east-1
Google redirect URI added (old one kept) · Google provider enabled on the new project with the SAME
client · URL configuration copied · migration re-run for a fresh snapshot (green, `wipe_target=true`)
· **three** Vercel env vars repointed (§7 said two; `SUPABASE_SERVICE_ROLE_KEY` is the third) ·
redeployed on `6c80255`.
**Verified from the RUNNING deployment, not the settings page:** the live bundle carries the new ref
and the new publishable key, and **zero** occurrences of the old ref (positive control: 72 mentions
of "supabase" in 871 KB across 13 chunks — the first attempt fetched 0 chunks because the path is
`/_next/static/immutable/chunks/`, and its "old ref: 0" looked exactly like the real answer).
**Verified on both databases, two-sided:** new project 1 session in 30 min, last sign-in 17:51:18;
Sydney 0 new sessions, last sign-in the previous day.
⚠️ **And the check that mattered most: users stayed 11 and profiles stayed 11.** Had
`auth.identities` not come across intact, Google would have made a TWELFTH user and the parent's own
children would have been invisible to them, with nothing erroring.

## ▶ OPEN — what is left after the cutover
1. 🔴 **`SUPABASE_SERVICE_ROLE_KEY` IS THE ONE THING STILL UNVERIFIED.** It is server-side, so it
   is not in the bundle and no browser check can see it. It is read by `errorSink`, `/api/lead` and
   **the Stripe webhook** — and `errorSink` swallows its own errors by design, so a wrong value there
   is silent. Its first real proof is a webhook turning a payment into seats, or an `error_events`
   row appearing on the new project. Do not record it as working until one of those is seen.
2. 🔴 **The other ten accounts are still logged out** and have to sign in again (per-project JWT
   keys). If any of them cannot, it is the Google config, not the data.
3. ⚠️ **Sydney stays for a week as the rollback**, then delete it (~$10/mo back). Rolling back is the
   same three env vars in reverse — but anything played on the new project after the flip would not
   be in it, so after a day or so the rollback stops being free.
4. ✅ DONE: Google redirect URI added (old kept), Google provider on the new project using the SAME
   OAuth client, URL configuration copied, three Vercel env vars, redeploy, real Google sign-in.
5. ✅ **BOTH PENDING MIGRATIONS APPLIED** to the new production (2026-09-03 ~17:58), and committed
   FIRST (`c7c2a43`) so the ledger could not record a version whose file is not in the repo.
   Before/after, measured on the catalog either side: `is_chapter_entitled` `sql` → **plpgsql**;
   `entitled_chapters` **did not exist** → exists; `get_learner_bootstrap`'s definition now contains
   `recheck_closed`, which is what proves the new BODY landed rather than a function of that name.
   Grants on all three: `authenticated` + `service_role`, nothing for `anon`/`public`.
   ⚠️ **NOTHING HAS BEEN EXECUTED.** That is a catalog reading, not a run: the MCP role is read-only
   and not `authenticated`, so calling them returns `permission denied` (correct, per those grants).
   `is_chapter_entitled` exercises itself — the `sessions` INSERT policy calls it, so the next
   gameplay session is its test. **`entitled_chapters` has no caller at all** until the client code
   in ⑧ lands, so it is written and never once run. Do not read "applied" as "working".
   ⚠️ **And the `pg_stat_statements` after-number the morning block promised cannot exist yet** for
   the same reason — an unexecuted function has no row there.
6. ⚠️ **Ledger drift, +2 rows.** `apply_migration` stamps its OWN timestamp, so the two canonical
   versions went in by an explicit insert in the same migration AND the MCP wrote
   `20260903175820` / `20260903175833`, which have no file in the repo. Harmless — the DDL is
   `create or replace` — and it is the same drift this repo already carries two rows of. Clean with
   `supabase migration repair --status reverted 20260903175820 20260903175833`.
7. ⏭️ `production-db` GitHub environment (404 today) **before** anyone sets `STAGING_PROJECT_REF`, or a push to `main` migrates production unreviewed.
8. ⏭️ `backup.yml` still unconfigured (managed backups make `BACKUP_PASSPHRASE` optional). The
   morning block's uncommitted pile is now **the client half only** — `menu/page.tsx`, the three
   repositories, `useAdaptive`, the voice files. The two migrations are committed and applied; the
   code that calls `entitled_chapters` and reads the bootstrap's new keys is not, which is why ⑤
   says that function has never run. Landing it is what turns /menu's six round trips into two.
9. ⏭️ `supabase/config.toml` says `major_version = 17` now; `.gitignore` gained `supabase/.temp/`.

> 🚀 **2026-09-03 (later) — PRO IS ON, THE REGION MOVE IS GO, AND THE MECHANISM IS A ONE-JOB WORKFLOW THAT DIFFS THE SAME QUERY ON BOTH DATABASES.** ⚠️ **ITEMS 1–5 OF ITS ▶ OPEN ARE SUPERSEDED BY THE ✅ BLOCK ABOVE — the workflow HAS since run and the copy is verified. Kept for the pre-flight measurements.** The block below was written BEFORE any of it ran: **NOTHING HAS RUN YET — it waits on two connection-string secrets and a push.** Pre-flight only: `migrate-region.yml` YAML parses · `security_posture.sql` validated on PG 17 against production · `verify-backup.sh` re-proven **1 positive + 5 negative, exit codes read** · new project verified empty on 17.6 · **NOTHING committed, NOTHING dispatched, NOTHING applied.** `tsc`/`npm test` not run (no TS touched).

## ① ✅ PRO — QUERIED, AND THE FIRST TWO THINGS I SAID ABOUT IT WERE WRONG
`get_organization` → the **`Radlor`** org (`nwhbiwrglymeittzjvph`, which holds production) reads `plan: pro`; the personal org `MohammedRafiquekuwari` is still `free` — the plan string is per-org. Dashboard shows **seven daily physical backups, 27 Aug → 02 Sep**, so a restorable copy of the children's data now exists.
⚠️ Two corrections, both mine: (a) I inferred "Pro since the 27th" from the backup dates — the invoice (`RSEBPT-00001`, $25, paid) is dated **today**; physical backups are taken on every project regardless of plan and Pro only unlocked *seeing* them. (b) I said a new project is "$0/mo, confirmed by API" — `get_cost` answered the wrong question. The Pro credit covers ONE Micro and production spends it; **each additional Micro is ~$9.81/mo** (`$0.01344/h`), charged in arrears. The founder's "$43.46 projected" is exactly $25 + three Micros − $10 credit.

## ② 🧭 THE DECISION: MIGRATE, NOT REPLICATE; AND THE MIGRATION IS THE REHEARSAL
Read replica in `us-east-1` was priced from the docs (~+$20/mo: primary must go Micro→Small, replica inherits; fixes `GET` reads only; **all Auth and every write stay in Sydney**; async lag on a local-first reconcile path this repo has already been burned by) and **rejected** — eleven users is the cheapest a migration will ever be. **The same-region "Restore to new project (BETA)" clone was skipped**: the docs say it restores into the *same region* (data residency), so it is not the move, and a migration IS a restore into a fresh project — doing both is the same operation twice. Sydney stays live and untouched until two Vercel env vars change, and for a week after as rollback.

## ③ 🧰 WHAT WAS BUILT (uncommitted)
- **`.github/workflows/migrate-region.yml`** — ONE job, **no artifact** (the repo is public; a dump with child data must never be uploaded). Refuses if `new_ref == PROD_PROJECT_REF`, if `NEW_DB_URL` contains the prod ref, or if the target has any public table. Dumps Sydney read-only (`schema` · `data --use-copy` · `auth -x auth.schema_migrations` · `supabase_migrations` ledger), asserts the `COPY auth.users` and ledger blocks are present (the CLI treats both schemas as managed and MAY silently skip them), restores in §4's order — **default privileges revoked FIRST** (or V12/V19 silently reopen with every policy reading correct) → 5 extensions → schema → ledger → auth → data, the last three under `session_replication_role = replica` — re-creates the **4** cron jobs, then runs `security_posture.sql` on BOTH databases and **diffs the output**, then the RLS regression suite on the new one.
  ⚠️ **No access token needed**: `supabase db dump --db-url …` was measured to fail on *Docker*, not auth — it bypasses the platform. Docker IS still required on CLI 2.116.0 (measured), which is why this runs on `ubuntu-latest` and not a Mac. Two secrets total: `OLD_DB_URL`, `NEW_DB_URL`, both **Session pooler, port 5432** (runners have no IPv6; the direct host will not connect).
  ⚠️ Three faults found reviewing my own first draft, all fixed and all confirmed necessary by probing the new project: `auth.schema_migrations` already has 77 rows there (duplicate-key red if copied); the `supabase_migrations` schema does not exist there (would have failed the ledger restore; without the ledger the next `db push` replays all 77 files); and the fingerprint excluded `sessions`/`learner_events`, which grow on their own — a strict diff on them turns a correct restore red if a child is playing.
- **`supabase/tests/security_posture.sql`** — `docs/security.md`'s four drift queries as a runnable file (they had been prose for six weeks, which is how the baseline went stale) plus a stable fingerprint. Run on PG 17 against production: valid.
- **`supabase/config.toml`** `major_version` 15 → **17** (production runs 17; the doc had flagged it).
- **`docs/supabase-region-migration.md`** — STATUS DEFERRED → **GO**; §0 re-measured; §1b, §4①, §5, §6 corrected (below).
- **`docs/backup-restore-runbook.md`** — the $0 claim corrected; the one-click clone path recorded with its same-region caveat; the positive twin added (§④).
- `.gitignore` +`supabase/.temp/` (the CLI wrote it during a `--dry-run`).

## ④ 🔬 WHAT THE PRE-FLIGHT CORRECTED IN THE DOCS — every 2026-08-19 number was stale
| doc said | measured 2026-09-03 |
|---|---|
| 2 cron jobs | **4** — `prune-diagnostic-items` (03:22) and `prune-diagnostic-leads` (03:32) were added since |
| the purge job has `and event <> 'daily_complete'` | **production's job does NOT** — the workflow copies what runs, not what the doc remembered |
| 5 of 8 users on Google | **7 of 11** (12 identities: 7 google, 5 email) — §5 is now the highest-risk step |
| 8 users · 17 learners · 20 tables · 17 functions | **11 · 19 · 24 · 25**, 35 policies |
| ledger 66 files / 65 rows, 62+59 mismatched | **77 / 77, 75 match.** `20260629023502` and `20260702113253` applied with no file; `20260903100000/100100` are files not yet applied. Conclusion unchanged: dump the real schema |
| `verify-backup.sh` "3 controls, 3 red" | **three NEGATIVE controls and no positive twin** — a script that refuses everything reads identically. Re-run with exit codes: valid artifact → **0**; unencrypted / wrong passphrase / no-`COPY` / garbage / unset passphrase → **1**. Now it discriminates |

## ⑤ 🆕 THE TARGET PROJECT — created by the founder in the dashboard (so the real price was on screen)
**`Radlor_app`** · ref **`wrnjqjhrbnqxornmfisf`** · `us-east-1` (same region as Vercel's `iad1`) · Micro · PG **17.6.1.166** · `ACTIVE_HEALTHY` · **0 public tables** · `pg_cron` available-not-installed · MCP can reach it. `Interactive_learn` (`qaymxunzlarwusogwyak`) is untouched.

## ⑥ 💸 BILLING, EXPLAINED ONCE SO IT IS NOT RE-DERIVED
Three Micros now (`Interactive_learn`, `radlor-site`, `Radlor_app`) → ~$19/mo over the $25 plan. Deleting Sydney a week after cutover → ~$10. **`radlor-site` is $10/mo for a waitlist form**; project transfer to the free personal org is self-serve (Settings → General → Transfer; ref/URL/keys unchanged; 1–2 min downtime paid→free) — ⚠️ but on free it **pauses after 7 quiet days, and `/api/waitlist` answers 303 either way**, so a paused DB would look healthy while every signup was lost. Founder's call; I leaned keep-it. Spend cap is ON, so the failure mode above quota is read-only, not a bill.

## ▶ OPEN — ⚠️ **1–5 SUPERSEDED 2026-09-03 evening: the secrets are set, the push happened, the workflow ran green. Read the ✅ block's ▶ OPEN instead.**
1. ✅ **DONE — Founder: two secrets, own terminal** — `gh secret set OLD_DB_URL` (Interactive_learn → Connect → Session pooler) and `NEW_DB_URL` (Radlor_app, same). Not through chat.
2. 🔴 **Founder: yes to a push.** `workflow_dispatch` needs the file on a ref. Plan: branch `region-migration` with ONLY this session's five files, then `gh workflow run migrate-region.yml --ref region-migration -f new_ref=wrnjqjhrbnqxornmfisf`. **Expect the first run red** — most likely the `supabase_migrations` schema dump (the CLI may refuse a managed schema → fallback is `supabase migration repair --status applied` per version) or an extension line. That is the rehearsal.
3. 🔴 **Founder: the Google OAuth Editor check** — [console.cloud.google.com/apis/credentials?project=12513320995](https://console.cloud.google.com/apis/credentials?project=12513320995): can `admin@radlor.com` (Editor) save a redirect URI? If not, get Owner **before** cutover. Not blocking the dispatch; blocking §5.
4. After green: apply `20260903100000` + `20260903100100` to **Radlor_app** (`supabase db push` — the ledger rides across, so only those two apply), then read `pg_stat_statements` there for the after-number ④ of the morning block promised.
5. Cutover (§5 ADD the redirect URI, §4③ auth config on the new project, §7 two Vercel env vars, a real Google sign-in, `auth_logs`) — all founder-only. Then a week, then delete Sydney.
6. ⏭️ `production-db` GitHub environment (404 today) **before** anyone sets `STAGING_PROJECT_REF`; `SUPABASE_ACCESS_TOKEN` + `PROD_DB_PASSWORD` are `deploy.yml`'s, not the migration's — whenever.
7. ⏭️ `backup.yml` kept, founder's call; still unconfigured. With managed backups real, `BACKUP_PASSPHRASE` is optional.
8. ⏭️ Last session's uncommitted pile (③④⑤ of the morning block — `menu/page.tsx`, the RPC, the two migrations) is **still uncommitted and still untouched**; it lands on whichever project is production, i.e. Radlor_app after ④.

> 🌏 **2026-09-03 — WHERE MILO BREAKS UNDER LOAD, STEP 1: MEASURED WITHOUT LOAD. THE HEADLINE IS NOT A QUERY — THE DATABASE IS IN SYDNEY AND EVERY USER IS IN THE US — AND THE THING THAT HAS TO HAPPEN BEFORE THE MOVE IS A BACKUP, BECAUSE THE NIGHTLY ONE HAD NEVER RUN.** `tsc` 0 · **1704 passed, 1 skipped by design** · `next build` 0 · gate `menuRoundTrips` **12/12, 3 mutations planted, 3 caught** · both new migrations driven on PG 17 (PGlite), **3 SQL mutations planted, 3 caught** · `scripts/verify-backup.sh` **3 controls, 3 red** · **NOTHING committed, NOTHING applied, NOT deployed** — founder's order is backup → restore rehearsal → region move, and the move waits for his Pro decision.

## ① 🌏 THE REGION, READ OFF THE DASHBOARD, NOT INFERRED
Settings → General → *Project region: Oceania (Sydney) · ap-southeast-2*. Every edge-log request in
24 h came from the US (EWR); the fastest origin time was **212 ms**, the average **344 ms**, on
queries that execute in 0.1–9 ms. The other free slot is `radlor-site` (us-west-2, the waitlist).
**A region cannot be changed in place** (Supabase docs): it is a CLI dump → new project → psql
restore. What that involves and what breaks is in the 2026-09-03 report; the short form: ~2–3 h of
work, Docker + Supabase CLI (neither on this machine), **all users re-login** (per-project JWT keys),
Google OAuth callback re-registered, 4 cron jobs re-created, both Vercel projects' env repointed,
the MCP token re-issued, and **the two-project cap blocks creating the third** — pause `radlor-site`
for the hour, or go Pro.

## ② 🔴 THE NIGHTLY BACKUP HAS NEVER BACKED ANYTHING UP — GREEN, 30 DAYS OF RUNS, ZERO DUMPS
`backup.yml` is *"inert until configured"*: `PROD_PROJECT_REF` and `BACKUP_PASSPHRASE` were never
set as GitHub variables/secrets, so every run prints a `::warning::` and exits 0 with the dump step
**skipped**. `gh run list` shows success × 30; `gh run view` shows `Dump schema + data: skipped`.
And the dashboard says *"Free Plan does not include project backups"*. **So there is no recoverable
copy of production anywhere**, and the region move needs one as its first step. Row 1 of the
CLAUDE.md table (a skip path) recurring by design; written down, not fixed — the secrets are yours.

## ③ 📉 THE PARENT DASHBOARD N+1 → ONE RPC
`entitled_chapters(learner, chapters[])` — one round trip, calls `is_chapter_entitled` per chapter
server-side so the ONE definition stays one. `entitledChapters()` uses it; a failed call is `null`
for every chapter (not found out ≠ refused). RLS suite gained **B13h** (seated + unseated agreement).

## ④ ⏱️ `is_chapter_entitled` PLANNING — MEASURED, AND MY FIRST NUMBER WAS WRONG
I reported *"11 ms to plan, 0.13 ms to execute"*. The 11 ms was MY reader connection planning the
hand-inlined body cold (568 catalog buffers). Production's own figure for the RPC is **2.6 ms mean,
0.5 ms min**. The mechanism is real, though: on PG 17 a SQL-language function's body is re-planned
on every call and a SECURITY DEFINER one cannot be inlined. In-database on PG 17.5, 2000 calls × 5:
**SQL 190 µs · plpgsql 34 µs · plpgsql with `discard plans` forced per call 218 µs** — the whole gap
IS the plan cache. Migration `20260903100000` makes it plpgsql, same body. **The after-number comes
from `extensions.pg_stat_statements` once applied** — nothing here can produce it.

## ⑤ 🍽️ `/menu` 6 → 2
The check-up trio (`auth/v1/user` + 2 selects) and the plan select ride inside
`get_learner_bootstrap` (migration `20260903100100`); the 6-week rule is one pure function
`checkupStatus` shared with the parent dashboard; `getCheckupStatus` reads the local session instead
of GoTrue. ⚠️ Found while doing it: the *"offline half"* the pointer comment promised did not exist —
the local-stars derivation sat in the catch of a fetch that ran only after the bootstrap succeeded.
It now runs on the real no-server-data paths (offline · no session · thrown bootstrap), and the
existing gate that names `applyPlan(localPlayed(), [])` guards a branch that is finally reachable.

## ⑥ 💾 THE BACKUP, STEP 1 — AS FAR AS IT GOES WITHOUT THE FOUNDER'S CREDENTIALS
The repo held **zero** secrets and **zero** variables, so all FOUR inputs `backup.yml` names were
missing, not three. What exists now: `PROD_PROJECT_REF` is set (a repo variable, 2026-09-03);
[docs/backup-restore-runbook.md](docs/backup-restore-runbook.md) carries the exact `gh secret set`
lines for `SUPABASE_ACCESS_TOKEN`, `PROD_DB_PASSWORD` and a generated `BACKUP_PASSPHRASE` (**his to
type — credentials never go through a chat**); `scripts/verify-backup.sh` verifies an artifact FROM
ITS CONTENTS (sizes, table/function/policy counts, rows per `COPY` block, the `counting` row) and
was watched going red on an unencrypted tarball, a wrong passphrase and a no-`COPY` dump; the
runbook holds production's row-count fingerprint of 2026-09-02 to compare against (72 chapters ·
19 learners · 49 sessions · 1,631 events · 11 auth users …).
⚠️ **Setting `PROD_PROJECT_REF` also arms `deploy.yml`'s `migrate-prod`** the moment the two
Supabase secrets exist. It stays skipped only because `migrate-staging` is skipped
(`STAGING_PROJECT_REF` unset). **Create the `production-db` environment WITH its required-reviewer
rule before anyone sets a staging ref**, or a push to `main` migrates production unreviewed.
⚠️ Expect the dump to be missing the 4 `pg_cron` jobs (extension schema, excluded by `db dump`);
whether `auth.users` rides in `data.sql` is what the script's row table settles — the CLI reference
and the restore guide say different things. No custom login roles exist, so no `roles.sql` needed.

## ⑦ ❓ A REQUEST THAT DOES NOT BELONG TO THIS REPO
The founder's last message asked for a combobox on an issue form's `area`/`type` fields
(`/tester`, "the sheet's Issue Category", `check-tester-cannot-read-admin.mjs`, an admin with 13
rows). **None of that exists in `milo-story-mode` or `../radlor-site`** — a wider search was
interrupted before it ran. Most likely the video-reviewer repo CLAUDE.md's table cites. Not done;
ask which repo before touching anything.

## ▶ OPEN — in the founder's order, and each one stops before the next
⚠️ **Items 1–4 SUPERSEDED the same afternoon — see the 🚀 block above.** Pro landed, managed backups exist, the clone was skipped as redundant, and the region move is GO with its own workflow. Kept for the record.
1. 🔴 **BACKUP, MADE REAL.** He sets the three secrets (runbook §1); then trigger `backup.yml`,
   download the artifact, run `scripts/verify-backup.sh`, compare to the fingerprint (runbook §2).
   Green is not the evidence — it has been green thirty times; the artifact is.
2. 🔴 **RESTORE IT ONCE, somewhere disposable** (runbook §3). Only a real Supabase project can find
   a missing role/extension/cron job — which is the Pro decision (third project = staging too).
   Report what was missing; something usually is.
3. 🔴 **THE REGION MOVE — not before Rafi says.** Sydney → a US region; the checklist is in ①.
   Nothing in ③–⑤ deploys to Sydney first: apply `20260903100000` then `20260903100100` in whichever
   project is going to be production, then read `pg_stat_statements` for the `is_chapter_entitled`
   RPC and the edge logs for `/menu` (expect 2 requests: `learner_events` + `get_learner_bootstrap`).
   The client fails open if it lands first (batch RPC 404 → all `null`).
4. 🎯 **Load-test step 2** waits for all three, on the staging project — the founder refused
   `loadtest-` rows in production on the strength of "someone will delete them".
5. ⏭️ `saveLearnerState` still calls `auth.getUser()` (conditional, rare) with the same "forces
   hydration" comment — same shape as ⑤, not touched.
6. ⏭️ Lint on `menu/page.tsx` reports two `set-state-in-effect` errors — **pre-existing on `main`**,
   identical before and after this session's edits.
7. 🎙️ Voice clips — superseded by the 🎙️ 2026-09-03/04 block above (17–18 done on Stevie; 3–5 on Teddy, resume after 2026-09-06).

_Older sessions (2026-06-15 → **2026-09-04**, including 🎙️ **the first voice-rendering session** (17–18 got its 161 clips, 3–5 got Teddy Twinkle and 872 of 1,411 lines), moved 2026-09-04 the same day it was superseded — ⚠️ everything it left uncommitted was committed and deployed in the 🔊 block above, and its still-live items (nobody has heard it on a device, OrderDesk/LevelRun have no clips, the MCP key) are carried there; including 🌙 **the nightly-E2E day** (12 runs red since the day it was created, the AR escape hatch half off a 640×320 screen, and the CI-only text-metric difference), moved 2026-09-04 — ⚠️ its still-live items (the scheduled-run green, the hull silence, the `counting` flake, and every launch blocker in its ▶ OPEN) are carried in the 🔊 2026-09-04 block above; including 🗒️ **the second tester pass** (Great job!, the hull silence diary, the typed directions line in all 72 chapters), moved 2026-09-04 — ⚠️ its still-live items (the hull silence, the `counting` flake) are carried in the 🌙 block's ▶ OPEN, and its "PR #69 is open" line was already stale when archived (merged 2026-08-31 as `9a4bcc3`); including 📏🎓 **the student-review days** (the run resumes, Ready everywhere, praise to 6–8, the number-tag overhang) and 🐇 **the line behind mother** (even spacing for one species, and the tautology guarding the approved picture), all moved 2026-09-03 — ⚠️ their still-live items (recorded clips for 3–11, the `counting` flake in `ready-bar.spec.ts`) are already carried in the 🌙 block's ▶ OPEN and the 🎙️ 2026-09-03/04 block; including 🔒 **Stage 3** (the chapter gate and the screens — a lock that names what is behind it, and a paywall built inert but tested refusing), moved 2026-08-31 — ⚠️ its still-live items (the deferred watched purchase, B12, `DRAFT = true`, the free-set pick, the nine Dependabot PRs, Vercel Analytics, the prose drift) were lifted into the 🌙 block's ▶ OPEN rather than archived with it; including 💳 **Stage 2b** (the price ladder, checkout and the webhook — and the finding I published without measuring it), 🧾 **Stage 2a** (the seat materialiser) and 🚪 **the funnel day** (the check became optional, the demo route, and the `onComplete` corpse), all moved 2026-08-30 — ⚠️ their still-live items (B12, `DRAFT = true`, the nine Dependabot PRs, Vercel Analytics, the anon-INSERT prose drift) were checked against the 🔒 Stage 3 block first and are all recorded there; including 💳 **the billing-schema apply day** (applied to production and completely inert, and the rollback capture that caught a migration silently reverting a security fix), moved 2026-08-28 — ⚠️ its still-live items (B12, the nine untriaged Dependabot PRs, and RLS gating the RECORD rather than chapter CONTENT) were checked against the newer blocks first and are all still recorded there; including 🧾💳 **the Stage-1 billing schema day** (RLS, entitlement, the guard at all three write paths), moved 2026-08-27; including 🧾 **the ledger-repair day** (58 repo migrations relabelled to the versions production recorded, `perf_advisors` applied, and the dry-run computed rather than credentialled), moved 2026-08-25 — ⚠️ its one still-live item (the anon-INSERT prose drift) was lifted into the current ▶ OPEN rather than archived with it; including 🔐 **the road-to-a-paywall day** (the RLS suite that had never run once, three privacy gaps between the published copy and the system, the anon INSERT closed, and the security regression caught four minutes after shipping), moved 2026-08-25 — ⚠️ its still-live blockers (B1/B2 `DRAFT = true`) were lifted into the current ▶ OPEN rather than archived with it; including 🚦 **the production-readiness day** (three workflows green while doing nothing, the dead error sink, eight chapters unstartable on a landscape phone), moved 2026-08-25; including 🔬 the seven-learner-models day (moved 2026-08-24), 🕸️ the skill-graph sensitivity audit and 🎯 the diagnostic's 96–98% rebuild, both moved 2026-08-24; plus 🇺🇸 the US-spelling / SEO / region-migration day, 🔗 the social-handles day, ❓ the question-quality sweep and 🎚️ the adaptive-loop day, all moved 2026-08-22) live in [docs/handoff-archive.md](docs/handoff-archive.md) — not loaded at session start. `grep` it for a chapter or a decision. Moved there to keep this file inside its size budget: the two 2026-08-14 blocks (🧱 all six neon chapters onto GameShell · 🎛️ the band moving onto the 12–18 engine) on 2026-08-16, 🏗️ **The Empty Plot** (the last neon chapter + the 3D deletion + the explainer-film pipeline) on 2026-08-17, 📊 **The Loading Bay** (the first storybook chapter onto GameShell, and the mastery exit finally seen to fire) and 🚀 **the first launch-hardening day** (0 security advisories, crash screens, self-hosted fonts, the enforced CSP, legal plumbing, the launch runbook) both on 2026-08-17, and 🔒 **launch hardening round two** (the walkthrough dead end, the CSP gate that had been red for a day, `media-src` silently killing the recorded voice on mobile) on 2026-08-18, and 🕳️ **the plan-pointer P0** (`ChapterPortal` dropping `onComplete`, so no child's diagnostic plan advanced for three months — plus the one-emoji-to-crawlers SEO fix and the inert short-landscape gate) on 2026-08-18, and 🧭 **the 2026-08-18 architecture/security/devops day** (the layering refactor, V13–V20, the two vacuous scheduled sweeps) on 2026-08-19, and ⚡ **the performance pass** (57 MB of art revalidated on every request, every backdrop shipped as full-size PNG, every creature journey relaying out the document — plus the /game fit controller that turned out to be dead code) on 2026-08-19, and 🛡️ **the five-role red-team day** (the AR camera door that could strand a child for ever, the placement check dying on one Back press, and the regression I shipped inside my own fix) on 2026-08-20, and — moved 2026-08-24 — 🚚 **The Packing Shed + The Minibus Run** (the two 9–11 chapters that closed the multiplication/division content hole) and 🎯 **the diagnostic rebuild** (26–34% → 81–87%, the answer-surface fix and the first accuracy gate), and — moved 2026-08-23 — 📐 **the tester's-four-bugs / responsiveness-sweep / `useOnceGuard` day** (the StrictMode ref guard that froze ten chapters' demos in dev only, 683 → 2 sub-44px tap targets, and 20/20 storybook coverage), and — on 2026-08-21 — ⚡ **the font pass** (Gaegu preloading 90 subsets), 🔎 **the public-SEO pass**, 🏷️ **the AdaptiveLearn rename**, and 🏗️ **the move onto the company account** (whose still-open items were carried forward into the 🧭 block rather than archived with it)._
