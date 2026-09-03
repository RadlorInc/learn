-- ⚠️ TWO CHANGES, ONE MECHANISM: the entitlement check pays for its own PLANNING on every call.
--
-- `is_chapter_entitled` was a SQL-language function. On Postgres 17 a SQL function's body is
-- planned again on EVERY call (no plan cache; PG 18 is the first release that caches it), and it is
-- SECURITY DEFINER so it cannot be inlined into the caller either. Measured in-database on PG 17.5
-- (2000 calls, clock_timestamp, 5 reps): 190 µs/call as SQL, 34 µs/call as plpgsql, and plpgsql
-- with `discard plans` forced before every call goes back to 218 µs — i.e. the whole difference IS
-- the plan cache, nothing else. Production (Nano, shared CPU) reports 2.6 ms mean per RPC for it,
-- and the parent dashboard called it 12–24 times in parallel per tap: 124 of 275 API requests in a
-- day, p90 684 ms.
--
-- 1. Same body, plpgsql. The body is byte-for-byte the previous definition wrapped in
--    `return (…)`, so every caller — the `sessions` INSERT policy, `learner_progress` WITH CHECK,
--    `sync_session`, the gate RPC — keeps the single definition. Grants re-stated because
--    `create or replace` keeps them but the migration gate requires them to be explicit.
-- 2. `entitled_chapters(learner, chapters[])`: the parent dashboard's dozen questions as ONE round
--    trip. It CALLS `is_chapter_entitled` per chapter rather than restating the rule — a copy of
--    the rule here would be the fourth definition docs/billing-stage-3.md §1 forbids.

create or replace function public.is_chapter_entitled(p_learner_id uuid, p_chapter text)
 returns boolean
 language plpgsql
 stable security definer
 set search_path = public
as $$
begin
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

create or replace function public.entitled_chapters(p_learner_id uuid, p_chapters text[])
 returns jsonb
 language plpgsql
 stable security definer
 set search_path = public
as $$
begin
  -- V5-style bound: a caller may ask about a band's worth of chapters, not a table's worth.
  if coalesce(array_length(p_chapters, 1), 0) > 100 then
    raise exception 'entitled_chapters: at most 100 chapters per call' using errcode = '22023';
  end if;
  return coalesce(
    (select jsonb_object_agg(c, public.is_chapter_entitled(p_learner_id, c)) from unnest(p_chapters) as c),
    '{}'::jsonb
  );
end
$$;

revoke all on function public.entitled_chapters(uuid, text[]) from public, anon;
grant execute on function public.entitled_chapters(uuid, text[]) to authenticated, service_role;
