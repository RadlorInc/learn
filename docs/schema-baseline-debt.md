# Debt — the schema baseline is frozen drift, not resolved drift

**Status:** known, deliberate, not scheduled. Written down 2026-08-24 because the knowledge
otherwise lives only in a chat log, and a chat log is not somewhere you can look things up in six
months.

## What the debt is

`supabase/schema/baseline_schema.sql` reconstructs the part of the production schema that **no
migration creates**. It exists because seven base tables were made in the Supabase dashboard in the
first weeks of the project, so a database built from `supabase/migrations/*` alone does not have
them — which is why the RLS regression suite had never run anywhere except production, and why it
reported success for weeks while executing nothing.

The baseline makes CI work. It does **not** resolve the drift; it records it. Production still
contains objects that no migration will ever recreate, and the repo can only rebuild them by
applying a file that is deliberately kept out of the migration path.

## Exactly what is frozen

| kind | objects |
|---|---|
| tables (7) | `profiles`, `learners`, `learner_access`, `learner_invites`, `sessions`, `learner_progress`, `learner_stats` |
| enums (2) | `invite_status`, `user_role` |
| functions (5) | `handle_new_user`, `grant_owner_access`, `init_learner_stats`, `set_updated_at`, `rls_auto_enable` |
| triggers (7) | `on_auth_user_created`, `on_learner_created`, `on_learner_created_stats`, `learners_updated_at`, `learner_progress_updated_at`, `learner_stats_updated_at`, `profiles_updated_at` |
| indexes (2) | `sessions_learner_id_idx`, `sessions_started_at_idx` |
| policies (12) | the ALTER-only set across learners / learner_access / learner_invites / sessions / learner_progress / learner_stats / profiles |

## Why it was not resolved on the day

Promoting the baseline into `supabase/migrations/` means giving it a version that sorts before the
68 existing files. `supabase db push` would then see a backdated migration as *pending* and apply
it to production — where every one of those objects already exists, and where the file re-creates
33 policies, which requires dropping the live ones first. Dropping a live RLS policy on a
children's app, even for microseconds, is not something to do for the convenience of a test
harness.

## The resolution, when it is scheduled

Two steps, in this order, and neither is urgent:

1. **Promote** `supabase/schema/baseline_schema.sql` to `supabase/migrations/00000000000000_baseline.sql`
   (a real committed file), and delete the `cp` step from `.github/workflows/ci.yml`, the
   `.gitignore` line, and the "is never committed" assertion in `src/__tests__/baselineSchema.test.ts`.
2. **Repair the ledger** so production records it as already applied and never tries to run it:
   ```sql
   insert into supabase_migrations.schema_migrations (version, name)
   values ('00000000000000', 'baseline')
   on conflict (version) do nothing;
   ```
   The CLI equivalent is `supabase migration repair --status applied 00000000000000`.

After that the repo can rebuild production from zero with no special-casing, and
`baseline_schema.sql` stops being a parallel truth.

## ⚠️ What makes it worse over time

The baseline was generated from the live catalog on 2026-08-24. **It drifts the moment anyone
changes the schema in the Supabase dashboard again** — and a stale baseline means the RLS suite
passes against a database that is not the one we ship, which is a *worse* failure than the one it
replaced, because it looks like coverage.

Regenerate it the same way `security_baseline.sql` is regenerated (see `docs/security.md`) and
treat a non-empty diff as a schema change that needs review. Better: stop making schema changes in
the dashboard. Every object in the table above is there because somebody did.

## Related constraint, worth knowing before you edit it

The baseline is **the schema at migration-zero, not the schema today**. It carries three columns
that production no longer has — `learner_stats.current_streak`, `learner_stats.longest_streak`,
`learners.date_of_birth` — because migrations replay history and reference them before dropping
them. `src/__tests__/baselineSchema.test.ts` derives all five compatibility rules from the
migrations rather than hard-coding them; read its header before changing the file.
