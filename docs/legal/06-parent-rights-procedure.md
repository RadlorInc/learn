# Parent Rights: Public Page and Internal Procedure

> **STATUS: DRAFT — NOT LEGAL ADVICE — MUST BE REVIEWED BY A LICENSED US ATTORNEY BEFORE PUBLICATION.**
> Part A is a public page. Part B is the internal procedure that makes Part A true. Do not publish Part A until Part B can actually be carried out — a published right that nobody can service is a worse position than no page at all.

---

# Part A — Public page: "Your rights as a parent"

**Effective:** [PLACEHOLDER — date]

If your child uses Milo, you are in control of their information. You have four rights, and you can use any of them at any time, for free.

### 1. See what we hold

You can ask us for a copy of everything we have collected from your child. We will send it to you in a readable format within 10 days.

### 2. Correct it

**In the app:** parent dashboard → your child's card → **Login & data** → **Correct *name*'s details**. There you can change your child's name or nickname, their avatar, and their grade band (grades 3–5 or grades 6–8). Only the adult who added the child can make this change. **Or email us** at support@radlor.com and we will correct it for you.

### 3. Delete it

You can ask us to delete your child's information. We will delete it from our live systems within 10 days. Copies in our backups disappear when those backups expire, within 30 days, and we never restore a deleted child's record from a backup.

### 4. Withdraw your permission

You can withdraw the permission you gave us. If you do, we stop collecting anything further from your child, we delete what we hold, and your child's profile is closed.

**Your subscription is cancelled and we refund the unused part of it.** You are never charged for exercising a privacy right.

**If you have more than one child on the account, withdrawing permission closes the whole account**, including your other children's profiles. If you want to remove only one child, use *Remove this child* instead — that deletes only that child's information and leaves the rest of the account running.

### How to make a request

**In the app:** parent dashboard → your child's card → **Login & data** → *Download a copy* or *Delete this profile*. To delete everything: **Account → Close your account**, which asks you to type your email address to confirm and requires a recent sign-in.
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
| **See the data** | Export the child's rows from `learners`, `learner_access`, `lesson_progress`, `point_events`, `learner_stats`, `learner_events`, `lesson_feedback`, `game_settings` and `error_events` — that last one is easy to forget and holds a crash record tagged with the child. Check that no other family's data is in the export before sending. Send by [PLACEHOLDER — method]. | 10 days |
| **Correct** | Apply the change; confirm by email. | 10 days |
| **Delete** | Hard delete the child's rows from `learners`, `learner_access`, `lesson_progress`, `point_events`, `learner_stats`, `learner_events`, `lesson_feedback`, `game_settings` **and `error_events`** — crash records carry the child's identifier but have no database link, so they do not disappear on their own and must be deleted by hand until that is fixed. Then re-query for the child's identifier across every table in that list and confirm zero rows return. Confirm by email. | 10 days |
| **Withdraw consent** | Delete as above for **every** child on the account, mark the consent record as withdrawn with a timestamp, close the account, stop all collection, cancel the subscription and issue the pro-rata refund. Confirm by email, stating the refund amount. | 10 days |
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

0. **Adopted rule, flagged for your view.** Radlor has decided that withdrawing consent closes the entire account, including any other children on it, with a pro-rata refund. The refund half is straightforwardly good. The all-or-nothing half has a downside worth naming: a parent who wants to remove one child has to end the other child's learning too, which reads as a penalty for exercising a privacy right. The *Remove this child* path above is the mitigation — provided the product actually builds it and the interface makes it at least as easy to find as the withdrawal button. Please advise whether the all-or-nothing rule creates any exposure, particularly if the two paths are not equally prominent.
1. Please set the response deadlines. COPPA and several state statutes impose different timelines; we would like a single internal deadline that satisfies the strictest.
2. Please confirm the verification method in B2 is sufficient and not excessive.
3. The vendor review found that **no third party receives a child's information** — only our own database and hosting providers, acting on our instructions. Please confirm that removes the need for a "refuse third-party disclosure" option.
6. **A known defect, being fixed:** crash records carry a child's identifier with no database link, so they survive the child's deletion. Three such orphans already exist. Until it is fixed, the deletion procedure above deletes them by hand. Please tell us whether anything more is needed.

> **Resolved, 23 September 2026 (measured on production).** Crash records now carry a database link to the child that **deletes them with the child** (`error_events.learner_id` → `learners`, on delete cascade — read from the production catalog). The three orphaned records were deleted when that link was added (crash records 9 → 6), and after the test children were cleared **no crash record points at a child who no longer exists** (0 orphaned). Deleting a child from the app was proven on real rows the same day: every one of that child's rows, and the child's own login, was gone afterwards, and another child on the same account was untouched. That child happened to have no crash records, so the crash-record cascade is proven by the catalog and by the clearing of the test children, not by that one deletion.
4. Please advise on appeal rights, which several state privacy statutes require.
5. Please confirm what we are obliged to retain about a request after completing it.
