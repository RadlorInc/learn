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

> 🚦 **2026-08-23 — "PRODUCTION MEIN JAANE KE LIYE TAIYYAR HAI?" — THE CODE IS; THE THINGS AROUND IT ARE NOT. ⚠️⚠️ THREE WORKFLOWS REPORT GREEN WHILE DOING NOTHING, THE ERROR SINK WRITES NOWHERE (PROVED WITH A LIVE PROBE), AND EIGHT CHAPTERS COULD NOT BE STARTED ON A LANDSCAPE PHONE.** `tsc` 0 · **1444/1444** · `next build` 0 · **218/218 e2e** vs a production build (7.2 min, foreground) · lint baseline unchanged. ✅ **SHIPPED — `main`@`6dd9224`, 3 commits; and it carried the NINE-commit backlog with it, so the 96–98% diagnostic and both new 9–11 chapters are LIVE at last.** `ci / verify` **green for the first time since 2026-08-20**; prod serving **sw v138**.
>
> **The asks:** *"Performance, scalability, responsive… deeply check karo"* → *"haan yeh fix kar do aur nightly failures triage karo"*.
>
> ## ⓪ ⚠️⚠️ THE THREE GREEN TICKS THAT DO NOTHING — THIS IS THE FINDING OF THE DAY
> Every one warns and `exit 0`, so the Actions list shows success:
> - **`backup.yml`** — `SUPABASE_ACCESS_TOKEN` / `BACKUP_PASSPHRASE` / `PROD_PROJECT_REF` unset →
>   *"Backup not configured"*, **8 seconds, green, zero bytes.** The free plan has no downloadable
>   backup and no PITR, so **there is still no recoverable copy of the children's data** — and now
>   the dashboard says there is, which is worse than the honest nothing it replaced.
> - **`ci.yml` → `rls-tests`** — `SUPABASE_DB_URL` unset → skipped. The suite that proves the
>   database denies a cross-tenant attacker, on a children's app, **has never run.**
> - **`deploy.yml` → migrate-staging/prod** — `if: vars.STAGING_PROJECT_REF != ''`, never set.
>
> ⚠️ **And `ci / verify` is genuinely RED on every push since 2026-08-20 while Vercel deploys anyway**
> (its git integration is independent of the workflow), so a red pipeline stopped nothing — it only
> meant a real failure could no longer be told from the flake. Cause found and fixed: `vitest.config.ts`
> set no `testTimeout`, and `questionQualitySweep`'s Q6 on `measurementUnits` measures **1959 ms here**
> against a ~3× slower runner. `testTimeout: 20_000`, **mutation-proved** — at 500 ms it fails with the
> exact CI error, at 20 s it passes.
>
> ## ① 🔴 PRODUCTION ERROR MONITORING IS DEAD, AND IT WAS PROVED RATHER THAN INFERRED
> POSTed a probe to the live `/api/report-error`: **`{"ok":true}` HTTP 200, and `error_events` stayed
> at 0 rows.** `SUPABASE_SERVICE_ROLE_KEY` is not set on Vercel, `MONITORING_INGEST_URL` is unset, and
> the route swallows its own errors by design — so every client crash goes only to Vercel runtime logs.
> **Vercel Web Analytics is also not enabled** (404). Launch day is blind. Blockers B5/B7 stand.
>
> ## ② 📱 EIGHT CHAPTERS COULD NOT BE STARTED ON A LANDSCAPE PHONE — SHIPPED, AND ON PROD NOW
> The GameShell **start card** renders its start button at **y 284–330 of 320** at 640×320 — ten pixels
> below the fold, stable across four seconds and every font-load state — in `conicSections`,
> `systemsMatrices`, `systemsOfEquations`, `quadraticAnalysis`, `expLogFunctions`, `unitCircleTrig`,
> `trigGraphsIdentities`, `statsInference`. First screen of the chapter, only forward control.
> **The start card is the one stage with no `FitSlot`, so its spacing IS its height:** two 18px gaps is
> 36px of pure spacing on a 320px screen. `gap: short ? 8 : 18` → **−10px becomes +10px in all eight**,
> with `justify-content: safe center` and `overflowY: auto` on the start stage as backstops. 1280×720
> untouched (165px clearance).
> ⚠️ **`all-chapters` reported all 70 clean because it grades a screen it never loaded** — it clicks the
> biggest control and measures 900 ms later, which on these routes lands on the **ExploreStep, one
> screen earlier**, which fits fine. New gate **`e2e/start-card.spec.ts`** names the screen, enters it
> deliberately and asserts it ARRIVED; wired into `nightly-e2e.yml` beside `all-chapters`.
> Mutation-proved: reverting the gap fails all eight with a readable message.
>
> ## ③ 🏃 THE OTHER HALF OF THE NIGHTLY WAS THE GATE BEING WRONG
> `counting` failed at 1280×720 and 640×320 on an unlabelled `BUTTON`. Measured: answer creatures
> **parked off-stage** at x −332..−78 and 1358..1612 with `transition: left 2.6s linear` — this file's
> own first rule, *nothing materialises, a creature arrives on its own legs*. They spawn ~4 s after
> entering, so a fast machine measured before the parade and the slow runner after: **the check was
> racing the chapter working correctly.** Vertical straddle still fails; horizontal now exempts only
> what declares itself in motion, and the message names its AXIS (the old one printed a y-range for a
> horizontal violation, which is what made two nights unreadable).
> ⚠️ **My first exemption also matched `all` — and `← Menu` computes `transition-property: all` with
> `duration: 0s`, i.e. every styled button.** Mutating the bound to `r.right > 1` then flagged NOTHING,
> which is what a check that has exempted the whole world looks like from outside: green. The test is
> the property AND a real duration. Caught by mutation, not by reading.
>
> ## ④ ✅ WHAT ACTUALLY HELD UP (measured, not assumed)
> `npm audit --omit=dev` **0 vulnerabilities** · security headers live on prod (CSP enforced, HSTS
> preload, `X-Frame-Options: DENY`, nosniff, Permissions-Policy) · image optimisation **583 KB PNG →
> 81 KB AVIF (7.2×)** · per-route brotli JS **259–285 KB**, chapters code-split · landing page load
> 1.17 s / 397 KB / 22 requests, `lang` set, 0 images without alt, 0 unlabelled buttons · **retention
> crons alive, 71 successful runs**, `learner_events` bounded at 90 days · `can_self_grant_access`
> inspected and sound (the advisor warning is a false positive) · rate limiting live on both public
> POST routes · sw bumped **v137 → v138**.
> ✅ **`radlor.com` now HAS mail DNS** — MX → Microsoft 365, SPF, DMARC `p=quarantine`. The standing
> *"no MX record"* warning was stale; `docs/launch-plan.md` B11 corrected in place.
>
> ## ⑤ 🐛⚠️⚠️ I BROKE THE 2026-08-21 `pgrep` RULE, THEN BROKE IT AGAIN INSIDE MY OWN FIX
> I waited on runs with `pgrep -f "playwright test e2e/all-chapters"` — **which matches the waiting
> shell's own command line.** Waiters kept each other alive; one reported 46 minutes elapsed for a run
> that had long finished, and I nearly diagnosed a hung suite from it.
> ⚠️ **The expensive half is what I did next.** I "fixed" it by polling
> `pgrep -f "chrome-headless-shell"` instead, reasoning that only the browser has that string — and
> then wrote that string into the waiter's own command line. Same deadlock, one layer along, and this
> time it burned **an hour**: six waiters watching each other, no browser and no playwright process
> alive, and the run that was gated behind them (`until … ; then re-verify`) **never started at all**.
> The founder spotted the pile of chips; `pgrep -fl` showed four "chrome-headless-shell" processes that
> were all zsh.
> **The rule is not "pick a better pattern" — ANY pattern you put in the waiting command is a pattern
> the waiter matches.** Poll the ARTEFACT (the output file), not a process; or run the thing in the
> foreground, which is what finally produced the number. And a waiter that never exits does not just
> waste time: it silently swallows whatever was chained after it.
>
> ## ⑥ 🚀 SHIPPED, AND VERIFIED ON THE LIVE SITE RATHER THAN ASSUMED
> Pushed `9cc7787..6dd9224` — **9 commits**, six of which had been sitting on `main` for two days.
> The Deploy workflow came back **`ci / verify: success`**, which is the real proof of the
> `testTimeout` fix: it could only ever be proven on the slow runner that was failing.
>
> | checked on `https://adaptivelearn.radlor.com` | |
> |---|---|
> | `sw.js` VERSION | **v138** — the launch runbook's own "did it actually land" check |
> | `Switch it on →` @ 640×320 | **264–310 of 320, +10px clear** (was 284–330, −10px), `safe center` applied |
> | The Packing Shed / The Minibus Run | `200` at `?c=timesTables` and `?c=division` |
> | the diagnostic door | *"FREE · ABOUT 10 MINUTES · NO ACCOUNT NEEDED"* — the rebuild is live |
> | console errors on `/diagnostic` | 0 |
>
> ⚠️ **`ci / rls-tests` also reported `success` in that same run and executed nothing** — see ⓪. The
> pipeline being green is now evidence about `verify` and about nothing else.
>
> ## ▶ OPEN — the honest launch verdict
> 1. ✅ ~~Not committed / production behind~~ — **DONE.** Prod is `6dd9224` and verified (§⑥).
>    ⏭️ **The next thing to look at is TONIGHT'S NIGHTLY**, which now runs `start-card` beside
>    `all-chapters`. Green tomorrow = the two-night red is genuinely closed; red = the gate triage
>    in §③ missed something and the traces are on the run.
> 2. 🔴 **NO BACKUPS.** Three secrets in GitHub settings turns `backup.yml` real. Highest-value hour.
> 3. 🔴 **BLIND IN PRODUCTION.** `SUPABASE_SERVICE_ROLE_KEY` on Vercel + Web Analytics on.
> 4. 🔴 **`DRAFT = true`** — privacy policy and ToS are still placeholders (B1/B2). Hard blocker for
>    marketing math to under-13s.
> 5. **`SUPABASE_DB_URL`** so the RLS suite actually runs.
> 6. **Supabase free plan** — pauses on inactivity, 500 MB cap, no PITR, DB in Sydney while functions
>    run in Virginia. Pro before real traffic.
> 7. **`getInsightsRawRows` has no `.limit()`** — PostgREST's default max-rows would silently truncate
>    rather than error, so the founder dashboard would quietly report wrong numbers at scale. Fallback
>    path only, low severity.
> 8. **The diagnostic writes its session row only on completion** — the probe is now 20–50 questions
>    and abandonment is invisible. Still the most important unmeasured number.
> 9. ⚠️ Dependabot has a PR bumping **TypeScript 7, eslint 10, jsdom 30** in one batch. Do not merge
>    as a batch.
> 10. Everything from the blocks below still stands.

