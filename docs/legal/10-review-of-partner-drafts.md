# Review of the Three Documents from Rakif

**Reviewed:** 2026-09-22
**Documents:** Terms and Conditions (v. 23 Aug 2026) · Privacy Policy / "COPPA Disclaimer" (v. 23 Aug 2026) · COPPA Key Implementation Notes

> **Not legal advice.** This is a gap review against what the product actually does, so that the attorney's time is spent on decisions rather than on finding contradictions.

---

## The headline

**The Privacy Policy describes a different product from the one being built.**

It says, in four separate places, that Radlor collects **no** personal information from children and **no** persistent identifiers. The product, as confirmed on 22 September, collects from each child:

- a first name or nickname
- a grade level
- every answer, score and progress record, stored against that child's profile
- and, like any web application with sign-in, a session identifier — plus IP addresses in the hosting logs

Those learning records are stored on Radlor's own database, keyed to a child profile that persists across sessions and devices. That is the opposite of "we do not collect."

**Why this matters more than an ordinary drafting error.** An inaccurate privacy policy is not merely an incomplete one. A published statement that the company collects nothing, when it collects, is a false statement about a material fact — the kind the FTC treats as a deceptive practice under Section 5, independently of COPPA. A policy that accurately discloses collection and obtains consent is a far safer position than a policy that claims collection does not happen.

**So there are only two honest paths, and they must be chosen deliberately:**

| Path | What it means | Cost |
|---|---|---|
| **A. Change the policy to match the product** | Disclose what is collected, give parents the direct notice, take verifiable consent, honour parent rights, publish a retention policy. This is what drafts 02–08 already do. | More documents, more flow work. No product change. |
| **B. Change the product to match the policy** | Genuinely collect nothing about a child: no stored name, no per-child profile on the server, no learning history on the server. Progress would have to live only on the device. | The parent progress reports, the topic picker and adaptive teaching across devices largely stop working. This is a product decision, not a legal one. |

Path A is almost certainly the answer, because the learning history *is* the product. But it has to be said out loud, because the document Rakif sent assumes Path B.

---

## Privacy Policy — specific problems

### 1. "No Persistent Identifiers: We do not use cookies, IP addresses, or device IDs"

Cannot be true of an application with a login. A signed-in session requires a token or cookie; the hosting provider records IP addresses in its logs by default. Under COPPA a persistent identifier that recognises a user over time **is** personal information, with a narrow exception for support for internal operations. The honest version is: we use these, only for these purposes, and never for tracking or advertising.

### 2. "Payment Information: we collect ... card number, expiration date, CVV"

This should not be true, and Radlor should not want it to be true. Card numbers and CVV go to the payment processor; Radlor never receives them and must never store them. Storing a CVV is prohibited outright under the card-network rules. The sentence claims a practice that is both false and, if it were true, a serious problem. Replace with: payment is processed by our payment provider; we receive only a reference, the last four digits and the billing details needed for the transaction.

### 3. Section 6 — "there is no personal information for parents to review, delete, or restrict"

Follows from the false premise. Parents will have real rights, and the amended Rule expects them to be described and serviceable. Draft 06 covers this.

### 4. Missing elements the amended COPPA Rule expects in the online notice

- The **retention policy** must be disclosed in the notice, not only kept internally.
- The identity and contact details of **every operator** collecting information through the service.
- What happens if a parent **refuses or withdraws** consent.
- **Separate consent** for any disclosure of a child's information to a third party, where that applies.
- The notice must be linked **prominently on the homepage and at every point of collection** — Rakif's implementation notes make this point, and it is correct.

### 5. Vendors are not mentioned at all

"No third-party data sharing" is stated, but hosting, database, email and payment providers all process data on Radlor's behalf. Service providers are not the same as selling data, and saying so plainly is stronger than a blanket denial that a reader could disprove. Draft 07 is the list.

### 6. Housekeeping

- "Last Updated: 08232026" — should be a readable date.
- Title of the file is "COPPA Disclaimer" but the document is a Privacy Policy. Name it for what it is.

---

## Terms and Conditions — specific problems

### 1. The age clause contradicts itself

