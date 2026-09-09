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
> letting it grow. The craft rules live in chapter-craft.md, not here.
> ⚠️ **AT 2026-09-10 THIS FILE IS OVER BUDGET: four blocks, 64 KB against a ~60 KB target.**
> **The next session moves 📊 2026-09-05 (/admin) out BEFORE adding anything** — lift its live items
> first (the `answer` event, the rollup, the 2026-09-27 purge cliff). ⚠️ The block after it,
> ⚖️ 2026-09-06, carries **account deletion, still never executed end to end**: carry that forward,
> do not drop it.
> ⚠️ Measure with `wc -c`, NOT a character count — the emoji here are multi-byte and python's `len()`
> under-reports this file by ~1.6 KB, which is how the figure in this very note was wrong once.
> Adding the 🚀 launch-week block moved 🗣️ 2026-09-04/05 to the archive. ⚠️ Its standing rule did NOT
> go with it: the speak-verb contract (`speak()` supersedes, `speakAfterCurrent()` queues,
> `speakPaced()` for a lesson) and its gate `src/__tests__/voiceBoundaryVerb.test.ts` live permanently
> in **docs/chapter-craft.md §3**, which is where to read them.
> ⚠️ Count the blocks by eye rather than by grepping one set of emoji: the 🗣️ block was invisible
> to a `^> [⚖️📊🧪🔊]` sweep on the day it landed, and a miscount here is a miscounted budget.)_

