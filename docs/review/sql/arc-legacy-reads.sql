-- ARC review — read-only. Needs Rafi to run in the Supabase SQL editor (production). Counts only, no child rows.
-- Answers: are the dashboard's "last played" and /admin's "Learning" panels reading tables nothing writes any more?

-- 1. ChildCard "last played" reads learner_stats.last_played_at (src/app/parent/page.tsx:650).
--    Migration 20260917112252 nulled it and says only the old chapters set it.
--    with_value = 0  -> every child card shows "last played —"  (ARC finding confirmed)
--    with_value > 0  -> something still writes it; newest tells us when (finding wrong or partly wrong)
select count(*) as learners, count(last_played_at) as with_value, max(last_played_at) as newest
from public.learner_stats;

-- 2. admin_learning / admin_funnel count completed chapters from public.sessions
--    (supabase/migrations/20260905150000_admin_role_and_metrics.sql:195, :239).
--    rows = 0 or newest < 2026-09-17 -> the /admin Learning panel measures a system nothing writes (confirmed)
select count(*) as rows, max(completed_at) as newest from public.sessions;

-- 3. The live record the panels SHOULD read, for comparison (positive control: this must be > 0 if children practise).
select count(*) as rows, count(*) filter (where done) as done, count(*) filter (where mastered) as mastered,
       max(updated_at) as newest
from public.lesson_progress;
