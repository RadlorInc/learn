-- CANCEL AND REFUND ON CLOSE — BEFORE the migration 20261008000000 (read-only; counts and booleans only). Run it in the
-- SQL editor BEFORE approving the production-db run, and keep the output. Every row without INFO should say PASS.
-- The INFO rows say what the migration will change; the proof file expects the opposite.
select 'ledger does NOT yet have 20261008000000' as check,
       case when not exists (select 1 from supabase_migrations.schema_migrations where version = '20261008000000') then 'PASS' else 'FAIL' end as result
-- STOP-CHECK: the body the migration was written against (20260926100600). FAIL = production differs: stop, do not approve.
union all select 'STOP-CHECK consent_withdraw_account(uuid) body is the repo''s 20260926100600 one',
       case when (select md5(prosrc) from pg_proc where oid = 'public.consent_withdraw_account(uuid)'::regprocedure) = 'ca7bdd7e10fc760af081e9416a1ce232' then 'PASS' else 'FAIL' end
union all select 'consent_withdraw_account(uuid) is SECURITY DEFINER with search_path=public, pg_temp',
       case when (select prosecdef and proconfig = array['search_path=public, pg_temp'] from pg_proc where oid = 'public.consent_withdraw_account(uuid)'::regprocedure) then 'PASS' else 'FAIL' end
union all select 'INFO billing_cancellations exists (expected false; the migration creates it)',
       (to_regclass('public.billing_cancellations') is not null)::text
union all select 'INFO triggers on subscriptions (expected 1: subscriptions_updated_at; the migration adds one)',
       (select count(*)::text from pg_trigger where tgrelid = 'public.subscriptions'::regclass and not tgisinternal)
-- What a close or withdraw-all will meet after the migration: a subscription row on an account.
union all select 'INFO subscriptions rows with a Stripe subscription id (any number: the plans a close or withdraw-all would now cancel)',
       (select count(*)::text from public.subscriptions where stripe_subscription_id is not null);
