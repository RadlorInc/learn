-- ════════════════════════════════════════════════════════════════════════════════════════════════════
-- notice-v6 — the Radlic rename (2026-09-24). Registers the new consent-notice version. Data only.
-- ════════════════════════════════════════════════════════════════════════════════════════════════════
--
-- ⚠️⚠️ DEPLOY ORDER — APPLY THIS BEFORE THE APP THAT SENDS `notice-v6` REACHES PRODUCTION.
-- `request_account_consent` refuses a version it does not know (P0C04 "unknown notice version"), so an app
-- that sends `notice-v6` against a database without this row cannot take ANY new consent: every parent who
-- presses "continue" on the notice gets an error and no email. The other way round is harmless — this row
-- sitting unused while the app still sends `notice-v5` changes nothing (v5 stays current: see below).
-- So: merge → approve the `production-db` run for THIS file → only then promote to `release`.
-- (docs/RENAME-MANUAL.md §B.)
--
-- What changed in the notice (src/features/consent/copy.ts `NOTICE`, docs/legal/02): the product name
-- (Milo → Radlic), its web address (adaptivelearn.radlor.com → radlic.com), and one wording fix
-- ("Withdraw permission for all MY children" → "all YOUR children", matching the button and doc 03).
-- Nothing collected, no purpose, no right changed.
--
-- ⚠️ `reconsent_required = false`: consents to earlier versions stay current. Whether a change of name and
-- domain is a "material change" needing fresh consent is ATTORNEY-PACKET.md A11 — if the answer is yes,
-- the fix is one UPDATE of this row to `true`, and every older consent stops being current.

insert into public.consent_notice_versions (version, seq, reconsent_required, note) values
  ('notice-v6', 6, false, '2026-09-24 rename: Milo/AdaptiveLearn -> Radlic, radlic.com; "all your children"')
on conflict (version) do nothing;

-- Closing assertions: the file rolls itself back rather than half-apply.
do $$
begin
  if not exists (select 1 from public.consent_notice_versions where version = 'notice-v6' and seq = 6 and not reconsent_required) then
    raise exception 'notice-v6: not registered as expected — rolled back';
  end if;
  if not public.consent_is_current('notice-v5') then
    raise exception 'notice-v6: made notice-v5 consents non-current — rolled back';
  end if;
  if not public.consent_is_current('notice-v6') then
    raise exception 'notice-v6: is not current — rolled back';
  end if;
end $$;
