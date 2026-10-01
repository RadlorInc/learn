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
  v_rpc      boolean;                     -- (unused since 20260928190000: sync_session is gone)
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
  v_consent  uuid;                        -- the attacker's granted ACCOUNT consent (see below)
  v_owner_consent uuid;                   -- the owner's granted ACCOUNT consent: covers all three of their children
  v_role     text;                        -- S1–S5: each client role in turn
begin
  -- ── Setup (as the migration role; RLS bypassed here) ──────────────────────
  select id into v_chapter from public.chapters limit 1;   -- a real chapter (sessions.chapter is FK'd)

  -- email_confirmed_at set: both are CONFIRMED accounts, so handle_new_user() creates their
  -- profiles either way (before 20260923180000 a profile is created at signup; from it, only on
  -- confirmation — this fixture is valid under both). Without it the
  -- learners insert below fails learners_created_by_fkey — there is no owner profile to point at.
  insert into auth.users (id, email, email_confirmed_at) values
    (v_owner,    'owner.rlstest@milo.invalid',    now()),
    (v_attacker, 'attacker.rlstest@milo.invalid', now());

  -- ⚠️ EVERY CHILD HERE IS CREATED WITH A GRANTED PARENTAL CONSENT, BECAUSE THAT IS THE ONLY WAY
  -- THE SCHEMA ALLOWS ONE (20260923120000: `trg_enforce_learner_consent` refuses a learner without
  -- one, P0C01). The cheap repair — disabling the trigger for this suite — would run every assertion
  -- below against a schema production does not have. Same fixture as `_schema.ts: grantedConsent`.
  -- CONSENT-ONCE (20260924100000): one ACCOUNT consent per parent covers every child they add, and each
  -- child carries the parent's attestation (`attested_notice_version` = the consent's notice_version; the
  -- trigger stamps who/when/how).
  -- notice-v7 (20260928100000) made every earlier consent non-current, so the fixture consents to the CURRENT
  -- notice, as `_schema.ts: FIXTURE_NOTICE` does. (It said notice-v3 until then, and every child here was refused.)
  insert into public.parental_consents
    (parent_id, method, state, notice_version, privacy_version, terms_version, email_address,
     confirmed_at, token_hash, expires_at, request_email_provider_id, request_email_sent_at,
     second_email_provider_id, second_notice_scheduled_for, scope)
  values (v_owner, 'email_plus', 'granted', 'notice-v7', 'privacy-v1', 'terms-v1', 'rlstest@milo.invalid',
          now(), md5(random()::text), now() + interval '7 days', 're_rlstest_b1', now(), 're_rlstest_b3_' || md5(random()::text),
          now() + interval '1 day', 'account')
  returning id into v_owner_consent;

  -- Owner creates a learner. The grant_owner_access trigger gives the owner a
  -- learner_access row.
  insert into public.learners (id, display_name, created_by, consent_id, attested_notice_version)
    values (v_learner, 'RLS Test Kid', v_owner, v_owner_consent, 'notice-v7');

  insert into public.sessions (learner_id, chapter, phase, correct_count, wrong_count,
                               stars_earned, xp_earned, coins_earned, client_id)
    values (v_learner, v_chapter, 'practice', 5, 1, 3, 200, 15, gen_random_uuid()::text);

  -- Attacker owns their OWN learner and has a legit pending invite to their own email for it —
  -- the raw material for the V12 repoint exploit (rewrite this invite to point at the victim).
  insert into public.parental_consents
    (parent_id, method, state, notice_version, privacy_version, terms_version, email_address,
     confirmed_at, token_hash, expires_at, request_email_provider_id, request_email_sent_at,
     second_email_provider_id, second_notice_scheduled_for, scope)
  values (v_attacker, 'email_plus', 'granted', 'notice-v7', 'privacy-v1', 'terms-v1', 'rlstest@milo.invalid',
          now(), md5(random()::text), now() + interval '7 days', 're_rlstest_b1', now(), 're_rlstest_b3_' || md5(random()::text),
          now() + interval '1 day', 'account')
  returning id into v_consent;
  insert into public.learners (id, display_name, created_by, consent_id, attested_notice_version)
    values (v_alearner, 'Attacker Kid', v_attacker, v_consent, 'notice-v7');
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

  insert into public.learners (id, display_name, created_by, consent_id, attested_notice_version)
    values (v_learner2, 'RLS Test Kid 2', v_owner, v_owner_consent, 'notice-v7');
  insert into public.learners (id, display_name, created_by, consent_id, attested_notice_version)
    values (v_learner3, 'RLS Test Kid 3', v_owner, v_owner_consent, 'notice-v7');

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

  -- A4: attacker cannot read the learner's sessions. (A5, their stats, went with learner_stats: 20260928190000.)
  select count(*) into v_cnt from public.sessions where learner_id = v_learner;
  v_asserts := v_asserts + 1;
  if v_cnt <> 0 then raise exception 'RLS FAIL A4: attacker read another learner''s sessions (% rows)', v_cnt; end if;


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

  -- E1: the CAN-SPAM suppression list (email_suppressions) is unreadable — it holds addresses and the
  -- tokens that unsubscribe them. RLS on, ZERO policies, every client privilege revoked.
  v_blocked := false;
  begin
    perform * from public.email_suppressions limit 1;
  exception when insufficient_privilege then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL E1: authenticated user can read email_suppressions'; end if;

  -- E2: nor writable — a client that could clear suppressed_at could re-subscribe someone who left.
  v_blocked := false;
  begin
    update public.email_suppressions set suppressed_at = null;
  exception when insufficient_privilege then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL E2: authenticated user can write email_suppressions'; end if;

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

  -- B11 (20260928190000): the legacy `sessions` table takes no client write at all — not a free chapter, not a
  -- paid one, not by its own child's owner (the attacker owns v_alearner). Before, a policy let any learner_access
  -- holder insert, guarded only by is_chapter_entitled; the table and the RPC that wrote it are retired.
  v_blocked := false;
  begin
    insert into public.sessions (learner_id, chapter, phase, correct_count, wrong_count,
                                 stars_earned, xp_earned, coins_earned, client_id)
      values (v_alearner, v_free, 'practice', 1, 0, 1, 10, 5, gen_random_uuid()::text);
  exception when insufficient_privilege then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL B11a: a client wrote a sessions row (free chapter)'; end if;
  v_blocked := false;
  begin
    insert into public.sessions (learner_id, chapter, phase, correct_count, wrong_count,
                                 stars_earned, xp_earned, coins_earned, client_id)
      values (v_alearner, v_paid, 'practice', 1, 0, 1, 10, 5, gen_random_uuid()::text);
  exception when insufficient_privilege then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL B11b: a client wrote a sessions row (paid chapter)'; end if;

  -- B11d (the paired half): READING is unchanged — the owner still sees their child's history. The row is seeded by
  -- the database role, the only writer left.
  reset role;
  insert into public.sessions (learner_id, chapter, phase, correct_count, wrong_count,
                               stars_earned, xp_earned, coins_earned, client_id)
    values (v_alearner, v_free, 'practice', 1, 0, 1, 10, 5, gen_random_uuid()::text);
  set local role authenticated;
  select count(*) into v_cnt from public.sessions where learner_id = v_alearner and chapter = v_free;
  v_asserts := v_asserts + 1;
  if v_cnt <> 1 then raise exception 'RLS FAIL B11d: the owner can no longer read their child''s sessions (% rows)', v_cnt; end if;

  -- B12 (20260928190000): the second write path, sync_session, is gone rather than guarded.
  select count(*) into v_cnt from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname in ('sync_session', 'sync_diagnostic');
  v_asserts := v_asserts + 1;
  if v_cnt <> 0 then raise exception 'RLS FAIL B12: % legacy write function(s) still exist', v_cnt; end if;

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

  -- The plan, in the shape sync_diagnostic wrote it: a session, then an active plan whose free set is its first two
  -- steps. ⚠️ Seeded as rows since 20260928190000 dropped sync_diagnostic (the placement check that called it was
  -- deleted on 2026-09-20). Since 20261001120000 is_chapter_entitled no longer reads plans: C1 asserts exactly that.
  reset role;
  insert into public.diagnostic_sessions (learner_id, band, root_gap_skill)
    values (v_learner3, '9-11', 'i.multFacts') returning id into v_sess;
  insert into public.diagnostic_plans (learner_id, session_id, chapter_sequence, free_chapters)
    values (v_learner3, v_sess, array[v_paids[1], v_paids[2], v_paids[3]], array[v_paids[1], v_paids[2]]);
  set local role authenticated;

  -- C1 (20261001120000): the plan's recorded steps NO LONGER entitle — the family's two free topics replaced them.
  v_asserts := v_asserts + 1;
  if public.is_chapter_entitled(v_learner3, v_paids[1]) then
    raise exception 'RLS FAIL C1: a diagnostic plan still entitles a chapter — the free trial is not the only free source';
  end if;

  -- T: THE FREE TRIAL — any two topics per FAMILY, then pay. v_learner3 holds no seat (B13g), so only claims count.
  -- T1/T2: two claims succeed (src/__tests__/familyFreeTopics.test.ts covers siblings sharing the two).
  v_asserts := v_asserts + 1;
  if not public.claim_topic(v_learner3, 'c:counting') then raise exception 'RLS FAIL T1: the first free topic was refused'; end if;
  v_asserts := v_asserts + 1;
  if not public.claim_topic(v_learner3, 'g3m1-t1') then raise exception 'RLS FAIL T2: the second free topic was refused'; end if;
  -- T3: the third is refused.
  v_asserts := v_asserts + 1;
  if public.claim_topic(v_learner3, 'c:shapes') then raise exception 'RLS FAIL T3: a third free topic was given'; end if;
  -- T4: a claimed chapter entitles; an unclaimed one does not (the positive and negative twins).
  v_asserts := v_asserts + 1;
  if not public.is_chapter_entitled(v_learner3, 'counting') then raise exception 'RLS FAIL T4: a claimed chapter is not entitled'; end if;
  v_asserts := v_asserts + 1;
  if public.is_chapter_entitled(v_learner3, 'shapes') then raise exception 'RLS FAIL T4: a refused chapter is entitled'; end if;
  -- T5: the client cannot write the claims table.
  v_blocked := false;
  begin
    insert into public.free_topics (account_id, topic) values (v_owner, 'c:shapes');
  exception when insufficient_privilege then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL T5: a client wrote free_topics directly'; end if;

  -- (C4, re-running the check, needed sync_diagnostic — dropped in 20260928190000 with no caller left.)

  -- C5: exactly one active plan per learner. Enforced by a partial unique index, so it is not
  -- merely what the RPC happens to do — asserted from outside the RPC all the same.
  select count(*) into v_cnt from public.diagnostic_plans where learner_id = v_learner3 and active;
  v_asserts := v_asserts + 1;
  if v_cnt <> 1 then raise exception 'RLS FAIL C5: % active plans for one learner', v_cnt; end if;

  -- C8: PER LEARNER, not per account — and not per anybody else's account either. v_alearner is the
  -- ATTACKER's child: no seat, no plan, a different owner. ⚠️ The owner's own other children are
  -- deliberately NOT the fixture here: they hold seats (B13), so they are entitled by source D and
  -- would make this assertion pass for the wrong reason — a fixture that agrees with a broken
  -- implementation proves nothing.
  -- ⚠️ SEC-16 (20260926100700): the OWNER may no longer ask about the attacker's child at all — refused 42501.
  -- So C8 is asked by the attacker, who owns v_alearner, and the owner's refusal is its own assertion.
  v_blocked := false;
  begin
    perform public.is_chapter_entitled(v_alearner, v_paids[3]);
  exception when insufficient_privilege then v_blocked := true;
  end;
  v_asserts := v_asserts + 1;
  if not v_blocked then raise exception 'RLS FAIL C8a (SEC-16): the owner got an entitlement answer about another account''s child'; end if;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_attacker, 'email', 'attacker.rlstest@milo.invalid', 'role', 'authenticated')::text, true);
  v_asserts := v_asserts + 1;
  if public.is_chapter_entitled(v_alearner, v_paids[3]) then
    raise exception 'RLS FAIL C8: one account''s plan entitled another account''s child';
  end if;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_owner, 'email', 'owner.rlstest@milo.invalid', 'role', 'authenticated')::text, true);

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

    -- M7: ⚠️ THE OTHER HALF OF M6. `service_role` MUST be able to call it — that is the Stripe
    -- webhook's only route to a seat, through PostgREST. M6 ALONE is equally satisfied by a function
    -- NOBODY at all can execute, which looks exactly like a well-locked-down one right up until the
    -- first real purchase grants no seats.
    -- ⚠️ It has never yet caught anything, and that is worth saying: measured against production,
    -- Supabase's default privileges already grant `service_role` EXECUTE and the REVOKE cannot take
    -- it away, so this passed the first time it ran. What it pins is that the property stops
    -- depending on a platform default nobody in this repo controls.
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

  -- ── SEC-02 (20260926100000): a viewer's access can be revoked, and cannot be re-granted by replay ──
  -- Each refusal is paired with the write that must succeed, driven as the real caller (`authenticated`).
  declare
    v_viewer uuid := gen_random_uuid();
    v_vinv   uuid := gen_random_uuid();
  begin
    insert into auth.users (id, email, email_confirmed_at) values (v_viewer, 'viewer.rlstest@milo.invalid', now());
    insert into public.learner_access (learner_id, parent_id, access_role) values (v_learner, v_viewer, 'viewer');
    insert into public.learner_invites (id, learner_id, invited_by, invited_email, status, expires_at)
      values (v_vinv, v_learner, v_owner, 'viewer.rlstest@milo.invalid', 'accepted', now() + interval '6 days');

    -- V1: a stranger (the attacker) cannot delete the viewer's row. V2: the viewer cannot delete the OWNER's row.
    set local role authenticated;
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_attacker, 'email', 'attacker.rlstest@milo.invalid', 'role', 'authenticated')::text, true);
    delete from public.learner_access where learner_id = v_learner and parent_id = v_viewer;
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_viewer, 'email', 'viewer.rlstest@milo.invalid', 'role', 'authenticated')::text, true);
    delete from public.learner_access where learner_id = v_learner and parent_id = v_owner;
    reset role;
    select count(*) into v_cnt from public.learner_access where learner_id = v_learner and parent_id in (v_viewer, v_owner);
    v_asserts := v_asserts + 1;
    if v_cnt <> 2 then raise exception 'RLS FAIL V1/V2: a stranger or the viewer deleted an access row that is not theirs (% of 2 left)', v_cnt; end if;

    -- V3 (positive twin): the OWNER can remove the viewer (was 42P17 for everyone before SEC-02).
    set local role authenticated;
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_owner, 'email', 'owner.rlstest@milo.invalid', 'role', 'authenticated')::text, true);
    delete from public.learner_access where learner_id = v_learner and parent_id = v_viewer;
    get diagnostics v_cnt = row_count;
    reset role;
    v_asserts := v_asserts + 1;
    if v_cnt <> 1 then raise exception 'RLS FAIL V3: the owner could not remove a viewer (% rows)', v_cnt; end if;

    -- V4: the removed viewer cannot set their accepted invite back to pending…
    set local role authenticated;
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_viewer, 'email', 'viewer.rlstest@milo.invalid', 'role', 'authenticated')::text, true);
    v_blocked := false;
    begin
      update public.learner_invites set status = 'pending' where id = v_vinv;
    exception when insufficient_privilege then v_blocked := true;
    end;
    v_asserts := v_asserts + 1;
    if not v_blocked then raise exception 'RLS FAIL V4: a removed viewer re-opened their accepted invite'; end if;
    -- V5: …and so cannot self-grant again.
    v_blocked := false;
    begin
      insert into public.learner_access (learner_id, parent_id, access_role) values (v_learner, v_viewer, 'viewer');
    exception when insufficient_privilege or check_violation then v_blocked := true;
    end;
    v_asserts := v_asserts + 1;
    if not v_blocked then raise exception 'RLS FAIL V5: a removed viewer self-granted access again'; end if;
    reset role;

    -- V6 (positive twin): a viewer CAN remove themselves. Re-added as the migration role first.
    insert into public.learner_access (learner_id, parent_id, access_role) values (v_learner, v_viewer, 'viewer');
    set local role authenticated;
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_viewer, 'email', 'viewer.rlstest@milo.invalid', 'role', 'authenticated')::text, true);
    delete from public.learner_access where learner_id = v_learner and parent_id = v_viewer;
    get diagnostics v_cnt = row_count;
    reset role;
    v_asserts := v_asserts + 1;
    if v_cnt <> 1 then raise exception 'RLS FAIL V6: a viewer could not remove themselves (% rows)', v_cnt; end if;
  end;

  -- ── 20260928160000: a learner row is deleted only through delete_learner ───────────────────────
  -- L1: the OWNER's direct delete of their own child is refused, and the row survives it.
  -- L2 (positive twin, same caller): delete_learner deletes that child.
  declare
    v_del uuid := gen_random_uuid();
    v_refused boolean := false;
  begin
    insert into public.learners (id, display_name, created_by, consent_id, attested_notice_version)
      values (v_del, 'RLS Delete Kid', v_owner, v_owner_consent, 'notice-v7');
    set local role authenticated;
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_owner, 'email', 'owner.rlstest@milo.invalid', 'role', 'authenticated')::text, true);
    begin
      delete from public.learners where id = v_del;
    exception when insufficient_privilege then v_refused := true;
    end;
    reset role;
    select count(*) into v_cnt from public.learners where id = v_del;
    v_asserts := v_asserts + 1;
    if not v_refused or v_cnt <> 1 then
      raise exception 'RLS FAIL L1: the owner deleted a learners row directly (refused=%, rows left=%)', v_refused, v_cnt;
    end if;

    set local role authenticated;
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_owner, 'email', 'owner.rlstest@milo.invalid', 'role', 'authenticated')::text, true);
    perform public.delete_learner(v_del);
    reset role;
    select count(*) into v_cnt from public.learners where id = v_del;
    v_asserts := v_asserts + 1;
    if v_cnt <> 0 then raise exception 'RLS FAIL L2: delete_learner did not delete the owner''s child'; end if;
  end;

  -- ── CONSENT-ONCE (20260924100000): withdrawing a whole account, and nobody else's ─────────────
  -- Last, because C3 deletes the attacker's child that the assertions above use.
  select count(*) into v_cnt from public.learners where created_by = v_owner;
  v_asserts := v_asserts + 1;
  if v_cnt < 3 then raise exception 'RLS FAIL C0: fixture — the owner has % children, expected at least 3', v_cnt; end if;

  -- C1: anon cannot reach withdraw_my_consent.
  set local role anon;
  begin
    perform public.withdraw_my_consent();
    reset role;
    raise exception 'RLS FAIL C1: anon called withdraw_my_consent';
  exception when insufficient_privilege then
    reset role;
    v_asserts := v_asserts + 1;
  end;

  -- C2: a signed-in adult cannot call the internal step with somebody else's id.
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_attacker, 'email', 'attacker.rlstest@milo.invalid', 'role', 'authenticated')::text, true);
  begin
    perform public.consent_withdraw_account(v_owner);
    reset role;
    raise exception 'RLS FAIL C2: authenticated called consent_withdraw_account for another parent';
  exception when insufficient_privilege then
    reset role;
    v_asserts := v_asserts + 1;
  end;

  -- C3: the attacker's own withdrawal acts on the attacker only. Positive twin first: it works (their child
  -- is gone); then the owner's three children and granted consent are exactly as they were.
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_attacker, 'email', 'attacker.rlstest@milo.invalid', 'role', 'authenticated')::text, true);
  perform public.withdraw_my_consent();
  reset role;
  select count(*) into v_cnt from public.learners where id = v_alearner;
  v_asserts := v_asserts + 1;
  if v_cnt <> 0 then raise exception 'RLS FAIL C3: withdraw_my_consent did not delete the caller''s own child'; end if;
  select count(*) into v_cnt from public.learners where created_by = v_owner;
  v_asserts := v_asserts + 1;
  if v_cnt < 3 then raise exception 'RLS FAIL C3b: another parent''s withdrawal deleted the owner''s children (% left)', v_cnt; end if;
  v_asserts := v_asserts + 1;
  if not exists (select 1 from public.parental_consents where id = v_owner_consent and state = 'granted') then
    raise exception 'RLS FAIL C3c: another parent''s withdrawal ended the owner''s consent';
  end if;

  -- ── S0–S5: the lesson-audio bucket is read-by-URL only (20260927100000). A public bucket serves
  -- /object/public/<name> WITHOUT RLS; every other door (list, upload, overwrite, delete) is storage.objects
  -- under RLS, and must be shut for anon AND authenticated. Each refusal has its positive twin: the object
  -- provably exists, so "a client sees 0 rows" means refused, not empty.
  v_asserts := v_asserts + 1;
  if not exists (select 1 from storage.buckets where id = 'lesson-audio' and public
                 and file_size_limit = 262144 and allowed_mime_types = array['audio/mpeg']) then
    raise exception 'RLS FAIL S0: lesson-audio is missing, not public, or not 256 KB / audio/mpeg only';
  end if;
  -- Owned by the attacker and in the attacker's folder, so an owner- or folder-keyed policy matches as it would live.
  insert into storage.objects (bucket_id, name, owner, owner_id)
  values ('lesson-audio', v_attacker::text || '/rlstest0000000000.mp3', v_attacker, v_attacker::text);
  select count(*) into v_cnt from storage.objects where bucket_id = 'lesson-audio' and name = v_attacker::text || '/rlstest0000000000.mp3';
  v_asserts := v_asserts + 1;
  if v_cnt <> 1 then raise exception 'RLS FAIL S1+: the control object is not there, so the refusals below would prove nothing'; end if;

  foreach v_role in array array['anon', 'authenticated'] loop
    execute format('set local role %I', v_role);
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_attacker, 'email', 'attacker.rlstest@milo.invalid', 'role', v_role)::text, true);

    -- S1 list: a client sees no object of this bucket (fetch by exact URL is the only read path)
    select count(*) into v_cnt from storage.objects where bucket_id = 'lesson-audio';
    v_asserts := v_asserts + 1;
    if v_cnt <> 0 then reset role; raise exception 'RLS FAIL S1: % can list lesson-audio (% rows)', v_role, v_cnt; end if;

    -- S2 upload
    begin
      insert into storage.objects (bucket_id, name, owner, owner_id)
      values ('lesson-audio', v_attacker::text || '/rlstest-upload.mp3', v_attacker, v_attacker::text);
      reset role;
      raise exception 'RLS FAIL S2: % uploaded into lesson-audio', v_role;
    exception when insufficient_privilege then
      v_asserts := v_asserts + 1;
    end;

    -- S3 overwrite and S4 delete: both touch 0 rows.
    -- ⚠️ BARE STATEMENTS, NO WHERE, ON PURPOSE. A WHERE that reads a column also needs a SELECT policy, so
    -- `update … where bucket_id = …` touches 0 rows even when an anon UPDATE policy exists — this suite passed on
    -- exactly that planted hole until the probe was made bare (2026-09-26). An attacker's statement is bare too.
    update storage.objects set metadata = '{"rlstest":"hijack"}'::jsonb;
    get diagnostics v_cnt = row_count;
    v_asserts := v_asserts + 1;
    if v_cnt <> 0 then reset role; raise exception 'RLS FAIL S3: % overwrote % lesson-audio object(s)', v_role, v_cnt; end if;
    -- ⚠️ storage.protect_delete() refuses EVERY direct DELETE unless `storage.allow_delete_query` is 'true' — and
    -- the Storage API sets exactly that before its own DELETE, so on the API path RLS alone decides. The probe
    -- does what the API does. (A first version counted the trigger's refusal as a pass and stayed green with an
    -- authenticated DELETE-anything policy planted — the trigger was masking the policy, 2026-09-26.)
    perform set_config('storage.allow_delete_query', 'true', true);
    delete from storage.objects;
    get diagnostics v_cnt = row_count;
    perform set_config('storage.allow_delete_query', 'false', true);
    v_asserts := v_asserts + 1;
    if v_cnt <> 0 then reset role; raise exception 'RLS FAIL S4: % deleted % lesson-audio object(s)', v_role, v_cnt; end if;
    reset role;
  end loop;

  -- S5: after all of that, the control object is still there, unchanged
  select count(*) into v_cnt from storage.objects where bucket_id = 'lesson-audio' and name = v_attacker::text || '/rlstest0000000000.mp3';
  v_asserts := v_asserts + 1;
  if v_cnt <> 1 then raise exception 'RLS FAIL S5: the control object was changed or removed by a client role'; end if;

  -- The machine-readable line CI greps for. Keep the `RLS_ASSERTIONS=` token stable.
  raise notice 'RLS REGRESSION SUITE: ALL ASSERTIONS PASSED';
  raise notice 'RLS_ASSERTIONS=%', v_asserts;
end $$;

rollback;
