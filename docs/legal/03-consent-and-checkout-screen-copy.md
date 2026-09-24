# Consent and Checkout Screen Copy

> **STATUS: DRAFT — NOT LEGAL ADVICE — MUST BE REVIEWED BY A LICENSED US ATTORNEY BEFORE IT SHIPS.**
> This is the exact wording for the screens and emails in the parental consent flow and the subscription checkout. It is a build specification, not a page. Engineering should treat the wording as fixed once the attorney has signed it off — small changes to consent wording can invalidate the consent.

---

> **Build both paths. Payment is expected within days of the soft launch (Rafi, 22 Sep 2026), so Path A is the main route — but Path B is not optional.**
>
> Verifiable consent by payment card works because the card transaction notifies the account holder. It therefore covers only children whose parent has actually paid. Path B (email-plus) covers everyone else: a parent who signs a child up before paying, during a trial, or in any window where no charge has been made.
>
> **Whichever path a child arrives through, a consent record must exist before any field about that child is written.** Two standing requirements:
>
> 1. **Email-plus is only permissible where the child's information is not disclosed to third parties.** The vendor review in document 07 has to be finished, from the code, and come back clean before Path B can be relied on for a real child.
> 2. **Path B is a real mechanism, not a stub.** Any gap between sign-up and first payment is exactly the window where a child has no card-based consent behind them.

