# Placeholders — every `[PLACEHOLDER — …]` in the legal documents, and who resolves it

Round 1, item R11 (24 September 2026). **This table is re-measured on every test run** by
`src/__tests__/placeholderAudit.test.ts`: the rows must equal the placeholders in `docs/legal/01…16`, one for one
(file, line and exact text), and the total below must equal the grep count. Add, move, reword or resolve a
placeholder and the test goes red until this table says so. The Spanish drafts (`docs/legal/es/`) mirror the
English counts and are held by `legalSpanish.test.ts`, not here.

**Total: 24**

| category | count | meaning |
|---|---|---|
| built | 0 | blocked on something engineering has now built and proven — resolve under rule 6 (none left) |
| repo | 0 | a fact measurable from the repository — resolve with evidence (none left) |
| rafi | 14 | a founder decision or a fact only the founder has |
| attorney | 4 | a legal judgement — see `ATTORNEY-PACKET.md` |
| provider | 1 | a provider must confirm (Supabase, Vercel, Stripe, Resend, GitHub) — ROUND-2.md §4 |
| date | 4 | set on the day of publication or adoption |
| marker | 1 | not a blank: the "must not render while any placeholder remains" rule, which quotes the marker |

## Resolved in Round 1 (each listed in ROUND-2.md §6 for approval)

| where (before) | by | evidence |
|---|---|---|
| 01 §4 in-app cancel path | R4, PR #188 | `billingCancel.test.ts` (8 tests, 6 breaks) |
| 06 §2 in-app correction path | R5, PR #191 | `childCorrect` + `parentRights` tests, 3 breaks |
| 11 §5 "cannot yet correct in the app" paragraph | R5, PR #191 | same |
| 09 §7 no suppression list | R6, PR #197 | suppression tests, 7 breaks |
| 02 §rights "does not yet delete" | R11 (this PR) | deletion built and proven: `consentDeletion.test.ts`, `withdrawExportE2e.test.ts` (R7), production D5 |
| 03 A1 "in-app path" | R11 | R4's path, `Account → Plan & billing` |
| 03 receipt "in-app path" | R11 | same |
| 03 withdrawal screen "control's name must match" | R11 (repo) | since D1 the paragraph names no control; the buttons are held to `copy.ts` both ways by `consentCopy.test.ts` |
| 05 §"decide before the migration: clear test data or keep the exemption" | R11 (repo) | decided and applied in D6, `20260923170000`; D6 proof on production |

Added in Round 1: 06 §4 and 12 §4 (R8) — the subscription consequence of withdrawal, replacing a promise nothing builds.

## Resolved in the founder interview (24 September 2026)

Each value below is what Rafi confirmed, from memory or from the named dashboard; nothing was inferred. English and the Spanish draft were changed together.

| # (before) | where | now says |
|---|---|---|
| #8 | 03-consent-and-checkout-screen-copy.md | Radlic Family |
| #14 | 03-consent-and-checkout-screen-copy.md | Radlic Family |
| #20 | 04-data-retention-policy.md | Rakif Bobre |
| #23 | 04-data-retention-policy.md | 12 months |
| #26 | 04-data-retention-policy.md | deleted deliberately ~17 Sep (test data); audit trail decided, not built |
| #27 | 05-information-security-program.md | Rakif Bobre |
| #32 | 05-information-security-program.md | pointer to READINESS.md |
| #35 | 06-parent-rights-procedure.md | steps to download in the app; else the same file by email |
| #36 | 07-subprocessors.md | Rakif Bobre |
| #37 | 07-subprocessors.md | iad1, Washington, D.C. (Vercel dashboard) |
| #39 | 07-subprocessors.md | North Virginia, us-east-1 (Resend dashboard) |
| #41 | 07-subprocessors.md | not set in Preview or Development (Vercel dashboard) |
| #53 | 11-privacy-policy.md | iad1, Washington, D.C. (hosting dashboard) |
| #60 | 12-terms-of-service.md | the measured review process (written in advance, blind solver + tests, not every lesson read by a person) |
| #63 | 12-terms-of-service.md | agent = Copyright Agent, Radlor Inc. (address, email); phone → new #67 (rafi), registration → new #68 (attorney) |

## Resolved for the private beta (24 September 2026)

Published on the founder's decisions, without an attorney; every attorney row decided here is recorded in `ATTORNEY-PACKET.md` → *Decided by the founder for the beta*. The provider values are what the founder read from each dashboard.

| # (before) | where | category |
|---|---|---|
| #21 | 04-data-retention-policy.md | date |
| #22 | 04-data-retention-policy.md | provider |
| #24 | 04-data-retention-policy.md | attorney |
| #25 | 04-data-retention-policy.md | provider |
| #33 | 06-parent-rights-procedure.md | date |
| #34 | 06-parent-rights-procedure.md | attorney |
| #38 | 07-subprocessors.md | provider |
| #40 | 07-subprocessors.md | provider |
| #42 | 08-cookie-and-tracking-notice.md | date |
| #43 | 08-cookie-and-tracking-notice.md | rafi |
| #44 | 08-cookie-and-tracking-notice.md | attorney |
| #46 | 11-privacy-policy.md | marker |
| #47 | 11-privacy-policy.md | date |
| #48 | 11-privacy-policy.md | date |
| #49 | 11-privacy-policy.md | rafi |
| #50 | 11-privacy-policy.md | attorney |
| #51 | 11-privacy-policy.md | provider |
| #52 | 11-privacy-policy.md | date |
| #54 | 12-terms-of-service.md | marker |
| #55 | 12-terms-of-service.md | date |
| #56 | 12-terms-of-service.md | date |
| #57 | 12-terms-of-service.md | attorney |
| #58 | 12-terms-of-service.md | attorney |
| #59 | 12-terms-of-service.md | attorney |
| #61 | 12-terms-of-service.md | attorney |
| #64 | 12-terms-of-service.md | attorney |
| #65 | 12-terms-of-service.md | attorney |
| #66 | 12-terms-of-service.md | attorney |
| #68 | 12-terms-of-service.md | attorney |

