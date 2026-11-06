-- ASK MATHS — PROOF after the migration 20261021120000 (read-only; counts and booleans only, no child's data).
-- The founder runs it in the Supabase SQL editor (the agent never queries production). Every row should say PASS.
-- The two INFO rows are counts (0 before anyone has used Ask maths; never an error).
select 'ledger has 20261021120000' as check,
       case when exists (select 1 from supabase_migrations.schema_migrations where version = '20261021120000') then 'PASS' else 'FAIL' end as result
union all select 'the three tables exist with RLS on',
       case when (select count(*) = 3 and bool_and(relrowsecurity) from pg_class
                  where oid in ('public.ask_maths_settings'::regclass, 'public.ask_maths_questions'::regclass, 'public.addon_subscriptions'::regclass))
            then 'PASS' else 'FAIL' end
union all select 'clients may only SELECT them (no insert, update or delete; anon nothing)',
       case when (select bool_and(has_table_privilege('authenticated', t, 'SELECT')
                    and not has_table_privilege('authenticated', t, 'INSERT') and not has_table_privilege('authenticated', t, 'UPDATE')
                    and not has_table_privilege('authenticated', t, 'DELETE') and not has_table_privilege('anon', t, 'SELECT'))
                  from unnest(array['public.ask_maths_settings', 'public.ask_maths_questions', 'public.addon_subscriptions']) t)
            then 'PASS' else 'FAIL' end
union all select 'the consent gate is on both child tables',
       case when (select count(*) from pg_trigger where tgname = 'trg_enforce_child_consent' and not tgisinternal
                  and tgrelid in ('public.ask_maths_settings'::regclass, 'public.ask_maths_questions'::regclass)) = 2 then 'PASS' else 'FAIL' end
union all select 'the four functions: SECURITY DEFINER, search_path=public',
       case when (select count(*) = 4 and bool_and(prosecdef and proconfig = array['search_path=public']) from pg_proc
                  where oid in ('public.set_ask_maths(uuid,boolean,integer,text)'::regprocedure, 'public.ask_maths_begin(uuid,text)'::regprocedure,
                                'public.ask_maths_finish(uuid,text,jsonb)'::regprocedure, 'public.ask_maths_forget(uuid)'::regprocedure)) then 'PASS' else 'FAIL' end
union all select 'set_ask_maths / ask_maths_begin / ask_maths_forget: authenticated yes, anon no',
       case when (select bool_and(has_function_privilege('authenticated', f, 'EXECUTE') and not has_function_privilege('anon', f, 'EXECUTE'))
                  from unnest(array['public.set_ask_maths(uuid,boolean,integer,text)', 'public.ask_maths_begin(uuid,text)', 'public.ask_maths_forget(uuid)']) f)
            then 'PASS' else 'FAIL' end
union all select 'ask_maths_finish: service_role only (a browser can never set an outcome)',
       case when has_function_privilege('service_role', 'public.ask_maths_finish(uuid,text,jsonb)', 'EXECUTE')
             and not has_function_privilege('authenticated', 'public.ask_maths_finish(uuid,text,jsonb)', 'EXECUTE')
             and not has_function_privilege('anon', 'public.ask_maths_finish(uuid,text,jsonb)', 'EXECUTE') then 'PASS' else 'FAIL' end
union all select 'the 30-day job is scheduled at 03:52',
       case when exists (select 1 from cron.job where jobname = 'prune-ask-maths-questions' and schedule = '52 3 * * *'
                           and command like '%ask_maths_questions%30 days%') then 'PASS' else 'FAIL' end
union all select 'closing an account queues the add-on cancel (trigger on addon_subscriptions)',
       case when exists (select 1 from pg_trigger where tgname = 'trg_billing_queue_cancel_on_delete' and not tgisinternal
                           and tgrelid = 'public.addon_subscriptions'::regclass) then 'PASS' else 'FAIL' end
union all select 'withdraw-all queues the add-on too, and keeps DEFINER',
       case when (select prosecdef and pg_get_functiondef(oid) like '%addon_subscriptions%' from pg_proc
                  where oid = 'public.consent_withdraw_account(uuid)'::regprocedure) then 'PASS' else 'FAIL' end
union all select 'deletion_log accepts the new path',
       case when exists (select 1 from pg_constraint where conname = 'deletion_log_path_check'
                           and pg_get_constraintdef(oid) like '%ask_maths_forget%') then 'PASS' else 'FAIL' end
union all select 'INFO: children with Ask maths switched on', (select count(*)::text from public.ask_maths_settings where enabled)
union all select 'INFO: families with the add-on active', (select count(*)::text from public.addon_subscriptions where status in ('active', 'trialing'));
