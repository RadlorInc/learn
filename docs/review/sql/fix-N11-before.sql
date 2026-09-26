-- N11 — BEFORE applying 20260926100900_keep_consent_record_on_account_close.sql. READ-ONLY (SELECT only). Rafi runs it.
-- Apply only AFTER 20260926100800 (N5).

-- 1. The foreign key today. Expect ONE row: parental_consents_parent_id_fkey, on_delete 'c' (CASCADE), parent_id NOT NULL.
select con.conname, con.confdeltype as on_delete,
       (select attnotnull from pg_attribute where attrelid = 'public.parental_consents'::regclass and attname = 'parent_id') as not_null
  from pg_constraint con
 where con.conrelid = 'public.parental_consents'::regclass and con.contype = 'f' and con.confrelid = 'auth.users'::regclass;

-- 2. ⚠️ STOP-CHECK. The migration redefines consent_guard_update with ONE line changed, so production's body must equal
--    the repo's today. md5 as the repo builds it (PGlite, 2026-09-26): e199ddb4c4eed9cfced3ec0152c2bca6.
--    definer: expect FALSE (it is INVOKER and stays so). Differs → do NOT apply; send the difference back.
select md5(p.prosrc) as md5, p.prosecdef as definer, array_to_string(p.proconfig, ',') as config
  from pg_proc p where p.oid = 'public.consent_guard_update()'::regprocedure;

-- 3. Nothing by that name exists yet. Expect: trigger_exists false, function_exists false.
select exists (select 1 from pg_trigger where tgname = 'trg_consent_settle_on_account_delete') as trigger_exists,
       to_regprocedure('public.consent_settle_on_account_delete()') is not null                as function_exists;

-- 4. What the change will act on the next time an account is deleted (counts only).
select state, count(*) from public.parental_consents group by state order by state;
