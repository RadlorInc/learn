-- PERF review (R4) — query plans for the reads the app makes on every screen. FOR RAFI TO RUN; not run anywhere by the
-- reviewer. Read-only: every statement is an EXPLAIN inside a transaction that is rolled back.
--
-- ⚠️ EXPLAIN ANALYZE EXECUTES the SELECT. All of these are SELECTs (no writes), but they do read child rows, so run them
-- in the SQL editor as postgres and do not paste the output anywhere public — the plans can contain literal ids.
-- Replace :kid with one real learner id (a busy one — most point_events), :parent with that child's parent id.
--
-- What each answers, and what result means what:
--   * "Index Scan / Index Only Scan using <idx>"  → the index the migrations promise exists on production and is used. Fine.
--   * "Seq Scan on <table>" with rows removed by filter in the thousands → a missing index at today's size. Report it.
--   * "Seq Scan" on a table of < ~1,000 rows → normal; Postgres prefers it. NOT a finding at our size.
--   * Execution Time > ~20 ms for a single-child read → worth looking at; < 5 ms → nothing to do.
--   * Buffers: shared read (not hit) in the hundreds → cold data; re-run once and read the warm number.

begin;
set local statement_timeout = '10s';

-- Q1. lesson_progress per child (getLessonRows — runs TWICE per child on /parent, once per /modules visit).
--     Expect: Index Scan using lesson_progress_pkey (learner_id, lesson_id).
explain (analyze, buffers) select lesson_id, done, level, streak, mastered, run from public.lesson_progress where learner_id = :'kid';

-- Q2. last 30 days of points (getRecentPoints — /parent helpers, Performance tab).
--     Expect: Index Scan using point_events_learner_created.
explain (analyze, buffers) select lesson_id, reason, points, created_at from public.point_events
 where learner_id = :'kid' and created_at >= now() - interval '30 days' order by created_at;

-- Q3. mastered dates (getMasteredDates — Performance "Topics mastered").
--     Expect: the partial unique index point_events_once, or point_events_learner_created + filter. Either is fine.
explain (analyze, buffers) select lesson_id, created_at from public.point_events
 where learner_id = :'kid' and reason = 'mastered' order by created_at;

-- Q4. The wallet: game_wallet() sums the WHOLE ledger per call (balance = sum(points)); called once per child per
--     /parent load and on /modules. Grows with every answer a child ever gives. This is the one to watch at 10k families.
--     Expect: Index Only Scan / Index Scan on point_events_learner_created; count = the child's lifetime rows.
explain (analyze, buffers) select coalesce(sum(points), 0), count(*) from public.point_events where learner_id = :'kid';
-- And the function as the app calls it (plans inside plpgsql are not shown; this gives total time):
explain (analyze, buffers) select public.game_wallet(:'kid'::uuid);

-- Q5. The dashboard RPC (one per /parent load). It still reads three legacy tables emptied 2026-09-17.
explain (analyze, buffers) select public.get_parent_dashboard();   -- auth.uid() is null as postgres → returns []; see Q5b
-- Q5b. Its core join, with the parent id filled in:
explain (analyze, buffers) select l.id from public.learner_access la join public.learners l on l.id = la.learner_id where la.parent_id = :'parent';

-- Q6. Received invites (getReceivedInvites — every /parent load). There is NO index on invited_email.
--     Expect today: Seq Scan on learner_invites (tiny table) — NOT a finding unless rows > ~5,000.
explain (analyze, buffers) select * from public.learner_invites
 where invited_email = 'nobody@example.invalid' and status = 'pending' and expires_at > now() order by created_at desc;

-- Q7. Table sizes, to calibrate every plan above (row estimates, not exact counts — cheap).
select relname, n_live_tup, pg_size_pretty(pg_total_relation_size(relid)) as total
  from pg_stat_user_tables where schemaname = 'public'
 order by n_live_tup desc limit 20;

-- Q8. Rows per child in the ledger (tells whether Q4's full-ledger sum is a problem yet). Max and p95.
select max(n) as max_rows_per_child, percentile_disc(0.95) within group (order by n) as p95
  from (select learner_id, count(*) n from public.point_events group by learner_id) t;

rollback;
