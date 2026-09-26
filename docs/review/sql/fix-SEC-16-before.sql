-- SEC-16 — BEFORE applying 20260926100700_entitlement_access_guard.sql. READ-ONLY (SELECT only).
-- Shows the current shape of is_chapter_entitled / entitled_chapters: no learner_access guard.
select p.proname,
       pg_get_function_identity_arguments(p.oid)          as args,            -- (uuid, text) / (uuid, text[])
       p.prosecdef                                         as security_definer, -- expected: true (unchanged by the fix)
       p.proconfig                                         as config,          -- expected: {search_path=public} (unchanged)
       p.proacl::text                                      as acl,             -- expected: postgres, authenticated, service_role only; no anon
       p.prosrc ~ 'learner_access'                         as has_access_guard -- BEFORE: false for both = the defect
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('is_chapter_entitled', 'entitled_chapters')
order by 1;

-- Every policy that calls is_chapter_entitled (the callers the guard must not break). Each one should ALSO
-- require learner_access for auth.uid(), which is why the guard cannot refuse a caller the policy admits.
select tablename, policyname, cmd,
       coalesce(with_check, '') ~ 'learner_access' as policy_requires_access   -- expected: true on every row
from pg_policies
where coalesce(qual, '') || coalesce(with_check, '') ~ 'is_chapter_entitled';
