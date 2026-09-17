-- Lesson progress follows the child's ACCOUNT (not the device), and points buy game time.
-- Founder's call, 2026-09-17: "sab chize account ke saath sync hona chahiye, dusre device mein bhi".
-- Rules for points: docs/new-flow/points.md.
--
-- ✅ APPLIED TO PRODUCTION 2026-09-17 by hand (ledger version 20260917112109; file renamed to match). Measured after:
-- the three tables rls=t, 1 policy each, ACL postgres/service_role + authenticated=r only; the five functions
-- prosecdef=t, search_path=public, EXECUTE postgres/authenticated/service_role (no anon), and md5(prosrc) of each
-- equal to the bodies in this file. From OUTSIDE with the anon key: all four callable RPCs and all three tables
-- answer 42501, same as the known-refused control prune_error_events.
--
-- ⚠️⚠️ DEPLOY ORDER: EXPAND-ONLY, SAFE IN EITHER ORDER. Three new tables and five new functions; nothing
-- existing changes. The client tolerates the functions being absent (PGRST202): lesson progress stays on the
-- device and its uploads wait in a local queue, the dashboard hides the game card, and /play says game time
-- is not ready. So `main` deploying before this is applied loses nothing — the queue uploads once it is.
--
-- ⚠️⚠️ SECURITY POSTURE, CALLED OUT DELIBERATELY:
--   · THREE NEW TABLES, RLS ENABLED. Each has ONE policy, SELECT, for any account with a learner_access row
--     for that learner (owner, viewer, or the child's own 'self' login) — the same reach as `sessions`.
--     Every write privilege is revoked from public/anon/authenticated: rows are written only by the
--     functions below, so points cannot be typed into the table.
--   · FIVE NEW `SECURITY DEFINER` FUNCTIONS, each checking access on `auth.uid()` before touching a row,
--     each with `search_path` pinned, each revoked from public/anon and granted to authenticated only.
--   · ⚠️ `game_settings` IS THE AUTHORISATION FOR GAME TIME, SO ONLY THE ADULT WHO OWNS THE CHILD MAY
--     WRITE IT (`set_game_settings` requires learners.created_by or an 'owner' access row). The child's
--     'self' login can READ it and cannot change it — see CLAUDE.md on a column a client can write being
--     read as an authorisation decision.
--   · No existing policy, grant or function is changed.
--
-- ⚠️ THREAT MODEL, STATED SO NOBODY OVERSELLS IT: points are computed HERE from state changes (a level
-- going up, a topic becoming mastered, a lesson becoming done), never taken from the client as a number,
-- and each once-only bonus is once-only in the database. But the questions are generated and marked in the
-- browser, so someone calling the RPC by hand with a session token can claim answers they did not give.
-- What bounds that is spending: the parent's daily minutes and on/off switch are enforced here.

create table if not exists public.lesson_progress (
  learner_id  uuid not null references public.learners(id) on delete cascade,
  lesson_id   text not null check (lesson_id ~ '^g[3-8]m[0-9]{1,2}-t[0-9]{1,2}$'),
  done        boolean not null default false,
  level       int not null default 0 check (level between 0 and 50),
  streak      int not null default 0 check (streak between 0 and 50),
  mastered    boolean not null default false,
  updated_at  timestamptz not null default now(),
  primary key (learner_id, lesson_id)
);

-- The points ledger: earning rows are positive, a game-time row is negative. Balance = sum(points).
create table if not exists public.point_events (
  id          uuid primary key default gen_random_uuid(),
  learner_id  uuid not null references public.learners(id) on delete cascade,
  reason      text not null check (reason in ('problem', 'level_up', 'mastered', 'lesson_done', 'module_done', 'game')),
  lesson_id   text check (lesson_id is null or lesson_id ~ '^g[3-8]m[0-9]{1,2}(-t[0-9]{1,2})?$'),
  points      int not null check (points between -10000 and 100),
  minutes     int check (minutes is null or minutes between 1 and 60),
  ends_at     timestamptz,
  client_id   uuid unique,
  created_at  timestamptz not null default now()
);
create index if not exists point_events_learner_created on public.point_events (learner_id, created_at);
-- A once-only bonus is once-only in the database, not in a function someone can re-call.
create unique index if not exists point_events_once on public.point_events (learner_id, reason, lesson_id)
  where reason in ('mastered', 'lesson_done');

-- Set by the adult who owns the child. No row = the defaults (on, 20 minutes a day, UTC day).
create table if not exists public.game_settings (
  learner_id       uuid primary key references public.learners(id) on delete cascade,
  enabled          boolean not null default true,
  minutes_per_day  int not null default 20 check (minutes_per_day between 0 and 240),
  time_zone        text not null default 'UTC',
  updated_at       timestamptz not null default now()
);

alter table public.lesson_progress enable row level security;
alter table public.point_events    enable row level security;
alter table public.game_settings   enable row level security;
revoke all on public.lesson_progress, public.point_events, public.game_settings from public, anon, authenticated;
grant select on public.lesson_progress, public.point_events, public.game_settings to authenticated;

create policy "lesson_progress: read" on public.lesson_progress for select to authenticated
  using (exists (select 1 from public.learner_access la
                 where la.learner_id = lesson_progress.learner_id and la.parent_id = (select auth.uid())));
create policy "point_events: read" on public.point_events for select to authenticated
  using (exists (select 1 from public.learner_access la
                 where la.learner_id = point_events.learner_id and la.parent_id = (select auth.uid())));
create policy "game_settings: read" on public.game_settings for select to authenticated
  using (exists (select 1 from public.learner_access la
                 where la.learner_id = game_settings.learner_id and la.parent_id = (select auth.uid())));

-- Saves where a child stands on one topic, and awards the points that change earned:
--   an answered problem 2 (first try) or 1 (after a miss / the worked steps) — once per p_event;
--   the level going up +3; the topic mastered for the first time +15; the lesson finished for the first time +10.
-- Returns { ok, earned, balance }.
create or replace function public.record_lesson_progress(
  p_learner uuid, p_lesson text, p_done boolean, p_level int, p_streak int, p_mastered boolean,
  p_outcome text default null, p_event uuid default null)
  returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare old public.lesson_progress; v_earned int := 0; v_n int;
begin
  if not exists (select 1 from public.learner_access where learner_id = p_learner and parent_id = auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_outcome is not null and p_outcome not in ('first', 'second', 'worked') then
    raise exception 'bad_outcome' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtext(p_learner::text));

  select * into old from public.lesson_progress where learner_id = p_learner and lesson_id = p_lesson;
  if not found then old.done := false; old.level := 0; old.mastered := false; end if;

  insert into public.lesson_progress (learner_id, lesson_id, done, level, streak, mastered, updated_at)
  values (p_learner, p_lesson, coalesce(p_done, false) or old.done, greatest(0, p_level), greatest(0, p_streak), coalesce(p_mastered, false), now())
  on conflict (learner_id, lesson_id) do update
    set done = excluded.done, level = excluded.level, streak = excluded.streak, mastered = excluded.mastered, updated_at = now();

  if p_outcome is not null and p_event is not null then
    insert into public.point_events (learner_id, reason, lesson_id, points, client_id)
    values (p_learner, 'problem', p_lesson, case when p_outcome = 'first' then 2 else 1 end, p_event)
    on conflict (client_id) do nothing;
    get diagnostics v_n = row_count;
    v_earned := v_earned + case when v_n > 0 then case when p_outcome = 'first' then 2 else 1 end else 0 end;
  end if;
  if p_level > old.level then
    insert into public.point_events (learner_id, reason, lesson_id, points) values (p_learner, 'level_up', p_lesson, 3);
    v_earned := v_earned + 3;
  end if;
  if coalesce(p_mastered, false) then
    insert into public.point_events (learner_id, reason, lesson_id, points) values (p_learner, 'mastered', p_lesson, 15)
    on conflict (learner_id, reason, lesson_id) where reason in ('mastered', 'lesson_done') do nothing;
    get diagnostics v_n = row_count;
    v_earned := v_earned + 15 * v_n;
  end if;
  if coalesce(p_done, false) then
    insert into public.point_events (learner_id, reason, lesson_id, points) values (p_learner, 'lesson_done', p_lesson, 10)
    on conflict (learner_id, reason, lesson_id) where reason in ('mastered', 'lesson_done') do nothing;
    get diagnostics v_n = row_count;
    v_earned := v_earned + 10 * v_n;
  end if;

  return jsonb_build_object('ok', true, 'earned', v_earned,
    'balance', (select coalesce(sum(points), 0) from public.point_events where learner_id = p_learner));
end;
$$;

-- A module's mixed practice finished: +10, once per p_event.
create or replace function public.record_module_practice(p_learner uuid, p_module text, p_event uuid)
  returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_n int;
begin
  if not exists (select 1 from public.learner_access where learner_id = p_learner and parent_id = auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.point_events (learner_id, reason, lesson_id, points, client_id)
  values (p_learner, 'module_done', p_module, 10, p_event)
  on conflict (client_id) do nothing;
  get diagnostics v_n = row_count;
  return jsonb_build_object('ok', true, 'earned', 10 * v_n,
    'balance', (select coalesce(sum(points), 0) from public.point_events where learner_id = p_learner));
end;
$$;

-- The child's wallet: balance, today's game minutes, the parent's settings, and a game still running.
create or replace function public.game_wallet(p_learner uuid)
  returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare s public.game_settings; v_used int; v_ends timestamptz;
begin
  if not exists (select 1 from public.learner_access where learner_id = p_learner and parent_id = auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into s from public.game_settings where learner_id = p_learner;
  if not found then s.enabled := true; s.minutes_per_day := 20; s.time_zone := 'UTC'; end if;
  select coalesce(sum(minutes), 0) into v_used from public.point_events
   where learner_id = p_learner and reason = 'game'
     and (created_at at time zone s.time_zone)::date = (now() at time zone s.time_zone)::date;
  select max(ends_at) into v_ends from public.point_events where learner_id = p_learner and reason = 'game' and ends_at > now();
  return jsonb_build_object(
    'balance', (select coalesce(sum(points), 0) from public.point_events where learner_id = p_learner),
    'points_per_minute', 8,
    'enabled', s.enabled, 'minutes_per_day', s.minutes_per_day, 'time_zone', s.time_zone,
    'minutes_used_today', v_used, 'playing_until', v_ends);
end;
$$;

-- Spends points on game time. { ok, playing_until, balance } or { ok:false, error: off | daily_limit | not_enough_points | bad_minutes }.
-- A game already running is returned as it is, never charged twice.
create or replace function public.start_game_time(p_learner uuid, p_minutes int)
  returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare w jsonb; v_ends timestamptz;
begin
  if not exists (select 1 from public.learner_access where learner_id = p_learner and parent_id = auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtext(p_learner::text));
  w := public.game_wallet(p_learner);
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
$$;

-- The owning adult switches game time on/off and sets the daily minutes; the day is counted in their time zone.
create or replace function public.set_game_settings(p_learner uuid, p_enabled boolean, p_minutes_per_day int, p_time_zone text)
  returns jsonb language plpgsql security definer set search_path to 'public' as $$
begin
  if not (exists (select 1 from public.learners where id = p_learner and created_by = auth.uid())
       or exists (select 1 from public.learner_access where learner_id = p_learner and parent_id = auth.uid() and access_role = 'owner')) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_minutes_per_day is null or p_minutes_per_day < 0 or p_minutes_per_day > 240 then
    return jsonb_build_object('ok', false, 'error', 'bad_minutes');
  end if;
  if not exists (select 1 from pg_timezone_names where name = p_time_zone) then
    return jsonb_build_object('ok', false, 'error', 'bad_time_zone');
  end if;
  insert into public.game_settings (learner_id, enabled, minutes_per_day, time_zone)
  values (p_learner, coalesce(p_enabled, true), p_minutes_per_day, p_time_zone)
  on conflict (learner_id) do update
    set enabled = excluded.enabled, minutes_per_day = excluded.minutes_per_day, time_zone = excluded.time_zone, updated_at = now();
  return jsonb_build_object('ok', true);
end;
$$;

-- ⚠️ The V19 trap: a new function in `public` is PUBLIC-executable until revoked.
revoke all on function public.record_lesson_progress(uuid, text, boolean, int, int, boolean, text, uuid) from public, anon;
revoke all on function public.record_module_practice(uuid, text, uuid)                                 from public, anon;
revoke all on function public.game_wallet(uuid)                                                        from public, anon;
revoke all on function public.start_game_time(uuid, int)                                               from public, anon;
revoke all on function public.set_game_settings(uuid, boolean, int, text)                              from public, anon;
grant execute on function public.record_lesson_progress(uuid, text, boolean, int, int, boolean, text, uuid) to authenticated;
grant execute on function public.record_module_practice(uuid, text, uuid)                                 to authenticated;
grant execute on function public.game_wallet(uuid)                                                        to authenticated;
grant execute on function public.start_game_time(uuid, int)                                               to authenticated;
grant execute on function public.set_game_settings(uuid, boolean, int, text)                              to authenticated;
