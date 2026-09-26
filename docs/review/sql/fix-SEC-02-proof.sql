-- SEC-02 AFTER applying 20260926100000_learner_access_revoke.sql — READ-ONLY. Run in the SQL editor.
-- Nothing writes: SELECTs, and EXPLAINs (no ANALYZE) inside a transaction that is rolled back.

-- P1  A signed-in user's DELETE on learner_access now plans. Expect: a plan (e.g. "Delete on learner_access"), no 42P17.
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000000","role":"authenticated"}', true);
explain delete from public.learner_access where false;
rollback;

-- P2  The policies. Expect:
--     delete: ((parent_id = auth.uid()) AND (access_role = 'viewer')) OR ((access_role <> 'owner') AND is_learner_creator(learner_id))
--     select: (parent_id = auth.uid()) OR is_learner_creator(learner_id)
--     insert: unchanged (can_self_grant_access).
select p.polname, p.polcmd as cmd, pg_get_expr(p.polqual, p.polrelid) as using_expr
from pg_policy p where p.polrelid = 'public.learner_access'::regclass order by 1;

-- P3  The new helper's security posture.
--     definer: expect true; config: expect {search_path=public};
--     anon_exec: expect false; authenticated_exec: expect true (RLS policies run as the caller).
select p.prosecdef as definer, p.proconfig as config,
       has_function_privilege('anon', p.oid, 'execute')          as anon_exec,
       has_function_privilege('authenticated', p.oid, 'execute') as authenticated_exec
from pg_proc p where p.oid = 'public.is_learner_creator(uuid)'::regprocedure;

-- P4  The invite trigger. Expect one row, enabled = 'O' (fires on every normal write).
select tgname, tgenabled as enabled from pg_trigger
where tgrelid = 'public.learner_invites'::regclass and tgname = 'trg_learner_invites_status_forward';

-- P5  The migration is recorded. Expect one row.
select version from supabase_migrations.schema_migrations where version = '20260926100000';
