-- ═══════════════════════════════════════════════════════════════════════════════════════════════
-- VERIFIABLE PARENTAL CONSENT: THE RECORD, AND THE GATE THAT MAKES IT MEAN SOMETHING.
--
-- ⚠️ DEPLOY ORDER. This migration adds a gate that REFUSES writes. Applying it before the client
-- that creates a consent row is deployed means no new child can be created — expand/contract says
-- the readers go first. The client half is `createLearner`, which must pass `consent_id`. Apply
-- this only once that is live. Existing children are exempt (see §4), so applying it does not stop
-- anything already running.
--
-- ⚠️ WHY TRIGGERS AND NOT RLS. Measured on production 2026-09-23: every table here is owned by
-- `postgres` with `relforcerowsecurity = false`, and the primary child-write paths —
-- `record_lesson_progress`, `record_module_practice`, `sync_session`, `set_game_settings`,
-- `start_game_time` — are all SECURITY DEFINER functions owned by `postgres`. **RLS is not applied
-- to them at all.** An RLS-policy consent gate would read as correct in this file and be bypassed
-- by exactly the functions that write most of a child's data. Triggers fire regardless of RLS and
-- regardless of definer, which is the only property that makes this a gate rather than a decoration.
-- The pattern is already proven here by `trg_enforce_learner_cap` on the same table.
-- ═══════════════════════════════════════════════════════════════════════════════════════════════

-- ── 1. The record ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.parental_consents (
  id                        uuid primary key default gen_random_uuid(),

  -- Who gave it, and for whom. `learner_id` is null until the child row exists: the consent must
  -- come FIRST (that is the entire point), so it cannot reference a child that does not exist yet.
  -- It is filled by `consent_bind_learner` the instant the child is created, so every granted
  -- consent that has been used names its child, and one that has not is visibly unused.
  parent_id                 uuid not null references auth.users(id) on delete cascade,
  learner_id                uuid references public.learners(id) on delete cascade,

  method                    text not null check (method in ('payment_card', 'email_plus')),
  state                     text not null default 'pending'
                              check (state in ('pending', 'granted', 'withdrawn', 'expired')),

  -- ⚠️ THE VERSIONS THE PARENT ACTUALLY SAW, COPIED IN — never a pointer to "current". A parent who
  -- consented in March agreed to March's notice, and the only way to say so in a year is to have
  -- stored the string then. Document 02's own header says this is what makes its version line
  -- load-bearing. NOT NULL: a consent whose documents we cannot name is not evidence of anything.
  notice_version            text not null,
  privacy_version           text not null,
  terms_version             text not null,

  requested_at              timestamptz not null default now(),
  confirmed_at              timestamptz,
  second_notice_sent_at     timestamptz,
  withdrawn_at              timestamptz,

  -- The email-plus round trip. The address it went to, and evidence of BOTH sends — the second
  -- send is what makes email-plus a recognised method rather than a checkbox, so it is recorded
  -- separately and can be audited without reading a provider's dashboard.
  email_address             text,
  request_email_sent_at     timestamptz,
  request_email_provider_id text,
  second_email_provider_id  text,

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  -- A state is only as good as the timestamp behind it. `granted` with no `confirmed_at` is a row
  -- that cannot say when the parent agreed, which is the one thing it exists to prove.
  constraint parental_consents_granted_has_time
    check (state <> 'granted'   or confirmed_at is not null),
  constraint parental_consents_withdrawn_has_time
    check (state <> 'withdrawn' or withdrawn_at is not null),
  -- email_plus cannot be evidenced without the address it was sent to.
  constraint parental_consents_email_plus_has_address
    check (method <> 'email_plus' or email_address is not null)
);

create index if not exists parental_consents_parent_idx  on public.parental_consents (parent_id);
create index if not exists parental_consents_learner_idx on public.parental_consents (learner_id);
-- The gate reads this on every child write, so it is the hot path.
create index if not exists parental_consents_gate_idx
  on public.parental_consents (learner_id, state) where state = 'granted';

create trigger parental_consents_updated_at before update on public.parental_consents
  for each row execute function public.set_updated_at();

