-- A teacher's CLASS (founder's call, 2026-09-18). The `grades` table is reused as the class: its name, its owner
-- (`created_by`, RLS already scopes every read and write to them) and each child's link (`learners.grade_id`, one
-- class per child) are exactly what a class needs. What it lacked is the new flow:
--   grade       — the class's Grade 3–8 (which modules the picker opens on)
--   lesson_ids  — the lessons the class was given; copied onto each child's `learners.lesson_ids`, which is what
--                 /modules reads. Stored here too so a child added later gets the same lessons.
-- `age_group` (a legacy chapter band) stops being required: a class made on the new page has none. Its CHECK allows
-- NULL already. Old grades keep theirs.
--
-- ⚠️ DEPLOY ORDER: apply this BEFORE merging the code that writes `grade` / `lesson_ids`. The class page fails
-- closed without it (a create answers an error toast); nothing else reads these columns.
-- No policy, grant or function changes. Rollback: drop the two columns, restore NOT NULL (only if no row is null).

alter table public.grades
  add column if not exists grade smallint check (grade between 3 and 8),
  add column if not exists lesson_ids text[];

alter table public.grades alter column age_group drop not null;

notify pgrst, 'reload schema';
