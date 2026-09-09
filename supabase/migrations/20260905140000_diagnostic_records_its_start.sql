-- The diagnostic records that it STARTED, not only that it finished.
--
-- ⚠️ MEASURED ON PRODUCTION 2026-09-05: `completed_at` is NOT NULL DEFAULT now(), and the row is
-- only ever inserted by `sync_diagnostic` — which runs at COMPLETION. All 13 rows therefore have
-- `completed_at = started_at` EXACTLY, and every one is status='completed'. A child who opens the
-- probe and abandons it writes NOTHING.
--
-- So "how many start the check, how many finish it" had no denominator: the question could only
-- ever return 100%. That is the one-valued-metric shape CLAUDE.md already records — a number that
-- is incapable of expressing the comparison it claims to make, which is worse than no number,
-- because it gets believed and acted on.
--
-- ⚠️ SECURITY DEFINER ON `start_diagnostic` IS DELIBERATE AND IS A COPY OF AN EXISTING, REVIEWED
-- DECISION — NOT BOILERPLATE. `diagnostic_sessions` has exactly one policy, `diag_sessions_read`
-- (SELECT), and NO INSERT policy: every write is meant to go through a guarded RPC that checks
-- `learner_access` itself, which is why `sync_diagnostic` is DEFINER. This function repeats that
-- check verbatim and writes strictly less than `sync_diagnostic` does. It is called out here
-- because a DEFINER function runs as its owner and does not have RLS applied, and that must never
-- arrive as a side effect of copying a neighbour.
--
-- ⚠️ DEPLOY ORDER: the readers in this repo order by `completed_at DESC`, and in Postgres a NULL
-- sorts FIRST in DESC — so an in-progress row would become "the latest diagnosis" with a NULL root
-- gap. The client fix ships in the same commit as this file; the RPCs below are corrected here.

alter table public.diagnostic_sessions alter column completed_at drop not null;
alter table public.diagnostic_sessions alter column completed_at drop default;

comment on column public.diagnostic_sessions.completed_at is
  'When the probe was FINISHED, or NULL while it is still in progress. Rows written before '
  '2026-09-05 were inserted only at completion and all have completed_at = started_at. Any read '
  'that means "the latest diagnosis" must require status = ''completed''.';

-- ── the start ────────────────────────────────────────────────────────────────────────────────
-- One row per ATTEMPT, deduped on client_id (uq_diag_sessions_client, partial unique). A child who
-- abandons and comes back later is a genuinely new attempt and gets a new row — that IS the
-- abandonment signal, so it is not deduped away.
create or replace function public.start_diagnostic(
  p_learner_id uuid, p_band text, p_client_id uuid
) returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare
  v_session_id uuid;
begin
  if not exists (
    select 1 from public.learner_access
    where learner_id = p_learner_id and parent_id = auth.uid()
  ) then
    raise exception 'not authorized for learner %', p_learner_id using errcode = '42501';
  end if;
  if length(coalesce(p_band, '')) > 24 then
    raise exception 'diagnostic payload out of bounds' using errcode = '22023';
  end if;
  if p_client_id is null then
    raise exception 'client_id is required to start a diagnostic' using errcode = '22023';
  end if;

  insert into public.diagnostic_sessions
    (learner_id, band, status, blocked_skills, strengths, completed_at, client_id)
  values
    (p_learner_id, p_band, 'in_progress', '{}', '{}', null, p_client_id)
  on conflict (client_id) where client_id is not null do nothing
  returning id into v_session_id;

  -- Already started (a retry, or a reload of the same attempt): hand back the same row.
  if v_session_id is null then
    select id into v_session_id from public.diagnostic_sessions where client_id = p_client_id;
  end if;
  return v_session_id;
end;
$function$;

revoke all on function public.start_diagnostic(uuid, text, uuid) from public, anon;
grant execute on function public.start_diagnostic(uuid, text, uuid) to authenticated, service_role;