> 🔬 **2026-08-22 (fifth pass) — "MEKO YEH TENSION HAI KI YEH SAHI KAAM KAR RAHA HAI YAA NAII." SO THE ENGINE WAS DRIVEN AGAINST SEVEN DIFFERENT CHILDREN, FIVE OF WHICH IT WAS NOT DESIGNED FOR. IT DEGRADES GRACEFULLY — AND TWO REAL WEAKNESSES FELL OUT.** No code changed; this pass is measurement and one honest admission.
>
> **The asks:** *"yeh hata de kya pura? kyuki yeh rule based hai aur meko kuch samjh naii rha hai"* →
> *"meko wohi tension hai ki yeh sahi kaam kar raha yaa naii… iska hi darr hai"*.
>
> ## ⓪ ⚠️⚠️ THE ADMISSION THAT SHOULD HAVE COME FIRST: I WAS MARKING MY OWN HOMEWORK
> Every accuracy number reported all day came from a simulation **I wrote**, against a learner model
> **I invented**, testing an engine **I built**. The founder's unease was the correct response to
> that, and no further table from the same source would have answered it. ⚠️ It is the same shape as
> this repo's own standing rule — *the instrument was wrong five times before the app was wrong
> three* — one level up: **the instrument can also be wrong in your FAVOUR**, and a kind model is
> harder to notice than a broken one.
>
> ## ① 🧒 SEVEN CHILDREN, FIVE OF THEM NOT DESIGNED FOR
> | child | exact gap | within ONE step | **"no gap" when there IS one** |
> |---|---|---|---|
> | **A** the model I designed for (10% slip) | 96–99% | 97–99% | 0–3% |
> | **G** always guesses, never blank | 91–95% | 96–98% | 0–2% |
> | **C** PATCHY — the graph's own assumption is violated | 76–80% | 82–88% | 0–1% |
> | **B** careless, 25% slip | 68–80% | 77–88% | **0%** |
> | **E** tires as the probe goes on | 54–86% | 66–92% | **0%** |
> | **D** the gap is HALF-learned, not absent | 41–46% | 72–92% | 7–27% |
> | **F** TWO separate gaps | names one 98–100% · both 43–91% | — | **0%** |
>
> ⚠️ **THE LINE THAT MATTERS IS THE LAST COLUMN.** In every model, "there is a gap and we said there
> isn't" is **0–3%**. When it is wrong it names a NEIGHBOURING skill, so the child still starts
> beside their gap and climbs into it. That is the failure mode you want, and it survives models
> built to break it.
> ⚠️ **C is the reassuring one**: it makes skills independent — i.e. the prerequisite graph is simply
> WRONG for that child — and the answer is still right or adjacent 82–88% of the time. So a graph
> with some bad edges does not collapse the product, which is exactly the risk the un-validated
> graph carries.
>
> ## ② ⚠️⚠️ TWO REAL WEAKNESSES, AND ONE OF THEM REVERSES THIS MORNING'S TRADE
> **Fatigue at 17–18: 54%.** Their probe is the longest (58 questions), so a rising slip rate bites
> hardest exactly where there is most to bite. **The 96% figure assumes a child who does not tire —
> so in the real world a SHORTER probe may be MORE accurate than a longer one.** That is not a UX
> objection to length, it is an accuracy objection, and it points the other way from the decision
> taken this morning. Worth measuring before defending the current setting.
> **A half-learned gap: 41% exact** (72–92% within one step). Arguably correct behaviour — if a child
> half-has the skill, "is this the gap" is a genuinely blurred question — but it is the case a real
> tester is most likely to bring, so know it before they do.
>
> ## ③ ⚠️ A MEASUREMENT OF MINE WAS UNFAIR AND WAS REDONE
> The two-gap child first scored 55–62%, which read as a weakness. It was the METRIC: it counted
> only `rootGap` while `diagnose()` also returns `secondGap`, so reporting the child's OTHER real gap
> was scored as a miss. Measured properly: **names at least one real gap 98–100%**, both 43–91%,
> route covers both 44–93%. Same family as the tautology rules in chapter-craft — *a check that
> compares a value with itself*, here a check that ignores half the output it is judging.
>
> ## ④ 🧭 WHY "IT IS RULE-BASED" IS NOT THE PROBLEM (founder asked whether to delete it)
> With 14 sessions on production, an ML/IRT placement model is not an option — those need thousands
> of learners. Every adaptive product starts from a hand-built graph. And rule-based is what made the
> whole of today possible: you can ask a graph *"which of your 130 assumptions actually matters"* and
> get an answer. You cannot ask that of a model.
> ⚠️ **The real complaint was legibility, not architecture.** Nothing in the app shows WHY a gap was
> named — not to the parent, not to the founder. A traced example (34 questions, each one's verdict,
> and why Milo descended where he did) made it obvious in one read. **That trace belongs in the
> report**, and it is only possible BECAUSE the system is rule-based.
>
> ## ▶ OPEN — in the order that matters
> 1. ✅ ~~Nothing is pushed~~ — **SHIPPED 2026-08-23** (`6dd9224`). Production serves the 96–98%
>    probe. Everything else in this list still stands.
> 2. **An ABANDONED probe leaves NO trace** — verified on prod: 14 session rows, 0 incomplete,
>    because a row is only written on completion. The probe just went from ~10 to 20–50 questions and
>    **we cannot see whether anyone is giving up.** Write the session row at START and update on
>    finish; without it the next month is blind on the one number that now matters most.
> 3. **The "how Milo worked it out" trace, in the report** (§④). Answers the founder's own question
>    permanently and is the strongest trust artefact a rule-based system has.
> 4. **One REAL child with a known weakness.** The only evidence that is not mine. 10 minutes.
> 5. **The teacher's hour on twelve edges** ([docs/skill-graph-audit.md](docs/skill-graph-audit.md) §1).
> 6. ⚠️ **The report promises "if this gap hasn't measurably closed, you don't pay" on an
>    un-validated graph** — and `skillGraph.ts` itself says not to ship the guarantee before that.
>    Consider softening to "we'll re-check and adjust" until the twelve edges are red-penned; a soft
>    promise can be hardened later, the reverse cannot.
> 7. 🔴 **STILL NO BACKUP OF THE CHILDREN'S DATA** — carried for many sessions, and the data is worth
>    more now than it was.

