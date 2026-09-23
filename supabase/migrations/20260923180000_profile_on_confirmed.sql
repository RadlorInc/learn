-- Create the profile only once the email is CONFIRMED, not at signup.
--
-- WHY. `handle_new_user()` fired `after insert on auth.users`, i.e. the instant `auth.signUp()`
-- ran — before the confirmation email was clicked. So every signup, including a typo'd address or
-- one someone entered that they do not own, produced a `public.profiles` row immediately, while the
-- account sat "Waiting for verification" for ever. The rows accumulate and the address is reserved
-- against its real owner. Deferring creation to confirmation makes "has a profile" mean "proved the
-- email", which is what the rest of the app already assumes.
--
-- HOW. The trigger now also fires on the UPDATE that Supabase runs when a user clicks the
-- confirmation link (it sets `email_confirmed_at`). The function creates the profile only when
-- `email_confirmed_at is not null`, so:
--   · email/password signup  → INSERT with email_confirmed_at NULL → no profile; the confirm-link
--     UPDATE sets it → profile created then, in the same transaction, before the client redirects
--     to /auth/callback, so getMyRole() sees it.
--   · Google OAuth / confirm-email OFF → email_confirmed_at is set at INSERT → profile created at
--     once, exactly as before. No regression for the OAuth path.
-- `on conflict (id) do nothing` makes it idempotent across the INSERT and UPDATE firings and any
-- re-confirmation.
--
-- ⚠️ SECURITY POSTURE UNCHANGED. Rebased on production's CURRENT body, which is the baseline
-- statement (`supabase/schema/baseline_schema.sql`, `handle_new_user`) — measured 2026-09-23 (deploy
-- loop D4, `d4-5` part A: production's `pg_get_functiondef` md5 `34812ad…` is that statement with
-- different line breaks; nothing in the loop since, D4–D6, redefines it). The ONLY lines changed:
--   + `IF NEW.email_confirmed_at IS NOT NULL THEN` / `END IF;` around the insert
--   ~ `VALUES (…)` loses its `;` and gains `ON CONFLICT (id) DO NOTHING;`
--   ~ the trigger: `after insert` → `after insert or update of email_confirmed_at`
-- It stays `security definer set search_path to 'public'`, same owner. The explicit revoke below
-- restates the posture already set by 20260615142049 (no API role may call it) — a no-op today.
--
-- First written 2026-09-08 as `20260908120000`, never applied, held in `supabase/held/` until
-- 2026-09-23; re-versioned here because a file older than production's newest ledger row is refused
-- by `db push`. Applied by `migrate-prod` behind the `production-db` approval, together with the
-- prune (`20260923180100`) — they are one design: an account is real once it is confirmed, and the
-- unconfirmed are removed. Order-safe with the client in either direction: the client already
-- tolerates a missing profile (getMyRole returns null → role picker).

create or replace function public.handle_new_user()
 returns trigger language plpgsql security definer set search_path to 'public'
as $function$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User'))
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.handle_new_user();
