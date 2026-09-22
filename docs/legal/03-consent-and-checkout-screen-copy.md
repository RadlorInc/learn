# Consent and Checkout Screen Copy

> **STATUS: DRAFT — NOT LEGAL ADVICE — MUST BE REVIEWED BY A LICENSED US ATTORNEY BEFORE IT SHIPS.**
> This is the exact wording for the screens and emails in the parental consent flow and the subscription checkout. It is a build specification, not a page. Engineering should treat the wording as fixed once the attorney has signed it off — small changes to consent wording can invalidate the consent.

---

> **Soft launch is free (decision of 22 Sep 2026), and that removes one of the two consent paths.**
>
> Verifiable consent by payment card works because a card transaction notifies the account holder. **No payment, no card path.** During the free soft launch, **Path B (email-plus) is not a fallback — it is the only consent method available**, and everything in Path A is dormant until paid plans exist.
>
> Two consequences follow, and both are hard requirements rather than preferences:
>
> 1. **Email-plus is only permissible where the child's information is not disclosed to third parties.** That is no longer a footnote to check later — the entire consent basis for the soft launch rests on it. The vendor review in document 07 has to be finished, and come back clean, before a single child signs up.
> 2. **Build Path B properly, not as a placeholder.** It was the secondary path when this was drafted. It is now the whole mechanism.

## Flow overview

```
Parent creates account
        │
        ├─ Direct Notice screen  ────────────►  (Doc 02, on screen)
        │
        ├─ Which path?
        │     │
        │     ├─ Paid plan  ──►  A1 Checkout consent  ──►  A2 Card charged  ──►  A3 Acknowledgement email
        │     │
        │     └─ No payment ──►  B1 Email-plus request ──►  B2 Parent confirms ──►  B3 Second confirmation email (sent later)
        │
        └─ Consent recorded  ──►  Child profile can be created  ──►  Data collection begins
```

**Hard rule for engineering: no field about a child is written to the database before a consent record exists.** Not the child's name, not the grade, not a practice answer. The consent record is the gate.

---

## Path A — Verification by payment card

### A1. Checkout consent screen

**Heading:** `Confirm you're the parent`

**Body:**

> To set up an account for a child, US law requires us to confirm that an adult is giving permission. Your card issuer will notify you of this transaction, which is how we verify you.
>
> We told you on the previous screen exactly what we collect from your child. By continuing, you confirm that you are the child's parent or legal guardian and you give permission for us to collect and use that information as described.

**Auto-renewal disclosure block — must appear on the same screen, above the pay button, in the same size and colour as the surrounding text, not behind a link or a tooltip:**

