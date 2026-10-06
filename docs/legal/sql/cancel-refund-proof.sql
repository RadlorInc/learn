-- CANCEL AND REFUND ON CLOSE — PROOF after the migration 20261008000000 (read-only; counts and booleans only). Every
-- row should say PASS; the INFO row is the number of plans the drain has not settled (0 = nothing owed).
select 'ledger has 20261008000000' as check,
       case when exists (select 1 from supabase_migrations.schema_migrations where version = '20261008000000') then 'PASS' else 'FAIL' end as result
union all select 'billing_cancellations: RLS on, no policies',
       case when (select relrowsecurity from pg_class where oid = 'public.billing_cancellations'::regclass)
             and not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'billing_cancellations') then 'PASS' else 'FAIL' end
union all select 'anon and authenticated hold nothing on billing_cancellations',
       case when not has_table_privilege('anon', 'public.billing_cancellations', 'select,insert,update,delete')
             and not has_table_privilege('authenticated', 'public.billing_cancellations', 'select,insert,update,delete') then 'PASS' else 'FAIL' end
union all select 'service_role reads and updates it, and cannot insert or delete',
       case when has_table_privilege('service_role', 'public.billing_cancellations', 'select')
             and has_table_privilege('service_role', 'public.billing_cancellations', 'update')
             and not has_table_privilege('service_role', 'public.billing_cancellations', 'insert,delete,truncate') then 'PASS' else 'FAIL' end
union all select 'the delete trigger is on subscriptions and its function is DEFINER, search_path pinned, not callable by clients',
       case when exists (select 1 from pg_trigger where tgrelid = 'public.subscriptions'::regclass and tgname = 'trg_billing_queue_cancel_on_delete')
             and (select prosecdef and proconfig = array['search_path=public, pg_temp'] from pg_proc where oid = 'public.billing_queue_cancel_on_delete()'::regprocedure)
             and not has_function_privilege('anon', 'public.billing_queue_cancel_on_delete()', 'execute')
             and not has_function_privilege('authenticated', 'public.billing_queue_cancel_on_delete()', 'execute') then 'PASS' else 'FAIL' end
union all select 'consent_withdraw_account(uuid) is the repo''s new body, still DEFINER, still callable by no API role',
       case when (select md5(prosrc) from pg_proc where oid = 'public.consent_withdraw_account(uuid)'::regprocedure) = 'e598a6c01382fd10a0f1c51e783b3179'
             and (select prosecdef and proconfig = array['search_path=public, pg_temp'] from pg_proc where oid = 'public.consent_withdraw_account(uuid)'::regprocedure)
             and not has_function_privilege('anon', 'public.consent_withdraw_account(uuid)', 'execute')
             and not has_function_privilege('authenticated', 'public.consent_withdraw_account(uuid)', 'execute')
             and not has_function_privilege('service_role', 'public.consent_withdraw_account(uuid)', 'execute') then 'PASS' else 'FAIL' end
union all select 'the drain functions: service_role only',
       case when has_function_privilege('service_role', 'public.billing_cancellations_due()', 'execute')
             and has_function_privilege('service_role', 'public.billing_cancellation_record(text, text)', 'execute')
             and not has_function_privilege('authenticated', 'public.billing_cancellations_due()', 'execute')
             and not has_function_privilege('anon', 'public.billing_cancellation_record(text, text)', 'execute') then 'PASS' else 'FAIL' end
union all select 'INFO plans owed a cancel and refund (expected 0)',
       (select count(*)::text from public.billing_cancellations where result is null or result like 'error:%');
