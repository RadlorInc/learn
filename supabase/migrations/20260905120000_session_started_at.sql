-- sessions.started_at has never been a start time, and its NAME is why nobody looked.
--
-- ⚠️ MEASURED ON PRODUCTION 2026-09-05: all 49 session rows have a NEGATIVE duration
-- (median -1s, min -22s). `sync_session` never supplied `started_at`, so it took the column
-- default `now()` — the SERVER clock at INSERT — while `completed_at` is a CLIENT timestamp
-- stamped just before the call. Both mark the END of the chapter; the negative values are
-- network latency plus clock skew. Session length was never computable, and a dashboard
-- subtracting one from the other would have shown a confident, plausible-looking number.
--
-- Three changes:
--   1. a 12-arg overload that ACCEPTS a real chapter-start time from the client
--   2. `started_at` becomes NULLABLE, so "we do not know" is representable instead of being
--      silently filled with a fake. A row written by an older bundle now says so, rather than
--      contributing a fabricated zero to a median.
--   3. the old 10- and 11-arg signatures survive as shims passing NULL, because a deployed
--      bundle and the offline queue both keep calling them.
--
-- ⚠️ THE 49 EXISTING ROWS ARE LEFT ALONE, DELIBERATELY. Their `started_at` is meaningless as a
-- start but is the only server-side write time on the row. Any consumer MUST require
-- `started_at < completed_at`, which excludes exactly those 49.

alter table public.sessions alter column started_at drop not null;

comment on column public.sessions.started_at is
  'When the child OPENED the chapter (client clock), or NULL if unknown. Rows written before '
  '2026-09-05 hold the row INSERT time instead and are all >= completed_at: require '
  'started_at < completed_at before using this for a duration.';

create or replace function public.sync_session(
  p_learner_id uuid, p_chapter text, p_phase text, p_correct integer, p_wrong integer,
  p_stars integer, p_xp integer, p_coins integer, p_client_id text,
  p_completed_at timestamp with time zone, p_difficulty integer,
  p_started_at timestamp with time zone
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_existing_stars    INT := 0;
  v_existing_xp       INT := 0;
  v_existing_sessions INT := 0;
  v_total_xp          INT := 0;
  v_total_coins       INT := 0;
  v_level             INT := 1;
  v_thresholds        INT[] := ARRAY[0,500,1200,2500,4500,7000,10000,14000];
  i                   INT;
  v_stars             INT;
  v_correct           INT;
  v_wrong             INT;
  v_run_xp            INT;
  v_run_coins         INT;
  v_difficulty        INT;
  v_started_at        TIMESTAMPTZ;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.learner_access
    WHERE learner_id = p_learner_id AND parent_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not authorized for learner %', p_learner_id USING ERRCODE = '42501';
  END IF;
  IF NOT public.is_chapter_entitled(p_learner_id, p_chapter) THEN
    RAISE EXCEPTION 'chapter % is not included in this subscription', p_chapter USING ERRCODE = '42501';
  END IF;
  v_stars     := LEAST(GREATEST(COALESCE(p_stars, 0), 0), 3);
  v_correct   := LEAST(GREATEST(COALESCE(p_correct, 0), 0), 200);
  v_wrong     := LEAST(GREATEST(COALESCE(p_wrong, 0), 0), 200);
  v_run_xp    := v_stars * 50 + v_correct * 10;
  v_run_coins := v_stars * 5;
  v_difficulty := LEAST(GREATEST(COALESCE(p_difficulty, 1), 1), 3);

  -- ⚠️ CLAMPED, like every other client-supplied field above it. A start time is untrusted
  -- input: a broken clock or a hostile client could otherwise plant a 10-year session and move
  -- a median on its own. Never after the end, never more than 6h before it (no chapter is 6h of
  -- play, so a row sitting exactly at the cap is visibly capped rather than quietly wrong).
  -- NULL stays NULL — an unknown start must not become a fabricated zero.
  v_started_at := CASE WHEN p_started_at IS NULL THEN NULL ELSE
    LEAST(GREATEST(p_started_at, p_completed_at - INTERVAL '6 hours'), p_completed_at) END;

  INSERT INTO public.sessions (
    learner_id, chapter, phase, correct_count, wrong_count,
    stars_earned, xp_earned, coins_earned, client_id, completed_at, started_at
  ) VALUES (
    p_learner_id, p_chapter, p_phase, v_correct, v_wrong,
    v_stars, v_run_xp, v_run_coins, p_client_id, p_completed_at, v_started_at
  ) ON CONFLICT (client_id) DO NOTHING;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT best_stars, total_xp, total_sessions
  INTO v_existing_stars, v_existing_xp, v_existing_sessions
  FROM public.learner_progress
  WHERE learner_id = p_learner_id AND chapter = p_chapter;
  INSERT INTO public.learner_progress
    (learner_id, chapter, best_stars, total_xp, total_sessions, last_played_at, current_level)
  VALUES (
    p_learner_id, p_chapter,
    GREATEST(COALESCE(v_existing_stars, 0), v_stars),
    COALESCE(v_existing_xp, 0) + v_run_xp,
    COALESCE(v_existing_sessions, 0) + 1,
    p_completed_at,
    v_difficulty
  ) ON CONFLICT (learner_id, chapter) DO UPDATE SET
    best_stars     = GREATEST(learner_progress.best_stars, v_stars),
    total_xp       = learner_progress.total_xp + v_run_xp,
    total_sessions = learner_progress.total_sessions + 1,
    last_played_at = p_completed_at,
    current_level  = v_difficulty;
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

-- Older signatures: a deployed bundle and anything already sitting in the offline queue keep
-- calling these. They pass NULL, which now honestly means "this client did not tell us".
create or replace function public.sync_session(
  p_learner_id uuid, p_chapter text, p_phase text, p_correct integer, p_wrong integer,
  p_stars integer, p_xp integer, p_coins integer, p_client_id text,
  p_completed_at timestamp with time zone, p_difficulty integer
) RETURNS void LANGUAGE sql SET search_path TO 'public' AS $function$
  SELECT public.sync_session(p_learner_id, p_chapter, p_phase, p_correct, p_wrong,
                             p_stars, p_xp, p_coins, p_client_id, p_completed_at,
                             p_difficulty, NULL::timestamptz);
$function$;

revoke all on function public.sync_session(uuid,text,text,integer,integer,integer,integer,integer,text,timestamptz,integer,timestamptz) from public, anon;
grant execute on function public.sync_session(uuid,text,text,integer,integer,integer,integer,integer,text,timestamptz,integer,timestamptz) to authenticated, service_role;
-- matches the existing 10- and 11-arg ACLs exactly ({postgres,authenticated,service_role}=X), measured
-- on production 2026-09-05. A REVOKE without its paired GRANT is half a check: the caller that
-- matters here is `authenticated`, and service_role is what the seat/webhook paths arrive as.
