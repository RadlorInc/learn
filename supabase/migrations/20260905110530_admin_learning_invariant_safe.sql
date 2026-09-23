-- ⚠️ RECOVERED FROM PRODUCTION'S MIGRATION LEDGER, 2026-09-23 (deploy loop D4). This migration was applied
-- to production by hand (created_by admin@radlor.com) and never committed. It is added so the repo matches the
-- ledger — production's supabase_migrations.schema_migrations has a row at this version.
--
-- ONE DELIBERATE CHANGE FROM THE LEDGER'S TEXT: the original's last statement deleted a ledger row —
--   delete from supabase_migrations.schema_migrations where name = 'admin_funnel_nested_steps';
-- — i.e. a hand-applied migration edited the migration history. It is commented out below so that no fresh
-- build (CI, a restore rehearsal, a new environment) ever deletes a ledger row. The ledger keeps the
-- verbatim original: md5(array_to_string(statements, newline)) = 4802f3b61d95951510b7299128b48dba.
-- `supabase db push` matches files by VERSION, never by content, so this edit changes nothing on production.
--
-- Its admin_learning body equals the repo's 20260905150000 version except for comments (measured) and it ran
-- AFTER that file on production despite the earlier version number; in a fresh build it runs first and is
-- then replaced by 20260905150000, which leaves the same behaviour.

create or replace function public.admin_learning(p_min_cohort int default 5)
returns json language plpgsql stable security definer set search_path to 'public' as $$
declare v json;
begin
  perform public.admin_assert();
  with per_learner as (
    select l.id, l.age_group,
           (select count(distinct s.chapter) from public.sessions s where s.learner_id = l.id) as done
    from public.admin_scope_learners l
  )
  select json_build_object(
    'computed_at', now(),
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

    'chapter_funnel', (
      select coalesce(json_agg(json_build_object(
               'chapter', chapter, 'started', started, 'finished', finished,
               'rate', case when started > 0 then round(finished::numeric / started, 3) end) order by rate_sort, chapter), '[]'::json)
      from (
        select c.id as chapter,
               -- STARTED = OPENED **OR** COMPLETED. chapter_open lives in learner_events, purged at
               -- 90 days; sessions are kept for ever. A completion whose open has aged out would
               -- give finished > started and a rate above 100%. Counting completers as starters
               -- (they definitionally are) makes finished <= started true BY CONSTRUCTION.
               (select count(distinct x.learner_id) from (
                  select e.learner_id from public.learner_events e
                    join public.admin_scope_learners l on l.id = e.learner_id
                   where e.event = 'chapter_open' and e.props->>'chapter' = c.id
                  union
                  select s.learner_id from public.sessions s
                    join public.admin_scope_learners l on l.id = s.learner_id
                   where s.chapter = c.id) x) as started,
               (select count(distinct s.learner_id) from public.sessions s
                 join public.admin_scope_learners l on l.id = s.learner_id
                where s.chapter = c.id) as finished,
               case when (select count(distinct x.learner_id) from (
                            select e.learner_id from public.learner_events e
                              join public.admin_scope_learners l on l.id = e.learner_id
                             where e.event = 'chapter_open' and e.props->>'chapter' = c.id
                            union
                            select s.learner_id from public.sessions s
                              join public.admin_scope_learners l on l.id = s.learner_id
                             where s.chapter = c.id) x) > 0
                    then (select count(distinct s.learner_id) from public.sessions s
                           join public.admin_scope_learners l on l.id = s.learner_id
                          where s.chapter = c.id)::numeric
                       / (select count(distinct x.learner_id) from (
                            select e.learner_id from public.learner_events e
                              join public.admin_scope_learners l on l.id = e.learner_id
                             where e.event = 'chapter_open' and e.props->>'chapter' = c.id
                            union
                            select s.learner_id from public.sessions s
                              join public.admin_scope_learners l on l.id = s.learner_id
                             where s.chapter = c.id) x)
               end as rate_sort
        from public.chapters c
      ) f where started > 0),

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
        'in_progress', count(*) filter (where d.status = 'in_progress'),
        'total', count(*))
      from public.diagnostic_sessions d
      join public.admin_scope_learners l on l.id = d.learner_id)
  ) into v;
  return v;
end;
$$;
revoke all on function public.admin_learning(int) from public, anon;
grant execute on function public.admin_learning(int) to authenticated, service_role;

-- delete from supabase_migrations.schema_migrations where name = 'admin_funnel_nested_steps';   -- ⚠️ disabled: see header
