-- ═══════════════════════════════════════════════════════════════════════════════════════════════
--  ROLLBACK for 20260824133906_billing_schema.sql + 20260824134125_plan_entitlement.sql
--  Captured from PRODUCTION 2026-08-24, BEFORE either was applied. Step 1 of the apply sequence in
--  docs/runbooks/migrations.md.
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

-- ── 1–2. REMOVED 2026-09-28 (20260928190000) ───────────────────────────────
-- These sections restored the pre-billing "sessions: parent can insert" and "learner_progress: parent access"
-- policies and the pre-billing sync_session / sync_diagnostic bodies. Migration 20260928190000 dropped
-- learner_progress, learner_stats and learner_state, dropped those functions and made sessions read-only to every
-- client. Restoring them now would recreate functions that write tables that no longer exist and REOPEN client write
-- paths that were closed on purpose, so a billing rollback no longer touches them. They are in git history
-- (`git log -p -- supabase/schema/rollback_20260824_billing.sql`).

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
