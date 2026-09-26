-- SEC-02 BEFORE applying 20260926100000_learner_access_revoke.sql — READ-ONLY. Run in the SQL editor.
-- Nothing writes: SELECTs, and one EXPLAIN (no ANALYZE) inside a transaction that is rolled back.

-- B1  Does a signed-in user's DELETE on learner_access fail to plan? (the reviewer's Q1)
--     EXPLAIN expands RLS policies but executes nothing.
--     Expect on the defect: ERROR 42P17 infinite recursion detected in policy for relation "learner_access".
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000000","role":"authenticated"}', true);
explain delete from public.learner_access where false;
rollback;

-- B2  The current learner_access policies and invite triggers.
--     polname / cmd: the policy and its command (d = delete, r = select);
--     using_expr: the row test. Expect on the defect: the delete policy reads `learners` directly.
select p.polname, p.polcmd as cmd, pg_get_expr(p.polqual, p.polrelid) as using_expr
from pg_policy p where p.polrelid = 'public.learner_access'::regclass order by 1;

--     tgname: every user trigger on learner_invites. Expect on the defect: no trg_learner_invites_status_forward.
select tgname from pg_trigger where tgrelid = 'public.learner_invites'::regclass and not tgisinternal order by 1;

-- B3  Exposure (the reviewer's Q2).
--     viewer_rows: viewer grants that exist today (none can currently be removed through the app);
--     accepted_unexpired_invites: accepted invites still inside 7 days — each could be re-opened by its recipient.
select (select count(*) from public.learner_access where access_role = 'viewer')                      as viewer_rows,
       (select count(*) from public.learner_invites where status = 'accepted' and expires_at > now()) as accepted_unexpired_invites;
