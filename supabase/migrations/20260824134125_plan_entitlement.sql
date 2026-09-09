-- ─────────────────────────────────────────────────────────────────────────────
--  PLAN-DERIVED ENTITLEMENT (free-tier source C) + the `active` leak that was already there.
--
--  ✅ APPLIED TO PRODUCTION 2026-08-24, recorded as version **20260824134125**. Verified by
--  fingerprint against what `ci / rls-tests` published, not by the success flag. The `active`
--  backfill touched 0 rows, as predicted: 14 plans, no learner had two. 9 of the 14 gained
--  free_chapters. Rollback: supabase/schema/rollback_20260824_billing.sql.
--
--  Three sources of entitlement, in order: A demo (pre-signup, local only, no server row at all),
--  B `chapters.is_free`, C the plan. This adds C.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. ⚠️ THE LEAK THAT WAS ALREADY IN THE SCHEMA ────────────────────────────
-- `diagnostic_plans.active` has existed since 20260702090611 with `default true`, and **nothing has
-- ever set it false**. Every plan a learner has ever had is active. That was harmless while the
-- column was unread; the moment C exists it means every plan's free chapters keep entitling for
-- ever, and re-taking the check ADDS two more rather than replacing them.
--
-- Backfill first, index second: the index cannot be created while the duplicates exist.
update public.diagnostic_plans p
   set active = false
 where p.active
   and exists (
     select 1 from public.diagnostic_plans q
     where q.learner_id = p.learner_id
       and (q.created_at, q.id) > (p.created_at, p.id)
   );

-- ⚠️ STRUCTURAL, NOT MERELY ENFORCED IN THE FUNCTION. A rule that lives only inside an RPC is a
-- rule the next writer of that RPC can drop; a partial unique index makes a second active plan
-- unrepresentable. rls_regression C5 asserts it from the outside.
create unique index if not exists diagnostic_plans_one_active_per_learner
  on public.diagnostic_plans (learner_id) where active;

-- ── 2. The recorded free set ─────────────────────────────────────────────────
-- ⚠️ RECORDED AT PLAN-ISSUE TIME, NEVER RECOMPUTED. If entitlement were "the first two steps not yet
-- done", finishing step 1 would promote step 3 and the whole plan would walk free, one chapter at a
-- time, for nothing. The two ids are resolved ONCE — against what the learner had already completed
-- at that moment — and then they are just two ids.
alter table public.diagnostic_plans
  add column if not exists free_chapters text[] not null default '{}';

comment on column public.diagnostic_plans.free_chapters is
  'The plan steps entitled without a subscription: the first two the learner had NOT already '
  'completed when the plan was issued. Frozen at issue time — completing one never promotes the next.';

-- ⚠️ ONE EXTRA, ONCE, FOR A CHILD WHO IS STRUGGLING. `revisePlanDeeper` prepends a deeper chapter
-- when a child struggles in the plan's root chapter — the product's own correction. Against a frozen
-- pair that new first step would be PAYWALLED, i.e. a wall in front of the correction, hitting
-- exactly the child this product exists for. So the set may be extended by one and only one: the
-- column is null until used, and `entitle_revised_step` will only fill a null.
alter table public.diagnostic_plans
  add column if not exists revised_chapter text;

comment on column public.diagnostic_plans.revised_chapter is
  'The deeper chapter a play-data revision prepended, entitled alongside free_chapters. At most one '
  'per plan — three free chapters maximum on that path, and only for a child who struggled.';

-- Backfill the active plans that already exist. These children took the check and were promised a
-- route; issuing C without them would paywall step one of a plan we already gave them.
update public.diagnostic_plans p
   set free_chapters = coalesce((
         select array_agg(c order by ord)
         from (
           select c, ord
           from unnest(p.chapter_sequence) with ordinality as t(c, ord)
           where not exists (
             select 1 from public.learner_progress lp
             where lp.learner_id = p.learner_id and lp.chapter = t.c
           )
           order by ord
           limit 2
         ) s
       ), '{}')
 where p.active and p.free_chapters = '{}';