> 🕸️ **2026-08-22 (fourth pass) — THE ENGINE IS 96–98%, SO THE BOTTLENECK IS NOW THE GRAPH — AND THE GRAPH IS STILL v0.9 DRAFT WITH 130 UNVALIDATED EDGES. AUDITED: TWELVE OF THEM DECIDE A GAP, TWENTY-ONE DECIDE NOTHING.** `tsc` 0 · **1444/1444** (+7, 1 skipped by design) · `next build` 0. ✅ SHIPPED 2026-08-23 in `6dd9224`.
>
> **The ask:** *"A karo"* — a self-audit of the skill graph, to cut the teacher's checklist down.
>
> ## ⓪ THE INSTRUMENT: REMOVE AN EDGE, COUNT THE DIAGNOSES THAT CHANGE
> Ranking edges by MY OPINION of the pedagogy would have been worth very little. Instead every one
> of the 130 edges was deleted in turn and all **201 plantable gaps** across the five child bands
> re-run with a PERFECT answerer (which isolates the graph's contribution from the items' noise).
> Two numbers per edge: how many children would be told a **different gap**, and how many the same
> gap with a **different route**. → [docs/skill-graph-audit.md](docs/skill-graph-audit.md).
>
> | | |
> |---|---|
> | edges that change a GAP if wrong | **12** (top: `p.addTo100 ← e.addWithin10` at 13 of 201) |
> | edges that change only the ROUTE | 97 |
> | edges that change **nothing at all** | **21** |
>
> ## ① ⚠️⚠️ THE CHECKLIST'S OWN "HIGH-RISK CLAIM" IS 0 ROOTS
> `docs/skill-graph-validation.md` marks `i.fractionEquiv ← i.multFacts` as its one flagged
> high-risk claim — *does equivalent fractions truly require fact fluency?* Measured: **0 roots, 16
> routes.** If it is wrong, not one child is told the wrong gap. It is a real question and it
> belongs in pass two. **The instinct about which claims are RISKY and the measurement of which are
> COSTLY do not agree**, which is the whole argument for ranking this way. The checklist now opens
> with a pointer to the ranking so nobody starts at 130 again.
>
> ## ② 🔍 WHAT I THINK IS ACTUALLY WRONG — opinion, flagged as opinion
> **The top one: `p.subTo100 ← p.addTo100`.** The graph says subtracting within 100 requires
> *adding* within 100 — they are siblings, not a chain. And **`e.subWithin10` exists as a skill and
> is nobody's prerequisite**: written down, then never wired to the thing it obviously underpins.
> That is the shape of an omission. Suggested `p.subTo100 ← [p.placeValue2, e.subWithin10]`, and the
> edge carries **12 of 201 diagnoses — the second-highest in the graph**.
> Four more in §3 of the doc: `m.exponentsRoots ← i.factors` (do square roots need primes?),
> `m.coordinatePlane ← e.numberOrder` (a 12–14 skill reaching back to Pre-K, past five bands),
> `i.areaPerimeter ← p.shapes2d3d` (rectangle area needs the 2D half, not the 3D one), and
> **`e.colors` — the one non-mathematics node in a mathematics prerequisite graph**, inert in every
> direction: no prereqs, no dependents, no item, no probe reaches it.
>
> ## ③ ⚠️⚠️ WHAT THIS METHOD CANNOT DO, STATED LOUDLY
> **It cannot see a MISSING edge.** It tests only the claims that are written down — and a graph is
> built by writing down what somebody thought of, so the omissions are by definition the things
> nobody thought of. That is the half a teacher still has to do, and §4.3 of the doc points it at
> the **20 nodes that rest on a SINGLE claim**, where "is this the only thing a stuck child could be
> missing?" is most likely to be answered no.
>
> ## ④ WHAT IS GATED NOW — `src/__tests__/skillGraphAudit.test.ts`
> The structural half runs every time: acyclic, no dangling id, no prerequisite pointing UP a band,
> **exactly one inert node** (so a second cannot drift in), the band skips are the two known ones,
> the load-bearing order is the one the doc names, and the suspected missing subtraction edge is
> pinned so FIXING it is a deliberate act. The expensive ranking is behind a flag —
> `GRAPH_SENSITIVITY=1 npx vitest run src/__tests__/skillGraphAudit.test.ts` — because it is a
> property of the WHOLE graph and the numbers move when the shape does.
>
> ## ▶ OPEN
> 1. ✅ ~~Not committed~~ — **SHIPPED 2026-08-23** (`6dd9224`).
> 2. **A teacher still has to red-pen twelve edges.** That is the hour that protects the guarantee,
>    and nothing in the engine can substitute for it. Until then the 96–98% means *"the engine finds
>    what the graph says"*, not *"the engine finds the child's real gap"*.
> 3. Everything from the blocks below still stands.

