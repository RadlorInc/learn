# Support — how a user problem gets solved

The operating manual for when a parent writes in. Written for a founder who does not read code:
every step is either something you do by reading, or something you hand to Claude verbatim.

Related: [devops.md](devops.md) (infrastructure) · [runbooks/rollback.md](runbooks/rollback.md)
(undoing a bad deploy) · [security.md](security.md) · [support-log.md](support-log.md) (the contact log).

---

## 1. The daily routine — 10 minutes

Pick one fixed time (morning, with coffee). Check two things:

1. **support@mi2utor.com**
2. **The daily health check** — [the routine's latest run](https://claude.ai/code/routines/trig_01GKnmbsiyHjvsC58jMTeiG6)

Both empty? Close the laptop. That is the entire support routine at current scale.

> ⚠️ **Do not check the inbox repeatedly.** Ten times a day means no real work gets done and
> constant low-grade anxiety. Once, at a fixed time. Support expands to fill whatever room you
> give it.

---

## 2. The channel

**support@mi2utor.com**, linked from the bottom of the parent dashboard as "Need help?".

The screen promises **a reply within 2 working days**. That is the only commitment — keep it, and
don't widen it. A promise you miss is worse than no promise.

---

## 3. When an email arrives — four steps

**Step 1 — Reply within 5 minutes. Do not solve it yet.**

Just say you've seen it. This is the highest-leverage habit in the whole document: people rarely
get angry that something broke, they get angry that nobody answered. A one-line acknowledgement
keeps your 2-day promise immediately and buys you the time to actually fix it.

**Step 2 — Paste it to Claude.** The parent's message plus the diagnostic block. Claude reads the
block, queries the database for that learner, and pulls Vercel logs filtered to their `learnerId`.

**Step 3 — Fix and deploy**, if it turns out to be a real bug.

**Step 4 — Tell them it's fixed.** Everyone skips this step, and it is the one that turns a
complaint into a loyal user.

---

## 4. Priority — how urgent is it

### The best signal is not the email. It's the daily health check.

Read the check *before* you read the email — it tells you whether this is one person or everyone.

| Daily check | Emails | What it means |
|---|---|---|
| 🟢 green | one | **Their device.** P2 — same day |
| 🟢 green | several at once | Something systemic the check isn't catching — **P1** |
| 🔴 red | any | **Everyone.** P1 — roll back first, diagnose after |

### The four levels

| Level | What | When |
|---|---|---|
| **P1** | Site down · nobody can log in · **data deletion or access request** · any question about a child's privacy | **Now** |
| **P2** | One user: progress lost, app unusable, errors present in the diagnostic block | Same day |
| **P3** | "How do I…", confusion, one feature misunderstood | Within 2 days (the promise) |
| **P4** | Feature requests, general feedback | Log it, reply politely, no rush |

> ⚠️ **A data deletion or access request is P1 because it carries a legal deadline**, not because
> the sender is upset. Those arrive looking like perfectly ordinary email. See §9.

### The one filter worth setting up

In Gmail, create **one** filter — not ten:

- **Matches:** `delete` OR `privacy` OR `my data` OR `COPPA` OR `remove my child`
- **Does:** Star it, apply label `P1-LEGAL`

That's the single category with a deadline that looks indistinguishable from normal mail. You can
read everything else yourself — you have two emails a week, not two hundred.

**Do NOT build yet:** a ticketing system, auto-classification, priority scoring, Zendesk. The
trigger for any of those is you saying *"I'm losing track of the inbox."* Until then they are cost
with no consumer.

---

## 5. Reply templates

Copy, adjust one line, send.

**Acknowledgement — always, immediately:**

> Thanks for writing in — I've got this and I'm looking into it now. I'll come back to you within
> two working days. Sorry for the trouble.

**Fixed:**

> This is fixed now — please close the app completely and reopen it, and you should see [X]
> working again. Thank you for reporting it; it genuinely helped.

**Not a bug, needs explaining** (e.g. private browsing blocking storage):

> Good news — nothing has been lost. [One line on why it happened.] Here's what to do: [steps].
> Let me know if that doesn't sort it out.

**Feature request:**

> Thank you — that's a genuinely good idea and I've written it down. I can't promise when, but
> it's on the list and I'll let you know if it ships.

---

## 6. What arrives

The "Need help?" panel makes the parent send two things: what happened in their words, and a
**diagnostic block** collected from their device:

```
--- Milo diagnostics (please keep this in your email) ---
time      2026-07-27T14:38:24.470Z
app       v65
account   a.parent@example.com  8f3c…
learner   6bd1e9c2-…
storage   local, 4.2MB used
unsynced  3 session(s), 0 check-up(s)
network   online
screen    1024x620
browser   Mozilla/5.0 (iPad; CPU OS 18_2 …) Safari
recent errors:
  2026-07-27T14:12:03.001Z  [promise] Failed to fetch
---
```

**Why this exists:** Milo is local-first. Progress lives on the child's device and syncs
afterwards. So most real failures leave *no trace on the server* — there is nothing in Supabase or
Vercel to look at. This block is often the only evidence that exists.

---

## 7. Reading the block

Go line by line. Each field is a specific bug class.

| Line | Healthy | What a bad value means |
|---|---|---|
| `app` | matches `VERSION` in `public/sw.js` on prod | **Lower than prod = stale shell.** They're running old code — tell them to fully close and reopen the app. `none` on a returning user means the service worker never installed |
| `storage` | `idb` | **`local` = IndexedDB was blocked or hung** (private browsing, strict storage settings, full disk) and the app fell back to localStorage. The single most likely cause of "her progress vanished" |
| `unsynced` | `0 session(s)` | **Non-zero = finished chapters never reached the server.** Their progress exists on the device but not in your database. With `network online`, sync is *failing*, not waiting — check `recent errors` |
| `recent errors` | `none recorded` | `[promise] Failed to fetch` = network or RLS rejection. `[react]` = the app actually crashed on screen |
| `network` | `online` | `OFFLINE` at the time usually explains everything else by itself |
| `browser` | — | Safari on iPad is where this app has historically broken first. Note it |

**The two most common tickets:**

- *"Progress disappeared"* → check `storage` and `unsynced`. If `storage: local`, their browser
  blocked IndexedDB. If `unsynced > 0`, the data is safe on the device and will upload once sync
  works — **do not tell them it is lost.**
- *"It won't load / stuck on the fox"* → check `app`. A stale or missing service worker is the
  usual cause. Full app restart first; if that fails, it's a real bug.

---

## 8. Where to look next

Once you know *who*, paste this to Claude:

> Here is a support report. Learner id is `<id>`, account `<email>`.
> Check whether their sessions actually saved, and pull any Vercel runtime errors for that period.

Claude has direct access to both the database and the Vercel logs. Client error reports carry the
learner id, so searching that id finds every crash that happened to that specific child.

**If it's a real bug**, the order is always:

1. **Everyone or just them?** If everyone — **roll back first, diagnose after**
   ([runbooks/rollback.md](runbooks/rollback.md)).
2. Fix, with a test that fails on the bug.
3. Reply and tell them.

---

## 9. The contact log

One line per contact in [support-log.md](support-log.md). Not a tool — a list.

After ~20 lines you will see the same three problems repeatedly. **Those three are your next
engineering work**, and they beat any feature you could guess at. The log is also where an FAQ
comes from, and an FAQ is what stops you answering the same email forever.

---

## 10. The one request that is not optional

You serve children in the US, so **COPPA gives a parent the right to review and delete their
child's data**, and such a request is a legal obligation with a deadline — not a courtesy.

Today there is no defined path for it, and learner deletion is not audit-logged. That gap belongs
in the lawyer conversation that is already open; the design should come out of that conversation
rather than be guessed at here.

**Until then:** handle any such request personally and immediately, and write down what you did.
