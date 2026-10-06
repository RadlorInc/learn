# Runbook: admin access

**Use this when:** an admin turns on two-step verification for `/admin`, or has lost the phone that gives the codes.

`/admin` shows aggregates only and writes nothing. Who may see it is decided in the database: `admin_assert()`, the
first statement of every `admin_*` function, refuses any account not listed in `admin_users`, and — once
`20261006120000` is applied — any token that has not given the authenticator code (`aal` below `aal2`)
([architecture §3](../architecture.md#3-accounts-and-roles)).

## Admin two-step verification

An admin signs in with email and password, then with a 6-digit code from an authenticator app (TOTP, through
Supabase Auth). The code step appears only for an account that has set up an authenticator. Every other account
signs in exactly as before and is shown nothing about it.

### Turning it on (founder, once)

1. **Founder.** In the Supabase dashboard → Authentication → Multi-Factor, check that *App Authenticator (TOTP)* is
   enabled. If it is off, step 3 answers "Could not start: …".
2. **Founder.** Sign in at `/admin/login` and open **Two-step verification** in the `/admin` header (`/admin/mfa`).
3. **Founder.** Press *Set up an authenticator app*. Scan the QR code with the app, or type the key shown under it.
   Enter the 6-digit code the app shows and press *Turn on*. The page then says **On**.
4. **Founder.** Check it in a private window: sign in at `/admin/login`. After the password it must ask for the code,
   and `/admin` must open only after the right code.
5. **Only then** merge the migration that makes the database require the code (`20261006120000`: `admin_assert()`
   also checks the token's `aal`). It follows [migrations.md](migrations.md); its before-SQL
   (`docs/legal/sql/admin-mfa-before.sql`) says FAIL while any admin lacks a verified authenticator. Merged before
   step 3, it locks every admin out of `/admin`; its header carries the rollback.

There are no recovery codes. Use an authenticator app that keeps a backup (most can sync or export).

### Lost authenticator

**Before** the database requires the code:
1. **Founder.** In the Supabase dashboard → Authentication → Users → the admin's account, remove its MFA factor.
   (The agent has not seen this screen as of 2026-09-28; the button's name may differ.)
2. **Founder.** Sign in at `/admin/login` with the password alone and set up a new authenticator at `/admin/mfa`.

**After** the database requires the code, removing the factor is not enough: nothing under `/admin` opens for a
password-only session, `/admin/mfa` included, because every page asks `admin_assert()` first.
1. **Founder.** Remove the factor as above.
2. **Agent.** A migration that re-runs the previous `admin_assert()` definition (it is in the requirement
   migration's rollback comment), through [migrations.md](migrations.md).
3. **Founder.** Set up the new authenticator at `/admin/mfa`.
4. **Agent.** A migration that re-runs the requirement's definition, through [migrations.md](migrations.md).
