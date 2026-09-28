-- READ-ONLY. For Rafi to run in the Supabase SQL editor on PRODUCTION (2026-09-28, the "security is off" reel).
-- The repo's side is `src/__tests__/rlsEveryTable.test.ts`, which checks the schema CI builds from the files;
-- these three answer whether production still matches it. Every expected answer is written next to its query.

-- 1. The event trigger that switches RLS on for every new public table. It is in `baseline_schema.sql` (taken
--    from production) and is the reason a migration that forgets `enable row level security` is harmless.
--    EXPECT one row: ensure_rls | O   ('O' = enabled; 'D' = disabled → every new table ships readable by anon)
select evtname, evtenabled from pg_event_trigger where evtname = 'ensure_rls';

-- 2. Public tables with RLS OFF.
--    EXPECT zero rows. Any row is a table anyone holding the anon key (it is in every browser) can read.
select c.relname as table_with_rls_off
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity
order by 1;

-- 3. Public views a client can SELECT that run as their owner, i.e. read past RLS.
--    EXPECT zero rows. A row needs `with (security_invoker = true)` or its grant revoked.
select c.relname as view_bypassing_rls
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('v', 'm')
  and not coalesce('security_invoker=true' = any(c.reloptions), false)
  and (has_table_privilege('anon', c.oid, 'select') or has_table_privilege('authenticated', c.oid, 'select'))
order by 1;
