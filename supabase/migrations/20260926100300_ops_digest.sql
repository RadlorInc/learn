-- ═══════════════════════════════════════════════════════════════════════════════════════════════
-- OPS-04 / OPS-07 / FND-11 (docs/review/DEVOPS.md, FOUNDER-STRESS-TEST.md): A DAILY DIGEST THAT SAYS,
-- IN NUMBERS ONLY, WHETHER ANYTHING BROKE — AND A REFUSED B3 CANCEL IS RETRIED INSTEAD OF DROPPED.
--
-- 1. `consent_b3_due` / `consent_b3_record` (INVOKER, service_role only — unchanged grants). Copied from
--    20260923200000_b3_cancel_queue.sql; the ONLY changed lines are the two `where` clauses, which now
--    treat 'refused: …' like 'error: …' — retried by the next drain while the B3 is still ahead.
--    Why: on 24 Sep a sending-only Resend key made every cancel come back 401, which `cancelOutcome`
--    records as 'refused' — "final, never retried". So a key problem silently left withdrawn parents'
--    B3 in place. Retrying a genuine refusal (already cancelled) is harmless: Resend refuses again, and
--    `scheduled_for > now()` bounds the retries to the day before the send. 'cancelled' stays final,
--    so a racing drain still cannot overwrite it.
--
-- 2. `ops_digest()` — NEW. One row of COUNTS for the daily cron to email to the founder. Its return
--    type is integers, one boolean and an array of pg_cron JOB NAMES — no column can carry a child's
--    name, an answer, an email address or free text from any table a user writes. Asserted below.
--
-- ⚠️⚠️ SECURITY CHANGE, CALLED OUT: `ops_digest` is SECURITY DEFINER, because it must read
-- `cron.job_run_details` (owned by the pg_cron extension, not granted to service_role on Supabase).
-- search_path pinned; EXECUTE revoked from public, anon, authenticated; granted to service_role only.
-- It takes no arguments and returns aggregates only.
--
-- DEPLOY ORDER: EITHER. Client first: the digest finds no function (PGRST202) and says so in the
-- email ("digest function missing"); the drain behaves as before. This file first: nothing calls
-- `ops_digest` until the client does, and the drain's retry starts at once.
-- ═══════════════════════════════════════════════════════════════════════════════════════════════

-- ── 1. B3 cancel: retry refused rows (FND-11) ─────────────────────────────────────────────────────
/** What still needs a cancel: due in the future, never cancelled. */
create or replace function public.consent_b3_due()
returns table (provider_id text)
language sql
stable
set search_path = public, pg_temp
as $$
  select q.provider_id from public.consent_b3_cancellations q
   where q.scheduled_for > now()
     and (q.cancel_result is null or q.cancel_result like 'error:%' or q.cancel_result like 'refused:%')
   order by q.queued_at;
$$;

/** Record one outcome. Never overwrites 'cancelled', so two drains racing cannot turn a
 *  'cancelled' into the 'refused' the second cancel gets back. */
create or replace function public.consent_b3_record(p_provider_id text, p_result text)
returns void
language sql
set search_path = public, pg_temp
as $$
  update public.consent_b3_cancellations
     set attempted_at = now(), cancel_result = p_result
   where provider_id = p_provider_id
     and (cancel_result is null or cancel_result like 'error:%' or cancel_result like 'refused:%');
$$;

revoke all on function public.consent_b3_due() from public, anon, authenticated;
grant execute on function public.consent_b3_due() to service_role;
revoke all on function public.consent_b3_record(text, text) from public, anon, authenticated;
grant execute on function public.consent_b3_record(text, text) to service_role;

