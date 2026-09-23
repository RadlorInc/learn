# Legal readiness — what stands between each document and "live"

Pages: as measured 2026-09-23. Flows: **updated 2026-09-23 after the deploy loop (D1–D6)** — see `LOOP-STATE.md` for each proof.
**Prefer re-measuring to trusting this table:** `npx vitest run src/__tests__/legalSwitch.test.ts` prints
every page's refusals, and `legalSurface.test.ts` holds the links. A row here is true on the day it was
written and on no other day.

**Nothing below is publishable.** Every page is refused by the switch for at least four independent
reasons (placeholders, the document's own `STATUS: DRAFT` line, no attorney sign-off recorded, no Spanish
version). "Content ready" is therefore **no** everywhere; the column says what else is missing.

## ⛔ Launch blocker — no real family until the legal pages can publish

**Founder's decision, 2026-09-23 (deploy loop).** The deploy loop ships the app with every `/legal/*` page
DARK (title + banner, no body) and every point of collection linking to them. That is accepted **only
because every account on production is a team or intern test account** (founder's statement, not a
measurement — the database cannot tell an intern from a parent). **No real family is invited until every
page a family can reach publishes** — i.e. until the switch above stops refusing them. Also owed before
the first real family: a **staging database** (`deploy.yml` applies production migrations without one
since D1; see `LOOP-STATE.md`), and the attorney's answer on withdrawal (doc 06 still says it closes the
whole account; the consent copy says it deletes the one child).

## Pages

