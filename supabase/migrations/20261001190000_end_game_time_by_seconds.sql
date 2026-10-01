-- Stopping early charges the time actually played, not whole minutes (founder, 2026-10-01: "bahut zyada unfair" —
-- a child who bought 2 minutes and stopped at 1:17 got nothing back, because the started minute counted in full).
--
-- 20261001180000 charged every started minute. Now the POINTS follow the seconds played: the row's own price per
-- second (8 points a minute today = 1 point per 7.5 s), rounded UP to a whole point, at least 1 point, at most what
-- was paid. No gaming it: a child pays for every second they play, however often they start and stop.
-- The MINUTES (what the parent's daily limit counts) still count a started minute, at least 1: the limit is in whole
-- minutes and the column cannot hold less than 1.
--
-- The body is pg_get_functiondef of 20261001180000's end_game_time (read from staging), with the v_played comment,
-- the v_points line and the declare line changed. ⚠️ SECURITY: no change — still SECURITY DEFINER, search_path
-- public, same owner; grants re-stated below as they were. Rollback: re-run 20261001180000's function body.

create or replace function public.end_game_time(p_learner uuid)
  returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare r public.point_events; v_played int; v_points int; v_secs numeric;
begin
  if not exists (select 1 from public.learner_access where learner_id = p_learner and parent_id = auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtext(p_learner::text));   -- the same lock start_game_time takes
  select * into r from public.point_events
   where learner_id = p_learner and reason = 'game' and ends_at > now()
   order by ends_at desc limit 1 for update;
  if not found then return jsonb_build_object('ok', true, 'refunded', 0); end if;   -- nothing running: nothing to do

  v_secs := extract(epoch from now() - (r.ends_at - make_interval(mins => r.minutes)));
  -- minutes, for the daily limit: a started one counted; at least 1 (the column's own floor), at most what was bought
  v_played := least(r.minutes, greatest(1, ceil(v_secs / 60)::int));
  -- points, for the balance: the seconds played at the row's own price, up to a whole point; at least 1, at most paid
  v_points := -least(-r.points, greatest(1, ceil(v_secs * -r.points / (r.minutes * 60))::int));
  update public.point_events set minutes = v_played, points = v_points, ends_at = now() where id = r.id;
  return jsonb_build_object('ok', true, 'refunded', v_points - r.points);
end;
$$;

revoke all on function public.end_game_time(uuid) from public, anon;
grant execute on function public.end_game_time(uuid) to authenticated;
