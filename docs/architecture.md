# Architecture — Milo Story Mode

_Clean-architecture layering introduced 2026-07-03. Behavior-preserving refactor; `tsc` + `npm test` (15/15) + `next build` all green._

## The dependency rule

Dependencies point **inward**. Inner layers know nothing about outer ones.

```
app  →  features  →  data  →  core
                 ↘  infra  ↙
        shared (leaf: UI kit + generic hooks)
```

- **`core` is pure** — no React, no Supabase, no browser APIs. Unit-testable in isolation.
- **`data` is the only layer that talks to Supabase.** Nothing above it imports the Supabase client.
- **`app` (routes) is thin** — composition + presentation. No data access, no business logic inline.

## Folder structure

```
src/
  app/                      Next.js routes — thin; render + delegate to features/data
  core/                     PURE domain (no React / Supabase / browser)
    chapters.ts  skillGraph.ts  diagnosticEngine.ts  diagnosticItems.ts
    adaptive.ts  scoring.ts  questionVariety.ts  leveling.ts
    ageGroups.ts  grammar.ts
  data/                     Data-access layer — sole owner of Supabase
    auth.ts                 auth adapter (the only caller of supabase.auth.*)
    supabase/               client, server, types, session/sync/guard hooks
    repositories/           one module per domain (was: queries.ts, 797 lines)
      profile · learners · grades · progress · sessions · diagnostics · invites
      _shared.ts            db() + sync-error classification (internal)
      index.ts              barrel — import from '@/data/repositories'
  features/                 vertical slices (own hooks + pure logic + local UI)
    chapters/               chapter content: game / story / lessons / teen
    daily/                  daily-challenge + streak service
    insights/               metrics.ts (pure) + useInsights.ts (orchestration)
  infra/                    cross-cutting: analytics, speech, offline-sync, ar/
    storage/                localStorage-backed helpers (kv, activePlan, checkup, …)
  shared/                   reusable, feature-agnostic
    ui/                     the design-system component kit
    hooks/                  useViewport, useChapterPhase, useLearnerChapters
  state/                    global Zustand store (persists the player profile)
```

## What changed (and why)

| Before | After | Why |
|--------|-------|-----|
| `src/lib/` — 24 files, 4 concerns mixed flat | `core` / `data` / `infra` / `shared` / `state` | Separation of concerns; enforce the dependency rule |
| `supabase/queries.ts` — 797-line god-module, 7 domains | `data/repositories/*` split by domain + barrel | Modularity; each domain is independently changeable |
| 6 pages import `createClient()` + run raw `.from()/.rpc()` | `data/auth.ts` adapter + repository reads | Seal the UI→infra boundary; UI never touches Supabase |
| `insights/page.tsx` — 293 lines mixing fetch + aggregate + render | `features/insights/{metrics,useInsights}` + 122-line page | Reference feature-slice; pure logic is now unit-testable |
| Leveling math inside the Zustand store | `core/leveling.ts` (store re-exports) | Pure domain out of the state container |
| `components/{ui,game,story,lessons,teen}` | `shared/ui` + `features/chapters/*` | Shared kit vs. feature content, organized by bounded context |

## Conventions going forward

- **New DB access** → add a function to the matching `data/repositories/*` module (never call `createClient` in a page/component). Auth → `data/auth.ts`.
- **New pure logic** (scoring, graph, math) → `core/*`, no imports from `data`/`infra`/React.
- **New page** → keep it thin; put orchestration in a `features/<x>/use<X>.ts` hook and pure logic in `features/<x>/*.ts` (see `insights` as the template).
- **Import from the barrel** `@/data/repositories`, not individual repo files, at call sites.

## Deliberate stops (senior judgment, not oversights)

- **The Zustand store was not split into multi-file slices.** It persists a single `profile` slice through a custom per-learner storage key + `partialize`/`merge` that guards live user progress. A multi-file slice split there is high-risk for marginal gain; only the *pure* leveling math was extracted. Revisit only with store tests in place.
- **`data/repositories` still calls `toast` on write errors.** This is pre-existing UI-in-data coupling, preserved to keep user-facing error behavior identical. A future pass could return typed errors and let the UI decide.
- **The remaining large pages** (`parent/page.tsx`, `menu/page.tsx`) keep inline orchestration. Sealing the Supabase boundary already removed their infra coupling; extracting full `useParentDashboard`/`useMenu` hooks is the next incremental step, deferred to avoid behavior risk on heavily-stateful live pages without test coverage.
