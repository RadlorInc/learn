# Short sessions — what needs the founder (Round 2)

Written 24 September 2026. The loop's record, step by step: `LOOP-STATE.md` → *Short sessions*. Every fact below
is measured unless it says otherwise; each says where.

## 0. ⚠️ Read first: PR #209 is already on production's client

**#209 (Part A) was merged at 11:44 UTC on 24 Sep by the `Rafiquekuwari` account**, although its title said *do not
merge before the launch weekend*. The agent merged nothing. What happened next, read from GitHub (Deploy run
`35994811407`):

| step | state |
|---|---|
| `ci / verify`, `ci / rls-tests` | ✅ success |
| `promote` | ✅ success, so **`release` = `3bdf7f80`** and Vercel production builds Part A's client |
| `migrate-prod` | ⏸ **waiting for your `production-db` approval**: migration `20260925100000` is NOT applied |

**What the live app does until you approve** (measured on 24 Sep against Supabase's own PostgREST image, run locally,
with a control): an unknown column in a select answers `42703` / HTTP 400, and a missing function answers `PGRST202` /
HTTP 404. Those are exactly the two codes the client handles:
- practice, checkpoints, Take a break and resume **work on each device** (the run is saved on the device);
- saving the run to the account is skipped, and **nothing else in the upload queue waits behind it** (points and progress
  still go up);
- reading progress retries without `run`, so the home screen's pull still works.
- **Not until you approve:** continuing on a *different* device.

**Your choice.** (A) **Keep it**, and approve the migration when convenient, using the pattern in §2. (B) **Take it back
out before Friday**: revert #209 on GitHub (that deploys the old client through the same gate) and reject the waiting
`migrate-prod`. The agent recommends **(A)**: the tolerance is measured, and every check in #209 was watched failing.
But it changes what children see on the day before the beta, so it is your call. **#209 went out without two small
follow-up fixes**, which are in #210: the welcome card showed "Welcome back! ⭐" twice (crumb and heading), and the
forbidden-words test did not see the word "lock" (test only; no child string contained it).

## 1. The PRs, and their merge order (after the launch weekend)

