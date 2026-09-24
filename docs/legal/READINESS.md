# Launch readiness — the one checklist

**Updated 24 September 2026, at the end of Round 1.** "Launch" means **the first real family**, and separately
**the first payment**. Every line says where its proof lives. **Prefer re-measuring to trusting this file:**
`npx vitest run src/__tests__/legalSwitch.test.ts` prints every legal page's refusals,
`placeholderAudit.test.ts` holds `PLACEHOLDERS.md` to the documents, and `LOOP-STATE.md` has each proof. A line
here is true on the day it was written and on no other day.

**Today: not launchable, by design.** Every `/legal/*` page is dark, and every account on production is a
team/intern test account (the founder's statement; the database cannot tell). **No real family is invited until
every box marked 👪 is ticked.** Boxes marked 💳 must be ticked **before any payment**.

---

## 1. Done and proven (on production unless marked)

- [x] **Consent gate live, zero exemptions**: `learners.consent_id` NOT NULL, gate on 14 child tables (D4, D6 proofs)
- [x] **Email-plus consent** end to end from `noreply@radlor.com` (D4, and after D6)
- [x] **Delete one child**: every row + the child's login gone, sibling untouched (D5, real rows)
- [x] **Crash records cascade with the child**: 0 orphans (D4/D6)
- [x] **Nightly encrypted backup** running unattended; restore proven (32 tables / 968 rows) (#40–#42)
- [x] **No third-party tracking in a child's session**: one origin; CSP `connect-src` limited (23 Sep audit)
- [x] **Legal surface**: 7 pages routed, dark, `noindex`, linked from every collection point; the publish switch refuses each page for placeholders / draft / sign-off / Spanish (`legalSwitch`, `legalSurface`)
- [x] **Teacher roster paused** until school consent exists (live since D4)
- [x] **Secret scanning + push protection on**; **org 2FA required** (measured 24 Sep)
- [x] **Round 1, proven in code (not yet merged)**: see section 2. Every PR has tests that went red on a planted break, plus green CI.

## 2. Built, waiting for a Round-2 step (ROUND-2.md §1–§2)

| | item | PR | Round-2 step |
|---|---|---|---|
| [ ] 👪 | Returning parents get the new bundle after a deploy (R1) | #185 | merge A3; check 2.2 |
| [ ] 👪 | The notice says what is stored: lessons + grade band, `notice-v4` (R2) | #186 | merge A5; check 2.1 |
| [ ] 👪 | Scheduled B3 cancelled on **every** path; outcome recorded; daily backstop (R3) | #192 | Phase B3 + proof 2.7 |
| [ ] 💳 | In-app **Cancel subscription**, confirmation screen + email (R4) | #188 | merge A8; real Stripe test-mode run (Round 3) |
| [ ] 👪 | Correct name, **avatar**, grade band in the app (R5) | #191 | merge A6; check 2.3 |
| [ ] 💳 | Email suppression list + one-click unsubscribe (R6) | #197 | Phase B2 + proof 2.6 |
| [ ] 👪 | Withdrawal + export proven end to end in code (R7) | #189 | **production run 2.5** (neither has run on production yet) |
| [ ] 👪 | Doc 06 + Terms describe per-child withdrawal (R8) | #195 | merge A7 |
| [ ] 👪 | Unconfirmed accounts pruned after 3 days; profile only on confirmation (R9) | #194 | Phase B1 + proof |
| [ ] | One-shot ledger repair removed (R10) | #196 | merge A4 |
| [ ] 👪 | Every placeholder tracked and guarded (R11) | #199 | approve ROUND-2 §6 |
| [ ] 👪 | Spanish drafts, unrenderable until signed (R13) | #190 | merge C1; review job below |
| [ ] 👪 | Staging prepared: seed, runbook, `deploy.yml` staging-first tested (R14) | #193 | **create staging** (ROUND-2 §4.6) |
| [ ] | CI `rls-tests` independent of ghcr.io rate limits | #198 | merge A1 |

## 3. Waiting on Rafi, the attorney, a provider, or a reviewer

### Rafi (ROUND-2 §3; placeholders in `PLACEHOLDERS.md`, category *rafi* = 27, *date* = 12)
- [ ] 💳 **Vercel Hobby → Pro** before taking payment (3.14)
- [ ] 👪 **Staging database** before the first real family (3.20, §4.6)
- [ ] 👪 **A second GitHub owner**: the org has 1 member, the only admin and the only `production-db` approver (3.15)
- [ ] 👪 **Rakif's full name** (docs 04, 05, 07) (3.16)
- [ ] 💳 **Prices** (monthly, annual; must equal `LADDER`), plan names, the receipt-email design (3.17)
- [ ] 💳 **Subscription consequence of withdrawal** (3.1, with the attorney)
- [ ] 💳 **An affirmative auto-renewal consent control at checkout**; none is built (3.7, with the attorney)
- [ ] 💳 Hide checkout for a parent who already subscribes (3.8)
- [ ] 👪 **The live Spanish consent text**: show English until reviewed? (3.2)
- [ ] 👪 Close the `learners: delete` REST bypass (3.9)
- [ ] 👪 DMCA agent; the real content-review process to describe (3.18)
- [ ] 👪 Decisions 3.3–3.6, 3.10–3.13, 3.19
- [ ] 👪 **Publication dates** (12 *date* rows) and the day-of checks: doc 02's version label = `NOTICE_VERSION`; doc 11's security paragraph against doc 05
- [ ] 👪 Observe the signed-in storage keys in a real session (doc 08: 8 rows are read from the code)
- [ ] 👪 **Terms §6's "every table holding a child's data is named"** is not gated against `docs/legal/12` (its old gate was bound to the deleted in-app Terms, item 4). Check it against the catalog's child tables (R7's test derives the set) before publication

### The attorney (`ATTORNEY-PACKET.md`; *attorney* = 15 placeholders)
- [ ] 👪 **Sign-off on every page, and on its public boundary**
- [ ] 👪 Withdrawal scope: per-child vs whole account (A1)
- [ ] 👪 Consent-record retention; closing an account deletes the consent records (A2)
- [ ] 👪 School/teacher consent. The roster stays paused until then (A3)
- [ ] 👪 Email-plus availability and the 24 h delay (A4)
- [ ] 💳 ARL / ROSCA: renewal consent control, cancellation email content, refund stance (C1–C5)
- [ ] 👪 Arbitration; liability floor; AI-content ownership; DMCA; which document controls; notice periods (D1–D9)
- [ ] 👪 The Spanish standard (A7)

### Providers (ROUND-2 §4)
- [ ] 👪 Supabase: encryption at rest (in writing); platform-log retention; free-tier staging limits
- [ ] 👪 Vercel: log retention; function region; daily cron on Hobby
- [ ] 💳 Stripe: receipts on/off; data region; a test-mode key for a Preview run of R4
- [ ] 👪 Resend: data region; DKIM covers `List-Unsubscribe`; cancel semantics
- [ ] 👪 GitHub: backup-artifact storage and retention

### Spanish reviewer (ROUND-2 §3, the review job)
- [ ] 👪 About 10,500 words of legal pages (`docs/legal/es/`) + 104 consent strings. Sign with `REVIEWED-BY: <Full Name>, <YYYY-MM-DD>`.

### To build (launch blockers found after Round 1)
- [ ] 👪 **B3 cancel: retry refused rows in the daily cron + make a refused cancel visible (error log + SQL check).** Found 24 Sep: sending-only Resend key caused silent 401s.

### Publish
- [ ] 👪 **Publish the legal pages.** For each page in `src/app/legal/registry.ts`: 0 placeholders in its public part, the `STATUS: DRAFT` line removed, attorney sign-off recorded, and Spanish signed. Then set `published: true` in a reviewed PR. The switch refuses anything short of that. Flip `BILLING_LIVE` only when billing is live (💳).

## 4. Pages at a glance (placeholders in the whole file, after every Round-1 PR)

| page | route | placeholders | also blocked by |
|---|---|---|---|
| Privacy Policy (11) | `/legal/privacy` | 8 (1 is the rule's own text) | attorney, dates, providers, Spanish |
| Terms of Service (12) | `/legal/terms` | 13 (1 is the rule's own text) | attorney (arbitration, liability, AI, DMCA), dates, Spanish |
| Refund and Cancellation (01) | `/legal/refunds` | 5 (1 is the rule's own text) | prices, dates, `BILLING_LIVE`, attorney, Spanish |
| Your rights as a parent (06 A) | `/legal/parent-rights` | 3 | subscription-on-withdrawal decision, date, attorney, Spanish |
| Subprocessors (07) | `/legal/subprocessors` | 6 | provider regions, name, attorney, Spanish |
| Cookies (08) | `/legal/cookies` | 3 | observe storage, date, attorney, Spanish |
| Retention (04) | `/legal/retention` | 7 | provider logs, consent-record retention, attorney, Spanish |
