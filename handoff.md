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

> 🚪 **2026-08-25 — THE FUNNEL: THE CHECK BECAME OPTIONAL, THE DEMO ROUTE SHIPPED, AND SIGNING UP NOW CARRIES THE PLAY ONTO THE ACCOUNT. ⚠️⚠️ AND THE THREE-MONTH `onComplete` P0 TURNED OUT TO HAVE LEFT ITS CORPSE IN PLACE — I WAS THE NEXT CALLER TO TRUST IT.** `tsc` 0 · **1535/1536** · `next build` 0 · e2e demo **3/3** + adaptive **2/2** · **9 commits, pushed** · prod **sw v145**.

**The asks, in order:** the pipeline decision · door 2 · durable resume · *"the check stays exactly as it is, unchanged, and becomes optional"* · the demo route · the local→server adopt.

## ⓪ 🧯 THE CHECK-SHAPED DEFECT CLASS IS NOW THE TOP OF CLAUDE.md, AND IT GREW TO THIRTEEN
Founder's call: the through-line is the organising principle, not a list. **A check is not a check
until you have watched it fail for the right reason. Green is not evidence. Present is not
enforcing. Found-nothing is not clean.** The instances are keyed on MECHANISM — a skip, a shape, a
moment, an order, a flag, a dead clause, a wrong target, a one-valued metric, an artefact without
the feature, a world without the bug, a proxy boundary, a drifted fixture — because *the point is
that pattern-matching will not find the next one.* **The table is meant to grow.**
⚠️ **#11 IS A DIFFERENT ANIMAL AND HAS ITS OWN SECTION**: not a check that cannot fail but **a wire
that is not connected while both ends read as connected** — see ②.

## ① 🎚️ THE CHECK IS OPTIONAL, AND THE SHORT PASS WAS MEASURED AND REJECTED
The founder had argued FOR forcing it, and reversed himself on the numbers: forcing was defensible
only while a MIDDLE option existed. Measured, the spine-only short pass is a bad trade in every band
— 6–8 halves the length and misses **45%** of gaps (exact 95% → 53%), 9–11 misses 32%, and **17–18
has no short pass at all** (`PROBE_SWEEP['17-18']` is empty, so spine IS the full agenda; a "quick
check" button there is a control that changes nothing).
So: **the check is untouched — not shortened, no new modes** — and skipping is one tap with no
confirmation. ⚠️ **OPTIONAL MUST NOT MEAN PLANLESS**: a skip issues `gradeStartPlan(band)`, and
`ActivePlan.source` now records where a plan came from, because *"Milo picked this to close the gap"*
is a straight falsehood after a skip. Re-offered ONCE, on the menu, after the child finishes a plan
chapter; a second decline retires it to the parent dashboard for good.
📊 Metrics + **pre-registered interpretations** in [docs/checkup-optional-metrics.md](docs/checkup-optional-metrics.md).

## ② ⚠️⚠️ THE `onComplete` P0 LEFT A CORPSE, AND IT WAS STILL WARM
`ChapterProps.onComplete` has been in every chapter's signature since the beginning; both registry
factories took it as `_props` and dropped it. **That is the P0 that stalled every child's plan for
three months.** It was fixed by moving the pointer into `finishAndSync` — correct — **and left the
prop in place, still typed, still passed, still discarded.** `/demo` is the next caller, and cannot
use `finishAndSync` at all (a logged-out visitor has no learner: `if (!learner) return`).
**What makes it its own class is that it is invisible from BOTH ends.** The caller believes it passed
a handler; the chapter shows its end screen either way. Only an e2e that plays a chapter to its end
and asserts *the demo advanced* can see it.
⚠️⚠️ **AND WAKING IT WOULD HAVE BROKEN ALL 72 CHAPTERS.** `/game`'s dormant `handleComplete` set
`chapterDone`, and the mount read `{!chapterDone && playingChapter && …}` — so the moment the wire
was connected, every chapter would have **unmounted the instant a child finished it**, taking its
own end screen with it. **Dead code is a trap with a timer somebody else starts.** Flag deleted.

## ③ 🚪 THE DEMO ROUTE, AND THE ADOPT THAT MAKES IT WORTH ANYTHING
`/demo`: band picker → the first two chapters of that band's `gradeStartPlan` (**the same plan a
skipper gets — no second curriculum to drift**), minus anything AR → then the account. No email, no
name, no account up front. The wall says what an account BUYS, never that the demo is spent.
`adoptDemoRun` runs at learner creation beside the pending-diagnostic replay it is modelled on: a
session per played chapter with stars/XP recomputed via the pure `scoreChapter`, and the plan's
pointer walked past what they played. ⚠️ **Peek-then-consume-on-match** — a band mismatch LEAVES the
run stashed. ⚠️ **A diagnosis outranks the demo for the PLAN**; the sessions are adopted either way.
⚠️ `GuardedChapter` gives `/demo` and `/teen-preview` **one** camera guard — two copies is the day
they disagree, and the disagreement shows a logged-out child a camera button.

## ④ 💾 DURABLE RESUME + 17–18's DOOR 2
The probe's resume moved from per-tab sessionStorage to **kv, per learner, 7-day TTL** — the old
comment argued for sessionStorage and was right when the probe was short; at 20–50 questions
"abandoned" means "ran out of evening". ⚠️ Across sittings it is **OFFERED, never applied** (silently
reopening question 26 leaves no route to a fresh check). Door 2 seeds the probe at a strand the
student names — `strandChoices` derives them from the spine, 17–18 only.

