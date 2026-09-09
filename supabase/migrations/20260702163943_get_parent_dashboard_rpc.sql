-- PERF: one round trip for the whole parent dashboard instead of, per learner,
-- (stats + progress + recent-sessions + access-role) fired separately. Mirrors
-- get_learner_bootstrap: SECURITY INVOKER so RLS still applies; the parent_id =
-- auth.uid() join is the access gate (a caller only ever sees their own learners).
create or replace function public.get_parent_dashboard()
returns json
language sql
security invoker
stable
set search_path to 'public'
as $$
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
                           order by se.started_at desc nulls last
                           limit 3) x)
      ) as obj
    from public.learner_access la
    join public.learners l on l.id = la.learner_id
    where la.parent_id = (select auth.uid())
  ) t;
$$;

revoke execute on function public.get_parent_dashboard() from anon, public;
grant  execute on function public.get_parent_dashboard() to authenticated;