> **Your subscription renews automatically.**
> - Plan: [PLACEHOLDER — plan name]
> - You will be charged **[PLACEHOLDER — amount] today**.
> - After that, you will be charged **[PLACEHOLDER — amount] every [PLACEHOLDER — month / 12 months]** until you cancel.
> - You can cancel any time at [PLACEHOLDER — in-app path] or by emailing support@radlor.com. Cancelling stops all future charges.
> - Full terms: [Refund and Cancellation Policy](https://adaptivelearn.radlor.com/legal/refunds)

**Checkbox — unticked by default, and the button must stay disabled until it is ticked:**

> ☐ I am the parent or legal guardian of the child I am setting up. I have read the [Privacy Policy](https://adaptivelearn.radlor.com/legal/privacy) and [Terms of Service](https://adaptivelearn.radlor.com/legal/terms), I give permission for the information described to be collected from my child, and I agree to the automatic renewal terms shown above.

**Button:** `Subscribe — [PLACEHOLDER — amount] today`

> **Do not use a single checkbox to bundle consents if the attorney advises they must be separate.** See the attorney notes at the end.

### A2. On success

Record: the consent, its timestamp, the method (`payment_card`), the plan, the amount, and the version of each document the parent was shown. Never record the card number.

### A3. Acknowledgement email — sent immediately

**Subject:** `Your Milo subscription — confirmation and how to cancel`

**Body:**

> Hi [PLACEHOLDER — parent first name],
>
> Your subscription is active. Here are the details, for your records.
>
> **Plan:** [PLACEHOLDER — plan name]
> **Charged today:** [PLACEHOLDER — amount]
> **Renews:** automatically, [PLACEHOLDER — every month / every 12 months], on [PLACEHOLDER — date]
> **Renewal amount:** [PLACEHOLDER — amount]
>
> **How to cancel:** sign in and go to [PLACEHOLDER — in-app path], or reply to this email. Cancelling stops all future charges. Your access continues until the end of the period you have paid for.
>
> **You also gave permission for us to collect information from your child.** Here is what that covers and how to change it: https://adaptivelearn.radlor.com/legal/parent-rights. You can see everything we hold, delete it, or withdraw permission at any time.
>
> Radlor Inc., 254 Chapman Rd, Ste 208 #28608, Newark, DE 19702

---

## Path B — Verification by email-plus

> Email-plus is only permissible where the child's personal information is used for internal purposes and is **not disclosed** to third parties. If disclosure occurs, this path cannot be used. Confirm with the attorney before building it.

### B1. Consent request email — sent when the parent asks to start

**Subject:** `Please confirm: permission for your child to use Milo`

**Body:**

> Hi,
>
> Someone — we believe you — asked to set up a Milo account for a child under 13.
>
> Before we collect anything from your child, US law requires your permission. Here is exactly what we would collect:
>
> - your child's first name or nickname
> - their grade level
> - their answers to maths questions, their scores, and their progress
> - basic technical information from the device, to keep the app working and secure
>
> We do not ask your child for a last name, email, phone number, address, photo, voice recording, or location. We do not sell your child's information, and we do not use it for advertising.
>
> **[ I give permission ]**    **[ No — cancel this request ]**
>
> If you did nothing, you can ignore this email and nothing will happen.
>
> Full details: [Privacy Policy](https://adaptivelearn.radlor.com/legal/privacy)
> Radlor Inc., 254 Chapman Rd, Ste 208 #28608, Newark, DE 19702

### B2. Confirmation screen after the parent clicks

**Heading:** `Thank you — permission recorded`

**Body:**

> We have recorded your permission and your child can start now.
>
> We will send you one more email in a little while to confirm it was really you. If it wasn't, that email will let you cancel immediately and we will delete everything.

### B3. Second confirmation email — sent after a delay

**Timing:** [PLACEHOLDER — delay; a reasonable time after the first, commonly 24 hours. Confirm with the attorney.]

**Subject:** `Confirming the permission you gave for your child's account`

**Body:**

> Hi,
>
> Yesterday you gave permission for your child to use Milo, and for us to collect their first name, grade level, and maths progress.
>
> **If that was you, you don't need to do anything.**
>
> **If it wasn't you, click here to withdraw permission.** We will immediately stop collecting, delete everything we hold about the child, and close the account.
>
> You can withdraw permission at any time in future, too: https://adaptivelearn.radlor.com/legal/parent-rights.
>
> Radlor Inc., 254 Chapman Rd, Ste 208 #28608, Newark, DE 19702

---

## Withdrawal-of-consent screen (both paths)

**Heading:** `Withdraw permission`

**Body:**

> If you withdraw permission, we will stop collecting information from your child, delete what we already hold about them, and close their profile. This cannot be undone.
>
> **Your subscription will be cancelled and we will refund the unused part of it.** You are never charged for exercising a privacy right. The refund reaches your original payment method within 10 business days.
>
> **If you have more than one child on this account, withdrawing permission closes the whole account, including your other children's profiles.** If you only want to remove one child, use *Remove this child* instead.

**Buttons:** `Withdraw permission and delete my child's data` · `Keep my settings`

---

### Notes for the attorney reviewing this draft

1. **Bundled consent.** Screen A1 asks in one checkbox for (a) parental consent under COPPA, (b) agreement to the Terms and Privacy Policy, and (c) affirmative consent to automatic renewal. Several state automatic renewal statutes require the renewal consent to be separate from other terms. Please advise whether this must be split into two or three controls, and give us the exact wording if so.
2. **Payment-card verification.** Please confirm that a card transaction at the amounts in use qualifies as verifiable parental consent under 16 CFR § 312.5(b)(2) as amended, and whether any notification obligation falls on us in addition to the issuer's.
3. **Email-plus scope.** Please confirm email-plus remains available given the actual vendor set, and set the delay in B3.
4. **Consent records.** Please specify what we must retain as proof of consent, and for how long, so it can be written into the Data Retention Policy.
5. **Under-13 versus 13–17.** Please advise what, if anything, changes for a 13–17 year old user under state law.
