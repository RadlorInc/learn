-- Supabase PERFORMANCE advisors (launch plan C10b). Not launch-blocking at MVP scale; real at
-- thousands of learners. Two classes, both from `get_advisors(type: 'performance')`.
--
-- ⚠️ APPLY VIA THE DEPLOY PIPELINE'S PROD-APPROVAL GATE, not by hand. Nothing here touches data:
-- it rewrites policy predicates and adds indexes.
--
-- ⚠️⚠️ EVERY PREDICATE BELOW WAS READ OFF THE LIVE DATABASE (`pg_policies.qual`), NOT INFERRED.
-- The first draft of this file guessed them from the table names and was WRONG in a way that would
-- have silently changed who can read what: `diagnostic_plan_progress` has no `learner_id` at all —
-- it reaches the parent through `plan_id → diagnostic_plans.learner_id`. A migration that rewrites
-- an RLS policy from memory is a cross-tenant bug with a performance-tuning commit message. If
-- these no longer match what is live, STOP and re-read them.
--
-- The ONLY change to each policy is wrapping `auth.uid()` in a scalar subquery.

-- ── 1. auth_rls_initplan ───────────────────────────────────────────────────────────────────
-- A bare `auth.uid()` in a policy is re-evaluated FOR EVERY ROW; `(select auth.uid())` is evaluated
-- once per statement. Identical semantics — the same fix `20260615142012_secure_learners_rls.sql`
-- already applied to `learners`. These five were written before that lesson.

alter policy "diag_sessions_read" on public.diagnostic_sessions
  using (exists (
    select 1 from public.learner_access la
    where la.learner_id = diagnostic_sessions.learner_id
      and la.parent_id = (select auth.uid())
  ));

alter policy "diag_items_read" on public.diagnostic_items
  using (exists (
    select 1
    from public.diagnostic_sessions s
    join public.learner_access la on la.learner_id = s.learner_id
    where s.id = diagnostic_items.session_id
      and la.parent_id = (select auth.uid())
  ));

alter policy "diag_plans_read" on public.diagnostic_plans
  using (exists (
    select 1 from public.learner_access la
    where la.learner_id = diagnostic_plans.learner_id
      and la.parent_id = (select auth.uid())
  ));

-- ⚠️ THROUGH `plan_id`, NOT `learner_id`. This is the one the first draft got wrong.
alter policy "diag_progress_read" on public.diagnostic_plan_progress
  using (exists (
    select 1
    from public.diagnostic_plans p
    join public.learner_access la on la.learner_id = p.learner_id
    where p.id = diagnostic_plan_progress.plan_id
      and la.parent_id = (select auth.uid())
  ));

alter policy "diag_rechecks_read" on public.diagnostic_rechecks
  using (exists (
    select 1 from public.learner_access la
    where la.learner_id = diagnostic_rechecks.learner_id
      and la.parent_id = (select auth.uid())
  ));

-- ── 2. unindexed_foreign_keys ──────────────────────────────────────────────────────────────
-- A foreign key with no covering index makes both the join and the parent's ON DELETE CASCADE do a
-- sequential scan. The delete path is the one that matters most here: it is what a parent
-- exercising their COPPA deletion right runs.
create index if not exists diagnostic_plans_session_id_idx
  on public.diagnostic_plans (session_id);

create index if not exists diagnostic_rechecks_learner_id_idx
  on public.diagnostic_rechecks (learner_id);

create index if not exists grade_chapters_chapter_id_idx
  on public.grade_chapters (chapter_id);

-- NOT DONE HERE, deliberately: the advisor also reports several UNUSED indexes. They are unused
-- because the app has no traffic yet, not because they are wrong — dropping them now would be
-- optimising against an empty table. Revisit after real usage.
