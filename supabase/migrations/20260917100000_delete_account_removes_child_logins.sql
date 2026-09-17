-- Closing an account now also removes the children's own logins (founder, 2026-09-17).
--
-- ⚠️⚠️ SECURITY CHANGE, CALLED OUT DELIBERATELY: this REDEFINES `delete_my_account`, a SECURITY DEFINER function.
-- The definer status, `search_path`, signature and grants are UNCHANGED. The body is production's
-- (md5(prosrc) = afa5cfcccf412559af196909e9364128 measured 2026-09-17, identical to 20260905160000) with exactly
-- FOUR named changes:
--   1. a new variable `v_child_logins uuid[]`;
--   2. it collects the auth accounts linked to the caller's own learners with access_role 'self', excluding any
--      account that has a non-self access row, has created a learner, or is the caller — so it can reach only a
--      child's login, never an adult;
--   3. it reports how many as `child_logins`;
--   4. it deletes those auth rows (cascading their profile and 'self' rows) in the same transaction, just before the
--      caller's own auth row.
--
-- Before this, deleting an account removed the children but left each child's login behind — an account that could
-- still sign in (to nothing) and still carried the child's name. Deleting ONE learner from the dashboard already
-- removed its login first, via /api/child-login.

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
  v_child_logins uuid[];
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

  -- The children's OWN login accounts (access_role 'self', written only by /api/child-login). Guarded so this can
  -- only ever reach a child's login: an account with any non-self access row, or that created a learner, is an
  -- adult's and is never touched — and never this caller.
  select coalesce(array_agg(distinct la.parent_id), '{}') into v_child_logins
    from public.learner_access la
   where la.access_role = 'self' and la.learner_id = any(v_learners) and la.parent_id <> v_uid
     and not exists (select 1 from public.learner_access o where o.parent_id = la.parent_id and o.access_role <> 'self')
     and not exists (select 1 from public.learners c where c.created_by = la.parent_id);

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
    'auth_events',              (select count(*) from public.auth_events         where user_id = v_uid),
    'child_logins',             coalesce(array_length(v_child_logins, 1), 0)
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
  delete from auth.users where id = any(v_child_logins);   -- cascades their profile and 'self' access rows
  delete from auth.users where id = v_uid;

  return v_counts;
end;
$$;
