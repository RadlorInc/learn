-- ============================================================================
--  BASELINE SCHEMA — the tables that were never in supabase/migrations/
--
--  ⚠️ WHY THIS EXISTS. `security_baseline.sql` has warned since 2026-07 that "the base
--  tables + their RLS were created in the Supabase dashboard, not in supabase/migrations/,
--  so they were invisible to code review." That was recorded as a review blind spot. It is
--  also, it turns out, a HARD BLOCKER on ever running the RLS regression suite anywhere but
--  production: seven tables — profiles, learners, learner_access, sessions, learner_progress,
--  learner_stats, learner_invites — are created by ZERO migrations, so a fresh database built
--  from `supabase/migrations/*` alone does not have them, and rls_regression.sql dies at setup
--  on `relation "public.learners" does not exist`.
--
--  This file closes that. Every object is generated from the live production catalog
--  (pg_class / pg_constraint / pg_indexes / pg_policies / pg_get_functiondef /
--  pg_get_triggerdef / relacl), NOT hand-written from memory.
--
--  ⚠️⚠️ WHAT IT MAY AND MAY NOT CONTAIN — this is the rule, and it is not the obvious one.
--  It ran the migrations after itself and they collided, which is how the rule was found:
--    · `create table` / `create index` / `create trigger` are written IF NOT EXISTS or
--      drop-then-create by every migration here, so duplicating them is a harmless no-op.
--      All 20 tables are kept, because the seven base tables' foreign keys point at the
--      other thirteen and must resolve at the moment this file runs.
--    · `CREATE POLICY` HAS NO `IF NOT EXISTS`, in any version of Postgres. So the 21
--      policies that a migration creates MUST NOT be created here — the migration would
--      hit 42710 `policy already exists` and the run dies. Only the 12 that no migration
--      owns live here.
--    · Same for the three indexes the migrations create unguarded (auth_events_user_time,
--      error_events_at, error_events_learner).
--  `src/__tests__/baselineSchema.test.ts` asserts this so the next person cannot
--  re-introduce it by pasting a fuller dump.
--
--  ⚠️ IT IS DELIBERATELY *NOT* IN supabase/migrations/. Two reasons:
--    1. Ordering — it would have to sort before 67 existing migrations, and Supabase would then
--       try to apply a backdated version to production, where every one of these objects already
--       exists.
--    2. `create policy` has no IF NOT EXISTS, so making it idempotent needs `drop policy` first —
--       and dropping a live policy on production, even for microseconds, is not a thing to do for
--       the convenience of a test harness.
--  CI applies it explicitly to a THROWAWAY local database, before the migrations. Production
--  never sees it. See .github/workflows/ci.yml.
--
--  ⚠️ KEEPING IT HONEST. This file drifts the moment someone changes the schema in the dashboard
--  again — and a stale baseline means the RLS suite passes against a database that is not the one
--  we ship. Regenerate it the same way `security_baseline.sql` is regenerated (docs/security.md),
--  and treat a non-empty diff as a schema change that needs review.
--
--  Applied as the `postgres` superuser against a local stack. Order matters: enums → tables →
--  constraints → indexes → functions → triggers → RLS → policies → grants.
-- ============================================================================

-- ── Extensions (prod has these; local Supabase ships them) ──────────────────
create extension if not exists pgcrypto with schema extensions;

