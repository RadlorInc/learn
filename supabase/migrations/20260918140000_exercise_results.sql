-- Class exercise RESULTS, and exercises that are LOCKED until the teacher opens them (founder's call, 2026-09-18).
--
-- A teacher makes exercises whenever they have time; a new one is locked (`"open": false` in grades.exercises). When it
-- is time for the test they open it from the dashboard, and only then can the children take it. Each finished attempt
-- is one row here: which child, which class, which exercise, and how each question went —
--   'first'  right first time · 'second' right after a hint or one miss · 'worked' shown the worked answer.
-- The teacher reads the FIRST attempt as the test result; later attempts are practice.
--
-- WHO MAY DO WHAT (all enforced here, not only on screen):
--   INSERT — only the CHILD'S OWN LOGIN (a learner_access row with access_role = 'self'), only for their own learner,
--            only into the class that learner is in, and only for an exercise that exists there and is OPEN. A locked
--            exercise cannot receive a result even from a hand-made request. (An exercise with no "open" key — made
--            before locking existed — counts as open.)
--   SELECT — the adult who created the learner (the teacher), and anyone with a learner_access row (the child).
--   UPDATE / DELETE — nobody. A result cannot be edited after the fact.
--   Only the four data columns are insertable; id and created_at are the server's.
-- ⚠️ A result is still what the child's device reports — a determined child could post a perfect score for an OPEN
-- exercise. It is a classroom quiz, not an exam; do not sell it as proctored.
--
-- ⚠️ DEPLOY ORDER: apply BEFORE merging the code. No SECURITY DEFINER, no function.
-- Rollback: remove the exercise_results table.

create table if not exists public.exercise_results (
  id          uuid primary key default gen_random_uuid(),
  learner_id  uuid not null references public.learners(id) on delete cascade,
  class_id    uuid not null references public.grades(id) on delete cascade,
  exercise_id text not null check (char_length(exercise_id) between 1 and 40),
  outcomes    text[] not null check (cardinality(outcomes) between 1 and 50 and outcomes <@ array['first', 'second', 'worked']::text[]),
  created_at  timestamptz not null default now()
);
create index if not exists exercise_results_class_idx on public.exercise_results (class_id, exercise_id);

alter table public.exercise_results enable row level security;
revoke all on public.exercise_results from public, anon, authenticated;
grant select on public.exercise_results to authenticated;
grant insert (learner_id, class_id, exercise_id, outcomes) on public.exercise_results to authenticated;

drop policy if exists "exercise_results: teacher or the child reads" on public.exercise_results;
create policy "exercise_results: teacher or the child reads" on public.exercise_results
  for select to authenticated
  using (
    learner_id in (select id from public.learners where created_by = (select auth.uid()))
    or learner_id in (select learner_id from public.learner_access where parent_id = (select auth.uid()))
  );

drop policy if exists "exercise_results: the child posts an open exercise" on public.exercise_results;
create policy "exercise_results: the child posts an open exercise" on public.exercise_results
  for insert to authenticated
  with check (
    learner_id in (
      select learner_id from public.learner_access
      where parent_id = (select auth.uid()) and access_role = 'self'
    )
    and exists (
      select 1
      from public.learners l
      join public.grades g on g.id = l.grade_id
      cross join lateral jsonb_array_elements(g.exercises) e
      where l.id = exercise_results.learner_id
        and g.id = exercise_results.class_id
        and e->>'id' = exercise_results.exercise_id
        and coalesce((e->>'open')::boolean, true)
    )
  );

notify pgrst, 'reload schema';
