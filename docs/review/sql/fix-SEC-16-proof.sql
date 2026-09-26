-- SEC-16 — AFTER applying 20260926100700_entitlement_access_guard.sql. READ-ONLY (SELECT only).
-- Proves the guard is in place and nothing else about the function's privilege changed.
select p.proname,
       p.prosecdef                                             as security_definer,  -- expected: true
       p.proconfig                                             as config,            -- expected: {search_path=public}
       has_function_privilege('anon', p.oid, 'execute')        as anon_can_call,     -- expected: false
       has_function_privilege('authenticated', p.oid, 'execute') as authed_can_call, -- expected: true
       has_function_privilege('service_role', p.oid, 'execute')  as server_can_call, -- expected: true
       p.prosrc ~ 'la\.parent_id = auth\.uid\(\)'              as has_access_guard   -- expected: true for is_chapter_entitled
                                                                                      -- (entitled_chapters: false — it raises THROUGH is_chapter_entitled)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('is_chapter_entitled', 'entitled_chapters')
order by 1;

-- The migration is recorded.
select version, name from supabase_migrations.schema_migrations where version = '20260926100700';  -- expected: 1 row
