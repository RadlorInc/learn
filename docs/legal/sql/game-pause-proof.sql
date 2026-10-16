-- GAME TIME PAUSE — PROOF after the migration 20261017120000 (read-only; counts and booleans only, no child's data).
-- Every row should say PASS. The INFO row is how many tickets are paused right now (0 or more; never an error).
select 'ledger has 20261017120000' as check,
       case when exists (select 1 from supabase_migrations.schema_migrations where version = '20261017120000') then 'PASS' else 'FAIL' end as result
union all select 'point_events.paused_left_s exists, int, nullable, checked 1..3600',
       case when exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'point_events'
                           and column_name = 'paused_left_s' and data_type = 'integer' and is_nullable = 'YES')
             and exists (select 1 from pg_constraint where conrelid = 'public.point_events'::regclass and contype = 'c'
                           and pg_get_constraintdef(oid) like '%paused_left_s%3600%') then 'PASS' else 'FAIL' end
union all select 'clients still cannot write point_events (select only)',
       case when not has_table_privilege('authenticated', 'public.point_events', 'UPDATE')
             and not has_table_privilege('authenticated', 'public.point_events', 'INSERT')
             and not has_table_privilege('anon', 'public.point_events', 'SELECT') then 'PASS' else 'FAIL' end
union all select 'all five game-time functions: SECURITY DEFINER, search_path=public',
       case when (select count(*) = 5 and bool_and(prosecdef and proconfig = array['search_path=public']) from pg_proc
                  where oid in ('public.pause_game_time(uuid)'::regprocedure, 'public.resume_game_time(uuid)'::regprocedure,
                                'public.game_wallet(uuid)'::regprocedure, 'public.start_game_time(uuid,int)'::regprocedure,
                                'public.end_game_time(uuid)'::regprocedure)) then 'PASS' else 'FAIL' end
union all select 'all five: authenticated may call, anon may not',
       case when (select bool_and(has_function_privilege('authenticated', f, 'EXECUTE') and not has_function_privilege('anon', f, 'EXECUTE'))
                  from unnest(array['public.pause_game_time(uuid)', 'public.resume_game_time(uuid)', 'public.game_wallet(uuid)',
                                    'public.start_game_time(uuid,int)', 'public.end_game_time(uuid)']) f) then 'PASS' else 'FAIL' end
union all select 'pause/resume proacl: EXECUTE only for authenticated, service_role and the owner (no PUBLIC entry)',
       case when not exists (select 1 from pg_proc p, aclexplode(p.proacl) a
                              where p.oid in ('public.pause_game_time(uuid)'::regprocedure, 'public.resume_game_time(uuid)'::regprocedure)
                                and a.grantee not in (select oid from pg_roles where rolname in ('authenticated', 'service_role'))
                                and a.grantee <> p.proowner)
             and (select bool_and(proacl is not null) from pg_proc
                  where oid in ('public.pause_game_time(uuid)'::regprocedure, 'public.resume_game_time(uuid)'::regprocedure)) then 'PASS' else 'FAIL' end
union all select 'each body checks learner_access against auth.uid() and takes the learner lock',
       case when (select bool_and(prosrc like '%learner_access%auth.uid()%' and prosrc like '%pg_advisory_xact_lock(hashtext(p_learner::text))%') from pg_proc
                  where oid in ('public.pause_game_time(uuid)'::regprocedure, 'public.resume_game_time(uuid)'::regprocedure)) then 'PASS' else 'FAIL' end
union all select 'game_wallet reports paused_left; end_game_time refunds a paused ticket; start_game_time resumes one',
       case when (select prosrc like '%paused_left%' from pg_proc where oid = 'public.game_wallet(uuid)'::regprocedure)
             and (select prosrc like '%paused_left_s is not null%' from pg_proc where oid = 'public.end_game_time(uuid)'::regprocedure)
             and (select prosrc like '%resume_game_time%' from pg_proc where oid = 'public.start_game_time(uuid,int)'::regprocedure) then 'PASS' else 'FAIL' end
union all select 'at most one paused ticket per child',
       case when not exists (select 1 from public.point_events where paused_left_s is not null group by learner_id having count(*) > 1) then 'PASS' else 'FAIL' end
union all select 'INFO game tickets paused now',
       (select count(*)::text from public.point_events where paused_left_s is not null);
