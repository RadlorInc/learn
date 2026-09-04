# Applying the 2026-09-05 migrations — ordered runbook

**Status: WAITING ON GO.** Nothing here has been applied. Three migrations, one database
(`wrnjqjhrbnqxornmfisf`, us-east-1).

## What changed since this was first planned

**The client-before-backfill constraint is already satisfied, and is no longer a constraint at all.**

1. `main` auto-deploys to Vercel, so all four commits are **already live**. Verified against the
   running site, not the settings page: `p_started_at` and `start_diagnostic` are both present in
   the deployed bundle, with `p_completed_at` as a positive control (14 chunks, 896 KB).
2. That created a live degradation — the client was calling a 12-argument `sync_session` that does
   not exist yet, so PostgREST answered `PGRST202` and every completion queued instead of syncing.
   **Fixed in `181b6d9`:** the client now tolerates both schema versions. Sessions queued during the
   window flush on their own once the migration lands, carrying their real start times.

So the ordering hazard is gone. What remains is ordinary care.

## Step 0 — YOURS, and I need it before Step 1

**Confirm a restore point exists**: Supabase dashboard → Database → Backups. Note the timestamp of
the most recent daily backup. The Radlor org is on Pro, so these run automatically.

**Tell me the timestamp.** That is the only thing I need from you before applying.

> Why it matters here specifically: `20260905130000` contains an `UPDATE` that nulls
> `started_at` on 49 rows. It is guarded and idempotent, but it is the only *destructive*
> statement in the set.

## Step 1 — apply, in filename order

    20260905120000_session_started_at.sql
    20260905130000_activity_time_is_completed_at.sql
    20260905140000_diagnostic_records_its_start.sql

Order is load-bearing: `...130000` fixes the readers that `...120000`'s nullable column would
otherwise break, and its backfill runs last of the three statements in that file.

### What "wrong" looks like

| symptom | what it means | what to do |
|---|---|---|
| `function sync_session(...) already exists with same argument types` | a partial earlier run | safe — all three are `create or replace`; re-run |
| `column started_at contains null values` | the `drop not null` did not run before something else | stop; the files went in out of order |
| `permission denied for table sessions` | applied as the wrong role | stop; check which connection is being used |
| any error mentioning `qaymxunzlarwusogwyak` | **you are pointed at the decommissioned Sydney project** | stop immediately; `scripts/assert-prod-ref.sh` exists to prevent this |

## Step 2 — checks, in order, between and after

**2a. Immediately after `...120000` + `...130000`** — the schema moved:

```sql
select column_name, is_nullable, column_default from information_schema.columns
 where table_schema='public' and table_name='sessions' and column_name='started_at';
-- EXPECT: is_nullable = YES, column_default = NULL
```

**2b. The backfill hit exactly the known-false rows and nothing else:**

```sql
select count(*) filter (where started_at is null)                        as backfilled,
       count(*) filter (where started_at is not null)                    as untouched,
       count(*) filter (where started_at is not null and started_at >= completed_at) as should_be_zero
from public.sessions;
-- EXPECT: backfilled = 49, untouched = 0, should_be_zero = 0
```

⚠️ `should_be_zero > 0` means the guard did not match what it was written for. Stop and report it.

**2c. Activity did not silently drop** — this is the one that would fail quietly:

```sql
select count(distinct learner_id) from public.sessions
 where coalesce(completed_at, started_at) > now() - interval '90 days';
-- EXPECT: 10 (the learners with a completed session, unchanged by the backfill)
```

⚠️ If this falls below 10, a reader is still keyed on `started_at`. That is the exact failure mode
the migration exists to prevent, and it is invisible on any screen.

**2d. After `...140000`** — the diagnostic can express a start:

```sql
select status, count(*), count(*) filter (where completed_at is null) as open
from public.diagnostic_sessions group by status;
-- EXPECT: completed = 13, open = 0   (nothing has started under the new code yet)
```

**2e. From the browser, signed in as yourself** — the real end-to-end proof:

1. Open `/parent`. Past sessions must show real dates, **not 1/1/1970** and not `—`.
   (`—` would mean the backfill ran but you are on an old cached bundle; hard-reload.)
2. Play one chapter to the end. Then:

```sql
select chapter, started_at, completed_at,
       extract(epoch from (completed_at - started_at))::int as seconds
from public.sessions order by completed_at desc limit 1;
-- EXPECT: a POSITIVE number roughly equal to how long you actually played.
```

⚠️ **This is the check that matters most.** Everything else is a schema reading. This is the first
time in the project's history that a session duration means anything, and it is the only proof that
the client→database wiring works — a passing gate shows the argument is passed, not that it lands.

3. Start the diagnostic and **abandon it** (close the tab after two questions):

```sql
select status, completed_at from public.diagnostic_sessions order by started_at desc limit 1;
-- EXPECT: status = 'in_progress', completed_at = NULL
```

Then check `/menu` still shows your child's check-up card correctly — an in-progress row must not
become "the latest diagnosis". If the card says the child has no gap, the reader filter failed.

## Step 3 — nothing to do

The queued sessions from the PGRST202 window flush on the next app open, on their own. No action.

## Rollback

All three are `create or replace` plus two `alter column`s and one guarded `update`. To reverse:

```sql
-- restores the pre-2026-09-05 shape; the backfilled NULLs cannot be recovered from the schema,
-- which is what the Step 0 backup is for.
alter table public.sessions alter column started_at set default now();
```

⚠️ Do **not** re-add `NOT NULL` without first setting the backfilled rows to something, or the
statement fails. If it comes to that, restore from the Step 0 backup point instead — it is cleaner
than reconstructing a column whose values were known-false anyway.
