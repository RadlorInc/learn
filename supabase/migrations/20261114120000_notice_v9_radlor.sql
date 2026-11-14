-- ════════════════════════════════════════════════════════════════════════════════════════════════════
-- notice-v9 — the product's new name and address in the notice (2026-11-14). Data only.
-- ════════════════════════════════════════════════════════════════════════════════════════════════════
--
-- ⚠️ DEPLOY ORDER — approve the `production-db` run for THIS file as soon as production is READY on the
-- commit that sends `notice-v9`. Until then `request_account_consent` refuses the unknown version (P0C04) and
-- the routes fall back as they did for notice-v8 (noticeAheadOfDatabase.test.ts): sign-up sends the
-- confirmation-only email, the dashboard's request answers 503 not_ready. Nothing is written wrongly; new
-- consents just wait for this row.
--
-- What changed in the notice (src/features/consent/copy.ts `NOTICE`, docs/legal/02): the product's name
-- (Radlic → Radlor) and the policy links (radlic.com → app.radlor.com, which radlic.com redirects to).
-- Nothing collected, no purpose, no right changed.
--
-- `reconsent_required = false`: consents to notice-v7 and notice-v8 stay current (a name is not a material change).
-- seq 9 >= 7, so `notice_names_band` names Kindergarten and Grades 1–2 for it as it does for v7.

insert into public.consent_notice_versions (version, seq, reconsent_required, note) values
  ('notice-v9', 9, false, '2026-11-14 rename: Radlic → Radlor, radlic.com → app.radlor.com')
on conflict (version) do nothing;

-- Closing assertions: the file rolls itself back rather than half-apply.
do $$
begin
  if not exists (select 1 from public.consent_notice_versions where version = 'notice-v9' and seq = 9 and not reconsent_required) then
    raise exception 'notice-v9: not registered as expected — rolled back';
  end if;
  if not public.consent_is_current('notice-v7') or not public.consent_is_current('notice-v8') then
    raise exception 'notice-v9: made older consents non-current — rolled back';
  end if;
  if not public.consent_is_current('notice-v9') then
    raise exception 'notice-v9: is not current — rolled back';
  end if;
  if not public.notice_names_band('notice-v9', '3-5') then
    raise exception 'notice-v9: does not name Kindergarten — rolled back';
  end if;
end $$;
