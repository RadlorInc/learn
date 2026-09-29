# Runbook: migrations

**Use this when:** a change adds or alters anything in the database: a table, column, policy, grant, function, trigger, cron job or row.

A migration reaches production only one way: `deploy.yml` → `migrate-prod`, behind the `production-db` environment. That environment has a required reviewer, the founder, and admin bypass is off (measured 2026-09-28). Never run `supabase link`, `supabase db push` or any `--linked` / `--project-ref` command from a checkout. The agent never reads production at all. The founder runs read-only SQL in the Supabase SQL editor.

## The order

1. **Agent — write the migration.** It goes in `supabase/migrations/<timestamp>_<name>.sql`. Its header says:
   - what it changes and why;
   - **DEPLOY ORDER**: app first, migration first, or either, and what breaks if the order is wrong;
   - every **SECURITY CHANGE**, called out by name: `SECURITY DEFINER` added or removed, `search_path`, owner or grant.

   A new `SECURITY DEFINER` function in `public` is callable by anyone until revoked. Pair it with `revoke all … from public, anon, authenticated` in the same file. A function you replace is copied from its last definition with only named lines changed. Never retype it.
2. **Agent — prove it locally.**
   - Add assertions for any new table or policy to `supabase/tests/rls_regression.sql`.
   - Run the suite on a **local** stack only.
   - CI's `rls-tests` replays the baseline and every migration and runs it again on the PR.
   - Watch a new assertion go red on the broken state before trusting it.
3. **Agent — write the before- and proof-SQL** next to the PR, as `docs/legal/sql/<topic>-before.sql` and `<topic>-proof.sql`. The pattern:
   - read-only; counts only, never a name, email or id (the repo is public);
   - one row per check, labelled `PASS` / `FAIL` / `INFO`, with the expected value written in by hand;
   - a `STOP-CHECK` per function the migration replaces: the `md5(prosrc)` of the body the repo expects. A `FAIL` there means production is not what the migration was written against, so stop;
   - the before-SQL checks that the ledger (`supabase_migrations.schema_migrations`) does **not** have the version yet, and the proof-SQL checks that it does.
4. **Agent.** Open a Draft PR carrying the migration, both SQL files and any app change.
5. **Founder — run the before-SQL** in the SQL editor and send back the output. Any `FAIL` stops here.
6. **Founder (or the agent when asked) — take a fresh backup.** Actions → *Backup (prod database)* → Run workflow. **Agent** confirms it is green with an artifact ([backup-restore.md](backup-restore.md)). `migrate-prod` also takes its own backup right before it applies, and applies nothing if that backup fails.
7. **Agent — hand over the rollback target** if the PR contains app code ([deploy.md](deploy.md) step 5).
8. **Founder — merge.** `promote` puts the app live as soon as CI is green. It does **not** wait for the migration. So:
   - **App first** (the usual case; the app tolerates both shapes): approve `production-db` only **after** production is READY on the merge commit.
   - **Migration first:** use two PRs. Merge and apply the migration PR first, then the app PR.
   - **Either:** approve when ready.
9. **Founder — approve `migrate-prod`.** Open the Deploy run → *Review deployments* → `production-db`. Before approving, check that the run is `Deploy` on `main` at the merge commit. The job then:
   - checks the configured ref against the literal in `scripts/assert-prod-ref.sh`;
   - backs up production;
   - applies every migration the ledger lacks.

   `scripts/migrations-pending.sh` offers the job whenever any migration changed since the last **successful** `migrate-prod`. So a rejected or failed run is offered again on the next push. When it cannot tell, it says pending.

   It learns that commit from the tag `prod-db-migrated`, which the Deploy job `record-migrated` moves after every successful `migrate-prod` (its `if: !cancelled() && needs.migrate-prod.result == 'success'` is required: without it, GitHub's implicit `success()` skips the job whenever the always-skipped `migrate-staging` is an ancestor, as on Deploy run 36469923680). Without the tag it falls back to scanning past Deploy runs through the Actions API, which has answered without data that was there (2026-09-28). If a Deploy run for a push with no migration asks for `production-db`, the tag is missing or behind: approving applies nothing, and the approval's success moves the tag.
10. **Founder — run the proof-SQL.** Every row should read `PASS`, and each `INFO` should match what the before-SQL predicted.
11. **Agent — record it.** Put the before, backup, approval and proof results in the PR, as counts and `PASS`/`FAIL` only. If a grant, policy or `SECURITY DEFINER` changed, regenerate the security baseline (below).

**If `migrate-prod` fails or the approval is rejected**, `red-main.yml` opens the issue "app is live, database NOT migrated". Read the job log, then either re-run the failed job (it needs the approval again) or revert the app ([rollback.md](rollback.md)). The app must tolerate the old schema meanwhile. That is what expand/contract buys.

**Expand, migrate, contract.**
- The client learns to tolerate both shapes first: a missing RPC answers `PGRST202`, an unknown column `42703`, and the client must fall back on either.
- The data moves second.
- The old shape goes last, in a later migration, once no live bundle reads it.

## Standard proof for any grant, RLS or `SECURITY DEFINER` change

`supabase/tests/security_posture.sql` holds the four schema-drift queries:
1. RLS on, and policy count per table. A table with RLS on and 0 policies is deny-all. That is deliberate only where the table's own migration says so.
2. Every policy predicate, with its roles.
3. Every function's `SECURITY DEFINER` flag, `search_path` pin and EXECUTE ACL. `DEFAULT = PUBLIC EXECUTE` is a finding.
4. Column-level INSERT/UPDATE grants to `anon`/`authenticated`. The table-level query cannot see these.

Section 5 is a count fingerprint for restore checks.

**Founder** runs queries 1–4 in the SQL editor. Paste each `select` on its own; the `\echo` and `\pset` lines are psql-only. **Agent** writes the founder's output into `supabase/schema/security_baseline.sql` and reviews the `git diff` in the PR. An unexplained difference is a finding. The baseline was last fully regenerated 2026-08-17 (as of 2026-09-28), so expect older drift the first time.

## Never

- Never apply a migration file older than production's current definitions without the `STOP-CHECK`. An old file silently reverts newer fixes to the same object (2026-08-24).
- Never ship a migration that changes what running code reads ahead of its readers.
- Never query production from the agent's side, even read-only. Write the SQL for the founder.
