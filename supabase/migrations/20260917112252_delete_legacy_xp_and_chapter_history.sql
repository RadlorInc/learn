-- Delete the old XP economy and the old chapter history. Founder's call, 2026-09-17: "Purana XP aur chapter history
-- database se bhi delete karni hai". The old chapters are hidden (LEGACY_CHAPTERS_HIDDEN); progress and points now
-- live in lesson_progress / point_events (20260917112109).
--
-- ✅ APPLIED TO PRODUCTION 2026-09-17 by hand (ledger version 20260917112252; file renamed to match). Measured after:
-- sessions 0, learner_progress 0, learner_state 0, learner_stats 23 rows with 0 still holding XP/coins/level/last
-- played; learners 23, diagnostic_sessions 9 and learner_events 364 unchanged (the untouched controls).
--
-- ⚠️ DATA ONLY, IRREVERSIBLE. No table, column, policy, grant or function changes. Measured on production just before
-- applying: sessions 24 rows, learner_progress 20, learner_state 1 (coins_spent 45), learner_stats 23 rows of which 6
-- held XP/coins/a level above 1. Nothing references sessions / learner_progress / learner_stats / learner_state by
-- foreign key (pg_constraint, measured), and their only triggers are BEFORE UPDATE updated_at stamps.
--
-- learner_stats rows are KEPT and zeroed rather than deleted: a trigger creates one per learner and the dashboard
-- bootstrap reads it. last_played_at is cleared too — it was set only by playing the old chapters.
-- NOT touched: the placement-check (diagnostic_*) tables and learner_events.
-- On a fresh database (CI) this affects no rows.

delete from public.sessions;
delete from public.learner_progress;
delete from public.learner_state;
update public.learner_stats set total_xp = 0, total_coins = 0, current_level = 1, last_played_at = null
 where total_xp <> 0 or total_coins <> 0 or current_level <> 1 or last_played_at is not null;
