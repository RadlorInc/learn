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
  v_direct   boolean;                     -- did the DIRECT (policy) write path allow it?
  v_rpc      boolean;                     -- did the sync_session RPC allow it?
  v_learner2 uuid := gen_random_uuid();   -- a second learner the OWNER created (a seat to move to)
  v_learner3 uuid := gen_random_uuid();   -- a third, for the second reassignment in one period
  v_subid    uuid := gen_random_uuid();
  v_seat1    uuid := gen_random_uuid();   -- occupied by v_learner
  v_seat2    uuid := gen_random_uuid();   -- empty
  v_free     text;                        -- a chapter with is_free = true
  v_paid     text;                        -- a chapter with is_free = false
  v_n        int;
  v_paids    text[];                     -- four chapters that are NOT in the fixed free set
  v_sess     uuid;
  v_ok       boolean;
  -- ⚠️ COUNTS THE ASSERTIONS THAT ACTUALLY RAN, and CI fails if the number is missing or 0.
  -- A test file that is never reached, or is silently emptied, is indistinguishable from a
  -- passing one from outside — which is exactly how `rls-tests` reported success for weeks
  -- while executing nothing at all. The count is the evidence.
  v_asserts  int := 0;
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

  -- ── Billing setup (Stage 1) ───────────────────────────────────────────────
  -- ⚠️⚠️ THE PAYWALL SHIPS **OFF** AND THIS SUITE MUST TURN IT ON. `billing_config.enforced`
  -- defaults false so the migration can be applied to a production with no subscriptions without
  -- stopping 65 chapters from saving. A suite that inherited that default would exercise the
  -- not-enforced short-circuit on every entitlement case and pass — testing a paywall that does
  -- nothing. Third time today this shape has appeared: the CI job that skipped and reported
  -- success, the bundle grep that could not have found the key, and the failure-text read that ran
  -- before the screen existed.
  update public.billing_config set enforced = true;
  -- …and SAY SO, rather than trusting the line above to still be here. If it is ever removed, the
  -- entitlement cases below would all pass vacuously; this is the one that would not.
  select enforced into v_blocked from public.billing_config;
  v_asserts := v_asserts + 1;
  if not coalesce(v_blocked, false) then
    raise exception 'RLS FAIL F0: the suite is running with the paywall OFF — every entitlement assertion below is vacuous';
  end if;

  -- Still the migration role, so RLS is bypassed. That is the ONLY way these rows can exist: there
  -- is no INSERT policy on either billing table, which is itself asserted below (B3, B9).
  select id into v_free from public.chapters where is_free      order by sort_order limit 1;
  select id into v_paid from public.chapters where not is_free  order by sort_order limit 1;
  -- B0 (fixture positive control): if the free set were empty — or everything were free — every
  -- entitlement assertion below would pass while testing nothing. The fixture is checked first.
  v_asserts := v_asserts + 1;
  if v_free is null or v_paid is null then
    raise exception 'RLS FAIL B0: chapters has no free/paid split (free=%, paid=%)', v_free, v_paid;
  end if;

  insert into public.learners (id, display_name, created_by) values
    (v_learner2, 'RLS Test Kid 2', v_owner),
    (v_learner3, 'RLS Test Kid 3', v_owner);

  insert into public.subscriptions (id, account_id, status, seats_paid,
                                    current_period_start, current_period_end)
    values (v_subid, v_owner, 'active', 2, now() - interval '10 days', now() + interval '20 days');
  insert into public.subscription_seats (id, subscription_id, seat_index, learner_id, assigned_at)
    values (v_seat1, v_subid, 1, v_learner, now()),
           (v_seat2, v_subid, 2, null,      null);

  -- ── Impersonate the ATTACKER ──────────────────────────────────────────────
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_attacker, 'email', 'attacker.rlstest@milo.invalid', 'role', 'authenticated')::text, true);

  -- A1: attacker cannot SEE a learner they don't own.
  select count(*) into v_cnt from public.learners where id = v_learner;
  v_asserts := v_asserts + 1;
  if v_cnt <> 0 then raise exception 'RLS FAIL A1: attacker read a learner they do not own (% rows)', v_cnt; end if;

  -- A2 (V1 regression): attacker cannot FORGE an invite for a learner they don't own.
  v_blocked := false;
  begin
    insert into public.learner_invites (learner_id, invited_by, invited_email)
      values (v_learner, v_attacker, 'attacker.rlstest@milo.invalid');
  exception when insufficient_privilege or check_violation then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL A2: attacker forged an invite for a learner they do not own (V1 escalation is back!)'; end if;

  -- A3: attacker cannot self-grant learner_access.
  v_blocked := false;
  begin
    insert into public.learner_access (learner_id, parent_id, access_role)
      values (v_learner, v_attacker, 'viewer');
  exception when insufficient_privilege or check_violation then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
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
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL A6: recipient repointed an invite''s learner_id/invited_by (V12 → V1 self-grant path is back!)'; end if;

  -- A6b: the addressee CAN still flip status (accept must keep working).
  update public.learner_invites set status = 'accepted' where id = v_invite;
  select count(*) into v_cnt from public.learner_invites where id = v_invite and status = 'accepted';
  v_asserts := v_asserts + 1;
  if v_cnt <> 1 then raise exception 'RLS FAIL A6b: recipient can no longer accept their own invite (% rows)', v_cnt; end if;

  -- A7 (auth_events, 2026-07-21): the account-access log is WRITE-ONLY from the API.
  -- A7a: nobody can READ it — not even their own rows (reads are dashboard/service-role only).
  v_blocked := false;
  begin
    perform * from public.auth_events limit 1;
  exception when insufficient_privilege then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL A7a: authenticated user can read auth_events'; end if;
  -- A7b: cannot log an event AS ANOTHER USER (forging someone's login history).
  v_blocked := false;
  begin
    insert into public.auth_events (user_id, event) values (v_owner, 'login');
  exception when insufficient_privilege then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL A7b: attacker inserted an auth event for another user'; end if;
  -- A7c (positive control): logging your OWN event works — else the feature is dead.
  -- ⚠️ It used to be a bare INSERT with nothing checking it: an unasserted statement is not a
  -- test, it is a statement. Asserted now, so it also counts toward v_asserts.
  insert into public.auth_events (user_id, event, client_id) values (v_attacker, 'login', gen_random_uuid());
  get diagnostics v_cnt = row_count;
  v_asserts := v_asserts + 1;
  if v_cnt <> 1 then raise exception 'RLS FAIL A7c: a user could not log their OWN auth event'; end if;

  -- A8 (V16/V19, 2026-08-17): the crash log is service-role only, and cannot be wiped from the API.
  -- A8a: nobody reads error_events — it holds url/ua/stack/learner_id, i.e. child-linked telemetry.
  v_blocked := false;
  begin
    perform * from public.error_events limit 1;
  exception when insufficient_privilege then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL A8a: authenticated user can read error_events'; end if;
  -- A8b: nor writes to it (RLS on with ZERO policies; the sink uses the service-role key).
  v_blocked := false;
  begin
    insert into public.error_events (at, source, message) values (now(), 'client', 'rls-probe');
  exception when insufficient_privilege then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL A8b: authenticated user wrote to error_events'; end if;
  -- A8c (V19 regression): the retention function must NOT be reachable from the API. Postgres
  -- creates a SECURITY DEFINER function with PUBLIC EXECUTE, and Supabase exposes every
  -- public-schema function at /rest/v1/rpc/<name> — so without the REVOKE, anyone could wipe the
  -- crash log on demand. This assertion is the only thing standing between that and a silent regress.
  v_blocked := false;
  begin
    perform public.prune_error_events();
  exception when insufficient_privilege then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL A8c: prune_error_events is callable from the API (V19 is back — the crash log can be wiped)'; end if;

  -- A9 (V13, 2026-08-17): the lead table is write-only and shape-checked.
  -- A9a: lead emails are never readable from the API.
  v_blocked := false;
  begin
    perform * from public.diagnostic_leads limit 1;
  exception when insufficient_privilege then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL A9a: lead emails are readable from the API'; end if;
  -- A9b: a non-email is rejected. The original policy bounded LENGTH only, so every 3-character
  -- string was a valid lead; the shape check is what makes the table mean anything.
  v_blocked := false;
  begin
    insert into public.diagnostic_leads (email) values ('abc');
  exception when insufficient_privilege or check_violation then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL A9b: a non-email was accepted as a lead'; end if;

  -- A4/A5: attacker cannot read the learner's sessions or stats.
  select count(*) into v_cnt from public.sessions where learner_id = v_learner;
  v_asserts := v_asserts + 1;
  if v_cnt <> 0 then raise exception 'RLS FAIL A4: attacker read another learner''s sessions (% rows)', v_cnt; end if;
  select count(*) into v_cnt from public.learner_stats where learner_id = v_learner;
  v_asserts := v_asserts + 1;
  if v_cnt <> 0 then raise exception 'RLS FAIL A5: attacker read another learner''s stats (% rows)', v_cnt; end if;


  -- ═══ BILLING (Stage 1) — the attacker's half ═══════════════════════════════
  -- The attacker has NO subscription and owns v_alearner, so they are the unentitled case.

  -- F1: nobody can WRITE the switch. A client that can set `enforced = false` has turned the
  -- paywall off for the entire product, for everybody, in one statement.
  v_blocked := false;
  begin
    update public.billing_config set enforced = false;
  exception when insufficient_privilege then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL F1: a client disabled the paywall'; end if;

  -- F2: nor read it. Zero policies, no grant — the error_events precedent.
  v_blocked := false;
  begin
    perform * from public.billing_config limit 1;
  exception when insufficient_privilege then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL F2: authenticated user can read billing_config'; end if;

  -- B1: a stranger cannot read another account's subscription.
  select count(*) into v_cnt from public.subscriptions where account_id = v_owner;
  v_asserts := v_asserts + 1;
  if v_cnt <> 0 then raise exception 'RLS FAIL B1: attacker read another account''s subscription (% rows)', v_cnt; end if;

  -- B6: billing_events is unreadable. It carries Stripe customer ids and amounts — account-level
  -- financial data with no reason to reach a browser. RLS on, ZERO policies (error_events precedent).
  v_blocked := false;
  begin
    perform * from public.billing_events limit 1;
  exception when insufficient_privilege then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL B6: authenticated user can read billing_events'; end if;

  -- B7: nor writable — a forged webhook row is a forged subscription.
  v_blocked := false;
  begin
    insert into public.billing_events (stripe_event_id, type) values ('evt_rls_probe', 'probe');
  exception when insufficient_privilege then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL B7: authenticated user wrote to billing_events'; end if;

  -- B8: a stranger cannot read another account's seats (who is in them is family information).
  select count(*) into v_cnt from public.subscription_seats where subscription_id = v_subid;
  v_asserts := v_asserts + 1;
  if v_cnt <> 0 then raise exception 'RLS FAIL B8: attacker read another account''s seats (% rows)', v_cnt; end if;

  -- B9: nobody can INSERT a seat. A seat a parent can create is a seat nobody paid for.
  v_blocked := false;
  begin
    insert into public.subscription_seats (subscription_id, seat_index, learner_id)
      values (v_subid, 3, v_alearner);
  exception when insufficient_privilege then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL B9: a seat was created from the API (capacity is decided by Stripe, not by the client)'; end if;

  -- B10: nor UPDATE one directly — reassignment must go through reassign_learner_seat, which is
  -- where the one-per-billing-period rule lives. A direct UPDATE would route around it entirely.
  v_blocked := false;
  begin
    update public.subscription_seats set learner_id = v_alearner where id = v_seat2;
  exception when insufficient_privilege then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL B10: a seat was reassigned by direct UPDATE, bypassing the period limit'; end if;

  -- B11: the entitlement guard on the DIRECT write paths, both directions.
  -- B11a: a FREE chapter records for a learner with no subscription at all (positive control — the
  -- guard must be scoped, not deny-all, or the free tier does not exist).
  insert into public.sessions (learner_id, chapter, phase, correct_count, wrong_count,
                               stars_earned, xp_earned, coins_earned, client_id)
    values (v_alearner, v_free, 'practice', 1, 0, 1, 10, 5, gen_random_uuid()::text);
  get diagnostics v_cnt = row_count;
  v_asserts := v_asserts + 1;
  if v_cnt <> 1 then raise exception 'RLS FAIL B11a: a FREE chapter could not be recorded without a subscription'; end if;

  -- B11b: a PAID chapter does not.
  v_blocked := false;
  begin
    insert into public.sessions (learner_id, chapter, phase, correct_count, wrong_count,
                                 stars_earned, xp_earned, coins_earned, client_id)
      values (v_alearner, v_paid, 'practice', 1, 0, 1, 10, 5, gen_random_uuid()::text);
  exception when insufficient_privilege or check_violation then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL B11b: an unentitled chapter was recorded to sessions'; end if;

  -- B11c: learner_progress carries the same guard — it is a second write path to the same record,
  -- and the app writes it directly on the local-first merge, not only through the RPC.
  v_blocked := false;
  begin
    insert into public.learner_progress (learner_id, chapter, best_stars, total_xp, total_sessions)
      values (v_alearner, v_paid, 1, 10, 1);
  exception when insufficient_privilege or check_violation then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL B11c: an unentitled chapter was recorded to learner_progress'; end if;

  -- B11d: reading is NOT gated. A lapsed subscriber keeps their child's history; the product
  -- refuses to hold a record hostage to a card failure. This asserts the guard did not creep into
  -- USING, which is the easy mistake when adding it to a `for all` policy.
  select count(*) into v_cnt from public.sessions where learner_id = v_alearner and chapter = v_free;
  v_asserts := v_asserts + 1;
  if v_cnt <> 1 then raise exception 'RLS FAIL B11d: the entitlement guard leaked into the READ path (% rows)', v_cnt; end if;

  -- ═══ B12 — THE TWO WRITE PATHS CANNOT DIVERGE ══════════════════════════════
  -- `sync_session` is SECURITY DEFINER: it runs as the table owner, so RLS does not apply to it.
  -- The policy alone leaves the RPC open; the RPC alone leaves direct writes open. This does not
  -- inspect the source of either — it DRIVES both and asserts the verdicts are EQUAL, so editing
  -- one path and not the other fails here whatever the edit looks like.
  -- B12a: the unentitled chapter — both must refuse.
  v_direct := true;
  begin
    insert into public.sessions (learner_id, chapter, phase, correct_count, wrong_count,
                                 stars_earned, xp_earned, coins_earned, client_id)
      values (v_alearner, v_paid, 'practice', 1, 0, 1, 10, 5, gen_random_uuid()::text);
  exception when insufficient_privilege or check_violation then v_direct := false;
  end;
  v_rpc := true;
  begin
    perform public.sync_session(v_alearner, v_paid, 'practice', 1, 0, 1, 10, 5,
                                gen_random_uuid()::text, now(), 1);
  exception when insufficient_privilege or check_violation then v_rpc := false;
  end;
  v_asserts := v_asserts + 1;
  if v_direct <> v_rpc then
    raise exception 'RLS FAIL B12a: the two write paths DIVERGED on an unentitled chapter (direct=%, rpc=%) — one of them lost the is_chapter_entitled guard', v_direct, v_rpc;
  end if;
  -- ⚠️ Equality alone is a tautology if both are broken open, so the VALUE is asserted too.
  v_asserts := v_asserts + 1;
  if v_direct then raise exception 'RLS FAIL B12a: both write paths accepted an unentitled chapter'; end if;

  -- B12b: the free chapter — both must allow. Same shape, other direction, so a guard that has
  -- become deny-all cannot pass B12a and hide.
  v_direct := true;
  begin
    insert into public.sessions (learner_id, chapter, phase, correct_count, wrong_count,
                                 stars_earned, xp_earned, coins_earned, client_id)
      values (v_alearner, v_free, 'practice', 1, 0, 1, 10, 5, gen_random_uuid()::text);
  exception when insufficient_privilege or check_violation then v_direct := false;
  end;
  v_rpc := true;
  begin
    perform public.sync_session(v_alearner, v_free, 'practice', 1, 0, 1, 10, 5,
                                gen_random_uuid()::text, now(), 1);
  exception when insufficient_privilege or check_violation then v_rpc := false;
  end;
  v_asserts := v_asserts + 1;
  if v_direct <> v_rpc then
    raise exception 'RLS FAIL B12b: the two write paths DIVERGED on a FREE chapter (direct=%, rpc=%)', v_direct, v_rpc;
  end if;
  v_asserts := v_asserts + 1;
  if not v_direct then raise exception 'RLS FAIL B12b: both write paths refused a FREE chapter — the free tier is dead'; end if;

  -- B13a: a stranger cannot reassign somebody else's seat.
  v_blocked := false;
  begin
    perform public.reassign_learner_seat(v_seat2, v_alearner);
  exception when insufficient_privilege then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL B13a: attacker reassigned another account''s seat'; end if;

  -- ── Impersonate the OWNER (positive control — RLS is scoped, not deny-all) ─
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_owner, 'email', 'owner.rlstest@milo.invalid', 'role', 'authenticated')::text, true);

  select count(*) into v_cnt from public.learners where id = v_learner;
  v_asserts := v_asserts + 1;
  if v_cnt <> 1 then raise exception 'RLS FAIL O1: owner cannot see their OWN learner (% rows)', v_cnt; end if;
  select count(*) into v_cnt from public.sessions where learner_id = v_learner;
  v_asserts := v_asserts + 1;
  if v_cnt <> 1 then raise exception 'RLS FAIL O2: owner cannot see their OWN learner''s sessions (% rows)', v_cnt; end if;


  -- ═══ BILLING (Stage 1) — the owner's half ══════════════════════════════════
  -- B2: the owner CAN see what they are paying for.
  select count(*) into v_cnt from public.subscriptions where account_id = v_owner;
  v_asserts := v_asserts + 1;
  if v_cnt <> 1 then raise exception 'RLS FAIL B2: owner cannot read their OWN subscription (% rows)', v_cnt; end if;

  -- B3: and cannot create one. A subscription row a client can write is a free subscription.
  v_blocked := false;
  begin
    insert into public.subscriptions (account_id, status, seats_paid) values (v_attacker, 'active', 4);
  exception when insufficient_privilege then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL B3: a subscription was created from the API'; end if;

  -- B4: nor update their own — the self-upgrade. ⚠️ THE REVOKE IS WHAT MAKES THIS RAISE. With the
  -- default grant left in place and no UPDATE policy, this statement matches no rows and returns
  -- quietly; a silent no-op is indistinguishable from success to the client. So the assertion is
  -- BOTH that it was refused AND that the row is unchanged — the second half is what would catch
  -- the grant being handed back.
  v_blocked := false;
  begin
    update public.subscriptions set status = 'active', seats_paid = 4 where account_id = v_owner;
  exception when insufficient_privilege then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL B4: a subscription was UPDATED from the API (self-upgrade)'; end if;
  select count(*) into v_cnt from public.subscriptions where account_id = v_owner and seats_paid = 2;
  v_asserts := v_asserts + 1;
  if v_cnt <> 1 then raise exception 'RLS FAIL B4: seats_paid changed from the API (% rows still at 2)', v_cnt; end if;

  -- B5: nor delete it (cancelling by DELETE would leave Stripe billing a row we no longer have).
  v_blocked := false;
  begin
    delete from public.subscriptions where account_id = v_owner;
  exception when insufficient_privilege then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL B5: a subscription was DELETED from the API'; end if;

  -- ═══ B13 — reassign_learner_seat ═══════════════════════════════════════════
  select count(*) into v_n from public.subscription_seats where subscription_id = v_subid;

  -- B13b: the seat may only be pointed at a child THIS account created. Entitlement follows
  -- `learners.created_by`, so seating someone else's child would have two accounts paying for one.
  v_blocked := false;
  begin
    perform public.reassign_learner_seat(v_seat2, v_alearner);
  exception when insufficient_privilege then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL B13b: a seat was pointed at a learner the account did not create'; end if;

  -- B13c: a legitimate reassignment works (positive control).
  perform public.reassign_learner_seat(v_seat2, v_learner2);
  select count(*) into v_cnt from public.subscription_seats where id = v_seat2 and learner_id = v_learner2;
  v_asserts := v_asserts + 1;
  if v_cnt <> 1 then raise exception 'RLS FAIL B13c: a legitimate seat reassignment did not take'; end if;

  -- B13d: STRUCTURALLY UNABLE TO RAISE THE ACTIVE COUNT. The function's only write is an UPDATE of
  -- one existing row; this counts the rows either side of it. src/__tests__/billingSchema.test.ts
  -- gates the other half — that no INSERT or DELETE against this table exists in the body.
  v_cnt := v_n;
  select count(*) into v_n from public.subscription_seats where subscription_id = v_subid;
  v_asserts := v_asserts + 1;
  if v_n <> v_cnt then raise exception 'RLS FAIL B13d: the seat COUNT changed during a reassignment (% -> %)', v_cnt, v_n; end if;

  -- B13e: ONE REASSIGNMENT PER BILLING PERIOD. Without it a single seat rotates through all 25
  -- profiles the learner cap allows, and buying one seat buys the whole family.
  v_blocked := false;
  begin
    perform public.reassign_learner_seat(v_seat2, v_learner3);
  exception when check_violation then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL B13e: a seat was reassigned twice in one billing period'; end if;
  select count(*) into v_cnt from public.subscription_seats where id = v_seat2 and learner_id = v_learner2;
  v_asserts := v_asserts + 1;
  if v_cnt <> 1 then raise exception 'RLS FAIL B13e: the refused reassignment still moved the seat'; end if;

  -- B13f: re-pointing a seat at the child ALREADY in it is a no-op and must not burn the period's
  -- one reassignment — otherwise a double-tap in the UI costs a parent their whole month.
  perform public.reassign_learner_seat(v_seat2, v_learner2);
  v_asserts := v_asserts + 1;   -- reaching here at all is the assertion: it did not raise

  -- B13g: and the seat now ENTITLES that child — the guard turns ON as well as off.
  v_asserts := v_asserts + 1;
  if not public.is_chapter_entitled(v_learner2, v_paid) then
    raise exception 'RLS FAIL B13g: a seated learner is still not entitled to a paid chapter';
  end if;
  v_asserts := v_asserts + 1;
  if public.is_chapter_entitled(v_learner3, v_paid) then
    raise exception 'RLS FAIL B13g: an UNSEATED learner on the same account is entitled — entitlement is not per-seat';
  end if;


  -- ═══ C — PLAN-DERIVED ENTITLEMENT (free-tier source C) ═════════════════════
  -- v_learner3 is the OWNER's third child and holds no seat (B13g just proved they are not
  -- entitled), so anything they can record here can only have come from the plan.
  select array_agg(id order by sort_order) into v_paids
    from (select id, sort_order from public.chapters where not is_free order by sort_order limit 4) t;
  v_asserts := v_asserts + 1;
  if coalesce(array_length(v_paids, 1), 0) <> 4 then
    raise exception 'RLS FAIL C0: need four non-free chapters for the plan fixture (got %)', coalesce(array_length(v_paids,1),0);
  end if;

  -- Issue a plan through the REAL path — the RPC a finished check calls — not by writing rows.
  v_sess := public.sync_diagnostic(v_learner3, '9-11', 'i.multFacts', null, '{}', '{}',
              'one gap', '{}', array[v_paids[1], v_paids[2], v_paids[3]], null, gen_random_uuid());

  -- C1: the plan's two recorded chapters are entitled with no subscription at all.
  v_asserts := v_asserts + 1;
  if not (public.is_chapter_entitled(v_learner3, v_paids[1])
          and public.is_chapter_entitled(v_learner3, v_paids[2])) then
    raise exception 'RLS FAIL C1: the plan''s first two steps are not free';
  end if;

  -- C2: the THIRD step is not. Without this the plan is simply free.
  v_asserts := v_asserts + 1;
  if public.is_chapter_entitled(v_learner3, v_paids[3]) then
    raise exception 'RLS FAIL C2: step three of the plan is free — the whole plan is unlocked';
  end if;

  -- C3: completing step one must NOT promote step three. This is the difference between a RECORDED
  -- pair and a computed "first two unmet", and a computed one walks the entire plan free, one
  -- chapter at a time, for nothing.
  insert into public.learner_progress (learner_id, chapter, best_stars, total_xp, total_sessions)
    values (v_learner3, v_paids[1], 3, 100, 1);
  get diagnostics v_cnt = row_count;
  v_asserts := v_asserts + 1;
  if v_cnt <> 1 then raise exception 'RLS FAIL C3: an entitled plan step could not be recorded'; end if;
  v_asserts := v_asserts + 1;
  if public.is_chapter_entitled(v_learner3, v_paids[3]) then
    raise exception 'RLS FAIL C3: finishing step one promoted step three — the free set is being recomputed, not recorded';
  end if;

  -- C7: ONE extra chapter for a struggling child, and exactly one. `revisePlanDeeper` prepends a
  -- deeper chapter when the child struggles in the plan's root; without this the product's own
  -- correction lands behind the paywall, hitting the child it exists for.
  v_asserts := v_asserts + 1;
  if not public.entitle_revised_step(v_learner3, v_paids[3]) then
    raise exception 'RLS FAIL C7: the play-data revision could not be entitled';
  end if;
  v_asserts := v_asserts + 1;
  if not public.is_chapter_entitled(v_learner3, v_paids[3]) then
    raise exception 'RLS FAIL C7: the revised step is still not entitled';
  end if;
  -- …and a second one is refused, so the cap is three free chapters on that path and no more.
  v_asserts := v_asserts + 1;
  if public.entitle_revised_step(v_learner3, v_paids[4]) then
    raise exception 'RLS FAIL C7: a SECOND revision was entitled — the one-per-plan cap is gone';
  end if;
  v_asserts := v_asserts + 1;
  if public.is_chapter_entitled(v_learner3, v_paids[4]) then
    raise exception 'RLS FAIL C7: the refused second revision entitled a chapter anyway';
  end if;

  -- C4: re-running the check REPLACES the free set rather than adding to it. Otherwise every retake
  -- is two more free chapters, for ever.
  v_sess := public.sync_diagnostic(v_learner3, '9-11', 'i.division', null, '{}', '{}',
              'one gap', '{}', array[v_paids[4], v_paids[3]], null, gen_random_uuid());
  v_asserts := v_asserts + 1;
  if public.is_chapter_entitled(v_learner3, v_paids[2]) then
    raise exception 'RLS FAIL C4: the OLD plan''s free chapters still entitle after a new plan was issued';
  end if;
  v_asserts := v_asserts + 1;
  if not (public.is_chapter_entitled(v_learner3, v_paids[4])
          and public.is_chapter_entitled(v_learner3, v_paids[3])) then
    raise exception 'RLS FAIL C4: the NEW plan''s first two steps are not free';
  end if;

  -- C5: exactly one active plan per learner. Enforced by a partial unique index, so it is not
  -- merely what the RPC happens to do — asserted from outside the RPC all the same.
  select count(*) into v_cnt from public.diagnostic_plans where learner_id = v_learner3 and active;
  v_asserts := v_asserts + 1;
  if v_cnt <> 1 then raise exception 'RLS FAIL C5: % active plans for one learner', v_cnt; end if;

  -- C6: and the revision allowance is per PLAN, so the new plan gets its own one.
  v_ok := public.entitle_revised_step(v_learner3, v_paids[1]);
  v_asserts := v_asserts + 1;
  if not v_ok then raise exception 'RLS FAIL C6: the new plan did not get its own revision allowance'; end if;

  -- C8: PER LEARNER, not per account — and not per anybody else's account either. v_alearner is the
  -- ATTACKER's child: no seat, no plan, a different owner. ⚠️ The owner's own other children are
  -- deliberately NOT the fixture here: they hold seats (B13), so they are entitled by source D and
  -- would make this assertion pass for the wrong reason — a fixture that agrees with a broken
  -- implementation proves nothing.
  v_asserts := v_asserts + 1;
  if public.is_chapter_entitled(v_alearner, v_paids[3]) then
    raise exception 'RLS FAIL C8: one account''s plan entitled another account''s child';
  end if;

  reset role;

  -- F1b: the switch is STILL ON after everything above tried to move it. ⚠️ Read back here, as the
  -- migration role, because `authenticated` cannot read the table at all (F2) — and because an
  -- UPDATE with no policy and no grant is the case that returns QUIETLY rather than raising if the
  -- revoke is ever handed back. "It raised" and "it changed nothing" are two different claims.
  select enforced into v_blocked from public.billing_config;
  v_asserts := v_asserts + 1;
  if not coalesce(v_blocked, false) then
    raise exception 'RLS FAIL F1b: the paywall switch was turned off from the API';
  end if;

  -- ═══ M: the seat materialiser (Stage 2a) ═══════════════════════════════════════════════
  -- ⚠️ DRIVEN, NOT READ. `materialize_seats` exists because the Stripe webhook is at-least-once and
  -- out-of-order, and neither property is visible in the source: only replaying an event and
  -- delivering a downgrade twice can show that it converges instead of drifting.
  declare
    v_sub_m uuid;
    v_seat_learner uuid;
    v_idx int[];
  begin
    insert into public.subscriptions (account_id, status, seats_paid)
    values (v_owner, 'active', 0) on conflict (account_id) do update set seats_paid = 0
    returning id into v_sub_m;
    delete from public.subscription_seats where subscription_id = v_sub_m;

    -- M1: 0 → 3 fills the LOWEST indexes, so seat numbers stay dense.
    perform public.materialize_seats(v_sub_m, 3);
    select array_agg(seat_index order by seat_index) into v_idx
      from public.subscription_seats where subscription_id = v_sub_m;
    v_asserts := v_asserts + 1;
    if v_idx is distinct from array[1,2,3] then
      raise exception 'RLS FAIL M1: expected seats {1,2,3}, got %', v_idx;
    end if;

    -- M2: THE SAME TARGET AGAIN CHANGES NOTHING. This is the at-least-once contract; an
    -- "add N seats" function would silently reach 6 here and every replay would cost a seat.
    perform public.materialize_seats(v_sub_m, 3);
    select count(*) into v_cnt from public.subscription_seats where subscription_id = v_sub_m;
    v_asserts := v_asserts + 1;
    if v_cnt <> 3 then raise exception 'RLS FAIL M2: a replayed event changed the seat count to %', v_cnt; end if;

    -- M3: a downgrade with a CHILD IN A SEAT takes the empty ones first. Seat 1 is occupied; 3 → 1
    -- must leave that child seated rather than evicting them while empty seats sit beside them.
    select id into v_seat_learner from public.learners where created_by = v_owner limit 1;
    update public.subscription_seats set learner_id = v_seat_learner, assigned_at = now()
      where subscription_id = v_sub_m and seat_index = 1;
    perform public.materialize_seats(v_sub_m, 1);
    select array_agg(seat_index order by seat_index) into v_idx
      from public.subscription_seats where subscription_id = v_sub_m;
    v_asserts := v_asserts + 1;
    if v_idx is distinct from array[1] then
      raise exception 'RLS FAIL M3: a downgrade evicted a seated child — kept %', v_idx;
    end if;
    v_asserts := v_asserts + 1;
    if not exists (select 1 from public.subscription_seats
                    where subscription_id = v_sub_m and learner_id = v_seat_learner) then
      raise exception 'RLS FAIL M3b: the seated child lost their seat to a downgrade';
    end if;

    -- M4: a quantity above the ceiling CLAMPS rather than raising. Losing a webhook is worse than
    -- clamping one, and the column check would refuse a fifth row anyway.
    v_asserts := v_asserts + 1;
    if public.materialize_seats(v_sub_m, 7) <> 4 then
      raise exception 'RLS FAIL M4: an over-quantity did not clamp to 4';
    end if;
    select count(*) into v_cnt from public.subscription_seats where subscription_id = v_sub_m;
    v_asserts := v_asserts + 1;
    if v_cnt <> 4 then raise exception 'RLS FAIL M4b: clamped to 4 but wrote % rows', v_cnt; end if;

    -- M5: down to zero. A cancelled subscription grants nothing — and the child's RECORD is
    -- untouched, which is the rule reads are never gated by.
    perform public.materialize_seats(v_sub_m, 0);
    select count(*) into v_cnt from public.subscription_seats where subscription_id = v_sub_m;
    v_asserts := v_asserts + 1;
    if v_cnt <> 0 then raise exception 'RLS FAIL M5: cancelling left % seats', v_cnt; end if;
    v_asserts := v_asserts + 1;
    if not exists (select 1 from public.learners where id = v_seat_learner) then
      raise exception 'RLS FAIL M5b: releasing a seat deleted the child';
    end if;

    -- M6: `authenticated` cannot call it. It writes the table that decides who is entitled, so an
    -- account could otherwise grant itself four seats. ⚠️ Asserted by ATTEMPTING it, not by reading
    -- the REVOKE — a grant handed back by a later migration is invisible to the source.
    set local role authenticated;
    begin
      perform public.materialize_seats(v_sub_m, 4);
      reset role;
      raise exception 'RLS FAIL M6: an account materialised its own seats';
    exception when insufficient_privilege then
      reset role;
      v_asserts := v_asserts + 1;
    end;

    -- M7: ⚠️ THE OTHER HALF OF M6, AND THE HALF THAT FAILS IN PRODUCTION RATHER THAN IN A TEST.
    -- `service_role` MUST be able to call it — that is the Stripe webhook's only route to a seat,
    -- through PostgREST. M6 alone is satisfied by a function NOBODY can execute, which looks exactly
    -- like a well-locked-down one right up until the first real purchase grants no seats. Positive
    -- control for the grant, driven as the role that will really make the call.
    set local role service_role;
    begin
      perform public.materialize_seats(v_sub_m, 2);
      reset role;
    exception when insufficient_privilege then
      reset role;
      raise exception 'RLS FAIL M7: service_role cannot call materialize_seats — the webhook cannot seat anyone';
    end;
    select count(*) into v_cnt from public.subscription_seats where subscription_id = v_sub_m;
    v_asserts := v_asserts + 1;
    if v_cnt <> 2 then raise exception 'RLS FAIL M7b: service_role call left % seats, expected 2', v_cnt; end if;
  end;

  -- The machine-readable line CI greps for. Keep the `RLS_ASSERTIONS=` token stable.
  raise notice 'RLS REGRESSION SUITE: ALL ASSERTIONS PASSED';
  raise notice 'RLS_ASSERTIONS=%', v_asserts;
end $$;

rollback;
