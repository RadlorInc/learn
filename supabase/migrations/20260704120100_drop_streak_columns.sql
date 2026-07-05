-- Product change (founder decision, 2026-07-04): remove the day-streak completely.
-- Step 2 of 2 (DESTRUCTIVE): drop the streak columns from learner_stats.
--
-- Safe only AFTER 20260704120000_sync_session_drop_streak.sql, which redefines sync_session so it no
-- longer reads or writes these columns (and no app code references them any more). Run this through the
-- deploy pipeline's prod-approval gate — do NOT hand-apply on live data. The stored streak values are
-- discarded by design (a day-streak we've decided to stop keeping); this is not recoverable, so it must
-- land after the code that stops reading it is deployed.
ALTER TABLE public.learner_stats
  DROP COLUMN IF EXISTS current_streak,
  DROP COLUMN IF EXISTS longest_streak;
