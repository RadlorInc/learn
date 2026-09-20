-- The 3–8 story chapters record progress the same way the new-flow topics do: one row per chapter
-- in `lesson_progress`, points awarded by `record_lesson_progress` from what changed.
-- Founder's call, 2026-09-20: "unke data ka collection same abhi joh modules waalo ka hai wohi kardo",
-- and points too ("topic jaisa hi").
--
-- ✅ APPLIED TO PRODUCTION 2026-09-20 (ledger version 20260920151900; file renamed to match, as the
-- 58-migration relabelling of 2026-08-25 taught — a repo name that disagrees with the ledger is a
-- migration `supabase db push` will try to apply a second time).
--
-- Measured after, against production and not against this file:
--   · both constraints re-read from `pg_constraint` and now carry the `c:` alternative;
--   · the LIVE predicate (pulled from `pg_get_expr(conbin, …)`, not a copy of it) evaluated against
--     ALL 23 real chapter ids — 23 accepted, 0 rejected — with `c:would-fail` as the positive
--     control returning false, so the empty rejection list means "clean", not "blind";
--   · `g5m1-t1` and `g5m1` still accepted (the topics did not regress) and `junk` still refused;
--   · 0 existing rows in either table would have failed the wider predicate, checked before applying.
--
-- ⚠️ NOT measured: an end-to-end insert. `execute_sql` is read-only, so no row was written; the
--   client path is proven by `src/__tests__/chapterRecordsLikeLesson.test.ts` instead. Play one
--   chapter signed in and read the row back to close that last gap.
--
-- ⚠️⚠️ DEPLOY ORDER: EXPAND-ONLY, AND THE CLIENT TOLERATES EITHER ORDER — DELIBERATELY, BECAUSE
-- `main` AUTO-DEPLOYS TO VERCEL AND MIGRATIONS ARE APPLIED BY HAND, SO CODE-FIRST IS THE DEFAULT
-- HERE. Widening a CHECK accepts everything it accepted before, so applying this ahead of the code
-- breaks nothing. The other direction is the dangerous one and is handled in the client:
-- `23514 check_violation` is classified 'drop' (src/data/repositories/_shared.ts), so a chapter row
-- sent to the un-widened constraint would have been SILENTLY DISCARDED — a child's whole chapter
-- lost with no error anywhere. `src/data/repositories/points.ts` now returns 'retry' for a check
-- violation on a `c:` id specifically, so those rows wait in the local queue and upload the moment
-- this lands. Same class as the PGRST202 / `sync_session` incident of 2026-09-05.
--
-- ⚠️ SECURITY: NOTHING CHANGES. No table, policy, grant, owner, `SECURITY DEFINER` or `search_path`
-- is touched. Two CHECK constraints are replaced with strictly wider versions of themselves; the
-- functions that write these tables, and who may call them, are exactly as they were.
--
-- ⚠️ THE TWO NAMESPACES CANNOT COLLIDE. A topic id is `g<grade>m<module>-t<topic>`; a chapter id is
-- `c:` + its registry key (`c:counting`, `c:shapes2d3d`). The `c:` prefix is what keeps a chapter
-- out of every "how is this child doing on Grade 5 Module 1" read, and it is why the prefix is in
-- the DATA rather than a second column nobody would remember to filter on.

alter table public.lesson_progress drop constraint if exists lesson_progress_lesson_id_check;
alter table public.lesson_progress add constraint lesson_progress_lesson_id_check
  check (lesson_id ~ '^g[3-8]m[0-9]{1,2}-t[0-9]{1,2}$' or lesson_id ~ '^c:[A-Za-z0-9]{1,40}$');

alter table public.point_events drop constraint if exists point_events_lesson_id_check;
alter table public.point_events add constraint point_events_lesson_id_check
  check (lesson_id is null
         or lesson_id ~ '^g[3-8]m[0-9]{1,2}(-t[0-9]{1,2})?$'
         or lesson_id ~ '^c:[A-Za-z0-9]{1,40}$');

-- The once-only index on (learner_id, reason, lesson_id) for 'mastered' / 'lesson_done' already
-- covers chapter ids: it keys on the value, not its shape. A chapter's mastery bonus is therefore
-- once-only for the same reason a topic's is, with nothing added here.
