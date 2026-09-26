-- READ-ONLY. BUG-02, AFTER migration 20260926100200. Run in the Supabase SQL editor. Nothing is written.
-- (The migration's own closing assertions already refused to commit unless all of this held; this is the
--  independent read.)

-- 1. Exactly ONE record_lesson_progress, with p_answered_at last, privileges as before.
--    args        : must end in `p_answered_at timestamp with time zone` — 1 row only (0 or 2 = wrong)
--    definer     : must be true (unchanged from 20260917112109)
--    search_path : must be {search_path=public} (unchanged)
--    anon_exec   : must be false · auth_exec : must be true (the browser's role, the real caller)
--    acl         : no anon, no bare "=X" (PUBLIC)
select pg_get_function_identity_arguments(p.oid) as args, p.prosecdef as definer, p.proconfig as search_path,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_exec,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_exec,
       p.proacl::text as acl
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'record_lesson_progress';

-- 2. The new column. Expected 1 row: answered_at | timestamp with time zone | YES.
select column_name, data_type, is_nullable from information_schema.columns
where table_schema = 'public' and table_name = 'lesson_progress' and column_name = 'answered_at';

-- 3. The rule is in the live body (not a copy of this file): both must be true.
--    has_rule     : the body compares the answer time with the stored one
--    guards_bonus : level_up is paid only on a write that won
select prosrc like '%v_fresh := v_at >= coalesce(old.answered_at%' as has_rule,
       prosrc like '%if v_fresh and p_level > old.level then%'     as guards_bonus
from pg_proc where proname = 'record_lesson_progress' and pronamespace = 'public'::regnamespace;

-- 4. After a new bundle has been used for a day: rows now carry an answer time. `stamped` should grow from 0;
--    a stamped row never has answered_at in the future (`future` must be 0 — the clamp).
select count(*) filter (where answered_at is not null) as stamped,
       count(*) filter (where answered_at > now())     as future,
       count(*)                                        as rows_total
from public.lesson_progress;
