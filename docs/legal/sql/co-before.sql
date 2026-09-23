-- CONSENT-ONCE — BEFORE the migration (read-only). Run in the Supabase SQL editor on PRODUCTION and write
-- the numbers down. Every row prints what it measured; nothing here writes.
select 'database' as check, current_database() || ' @ ' || coalesce(inet_server_addr()::text, 'local') as value
union all select 'ledger has 20260923200000 (R3)',
  (exists (select 1 from supabase_migrations.schema_migrations where version = '20260923200000'))::text
union all select 'ledger has 20260924100000 (must be false before)',
  (exists (select 1 from supabase_migrations.schema_migrations where version = '20260924100000'))::text
union all select 'children', (select count(*) from public.learners)::text
union all select 'children whose consent is NOT granted (must be 0)',
  (select count(*) from public.learners l join public.parental_consents c on c.id = l.consent_id where c.state <> 'granted')::text
union all select 'children whose consent is not bound to them (must be 0 before)',
  (select count(*) from public.learners l join public.parental_consents c on c.id = l.consent_id where c.learner_id is distinct from l.id)::text
union all select 'consents by state', (select string_agg(state || '=' || n, ', ' order by state) from (select state, count(*) n from public.parental_consents group by 1) x)
union all select 'notice versions in consents', (select string_agg(distinct notice_version, ', ') from public.parental_consents)
union all select 'notice versions outside notice-v1..v5 (must be empty)',
  coalesce((select string_agg(distinct notice_version, ', ') from public.parental_consents where notice_version not in ('notice-v1','notice-v2','notice-v3','notice-v4','notice-v5')), '(none)');
