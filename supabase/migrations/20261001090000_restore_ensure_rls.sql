-- Put the RLS safety net back on production, and make repo, staging and production define it the same way.
--
-- Found 2026-10-01 by docs/legal/sql/staging-prod-fingerprint.sql (the founder ran it on production):
--   · production has NO event trigger `ensure_rls`. `baseline_schema.sql` creates it and `rlsEveryTable.test.ts` relies on
--     it ("a forgotten `enable` is already impossible"), but on production a migration that forgets
--     `enable row level security` would ship a table anon can read. Every one of production's 35 public tables has RLS
--     on today (the fingerprint's `table` kind, which includes the flag, matched staging exactly), so nothing is open;
--     what is missing is the net under the next migration.
--   · production's `rls_auto_enable()` differs from the baseline's: same behaviour (it still only touches schema
--     `public`; the added NOT IN / NOT LIKE tests are implied by `IN ('public')`), plus two RAISE LOG lines — one on
--     success, one on skip. Production's version is kept (founder's decision, 2026-10-01).
--
-- The function body below is production's `pg_get_functiondef` output, pasted unchanged, not retyped.
-- The other 66 public functions were compared too: 10 differed only in comments and whitespace (identical code after
-- stripping both), 56 were byte-identical.
--
-- SECURITY CHANGE: an event trigger is (re)created. It runs `rls_auto_enable()` — SECURITY DEFINER, `search_path =
-- pg_catalog`, both unchanged from production and from the baseline — after every DDL command. `create or replace`
-- keeps the function's grants; the revoke below only restates the V19 rule (no PUBLIC/anon/authenticated EXECUTE),
-- which production already satisfies (acl {postgres, service_role}).
--
-- DEPLOY ORDER: independent of any app code.
-- Idempotent: `drop event trigger if exists` then `create`, so staging (which has the trigger) and production (which
-- does not) both end in the same state.
-- Rollback: `drop event trigger if exists ensure_rls;` (the function can stay; without the trigger it never runs).

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

revoke all on function public.rls_auto_enable() from public, anon, authenticated;

drop event trigger if exists ensure_rls;
create event trigger ensure_rls on ddl_command_end execute function public.rls_auto_enable();
