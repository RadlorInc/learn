-- WHO IS AN ADMIN, AND CAN THAT ACCOUNT SIGN IN AT /admin/login? (read-only; the founder runs it in the Supabase
-- SQL editor — the agent never does). Shows the founder's own admin account(s) only: a row in public.admin_users is
-- the ONLY thing that grants /admin (20260905150000). Paste the result to the agent in chat only, never into a
-- PR, issue or file — it contains an email address.
--
-- Pre-registered meaning (written before the result was seen, 2026-10-06):
--   no row                    → nobody is an admin; /admin answers 404 to everyone. Granting one is a write
--                               (insert into public.admin_users) the founder makes deliberately, not from here.
--   email                     → the address to type at /admin/login.
--   confirmed = false         → the address was never confirmed: password sign-in fails ("Sign-in failed.").
--   has_password = false      → the account has no password (e.g. made with Google sign-in): /admin/login, which
--                               takes email + password only, fails. Set one with "Forgot password?" on /auth.
--   providers                 → how the account can sign in ('email', 'google', …).
--   verified_factors          → authenticators already enrolled for two-step verification (#324). 0 before enrolling.
--   last_sign_in              → when this account last signed in anywhere.

select u.email,
       u.email_confirmed_at is not null                                        as confirmed,
       u.encrypted_password is not null and u.encrypted_password <> ''         as has_password,
       (select string_agg(distinct i.provider, ', ') from auth.identities i where i.user_id = u.id) as providers,
       (select count(*) from auth.mfa_factors f where f.user_id = u.id and f.status = 'verified')  as verified_factors,
       u.last_sign_in_at                                                       as last_sign_in,
       a.granted_at,
       a.note
from public.admin_users a
join auth.users u on u.id = a.user_id
order by a.granted_at;
