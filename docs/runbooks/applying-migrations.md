# Runbook — applying a migration to production

## ⚠️ THE RULE THAT COST US A SECURITY REGRESSION

**Before applying any migration file older than the current production schema, diff the objects it
touches against production's CURRENT definitions. If they differ, STOP.**

A migration file is correct *on the day it is written*. It is a snapshot of an intention against
the schema as it stood. Applying it later recreates that snapshot — including undoing anything
newer that touched the same object.

**What happened, 2026-08-24.** `leads_server_only` was written 2026-08-16, when the
`diagnostic_leads: insert` policy bounded email LENGTH only. On 2026-08-17,
`privacy_and_leads_hardening` tightened the same policy to also require an email SHAPE — the V13
fix, whose entire point was that length-only meant every 3-character string was a valid lead.
Applying the older file on 2026-08-24 recreated the policy as written and silently dropped the
newer check.

Nothing about the file looked wrong. It was reviewed, it was correct when written, and it reverted
a security fix eight days newer than itself. `rls_regression.sql` A9b caught it about four minutes
later — which is the whole reason that suite was given a database.

## The check, before you apply

For each object the migration touches (policy, function, trigger, constraint, grant):

```sql
-- policies
select policyname, roles, qual, with_check from pg_policies
where schemaname='public' and tablename='<table>';

-- functions (definition + who can execute)
select pg_get_functiondef(p.oid), p.proacl
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='<fn>';

-- grants
select relacl from pg_class where relname='<table>' and relnamespace='public'::regnamespace;
```

Compare with what the migration will create. If production is **stricter or newer**, the file is
stale: bring it forward first, or write a follow-up that restores the newer state, and say so in
the file.

## ⚠️ Pair a repo file to a ledger row by CONTENT, never by name

The ledger stores the SQL it applied, so "has this file run?" is answerable exactly. Answering it by
NAME is a guess, and on 2026-08-24 the guess would have marked `perf_advisors` applied when it had
never run once — skipping it for ever.

Two traps: a **raw** hash does not compare (the CLI strips comments preceding the first statement, so
only 13 of 72 files matched raw and it looked like mass drift) — strip `--` comments and all
whitespace from both sides; and a file may pair with a row of a **different name**, because
production sometimes split one file into two migrations. Full method and the exact query:
[docs/schema-baseline-debt.md](../schema-baseline-debt.md#the-ledger-side--repaired-2026-08-24).

## ⚠️⚠️ B12 BLOCKS ANY MIGRATION THAT WOULD TOUCH CHILD DATA

**The moment a migration would touch `sessions`, `learner_progress` or `learner_stats`, B12 blocks
it.** Standing policy, founder's words, 2026-08-24. There is no backup of the children's data and no
point-in-time recovery (launch blocker B12); `baseline_schema.sql` returns the STRUCTURE and none of
the data. Until Supabase Pro is on, a migration that only adds objects or rewrites predicates is
proportionate and one that rewrites rows in those three tables is not.

The billing migrations pass this test on purpose: the only data they mutate is the `chapters`
catalog and `diagnostic_plans.active`. Neither is a child's work.

## The sequence for applying a migration by hand

1. **Capture the rollback FIRST, and commit it.** For every object the migration replaces: the
   current `qual`/`with_check` from `pg_policies`, `pg_get_functiondef` for each function, and the
   before-values of any row the migration UPDATEs. That file IS the rollback script. ⚠️ It is not a
   backup, and calling it one is how you end up without either.
2. **Run the stale-migration diff above** — even on a file written the same day. The point is the
   habit, and a file that replaces a live policy is exactly the case that cost us a security
   regression.
3. **Apply**, one migration at a time.
4. **Verify from the CATALOG, not the success flag.**
5. ⚠️ **THEN DRIVE A REAL WRITE END TO END.** This is the step that matters and the one a catalog
   query cannot stand in for. When the billing guard reaches the `sessions` policy on a database
   with no subscriptions, every object is exactly as intended and every family has silently stopped
   being able to save. The catalog would have said everything was fine.
6. **Rename the repo file** to the version the ledger recorded — repo-side, zero ledger writes.
7. Re-run the advisors, and watch `ci / rls-tests` on the next PR.

## Preconditions that are not optional

- **A one-way door needs a real check, not a plausible one.** If a migration can break a live path
  (revoking a grant something falls back to, dropping a column something still writes), prove the
  precondition against production before applying — and prove it with something that has *no
  fallback*. Confirming the service-role key by watching a lead land would have proved nothing:
  `/api/lead` falls back to the anon key and looks identical either way. `sinkError` has no
  fallback, so a row in `error_events` could only mean the key was present.
- **Vercel env vars bind at DEPLOY time.** Setting one in the dashboard does not reach the running
  deployment. A variable check needs a fresh production deploy, and "the deploy succeeded" is not
  evidence — read the effect.

## How to apply

Prefer the pipeline (`deploy.yml` → `migrate-prod`, behind the required-reviewer gate) once it is
enabled. Applying by hand through the Supabase MCP `apply_migration` works, but note:

⚠️ **It records the migration under a GENERATED version, not your filename's version.** That is how
this repo accumulated 58 mismatched versions. After applying by hand, rename the repo file to the
version the ledger recorded — repo-side, so no production write is needed. See
[docs/schema-baseline-debt.md](../schema-baseline-debt.md).

## After applying

1. Verify the intended change by **querying the catalog**, not by trusting the success flag.
2. Watch `ci / rls-tests` on the next run. It replays every migration from zero against a throwaway
   Postgres and runs 17 cross-tenant assertions; it is the thing that catches a reversion.
3. If the change touched a policy, grant or function ACL, regenerate
   `supabase/schema/security_baseline.sql` and review the diff.