> 🎯 **2026-08-22 (third pass) — THE GAP FINDER IS NOW **96–98% EXACT** AND MISSES A REAL GAP **0%** OF THE TIME. ⚠️⚠️ AND THE FIRST NUMBER I REPORTED THAT MORNING (81–87%) WAS FLATTERED BY MY OWN TOO-KIND GUESS MODEL — THE HONEST BASELINE WAS 73–75%.** `tsc` 0 · **1437/1437** · `next build` 0 · sw **v136 → v137**. ✅ SHIPPED 2026-08-23 in `6dd9224`.
>
> **The ask:** *"jab tak proper gap find karne waala system bane… rukne ki zaroorat naii hai… bas high accuracy gap find karne waala system bane yeh meko chahiye"*.
>
> | | morning | now |
> |---|---|---|
> | names the EXACT root gap | 26–34% → 81–87%* | **96–98%** |
> | tells a gapped child they are on track | 10–38% | **0%** |
> | root one step too SHALLOW (plan starts above the gap) | 12–19%* | **1–2%** |
> | root one step too DEEP (starts early, climbs) | 5–14% | **1–2%** |
> | on-grade child wrongly told "a band below" | 6–9% | **0–2%** |
> | questions, child WITH a gap (median) | 15–27 | **29–50** |
> | questions, child with NO gap (median) | 9–17 | **20–36** |
>
> ## ⓪ ⚠️⚠️ THE INSTRUMENT WAS WRONG BEFORE THE PRODUCT WAS — AGAIN, AND IN MY FAVOUR THIS TIME
> The morning's gate modelled a child who does not have a skill as passing a TYPED item 3% of the
> time, flat. That is not a measurement, it is a hope: **a typed answer is only as unguessable as
> its answer space is wide.** Deriving the rate from what each generator can actually produce
> dropped the honest figure to **73–75%**, and the same measurement turned up the sharpest bug of
> the day: **`i.dataGraphs` shuffled a fixed `[2,4,6,9]`, so "how many more" was ALWAYS 7** — one
> possible answer across every draw the generator could make. The bars varied, so the item looked
> varied. This repo's own rule, met again from the other side: *the instrument was wrong five times
> before the app was wrong three* — and a kind instrument is as dangerous as a broken one.
>
> ## ① 🎚️ THE RULE: KEEP ASKING UNTIL ONE ANSWER **LEADS** — BY TWO TO PASS, BY **THREE** TO FAIL
> Not a fixed count. Three designs were built and measured on the way, and each sounds right:
>
> | | exact | told "on track" with a real gap | too shallow | on-grade questions |
> |---|---|---|---|---|
> | confirm FAILS only (morning) | 73–75% | 3–9% | **12–19%** | 9–17 |
> | + confirm passes inside a DESCENT | 84–87% | 4–9% | 2–5% | 17–25 |
> | + confirm passes on SPINE entries | 86–91% | 0–7% | 1–5% | 17–25 |
> | **+ confirm every answer, asymmetric lead** | **96–98%** | **0%** | **1–2%** | 20–36 |
>
> ⚠️ **The asymmetry is the part that is not obvious.** A symmetric "lead of two" fixed the lucky
> pass and created its mirror — with a 10% slip over thirty questions a double-slip is almost
> routine, and **8% of ON-GRADE 12–14 children were told their gap sat a whole band below them.** A
> pass and a fail do not cost the same thing: a pass moves on, a fail sends the search downward and
> tells a family their child is behind. One more agreeing miss takes that to ~0.1% per skill and
> costs one extra item on a skill that really is broken — which a broken skill supplies immediately.
>
> ## ② 🔢 AND THE ANSWER SPACES WERE WIDENED WHERE THEY WERE NARROW ENOUGH TO GUESS
> Measured per generator, then fixed: `i.dataGraphs` (1 answer!), `p.fractionsIntro` 3 → ~30,
> `e.shapes2d` 3 → 5, `i.measureUnits` 5 → five different conversions, plus a dozen more.
> **Four remaining `pick` items became typed**, because a choice is the only surface left that can
> be guessed at:
> - `i.anglesSymmetry` "acute/right/obtuse" (33%!) → *how many degrees away from a square corner* —
>   ⚠️ and the 90 is deliberately NOT stated, or the item stops being about angles and becomes a
>   subtraction;
> - `m.coordinatePlane` "which quadrant" (25%) → read the point's x or y, which also exercises the
>   sign, the half children actually get wrong;
> - `a.expressions` → type the coefficient; `a.factoring` → type the smaller root.
>
> Only three picks remain and all are honestly categorical: `e.numeralRecog` (naming the glyph IS
> the skill), `e.patterns`, `c.unitCircleTrig` (its values are surds).
>
> ## ③ ⚠️ THE COPY WAS A LIE THE MOMENT THE PROBE GOT LONGER, AND THAT IS PART OF THE CHANGE
> The intro promised *"a few quick questions"* and the door said *"2 minutes"* — true of a coin flip,
> false of a 20–50 question placement check. **Copy that undersells the length is worse than copy
> that oversells it**: a parent promised two minutes abandons at question fifteen and the diagnosis
> is thrown away. Now *"About ten minutes"*, and the briefing says out loud that Milo asks a few
> extra whenever he is not sure yet — which is exactly what the engine does.
>
> ## ④ WHAT IT COSTS, STATED PLAINLY
> A child with a gap answers **29–50** questions (17–18 median 50, worst case 70). A child with no
> gap still answers **20–36**, because every answer is confirmed. Caps are set to the measured p99
> per band — ⚠️ a cap between p95 and p99 does not shorten anything, it TRUNCATES the one child in a
> hundred who needed the room, and a truncated search reports whatever it had reached.
>
> ## ▶ OPEN
> 1. ✅ ~~Not committed~~ — **SHIPPED 2026-08-23** (`6dd9224`). `tsc` 0 · 1437/1437 · `next build` 0 · lint clean on every changed file ·
>    driven end to end (full probe → report, 0 console errors).
> 2. ⚠️ **This is now a placement TEST, not a check.** 20–36 questions for a child with nothing wrong
>    is the founder's explicit trade (accuracy over length, stated twice) and it is the thing most
>    worth watching in real use: if completion drops, the lever is the sweep (3–9 questions) or the
>    pass-confirmation on sweep leaves, and both are one line.
> 3. **The 3–5 band is untouched** — its items are parent-observed, so "not yet" is an observation
>    rather than a miss and nothing is re-asked.
> 4. Everything from the blocks below still stands.

