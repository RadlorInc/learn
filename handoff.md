# Handoff — Radlic

**Current state and open items only. Under 15 KB.** When an item is done, delete it: the pull request and
[docs/decisions.md](docs/decisions.md) are the record. Map of every doc: [docs/START-HERE.md](docs/START-HERE.md).
Legal and launch items live in [docs/legal/READINESS.md](docs/legal/READINESS.md), content items in
[docs/product/content-backlog.md](docs/product/content-backlog.md) — not repeated here. Security items that are not
fixed yet are tracked outside this public repo; ask the founder.

## Where things stand (14 October 2026)

- **Production** is on `0236dc342` (#432, 14 Oct; its migration applied). The repo `learn` is public (see the Vercel
  item below). A private beta with families the founder knows has run since 25 September; it is free and billing is off.
- **Live:** Grades 3–8 (36 modules, 282 topics: 9-screen lessons voiced in Josh, adaptive practice, short sessions);
  KG, Grade 1 and Grade 2 (23 voiced story chapters); lesson audio from the `lesson-audio` bucket; email-plus consent
  on notice-v8 (v7 consents stay current) with the database gate; parent and teacher dashboards (teacher rosters paused); points buy game time
  on `/play`; six legal pages as beta versions; the support line
  1-888-812-9373 everywhere the support email is, and as a way to cancel (doc 01 §4; #429, #432). Nightly backups
  failed 8–13 Oct (expired Supabase access token) and are green again since 14 Oct — see *Tokens* below.
- **Stripe go-live** (sequence in `fbf193280:docs/billing-stage-2.md`; prices confirmed 14 Oct: $7.99/$4.99 monthly,
  $75.99/$48 annual). Done: backups, the fingerprint check, a watched sandbox purchase, and the code (#351: Production
  accepts only `sk_live_`, everywhere else only `sk_test_`). Founder, in order: Stripe Live mode → Public details
  (support phone, statement descriptor) → `read -rs STRIPE_SECRET_KEY && export STRIPE_SECRET_KEY && npx tsx
  scripts/stripe-products.mts --live --dry`, then without `--dry` → live webhook `https://radlic.com/api/stripe/webhook`
  → the four `STRIPE_*` values in Vercel **Production** only → redeploy → one real purchase, then refund it. Only after
  that: `NEXT_PUBLIC_PAYWALL=on` and `billing_config.enforced = true` ([billing.md](docs/runbooks/billing.md)).
- **Tokens** (14 Oct): both Supabase access tokens had expired (prod 7 Oct, staging 12 Oct), so backups, staging
  migrations and `migrate-prod` failed with "Invalid access token". New tokens are in the `prod-backup`,
  `production-db` and `staging` environments (staging's from the account that owns the staging project). The
  repo-level `SUPABASE_ACCESS_TOKEN` (30 Sep) is expired and every workflow now reads an environment's — delete it.
  Founder: a reminder a week before the new tokens expire.
- **Games on `/play`**: BlockCraft (account save), BeatHop, Peak Rider, Rescue Rush (device saves; `node <game>/check.mjs`).
  Game time comes from the database (`/api/game-time`). Not yet: a real child signed in on production, a tablet.
  Next: more Peak worlds. Branches: `wip/game-in-play` is superseded except three never-ported tests
  (`adaptiveEngine`, `adaptiveWiring`, `lessonFlowAllModules`); `classroom-parked` = the first classroom build (never
  ship as is); local `learner-grade` has its own "notice-v7" (clashes). The founder's main checkout has a local `git stash`.
- The pre-rewrite handoff and old-doc extracts are outside the repo on the founder's machine (owner-only).

## Open — Draft PRs waiting for the founder

The repo's migration chain builds a `get_parent_dashboard()` one comment different from production's (#323, no ⚠️).
1. #416 — numbers as words, 195 re-rendered clips: its manifest conflicts with main since #425. Merge main in, rebuild
   the manifest from main's clips (by SHA-256) plus its own, check only its keys change, then its upload.
2. #423 — Grade 6–7 dot plots drawn as dots, not ✕s (a tester's note); g7m5's text said ✕ over a board of dots. 13 new
   clips uploaded and verified 11 Oct (P5 18041 | 275178138 before #425). Merges clean with main and #426. Founder:
   look at g6m7-t3/t6 on its preview, then merge.
3. #426 and #421 — daily tester triage (12 and 10 Oct): g6m7 table row names, t5's late jump, Screen 9 sticker rows,
   g8m1-t3 practice; shape side labels. Not yet fixed from the same reviews: g6m7-t4 never says "range" before practice
   asks for it.
4. Enrol two authenticators at `/admin/mfa` (#324 is live), then #325 as built (migration; its SQL is in the PR).
   #322 is live too: check Supabase Auth's password minimum is 8.
5. #401 (agent fixes, 6–7 Oct) still Draft. Close #350 (5 Oct handoff, superseded by this one).
6. Attorney, next round: doc 01 §4 "By phone" (#432) and the support line (packet D4).

## Open — the founder decides

- Who answers the support phone (#429): the Privacy Policy now lists it.
- Games: multiplayer later (a server; no chat); try them on a real tablet.
- `learner-grade`: rework on top of notice-v7, or drop.
- BeatHop's (and Peak Rider's) saves are on the device only: an account save needs a `game` column on `game_saves`.
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
- Points: 8 a minute is a guess to measure; a coverage report (`@vitest/coverage-v8`) for the reviewer.
- A scheduled `npm audit`; `migrate-prod`'s pre-apply diff and post-apply fingerprint checks (build or drop); the one
  clause of its `if` that cannot change the outcome; delete the finished `migrate-region.yml`.
- After the beta: Search Console, then one public page per grade.

## Open — the founder sets (dashboards and accounts)

- **Before `learn` goes private again, fix Vercel**: private, it blocked production deploys (#313, #314; `release` is
  pushed by Actions). Link the founder's GitHub to Vercel, or a deploy hook called by `promote`; watch one reach READY.
- Admin two-step verification: set up an authenticator at `/admin/mfa` and check a fresh sign-in asks for the code
  ([runbooks/admin-access.md](docs/runbooks/admin-access.md)); only then the database requirement (its own Draft PR).
- Vercel: `CRON_SECRET` and `OPS_DIGEST_TO` — the daily ops digest is off until both exist.
- **If `learn` goes private, Actions minutes cost money** (~5,400/month vs 2,000 free): set a budget first, or cut minutes.
- Turn off the Claude routine "Milo — daily production health check" (claude.ai → routines): it fails daily on the
  pre-move URL; `daily-smoke.yml` replaces it.
- An uptime checker that alerts a phone, on `/api/health` (the app), `/api/health/db` (the database; 503 when
  unreachable) and `/auth` ([deploy.md](docs/runbooks/deploy.md) → uptime checker).
- Resend bounces: add `RESEND_WEBHOOK_SECRET` in Vercel, then a Resend webhook to `/api/email/resend-webhook` for
  `email.bounced` and `email.complained` ([support.md](docs/runbooks/support.md)). Until then the route answers 503.
- GitHub: the "allowed actions" setting. red-main opens an issue per red run and never closes it: close them on
  the next green run.
- Supabase Auth: the SMTP sender name "Radlic"; after 30 days with no traffic on the old domain (late October),
  remove its redirect URLs from Supabase Auth and Google sign-in; confirm the Google consent screen says Radlic and
  who owns its Cloud project.
- A favicon and PWA icons from the Radlic logo (needs a square mark; the live favicon is still the framework default).
- Wipe the test account used for sign-up tests (the address is in the private notes).
- Hard spend caps, not alerts: Vercel Spend Management with "pause production deployment" on; Supabase Spend Cap
  on; the Resend plan stops at its quota. Not measured (the Vercel connector does not show it).
- Local copies that can go: the stopped local Supabase stack, the local `part-*` branches. (14 Oct: the old audio
  copies went to the Trash, `~/.Trash/milo_react-cleanup-2026-10-14/`; merged worktrees removed.)
- `production-db` still holds the two S3 keys from #386's upload (9 Oct): revoke them in Supabase and delete both.

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

- The KG–2 child pause screen (`ConsentPause`) has only been seen in jsdom; see it in a browser.
- ADA sweep (28 Sep) not covered: axe on the signed-in dashboards, a person with a screen reader, iPhone zoom.
- An old consent link on the real old domain should land on radlic.com with its `#t=` token (browser pane).
- `nightly-e2e` (#378): read its first scheduled run. `e2e/xbrowser-clicks.spec.ts` is not timer-ready (5 Oct: 11 of
  25; the nudge animation fails Playwright's "stable" wait).
- `e2e/short-sessions.spec.ts` "signed out: the device keeps exactly what doc 08 says" fails on main: Chrome's harmless
  "ResizeObserver loop" warning is stored as `milo_recent_errors` (filter it in the crash recorder; task filed 12 Oct).
- Draft #401 (agent fixes): `smoke:live`'s hard-coded service-worker version, and the ops digest reporting the
  previous day's backup (scheduled backups start hours late).
- Delete the legacy code KG–2 does not use (the founder approves the list). `sessions` (read-only since #323) and the
  `diagnostic_*` tables stay (read by /admin's funnel and the export).
- `noChildDataInAudioUrl.test.ts` (twice, 28 Sep) and `eqRows.test.ts` (14 Oct) fail with assertion errors, not
  timeouts, under a full run's load and pass alone. A timing assumption, not yet found.
- The local vitest `int` hang: fix the loop itself — a per-test timeout cannot stop a synchronous loop.
- Gates tied to file text: `coinShopPay`, `chapterDirections`, `voiceBoundaryVerb`. `break-verdict.mjs` passes a
  `beforeEach` whose `expect` fails. Three lint errors (`Diagrams`, `LessonPlayer`, `ModulePractice`); CI does not lint.
- `LessonPlayer` sets its voice in a `useEffect`: can a child's mount effect speak before it is set? Unmeasured.
- Architecture: widen the layering gate; generated Supabase types; one service-role and one caller-identity helper;
  split the parent and teacher dashboards; `core/fmt.ts` is imported by nothing.
- Bugs from the review, all low: the game-time day is counted in UTC for families without a settings row; the
  Performance tab dates by upload time, not answer time; `exercise_results` needs idempotency before rosters return.
- Activation: the 7-day view (#275) has never shown two different values; `/admin`'s funnel counts events lessons do
  not write.
- Performance: re-measure first paint and bundles; the teacher dashboard's one request per child; the admin user list
  reads only page one. SEO: the 2.5 s signed-out redirect; a JSON-LD parity check across both sites.
- Small: `/ui-preview` shows a fox; the vertical number line's targets are 26 px (app: 44); the chalk "speck" in
  g5m1-t1/t2; Playwright defaults to port 3017; Dependabot misses the backup action's `upload-artifact`; stale
  comments in `AccountConsent.tsx` and `content/voice/styles.ts`; `scripts/lesson-questions.mjs` needs `npx tsx`.
- 28 Josh clips do not say their line, the tester's g3m5-t7 Screen 1 among them:
  it is the clip, not the player. Local branch `voice-word-check` (worktree `../milo-voice-word-check`, not pushed)
  adds `scripts/audio/voice-check.py`, which lists them. 14 of the 28 are already re-rendered by #416 (their new
  renders not yet word-checked); the other 14 need a listen and a `redo` render after #416 merges.
- `deletion_log` and `email_suppressions` outlive a closed account but are not declared in `SURVIVORS`
  (`src/core/accountDeletion.ts`): check against `accountDeletion.test.ts` and the Terms. Stale comment: `/api/health`
  mentions tools we do not use.
- Doc 08 omits the games' device keys (`<game>.save.<id>`, `blockcraft.keysHidden`); sign-out does not sweep them
  (`gameSave.ts`). Sweep once an account save exists, then the doc 08 rows (founder: the text).
- `email_suppressions` (20260923190000) does not revoke from service_role, so it holds DELETE/TRUNCATE by default
  (measured locally, 6 Oct). Fix like `email_undeliverable`: revoke from service_role, then grant.
- Bounce suppression: a B3 refused as undeliverable shows the respond page's generic error (nothing is granted).
- Ops: the next restore drill by about 23 December (the first since the dump gained the storage schema);
  regenerate `supabase/schema/security_baseline.sql` (the founder runs `supabase/tests/security_posture.sql`); try
  `require-trusted-types-for` now that AR is gone; promote the schema baseline to migration zero (known debt).
- Never recorded, so check or drop: Vercel firewall rules; a timed Instant Rollback; the labs AR demo; the id-free
  event rollup (5 Sep).
