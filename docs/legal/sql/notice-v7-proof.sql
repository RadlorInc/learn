-- NOTICE-V7 — PROOF, right AFTER the production-db run of 20260928100000 (read-only; counts only). Keep the output.
-- Expected: every row without INFO says PASS. INFO "accounts still to answer" should equal the before-SQL's
-- "accounts asked again" if run straight away, and falls as adults re-consent.
select 'ledger has 20260928100000' as check,
       case when exists (select 1 from supabase_migrations.schema_migrations where version = '20260928100000') then 'PASS' else 'FAIL' end as result
union all select 'notice-v7 registered: seq 7, re-consent required',
       case when exists (select 1 from public.consent_notice_versions where version = 'notice-v7' and seq = 7 and reconsent_required) then 'PASS' else 'FAIL' end
union all select 'notice-v7 is the newest notice',
       case when (select version from public.consent_notice_versions order by seq desc limit 1) = 'notice-v7' then 'PASS' else 'FAIL' end
union all select 'a notice-v6 consent is no longer current',
       case when not public.consent_is_current('notice-v6') then 'PASS' else 'FAIL' end
union all select 'a notice-v7 consent is current',
       case when public.consent_is_current('notice-v7') then 'PASS' else 'FAIL' end
union all select 'INFO accounts still to answer',
       (select count(distinct c.parent_id)::text from public.parental_consents c
         where c.scope = 'account' and c.state = 'granted' and not public.consent_is_current(c.notice_version))
union all select 'INFO accounts that have answered on notice-v7',
       (select count(distinct c.parent_id)::text from public.parental_consents c
         where c.scope = 'account' and c.state = 'granted' and c.notice_version = 'notice-v7');
