-- D3 — BEFORE the four consent migrations. READ-ONLY; counts only, no personal data.
-- Save this result: D4's proof compares against it. Expected changes after D4 are listed at the bottom.
with child_tables as (
  -- every public table with a learner_id column, read from the catalog (not a typed list)
  select c.relname::text as t
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'
     and exists (select 1 from pg_attribute a where a.attrelid = c.oid and a.attname = 'learner_id'
                 and a.attnum > 0 and not a.attisdropped)
)
select * from (
  select 0 as ord, 'DB' as item,
         format('public_tables=%s has_learners=%s ledger_rows=%s consent_table=%s', (select count(*) from pg_tables where schemaname = 'public'),
                to_regclass('public.learners') is not null, (select count(*) from supabase_migrations.schema_migrations),
                to_regclass('public.parental_consents') is not null) as value
  union all select 1, 'tables with learner_id (from the catalog)',
         (select count(*) || ': ' || string_agg(t, ', ' order by t) from child_tables)
  union all select 2, 'children (learners)', (select count(*)::text from public.learners)
  union all select 3, 'children exempt (consent_exempt_at set)',
         case when exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'learners' and column_name = 'consent_exempt_at')
              then (select count(*)::text from public.learners where (to_jsonb(learners) ->> 'consent_exempt_at') is not null)
              else 'column does not exist yet' end
  union all select 4, 'error_events: all rows', (select count(*)::text from public.error_events)
  union all select 4, 'error_events: tagged to a child', (select count(*)::text from public.error_events where learner_id is not null)
  union all select 4, 'error_events: ORPHANED (child no longer exists) — 20260923140000 deletes these',
         (select count(*)::text from public.error_events e where e.learner_id is not null
             and not exists (select 1 from public.learners l where l.id = e.learner_id))
  union all select 5, 'auth.users', (select count(*)::text from auth.users)
  union all select 5, 'profiles', (select count(*)::text from public.profiles)
  union all
  select 6, 'rows in ' || t,
         (xpath('/row/n/text()', query_to_xml(format('select count(*) as n from public.%I', t), false, true, '')))[1]::text
    from child_tables
) r
order by ord, item;
-- Expected after D4: every count identical, EXCEPT
--   · error_events rows fall by exactly the ORPHANED count (and 'orphaned' becomes 0);
--   · DB shows ledger_rows = 103 and consent_table = true; 'children exempt' = the children count;
--   · the learner_id table list gains parental_consents (the consent record itself, 0 rows).