> ## ⛔ Before any of this reaches a real parent
>
> The copy below was written before the flow existed, and the build has now shown that **eight of its statements are ahead of the product**. They were used verbatim, as instructed, so every one of them renders today. None of these emails or screens may be sent to a real parent until each line is either true or changed.
>
> | The copy says | What the product does | Fix |
> |---|---|---|
> | Withdrawal deletes the child's data and closes the account | Withdrawal **stops collection only**. Nothing is deleted | Build deletion, or change the wording |
> | Withdrawal refunds the unused subscription | Billing has never run | True once billing is live; until then it must not be said |
> | Use *Remove this child* | The real control is *Delete <name>'s profile* | Rename one or the other so they match |
> | Consent can be given by payment card | That path does not exist yet | Describe only the path that works |
> | Links to the subprocessor, retention and parent-rights pages | All three return 404 | Build the pages, or drop the links |
> | "Full details in our Privacy Policy" | That page is bannered **DRAFT — NOT IN FORCE** | Finish the policy first |
> | "a child under 13" | Grade 8 children are mostly 13–14 | Say "your child"; COPPA's under-13 rule is explained separately |
> | The list of what we collect | Omits the avatar, points, game saves, the child's username, feedback and product events | Corrected below |
>
> A consent given against a notice that overstates what happens is worse than no consent, because it looks like one. **This is the gate on Phase 2 shipping, not a tidy-up afterwards.**

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
> - Plan: Radlic Family
> - You will be charged **[PLACEHOLDER — amount] today**.
> - After that, you will be charged **[PLACEHOLDER — amount] every [PLACEHOLDER — month / 12 months]** until you cancel.
> - You can cancel any time at **Account → Plan & billing** or by emailing support@radlor.com. Cancelling stops all future charges.
> - Full terms: [Refund and Cancellation Policy](https://radlic.com/legal/refunds)

**Checkbox — unticked by default, and the button must stay disabled until it is ticked:**

> ☐ I am the parent or legal guardian of the child I am setting up. I have read the [Privacy Policy](https://radlic.com/legal/privacy) and [Terms of Service](https://radlic.com/legal/terms), I give permission for the information described to be collected from my child, and I agree to the automatic renewal terms shown above.

**Button:** `Subscribe — [PLACEHOLDER — amount] today`

> **Do not use a single checkbox to bundle consents if the attorney advises they must be separate.** See the attorney notes at the end.

### A2. On success

Record: the consent, its timestamp, the method (`payment_card`), the plan, the amount, and the version of each document the parent was shown. Never record the card number.

### A3. Acknowledgement email — sent immediately

**Subject:** `Your Radlic subscription — confirmation and how to cancel`

**Body:**

> Hi [PLACEHOLDER — parent first name],
>
> Your subscription is active. Here are the details, for your records.
>
> **Plan:** Radlic Family
> **Charged today:** [PLACEHOLDER — amount]
> **Renews:** automatically, [PLACEHOLDER — every month / every 12 months], on [PLACEHOLDER — date]
> **Renewal amount:** [PLACEHOLDER — amount]
>
> **How to cancel:** sign in and go to **Account → Plan & billing → See plans → Cancel subscription**, or reply to this email. Cancelling stops all future charges. Your access continues until the end of the period you have paid for.
>
> **You also gave permission for us to collect information from your child.** Here is what that covers and how to change it: https://radlic.com/legal/parent-rights. You can see everything we hold, delete it, or withdraw permission at any time.
>
> Radlor Inc., 254 Chapman Rd, Ste 208 #28608, Newark, DE 19702

---

## Path B — Verification by email-plus

> Email-plus is only permissible where the child's personal information is used for internal purposes and is **not disclosed** to third parties. If disclosure occurs, this path cannot be used. Confirm with the attorney before building it.

### B1. Consent request email — sent when the parent asks to start

**Subject:** `Please confirm: permission for your children to use Radlic`

**Body:**

> Hi {name},
>
> Thanks for signing up to Radlic. Before your children can use it, US law asks for your permission. For each child you add, we store:
>
> - their first name or nickname, the avatar you pick and their username
> - the lessons you choose, and a grade band (grades 3–5 or 6–8) worked out from them
> - their answers, points and progress
> - any feedback they send, a few product events and basic device information
>
> We never sell your child's information or use it for advertising.
>
> Here's our detailed Privacy Policy: [Privacy Policy](https://radlic.com/legal/privacy)
>
> **[ I've read and agreed to the Privacy Policy ]** (a link drawn as an empty checkbox; it opens the page below)
>
> Didn't sign up? Ignore this email and nothing will happen.
>
> Radlor Inc., 254 Chapman Rd, Ste 208 #28608, Newark, DE 19702

### B1b. The page the tick link opens — ticking the box there gives the permission

**Heading:** `Please confirm: permission for your children to use Radlic`

> This one permission covers every child you add to this account, now or later. Each time you add a child, we ask you to confirm in the app that you are that child's parent or legal guardian.
>
> Here's our detailed Privacy Policy: [Privacy Policy](https://radlic.com/legal/privacy)

**Checkbox (unticked):** `I've read and agreed to the Privacy Policy` (ticking it records the permission; there is no separate button)

**Button:** `No — cancel this request`

### B2. Confirmation screen after the parent clicks

**Heading:** `Thank you — permission recorded`

**Body:**

> We have recorded your permission. You can add your children now.
>
> We will send you one more email in a little while to confirm it was really you. If it wasn't, that email will let you cancel immediately and we will delete everything we hold about any child on the account.

### B3. Second confirmation email — sent after a delay

**Timing:** [PLACEHOLDER — delay; a reasonable time after the first, commonly 24 hours. Confirm with the attorney.]

**Subject:** `Confirming the permission you gave for your children`

**Body:**

> Hi,
>
> Yesterday you gave permission for your children to use Radlic, and for us to collect each child's first name, grade band, and maths progress. It covers every child you add to this account.
>
> **If that was you, you don't need to do anything.**
>
> **If it wasn't you, click here to withdraw permission.** We will immediately stop collecting and delete everything we hold about every child on the account. Your account stays open.
>
> You can withdraw permission at any time in future, too: https://radlic.com/legal/parent-rights.
>
> Radlor Inc., 254 Chapman Rd, Ste 208 #28608, Newark, DE 19702

---

## Withdrawal-of-consent screen — one child (a permission given before 24 September 2026 for a single child)

**Heading:** `Withdraw permission`

**Body:**

> If you withdraw permission, we will stop collecting information from your child, delete what we already hold about them, and close their profile. This cannot be undone.
>
> **Your subscription will be cancelled and we will refund the unused part of it.** You are never charged for exercising a privacy right. The refund reaches your original payment method within 10 business days.
>
> **This applies only to this child.** Your account stays open, and any other children on it are not affected.

**Buttons:** `Withdraw permission and delete my child's data` · `Keep my settings`

---

## Withdrawal screen — every child on the account (the second email's link, and Account settings)

**Heading:** `Withdraw permission for all your children`

**Body:**

> If you withdraw permission, we will stop collecting information from every child on your account, delete everything we hold about each of them — including their own sign-ins — and close their profiles. This cannot be undone.
>
> **Your account stays open.** If you add a child again later, we will ask for your permission again first.

**Buttons:** `Withdraw permission and delete my children's data` · `Keep my settings`

---


## Waiting for permission — the parent dashboard, until "I give permission" is clicked

**Heading:** `Waiting for your permission`

> We have emailed {email}. Open that email and choose "I give permission" — then you can add your children. The link works for {days} days.

**Button:** `Send the email again`

---

## Adding a child — the parental attestation (replaces the notice and the email for each later child)

**Checkbox (unticked):** `I'm this child's parent or legal guardian. The permission I gave on {date} applies to this child too.`

**Link:** `Read the notice you agreed to`

---

## Asking again after a material change to the notice

**Heading:** `We've changed what we collect`

> Please read the updated notice and give your permission again before your children continue.

---

### Notes for the attorney reviewing this draft

1. **Bundled consent.** Screen A1 asks in one checkbox for (a) parental consent under COPPA, (b) agreement to the Terms and Privacy Policy, and (c) affirmative consent to automatic renewal. Several state automatic renewal statutes require the renewal consent to be separate from other terms. Please advise whether this must be split into two or three controls, and give us the exact wording if so.
2. **Payment-card verification.** Please confirm that a card transaction at the amounts in use qualifies as verifiable parental consent under 16 CFR § 312.5(b)(2) as amended, and whether any notification obligation falls on us in addition to the issuer's.
3. **Email-plus scope.** Please confirm email-plus remains available given the actual vendor set, and set the delay in B3.
4. **Consent records.** Please specify what we must retain as proof of consent, and for how long, so it can be written into the Data Retention Policy.
5. **Under-13 versus 13–17.** Please advise what, if anything, changes for a 13–17 year old user under state law.