-- ── 3. Entitlement — source C ────────────────────────────────────────────────
-- ⚠️ THE SAME ONE FUNCTION. It is called from the `sessions` INSERT policy, the `learner_progress`
-- WITH CHECK and inside `sync_session`; adding a source here reaches all three at once, which is the
-- whole reason there is only one of it.
create or replace function public.is_chapter_entitled(p_learner_id uuid, p_chapter text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    -- ⚠️ THE SWITCH STAYS FIRST. This `create or replace` is the definition that WINS, so dropping
    -- the flag here would re-arm the paywall on a production with no subscriptions — which is the
    -- state that stops 65 chapters saving for every family. billingSchema.test.ts asserts every
    -- definition of this function carries it, not just the first.
    not coalesce((select bc.enforced from public.billing_config bc), false)
    -- A. (demo) never reaches here: a pre-signup visitor has no account and no rows.
    -- B. the fixed free set.
    or coalesce((select c.is_free from public.chapters c where c.id = p_chapter), false)
    -- C. the learner's ACTIVE plan's recorded free steps, plus at most one revision.
    or exists (
      select 1 from public.diagnostic_plans dp
      where dp.learner_id = p_learner_id
        and dp.active
        and (p_chapter = any (dp.free_chapters) or p_chapter = dp.revised_chapter)
    )
    -- D. a paid seat.
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
    );
$$;

revoke all on function public.is_chapter_entitled(uuid, text) from public, anon;
grant execute on function public.is_chapter_entitled(uuid, text) to authenticated, service_role;

-- ── 4. sync_diagnostic — issue the plan, retire the old one, record the free pair ─────────────
-- ⚠️ SAME SIGNATURE, SAME BODY, THREE ADDITIONS. Reproduced in full rather than patched, because
-- `create or replace function` has no other form — and this is exactly the file a future reader
-- must diff against production before re-applying (the leads_server_only lesson).
create or replace function public.sync_diagnostic(
  p_learner_id    uuid,
  p_band          text,
  p_root_gap      text,
  p_second_gap    text,
  p_blocked       text[],
  p_strengths     text[],
  p_working_level text,
  p_plan_skills   text[],
  p_plan_chapters text[],
  p_items         jsonb,
  p_client_id     uuid default null
) returns uuid
  language plpgsql
  security definer
  set search_path to 'public'
as $$
declare
  v_session_id uuid;
  v_plan_id    uuid;
  v_item       jsonb;
  v_ord        int := 0;
  v_free       text[];
