-- READ-ONLY. BUG-02, BEFORE migration 20260926100200 — the current shape of record_lesson_progress.
-- Run in the Supabase SQL editor. Nothing is written.

-- 1. The function as it is now.
--    args     : expected the 8 parameters ending in `p_event uuid` (no p_answered_at) = the defect is present.
--    definer  : expected true   · search_path : expected {search_path=public}
--    acl      : expected postgres / authenticated / service_role, no anon, no bare "=X" (PUBLIC)
select p.proname, pg_get_function_identity_arguments(p.oid) as args, p.prosecdef as definer,
       p.proconfig as search_path, p.proacl::text as acl
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'record_lesson_progress';

-- 2. The column the fix adds. Expected: 0 rows (not there yet).
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name = 'lesson_progress' and column_name = 'answered_at';

-- 3. How often the defect may already have paid twice: learner+topic pairs with more level_up rows than the level
--    they now stand at. `extra` > 0 means level-ups beyond the climb the stored level shows. (Legit demotions and
--    re-climbs also produce extra rows, so this is an upper bound, not a count of BUG-02 events.) No names.
select count(*) as pairs_with_extra, coalesce(sum(u.ups - p.level), 0) as extra_level_ups
from public.lesson_progress p
join (select learner_id, lesson_id, count(*)::int as ups from public.point_events where reason = 'level_up'
      group by 1, 2) u using (learner_id, lesson_id)
where u.ups > p.level;
