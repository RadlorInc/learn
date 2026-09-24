# Short sessions — what needs the founder (Round 2)

Updated 24 September 2026 after the change of plan: **Part B ships before the launch.** The founder's decisions:
**keep #209** (live); the parent line is **option (a)**, derived from progress, with no legal change. The loop's record is
in `LOOP-STATE.md` → *Short sessions*. Every fact below is measured unless it says otherwise.

## The order: do these in sequence

### 1. #209's migration — `20260925100000_practice_run.sql` (#209 is merged; its client is live)

The Deploy run for #209 is `35994811407`, and its `migrate-prod` job is **waiting for your approval**.

1. **Before-SQL:** run `docs/legal/sql/ss-before.sql` in the Supabase SQL editor. Expect **every row PASS**, then write
   down the two INFO numbers (lesson_progress rows; SECURITY DEFINER functions). If anything FAILs, stop.
2. **Backup:** take a backup now (the nightly-backup workflow run by hand, or a dashboard backup). Wait for it to finish.
3. **Approve:** GitHub → Actions → Deploy → run `35994811407` → *Review deployments* → `production-db` → Approve. Wait
   for `migrate-prod` to go green.
4. **Proof-SQL:** run `docs/legal/sql/ss-proof.sql`. Expect **every row PASS**, "lesson_progress rows" **equal to** step 1,
   and "SECURITY DEFINER functions" = **step 1 + 1** (the new `save_practice_run`).

Until this is done, the live app is safe, as measured: runs are saved per device, and the upload queue never stalls. The
only thing missing is continuing on a second device.

### 2. #210: [#210](https://github.com/RadlorInc/learn/pull/210) (Draft)

- **No migration.** `git diff origin/main -- supabase/` is empty.
- Mark it *Ready for review* only when you mean to merge, then merge it. Its `promote` job moves `release`, and Vercel
  deploys it. There is no `migrate-prod` step for this PR.
- It carries: the two #209 follow-ups (the welcome card's doubled "Welcome back! ⭐"; the "lock" regex); Part B (the
  nudge card); the parent line from progress; doc 08 lines 20 and 33 (published) with the Spanish draft; and the
  CLAUDE.md Draft rule.

### 3. Live checks on radlic.com (after #210 is deployed)

Use a signed-in **test** child. Grade 5 · Module 1 is the example; any module works the same way.

| # | do | expect |
|---|---|---|
| 1 | Open topic 12 "Divide by multiples of 10" with topic 11 "Multiply two big numbers" never practised | the card: *"You're on your way with Multiply two big numbers! ⭐ Getting a bit further there (past halfway) will make Divide by multiples of 10 easier."*, a yellow bar with **no number**, and [Practise … first] [Go to … anyway] |
| 2 | Tap **Go to … anyway** | Screen 1 of the lesson, straight away |
| 3 | Leave, and open topic 12 again the same day | **no card** |
| 4 | Topic 1 of any module | never a card |
| 5 | Go through the lesson; in practice, answer 5 | popup **"5 questions done! ⭐ Nice work."** with [Take a break] [Keep going] |
| 6 | Keep going, then answer 5 more | the popup again at 10 |
| 7 | Take a break | **"Great work, 10 questions done! ⭐"**, "Your spot is saved.", "+N points"; no "of 10", no red |
| 8 | Back to topics | topic 12 shows **"⭐ Keep practising"** |
| 9 | Open topic 12 again | **"Welcome back! ⭐"** once (the crumb above it reads the topic's name) → Keep practising → **the same problem** that was on screen |
| 10 | Close the tab mid-round, reopen, Keep practising | the same problem; the popup comes when that round's 5 are done |
| 11 | (after step 1's migration) the same child on a second device → Modules → topic 12 | Welcome back, the same problem |
| 12 | Parent → the child → **Progress** | a **"Topics in progress"** tile; under **Worth knowing**: *"<name> started “Divide by multiples of 10” before getting far with “Multiply two big numbers”."* |
| 13 | Parent → Lessons: choose topics that do NOT include topic 11 → Progress | that line is **not** shown |
| 14 | Signed out, open `radlic.com/legal/cookies` | the `kv` row names "where they are in each topic's practice" and "the day a … suggestion was last shown"; the signed-out paragraph lists `milo-newflow-standing-device-<topic>`, `milo-newflow-done-device-<topic>` and `milo-kv-migrated` |

Screenshots from the fake-backend run: `docs/legal/screenshots/short-sessions/01`–`06` (05 is the card, 06 is the parent
line).

## What changed in #210 since the first version

- **Parent line, option (a):** `startedAhead()` in `nudge.ts` reads `lesson_progress` only. The line shows for a topic
  the child has started while the previous topic is under halfway, and never names a previous topic outside the child's
  chosen list. **No `learner_events` read or written**: the nudge no longer logs an event at all. The notice already
  covers progress (*"how it shows you progress"*), so no legal text changed for it.
- **Doc 08, published** (`/legal/cookies`), plus the Spanish draft:
  - **line 20** adds *"where they are in each topic's practice"* and *"the day a 'practise the topic before first'
    suggestion was last shown"*;
  - **line 33** no longer says a signed-out device keeps nothing. It names what was **measured on 24 Sep** after a full
    signed-out lesson and practice: `milo-newflow-standing-device-<topic>` (level, right-in-a-row count, mastered),
    `milo-newflow-done-device-<topic>` once finished, and `milo-kv-migrated`. No session storage, no cookies, nothing sent.
  - It is **gated**: `doc08SignedOut.test.ts` (in CI) fails if the stores write a key the page does not name, or the page
    names one nothing writes. `e2e/short-sessions.spec.ts` re-measures the real signed-out flow.
- **CLAUDE.md:** "Open every PR as a Draft; Rafi marks it Ready only when he means to merge."

## Still open

- The Spanish strings (`sessionCopy.ts` `es`, two dashboard lines, doc 08's Spanish draft) are **unreviewed drafts**.
- `scripts/break-check.sh` cannot break an e2e run; it edits a temporary worktree the dev server never serves. A note was
  added to its header. `video_reviewer` has the same tool, and its notes say a lesson learned in one copy should be
  written in the other too.
