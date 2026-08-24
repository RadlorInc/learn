-- V2 (integrity) + V5 (input validation): stop the write RPCs trusting client-supplied economy
-- values and unbounded payloads.
--
-- V2 — sync_session previously wrote the client's xp/coins/stars verbatim, so a signed-in user could
-- rpc('sync_session', { p_xp: 1e9, p_coins: 1e9 }) for their OWN learner and forge the reward economy
-- + pollute /insights. Fix: clamp stars/correct/wrong to sane bounds and DERIVE xp + coins server-side
-- from the same formula the client uses (core/scoring.ts: xp = stars*50 + correct*10, coins = stars*5),
-- so legitimate sessions are byte-identical while inflated values are ignored. p_xp/p_coins are now
-- accepted-but-ignored (signature unchanged for client compatibility).

CREATE OR REPLACE FUNCTION public.sync_session(p_learner_id uuid, p_chapter text, p_phase text, p_correct integer, p_wrong integer, p_stars integer, p_xp integer, p_coins integer, p_client_id text, p_completed_at timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_existing_stars    INT := 0;
  v_existing_xp       INT := 0;
  v_existing_sessions INT := 0;
  v_total_xp          INT := 0;
  v_total_coins       INT := 0;
  v_streak            INT := 0;
  v_longest           INT := 0;
  v_last_played       TIMESTAMPTZ;
  v_today             DATE := NOW()::DATE;
  v_yesterday         DATE := (NOW() - INTERVAL '1 day')::DATE;
  v_level             INT := 1;
  v_thresholds        INT[] := ARRAY[0,500,1200,2500,4500,7000,10000,14000];
  i                   INT;
  -- V2: bounded inputs + server-derived economy (client xp/coins are ignored).
  v_stars             INT;
  v_correct           INT;
  v_wrong             INT;
  v_run_xp            INT;
  v_run_coins         INT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.learner_access
    WHERE learner_id = p_learner_id AND parent_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not authorized for learner %', p_learner_id USING ERRCODE = '42501';
  END IF;

  v_stars     := LEAST(GREATEST(COALESCE(p_stars, 0), 0), 3);
  v_correct   := LEAST(GREATEST(COALESCE(p_correct, 0), 0), 200);
  v_wrong     := LEAST(GREATEST(COALESCE(p_wrong, 0), 0), 200);
  v_run_xp    := v_stars * 50 + v_correct * 10;   -- derived, not trusted from client
  v_run_coins := v_stars * 5;                      -- derived, not trusted from client

  INSERT INTO public.sessions (
    learner_id, chapter, phase, correct_count, wrong_count,
    stars_earned, xp_earned, coins_earned, client_id, completed_at
  ) VALUES (
    p_learner_id, p_chapter, p_phase, v_correct, v_wrong,
    v_stars, v_run_xp, v_run_coins, p_client_id, p_completed_at
  ) ON CONFLICT (client_id) DO NOTHING;

  IF NOT FOUND THEN RETURN; END IF;

  SELECT best_stars, total_xp, total_sessions
  INTO v_existing_stars, v_existing_xp, v_existing_sessions
  FROM public.learner_progress
  WHERE learner_id = p_learner_id AND chapter = p_chapter;

  INSERT INTO public.learner_progress
    (learner_id, chapter, best_stars, total_xp, total_sessions, last_played_at)
  VALUES (
    p_learner_id, p_chapter,
    GREATEST(COALESCE(v_existing_stars, 0), v_stars),
    COALESCE(v_existing_xp, 0) + v_run_xp,
    COALESCE(v_existing_sessions, 0) + 1,
    p_completed_at
  ) ON CONFLICT (learner_id, chapter) DO UPDATE SET
    best_stars     = GREATEST(learner_progress.best_stars, v_stars),
    total_xp       = learner_progress.total_xp + v_run_xp,
    total_sessions = learner_progress.total_sessions + 1,
    last_played_at = p_completed_at;

  SELECT total_xp, total_coins, current_streak, longest_streak, last_played_at
  INTO v_total_xp, v_total_coins, v_streak, v_longest, v_last_played
  FROM public.learner_stats WHERE learner_id = p_learner_id;

  v_total_xp    := COALESCE(v_total_xp, 0) + v_run_xp;
  v_total_coins := COALESCE(v_total_coins, 0) + v_run_coins;

  IF v_last_played IS NULL THEN v_streak := 1;
  ELSIF v_last_played::DATE = v_today THEN v_streak := COALESCE(v_streak, 1);
  ELSIF v_last_played::DATE = v_yesterday THEN v_streak := COALESCE(v_streak, 0) + 1;
  ELSE v_streak := 1; END IF;

  v_longest := GREATEST(COALESCE(v_longest, 0), v_streak);

  FOR i IN REVERSE array_length(v_thresholds,1)..1 LOOP
    IF v_total_xp >= v_thresholds[i] THEN v_level := i; EXIT; END IF;
  END LOOP;

  INSERT INTO public.learner_stats
    (learner_id, total_xp, total_coins, current_level, current_streak, longest_streak, last_played_at)
  VALUES (p_learner_id, v_total_xp, v_total_coins, v_level, v_streak, v_longest, p_completed_at)
  ON CONFLICT (learner_id) DO UPDATE SET
    total_xp = v_total_xp, total_coins = v_total_coins, current_level = v_level,
    current_streak = v_streak, longest_streak = v_longest, last_played_at = p_completed_at;
END;
$function$;

-- V5 — sync_diagnostic accepted free-form band/skill strings and unbounded arrays / items JSON
-- (storage-amplification + aggregation-poisoning). Add cheap bounds; the RLS ownership guard is
-- unchanged and remains the access boundary.
CREATE OR REPLACE FUNCTION public.sync_diagnostic(p_learner_id uuid, p_band text, p_root_gap text, p_second_gap text, p_blocked text[], p_strengths text[], p_working_level text, p_plan_skills text[], p_plan_chapters text[], p_items jsonb, p_client_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_session_id uuid;
  v_plan_id    uuid;
  v_item       jsonb;
  v_ord        int := 0;
begin
  if not exists (
    select 1 from public.learner_access
    where learner_id = p_learner_id and parent_id = auth.uid()
  ) then
    raise exception 'not authorized for learner %', p_learner_id using errcode = '42501';
  end if;

  -- V5: bound the payload so a valid session can't amplify storage or poison aggregates.
  if length(coalesce(p_band, '')) > 24
     or length(coalesce(p_root_gap, '')) > 64
     or length(coalesce(p_second_gap, '')) > 64
     or length(coalesce(p_working_level, '')) > 64
     or coalesce(array_length(p_blocked, 1), 0) > 100
     or coalesce(array_length(p_strengths, 1), 0) > 100
     or coalesce(array_length(p_plan_skills, 1), 0) > 200
     or coalesce(array_length(p_plan_chapters, 1), 0) > 200 then
    raise exception 'diagnostic payload out of bounds' using errcode = '22023';
  end if;
  if p_items is not null then
    if jsonb_typeof(p_items) <> 'array' then
      raise exception 'items must be a json array' using errcode = '22023';
    end if;
    if jsonb_array_length(p_items) > 500 then
      raise exception 'diagnostic payload out of bounds' using errcode = '22023';
    end if;
  end if;

  insert into public.diagnostic_sessions
    (learner_id, band, status, root_gap_skill, second_gap_skill, blocked_skills, strengths, working_level, completed_at, client_id)
  values
    (p_learner_id, p_band, 'completed', p_root_gap, p_second_gap,
     coalesce(p_blocked, '{}'), coalesce(p_strengths, '{}'), p_working_level, now(), p_client_id)
  on conflict (client_id) where client_id is not null do nothing
  returning id into v_session_id;

  -- Already recorded (same client_id) → return the existing session, don't re-insert items/plan.
  if v_session_id is null then
    select id into v_session_id from public.diagnostic_sessions where client_id = p_client_id;
    return v_session_id;
  end if;

  if p_items is not null then
    for v_item in select * from jsonb_array_elements(p_items) loop
      insert into public.diagnostic_items (session_id, skill_id, correct, ordinal)
      values (v_session_id, v_item->>'skill', (v_item->>'correct')::boolean, v_ord);
      v_ord := v_ord + 1;
    end loop;
  end if;

  insert into public.diagnostic_plans (learner_id, session_id, skill_sequence, chapter_sequence)
  values (p_learner_id, v_session_id, coalesce(p_plan_skills, '{}'), coalesce(p_plan_chapters, '{}'))
  returning id into v_plan_id;

  insert into public.diagnostic_plan_progress (plan_id, chapter_id, status)
  select v_plan_id, c, 'todo' from unnest(coalesce(p_plan_chapters, '{}')) as c;

  return v_session_id;
end;
$function$;
