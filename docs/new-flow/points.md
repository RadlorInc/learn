# Points — how a child earns game time

Agreed with the founder 2026-09-17, built the same day (branch `dashboard-topics-mastered`).

✅ **Migration `20260917112109_lesson_progress_and_points.sql` was applied to production on 2026-09-17** (measured
after: see its header). If a database ever lacks it, the app still works per device: uploads wait in a local
queue, and the dashboard and `/play` say game time is coming soon.

## Where it lives
- **Database:** `lesson_progress` (done + ladder standing per topic), `point_events` (the ledger), `game_settings`
  (the parent's rules) and five functions — the migration header states the security posture. Tested as the real
  roles in `src/__tests__/lessonPoints.test.ts`.
- **Sync:** `src/infra/storage/lessonSync.ts` — every change is queued and uploaded; the child's home and the parent
  dashboard pull the account's progress onto the device. `src/__tests__/lessonSync.test.ts`.
- **Child:** points on the home bar → `/play`, which says **"Games are coming soon!"** and shows the points. ⚠️ Since
  2026-09-26 `/play` spends NOTHING (founder: a child bought minutes, got "Time's up!" over an empty placeholder and
  lost the points). The app no longer calls `start_game_time`, and `gameTimeNotSpent.test.ts` fails if anything in
  `src/` calls it again. When a game is attached, bring the spending screen back from git history with it.
- **Parent:** the dashboard's 🎮 Game time card (points, minutes played today, on/off, most minutes per day — the
  owning parent only) and the Topics card (done / mastered per module). XP, coins, levels and the old chapter
  history were removed from the dashboard, and the old `/profile` page was deleted (founder, 2026-09-17). The old
  rows are still in the database and in the data export.

## Earning

| what the child did | points |
|---|---|
| practice problem right on the first try | 2 |
| right after a miss, or after the worked steps | 1 |
| moved up a level on a topic's ladder | +3 |
| topic mastered (first time only) | +15 |
| lesson finished (first time only) | +10 |
| module practice finished | +10 |

- **No daily earning cap** (founder's call). Farming is held back by the ladder instead: two first-try answers
  move the child up, so nobody can sit on easy questions collecting 2s.
- A miss never scores 0 and a hint never costs points (math without fear).
- Points are **server-side, as a ledger** (earn / spend rows, balance = sum), never a device counter: they buy
  game time, and a local number is editable and lost on another device. Derive them on the server, as
  `sync_session` already derives XP.

## Spending

- **8 points = 1 minute** of game, stopped by a timer.
- The parent sets a daily maximum of game minutes (default **20**) and can switch the game off.
- Unspent points carry over (there is no cap on earning, so a reset would only punish saving up). ⚠️ Not
  explicitly confirmed by the founder.
- The day is counted in the parent's time zone, taken from their browser when they save the settings (UTC until then).

## What the numbers are supposed to mean — pre-registered

The rates are **guesses**: no child has played the new flow, so the ~15 min per lesson + practice is not
measured. The target is **3–5 minutes of game per 15 minutes of learning** for a typical child. When real
play data exists, measure minutes-of-learning per point; if it misses the target, **change the exchange rate
(points per minute), not the earning table** — the table encodes what we reward, the rate encodes how much.
