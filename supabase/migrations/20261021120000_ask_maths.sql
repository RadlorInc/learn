-- ASK MATHS (founder, 2026-10-21; docs/product/ask-maths.md): a child in grades 3–8 types a maths question, and an
-- animated whiteboard lesson answers it. The question goes from Radlic's server to the askRadlor whiteboard service
-- (Radlor Inc.) and from there to the model; the parent turns it on per child, after a disclosure they agree to, and it
-- is a separately paid add-on. This file is the database half.
--
--   ask_maths_settings    one row per child: on/off, the daily limit, and WHO agreed to the disclosure WHEN, under
--                         which text version. THE AUTHORISATION — only the adult who owns the child writes it.
--   ask_maths_questions   what the child asked, the outcome, and the drawn lesson (for the parent and for a replay).
--                         Deleted after 30 DAYS by a daily job (and with the child). Nobody writes it from a browser.
--   addon_subscriptions   the add-on's Stripe subscription, one row per account and product. Written only by the
--                         webhook (service role), like `subscriptions`; the owner may read it.
--
--   set_ask_maths(learner, enabled, daily_limit, consent_version) — the owner turns it on/off. Turning it ON needs the
--       current disclosure version ('ask-maths-v1'), which is stored with who and when.
--   ask_maths_begin(learner, question) — the child (or any adult with access) asks: every check in one place, then a
--       'pending' row. Returns {ok, id, band} or {ok:false, error}.
--   ask_maths_finish(id, outcome, script) — SERVICE ROLE ONLY: the server records how it ended. A 'personal' question
--       (the screen found personal details in it) is not kept: its text is cleared.
--   ask_maths_forget(learner) — the owner deletes every question of the child now (a parent's deletion right).
--
-- WHO MAY DO WHAT (enforced here):
--   ask_maths_settings  SELECT: anyone with a learner_access row for the child (the child's home shows the button).
--   ask_maths_questions SELECT: the same family. INSERT/UPDATE/DELETE: nobody from a browser — only the functions.
--   addon_subscriptions SELECT: the account itself. Nothing else, ever, from a browser.
--
-- ⚠️ SECURITY CHANGE: REDEFINED SECURITY DEFINER `consent_withdraw_account(uuid)` (copied from 20261008000000, one
-- added line marked; DEFINER, search_path, owner and its revoke unchanged), and a trigger on addon_subscriptions
-- running the existing DEFINER `billing_queue_cancel_on_delete()`. And four NEW SECURITY DEFINER functions (search_path pinned to public, owner the migration's role).
-- EXECUTE revoked from public, anon and authenticated; set_ask_maths, ask_maths_begin and ask_maths_forget granted to
-- authenticated, ask_maths_finish to service_role only (a browser can never set an outcome or a script). Each checks
-- the caller against learner_access / learners.created_by and raises 42501 otherwise. Asserted at the bottom.
--
-- DEPLOY ORDER: SAFE EITHER WAY. The app hides Ask maths unless ASK_MATHS=on (server) and NEXT_PUBLIC_ASK_MATHS=on, and
-- the parent's switch reads this table; before this runs, the dashboard card says Ask maths is not available.
-- Rollback: select cron.unschedule('prune-ask-maths-questions'); drop function public.ask_maths_forget(uuid),
--   public.ask_maths_finish(uuid, text, jsonb), public.ask_maths_begin(uuid, text),
--   public.set_ask_maths(uuid, boolean, int, text); drop table public.ask_maths_questions, public.ask_maths_settings,
--   public.addon_subscriptions.

-- ── 1. Tables ──────────────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ask_maths_settings (
  learner_id      uuid primary key references public.learners(id) on delete cascade,
  enabled         boolean not null default false,
  daily_limit     int not null default 5 check (daily_limit between 1 and 20),
  -- The disclosure the adult agreed to (src/features/askMaths/disclosure.ts: its version string). Null = never agreed.
  consent_version text check (consent_version is null or consent_version ~ '^ask-maths-v[0-9]+$'),
  consented_by    uuid references auth.users(id) on delete set null,
  consented_at    timestamptz,
  updated_at      timestamptz not null default now(),
  constraint ask_maths_settings_on_needs_consent check (not enabled or (consent_version is not null and consented_at is not null))
);

create table if not exists public.ask_maths_questions (
  id         uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  asked_at   timestamptz not null default now(),
  -- Null only for a question the screen found personal details in: it is not kept.
  question   text check (question is null or char_length(question) between 1 and 300),
  outcome    text not null default 'pending' check (outcome in ('pending', 'answered', 'not_maths', 'personal', 'unsafe', 'failed')),
  script     jsonb check (script is null or (jsonb_typeof(script) = 'object' and octet_length(script::text) <= 200000)),
  constraint ask_maths_questions_personal_not_kept check (outcome <> 'personal' or question is null)
);
create index if not exists ask_maths_questions_learner_asked on public.ask_maths_questions (learner_id, asked_at desc);

create table if not exists public.addon_subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  account_id             uuid not null references auth.users(id) on delete cascade,
  product                text not null check (product in ('ask_maths')),
  stripe_customer_id     text,
  stripe_subscription_id text unique,
  -- What Stripe last said; no CHECK, as on subscriptions.status (an unknown word fails CLOSED: not entitled).
  status                 text not null default 'none',
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  updated_at             timestamptz not null default now(),
  unique (account_id, product)
);

alter table public.ask_maths_settings  enable row level security;
alter table public.ask_maths_questions enable row level security;
alter table public.addon_subscriptions enable row level security;
revoke all on public.ask_maths_settings  from public, anon, authenticated;
revoke all on public.ask_maths_questions from public, anon, authenticated;
revoke all on public.addon_subscriptions from public, anon, authenticated;
grant select on public.ask_maths_settings  to authenticated;
grant select on public.ask_maths_questions to authenticated;
grant select on public.addon_subscriptions to authenticated;

drop policy if exists "ask_maths_settings: the child's family reads" on public.ask_maths_settings;
create policy "ask_maths_settings: the child's family reads" on public.ask_maths_settings for select to authenticated
  using (learner_id in (select learner_id from public.learner_access where parent_id = (select auth.uid())));
drop policy if exists "ask_maths_questions: the child's family reads" on public.ask_maths_questions;
create policy "ask_maths_questions: the child's family reads" on public.ask_maths_questions for select to authenticated
  using (learner_id in (select learner_id from public.learner_access where parent_id = (select auth.uid())));
drop policy if exists "addon_subscriptions: owner can read" on public.addon_subscriptions;
create policy "addon_subscriptions: owner can read" on public.addon_subscriptions for select to authenticated
  using (account_id = (select auth.uid()));

-- The consent gate (20260923120000 §4), wired by hand for tables added after its one-time loop.
drop trigger if exists trg_enforce_child_consent on public.ask_maths_settings;
create trigger trg_enforce_child_consent before insert or update on public.ask_maths_settings
  for each row execute function public.enforce_child_consent('learner_id');
drop trigger if exists trg_enforce_child_consent on public.ask_maths_questions;
create trigger trg_enforce_child_consent before insert or update on public.ask_maths_questions
  for each row execute function public.enforce_child_consent('learner_id');

-- deletion_log (FND-15) names every path that deletes a child's data: a parent clearing the questions is one more.
alter table public.deletion_log drop constraint if exists deletion_log_path_check;
alter table public.deletion_log add constraint deletion_log_path_check check (path in ('delete_child', 'withdraw_consent_child',
  'withdraw_consent_account', 'close_account', 'prune_unconfirmed', 'retention', 'ask_maths_forget'));

-- ── 2. The owner's switch ──────────────────────────────────────────────────────────────────────────────────────────
create or replace function public.set_ask_maths(p_learner uuid, p_enabled boolean, p_daily_limit int, p_consent_version text)
  returns jsonb language plpgsql security definer set search_path to 'public' as $$
begin
  if not (exists (select 1 from public.learners where id = p_learner and created_by = auth.uid())
       or exists (select 1 from public.learner_access where learner_id = p_learner and parent_id = auth.uid() and access_role = 'owner')) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_daily_limit is null or p_daily_limit < 1 or p_daily_limit > 20 then
    return jsonb_build_object('ok', false, 'error', 'bad_limit');
  end if;
  -- The version the app shows today. A newer text is a new version, and turning Ask maths on asks again.
  if coalesce(p_enabled, false) and p_consent_version is distinct from 'ask-maths-v1' then
    return jsonb_build_object('ok', false, 'error', 'consent_required');
  end if;
  insert into public.ask_maths_settings as s (learner_id, enabled, daily_limit, consent_version, consented_by, consented_at)
  values (p_learner, coalesce(p_enabled, false), p_daily_limit,
          case when p_enabled then p_consent_version end, case when p_enabled then auth.uid() end, case when p_enabled then now() end)
  on conflict (learner_id) do update set
    enabled = excluded.enabled, daily_limit = excluded.daily_limit, updated_at = now(),
    -- Turning it off keeps the record of the agreement; turning it on again records the new one.
    consent_version = case when excluded.enabled then excluded.consent_version else s.consent_version end,
    consented_by    = case when excluded.enabled then excluded.consented_by    else s.consented_by end,
    consented_at    = case when excluded.enabled then excluded.consented_at    else s.consented_at end;
  return jsonb_build_object('ok', true);
end;
$$;

-- ── 3. A question: every check, then a pending row ─────────────────────────────────────────────────────────────────
create or replace function public.ask_maths_begin(p_learner uuid, p_question text)
  returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  v_band text; v_owner uuid; v_set public.ask_maths_settings; v_id uuid; v_used int;
  v_q text := btrim(coalesce(p_question, ''));
begin
  if not exists (select 1 from public.learner_access where learner_id = p_learner and parent_id = auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if char_length(v_q) < 1 or char_length(v_q) > 300 then return jsonb_build_object('ok', false, 'error', 'bad_question'); end if;
  select age_group, created_by into v_band, v_owner from public.learners where id = p_learner;
  -- Grades 3–8 only: the 9-11 and 12-14 bands (docs/architecture.md, "age_group").
  if v_band not in ('9-11', '12-14') then return jsonb_build_object('ok', false, 'error', 'band'); end if;
  select * into v_set from public.ask_maths_settings where learner_id = p_learner;
  if not found or not v_set.enabled then return jsonb_build_object('ok', false, 'error', 'off'); end if;
  if not exists (select 1 from public.addon_subscriptions
                 where account_id = v_owner and product = 'ask_maths' and status in ('active', 'trialing')) then
    return jsonb_build_object('ok', false, 'error', 'not_entitled');
  end if;
  if exists (select 1 from public.ask_maths_questions
             where learner_id = p_learner and outcome = 'pending' and asked_at > now() - interval '5 minutes') then
    return jsonb_build_object('ok', false, 'error', 'busy');
  end if;
  -- The day's limit counts every question except the ones that broke on our side.
  select count(*) into v_used from public.ask_maths_questions
   where learner_id = p_learner and asked_at > now() - interval '24 hours' and outcome <> 'failed';
  if v_used >= v_set.daily_limit then return jsonb_build_object('ok', false, 'error', 'limit'); end if;
  insert into public.ask_maths_questions (learner_id, question) values (p_learner, v_q) returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id, 'band', v_band, 'left', v_set.daily_limit - v_used - 1);
end;
$$;

create or replace function public.ask_maths_finish(p_id uuid, p_outcome text, p_script jsonb)
  returns boolean language plpgsql security definer set search_path to 'public' as $$
begin
  if p_outcome not in ('answered', 'not_maths', 'personal', 'unsafe', 'failed') then
    raise exception 'bad outcome' using errcode = '22023';
  end if;
  update public.ask_maths_questions
     set outcome = p_outcome,
         question = case when p_outcome = 'personal' then null else question end,
         script = case when p_outcome = 'answered' then p_script end
   where id = p_id and outcome = 'pending';
  return found;
end;
$$;

create or replace function public.ask_maths_forget(p_learner uuid)
  returns int language plpgsql security definer set search_path to 'public' as $$
declare v_n int;
begin
  if not (exists (select 1 from public.learners where id = p_learner and created_by = auth.uid())
       or exists (select 1 from public.learner_access where learner_id = p_learner and parent_id = auth.uid() and access_role = 'owner')) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  with gone as (delete from public.ask_maths_questions where learner_id = p_learner returning 1)
  select count(*) into v_n from gone;
  if v_n > 0 then
    insert into public.deletion_log (path, actor_kind, actor_id, account_id, learner_ids, row_counts)
    values ('ask_maths_forget', 'user', auth.uid(), (select created_by from public.learners where id = p_learner),
            array[p_learner], jsonb_build_object('ask_maths_questions', v_n));
  end if;
  return v_n;
end;
$$;

revoke all on function public.set_ask_maths(uuid, boolean, int, text) from public, anon, authenticated;
revoke all on function public.ask_maths_begin(uuid, text)            from public, anon, authenticated;
revoke all on function public.ask_maths_finish(uuid, text, jsonb)    from public, anon, authenticated;
revoke all on function public.ask_maths_forget(uuid)                 from public, anon, authenticated;
grant execute on function public.set_ask_maths(uuid, boolean, int, text) to authenticated;
grant execute on function public.ask_maths_begin(uuid, text)            to authenticated;
grant execute on function public.ask_maths_forget(uuid)                 to authenticated;
grant execute on function public.ask_maths_finish(uuid, text, jsonb)    to service_role;

-- ── 3b. Closing the account, or withdrawing for every child, cancels the add-on too ─────────────────────────────
-- The same queue and the same drain as the plan (20261008000000; src/features/billing/closeRefund.ts): a deleted
-- add-on row (the account closed: on delete cascade) queues its Stripe id by the same trigger function, and the
-- withdraw-all function queues it as it queues the plan.
drop trigger if exists trg_billing_queue_cancel_on_delete on public.addon_subscriptions;
create trigger trg_billing_queue_cancel_on_delete
  after delete on public.addon_subscriptions
  for each row execute function public.billing_queue_cancel_on_delete();

-- Copied from 20261008000000 (its last definition); the one added line is marked -- CHANGED (ask maths).
create or replace function public.consent_withdraw_account(p_parent uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  k uuid;
begin
  for k in select id from public.learners where created_by = p_parent loop
    perform public.delete_child_data(k, 'withdraw_consent_account');   -- FND-15: names its path
  end loop;
  update public.parental_consents set state = 'withdrawn', withdrawn_at = now()
   where parent_id = p_parent and state = 'granted';
  update public.parental_consents set state = 'expired'
   where parent_id = p_parent and state = 'pending';
  insert into public.billing_cancellations (stripe_subscription_id, queued_because) select stripe_subscription_id, 'consent_withdrawn' from public.subscriptions where account_id = p_parent and stripe_subscription_id is not null on conflict (stripe_subscription_id) do nothing;   -- CHANGED
  insert into public.billing_cancellations (stripe_subscription_id, queued_because) select stripe_subscription_id, 'consent_withdrawn' from public.addon_subscriptions where account_id = p_parent and stripe_subscription_id is not null on conflict (stripe_subscription_id) do nothing;   -- CHANGED (ask maths)
end
$$;
revoke all on function public.consent_withdraw_account(uuid) from public, anon, authenticated, service_role;

-- ── 4. 30 days, then gone (docs/legal/04 states the same number) ──────────────────────────────────────────────────
select cron.schedule('prune-ask-maths-questions', '52 3 * * *',
  $$with gone as (delete from public.ask_maths_questions where asked_at < now() - interval '30 days' returning 1)
    insert into public.deletion_log (path, actor_kind, row_counts)
    select 'retention', 'system', jsonb_build_object('ask_maths_questions', count(*)) from gone having count(*) > 0$$);

-- ── 5. Closing assertions — any failure rolls the whole file back ─────────────────────────────────────────────────
do $$
declare f text;
begin
  foreach f in array array['public.set_ask_maths(uuid,boolean,integer,text)', 'public.ask_maths_begin(uuid,text)',
                           'public.ask_maths_finish(uuid,text,jsonb)', 'public.ask_maths_forget(uuid)'] loop
    if not (select prosecdef from pg_proc where oid = f::regprocedure) then raise exception '% is not SECURITY DEFINER', f; end if;
    if has_function_privilege('anon', f, 'execute') then raise exception 'anon can execute %', f; end if;
  end loop;
  if has_function_privilege('authenticated', 'public.ask_maths_finish(uuid,text,jsonb)', 'execute') then
    raise exception 'authenticated can execute ask_maths_finish';
  end if;
  if not has_function_privilege('authenticated', 'public.ask_maths_begin(uuid,text)', 'execute') then
    raise exception 'authenticated cannot execute ask_maths_begin';
  end if;
  if has_table_privilege('authenticated', 'public.ask_maths_questions', 'insert')
     or has_table_privilege('authenticated', 'public.ask_maths_settings', 'update')
     or has_table_privilege('authenticated', 'public.addon_subscriptions', 'insert') then
    raise exception 'a browser can write an Ask maths table';
  end if;
end $$;
