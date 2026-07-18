# E2E tests (Playwright)

Drives the running app in a real browser — closes the "auth-gated, needs human tap-through" gap that unit tests and `next build` can't.

## Run
1. Start the dev server via the preview tooling (`milo-dev`, port 3017) — never raw-Bash a dev server.
2. `npm run test:e2e` (add `E2E_CHAPTER=<id>` to target another teen chapter; `E2E_BASE_URL=` to point elsewhere).

## Kid personas (`personas.ts`)
Deterministic interaction strategies — **not** LLM agents (a gate must be repeatable, fast, free). Two tiers:

- **Robustness personas — shipped.** `rageTapper` (double-tap / rapid-fire → the stale-timer/double-submit bug class), `quitterKid` (bail mid-flow → unmount cleanup). Need no knowledge of the answer.
- **Correctness personas — built, specs `test.fixme` (not gating yet).** `aceKid` (always right → mastery early-exit + guided-skip on resume), `strugglerKid` (wrong → warm reveal via QuestionBoard; demotion after 3 is hidden → prove in adaptive unit tests). `comebackKid` (struggles then gets it → promotion) is not built yet. NOTE: the "show me how"/showSolve helper is REMOVED (enabled by no chapter) — don't assert on it.
  - **Next slice (an app change, needs frontend/backend):** expose the current task's answer via a dev-only hook — e.g. `data-test-answer` on the question board, rendered only when `NODE_ENV !== 'production'` (or behind a `?e2e=1` preview flag). Then a correctness persona reads it and taps the matching `AnswerPad` choice / drives the instrument to it. This keeps the personas deterministic without an LLM solving the math, and never ships the answer to real users.

## Auth-gated flows (invites, dashboards, progress saving)
Public routes (`/teen-preview?c=<id>`) need no auth and cover the adaptive engine. For signed-in journeys: seed a **confirmed** user at the DB layer (`insert into auth.users` with `email_confirmed_at` preset — never sign up a fake email, it bounces), drive the login, do the work, and delete the test user/learner afterward (cascades handle child rows).