## The table

| # | file | line | text | category | owner | what resolves it |
|---|---|---|---|---|---|---|
| 1 | 01-refund-and-cancellation-policy.md | 4 | `[PLACEHOLDER — ...]` | marker | — | Not a blank: the rule itself ("must not render while any [PLACEHOLDER — ...] remains"). Delete this line when publishing. |
| 2 | 01-refund-and-cancellation-policy.md | 11 | `[PLACEHOLDER — effective date]` | date | Rafi | Effective date, set on publication. |
| 3 | 01-refund-and-cancellation-policy.md | 12 | `[PLACEHOLDER — last updated date]` | date | Rafi | Last-updated date, set on publication. |
| 4 | 01-refund-and-cancellation-policy.md | 26 | `[PLACEHOLDER — monthly price, USD]` | rafi | Rafi | Monthly price (USD). Code today: `LADDER` in `src/core/billing.ts` — must match. |
| 5 | 01-refund-and-cancellation-policy.md | 27 | `[PLACEHOLDER — annual price, USD]` | rafi | Rafi | Annual price (USD); same. |
| 6 | 02-coppa-direct-notice-to-parents.md | 13 | `[PLACEHOLDER — date, set on the day this is first shown to a parent. Every consent record stores the version the parent actually saw, so this number must change whenever the body below changes.]` | date | Rafi | The day the notice is first shown to a real parent. ⚠️ The line says "v1"; the build records `notice-v4` (R2). |
| 7 | 02-coppa-direct-notice-to-parents.md | 59 | `[PLACEHOLDER — a second method, verification through the payment card at checkout, is specified in document 03 and is not built. Add it here only when it exists; describing a choice a parent cannot make is worse than offering one method plainly.]` | rafi | Rafi + attorney | Build card verification or not (a product decision; attorney on § 312.5(b)(2)). Stays until it exists. |
| 9 | 03-consent-and-checkout-screen-copy.md | 70 | `[PLACEHOLDER — amount]` | rafi | Rafi | First-charge amount. |
| 10 | 03-consent-and-checkout-screen-copy.md | 71 | `[PLACEHOLDER — amount]` | rafi | Rafi | Renewal amount. |
| 11 | 03-consent-and-checkout-screen-copy.md | 71 | `[PLACEHOLDER — month / 12 months]` | rafi | Rafi | Cadence (monthly and annual both exist in `LADDER`). |
| 12 | 03-consent-and-checkout-screen-copy.md | 79 | `[PLACEHOLDER — amount]` | rafi | Rafi | Button amount. |
| 13 | 03-consent-and-checkout-screen-copy.md | 93 | `[PLACEHOLDER — parent first name]` | rafi | Rafi | Receipt greeting. The account may have a `full_name` (Google sign-in) or not — choose "Hi," or a name field. |
| 15 | 03-consent-and-checkout-screen-copy.md | 98 | `[PLACEHOLDER — amount]` | rafi | Rafi | Amount in the receipt. |
| 16 | 03-consent-and-checkout-screen-copy.md | 99 | `[PLACEHOLDER — every month / every 12 months]` | rafi | Rafi | Cadence in the receipt. |
| 17 | 03-consent-and-checkout-screen-copy.md | 99 | `[PLACEHOLDER — date]` | rafi | Rafi | Renewal date — a per-purchase field of an unbuilt receipt email (not a publication date). |
| 18 | 03-consent-and-checkout-screen-copy.md | 100 | `[PLACEHOLDER — amount]` | rafi | Rafi | Renewal amount in the receipt. |
| 19 | 03-consent-and-checkout-screen-copy.md | 192 | `[PLACEHOLDER — delay; a reasonable time after the first, commonly 24 hours. Confirm with the attorney.]` | attorney | Attorney | B3 delay. Build: 24 h, refused outside 24–48 h in production (`config.ts`). Attorney confirms. |
| 28 | 05-information-security-program.md | 8 | `[PLACEHOLDER — date]` | date | Rafi | Adoption date. |
| 29 | 05-information-security-program.md | 35 | `[PLACEHOLDER — obtain written confirmation from the provider and keep it as evidence]` | provider | Supabase | Written confirmation of encryption at rest. |
| 30 | 05-information-security-program.md | 63 | `[PLACEHOLDER — name the test environment here once it exists, and record how the check is made.]` | rafi | Rafi | Name the staging/test environment once created (R14 prepared it; ROUND-2 §4). |
| 31 | 05-information-security-program.md | 71 | `[PLACEHOLDER — attorney: can a school consent on a parent's behalf here, and under what conditions? Until that is answered, the teacher path and the consent gate cannot both be live.]` | attorney | Attorney | School consent (packet A3). |
| 45 | 09-email-compliance.md | 20 | `[PLACEHOLDER — confirm with the attorney whether this applies to our sends, given the recipient relationship.]` | attorney | Attorney | Whether the "advertisement" label applies (packet E7). |
| 62 | 12-terms-of-service.md | 117 | `[PLACEHOLDER — a floor amount]` | attorney | Attorney | Liability floor (packet D2). |
| 67 | 12-terms-of-service.md | 129 | `[PLACEHOLDER — phone number]` | rafi | Rafi | The DMCA agent's phone number (the agent itself was filled on 24 Sep 2026: Radlor Inc.). |
