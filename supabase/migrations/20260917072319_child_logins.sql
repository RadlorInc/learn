-- Child logins: a child signs in with a username and password set by the adult who created them.
--
-- ✅ APPLIED TO PRODUCTION 2026-09-17 by hand (ledger version 20260917072319; this file renamed to match).
-- Measured after: the CHECK reads owner/viewer/self, public policy count unchanged at 35, 0 'self' rows.
-- A creator cannot use this to grant another account: the insert policy requires parent_id = auth.uid(),
-- and UNIQUE (learner_id, parent_id) refuses a second row for a child they already own.
--
-- ⚠️⚠️ DEPLOY ORDER: EXPAND-ONLY, APPLY BEFORE THE CLIENT. The only change is widening a CHECK to admit a
-- new value. Nothing running today writes 'self', so this is safe to apply first — and it MUST be, because
-- `main` auto-deploys and `/api/child-login` inserts 'self' rows: with the client live and this not applied,
-- setting a child's login fails at the link step and the route rolls the account back (no half-made account).
--
-- ⚠️ SECURITY POSTURE, CALLED OUT DELIBERATELY: no `security definer` function is added or changed, no
-- policy is added or changed, no grant is changed. The one privilege change is admitting 'self' below.
--
-- WHY 'self' IS ENOUGH (measured against production 2026-09-17, pg_policy + pg_get_functiondef):
--   · every read of a child's data — learners select, sessions, progress, stats, get_learner_bootstrap,
--     sync_session / sync_diagnostic / sync_recheck / start_diagnostic / entitle_revised_step — admits a
--     principal with ANY learner_access row for that learner (`parent_id = auth.uid()`), so a child reaches
--     exactly their own record;
--   · `learners: update` / `learners: delete` / `learner_access: delete` / invites are `created_by`-only, so
--     a child cannot change their topics, rename, delete, invite, or remove anyone;
--   · `learner_access: insert` requires `can_self_grant_access`, whose first branch is `created_by` and whose
--     second admits only 'viewer' via an invite — a child cannot create a 'self' row, and nobody can create
--     one for a learner they did not create. The only writer is /api/child-login, with the service role.
--
-- ⚠️ KNOWN GAP, NOT CLOSED HERE: `delete_my_account` deletes an adult's learners, which cascades the 'self'
-- rows, but NOT the child's auth user. Deleting a single learner from the dashboard calls the route first;
-- deleting a whole account does not, so a child login can outlive its account (it signs in to nothing).

alter table public.learner_access drop constraint if exists learner_access_access_role_check;
alter table public.learner_access add constraint learner_access_access_role_check
  check (access_role = any (array['owner'::text, 'viewer'::text, 'self'::text]));
