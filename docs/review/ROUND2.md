# Deep review — Round 2: what to merge, in what order, and what to check

**26 September 2026.** Phase 2 of the deep review ([SUMMARY](SUMMARY.md)). Every PR below is a **Draft**; nothing is
merged, nothing is applied to production. Each one has a test that failed on `main` and passes with the fix, and a
planted break (`scripts/break-check.sh`) that turned it red on its own assertion — the PR body says which.

**Trial merge:** all fix PRs together on `main` (`06cee602`) → `tsc` clean, **168 test files / 3,992 tests, vitest
exit 0**, production build OK (the only new route is `/help/opengraph-image`, from #257). Six trial merges were run;
what they caught is in §6.

**Deploy freeze:** none is recorded in the repo (searched `LOOP-STATE`, `READINESS`, `CLAUDE.md`). If there is one,
nothing below should be merged during it — every merge to `main` deploys the app at once (Vercel), and a migration
waits for your `production-db` approval.

## 1. Critical items

**No Critical security finding.** The one Critical is legal and yours: **FND-01** — every sign-up says "By continuing
you agree to our Terms" while `/legal/terms` is live as "DRAFT — NOT IN FORCE". No PR (N1). Also told in chat:
**SEC-01** (sign-up pre-account-takeover, High, reproduced) — its complete fix changes a screen, so N2.

## 2. Merge order

Rules behind the order: (a) the deploy pipeline fixes go first so every later migration is retried if it fails and is
backed up before it applies; (b) **migrations must merge in timestamp order** — `supabase db push` refuses a local
migration older than one production already has; (c) a stacked PR merges right after its base (GitHub then retargets
it to `main`); (d) apply each migration (approve `migrate-prod`) and run its proof SQL **before** merging the next
migration PR.

| # | PR | finding | migration | notes |
|---|---|---|---|---|
| 0 | [#267](https://github.com/RadlorInc/learn/pull/267) | **FND-01** Terms published as beta (US$100 floor; §14 plain contact) | — | independent of everything else; merge first. Live: `/legal/terms` shows no DRAFT box |
| 1 | [#234](https://github.com/RadlorInc/learn/pull/234) | the review docs | — | docs only; later PRs' SQL paths live beside these |
| 2 | [#236](https://github.com/RadlorInc/learn/pull/236) | OPS-02 migrate-prod retried | — | the first push after it may ask you for one no-op approval |
| 3 | [#245](https://github.com/RadlorInc/learn/pull/245) | ARC-07/OPS-18 CI job timeouts | — | stacked on #236 |
| 4 | [#247](https://github.com/RadlorInc/learn/pull/247) | OPS-03/OPS-08 backup before every migration | — | ⚠️ adds one encrypted dump artifact per migration to the public repo (your N3). If `BACKUP_PASSPHRASE` is unreadable in the `production-db` job, migrate-prod stops **before** applying anything |
| 5 | [#263](https://github.com/RadlorInc/learn/pull/263) | OPS-13/OPS-17 actions pinned by SHA; backup asserts the prod ref | — | stacked on #247. **No CI has run on it** (CI runs only on PRs into `main`); it gets CI when #247 merges and it retargets |
| 6 | [#240](https://github.com/RadlorInc/learn/pull/240) | **SEC-02** viewer access revocable | **`20260926100000`** | new DEFINER `is_learner_creator` (authenticated only). Before: `docs/review/sql/fix-SEC-02-before.sql` · proof: `fix-SEC-02-proof.sql` |
| 7 | [#241](https://github.com/RadlorInc/learn/pull/241) | **BUG-09** prune keeps granted consent | **`20260926100100`** | prune body +1 line. If before-SQL `at_risk_now > 0`, apply before 03:37 UTC. `fix-BUG-09-before/proof.sql` |
| 8 | [#243](https://github.com/RadlorInc/learn/pull/243) | **BUG-02** stale device can't roll progress back | **`20260926100200`** | drops + recreates `record_lesson_progress` (9th arg); new column `lesson_progress.answered_at` (a timestamp on a child's progress — see N33). Either deploy order works. `fix-BUG-02-before/proof.sql` |
| 9 | [#246](https://github.com/RadlorInc/learn/pull/246) | **OPS-04/07, FND-11** daily digest + B3 cancel retry | **`20260926100300`** | new DEFINER `ops_digest` (service_role only). Then set **`CRON_SECRET`** and **`OPS_DIGEST_TO`** in Vercel (digest is off until both exist). `fix-OPS-04-before/proof.sql` |
| 10 | [#258](https://github.com/RadlorInc/learn/pull/258) | SEC-17 error bodies carry only their code | — | stacked on #246 |
| 11 | [#260](https://github.com/RadlorInc/learn/pull/260) | **FND-15** deletion audit trail | **`20260926100600`** | redefines 8 DEFINER functions; **stacked on #241 and keeps BUG-09's guard** (a closing assertion refuses to apply without it). Before-SQL has an md5 stop-check per function body: if production's differs, don't apply. `fix-FND-15-before/proof.sql` |
| 12 | [#261](https://github.com/RadlorInc/learn/pull/261) | SEC-16 entitlement RPCs guarded | **`20260926100700`** | `fix-SEC-16-before/proof.sql` |
| 13 | [#235](https://github.com/RadlorInc/learn/pull/235) | **BUG-03** failed grant leaves no orphan B3 / lockout | — | |
| 14 | [#239](https://github.com/RadlorInc/learn/pull/239) | **BUG-01/04** upload queue keeps other accounts' items, no stall | — | |
| 15 | [#255](https://github.com/RadlorInc/learn/pull/255) | PERF-03 dashboard reads progress once | — | stacked on #239 |
| 16 | [#266](https://github.com/RadlorInc/learn/pull/266) | BUG-10 honest error classes | — | stacked on #239 |
| 17 | [#238](https://github.com/RadlorInc/learn/pull/238) | **BUG-07** failed role read ≠ no role | — | |
| 18 | [#242](https://github.com/RadlorInc/learn/pull/242) | SEC-06 crash URLs carry no tokens | — | run `fix-SEC-06-before.sql`; a cleanup UPDATE is in the PR body, only if > 0 |
| 19 | [#251](https://github.com/RadlorInc/learn/pull/251) | SEC-04 one sign-up email per address per 2 min | — | |
| 20 | [#256](https://github.com/RadlorInc/learn/pull/256) | SEC-07 roster rollback uses `delete_learner` | — | expand step; dropping the policy is your 3.9 |
| 21 | [#262](https://github.com/RadlorInc/learn/pull/262) | SEC-11 CSP: our Supabase origin only; camera off | — | check sign-in right after deploy (§3) |
| 22 | [#249](https://github.com/RadlorInc/learn/pull/249) | MAP-02 Stripe events keep no customer details | — | run `fix-MAP-02-before.sql` (expect 0) |
| 23 | [#244](https://github.com/RadlorInc/learn/pull/244) | BUG-05 voice manifest retried | — | |
| 24 | [#253](https://github.com/RadlorInc/learn/pull/253) | MAP-07/BUG-06 analytics flush | — | |
| 25 | [#259](https://github.com/RadlorInc/learn/pull/259) | BUG-08 hung-IndexedDB writes merged back | — | |
| 26 | [#250](https://github.com/RadlorInc/learn/pull/250) | ARC-16/PERF-11 dead code, zustand, keep-alive leak | — | |
| 27 | [#257](https://github.com/RadlorInc/learn/pull/257) | SEO-04/05 `/demo` noindex; `/help` previews as itself | — | |
| 28 | [#248](https://github.com/RadlorInc/learn/pull/248) | OPS-10 etc. runbooks + stale docs | — | docs + comments |
| 29 | [#264](https://github.com/RadlorInc/learn/pull/264) | PERF-05 `/auth` logo 105 → 26 KB | — | |
| 30 | [#254](https://github.com/RadlorInc/learn/pull/254) | OPS-19 SW precache; **sw v237** | — | #233 (KG–2) sets v236; either order works (any change updates devices) |
| 31 | [#237](https://github.com/RadlorInc/learn/pull/237) | MAP-04 a child's name never goes to a network voice | — | ⚠️ **needs your OK first**: on a device with only network voices (likely Linux Chrome) browser-spoken lines go silent; recorded clips still play |
| 32 | [#252](https://github.com/RadlorInc/learn/pull/252) | **PERF-01** lesson 11.6 → 7.3 s, topic list 9.0 → 5.0 s | — | ⚠️ **needs your OK first**: a module never opened online no longer opens offline (ties to N26) |
| — | [website#3](https://github.com/RadlorInc/website/pull/3) | SEO-02 radlor.com/radlic share image | — | radlor-site has no CI; `npm run check:og` after build |
| — | [#265](https://github.com/RadlorInc/learn/pull/265) | the checker: break-check.sh no longer calls "setup threw" a pass | — | tooling only |


### 2b. Round 3 — the NEEDS-RAFI decisions (26 September 2026)

Rafi decided the NEEDS-RAFI items on 26 Sep (recorded in [NEEDS-RAFI.md](NEEDS-RAFI.md)). **Deploy freeze until Monday
28 Sep except #267.** Every PR below is a Draft. Insert them into the table above at the marked point; the rules above
still hold (migrations strictly in timestamp order, each applied and proved before the next migration PR merges).

| # | PR | decision | migration | merge after | notes |
|---|---|---|---|---|---|
| 0a | [#272](https://github.com/RadlorInc/learn/pull/272) | N10, N25, N28, N32, N33 legal docs | — | **#267** (stacked) | docs + one gate; READINESS now says the beta is running; run `sql/readiness-family-count.sql` |
| 0b | [#276](https://github.com/RadlorInc/learn/pull/276) | N20 CLAUDE.md trimmed | — | anything | the checks section moves verbatim to `docs/checks.md` |
| 12a | [#268](https://github.com/RadlorInc/learn/pull/268) | **N2 (SEC-01, High) + N5** | **`20260926100800`** | #261 **and** #235 **and** #251 | stacked on #260, contains #251. Before: `fix-N5-before.sql` (md5 stop-check); proof: `fix-N5-proof.sql`. ⚠️ needs #235's per-attempt B3 key |
| 12b | [#269](https://github.com/RadlorInc/learn/pull/269) | N11 keep the consent record | **`20260926100900`** | #268 (stacked) | ⚠️ **SECURITY DEFINER trigger on auth.users**; changes the published Terms/Privacy sentences (EN+ES) — decide on §16 notice first. `fix-N11-before/proof.sql` |
| 12c | [#275](https://github.com/RadlorInc/learn/pull/275) | N8 activation view | **`20260926101000`** | #269's migration applied | ⚠️ new SECURITY DEFINER `admin_activation` (admin_assert first). `fix-N8-before/proof.sql` (B4 role check: stop on unknown roles) |
| 15a | [#273](https://github.com/RadlorInc/learn/pull/273) | N18 last played, N19 one mastered rule | — | #255 (stacked) | open question: should chapter tiers follow the ladder too? |
| 16a | [#270](https://github.com/RadlorInc/learn/pull/270) | N9 error wording | — | #266 (stacked) | |
| 16b | [#271](https://github.com/RadlorInc/learn/pull/271) | N16 clear progress on sign-out | — | #239 (stacked; retarget after) | keeps copies of any child with unsent work; doc 08 row 20 reworded (EN+ES) |
| 27a | [#278](https://github.com/RadlorInc/learn/pull/278) | N21 "grades 3 to 8", no game-time/roster claims | — | #257 (stacked) | |
| 27b | [#274](https://github.com/RadlorInc/learn/pull/274) | N17 `/modules` everywhere, `/menu` + `/demo` gone (308s) | — | #257 (stacked); supersedes #257's `/demo` noindex | conflicts: drop its `sw.js` APP_PAGES hunk (#277 deletes the list); vs #233 keep the deletions and `/modules` |
| 30a | [#277](https://github.com/RadlorInc/learn/pull/277) | N26 no offline page list; **sw v238** | — | #254 (stacked) | vs #274: #274 deletes `PWAInstallBanner.tsx` that #277 rewords — keep the deletion. Doc 08's three "work offline" lines are yours to reword |
| — | [website#4](https://github.com/RadlorInc/website/pull/4) | N21 + N23 `/waitlist` → 308 `/radlic` | — | website#3 (independent) | after merge: `npm run check:site-claims` must exit 0 (it exits 1 on today's live site, by design) |

**Migration order, all PRs together:** `100000` #240 → `100100` #241 → `100200` #243 → `100300` #246 → `100600` #260 →
`100700` #261 → `100800` #268 → `100900` #269 → `101000` #275.

**Open questions these PRs raise (yours):** §16 notice for #269's Terms change and how long to keep a consent record
(ATTORNEY-PACKET A2) · chapter tiers vs the ladder (#273) · doc 08's offline wording (#277) · hide the Game time tab
while `/play` says "coming soon" (#278) · radlor.com `/privacy` still describes the waitlist (website#4) · the install
banner is gone with `/menu` — bring it back on `/modules`? (#274).

## 3. Live checks after merging (expected result for each)

| after | check | expected |
|---|---|---|
| #236 | next Deploy run's `migrations-changed` log | names the migrations pending since the last successful migrate-prod, or "no migration file changed since …" |
| #247 | next migrate-prod run | a step "Back up production before migrating" succeeds before `supabase db push`; artifact `milo-db-backup-premigrate-<run>` listed |
| #245 | any CI run | each job shows its `timeout-minutes`; nothing else changes |
| #240 | as a parent with a viewer: remove the viewer (dashboard "Remove" / viewer's "Remove myself") | succeeds; the viewer's dashboard no longer shows the child; re-opening the old invite link is refused |
| #241 | `fix-BUG-09-proof.sql` | the prune body contains the granted-consent guard; the cron job still points at it |
| #243 | play one topic on two devices, the older one offline, then bring it online | the account keeps the newer level/mastered; `point_events` has no duplicate `level_up` |
| #246 | the next 06:23 UTC cron (with both env vars set) | one email to `OPS_DIGEST_TO` with numbers and job names only; no child name, no email address |
| #260 | delete a test child from the dashboard, then `fix-FND-15-proof.sql` | one `deletion_log` row, path `delete_child`, with row counts; the child's rows gone as before |
| #261 | a child opens a chapter/lesson | loads as before (the guard refuses only strangers) |
| #235 | grant consent normally | exactly one B3 scheduled in Resend, +24 h |
| #239 | sign in as parent A on a device, queue an answer offline, sign out, sign in as parent B, go online | A's answer is still queued (not uploaded under B, not deleted); uploads when A signs back in |
| #238 | normal sign-in as parent and as teacher | lands where it did before; no role picker for an existing account |
| #242 | `select url from error_events order by at desc limit 5` (you, SQL editor) | no `#`, no `th=`, `token_hash=`, `code=` |
| #251 | sign up the same unconfirmed address twice within 2 minutes | one email in Resend, not two |
| #262 | sign in with email and with Google; open a lesson | works; browser console shows no CSP violation |
| #252 | open a lesson on a phone | same screens; faster first paint |
| #254 | DevTools → Application → Service Workers | v237 active; Cache Storage has no `/profile` or `/shop` |
| #268 | sign up a test address twice (≥ 2 min apart), confirm from the newest email | "Choose your password" appears; only the new password signs in. Tick consent before confirming → "Please confirm your email address first", its B3 Cancelled in Resend |
| #269 | close a test account that gave consent (`fix-N11-proof.sql` §4) | consent row kept: withdrawn, parent_id NULL; B3 Cancelled |
| #275 | open `/admin/funnel` as admin | the Activation card shows cohorts; non-admin refused |
| website#4 | `https://radlor.com/waitlist` | 308 → `/radlic`; `check:site-claims` exit 0 |
| website#3 | share `https://radlor.com/radlic` in a messenger | the same card image as radlor.com's home |

## 4. Needs Rafi — one line each (details and evidence in [NEEDS-RAFI.md](NEEDS-RAFI.md))

1. **N1 FND-01** — ✅ decided 26 Sep (§12 floor US$100; §14 plain contact) → #267.
2. **N2 SEC-01** — add a "set your password" step when an address was signed up more than once; check Resend's log. *Rec: yes.*
3. **N3 SEC-03** — confirm `BACKUP_PASSPHRASE` is 32 random bytes; move backups off public artifacts after the beta. *Rec: confirm today.*
4. **N4 OPS-01/FND-03** — move the prod DB secrets into the `production-db` environment; protect `release`; add a second owner. *Rec: this week.*
5. **N5 BUG-09** — require a confirmed address before a consent grant; keep declined-only accounts too? *Rec: yes / yes.*
6. **N6 MAP-09** — read Supabase Auth rate limits + min password length; lower if > ~30/5 min.
7. **N7 OPS-04** — a free uptime checker on `/api/health` + `/auth`, alerts to your phone. *Rec: yes.*
8. **N8 FND-04/05** — measure activation from `lesson_progress` (no new child events). *Rec: yes, run `sql/fnd-activation.sql` first.*
9. **N9 BUG-10** — words for "please sign in again" / "needs a parent's permission". *Rec: those two sentences.*
10. **N10 MAP-01** — doc 07 says the app has no email code; fix in the next legal PR.
11. **N11 MAP-13** — keep the consent record when an account closes (FK `set null`). *Rec: yes, with the attorney.*
12. **N12 OPS-11/06** — create staging; confirm Preview does not use production Supabase.
13. **N13 OPS-05/FND-10** — Vercel Pro before the first charge.
14. **N14 OPS-15** — check the Resend plan (Free = 100 emails/day).
15. **N15 ARC-09/PERF-08/FND-17** — after #233, delete what KG–2 doesn't use.
16. **N16 ARC-02** — adult devices keep children's progress; ask the attorney if doc 08 covers it.
17. **N17 ARC-03/SEO-04** — retire `/menu` for `/modules`; delete `/demo`.
18. **N18 ARC-10** — "Last played" reads a dead column; read `lesson_progress.updated_at`.
19. **N19 ARC-11** — pick one "mastered" rule before chapters return.
20. **N20 ARC-14** — trim CLAUDE.md/handoff auto-loaded context.
21. **N21 SEO-01/FND-06/07** — say "grades 3 to 8"; drop game-time and roster claims until live.
22. **N22 SEO-08** — Search Console first, then one page per grade.
23. **N23 SEO-09** — noindex or 308 `/waitlist`.
24. **N24 SEO-11** — JSON-LD price when billing goes live.
25. **N25 SEC-12** — no legal text may call the parent PIN a data protection.
26. **N26 BUG-12** — decide whether offline is promised (also decides #252's trade-off).
27. **N27 MAP-12/FND-09** — school-consent route (attorney A3) before teachers add students.
28. **N28 FND-02** — make READINESS say real families are invited; send the attorney packet.
29. **N29 FND-08** — a 36-topic human read-and-listen audit within 30 days.
30. **N30 FND-12** — a written "not this month" list and one deciding metric.
31. **N31 FND-13** — confirm `support@` receives mail; 24 h answers in the beta.
32. **N32 FND-14** — curriculum provenance question to the attorney.
33. **N33 BUG-02** — #243 stores `answered_at` on a child's progress (same kind of fact as `updated_at`; exported via `select *`). *Rec: note it in doc 02's stored-fields list at the next notice change.*
34. **#237 / #252 OKs** — the two behaviour trade-offs above. *Rec: OK both; #252's offline cost is small next to 4–5 s on every lesson.*
35. **Repo settings** from #263: allowed actions = `actions/*` + `supabase/setup-cli`; Dependabot for GitHub Actions.
36. **FND-15 log retention** — keep `deletion_log` as long as consent records? *Rec: yes, no purge job.*

## 5. Founder stress test — the five things for the next 30 days (from [R1](FOUNDER-STRESS-TEST.md) §4)

1. **Make the Terms true or stop asking for agreement to it.** Done when `/legal/terms` shows no "DRAFT" and READINESS points to a live family count.
2. **Instrument the current product and replace the funnel** (activation from `lesson_progress`, meaning pre-registered). Done when `/admin/funnel` shows a per-cohort 7-day activation that was watched returning two different values.
3. **A second human with production access.** Done when the org has ≥ 2 owners and the second person has applied one migration or rollback end to end.
4. **A human content audit with a defect rate** — 36 topics, a certified US maths teacher. Done when every "wrong maths" defect is fixed and the landing claims match `main`.
5. **Twenty paying families** — ARL renewal consent, Vercel Pro, invite-only paid pilot; freeze new surfaces until then. Done at ≥ 20 live subscriptions and a 30-day retention number.

## 6. What the trial merges caught (and how)

- **#260 would have silently undone #241.** Both redefine `prune_unconfirmed_users`; FND-15 copied the version on
  `main`. Stacked, BUG-09's own test went red 2/5. Fixed: the guard is kept, and a closing assertion refuses to apply
  the migration without it (watched raising). #260 is stacked on #241.
- **#239 was green locally and red in CI.** Five screen tests mocked `points` without the new `sessionUserId`, so
  17 unhandled errors made vitest exit 1 while every test "passed". **My own trial checks read only the "Tests" line
  and missed it — trials 1–4 were blind to unhandled errors.** Trial 5 is judged by exit code. Fixed in #239.
- **Tests coupled across PRs:** #250's keep-alive fixture had no voice (fails once #237 refuses network voices);
  #259's scan floor assumed files #250 deletes; #258's partial mock missed #251's lookup. Each fixed at the test,
  so each PR passes with or without the other.
- **Textual conflicts** (import lines, one YAML block, one route): resolved by stacking #245 on #236, #255 on #239,
  #258 on #246.
- **`break-check.sh` called "setup threw" a pass** — a break that made a fixture throw in `beforeAll` was reported as
  "PASSED on the broken state". Fixed in #265 (and noted for `video_reviewer`'s copy).
- **CI `rls-tests` hit an image-registry rate limit** when ~25 PRs ran at once (`toomanyrequests` from
  `public.ecr.aws`); re-run. Same family as READINESS's #198.

## 7. Not verified

Nothing was run against production. Migrations were rehearsed on PGlite (and CI's Docker Postgres via `rls-tests`),
not on a copy of production. Browser behaviour was checked in Chromium locally, not on a real phone or Safari. The
workflow changes (#236, #245, #247, #263) cannot be proven until a real Actions run. Resend behaviours (409 on a
reused key) are from Resend's docs. No clip was listened to.
