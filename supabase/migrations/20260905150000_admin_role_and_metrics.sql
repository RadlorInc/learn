-- /admin — aggregate-only usage analytics.
--
-- ⚠️ THIS APP IS USED BY CHILDREN. Every function here returns COUNTS, AVERAGES AND DISTRIBUTIONS.
-- None returns a learner id, an account id, a name or an email, and none can be made to: they are
-- `group by` with aggregates, so a per-child row is not expressible rather than merely hidden. If a
-- future panel needs a query that COULD return one row per user, it is the wrong query.
--
-- ⚠️ AND `SECURITY DEFINER` HERE IS DELIBERATE AND IS THE POINT OF THE DESIGN, not boilerplate.
-- These read across every family, which no RLS policy allows and should not. The privilege is
-- contained by three things, all of which must hold together:
--   1. every function's FIRST statement is `admin_assert()`, which raises 42501 for anyone else;
--   2. the return type is json built from aggregates — there is no row to leak;
--   3. `search_path` is pinned, so the caller cannot substitute their own `profiles`.
-- See the SECURITY DEFINER rule in CLAUDE.md.

-- ── the role ─────────────────────────────────────────────────────────────────────────────────
-- Added to the existing enum rather than introduced as an email list in code. There is no
-- "admin@" check anywhere; membership is a row a human sets in the database.
alter type public.profile_role add value if not exists 'admin';

-- ── internal accounts ────────────────────────────────────────────────────────────────────────
-- ⚠️ EMAIL DOMAIN CANNOT IDENTIFY THESE: 10 of 11 production accounts are gmail.com (measured
-- 2026-09-05). This is a flag a human sets, never a heuristic.
alter table public.profiles add column if not exists is_internal boolean not null default false;

comment on column public.profiles.is_internal is
  'Founder/tester account. Excluded from /admin metrics by default. Set by hand — email domain '
  'cannot identify these (10 of 11 accounts are gmail.com).';

-- ── the guard ────────────────────────────────────────────────────────────────────────────────
-- ⚠️ Compares role AS TEXT. `alter type ... add value` above cannot have its new value USED in the
-- same transaction that adds it, and `supabase db push` runs a migration in one. Casting to text
-- avoids that entirely and behaves identically.
create or replace function public.admin_assert()
returns void language plpgsql stable security definer set search_path to 'public' as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role::text = 'admin'
  ) then
    raise exception 'not an administrator' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.admin_assert() from public, anon;
grant execute on function public.admin_assert() to authenticated, service_role;

/*
 ═══ THE DEFINITIONS. Decided once, here, so no panel can quietly disagree. ═══════════════════

  DAY BOUNDARY   America/New_York (US Eastern). Every timestamp in this database is timestamptz,
                 so this is purely presentation. Chosen because the users are in the US; the
                 database is in us-east-1 and the reader may be anywhere, and neither may decide
                 what "a day" means.
  WEEK           ISO — Monday start. `date_trunc('week', ...)` is Monday in Postgres.
  EVENT TIME     `learner_events.client_ts`, NOT `created_at`. Events queue offline and flush
                 later: measured skew up to 8.9 days, and `created_at > client_ts` in 28 of 28
                 cases — always late upload, never a fast clock. client_ts is when it HAPPENED.
  ACTIVE         a learner with a `session_start` event that day, i.e. OPENED THE APP. Not
                 "answered something", not "completed something" — the widest honest definition,
                 applied everywhere.
  UNIT           learner for learning and retention; ACCOUNT for signups. They are different
                 populations (11 accounts, 21 learners) and no panel mixes them silently.
  INTERNAL       excluded by default via profiles.is_internal, which a human sets. A learner is
                 internal if the account that created it is.
  SESSION        a COMPLETED practice run (`public.sessions`), which is the only thing that row
                 records. `started_at` is only a duration input and is nullable — never an
                 activity time. See docs/data-inventory.md.
  SUPPRESSION    p_min_cohort. A bucket with fewer than that many distinct learners returns NULL,
                 which the UI renders as an em dash. Applied IN SQL, so the number never reaches
                 the browser at all.
*/

-- Learners in scope: not internal, resolved through the account that created them.
create or replace view public.admin_scope_learners as
  select l.id, l.age_group, l.created_at, l.created_by
  from public.learners l
  join public.profiles p on p.id = l.created_by
  where p.is_internal = false;

-- Accounts in scope.
create or replace view public.admin_scope_accounts as
  select p.id, p.created_at from public.profiles p where p.is_internal = false;

comment on view public.admin_scope_learners is
  'Non-internal learners. Not exposed to the browser: /admin reads only the aggregate RPCs.';

-- ⚠️ These views carry ids, so nothing may reach them except the DEFINER functions below.
revoke all on public.admin_scope_learners from public, anon, authenticated;
revoke all on public.admin_scope_accounts  from public, anon, authenticated;

