# Handoff — Radlic

**Current state and open items only. Under 15 KB.** When an item is done, delete it: the pull request and
[docs/decisions.md](docs/decisions.md) are the record. Map of every doc: [docs/START-HERE.md](docs/START-HERE.md).
Legal and launch items live in [docs/legal/READINESS.md](docs/legal/READINESS.md), content items in
[docs/product/content-backlog.md](docs/product/content-backlog.md) — not repeated here. Security items that are not
fixed yet are tracked outside this public repo; ask the founder.

## Where things stand (17 October 2026)

- **Production code** is on `b0d5a411e` (#452, 17 Oct). ⚠️ **Two deploys are stopped on `production-db` approval:**
  #452's migration `20261017120000` (real pause) is NOT applied and #458 is queued behind it, so a game's Pause does
  not stop the paid clock yet — the call fails and the clock runs on, as before. Nothing else reaches production
  until these are approved.
- The repo `learn` is public again (see the Vercel item). The private beta with families the founder knows has run
  since 25 September; it is free and billing is off.
- **Live:** Grades 3–8 (36 modules, 282 topics: 9-screen lessons voiced in Josh, adaptive practice); KG–2 (23 voiced
  story chapters); audio from the `lesson-audio` bucket; email-plus consent on notice-v8 with the database gate;
  parent dashboard (teacher sign-up hidden); points buy game time on `/play` (four games, #424); six legal pages as
  beta versions; nightly backups green.
- Branches: `wip/game-in-play` is superseded except three never-ported tests (`adaptiveEngine`, `adaptiveWiring`,
  `lessonFlowAllModules`); `classroom-parked` = the first classroom build (never ship); local `learner-grade` has its
  own "notice-v7" (clashes). The pre-rewrite handoff and old-doc extracts are on the founder's machine (owner-only).

## Paid testers' notes (the loop, 15 Oct)

Testers review every screen through `/test` (links and reviews live in Radlor Ops, the separate ops app, in its own
`review.radlic_tester_reviews` table). The founder keeps a Corrections Tracker outside the repo. Every "Something is
wrong" note up to 15 Oct evening is fixed or decided (#421–#444; last voice batch #444, tag
`audio-src-josh-2026-10-16`, P5 18646 | 289376154). Word times are keyed by clip key: drop a re-rendered key's old
timings before `whisper-word-times.py`, or it keeps them. How a batch goes:
- **Split by kind:** code-only fixes ship alone; anything that changes or re-reads a spoken line waits for ONE voice
  batch on the last voice branch (conflicts are only in the generated corpus, manifest and voice-index — merge key by
  key, rebuild the corpus). **Render:** `python3 scripts/kaggle-josh-notebook.py redo <branch> <keys.txt>` (clones
  fresh, prints the commit — a reused clone rendered old text, 15 Oct). Check every clip with `check-numbers.py` AND
  read the transcripts: it reads line and audio the same way, so "one hundred and one thousand" passed it. A misread
  word gets a `say` row, never a retry ("A" → "Ay", "x" after a digit → "ex", "3 comma 5"). **Ship:**
  [audio-upload.md](docs/runbooks/audio-upload.md) — since #447 the run is from `main` with `manifest_ref=<branch>`.

## Open — Draft PRs waiting for the founder

Three from 17 Oct, no migrations, none seen in a browser (each PR says what to look at after its deploy):
- **#450** capacity runbook: the 16 Oct measurements, the staging load test (1,000 children at once, 0 errors) and
  `scripts/load-staging.mjs` to re-run it. Docs and a script; it answers "when do we buy more".
- **#459** four of the founder's 17 Oct list: no tour in the add-a-child window, the child's name marked as needed,
  "your child" vs "your children", and Checkout returning to `/parent` — the "payment received" note moved with it,
  because that note is what stops a parent paying twice.
- **#460** three more: an idle dashboard asks for the PIN again after 15 min (`IDLE_LOCK_MS`, no sign-out), opening a
  grade ticks its modules once, and an empty trial picker suggests two topics.


## Open — the founder decides

- Games: multiplayer later (a server; no chat); try them on a real tablet. BeatHop's and Peak Rider's saves are on
  the device only: an account save needs a `game` column on `game_saves`.
- `learner-grade`: rework on top of notice-v7, or drop.
- Whether both repos stay public now that Vercel is on Pro (the original reason has gone), and where backups are kept.
- A "not this month" list and one deciding metric (7-day activation); a paid pilot before new surfaces. Bring back
  the install banner on `/modules`. KG–2 chapters still move tiers by their own rule, not the ladder (#273) — keep
  or change. Whether a signed-out device keeps the practice keys doc 08 discloses.
- Teachers (sign-up hidden since 16 Oct, `TEACHER_SIGNUP_OPEN`; reopen with a school consent route): due dates,
  moving a student between classes, bulk password reset, teacher billing; confirm "the first attempt is the
  class-exercise result" (decided without the founder); a free teacher can sign up as a parent for free.
- A way to mute the lesson voice (classrooms).
- Lead capture is gone since `/api/lead` was deleted: rebuild it, or drop the `diagnostic_leads` table.
- A maintenance switch: none exists, so stopping the app means removing the domain. A notice switch does
  (`OUTAGE_NOTICE`, [outages.md](docs/runbooks/outages.md)); it tells people and stops nothing.
- Points: the 8-a-minute rate is a guess to measure (points never reset — settled 19 September).
- A scheduled `npm audit`; `migrate-prod`'s pre-apply diff and post-apply fingerprint checks (build or drop), and
  the one clause of its `if` that cannot change the outcome; delete the spent `migrate-region.yml`.
- After the beta: Search Console, then one public page per grade.

## Open — the founder sets (dashboards and accounts)

- **Approve `production-db` on the two stopped deploys** (see the top): #452's migration, then #458.
- **Before the repo goes private again, fix Vercel.** 28 Sep: while `learn` was private, Vercel blocked both
  production deploys (#313, #314); public again, the next deployed. On Pro a private repo deploys only what a team
  member pushed, and `release` is pushed by Actions. Unmeasured: whether the block reads the commit's author (→ link
  the founder's GitHub to Vercel) or the pusher (→ a deploy hook called by `promote`; the agent builds it).
- **If `learn` goes private, Actions minutes cost money**: ~5,400 min/30 days (28 Sep) vs 2,000 free, about US$20 a
  month over; with no budget, Actions and deploys stop at 2,000. Set a budget first, or have the agent cut minutes
  (Deploy re-runs the whole CI on every merge).
- Turn off the old daily Claude health-check routine (claude.ai → routines, "Milo — daily production health check"):
  it targets the pre-move URL, so each morning it reports it could not check. `daily-smoke.yml` replaces it.
- red-main opens an issue per red run and never closes one: close them on the next green run.
- Supabase Auth: the SMTP sender name "Radlic"; after 30 days with no traffic on the old domain (late October),
  drop its redirect URLs from Supabase Auth and Google sign-in; confirm the Google consent screen says Radlic.
- A favicon and PWA icons from the Radlic logo (needs a square mark; the live one is still the framework default).
- Wipe the test accounts used for sign-up and Stripe tests (addresses in the private notes).
- The Resend plan: the free plan's daily cap (about 50 sign-ups a day) blocks a launch. Vercel's budget (pause on) and
  Supabase's spend cap are on (founder, 16 Oct).
- Local copies that can go when the founder chooses: the audio copies (bucket proven 27 Sep), the audio runner
  rehearsal folder, the stopped local Supabase stack, the local `part-*` branches.
- **Stripe is live-ready and unproven.** Product, prices and the webhook (5 events, 0 % errors) are set, and the
  live key and webhook secret answered a probe (16 Oct) — but no real payment has been taken, so nothing proves
  Stripe and the app share a secret. Before the paywall: one real purchase on `/parent/plan`, then refund it AND
  cancel the subscription (a refund does not cancel). The paywall itself is `NEXT_PUBLIC_PAYWALL=on` in Vercel
  Production (needs a redeploy, it is baked in at build) plus `billing_config.enforced = true`; rollback is the SQL.

## Open — live checks on production (the founder)

Consent and sign-up checks are in READINESS. The step lists below are in git history; `git show <path>` prints them.
- Batch C (#439) in the real player: Screen 9 speaks then the sticker; g6m1-t2 L5 Hint; a stressed word bold.
- The Round-2 lists, none run since 28 Sep, each a step list `git show` prints: deep-review fixes #235–#275
  (`fbf193280:docs/review/ROUND2.md` §3, then `fbf193280:docs/review/sql/fix-FND-15-proof.sql` and its BUG-09 twin;
  delete `docs/review/sql/` once both have run), short sessions
  (`fbf193280:docs/legal/SHORT-SESSIONS-ROUND2.md` §3), Review 1 with the Apple Pencil on a real iPad
  (`fbf193280:docs/legal/REVIEW1-ROUND2.md` §4), and iPhone audio — Josh speaks, a replay starts without a pause,
  airplane mode falls back to the device voice (`fbf193280:docs/legal/AUDIO-ROUND2.md` §3).
- Play one KG–2 chapter signed in and read its `c:` row back; the Help walkthroughs; the parent PIN's "Forgot PIN"
  and its lock after 5 wrong tries.
- RLS on production: `docs/legal/sql/rls-everywhere.sql` (expected answers are in the file).

## Open — agent work

- **The founder's 17 Oct list: three left, all in the lesson player** (seven shipped in #459/#460). Founder's call:
  auto-advance on EVERY screen, not only 1→2. (8) when a screen's voice ends, go to the next screen by itself;
  (9) Screen 1's closing question (`LessonPlayer.tsx:507`) stays above the chalkboard on the screens that follow,
  instead of being only the button that opened them; (10) a video-style controller on every screen (play/pause/
  replay the chalk) so the child drives it. Touches `Chalkboard.tsx`, `chalk.ts`, `LessonPlayer.tsx`.
- Testers: ask what g5m2-t1 Screen 2 "Confusion" meant; close the KG–2 "Chapter testing" notes in Ops (3 open, 9 to
  re-check by playing); triage anything newer than 15 Oct the same way.
- Seen in jsdom only, never a browser: the KG–2 pause screen (`ConsentPause`), and #459/#460's screens.
- ADA sweep (28 Sep) not covered: axe on the signed-in dashboards, a screen reader driven by a person, an iPhone
  with zoom now allowed. The jsx-a11y lint lists harmless shapes (`<img onError>`, backdrop taps) — not a gate.
- An old consent link on the old domain should land on radlic.com with its `#t=` token (browser pane). `nightly-e2e`
  (#378) has had no scheduled run yet — read the first, and its issue if red. `xbrowser-clicks.spec.ts`
  is not timer-ready (5 Oct: 11 of 25; end-card buttons fail Playwright's "stable" wait, the nudge animates them).
- `scripts/smoke-live.mjs` hard-codes the service-worker version (expects v242, live is v252); the 06:23 UTC ops
  digest reports the previous day's backup, because scheduled runs start hours late.
- Delete the legacy code KG–2 does not use (the founder approves the list); `sessions` (read-only since #323) and
  `diagnostic_*` stay (read by /admin's funnel and the export).
- Load-only flakes, each passing alone: `noChildDataInAudioUrl.test.ts` (28 Sep) and `eqRows.test.ts` (17 Oct). The
  local vitest `int` hang: fix the loop — a per-test timeout cannot stop a synchronous one.
- Gates tied to file text, not values: the `coinShopPay` byte window, the `chapterDirections` grep, the
  `voiceBoundaryVerb` literal. `break-verdict.mjs` passes a `beforeEach` whose own `expect` fails, and counts only an
  AssertionError — a break that makes a test CRASH (a render loop, 17 Oct) reads as "not red". The walk harness's
  refusal has never been watched firing. Three lint errors; CI does not lint.
- `LessonPlayer` sets its voice in a `useEffect`; whether a lesson speaks from a child's mount effect before the
  voice is set is unmeasured.
- Architecture: widen the layering gate beyond `core/`; type the Supabase client from generated types; one
  service-role and one caller-identity helper instead of several; split the parent and teacher dashboards; one
  signed-number formatter (`core/fmt.ts` is imported by nothing).
- Review bugs, all low: the game-time day is counted in UTC for families without a settings row; the Performance tab
  dates by upload time, not answer time; `exercise_results` needs idempotency before rosters return. Activation: the
  7-day view (#275) has never shown two values; `/admin`'s funnel counts events lessons never write.
- Performance left after the 16 Oct audit (the capacity runbook arrives with #450): the teacher dashboard
  and `child-login` GET make calls per child (one RPC); `admin_learning`/`admin_overview` scan `learner_events`
  unindexed; the daily cron has no LIMIT; the signup cooldown lists auth users by filter. #445 is proven on
  production (17 Oct: an answer lands, the wallet moves); /modules' 8→5 is still only code-derived.
- SEO: signed-out visitors wait about 2.5 s before the redirect to the landing page (client-side by choice); a
  JSON-LD `@id`/publisher parity check across both sites; the stale comment in `src/app/site.ts`.
- Small: `/ui-preview` shows a fox; the vertical number line's targets are 26 px (app: 44); the chalk "speck" in
  g5m1-t1/t2; stale comments in `AccountConsent.tsx` and `content/voice/styles.ts`.
- `deletion_log` and `email_suppressions` outlive a closed account but are not in `SURVIVORS`
  (`src/core/accountDeletion.ts`): check against `accountDeletion.test.ts` and the Terms. Stale comment in
  `/api/health` (names tools we do not use).
- Doc 08 omits the four games' `*.save.<id>` keys and `blockcraft.keysHidden`, and sign-out does not sweep them
  (`gameSave.ts`). Sweep once an account save exists, then the doc 08 rows (founder: the text).
- `email_suppressions` (20260923190000) revokes from public/anon/authenticated but not service_role, so the server
  also holds DELETE/TRUNCATE by default privilege (local container, 6 Oct).
  Fix like `email_undeliverable`: revoke from service_role, then grant. Bounce suppression: a B3 refused as
  undeliverable shows the respond page's generic error (nothing is granted).
- Backups are age-encrypted to the founder's offline key since #446 (first dump verified). `BACKUP_PASSPHRASE` is
  off GitHub; dumps before 16 Oct open only with the founder's copy, until they expire 16 Nov — then delete it.
- Ops: next restore drill by about 23 December (the first since the dump gained the storage schema); regenerate
  `supabase/schema/security_baseline.sql` (the founder runs `supabase/tests/security_posture.sql`); try
  `require-trusted-types-for` now that AR is gone; promote the schema baseline to migration zero (known debt).
- Vercel firewall (16 Oct, dashboard, not in the repo): per-IP rate limits on signup/consent, consent respond, child
  login, PIN reset and report-error — re-check after any route rename. Never recorded, so check or drop: a timed
  Instant Rollback; the classroom AR demo; the id-free event rollup decided 5 Sep and never built.
