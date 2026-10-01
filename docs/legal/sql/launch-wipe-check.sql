-- After launch-wipe-all-accounts.sql: read-only counts. USER DATA rows must all be 0; APP DATA rows must not be 0.
-- Ran on production 2026-10-01 after the wipe: every user row 0; chapters 72, lesson_catalog 341,
-- consent_notice_versions 7, billing_config 1, lesson-audio files 16,986 (as measured that day).
select 'USER DATA (all 0)' as part, t as tbl, n from (
  select 'auth.users' t, count(*) n from auth.users
  union all select 'auth.identities', count(*) from auth.identities
  union all select 'auth.sessions', count(*) from auth.sessions
  union all select 'auth.audit_log_entries', count(*) from auth.audit_log_entries
  union all select 'profiles', count(*) from public.profiles
  union all select 'learners', count(*) from public.learners
  union all select 'learner_access', count(*) from public.learner_access
  union all select 'parental_consents', count(*) from public.parental_consents
  union all select 'lesson_progress', count(*) from public.lesson_progress
  union all select 'point_events', count(*) from public.point_events
  union all select 'subscriptions', count(*) from public.subscriptions
  union all select 'admin_users', count(*) from public.admin_users
  union all select 'deletion_log', count(*) from public.deletion_log
  union all select 'error_events', count(*) from public.error_events
) u
union all
select 'APP DATA (not 0)', t, n from (
  select 'chapters' t, count(*) n from public.chapters
  union all select 'lesson_catalog', count(*) from public.lesson_catalog
  union all select 'consent_notice_versions', count(*) from public.consent_notice_versions
  union all select 'billing_config', count(*) from public.billing_config
  union all select 'lesson-audio files', count(*) from storage.objects where bucket_id = 'lesson-audio'
) a
order by 1 desc, 2;
