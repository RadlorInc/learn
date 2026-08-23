-- ─────────────────────────────────────────────────────────────────────────────
--  BILLING — STAGE 1: schema, RLS, entitlement. NO UI, NO STRIPE CALLS.
--
--  ⚠️ NOT YET APPLIED TO PRODUCTION. It is applied by hand through the prod gate; when it is, the
--  ledger records a GENERATED version and this file must be renamed to it (see
--  docs/runbooks/applying-migrations.md and docs/schema-baseline-debt.md). CI replays it from zero
--  against a throwaway Postgres on every PR, which is where it is actually being tested today.
--
--  ⚠️⚠️ WHAT THIS CAN AND CANNOT GATE. RLS gates the RECORD, not the chapter CONTENT. Chapters are
--  client-side JavaScript and stay that way (founder's call: sell the plan, the diagnostic and the
--  record, not the JS — do NOT move question generation server-side). So an unentitled child can
--  still OPEN a paid chapter; what they cannot do is have the session SAVED, counted, or appear in
--  the report. Every guard below is a WRITE guard, and reads are deliberately left alone: a lapsed
--  subscriber keeps their child's history. Holding a child's record hostage to a card failure is
--  not a thing this product will do.
--
--  Decisions this encodes (all founder's, 2026-08-24): graduated tiering never volume · 4 paid
--  seats against the existing 25-profile cap · teachers out of scope · entitlement follows
--  `learners.created_by` · no trial · 7-day grace.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Which chapters do not need a subscription ──────────────────────────────
-- A flag on the existing public catalog, so the free set is data and changing it is one UPDATE
-- rather than a deploy. `chapters` is world-readable by design, and which chapters are free is
-- public information anyway — it is on the pricing page.
alter table public.chapters add column if not exists is_free boolean not null default false;

comment on column public.chapters.is_free is
  'No subscription needed for this chapter''s sessions to be RECORDED. Not an access control: '
  'chapter content is client-side JS and anyone can play anything.';

-- ⚠️ PROPOSAL, NOT A SETTLED SET — see docs/billing-stage-1.md §4. Seeded so the system is coherent
-- and the tests have something true to assert; expected to change on the founder's pick.
update public.chapters set is_free = (id in (
  'counting',              -- 3-5    first chapter of the band
  'numbersTo100',          -- 6-8    first chapter of the band
  'bigNumbers',            -- 9-11   first chapter of the band
  'decimals',              -- 9-11   the AR showcase (finger count, hand or taps)
  'integers',              -- 12-14  first chapter of the band
  'signedNumberFluency',   -- 15-16  first chapter of the band
  'functionToolkit'        -- 17-18  first chapter of the band
));

-- ── 2. subscriptions — one row per paying account ────────────────────────────
create table if not exists public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  -- The ACCOUNT, not the learner. Entitlement follows `learners.created_by`, so a viewer invited
  -- into a family (a grandparent) never needs a subscription of their own and never gets billed.
  account_id             uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  -- ⚠️ DELIBERATELY NO CHECK CONSTRAINT. This column holds whatever Stripe last said. A CHECK would
  -- make a webhook carrying a status we have not met ERROR, and losing the event is far worse than
  -- storing a word we do not recognise: `is_chapter_entitled` allow-lists, so an unknown status
  -- fails CLOSED (not entitled) rather than failing the write.
  status                 text not null default 'none',
  -- Our number, not Stripe's, so this one is checked. 4 paid seats against the 25-profile cap that
  -- `enforce_learner_cap` already imposes — a family may hold 25 children and pay for 4 of them.
  seats_paid             int not null default 0 check (seats_paid between 0 and 4),
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  -- 7-day grace after a failed payment. Set by the webhook; entitlement reads it directly rather
  -- than computing "7 days after something", so changing the grace length is a Stripe-side change.
  grace_until            timestamptz,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ── 3. subscription_seats — the allocation, and the only thing a parent may change ───────────
-- A seat is a ROW. That is what makes reassignment structurally unable to raise the active count:
-- `reassign_learner_seat` UPDATEs one existing row's learner_id and there is no INSERT anywhere a
-- parent can reach — not in the function, and not through a policy, because there is no INSERT
-- policy on this table at all.
create table if not exists public.subscription_seats (
  id                 uuid primary key default gen_random_uuid(),
  subscription_id    uuid not null references public.subscriptions(id) on delete cascade,
  seat_index         int  not null check (seat_index between 1 and 4),
  -- null = a paid seat with nobody in it. `on delete set null` so deleting a child frees the seat
  -- rather than blocking the deletion — a parent exercising their deletion right must never be
  -- stopped by billing bookkeeping.
  learner_id         uuid references public.learners(id) on delete set null,
  assigned_at        timestamptz,
  -- One reassignment per billing period, enforced in `reassign_learner_seat`. Without it a single
  -- seat rotates through all 25 profiles and the seat count means nothing.
  last_reassigned_at timestamptz,
  unique (subscription_id, seat_index)
);

-- A learner occupies at most one seat, or the same child could consume two of four.
create unique index if not exists subscription_seats_learner_uniq
  on public.subscription_seats (learner_id) where learner_id is not null;
create index if not exists subscription_seats_subscription_idx
  on public.subscription_seats (subscription_id);

-- ── 4. billing_events — the Stripe webhook log ───────────────────────────────
-- ⚠️ RLS ON WITH ZERO POLICIES = DENY-ALL, service-role only. This is the `error_events` precedent
-- (20260817142406) and it is deliberate: the payload carries Stripe customer ids and amounts, which
-- is account-level financial data with no reason to be reachable from a browser. The advisor
-- reports "RLS enabled, no policies" as INFO; that is the intended state, not a gap.
create table if not exists public.billing_events (
  id              uuid primary key default gen_random_uuid(),
  at              timestamptz not null default now(),
  -- Stripe's own event id, unique: the webhook is at-least-once, so this is the idempotency key.
  stripe_event_id text not null unique,
  type            text not null,
  account_id      uuid references auth.users(id) on delete set null,
  payload         jsonb not null default '{}'::jsonb,
  processed_at    timestamptz
);
create index if not exists billing_events_at_idx on public.billing_events (at desc);

-- ── 5. RLS ───────────────────────────────────────────────────────────────────
alter table public.subscriptions      enable row level security;
alter table public.subscription_seats enable row level security;
alter table public.billing_events     enable row level security;

-- ⚠️ THE REVOKES ARE NOT BELT-AND-BRACES, THEY CHANGE THE FAILURE MODE. Supabase's default
-- privileges hand `anon` and `authenticated` ALL on new public tables. With the grant left in
-- place and no UPDATE policy, an UPDATE matches no rows and returns "0 rows" — it does not raise.
-- A silent no-op is the worst possible answer to an attempted self-upgrade, because the client
-- cannot tell it from success. Revoked, the same statement raises 42501.
revoke all on public.subscriptions      from anon, authenticated;
revoke all on public.subscription_seats from anon, authenticated;
revoke all on public.billing_events     from anon, authenticated;

grant select on public.subscriptions      to authenticated;
grant select on public.subscription_seats to authenticated;

-- SELECT only. There is deliberately NO insert / update / delete policy on either table: a parent
-- may look at what they are paying for and may not write a word of it. Everything that changes a
-- subscription arrives from Stripe through the service role; everything that moves a seat goes
-- through `reassign_learner_seat`.
drop policy if exists "subscriptions: owner can read" on public.subscriptions;
create policy "subscriptions: owner can read" on public.subscriptions
  for select to authenticated
  using (account_id = (select auth.uid()));

drop policy if exists "subscription_seats: owner can read" on public.subscription_seats;
create policy "subscription_seats: owner can read" on public.subscription_seats
  for select to authenticated
  using (exists (
    select 1 from public.subscriptions s
    where s.id = subscription_seats.subscription_id
      and s.account_id = (select auth.uid())
  ));

-- ── 6. is_chapter_entitled — THE one definition of "may this be recorded" ────
-- ⚠️ ONE FUNCTION, TWO CALL SITES, ON PURPOSE. The direct RLS policies on `sessions` and
-- `learner_progress` and the `sync_session` RPC must agree, and the only way to make two guards
-- unable to diverge is to make them the same guard. `sync_session` is SECURITY DEFINER, so it runs
-- as the table owner and RLS does not apply to it — the policy alone would leave the RPC wide open,
-- and the RPC alone would leave the direct writes open. Both, or neither is worth anything.
-- rls_regression.sql B12 drives both paths and asserts their verdicts are EQUAL.
create or replace function public.is_chapter_entitled(p_learner_id uuid, p_chapter text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    -- Free chapters are free for everybody, signed in or not, paying or not.
    coalesce((select c.is_free from public.chapters c where c.id = p_chapter), false)
    or exists (
      select 1
      from public.subscription_seats st
      join public.subscriptions      s on s.id = st.subscription_id
      join public.learners           l on l.id = st.learner_id
      where st.learner_id = p_learner_id
        -- Entitlement follows `learners.created_by`: the account that CREATED the child pays for
        -- them. A seat sold to one account cannot cover another account's child even if a row
        -- pointed that way.
        and l.created_by = s.account_id
        and (
          s.status = 'active'
          -- 7-day grace: a failed card does not stop a child mid-week.
          or (s.status in ('past_due', 'unpaid')
              and s.grace_until is not null and now() <= s.grace_until)
        )
    );
$$;

-- ⚠️ ACCEPTED, WRITTEN DOWN: `authenticated` must hold EXECUTE or the RLS policies below cannot
-- call it — a policy predicate is evaluated with the caller's privileges. That makes this a
-- one-bit oracle: someone who already knows a learner UUID can ask whether it is entitled. Learner
-- ids are non-enumerable (the same argument that bounded V1's severity) and the bit is "is this
-- family paying", not any child data. Not free, and cheaper than the alternative.
revoke all on function public.is_chapter_entitled(uuid, text) from public, anon;
grant execute on function public.is_chapter_entitled(uuid, text) to authenticated, service_role;

-- ── 7. The guard, at BOTH write paths ────────────────────────────────────────
-- (a) sessions — drop-then-create, because the baseline creates this policy with a bare CREATE and
-- CREATE POLICY has no IF NOT EXISTS (see src/__tests__/baselineSchema.test.ts).
drop policy if exists "sessions: parent can insert" on public.sessions;
create policy "sessions: parent can insert" on public.sessions
  for insert
  with check (
    exists (select 1 from public.learner_access la
            where la.learner_id = sessions.learner_id and la.parent_id = (select auth.uid()))
    and public.is_chapter_entitled(sessions.learner_id, sessions.chapter)
  );

-- (b) learner_progress — the entitlement goes in WITH CHECK only, never in USING. USING gates what
-- a parent can SEE and DELETE; putting the guard there would make a lapsed subscriber's history
-- vanish from their own dashboard, which is the thing this migration's header refuses to do.
drop policy if exists "learner_progress: parent access" on public.learner_progress;
create policy "learner_progress: parent access" on public.learner_progress
  for all
  using (exists (select 1 from public.learner_access la
                 where la.learner_id = learner_progress.learner_id and la.parent_id = (select auth.uid())))
  with check (
    exists (select 1 from public.learner_access la
            where la.learner_id = learner_progress.learner_id and la.parent_id = (select auth.uid()))
    and public.is_chapter_entitled(learner_progress.learner_id, learner_progress.chapter)
  );

-- (c) sync_session — the RPC. Same guard, same function. It RAISES rather than returning quietly:
-- a swallowed refusal is a chapter whose work disappears with nothing on screen saying why, which
-- is this repo's own "a tap that does nothing" fault wearing a server costume. 42501 so the client
-- can tell it apart from a validation error and show a lock instead of a crash.
CREATE OR REPLACE FUNCTION public.sync_session(
  p_learner_id uuid, p_chapter text, p_phase text, p_correct integer, p_wrong integer,
  p_stars integer, p_xp integer, p_coins integer, p_client_id text,
  p_completed_at timestamp with time zone, p_difficulty integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_existing_stars    INT := 0;
  v_existing_xp       INT := 0;
  v_existing_sessions INT := 0;
  v_total_xp          INT := 0;
  v_total_coins       INT := 0;
  v_level             INT := 1;
  v_thresholds        INT[] := ARRAY[0,500,1200,2500,4500,7000,10000,14000];
  i                   INT;
  v_stars             INT;
  v_correct           INT;
  v_wrong             INT;
  v_run_xp            INT;
  v_run_coins         INT;
  v_difficulty        INT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.learner_access
    WHERE learner_id = p_learner_id AND parent_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not authorized for learner %', p_learner_id USING ERRCODE = '42501';
  END IF;

  -- THE ENTITLEMENT GUARD. Same function the direct write policies call.
  IF NOT public.is_chapter_entitled(p_learner_id, p_chapter) THEN
    RAISE EXCEPTION 'chapter % is not included in this subscription', p_chapter USING ERRCODE = '42501';
  END IF;

  v_stars     := LEAST(GREATEST(COALESCE(p_stars, 0), 0), 3);
  v_correct   := LEAST(GREATEST(COALESCE(p_correct, 0), 0), 200);
  v_wrong     := LEAST(GREATEST(COALESCE(p_wrong, 0), 0), 200);
  v_run_xp    := v_stars * 50 + v_correct * 10;   -- derived, not trusted from client
  v_run_coins := v_stars * 5;                      -- derived, not trusted from client
  v_difficulty := LEAST(GREATEST(COALESCE(p_difficulty, 1), 1), 3);

  INSERT INTO public.sessions (
    learner_id, chapter, phase, correct_count, wrong_count,
    stars_earned, xp_earned, coins_earned, client_id, completed_at
  ) VALUES (
    p_learner_id, p_chapter, p_phase, v_correct, v_wrong,
    v_stars, v_run_xp, v_run_coins, p_client_id, p_completed_at
  ) ON CONFLICT (client_id) DO NOTHING;

  IF NOT FOUND THEN RETURN; END IF;

  SELECT best_stars, total_xp, total_sessions
  INTO v_existing_stars, v_existing_xp, v_existing_sessions
  FROM public.learner_progress
  WHERE learner_id = p_learner_id AND chapter = p_chapter;

  INSERT INTO public.learner_progress
    (learner_id, chapter, best_stars, total_xp, total_sessions, last_played_at, current_level)
  VALUES (
    p_learner_id, p_chapter,
    GREATEST(COALESCE(v_existing_stars, 0), v_stars),
    COALESCE(v_existing_xp, 0) + v_run_xp,
    COALESCE(v_existing_sessions, 0) + 1,
    p_completed_at,
    v_difficulty
  ) ON CONFLICT (learner_id, chapter) DO UPDATE SET
    best_stars     = GREATEST(learner_progress.best_stars, v_stars),
    total_xp       = learner_progress.total_xp + v_run_xp,
    total_sessions = learner_progress.total_sessions + 1,
    last_played_at = p_completed_at,
    -- LAST WRITE WINS, NOT GREATEST: a demotion is the half of adaptive that matters most.
    current_level  = v_difficulty;

  SELECT total_xp, total_coins
  INTO v_total_xp, v_total_coins
  FROM public.learner_stats WHERE learner_id = p_learner_id;

  v_total_xp    := COALESCE(v_total_xp, 0) + v_run_xp;
  v_total_coins := COALESCE(v_total_coins, 0) + v_run_coins;

  FOR i IN REVERSE array_length(v_thresholds,1)..1 LOOP
    IF v_total_xp >= v_thresholds[i] THEN v_level := i; EXIT; END IF;
  END LOOP;

  INSERT INTO public.learner_stats
    (learner_id, total_xp, total_coins, current_level, last_played_at)
  VALUES (p_learner_id, v_total_xp, v_total_coins, v_level, p_completed_at)
  ON CONFLICT (learner_id) DO UPDATE SET
    total_xp = v_total_xp, total_coins = v_total_coins, current_level = v_level,
    last_played_at = p_completed_at;
END;
$function$;

REVOKE ALL ON FUNCTION public.sync_session(uuid, text, text, integer, integer, integer, integer, integer, text, timestamp with time zone, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_session(uuid, text, text, integer, integer, integer, integer, integer, text, timestamp with time zone, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.sync_session(uuid, text, text, integer, integer, integer, integer, integer, text, timestamp with time zone, integer) TO authenticated, service_role;

-- ── 8. reassign_learner_seat — the one billing write a parent may make ───────
-- ⚠️ STRUCTURALLY UNABLE TO RAISE THE ACTIVE COUNT. The body contains exactly one write, an UPDATE
-- of one existing row `where id = p_seat_id`. There is no INSERT and no DELETE in it, and no INSERT
-- policy on `subscription_seats` for a parent to reach around it — so the number of seats is
-- decided by Stripe and by nothing else. `src/__tests__/billingSchema.test.ts` gates the absence of
-- those two statements, and rls_regression B13 counts the rows before and after.
create or replace function public.reassign_learner_seat(p_seat_id uuid, p_learner_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seat public.subscription_seats;
  v_sub  public.subscriptions;
begin
  select * into v_seat from public.subscription_seats where id = p_seat_id;
  -- ⚠️ Same message and errcode as "not yours", deliberately: distinguishing "no such seat" from
  -- "not your seat" turns this into a seat-id oracle.
  if not found then
    raise exception 'seat not found or not yours' using errcode = '42501';
  end if;

  select * into v_sub from public.subscriptions where id = v_seat.subscription_id;
  if v_sub.account_id is distinct from auth.uid() then
    raise exception 'seat not found or not yours' using errcode = '42501';
  end if;

  -- Entitlement follows `learners.created_by`, so a seat may only be pointed at a child THIS
  -- account created — not one it merely has viewer access to, which would let two accounts pay
  -- for the same child, or one account seat a child it cannot otherwise administer.
  if not exists (
    select 1 from public.learners l where l.id = p_learner_id and l.created_by = auth.uid()
  ) then
    raise exception 'that is not a learner you created' using errcode = '42501';
  end if;

  -- A no-op must not burn the period's one reassignment.
  if v_seat.learner_id is not distinct from p_learner_id then
    return;
  end if;

  if exists (
    select 1 from public.subscription_seats o
    where o.learner_id = p_learner_id and o.id <> p_seat_id
  ) then
    raise exception 'that learner already holds a seat' using errcode = 'check_violation';
  end if;

  -- ONE REASSIGNMENT PER BILLING PERIOD.
  -- ⚠️ `coalesce(..., '-infinity')` is the fail-CLOSED half. With no period start recorded — no
  -- Stripe data yet, or a webhook that never landed — the comparison would otherwise be NULL and
  -- the whole guard would silently pass, which is exactly the state an attacker would engineer.
  -- Against '-infinity' any non-null `last_reassigned_at` denies, so an unknown period allows the
  -- first assignment and nothing after it.
  if v_seat.last_reassigned_at is not null
     and v_seat.last_reassigned_at >= coalesce(v_sub.current_period_start, '-infinity'::timestamptz)
  then
    raise exception 'this seat has already been reassigned this billing period'
      using errcode = 'check_violation';
  end if;

  update public.subscription_seats
     set learner_id         = p_learner_id,
         assigned_at        = now(),
         last_reassigned_at = now()
   where id = p_seat_id;
end $$;

revoke all on function public.reassign_learner_seat(uuid, uuid) from public, anon;
grant execute on function public.reassign_learner_seat(uuid, uuid) to authenticated, service_role;
