-- The free trial, second shape (founder, 2026-10-01, after trying the first on staging): the PARENT picks the two free
-- topics on their dashboard — two topics of ONE Grade 3–8 module, or any two KG–2 story chapters — and the choice is
-- final. The child sees only those two, with no lock, no trial and no price anywhere on the child's side. More topics
-- = purchase, offered to the parent only.
--
-- 1. public.choose_free_topics(topics): the parent's one-time choice, written to free_topics (20261001120000).
--    Refused (P0F01) when the family already chose, when it is not one or two known ids, when lessons come from two
--    modules, or when lessons and chapters are mixed. Refused (42501) for a child's own login.
-- 2. public.claim_topic: NO LONGER CLAIMS. Opening a topic never uses up a slot; it answers TRUE only for a paid seat,
--    the paywall off, or one of the family's chosen topics. A module's mixed practice stays paid only.
-- 3. public.trial_topics(learner): what the child's home shows — NULL when there is no restriction (paywall off, or a
--    paid seat), otherwise the family's chosen topics (an empty array until the parent chooses).
--
-- SECURITY CHANGE: two new SECURITY DEFINER functions (choose_free_topics, trial_topics) and one redefined
-- (claim_topic), all `search_path = public`, EXECUTE to authenticated and service_role only. claim_topic and
-- trial_topics refuse (42501) a caller with no learner_access row for the learner (SEC-16); choose_free_topics acts
-- only on the caller's own account and refuses a child's 'self' login. Checked at the end of this file.
--
-- Rollback: drop function public.choose_free_topics(text[]); drop function public.trial_topics(uuid); re-run
-- claim_topic from 20261001120000_family_free_topics.sql.

create or replace function public.choose_free_topics(p_topics text[])
 returns text[]
 language plpgsql
 volatile security definer
 set search_path = public
as $$
declare
  v_account uuid := auth.uid();
  v_kinds   text[];
  v_modules text[];
begin
  if v_account is null then raise exception 'sign in first' using errcode = '42501'; end if;
  -- A child's own login never chooses for the family.
  if exists (select 1 from public.learner_access la where la.parent_id = v_account and la.access_role = 'self') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtext('free_topics:' || v_account::text));
  if exists (select 1 from public.free_topics f where f.account_id = v_account) then
    raise exception 'the free topics are already chosen' using errcode = 'P0F01';
  end if;
  if p_topics is null or cardinality(p_topics) not between 1 and 2
     or cardinality(p_topics) <> (select count(distinct t) from unnest(p_topics) t) then
    raise exception 'choose one or two different topics' using errcode = 'P0F01';
  end if;
  select array_agg(distinct c.kind) into v_kinds from public.lesson_catalog c where c.id = any (p_topics);
  if (select count(*) from public.lesson_catalog c where c.id = any (p_topics) and c.kind in ('lesson', 'chapter'))
     <> cardinality(p_topics) then
    raise exception 'unknown topic' using errcode = 'P0F01';
  end if;
  if cardinality(v_kinds) <> 1 then
    raise exception 'two lessons of one module, or two story chapters — not a mix' using errcode = 'P0F01';
  end if;
  if v_kinds[1] = 'lesson' then
    -- A lesson id is <module>-t<n> (g3m1-t2): both must share the module.
    select array_agg(distinct split_part(t, '-t', 1)) into v_modules from unnest(p_topics) t;
    if cardinality(v_modules) <> 1 then
      raise exception 'both topics must come from the same module' using errcode = 'P0F01';
    end if;
  end if;
  insert into public.free_topics (account_id, topic) select v_account, t from unnest(p_topics) t;
  return p_topics;
end
$$;

create or replace function public.claim_topic(p_learner_id uuid, p_topic text)
 returns boolean
 language plpgsql
 stable security definer
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

  -- A paid seat: the same test as is_chapter_entitled's.
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

  -- A module's mixed practice draws on every topic of the module: paid only.
  if v_kind = 'module' then return false; end if;
  -- One of the two the parent chose. Opening a topic never chooses one (20261001140000).
  return exists (select 1 from public.free_topics f where f.account_id = v_account and f.topic = p_topic);
end
$$;

create or replace function public.trial_topics(p_learner_id uuid)
 returns text[]
 language plpgsql
 stable security definer
 set search_path = public
as $$
declare
  v_account uuid;
begin
  if auth.uid() is not null and not exists (
    select 1 from public.learner_access la where la.learner_id = p_learner_id and la.parent_id = auth.uid()
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not coalesce((select bc.enforced from public.billing_config bc), false) then return null; end if;
  select l.created_by into v_account from public.learners l where l.id = p_learner_id;
  if exists (
    select 1
    from public.subscription_seats st
    join public.subscriptions      s on s.id = st.subscription_id
    where st.learner_id = p_learner_id
      and s.account_id = v_account
      and (s.status = 'active'
           or (s.status in ('past_due', 'unpaid') and s.grace_until is not null and now() <= s.grace_until))
  ) then
    return null;
  end if;
  return coalesce((select array_agg(f.topic order by f.topic) from public.free_topics f where f.account_id = v_account), '{}');
end
$$;

revoke all on function public.choose_free_topics(text[]) from public, anon;
revoke all on function public.claim_topic(uuid, text) from public, anon;
revoke all on function public.trial_topics(uuid) from public, anon;
grant execute on function public.choose_free_topics(text[]) to authenticated, service_role;
grant execute on function public.claim_topic(uuid, text) to authenticated, service_role;
grant execute on function public.trial_topics(uuid) to authenticated, service_role;

-- Closing assertions: the file rolls itself back rather than half-apply.
do $$
declare f oid;
begin
  foreach f in array array['public.choose_free_topics(text[])'::regprocedure, 'public.claim_topic(uuid, text)'::regprocedure,
                           'public.trial_topics(uuid)'::regprocedure] loop
    if not (select prosecdef and proconfig @> array['search_path=public'] from pg_proc where oid = f) then
      raise exception '%: not SECURITY DEFINER with search_path=public — rolled back', f::regprocedure;
    end if;
    if has_function_privilege('anon', f, 'execute') then
      raise exception '% is callable by anon — rolled back', f::regprocedure;
    end if;
    if not (has_function_privilege('authenticated', f, 'execute') and has_function_privilege('service_role', f, 'execute')) then
      raise exception '% lost EXECUTE for authenticated or service_role — rolled back', f::regprocedure;
    end if;
  end loop;
  foreach f in array array['public.claim_topic(uuid, text)'::regprocedure, 'public.trial_topics(uuid)'::regprocedure] loop
    if (select prosrc from pg_proc where oid = f) !~ 'la\.parent_id = auth\.uid\(\)' then
      raise exception '%: the learner_access guard is missing — rolled back', f::regprocedure;
    end if;
  end loop;
end $$;
