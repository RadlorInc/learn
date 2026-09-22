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

If something is wrong — your child's name, their grade level — you can change it yourself at [PLACEHOLDER — in-app path], or ask us.

### 3. Delete it

You can ask us to delete your child's information. We will delete it from our live systems within 10 days. Copies in our backups disappear when those backups expire, within [PLACEHOLDER — number] days, and we never restore a deleted child's record from a backup.

### 4. Withdraw your permission

You can withdraw the permission you gave us. If you do, we stop collecting anything further from your child, we delete what we hold, and your child's profile is closed.

**Your subscription is cancelled and we refund the unused part of it.** You are never charged for exercising a privacy right.

**If you have more than one child on the account, withdrawing permission closes the whole account**, including your other children's profiles. If you want to remove only one child, use *Remove this child* instead — that deletes only that child's information and leaves the rest of the account running.

### How to make a request

**In the app:** [PLACEHOLDER — exact path]
**By email:** support@radlor.com, from the email address on the account
**By post:** 254 Chapman Rd, Ste 208 #28608, Newark, DE 19702

**How we check it's really you.** Before we show or delete anything, we confirm the request came from the parent on the account. We will [PLACEHOLDER — describe the verification step actually used, e.g. send a confirmation link to the account email]. We ask for this to protect your child — it stops anyone else getting their information. We will not ask you for a government ID or any sensitive document to make a routine request.

**If we can't help.** If we refuse a request, we will tell you why, in writing. [PLACEHOLDER — state whether there is an appeal route, and what it is.]

**Questions:** support@radlor.com

---

# Part B — Internal procedure

## B1. Intake

Every request is logged the day it arrives with: date received, requester email, child profile concerned, type of request, the deadline date, and the person handling it. [PLACEHOLDER — where the log lives.]

## B2. Verify the requester

- The request must come from the email address on the parent account, **and** be confirmed by clicking a link sent to that address.
- If it comes from a different address, we do not act. We reply to the address on the account to ask whether they made the request.
- We never accept a request routed through a third party without the parent confirming directly.
- We do not collect more information to verify someone than the request itself is worth.

**Record what verification was done, and when.**

## B3. Act

| Request | Steps | Target |
|---|---|---|
| **See the data** | Export from [PLACEHOLDER — table list] for that child only. Check that no other family's data is in the export before sending. Send by [PLACEHOLDER — method]. | 10 days |
| **Correct** | Apply the change; confirm by email. | 10 days |
| **Delete** | Hard delete the child's rows from [PLACEHOLDER — exact table list]. Then re-query for the child's identifier across every table in that list and confirm zero rows return. Confirm by email. | 10 days |
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
- [PLACEHOLDER — any other channel, e.g. app store reviews, social media DMs]

---

### Notes for the attorney reviewing this draft

0. **Adopted rule, flagged for your view.** Radlor has decided that withdrawing consent closes the entire account, including any other children on it, with a pro-rata refund. The refund half is straightforwardly good. The all-or-nothing half has a downside worth naming: a parent who wants to remove one child has to end the other child's learning too, which reads as a penalty for exercising a privacy right. The *Remove this child* path above is the mitigation — provided the product actually builds it and the interface makes it at least as easy to find as the withdrawal button. Please advise whether the all-or-nothing rule creates any exposure, particularly if the two paths are not equally prominent.
1. Please set the response deadlines. COPPA and several state statutes impose different timelines; we would like a single internal deadline that satisfies the strictest.
2. Please confirm the verification method in B2 is sufficient and not excessive.
3. Please advise whether we must offer the "refuse third-party disclosure but keep using the service" option, and if so where it belongs.
4. Please advise on appeal rights, which several state privacy statutes require.
5. Please confirm what we are obliged to retain about a request after completing it.
