-- CANCEL AND REFUND ON CLOSE — BEFORE the migrations 20261008000000 and 20261008010000 (one child's seat) (read-only; counts and booleans only). Run it in the
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
       (select count(*)::text from public.subscriptions where stripe_subscription_id is not null)
-- 20261008010000 (one child's seat): the ledger, and the body of the function it redefines.
union all select 'ledger does NOT yet have 20261008010000',
       case when not exists (select 1 from supabase_migrations.schema_migrations where version = '20261008010000') then 'PASS' else 'FAIL' end
-- STOP-CHECK: the body that migration was written against (20260926100600). FAIL = production differs: stop, do not approve.
union all select 'STOP-CHECK delete_child_data(uuid, text) body is the repo''s 20260926100600 one',
       case when (select md5(prosrc) from pg_proc where oid = 'public.delete_child_data(uuid,text)'::regprocedure) = '32ea4b121a5721e83200eee4c443c5ad' then 'PASS' else 'FAIL' end
union all select 'delete_child_data(uuid, text) is SECURITY DEFINER with search_path=public, pg_temp',
       case when (select prosecdef and proconfig = array['search_path=public, pg_temp'] from pg_proc where oid = 'public.delete_child_data(uuid,text)'::regprocedure) then 'PASS' else 'FAIL' end
union all select 'INFO billing_seat_removals exists (expected false; the migration creates it)',
       (to_regclass('public.billing_seat_removals') is not null)::text
-- What a one-child withdrawal would meet: paid plans with an empty seat today (any number; after the migration a seat
-- left empty BY a withdrawal is removed — a seat empty before it is not touched).
union all select 'INFO plans holding seats that have an empty seat today',
       (select count(distinct s.id)::text from public.subscriptions s join public.subscription_seats st on st.subscription_id = s.id
         where st.learner_id is null and s.status in ('active', 'trialing', 'past_due', 'unpaid'));
