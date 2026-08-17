-- Last function in the public schema still carrying PUBLIC/anon EXECUTE. It is a trigger function
-- (SECURITY INVOKER, returns trigger), so the practical risk was low and the runbook had it filed as
-- "minor cleanup" — but Supabase exposes every public-schema function at /rest/v1/rpc/<name>, and
-- "low risk because of the return type" is a worse guarantee than "not callable". Same class as V19.
--
-- Triggers execute as the table owner and do not consult these grants, so `grades.trg_touch_grades`
-- is unaffected. Verified after applying: the function is no longer callable as `authenticated`
-- (42501), and `pg_proc.proacl` now shows no PUBLIC or anon entry for ANY function in `public`.
revoke all on function public.touch_grades_updated_at() from public, anon, authenticated;
