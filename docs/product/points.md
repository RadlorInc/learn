# Points and game time

How a child earns points, what they are for, and who decides. Agreed with the founder on 2026-09-17; the rules below
are read from the code and migrations as of 2026-09-28, and each is held by the test named with it.

## Earning

The database awards points from what changed on the child's account. The app never sends a number of points.

| what the child did | points | once? |
|---|---|---|
| a practice answer right on the first try | 2 | per answer |
| a practice answer right after a miss, after tapping Hint, or after the worked steps were shown | 1 | per answer |
| moved up a level on a topic's ladder | 3 | each time the level rises |
| a topic mastered | 15 | first time only |
| a topic done (mastered, or 12 practice answers across sessions) | 10 | first time only |
| a module's mixed practice finished | 10 | per run |

- **KG–2 story chapters earn the same way**, under the chapter's `c:` id: a right answer 2 (first try) or 1 (after a
  miss), a tier up 3, mastered 15 and the chapter finished 10, first time only. A wrong answer earns nothing and is not
  uploaded; the next right one carries the new standing.
- **Nothing is ever taken away** for a miss or a hint (math without fear): a right answer after either earns 1
  instead of 2.
- **At most 300 points a day** (the founder, 2026-09-28; it replaced "no daily cap" from 2026-09-17). The day is the
  child's game-time day (the adult's time zone, UTC until they save the settings). An award that does not fit in what
  is left of today is not made, and never split; the progress is still recorded, and tomorrow pays again.
- **Only real lessons pay.** Progress and points are accepted only for ids in `lesson_catalog`: every Grade 3–8 topic,
  every KG–2 chapter (`c:<chapter>`) and every Grade 3–8 module. Any other id is refused (`P0L01`), and the app keeps
  that answer on the device and tries again later.
- The break screen after a practice session shows an estimate of the points earned, counted on the device
  (`LessonPlayer.tsx`). The database's figure is the real one.

Held by `src/__tests__/lessonPoints.test.ts`, which drives the real functions as the parent, the child's own login and
another family, and by `src/__tests__/pointsCapAndCatalog.test.ts` (the cap and the catalogue).

## Game time

- **8 points buy 1 minute** of game.
- The adult who **owns** the child sets two things on the dashboard's Game time tab: game time on or off, and the most
  minutes per day (the menu offers 10 to 60; the database allows 0 to 240). **The default is on, 20 minutes a day.**
  A viewer and the child's own login can see the settings and cannot change them.
- The day is counted in the adult's time zone, taken from their browser when they save the settings (UTC until then).
- The tab also shows the balance and the minutes played today.

⚠️ **As of 2026-09-28 nothing spends points.** No game is attached, so `/play` says "Games are coming soon!", shows the
balance, and never calls the spending function (`start_game_time`). That followed a child buying minutes, getting
"Time's up!" over an empty placeholder and losing the points (2026-09-26). `src/__tests__/gameTimeNotSpent.test.ts`
fails if any app code calls it; delete that test in the pull request that attaches a game and brings the spending
screen back.

## Points never reset

The balance is the sum of a ledger (`point_events`: earning rows positive, a game-time row negative). Nothing expires,
resets or caps it, and unspent points carry over (confirmed with the founder, 2026-09-19). Rows go only when the
child's data is deleted (the child's profile or the account deleted, or the parent's consent withdrawn).

## Where each rule is enforced

| rule | enforced in |
|---|---|
| how many points an answer, a level, a mastery or a finish is worth | the database (`record_lesson_progress`, `record_module_practice`) |
| mastered and finished pay once | the database (a unique index on the ledger), however often they are sent |
| an answer pays once, even when its upload is retried | the database (each answer carries its own event id) |
| an older device cannot roll a topic back or pay a level again | the database keeps the newest answered standing |
| points can only be written by those functions | the database: the tables are read-only to the app |
| at most 300 points a day | the database (`points_room_today`, used by both functions) |
| only real lessons, chapters and modules pay | the database (`lesson_catalog`, `P0L01` for anything else) |
| only the owning adult changes game time | the database (`set_game_settings`) |
| the daily limit, the on/off switch, the balance, one game at a time | the database (`start_game_time`, unused today) |
| answers wait when offline, and upload later with the same event id | the app (`src/infra/storage/lessonSync.ts`) |
| a child whose consent is not on record: answers wait on the device, never deleted | the database refuses the write; the app holds it |

The tables are `lesson_progress` (done, level, streak and mastered per topic or chapter), `point_events` (the ledger)
and `game_settings`. They were created by migration `20260917112109_lesson_progress_and_points.sql`; chapter ids were
added by `20260920151900`, "newest answer wins" by `20260926100200`. The client code is
`src/data/repositories/points.ts`.

## What the numbers are meant to mean (pre-registered)

The rates are guesses: when they were set, no child had played the new lessons, so the time a lesson and its practice
take was not measured. The target is **3 to 5 minutes of game for every 15 minutes of learning** for a typical child.
When real play data exists, measure minutes of learning per point; if it misses the target, **change the exchange
rate (points per minute), not the earning table**. The table says what is rewarded; the rate says how much.
