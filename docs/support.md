# Support — how a user problem gets solved

The operating manual for when a parent writes in. Written for a founder who does not read code:
every step is either something you can do by reading, or something you hand to Claude verbatim.

Related: [devops.md](devops.md) (infrastructure), [runbooks/rollback.md](runbooks/rollback.md)
(undoing a bad deploy), [security.md](security.md).

---

## 1. The channel

**support@mi2utor.com**, linked from the bottom of the parent dashboard as "Need help?".

The promise we make on that screen is **a reply within 2 working days**. That is the only
commitment — keep it, and don't widen it. A promise you miss is worse than no promise.

Check the inbox **once a day**. That is the entire daily support routine at current scale.

---

## 2. What arrives

The "Need help?" panel makes the parent send two things: what happened in their words, and a
**diagnostic block** collected from their device. It looks like this:

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

**Why this exists at all:** Milo is local-first. Progress lives on the child's device and syncs
up afterwards. So most real failures leave *no trace on the server* — there is nothing in
Supabase or Vercel to look at. This block is often the only evidence that exists.

---

## 3. Reading the block

Go line by line. Each field is a specific bug class.

| Line | Healthy | What a bad value means |
|---|---|---|
| `app` | matches the `VERSION` in `public/sw.js` on prod | **Lower than prod = stale shell.** They are running old code. Fix: tell them to fully close and reopen the app. `none` on a returning user means the service worker never installed |
| `storage` | `idb` | **`local` = IndexedDB was blocked or hung** (Safari private browsing, strict storage settings, full disk). The app fell back to localStorage. This is the single most likely cause of "her progress vanished" |
| `unsynced` | `0 session(s)` | **Non-zero = finished chapters never reached the server.** Their progress exists on the device but not in your database. Combined with `network online`, this means the sync is *failing*, not merely waiting — look at `recent errors` |
| `recent errors` | `none recorded` | Read them. `[promise] Failed to fetch` = network/RLS rejection. `[react]` = the app actually crashed on screen |
| `network` | `online` | `OFFLINE` at the time of the report usually explains everything else on its own |
| `browser` | — | Safari on iPad is where this app has historically broken first. Note it |

**The two most common tickets, and their answer:**

- *"Progress disappeared"* → check `storage` and `unsynced`. If `storage: local`, their browser
  blocked IndexedDB — usually private browsing. If `unsynced > 0`, the data is safe on the device
  and will upload once sync works; do not tell them it is lost.
- *"It won't load / stuck on the fox"* → check `app`. A stale or missing service worker is the
  usual cause. Full app restart first; if that fails, it is a real bug.

---

## 4. Where to look next

Once you know *who* it is, you can check the server side. Paste the report to Claude with:

> Here is a support report. Learner id is `<id>`, account `<email>`.
> Check whether their sessions actually saved, and pull any Vercel runtime errors for that period.

Claude has direct access to both your database and your Vercel logs and can answer that in one
pass. The client error reports also carry the learner id now, so a search for that id finds every
crash that happened to that specific child.

**If it turns out to be a real bug**, the order is always:

1. **Is it affecting everyone or just them?** If everyone — roll back first, diagnose after.
   Rollback is Vercel → promote the previous deployment. See [runbooks/rollback.md](runbooks/rollback.md).
2. Fix, with a test that fails on the bug.
3. Reply to the parent telling them it is fixed. This is the step everyone skips and it is the
   one that turns a complaint into loyalty.

---

## 5. The contact log

Keep one line per contact in `docs/support-log.md`. Not a tool — a list.

```
2026-08-03  a.parent@example.com  progress lost, storage:local (private browsing)  → explained, no bug
```

After ~20 lines you will see the same three problems repeatedly. **Those three are your next
engineering work**, and they beat any feature you could guess at. The log is also where an FAQ
comes from, and the FAQ is what stops you answering the same email forever.

---

## 6. The one request that is not optional

You serve children in the US, so **COPPA gives a parent the right to review and delete their
child's data**, and a request to do so is a legal obligation with a deadline — not a courtesy.

Today there is no defined path for it and learner deletion is not audit-logged. That gap belongs
in the lawyer conversation that is already open; the design should come out of that conversation
rather than be guessed at here. Until then, handle any such request personally and immediately,
and write down what you did.
