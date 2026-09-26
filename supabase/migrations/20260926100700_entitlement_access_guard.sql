-- SEC-16 (docs/review/SECURITY-AUDIT.md): `is_chapter_entitled` — and `entitled_chapters`, which asks it once per
-- chapter — answered for ANY learner id. A signed-in stranger got a real true/false about somebody else's child
-- (probe P4). It is now refused with 42501, exactly as `game_wallet` refuses the same caller.
--
-- ⚠️ SECURITY-RELEVANT, STATED PLAINLY: this redefines a SECURITY DEFINER function. What does NOT change:
-- still SECURITY DEFINER, still `SET search_path = public`, owner unchanged, EXECUTE still to authenticated and
-- service_role only (re-stated below). What changes: ONE `if … raise` block at the top of the body. The rest of
-- the body is copied verbatim from 20260903100000_entitlement_plan_cache.sql (its latest definition).
--
-- WHO MAY ASK, AND WHY EACH LEGITIMATE CALLER STILL GETS ITS ANSWER:
--   · a signed-in caller with a `learner_access` row for that learner — the owner, a viewer, or the child's own
--     'self' login (its row has parent_id = the child's auth id). Same test as game_wallet / lesson RPCs.
--   · the `sessions` INSERT policy and the `learner_progress` WITH CHECK: both already require that same
--     learner_access row for auth.uid(), so a caller who passes the policy passes the guard.
--   · `sync_session` (both overloads): checks learner_access for auth.uid() itself before it gets here.
--   · a caller with NO uid — service_role, or the database's own roles — is not a client, holds no one's
--     identity to leak, and is let through (the paired GRANT half: service_role keeps its answer).
--   · `entitled_chapters` needs no change: it raises through this function. An empty chapter list returns '{}'
--     without asking, which says nothing about the learner.
-- A refused caller gets an ERROR, not `false`; the client (`data/repositories/billing.ts`) already maps any RPC
-- error to `null` = "could not find out", and only ever asks about the signed-in adult's own learners.

create or replace function public.is_chapter_entitled(p_learner_id uuid, p_chapter text)
 returns boolean
 language plpgsql
 stable security definer
 set search_path = public
as $$
begin
  -- SEC-16: a signed-in caller may ask only about a learner it has access to.
  if auth.uid() is not null and not exists (
    select 1 from public.learner_access la where la.learner_id = p_learner_id and la.parent_id = auth.uid()
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return (
    select
      not coalesce((select bc.enforced from public.billing_config bc), false)
      or coalesce((select c.is_free from public.chapters c where c.id = p_chapter), false)
      or exists (
        select 1 from public.diagnostic_plans dp
        where dp.learner_id = p_learner_id
          and dp.active
          and (p_chapter = any (dp.free_chapters) or p_chapter = dp.revised_chapter)
      )
      or exists (
        select 1
        from public.subscription_seats st
        join public.subscriptions      s on s.id = st.subscription_id
        join public.learners           l on l.id = st.learner_id
        where st.learner_id = p_learner_id
          and l.created_by = s.account_id
          and (
            s.status = 'active'
            or (s.status in ('past_due', 'unpaid')
                and s.grace_until is not null and now() <= s.grace_until)
          )
      )
  );
end
$$;

revoke all on function public.is_chapter_entitled(uuid, text) from public, anon;
grant execute on function public.is_chapter_entitled(uuid, text) to authenticated, service_role;

-- Closing assertions: the file rolls itself back rather than half-apply.
do $$
declare f oid := 'public.is_chapter_entitled(uuid, text)'::regprocedure;
begin
  if not (select prosecdef and proconfig @> array['search_path=public'] from pg_proc where oid = f) then
    raise exception 'is_chapter_entitled: not SECURITY DEFINER with search_path=public — rolled back';
  end if;
  if (select prosrc from pg_proc where oid = f) !~ 'la\.parent_id = auth\.uid\(\)' then
    raise exception 'is_chapter_entitled: the learner_access guard is missing — rolled back';
  end if;
  if has_function_privilege('anon', f, 'execute') then
    raise exception 'is_chapter_entitled is callable by anon — rolled back';
  end if;
  if not (has_function_privilege('authenticated', f, 'execute') and has_function_privilege('service_role', f, 'execute')) then
    raise exception 'is_chapter_entitled lost EXECUTE for authenticated or service_role — rolled back';
  end if;
end $$;
