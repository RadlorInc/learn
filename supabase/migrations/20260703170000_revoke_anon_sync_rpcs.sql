-- Defense-in-depth: stop the anon role from even calling the diagnostic write RPCs.
--
-- These SECURITY DEFINER functions already self-guard (an internal learner_access/auth.uid()
-- ownership check → anon's NULL uid is denied), so this is not a fix for a hole — it just removes
-- the ability to reach them at all from an unauthenticated session, matching sync_session's posture
-- and clearing the advisor's anon-executable WARN. The `authenticated` grant is retained (the app
-- only ever calls these while signed in). Reversible.

revoke execute on function public.sync_diagnostic(uuid, text, text, text, text[], text[], text, text[], text[], jsonb, uuid) from anon, public;
revoke execute on function public.sync_recheck(uuid, int, text, boolean, uuid) from anon, public;
