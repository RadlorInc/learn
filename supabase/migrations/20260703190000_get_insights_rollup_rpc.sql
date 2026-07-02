-- PERF: /insights was shipping every raw session + event row for every learner (90-day window)
-- to the browser and aggregating in JS. This pre-aggregates the heavy `sessions` table in Postgres
-- and returns only compact per-learner rollups + global counts. The small `daily_complete` rows are
-- returned raw so the client keeps computing streaks on LOCAL calendar day-keys (unchanged, DST-safe).
-- SECURITY INVOKER → RLS applies; the learner_access join scopes to the caller's own learners.
-- NOTE: `active_days` is counted on UTC calendar days (a deliberate, stable choice for an aggregate
-- analytics view); first/last/retention/accuracy/streak are exact.
create or replace function public.get_insights_rollup(p_since timestamptz)
returns json
language sql
security invoker
stable
set search_path to 'public'
as $$
  with mine as (
    select learner_id from public.learner_access where parent_id = (select auth.uid())
  ),
  sess as (
    select s.learner_id,
           coalesce(s.completed_at, s.started_at) as t,
           s.phase, s.correct_count, s.wrong_count
    from public.sessions s
    join mine m on m.learner_id = s.learner_id
    where s.started_at >= p_since
  ),
  per_learner as (
    select learner_id,
           (extract(epoch from min(t)) * 1000)::bigint as first_ms,
           (extract(epoch from max(t)) * 1000)::bigint as last_ms,
           count(*)::int                               as sessions,
           count(distinct (t at time zone 'UTC')::date)::int as active_days
    from sess
    group by learner_id
  ),
  evt as (
    select e.event, e.learner_id, e.created_at
    from public.learner_events e
    join mine m on m.learner_id = e.learner_id
    where e.created_at >= p_since
  )
  select json_build_object(
    'per_learner', (select coalesce(json_agg(json_build_object(
                        'learner_id',  learner_id,
                        'first_ms',    first_ms,
                        'last_ms',     last_ms,
                        'sessions',    sessions,
                        'active_days', active_days)), '[]'::json) from per_learner),
    'accuracy', (select json_build_object(
                        'correct',           coalesce(sum(correct_count), 0)::int,
                        'wrong',             coalesce(sum(wrong_count), 0)::int,
                        'practice_sessions', count(*)::int)
                 from sess where phase = 'practice'),
    'event_counts', (select json_build_object(
                        'chapter_open',      count(*) filter (where event = 'chapter_open')::int,
                        'practice_complete', count(*) filter (where event = 'practice_complete')::int,
                        'lesson_skip',       count(*) filter (where event = 'lesson_skip')::int,
                        'daily_open',        count(*) filter (where event = 'daily_open')::int,
                        'daily_complete',    count(*) filter (where event = 'daily_complete')::int)
                     from evt),
    'daily_days', (select coalesce(json_agg(json_build_object(
                        'learner_id', learner_id,
                        'created_at', created_at)), '[]'::json)
                   from evt where event = 'daily_complete')
  );
$$;

revoke execute on function public.get_insights_rollup(timestamptz) from anon, public;
grant  execute on function public.get_insights_rollup(timestamptz) to authenticated;
