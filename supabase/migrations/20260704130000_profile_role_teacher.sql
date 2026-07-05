-- Product change (founder decision, 2026-07-04): after login, ask the user whether they are a
-- Teacher or a Parent and store it on profiles.role, then route accordingly.
--
-- 1. Add 'teacher' to the user_role enum (previously 'parent' | 'learner'). Additive + backward
--    compatible. Not USED in this migration, so it's safe alongside the ALTERs below in one txn.
-- 2. Make role nullable + drop the 'parent' default so a fresh signup lands with role = NULL. NULL is
--    the "hasn't chosen yet" signal the app uses to show the one-time Teacher/Parent picker. The
--    handle_new_user() trigger inserts (id, display_name) only, so with no default new rows get NULL.
--    Existing rows keep their current 'parent' value (grandfathered — never re-asked).
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'teacher';

ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN role DROP NOT NULL;
