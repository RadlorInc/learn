-- Delete accounts that were never confirmed — the junk the old signup trigger left behind, and the
-- steady drip a public signup form produces (typos, abandoned signups, addresses entered by someone
-- who does not own them).
--
-- A never-confirmed user cannot sign in (Confirm email is ON) and so cannot own a learner; the
-- `and not exists` guard is belt-and-suspenders so one unexpected row can never make the nightly job
-- throw and go silently un-run. Deleting the auth.users row cascades to `profiles`
-- (profiles.id -> auth.users on delete cascade); nothing else references an unconfirmed user.
--
-- 3 days, not hours: a real signup confirms within minutes, but people do check email the next day,
-- and nuking an in-flight confirmation is worse than letting junk live one more night.
--
-- ⚠️ SECURITY DEFINER THAT DELETES FROM auth.users. Like `delete_my_account`, this runs as the
-- owner and can remove auth users — but unattended, on a schedule. It is REVOKED from every API role
-- (public/anon/authenticated); only pg_cron (postgres) calls it, so it is not reachable through
-- PostgREST. Do not grant it back.
--
-- ⚠️ NOT APPLIED TO PROD BY THIS COMMIT — founder applies prod DDL by hand (see handoff).

create extension if not exists pg_cron;

create or replace function public.prune_unconfirmed_users()
returns void
language sql
security definer
set search_path to 'public'
as $$
  delete from auth.users u
  where u.email_confirmed_at is null
    and u.created_at < now() - interval '3 days'
    and not exists (select 1 from public.learners l where l.created_by = u.id);
$$;

revoke all on function public.prune_unconfirmed_users() from public, anon, authenticated;

-- One-time sweep of what is already there, same threshold as the job.
delete from auth.users u
where u.email_confirmed_at is null
  and u.created_at < now() - interval '3 days'
  and not exists (select 1 from public.learners l where l.created_by = u.id);

-- Idempotent: unschedule before scheduling so a re-run cannot stack duplicates.
-- Slot 03:37 — after the four existing retention jobs (03:17/22/27/32), so it is not a 3am pile-up.
select cron.unschedule('prune-unconfirmed-users')
where exists (select 1 from cron.job where jobname = 'prune-unconfirmed-users');

select cron.schedule('prune-unconfirmed-users', '37 3 * * *', $$select public.prune_unconfirmed_users()$$);
