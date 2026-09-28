-- A learner row is deleted only by delete_learner() (and the account/consent paths that call
-- delete_child_data). Those write deletion_log, withdraw a per-child consent, and remove the child's
-- own login. Clients therefore hold no DELETE on public.learners and no policy admits one.
--
-- DEPLOY ORDER: either. The app has deleted through delete_learner since 20260926100600; its fallback
-- to a direct row delete (taken only when that RPC was missing, PGRST202) is removed in the same PR.
-- A bundle from before this PR never takes that fallback either, because delete_learner exists.
--
-- SECURITY CHANGE: on public.learners, the policy "learners: delete" is dropped and the table-level
-- DELETE privilege is revoked from anon and authenticated. No function, owner, search_path or
-- SECURITY DEFINER flag changes. delete_learner / delete_child_data run as their owner, and foreign-key
-- cascades run as the table owner, so neither needs the revoked privilege.
--
-- Rollback: create policy "learners: delete" on public.learners for delete to authenticated
--   using (created_by = (select auth.uid())); grant delete on public.learners to authenticated;

drop policy if exists "learners: delete" on public.learners;
revoke delete on public.learners from anon, authenticated;

do $$
begin
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'learners'
             and cmd in ('DELETE', 'ALL')) then
    raise exception 'learners still has a policy that admits DELETE';
  end if;
  if has_table_privilege('authenticated', 'public.learners', 'DELETE')
     or has_table_privilege('anon', 'public.learners', 'DELETE') then
    raise exception 'a client role still holds DELETE on learners';
  end if;
  -- The paired half: the one deletion path clients use is still callable.
  if not has_function_privilege('authenticated', 'public.delete_learner(uuid)', 'EXECUTE') then
    raise exception 'authenticated can no longer call delete_learner';
  end if;
  -- And the rest of the owner's access is untouched.
  if not (has_table_privilege('authenticated', 'public.learners', 'SELECT')
          and has_table_privilege('authenticated', 'public.learners', 'INSERT')
          and has_table_privilege('authenticated', 'public.learners', 'UPDATE')) then
    raise exception 'authenticated lost SELECT, INSERT or UPDATE on learners';
  end if;
end $$;