-- ── 2. The digest (OPS-04, OPS-07) ───────────────────────────────────────────────────────────────
create or replace function public.ops_digest()
returns table (
  error_events_24h        integer,  -- crashes the app reported in the last 24 h (count only)
  cron_readable           boolean,  -- false = cron.job_run_details could not be read; the two below are then 0/empty and mean nothing
  cron_runs_failed_24h    integer,  -- pg_cron runs in the last 24 h whose status is not 'succeeded'
  cron_jobs_failing       text[],   -- JOB NAMES with a failed run in 24 h, or no run at all in 26 h (every job is daily)
  b3_cancel_failing       integer,  -- queued B3 cancels still ahead whose last try was refused or errored
  b3_cancel_missed_7d     integer,  -- queued B3 cancels whose send time passed in the last 7 days without a cancel — a withdrawn parent got B3
  consent_pending_overdue integer,  -- pending consent requests past expires_at by > 1 day — the expiry job is not running
  consent_request_unsent  integer   -- pending requests older than 1 h with no request email recorded
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_failed integer := 0;
  v_jobs   text[]  := '{}';
  v_cron   boolean := to_regclass('cron.job_run_details') is not null and to_regclass('cron.job') is not null;
begin
  if v_cron then
    execute $q$
      select count(*) filter (where d.status is distinct from 'succeeded')::int
        from cron.job_run_details d where d.start_time > now() - interval '24 hours'
    $q$ into v_failed;
    execute $q$
      select coalesce(array_agg(j.jobname order by j.jobname), '{}')
        from cron.job j
       where exists (select 1 from cron.job_run_details d where d.jobid = j.jobid
                       and d.start_time > now() - interval '24 hours' and d.status is distinct from 'succeeded')
          or not exists (select 1 from cron.job_run_details d where d.jobid = j.jobid
                       and d.start_time > now() - interval '26 hours')
    $q$ into v_jobs;
  end if;

  return query select
    (select count(*)::int from public.error_events e where e.at > now() - interval '24 hours'),
    v_cron, v_failed, v_jobs,
    (select count(*)::int from public.consent_b3_cancellations q
      where q.scheduled_for > now() and (q.cancel_result like 'error:%' or q.cancel_result like 'refused:%')),
    (select count(*)::int from public.consent_b3_cancellations q
      where q.scheduled_for <= now() and q.scheduled_for > now() - interval '7 days'
        and q.cancel_result is distinct from 'cancelled'),
    (select count(*)::int from public.parental_consents c
      where c.state = 'pending' and c.expires_at < now() - interval '1 day'),
    (select count(*)::int from public.parental_consents c
      where c.state = 'pending' and c.request_email_sent_at is null and c.created_at < now() - interval '1 hour');
end
$$;

revoke all on function public.ops_digest() from public, anon, authenticated;
grant execute on function public.ops_digest() to service_role;

-- ── Closing assertions ──────────────────────────────────────────────────────────────────────────
do $$
declare f oid := 'public.ops_digest()'::regprocedure;
begin
  if not (select prosecdef from pg_proc where oid = f) then raise exception 'ops_digest must be SECURITY DEFINER'; end if;
  if not exists (select 1 from pg_proc p, unnest(p.proconfig) c where p.oid = f and c like 'search_path=%') then
    raise exception 'ops_digest must pin search_path'; end if;
  if pg_get_function_result(f) <> 'TABLE(error_events_24h integer, cron_readable boolean, cron_runs_failed_24h integer, cron_jobs_failing text[], b3_cancel_failing integer, b3_cancel_missed_7d integer, consent_pending_overdue integer, consent_request_unsent integer)' then
    raise exception 'ops_digest return type changed: %', pg_get_function_result(f); end if;
  if has_function_privilege('anon', f, 'execute') or has_function_privilege('authenticated', f, 'execute') then
    raise exception 'ops_digest is callable by anon/authenticated'; end if;
  if not has_function_privilege('service_role', f, 'execute') then raise exception 'service_role cannot call ops_digest'; end if;
  if pg_get_functiondef('public.consent_b3_due()'::regprocedure) not like '%refused:%' then
    raise exception 'consent_b3_due does not retry refused rows'; end if;
  if has_function_privilege('anon', 'public.consent_b3_due()', 'execute') or not has_function_privilege('service_role', 'public.consent_b3_due()', 'execute') then
    raise exception 'consent_b3_due grants changed'; end if;
end $$;
