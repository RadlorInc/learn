-- POINTS CAP + LESSON CATALOGUE — PROOF after the migration 20260928180000 (read-only; counts and booleans only).
-- Every row should say PASS; the INFO row is compared with the before-SQL's "distinct lesson ids with progress".
select 'ledger has 20260928180000' as check,
       case when exists (select 1 from supabase_migrations.schema_migrations where version = '20260928180000') then 'PASS' else 'FAIL' end as result
union all select 'lesson_catalog holds 341 ids (305 lessons and chapters, 36 modules)',
       case when (select count(*) from public.lesson_catalog) = 341
             and (select count(*) from public.lesson_catalog where kind = 'module') = 36 then 'PASS' else 'FAIL' end
union all select 'lesson_catalog: RLS on, no policies, no client read',
       case when (select relrowsecurity from pg_class where oid = 'public.lesson_catalog'::regclass)
             and not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'lesson_catalog')
             and not has_table_privilege('authenticated', 'public.lesson_catalog', 'SELECT')
             and not has_table_privilege('anon', 'public.lesson_catalog', 'SELECT') then 'PASS' else 'FAIL' end
union all select 'points_room_today: no client can call it',
       case when not has_function_privilege('authenticated', 'public.points_room_today(uuid)', 'EXECUTE')
             and not has_function_privilege('anon', 'public.points_room_today(uuid)', 'EXECUTE') then 'PASS' else 'FAIL' end
union all select 'both point functions: SECURITY DEFINER, search_path=public, callable by authenticated',
       case when (select bool_and(prosecdef and proconfig = array['search_path=public']) from pg_proc
                  where oid in ('public.record_lesson_progress(uuid,text,boolean,integer,integer,boolean,text,uuid,timestamptz)'::regprocedure,
                                'public.record_module_practice(uuid,text,uuid)'::regprocedure))
             and has_function_privilege('authenticated', 'public.record_lesson_progress(uuid,text,boolean,integer,integer,boolean,text,uuid,timestamptz)', 'EXECUTE')
             and has_function_privilege('authenticated', 'public.record_module_practice(uuid,text,uuid)', 'EXECUTE') then 'PASS' else 'FAIL' end
union all select 'both bodies check the catalogue and the room',
       case when (select bool_and(prosrc like '%lesson_catalog%' and prosrc like '%points_room_today%') from pg_proc
                  where oid in ('public.record_lesson_progress(uuid,text,boolean,integer,integer,boolean,text,uuid,timestamptz)'::regprocedure,
                                'public.record_module_practice(uuid,text,uuid)'::regprocedure)) then 'PASS' else 'FAIL' end
union all select 'INFO distinct lesson ids with progress whose id is in the catalogue',
       (select count(distinct lp.lesson_id)::text from public.lesson_progress lp join public.lesson_catalog c on c.id = lp.lesson_id);
