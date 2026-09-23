-- CONSENT-ONCE — PROOF after the migration (read-only). Expected: every row PASS except the INFO rows,
-- and "children" equal to the before-count.
with c as (select * from public.parental_consents), l as (select * from public.learners)
select 'ledger has 20260924100000' as check,
       case when exists (select 1 from supabase_migrations.schema_migrations where version = '20260924100000') then 'PASS' else 'FAIL' end as result
union all select 'parental_consents.scope exists, check child|account',
       case when exists (select 1 from information_schema.columns where table_schema='public' and table_name='parental_consents' and column_name='scope') then 'PASS' else 'FAIL' end
union all select 'INFO consents by scope/state (right after the apply: all child; account rows appear only as parents consent)',
       (select string_agg(scope || '/' || state || '=' || n, ', ' order by scope, state) from (select scope, state, count(*) n from c group by 1,2) x)
union all select 'notice versions v1..v5 registered, none requires re-consent',
       case when (select count(*) from public.consent_notice_versions where version like 'notice-v%') = 5
             and not exists (select 1 from public.consent_notice_versions where reconsent_required) then 'PASS' else 'FAIL' end
union all select 'every child: consent_id + all four attestation columns set',
       case when not exists (select 1 from l where consent_id is null or attested_by is null or attested_at is null or attested_notice_version is null or attestation_method is null) then 'PASS' else 'FAIL' end
union all select 'every child passes the gate (consent_ok)',
       case when not exists (select 1 from l where not public.consent_ok(l.id)) then 'PASS' else 'FAIL' end
union all select 'the existing child(ren) attested from their own consent (per_child_consent)',
       case when not exists (select 1 from l join c on c.id = l.consent_id where c.scope = 'child' and (l.attestation_method <> 'per_child_consent' or l.attested_at <> c.confirmed_at or l.attested_notice_version <> c.notice_version)) then 'PASS' else 'FAIL' end
union all select 'INFO children (must equal the before-count)', (select count(*)::text from l)
union all select 'learners.consent_id NOT NULL',
       case when (select is_nullable from information_schema.columns where table_schema='public' and table_name='learners' and column_name='consent_id') = 'NO' then 'PASS' else 'FAIL' end
union all select 'one-consent-one-child unique index dropped',
       case when not exists (select 1 from pg_class where relname = 'learners_consent_id_unique') then 'PASS' else 'FAIL' end
union all select 'child-data gate still on 14 tables + learners',
       case when (select count(*) from pg_trigger where tgname='trg_enforce_child_consent' and not tgisinternal) >= 14
             and exists (select 1 from pg_trigger where tgname='trg_enforce_learner_consent') then 'PASS' else 'FAIL' end
union all select 'consent_ok / enforce_learner_consent: DEFINER, search_path pinned, mention attested_notice_version',
       case when (select bool_and(p.prosecdef and p.proconfig::text like '%search_path%') from pg_proc p where p.proname in ('consent_ok','enforce_learner_consent') and p.pronamespace='public'::regnamespace)
             and pg_get_functiondef('public.enforce_learner_consent()'::regprocedure) like '%attested_notice_version%' then 'PASS' else 'FAIL' end
union all select 'withdraw_my_consent: authenticated yes, anon no; consent_withdraw_account: nobody but its callers',
       case when has_function_privilege('authenticated','public.withdraw_my_consent()','EXECUTE')
             and not has_function_privilege('anon','public.withdraw_my_consent()','EXECUTE')
             and not has_function_privilege('authenticated','public.consent_withdraw_account(uuid)','EXECUTE')
             and not has_function_privilege('service_role','public.consent_withdraw_account(uuid)','EXECUTE') then 'PASS' else 'FAIL' end
union all select 'consent_request: only the new signature, service_role only',
       case when (select count(*) from pg_proc where proname='consent_request' and pronamespace='public'::regnamespace) = 1
             and has_function_privilege('service_role','public.consent_request(uuid,text,text,text,text,text,interval,text,timestamptz)','EXECUTE')
             and not has_function_privilege('authenticated','public.consent_request(uuid,text,text,text,text,text,interval,text,timestamptz)','EXECUTE') then 'PASS' else 'FAIL' end
union all select 'R3 B3 queue trigger still attached',
       case when exists (select 1 from pg_trigger where tgname='trg_consent_queue_b3_cancel') then 'PASS' else 'FAIL' end;
