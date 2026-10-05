-- CLOSE ONE ACCOUNT FOR A PARENT WHO CANNOT USE THE APP (founder, Supabase SQL editor). WRITES. IRREVERSIBLE.
-- The steps around it are in docs/runbooks/data-requests.md → "Close an account from SQL". Do not run it on its own.
--
-- What it does, in ONE statement (a DO block: all of it commits, or none of it):
--   guards   — the id and the email must name the same account; refuses a child's own sign-in, an admin account, and a
--              subscription that is not canceled unless you say Stripe has been dealt with;
--   census   — counts, before anything goes, the account's rows in every table that cascades from it (read off the
--              catalog, so a table added later is counted too);
--   children — each child through public.delete_child_data(id, 'close_account'), the function the app's own deletions
--              use: the child's rows, the child's own sign-in, and one deletion_log row per child;
--   account  — delete from auth.users. That cascades the profile, the PIN, sign-in events, classes (with their
--              chapters and class results), teacher plan, free-topic picks, subscription (with its seats) and any
--              viewer/invite rows this adult had on other families' children. The consent trigger settles the
--              consents first: granted → withdrawn (and its second email is queued for cancelling); pending/expired →
--              deleted. Kept consents and payment rows lose their link to the account (ON DELETE SET NULL);
--   audit    — one deletion_log row for the account: path close_account, actor_kind 'service' (an operator acted, not
--              the parent), the children's ids and the census. Ids and counts only.
--
-- Why not the dashboard's "Delete user": learners.created_by → profiles is ON DELETE RESTRICT, so deleting the user of an
-- account that still has children fails and deletes nothing (rehearsed). And it would write no audit row.
--
-- Rehearsed on a throwaway local stack built from supabase/migrations on 2026-10-05 (a fake account with two children,
-- a child login, PIN, class, plan, subscription and payment row, beside a control family that had viewer access to one
-- of the children): each guard stopped it; the real run removed every row of the account and its children, wrote three
-- deletion_log rows (two children + the account), kept the consent as withdrawn and unlinked, kept the payment row
-- unlinked, queued the second-email cancel, and left the control family and its child untouched. NOT rehearsed on
-- production: the SQL editor there runs as `postgres`, which deleted from auth.users there on 2026-10-01
-- (launch-wipe-all-accounts.sql).
--
-- Fill the two placeholders (and the flag, if step 2 of the runbook applied). A placeholder left in fails the uuid cast.
do $$
declare
  v_account uuid := '<account id>';            -- from support-lookup.sql query 1 (account_id_for_the_next_steps)
  v_email   text := '<account email>';         -- the verified address the request came from
  v_stripe_cancelled boolean := false;         -- set true ONLY after cancelling in Stripe (runbook step 2)
  v_learners uuid[];
  v_counts jsonb;
  k uuid; t name; c name; n bigint;
begin
  -- ── guards: each one stops before anything is deleted ──────────────────────────────────────────
  if not exists (select 1 from auth.users where id = v_account and lower(email) = lower(btrim(v_email))) then
    raise exception 'STOP: no account has both this id and this email';
  end if;
  if exists (select 1 from public.learner_access where parent_id = v_account and access_role = 'self') then
    raise exception 'STOP: this is a child''s own sign-in, not an adult account';
  end if;
  if exists (select 1 from public.admin_users where user_id = v_account) then
    raise exception 'STOP: this account is an admin; remove its admin_users row deliberately first';
  end if;
  if exists (select 1 from public.subscriptions where account_id = v_account and status <> 'canceled')
     and not v_stripe_cancelled then
    raise exception 'STOP: the account has a subscription that is not canceled; cancel it in Stripe, then set v_stripe_cancelled';
  end if;

  -- ── the census, before anything goes: every table that cascades from the account ───────────────
  select coalesce(array_agg(id), '{}') into v_learners from public.learners where created_by = v_account;
  v_counts := jsonb_build_object('learners', cardinality(v_learners),
    'consents_kept', (select count(*) from public.parental_consents where parent_id = v_account and state in ('granted', 'withdrawn', 'declined')),
    'billing_events_unlinked', (select count(*) from public.billing_events where account_id = v_account));
  for t, c in
    select cl.relname, a.attname
      from pg_constraint k2
      join pg_class cl on cl.oid = k2.conrelid and cl.relnamespace = 'public'::regnamespace
      join pg_attribute a on a.attrelid = k2.conrelid and a.attnum = k2.conkey[1]
     where k2.contype = 'f' and k2.confdeltype = 'c' and array_length(k2.conkey, 1) = 1
       and k2.confrelid in ('auth.users'::regclass, 'public.profiles'::regclass)
  loop
    execute format('select count(*) from public.%I where %I = $1', t, c) into n using v_account;
    v_counts := v_counts || jsonb_build_object(t, n);
  end loop;

  -- ── 1. each child, through the same function the app uses (one deletion_log row per child) ─────
  foreach k in array v_learners loop
    perform public.delete_child_data(k, 'close_account');
  end loop;

  -- ── 2. the account ──────────────────────────────────────────────────────────────────────────────
  delete from auth.users where id = v_account;

  -- ── 3. the account's own audit row ─────────────────────────────────────────────────────────────
  insert into public.deletion_log (path, actor_kind, actor_id, account_id, learner_ids, row_counts)
  values ('close_account', 'service', null, v_account, v_learners, v_counts);

  raise notice 'CLOSED: % children, census %', cardinality(v_learners), v_counts;
end $$;