> 🚚 **2026-08-22 (second pass) — THE TWO MISSING CHAPTERS ARE BUILT. `i.multFacts` — THE MOST LOAD-BEARING NODE IN THE WHOLE 3–18 GRAPH — HAD NO CHAPTER FOR NINE DAYS, AND ~10% OF DIAGNOSED 9–11 CHILDREN ROOTED ON IT. THE CONTENT HOLE IS NOW 0% IN EVERY BAND.** `tsc` 0 · **1436/1436** (+59) · `next build` 0 · lint clean on all new files · sw **v134 → v135**. ✅ SHIPPED 2026-08-23 in `6dd9224`.
>
> **The ask:** *"Times Tables + Division chapter ka design bhi same waise hi rakho jaise decimal chapter aur jaise 12-18 age band ke chapters ka hai… daily real world examples"* → then *"dono worlds theek hain, (i) karo — banana shuru karo"*.
>
> | | |
> |---|---|
> | `timesTables` | **THE PACKING SHED** · `story/packing.ts` + `teen/games/PackingShedGame.tsx` |
> | `division` | **THE MINIBUS RUN** · `story/busRun.ts` + `teen/games/BusRunGame.tsx` |
>
> Both are Coin Tray's shape exactly: a data file on `GameShell`, `band: '9-11'`, all the maths and
> every word in a pure `story/<module>.ts`, ten-round loop, adaptive tiers, re-teach, mastery exit,
> `coverage` over three readings. Registered in `chapters.ts` + `registry.tsx`; previews are
> `/teen-preview?c=timesTables` and `?c=division`.
>
> ## ⓪ 📦 THE PACKING SHED — THE CRATES ARE CLOSED, AND THAT IS THE WHOLE CHAPTER
> An order arrives: *"Four crates. Five peaches in each."* The crates are **shut** — fact fluency
> means knowing 7 × 8 without counting, so an array a child can count is the scene answering the
> question. They type the total on the shipping label, and THEN the crates tip out and the pallet
> becomes the CHECK. The Empty Plot's order, for the Empty Plot's reason.
> **One chapter carries two graph nodes**, which is the curriculum's own split: L1 the skip-count
> families (×2/×5/×10), L2 the hard middle (6–9 × 6–9) where fluency actually lives, **L3 2-digit ×
> 1-digit** — so `i.multFacts` AND `i.multMultiDigit` both route here.
> ⚠️ **Answers are TYPED, not picked.** `GameConfig.answerPad` offers chips, and a times-table fact
> is precisely the question a child wins by ELIMINATING — the fault the diagnostic was rebuilt this
> same day to remove. The label carries its own ten digits, the way the tray does.
> ⚠️ **Send is live the moment there is something to send.** Answers run 6 → 116, so a fixed-width
> commit gate would be FitOut's dead button by construction.
>
> ## ① 🚌 THE MINIBUS RUN — THE REMAINDER HAS SOMEWHERE PHYSICAL TO BE
> The class is going on a trip; every bus has the same seats. Three readings: **share** them out
> (how many each), **group** them (how many buses fill), and the one the chapter exists for —
> **who is left standing on the pavement**. That is the lesson worth keeping from the deleted Supply
> Run, which chapter-craft still records: *"a remainder with somewhere physical to be"*.
> ⚠️⚠️ **AND THE WORLD'S RULE WOULD HAVE CONTRADICTED THE MATHS IF THE OBVIOUS QUESTION HAD BEEN
> ASKED.** *"25 children, buses seat 6 — how many buses?"* has two honest answers: the division says
> 4 r 1 and any real teacher orders **5**. Asking for the quotient there teaches the opposite of what
> the world shows, on every remainder round. So the scored question is the unambiguous physical one
> (how many are still waiting) and *"so we need one more bus"* is the CONSEQUENCE in the reveal —
> the same call The Height Bar makes with its gate.
> ⚠️ **This is the AR chapter and The Packing Shed is not, and the reason is arithmetic:** a hand
> reads 0–10. Every Minibus answer is a count inside that, so camera and taps express exactly the
> same set of questions; The Packing Shed's answers reach the hundreds, so wiring a hand there would
> be the one-instrument-two-inputs hole. **The generator is bounded to keep that true**, and it is
> gated.
>
> ## ② ⚠️⚠️ TWO REAL DEFECTS, BOTH FOUND BY DRIVING IT, NEITHER VISIBLE TO ANY GATE
> **(a) The instrument was a hot/cold ORACLE, and the wrong version is the one that sounds like good
> teaching.** The buses loaded LIVE from whatever number was showing — *a wrong action allowed and
> visible*, which is a rule this repo already has — so the pavement read "still waiting" until the
> count happened to be right and then flipped to **"pavement clear"**. Tap 1, 2, 3, watch the label,
> commit; the child divides nothing. Fixed by the ORDER, not by removing the feedback: while
> choosing, the yard shows their number as a SETTING (seats reserved, nobody moved) and the loading
> happens ON the commit. ⚠️ The tell was one WORD — "clear" versus "waiting" — not a picture.
> **(b) The bus was drawn with its seats on every round — and on a `sharing` round the seat count IS
> the answer.** Count the empty seats in one bus and read it off. Now the capacity is drawn only
> where the ticket already gave it; where it is the question the bus is an open box.
> Both generalised into `chapter-craft.md` §1.
>
> ## ③ 🔬 WHAT THE GATES CAUGHT BEFORE THE SCREEN DID (55 new module tests, written first)
> - **`6 crates of 12`** — the taught method is "split into tens and ones", so the child's own
>   partial product `6 × 2` is **12**, the crate size printed an inch away. The Height Bar's fault
>   exactly: not a hidden answer but a MANUFACTURED wrong one. Fixed in the generator.
> - **`10 buses of 5`, guess 8** — the verdict read *"10 children still on the pavement"*, and 10 is
>   the answer. chapter-craft: *"a number in a verdict can be the answer by coincidence — check the
>   numbers a template can produce, not just the words in it."* The verdict states the DIRECTION now.
> - Square runs and square pallets (`buses === seats`, `crates === per`) refused at the draw — The
>   Mission Brief shipped that on 16% of its division rounds.
> - Class sizes bounded so the pavement is children rather than a pile.
> - ⚠️ And a prompt that read **"nine crates. Two lemons in each."** — a sentence opening in lower
>   case, on the chalkboard, in every `total` and `multi` round. Caught on a screenshot, then pinned.
>
> ## ④ 🎯 WHAT IT DOES TO THE DIAGNOSTIC
> `i.multFacts`, `i.multMultiDigit` and `i.division` now carry real chapters, so the `remediation`
> stand-in field added this morning is **deleted again the same day** — it existed to point a
> chapter-less skill at the nearest thing we owned, and nothing is chapter-less any more. What holds
> the line instead is the gate. Measured after: **0% of diagnosed roots land on a
> skill with no chapter, in every band** (was 5–10%). And the play-data revision woke up — the
> `activePlan` gate had pinned `deeperChapter('factorsMultiples') === null` with the note *"pinned so
> the day a chapter comes back, this starts returning one and somebody notices"*. It now returns
> `timesTables`. **The pin fired exactly as written.**
>
> ## ▶ OPEN
> 1. ✅ ~~Nothing is committed~~ — **SHIPPED 2026-08-23** (`6dd9224`), with the diagnostic work of the same day. Driven end to end at
>    1280×720 and 640×320: start card → walkthrough → guided → scored round → correct answer, on both
>    chapters. 0 console errors, 0 offscreen, 0 unreachable controls, no scroll.
> 2. ⚠️ **At 640×320 every control scales to ~28px**, under the 44px floor — `FitSlot` only ever
>    shrinks. **Measured against the shipped Coin Tray at the same frame: 29×29.** So this is a
>    band-wide property, not something these two chapters introduced — but it is the whole band, and
>    it is not written down anywhere as accepted.
> 3. **No backdrops were generated, deliberately** — the 9–11 GameShell chapters use `motif` (one
>    huge faint emoji) rather than a scene PNG, exactly as The Coin Tray does. If the band ever moves
>    to painted scenes, these two need two crops each like the 12–14 chapters.
> 4. **AR is still never driven with a REAL HAND** — The Minibus Run adds a second chapter to that
>    gap rather than closing it.
> 5. Everything from the blocks below still stands.