-- ═══ PAGE 1 — signups and activity ════════════════════════════════════════════════════════════
create or replace function public.admin_overview(p_min_cohort int default 5)
returns json language plpgsql stable security definer set search_path to 'public' as $$
declare v json; v_tz text := 'America/New_York';
begin
  perform public.admin_assert();
  select json_build_object(
    'computed_at', now(),
    'total_accounts', (select count(*) from public.admin_scope_accounts),
    'total_learners', (select count(*) from public.admin_scope_learners),
    'internal_flagged', (select count(*) from public.profiles where is_internal),

    'daily_signups', (
      select coalesce(json_agg(json_build_object('d', d::text, 'n', n) order by d), '[]'::json)
      from (
        select (a.created_at at time zone v_tz)::date d, count(*) n
        from public.admin_scope_accounts a
        where a.created_at > now() - interval '30 days'
        group by 1
      ) s),

    'weekly_signups', (
      select coalesce(json_agg(json_build_object('d', d::text, 'n', n) order by d), '[]'::json)
      from (
        select date_trunc('week', a.created_at at time zone v_tz)::date d, count(*) n
        from public.admin_scope_accounts a
        where a.created_at > now() - interval '84 days'
        group by 1
      ) s),

    -- DAU: distinct learners with a session_start that day. Suppressed below p_min_cohort.
    'dau', (
      select coalesce(json_agg(json_build_object('d', d::text, 'n', case when n >= p_min_cohort then n end) order by d), '[]'::json)
      from (
        select (e.client_ts at time zone v_tz)::date d, count(distinct e.learner_id) n
        from public.learner_events e
        join public.admin_scope_learners l on l.id = e.learner_id
        where e.event = 'session_start' and e.client_ts > now() - interval '30 days'
        group by 1
      ) s),

    'wau', (
      select coalesce(json_agg(json_build_object('d', d::text, 'n', case when n >= p_min_cohort then n end) order by d), '[]'::json)
      from (
        select date_trunc('week', e.client_ts at time zone v_tz)::date d, count(distinct e.learner_id) n
        from public.learner_events e
        join public.admin_scope_learners l on l.id = e.learner_id
        where e.event = 'session_start' and e.client_ts > now() - interval '84 days'
        group by 1
      ) s),

    -- ⚠️ Today is INCOMPLETE. Returned so the UI can mark it rather than let it read as a decline.
    'today', (now() at time zone v_tz)::date::text,
    -- The oldest event we still hold. Anything before this is gone to the 90-day purge, so a chart
    -- that starts here is not a quiet week — it is the edge of the data.
    'events_since', (select (min(client_ts) at time zone v_tz)::date::text from public.learner_events)
  ) into v;
  return v;
end;
$$;
revoke all on function public.admin_overview(int) from public, anon;
grant execute on function public.admin_overview(int) to authenticated, service_role;

-- ═══ PAGE 2 — learning ════════════════════════════════════════════════════════════════════════
create or replace function public.admin_learning(p_min_cohort int default 5)
returns json language plpgsql stable security definer set search_path to 'public' as $$
declare v json;
begin
  perform public.admin_assert();
  with per_learner as (
    -- DISTINCT chapters completed. A child replaying one chapter ten times has completed one.
    select l.id, l.age_group,
           (select count(distinct s.chapter) from public.sessions s where s.learner_id = l.id) as done
    from public.admin_scope_learners l
  )
  select json_build_object(
    'computed_at', now(),

    -- ⚠️ THE MEAN AND THE MEDIAN TOGETHER, WITH BOTH DENOMINATORS. "Average chapters per user" over
    -- all learners and over learners who opened at least one chapter are different numbers with the
    -- same name, so both are returned and the UI states which is which.
    'chapters_per_learner', (
      select json_build_object(
        'n_all',            count(*),
        'mean_all',         round(avg(done)::numeric, 2),
        'median_all',       percentile_cont(0.5) within group (order by done),
        'n_engaged',        count(*) filter (where done > 0),
        'mean_engaged',     round(avg(done) filter (where done > 0)::numeric, 2),
        'median_engaged',   percentile_cont(0.5) within group (order by done) filter (where done > 0)
      ) from per_learner),

    'chapters_histogram', (
      select coalesce(json_agg(json_build_object('done', done, 'n', n) order by done), '[]'::json)
      from (select done, count(*) n from per_learner group by done) h),

    -- Started vs finished, per chapter, worst completion rate FIRST — that is where the app loses
    -- people. Started = a distinct learner who opened it; finished = one who completed it.
    'chapter_funnel', (
      select coalesce(json_agg(json_build_object(
               'chapter', chapter, 'started', started, 'finished', finished,
               'rate', case when started > 0 then round(finished::numeric / started, 3) end) order by rate_sort, chapter), '[]'::json)
      from (
        select c.id as chapter,
               (select count(distinct e.learner_id) from public.learner_events e
                 join public.admin_scope_learners l on l.id = e.learner_id
                where e.event = 'chapter_open' and e.props->>'chapter' = c.id) as started,
               (select count(distinct s.learner_id) from public.sessions s
                 join public.admin_scope_learners l on l.id = s.learner_id
                where s.chapter = c.id) as finished,
               case when (select count(distinct e.learner_id) from public.learner_events e
                           join public.admin_scope_learners l on l.id = e.learner_id
                          where e.event = 'chapter_open' and e.props->>'chapter' = c.id) > 0
                    then (select count(distinct s.learner_id) from public.sessions s
                           join public.admin_scope_learners l on l.id = s.learner_id
                          where s.chapter = c.id)::numeric
                       / (select count(distinct e.learner_id) from public.learner_events e
                           join public.admin_scope_learners l on l.id = e.learner_id
                          where e.event = 'chapter_open' and e.props->>'chapter' = c.id)
               end as rate_sort
        from public.chapters c
      ) f where started > 0),

    -- Where learners currently are: the band they are in, and how far through they have got.
    'curriculum_position', (
      select coalesce(json_agg(json_build_object(
               'band', age_group, 'learners', n,
               'median_done', med,
               'pct_started', pct) order by age_group), '[]'::json)
      from (
        select age_group,
               count(*) n,
               percentile_cont(0.5) within group (order by done) med,
               round(100.0 * count(*) filter (where done > 0) / nullif(count(*), 0)) pct
        from per_learner group by age_group
      ) b),

    'diagnostic', (
      select json_build_object(
        'completed', count(*) filter (where d.status = 'completed'),
        'in_progress', count(*) filter (where d.status = 'in_progress'))
      from public.diagnostic_sessions d
      join public.admin_scope_learners l on l.id = d.learner_id)
  ) into v;
  return v;
