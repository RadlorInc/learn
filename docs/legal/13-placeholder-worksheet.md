# Placeholder Fill-In Worksheet

> What is still open, per document, as of 23 September 2026. **74 left, from 280.**

**Filled so far:** Milo · Radlor Inc. · 254 Chapman Rd, Ste 208 #28608, Newark, DE 19702 · support@radlor.com · no telephone · legal pages under https://adaptivelearn.radlor.com/legal/… · Resend (SMTP behind the auth mailer) · consent by email-plus · monthly + annual, auto-renew, no free trial · no model training on children's work · withdrawal closes the account with a pro-rata refund · 14-day refund window, paid back in 10 business days · renewal reminder and price-change notice 30 days · failed payment 7 days then pause · parent requests answered in 10 days with an appeal · four children per subscription · 13–17 treated as under-13 · owner Rakif · request log and annual review in Radlor Ops · **Terms control on conflict** · **no contractors**.

## Who can close what is left

| Bucket | Roughly | What |
|---|---|---|
| **Waiting on a build** | ~35 | The cancel path, the card path, deletion, the edit path, staging, the unsubscribe mechanism, the signed-in storage list. **These are not blanks — the thing does not exist yet. The loop removes most of them.** |
| **Publication dates** | ~14 | Every effective and last-updated date, set on the day each page goes live |
| **Attorney** | ~10 | Arbitration and class waiver · DMCA agent · liability floor · AI-content ownership wording · consent-record retention · the consent/deletion cascade · school and teacher consent · the email-plus delay · CAN-SPAM ad labelling · whether a deletion audit trail is warranted |
| **Rafi, from a dashboard** | ~7 | Hosting region · hosting log retention · database log retention · encryption at rest, in writing · payment provider region · backup artifact region · `MONITORING_INGEST_URL` in preview and development |
| **Rafi, a decision** | 3 | Monthly price · annual price · Rakif's full name for the record |

## 01-refund-and-cancellation-policy.md  (6 total)

- [ ] ...
- [ ] effective date
- [ ] last updated date
- [ ] monthly price, USD
- [ ] annual price, USD
- [ ] there is no in-app cancellation today. A cancel path must exist before this policy is published: several state statutes require cancelling online to be as easy as subscribing, and a policy that names a path a parent cann

## 02-coppa-direct-notice-to-parents.md  (3 total)

- [ ] date, set on the day this is first shown to a parent. Every consent record stores the version the parent actually saw, so this number must change whenever the body below changes.
- [ ] a second method, verification through the payment card at checkout, is specified in document 03 and is not built. Add it here only when it exists; describing a choice a parent cannot make is worse than offering one metho
- [ ] the earlier wording promised deletion here. The build stops collection but does not yet delete. Restore the promise once deletion is built; until then this line must not claim it.

## 03-consent-and-checkout-screen-copy.md  (15 total)

- [ ] plan name
- [ ] amount
- [ ] month / 12 months
- [ ] in-app path
- [ ] parent first name
- [ ] every month / every 12 months
- [ ] date
- [ ] delay; a reasonable time after the first, commonly 24 hours. Confirm with the attorney.
- [ ] this control's name must match the product exactly; check it on the day this ships, and keep them matching afterwards.

## 04-data-retention-policy.md  (7 total)

- [ ] full name, for the record
- [ ] date
- [ ] the provider's retention for this plan could not be read from the API; confirm from the dashboard or the provider's documentation
- [ ] number
- [ ] attorney to decide; until then the cascade stands, because inventing a retention rule for evidence about children would be worse than naming the gap.
- [ ] establish the provider's retention period for these logs and state it here; if it is configurable, configure it.
- [ ] Radlor should establish what happened and decide whether an audit trail on deletions is warranted. An operator who cannot say what happened to children's data is in a weak position if ever asked.

## 05-information-security-program.md  (7 total)

- [ ] full name, for the record
- [ ] date
- [ ] obtain written confirmation from the provider and keep it as evidence
- [ ] identify which child records belong to intern and staff test accounts, and record the real count here.
- [ ] name the test environment here once it exists, and record how the check is made.
- [ ] attorney: can a school consent on a parent's behalf here, and under what conditions? Until that is answered, the teacher path and the consent gate cannot both be live.
- [ ] record what was actually fixed, and when

## 06-parent-rights-procedure.md  (3 total)

- [ ] date
- [x] replace this with the in-app path once an edit function exists. *(Done in Round 1, R5: Login & data → Correct *name*'s details.)*
- [ ] method

## 07-subprocessors.md  (6 total)

- [ ] full name, for the record
- [ ] confirm from the Vercel dashboard rather than from repository prose
- [ ] confirm region
- [ ] confirm
- [ ] confirm the same is true of the preview and development environments before anyone tests against real data there.

## 08-cookie-and-tracking-notice.md  (3 total)

- [ ] date
- [ ] the last two rows are read from the application's configuration rather than observed in a live signed-in session. Before publication, sign a child in and enumerate the storage again, so every row in this table has been s
- [ ] if any non-essential storage is ever added, this section must be replaced with a real consent mechanism, and the default must be off.

## 09-email-compliance.md  (2 total)

- [ ] confirm with the attorney whether this applies to our sends, given the recipient relationship.
- [ ] no suppression list or unsubscribe mechanism exists yet, because only authentication emails are sent today and those are transactional. It must be built before the first commercial email, not after.

## 11-privacy-policy.md  (9 total)

- [ ] ...
- [ ] date
- [ ] confirm the exact fields returned once billing is switched on.
- [x] remove this paragraph once an edit function exists. *(Done in Round 1, R5.)*
- [ ] period, to be set by the attorney once consent records exist
- [ ] the providers' retention periods must be established and stated here before publication
- [ ] this paragraph must be checked against the Information Security Program immediately before publication, and any control that is not implemented on that day must be removed from it.
- [ ] confirm the hosting region from the provider's dashboard before publication.

## 12-terms-of-service.md  (12 total)

- [ ] ...
- [ ] date
- [ ] ATTORNEY: this last sentence describes what the system does today. It follows from "we delete everything we hold about you", and it is the opposite of what record-keeping for children's consent usually wants. Please advi
- [ ] ATTORNEY: the previous draft said this material "is protected by copyright and other laws". Most of the lesson content is AI-generated. In the United States, material produced by a machine without sufficient human author
- [ ] describe the actual review process. Do not claim a level of human review that is not performed.
- [ ] state the remedy: a pro-rata refund, or the right to cancel
- [ ] a floor amount
- [ ] designated agent name, address, email, and phone. To rely on the DMCA safe harbour the agent must also be registered with the US Copyright Office. Confirm with the attorney whether registration is needed given that the S
- [ ] number
- [ ] ARBITRATION AND CLASS ACTION WAIVER. This is a deliberate business decision, not a blank to be filled casually. If Radlor wants binding arbitration and a class-action waiver, the attorney must draft it, including the opt


**Total still open: 73**