Section 3 says you must be **at least 18** to create an account, then says if you are **under 18** you represent you have parental consent. Both cannot stand. For this product the correct structure is: the account holder is an adult; a child does not hold an account but uses a profile under the parent's account; the parent is responsible for that use. The child is not a party to the contract.

### 2. "to provide **and improve** the Service"

The User Content licence in Section 5 includes improving the service. Read plainly, that permits training AI models on children's work. Whether or not that is intended, it should be stated deliberately rather than arriving through a boilerplate phrase — and if children's content is never used for model training, say so, because it is a genuine selling point to parents.

### 3. "AI-generated outputs remain subject to our ownership and license rights"

Ambiguous. If a child writes an answer and the system produces feedback, who owns what? Worth one clear sentence.

### 4. Subscription section is too thin for state auto-renewal law

Section 7 says subscriptions renew automatically and refunds follow a Refund Policy "available at [link]" — a link that does not yet exist. State automatic renewal statutes require specific pre-purchase disclosure, affirmative consent, a post-purchase acknowledgement, renewal reminders for annual terms, and easy online cancellation. Draft 01 and the checkout copy in draft 03 supply this; the Terms need to point at them.

### 5. No children's section

The Terms of a child-directed service do not mention children, COPPA, parental consent, or the direct notice. There should be a section that ties the Terms to the Privacy Policy and the consent flow.

### 6. Missing, worth an attorney's view

- Arbitration and class-action waiver — a deliberate choice either way, not an oversight to leave blank.
- DMCA / copyright complaint process and a designated agent.
- Notice that the educational disclaimer in Section 2 survives termination.
- A statement about what happens to a child's data when an account terminates — draft 04 and draft 06 cover the mechanics.

### 7. Housekeeping

- Address reads "**Nework** DE 19702" in the Terms and "Newark DE 19702" in the Privacy Policy. Same address, two spellings.
- `[link]` in Section 7 is an unresolved placeholder in a document that may already be public.

---

## COPPA Key Implementation Notes — comments

| Point | Assessment |
|---|---|
| **1. Credit card as verifiable parental consent** | Correct as a method, and it is the right choice here. Two caveats: the traditional formulation requires the card to be used *in connection with a monetary transaction*, so it only covers paying subscribers — anyone who starts without paying needs a different method (email-plus, per draft 03). And card consent does not replace the **direct notice**: the parent must still be told what is collected *before* collection begins. |
| **2. Data retention policy** | The requirement is right. The sample wording rests on "you don't store any personal data", which is the premise under challenge above. Once Path A is chosen, draft 04 replaces it. |
| **3. Annual evaluation** | Correct, and note it is an evaluation of a **written security programme** — the programme itself has to exist first. Draft 05. |
| **4. Prominent display** | Correct and easy. Homepage link plus a link at every point of collection. Worth doing this week. |

---

## What this changes in the draft set

| Draft | Effect |
|---|---|
| 02 Direct Notice | Now clearly required. Rakif's notes do not include it. |
| 04 Retention | Replaces the "we store nothing" wording. |
| 05 Security Programme | Needed before the annual evaluation in note 3 means anything. |
| 06 Parent Rights | Replaces Privacy Policy section 6. |
| 07 Subprocessors | Replaces the blanket "no third-party sharing". |
| 01 + 03 | Supply the missing refund policy and the auto-renewal disclosures the Terms gesture at. |
| 03 | If every account is paid from day one, the email-plus path can be dropped. **Decision needed.** |

---

## Recommended order

1. **Decide Path A or Path B.** Everything else follows. Rafi and Rakif, not the attorney.
2. **Verify the factual premise before anyone argues about wording.** Read the database and the running app and write down exactly what is stored per child and which identifiers exist. Both documents currently rest on an assumption nobody has checked.
3. **Fix the two statements that are wrong in a costly direction** — the CVV sentence and the "no persistent identifiers" sentence — before either document goes any further.
4. **Merge:** Rakif's Terms are a reasonable skeleton and should be kept and amended, not replaced. The Privacy Policy needs rewriting around the real data flows.
5. **Then the attorney**, with the question list at the foot of each draft.

## One live item

The Terms on radlor.com are public now, and they contain an unresolved `[link]` placeholder and the misspelled address. Whatever is decided about the larger review, those two are worth correcting this week — or the page taken down until the set is ready.
