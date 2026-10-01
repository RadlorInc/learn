-- A paid seat reaches a child (found on staging, 2026-10-01: a test purchase made an `active` subscription with two
-- seats and NOBODY in them — the app has no screen that seats a child, so the paying family's child stayed on the free
-- trial). From now on an empty seat is filled automatically with the family's oldest child that has no seat:
--   · when seats are created (materialize_seats, called by the Stripe webhook), and
--   · when a child is added to a family that has an empty seat.
-- reassign_learner_seat (one move per billing period) is unchanged; filling an EMPTY seat is not a reassignment and
-- does not touch last_reassigned_at.
--
-- SECURITY CHANGE: three new SECURITY DEFINER functions, `search_path = public`. fill_empty_seats is EXECUTE to
-- service_role only (no client can call it); the two trigger functions are not callable as functions at all. They write
-- only subscription_seats.learner_id/assigned_at of the account's own subscription, with that account's own children.
--
-- Rollback: drop trigger fill_seats_on_seat_insert on public.subscription_seats; drop trigger fill_seats_on_learner_insert
-- on public.learners; drop function public.fill_seats_after_seat_insert(); drop function
-- public.fill_seats_after_learner_insert(); drop function public.fill_empty_seats(uuid).

create or replace function public.fill_empty_seats(p_account uuid)
 returns int
 language plpgsql
 volatile security definer
 set search_path = public
as $$
declare
  v_seat    uuid;
  v_learner uuid;
  v_n       int := 0;
begin
  for v_seat in
    select st.id from public.subscription_seats st join public.subscriptions s on s.id = st.subscription_id
     where s.account_id = p_account and st.learner_id is null
     order by st.seat_index
  loop
    select l.id into v_learner from public.learners l
     where l.created_by = p_account
       and not exists (select 1 from public.subscription_seats x where x.learner_id = l.id)
     order by l.created_at, l.id
     limit 1;
    exit when v_learner is null;
    update public.subscription_seats set learner_id = v_learner, assigned_at = now() where id = v_seat;
    v_n := v_n + 1;
  end loop;
  return v_n;
end
$$;

create or replace function public.fill_seats_after_seat_insert()
 returns trigger
 language plpgsql
 security definer
 set search_path = public
as $$
begin
  perform public.fill_empty_seats(a.account_id)
     from (select distinct s.account_id from added x join public.subscriptions s on s.id = x.subscription_id) a;
  return null;
end
$$;

create or replace function public.fill_seats_after_learner_insert()
 returns trigger
 language plpgsql
 security definer
 set search_path = public
as $$
begin
  perform public.fill_empty_seats(new.created_by);
  return null;
end
$$;

drop trigger if exists fill_seats_on_seat_insert on public.subscription_seats;
create trigger fill_seats_on_seat_insert after insert on public.subscription_seats
  referencing new table as added for each statement execute function public.fill_seats_after_seat_insert();
drop trigger if exists fill_seats_on_learner_insert on public.learners;
create trigger fill_seats_on_learner_insert after insert on public.learners
  for each row execute function public.fill_seats_after_learner_insert();

revoke all on function public.fill_empty_seats(uuid) from public, anon, authenticated;
revoke all on function public.fill_seats_after_seat_insert() from public, anon, authenticated;
revoke all on function public.fill_seats_after_learner_insert() from public, anon, authenticated;
grant execute on function public.fill_empty_seats(uuid) to service_role;

-- Families that paid before this file: seat their children now.
select public.fill_empty_seats(s.account_id) from public.subscriptions s;

-- Closing assertions: the file rolls itself back rather than half-apply.
do $$
declare f oid;
begin
  foreach f in array array['public.fill_empty_seats(uuid)'::regprocedure, 'public.fill_seats_after_seat_insert()'::regprocedure,
                           'public.fill_seats_after_learner_insert()'::regprocedure] loop
    if not (select prosecdef and proconfig @> array['search_path=public'] from pg_proc where oid = f) then
      raise exception '%: not SECURITY DEFINER with search_path=public — rolled back', f::regprocedure;
    end if;
    if has_function_privilege('anon', f, 'execute') or has_function_privilege('authenticated', f, 'execute') then
      raise exception '% is callable by a client — rolled back', f::regprocedure;
    end if;
  end loop;
end $$;
