-- Product change (founder decision, 2026-07-04): the checkup now REQUIRES an email to start, captured
-- for lead tracking. This table durably records cold-funnel leads (a logged-out visitor who gives an
-- email before the diagnostic) so someone who never completes signup is still counted.
--
-- SECURITY NOTE: this deliberately opens an anonymous INSERT surface (standard email-capture pattern).
-- It is tightly scoped: INSERT only (bounded email length), NO select/update/delete policy, and no
-- SELECT grant — so anon/authenticated can add a lead but nobody can read/enumerate leads via the API
-- (service-role / dashboard only). Spam is the inherent tradeoff of public capture; Supabase Auth rate
-- limits + a future captcha are the mitigations if abused.
create table if not exists public.diagnostic_leads (
  id         uuid primary key default gen_random_uuid(),
  email      text not null check (char_length(email) between 3 and 254),
  band       text check (band is null or char_length(band) <= 24),
  created_at timestamptz not null default now()
);

alter table public.diagnostic_leads enable row level security;

drop policy if exists "diagnostic_leads: insert" on public.diagnostic_leads;
create policy "diagnostic_leads: insert" on public.diagnostic_leads
  for insert to anon, authenticated
  with check (char_length(email) between 3 and 254);

-- Table-level privilege: allow INSERT only (no SELECT/UPDATE/DELETE) as defense-in-depth alongside RLS.
revoke all on public.diagnostic_leads from anon, authenticated;
grant insert on public.diagnostic_leads to anon, authenticated;
