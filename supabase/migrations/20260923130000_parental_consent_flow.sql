-- ═══════════════════════════════════════════════════════════════════════════════════════════════
-- EMAIL-PLUS: THE TRANSITIONS, AND A STATE MACHINE THE DATABASE ENFORCES.
--
-- ⚠️ DEPLOY ORDER — CLIENT FIRST. The app's consent flow detects this schema and uses it; without it
-- the app falls back to adding a child the old way. So the client can ship first and is harmless
-- until this lands, and this must NOT land before the client, or no new child can be created at all
-- (20260923120000's gate refuses any child without a granted consent, and this file holds the only
-- functions that can produce one).
--
-- ⚠️ AND IT NEEDS TWO SERVER SECRETS PRESENT BEFORE IT IS USEFUL: `RESEND_API_KEY` (a sending key for
-- radlor.com) and `SUPABASE_SERVICE_ROLE_KEY`. Confirm both on the RUNNING deployment first.
--
-- Every function here is callable by service_role ONLY. A browser cannot reach any of them: the
-- request is made by a server route that has verified the parent's session, and the grant, decline
-- and withdraw actions are made by a server route that holds the emailed token. The token is the
-- credential for those three, which is why it is 32 random bytes and only its hash is stored.
-- ═══════════════════════════════════════════════════════════════════════════════════════════════

-- ── 1. The shape of a consent row may only change in the directions that mean something ─────────
create or replace function public.consent_guard_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  -- ⚠️ WHAT THE PARENT SAW IS FIXED AT THE MOMENT THEY SAW IT. If the notice changes between the
  -- request email and the click, the record must still say which one they read — so no later write,
  -- by any role, may touch these. A structure, not a convention: nothing to remember at grant time.
  if new.parent_id       is distinct from old.parent_id
  or new.method          is distinct from old.method
  or new.notice_version  is distinct from old.notice_version
  or new.privacy_version is distinct from old.privacy_version
  or new.terms_version   is distinct from old.terms_version
  or new.lang            is distinct from old.lang
  or new.email_address   is distinct from old.email_address
  or new.requested_at    is distinct from old.requested_at
  or new.token_hash      is distinct from old.token_hash
  or new.expires_at      is distinct from old.expires_at then
    raise exception 'a parental consent''s identity, versions and address are fixed once recorded'
      using errcode = 'P0C02';
  end if;

  -- The child it covers is written once, by consent_bind_learner, and never re-pointed.
  if old.learner_id is not null and new.learner_id is distinct from old.learner_id then
    raise exception 'a parental consent cannot be moved to a different child' using errcode = 'P0C02';
  end if;

  -- The only moves that mean something. declined, withdrawn and expired are terminal: a withdrawn
  -- consent re-granted by a later write would silently undo the one action a parent is promised.
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

create trigger trg_consent_guard_update
  before update on public.parental_consents
  for each row execute function public.consent_guard_update();

-- ── 2. Request — the notice has been shown and the parent pressed "continue" ────────────────────
/**
 * The address is READ HERE, from auth.users, never taken from the caller: the email must reach the
 * account holder, and an address supplied by the browser could be anyone's — including a child's.
 * A child's own login (the synthetic `@learner.adaptivelearn.invalid` accounts) cannot ask either:
 * only a profile whose role is parent or teacher can, and the address must be a confirmed one.
 */
