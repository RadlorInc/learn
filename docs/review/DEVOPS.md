# R6 — DevOps, reliability and monitoring (Radlic / RadlorInc/learn)

Reviewer: senior DevOps/SRE, Phase 1 (read-only). Tree: `w-review` at `origin/main` `06cee602`. Date 2026-09-26.
Sized for: Vercel Hobby + Supabase Pro (org `Radlor`) + GitHub Actions + Resend + Stripe test mode; tens of
families now, ~10k in 12 months. Evidence labels per RULES.md: **Measured**, **Reproduced**, **Suspected**.

GitHub run history, issues, secrets *names*, environments and branch protection were read with `gh` (GitHub, not
production). Public live-site GETs only (`radlic.com/api/health`, `radlic.com/sw.js`). No production database access;
the one production question I needed is in `docs/review/sql/devops-cron-and-size.sql` (needs Rafi to run).
Provider prices come from the public pricing pages fetched 2026-09-26 (Supabase `/pricing` and
`/docs/guides/platform/compute-and-disk`, Vercel `/pricing` and `/docs/cron-jobs/usage-and-pricing`, Resend
`/pricing`); every *usage* number in the cost section is an assumption and is labelled as one.

---

## 1. The deploy pipeline as it is today

```
push to main ──► deploy.yml
                 ├─ ci (verify: tsc, vitest, next build, npm audit ≈ 4.5 min · rls-tests ≈ 2 min)
                 ├─ migrations-changed (git diff before..sha -- supabase/migrations)
                 ├─ promote        needs: ci                 → git push HEAD:release  → Vercel builds `release`
                 ├─ migrate-staging needs: ci                 → SKIPPED (no STAGING_PROJECT_REF)
                 └─ migrate-prod   needs: ci, staging, changed → environment production-db (1 required
                                                                reviewer, admin bypass off) → assert-prod-ref.sh
                                                                → supabase link + db push
red-main.yml  ── on Deploy failure / daily 06:37 drift check → opens/comments a GitHub issue
```

- `.github/workflows/deploy.yml:39-54` promote; `:102-116` migrations-changed; `:118-153` migrate-prod;
  `:22-24` `concurrency: deploy-main, cancel-in-progress: false`.
