-- Parent PIN: a 4-digit PIN the adult sets once and must enter every time the dashboard opens.
--
-- WHY (founder, 2026-09-17): on a shared device a child reaches the parent dashboard without any password —
-- "Sign in with Google" signs in whoever is already signed in to Google in that browser, a saved password
-- autofills, or the parent simply left the session open. The PIN guards the dashboard however the session
-- was obtained.
--
-- ⚠️ THREAT MODEL, STATED SO NOBODY OVERSELLS IT: a child tapping around on a signed-in device. It gates the
-- dashboard SCREENS (client-side, `ParentPinGate`). It is not a data boundary — RLS still decides what the
-- session can read, and someone who can call the API by hand with the session's token is out of scope.
--
-- ⚠️⚠️ SECURITY POSTURE, CALLED OUT DELIBERATELY:
--   · a NEW table `parent_pins` with RLS ENABLED and NO POLICIES, and every privilege revoked from
--     public/anon/authenticated. No client can read the hash or the counters, or write any of it.
--     The absence of a policy IS the mechanism (see CLAUDE.md, the admin_users precedent).
--   · FOUR NEW `SECURITY DEFINER` functions, each keyed on `auth.uid()` (a caller only ever touches their own
--     row), each with `search_path` pinned, each revoked from public/anon and granted to authenticated only.
--   · No existing policy, grant or function is changed.
--
-- WRONG TRIES: 5 in a row lock the PIN for 15 minutes, doubling on each further lock (15m, 30m, 1h … capped at
-- 24h). A 4-digit PIN has 10,000 values; with this schedule a child guessing non-stop needs months.
--
-- FORGOT PIN: `request_parent_pin_reset` does NOT reset anything immediately — a child who just signed in with
-- Google could otherwise reset it at once, which is the exact hole this closes. The PIN is removed 24 hours
-- later, and entering the correct PIN before then cancels the request (and the dashboard says a reset had been
-- requested). The adult sets a new PIN on their next visit after it lapses.
--
-- ⚠️ BOOTSTRAP GAP: until a PIN exists, whoever holds the session can set one. The dashboard asks for a PIN
-- on the first visit, so the window is the time before the parent first opens it after this ships.
--
-- HASH: sha256 over a random per-row salt + the PIN, using core functions only (no pgcrypto), because the table
-- is unreadable to clients anyway; the salt stops two equal PINs from looking equal to anyone with table access.

create table if not exists public.parent_pins (
  account_id          uuid primary key references auth.users(id) on delete cascade,
  salt                text not null,
  pin_hash            text not null,
  failed_count        int  not null default 0,
  lockouts            int  not null default 0,
  locked_until        timestamptz,
  reset_requested_at  timestamptz,
  updated_at          timestamptz not null default now()
);

alter table public.parent_pins enable row level security;
revoke all on public.parent_pins from public, anon, authenticated;

create or replace function public.parent_pin_hash(p_salt text, p_pin text)
  returns text language sql immutable set search_path to 'public' as $$
  select encode(sha256(convert_to(p_salt || ':' || p_pin, 'UTF8')), 'hex')
$$;
revoke all on function public.parent_pin_hash(text, text) from public, anon, authenticated;

-- 'none' | 'set', plus when a lock ends and when a pending reset takes effect. Lapses a matured reset.
create or replace function public.parent_pin_status()
  returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare r public.parent_pins;
begin
  if auth.uid() is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  delete from public.parent_pins
   where account_id = auth.uid() and reset_requested_at is not null and reset_requested_at <= now() - interval '24 hours';
  select * into r from public.parent_pins where account_id = auth.uid();
  if not found then return jsonb_build_object('state', 'none'); end if;
  return jsonb_build_object('state', 'set',
    'locked_until', case when r.locked_until > now() then r.locked_until end,
    'reset_at', r.reset_requested_at + interval '24 hours');
end;
$$;

