-- ⚠️ A SECURITY DEFINER function is created with PUBLIC EXECUTE by default, and Supabase exposes
--   every public-schema function at /rest/v1/rpc/<name>. Without this revoke, any ANONYMOUS caller
--   could delete the crash log on demand — log destruction, handed out by the function added to
--   retain it properly. The cron job runs as the table owner and needs none of these grants.
revoke all on function public.prune_error_events() from public, anon, authenticated;
