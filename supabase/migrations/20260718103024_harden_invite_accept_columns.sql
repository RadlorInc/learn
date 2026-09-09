-- V12 (Medium) — tenant isolation: the "learner_invites: recipient can accept" UPDATE policy
-- (20260615142138:41-43) pins only invited_email in USING + WITH CHECK, so a recipient can UPDATE
-- ANY invite addressed to their email and rewrite learner_id / invited_by / expires_at / status to
-- arbitrary values. Chained with a self-created invite this re-opens the V1 class: repoint an invite
-- at a stranger's learner AND set invited_by to that learner's owner → can_self_grant_access()'s
-- invite branch (l.created_by = i.invited_by) then passes → self-grant 'viewer' on a stranger's kid.
-- Same class as the CRITICAL V1; MEDIUM only because it needs two non-enumerable UUIDs.
--
-- Fix (honest, RLS-safe): the accept flow only needs to flip status (pending → accepted). RLS
-- WITH CHECK can't reference the row's OLD values, so restrict WHICH COLUMNS an authenticated user
-- may UPDATE via a column-level grant. learner_id / invited_by / invited_email / expires_at become
-- un-writable by clients; the recipient-accept policy still gates that only the addressee touches the
-- row, and only its status. No app change: acceptInvite() already updates status alone.
revoke update on public.learner_invites from authenticated;
grant  update(status) on public.learner_invites to authenticated;
