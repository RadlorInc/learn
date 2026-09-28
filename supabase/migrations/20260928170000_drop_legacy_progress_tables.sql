-- Drop the legacy progress tables: learner_progress, learner_stats and learner_state (the chapter/XP economy the app
-- stopped writing on 2026-09-20; emptied or zeroed on 2026-09-17), with every function that still names them. `sessions`
-- stays, read-only: /admin's funnel and learning metrics are built on it, and redefining those is a separate decision.
--
-- What goes:
--   · tables learner_progress, learner_stats, learner_state (their policies, triggers and consent-gate triggers with them);
--   · SECURITY DEFINER functions sync_session (11 and 12 arguments), sync_diagnostic, init_learner_stats (and its trigger
--     on learners), and the INVOKER sync_session(10 arguments) forwarder, get_learner_bootstrap, get_insights_rollup.
--     No app code calls any of them (the app records progress through record_lesson_progress);
--   · on sessions: the policy "sessions: parent can insert", and INSERT/UPDATE/DELETE for anon and authenticated.
-- What is redefined (pg_get_functiondef output with named lines removed, nothing retyped):
--   · delete_my_account(text): the three row counts for the dropped tables, and one comment line;
--   · get_parent_dashboard(): its 'stats' and 'progress' keys. An app bundle from before this migration reads both with
--     defaults (`?? null`, `?? []`), so it keeps working.
--
-- DEPLOY ORDER: either; app first preferred. The app half of this PR stops reading the three tables. A bundle from
-- before it still works: the dashboard RPC answers without the two keys, and its per-table reads (the dashboard's
-- fallback, the account page, the export) get an error they already treat as "nothing there".
--
-- SECURITY CHANGE: SECURITY DEFINER functions dropped (sync_session x2, sync_diagnostic, init_learner_stats) and one
-- redefined with DEFINER and `search_path = public` unchanged (delete_my_account; its grants are untouched by
-- `create or replace`). A policy dropped and table privileges revoked on public.sessions.
--
-- Rollback: restore the three tables from the pre-migration backup (migrate-prod takes one), then re-apply the dropped
-- definitions from 20260905120000 / 20260905140000 / the baseline. The data was the retired economy's.

drop trigger if exists on_learner_created_stats on public.learners;
drop function if exists public.init_learner_stats();

drop function if exists public.sync_session(uuid, text, text, integer, integer, integer, integer, integer, text, timestamptz);
drop function if exists public.sync_session(uuid, text, text, integer, integer, integer, integer, integer, text, timestamptz, integer);
drop function if exists public.sync_session(uuid, text, text, integer, integer, integer, integer, integer, text, timestamptz, integer, timestamptz);
drop function if exists public.sync_diagnostic(uuid, text, text, text, text[], text[], text, text[], text[], jsonb, uuid);
drop function if exists public.get_learner_bootstrap(uuid);
drop function if exists public.get_insights_rollup(timestamptz);

CREATE OR REPLACE FUNCTION public.get_parent_dashboard()
 RETURNS json
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select coalesce(json_agg(obj order by ord asc), '[]'::json)
  from (
    select
      l.created_at as ord,
      json_build_object(
        'learner',  to_json(l),
        'role',     la.access_role,
        'sessions', (select coalesce(json_agg(x), '[]'::json)
                     from (select se.* from public.sessions se
                           where se.learner_id = l.id
                           -- ⚠️ CHANGED: was `se.started_at desc nulls last`.
                           order by coalesce(se.completed_at, se.started_at) desc nulls last
                           limit 3) x)
      ) as obj
    from public.learner_access la
    join public.learners l on l.id = la.learner_id
    where la.parent_id = (select auth.uid())
  ) t;
$function$;

CREATE OR REPLACE FUNCTION public.delete_my_account(p_confirm_email text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- The children, and with them everything keyed on learner_id: sessions,
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

  -- FND-15: the record, in the same transaction. v_counts is the census above, taken before anything went.
  insert into public.deletion_log (path, actor_kind, actor_id, account_id, learner_ids, row_counts)   -- FND-15
  values ('close_account', 'user', v_uid, v_uid, v_learners, v_counts);                              -- FND-15

  return v_counts;
end;
$function$;

drop table public.learner_state;
drop table public.learner_stats;
drop table public.learner_progress;

drop policy if exists "sessions: parent can insert" on public.sessions;
revoke insert, update, delete on public.sessions from anon, authenticated;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public'
             and table_name in ('learner_progress', 'learner_stats', 'learner_state')) then
    raise exception 'a legacy progress table survived';
  end if;
  -- Nothing left in public that names them (a plpgsql body is not dependency-tracked, so it would fail only when called).
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.prosrc ~ '\mlearner_(progress|stats|state)\M') then
    raise exception 'a function in public still names a dropped table';
  end if;
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname in ('sync_session', 'sync_diagnostic', 'init_learner_stats',
                                                          'get_learner_bootstrap', 'get_insights_rollup')) then
    raise exception 'a legacy function survived';
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'sessions'
             and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')) then
    raise exception 'sessions still has a policy that admits a write';
  end if;
  if has_table_privilege('authenticated', 'public.sessions', 'INSERT') or has_table_privilege('authenticated', 'public.sessions', 'UPDATE')
     or has_table_privilege('authenticated', 'public.sessions', 'DELETE') or has_table_privilege('anon', 'public.sessions', 'INSERT') then
    raise exception 'a client role can still write sessions';
  end if;
  -- The paired halves: what the app still uses is still there, as it was.
  if not has_table_privilege('authenticated', 'public.sessions', 'SELECT') then
    raise exception 'authenticated lost SELECT on sessions';
  end if;
  if not (select prosecdef and proconfig = array['search_path=public'] from pg_proc
          where oid = 'public.delete_my_account(text)'::regprocedure) then
    raise exception 'delete_my_account is no longer SECURITY DEFINER with search_path=public';
  end if;
  if not has_function_privilege('authenticated', 'public.delete_my_account(text)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.get_parent_dashboard()', 'EXECUTE') then
    raise exception 'authenticated can no longer call delete_my_account or get_parent_dashboard';
  end if;
end $$;
