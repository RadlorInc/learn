-- D4 PROOF — after the four consent migrations. READ-ONLY; counts and catalog only, no personal data.
-- Every row: PASS / FAIL / INFO, with what was expected. Expectations are written out here, including
-- the D3 before-counts (production, 2026-09-23), not derived from the thing being checked.
with before(t, n) as (values
  ('diagnostic_plans',6),('diagnostic_rechecks',0),('diagnostic_sessions',9),('error_events',9),('exercise_results',0),
  ('game_settings',1),('learner_access',29),('learner_events',236),('learner_invites',0),('learner_progress',0),
  ('learner_state',0),('learner_stats',26),('lesson_feedback',1),('lesson_progress',36),('point_events',298),
  ('sessions',0),('subscription_seats',0)),
child_tables as (
  select c.relname::text as t, c.oid
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'
     and exists (select 1 from pg_attribute a where a.attrelid = c.oid and a.attname = 'learner_id' and a.attnum > 0 and not a.attisdropped)),
gate_exempt(t) as (values ('learner_access'),('learner_invites'),('subscription_seats'),('parental_consents')),
counts as (
  select t, (xpath('/row/n/text()', query_to_xml(format('select count(*) as n from public.%I', t), false, true, '')))[1]::text::bigint as n
    from child_tables),
fn(sig, anon, authed, service) as (values
  -- expected EXECUTE for anon / authenticated / service_role
  ('public.delete_learner(uuid)',                                false, true,  true),
  ('public.export_child_records(uuid)',                          false, true,  true),
  ('public.delete_child_data(uuid)',                             false, false, false),
  ('public.consent_lookup(text)',                                false, false, true),
  ('public.consent_decline(text)',                               false, false, true),
  ('public.consent_withdraw(text)',                              false, false, true),
  ('public.consent_expire_stale()',                              false, false, true),
  ('public.consent_record_request_sent(uuid,text)',              false, false, true),
  ('public.consent_ok(uuid)',                                    false, false, true))