> 🚀 **2026-09-09/10 — LAUNCH WEEK. THE ROLLBACK MECHANISM EVERYONE ASSUMED DOES NOT WORK, `/api/lead` REPORTED SUCCESS ON A FAILED WRITE, DEPENDABOT'S ALERTS HAD NEVER BEEN ON, AND 17-18 IS NOW FULLY VOICED.** `tsc` 0 · **1837 passed, 2 skipped (99 files)** · `next build` 0 · sw v176 → **v181** · PRs #80 #81 #89 #91 #92 #93 #94 merged, plus #44/#45; six Dependabot PRs closed with reasons.
>
> **Founder's calls this week, and they narrow the scope:** ① **nothing is charged on Friday, the
> paywall stays off** — every Stripe item (the watched test purchase, cancellation, §8's refund
> sentence, deleted-account-still-charged) is OUT of scope; ② **the legal pages keep the DRAFT
> banner, `DRAFT` stays `true`** — do not flip it, the invite email says so.
>
> ## ① ⚠️⚠️ ROLLBACK: MOVING `release` BACKWARDS DOES NOTHING. REHEARSED IN DAYLIGHT
> "Rolling back = point `release` at the previous good commit" was the working assumption and it is
> **false**. Measured with a marker string in `sw.js` (served verbatim) plus a version bump:
> force-push succeeded, `release` moved, **production unchanged after 395s**. Vercel builds a
> **COMMIT, not a branch pointer** — it had already built that commit, so the push created **no
> deployment at all** (confirmed against the Vercel API: newest `target:"production"` was still the
> bad build). ✅ **Revert-and-push-forward WORKS: 280s** push → live. Vercel's dashboard
> "Promote to Production" is what `runbooks/rollback.md` already prescribed and is almost certainly
> right, but it needs dashboard/CLI access this session lacked — written up as **documented-but-
> unproven** (`isRollbackCandidate: true` is the only supporting evidence). Full commands in
> [docs/runbooks/launch-day.md](docs/runbooks/launch-day.md).
> ⚠️ **The sw VERSION must go FORWARD on a rollback, never back** — it keys the caches, so reusing a
> cached version strands that browser on the old shell.
> ⚠️ **THERE IS NO WAY TO CLOSE THE DOORS.** No `middleware.ts` anywhere, so nothing intercepts a
> request; `PAYWALL_ENABLED` gates chapters and is not a door. **Stopping means taking the site
> down.** Known, not built — launch week is the wrong week to add a request-intercepting layer.
>
> ## ② 🔴 LEAD CAPTURE IS ALIVE — AND THE ROUTE WAS LYING ABOUT IT
> ⚠️ **Correction: Milo production IS reachable from the Supabase MCP.** `list_projects` omits it,
> but `execute_sql` against `wrnjqjhrbnqxornmfisf` works (read-only). A previous session recorded the
> opposite and that was wrong — **use it rather than re-deriving from a pglite fixture.**
> Measured, control first (an equality read that finds a known row, and 0 for a known-absent one):
> probe POSTed through the live route **landed**, 14 → 15 rows; `anon` INSERT is `false`,
> `service_role` `true`, so it could only have come from the service-role key — **that key IS bound
> in production**. Second independent proof: `error_events` has rows at all and `sinkError` has no
> anon fallback. **0 `lead insert failed` rows, ever.**
> ⚠️ **The defect underneath:** the route checked `res.ok`, logged the failure — and returned
> `{ok:true}` 200 anyway, so a revoked grant, a missing key and a PostgREST outage were all
> indistinguishable from a captured lead. **Watched lying first**, then fixed: refused/threw → 502
> `not_recorded`, url/key missing → 503 `not_configured`. Safe by measurement — the only caller
> never reads the response. ⚠️ **The old gate could not have caught it**: `security.test.ts` greps the
> source for `/res\.ok/`, true of the broken version, which read the flag and ignored it.
> `leadRouteHonest.test.ts` DRIVES the handler; mutation-tested.
> 🔴 **Two probe rows to delete:** `select public.delete_lead_by_email('probe-lead-alive-20260909@example.invalid');`
> and the same for `probe-postfix-20260909@example.invalid`.
>
> ## ③ 🔴 DEPENDABOT: THE ALERTS HAD NEVER BEEN ON, AND THE QUEUE WAS THE SECOND LOCK
> The critical `next` RCE (GHSA-p293-qw3h-jr36, 16.0.0–16.3.2; prod was on 16.3.1) had **no
> Dependabot PR**, and **two independent mechanisms** had to fail: alerts AND security updates were
> **disabled at the repo level** (`403 Dependabot alerts are disabled`), so no security PR could ever
> open; and the version path was blocked because `open-pull-requests-limit: 5` sat **full at 5/5 for
> 19 days**. `npm audit` in `ci / verify` is what actually caught it — and `ci.yml` has **no
> `schedule:`**, so it only ever runs on a push or a PR.
> ⚠️⚠️ **A WRONG CLAIM I MADE AND THEN CORRECTED IN THE SAME FILE:** I wrote that raising the limit
> was a *precondition* for security updates. **False** — *"Security update pull requests are not
> subject to this limit and do not count toward it."* The limit constrains VERSION updates only.
> Corrected in `docs/devops.md`; a wrong belief outlives a wrong config.
> Now: alerts + security updates **ON** (0 open alerts, positive-controlled against a 558-package
> SBOM reporting the patched versions), npm limit **10**, a **`react` group**, and `security` removed
> from the labels — `labels:` applies to security *and* version PRs alike, so it stamped every
> routine bump; nothing applies a security label automatically, so **none was created**. A security
> PR is identified by its ALERT, not a label. `dependencies` created — and the proof arrived on its
> own: raising the limit released **7 PRs within minutes, 7 of 7 labelled**, where 9 of 9 had carried
> none. **Six Dependabot PRs closed with reasons**, incl. one that was a **downgrade back into the
> vulnerable `sharp` range** and looked like the other eight.
>
> ## ④ 🎙️ 17-18 IS COMPLETE — FIVE OF SIX BANDS FULLY VOICED
> Merged `clips-IvUJ-20260909-0617.zip` (253 MB, **11,246 clips**). **17-18 8,393/8,393 ✅** (+6,846,
> closed by this batch) · 15-16 **4,646/11,848** (+4,400, **7,202 left**) · 12-14 complete. Stevie
> 16,496 → **27,742** clips, 373 → 666 MB.
> Verified before merging: 0 zero-byte, **0 overlap** (all new), **11,246/11,246 keys matched a real
> corpus line**, **0 truncation outliers** (16.1 c/s median, max 1.8×), format identical to the store
> (CBR 56 kbps @ 22050 Hz, read from real mp3 frame headers).
> ⚠️ **LOUDNESS NOT INDEPENDENTLY VERIFIED** — no ffmpeg/ffprobe on this machine and no pure-python
> mp3 decoder. Applied upstream at render time; that is the pipeline's claim, not a measurement.
> ⚠️ **Stale comment, not fixed:** `chatterbox-render.py` says "32 kbps"; the real output is **56**.
> **"Are they attached in their places?"** — key derivation proven: the runtime's own `clipKey()`
> reproduces **20,447 of 20,447** stored keys, 0 mismatches (one function, imported by both player and
> corpus builder). The corpus is DERIVED by driving each chapter's `CONFIG`, so its lines *are* what
> the chapter speaks. All 11,246 in the live manifest (27,742); sampled TwoReceipts lines serve 200,
> a nonexistent key 404s. A browser drive showed the player fetching the manifest and streaming a clip
> by key. ⚠️ **What is NOT proven: no browser request for a NEW clip was ever caught** — they are
> `scored`/`miss`/`reteach` lines needing real answers (and 3 wrong for a re-teach), which the drive
> could not reach. Proven by construction and by serving, **not by ear**.
>
> ## ⑤ 🧯 BACKUP, DOCS, AND REACT
> `backup.yml` **now fails when unconfigured** — it warned-and-skipped while going green, **22 of 22
> recent runs `success` with 0 bytes written**. Watched red before trusting it; the error names the
> missing secrets, and it now checks `PROD_DB_PASSWORD` too (the old gate checked 3 of the 4 it
> needs). ⚠️ Reported not fixed: it does **not** call `scripts/assert-prod-ref.sh`.
> ⚠️⚠️ **THREE OPERATIONAL DOCS NAMED THE DECOMMISSIONED SYDNEY PROJECT AS PRODUCTION** four days
> after the region move — including `runbooks/rollback.md`, the page you read at 2am. Corrected to
> `wrnjqjhrbnqxornmfisf` against three sources (the GitHub variable, the literal in
> `assert-prod-ref.sh`, and the Supabase URL in the **served** bundle).
> **React `19.2.8`**: both pins moved in ONE commit — exact-pinned + `peer react@"^X"` means a
> react-dom-only PR **cannot `npm ci`** (#42 was red on that from 2026-08-25; #85 was the mirror).
> A `react` dependabot group now stops the split. **The pins STAY and the group is the price of
> keeping them** — remove the group and they must go caret in the same change (`docs/devops.md`).
> ⚠️ **New in `docs/devops.md`: only 7 of 98 test files render React** (4 mount, 4 server-render). A
> green suite is close to silent about what a child sees; the load-bearing evidence is
> `test:chapters` (211), the 38 prerendered pages, and a browser drive with a positive control.
>
> ## ▶ OPEN
> 1. 🔴 **NOT REACHED this week: the throttled performance measurement** (first load / TTI / bytes on
>    `/`, `/diagnostic`, one chapter; largest asset; what one session pulls from the voice clips;
>    whether a first visitor waits on the worker). Partial down payment: **the AR dependency is
>    18.38 MB** (7.45 model + 10.63 wasm + 0.30 js, measured) against a **20s `LOAD_TIMEOUT_MS`, so
>    anything under ~7.4 Mbit/s ALWAYS times out on first use**. Not a dead end — "Tap instead →" is
>    offered from the first frame and is gated by `arLoadEscape.test.ts`. ⚠️ The signed-in camera path
>    was never driven: a logged-out visitor is stopped by the consent gate and never fetches MediaPipe
>    at all (0 requests, measured).
> 2. 🔴 **NOT REACHED: the `counting` flake in `ready-bar.spec.ts`** (fix or quarantine) and **the
>    accessibility pass** over /auth, /parent, /diagnostic, /help, legal. Known already: /auth's
>    consent line **4.16:1** against a 4.5 floor, its link **3.04:1** — recorded, deliberately unfixed.
> 3. 🔴 **Nobody has HEARD any clip.** The one action that closes it and ① together: play a 17-18
>    chapter, get one wrong on purpose, listen to the re-teach.
> 4. 🟡 **Voice remaining: 15-16, 7,202 lines.** The Kaggle `PLAN` renders it next; merge the zip here.
> 5. 🟡 **Nightly E2E: the handoff's claim was STALE — two consecutive green SCHEDULED runs already
>    exist** (08 and 09 Sep, `event: schedule`, on `main`). Historically 7 green / 15 red.
> 6. ⏭️ **Six Dependabot PRs open**, all labelled, none a security update (0 open alerts). They wait
>    until after launch. ⚠️ #85's successor will split react/react-dom again only if the new group is
>    removed.
> 7. 🔴 **Launch blockers, NARROWED by the founder's two calls**: B12 Supabase Pro before any live key
>    (moot while nothing is charged) · **`DRAFT = true` deliberately, banner stays** · the free chapter
>    set is a PROPOSAL · Vercel Web Analytics off. **Every Stripe item is out of scope this week.**
> 8. ⏭️ Carried: account deletion never executed end-to-end; `migrate-prod` inert; Sydney still the
>    rollback (~$10/mo); `entitled_chapters` has no caller; the `/menu` 6→2 RPC half uncommitted; the
>    two auth migrations (`20260908120000`, `20260908120100`) still awaiting a hand-apply.


> 🎙️ **2026-09-07→09 — CHATTERBOX IS IN PRODUCTION AND FOUR OF SIX BANDS ARE FULLY VOICED. Plus: the nightly went red from a login-counter that fired on every page load, a confirm-password field, profile creation deferred to email confirmation, the paywall switched OFF, and the discovery that prod deploy sits behind CI — which held four green-looking commits back until one rls_regression fix unblocked them.** `tsc` 0 · **1825 passed, 2 skipped** · `next build` 0 · sw v167 → **v176** · commits `3cee430`…`ee852a2f` (17), all pushed · two migrations written, NOT yet applied to prod.

## ① 🗣️ CHATTERBOX TTS SHIPPED — THE WHOLE-LINE REMAINDER, ON A FREE GPU
Founder A/B'd Chatterbox Turbo (MIT) clones against the ElevenLabs originals and approved, with one note — **volume** — so every clip is levelled to the EL loudness (compressor → `loudnorm=I=-14`, because short exclamations are peak-bound and loudnorm alone leaves them 4 dB quiet). The two voices are **zero-shot clones from ~30 s of their own existing EL clips** (`scripts/chatterbox-ref/<id>.wav`, committed), so a chapter mixes recorded and cloned lines in one voice. **Bands COMPLETE: 3-5 (Teddy 1,411), 6-8 (4,006), 9-11 (7,889), 12-14 (1,661).** In progress: **17-18 1,656/8,502**, **15-16 343/11,945**. Stevie 16,496 clips on disk.
- **`scripts/chatterbox-render.py`** (committed): CUDA-first, `--band` to split the teen corpus, resumable (skips what is on disk, rebuilds `manifest.json` from disk so a crash unlists nothing), releases the MPS cache per line, exits early when there is nothing to render.
- **`scripts/chatterbox-kaggle.ipynb`** (committed): one account, a `PLAN` of bands in order (9-11 → 6-8 → 12-14 → 17-18 → 15-16), 50-line chunks each in a **fresh venv-built process**, zip refreshed per chunk. On Colab the zip goes to Google Drive. The corpus JSONs (`.voice-corpus-{6-8,9-11,teen}.json`) were committed so the notebook is just `git clone` + run; 3-5 stays gitignored (complete).
- ⚠️ **Kaggle T4: RTF ~0.5 — ~12× this laptop.** The laptop run (RTF 3-6, 20 GB swap thrash) was killed once Kaggle proved faster. Merge flow per zip: verify (0 empty, 0 low-ratio truncation outliers, loudness −14…−17), `rsync` merge (NOT `cp *` — 12k args overflow), rebuild manifest, gates, commit, watch **Deploy** (not just sw).
- ⚠️ **Traps paid for:** `setsid` absent on macOS (use `nohup caffeinate -i`); MPS OOMs at ~40 lines/process on 8 GB (hence 35-50 line chunks, fresh process each); Kaggle's python has no `ensurepip` (build the venv with `uv`); chatterbox pins torch 2.6 which breaks Kaggle's torchvision (its OWN venv, no torchvision); the notebook's chunk counter is **cumulative across bands** ("chunk 80" ≠ 80 in that band).
- ⚠️ **The un-downloaded final zip lost ~700 17-18 clips (~33 min GPU) — cumulative zips mean only the delta since the last merge is at risk.** Kaggle saves `/kaggle/working` to the notebook Output, so a network-dropped session may still be recoverable there.

## ② 🔇 THE NIGHTLY WENT RED FROM A LOGIN COUNTER ON EVERY PAGE LOAD
`AuthEventLogger` (added 2026-09-05) treated supabase-js's `SIGNED_IN` as a login — but that event ALSO fires from `_recoverAndRefresh` on **every page load that finds a stored session**. So production inserted a `login` row per hard reload (the /admin panel was counting page loads), and the nightly E2E + weekly sweep went red on all 216 chapter loads (placeholder Supabase host → `ERR_NAME_NOT_RESOLVED` on the POST). Fix (`93e25ab`): a login counts only if **no session existed in storage at page load** (`hadSessionAtLoad()`), cleared by `SIGNED_OUT`. Gated by `authEventLogger.test.ts`, watched red on the old listener; placeholder-build probe now makes 0 failed requests across three chapter loads, positive control confirms it still sees a real one. **Both scheduled gates green again** (dispatched by hand on the fix commit — nightly 218 passed).

## ③ 🔐 CONFIRM-PASSWORD, AND PROFILE CREATION DEFERRED TO CONFIRMATION
- **Confirm-password field on email signup** (`19337fc`, sw v171): signup only, compared before anything is sent, tab-switch clears it. Driven against a placeholder build — mismatch shows the error with 0 Supabase requests, matching sends exactly one `POST /auth/v1/signup`.
- **Profile-on-confirmation** (`95c21c4`, migrations `20260908120000` + `20260908120100`): founder noticed a "Waiting for verification" account already had a `profiles` row. Cause: the dashboard trigger `on_auth_user_created` fired `after insert on auth.users` (i.e. at signup, before the email is clicked). Now `handle_new_user()` creates the profile only when `email_confirmed_at` is set, and the trigger also fires on the confirm-link UPDATE — copied from the live definition with ONLY the guard added (still `security definer`, `search_path 'public'`; OAuth unaffected). Plus `prune_unconfirmed_users()` (one-time sweep + 03:37 pg_cron) deletes never-confirmed accounts >3 days old. Verified in pglite; watched red on the old trigger. ⚠️⚠️ **THESE TWO MIGRATIONS ARE NOT APPLIED TO PROD — the founder applies auth-schema DDL by hand.** Safe before or after the client (getMyRole tolerates a missing profile → role picker).

## ④ 🔓 PAYWALL OFF, AND CI GATES THE DEPLOY
- **`PAYWALL_ENABLED = false`** in `useChapterGate` (`8a73733`, sw v172): no chapter is gated until Stripe ships. Independent of `billing_config.enforced` — the hook never asks the DB and can never return `locked`. Re-enable = flip it AND set `enforced`; `gateVerdict` stays pure and unit-tested, the hook-driven locked-WIRING test is `skipIf(!PAYWALL_ENABLED)`. Guarded by `chapterGateOff.test.ts`, watched red with the flag on.
- ⚠️⚠️ **PROD DEPLOY IS BEHIND CI NOW (the 2026-09-05 gating), AND IT WORKS.** The migrations commit broke `ci / rls-tests` — its `rls_regression.sql` seeded owners into `auth.users` with no `email_confirmed_at` and relied on the OLD trigger to make their profiles, so the next `learners` insert failed `learners_created_by_fkey`. **Four green-looking commits (migrations, paywall-off, two voice batches) never reached production — prod sat at v171 for hours** while `promote` (`needs: ci`) skipped. `a944caf4` fixed the suite (confirmed owners); green there promoted all four at once. **The lesson: after every push, watch the Deploy run, not just the sw version** — a red CI now silently holds work back, which is the gate working as designed.

## ▶ OPEN
1. ⏭️ ~~**VOICE REMAINING: 17-18 (6,846 left) and 15-16 (11,602 left)**~~ **SUPERSEDED 2026-09-10 — 17-18 is COMPLETE; only 15-16 remains, 7,202 lines. See the 🚀 block.** Original text: — the two biggest bands, next Kaggle sittings (account quota 30 GPU-h/week, so 2-3 sessions). The `PLAN` renders 17-18 then 15-16. Merge each zip here.
2. 🟡 **Nobody has HEARD the rendered clips on a real device beyond the founder's A/B pairs.** Every other check is a network request + duration/loudness sweep.
3. 🟡 **6-8 corpus (4,006) reads complete, but 4 chapters speak from their own components** (`placeValue`, `additionTo100`, `subtractionTo100`, `money` return an empty `prompt`) — confirm their per-round lines are actually covered, not just the beat surface.
4. ⏭️ **The stitcher is dead — whole-line via GPU replaced it.** The 🔊-block stitcher listening-test question is moot: Chatterbox renders whole lines cheaply, so nothing is stitched.
5. ✅ ~~**Nightly E2E green was by MANUAL dispatch**~~ **CLOSED 2026-09-10 — two consecutive green SCHEDULED runs on `main` (08 + 09 Sep) measured.** Original note: on the fix commit; a green SCHEDULED run against a main containing the fix still worth confirming.
6. ⏭️ `OrderDesk` and `LevelRun` (the two 9-11 storybook chapters) have no clips and are in no corpus — they run `SkillBeat`, not GameShell.
7. ⏭️ The `counting` case of `ready-bar.spec.ts` is still flaky; the hull silence is still unmeasured (`docs/voice-check-for-tester.md`); the ElevenLabs MCP still holds the rotated key (measure with `curl`); the `/menu` 6→2 RPC half is still uncommitted.
8. 🔴 **Launch blockers, unchanged**: the watched test-mode Stripe purchase (deadline before Stage 4) · B12 Supabase Pro before any live key · **`DRAFT = true` — privacy policy and ToS still placeholders, and §8's refund sentence is unwritten and LIVE** · the free chapter set is a PROPOSAL · nine Dependabot PRs (#28–#47) · Vercel Web Analytics off. ⚠️ Paywall being OFF does not change these — it just means nothing is gated *yet*.
9. 🔴 **Carried from ⚖️ 2026-09-06**: account deletion never executed (founder's throwaway-account test); Stripe cancellation not wired; `migrate-prod` inert; Sydney still the rollback (~$10/mo); `entitled_chapters` has no caller; and the two migrations in ③ awaiting a hand-apply.
10. 🟡 **`/auth`'s consent line measures 4.16:1** (`#8a7a63` on the white card, WCAG formula, 2026-09-09) — UNDER the 4.5:1 floor for 12px text; the link `#F26B2C` is 3.04:1. Found while wiring `ConsentLine` into the lead capture (`consentLine.test.ts` pins the number). Not changed — the brief was /auth byte-identical; founder's call whether to darken it.

> ⚖️ **2026-09-06 — THE TERMS SAID THINGS THE PRODUCT DOES NOT DO, AND THE BIGGEST ONE — "delete your account at any time from your account settings" — HAD NOTHING BEHIND IT AT ALL. Both legal documents placed behind the draft banner; account deletion built, and PROVEN not to orphan before a line of it was written.** `tsc` 0 · **1817 passed, 1 skipped** · `next build` 0 · **four commits, CI green on `a9d638d`** · sw v163 → **v167** · one migration written here and applied by the founder, verified present in production.

## ① 📄 THE APP'S TERMS ARE ON `/legal/terms`, AND EVERY PLACEHOLDER STILL SHOWS
Pasted **verbatim** from `docs/app-terms-of-service.md` (in the repo, because the gate compares against it), minus only its markdown H1 and its "Last updated" line — both of which the page renders from `title`/`updated`. Linked from **signup (above the button — it was below it), the parent dashboard footer, checkout (above Continue), and the landing footer**.
**`DRAFT` is true and the banner is up.** ⚠️ **The date is 6 September 2026 — founder's call, 2026-09-06, and it is NOT a review.** `[DATE]` marked *"nobody has decided"*, not *"a lawyer must decide"*. **Four markers are still open and still render to every visitor:** nine `[LAWYER REVIEW]`, §3's and §15's `[NN]` windows, §15's `[URL]`, and §8's refund sentence — which is not waiting on counsel, it is **unwritten**, and its own text says *"Do not publish with a placeholder."*
⚠️ **`PLACEHOLDERS` vs `OPEN` is the distinction that took two passes to see.** The first is the REFUSAL list and never shrinks (a resolved `[DATE]` coming back still blocks publication); the second is what is unresolved TODAY, written by hand, so resolving one is a diff somebody reviews rather than a gate quietly finding less to complain about. Both directions are asserted.

## ② 🚨 WHAT THE DOCUMENT CLAIMED AND THE CODE DID NOT DO
Four findings, each measured. **The first is why the rest of the day happened.**
- **§11: "delete your account at any time from your account settings."** The only occurrence of that phrase in the whole repository **was the sentence itself.** No control, no route, no RPC.
- **§8: "You may cancel at any time from your account settings."** No billing portal, no cancel route. `cancel_at_period_end` is READ and never written. Still true today.
- **§6 contradicts the Privacy Policy**, and §6's own `[LAWYER REVIEW]` note says it must not: it promises *"placement results … kept while the profile exists"* while `prune-diagnostic-items` deletes `diagnostic_items` at 90 days and the Privacy Policy says so out loud.
- **The camera is not in the document at all.** Eight live 9–11 chapters ask a child to turn it on; §3 enumerates *"what a child never gives us"* including *"a photograph"* and never mentions it.
⚠️ And two §6 claims are **true in code and never once observed in production** — `sessions.started_at` and `auth_events` — i.e. the 📊 block's own open items 2 and 3.

## ③ 🗺️ THE FK MAP, READ OFF `pg_constraint` — AND THE `RESTRICT` THAT WAS PROTECTING US
Milo production is not reachable from the MCP (only `radlor-site` is), so the schema was built in **pglite from `baseline_schema.sql` + all 81 migrations** — the sequence `ci / rls-tests` stages — and the catalog queried. That fixture is now [src/__tests__/_schema.ts](src/__tests__/_schema.ts) and is reusable.
⚠️⚠️ **`learners.created_by -> profiles` is ON DELETE **RESTRICT**, and `profiles.id -> auth.users` is CASCADE. So deleting an auth row for any parent who had ever added a child RAISED**, measured by running it:
`update or delete on table "profiles" violates RESTRICT setting of foreign key constraint "learners_created_by_fkey"` — auth user, profile and learner all still present afterwards.
**Deletion was not un-surfaced, it was impossible** — and that RESTRICT is the reason no half-deleted family exists, and why the function deletes learners FIRST in the same transaction.
⚠️ **`error_events.learner_id` has NO foreign key at all** — the one orphan this schema can produce, since no cascade reaches it. Cleared explicitly.
⚠️ **`billing_events.account_id` is SET NULL** — the one deliberate survivor. **`diagnostic_leads` is not reachable by deletion at all** (keyed on the email, no user id): a parent who used the free check, signed up with the same address and then deleted still has that row for 24 months. A real gap in the promise, recorded not fixed.

## ④ 🔐 `delete_my_account` — ONE TRANSACTION, AND `amr` RATHER THAN `iat`
SECURITY DEFINER, revoked from `public`/`anon`, granted to `authenticated` only; subject from `auth.uid()`, so a caller can only delete themselves. No service-role key and no API route. **One function, therefore one transaction:** a partial failure is an untouched account and an error the parent is told about. No soft delete, no grace window.
⚠️⚠️ **THE RE-AUTH GUARD READS `amr`, NOT `iat`, AND I WROTE `iat` FIRST.** supabase-js refreshes the access token roughly hourly, minting a **new `iat` while nobody has proved anything** — so an `iat` check is satisfied by a tablet left open on a kitchen table, which is exactly the child this exists to stop. `amr` carries the moment the human authenticated and does not move on refresh; absent `amr` is a refusal. **Reverting to `iat` makes the refreshed-token and no-`amr` cases both pass**, which is the hole.
The page is `/parent/account`, reached only from a small link at the very bottom of `/parent`, with the **export offered above the confirm**; a gate asserts nothing under `/game`, `/menu` or `/shop` links to it.

## ⑤ 🧪 THE GATES, AND THE NINE REDS THAT PAID FOR THEM
`accountDeletion.test.ts` counts **every reachable table before and after**, with the table list DERIVED from the FK graph — a table with no census clause throws rather than being skipped.
⚠️ **The break that changed the design:** my per-account census counted by ownership column (`created_by = A`) and was **BLIND** to a stranded row. Whole-table counts against a second family are what binds — *"public.learners holds 3 rows; family B has 1. 2 row(s) survived, possibly with a nulled owner."* The census alone passed on that build.
Others watched red: `error_events` cleanup removed · re-auth guard removed · guard reverted to `iat` · a new `learner_id` table added (*"is reachable from an account and this census has no clause for it"*) · `DRAFT = false` (kills **`next build`**, not just vitest) · the refund sentence quietly resolved · `[DATE]` put back after resolution · the date drifting between the .md and the page header.
⚠️ **CI caught a defect in my own gate that local green could not:** it compared against `app-terms-of-service.md` while that file was **untracked** — green on one machine, ENOENT everywhere else. The document is committed now. *Local gates green is not the same claim as "this works."*

## ⑥ 🌐 THE MARKETING SITE — MEASURED, WITH POSITIVE CONTROLS
**radlor.com runs NO analytics and sets NO cookie of any kind**, not even strictly necessary. Four pages: 0 off-origin hosts, 0 `Set-Cookie` **headers** (checked at the header, since HttpOnly is invisible to `document.cookie`), 0 storage keys, no `/_vercel/insights`. ⚠️ Both instruments positive-controlled: the same `curl` grep found 3 `Set-Cookie` on google.com, and the same JS found `upload.wikimedia.org` and a 105-char cookie on Wikipedia. So the zeros are measurements.
**The waitlist `service_role` finding is FIXED.** Verified against production, not the repo: `anon` holds **column-level INSERT on `email`, `age_band`, `source` only**, one INSERT policy, no SELECT/UPDATE/DELETE; live `/api/health` says `anon_key_configured: true`. Table is `id, email(citext unique), age_band, source, created_at` — **1 row, 2026-08-31**. ⚠️ **But `supabase/migrations/20260830000000_waitlist.sql` is the repo's only waitlist migration and it says RLS on with NO policies, `revoke all from anon`, and *"Do not add one"* — production has the policy and the grants, applied with no migration file.** The file now states the opposite of production and tells the next reader to delete what the live form depends on.

## ▶ OPEN
1. 🔴 **§8's refund sentence is unwritten and LIVE on the page.** The only open marker that is not a lawyer question. One sentence from the founder closes it.
2. 🔴 **UNANSWERED, ASKED TWICE: was radlor.com's Terms of Use actually reviewed by an attorney?** Another session committed `38588b7 terms: publish as live, reviewed terms — banner off, dated 6 September 2026`, claiming founder confirmation. **It is live now with the banner off and `[DATE]` resolved.** If the review happened, nothing to do. If it did not, unreviewed terms are presented as binding on a public site. Not touched either way — reverting a published legal document is as much the founder's call as publishing it was.
3. 🔴 **Account deletion has never been executed.** The migration is applied (three-way probe: `delete_my_account` → 42501/401 *exists, anon refused*; a nonexistent name → PGRST202/404; `is_chapter_entitled` → 42501/401 as the control). ⚠️ **That is the NEGATIVE half only.** *"Nobody unauthorised can call it"* and *"nobody at all can call it"* are the same green — the M6 trap this repo already has a row for. The founder's throwaway-account test is what proves `authenticated` can execute it, and that the DEFINER owner may `delete from auth.users` at all (if not, the transaction rolls back and nothing is deleted — it fails safe).
4. 🔴 **§11 has not been rewritten around what survives.** [src/core/accountDeletion.ts](src/core/accountDeletion.ts) is the one declaration, rendered into the page and asserted against the running delete: `billing_events` stripped of its owner, Stripe's own copy, and `diagnostic_leads` named as unreachable.
5. ⏭️ **Stripe cancellation is not wired**, and must be before the first live purchase or a deleted account keeps being charged. Harmless today: zero subscriptions exist.
6. ⏭️ **`migrate-prod` is inert** — no `production-db` environment, no `STAGING_PROJECT_REF`, no Supabase secrets — so `promote` ships client code while migrations wait. The client names that state (`PGRST202` → `not_deployed`) and tells the parent to email support instead of showing a shrug.
7. ⏭️ Carried from the archived region-move block: **Sydney is still the rollback and costs ~$10/mo** (the window has long passed); **`SUPABASE_SERVICE_ROLE_KEY` has never once been exercised** on the new project; the **`/menu` 6→2 RPC client half is still uncommitted**; **`entitled_chapters` still has no caller**, so it has never run.
8. 🔴 **Launch blockers, unchanged**: the watched test-mode Stripe purchase · B12 Supabase Pro before any live key · **the app's Terms and Privacy Policy are both still DRAFT** · the free chapter set is a PROPOSAL · nine Dependabot PRs · Vercel Web Analytics off.

> 📊 **2026-09-05 — /admin SHIPPED, AND THE FOUR THINGS IT WAS ASKED TO MEASURE WERE ALL LYING. Then a privilege escalation caught one step before production, a funnel that was not a funnel, and the discovery that CI has never gated anything on this repo.** `tsc` 0 · **1794 passed, 1 skipped** · `next build` 0 · **fifteen commits, all pushed, CI green on `7772729`** · sw v162 → **v163** · four migrations applied to production and verified.

## ① 🔎 THE INVENTORY CAME FIRST, AND FOUR PANELS COULD NOT HAVE BEEN HONEST
Founder's order: inventory before UI. It paid for itself four times — [docs/data-inventory.md](docs/data-inventory.md) is the record.
- **`sessions.started_at` was never a start time.** The RPC never supplied it, so it took the column default `now()` at INSERT while `completed_at` is a CLIENT stamp. Both marked the END: **49 of 49 rows had a NEGATIVE duration** (median −1s). A dashboard subtracting one from the other would have shown a confident plausible number for a quantity never recorded.
- **`diagnostic_sessions` was written only at completion** — all 13 rows have `completed_at = started_at` exactly, so "how many start the check" had **no denominator** and could only ever return 100%.
- **`auth_events` held ONE row against ≥18 real logins** in six weeks.
- **No per-question record exists at all.** The complete prop corpus is `action, ageGroup, at, band, chapter, correct, mastered, wrong`.
⚠️ **Every timestamp in the database is `timestamptz`** — timezone is purely presentation. The real trap is `client_ts` vs `created_at`: they diverge by up to **8.9 days**, and the skew is `created_at > client_ts` in **28 of 28** cases — pure late upload from the offline queue, never a fast clock. `client_ts` is the honest event time.

## ② 🚨 A PRIVILEGE ESCALATION, CAUGHT ONE STEP BEFORE PRODUCTION — FOUNDER'S CATCH
A draft of the gate added `'admin'` to the `user_role` enum and had `admin_assert()` read `profiles.role`. Reproduced against production's verbatim policy and grants:

    policy[ALL] "profiles: own row"  USING auth.uid()=id  WITH CHECK auth.uid()=id
    ACL: authenticated = arwdDxtm
    update public.profiles set role='admin' where id=auth.uid();   -> ACCEPTED

**Every signed-in parent could have granted themselves the dashboard.** ⚠️ **The `with check` constrains WHICH ROW, never WHICH COLUMN** — and the policy is not a bug: `setMyRole()` exists on purpose for the Teacher/Parent picker. **It is a FEATURE that stops being safe the moment a privileged value joins the same column**, which is why reviewing the policy alone would never have found it.
Fixed structurally: `admin_users` is its own table, **RLS on with ZERO policies** (no policy means no row is readable or writable — the absence IS the mechanism), all privileges revoked from client roles, and the migration alters **no enum**, so there is nothing to escalate TO. Verified on prod: `policies=0`, `ACL={postgres,service_role}`, enum still `(parent,learner,teacher)`.
⚠️ **The sweep that follows it**: everything `is_chapter_entitled` trusts has **0 client write policies**. The one live example of the same shape is `profiles.is_internal` — a user can hide their own account from metrics. Recorded, not fixed; it grants nothing.

## ③ ⚠️⚠️ THE FUNNEL WAS NOT A FUNNEL, AND A HAND-COMPUTED FIXTURE COULD NOT SEE IT
Its four steps were **independent predicates**, not nested, so a later step could exceed an earlier one. It did: flagging two internal accounts took production to **9 → 6 → 3 → 4**. Arithmetically impossible, and every "lost here" figure was wrong.
⚠️ **IT SURVIVED THE HAND-COMPUTED FIXTURE — because whoever computed the expected values by hand used the SAME wrong definition the code did.** Both sides inherited the error, so the test could only confirm it. It then survived two more populations by coincidence (11→7→5→5, 10→6→4→4 are both monotonic) and was exposed by an unrelated change.
**The patch for that blind spot is invariants**: a value test says *this input gives that output*; an invariant says *no input may give an output of this shape*. [src/features/admin/invariants.ts](src/features/admin/invariants.ts) holds them once and runs in **both the tests and the browser** — the bug was on screen and nobody was looking. A violating payload now renders a banner naming the invariant and reports server-side.
⚠️ **Two proposed invariants were FALSE and the fix was the code, not the assertion:** `finished <= started` and `rate ∈ [0,1]`. `chapter_open` lives in `learner_events` (**purged at 90 days**); `sessions` are kept for ever, so a completion whose open has aged out gives a rate above 100%. None in production today **only because the oldest event is 78 days old — the first purge is 2026-09-27.** `started` is now OPENED **OR** COMPLETED, true by construction.

## ④ 🚦 CI HAS NEVER GATED ANYTHING ON THIS REPO
`ci / rls-tests` failed on **five consecutive commits** and nobody noticed. Measured: **no branch protection, no required status check, no workflow reading a CI result** — and Vercel builds on push independently, so **all five red commits reached production READY**. A red CI stopped nothing and told nobody.
Fixed with a mechanism, not a resolution: Vercel's Production Branch is **`release`**, and `deploy.yml`'s `promote` job (`needs: ci`) is the only thing that moves it. `red-main.yml` covers **three** cases and names which — CI red, **promote red** (working code silently NOT live, the mirror defect), and **drift** (main >2 commits ahead, the one that hides). All four paths driven by hand before being trusted; the first version of the notifier **could not have fired at all** (`gh` needs `-R` with no checkout), and the drift check's `$(cmd || echo SENTINEL)` was broken because **`gh api` prints its errors to stdout**.

## ⑤ 🧯 THE OTHER SESSION'S WORK WAS DESTROYED AND RECOVERED
Two sessions ran in this repo at once. The other ran `scripts/break-check.sh`, which parks the tree with `git stash --include-untracked` — my uncommitted migration, four pages, a 302-line test and a runbook were swept into a stash and dropped. Recovered from `git fsck --unreachable`, anchored as pushed tags `recovered/menu-rpc-work` and `recovered/admin-dashboard`. ⚠️ **A header note describing this hazard had been written into that file the same morning and the work was destroyed that afternoon.** Written-down care is not a mechanism. `break-check.sh` now runs the break in a **`git worktree`** — the tree you stand in is never touched, so there is no stash to lose.
⚠️ **`src/__tests__/menuRoundTrips.test.ts` is the one unrecovered loss.** Rewrite it with the `/menu` work, not before — see [docs/recovered-menu-rpc-work.patch](docs/recovered-menu-rpc-work.patch).

## ⑥ 📈 WHAT /admin ACTUALLY SAYS TODAY
Aggregate-only by construction (`group by` + aggregates, so a per-child row is not expressible), read-only, no per-user view, no export. Suppression happens **in SQL** so a suppressed number never reaches the browser. From the deployed definitions, with both founder accounts excluded:
**funnel 9 → 6 → 3 → 3** (monotonic), 1 account returned without ever finishing · mean **1.48** chapters/learner, **median 0** · 10 of 21 learners ever completed one.
⚠️ **The completions question is answered: it was onboarding, not failure.** 4 learners created in 7 days by one account, opening chapters and finishing none. Ruled out "failing to record" with a clean discriminator worth keeping — **`practice_complete` fires client-side BEFORE the network call while the `sessions` row is written BY it**, so a completion that happened but failed to sync leaves the event with no row. 4 and 4, newest of each at the identical timestamp.

## ▶ OPEN
1. 🔴 **THE `answer` EVENT AWAITS THE FOUNDER'S APPROVAL — do not wire it first.** Proposed shape: `{ chapter, item, correct, tier, ordinal }`, five keys, no free text, nothing identifying, riding the existing offline queue. ⚠️ **`item` is the hard part, not the shape**: most chapters GENERATE questions, so a stable id must come from the generator's KIND (`op.subtract`), never the drawn numbers. And it is a ~10× rise in event rows, inside the 90-day purge.
2. 🔴 **Two sign-ins (one Google, one email) then read `auth_events`.** Fix #3 shipped: one global `onAuthStateChange` listener replaces three scattered call sites, and a failed write now reaches the error sink. ⚠️ **Both causes had to go** — the swallow AND the OAuth callback's early return, which usually won because supabase-js processes the hash during client construction.
3. 🔴 **Play one chapter** — the first real session duration. `started_at` is applied; nothing has been completed since.
4. 🔴 **Founder-only:** `ADMIN_MIN_COHORT=1` in Vercel (it defaults to 5, which suppresses nearly everything — the threshold is now always shown so it cannot read as broken), Vercel Production Branch → `release` (**the gate is inert until this**), and the rest of the internal-account list.
5. ⏭️ **The rollup (option A)** — id-free, **margins not the cross-product**, suppression at WRITE time. Design in data-inventory.md §3a. The purge cliff is **2026-09-27**, when 520 events (31% of all history) go in one night.
6. ⏭️ `profiles.is_internal` is client-writable — same shape as the escalation, grants nothing.
7. ⏭️ **Storage: no exposure.** Supabase Storage is **empty** (0 buckets, 0 objects). The 4,011 voice clips / 96 MB are in **git**, present in the pushed tree and served by Vercel — three copies, better protected than the database.
8. ⏭️ Ledger repaired: the four filenames are recorded and the synthetic rows are gone. `apply_migration` stamps its own timestamps, so this recurs — one tidy-up row may remain, harmless (push applies files MISSING from the ledger; an extra row is ignored).
9. 🔴 **Launch blockers, unchanged**: the watched test-mode Stripe purchase · B12 Supabase Pro before any live key · **`DRAFT = true` — the privacy policy is still a placeholder, and it publishes a 90-day retention promise the rollup must not contradict** · the free chapter set is a PROPOSAL · **nine Dependabot PRs open** · Vercel Web Analytics off.
10. ✅ ~~`backup.yml` still reports success while its dump step is skipped — filed, not fixed.~~ **FIXED 2026-09-09 (PR #91): it now FAILS and names the missing secrets; watched red before being trusted.** Original note: Supabase Pro daily backups are real, so it is not a data-loss risk; it is a green tick that means nothing.


_Older sessions (2026-06-15 → **2026-09-05**, including 🗣️ **the voice-cutoff day** (nothing Milo says is cut off by the next thing, in any band — and the audit that proved it was only half done the first time), moved 2026-09-10 — ⚠️ **its rule is NOT archived with it**: the speak-verb contract and `voiceBoundaryVerb.test.ts` are written up in **docs/chapter-craft.md §3**, and `scripts/break-check.sh` (ported there from `video_reviewer`, and existing in BOTH repos with different runners) is described in CLAUDE.md; including 🔊 **the voice-on-the-CDN day** (three silent defects in one chain, the first honest cost accounting, and the stitcher that failed its listening test) and 🧪 **the Chatterbox evaluation** (Resemble AI TTS in a scratch venv, Nano off the table, the GPU-cost argument), both moved 2026-09-09 — ⚠️ 🔊's live ▶ OPEN was lifted into the 🎙️ 2026-09-07→09 block (the stitcher is now moot — whole-line via GPU replaced it) and 🧪 is superseded by that block; including ✅ **the region-move CUTOVER day** (eleven dispatches, ten red, every red a real defect in the workflow — and the auth trigger a schema dump does not carry), moved 2026-09-06 — ⚠️ its still-live items (the Sydney rollback, `SUPABASE_SERVICE_ROLE_KEY` never exercised, the missing `production-db` environment, the uncommitted /menu RPC half, `entitled_chapters` with no caller) are carried in the ⚖️ 2026-09-06 block's ▶ OPEN item 7; including 🚀 **the Pro / region-move GO day** (the one-job workflow that diffs the same query on both databases) and 🌏 **the load-measurement day** (the database was in Sydney while every user was in the US, and the nightly backup had never run), both moved 2026-09-05 — ⚠️ their still-live items are carried in the ✅ region-move block above and in the 📊 2026-09-05 block's ▶ OPEN (`backup.yml` green while skipping, the `production-db` environment, and the two Supabase secrets); including 🎙️ **the first voice-rendering session** (17–18 got its 161 clips, 3–5 got Teddy Twinkle and 872 of 1,411 lines), moved 2026-09-04 the same day it was superseded — ⚠️ everything it left uncommitted was committed and deployed in the 🔊 block above, and its still-live items (nobody has heard it on a device, OrderDesk/LevelRun have no clips, the MCP key) are carried there; including 🌙 **the nightly-E2E day** (12 runs red since the day it was created, the AR escape hatch half off a 640×320 screen, and the CI-only text-metric difference), moved 2026-09-04 — ⚠️ its still-live items (the scheduled-run green, the hull silence, the `counting` flake, and every launch blocker in its ▶ OPEN) are carried in the 🔊 2026-09-04 block above; including 🗒️ **the second tester pass** (Great job!, the hull silence diary, the typed directions line in all 72 chapters), moved 2026-09-04 — ⚠️ its still-live items (the hull silence, the `counting` flake) are carried in the 🌙 block's ▶ OPEN, and its "PR #69 is open" line was already stale when archived (merged 2026-08-31 as `9a4bcc3`); including 📏🎓 **the student-review days** (the run resumes, Ready everywhere, praise to 6–8, the number-tag overhang) and 🐇 **the line behind mother** (even spacing for one species, and the tautology guarding the approved picture), all moved 2026-09-03 — ⚠️ their still-live items (recorded clips for 3–11, the `counting` flake in `ready-bar.spec.ts`) are already carried in the 🌙 block's ▶ OPEN and the 🎙️ 2026-09-03/04 block; including 🔒 **Stage 3** (the chapter gate and the screens — a lock that names what is behind it, and a paywall built inert but tested refusing), moved 2026-08-31 — ⚠️ its still-live items (the deferred watched purchase, B12, `DRAFT = true`, the free-set pick, the nine Dependabot PRs, Vercel Analytics, the prose drift) were lifted into the 🌙 block's ▶ OPEN rather than archived with it; including 💳 **Stage 2b** (the price ladder, checkout and the webhook — and the finding I published without measuring it), 🧾 **Stage 2a** (the seat materialiser) and 🚪 **the funnel day** (the check became optional, the demo route, and the `onComplete` corpse), all moved 2026-08-30 — ⚠️ their still-live items (B12, `DRAFT = true`, the nine Dependabot PRs, Vercel Analytics, the anon-INSERT prose drift) were checked against the 🔒 Stage 3 block first and are all recorded there; including 💳 **the billing-schema apply day** (applied to production and completely inert, and the rollback capture that caught a migration silently reverting a security fix), moved 2026-08-28 — ⚠️ its still-live items (B12, the nine untriaged Dependabot PRs, and RLS gating the RECORD rather than chapter CONTENT) were checked against the newer blocks first and are all still recorded there; including 🧾💳 **the Stage-1 billing schema day** (RLS, entitlement, the guard at all three write paths), moved 2026-08-27; including 🧾 **the ledger-repair day** (58 repo migrations relabelled to the versions production recorded, `perf_advisors` applied, and the dry-run computed rather than credentialled), moved 2026-08-25 — ⚠️ its one still-live item (the anon-INSERT prose drift) was lifted into the current ▶ OPEN rather than archived with it; including 🔐 **the road-to-a-paywall day** (the RLS suite that had never run once, three privacy gaps between the published copy and the system, the anon INSERT closed, and the security regression caught four minutes after shipping), moved 2026-08-25 — ⚠️ its still-live blockers (B1/B2 `DRAFT = true`) were lifted into the current ▶ OPEN rather than archived with it; including 🚦 **the production-readiness day** (three workflows green while doing nothing, the dead error sink, eight chapters unstartable on a landscape phone), moved 2026-08-25; including 🔬 the seven-learner-models day (moved 2026-08-24), 🕸️ the skill-graph sensitivity audit and 🎯 the diagnostic's 96–98% rebuild, both moved 2026-08-24; plus 🇺🇸 the US-spelling / SEO / region-migration day, 🔗 the social-handles day, ❓ the question-quality sweep and 🎚️ the adaptive-loop day, all moved 2026-08-22) live in [docs/handoff-archive.md](docs/handoff-archive.md) — not loaded at session start. `grep` it for a chapter or a decision. Moved there to keep this file inside its size budget: the two 2026-08-14 blocks (🧱 all six neon chapters onto GameShell · 🎛️ the band moving onto the 12–18 engine) on 2026-08-16, 🏗️ **The Empty Plot** (the last neon chapter + the 3D deletion + the explainer-film pipeline) on 2026-08-17, 📊 **The Loading Bay** (the first storybook chapter onto GameShell, and the mastery exit finally seen to fire) and 🚀 **the first launch-hardening day** (0 security advisories, crash screens, self-hosted fonts, the enforced CSP, legal plumbing, the launch runbook) both on 2026-08-17, and 🔒 **launch hardening round two** (the walkthrough dead end, the CSP gate that had been red for a day, `media-src` silently killing the recorded voice on mobile) on 2026-08-18, and 🕳️ **the plan-pointer P0** (`ChapterPortal` dropping `onComplete`, so no child's diagnostic plan advanced for three months — plus the one-emoji-to-crawlers SEO fix and the inert short-landscape gate) on 2026-08-18, and 🧭 **the 2026-08-18 architecture/security/devops day** (the layering refactor, V13–V20, the two vacuous scheduled sweeps) on 2026-08-19, and ⚡ **the performance pass** (57 MB of art revalidated on every request, every backdrop shipped as full-size PNG, every creature journey relaying out the document — plus the /game fit controller that turned out to be dead code) on 2026-08-19, and 🛡️ **the five-role red-team day** (the AR camera door that could strand a child for ever, the placement check dying on one Back press, and the regression I shipped inside my own fix) on 2026-08-20, and — moved 2026-08-24 — 🚚 **The Packing Shed + The Minibus Run** (the two 9–11 chapters that closed the multiplication/division content hole) and 🎯 **the diagnostic rebuild** (26–34% → 81–87%, the answer-surface fix and the first accuracy gate), and — moved 2026-08-23 — 📐 **the tester's-four-bugs / responsiveness-sweep / `useOnceGuard` day** (the StrictMode ref guard that froze ten chapters' demos in dev only, 683 → 2 sub-44px tap targets, and 20/20 storybook coverage), and — on 2026-08-21 — ⚡ **the font pass** (Gaegu preloading 90 subsets), 🔎 **the public-SEO pass**, 🏷️ **the AdaptiveLearn rename**, and 🏗️ **the move onto the company account** (whose still-open items were carried forward into the 🧭 block rather than archived with it)._
