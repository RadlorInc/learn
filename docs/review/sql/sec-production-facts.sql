-- SEC (R5 security audit) — READ-ONLY facts only production can answer. For Rafi to run in the SQL editor.
-- Nothing here writes: every statement is a SELECT, or an EXPLAIN (no ANALYZE) inside a transaction that is rolled back.

-- Q1  SEC-02: does deleting a learner_access row fail with "infinite recursion" on production too?
--     EXPLAIN plans the statement (policies are expanded at planning) but executes nothing.
--     Expect on a fixed database: a plan. Expect on the defect: ERROR 42P17 infinite recursion detected in policy for relation "learner_access".
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000000","role":"authenticated"}', true);
explain delete from public.learner_access where false;
rollback;

-- Q2  SEC-02: how many viewer grants exist, and how many accepted invites are still inside their 7-day window
--     (a viewer removed by hand during that window can re-open the invite and re-insert access).
select (select count(*) from public.learner_access where access_role = 'viewer')                          as viewer_rows,
       (select count(*) from public.learner_invites where status = 'accepted' and expires_at > now())     as accepted_unexpired_invites;

-- Q3  SEC-01 (removed): the database CANNOT say whether the pre-hijack happened. Measured on the local stack:
--     two admin generate_link sign-ups for one address leave NO row in auth.audit_log_entries (only the later
--     `user_signedup` at verification), so any query here would read 0 whether or not it happened (a blind check).
--     Where to look instead: Resend's log — two or more "Confirm your email" (B0/B0t) messages to the SAME address
--     before that account's first sign-in, especially with different first names in the greeting.

-- Q4  SEC-06: credentials already written into the crash log by the report-error url field.
select count(*) filter (where url ~ '#t=')                           as consent_or_unsubscribe_token_in_url,
       count(*) filter (where url ~ '[?&](th|token_hash)=')          as email_token_hash_in_url,
       count(*) filter (where url ~ 'access_token=|refresh_token=')  as session_token_in_url,
       count(*)                                                      as error_events_total   -- control: must be > 0 for zeros above to mean "none"
from public.error_events;
