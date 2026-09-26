-- N5 — BEFORE applying 20260926100800_consent_needs_confirmed_email.sql. READ-ONLY (SELECT only). Rafi runs it.
-- Apply only AFTER 20260926100600 (FND-15) is applied: this redefines the prune FND-15 wrote.

-- 1. ⚠️ STOP-CHECK. The migration REPLACES these two bodies with the repo's copy plus the N5 lines, so production's
--    bodies must equal the repo's today. md5 of each body as the repo builds it (PGlite, 2026-09-26, after FND-15):
--      consent_grant(text,text,timestamp with time zone)   663d4adf2ece981a2eebf42c70dfa99b
--      prune_unconfirmed_users()                           db1f050640d10d8935e300589f771ee5
--    Any row that differs: do NOT apply; send the difference back.
select p.oid::regprocedure::text as fn, md5(p.prosrc) as md5, p.prosecdef as definer,
       array_to_string(p.proconfig, ',') as config, pg_get_userbyid(p.proowner) as owner
  from pg_proc p
 where p.oid in ('public.consent_grant(text, text, timestamptz)'::regprocedure, 'public.prune_unconfirmed_users()'::regprocedure)
 order by 1;
-- Expected: definer true for both; config 'search_path=public, pg_temp' (consent_grant) and 'search_path=public' (prune).

-- 2. Has the defect already had material? Consents GRANTED while the parent's address was unconfirmed.
--   granted_unconfirmed_now — granted consents whose parent is STILL unconfirmed (they cannot sign in). The migration
--                             does not touch these; it only stops new ones. >0 = tell me, they need a follow-up.
--   declined_at_risk        — unconfirmed accounts older than 3 days whose only kept record is a DECLINED consent:
--                             the prune deletes these tonight (03:37 UTC) until the migration is applied.
--   positive_control        — all consents. Must be > 0, or this is the wrong project.
select
  (select count(*) from public.parental_consents c join auth.users u on u.id = c.parent_id
    where c.state = 'granted' and u.email_confirmed_at is null)                                   as granted_unconfirmed_now,
  (select count(*) from auth.users u where u.email_confirmed_at is null and u.created_at < now() - interval '3 days'
     and exists (select 1 from public.parental_consents c where c.parent_id = u.id and c.state = 'declined')
     and not exists (select 1 from public.parental_consents c where c.parent_id = u.id and c.state in ('granted', 'withdrawn'))
     and not exists (select 1 from public.learners l where l.created_by = u.id))                    as declined_at_risk,
  (select count(*) from public.parental_consents)                                                   as positive_control;
