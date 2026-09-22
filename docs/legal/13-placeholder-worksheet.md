# Placeholder Fill-In Worksheet

> What is still open, per document, after the 22 September audit and the 23 September build review.

**Decisions waiting on Rafi:** monthly and annual price · **which email provider** (Resend, or the authentication service's own mailer — the app currently sends no email of its own) · whether to check `MONITORING_INGEST_URL`.

**Waiting on Rakif:** his full name for the record.

**Waiting on the attorney:** arbitration and class waiver · DMCA agent · liability floor · AI-content ownership wording · consent-record retention period · which document controls on conflict · **and the big one: what happens to the eighteen-plus existing children who have no consent record and cannot acquire one retroactively.**

**Waiting on a build:** the in-app cancel path · editing a child's name or grade · a staging database · the consent record itself.

**Waiting on a provider, in writing:** encryption at rest · hosting region · log retention periods · the exact payment fields returned.

## 01-refund-and-cancellation-policy.md  (7 total)

- [ ] ...
- [ ] effective date
- [ ] last updated date
- [ ] state which document controls
- [ ] monthly price, USD
- [ ] annual price, USD
- [ ] there is no in-app cancellation today. A cancel path must exist before this policy is published: several state statutes require cancelling online to be as easy as subscribing, and a policy that names a path a parent cannot find is

## 02-coppa-direct-notice-to-parents.md  (1 total)

- [ ] date, set on the day this is first shown to a parent. Every consent record stores the version the parent actually saw, so this number must change whenever the body below changes.

## 03-consent-and-checkout-screen-copy.md  (14 total)

- [ ] plan name
- [ ] amount
- [ ] month / 12 months
- [ ] in-app path
- [ ] parent first name
- [ ] every month / every 12 months
- [ ] date
- [ ] delay; a reasonable time after the first, commonly 24 hours. Confirm with the attorney.

## 04-data-retention-policy.md  (8 total)

- [ ] full name, for the record
- [ ] date
- [ ] e.g. annually, and on any material change to the product
- [ ] the provider's retention for this plan could not be read from the API; confirm from the dashboard or the provider's documentation
- [ ] number
- [ ] establish the provider's retention period for these logs and state it here; if it is configurable, configure it.
- [ ] where the review is recorded
- [ ] Radlor should establish what happened and decide whether an audit trail on deletions is warranted. An operator who cannot say what happened to children's data is in a weak position if ever asked.

## 05-information-security-program.md  (7 total)

- [ ] full name, for the record
- [ ] date
- [ ] obtain written confirmation from the provider and keep it as evidence
- [ ] name the test environment here once it exists, and record how the check is made.
- [ ] record how this is evidenced.
- [ ] confirm against every current arrangement.
- [ ] record what was actually fixed, and when

## 06-parent-rights-procedure.md  (3 total)

- [ ] date
- [ ] replace this with the in-app path once an edit function exists.
- [ ] method

## 07-subprocessors.md  (5 total)

- [ ] full name, for the record
- [ ] confirm from the Vercel dashboard rather than from repository prose
- [ ] confirm region
- [ ] decide between adding Resend and using the authentication service's own sender, then complete this row
- [ ] confirm

## 08-cookie-and-tracking-notice.md  (3 total)

- [ ] date
- [ ] the last two rows are read from the application's configuration rather than observed in a live signed-in session. Before publication, sign a child in and enumerate the storage again, so every row in this table has been seen rather
- [ ] if any non-essential storage is ever added, this section must be replaced with a real consent mechanism, and the default must be off.

## 09-email-compliance.md  (3 total)

- [ ] confirm with the attorney whether this applies to our sends, given the recipient relationship.
- [ ] which address Radlor will use.
- [ ] the suppression list has no home yet. The application sends no email of its own: every message a parent receives today comes from the authentication service's built-in mailer, and there is no unsubscribe mechanism anywhere. Name t

## 11-privacy-policy.md  (9 total)

- [ ] ...
- [ ] date
- [ ] confirm the exact fields returned once billing is switched on.
- [ ] remove this paragraph once an edit function exists.
- [ ] period, to be set by the attorney once consent records exist
- [ ] the providers' retention periods must be established and stated here before publication
- [ ] this paragraph must be checked against the Information Security Program immediately before publication, and any control that is not implemented on that day must be removed from it.
- [ ] confirm the hosting region from the provider's dashboard before publication.

## 12-terms-of-service.md  (11 total)

- [ ] ...
- [ ] date
- [ ] ATTORNEY: the previous draft said this material "is protected by copyright and other laws". Most of the lesson content is AI-generated. In the United States, material produced by a machine without sufficient human authorship is no
- [ ] describe the actual review process. Do not claim a level of human review that is not performed.
- [ ] state the remedy: a pro-rata refund, or the right to cancel
- [ ] a floor amount
- [ ] designated agent name, address, email, and phone. To rely on the DMCA safe harbour the agent must also be registered with the US Copyright Office. Confirm with the attorney whether registration is needed given that the Service hos
- [ ] number
- [ ] ARBITRATION AND CLASS ACTION WAIVER. This is a deliberate business decision, not a blank to be filled casually. If Radlor wants binding arbitration and a class-action waiver, the attorney must draft it, including the opt-out right


**Total still open: 71**