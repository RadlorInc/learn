-- Performance, 2026-10-16 (founder: "fix these now"). Same answers, fewer reads, and one request per practice answer.
--
-- 1. The points ledger is read by RANGE. `points_room_today` and `game_wallet` counted "today" with
--    `(created_at at time zone tz)::date = (now() at time zone tz)::date`, which index `point_events_learner_created
--    (learner_id, created_at)` cannot serve: every call read the child's WHOLE ledger, which grows for ever. Now
--    `created_at >= <today's midnight in tz> and created_at < <tomorrow's midnight in tz>` — the same rows (midnight is
--    taken in the family's zone for both ends, so a 23- or 25-hour DST day is still exactly one local day).
-- 2. `record_lesson_progress` asked `points_room_today` up to four times per answer; it now asks once, and each later
--    award fits against `v_room - v_earned` (everything it awards is a positive row created today, which is exactly what
--    the room subtracts — so the numbers are the same). `game_wallet` read the ledger three times; now twice (today's
--    game minutes by range, then balance and the running game in one pass). `start_game_time` and
--    `record_module_practice` call these two, unchanged.
-- 3. `sync_batch(p_items jsonb)`: the device's upload queue in ONE request (src/infra/storage/lessonSync.ts). It runs the
--    existing functions in order, as the caller, and stops at the first item that raises — returning how many went
--    through and that item's SQLSTATE — so the device handles a refusal exactly as it did one request at a time
--    (order kept, a held child's later answers wait, client_id idempotency in the functions themselves).
--
-- Copied from pg_get_functiondef with named lines changed (read on a local replay of every migration; the definitions
-- are those of 20260928180000 and 20260917112109).
--
-- DEPLOY ORDER: either. The app calls sync_batch and, on PGRST202 (not applied yet), falls back to one request per item.
--
-- SECURITY: no SECURITY DEFINER added or removed, no search_path or owner changed — `record_lesson_progress` and
-- `game_wallet` stay DEFINER with search_path=public (CREATE OR REPLACE keeps owner and grants; checked below).
-- `sync_batch` is a new INVOKER function: it runs as the caller, so it can do nothing the caller could not do with the
-- three calls it makes (each still checks learner_access against auth.uid()). EXECUTE: authenticated only.
--
-- Rollback: re-run points_room_today and record_lesson_progress from 20260928180000, game_wallet from 20260917112109;
-- drop function public.sync_batch(jsonb). (The app falls back by itself.)

CREATE OR REPLACE FUNCTION public.points_room_today(p_learner uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select greatest(0, 300 - coalesce((
    select sum(pe.points) from public.point_events pe
     where pe.learner_id = p_learner and pe.points > 0
       and pe.created_at >= ((now() at time zone z.tz)::date)::timestamp at time zone z.tz
       and pe.created_at <  ((now() at time zone z.tz)::date + 1)::timestamp at time zone z.tz), 0))::int
  from (select coalesce((select gs.time_zone from public.game_settings gs where gs.learner_id = p_learner), 'UTC') as tz) z
$function$;

CREATE OR REPLACE FUNCTION public.record_lesson_progress(p_learner uuid, p_lesson text, p_done boolean, p_level integer, p_streak integer, p_mastered boolean, p_outcome text DEFAULT NULL::text, p_event uuid DEFAULT NULL::uuid, p_answered_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare old public.lesson_progress; v_earned int := 0; v_n int; v_at timestamptz; v_fresh boolean; v_room int;
begin
  if not exists (select 1 from public.learner_access where learner_id = p_learner and parent_id = auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_outcome is not null and p_outcome not in ('first', 'second', 'worked') then
    raise exception 'bad_outcome' using errcode = '22023';
  end if;
  if not exists (select 1 from public.lesson_catalog c where c.id = p_lesson and c.kind in ('lesson', 'chapter')) then
    raise exception 'unknown_lesson' using errcode = 'P0L01';
  end if;
  perform pg_advisory_xact_lock(hashtext(p_learner::text));

  select * into old from public.lesson_progress where learner_id = p_learner and lesson_id = p_lesson;
  if not found then old.done := false; old.level := 0; old.mastered := false; end if;
  v_at := least(coalesce(p_answered_at, now()), now());
  v_fresh := v_at >= coalesce(old.answered_at, '-infinity'::timestamptz);

  insert into public.lesson_progress (learner_id, lesson_id, done, level, streak, mastered, answered_at, updated_at)
  values (p_learner, p_lesson, coalesce(p_done, false) or old.done, greatest(0, p_level), greatest(0, p_streak), coalesce(p_mastered, false), v_at, now())
  on conflict (learner_id, lesson_id) do update
    set done = excluded.done,
        level       = case when v_fresh then excluded.level       else lesson_progress.level end,
        streak      = case when v_fresh then excluded.streak      else lesson_progress.streak end,
        mastered    = case when v_fresh then excluded.mastered    else lesson_progress.mastered end,
        answered_at = case when v_fresh then excluded.answered_at else lesson_progress.answered_at end,
        updated_at = now();

  -- Today's room, read once; every award below is a positive row created today, so what is left is v_room - v_earned.
  v_room := public.points_room_today(p_learner);
  if p_outcome is not null and p_event is not null and v_room - v_earned >= (case when p_outcome = 'first' then 2 else 1 end) then
    insert into public.point_events (learner_id, reason, lesson_id, points, client_id)
    values (p_learner, 'problem', p_lesson, case when p_outcome = 'first' then 2 else 1 end, p_event)
    on conflict (client_id) do nothing;
    get diagnostics v_n = row_count;
    v_earned := v_earned + case when v_n > 0 then case when p_outcome = 'first' then 2 else 1 end else 0 end;
  end if;
  if v_fresh and p_level > old.level and v_room - v_earned >= 3 then
    insert into public.point_events (learner_id, reason, lesson_id, points) values (p_learner, 'level_up', p_lesson, 3);
    v_earned := v_earned + 3;
  end if;
  if coalesce(p_mastered, false) and v_room - v_earned >= 15 then
    insert into public.point_events (learner_id, reason, lesson_id, points) values (p_learner, 'mastered', p_lesson, 15)
    on conflict (learner_id, reason, lesson_id) where reason in ('mastered', 'lesson_done') do nothing;
    get diagnostics v_n = row_count;
    v_earned := v_earned + 15 * v_n;
  end if;
  if coalesce(p_done, false) and v_room - v_earned >= 10 then
    insert into public.point_events (learner_id, reason, lesson_id, points) values (p_learner, 'lesson_done', p_lesson, 10)
    on conflict (learner_id, reason, lesson_id) where reason in ('mastered', 'lesson_done') do nothing;
    get diagnostics v_n = row_count;
    v_earned := v_earned + 10 * v_n;
  end if;

  return jsonb_build_object('ok', true, 'earned', v_earned,
    'balance', (select coalesce(sum(points), 0) from public.point_events where learner_id = p_learner));
end;
$function$;

CREATE OR REPLACE FUNCTION public.game_wallet(p_learner uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare s public.game_settings; v_used int; v_ends timestamptz; v_balance int;
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
  select max(ends_at) filter (where reason = 'game' and ends_at > now()), coalesce(sum(points), 0)
    into v_ends, v_balance from public.point_events where learner_id = p_learner;
  return jsonb_build_object(
    'balance', v_balance,
    'points_per_minute', 8,
    'enabled', s.enabled, 'minutes_per_day', s.minutes_per_day, 'time_zone', s.time_zone,
    'minutes_used_today', v_used, 'playing_until', v_ends);
end;
$function$;

-- The upload queue in one request. Items: [{ "k": "lesson" | "module" | "run", "a": { <the function's named args> } }].
-- Returns { "done": n } when every item went through, else { "done": <items before the failing one>, "code": SQLSTATE,
-- "message": text } — the failing item's own work is rolled back (its savepoint), the ones before it are kept.
create function public.sync_batch(p_items jsonb)
  returns jsonb language plpgsql security invoker set search_path = public as $$
declare it jsonb; a jsonb; v_done int := 0;
begin
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) > 200 then
    raise exception 'bad_batch' using errcode = '22023';
  end if;
  for it in select e from jsonb_array_elements(p_items) with ordinality as t(e, n) order by n loop
    a := it -> 'a';
    begin
      case it ->> 'k'
        when 'lesson' then
          perform public.record_lesson_progress((a ->> 'p_learner')::uuid, a ->> 'p_lesson', (a ->> 'p_done')::boolean,
            (a ->> 'p_level')::int, (a ->> 'p_streak')::int, (a ->> 'p_mastered')::boolean, a ->> 'p_outcome',
            (a ->> 'p_event')::uuid, (a ->> 'p_answered_at')::timestamptz);
        when 'module' then
          perform public.record_module_practice((a ->> 'p_learner')::uuid, a ->> 'p_module', (a ->> 'p_event')::uuid);
        when 'run' then
          perform public.save_practice_run((a ->> 'p_learner')::uuid, a ->> 'p_lesson', a -> 'p_run');
        else
          raise exception 'bad_item' using errcode = '22023';
      end case;
    exception when others then
      return jsonb_build_object('done', v_done, 'code', sqlstate, 'message', sqlerrm);
    end;
    v_done := v_done + 1;
  end loop;
  return jsonb_build_object('done', v_done);
end;
$$;
revoke all on function public.sync_batch(jsonb) from public, anon;
grant execute on function public.sync_batch(jsonb) to authenticated;

do $$
begin
  if not (select bool_and(prosecdef and proconfig = array['search_path=public']) from pg_proc
          where oid in ('public.record_lesson_progress(uuid,text,boolean,integer,integer,boolean,text,uuid,timestamptz)'::regprocedure,
                        'public.game_wallet(uuid)'::regprocedure)) then
    raise exception 'a point function is no longer SECURITY DEFINER with search_path=public';
  end if;
  if not has_function_privilege('authenticated', 'public.record_lesson_progress(uuid,text,boolean,integer,integer,boolean,text,uuid,timestamptz)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.game_wallet(uuid)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.sync_batch(jsonb)', 'EXECUTE') then
    raise exception 'authenticated can no longer record progress, read the wallet or sync a batch';
  end if;
  if has_function_privilege('anon', 'public.sync_batch(jsonb)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.points_room_today(uuid)', 'EXECUTE')
     or (select prosecdef from pg_proc where oid = 'public.sync_batch(jsonb)'::regprocedure) then
    raise exception 'sync_batch must be INVOKER and not callable by anon; points_room_today must stay server-only';
  end if;
end $$;
