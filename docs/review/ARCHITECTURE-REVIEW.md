# Architecture & code-quality review (R2, prefix ARC-)

Reviewed: `w-review` = `origin/main` `06cee602`, read-only. Scratch evidence is under `review-scratch/arc/` and
`docs/review/sql/arc-legacy-reads.sql`. Calibration: tens of families now, ~10k in 12 months, Vercel + Supabase.
Evidence labels follow RULES.md: **Measured** (I ran it), **Reproduced** (a scratch test/script shows it), **Suspected**
(read from code, not demonstrated).

## 0. The shape of the codebase, in numbers (Measured)

| | |
|---|---|
| Source (excl. tests) | 692 `.ts/.tsx` files, 111,179 lines |
| Lesson **content + ladders** (data, not logic) | `features/lessons/content` 395 files / 51,281 lines; `ladders` 41 files / 16,633 lines |
| **Hidden legacy chapters** `features/chapters` | 56 files / 20,257 lines / 1.24 MB |
| `core/` (the only layer the layering gate checks) | 13 files / 782 lines (0.7 % of source) |
| Largest logic files | `app/parent/page.tsx` 1,021 lines / 68 KB · `infra/useMiloSpeaker.ts` 860 · `features/lessons/Diagrams.tsx` 858 · `LessonPlayer.tsx` 558 · `dashboard/i18n.tsx` 524 · `app/auth/page.tsx` 485 · `app/menu/page.tsx` 392 |
| `public/` | 342 MB, of which `audio/` 296 MB (Josh 137 MB/6,639 files, Teddy 85 MB/3,847, Stevie 75 MB/3,527) |
| Tests | 141 files / 3,810 passed / 11 skipped (baseline log); 3 `describe.skipIf(LEGACY_CHAPTERS_HIDDEN)` in `demoRun.test.ts`, 1 `skipIf(!PAYWALL_ENABLED)`, 1 `it.todo` |
| Layer import matrix (alias imports) | `features→shared 92, features→features 64, features→infra 54, features→core 46, features→data 24, features→app 5`; `data→features 2`; `infra→features 3, infra→app 2`; `shared→features 3` |

The layering diagram in `docs/architecture.md:10-13` is `app → features → data → core`, `infra`/`shared` as leaves. In
practice the **real domain logic lives in `features/lessons`** (`adaptive.ts`, `progressReport.ts`, `nudge.ts`,
`script.ts`) and `core/` holds leftovers of the legacy system (`progression.ts`, `rand.ts`, `praise.ts`) plus billing and
child-login helpers. That mismatch is the root of several findings below: the gate guards the folder that matters least.

---

## 1. Bad architecture decisions (and why at this size)

### ARC-01 — `/admin` Learning/Funnel and all product analytics measure the deleted chapter system (Medium, Measured)
- `admin_learning` counts completed chapters from `public.sessions`:
  `supabase/migrations/20260905150000_admin_role_and_metrics.sql:195` (`count(distinct s.chapter) from public.sessions`)
  and `:239` (funnel). No later migration redefines it (only `20260905110530` and `20260905150000` define it).
- Nothing in `src/` writes `sessions` any more: `grep "sync_session\|'sessions'"` finds only the dead reader
  `data/repositories/progress.ts:34` and comments; migration `20260917112252_delete_legacy_xp_and_chapter_history.sql`
  emptied it. The page text at `app/admin/learning/page.tsx:17-33` still describes "completed practice session".
- Every `track(...)` call in the app is a legacy/demo event (`chapter_open`, `practice_complete`, `demo_*`) plus
  `session_start`; **the live lesson flow emits none** (`grep -rhoE "track\('[a-z_]+'" src` — 8 names, none in
  `features/lessons`, `app/lesson`, `app/modules`, `app/practice`).
- Why it matters: CLAUDE.md's own class "a metric that can return exactly one value". The founder's only in-app view of
  learning outcomes reads a table that can only be empty or frozen at 2026-09-17. At 10k families this is the dashboard
  decisions will be made from.
- Production values: `docs/review/sql/arc-legacy-reads.sql` query 2 vs 3 (needs Rafi to run).
- Fix (own, new migration applied by Rafi): rebuild `admin_learning`/`admin_funnel` over `lesson_progress` +
  `point_events` (already written, no new collection). Adding a lesson-open event would be **new data collection about a
  child** → rafi/legal, not needed for a first honest version.

### ARC-02 — The dashboard reads child progress from the adult's device cache, and nothing ever clears it (Medium, Suspected; the "never cleared" half Measured)
- `app/parent/page.tsx:197-205`: for every child, `pullLessonProgress` copies the account's `lesson_progress` rows into
  the **adult's** IndexedDB (`infra/storage/lessonSync.ts:101-106`: `markLessonDone`, `saveStanding`, `saveRun` — the run
  includes the last 40 question texts and the problem on screen), then the cards count "done" from that device copy:
  `page.tsx:646-647` `lessons.filter(l => lessonDone(d.learner.id, l.id))`, `page.tsx:326,473` `isDone: id => lessonDone(...)`.
  The rows it needs were fetched **twice** per child in the same load (`getLessonRows` inside `pullLessonProgress` and
  again at `page.tsx:204`).
