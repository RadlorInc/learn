-- ═══════════════════════════════════════════════════════════════════════════════════════════════
--  ROLLBACK for 20260824090000_billing_schema.sql + 20260824120000_plan_entitlement.sql
--  Captured from PRODUCTION 2026-08-24, BEFORE either was applied. Step 1 of the apply sequence in
--  docs/runbooks/applying-migrations.md.
--
--  ⚠️ THIS IS NOT A BACKUP. It restores what these two migrations replace and nothing else. There is
--  still no backup of the children's data and no PITR — launch blocker B12.
--
--  ⚠️⚠️ CAPTURING THIS IS WHAT CAUGHT A REVERTED SECURITY FIX. `plan_entitlement.sql` had rebuilt
--  `sync_diagnostic` from `20260702131627_diagnostic_idempotency` — OLDER than
--  `20260703014331_harden_rpc_inputs` — so applying it would have silently dropped the V5 payload
--  bounds. The same class as `leads_server_only`, on the same day the runbook rule was written. The
--  source grep that said nothing newer redefined it was CASE-SENSITIVE and the hardening file writes
--  `CREATE OR REPLACE FUNCTION` in capitals. Reading production is what found it.
-- ═══════════════════════════════════════════════════════════════════════════════════════════════

-- ── 1. The two policies these migrations replace ────────────────────────────
-- ⚠️ Verbatim `pg_policies` output with ONE hand correction: an INSERT policy takes WITH CHECK only,
-- and the capture emitted `using (true)` for it (pg_policies reports a null qual there). A captured
-- rollback still has to be READ before it is trusted.
drop policy if exists "sessions: parent can insert" on public.sessions;
create policy "sessions: parent can insert" on public.sessions for insert to public
  with check ((EXISTS ( SELECT 1
   FROM learner_access la
  WHERE ((la.learner_id = sessions.learner_id) AND (la.parent_id = ( SELECT auth.uid() AS uid))))));

drop policy if exists "learner_progress: parent access" on public.learner_progress;
create policy "learner_progress: parent access" on public.learner_progress for all to public
  using ((EXISTS ( SELECT 1
   FROM learner_access la
  WHERE ((la.learner_id = learner_progress.learner_id) AND (la.parent_id = ( SELECT auth.uid() AS uid))))))
  with check ((EXISTS ( SELECT 1
   FROM learner_access la
  WHERE ((la.learner_id = learner_progress.learner_id) AND (la.parent_id = ( SELECT auth.uid() AS uid))))));

-- ── 2. The two replaced FUNCTIONS ───────────────────────────────────────────
-- ⚠️ REPLAYED FROM THE REPO, AND THAT IS A MEASUREMENT RATHER THAN A BELIEF. Production's live
-- bodies were hashed (`prosrc`, comments and whitespace stripped, lower-cased) and compared with
-- the repo's on 2026-08-24. All three matched:
--
--   sync_session(…, p_difficulty integer)   d1c9cab3c6a5afa869958a4ef2345cef  ← 20260820111858_sync_session_difficulty.sql
--   sync_session(… 10 args)                 ab108f90b7f9823ae7ededdce89ca444  ← 20260820111858_sync_session_difficulty.sql
--   sync_diagnostic(… 11 args)              cf46a74591aa0bbf809f69726e483e5f  ← 20260703014331_harden_rpc_inputs.sql
--
-- So the rollback is: re-run those two files' function definitions. Pinning the hash is stronger
-- than pasting 6 KB of SQL here, because a transcription can be wrong and a hash cannot — and
-- transcription-by-assumption is precisely the failure this file exists to record.
--
-- ⚠️ RE-VERIFY BEFORE RELYING ON IT. If either hash no longer matches, production has moved and
-- these files are no longer the rollback:
--   select p.proname, pg_get_function_identity_arguments(p.oid),
--          md5(lower(regexp_replace(regexp_replace(p.prosrc,'--[^\n]*','','g'),'\s+','','g')))
--   from pg_proc p join pg_namespace n on n.oid=p.pronamespace
--   where n.nspname='public' and p.proname in ('sync_session','sync_diagnostic');

-- ── 3. diagnostic_plans — the ONLY row mutation in either migration ─────────
-- All 14 rows were `active = true` at capture time and NO learner had two, so the backfill is a
-- no-op today. Captured anyway: it stops being one the moment anybody retakes the check.
update public.diagnostic_plans set active = true where id in (
  '0a0bf3d7-5fdf-43c2-a06f-6803c7f4ef59','2602260a-8d0c-4451-b7ce-f7cd20ab9c6b',
  '2eb5d84a-2881-4a10-af6c-288a918378ca','2ec65e8f-68ea-43db-9a7f-76e587e8598a',
  '32e9ae3d-b5c3-490c-9cd1-fb4ffdfa3bc9','37af8ec1-98bf-4523-a81f-dd0b8a409aa2',
  '52013513-9ec6-4af1-8230-648513fc9f21','5e39954a-bcba-4a60-8d6f-326d933643f1',
  '6b48a3b8-5045-4d06-8192-27cb9a06eb05','759d3703-7892-4be5-a3b4-60bade457e04',
  '9bdc9fca-ab46-443d-9dd1-e0f88a42a0bd','a8729d23-10fe-4e73-a098-71e30bc22007',
  'b36a7776-38d4-4422-ab2c-b3a1b41e7998','c2e42db4-379b-428c-9012-39933d340826');
drop index if exists public.diagnostic_plans_one_active_per_learner;
alter table public.diagnostic_plans drop column if exists free_chapters;
alter table public.diagnostic_plans drop column if exists revised_chapter;

-- ── 4. Everything else the migrations ADD simply goes ───────────────────────
-- All of it is new and empty at rollback time: three billing tables created empty and one config
-- row. No child data is touched by either migration, which is the only reason this is a
-- proportionate safety net while B12 is open.
drop function if exists public.entitle_revised_step(uuid, text);
drop function if exists public.reassign_learner_seat(uuid, uuid);
drop function if exists public.is_chapter_entitled(uuid, text);
drop table if exists public.subscription_seats;
drop table if exists public.subscriptions;
drop table if exists public.billing_events;
drop table if exists public.billing_config;
alter table public.chapters drop column if exists is_free;
