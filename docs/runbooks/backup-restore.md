# Runbook: backup and restore

**Use this when:** you need to know whether last night's backup worked, want a fresh one before a migration, or are rehearsing a restore.

## What `backup.yml` does

- **When.**
  - 02:30 UTC daily. GitHub started scheduled runs 5–6 h late (07:41–08:49 UTC on 23–28 Sep, measured 2026-09-28), so "no run yet" before ~09:00 UTC is normal.
  - Manual at any time: Actions → *Backup (prod database)* → Run workflow, or `gh workflow run backup.yml`.
  - The job runs in the GitHub environment `prod-backup` (only `main` may use it). Its three secrets live there and in
    `production-db`, never as repository secrets: `secretsInEnvironments.test.ts` fails on a job that reads one outside an
    environment. Keep every old `BACKUP_PASSPHRASE` in the password manager with its dates: a dump opens only with the
    passphrase it was made with.
  - `migrate-prod` runs the same `.github/actions/prod-backup` steps before applying a migration (artifact `milo-db-backup-premigrate-<run id>`).
- **Steps, stopping at the first failure:**
  1. Fail and name what is missing if any of these is empty: `SUPABASE_ACCESS_TOKEN`, `BACKUP_PASSPHRASE`, `PROD_DB_PASSWORD`, `PROD_PROJECT_REF`.
  2. Refuse unless the ref equals the literal in `scripts/assert-prod-ref.sh`.
  3. Pull pg_dump's image from ghcr.io, signed in with the run's token, with backoff; fall back to public.ecr.aws with a warning.
  4. Dump `schema.sql` and `data.sql` (COPY format). pg_dump is read-only against production. Fail if either file is empty.
  5. Log **rows and bytes per schema** (`scripts/backup-row-counts.sh`), never per table, because the logs are public. Its exit 2 ("could not count") is only a warning.
  6. Encrypt: `openssl enc -aes-256-cbc -pbkdf2 -iter 200000` with `BACKUP_PASSPHRASE`. Refuse an empty passphrase, and check the output is **not** a readable tarball before it leaves the runner.
  7. Upload the artifact `milo-db-backup-<run id>`, **kept 30 days**.
- **What it holds.** Every table, including children's data and parents' session tokens. The passphrase lives only in the founder's password manager and the GitHub secret. Lose it and every artifact is noise.
- **Not in it:** pg_cron jobs, which are recreated from migrations, and the Storage bucket's audio files. The files are rebuilt from their git tag ([audio-upload.md](audio-upload.md)); their Storage rows are in the dump.

## Check last night's run (agent)

```bash
gh run list --workflow backup.yml --limit 5 --json databaseId,event,conclusion,createdAt
gh api "repos/{owner}/{repo}/actions/runs/<run id>/artifacts" --jq '.artifacts[] | {name, size_in_bytes, expires_at}'
gh run view <run id> --log | grep -A12 'Backup row counts per schema'
```

The run is good when all three hold:
- `conclusion` is `success`;
- an artifact exists and is not expired;
- the per-schema table is in the log.

A red run on `main` also opens (or comments on) the issue "Nightly backup is red", and the next green run closes it.
The ops digest flags a backup whose last success is more than 36 h old even when the latest run is green.

