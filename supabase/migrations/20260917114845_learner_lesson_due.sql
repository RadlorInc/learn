-- Assign lessons with a due date (founder's call, 2026-09-17: the child sees ONLY the assigned lessons, each with its
-- due date). Which lessons stay in `learners.lesson_ids` (20260914015455); this adds when each one is due.
--
-- ✅ APPLIED TO PRODUCTION 2026-09-17 by hand (ledger version 20260917114845; file renamed to match). Measured after:
-- lesson_due jsonb nullable with the CHECK below, learners policies still 4, 23 learners and 0 with a due date.
--
-- ⚠️ DEPLOY ORDER: EXPAND-ONLY, SAFE IN EITHER ORDER. One new NULLABLE column; nothing existing changes. The client
-- tolerates it being absent: no due dates are shown, and assigning with a date answers "needs a database update"
-- (PostgREST PGRST204) instead of failing silently.
--
-- ⚠️ SECURITY POSTURE: no function, policy or grant is added or changed. The existing "learners: update" policy
-- (created_by = auth.uid()) lets the creating parent write it; a viewer parent and the child's own login cannot.
-- Not a privilege: a due date is shown to the child and the parent, and nothing reads it for an authorisation decision.
--
-- Shape: { "<lesson id>": "YYYY-MM-DD", … } — a date with no time, the day the parent picked.
-- Rollback: remove the lesson_due column from public.learners.

alter table public.learners
  add column if not exists lesson_due jsonb
  check (lesson_due is null or (jsonb_typeof(lesson_due) = 'object' and pg_column_size(lesson_due) < 65536));

comment on column public.learners.lesson_due is
  'Due date per assigned lesson: {"g3m2-t1": "2026-09-20"}. NULL or {} = no due dates. Set by the creating parent.';
