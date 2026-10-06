# Handoff — Radlic

**Current state and open items only. Under 15 KB.** When an item is done, delete it: the pull request and
[docs/decisions.md](docs/decisions.md) are the record. Map of every doc: [docs/START-HERE.md](docs/START-HERE.md).
Legal and launch items live in [docs/legal/READINESS.md](docs/legal/READINESS.md), content items in
[docs/product/content-backlog.md](docs/product/content-backlog.md) — not repeated here. Security items that are not
fixed yet are tracked outside this public repo; ask the founder.

## Where things stand (29 September 2026)

- **Production** is on `132c38297` (#323); `smoke:live` passed on it (29 Sep). The repo `learn` is public again (see
  the Vercel item below). A private beta with families the founder knows has run since 25 September; it is free and
  billing is off.
- **Live:** Grades 3–8 (36 modules, 282 topics: 9-screen lessons voiced in Josh, adaptive practice, short sessions);
  KG, Grade 1 and Grade 2 (23 voiced story chapters); lesson audio from the `lesson-audio` bucket; email-plus consent
  on notice-v7 with the database gate; parent and teacher dashboards (teacher rosters paused); points buy
  BlockCraft game time on `/play` (#352, 1 Oct); six legal pages as beta versions; nightly
  backups green.
- **The game (BlockCraft) is live** (#352, merged 1 Oct; its three migrations applied and proved on production): the
  game opens full page from `/play` in creative (a pause-menu button switches to survival, which has no damage), saved to the child's account; stopping early charges the seconds
  played. Not yet played signed in by a real child on production. Branch `wip/game-in-play` is superseded, except its three test files `adaptiveEngine`, `adaptiveWiring`,
  `lessonFlowAllModules` (never ported). The founder's main checkout is back on `main`; its other uncommitted
  leftovers are in a local `git stash` there. Branch `classroom-parked` (on GitHub) holds the first classroom build — never ship it as is.
  Local branch `learner-grade` defines its own "notice-v7", which now clashes with the one that shipped.
- The pre-rewrite handoff and everything extracted from the old docs are saved outside the repo on the founder's
  machine, readable by the owner only.

## Open — Draft PRs waiting for the founder

Merged and live on 29 Sep: #318, #319, #315, #328, #326, #321, website#6, #323 (each migration's before- and proof-SQL
all PASS). #323 was rebuilt first: production's `get_parent_dashboard()` differed from the repo by one comment (no ⚠️),
so the repo's migration chain still builds a body one comment different from production's.
1. #322 — passwords at least 8 characters: merge only after Supabase Auth's minimum is 8.
2. #324 (admin two-step verification, runbook `admin-access.md`), then enrol two authenticators at `/admin/mfa`, then
   #325 as built (migration; its SQL is in the PR) — decided 29 Sep.
3. #396 — close / withdraw-all cancels the plan now and refunds the unused part (migration, DEFINER change): run
   the PR's Stripe test-mode steps and `cancel-refund-before.sql`, then merge; attorney reviews doc 01 §4–5 next round.

## Open — the founder decides

- The game: multiplayer later (needs a server decision; a children's app means no chat);
  try it on a real tablet; the end time is in the game's URL, so a child who edits it plays past it (points already
  paid; a `ponytail:` note in `blockcraft/src/main.js`).
- `learner-grade`: rework on top of notice-v7, or drop.
- Whether both repos stay public now that Vercel is on Pro (the original reason has gone), and where backups are kept.
- A "not this month" list and one deciding metric (7-day activation); a paid pilot before new surfaces.
- Bring back the install banner on `/modules`.
- KG–2 chapters still move tiers by their own rule, not the ladder (#273) — keep or change.
- Whether a signed-out device keeps the practice keys doc 08 discloses.
- Teachers: due dates (so a teacher can assign), moving a student between classes, bulk password reset, class
  exercise due dates, teacher billing; confirm "the first attempt is the class-exercise result" (decided without the
  founder); a free teacher can sign up as a parent to get lessons free.
- A way to mute the lesson voice (classrooms).
- Lead capture is gone since `/api/lead` was deleted: rebuild it, and keep or drop the `diagnostic_leads` table.
- A maintenance switch: none exists, so stopping the app means removing the domain. A notice switch does
  (`OUTAGE_NOTICE`, [runbooks/outages.md](docs/runbooks/outages.md)); it tells people and stops nothing.
- Points: the 8-points-a-minute rate is a guess to measure (points never reset — settled 19 September).
- A scheduled `npm audit`; `migrate-prod`'s pre-apply diff and post-apply fingerprint checks (build or drop); the one
  clause of its `if` that cannot change the outcome; delete the finished `migrate-region.yml`.
- After the beta: Search Console, then one public page per grade.

## Open — the founder sets (dashboards and accounts)

- **Before the repo goes private again, fix Vercel.** Measured 28 Sep: while `learn` was private, Vercel refused both
  production deploys (#313, #314: "Deployment was blocked"); made public again, the next one (`dd36c1e27`) deployed.
  On Pro a private repo deploys only what a Vercel team member pushed, and `release` is pushed by GitHub Actions
  (`deploy.yml` promote). After switching back, watch the first production deploy reach READY.
- Admin two-step verification: set up an authenticator at `/admin/mfa` and check a fresh sign-in asks for the code
  ([runbooks/admin-access.md](docs/runbooks/admin-access.md)); only then the database requirement (its own Draft PR).
- Vercel, before `learn` goes private: whether the block checks the commit's author (the founder, who merges) or
  the pusher (GitHub Actions) was not measured; the blocked deployment's message names the GitHub user. The author →
  link the founder's GitHub login to their Vercel account; GitHub Actions → a Vercel deploy hook called by `promote`
  (the agent builds it).
- **If `learn` goes private, Actions minutes cost money**: measured 28 Sep, about 5,400 minutes in 30 days (CI on PR
  pushes ~2,300, Deploy ~2,700) against 2,000 included on the free org plan — roughly US$20 a month over. Without a
  payment method or budget, Actions stops when the 2,000 are used, and deploys stop with it. Set an Actions budget
  before switching, or ask the agent to cut the minutes (Deploy re-runs the whole CI on every merge).
- Turn off the old daily Claude health-check routine (claude.ai → routines, "Milo — daily production health check"): it
  still targets the pre-move URL and project, so each morning it reports it could not check. `daily-smoke.yml` replaces it.
- GitHub: the "allowed actions" setting. red-main opens an issue per red run and never closes it (five went stale
  before 6 Oct, all closed): close them on the next green run.
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
- RLS on production: `docs/legal/sql/rls-everywhere.sql` (expected answers are in the file).

## Open — agent work

- ADA sweep (28 Sep) not covered: axe on the signed-in dashboards, a screen reader driven by a person, an iPhone with
  zoom now allowed. The jsx-a11y lint still lists harmless shapes (`<img onError>`, backdrop taps with a close
  button) — not a gate.
- `e2e/xbrowser-clicks.spec.ts` is not ready for a timer: on a correct production build (5 Oct) 11 of 25
  passed — 10 end-card buttons fail Playwright's "stable" wait because the nudge animates them (a harness fault: a
  child taps them fine), 3 chapters "could not look" (the monkey cannot solve them), colors timed out.
- Delete the legacy code KG–2 does not use (the founder approves the list). `sessions` (read-only since #323) and the
  `diagnostic_*` tables stay (read by /admin's funnel and the export).
- The vitest hang (ARC-07): the 19 copies of the ladders' `until` are now one bounded `until` (adaptive.ts), but
  about 140 `for (;;)` re-roll loops in other ladders are still unbounded.
- Gates tied to file text, not values: the `coinShopPay` byte window, the `chapterDirections` grep, the
  `voiceBoundaryVerb` literal. The walk harness's refusal has never been watched
  firing. Lint: `npx eslint .` reports 204 errors (measured 6 Oct; 81 in app code, mostly the React Compiler's
  `react-hooks/*` rules in KG–2 chapters, 123 in tests and scripts), not three; CI does not lint.
- Architecture: widen the layering gate beyond `core/`; type the Supabase client from generated types; one
  service-role helper and one caller-identity helper instead of several; split the parent and teacher dashboards;
  one signed-number formatter (`core/fmt.ts` is imported by nothing).
- Bugs from the review, all low: the game-time day is counted in UTC for families without a settings row; the
  Performance tab dates by upload time, not answer time; `exercise_results` needs idempotency before rosters return.
- Activation: the 7-day view (#275) has never shown two different values; `/admin`'s funnel counts events lessons do
  not write.
- Performance: re-measure child-screen first paint and the lesson bundle sizes; the teacher dashboard makes one
  request per child (needs one RPC); the admin user list reads only the first page.
- SEO: signed-out visitors wait about 2.5 s before the redirect to the landing page (kept client-side by choice); a
  JSON-LD `@id`/publisher parity check across both sites; the stale comment in `src/app/site.ts`.
- Small: `/ui-preview` still shows a fox; the vertical number line's targets are 26 px (the app uses 44); the chalk
  "speck" in g5m1-t1/t2 is unexplained; Playwright defaults to port 3017; the backup action's `upload-artifact` is not
  scanned by Dependabot; `AccountConsent.tsx`'s header describes a path that does not exist.
- `deletion_log` and `email_suppressions` outlive a closed account but are not declared in `SURVIVORS`
  (`src/core/accountDeletion.ts`): check against `accountDeletion.test.ts` and the Terms. Declaring them is family-facing wording — the founder's.
- `email_suppressions` (20260923190000) revokes from public/anon/authenticated but not service_role, so on Supabase the
  server also holds DELETE/TRUNCATE by default privilege (measured on a local supabase/postgres container, 6 Oct; the
  baseline says SELECT/INSERT/UPDATE). Fix like `email_undeliverable`: revoke from service_role, then grant.
- Bounce suppression: a B3 refused as undeliverable shows the respond page's generic error (nothing is granted).
- Ops: the next restore drill by about 23 December (the first since the dump gained the storage schema);
  regenerate `supabase/schema/security_baseline.sql` (the founder runs `supabase/tests/security_posture.sql`); try
  `require-trusted-types-for` now that AR is gone; promote the schema baseline to migration zero (known debt).
- A test-coverage report for the founder's reviewer needs `@vitest/coverage-v8` — the founder decides.
- Never recorded, so check or drop: whether Vercel firewall rules exist; whether an
  Instant Rollback has ever been timed; the classroom AR demo
  (labs) track; the id-free event rollup decided on 5 September and never built.
