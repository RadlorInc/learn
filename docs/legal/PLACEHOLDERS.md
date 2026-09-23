# Placeholders — every `[PLACEHOLDER — …]` in the legal documents, and who resolves it

Round 1, item R11 (24 September 2026). **This table is re-measured on every test run** by
`src/__tests__/placeholderAudit.test.ts`: the rows must equal the placeholders in `docs/legal/01…16`, one for one
(file, line and exact text), and the total below must equal the grep count. Add, move, reword or resolve a
placeholder and the test goes red until this table says so. The Spanish drafts (`docs/legal/es/`) mirror the
English counts and are held by `legalSpanish.test.ts`, not here.

**Total: 66**

| category | count | meaning |
|---|---|---|
| built | 0 | blocked on something engineering has now built and proven — resolve under rule 6 (none left) |
| repo | 0 | a fact measurable from the repository — resolve with evidence (none left) |
| rafi | 27 | a founder decision or a fact only the founder has |
| attorney | 15 | a legal judgement — see `ATTORNEY-PACKET.md` |
| provider | 9 | a provider must confirm (Supabase, Vercel, Stripe, Resend, GitHub) — ROUND-2.md §4 |
| date | 12 | set on the day of publication or adoption |
| marker | 3 | not a blank: the "must not render while any placeholder remains" rule, which quotes the marker |

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
| 8 | 03-consent-and-checkout-screen-copy.md | 69 | `[PLACEHOLDER — plan name]` | rafi | Rafi | Plan name. |
| 9 | 03-consent-and-checkout-screen-copy.md | 70 | `[PLACEHOLDER — amount]` | rafi | Rafi | First-charge amount. |
| 10 | 03-consent-and-checkout-screen-copy.md | 71 | `[PLACEHOLDER — amount]` | rafi | Rafi | Renewal amount. |
| 11 | 03-consent-and-checkout-screen-copy.md | 71 | `[PLACEHOLDER — month / 12 months]` | rafi | Rafi | Cadence (monthly and annual both exist in `LADDER`). |
| 12 | 03-consent-and-checkout-screen-copy.md | 79 | `[PLACEHOLDER — amount]` | rafi | Rafi | Button amount. |
| 13 | 03-consent-and-checkout-screen-copy.md | 93 | `[PLACEHOLDER — parent first name]` | rafi | Rafi | Receipt greeting. The account may have a `full_name` (Google sign-in) or not — choose "Hi," or a name field. |
| 14 | 03-consent-and-checkout-screen-copy.md | 97 | `[PLACEHOLDER — plan name]` | rafi | Rafi | Plan name in the receipt. |
| 15 | 03-consent-and-checkout-screen-copy.md | 98 | `[PLACEHOLDER — amount]` | rafi | Rafi | Amount in the receipt. |
| 16 | 03-consent-and-checkout-screen-copy.md | 99 | `[PLACEHOLDER — every month / every 12 months]` | rafi | Rafi | Cadence in the receipt. |
| 17 | 03-consent-and-checkout-screen-copy.md | 99 | `[PLACEHOLDER — date]` | rafi | Rafi | Renewal date — a per-purchase field of an unbuilt receipt email (not a publication date). |
| 18 | 03-consent-and-checkout-screen-copy.md | 100 | `[PLACEHOLDER — amount]` | rafi | Rafi | Renewal amount in the receipt. |
| 19 | 03-consent-and-checkout-screen-copy.md | 157 | `[PLACEHOLDER — delay; a reasonable time after the first, commonly 24 hours. Confirm with the attorney.]` | attorney | Attorney | B3 delay. Build: 24 h, refused outside 24–48 h in production (`config.ts`). Attorney confirms. |
| 20 | 04-data-retention-policy.md | 7 | `[PLACEHOLDER — full name, for the record]` | rafi | Rafi | Rakif's full name. |
| 21 | 04-data-retention-policy.md | 8 | `[PLACEHOLDER — date]` | date | Rafi | Adoption date. |
| 22 | 04-data-retention-policy.md | 34 | `[PLACEHOLDER — the provider's retention for this plan could not be read from the API; confirm from the dashboard or the provider's documentation]` | provider | Vercel | Hosting request/console log retention for this plan. |
| 23 | 04-data-retention-policy.md | 36 | `[PLACEHOLDER — number]` | rafi | Rafi | How long support email with parents is kept. |
| 24 | 04-data-retention-policy.md | 40 | `[PLACEHOLDER — attorney to decide; until then the cascade stands, because inventing a retention rule for evidence about children would be worse than naming the gap.]` | attorney | Attorney | Consent-record retention vs the account-closure cascade (packet A2). |
| 25 | 04-data-retention-policy.md | 60 | `[PLACEHOLDER — establish the provider's retention period for these logs and state it here; if it is configurable, configure it.]` | provider | Supabase | Platform (API/auth) log retention; configure if possible. |
| 26 | 04-data-retention-policy.md | 78 | `[PLACEHOLDER — Radlor should establish what happened and decide whether an audit trail on deletions is warranted. An operator who cannot say what happened to children's data is in a weak position if ever asked.]` | rafi | Rafi | What removed ~1,440 event rows, and whether to add a deletion audit trail. |
| 27 | 05-information-security-program.md | 7 | `[PLACEHOLDER — full name, for the record]` | rafi | Rafi | Rakif's full name. |
| 28 | 05-information-security-program.md | 8 | `[PLACEHOLDER — date]` | date | Rafi | Adoption date. |
| 29 | 05-information-security-program.md | 35 | `[PLACEHOLDER — obtain written confirmation from the provider and keep it as evidence]` | provider | Supabase | Written confirmation of encryption at rest. |
| 30 | 05-information-security-program.md | 63 | `[PLACEHOLDER — name the test environment here once it exists, and record how the check is made.]` | rafi | Rafi | Name the staging/test environment once created (R14 prepared it; ROUND-2 §4). |
| 31 | 05-information-security-program.md | 71 | `[PLACEHOLDER — attorney: can a school consent on a parent's behalf here, and under what conditions? Until that is answered, the teacher path and the consent gate cannot both be live.]` | attorney | Attorney | School consent (packet A3). |
| 32 | 05-information-security-program.md | 103 | `[PLACEHOLDER — record the remaining fixes as they land]` | rafi | Rafi | Running log of remaining fixes — keep it current, then remove before adoption. |
| 33 | 06-parent-rights-procedure.md | 10 | `[PLACEHOLDER — date]` | date | Rafi | Effective date. |
| 34 | 06-parent-rights-procedure.md | 36 | `[PLACEHOLDER — ATTORNEY and RAFI: whether withdrawing permission for a child also cancels or reduces a subscription, and whether any part is refunded. Nothing does this today: billing is off and no subscription can be bought (`BILLING_LIVE = false`). An earlier version of this page promised cancellation and a pro-rata refund; decide and build it before billing goes live, then write it here.]` | attorney | Attorney + Rafi | Subscription consequence of withdrawal (packet A1/C4). Added in Round 1 (R8). |
| 35 | 06-parent-rights-procedure.md | 71 | `[PLACEHOLDER — method]` | rafi | Rafi | How an export requested BY EMAIL is sent (the in-app download exists). |
| 36 | 07-subprocessors.md | 7 | `[PLACEHOLDER — full name, for the record]` | rafi | Rafi | Reviewer's full name. |
| 37 | 07-subprocessors.md | 21 | `[PLACEHOLDER — confirm from the Vercel dashboard rather than from repository prose]` | provider | Vercel | Function region, from the dashboard. |
| 38 | 07-subprocessors.md | 22 | `[PLACEHOLDER — confirm region]` | provider | Stripe | Data region. |
| 39 | 07-subprocessors.md | 23 | `[PLACEHOLDER — confirm region]` | provider | Resend | Data region. |
| 40 | 07-subprocessors.md | 25 | `[PLACEHOLDER — confirm]` | provider | GitHub | Where backup artifacts are stored / retained. |
| 41 | 07-subprocessors.md | 36 | `[PLACEHOLDER — confirm the same is true of the preview and development environments before anyone tests against real data there.]` | rafi | Rafi | Check Vercel Preview/Development env vars for crash forwarding (`MONITORING_INGEST_URL`). |
| 42 | 08-cookie-and-tracking-notice.md | 6 | `[PLACEHOLDER — date]` | date | Rafi | Effective date. |
| 43 | 08-cookie-and-tracking-notice.md | 31 | `[PLACEHOLDER — the last two rows are read from the application's configuration rather than observed in a live signed-in session. Before publication, sign a child in and enumerate the storage again, so every row in this table has been seen rather than inferred.]` | rafi | Rafi | Sign a child in and enumerate on-device storage; confirm every row, including the six added in Round 1 "read from the code". |
| 44 | 08-cookie-and-tracking-notice.md | 53 | `[PLACEHOLDER — if any non-essential storage is ever added, this section must be replaced with a real consent mechanism, and the default must be off.]` | attorney | Attorney | A standing rule, not a blank — attorney to confirm the no-banner position and whether it moves to an internal note (08 notes 1–2). |
| 45 | 09-email-compliance.md | 20 | `[PLACEHOLDER — confirm with the attorney whether this applies to our sends, given the recipient relationship.]` | attorney | Attorney | Whether the "advertisement" label applies (packet E7). |
| 46 | 11-privacy-policy.md | 4 | `[PLACEHOLDER — ...]` | marker | — | Not a blank: the rule itself. Delete when publishing. |
| 47 | 11-privacy-policy.md | 14 | `[PLACEHOLDER — date]` | date | Rafi | Effective date. |
| 48 | 11-privacy-policy.md | 15 | `[PLACEHOLDER — date]` | date | Rafi | Last-updated date. |
| 49 | 11-privacy-policy.md | 67 | `[PLACEHOLDER — confirm the exact fields returned once billing is switched on.]` | rafi | Rafi | Exact billing fields once billing is switched on. |
| 50 | 11-privacy-policy.md | 132 | `[PLACEHOLDER — period, to be set by the attorney once consent records exist]` | attorney | Attorney | Consent-record retention period (packet A2). |
| 51 | 11-privacy-policy.md | 133 | `[PLACEHOLDER — the providers' retention periods must be established and stated here before publication]` | provider | Supabase + Vercel | Request-log retention periods. |
| 52 | 11-privacy-policy.md | 142 | `[PLACEHOLDER — this paragraph must be checked against the Information Security Program immediately before publication, and any control that is not implemented on that day must be removed from it.]` | date | Rafi | Publication-day check of the security paragraph against doc 05. |
| 53 | 11-privacy-policy.md | 148 | `[PLACEHOLDER — confirm the hosting region from the provider's dashboard before publication.]` | provider | Vercel | Hosting region from the dashboard. |
| 54 | 12-terms-of-service.md | 4 | `[PLACEHOLDER — ...]` | marker | — | Not a blank: the rule itself. Delete when publishing. |
| 55 | 12-terms-of-service.md | 13 | `[PLACEHOLDER — date]` | date | Rafi | Effective date. |
| 56 | 12-terms-of-service.md | 14 | `[PLACEHOLDER — date]` | date | Rafi | Last-updated date. |
| 57 | 12-terms-of-service.md | 45 | `[PLACEHOLDER — ATTORNEY: this last sentence describes what the system does today. It follows from "we delete everything we hold about you", and it is the opposite of what record-keeping for children's consent usually wants. Please advise whether an anonymised consent log should survive account deletion, and if so what it may contain.]` | attorney | Attorney | Anonymised consent log surviving account closure (packet A2). |
| 58 | 12-terms-of-service.md | 47 | `[PLACEHOLDER — ATTORNEY and RAFI: whether withdrawing consent also cancels or reduces a subscription, and any refund. Nothing does this today (billing is off). The earlier text promised cancellation and a pro-rata refund; decide before billing goes live.]` | attorney | Attorney + Rafi | Subscription consequence of withdrawal (packet C4). Added in Round 1 (R8). |
| 59 | 12-terms-of-service.md | 78 | `[PLACEHOLDER — ATTORNEY: the previous draft said this material "is protected by copyright and other laws". Most of the lesson content is AI-generated. In the United States, material produced by a machine without sufficient human authorship is not protected by copyright, and a bare claim of copyright over it may be both unenforceable and inaccurate. Please advise on the right formulation — we expect protection to rest on the selection, arrangement and editing that humans contributed, on these Terms as a contract, and on the acceptable-use restrictions, rather than on a blanket copyright assertion.]` | attorney | Attorney | Copyright formulation for AI-generated content (packet D3). |
| 60 | 12-terms-of-service.md | 91 | `[PLACEHOLDER — describe the actual review process. Do not claim a level of human review that is not performed.]` | rafi | Rafi | Describe the real content-review process — no more than is done (packet D3c). |
| 61 | 12-terms-of-service.md | 97 | `[PLACEHOLDER — state the remedy: a pro-rata refund, or the right to cancel]` | attorney | Attorney | Service-change remedy (packet C3). |
| 62 | 12-terms-of-service.md | 119 | `[PLACEHOLDER — a floor amount]` | attorney | Attorney | Liability floor (packet D2). |
| 63 | 12-terms-of-service.md | 131 | `[PLACEHOLDER — designated agent name, address, email, and phone. To rely on the DMCA safe harbour the agent must also be registered with the US Copyright Office. Confirm with the attorney whether registration is needed given that the Service hosts little or no user-posted material.]` | rafi | Rafi + attorney | DMCA agent details; attorney on registration (packet D4). |
| 64 | 12-terms-of-service.md | 137 | `[PLACEHOLDER — number]` | attorney | Attorney | Days to respond before proceedings (packet D7). |
| 65 | 12-terms-of-service.md | 139 | `[PLACEHOLDER — ARBITRATION AND CLASS ACTION WAIVER. This is a deliberate business decision, not a blank to be filled casually. If Radlor wants binding arbitration and a class-action waiver, the attorney must draft it, including the opt-out right and the notice formatting several courts require. If Radlor does not want it, the clause below applies instead and this note is deleted.]` | attorney | Attorney | Arbitration / class waiver (packet D1). |
| 66 | 12-terms-of-service.md | 146 | `[PLACEHOLDER — number]` | attorney | Attorney | Days of notice before material changes (packet D7). |