-- ── the finish ───────────────────────────────────────────────────────────────────────────────
-- Body is `pg_get_functiondef` output from production (2026-09-05). EXACTLY ONE BLOCK CHANGED:
-- the bare INSERT becomes "complete the row start_diagnostic opened, and INSERT only if there
-- isn't one". Everything else — the auth check, every bound, the items loop, the plan/free-chapter
-- logic, `SECURITY DEFINER`, `SET search_path` — is byte-identical to what is running now.
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
  v_free       text[];
begin
  if not exists (
    select 1 from public.learner_access
    where learner_id = p_learner_id and parent_id = auth.uid()
  ) then
    raise exception 'not authorized for learner %', p_learner_id using errcode = '42501';
  end if;
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

  -- ⚠️⚠️ THE ONE CHANGED BLOCK. Was a bare INSERT with completed_at = now(), which is why a
  -- started-and-abandoned probe left no trace at all. Now: finish the row `start_diagnostic`
  -- opened; fall back to inserting one when there is no start row (an older bundle, or a client
  -- that never called start).
  update public.diagnostic_sessions
     set status           = 'completed',
         band             = p_band,
         root_gap_skill   = p_root_gap,
         second_gap_skill = p_second_gap,
         blocked_skills   = coalesce(p_blocked, '{}'),
         strengths        = coalesce(p_strengths, '{}'),
         working_level    = p_working_level,
         completed_at     = now()
   where p_client_id is not null
     and client_id = p_client_id
     -- ⚠️ SCOPED TO THE AUTHORISED LEARNER. The guard at the top of this function proves the caller
     -- owns p_learner_id; without this line the UPDATE matched on client_id ALONE, so a caller
     -- authorised for one child could complete — and overwrite the gap of — another child's
     -- in-progress row if they knew its id. A v4 UUID makes that improbable, not impossible, and
     -- "improbable" is not the standard for a cross-family write in this app.
     and learner_id = p_learner_id
     and status = 'in_progress'
  returning id into v_session_id;

  if v_session_id is null then
    insert into public.diagnostic_sessions
      (learner_id, band, status, root_gap_skill, second_gap_skill, blocked_skills, strengths, working_level, completed_at, client_id)
    values
      (p_learner_id, p_band, 'completed', p_root_gap, p_second_gap,
       coalesce(p_blocked, '{}'), coalesce(p_strengths, '{}'), p_working_level, now(), p_client_id)
    on conflict (client_id) where client_id is not null do nothing
    returning id into v_session_id;
    -- Unchanged: an already-COMPLETED row for this client_id is an idempotent replay — hand back
    -- its id and do none of the plan work again.
    if v_session_id is null then
      select id into v_session_id from public.diagnostic_sessions where client_id = p_client_id;
      return v_session_id;
    end if;
  end if;

  if p_items is not null then
    for v_item in select * from jsonb_array_elements(p_items) loop
      insert into public.diagnostic_items (session_id, skill_id, correct, ordinal)
      values (v_session_id, v_item->>'skill', (v_item->>'correct')::boolean, v_ord);
      v_ord := v_ord + 1;
    end loop;
  end if;
  update public.diagnostic_plans set active = false
   where learner_id = p_learner_id and active;
  select coalesce(array_agg(c order by ord), '{}') into v_free
  from (
    select c, ord
    from unnest(coalesce(p_plan_chapters, '{}')) with ordinality as t(c, ord)
    where not exists (
      select 1 from public.learner_progress lp
      where lp.learner_id = p_learner_id and lp.chapter = t.c
    )
    order by ord
    limit 2
  ) s;
  insert into public.diagnostic_plans (learner_id, session_id, skill_sequence, chapter_sequence, free_chapters)
  values (p_learner_id, v_session_id, coalesce(p_plan_skills, '{}'), coalesce(p_plan_chapters, '{}'), v_free)
  returning id into v_plan_id;
  insert into public.diagnostic_plan_progress (plan_id, chapter_id, status)
  select v_plan_id, c, 'todo' from unnest(coalesce(p_plan_chapters, '{}')) as c;
  return v_session_id;
end;
$function$;

