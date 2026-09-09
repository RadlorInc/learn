-- ACCOUNT DELETION — the §11 promise, which until now had nothing behind it.
--
-- ⚠️⚠️ IT WAS NOT MERELY UN-SURFACED. IT WAS IMPOSSIBLE. `learners.created_by -> profiles` is
-- ON DELETE **RESTRICT**, and `profiles.id -> auth.users` is CASCADE — so deleting an auth.users
-- row for any parent who has ever added a child raises
--     update or delete on table "profiles" violates RESTRICT setting of
--     foreign key constraint "learners_created_by_fkey" on table "learners"
-- and the whole statement rolls back. Measured, not read: the auth user, the profile and the
-- learner were all still present afterwards. That RESTRICT is the reason no half-deleted family
-- exists today, and it is why this function deletes the learners FIRST, inside the same
-- transaction, rather than hoping a cascade will reach them.
--
-- ⚠️ ONE FUNCTION, THEREFORE ONE TRANSACTION. Every statement below commits together or not at
-- all. A partial failure is not a half-deleted family, it is an untouched account and an error the
-- parent can be told about — which is the only acceptable failure mode for this operation.
--
-- ⚠️ NO SOFT DELETE, NO GRACE WINDOW. Founder's call, and it is the point of the clause: "we kept
-- your child's data for another month after you asked us to delete it" is not a defence. There is
-- no `deleted_at`, nothing to restore from, and this function is the only caller-facing path.

