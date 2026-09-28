-- NOTICE-V7 — PROOF, right AFTER the production-db run of 20260928100000 (read-only; counts only). Keep the output.
-- Expected: every row without INFO says PASS, and "Grade 3-8 children the gate refuses" equals the before-SQL's number.
select 'ledger has 20260928100000' as check,
       case when exists (select 1 from supabase_migrations.schema_migrations where version = '20260928100000') then 'PASS' else 'FAIL' end as result
union all select 'notice-v7 registered: seq 7, NOT re-consent-required',
       case when exists (select 1 from public.consent_notice_versions where version = 'notice-v7' and seq = 7 and not reconsent_required) then 'PASS' else 'FAIL' end
union all select 'notice-v7 is the newest notice',
       case when (select version from public.consent_notice_versions order by seq desc limit 1) = 'notice-v7' then 'PASS' else 'FAIL' end
union all select 'a notice-v6 consent is still current (existing families are not blocked)',
       case when public.consent_is_current('notice-v6') then 'PASS' else 'FAIL' end
union all select 'notice-v6 names Grades 3-8 only; notice-v7 names KG and Grades 1-2 too',
       case when public.notice_names_band('notice-v6', '9-11') and public.notice_names_band('notice-v6', '12-14')
             and not public.notice_names_band('notice-v6', '3-5') and not public.notice_names_band('notice-v6', '6-8')
             and public.notice_names_band('notice-v7', '3-5') and public.notice_names_band('notice-v7', '6-8') then 'PASS' else 'FAIL' end
union all select 'the four changed functions are still SECURITY DEFINER with search_path=public, pg_temp',
       case when (select count(*) from pg_proc where prosecdef and array_to_string(proconfig, ',') = 'search_path=public, pg_temp'
                   and oid in ('public.consent_ok(uuid)'::regprocedure, 'public.enforce_learner_consent()'::regprocedure,
                               'public.consent_grant(text, text, timestamptz)'::regprocedure,
                               'public.consent_request(uuid, text, text, text, text, text, interval, text, timestamptz, boolean)'::regprocedure)) = 4 then 'PASS' else 'FAIL' end
union all select 'consent_request: the old 9-argument version is gone, and neither is callable from the API',
       case when to_regprocedure('public.consent_request(uuid, text, text, text, text, text, interval, text, timestamptz)') is null
             and not has_function_privilege('anon', 'public.consent_request(uuid, text, text, text, text, text, interval, text, timestamptz, boolean)', 'execute')
             and not has_function_privilege('authenticated', 'public.consent_request(uuid, text, text, text, text, text, interval, text, timestamptz, boolean)', 'execute') then 'PASS' else 'FAIL' end
union all select 'notice_names_band is not SECURITY DEFINER and not callable from the API',
       case when not (select prosecdef from pg_proc where oid = 'public.notice_names_band(text, text)'::regprocedure)
             and not has_function_privilege('anon', 'public.notice_names_band(text, text)', 'execute')
             and not has_function_privilege('authenticated', 'public.notice_names_band(text, text)', 'execute') then 'PASS' else 'FAIL' end
union all select 'INFO Grade 3-8 children the gate refuses (must equal the before-SQL)',
       (select count(*)::text from public.learners where age_group in ('9-11', '12-14') and not public.consent_ok(id))
union all select 'INFO KG / Grades 1-2 children waiting for their adult to agree to notice-v7',
       (select count(*)::text from public.learners where age_group in ('3-5', '6-8') and not public.consent_ok(id))
union all select 'INFO adults who have agreed to notice-v7',
       (select count(distinct parent_id)::text from public.parental_consents where scope = 'account' and state = 'granted' and notice_version = 'notice-v7');
