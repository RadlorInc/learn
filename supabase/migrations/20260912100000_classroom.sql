-- Classroom: a teacher's syllabus, her exercises, and children who can sign in for themselves.
--
-- ⚠️⚠️ DEPLOY ORDER. This migration is EXPAND-ONLY: every object it adds is new, and the one
-- column it adds to an existing table (`learners.chapter_ids`) is nullable with NULL meaning
-- "unset". Nothing running today reads or writes any of it, so it is safe to apply BEFORE the
-- client that uses it — which is the order this repo needs, because `main` auto-deploys to Vercel
-- and migrations are applied by hand. See CLAUDE.md, "the schema and the code that uses it".
--
-- ⚠️ SECURITY POSTURE, CALLED OUT DELIBERATELY (CLAUDE.md requires this to be explicit, never a
-- side effect): this migration adds NO `security definer` function and changes no existing policy.
-- An earlier draft added a `claim_learner` definer RPC to link a child's auth uid to a learner. It
-- was removed once the linking turned out to need the service role anyway (a child's account has a
-- synthesized address that is never confirmed, and only the admin API can create it pre-confirmed),
-- so the RPC would have been a second, weaker way to do the same thing — a new anon-reachable
-- surface in `public` buying nothing. The one writer is `/api/child/signup`, server-side.
-- The only privilege change here is widening one CHECK constraint to admit a new access_role.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. The parent's per-child chapter list.
--
-- ⚠️ THIS COLUMN EXISTS TO SEPARATE TWO THINGS THAT SHARE ONE COLUMN TODAY. `learners.grade_id`
-- currently does two unrelated jobs: it says which class a child is on the ROSTER of, and — via
-- `grade_chapters` — it decides which chapters the child can play. So a teacher adding a child to
-- her class silently replaces that child's app with her own syllabus. From here:
--   · grade_id      -> roster only (which class, therefore which exercises)
--   · chapter_ids   -> what the CHILD sees, set by the parent
-- NULL means "not chosen", and the client falls through to the band's standard set. That fallback
-- already exists, so the "I don't know which chapters" door needs no code at all.
alter table public.learners add column if not exists chapter_ids text[];

comment on column public.learners.chapter_ids is
  'Chapters this child can play, chosen by the parent. NULL = use the age band''s standard set. '
  'Deliberately NOT the same thing as grade_chapters, which is the teacher''s own syllabus.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. A class join code, so a child can find their own roster row at first sign-in.
--
-- ⚠️ THIS CODE IS A SECRET AND A WEAK ONE. It is the only thing standing between a stranger and a
-- first claim on an unclaimed child (see /api/child/signup), so it is generated from a 30-character
-- alphabet with the ambiguous glyphs removed and is ROTATABLE by the teacher. It is not a password
-- and must never be treated as one: the real protection is that a claimed child cannot be
-- re-claimed, and that the teacher can see who has claimed.
alter table public.grades add column if not exists join_code text;

create or replace function public.gen_join_code()
  returns text language sql volatile as $$
  -- No 0/O/1/I/L — a six-year-old is reading this off a whiteboard.
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', (random() * 30)::int + 1, 1), '')
  from generate_series(1, 6)
$$;

update public.grades set join_code = public.gen_join_code() where join_code is null;

