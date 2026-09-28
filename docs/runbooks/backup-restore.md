# Runbook: backup and restore

**Use this when:** you need to know whether last night's backup worked, want a fresh one before a migration, or are rehearsing a restore.

## What `backup.yml` does

- **When.**
  - 02:30 UTC daily. GitHub started scheduled runs 5–6 h late (07:41–08:49 UTC on 23–28 Sep, measured 2026-09-28), so "no run yet" before ~09:00 UTC is normal.
  - Manual at any time: Actions → *Backup (prod database)* → Run workflow, or `gh workflow run backup.yml`.
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

Supabase's own daily backups (Pro, 7 days) restore only as a whole-project, in-place replacement from the dashboard. They are the founder's, and no substitute for this rehearsal.
