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

---

# The ledger side — repaired 2026-08-24

Separate from the baseline debt above, and now closed: the repo's migration **filenames** disagreed
with the versions production had actually recorded, for 57 of 72 files. Every one had been applied
by hand through the MCP `apply_migration`, which records a **generated** version, not the one in the
filename — so `20260615180001_secure_learners_rls` was sitting in the ledger as `20260615142012`.

## How the pairing was done, and why it matters

**By CONTENT, not by name.** The ledger stores the SQL it applied, so a repo file can be matched to
a ledger row exactly:

```sql
select version, name,
       md5(regexp_replace(regexp_replace(array_to_string(statements, E'\n'),
           '--[^\n]*', '', 'g'), '\s+', '', 'g')) as norm_md5
from supabase_migrations.schema_migrations order by version;
```

⚠️ **A RAW hash does not compare.** The CLI strips comments that precede the first statement when it
stores a migration — `index_chapter_fks` is 331 bytes on disk and 173 in the ledger — so only 13 of
72 files matched raw, and it reads exactly like mass drift. Strip `--` comments and all whitespace
from BOTH sides and 68 of 72 pair exactly.

⚠️ **And name-only pairing would have been a disaster, not merely weaker.** It would have matched
`20260816120000_perf_advisors` to nothing and — under the obvious "assume applied, just renamed"
reading — marked it applied. It had **never run**. Content pairing is what proved it, and applying
it cleared 5 `auth_rls_initplan` warnings and 3 `unindexed_foreign_keys` from the live advisor report.

## What the repair did

**Repo-side. Zero writes to `schema_migrations`.** Renaming the files reaches the same acceptance
test as rewriting the ledger, with nothing to roll back, and it is what
[runbooks/applying-migrations.md](runbooks/applying-migrations.md) already prescribes. The ledger
holds the true apply ORDER; the repo now agrees with it rather than the other way round.

Checked before renaming: the ledger order is an order-**preserving** relabelling of all 71
previously-applied files — no permutation — so replay order is unchanged. `perf_advisors` is the one
file that moves (it becomes last, recorded as `20260823225313`), which is safe because nothing else
in the repo touches the five `diag_*` policies and its three indexes are `if not exists`.

The prior state is committed at [`../supabase/schema/ledger_snapshot_20260824.tsv`](../supabase/schema/ledger_snapshot_20260824.tsv)
— 73 rows, version + name + both hashes. ⚠️ It is bookkeeping, **not a database backup**; see
launch blocker B12.

## What is still drift, deliberately

**Two remote-only ledger rows**, the halves of two split points where production ran the work in two
migrations and the repo carries one file:

| ledger row | the repo file that covers it |
|---|---|
| `20260629023502 grades_pin_touch_search_path` | `20260629023238_grades.sql` (carries the pin) |
| `20260702113253 sync_recheck` | `20260702121810_sync_recheck.sql` (carries the ORDER BY fix) |

They are informational — `db push` matches on **version** and only applies local files the remote
does not have, so neither blocks anything.

**Two rows whose `name` column disagrees with the repo filename**, because version is the key and
name is not, and adopting production's name would have made a filename lie about its contents:

| version | ledger name | repo filename |
|---|---|---|
| `20260617145125` | `fix_learner_access_recursion` | `..._fix_learner_access_grant.sql` |
| `20260702121810` | `fix_sync_recheck_order_by` | `..._sync_recheck.sql` (it creates the whole RPC) |

## The acceptance test

`supabase db push --dry-run` must report **zero pending**. Computed 2026-08-24 (the CLI is not
installed on the build machine; this is the same set comparison the command makes):

```
ledger rows: 74      repo files: 72
LOCAL not in REMOTE  (= pending):        0
REMOTE not in LOCAL  (informational):    2   ← the two split-point rows above
```

Re-run it as: list `supabase/migrations/*.sql`, cut the version prefix, and `comm` against
`select version from supabase_migrations.schema_migrations`.
