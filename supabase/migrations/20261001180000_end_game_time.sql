-- A child who stops a game early gets the unused minutes back (founder, 2026-10-01: the clock kept running after the
-- child left the game, and the paid minutes were simply lost).
--
-- A purchase is ONE point_events row (reason 'game', minutes, -8 points a minute, ends_at = when it runs out), and the
-- balance and "minutes played today" are sums over those rows. So stopping shrinks the running row to the minutes
-- actually played — a started minute counts as a whole one — and ends it now. The points of the minutes not played
-- come back by the same sum, and they no longer count against the parent's daily limit. Nothing else is touched.
--
-- WHO MAY CALL: exactly who may start a game (start_game_time): any learner_access row for that child — the child's
-- own login, the owning parent, a viewer. Stopping can only give back points the child itself paid, never more.
--
-- ⚠️ SECURITY: one NEW SECURITY DEFINER function, search_path pinned, EXECUTE revoked from public/anon and granted to
-- authenticated only (the V19 trap). It writes one row of point_events, which no client can write directly.
-- Deploy order: migration first (the app calls it only from the stop button). Rollback: drop function public.end_game_time(uuid).

create or replace function public.end_game_time(p_learner uuid)
  returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare r public.point_events; v_played int; v_points int;
begin
  if not exists (select 1 from public.learner_access where learner_id = p_learner and parent_id = auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtext(p_learner::text));   -- the same lock start_game_time takes
  select * into r from public.point_events
   where learner_id = p_learner and reason = 'game' and ends_at > now()
   order by ends_at desc limit 1 for update;
  if not found then return jsonb_build_object('ok', true, 'refunded', 0); end if;   -- nothing running: nothing to do

  -- whole minutes since it started, a started one counted; at least 1 (the column's own floor), at most what was bought
  v_played := least(r.minutes, greatest(1,
    ceil(extract(epoch from now() - (r.ends_at - make_interval(mins => r.minutes))) / 60)::int));
  v_points := r.points / r.minutes * v_played;   -- the row's own price per minute (-8 today)
  update public.point_events set minutes = v_played, points = v_points, ends_at = now() where id = r.id;
  return jsonb_build_object('ok', true, 'refunded', v_points - r.points);
end;
$$;

revoke all on function public.end_game_time(uuid) from public, anon;
grant execute on function public.end_game_time(uuid) to authenticated;
