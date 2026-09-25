-- ════════════════════════════════════════════════════════════════════════════════════════════════════
-- DELETION AUDIT TRAIL (FND-15; docs/legal/READINESS.md "To build": "a record of who deleted which child's
-- data, and when"). Decided by the founder 24 Sep 2026 after ~1,440 event rows left the database around
-- 17 Sep with no record of who, what or when (docs/legal/04 §7).
-- ════════════════════════════════════════════════════════════════════════════════════════════════════
--
-- WHAT IT ADDS: one table, `public.deletion_log`, and ONE insert into it inside every function that deletes
-- a child's data or an account — in the same transaction as the delete, so a deletion without its record
-- cannot commit. A row holds only: when, which path, who acted (a user id, or 'service' / 'system'), the
-- deleted account and learner ids as opaque uuids, and per-table row counts. NEVER a name, an email, an
-- answer or free text — the columns are fixed and `row_counts` may hold numbers only (a CHECK).
--
--   path                        written by                                   one row per
--   delete_child                delete_learner  (dashboard "Delete <name>")  child
--   withdraw_consent_child      consent_withdraw (a pre-consent-once per-child link)   child
--   withdraw_consent_account    consent_withdraw_account (Account → Withdraw…, or the account B3 link)  child
--   close_account               delete_my_account (Account → Close your account)       account
--   prune_unconfirmed           prune_unconfirmed_users (cron, 03:37)        run that deleted something
--   retention                   purge-old-learner-events, prune_error_events, prune_diagnostic_items (cron)  run that deleted something
--
-- The log has NO foreign key to anything it describes, so it survives the deletion it records.
--
-- ⚠️⚠️ SECURITY CHANGES, CALLED OUT. Every function below is SECURITY DEFINER and is REDEFINED here. Each
-- body is copied from the migration that last defined it (named above each one) and the changed lines are
-- marked `-- FND-15`. For every one of them: SECURITY DEFINER unchanged, `search_path` unchanged, owner
-- unchanged, grants unchanged (create or replace keeps the ACL) — asserted at the end of this file.
--   · `delete_child_data(uuid)` is REPLACED by `delete_child_data(uuid, text)`: the second argument is the
--     path its caller names. The new function gets the old one's revoke verbatim (public, anon,
--     authenticated, service_role — callable only from the three DEFINER callers), and the old one is DROPPED.
--   · the cron command of `purge-old-learner-events` is updated in place (same name, same schedule).
--   · the three prune functions repeat the exact revoke their own files applied (public, anon, authenticated) —
--     a no-op on production, where it already holds; it stops this file ever re-creating one API-callable.
-- The new table: RLS ENABLED with NO policies, and every privilege revoked from public, anon, authenticated
-- and service_role; service_role then gets SELECT only. Nothing reachable from the browser can read, write or
-- erase it — the absence of a policy IS the mechanism — and the server can read it but never alter it.
--
-- DEPLOY ORDER: either. No client calls any function whose signature changes here (delete_child_data was
-- never callable from the API); delete_learner, consent_withdraw, withdraw_my_consent and delete_my_account
-- keep their signatures and return values. Nothing a parent, child or teacher sees changes.
--
-- RETENTION OF THE LOG ITSELF: proposed — kept as long as the consent records are kept, with no purge job in
-- this file. ⚠️ RAFI TO CONFIRM (and the attorney: doc 06 note 5, "what we are obliged to retain about a
-- request"). The rows hold ids of people who no longer exist in the database, which resolve to nothing
-- once the 30-day backups have expired.
--
-- ⚠️ WHAT THIS DOES NOT RECORD: a delete that goes through none of these functions — an operator's ad-hoc
-- SQL (the 17 Sep class itself), or an owner deleting a `learners` row straight through its RLS delete
-- policy (the known bypass in docs/legal/ROUND-2.md §3; the app's only such call is the PGRST202 legacy
-- fallback). Closing those needs a trigger on the tables or removing the policy — a separate decision.


-- ── 1. The log ───────────────────────────────────────────────────────────────────────────────────
create table public.deletion_log (
  id          uuid primary key default gen_random_uuid(),
  at          timestamptz not null default now(),
  path        text not null check (path in ('delete_child', 'withdraw_consent_child', 'withdraw_consent_account',
                                            'close_account', 'prune_unconfirmed', 'retention')),
  actor_kind  text not null check (actor_kind in ('user', 'service', 'system')),
  actor_id    uuid,            -- auth.uid() of the signed-in adult who acted; null for 'service' and 'system'
  account_id  uuid,            -- the deleted account, or the account that owned the deleted child
  learner_ids uuid[] not null default '{}',
  row_counts  jsonb not null,  -- {"<table>": <rows>, …} counted before the delete
  constraint deletion_log_actor check ((actor_kind = 'user') = (actor_id is not null)),
  constraint deletion_log_counts_only_numbers check (
    jsonb_typeof(row_counts) = 'object'
    and not jsonb_path_exists(row_counts, '$.* ? (@.type() != "number")'))
);
comment on table public.deletion_log is
  'FND-15: who deleted which child''s data, and when. Ids and counts only. No policies by design; see 20260926100600.';

alter table public.deletion_log enable row level security;
revoke all on table public.deletion_log from public, anon, authenticated, service_role;
grant select on table public.deletion_log to service_role;

-- ── 2. delete_child_data — every child deletion (dashboard, one-child withdrawal, account withdrawal) ──
-- Copied from 20260923140000 (its last definition).
-- Changed lines, each marked `-- FND-15`: the signature gains `p_path text` (so it is a NEW function; the
-- one-argument one is dropped in §3 once no caller names it), four new variables, the count block before
-- the delete, and the one insert. DEFINER, search_path and the revoke are exactly as before.
create or replace function public.delete_child_data(p_learner_id uuid, p_path text)  -- FND-15: + p_path
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_logins uuid[];
  v_counts jsonb := '{}';   -- FND-15
  v_account uuid;           -- FND-15
  t name; c name;           -- FND-15
  n bigint;                 -- FND-15
begin
  select coalesce(array_agg(distinct la.parent_id), '{}') into v_logins
    from public.learner_access la
   where la.access_role = 'self' and la.learner_id = p_learner_id
     and not exists (select 1 from public.learner_access o where o.parent_id = la.parent_id and o.access_role <> 'self')
     and not exists (select 1 from public.learners c where c.created_by = la.parent_id);

  -- FND-15: what is about to go, counted BEFORE it goes, table by table. The tables are read
  -- off the catalog — every foreign key onto learners that CASCADES — so a child table added later is
  -- counted the day it lands. SET NULL keys (parental_consents, subscription_seats) delete nothing and
  -- are not counted. Identifiers come from pg_class/pg_attribute and are quoted with %I.
  select created_by into v_account from public.learners where id = p_learner_id;                -- FND-15
  select count(*) into n from public.learners where id = p_learner_id;                          -- FND-15
  v_counts := jsonb_build_object('learners', n, 'child_logins', coalesce(array_length(v_logins, 1), 0));  -- FND-15
  for t, c in                                                                                     -- FND-15
    select cl.relname, a.attname                                                                  -- FND-15
      from pg_constraint k                                                                        -- FND-15
      join pg_class cl on cl.oid = k.conrelid and cl.relnamespace = 'public'::regnamespace       -- FND-15
      join pg_attribute a on a.attrelid = k.conrelid and a.attnum = k.conkey[1]                  -- FND-15
     where k.contype = 'f' and k.confrelid = 'public.learners'::regclass                          -- FND-15
       and k.confdeltype = 'c' and array_length(k.conkey, 1) = 1                                 -- FND-15
  loop                                                                                            -- FND-15
    execute format('select count(*) from public.%I where %I = $1', t, c) into n using p_learner_id;  -- FND-15
    v_counts := v_counts || jsonb_build_object(t, n);                                             -- FND-15
  end loop;                                                                                       -- FND-15

  update public.parental_consents set state = 'withdrawn', withdrawn_at = now()
   where learner_id = p_learner_id and state = 'granted';

  delete from public.learners where id = p_learner_id;
  delete from auth.users where id = any(v_logins);

  -- FND-15: the record, in the same transaction — if it cannot be written, nothing is deleted.
  insert into public.deletion_log (path, actor_kind, actor_id, account_id, learner_ids, row_counts)       -- FND-15
  values (p_path, case when auth.uid() is null then 'service' else 'user' end, auth.uid(),               -- FND-15
          v_account, array[p_learner_id], v_counts);                                                     -- FND-15
end
$$;
revoke all on function public.delete_child_data(uuid, text) from public, anon, authenticated, service_role;  -- FND-15: the new signature, same revoke

-- ── 3. Its three callers, each now naming its path ─────────────────────────────────────────────
-- Copied from 20260923140000 (its last definition).
create or replace function public.delete_learner(p_learner_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  if not exists (select 1 from public.learner_access
                  where learner_id = p_learner_id and parent_id = auth.uid() and access_role = 'owner') then
    raise exception 'not_owner' using errcode = '42501';
  end if;
  perform public.delete_child_data(p_learner_id, 'delete_child');   -- FND-15: names its path
end
$$;
revoke all on function public.delete_learner(uuid) from public, anon;
grant execute on function public.delete_learner(uuid) to authenticated;

-- Copied from 20260924100000 (its last definition).
create or replace function public.consent_withdraw_account(p_parent uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  k uuid;
begin
  for k in select id from public.learners where created_by = p_parent loop
    perform public.delete_child_data(k, 'withdraw_consent_account');   -- FND-15: names its path
  end loop;
  update public.parental_consents set state = 'withdrawn', withdrawn_at = now()
   where parent_id = p_parent and state = 'granted';
  update public.parental_consents set state = 'expired'
   where parent_id = p_parent and state = 'pending';
end
$$;
revoke all on function public.consent_withdraw_account(uuid) from public, anon, authenticated, service_role;

-- Copied from 20260924100000 (its last definition).
create or replace function public.consent_withdraw(p_token_hash text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r public.parental_consents;
begin
  select * into r from public.parental_consents where token_hash = p_token_hash for update;
  if not found then return 'unknown'; end if;
  if r.state <> 'granted' then return r.state; end if;
  if r.scope = 'account' then                                   -- CHANGED
    perform public.consent_withdraw_account(r.parent_id);       -- CHANGED
    return 'withdrawn';                                         -- CHANGED
  end if;                                                       -- CHANGED
  update public.parental_consents set state = 'withdrawn', withdrawn_at = now() where id = r.id;
  if r.learner_id is not null then perform public.delete_child_data(r.learner_id, 'withdraw_consent_child'); end if;  -- FND-15: names its path
  return 'withdrawn';
end
$$;

-- FND-15: no caller names the one-argument delete_child_data any more (the three above were its only callers;
-- 20260923170000 called it once, at apply time, inside a DO block). Dropped so nothing can reach a deletion
-- that writes no record.
drop function public.delete_child_data(uuid);

-- ── 4. delete_my_account — Account → Close your account ─────────────────────────────────────────
-- Copied from 20260917090504 (its last definition).
create or replace function public.delete_my_account(p_confirm_email text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid     uuid := auth.uid();
  v_email   text := auth.jwt() ->> 'email';
  v_authed_at timestamptz;
  v_learners uuid[];
  v_child_logins uuid[];
  v_counts  jsonb;
begin
  -- ── who ──────────────────────────────────────────────────────────────────────────────────────
  if v_uid is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;

  /**
   * ⚠️ RE-AUTHENTICATION, AND WHY IT IS THE TOKEN'S AGE RATHER THAN A PASSWORD PROMPT.
   *
   * The risk this defends against is specific: a child using a parent's signed-in device. A
   * password check cannot be the answer because half the accounts here sign in with Google and
   * have no password at all; an emailed code cannot be, because this project has no verified SMTP
   * sender and the default one is rate-limited to a couple of messages an hour.
   *
   * ⚠️⚠️ AND IT IS `amr`, NOT `iat`. This is the whole guard and getting it wrong would have left
   * the hole exactly where the risk is. supabase-js refreshes the access token on its own, roughly
   * hourly, and a refreshed token carries a BRAND NEW `iat` — so a family device that has simply
   * been left open mints a "fresh" token every hour without anybody proving anything. An `iat`
   * check would have been satisfied by a tablet sitting on a kitchen table.
   *
   * `amr` (Authentication Methods References) carries the moment the user actually authenticated,
   * with the method that did it, and a refresh does NOT move it. That is the claim that means
   * "this person proved who they are recently" rather than "this session is still alive".
   *
   * ⚠️ Absent `amr` is a REFUSAL, not a pass. An old or unusual token that does not carry the claim
   * cannot demonstrate recent authentication, so it must not be allowed to delete a family. The
   * parent signs in again and the new token has it. Fails closed.
   *
   * Ten minutes: long enough to read the page, take the export and think about it; far short of the
   * session a device has been carrying since yesterday.
   */
  select to_timestamp(max((e ->> 'timestamp')::bigint))
    into v_authed_at
    from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) e
   where e ? 'timestamp';

  if v_authed_at is null or v_authed_at < now() - interval '10 minutes' then
    raise exception 'reauth_required' using errcode = '42501';
  end if;

  -- ── and the deliberate typed thing, checked against the TOKEN's email, never a posted one ─────
  if v_email is null or lower(trim(coalesce(p_confirm_email, ''))) <> lower(v_email) then
    raise exception 'confirm_mismatch' using errcode = '22023';
  end if;

  -- ── what is about to go ──────────────────────────────────────────────────────────────────────
  -- OWNED learners only. A child this account was merely INVITED to view belongs to somebody else:
  -- their learner_access row goes (it cascades from profiles) but the child does not.
  select coalesce(array_agg(id), '{}') into v_learners
    from public.learners where created_by = v_uid;

  -- The children's OWN login accounts (access_role 'self', written only by /api/child-login). Guarded so this can
  -- only ever reach a child's login: an account with any non-self access row, or that created a learner, is an
  -- adult's and is never touched — and never this caller.
  select coalesce(array_agg(distinct la.parent_id), '{}') into v_child_logins
    from public.learner_access la
   where la.access_role = 'self' and la.learner_id = any(v_learners) and la.parent_id <> v_uid
     and not exists (select 1 from public.learner_access o where o.parent_id = la.parent_id and o.access_role <> 'self')
     and not exists (select 1 from public.learners c where c.created_by = la.parent_id);

  select jsonb_build_object(
    'learners',                 (select count(*) from public.learners            where id = any(v_learners)),
    'sessions',                 (select count(*) from public.sessions            where learner_id = any(v_learners)),
    'learner_progress',         (select count(*) from public.learner_progress    where learner_id = any(v_learners)),
    'learner_stats',            (select count(*) from public.learner_stats       where learner_id = any(v_learners)),
    'learner_state',            (select count(*) from public.learner_state       where learner_id = any(v_learners)),
    'learner_events',           (select count(*) from public.learner_events      where learner_id = any(v_learners)),
    'learner_access',           (select count(*) from public.learner_access      where learner_id = any(v_learners) or parent_id = v_uid),
    'learner_invites',          (select count(*) from public.learner_invites     where learner_id = any(v_learners) or invited_by = v_uid),
    'diagnostic_sessions',      (select count(*) from public.diagnostic_sessions where learner_id = any(v_learners)),
    'diagnostic_plans',         (select count(*) from public.diagnostic_plans    where learner_id = any(v_learners)),
    'diagnostic_rechecks',      (select count(*) from public.diagnostic_rechecks where learner_id = any(v_learners)),
    'diagnostic_items',         (select count(*) from public.diagnostic_items d
                                   join public.diagnostic_sessions s on s.id = d.session_id
                                  where s.learner_id = any(v_learners)),
    'diagnostic_plan_progress', (select count(*) from public.diagnostic_plan_progress pp
                                   join public.diagnostic_plans p on p.id = pp.plan_id
                                  where p.learner_id = any(v_learners)),
    'error_events',             (select count(*) from public.error_events        where learner_id = any(v_learners)),
    'grades',                   (select count(*) from public.grades              where created_by = v_uid),
    'subscriptions',            (select count(*) from public.subscriptions       where account_id = v_uid),
    'auth_events',              (select count(*) from public.auth_events         where user_id = v_uid),
    'child_logins',             coalesce(array_length(v_child_logins, 1), 0)
  ) into v_counts;

  /**
   * ⚠️ error_events IS THE ONE TABLE WITH NO FOREIGN KEY TO learners, so nothing deletes it for us
   * and a cascade cannot reach it. Left alone it keeps a dangling learner_id — a reference to a
   * child who no longer exists — for up to 90 days until `prune-error-events` gets to it. That is
   * the only orphan this schema can produce, and it is closed here explicitly rather than by
   * adding an FK, because the rows are crash telemetry that must survive their learner in the
   * ORDINARY case (a learner deleted on its own) for a fault to stay diagnosable. Here the whole
   * account is going, so the link must go with it.
   */
  delete from public.error_events where learner_id = any(v_learners);

  -- The children, and with them everything keyed on learner_id: sessions, progress, stats, state,
  -- events, access, invites, diagnostic sessions (-> items, rechecks) and plans (-> plan progress).
  -- All CASCADE; `subscription_seats.learner_id` is SET NULL and the seat row itself goes with the
  -- subscription below.
  delete from public.learners where created_by = v_uid;

  /**
   * ⚠️ AND THE AUTH ROW LAST, IN THE SAME TRANSACTION. This cascades profiles, admin_users,
   * auth_events, grades (-> grade_chapters) and subscriptions (-> subscription_seats), and SETs
   * billing_events.account_id to NULL — see the migration comment and docs; billing_events is the
   * one thing that deliberately survives, stripped of who it belonged to.
   *
   * ⚠️ It is a DELETE on a MANAGED schema. It runs as this function's owner; if that role may not
   * delete from auth.users the exception aborts the whole transaction and NOTHING above is
   * committed, which is the correct way for this to fail.
   */
  delete from auth.users where id = any(v_child_logins);   -- cascades their profile and 'self' access rows
  delete from auth.users where id = v_uid;

  -- FND-15: the record, in the same transaction. v_counts is the census above, taken before anything went.
  insert into public.deletion_log (path, actor_kind, actor_id, account_id, learner_ids, row_counts)   -- FND-15
  values ('close_account', 'user', v_uid, v_uid, v_learners, v_counts);                              -- FND-15

  return v_counts;
end;
$$;

-- ── 5. The unattended deletions: prune_unconfirmed_users and the three retention jobs on child data ──
-- Copied from 20260923180100 (its last definition).
-- ⚠️ Copied from 20260926100100 (BUG-09, #241 — this PR is stacked on it): its guard line is KEPT. A copy of the
-- older 20260923180100 body would silently remove BUG-09's protection of granted consent records.
create or replace function public.prune_unconfirmed_users()
returns void
language sql
security definer
set search_path to 'public'
as $$
  with gone as (                                                                         -- FND-15
  delete from auth.users u
  where u.email_confirmed_at is null
    and u.created_at < now() - interval '3 days'
    and not exists (select 1 from public.learners l where l.created_by = u.id)
    and not exists (select 1 from public.parental_consents c where c.parent_id = u.id and c.state in ('granted', 'withdrawn'))  -- BUG-09 (20260926100100), kept
  returning 1)                                                                           -- FND-15
  insert into public.deletion_log (path, actor_kind, row_counts)                         -- FND-15
  select 'prune_unconfirmed', 'system', jsonb_build_object('auth.users', count(*))       -- FND-15
    from gone having count(*) > 0;                                                       -- FND-15
$$;
-- The revoke 20260923180100 already applied, repeated so this file never leaves the function API-callable even on a
-- database that somehow lacks it (it is a no-op where it holds). Not a grant change: asserted below.
revoke all on function public.prune_unconfirmed_users() from public, anon, authenticated;

-- Copied from 20260817174352 (its last definition).
create or replace function public.prune_error_events()
returns void
language sql
security definer
set search_path to 'public'
as $$
  with gone as (                                                                         -- FND-15
  delete from public.error_events where at < now() - interval '90 days'
  returning 1)                                                                           -- FND-15
  insert into public.deletion_log (path, actor_kind, row_counts)                         -- FND-15
  select 'retention', 'system', jsonb_build_object('error_events', count(*))             -- FND-15
    from gone having count(*) > 0;                                                       -- FND-15
$$;
-- The revoke 20260817174723 already applied, repeated so this file never leaves the function API-callable even on a
-- database that somehow lacks it (it is a no-op where it holds). Not a grant change: asserted below.
revoke all on function public.prune_error_events() from public, anon, authenticated;

-- Copied from 20260823213619 (its last definition).
create or replace function public.prune_diagnostic_items()
returns void
language sql
security definer
set search_path to 'public'
as $$
  with gone as (                                                                         -- FND-15
  delete from public.diagnostic_items where created_at < now() - interval '90 days'
  returning 1)                                                                           -- FND-15
  insert into public.deletion_log (path, actor_kind, row_counts)                         -- FND-15
  select 'retention', 'system', jsonb_build_object('diagnostic_items', count(*))         -- FND-15
    from gone having count(*) > 0;                                                       -- FND-15
$$;
-- The revoke 20260823213619 already applied, repeated so this file never leaves the function API-callable even on a
-- database that somehow lacks it (it is a no-op where it holds). Not a grant change: asserted below.
revoke all on function public.prune_diagnostic_items() from public, anon, authenticated;

-- Copied from 20260823215352 (its last schedule).
-- FND-15: the command is the same delete, wrapped so the rows it removed are counted into the log. Same job
-- name, so cron.schedule UPDATES it in place (see 20260823215352) — there is no moment with no purge job.
select cron.schedule('purge-old-learner-events', '17 3 * * *',
  $$with gone as (delete from public.learner_events where created_at < now() - interval '90 days' returning 1)
    insert into public.deletion_log (path, actor_kind, row_counts)
    select 'retention', 'system', jsonb_build_object('learner_events', count(*)) from gone having count(*) > 0$$);

-- ── 6. Closing assertions — any failure rolls the whole file back ────────────────────────────────────
do $$
declare
  f record;
begin
  -- the table: RLS on, no policy, unreachable from the API, readable (only) by the server
  if not (select relrowsecurity from pg_class where oid = 'public.deletion_log'::regclass) then
    raise exception 'deletion_log: RLS is off — rolled back';
  end if;
  if exists (select 1 from pg_policy where polrelid = 'public.deletion_log'::regclass) then
    raise exception 'deletion_log: has a policy — rolled back';
  end if;
  if has_table_privilege('anon', 'public.deletion_log', 'select,insert,update,delete,truncate')
     or has_table_privilege('authenticated', 'public.deletion_log', 'select,insert,update,delete,truncate') then
    raise exception 'deletion_log is reachable from the API — rolled back';
  end if;
  if not has_table_privilege('service_role', 'public.deletion_log', 'select')
     or has_table_privilege('service_role', 'public.deletion_log', 'insert,update,delete,truncate') then
    raise exception 'deletion_log: service_role must read it and nothing else — rolled back';
  end if;

  -- the old one-argument deletion is gone, so nothing can delete a child without a record
  if to_regprocedure('public.delete_child_data(uuid)') is not null then
    raise exception 'delete_child_data(uuid) still exists — rolled back';
  end if;

  -- every redefined function: still DEFINER, search_path exactly as before, and it writes the log
  for f in select * from (values
      ('public.delete_child_data(uuid, text)',     'search_path=public, pg_temp', 'deletion_log'),
      ('public.delete_learner(uuid)',              'search_path=public, pg_temp', 'delete_child_data(p_learner_id, ''delete_child'')'),
      ('public.consent_withdraw_account(uuid)',    'search_path=public, pg_temp', 'delete_child_data(k, ''withdraw_consent_account'')'),
      ('public.consent_withdraw(text)',            'search_path=public, pg_temp', 'delete_child_data(r.learner_id, ''withdraw_consent_child'')'),
      ('public.delete_my_account(text)',           'search_path=public',          'deletion_log'),
      ('public.prune_unconfirmed_users()',         'search_path=public',          'deletion_log'),
      ('public.prune_error_events()',              'search_path=public',          'deletion_log'),
      ('public.prune_diagnostic_items()',          'search_path=public',          'deletion_log')) v(sig, cfg, body)
  loop
    if not exists (select 1 from pg_proc where oid = f.sig::regprocedure
                    and prosecdef and proconfig = array[f.cfg] and position(f.body in prosrc) > 0) then
      raise exception '%: not DEFINER with %, or does not write the log — rolled back', f.sig, f.cfg;
    end if;
  end loop;

  -- EXECUTE exactly as before: the two app entry points callable by a signed-in adult, nothing else from the API
  if has_function_privilege('anon', 'public.delete_child_data(uuid, text)', 'execute')
     or has_function_privilege('authenticated', 'public.delete_child_data(uuid, text)', 'execute')
     or has_function_privilege('service_role', 'public.delete_child_data(uuid, text)', 'execute') then
    raise exception 'delete_child_data(uuid, text) is callable from outside — rolled back';
  end if;
  if not has_function_privilege('authenticated', 'public.delete_learner(uuid)', 'execute')
     or not has_function_privilege('authenticated', 'public.delete_my_account(text)', 'execute')
     or has_function_privilege('anon', 'public.delete_learner(uuid)', 'execute')
     or has_function_privilege('anon', 'public.delete_my_account(text)', 'execute') then
    raise exception 'delete_learner / delete_my_account EXECUTE changed — rolled back';
  end if;
  if has_function_privilege('authenticated', 'public.prune_unconfirmed_users()', 'execute')
     or has_function_privilege('authenticated', 'public.prune_error_events()', 'execute')
     or has_function_privilege('authenticated', 'public.prune_diagnostic_items()', 'execute') then
    raise exception 'a retention function is callable from the API — rolled back';
  end if;
  -- BUG-09 (20260926100100) must survive this redefinition: the prune never deletes a granted/withdrawn consent.
  if pg_get_functiondef('public.prune_unconfirmed_users()'::regprocedure)
     !~ 'parental_consents c where c\.parent_id = u\.id and c\.state in \(''granted'', ''withdrawn''\)' then
    raise exception 'prune_unconfirmed_users lost the BUG-09 granted-consent guard — rolled back';
  end if;
end $$;
