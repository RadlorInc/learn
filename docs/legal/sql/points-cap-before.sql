-- POINTS CAP + LESSON CATALOGUE — BEFORE the migration 20260928180000 (read-only; counts and booleans only). Run it in
-- the SQL editor BEFORE approving the production-db run, and keep the output. Every row without INFO should say PASS.
-- A FAIL in a STOP-CHECK means production's function is not the body this migration was written against: do NOT
-- approve; send the output back.
-- What the INFO rows mean, decided before they are read: "points on ids the catalogue will not hold" counts points
-- already paid for ids no lesson has; the migration does not remove them (it only stops new ones). "children over 300
-- today" is how many would have hit today's cap; 0 or a small number is expected.
select 'STOP-CHECK record_lesson_progress is the repo''s body' as check,
       case when (select md5(prosrc) from pg_proc where oid = 'public.record_lesson_progress(uuid,text,boolean,integer,integer,boolean,text,uuid,timestamptz)'::regprocedure) = 'e0b33a569dda6ece72406fd864ad1612' then 'PASS' else 'FAIL' end as result
union all select 'STOP-CHECK record_module_practice is the repo''s body',
       case when (select md5(prosrc) from pg_proc where oid = 'public.record_module_practice(uuid,text,uuid)'::regprocedure) = '19db297283cfb4dc4cd84b6b5476c40e' then 'PASS' else 'FAIL' end
union all select 'ledger does NOT yet have 20260928180000',
       case when not exists (select 1 from supabase_migrations.schema_migrations where version = '20260928180000') then 'PASS' else 'FAIL' end
union all select 'no lesson_catalog table yet',
       case when to_regclass('public.lesson_catalog') is null then 'PASS' else 'FAIL' end
union all select 'INFO lesson_progress rows on an id that is not g3-8 topic or c: chapter shape (expected 0)',
       (select count(*)::text from public.lesson_progress where lesson_id !~ '^(g[3-8]m[0-9]{1,2}-t[0-9]{1,2}|c:[A-Za-z0-9]{1,40})$')
union all select 'INFO distinct lesson ids with progress (compare: the catalogue holds 305 lessons and chapters)',
       (select count(distinct lesson_id)::text from public.lesson_progress)
union all select 'INFO children over 300 points earned today (UTC)',
       (select count(*)::text from (select learner_id from public.point_events where points > 0 and created_at::date = now()::date
                                     group by learner_id having sum(points) > 300) t);
