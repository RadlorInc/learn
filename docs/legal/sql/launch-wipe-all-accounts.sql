-- LAUNCH WIPE (founder's decision, 2026-10-01; RUN on production that day, checked with launch-wipe-check.sql): production holds only the founder's own test accounts (checked with
-- free-trial-signups-since-beta.sql: one adult account, the founder's), so every account and everything about it is
-- deleted before the paid launch. From now on every account is a real family.
--
-- ⚠️ IRREVERSIBLE. Take a backup first (Supabase → Database → Backups, or the nightly backup action) and note its time.
-- ⚠️ The founder's own account and its admin_users row go too: sign up again afterwards and re-add the admin row.
--
-- KEPT (the app's own data, not anybody's): chapters, lesson_catalog, consent_notice_versions, billing_config, and the
-- lesson-audio storage bucket. Everything else in public, and every auth user, is emptied.
-- One transaction: any error and NOTHING is deleted. The checks at the end raise (and so roll back) if a user row is
-- left or if a kept table was emptied.
begin;

truncate table
  public.admin_users, public.auth_events, public.billing_events, public.consent_b3_cancellations,
  public.deletion_log, public.diagnostic_items, public.diagnostic_leads, public.diagnostic_plan_progress,
  public.diagnostic_plans, public.diagnostic_rechecks, public.diagnostic_sessions, public.email_suppressions,
  public.error_events, public.exercise_results, public.game_settings, public.grade_chapters,
  public.grades, public.learner_access, public.learner_events, public.learner_invites, public.learners,
  public.lesson_feedback, public.lesson_progress, public.parent_pins, public.parental_consents, public.point_events,
  public.profiles, public.sessions, public.subscription_seats, public.subscriptions, public.teacher_plans;

delete from auth.users;               -- identities, sessions, refresh tokens, MFA factors go with it (cascade)
delete from auth.audit_log_entries;   -- sign-in history

-- A trigger on auth.users may have written a log row while deleting: empty those again.
truncate table public.deletion_log, public.email_suppressions, public.auth_events;

do $$
declare n bigint;
begin
  select count(*) into n from auth.users;                  if n <> 0 then raise exception 'WIPE FAIL: % auth users left', n; end if;
  select count(*) into n from public.learners;             if n <> 0 then raise exception 'WIPE FAIL: % learners left', n; end if;
  select count(*) into n from public.profiles;             if n <> 0 then raise exception 'WIPE FAIL: % profiles left', n; end if;
  select count(*) into n from public.chapters;             if n = 0 then raise exception 'WIPE FAIL: chapters was emptied'; end if;
  select count(*) into n from public.lesson_catalog;       if n = 0 then raise exception 'WIPE FAIL: lesson_catalog was emptied'; end if;
  select count(*) into n from public.consent_notice_versions; if n = 0 then raise exception 'WIPE FAIL: consent_notice_versions was emptied'; end if;
  select count(*) into n from public.billing_config;       if n <> 1 then raise exception 'WIPE FAIL: billing_config has % rows', n; end if;
  select count(*) into n from storage.objects where bucket_id = 'lesson-audio';
  if n = 0 then raise exception 'WIPE FAIL: the lesson audio is gone'; end if;
  raise notice 'WIPE OK: no accounts left; chapters, catalogue, notices, billing switch and lesson audio kept';
end $$;

commit;
