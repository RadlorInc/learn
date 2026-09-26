# Radlic

Adaptive maths from KG to grade 8, made by Radlor Inc. A lesson explains one idea step by step, the
way a teacher would at a board; then practice adapts — two right in a row bring a harder *kind* of
question, a miss brings worked steps. The product rule is *maths without fear*: no timers, no red
crosses, no visible level. A parent or teacher chooses what each child sees.

**Live:** https://radlic.com (until the domain switch, https://adaptivelearn.radlor.com — it becomes a
permanent redirect; see [docs/RENAME-MANUAL.md](docs/RENAME-MANUAL.md)).

The product was called **Milo** until August 2026 and **AdaptiveLearn** until September 2026. Code
identifiers kept the old name (`useMiloSpeaker`, `--milo-orange`, `milo_active_learner` …) on purpose:
they are what stored data and running devices depend on. Anything a person sees says Radlic, and
`src/__tests__/renameGate.test.ts` fails if that stops being true.

## Running it

```bash
npm install
npm run dev
```

Supabase backs sign-in and progress sync; without `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` the app still runs, storing progress locally.

| | |
|---|---|
| `npm test` | vitest — the invariant gates |
| `npm run build` | production build |
| `npm run lint` | eslint |
| `npm run test:e2e` | playwright |

## Reading the code

Next.js 16 · React 19 · TypeScript · Supabase.

- `src/features/lessons/` — the lessons (content as data in `content/g<grade>m<module>.ts`), the lesson
  player and adaptive practice.
- `src/features/consent/`, `src/app/consent/` — verifiable parental consent (email plus); read
  [docs/legal/](docs/legal/README.md) first.
- `src/features/dashboard/`, `src/app/parent/` — the parent and teacher dashboard.
- `src/features/chapters/` — the 23 story chapters: the **KG, Grade 1 and Grade 2** tabs of the child's home
  (`chaptersForGrade` in `src/core/chapters.ts`), rewritten without a mascot on 2026-09-25. Their old surfaces
  (age-band menu, demo, `/story`) stay off behind `LEGACY_CHAPTERS_HIDDEN`.

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
