-- ════════════════════════════════════════════════════════════════════════════════════════════════
-- WITHDRAWAL DELETES — and one deletion, used by both paths that delete a child.
--
-- ⚠️⚠️ DEPLOY ORDER: CLIENT FIRST, THIS MIGRATION SECOND. The parent dashboard calls the new
-- `delete_learner` RPC and falls back to the old two-step path on PGRST202 (function not found), so
-- the client works against either schema. This file also REQUIRES 20260923120000 and 20260923130000
-- (the consent tables), and inherits their deploy order: see docs/legal/LOOP-STATE.md, item 9.
--
-- ⚠️ IT DELETES PRODUCTION DATA WHEN APPLIED: §1 removes the crash records whose child no longer
-- exists (three rows, measured read-only 2026-09-23). Applying is Rafi's step, never this loop's.
--
-- Documents 03 and 06 promise that withdrawing permission deletes what we hold about the child.
-- Until this file, withdrawal stopped collection and deleted nothing. docs/legal/06 Part B3 lists
-- the tables: learners, learner_access, lesson_progress, point_events, learner_stats,
-- learner_events, lesson_feedback, game_settings and error_events. Every one but error_events
-- already cascades from learners (measured on production 2026-09-23); §1 closes that one.
-- ════════════════════════════════════════════════════════════════════════════════════════════════

-- ── 1. error_events: the one child table with no foreign key ─────────────────────────────────────
/**
 * ⚠️ THIS REVERSES A RECORDED DECISION, ON INSTRUCTION. `delete_my_account` says crash records were
 * left without a foreign key on purpose, "so a fault stays diagnosable" after a single child is
 * deleted. Documents 06 and 04 now say the opposite — a crash record carries the child's id, so it
 * is information about the child and goes when the child goes — and the founder's brief for this
 * loop asks for the key. A crash about a child who no longer exists is kept by nothing but habit.
 *
 * The orphans must go first or the constraint cannot be added. The consent gate already refuses a
 * crash row for a learner that does not exist (consent_ok is false for an unknown id), so the key
 * adds no new way for a crash report to fail.
 */
delete from public.error_events e
 where e.learner_id is not null
   and not exists (select 1 from public.learners l where l.id = e.learner_id);

alter table public.error_events
  add constraint error_events_learner_id_fkey
  foreign key (learner_id) references public.learners(id) on delete cascade;

-- ── 2. The consent record outlives the child it covered ──────────────────────────────────────────
/**
 * It cascaded from learners, so deleting a child deleted the one record that says a parent agreed —
 * or withdrew. Document 06: "mark the consent record as withdrawn with a timestamp", i.e. keep it.
 * Now the link is cleared and the record stays, `withdrawn`, with who, when and which notice.
 */
alter table public.parental_consents drop constraint parental_consents_learner_id_fkey;
alter table public.parental_consents
  add constraint parental_consents_learner_id_fkey
  foreign key (learner_id) references public.learners(id) on delete set null;

-- The guard forbade ever changing learner_id once set. Clearing it is now allowed in exactly one
-- case: the child it pointed at no longer exists (the SET NULL above, firing inside the delete).
-- Copied from 20260923130000; the changed lines are the learner_id block only.
create or replace function public.consent_guard_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  -- ⚠️ WHAT THE PARENT SAW IS FIXED AT THE MOMENT THEY SAW IT. If the notice changes between the
  -- request email and the click, the record must still say which one they read — so no later write,
  -- by any role, may touch these. A structure, not a convention: nothing to remember at grant time.
  if new.parent_id       is distinct from old.parent_id
  or new.method          is distinct from old.method
  or new.notice_version  is distinct from old.notice_version
  or new.privacy_version is distinct from old.privacy_version
  or new.terms_version   is distinct from old.terms_version
  or new.lang            is distinct from old.lang
  or new.email_address   is distinct from old.email_address
  or new.requested_at    is distinct from old.requested_at
  or new.token_hash      is distinct from old.token_hash
  or new.expires_at      is distinct from old.expires_at then
    raise exception 'a parental consent''s identity, versions and address are fixed once recorded'
      using errcode = 'P0C02';
  end if;

  -- The child it covers is written once, by consent_bind_learner, and never re-pointed — only
  -- cleared, when that child has been deleted.
  if old.learner_id is not null and new.learner_id is distinct from old.learner_id
     and not (new.learner_id is null
              and not exists (select 1 from public.learners l where l.id = old.learner_id)) then
    raise exception 'a parental consent cannot be moved to a different child' using errcode = 'P0C02';
  end if;

  -- The only moves that mean something. declined, withdrawn and expired are terminal: a withdrawn
  -- consent re-granted by a later write would silently undo the one action a parent is promised.
  if new.state is distinct from old.state and not (
       (old.state = 'pending' and new.state in ('granted', 'declined', 'expired'))
    or (old.state = 'granted' and new.state = 'withdrawn')
  ) then
    raise exception 'parental consent cannot move from % to %', old.state, new.state
      using errcode = 'P0C02';
  end if;
  return new;
