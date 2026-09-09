-- Restore the email SHAPE check that 20260823221818_leads_server_only silently reverted.
--
-- ⚠️⚠️ AN UNAPPLIED MIGRATION IS A TIME BOMB AIMED AT LATER WORK, AND THIS IS WHAT ONE LOOKS LIKE.
-- leads_server_only was WRITTEN on 2026-08-16 against the policy as it stood that day, which
-- bounded length only. On 2026-08-17, 20260817174352_privacy_and_leads_hardening tightened the
-- same policy to also require an email SHAPE — the V13 fix, whose entire point was that "bounded
-- LENGTH only" meant every 3-character string was a valid lead. Applying the older file on
-- 2026-08-24 recreated the policy as written, dropping the newer check.
--
-- Nothing about the file looked wrong. It was reviewed, it was correct on the day it was written,
-- and it reverted a security fix eight days newer than itself.
--
-- Caught by rls_regression.sql A9b ("a non-email was accepted as a lead") on the first CI run
-- after applying — which is the whole argument for having made that suite run at all. Exposure
-- was minutes and narrow: /api/lead validates with its own regex and `authenticated` is now the
-- only role that can insert. But the DATABASE stopped enforcing it, and the database is where the
-- check has to live.
drop policy if exists "diagnostic_leads: insert" on public.diagnostic_leads;

create policy "diagnostic_leads: insert" on public.diagnostic_leads
  for insert to authenticated
  with check (
    char_length(email) >= 3
    and char_length(email) <= 254
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  );
