# R1 — Founder stress test (Series A diligence lens)

**Reviewer stance:** a Series A investor who has seen ~500 edtech pitches. Blunt on purpose. Base: `main` = `06cee602`
(worktree `w-review`), radlor-site `b672ba5`, live public pages fetched with GET on 26 Sep 2026. No production access;
production questions are written as SQL in `docs/review/sql/fnd-activation.sql` (**needs Rafi to run**).
Evidence labels as RULES.md: **Measured** / **Reproduced** / **Suspected**. **Assumption** marks anything about the
market or vendors I could not source from the repo or a page I fetched.

---

## 0. The one-paragraph diligence memo

Radlic has real, unusual engineering discipline around *correctness and children's data*: a consent gate enforced in
the database with zero exemptions, a legal-publish switch that refuses its own drafts, a culture of watching checks go
red. That is rare at this stage and I would say so in partner meeting. **But the discipline points at the wrong
risks.** The company can prove a column is NOT NULL; it cannot tell you whether one child learned anything, whether a
family came back on Tuesday, or whether the 6,638 voice clips sound right. It has one human, one approver and one
merger; ~74% of commits since August are co-written by an AI agent; the product has been re-founded roughly five
times in four months; and the beta went out with a Terms page that says "DRAFT — NOT IN FORCE" behind a sign-up line
that says "By continuing you agree to our Terms". I would not invest today. I would take a second meeting in 90 days if
items 1–5 in §4 are done and there is a retention curve on one page.

---

## 1. What breaks first: beta → 1,000 → 10,000 families

Ordered by *when* it breaks, not by how bad it sounds.

### At the beta (now, tens of families)

| # | what breaks | where | evidence |
|---|---|---|---|
| 1 | **Legal: the sign-up line asks for agreement to a Terms page that is not in force.** `ConsentLine` links "Terms" (`src/shared/ui/ConsentLine.tsx:35`); `registry.ts:56` has `terms … published: false`; live `https://radlic.com/legal/terms` returned 200 with `DRAFT — NOT IN FORCE` on 26 Sep. The founder's own checklist calls this a **no-go** (`docs/LAUNCH-CHECKLIST.md` G1: "a dark Terms page is a no-go"). | registry, ConsentLine, live page | **Measured** (live GET) |
| 2 | **The founder cannot see whether families use the product.** The admin funnel (`admin_funnel`, `supabase/migrations/20260905150000_admin_role_and_metrics.sql:315-326`) counts `chapter_open` events and `sessions` rows. `chapter_open` is only emitted by `/game` (`src/app/game/page.tsx:68`) — the hidden legacy chapters; the lesson flow (`src/features/lessons`, `src/app/{modules,lesson,practice}`) emits **zero** `track()` calls (grep, control: `src/app/menu/page.tsx:97` found). A child who logs in with a username lands on `/modules` (`src/data/repositories/childLogin.ts:49`), skipping `/menu`, so no `session_start` either. The funnel's steps 2–4 are, by construction, a metric that can return one value: 0. | admin funnel | **Suspected** (code read; SQL Q1 to confirm) |
| 3 | **Every production change goes through one person.** Org has **1 member**, the only admin and the only `production-db` approver (`docs/legal/READINESS.md` §3 "A second GitHub owner"). CLAUDE.md makes every PR a Draft only Rafi marks Ready, and forbids even read-only prod SQL by anyone else. Good controls, zero redundancy: Rafi sick for a week = no deploy, no migration, no incident read. | process | **Measured** (docs) |
| 4 | **A promised reward loop that does not exist.** Live landing: "Children earn points by practicing and spend them on game time" (fetched `radlor.com/radlic`; source `w-review-site/app/radlic/page.tsx:60`). On `main`, `/play` is "games are COMING SOON … a child bought minutes here, got 'Time's up!' over an empty placeholder, and lost the points" (`src/app/play/page.tsx:3-5`). The game (`blockcraft/`) is not on `main`. | product/marketing | **Measured** |
| 5 | **Landing claims content that is not shipped.** Live `radlor.com/radlic` says "Math · Grade KG to 8" and "Pick … from any grade from KG to 8". `main` ships grades 3–8 (`docs/new-flow/curriculum.md`); KG–2 is an unpushed branch (`kg2-story-chapters`, per the working-copy handoff ✉️ ②). It also sells teachers "Set up a class with usernames" while adding students is **paused** (`src/features/classes/Classes.tsx`, `rosterPaused.test.ts`; ATTORNEY-PACKET A3). | radlor-site copy | **Measured** (live text vs repo) |

