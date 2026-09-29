-- Points: at most 300 a day per child, and only for lessons, chapters and modules the app really has.
-- Founder, 2026-09-28 ("points cap ~300/day + real lesson-id check"), replacing the 2026-09-17 "no daily cap" rule.
--
-- 1. public.lesson_catalog: every id the app records progress or points under — the 282 Grade 3–8 topics, the 23 KG–2
--    chapters (`c:<chapter>`) and the 36 Grade 3–8 modules — generated from src/features/lessons/modules.ts
--    (ALL_MODULES, MODULES). RLS on, NO policies, every privilege revoked from clients: only the functions below read it.
--    ⚠️ A NEW LESSON NEEDS ITS ROW. `pointsCapAndCatalog.test.ts` fails when the app has an id this table (replayed over
--    every migration) does not. Until the row is applied, that lesson's answers are refused with P0L01 and the app keeps
--    them queued on the device (classifySyncError → 'retry'); they upload once the row exists. Nothing is lost.
-- 2. public.points_room_today(learner): 300 minus the points the child earned today, counted in the child's game-time
--    zone (game_settings.time_zone, else UTC — the same day game minutes use). INVOKER, and not executable by any client
--    role: it runs only inside the two functions below, which run as their owner.
-- 3. record_lesson_progress and record_module_practice, copied from pg_get_functiondef with named lines added:
--    - an id not in the catalogue is refused (errcode P0L01) before anything is written;
--    - each award (problem 2/1, level up 3, mastered 15, finished 10, module 10) is made only while it fits today's room.
--      Progress itself is always recorded; only the points wait for tomorrow.
--
-- DEPLOY ORDER: either. The app needs no change: P0L01 already classifies as 'retry' (held on the device, never
-- deleted), and every id today's app sends is in the catalogue.
--
-- SECURITY CHANGE: two SECURITY DEFINER functions redefined with DEFINER, `search_path = public`, owner and grants
-- unchanged (checked below). A new table with RLS on and no policies, all client privileges revoked. A new INVOKER
-- function with EXECUTE revoked from public, anon and authenticated.
--
-- Rollback: re-run the two function definitions from 20260926100200 (record_lesson_progress) and 20260917112109
-- (record_module_practice); drop function public.points_room_today(uuid); drop table public.lesson_catalog.

create table public.lesson_catalog (
  id   text primary key,
  kind text not null check (kind in ('lesson', 'chapter', 'module'))
);
alter table public.lesson_catalog enable row level security;
revoke all on public.lesson_catalog from public, anon, authenticated;

