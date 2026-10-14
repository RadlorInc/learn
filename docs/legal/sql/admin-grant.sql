-- MAKE THE FOUNDER'S ACCOUNT AN ADMIN AGAIN (a WRITE; the founder runs it in the Supabase SQL editor on the
-- PRODUCTION project — the agent never does). Needed after the 2026-10-01 launch wipe, which deleted every account
-- including the founder's and so its admin_users row (launch-wipe-all-accounts.sql line 6: "re-add the admin row").
-- admin-users-check.sql read 0 rows on production on 2026-10-06.
--
-- BEFORE: the account must exist, be confirmed and have a password — sign up at radlic.com/auth with the founder's
-- own address, confirm it from the email, and keep the password in the password manager. It needs no child.
--
-- Replace '<founder email>' in BOTH statements, then run them together. Each touches only that one account.
--   1. profiles.is_internal = true keeps the founder's own account out of every /admin count (sign-ups, activation).
--   2. the admin_users row is the ONLY thing that grants /admin (20260905150000).
-- Pre-registered result: statement 1 "UPDATE 1", statement 2 one returned row. "UPDATE 0" or no row → the address
-- has no account (check spelling, or that sign-up finished): nothing was granted. Then run admin-users-check.sql:
-- expect one row with confirmed = true, has_password = true, verified_factors = 0 (two-step is enrolled next).

update public.profiles p
set    is_internal = true
from   auth.users u
where  u.id = p.id and u.email = '<founder email>';

insert into public.admin_users (user_id, note)
select u.id, 'founder, re-added after the 2026-10-01 launch wipe'
from   auth.users u
where  u.email = '<founder email>'
on conflict (user_id) do nothing
returning user_id, granted_at;