> 🎯 **2026-08-22 — THE DIAGNOSTIC, RETHOUGHT AND THEN HARDENED. ⚠️⚠️ IT NAMED THE RIGHT ROOT GAP **26–34%** OF THE TIME AND TOLD **10–38%** OF GAPPED CHILDREN THEY WERE ON TRACK — AND ELEVEN GREEN ENGINE TESTS COULD NOT SEE IT, BECAUSE EVERY ONE DRIVES A PERFECT ORACLE. NOW **81–87% / 1–4%**, TEN UNDIAGNOSABLE CHAPTERS ARE REACHABLE, AND THE WEEK-6 GUARANTEE LOOP FIRES FOR THE FIRST TIME.** `tsc` 0 · **1377/1377** (+17) · `next build` 0 · sw **v133 → v134**. ✅ SHIPPED 2026-08-23 in `6dd9224`.
>
> **The asks:** *"daignostic … dekho ki effective hai kya naii hai"* → *"pura properly rethink karo taaki zyada se zyada baccho ka gap mile aur hamare joh bhi chapters hai unki help se ek personalised route de"* → *"yeh problems ka solution find karo aur apply karo … high accuracy pe hona chahiye"*.
>
> | | before | after |
> |---|---|---|
> | names the EXACT root gap | **26–34%** | **81–87%** |
> | tells a gapped child they are on track | **10–38%** | **1–6%** |
> | says "a band below" to an ON-GRADE child | — | **≤ 4%** |
> | leaf-chapter gap reaches the route | **impossible** | **83–95%** |
> | route starts at the gap when the gap owns no chapter | **never** | always |
> | on-grade probe length (median) | — | 9–16 |
>
> ## ⓪ ⚠️⚠️ THE ANSWER SURFACE WAS THE WHOLE STORY, AND THE ENGINE WAS INNOCENT
> Measured by simulating learners with a PLANTED gap, answering with each item's REAL guess rate and
> a 10% slip. **Driven with clean items the same descent resolves the exact root 90–98%** — which is
> what stopped a rewrite of the search. Three multiplying causes, all outside it:
> - **one 4-choice MCQ per skill = 25% lucky pass** (50% on four of them — `e.compare`, `p.compare100`,
>   `i.bigNumbers`, `i.decimals` — two of which are band ENTRIES);
> - ⚠️ **the fail-confirmation STRIKE doubles it.** A first miss re-offers the skill, so a broken child
>   gets TWO shots at the guess: `p + (1−p)p` → 25% becomes **44%**, 50% becomes **75%**. The guard was
>   written for false FAILS and its cost on false PASSES was never priced;
> - **a lucky pass on an ENTRY closes that whole branch for ever** — the gap disappears entirely and
>   the report says *"At or above grade level"* with an empty plan.
>
> **Fix: where the answer is a NUMBER the child types it** (`input:'num'`, guess ≈ 0), a fraction gets
> two boxes, and `'pick'` survives only where the answer space is genuinely categorical — widened 4→6.
> ⚠️ **The pad's extra keys (`−`, `.`) are declared PER QUESTION TYPE, never derived from the answer** —
> deriving them prints the answer's sign before the child touches anything.
>
> ## ① 🕳️ COVERAGE: TEN BUILT CHAPTERS THE PROBE COULD NEVER REACH — AND THEN NINE MORE ONE BAND DOWN
> A probe that only walks DOWN from entries cannot see a LEAF. **14 skills were unreachable by ANY
> band**, so a rounding, time, money or word-problem gap was structurally undiagnosable and a 6–8
> child's whole check covered 11 of 74 skills. `PROBE_ENTRY` is now `PROBE_SPINE` (descend on fail →
> the root gap) + `PROBE_SWEEP` (leaf chapters → route entries).
> ⚠️ **Then the founder's own case: a 9–11 child who cannot tell the time.** `p.time` is a 6–8 leaf, so
> nothing in 9–11 goes near it — each band misses **9–13** lower-band chapters this way. Sweeping all
> of them would ask a seventeen-year-old *"which is more, 3 or 7"*. The split that works: a
> **standalone topic** (money, time, story problems, rounding, units, angles, charts) can be missing on
> its own and nothing else will ever reveal it — it must be asked; a **foundational** skill (compare,
> number order) sits under everything, so any failure above sends the descent through it anyway. One
> band down only; two bands down, the descent is the honest instrument.
>
> ## ② ✂️ THE DESCENT BISECTS NOW — SHORTER *AND* MORE ACCURATE FROM ONE CHANGE
> Instrumented where the questions actually go: **17–18 spent 11.3 of 20.2 on the descent**, one
> question per LEVEL down a nine-level chain, each an extra chance for a slip to plant a false deeper
> root. Halving the candidate set instead took that band 72% → **81%** and 12–14 to **84%**.
> ⚠️⚠️ **Pure bisection was WRONG and the measurement caught it: a grade-level 17–18 child went from 9
> questions to 22.** With nothing broken below, the cheap question is *"do this skill's own direct
> prerequisites hold?"* — three probes and it is over — while a bisector prunes a 40-node closure a
> sub-tree at a time. So a branch opens in direct-prerequisite mode and switches to bisecting the
> moment something under it fails, which is exactly when the long chains appear.
> ⚠️ Two more free questions saved, both from the graph rather than a cap: an entry whose prerequisite
> has already FAILED is not asked (it is arithmetic, not a question) and an entry that is a
> PREREQUISITE of something already PASSED is not asked either.
>
> ## ③ 🗺️ THE ROUTE IS DERIVED FROM THE GAP, NOT FROM WHICH QUESTIONS GOT ASKED
> `planSkills = [...s.failed]` was a fair approximation while the descent walked every level and
> became wrong the instant it bisected — a bisecting search **skips levels on purpose**, and those
> skipped chapters are exactly the ones between the child's gap and their grade. It is now the failed
> set PLUS every skill on a chain from a root up to a failed entry, bounded by that chain (not by
> `blockedBy(root)`, which for a deep root is most of the graph). Median route: 2 / 4 / 6 / 9 / 16
> chapters by band.
> ⚠️ **And the report then contradicted itself on one screen.** A learner rooting four bands down drew
> a **40-step** route printed two inches under *"Caught now, it's weeks of work, not years"* — which is
> true of a short route and a lie about a long one. The plan card now shows the first five with
> "+N more, one step at a time", and the timeline sentence is chosen by the route's actual length.
>
> ## ④ 🔍 THE WEEK-6 GUARANTEE LOOP HAD NEVER FIRED, AND IT WAS NOT THE LOGIC
> Prod: **0 rechecks, ever** — and querying the sessions, **five children are 45–50 days past their
> check-up and genuinely due one**, so it was not "nothing is ripe yet". `getCheckupStatus` is correct;
> the nudge lived only on the **parent dashboard**, for whichever learner happened to be selected. It
> now renders on `/menu`, the screen the child opens every session. Driven end to end (`Check 1 of 3`
> → typed answers → result).
> ⚠️ The loop is the promise, the retention signal AND the efficacy dataset — one mechanism doing three
> jobs, and it was reachable only by a parent visiting a screen they have no reason to open.
>
> ## ⑤ 🔬 THE BUG FOUND ALONG THE WAY: THE "PER-CHILD REPRODUCIBLE PROBE" WAS NOT
> 14 generators used `pick` from `@/core/rand` — which is `Math.random`, and **that file's own header
> says reproducible cases must not use it.** `resolve()` rebuilds the current question from the seed on
> a mid-probe resume, so those items came back DIFFERENT. A determinism test existed and passed: it
> checked ONE skill, which happens not to use `pick`. Now a seeded `pk`, swept across all 74.
>
> ## ⑥ 🚧 THE GATE IS THE REAL ARTEFACT — `src/__tests__/diagnosticAccuracy.test.ts`
> ⚠️⚠️ **Eleven engine tests were green through all of this because every one drives a PERFECT ORACLE**
> ("knows it ⇒ correct"). A real child guesses and slips; nothing in 1360 tests modelled either, so the
> product's central claim was unmeasured. The gate plants a gap, answers with the real per-item guess
> rate, and asserts exact-root rate, missed-gap rate, false-alarm rate **split into any-gap vs a-gap-in-
> a-lower-band** (only the second is damaging), leaf coverage, route-starts-at-the-gap, route LENGTH,
> probe LENGTH (accuracy is trivially buyable with more questions), and the exact list of chapterless
> skills. Seeded, so it is not a coin flip.
> ⚠️ `diagVisual`'s *"the tallest bar must be the answer"* changed with its question: that was right
> while `i.dataGraphs` asked *"which has the most"* — answerable by LOOKING — and it now asks *"how many
> more X than Y"*. The surviving invariant is that the picture supports the arithmetic.
>
> ## ▶ OPEN
> 1. ✅ ~~Nothing is committed~~ — **SHIPPED 2026-08-23** (`6dd9224`). `tsc` 0 · 1377/1377 · `next build` 0 · lint baseline unchanged ·
>    driven on screen at 1280×720 and 640×320 (number pad, fraction pad, full probe → report, and the
>    re-check flow). 0 offscreen, 0 controls under 44px, 0 console errors.
> 2. ⚠️⚠️ **THE ONE THING THE ENGINE CANNOT FIX: ~10% of diagnosed 9–11 children root on a skill with
>    NO CHAPTER** (`i.multFacts`, `i.multMultiDigit`, `i.division`; 5–8% for the teen bands). And the
>    stand-in is weaker than it sounds — a child whose root gap is multiplication FACTS has, by the
>    definition of a root, already PASSED equal groups, so the plan sends them to a chapter they can
>    already do. **This needs a Times Tables (fluency) chapter and a Division chapter.** Gated
>    (`exactly three skills have no chapter`) so it cannot silently widen. **Founder decision needed:
>    that is a chapter build — verb, world, art — not an engine change.**
> 3. **Probe length is the live trade.** On-grade median 9–16 (9–11 longest: it sweeps the most leaf
>    chapters); gapped p95 16–27. Above the spec's "8–12 items", inside its "5–8 min". The sweep is
>    3–4 questions and is the only thing that can find a money/time/rounding gap.
> 4. **17–18 and 15–16 are the weakest bands at 81%** — its descents cross the most bands, so a slip has the most
>    room to land on a wrong-but-deeper root.
> 5. **The `/menu` re-check card is NOT visually verified** — it needs a signed-in learner with a
>    6-week-old gap, which the local dev server has no session for. Its destination WAS driven.
> 6. 🔴 **STILL NO BACKUP OF THE CHILDREN'S DATA**, and tester issue #2 (Milo's robotic voice) is
>    untouched. Everything from the blocks below still stands.

