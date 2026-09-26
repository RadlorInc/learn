-- N11 (Rafi, 2026-09-26; MAP-13): closing an account KEEPS the parent's consent record.
--
-- Before: `parental_consents.parent_id → auth.users ON DELETE CASCADE`, so deleting the account (Close your account,
-- the nightly prune, a dashboard delete) deleted every consent record with it, while doc 06 says the record is kept.
--
-- THE CHANGE — one mechanism for every path that deletes an auth user:
--   1. `parent_id` becomes NULLABLE and its FK becomes ON DELETE SET NULL: a kept record no longer names the account.
--   2. a BEFORE DELETE trigger on auth.users settles that parent's consents first:
--        granted          → withdrawn, withdrawn_at = now()  (closing the account ends the consent; this also queues
--                             the B3 cancellation through trg_consent_queue_b3_cancel, exactly as the cascade DELETE did)
--        pending, expired → deleted  (a request nobody answered is not evidence, and would otherwise keep an email
--                             address forever with no account behind it)
--        withdrawn, declined → kept as they are (then SET NULL by the FK)
--   Without step 2, SET NULL alone would leave a closed account's consent reading `granted` and its B3 un-cancelled
--   (the queue trigger fires on a change of STATE, not of parent_id).
--
-- NOT changed: `learner_id → learners ON DELETE CASCADE`. A pre-2026-09-24 per-child consent still goes with its
-- child: nulling it would leave a granted, childless consent that `consent_bind_learner` could hang on a NEW child.
-- Account consents (every consent since consent-once) name no child, so this is only the older per-child rows.
--
-- ⚠️⚠️ SECURITY CHANGE, CALLED OUT: ONE NEW SECURITY DEFINER FUNCTION, `consent_settle_on_account_delete()`, a
-- trigger function on the MANAGED auth.users table (like handle_new_user). DEFINER because GoTrue deletes users as
-- `supabase_auth_admin`, which has no rights on public.parental_consents — an INVOKER trigger would make every
-- dashboard/GoTrue user deletion fail. search_path pinned; EXECUTE revoked from public/anon/authenticated (it returns
-- `trigger`, so the API cannot call it anyway). One existing function changes ONE line: `consent_guard_update` (INVOKER,
-- unchanged posture) lets parent_id go to NULL — see §1b.
-- ⚠️ Deploy order: none. No app code reads parent_id as non-null outside SQL functions keyed on a parent that exists.

-- ── 1. the foreign key: SET NULL (found by its columns, not by an assumed name) ─────────────────────────────────────
alter table public.parental_consents alter column parent_id drop not null;
do $$
declare c text;
begin
  select con.conname into strict c
    from pg_constraint con
   where con.conrelid = 'public.parental_consents'::regclass and con.contype = 'f'
     and con.confrelid = 'auth.users'::regclass
     and con.conkey = array[(select attnum from pg_attribute where attrelid = 'public.parental_consents'::regclass and attname = 'parent_id')];
  execute format('alter table public.parental_consents drop constraint %I', c);
end $$;
alter table public.parental_consents add constraint parental_consents_parent_id_fkey
  foreign key (parent_id) references auth.users(id) on delete set null;

-- ── 1b. the fixed-identity guard must let the FK's SET NULL through, and nothing else ───────────────────────────────
-- `consent_guard_update` (BEFORE UPDATE) refused ANY change to parent_id, and SET NULL is an UPDATE that fires it: without
-- this, every account deletion that keeps a record fails (measured: "…identity, versions and address are fixed once
-- recorded"). Body of 20260924100000 (the last to define it) with ONE line changed: parent_id may become NULL, never
-- another account. Still INVOKER, `search_path = public, pg_temp`, EXECUTE revoked as before.
create or replace function public.consent_guard_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if (new.parent_id is distinct from old.parent_id and new.parent_id is not null)   -- N11: only the FK's SET NULL may clear it
  or new.method          is distinct from old.method
  or new.notice_version  is distinct from old.notice_version
  or new.privacy_version is distinct from old.privacy_version
  or new.terms_version   is distinct from old.terms_version
  or new.lang            is distinct from old.lang
  or new.email_address   is distinct from old.email_address
  or new.requested_at    is distinct from old.requested_at
  or new.token_hash      is distinct from old.token_hash
  or new.expires_at      is distinct from old.expires_at
  or new.scope           is distinct from old.scope           -- CHANGED
  or new.parent_ack_at   is distinct from old.parent_ack_at then -- CHANGED
    raise exception 'a parental consent''s identity, versions and address are fixed once recorded'
      using errcode = 'P0C02';
  end if;

  if old.learner_id is not null and new.learner_id is distinct from old.learner_id
     and not (new.learner_id is null
              and not exists (select 1 from public.learners l where l.id = old.learner_id)) then
    raise exception 'a parental consent cannot be moved to a different child' using errcode = 'P0C02';
  end if;

  if new.state is distinct from old.state and not (
       (old.state = 'pending' and new.state in ('granted', 'declined', 'expired'))
    or (old.state = 'granted' and new.state = 'withdrawn')
  ) then
    raise exception 'parental consent cannot move from % to %', old.state, new.state
      using errcode = 'P0C02';
  end if;
  return new;
end
$$;

revoke all on function public.consent_guard_update() from public, anon, authenticated;

-- ── 2. settle the parent's consents before the account row goes ─────────────────────────────────────────────────────
create or replace function public.consent_settle_on_account_delete()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.parental_consents set state = 'withdrawn', withdrawn_at = now()
   where parent_id = old.id and state = 'granted';
  delete from public.parental_consents where parent_id = old.id and state in ('pending', 'expired');
  return old;
end
$$;
revoke all on function public.consent_settle_on_account_delete() from public, anon, authenticated;

drop trigger if exists trg_consent_settle_on_account_delete on auth.users;
create trigger trg_consent_settle_on_account_delete
  before delete on auth.users
  for each row execute function public.consent_settle_on_account_delete();

-- Closing assertions.
do $$
declare f oid := 'public.consent_settle_on_account_delete()'::regprocedure;
begin
  if not exists (select 1 from pg_constraint where conname = 'parental_consents_parent_id_fkey'
                   and conrelid = 'public.parental_consents'::regclass and confdeltype = 'n') then
    raise exception 'N11: parent_id FK is not ON DELETE SET NULL — rolled back';
  end if;
  if (select count(*) from pg_constraint where conrelid = 'public.parental_consents'::regclass and contype = 'f'
        and confrelid = 'auth.users'::regclass) <> 1 then
    raise exception 'N11: expected exactly one FK from parental_consents to auth.users — rolled back';
  end if;
  if not exists (select 1 from pg_proc where oid = f and prosecdef and proconfig = array['search_path=public, pg_temp'])
     or has_function_privilege('anon', f, 'execute') or has_function_privilege('authenticated', f, 'execute') then
    raise exception 'N11: consent_settle_on_account_delete posture wrong — rolled back';
  end if;
  if pg_get_functiondef('public.consent_guard_update()'::regprocedure)
     !~ 'new\.parent_id is distinct from old\.parent_id and new\.parent_id is not null' then
    raise exception 'N11: consent_guard_update would re-point parent_id or refuse SET NULL — rolled back';
  end if;
  if exists (select 1 from pg_proc where oid = 'public.consent_guard_update()'::regprocedure and prosecdef) then
    raise exception 'N11: consent_guard_update became SECURITY DEFINER — rolled back';
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_consent_settle_on_account_delete'
                   and tgrelid = 'auth.users'::regclass and not tgisinternal) then
    raise exception 'N11: trigger missing on auth.users — rolled back';
  end if;
end $$;
