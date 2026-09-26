-- LATENT-BUGS BUG-09 — needs Rafi to run (read-only). Has any consent been GRANTED on an address that was never confirmed?
-- Column meaning:
--   granted_unconfirmed      — granted consents whose parent's auth user still has email_confirmed_at IS NULL.
--                              >0 = BUG-09 has already happened; those accounts are deleted (with their granted consent
--                              record) by prune_unconfirmed_users() 3 days after sign-up.
--   granted_before_confirm   — granted consents whose confirmed_at (grant time) precedes the user's email_confirmed_at.
--                              >0 = parents granted first and confirmed later (the expired-link path, recovered).
--   positive_control_granted — all granted consents; must be >0 or the query is looking at the wrong table/project.
select
  count(*) filter (where u.email_confirmed_at is null)                          as granted_unconfirmed,
  count(*) filter (where u.email_confirmed_at > c.confirmed_at)                 as granted_before_confirm,
  count(*)                                                                      as positive_control_granted
from public.parental_consents c
join auth.users u on u.id = c.parent_id
where c.state = 'granted';

-- And the setting the whole path depends on (read it in the dashboard, not SQL):
-- Supabase → Authentication → Email → "Email OTP Expiration". A B0 link opened after this many seconds takes the
-- "link expired" branch of /auth/confirm, which sends a parent with a consent token straight to /consent/respond.
