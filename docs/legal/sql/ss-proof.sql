-- SHORT SESSIONS — PROOF after the migration 20260925100000 (read-only). Expected: every row PASS, and the two INFO
-- counts = the before-count (rows) and the before-count + 1 (DEFINER functions).
select 'ledger has 20260925100000' as check,
       case when exists (select 1 from supabase_migrations.schema_migrations where version = '20260925100000') then 'PASS' else 'FAIL' end as result
union all select 'lesson_progress.run exists, jsonb, nullable',
       case when exists (select 1 from information_schema.columns where table_schema='public' and table_name='lesson_progress'
                          and column_name='run' and data_type='jsonb' and is_nullable='YES') then 'PASS' else 'FAIL' end
union all select 'no run saved yet (right after the apply)',
       case when not exists (select 1 from public.lesson_progress where run is not null) then 'PASS' else 'FAIL' end
union all select 'save_practice_run: DEFINER, search_path pinned',
       case when exists (select 1 from pg_proc where proname='save_practice_run' and pronamespace='public'::regnamespace and prosecdef
                          and proconfig::text like '%search_path%') then 'PASS' else 'FAIL' end
union all select 'save_practice_run: authenticated yes, anon no',
       case when has_function_privilege('authenticated', 'public.save_practice_run(uuid,text,jsonb)', 'EXECUTE')
             and not has_function_privilege('anon', 'public.save_practice_run(uuid,text,jsonb)', 'EXECUTE') then 'PASS' else 'FAIL' end
union all select 'lesson_progress still not writable by browsers',
       case when not has_table_privilege('authenticated', 'public.lesson_progress', 'INSERT')
             and not has_table_privilege('authenticated', 'public.lesson_progress', 'UPDATE')
             and not has_table_privilege('anon', 'public.lesson_progress', 'SELECT') then 'PASS' else 'FAIL' end
union all select 'consent gate still on lesson_progress',
       case when exists (select 1 from pg_trigger where tgname='trg_enforce_child_consent' and tgrelid='public.lesson_progress'::regclass and tgenabled <> 'D') then 'PASS' else 'FAIL' end
union all select 'INFO lesson_progress rows (must equal the before-count)', (select count(*)::text from public.lesson_progress)
union all select 'INFO SECURITY DEFINER functions in public (before-count + 1)',
       (select count(*)::text from pg_proc where prosecdef and pronamespace='public'::regnamespace);