_Older sessions (2026-06-15 → **2026-08-20**, including 🇺🇸 the US-spelling / SEO / region-migration day, 🔗 the social-handles day, ❓ the question-quality sweep and 🎚️ the adaptive-loop day, all moved 2026-08-22) live in [docs/handoff-archive.md](docs/handoff-archive.md) — not loaded at session start. `grep` it for a chapter or a decision. Moved there to keep this file inside its size budget: the two 2026-08-14 blocks (🧱 all six neon chapters onto GameShell · 🎛️ the band moving onto the 12–18 engine) on 2026-08-16, 🏗️ **The Empty Plot** (the last neon chapter + the 3D deletion + the explainer-film pipeline) on 2026-08-17, 📊 **The Loading Bay** (the first storybook chapter onto GameShell, and the mastery exit finally seen to fire) and 🚀 **the first launch-hardening day** (0 security advisories, crash screens, self-hosted fonts, the enforced CSP, legal plumbing, the launch runbook) both on 2026-08-17, and 🔒 **launch hardening round two** (the walkthrough dead end, the CSP gate that had been red for a day, `media-src` silently killing the recorded voice on mobile) on 2026-08-18, and 🕳️ **the plan-pointer P0** (`ChapterPortal` dropping `onComplete`, so no child's diagnostic plan advanced for three months — plus the one-emoji-to-crawlers SEO fix and the inert short-landscape gate) on 2026-08-18, and 🧭 **the 2026-08-18 architecture/security/devops day** (the layering refactor, V13–V20, the two vacuous scheduled sweeps) on 2026-08-19, and ⚡ **the performance pass** (57 MB of art revalidated on every request, every backdrop shipped as full-size PNG, every creature journey relaying out the document — plus the /game fit controller that turned out to be dead code) on 2026-08-19, and 🛡️ **the five-role red-team day** (the AR camera door that could strand a child for ever, the placement check dying on one Back press, and the regression I shipped inside my own fix) on 2026-08-20, and — moved 2026-08-23 — 📐 **the tester's-four-bugs / responsiveness-sweep / `useOnceGuard` day** (the StrictMode ref guard that froze ten chapters' demos in dev only, 683 → 2 sub-44px tap targets, and 20/20 storybook coverage), and — on 2026-08-21 — ⚡ **the font pass** (Gaegu preloading 90 subsets), 🔎 **the public-SEO pass**, 🏷️ **the AdaptiveLearn rename**, and 🏗️ **the move onto the company account** (whose still-open items were carried forward into the 🧭 block rather than archived with it)._
