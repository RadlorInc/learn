-- BUG-09 (docs/review/LATENT-BUGS.md): the nightly prune must never destroy a granted consent record.
--
-- `prune_unconfirmed_users()` deletes auth users that are unconfirmed and older than 3 days. Since
-- consent-once / the one-email sign-up (20260924100000, 20260926090000), a consent can be GRANTED on an
-- account whose address is still unconfirmed (e.g. a B0 link opened after the confirmation OTP expired —
-- /auth/confirm still sends the parent on to /consent/respond). `parental_consents.parent_id → auth.users`
-- is ON DELETE CASCADE, so the prune then deleted that account AND its granted consent record — a COPPA
-- evidence record, destroyed by an unattended job. (The header of 20260923180100 says "consent_request
-- requires email_confirmed_at is not null"; that stopped being the whole story once the signup-time request
-- existed.)
--
-- THE CHANGE: one added guard line. An account holding a consent that is, or ever was, granted
-- (`state in ('granted', 'withdrawn')` — withdrawn is only reachable from granted) is never pruned.
-- An account with no consent, or only a pending / declined / expired request, is pruned exactly as before.
-- Whether a grant should require a confirmed address at all is a separate decision (flow; Rafi's N5) and
-- is NOT made here.
--
-- ⚠️ SECURITY POSTURE UNCHANGED, DELIBERATELY. The body below is 20260923180100's definition (the only
-- migration that defines this function) with ONE line added. `language sql`, `security definer`,
-- `set search_path to 'public'` are copied as they were; `create or replace` keeps the owner and the ACL,
-- and the revoke from public/anon/authenticated is re-stated as the original did. The pg_cron job
-- `prune-unconfirmed-users` runs `select public.prune_unconfirmed_users()` by NAME, so it picks up this
-- body with no reschedule. No one-time sweep here: this only narrows what the job deletes.

create or replace function public.prune_unconfirmed_users()
returns void
language sql
security definer
set search_path to 'public'
as $$
  delete from auth.users u
  where u.email_confirmed_at is null
    and u.created_at < now() - interval '3 days'
    and not exists (select 1 from public.learners l where l.created_by = u.id)
    and not exists (select 1 from public.parental_consents c where c.parent_id = u.id and c.state in ('granted', 'withdrawn'));
$$;

revoke all on function public.prune_unconfirmed_users() from public, anon, authenticated;

-- Closing assertions: the guard is in the live definition, and the security posture is what it was.
do $$
declare f oid := 'public.prune_unconfirmed_users()'::regprocedure;
begin
  if pg_get_functiondef(f) !~ 'parental_consents c where c\.parent_id = u\.id and c\.state in \(''granted'', ''withdrawn''\)' then
    raise exception 'BUG-09: prune_unconfirmed_users() does not carry the granted-consent guard';
  end if;
  if not (select prosecdef from pg_proc where oid = f) then
    raise exception 'BUG-09: prune_unconfirmed_users() is no longer SECURITY DEFINER';
  end if;
  if (select array_to_string(proconfig, ',') from pg_proc where oid = f) is distinct from 'search_path=public' then
    raise exception 'BUG-09: prune_unconfirmed_users() search_path is not pinned to public';
  end if;
  if has_function_privilege('anon', f, 'EXECUTE') or has_function_privilege('authenticated', f, 'EXECUTE') then
    raise exception 'BUG-09: prune_unconfirmed_users() is callable by an API role';
  end if;
end $$;
