# Radlor / Milo — US Legal Document Set

**Drafted:** 2026-09-22 · **Jurisdiction:** United States only · **Status of every document here: DRAFT**

> **None of this is legal advice, and none of it was written by a lawyer.** It is a starting draft so that an attorney's time is spent reviewing and correcting rather than writing from nothing.
> **No document here may render as a live page while it still contains `[PLACEHOLDER — ...]` markers.** There are **280 unresolved placeholders** across the 11 drafts. They are deliberate: every one marks a fact only Radlor Inc. can supply, or a decision only an attorney should make. Filling them in with plausible-sounding guesses would make these documents dangerous rather than useful. Document 13 lists every one of them as a checklist.

---

## What exists now

| # | Document | Type | Placeholders | Status |
|---|---|---|---|---|
| 11 | **Privacy Policy** | Public | 34 | **NEW DRAFT** — the main public policy |
| 12 | **Terms of Service** | Public | 25 | **NEW DRAFT** — parent is the account holder |
| 01 | Refund and Cancellation Policy | Public | 29 | **NEW DRAFT** |
| 02 | Direct Notice to Parents (COPPA) | Public / emailed | 16 | **NEW DRAFT** |
| 03 | Consent and Checkout Screen Copy | Build spec | 29 | **NEW DRAFT** |
| 04 | Data Retention and Deletion Policy | Internal (summary is public) | 29 | **NEW DRAFT** |
| 05 | Written Information Security Program | Internal | 29 | **NEW DRAFT** |
| 06 | Parent Rights — page + procedure | Public + internal | 23 | **NEW DRAFT** |
| 07 | Service Providers and Subprocessors | Public + internal | 38 | **NEW DRAFT** |
| 08 | Cookie and Tracking Notice | Public | 18 | **NEW DRAFT** |
| 09 | Email Compliance Standard (CAN-SPAM) | Internal + footer text | 10 | **NEW DRAFT** |
| 10 | Review of the partner's three documents | Internal memo | 0 | Reference only — superseded by 11 and 12 |
| 13 | Placeholder Fill-In Worksheet | Internal | — | Checklist of all 280 |

**The whole set is written on Path A**: the product collects a small, disclosed amount of information about each child, and obtains verifiable parental consent for it. Documents 11 and 12 replace the earlier Terms and Privacy Policy entirely rather than amending them.

## Decisions these drafts are built on

Taken from Rafi, 2026-09-22:

- **Child data collected:** first name (or nickname), grade level, maths progress and scores. No voice recording, no photos, no contact details from the child.
- **Parental consent method:** both — payment card for paid subscribers, email-plus for anyone starting without a payment method.
- **Billing:** monthly and annual plans, both auto-renewing. No free trial in the current plan. *(If a free trial is added later, documents 01 and 03 must both be revised — trials are where auto-renewal law bites hardest.)*

If any of these three change, the affected documents change with them.

---

## What has to happen next, in order

**1. Radlor fills in the factual placeholders.** Company address, support email, prices, in-app paths, table names, retention periods, the real vendor list. These are facts, not judgement calls. Roughly two-thirds of the 221.

**2. Engineering answers the three questions the drafts cannot.** Each of these is a fact about the running system that nobody currently knows for certain:

- **Which third-party scripts run inside a child's session?** Analytics and error-monitoring are the classic COPPA failure. Document 08 publishes a claim that there are none — that claim must be verified against the running app before it is published, not assumed.
- **What exactly does each vendor receive?** Document 07's table must be filled from the code, not from memory.
- **Does a deletion actually delete?** Document 06 commits to deleting a child's record. That must be watched working — seen finding the rows first, then seen finding nothing after — before the page goes live.

**3. An attorney reviews everything.** Each document ends with a short list of specific questions for them, which is the cheapest way to use their time. Priority order: the COPPA set (02, 03, 06, 04, 05), then the billing set (01, 03), then the rest.

**4. Only then does anything go live.**

---

## Open items already on the board

- **radlor.com Terms are live without attorney review.** The decision between putting a "draft" banner back on the page and taking the page down is still open. This is the one thing in the set that is already public.
- **Two questions must be answered the same way in both document 11 and document 12:** whether children's work is ever used to train or evaluate models, and what happens to a paid subscription when a parent withdraws consent.
- **Content Contributor Agreement — not yet drafted.** People are being paid per topic to write curriculum modules now. Without a written agreement assigning copyright to Radlor and warranting the work is original, the copyright in that content stays with the writer and any copying becomes Radlor's problem. This is live, not future.
- **Provenance of the Grade 4–8 curriculum.** The topic structure was derived from a curriculum PDF. Whose it is, and what it permits, has not been checked.

---

## What is deliberately *not* here

- **Anything outside the United States.** India's DPDP Act, GDPR, UK requirements — all excluded, per the USA-only scope. If a single child outside the US signs up, this set is no longer sufficient.
- **Schools.** FERPA and state student-privacy statutes such as California's SOPIPA only matter when selling to schools or districts. Not yet.
- **App stores.** If the product is ever distributed through Apple's or Google's stores, their own children's-category rules apply on top of the law, and they are stricter in places.
- **Accessibility (ADA / WCAG).** Not a document — a product requirement, and a real litigation risk for consumer web products. Worth putting on the engineering roadmap separately.
