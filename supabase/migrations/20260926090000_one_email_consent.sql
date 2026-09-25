-- ════════════════════════════════════════════════════════════════════════════════════════════════════
-- ONE EMAIL: consent without the second email ("B3"), and consent requested in the sign-up email itself.
-- Founder's call, 2026-09-25 — after being told, in writing, that this leaves COPPA's "email plus" method (the
-- plus IS the delayed second email) and that verifiable consent may then not stand; see ATTORNEY-PACKET.md A4.
-- ════════════════════════════════════════════════════════════════════════════════════════════════════
--
-- ⚠️⚠️ DEPLOY ORDER — APPLY THIS BEFORE THE APP THAT USES IT. The app tolerates a database without it (it falls
-- back to scheduling the second email and to the old separate emails), so the order that breaks nothing is:
-- merge → approve the `production-db` run for THIS file → promote to `release`.
--
-- WHAT CHANGES
--   1. A new consent METHOD, 'email': one email the parent answers; no second email. Rows already written keep
--      'email_plus' and their evidence; the email-plus constraints still bind them. Every constraint that
--      describes the request (address, token, request sent) now binds 'email' too. The second-email constraint
--      stays 'email_plus'-only — that is the change.
--   2. Requests still PENDING are moved to 'email' — otherwise a parent who opened B1 before this deploy could
--      not grant (their grant would need a B3 the app no longer schedules).
--   3. consent_request inserts 'email' instead of 'email_plus'. Copied from pg_get_functiondef on a database
--      built from every migration; the ONE line changed is marked. Posture unchanged: SECURITY DEFINER, pinned
--      search_path, service_role only (restated below).
--   4. NEW consent_request_at_signup — the email/password sign-up asks for consent in the confirmation email,
--      i.e. BEFORE the address is confirmed and before a profile exists.
--      ⚠️ SECURITY: a new SECURITY DEFINER function. It is callable by service_role only (revoked from public,
--      anon, authenticated below), and it can only create a PENDING request — granting still needs the token
--      from the email, so creating one proves nothing and grants nothing. It requires the auth user to exist
--      and to have chosen "Parent" at sign-up (raw_user_meta_data.role = 'parent', written by our server route).
--      `parent_ack_at` is left NULL: at sign-up the parent has not ticked anything on screen, and the record
--      must not claim they did.
--   5. notice-v7: document 02 no longer promises a second email. reconsent_required = false (the collection and
--      the uses did not change; whether dropping the second email is material is ATTORNEY-PACKET A4).

-- 1 · the method
alter table public.parental_consents drop constraint parental_consents_method_check;
alter table public.parental_consents add constraint parental_consents_method_check
  check (method = any (array['payment_card'::text, 'email_plus'::text, 'email'::text]));

alter table public.parental_consents drop constraint parental_consents_email_plus_has_address;
alter table public.parental_consents add constraint parental_consents_email_plus_has_address
  check (method not in ('email_plus', 'email') or email_address is not null);
alter table public.parental_consents drop constraint parental_consents_email_plus_request_sent;
alter table public.parental_consents add constraint parental_consents_email_plus_request_sent
  check (method not in ('email_plus', 'email') or confirmed_at is null or request_email_provider_id is not null);
alter table public.parental_consents drop constraint parental_consents_email_plus_token;
alter table public.parental_consents add constraint parental_consents_email_plus_token
  check (method not in ('email_plus', 'email') or (token_hash is not null and expires_at is not null));
-- parental_consents_email_plus_second_notice: deliberately untouched ('email_plus' only).

-- 2 · open requests move to the new method
update public.parental_consents set method = 'email' where method = 'email_plus' and state = 'pending';

-- 3 · consent_request — CHANGED: 'email_plus' → 'email' in the insert (one line)
CREATE OR REPLACE FUNCTION public.consent_request(p_parent uuid, p_notice_version text, p_privacy_version text, p_terms_version text, p_lang text, p_token_hash text, p_ttl interval, p_scope text, p_ack_at timestamp with time zone)
 RETURNS TABLE(consent_id uuid, email text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_email text;
begin
  select u.email into v_email
    from auth.users u
    join public.profiles p on p.id = u.id
   where u.id = p_parent
     and u.email_confirmed_at is not null
     and u.email not like '%.invalid'
     and p.role in ('parent', 'teacher');
  if v_email is null then
    raise exception 'this account cannot request parental consent' using errcode = 'P0C03';
  end if;
  if p_scope is distinct from 'account' then                                              -- CHANGED
    raise exception 'only account consent can be requested' using errcode = 'P0C04';
  end if;
  if not exists (select 1 from public.consent_notice_versions where version = p_notice_version) then -- CHANGED
    raise exception 'unknown notice version %', p_notice_version using errcode = 'P0C04';
  end if;

  -- Every older pending request of this parent — per-child ones too: an old per-child B1 could otherwise still
  -- be granted, creating nothing and scheduling a B3 that says "you gave permission".
  update public.parental_consents set state = 'expired'                                   -- CHANGED
   where parent_id = p_parent and state = 'pending';

  return query
  insert into public.parental_consents
    (parent_id, method, state, notice_version, privacy_version, terms_version, lang,
     email_address, token_hash, expires_at, scope, parent_ack_at)
  values
    (p_parent, 'email', 'pending', p_notice_version, p_privacy_version, p_terms_version, p_lang,
     v_email, p_token_hash, now() + p_ttl, 'account', coalesce(p_ack_at, now()))
  returning id, v_email;
end
$function$;

revoke all on function public.consent_request(uuid, text, text, text, text, text, interval, text, timestamptz) from public, anon, authenticated;
grant execute on function public.consent_request(uuid, text, text, text, text, text, interval, text, timestamptz) to service_role;

-- 4 · consent_request_at_signup — NEW
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
    (p_parent, 'email', 'pending', p_notice_version, p_privacy_version, p_terms_version, p_lang,
     v_email, p_token_hash, now() + p_ttl, 'account', null)
  returning id, v_email;
end
$$;
revoke all on function public.consent_request_at_signup(uuid, text, text, text, text, text, interval) from public, anon, authenticated;
grant execute on function public.consent_request_at_signup(uuid, text, text, text, text, text, interval) to service_role;

-- 5 · notice-v7
insert into public.consent_notice_versions (version, seq, reconsent_required, note) values
  ('notice-v7', 7, false, '2026-09-25 one email: no second confirmation email')
on conflict (version) do nothing;

-- Closing assertions: the file rolls itself back rather than half-apply.
do $$
begin
  if exists (select 1 from public.parental_consents where method = 'email_plus' and state = 'pending') then
    raise exception 'one-email: a pending email_plus request is left — rolled back';
  end if;
  if not public.consent_is_current('notice-v6') or not public.consent_is_current('notice-v7') then
    raise exception 'one-email: notice-v6 or notice-v7 is not current — rolled back';
  end if;
  if has_function_privilege('authenticated', 'public.consent_request_at_signup(uuid, text, text, text, text, text, interval)', 'execute')
     or has_function_privilege('anon', 'public.consent_request_at_signup(uuid, text, text, text, text, text, interval)', 'execute') then
    raise exception 'one-email: consent_request_at_signup is callable from the API — rolled back';
  end if;
end $$;
