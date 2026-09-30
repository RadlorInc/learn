# Runbook: deploy

**Use this when:** you want a change to reach production. Rollback is in [rollback.md](rollback.md); schema changes also follow [migrations.md](migrations.md).

## How production is updated

Vercel serves the **`release`** branch as production (`vercel.json` turns off deploys from `main`). Only `deploy.yml`'s `promote` job moves `release`, and only after CI is green on the push to `main`. A red CI leaves production on the last good commit.

Never push to `release` by hand. Pointing it at an older commit deploys nothing, because Vercel already built that commit (measured 2026-09-09).

## Steps

1. **Agent.** Branch from `main`. If anything a user downloads changed, move `VERSION` in `public/sw.js` forward. Run `npm run preflight` (tsc, vitest, build, audit, `sw.js` bump check).
2. **Agent.** Open the PR as a Draft (`gh pr create --draft`), every time. The PR body says what changed, what was tested and whether a migration is included.
3. **CI on the PR** (`ci.yml`) runs two jobs:
   - `verify`: tsc, vitest, build, and `npm audit --audit-level=high`.
   - `rls-tests`: a throwaway Docker Postgres. It loads the baseline plus every migration and runs `supabase/tests/rls_regression.sql`, which must print `RLS_ASSERTIONS=<n>` with n ≥ 1. It also runs the committed rollback scripts. CI never touches production.
4. **Founder.** Marks the PR Ready and merges it. The agent merges only when the founder says so in chat, for that PR. If there are many approved PRs, the founder merges them as a train in this order: non-migration PRs, then migration PRs in timestamp order, then docs.
5. **Agent, before a runtime merge.** Hand the founder the rollback target: the commit production serves now and its Vercel deployment. Read it from GitHub's deployment records:
   ```bash
   gh api "repos/{owner}/{repo}/deployments?environment=Production&per_page=5" --jq '.[] | "\(.id) \(.sha[0:9]) \(.created_at)"'
   gh api "repos/{owner}/{repo}/deployments/<id>/statuses" --jq '.[0] | .state, .environment_url'
   ```
   Pick the newest `success`. Give the target in chat only, never in the repo.
6. **The push to `main`** runs `deploy.yml`:
   - `ci` runs the same jobs as on the PR;
   - `promote` pushes `main` to `release`, and Vercel builds it;
   - `migrations-changed` and `migrate-prod` only matter when there is a migration ([migrations.md](migrations.md)).

   `promote` does not wait for the database.
7. **Agent.** Watch the Deploy run for **that** SHA, not whichever run is newest:
   ```bash
   sha=$(git rev-parse origin/main)
   gh run list --workflow deploy.yml --commit "$sha" --limit 1
   git ls-remote origin refs/heads/main refs/heads/release   # must be equal after promote
   ```
8. **Agent.** Confirm production is READY on the commit: a `Production` deployment record for `$sha` with state `success` (the same two `gh api` calls as step 5).
9. **Agent.** Run `npm run smoke:live`, and add `SMOKE_SW=<new VERSION>` if `sw.js` moved. Exit codes:
   - 0: every check passed;
   - 1: a named check failed;
   - 2: the smoke could not look. That is never a pass.

   Report the result to the founder. If it fails, go to [rollback.md](rollback.md).

**Environment variables** bind at deploy time. The founder adds a new one in Vercel **before** the deploy that needs it, then confirms it on the running deployment.

## Scheduled and automatic jobs

