-- Give back every point a child spent on game time (2026-09-26).
--
-- Why: /play let a child buy minutes, but no game is attached yet, so they got "Time's up!" over an empty
-- placeholder and lost the points. The app now says "Games are coming soon!" and spends nothing (PR: play-coming-soon).
--
-- How it works: a child's balance is SUM(points) over their point_events rows, and each purchase is ONE row with
-- reason = 'game' and negative points (-8 per minute). Deleting those rows puts the points back and also clears
-- "minutes played today". No other kind of row is touched.
--
-- Run in the Supabase SQL editor. Part A only reads. Part B changes data. Run A, check the numbers, then run B.

-- ── Part A: what was spent (read-only) ──────────────────────────────────────────────────────────────────────
select learner_id,
       count(*)          as purchases,
       sum(minutes)      as minutes_bought,
       -sum(points)      as points_to_give_back,
       min(created_at)   as first_purchase,
       max(created_at)   as last_purchase
from public.point_events
where reason = 'game'
group by learner_id
order by points_to_give_back desc;

-- ── Part B: give the points back ────────────────────────────────────────────────────────────────────────────
-- The deleted rows are printed (RETURNING) — copy the output somewhere if you want a record of the refund.
begin;
delete from public.point_events
where reason = 'game'
returning learner_id, points, minutes, created_at;
-- Should print 0: nothing is left to refund.
select count(*) as game_rows_left from public.point_events where reason = 'game';
commit;
