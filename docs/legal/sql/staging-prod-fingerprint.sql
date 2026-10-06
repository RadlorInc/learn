-- READ-ONLY. Does STAGING's schema match PRODUCTION's? (2026-10-01)
-- No data is read: only the catalog (definitions of tables, columns, constraints, indexes, policies, functions,
-- triggers, grants, enums). The founder runs it on PRODUCTION in the Supabase SQL editor; the agent runs the same text
-- on staging and compares.
--
-- Run QUERY 1 first (select just that statement and press Run; the editor shows only the last result).
--   EXPECT: the same 11 rows on both databases, every `n` and every `md5` equal.
--   A row whose md5 differs = that kind of object differs. A row whose `n` is 0 on one side = the check could not see
--   that kind there (read it as "not compared", never as "equal").
-- Only if a row differs, run QUERY 2 on both and send its result: one row per object with the md5 of its definition,
-- so the difference can be named object by object. It lists names and hashes only, never rows of any table.
--
-- Scope: schema `public`, plus the app's own triggers on `auth.users`. Supabase-managed schemas are left out on
-- purpose (they differ by platform version, not by us).

-- ═══ QUERY 1: one row per kind ═══════════════════════════════════════════════════════════════════════════════════
with items(kind, obj, def) as (
  select 'table', c.relname, 'rls=' || c.relrowsecurity || ' force=' || c.relforcerowsecurity
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
  union all
  select 'view', c.relname, pg_get_viewdef(c.oid) || ' opts=' || coalesce(array_to_string(c.reloptions, ','), '')
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('v', 'm')
  union all
  select 'column', c.relname || '.' || a.attname,
         format_type(a.atttypid, a.atttypmod) || ' notnull=' || a.attnotnull || ' default=' ||
         coalesce(pg_get_expr(d.adbin, d.adrelid), '')
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid join pg_namespace n on n.oid = c.relnamespace
    left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
    where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm') and a.attnum > 0 and not a.attisdropped
  union all
  select 'constraint', conrelid::regclass::text || '.' || conname, pg_get_constraintdef(oid)
    from pg_constraint where connamespace = 'public'::regnamespace
  union all
  select 'index', indexname, indexdef from pg_indexes where schemaname = 'public'
  union all
  select 'policy', tablename || '.' || policyname,
         cmd || ' ' || permissive || ' ' || array_to_string(roles, ',') || ' using=' || coalesce(qual, '') ||
         ' check=' || coalesce(with_check, '')
    from pg_policies where schemaname = 'public'
  union all
  select 'function', p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
         -- code only: comments and whitespace stripped. Production's functions were created without the migrations'
         -- comments, so a raw hash reported 10 "different" functions whose code was identical (2026-10-01).
         md5(regexp_replace(regexp_replace(regexp_replace(pg_get_functiondef(p.oid), '/\*.*?\*/', '', 'g'), '--[^\n]*', '', 'g'), '\s+', '', 'g'))
           || ' definer=' || p.prosecdef || ' acl=' || coalesce(p.proacl::text, '')
    from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prokind = 'f'
  union all
  select 'trigger', c.relname || '.' || t.tgname, pg_get_triggerdef(t.oid) || ' enabled=' || t.tgenabled::text
    from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
    where not t.tgisinternal and (n.nspname = 'public' or (n.nspname = 'auth' and c.relname = 'users'))
      and t.tgfoid::regproc::text not like 'auth.%'
  union all
  select 'event_trigger', evtname, evtevent || ' ' || evtfoid::regproc::text || ' enabled=' || evtenabled::text
    from pg_event_trigger where evtfoid::regproc::text like 'public.%' or evtfoid::regproc::text like 'rls_%'
  union all
  select 'grant', c.relname, coalesce(c.relacl::text, '')
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm')
  union all
  select 'enum', t.typname, string_agg(e.enumlabel, ',' order by e.enumsortorder)
    from pg_type t join pg_enum e on e.enumtypid = t.oid
    where t.typnamespace = 'public'::regnamespace group by t.typname
)
select kind, count(*) as n, md5(string_agg(obj || '=' || def, E'\n' order by obj)) as md5
from items group by kind order by kind;

-- History (2026-10-01): the first production run found no `ensure_rls` event trigger, and 11 functions whose hash
-- differed. 10 of those were comments/whitespace only; `rls_auto_enable` really differed (more logging, same behaviour).
-- Migration 20261001090000 restored the trigger with production's function; after it, production's `event_trigger`
-- row matched staging's. The function hash below is code-only, so comment-only differences no longer show.
--
-- STAGING's answer to QUERY 1, 2026-10-01, after 20261001090000 (compare production's against these):
--   column 265 900c2c6107e2230714d44ad49a8e2c79 · constraint 148 0b50ec473bfe93ad6043146e0ff7959a
--   enum 2 a79c409445470f12058763476116d452 · event_trigger 1 e3e0f6d8dcd113d328df555ff73d7c8f
--   function 67 6798566f9f4422252fea74bd0453c320 · grant 37 3ed82747a7f2ffa537a647c394668b51
--   index 90 6a6a9cf26e5be81b4b067847fd34d7a9 · policy 40 4cca39090c671c8945fb3a163fd4fc44
--   table 35 d985ee0bed6b34ab900257545fd1bc00 · trigger 27 1809c2aad8b276d7e6787557b363fede
--   view 2 0291c2db815fb741bda4b840809cec16
-- A later migration changes both sides; re-run on both then.

-- ═══ QUERY 2 (only if QUERY 1 differs): one row per object ══════════════════════════════════════════════════════
-- Same `items` as above, then: select kind, obj, md5(def) from items order by kind, obj;
-- (Paste the `with items(...) as ( … )` block from QUERY 1 in front of that line.)
