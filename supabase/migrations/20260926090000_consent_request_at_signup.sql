-- ════════════════════════════════════════════════════════════════════════════════════════════════════
-- ONE SIGN-UP EMAIL: the email that confirms a parent's address also carries the consent request (doc 03 B0).
-- Founder, 2026-09-25. Email-plus is UNCHANGED: the grant still needs the token from the email, and B3 is still
-- scheduled a day after the grant and cancelled on withdrawal. Rows are written as method 'email_plus', so every
-- email-plus constraint binds them exactly as it binds B1's.
-- ════════════════════════════════════════════════════════════════════════════════════════════════════
--
-- DEPLOY ORDER: either way is safe. An app without this function falls back (PGRST202) to a confirmation-only
-- email and the parent is asked from the dashboard (B1), as before. Approve the `production-db` run on merge.
--
-- ⚠️⚠️ SECURITY: this adds ONE new SECURITY DEFINER function, `consent_request_at_signup`.
--   · `set search_path = public, pg_temp` pinned; EXECUTE revoked from public, anon, authenticated; granted to
--     service_role only — asserted below, so the file rolls back rather than ship it callable from the API.
--   · It can only create a PENDING request. Granting still needs the 32-byte token that is only in the email.
--   · Why DEFINER: it reads auth.users (the address, and the role the sign-up route wrote into user metadata),
--     which service_role reads through the function exactly as `consent_request` already does.
--   · Unlike `consent_request` it does not require a confirmed address or a profile: at sign-up there is
--     neither yet. It requires the auth user to exist and to have chosen "Parent" at sign-up
--     (raw_user_meta_data.role = 'parent', written by our server route only).
--   · `parent_ack_at` is NULL: at sign-up the parent has not ticked anything on screen, and the record must not
--     claim they did.
-- Nothing else changes: no table, constraint, policy, grant or existing function is touched.

create function public.consent_request_at_signup(
  p_parent uuid, p_notice_version text, p_privacy_version text, p_terms_version text,
  p_lang text, p_token_hash text, p_ttl interval)
returns table (consent_id uuid, email text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text;
begin
  select u.email into v_email
    from auth.users u
   where u.id = p_parent
     and u.email not like '%.invalid'
     and u.raw_user_meta_data->>'role' = 'parent';
  if v_email is null then
    raise exception 'this account cannot request parental consent' using errcode = 'P0C03';
  end if;
  if not exists (select 1 from public.consent_notice_versions where version = p_notice_version) then
    raise exception 'unknown notice version %', p_notice_version using errcode = 'P0C04';
  end if;

  -- A re-sent sign-up email replaces the request it re-sends: only the newest link can grant.
  update public.parental_consents set state = 'expired'
   where parent_id = p_parent and state = 'pending';

  return query
  insert into public.parental_consents
    (parent_id, method, state, notice_version, privacy_version, terms_version, lang,
     email_address, token_hash, expires_at, scope, parent_ack_at)
  values
    (p_parent, 'email_plus', 'pending', p_notice_version, p_privacy_version, p_terms_version, p_lang,
     v_email, p_token_hash, now() + p_ttl, 'account', null)
  returning id, v_email;
end
$$;
revoke all on function public.consent_request_at_signup(uuid, text, text, text, text, text, interval) from public, anon, authenticated;
grant execute on function public.consent_request_at_signup(uuid, text, text, text, text, text, interval) to service_role;

-- Closing assertions: the file rolls itself back rather than half-apply.
do $$
begin
  if has_function_privilege('authenticated', 'public.consent_request_at_signup(uuid, text, text, text, text, text, interval)', 'execute')
     or has_function_privilege('anon', 'public.consent_request_at_signup(uuid, text, text, text, text, text, interval)', 'execute') then
    raise exception 'consent_request_at_signup is callable from the API — rolled back';
  end if;
  if not has_function_privilege('service_role', 'public.consent_request_at_signup(uuid, text, text, text, text, text, interval)', 'execute') then
    raise exception 'consent_request_at_signup is not callable by the server — rolled back';
  end if;
  if not (select prosecdef and proconfig @> array['search_path=public, pg_temp'] from pg_proc
           where oid = 'public.consent_request_at_signup(uuid, text, text, text, text, text, interval)'::regprocedure) then
    raise exception 'consent_request_at_signup: not SECURITY DEFINER with a pinned search_path — rolled back';
  end if;
end $$;
