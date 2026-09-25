# Attorney packet — Radlic (Radlor Inc.)

**For:** the US attorney reviewing Radlor's legal drafts before any page is published.
**Prepared:** 23 September 2026, from the repository and from what was measured on production that day.
**Length:** about 20 minutes to read. Every question has three parts: **Today** (what the product actually does, measured), **Draft** (what our document says), and **Decide** (what we need from you).

## Context in one paragraph

Radlic is a maths app for children in grades 3 to 8 in the US. A **parent** (or teacher) holds the account; children never give an email address. Every child profile requires **verifiable parental consent by "email plus"**: an on-screen notice, an email the parent must click ("I give permission"), and a second confirming email about a day later that carries a withdrawal link. That gate is **live on production with no exemptions**: the database refuses to store a child without a granted consent record (measured 23 September 2026). Every legal page (`/legal/privacy`, `/terms`, `/refunds`, `/parent-rights`, `/subprocessors`, `/cookies`, `/retention`) is deployed but **dark**. It shows a "draft — not in force" banner and no body, and the build refuses to publish a page until its placeholders are resolved, its `STATUS: DRAFT` line is gone, **your sign-off is recorded**, and a reviewed Spanish version exists. **No real family has been invited**; every account on production is a team or intern test account (the founder's statement). **No payment has ever been taken**: billing code exists but enforcement is off.

The documents referred to below are in `docs/legal/`. They are numbered 01 (Refund & Cancellation), 02 (Direct notice), 03 (Consent & checkout screen copy), 04 (Retention), 05 (Security program), 06 (Parent rights), 07 (Subprocessors), 08 (Cookies), 09 (Email), 11 (Privacy Policy) and 12 (Terms).

**Product renamed to Radlic and moved to radlic.com on [date]. Trademark clearance for 'Radlic' has not been done.** (Added 24 September 2026. The product was called Milo, then AdaptiveLearn at adaptivelearn.radlor.com, which now redirects. The company is unchanged: Radlor Inc. The rename changed the consent notice, so it is a new version, `notice-v6`; see A11.)

---

## A. Children's consent (COPPA) — decide before the first real family

### A1. Withdrawal: one child, or the whole account? *(06 note 0, 06 Part A §4, 12 §4)*
- **Today (after the consent-once change, see A8):** a parent can withdraw for **one child** (deleting that child's profile: every row about them and their own sign-in; the account, its consent and the other children stay) or for **every child** (Account → *Withdraw permission for all your children*, or the second email's link: every child deleted, the consent record kept as `withdrawn`, the account stays open with no children, and a new child needs a new consent). Single-child deletion was proven on real production rows on 23 September 2026; the every-child path is built and tested, not yet run on production.
- **Draft:** until Round 1, docs 06 and 12 said withdrawal **closes the whole account**, including other children, with a pro-rata refund. They now describe the build (Round 1, PR #195). The notice, both emails and the withdrawal screen already said "your account stays open".
- **Decide:** (a) Does per-child withdrawal satisfy the revocation right, or must or should withdrawal close the account? (b) What happens to a subscription when consent for one child is withdrawn (see C4)?

### A2. Consent records and account closure *(12 §4 placeholder, 04 §3 placeholder, 11 §9 "Consent records" period, 03 note 4, 02 note 4)*
- **Today:** each consent is a row recording the method, the state (`pending` → `granted` → `withdrawn`/`declined`/`expired`), the version and content-hash of the notice, Privacy Policy and Terms shown, the language, the parent's email, and the timestamps. **Withdrawing or deleting a child keeps the record**; **closing the whole account deletes every consent record** (a database cascade from the parent's account).
- **Draft:** the Terms say, truthfully, that closing the account deletes the record, and flag that this is the opposite of what consent record-keeping usually wants. The retention period for consent records is blank in the Privacy Policy.
- **Decide:** (a) Must an anonymised consent log survive account closure, and if so, what may it contain (for example: the consent id, method, versions and timestamps, with no email and no child)? (b) For how long must consent records be kept? We will build whatever you specify; nothing will be invented in the meantime.

### A3. Schools and teachers *(05 §placeholder "can a school consent")*
- **Today:** teachers can create classes, but **adding students is paused**. The roster screen says "Adding students is paused", because the consent gate refuses any child without a parent's consent and no school-consent route exists.
- **Decide:** Can a school or teacher consent on the parent's behalf for this product (the school-authorisation route), and under what conditions: written agreement, educational-purpose limits, the notice to the school, and parents' rights through the school? Until you answer, the teacher path stays paused.

### A4. Email plus: availability, delay, and a second method *(03 notes 2–3, 03 B3 timing placeholder, 02 placeholder on a second method)*
- **Today:** the second email is sent **24 hours** after the grant (the code refuses anything outside 24–48 hours in production, because the email opens "Yesterday you gave permission"). Only email-plus is built; the payment-card method in doc 03 is not.
- **Decide:** (a) Confirm email-plus is permitted given our vendor set. No child data goes to any third party for its own purposes. The only processors are our database (Supabase) and hosting (Vercel). (b) Confirm or set the delay. (c) If card verification is ever added, whether a transaction at our prices qualifies under § 312.5(b)(2).

### A5. What the notice must contain, and what counts as personal information *(02 notes 1–3, 11 notes 1, 4; 04 note 2; 07 note 2)*
- **Today:** the notice lists, row by row, what is stored. Since Round 1 it says the **lessons chosen and a grade band** (grades 3–5 or 6–8, stored as the age range 9–11 or 12–14), not "grade level", which was never stored. The list also covers device identifiers and an IP-derived city/region/country. Our database provider's own platform logs record the IP, browser and approximate location **for every request**, outside our tables and outside our deletion jobs. First-party product events are kept for 90 days, keyed to the child's internal id.
- **Decide:** (a) Does the notice contain every § 312.4(b)/(c) element? (b) How should the provider's platform logs and our first-party events be characterised, and does the support-for-internal-operations exception cover them? (c) The online notice (Privacy Policy) against § 312.4(d).

### A6. Ages 13 to 17 *(02 note 5, 03 note 5, 11 note 5, 12 note 1)*
- **Today:** consent is asked for **every** child regardless of age. Grades 6–8 include 13- and 14-year-olds. There is no age gate; the product never asks a child's age.
- **Decide:** What changes for 13–17-year-olds under state privacy law, and do we need an age question at all, given that we deliberately collect none?

### A7. Spanish — the standard *(02 note 6)*
- **Today:** the consent notice, both consent emails and the withdrawal screen **render in Spanish for a Spanish-language parent**. That text was machine-translated and **no Spanish speaker has reviewed it**. Consent records store the language, so consents given in Spanish can be found and re-asked. Spanish drafts of the seven legal pages were prepared in Round 1 and **cannot render until a named reviewer signs them** (a build guard).
- **Decide:** (a) What standard must a Spanish legal text meet: certified translation, a qualified reviewer, or something else? (b) Which version controls if they differ (see D6)? (c) May the unreviewed Spanish consent text stay live until review, or should Spanish-language parents see English meanwhile?

### A8. One consent per parent account, plus an attestation for each child *(new, 24 September 2026; docs 02, 03, 06, 11, 12)*
- **Today (built, not yet on production):** at signup the parent reads the notice (a summary with the full notice one tap away) and ticks *"I'm a parent or legal guardian, I've read what we collect, and I agree."* Both signup buttons stay disabled until they tick. Then **one** email-plus round: B1 with *"I give permission"*, and the automatic B3 a day later. That single consent covers every child the parent adds to the account. For each child added later there is **no email**: the parent ticks an unticked box, *"I'm this child's parent or legal guardian. The permission I gave on {date} applies to this child too."* The database records, on the child, who ticked it, when, and which notice version it referred to, and it refuses to store any child without both the account consent (granted, current) and that tick.
- **Decide:** (a) **Is one verifiable consent per parent account, plus an in-app parental attestation for each later child, sufficient under COPPA's email-plus method?** (b) **When must we re-obtain consent after a notice change?** The build has a switch per notice version. When it is set, every older consent stops counting and parents are re-asked before any further collection; it is not set for any version today. (c) Is the attestation wording enough, and must a parent be re-notified when they add a child long after consenting?

### A9. "Option B": no click in B1 *(proposed, not built)*
- **What it would be:** the checkbox before signup, the Google-verified (or confirmed) email address, and the automatic B3 confirmation a day later, with **no** "I give permission" click in B1. That is one fewer step for parents.
- **Why it is less certain:** email-plus is described as the parent *responding* to an email plus a confirming follow-up. A pre-signup checkbox is a website click, which the FTC has not treated as verifiable on its own. A Google-verified address proves control of the inbox, not agreement to the notice. Without the click, the only step taken from the inbox is the optional withdrawal link.
- **Decide:** would Option B satisfy § 312.5(b), and if so, with what wording in the (then informational) first email?

### A10. Could the signup confirmation email be the consent email? *(BUILT 2026-09-25, founder's decision — in a form that answers the objections below)*
- It would save one email, and only for email/password parents. **Google sign-in parents get no confirmation email**, so they would need B1 anyway: two flows instead of one. The auth service's templates live in its dashboard (not in our versioned code) and cannot schedule B3. A confirmation click proves control of an inbox, not agreement to the notice. The same email type is also used for password resets and address changes, which muddies the evidence.
- **Built (2026-09-25):** not the auth service's template, but **our own** email (doc 03 B0), sent from our code instead of the auth service's confirmation: B1's words, and one button that confirms the address and opens the consent page, where ticking the box is the grant — exactly B1's mechanism. **B3 is still scheduled a day after the grant and cancelled on withdrawal**, so it stays email-plus (recorded as `email_plus`). A password reset or address change never uses it. Google parents get B1, as before.
- **Decide:** does combining the address confirmation with the consent request change anything under § 312.5(b)(2)?

### A11. The rename: does a parent who agreed to the old notice have to agree again? *(new, 24 September 2026; doc 02)*
- **Today (once the rename ships):** the notice a parent agrees to changed only in the product's name and web address (Milo → Radlic, adaptivelearn.radlor.com → radlic.com), plus one wording fix ("Withdraw permission for all **your** children", matching the button). What is collected, why, and every right are unchanged. It is recorded as a new notice version, `notice-v6`. We set it so that **earlier consents stay valid** (no one is asked again).
- **Draft:** doc 02 as renamed.
- **Decide:** is a change of product name and domain, with nothing else changed, a "material change" that requires fresh consent from parents who agreed to the old notice? If yes, one setting makes every earlier consent non-current and each parent is asked again the next time they add a child. Also: trademark clearance for "Radlic" (education software / online classes) has not been done.

### A12. Nothing about consent on the signup page *(new, 25 September 2026; doc 03, doc 02)*
- **Today (founder's call, branch `kg-to-8`, not merged yet):** the signup page no longer shows the "what we collect" summary, the "I'm a parent or legal guardian… I agree" tick box, or the teacher opt-out. It still links the Terms and Privacy Policy above the button. A new parent sees the **full notice (doc 02) on the dashboard**, presses "I'm the parent or legal guardian — continue", and that sends the email-plus request (B1). The request is no longer sent automatically. B1, the "I give permission" click and the B3 follow-up are **unchanged**, and the database still refuses a child without a granted consent.
- **Decided and not built:** the founder first asked to drop the email step and keep only a checkbox. The engineering agent declined to build that without your written sign-off, because a checkbox alone is not verifiable consent under § 312.5(b). The founder then kept the email and dropped the checkbox.
- **Decide:** is it enough that the direct notice is shown and the email request is started from the dashboard, with no notice or acknowledgement at signup? (A9 "Option B" assumed the signup checkbox, which is now gone.)

### A13. A shorter consent email; the "yes" is a tick box on our page that reads "I’ve Read and I Agree to the Privacy Policy." *(new, 25 September 2026; doc 03 B1, B1b)*
- **Today (founder's call, branch `kg-to-8`, not merged yet):** B1 greets the parent by first name (typed at email signup, or taken from their Google profile), lists what we store in four short lines, and says we never sell or advertise. Then comes "Here's our detailed Privacy Policy: [link]", and under it **"☐ I’ve Read and I Agree to the Privacy Policy."**: a link drawn as an empty checkbox (a working checkbox cannot be put inside an email, because mail clients strip form controls). The earlier text ("Someone — we believe you — …", the seven-line list, the "one permission covers every child" paragraph and both buttons) is gone from the email. The link opens our page, which shows the "covers every child … you confirm you are that child's parent or legal guardian" paragraph, the same Privacy Policy line, and the same box, unticked. **Ticking it records the permission; there is no separate button.** "No — cancel this request" is below it. Clicking the link alone grants nothing, because mail scanners open every link. B3 a day later is unchanged.
- **Decide:** (1) does the shortened B1 still carry every element § 312.4(c)(1) requires of an email-plus request, given that the full notice (doc 02) is shown on the dashboard right before it is sent? Must the email itself say that we delete the parent's address if no consent arrives? (2) The tick now reads as agreement to the **Privacy Policy**, not as permission to collect the child's information. The permission framing is only in the email subject, the page heading and the paragraph above the box, and the parent-or-guardian statement is in that paragraph and in the per-child confirmation in the app. Is a Privacy Policy acknowledgement enough as the parent's consent act, or must the tick itself say "I give permission"?

---

## B. Parent rights — needed before the Parent Rights page publishes *(06 notes 1–5)*

- **Today (all in the app, owner only):** **see** (a downloadable copy of every table about the child, verified to contain no other family's rows); **correct** (name, avatar and grade band, since Round 1); **delete** a child; **withdraw**; **close the account** (requires a sign-in within the last 10 minutes). All are also available by email to support@radlor.com.
- **Decide:** (B1) one internal deadline that meets the strictest statute (drafts say 10 days); (B2) whether verification by a confirmation link to the account email is sufficient and not excessive; (B3) that no "refuse third-party disclosure" option is needed, since no third party receives child data for its own use; (B4) appeal rights; (B5) what we must keep about a completed request.

---

## C. Subscriptions and auto-renewal — decide before the first payment

### C1. ARL / ROSCA / negative option *(01 notes 1–3, 12 note 2, 03 note 1)*
- **Today:** no payment has ever been taken. Checkout exists but enforcement is off. **In-app cancellation now exists** (Round 1, PR #188): Account → Plan → Cancel subscription, with a confirmation screen and a confirmation email. Cancellation takes effect at the end of the paid period. **The built checkout has no consent checkbox.** Next to the Continue button it shows the price, "renewing until you cancel", and links to the Terms, Privacy Policy and Refund Policy (`/parent/plan`). Doc 03's screen A1 specifies **one** checkbox bundling COPPA consent, the Terms and Privacy Policy, and auto-renewal consent. That checkbox is not built.
- **Decide:** (a) Do docs 01 and 12 plus the built flow satisfy the ARL (California and the other states we will serve) and ROSCA? Set the reminder and notice windows. (b) Is an explicit affirmative-consent control required before the first charge (we assume yes, under the ARL)? If so, must it be separate from the Terms/Privacy agreement, and in what exact words? We will build exactly that. (c) The current federal position on "click to cancel" after the 2025 vacatur.

### C2. Refund stance *(01 note 4)* — a 14-day satisfaction window is adopted. Confirm it against state refund rights.
### C3. Service-change remedy *(12 §9 placeholder)* — choose a pro-rata refund or the right to cancel when a change materially reduces what was paid for.
### C4. Subscription on consent withdrawal *(new placeholder, 06 §4 and 12 §4)* — nothing cancels or refunds today. The earlier text promised both. Decide before billing goes live.
### C5. Purchases by parents of children *(01 note 5b)* — any extra protections needed?

---

## D. Terms of Service

### D1. Arbitration and class-action waiver *(12 §15 placeholder, note 6)* — a business decision. If adopted, please draft it with the opt-out and formatting courts require. Also confirm **Delaware** governing law for a nationwide consumer product.
### D2. Liability floor *(12 §12 placeholder, note 7)* — the cap is "the greater of 12 months' fees or [floor]". Set the floor and confirm the carve-outs.
### D3. Who owns the content, and AI *(12 §6 placeholder)*
- **Today:** most lesson content (explanations, questions, voice clips) is AI-generated. The repository's own records say much of it has **not been read by a human**: the Grade 6–8 lesson text is unread, the voice clips are unheard, and some practice ladders are checked only by an automated "blind solver". *(As recorded in the project handoff, 23 September 2026.)*
- **Decide:** (a) What to claim instead of blanket copyright (we expect selection, arrangement, the Terms as a contract, and acceptable use). (b) The AI disclaimer (§8) for content aimed at children, where "a wrong answer taught confidently" is the realistic failure. (c) The §8 placeholder "describe the actual review process": we will describe only what is actually done. Tell us what minimum is required.
### D4. DMCA agent *(12 §14 placeholder, note 5)* — the service hosts little or no user-posted material. Is registration with the Copyright Office warranted? If so, the founder supplies the agent's details.
### D5. Model training *(11 note 2, 12 note 3)* — Radlor commits that children's work is never used to train models. **Today:** no child input reaches any AI or text-to-speech provider at runtime, and every clip is a static file (measured). Confirm the wording and that vendor terms must be re-checked whenever a vendor is added.
### D6. Which document controls
- **Draft:** doc 01 says the Terms control over the Refund Policy, and the Terms' "entire agreement" clause names Terms + Privacy + Refund. Nothing says how the **Parent Rights page**, the **in-app notice**, the **consent emails**, or the **Spanish versions** rank against these.
- **Decide:** the order of precedence, including English over Spanish (or not).
### D7. Notice periods *(12 §15 and §16 "number" placeholders)* — set the days we have to answer before formal proceedings, and the days' notice before material changes to the Terms. · **D8.** Advertising claims and testimonials at launch *(12 note 8)*. · **D9.** The parent-as-sole-party structure *(12 note 1)*.

---

## E. Privacy, retention, security, email

- **E1. Retention periods still open** *(04 note 1, 04 §1 placeholders)*: sign-in events, child profiles, progress, points, feedback and learner stats have **no scheduled deletion** today. Only four jobs delete anything: product events, 90 d; diagnostic items, 90 d; crash records, 90 d; leads, 24 months. Round 1 adds a fifth: **unconfirmed accounts with no child, deleted after 3 days** (PR #194, not yet applied). Please set the periods.
- **E2. De-identified aggregates** *(04 note 5)*: may they be kept indefinitely, and to what standard? None exist today.
- **E3. Security program** *(05 notes 1, 3–5)*: the written-program requirement at our size; state breach-notification timelines for §6; written agreements with hosting and database providers; interns (doc 15). Backups: nightly, encrypted, restore proven on 23 September 2026 *(05 note 2: confirm nothing further is owed for the 10–22 September gap, when no real child data existed)*.
- **E4. Service providers vs disclosures** *(07 notes 1, 3–4; 11 notes 3, 7)*: confirm Supabase and Vercel are service providers, not disclosures. Confirm the treatment of the encrypted backup artifact and whether the merger/sale clause is acceptable for children's data.
- **E5. CCPA/CPRA thresholds** *(11 note 6)*.
- **E6. Cookies** *(08 notes)*: the product sets **no cookies**, only necessary on-device storage. Is a separate notice needed, and does "no banner" hold in every state for a child-directed service?
- **E7. Email (CAN-SPAM)** *(09 notes, 09 §2.3 placeholder)*: **today every email the product sends is transactional**: sign-up and security mail, the two consent emails, and, from Round 1, the cancellation confirmation. There is no marketing email. Round 1 built a suppression list and one-click unsubscribe for the first commercial email (PR #197). Please confirm the classification, whether the "advertisement" label applies, and that the Newark mailbox address qualifies.
- **E8. Public boundaries.** Each page shows only part of its document (engineering set the cut). The retention page's public part includes a paragraph opening "Known defect — deletion is …" that is now resolved. **You sign off the boundary, not just the text.**

---

## Decided by the founder for the beta (24 September 2026) — attorney to review

A private beta with families the founder knows (real US children) starts **25 September 2026**, before you have
reviewed anything. The founder decided each point below for the beta; **every one is "decided by founder for
beta on 2026-09-24, attorney to review"**. Only what the product does is described; nothing unbuilt is promised.
Published in English only (the Spanish drafts stay unpublished and unreviewed), with a banner: *"Beta version. In
effect from 25 September 2026. We will email parents before we make any material change to it."*

| # | Where | Decision (decided by founder for beta on 2026-09-24, attorney to review) | Questions this touches |
|---|---|---|---|
| — | Which pages | **Published:** Privacy Policy, Parent rights, Subprocessors, Cookies, Retention. **Dark:** Terms (two points below still open), Refund policy (billing is off). | — |
| — | The beta is free | Terms §5 now says the beta is free and no payment is taken, and that parents will be emailed and asked to agree to updated Terms before any paid plan. Subscription, refund and "amount paid" text removed from Terms and Privacy; the plan card and plans page are hidden while `BILLING_LIVE` is false; Stripe is listed as "not used during the beta". | C1–C4 |
| 57, 24 | Terms §4; Retention §5 | A consent record is **deleted with the account**, as the system does today. No anonymised consent log survives deletion (none is built). | A2 |
| 50 | Privacy §9 | Consent records: kept until the account is closed; a withdrawn consent is kept, marked as withdrawn. | A2 |
| 58, 34 | Terms §4; Parent rights | What withdrawal does to a subscription: **left out for the beta** (there is no subscription). "You are never charged for exercising a privacy right" stays. | A1, C |
| 59 | Terms §7 | Ownership line kept (the Service belongs to us or our licensors, used under a licence), plus: *"We do not claim copyright in any part of the Service beyond what the law gives us; your use is governed by this licence and by these Terms."* No blanket copyright claim. | D |
| 61 | Terms §9 | If a change is unwanted: *"you can stop using the Service and close your account at any time."* No refund promise (nothing is paid). | D |
| 64 | Terms §15 | Informal resolution first: we reply within **30 days**. | D |
| 65 | Terms §15 | **No arbitration and no class-action waiver.** The Delaware courts clause applies. | D |
| 66 | Terms §16 | Material changes to the Terms: emailed at least **14 days** before they take effect. | D |
| 68 | Terms §14 | The copyright agent is **not registered** with the US Copyright Office for now; the note was removed and no safe-harbour claim is made. | D |
| 52 | Privacy §10 | The security paragraph was checked against the Security Program on 24 Sep 2026. One claim was reworded to what is implemented: internal records are in a separate system with no children's data, and the in-product admin view shows only totals, never an individual child. | E |
| 44 | Cookies | A promise: no storage the app does not need will be added without asking first, and it will be off unless switched on. | E |
| **62** | Terms §11 | **Still open:** the liability floor. Terms stays dark until the founder decides it. | D |
| **67** | Terms §14 | **Still open:** a phone number for copyright complaints, or §14 reworded as a plain contact. Terms stays dark until decided. | D |

Measured facts entered at the same time (not decisions): provider log windows (hosting 1 hour on Hobby, database 7
days on Pro, from the dashboards), GitHub backup location and 30-day expiry, no Stripe key in production, the two
browser-storage rows seen in a live child session.

**Doc 08, added after publication (founder-approved 24 Sep 2026, #219):** a functional local-storage row `al-text-size` (the text size chosen on the device; nothing kept for Normal) and one sentence in the signed-out paragraph; "Effective" kept at 25 Sep 2026; a "Last updated" line carries the day #219 merges. Please confirm a new functional row needs no fresh notice.

## What we are not asking you
Prices, dates, regions, the DMCA agent's identity, provider log-retention periods and the reviewer's name are the founder's or providers' to supply. They are tracked in `PLACEHOLDERS.md`.