| Job | When (UTC) | What it does | When it fails |
|---|---|---|---|
| `backup.yml` | 02:30 daily, plus manual. Scheduled runs started 5–6 h late (measured 2026-09-28, `gh run list --event schedule`) | Encrypted production dump, 30-day artifact ([backup-restore.md](backup-restore.md)) | Red run, flagged in the ops digest. No issue |
| `daily-smoke.yml` | 03:11 daily, plus manual | `npm run smoke:live` against the live site (read-only, no secret), expecting the service-worker version on `release` | Updates the issue "Daily production smoke is red" and closes it on green |
| `nightly-e2e.yml` | 03:15 daily | Legacy chapter sweep. **Paused** while `LEGACY_CHAPTERS_HIDDEN = true`: green with a warning, tests nothing | Updates the issue "Nightly E2E is red" and closes it on green |
| `weekly-layout.yml` | Mondays 04:40 | Short-landscape layout sweep. **Paused** the same way | Red run only |
| `red-main.yml` | After every failed Deploy run on `main`, plus a drift check at 06:37 daily | Files one issue per kind: main red · promote failed · app live but database not migrated · `main` more than 2 commits ahead of `release` | — |
| Vercel cron `/api/consent/cancel-second-notice` | 06:23 daily (`vercel.json`) | Cancels queued second consent emails, then emails the ops digest (numbers only). The digest is sent only if `CRON_SECRET` and `OPS_DIGEST_TO` are set in Vercel | Digest lines marked `!!` |
| Database retention jobs (pg_cron) | 03:17–03:37 daily | The schedule in [../legal/04-data-retention-policy.md](../legal/04-data-retention-policy.md) | Digest line `cron_jobs_failing` |

Unpausing the sweeps also needs `e2e/start-card.spec.ts` and `e2e/short-landscape.spec.ts` back (absent as of 2026-09-28). `upload-audio.yml` is manual ([audio-upload.md](audio-upload.md)). Never run `migrate-region.yml` again: it was a one-off for the September 2026 region move.

## Staging

Staging is the Supabase project `radlic-staging` (us-east-1, free plan), created 2026-09-30. It holds no real
accounts or children, only test data. It sits in a different Supabase organization from production, so billing and
team settings are separate.

What was done on 2026-09-30:
- `supabase/schema/baseline_schema.sql` was run on the empty project. Read back after: 18 `public` tables, all with
  RLS; 31 policies; 11 triggers; the `ensure_rls` event trigger; no migration ledger yet.
- The `staging` environment secrets `STAGING_DB_PASSWORD` and `STAGING_DB_URL` (the **session pooler** URI; the
  direct host is IPv6-only and GitHub runners cannot reach it) were set by the founder.
- Staging lives in a different Supabase organization, so the repo secret `SUPABASE_ACCESS_TOKEN` (production's) is
  refused there: the first `migrate-staging` run failed at its link step with `Unauthorized`. The `staging`
  environment therefore has its **own** `SUPABASE_ACCESS_TOKEN`, a token from the account that can see
  `radlic-staging`. An environment secret overrides the repo secret of the same name, so `deploy.yml` is unchanged.
- The repo variable `STAGING_PROJECT_REF` was set. From then on `deploy.yml`'s `migrate-staging` runs on every push
  to `main` (`db push`, then the RLS suite), and `migrate-prod` runs only after it succeeds.

The first `migrate-staging` run went green on 2026-09-30 (Deploy run 36753051181, re-run after the token fix). It
applied all 126 migrations (the staging ledger has 126, the same as `supabase/migrations/`), and the RLS suite
reported `ALL ASSERTIONS PASSED` with `RLS_ASSERTIONS=91`. A production migration arriving behind a green staging
run has not happened yet. If a staging run fails, production migrations wait behind it; fix staging, or delete `STAGING_PROJECT_REF` to fall back to straight-to-production.

**Preview deployments run against staging** (2026-09-30). Vercel's Preview environment has its own
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` (all `radlic-staging`), the
Stripe **test** key and the two test price ids. Production's variables are separate and unchanged. On a preview,
`SITE_URL` is the branch's own URL (`src/app/site.ts`, `siteUrlPreview` test), so sign-up and consent links and the
Stripe return URL come back to that preview. Staging's Supabase Auth allows `https://adaptivelearn-*-radlor1.vercel.app/**`
as a redirect URL. Sign-up also needs `RESEND_API_KEY` in Preview; without it `/api/auth/signup` answers 503
`not_configured`.

`scripts/seed-staging.mjs` fills a staging database, or a local stack with `STAGING_PROJECT_REF=local`, with fake
accounts and children. It refuses production's ref before it connects. Exit codes:
- 0: seeded;
- 1: the seed failed part-way;
- 2: refused, nothing was contacted.

To tear staging down, delete the variable first. Otherwise every production migration waits on a project that no
longer exists.

Test against staging or a local stack (`supabase start` in a scratch directory). Never run the app against production.
