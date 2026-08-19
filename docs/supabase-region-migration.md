# Supabase region migration — Sydney → US

**Why:** the target audience is the US (founder's call, 2026-08-19) and the database is in
`ap-southeast-2` (Sydney). The browser talks to Supabase **directly**, so every auth call and every
sync from a US device crosses the Pacific twice. **Supabase fixes the region at project creation and
there is no setting to change it** — the only route is a new project plus a data migration.

**Do it before the first US user, not after.** Everything below is sized for the data as it is today.

---

## 0. Measured state (2026-08-19) — re-measure before you start

| | |
|---|---|
| project | `Interactive_learn`, ref `qaymxunzlarwusogwyak`, org `nwhbiwrglymeittzjvph` |
| region | `ap-southeast-2` (Sydney) · Postgres **17.6.1.121** |
| total size | **15 MB** |
| auth users | **8** — 9 identities across `email` and `google` |
| data | 17 learners · 44 sessions · 72 chapters |
| schema | 20 public tables, 21 with RLS · 17 functions, **all 17 carrying an explicit ACL** |
| cron | **2 jobs** (see §4) |

Target region: **`us-east-1`** (N. Virginia). It matches `iad1`, where this project's Vercel
functions already run — measured in an earlier session as `x-vercel-id: bom1::iad1`.

---

## ⚠️ 1. TWO THINGS TO SETTLE BEFORE TOUCHING ANYTHING

### 1a. There is still no backup, and this is a migration

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

- the repo holds **66** migration files
- production's `supabase_migrations.schema_migrations` holds **65** rows
- **62 of the repo's versions are absent from the database, and 59 of the database's versions are
  absent from the repo.** Only the six most recent overlap.

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
`auth.users` (including `encrypted_password` for the three email accounts) and `auth.identities`
(the `provider_id` rows the five Google accounts are matched on). Losing it means eight password
resets and five broken Google sign-ins.

Restore into the new project, **in this order**:

```bash
psql "$NEW_DB_URL" -f /tmp/schema.sql
psql "$NEW_DB_URL" -f /tmp/auth.sql
psql "$NEW_DB_URL" -f /tmp/data.sql
```

---

## 4. ⚠️ The four things a dump does NOT bring across

**① Cron jobs.** `pg_cron` lives outside the public schema. Both must be recreated by hand, and both
are retention jobs — losing them silently reopens a privacy commitment made on `/data-and-safety`:

```sql
select cron.schedule('prune-error-events',      '17 3 * * *', 'select public.prune_error_events()');
select cron.schedule('purge-old-learner-events','17 3 * * *', $$ delete from public.learner_events
  where created_at < now() - interval '90 days' and event <> 'daily_complete' $$);
```

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

## 5. ⚠️⚠️ GOOGLE OAUTH — THE STEP THAT CAN LOCK OUT FIVE OF EIGHT USERS

Supabase's OAuth callback contains the project ref:

```
https://<ref>.supabase.co/auth/v1/callback
```

A new project means a new ref means **a new callback URL**, and Google will refuse any request whose
`redirect_uri` is not registered. **Five of the eight accounts sign in with Google.**

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
psql "$NEW_DB_URL" -c "select count(*) from pg_tables where schemaname='public'"          # expect 20
psql "$NEW_DB_URL" -c "select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                       where n.nspname='public' and p.proacl is not null"                  # expect 17
psql "$NEW_DB_URL" -c "select count(*) from auth.users"                                    # expect 8
psql "$NEW_DB_URL" -c "select count(*) from public.learners"                               # expect 17

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
