-- ════════════════════════════════════════════════════════════════════════════════════════════════
-- THE PARENT'S EXPORT READS THE TWO TABLES THEY CANNOT: crash records and who can see the child.
--
-- docs/legal/06 Part B3 "See the data" lists nine tables, and names error_events as the one "easy to
-- forget". The export ("Download a copy") is built in the browser from what the parent's own token can
-- read, and error_events is deny-all by RLS (service role only) — so it could never be in the file.
-- learner_access is readable per row but was excluded as "an edge between adults".
--
-- ⚠️ ONE NARROW READ, NOT A POLICY. A select policy on error_events would expose every crash column to
-- every client query path; this returns only the rows for ONE child, only to that child's OWNER, and
-- only the adults' ids and roles — never another adult's email.
--
-- Deploy order: CLIENT FIRST is safe — the export falls back on PGRST202 and says in the file that
-- these two sections could not be read. Not applied anywhere.
-- ════════════════════════════════════════════════════════════════════════════════════════════════
create or replace function public.export_child_records(p_learner_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  if not exists (select 1 from public.learner_access
                  where learner_id = p_learner_id and parent_id = auth.uid() and access_role = 'owner') then
    raise exception 'not_owner' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'crashRecords', coalesce((select jsonb_agg(to_jsonb(e) order by e.at) from public.error_events e
                               where e.learner_id = p_learner_id), '[]'::jsonb),
    'access',       coalesce((select jsonb_agg(jsonb_build_object('adult_id', a.parent_id, 'role', a.access_role,
                                                                 'granted_at', a.granted_at) order by a.granted_at)
                                from public.learner_access a where a.learner_id = p_learner_id), '[]'::jsonb)
  );
end
$$;
revoke all on function public.export_child_records(uuid) from public, anon;
grant execute on function public.export_child_records(uuid) to authenticated;
