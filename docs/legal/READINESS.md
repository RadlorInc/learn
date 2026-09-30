# Launch readiness — the one checklist

**Updated 28 September 2026** (docs rebuild: the Round-2 lists this file pointed at were deleted, so every open item
is written out here; before that 26 September, after the deep review). "Launch" means **the first real family**, and
separately **the first payment**. **Prefer re-measuring to trusting this file:**
`npx vitest run src/__tests__/legalSwitch.test.ts` prints every legal page's refusals,
`placeholderAudit.test.ts` holds `PLACEHOLDERS.md` to the documents, and each pull request records its own proof. A
line here is true on the day it was written and on no other day.

**Today (28 September 2026): a private beta with real families is running** — US families the founder knows,
invited from **25 September 2026** — on the founder's decisions standing in for attorney sign-off (ATTORNEY-PACKET,
*"Decided by the founder for the beta"*; nothing has been reviewed by the attorney yet). Published as beta versions:
Privacy Policy, Parent rights, Subprocessors, Cookies, Retention (#208, 24 Sep) and the Terms (#267, 26 Sep). Dark:
the Refund policy (billing is off; the beta is free).

**This file does not hold the number of families.** It changes daily; run
`docs/review/sql/readiness-family-count.sql` (read-only, the founder) and prefer that to any number written here.

⚠️ The 👪 boxes below were written as the bar for the first real family, and **the beta started before all of them
were ticked**. An open 👪 box is now a risk being carried with real children's data, not a gate. Boxes marked 💳
must still be ticked **before any payment**.

---

## 1. Done and proven (on production unless marked)

- [x] **Consent gate live, zero exemptions**: `learners.consent_id` NOT NULL, gate on every child table (D4, D6 proofs)
- [x] **Email-plus consent** end to end from the app's own sender (D4, and after D6)
- [x] **Delete one child**: every row + the child's login gone, sibling untouched (D5, real rows)
- [x] **Crash records cascade with the child**: 0 orphans (D4/D6)
- [x] **Nightly encrypted backup** running unattended; restore proven 23 Sep 2026 (#40–#42; see `docs/runbooks/backup-restore.md`)
- [x] **No third-party tracking in a child's session**: our own origin and our own Supabase project (lesson audio, since 27 Sep 2026); CSP `connect-src` limited (23 Sep audit)
- [x] **Legal surface**: 7 pages routed and linked from every collection point; the publish switch refuses a page for placeholders / draft / sign-off / Spanish (`legalSwitch`, `legalSurface`). Six published as beta versions (#208, #267), Refund dark
- [x] **Teacher roster paused** until school consent exists (live since D4)
- [x] **Secret scanning + push protection on**; **org 2FA required** (measured 24 Sep)
- [x] **Round 1 merged** (23 Sep 2026). Every PR has tests that went red on a planted break, plus green CI.
- [x] **Deletion audit trail** built — who deleted which child's data, and when (#260, 26 Sep)
- [x] **Refused B3 cancels retried** by the daily cron and made visible (#246, 26 Sep)
- [x] **Vercel on Pro** (27 Sep 2026)
- [x] **CI `rls-tests` independent of registry rate limits** (#198, #310)

## 2. Built and merged; a production proof is still owed

Every PR here merged on 23 September 2026. A box is ticked only when its proof has been run on production and
recorded in a pull request.

| | item | PR | proof still owed |
|---|---|---|---|
| [x] 👪 | Returning parents get the new bundle after a deploy (R1) | #185 | none now — many deploys since (live service worker v242, 28 Sep) |
| [x] 👪 | The notice says what is stored (R2) | #186 | superseded by notice-v7 (#307, 28 Sep) |
| [ ] 👪 | Scheduled B3 cancelled on **every** path; outcome recorded; daily backstop (R3) | #192 | one real cancellation seen end to end: Resend shows *Cancelled*, the cancellations table records it |
| [ ] 💳 | In-app **Cancel subscription**, confirmation screen + email (R4) | #188 | a real Stripe test-mode run |
| [ ] 👪 | Correct name, **avatar**, grade band in the app (R5) | #191 | change a test child's avatar in the app and read it back (founder SQL) |
| [ ] 💳 | Email suppression list + one-click unsubscribe (R6) | #197 | the unsubscribe link works on a test address, and the suppression table refuses app writes |
| [ ] 👪 | Withdrawal + export proven end to end in code (R7) | #189 | **one production run** with a test parent: export complete, then withdraw through the B3 link |
| [x] 👪 | Doc 06 + Terms describe per-child withdrawal (R8) | #195 | merged (docs only) |
| [ ] 👪 | Unconfirmed accounts pruned after 3 days; profile only on confirmation (R9) | #194 | `docs/legal/sql/r9-prune-proof.sql` after a test account has aged 3 days |
| [x] | One-shot ledger repair removed (R10) | #196 | merged |
| [ ] 👪 | Every placeholder tracked and guarded (R11) | #199 | the founder approves the placeholders replaced in Round 1 (`PLACEHOLDERS.md`, "Resolved in Round 1") |
| [x] 👪 | Spanish drafts, unrenderable until signed (R13) | #190 | merged; the review itself is in §3 |
| [x] 👪 | Staging prepared: seed, runbook, `deploy.yml` staging-first tested (R14) | #193, #337, #338 | done 2026-10-01: 20261001090000 ran on staging (branch), then production after the approval |

## 3. Waiting on the founder, the attorney, a provider, or a reviewer

### The founder (placeholders in `PLACEHOLDERS.md`: the founder's category and *date*)
- [x] 👪 **Staging database** before the first real family (`radlic-staging`, 2026-09-30; `docs/runbooks/deploy.md`, Staging)
- [ ] 👪 **A second GitHub owner**, so production migrations do not depend on one account
- [ ] 👪 **Open security items** — tracked privately, outside this public repo
- [ ] 💳 **Prices** (monthly, annual; must equal `LADDER`), plan names, the receipt-email design
- [ ] 💳 **What a paid subscription unlocks in the lesson system** — today's entitlement guards only the hidden legacy chapters
- [ ] 💳 **Subscription consequence of withdrawal** (with the attorney)
- [ ] 💳 **An affirmative auto-renewal consent control at checkout** — BUILT 2026-09-28 (a separate unticked tick; the route refuses without it); **the attorney confirms its words** (packet C1)
- [ ] 💳 Hide checkout for a parent who already subscribes
- [ ] 💳 Before live keys: watch one Stripe test-mode purchase become a subscription and its seats, then replay the event and see nothing change; decide on point-in-time recovery; rename the Stripe product and card statement descriptor to Radlic; set the webhook on radlic.com; the JSON-LD `offers` price on both sites
- [ ] 👪 **The live Spanish consent text**: show English until it is reviewed?
- [ ] 👪 The real content-review process to describe in Terms §8 — and whether §8's sentence that the service uses AI to "generate or select content" is accurate (nothing calls an AI at runtime)
- [ ] 👪 After a cancelled subscription's period ends, the account stays open (doc 01 already says so) — confirm
- [ ] 👪 Retention of the B3 cancellations table (recommended: delete each row 30 days after its B3 was due), and a doc 04 row for it
- [ ] 👪 A doc 04 row: the email suppression list survives account deletion
- [ ] 👪 A doc 04 row for the deletion log (kept as long as the consent records — decided 26 Sep, #260)
- [ ] 👪 Doc 09 §4: drop "Manage your email preferences" (no such page exists); add the billing cancel email to §8's list
- [ ] 👪 Approve or reword the PROPOSED consent strings in `src/features/consent/copy.ts` (the result after withdrawing for every child, the line after withdrawing) and the unsubscribe page copy; B2's "choose 'I give permission'" names a control that is really a tick
- [ ] 👪 At the next notice change, doc 02: the header's version label (= `NOTICE_VERSION`), "Correct" in the rights list, and `lesson_progress.answered_at` in the stored fields
- [ ] 👪 "Read the notice you agreed to" shows today's notice text, not the version the parent agreed to — decide whether to keep old notice texts (with the attorney)
- [ ] 👪 Doc 08: a "Last updated" line for the text-size rows (English + Spanish), and remove its three "so lessons work offline" promises (#277 withdrew them)
- [ ] 👪 Whether closing an account now keeping the consent record (#269) needs a §16 change notice (with the attorney)
- [ ] 👪 radlor.com's `/privacy` still describes the waitlist; waitlist emails follow doc 09 §8's rule
- [ ] 👪 Copy the three Supabase Auth email templates (confirm, reset, invite) out of the dashboard and confirm each is transactional (doc 09 §8)
- [ ] 👪 The support mailbox receives mail and is answered within 24 hours during the beta
- [ ] 👪 The Resend plan can carry a launch (the free plan's daily cap is about 50 sign-ups a day)
- [ ] 👪 **Publication dates** (the *date* rows) and the day-of checks: doc 02's version label = `NOTICE_VERSION`; doc 11's security paragraph against doc 05
- [ ] 👪 Doc 06 §B2 promises a confirmation link for requests made by email; nothing sends one — build it or reword §B2
- [ ] 👪 Observe the signed-in storage keys in a real session (doc 08: 8 rows are read from the code)
- [ ] 👪 **Terms §6's "every table holding a child's data is named"** is not gated against `docs/legal/12`. Check it against the catalog's child tables (R7's test derives the set) before publication

### Live checks on production (the founder)
- [ ] 👪 **Sign-up**: one email, which confirms the address and asks consent; B3 *Scheduled* about 24 hours later; `docs/legal/sql/signup-email-proof.sql`. The 13 steps: `git show fbf193280:docs/legal/SIGNUP-EMAIL-LIVE-CHECK.md`. If sign-up sends two emails or no B3 is scheduled, hold the beta link
- [ ] 👪 **KG–2 consent**: when the waiting KG child next plays — the friendly screen, B1 to the parent, re-consent, the queued answers upload (`docs/legal/sql/notice-v7-proof.sql`: "waiting" → 0); and a parent on notice-v6 who adds a child is recorded on v7

### The attorney (`ATTORNEY-PACKET.md`; *attorney* placeholders)
- [ ] 👪 **Sign-off on every page, and on its public boundary**
- [ ] 👪 Withdrawal scope: per-child vs whole account (A1)
- [ ] 👪 Consent-record retention; closing an account now keeps the consent record (#269) (A2)
- [ ] 👪 School/teacher consent. The roster stays paused until then (A3)
- [ ] 👪 Email-plus availability and the 24 h delay (A4)
- [ ] 👪 An "I'm 18 or older" tick vs a neutral age screen at sign-up (A6)
- [ ] 👪 One consent per account plus a tick per child; when a notice change must re-ask; the sign-up email as the consent email (A8–A10)
- [ ] 👪 Whether the rename to Radlic is a material change (A11); a trademark clearance search for "Radlic" before public launch
- [ ] 👪 Notice-v7: re-consent only for KG–2 children and new children (A14)
- [ ] 👪 Curriculum provenance (packet §F)
- [ ] 💳 ARL / ROSCA: renewal consent control, cancellation email content, refund stance (C1–C5)
- [ ] 👪 Arbitration; liability floor; AI-content ownership; DMCA; which document controls; notice periods (D1–D9)
- [ ] 👪 The Spanish standard (A7)

### Providers
- [ ] 👪 Supabase: encryption at rest (in writing); platform-log retention; free-tier staging limits
- [ ] 👪 Vercel: log retention; function region
- [ ] 💳 Stripe: receipts on/off; data region; a test-mode key for a Preview run of R4
- [ ] 👪 Resend: data region; DKIM covers `List-Unsubscribe`; cancel semantics
- [ ] 👪 GitHub: backup-artifact storage and retention

### Spanish reviewer
- [ ] 👪 About 10,500 words of legal pages (`docs/legal/es/`) + 104 consent strings. Sign with `REVIEWED-BY: <Full Name>, <YYYY-MM-DD>`.

### For the content loop (curriculum gaps, not launch blockers)
- [ ] **Grade 6 has no negative-numbers module (CCSS 6.NS.5–7).** Signed numbers first appear in Grade 7 Module 2
  (`docs/product/curriculum.md`). Found in Review 1 Q0 (24 Sep 2026); logged by the founder for the content loop.

### Publish
- [ ] 👪 **Publish the legal pages.** For each page in `src/app/legal/registry.ts`: 0 placeholders in its public part, the `STATUS: DRAFT` line removed, attorney sign-off recorded, and Spanish signed. Then set `published: true` in a reviewed PR. The switch refuses anything short of that. Flip `BILLING_LIVE` only when billing is live (💳).

## 4. Pages at a glance

The per-page table that stood here was a snapshot from 24 September and went stale when the Terms were published.
For today's answer: `PLACEHOLDERS.md` lists every placeholder by file (a test keeps it exact), and
`npx vitest run src/__tests__/legalSwitch.test.ts` prints what still blocks each page.
