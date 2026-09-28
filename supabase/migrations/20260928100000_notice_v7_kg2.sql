-- ════════════════════════════════════════════════════════════════════════════════════════════════════
-- notice-v7 — Kindergarten to Grade 2 (2026-09-28). Registers the new consent-notice version AND makes every
-- earlier consent non-current, so every parent is asked again. Data only: no table, function, policy or grant.
-- ════════════════════════════════════════════════════════════════════════════════════════════════════
--
-- ⚠️⚠️ DEPLOY ORDER — APPROVE THIS `production-db` RUN ONLY AFTER PRODUCTION IS READY ON THE MERGE COMMIT
-- (`npm run smoke:live` passing with the new service worker). `promote` moves `release` without waiting for
-- this job, so the app normally goes first — and that order is the safe one:
--   · app first, this second (the intended order): until this applies, the app asks for `notice-v7`, which the
--     database does not know (P0C04). No NEW consent can be given in that window — /api/consent/request answers
--     503 `not_ready` ("try again"), and a parent signing up gets the confirmation-only email and is asked from the
--     dashboard. Families who already consented are untouched: their consent stays current until this applies.
--   · THIS FIRST, app second (do not): every parent is asked again, but the old app still sends `notice-v6`. B1
--     goes out, and the grant is refused by trg_enforce_learner_consent (v6 is no longer current), so the parent's
--     link fails until the new app is live. Nothing is lost, but every parent who tries in that window hits an error.
--
-- What changed in the notice (src/features/consent/copy.ts `NOTICE` and `B1`, docs/legal/02, 03, 06, 11): the grade
-- band row names Kindergarten and Grades 1–2, stored as the age ranges 3–5 and 6–8 (`bandOf`, since #305 made KG–2
-- live). The notice said only "grades 3–5 or 6–8, stored as 9–11 or 12–14", which is untrue for those children.
--
-- ⚠️⚠️ `reconsent_required = true` — THE FOUNDER'S DECISION (2026-09-28): every parent re-consents on v7. From the
-- moment this applies, every consent to v1–v6 stops being current (consent_is_current), so until each parent answers
-- the new B1: their dashboard shows "We've changed what we collect", and the database refuses new records for their
-- children — progress, events, a changed or a new child (consentReconsent.test.ts drives all three). No email is sent
-- to tell them; they find out on their next dashboard visit. The count this affects: docs/legal/sql/notice-v7-before.sql.
-- Rollback (if the founder reverses the decision): `update public.consent_notice_versions set reconsent_required =
-- false where version = 'notice-v7'` — every earlier consent is current again at once; nothing was deleted.

insert into public.consent_notice_versions (version, seq, reconsent_required, note) values
  ('notice-v7', 7, true, '2026-09-28 KG-2: Kindergarten and Grades 1-2 bands (3-5, 6-8); every parent re-consents')
on conflict (version) do nothing;

-- Closing assertions: the file rolls itself back rather than half-apply.
do $$
begin
  if not exists (select 1 from public.consent_notice_versions where version = 'notice-v7' and seq = 7 and reconsent_required) then
    raise exception 'notice-v7: not registered as expected — rolled back';
  end if;
  if (select max(seq) from public.consent_notice_versions) <> 7 then
    raise exception 'notice-v7: is not the newest version — rolled back';
  end if;
  if not public.consent_is_current('notice-v7') then
    raise exception 'notice-v7: is not current — rolled back';
  end if;
  if public.consent_is_current('notice-v6') then
    raise exception 'notice-v7: notice-v6 consents are still current, so no parent would be asked again — rolled back';
  end if;
end $$;
