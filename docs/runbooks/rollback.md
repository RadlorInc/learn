# Runbook: rollback

**Use this when:** production is broken after a deploy, or a migration made the data or the access rules wrong.

Code and data roll back separately.
- **Code** rolls back in minutes.
- **Data** only moves forward: a fixing migration, or, for real data loss, a restore.

Nothing in this runbook writes to production by hand. Never use `psql`, the Supabase MCP or the Supabase CLI against the live project.

## Which one

| What you see | Do |
|---|---|
| The app is broken, errors are spiking, a screen is wrong | **Code rollback**, route A or B below |
| A migration broke a query, a policy or a grant | Code rollback first if the app is failing. Then a **forward-fix migration** |
| Rows were lost or corrupted | Stop writes if you can, then read **Restore** below. The founder decides |
| Site down or 5xx everywhere | Check `/api/health`, then the Vercel and Supabase status pages, **before** rolling anything back |

Migrations here are expand/contract, and the app tolerates both shapes. So a code rollback alone fixes most incidents.

## Code rollback

**Agent, first.** Hand the founder the target in chat: the last good commit and its Vercel deployment. Read them from GitHub's deployment records, the same way as [deploy.md](deploy.md) step 5.

### A — Vercel Instant Rollback (founder only, fastest, no build)

1. **Founder.** Vercel dashboard → the project → the target deployment → **Instant Rollback**.
2. **Founder.** Know the consequence (from Vercel's Instant Rollback docs, read 2026-09-26; re-read them before relying on this): after a rollback, Vercel **stops assigning new builds to production** until you press **Undo Rollback**. So the full sequence is:
   - roll back;
   - fix on `main` (route B);
   - wait for that build;
   - **Undo Rollback** onto it.

   Skip the last step and every later deploy silently stays off production.
3. Crons revert to the rolled-back deployment's `vercel.json`, and env vars are not re-read. Check that the `/api/consent/cancel-second-notice` cron exists in the version you rolled back to.
4. On Hobby only the previous deployment was eligible. The project moved to Pro on 2026-09-27 (founder), where earlier deployments are eligible too.

### B — revert and ship forward (needs no Vercel access)

1. **Agent.** `git revert <bad sha>` on a branch from `main`. Move `VERSION` in `public/sw.js` **forward**, never back: a browser that already cached a version keeps its old shell.
2. **Agent.** Open a Draft PR. **Founder** marks it Ready and merges.
3. CI gates it like any deploy. Measured 2026-09-09: 280 s from push to production serving it. If CI is red, route B cannot ship, and A is the only way.
4. **Agent.** Follow [deploy.md](deploy.md) steps 7–9: that SHA's Deploy run, READY on it, `npm run smoke:live`.

## Data rollback

### Forward-fix (the normal route)

1. **Agent.** Write a new migration that puts the previous state back. For a function or policy:
   - copy the definition from the migration that last defined it, or from `pg_get_functiondef` output the founder ran;
   - change only named lines;
   - never retype it.

   Adding or removing `SECURITY DEFINER`, changing `search_path`, an owner or a grant is a security change. The PR says so.
2. Then follow [migrations.md](migrations.md) in full: before-SQL, backup, merge, `production-db` approval, proof-SQL.
3. `supabase/schema/rollback_20260824_billing.sql` and `rollback_20260825_seat_materialiser.sql` are exercised by CI on every run. If one is ever needed on production, it goes in as a migration through the same path.

### Restore (real data loss only; founder)

There is no point-in-time recovery. PITR is not recorded as bought; the founder can confirm in the dashboard. Two copies exist:
- **Supabase's daily backups** (Pro, kept 7 days). A restore replaces the **whole project** in place and loses everything written since. Founder only, in the dashboard, with downtime announced.
- **Our encrypted dumps.** They come from the nightly `backup.yml`, plus `milo-db-backup-premigrate-<run id>`, which every `migrate-prod` run takes just before it applies anything. Restore them into a **throwaway local** database first ([backup-restore.md](backup-restore.md)), then decide.

No rehearsed path exists for putting selected rows back into production. Write one and rehearse it on a local stack before using it. A dump holds children's data, so no part of it ever goes into a migration file, a PR or git.

Never restore a deleted child's record from a backup. See [../legal/06-parent-rights-procedure.md](../legal/06-parent-rights-procedure.md).

## Security incident (a spike of `42501` denials, a suspected cross-family read, a leaked secret)

1. **Founder.** Read the Supabase and Vercel logs in the dashboards.
2. **Agent.** Write the catalog queries for the founder, from `supabase/tests/security_posture.sql`. Diff the founder's output against `supabase/schema/security_baseline.sql`.
3. **Agent.** Re-run `ci / rls-tests` on the latest `main`.
4. **Agent, then founder.** A regressed policy gets a forward-fix migration (above).
5. **Founder.** A leaked secret is rotated at its source, then updated in the GitHub secret or Vercel env var, then redeployed (env vars bind at deploy time).

## Who holds what

The founder:
- holds the Vercel, Supabase, GitHub and Stripe accounts;
- is the only `production-db` reviewer;
- is the only person who runs SQL on production.

If the founder cannot be reached, route B still needs the founder to merge. Every database step waits for the founder.