select * from (
  select 0 ord, 'DB' chk, format('public_tables=%s has_learners=%s', (select count(*) from pg_tables where schemaname='public'), to_regclass('public.learners') is not null) got, 'public_tables=33 has_learners=true' expected,
         case when (select count(*) from pg_tables where schemaname='public') = 33 and to_regclass('public.learners') is not null then 'PASS' else 'FAIL' end status
  union all select 1, 'ledger rows', (select count(*)::text from supabase_migrations.schema_migrations), '103',
         case when (select count(*) from supabase_migrations.schema_migrations) = 103 then 'PASS' else 'FAIL' end
  union all select 1, 'the four recorded', (select string_agg(version, ' ' order by version) from supabase_migrations.schema_migrations where version in ('20260923120000','20260923130000','20260923140000','20260923150000')),
         '20260923120000 20260923130000 20260923140000 20260923150000',
         case when (select count(*) from supabase_migrations.schema_migrations where version in ('20260923120000','20260923130000','20260923140000','20260923150000')) = 4 then 'PASS' else 'FAIL' end
  union all select 2, 'parental_consents: exists / RLS / rows',
         coalesce((select 'exists / rls=' || relrowsecurity || ' / rows=' || (select count(*) from public.parental_consents) from pg_class where oid = to_regclass('public.parental_consents')), 'MISSING'),
         'exists / rls=true / rows=0',
         case when (select relrowsecurity from pg_class where oid = to_regclass('public.parental_consents')) and (select count(*) from public.parental_consents) = 0 then 'PASS' else 'FAIL' end
  union all select 2, 'parental_consents: anon SELECT / authenticated SELECT / authenticated INSERT',
         has_table_privilege('anon','public.parental_consents','SELECT') || ' / ' || has_table_privilege('authenticated','public.parental_consents','SELECT') || ' / ' || has_table_privilege('authenticated','public.parental_consents','INSERT'),
         'false / true / false',
         case when not has_table_privilege('anon','public.parental_consents','SELECT') and has_table_privilege('authenticated','public.parental_consents','SELECT') and not has_table_privilege('authenticated','public.parental_consents','INSERT') then 'PASS' else 'FAIL' end
  union all select 3, 'child tables WITHOUT the consent gate (excluding the 4 named exemptions)',
         coalesce((select string_agg(ct.t, ', ' order by ct.t) from child_tables ct
                    where ct.t not in (select t from gate_exempt)
                      and not exists (select 1 from pg_trigger tg where tg.tgrelid = ct.oid and tg.tgname = 'trg_enforce_child_consent' and not tg.tgisinternal)), 'none'),
         'none', case when exists (select 1 from child_tables ct where ct.t not in (select t from gate_exempt)
                        and not exists (select 1 from pg_trigger tg where tg.tgrelid = ct.oid and tg.tgname = 'trg_enforce_child_consent')) then 'FAIL' else 'PASS' end
  union all select 3, 'child tables WITH the gate (count)',
         (select count(*)::text from child_tables ct join pg_trigger tg on tg.tgrelid = ct.oid and tg.tgname = 'trg_enforce_child_consent'),
         '14 (18 learner_id tables − 4 exemptions)',
         case when (select count(*) from child_tables ct join pg_trigger tg on tg.tgrelid = ct.oid and tg.tgname = 'trg_enforce_child_consent') = 14 then 'PASS' else 'FAIL' end
  union all select 3, 'learners: trg_enforce_learner_consent + trg_consent_bind_learner',
         (select string_agg(tgname, ', ' order by tgname) from pg_trigger where tgrelid = 'public.learners'::regclass and tgname in ('trg_enforce_learner_consent','trg_consent_bind_learner')),
         'trg_consent_bind_learner, trg_enforce_learner_consent',
         case when (select count(*) from pg_trigger where tgrelid = 'public.learners'::regclass and tgname in ('trg_enforce_learner_consent','trg_consent_bind_learner')) = 2 then 'PASS' else 'FAIL' end
  union all select 4, 'children / exempt / neither exempt nor consented',
         (select count(*) || ' / ' || count(consent_exempt_at) || ' / ' || count(*) filter (where consent_exempt_at is null and consent_id is null) from public.learners),
         '26 / 26 / 0',
         case when (select count(*) = 26 and count(consent_exempt_at) = 26 and count(*) filter (where consent_exempt_at is null and consent_id is null) = 0 from public.learners) then 'PASS' else 'FAIL' end
  union all select 5, 'error_events: all / orphaned',
         (select count(*) || ' / ' || count(*) filter (where learner_id is not null and not exists (select 1 from public.learners l where l.id = e.learner_id)) from public.error_events e),
         '6 / 0  (9 before − the 3 orphans)',
         case when (select count(*) = 6 and count(*) filter (where learner_id is not null and not exists (select 1 from public.learners l where l.id = e.learner_id)) = 0 from public.error_events e) then 'PASS' else 'FAIL' end
  union all select 5, 'FK on delete: error_events.learner_id / parental_consents.learner_id',
         (select string_agg(conname || '=' || confdeltype::text, ' ' order by conname) from pg_constraint where conname in ('error_events_learner_id_fkey','parental_consents_learner_id_fkey')),
         'error_events_learner_id_fkey=c parental_consents_learner_id_fkey=n',
         case when (select string_agg(conname || '=' || confdeltype::text, ' ' order by conname) from pg_constraint where conname in ('error_events_learner_id_fkey','parental_consents_learner_id_fkey'))
                   = 'error_events_learner_id_fkey=c parental_consents_learner_id_fkey=n' then 'PASS' else 'FAIL' end
  union all select 6, 'accounts: auth.users / profiles', (select count(*) from auth.users) || ' / ' || (select count(*) from public.profiles), '20 / 20',
         case when (select count(*) from auth.users) = 20 and (select count(*) from public.profiles) = 20 then 'PASS' else 'FAIL' end
  union all
  select 7, 'rows in ' || coalesce(c.t, b.t), coalesce(c.n::text, 'MISSING'), coalesce(b.n::text, 'new table'),
         case when b.t is null and c.t = 'parental_consents' and c.n = 0 then 'PASS'
              when c.t is null then 'FAIL'
              when c.t = 'error_events' then case when c.n = b.n - 3 then 'PASS' else 'FAIL' end
              when c.n = b.n then 'PASS'
              when c.t in ('lesson_progress','point_events','learner_events','learner_stats','game_settings','lesson_feedback') and c.n > b.n then 'INFO (grew — live use)'
              else 'FAIL' end
    from counts c full join before b on b.t = c.t
  union all
  select 8, 'EXECUTE ' || f.sig || ' (anon/auth/service)',
         case when to_regprocedure(f.sig) is null then 'MISSING'
              else has_function_privilege('anon', to_regprocedure(f.sig), 'EXECUTE') || '/' || has_function_privilege('authenticated', to_regprocedure(f.sig), 'EXECUTE') || '/' || has_function_privilege('service_role', to_regprocedure(f.sig), 'EXECUTE') end,
         f.anon || '/' || f.authed || '/' || f.service,
         case when to_regprocedure(f.sig) is not null
                   and has_function_privilege('anon', to_regprocedure(f.sig), 'EXECUTE') = f.anon
                   and has_function_privilege('authenticated', to_regprocedure(f.sig), 'EXECUTE') = f.authed
                   and has_function_privilege('service_role', to_regprocedure(f.sig), 'EXECUTE') = f.service then 'PASS' else 'FAIL' end
    from fn f
  union all select 9, 'cron job expire-parental-consents (schedule / active)',
         coalesce((select schedule || ' / ' || active from cron.job where jobname = 'expire-parental-consents'), 'MISSING'), '41 3 * * * / true',
         case when (select schedule = '41 3 * * *' and active from cron.job where jobname = 'expire-parental-consents') then 'PASS' else 'FAIL' end
  union all select 10, 'unchanged by D4: delete_my_account md5', md5(pg_get_functiondef('public.delete_my_account(text)'::regprocedure)), '86a80532639f779b90820c94b12ee743',
         case when md5(pg_get_functiondef('public.delete_my_account(text)'::regprocedure)) = '86a80532639f779b90820c94b12ee743' then 'PASS' else 'FAIL' end
  union all select 10, 'unchanged by D4: handle_new_user md5', md5(pg_get_functiondef('public.handle_new_user()'::regprocedure)), '34812ad3588b11c65a6bc4406545e51b',
         case when md5(pg_get_functiondef('public.handle_new_user()'::regprocedure)) = '34812ad3588b11c65a6bc4406545e51b' then 'PASS' else 'FAIL' end
) r
order by ord, chk;
