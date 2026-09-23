# Milo

An adaptive maths app for children aged 3–18. **70 chapters across six age bands**, each one a thing
you *do* rather than a quiz: you count a parade home, fill a coin tray, peg out a building plot, load
a cart from a chart. The product rule is *maths without fear* — no timers, no red crosses, no visible
score, and difficulty that moves invisibly.

**Live:** https://milo-story-mode.vercel.app

| band | look | how you answer |
|---|---|---|
| 3–5, 6–8 | painted story worlds | tap the world itself |
| 9–11 | neon "field lab" instruments | build the answer — **or hold it up to a webcam** |
| 12–14, 15–16, 17–18 | field-lab games on one shared engine | work the instrument |

## Running it

```bash
npm install
npm run dev
```

Supabase backs sign-in and progress sync; without `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` the app still runs, storing progress locally.

| | |
|---|---|
| `npm test` | vitest — the invariant gates (1,039 tests) |
| `npm run build` | production build |
| `npm run lint` | eslint |
| `npm run test:e2e` | playwright |

## Reading the code

Next.js 16 · React 19 · TypeScript · Supabase. ~76k lines under `src/`, 18 routes.

- `src/features/chapters/story/` — the 3–11 story chapters, plus the pure modules (`cents.ts`,
  `plotMaths.ts`, `cargo.ts` …) that hold every rule a gate can check.
- `src/features/chapters/teen/games/` — the 12–18 band and the ported 9–11 chapters, each a data
  file over the shared `parts/GameShell.tsx`.
- `src/core/` — the adaptive engine (invisible tiers, re-teach after 3 wrong, mastery early-exit),
  the skill graph and the diagnostic.
- `src/infra/ar/` — webcam hand-tracking: the readings a 9–11 chapter can answer with.

**The maths and the words live in the pure modules; the layout lives in the shell.** That split is
why one engine runs ~40 chapters, and it is the first thing to understand before changing any of them.

## Before you change a lesson

Read **[docs/new-flow/README.md](docs/new-flow/README.md)** — how a lesson is scripted, approved,
built and verified. The old chapters are hidden while lessons are rebuilt in this format.

[handoff.md](handoff.md) is the current state of the work; older sessions are in
[docs/handoff-archive.md](docs/handoff-archive.md), which is not loaded by default — grep it.
[docs/lessons.md](docs/lessons.md) lists the defect classes that have reached `main` and the gate
that now catches each.

[docs/legal/](docs/legal/README.md) holds the US legal document set — **every one of them is an
unpublished DRAFT full of `[PLACEHOLDER — …]` markers, and none of it is wired to a route**; a gate
in `src/__tests__/legalDocs.test.ts` fails the build if any of it reaches published content.
