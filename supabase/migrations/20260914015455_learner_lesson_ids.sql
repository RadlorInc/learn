-- Parents choose which new-flow lesson topics a child sees (founder's call, 2026-09-14:
-- "we will show all the modules to the parents ... they can select the topics").
--
-- ⚠️ DEPLOY ORDER: EXPAND-ONLY, SAFE IN EITHER ORDER.
--   - One new NULLABLE column; nothing existing changes. NULL means "every topic" — the behaviour today.
--   - The client tolerates the column being absent: a learner row without `lesson_ids` shows every topic,
--     and saving a choice answers "needs a database update" (PostgREST PGRST204) instead of failing silently.
--   - No new function, no policy change. The existing "learners: update" policy
--     (created_by = auth.uid()) already lets the creating parent write it; a viewer parent cannot.
--
-- Not a privilege: the column only filters which topics are LISTED. It unlocks nothing (the new-flow lessons
-- have no paywall) and nothing reads it for an authorisation decision.
--
-- Rollback: remove the lesson_ids column from public.learners (alter table … drop … lesson_ids). Written this way
-- because baselineSchema.test.ts reads every literal column-drop statement in migrations as a real one.

alter table public.learners
  add column if not exists lesson_ids text[]
  check (lesson_ids is null or cardinality(lesson_ids) <= 500);

comment on column public.learners.lesson_ids is
  'New-flow lesson ids (g<grade>m<module>-t<topic>) this child sees. NULL = every topic. Set by the creating parent.';
