# Runbook: support

**Use this when:** a parent or teacher writes in with a problem, or an automatic alert arrives.

## Where messages arrive

- **The support mailbox** (the address is `SUPPORT_EMAIL` in `src/app/site.ts`). The **founder** reads it. It is reached from:
  - the dashboard's *Need help?* panel (`src/shared/ui/SupportPanel.tsx`), which opens the parent's own mail program with a **diagnostic block** filled in;
  - `/help`, whose *Report a problem* opens the same email with the diagnostic block;
  - `/auth` and the consent-link pages (`/consent/...`), which show the address for a parent who is signed out;
  - the legal pages;
  - replies to the app's own emails, whose Reply-To is the support address (`EMAIL_REPLY_TO` in `src/features/consent/config.ts`).
- **Post**, to the address in [../legal/06-parent-rights-procedure.md](../legal/06-parent-rights-procedure.md).
- **Automatic:**
  - GitHub issues from `red-main.yml`, `daily-smoke.yml`, `nightly-e2e.yml` and `backup.yml` ("Nightly backup is red");
  - the uptime checker on `/api/health`, `/api/health/db` and `/auth`, once it is set up ([deploy.md](deploy.md));
  - the daily ops digest email (numbers only) when it is configured ([deploy.md](deploy.md) → scheduled jobs).

The panel promises **a reply within 2 working days**. Keep that promise and do not widen it.

## Triage (founder, once a day at a fixed time)

| Level | What | When |
|---|---|---|
| **P1** | Site down · nobody can sign in · anything about money ([billing.md](billing.md)) · **any request to see, correct or delete data, or to withdraw consent** | Now. Data requests go to [data-requests.md](data-requests.md): they carry a legal deadline and look like ordinary mail |
| **P2** | One family: progress lost, app unusable, errors in the diagnostic block | Same day |
| **P3** | "How do I…", confusion | Within the 2-day promise |
| **P4** | Ideas and feedback | Log it, thank them |

Read the ops digest and open GitHub issues **before** the mail. A rise in `error_events_24h` now includes failed
sign-ups and consent emails (rows tagged `[auth/signup] failed`, `[consent/request] failed`, …) and email bounces
(`[resend] email.bounced`): a parent who says "the email never came" may be one of those. One email with a green digest is probably that device. Several at once, or a red digest, means everyone: roll back first ([rollback.md](rollback.md)), diagnose after.

## Steps

