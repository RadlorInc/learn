-- ════════════════════════════════════════════════════════════════════════════════════════════════════
-- notice-v7 — Kindergarten to Grade 2 (2026-09-28). Registers the new consent-notice version, and makes the
-- consent gate ask for it only where it matters: a child stored in a band the older notices did not name.
-- ════════════════════════════════════════════════════════════════════════════════════════════════════
--
-- THE FOUNDER'S RULE (2026-09-28, replacing "every parent re-consents"): existing families are NOT blocked. A Grade 3–8
-- child's stored band (9-11, 12-14) is exactly what notice-v1…v6 describe, so their consent stays valid
-- (`reconsent_required = false`). notice-v7 is required only for:
--   · new sign-ups and consent requests — the app sends notice-v7 (nothing here; the request routes do it);
--   · adding a child — the attestation may now name a NEWER notice than the account consent, and the app sends v7;
--   · a child in the new bands — Kindergarten (3-5) or Grades 1–2 (6-8) — whose parent agreed only to an older notice.
--     Until that parent agrees to v7, the gate refuses new records for that child, exactly as for a missing consent
--     (P0C01), and refuses creating or moving a child into those bands.
--
-- ⚠️⚠️ SECURITY — THE CHANGES, AND NOTHING ELSE (CLAUDE.md: a function definition is the live one with named lines
-- changed). Each body below is the repo's last definition, copied verbatim, with the lines marked `notice-v7 ↓` added
-- or changed:
--   · consent_ok(uuid)            — from 20260924100000. ONE predicate added (band named by the notice).
--   · enforce_learner_consent()   — from 20260924100000. INSERT: the attestation may be the consent's version OR NEWER
--                                   (was: equal); the band check. UPDATE: the band check on the new row.
--   · consent_grant(text, text, timestamptz) — from 20260926100800. The "already consented" check now requires the
--                                   current consent to be to this notice or a newer one (an older one is an upgrade).
--   · consent_request(…, p_acked boolean DEFAULT true) — from 20260924100000, DROPPED AND RECREATED (a new argument
--                                   needs it). With p_acked = false it records NO parent_ack_at: the consent email a
--                                   child's refused write sends must not claim the parent ticked "I agree" in the app.
--   SECURITY DEFINER, `SET search_path`, owner and ACL are UNCHANGED for all four (asserted below; the revoke/grant is
--   re-stated as each original did). ONE NEW function, `notice_names_band(text, text)`: SECURITY INVOKER, pinned
--   search_path, no EXECUTE for public/anon/authenticated — it only reads `consent_notice_versions`, which
--   authenticated can already read.
-- ⚠️ STOP-CHECK before applying: docs/legal/sql/notice-v7-before.sql compares production's four bodies with the repo's
--   (md5 of prosrc). Any FAIL there: do not apply.
--
-- ⚠️ DEPLOY ORDER — approve the `production-db` run AFTER production is READY on the merge commit (`promote` does not
-- wait). App first is safe: the add-a-child sheet attests against notice-v7 only once the database lists it (it
-- checks), and sign-up / the request route tolerate "unknown notice version" (P0C04). Applied FIRST, the OLD app would drop the
-- answers of a newly-refused KG / Grades 1–2 child (it classed P0C01 as "drop"; the new app queues them).
--
-- Rollback: re-apply the four bodies from 20260924100000 / 20260926100800 (consent_request: drop the 10-argument one
-- first), drop notice_names_band; the v7 row can stay.

insert into public.consent_notice_versions (version, seq, reconsent_required, note) values
  ('notice-v7', 7, false, '2026-09-28 KG-2: Kindergarten and Grades 1-2 bands (3-5, 6-8); required only for those children, new sign-ups and new children')
on conflict (version) do nothing;

-- Does notice `p_version` name the stored band `p_age_group`? notice-v1…v6 were written for Grades 3–8 only (9-11,
-- 12-14; v4–v6 say so in words). notice-v7 adds Kindergarten (3-5) and Grades 1–2 (6-8). The legacy bands 15-16 and
-- 17-18 are not stored for any child any more (their chapters were deleted 2026-09-20) and are left as they were.
create function public.notice_names_band(p_version text, p_age_group text)
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select p_age_group not in ('3-5', '6-8')
      or exists (select 1 from public.consent_notice_versions v where v.version = p_version and v.seq >= 7)
$$;
revoke all on function public.notice_names_band(text, text) from public, anon, authenticated;
grant execute on function public.notice_names_band(text, text) to service_role;

