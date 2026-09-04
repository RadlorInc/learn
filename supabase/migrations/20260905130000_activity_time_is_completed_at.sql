-- ⚠️⚠️ STOP — DEPLOY ORDER. SHIP THE CLIENT BEFORE APPLYING THIS MIGRATION.
--
--   The backfill at the bottom sets `sessions.started_at` to NULL on every legacy row. A browser
--   still running a bundle from before 2026-09-05 renders a session's date as
--   `new Date(s.started_at)`, and `new Date(null)` is the epoch — so a parent would open the
--   dashboard and see every one of their child's past sessions dated 1/1/1970. Verified, not
--   assumed: `new Date(null).toLocaleDateString()` === "1/1/1970".
--
--   The corrected client reads `completed_at` and falls back to '—'. It is in the same commit as
--   this file. If you are applying migrations from a checkout that is AHEAD of what Vercel has
--   deployed, wait for the deploy first.
--
--   This is expand/contract: readers tolerate both shapes FIRST, data moves SECOND. See
--   docs/backup-restore-runbook.md and the rule in CLAUDE.md.
--
-- ─────────────────────────────────────────────────────────────────────────────────────────────
-- The activity timestamp is `completed_at`. `started_at` is ONLY for duration.
--
-- ⚠️ THIS IS A PREREQUISITE FOR 20260905120000, NOT A TIDY-UP. That migration lets `started_at` be
-- NULL (honestly "this client did not tell us"). Several readers were written against a comment
-- saying started_at is "always set", and a NULL silently DROPS THE ROW from each:
--
--   measured 2026-09-05, two learners, one with a NULL started_at:
--     count(distinct learner_id) where started_at > now() - '1 day'             ->  1 of 2
--     count(distinct learner_id) where coalesce(completed_at, started_at) > ... ->  2 of 2
--
-- A dropped row is not an error. DAU/WAU/MAU would have drifted downward as old bundles wrote
-- NULLs and read as a quiet week — the same silent-undercount class as everything else found this
-- week. So it is fixed BEFORE the nullable column reaches production.
--
-- `completed_at` is the honest answer to "when did this session happen": the client's stamp at the
-- moment the chapter finished. Set on 49 of 49 production rows, and a required parameter of
-- `sync_session`. `coalesce(..., started_at)` keeps legacy rows working — those hold their INSERT
-- time, and nothing better exists for them.
--
-- ⚠️ BOTH BODIES BELOW ARE `pg_get_functiondef` OUTPUT FROM PRODUCTION (2026-09-05) WITH ONE LINE
-- CHANGED EACH. An earlier draft of this file RETYPED the rollup from a partial read and silently
-- invented a different return shape — it dropped `active_days`, `accuracy`, `event_counts` and
-- `daily_days`, and added a SECURITY DEFINER the original does not have. Copy the definition; do
-- not reconstruct it.

CREATE OR REPLACE FUNCTION public.get_insights_rollup(p_since timestamp with time zone)
 RETURNS json
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with mine as (
    select learner_id from public.learner_access where parent_id = (select auth.uid())
  ),
  sess as (
    select s.learner_id,
           coalesce(s.completed_at, s.started_at) as t,
           s.phase, s.correct_count, s.wrong_count
    from public.sessions s
    join mine m on m.learner_id = s.learner_id
    -- ⚠️ CHANGED: was `s.started_at >= p_since`, which drops every NULL-start row entirely.
    where coalesce(s.completed_at, s.started_at) >= p_since
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
$function$;

-- The parent dashboard's "3 most recent sessions". `nulls last` is exactly wrong once a NULL start
-- is possible: a brand-new row sorts to the BOTTOM, so a parent's three newest sessions would be
-- replaced by the three oldest ones that happen to have a non-null start. Body is production's
-- `pg_get_functiondef` output with one line changed.

CREATE OR REPLACE FUNCTION public.get_parent_dashboard()
 RETURNS json
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select coalesce(json_agg(obj order by ord asc), '[]'::json)
  from (
    select
      l.created_at as ord,
      json_build_object(
        'learner',  to_json(l),
        'role',     la.access_role,
        'stats',    (select to_json(s) from public.learner_stats s where s.learner_id = l.id),
        'progress', (select coalesce(json_agg(p order by p.last_played_at desc nulls last), '[]'::json)
                     from public.learner_progress p where p.learner_id = l.id),
        'sessions', (select coalesce(json_agg(x), '[]'::json)
                     from (select se.* from public.sessions se
                           where se.learner_id = l.id
                           -- ⚠️ CHANGED: was `se.started_at desc nulls last`.
                           order by coalesce(se.completed_at, se.started_at) desc nulls last
                           limit 3) x)
      ) as obj
    from public.learner_access la
    join public.learners l on l.id = la.learner_id
    where la.parent_id = (select auth.uid())
  ) t;
$function$;

-- Both ACLs read {postgres,authenticated,service_role}=X on production 2026-09-05. `create or
-- replace` preserves existing privileges, so these are belt-and-braces — and they are the paired
-- GRANT for the REVOKE, because "nobody unauthorised can call it" and "nobody at all can call it"
-- are the same green.
revoke all on function public.get_insights_rollup(timestamptz) from public, anon;
revoke all on function public.get_parent_dashboard() from public, anon;
grant execute on function public.get_insights_rollup(timestamptz) to authenticated, service_role;
grant execute on function public.get_parent_dashboard() to authenticated, service_role;

-- ── The 49 existing rows hold a known-false value ────────────────────────────────────────────
-- Their `started_at` is the row's INSERT time. It LOOKS like data, and a dashboard would compute
-- durations from it forever. Measured on production 2026-09-05: 49 of 49 have
-- started_at >= completed_at, i.e. every one is provably not a start.
--
-- ⚠️ SAFE ONLY BECAUSE THE STATEMENTS ABOVE RAN FIRST. Before them, activity was read off
-- started_at, and nulling it would have erased all 49 sessions from DAU/WAU/MAU and the insights
-- rollup. Now activity comes from completed_at — set on 49 of 49 — so this touches duration only.
--
-- ⚠️ DEPLOY ORDER: SHIP THE CLIENT BEFORE APPLYING THIS. The old bundle renders a session's date
-- as `new Date(s.started_at)`, and `new Date(null)` is 1/1/1970 — a parent would see backfilled
-- sessions dated 1970. The corrected client reads completed_at and falls back to '—'.
--
-- The condition is the guard: a row that IS a real measurement (started_at < completed_at) is
-- never touched, so re-running this is a no-op rather than data loss.
update public.sessions
   set started_at = null
 where started_at is not null
   and completed_at is not null
   and started_at >= completed_at;
