-- ═══════════════════════════════════════════════════════════════════════════════════════════════
-- WITHDRAWING FOR ONE CHILD (OF SEVERAL) REMOVES THAT CHILD'S SEAT FROM THE PLAN AND REFUNDS ITS UNUSED PART.
-- (Founder's decision, 6 October 2026: "ek bachche par bhi seat hatao aur refund do"; docs/legal/01 §5;
-- docs/runbooks/billing.md → "One child withdrawn".) Builds on 20261008000000 (the close / withdraw-all queue).
--
-- Withdrawing for one child IS deleting that child's profile: doc 06 names "Delete <name>'s profile" as the way
-- to do it, and both run delete_child_data — `delete_child` (the dashboard, delete_learner) and
-- `withdraw_consent_child` (a pre-24-September per-child consent link). Either ends that child's use, so both
-- get the same billing. The withdraw-all loop (`withdraw_consent_account`) and closing the account (which
-- deletes learners directly, not through delete_child_data) are #396's whole-plan path and are NOT touched here.
--
-- What delete_child_data now does, after the child row is gone and its seat has been refilled
-- (fill_seats_on_learner_delete, 20261001160000, has already given a freed seat to an unseated sibling):
--   · the family has no child left → the whole plan is queued in billing_cancellations ('consent_withdrawn'),
--     exactly as withdraw-all does: cancelled now, refunded pro rata. One row; a later withdraw-all or close
--     finds it already queued (`on conflict do nothing`).
--   · otherwise, a seat of the plan is now EMPTY → one seat removal is queued in billing_seat_removals. The
--     server (drainBillingCancellations) lowers Stripe's quantity by one with proration_behavior 'none' and
--     refunds that seat's unused part itself.
--   · otherwise (a sibling took the seat, or the child had none) → nothing: every paid seat is still in use.
-- A family with no plan in good standing (no subscriptions row, or one that no longer holds seats) → nothing.
--
-- The close is never blocked by Stripe and the queue row has no foreign key, as in 20261008000000. It holds the
-- Stripe subscription id and nothing that names a child or a family: the row's own id is the "child seat" key
-- the server uses for Stripe's idempotency and markers. It outlives the account (declared in SURVIVORS).
--
-- DEPLOY ORDER: after 20261008000000 (it writes that file's table); EITHER relative to the app. App first: the
-- drain gets PGRST202 for the seat queue and skips it; a one-child withdrawal changes no billing (as today). This
-- file first: rows queue and wait for the app; the refund is still counted from `queued_at`.
--
-- ⚠️⚠️ SECURITY CHANGES, CALLED OUT.
--   · REDEFINED SECURITY DEFINER function `delete_child_data(uuid, text)`: pg_get_functiondef of its last
--     definition (20260926100600) with the added lines marked `-- CHANGED`. DEFINER, search_path, owner
--     unchanged; its revoke (public, anon, authenticated, service_role) is repeated verbatim.
--   · Two INVOKER functions for the drain, EXECUTE for service_role only.
--   · The new table: RLS on, NO policies, every privilege revoked from public, anon, authenticated and
--     service_role; service_role then gets SELECT and UPDATE only (inserts come only from delete_child_data).
-- ═══════════════════════════════════════════════════════════════════════════════════════════════

create table if not exists public.billing_seat_removals (
  id                     uuid primary key default gen_random_uuid(),  -- the seat removal's key at Stripe
  stripe_subscription_id text not null,                                -- ⚠️ NO FOREIGN KEY
  queued_at              timestamptz not null default now(),           -- when the request was actioned
  attempted_at           timestamptz,
  -- null = not tried yet · 'done: …' · 'error: …' (retried by the next drain, flagged in the ops digest)
  result                 text
);
comment on table public.billing_seat_removals is
  'One seat to take off a Stripe subscription and refund pro rata, queued by a one-child withdrawal. Service role only. No link to an account or a child.';

alter table public.billing_seat_removals enable row level security;
revoke all on public.billing_seat_removals from public, anon, authenticated, service_role;
grant select, update on public.billing_seat_removals to service_role;

-- ── 1. delete_child_data: a one-child withdrawal queues the seat (or, for the last child, the plan) ──
CREATE OR REPLACE FUNCTION public.delete_child_data(p_learner_id uuid, p_path text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_logins uuid[];
  v_counts jsonb := '{}';   -- FND-15
  v_account uuid;           -- FND-15
  t name; c name;           -- FND-15
  n bigint;                 -- FND-15
  v_sub uuid; v_stripe text;  -- CHANGED
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

  -- CHANGED: one child withdrawn (not the whole account, not a close): the seat it freed comes off the plan, or the
  -- CHANGED: whole plan if no child is left. Runs after the delete, so the seat refill trigger has already run.
  if p_path in ('delete_child', 'withdraw_consent_child') and v_account is not null then                       -- CHANGED
    select s.id, s.stripe_subscription_id into v_sub, v_stripe from public.subscriptions s                    -- CHANGED
     where s.account_id = v_account and s.stripe_subscription_id is not null                                  -- CHANGED
       and s.status in ('active', 'trialing', 'past_due', 'unpaid') limit 1;                                  -- CHANGED
    if v_stripe is not null and not exists (select 1 from public.learners where created_by = v_account) then   -- CHANGED
      insert into public.billing_cancellations (stripe_subscription_id, queued_because)                        -- CHANGED
      values (v_stripe, 'consent_withdrawn') on conflict (stripe_subscription_id) do nothing;                  -- CHANGED
    elsif v_stripe is not null                                                                                -- CHANGED
      and exists (select 1 from public.subscription_seats where subscription_id = v_sub and learner_id is null) then  -- CHANGED
      insert into public.billing_seat_removals (stripe_subscription_id) values (v_stripe);                     -- CHANGED
    end if;                                                                                                   -- CHANGED
  end if;                                                                                                     -- CHANGED

  -- FND-15: the record, in the same transaction — if it cannot be written, nothing is deleted.
  insert into public.deletion_log (path, actor_kind, actor_id, account_id, learner_ids, row_counts)       -- FND-15
  values (p_path, case when auth.uid() is null then 'service' else 'user' end, auth.uid(),               -- FND-15
          v_account, array[p_learner_id], v_counts);                                                     -- FND-15
end
$function$;
revoke all on function public.delete_child_data(uuid, text) from public, anon, authenticated, service_role;  -- FND-15: the new signature, same revoke

-- ── 2. The drain's two calls. INVOKER: service_role's table grants are all they need. ────────────
/** What still needs doing: never tried, or the last try failed. `superseded` = the whole plan is queued for a
 *  cancel and refund (a close or withdraw-all came after), which refunds everything left; the seat is then moot. */
create or replace function public.billing_seat_removals_due()
returns table (id uuid, stripe_subscription_id text, queued_at timestamptz, superseded boolean)
language sql
stable
set search_path = public, pg_temp
as $$
  select r.id, r.stripe_subscription_id, r.queued_at,
         exists (select 1 from public.billing_cancellations c where c.stripe_subscription_id = r.stripe_subscription_id)
    from public.billing_seat_removals r
   where r.result is null or r.result like 'error:%'
   order by r.queued_at;
$$;

/** Record one outcome. Never overwrites a settled one. */
create or replace function public.billing_seat_removal_record(p_id uuid, p_result text)
returns void
language sql
set search_path = public, pg_temp
as $$
  update public.billing_seat_removals
     set attempted_at = now(), result = p_result
   where id = p_id and (result is null or result like 'error:%');
$$;

revoke all on function public.billing_seat_removals_due() from public, anon, authenticated;
grant execute on function public.billing_seat_removals_due() to service_role;
revoke all on function public.billing_seat_removal_record(uuid, text) from public, anon, authenticated;
grant execute on function public.billing_seat_removal_record(uuid, text) to service_role;
