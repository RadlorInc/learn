-- Product change (founder decision, 2026-07-04): remove the day-streak completely.
-- Step 1 of 2 (non-destructive): stop sync_session computing/writing current_streak & longest_streak.
-- The columns are dropped in the follow-up migration 20260705161328_drop_streak_columns.sql; keeping
-- the drop separate lets the destructive DDL go through the pipeline's prod-approval gate on its own.
--
-- Defensive: pin a DEFAULT 0 on the streak columns first, so this redefinition's INSERT (which no
-- longer lists them) succeeds even if the base schema left them NOT NULL without a default. Harmless
-- once the columns are dropped in step 2.
ALTER TABLE public.learner_stats
  ALTER COLUMN current_streak SET DEFAULT 0,
  ALTER COLUMN longest_streak SET DEFAULT 0;

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

  SELECT total_xp, total_coins
  INTO v_total_xp, v_total_coins
  FROM public.learner_stats WHERE learner_id = p_learner_id;

  v_total_xp    := COALESCE(v_total_xp, 0) + v_run_xp;
  v_total_coins := COALESCE(v_total_coins, 0) + v_run_coins;

  FOR i IN REVERSE array_length(v_thresholds,1)..1 LOOP
    IF v_total_xp >= v_thresholds[i] THEN v_level := i; EXIT; END IF;
  END LOOP;

  INSERT INTO public.learner_stats
    (learner_id, total_xp, total_coins, current_level, last_played_at)
  VALUES (p_learner_id, v_total_xp, v_total_coins, v_level, p_completed_at)
  ON CONFLICT (learner_id) DO UPDATE SET
    total_xp = v_total_xp, total_coins = v_total_coins, current_level = v_level,
    last_played_at = p_completed_at;
END;
$function$;
