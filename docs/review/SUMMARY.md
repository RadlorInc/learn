# Deep review — summary

**26 September 2026, on `main` = `06cee602`.** Eight read-only reports: [ARCHITECTURE](ARCHITECTURE.md) (R0),
[FOUNDER-STRESS-TEST](FOUNDER-STRESS-TEST.md) (R1), [ARCHITECTURE-REVIEW](ARCHITECTURE-REVIEW.md) (R2),
[LATENT-BUGS](LATENT-BUGS.md) (R3), [PERFORMANCE](PERFORMANCE.md) (R4), [SECURITY-AUDIT](SECURITY-AUDIT.md) (R5),
[DEVOPS](DEVOPS.md) (R6), [SEO](SEO.md) (R7). Decisions for Rafi: [NEEDS-RAFI](NEEDS-RAFI.md). Phase 2 results:
[ROUND2](ROUND2.md). Production facts the reports could not see are asked for as read-only SQL in [`sql/`](sql/)
(checked: every file is SELECT/EXPLAIN only; the one EXPLAIN of a DELETE is on `where false`, not ANALYZE, rolled back).

**127 findings: 1 Critical · 27 High · 40 Medium · 59 Low.** Several appear in two reports and are marked
"Dup of …" below. No **security** finding is Critical. The one Critical is legal (FND-01).

Evidence: **Measured** = someone ran or measured it · **Reproduced** = a failing test/script shows it (kept outside the
repo under `review-scratch/`, reproduced again in the fix PR) · **Suspected** = read from code, not demonstrated.
A Suspected finding is a lead, not a fact.

## The top 10, in the order I'd do them

1. **FND-01 — sign-up says "you agree to our Terms", and the Terms page says DRAFT — NOT IN FORCE** (Measured, live).
   Yours: decide §11/§14 and publish, or change the line. N1.
2. **SEC-01 — sign-up pre-account-takeover** (Reproduced on a local stack). Yours: the complete fix changes the confirm
   screen for a repeat sign-up. N2. Check Resend's log for repeat sign-up emails to one address.
3. **SEC-02 — a viewer's access to a child cannot be revoked** (Reproduced). Migration.
4. **BUG-01 + BUG-04 — a child's queued answers are dropped on a shared device, and one refused item blocks every
   child's uploads** (Reproduced). Client fix.
5. **BUG-03 — a failed consent grant leaves a scheduled "you gave permission" email and a 24 h lockout** (Reproduced).
6. **BUG-09 — the nightly prune can delete a GRANTED consent record** (Reproduced, DB half). Migration guard; run
   `sql/bugs-unconfirmed-granted.sql` to see if it already happened.
7. **BUG-07 — a failed role read is treated as "no role"** (Reproduced) → wrong redirect, role picker can overwrite.
8. **OPS-04/07 + FND-11 — nobody is told when anything breaks** (Measured: the backup was red 13 nights unnoticed).
   A daily numbers-only email to Rafi + retry of refused B3 cancels.
9. **BUG-02 — a stale device rolls a child's level/mastered back on the account** (Reproduced). Migration.
10. **PERF-01 — a child waits ~10.8 s for a lesson on a mid-range phone** (Measured): the whole 36-module catalogue
    (~800 KB gz) loads before any child screen paints.

Also fixed in this loop because they are small and child-data adjacent: MAP-04 (a child's name can reach Google's
network TTS voice), SEC-06 (crash reports store URL tokens), OPS-02 (a rejected migration is never retried).

## Questions for Rafi

1. **Are real families on production right now, and since when?** READINESS says none; the beta opened 25 Sep. Every
   "could it already have happened" answer depends on this.
2. **FND-01:** publish the Terms (decide §11 floor and §14 contact) or change the sign-up line — which, by when?
3. **SEC-01:** OK to add a "set your password" step when an address was signed up more than once before confirming?
4. **SEC-03 / OPS-01:** is `BACKUP_PASSPHRASE` 32 random bytes? Will you move the prod DB secrets into the
   `production-db` environment (a GitHub setting, 5 minutes)?