-- ── Enums ───────────────────────────────────────────────────────────────────
do $$ begin
  create type public.invite_status as enum ('pending', 'accepted', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.user_role as enum ('parent', 'learner', 'teacher');
exception when duplicate_object then null; end $$;

-- ── Tables ──────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid not null,
  role user_role,
  display_name text default ''::text not null,
  avatar_index smallint default 0 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.chapters (
  id text not null,
  name text not null,
  emoji text not null,
  sort_order integer not null,
  age_groups text[] default '{}'::text[] not null
);

create table if not exists public.grades (
  id uuid default gen_random_uuid() not null,
  created_by uuid not null,
  name text not null,
  age_group text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.grade_chapters (
  grade_id uuid not null,
  chapter_id text not null,
  sort_order integer default 0 not null
);

create table if not exists public.learners (
  id uuid default gen_random_uuid() not null,
  display_name text not null,
  avatar_index smallint default 0 not null,
  created_by uuid not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  age_group text default '3-5'::text not null,
  grade_id uuid
);

create table if not exists public.learner_access (
  id uuid default gen_random_uuid() not null,
  learner_id uuid not null,
  parent_id uuid not null,
  access_role text default 'viewer'::text not null,
  granted_at timestamp with time zone default now() not null
);

create table if not exists public.learner_invites (
  id uuid default gen_random_uuid() not null,
  learner_id uuid not null,
  invited_by uuid not null,
  invited_email text not null,
  status invite_status default 'pending'::invite_status not null,
  expires_at timestamp with time zone default (now() + '7 days'::interval) not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.sessions (
  id uuid default gen_random_uuid() not null,
  learner_id uuid not null,
  chapter text not null,
  phase text default 'practice'::text not null,
  started_at timestamp with time zone default now() not null,
  completed_at timestamp with time zone,
  correct_count smallint default 0 not null,
  wrong_count smallint default 0 not null,
  stars_earned smallint default 0 not null,
  xp_earned integer default 0 not null,
  coins_earned integer default 0 not null,
  client_id text
);

create table if not exists public.learner_progress (
  id uuid default gen_random_uuid() not null,
  learner_id uuid not null,
  chapter text not null,
  best_stars smallint default 0 not null,
  total_xp integer default 0 not null,
  total_sessions integer default 0 not null,
  last_played_at timestamp with time zone,
  current_level smallint default 1 not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.learner_stats (
  learner_id uuid not null,
  total_xp integer default 0 not null,
  total_coins integer default 0 not null,
  current_level smallint default 1 not null,
  last_played_at timestamp with time zone,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.learner_state (
  learner_id uuid not null,
  coins_spent integer default 0 not null,
  owned_items text[] default '{}'::text[] not null,
  equipped_items jsonb default '{}'::jsonb not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.learner_events (
  id uuid default gen_random_uuid() not null,
  learner_id uuid not null,
  event text not null,
  props jsonb default '{}'::jsonb not null,
  client_id text,
  client_ts timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.auth_events (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  event text not null,
  client_id uuid,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.error_events (
  id uuid default gen_random_uuid() not null,
  at timestamp with time zone default now() not null,
  source text not null,
  message text not null,
  stack text,
  component_stack text,
  url text,
  ua text,
  method text,
  route_path text,
  digest text,
  learner_id uuid
);

create table if not exists public.diagnostic_leads (
  id uuid default gen_random_uuid() not null,
  email text not null,
  band text,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.diagnostic_sessions (
  id uuid default gen_random_uuid() not null,
  learner_id uuid not null,
  band text not null,
  status text default 'completed'::text not null,
  root_gap_skill text,
  second_gap_skill text,
  blocked_skills text[] default '{}'::text[] not null,
  strengths text[] default '{}'::text[] not null,
  working_level text,
  started_at timestamp with time zone default now() not null,
  completed_at timestamp with time zone default now() not null,
  client_id uuid
);

create table if not exists public.diagnostic_items (
  id uuid default gen_random_uuid() not null,
  session_id uuid not null,
  skill_id text not null,
  correct boolean not null,
  ordinal integer default 0 not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.diagnostic_plans (
  id uuid default gen_random_uuid() not null,
  learner_id uuid not null,
  session_id uuid,
  skill_sequence text[] default '{}'::text[] not null,
  chapter_sequence text[] default '{}'::text[] not null,
  active boolean default true not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.diagnostic_plan_progress (
  id uuid default gen_random_uuid() not null,
  plan_id uuid not null,
  skill_id text default ''::text not null,
  chapter_id text not null,
  status text default 'todo'::text not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.diagnostic_rechecks (
  id uuid default gen_random_uuid() not null,
  session_id uuid not null,
  learner_id uuid not null,
  week integer not null,
  skill_id text not null,
  gap_closed boolean not null,
  created_at timestamp with time zone default now() not null,
  client_id uuid
);

-- ── Constraints ─────────────────────────────────────────────────────────────
-- Wrapped so the file is re-runnable: `add constraint` has no IF NOT EXISTS, and a
-- single bare failure would abort every statement after it.
do $$
declare s text;
begin
  foreach s in array array[
    'alter table public.profiles add constraint profiles_pkey primary key (id)',
    'alter table public.chapters add constraint chapters_pkey primary key (id)',
    'alter table public.grades add constraint grades_pkey primary key (id)',
    'alter table public.grade_chapters add constraint grade_chapters_pkey primary key (grade_id, chapter_id)',
    'alter table public.learners add constraint learners_pkey primary key (id)',
    'alter table public.learner_access add constraint learner_access_pkey primary key (id)',
    'alter table public.learner_invites add constraint learner_invites_pkey primary key (id)',
    'alter table public.sessions add constraint sessions_pkey primary key (id)',
    'alter table public.learner_progress add constraint learner_progress_pkey primary key (id)',
    'alter table public.learner_stats add constraint learner_stats_pkey primary key (learner_id)',
    'alter table public.learner_state add constraint learner_state_pkey primary key (learner_id)',
    'alter table public.learner_events add constraint learner_events_pkey primary key (id)',
    'alter table public.auth_events add constraint auth_events_pkey primary key (id)',
    'alter table public.error_events add constraint error_events_pkey primary key (id)',
    'alter table public.diagnostic_leads add constraint diagnostic_leads_pkey primary key (id)',
    'alter table public.diagnostic_sessions add constraint diagnostic_sessions_pkey primary key (id)',
    'alter table public.diagnostic_items add constraint diagnostic_items_pkey primary key (id)',
    'alter table public.diagnostic_plans add constraint diagnostic_plans_pkey primary key (id)',
    'alter table public.diagnostic_plan_progress add constraint diagnostic_plan_progress_pkey primary key (id)',
    'alter table public.diagnostic_rechecks add constraint diagnostic_rechecks_pkey primary key (id)',

    'alter table public.auth_events add constraint auth_events_client_id_key unique (client_id)',
    'alter table public.learner_access add constraint learner_access_learner_id_parent_id_key unique (learner_id, parent_id)',
    'alter table public.learner_events add constraint learner_events_client_id_key unique (client_id)',
    'alter table public.learner_progress add constraint learner_progress_learner_id_chapter_key unique (learner_id, chapter)',
    'alter table public.sessions add constraint sessions_client_id_key unique (client_id)',

    'alter table public.auth_events add constraint auth_events_event_check check ((event = any (array[''login''::text, ''logout''::text])))',
    'alter table public.diagnostic_leads add constraint diagnostic_leads_band_check check (((band is null) or (char_length(band) <= 24)))',
    'alter table public.diagnostic_leads add constraint diagnostic_leads_email_check check (((char_length(email) >= 3) and (char_length(email) <= 254)))',
    'alter table public.error_events add constraint error_events_component_stack_check check (((component_stack is null) or (char_length(component_stack) <= 2000)))',
    'alter table public.error_events add constraint error_events_digest_check check (((digest is null) or (char_length(digest) <= 100)))',
    'alter table public.error_events add constraint error_events_message_check check ((char_length(message) <= 500))',
    'alter table public.error_events add constraint error_events_method_check check (((method is null) or (char_length(method) <= 10)))',
    'alter table public.error_events add constraint error_events_route_path_check check (((route_path is null) or (char_length(route_path) <= 300)))',
    'alter table public.error_events add constraint error_events_source_check check ((source = any (array[''client''::text, ''server''::text])))',
    'alter table public.error_events add constraint error_events_stack_check check (((stack is null) or (char_length(stack) <= 2000)))',
    'alter table public.error_events add constraint error_events_ua_check check (((ua is null) or (char_length(ua) <= 300)))',
    'alter table public.error_events add constraint error_events_url_check check (((url is null) or (char_length(url) <= 500)))',
    'alter table public.grades add constraint grades_age_group_check check ((age_group = any (array[''3-5''::text, ''6-8''::text, ''9-11''::text, ''12-14''::text, ''15-16''::text, ''17-18''::text])))',
    'alter table public.grades add constraint grades_name_check check (((char_length(trim(both from name)) >= 1) and (char_length(trim(both from name)) <= 60)))',
    'alter table public.learner_access add constraint learner_access_access_role_check check ((access_role = any (array[''owner''::text, ''viewer''::text])))',
    'alter table public.learner_progress add constraint learner_progress_best_stars_check check (((best_stars >= 0) and (best_stars <= 3)))',
    'alter table public.learners add constraint learners_age_group_check check ((age_group = any (array[''3-5''::text, ''6-8''::text, ''9-11''::text, ''12-14''::text, ''15-16''::text, ''17-18''::text])))',
    'alter table public.learners add constraint learners_avatar_index_check check (((avatar_index >= 0) and (avatar_index <= 3)))',
    'alter table public.profiles add constraint profiles_avatar_index_check check (((avatar_index >= 0) and (avatar_index <= 3)))',
    'alter table public.sessions add constraint sessions_phase_check check ((phase = any (array[''lesson''::text, ''practice''::text])))',
    'alter table public.sessions add constraint sessions_stars_earned_check check (((stars_earned >= 0) and (stars_earned <= 3)))',

    'alter table public.profiles add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade',
    'alter table public.auth_events add constraint auth_events_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade',
    'alter table public.grades add constraint grades_created_by_fkey foreign key (created_by) references auth.users(id) on delete cascade',
    'alter table public.grade_chapters add constraint grade_chapters_chapter_id_fkey foreign key (chapter_id) references public.chapters(id) on delete cascade',
    'alter table public.grade_chapters add constraint grade_chapters_grade_id_fkey foreign key (grade_id) references public.grades(id) on delete cascade',
    'alter table public.learners add constraint learners_created_by_fkey foreign key (created_by) references public.profiles(id) on delete restrict',
    'alter table public.learners add constraint learners_grade_id_fkey foreign key (grade_id) references public.grades(id) on delete set null',
    'alter table public.learner_access add constraint learner_access_learner_id_fkey foreign key (learner_id) references public.learners(id) on delete cascade',
    'alter table public.learner_access add constraint learner_access_parent_id_fkey foreign key (parent_id) references public.profiles(id) on delete cascade',
    'alter table public.learner_invites add constraint learner_invites_invited_by_fkey foreign key (invited_by) references public.profiles(id) on delete cascade',
    'alter table public.learner_invites add constraint learner_invites_learner_id_fkey foreign key (learner_id) references public.learners(id) on delete cascade',
    'alter table public.sessions add constraint sessions_chapter_fkey foreign key (chapter) references public.chapters(id)',
    'alter table public.sessions add constraint sessions_learner_id_fkey foreign key (learner_id) references public.learners(id) on delete cascade',
    'alter table public.learner_progress add constraint learner_progress_chapter_fkey foreign key (chapter) references public.chapters(id)',
    'alter table public.learner_progress add constraint learner_progress_learner_id_fkey foreign key (learner_id) references public.learners(id) on delete cascade',
    'alter table public.learner_stats add constraint learner_stats_learner_id_fkey foreign key (learner_id) references public.learners(id) on delete cascade',
    'alter table public.learner_state add constraint learner_state_learner_id_fkey foreign key (learner_id) references public.learners(id) on delete cascade',
    'alter table public.learner_events add constraint learner_events_learner_id_fkey foreign key (learner_id) references public.learners(id) on delete cascade',
    'alter table public.diagnostic_sessions add constraint diagnostic_sessions_learner_id_fkey foreign key (learner_id) references public.learners(id) on delete cascade',
    'alter table public.diagnostic_items add constraint diagnostic_items_session_id_fkey foreign key (session_id) references public.diagnostic_sessions(id) on delete cascade',
    'alter table public.diagnostic_plans add constraint diagnostic_plans_learner_id_fkey foreign key (learner_id) references public.learners(id) on delete cascade',
    'alter table public.diagnostic_plans add constraint diagnostic_plans_session_id_fkey foreign key (session_id) references public.diagnostic_sessions(id) on delete set null',
    'alter table public.diagnostic_plan_progress add constraint diagnostic_plan_progress_plan_id_fkey foreign key (plan_id) references public.diagnostic_plans(id) on delete cascade',
    'alter table public.diagnostic_rechecks add constraint diagnostic_rechecks_learner_id_fkey foreign key (learner_id) references public.learners(id) on delete cascade',
    'alter table public.diagnostic_rechecks add constraint diagnostic_rechecks_session_id_fkey foreign key (session_id) references public.diagnostic_sessions(id) on delete cascade'
  ] loop
    begin execute s; exception when duplicate_object or duplicate_table then null; end;
  end loop;
end $$;

-- ── Indexes ─────────────────────────────────────────────────────────────────
create index if not exists idx_diag_items_session on public.diagnostic_items using btree (session_id);
create index if not exists idx_diag_progress_plan on public.diagnostic_plan_progress using btree (plan_id);
create index if not exists idx_diag_plans_learner on public.diagnostic_plans using btree (learner_id);
create index if not exists idx_diag_rechecks_session on public.diagnostic_rechecks using btree (session_id);
create unique index if not exists uq_diag_rechecks_client on public.diagnostic_rechecks using btree (client_id) where (client_id is not null);
create index if not exists idx_diag_sessions_learner on public.diagnostic_sessions using btree (learner_id);
create unique index if not exists uq_diag_sessions_client on public.diagnostic_sessions using btree (client_id) where (client_id is not null);
create index if not exists grade_chapters_grade_idx on public.grade_chapters using btree (grade_id);
create index if not exists grades_created_by_idx on public.grades using btree (created_by);
create index if not exists idx_learner_access_parent_id on public.learner_access using btree (parent_id);
create index if not exists idx_events_learner_event_created on public.learner_events using btree (learner_id, event, created_at);
create index if not exists learner_events_event_created_idx on public.learner_events using btree (event, created_at);
create index if not exists learner_events_learner_created_idx on public.learner_events using btree (learner_id, created_at);
create index if not exists idx_learner_invites_invited_by on public.learner_invites using btree (invited_by);
create index if not exists idx_learner_invites_learner_id on public.learner_invites using btree (learner_id);
create index if not exists idx_learner_progress_chapter on public.learner_progress using btree (chapter);
create index if not exists idx_learners_created_by on public.learners using btree (created_by);
create index if not exists learners_grade_id_idx on public.learners using btree (grade_id);
create index if not exists idx_sessions_chapter on public.sessions using btree (chapter);
create index if not exists idx_sessions_learner_started on public.sessions using btree (learner_id, started_at);
create index if not exists sessions_learner_id_idx on public.sessions using btree (learner_id);
create index if not exists sessions_learner_started_idx on public.sessions using btree (learner_id, started_at desc);
create index if not exists sessions_started_at_idx on public.sessions using btree (started_at desc);

-- ── Functions ───────────────────────────────────────────────────────────────
-- Verbatim from production. Several are also defined by later migrations (sync_session,
-- sync_diagnostic, sync_recheck, enforce_learner_cap, prune_error_events); those replace
-- these when the migrations run, which is the correct order and a no-op if identical.

create or replace function public.handle_new_user()
 returns trigger language plpgsql security definer set search_path to 'public'
as $function$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User'));
  RETURN NEW;
END;
$function$;

create or replace function public.grant_owner_access()
 returns trigger language plpgsql security definer set search_path to 'public'
as $function$
BEGIN
  INSERT INTO public.learner_access (learner_id, parent_id, access_role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$function$;

create or replace function public.init_learner_stats()
 returns trigger language plpgsql security definer set search_path to 'public'
as $function$
BEGIN
  INSERT INTO public.learner_stats (learner_id) VALUES (NEW.id);
  RETURN NEW;
END;
$function$;

create or replace function public.set_updated_at()
 returns trigger language plpgsql set search_path to 'public'
as $function$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$function$;

create or replace function public.touch_grades_updated_at()
 returns trigger language plpgsql set search_path to 'public'
as $function$
begin new.updated_at = now(); return new; end $function$;

create or replace function public.enforce_learner_cap()
 returns trigger language plpgsql security definer set search_path to 'public'
as $function$
declare cnt int;
begin
  select count(*) into cnt from public.learners where created_by = new.created_by;
  if cnt >= 25 then
    raise exception 'Learner limit reached (max 25 per account).' using errcode = 'check_violation';
  end if;
  return new;
end $function$;

create or replace function public.enforce_grade_cap()
 returns trigger language plpgsql security definer set search_path to 'public'
as $function$
declare cnt int;
begin
  select count(*) into cnt from public.grades where created_by = new.created_by;
  if cnt >= 50 then
    raise exception 'Grade limit reached (max 50 per account).' using errcode = 'check_violation';
  end if;
  return new;
end $function$;

create or replace function public.enforce_grade_ownership()
 returns trigger language plpgsql security definer set search_path to 'public'
as $function$
begin
  if new.grade_id is not null then
    if not exists (
      select 1 from public.grades g
      where g.id = new.grade_id and g.created_by = new.created_by
    ) then
      raise exception 'grade % not owned by this account', new.grade_id using errcode = '42501';
    end if;
  end if;
  return new;
end $function$;

-- V1-hardened. The learner_access INSERT policy calls this, so the RLS suite's A3
-- assertion is really an assertion about this function.
create or replace function public.can_self_grant_access(p_learner_id uuid, p_role text)
 returns boolean language sql stable security definer set search_path to 'public'
as $function$
  select
    exists (
      select 1 from public.learners l
      where l.id = p_learner_id and l.created_by = (select auth.uid())
    )
    or (
      p_role = 'viewer'
      and exists (
        select 1
        from public.learner_invites i
        join public.learners l on l.id = i.learner_id
        where i.learner_id = p_learner_id
          and i.status = 'pending'
          and i.expires_at > now()
          and lower(i.invited_email) = lower((select auth.jwt() ->> 'email'))
          and l.created_by = i.invited_by
      )
    );
$function$;

-- V16 retention. ⚠️ V19: created SECURITY DEFINER, which Postgres gives PUBLIC EXECUTE by
-- default and Supabase exposes at /rest/v1/rpc/<name> — the REVOKE at the foot of this file
-- is the only thing stopping anyone wiping the crash log. RLS suite A8c asserts it.
create or replace function public.prune_error_events()
 returns void language sql security definer set search_path to 'public'
as $function$
  delete from public.error_events where at < now() - interval '90 days';
$function$;

create or replace function public.rls_auto_enable()
 returns event_trigger language plpgsql security definer set search_path to 'pg_catalog'
as $function$
DECLARE cmd record;
BEGIN
  FOR cmd IN
    SELECT * FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
    IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
      EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
    END IF;
  END LOOP;
END;
$function$;

-- NOTE: sync_session, sync_diagnostic, sync_recheck, get_parent_dashboard,
-- get_insights_rollup and get_learner_bootstrap are deliberately absent — every one of them
-- IS defined by a migration, which CI applies straight after this. Functions are
-- `create or replace`, so including them would merely be redundant rather than fatal; they
-- are left out to keep the drift surface small.

-- ── Triggers ────────────────────────────────────────────────────────────────
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists on_learner_created on public.learners;
create trigger on_learner_created after insert on public.learners
  for each row execute function public.grant_owner_access();

drop trigger if exists on_learner_created_stats on public.learners;
create trigger on_learner_created_stats after insert on public.learners
  for each row execute function public.init_learner_stats();

drop trigger if exists trg_enforce_learner_cap on public.learners;
create trigger trg_enforce_learner_cap before insert on public.learners
  for each row execute function public.enforce_learner_cap();

drop trigger if exists trg_enforce_grade_ownership on public.learners;
create trigger trg_enforce_grade_ownership before insert or update of grade_id on public.learners
  for each row execute function public.enforce_grade_ownership();

drop trigger if exists learners_updated_at on public.learners;
create trigger learners_updated_at before update on public.learners
  for each row execute function public.set_updated_at();

drop trigger if exists trg_enforce_grade_cap on public.grades;
create trigger trg_enforce_grade_cap before insert on public.grades
  for each row execute function public.enforce_grade_cap();

drop trigger if exists trg_touch_grades on public.grades;
create trigger trg_touch_grades before update on public.grades
  for each row execute function public.touch_grades_updated_at();

drop trigger if exists learner_progress_updated_at on public.learner_progress;
create trigger learner_progress_updated_at before update on public.learner_progress
  for each row execute function public.set_updated_at();

drop trigger if exists learner_stats_updated_at on public.learner_stats;
create trigger learner_stats_updated_at before update on public.learner_stats
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- The event trigger that auto-enables RLS on any new public table. Needs superuser; the
-- local stack's `postgres` role is one. Recreated last so it cannot fire during this file.
drop event trigger if exists ensure_rls;
create event trigger ensure_rls on ddl_command_end execute function public.rls_auto_enable();

-- ── RLS: ON for every table ─────────────────────────────────────────────────
alter table public.auth_events              enable row level security;
alter table public.chapters                 enable row level security;
alter table public.diagnostic_items         enable row level security;
alter table public.diagnostic_leads         enable row level security;
alter table public.diagnostic_plan_progress enable row level security;
alter table public.diagnostic_plans         enable row level security;
alter table public.diagnostic_rechecks      enable row level security;
alter table public.diagnostic_sessions      enable row level security;
alter table public.error_events             enable row level security;
alter table public.grade_chapters           enable row level security;
alter table public.grades                   enable row level security;
alter table public.learner_access           enable row level security;
alter table public.learner_events           enable row level security;
alter table public.learner_invites          enable row level security;
alter table public.learner_progress         enable row level security;
alter table public.learner_state            enable row level security;
alter table public.learner_stats            enable row level security;
alter table public.learners                 enable row level security;
alter table public.profiles                 enable row level security;
alter table public.sessions                 enable row level security;

-- ── Policies ────────────────────────────────────────────────────────────────
create policy "profiles: own row" on public.profiles for all
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);


create policy "learners: select" on public.learners for select to authenticated
  using (created_by = (select auth.uid())
         or id in (select learner_access.learner_id from public.learner_access
                   where learner_access.parent_id = (select auth.uid())));
create policy "learners: insert" on public.learners for insert to authenticated
  with check (created_by = (select auth.uid()));
create policy "learners: update" on public.learners for update to authenticated
  using (created_by = (select auth.uid())) with check (created_by = (select auth.uid()));
create policy "learners: delete" on public.learners for delete to authenticated
  using (created_by = (select auth.uid()));

create policy "learner_access: select" on public.learner_access for select to authenticated
  using (parent_id = (select auth.uid()));

create policy "learner_invites: recipient can view" on public.learner_invites for select to authenticated
  using (invited_email = lower(((select auth.jwt()) ->> 'email')));
create policy "learner_invites: recipient can accept" on public.learner_invites for update to authenticated
  using (invited_email = lower(((select auth.jwt()) ->> 'email')))
  with check (invited_email = lower(((select auth.jwt()) ->> 'email')));

create policy "sessions: parent can read" on public.sessions for select
  using (exists (select 1 from public.learner_access la
                 where la.learner_id = sessions.learner_id and la.parent_id = (select auth.uid())));
create policy "sessions: parent can insert" on public.sessions for insert
  with check (exists (select 1 from public.learner_access la
                      where la.learner_id = sessions.learner_id and la.parent_id = (select auth.uid())));

create policy "learner_progress: parent access" on public.learner_progress for all
  using (exists (select 1 from public.learner_access la
                 where la.learner_id = learner_progress.learner_id and la.parent_id = (select auth.uid())))
  with check (exists (select 1 from public.learner_access la
                      where la.learner_id = learner_progress.learner_id and la.parent_id = (select auth.uid())));

create policy "learner_stats: parent access" on public.learner_stats for all
  using (exists (select 1 from public.learner_access la
                 where la.learner_id = learner_stats.learner_id and la.parent_id = (select auth.uid())))
  with check (exists (select 1 from public.learner_access la
                      where la.learner_id = learner_stats.learner_id and la.parent_id = (select auth.uid())));


-- error_events: RLS ON with ZERO policies = deny-all, service-role only. INTENTIONAL —
-- the advisor reports rls_enabled_no_policy as INFO and that is the design (A8a/A8b).

-- ── Grants ──────────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;

-- Exceptions, reproduced from production's relacl. Each one is a fix with a history.
revoke all on public.error_events    from anon, authenticated;
revoke all on public.auth_events     from anon, authenticated;
grant insert on public.auth_events   to authenticated;
revoke all on public.diagnostic_leads from anon, authenticated;
grant insert on public.diagnostic_leads to anon, authenticated;

-- ⚠️ V12 IS A COLUMN-LEVEL GRANT, NOT A POLICY, AND THAT IS LOAD-BEARING. RLS WITH CHECK
-- cannot see OLD values, so a policy alone cannot stop an invite's recipient repointing
-- learner_id/invited_by at a stranger's child and self-granting through
-- can_self_grant_access(). Holding UPDATE on `status` ONLY is what closes it. Do not
-- "simplify" this back to a table grant — RLS suite A6 is the guard.
revoke update on public.learner_invites from anon, authenticated;
revoke insert, delete on public.learner_invites from anon;
grant update(status) on public.learner_invites to authenticated;

-- ⚠️ V19 RULE: always pair `create function … security definer` with an explicit REVOKE.
-- Postgres grants PUBLIC EXECUTE by default and Supabase exposes every public-schema
-- function at /rest/v1/rpc/<name>, so the default makes them anonymously callable.
revoke all on function public.handle_new_user()          from public, anon, authenticated;
revoke all on function public.grant_owner_access()       from public, anon, authenticated;
revoke all on function public.init_learner_stats()       from public, anon, authenticated;
revoke all on function public.set_updated_at()           from public, anon, authenticated;
revoke all on function public.touch_grades_updated_at()  from public, anon, authenticated;
revoke all on function public.enforce_learner_cap()      from public, anon, authenticated;
revoke all on function public.enforce_grade_cap()        from public, anon, authenticated;
revoke all on function public.enforce_grade_ownership()  from public, anon, authenticated;
revoke all on function public.prune_error_events()       from public, anon, authenticated;
revoke all on function public.rls_auto_enable()          from public, anon, authenticated;

revoke all on function public.can_self_grant_access(uuid, text) from public, anon;
grant execute on function public.can_self_grant_access(uuid, text) to authenticated;
