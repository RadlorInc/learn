-- ─────────────────────────────────────────────────────────────────────────────
--  RLS REGRESSION SUITE  (security guardrail — Tier 1)
--
--  Proves the row-level-security boundary actually DENIES a cross-tenant attacker.
--  Every prior test in this repo checks "does the happy path work"; none checked
--  "is the WRONG user rejected". That blind spot is exactly how V1 (the forged-invite
--  privilege escalation) shipped. This suite is the standing guard against its return.
--
--  It impersonates two real users via `set local role authenticated` + a synthetic
--  `request.jwt.claims` (so auth.uid()/auth.jwt() reflect each user), then asserts:
--    - an attacker CANNOT read / grant / forge access to a learner they don't own
--    - the legitimate owner still CAN (so RLS isn't just deny-all)
--
--  Everything runs inside a transaction that ROLLS BACK — nothing is persisted. A failed
--  assertion RAISEs, so under `psql -v ON_ERROR_STOP=1` the process exits non-zero (CI-ready).
--
--  Run:  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_regression.sql
--        (point SUPABASE_DB_URL at a TEST/branch database, never prod.)
-- ─────────────────────────────────────────────────────────────────────────────
begin;

do $$
declare
  v_owner    uuid := gen_random_uuid();
  v_attacker uuid := gen_random_uuid();
  v_learner  uuid := gen_random_uuid();
  v_alearner uuid := gen_random_uuid();   -- a learner the attacker legitimately owns
  v_invite   uuid := gen_random_uuid();   -- an invite addressed to the attacker's own email
  v_chapter  text;
  v_cnt      int;
  v_blocked  boolean;
begin
  -- ── Setup (as the migration role; RLS bypassed here) ──────────────────────
  select id into v_chapter from public.chapters limit 1;   -- a real chapter (sessions.chapter is FK'd)

  insert into auth.users (id, email) values
    (v_owner,    'owner.rlstest@milo.invalid'),
    (v_attacker, 'attacker.rlstest@milo.invalid');

  -- Owner creates a learner. The grant_owner_access trigger gives the owner a
  -- learner_access row; init_learner_stats seeds learner_stats.
  insert into public.learners (id, display_name, created_by)
    values (v_learner, 'RLS Test Kid', v_owner);

  insert into public.sessions (learner_id, chapter, phase, correct_count, wrong_count,
                               stars_earned, xp_earned, coins_earned, client_id)
    values (v_learner, v_chapter, 'practice', 5, 1, 3, 200, 15, gen_random_uuid()::text);

  -- Attacker owns their OWN learner and has a legit pending invite to their own email for it —
  -- the raw material for the V12 repoint exploit (rewrite this invite to point at the victim).
  insert into public.learners (id, display_name, created_by)
    values (v_alearner, 'Attacker Kid', v_attacker);
  insert into public.learner_invites (id, learner_id, invited_by, invited_email, status, expires_at)
    values (v_invite, v_alearner, v_attacker, 'attacker.rlstest@milo.invalid', 'pending', now() + interval '7 days');

  -- ── Impersonate the ATTACKER ──────────────────────────────────────────────
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_attacker, 'email', 'attacker.rlstest@milo.invalid', 'role', 'authenticated')::text, true);

  -- A1: attacker cannot SEE a learner they don't own.
  select count(*) into v_cnt from public.learners where id = v_learner;
  if v_cnt <> 0 then raise exception 'RLS FAIL A1: attacker read a learner they do not own (% rows)', v_cnt; end if;

  -- A2 (V1 regression): attacker cannot FORGE an invite for a learner they don't own.
  v_blocked := false;
  begin
    insert into public.learner_invites (learner_id, invited_by, invited_email)
      values (v_learner, v_attacker, 'attacker.rlstest@milo.invalid');
  exception when insufficient_privilege or check_violation then v_blocked := true;
  end;
  if not v_blocked then raise exception 'RLS FAIL A2: attacker forged an invite for a learner they do not own (V1 escalation is back!)'; end if;

  -- A3: attacker cannot self-grant learner_access.
  v_blocked := false;
  begin
    insert into public.learner_access (learner_id, parent_id, access_role)
      values (v_learner, v_attacker, 'viewer');
  exception when insufficient_privilege or check_violation then v_blocked := true;
  end;
  if not v_blocked then raise exception 'RLS FAIL A3: attacker self-granted access to a learner they do not own'; end if;

  -- A6 (V12 regression): the recipient of an invite cannot REPOINT it. The accept flow only flips
  -- status; column-level GRANT(status) must make rewriting learner_id / invited_by fail. Without the
  -- fix this UPDATE succeeds and re-opens the V1 self-grant path via can_self_grant_access().
  v_blocked := false;
  begin
    update public.learner_invites
       set learner_id = v_learner, invited_by = v_owner, expires_at = now() + interval '30 days'
     where id = v_invite;
  exception when insufficient_privilege or check_violation then v_blocked := true;
  end;
  if not v_blocked then raise exception 'RLS FAIL A6: recipient repointed an invite''s learner_id/invited_by (V12 → V1 self-grant path is back!)'; end if;

  -- A6b: the addressee CAN still flip status (accept must keep working).
  update public.learner_invites set status = 'accepted' where id = v_invite;
  select count(*) into v_cnt from public.learner_invites where id = v_invite and status = 'accepted';
  if v_cnt <> 1 then raise exception 'RLS FAIL A6b: recipient can no longer accept their own invite (% rows)', v_cnt; end if;

  -- A4/A5: attacker cannot read the learner's sessions or stats.
  select count(*) into v_cnt from public.sessions where learner_id = v_learner;
  if v_cnt <> 0 then raise exception 'RLS FAIL A4: attacker read another learner''s sessions (% rows)', v_cnt; end if;
  select count(*) into v_cnt from public.learner_stats where learner_id = v_learner;
  if v_cnt <> 0 then raise exception 'RLS FAIL A5: attacker read another learner''s stats (% rows)', v_cnt; end if;

  -- ── Impersonate the OWNER (positive control — RLS is scoped, not deny-all) ─
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_owner, 'email', 'owner.rlstest@milo.invalid', 'role', 'authenticated')::text, true);

  select count(*) into v_cnt from public.learners where id = v_learner;
  if v_cnt <> 1 then raise exception 'RLS FAIL O1: owner cannot see their OWN learner (% rows)', v_cnt; end if;
  select count(*) into v_cnt from public.sessions where learner_id = v_learner;
  if v_cnt <> 1 then raise exception 'RLS FAIL O2: owner cannot see their OWN learner''s sessions (% rows)', v_cnt; end if;

  reset role;
  raise notice 'RLS REGRESSION SUITE: ALL ASSERTIONS PASSED';
end $$;

rollback;
