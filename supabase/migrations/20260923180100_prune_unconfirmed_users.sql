-- Delete accounts that were never confirmed — the junk the old signup trigger left behind, and the
-- steady drip a public signup form produces (typos, abandoned signups, addresses entered by someone
-- who does not own them).
--
-- A never-confirmed user cannot sign in (Confirm email is ON) and so cannot own a learner; the
-- `and not exists` guard is belt-and-suspenders so one unexpected row can never make the nightly job
-- throw and go silently un-run. ⚠️ It is not decorative: `learners.created_by → profiles` is
-- ON DELETE RESTRICT, so without it one such row would abort the WHOLE delete, every night.
--
-- WHAT A DELETE CASCADES INTO (read off pg_constraint on baseline + every migration, 2026-09-23):
-- `auth.users` ← profiles, auth_events, grades, parent_pins, subscriptions, teacher_plans,
-- admin_users, parental_consents (CASCADE), billing_events.account_id (SET NULL); `profiles` ←
-- learner_access, learner_invites (CASCADE), learners (RESTRICT — the guard). An unconfirmed user
-- can create none of those except its signup `auth_events` and — under the pre-20260923180000
-- trigger — a `profiles` row: signing in, consent (`consent_request` requires
-- `email_confirmed_at is not null`), invites, checkout and PINs all need a session. Children's own
-- logins are created CONFIRMED (`/api/child-login`, `email_confirm: true`), so they are never pruned.
--
-- 3 days, not hours: a real signup confirms within minutes, but people do check email the next day,
-- and nuking an in-flight confirmation is worse than letting junk live one more night.
--
-- ⚠️ SECURITY DEFINER THAT DELETES FROM auth.users. Like `delete_my_account`, this runs as the
-- owner and can remove auth users — but unattended, on a schedule. It is REVOKED from every API role
-- (public/anon/authenticated); only pg_cron (postgres) calls it, so it is not reachable through
-- PostgREST. Do not grant it back.
--
-- First written 2026-09-08 as `20260908120100`, never applied, held in `supabase/held/` until
-- 2026-09-23; re-versioned after `20260923180000`, body unchanged. Applied by `migrate-prod` behind
-- the `production-db` approval. ⚠️ IRREVERSIBLE: the one-time sweep below deletes accounts at apply;
-- take the backup by hand first. Retention row: docs/legal/04-data-retention-policy.md §2.

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
