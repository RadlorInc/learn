-- GAME TIME PAUSE — BEFORE the migration 20261017120000 (read-only; counts and booleans only, no child's data).
-- Run in the production SQL editor before approving the migrate run. Expected answers are on each row.
select 'ledger does not have 20261017120000 yet (expect PASS)' as check,
       case when not exists (select 1 from supabase_migrations.schema_migrations where version = '20261017120000') then 'PASS' else 'FAIL' end as result
union all select 'point_events has no paused_left_s column yet (expect PASS)',
       case when not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'point_events' and column_name = 'paused_left_s') then 'PASS' else 'FAIL' end
union all select 'no pause_game_time / resume_game_time yet (expect PASS)',
       case when to_regprocedure('public.pause_game_time(uuid)') is null and to_regprocedure('public.resume_game_time(uuid)') is null then 'PASS' else 'FAIL' end
union all select 'the three replaced functions: SECURITY DEFINER, search_path=public (expect PASS)',
       case when (select bool_and(prosecdef and proconfig = array['search_path=public']) from pg_proc
                  where oid in ('public.game_wallet(uuid)'::regprocedure, 'public.start_game_time(uuid,int)'::regprocedure,
                                'public.end_game_time(uuid)'::regprocedure)) then 'PASS' else 'FAIL' end
-- INFO: games running at this moment. Each is ended by its own clock as before; after the migration a running game
-- can be paused. Compare nothing — it only tells you whether a child is mid-game while the migration runs.
union all select 'INFO game tickets running now',
       (select count(*)::text from public.point_events where reason = 'game' and ends_at > now());