## ⑤ 🚦 THE PIPELINE: DECIDED, NOT BUILT
✅ **`migrate-prod` gets its own `production-db` environment**, created WITH its reviewer rule at
enable time and not before. ⚠️ **The casing trap in the last handoff was NOT REAL** — GitHub matches
environment names case-insensitively (measured). What IS real: `Production` is **Vercel's** (68
deployments), so a reviewer there would gate the whole site's deploy path to protect a schema apply,
and the first wedged hotfix removes it — taking the database protection with it.

## ⑥ 🧹 EVERY CHARACTER WINDOW IS GONE FROM THE GATES
Three in one session reported on text they never saw. Swept all 12 sites onto
`src/__tests__/_window.ts` (`balanced` / `element` / `strip`). ⚠️ **A negated class is also a proxy**
— `[^>]*` is a real bound in SQL and a lie in JSX, because `=>` contains a `>`.

## ▶ OPEN
1. 🔴 **B12 IS THE ONLY THING BLOCKING, AND IT IS THE FOUNDER'S.** Supabase Pro before `enforced` is
   ever flipped true and before any live Stripe key exists. It also gates the pipeline (⑤).
2. ✅ **The smoke test passed** (2026-08-25): a chapter played to completion on an established
   account, stars saved — progress writes survive the billing guard with the flag off. First time
   anybody had watched it.
3. ⏭️ **STAGE 2 — STRIPE, TEST MODE ONLY.** Founder's hard constraint: no live keys, no live
   products, no live webhook, nothing that can take a real card, for the WHOLE stage. Live keys are
   a deliberate later step — after B12, after the fingerprint check, and after the founder has
   watched a test-mode purchase end to end.
