# Round 2 — everything that needs Rafi, in order

Prepared 24 September 2026 at the end of Round 1 (the proofs are in `LOOP-STATE.md` → "Round 1").
Round 1 touched nothing on production and merged nothing. This file is the only list you need. Work it top to
bottom: **§1 merges → §2 production checks → §3 decisions → §4 providers → §5 attorney → §6 approve the replaced
placeholders.**

**Rules carried over from the deploy loop:** production is read only through SQL you run in the Supabase SQL
editor. It changes only through `deploy.yml`'s `migrate-prod` behind the `production-db` approval. **Approve
`production-db` only after the Backup run has finished**, because D6's backup was pre-D6 by 23 seconds. Never
run `supabase link` or `supabase db …` from a laptop (`CLAUDE.md`).

---

## 1. Pull requests to merge, in this order

Every PR had green CI (`verify` + `rls-tests` + Vercel) when Round 1 ended. Several PRs are **stacked**: until
their base merges, their diff also shows the base's commits. Merge in this order and each diff shrinks to its
own. Use **"Create a merge commit"**, not squash: the stacks rely on it. Merging to `main` deploys the app
(Vercel) immediately.

### Phase A — code and docs, no migration

| # | PR | what it does | after merging, check |
|---|---|---|---|
| A1 | [#198](https://github.com/RadlorInc/learn/pull/198) | CI: `rls-tests` pulls Postgres from `public.ecr.aws`. On 23 Sep, ghcr.io refused every pull for hours. Every Round-1 branch already carries this commit. | Nothing to check. It keeps future PRs green. |
| A2 | [#187](https://github.com/RadlorInc/learn/pull/187) | D7 records that never reached `main`: dated notes in docs 04/05/06/16, READINESS, LOOP-STATE | Nothing. Docs only. |
| A3 | [#185](https://github.com/RadlorInc/learn/pull/185) | **R1** — service worker: pages are network-first, so a returning parent gets the new bundle; offline still works. `sw.js` → **v230** | In a browser that has used the app before, open `/parent`. DevTools → Application → Service Workers shows `sw.js` v230. After the **next** deploy, the first load serves the new bundle (this deploy itself still gives one stale load: the old worker serves it). |
| A4 | [#196](https://github.com/RadlorInc/learn/pull/196) | **R10** — deletes `ledger-repair.yml` + `scripts/ledger-repair.sh` (ran once: run 35868772500) | Actions no longer lists "ledger repair". |
| A5 | [#186](https://github.com/RadlorInc/learn/pull/186) | **R2** — the notice, B1, B3, Privacy Policy and add-a-child line say "the lessons you choose and a **grade band** (3–5 / 6–8, stored as the age range 9–11 / 12–14)", not "grade level". **`notice-v4`** | Add a child → the notice's table row says "grade band". Then run SQL **2.1**. |
| A6 | [#191](https://github.com/RadlorInc/learn/pull/191) | **R5** — Correct *name*'s details: name, **avatar**, **grade band**. Docs 06 §2 and 11 §5 name the in-app path | A child's card → Login & data → the card shows 4 avatars and "Grades 3–5 / Grades 6–8". Change the avatar → it changes on the card. |
| A7 | [#195](https://github.com/RadlorInc/learn/pull/195) | **R8** — doc 06 + Terms say withdrawal deletes **that child only** and the account stays open. Subscription-on-withdrawal becomes a marked open item. *(on #187)* | Docs only. |
| A8 | [#188](https://github.com/RadlorInc/learn/pull/188) | **R4** — Account → Plan & billing → See plans → **Cancel subscription** (confirm screen, Stripe `cancel_at_period_end`, confirmation email). Docs 01 §4 + 12 §5 | With billing off, the plan page shows no cancel button, and the route answers "no subscription". See **2.4**. |
| A9 | [#189](https://github.com/RadlorInc/learn/pull/189) | **R7** — end-to-end tests: withdrawal via the email link, and export with a second family as the control | Tests only. Then run the production check **2.5**. |
| A10 | [#193](https://github.com/RadlorInc/learn/pull/193) | **R14** — staging seed (fake data, refuses production), `docs/staging.md`, a test of `deploy.yml`'s staging-first path | Nothing on production. Create staging when ready (§4.6). |

### Phase B — migrations. One PR at a time: before → merge → backup → approve → proof

Each of these makes `migrate-prod` wait for `production-db`. **For each PR:** (1) run its "before" SQL and write
down the numbers; (2) merge; (3) Actions → **Backup (prod database)** → Run workflow; wait until it is **green,
finished, and its artifact is listed**; (4) only then approve `production-db` on the waiting **Deploy** run and
check that the "Applying migration" lines name **only** that PR's files; (5) run its proof SQL; (6) do the in-app
check. Do not start the next PR until the proof passes.

| # | PR | migration(s) | before SQL | proof SQL | in-app check |
|---|---|---|---|---|---|
| B1 | [#194](https://github.com/RadlorInc/learn/pull/194) **R9** — profile only on email confirmation; prune unconfirmed accounts with no child after 3 days (daily 03:37 UTC + a one-time sweep) | `20260923180000`, `20260923180100` | `docs/legal/sql/r9-prune-before.sql` (row 1 = accounts the sweep deletes; **stop if larger than you expect**) | `docs/legal/sql/r9-prune-proof.sql`: 11 rows. Rows 1–8 and 11 PASS; row 9 = before row 2; row 10 = before row 4 | Sign up with a new email and **don't** confirm → 0 profile rows. Click the link → 1 profile row, and the role picker appears. ⚠️ The sweep can only be undone from the backup. |
| B2 | [#197](https://github.com/RadlorInc/learn/pull/197) **R6** — email suppression list + one-click unsubscribe *(stacked on #188)* | `20260923190000` | — | **2.6** | Nothing visible: no commercial email exists. |
| B3 | [#192](https://github.com/RadlorInc/learn/pull/192) **R3** — cancel the scheduled B3 on **every** path (dashboard delete, account close, withdrawal); outcome recorded; daily Vercel cron backstop *(stacked on #197)* | `20260923200000` | — | **2.7** A–F | 2.5 exercises it. Also run 2.7 E after a dashboard delete of a fresh test child. |

### Phase C — docs stacked on everything above

| # | PR | what | after |
|---|---|---|---|
| C1 | [#190](https://github.com/RadlorInc/learn/pull/190) | **R13** — Spanish drafts of the 7 public pages, which **cannot render until `REVIEWED-BY:` names a person and date** *(on #187, #186, #188, #191, #195, #194)* | Nothing renders; every page stays dark. |
| C2 | [#199](https://github.com/RadlorInc/learn/pull/199) | **R11** — `PLACEHOLDERS.md`, all 66 remaining placeholders, guarded; 5 resolved; doc 08 storage rows *(on #190, #192)* | Approve §6 first. |
| C3 | [#200](https://github.com/RadlorInc/learn/pull/200) | **R12** attorney packet, **R15** READINESS checklist, this file, LOOP-STATE "Round 1" *(on #187)* | — |

---

## 2. Production checks (read-only SQL in the SQL editor; clicks on a **test** account)

**2.1 — R2, after A5.** New consents record `notice-v4`:
```sql
select notice_version, count(*), max(created_at) from public.parental_consents
where created_at > now() - interval '1 day' group by 1 order by 3 desc;
```
Expected: any consent requested after the deploy reads `notice-v4`. A browser still on the old bundle gets "please
reload and read it again" (409 `stale_notice`), by design.

**2.2 — R1, after A3.** No SQL. `https://adaptivelearn.radlor.com/sw.js` contains `const VERSION      = 'v230'`.

**2.3 — R5, after A6.** Change a test child's avatar in the app, then:
```sql
select id, display_name, avatar_index, age_group from public.learners where id = '<TEST_CHILD_ID>';
```
Expected: the new `avatar_index`. If you picked a band, `age_group` is `9-11` or `12-14`.

**2.4 — R4, after A8 (billing off).** Sign in as a test parent → Account → Plan & billing → See plans. Expected: no
"Your subscription" card and no cancel button, and nothing breaks. A real cancel cannot be exercised until billing
runs in Stripe test mode on a Preview deployment. That is a Round-3 step, since no Stripe test key exists here.

**2.5 — R7 (withdrawal + export, never yet run on production).** Use a test parent whose inbox you can read.
1. Add a child named `R7 Test` → continue past the notice → B1 arrives from `noreply@radlor.com` → **I give permission** → finish creating the child.
2. Child → Login & data → **Set a login**. Sign in as the child and finish one lesson and a few practice questions. Tap "Didn't get it?" once if you can.
3. Read the consent and the child's rows (replace the placeholders):
```sql
select c.id consent_id, c.state, c.learner_id, c.second_email_provider_id, c.second_notice_scheduled_for, c.withdrawn_at
from public.parental_consents c join auth.users u on u.id = c.parent_id
where u.email = '<test parent email>' order by c.created_at desc limit 1;

select 'learners' t, count(*) from public.learners where id = '<CHILD_ID>'
union all select 'learner_access', count(*) from public.learner_access where learner_id = '<CHILD_ID>'
union all select 'lesson_progress', count(*) from public.lesson_progress where learner_id = '<CHILD_ID>'
union all select 'point_events', count(*) from public.point_events where learner_id = '<CHILD_ID>'
union all select 'learner_stats', count(*) from public.learner_stats where learner_id = '<CHILD_ID>'
union all select 'learner_events', count(*) from public.learner_events where learner_id = '<CHILD_ID>'
union all select 'lesson_feedback', count(*) from public.lesson_feedback where learner_id = '<CHILD_ID>'
union all select 'game_settings', count(*) from public.game_settings where learner_id = '<CHILD_ID>'
union all select 'error_events', count(*) from public.error_events where learner_id = '<CHILD_ID>'
union all select 'exercise_results', count(*) from public.exercise_results where learner_id = '<CHILD_ID>';
select la.parent_id as child_login_id from public.learner_access la where la.learner_id = '<CHILD_ID>' and la.access_role = 'self';
select count(*) as all_children from public.learners;
```
Expected: `granted`, `learner_id` = the child, the B3 id filled, the B3 due about 24 h later. `learners`, `learner_access` (2), `learner_stats`, `game_settings`, `lesson_progress`, `point_events` and `learner_events` are all > 0. Note `child_login_id` and `all_children`.
4. **Export:** Login & data → ⬇ **Download a copy**. The file has `completeness` `{"complete": true, "notes": []}`. The lengths of `lessonProgress`, `points`, `activityEvents`, `lessonFeedback` and `crashRecords` match step 3. `adultsWithAccess` has 2 entries. Searching the file for another child's name or id, or for any `@`, finds nothing.
5. **Resend:** Emails → "Confirming the permission you gave for your child's account" shows **Scheduled**, and its id equals `second_email_provider_id`.
6. **Withdraw through B3's own link.** Open the scheduled B3 in Resend and use its "click here". Equivalently, take B1's link and change `/consent/respond#t=` to `/consent/withdraw#t=`, keeping the token. The page names R7 Test → **Withdraw permission and delete my child's data** → "Permission withdrawn".
7. Re-run step 3. Expected: every count 0. The consent `withdrawn`, `learner_id` null, `withdrawn_at` set, and the row still present. `select count(*) from auth.users where id = '<child_login_id>'` → 0. `all_children` exactly 1 lower. In Resend the B3 shows **Canceled**.

**2.6 — R6, after B2.**
```sql
select c.relrowsecurity, (select count(*) from pg_policy p where p.polrelid=c.oid) policies, c.relacl
from pg_class c where c.oid='public.email_suppressions'::regclass;
select grantee, privilege_type from information_schema.role_table_grants
where table_schema='public' and table_name='email_suppressions' order by 1,2;
```
Expected: RLS `t`, `policies = 0`, grantees only `postgres` and `service_role`.

**2.7 — R3, after B3.**
```sql
-- A. locked down (expect: t | 0 | f | f)
select c.relrowsecurity, (select count(*) from pg_policy p where p.polrelid=c.oid) policies,
       has_table_privilege('anon',c.oid,'SELECT') anon, has_table_privilege('authenticated',c.oid,'SELECT') authd
from pg_class c where c.oid = 'public.consent_b3_cancellations'::regclass;
-- B. functions (expect: consent_queue_b3_cancel definer=t; all pinned; anon=f authd=f; svc=t on the two RPCs)
select p.proname, p.prosecdef, p.proconfig, has_function_privilege('anon',p.oid,'EXECUTE') anon,
       has_function_privilege('authenticated',p.oid,'EXECUTE') authd, has_function_privilege('service_role',p.oid,'EXECUTE') svc
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in ('consent_queue_b3_cancel','consent_b3_due','consent_b3_record');
-- C. trigger (expect 1 row, AFTER DELETE OR UPDATE OF state)
select pg_get_triggerdef(oid) from pg_trigger where tgrelid='public.parental_consents'::regclass and tgname='trg_consent_queue_b3_cancel';
-- D. the queue
select provider_id, consent_id, scheduled_for, queued_because, attempted_at, cancel_result
from public.consent_b3_cancellations order by queued_at;
-- E. an ended consent with a future B3 not settled (expect 0 rows once a drain has run)
select c.id, c.state, c.second_email_provider_id, c.second_notice_scheduled_for, q.cancel_result
from public.parental_consents c left join public.consent_b3_cancellations q on q.provider_id = c.second_email_provider_id
where c.state <> 'granted' and c.second_email_provider_id is not null and c.second_notice_scheduled_for > now()
  and (q.cancel_result is null or q.cancel_result like 'error:%');
-- F. failed cancels waiting for a retry (expect 0 rows)
select * from public.consent_b3_cancellations where cancel_result like 'error:%';
```
Closed accounts leave no consent rows; their outcomes are in D (`queued_because = 'deleted'`). Also confirm in the
Vercel dashboard → the project → Settings → Cron Jobs that the cron `/api/consent/cancel-second-notice` (daily
06:23 UTC) is listed.

**2.8 — R13, any time.** Consents already given in Spanish, against unreviewed text:
```sql
select state, count(*) from public.parental_consents where lang = 'es' group by 1;
```
Expected: 0 rows, or a few to re-ask once the Spanish is reviewed (decision 3.2).

**2.9 — `RESEND_API_KEY` on the running Production deployment** (R3, R4 and consent all use it): Vercel → Deployments
→ the current Production deployment → confirm the variable is present. A name check only; never reveal the value.

---

## 3. Decisions only you can make (each with my recommendation)

| # | question | recommendation |
|---|---|---|
| 3.1 | **Subscription on withdrawal** (the new placeholder in docs 06 §4 and 12 §4): does withdrawing consent for one child cancel or reduce the subscription, and is anything refunded? | Reduce the seat count by one, pro-rata credit; cancel only if no child remains. Decide with the attorney (packet C4) **before billing goes live**. |
| 3.2 | **The Spanish consent flow is live and unreviewed.** A parent on Español sees the notice, B1, B3 and the consent screens in machine-translated Spanish. | Show **English** to Spanish-language parents until a reviewer signs (a small PR), then switch back. Run 2.8 first. |
| 3.3 | After a cancelled subscription's period ends, **does the account stay open?** R4 changed doc 01 to "stays open" (matching §8 and the Terms). | Yes, keep it open. |
| 3.4 | **Retention of `consent_b3_cancellations`** (R3): today indefinite, with no child data in it. | Delete each row 30 days after its B3 was due. |
| 3.5 | **The suppression list survives account deletion** (R6), so a re-signup gets no marketing. Say so in doc 04? | Yes. Add a doc 04 row: "email suppression list — kept until the person asks to be removed". |
| 3.6 | Doc 09 §4's footer has **"Manage your email preferences"**, but no such page exists. | Drop the line from §4 (R6 already leaves it out of the footer). |
| 3.7 | **Checkout has no affirmative auto-renewal consent control.** It shows the price, "renewing until you cancel" and links, but doc 03 A1's checkbox was never built. | Build a separate, unticked "I agree it renews until I cancel" control before the first payment, worded by the attorney (packet C1). |
| 3.8 | **Double subscription:** the plan page still offers **Continue** to a parent with an active subscription (R4 finding). | A follow-up PR hides checkout when a subscription is active. |
| 3.9 | **An owner can `delete from learners` directly over REST** (the `learners: delete` RLS policy). That bypasses `delete_child_data`, so the consent stays `granted`, reusable, and B3 is not cancelled (R3 finding). | A follow-up migration drops that policy; the app already deletes through `delete_learner`. |
| 3.10 | `sw-register.js` sends `CACHE_URLS`, which `sw.js` never handles (dead pre-cache, R1 finding). | Remove the dead message. |
| 3.11 | One clause of `deploy.yml`'s `migrate-prod` condition (`&& vars.STAGING_PROJECT_REF == ''`) can never change the outcome today (R14 found it with a planted break). It is your D1 wording. | Leave it (harmless), or delete it. Your call. |
| 3.12 | Doc 02's header says **"Version: v1"**; the build records **`notice-v4`**. Doc 02's rights list also omits **Correct**, which now exists in the app. | On publication day: set the header to the `NOTICE_VERSION` in force. Add "Correct" with the next notice version. |
| 3.13 | The unsubscribe page copy (R6), and the two earlier PROPOSED strings (dark-page banner, `copy.ts` PROPOSED block). | Approve or reword. |
| 3.14 | **Before taking any payment:** Vercel Hobby → **Pro** (the Git integration needs the repo public on Hobby; a commercial product needs Pro). | Upgrade before the first real charge. |
| 3.15 | **A second GitHub owner** on `RadlorInc`. Measured 24 Sep: the org has **1 member, who is its only admin**, and is the only reviewer who can approve `production-db`. Losing that account locks production migrations and the repo. (Org 2FA is now **required**, measured; the handoff said otherwise.) | Add a second owner you trust, with 2FA. |
| 3.16 | **Rakif's full name** for docs 04, 05 and 07 (owner/reviewer lines). | Supply it. |
| 3.17 | **Prices** (docs 01 and 03; must equal `LADDER` in `src/core/billing.ts`), plan names, and receipt-email design (03 §receipt). | Supply them. |
| 3.18 | **The DMCA agent's details** (Terms §14), and the real **content-review process** to describe (Terms §8: nothing more than what is actually done; much of Grades 6–8 has not been read by a human). | Supply them. |
| 3.19 | The ~1,440 event rows that left the database by an unknown route: add a **deletion audit trail**? (doc 04) | Yes, a small trigger-based log, but after launch. |
| 3.20 | **Staging before the first real family** (prepared in R14; steps in §4.6). | Create it. It costs nothing. |
| 3.21 | **Staff the jobs:** a Spanish reviewer (below) and the attorney (§5). | — |

All remaining placeholders owned by you are in `PLACEHOLDERS.md` (category **rafi**, 27 rows, and **date**, 12 rows,
set on publication day).

**The Spanish review job (R13).** About 10,500 words of legal pages plus 1,450 words of consent copy:
- **Legal pages:** 11 privacy (~2,130 words), 12 terms (~2,200), 04 retention (~1,520), 01 refunds (~1,100), 07 subprocessors (~920), 08 cookies (~680), 06 parent rights (~510). Each is in `docs/legal/es/`, read against the English public part.
- **Consent copy:** 104 EN/ES pairs. Print them with `npx tsx scripts/consent-es-sheet.mts > consent-es-review.md`.
- **What the reviewer signs:** that the Spanish means the same as the English.
- **How they sign:** in each reviewed file, set `REVIEWED-BY: <Full Name>, <YYYY-MM-DD>` in a reviewed PR. That clears only the Spanish refusal for that page.
- **Not built yet:** tying a signature to the exact English version, and recording a review of the consent copy.

---

## 4. Provider confirmations — what to ask, and where the answer goes

| provider | ask | answer goes to |
|---|---|---|
| **Supabase** | (a) Written confirmation of **encryption at rest** for our project. (b) **Retention of platform logs** (API/auth: IP, user agent, geo), and whether it can be shortened. (c) Free-tier limits for a staging org: **2 active projects? pause after ~7 days idle?** | (a) doc 05 row "Encryption at rest"; (b) doc 04 §"provider logs" and doc 11 §9; (c) `docs/staging.md` |
| **Vercel** | (a) **Log retention** on our plan (request + function logs). (b) **Function region** (dashboard; the repo says iad1). (c) That the Hobby plan runs our **daily cron**. (d) Pro pricing/terms (3.14). | doc 04 "Hosting request and console logs"; doc 07 Vercel row; doc 11 hosting region |
| **Stripe** | (a) Are **email receipts** turned on (Dashboard → Settings → Emails)? (b) **Data region.** (c) A **test-mode** secret key in a Preview environment only, to exercise R4 for real. | doc 09 §8 inventory; doc 07 Stripe row; Round-3 test |
| **Resend** | (a) **Data region.** (b) Does its DKIM signature cover the `List-Unsubscribe` headers (RFC 8058)? (c) What its API returns when cancelling an email already sent or already cancelled (R3 records it as `refused`). | doc 07 Resend row; doc 09 §7 |
| **GitHub** | Where Actions **artifacts** (the encrypted nightly backup) are stored, and their retention. | doc 07 backup row |
| **Supabase (auth)** | The current **Auth email templates** (confirmation, reset, invite): the text lives in the dashboard, not the repo. | doc 09 §8 (confirm all transactional) |

**4.6 — Creating staging** (prepared in R14; the full text is in `docs/staging.md`). First confirm on Supabase's
pricing page: 2 active free projects per organisation, and pausing after ~7 days idle. A paused staging project
makes `migrate-staging` fail, **which blocks every production migration** until you restore it.
1. supabase.com/dashboard → account menu → **New organization**: `Radlor Staging`, plan **Free**.
2. **New project** `adaptivelearn-staging`, a strong DB password (keep it in your password manager), region **East US (North Virginia) `us-east-1`**.
3. Project Settings → General → **Reference ID**. That is the staging ref. Check that it is **not** production's ref (the literal in `scripts/assert-prod-ref.sh`).
4. **In the staging project only:** SQL Editor → paste all of `supabase/schema/baseline_schema.sql` → Run. Never run it on production. If it refuses to create its trigger on `auth.users`, stop and ask.
5. Authentication → URL Configuration: Site URL `http://localhost:3000`, and redirect `http://localhost:3000/**`.
6. GitHub → Settings → Secrets and variables → Actions:
   - **Variables:** `STAGING_PROJECT_REF` = the staging ref. It must be a *repository* variable.
   - **Environments → `staging`:** secret `STAGING_DB_PASSWORD`, and optionally `STAGING_DB_URL` (the session pooler URI).
   - Confirm the `SUPABASE_ACCESS_TOKEN` user is a member of the staging organisation.
7. The next merge to `main` runs `migrate-staging`. From then on every production migration waits for staging to succeed first.
8. Seed it: `STAGING_PROJECT_REF=<ref> STAGING_SUPABASE_URL=https://<ref>.supabase.co STAGING_SERVICE_ROLE_KEY=<staging key> SEED_PASSWORD=<12+ chars> node scripts/seed-staging.mjs`. It refuses production and needs an explicit staging ref.
9. Point a local checkout at staging instead of production (today `.env.local` files point at production): follow `docs/staging.md` §3.
10. **Teardown:** delete the `STAGING_PROJECT_REF` variable **first**, then the project.

---

## 5. The attorney

Send **`docs/legal/ATTORNEY-PACKET.md`**: every open legal question, grouped by topic, each with what the product
does today, what the draft says, and the decision needed. It takes about 20 minutes to read. The attorney's answers
resolve the 15 **attorney** rows in `PLACEHOLDERS.md` and the sign-off each page needs. **They sign off each page's
public boundary** (what part of the document the page shows), not just its text.

---

## 6. Placeholders replaced in Round 1 — for your approval

Rule 6: each replaced placeholder said it was blocked on something now built and proven, or on a fact measurable
from the repository. Approve or reject each; a rejected one is restored in a follow-up PR.

| # | where | before | after | evidence |
|---|---|---|---|---|
| 1 | doc 01 §4 (R4, #188) | `**Online, in the app:** [PLACEHOLDER — there is no in-app cancellation today. A cancel path must exist before this policy is published: … Fill this in with the real path once it is built.]` | `**Online, in the app:** sign in, open **Account → Plan & billing → See plans**, choose **Cancel subscription** under *Your subscription*, then **Yes, cancel my subscription**. The screen then shows the date your plan ends, and we email you a confirmation with that date.` | `billingCancel.test.ts` 8/8, 6 breaks caught |
| 2 | doc 06 §2 (R5, #191) | `**Email us at support@radlor.com and we will correct it.** The app does not yet let you edit a child's name or grade yourself. [PLACEHOLDER — replace this with the in-app path once an edit function exists.]` | `**In the app:** parent dashboard → your child's card → **Login & data** → **Correct *name*'s details**. There you can change your child's name or nickname, their avatar, and their grade band (grades 3–5 or grades 6–8). Only the adult who added the child can make this change. **Or email us** at support@radlor.com and we will correct it for you.` | `childCorrect` + `parentRights`, 3 breaks |
| 3 | doc 11 §5 (R5, #191) | `**One thing we cannot yet do in the app:** correct a child's name or grade. Email us and we will do it for you. [PLACEHOLDER — remove this paragraph once an edit function exists.]` | *(paragraph removed, as it instructed; "How to ask" now names correcting in the app)* | same |
| 4 | doc 09 §7 (R6, #197) | `**Resend delivers every email**, configured as the SMTP relay …, so the suppression list belongs there. [PLACEHOLDER — no suppression list or unsubscribe mechanism exists yet, because only authentication emails are sent today and those are transactional. It must be built before the first commercial email, not after.] Before any send …` | `**Resend delivers every email**: the authentication emails through the authentication service's SMTP relay …, and the app's own emails through Resend's API from one function, sendEmail … A commercial send is checked against the suppression list … if the list cannot be read, nothing is sent … one-click unsubscribe link and the List-Unsubscribe headers (RFC 8058) … The link carries a random token, never the address … Transactional emails never read the list … **No commercial email is sent today** (see §8). Before any send …` (full text in the PR) | suppression tests, 7 breaks |
| 5 | doc 02 §rights (R11, #199) | `…delete your child's information. Your account stays open. [PLACEHOLDER — the earlier wording promised deletion here. The build stops collection but does not yet delete. Restore the promise once deletion is built; until then this line must not claim it.]` | `…delete your child's information. Your account stays open.` *(the promise was already restored in D1; only the stale note goes)* | `consentDeletion.test.ts`; R7 e2e; D5 on production rows |
| 6 | doc 03 checkout A1 (R11) | `You can cancel any time at [PLACEHOLDER — in-app path] or by emailing support@radlor.com.` | `You can cancel any time at **Account → Plan & billing** or by emailing support@radlor.com.` | R4 |
| 7 | doc 03 receipt (R11) | `**How to cancel:** sign in and go to [PLACEHOLDER — in-app path], or reply to this email.` | `**How to cancel:** sign in and go to **Account → Plan & billing → See plans → Cancel subscription**, or reply to this email.` | R4 |
| 8 | doc 03 withdrawal screen (R11, repo fact) | `…any other children on it are not affected. [PLACEHOLDER — this control's name must match the product exactly; check it on the day this ships, and keep them matching afterwards.]` | `…any other children on it are not affected.` | Since D1 that paragraph names no control; the buttons are held to `copy.ts` both ways by `consentCopy.test.ts` |
| 9 | doc 05 §consent gate (R11, repo fact) | `[PLACEHOLDER — decide before the migration is applied: clear the test data and drop the exemption, or keep it. If it is kept, record why, and record the date it will be removed.]` | `**Decided and done, 23 September 2026:** the test data was cleared and the exemption dropped — migration 20260923170000_consent_zero_exemptions.sql (deploy loop D6) …` | D6 proof on production |

**Added** (not replaced) in Round 1: 2 placeholders (R8) in doc 06 §4 and Terms §4 for the subscription consequence
of withdrawal (decision 3.1). They stand in for a refund promise that nothing builds. **Count: 73 → 66.**
