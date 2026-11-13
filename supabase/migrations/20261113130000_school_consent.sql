-- School consent: a teacher can add students again (founder, 13 Nov 2026).
--
-- ⚠️ SECURITY CHANGE: ONE NEW SECURITY DEFINER FUNCTION, `consent_grant_school`, with `SET search_path` pinned,
-- EXECUTE for service_role only (revoked from public, anon, authenticated). Only the server route
-- /api/consent/school calls it, with the caller's id taken from their own token. It writes the evidence table
-- `parental_consents`, which no client can write (20260923120000 §RLS).
--
-- What it records: a teacher's statement that their school authorised them to add their students and agreed for
-- their parents — the "school as the parent's agent, for school use only" route COPPA allows (attorney item A3:
-- the attorney confirms the wording before this is relied on). It is an ACCOUNT consent of a new method,
-- 'school_official', granted at once, naming the school. Nothing else changes: the learner gate
-- (enforce_learner_consent / consent_ok) already accepts any granted, current ACCOUNT consent whose parent_id is the
-- child's creator, so every rule about attestation, notice bands, withdrawal and deletion applies unchanged.
--
-- ⚠️ KNOWN LIMIT: `profiles.role` is a label its owner can write (architecture §3), so the role check below is a
-- product rule, not a boundary: an adult who sets their own role to teacher can state a school consent instead of
-- completing email-plus. That adult makes a false legal statement, recorded with the school's name and the time.
-- The attorney decides whether that is acceptable (A3).
--
-- Deploy order: either. The app asks for this only through /api/consent/school, which answers "not_ready" while the
-- function is missing (PGRST202). Rollback: drop the function; rows already written stay as evidence (the method check
-- must then keep 'school_official').

alter table public.parental_consents drop constraint if exists parental_consents_method_check;
alter table public.parental_consents add constraint parental_consents_method_check
  check (method in ('payment_card', 'email_plus', 'school_official'));

alter table public.parental_consents add column if not exists school_name text;
comment on column public.parental_consents.school_name is
  'school_official only: the school the teacher said authorised them, as they typed it.';

-- A school consent names its school, covers the account (never one child), and is granted when it is written.
alter table public.parental_consents drop constraint if exists parental_consents_school_shape;
alter table public.parental_consents add constraint parental_consents_school_shape
  check (method <> 'school_official'
         or (school_name is not null and length(btrim(school_name)) between 2 and 120
             and scope = 'account' and parent_ack_at is not null));

create function public.consent_grant_school(
  p_teacher uuid, p_school_name text, p_notice_version text, p_privacy_version text, p_terms_version text, p_lang text
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_school text := btrim(coalesce(p_school_name, ''));
  v_id     uuid;
begin
  -- The same eligibility as consent_request: a confirmed adult address (not a child login), here a teacher.
  if not exists (
    select 1 from auth.users u join public.profiles p on p.id = u.id
     where u.id = p_teacher and u.email_confirmed_at is not null and u.email not like '%.invalid' and p.role = 'teacher'
  ) then
    raise exception 'this account cannot give school consent' using errcode = 'P0C03';
  end if;
  if length(v_school) < 2 or length(v_school) > 120 then
    raise exception 'a school name of 2 to 120 characters is required' using errcode = '22023';
  end if;
  if not exists (select 1 from public.consent_notice_versions where version = p_notice_version) then
    raise exception 'unknown notice version %', p_notice_version using errcode = 'P0C04';
  end if;
  -- One granted, current account consent is enough: asking twice returns it rather than stacking rows.
  select c.id into v_id from public.parental_consents c
   where c.parent_id = p_teacher and c.scope = 'account' and c.state = 'granted'
     and public.consent_is_current(c.notice_version)
   order by c.confirmed_at desc limit 1;
  if v_id is not null then return v_id; end if;

  insert into public.parental_consents
    (parent_id, method, state, scope, notice_version, privacy_version, terms_version, lang,
     confirmed_at, parent_ack_at, school_name)
  values
    (p_teacher, 'school_official', 'granted', 'account', p_notice_version, p_privacy_version, p_terms_version,
     case when p_lang = 'es' then 'es' else 'en' end, now(), now(), v_school)
  returning id into v_id;
  return v_id;
end
$$;

revoke all on function public.consent_grant_school(uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.consent_grant_school(uuid, text, text, text, text, text) to service_role;
