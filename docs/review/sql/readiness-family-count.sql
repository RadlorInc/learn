-- READINESS (N28) — how many families are in the beta. READ-ONLY (SELECT only). Rafi runs it; the agent never queries production.
-- Counts only: no names, no addresses. "Since the beta" = accounts created on or after 25 September 2026 (UTC).
--   parent_accounts   — confirmed parent accounts created since the beta opened
--   with_consent      — of those, how many hold a GRANTED consent now
--   children          — children on those accounts
--   positive_control  — all confirmed parent accounts, any date. Must be ≥ parent_accounts, or the role join is wrong.
select
  count(distinct u.id) filter (where u.created_at >= '2026-09-25')                                            as parent_accounts,
  count(distinct u.id) filter (where u.created_at >= '2026-09-25'
    and exists (select 1 from public.parental_consents c where c.parent_id = u.id and c.state = 'granted'))  as with_consent,
  (select count(*) from public.learners l join auth.users a on a.id = l.created_by
    where a.created_at >= '2026-09-25')                                                                       as children,
  count(distinct u.id)                                                                                        as positive_control
from auth.users u
join public.profiles p on p.id = u.id
where u.email_confirmed_at is not null and p.role = 'parent';
-- ⚠️ Test accounts made by the team since 25 Sep are counted too; the database cannot tell them apart (LOOP-STATE item 1).
