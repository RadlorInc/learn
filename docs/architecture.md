# Architecture — Radlic (repo: milo-story-mode)

⚠️ **This file used to hold a folder tree and a layering rule written 2026-07-03.** By September both
were wrong — it listed `skillGraph.ts`, `diagnosticEngine.ts`, `features/daily`, `features/insights`,
`infra/ar` and a Zustand `state/` folder, all deleted, and it stated rules the code no longer follows.
A reader obeys a confident description of a deleted system, so the body was removed on 2026-09-26.

**The current map is [`docs/review/ARCHITECTURE.md`](review/ARCHITECTURE.md)** (system map, data flows
end to end, every place child data is read or written, database inventory — measured 2026-09-26, and
dated there). Re-measure rather than trust it once the code has moved on.

## What is still true, and what checks it

- **`src/core/` is pure.** It imports only `@/core` and never `react`. `src/__tests__/layering.test.ts`
  gates exactly those two things and nothing about any other folder.
- **The layer names** — `app/` (routes), `features/` (vertical slices: `lessons`, `dashboard`,
  `consent`, `classes`, `billing`, `admin`, `chapters`), `data/` (Supabase client, auth adapter,
  `repositories/*`), `infra/` (storage, sync, speech, error sink), `shared/` (UI kit, hooks) — are
  folder names, not an enforced dependency rule. As measured 2026-09-26 the import graph has upward
  imports, and supabase-js is called outside `data/` as well as by raw `fetch` in every API route
  (`docs/review/ARCHITECTURE.md` §2.1). Do not cite "only `data/` talks to Supabase" as a guarantee.
- **The access boundary is RLS**, not the folder layout: see [`docs/security.md`](security.md) and
  `supabase/tests/rls_regression.sql` (run by `ci / rls-tests` on every push).
