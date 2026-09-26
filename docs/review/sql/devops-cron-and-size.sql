-- DEVOPS (OPS-07, OPS-13) — READ-ONLY. For Rafi to run in the Supabase SQL editor on production.
-- Nothing here returns a child's name, answer, email or any row content — counts, sizes, job names only.

-- Q1. Did any pg_cron job FAIL in the last 14 days? (retention/prune/expire jobs promised in docs 04/05)
--   jobname      : which job
--   runs         : how many runs were recorded  -> POSITIVE CONTROL: must be > 0 for every job,
--                  or the job is not running at all (that is a worse answer than "failed")
--   failed       : runs whose status <> 'succeeded'
--   last_run     : newest start time -> older than ~2 days = the job has stopped
--   Meaning: failed > 0 or runs = 0 or last_run stale  => a retention promise is silently broken today.
select j.jobname,
       count(d.runid)                                         as runs,
       count(*) filter (where d.status <> 'succeeded')        as failed,
       max(d.start_time)                                      as last_run
from cron.job j
left join cron.job_run_details d
       on d.jobid = j.jobid and d.start_time > now() - interval '14 days'
group by j.jobname
order by failed desc, j.jobname;

-- Q2. Database size and the five biggest public tables (for the 1k / 10k family projection).
--   db_size   : total, compare with Pro's 8 GB included disk
--   rel / est_rows / total_size : growth drivers; est_rows is the planner estimate (no table scan)
select pg_size_pretty(pg_database_size(current_database())) as db_size;
select c.relname as rel, c.reltuples::bigint as est_rows,
       pg_size_pretty(pg_total_relation_size(c.oid)) as total_size
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by pg_total_relation_size(c.oid) desc limit 5;

-- Q3. Families/children now (denominator for the per-family projection). Counts only.
select (select count(*) from auth.users) as auth_users,
       (select count(*) from public.learners) as learners;