insert into public.lesson_catalog (id, kind) values
  ('c:counting', 'chapter'),
  ('c:numberOrdering', 'chapter'),
  ('c:numberRecognition', 'chapter'),
  ('c:matchingQuantities', 'chapter'),
  ('c:numberComparison', 'chapter'),
  ('c:shapes', 'chapter'),
  ('c:colors', 'chapter'),
  ('c:patterns', 'chapter'),
  ('c:measurement', 'chapter'),
  ('c:addition', 'chapter'),
  ('c:subtraction', 'chapter'),
  ('c:numbersTo100', 'chapter'),
  ('c:placeValue', 'chapter'),
  ('c:storyProblems', 'chapter'),
  ('c:time', 'chapter'),
  ('c:compareNumbers', 'chapter'),
  ('c:skipCounting', 'chapter'),
  ('c:multiplication', 'chapter'),
  ('c:fractions', 'chapter'),
  ('c:money', 'chapter'),
  ('c:additionTo100', 'chapter'),
  ('c:subtractionTo100', 'chapter'),
  ('c:shapes2d3d', 'chapter'),
  ('g3m1-t1', 'lesson'),
  ('g3m1-t2', 'lesson'),
  ('g3m1-t3', 'lesson'),
  ('g3m1-t4', 'lesson'),
  ('g3m1-t5', 'lesson'),
  ('g3m1-t6', 'lesson'),
  ('g3m1-t7', 'lesson'),
  ('g3m1-t8', 'lesson'),
  ('g3m2-t1', 'lesson'),
  ('g3m2-t2', 'lesson'),
  ('g3m2-t3', 'lesson'),
  ('g3m2-t4', 'lesson'),
  ('g3m2-t5', 'lesson'),
  ('g3m2-t6', 'lesson'),
  ('g3m2-t7', 'lesson'),
  ('g3m2-t8', 'lesson'),
  ('g3m2-t9', 'lesson'),
  ('g3m3-t1', 'lesson'),
  ('g3m3-t2', 'lesson'),
  ('g3m3-t3', 'lesson'),
  ('g3m3-t4', 'lesson'),
  ('g3m3-t5', 'lesson'),
  ('g3m3-t6', 'lesson'),
  ('g3m3-t7', 'lesson'),
  ('g3m3-t8', 'lesson'),
  ('g3m3-t9', 'lesson'),
  ('g3m4-t1', 'lesson'),
  ('g3m4-t2', 'lesson'),
  ('g3m4-t3', 'lesson'),
  ('g3m4-t4', 'lesson'),
  ('g3m5-t1', 'lesson'),
  ('g3m5-t2', 'lesson'),
  ('g3m5-t3', 'lesson'),
  ('g3m5-t4', 'lesson'),
  ('g3m5-t5', 'lesson'),
  ('g3m5-t6', 'lesson'),
  ('g3m5-t7', 'lesson'),
  ('g3m5-t8', 'lesson'),
  ('g3m6-t1', 'lesson'),
  ('g3m6-t2', 'lesson'),
  ('g3m6-t3', 'lesson'),
  ('g3m6-t4', 'lesson'),
  ('g3m6-t5', 'lesson'),
  ('g3m6-t6', 'lesson'),
  ('g3m6-t7', 'lesson'),
  ('g4m1-t1', 'lesson'),
  ('g4m1-t2', 'lesson'),
  ('g4m1-t3', 'lesson'),
  ('g4m1-t4', 'lesson'),
  ('g4m1-t5', 'lesson'),
  ('g4m1-t6', 'lesson'),
  ('g4m1-t7', 'lesson'),
  ('g4m1-t8', 'lesson'),
  ('g4m2-t1', 'lesson'),
  ('g4m2-t2', 'lesson'),
  ('g4m2-t3', 'lesson'),
  ('g4m2-t4', 'lesson'),
  ('g4m2-t5', 'lesson'),
  ('g4m2-t6', 'lesson'),
  ('g4m2-t7', 'lesson'),
  ('g4m2-t8', 'lesson'),
  ('g4m3-t1', 'lesson'),
  ('g4m3-t2', 'lesson'),
  ('g4m3-t3', 'lesson'),
  ('g4m3-t4', 'lesson'),
  ('g4m3-t5', 'lesson'),
  ('g4m3-t6', 'lesson'),
  ('g4m3-t7', 'lesson'),
  ('g4m3-t8', 'lesson'),
  ('g4m4-t1', 'lesson'),
  ('g4m4-t2', 'lesson'),
  ('g4m4-t3', 'lesson'),
  ('g4m4-t4', 'lesson'),
  ('g4m4-t5', 'lesson'),
  ('g4m4-t6', 'lesson'),
  ('g4m4-t7', 'lesson'),
  ('g4m4-t8', 'lesson'),
  ('g4m4-t9', 'lesson'),
  ('g4m5-t1', 'lesson'),
  ('g4m5-t2', 'lesson'),
  ('g4m5-t3', 'lesson'),
  ('g4m5-t4', 'lesson'),
  ('g4m5-t5', 'lesson'),
  ('g4m5-t6', 'lesson'),
  ('g4m5-t7', 'lesson'),
  ('g4m5-t8', 'lesson'),
  ('g4m6-t1', 'lesson'),
  ('g4m6-t2', 'lesson'),
  ('g4m6-t3', 'lesson'),
  ('g4m6-t4', 'lesson'),
  ('g4m6-t5', 'lesson'),
  ('g4m6-t6', 'lesson'),
  ('g4m6-t7', 'lesson'),
  ('g5m1-t1', 'lesson'),
  ('g5m1-t2', 'lesson'),
  ('g5m1-t3', 'lesson'),
  ('g5m1-t4', 'lesson'),
  ('g5m1-t5', 'lesson'),
  ('g5m1-t6', 'lesson'),
  ('g5m1-t7', 'lesson'),
  ('g5m1-t8', 'lesson'),
  ('g5m1-t9', 'lesson'),
  ('g5m1-t10', 'lesson'),
  ('g5m1-t11', 'lesson'),
  ('g5m1-t12', 'lesson'),
  ('g5m1-t13', 'lesson'),
  ('g5m1-t14', 'lesson'),
  ('g5m1-t15', 'lesson'),
  ('g5m1-t16', 'lesson'),
  ('g5m1-t17', 'lesson'),
  ('g5m1-t18', 'lesson'),
  ('g5m1-t19', 'lesson'),
  ('g5m1-t20', 'lesson'),
  ('g5m2-t1', 'lesson'),
  ('g5m2-t2', 'lesson'),
  ('g5m2-t3', 'lesson'),
  ('g5m2-t4', 'lesson'),
  ('g5m2-t5', 'lesson'),
  ('g5m2-t6', 'lesson'),
  ('g5m2-t7', 'lesson'),
  ('g5m2-t8', 'lesson'),
  ('g5m3-t1', 'lesson'),
  ('g5m3-t2', 'lesson'),
  ('g5m3-t3', 'lesson'),
  ('g5m3-t4', 'lesson'),
  ('g5m3-t5', 'lesson'),
  ('g5m3-t6', 'lesson'),
  ('g5m3-t7', 'lesson'),
  ('g5m3-t8', 'lesson'),
  ('g5m4-t1', 'lesson'),
  ('g5m4-t2', 'lesson'),
  ('g5m4-t3', 'lesson'),
  ('g5m4-t4', 'lesson'),
  ('g5m4-t5', 'lesson'),
  ('g5m4-t6', 'lesson'),
  ('g5m4-t7', 'lesson'),
  ('g5m4-t8', 'lesson'),
  ('g5m4-t9', 'lesson'),
  ('g5m5-t1', 'lesson'),
  ('g5m5-t2', 'lesson'),
  ('g5m5-t3', 'lesson'),
  ('g5m5-t4', 'lesson'),
  ('g5m5-t5', 'lesson'),
  ('g5m5-t6', 'lesson'),
  ('g5m5-t7', 'lesson'),
  ('g5m6-t1', 'lesson'),
  ('g5m6-t2', 'lesson'),
  ('g5m6-t3', 'lesson'),
  ('g5m6-t4', 'lesson'),
  ('g5m6-t5', 'lesson'),
  ('g5m6-t6', 'lesson'),
  ('g6m1-t1', 'lesson'),
  ('g6m1-t2', 'lesson'),
  ('g6m1-t3', 'lesson'),
  ('g6m1-t4', 'lesson'),
  ('g6m1-t5', 'lesson'),
  ('g6m1-t6', 'lesson'),
  ('g6m1-t7', 'lesson'),
  ('g6m1-t8', 'lesson'),
  ('g6m2-t1', 'lesson'),
  ('g6m2-t2', 'lesson'),
  ('g6m2-t3', 'lesson'),
  ('g6m2-t4', 'lesson'),
  ('g6m2-t5', 'lesson'),
  ('g6m2-t6', 'lesson'),
  ('g6m2-t7', 'lesson'),
  ('g6m3-t1', 'lesson'),
  ('g6m3-t2', 'lesson'),
  ('g6m3-t3', 'lesson'),
  ('g6m3-t4', 'lesson'),
  ('g6m3-t5', 'lesson'),
  ('g6m3-t6', 'lesson'),
  ('g6m4-t1', 'lesson'),
  ('g6m4-t2', 'lesson'),
  ('g6m4-t3', 'lesson'),
  ('g6m4-t4', 'lesson'),
  ('g6m4-t5', 'lesson'),
  ('g6m4-t6', 'lesson'),
  ('g6m4-t7', 'lesson'),
  ('g6m5-t1', 'lesson'),
  ('g6m5-t2', 'lesson'),
  ('g6m5-t3', 'lesson'),
  ('g6m5-t4', 'lesson'),
  ('g6m5-t5', 'lesson'),
  ('g6m5-t6', 'lesson'),
  ('g6m5-t7', 'lesson'),
  ('g6m5-t8', 'lesson'),
  ('g6m5-t9', 'lesson'),
  ('g6m6-t1', 'lesson'),
  ('g6m6-t2', 'lesson'),
  ('g6m6-t3', 'lesson'),
  ('g6m6-t4', 'lesson'),
  ('g6m6-t5', 'lesson'),
  ('g6m6-t6', 'lesson'),
  ('g6m7-t1', 'lesson'),
  ('g6m7-t2', 'lesson'),
  ('g6m7-t3', 'lesson'),
  ('g6m7-t4', 'lesson'),
  ('g6m7-t5', 'lesson'),
  ('g6m7-t6', 'lesson'),
  ('g6m7-t7', 'lesson'),
  ('g6m7-t8', 'lesson'),
  ('g7m1-t1', 'lesson'),
  ('g7m1-t2', 'lesson'),
  ('g7m1-t3', 'lesson'),
  ('g7m1-t4', 'lesson'),
  ('g7m1-t5', 'lesson'),
  ('g7m1-t6', 'lesson'),
  ('g7m1-t7', 'lesson'),
  ('g7m1-t8', 'lesson'),
  ('g7m2-t1', 'lesson'),
  ('g7m2-t2', 'lesson'),
  ('g7m2-t3', 'lesson'),
  ('g7m2-t4', 'lesson'),
  ('g7m2-t5', 'lesson'),
  ('g7m2-t6', 'lesson'),
  ('g7m2-t7', 'lesson'),
  ('g7m2-t8', 'lesson'),
  ('g7m3-t1', 'lesson'),
  ('g7m3-t2', 'lesson'),
  ('g7m3-t3', 'lesson'),
  ('g7m3-t4', 'lesson'),
  ('g7m3-t5', 'lesson'),
  ('g7m3-t6', 'lesson'),
  ('g7m3-t7', 'lesson'),
  ('g7m3-t8', 'lesson'),
  ('g7m4-t1', 'lesson'),
  ('g7m4-t2', 'lesson'),
  ('g7m4-t3', 'lesson'),
  ('g7m4-t4', 'lesson'),
  ('g7m4-t5', 'lesson'),
  ('g7m4-t6', 'lesson'),
  ('g7m4-t7', 'lesson'),
  ('g7m4-t8', 'lesson'),
  ('g7m5-t1', 'lesson'),
  ('g7m5-t2', 'lesson'),
  ('g7m5-t3', 'lesson'),
  ('g7m5-t4', 'lesson'),
  ('g7m5-t5', 'lesson'),
  ('g7m5-t6', 'lesson'),
  ('g8m1-t1', 'lesson'),
  ('g8m1-t2', 'lesson'),
  ('g8m1-t3', 'lesson'),
  ('g8m1-t4', 'lesson'),
  ('g8m1-t5', 'lesson'),
  ('g8m1-t6', 'lesson'),
  ('g8m1-t7', 'lesson'),
  ('g8m1-t8', 'lesson'),
  ('g8m1-t9', 'lesson'),
  ('g8m2-t1', 'lesson'),
  ('g8m2-t2', 'lesson'),
  ('g8m2-t3', 'lesson'),
  ('g8m2-t4', 'lesson'),
  ('g8m2-t5', 'lesson'),
  ('g8m2-t6', 'lesson'),
  ('g8m2-t7', 'lesson'),
  ('g8m2-t8', 'lesson'),
  ('g8m2-t9', 'lesson'),
  ('g8m3-t1', 'lesson'),
  ('g8m3-t2', 'lesson'),
  ('g8m3-t3', 'lesson'),
  ('g8m3-t4', 'lesson'),
  ('g8m3-t5', 'lesson'),
  ('g8m3-t6', 'lesson'),
  ('g8m4-t1', 'lesson'),
  ('g8m4-t2', 'lesson'),
  ('g8m4-t3', 'lesson'),
  ('g8m4-t4', 'lesson'),
  ('g8m4-t5', 'lesson'),
  ('g8m4-t6', 'lesson'),
  ('g8m4-t7', 'lesson'),
  ('g8m4-t8', 'lesson'),
  ('g8m4-t9', 'lesson'),
  ('g8m5-t1', 'lesson'),
  ('g8m5-t2', 'lesson'),
  ('g8m5-t3', 'lesson'),
  ('g8m5-t4', 'lesson'),
  ('g8m6-t1', 'lesson'),
  ('g8m6-t2', 'lesson'),
  ('g8m6-t3', 'lesson'),
  ('g8m6-t4', 'lesson'),
  ('g8m6-t5', 'lesson'),
  ('g3m1', 'module'),
  ('g3m2', 'module'),
  ('g3m3', 'module'),
  ('g3m4', 'module'),
  ('g3m5', 'module'),
  ('g3m6', 'module'),
  ('g4m1', 'module'),
  ('g4m2', 'module'),
  ('g4m3', 'module'),
  ('g4m4', 'module'),
  ('g4m5', 'module'),
  ('g4m6', 'module'),
  ('g5m1', 'module'),
  ('g5m2', 'module'),
  ('g5m3', 'module'),
  ('g5m4', 'module'),
  ('g5m5', 'module'),
  ('g5m6', 'module'),
  ('g6m1', 'module'),
  ('g6m2', 'module'),
  ('g6m3', 'module'),
  ('g6m4', 'module'),
  ('g6m5', 'module'),
  ('g6m6', 'module'),
  ('g6m7', 'module'),
  ('g7m1', 'module'),
  ('g7m2', 'module'),
  ('g7m3', 'module'),
  ('g7m4', 'module'),
  ('g7m5', 'module'),
  ('g8m1', 'module'),
  ('g8m2', 'module'),
  ('g8m3', 'module'),
  ('g8m4', 'module'),
  ('g8m5', 'module'),
  ('g8m6', 'module');