end
$$;
revoke all on function public.consent_guard_update() from public, anon, authenticated;

-- ── 3. ONE deletion, for both paths ──────────────────────────────────────────────────────────────
/**
 * Everything about one child: their own sign-in account (guarded exactly as delete_my_account
 * guards it — only a 'self' login that is nobody's adult account), their consent ended, then the
 * learner row, which cascades every table in document 06's list, error_events included since §1.
 *
 * ⚠️ A granted consent is ENDED here (→ withdrawn). Left `granted` with its child gone it would look
 * unused, and the add-a-child flow reuses an unused granted consent — so deleting a child would have
 * silently pre-authorised the next one.
 *
 * Internal: callable only by the two functions below, never from the API.
 */
create or replace function public.delete_child_data(p_learner_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_logins uuid[];
begin
  select coalesce(array_agg(distinct la.parent_id), '{}') into v_logins
    from public.learner_access la
   where la.access_role = 'self' and la.learner_id = p_learner_id
     and not exists (select 1 from public.learner_access o where o.parent_id = la.parent_id and o.access_role <> 'self')
     and not exists (select 1 from public.learners c where c.created_by = la.parent_id);

  update public.parental_consents set state = 'withdrawn', withdrawn_at = now()
   where learner_id = p_learner_id and state = 'granted';

  delete from public.learners where id = p_learner_id;
  delete from auth.users where id = any(v_logins);
end
$$;
revoke all on function public.delete_child_data(uuid) from public, anon, authenticated, service_role;

/** The dashboard's "Delete <name>'s profile". Owner only; the same set as withdrawal. */
create or replace function public.delete_learner(p_learner_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  if not exists (select 1 from public.learner_access
                  where learner_id = p_learner_id and parent_id = auth.uid() and access_role = 'owner') then
    raise exception 'not_owner' using errcode = '42501';
  end if;
  perform public.delete_child_data(p_learner_id);
end
$$;
revoke all on function public.delete_learner(uuid) from public, anon;
grant execute on function public.delete_learner(uuid) to authenticated;

-- ── 4. Withdraw now deletes ──────────────────────────────────────────────────────────────────────
/**
 * Copied from 20260923130000. Changed lines: this comment, and the `perform` before the return.
 * Withdraw. From `granted` only — withdrawing a request that was never granted is declining it, and
 * the record keeps the difference. The record is kept (§2); the child and everything about them go.
 *
 * ⚠️ WHAT THIS STILL DOES NOT DO, AND DOCUMENTS 03 AND 06 SAY: close the parent's account, or delete
 * the account's OTHER children. That is blocked on the attorney (docs/legal/LOOP-STATE.md, item 6):
 * closing the account deletes the consent records, which are the only evidence of what was agreed.
 */
create or replace function public.consent_withdraw(p_token_hash text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r public.parental_consents;
begin
  select * into r from public.parental_consents where token_hash = p_token_hash for update;
  if not found then return 'unknown'; end if;
  if r.state <> 'granted' then return r.state; end if;
  update public.parental_consents set state = 'withdrawn', withdrawn_at = now() where id = r.id;
  if r.learner_id is not null then perform public.delete_child_data(r.learner_id); end if;
  return 'withdrawn';
end
$$;