end;
$$;
revoke all on function public.admin_learning(int) from public, anon;
grant execute on function public.admin_learning(int) to authenticated, service_role;

-- ═══ PAGE 3 — funnel and retention ════════════════════════════════════════════════════════════
create or replace function public.admin_funnel(p_min_cohort int default 5)
returns json language plpgsql stable security definer set search_path to 'public' as $$
declare v json; v_tz text := 'America/New_York';
begin
  perform public.admin_assert();
  with acct as (select id, created_at from public.admin_scope_accounts),
  -- Every step is measured on the ACCOUNT, so all four share one denominator. Mixing accounts and
  -- learners inside one funnel is how a drop-off gets invented out of a unit change.
  opened as (
    select distinct l.created_by id from public.admin_scope_learners l
    join public.learner_events e on e.learner_id = l.id and e.event = 'chapter_open'),
  finished as (
    select distinct l.created_by id from public.admin_scope_learners l
    join public.sessions s on s.learner_id = l.id),
  -- "Second session" = came back on a DIFFERENT DAY. Two sessions in one sitting is one visit.
  returned as (
    select l.created_by id from public.admin_scope_learners l
    join public.learner_events e on e.learner_id = l.id and e.event = 'session_start'
    group by l.created_by having count(distinct (e.client_ts at time zone v_tz)::date) >= 2),
  -- Retention by SIGNUP COHORT, never a single global number: with a growing population a global
  -- figure mostly measures how recently people joined.
  cohorts as (
    select l.id, date_trunc('week', l.created_at at time zone v_tz)::date cw
    from public.admin_scope_learners l),
  activity as (
    select distinct c.id, c.cw, date_trunc('week', e.client_ts at time zone v_tz)::date aw
    from cohorts c join public.learner_events e on e.learner_id = c.id and e.event = 'session_start')
  select json_build_object(
    'computed_at', now(),
    'steps', json_build_array(
      json_build_object('step', 'account created',       'n', (select count(*) from acct)),
      json_build_object('step', 'opened a chapter',      'n', (select count(*) from acct a where a.id in (select id from opened))),
      json_build_object('step', 'completed a chapter',   'n', (select count(*) from acct a where a.id in (select id from finished))),
      json_build_object('step', 'came back another day', 'n', (select count(*) from acct a where a.id in (select id from returned)))
    ),
    'cohorts', (
      select coalesce(json_agg(json_build_object(
               'cohort_week', cw::text, 'size', size,
               'weeks', weeks) order by cw), '[]'::json)
      from (
        select c.cw,
               count(distinct c.id) size,
               (select coalesce(json_agg(json_build_object(
                          'offset', off, 'n', case when cnt >= p_min_cohort then cnt end) order by off), '[]'::json)
                from (
                  select ((a.aw - c2.cw) / 7)::int off, count(distinct a.id) cnt
                  from activity a join cohorts c2 on c2.id = a.id
                  where c2.cw = c.cw and a.aw >= c2.cw
                  group by 1 having ((a.aw - c2.cw) / 7)::int between 0 and 3
                ) w) weeks
        from cohorts c
        where c.cw > (now() at time zone v_tz)::date - interval '84 days'
        group by c.cw
      ) k),
    'min_cohort', p_min_cohort
  ) into v;
  return v;
end;
$$;
revoke all on function public.admin_funnel(int) from public, anon;
grant execute on function public.admin_funnel(int) to authenticated, service_role;
