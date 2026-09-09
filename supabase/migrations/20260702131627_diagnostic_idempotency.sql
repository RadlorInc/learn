-- Make the diagnostic + re-check writers IDEMPOTENT.
--
-- Why: sync_diagnostic / sync_recheck each did an unconditional INSERT with a fresh gen_random_uuid(),
-- so a retry (the new offline queue re-flushing a save, a double network attempt, a lost success
-- response) would create DUPLICATE diagnosis/re-check rows — and getLatestGap's "most recent" then
-- becomes nondeterministic. Fix: a client-generated dedupe key (client_id) + ON CONFLICT DO NOTHING,
-- exactly like sync_session's p_client_id model. Additive + reversible.
--
-- DEPLOY ORDER: apply this migration BEFORE deploying the client that sends p_client_id — the client
-- calls the new (…, uuid) signature, which doesn't exist until this runs.

-- ── Dedupe columns + partial unique indexes (NULL client_id = legacy call, never deduped) ──
alter table public.diagnostic_sessions add column if not exists client_id uuid;
alter table public.diagnostic_rechecks add column if not exists client_id uuid;

create unique index if not exists uq_diag_sessions_client on public.diagnostic_sessions(client_id) where client_id is not null;
create unique index if not exists uq_diag_rechecks_client on public.diagnostic_rechecks(client_id) where client_id is not null;

-- ── sync_diagnostic: add a trailing p_client_id; short-circuit on a repeat ──
drop function if exists public.sync_diagnostic(uuid, text, text, text, text[], text[], text, text[], text[], jsonb);

create or replace function public.sync_diagnostic(
  p_learner_id    uuid,
  p_band          text,
  p_root_gap      text,
  p_second_gap    text,
  p_blocked       text[],
  p_strengths     text[],
  p_working_level text,
  p_plan_skills   text[],
  p_plan_chapters text[],
  p_items         jsonb,
  p_client_id     uuid default null
) returns uuid
  language plpgsql
  security definer
  set search_path to 'public'
as $$
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
$$;

grant execute on function public.sync_diagnostic(uuid, text, text, text, text[], text[], text, text[], text[], jsonb, uuid) to authenticated;

-- ── sync_recheck: same treatment ──
drop function if exists public.sync_recheck(uuid, int, text, boolean);

create or replace function public.sync_recheck(
  p_learner_id uuid,
  p_week       int,
  p_skill      text,
  p_gap_closed boolean,
  p_client_id  uuid default null
) returns uuid
  language plpgsql
  security definer
  set search_path to 'public'
as $$
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
  where learner_id = p_learner_id
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
$$;

grant execute on function public.sync_recheck(uuid, int, text, boolean, uuid) to authenticated;
