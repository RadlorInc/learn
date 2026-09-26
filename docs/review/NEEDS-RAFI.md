# Needs Rafi — decisions and settings the review cannot make

> ✅ **DECIDED 26 September 2026** (Rafi, in chat): all per the recommendation unless noted — N1 (#267); N2 + N5, and
> keep accounts holding a DECLINED consent too (#268); N8 (#275); N9 with the two sentences (#270); N10, N33 in the
> legal PR (#272); N11 (#269); N16 (#271); N17 incl. deleting `/demo` (#274); N18 and N19 — keep the NEW ladder rule
> only (#273); N20 (#276); N21 "grades 3 to 8", drop game-time/roster claims on both sites (#278, website#4); N23 308
> `/waitlist` → `/radlic` (website#4); N25 check legal text (#272: nothing to change); N26 keep the answer queue, remove
> the offline page list, no offline promise beyond that (#277); N28 (#272); N32 (#272); N34 OK #237 and #252; N36
> agreed (no purge job). **After the beta / at billing:** N13, N15, N22, N24. **Still with Rafi (settings/accounts):**
> N3, N4, N6, N7, N12, N14, N27, N29, N30, N31, N35. **Deploy freeze until Monday except N1.** Merge order: ROUND2 §2b.

Deep review, 26 September 2026. Each line: the finding(s), what is needed, **my recommendation**. Evidence is in the
report named by the ID prefix (FND → FOUNDER-STRESS-TEST, SEC → SECURITY-AUDIT, OPS → DEVOPS, MAP → ARCHITECTURE,
ARC → ARCHITECTURE-REVIEW, BUG → LATENT-BUGS, PERF → PERFORMANCE, SEO → SEO). Ordered by urgency.

## Now — while beta families are signing up

- ✅ **DECIDED 26 Sep 2026 → #267 (floor US$100; §14 plain contact; beta, attorney to review).** **N1 · FND-01 (Critical, legal).** Every sign-up screen says "By continuing you agree to our Terms", and
  `/legal/terms` is live as "DRAFT — NOT IN FORCE" (`ConsentLine.tsx:35`, `registry.ts:56`; your checklist G1 calls
  this a no-go). **Recommend:** decide §11 (liability floor) and §14 (contact) today and publish the Terms. Until then,
  change the line to "…you agree to our Privacy Policy" (a one-line copy PR I can open on your word).
- **N2 · SEC-01 = MAP-10 (High, reproduced).** An attacker who signs up first with a parent's email keeps a working
  password after the real parent confirms. Why not fixed silently: "last sign-up's password wins" leaves a race (the
  attacker re-signs up after the parent, and the parent clicks that newer email), and a password swap at confirm time
  could hit an already-confirmed account. **Recommend:** count sign-ups per unconfirmed address server-side; when the
  confirm link opens for an address signed up more than once, ask for a new password before continuing (one extra
  screen, only in that case). Meanwhile check Resend's log for >1 sign-up email to one address before its first
  sign-in — that is the only trace; the database has none.
  Also measured (#251): a second sign-up for an unconfirmed address REPLACES the first one's role and first name
  (a teacher sign-up followed by a parent one comes back as parent) while the FIRST password is kept — the route's
  comment "the role the account was FIRST created with wins" is false. Same fix as above.
- **N3 · SEC-03 = OPS-09 (High).** Encrypted production dumps (children's data) are artifacts of a PUBLIC repo; the only
  protection is `BACKUP_PASSPHRASE` (AES-CBC, no MAC). **Recommend:** confirm today it is 32 random bytes; after the beta
  move backups to a private bucket or private repo, or buy Supabase PITR and retire `backup.yml`.
- **N4 · OPS-01 + FND-03 (High).** Prod DB password and the account-wide Supabase token are REPO secrets, so any workflow
  on any pushed branch reaches production without the `production-db` approval; `main`/`release` unprotected; one human
  owner. **Recommend:** move both secrets into the `production-db` environment (GitHub → Settings → Environments), add
  branch protection on `release` (require CI), and add a second org owner you trust (READINESS 3.15).
- **N5 · BUG-09 (flow half).** Consent can be granted before the email address is confirmed. I am shipping the prune
  guard (the granted record is no longer deleted). **Recommend:** also require a confirmed address before the consent
  page accepts a grant — a flow change, so yours. Also decide: should an account holding only a *declined* consent be kept too? #241 keeps granted and withdrawn only.
- **N6 · MAP-09.** Child sign-in goes browser-direct to Supabase with a 6-character minimum; only Supabase's hosted
  limits apply. **Recommend:** read Auth → Rate Limits and password length in the dashboard and tell me the numbers;
  if sign-in attempts per IP are above ~30/5 min, lower them.
- **N7 · OPS-04 (uptime half).** A free uptime checker (e.g. UptimeRobot free tier) on `/api/health` and `/auth` needs
  an account in your name. **Recommend:** yes, 5-minute interval, alerts to your phone. The daily digest email is
  being built without it.
- **N8 · FND-04 = ARC-01, FND-05.** /admin's funnel and learning pages read the deleted chapter system; lessons emit no
  events, so the only outcome view you have shows nothing. Fixing it means logging new events about a child — new
  collection, doc 02/08 territory. **Recommend:** derive activation from `lesson_progress` (already stored and
  disclosed) instead of adding events; I can build that read-only view on your word. `sql/fnd-activation.sql` Q2 is the
  draft.
- **N9 · BUG-10 (wording).** Consent/RLS/expired-session failures say "check your connection". I am fixing the
  classifier; the words a parent sees for each case are yours. **Recommend:** "Please sign in again" for an expired
  session; "This child needs a parent's permission first" for a consent refusal.
- **N10 · MAP-01.** Doc 07 (published) says the app has no email code; it calls Resend directly. **Recommend:** fix the
  sentence in the next legal PR.
- **N28 · FND-02.** The beta runs on your decisions standing in for attorney sign-off, and READINESS still says no real
  family is invited. **Recommend:** update READINESS to the truth today and send ATTORNEY-PACKET this week.
- **N21 · SEO-01 = FND-07, FND-06.** "KG to grade 8" is on both sites, in titles and JSON-LD; only 3–8 is live.
  The landing also sells game time (`/play` says coming soon) and teacher rosters (paused). **Recommend:** say
  "grades 3 to 8" until #233 merges, and drop game-time/roster claims until they are live.

## Before the first payment

- **N13 · OPS-05, FND-10, OPS-16.** Vercel Hobby is non-commercial use, 1 h logs, no Skew Protection. **Recommend:**
  Pro before the first charge (also pin Node 20/22 there to match CI).
- **N14 · OPS-15.** Resend plan unknown; Free caps 100 emails/day (B0 + B3 per parent ⇒ ~50 sign-ups/day).
  **Recommend:** check the plan today; Pro before any launch push.
- **N24 · SEO-11.** JSON-LD says price 0 on both sites. **Recommend:** change it the day billing goes live.

## Before the first real (non-beta) family

- **N11 · MAP-13.** Closing an account cascades away the consent record; doc 06 says it is kept. **Recommend:** keep
  the record (attorney A2) — change the FK to `set null` on the parent, in a migration I can write.
- **N12 · OPS-11, OPS-06.** No staging; Preview deployments may point at production. **Recommend:** create staging
  per `docs/staging.md` and confirm in Vercel that Preview uses a non-production Supabase.
- **N16 · ARC-02.** Adult devices keep a copy of every child's progress in the browser and never clear it (shared
  teacher computers). **Recommend:** ask the attorney whether doc 08 row 20 covers it; I can clear it on sign-out.
- **N27 · MAP-12, FND-09.** Teachers cannot add students until a school-consent route exists (attorney A3).
- **N29 · FND-08.** 282 topics, ~17k clips and all ladders were never read or heard by a human. **Recommend:** a
  36-topic sample (one per module) read and listened to by you or a teacher within 30 days, logged.

## Product / content decisions

- **N15 · ARC-09, PERF-08, FND-17.** The hidden legacy system (21k+ lines, ~160 MB Teddy/Stevie audio, two CI jobs that
  only skip). #233 revives 23 chapters as KG–2. **Recommend:** after #233 merges, delete what KG–2 does not use.
- **N17 · ARC-03, SEO-04.** Two child homes: `/menu` skips class mode, the temp-password redirect and Sign out, and
  error pages link to it. **Recommend:** point the error pages and "Start" at `/modules` and retire `/menu`; delete
  `/demo` (I am adding `noindex` meanwhile).
- **N18 · ARC-10.** "Last played" on the dashboard reads a column nothing writes. **Recommend:** read it from
  `lesson_progress.updated_at` (run `sql/arc-legacy-reads.sql` first).
- **N19 · ARC-11.** Two "mastered" rules (6 / 8 / 12 answers) write the same column. **Recommend:** one rule, yours to
  pick, before chapters return.
- **N22 · SEO-08.** 282 topics, zero public pages. **Recommend:** after the beta, verify Search Console first, then one
  page per grade.
- **N23 · SEO-09.** `/waitlist` is indexable and contradicts "Try Radlic". **Recommend:** noindex it or 308 it to `/radlic`.
- **N25 · SEC-12.** The parent PIN is a UI gate only. **Recommend:** make sure no legal text calls it a data protection.
- **N26 · BUG-12.** Offline behaviour of the service worker is half-built. **Recommend:** decide whether offline is
  promised; if not, remove the offline page list rather than fix it.
- **N30 · FND-12.** ~5 re-foundings in 4 months, new surfaces started in the beta week. **Recommend:** a written
  "not this month" list and one deciding metric (7-day activation) before anything new starts.
- **N31 · FND-13.** No support process; `support@` may have no mailbox. **Recommend:** confirm the mailbox receives
  mail and answer within 24 h during the beta.
- **N32 · FND-14.** Curriculum titles came from school PDFs / a photographed textbook contents page. **Recommend:** add
  it to the attorney packet.
- **N20 · ARC-14.** CLAUDE.md + handoff are ~133–161 KiB of auto-loaded context per session. **Recommend:** move the
  long incident tables to `docs/` with a one-line pointer each.

## Added during Phase 2

- **N33 · BUG-02 (#243).** The fix stores `lesson_progress.answered_at` — when a child's standing was produced. Same
  kind of fact as the existing `updated_at`, and the export picks it up (`select *`). **Recommend:** list it in doc 02's
  stored fields at the next notice change.
- **N34 · behaviour trade-offs in two fix PRs.** #237 (MAP-04): on a device with only network voices, browser-spoken
  lines go silent (recorded clips still play). #252 (PERF-01): a lesson module never opened online no longer opens
  offline. **Recommend:** OK both.
- **N35 · repo settings (from #263).** Set "allowed actions" to `actions/*` + `supabase/setup-cli`, and turn on
  Dependabot for GitHub Actions so the pinned SHAs get update PRs.
- **N36 · FND-15 (#260).** How long to keep `deletion_log`. **Recommend:** as long as the consent records; no purge job.
