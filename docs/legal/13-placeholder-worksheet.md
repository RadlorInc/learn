# Placeholder Fill-In Worksheet

> Every `[PLACEHOLDER — ...]` in the draft set, listed per document. Fill these in and the drafts stop being skeletons.
> Nothing here should be guessed. A placeholder left empty is safe; a placeholder filled with something untrue is not.

**Decisions already made (22 Sep 2026) — do not re-open casually, they are now written into several documents:**
- Child data collected: first name/nickname, grade level, learning progress. Nothing else from the child.
- Parental consent: payment card for paying subscribers, email-plus for anyone starting without payment.
- Billing: monthly and annual, both auto-renewing. No free trial.
- Children's work is **never** used to train or develop AI models, and is never given to anyone else for that purpose.
- Withdrawing consent closes the whole account and triggers a **pro-rata refund** of the unused period. A separate *Remove this child* path deletes one child without ending the account.

## 01-refund-and-cancellation-policy.md  (29 total, 22 unique)

- [ ] ...
- [ ] product name as it appears to customers
- [ ] effective date
- [ ] last updated date
- [ ] product name
- [ ] state which document controls
- [ ] monthly price, USD
- [ ] annual price, USD
- [ ] state whether a free trial is offered. If a free trial is ever offered, this policy must be amended to add the trial length, the date of the first charge, and the amount of that charge, disclosed before the parent enrols.
- [ ] number of days; several state statutes require a reminder window for annual terms
- [ ] exact in-app path, e.g. Account → Subscription → Cancel subscription
- [ ] support email address
- [ ] number of business days
- [ ] company mailing address
- [ ] describe the post-cancellation state: closed, or limited free access
- [ ] Radlor Inc. must choose a refund stance here and state it plainly. Two workable options are set out below; delete the one not adopted. An attorney should confirm the chosen stance against the laws of the states where customers are locate...
- [ ] number
- [ ] state the remedy
- [ ] number of days
- [ ] state what happens: pause, downgrade, or close
- [ ] company legal name and mailing address
- [ ] telephone number, if one is offered; several state statutes and payment-network rules expect a contact method to be published

## 02-coppa-direct-notice-to-parents.md  (16 total, 14 unique)

- [ ] ...
- [ ] product name
- [ ] version and date
- [ ] list exactly: IP address, device or browser type, session identifier, cookies or local storage keys
- [ ] Radlor must state here, truthfully and specifically, whether any of the child's information is disclosed to any third party, and if so to whom and for what purpose. The list of service providers in the Subprocessors document must match t...
- [ ] this sentence applies only if any third-party disclosure actually occurs; delete it if not
- [ ] exact mechanism: in-app path AND email address
- [ ] number
- [ ] URL
- [ ] one or two sentences summarising the security measures actually in place, drawn from the Information Security Program document. Do not describe a control that is not implemented.
- [ ] company legal name
- [ ] mailing address
- [ ] email address
- [ ] telephone number, if offered

## 03-consent-and-checkout-screen-copy.md  (29 total, 14 unique)

- [ ] plan name
- [ ] amount
- [ ] month / 12 months
- [ ] in-app path
- [ ] support email
- [ ] URL
- [ ] product name
- [ ] parent first name
- [ ] every month / every 12 months
- [ ] date
- [ ] URL of the parent rights page
- [ ] company legal name, mailing address
- [ ] delay; a reasonable time after the first, commonly 24 hours. Confirm with the attorney.
- [ ] number

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
- [ ] Radlor should record here the current state of the historical event data and the planned rollup, so that the retention schedule above and the actual behaviour of the system do not contradict each other. A retention policy that is publish...

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
- [ ] email address and phone
- [ ] record how this is evidenced.
- [ ] confirm this is true of every current contractor.

## 06-parent-rights-procedure.md  (23 total, 16 unique)

- [ ] date
- [ ] product name
- [ ] number
- [ ] in-app path
- [ ] exact path
- [ ] email address
- [ ] mailing address
- [ ] describe the verification step actually used, e.g. send a confirmation link to the account email
- [ ] state whether there is an appeal route, and what it is.
- [ ] where the log lives.
- [ ] table list
- [ ] method
- [ ] 
- [ ] exact table list
- [ ] support email address
- [ ] any other channel, e.g. app store reviews, social media DMs

## 07-subprocessors.md  (38 total, 21 unique)

- [ ] date
- [ ] name
- [ ] hosting provider
- [ ] yes/no
- [ ] e.g. IP address and request logs
- [ ] US
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

## 08-cookie-and-tracking-notice.md  (18 total, 8 unique)

- [ ] date
- [ ] product name
- [ ] cookie or key name
- [ ] 
- [ ] e.g. caching lesson content and audio so the app works offline and uses less data
- [ ] this must be verified against the running app before it is published. If any third-party script runs in a child's session, this line is false and the script must be removed or disclosed.
- [ ] if any non-essential cookie is ever added, this section must be replaced with a real consent mechanism, and the default must be off.
- [ ] email address

## 09-email-compliance.md  (10 total, 7 unique)

- [ ] confirm with the attorney whether this applies to our sends, given the recipient relationship.
- [ ] which address Radlor will use.
- [ ] product name
- [ ] Radlor Inc. full legal name
- [ ] full postal address, city, state, ZIP
- [ ] support email address
- [ ] where the suppression list lives and which system enforces it.

## 11-privacy-policy.md  (33 total, 22 unique)

- [ ] ...
- [ ] product name as shown to customers
- [ ] date
- [ ] Radlor Inc. full legal name
- [ ] mailing address
- [ ] contact email
- [ ] telephone number, if offered
- [ ] product name
- [ ] if any other company operates any part of the service such that it collects information through it, COPPA requires that operator to be named here.
- [ ] the exact list, read off the running application: session identifier, IP address, browser/device type, any storage keys
- [ ] e.g. a payment reference, the last four digits, the card brand, the billing postcode
- [ ] in-app path
- [ ] email address
- [ ] number
- [ ] URL
- [ ] URL of the subprocessors page
- [ ] period, matching the Data Retention Policy
- [ ] period
- [ ] two or three sentences describing the safeguards actually in place, taken from the Information Security Program. Do not describe a control that is not implemented — a security claim that turns out to be untrue is a problem in its own right.
- [ ] confirm this against the hosting and database regions actually in use.
- [ ] state how the service treats users aged 13–17. COPPA does not cover them, but several state privacy statutes do, and the product should have a deliberate answer rather than an accidental one.
- [ ] company legal name

## 12-terms-of-service.md  (23 total, 14 unique)

- [ ] ...
- [ ] product name
- [ ] date
- [ ] URL
- [ ] confirm the intended household/seat limit
- [ ] describe the actual review process. Do not claim a level of human review that is not performed.
- [ ] email address
- [ ] state the remedy: a pro-rata refund, or the right to cancel
- [ ] a floor amount
- [ ] designated agent name, address, email, and phone. To rely on the DMCA safe harbour the agent must also be registered with the US Copyright Office. Confirm with the attorney whether registration is needed given that the Service hosts litt...
- [ ] number
- [ ] ARBITRATION AND CLASS ACTION WAIVER. This is a deliberate business decision, not a blank to be filled casually. If Radlor wants binding arbitration and a class-action waiver, the attorney must draft it, including the opt-out right and th...
- [ ] company legal name
- [ ] mailing address


**Total placeholder occurrences across the set: 277**