4. ⚠️ **NINE DEPENDABOT PRs STILL OPEN AND UNTRIAGED** (#28–#47). Do not merge as a batch.
5. ⚠️ Accepted limitation, unchanged: RLS gates the RECORD, not chapter CONTENT.

> 💳 **2026-08-24 (fourth pass) — THE BILLING SCHEMA IS APPLIED TO PRODUCTION AND COMPLETELY INERT. ⚠️⚠️ CAPTURING THE ROLLBACK CAUGHT MY OWN MIGRATION SILENTLY REVERTING A SECURITY FIX, FOUR HOURS AFTER I WROTE THE RULE THAT CATCHES IT.** `tsc` 0 · **1477/1478** · `ci / rls-tests` **64 assertions** · ledger **74 → 76**. **6 PRs merged** (#51–#56).

## ⓪ ⚠️⚠️ THE MIGRATION WAS NOT APPLICABLE AS WRITTEN, AND "RISKY" WOULD HAVE BEEN THE WRONG WORD
Production has zero subscriptions, so the moment `is_chapter_entitled` reached the `sessions`
policy, entitlement would collapse to `is_free` and **every existing family would stop being able to
save progress in 65 of the 72 chapters, instantly.** `billing_config.enforced` (default **false**)
makes the whole surface land inert; the paywall goes live by flipping one boolean later.
⚠️ **IT FAILS OPEN AND THE CAMERA GUARD FAILS CLOSED — NOT AN INCONSISTENCY.** Founder's words: *a
camera without consent harms a child; a paywall failing closed breaks a working product for every
family at once.* Different failure costs, different defaults. Recorded in the doc so nobody
reconciles them.
⚠️ **A DEFAULT-OFF FLAG IS A HOLE UNLESS THE SUITE FORCES IT ON *AND ASSERTS IT DID*** (F0). Setting
alone is silently removable. It also closes an unrelated hazard: an accidental `PROD_PROJECT_REF`
waking `deploy.yml` now applies a paywall that does nothing.

## ① ⚠️⚠️ THE ROLLBACK CAPTURE CAUGHT A REVERTED SECURITY FIX — MINE
`plan_entitlement.sql` rebuilt `sync_diagnostic` from `20260702131627_diagnostic_idempotency`, which
is OLDER than `20260703014331_harden_rpc_inputs` — so it silently dropped the **V5 payload bounds**.
The `leads_server_only` class exactly, on the same day, by the person who wrote the runbook rule.
⚠️ **READING THE REPO DID NOT FIND IT: my grep was CASE-SENSITIVE and the hardening file writes
`CREATE OR REPLACE FUNCTION` in capitals.** `pg_get_functiondef` found it in one query. Founder's
sentence, now in the runbook: *reading the repo answers "what did we intend", querying production
answers "what is true" — only the second one is a check.*

## ② 🧪 TWO DERIVED GATES, BOTH MEASURED BEFORE BEING WRITTEN
- **functions** — the newest definition must keep every `raise exception` an earlier one added.
  Exactly 1 violation across the 18 redefined functions; it was mine.
- **policies** — the newest must keep every LITERAL an earlier one used (a policy's guard is one
  anonymous expression, so there is no named condition to compare; a regex/status/bound survives a
  rewrite). **0 violations today; replayed to the corpus as it stood when `leads_server_only`
  shipped, exactly 1 — that one.** The restore's `between 3 and 254` → `>= 3 and <= 254` is
  correctly NOT flagged.
  ⚠️⚠️ **`baseline_schema.sql` MUST BE ORDERED FIRST.** It is migration-zero but is GENERATED FROM
  LIVE PRODUCTION — ordered last it supplies the very predicate a regression just removed. Ordered
  last: zero findings. Ordered first: it finds the regression. **Fourth "check that silently finds
  nothing" today**, hence the new standing habit in CLAUDE.md.

## ③ ♻️ THE ROLLBACK IS RUN, NOT READ
`ci / rls-tests` applies the billing migrations, runs `supabase/schema/rollback_20260824_billing.sql`
and asserts production's captured fingerprints come back — with a **positive control first**, or the
step passes on a database where the migrations never applied. Reading it had already caught one
defect (`pg_policies` reports a null qual for an INSERT policy, so the capture emitted `using
(true)` — invalid DDL). Reading is not running.

## ④ ✅ APPLIED, AND VERIFIED BY FINGERPRINT RATHER THAN BY A LIVE WRITE
| | |
|---|---|
| `20260824133906` | `billing_schema` |
| `20260824134125` | `plan_entitlement` |
⚠️ **THE POST-APPLY WRITE PROVES NOTHING ABOUT THE GUARD** — with `enforced = false` it succeeds
either way. So `ci / rls-tests` PUBLISHES the fingerprints of the schema it tested with the
enforcing path on, and **all five matched production exactly** (2 policy predicates,
`is_chapter_entitled`, `sync_session(11)`, `sync_diagnostic`). That is the proof; the live write is
only a smoke test — **and it could not be run: `execute_sql` connects as `supabase_read_only_user`.**
It needs a real signed-in session. ⚠️ Still owed.
`active` backfill touched **0 rows** as predicted (14 plans, none doubled); 9 gained `free_chapters`.
Advisors: no new problems — three `rls_enabled_no_policy` INFOs are the intended deny-all design.

## ⑤ 📷 AND THE COPPA FIX SHIPPED FIRST, ALONE (#53)
`/teen-preview?c=<AR id>&taste=1` rendered a camera chapter to a logged-out child — 12–30% of report
links in four bands. Guard at the ROUTE, not a picker: the live leak had no picker, the URL *is* the
picker. `e2e/ar-consent.spec.ts` drives the real URL for all eight and asserts `getUserMedia` is
never called, with three controls. ⚠️ And the fix blinded `all-chapters` until that was fixed too.

## ⑥ 🚦 THE PIPELINE PROPOSAL — WRITTEN, NOT BUILT ([docs/migrate-prod-proposal.md](docs/migrate-prod-proposal.md))
Hand-applying is the ROOT CAUSE of the 58-file drift repaired this morning, and today added two
more plus 442 lines retyped into a tool call. ⚠️ **It is not enable-or-don't** — founder's framing:
a GitHub **protected environment with a required reviewer** keeps a human between a merge and a
schema change while ending the transcription. Three conditions, all unmet: **B12 first** · required
approval · **and the pipeline must be SAFER, not merely more consistent** (it must run the stale
diff against PRODUCTION, turn B12 into a grep over pending migrations, and fingerprint the applied
schema — or it is faster and worse).
✅ **Condition 2 is available**, measured via the API: repo **public**, org plan **free**, so
environment rules cost nothing. Three environments exist and **none has a protection rule**; there
are no repo variables or secrets at all.
⚠️⚠️ **AND A TRAP IN THE NAMES.** `deploy.yml` says `environment: production`; the environment that
exists is `Production`. **A workflow referencing an environment that does not exist CREATES it,
unprotected** — so the gate can be bypassed while the settings page looks right. **Verify the
reviewer by watching a job PAUSE, never by reading a settings page.**
⚠️ **The flag's limit is written down** so nobody sells it as the net: `enforced` makes an accidental
apply of THESE TWO migrations harmless and does **nothing** for a future one. The net is B12 + ③.

## ⑦ 🎚️ FUNNEL ITEM ONE: A NARROWED PROBE MAY NEVER SAY "ON TRACK" (PR #58)
The constraint is in the ENGINE, not the copy — copy is where it rots. `startProbe(band, config,
agenda?)` narrows the investigated entries (the short pass; 17–18's door 2), and
`Diagnosis.coverage` is `'full'` only when the whole band was investigated **and finished**. The
report BRANCHES on it: the on-track card is unreachable from a partial pass, which offers the full
check in one tap instead.
⚠️⚠️ **SIX MUTATIONS, THREE SURVIVED, AND THE THREE WERE THREE DIFFERENT LESSONS.**
- the cap clauses (`asked < maxItems`) were **INERT** — a cap always leaves the agenda or a frame
  open — and in the one case they were not redundant they were **wrong**, reporting a FINISHED
  search as partial. Deleted. *An inert clause in a load-bearing rule is worse than none, because it
  reads as protection.*
- the `frames` term was a **MISSED REGRESSION**: it matters when the last entry fails and the cap
  cuts the descent, a state no driven test reached. Built as a fixture, with a positive control.
- the `agenda` term was missed for the mirror reason — every case used a FAILING answerer, which
  always opens a frame, so the frames term caught it instead.
Each term now has a state where it is the only one that says no.
⚠️ And the report's source gate first matched a bounded window that stopped at the first `) : (` —
inside the very ternary it checks. **Third time today a window ended at the wrong place.**

## ▶ OPEN
1. ⏸️ **THE FOUNDER IS RUNNING THE SMOKE TEST** — sign in, play a non-free chapter, confirm it
   saves. The one step of the apply sequence I cannot perform: `execute_sql` connects as
   `supabase_read_only_user`. **Nothing else touches production until it comes back.**
2. 🔴 **B12 IS ON THE CRITICAL PATH AND IS THE FOUNDER'S.** Supabase Pro before `enforced` is ever
   flipped true — the day we take money is the day losing that database stops being recoverable by
   apology. It also gates the pipeline proposal (⑥).
3. ⏸️ **TWO PRs OF MINE OPEN:** #57 (the applied migrations, renamed, + the pipeline proposal) ·
   #58 (probe coverage). Six merged today: #51–#56.
   ⚠️ **AND NINE DEPENDABOT PRs ARE OPEN AND UNTRIAGED** (#28–#47), the oldest from weeks ago —
   including `actions/checkout 4 → 7`, `setup-node 4 → 7` and `supabase/setup-cli 1 → 3`, all of
   which touch the CI that this session has been leaning on. Do NOT merge them as a batch (the
   standing warning about TypeScript 7 / eslint 10 / jsdom 30 still applies).
4. ⏭️ **THE REST OF THE FUNNEL, in order:** 17–18's door 2 as a seeded probe on top of #58 · the
   short pass (spine prefix) · durable resume (the probe resume is sessionStorage, per-tab — "comes
   back tomorrow" needs kv, per learner) · the demo route (band picker → 2 chapters, local only) ·
   the local→server adopt at signup (`progressMerge` is server→local only; demo runs never reach
   the server, so a second device shows nothing).
5. ⚠️ **17–18 IS TWO DOORS, NOT A CUT** — measured: a 20-item cut names a root **3 levels too
   shallow 63%** of the time and the true chapter is absent from the plan **2 times in 3**, while
   only 4% announce themselves as empty. Door 2 (seeded at the named strand) is **94% at 28
   questions**; a wrong self-report costs 2 questions and is caught by ⑦.
6. ⚠️ **Accepted limitation, unchanged:** RLS gates the RECORD, not chapter CONTENT.

> 🧾💳 **2026-08-24 (third pass) — STAGE 1 IS BUILT: THE PAYWALL'S SCHEMA, RLS AND ENTITLEMENT, WITH THE GUARD AT ALL THREE WRITE PATHS AND A TEST THAT DRIVES BOTH OF THEM RATHER THAN READING THEM. ⚠️ THE STAGE-1 PLAN ITSELF WAS LOST — IT ONLY EVER LIVED IN CHAT — SO THE B-CASE NUMBERING IS RE-DERIVED AND NOW WRITTEN DOWN.** `tsc` 0 · **1466/1467** · `next build` 0 · **`ci / rls-tests` 46/46 on PR #52** (was 17). NOT applied to production.

**The ask:** *"STAGE 1 — GO. Schema, RLS, regression tests. No UI. Stop at the end for review."*

## ⓪ ⚠️ THE PLAN WAS GONE, AND SAYING SO WAS THE FIRST TASK
The billing plan — the settled decisions, the B1–B11 case list, the wording of the AR constraint —
was agreed in chat and never written to a file; by the time Stage 1 started that context had been
summarised away, and `search_session_transcripts` finds nothing. Everything was re-derived from the
decisions recorded in this file and is flagged as a re-derivation at the top of
[docs/billing-stage-1.md](docs/billing-stage-1.md), which now HOLDS the plan. **A decision that lives
only in a chat log is a decision you will re-make.**

## ① 🔒 WHAT A PAYWALL ON THIS PRODUCT CAN ACTUALLY DO
RLS gates the **record**, not the chapter **content** — chapters are client-side JS and stay that
way. So every guard is a WRITE guard and an unentitled child can still open a paid chapter; what
they cannot do is have it saved, counted, or appear in the report. **Reads are deliberately
untouched**: a lapsed subscriber keeps their child's whole history, which is why the entitlement
sits in `learner_progress`'s WITH CHECK and never in its USING (B11d asserts it did not creep in).
And the refusal is LOUD — `sync_session` raises 42501 rather than returning quietly, because a
swallowed refusal is *"a tap that does nothing"* wearing a server costume. Stage 2 owes it a lock screen.

## ② 🧩 ONE GUARD, THREE CALL SITES, AND A TEST THAT DRIVES THEM
`is_chapter_entitled` is called from the `sessions` INSERT policy, the `learner_progress` WITH CHECK,
and inside `sync_session`. ⚠️ **`sync_session` is SECURITY DEFINER, so RLS does not apply to it** —
the policy alone leaves the RPC wide open and the RPC alone leaves direct writes open. The only way
two guards cannot diverge is for them to BE the same guard.
**B12 does not read the source.** It drives BOTH paths and asserts the verdicts are EQUAL, for an
unentitled chapter and for a free one — plus the VALUE each time, because equality alone passes if
both are broken open.
⚠️ `subscriptions.status` carries **no CHECK**, on purpose: it holds whatever Stripe last said, and
the function allow-lists, so an unknown status fails **closed** instead of failing the write.

## ③ ⚠️ THE REVOKE IS NOT BELT-AND-BRACES — IT CHANGES THE FAILURE MODE
Supabase's default privileges hand `anon`/`authenticated` ALL on new public tables. With the grant
in place and no UPDATE policy, an attempted **self-upgrade matches zero rows and returns QUIETLY** —
a silent no-op the client cannot tell from success. Revoked, the same statement raises 42501. B4
asserts both halves: that it raised, AND that `seats_paid` is still 2.
`reassign_learner_seat`'s single write is an UPDATE of one existing row — no INSERT, no DELETE — so
it is *structurally* unable to raise the seat count. Its period limit is
`coalesce(current_period_start, '-infinity')`: without the coalesce a NULL period start makes the
comparison NULL and the limit silently does not exist, which is the state someone would engineer by
suppressing a webhook.

## ④ 🧪 13 MUTATIONS, AND THE ONE THAT SURVIVED IS THE FINDING
The source gate `src/__tests__/billingSchema.test.ts` caught 13 of 13 planted against the SQL — but
its first version was **blind to the most important one**. The sessions-policy check used a character
budget (`[\s\S]{0,800}?`), so deleting the guard from that policy let the window run on into the
NEXT policy, which still had one: green, with the guard that matters gone. It is `[^;]*` now, because
a policy statement contains no semicolon of its own. **A window measured in characters is not a
window bounded by the statement.**
Two of its nine checks are GENERAL rules, measured to pass on all 20 tables and all 11 SECURITY
DEFINER functions before being written: **every table a migration creates must be named in
`security_baseline.sql`**, and **every SECURITY DEFINER function must carry an explicit REVOKE** (V19
as a standing rule). ✅ And yesterday's `exportCompleteness` gate caught `subscription_seats` on its
first run — recorded as a deliberate exclusion with its reason, not ignored.

## ⑤ 🎥 THE FREE SET, AND THE AR CONSTRAINT ANSWERED PLAINLY
Re-derived constraint: *a free chapter must be one the child answers with the camera* — the free set
protects nothing, so its only job is to sell, and AR is the one thing a screenshot cannot convey.
**Measured: eight chapters carry AR wiring and ALL EIGHT are in 9–11** (six finger-count, one tilt,
one span — the handoff's "five" predates The Minibus Run). So **the constraint is satisfiable in
exactly one band out of six**, and stretching it to "is interactive" makes it vacuous.
The alternative is to name what AR stood in for — *it cannot be evaluated from a screenshot* — and
apply THAT to the other bands. Seeded proposal: **the first chapter of every band plus `decimals`**
(7 of 72), because a free chapter a parent has to hunt for converts nobody.
⚠️⚠️ **AND IT SURFACED A CONSEQUENCE NOBODY HAD COSTED:** the diagnostic routes a child to their root
gap, which is almost never chapter 1 — so under that set **a plan's first step can be locked, right
after a 20–50 question check that just promised a route.** Two ways out in §4 of the doc; recommend
making the plan's first unmet step always entitled. **Not built — it changes what is sold.**

## ▶ OPEN
1. ⏸️ **PR #52 is waiting for review; it stacks on #51.** Both are green, `rls-tests` **46/46**.
   Nothing is applied to production and nothing is merged.
2. ⏸️ **The free set needs your pick** (§⑤ and doc §4), and with it the locked-first-step question.
3. **Stage 2 = Stripe**: the webhook, the seat materialiser (nothing creates seat rows yet — the
   tests insert them in setup), checkout, the customer portal. **Stage 3 = UI**, starting with the
   lock screen the 42501 now demands.
4. ⚠️ **A contradiction found, flagged, not resolved:** `exportCompleteness.test.ts` says Stage 1
   adds an `ON DELETE SET NULL` fkey to `error_events.learner_id`; `20260817142406_error_events.sql`
   says the column is deliberately NOT a foreign key so a crash is still recorded when the learner id
   is stale. The migration's reasoning is better, so the fkey is NOT added and the test's note is the
   thing that is wrong.
5. 🔴 **B12 (the launch blocker, not the test case) — still no backup of the children's data.**
6. Everything from the blocks below still stands.

> 🧾 **2026-08-24 (second pass) — THE LEDGER IS REPAIRED, AND THE DIRECTION WAS THE OPPOSITE OF THE ONE PLANNED: 58 REPO FILES MOVED, THE PRODUCTION LEDGER WAS NEVER WRITTEN. ⚠️ `perf_advisors` IS APPLIED AND CLEARED EIGHT LIVE ADVISOR FINDINGS.** `tsc` 0 · **1457/1458** · `next build` 0 · **`db push --dry-run` equivalent: 0 pending.**

**The asks:** apply `perf_advisors` behind the new stale-migration diff · accept the ledger snapshot as the safety net but add *no backups* as a launch blocker · compute the dry-run rather than putting a production password into CI.

## ① ✅ THE STALE-MIGRATION DIFF RAN FOR THE FIRST TIME, AND PASSED
All five `diag_*` predicates were read off `pg_policies.qual` and compared with what the file would
write: **identical except the `(select auth.uid())` wrap**, `with_check` null on all five, `cmd`
SELECT, roles `{public}` — and `diagnostic_engine_schema` is the only other file in the repo that
touches them, so nothing newer could be reverted. Applied, then verified from the CATALOG, not the
success flag: five quals now carry `( SELECT auth.uid()`, three indexes exist, and the advisor
report went **5 `auth_rls_initplan` + 3 `unindexed_foreign_keys` → 0** (three new `unused_index`
INFOs, which the migration's own closing comment predicts — no traffic yet).

## ② ⚠️⚠️ THE REPAIR WRITES NOTHING TO PRODUCTION — THE PLAN SAID 71 LEDGER UPDATES
Renaming the repo files reaches the same acceptance test with **zero** production writes, and it is
what `docs/runbooks/applying-migrations.md` already prescribes. **The ledger holds the true apply
ORDER; the repo now agrees with it rather than the other way round.** So the snapshot committed
first (`d880f68`, 73 rows) guards a write that never happened — kept, because it is also the record
of the pairing. 58 files moved: 57 relabelled to the versions production recorded, plus
`perf_advisors` at **20260823225313**.
⚠️ **Checked before renaming: the ledger order is an order-PRESERVING relabelling of all 71
previously-applied files — no permutation**, so replay order is unchanged. `perf_advisors` is the
one file that moves, to last, which is safe for the two reasons in ①.

## ③ 🔍 PAIRING BY CONTENT, AND THE TRAP THAT MAKES IT LOOK LIKE MASS DRIFT
⚠️ **A RAW hash does not compare: the CLI strips comments preceding the first statement** when it
stores a migration (`index_chapter_fks` is 331 bytes on disk, 173 in the ledger), so only **13 of
72** files matched raw. Strip `--` comments and all whitespace from both sides and **68 of 72 pair
exactly**; the other four are each explained (two amended in the repo after they ran, two split into
a pair of rows by production, and `perf_advisors`, which had never run anywhere). Name-only pairing
would have marked that last one applied and lost it for ever — which is the whole argument.
Two remote-only rows survive by design (`grades_pin_touch_search_path`, `sync_recheck`) and two rows'
`name` columns disagree with the repo filename on purpose; both tables are in
[docs/schema-baseline-debt.md](docs/schema-baseline-debt.md).

## ④ 🧮 THE DRY-RUN, COMPUTED RATHER THAN CREDENTIALLED
No `SUPABASE_ACCESS_TOKEN` or DB password went into CI. `db push --dry-run` does one thing — compare
local filename versions against `schema_migrations.version` — so the set difference IS the command:
**74 ledger rows, 72 repo files, LOCAL-not-in-REMOTE = 0, REMOTE-not-in-LOCAL = 2** (the split-point
rows). Both directions and the exact query are written out in the debt doc. The founder will run the
real command later as confirmation, not as a gate.

## ⑤ 🔴 "NO BACKUPS" IS NOW LAUNCH BLOCKER **B12**, NOT A NICE-TO-HAVE
Founder's call and his words: *we cannot take a parent's money for a service whose entire record of
their child's progress has no recovery path.* Supabase Pro is $25/month for daily backups + 7-day
PITR and is already in the cost model. ⚠️ `baseline_schema.sql` returns the STRUCTURE and **none of
the data** — it must not be read as a backup, and neither must the ledger snapshot.

## ▶ OPEN
1. ⏳ **The RLS suite has not yet looked at this.** It only runs on a PR to `main`, and the branch
   `chore/ledger-repair` is pushed with PR **#51** open for exactly that. Read `ci / rls-tests`
   before merging — it is the thing that caught the last regression in four minutes.
   ⚠️ Note it has ALWAYS replayed `perf_advisors` (it replays repo files, and the file existed), so
   CI's database has been ahead of production on those five policies for days; what is new to it is
   the file moving to last.
2. 🔴 **B12 — still no backup of the children's data.** Now blocking, and one dashboard toggle.
3. ⚠️ Three migration comments and `src/app/api/lead/route.ts` still say the anon INSERT revoke
   "cannot be applied until SUPABASE_SERVICE_ROLE_KEY is set" — it was applied yesterday. Prose
   drift, not behaviour; a chip is filed.
4. ✅ ~~Stage 1 next~~ — **BUILT, PR #52** (see the 🧾💳 block above): `last_reassigned_at`, the
   divergence case, and the free-set proposal against the AR constraint. Not applied, not merged.
5. Everything from the blocks below still stands.

> 🔐 **2026-08-24 — THE ROAD TO A PAYWALL WENT THROUGH FIVE REAL PROBLEMS AND NEVER REACHED THE PAYWALL. ⚠️⚠️ THE RLS SUITE HAD NEVER RUN ONCE; IT NOW DOES, AND ON ITS SECOND DAY IT CAUGHT A SECURITY REGRESSION I HAD SHIPPED FOUR MINUTES EARLIER. AND THE MIGRATION LEDGER TURNS OUT TO BE 58 FILES OUT OF SYNC WITH PRODUCTION.** `tsc` 0 · **1457/1458** · `next build` 0 · **3 PRs merged** (#48, #49, #50). ⏸️ **STAGE 1 NOT STARTED — one decision block is open, see ▶.**
>
> **The ask:** subscription billing + paywall → *"STOP — DO NOT WRITE CODE YET"* → a plan, then a
> series of pre-Stage-1 gaps that each turned out to be real.
>
> ## ⓪ ⚠️⚠️ THE RLS SUITE HAD NEVER EXECUTED, AND MAKING IT RUN TOOK SIX RED PIPELINES
> `ci / rls-tests` was gated on a `SUPABASE_DB_URL` secret that was never set: it printed a
> `::warning::` and `exit 0`. On a children's app the one suite proving account A cannot read
> account B's data had **never run once**, and reported green throughout. It now brings up its own
> Postgres with `supabase db start` — no secret, no cloud DB — and **fails unless the suite reports
> a non-zero assertion count** (currently `RLS_ASSERTIONS=17`). Proved by simulation: with the file
> reduced to `begin; rollback;`, psql exits **0** and the job still **fails**.
>
> ⚠️ **The blocker nobody had hit, because nobody had ever built this schema from source:** seven
> base tables (`profiles`, `learners`, `learner_access`, `learner_invites`, `sessions`,
> `learner_progress`, `learner_stats`) are created by **zero** of the 68 migrations — they were made
> in the dashboard. `supabase/schema/baseline_schema.sql` reconstructs them from the live catalog.
> Getting it to coexist with the migrations took **six red runs, each a distinct object class**:
> `CREATE POLICY` (42710) → dead RPCs revoked then dropped (42883) → over-correction, 12 policies are
> ALTERed and created by nothing (42704) → `ADD CONSTRAINT` (42710) → the baseline is migration-**ZERO**
> not today, so it must carry three dropped columns → bare `CREATE TABLE` (42P07).
> **`src/__tests__/baselineSchema.test.ts` DERIVES all five rules from the migrations** rather than
> hard-coding them, because I hard-coded them twice and was wrong in opposite directions.
>
> ## ① 🔴 THREE PRIVACY GAPS BETWEEN THE PUBLISHED COPY AND THE SYSTEM (#49)
> - **The export returned 4 of 11 child-data tables.** "Download a copy of everything we hold about
>   your child" omitted the entire diagnostic (166 answers) and every analytics event (2,024 rows) —
>   while the policy names placement-check answers as stored data. Under COPPA that button IS the
>   parent's review right. ⚠️ The new gate **derives** the child-data table list from the SQL and
>   caught `learner_invites` on its first run: it carries `learner_id` but holds a **third party's**
>   email, so exporting it would disclose someone else's address to satisfy a right about the child.
> - **`diagnostic_items` was retained for ever** while the copy said 90 days. Split where the line
>   belongs — raw answers are analytics (90 days), the derived plan is progress (kept). Verified
>   first: **nothing in the app reads `diagnostic_items`**, so pruning cannot cost a child their plan.
> - **"Write to us and we will delete it" had no tool.** `delete_lead_by_email()` — service-role only
>   by explicit REVOKE, or it is an address-enumeration oracle. `docs/runbooks/data-requests.md`.
> - **The export could time out silently.** Measured: heaviest learner 165 kB, **96% events**;
>   `authenticated` carries `statement_timeout = 8s`; `pgrst.db_max_rows` is unset so no silent
>   PostgREST truncation. `.limit(5000)` + a `completeness: {complete, notes}` block, so a capped or
>   failed read **says so in the file** instead of quietly holding less.
>
> ## ② 🔴 THE ANON INSERT IS CLOSED — AND IT TOOK FOUR PROBES TO PROVE THE PRECONDITION (#50)
> Anyone with the public anon key could POST `/rest/v1/diagnostic_leads` directly and skip
> `/api/lead`'s limit, on a table holding **4 real prospect addresses**. This was a ONE-WAY DOOR:
> `/api/lead` falls back to the anon key, so revoking first would have stopped capture **dead and
> silently**. Proof came from `/api/report-error`, not from a lead — `sinkError` has **no** anon
> fallback, so a row in `error_events` can only mean the service-role key is present; a landed lead
> would have looked identical either way.
> ⚠️ **Three probes returned nothing.** The variable existed in Vercel but was not ticked for the
> **Production environment**, and env vars bind at **deploy time**. What made it diagnosable was the
> runtime log: `sinkError` logs `[milo.sink] … insert failed` on a rejected insert, so its ABSENCE
> beside a present `[milo.client-error]` line distinguished *key missing* from *key rejected*.
> Verified by doing the attack: anon → **HTTP 401 / 42501** (was 201) · `/api/lead` → 200, row lands ·
> **1.15 MB of production JS across 22 chunks → zero `sb_secret_`**.
> ✅ Production error monitoring is now durable for the first time (blocker B5, first half).
>
> ## ③ ⚠️⚠️ I SHIPPED A SECURITY REGRESSION AND THE SUITE CAUGHT IT IN FOUR MINUTES
> `leads_server_only` was WRITTEN 2026-08-16, when the leads policy bounded email LENGTH only. On
> 2026-08-17 `privacy_and_leads_hardening` tightened the SAME policy to require an email SHAPE — the
> V13 fix. Applying the older file recreated the policy **as written** and dropped the newer check.
> `RLS FAIL A9b: a non-email was accepted as a lead`, on the next CI run. Restored and verified.
> **Nothing about the file looked wrong.** It was reviewed, correct on the day it was written, and it
> reverted a security fix eight days newer than itself. The general rule is now
> [docs/runbooks/applying-migrations.md](docs/runbooks/applying-migrations.md): **diff a stale
> migration's objects against production's CURRENT definitions before applying, and STOP if they
> differ.** ⚠️ And the positive-control rule went into **CLAUDE.md**, because it is not a chapter
> rule: *a scan that finds nothing proves nothing until you have shown it can find something* — my
> first bundle grep searched for JWTs and found zero, and these keys are not JWTs.
>
> ## ④ 🔴 THE LEDGER: 58 REPO FILES ARE OUT OF SYNC WITH PRODUCTION — VERIFIED, NOT REPAIRED
> The two-file drift reported on 2026-08-23 was the visible edge. **The entire migration history was
> applied out-of-band with generated timestamps** (`20260615180001_secure_learners_rls` ↔ ledger
> `20260615142012 secure_learners_rls`, and so on). Paired all 72 repo files against 73 ledger rows
> **by name AND content hash** (the ledger stores the applied SQL, so this is exact, not name-guessing):
>
> | | |
> |---|---|
> | paired by name **and** identical SQL | **66** |
> | explained mismatches (my edit today · repo files amended in place · a different split point) | **5** |
> | 🔴 **genuinely unapplied** | **1** |
>
> ⚠️ ~~**`20260816120000_perf_advisors.sql` has never run.**~~ **APPLIED 2026-08-24 second pass**, ledger version `20260823225313`, file renamed to match; eight advisor findings cleared. Was confirmed against live state at the time: all five
> `diagnostic_*` policies evaluated `auth.uid()` **per row**, matching the `auth_rls_initplan`
> advisor warnings; they no longer do. Marking it "applied" would skip it for ever — which is exactly why the pairing
> had to be by content.
> ⚠️ **If `deploy.yml`'s `migrate-prod` were enabled today** it would attempt **58 pending migrations
> in version order and abort partway** — `chapters_as_data` re-adds `sessions_chapter_fkey`, which
> already exists (42710) — leaving ~7 re-applied and the run half-done. It is doubly inert
> (`PROD_PROJECT_REF` unset AND `migrate-staging` skipped) and **stays disabled**.
>
> ## ⑤ ✅ ALSO DONE
> Retention crons staggered **03:17 / 03:22 / 03:27 / 03:32** (four at one minute would contend once
> the tables grow; `cron.schedule` on an existing name updates in place, so no window without a job) ·
> `20260818090000_leads_retention` applied, **3 → 4 cron jobs** · migration files renamed to the
> versions production recorded, repo-side, **zero ledger writes** ·
> [docs/schema-baseline-debt.md](docs/schema-baseline-debt.md) names the frozen drift (7 tables, 2
> enums, 5 functions, 7 triggers, 2 indexes, 12 policies) with the two-step resolution written out.
>
> ## ▶ OPEN — ✅ ALL THREE ANSWERED AND THE REPAIR IS DONE (see the 🧾 block above)
> 1. ⏸️ **`perf_advisors`: apply it, or leave it pending?** Leaving it means `db push --dry-run`
>    reports 1, not zero, so the acceptance test cannot pass. Applying it means running the new
>    stale-migration diff first. Recommend applying.
> 2. ⏸️ **The backup prerequisite cannot be met.** Supabase **free plan has no downloadable backup and
>    no PITR**. Offered substitute: snapshot the 73 ledger rows to a committed file first. That is
>    **not** a database backup and must not be treated as one.
> 3. ⏸️ **`supabase db push --dry-run` needs credentials I do not have** (CLI + `SUPABASE_ACCESS_TOKEN`
>    + DB password; no CLI/Docker/psql on this machine). Either the founder runs it, or a temporary
>    CI job with those two secrets does. The equivalent is computable, but the founder asked for the
>    literal output.
> 4. 🔴 **STILL NO BACKUP OF THE CHILDREN'S DATA** — `backup.yml` reports green and writes zero bytes.
>    Unchanged, and now also blocking (2).
> 5. 🔴 **`DRAFT = true`** — privacy/ToS still placeholders (B1/B2).
> 6. **Billing decisions are all settled** and recorded in the plan: graduated tiering (never volume),
>    4 paid seats / 25 profile cap, teachers out of scope, entitlement follows `learners.created_by`,
>    no trial, USD + Stripe Tax off, `RADLOR MILO` descriptor, Resend, 7-day grace, and the $1
>    proration floor replaced by `proration_behavior: 'none'` below $1. **Stage 1 = schema, RLS,
>    regression tests, no UI** — plus `last_reassigned_at` (one seat reassignment per billing period,
>    enforced in-function), a case asserting the `sessions` / `learner_progress` entitlement guards
>    cannot diverge, and the free-set proposal against the AR constraint.
> 7. ⚠️ **Accepted limitation, written down deliberately:** RLS gates the RECORD, not chapter CONTENT
>    — chapters are client-side JS. Founder's call: sell the plan, the diagnostic and the record, not
>    the JavaScript. Do NOT move question generation server-side.
> 8. Everything from the blocks below still stands.

_Older sessions (2026-06-15 → **2026-08-23**, including 🚦 **the production-readiness day** (three workflows green while doing nothing, the dead error sink, eight chapters unstartable on a landscape phone), moved 2026-08-25; including 🔬 the seven-learner-models day (moved 2026-08-24), 🕸️ the skill-graph sensitivity audit and 🎯 the diagnostic's 96–98% rebuild, both moved 2026-08-24; plus 🇺🇸 the US-spelling / SEO / region-migration day, 🔗 the social-handles day, ❓ the question-quality sweep and 🎚️ the adaptive-loop day, all moved 2026-08-22) live in [docs/handoff-archive.md](docs/handoff-archive.md) — not loaded at session start. `grep` it for a chapter or a decision. Moved there to keep this file inside its size budget: the two 2026-08-14 blocks (🧱 all six neon chapters onto GameShell · 🎛️ the band moving onto the 12–18 engine) on 2026-08-16, 🏗️ **The Empty Plot** (the last neon chapter + the 3D deletion + the explainer-film pipeline) on 2026-08-17, 📊 **The Loading Bay** (the first storybook chapter onto GameShell, and the mastery exit finally seen to fire) and 🚀 **the first launch-hardening day** (0 security advisories, crash screens, self-hosted fonts, the enforced CSP, legal plumbing, the launch runbook) both on 2026-08-17, and 🔒 **launch hardening round two** (the walkthrough dead end, the CSP gate that had been red for a day, `media-src` silently killing the recorded voice on mobile) on 2026-08-18, and 🕳️ **the plan-pointer P0** (`ChapterPortal` dropping `onComplete`, so no child's diagnostic plan advanced for three months — plus the one-emoji-to-crawlers SEO fix and the inert short-landscape gate) on 2026-08-18, and 🧭 **the 2026-08-18 architecture/security/devops day** (the layering refactor, V13–V20, the two vacuous scheduled sweeps) on 2026-08-19, and ⚡ **the performance pass** (57 MB of art revalidated on every request, every backdrop shipped as full-size PNG, every creature journey relaying out the document — plus the /game fit controller that turned out to be dead code) on 2026-08-19, and 🛡️ **the five-role red-team day** (the AR camera door that could strand a child for ever, the placement check dying on one Back press, and the regression I shipped inside my own fix) on 2026-08-20, and — moved 2026-08-24 — 🚚 **The Packing Shed + The Minibus Run** (the two 9–11 chapters that closed the multiplication/division content hole) and 🎯 **the diagnostic rebuild** (26–34% → 81–87%, the answer-surface fix and the first accuracy gate), and — moved 2026-08-23 — 📐 **the tester's-four-bugs / responsiveness-sweep / `useOnceGuard` day** (the StrictMode ref guard that froze ten chapters' demos in dev only, 683 → 2 sub-44px tap targets, and 20/20 storybook coverage), and — on 2026-08-21 — ⚡ **the font pass** (Gaegu preloading 90 subsets), 🔎 **the public-SEO pass**, 🏷️ **the AdaptiveLearn rename**, and 🏗️ **the move onto the company account** (whose still-open items were carried forward into the 🧭 block rather than archived with it)._
