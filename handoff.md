# Handoff — Radlic

**Current state and open items only. Under 15 KB.** When an item is done, delete it: the pull request and
[docs/decisions.md](docs/decisions.md) are the record. Map of every doc: [docs/START-HERE.md](docs/START-HERE.md).
Legal and launch items live in [docs/legal/READINESS.md](docs/legal/READINESS.md), content items in
[docs/product/content-backlog.md](docs/product/content-backlog.md) — not repeated here. Security items that are not
fixed yet are tracked outside this public repo; ask the founder.

## Where things stand (28 September 2026)

- **Production** is on `c5d5561b5` (#320), measured 28 Sep evening; `smoke:live` passed on it. A private beta with
  families the founder knows has run since 25 September; it is free and billing is off.
- **Live:** Grades 3–8 (36 modules, 282 topics: 9-screen lessons voiced in Josh, adaptive practice, short sessions);
  KG, Grade 1 and Grade 2 (23 voiced story chapters); lesson audio from the `lesson-audio` bucket; email-plus consent
  on notice-v7 with the database gate; parent and teacher dashboards (teacher rosters paused); points (game time
  spends nothing until a game is attached); six legal pages as beta versions; nightly backups green.
- **The game is on GitHub, not on `main`:** branch `wip/game-in-play` (a snapshot based on 18 September, not rebased
  or re-tested on `main`) holds `blockcraft/` (a violence-free block-building game framed on `/play`), migration
  `20260919100000_game_saves.sql` (not applied) and the test files `adaptiveEngine`, `adaptiveWiring`,
  `lessonFlowAllModules`. The founder's main checkout is back on `main`; its other uncommitted leftovers are in a local
  `git stash` there. Branch `classroom-parked` (on GitHub) holds the first classroom build — never ship it as is.
  Local branch `learner-grade` defines its own "notice-v7", which now clashes with the one that shipped.
- The pre-rewrite handoff and everything extracted from the old docs are saved outside the repo on the founder's
  machine, readable by the owner only.

## Open — Draft PRs waiting for the founder, in this order

All CI-green; every one merges cleanly on `main` and on top of the ones before it (measured 28 Sep, full suite on the
combined tree). A migration PR runs its before-SQL first and its proof-SQL after (`docs/runbooks/migrations.md`).
1. #318 — the pending-migration check reads a tag `migrate-prod` leaves. After merging, create the tag once (the
   command is in the PR).
2. #319 — the backup job runs in the `prod-backup` environment (safe before or after the environment exists).
3. #315 — learner deletion (migration `20260928160000`; `learner-delete-before/proof.sql`).
4. #323 — the legacy progress tables dropped (migration `20260928170000`; `legacy-progress-drop-before/proof.sql`).
5. #326 — points: 300 a day, real lessons only (migration `20260928180000`; `points-cap-before/proof.sql`). From then
   on, a new lesson needs its `lesson_catalog` row (`docs/product/building-lessons.md`).
6. #321 — sign-out clears a child's keys from the device (published doc 08 changes with it).
7. #322 — passwords at least 8 characters: merge only after Supabase Auth's minimum is 8.
8. #324, then enrol the admin account at `/admin/mfa`, then #325 (migration; its SQL is in the PR).
9. website#6 — radlor.com response headers; afterwards `npm run check:headers` there should exit 0.

## Open — the founder decides