-- ── 2. The child's pointer, and the grandfather marker ─────────────────────────────────────────
alter table public.learners
  add column if not exists consent_id       uuid references public.parental_consents(id),
  -- ⚠️ THE EXEMPTION IS A TIMESTAMP, NOT A BOOLEAN, ON PURPOSE. It records WHEN a child was
  -- grandfathered, so the set is enumerable, countable, and sortable by how long it has been
  -- waiting. A temporary state nobody can list becomes permanent.
  add column if not exists consent_exempt_at timestamptz;

comment on column public.learners.consent_exempt_at is
  'Set for the children that existed before verifiable parental consent was built (2026-09-23). '
  'Their parents were never asked, and consent cannot be backdated. The gate skips them so they '
  'keep working while that decision is open. List them with public.consent_exempt_learners. This '
  'column is expected to return to all-NULL once those parents have been asked; it is not a '
  'permanent opt-out.';

-- ⚠️ THE ONLY WRITE THIS MIGRATION MAKES TO AN EXISTING ROW, and it is the one the brief asks for:
-- without it, all 26 children stop saving progress the moment the gate lands. `where consent_id is
-- null` so re-running cannot re-stamp a child that has since been given a real consent.
update public.learners
   set consent_exempt_at = coalesce(consent_exempt_at, now())
 where consent_id is null and consent_exempt_at is null;

-- Enumerating them is the point of the marker, so it gets a name rather than living in a query
-- somebody has to remember how to write.
create or replace view public.consent_exempt_learners as
  select l.id as learner_id, l.display_name, l.age_group, l.created_by as parent_id,
         l.created_at, l.consent_exempt_at
    from public.learners l
   where l.consent_exempt_at is not null and l.consent_id is null;

revoke all on public.consent_exempt_learners from public, anon, authenticated;
grant select on public.consent_exempt_learners to service_role;

-- ── 3. The gate ────────────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ SQLSTATE `P0C01` IS THE WHOLE POINT OF THIS FUNCTION AND MUST NOT BE CHANGED CASUALLY.
 * A consent refusal has to be distinguishable, at the client, from a dropped network — otherwise
 * `analytics.ts` treats it as transient and re-queues it for ever, and a parent watches their child
 * use an app that is saving nothing while no error appears anywhere. That was measured before this
 * was built. PostgREST passes `code` through to the browser, so the client keys on this exact
 * string; `src/infra/consentError.ts` holds the other end of the contract.
 */
create or replace function public.consent_ok(p_learner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.learners l
     where l.id = p_learner_id
       and (
         l.consent_exempt_at is not null          -- grandfathered: see §2
         or exists (
           select 1 from public.parental_consents c
            where c.id = l.consent_id and c.state = 'granted'
         )
       )
  )
$$;

revoke all on function public.consent_ok(uuid) from public, anon, authenticated;
grant execute on function public.consent_ok(uuid) to service_role;

/** The gate for every table that carries a child's data. Reads `learner_id` off the row generically
 *  so one function serves all of them — a per-table copy is a per-table place to get it wrong. */
create or replace function public.enforce_child_consent()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_learner uuid;
begin
  execute format('select ($1).%I', tg_argv[0]) into v_learner using new;

  -- A row not about any child is not this gate's business (error_events logs plenty of them).
  if v_learner is null then return new; end if;

  if not public.consent_ok(v_learner) then
    raise exception
      'no granted parental consent for learner % — refusing to write %.%',
      v_learner, tg_table_schema, tg_table_name
      using errcode = 'P0C01',
            hint = 'A consent record in state granted must exist for this child before any field '
                   'about them is stored. This is not a transient failure and retrying will not fix it.';
  end if;
  return new;
end
$$;

/** The gate on `learners` itself. Separate because at INSERT time the row IS the child, so there is
 *  nothing to look up — and because a NEW child may never be grandfathered, only an existing one. */
