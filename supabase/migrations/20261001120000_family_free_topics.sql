-- The free trial: a family gets ANY TWO topics free — a Grade 3–8 lesson or a KG–2 story chapter, from any module —
-- then pays to go on. Founder, 2026-10-01: "two topics to experience properly, then pay and continue with
-- everything"; per family (one account, however many children), and the KG–2 chapters count in the same two.
--
-- 1. public.free_topics: the topics a family has claimed, at most two per account. RLS on; the account owner READS its
--    own rows (the parent dashboard shows "1 of 2 used"); no client writes — only claim_topic below. It holds the
--    account and a catalogue id, NOTHING about a child (deliberately no learner column), so it is account data: it
--    goes with the account (cascade), and is not a child table for the export or the consent gate.
-- 2. public.claim_topic(learner, topic): asked by the app ONCE, when a child opens a topic (or a module's mixed
--    practice, which is paid only: TRUE with a seat, FALSE without, never a free slot). TRUE = play it. It records
--    the topic as one of the family's two when the family has a free slot left; a topic already claimed is free
--    forever (re-opening it costs nothing). FALSE = the child sees "ask a grown-up", the parent sees Pay.
--    Paywall off (billing_config.enforced = false) → TRUE and NOTHING is recorded, so the trial starts on the day the
--    paywall goes on, not before.
-- 3. public.is_chapter_entitled: the fixed free set (chapters.is_free) and the diagnostic plan's free steps are no
--    longer sources — the family's two claimed topics replace both. The switch, the SEC-16 guard and the paid-seat
--    source are unchanged. Chapter ids are claimed under their catalogue id, `c:<chapter>`.
--
-- SECURITY CHANGE: one new SECURITY DEFINER function (claim_topic) and one redefined (is_chapter_entitled), both
-- `search_path = public`, EXECUTE to authenticated and service_role only; both refuse (42501) a signed-in caller with no
-- learner_access row for the learner — the SEC-16 rule. A new table, RLS on, owner-read only, client writes revoked.
--
-- Rollback: drop function public.claim_topic(uuid, text); drop table public.free_topics; re-run is_chapter_entitled
-- from 20260926100700_entitlement_access_guard.sql.

create table public.free_topics (
  account_id uuid not null references auth.users(id) on delete cascade,
  topic      text not null references public.lesson_catalog(id),
  claimed_at timestamptz not null default now(),
  primary key (account_id, topic)
);
alter table public.free_topics enable row level security;
revoke all on public.free_topics from public, anon, authenticated;
grant select on public.free_topics to authenticated;
create policy "free_topics: owner reads" on public.free_topics
  for select to authenticated using (account_id = (select auth.uid()));

comment on table public.free_topics is
  'The free trial: the (at most two) topics a family has opened before paying. Written only by claim_topic.';

create or replace function public.claim_topic(p_learner_id uuid, p_topic text)
 returns boolean
 language plpgsql
 volatile security definer
 set search_path = public
as $$
declare
  v_account uuid;
  v_kind    text;
begin
  -- SEC-16: a signed-in caller may ask only about a learner it has access to.
  if auth.uid() is not null and not exists (
    select 1 from public.learner_access la where la.learner_id = p_learner_id and la.parent_id = auth.uid()
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not coalesce((select bc.enforced from public.billing_config bc), false) then return true; end if;
  select c.kind into v_kind from public.lesson_catalog c where c.id = p_topic;
  if v_kind is null then
    raise exception 'unknown topic %', p_topic using errcode = 'P0L01';
  end if;
  select l.created_by into v_account from public.learners l where l.id = p_learner_id;
  if v_account is null then return false; end if;

  -- A paid seat: the same test as is_chapter_entitled's, so a paying child never uses up a free slot.
  if exists (
    select 1
    from public.subscription_seats st
    join public.subscriptions      s on s.id = st.subscription_id
    where st.learner_id = p_learner_id
      and s.account_id = v_account
      and (s.status = 'active'
           or (s.status in ('past_due', 'unpaid') and s.grace_until is not null and now() <= s.grace_until))
  ) then
    return true;
  end if;

  -- A module's mixed practice draws on every topic of the module, so it is never one of the free two: paid only.
  if v_kind = 'module' then return false; end if;

  -- Two children opening topics at the same moment must not both take "the last" slot.
  perform pg_advisory_xact_lock(hashtext('free_topics:' || v_account::text));
  if exists (select 1 from public.free_topics f where f.account_id = v_account and f.topic = p_topic) then
    return true;
  end if;
  if (select count(*) from public.free_topics f where f.account_id = v_account) >= 2 then   -- ⚠️ THE TWO
    return false;
  end if;
  insert into public.free_topics (account_id, topic) values (v_account, p_topic);
  return true;
end
$$;

revoke all on function public.claim_topic(uuid, text) from public, anon;
grant execute on function public.claim_topic(uuid, text) to authenticated, service_role;

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
      -- one of the family's two free topics (20261001120000; replaced chapters.is_free and the plan's free steps)
      or exists (
        select 1 from public.free_topics f join public.learners l on l.created_by = f.account_id
        where l.id = p_learner_id and f.topic = 'c:' || p_chapter
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
declare f oid;
begin
  foreach f in array array['public.is_chapter_entitled(uuid, text)'::regprocedure, 'public.claim_topic(uuid, text)'::regprocedure] loop
    if not (select prosecdef and proconfig @> array['search_path=public'] from pg_proc where oid = f) then
      raise exception '%: not SECURITY DEFINER with search_path=public — rolled back', f::regprocedure;
    end if;
    if (select prosrc from pg_proc where oid = f) !~ 'la\.parent_id = auth\.uid\(\)' then
      raise exception '%: the learner_access guard is missing — rolled back', f::regprocedure;
    end if;
    if has_function_privilege('anon', f, 'execute') then
      raise exception '% is callable by anon — rolled back', f::regprocedure;
    end if;
    if not (has_function_privilege('authenticated', f, 'execute') and has_function_privilege('service_role', f, 'execute')) then
      raise exception '% lost EXECUTE for authenticated or service_role — rolled back', f::regprocedure;
    end if;
  end loop;
  if has_table_privilege('authenticated', 'public.free_topics', 'insert')
     or has_table_privilege('authenticated', 'public.free_topics', 'update')
     or has_table_privilege('authenticated', 'public.free_topics', 'delete') then
    raise exception 'free_topics is writable by clients — rolled back';
  end if;
end $$;
