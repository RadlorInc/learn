# Radlic

Adaptive maths from KG to grade 8, made by Radlor Inc., at https://radlic.com.

A Grade 3–8 lesson explains one idea step by step, the way a teacher would at a board; then practice
adapts — two right in a row bring a harder *kind* of question, a miss brings worked steps. KG, Grade 1
and Grade 2 learn through short voiced story chapters. Maths without fear: no timers, no red crosses,
no visible level. A parent or teacher chooses what each child sees, and a parent gives verifiable
consent before a child's data is kept.

The product was called **Milo** until August 2026 and **AdaptiveLearn** until September 2026. Code identifiers keep the old name on purpose; anything a person sees says Radlic.

## Run it

```bash
npm install
npm run dev
```

Without `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` the app still runs
and keeps progress on the device.

## Tests

| command | what it does |
|---|---|
| `npm test` | vitest: the unit, database (pglite) and doc gates |
| `npm run build` | the production build |
| `npm run test:e2e` | Playwright against a running dev server (`E2E_BASE_URL` to point elsewhere). Signed-in specs fake the Supabase calls — `e2e/short-sessions.spec.ts` shows how |
| `npm run break -- <test> "<break>"` | runs one test against a deliberately broken tree and proves it goes red |
| `npm run smoke:live` | read-only checks against the live site after a deploy |

CI (`.github/workflows/ci.yml`) runs the typecheck, vitest, the build, a dependency audit and the
row-level-security suite on every push.

## Where things are

Start with [docs/START-HERE.md](docs/START-HERE.md) — a one-page map of every doc.
[handoff.md](handoff.md) is the current state and the open items. [CLAUDE.md](CLAUDE.md) holds the rules
for anyone (person or agent) changing this repo.

Code: Next.js 16 · React 19 · TypeScript · Supabase. Lessons in `src/features/lessons/`, story chapters
in `src/features/chapters/`, consent in `src/features/consent/`, the parent and teacher dashboard in
`src/features/dashboard/`, the database in `supabase/migrations/`.
