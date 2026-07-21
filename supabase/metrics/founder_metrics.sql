-- Founder / investor metrics.
--
-- Run in the Supabase SQL editor (or via MCP). Deliberately NOT a view and NOT
-- granted to anon/authenticated: a view over every tenant's rows, granted to
-- app roles, runs as its owner and would bypass RLS — that is the V1
-- cross-tenant class. Keep this founder-only, read via the dashboard.
--
-- ⚠️ INTERNAL_ACCOUNTS below decides what counts as a real user. Confirm it.
-- Everything downstream is wrong if this list is wrong.
--   cbfe6226… → 7 learners, 2026-06-16 → 07-03
--   1774cb3d… → 6 learners, 2026-05-25 → 07-07
-- Both span the build period and together own 13 of 15 learners: dev/E2E accounts.

with internal as (
  select unnest(array[
    'cbfe6226-47e2-4456-a2cc-c6c1639a9a61',
    '1774cb3d-a602-4f12-a8dd-8d14d244248a'
  ]::uuid[]) as id
),
real_users as (
  select u.id, u.created_at, u.last_sign_in_at
  from auth.users u where u.id not in (select id from internal)
),
real_learners as (
  select l.id, l.created_by, l.created_at
  from learners l where l.created_by not in (select id from internal)
),
s as (
  select se.learner_id, se.started_at
  from sessions se where se.learner_id in (select id from real_learners)
)

-- ── 1. Engagement ────────────────────────────────────────────────
-- Unit is a LEARNER playing, not an account logging in: parents sign in rarely,
-- kids play. Fully historical from sessions.started_at — no event tracking
-- needed, and it works retroactively.
select 'dau  (learners active, 1d)'  as metric, count(distinct learner_id)::text as value from s where started_at > now() - interval '1 day'
union all select 'wau  (learners active, 7d)',  count(distinct learner_id)::text from s where started_at > now() - interval '7 days'
union all select 'mau  (learners active, 30d)', count(distinct learner_id)::text from s where started_at > now() - interval '30 days'

-- ── 2. Growth ────────────────────────────────────────────────────
union all select 'accounts (total)',        count(*)::text from real_users
union all select 'accounts (new, 30d)',     count(*)::text from real_users where created_at > now() - interval '30 days'
union all select 'learner profiles',        count(*)::text from real_learners
-- account logins from auth_events (durable history since 2026-07-21; before that only
-- last_sign_in_at existed, latest-only). Parent/teacher ACCOUNT activity — kids playing
-- is the engagement section above.
union all select 'accounts logged in (30d)', count(distinct user_id)::text from auth_events a
  where a.event = 'login' and a.created_at > now() - interval '30 days'
    and a.user_id not in (select id from internal)

-- ── 3. Funnel ────────────────────────────────────────────────────
-- Every stage already lands in a table. leads → diagnostics → plan → play.
union all select 'leads captured',          count(*)::text from diagnostic_leads
union all select 'diagnostics started',     count(*)::text from diagnostic_sessions d where d.learner_id in (select id from real_learners)
union all select 'diagnostics completed',   count(*)::text from diagnostic_sessions d where d.completed_at is not null and d.learner_id in (select id from real_learners)
union all select 'plans created',           count(*)::text from diagnostic_plans p where p.learner_id in (select id from real_learners)
union all select 'learners who ever played',count(distinct learner_id)::text from s

-- ── 4. Efficacy — the one that actually sells this ────────────────
-- "We found a root gap and closed it in 6 weeks, N times." Currently 0: nobody
-- has reached week 6 yet, and the re-check is still manually triggered.
union all select 'rechecks run',            count(*)::text from diagnostic_rechecks r where r.learner_id in (select id from real_learners)
union all select 'gaps CLOSED (the metric)',count(*)::text from diagnostic_rechecks r where r.gap_closed and r.learner_id in (select id from real_learners);