create function public.points_room_today(p_learner uuid)
  returns int language sql stable security invoker set search_path = public as $$
  select greatest(0, 300 - coalesce((
    select sum(pe.points) from public.point_events pe
     where pe.learner_id = p_learner and pe.points > 0
       and (pe.created_at at time zone z.tz)::date = (now() at time zone z.tz)::date), 0))::int
  from (select coalesce((select gs.time_zone from public.game_settings gs where gs.learner_id = p_learner), 'UTC') as tz) z
$$;
revoke all on function public.points_room_today(uuid) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.record_lesson_progress(p_learner uuid, p_lesson text, p_done boolean, p_level integer, p_streak integer, p_mastered boolean, p_outcome text DEFAULT NULL::text, p_event uuid DEFAULT NULL::uuid, p_answered_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare old public.lesson_progress; v_earned int := 0; v_n int; v_at timestamptz; v_fresh boolean;
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

  if p_outcome is not null and p_event is not null and public.points_room_today(p_learner) >= (case when p_outcome = 'first' then 2 else 1 end) then
    insert into public.point_events (learner_id, reason, lesson_id, points, client_id)
    values (p_learner, 'problem', p_lesson, case when p_outcome = 'first' then 2 else 1 end, p_event)
    on conflict (client_id) do nothing;
    get diagnostics v_n = row_count;
    v_earned := v_earned + case when v_n > 0 then case when p_outcome = 'first' then 2 else 1 end else 0 end;
  end if;
  if v_fresh and p_level > old.level and public.points_room_today(p_learner) >= 3 then
    insert into public.point_events (learner_id, reason, lesson_id, points) values (p_learner, 'level_up', p_lesson, 3);
    v_earned := v_earned + 3;
  end if;
  if coalesce(p_mastered, false) and public.points_room_today(p_learner) >= 15 then
    insert into public.point_events (learner_id, reason, lesson_id, points) values (p_learner, 'mastered', p_lesson, 15)
    on conflict (learner_id, reason, lesson_id) where reason in ('mastered', 'lesson_done') do nothing;
    get diagnostics v_n = row_count;
    v_earned := v_earned + 15 * v_n;
  end if;
  if coalesce(p_done, false) and public.points_room_today(p_learner) >= 10 then
    insert into public.point_events (learner_id, reason, lesson_id, points) values (p_learner, 'lesson_done', p_lesson, 10)
    on conflict (learner_id, reason, lesson_id) where reason in ('mastered', 'lesson_done') do nothing;
    get diagnostics v_n = row_count;
    v_earned := v_earned + 10 * v_n;
  end if;

  return jsonb_build_object('ok', true, 'earned', v_earned,
    'balance', (select coalesce(sum(points), 0) from public.point_events where learner_id = p_learner));
end;
$function$;

CREATE OR REPLACE FUNCTION public.record_module_practice(p_learner uuid, p_module text, p_event uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_n int;
begin
  if not exists (select 1 from public.learner_access where learner_id = p_learner and parent_id = auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not exists (select 1 from public.lesson_catalog c where c.id = p_module and c.kind = 'module') then
    raise exception 'unknown_lesson' using errcode = 'P0L01';
  end if;
  v_n := 0;
  if public.points_room_today(p_learner) >= 10 then
  insert into public.point_events (learner_id, reason, lesson_id, points, client_id)
  values (p_learner, 'module_done', p_module, 10, p_event)
  on conflict (client_id) do nothing;
  get diagnostics v_n = row_count;
  end if;
  return jsonb_build_object('ok', true, 'earned', 10 * v_n,
    'balance', (select coalesce(sum(points), 0) from public.point_events where learner_id = p_learner));
end;
$function$;

do $$
begin
  if (select count(*) from public.lesson_catalog) <> 341 then
    raise exception 'lesson_catalog holds % rows, expected 341', (select count(*) from public.lesson_catalog);
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'lesson_catalog') then
    raise exception 'lesson_catalog must have no policies';
  end if;
  if has_table_privilege('authenticated', 'public.lesson_catalog', 'SELECT') or has_table_privilege('anon', 'public.lesson_catalog', 'SELECT') then
    raise exception 'a client role can read lesson_catalog';
  end if;
  if has_function_privilege('authenticated', 'public.points_room_today(uuid)', 'EXECUTE')
     or has_function_privilege('anon', 'public.points_room_today(uuid)', 'EXECUTE') then
    raise exception 'a client role can call points_room_today';
  end if;
  -- The paired halves: the two functions clients call are still DEFINER, pinned, and callable by authenticated.
  if not (select bool_and(prosecdef and proconfig = array['search_path=public']) from pg_proc
          where oid in ('public.record_lesson_progress(uuid,text,boolean,integer,integer,boolean,text,uuid,timestamptz)'::regprocedure,
                        'public.record_module_practice(uuid,text,uuid)'::regprocedure)) then
    raise exception 'a point function is no longer SECURITY DEFINER with search_path=public';
  end if;
  if not has_function_privilege('authenticated', 'public.record_lesson_progress(uuid,text,boolean,integer,integer,boolean,text,uuid,timestamptz)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.record_module_practice(uuid,text,uuid)', 'EXECUTE') then
    raise exception 'authenticated can no longer record progress or module practice';
  end if;
end $$;
