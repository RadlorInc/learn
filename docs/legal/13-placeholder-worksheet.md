# Placeholder Fill-In Worksheet

> Every `[PLACEHOLDER — ...]` still open in the draft set, per document. Nothing here should be guessed.

**Facts filled in (22 Sep 2026):** Milo · Radlor Inc. · 254 Chapman Rd, Ste 208 #28608, Newark, DE 19702 · support@radlor.com · no telephone contact · legal pages under https://adaptivelearn.radlor.com/legal/…

**Decisions recorded:** child data = first name/nickname, avatar, grade, progress · consent = card (paid) + email-plus (free) · billing = monthly + annual, auto-renew, no trial · **free during soft launch, so email-plus is the only live consent path** · no model training on children's work · withdrawing consent closes the account with a pro-rata refund · refunds = 14-day satisfaction window, returned within 10 business days · annual renewal reminder 30 days · price-change notice 30 days · failed payment 7 days then pause · parent requests answered in 10 days · one subscription covers up to four children · cancelled account is closed.

**Still unanswered and worth a decision:** prices · in-app paths (cancel, parent requests, correct a profile) · vendor table · cookie/storage table · database table names and retention periods · security-programme owner and controls · effective dates.

## 01-refund-and-cancellation-policy.md  (10 total, 10 unique)

- [ ] ...
- [ ] effective date
- [ ] last updated date
- [ ] state which document controls
- [ ] monthly price, USD
- [ ] annual price, USD
- [ ] state whether a free trial is offered. If a free trial is ever offered, this policy must be amended to add the trial length, the date of the first charge, and the amount of that charge, disclosed before the parent enrols.
- [ ] exact in-app path, e.g. Account → Subscription → Cancel subscription
- [ ] number of business days
- [ ] state the remedy

## 02-coppa-direct-notice-to-parents.md  (8 total, 8 unique)

- [ ] ...
- [ ] version and date
- [ ] list exactly: IP address, device or browser type, session identifier, cookies or local storage keys
- [ ] Radlor must state here, truthfully and specifically, whether any of the child's information is disclosed to any third party, and if so to whom and for what purpose. The list of service providers in the Subprocessors document must match t
- [ ] this sentence applies only if any third-party disclosure actually occurs; delete it if not
- [ ] exact mechanism: in-app path AND email address
- [ ] number
- [ ] one or two sentences summarising the security measures actually in place, drawn from the Information Security Program document. Do not describe a control that is not implemented.

## 03-consent-and-checkout-screen-copy.md  (14 total, 8 unique)

- [ ] plan name
- [ ] amount
- [ ] month / 12 months
- [ ] in-app path
- [ ] parent first name
- [ ] every month / every 12 months
- [ ] date
- [ ] delay; a reasonable time after the first, commonly 24 hours. Confirm with the attorney.

## 04-data-retention-policy.md  (29 total, 17 unique)

- [ ] named person responsible
- [ ] date
- [ ] e.g. annually, and on any material change to the product
- [ ] table name
- [ ] number
- [ ] table names
- [ ] period advised by the attorney
- [ ] period; tax and accounting rules will set a floor
- [ ] where
- [ ] provider and location
- [ ] Radlor must complete this table with the real table names and real periods. A period written here that is not enforced by a job is worse than no policy, because it is a published claim that is false.
- [ ] confirm this description matches how backups actually behave on the current provider, and state the maximum window between a live deletion and the last backup copy expiring.
- [ ] job name and schedule
- [ ] where the run log is
- [ ] ticket log
- [ ] 
- [ ] Radlor should record here the current state of the historical event data and the planned rollup, so that the retention schedule above and the actual behaviour of the system do not contradict each other. A retention policy that is publish

## 05-information-security-program.md  (29 total, 13 unique)

- [ ] a named individual. The Rule expects a designated person.
- [ ] date
- [ ] name
- [ ] yes/no, with the date it was last verified
- [ ] 
- [ ] describe the actual authentication controls
- [ ] multi-factor authentication on the hosting, database, repository and payment accounts
- [ ] how often
- [ ] confirm the provider's at-rest encryption and state it
- [ ] number
- [ ] record how this is evidenced.
- [ ] confirm this is true of every current contractor.
- [ ] name the test environment and record how this is checked.

