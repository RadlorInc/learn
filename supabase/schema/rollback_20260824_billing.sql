-- ═══════════════════════════════════════════════════════════════════════════════════════════════
--  ROLLBACK for 20260824090000_billing_schema.sql + 20260824120000_plan_entitlement.sql
--  Captured from PRODUCTION 2026-08-24, BEFORE either was applied. Step 1 of the apply sequence in
--  docs/runbooks/applying-migrations.md.
--
--  ⚠️ THIS IS NOT A BACKUP. It restores what these two migrations replace and nothing else. There is
--  still no backup of the children's data and no PITR — launch blocker B12.
--
--  ⚠️⚠️ CAPTURING THIS IS WHAT CAUGHT A REVERTED SECURITY FIX. `plan_entitlement.sql` had rebuilt
--  `sync_diagnostic` from `20260702131627_diagnostic_idempotency` — OLDER than
--  `20260703014331_harden_rpc_inputs` — so applying it would have silently dropped the V5 payload
--  bounds. The same class as `leads_server_only`, on the same day the runbook rule was written. The
--  source grep that said nothing newer redefined it was CASE-SENSITIVE and the hardening file writes
--  `CREATE OR REPLACE FUNCTION` in capitals. Reading production is what found it.
-- ═══════════════════════════════════════════════════════════════════════════════════════════════

-- ── 1. The two policies these migrations replace ────────────────────────────
-- ⚠️ Verbatim `pg_policies` output with ONE hand correction: an INSERT policy takes WITH CHECK only,
-- and the capture emitted `using (true)` for it (pg_policies reports a null qual there). A captured
-- rollback still has to be READ before it is trusted.
drop policy if exists "sessions: parent can insert" on public.sessions;
create policy "sessions: parent can insert" on public.sessions for insert to public
  with check ((EXISTS ( SELECT 1
   FROM learner_access la
  WHERE ((la.learner_id = sessions.learner_id) AND (la.parent_id = ( SELECT auth.uid() AS uid))))));

drop policy if exists "learner_progress: parent access" on public.learner_progress;
create policy "learner_progress: parent access" on public.learner_progress for all to public
  using ((EXISTS ( SELECT 1
   FROM learner_access la
  WHERE ((la.learner_id = learner_progress.learner_id) AND (la.parent_id = ( SELECT auth.uid() AS uid))))))
  with check ((EXISTS ( SELECT 1
   FROM learner_access la
  WHERE ((la.learner_id = learner_progress.learner_id) AND (la.parent_id = ( SELECT auth.uid() AS uid))))));

-- ── 2. The three replaced FUNCTION definitions, VERBATIM AND RUNNABLE ───────
-- ⚠️ THEY ARE PASTED HERE RATHER THAN REFERENCED. The first draft of this file pointed at the two
-- migrations that produce them, on the (measured, correct) grounds that production's live bodies
-- hash identically to those files. That is a fine VERIFICATION and a useless ROLLBACK: on the worst
-- day nobody wants to be told to replay part of a file. A rollback nobody can run is a document.
--
-- Extracted mechanically from those migrations — no transcription — and CI RUNS THIS WHOLE FILE and
-- then asserts the bodies hash back to what was captured from production on 2026-08-24:
--
--   sync_diagnostic(… 11 args)              cf46a74591aa0bbf809f69726e483e5f
--   sync_session(… 10 args)                 ab108f90b7f9823ae7ededdce89ca444
--   sync_session(…, p_difficulty integer)   d1c9cab3c6a5afa869958a4ef2345cef
--
-- ⚠️ If a hash no longer matches, production has moved and this file is no longer its rollback:
--   select p.proname, pg_get_function_identity_arguments(p.oid),
--          md5(lower(regexp_replace(regexp_replace(p.prosrc,'--[^\n]*','','g'),'\s+','','g')))
--   from pg_proc p join pg_namespace n on n.oid=p.pronamespace
--   where n.nspname='public' and p.proname in ('sync_session','sync_diagnostic');

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

-- Restore the ACLs the definitions above do not carry.
revoke all on function public.sync_diagnostic(uuid, text, text, text, text[], text[], text, text[], text[], jsonb, uuid) from public, anon;
grant execute on function public.sync_diagnostic(uuid, text, text, text, text[], text[], text, text[], text[], jsonb, uuid) to authenticated, service_role;
revoke all on function public.sync_session(uuid, text, text, integer, integer, integer, integer, integer, text, timestamp with time zone, integer) from public, anon;
grant execute on function public.sync_session(uuid, text, text, integer, integer, integer, integer, integer, text, timestamp with time zone, integer) to authenticated, service_role;

-- ── 3. diagnostic_plans — the ONLY row mutation in either migration ─────────
-- All 14 rows were `active = true` at capture time and NO learner had two, so the backfill is a
-- no-op today. Captured anyway: it stops being one the moment anybody retakes the check.
update public.diagnostic_plans set active = true where id in (
  '0a0bf3d7-5fdf-43c2-a06f-6803c7f4ef59','2602260a-8d0c-4451-b7ce-f7cd20ab9c6b',
  '2eb5d84a-2881-4a10-af6c-288a918378ca','2ec65e8f-68ea-43db-9a7f-76e587e8598a',
  '32e9ae3d-b5c3-490c-9cd1-fb4ffdfa3bc9','37af8ec1-98bf-4523-a81f-dd0b8a409aa2',
  '52013513-9ec6-4af1-8230-648513fc9f21','5e39954a-bcba-4a60-8d6f-326d933643f1',
  '6b48a3b8-5045-4d06-8192-27cb9a06eb05','759d3703-7892-4be5-a3b4-60bade457e04',
  '9bdc9fca-ab46-443d-9dd1-e0f88a42a0bd','a8729d23-10fe-4e73-a098-71e30bc22007',
  'b36a7776-38d4-4422-ab2c-b3a1b41e7998','c2e42db4-379b-428c-9012-39933d340826');
drop index if exists public.diagnostic_plans_one_active_per_learner;
alter table public.diagnostic_plans drop column if exists free_chapters;
alter table public.diagnostic_plans drop column if exists revised_chapter;

-- ── 4. Everything else the migrations ADD simply goes ───────────────────────
-- All of it is new and empty at rollback time: three billing tables created empty and one config
-- row. No child data is touched by either migration, which is the only reason this is a
-- proportionate safety net while B12 is open.
drop function if exists public.entitle_revised_step(uuid, text);
drop function if exists public.reassign_learner_seat(uuid, uuid);
drop function if exists public.is_chapter_entitled(uuid, text);
drop table if exists public.subscription_seats;
drop table if exists public.subscriptions;
drop table if exists public.billing_events;
drop table if exists public.billing_config;
alter table public.chapters drop column if exists is_free;
