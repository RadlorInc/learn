-- ONE SIGN-UP EMAIL (PR #228) — PROOF, AFTER the `production-db` run (read-only). Run on PRODUCTION.
-- Part A right after the migration; Part B after the live check (one parent signed up and ticked the box).
-- ── Part A: the function exists, is the server's alone, and nothing else changed ──
select 'ledger has 20260926090000 (must be true)' as check,
  (exists (select 1 from supabase_migrations.schema_migrations where version = '20260926090000'))::text as value
union all select 'SECURITY DEFINER (must be true)',
  (select prosecdef from pg_proc where oid = 'public.consent_request_at_signup(uuid,text,text,text,text,text,interval)'::regprocedure)::text
union all select 'search_path pinned (must show search_path=public, pg_temp)',
  (select array_to_string(proconfig, ' | ') from pg_proc where oid = 'public.consent_request_at_signup(uuid,text,text,text,text,text,interval)'::regprocedure)
union all select 'anon can execute (must be false)',
  has_function_privilege('anon', 'public.consent_request_at_signup(uuid,text,text,text,text,text,interval)', 'execute')::text
union all select 'authenticated can execute (must be false)',
  has_function_privilege('authenticated', 'public.consent_request_at_signup(uuid,text,text,text,text,text,interval)', 'execute')::text
union all select 'service_role can execute (must be true)',
  has_function_privilege('service_role', 'public.consent_request_at_signup(uuid,text,text,text,text,text,interval)', 'execute')::text
union all select 'consents NOT email_plus (must still be 0)',
  (select count(*) from public.parental_consents where method <> 'email_plus')::text;

-- ── Part B: after the live check. Replace the address with the one you signed up with. ──
-- Expected: method email_plus · state granted · parent_ack_at NULL (no on-screen tick at sign-up) ·
-- request_email_provider_id set (B0) · second_email_provider_id set (B3) · second_notice_scheduled_for ≈ confirmed_at + 24 h.
select c.method, c.state, c.scope, c.notice_version, c.parent_ack_at, c.request_email_provider_id is not null as b0_recorded,
       c.second_email_provider_id as b3_resend_id, c.confirmed_at, c.second_notice_scheduled_for,
       round(extract(epoch from (c.second_notice_scheduled_for - c.confirmed_at)) / 3600, 1) as b3_hours_after_grant,
       p.role, u.email_confirmed_at is not null as email_confirmed
  from public.parental_consents c
  join auth.users u on u.id = c.parent_id
  left join public.profiles p on p.id = c.parent_id
 where u.email = 'YOUR-TEST-ADDRESS@example.com'
 order by c.created_at desc;
