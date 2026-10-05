# Runbook: support

**Use this when:** a parent or teacher writes in with a problem, or an automatic alert arrives.

## Where messages arrive

- **The support mailbox** (the address is `SUPPORT_EMAIL` in `src/app/site.ts`). The **founder** reads it. It is reached from:
  - the dashboard's *Need help?* panel (`src/shared/ui/SupportPanel.tsx`), which opens the parent's own mail program with a **diagnostic block** filled in;
  - `/help`;
  - the legal pages;
  - replies to the app's own emails, whose Reply-To is the support address (`EMAIL_REPLY_TO` in `src/features/consent/config.ts`).
- **Post**, to the address in [../legal/06-parent-rights-procedure.md](../legal/06-parent-rights-procedure.md).
- **Automatic:**
  - GitHub issues from `red-main.yml`, `daily-smoke.yml` and `nightly-e2e.yml`;
  - the daily ops digest email (numbers only) when it is configured ([deploy.md](deploy.md) → scheduled jobs).

The panel promises **a reply within 2 working days**. Keep that promise and do not widen it.

## Triage (founder, once a day at a fixed time)

| Level | What | When |
|---|---|---|
| **P1** | Site down · nobody can sign in · anything about money · **any request to see, correct or delete data, or to withdraw consent** | Now. Data requests go to [data-requests.md](data-requests.md): they carry a legal deadline and look like ordinary mail |
| **P2** | One family: progress lost, app unusable, errors in the diagnostic block | Same day |
| **P3** | "How do I…", confusion | Within the 2-day promise |
| **P4** | Ideas and feedback | Log it, thank them |

Read the ops digest and open GitHub issues **before** the mail. One email with a green digest is probably that device. Several at once, or a red digest, means everyone: roll back first ([rollback.md](rollback.md)), diagnose after.

## Steps

1. **Founder.** Acknowledge the same day ("Got it, looking now, back to you within two working days").
2. **Founder.** Paste the message and the diagnostic block to the agent **in chat**. The block carries the account's email and internal ids. Never put it in a PR, issue, commit or file in this repo.
3. **Agent.** Read the block. The app is local-first, so it is often the only evidence.

   | Line | Healthy | Bad value means |
   |---|---|---|
   | `app` | equals live `VERSION` (`curl -s https://radlic.com/sw.js \| grep -m1 VERSION`) | Lower means a stale shell: the family should fully close and reopen the app. `none` means no service worker |
   | `storage` | `idb` | `local` means IndexedDB was blocked (private browsing, strict settings, full disk). This is the usual cause of "progress vanished" |
   | `unsynced` | `0 session(s)` | Above 0, the work is **on the device** and not yet uploaded. Never tell them it is lost. With `online`, sync is failing, so read `recent errors` |
   | `network` | `online` | `OFFLINE` often explains everything else |
   | `recent errors` | `none recorded` | `[react]` means the app crashed on screen. `Failed to fetch` means a network problem or a refused request |

4. **Agent.**
   - Reproduce on a local build.
   - Read the code, the public site and GitHub runs.
   - If server data is needed, write **read-only SQL** into `docs/legal/sql/<topic>.sql` with placeholders (`'<learner id>'`), never real ids or emails. Say what each column answers and what each result would mean.
   - **Founder** runs it in the SQL editor and pastes back the output.
   - Vercel runtime logs: the **founder** reads them in the dashboard.
5. **Agent.** If it is a bug, write the fix with a test that fails on the bug, as a Draft PR ([deploy.md](deploy.md)). Draft the reply.
6. **Founder.** Sends the reply and, when it is fixed, a second line saying so.

## What the agent cannot do

- Never query production, in any way, even read-only. Write the SQL for the founder.
- It does not email parents. It drafts, and the founder sends.
- It does not change or delete account data. Deletions follow [data-requests.md](data-requests.md) and are the founder's.
- It never touches money: no refunds, charges or cancellations. It can read what the founder shows it, check whether a charge was doubled, and draft the reply. The founder acts in Stripe.
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