### At ~1,000 families

| # | what breaks | detail | evidence |
|---|---|---|---|
| 6 | **Vercel Hobby.** Production is on Hobby (`READINESS.md` §3: "Vercel Hobby → Pro before taking payment"; LOOP-STATE: hosting logs 1 hour). Hobby is for non-commercial use (**Assumption** from Vercel's published fair-use terms, not re-fetched today). With 1-hour logs, a weekend incident is unreadable by Monday. | hosting | **Measured** (docs) + Assumption |
| 7 | **Email is the consent mechanism, and it has already failed silently once.** Every parent sign-up = B0 + a scheduled B3 24 h later (handoff ✉️ ①). A sending-only Resend key caused **silent 401s** on B3 cancels (`READINESS.md` "To build"). Resend plan quota and domain reputation are unmeasured (**Assumption**: a free/low tier caps daily sends; a sign-up spike from one school newsletter could exceed it). If B3 fails, consent is not email-*plus* and the COPPA method claimed in the notice is untrue for those families. | Resend, `/api/consent/cancel-second-notice` cron (`vercel.json:9`) | **Measured** (prior failure) + Assumption |
| 8 | **The in-memory rate limiter.** `src/app/api/_rateLimit.ts:17` is a module-level `Map` — per serverless instance, reset on cold start. At beta it is fine; at 1,000 families it neither stops abuse (many instances) nor is observable. Not worth Redis yet; worth knowing it is decorative at scale. | API | **Suspected** |
| 9 | **Support has no system.** `docs/support-log.md` has had **zero entries since 2026-07-27** ("0 real users"). At 1,000 families (**Assumption**: a few % write in weekly) that is dozens of emails a week to `support@radlor.com`, which the handoff itself says "may have no mailbox". | ops | **Measured** (file) |
| 10 | **Manual migrations with one approver.** 112 migration files; production applies are hand-approved by Rafi (`production-db` environment). The ledger already broke once (LOOP-STATE "D4 BLOCKED — the migration ledger"). More families = more reason to change schema = more queue behind one person. | Supabase | **Measured** (docs) |

### At ~10,000 families

| # | what breaks | detail | evidence |
|---|---|---|---|
| 11 | **Money was never tested with money.** `BILLING_LIVE = false` (`src/app/legal/registry.ts:125`); `stripeClient()` refuses live keys (`src/app/api/checkout/route.ts` header); no payment ever taken (ATTORNEY-PACKET context). Open before the first dollar: no affirmative auto-renewal consent control (ARL/ROSCA, packet C1), subscription-on-withdrawal undecided (C4), Refunds page dark, Vercel Pro. The first paying cohort is the test. | billing | **Measured** |
| 12 | **The teacher channel is legally frozen.** School consent route does not exist (packet A3); roster paused. At 10k families you want most of them arriving via a teacher; today that path is closed. | legal/distribution | **Measured** |
| 13 | **Content QA does not scale because it never started.** 282 topics, ~6,638 clips, ladders for 36 modules — none read or heard by a human (see §2). At 10k families every error is seen by hundreds of children the same day, and there is no in-product channel from "Didn't get it?" (`lesson_feedback`) to anyone ("`lesson_feedback` has no screen", working-copy handoff 🔁 item 5). | content | **Measured** (docs) |
| 14 | **296 MB of audio in the git repo** (`du -sh public/audio`) plus a new rendering run per reword. Every rename or copy change is a Kaggle notebook + zip merge done by the agent (✍️ block ②). Repo size and deploy time grow linearly with content. | repo/ops | **Measured** |
| 15 | **Deletion audit trail absent.** ~1,440 event rows deleted around 17 Sep with no record (`READINESS.md` "To build"). At 10k families, a parent's "what did you do with my child's data" request needs an answer you can prove. | compliance | **Measured** (doc) |

---

## 2. What the founder is not seeing

### 2.1 Product: nobody is checking whether it teaches
- **282 topics built without founder review** — "no review, build all" (`docs/new-flow/curriculum.md` header;
  `README.md` "The process (changed 2026-09-14)"). Only Grade 3 Module 1 went through the approved-script path.
- **"Answer keys, independently"** means another AI agent (the "blind solver") — agreement between two models is a
  consistency check, not a correctness check, and says nothing about pedagogy (`README.md` step 2).
- **Nobody has listened to a clip or read Grades 6–8** (working-copy handoff ✍️ ▶ OPEN 1–2). 6,639 files in
  `public/audio/nzFihrBIvB34imQBuxub/` (**Measured**, `ls | wc -l`). The one human listening test was flagged
  (`3z57ji` at ~5.1 words/s) and not closed.
- **Known curriculum gap**: Grade 6 has no negative-numbers module (CCSS 6.NS.5–7) (`READINESS.md` "For the content loop").
- **Provenance risk**: module titles "follow the school curriculum PDFs" and Grade 5 Module 1 was "re-split from the
  textbook contents page the founder photographed" (`curriculum.md` header; handoff 🔢). If those titles track a
  commercial curriculum closely, that is a question for the attorney, not a grep. **Suspected.**
- **No efficacy instrument at all.** The placement check / diagnostic was deleted on 2026-09-20 (handoff 🪦); "mastery"
  is a ladder position, not a measured skill. There is no pre/post, no item-level accuracy by topic, no comparison group.

### 2.2 Business model
- Price ladder $7.99/mo first child, $4.99 each extra, $63.99/yr first, $39.99/yr extra, cap 4, **no trial**
  (`src/core/billing.ts:32-35`). That is priced like a consumer app with the free beta as the trial. Whether parents pay
  it is untested because nothing has ever been charged. **Teachers are free**; "paid teacher" is a single hard-coded
  email in a migration (`supabase/migrations/20260918120000_teacher_plans_and_class_exercises.sql:50-52`). There is no
  school/district price, which is where US K-12 maths money actually sits (**Assumption**, general market knowledge,
  unsourced here).
- The founder's attention is a model input: in the last 10 days the time went to a 3D radlor.com "journey", a
  Minecraft-style game, a KG–2 revival, a recolour and a consent-email redesign — not to getting one price in front of
  one parent.

### 2.3 Distribution
- Channels in the repo: an open sign-up page, radlor.com, SEO/`llms.txt`. No referral mechanic, no share-progress
  loop to a second parent, no teacher → parent invite that works (roster paused). The landing moved three times in one
  week (#224 closed, base-path discarded, option 3 — handoff 🌐).
- "Sign up free" is the only call to action; there is no measured conversion from `radlor.com/radlic` because the site
  deliberately has no analytics (`check:site-claims` enforces that). That is a privacy virtue and a growth blindfold at
  the same time — use first-party counts (§4 item 2), not a tracker.

### 2.4 Retention
- The retention loop advertised (points → game time) is an IOU (§1 #4). Parent-side loops exist (due dates, reminders
  under 🔔, the Progress tab) but **nobody has used the new dashboard signed in** (handoff 🗂️/🔵 ▶ OPEN). No weekly
  email to parents. The one retention metric that exists measures the old product (§1 #2).

### 2.5 COPPA / legal
- The engineering is strong (DB-enforced consent, per-child deletion proven on real rows). The *governance* is not:
  the beta went to "real US children" with "No attorney yet: the founder decided each open point"
  (`LOOP-STATE.md` "Beta launch"), and a `beta` flag stands in for attorney sign-off in `registry.ts`. Meanwhile
  `READINESS.md` (dated 24 Sep) still says "Today: not launchable … No real family is invited" — **the two documents
  disagree about whether children are on the system**, which is exactly the "measurement written into prose" class
  CLAUDE.md warns about.
- Trademark clearance for "Radlic" not done (ATTORNEY-PACKET context). A second COPPA consent route (teacher-added
  students) is flagged for the lawyer (handoff 🌐/legal).

### 2.6 Team / bus factor
- `git shortlog -sn --since=2026-06-01`: **988 commits Mohammed Rafique Kuwari, 5 Rafi, 3 Claude** (+ ci/dependabot).
  Since 2026-08-01, **749 of 1,006 commits carry `Co-Authored-By: Claude`** (**Measured**). One human; the rest is agents.
- Throughput is extraordinary and uneven: 205 commits on 2026-09-22, 165 on 09-24 (**Measured**). ~940k lines inserted,
  ~360k deleted since June; 142k lines of TS in `src/`. A 60 KB CLAUDE.md and a 60 KB handoff are the company's
  memory. A new senior engineer would need weeks to be safe here, and nobody except agents has ever onboarded.
- The team's rules are excellent at stopping *agents* from doing damage (draft-only PRs, no prod queries). They do not
  address the risk that matters for investors: **nobody but Rafi can operate the company**.

### 2.7 The pivot pattern
From `handoff.md` alone, in ~4 months: story chapters for 6 age bands → AR hand tracking → diagnostic + skill graph
(96–98% "simulated") → **all of it hidden (09-13)** → 9-screen lesson flow → bands 9–18 **deleted (09-20)** → voice
Teddy → Stevie → Josh (clips deleted and re-rendered) → Milo → AdaptiveLearn → **Radlic, mascot removed (09-24)** →
landing moved three times → a Minecraft clone → **KG–2 story chapters revived (09-25)**. 69 commit subjects since June
mention delete/rename/remove/hidden (**Measured**, rough grep). Each pivot was individually reasonable; together they
say the company is iterating on *what to build* without a metric that tells it *which build worked*. That is the
single most important thing in this report.

---

## 3. What the top 3% of K-12 consumer-maths founders do differently

Each tied to something concrete in Radlic. No market statistics are claimed.

1. **One activation metric, defined before the beta, visible daily.** e.g. "a child finishes Screen 8 of two topics
   within 7 days of the parent signing up". Radlic already stores the raw material (`lesson_progress`, one row per
   topic, `updated_at`); it just is not counted. Replace `admin_funnel`'s `chapter_open`/`sessions` steps with
   `lesson_progress`-based ones and pre-register what a bad number means (CLAUDE.md already demands this for metrics).
2. **Pick one channel and make the product fit it.** Parent-direct and teacher-led are different products. Radlic
   sells both on one page while the teacher path cannot add a student. Either commit to parents (then build the weekly
   parent email and the share-progress loop) or get the school-consent answer (packet A3) and go teacher-first. Not both
   in the next 90 days.
3. **Efficacy evidence early, cheap and honest.** A 5-item pre/post per module, from the ladders that already exist,
   gives a per-topic learning delta within weeks. No claims on the landing ("lessons that adapt") until one exists.
4. **Humans in the content loop, sampled.** Not every topic — a fixed sample (one topic per module, 36 topics, the
   Screen 1–9 text + Screen 8 audio) read and heard by a certified maths teacher, with defects counted. That turns
   "nobody has read it" into a defect rate you can put in a deck.
5. **Charge early, even a little.** The price ladder exists; no family has been asked to pay. A paid pilot of 20
   families (even annual at a beta discount) tells you more than 500 free sign-ups. Blocked on ARL/ROSCA consent control
   and Vercel Pro — those are the real launch blockers, not another design pass.
6. **Retention loop that ships before it is marketed.** Either put the game on `main` or remove "spend them on game
   time" from the landing today.

---

## 4. The 5 things to do in the next 30 days — ranked

| rank | do this | done when (measurable) |
|---|---|---|
| **1** | **Make the Terms true or stop asking for agreement to it.** Decide §11 floor and §14 contact (two lines, `LAUNCH-CHECKLIST.md` §1), flip `terms` to published — or pause beta sign-ups until then. Reconcile `READINESS.md` with the fact that real families are invited. | `curl https://radlic.com/legal/terms` contains no "DRAFT — NOT IN FORCE"; `READINESS.md` states the live family count as a pointer to a query, not a sentence. |
| **2** | **Instrument the current product and replace the funnel.** Emit `session_start` on `/modules` (child-login path) and add lesson start/finish; rewrite `admin_funnel` over `lesson_progress`; pre-register the activation definition and what a bad number means in the same PR. First, Rafi runs `docs/review/sql/fnd-activation.sql` Q1 to confirm the current funnel reads 0. | `/admin/funnel` shows a non-zero, per-cohort "activated in 7 days" for the beta cohort, and the metric was watched returning two different values on seeded data. |
| **3** | **Second human with production access.** Add a second GitHub org owner and a second `production-db` approver (a trusted engineer or fractional CTO), with a written incident runbook they have executed once. | GitHub org shows ≥2 owners; one migration or rollback has been applied by the second person end-to-end. |
| **4** | **A human content audit with a defect rate.** One topic per module (36), Grades 3–8, read and heard by a US-certified maths teacher against a rubric (correctness, grade-fit, voice). Log every defect. | A table of 36 topics with defects/topic; every "wrong maths" defect fixed; the landing's "KG to 8" and game-time claims match `main`. |
| **5** | **Twenty paying families.** Build the ARL auto-renewal consent control (packet C1), move to Vercel Pro, flip `BILLING_LIVE` for an invite-only paid pilot. Freeze new surfaces (3D site, game, KG–2) until this is done. | ≥20 Stripe live-mode subscriptions, 0 refund disputes, and 30-day retention of that cohort reported from rank-2's funnel. |

Explicitly **not** in the 30 days: the game, KG–2, more grades, Spanish, redesigns. At tens of families none of them
changes whether the company works.

---

## 5. What I could not verify

- Whether real families are on production today, and how many (READINESS says none; LOOP-STATE says a real-family
  beta was planned for 25 Sep; RULES.md says "tens"). Needs Rafi.
- Whether `admin_funnel` actually returns 0 — SQL Q1 in `docs/review/sql/fnd-activation.sql`.
- Resend and Supabase plan limits; Vercel Hobby commercial-use terms as they read today (Assumptions above).
- Whether module titles/structure track a copyrighted curriculum closely enough to matter (attorney question).

---

## Findings table

| ID | title | area | severity | evidence | effort | when | bucket | files |
|---|---|---|---|---|---|---|---|---|
| FND-01 | Sign-up asks agreement to a Terms page that is live as "DRAFT — NOT IN FORCE"; founder's own G1 says no-go | legal/COPPA | Critical | Measured | S | fix now — real children may be signing up under it | rafi | `src/shared/ui/ConsentLine.tsx:35`, `src/app/legal/registry.ts:56`, `docs/LAUNCH-CHECKLIST.md` G1 |
| FND-02 | Beta with real children launched on founder decisions standing in for attorney sign-off (`beta` flag); READINESS still says no real family invited | legal/governance | High | Measured | M | fix now (reconcile docs), attorney before scaling | rafi | `docs/legal/LOOP-STATE.md` "Beta launch", `docs/legal/READINESS.md`, `src/app/legal/registry.ts` |
| FND-03 | Single human operator: 1 org member, sole admin, sole prod approver, sole merger; ~74% of commits since Aug co-authored by Claude | team/ops | High | Measured | M | fix now | rafi | `docs/legal/READINESS.md` §3, git history |
| FND-04 | Admin funnel counts `chapter_open`/`sessions` (legacy only); lessons emit no events; child-login skips `session_start` — the funnel is one-valued | metrics | High | Suspected | M | fix now (after SQL Q1) | own | `supabase/migrations/20260905150000_admin_role_and_metrics.sql:315-326`, `src/data/repositories/childLogin.ts:49`, `src/app/menu/page.tsx:97` |
| FND-05 | No activation metric or efficacy instrument for the current product; diagnostic deleted, mastery = ladder position | product/strategy | High | Measured | M | fix now | rafi | `src/features/lessons/`, handoff 🪦 |
| FND-06 | Landing sells game time; `/play` is "coming soon" and a child already lost points | product/marketing | High | Measured | S | fix now (copy) | rafi | `w-review-site/app/radlic/page.tsx:60`, `src/app/play/page.tsx:3-5` |
| FND-07 | Landing claims "KG to 8" and teacher rosters; main ships 3–8 and rosters are paused | marketing/consumer-protection | Medium | Measured | S | fix now | rafi | `w-review-site/app/radlic/page.tsx`, `docs/new-flow/curriculum.md`, `src/features/classes/Classes.tsx` |
| FND-08 | 282 topics, 6,639 clips, all ladders never read/heard by a human; answer keys are AI-vs-AI | content quality | High | Measured | L | after beta (sample of 36 in 30 days) | rafi | `docs/new-flow/curriculum.md`, `docs/new-flow/README.md`, `public/audio/` |
| FND-09 | Teacher channel frozen until a school-consent route exists | distribution/legal | High | Measured | L | after beta — needs attorney A3 | rafi | `docs/legal/ATTORNEY-PACKET.md` A3, `src/__tests__/rosterPaused.test.ts` |
| FND-10 | Billing never exercised with money; ARL auto-renewal consent missing; Vercel Hobby | money/legal | High | Measured | M | before first payment | rafi | `src/app/legal/registry.ts:125`, `src/core/billing.ts`, `docs/legal/READINESS.md` §3 |
| FND-11 | Consent is email-dependent and has failed silently once (Resend 401 on B3 cancel); quotas unmeasured | ops/COPPA | High | Measured | S | fix now (retry + alert are already listed) | own | `docs/legal/READINESS.md` "To build", `vercel.json:9` |
| FND-12 | Pivot cadence without a deciding metric (~5 re-foundings in 4 months; new surfaces started in the beta week) | strategy | High | Measured | S | fix now (freeze list) | rafi | `handoff.md` |
| FND-13 | No support process: support log empty since 2026-07-27; support mailbox may not exist | ops | Medium | Measured | S | fix now | rafi | `docs/support-log.md` |
| FND-14 | Curriculum provenance: titles from school PDFs / photographed textbook contents page | IP | Medium | Suspected | S | after beta — attorney question | rafi | `docs/new-flow/curriculum.md`, handoff 🔢 |
| FND-15 | Deletion audit trail missing (~1,440 rows deleted untracked) | compliance | Medium | Measured | M | after beta, before 1,000 | own | `docs/legal/READINESS.md` "To build" |
| FND-16 | In-memory per-instance rate limiter is decorative at scale | tech | Low | Suspected | S | later — fine at beta size | own | `src/app/api/_rateLimit.ts:17` |
| FND-17 | 296 MB of audio in git; every reword needs an agent-run Kaggle render | ops/content | Low | Measured | M | later | rafi | `public/audio/` |
