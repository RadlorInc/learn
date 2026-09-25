-- ONE SIGN-UP EMAIL (PR #228) — BEFORE approving the `production-db` run (read-only). Run in the Supabase SQL editor
-- on PRODUCTION and write the values down. Every row prints what it measured; nothing here writes.
select 'database' as check, current_database() || ' @ ' || coalesce(inet_server_addr()::text, 'local') as value
union all select 'ledger has 20260926090000 (must be false before)',
  (exists (select 1 from supabase_migrations.schema_migrations where version = '20260926090000'))::text
union all select 'function consent_request_at_signup exists (must be false before)',
  (exists (select 1 from pg_proc where proname = 'consent_request_at_signup' and pronamespace = 'public'::regnamespace))::text
union all select 'consents by method/state',
  (select string_agg(method || '/' || state || '=' || n, ', ' order by method, state) from (select method, state, count(*) n from public.parental_consents group by 1, 2) x)
union all select 'consents NOT email_plus (must be 0 — card consent is not built)',
  (select count(*) from public.parental_consents where method <> 'email_plus')::text
union all select 'granted consents with no B3 recorded (must be 0 — email-plus)',
  (select count(*) from public.parental_consents where state = 'granted' and method = 'email_plus' and second_email_provider_id is null)::text
union all select 'current notice version (the app sends notice-v6)',
  (select version from public.consent_notice_versions order by seq desc limit 1);
