-- FND: what the founder's funnel can and cannot see. READ-ONLY. Needs Rafi to run in the SQL editor.
-- Q1 (FND-04): is admin_funnel structurally zero for the current product?
--   n_chapter_open_30d  = chapter_open events in 30 days (only /game emits it; legacy chapters are hidden)
--   n_sessions_30d      = rows in public.sessions in 30 days (nothing in the lesson flow writes it)
--   If both are 0 while lesson_progress_30d > 0, the funnel's steps 2-4 can only ever read 0 -> metric is one-valued.
select
  (select count(*) from public.learner_events where event='chapter_open'  and client_ts > now()-interval '30 days') as n_chapter_open_30d,
  (select count(*) from public.learner_events where event='session_start' and client_ts > now()-interval '30 days') as n_session_start_30d,
  (select count(*) from public.sessions        where started_at > now()-interval '30 days')                         as n_sessions_30d,
  (select count(*) from public.lesson_progress where updated_at > now()-interval '30 days')                          as lesson_progress_30d;

-- Q2 (FND-05): an activation number that CAN take more than one value. Per parent account created in the last 30 days:
--   activated = any child of the account has >= 1 lesson_progress row (a lesson reached the tracked state) within 7 days of signup.
--   Denominator includes accounts that never added a child, so "0 children" is visible, not hidden.
--   Positive control: the row for the founder's own test account should show activated = true.
select p.id, p.created_at::date as signed_up,
       count(distinct l.id) as children,
       bool_or(lp.updated_at < p.created_at + interval '7 days') as activated_7d
from public.profiles p
left join public.learners l on l.created_by = p.id
left join public.lesson_progress lp on lp.learner_id = l.id
where p.created_at > now()-interval '30 days' and p.role = 'parent'
group by p.id, p.created_at order by p.created_at desc;
-- NOTE: column names (updated_at, started_at, created_by, role) are read from repo migrations, not production; if one
-- errors, the error itself is the answer that the repo and production disagree.
