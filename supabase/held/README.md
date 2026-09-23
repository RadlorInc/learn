# Held migrations — written, reviewed, NOT applied to production

Files here are real migrations that production has never run. They are kept out of `supabase/migrations/`
because `supabase db push` treats every file there as something production should have: a file dated before
production's newest ledger row makes it refuse to push at all (measured 2026-09-23, deploy loop D4).

| file | what it does | why held |
|---|---|---|
| `20260908120000_profile_on_confirmed.sql` | `handle_new_user` creates the profile only once the email is confirmed; the trigger also fires on `UPDATE OF email_confirmed_at` | Never applied: production still creates the profile at signup (`AFTER INSERT`, measured 2026-09-23 — not a bug, every signup gets a profile). Goes with the prune, as one design. |
| `20260908120100_prune_unconfirmed_users.sql` | deletes `auth.users` that are unconfirmed, older than 3 days and have no child — once at apply, then daily 03:37 UTC (`pg_cron`) | Never applied. Deletes accounts irreversibly, so it ships on its own, after D4, with its retention row in `docs/legal/04` in the same PR. |

**To apply one:** give it a NEW version (today's timestamp) when moving it back into `supabase/migrations/` — its
old version is older than production's ledger and `db push` refuses it. `src/__tests__/profileOnConfirmed.test.ts`
keeps testing both files from here, so the design stays checked while it waits.
