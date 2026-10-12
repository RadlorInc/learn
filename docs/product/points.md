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

**Spending (2026-10-01): the game is attached.** On `/play` the child picks 5, 10 or 15 minutes; `start_game_time`
decides (balance, daily minutes, on/off) and returns the end time. `/play` then opens the game — BlockCraft, creative
mode only, built from `blockcraft/` into `public/blockcraft` — as a full page (not a frame: every page keeps
`frame-ancestors 'none'`). The game shows the clock, saves on the device, and returns to `/play` when the time is up;
`/play` uploads that save to `game_saves`, so the next game starts where this one stopped. (From 2026-09-26 to
2026-10-01 nothing spent points: a child had bought minutes over an empty placeholder and lost them.)

**How long a game plays is the database's, not the URL's (2026-10-11).** `/play` opens a game with the child's save
key and id only (`?key=…&learner=…`). The game (`public/play-time.js`, shared by every game) asks `GET /api/game-time`
when it opens and every 30 s; the route passes the adult's own token to `game_wallet` and answers the seconds left by
the server's clock, and the game counts them on `performance.now()`. Editing the URL or the device's clock plays no
longer; no first answer sends the child back to `/play`, and a later failed ask keeps the last answer (it only runs
out). A game opened without `/play` plays only on localhost. Until 11 Oct the end time rode in the URL (`&until=`), so
a child who edited it played longer, and one who removed the query played with no limit.

**A second game (2026-10-11): BeatHop**, a one-button jump-and-glide game (`beathop/`, copied into `public/beathop` by
`npm run build:game`). `/play` shows both; the paid time is for either, and while it lasts the child can switch. BeatHop
takes the same URL (`?key=…&learner=…`), clock and "Stop and keep my minutes", but its save (levels, stars, gems) stays
on the device — `game_saves` holds one save per child, BlockCraft's — so another device starts it at level 1.

**A third game (2026-10-11): Peak Rider**, an open-world 3D driving game seen from behind the car (`peak/`, copied
with its vendored three.js into `public/peak`; everything else is drawn in code, about 750 KB in all). No road to
follow: the child drives anywhere (gas, brake, steer, boost) and does missions — find treasure chests, light the
beacons on the peaks, carry crates to the villages (three hard landings, or one crash, break a crate). No road is
drawn: an arrow with the distance, a map, and a column of light over each mission show the way, and the child can pick
a mission from the pause menu. The ways to the missions pass steep drops, fords, mud, ice, ridges, tunnels and a ravine
only boost can jump. A crash goes back to where the car was safe a moment before. `node peak/check.mjs` (by hand, a few seconds; not in CI) proves every mission can be done by driving
its trail, every marked danger punishes a child who does not control the speed, and no ravine can be jumped without
boost. Same paid time, URL, clock and stop as BeatHop; its save (missions, coins, cars, upgrades) also stays on the
device. Its coins are the game's own and buy only things inside the game — they are not points.

**A fourth game (2026-10-11): Rescue Rush** (`rush/`, copied into `public/rush`; it uses Peak Rider's three.js, so it
adds about 60 KB). The child drives a rescue vehicle through traffic to a hospital before the clock runs out — eight
calls on South Asian roads (tea gardens, a market, the coast, the desert, a monsoon city, a ghat road, a night market,
a snowy pass) with cars, auto-rickshaws, scooters, buses and painted trucks. A SIREN asks the vehicles ahead to pull
over; it needs time to fill again. A crash costs one of the patient's three hearts. `node rush/check.mjs` (by hand, a
second; not in CI) proves every call can be done in time, that a steady 54 km/h runs out of time, and that driving straight
down one lane crashes out. The vehicle speeds up by itself: the child steers, brakes and sounds the siren. Same paid time, URL, clock, stop and device-only save as the other games.

**Stopping early gives the unused minutes back.** The clock is the database's and keeps running while the child is off
the game, so the game's pause menu and `/play` both offer "Stop and keep my minutes": `end_game_time` shrinks the
purchase to the time played and ends it. Points follow the seconds (1 point per 7.5 s, rounded up, at least 1 point),
so the rest come back; the daily limit counts minutes, a started one in full (at least 1). Stopping at 1:17 of 2 minutes
pays 11 points and gives 5 back.

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
| the daily limit, the on/off switch, the balance, one game at a time | the database (`start_game_time`; `end_game_time` stops early) |
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