begin
  if not exists (
    select 1 from public.learner_access
    where learner_id = p_learner_id and parent_id = auth.uid()
  ) then
    raise exception 'not authorized for learner %', p_learner_id using errcode = '42501';
  end if;

  -- ⚠️⚠️ CARRIED FORWARD FROM `20260703014331_harden_rpc_inputs.sql` (V5), AND THIS FILE HAD LOST IT.
  -- I rebuilt this function from the IDEMPOTENCY migration (20260702131627) — which is OLDER than
  -- the hardening — so the version below would have silently reverted a security fix, exactly like
  -- `leads_server_only` did, on the same day the runbook rule about it was written.
  --
  -- It was caught by READING PRODUCTION while capturing the rollback, not by reading the repo: the
  -- grep that told me nothing newer redefined this function was CASE-SENSITIVE, and
  -- harden_rpc_inputs writes `CREATE OR REPLACE FUNCTION` in capitals. A source search is a claim
  -- about your regex; `pg_get_functiondef` is a claim about production.
  -- V5: bound the payload so a valid session can't amplify storage or poison aggregates.
  if length(coalesce(p_band, '')) > 24
     or length(coalesce(p_root_gap, '')) > 64
     or length(coalesce(p_second_gap, '')) > 64
     or length(coalesce(p_working_level, '')) > 64
     or coalesce(array_length(p_blocked, 1), 0) > 100
     or coalesce(array_length(p_strengths, 1), 0) > 100
     or coalesce(array_length(p_plan_skills, 1), 0) > 200
     or coalesce(array_length(p_plan_chapters, 1), 0) > 200 then
    raise exception 'diagnostic payload out of bounds' using errcode = '22023';
  end if;
  if p_items is not null then
    if jsonb_typeof(p_items) <> 'array' then
      raise exception 'items must be a json array' using errcode = '22023';
    end if;
    if jsonb_array_length(p_items) > 500 then
      raise exception 'diagnostic payload out of bounds' using errcode = '22023';
    end if;
  end if;

  insert into public.diagnostic_sessions
    (learner_id, band, status, root_gap_skill, second_gap_skill, blocked_skills, strengths, working_level, completed_at, client_id)
  values
    (p_learner_id, p_band, 'completed', p_root_gap, p_second_gap,
     coalesce(p_blocked, '{}'), coalesce(p_strengths, '{}'), p_working_level, now(), p_client_id)
  on conflict (client_id) where client_id is not null do nothing
  returning id into v_session_id;

  -- Already recorded (same client_id) → return the existing session, don't re-insert items/plan.
  -- ⚠️ AND DO NOT RETIRE THE PLAN EITHER. A retried save is not a new check; deactivating here would
  -- leave a learner with NO active plan and no free chapters, from a duplicate network call.
  if v_session_id is null then
    select id into v_session_id from public.diagnostic_sessions where client_id = p_client_id;
    return v_session_id;
  end if;

  if p_items is not null then
    for v_item in select * from jsonb_array_elements(p_items) loop
      insert into public.diagnostic_items (session_id, skill_id, correct, ordinal)
      values (v_session_id, v_item->>'skill', (v_item->>'correct')::boolean, v_ord);
      v_ord := v_ord + 1;
    end loop;
  end if;

  -- ⚠️ NEW: a new plan REPLACES the old one. Free chapters must not accumulate across plans, and
  -- the partial unique index makes this not merely a policy but a precondition of the insert below.
  update public.diagnostic_plans set active = false
   where learner_id = p_learner_id and active;

  -- ⚠️ NEW: the first two steps the learner has NOT already completed, resolved HERE and frozen.
  -- If the demo (or an earlier plan) already covered step one, C hands over the next two they have
  -- not done — so the wall never arrives on a chapter they have just played.
  select coalesce(array_agg(c order by ord), '{}') into v_free
  from (
    select c, ord
    from unnest(coalesce(p_plan_chapters, '{}')) with ordinality as t(c, ord)
    where not exists (
      select 1 from public.learner_progress lp
      where lp.learner_id = p_learner_id and lp.chapter = t.c
    )
    order by ord
    limit 2
  ) s;

  insert into public.diagnostic_plans (learner_id, session_id, skill_sequence, chapter_sequence, free_chapters)
  values (p_learner_id, v_session_id, coalesce(p_plan_skills, '{}'), coalesce(p_plan_chapters, '{}'), v_free)
  returning id into v_plan_id;

  insert into public.diagnostic_plan_progress (plan_id, chapter_id, status)
  select v_plan_id, c, 'todo' from unnest(coalesce(p_plan_chapters, '{}')) as c;

  return v_session_id;
end;
$$;

revoke all on function public.sync_diagnostic(uuid, text, text, text, text[], text[], text, text[], text[], jsonb, uuid) from public, anon;
grant execute on function public.sync_diagnostic(uuid, text, text, text, text[], text[], text, text[], text[], jsonb, uuid) to authenticated, service_role;

-- ── 5. entitle_revised_step — the one extra chapter, once ────────────────────
-- Called when `revisePlanDeeper` has prepended a deeper chapter for a struggling child. It cannot
-- be used twice: `revised_chapter` is only writable while it is null, which is the cap.
--
-- ⚠️ WHAT THIS DELIBERATELY DOES NOT CHECK, said out loud: that the chapter really is a
-- prerequisite of the plan's first step. The skill graph is TypeScript and is not available in SQL,
-- so the guard here is arithmetic, not semantics — one extra chapter per plan, and a new plan costs
-- a 20–50 question probe to obtain. That is a poor exploit and a documented ceiling rather than an
-- unnoticed hole. If it ever matters, the fix is a `chapter_prereq` table, not a longer function.
create or replace function public.entitle_revised_step(p_learner_id uuid, p_chapter text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  if not exists (
    select 1 from public.learner_access
    where learner_id = p_learner_id and parent_id = auth.uid()
  ) then
    raise exception 'not authorized for learner %', p_learner_id using errcode = '42501';
  end if;

  update public.diagnostic_plans
     set revised_chapter = p_chapter
   where learner_id = p_learner_id
     and active
     and revised_chapter is null
     -- Already free by another source: nothing to spend the one revision on.
     and not (p_chapter = any (free_chapters))
  returning id into v_id;

  return v_id is not null;
end;
$$;

revoke all on function public.entitle_revised_step(uuid, text) from public, anon;
grant execute on function public.entitle_revised_step(uuid, text) to authenticated, service_role;
