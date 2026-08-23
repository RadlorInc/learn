-- Retention for the RAW placement-check answers, splitting them from the CONCLUSION.
--
-- The published copy says "Diagnostic and gameplay analytics are deleted automatically after 90
-- days". learner_events and error_events honour that; diagnostic_* honoured none of it. Rather
-- than reword the promise away, the line is drawn where it actually belongs:
--
--   · diagnostic_items — a child's individual answers, one row per question. That IS analytics,
--     and keeping raw responses for ever fails data minimisation. 90 days, same as the rest.
--   · diagnostic_sessions / _plans / _plan_progress / _rechecks — the derived learning plan and
--     its conclusion. That is PROGRESS, and is kept until the parent deletes the profile.
--
-- ⚠️ VERIFIED AT THE SCHEMA LEVEL BEFORE WRITING THIS: nothing in the app reads diagnostic_items.
-- It is written by sync_diagnostic and never selected. The plan is materialised on
-- diagnostic_plans (skill_sequence / chapter_sequence) and the conclusion on diagnostic_sessions
-- (root_gap_skill, blocked_skills, strengths, working_level), so pruning the answers cannot cost
-- a child their plan. The one thing it does cost is the proposed "how Milo worked it out" trace,
-- which needs the per-question verdicts and will therefore only be available for 90 days.
--
-- ⚠️ A SEPARATE JOB AT THE SAME 03:17 SLOT, not an edit to purge-old-learner-events. Editing a
-- working retention job means unscheduling it first, and a failure between the two leaves the
-- learner_events prune silently switched off. Same schedule, same posture, no risk to a job that
-- is already doing its work.
create or replace function public.prune_diagnostic_items()
returns void
language sql
security definer
set search_path to 'public'
as $$
  delete from public.diagnostic_items where created_at < now() - interval '90 days';
$$;

-- V19 rule: a SECURITY DEFINER function is PUBLIC EXECUTE by default and Supabase exposes every
-- public function at /rest/v1/rpc/<name>. Without this, anyone could wipe the answers on demand.
revoke all on function public.prune_diagnostic_items() from public, anon, authenticated;

select cron.unschedule('prune-diagnostic-items')
where exists (select 1 from cron.job where jobname = 'prune-diagnostic-items');

select cron.schedule('prune-diagnostic-items', '17 3 * * *', $$select public.prune_diagnostic_items()$$);
