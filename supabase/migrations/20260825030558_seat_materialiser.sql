-- ─────────────────────────────────────────────────────────────────────────────
--  BILLING — STAGE 2a: the seat materialiser. STILL NO STRIPE CALLS.
--
--  ✅ APPLIED TO PRODUCTION 2026-08-25, recorded as version **20260825030558** — which is why this
--  file carries that timestamp rather than the one it was written under (the ledger holds the true
--  apply order; the repo is relabelled to agree with it, never the other way round). The
--  relabelling is order-PRESERVING: it was last in the repo and it is last in the ledger.
--  Verified from the CATALOG, not the success flag, and against the artefact CI actually tested:
--  body md5 `5ee877cc8970db10a0d6b8daac5082f3` on both, and `service_role=true authenticated=false
--  anon=false` on both. Rollback: supabase/schema/rollback_20260825_seat_materialiser.sql, which
--  CI runs on every PR.
--
--  Stage 1 created `subscription_seats` and never created a row in it: the tests insert seats by
--  hand, so entitlement was structurally correct and practically dead. This is the function that
--  makes a paid subscription actually grant seats.
--
--  ⚠️ IT IS A RECONCILER, NOT AN INSERTER, AND THAT IS THE WHOLE DESIGN. The Stripe webhook is
--  at-least-once and out-of-order: the same `customer.subscription.updated` can arrive twice, and a
--  downgrade can be delivered before the upgrade it replaces. An "add N seats" function is wrong
--  under both. Given a TARGET count it makes the world match, so replaying it changes nothing and
--  applying events in any order converges on whatever the last one said.
--
--  ⚠️ DOWNGRADES REMOVE THE HIGHEST SEAT INDEXES, AND EMPTY ONES FIRST. A parent dropping 4 → 2
--  must not have a child's seat taken while an unoccupied seat sits beside it. Occupied seats are
--  only released once there is nothing empty left to take, and then from the top down — which is
--  stable, so the same downgrade always frees the same seat.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.materialize_seats(p_subscription_id uuid, p_seats int)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_target int;
  v_have   int;
begin
  if p_subscription_id is null then
    raise exception 'materialize_seats: subscription_id is required' using errcode = '22004';
  end if;

  -- ⚠️ CLAMPED, NOT CHECKED. Stripe is the source of the quantity and a webhook carrying 7 must not
  -- ERROR — losing the event is worse than clamping it, exactly as `subscriptions.status` carries no
  -- CHECK for the same reason. The 4-seat ceiling is ours and is enforced here and by the column's
  -- own `check (seat_index between 1 and 4)`, so a bug here still cannot write a fifth row.
  v_target := least(greatest(coalesce(p_seats, 0), 0), 4);

  select count(*) into v_have
    from public.subscription_seats where subscription_id = p_subscription_id;

  if v_target > v_have then
    -- Fill the LOWEST free indexes, so seat numbers stay dense and a re-upgrade reuses the index a
    -- downgrade freed rather than leaving a hole.
    insert into public.subscription_seats (subscription_id, seat_index)
    select p_subscription_id, i
      from generate_series(1, 4) as i
     where not exists (
       select 1 from public.subscription_seats s
        where s.subscription_id = p_subscription_id and s.seat_index = i)
     order by i
     limit v_target - v_have;

  elsif v_target < v_have then
    -- ⚠️ EMPTY SEATS FIRST, THEN OCCUPIED ONES FROM THE TOP. `learner_id is not null` sorts last, so
    -- a 4 → 2 downgrade with one child seated takes the two empty seats and leaves the child alone.
    delete from public.subscription_seats
     where id in (
       select s.id from public.subscription_seats s
        where s.subscription_id = p_subscription_id
        order by (s.learner_id is not null), s.seat_index desc
        limit v_have - v_target);
  end if;

  return v_target;
end;
$$;

-- ⚠️ EXPLICIT REVOKE — a SECURITY DEFINER function is executable by `public` unless you say
-- otherwise, and this one writes the table that decides who is entitled. V19, asserted as a
-- standing rule by `billingSchema.test.ts` for every SECURITY DEFINER function in the schema.
revoke all on function public.materialize_seats(uuid, int) from public, anon, authenticated;

-- ⚠️ THE GRANT BACK TO `service_role` IS REDUNDANT TODAY, AND IT IS STATED ANYWAY. Measured against
-- production: Supabase's default privileges for functions in `public` owned by `postgres` include an
-- explicit `service_role=X/postgres`, and a REVOKE from `public, anon, authenticated` cannot remove a
-- grant held by another role — `enforce_learner_cap`, `enforce_grade_cap`, `enforce_grade_ownership`
-- and `prune_error_events` all carry exactly this shape and all four read
-- `{postgres=X/postgres,service_role=X/postgres}`. So the webhook could call this without the line
-- below.
-- It stays because the property this function's ONE caller depends on should not live in a platform
-- default outside this file: a changed default, an owner change, or somebody adding `service_role` to
-- the REVOKE list would otherwise be discovered on the first real purchase. rls_regression M7 is the
-- positive control that pins it — M6 drives the refusal for `authenticated`, and M6 ALONE is equally
-- satisfied by a function nobody at all can call.
grant execute on function public.materialize_seats(uuid, int) to service_role;

comment on function public.materialize_seats(uuid, int) is
  'Reconcile a subscription''s seat rows to a target count. Idempotent and order-independent: the '
  'Stripe webhook is at-least-once and may deliver out of order. Service-role only.';
