-- NOTICE-V7 — BEFORE the migration 20260928100000 (read-only; counts only — no names, emails or ids). Run in the SQL
-- editor BEFORE approving the production-db run, and keep the output.
-- Expected: every row without INFO says PASS. The INFO rows are what the founder asked to see:
--   · accounts asked again — adults (parents and teachers) whose granted consent is current today. After the migration
--     each one sees "We've changed what we collect" on the dashboard and must answer a new consent email.
--   · children paused — children under those consents. From the migration until their adult answers, the database
--     refuses new progress, events and changes for them. No email tells the adult; they find out on the dashboard.
--   · open requests — consent emails sent but not answered yet. After the migration their link can still grant, but it
--     grants a notice that is no longer current, so that adult is asked once more.
-- Rehearsed on a production-shaped schema by src/__tests__/consentReconsent.test.ts (it asserts these numbers).
select 'ledger does NOT yet have 20260928100000' as check,
       case when not exists (select 1 from supabase_migrations.schema_migrations where version = '20260928100000') then 'PASS' else 'FAIL' end as result
union all select 'notice-v7 is not registered yet',
       case when not exists (select 1 from public.consent_notice_versions where version = 'notice-v7') then 'PASS' else 'FAIL' end
union all select 'the newest notice is notice-v6 (what the app sends today)',
       case when (select version from public.consent_notice_versions order by seq desc limit 1) = 'notice-v6' then 'PASS' else 'FAIL' end
union all select 'INFO accounts asked again',
       (select count(distinct c.parent_id)::text from public.parental_consents c
         where c.scope = 'account' and c.state = 'granted' and public.consent_is_current(c.notice_version))
union all select 'INFO children paused until their adult answers',
       (select count(*)::text from public.learners l join public.parental_consents c on c.id = l.consent_id
         where c.state = 'granted' and public.consent_is_current(c.notice_version))
union all select 'INFO open requests (their link will be asked again after granting)',
       (select count(*)::text from public.parental_consents c where c.state = 'pending' and c.expires_at > now());
