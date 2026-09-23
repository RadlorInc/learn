-- READ-ONLY. Run in production BEFORE approving `migrate-prod` for 20260923180000 + 20260923180100.
-- Row 1 is what the one-time sweep in 20260923180100 will delete at apply (same predicate, verbatim).
-- Rows 2-3 are the before-counts the proof SQL compares against — write them down.
select 'sweep will delete (unconfirmed, >3 days, no child)' as what, count(*) as n
  from auth.users u
 where u.email_confirmed_at is null
   and u.created_at < now() - interval '3 days'
   and not exists (select 1 from public.learners l where l.created_by = u.id)
union all
select 'confirmed users (must be unchanged after)', count(*) from auth.users where email_confirmed_at is not null
union all
select 'unconfirmed users kept (<=3 days, or with a child)', count(*) from auth.users u
 where u.email_confirmed_at is null
   and (u.created_at >= now() - interval '3 days' or exists (select 1 from public.learners l where l.created_by = u.id))
union all
select 'children (must be unchanged after)', count(*) from public.learners;