| order | PR | what | state |
|---|---|---|---|
| — | [#209](https://github.com/RadlorInc/learn/pull/209) | Part A: checkpoint every 5, Take a break, exact resume, `lesson_progress.run` | **merged 24 Sep 11:44 UTC** (see §0) |
| 1 | [#210](https://github.com/RadlorInc/learn/pull/210) | the two #209 follow-ups · Part B: the prerequisite nudge + the parent line · the e2e spec + screenshots | open, CI green (verify + rls-tests). **Merge only after deciding §4 item 3** |

## 2. The migration: `20260925100000_practice_run.sql` (expand-only; adds one SECURITY DEFINER function)

1. **Before:** run `docs/legal/sql/ss-before.sql` in the SQL editor. Expect every row **PASS**, and keep the two INFO
   numbers (lesson_progress rows; DEFINER functions).
2. **Backup:** take one first (the usual nightly-backup workflow, or a manual dump).
3. **Merge:** done (#209).
4. **Approve** the waiting `production-db` job: Actions → Deploy → run `35994811407` → *Review deployments*.
5. **Proof:** run `docs/legal/sql/ss-proof.sql`. Expect every row **PASS**, the row count **equal** to the before-count, and
   DEFINER functions **before + 1**.

Both SQL files are rehearsed in the suite on the production-shaped schema (`practiceRun.test.ts`, *the founder's
before/proof SQL*), and they were watched failing when broken. If step 1 shows any FAIL, stop and do not approve.

## 3. In-app checks (any signed-in test child, Grade 5 · Module 1 · topic 12 "Divide by multiples of 10")

| do | expect |
|---|---|
| Start the topic's practice and answer 5 | popup **"5 questions done! ⭐ Nice work."** [Take a break] [Keep going] |
| Keep going, answer 5 more | the same popup at 10 |
| Take a break | **"Great work, 10 questions done! ⭐"**, "Your spot is saved.", "+N points"; no "of 10", no red |
| Back to topics | topic 12 carries **"⭐ Keep practising"** |
| Open topic 12 again | **"Welcome back! ⭐"**: Keep practising → the same problem that was on screen |
| Close the tab mid-round, reopen | Welcome back → the same problem; the next popup comes when the round's 5 are done |
| (after the migration) the same child on another device → Modules → topic 12 | Welcome back, same problem |
| **after #210:** a topic whose previous topic is under halfway | the nudge card: a bar with no number, both buttons; "Go to … anyway" opens the lesson in one tap |
| the same topic again the same day | no card |
| **after #210:** parent → the child → Progress | "Topics in progress"; after an "anyway", **Worth knowing**: "<name> started “X” before getting far with “Y”." |

Screenshots of each, from the fake-backend run: `docs/legal/screenshots/short-sessions/01`–`06`.

## 4. Legal lines for you to decide (rule 4); nothing was changed

1. **The saved run is covered. No change is proposed.** Doc 02 line 33 and doc 11 line 56 already name "answers …
   progress", *"how the app decides what to teach next and how it shows you progress"*. Where a child is in a topic's
   practice is progress, used for exactly that. It sits in `lesson_progress`, which docs 06 and 04 already list, and it
   is exported and deleted with it (both proven by tests). **No notice bump.**
2. **Doc 08 (the storage page, published for the beta), line 20**, the `kv` store row. Today: *"Your child's profile,
   what they last played, work waiting to sync if you go offline, voice and speed preferences, and the chosen
   language."* **Proposed:** *"Your child's profile, what they last played **and where they are in each topic's
   practice**, work waiting to sync if you go offline, **the day a 'practise the topic before first' suggestion was last
   shown**, voice and speed preferences, and the chosen language."* Doc 08 is not the notice, so there is no version bump.
3. **The parent line (#210) is a new use of a product event, so the documents do not describe it yet.** Doc 02 line 36 and
   doc 11 line 58 say product events are *"so we can see which parts of the app are used"*. Showing one of them on the
   parent's dashboard is a second purpose. Pick one:
   - **(a) (recommended) Derive the line from progress instead.** "Started X before getting far with Y" can be read from
     `lesson_progress` (X has progress; Y is under halfway), which the notice already covers (*"how it shows you
     progress"*). **No legal change.** The meaning shifts slightly: the line would appear whenever that is true, not only
     after the child tapped "anyway". A small change to #210 on your word.
   - **(b) Change the notice.** Doc 02 line 36's purpose becomes *"So we can see which parts of the app are used, and to
     tell you on your dashboard when your child chose to start a topic before getting far with the one before."* The same
     sentence goes in doc 11 line 58. This is the direct notice, so it needs **`notice-v7`**: a new version row, a
     migration registering it, the Spanish draft, and the consent copy hash updated. It is proposed, not done.
   - **(c)** Drop the parent line.

## 5. Found on the way (written down, not fixed)

1. **Doc 08 line 33 is false today, as measured on 24 Sep.** It says *"after a full lesson and practice session signed
   out, the on-device store was empty."* A signed-out visitor who opens `/lesson?id=g5m1-t12` and answers one practice
   problem leaves `milo-newflow-standing-device-g5m1-t12` in the device store (IndexedDB `milo`/`kv`, read back in a
   Playwright run). It predates these PRs: `lessonStanding.ts` writes a `device` key when no child is signed in (measured), and
   `lessonProgress.ts` does the same when a topic is finished (read from the code, not driven). The new run key is **not** written signed out. Fix either the code (keep nothing for a signed-out
   visitor, as the run already does) or the sentence.
2. **`scripts/break-check.sh` cannot see a break in an e2e run.** It applies the break in a **temporary worktree**,
   while the dev server serves your own tree, so the e2e runs against unbroken code. Here that meant **5 passed on the
   "broken" state**. The e2e breaks in this loop were planted in the served tree, with a file copy and an `EXIT` trap, and
   all three went red on their own `expect`. A note was added to the script's header. The same tool exists in
   `video_reviewer`, and its notes say a lesson learned in one copy should be written in the other too.

## 6. Blocked / open

- **§0:** your choice (A) or (B).
- **§4:** items 2 and 3.
- The Spanish strings (`sessionCopy.ts` `es`, and two dashboard lines) are **unreviewed drafts**. The child screens have
  no language switch yet, so children see English whatever the device says.