create or replace function public.delete_my_account(p_confirm_email text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid     uuid := auth.uid();
  v_email   text := auth.jwt() ->> 'email';
  v_authed_at timestamptz;
  v_learners uuid[];
  v_counts  jsonb;
begin
  -- ── who ──────────────────────────────────────────────────────────────────────────────────────
  if v_uid is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;

  /**
   * ⚠️ RE-AUTHENTICATION, AND WHY IT IS THE TOKEN'S AGE RATHER THAN A PASSWORD PROMPT.
   *
   * The risk this defends against is specific: a child using a parent's signed-in device. A
   * password check cannot be the answer because half the accounts here sign in with Google and
   * have no password at all; an emailed code cannot be, because this project has no verified SMTP
   * sender and the default one is rate-limited to a couple of messages an hour.
   *
   * ⚠️⚠️ AND IT IS `amr`, NOT `iat`. This is the whole guard and getting it wrong would have left
   * the hole exactly where the risk is. supabase-js refreshes the access token on its own, roughly
   * hourly, and a refreshed token carries a BRAND NEW `iat` — so a family device that has simply
   * been left open mints a "fresh" token every hour without anybody proving anything. An `iat`
   * check would have been satisfied by a tablet sitting on a kitchen table.
   *
   * `amr` (Authentication Methods References) carries the moment the user actually authenticated,
   * with the method that did it, and a refresh does NOT move it. That is the claim that means
   * "this person proved who they are recently" rather than "this session is still alive".
   *
   * ⚠️ Absent `amr` is a REFUSAL, not a pass. An old or unusual token that does not carry the claim
   * cannot demonstrate recent authentication, so it must not be allowed to delete a family. The
   * parent signs in again and the new token has it. Fails closed.
   *
   * Ten minutes: long enough to read the page, take the export and think about it; far short of the
   * session a device has been carrying since yesterday.
   */
  select to_timestamp(max((e ->> 'timestamp')::bigint))
    into v_authed_at
    from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) e
   where e ? 'timestamp';

  if v_authed_at is null or v_authed_at < now() - interval '10 minutes' then
    raise exception 'reauth_required' using errcode = '42501';
  end if;

  -- ── and the deliberate typed thing, checked against the TOKEN's email, never a posted one ─────
  if v_email is null or lower(trim(coalesce(p_confirm_email, ''))) <> lower(v_email) then
    raise exception 'confirm_mismatch' using errcode = '22023';
  end if;

  -- ── what is about to go ──────────────────────────────────────────────────────────────────────
  -- OWNED learners only. A child this account was merely INVITED to view belongs to somebody else:
  -- their learner_access row goes (it cascades from profiles) but the child does not.
  select coalesce(array_agg(id), '{}') into v_learners
    from public.learners where created_by = v_uid;

  select jsonb_build_object(
    'learners',                 (select count(*) from public.learners            where id = any(v_learners)),
    'sessions',                 (select count(*) from public.sessions            where learner_id = any(v_learners)),
    'learner_progress',         (select count(*) from public.learner_progress    where learner_id = any(v_learners)),
    'learner_stats',            (select count(*) from public.learner_stats       where learner_id = any(v_learners)),
    'learner_state',            (select count(*) from public.learner_state       where learner_id = any(v_learners)),
    'learner_events',           (select count(*) from public.learner_events      where learner_id = any(v_learners)),
    'learner_access',           (select count(*) from public.learner_access      where learner_id = any(v_learners) or parent_id = v_uid),
    'learner_invites',          (select count(*) from public.learner_invites     where learner_id = any(v_learners) or invited_by = v_uid),
    'diagnostic_sessions',      (select count(*) from public.diagnostic_sessions where learner_id = any(v_learners)),
    'diagnostic_plans',         (select count(*) from public.diagnostic_plans    where learner_id = any(v_learners)),
    'diagnostic_rechecks',      (select count(*) from public.diagnostic_rechecks where learner_id = any(v_learners)),
    'diagnostic_items',         (select count(*) from public.diagnostic_items d
                                   join public.diagnostic_sessions s on s.id = d.session_id
                                  where s.learner_id = any(v_learners)),
    'diagnostic_plan_progress', (select count(*) from public.diagnostic_plan_progress pp
                                   join public.diagnostic_plans p on p.id = pp.plan_id
                                  where p.learner_id = any(v_learners)),
    'error_events',             (select count(*) from public.error_events        where learner_id = any(v_learners)),
    'grades',                   (select count(*) from public.grades              where created_by = v_uid),
    'subscriptions',            (select count(*) from public.subscriptions       where account_id = v_uid),
    'auth_events',              (select count(*) from public.auth_events         where user_id = v_uid)
  ) into v_counts;

  /**
   * ⚠️ error_events IS THE ONE TABLE WITH NO FOREIGN KEY TO learners, so nothing deletes it for us
   * and a cascade cannot reach it. Left alone it keeps a dangling learner_id — a reference to a
   * child who no longer exists — for up to 90 days until `prune-error-events` gets to it. That is
   * the only orphan this schema can produce, and it is closed here explicitly rather than by
   * adding an FK, because the rows are crash telemetry that must survive their learner in the
   * ORDINARY case (a learner deleted on its own) for a fault to stay diagnosable. Here the whole
   * account is going, so the link must go with it.
   */
  delete from public.error_events where learner_id = any(v_learners);

  -- The children, and with them everything keyed on learner_id: sessions, progress, stats, state,
  -- events, access, invites, diagnostic sessions (-> items, rechecks) and plans (-> plan progress).
  -- All CASCADE; `subscription_seats.learner_id` is SET NULL and the seat row itself goes with the
  -- subscription below.
  delete from public.learners where created_by = v_uid;

  /**
   * ⚠️ AND THE AUTH ROW LAST, IN THE SAME TRANSACTION. This cascades profiles, admin_users,
   * auth_events, grades (-> grade_chapters) and subscriptions (-> subscription_seats), and SETs
   * billing_events.account_id to NULL — see the migration comment and docs; billing_events is the
   * one thing that deliberately survives, stripped of who it belonged to.
   *
   * ⚠️ It is a DELETE on a MANAGED schema. It runs as this function's owner; if that role may not
   * delete from auth.users the exception aborts the whole transaction and NOTHING above is
   * committed, which is the correct way for this to fail.
   */
  delete from auth.users where id = v_uid;

  return v_counts;
end;
$$;

comment on function public.delete_my_account(text) is
  'Permanently deletes the calling account and every learner it owns, in one transaction. Requires a token issued within 10 minutes and the account email typed back. No soft delete.';

-- ⚠️ `authenticated` ONLY, and never `anon`. The function derives its subject from auth.uid(), so a
-- caller can only ever delete themselves — but an anon grant would still be an unauthenticated
-- entry point into a DEFINER function, which is the shape this repo has already been bitten by.
revoke all on function public.delete_my_account(text) from public, anon;
grant execute on function public.delete_my_account(text) to authenticated;
