# Supabase region migration — Sydney → US

**Why:** the target audience is the US (founder's call, 2026-08-19) and the database is in
`ap-southeast-2` (Sydney). The browser talks to Supabase **directly**, so every auth call and every
sync from a US device crosses the Pacific twice. **Supabase fixes the region at project creation and
there is no setting to change it** — the only route is a new project plus a data migration.

**Do it before the first US user, not after.** Everything below is sized for the data as it is today.

---

## ✅ STATUS: GO — Pro is on, founder chose migration over a read replica, 2026-09-03

The DEFERRED block that stood here (2026-08-19) has had every premise met: the `Radlor` org reads
`plan: pro` (queried), **seven daily physical backups exist** (27 Aug → 02 Sep, seen on the
dashboard), and a new project no longer lands on free. The read-replica alternative was priced
(~+$20/mo, fixes `GET` reads only, auth and writes stay in Sydney, async lag on a local-first
reconcile path) and rejected in favour of moving while there are eleven users to re-login.

**The mechanism is now `.github/workflows/migrate-region.yml`, not the hand-run commands in §3.**
One job, no artifact (the repo is public), two connection-string secrets, no access token
(`db dump --db-url` bypasses platform auth — measured). It dumps Sydney read-only, restores in the
order §4 demands, re-creates the four cron jobs, and then runs `supabase/tests/security_posture.sql`
against BOTH databases and diffs the output — the same query on two instruments must agree — before
running the RLS regression suite on the new project. §5 and §7 remain manual and are the only manual
steps left.

⚠️ **The first dispatch is the rehearsal.** Expect it to go red somewhere in the restore — an
extension line, an auth column — and read that as the runbook doing its job. Sydney is untouched.

---

## 0. Measured state (re-measured 2026-09-03 — the 2026-08-19 numbers were all stale)

| | |
|---|---|
| project | `Interactive_learn`, ref `qaymxunzlarwusogwyak`, org `nwhbiwrglymeittzjvph` (**pro**) |
| region | `ap-southeast-2` (Sydney) · Postgres **17.6.1.121** |
| total size | **15 MB** · `storage.objects` **0** (nothing to move there) |
| auth users | **11** — 12 identities: **7 google, 5 email** |
| data | 19 learners · 49 sessions · 72 chapters |
| schema | **24** public tables (25 RLS-enabled) · **25** functions · **35** policies |
| extensions | `pg_cron` 1.6.4 · `pg_stat_statements` 1.11 · `pgcrypto` · `uuid-ossp` · `supabase_vault` |
| cron | **4 jobs** (§4 said 2 — two diagnostic pruners were added since) |
| ledger | **77 rows / 77 files, 75 match.** `20260629023502` and `20260702113253` are applied with no file; `20260903100000/100100` are files not yet applied |

Target region: **`us-east-1`** (N. Virginia). It matches `iad1`, where this project's Vercel
functions already run — measured in an earlier session as `x-vercel-id: bom1::iad1`.

---

## ⚠️ 1. TWO THINGS TO SETTLE BEFORE TOUCHING ANYTHING

### 1a. ~~There is still no backup~~ — seven physical backups exist (2026-09-03), and the old plan for a stop-gap dump is below for the record

`backup.yml` is committed and **inert**. Migrating eight real families' auth with no restorable copy
is the same risk profile that nearly cost this project its data once already. Add these to
`RadlorMain/learn` → Settings → Secrets → Actions, then run **Backup (prod database)** and confirm
the artifact exists:

```
SUPABASE_ACCESS_TOKEN   BACKUP_PASSPHRASE
PROD_DB_PASSWORD        PROD_PROJECT_REF=qaymxunzlarwusogwyak
```

### 1b. ⚠️⚠️ THE REPO'S MIGRATIONS ARE **NOT** A REPLAYABLE HISTORY OF PRODUCTION

Measured, and this is the single most dangerous assumption available here:

- ~~66 files / 65 rows / 62 + 59 mismatched~~ **Re-measured 2026-09-03 after the ledger repair: 77 files, 77
  rows, 75 match.** Two DB versions (`20260629023502`, `20260702113253`) have no file. Better, and the
  conclusion is unchanged: two applied changes exist nowhere but production.

They were applied through the MCP/dashboard, which stamps its own timestamp rather than the
filename's. **So nobody knows whether replaying the 66 files reproduces the live schema**, and
`supabase db push` against a fresh project is therefore an unverified rebuild, not a migration.

**Consequence, and the whole shape of this runbook: DUMP THE REAL SCHEMA FROM PRODUCTION. Do not
replay the repo's migrations.** Production is the only authoritative description of production.

(`supabase/schema/security_baseline.sql` is a security snapshot, not a schema dump.
`supabase/config.toml` still says `major_version = 15` while production runs 17 — fix that too.)

---

## 2. Create the new project

Supabase dashboard → New project, **same organization**, region **`us-east-1`**, Postgres **17** to
match. Save the new ref as `NEW_REF` and the database password somewhere you will not lose it.

⚠️ A new project on the free plan **also pauses after 7 days of low activity**. That risk moves with
you; it is an argument for Supabase Pro at launch, not against migrating.

---

## 3. Move schema, then data, then auth

Run from the repo root with the Supabase CLI. `OLD_REF=qaymxunzlarwusogwyak`.

```bash
supabase link --project-ref $OLD_REF
supabase db dump -f /tmp/schema.sql            # roles, tables, policies, functions, grants
supabase db dump -f /tmp/data.sql   --data-only
supabase db dump -f /tmp/auth.sql   --data-only --schema auth
```

⚠️ **`auth.sql` is the one that decides whether eight families keep their logins.** It carries
`auth.users` (including `encrypted_password` for the five email accounts) and `auth.identities`
(the `provider_id` rows the seven Google accounts are matched on). Losing it means eleven password
resets and seven broken Google sign-ins. The workflow asserts the `COPY auth.users` block is present.

Restore into the new project, **in this order**:

```bash
psql "$NEW_DB_URL" -f /tmp/schema.sql
psql "$NEW_DB_URL" -f /tmp/auth.sql
psql "$NEW_DB_URL" -f /tmp/data.sql
```

---

## 4. ⚠️ The four things a dump does NOT bring across

**① Cron jobs.** `pg_cron` lives outside the public schema. **Four** must be recreated (this said
two — re-measured 2026-09-03, and the workflow does it), all retention jobs — losing them silently
reopens a privacy commitment made on `/data-and-safety`:

```sql
select cron.schedule('purge-old-learner-events','17 3 * * *', $$delete from public.learner_events where created_at < now() - interval '90 days'$$);
select cron.schedule('prune-diagnostic-items',  '22 3 * * *', 'select public.prune_diagnostic_items()');
select cron.schedule('prune-error-events',      '27 3 * * *', 'select public.prune_error_events()');
select cron.schedule('prune-diagnostic-leads',  '32 3 * * *', 'select public.prune_diagnostic_leads()');
```
⚠️ The old text above had `and event <> 'daily_complete'` on the purge — production's job does NOT
carry that clause. The workflow copies what production runs, not what the doc remembered.

**② Default privileges.** Supabase's own docs: a restored table *"inherits ALL privileges from
default privileges in the target database"*. Part of this app's security **is** grants, not just RLS —
the V19 EXECUTE revokes are why 0 of 17 functions are anon-callable. A naive restore hands that back
while every RLS policy still reads correctly. Before restoring:

```sql
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
```

**③ Auth configuration.** Site URL, the redirect allowlist, provider settings, rate limits,
leaked-password protection — all dashboard state, none of it in the dump. Re-enter them.

**④ The extensions.** `pg_cron` (and anything else the schema dump assumes) must be enabled on the
new project before the restore.

---

## 5. ⚠️⚠️ GOOGLE OAUTH — THE STEP THAT CAN LOCK OUT **SEVEN OF ELEVEN** USERS (was five of eight)

Supabase's OAuth callback contains the project ref:

```
https://<ref>.supabase.co/auth/v1/callback
```

A new project means a new ref means **a new callback URL**, and Google will refuse any request whose
`redirect_uri` is not registered. **Seven of the eleven accounts sign in with Google** (re-measured 2026-09-03).

1. Google Cloud → project **"AI Detector"** (`ai-detector-493801`, reachable directly at
   `console.cloud.google.com/apis/credentials?project=12513320995`) → the OAuth 2.0 client
2. **ADD** `https://<NEW_REF>.supabase.co/auth/v1/callback` to Authorized redirect URIs
3. ⚠️ **Add. Do not replace, and do not remove the old one until cutover is proven.** Never delete
   the client or regenerate its secret — that breaks all five immediately and irreversibly.

⚠️ **CHECK THIS FIRST, BECAUSE IT CAN BLOCK THE WHOLE MIGRATION:** `admin@radlor.com` currently has
only **Editor** on that Cloud project. If Editor cannot edit the OAuth client, sort the ownership out
*before* you start, not halfway through.

---

## 6. Verify — before switching anything over

The app is still pointed at the old project at this stage, so all of this is safe.

```bash
# structure
# the workflow does this as a DIFF of supabase/tests/security_posture.sql run on both databases —
# no hard-coded expectations to rot (the ones that stood here read 20 / 17 / 8 / 17; production is
# 24 / 25 / 11 / 19). Structure, every policy predicate, every function ACL, every column grant, and
# the stable row counts must be byte-identical between Sydney and the new project.
psql "$OLD_DB_URL" -f supabase/tests/security_posture.sql > old.txt
psql "$NEW_DB_URL" -f supabase/tests/security_posture.sql > new.txt && diff old.txt new.txt

# isolation — this suite already exists and is exactly what a restore can silently break
psql "$NEW_DB_URL" -f supabase/tests/rls_regression.sql

# grants drift, against the committed baseline
psql "$NEW_DB_URL" -f supabase/schema/security_baseline.sql   # diff the output, expect no change
```

⚠️ **And then drive one real Google sign-in and one real email sign-in against the new project**, in
a preview deployment pointed at it. Every check above passes on a database nobody can log into —
this repo has a standing rule about exactly that (*a unit test cannot see that nothing calls the
unit*). The login is the only test that covers §5.

---

## 7. Cutover

1. Vercel → project `adaptivelearn` → env: `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` → the new project's values
2. Redeploy, and **confirm a deployment actually appears** — this pipeline has broken silently three
   times and a green settings page was never evidence
3. Sign in as a real user on production. Google first, since that is the fragile path
4. Watch `auth_logs` (`query_logs`, `source='auth_logs'`) — that is how an auth change was proven
   working once before, and it beats inferring from a redirect

⚠️ **Then, and only then, touch the old project.** The standing rule from the Supabase near-miss:
**verify the new thing works, THEN remove the old one — never the other way round.** Leave Sydney
running and untouched for at least a week; it is the rollback (change two env vars back).

---

## 8. Rollback

Two env vars in Vercel, redeploy. That is the whole plan, and it holds **only while the old project
is still alive and nobody has written to the new one**. Once real sessions are landing in `us-east-1`,
rolling back loses them — so the window is short and worth stating out loud before you start.

---

## What this does not fix

Vercel functions run in `iad1`; the browser reaches Supabase directly. Moving the database to
`us-east-1` fixes the browser→database hop for US users, which is the one that matters on app open.
It does nothing for users elsewhere — and the founders' own first learners are not in the US, so
**their latency gets worse by exactly as much as the US audience's gets better.** That is the trade,
and it is the right one only because the target audience is US.
