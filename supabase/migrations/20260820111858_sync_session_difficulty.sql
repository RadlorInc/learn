-- Cross-device difficulty memory (founder's call, 2026-08-20).
--
-- The adaptive tier a child left a chapter on was device-local: `infra/storage/chapterLevel` writes
-- it to IndexedDB and the finished-session payload never carried it, so a second device — or a
-- cleared browser — put every chapter back to easy and nothing in the app could tell.
--
-- ⚠️ NO NEW COLUMN. `learner_progress.current_level` (smallint NOT NULL DEFAULT 1) has existed since
-- the base schema, is written by nothing, and is read by nothing — every `current_level` in the app
-- is `learner_stats.current_level`, which is the XP level and a different table. Measured on prod
-- 2026-08-20: 29 rows, all 1, i.e. the column default. It is exactly the right shape, so it is used
-- rather than a second one added beside it.
COMMENT ON COLUMN public.learner_progress.current_level IS
  'Adaptive DIFFICULTY tier (1-3) this learner left this chapter on. NOT the XP level — that is learner_stats.current_level.';

-- ⚠️ TWO ARITIES ON PURPOSE, AND NEITHER TAKES A DEFAULT. A defaulted 11th argument would leave a
-- 10-named-argument call ambiguous between the two, and PostgREST resolves by name — so an app still
-- running the previous JS bundle would start failing its sync mid-deploy. The old signature is kept
-- as a thin forwarder instead; it can be dropped once no old bundle can still be open.
CREATE OR REPLACE FUNCTION public.sync_session(
  p_learner_id uuid, p_chapter text, p_phase text, p_correct integer, p_wrong integer,
  p_stars integer, p_xp integer, p_coins integer, p_client_id text,
  p_completed_at timestamp with time zone, p_difficulty integer)
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
  v_stars             INT;
  v_correct           INT;
  v_wrong             INT;
  v_run_xp            INT;
  v_run_coins         INT;
  v_difficulty        INT;
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
  -- Bounded like every other client input on this RPC.
  v_difficulty := LEAST(GREATEST(COALESCE(p_difficulty, 1), 1), 3);

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
    -- ⚠️ LAST WRITE WINS, NOT GREATEST. A demotion is the half of adaptive that matters most: a
    -- child who has struggled back down to tier 1 must not be handed tier 3 again by a monotonic
    -- merge. Stars and XP are achievements and stay monotonic; the tier is a CURRENT FIT.
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

-- The previous signature, now a forwarder, so a browser holding the old bundle keeps syncing.
CREATE OR REPLACE FUNCTION public.sync_session(
  p_learner_id uuid, p_chapter text, p_phase text, p_correct integer, p_wrong integer,
  p_stars integer, p_xp integer, p_coins integer, p_client_id text,
  p_completed_at timestamp with time zone)
 RETURNS void
 -- SECURITY INVOKER on purpose: the real authorisation check lives in the 11-argument version this
 -- forwards to, and `auth.uid()` there reads the request's JWT claim either way. A DEFINER wrapper
 -- would add privilege surface for nothing.
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  SELECT public.sync_session(p_learner_id, p_chapter, p_phase, p_correct, p_wrong,
                             p_stars, p_xp, p_coins, p_client_id, p_completed_at, 1);
$function$;

-- Mirror the 10-argument version's ACL exactly, read off prod 2026-08-20:
--   postgres=X | authenticated=X | service_role=X   (no PUBLIC, no anon)
REVOKE ALL ON FUNCTION public.sync_session(uuid, text, text, integer, integer, integer, integer, integer, text, timestamp with time zone, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_session(uuid, text, text, integer, integer, integer, integer, integer, text, timestamp with time zone, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.sync_session(uuid, text, text, integer, integer, integer, integer, integer, text, timestamp with time zone, integer) TO authenticated, service_role;