create or replace function public.enforce_learner_consent()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    -- ⚠️ NO GRANDFATHER ESCAPE ON INSERT. §2 stamps the children that already existed; a row being
    -- created now cannot be one of them, so allowing `consent_exempt_at` here would let any caller
    -- opt out of the gate by setting one column. Refused explicitly rather than ignored.
    if new.consent_exempt_at is not null then
      raise exception 'consent_exempt_at may not be set on a new child — it marks the children that '
                      'existed before consent was built, and is not an opt-out'
        using errcode = 'P0C01';
    end if;
    if new.consent_id is null
       or not exists (select 1 from public.parental_consents c
                       where c.id = new.consent_id
                         and c.state = 'granted'
                         and c.parent_id = new.created_by) then
      raise exception 'no granted parental consent for this child — refusing to create them'
        using errcode = 'P0C01',
              hint = 'Create a parental_consents row, move it to granted, and pass its id as '
                     'learners.consent_id. This is not a transient failure.';
    end if;
  else
    -- UPDATE: a grandfathered child must stay editable (rename, avatar, lesson choice) or the
    -- exemption is worthless; everyone else needs live consent, so withdrawing it freezes the row.
    if not public.consent_ok(new.id) then
      raise exception 'no granted parental consent for learner % — refusing to change their record', new.id
        using errcode = 'P0C01',
              hint = 'This is not a transient failure.';
    end if;
  end if;
  return new;
end
$$;

revoke all on function public.enforce_child_consent()   from public, anon, authenticated;
revoke all on function public.enforce_learner_consent() from public, anon, authenticated;

create trigger trg_enforce_learner_consent
  before insert or update on public.learners
  for each row execute function public.enforce_learner_consent();

/** Closes the loop: the consent row learns which child it covers the moment that child exists. */
create or replace function public.consent_bind_learner()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.consent_id is not null then
    update public.parental_consents
       set learner_id = new.id
     where id = new.consent_id and learner_id is null;
  end if;
  return new;
end
$$;
revoke all on function public.consent_bind_learner() from public, anon, authenticated;

create trigger trg_consent_bind_learner
  after insert on public.learners
  for each row execute function public.consent_bind_learner();

-- ── 4. Attach the gate to every table that holds a field about a child ─────────────────────────
/**
 * ⚠️ DERIVED FROM THE CATALOG, NOT TYPED OUT. A hand-written list is a second copy of the schema
 * and drifts exactly where the two can disagree. This loops over every public table carrying a
 * `learner_id`, minus a named exemption list — and `parentalConsent.test.ts` asserts the coverage
 * independently, so a table added later that nobody wires up is caught rather than assumed.
 *
 * The three exemptions, each because the row is about an ADULT'S AUTHORISATION or billing rather
 * than a field about the child:
 *   · learner_access  — which adult may reach which child. Also written by `grant_owner_access`
 *                       in the same statement that creates the child, so gating it would order-trap.
 *   · learner_invites — an invitation addressed to an adult.
 *   · subscription_seats — how many seats an adult has paid for.
 */
do $$
declare
  t record;
  exempt text[] := array['learner_access', 'learner_invites', 'subscription_seats'];
begin
  for t in
    select c.relname
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r'
       and exists (select 1 from pg_attribute a
                    where a.attrelid = c.oid and a.attname = 'learner_id' and a.attnum > 0
                      and not a.attisdropped)
       and not (c.relname = any(exempt))
     order by c.relname
  loop
    execute format(
      'drop trigger if exists trg_enforce_child_consent on public.%I', t.relname);
    execute format(
      'create trigger trg_enforce_child_consent before insert or update on public.%I
         for each row execute function public.enforce_child_consent(%L)',
      t.relname, 'learner_id');
  end loop;
end $$;

-- ── 5. Who may see a consent record ────────────────────────────────────────────────────────────
alter table public.parental_consents enable row level security;

-- A parent reads and writes only their own consents. There is deliberately no DELETE policy: a
-- withdrawn consent is evidence and is kept, which is what `state = 'withdrawn'` is for.
create policy "parental_consents: own rows" on public.parental_consents
  for select using (parent_id = auth.uid());
create policy "parental_consents: own insert" on public.parental_consents
  for insert with check (parent_id = auth.uid());
create policy "parental_consents: own update" on public.parental_consents
  for update using (parent_id = auth.uid()) with check (parent_id = auth.uid());

revoke all on public.parental_consents from public, anon;
grant select, insert, update on public.parental_consents to authenticated;
grant all on public.parental_consents to service_role;
