-- /menu made SIX network round trips where two would do (measured 2026-09-02 from production edge
-- logs, one child's session): `GET /auth/v1/user`, `diagnostic_sessions`, `diagnostic_rechecks`
-- (the week-6 re-check card, sequential), `get_learner_bootstrap`, `diagnostic_plans` (sequential),
-- and the `learner_events` insert. Every one pays the same floor — the project is in Sydney and the
-- users are in the US, 212 ms minimum per request — so the menu's two sequential chains cost about
-- a second of wall time each before any query ran.
--
-- The bootstrap RPC already exists to be "everything the menu needs in one call"; this adds the
-- three rows the menu was fetching separately. Same ordering as the client selects it replaces:
-- `diagnostic_sessions` by `completed_at desc` and `diagnostic_rechecks` by `created_at desc`, both
-- with Postgres' default NULLS FIRST, which is what PostgREST's `.desc` sent.
--
-- Still SECURITY INVOKER: the three new subselects run under the same `diag_*_read` RLS policies
-- the direct selects did, so no new grant and no new path around a policy.

create or replace function public.get_learner_bootstrap(p_learner_id uuid)
 returns json
 language plpgsql
 stable
 set search_path to 'public'
as $$
declare v_role text;
begin
  select access_role into v_role
  from public.learner_access
  where learner_id = p_learner_id and parent_id = (select auth.uid());

  if v_role is null then return null; end if;

  return json_build_object(
    'role',     v_role,
    'stats',    (select to_json(s) from public.learner_stats s where s.learner_id = p_learner_id),
    'progress', (select coalesce(json_agg(p order by p.last_played_at desc nulls last), '[]'::json)
                 from public.learner_progress p where p.learner_id = p_learner_id),
    'state',    (select to_json(st) from public.learner_state st where st.learner_id = p_learner_id),
    -- the week-6 re-check card: the latest check-up and whether a later re-check closed the gap
    'checkup',  (select json_build_object('band', d.band, 'root_gap_skill', d.root_gap_skill, 'completed_at', d.completed_at)
                 from public.diagnostic_sessions d where d.learner_id = p_learner_id
                 order by d.completed_at desc limit 1),
    'recheck_closed', coalesce((select r.gap_closed from public.diagnostic_rechecks r
                                where r.learner_id = p_learner_id order by r.created_at desc limit 1), false),
    -- the active plan's chapter list, for the cross-device plan-pointer reconcile
    'plan',     coalesce((select to_json(dp.chapter_sequence) from public.diagnostic_plans dp
                          where dp.learner_id = p_learner_id and dp.active
                          order by dp.created_at desc limit 1), '[]'::json)
  );
end;
$$;

revoke execute on function public.get_learner_bootstrap(uuid) from anon, public;
grant execute on function public.get_learner_bootstrap(uuid) to authenticated;
