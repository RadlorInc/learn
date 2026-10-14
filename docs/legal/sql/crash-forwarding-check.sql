-- CRASH FORWARDING AND BOUNCE CHECK (read-only; the founder runs it in the Supabase SQL editor — the agent never does)
-- The live check handoff.md lists ("send a test error to /api/report-error, then read it back in error_events"),
-- plus the Resend bounce webhook (#374): a bounce to bounced@resend.dev becomes one '[resend] email.bounced' row.
--
-- Before running: send the test error from a terminal (it carries no learner id, no account, nothing a parent typed):
--   curl -s -X POST https://radlic.com/api/report-error -H 'content-type: application/json' -d '{"message":"support-test forwarding"}'
-- It answers {"ok":true} whether or not the row was written, so only this query proves it. Nothing below writes.
-- Run it within a day of the test.
--
-- Pre-registered meaning (written before the result was seen, 2026-10-06):
--   a row: source = 'client', message = 'support-test forwarding'
--       → the browser path reaches error_events in production: /api/report-error has its service-role key and the
--         insert works. A real child's crash would land here the same way.
--   no such row, but the POST answered {"ok":true}
--       → the route ran but did not write: SUPABASE_SERVICE_ROLE_KEY is missing in Vercel Production, or the insert
--         failed. Vercel Logs → search "[milo.sink]" shows which. (The route answers ok either way, by design.)
--   a row: source = 'server', message = '[resend] email.bounced'
--       → the bounce webhook verified Resend's signature and recorded the bounce (the test on 2026-10-06 sent one).
--   no '[resend]' row although Resend showed 200 for that delivery
--       → the webhook answered but the sink did not write: same cause as above.
--   has_learner is false for every row here: neither test names a child. True would mean something else matched.

select at,
       source,
       message,
       route_path,
       learner_id is not null as has_learner
from public.error_events
where at > now() - interval '1 day'
  and (message = 'support-test forwarding' or message like '[resend] %')
order by at desc
limit 20;
