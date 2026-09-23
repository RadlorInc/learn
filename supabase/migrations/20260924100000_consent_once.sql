-- ═══════════════════════════════════════════════════════════════════════════════════════════════
-- CONSENT ONCE: ONE VERIFIABLE (EMAIL-PLUS) CONSENT PER PARENT ACCOUNT, AND A PARENTAL ATTESTATION
-- ON EVERY CHILD. Design: docs/legal/LOOP-STATE.md → "Consent-once" → C0.
--
-- ⚠️ DEPLOY ORDER — CLIENT AND MIGRATION SHIP IN ONE PR. Merging deploys the client at once; this file
-- waits for the production-db approval. In that gap (minutes) the new client asks for an ACCOUNT
-- consent the old schema cannot record (PGRST202 → "not ready"), so adding a child is refused until
-- this is applied. After it is applied, an old bundle cannot create a child (no attestation → P0C01).
-- Every account on production is a test account (founder's statement), so the gap is accepted.
--
-- ⚠️ THE PROMISE THIS FILE MUST KEEP (founder's rule 2, enforced below and asserted at the end):
-- no child row and no child data can exist unless the child's consent is `granted` and CURRENT —
-- an ACCOUNT consent of the child's parent (or, for a child that already existed, the per-child
-- consent bound to exactly that child) — AND the child carries a recorded parental attestation.
-- `learners.consent_id` stays NOT NULL. If the assertions at the end fail, the whole file rolls back.
--
-- ⚠️ SECURITY. Functions modified here were copied from their latest definitions in this repo and
-- changed only where a comment says CHANGED. New SECURITY DEFINER functions: consent_withdraw_account and
-- withdraw_my_consent (consent_is_current is INVOKER: it reads a table authenticated may read) — each pins search_path and revokes from PUBLIC/anon;
-- only withdraw_my_consent is granted (to authenticated, and it acts only on auth.uid()). No existing
-- function gains or loses SECURITY DEFINER.
-- ═══════════════════════════════════════════════════════════════════════════════════════════════

-- ── 1. The record: a scope, and when the parent ticked ──────────────────────────────────────────
alter table public.parental_consents
  add column if not exists scope text not null default 'child',
  add column if not exists parent_ack_at timestamptz;
alter table public.parental_consents drop constraint if exists parental_consents_scope_check;
alter table public.parental_consents add constraint parental_consents_scope_check
  check (scope in ('child', 'account'));
-- An account consent never names a child: it covers every child the parent adds.
alter table public.parental_consents drop constraint if exists parental_consents_account_has_no_child;
alter table public.parental_consents add constraint parental_consents_account_has_no_child
  check (scope <> 'account' or learner_id is null);
comment on column public.parental_consents.scope is
  '''child'': the pre-2026-09-24 flow, one consent for one child (bound in learner_id). ''account'': '
  'one consent covering every child the parent adds; each child then carries its own attestation.';
comment on column public.parental_consents.parent_ack_at is
  'When the parent ticked "I''m a parent or legal guardian, I''ve read what we collect, and I agree" '
  'for this consent''s notice_version — on the signup page (possibly before the account existed) or in the app.';

-- ── 2. Which notice versions exist, and which ones require asking again ───────────────────────────
create table if not exists public.consent_notice_versions (
  version            text primary key,
  seq                integer not null unique,
  reconsent_required boolean not null default false,
  note               text
);
alter table public.consent_notice_versions enable row level security;
revoke all on public.consent_notice_versions from public, anon, authenticated;
grant select on public.consent_notice_versions to authenticated, service_role;
create policy "consent_notice_versions: readable" on public.consent_notice_versions
  for select to authenticated using (true);

-- ⚠️ NONE REQUIRES RE-CONSENT: the founder's instruction for this loop (every account is a test
-- account). Marking a row `true` later makes every consent to an older version non-current.
insert into public.consent_notice_versions (version, seq, reconsent_required, note) values
  ('notice-v1', 1, false, '2026-09-23 first approved'),
  ('notice-v2', 2, false, '2026-09-23 v4 export'),
  ('notice-v3', 3, false, '2026-09-23 D1: withdrawal deletes that child'),
  ('notice-v4', 4, false, '2026-09-24 R2: lessons + grade band'),
  ('notice-v5', 5, false, '2026-09-24 consent-once: one permission covers every child')
on conflict (version) do nothing;

/** A consent is current when its version is known and no LATER version demands asking again. */
create or replace function public.consent_is_current(p_version text)
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.consent_notice_versions v where v.version = p_version)
     and not exists (
       select 1 from public.consent_notice_versions r
         join public.consent_notice_versions v on v.version = p_version
        where r.reconsent_required and r.seq > v.seq)
$$;
revoke all on function public.consent_is_current(text) from public, anon, authenticated;
grant execute on function public.consent_is_current(text) to authenticated, service_role;

-- ── 3. The attestation, on the child row: impossible to be missing, exported and deleted with it ──
alter table public.learners
  add column if not exists attested_by uuid,
  add column if not exists attested_at timestamptz,
  add column if not exists attested_notice_version text,
  add column if not exists attestation_method text;
alter table public.learners drop constraint if exists learners_attestation_method_check;
alter table public.learners add constraint learners_attestation_method_check
  check (attestation_method in ('checkbox', 'per_child_consent'));

-- ⚠️ THE DATA MIGRATION. Children that exist now were each created under their own per-child email-plus
-- consent (D6 left none without one). That consent IS the parent's statement about that child, made
-- through the stronger method, so it is recorded as the child's attestation — from the consent's own
-- fields, nothing invented: who (the consent's parent = the child's creator), when (confirmed_at), and
-- the notice version they read. `attestation_method` says which route it came from.
update public.learners l
   set attested_by             = c.parent_id,
       attested_at             = c.confirmed_at,
       attested_notice_version = c.notice_version,
       attestation_method      = 'per_child_consent'
  from public.parental_consents c
 where c.id = l.consent_id and c.scope = 'child' and c.state = 'granted'
   and l.attested_by is null;

-- If any child did not get one above, these fail and the file rolls back — nothing is invented for it.
alter table public.learners
  alter column attested_by set not null,
  alter column attested_at set not null,
  alter column attested_notice_version set not null,
  alter column attestation_method set not null;

-- Many children now share one account consent, so "one consent, one child" can no longer be a unique
-- index. It stays true for the per-child scope, enforced by the gate below.
drop index if exists public.learners_consent_id_unique;

-- ── 4. The gate ─────────────────────────────────────────────────────────────────────────────────
-- Copied from 20260923170000. CHANGED: the whole predicate (scope, current, attestation) — was only
-- `c.state = 'granted'`.
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
  )
$function$;

-- Copied from 20260923170000. CHANGED: the INSERT branch (account scope, current, attestation, and the
-- trigger stamps who/when/how); the UPDATE branch adds "the attestation cannot be rewritten".
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
    if new.attested_notice_version is null or new.attested_notice_version <> c.notice_version then
      raise exception 'no parental attestation for this child — refusing to create them'
        using errcode = 'P0C01',
              hint = 'The parent must tick "I''m this child''s parent or legal guardian" for this child; '
                     'send the account consent''s notice_version as learners.attested_notice_version.';
    end if;
    new.attested_by        := new.created_by;   -- RLS "learners: insert" already pins created_by = auth.uid()
    new.attested_at        := now();
    new.attestation_method := 'checkbox';
  else
    -- UPDATE: every child needs live consent; withdrawing it freezes the row (withdrawal deletes it).
    if not public.consent_ok(new.id) then
      raise exception 'no granted parental consent for learner % — refusing to change their record', new.id
        using errcode = 'P0C01',
              hint = 'This is not a transient failure.';
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

-- Copied from 20260923120000. CHANGED: `and scope = 'child'` — an account consent is never bound to one child.
create or replace function public.consent_bind_learner()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.consent_id is not null then
    update public.parental_consents
       set learner_id = new.id
     where id = new.consent_id and learner_id is null and scope = 'child';
  end if;
  return new;
end
$$;

-- Copied from 20260923140000. CHANGED: `scope` and `parent_ack_at` join the fields fixed once recorded.
create or replace function public.consent_guard_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.parent_id       is distinct from old.parent_id
  or new.method          is distinct from old.method
  or new.notice_version  is distinct from old.notice_version
  or new.privacy_version is distinct from old.privacy_version
  or new.terms_version   is distinct from old.terms_version
  or new.lang            is distinct from old.lang
  or new.email_address   is distinct from old.email_address
  or new.requested_at    is distinct from old.requested_at
  or new.token_hash      is distinct from old.token_hash
  or new.expires_at      is distinct from old.expires_at
  or new.scope           is distinct from old.scope           -- CHANGED
  or new.parent_ack_at   is distinct from old.parent_ack_at then -- CHANGED
    raise exception 'a parental consent''s identity, versions and address are fixed once recorded'
      using errcode = 'P0C02';
  end if;

  if old.learner_id is not null and new.learner_id is distinct from old.learner_id
     and not (new.learner_id is null
              and not exists (select 1 from public.learners l where l.id = old.learner_id)) then
    raise exception 'a parental consent cannot be moved to a different child' using errcode = 'P0C02';
  end if;

  if new.state is distinct from old.state and not (
       (old.state = 'pending' and new.state in ('granted', 'declined', 'expired'))
    or (old.state = 'granted' and new.state = 'withdrawn')
  ) then
    raise exception 'parental consent cannot move from % to %', old.state, new.state
      using errcode = 'P0C02';
  end if;
  return new;
end
$$;
revoke all on function public.consent_guard_update() from public, anon, authenticated;

-- ── 5. Asking: account scope, the tick, the version must be known ─────────────────────────────────
-- Replaces consent_request(uuid,text,text,text,text,text,interval) from 20260923130000. The body is that
-- one's; CHANGED: two parameters (p_scope, p_ack_at), the version check (P0C04), and the older pending
-- ACCOUNT requests are expired so only the newest email's link can grant.
drop function if exists public.consent_request(uuid, text, text, text, text, text, interval);
create or replace function public.consent_request(
  p_parent uuid, p_notice_version text, p_privacy_version text, p_terms_version text,
  p_lang text, p_token_hash text, p_ttl interval, p_scope text, p_ack_at timestamptz)
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

  update public.parental_consents set state = 'expired'                                   -- CHANGED
   where parent_id = p_parent and scope = 'account' and state = 'pending';

  return query
  insert into public.parental_consents
    (parent_id, method, state, notice_version, privacy_version, terms_version, lang,
     email_address, token_hash, expires_at, scope, parent_ack_at)
  values
    (p_parent, 'email_plus', 'pending', p_notice_version, p_privacy_version, p_terms_version, p_lang,
     v_email, p_token_hash, now() + p_ttl, 'account', coalesce(p_ack_at, now()))
  returning id, v_email;
end
$$;
revoke all on function public.consent_request(uuid, text, text, text, text, text, interval, text, timestamptz) from public, anon, authenticated;
grant execute on function public.consent_request(uuid, text, text, text, text, text, interval, text, timestamptz) to service_role;

-- ── 6. What a token points at: the scope joins the answer (a changed return type needs a drop) ─────
-- Copied from 20260923130000. CHANGED: `scope` added to the result.
drop function if exists public.consent_lookup(text);
create function public.consent_lookup(p_token_hash text)
returns table (consent_id uuid, state text, lang text, expired boolean, email text,
               learner_id uuid, second_email_provider_id text, second_notice_scheduled_for timestamptz,
               scope text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select c.id, c.state, c.lang, (c.state = 'pending' and c.expires_at <= now()), c.email_address,
         c.learner_id, c.second_email_provider_id, c.second_notice_scheduled_for, c.scope
    from public.parental_consents c
   where c.token_hash = p_token_hash;
$$;
revoke all on function public.consent_lookup(text) from public, anon, authenticated;
grant execute on function public.consent_lookup(text) to service_role;

-- ── 7. Granting: one current account consent at a time; a re-consent carries the children over ────
-- Copied from 20260923130000. CHANGED: the block marked CHANGED before the final update.
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

-- ── 8. Withdrawing the whole account ──────────────────────────────────────────────────────────────
/**
 * Every child the parent created is deleted (delete_child_data: the child's rows, their own login, and a
 * per-child consent bound to them → withdrawn); every consent the parent still holds `granted` →
 * withdrawn (R3's trigger queues each future B3 for cancelling); every pending request → expired, so an
 * old B1 in the inbox cannot re-grant. The consent RECORDS stay — withdrawn, with learner_id cleared
 * by the child's deletion — as the evidence. The account itself stays open, with no children.
 * Idempotent: a second call finds nothing to delete or end.
 * Internal: reachable only through consent_withdraw (the B3 link) and withdraw_my_consent (the app).
 */
create or replace function public.consent_withdraw_account(p_parent uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  k uuid;
begin
  for k in select id from public.learners where created_by = p_parent loop
    perform public.delete_child_data(k);
  end loop;
  update public.parental_consents set state = 'withdrawn', withdrawn_at = now()
   where parent_id = p_parent and state = 'granted';
  update public.parental_consents set state = 'expired'
   where parent_id = p_parent and state = 'pending';
end
$$;
revoke all on function public.consent_withdraw_account(uuid) from public, anon, authenticated, service_role;

-- Copied from 20260923140000. CHANGED: an ACCOUNT consent's link withdraws the whole account.
create or replace function public.consent_withdraw(p_token_hash text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r public.parental_consents;
begin
  select * into r from public.parental_consents where token_hash = p_token_hash for update;
  if not found then return 'unknown'; end if;
  if r.state <> 'granted' then return r.state; end if;
  if r.scope = 'account' then                                   -- CHANGED
    perform public.consent_withdraw_account(r.parent_id);       -- CHANGED
    return 'withdrawn';                                         -- CHANGED
  end if;                                                       -- CHANGED
  update public.parental_consents set state = 'withdrawn', withdrawn_at = now() where id = r.id;
  if r.learner_id is not null then perform public.delete_child_data(r.learner_id); end if;
  return 'withdrawn';
end
$$;

/** Account → "Withdraw permission for all my children". Acts only on the signed-in adult. */
create or replace function public.withdraw_my_consent()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  perform public.consent_withdraw_account(auth.uid());
  return 'withdrawn';
end
$$;
revoke all on function public.withdraw_my_consent() from public, anon;
grant execute on function public.withdraw_my_consent() to authenticated;

-- ── 9. THE ASSERTIONS. Any failure rolls back everything above. ──────────────────────────────────
do $$
declare
  n int;
begin
  -- Rule 2 over every child that exists: the same predicate the gate uses.
  select count(*) into n from public.learners l where not public.consent_ok(l.id);
  if n > 0 then raise exception 'consent-once: % child(ren) would fail the gate — rolled back', n; end if;

  select count(*) into n from public.learners
   where consent_id is null or attested_by is null or attested_at is null
      or attested_notice_version is null or attestation_method is null;
  if n > 0 then raise exception 'consent-once: % child(ren) without consent or attestation — rolled back', n; end if;

  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'learners'
                    and column_name = 'consent_id' and is_nullable = 'NO') then
    raise exception 'consent-once: learners.consent_id is nullable — rolled back';
  end if;

  select count(*) into n from public.parental_consents where scope = 'account' and learner_id is not null;
  if n > 0 then raise exception 'consent-once: an account consent names a child — rolled back'; end if;

  -- The gate is still attached everywhere it was (14 child tables + learners).
  select count(*) into n from pg_trigger where tgname = 'trg_enforce_child_consent' and not tgisinternal;
  if n < 14 then raise exception 'consent-once: child-data gate on only % tables — rolled back', n; end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_enforce_learner_consent'
                  and tgrelid = 'public.learners'::regclass) then
    raise exception 'consent-once: learners gate missing — rolled back';
  end if;

  -- The notice the app ships must be requestable.
  if not exists (select 1 from public.consent_notice_versions where version = 'notice-v5') then
    raise exception 'consent-once: notice-v5 not registered — rolled back';
  end if;

  -- No DEFINER function added here is callable by anon; the internal one by nobody but its callers.
  if has_function_privilege('anon', 'public.withdraw_my_consent()', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.consent_withdraw_account(uuid)', 'EXECUTE')
     or has_function_privilege('service_role', 'public.consent_withdraw_account(uuid)', 'EXECUTE')
     or has_function_privilege('anon', 'public.consent_request(uuid,text,text,text,text,text,interval,text,timestamptz)', 'EXECUTE') then
    raise exception 'consent-once: a function is reachable by a role that must not reach it — rolled back';
  end if;
end $$;
