-- D6 PROOF — after 20260923170000_consent_zero_exemptions. READ-ONLY; counts and catalog only.
-- PASS / FAIL / INFO per row, expectations written out here (not derived from what is checked).
with child_tables as (
  select c.relname::text as t, c.oid from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'
     and exists (select 1 from pg_attribute a where a.attrelid = c.oid and a.attname = 'learner_id' and a.attnum > 0 and not a.attisdropped)),
counts as (
  select t, (xpath('/row/n/text()', query_to_xml(format('select count(*) as n from public.%I where learner_id is not null', t), false, true, '')))[1]::text::bigint as n
    from child_tables),
okdef as (select pg_get_functiondef('public.consent_ok(uuid)'::regprocedure) as d),
enfdef as (select pg_get_functiondef('public.enforce_learner_consent()'::regprocedure) as d)
select * from (
  select 0 ord, 'DB' chk, format('public_tables=%s has_learners=%s', (select count(*) from pg_tables where schemaname = 'public'), to_regclass('public.learners') is not null) got,
         'public_tables=33 has_learners=true' expected,
         case when (select count(*) from pg_tables where schemaname = 'public') = 33 and to_regclass('public.learners') is not null then 'PASS' else 'FAIL' end status
  union all select 1, 'ledger rows / D6 recorded',
         (select count(*) from supabase_migrations.schema_migrations) || ' / ' || exists (select 1 from supabase_migrations.schema_migrations where version = '20260923170000'),
         '104 / true',
         case when (select count(*) from supabase_migrations.schema_migrations) = 104 and exists (select 1 from supabase_migrations.schema_migrations where version = '20260923170000') then 'PASS' else 'FAIL' end
  union all select 2, 'children (learners)', (select count(*)::text from public.learners), '0',
         case when (select count(*) from public.learners) = 0 then 'PASS' else 'FAIL' end
  union all select 2, 'exemption: column / view',
         exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'learners' and column_name = 'consent_exempt_at') || ' / ' || (to_regclass('public.consent_exempt_learners') is not null),
         'false / false',
         case when not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'learners' and column_name = 'consent_exempt_at')
                   and to_regclass('public.consent_exempt_learners') is null then 'PASS' else 'FAIL' end
  union all select 2, 'learners.consent_id NOT NULL',
         (select attnotnull::text from pg_attribute where attrelid = 'public.learners'::regclass and attname = 'consent_id'), 'true',
         case when (select attnotnull from pg_attribute where attrelid = 'public.learners'::regclass and attname = 'consent_id') then 'PASS' else 'FAIL' end
  union all select 3, 'consent_ok(): reads parental_consents / mentions exempt / definer / search_path pinned',
         ((select d from okdef) ~ 'parental_consents') || ' / ' || ((select d from okdef) ~* 'exempt') || ' / ' ||
         (select prosecdef::text from pg_proc where oid = 'public.consent_ok(uuid)'::regprocedure) || ' / ' ||
         (select exists (select 1 from unnest(proconfig) c where c like 'search_path=%')::text from pg_proc where oid = 'public.consent_ok(uuid)'::regprocedure),
         'true / false / true / true',
         case when (select d from okdef) ~ 'parental_consents' and not (select d from okdef) ~* 'exempt'
                   and (select prosecdef from pg_proc where oid = 'public.consent_ok(uuid)'::regprocedure)
                   and (select exists (select 1 from unnest(proconfig) c where c like 'search_path=%') from pg_proc where oid = 'public.consent_ok(uuid)'::regprocedure) then 'PASS' else 'FAIL' end
  union all select 3, 'enforce_learner_consent(): still refuses / mentions consent_exempt_at / definer / search_path pinned',
         ((select d from enfdef) ~ 'no granted parental consent for this child') || ' / ' || ((select d from enfdef) ~ 'consent_exempt_at') || ' / ' ||
         (select prosecdef::text from pg_proc where oid = 'public.enforce_learner_consent()'::regprocedure) || ' / ' ||
         (select exists (select 1 from unnest(proconfig) c where c like 'search_path=%')::text from pg_proc where oid = 'public.enforce_learner_consent()'::regprocedure),
         'true / false / true / true',
         case when (select d from enfdef) ~ 'no granted parental consent for this child' and not (select d from enfdef) ~ 'consent_exempt_at'
                   and (select prosecdef from pg_proc where oid = 'public.enforce_learner_consent()'::regprocedure)
                   and (select exists (select 1 from unnest(proconfig) c where c like 'search_path=%') from pg_proc where oid = 'public.enforce_learner_consent()'::regprocedure) then 'PASS' else 'FAIL' end
  union all select 3, 'consent gate still on 14 child tables', (select count(*)::text from child_tables ct join pg_trigger tg on tg.tgrelid = ct.oid and tg.tgname = 'trg_enforce_child_consent'), '14',
         case when (select count(*) from child_tables ct join pg_trigger tg on tg.tgrelid = ct.oid and tg.tgname = 'trg_enforce_child_consent') = 14 then 'PASS' else 'FAIL' end
  union all select 4, 'rows tagged to a child, all learner_id tables',
         coalesce((select string_agg(t || '=' || n, ' ' order by t) from counts where n > 0), 'none'), 'none',
         case when exists (select 1 from counts where n > 0) then 'FAIL' else 'PASS' end
  union all select 4, 'error_events: orphaned / untagged kept',
         (select count(*) filter (where learner_id is not null)::text || ' / ' || count(*) filter (where learner_id is null) from public.error_events),
         '0 / (INFO: untagged rows are not about a child and stay)',
         case when (select count(*) from public.error_events where learner_id is not null) = 0 then 'PASS' else 'FAIL' end
  union all select 5, 'rafi3''s consent (B3 01a0cea4-…): state / linked / B3 id kept',
         coalesce((select state || ' / ' || (learner_id is not null) || ' / ' || (second_email_provider_id is not null) from public.parental_consents
                    where second_email_provider_id = '01a0cea4-27a3-715a-9f63-31c4a5f5530b'), 'NOT FOUND'),
         'withdrawn / false / true',
         case when (select state = 'withdrawn' and learner_id is null and second_email_provider_id is not null from public.parental_consents
                     where second_email_provider_id = '01a0cea4-27a3-715a-9f63-31c4a5f5530b') then 'PASS' else 'FAIL' end
  union all select 5, 'consents: granted AND unused (reusable by the add-a-child flow)',
         (select count(*)::text from public.parental_consents where state = 'granted' and learner_id is null), '0 expected (any > 0 is a consent granted since D6 and not yet used — check it is one you gave)',
         case when (select count(*) from public.parental_consents where state = 'granted' and learner_id is null) = 0 then 'PASS' else 'INFO' end
  union all select 6, 'child logins left (@learner.adaptivelearn.invalid)',
         (select count(*)::text from auth.users where email like '%@learner.adaptivelearn.invalid'), '0',
         case when (select count(*) from auth.users where email like '%@learner.adaptivelearn.invalid') = 0 then 'PASS' else 'FAIL' end
  union all select 6, 'accounts: auth.users / profiles', (select count(*) from auth.users) || ' / ' || (select count(*) from public.profiles),
         'INFO — adults stay; the drop from D3''s 20 / 20 should equal the child logins removed (D5 + D6)', 'INFO'
  union all select 7, 'cron expire-parental-consents active', coalesce((select active::text from cron.job where jobname = 'expire-parental-consents'), 'MISSING'), 'true',
         case when (select active from cron.job where jobname = 'expire-parental-consents') then 'PASS' else 'FAIL' end
  union all select 7, 'unchanged by D6: delete_my_account / handle_new_user md5',
         md5(pg_get_functiondef('public.delete_my_account(text)'::regprocedure)) || ' / ' || md5(pg_get_functiondef('public.handle_new_user()'::regprocedure)),
         '86a80532639f779b90820c94b12ee743 / 34812ad3588b11c65a6bc4406545e51b',
         case when md5(pg_get_functiondef('public.delete_my_account(text)'::regprocedure)) = '86a80532639f779b90820c94b12ee743'
                   and md5(pg_get_functiondef('public.handle_new_user()'::regprocedure)) = '34812ad3588b11c65a6bc4406545e51b' then 'PASS' else 'FAIL' end
) r order by ord, chk;
