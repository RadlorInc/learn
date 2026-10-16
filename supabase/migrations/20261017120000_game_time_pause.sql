-- "Paused" in a game really pauses the paid game time (founder, 2026-10-17: the game showed "Paused" — and paused by
-- itself when the tab was hidden — while the timer ran on, because a ticket is wall-clock: ends_at = start + minutes).
--
-- A paused ticket is the same point_events row with `paused_left_s` = the seconds it had left (rounded up) and
-- `ends_at` = the moment it was paused, so nothing that reads "ends_at > now()" sees it as running. Resuming sets
-- `ends_at = now() + paused_left_s` and clears it, so end_game_time's played-seconds math
-- (now - (ends_at - minutes)) stays right after any number of pauses. Points and the parent's daily minutes are not
-- touched by a pause: the minutes were bought (and counted) when the ticket was.
--
--   pause_game_time(learner)  — the running ticket → paused. Nothing running: nothing changes. Returns game_wallet.
--   resume_game_time(learner) — the paused ticket → running again. Nothing paused: nothing changes. Returns game_wallet.
--   end_game_time   — a PAUSED ticket is refunded by seconds played too (minutes*60 - paused_left_s).
--   start_game_time — a paused ticket is RESUMED, never a second purchase.
--   game_wallet     — adds 'paused_left' (seconds, or null).
-- Bodies are pg_get_functiondef output (read on a local replay of every migration: game_wallet as of 20261016120000,
-- end_game_time as of 20261001190000, start_game_time as of 20260917112109) with the named lines changed.
--
-- WHO MAY CALL the two new functions: exactly who may start or stop a game — any learner_access row for that child
-- (the child's own login, the owning parent, a viewer), refused with 42501 otherwise.
--
-- ⚠️ SECURITY CHANGE: two NEW SECURITY DEFINER functions (search_path pinned to public, owner the migration's role),
-- EXECUTE revoked from public, anon and authenticated, then granted to authenticated only (service_role keeps
-- Supabase's default grant, as on every function); they write only the caller's child's own
-- point_events row, which no client can write directly (point_events: select only). The three replaced functions keep
-- DEFINER, search_path and owner (CREATE OR REPLACE), and their grants are re-stated. All checked at the bottom.
--
-- DEPLOY ORDER: migration first. The app's new POST /api/game-time calls the two new functions; before this runs it
-- answers 502 and the game keeps counting as it does today (the clock can only shrink, never grow).
-- Rollback: re-run game_wallet from 20261016120000, end_game_time from 20261001190000, start_game_time from
-- 20260917112109 (after `update point_events set ends_at = now() + make_interval(secs => paused_left_s),
-- paused_left_s = null where paused_left_s is not null`), then drop the two functions and the column.

alter table public.point_events add column paused_left_s int check (paused_left_s is null or paused_left_s between 1 and 3600);

CREATE OR REPLACE FUNCTION public.pause_game_time(p_learner uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not exists (select 1 from public.learner_access where learner_id = p_learner and parent_id = auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtext(p_learner::text));   -- the same lock start/end_game_time take
  update public.point_events
     set paused_left_s = ceil(extract(epoch from ends_at - now()))::int, ends_at = now()
   where learner_id = p_learner and reason = 'game' and ends_at > now() and paused_left_s is null;
  return public.game_wallet(p_learner);
end;
$function$;

CREATE OR REPLACE FUNCTION public.resume_game_time(p_learner uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not exists (select 1 from public.learner_access where learner_id = p_learner and parent_id = auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtext(p_learner::text));
  update public.point_events
     set ends_at = now() + make_interval(secs => paused_left_s), paused_left_s = null
   where learner_id = p_learner and reason = 'game' and paused_left_s is not null;
  return public.game_wallet(p_learner);
end;
$function$;

CREATE OR REPLACE FUNCTION public.end_game_time(p_learner uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r public.point_events; v_played int; v_points int; v_secs numeric;
begin
  if not exists (select 1 from public.learner_access where learner_id = p_learner and parent_id = auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtext(p_learner::text));   -- the same lock start_game_time takes
  select * into r from public.point_events
   where learner_id = p_learner and reason = 'game' and (ends_at > now() or paused_left_s is not null)
   order by ends_at desc limit 1 for update;
  if not found then return jsonb_build_object('ok', true, 'refunded', 0); end if;   -- nothing running: nothing to do

  -- paused: what was bought less what it had left; running: since it started (each resume moved ends_at on by the pause)
  v_secs := case when r.paused_left_s is not null then r.minutes * 60 - r.paused_left_s
                 else extract(epoch from now() - (r.ends_at - make_interval(mins => r.minutes))) end;
  -- minutes, for the daily limit: a started one counted; at least 1 (the column's own floor), at most what was bought
  v_played := least(r.minutes, greatest(1, ceil(v_secs / 60)::int));
  -- points, for the balance: the seconds played at the row's own price, up to a whole point; at least 1, at most paid
  v_points := -least(-r.points, greatest(1, ceil(v_secs * -r.points / (r.minutes * 60))::int));
  update public.point_events set minutes = v_played, points = v_points, ends_at = least(ends_at, now()), paused_left_s = null where id = r.id;
  return jsonb_build_object('ok', true, 'refunded', v_points - r.points);
end;
$function$;

CREATE OR REPLACE FUNCTION public.game_wallet(p_learner uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare s public.game_settings; v_used int; v_ends timestamptz; v_balance int; v_paused int;
begin
  if not exists (select 1 from public.learner_access where learner_id = p_learner and parent_id = auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into s from public.game_settings where learner_id = p_learner;
  if not found then s.enabled := true; s.minutes_per_day := 20; s.time_zone := 'UTC'; end if;
  select coalesce(sum(minutes), 0) into v_used from public.point_events
   where learner_id = p_learner and reason = 'game'
     and created_at >= ((now() at time zone s.time_zone)::date)::timestamp at time zone s.time_zone
     and created_at <  ((now() at time zone s.time_zone)::date + 1)::timestamp at time zone s.time_zone;
  select max(ends_at) filter (where reason = 'game' and ends_at > now()), coalesce(sum(points), 0), max(paused_left_s)
    into v_ends, v_balance, v_paused from public.point_events where learner_id = p_learner;
  return jsonb_build_object(
    'balance', v_balance,
    'points_per_minute', 8,
    'enabled', s.enabled, 'minutes_per_day', s.minutes_per_day, 'time_zone', s.time_zone,
    'minutes_used_today', v_used, 'playing_until', v_ends, 'paused_left', v_paused);
end;
$function$;

CREATE OR REPLACE FUNCTION public.start_game_time(p_learner uuid, p_minutes integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare w jsonb; v_ends timestamptz;
begin
  if not exists (select 1 from public.learner_access where learner_id = p_learner and parent_id = auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtext(p_learner::text));
  w := public.game_wallet(p_learner);
  if (w ->> 'paused_left') is not null then w := public.resume_game_time(p_learner); end if;   -- paused: go on, never buy twice
  if (w ->> 'playing_until') is not null then
    return jsonb_build_object('ok', true, 'playing_until', w -> 'playing_until', 'balance', w -> 'balance');
  end if;
  if not (w ->> 'enabled')::boolean then return jsonb_build_object('ok', false, 'error', 'off'); end if;
  if p_minutes is null or p_minutes < 1 or p_minutes > 60 then return jsonb_build_object('ok', false, 'error', 'bad_minutes'); end if;
  if (w ->> 'minutes_used_today')::int + p_minutes > (w ->> 'minutes_per_day')::int then
    return jsonb_build_object('ok', false, 'error', 'daily_limit');
  end if;
  if (w ->> 'balance')::int < p_minutes * 8 then return jsonb_build_object('ok', false, 'error', 'not_enough_points'); end if;
  v_ends := now() + make_interval(mins => p_minutes);
  insert into public.point_events (learner_id, reason, points, minutes, ends_at)
  values (p_learner, 'game', -8 * p_minutes, p_minutes, v_ends);
  return jsonb_build_object('ok', true, 'playing_until', v_ends, 'balance', (w ->> 'balance')::int - 8 * p_minutes);
end;
$function$;

revoke all on function public.pause_game_time(uuid) from public, anon, authenticated;
revoke all on function public.resume_game_time(uuid) from public, anon, authenticated;
revoke all on function public.end_game_time(uuid) from public, anon, authenticated;
revoke all on function public.game_wallet(uuid) from public, anon, authenticated;
revoke all on function public.start_game_time(uuid, int) from public, anon, authenticated;
grant execute on function public.pause_game_time(uuid) to authenticated;
grant execute on function public.resume_game_time(uuid) to authenticated;
grant execute on function public.end_game_time(uuid) to authenticated;
grant execute on function public.game_wallet(uuid) to authenticated;
grant execute on function public.start_game_time(uuid, int) to authenticated;

do $$
begin
  if not (select bool_and(prosecdef and proconfig = array['search_path=public']) from pg_proc
          where oid in ('public.pause_game_time(uuid)'::regprocedure, 'public.resume_game_time(uuid)'::regprocedure,
                        'public.end_game_time(uuid)'::regprocedure, 'public.game_wallet(uuid)'::regprocedure,
                        'public.start_game_time(uuid,int)'::regprocedure)) then
    raise exception 'a game-time function is not SECURITY DEFINER with search_path=public';
  end if;
  if exists (select 1 from pg_proc p, aclexplode(p.proacl) a
              where p.oid in ('public.pause_game_time(uuid)'::regprocedure, 'public.resume_game_time(uuid)'::regprocedure)
                and a.privilege_type = 'EXECUTE'
                -- service_role: Supabase's default privileges grant it on every new function (the server's key, which
                -- bypasses RLS anyway); seen on staging 2026-10-17, absent on a bare Postgres
                and a.grantee not in (select oid from pg_roles where rolname in ('authenticated', 'service_role'))
                and a.grantee <> p.proowner) then
    raise exception 'pause/resume_game_time: EXECUTE granted to someone other than authenticated (proacl)';
  end if;
  if not has_function_privilege('authenticated', 'public.pause_game_time(uuid)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.resume_game_time(uuid)', 'EXECUTE') then
    raise exception 'authenticated can no longer pause or resume game time';
  end if;
end $$;
