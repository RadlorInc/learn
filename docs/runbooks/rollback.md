# Runbook: rollback & incident response

Keep this short enough to follow at 2am. Two independent axes — **code** and **data** — roll
back separately.

## Quick reference

| Symptom | Action |
|---------|--------|
| Bad deploy (app broken, errors spiking) | **Roll back code** → Vercel promote previous |
| Bad migration (data wrong / RLS hole / broken query) | **Roll back data** → PITR, or forward-fix migration |
| Site down / 5xx | Check `/api/health`, Vercel status, Supabase status |
| Auth broken | Supabase Auth status + recent Auth config changes |
| Suspected breach / RLS-denial spike | See "Security incident" below |

## Roll back code (instant, atomic)

1. Vercel dashboard → project → **Deployments** → pick the last known-good production deployment → **Promote to Production**. Instant, no rebuild.
2. Confirm: `curl -sI https://<prod>/api/health` → 200, and spot-check the broken flow.
3. Revert the offending commit on `main` (`git revert <sha>` → push) so the next deploy doesn't re-break.

## Roll back data (migrations)

Migrations are expand/contract + backward-compatible, so **code rollback alone fixes most incidents** (old code works against the new schema). Only touch data if the migration itself corrupted or exposed something.

1. **Forward-fix (preferred):** write a new corrective migration, run through `deploy.yml` (staging → prod approval). Never hand-edit prod.
2. **PITR (data loss/corruption):** Supabase → Database → Backups → **Point-in-Time Recovery** → restore to a timestamp just before the bad change. This is a **destructive restore** — restore into a **new/staging project first**, verify, then cut over. Announce downtime.
3. **Emergency single-object revert:** re-apply the prior version of a policy/function via `apply_migration` (as done in the security pass), then commit the migration file so prod and git match.

## PITR restore drill (do quarterly)

1. Trigger a PITR restore of prod → a throwaway staging project at "now − 1h".
2. Run `psql "$STAGING_DB_URL" -f supabase/tests/rls_regression.sql` against it → must pass.
3. Spot-check row counts vs prod. Tear down. Record the wall-clock restore time (that's your data RTO).

## Security incident (RLS-denial spike / suspected cross-tenant access)

1. Pull recent `42501` errors + auth failures from the log drain / Supabase logs.
2. Run the RLS regression suite against prod (rolled back) to confirm the boundary still holds:
   `psql "$PROD_DB_URL" -f supabase/tests/rls_regression.sql` (see [`docs/security.md`](../security.md)).
3. If a policy regressed: ship a corrective migration immediately + regenerate `supabase/schema/security_baseline.sql` and diff.
4. If credentials leaked: rotate the Supabase anon key is NOT enough (it's public) — the real gate is RLS + JWT; force-expire sessions via Supabase Auth if needed.

## Contacts / escalation

- Vercel status: https://www.vercel-status.com
- Supabase status: https://status.supabase.com
- Prod project ref: `qaymxunzlarwusogwyak`
- (Fill in) on-call, escalation, and the Supabase/Vercel account owners.
