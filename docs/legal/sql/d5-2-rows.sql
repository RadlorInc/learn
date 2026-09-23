-- D5 step 2 — READ-ONLY. Run BEFORE and AFTER deleting the target in the app. Keyed by IDs, never by name:
-- after the delete there is no name to look up, and a lookup that finds nothing returns zeros whether or
-- not anything was deleted. Paste the IDs from step 1 into the three lines below (child_login_id: the
-- target's value, or leave 'none' if it has none).
with params as (select
    'TARGET-LEARNER-ID'::text  as target,
    'none'::text               as target_login,
    'CONTROL-LEARNER-ID'::text as control),
p as (select target::uuid as target, nullif(target_login, 'none')::uuid as target_login, control::uuid as control from params),
child_tables as (
  select c.relname::text as t from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and c.relname <> 'parental_consents'
     and exists (select 1 from pg_attribute a where a.attrelid = c.oid and a.attname = 'learner_id' and a.attnum > 0 and not a.attisdropped))
select * from (
  select 0 as ord, 'learners (the child record)' as what,
         (select count(*) from public.learners where id = (select target from p)) as target,
         (select count(*) from public.learners where id = (select control from p)) as control
  union all
  select 1, 'rows in ' || ct.t,
         (xpath('/row/n/text()', query_to_xml(format('select count(*) as n from public.%I where learner_id = %L', ct.t, (select target from p)), false, true, '')))[1]::text::bigint,
         (xpath('/row/n/text()', query_to_xml(format('select count(*) as n from public.%I where learner_id = %L', ct.t, (select control from p)), false, true, '')))[1]::text::bigint
    from child_tables ct
  union all
  select 2, 'the child''s own login (auth.users)',
         (select count(*) from auth.users where id = (select target_login from p)), null
  union all
  select 3, 'consent records still pointing at the child',
         (select count(*) from public.parental_consents where learner_id = (select target from p)),
         (select count(*) from public.parental_consents where learner_id = (select control from p))
) r
order by ord, what;