1. **Founder.** Acknowledge the same day ("Got it, looking now, back to you within two working days").
2. **Founder.** Paste the message and the diagnostic block to the agent **in chat**. The block carries the account's email and internal ids. Never put it in a PR, issue, commit or file in this repo.
3. **Agent.** Read the block. The app is local-first, so it is often the only evidence.

   | Line | Healthy | Bad value means |
   |---|---|---|
   | `app` | equals live `VERSION` (`curl -s https://radlic.com/sw.js \| grep -m1 VERSION`) | Lower means a stale shell: the family should fully close and reopen the app. `none` means no service worker |
   | `storage` | `idb`, then quota and `persistent` | `local` means IndexedDB was blocked (private browsing, strict settings, full disk). This is the usual cause of "progress vanished". `not persistent` with used near the quota: the browser may clear the site's data under pressure |
   | `unsynced` | `0 session(s)` | Above 0, the work is **on the device** and not yet uploaded. Never tell them it is lost. With `online`, sync is failing, so read `sync err`. The app retries on its own every 30 s, backing off to every 10 min, while the page is open |
   | `last sent` | a recent time | When an upload last went through from this device. `never on this device` with work done means nothing has ever left it |
   | `sync err` | `none recorded` | The last code an upload got. `network`: no answer (Wi-Fi, a blocker). `P0C01`: no consent the gate accepts yet (the child's screen asks the adult). `42501`, `23503`, `23502`, `23514`, `22P02`: the database refused the row — it stays on the device for 7 days, retried, and each one is also reported to `error_events` (source `client`, message `upload refused <code>…`). Several families with the same code at once means a migration or policy broke uploads: fix it within the week, before the queues delete those rows |
   | `save err` | absent | Shown only when a write to the device's storage failed during this visit (full disk, IndexedDB closed by the browser): progress made then may not survive a reload |
   | `network` | `online` | `OFFLINE` often explains everything else |
   | `recent errors` | `none recorded` | `[react]` means the app crashed on screen; `[window]` / `[promise]` an error outside a screen; `[sync]` a refused upload or the upload queue overflowing (2000 items, the oldest dropped); `[audio]` a recorded clip fell back to the device voice (one note per cause per page load). `Failed to fetch` means a network problem or a refused request. Crashes, page errors and refused uploads are also in `error_events` (once per message per visit) |

4. **Founder, for "I did not get the email"** (`/help` promises we check whether it was sent). In Resend → Emails,
   search the address. *Delivered*: it is in their mailbox, ask them to check spam. *Bounced* or
   *Suppressed*: the address is wrong or refusing mail. Nothing listed: it was never sent, so ask them to sign up (or
   tap "Forgot password?") again with the same address, and tell the agent (the sign-up route logs
   `[auth/signup] failed` in Vercel). Reply with what you found, never with anything about other accounts.
5. **Agent.**
   - Reproduce on a local build.
   - Read the code, the public site and GitHub runs.
   - For one family, start with [../legal/sql/support-lookup.sql](../legal/sql/support-lookup.sql): the account by email → its children → each child's progress and last activity → crash records (7 days) → consent → PIN and teacher plan → deletions recorded. One placeholder, the address. Billing questions have their own file (`billing-lookup.sql`).
   - If more server data is needed, write **read-only SQL** into `docs/legal/sql/<topic>.sql` with placeholders (`'<learner id>'`), never real ids or emails. Say what each column answers and what each result would mean.
   - **Founder** runs it in the SQL editor and pastes back the output.
   - Vercel runtime logs: the **founder** reads them in the dashboard.
6. **Agent.** If it is a bug, write the fix with a test that fails on the bug, as a Draft PR ([deploy.md](deploy.md)). Draft the reply.
7. **Founder.** Sends the reply and, when it is fixed, a second line saying so.

## Email bounces (Resend webhook)

`/api/email/resend-webhook` turns each bounce or spam complaint into one `error_events` row (`[resend] email.bounced`
or `[resend] email.complained`): the type only, never the address. Which address bounced is in Resend → Emails.

To switch it on (**founder**, once):
1. Resend → Webhooks → Add endpoint: `https://radlic.com/api/email/resend-webhook`, events `email.bounced` and
   `email.complained`.
2. Copy its signing secret (`whsec_…`) into Vercel Production as `RESEND_WEBHOOK_SECRET`, then redeploy.
3. In Resend, send the endpoint a test event: it should answer 200. Until the secret is set the route answers 503
   and records nothing.

**What a bounce stops (20261007000000).** A `Permanent` bounce or a complaint also puts the recipient on
`email_undeliverable` — the sha256 of the lowercase address, never the address — and `sendEmail` then sends that address
nothing, of any kind, and records `[email] not sent: the address bounced earlier` (or `complained`). The parent is told:
sign-up says the address cannot be emailed; the Waiting card says the email could not be delivered and to write to
support. A soft bounce (`Transient`, `Undetermined`: a full mailbox) lists nobody. A new or corrected address is never
affected. Supabase Auth's own emails (password reset) do not go through `sendEmail`, but Resend keeps its own
suppression list and drops them too. A listing is deleted 12 months after its last event (`prune-email-undeliverable`).

**A parent says they get no email** (typo at sign-up, mailbox fixed, or a complaint made by mistake):
1. **Founder, SQL editor.** Query 1 of [../legal/sql/email-undeliverable.sql](../legal/sql/email-undeliverable.sql) with
   their address: no row = we are not blocking it (look in Resend → Emails instead).
2. A typo: nothing to lift. They sign up again with the right address (the wrong one's unconfirmed account is pruned
   after 3 days). A signed-in parent with a wrong address on the account has no in-app way to change it today — handle
   it as a data request.
3. The address is right and now works (mailbox recreated, complaint withdrawn **in writing from that address**):
   query 2 lifts our listing, then remove the address in Resend → Suppressions too, or Resend keeps dropping it. Then
   they press "Send the email again" (or sign up again).

## Parent PIN locked or forgotten

The PIN guards the dashboard screens from a child on the device (architecture.md §3); it is not a password. Five wrong
tries lock it for 15 minutes, doubling per lock up to 24 hours. In the app, *Forgot PIN* removes it 24 hours later.
Help sooner only when the request comes **from the account's own address** (as data-requests.md verifies), never on a
phone call or another address — a child who can email support from the parent's mail is the case the 24-hour wait
exists for, so if anything about the request is odd, point them to *Forgot PIN* instead.

1. **Founder.** Query 6 of [../legal/sql/support-lookup.sql](../legal/sql/support-lookup.sql) shows `pin_set`,
   `locked_until` and `reset_takes_effect`.
2. **Founder, SQL editor.** One of the two (each touches only that account's row; `parent_pins` has no client access):
   - **They know the PIN, they are locked out** — clear the lock and keep the PIN:
     ```sql
     update public.parent_pins set failed_count = 0, lockouts = 0, locked_until = null, updated_at = now()
      where account_id = (select id from auth.users where lower(email) = lower(btrim('<account email>')))
     returning account_id is not null as unlocked;   -- one row "true"; no row: no PIN or no such account
     ```
   - **They forgot it** — remove it; the next visit to the dashboard asks them to choose a new one. Until they do,
     whoever holds the signed-in device can choose it, so tell them to open the dashboard straight away:
     ```sql
     delete from public.parent_pins
      where account_id = (select id from auth.users where lower(email) = lower(btrim('<account email>')))
     returning account_id is not null as removed;
     ```
3. **Founder.** Run query 6 again: `locked_until` empty (unlock), or `pin_set = false` (removed). Reply.

Rehearsed on a local stack (2026-10-05): a locked account answered `locked` to the right PIN; after the unlock the same
PIN passed; after the delete the status read `none` and a new PIN could be set and verified.

## What the agent cannot do

- Never query production, in any way, even read-only. Write the SQL for the founder.
- It does not email parents. It drafts, and the founder sends.
- It does not change or delete account data. Deletions follow [data-requests.md](data-requests.md) and are the founder's.
- It never touches money: no refunds, charges or cancellations. It can read what the founder shows it, check whether a charge was doubled, and draft the reply. The founder acts in Stripe; the steps are in [billing.md](billing.md).
- It never asks a parent for a password, a government ID or any document.

## Reply shape

Plain words, short.
1. What happened, in one line.
2. What we did.
3. What they should do next, if anything: steps, not jargon.
4. Thanks.

No internal ids, no blame on the device, and no promise of a date we do not control. For a data request, use the reply rules in [data-requests.md](data-requests.md).

## Contact log

One line per contact, newest at the bottom. **This file is public**, so a line carries no name, email, child detail, id or school. Keep the mail thread in the mailbox, and match the two by date and channel. Data requests are also logged in the founder's separate request log, as 06 §B1 requires. A line here is not enough for them.

Format: `YYYY-MM-DD · channel (mail/post/in-app) · P-level · what happened, in general terms · what we did · open/closed`

After about 20 lines, the three most common problems are the next engineering work.

```
No entries yet. The previous log (2026-07-27 to 2026-09-28) recorded no contacts.
```