5. Please run the files in [`sql/`](sql/) — each says what each column answers — especially
   `bugs-unconfirmed-granted.sql` (BUG-09), `sec-production-facts.sql` (SEC-02, SEC-06) and
   `devops-cron-and-size.sql` (OPS-07).
6. Which **Resend plan** is the account on (OPS-15: Free caps 100 emails/day)?
7. Supabase Auth dashboard: sign-in rate limits, minimum password length, Email OTP expiry (MAP-09, BUG-09).

## Every finding

"when" is the reviewer's timing; "status" is where it stands now (updated as Phase 2 lands).

| ID | area | severity | evidence | effort | title | when | status |
|---|---|---|---|---|---|---|---|
| FND-01 | legal/COPPA | Critical | Measured | S | Sign-up asks agreement to a Terms page that is live as "DRAFT — NOT IN FORCE"; founder's own G1 says no-go | fix now | Decided by Rafi 26 Sep (floor US$100, §14 plain contact) → Fixed (#267) |
| BUG-01 | progress sync / offline | High | Reproduced | M | Queued answers/points dropped when flushed by another account or no session (42501 → drop) | fix now | Fixed (#239) |
| BUG-02 | progress sync / DB | High | Reproduced | M | Stale device rolls back level/mastered on the account; level_up re-minted | fix now | Fixed (#243) |
| BUG-03 | consent | High | Reproduced | S | Consent grant failing after B3 scheduled: orphan "you gave permission" email + 24 h Resend-409 lockout | fix now | Fixed (#235) |
| BUG-07 | auth | High | Reproduced | S | getMyRole returns null on a read error → wrong redirect / RolePicker can overwrite a real role | fix now | Fixed (#238) |
| BUG-09 | consent / retention | High | Reproduced | S | Consent granted on an unconfirmed address; nightly prune cascade-deletes the granted consent record | fix now | Fixed (#241, prune guard); flow → Needs Rafi — N5 |
| FND-02 | legal/governance | High | Measured | M | Beta with real children launched on founder decisions standing in for attorney sign-off (`beta` flag); READINESS still says no real family invited | fix now | Needs Rafi — N28 |
| FND-03 | team/ops | High | Measured | M | Single human operator: 1 org member, sole admin, sole prod approver, sole merger; ~74% of commits since Aug co-authored by Claude | fix now | Needs Rafi — N4 |
| FND-04 | metrics | High | Suspected | M | Admin funnel counts `chapter_open`/`sessions` (legacy only); lessons emit no events; child-login skips `session_start` — the funnel is one-valued | fix now | Needs Rafi — N8 (making lessons log events is new collection about a child) |
| FND-05 | product/strategy | High | Measured | M | No activation metric or efficacy instrument for the current product; diagnostic deleted, mastery = ladder position | fix now | Needs Rafi — N8 |
| FND-06 | product/marketing | High | Measured | S | Landing sells game time; `/play` is "coming soon" and a child already lost points | fix now | Needs Rafi — N21 |
| FND-08 | content quality | High | Measured | L | 282 topics, 6,639 clips, all ladders never read/heard by a human; answer keys are AI-vs-AI | after beta | Needs Rafi — N29 |
| FND-09 | distribution/legal | High | Measured | L | Teacher channel frozen until a school-consent route exists | after beta | Needs Rafi — N27 |
| FND-10 | money/legal | High | Measured | M | Billing never exercised with money; ARL auto-renewal consent missing; Vercel Hobby | before payments | Needs Rafi — N13 |
| FND-11 | ops/COPPA | High | Measured | S | Consent is email-dependent and has failed silently once (Resend 401 on B3 cancel); quotas unmeasured | fix now | Fixed (#246) |
| FND-12 | strategy | High | Measured | S | Pivot cadence without a deciding metric (~5 re-foundings in 4 months; new surfaces started in the beta week) | fix now | Needs Rafi — N30 |
| MAP-04 | privacy / child | High | Suspected | S | The child's first name is spoken through `speechSynthesis`; with no local English voice the code picks Chrome's network "Google US English" voice, which sends the text to Google — a third party not in doc 07 | fix now | Fixed (#237) — ⚠️ needs Rafi OK: browser-TTS lines are silent on network-voice-only devices |
| MAP-09 | auth / child | High | Suspected | S | Child accounts sign in browser-direct with a guessable username namespace and a 6-char minimum; only Supabase-hosted per-IP limits apply (the app limiter never sees sign-in) | fix now | Needs Rafi — N6 (hosted Auth limits are a dashboard setting) |
| MAP-10 | auth | High | Suspected | S | Re-signup of an **unconfirmed** address may keep the first caller's password (pre-account-takeover) — unmeasured whether `generate_link` overwrites it | fix now | Dup of SEC-01 |
| OPS-01 | secrets / deploy | High | Measured | S | Prod DB password and account-wide Supabase PAT are repo-level secrets; any branch workflow reaches production without the `production-db` approval; no branch protection | fix now | Needs Rafi — N4 |
| OPS-02 | deploy | High | Reproduced | S | `migrations-changed` diffs only the current push → a rejected/failed/cancelled-pending migration is never retried while app deploys continue | fix now | Fixed (#236) |
| OPS-04 | monitoring | High | Measured | M | Nobody is paged: crashes, outages, backup failures reach no person (backup red 13 nights unnoticed; 1 h Vercel logs; GitHub cron 5 h late) | fix now | Fixed (#246, daily numbers-only digest); uptime vendor → Needs Rafi — N7 |
| OPS-07 | monitoring / consent | High | Suspected | S | pg_cron retention/consent jobs and the daily B3-cancel Vercel cron fail silently (legal promises, withdrawn parent may get B3) | fix now | Fixed (#246) |
| PERF-01 | performance / bundle | High | Measured | M | All 36 modules (≈800 KB gz) in first-load JS of every child screen; lesson LCP 10.8 s, topic list 8.4 s on a mid phone | fix now | Fixed (#252) — ⚠️ needs Rafi OK: an unvisited module no longer opens offline (N26) |
| SEC-01 | auth | High | Reproduced | M | Sign-up pre-account-takeover: attacker's password survives the owner's email confirmation | fix now | Needs Rafi — N2 (a partial "last password wins" fix opens a confirm-time race; see NEEDS-RAFI) |
| SEC-02 | RLS | High | Reproduced | S | Viewer access cannot be revoked (learner_access DELETE → 42P17 for everyone); a hand-removed viewer can re-open the accepted invite | fix now | Fixed (#240) |
| SEC-03 | backups/CI | High | Measured | M | Encrypted prod dumps with children's data are public-repo artifacts; secrecy rests on one passphrase, CBC without MAC | fix now | Needs Rafi — N3 |
| SEO-01 | content / entity | High | Measured | S | "Grade KG to 8" in titles, descriptions, JSON-LD, OG alt, llms.txt and visible copy; no KG–2 content is live, and radlor.com/ + both llms.txt bodies say 3 to 8 | fix now | Needs Rafi — N21 |
| ARC-01 | architecture / metrics | Medium | Measured | M | /admin Learning/Funnel and all analytics events measure the deleted chapter system; live lessons emit nothing | fix now | Dup of FND-04 |
| ARC-02 | architecture / child data | Medium | Suspected | M | Adult dashboards replicate every child's progress into the adult device's kv, read "done" from that cache, never clear it (shared teacher computers) | after beta | Later — M; legal to confirm doc 08 covers shared teacher computers (N16) |
| ARC-03 | architecture / routing | Medium | Suspected | S | Two child homes: /menu (Start button, error pages) skips class mode, temp-password redirect, child Sign out; PWA banner unreachable | fix now | Needs Rafi — N17 |
| ARC-04 | layering | Medium | Reproduced | M | Layering gate checks only core/ (0.7 % of code), no positive control, blind to relative/dynamic/side-effect/double-quoted imports; 15 upward imports + 14 Supabase-bypass files unchecked | after beta | Later — M; the widened rule must be kept green, do after PERF-01 moves files |
| ARC-05 | schema/code drift | Medium | Measured | M | Supabase client untyped; "auto-generated" types hold only deleted tables, regen path wrong | after beta | Later — M |
| ARC-06 | duplication / coupling | Medium | Reproduced | M | Service-role REST helpers ×5 and caller-identity ×3; they already differ on network failure (all fail closed); billing authenticates through the consent feature | after beta | Later — M |
| ARC-07 | test infra | Medium | Reproduced | S | A sync loop pins a vitest worker forever and orphans it when the run is killed (the "int hang" mechanism); CI has no job timeout | fix now | Fixed in part (#245: CI job timeouts); vitest cannot bound a sync loop (measured) — local hang remains |
| ARC-08 | maintainability | Medium | Measured | M | Parent+teacher dashboards in one 1,021-line component (38 useState, 26 role branches), 4–5 requests per child | after beta | Later — M; split after PERF-03 |
| ARC-09 | dead code / cost | Medium | Measured | L | Hidden legacy system: 21k+ lines, shell routes, ~160 MB Teddy/Stevie audio, two CI workflows that only skip, no CI e2e/lint for live lessons | decide before KG–2 | Needs Rafi — N15 |
| ARC-10 | dead reads / visible bug | Medium | Suspected | S | "Last played" reads learner_stats.last_played_at which nothing writes; dashboard still fetches 3 dead tables per child | fix now | Needs Rafi — N18 (a visible "Last played" line) |
| BUG-04 | progress sync / consent | Medium | Reproduced | S | P0C01 on a progress upload retried forever, blocking every child's uploads on the device, silently | fix now | Fixed (#239) |
| BUG-05 | voice | Medium | Reproduced | S | One failed manifest fetch → browser TTS/silence for the whole session | fix now | Fixed (#244) |
| BUG-08 | storage | Medium | Reproduced | M | IndexedDB-hang boot writes to localStorage; next boot orphans it (incl. the upload queue) | after beta | Fixed (#259) |
| BUG-10 | error paths | Medium | Suspected | M | "Check your connection" shown for consent/RLS/expired-session failures (incl. right-to-correct) | after beta | Fixed (#266, classifier; stacked on #239); wording → Needs Rafi — N9 |
| FND-07 | marketing/consumer-protection | Medium | Measured | S | Landing claims "KG to 8" and teacher rosters; main ships 3–8 and rosters are paused | fix now | Dup of SEO-01 (+ rosters claim) |
| FND-13 | ops | Medium | Measured | S | No support process: support log empty since 2026-07-27; support mailbox may not exist | fix now | Needs Rafi — N31 |
| FND-14 | IP | Medium | Suspected | S | Curriculum provenance: titles from school PDFs / photographed textbook contents page | after beta | Needs Rafi — N32 |
| FND-15 | compliance | Medium | Measured | M | Deletion audit trail missing (~1,440 rows deleted untracked) | after beta | Fixed (#260) |
| MAP-01 | legal docs | Medium | Measured | S | Subprocessor doc says the app has no email code; it calls Resend's API directly (and schedules/cancels) | fix now | Needs Rafi — N10 |
| MAP-02 | privacy / billing | Medium | Suspected | S | `billing_events.payload` stores the full Stripe event (parent email, name, address), so after account deletion the row still identifies the family, against `accountDeletion.ts`'s "stripped" claim | before billing | Fixed (#249) |
| MAP-13 | legal / consent | Medium | Suspected | S | Close account cascades away the consent record; doc 06 says the record is kept | after beta | Needs Rafi — N11 |
| OPS-03 | alerting | Medium | Measured | S | red-main reports a failed `migrate-prod` as "not in production, the gate working" while the app is already live | fix now | Fixed (#247) |
| OPS-05 | platform | Medium | Measured | S | Vercel Hobby for a commercial product: non-commercial ToS, no Skew Protection, 1 h logs, previous-only rollback, public repo forced | before payments | Needs Rafi — N13 |
| OPS-06 | deploy | Medium | Measured | S | App promotes before DB approval; approval wait blocks all later deploys; contract migrations unguarded | after beta | Later — design change to the deploy order; revisit with staging (N12) |
| OPS-08 | deploy / backup | Medium | Measured | S | No backup taken before `migrate-prod`; D6 margin was 23 s | fix now | Fixed (#247) |
| OPS-09 | backup / privacy | Medium | Measured | S | Encrypted children's-data dumps published as artifacts of a public repo (listable anonymously) | before first real family | Dup of SEC-03 |
| OPS-10 | runbooks | Medium | Measured | S | Rollback runbook wrong for Hobby (auto-assign off after rollback, one step back only), relies on unbought PITR, and instructs prod `psql`/MCP writes | fix now | Fixed (#248) |
| OPS-11 | environments | Medium | Measured | M | No staging; Preview deployments may point at production; Free-org staging would pause and block prod migrations | before first real family | Needs Rafi — N12 |
| OPS-13 | supply chain | Medium | Measured | S | Third-party actions pinned by tag in jobs holding prod secrets; `allowed_actions: all` | after beta | Fixed (#263) |
| OPS-14 | CI | Medium | Measured | M | Playwright runs nowhere in CI; nightly/weekly green while skipping; nightly names a deleted spec | after beta | Later — Playwright in CI is M; worth it once the lesson screens stop changing daily |
| OPS-15 | email | Medium | Suspected | S | Resend plan unknown; Free caps 100 emails/day, which a sign-up spike exceeds (B0 + B3 per parent) | before launch push | Needs Rafi — N14 |
| PERF-02 | performance / rendering | Medium | Measured | M | Child screens render nothing on the server, so first paint = hydration (FCP 10 s vs 2.7 s on an SSR page) | after beta | Later — after PERF-01 lands; re-measure first |
| PERF-03 | performance / data | Medium | Measured | S | /parent does 9 + 4 queries per child (teacher with 30 students: 72); lesson_progress read twice per child; dashboard RPC returns only emptied legacy tables | fix now | Fixed (#255) |
| SEC-04 | API | Medium | Suspected | S | /api/auth/signup is an anonymous email relay from noreply@radlor.com (per-instance IP limit only) | fix now | Fixed (#251) |
| SEC-05 | auth | Medium | Suspected | S | Class temp passwords ≈15 bits; child usernames enumerable via 409 | after beta | Later — roster is paused, few classes |
| SEC-06 | logging | Medium | Suspected | S | Crash reports persist URL fragment/query credentials (consent token, token_hash, implicit-flow tokens) | fix now | Fixed (#242) |
| SEC-07 | RLS/consent | Medium | Measured | S | learners DELETE policy bypasses delete_child_data; Classes rollback still uses it | after beta | Fixed (#256, expand: client uses delete_learner); contract (drop policy) → Needs Rafi 3.9 |
| SEO-02 | social / OG | Medium | Measured | S | radlor.com/radlic has no og:image/twitter:image (only radlor.com page without); page's `openGraph` object replaces the inherited file-based image (mechanism Suspected) | fix now | Fixed (website#3) |
| SEO-03 | performance / redirect | Medium | Measured | M | radlic.com/ client redirect: signed-out visitor waits 2.6 s (slow 4G + 4× CPU, median of 3) and ~975 KB decoded app JS before the landing page is requested, ~4 s to landing LCP | after beta | Later — M; the landing redirect stays client-side by your choice (session is in localStorage) |
| SEO-08 | content gap | Medium | Measured | M–L | 282 topics / 36 modules, zero public pages; the only public product page is 362 words; no grade or topic landing pages for grade-3–8 searches (search demand = Assumption) | after beta | Needs Rafi — N22 |
| ARC-11 | duplicate logic | Low | Reproduced | S | Two "mastered" rules write the same lesson_progress.mastered (6 vs 8 vs 12 answers) | later | Needs Rafi — N19 |
| ARC-12 | duplicate logic | Low | Reproduced | S | 8+ copies of signed-number display disagree on −1234 and −0; the canonical `core/fmt.ts` is imported by nothing (0 hits in 423k generated problems) | later | Later — no wrong output found in 423k problems |
| ARC-13 | duplicate logic | Low | Reproduced | S | Fourth mulberry32 + duplicate pick/shuffle/fmt (agree today) | later | Later — agree today |
| ARC-14 | maintainability | Low | Measured | S | Auto-loaded context 133–161 KiB/session: CLAUDE.md 59.4, security.md 13.7 via an @-mention (stale), handoff 58.9 committed / 91.0 live (~24 KiB self-bookkeeping) | after beta | Needs Rafi — N20 (your CLAUDE.md/handoff) |
| ARC-15 | docs | Low | Measured | S | Stale architecture doc, wrong "auto-generated" header, false "not synced" comment, 25 files naming deleted systems, ~141 KB teen docs | fix now | Fixed (#248) |
| ARC-16 | dead code | Low | Measured | S | Unused: zustand dep, 30 unreferenced exports incl. 3 whole files, 5 starter SVGs, a test that keeps a dead function alive | fix now | Fixed (#250) |
| BUG-06 | analytics | Low | Reproduced | S | Analytics: in-flight events deleted unsent; one refused event blocks all later events | after beta | Fixed (#253) |
| BUG-11 | service worker | Low | Suspected | S | SW activate wipes the content-addressed clip/image cache on every version bump | after beta | Won't fix as proposed — clips are re-rendered under the SAME URL (f5a7694f3), so keeping them across bumps would strand old audio; needs content-hashed clip URLs (later). Guard test in #254 |
| BUG-12 | service worker | Low | Suspected | M | SW offline: query-exact cache match, stale APP_PAGES, unhandled CACHE_URLS | later | Needs Rafi — N26 |
| BUG-13 | game time | Low | Suspected | S | Game-time day counted in UTC for families with no settings row | before game time returns | Later |
| BUG-14 | parent reports | Low | Suspected | M | Performance week / mastered dates use upload time, not answer time | later | Later |
| BUG-15 | classes | Low | Suspected | S | exercise_results has no idempotency; roster compensating delete swallows failure | later | Later — adding students is paused |
| BUG-16 | storage | Low | Suspected | M | Two tabs overwrite each other's in-memory queue (last writer wins) | won't fix | Won't fix unless seen — one child, one tab |
| FND-16 | tech | Low | Suspected | S | In-memory per-instance rate limiter is decorative at scale | won't fix | Dup of MAP-11 |
| FND-17 | ops/content | Low | Measured | M | 296 MB of audio in git; every reword needs an agent-run Kaggle render | later | Needs Rafi — N15 |
| MAP-03 | sync | Low | Reproduced | S | A `P0C01` consent refusal on a queued lesson upload is classified `retry`, so the device's whole upload queue (all learners) stalls forever behind it | fix now | Dup of BUG-04 |
| MAP-05 | architecture | Low | Measured | S | `docs/architecture.md` is stale, and the layering test enforces only `core/` purity; 10 upward imports (shared/infra/data → features/app) and 5 non-`data` Supabase callers exist | later | Docs half in the docs bundle; rule half = ARC-04 |
| MAP-06 | docs | Low | Measured | S | `docs/security.md` and `security_baseline.sql` are stale (CSP quote, DEFINER count, V13, sync_* as the write path, policy counts) | fix now | Dup of SEC-14 |
| MAP-07 | analytics | Low | Reproduced | S | `learner_events` flush erases events tracked while an upsert is in flight (`kv.remove` of the whole key) | after beta | Fixed (#253) |
| MAP-08 | schema hygiene | Low | Suspected | M | Legacy tables/RPCs (sessions, learner_progress/stats/state, diagnostic_*, sync_*) are empty but live: still granted, still gated, still read by the dashboard fallback and export; their FOR ALL policies let a viewer or child `self` login write them | after beta | Later — a drop migration that must update export + docs together |
| MAP-11 | abuse | Low | Suspected | M | Every rate limit is an in-memory Map per serverless instance | won't fix | Won't fix now — fine at tens of families; revisit at ~10k or on abuse |
| MAP-12 | classes | Low | Suspected | — | Teacher "add student" is paused whenever `parental_consents` is readable, so production teachers cannot add students | rafi | Needs Rafi — N27 (teacher consent route, attorney A3) |
| MAP-14 | deps | Low | Measured | S | `zustand` is a runtime dependency with no import left | fix now | Dup of ARC-16 |
| MAP-15 | sync | Low | Suspected | S | No timed retry of the lesson queue while online after a `retry` (the `useOfflineSync` hook with the interval is unused); uploads wait for the next enqueue, page load or `online` event | later | Later |
| MAP-17 | auth | Low | Suspected | S | The Supabase `hashed_token` (a one-time sign-in credential) rides in the confirm link's query string, so it lands in server request logs | later | Later — standard Supabase pattern, 1 h logs |
| OPS-12 | docs | Low | Measured | S | Docs say Supabase Free / secrets unset (stale); backup.yml says delete itself when PITR is on | fix now | Fixed (#248) |
| OPS-16 | CI | Low | Measured | S | CI on Node 20 (EOL), no `engines`/`.nvmrc`, Vercel Node version unknown | after beta | Later — Node 20 is what CI and (probably) Vercel run; bump both together (Vercel setting → N13) |
| OPS-17 | backup | Low | Measured | S | Backup job trusts `PROD_PROJECT_REF` without `assert-prod-ref.sh` | after beta | Fixed (#263) |
| OPS-18 | CI | Low | Measured | S | No `timeout-minutes` on CI/deploy jobs; a known vitest hang would hold the deploy queue 6 h | fix now | Fixed (#245) |
| OPS-19 | frontend ops | Low | Measured | S | SW precaches removed routes; old open tabs can hit chunk 404s after takeover (no Skew Protection on Hobby) | later | Fixed (#254) |
| OPS-20 | migrations | Low | Measured | S | No `lock_timeout`, non-concurrent indexes, `SET NOT NULL` scans — harmless now, matters on big tables at ~10k families | later | Won't fix now — at tens of families every table is tiny; revisit past ~1M rows |
| OPS-21 | monitoring | Low | Measured | S | `/api/health` is shallow (no Supabase/auth check, no version) | with OPS-04 | Won't fix — an uptime checker reads the status code, which stays 200 by design; the daily digest (#246) reports DB reachability |
| PERF-04 | performance / bundle | Low | Measured | S | /help prefetches /parent's 1 MB bundle via `<Link>` (1,295 KB transferred, 391 ms blocking) | later | Dup-ish of PERF-01 (shrinks with it) |
| PERF-05 | performance / images | Low | Measured | S | /auth LCP is a 103 KB PNG shown 56 px tall; a 27 KB re-encode saves ≈0.4 s | after beta | Fixed (#264) |
| PERF-06 | performance / database | Low | Suspected | S | game_wallet() sums the whole lifetime ledger per call | won't fix | Won't fix — sub-ms at our size; perf-explain.sql Q4/Q8 watches it |
| PERF-07 | performance / offline | Low | Suspected | S | SW deletes content-addressed voice clips at every VERSION bump (~5 bumps a day) | after beta | Dup of BUG-11 |
| PERF-08 | deploy weight | Low | Suspected | S | 160 MB of Stevie/Teddy clips in every deploy; new-flow lessons play Josh only | later | Needs Rafi — N15 (deleting content) |
| PERF-09 | performance / data | Low | Measured | S | /parent makes 3 (teacher 5) auth getUser round trips per load | later | Later — tiny; decide with ARC-06 |
| PERF-10 | performance / audio | Low | Measured | S | Lesson mount prefetches ~20 clips at once (363 KB); no LCP effect; first-line delay unmeasured | won't fix | Won't fix — no measured effect; needs a time-to-first-audio measurement first |
| PERF-11 | memory | Low | Suspected | S | Speech keep-alive setInterval reassigned without clearing | after beta | Fixed (#250) |
| PERF-12 | performance / offline | Low | Measured | S | SW precaches deleted /profile and /shop (404) | later | Dup of OPS-19 |
| SEC-08 | RPC integrity | Low | Reproduced | S | A child's login can mint unlimited points via record_lesson_progress | later | Later — fix written as a follow-up on top of #243 (in #261's body); needs #243 first |
| SEC-09 | API | Low | Suspected | S | Anonymous /api/report-error can attach text to any child's export and fill error_events | after beta | Later |
| SEC-10 | CI | Low | Measured | S | Third-party actions pinned by tag in jobs holding the Supabase PAT and prod DB password | after beta | Dup of OPS-13 |
| SEC-11 | headers | Low | Measured | S | connect-src *.supabase.co wildcard, camera=(self) leftover; radlor.com sends no security headers | after beta | Fixed (#262, app half); radlor.com headers later |
| SEC-12 | auth/docs | Low | Suspected | S | Parent PIN is a UI gate only; must not be described as a data protection | later | Needs Rafi — N25 |
| SEC-13 | admin | Low | Suspected | S | Admin RPCs do not require MFA (aal2) | later | Later — admin RPCs return aggregates only |
| SEC-14 | docs | Low | Measured | S | docs/security.md stale (CSP, V13, DEFINER count, CI step, /api/lead) | fix now | Fixed (#248) |
| SEC-15 | client privacy | Low | Suspected | S | Per-learner practice data stays in IndexedDB/localStorage after sign-out | after beta | Later |
| SEC-16 | RPC | Low | Reproduced | S | entitled_chapters/is_chapter_entitled answer for any learner (no access guard) | later | Fixed (#261) |
| SEC-17 | API | Low | Measured | S | Error responses name missing env vars / echo signature errors | later | Fixed (#258) |
| SEO-04 | index coverage | Low | Measured | S | `/demo` is indexable: 200, not disallowed, no noindex, inherits the home title/description, thin legacy "New lessons are on the way" page | after beta | Fixed (#257) |
| SEO-05 | social / OG | Low | Measured | S | `/help` (and every app page without its own `openGraph`) inherits `og:url=https://radlic.com` and the home og:title; radlic.com uses `twitter:card: summary` with a 1200×630 image | after beta | Fixed (#257) |
| SEO-06 | index coverage | Low | Measured | S | Signed-in routes rely on robots Disallow only (no noindex); `/auth` is linked 7× from radlor.com so can surface URL-only; `/consent`'s noindex is unseeable under Disallow. No child data exposed (client-rendered shell; consent token in #fragment) | later | Won't fix — robots Disallow is enough at this size; nothing private is served |
| SEO-07 | structured data / checks | Low | Measured | S | Cross-site entity-id parity is ungated: `publicSeo.test.ts` greps `page.tsx` source text and never compares with radlor.com; radlor-site has no CI; `check:site-claims` ignores JSON-LD. Ids match today (Measured). Stale comment `site.ts:72-73` says radlor.com still has the old id | after beta | Later — ids match today |
| SEO-09 | index / copy | Low | Measured | S | `/waitlist` still `index,follow` + self-canonical, off the sitemap, contradicts "Try Radlic" | after beta | Needs Rafi — N23 |
| SEO-10 | redirects | Low | Measured | S | Old host root: adaptivelearn.radlor.com/ → 308 radlic.com/ → JS → radlor.com/radlic (3 hops, one client-side); old backlinks consolidate via canonical hint only | won't fix | Won't fix — cheap chain, the old host has little equity |
| SEO-11 | structured data | Low | Measured | S | `SoftwareApplication.offers` states price 0 on both sites while paid plans exist (hidden, Stripe test mode) — becomes a false claim the day billing goes live | when billing launches | Needs Rafi — N24 |
| SEO-12 | performance | Low | Measured | S | Public `/help` pulls 4.57 MB decoded JS in 8 s incl. a 2.28 MB lesson chunk not in its HTML (Suspected `<Link href="/parent">` prefetch); LCP unaffected | later | Dup of PERF-04 |

## Found during Phase 2

| ID | area | severity | evidence | title | status |
|---|---|---|---|---|---|
| NEW-01 | test tooling | Medium | Reproduced | `scripts/break-check.sh` reported a break that made a fixture throw in `beforeAll` (all tests skipped) as "PASSED on the broken state" — "could not look" rendered as "looked, clean" | Fixed (#265); lesson noted for `video_reviewer`'s copy |
| NEW-02 | cross-PR | High | Reproduced | #260 (FND-15) redefined `prune_unconfirmed_users` from `main`'s body and would have silently removed #241's (BUG-09) guard | Fixed in #260 (stacked on #241; closing assertion) |
| NEW-03 | process | Medium | Measured | my trial merges 1–4 read only vitest's "Tests" line and were blind to unhandled errors (#239: every test passed, exit 1) | Fixed from trial 5 on: judged by exit code |
| NEW-04 | CI | Low | Measured | `rls-tests` fails with `toomanyrequests` from `public.ecr.aws` when many PRs run at once | Won't fix now — re-run; revisit if it recurs outside bursts |