## 06-parent-rights-procedure.md  (11 total, 11 unique)

- [ ] date
- [ ] in-app path
- [ ] number
- [ ] exact path
- [ ] describe the verification step actually used, e.g. send a confirmation link to the account email
- [ ] state whether there is an appeal route, and what it is.
- [ ] where the log lives.
- [ ] table list
- [ ] method
- [ ] exact table list
- [ ] any other channel, e.g. app store reviews, social media DMs

## 07-subprocessors.md  (38 total, 21 unique)

- [ ] date
- [ ] name
- [ ] hosting provider
- [ ] yes/no
- [ ] e.g. IP address and request logs
- [ ] region, confirmed from the provider's own dashboard
- [ ] database/backend provider
- [ ] child first name, grade, learning events
- [ ] 
- [ ] payment provider
- [ ] should be no; payments concern the parent
- [ ] email provider
- [ ] no, unless a child's name appears in a progress email
- [ ] voice/audio provider, if any child-facing audio is generated or processed
- [ ] this one needs the closest look. Pre-generated audio served to a child is not the same as a child's input being sent to a vendor.
- [ ] analytics provider, if any
- [ ] analytics on a child-directed service is the classic COPPA trap. If any analytics runs in a child's session, it must be reviewed before launch.
- [ ] error monitoring, if any
- [ ] error reports often carry identifiers and sometimes user content
- [ ] add every other vendor
- [ ] list the internal tools and any vendor deliberately kept away from production children's data, so the boundary is written down and can be checked.

## 08-cookie-and-tracking-notice.md  (16 total, 6 unique)

- [ ] date
- [ ] cookie or key name
- [ ] 
- [ ] e.g. caching lesson content and audio so the app works offline and uses less data
- [ ] this must be verified against the running app before it is published. If any third-party script runs in a child's session, this line is false and the script must be removed or disclosed.
- [ ] if any non-essential cookie is ever added, this section must be replaced with a real consent mechanism, and the default must be off.

## 09-email-compliance.md  (3 total, 3 unique)

- [ ] confirm with the attorney whether this applies to our sends, given the recipient relationship.
- [ ] which address Radlor will use.
- [ ] where the suppression list lives and which system enforces it.

## 11-privacy-policy.md  (15 total, 11 unique)

- [ ] ...
- [ ] date
- [ ] if any other company operates any part of the service such that it collects information through it, COPPA requires that operator to be named here.
- [ ] the exact list, read off the running application: session identifier, IP address, browser/device type, any storage keys
- [ ] e.g. a payment reference, the last four digits, the card brand, the billing postcode
- [ ] in-app path
- [ ] period, matching the Data Retention Policy
- [ ] period
- [ ] two or three sentences describing the safeguards actually in place, taken from the Information Security Program. Do not describe a control that is not implemented — a security claim that turns out to be untrue is a problem in its own rig
- [ ] confirm this against the hosting and database regions actually in use.
- [ ] state how the service treats users aged 13–17. COPPA does not cover them, but several state privacy statutes do, and the product should have a deliberate answer rather than an accidental one.

## 12-terms-of-service.md  (11 total, 9 unique)

- [ ] ...
- [ ] date
- [ ] ATTORNEY: the previous draft said this material "is protected by copyright and other laws". Most of the lesson content is AI-generated. In the United States, material produced by a machine without sufficient human authorship is not prote
- [ ] describe the actual review process. Do not claim a level of human review that is not performed.
- [ ] state the remedy: a pro-rata refund, or the right to cancel
- [ ] a floor amount
- [ ] designated agent name, address, email, and phone. To rely on the DMCA safe harbour the agent must also be registered with the US Copyright Office. Confirm with the attorney whether registration is needed given that the Service hosts litt
- [ ] number
- [ ] ARBITRATION AND CLASS ACTION WAIVER. This is a deliberate business decision, not a blank to be filled casually. If Radlor wants binding arbitration and a class-action waiver, the attorney must draft it, including the opt-out right and th


**Total placeholder occurrences still open: 184**