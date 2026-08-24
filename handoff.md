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
4. ▶ **Stage 1 next:** schema, RLS, regression tests, no UI — plus `last_reassigned_at`, the case
   asserting the `sessions` / `learner_progress` entitlement guards cannot diverge, and the free-set
   proposal against the AR constraint.
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
>   ✅ **FIXED 2026-08-24** — CI stands up its own Postgres; 17 assertions; an empty run now fails.
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
> 3. 🟡 ~~Blind in production~~ — **HALF CLOSED 2026-08-24.** `SUPABASE_SERVICE_ROLE_KEY` is live and
>    `error_events` receives rows (proved with a probe). **Vercel Web Analytics is still off.**
> 4. 🔴 **`DRAFT = true`** — privacy policy and ToS are still placeholders (B1/B2). Hard blocker for
>    marketing math to under-13s.
> 5. ✅ ~~`SUPABASE_DB_URL` so the RLS suite actually runs~~ — **SOLVED DIFFERENTLY 2026-08-24.** No
>    secret needed: CI stands up its own Postgres with `supabase db start`. 17 assertions, and the
>    job now fails if the suite runs nothing.
> 6. **Supabase free plan** — pauses on inactivity, 500 MB cap, no PITR, DB in Sydney while functions
>    run in Virginia. Pro before real traffic.
> 7. 🟢 **`getInsightsRawRows` has no `.limit()`** — MILDER THAN FILED: measured 2026-08-24,
>    `pgrst.db_max_rows` is UNSET on this project, so PostgREST does not silently truncate. Still
>    unbounded in principle; fallback path only.
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

_Older sessions (2026-06-15 → **2026-08-20**, including 🇺🇸 the US-spelling / SEO / region-migration day, 🔗 the social-handles day, ❓ the question-quality sweep and 🎚️ the adaptive-loop day, all moved 2026-08-22) live in [docs/handoff-archive.md](docs/handoff-archive.md) — not loaded at session start. `grep` it for a chapter or a decision. Moved there to keep this file inside its size budget: the two 2026-08-14 blocks (🧱 all six neon chapters onto GameShell · 🎛️ the band moving onto the 12–18 engine) on 2026-08-16, 🏗️ **The Empty Plot** (the last neon chapter + the 3D deletion + the explainer-film pipeline) on 2026-08-17, 📊 **The Loading Bay** (the first storybook chapter onto GameShell, and the mastery exit finally seen to fire) and 🚀 **the first launch-hardening day** (0 security advisories, crash screens, self-hosted fonts, the enforced CSP, legal plumbing, the launch runbook) both on 2026-08-17, and 🔒 **launch hardening round two** (the walkthrough dead end, the CSP gate that had been red for a day, `media-src` silently killing the recorded voice on mobile) on 2026-08-18, and 🕳️ **the plan-pointer P0** (`ChapterPortal` dropping `onComplete`, so no child's diagnostic plan advanced for three months — plus the one-emoji-to-crawlers SEO fix and the inert short-landscape gate) on 2026-08-18, and 🧭 **the 2026-08-18 architecture/security/devops day** (the layering refactor, V13–V20, the two vacuous scheduled sweeps) on 2026-08-19, and ⚡ **the performance pass** (57 MB of art revalidated on every request, every backdrop shipped as full-size PNG, every creature journey relaying out the document — plus the /game fit controller that turned out to be dead code) on 2026-08-19, and 🛡️ **the five-role red-team day** (the AR camera door that could strand a child for ever, the placement check dying on one Back press, and the regression I shipped inside my own fix) on 2026-08-20, and — moved 2026-08-24 — 🚚 **The Packing Shed + The Minibus Run** (the two 9–11 chapters that closed the multiplication/division content hole) and 🎯 **the diagnostic rebuild** (26–34% → 81–87%, the answer-surface fix and the first accuracy gate), and — moved 2026-08-23 — 📐 **the tester's-four-bugs / responsiveness-sweep / `useOnceGuard` day** (the StrictMode ref guard that froze ten chapters' demos in dev only, 683 → 2 sub-44px tap targets, and 20/20 storybook coverage), and — on 2026-08-21 — ⚡ **the font pass** (Gaegu preloading 90 subsets), 🔎 **the public-SEO pass**, 🏷️ **the AdaptiveLearn rename**, and 🏗️ **the move onto the company account** (whose still-open items were carried forward into the 🧭 block rather than archived with it)._