CREATE OR REPLACE FUNCTION public.consent_ok(p_learner_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists (
    select 1
      from public.learners l
      join public.parental_consents c on c.id = l.consent_id
     where l.id = p_learner_id
       and c.state = 'granted'
       and public.consent_is_current(c.notice_version)
       and l.attested_by is not null and l.attested_at is not null and l.attested_notice_version is not null
       and ((c.scope = 'account' and c.parent_id = l.created_by)
         or (c.scope = 'child'   and c.learner_id = l.id))
       -- notice-v7 ↓ the child's band is named by the notice their parent agreed to — the account consent's or the child's own attestation
       and (public.notice_names_band(c.notice_version, l.age_group) or public.notice_names_band(l.attested_notice_version, l.age_group))
  )
$function$;

revoke all on function public.consent_ok(uuid) from public, anon, authenticated;
grant execute on function public.consent_ok(uuid) to service_role;

CREATE OR REPLACE FUNCTION public.enforce_learner_consent()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  c public.parental_consents;
begin
  if tg_op = 'INSERT' then
    select * into c from public.parental_consents where id = new.consent_id;
    -- A new child needs the parent's ACCOUNT consent: granted, theirs, and current. A per-child consent
    -- can never create a child again — the per-child flow is gone, and reusing one would be a way round.
    if new.consent_id is null or not found
       or c.state <> 'granted' or c.scope <> 'account' or c.parent_id <> new.created_by
       or not public.consent_is_current(c.notice_version) then
      raise exception 'no granted parental consent for this account — refusing to create a child'
        using errcode = 'P0C01',
              hint = 'The parent must give account consent (notice, email, "I give permission") first. '
                     'Pass that consent''s id as learners.consent_id. This is not a transient failure.';
    end if;
    -- ⚠️ THE ATTESTATION IS THE CLIENT'S TO GIVE, THE DATABASE'S TO STAMP. The client sends the notice
    -- version the checkbox showed; nothing else about it is trusted. Absent, or not the version the parent
    -- agreed to, and there is no attestation — so there is no child.
    -- notice-v7 ↓ …or a NEWER notice than the account consent: the add-a-child sheet shows the current notice, so a
    -- parent who consented to v6 attests a new child against v7 (founder, 2026-09-28). Never an older or unknown one.
    if new.attested_notice_version is null or not exists (
         select 1 from public.consent_notice_versions a
           join public.consent_notice_versions cv on cv.version = c.notice_version
          where a.version = new.attested_notice_version and a.seq >= cv.seq) then
      raise exception 'no parental attestation for this child — refusing to create them'
        using errcode = 'P0C01',
              hint = 'The parent must tick "I''m this child''s parent or legal guardian" for this child; '
                     'send the account consent''s notice_version as learners.attested_notice_version.';
    end if;
    -- notice-v7 ↓ a child in a band the notice does not name (KG, Grades 1–2 before v7) is refused.
    if not (public.notice_names_band(c.notice_version, new.age_group)
            or public.notice_names_band(new.attested_notice_version, new.age_group)) then
      raise exception 'the notice this parent agreed to does not name this child''s grade band — refusing to create them'
        using errcode = 'P0C01',
              hint = 'Kindergarten and Grades 1–2 (3-5, 6-8) are named from notice-v7: attest against it, or re-consent.';
    end if;
    new.attested_by        := new.created_by;   -- RLS "learners: insert" already pins created_by = auth.uid()
    new.attested_at        := now();
    new.attestation_method := 'checkbox';
  else
    -- UPDATE: every child needs live consent; withdrawing it freezes the row (withdrawal deletes it).
    -- ⚠️ JUDGED ON THE NEW ROW, NOT THE STORED ONE. consent_ok(new.id) re-reads the table, which in a BEFORE
    -- UPDATE still holds the OLD consent_id — so the re-consent path (consent_grant moving the children onto
    -- the new, current consent) was refused and rolled back, freezing every parent with children the day a
    -- notice version is marked reconsent_required. Found by the test suite's probe, 2026-09-24.
    select * into c from public.parental_consents where id = new.consent_id;
    if not found or c.state <> 'granted' or not public.consent_is_current(c.notice_version)
       or not ((c.scope = 'account' and c.parent_id = new.created_by)
            or (c.scope = 'child'   and c.learner_id = new.id)) then
      raise exception 'no granted parental consent for learner % — refusing to change their record', new.id
        using errcode = 'P0C01',
              hint = 'This is not a transient failure.';
    end if;
    -- notice-v7 ↓ judged on the NEW row too: a child moved into (or already in) a band their notice does not name.
    if not (public.notice_names_band(c.notice_version, new.age_group)
            or public.notice_names_band(new.attested_notice_version, new.age_group)) then
      raise exception 'the notice this parent agreed to does not name learner %''s grade band — refusing to change their record', new.id
        using errcode = 'P0C01',
              hint = 'Kindergarten and Grades 1–2 (3-5, 6-8) are named from notice-v7: the parent re-consents on it.';
    end if;
    if new.attested_by is distinct from old.attested_by
       or new.attested_at is distinct from old.attested_at
       or new.attested_notice_version is distinct from old.attested_notice_version
       or new.attestation_method is distinct from old.attestation_method then
      raise exception 'a child''s parental attestation is fixed once recorded' using errcode = 'P0C02';
    end if;
  end if;
  return new;
end
$function$;

revoke all on function public.enforce_learner_consent() from public, anon, authenticated;

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
                  and public.consent_is_current(o.notice_version)
                  -- notice-v7 ↓ …to this notice or a newer one. A consent to a NEWER notice than the current one is an
                  -- upgrade (a v6 parent agreeing to v7 for a KG child): granted below, children moved, v6 closed.
                  and (select seq from public.consent_notice_versions where version = o.notice_version)
                   >= (select seq from public.consent_notice_versions where version = r.notice_version)) then
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

