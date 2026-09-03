# Backup → verify → restore rehearsal — the runbook (2026-09-03)

> Written the day we found `backup.yml` had been green **30 nights running with the dump step
> skipped**. It was "inert until configured", and nobody had configured it: the repo held **zero**
> secrets and **zero** variables. There was no restorable copy of production anywhere, and the
> dashboard confirms the plan has none (*"Free Plan does not include project backups"*).
>
> Founder's rule: nothing else moves until a backup exists **and has been restored once**.

## 0 · What the workflow needs, and who holds it

| input | kind | holder | status |
|---|---|---|---|
| `PROD_PROJECT_REF` | repo **variable** | — | ✅ set 2026-09-03 → `qaymxunzlarwusogwyak` |
| `SUPABASE_ACCESS_TOKEN` | repo **secret** | your Supabase account | ❌ not set |
| `PROD_DB_PASSWORD` | repo **secret** | Database → Settings (reset it; nobody has it) | ❌ not set |
| `BACKUP_PASSPHRASE` | repo **secret** | generate it once, keep it in your password manager | ❌ not set |

⚠️ The token and the database password are **yours to type, not mine** — they go from the Supabase
dashboard into `gh secret set` on your machine and never through a chat. The passphrase is the one
thing without which every artifact is a random file; if it is lost, so is every backup.

⚠️ **Setting `PROD_PROJECT_REF` also un-inerts `deploy.yml`'s `migrate-prod` job** the moment the
two Supabase secrets exist. Today it stays skipped because its `needs: migrate-staging` is skipped
(`STAGING_PROJECT_REF` is unset). **Before you ever set `STAGING_PROJECT_REF`, create the
`production-db` GitHub environment WITH its required-reviewer rule** — the workflow's own comment
says so — or the next push to `main` applies migrations to production with no human in the loop.

## 1 · Make it real (founder, ~5 minutes)

```bash
# 1. Supabase → Account → Access Tokens → "Generate new token" (name it github-backup)
gh secret set SUPABASE_ACCESS_TOKEN --repo RadlorInc/learn      # paste when prompted

# 2. Supabase → Project → Database → Settings → "Reset database password"
gh secret set PROD_DB_PASSWORD --repo RadlorInc/learn           # paste when prompted

# 3. A passphrase that never touches a chat window: generated, stored in GitHub, printed ONCE
#    for your password manager.
p="$(openssl rand -base64 32)"; printf '%s' "$p" | gh secret set BACKUP_PASSPHRASE --repo RadlorInc/learn; echo "$p"; unset p
```

Then trigger a run and fetch the artifact (either of us can do this part):

```bash
gh workflow run backup.yml --repo RadlorInc/learn
gh run list --workflow backup.yml --limit 1          # wait for it to finish
gh run download <run-id> --repo RadlorInc/learn -D ./backup-artifact
```

## 2 · Verify from the ARTIFACT, never from the job (this is the step that had been missing)

```bash
BACKUP_PASSPHRASE=… scripts/verify-backup.sh backup-artifact/milo-db-backup-*/milo-backup.tar.gz.enc
```

⚠️ **Re-proven 2026-09-03, and the first version of this paragraph was half a check.** It read
"three controls, three red" — three NEGATIVE controls and no positive twin, which is the shape
CLAUDE.md names: *a script that refuses everything looks identical to one that discriminates*, and
no run of it could have told you which this was. Measured on synthetic artifacts, exit codes read
rather than eyeballed:

| control | exit | |
|---|---|---|
| **valid artifact, right passphrase** | **0** | ← **the positive twin.** Without this row the five below prove nothing |
| unencrypted tarball | 1 | refuses |
| wrong passphrase | 1 | refuses |
| encrypted, no `COPY` blocks | 1 | refuses |
| garbage / non-archive file | 1 | refuses |
| `BACKUP_PASSPHRASE` unset | 1 | refuses |

So the instrument discriminates. What it prints is compared by eye against **production on
2026-09-02, read with the MCP**:

| table | rows |
|---|---|
| `public.chapters` | **72** (row `counting` has `is_free = t`) |
| `public.learners` / `learner_access` / `learner_stats` | 19 / 19 / 19 |
| `public.learner_progress` / `learner_state` | 31 / 6 |
| `public.sessions` | 49 |
| `public.learner_events` | 1,631 (grows daily; the prune job keeps it bounded) |
| `public.diagnostic_sessions` / `_plans` / `_plan_progress` / `_items` / `_rechecks` | 12 / 12 / 48 / 116 / 0 |
| `public.diagnostic_leads` | 13 |
| `public.grades` / `grade_chapters` | 2 / 24 |
| `public.profiles` / `auth_events` / `error_events` | 11 / 1 / 1 |
| `public.billing_config` / `billing_events` / `subscriptions` / `subscription_seats` / `learner_invites` | 1 / 0 / 0 / 0 / 0 |
| `auth.users` / `auth.identities` | **11 / 12** — ⚠️ check these are IN the dump; `supabase db dump` treats `auth` as a managed schema, so the accounts may need `--schema auth` on the data dump |
| `cron.job` | 4 — **expected to be ABSENT** (managed schema); the four jobs are re-created from `supabase/migrations/*retention*` |

`schema.sql` should carry 24 public tables, 25 public functions and 35 policies.

## 3 · Restore it once, somewhere disposable (the step people skip)

Target options, in order of how much they prove:
1. **A fresh Supabase project** — the only target with the real `auth` schema, roles and extensions.
   ✅ **UNBLOCKED 2026-09-03: the `Radlor` org (`nwhbiwrglymeittzjvph`, which is the one that holds
   production — NOT the personal org, which is still free) reads `plan: pro`.** ⚠️ I first wrote
   "`get_cost` returns $0/month" here; that answered the wrong question. The billing FAQ: the Pro
   credit covers ONE Micro, and production already spends it — *"additional projects start at ~$10
   a month"*. **Believe the cost dialog, not the API.**
   ✅ **AND THE LAZIEST PATH IS A DASHBOARD BUTTON:** Database → Backups → **Restore to new project
   (BETA)**. Physical restore: schema, data, **roles + grants + auth users with hashed passwords**
   all come across, so it IS the rehearsal — and the docs recommend it precisely for staging.
   ⚠️ It restores into the **SAME REGION** (data-residency rule), so it is not the region move;
   the docs still route a region change through the CLI dump. ⚠️ Disable `pg_cron` on the clone
   afterwards (docs' own warning) — the 4 retention jobs would otherwise run against a copy.
2. `supabase start` locally (Docker) — same images as production, fully disposable. Needs Docker
   Desktop installed on the Mac.
3. Plain local Postgres 17 — proves the SQL is loadable, but every Supabase-specific failure it
   reports is noise, so it cannot answer the question this step exists to ask.

The restore command is in the header of `backup.yml`, and its first line is the one that matters:
`ALTER DEFAULT PRIVILEGES … REVOKE ALL ON TABLES FROM anon, authenticated` **before** `schema.sql`,
or the restore silently re-opens V12. Then the four schema-drift queries in `docs/security.md`.

What to expect to be missing, so it is looked for rather than discovered: the 4 `pg_cron` jobs,
the `pg_cron` / `pg_stat_statements` / `supabase_vault` extensions if not enabled first, and
`auth.*` rows if the dump excluded them (see the table). Report each as found or not found.

## 4 · Only then: the region move (docs/… in the 2026-09-03 handoff block) — not before Rafi says.