- No code removes any `milo-newflow-*` key (Measured: `grep -rn milo-newflow src` → only the three key builders;
  `kv.remove` is called only by analytics, demoRun, chapterResume). `signOut` (`data/repositories/profile.ts:38-53`)
  clears the active learner only. So a teacher on a shared classroom computer leaves every student's standings/runs in
  that browser after signing out, and a deleted child's progress stays on every adult device that ever opened the
  dashboard.
- Why not High (rule 7): keys are learner UUIDs, no names; readable only via devtools in the same browser profile; doc 08
  row 20 discloses "where they are in each topic's practice … until you clear it" generically. **Legal reviewer should
  confirm the teacher/shared-device case is covered.**
- Architecture point: the device copy was designed as the *child's* fast offline copy (`lessonSync.ts:4-8`); reusing it as
  the *adult's* read model makes the dashboard's truth depend on a cache (first paint shows 0 done until the pull lands)
  and turns every adult device into a replica. At 10k families the server rows are the cheaper, correct source.
- Fix: dashboard reads `getLessonRows` results directly (pure `progressReport` already takes rows); do not pull into kv on
  adult screens; clear other learners' `milo-newflow-*` keys on sign-out. own (no visible change), with a legal FYI.

### ARC-03 — Two "child home" routes that disagree: `/menu` and `/modules` (Medium, Suspected)
- The parent's **Start** button goes to `/menu` (`app/parent/page.tsx:291-293`), as do the error pages and 404
  (`app/error.tsx:36`, `global-error.tsx:36`, `not-found.tsx:35`), `/game` and 20+ legacy links (26 inbound links).
- `/menu` returns `<ModuleHome … back={{ href:'/parent', label:'← Switch' }} />` when legacy is hidden
  (`app/menu/page.tsx:235`). `/modules` (`app/modules/page.tsx:40-80`) additionally: switches a **free teacher's
  student** to `ExerciseHome` (class mode), polls for exercises being opened, redirects a child on a temporary password
  to `/auth/new-password`, and shows **Sign out** (not "← Switch" to a dashboard they cannot use) to a signed-in child.
- So the same child gets different product rules depending on which door they came through; the free-vs-paid class rule
  is bypassed via `/menu`. The rest of `/menu` (lines 236-392, incl. `PWAInstallBanner` at :390) is unreachable while
  the flag is on — which also means **the "install the app" banner is shown nowhere in the live app** (its only importer
  is that dead branch; `review-scratch/arc/legacy-only.out.txt`).
- Fix: `/menu` renders/redirects to `/modules`; point `launchGame` and error pages at `/modules`. rafi (changes what a
  class-mode child sees, and whether the PWA banner returns is a product call).

### ARC-04 — The layering gate guards 0.7 % of the code and is blind to four import shapes (Medium, Reproduced)
- `src/__tests__/layering.test.ts:51` matches `from\s+'@\/([a-zA-Z]+)` and `:66` `from 'react'|from "react"`, only over
  `src/core`. It has **no positive control in the file**; its header claims mutations fail (`:31-32`).
- `review-scratch/arc/layering-probe.test.ts` extracts both predicates **from the test's own source** and feeds planted
  lines (`layering-probe.out.txt`): caught — single-quoted alias import, type-only import, `from 'react'`; **missed** —
  double-quoted alias import, relative escape `'../infra/…'`, dynamic `import('@/infra/…')` (used in 52 files in `src`),
  side-effect `import '@/infra/…'`, `react-dom`, `next/navigation`, `require('react')`.
- What it does not check at all, with today's violations (Measured by grep):
  - upward imports into `features`/`app` from lower layers: `data/supabase/useChapterSync.ts:28`,
    `data/repositories/grades.ts:7`, `infra/diagnostics.ts:125-126` (re-exports from `@/app/site`),
    `infra/storage/lessonRun.ts:10`, `lessonStanding.ts:8`, `lessonSync.ts:14`, `shared/ui/LockedChapterCard.tsx:17`,
    `shared/ui/DataRights.tsx:20`, `shared/ui/ChildLoginSheet.tsx:12` (10 sites);
  - `features → app`: `features/consent/server.ts:17-19`, `features/dashboard/helpGoals.ts:1`, `DashNav.tsx:10`;
  - "data is the only layer that talks to Supabase" (`docs/architecture.md:16`): `createClient()` in 7 files outside
    `data/` (`infra/analytics.ts`, `infra/AuthEventLogger.tsx`, `app/admin/layout.tsx`, `app/admin/_parts.tsx`,
    `app/parent/plan/page.tsx`, `features/classes/Classes.tsx`, `features/consent/consentState.ts`) and hand-rolled
    `/rest/v1`/`/auth/v1` calls in 7 more (see ARC-06); `data/repositories/grades.ts:4` imports UI `toast`.