- `wip/game-in-play`: rebase onto `main` and ship it, or drop it; blockcraft multiplayer later (needs a server
  decision; a children's app means no chat); try it on a real tablet.
- `learner-grade`: rework on top of notice-v7, or drop.
- Whether both repos stay public now that Vercel is on Pro (the original reason has gone), and where backups are kept.
- A "not this month" list and one deciding metric (7-day activation); a paid pilot before new surfaces.
- Hide the child page's Game time tab while `/play` says "coming soon"; bring back the install banner on `/modules`.
- KG–2 chapters still move tiers by their own rule, not the ladder (#273) — keep or change.
- Whether a signed-out device keeps the practice keys doc 08 discloses.
- Teachers: due dates (so a teacher can assign), moving a student between classes, bulk password reset, class
  exercise due dates, teacher billing; confirm "the first attempt is the class-exercise result" (decided without the
  founder); a free teacher can sign up as a parent to get lessons free.
- A way to mute the lesson voice (classrooms).
- Lead capture is gone since `/api/lead` was deleted: rebuild it, and keep or drop the `diagnostic_leads` table.
- A maintenance switch: none exists, so stopping the app means removing the domain.
- Points: the 8-points-a-minute rate is a guess to measure (points never reset — settled 19 September).
- A scheduled `npm audit`; `migrate-prod`'s pre-apply diff and post-apply fingerprint checks (build or drop); the one
  clause of its `if` that cannot change the outcome; delete the finished `migrate-region.yml`.
- After the beta: Search Console, then one public page per grade.

## Open — the founder sets (dashboards and accounts)

- **Before the repo goes private again, fix Vercel.** Measured 28 Sep: while `learn` was private, Vercel refused both
  production deploys (#313, #314: "Deployment was blocked"); made public again, the next one (`dd36c1e27`) deployed.
  On Pro a private repo deploys only what a Vercel team member pushed, and `release` is pushed by GitHub Actions
  (`deploy.yml` promote). After switching back, watch the first production deploy reach READY.
- Admin two-step verification in the database (`20260928200000`): approve `production-db`, then run
  `docs/legal/sql/admin-mfa-proof.sql` and sign in to `/admin` with the code
  ([runbooks/admin-access.md](docs/runbooks/admin-access.md)).
- Vercel: `CRON_SECRET` and `OPS_DIGEST_TO` — the daily ops digest is off until both exist.
- Turn off the old daily Claude health-check routine (claude.ai → routines, "Milo — daily production health check"): it
  still targets the pre-move URL and project, so each morning it reports it could not check. `daily-smoke.yml` replaces it.
- An uptime checker on `/api/health` and `/auth` that alerts a phone (`/api/health` does not touch the database).
- GitHub: read and close or act on the red-main issues #78, #99, #100; the "allowed actions" setting.
- Supabase Auth: the SMTP sender name "Radlic"; after 30 days with no traffic on the old domain (late October),
  remove its redirect URLs from Supabase Auth and Google sign-in; confirm the Google consent screen says Radlic and
  who owns its Cloud project.
- A favicon and PWA icons from the Radlic logo (needs a square mark; the live favicon is still the framework default).
- Wipe the test account used for sign-up tests (the address is in the private notes).
- Hard spend caps, not alerts (the "surprise bill" reel, 28 Sep): Vercel Spend Management with "pause production
  deployment" on; Supabase Cost Control → Spend Cap on; the Resend plan stops at its quota. Not measured — the
  Vercel connector does not show it.
- Local copies outside the repo that can go when the founder chooses: the audio copies (the bucket was proven
  27 Sep), the audio runner rehearsal folder, the stopped local Supabase stack, the local `part-*` branches.

## Open — live checks on production (the founder)

Consent and sign-up checks are in READINESS. The step lists below are in git history; `git show <path>` prints them.
- Deep-review fixes #235, #239, #242, #251, #262, #268, #269, #275, #246 — steps in
  `fbf193280:docs/review/ROUND2.md` §3. Then read the first deletion-log rows and the prune check with
  `docs/review/sql/fix-FND-15-proof.sql` and `docs/review/sql/fix-BUG-09-proof.sql`. Once both have run, delete
  `docs/review/sql/` (founder, 28 Sep).
- Short sessions, 14 rows (re-check 4b on the same child) — `fbf193280:docs/legal/SHORT-SESSIONS-ROUND2.md` §3.
- Review 1, 14 rows, including the Apple Pencil on a real iPad — `fbf193280:docs/legal/REVIEW1-ROUND2.md` §4.
- Audio on an iPhone: Josh speaks, a replay starts without a pause, airplane mode falls back to the device voice; in
  DevTools every clip comes from the bucket with no CSP error — `fbf193280:docs/legal/AUDIO-ROUND2.md` §3.
- Play one KG–2 chapter signed in and read its `c:` row back.
- Use the new dashboard signed in: the Help walkthroughs, a class CSV upload → temporary password → first-login
  change, the parent PIN's "Forgot PIN" and its lock after 5 wrong tries.
- Crash forwarding: send a test error to `/api/report-error`, then read it back in `error_events`.
- RLS on production: `docs/legal/sql/rls-everywhere.sql` (expected answers are in the file).

## Open — agent work

- The KG–2 child pause screen (`ConsentPause`) has only been seen in jsdom; see it in a browser.
- ADA sweep (28 Sep) not covered: axe on the signed-in dashboards, a screen reader driven by a person, an iPhone with
  zoom now allowed. The jsx-a11y lint still lists harmless shapes (`<img onError>`, backdrop taps with a close
  button) — not a gate.
- An old consent link on the real old domain should land on radlic.com with its `#t=` token (browser pane).
- `migrate-prod`'s signed-in image pull (#311) has not run yet — watch the next migration.
- No CI job runs Playwright or checks page layout: `nightly-e2e` and `weekly-layout` skip while
  `LEGACY_CHAPTERS_HIDDEN` is true, yet the same 23 chapters are live as KG–2, and the specs they name
  (`e2e/start-card.spec.ts`, `e2e/short-landscape.spec.ts`) no longer exist. Point the sweeps at the KG–2 tabs.
- No operator path closes an account for a parent who cannot use the app (`delete_my_account` needs their own recent
  sign-in): write one and rehearse it locally before the first such request.
- `scripts/smoke-live.mjs` hard-codes the expected service-worker version; the ops digest (06:23 UTC) reports the
  previous day's backup, because scheduled backups start hours late.
- Delete the legacy code KG–2 does not use (the founder approves the list). The legacy progress tables go in #323;
  `sessions` and the `diagnostic_*` tables stay (read by /admin's funnel and the export).
- `noChildDataInAudioUrl.test.ts` fails with assertion errors (not timeouts) when the machine is loaded and passes
  alone — twice on 28 Sep. A timing assumption in the test, not yet found.
- The local vitest `int` hang: fix the loop itself — a per-test timeout cannot stop a synchronous loop.
- Gates tied to file text, not values: the `coinShopPay` byte window, the `chapterDirections` grep, the
  `voiceBoundaryVerb` literal. `break-verdict.mjs` passes a `beforeEach` whose own `expect` fails. The walk harness's
  refusal has never been watched firing. Three lint errors (`Diagrams.tsx`, `LessonPlayer.tsx`,
  `ModulePractice.tsx`); CI does not lint.
- `LessonPlayer` sets its voice in a `useEffect`; whether a lesson speaks from a child's mount effect before the
  voice is set is unmeasured.
- Architecture: widen the layering gate beyond `core/`; type the Supabase client from generated types; one
  service-role helper and one caller-identity helper instead of several; split the parent and teacher dashboards;
  one signed-number formatter (`core/fmt.ts` is imported by nothing).
- Bugs from the review, all low: the game-time day is counted in UTC for families without a settings row; the
  Performance tab dates by upload time, not answer time; `exercise_results` needs idempotency before rosters return;
  nothing retries a failed lesson upload on a timer while online.
- Activation: the 7-day view (#275) has never shown two different values; `/admin`'s funnel counts events lessons do
  not write.
- Performance: re-measure child-screen first paint and the lesson bundle sizes; the teacher dashboard makes one
  request per child (needs one RPC); the admin user list reads only the first page.
- SEO: signed-out visitors wait about 2.5 s before the redirect to the landing page (kept client-side by choice); a
  JSON-LD `@id`/publisher parity check across both sites; the stale comment in `src/app/site.ts`.
- Small: `/ui-preview` still shows a fox; the vertical number line's targets are 26 px (the app uses 44); the chalk
  "speck" in g5m1-t1/t2 is unexplained; Playwright defaults to port 3017; the backup action's `upload-artifact` is not
  scanned by Dependabot; `AccountConsent.tsx`'s header describes a path that does not exist; the comments in
  `content/voice/styles.ts` name a test that does not exist; `scripts/lesson-questions.mjs` now needs `npx tsx`.
- `deletion_log` and `email_suppressions` outlive a closed account but are not declared in `SURVIVORS`
  (`src/core/accountDeletion.ts`): check against `accountDeletion.test.ts` and the Terms. Stale comment: `/api/health`
  mentions tools we do not use.
- Points, measured 28 Sep (PGlite, the real functions): a first upload at level 1 pays the +3 level-up as well as the
  answer's 2, because a new row starts at level 0. Chapters start at tier 1, so their first answer always does. Keep
  or change — a product call.
- Ops: the next restore drill by about 23 December (the first since the dump gained the storage schema);
  regenerate `supabase/schema/security_baseline.sql` (the founder runs `supabase/tests/security_posture.sql`); try
  `require-trusted-types-for` now that AR is gone; promote the schema baseline to migration zero (known debt).
- A test-coverage report for the founder's reviewer needs `@vitest/coverage-v8` — the founder decides.
- Never recorded, so check or drop: whether Vercel firewall rules exist; whether an
  Instant Rollback has ever been timed; the classroom AR demo
  (labs) track; the id-free event rollup decided on 5 September and never built.
