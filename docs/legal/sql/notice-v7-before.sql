-- NOTICE-V7 — BEFORE the migration 20260928100000 (read-only; counts only — no names, emails or ids). Run it in the SQL
-- editor BEFORE approving the production-db run, and keep the output.
-- Expected: every row without INFO says PASS. A FAIL in a STOP-CHECK row means production's function is not the repo's:
-- do NOT apply; send the output back.
-- The INFO rows are what the founder asked to see:
--   · children in Kindergarten (3-5) / Grades 1–2 (6-8) — stored in a band notice-v6 does not name. After the migration
--     the gate refuses new records for each until their adult agrees to notice-v7; their answers wait on the device.
--   · adults of those children — each gets the consent email the first time one of those children is refused.
--   · Grade 3–8 children the gate refuses — must be the SAME number in the proof: the migration blocks none of them.
-- Rehearsed on a production-shaped schema by src/__tests__/consentReconsent.test.ts (it asserts these numbers).
select 'STOP-CHECK consent_ok(uuid) is the repo''s body' as check,
       case when (select md5(prosrc) from pg_proc where oid = 'public.consent_ok(uuid)'::regprocedure) = 'ba1c45968c38356101aa110d5eac8c05' then 'PASS' else 'FAIL' end as result
union all select 'STOP-CHECK enforce_learner_consent() is the repo''s body',
       case when (select md5(prosrc) from pg_proc where oid = 'public.enforce_learner_consent()'::regprocedure) = '85f0a20db612feee89e2c43d5282f9cb' then 'PASS' else 'FAIL' end
union all select 'STOP-CHECK consent_grant(text, text, timestamptz) is the repo''s body',
       case when (select md5(prosrc) from pg_proc where oid = 'public.consent_grant(text, text, timestamptz)'::regprocedure) = 'cab8e71da0cbbbb685a7c3dc7b116d49' then 'PASS' else 'FAIL' end
union all select 'STOP-CHECK consent_request(9 arguments) is the repo''s body',
       case when (select md5(prosrc) from pg_proc where oid = 'public.consent_request(uuid, text, text, text, text, text, interval, text, timestamptz)'::regprocedure) = 'f2acd3acefaf91920a42bb00459515d5' then 'PASS' else 'FAIL' end
union all select 'STOP-CHECK all four are SECURITY DEFINER with search_path=public, pg_temp',
       case when (select count(*) from pg_proc where prosecdef and array_to_string(proconfig, ',') = 'search_path=public, pg_temp'
                   and oid in ('public.consent_ok(uuid)'::regprocedure, 'public.enforce_learner_consent()'::regprocedure,
                               'public.consent_grant(text, text, timestamptz)'::regprocedure,
                               'public.consent_request(uuid, text, text, text, text, text, interval, text, timestamptz)'::regprocedure)) = 4 then 'PASS' else 'FAIL' end
union all select 'ledger does NOT yet have 20260928100000',
       case when not exists (select 1 from supabase_migrations.schema_migrations where version = '20260928100000') then 'PASS' else 'FAIL' end
union all select 'notice-v7 is not registered yet',
       case when not exists (select 1 from public.consent_notice_versions where version = 'notice-v7') then 'PASS' else 'FAIL' end
union all select 'the newest notice is notice-v6 (what the app sends today)',
       case when (select version from public.consent_notice_versions order by seq desc limit 1) = 'notice-v6' then 'PASS' else 'FAIL' end
union all select 'INFO children in Kindergarten (3-5)', (select count(*)::text from public.learners where age_group = '3-5')
union all select 'INFO children in Grades 1-2 (6-8)', (select count(*)::text from public.learners where age_group = '6-8')
union all select 'INFO adults of those children',
       (select count(distinct created_by)::text from public.learners where age_group in ('3-5', '6-8'))
union all select 'INFO Grade 3-8 children the gate refuses (the proof must show the same)',
       (select count(*)::text from public.learners where age_group in ('9-11', '12-14') and not public.consent_ok(id))
union all select 'INFO open consent requests',
       (select count(*)::text from public.parental_consents c where c.state = 'pending' and c.expires_at > now());