-- Backfill first, then constrain — a NOT NULL on a populated table is otherwise a failed migration.
alter table public.grades alter column join_code set not null;
create unique index if not exists grades_join_code_key on public.grades (join_code);
alter table public.grades alter column join_code set default public.gen_join_code();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. 'self' — a child's own access to their own record.
--
-- ⚠️⚠️ THIS IS THE WHOLE REASON CHILD LOGINS ARE CHEAP HERE, AND IT IS WORTH UNDERSTANDING BEFORE
-- CHANGING ANYTHING. Every policy protecting a child's data is written as
-- `exists (select 1 from learner_access where learner_id = … and parent_id = auth.uid())`.
-- The column is called `parent_id`, but what it actually means is "a principal who may act on this
-- learner". So giving the CHILD's own auth uid a row in that table makes every existing policy —
-- sessions, progress, stats, state, events, diagnostics — admit the child with NO policy rewritten.
--
-- 'self' is a distinct role rather than reusing 'viewer' for two reasons: `deleteLearner` and the
-- invite paths are owner-only and must keep refusing a child, and analytics has to be able to tell
-- "the child played this" from "an adult was looking".
alter table public.learner_access drop constraint if exists learner_access_access_role_check;
alter table public.learner_access add constraint learner_access_access_role_check
  check (access_role = any (array['owner'::text, 'viewer'::text, 'self'::text]));

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Exercises — a teacher's set work.
--
-- `topic` is a chapter id and `difficulty` is that chapter's own 1–3 tier, so an exercise is a row
-- saying WHICH existing generator, at WHICH existing tier, HOW MANY times. No new question engine.
create table if not exists public.exercises (
  id             uuid primary key default gen_random_uuid(),
  grade_id       uuid not null references public.grades(id) on delete cascade,
  created_by     uuid not null references public.profiles(id) on delete cascade,
  topic          text not null,
  question_count int  not null check (question_count between 1 and 50),
  difficulty     int  not null check (difficulty between 1 and 3),
  -- NULL = locked. The teacher's unlock button is the only thing that sets it, and it is the only
  -- thing that puts work on a child's screen.
  unlocked_at    timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists exercises_grade_idx on public.exercises (grade_id);

create table if not exists public.exercise_results (
  id            uuid primary key default gen_random_uuid(),
  exercise_id   uuid not null references public.exercises(id) on delete cascade,
  learner_id    uuid not null references public.learners(id) on delete cascade,
  correct_count int  not null check (correct_count >= 0),
  wrong_count   int  not null check (wrong_count   >= 0),
  completed_at  timestamptz not null default now(),
  unique (exercise_id, learner_id)
);
create index if not exists exercise_results_learner_idx on public.exercise_results (learner_id);

-- ⚠️ Both tables are reachable from an account and BOTH are cleared by cascade rather than by a
-- line in `delete_my_account`: exercise_results.learner_id -> learners (deleted first, in the same
-- transaction) and exercises.grade_id -> grades -> profiles -> auth.users. `accountDeletion.test.ts`
-- counts every reachable table and throws on one it has no clause for, so its census names both.

alter table public.exercises        enable row level security;
alter table public.exercise_results enable row level security;

-- ⚠️ GRANTED EXPLICITLY RATHER THAN INHERITED. Supabase's default privileges would hand
-- `authenticated` these grants on their own, and relying on that is the M6 trap in CLAUDE.md: a
-- property nobody in this repo controls, invisible in the diff, and untestable anywhere but prod.
-- Stated here, the tables behave identically in the pglite fixture, in CI and in production.
-- `anon` gets nothing: every row on both tables belongs to a child.
grant select, insert, update, delete on public.exercises        to authenticated;
grant select, insert, update, delete on public.exercise_results to authenticated;
revoke all on public.exercises        from anon;
revoke all on public.exercise_results from anon;

-- The teacher who owns the class owns its exercises, completely.
drop policy if exists "exercises: owner" on public.exercises;
create policy "exercises: owner" on public.exercises for all
  using      (exists (select 1 from public.grades g where g.id = grade_id and g.created_by = auth.uid()))
  with check (exists (select 1 from public.grades g where g.id = grade_id and g.created_by = auth.uid()));

-- A child (or their parent) may read an exercise only once it is UNLOCKED, and only if that child
-- is on the roster of the class it belongs to. A locked exercise is invisible, not merely disabled.
drop policy if exists "exercises: roster reads unlocked" on public.exercises;
create policy "exercises: roster reads unlocked" on public.exercises for select
  using (
    unlocked_at is not null
    and exists (
      select 1 from public.learners l
      join public.learner_access la on la.learner_id = l.id
      where l.grade_id = exercises.grade_id and la.parent_id = auth.uid()
    )
  );

-- A result belongs to the child who earned it; the teacher reads it through the class.
drop policy if exists "exercise_results: own learner" on public.exercise_results;
create policy "exercise_results: own learner" on public.exercise_results for all
  using      (exists (select 1 from public.learner_access la where la.learner_id = exercise_results.learner_id and la.parent_id = auth.uid()))
  with check (exists (select 1 from public.learner_access la where la.learner_id = exercise_results.learner_id and la.parent_id = auth.uid()));

drop policy if exists "exercise_results: teacher reads class" on public.exercise_results;
create policy "exercise_results: teacher reads class" on public.exercise_results for select
  using (
    exists (
      select 1 from public.exercises e
      join public.grades g on g.id = e.grade_id
      where e.id = exercise_results.exercise_id and g.created_by = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Linking a child's account to their learner row happens in `/api/child/signup` with the
-- service role. There is deliberately no RPC for it: see the header. `learner_access`'s INSERT
-- policy keeps its `can_self_grant_access` guard untouched, so no client can grant itself a child.

revoke all on function public.gen_join_code() from public, anon, authenticated;