- The **true domain** (`features/lessons/adaptive.ts` and friends) is imported *by* `infra/storage` and `data/` — the
  arrows point the wrong way because the domain was never moved into `core/`.
- Fix: see Target §7 step 6. own.

### ARC-05 — The Supabase client is untyped; the "auto-generated" types cover only deleted tables (Medium, Measured)
- `data/supabase/client.ts:5-18` calls `createSupabaseClient(url, key, …)` with no `Database` generic, so every
  `.from('x').select('y')` is untyped.
- `data/supabase/types.ts:1-2` says "Auto-generated … Re-run: `npx supabase gen types … > src/lib/supabase/types.ts`" —
  a path that does not exist; `:5` points at `src/lib/chapters.ts` (also gone). It declares `sessions`,
  `learner_progress`, `learner_stats`, `learner_state` and **0** of `lesson_progress`, `point_events`,
  `parental_consents` (`grep -c` = 0). `infra/analytics.ts:49` works around it with an `as any` client.
- Why it matters here: CLAUDE.md's hard-won rule is "the schema and the code that uses it must never be apart"; the one
  compile-time mechanism that enforces it is switched off. 112 migrations and a live beta make column drift likely.
- Fix: generate types from a local stack in CI (`supabase start` already runs in `ci.yml` rls-tests job), type the client,
  fail CI on a stale file. own. Not worth at this size: an ORM or a query builder.

### ARC-06 — Server-side Supabase access is hand-rolled five times; "who is the caller" three times (Medium, Reproduced)
- Service-role REST helpers: `features/consent/server.ts:69-80` (`rpc`) + inline at `:84,:115,:184`;
  `app/api/child-login/route.ts:43-45` (`asService`); `app/api/stripe/webhook/route.ts:39-49` (`db`);
  `app/api/billing/cancel/route.ts:40-43` (inline); `infra/errorSink.ts:69-75`. Each re-reads
  `SUPABASE_SERVICE_ROLE_KEY` and rebuilds headers.
- Caller identity from a bearer token: `app/api/checkout/route.ts:54-61`, `app/api/child-login/route.ts:48-55`,
  `features/consent/server.ts:94-102` (`adultFromBearer`, also used by `billing/cancel` and `consent/request`).
- They already disagree: `review-scratch/arc/duplicates.test.ts` D4 — `adultFromBearer` **throws** on a network error
  (the other two `.catch(() => null)` → 401), with a positive control that it returns `null` on a 401. All three fail
  closed, which is why this is Medium not High (rule 7 — auth-adjacent, proven not to fail open).
- Coupling: `features/consent/server.ts` has become the de-facto server SDK (auth, rpc, email, suppression); billing and
  signup import the consent feature to authenticate. A change to consent plumbing reaches checkout/cancel.
- Fix: one `src/server/supabase.ts` (`serviceRest`, `serviceRpc`, `callerFromBearer`) used by all routes. own. ~8 files.

