-- Before the paid launch (2026-10-01): who signed up since 25 September? The founder runs this in the PRODUCTION
-- Supabase SQL editor (the agent never queries production). Read-only.
--
-- Columns: day (IST) · email (adult accounts only; children's logins end in .invalid and are left out) ·
-- created_at · last_sign_in_at · children (learners the account created).
-- What the result means:
--   · only accounts the founder knows (the private beta's families, test accounts) → the wipe before launch can go
--     ahead, after a backup;
--   · any address the founder does not recognise → a real family signed up: do NOT wipe; decide with them first.
select (u.created_at at time zone 'Asia/Kolkata')::date as day,
       u.email, u.created_at, u.last_sign_in_at,
       (select count(*) from public.learners l where l.created_by = u.id) as children
from auth.users u
where u.created_at >= '2026-09-25'
  and u.email not like '%.invalid'
order by u.created_at;