- Vercel production branch is `release`; `vercel.json:3-7` disables deployments of `main`.
- **`promote` and `migrate-prod` are siblings, both `needs: ci`.** Promote does not wait for the database.
  **Measured** on run `35860176786` (PR #181, 2026-09-23): `promote` succeeded 12:28:06, `migrate-prod` ended
  **failure** 12:39:35 (the approval was deliberately rejected — LOOP-STATE §D4). The app was live 11 minutes before
  the database decision, and it stayed live on the old schema. That is the app-before-DB order working as designed;
  it is only safe because clients fall back on `PGRST202` (CLAUDE.md "schema and code must never be apart").

### Failure modes and what happens

| Fails | Effect on production | Who hears | Rollback path |
|---|---|---|---|
| `ci` | `release` does not move; prod keeps last good | red-main issue "main is red" (**Measured**: #78 comments) | none needed |
| `promote` | working code silently not live | red-main issue "promote failed" (open issues #99/#100 since 2026-09-13 — **nobody closed them**) | re-run job |
| Vercel build of `release` | prod keeps last good deployment; `release` ≠ live | **nothing in the repo** — red-main compares `release` vs `main`, not Vercel's live SHA (`red-main.yml:62-88`). Vercel's own email only | fix forward |
| `migrate-prod` rejected / fails | **app already live on old schema** | red-main says *"CI failed … `release` was not advanced, so this commit is **not** in production. That is the gate working."* — **false** (OPS-03) | re-run needs approval again; a later push without a migration **never retries it** (OPS-02) |
| `db push` fails mid-batch | earlier files of the batch applied, later not (**Suspected** — CLI applies file by file) | as above | forward-fix migration; whole-project restore from daily backup is the only undo (no PITR, see §6) |
| run waiting on approval | every later push queues behind it (concurrency); a third push **cancels** the second's pending run | nobody | approve or reject |

**Measured: 12 Deploy runs were cancelled while pending** (e.g. `36052284068`, `36052244588`, `36052178168` on
2026-09-24 20:02-20:03, zero jobs each). None of the 12 contained a migration (checked with
`git diff sha^1 sha -- supabase/migrations`), so nothing has been lost **yet** — but combined with the per-push diff
(OPS-02) the day one does, that migration is silently never applied.

### Rollback, app
`docs/runbooks/launch-day.md:136-160` has the proven route (revert + push forward, ~5 min, sw VERSION moves
*forward*) and the unproven one (Vercel Instant Rollback). Two facts the runbooks miss, from Vercel's own docs:
**on Hobby you can roll back only to the immediately previous deployment**, and **after any Instant Rollback Vercel
turns off auto-assignment of production domains — new pushes to `release` do not go live until "Undo Rollback"**.
`docs/runbooks/rollback.md:18-20` says "Promote previous → then revert on main and push", which after a rollback
would build and silently not go live. Rollback also reverts `vercel.json` crons (the B3-cancel drain) to the old
deployment's. (OPS-10)

### Rollback, DB
Forward-fix only. There are rollback scripts only for billing (`supabase/schema/rollback_2026082*.sql`, exercised in
CI `ci.yml:140-236`). `rollback.md:27` prescribes **PITR, which is a $100/mo add-on and not enabled as far as the
repo records** (Suspected — needs Rafi's dashboard). The real options are Supabase Pro daily backups (7 days,
in-place whole-project restore, loses everything since) and our own nightly encrypted dump (restore proven
2026-09-23, `docs/legal/05-information-security-program.md:37`). `migrate-prod` takes **no backup before
`db push`**; on D6 the manual backup finished **23 s** before the migration applied (`LOOP-STATE.md:339`). (OPS-08)

---

## 2. Downtime risks

**Deploy order.** App first, DB after human approval (above). Expand migrations are safe because of the client
fallbacks; **contract** migrations (drop/rename a column or function an older bundle still calls) are not, and
nothing in CI distinguishes them. At tens of families, a PR checklist line is proportionate; a tiny test that
refuses `drop column|drop function|rename` in a new migration file unless it carries a `-- contract-safe: <why>`
line is the cheapest mechanism. (OPS-06)

**Service worker takeover.** `public/sw.js:13-30`: `skipWaiting()` on install, `clients.claim()` on activate, and
activate deletes every `milo-*` cache not ending in the new VERSION. Since 2026-09-23 pages are network-first
(`sw.js:130-160`, gated by `swTakeover.test.ts`), which fixed the stale-shell bug. Residual risk:
an already-open tab keeps running the old bundle in memory; when it lazy-loads a chunk it asks the network, and
Vercel Hobby has **no Skew Protection** (Vercel pricing page) so the new deployment does not serve the old
deployment's `/_next/static/` files → a chunk-load error on the next in-app navigation (Suspected; Next usually
recovers with a hard navigation). Old bundles calling new RPC signatures are handled by the `PGRST202` retry
pattern. Minor: `APP_PAGES` precaches `/profile` and `/shop`, which no longer exist (`sw.js:10`, **Measured**:
`src/app/profile`, `src/app/shop` absent) — harmless because each `cache.add` is caught. (OPS-19)

**Locking migrations — calibrated.** 112 migration files. 42 `CREATE INDEX` without `CONCURRENTLY`; `SET NOT NULL`
on `learners` (`20260923170000:105`, `20260924100000:107-110`); `ADD COLUMN … NOT NULL DEFAULT <constant>`
(`20260924100000:26`, `20260918120000:46`, `20260905150000:59`); **zero** files set `lock_timeout`
(**Measured**, `grep -l lock_timeout` → 0). At today's sizes (learners in the tens) all of these take milliseconds —
constant-default `ADD COLUMN` is metadata-only on PG ≥ 11. They matter at ~10k families on the append-heavy tables
(`point_events`, `learner_events`, `lesson_progress`, projected millions of rows — assumption): a non-concurrent
index build blocks writes for seconds-to-minutes, and without `lock_timeout` a migration waiting on a lock queues
every later query behind it. **Not worth changing now**; add `set lock_timeout = '5s';` at the top of new migrations
that touch those three tables once they pass ~1M rows. (OPS-20)

---

## 3. Monitoring and alerting — what exists, and whether anyone hears it

| Signal | Where it lands | Retention | Does it reach Rafi? |
|---|---|---|---|
| server/client crash | `console.error` → Vercel logs; `error_events` via service-role (`src/infra/errorSink.ts:64-90`) | Vercel Hobby **1 hour**; table 90 days | **No.** Nothing reads `error_events` on a schedule |
| `MONITORING_INGEST_URL` seam | unset (docs/security.md "Manual steps") | — | No |
| Deploy/CI red | red-main issue | GitHub | Only if he watches issues. **Measured:** issues #78 (2026-09-05), #99, #100 (2026-09-13) still open; #78 has comments to 2026-09-23 |
| Backup failure | red job only (`backup.yml:89-106`) | — | **Measured: failed 13 nights (10–22 Sep) and was found by an audit**, not an alert (`docs/legal/16-audit-findings-and-actions.md:47`) |
| pg_cron job failure (7 prune/expire jobs) | `cron.job_run_details` | — | **No.** (OPS-07) |
| Vercel cron (B3-cancel drain) failure | `console.error` only (`src/app/api/consent/cancel-second-notice/route.ts:25`) — not even `sinkError` | 1 hour | **No.** A failed drain means a parent who withdrew consent may still get the B3 email |
| Uptime | `/api/health` exists, shallow, no DB call (`src/app/api/health/route.ts`); **Measured** 200 in 1.5 s | — | **No checker configured** that the repo records (Suspected; `docs/devops.md:149` lists it as a to-do) |
| Nightly E2E / weekly layout | green, **every sweep job skipped** (`nightly-e2e.yml:55-76`, **Measured** run `36115227699`: `chapters skipped`) | — | green tick, nothing tested (OPS-14) |

**GitHub scheduled workflows are not a pager. Measured:** `backup.yml` is `cron: '30 2 * * *'` and its scheduled
runs started at **07:41 (2026-09-24) and 08:00 (2026-09-25) UTC — 5 h 11 m and 5 h 30 m late.** GitHub's docs say
schedules "can be delayed during periods of high loads", and scheduled-failure emails go to "the user who last
modified the cron syntax" (the backup cron's last author email is `mrk@Mohammeds-MacBook-Air.local`, which may map
to no GitHub account — Suspected). So a 15-minute GitHub probe would fire hours late.

### The smallest setup that pages Rafi (proposal — $0)

1. **Outage in minutes — a free external uptime checker** (UptimeRobot / Better Stack free tier, 5-minute checks)
   on `https://radlic.com/api/health` and `https://radlic.com/auth`, alerting Rafi by email + phone push.
   **rafi**: it is a new vendor account (free). It receives only its own HTTP responses — `/api/health` returns
   `{"status","service","ts"}` and nothing else — so no child data can reach it. If Rafi declines a new vendor,
   the fallback is a GitHub `*/15` probe that opens an issue, knowing it can be hours late (measured above).
2. **Everything else once a day — one Vercel cron, `/api/cron/ops-digest`** (Hobby allows daily crons; the
   project already runs one, `vercel.json:8-10`). **own**, S–M, no new service, no new secret: it uses the
   `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` Production already holds. It emails a fixed address
   (`OPS_ALERT_EMAIL`) a subject of `OK` or `ATTENTION` with integers only:
   - `error_events` in the last 24 h (count), `42501`-shaped messages (count);
   - pg_cron runs failed in the last 24 h and jobs with no run in 48 h (counts + job *names*, which are ours);
   - B3-cancel queue rows older than 24 h (count); drain result of today's cron;
   - from GitHub's public API, no token (the repo is public): age of the newest `milo-db-backup-*` artifact,
     `main`-ahead-of-`release`, open red-main issues;
   - live `radlic.com/sw.js` VERSION vs `release`'s `public/sw.js` (catches a failed Vercel build of `release`).
   The DB part needs one function, `ops_counts()`, returning a fixed row of `bigint`/`timestamptz` columns,
   `SECURITY DEFINER`, `search_path` pinned, **revoked from public/anon/authenticated and granted to
   service_role** — the V19 rule plus the paired GRANT assertion CLAUDE.md requires (rls_regression: anon/
   authenticated refused, service_role allowed). Its route must *not* use the B3 drain's "no sign-in" pattern:
   require Vercel's `CRON_SECRET` bearer.
   **Why no child's name or answer can be sent:** (a) the function's return type is integers and timestamps — it
   cannot carry `error_events.message/stack/url/learner_id` by construction; (b) the email renderer takes a closed
   key list typed `number | ISO string`; (c) one unit test feeds a fake `error_events` row whose message contains
   a child-like name and asserts the rendered body does not contain it — watched red via `npm run break` with the
   renderer changed to include `message`. The absence of the daily email is itself the dead-man's switch.
3. **Route the existing GitHub issues to a person:** Rafi sets repo *Watch → Custom → Issues* with email (rafi),
   and closes #78/#99/#100 once read — a notice that stays open for three weeks is the "cries wolf" row of CLAUDE.md.
4. **Not worth it at this size:** Sentry/Datadog/log drains (log drains are Pro-only anyway), SLO burn-rate alerts
   (`docs/devops.md:162`), on-call rotation. Revisit at payments + ~1k families.

---

## 4. Staging

State: **no staging project.** PR #193 (merged 2026-09-23) prepared it: `scripts/seed-staging.mjs`,
`docs/staging.md`, and `deploy.yml` restores staging-first automatically when `STAGING_PROJECT_REF` is set
(`deploy.yml:118-130`, tested in `stagingPrep.test.ts`). The `staging` GitHub environment exists with **no
secrets** (**Measured**). READINESS.md:51 lists "Staging database before the first real family" as open.

What it takes (rafi, ~30 min + ~$10/mo): `docs/staging.md` §1 proposes a **Free** org. I'd put it in the
existing Pro org instead (~$10/mo Micro, per Supabase's compute page) because a Free project **pauses after
1 week of inactivity** (Supabase pricing) and `docs/staging.md:21-23` itself notes a paused staging blocks every
production migration. Also confirm what Vercel **Preview** deployments point at: LOOP-STATE.md:101 records the
service-role key "being removed from Preview", which implies Preview used production — every branch preview would
then be unreviewed code talking to children's data (Suspected; needs Rafi to read Vercel → Env). Preview → staging
is the half of staging that catches code-ahead-of-schema.

What it would have caught, honestly (real incidents):

| incident | caught by staging? |
|---|---|
| 2026-09-05 `p_started_at` sent before `sync_session` existed → PGRST202, completions to the offline queue (CLAUDE.md) | **Yes**, if Preview pointed at staging and someone clicked through before merge |
| 2026-09-05 `profile_role` enum vs production's `user_role` — rls-tests red on 5 commits (CLAUDE.md) | Yes, but CI already catches it now |
| 2026-09-23 migration ledger 26 rows vs repo 102 (LOOP-STATE §D4) | **Only** if staging were restored from a production backup rather than built from migrations |
| region-move auth trigger a schema dump does not carry | Yes (staging built from the baseline) |
| 2026-09-23 stale service-worker shell served the old add-child sheet | No — browser/cache class |
| radlor.com waitlist down 4 min, env var missing in the target project | No — env/config class |

---

## 5. Plans, limits, backups, cost

**Vercel Hobby → Pro (rafi, before payments).** Vercel's pricing page: Hobby is "for personal, non-commercial
use"; taking Stripe payments on it is outside that. Pro also buys: Skew Protection (§2), rollback to any past
production deployment (Hobby: previous only), 1-day runtime logs (Hobby 1 hour), per-minute crons, a private repo
(the public-repo reasons in `docs/devops.md:521-527` and OPS-09), and 1 TB transfer vs 100 GB. $20/mo per seat.
`docs/devops.md:446` measured Deployment Storage 53 GB / 10 GB on 2026-09-10; current value not visible to me.

**Supabase Pro (in use).** Sourced: $25/mo incl. $10 compute credit; 8 GB disk then $0.125/GB; 250 GB egress
then $0.09/GB; 100k MAU then $0.00325; **daily backups kept 7 days**; **PITR $100/mo per 7 days**; 7-day logs;
never paused. Micro 1 GB / 60 direct / 200 pooler; Small ~$15, Medium ~$60. pg_cron available (7 jobs in use).
⚠️ Repo docs still say the org is **Free**: `backup.yml:3-10` ("delete this workflow the day PITR is enabled"),
`docs/devops.md:21,117-121`; `docs/backup-restore-runbook.md:15-17` still lists all three backup secrets as "❌ not
set" (they were set 2026-09-23, **Measured** via `gh secret list`). (OPS-12)

**Backups and restore drills.** Nightly encrypted dump, 30-day artifacts; last 12 runs green (**Measured**).
**Last restore proof: 2026-09-23** (run #39 restored into a throwaway local DB, all 32 public tables matched —
`docs/legal/05-information-security-program.md:37`). `rollback.md:30` says "PITR restore drill (do quarterly)" —
a drill for a feature not bought. Proposed cadence: one restore of our own artifact per quarter + once after any
Supabase major upgrade (the 2026-09-23 rehearsal needed GoTrue/storage version pins, `backup.yml:31-52`).
Gaps: no backup before `migrate-prod` (OPS-08); backup does not call `assert-prod-ref.sh` (OPS-17); artifacts of
children's data (encrypted) sit in a **public** repo (OPS-09).

**Resend.** Free = 3,000/month and **100/day**; Pro $20 = 50,000, no daily cap (sourced). Every parent sign-up
sends B0 then B3 next day. Which plan the account is on is not in the repo (rafi). A launch-day spike past ~50
sign-ups/day on Free would refuse consent emails. (OPS-15)

### Cost estimate (usage figures are ASSUMPTIONS; unit prices sourced as above)

| | now (tens) | 1k families | 10k families |
|---|---|---|---|
| Vercel | Hobby $0 | Pro $20 | Pro $20 + overage: assume ≤1 TB transfer (≈20 KiB/clip × ~24 clips/topic + ~1.5 MB JS, mostly SW-cached) → $0–60 |
| Supabase | Pro $25 (Micro inside credit) | $25 (+$5 if Small) | $25 + Small/Medium ($5–50 net) ; disk ≤ 8 GB (assume lesson_progress ≤ 282 rows/child × 15k children ≈ 4M rows ≈ 1–2 GB); MAU ~25k parents+child logins < 100k → $0 |
| PITR (optional) | — | $100 (recommend once payments are live) | $100 |
| Resend | $0 (if Free) | $0–20 | $20 |
| Staging | — | ~$10 | ~$10 |
| **Total / month** | **~$25** | **~$55–75** (+$100 PITR) | **~$80–185** (+$100 PITR) |

Run `docs/review/sql/devops-cron-and-size.sql` Q2/Q3 to replace the size assumptions with a per-family number.

---

## 6. CI health

- **Runtime (Measured, last 3 main deploys):** `ci / verify` 251–277 s, `ci / rls-tests` 108–122 s, promote 33–90 s
  → push-to-`release` ≈ 5–6 min, then Vercel's build.
- **Flakes (Measured, last 100 CI runs):** 2 `rls-tests` failures at "Start local Postgres" (image-pull, the ghcr
  rate-limit class already mitigated in `ci.yml:77-84`); 1 re-run to green (`36032268052`). The rest were real
  (typecheck/build/unit on feature branches, 2 Dependabot bumps red today).
- **Node:** CI uses `node-version: 20` (`ci.yml:20`, `nightly-e2e.yml:86`, `weekly-layout.yml:75`); `package.json`
  has **no `engines`**, no `.nvmrc`; Next requires `>=20.9.0`. Node 20 reached end-of-life in April 2026. The
  Vercel project's Node version is not in the repo (BLOCKED — Rafi: Vercel → Settings → Build). CI and production
  may be building on different majors. (OPS-16)
- **Playwright runs nowhere in CI.** 23 specs in `e2e/`; the only two workflows that run Playwright skip their test
  job while `LEGACY_CHAPTERS_HIDDEN = true` (**Measured**: `chapters skipped`, `layout skipped`), and nightly also
  names `e2e/start-card.spec.ts`, which no longer exists (`nightly-e2e.yml:139`). Consent, sign-up, short-sessions
  and landing-redirect specs run only on laptops (handoff 🌐 item 4). (OPS-14)
- **No `timeout-minutes`** on `ci.yml` jobs or any `deploy.yml` job (**Measured**; only nightly/weekly have one).
  Default is 360 min. The handoff records a real vitest hang (`int`) — in CI it would hold the `deploy-main`
  concurrency slot for 6 h, blocking every deploy. (OPS-18)
- **Third-party actions by tag** (`supabase/setup-cli@v1`, `actions/*@v4`), `allowed_actions: all`,
  `sha_pinning_required: false` (**Measured**) — and `setup-cli` runs in the jobs that hold the account-wide
  Supabase token. Pin the three actions to SHAs. (OPS-13)

---

## 7. Other findings in detail

**OPS-01 — the production-db approval is a convention, not a mechanism.** **Measured:** `PROD_DB_PASSWORD` and
`SUPABASE_ACCESS_TOKEN` are **repository** secrets (`gh secret list`); `production-db` and `staging` hold **no**
environment secrets; `main` and `release` have **no branch protection** (API 404 "Branch not protected"). Any
workflow file on **any pushed branch** (`on: push`) receives both, can `supabase link` + `db push`/`db dump`
against production, and never meets the required reviewer. `SUPABASE_ACCESS_TOKEN` is a personal access token:
account-wide, it can also delete or pause projects. The CLAUDE.md hard rule ("production's schema changes ONLY
through workflows behind `production-db`") exists because an agent accidentally ran `db push`; agents push
branches with Rafi's credentials daily. Fix (rafi, S): move both into the `production-db` environment; give the
backup job its own environment (e.g. `prod-backup`) with **deployment branches = `main` only** and no reviewer, so
the nightly still runs unattended but a branch workflow cannot read it; replace the PAT with a token from a
dedicated Supabase user limited to the one project if Supabase's roles allow (Suspected — check).

**OPS-02 — a migration that was not applied is never retried. Reproduced**
(`review-scratch/devops/migrations-changed-gap.sh`, exit 1 = gap; positive control: the migration push itself
reports `changed=true`). `deploy.yml:112` diffs only `github.event.before..github.sha`. After a rejected or failed
`migrate-prod`, or a pending run cancelled by `concurrency` (12 measured), the next push without its own migration
reports `changed=false` and skips `migrate-prod` — while the app half keeps deploying. Fix (own, S): diff from the
head SHA of the last Deploy run whose `migrate-prod` job **succeeded** (`gh api …/actions/workflows/deploy.yml/runs`),
not from `event.before`; fail closed (treat "cannot determine" as changed).

**OPS-03 — red-main tells the reader the opposite of the truth when `migrate-prod` fails. Measured:** issue #78
comments at 2026-09-23 12:39:45 and 13:40:49 name `Failed job(s): migrate-prod` under the text "`release` was not
advanced, so this commit is **not** in production. That is the gate working." — `promote` had succeeded 11 minutes
earlier. `red-main.yml:94-111` only distinguishes "promote" from "everything else". Fix (own, S): a third branch for
`migrate-prod`: "🔴 app is LIVE, database NOT migrated", plus the pending-migration list.

**OPS-07 — scheduled jobs that keep legal promises fail silently.** 7 pg_cron jobs (retention prunes, consent
expiry, unconfirmed-user prune) and the daily Vercel B3-cancel drain have no failure signal (§3). Suspected (read
from code); `docs/review/sql/devops-cron-and-size.sql` Q1 answers it for today. Folded into the ops digest.

**OPS-09 — encrypted dumps of children's data are published in a public repo. Measured:** the artifact list is
readable anonymously (`curl …/actions/artifacts` → 16 `milo-db-backup-*`); download needs a GitHub login (401
anonymous). Per GitHub docs any signed-in GitHub user can download artifacts of a public repo (Suspected — not
attempted with a non-member account). Contents are AES-256-CBC, PBKDF2 200k, 32-byte random passphrase
(`backup.yml:138`, `docs/backup-restore-runbook.md:40`) — strong today, but ciphertext of every child's records is
now permanent third-party-downloadable material for 30 days per night, and its safety rests on one passphrase
never leaking. `backup.yml:12-15` reasons about "anyone with repo access", which for a public repo is everyone.
`migrate-region.yml:3` already applied the right rule ("the repo is public, so a dump … must never be
uploaded"). Fix (rafi): make the repo private once Vercel is Pro, or ship the artifact to a private store.

**OPS-10 — rollback runbook would misfire at 2am.** `rollback.md:18-20` (Instant Rollback then push a revert —
auto-assign is off after a rollback, the revert will not go live; Hobby can only go back one deployment);
`:27,:30-34` PITR not bought; `:28` `apply_migration` via MCP and `:40` `psql "$PROD_DB_URL" -f rls_regression.sql`
both contradict the ⛔ no-production rules (and the suite writes, in a rolled-back transaction, as superuser);
`:53` contacts "(Fill in)". Docs-only fix (own, S).

---

## 8. Production-readiness checklist

| item | done/missing | owner | evidence |
|---|---|---|---|
| CI gates production (red CI ⇒ no deploy) | done | — | `deploy.yml:39-54`; Vercel prod branch `release` |
| RLS suite runs in CI and cannot skip | done | — | `ci.yml:47-114` |
| Migrations to prod only behind human approval | **partly** — approval exists, secrets reachable without it | Rafi | OPS-01 |
| Unapplied migration retried / flagged | missing | agent | OPS-02 (Reproduced) |
| Correct alert when DB migration fails after app promote | missing | agent | OPS-03 (#78) |
| Backup before every production migration | missing | agent | OPS-08; LOOP-STATE:339 (23 s margin) |
| Nightly encrypted backup, green | done | — | 12/12 recent runs success |
| Restore proven | done 2026-09-23; no cadence | agent (runbook) / Rafi (run) | doc 05:37 |
| PITR | missing (not bought) | Rafi / provider ($100/mo) | Supabase pricing; rollback.md:27 |
| Backups not in a public place | missing | Rafi | OPS-09 |
| Uptime checker paging a phone | missing | Rafi (free account) | §3 |
| Daily digest: errors, cron failures, backup age, drift, live version | missing | agent | §3 |
| pg_cron / Vercel-cron failure visibility | missing | agent | OPS-07 |
| Red-main issues read and closed | missing (3 open 1–3 weeks) | Rafi | #78 #99 #100 |
| Rollback runbook correct for Hobby + no-prod rules | missing | agent | OPS-10 |
| Staging project + Preview env on staging | missing | Rafi (~$10/mo) | READINESS:51; OPS-11 |
| Vercel Pro before payments | missing | Rafi / provider ($20/mo) | Vercel pricing: Hobby non-commercial |
| Resend plan sized for sign-up spikes | unknown | Rafi | OPS-15 |
| Playwright in CI for consent / sign-up / sessions | missing | agent | OPS-14 |
| Node version pinned and equal in CI and Vercel | missing | agent (+Rafi reads Vercel) | OPS-16 |
| Job timeouts | missing | agent | OPS-18 |
| Actions pinned to SHAs | missing | agent | OPS-13 |
| Branch protection on `main`/`release` | missing | Rafi | API 404 |
| Plan facts in docs current | missing | agent | OPS-12 |

---

## Findings table

| ID | title | area | severity | evidence | effort | when | bucket | files |
|---|---|---|---|---|---|---|---|---|
| OPS-01 | Prod DB password and account-wide Supabase PAT are repo-level secrets; any branch workflow reaches production without the `production-db` approval; no branch protection | secrets / deploy | High | Measured | S | fix now | rafi | `.github/workflows/deploy.yml:118-153`, `backup.yml:89-119`, repo settings |
| OPS-02 | `migrations-changed` diffs only the current push → a rejected/failed/cancelled-pending migration is never retried while app deploys continue | deploy | High | Reproduced (+12 cancelled runs Measured) | S | fix now | own | `deploy.yml:102-130`; `review-scratch/devops/migrations-changed-gap.sh` |
| OPS-04 | Nobody is paged: crashes, outages, backup failures reach no person (backup red 13 nights unnoticed; 1 h Vercel logs; GitHub cron 5 h late) | monitoring | High | Measured | M | fix now | own (digest) + rafi (uptime account, issue watching) | `src/infra/errorSink.ts`, `vercel.json`, `.github/workflows/*` |
| OPS-07 | pg_cron retention/consent jobs and the daily B3-cancel Vercel cron fail silently (legal promises, withdrawn parent may get B3) | monitoring / consent | High | Suspected (SQL for Rafi) | S | fix now (with OPS-04) | own | `src/app/api/consent/cancel-second-notice/route.ts:25`, `supabase/migrations/*cron*`, `docs/review/sql/devops-cron-and-size.sql` |
| OPS-03 | red-main reports a failed `migrate-prod` as "not in production, the gate working" while the app is already live | alerting | Medium | Measured | S | fix now | own | `.github/workflows/red-main.yml:94-111` |
| OPS-08 | No backup taken before `migrate-prod`; D6 margin was 23 s | deploy / backup | Medium | Measured | S | fix now | own | `deploy.yml:118-153`, `backup.yml` |
| OPS-09 | Encrypted children's-data dumps published as artifacts of a public repo (listable anonymously) | backup / privacy | Medium | Measured (listing) / Suspected (download by any GitHub user) | S | before first real family | rafi | `backup.yml:149-155` |
| OPS-06 | App promotes before DB approval; approval wait blocks all later deploys; contract migrations unguarded | deploy | Medium | Measured | S | after beta | own | `deploy.yml:22-24,39-153` |
| OPS-10 | Rollback runbook wrong for Hobby (auto-assign off after rollback, one step back only), relies on unbought PITR, and instructs prod `psql`/MCP writes | runbooks | Medium | Measured (docs) + sourced Vercel docs | S | fix now | own | `docs/runbooks/rollback.md:18-53` |
| OPS-11 | No staging; Preview deployments may point at production; Free-org staging would pause and block prod migrations | environments | Medium | Measured (no env secrets) / Suspected (Preview env) | M | before first real family | rafi | `docs/staging.md`, Vercel env |
| OPS-05 | Vercel Hobby for a commercial product: non-commercial ToS, no Skew Protection, 1 h logs, previous-only rollback, public repo forced | platform | Medium (blocker before payments) | Measured (sourced pricing) | S | before payments | rafi | `vercel.json` |
| OPS-14 | Playwright runs nowhere in CI; nightly/weekly green while skipping; nightly names a deleted spec | CI | Medium | Measured | M | after beta | own | `.github/workflows/nightly-e2e.yml:55-139`, `weekly-layout.yml:44-116`, `e2e/` |
| OPS-15 | Resend plan unknown; Free caps 100 emails/day, which a sign-up spike exceeds (B0 + B3 per parent) | email | Medium | Suspected | S | before launch push | rafi | Resend account |
| OPS-13 | Third-party actions pinned by tag in jobs holding prod secrets; `allowed_actions: all` | supply chain | Medium | Measured | S | after beta | own | `.github/workflows/*.yml` |
| OPS-16 | CI on Node 20 (EOL), no `engines`/`.nvmrc`, Vercel Node version unknown | CI | Low | Measured / BLOCKED (Vercel) | S | after beta | own | `ci.yml:20`, `package.json` |
| OPS-18 | No `timeout-minutes` on CI/deploy jobs; a known vitest hang would hold the deploy queue 6 h | CI | Low | Measured | S | after beta | own | `ci.yml`, `deploy.yml` |
| OPS-12 | Docs say Supabase Free / secrets unset (stale); backup.yml says delete itself when PITR is on | docs | Low | Measured | S | fix now | own | `backup.yml:3-10`, `docs/devops.md:21,117`, `docs/backup-restore-runbook.md:15-17` |
| OPS-17 | Backup job trusts `PROD_PROJECT_REF` without `assert-prod-ref.sh` | backup | Low | Measured | S | after beta | own | `backup.yml:113-119` |
| OPS-19 | SW precaches removed routes; old open tabs can hit chunk 404s after takeover (no Skew Protection on Hobby) | frontend ops | Low | Measured (routes) / Suspected (chunk errors) | S | later | own | `public/sw.js:10-30` |
| OPS-20 | No `lock_timeout`, non-concurrent indexes, `SET NOT NULL` scans — harmless now, matters on big tables at ~10k families | migrations | Low | Measured | S | later — not worth it until tables pass ~1M rows | own | `supabase/migrations/*` |
| OPS-21 | `/api/health` is shallow (no Supabase/auth check, no version) | monitoring | Low | Measured | S | with OPS-04 | own | `src/app/api/health/route.ts` |
