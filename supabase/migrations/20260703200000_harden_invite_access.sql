-- V1 (CRITICAL) + V11 (Low): close the forged-invite privilege-escalation, add an owner revoke path.
--
-- V1 — Any authenticated user could forge a self-invite for a stranger's learner and self-grant
-- 'viewer' access, then read/tamper another family's child PII. Root cause: the learner_invites
-- INSERT policy only required invited_by = auth.uid() (NOT ownership of the learner), and the invite
-- branch of can_self_grant_access() trusted ANY pending invite to the caller's email regardless of
-- who created it. Confirmed exploitable against prod (rolled back); 0 rows were ever forged in prod.

-- (a) Root cause: an invite may only be created for a learner you OWN.
drop policy if exists "learner_invites: sender" on public.learner_invites;
create policy "learner_invites: sender" on public.learner_invites
  for all to authenticated
  using (invited_by = (select auth.uid()))
  with check (
    invited_by = (select auth.uid())
    and exists (
      select 1 from public.learners l
      where l.id = learner_invites.learner_id
        and l.created_by = (select auth.uid())
    )
  );

-- (b) Defense in depth: the invite branch must ALSO require the INVITER to own the learner, so no
--     legacy/forged row can be used to self-grant even if one existed.
create or replace function public.can_self_grant_access(p_learner_id uuid, p_role text)
returns boolean
  language sql
  security definer
  set search_path = public
  stable
as $$
  select
    exists (
      select 1 from public.learners l
      where l.id = p_learner_id and l.created_by = (select auth.uid())
    )
    or (
      p_role = 'viewer'
      and exists (
        select 1
        from public.learner_invites i
        join public.learners l on l.id = i.learner_id
        where i.learner_id = p_learner_id
          and i.status = 'pending'
          and i.expires_at > now()
          and lower(i.invited_email) = lower((select auth.jwt() ->> 'email'))
          and l.created_by = i.invited_by      -- inviter must own the learner
      )
    );
$$;

-- (c) Cleanup: strip the stray anon table grants on learner_invites (RLS denies anon anyway).
revoke insert, update, delete on public.learner_invites from anon;

-- V11 (Low): learner_access had only SELECT + INSERT policies, so a grant could never be revoked
-- through the API (the revoke RPCs were dropped in 20260617250000). Add an owner-scoped DELETE so an
-- owning parent can withdraw shared/erroneous access. Still owner-only (a viewer can't delete rows).
drop policy if exists "learner_access: delete" on public.learner_access;
create policy "learner_access: delete" on public.learner_access
  for delete to authenticated
  using (
    learner_id in (select id from public.learners where created_by = (select auth.uid()))
  );
