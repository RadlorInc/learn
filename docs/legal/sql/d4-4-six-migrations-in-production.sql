-- READ-ONLY. For each of the 6 older migrations production's ledger does not record, is what it
-- creates ALREADY in production, and IDENTICAL to the repo's final version? Compares definitions by md5
-- (functions, trigger, constraints, indexes, policy predicates), types/defaults, RLS and per-role
-- privileges — 70 fingerprints taken from a local database built from baseline + the 98
-- pre-2026-09-23 migrations. ⚠️ delete_my_account's expected definition is the FINAL one (redefined by
-- 20260917090504, which production records), not the 20260905160000 original.
-- Reads no personal data: the two INFO rows are counts.
with expected(migration, item, value) as (values
('20260905160000','function public.delete_my_account(text) : definition md5','86a80532639f779b90820c94b12ee743'),
('20260908120000','function public.handle_new_user() : definition md5','2d03a8e3a8f5681bab165c50e15ce328'),
('20260908120100','function public.prune_unconfirmed_users() : definition md5','c81c007c0d4fcb7e900a21b878b2665c'),
('20260905160000','function public.delete_my_account(text) : definer / config','true / search_path=public'),
('20260908120000','function public.handle_new_user() : definer / config','true / search_path=public'),
('20260908120100','function public.prune_unconfirmed_users() : definer / config','true / search_path=public'),
('20260905160000','function public.delete_my_account(text) : EXECUTE for anon','false'),
('20260905160000','function public.delete_my_account(text) : EXECUTE for authenticated','true'),
('20260905160000','function public.delete_my_account(text) : EXECUTE for service_role','true'),
('20260908120000','function public.handle_new_user() : EXECUTE for anon','false'),
('20260908120000','function public.handle_new_user() : EXECUTE for authenticated','false'),
('20260908120000','function public.handle_new_user() : EXECUTE for service_role','true'),
('20260908120100','function public.prune_unconfirmed_users() : EXECUTE for anon','false'),
('20260908120100','function public.prune_unconfirmed_users() : EXECUTE for authenticated','false'),
('20260908120100','function public.prune_unconfirmed_users() : EXECUTE for service_role','true'),
('20260908120000','trigger auth.users.on_auth_user_created : definition md5','b411227430bfc54cfd99da9eb4c3d8f6'),
('20260908120100','extension pg_cron','present'),
('20260908120100','cron job prune-unconfirmed-users : schedule / command md5 / active','37 3 * * * / 279bf8b51963b13b428065f16da7418d / true'),
('20260918100000/120000','column grades.age_group','text | null=YES | default='),
('20260918100000/120000','column grades.grade','smallint | null=YES | default='),
('20260918100000/120000','column grades.lesson_ids','ARRAY | null=YES | default='),
('20260918100000/120000','column grades.exercises','jsonb | null=NO | default=''[]''::jsonb'),
('20260918120000','column teacher_plans.teacher_id','uuid | null=NO | default='),
('20260918120000','column teacher_plans.paid','boolean | null=NO | default=false'),
('20260918120000','column teacher_plans.updated_at','timestamp with time zone | null=NO | default=now()'),
('20260918140000','column exercise_results.id','uuid | null=NO | default=gen_random_uuid()'),
('20260918140000','column exercise_results.learner_id','uuid | null=NO | default='),
('20260918140000','column exercise_results.class_id','uuid | null=NO | default='),
('20260918140000','column exercise_results.exercise_id','text | null=NO | default='),
('20260918140000','column exercise_results.outcomes','ARRAY | null=NO | default='),
('20260918140000','column exercise_results.created_at','timestamp with time zone | null=NO | default=now()'),
('20260918120000','table teacher_plans : exists / RLS','exists / rls=true'),
('20260918140000','table exercise_results : exists / RLS','exists / rls=true'),
('20260918100000/120000','constraint grades.grades_exercises_is_array','157eb55a626fee94dcc3d0dae2130452'),
('20260918100000/120000','constraint grades.grades_grade_check','040c285a64acc337db47cd937f0165af'),
('20260918120000','constraint teacher_plans.teacher_plans_pkey','deefe4a9bdc13dfc3a6909ddd5e1b477'),
('20260918120000','constraint teacher_plans.teacher_plans_teacher_id_fkey','6f618eee4d99e8a8973245a38a359f27'),
('20260918140000','constraint exercise_results.exercise_results_class_id_fkey','5d8767a21e9233e60b2f48b5b09ec1db'),
('20260918140000','constraint exercise_results.exercise_results_exercise_id_check','94da1edf27e075500c15cf77dba3aa27'),
('20260918140000','constraint exercise_results.exercise_results_learner_id_fkey','e3d1858b999bfe641ab5e2f87c68e3cf'),
('20260918140000','constraint exercise_results.exercise_results_outcomes_check','c8a5e494ee3ae12c14a0eece68f606ac'),
('20260918140000','constraint exercise_results.exercise_results_pkey','4c6419b3704337bbfe50f018842a9ad3'),
('20260918140000','index exercise_results_pkey','0379bfb15e7ac88931d17e73d7223fa6'),
('20260918140000','index exercise_results_class_idx','9f10f867dcc8be6981acfbcddb728d9c'),
('20260918140000','index exercise_results_learner_id_idx','a1a54583365acb170028dcfa0b6d936e'),
('20260918120000','index teacher_plans_pkey','d4878ed028f4e2c8090d3cb8b555f0aa'),
('20260918140000','policy exercise_results.exercise_results: teacher or the child reads','SELECT | roles=authenticated | using md5=92075c17606605b38c2c35b1ab5e579b | check md5=d41d8cd98f00b204e9800998ecf8427e'),
('20260918140000','policy exercise_results.exercise_results: the child posts an open exercise','INSERT | roles=authenticated | using md5=d41d8cd98f00b204e9800998ecf8427e | check md5=7bda9fa2ea78f1e41a57dd0c96b83536'),
('20260918120000','policy teacher_plans.teacher_plans: read own or my creator''s','SELECT | roles=authenticated | using md5=33ece68564a1c337c784f1efe0f2ad9e | check md5=d41d8cd98f00b204e9800998ecf8427e'),
('20260918120000','privilege teacher_plans SELECT for anon','false'),
('20260918120000','privilege teacher_plans INSERT for anon','false'),
('20260918120000','privilege teacher_plans UPDATE for anon','false'),
('20260918120000','privilege teacher_plans DELETE for anon','false'),
('20260918120000','privilege teacher_plans SELECT for authenticated','true'),
('20260918120000','privilege teacher_plans INSERT for authenticated','false'),
('20260918120000','privilege teacher_plans UPDATE for authenticated','false'),
('20260918120000','privilege teacher_plans DELETE for authenticated','false'),
('20260918140000','privilege exercise_results SELECT for anon','false'),
('20260918140000','privilege exercise_results INSERT for anon','false'),
('20260918140000','privilege exercise_results UPDATE for anon','false'),
('20260918140000','privilege exercise_results DELETE for anon','false'),
('20260918140000','privilege exercise_results SELECT for authenticated','true'),
('20260918140000','privilege exercise_results INSERT for authenticated','false'),
('20260918140000','privilege exercise_results UPDATE for authenticated','false'),
('20260918140000','privilege exercise_results DELETE for authenticated','false'),
('20260918140000','column privilege exercise_results.learner_id INSERT for authenticated','true'),
('20260918140000','column privilege exercise_results.class_id INSERT for authenticated','true'),
('20260918140000','column privilege exercise_results.exercise_id INSERT for authenticated','true'),
('20260918140000','column privilege exercise_results.outcomes INSERT for authenticated','true'),
('20260918140000','column privilege exercise_results.id INSERT for authenticated','false')
),
actual as (
select migration, item, value from (
  -- functions: definition hash, definer, search_path, who may execute
  select m migration, 'function '||f||' : definition md5' item,
         coalesce((select md5(pg_get_functiondef(to_regprocedure(f)))), 'MISSING') value
    from (values ('20260905160000','public.delete_my_account(text)'),('20260908120000','public.handle_new_user()'),('20260908120100','public.prune_unconfirmed_users()')) v(m,f)
  union all
  select m, 'function '||f||' : definer / config', coalesce((select p.prosecdef::text||' / '||coalesce(array_to_string(p.proconfig, ','),'') from pg_proc p where p.oid = to_regprocedure(f)), 'MISSING')
    from (values ('20260905160000','public.delete_my_account(text)'),('20260908120000','public.handle_new_user()'),('20260908120100','public.prune_unconfirmed_users()')) v(m,f)
  union all
  select m, 'function '||f||' : EXECUTE for '||r, case when to_regprocedure(f) is null then 'MISSING' else has_function_privilege(r, to_regprocedure(f), 'EXECUTE')::text end
    from (values ('20260905160000','public.delete_my_account(text)'),('20260908120000','public.handle_new_user()'),('20260908120100','public.prune_unconfirmed_users()')) v(m,f),
         (values ('anon'),('authenticated'),('service_role')) rr(r)
  union all
  -- the auth trigger
  select '20260908120000', 'trigger auth.users.on_auth_user_created : definition md5',
         coalesce((select md5(pg_get_triggerdef(t.oid)) from pg_trigger t where t.tgrelid = 'auth.users'::regclass and t.tgname = 'on_auth_user_created'), 'MISSING')
  union all
  -- the cron job
  select '20260908120100', 'extension pg_cron', coalesce((select 'present' from pg_extension where extname = 'pg_cron'), 'MISSING')
  union all
  select '20260908120100', 'cron job prune-unconfirmed-users : schedule / command md5 / active',
         coalesce((select j.schedule||' / '||md5(j.command)||' / '||j.active from cron.job j where j.jobname = 'prune-unconfirmed-users'), 'MISSING')
  union all
  -- tables: columns
  select case when c.table_name = 'grades' then '20260918100000/120000' when c.table_name = 'teacher_plans' then '20260918120000' else '20260918140000' end,
         'column '||c.table_name||'.'||c.column_name, c.data_type||' | null='||c.is_nullable||' | default='||coalesce(c.column_default,'')
    from information_schema.columns c
   where c.table_schema = 'public' and (c.table_name in ('teacher_plans','exercise_results') or (c.table_name = 'grades' and c.column_name in ('grade','lesson_ids','exercises','age_group')))
  union all
  select m, 'table '||t||' : exists / RLS', coalesce((select 'exists / rls='||relrowsecurity from pg_class where oid = to_regclass('public.'||t)), 'MISSING')
    from (values ('20260918120000','teacher_plans'),('20260918140000','exercise_results')) v(m,t)
  union all
  -- constraints and indexes
  select case when rel.relname = 'grades' then '20260918100000/120000' when rel.relname = 'teacher_plans' then '20260918120000' else '20260918140000' end,
         'constraint '||rel.relname||'.'||con.conname, md5(pg_get_constraintdef(con.oid))
    from pg_constraint con join pg_class rel on rel.oid = con.conrelid join pg_namespace n on n.oid = rel.relnamespace
   where n.nspname = 'public' and (rel.relname in ('teacher_plans','exercise_results') or (rel.relname = 'grades' and con.conname in ('grades_grade_check','grades_exercises_is_array')))
  union all
  select case when tablename = 'teacher_plans' then '20260918120000' else '20260918140000' end, 'index '||indexname, md5(indexdef)
    from pg_indexes where schemaname = 'public' and tablename in ('teacher_plans','exercise_results')
  union all
  -- policies
  select case when tablename = 'teacher_plans' then '20260918120000' else '20260918140000' end, 'policy '||tablename||'.'||policyname,
         cmd||' | roles='||array_to_string(roles, ',')||' | using md5='||md5(coalesce(qual,''))||' | check md5='||md5(coalesce(with_check,''))
    from pg_policies where schemaname = 'public' and tablename in ('teacher_plans','exercise_results')
  union all
  -- privileges, table and column level
  select m, 'privilege '||t||' '||p||' for '||r, case when to_regclass('public.'||t) is null then 'MISSING' else has_table_privilege(r, 'public.'||t, p)::text end
    from (values ('20260918120000','teacher_plans'),('20260918140000','exercise_results')) v(m,t),
         (values ('SELECT'),('INSERT'),('UPDATE'),('DELETE')) pp(p), (values ('anon'),('authenticated')) rr(r)
  union all
  select '20260918140000', 'column privilege exercise_results.'||c||' INSERT for authenticated',
         case when to_regclass('public.exercise_results') is null then 'MISSING' else has_column_privilege('authenticated', 'public.exercise_results', c, 'INSERT')::text end
    from (values ('learner_id'),('class_id'),('exercise_id'),('outcomes'),('id')) v(c)
) x
),
cmp as (
  select coalesce(e.migration, a.migration) as migration, coalesce(e.item, a.item) as item,
         case when a.item is null then 'MISSING in production'
              when e.item is null then 'EXTRA in production'
              when a.value = e.value then 'same'
              else 'DIFFERENT' end as status,
         e.value as expected, a.value as production
    from expected e full join actual a on a.item = e.item
)
select * from (
select 'DB' as migration,
       format('public_tables=%s has_learners=%s ledger_rows=%s',
              (select count(*) from pg_tables where schemaname = 'public'),
              to_regclass('public.learners') is not null,
              (select count(*) from supabase_migrations.schema_migrations)) as item,
       format('same=%s different=%s missing=%s extra=%s',
              (select count(*) from cmp where status = 'same'), (select count(*) from cmp where status = 'DIFFERENT'),
              (select count(*) from cmp where status like 'MISSING%'), (select count(*) from cmp where status like 'EXTRA%')) as status,
       null as expected, null as production
union all
select 'INFO', 'auth.users a replay of 20260908120100 would delete NOW (unconfirmed, >3 days, no child)', 'not compared', null,
       (select count(*)::text from auth.users u where u.email_confirmed_at is null and u.created_at < now() - interval '3 days'
          and not exists (select 1 from public.learners l where l.created_by = u.id))
union all
select 'INFO', 'teacher_plans rows (count only)', 'not compared', null,
       case when to_regclass('public.teacher_plans') is null then 'MISSING' else (select count(*)::text from public.teacher_plans) end
union all
select migration, item, status, expected, production from cmp
) r
order by (migration = 'DB') desc, (migration = 'INFO') desc, migration, status, item;
