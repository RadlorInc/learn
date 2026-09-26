-- N5 (Rafi, 2026-09-26; BUG-09's flow half): a consent can only be GRANTED on a CONFIRMED address, and the nightly
-- prune also keeps an account whose only consent was DECLINED (evidence, like granted and withdrawn).
--
-- Why: the one-email sign-up (20260926090000) lets a parent reach the consent page before the address is confirmed
-- (an expired confirmation link still forwards the consent token — /auth/confirm, deliberately, so a SECOND click on a
-- used link still works). A grant there was a COPPA consent attached to an address nobody had proven they hold, and
-- that account could not even sign in. Now `consent_grant` answers 'unconfirmed' and changes nothing: the request
-- stays PENDING, so the parent confirms (or signs up again for a fresh link) and ticks again. /api/consent/respond
-- cancels the B3 it scheduled for any answer that is not 'granted' (existing behaviour), and the page says why.
--
-- THE CHANGES, and nothing else:
--   consent_grant(text, text, timestamptz) — the body of 20260924100000 (the last migration to define it) with ONE
--     block added after the expiry check (marked N5). DEFINER, `search_path = public, pg_temp`, the owner and the
--     ACL (service_role only, 20260923130000) are unchanged; the revoke/grant is re-stated as the original did.
--   prune_unconfirmed_users() — the body of 20260926100600 (FND-15, which kept BUG-09's guard) with 'declined'
--     added to the guard's list. DEFINER, `search_path to 'public'`, service-only EXECUTE unchanged.
-- ⚠️ STOP-CHECK before applying: docs/review/sql/fix-N5-before.sql compares production's two bodies with the repo's.
-- ⚠️ Deploy order: either. An app without the page copy for 'unconfirmed' shows its generic error for that answer
-- (still nothing granted); this database without the new app just never sees an unconfirmed grant attempt refused.
-- ⚠️ ORDER: after 20260926100600 (FND-15). This redefines the prune FND-15 wrote; applied before it, FND-15 would
-- overwrite 'declined' away (and FND-15's own assertion only checks the granted/withdrawn words).

create or replace function public.consent_grant(
  p_token_hash text, p_second_provider_id text, p_second_scheduled_for timestamptz)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r public.parental_consents;
  v_prior uuid[];
begin
  select * into r from public.parental_consents where token_hash = p_token_hash for update;
  if not found then return 'unknown'; end if;
  if r.state = 'granted' then return 'already_granted'; end if;
  if r.state <> 'pending' then return r.state; end if;
  if r.expires_at <= now() then
    update public.parental_consents set state = 'expired' where id = r.id;
    return 'expired';
  end if;

  -- N5 ↓ A consent is only granted on an address its holder has proven. The request stays pending; the caller
  -- cancels the B3 it scheduled (the answer is not 'granted') and asks the parent to confirm first.
  if not exists (select 1 from auth.users u where u.id = r.parent_id and u.email_confirmed_at is not null) then
    return 'unconfirmed';
  end if;
  -- N5 ↑

  -- CHANGED ↓ An account already holding a CURRENT granted consent needs no second one: this request is
  -- closed (expired — it was never answered with a grant that counts) and the caller cancels the B3 it
  -- just scheduled, because the answer is not 'granted'.
  if r.scope = 'account' then
    if exists (select 1 from public.parental_consents o
                where o.parent_id = r.parent_id and o.scope = 'account' and o.state = 'granted'
                  and public.consent_is_current(o.notice_version)) then
      update public.parental_consents set state = 'expired' where id = r.id;
      return 'already_consented';
    end if;
    -- A RE-CONSENT (the older one is no longer current). Grant the new one FIRST, move the children onto
    -- it, and only then close the old one — so no child is ever without a granted consent in between.
    select coalesce(array_agg(o.id), '{}') into v_prior
      from public.parental_consents o
     where o.parent_id = r.parent_id and o.scope = 'account' and o.state = 'granted';
  end if;
  -- CHANGED ↑

  update public.parental_consents
     set state = 'granted', confirmed_at = now(),
         second_email_provider_id = p_second_provider_id,
         second_notice_scheduled_for = p_second_scheduled_for
   where id = r.id;

  -- CHANGED ↓
  if r.scope = 'account' and cardinality(v_prior) > 0 then
    update public.learners set consent_id = r.id where consent_id = any(v_prior);
    update public.parental_consents set state = 'withdrawn', withdrawn_at = now() where id = any(v_prior);
  end if;
  -- CHANGED ↑
  return 'granted';
end
$$;

revoke all on function public.consent_grant(text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.consent_grant(text, text, timestamptz) to service_role;

create or replace function public.prune_unconfirmed_users()
returns void
language sql
security definer
set search_path to 'public'
as $$
  with gone as (                                                                         -- FND-15
  delete from auth.users u
  where u.email_confirmed_at is null
    and u.created_at < now() - interval '3 days'
    and not exists (select 1 from public.learners l where l.created_by = u.id)
    and not exists (select 1 from public.parental_consents c where c.parent_id = u.id and c.state in ('granted', 'withdrawn', 'declined'))  -- BUG-09 (20260926100100) + N5: declined kept too
  returning 1)                                                                           -- FND-15
  insert into public.deletion_log (path, actor_kind, row_counts)                         -- FND-15
  select 'prune_unconfirmed', 'system', jsonb_build_object('auth.users', count(*))       -- FND-15
    from gone having count(*) > 0;                                                       -- FND-15
$$;

revoke all on function public.prune_unconfirmed_users() from public, anon, authenticated;

-- Closing assertions: both changes are in the live definitions, and the security posture is what it was.
do $$
begin
  if pg_get_functiondef('public.consent_grant(text, text, timestamptz)'::regprocedure)
     !~ 'u\.id = r\.parent_id and u\.email_confirmed_at is not null' then
    raise exception 'N5: consent_grant does not carry the confirmed-address guard — rolled back';
  end if;
  if pg_get_functiondef('public.prune_unconfirmed_users()'::regprocedure)
     !~ 'c\.state in \(''granted'', ''withdrawn'', ''declined''\)' then
    raise exception 'N5: prune_unconfirmed_users does not keep granted/withdrawn/declined consents — rolled back';
  end if;
  if pg_get_functiondef('public.prune_unconfirmed_users()'::regprocedure) !~ 'deletion_log' then
    raise exception 'N5: prune_unconfirmed_users lost the FND-15 deletion log — rolled back';
  end if;
  if not exists (select 1 from pg_proc where oid = 'public.consent_grant(text, text, timestamptz)'::regprocedure
                  and prosecdef and proconfig = array['search_path=public, pg_temp'])
     or not exists (select 1 from pg_proc where oid = 'public.prune_unconfirmed_users()'::regprocedure
                  and prosecdef and proconfig = array['search_path=public']) then
    raise exception 'N5: DEFINER or search_path changed — rolled back';
  end if;
  if has_function_privilege('anon', 'public.consent_grant(text, text, timestamptz)', 'execute')
     or has_function_privilege('authenticated', 'public.consent_grant(text, text, timestamptz)', 'execute')
     or not has_function_privilege('service_role', 'public.consent_grant(text, text, timestamptz)', 'execute')
     or has_function_privilege('anon', 'public.prune_unconfirmed_users()', 'execute')
     or has_function_privilege('authenticated', 'public.prune_unconfirmed_users()', 'execute') then
    raise exception 'N5: EXECUTE changed — rolled back';
  end if;
end $$;