-- consent_request — from 20260924100000, + `p_acked boolean default true`. A changed argument list needs a drop; every
-- existing caller omits it and gets exactly the old behaviour. ONE body line changed (parent_ack_at).
drop function public.consent_request(uuid, text, text, text, text, text, interval, text, timestamptz);
create or replace function public.consent_request(
  p_parent uuid, p_notice_version text, p_privacy_version text, p_terms_version text,
  p_lang text, p_token_hash text, p_ttl interval, p_scope text, p_ack_at timestamptz,
  p_acked boolean default true)   -- notice-v7 ↓ false: the parent acknowledged nothing in the app (a child's refused write asked)
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
    (p_parent, 'email_plus', 'pending', p_notice_version, p_privacy_version, p_terms_version, p_lang,
     v_email, p_token_hash, now() + p_ttl, 'account', case when p_acked then coalesce(p_ack_at, now()) end)   -- notice-v7: was coalesce(p_ack_at, now())
  returning id, v_email;
end
$$;

revoke all on function public.consent_request(uuid, text, text, text, text, text, interval, text, timestamptz, boolean) from public, anon, authenticated;
grant execute on function public.consent_request(uuid, text, text, text, text, text, interval, text, timestamptz, boolean) to service_role;

-- Closing assertions: the file rolls itself back rather than half-apply.
do $$
declare f record;
begin
  if not exists (select 1 from public.consent_notice_versions where version = 'notice-v7' and seq = 7 and not reconsent_required) then
    raise exception 'notice-v7: not registered as expected — rolled back';
  end if;
  -- Existing families are not blocked: a notice-v6 consent stays current.
  if not public.consent_is_current('notice-v6') then
    raise exception 'notice-v7: made notice-v6 consents non-current — rolled back';
  end if;
  if not public.notice_names_band('notice-v6', '9-11') or not public.notice_names_band('notice-v6', '12-14')
     or public.notice_names_band('notice-v6', '3-5') or public.notice_names_band('notice-v6', '6-8')
     or not public.notice_names_band('notice-v7', '3-5') or not public.notice_names_band('notice-v7', '6-8') then
    raise exception 'notice-v7: notice_names_band does not answer as intended — rolled back';
  end if;
  for f in select p.oid::regprocedure::text as fn, p.prosecdef, p.proconfig from pg_proc p
            where p.oid in ('public.consent_ok(uuid)'::regprocedure, 'public.enforce_learner_consent()'::regprocedure,
                            'public.consent_grant(text, text, timestamptz)'::regprocedure,
                            'public.consent_request(uuid, text, text, text, text, text, interval, text, timestamptz, boolean)'::regprocedure) loop
    if not f.prosecdef or not exists (select 1 from unnest(f.proconfig) c where c like 'search_path=%') then
      raise exception 'notice-v7: % lost SECURITY DEFINER or its search_path — rolled back', f.fn;
    end if;
  end loop;
  if has_function_privilege('anon', 'public.consent_request(uuid, text, text, text, text, text, interval, text, timestamptz, boolean)', 'execute')
     or has_function_privilege('authenticated', 'public.consent_request(uuid, text, text, text, text, text, interval, text, timestamptz, boolean)', 'execute') then
    raise exception 'notice-v7: consent_request is callable from the API — rolled back';
  end if;
  if (select prosecdef from pg_proc where oid = 'public.notice_names_band(text, text)'::regprocedure) then
    raise exception 'notice-v7: notice_names_band must not be SECURITY DEFINER — rolled back';
  end if;
  if has_function_privilege('anon', 'public.notice_names_band(text, text)', 'execute')
     or has_function_privilege('authenticated', 'public.notice_names_band(text, text)', 'execute') then
    raise exception 'notice-v7: notice_names_band is callable from the API — rolled back';
  end if;
  if pg_get_functiondef('public.consent_ok(uuid)'::regprocedure) !~ 'notice_names_band'
     or pg_get_functiondef('public.enforce_learner_consent()'::regprocedure) !~ 'notice_names_band'
     or pg_get_functiondef('public.consent_grant(text, text, timestamptz)'::regprocedure) !~ '>= \(select seq' then
    raise exception 'notice-v7: a gate function does not carry its change — rolled back';
  end if;
end $$;
