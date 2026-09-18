-- Free and paid teachers (founder's call, 2026-09-18).
--   Every teacher can set class EXERCISES: the same questions for every child in the class, not adaptive, difficulty
--   and count set by the teacher.
--   PAID teacher  → the students in their classes get the class's MODULES (full lessons) AND its exercises.
--   FREE teacher  → those students get the EXERCISES only. The teacher still sees the modules themselves.
-- Parents are not affected: their children are in no class, and parents never get the exercise option.
--
-- `teacher_plans` holds who has paid. ⚠️ IT IS NEVER WRITABLE FROM A CLIENT (see CLAUDE.md, "a column a client can
-- write must never be read as an authorisation decision"): no insert/update/delete grant and no write policy. Until
-- teacher billing exists it is set by hand in the SQL editor; the Stripe webhook (service role) will set it later.
-- READ: a teacher reads their own row; a signed-in child reads the row of the adult who CREATED their learner
-- (`learners.created_by`, which a client cannot reassign — its update policy checks created_by = auth.uid()).
-- No row = free.
--
-- `grades.exercises` is the class's exercise list, written by the class's owner under the existing grades policies:
--   [{ "id": text, "module": "g5m2", "level": 1..5, "count": 1..50, "seed": int }]
-- The seed is what makes every child's questions identical.
--
-- ⚠️ DEPLOY ORDER: apply BEFORE merging the code that reads them. The client fails OPEN (lessons) if teacher_plans is
-- missing, so an early deploy cannot lock children out — but the exercise editor cannot save without the column.
-- No SECURITY DEFINER, no function. Rollback: remove the teacher_plans table and the grades.exercises column.

create table if not exists public.teacher_plans (
  teacher_id uuid primary key references auth.users(id) on delete cascade,
  paid       boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.teacher_plans enable row level security;
revoke all on public.teacher_plans from public, anon, authenticated;
grant select on public.teacher_plans to authenticated;

drop policy if exists "teacher_plans: read own or my creator's" on public.teacher_plans;
create policy "teacher_plans: read own or my creator's" on public.teacher_plans
  for select to authenticated
  using (
    teacher_id = (select auth.uid())
    or teacher_id in (
      select l.created_by from public.learners l
      join public.learner_access la on la.learner_id = l.id
      where la.parent_id = (select auth.uid())
    )
  );

alter table public.grades
  add column if not exists exercises jsonb not null default '[]'::jsonb;
alter table public.grades drop constraint if exists grades_exercises_is_array;
alter table public.grades add constraint grades_exercises_is_array check (jsonb_typeof(exercises) = 'array');

-- The one paid teacher for now (founder, 2026-09-18): kuwarirafi@gmail.com.
insert into public.teacher_plans (teacher_id, paid)
select id, true from auth.users where email = 'kuwarirafi@gmail.com'
on conflict (teacher_id) do update set paid = true, updated_at = now();

notify pgrst, 'reload schema';
