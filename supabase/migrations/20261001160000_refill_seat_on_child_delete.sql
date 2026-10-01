-- A seat freed by deleting a child goes to the family's next unseated child (found on staging, 2026-10-01: a family
-- deleted a seated child while another child had no seat; the freed seat stayed empty and that child stayed on the free
-- trial). `subscription_seats.learner_id` is `on delete set null`; this runs after it and fills the seat again with
-- fill_empty_seats (20261001150000).
--
-- ⚠️ ORDER: the foreign key's own ON DELETE action is a system trigger named "RI_ConstraintTrigger_…", and AFTER
-- triggers on one table fire in name order; "R" sorts before "f", so the seat is already empty when this runs.
-- familyFreeTopics.test.ts drives a real delete to prove it rather than trusting the ordering note.
--
-- SECURITY CHANGE: one new SECURITY DEFINER trigger function (search_path = public), revoked from every client role.
--
-- Rollback: drop trigger fill_seats_on_learner_delete on public.learners; drop function public.fill_seats_after_learner_delete().

create or replace function public.fill_seats_after_learner_delete()
 returns trigger
 language plpgsql
 security definer
 set search_path = public
as $$
begin
  perform public.fill_empty_seats(old.created_by);
  return null;
end
$$;

drop trigger if exists fill_seats_on_learner_delete on public.learners;
create trigger fill_seats_on_learner_delete after delete on public.learners
  for each row execute function public.fill_seats_after_learner_delete();

revoke all on function public.fill_seats_after_learner_delete() from public, anon, authenticated;

-- Seats already left empty this way: fill them now.
select public.fill_empty_seats(s.account_id) from public.subscriptions s;

do $$
declare f oid := 'public.fill_seats_after_learner_delete()'::regprocedure;
begin
  if not (select prosecdef and proconfig @> array['search_path=public'] from pg_proc where oid = f) then
    raise exception 'fill_seats_after_learner_delete: not SECURITY DEFINER with search_path=public — rolled back';
  end if;
  if has_function_privilege('anon', f, 'execute') or has_function_privilege('authenticated', f, 'execute') then
    raise exception 'fill_seats_after_learner_delete is callable by a client — rolled back';
  end if;
end $$;
