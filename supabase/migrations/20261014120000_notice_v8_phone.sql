-- ════════════════════════════════════════════════════════════════════════════════════════════════════
-- notice-v8 — the toll-free support line in the notice's "Contact us" (2026-10-14). Data only.
-- ════════════════════════════════════════════════════════════════════════════════════════════════════
--
-- ⚠️ DEPLOY ORDER — approve the `production-db` run for THIS file as soon as production is READY on the
-- commit that sends `notice-v8`. Until then `request_account_consent` refuses the unknown version (P0C04) and
-- the routes fall back as they did for notice-v7 (noticeAheadOfDatabase.test.ts): sign-up sends the
-- confirmation-only email, the dashboard's request answers 503 not_ready. Nothing is written wrongly; new
-- consents just wait for this row.
--
-- What changed in the notice (src/features/consent/copy.ts `NOTICE`, docs/legal/02): "Contact us" adds the
-- phone number 1-888-812-9373. Nothing collected, no purpose, no right changed.
--
-- `reconsent_required = false`: consents to notice-v7 stay current (a contact line is not a material change).
-- seq 8 >= 7, so `notice_names_band` names Kindergarten and Grades 1–2 for it as it does for v7.

insert into public.consent_notice_versions (version, seq, reconsent_required, note) values
  ('notice-v8', 8, false, '2026-10-14 contact: the toll-free support line 1-888-812-9373')
on conflict (version) do nothing;

-- Closing assertions: the file rolls itself back rather than half-apply.
do $$
begin
  if not exists (select 1 from public.consent_notice_versions where version = 'notice-v8' and seq = 8 and not reconsent_required) then
    raise exception 'notice-v8: not registered as expected — rolled back';
  end if;
  if not public.consent_is_current('notice-v7') then
    raise exception 'notice-v8: made notice-v7 consents non-current — rolled back';
  end if;
  if not public.consent_is_current('notice-v8') then
    raise exception 'notice-v8: is not current — rolled back';
  end if;
  if not public.notice_names_band('notice-v8', '3-5') then
    raise exception 'notice-v8: does not name Kindergarten — rolled back';
  end if;
end $$;
