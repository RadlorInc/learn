-- Diagnostic engine — result persistence + secure write RPC.
--
-- Security model mirrors the rest of the app: WRITES go through a SECURITY DEFINER RPC
-- (public.sync_diagnostic) that checks learner_access ownership exactly like public.sync_session;
-- READS are RLS-gated to the owning parent. No client INSERT/UPDATE/DELETE policies are granted.
-- Skill/chapter references are TEXT ids (from src/lib/skillGraph.ts / chapters.ts) — the graph
-- itself lives in code, not the DB. Additive + reversible (no destructive statements).

-- ── Tables ──────────────────────────────────────────────────────────────────────
create table if not exists public.diagnostic_sessions (
  id               uuid primary key default gen_random_uuid(),
  learner_id       uuid not null references public.learners(id) on delete cascade,
  band             text not null,
  status           text not null default 'completed',
  root_gap_skill   text,
  second_gap_skill text,
  blocked_skills   text[] not null default '{}',
  strengths        text[] not null default '{}',
  working_level    text,
  started_at       timestamptz not null default now(),
  completed_at     timestamptz not null default now()
);

create table if not exists public.diagnostic_items (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.diagnostic_sessions(id) on delete cascade,
  skill_id   text not null,
  correct    boolean not null,
  ordinal    int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.diagnostic_plans (
  id               uuid primary key default gen_random_uuid(),
  learner_id       uuid not null references public.learners(id) on delete cascade,
  session_id       uuid references public.diagnostic_sessions(id) on delete set null,
  skill_sequence   text[] not null default '{}',
  chapter_sequence text[] not null default '{}',
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

create table if not exists public.diagnostic_plan_progress (
  id         uuid primary key default gen_random_uuid(),
  plan_id    uuid not null references public.diagnostic_plans(id) on delete cascade,
  skill_id   text not null default '',
  chapter_id text not null,
  status     text not null default 'todo',
  updated_at timestamptz not null default now()
);

create table if not exists public.diagnostic_rechecks (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.diagnostic_sessions(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  week       int  not null,
  skill_id   text not null,
  gap_closed boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_diag_sessions_learner on public.diagnostic_sessions(learner_id);
create index if not exists idx_diag_items_session    on public.diagnostic_items(session_id);
create index if not exists idx_diag_plans_learner    on public.diagnostic_plans(learner_id);
create index if not exists idx_diag_progress_plan    on public.diagnostic_plan_progress(plan_id);
create index if not exists idx_diag_rechecks_session on public.diagnostic_rechecks(session_id);

-- ── RLS: read-only for the owning parent (via learner_access); writes only via the RPC ──
alter table public.diagnostic_sessions      enable row level security;
alter table public.diagnostic_items         enable row level security;
alter table public.diagnostic_plans         enable row level security;
alter table public.diagnostic_plan_progress enable row level security;
alter table public.diagnostic_rechecks      enable row level security;

drop policy if exists diag_sessions_read on public.diagnostic_sessions;
create policy diag_sessions_read on public.diagnostic_sessions for select using (
  exists (select 1 from public.learner_access la where la.learner_id = diagnostic_sessions.learner_id and la.parent_id = auth.uid()));

drop policy if exists diag_items_read on public.diagnostic_items;
create policy diag_items_read on public.diagnostic_items for select using (
  exists (select 1 from public.diagnostic_sessions s join public.learner_access la on la.learner_id = s.learner_id
          where s.id = diagnostic_items.session_id and la.parent_id = auth.uid()));

drop policy if exists diag_plans_read on public.diagnostic_plans;
create policy diag_plans_read on public.diagnostic_plans for select using (
  exists (select 1 from public.learner_access la where la.learner_id = diagnostic_plans.learner_id and la.parent_id = auth.uid()));

drop policy if exists diag_progress_read on public.diagnostic_plan_progress;
create policy diag_progress_read on public.diagnostic_plan_progress for select using (
  exists (select 1 from public.diagnostic_plans p join public.learner_access la on la.learner_id = p.learner_id
          where p.id = diagnostic_plan_progress.plan_id and la.parent_id = auth.uid()));

drop policy if exists diag_rechecks_read on public.diagnostic_rechecks;
create policy diag_rechecks_read on public.diagnostic_rechecks for select using (
  exists (select 1 from public.learner_access la where la.learner_id = diagnostic_rechecks.learner_id and la.parent_id = auth.uid()));

-- ── Secure write: persist a completed diagnosis (session + items + plan) atomically ──
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
  p_items         jsonb
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
    (learner_id, band, status, root_gap_skill, second_gap_skill, blocked_skills, strengths, working_level, completed_at)
  values
    (p_learner_id, p_band, 'completed', p_root_gap, p_second_gap,
     coalesce(p_blocked, '{}'), coalesce(p_strengths, '{}'), p_working_level, now())
  returning id into v_session_id;

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

grant execute on function public.sync_diagnostic(uuid, text, text, text, text[], text[], text, text[], text[], jsonb) to authenticated;
