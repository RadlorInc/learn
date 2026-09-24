# Parent Rights: Public Page and Internal Procedure

> **STATUS: BETA — published 25 September 2026 on the founder's decisions for the private beta; attorney review pending (each decision is recorded in ATTORNEY-PACKET.md).**
> Part A is a public page. Part B is the internal procedure that makes Part A true. Do not publish Part A until Part B can actually be carried out — a published right that nobody can service is a worse position than no page at all.

---

# Part A — Public page: "Your rights as a parent"

**Effective:** 25 September 2026

If your child uses Radlic, you are in control of their information. You have four rights, and you can use any of them at any time, for free.

### 1. See what we hold

You can ask us for a copy of everything we have collected from your child. We will send it to you in a readable format within 10 days.

### 2. Correct it

**In the app:** parent dashboard → your child's card → **Login & data** → **Correct name's details**. There you can change your child's name or nickname, their avatar, and their grade band (grades 3–5 or grades 6–8). Only the adult who added the child can make this change. **Or email us** at support@radlor.com and we will correct it for you.

### 3. Delete it

You can ask us to delete your child's information. We will delete it from our live systems within 10 days. Copies in our backups disappear when those backups expire, within 30 days, and we never restore a deleted child's record from a backup.

### 4. Withdraw your permission

You give us permission once, for your account, and it covers every child you add to it. You can withdraw it for one child, or for every child on the account. Either way we stop collecting anything further, we delete everything we hold about each child it covers — including their own sign-in — and their profile is closed. This cannot be undone.

**For one child:** delete that child's profile (your child's card → **Login & data** → *Delete name's profile*). This applies only to that child: your account, your permission and any other children on it are not affected. (If you gave permission before 24 September 2026 for a single child, the link in the second email of that permission does the same for that child.)

**For every child on the account:** use **Account → Withdraw permission for all your children**, or the link in the second email we send after you give permission. Every child on the account is deleted. **Your account stays open**, with no children; if you add a child again later, we will ask for your permission again first.

We keep a record that permission was given and then withdrawn, and when, without the children's details. To delete everything, including the account itself, use **Account → Close your account**.

You are never charged for exercising a privacy right.

### How to make a request

**In the app:** parent dashboard → your child's card → **Login & data** → *Download a copy* or *Delete name's profile*. To delete everything: **Account → Close your account**, which asks you to type your email address to confirm and requires a recent sign-in.
**By email:** support@radlor.com, from the email address on the account
**By post:** 254 Chapman Rd, Ste 208 #28608, Newark, DE 19702

**How we check it's really you.** Before we show or delete anything, we confirm the request came from the parent on the account. We will send a confirmation link to the email address on the account, and act only once you click it. Deleting an account inside the app additionally requires you to have signed in within the last ten minutes. We ask for this to protect your child — it stops anyone else getting their information. We will not ask you for a government ID or any sensitive document to make a routine request.

**If we can't help.** If we refuse a request, we will tell you why, in writing. **You can appeal.** Reply to our refusal, or write to support@radlor.com saying you want the decision reviewed. A different person from the one who refused it will look at it again and reply within 10 days.

**Questions:** support@radlor.com

---

# Part B — Internal procedure

## B1. Intake

Every request is logged the day it arrives with: date received, requester email, child profile concerned, type of request, the deadline date, and the person handling it. The log lives in Radlor Ops, which is a separate system from the one holding children's data.

## B2. Verify the requester

- The request must come from the email address on the parent account, **and** be confirmed by clicking a link sent to that address.
- If it comes from a different address, we do not act. We reply to the address on the account to ask whether they made the request.
- We never accept a request routed through a third party without the parent confirming directly.
- We do not collect more information to verify someone than the request itself is worth.

**Record what verification was done, and when.**

## B3. Act

