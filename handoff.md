# Handoff — Radlic

**Current state and open items only. Under 15 KB.** When an item is done, delete it: the pull request and
[docs/decisions.md](docs/decisions.md) are the record. Map of every doc: [docs/START-HERE.md](docs/START-HERE.md).
Legal and launch items live in [docs/legal/READINESS.md](docs/legal/READINESS.md), content items in
[docs/product/content-backlog.md](docs/product/content-backlog.md) — not repeated here. Security items that are not
fixed yet are tracked outside this public repo; ask the founder.

## Where things stand (2 October 2026)

- **Production** is on `19ef8a94c` (#329), deployed, `smoke:live` green. Since #349: the game (#352, migrations
  applied), #355, #356 (KG–2: a tap is the answer). The repo `learn` is public (see the Vercel item below).
- **Production accounts were wiped on 1 Oct** before the paid launch (only the founder's test accounts existed); the
  founder ran and checked it: `docs/legal/sql/launch-wipe-all-accounts.sql`,
  `launch-wipe-check.sql`. App data (chapters, catalogue, notices, `billing_config`, the lesson audio) was kept. The
  founder's own account went too: sign up again and re-add the `admin_users` row.
- **The paid launch is built, and switched off where it would lock or charge** (founder, 1 Oct, beta legal pages):
  `BILLING_LIVE = true` (#348): the plan page is the checkout and the Refund policy is published; Terms, Privacy and
  the subprocessor list carry the paid-plan text; no sales tax (#349). On production (migrations
  `20261001120000`–`160000`, proof SQL passed): the free trial (the parent picks two topics of one module, or two
  KG–2 stories, once; the child sees only those, nothing about a trial), seats that fill themselves and refill after a
  delete, "seats full" → **Add a seat** in the app (prorated, on the card on file; a bank's 3-D Secure approval on
  Stripe's page). **Still off on production:** `NEXT_PUBLIC_PAYWALL` is unset, `billing_config.enforced = false`,
  and `src/infra/stripe.ts` refuses a live key — nobody can be charged or locked yet.
- **Staging exists** (1 Oct): Supabase `radlic-staging`, the `staging` branch (a push runs migrations, the RLS suite
  and a fake-data seed) and its preview on the Stripe sandbox — [docs/runbooks/deploy.md](docs/runbooks/deploy.md),
  Staging. Its schema matches production's. Staging-first is proven by `20261001090000` (restored `ensure_rls`).
- **Stripe test mode is verified end to end on staging:** checkout, the acknowledgement email, a seat change, cancel,
  a failed renewal (past_due → 7-day grace → cancelled) and the annual renewal reminder (#342). Staging runs the paywall:
  Preview env (branch `staging` only) `NEXT_PUBLIC_PAYWALL=on` and `NEXT_PUBLIC_STRIPE_TEST_CHECKOUT=on`; staging's
  `billing_config.enforced = true`. The whole trial → purchase → seats → add a seat → delete/refill flow, and the 3-D
  Secure path (card 4000 0027 6000 3184), were driven in a browser on a local stack with the Stripe sandbox, 1 Oct.
- **Live:** Grades 3–8 (36 modules, 282 topics: 9-screen lessons voiced in Josh, adaptive practice, short sessions);
  KG, Grade 1 and Grade 2 (23 voiced story chapters, own scenes and animals since #329); lesson audio from the
  `lesson-audio` bucket; email-plus consent on notice-v7 with the database gate; parent and teacher dashboards
  (teacher rosters paused); points that buy BlockCraft time on `/play` (#352); seven legal pages as beta versions;
  nightly backups green.
- **Audio bucket** (2 Oct, #329): 899 new Josh clips (tag `audio-src-josh-2026-10-02`) uploaded and read back; P5
  read `17884 | 273065412`; S3 keys revoked.
- **"Adaptive Learn review"** (18 points): Ops Feature backlog FEA-043–054 shipped, FEA-055–060 open; its mascot
  voiceover left out (no mascot).
- **Not on `main`:** `classroom-parked` (first classroom build — never ship as is); local `learner-grade`
  (its own "notice-v7" clashes with the shipped one). The pre-rewrite handoff is saved outside the repo (owner only).

## Open — Draft PRs waiting for the founder

1. #322 (passwords at least 8) is merged: confirm Supabase Auth's minimum password length is 8, on production and
   on staging.
2. #324 (admin two-step verification, runbook `admin-access.md`), then enrol two authenticators at `/admin/mfa`, then
   #325 as built (migration; its SQL is in the PR) — decided 29 Sep.

## Open — the founder decides

- BlockCraft: multiplayer later (needs a server decision; no chat in a children's app); try it on a tablet;
  editing the game URL's end time plays past it (paid anyway).
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
- A maintenance switch: none exists, so stopping the app means removing the domain.
- Points: the 8-points-a-minute rate is a guess to measure (points never reset — settled 19 September).
- A scheduled `npm audit`; `migrate-prod`'s pre-apply diff and post-apply fingerprint checks (build or drop); the one
  clause of its `if` that cannot change the outcome; delete the finished `migrate-region.yml`.
- After the beta: Search Console, then one public page per grade.
- After purchase a child keeps the two trial topics until the parent turns on "Every topic" (or picks modules) in the
  Lessons tab: make that automatic, or keep it.

## Next session — Stripe live (in this order; each step is safe to stop after)

1. **Stripe, live mode (founder):** activate the account (Radlor Inc., EIN, representative, bank; statement descriptor
   `RADLIC`, support@radlor.com, radlic.com). Product `Radlic — family plan`; two **graduated** USD prices matching
   `LADDER` (monthly 7.99 + 4.99, yearly 75.99 + 48.00, up to 4), lookup keys `milo_family_monthly_v1` and
   `milo_family_annual_v2`. Webhook `https://radlic.com/api/stripe/webhook` with `checkout.session.completed`,
   `customer.subscription.created/updated/deleted`, `invoice.upcoming`. Settings: Adaptive Pricing **off** (it showed
   INR on the sandbox); customer emails for successful payments, refunds and failed payments **on**; Revenue recovery:
   retry within 7 days, then **mark unpaid** (Refund policy §7; today Stripe retries ~35 days then cancels); upcoming
   renewal events 30 days; Stripe Tax **threshold monitoring** on (no tax collected, #349).
2. **`src/infra/stripe.ts` must accept a live key on Production** — built in Draft PR #351 (`sk_live_` only on
   Vercel Production, `sk_test_` everywhere else; safe to merge before step 1). The founder reviews and merges it.
   It also carries the `smoke:live` fix (expects `public/sw.js`'s version, not `v242`).
3. **Vercel → Production env:** `STRIPE_SECRET_KEY` (live), `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`,
   `STRIPE_PRICE_ANNUAL`; never `NEXT_PUBLIC_STRIPE_TEST_CHECKOUT`. Redeploy. The agent can confirm the four exist
   without reading them.
4. **One real purchase** with the founder's card: 1 seat, add a seat, cancel, check the emails; refund in Stripe.
5. **Switch on:** `NEXT_PUBLIC_PAYWALL=on` (Production) and redeploy, then in the production SQL editor
   `update public.billing_config set enforced = true returning enforced;`. Rollback without a deploy:
   `… set enforced = false …` — every family sees everything again.

## Open — the founder sets (dashboards and accounts)

- Roll the **Stripe sandbox** secret key (it was printed in an agent's tool output on 1 Oct; test mode only), then put
  the new one in `.env.local` and Vercel Preview.
- Close superseded handoff PRs #343, #330; delete the merged branches `wip/game-in-play`,
  `game-on-play`, `games-not-coming-soon`, `no-ready-button`.

- **Before `learn` goes private again:** Vercel blocked production deploys while it was private (#313, #314, 28 Sep);
  on Pro it deploys only what a team member pushed, and `release` is pushed by GitHub Actions.
- Vercel: `CRON_SECRET` and `OPS_DIGEST_TO` — the daily ops digest is off until both exist.
- Supabase access tokens expire (the repo one did on 30 Sep, silently stopping backups): keep a reminder for both.
  Unmeasured whether the block checks the commit author or the pusher: link the founder's GitHub to Vercel, or a deploy
  hook from `promote` (agent builds it). Private also costs Actions minutes (~5,400/30 days measured 28 Sep vs 2,000
  free, ~US$20/month): set a budget first or have the agent cut minutes.
- Turn off the old claude.ai routine "Milo — daily production health check" (wrong URL; `daily-smoke.yml` replaces it).
- An uptime checker on `/api/health` and `/auth` that alerts a phone.
- GitHub: read and close or act on the red-main issues #78, #99, #100; the "allowed actions" setting.
- Supabase Auth: SMTP sender "Radlic"; late October, remove the old domain's redirect URLs (Auth and Google); check
  the Google consent screen says Radlic and who owns its Cloud project.
- A favicon and PWA icons from the Radlic logo (needs a square mark; the live favicon is still the framework default).
- Hard spend caps, not alerts: Vercel Spend Management "pause production deployment"; Supabase Spend Cap; Resend quota.
- Local leftovers that can go: the `w-blockcraft` worktree, the audio copies and runner rehearsal folder, the local
  `part-*` branches, the untracked `scripts/kaggle/` notebooks (clips are on the audio tags).

## Open — live checks on production (the founder)

Consent and sign-up checks are in READINESS. The step lists below are in git history; `git show <path>` prints them.
- Deep-review fixes (#235 #239 #242 #251 #262 #268 #269 #275 #246): steps in `fbf193280:docs/review/ROUND2.md` §3,
  then `docs/review/sql/fix-FND-15-proof.sql` and `fix-BUG-09-proof.sql`; then delete `docs/review/sql/`.
- Short sessions, 14 rows (re-check 4b on the same child) — `fbf193280:docs/legal/SHORT-SESSIONS-ROUND2.md` §3.
- Review 1, 14 rows, including the Apple Pencil on a real iPad — `fbf193280:docs/legal/REVIEW1-ROUND2.md` §4.
- Audio on an iPhone (Josh, replay, airplane fallback, clips from the bucket) — `fbf193280:docs/legal/AUDIO-ROUND2.md` §3.
- Play one KG–2 chapter signed in and read its `c:` row back; no Ready button (#356, tried locally).
- BlockCraft as a child: buy, build, stop early (points back), reopen the same world; also on a 2nd device.
- Use the new dashboard signed in: the Help walkthroughs, a class CSV upload → temporary password → first-login
  change, the parent PIN's "Forgot PIN" and its lock after 5 wrong tries.
- Crash forwarding: send a test error to `/api/report-error`, then read it back in `error_events`.
- RLS on production: `docs/legal/sql/rls-everywhere.sql` (expected answers are in the file).

## Open — agent work

- Spanish drafts `docs/legal/es/01`, `11`, `12`, `07` do not carry the paid-launch or no-sales-tax text (beta pages
  show English only, so nothing wrong is published; the drafts drift).
- Not seen in a browser after the fix: the seat and purchase dialogs now sit above the dashboard tour (z 95).
- Local only, not pushed: the app's `landing-whole-topic` branch (the landing demo snapshot exports whole topics) and
  radlor-site's `radlic-whole-lesson` (radlor.com/radlic plays a whole lesson); push and open Draft PRs, or drop.

- Staging preview: one request on `/parent` answers 503 (URL not captured; likely a Preview env var); lesson audio
  reads staging's storage, which has no `lesson-audio` bucket (set Preview's `NEXT_PUBLIC_AUDIO_BASE_URL`); Google
  sign-in is not set up there. The staging/production fingerprint does not compare pg_cron jobs or extensions.

- The KG–2 child pause screen (`ConsentPause`) has only been seen in jsdom; see it in a browser.
- ADA not yet covered: axe on signed-in dashboards, a person with a screen reader, iPhone zoom.
- An old consent link on the real old domain should land on radlic.com with its `#t=` token (browser pane).
- No CI job runs Playwright: `nightly-e2e` and `weekly-layout` skip on `LEGACY_CHAPTERS_HIDDEN` and name deleted
  specs. Point them at the KG–2 tabs.
- No operator path closes an account for a parent who cannot use the app (`delete_my_account` needs their own recent
  sign-in): write one and rehearse it locally before the first such request.
- The ops digest reports the previous day's backup.
- Delete the legacy code KG–2 does not use (the founder approves the list). `sessions` (read-only since #323) and the
  `diagnostic_*` tables stay (read by /admin's funnel and the export).
- `noChildDataInAudioUrl.test.ts` fails under load and passes alone (a timing assumption); the local vitest `int` hang.
- Gates tied to file text: `coinShopPay` byte window, `chapterDirections` grep, `voiceBoundaryVerb` literal;
  `break-verdict.mjs` passes a failing `beforeEach`; three lint errors and CI does not lint.
- `LessonPlayer` sets its voice in a `useEffect`; whether a lesson speaks from a child's mount effect before the
  voice is set is unmeasured.
- Architecture: widen the layering gate; generated Supabase types; one service-role and one caller helper; split the
  parent and teacher dashboards; `core/fmt.ts` is unused.
- Low bugs: game-time day in UTC without a settings row; Performance tab dates by upload time; `exercise_results`
  idempotency before rosters return; no timed retry of a failed lesson upload while online.
- Activation: the 7-day view (#275) has never shown two different values; `/admin`'s funnel counts events lessons do
  not write.
- Performance: re-measure first paint and lesson bundles; teacher dashboard one request per child; admin list page 1 only.
- SEO: ~2.5 s client redirect for signed-out visitors (by choice); JSON-LD parity across both sites; stale `site.ts` comment.
- Small: `/ui-preview` fox; number-line targets 26 px; g5m1 chalk "speck"; Playwright port 3017; stale comments in
  `AccountConsent.tsx` and `content/voice/styles.ts`; `scripts/lesson-questions.mjs` needs `npx tsx`.
- `deletion_log` and `email_suppressions` outlive a closed account but are not in `SURVIVORS` (check against the
  Terms); stale comments in `/api/health` and `admin/login/page.tsx`.
- Ops: restore drill by ~23 Dec; regenerate `security_baseline.sql` (founder runs `security_posture.sql`); try
  `require-trusted-types-for`; promote the schema baseline to migration zero.
- A test-coverage report for the founder's reviewer needs `@vitest/coverage-v8` — the founder decides.
- Never recorded, check or drop: Vercel firewall rules; a timed Instant Rollback; the AR labs track; the 5 Sep event rollup.
