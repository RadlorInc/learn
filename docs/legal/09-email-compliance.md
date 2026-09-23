# Email Compliance Standard (CAN-SPAM)

> **STATUS: DRAFT — NOT LEGAL ADVICE — MUST BE REVIEWED BY A LICENSED US ATTORNEY.**
> Internal standard plus the exact footer text. CAN-SPAM penalties are assessed **per email**, so a single bad send to a list is not a single violation. This is cheap to get right and expensive to get wrong.

---

## 1. Two kinds of email, two sets of rules

**Transactional** — receipts, renewal reminders, password resets, consent confirmations, deletion confirmations, service notices. These may be sent to any parent with an account, including those who unsubscribed from marketing. They must still have honest headers and subject lines.

**Commercial** — anything whose primary purpose is to promote the product: launch announcements, offers, newsletters, re-engagement. These require the full footer below and must honour unsubscribes.

**The trap:** a transactional email with a promotional block added to it can become a commercial email. Keep receipts clean.

## 2. Rules for every commercial email

1. **The "From", "Reply-To" and routing information must be accurate** and identify Radlor.
2. **The subject line must not mislead** about what is inside.
3. **If it is an advertisement, say so** — clearly, where the reader will see it. [PLACEHOLDER — confirm with the attorney whether this applies to our sends, given the recipient relationship.]
4. **A valid physical postal address** must appear: 254 Chapman Rd, Ste 208 #28608, Newark, DE 19702 — the same address used everywhere else.
5. **A clear unsubscribe mechanism** must be present, working, and free.
6. **Unsubscribes are honoured within 10 business days** — and in practice, immediately.
7. **We never sell, rent or transfer an address** that has unsubscribed.
8. **We are responsible even when someone else sends on our behalf.** If a contractor or tool sends for us, these rules still bind us.

## 3. No marketing to children

We do not send marketing email to children. We do not collect a child's email address. All email goes to the parent account holder.

## 4. Standard footer — commercial email

```
You are receiving this because you have a Milo account.

Unsubscribe from updates like this: [one-click unsubscribe link]
Manage your email preferences: [preferences link]

Radlor Inc.
254 Chapman Rd, Ste 208 #28608, Newark, DE 19702

We will still send you essential messages about your account and your
subscription, such as receipts and renewal reminders.
```

## 5. Standard footer — transactional email

```
This is a service message about your Milo account.

Radlor Inc.
254 Chapman Rd, Ste 208 #28608, Newark, DE 19702
Questions: support@radlor.com
```

## 6. Before any send to more than one person — checklist

- [ ] Is this transactional or commercial? If unsure, treat it as commercial.
- [ ] Is the subject line honest?
- [ ] Is the correct footer present?
- [ ] Is the unsubscribe link live? **Click it in the test send.** An unsubscribe link that renders but 404s is the same as no unsubscribe link, and it is the reader who discovers it.
- [ ] Has the suppression list been applied, and has it been checked by looking for a known unsubscribed address in the send list and seeing it absent?
- [ ] Does any claim in the email have a source behind it?
- [ ] Is there a child's name or data in the email that does not need to be there?

## 7. Unsubscribe handling

- One click, no sign-in, no questions, no "tell us why" before it takes effect.
- Effective immediately in practice.
- The suppression list is permanent — re-adding an address requires the person to opt in again themselves.
- **Resend delivers every email**, configured as the SMTP relay behind the authentication service's mailer, so the suppression list belongs there. [PLACEHOLDER — no suppression list or unsubscribe mechanism exists yet, because only authentication emails are sent today and those are transactional. It must be built before the first commercial email, not after.] Before any send to more than one person, confirm the list is applied by looking for a known unsubscribed address in the prepared send and seeing it absent.

---

### Notes for the attorney reviewing this draft

1. Please confirm which of our planned sends are commercial for CAN-SPAM purposes.
2. Please confirm the Newark address qualifies as a valid physical postal address for this purpose.
3. Please advise whether any state email or marketing statute adds requirements for a child-directed service.
4. Please advise on SMS, if it is ever added — the rules are different and stricter.
