-- Step 8 — the week-N re-check writer (mirrors sync_diagnostic's security model).
-- Attaches the re-check to the learner's most recent diagnostic session (the FK target) and records
-- whether the root gap has closed. SECURITY DEFINER + learner_access ownership check; the table's
-- RLS stays read-only for the owning parent (writes only through this RPC).
create or replace function public.sync_recheck(
  p_learner_id uuid,
  p_week       int,
  p_skill      text,
  p_gap_closed boolean
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

  insert into public.diagnostic_rechecks (session_id, learner_id, week, skill_id, gap_closed)
  values (v_session_id, p_learner_id, p_week, p_skill, p_gap_closed)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.sync_recheck(uuid, int, text, boolean) to authenticated;