-- ── the readers ──────────────────────────────────────────────────────────────────────────────
-- ⚠️ IN POSTGRES A NULL SORTS **FIRST** UNDER `ORDER BY ... DESC`. So the moment an in-progress row
-- exists, every "the latest diagnosis" read that lacks `nulls last` picks it — and reports the
-- child's band and root gap as NULL. `get_learner_bootstrap` drives /menu's check-up card, so this
-- would have been the most visible half of the change and the easiest to miss: it is not a crash,
-- it is a child who quietly appears never to have been assessed.
--
-- Both bodies below are `pg_get_functiondef` output from production (2026-09-05) with ONE line
-- changed each, marked. ⚠️ `get_learner_bootstrap` is STABLE and NOT `SECURITY DEFINER` — it leans
-- on RLS plus its own learner_access check — and it stays that way. `sync_recheck` IS DEFINER and
-- stays that way. Neither privilege is altered here.

CREATE OR REPLACE FUNCTION public.get_learner_bootstrap(p_learner_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare v_role text;
begin
  select access_role into v_role
  from public.learner_access
  where learner_id = p_learner_id and parent_id = (select auth.uid());

  if v_role is null then return null; end if;

  return json_build_object(
    'role',     v_role,
    'stats',    (select to_json(s) from public.learner_stats s where s.learner_id = p_learner_id),
    'progress', (select coalesce(json_agg(p order by p.last_played_at desc nulls last), '[]'::json)
                 from public.learner_progress p where p.learner_id = p_learner_id),
    'state',    (select to_json(st) from public.learner_state st where st.learner_id = p_learner_id),
    'checkup',  (select json_build_object('band', d.band, 'root_gap_skill', d.root_gap_skill, 'completed_at', d.completed_at)
                 -- ⚠️ CHANGED: `and d.status = 'completed'`. Without it an in-progress row sorts
                 -- first (NULL completed_at, DESC) and the card reads as "assessed, no gap found".
                 from public.diagnostic_sessions d
                 where d.learner_id = p_learner_id and d.status = 'completed'
                 order by d.completed_at desc limit 1),
    'recheck_closed', coalesce((select r.gap_closed from public.diagnostic_rechecks r
                                where r.learner_id = p_learner_id order by r.created_at desc limit 1), false),
    'plan',     coalesce((select to_json(dp.chapter_sequence) from public.diagnostic_plans dp
                          where dp.learner_id = p_learner_id and dp.active
                          order by dp.created_at desc limit 1), '[]'::json)
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.sync_recheck(p_learner_id uuid, p_week integer, p_skill text, p_gap_closed boolean, p_client_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_session_id uuid;
  v_id         uuid;
begin
  if not exists (
    select 1 from public.learner_access
    where learner_id = p_learner_id and parent_id = auth.uid()
  ) then
    raise exception 'not authorized for learner %', p_learner_id using errcode = '42501';
  end if;

  select id into v_session_id
  from public.diagnostic_sessions
  -- ⚠️ CHANGED: `and status = 'completed'`. A recheck measures whether a DIAGNOSED gap closed, so
  -- attaching one to a probe that was abandoned half-way records a result about nothing.
  where learner_id = p_learner_id and status = 'completed'
  order by completed_at desc nulls last, started_at desc
  limit 1;

  if v_session_id is null then
    raise exception 'no diagnostic session for learner %', p_learner_id using errcode = 'P0002';
  end if;

  insert into public.diagnostic_rechecks (session_id, learner_id, week, skill_id, gap_closed, client_id)
  values (v_session_id, p_learner_id, p_week, p_skill, p_gap_closed, p_client_id)
  on conflict (client_id) where client_id is not null do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.diagnostic_rechecks where client_id = p_client_id;
  end if;

  return v_id;
end;
$function$;

-- Every pre-2026-09-05 row was inserted only at completion, so this is a no-op on production today
-- (13 of 13 are already 'completed'). It exists so the filters above cannot silently exclude
-- history if any row ever carried a different status.
update public.diagnostic_sessions set status = 'completed'
 where status is distinct from 'completed' and completed_at is not null;
