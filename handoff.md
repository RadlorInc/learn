# Handoff — Radlic

**Current state and open items only. Under 15 KB.** When an item is done, delete it: the pull request and
[docs/decisions.md](docs/decisions.md) are the record. Map of every doc: [docs/START-HERE.md](docs/START-HERE.md).
Legal and launch items live in [docs/legal/READINESS.md](docs/legal/READINESS.md), content items in
[docs/product/content-backlog.md](docs/product/content-backlog.md) — not repeated here. Security items that are not
fixed yet are tracked outside this public repo; ask the founder.

## Where things stand (16 October 2026)

- **Production** is on `61035edc1` (#446 after #445, 16 Oct; #445's migration applied, `smoke:live` passes). The repo `learn` is public again (see the Vercel item below). Radlic is
  launched (paid since 1 October, `BILLING_LIVE`); the beta is over (founder, 21 Oct).
- **Live:** Grades 3–8 (36 modules, 282 topics: 9-screen lessons voiced in Josh, adaptive practice); KG, Grade 1
  and Grade 2 (23 voiced story chapters); audio from the `lesson-audio` bucket; email-plus consent on notice-v8 with
  the database gate; parent dashboard (teacher sign-up hidden); points buy game time on `/play` (four games,
  #424); six legal pages as beta versions; nightly backups green.
- Branches: `wip/game-in-play` is superseded except three never-ported tests (`adaptiveEngine`, `adaptiveWiring`,
  `lessonFlowAllModules`); `classroom-parked` = the first classroom build (never ship); local `learner-grade` has
  its own "notice-v7" (clashes).
- The pre-rewrite handoff and old-doc extracts are outside the repo on the founder's machine (owner-only).

## Paid testers' notes (the loop, 15 Oct)

Testers review every screen through `/test` (links and reviews live in Radlor Ops, the separate ops app; its own
`review.radlic_tester_reviews` table, not this database). The founder keeps a Corrections Tracker outside the repo.
Every "Something is wrong" note up to 15 Oct evening is fixed or decided (#421–#444; the last voice batch #444, tag
`audio-src-josh-2026-10-16`, P5 18646 | 289376154). Word times are keyed by clip key, so drop a re-rendered key's old
timings before `whisper-word-times.py`, or it keeps them. How a batch goes:
- **Split by kind.** Code-only fixes (pictures, hints, answer boxes) ship on their own. Anything that changes a spoken
  line, or a line misread, waits for ONE voice batch built on top of the last voice branch (conflicts are only ever in
  the generated corpus, manifest and voice-index files; merge them key by key, then rebuild the corpus).
- **Render:** `python3 scripts/kaggle-josh-notebook.py redo <branch> <keys.txt>`; it always clones the branch fresh and
  prints the commit (a reused clone rendered old text, 15 Oct). Check every clip with `scripts/audio/check-numbers.py`
  AND read the transcripts: it reads line and audio the same way, so "one hundred and one thousand" (heard as
  101,000) passed it. Words the model gets wrong are fixed with a `say` row, never by retrying: a lone "A" → "Ay",
  "x" after a digit → "ex", a pair → "3 comma 5", lists of sizes repeat (put the last size last).
- **Ship:** clip folder matched to the branch's manifest by SHA-256, `build-manifest.mjs`, word times, an orphan tag of
  only the new mp3s, P5 pre-registered in `audio-bucket-proof.sql`, then `upload-audio.yml` from `main` with
  `manifest_ref=<branch>` (#447), dry run → upload (the founder approves `production-db`, revokes the keys), P5, merge.

## Open — Draft PRs waiting for the founder

- **Ask maths** (21–22 Oct, `ask-maths`, local only, no PR): built, **OFF**; next steps and local try-out in
  [product/ask-maths.md](docs/product/ask-maths.md). Migration 20261021120000 is a SECURITY change.

The repo's migration chain builds a `get_parent_dashboard()` one comment different from production's (#323, no ⚠️).
Admin data requires the authenticator code since #325 (16 Oct).

## Open — the founder decides

- Games: multiplayer later (a server; no chat); try them on a real tablet.
- `learner-grade`: rework on top of notice-v7, or drop.
- BeatHop's (and Peak Rider's) saves are on the device only: an account save needs a `game` column on `game_saves`.
- Whether both repos stay public now that Vercel is on Pro (the original reason has gone), and where backups are kept.
- A "not this month" list and one deciding metric (7-day activation); a paid pilot before new surfaces.
- Bring back the install banner on `/modules`.
- KG–2 chapters still move tiers by their own rule, not the ladder (#273) — keep or change.
- Whether a signed-out device keeps the practice keys doc 08 discloses.
- Teachers (sign-up hidden since 16 Oct, `TEACHER_SIGNUP_OPEN`; reopen with a school consent route): due dates, moving a student between classes, bulk password reset, class
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

- **Before the repo goes private again, fix Vercel.** 28 Sep: while `learn` was private, Vercel blocked both production
  deploys (#313, #314); public again, the next deployed. On Pro a private repo deploys only what a Vercel team member
  pushed, and `release` is pushed by GitHub Actions. Unmeasured: whether the block checks the commit's author (→ link
  the founder's GitHub to Vercel) or the pusher (→ a Vercel deploy hook called by `promote`; the agent builds it).
  After switching, watch the first production deploy reach READY.
- **If `learn` goes private, Actions minutes cost money**: ~5,400 min in 30 days (28 Sep) vs 2,000 free — about US$20
  a month over; with no budget Actions (and deploys) stop at 2,000. Set a budget first, or have the agent cut minutes
  (Deploy re-runs the whole CI on every merge).
- Turn off the old daily Claude health-check routine (claude.ai → routines, "Milo — daily production health check"): it
  still targets the pre-move URL and project, so each morning it reports it could not check. `daily-smoke.yml` replaces it.
- red-main opens an issue per red run and never closes it: close them on the next green run.
- Supabase Auth: the SMTP sender name "Radlic"; after 30 days with no traffic on the old domain (late October),
  remove its redirect URLs from Supabase Auth and Google sign-in; confirm the Google consent screen says Radlic and
  who owns its Cloud project.
- A favicon and PWA icons from the Radlic logo (needs a square mark; the live favicon is still the framework default).
- Wipe the test account used for sign-up tests (the address is in the private notes).
- The Resend plan: the free plan's daily cap (about 50 sign-ups a day) blocks a launch. Vercel's budget (pause on) and
  Supabase's spend cap are on (founder, 16 Oct).
- Local copies outside the repo that can go when the founder chooses: the audio copies (the bucket was proven
  27 Sep), the audio runner rehearsal folder, the stopped local Supabase stack, the local `part-*` branches.

## Open — live checks on production (the founder)

Consent and sign-up checks are in READINESS. The step lists below are in git history; `git show <path>` prints them.
- Batch C (#439) in the real player: Screen 9 speaks its line then the sticker; g6m1-t2 L5 Hint; a stressed word bold.
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

- Testers: ask what g5m2-t1 Screen 2 "Confusion" meant; close the KG–2 "Chapter testing" notes in Ops (3 open, 9 to
  re-check by playing); triage notes newer than 15 Oct the same way (see the loop above).
- The KG–2 child pause screen (`ConsentPause`) has only been seen in jsdom; see it in a browser.
- ADA sweep (28 Sep) not covered: axe on the signed-in dashboards, a screen reader driven by a person, an iPhone with
  zoom now allowed. The jsx-a11y lint still lists harmless shapes (`<img onError>`, backdrop taps with a close
  button) — not a gate.
- An old consent link on the real old domain should land on radlic.com with its `#t=` token (browser pane).
- `nightly-e2e` (#378: 23 KG–2 chapters + each grade 3–8 module's first topic) has had no scheduled run yet — read the
  first, and its issue if red. `e2e/xbrowser-clicks.spec.ts` is not timer-ready (5 Oct: 11 of 25 passed; end-card
  buttons fail Playwright's "stable" wait because the nudge animates them, 3 chapters "could not look", colors timed out).
- `scripts/smoke-live.mjs` hard-codes the service-worker version (expects v242, live is v252); the ops digest
  (06:23 UTC) reports the previous day's backup, because scheduled backups start hours late.
- Delete the legacy code KG–2 does not use (the founder approves the list). `sessions` (read-only since #323) and the
  `diagnostic_*` tables stay (read by /admin's funnel and the export).
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
  Performance tab dates by upload time, not answer time; `exercise_results` needs idempotency before rosters return.
- Activation: the 7-day view (#275) has never shown two different values; `/admin`'s funnel counts events lessons do
  not write.
- Performance (audit 16 Oct; #445 fixed the ledger, one request per answer, /modules): measure #445's request counts
  in a signed-in browser (code-derived: /modules 8→5, an answer 2→1); the teacher dashboard and `child-login` GET make
  calls per child (one RPC); `admin_learning`/`admin_overview` scan `learner_events` unindexed; the daily cron has no
  LIMIT; the signup cooldown lists auth users by filter.
- SEO: signed-out visitors wait about 2.5 s before the redirect to the landing page (kept client-side by choice); a
  JSON-LD `@id`/publisher parity check across both sites; the stale comment in `src/app/site.ts`.
- Small: `/ui-preview` shows a fox; the vertical number line's targets are 26 px (app: 44); the chalk "speck" in
  g5m1-t1/t2; Playwright defaults to port 3017; Dependabot misses the backup action's `upload-artifact`; stale
  comments in `AccountConsent.tsx` and `content/voice/styles.ts`; `scripts/lesson-questions.mjs` needs `npx tsx`.
- `deletion_log` and `email_suppressions` outlive a closed account but are not declared in `SURVIVORS`
  (`src/core/accountDeletion.ts`): check against `accountDeletion.test.ts` and the Terms. Stale comment: `/api/health`
  mentions tools we do not use.
- Doc 08 omits `blockcraft.save.<id>` / `beathop.save.<id>` (now also `peak.save.<id>`, `rush.save.<id>`, `blockcraft.keysHidden`); sign-out does not sweep them (`gameSave.ts`). Sweep only
  once an account save exists, then the doc 08 rows (founder: the text).
- `email_suppressions` (20260923190000) revokes from public/anon/authenticated but not service_role, so on Supabase the
  server also holds DELETE/TRUNCATE by default privilege (measured on a local supabase/postgres container, 6 Oct; the
  baseline says SELECT/INSERT/UPDATE). Fix like `email_undeliverable`: revoke from service_role, then grant.
- Bounce suppression: a B3 refused as undeliverable shows the respond page's generic error (nothing is granted).
- Backups are age-encrypted to the founder's offline key since #446 (16 Oct; first dump verified with it). The old
  `BACKUP_PASSPHRASE` is off GitHub; dumps before 16 Oct open only with the founder's copy until they expire (16 Nov).
- Ops: the next restore drill by about 23 December (the first since the dump gained the storage schema);
  regenerate `supabase/schema/security_baseline.sql` (the founder runs `supabase/tests/security_posture.sql`); try
  `require-trusted-types-for` now that AR is gone; promote the schema baseline to migration zero (known debt).
- A test-coverage report for the founder's reviewer needs `@vitest/coverage-v8` — the founder decides.
- Vercel firewall (16 Oct, dashboard): per-IP rate limits on signup/consent, consent respond, child login, PIN reset and
  report-error — not in the repo; re-check after any route rename. Never recorded, so check or drop: a timed Instant Rollback; the classroom AR demo (labs)
  track; the id-free event rollup decided on 5 September and never built.
