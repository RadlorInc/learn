-- OPS-04 / OPS-07 / FND-11 — BEFORE applying 20260926100300_ops_digest.sql. READ-ONLY, for Rafi in the SQL editor.
-- Nothing here returns a name, email, answer or message text: counts, job names and function metadata only.

-- B1. Does the drain skip refused rows today? (the FND-11 defect)
--   retries_refused : false = consent_b3_due() still ignores 'refused: …' rows, so a 401 from Resend is never retried
select pg_get_functiondef('public.consent_b3_due()'::regprocedure) like '%refused:%' as retries_refused;

-- B2. Refused B3 cancels sitting in the queue right now.
--   refused_ahead  : refused, B3 still scheduled in the future — these WILL be retried once the migration is applied
--   refused_missed : refused, send time already passed — B3 went out to a parent whose consent had ended
select count(*) filter (where scheduled_for >  now() and cancel_result like 'refused:%') as refused_ahead,
       count(*) filter (where scheduled_for <= now() and cancel_result like 'refused:%') as refused_missed
from public.consent_b3_cancellations;

-- B3. The digest function does not exist yet.
--   ops_digest_exists : expected false before the migration
select to_regprocedure('public.ops_digest()') is not null as ops_digest_exists;
