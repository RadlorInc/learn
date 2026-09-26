-- N11 — AFTER applying 20260926100900_keep_consent_record_on_account_close.sql. READ-ONLY (SELECT only). Rafi runs it.

-- 1. The FK: expect ONE row, on_delete 'n' (SET NULL), not_null false.
select con.conname, con.confdeltype as on_delete,
       (select attnotnull from pg_attribute where attrelid = 'public.parental_consents'::regclass and attname = 'parent_id') as not_null
  from pg_constraint con
 where con.conrelid = 'public.parental_consents'::regclass and con.contype = 'f' and con.confrelid = 'auth.users'::regclass;

-- 2. The guard: md5 a25e6fa9e4197977eb208bf3386d25fd, definer false, config unchanged from the before-SQL.
select md5(p.prosrc) as md5, p.prosecdef as definer, array_to_string(p.proconfig, ',') as config
  from pg_proc p where p.oid = 'public.consent_guard_update()'::regprocedure;

-- 3. The new trigger function — the ONE new SECURITY DEFINER object. Expect: definer true,
--    config 'search_path=public, pg_temp', api_callable false; and the trigger on auth.users, BEFORE DELETE, enabled 'O'.
select p.prosecdef as definer, array_to_string(p.proconfig, ',') as config, pg_get_userbyid(p.proowner) as owner,
       has_function_privilege('anon', p.oid, 'EXECUTE') or has_function_privilege('authenticated', p.oid, 'EXECUTE') as api_callable
  from pg_proc p where p.oid = 'public.consent_settle_on_account_delete()'::regprocedure;
select tgname, tgenabled from pg_trigger where tgname = 'trg_consent_settle_on_account_delete' and tgrelid = 'auth.users'::regclass;

-- 4. Live check (no SQL to write): make a throwaway parent, give consent, then Account → Close your account.
--    Then (you, SQL editor):
--      select state, parent_id, withdrawn_at is not null as ended from public.parental_consents where email_address = '<that address>';
--    Expect one row: withdrawn, parent_id NULL, ended true. And in Resend, that parent's B3 shows Cancelled.