| Request | Steps | Target |
|---|---|---|
| **See the data** | Export the child's rows from `learners`, `learner_access`, `lesson_progress`, `point_events`, `learner_stats`, `learner_events`, `lesson_feedback`, `game_settings` and `error_events` — that last one is easy to forget and holds a crash record tagged with the child. Check that no other family's data is in the export before sending. Send by replying to the account's email address with the steps to download it in the app (*Login & data → Download a copy*); if the parent cannot, send the same file as an email attachment to that address. | 10 days |
| **Correct** | Apply the change; confirm by email. | 10 days |
| **Delete** | Hard delete the child's rows from `learners`, `learner_access`, `lesson_progress`, `point_events`, `learner_stats`, `learner_events`, `lesson_feedback`, `game_settings` **and `error_events`**. Since 23 September 2026 this is one action: the dashboard's *Delete name's profile* (or the parent's own withdrawal) runs `delete_child_data`, and every one of these tables — crash records included, which now cascade with the child — is cleared with the child's own sign-in. Then re-query for the child's identifier across every table in that list and confirm zero rows return. Confirm by email. | 10 days |
| **Withdraw consent — every child** | The parent can do this themselves: **Account → Withdraw permission for all your children** (`withdraw_my_consent`) or the second consent email's link (`consent_withdraw` on the account consent's token). Both run `consent_withdraw_account`: every child the parent created is deleted through `delete_child_data`, every consent they hold that is granted becomes `withdrawn`, any pending request is expired, and each second email still scheduled is queued for cancelling (`consent_b3_cancellations`). For a request that arrives any other way, verify the parent (B2) and use the same Account control on their behalf only with their written confirmation. Then confirm: no child of the parent remains, the account consent reads `withdrawn`, and no second email is still scheduled for it in Resend. The account stays open. Confirm to the parent by email. | 10 days |
| **Withdraw consent — one child** | For **that child only** — the account, its consent and any other children stay. A parent can do this themselves from the link in the second consent email (`/consent/withdraw`, which runs `consent_withdraw` → `delete_child_data`). For a request that arrives any other way, delete the child through the dashboard's *Delete name's profile* on the parent's behalf only after verifying them (B2) — it runs the same `delete_child_data`. Then confirm: the child's rows are gone (the verification rule below), the consent record reads `withdrawn` with a timestamp and is no longer linked to a child, and no second consent email is still scheduled for it in Resend. Confirm to the parent by email. Subscription: see Part A §4 — nothing is cancelled or refunded today. | 10 days |
| **Remove one child** (account continues) | Delete that child's rows only, verify as above, leave the subscription and the other profiles untouched. Confirm by email. | 10 days |

**Deletion verification rule.** A deletion is not complete because the delete statement ran without error. It is complete when a fresh query for that child's identifier, run separately, returns nothing — and when that same query has been seen returning rows *before* the deletion. If we have not seen the query find the child first, a zero result proves nothing.

## B4. Close

Reply to the parent in plain language saying what we did and when. Record the completion date and keep the log entry per the Data Retention Policy.

## B5. Where requests can arrive

All of these must route to the same log — a request does not have to use the official form to be valid:

- the in-app request button
- support@radlor.com
- any reply to a Radlor email
- post
- No other channel today. When the product reaches an app store, or a social account starts taking messages, that channel must be added here and to the intake routine on the same day it opens — a request does not stop being a request because it arrives somewhere we were not watching.

---

### Notes for the attorney reviewing this draft

0. **⚠️ OPEN — withdrawal scope, now with both routes built (consent-once, 24 September 2026).** The parent gives one consent for the account. They can withdraw it for **one child** (delete that child: the account, its consent and the other children stay) or for **every child** (Account → *Withdraw permission for all your children*, or the second email's link: every child deleted, the consent kept as `withdrawn`, the account open with no children, and a new consent needed before another child). Please advise: (a) whether this satisfies COPPA's revocation right; (b) the subscription consequence (Part A §4 placeholder — nothing is cancelled or refunded today, and billing is off); (c) that closing the whole account (a separate control) deletes the consent records too — see the consent-record retention question in the Terms.
1. Please set the response deadlines. COPPA and several state statutes impose different timelines; we would like a single internal deadline that satisfies the strictest.
2. Please confirm the verification method in B2 is sufficient and not excessive.
3. The vendor review found that **no third party receives a child's information** — only our own database and hosting providers, acting on our instructions. Please confirm that removes the need for a "refuse third-party disclosure" option.
6. **A known defect, being fixed:** crash records carry a child's identifier with no database link, so they survive the child's deletion. Three such orphans already exist. Until it is fixed, the deletion procedure above deletes them by hand. Please tell us whether anything more is needed.

> **Resolved, 23 September 2026 (measured on production).** Crash records now carry a database link to the child that **deletes them with the child** (`error_events.learner_id` → `learners`, on delete cascade — read from the production catalog). The three orphaned records were deleted when that link was added (crash records 9 → 6), and after the test children were cleared **no crash record points at a child who no longer exists** (0 orphaned). Deleting a child from the app was proven on real rows the same day: every one of that child's rows, and the child's own login, was gone afterwards, and another child on the same account was untouched. That child happened to have no crash records, so the crash-record cascade is proven by the catalog and by the clearing of the test children, not by that one deletion.
4. Please advise on appeal rights, which several state privacy statutes require.
5. Please confirm what we are obliged to retain about a request after completing it.
