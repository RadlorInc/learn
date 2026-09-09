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
-- ⚠️ SECURITY POSTURE UNCHANGED. This is `pg_get_functiondef` of the live function with ONLY the
-- guard added: it stays `security definer set search_path to 'public'`. No owner, definer or
-- search_path change. The only behaviour change is WHEN a profile is created.
--
-- ⚠️ NOT APPLIED TO PROD BY THIS COMMIT. Prod DDL — and a trigger on auth.users especially — is the
-- founder's to run by hand (see handoff). It is safe to apply before or after the client ships:
-- the client already tolerates a missing profile (getMyRole returns null → role picker), so there
-- is no expand/contract ordering constraint here.

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.handle_new_user();
