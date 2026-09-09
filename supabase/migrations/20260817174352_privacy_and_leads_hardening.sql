-- Security audit remediation — V-5 (data minimisation), V-4 (retention), V-1 (partial).
--
-- V-5 · learners.date_of_birth — an EXACT BIRTHDATE ON A CHILD, collected for nothing.
--   Measured before dropping: the only caller (`parent/page.tsx`) passed `undefined`, no code path
--   ever READ the column, and 0 of 17 production rows held a value. So this destroys no data and
--   changes no behaviour; `age_group` is what the product actually branches on. Under COPPA/GDPR-K
--   the safest PII is the PII you never collected. If an age is ever needed, store the BAND.
alter table public.learners drop column if exists date_of_birth;

-- V-4 · error_events had no retention. It holds url + ua + stack + learner_id, i.e. telemetry
--   linked to a child, and "keep forever" is not a lawful default for that. 90 days is long enough
--   to debug a crash reported by a parent weeks later and short enough to bound the blast radius.
--   pg_cron is already installed on this project, so this is a real job rather than a good intention.
create extension if not exists pg_cron;

create or replace function public.prune_error_events()
returns void
language sql
security definer
set search_path to 'public'
as $$
  delete from public.error_events where at < now() - interval '90 days';
$$;

-- Idempotent: unschedule first so re-running the migration cannot stack duplicate jobs.
select cron.unschedule('prune-error-events')
where exists (select 1 from cron.job where jobname = 'prune-error-events');

select cron.schedule('prune-error-events', '17 3 * * *', $$select public.prune_error_events()$$);

-- V-1 (PARTIAL) · diagnostic_leads accepts anonymous INSERT, so anyone holding the public anon key
--   (it ships in the JS bundle by design) can POST /rest/v1/diagnostic_leads directly and skip
--   /api/lead's 6/min limit AND its email validation. The policy's only guard was LENGTH, so every
--   3-character string was a valid lead.
--
--   ⚠️ THIS DOES NOT CLOSE THE BYPASS — it only stops the table filling with values that are not
--   even emails. Closing it means revoking the anon INSERT grant
--   (20260823221818_leads_server_only.sql), and that CANNOT be applied until
--   SUPABASE_SERVICE_ROLE_KEY is set in Vercel: /api/lead falls back to the anon key, so revoking
--   the grant without the key stops lead capture dead. Deliberately left as two steps.
drop policy if exists "diagnostic_leads: insert" on public.diagnostic_leads;

create policy "diagnostic_leads: insert"
  on public.diagnostic_leads for insert
  to anon, authenticated
  with check (
    char_length(email) between 3 and 254
    -- Same shape the route enforces, so the two cannot disagree about what a lead is.
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  );
