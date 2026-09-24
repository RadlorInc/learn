-- SHORT SESSIONS — BEFORE the migration 20260925100000 (read-only). Run in the SQL editor; keep the output.
-- Expected: every row PASS; note the two INFO counts — the proof must show the same numbers.
select 'ledger does NOT yet have 20260925100000' as check,
       case when not exists (select 1 from supabase_migrations.schema_migrations where version = '20260925100000') then 'PASS' else 'FAIL' end as result
union all select 'lesson_progress.run does not exist yet',
       case when not exists (select 1 from information_schema.columns where table_schema='public' and table_name='lesson_progress' and column_name='run') then 'PASS' else 'FAIL' end
union all select 'save_practice_run does not exist yet',
       case when not exists (select 1 from pg_proc where proname='save_practice_run' and pronamespace='public'::regnamespace) then 'PASS' else 'FAIL' end
union all select 'consent gate is on lesson_progress',
       case when exists (select 1 from pg_trigger where tgname='trg_enforce_child_consent' and tgrelid='public.lesson_progress'::regclass) then 'PASS' else 'FAIL' end
union all select 'INFO lesson_progress rows (must equal the proof''s count)', (select count(*)::text from public.lesson_progress)
union all select 'INFO SECURITY DEFINER functions in public (the proof shows exactly one more)',
       (select count(*)::text from pg_proc where prosecdef and pronamespace='public'::regnamespace);
