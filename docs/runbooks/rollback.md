# Runbook: rollback & incident response

Short enough to follow at 3 a.m. **Code** and **data** roll back separately, and on this stack they
roll back very differently: code in minutes, data only forwards.

⛔ **Nothing in this runbook writes to production by hand.** No `psql`, no Supabase MCP, no Supabase
CLI against the live project (CLAUDE.md's hard rules); `src/__tests__/runbookNoProdWrites.test.ts`
fails the build if any runbook instructs one. Production's schema changes only through `deploy.yml` →
`migrate-prod` behind the `production-db` environment (required reviewer). Production is read only
through SQL Rafi runs himself in the Supabase SQL editor.

## Quick reference

| Symptom | Action |
|---------|--------|
| Bad deploy (app broken, errors spiking) | **Roll back code**: revert and push (route B), or Instant Rollback (route A) **and later Undo Rollback** |
| Bad migration (data wrong / RLS hole / broken query) | **Forward-fix migration** through `migrate-prod`; whole-project restore only for real data loss |
| Site down / 5xx | `/api/health`, https://www.vercel-status.com, https://status.supabase.com |
| Auth broken | Supabase Auth status + recent Auth config changes (dashboard, Rafi) |
| Suspected breach / RLS-denial spike | "Security incident" below |

## Roll back code

Full commands: [`launch-day.md`](launch-day.md) → *"The two routes that do work"*.

⚠️ **Pointing `release` at an older commit deploys nothing.** Vercel already built that commit, so no
new deployment appears (measured 2026-09-09, recorded in launch-day.md). Do not do it.

### B — revert and push forward (proven, ~5 min, needs no approval): the default

1. `git revert <bad-sha>` on `main`; **move `public/sw.js` VERSION forward**, never back.
2. Push. `deploy.yml` runs CI, `promote` moves `release`, Vercel builds and serves it.
3. Confirm: `curl -sI https://radlic.com/api/health` → 200, then spot-check the broken flow.

### A — Vercel Instant Rollback (faster; read all three limits first)

Vercel dashboard → project → Production Deployment tile → **Instant Rollback**. The limits, from
Vercel's docs (https://vercel.com/docs/instant-rollback — page dated 2026-07-07, read 2026-09-26):

1. **Hobby goes back ONE deployment only** ("Hobby users can roll back to the immediately previous
   deployment"). If the previous one is also bad, use route B.
2. **After a rollback, Vercel turns off auto-assignment of production domains.** Later pushes to
   `release` build but **do not go live** until the rollback is undone: Production Deployment tile →
   **Undo Rollback** → choose the deployment → Confirm. So the whole sequence is: roll back → fix on
   `main` (route B) → wait for that production build → **Undo Rollback onto it**. Skip the last step
   and every later deploy silently stays off production.
3. **Cron jobs revert to the rolled-back deployment's `vercel.json`**, and env vars are not re-read.
   Check that the consent B3-cancel cron (`/api/consent/cancel-second-notice`) exists in the version
   you rolled back to.

These limits are for Vercel **Hobby**, the plan the project was on as recorded by the 2026-09-26
review (`docs/review/DEVOPS.md` §5). Pro lifts limit 1. If the plan changes, re-read Vercel's page rather than this paragraph.

## Roll back data (migrations)

Migrations are expand/contract and the client tolerates both shapes (CLAUDE.md, "the schema and the
code must never be apart"), so **a code rollback alone fixes most incidents**. Touch the database only
if a migration itself corrupted or exposed something.

1. **Forward-fix: the routine route.** Write a new corrective migration in `supabase/migrations/`, open
   it as a Draft PR, get it reviewed, merge. `deploy.yml`'s `migrate-prod` starts on that push (it runs
   only when the push changed a migration file), waits on the `production-db` approval, and Rafi
   approves it. To undo one object (a policy, a function), the migration re-creates its previous
   definition, copied from the migration that last defined it with only named lines changed — never
   retyped. A `SECURITY DEFINER` / `search_path` / owner / grant change is a security change and the PR
   says so.
2. **Only when the pipeline itself cannot run** (GitHub down, the job broken): **Rafi** pastes the
   reviewed migration into the Supabase SQL editor himself, and it is committed to `main` straight
   afterwards so git and production agree. An agent never does this step.
3. **Whole-project restore — real data loss only.** There is **no point-in-time recovery**: PITR is a
   paid Supabase add-on and nothing in the repo records it being bought (as of 2026-09-26). What exists:
   - Supabase's daily backups (Pro; kept 7 days per Supabase's pricing page). A restore replaces the
     **whole project** and loses everything written since. Rafi, in the dashboard.
   - Our nightly encrypted dump, `.github/workflows/backup.yml`; restore steps in
     [`docs/backup-restore-runbook.md`](../backup-restore-runbook.md). Restore into a **throwaway**
     database, verify, then decide. Announce downtime before any restore that touches production.

## Restore drill (quarterly)

Follow [`docs/backup-restore-runbook.md`](../backup-restore-runbook.md): restore the latest nightly dump
into a throwaway local database, run `supabase/tests/rls_regression.sql` against that copy, compare row
counts with the counts Rafi reads in the SQL editor, and record the wall-clock restore time (the data
RTO). Nothing in the drill touches the live project.

## Security incident (RLS-denial spike / suspected cross-tenant access)

1. Recent `42501` errors and auth failures: Vercel logs (Hobby keeps about an hour), Supabase logs in
   the dashboard, and `error_events` through SQL Rafi runs in the SQL editor.
2. The boundary **as written in the repo**: `ci / rls-tests` rebuilds the schema from every migration
   on a throwaway Postgres and runs `supabase/tests/rls_regression.sql` — re-run it on the latest `main`.
   The boundary **as live in production**: put the catalog queries from
   [`docs/security.md`](../security.md) → *Schema drift check* into `docs/legal/sql/`, ask Rafi to run
   them, and diff his output against `supabase/schema/security_baseline.sql`.
3. A policy regressed: corrective migration through `migrate-prod` (above), then refresh the baseline
   from Rafi's output and review the diff.
4. Credentials leaked: rotating the anon key is NOT enough (it is public; the gate is RLS + JWT). Rafi
   rotates the leaked secret at its source, force-expires sessions in Supabase Auth if needed, updates
   the GitHub secret / Vercel env var, and redeploys (Vercel env vars bind at deploy time).

## Contacts / escalation

- Vercel status: https://www.vercel-status.com
- Supabase status: https://status.supabase.com
- Production project ref: read the literal in `scripts/assert-prod-ref.sh`, not a copy in prose (a
  stale copy in this file named the decommissioned Sydney project for four days in September 2026).
- Rafi holds the Vercel, Supabase, GitHub and Stripe accounts, is the only `production-db` reviewer,
  and is the only person who runs SQL on production. As of 2026-09-26 there is no second on-call: if
  Rafi cannot be reached, route B (revert and push, no approval needed) still works; every database
  step waits for him.