### ARC-07 — A synchronous loop pins a vitest worker forever; CI has no job timeout (Medium, Reproduced)
- `review-scratch/arc/hang/syncLoop.test.ts` (a `for(;;)` with a 1 s test timeout): after 20 s the run was still
  going, and **killing the parent left the `vitest/dist/workers/forks.js` worker at 99 % CPU** (pid observed, then
  killed). That is the likely mechanism of the handoff's "two vitest workers hung for 4 days at ~90 % CPU": `testTimeout:
  20_000` (`vitest.config.ts:18`) cannot pre-empt synchronous code, and an interrupted run orphans its workers.
- The obvious suspect is not it (Measured): `review-scratch/arc/ladder-hang-fuzz.mjs` ran every ladder level's generator
  for seeds 0–999 (1,410,000 calls, slowest 56.9 ms) with no hang; its watchdog was positive-controlled with a planted
  infinite loop (exit 1). Seeds come from `freshSeed()` up to 2³¹, so this is not exhaustive; unbounded `while`/`until`
  re-roll loops remain in ladders (e.g. `ladders/g8m1.ts:21 until`, `ladders/g7m2.ts:110,128,174,192,200,215`).
- `ci.yml` has no `timeout-minutes` (grep empty) → GitHub's 360-minute default.
- Fix: `timeout-minutes: 20` on CI jobs; a shared `until(make, ok, max=1000)` that throws; note `pkill -f
  vitest/dist/workers` in the runbook. own, S.

### ARC-08 — `app/parent/page.tsx` is both dashboards in one 1,021-line component (Medium, Measured)
- 38 `useState`, 26 teacher branches (`tea`/`role === 'teacher'`), 120 inline `style={{…}}`, data loading, popups and
  both roles' layouts in one file. `docs/architecture.md:69` already deferred extracting it "without test coverage".
- Per child per load: `pullLessonProgress` (flush + `getLessonRows`), `getWallet`, and for parents `getRecentPoints` +
  `getLessonRows` again (`:197-206`) — 4–5 requests/child plus one RPC that returns dead-table data (ARC-10). A teacher
  with 30 students ≈ 90–120 requests per dashboard open. Fine for Supabase at 10k families in absolute load; the real
  cost is that every change risks both roles.
- Fix: extract `useDashboardData` (one `getLessonRows`, pure `buildReport`), then split `ParentHome`/`TeacherHome`
  components (same route, no visible change). own (≈5 files).

### ARC-09 — The hidden legacy system is ~⅓ of the non-content code and still costs every day (Medium, Measured)
- `LEGACY_CHAPTERS_HIDDEN = true` (`core/chapters.ts:86`). Code: `features/chapters` 56 files / 20,257 lines / 1.24 MB;
  modules used **only** by it (`review-scratch/arc/legacy-only.sh`, positive control `lessonSync` = live): `ChapterDone`,
  `LockedChapterCard`, `MiloPointer`, `NewLessonsSoon`, `PWAInstallBanner`, `SceneBg`, `useAdaptive`, `useChapterPhase`,
  `useOnceGuard`, `useViewport`, `lastPlayed`, `lessonSeen` (≈840 lines) + `core/progression.ts`, `core/rand.ts`,
  `core/praise.ts`, `infra/storage/activePlan.ts` (194 lines, "the diagnostic's arranged chapter sequence" — the
  diagnostic was deleted 2026-09-20), `chapterResume.ts`, `demoRun.ts`, `features/chapters/story/preteen/kit.tsx`
  (255 lines, the deleted 9–11 band's kit, still imported by `app/demo/page.tsx`), and the dead half of `app/menu`.
- Routes that are now shells: `/story` and `/demo` render `NewLessonsSoon`; `/game` renders it for every chapter id
  (`app/game/page.tsx:111`). `/ui-preview` and `/lesson-preview` 404 in production (`notFound()` guard) — fine.
- Tests: the 27 test files that import chapter/progression/rand code ran 530 tests in 13.7 s wall (≈14 s of the suite's
  272 s test time; `review-scratch/arc/legacy-tests.json`). Small.
- Audio: all 36 modules are in `JOSH_MODULES` (`infra/storage/voicePref.ts:35`), so `lessonVoice()` never returns
  Teddy/Stevie; they remain for `BAND_VOICE` (legacy 3–5) and the device preference (`infra/voiceClipPlayer.ts:33-34`).
  **~160 MB / 7,374 clips ship in every deployment** mainly for the hidden system (Suspected that no live line uses
  them; the team hit Vercel's storage limit before — handoff 🔐).
- CI: `nightly-e2e.yml:51-70` and `weekly-layout.yml:40-65` exercise only legacy chapters and **skip** while hidden; no
  CI job drives the live lesson flow or runs `eslint` (ci.yml has no lint step; `eslint-disable` appears 80 times).
- Decision is rafi: the `kg2-story-chapters` branch plans to revive 23 of these chapters as KG–2. Either delete (git
  history keeps it) or treat it as live code and pay for it (ARC-11).

### ARC-10 — Dashboard "last played" reads a column nothing writes; three dead tables fetched per load (Medium, Suspected)
- `app/parent/page.tsx:650` shows `d.stats?.last_played_at`. Migration `20260917112252…sql:15,22` nulled it and says
  "it was set only by playing the old chapters"; no later migration writes it (grep of `last_played_at` across
  migrations: last write is that clearing). So every child card should read "last played —".
- `getParentDashboard()` / fallback (`page.tsx:157-191`) still fetch `learner_stats`, `learner_progress`, `sessions`
  per child (`data/repositories/progress.ts:11-42`), and the COPPA data-rights bundle carries them (`page.tsx:501`).
- Confirm: `docs/review/sql/arc-legacy-reads.sql` query 1 (needs Rafi). Fix: derive last activity from
  `max(point_events.created_at)` / `lesson_progress.updated_at` in the RPC. rafi (the parent will see a date instead of
  "—").

## 2. Duplicate logic (both sites, agreement proven)

All in `review-scratch/arc/duplicates.test.ts` (output `duplicates.out.txt`). Local one-line helpers are **extracted from
the source text at run time**, not retyped, and the extraction throws `PROBE VOID` if it stops matching.

### ARC-11 — Two definitions of "mastered" write one column (Low now; Medium the day chapters return; Reproduced)
- Chapters: `core/progression.ts:99-101` (tier 3 and streak ≥ 6, via `nextDifficulty` promote at streak 3/accuracy
  0.8), recorded through `finishAndSync(…, mastered)` → `lesson_progress` (`features/chapters/ChapterPortal.tsx:85`,
  `data/supabase/useChapterSync.ts`).
- Lessons: `features/lessons/adaptive.ts:68-75` (right first try twice at the top rung).
- Same input — all answers right first time: **chapter masters after 6, a 4-rung lesson after 8, a 6-rung after 12**
  (D3). The parent's "topics mastered" (`progressReport.ts:77`, `page.tsx:345-348,663`) sums both. Harmless while
  chapters are hidden; rafi to decide the definition before KG–2 ships.

### ARC-12 — Eight spellings of "show a signed number"; they disagree on edge inputs (Low, Reproduced)
- `core/fmt.ts:10` `disp` — whose header says "`disp` existed as four identical copies. It is here" — is **imported by
  nothing** (`grep "@/core/fmt"` → no importer, not even a test). Meanwhile: `features/lessons/script.ts:145`,
  `ladders/g7m2.ts:11`, `g8m2.ts:16`, `g8m3.ts:7`, `g8m1.ts:26`, `g8m4.ts:20`, `g8m6.ts:13`, `content/g7m2.ts:13`,
  `content/g8m4.ts:16`, `content/g8m2.ts:20`, `Diagrams.tsx:23`, chalk files.
- D1 table: all agree on −3; on −1234 four give `−1,234` and three `−1234`; on −0 three give `−0`, one (`g8m3 sn`) gives
  hyphen-minus `-0`, four give `0`.
- Reachability (Measured): `review-scratch/arc/negzero-scan.mjs` generated 423,000 practice problems (every rung, seeds
  0–299) and found **0** negative zeros and **0** hyphen-minus negatives (control: `showAnswer(-0)` is flagged). Latent,
  not live. own: one `signed()` in `core/fmt.ts`, ladders import it.

### ARC-13 — Seeded RNG and pick/shuffle written twice (Low, Reproduced agreement)
- `core/rand.ts:28-35` `mulberry32` ("this is the third and last home for it") vs `features/lessons/adaptive.ts:22-31`
  `rng` — a fourth. D2: identical sequences for 50 seeds × 200 draws. Also `pick`/`shuffle` in both files with different
  signatures (seeded vs `Math.random`), `fmt` (`adaptive.ts:42`) = `fmtNum` (`script.ts:141`). No disagreement; pure
  duplication. own, fold into ARC-12's step.

### Checked and NOT duplicated (positive results, so nobody re-audits them)
- Consent state: one reader, `features/consent/consentState.ts:32-43`; enforcement is in the database (gate on child
  tables), not re-implemented per screen.
- Language: one key `al-lang`, one `useT` (`features/dashboard/i18n.tsx:18,45-46`). `sessionCopy.ts` and
  `consent/copy.ts` are separate tables by audience, not copies of each other.
- Praise: `core/praise.ts:25` (chapters) and `features/lessons/sessionCopy.ts:51` (lessons) are different lists for
  different systems; `praisesOnCorrect` (`core/praise.ts:33`) has **no production caller** — it is kept alive only by
  `__tests__/chapterResume.test.ts:126-131` (a test of a dead function).
- Progress report vs Performance tab both call pure `buildReport`/`progressReport.ts`; they differ only in fetching.

## 3. Dead code, unused exports and dependencies (Measured)

- `ts-prune` (`npx ts-prune@0.10.3`, output `review-scratch/arc/ts-prune.txt`, 434 lines) filtered and grep-verified by
  `review-scratch/arc/unused-verify.sh` (positive control `lessonDone` → 10 prod refs): **30 exports with no production
  reference**, e.g. `core/accountDeletion.ts:58 NOT_REACHABLE_BY_DELETION`, `core/ageGroups.ts:23 AGE_GROUP_LABELS`,
  `core/billing.ts:29 CURRENCY`, `core/chapters.ts:130 CHAPTER_PARENT_LABELS`, `data/auth.ts:20 getCurrentUser`,
  `activePlan.ts planInProgress/planSource`, `handInput.ts` (whole file), `leadEmail.ts setLeadEmail`,
  `voicePref.ts setVoicePref`, `shared/hooks/useLearnerChapters.ts` (whole file), `infra/storage/speechRate.ts` (whole
  file, no importer), 8 `preteen/kit.tsx` components, `chalkboard.tsx ThePlan/StepBoard/CHALK_CSS`, `art.tsx` 4
  exports, `_kit.tsx Confetti/LessonScaffold`. The 80 `data/repositories/index.ts` hits are barrel false positives (22
  barrel imports vs 23 direct — the "always import from the barrel" convention is half-followed).
- **`zustand` is a dependency with 0 imports** (`src/state/` was deleted 2026-09-20; positive control: `stripe` → 2).
- `public/{file,globe,next,vercel,window}.svg` — create-next-app leftovers, 0 references each. `public/voice-samples.html`
  (1.2 MB) is referenced only by a comment (`content/voice/styles.ts:2`).

## 4. Maintainability hazards (Measured)

### ARC-14 — Auto-loaded agent context is ~133–161 KiB per session, a third of it stale or bookkeeping (Low, Measured)
- `CLAUDE.md` 59.4 KiB (540 lines) + `@AGENTS.md` 0.7 + **`@docs/security.md` 13.7 KiB** — pulled in by a passing
  "See also **@docs/security.md**" at `CLAUDE.md:164`, i.e. a prose reference is an *import*; that file was last edited
  2026-08-25 and is known-stale ("all 12 DEFINER functions", V13 "OPEN") — + `@handoff.md` (`CLAUDE.md:525`).
- `handoff.md` on `main`: 58.9 KiB, inside the ~60 KiB target — but it ends 2026-09-24. The live, uncommitted copy in the
  main checkout is **91.0 KiB**; ≈10.4 KiB of it is paragraphs about the file's own size budget and a single 13.4 KiB
  footer line listing archived sessions. `docs/handoff-archive.md` is 1.78 MB.
- rafi (the founder's rules file): replace the `@docs/security.md` mention with a plain path, move the size bookkeeping to
  one line, commit the live handoff.

### ARC-15 — Stale architecture doc, types header and comments that describe deleted systems (Low, Measured)
- `docs/architecture.md:21-45` lists `skillGraph.ts`, `diagnosticEngine.ts`, `features/daily`, `features/insights`,
  `infra/ar`, `state/` (Zustand) — all deleted — and states rules the code no longer follows (ARC-04). A reader obeys it.
- `infra/storage/lessonProgress.ts:4-5` "ponytail: device-local only — not synced to Supabase yet" — false since
  `lessonSync.ts` (which imports it) shipped 2026-09-17.
- `data/supabase/types.ts:1-6` (ARC-05); `core/rand.ts:12-14` cites "the diagnostic's own `mulberry32`"; `core/praise.ts`
  argues about 9–11/12–18 bands and `GameShell`/`OrderDesk`/`LevelRun`; `infra/storage/activePlan.ts:1-9`.
  Overall 25 non-test source files / 31 lines name a deleted system (some deliberately as history).
- Seven `docs/teen-*.md` + `framing-12-18.md` (~141 KB) describe bands deleted 2026-09-20.
- own: rewrite `architecture.md` to the Target below; fix the comments. Deleting the teen docs is cheap and safe (git).

### Largest files / slow tests
- Largest logic files listed in §0; only `app/parent/page.tsx` is a real hazard (ARC-08). `Diagrams.tsx` (858) and
  `useMiloSpeaker.ts` (860) are big but single-purpose; not worth splitting now.
- Slowest measured test in the legacy subset: `voiceNoOverlap.test.ts` 11.6 s (of 13.7 s). Suite total 85 s wall on a
  dev Mac — not a problem at this size.

---

## 5. Target architecture — only where it pays off

Keep Next + Supabase + local-first; keep the folder names. Change four things:

1. **One learning-record module.** `core/learning.ts` (pure): `Standing`, `step`, `runDone`, `progressOf`,
   `DONE_AFTER`, and the single definition of *done* and *mastered* that lessons (and chapters, if they return) use.
   `features/lessons/adaptive.ts` keeps generation (ladders, `draw`, `Run`); `infra/storage/*` and `data/` import types
   from `core`, never from `features`. Adult screens (dashboard, Performance, admin SQL) read **server rows**
   (`lesson_progress`, `point_events`) through that module; only the child's device keeps a kv replica.
2. **One server data module.** `src/server/supabase.ts`: `serviceRest`, `serviceRpc`, `callerFromBearer` (fail-closed,
   null on any failure). All API routes use it; `features/consent/server.ts` keeps only consent logic. The browser keeps
   `data/repositories` as the only Supabase caller (move the 7 stray `createClient()` uses behind it).
3. **A typed schema.** `Database` generated from migrations on a local stack in CI, the client typed with it, CI fails
   when the file is stale.
4. **A layering gate that parses imports** (`ts.preProcessFile` from the installed `typescript`, not a regex), over all
   layers, with today's violations as an explicit shrinking allowlist and a planted-violation positive control.

Not worth it at 10k families (said explicitly): a monorepo/packages split, a state library (zustand can simply go),
server components rewrite of the client pages, an ORM, a DI container, an i18n framework, microservices or a job queue.
Supabase + Vercel handle the load; the risk is correctness drift, not scale.

## 6. What the legacy decision changes

If `kg2-story-chapters` ships, `features/chapters` becomes live code: it must adopt `core/learning.ts`'s mastered rule
(ARC-11), stop depending on `/menu` (ARC-03), get CI coverage (the two skipped workflows), and keep Teddy's clips. If it
does not ship, delete the cluster in one PR (≈21k lines, ~20 test files, `/story`, `/demo`, `/game`, `/menu`'s dead
half, `core/progression`, `core/praise`, `activePlan`, `chapterResume`, `demoRun`, ~160 MB audio after confirming no live
line uses it, the two e2e workflows). Either way, decide before building more on top of it.

## 7. Refactoring strategy — small safe steps, in order

Each step is independently shippable and gets a `break-check` red before it is trusted (CLAUDE.md rule).

| # | Step | Files | Bucket |
|---|---|---|---|
| 1 | CI `timeout-minutes: 20`; shared `until(make, ok, max)` that throws; runbook line for orphaned workers (ARC-07) | ~3 + ladders using `until` | own |
| 2 | Remove unused: `zustand` dep, `speechRate.ts`, `handInput.ts`, `useLearnerChapters.ts`, the 5 starter SVGs, dead exports from §3 (not in `features/chapters`) | ~10 | own |
| 3 | Fix stale comments + rewrite `docs/architecture.md` to §5 (ARC-15) | ~6 | own |
| 4 | `src/server/supabase.ts`; move the 5 service helpers and 3 caller helpers onto it (ARC-06) | ~8 | own |
| 5 | Admin SQL over `lesson_progress`/`point_events` (new migration, Rafi applies) (ARC-01) | 1 migration + 2 pages | own |
| 6 | Layering gate v2 with parsed imports + allowlist + positive control (ARC-04) | 1 test | own |
| 7 | Generated `Database` types + typed client + CI staleness check (ARC-05) | ~4 + casts removed | own |
| 8 | `useDashboardData` hook: one `getLessonRows`, `done` from rows, no kv pull on adult screens, clear other learners' kv on sign-out (ARC-02, ARC-08 part 1) | ~5 | own (legal FYI) |
| 9 | Move `Standing`/`step`/`progressOf`/done rules to `core/learning.ts`; re-point `infra/storage`, `data` imports (Target 1) | ~12 | own |
| 10 | One `signed()`/`mulberry32` home; ladders import it (ARC-12, ARC-13) | ~15 | own (borderline; split by grade if >15) |
| 11 | Split `ParentHome`/`TeacherHome` components (ARC-08 part 2) | ~4 | own |
| 12 | `/menu` → `/modules`; Start/error pages → `/modules`; PWA banner decision (ARC-03) | ~6 | rafi |
| 13 | "Last played" from real activity; drop dead-table reads from the dashboard RPC and data-rights bundle (ARC-10) | migration + 3 | rafi |
| 14 | Legacy decision: delete cluster + Teddy/Stevie audio + two workflows, **or** adopt as live (ARC-09, ARC-11) | 80+ | rafi |
| 15 | Slim auto-loaded context: `@docs/security.md` → plain path, bookkeeping out of handoff, commit live handoff (ARC-14) | 2–3 | rafi |

Order rationale: 1–3 are free and reduce noise; 4–7 put mechanisms (one helper, honest metrics, a gate, types) in place
before the larger moves 8–11 so those moves are checked by them; 12–15 wait on the founder.

## Findings table

| ID | title | area | severity | evidence | effort | when | bucket | files |
|---|---|---|---|---|---|---|---|---|
| ARC-01 | /admin Learning/Funnel and all analytics events measure the deleted chapter system; live lessons emit nothing | architecture / metrics | Medium | Measured | M | fix now — the founder's only outcome view reads an empty table | own | `supabase/migrations/20260905150000_admin_role_and_metrics.sql:195,239`, `src/app/admin/learning/page.tsx`, `src/infra/analytics.ts` |
| ARC-02 | Adult dashboards replicate every child's progress into the adult device's kv, read "done" from that cache, never clear it (shared teacher computers) | architecture / child data | Medium | Suspected (never-cleared: Measured) | M | after beta — correctness + shared-device hygiene; legal to confirm doc 08 covers teachers | own | `src/app/parent/page.tsx:197-206,326,473,646`, `src/infra/storage/lessonSync.ts:89-110`, `src/data/repositories/profile.ts:38-53` |
| ARC-03 | Two child homes: /menu (Start button, error pages) skips class mode, temp-password redirect, child Sign out; PWA banner unreachable | architecture / routing | Medium | Suspected | S | fix now — free-class rule bypassed via /menu | rafi | `src/app/menu/page.tsx:235,390`, `src/app/modules/page.tsx:40-80`, `src/app/parent/page.tsx:291-293`, `src/app/error.tsx:36`, `src/app/not-found.tsx:35` |
| ARC-04 | Layering gate checks only core/ (0.7 % of code), no positive control, blind to relative/dynamic/side-effect/double-quoted imports; 15 upward imports + 14 Supabase-bypass files unchecked | layering | Medium | Reproduced | M | after beta | own | `src/__tests__/layering.test.ts:51,66`, `review-scratch/arc/layering-probe.test.ts` |
| ARC-05 | Supabase client untyped; "auto-generated" types hold only deleted tables, regen path wrong | schema/code drift | Medium | Measured | M | after beta | own | `src/data/supabase/client.ts:5-18`, `src/data/supabase/types.ts:1-6` |
| ARC-06 | Service-role REST helpers ×5 and caller-identity ×3; they already differ on network failure (all fail closed); billing authenticates through the consent feature | duplication / coupling | Medium | Reproduced | M | after beta | own | `src/features/consent/server.ts:69-102`, `src/app/api/child-login/route.ts:36-55`, `src/app/api/stripe/webhook/route.ts:37-49`, `src/app/api/billing/cancel/route.ts:40-43`, `src/app/api/checkout/route.ts:49-61`, `src/infra/errorSink.ts:69-75` |
| ARC-07 | A sync loop pins a vitest worker forever and orphans it when the run is killed (the "int hang" mechanism); CI has no job timeout | test infra | Medium | Reproduced | S | fix now | own | `vitest.config.ts:18`, `.github/workflows/ci.yml`, `review-scratch/arc/hang/` |
| ARC-08 | Parent+teacher dashboards in one 1,021-line component (38 useState, 26 role branches), 4–5 requests per child | maintainability | Medium | Measured | M | after beta | own | `src/app/parent/page.tsx` |
| ARC-09 | Hidden legacy system: 21k+ lines, shell routes, ~160 MB Teddy/Stevie audio, two CI workflows that only skip, no CI e2e/lint for live lessons | dead code / cost | Medium | Measured | L | decide before KG–2 work continues | rafi | `src/core/chapters.ts:86`, `src/features/chapters/**`, `src/infra/storage/voicePref.ts:25,35,42-44`, `.github/workflows/nightly-e2e.yml`, `weekly-layout.yml`, `public/audio/{IvUJ…,XjGY…}` |
| ARC-10 | "Last played" reads learner_stats.last_played_at which nothing writes; dashboard still fetches 3 dead tables per child | dead reads / visible bug | Medium | Suspected | S | fix now (needs Rafi's SQL 1 first) | rafi | `src/app/parent/page.tsx:157-191,501,650`, `src/data/repositories/progress.ts:11-42`, `docs/review/sql/arc-legacy-reads.sql` |
| ARC-11 | Two "mastered" rules write the same lesson_progress.mastered (6 vs 8 vs 12 answers) | duplicate logic | Low | Reproduced | S | later — before chapters return | rafi | `src/core/progression.ts:99-101`, `src/features/lessons/adaptive.ts:68-75` |
| ARC-12 | 8+ copies of signed-number display disagree on −1234 and −0; the canonical `core/fmt.ts` is imported by nothing (0 hits in 423k generated problems) | duplicate logic | Low | Reproduced | S | later | own | `src/core/fmt.ts`, `src/features/lessons/script.ts:145`, `ladders/g7m2.ts:11`, `g8m1.ts:26`, `g8m2.ts:16`, `g8m3.ts:7`, `g8m4.ts:20`, `content/g7m2.ts:13` |
| ARC-13 | Fourth mulberry32 + duplicate pick/shuffle/fmt (agree today) | duplicate logic | Low | Reproduced | S | later | own | `src/core/rand.ts:28`, `src/features/lessons/adaptive.ts:22-42`, `src/features/lessons/script.ts:141` |
| ARC-14 | Auto-loaded context 133–161 KiB/session: CLAUDE.md 59.4, security.md 13.7 via an @-mention (stale), handoff 58.9 committed / 91.0 live (~24 KiB self-bookkeeping) | maintainability | Low | Measured | S | after beta | rafi | `CLAUDE.md:164,525`, `handoff.md`, `docs/security.md` |
| ARC-15 | Stale architecture doc, wrong "auto-generated" header, false "not synced" comment, 25 files naming deleted systems, ~141 KB teen docs | docs | Low | Measured | S | fix now (docs only) | own | `docs/architecture.md`, `src/infra/storage/lessonProgress.ts:4`, `src/data/supabase/types.ts:1-6`, `src/core/praise.ts`, `src/core/rand.ts:12`, `docs/teen-*.md` |
| ARC-16 | Unused: zustand dep, 30 unreferenced exports incl. 3 whole files, 5 starter SVGs, a test that keeps a dead function alive | dead code | Low | Measured | S | fix now | own | `package.json`, `src/infra/storage/speechRate.ts`, `handInput.ts`, `src/shared/hooks/useLearnerChapters.ts`, `src/core/praise.ts:33`, `public/*.svg` |
