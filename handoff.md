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
7. 🎙️ **VOICE CLIPS — 17–18 DONE, 3–5 ON TEDDY TWINKLE, 872/1411 RENDERED (2026-09-03, later session).**
   The key in `.env.local` works again (200; the ElevenLabs MCP still carries the dead one). **17–18:**
   all 161 missing lines rendered on Stevie — 613/613 in `public/audio/IvUJKFyjVb5hItY9dJAT/manifest.json`,
   watched end to end (Two Receipts requested a Stevie mp3, 0 TTS; that key was absent from HEAD).
   **3–5 (founder's call: Teddy Twinkle, `XjGYkUkzth8BPs29fmcV`):** the corpus is built by
   `VOICE_CORPUS=1 npx vitest run src/__tests__/_voiceCorpus35.test.ts` → `scripts/.voice-corpus-3-5.json`
   (gitignored; 1,411 lines in four priority buckets — scored 387 · teach 126 · redirect 321 · reteach 577).
   Voice is routed by BAND: `BAND_VOICE['3-5']` in `voicePref.ts`, read in `voiceClipPlayer.speakLine`
   off `getActiveLearner().age_group`; an explicit 'device' pick still wins. Watched both ways (Shape House
   with a 3–5 learner in `sessionStorage.milo_active_learner` → seven Teddy mp3s, 0 TTS; no learner → Stevie).
   ⚠️ **The run stopped on the monthly quota with scored + teach + redirect COMPLETE and reteach 38/577.**
   Quota resets **2026-09-06**; the generator is idempotent, so the rest is one command after that date:
   `npx tsx scripts/voice-generate.mts XjGYkUkzth8BPs29fmcV --corpus scripts/.voice-corpus-3-5.json`
   (~24k chars left to render). Until then a re-teach line a child hits falls back to browser TTS — the
   fallback is NOT suppressed for 3–5 (clip-only is still 12–14 only), so nothing goes silent.
   ⚠️ The templated lines are enumerated in the builder from the same tables the components read — a
   reworded template silently falls back until the corpus is rebuilt and re-rendered; the builder is the
   place to add a line. Six tracked Stevie orphans (keys no longer in any corpus) were deleted.
   ⚠️ `/teen-preview` with no learner plays Stevie for a 3–5 chapter, because the band comes from the
   learner, not the chapter. 6–8 and the 9–11 storybook pair still have no clips.

> 🌙 **2026-08-31 — THE NIGHTLY HAD BEEN RED ON ALL 12 OF ITS RUNS SINCE THE DAY IT WAS CREATED, AND A REAL CHILD-FACING DEFECT HAD BEEN SITTING INSIDE IT FOR SEVEN NIGHTS. FOUR FAILURES, ALL FIXED; THE MECHANISM MEASURED ON THE RUNNER RATHER THAN GUESSED AT LOCALLY.** `tsc` 0 · **1684 passed, 1 skipped by design** · `next build` 0 · `start-card` **16/16** · Nightly E2E **218/218 — the first green run in that job's history**. **MERGED — PR [#71](https://github.com/RadlorInc/learn/pull/71) as `22d75fb`.**

## ① 🎥 THE ONE A CHILD WOULD HAVE MET: THE ESCAPE HATCH FROM THE CAMERA, HALF OFF THE SCREEN
The GameShell start card carries TWO doors on an AR chapter — `Turn on the camera` and
`Use taps instead`. At 640×320 the second rendered at **y 299–343 of 320**, cut in half, while the
camera button was whole. **A child who cannot or will not use a camera saw a screen whose only
complete option was the one they cannot take.** Every AR chapter had it (`anglesSymmetry` −28,
`areaPerimeter` −23, …), not just the `dataGraphs` the nightly named. ⚠️ Reachable by a 23px scroll
is not a defence: the affordance to scroll is invisible when the visible content looks finished.

## ② 📐 THE OTHER THREE — MEASURED IN CI, WHICH IS THE ONLY PLACE THEY HAPPEN
Locally the same screen passed with 10px to spare; the runner reported −13px. The measurement, from
the CI browser and from mine:

| | local (macOS) | CI (Linux) |
|---|---|---|
| start-card blurb | 116px / **5 lines** | 140px / **6 lines** |
| canvas probe, computed stack | 312.09 | **328** (+5.1%) |
| canvas probe, generic `sans-serif` | 296.81 | **296.81** |
| line-height · column · dpr · Chromium | 23.25 · 400 · 1 · 149.0.7827.55 | identical |

**One line = 23.25px = exactly the −13px the nightly reported.**
⚠️⚠️ **AND MY FIRST EXPLANATION FOR THE +5.1% WAS WRONG, WHICH IS WORTH MORE THAN THE NUMBER.** I
reported it as `next/font`'s generated fallback resolving to different physical fonts per OS. Chrome's
own `CSS.getPlatformFontsForNode` says **both platforms paint the declared face** — `IBM Plex Sans`,
`isCustomFont: true`, `document.fonts.status: loaded`, on macOS and on the runner. So the face is
**not** failing to load in CI (not a misconfigured runner) and the fallback is **not** what renders
(not a `size-adjust` failure) — the two candidates, both eliminated. Same face, ~5% wider on Linux,
which leaves platform text shaping; **two ruled out, the third not proven**, and nothing in the fix
depends on which it is. ⚠️ `document.fonts.check('15px "IBM Plex Sans"')` returns **false on both**
while the face is demonstrably painting — that API is the wrong instrument and is what produced my
earlier "not loaded" reading.

## ③ 🧱 THE FIX IS STRUCTURAL: THE CARD'S HEIGHT NO LONGER FOLLOWS THE TEXT
Buttons are `flex: 0 0 auto`; the blurb is the only thing that may give (`min-height: 0` + its own
`overflow-y: auto`). Height comes out of the words before it comes out of a tap target — this shell's
own rule, made structural instead of spent as spacing. **10px of clearance was one wrapped line from
failing, which is precisely what the runner was showing.**
Watched on the known-bad build: `Use taps instead` **−23 → +14**; `Switch it on →` **10 → −13 with
one line added** (the CI number) **→ +14 with four added**.

## ④ 🧪 THE SPEC, AND THE STRESS
`start-card.spec.ts` now covers **all 16 chapters that reach this card** (the 8 explore ones it was
written for + all 8 AR — ⚠️ its list was the eight that failed the day it was written, so it could
only ever re-catch those eight), asserts **both** AR doors exist, and asserts the property itself:
four extra lines of blurb must not push any control off. It also recognises a camera start button
(`Turn on the camera` has no arrow), which is why it had been reporting *"never reached a start
card"* for every AR chapter.
🔬 **`E2E_WIDE_TEXT=1`** widens every glyph's advance by 8% — deterministic anywhere, past the 5.1%
the two platforms differ by. **Dispatch-only (`wide_text` input), never on the timer**, where it
would become a red people re-run instead of read. ⚠️ It had to go in `start-card.spec.ts` too: with
the flag on and the pre-fix card restored, `all-chapters` at shortPhone reported **3 PASSED**,
because it enters by clicking the biggest control and never lands on the card. **On the known-bad
card it reproduces the CI failure verbatim on a Mac** — `top 288, −13px` — so it is a local proxy for
an environment I otherwise cannot reach.

## ⑤ 🚨 THE BIGGEST FINDING IS NOT A CHAPTER: A CHECK THAT HAS NEVER BEEN GREEN WAS NEVER A GATE
12 runs, 12 red, from the day the workflow was created (2026-08-19). Nobody read one, so ① sat in the
open inside it for seven nights. The founder's rule is now its own row in [CLAUDE.md](CLAUDE.md):
**a new CI job must go green on the commit that adds it, or it does not land.**
✅ And the job now tells someone — one issue on failure, updated in place, **closed by the first
green**. All three paths watched on a scratch branch rather than assumed: filed (#70, naming the
failing test and commit) → commented in place, no duplicate → **closed** on green. ⚠️ #70 was a
deliberate test of the alarm, not a regression; it is closed with a comment saying so.

## ▶ OPEN
1. 🕒 **GREEN IS NOT THE RESTING STATE YET — EVERY GREEN RUN SO FAR WAS HAND-DISPATCHED.**
   ⚠️ The SCHEDULE itself is proven to fire: an undispatched `schedule` run landed on `main` at
   09:48 UTC on 2026-08-31 — but on `9a4bcc3`, i.e. **before** #71 merged, so it reported the same
   four failures. It also predates the notifier, so it filed nothing. What has still never happened
   is **a scheduled run that is green on a main that contains the fix**, and until one does, the
   green above is a hand-dispatched result about a branch.
   📋 Check with `gh run list --workflow "Nightly E2E"` and look for `schedule` + `success` on a sha
   at or after `22d75fb`; the run should also close nothing, because nothing is open.
2. 🔴 **THE HULL SILENCE IS STILL UNMEASURED** — see the 🗒️ block. `docs/voice-check-for-tester.md`
   is ready to forward and `__miloSpeech()` is verified live on production.
3. ⏭️ **The `counting` case of `ready-bar.spec.ts`** is still flaky, untouched by this work.
4. 🔴 **CARRIED FORWARD FROM THE ARCHIVED 🔒 STAGE 3 BLOCK (moved 2026-08-31), because they are
   launch blockers and would otherwise leave this file with the block:**
   - **Step 3 — the watched test-mode purchase — is DEFERRED with a hard deadline: BEFORE STAGE 4.**
     Every link is tested; **nothing has watched a real Stripe event become a seat row.**
     [docs/billing-stage-3.md](docs/billing-stage-3.md) §0.
   - **B12: Supabase Pro** before any live key and before `enforced` is ever true. Founder's.
   - **`DRAFT = true` — the privacy policy and ToS are still placeholders.** You cannot charge a
     parent under a placeholder ToS.
   - **The free chapter set is still a PROPOSAL** (`billing_schema.sql` seeds Option A and says so).
   - **Nine Dependabot PRs open and untriaged** (#28–#47); do not merge as a batch.
   - Vercel Web Analytics still off; two prose-drift notes (the `error_events` fkey comment, and the
     anon-INSERT comments that say "not applied" when it was applied 2026-08-24).
5. ⏭️ **What the wide-text stress has NOT been run against**: the full 70 × 3 sweep. It was run on
   the start card (16/16) and on three chapters at shortPhone. One dispatch with `wide_text: true`
   would cover the rest; worth doing once after any layout change, not on the timer.

> 🗒️ **2026-08-30 — A SECOND TESTER PASS ON TWO 3–5 CHAPTERS, AND THE ONE CROSS-CUTTING ASK: EVERY CHAPTER NOW CARRIES A TYPED LINE OF DIRECTIONS. ⚠️ THE FIRST VERSION OF THAT FEATURE WAS CLIPPED ON ONE OF THE TWO CHAPTERS THAT ASKED FOR IT — A FLOATING CARD LAID OVER EIGHT CHAPTERS' OWN BANNERS — AND THE FIX WAS TO STOP STACKING, NOT TO RE-RANK.** `tsc` 0 · **1684 passed, 1 skipped by design** (see ⑤) · `next build` 0 · **26 mutations planted, 26 caught** · `e2e/directions` **8/8** · sw **v151**. **PR [#69](https://github.com/RadlorInc/learn/pull/69) OPEN — not merged; #68 merges first.**

**The feedback.** Shape House: *"instead of Milo saying 'yes' when the correct answer is chosen, he should say something along the lines of 'great job'"*, and *"when I got the hull part, Milo's voice seems to not speak."* Measuring: the title should be **Measuring**; *"Take one back"* should be **Add block** / **Remove block**; and — *"this goes for all chapters"* — **a little box in a corner with typed directions.**

## ① 🏠 SHAPE HOUSE — THE PRAISE, AND THE BEAT THAT WAS ACTUALLY SILENT
- The guided round said `Yes! The triangle fits!`; it says **`Great job!`** now. The scored rounds already rotate `core/praise.ts` (`Great job / Nice work / Well done / You got it / Lovely`) — verified by driving the chapter, not by reading it.
- ⚠️ **`opening` WAS DECLARED PER BUILD AND RENDERED NOWHERE.** The move from the house to the boat was a silent 850 ms pause with no word said or written — and **the hull is the first thing asked for once it is over**, which is exactly where the tester lost the voice. It is spoken AND written now, and the interlude holds **2100 ms**: the next round's question is spoken the moment it resolves and `speak()` cancels whatever is still talking, so a shorter hold cuts the line off mid-word.
- Also fixed in passing: the demo said *"the walls is missing"*. The square's label is `wall`.

## ② ⚠️⚠️ THE HULL SILENCE IS **NOT** FIXED, AND THE INSTRUMENT TO SETTLE IT IS THE DELIVERABLE
**What was measured:** driving the chapter with `speechSynthesis.speak` wrapped, every round — including *"The hull needs a rectangle"* — reached `speak()`. **That is the wrong question**, and it is the same wrong question that was asked the last time this was reported: it says the call happened, not that audio came out.
**The founder's hypothesis, which is the right one to test:** the known Chromium behaviour where synthesis stops after roughly fifteen seconds of cumulative speech, or on a long utterance, **with no error raised**. The hull is late in the sequence, so by then the chapter has spoken a lot.
⚠️⚠️ **AND IT CANNOT BE TESTED IN EITHER BROWSER THIS SESSION CAN DRIVE.** In the in-app pane AND in real Chrome under automation, **utterance ZERO never fires `start`** — on the app and on a blank page alike — while `speechSynthesis.speaking` stays `true` for ever. No audio is produced at all, so a run there is a world in which the bug cannot occur; a green or red from it would mean nothing.
✅ **So what shipped is the measurement, not a fix:** `speechDiary()` in `useMiloSpeaker.ts`, exposed as **`window.__miloSpeech()`**, recording per utterance `{text, at, started, ended, error}` (last 60, Milo's own lines only, **deliberately not dev-gated** — the fault only ever appears on a real device on production).
📋 **HOW TO SETTLE IT, on a device with a working voice:** play Shape House to the boat, and the moment the voice goes quiet run `__miloSpeech()` in the console.
- `hung > 0` (started, never ended) → **the Chromium stall is confirmed**; the mitigation is an unconditional `pause()/resume()` ping while speaking (today's keepalive only resumes `if (paused)`, which a stall does not set) plus keeping lines short.
- `silent > 0` with `engine.speaking: true` → the synth never started at all, which is a different fault and points at the device/voice, not at length.
- everything `started`+`ended` → the words were produced and the problem is elsewhere (volume, the clip path, the child's attention). **Do not claim any of the three without the numbers.**

## ③ 📏 MEASURING — TITLE AND CONTROLS
`Measurement` → **`Measuring`** (menu name and parent-dashboard label). **`Add block`** / **`↩ Remove block`**, visible text and `aria-label` both, gated as a pair so they cannot drift.

## ④ 🗒️ THE TYPED DIRECTIONS, IN ALL 72 CHAPTERS — AND WHY THE FIRST VERSION WAS WRONG
**The words come from the catalogue's own `hint`**, which is already `Record<ChapterType, …>`-complete: every chapter has a line **by construction**, and a second per-chapter map is exactly what would let one ship with none. Two hints were rewritten from topic to action (`shapes` → *"Tap the shape that fits the empty hole!"*, `measurement` → *"Lay blocks, then tap Done!"*).
- **12–18 (`GameShell`)**: a **flex child of the header row**, beside the chapter title. Dropped there as a `fixed` card first, it covered the title at 640×320 — measured. In the row an overlap is not expressible.
- **The 3–11 storybook chapters**: a small `pointerEvents: none` strip on the Menu row, wired once in `ChapterPortal` (+ counting's own wrapper), so 24 chapters get it from one place.
- ⚠️⚠️ **AND THE PART THAT WAS WRONG AND IS THE LESSON: A FLOATING STRIP ON THAT ROW IS EITHER OVER THE QUESTION OR UNDER IT.** Eight story chapters draw their own banner there — MeasureIt lifts its question pill to `pillTop(short) = 14` to buy height for the blocks, ShapeStudio and SeesawPark sit at `top: 12`, SliceShop and TickTock at `CHROME_PAD`, and BlockYard/BuildingBlocks use `yard.tsx`'s `BANNER_TOP`, which is **25px on a 720-tall frame**. Ranking the strip underneath them (z 42) kept the question readable and **clipped the directions to "Lay blocks to t…" on one of the two chapters the tester asked for**. Founder's call, and it is the right one: **do not stack — the chapter's own banner carries the line.**
  - `ownsChromeRow()` (in `features/chapters/directions.tsx`) suppresses the strip for those eight; `SkillBeat`'s prompt pill carries the line inline for the ones that have a pill, `yard.tsx`'s shared banner for BlockYard/BuildingBlocks, and **Milo's bubble** for SliceShop and TickTock — the two that set `prompt: () => ''`, whose scored rounds would otherwise show no directions at all.
  - ⚠️ **HopAlong is deliberately NOT on the list** even though its round row sits at `top: 40`: it renders no pill there (its ask is a pill at the bottom), so the strip has the row to itself. **Measured at 640×320, not assumed.**
- ⚠️ **The prose was the lever, exactly as chapter-craft says.** With the direction inline, MeasureIt's pill ran 86 → 553 and slid 10px under the ← Menu button; shortening the hint to *"Lay blocks, then tap Done!"* put it at 123 → 553, clear. A hint budget of 50 characters is gated, because both surfaces render one line.

## 🔬 VERIFIED BY MEASURING, AT 640×320, ON ALL EIGHT CHAPTERS THAT CARRY THE LINE THEMSELVES
`e2e/directions.spec.ts` (needs a dev server; not part of `npm test`). Three mechanisms per chapter,
none of which subsumes another — plus a fourth added when giving four chapters their own line made
their banner taller: the line must not move onto a control either.

⚠️⚠️ **THE FIRST VERSION OF THAT SPEC COULD NOT SEE THE DEFECT IT WAS WRITTEN FOR, AND THE FOUNDER
SPECIFIED IT.** Text equality + `scrollWidth`/`clientWidth` **passed on last session's clipped
build**: the whole string was in the DOM and the chapter's question pill was painted OVER it. **The
defect was occlusion, not overflow.** Re-written as a paint-order check it goes red naming
`BUTTON(z45) 192,12,447,57` — MeasureIt's own pill. ⚠️ And its own first draft skipped that button by
filtering on `position !== 'static'`; the covering pill IS static and takes its stacking from an
ancestor. **Two wrong instruments in a row for one defect.** The general rule is now the founder's,
at the top of [CLAUDE.md](CLAUDE.md): *an assertion that passes on the known-bad state is not a check.*

| chapter | carrier | box | rendered === hint | covered | on a control |
|---|---|---|---|---|---|
| Measuring | pill, inline | 352,31 → 496,45 | ✅ | none | none |
| Shape Studio | pill, inline | 334,63 → 495,77 | ✅ | none | none |
| Seesaw Park | pill, inline | 351,63 → 487,77 | ✅ | none | none |
| Slice Shop | Milo's bubble, own line | 85,73 → 574,87 | ✅ | none | none |
| TickTock | Milo's bubble, own line | 192,73 → 467,87 | ✅ | none | none |
| BlockYard + | yard banner, own line | 117,107 → 369,120 | ✅ | none | none |
| BlockYard − | yard banner, own line | 117,91 → 369,104 | ✅ | none | none |
| Building Blocks | yard banner, own line | 342,91 → 595,104 | ✅ | none | none |

⚠️ **AND FIVE OF THE EIGHT NEEDED A DIFFERENT SHAPE, WHICH ONLY LOOKING AT THE SCREEN SHOWED.**
Inline after a SHORT question in a pill is right (the three the feedback named). Forced into a wide
banner or a small bubble it breaks: SliceShop wrapped to `Halves, thirds and / quarters!` against the
right edge of a 610px bubble, BlockYard orphaned `numbers!` on a line of its own, and TickTock's
bubble is 13px on a short frame — 0.58em of that is **under 8px**. Those four (five chapters) take
`block`: its own centred line under the question, with a **floor** on the size so a small container
cannot shrink it away. Screenshots of all eight in `docs/verification/2026-08-31-directions/`.

## 🧪 24 MUTATIONS, 24 CAUGHT — AND ONE SURVIVED FIRST AND IS WORTH KEEPING
`src/__tests__/chapterDirections.test.ts`. Every check here is about a STRING A CHILD READS, which nothing else in the repo can see.
⚠️ **The one that survived: deleting `chapter="fractions"` from SliceShop's PLAY bubble left the gate green**, because the same chapter's LESSON banner carries the same string — the count-the-right-thing trap from CLAUDE.md, again. The check is anchored on the play call AND counts both occurrences now, and the same was done for TickTock.
⚠️ **The exception list is a claim about eight chapters' layout held in a ninth file**, so each entry is pinned to the expression it claims (`pillTop`, `CHROME_PAD`, `BANNER_TOP`): change one of those layouts and the gate fails rather than rotting.

## ⑤ 🟡 THE ONE SKIPPED TEST — NAMED, BECAUSE "1684/1685" READS AS GREEN AND IS NOT
`npm test` reports **1684 passed, 1 skipped**. The skipped one is
`src/__tests__/skillGraphAudit.test.ts › skill graph · edge sensitivity › ranks every edge by what a
wrong one would cost`.
- **Skipped, not failing and not flaky.** `describe.runIf(process.env.GRAPH_SENSITIVITY)` — opt-in,
  off by default because it re-runs every diagnosis once per edge. Nothing in it is
  non-deterministic; the flag is about runtime, not stability.
- **It passes when you run it:** `GRAPH_SENSITIVITY=1 npx vitest run src/__tests__/skillGraphAudit.test.ts`
  → **8 passed in 25.9s**, run 2026-08-31. A skip is not evidence, so it was run rather than assumed.
- **Pre-existing, not this branch's.** Introduced `d5f02ad` (2026-08-22, the skill-graph audit day)
  and byte-identical to `main` — `git diff main` on that file is empty.
📄 It is here so the next person does not rediscover it as a mystery, and so the headline number
stops being quoted as if the suite were wholly green.

## ▶ OPEN
1. 🔴 **THE HULL SILENCE IS UNRESOLVED AND UNMEASURED.** See ②. It needs one run on a device with a working voice and a paste of `__miloSpeech()`. **Nothing in this session may be read as having fixed it.**
   📄 **The deliverable is the note, not the diary**: [docs/voice-check-for-tester.md](docs/voice-check-for-tester.md)
   is written for the tester, assumes no technical knowledge, and is the thing to forward — ⚠️ **only
   once this is deployed**, or its last step answers `__miloSpeech is not defined` and they have spent
   their time for nothing.
2. 🎙️ Recorded clips for 3–11 remain the founder's to start (a voice choice and the ElevenLabs spend) — and if ② turns out to be the Chromium stall, clips route around it entirely for the lines that have them.
3. ⏸️ **PR [#69](https://github.com/RadlorInc/learn/pull/69) is open and NOT merged.** Merge order agreed with the founder: **#68 first** — which turned out to be already done (merged 2026-08-28, see 5) — then rebase #69 onto `main`, which was a no-op for the same reason. Both handoff blocks are present and neither replaced the other.
4. ⚠️ **The intro/demo screens of BlockYard, BuildingBlocks and HopAlong** show the line only where their banner or the pill renders; no chapter is left without it in a scored round, which is where it was asked for.
5. ⚠️⚠️ **AND A CORRECTION I OWE THIS FILE: I REPORTED PR #68 AS OPEN AND FLAGGED A `handoff.md`
   MERGE COLLISION WITH IT. BOTH WERE FALSE.** #68 merged on **2026-08-28 as `e2be6d2`**, three days
   before this session and BEFORE the commit this branch is based on — so it was already in `main`,
   there was never a collision, and the rebase was a no-op (`git merge-base --is-ancestor` says the
   branch already contains all of `main`). **Where the claim came from: this file's own ▶ OPEN item,
   written by the 2026-08-28 session hours before its PR merged, and never updated.** I read stale
   prose and repeated it as current fact without asking GitHub — the reader's half of CLAUDE.md's
   own rule, *do not amplify a finding past the evidence it arrived with*.
   ⚠️⚠️ **AND THE RELAY HAD TWO NODES, NOT ONE — the founder's own half, added by him.** He
   reconfirmed *"merge #68 first"* **twice, in two separate replies**, without checking GitHub
   either, and thanked me for flagging the collision. **A claim repeated back as an INSTRUCTION is
   what makes it look confirmed**: it stopped reading as my guess and started reading as the agreed
   plan, which is why neither of us looked for three exchanges. The producer's rule is *do not
   report what you have not watched*; the consumer's is *do not repeat it back as a decision*.
   Neither half catches this alone — the second is what turns an unverified line into a schedule. ✅ Every "#68 is open" line in this file is corrected
   below. **A PR's state is one `gh pr view` away; this file is not a source of truth for it.**
6. ⏭️ The `counting` case of `ready-bar.spec.ts` is still flaky (2026-08-28), unchanged by this work.

_Older sessions (2026-06-15 → **2026-08-28**, including 📏🎓 **the student-review days** (the run resumes, Ready everywhere, praise to 6–8, the number-tag overhang) and 🐇 **the line behind mother** (even spacing for one species, and the tautology guarding the approved picture), all moved 2026-09-03 — ⚠️ their still-live items (recorded clips for 3–11, the `counting` flake in `ready-bar.spec.ts`) are already carried in the 🌙 and 🗒️ blocks' ▶ OPEN; including 🔒 **Stage 3** (the chapter gate and the screens — a lock that names what is behind it, and a paywall built inert but tested refusing), moved 2026-08-31 — ⚠️ its still-live items (the deferred watched purchase, B12, `DRAFT = true`, the free-set pick, the nine Dependabot PRs, Vercel Analytics, the prose drift) were lifted into the 🌙 block's ▶ OPEN rather than archived with it; including 💳 **Stage 2b** (the price ladder, checkout and the webhook — and the finding I published without measuring it), 🧾 **Stage 2a** (the seat materialiser) and 🚪 **the funnel day** (the check became optional, the demo route, and the `onComplete` corpse), all moved 2026-08-30 — ⚠️ their still-live items (B12, `DRAFT = true`, the nine Dependabot PRs, Vercel Analytics, the anon-INSERT prose drift) were checked against the 🔒 Stage 3 block first and are all recorded there; including 💳 **the billing-schema apply day** (applied to production and completely inert, and the rollback capture that caught a migration silently reverting a security fix), moved 2026-08-28 — ⚠️ its still-live items (B12, the nine untriaged Dependabot PRs, and RLS gating the RECORD rather than chapter CONTENT) were checked against the newer blocks first and are all still recorded there; including 🧾💳 **the Stage-1 billing schema day** (RLS, entitlement, the guard at all three write paths), moved 2026-08-27; including 🧾 **the ledger-repair day** (58 repo migrations relabelled to the versions production recorded, `perf_advisors` applied, and the dry-run computed rather than credentialled), moved 2026-08-25 — ⚠️ its one still-live item (the anon-INSERT prose drift) was lifted into the current ▶ OPEN rather than archived with it; including 🔐 **the road-to-a-paywall day** (the RLS suite that had never run once, three privacy gaps between the published copy and the system, the anon INSERT closed, and the security regression caught four minutes after shipping), moved 2026-08-25 — ⚠️ its still-live blockers (B1/B2 `DRAFT = true`) were lifted into the current ▶ OPEN rather than archived with it; including 🚦 **the production-readiness day** (three workflows green while doing nothing, the dead error sink, eight chapters unstartable on a landscape phone), moved 2026-08-25; including 🔬 the seven-learner-models day (moved 2026-08-24), 🕸️ the skill-graph sensitivity audit and 🎯 the diagnostic's 96–98% rebuild, both moved 2026-08-24; plus 🇺🇸 the US-spelling / SEO / region-migration day, 🔗 the social-handles day, ❓ the question-quality sweep and 🎚️ the adaptive-loop day, all moved 2026-08-22) live in [docs/handoff-archive.md](docs/handoff-archive.md) — not loaded at session start. `grep` it for a chapter or a decision. Moved there to keep this file inside its size budget: the two 2026-08-14 blocks (🧱 all six neon chapters onto GameShell · 🎛️ the band moving onto the 12–18 engine) on 2026-08-16, 🏗️ **The Empty Plot** (the last neon chapter + the 3D deletion + the explainer-film pipeline) on 2026-08-17, 📊 **The Loading Bay** (the first storybook chapter onto GameShell, and the mastery exit finally seen to fire) and 🚀 **the first launch-hardening day** (0 security advisories, crash screens, self-hosted fonts, the enforced CSP, legal plumbing, the launch runbook) both on 2026-08-17, and 🔒 **launch hardening round two** (the walkthrough dead end, the CSP gate that had been red for a day, `media-src` silently killing the recorded voice on mobile) on 2026-08-18, and 🕳️ **the plan-pointer P0** (`ChapterPortal` dropping `onComplete`, so no child's diagnostic plan advanced for three months — plus the one-emoji-to-crawlers SEO fix and the inert short-landscape gate) on 2026-08-18, and 🧭 **the 2026-08-18 architecture/security/devops day** (the layering refactor, V13–V20, the two vacuous scheduled sweeps) on 2026-08-19, and ⚡ **the performance pass** (57 MB of art revalidated on every request, every backdrop shipped as full-size PNG, every creature journey relaying out the document — plus the /game fit controller that turned out to be dead code) on 2026-08-19, and 🛡️ **the five-role red-team day** (the AR camera door that could strand a child for ever, the placement check dying on one Back press, and the regression I shipped inside my own fix) on 2026-08-20, and — moved 2026-08-24 — 🚚 **The Packing Shed + The Minibus Run** (the two 9–11 chapters that closed the multiplication/division content hole) and 🎯 **the diagnostic rebuild** (26–34% → 81–87%, the answer-surface fix and the first accuracy gate), and — moved 2026-08-23 — 📐 **the tester's-four-bugs / responsiveness-sweep / `useOnceGuard` day** (the StrictMode ref guard that froze ten chapters' demos in dev only, 683 → 2 sub-44px tap targets, and 20/20 storybook coverage), and — on 2026-08-21 — ⚡ **the font pass** (Gaegu preloading 90 subsets), 🔎 **the public-SEO pass**, 🏷️ **the AdaptiveLearn rename**, and 🏗️ **the move onto the company account** (whose still-open items were carried forward into the 🧭 block rather than archived with it)._