That table explains a size change (2026-09-28: tens of KB → ~1.8 MB when the audio bucket's rows landed in `storage`). The ops digest (06:23 UTC) also reports the latest result, which is usually the previous day's run.

## Rehearse a restore — on a throwaway LOCAL stack only

Never restore into production from this runbook ([rollback.md](rollback.md) covers that decision). The decrypted files are children's data. Keep them in a scratch directory outside any repo and delete them at the end.

**Who:** the founder, who holds the passphrase. The agent can prepare the scratch stack and the commands.

1. **Founder.** Run these read-only queries in the SQL editor and note the two answers:
   ```sql
   select max(version) from auth.schema_migrations;
   select id, name from storage.migrations order by id desc limit 1;
   ```
2. **Download** the artifact into a scratch directory: `gh run download <run id> -n milo-db-backup-<run id> -D <scratch>`.
3. **Decrypt.** Run `scripts/verify-backup.sh` for a first check:
   ```bash
   BACKUP_PASSPHRASE=… scripts/verify-backup.sh <scratch>/milo-backup.tar.gz.enc
   openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:BACKUP_PASSPHRASE \
     -in <scratch>/milo-backup.tar.gz.enc | tar xz -C <scratch>
   ```
   `verify-backup.sh` fails on an unencrypted, undecryptable or COPY-less file. Its per-table counts stay in your terminal.
4. **Local stack at production's service versions.** Work in a scratch directory (`supabase init`). Write GoTrue and storage-api tags at least as new as step 1's answers into `supabase/.temp/gotrue-version` and `supabase/.temp/storage-version`. Then start the stack with auth and storage running, excluding the rest: `supabase start -x <every other service>`. Run `supabase start --help` for the names.

   Run step 1's queries locally and confirm the same answers. If the local images are older, the restore dies on the first missing table and rolls back.
5. **Restore as `supabase_admin`.** The local `postgres` role is refused on part of the storage schema.
   ```bash
   LOCAL_DB=postgresql://supabase_admin:postgres@127.0.0.1:54322/postgres
   psql "$LOCAL_DB" -c 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;'
   psql "$LOCAL_DB" --single-transaction -v ON_ERROR_STOP=1 -f <scratch>/schema.sql \
     -c 'SET session_replication_role = replica' -f <scratch>/data.sql
   ```
   Run the first command **before** the schema. Otherwise the restored tables inherit default privileges, and grant-based protections (column grants, EXECUTE revokes) come back open while every policy still looks right.
6. **Prove it.**
   - `psql` exited 0.
   - Every public table's count equals its COPY block's row count; `verify-backup.sh` prints those.
   - Queries 1–4 of `psql "$LOCAL_DB" -f supabase/tests/security_posture.sql` match the founder's SQL-editor output of the same queries.
7. **Tear down.** Run `supabase stop --no-backup`, then delete the scratch directory with the encrypted and decrypted files.
8. **Record.** Note the date, the run id, `PASS`/`FAIL` and the wall-clock restore time in the PR or the founder's ops log. No counts per table.

The last full rehearsal passed on 2026-09-23 (restore proven, see [../legal/05-information-security-program.md](../legal/05-information-security-program.md)). Repeat it quarterly and after any change to `backup.yml` or the prod-backup action.

## Put one family's lost rows back (partial restore)

**Use this when:** one family's progress, points or settings were lost or damaged by a fault (a bug, a bad migration),
and the rest of production is fine. A whole-project restore would throw away everyone else's day, so instead the lost
rows are copied out of a dump and inserted back.

**Never for a deleted child.** A child deleted by a parent, a withdrawal or an account close stays deleted (06). The
mechanism refuses it anyway: with no `learners` row and no granted consent, the consent gate rejects every insert
(rehearsed), but do not rely on that — check query 7 of `support-lookup.sql` first.

**What it puts back:** rows for one child in `lesson_progress`, `point_events`, `game_settings`, `game_saves`,
`learner_events`, `lesson_feedback`, `exercise_results`. Not `learners`, `learner_access` or `learner_invites` (who
may see a child is never taken from an old copy), not `error_events`. Only rows that are **missing**: a row production
still has, by primary key, is left exactly as it is (`on conflict do nothing`), so nothing newer is overwritten.

1. **Founder.** Pick the dump: the newest nightly (or premigrate) run from **before** the loss. Note its time — work
   done between that time and the loss is not in it, and the reply to the parent says so.
2. **Founder.** Restore it into a throwaway local stack: steps 1–5 of the rehearsal above.
3. **Founder.** Find the child's id: query 2 of [../legal/sql/support-lookup.sql](../legal/sql/support-lookup.sql) in
   the SQL editor (production), with the verified parent's address. Check it is the same child in the restored copy:
   `select created_by, age_group, created_at from public.learners where id = '<learner id>';` (both should match).
4. **Founder.** Write the insert script from the restored copy. Save this as `<scratch>/extract.sql` (outside any repo):
   ```sql
   select format(
     $q$select format('insert into public.%%I select * from json_populate_recordset(null::public.%%I, %%L::json) on conflict do nothing;', %L, %L, json_agg(t)) from public.%I t where learner_id = %L having count(*) > 0$q$,
     tbl, tbl, tbl, :'learner')
   from (values ('lesson_progress'), ('point_events'), ('game_settings'), ('game_saves'),
                ('learner_events'), ('lesson_feedback'), ('exercise_results')) v(tbl)
   \gexec
   ```
   ```bash
   psql "$LOCAL_DB" -At -v learner='<learner id>' -f <scratch>/extract.sql -o <scratch>/upsert.sql
   ```
   `upsert.sql` holds one `insert` per table that has rows for that child, the rows as JSON. It is children's data:
   it stays in the scratch directory, never in the repo, a PR, an issue or a chat with the agent.
5. **Agent and founder, review.** The agent reviews the **shape**, not the data: the founder pastes only
   `grep -o '^insert into public\.[a-z_]*' <scratch>/upsert.sql` and the row count per table
   (`select count(*) from public.<table> where learner_id = '<learner id>'` in the restored copy and in production,
   side by side). The founder confirms every row is that child's (`learner_id`) and nothing else is in the file.
6. **Founder, SQL editor (production).** Paste the file's statements between `begin;` and `commit;`. Any error rolls
   all of it back. A `P0C01` error means the child has no granted consent now: stop, nothing is restored.
7. **Founder.** Re-run the per-table counts in production: each is now at least the restored copy's count (higher
   where the child has played since). Run step 6 again and every insert reports `INSERT 0 0` — the script is safe to
   repeat. Tear down the local stack and delete the scratch directory (step 7 above).
8. **Founder.** Tell the parent what came back and from what time. The parent dashboard reads the server's copy;
   what a child's own device shows after a restore was not measured.

**Rehearsed 2026-10-05, on local stacks only:** a seeded database was dumped with `supabase db dump --local` (the
same two files as `backup.yml`), encrypted and checked with `verify-backup.sh` using a throwaway passphrase, and
restored into a second empty local stack by step 5's commands. In the first stack, one child's progress and points
were deleted; steps 4 and 6 put both rows back; a second run inserted 0; and the script for a child who had been
deleted was refused by the consent gate. **Not rehearsed:** a real production dump (it needs the passphrase and the
matching auth/storage versions — the full rehearsal above covers that, last on 2026-09-23); running the inserts in
the hosted SQL editor; a table whose columns changed between the dump and today (then the insert fails and nothing
is applied: fix the column list by hand, with the agent).

Supabase's own daily backups (Pro, 7 days) restore only as a whole-project, in-place replacement from the dashboard. They are the founder's, and no substitute for this rehearsal.