create or replace function public.consent_request(
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
    join public.profiles p on p.id = u.id
   where u.id = p_parent
     and u.email_confirmed_at is not null
     and u.email not like '%.invalid'
     and p.role in ('parent', 'teacher');
  if v_email is null then
    raise exception 'this account cannot request parental consent' using errcode = 'P0C03';
  end if;

  return query
  insert into public.parental_consents
    (parent_id, method, state, notice_version, privacy_version, terms_version, lang,
     email_address, token_hash, expires_at)
  values
    (p_parent, 'email_plus', 'pending', p_notice_version, p_privacy_version, p_terms_version, p_lang,
     v_email, p_token_hash, now() + p_ttl)
  returning id, v_email;
end
$$;

/** B1 was accepted by Resend. Written once. */
create or replace function public.consent_record_request_sent(p_id uuid, p_provider_id text)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.parental_consents
     set request_email_sent_at = now(), request_email_provider_id = p_provider_id
   where id = p_id and request_email_provider_id is null;
$$;

-- ── 3. What a token currently points at — read-only, so a GET can show the right screen ─────────
create or replace function public.consent_lookup(p_token_hash text)
returns table (consent_id uuid, state text, lang text, expired boolean, email text,
               learner_id uuid, second_email_provider_id text, second_notice_scheduled_for timestamptz)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select c.id, c.state, c.lang, (c.state = 'pending' and c.expires_at <= now()), c.email_address,
         c.learner_id, c.second_email_provider_id, c.second_notice_scheduled_for
    from public.parental_consents c
   where c.token_hash = p_token_hash;
$$;

-- ── 4. The three answers ────────────────────────────────────────────────────────────────────────
/**
 * Grant. Called only AFTER Resend has accepted B3 for scheduling, and it records that id in the same
 * statement — `parental_consents_email_plus_second_notice` refuses the row otherwise.
 * Returns a status rather than raising, because an out-of-date link is an ordinary outcome and the
 * caller has to cancel the B3 it just scheduled whenever the answer is anything but 'granted'.
 *
 * ⚠️ AN EXPIRED LINK IS MARKED EXPIRED HERE, NOT MERELY REFUSED — so the row reaches a terminal state
 * even if the nightly sweep has not run yet, and a second click cannot find it pending.
 */
create or replace function public.consent_grant(
  p_token_hash text, p_second_provider_id text, p_second_scheduled_for timestamptz)
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
  -- ⚠️ DISTINCT FROM 'granted'. A second click on a link that already worked must not read as a fresh
  -- grant, and it must not read as a failure either: the route cancels the B3 it scheduled whenever
  -- the answer is not a fresh grant, and B3 is scheduled with an idempotency key — so the "new" B3 of
  -- a repeat click IS the original one, and cancelling it would strip the consent of its second email.
  if r.state = 'granted' then return 'already_granted'; end if;
  if r.state <> 'pending' then return r.state; end if;
  if r.expires_at <= now() then
    update public.parental_consents set state = 'expired' where id = r.id;
    return 'expired';
  end if;
  update public.parental_consents
     set state = 'granted', confirmed_at = now(),
         second_email_provider_id = p_second_provider_id,
         second_notice_scheduled_for = p_second_scheduled_for
   where id = r.id;
  return 'granted';
end
$$;

create or replace function public.consent_decline(p_token_hash text)
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
  if r.state <> 'pending' then return r.state; end if;
  if r.expires_at <= now() then
    update public.parental_consents set state = 'expired' where id = r.id;
    return 'expired';
  end if;
  update public.parental_consents set state = 'declined', declined_at = now() where id = r.id;
  return 'declined';
end
$$;

/**
 * Withdraw. From `granted` only — withdrawing a request that was never granted is declining it, and
 * the record keeps the difference. The gate (consent_ok) stops every write for the child the moment
 * this commits; there is nothing else to switch off.
 *
 * ⚠️ WHAT THIS DOES NOT DO, AND THE B3 WORDING PROMISES: delete the child's data or close the account.
 * That is the withdrawal/deletion build (docs/legal/06), which is a separate brief. Until it exists,
 * B3's "delete everything we hold about the child, and close the account" is not yet true.
 */
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
  update public.parental_consents set state = 'withdrawn', withdrawn_at = now() where id = r.id;
  return 'withdrawn';
end
$$;

-- ── 5. Nobody clicked — pending does not sit forever ────────────────────────────────────────────
/** An expired consent is exactly as good as none: the gate accepts only `granted`, and the guard
 *  above makes `expired` terminal, so there is no path from here back to a child being created. */
create or replace function public.consent_expire_stale()
returns integer
language sql
security definer
set search_path = public, pg_temp
as $$
  with x as (
    update public.parental_consents set state = 'expired'
     where state = 'pending' and expires_at <= now()
    returning 1)
  select count(*)::int from x;
$$;

select cron.schedule('expire-parental-consents', '41 3 * * *',
                     $$select public.consent_expire_stale()$$);

-- ── 6. Reachable by the server's service role and by nothing else ───────────────────────────────
-- Written out, not looped: a generated REVOKE is invisible to `billingSchema.test.ts` and to a
-- reviewer reading this file, and V19 (an anon-callable DEFINER function) is the class it guards.
revoke all on function public.consent_request(uuid, text, text, text, text, text, interval) from public, anon, authenticated;
grant execute on function public.consent_request(uuid, text, text, text, text, text, interval) to service_role;
revoke all on function public.consent_record_request_sent(uuid, text) from public, anon, authenticated;
grant execute on function public.consent_record_request_sent(uuid, text) to service_role;
revoke all on function public.consent_lookup(text) from public, anon, authenticated;
grant execute on function public.consent_lookup(text) to service_role;
revoke all on function public.consent_grant(text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.consent_grant(text, text, timestamptz) to service_role;
revoke all on function public.consent_decline(text) from public, anon, authenticated;
grant execute on function public.consent_decline(text) to service_role;
revoke all on function public.consent_withdraw(text) from public, anon, authenticated;
grant execute on function public.consent_withdraw(text) to service_role;
revoke all on function public.consent_expire_stale() from public, anon, authenticated;
grant execute on function public.consent_expire_stale() to service_role;