| Document | Route built | Linked from | Content ready | Blocking on | Publishable? |
|---|---|---|---|---|---|
| Privacy Policy (11) | ✅ `/legal/privacy`, dark | home, sign-up, checkout, add-a-child, direct notice, B1, account, invites, support form, child home, teacher roster | ❌ 9 placeholders, `STATUS: DRAFT` | **attorney** — sign-off; consent-record retention period; review against the security program · **Rafi** — effective/updated dates; hosting region (Vercel dashboard); providers' log-retention periods; billing fields once billing is on · **drafter** — drop the "no edit function" paragraph (the edit now exists, item 7) · **Spanish reviewer** — no Spanish version exists | ❌ |
| Terms of Service (12) | ✅ `/legal/terms`, dark | home, sign-up, checkout | ❌ 12 placeholders, `STATUS: DRAFT` | **attorney** — arbitration and class-action waiver (a business decision); copyright position on AI-generated content; the deletion sentence; remedy for service failure; liability floor; two notice periods · **Rafi** — DMCA designated agent (name, address, email, phone, and US Copyright Office registration); description of the real content-review process; dates · **Spanish reviewer** | ❌ |
| Refund and Cancellation Policy (01) | ✅ `/legal/refunds`, dark | checkout | ❌ 6 placeholders, `STATUS: DRAFT` | **Rafi** — monthly and annual price (USD); dates · **billing (not this loop)** — there is no in-app cancel path, and the document says it must exist before publication; `BILLING_LIVE = false` · **attorney** — sign-off · **Spanish reviewer** | ❌ |
| Your rights as a parent (06 Part A) | ✅ `/legal/parent-rights`, dark | account, B3 | ❌ 3 placeholders, `STATUS: DRAFT` | **Rafi** — apply `20260923140000` then flip `WITHDRAWAL_DELETES` (deletion is built, not live); how exports are sent (method); date · **drafter** — replace "once an edit function exists" with the real path (Login & data → Correct *name*'s details) · **attorney** — sign-off; whether withdrawal closes the whole account (item 6) · **Spanish reviewer** | ❌ |
| Service Providers and Subprocessors (07) | ✅ `/legal/subprocessors`, dark | direct notice | ❌ 6 placeholders, `STATUS: DRAFT` | **Rafi** — regions and plan details from the Vercel and Supabase dashboards; confirm Preview/Development have no crash forwarding; the reviewer's name · **attorney** — sign-off · **Spanish reviewer** | ❌ |
| Cookie and Tracking Notice (08) | ✅ `/legal/cookies`, dark | nowhere yet (not required at a collection point; the Privacy Policy §8 is the natural link) | ❌ 3 placeholders, `STATUS: DRAFT` | **Rafi** — observe the signed-in storage keys in a real session (they were read from config); date · **attorney** — sign-off · **Spanish reviewer** | ❌ |
| Data Retention and Deletion Policy (04) | ✅ `/legal/retention` (**added — the brief listed six**), dark | direct notice | ❌ 7 placeholders, `STATUS: DRAFT` | **Rafi** — provider log retention (Supabase, Vercel); the ~1,440 events that left the database by an unknown route (whether to add a deletion audit trail); reviewer's name; date · **attorney** — retention for consent records (evidence about children) · **Spanish reviewer** | ❌ |

⚠️ **Public boundaries.** Each page shows only part of its document (`after`/`until` in
`src/app/legal/registry.ts`, set by engineering). The retention page's public part includes a paragraph
opening "Known defect — deletion is …". **The attorney signs off the boundary, not just the text.**

## Flows

| Flow | Built | Where | Content ready | Blocking on | Live? |
|---|---|---|---|---|---|
| Direct notice (02) | ✅ | Add a child → notice | ✅ copy = doc 02 (`notice-v3` since D1: withdrawal deletes that child, the account stays open), drift-checked both ways | **Spanish reviewer** — machine-translated, unreviewed · **attorney** — the notice links three dark pages; sign-off | ✅ **live 23 Sep** — shown on production in D4 and D6 (test accounts only; no real family until the pages publish) |
| Email-plus consent (B1 → grant → B2 → B3) | ✅ | `/api/consent/request`, `/consent/respond` | ✅ doc 03, rendered text checked | **attorney** — doc 03 Path B · ⚠️ **follow-up:** a scheduled B3 is cancelled ONLY by the email-link withdrawal — deleting the child in the dashboard or closing the account leaves it to arrive (LOOP-STATE, D6 pre-approval) | ✅ **live 23 Sep** — first B1 arrived from `noreply@radlor.com`; end-to-end creations in D4 and after D6; B3 scheduled with Resend, id stored |
| Withdrawal | ✅ deletes the child (item 6) | B3 → `/consent/withdraw` | ✅ copy now says what it does (D1) · ⚠️ doc 06 still says withdrawal closes the whole account | **attorney** — doc 06: close the account, or the child only | ✅ deployed · ⚪ **not yet exercised on production** (no withdraw link has been pressed there) |
| Deletion — one child | ✅ same set as withdrawal | Login & data → Delete *name*'s profile | ✅ | — | ✅ **live, proven on real rows** (D5: every row of the child and its login gone, a sibling untouched; the crash-record cascade proven by the catalog and D6, not by that deletion) |
| Deletion — everything | ✅ (existing) | Account → Close your account | ✅ | ⚠️ deletes the consent records (the evidence) and does not cancel a scheduled B3 | ✅ live |
| Parent data export | ✅ nine doc-06 tables | Login & data → Download a copy | ✅ | — | ✅ deployed, `export_child_records` applied (D4) · ⚪ not yet exercised on production |
| Profile correction (name, grade) | ✅ (item 7) | Login & data → Correct *name*'s details | ⚠️ the grade is stored only as a band — "grade level" in doc 02 overstates what is kept (follow-up 2) | **drafter/attorney** — word it as a band, or store the grade | ✅ deployed with D2 · ⚪ not exercised on production |
| Teacher / school consent | ❌ | Classes → Add students | — | **attorney** — the school-consent route | ⏸ **paused** — the roster says "Adding students is paused" (live since D4) |
| In-app cancellation | ❌ | — | — | **billing (not this loop)** | ❌ |

**The consent gate itself (not a row above):** ✅ **live on production since 23 September 2026 with zero exemptions** — on all 14 tables that hold a field about a child, and `learners.consent_id` NOT NULL, so no child can be stored without a consent record (D4 and D6 proofs, every check PASS).

## Open items that are not a row above

- **Terms §6's "every table holding a child's data is named"** used to be gated against the in-app Terms,
  which were deleted in item 4. It has **not** been re-anchored on `docs/legal/12`; the drafts' own text
  should be checked against the table list before publication.
- **The 26 existing children** are grandfathered by the consent migration. Item 1 found 12 are test
  profiles and 14 on 7 accounts are unresolved — **Rafi** to name those accounts; **attorney** to decide
  retroactive consent.
