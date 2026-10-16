-- WHAT ARE THE RECENT error_events? (read-only; the founder runs it in the Supabase SQL editor — the agent never does)
-- For a digest line "!! error_events_24h: N": groups the last 48 hours by kind, so N becomes a short list. No learner
-- id is selected (only whether one is present). Messages are capped at 120 characters; the server sink stores no
-- error message for handled failures (#374), and client crash messages are code errors, not anything a person typed.
-- Paste the output to the agent in chat only.
--
-- Pre-registered meaning (2026-10-06):
--   message 'support-test forwarding' / '[resend] email.bounced' → the founder's own tests of 2026-10-06, not faults.
--   '[resend] email.bounced' (other days) → a real bounce: a parent's address is wrong; support.md "Email bounces".
--   source 'server' with a route tag like '[auth/signup] failed' → a handled failure on that route (#374).
--   source 'client' → a crash or page error on a device: `url` says which screen; has_learner says a child was in it.
--   the same message many times in one hour from one screen → one device looping, not many families.

select date_trunc('hour', at)   as hour,
       source,
       left(message, 120)       as message,
       coalesce(route_path, regexp_replace(url, '[?#].*$', '')) as where_,
       bool_or(learner_id is not null) as has_learner,
       count(*)                 as n
from public.error_events
where at > now() - interval '48 hours'
group by 1, 2, 3, 4
order by 1 desc, n desc;
