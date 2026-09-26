-- SEC-02 (docs/review/SECURITY-AUDIT.md): a viewer's access to a child could not be revoked, and a viewer
-- removed by hand could grant themselves access again.
--
-- (1) "learner_access: delete" read `learners`, whose select policy reads `learner_access` again, so every
--     DELETE by `authenticated` failed with 42P17 (infinite recursion) — the owner could not remove a viewer
--     and the viewer's own "remove myself" (removeMyselfFromLearner) failed. The ownership test moves into a
--     SECURITY DEFINER helper, which Postgres does not expand into the policy, so the recursion is gone.
--     New rule: the learner's creator may delete any non-owner row (viewer, child login); a viewer may delete
--     their OWN viewer row. Nobody deletes an owner row through the API; a child login cannot delete anything.
-- (2) A DELETE with a WHERE clause must also pass the SELECT policy, and "learner_access: select" showed a user
--     only their own rows — so the owner could never see (and so never delete) a viewer's row. The select policy
--     gains the same creator branch: an owner can see who has access to their child. Every client read of this
--     table already filters `parent_id = <me>`, and every other policy that reads it does too, so no screen changes.
-- (3) can_self_grant_access() admits a viewer while their invite is 'pending'. The recipient may UPDATE `status`
--     (column grant, 20260718103024) and nothing stopped them setting an ACCEPTED invite back to 'pending'. A
--     trigger now lets status move only out of 'pending' (pending → accepted / expired), never back.
--
-- ⚠️ SECURITY CHANGE: one NEW SECURITY DEFINER function, `is_learner_creator(uuid)`, search_path pinned,
-- EXECUTE revoked from public/anon and granted to `authenticated` only (policies run as the caller, so the
-- caller role needs it). It answers only "did I create this learner", about the caller. No existing function,
-- owner or grant is changed. Deploy order: any — the client sends the same queries before and after.

create or replace function public.is_learner_creator(p_learner_id uuid)
returns boolean
  language sql
  security definer
  set search_path = public
  stable
as $$
  select exists (select 1 from public.learners l where l.id = p_learner_id and l.created_by = (select auth.uid()));
$$;
revoke all on function public.is_learner_creator(uuid) from public, anon, authenticated;
grant execute on function public.is_learner_creator(uuid) to authenticated;

drop policy if exists "learner_access: delete" on public.learner_access;
create policy "learner_access: delete" on public.learner_access
  for delete to authenticated
  using (
    (parent_id = (select auth.uid()) and access_role = 'viewer')
    or (access_role <> 'owner' and public.is_learner_creator(learner_id))
  );

drop policy if exists "learner_access: select" on public.learner_access;
create policy "learner_access: select" on public.learner_access
  for select to authenticated
  using (parent_id = (select auth.uid()) or public.is_learner_creator(learner_id));

create or replace function public.learner_invites_status_forward()
returns trigger
  language plpgsql
  set search_path = public
as $$
begin
  if new.status is distinct from old.status and old.status <> 'pending' then
    raise exception 'invite status can only move forward (% → % refused)', old.status, new.status
      using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function public.learner_invites_status_forward() from public, anon, authenticated;

drop trigger if exists trg_learner_invites_status_forward on public.learner_invites;
create trigger trg_learner_invites_status_forward
  before update of status on public.learner_invites
  for each row execute function public.learner_invites_status_forward();

-- Closing assertions: the change holds, measured, before this migration is allowed to commit.
do $$
declare v_acl text;
begin
  -- the delete no longer recurses: plan it AS `authenticated` (42P17 is raised at planning time).
  set local role authenticated;
  begin
    execute 'explain delete from public.learner_access where learner_id = gen_random_uuid()';
    execute 'explain select 1 from public.learners';
  exception when others then
    reset role;
    raise exception 'SEC-02: learner_access policies still fail to plan as authenticated: % %', sqlstate, sqlerrm;
  end;
  reset role;

  select p.prosecdef::text || '|' || coalesce(array_to_string(p.proconfig, ','), '') || '|' || coalesce(array_to_string(p.proacl::text[], ','), '')
    into v_acl from pg_proc p where p.oid = 'public.is_learner_creator(uuid)'::regprocedure;
  if v_acl not like 'true|search_path=public|%' then
    raise exception 'SEC-02: is_learner_creator must be SECURITY DEFINER with a pinned search_path (%)', v_acl;
  end if;
  if not has_function_privilege('authenticated', 'public.is_learner_creator(uuid)', 'execute')
     or has_function_privilege('anon', 'public.is_learner_creator(uuid)', 'execute') then
    raise exception 'SEC-02: is_learner_creator EXECUTE must be authenticated-only (%)', v_acl;
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_learner_invites_status_forward'
                 and tgrelid = 'public.learner_invites'::regclass and tgenabled <> 'D') then
    raise exception 'SEC-02: the invite status trigger is missing or disabled';
  end if;
end $$;