-- { ok, locked_until?, reset_cancelled? }. Counts a wrong PIN; a right one clears counters and any pending reset.
create or replace function public.verify_parent_pin(p_pin text)
  returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare r public.parent_pins; v_cancelled boolean;
begin
  if auth.uid() is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  select * into r from public.parent_pins where account_id = auth.uid() for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_pin'); end if;
  if r.locked_until > now() then return jsonb_build_object('ok', false, 'error', 'locked', 'locked_until', r.locked_until); end if;

  if coalesce(p_pin, '') ~ '^[0-9]{4}$' and public.parent_pin_hash(r.salt, p_pin) = r.pin_hash then
    v_cancelled := r.reset_requested_at is not null;
    update public.parent_pins set failed_count = 0, lockouts = 0, locked_until = null, reset_requested_at = null, updated_at = now()
     where account_id = auth.uid();
    return jsonb_build_object('ok', true, 'reset_cancelled', v_cancelled);
  end if;

  r.failed_count := r.failed_count + 1;
  if r.failed_count >= 5 then
    r.lockouts := r.lockouts + 1;
    r.failed_count := 0;
    r.locked_until := now() + least(interval '15 minutes' * power(2, r.lockouts - 1), interval '24 hours');
  end if;
  update public.parent_pins set failed_count = r.failed_count, lockouts = r.lockouts, locked_until = r.locked_until, updated_at = now()
   where account_id = auth.uid();
  return jsonb_build_object('ok', false, 'error', case when r.locked_until > now() then 'locked' else 'wrong' end,
    'locked_until', case when r.locked_until > now() then r.locked_until end, 'tries_left', case when r.locked_until > now() then 0 else 5 - r.failed_count end);
end;
$$;

-- Sets the first PIN, or changes it — changing needs the current PIN (same counters and lock as verify).
create or replace function public.set_parent_pin(p_pin text, p_current text default null)
  returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_check jsonb; v_salt text := gen_random_uuid()::text;
begin
  if auth.uid() is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  if coalesce(p_pin, '') !~ '^[0-9]{4}$' then return jsonb_build_object('ok', false, 'error', 'bad_pin'); end if;
  perform public.parent_pin_status();   -- lapse a matured reset first, so "forgot PIN" really ends in a new one
  if exists (select 1 from public.parent_pins where account_id = auth.uid()) then
    v_check := public.verify_parent_pin(p_current);
    if not (v_check ->> 'ok')::boolean then return v_check; end if;
  end if;
  insert into public.parent_pins (account_id, salt, pin_hash) values (auth.uid(), v_salt, public.parent_pin_hash(v_salt, p_pin))
  on conflict (account_id) do update set salt = excluded.salt, pin_hash = excluded.pin_hash, failed_count = 0, lockouts = 0,
    locked_until = null, reset_requested_at = null, updated_at = now();
  return jsonb_build_object('ok', true);
end;
$$;

-- "Forgot PIN": starts the 24-hour clock (idempotent — asking again does not restart it). Returns when it lapses.
create or replace function public.request_parent_pin_reset()
  returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_at timestamptz;
begin
  if auth.uid() is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  update public.parent_pins set reset_requested_at = coalesce(reset_requested_at, now()), updated_at = now()
   where account_id = auth.uid() returning reset_requested_at + interval '24 hours' into v_at;
  return jsonb_build_object('ok', v_at is not null, 'reset_at', v_at);
end;
$$;

-- ⚠️ The V19 trap: a new function in `public` is PUBLIC-executable until revoked.
revoke all on function public.parent_pin_status()               from public, anon;
revoke all on function public.verify_parent_pin(text)           from public, anon;
revoke all on function public.set_parent_pin(text, text)        from public, anon;
revoke all on function public.request_parent_pin_reset()        from public, anon;
grant execute on function public.parent_pin_status()            to authenticated;
grant execute on function public.verify_parent_pin(text)        to authenticated;
grant execute on function public.set_parent_pin(text, text)     to authenticated;
grant execute on function public.request_parent_pin_reset()     to authenticated;
