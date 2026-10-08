-- ════════════════════════════════════════════════════════════════════════════════════════════════════
-- Admin data requires two-step verification (written 2026-09-28; renamed 2026-10-06 to sort after 20261001190000 — `supabase db push` refuses a file older than the newest one already applied). `admin_assert()` — the first statement of admin_overview,
-- admin_learning, admin_funnel and admin_activation — now also refuses a token whose `aal` claim is not 'aal2': a
-- session that signed in with the password but has not given its authenticator code. Supabase Auth writes `aal` into
-- every access token ('aal1' after a password, 'aal2' after a TOTP code); PostgREST hands the claims to `auth.jwt()`.
-- ════════════════════════════════════════════════════════════════════════════════════════════════════
--
-- ⚠️⚠️ DEPLOY ORDER — MERGE ONLY AFTER THE FOUNDER'S AUTHENTICATOR IS VERIFIED: `/admin/mfa` says "On", and a fresh
-- sign-in at `/admin/login` asks for the code (docs/runbooks/admin-access.md). The app half (the enrol page and the code
-- step) must already be live. Applied before an admin has a verified factor, this locks every admin out of /admin —
-- `/admin/mfa` included, since it is behind this same check. docs/legal/sql/admin-mfa-before.sql refuses (FAIL) while
-- any admin lacks a verified authenticator.
--
-- ⚠️ SECURITY CHANGE — public.admin_assert(): ONE check added (the three lines marked `-- added`). Copied from
-- `pg_get_functiondef` of the built schema (last defined in 20260905150000); nothing else changed. SECURITY DEFINER,
-- SET search_path TO 'public', the owner and the EXECUTE grants are UNCHANGED — `create or replace` keeps the owner and
-- the ACL, and the block at the bottom asserts all four. Same error as a non-admin (42501, 'not an administrator'), so
-- a password-only caller learns nothing about whether the account is an admin.
-- A service-role token carries no `aal` and is refused too; nothing calls these as service_role (the only caller is
-- /api/admin/metrics, which forwards the signed-in admin's own token).
--
-- ⚠️ STOP-CHECK: this refuses to apply unless admin_assert's body is the one it was written against (md5 of prosrc
-- below). docs/legal/sql/admin-mfa-before.sql shows the same check before approval.
--
-- ROLLBACK (lost authenticator, or applied too early): re-run the previous definition, verbatim from 20260905150000,
-- as a new migration through docs/runbooks/migrations.md. src/__tests__/adminRequiresAal2.test.ts runs these lines.
-- ROLLBACK BEGIN
-- create or replace function public.admin_assert()
-- returns void language plpgsql stable security definer set search_path to 'public' as $$
-- begin
--   if not exists (select 1 from public.admin_users a where a.user_id = auth.uid()) then
--     raise exception 'not an administrator' using errcode = '42501';
--   end if;
-- end;
-- $$;
-- ROLLBACK END

do $$
begin
  if (select md5(prosrc) from pg_proc where oid = 'public.admin_assert()'::regprocedure) <> '58c770f2aa23d2e8546ca9d8e42ddd7b' then
    raise exception 'admin_assert() is not the definition this migration was written against (20260905150000) — nothing applied';
  end if;
end $$;

create temp table admin_assert_before as
  select pg_get_userbyid(proowner) as owner, proacl::text as acl, proconfig::text as cfg, prosecdef as definer
    from pg_proc where oid = 'public.admin_assert()'::regprocedure;

CREATE OR REPLACE FUNCTION public.admin_assert()
 RETURNS void
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not exists (select 1 from public.admin_users a where a.user_id = auth.uid()) then
    raise exception 'not an administrator' using errcode = '42501';
  end if;
  if coalesce(auth.jwt()->>'aal', '') <> 'aal2' then               -- added
    raise exception 'not an administrator' using errcode = '42501'; -- added
  end if;                                                            -- added
end;
$function$;

do $$
declare b record; a record;
begin
  select * into b from admin_assert_before;
  select pg_get_userbyid(proowner) as owner, proacl::text as acl, proconfig::text as cfg, prosecdef as definer, prosrc
    into a from pg_proc where oid = 'public.admin_assert()'::regprocedure;
  if not a.definer or a.cfg is distinct from '{search_path=public}' then
    raise exception 'admin_assert(): SECURITY DEFINER or search_path changed — rolled back';
  end if;
  if a.owner is distinct from b.owner or a.acl is distinct from b.acl or a.cfg is distinct from b.cfg or a.definer is distinct from b.definer then
    raise exception 'admin_assert(): owner, grants, search_path or DEFINER changed (before %, after %) — rolled back', row_to_json(b), row_to_json(a);
  end if;
  if has_function_privilege('anon', 'public.admin_assert()', 'execute')
     or exists (select 1 from pg_proc p, aclexplode(p.proacl) x where p.oid = 'public.admin_assert()'::regprocedure and x.grantee = 0)
     or not has_function_privilege('authenticated', 'public.admin_assert()', 'execute') then
    raise exception 'admin_assert(): EXECUTE is not authenticated-only as before — rolled back';
  end if;
  if a.prosrc !~ 'admin_users' or a.prosrc !~ $re$auth\.jwt\(\)->>'aal'$re$ then
    raise exception 'admin_assert(): does not carry both checks — rolled back';
  end if;
end $$;

drop table admin_assert_before;
