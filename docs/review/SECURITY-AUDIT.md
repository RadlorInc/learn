# R5 — Security audit (deep review, phase 1, read-only)

Repo `RadlorInc/learn` at `06cee602` (worktree `/Users/mrk/milo_react/w-review`), radlor-site at `b672ba5`.
Date 2026-09-26. Auditor: R5. Prefix `SEC-`.

## No Critical finding

Nothing I found lets an unauthenticated stranger read or change children's data at scale. The most serious item,
**SEC-01**, lets someone take over a parent account. It needs a targeted victim and the right timing, so it is **High**,
not Critical. Details and the "could it already have happened" answer are in SEC-01.

## How this was measured

- **A local throwaway Supabase stack** was built from a scratch copy (`review-scratch/sec/stack/`, project
  `sec-review-r5`, ports 55421/55422/55424). It ran GoTrue v2.196.0, PostgREST v16.1 and Postgres 17.6. The build
  applied the baseline first and then all 112 migrations, in CI's order.
  - The repo's own `rls_regression.sql` passed on this stack (`RLS_ASSERTIONS=82`).
  - The whole catalog was dumped from this stack (`review-scratch/sec/*.txt`): tables, RLS, policies, table and column
    grants, every function with its DEFINER flag, `search_path` and EXECUTE ACL, and every trigger.
  - The stack was torn down at the end.
- **Production was never queried.** I only used public GETs:
  - `radlic.com` headers and HTML, plus 31 live JS chunks.
  - `radlor.com/radlic` and its chunks.
  - An OPTIONS preflight to `radlic.com/api/child-login`.
  - GitHub repo metadata: environments, workflow permissions, artifact listing. The artifact listing was also fetched
    unauthenticated.
  - The facts only production can answer are written as read-only SQL for Rafi: `docs/review/sql/sec-production-facts.sql`.
- **Positive controls:**
  - The live-bundle secret grep does find `sb_publishable_…`, the Supabase host and "Continue with Google".
  - The DOM-sink grep does find the comment in `features/consent/marks.ts`.
  - `npm audit` reports 550 dependencies scanned with no error.
  - Every probe in `probes.sql` prints a `-control` row next to its result.

---

## SEC-01 — Sign-up pre-account-takeover: the attacker's password survives the real owner's confirmation (High, Reproduced)

**What happens.**
- `POST /api/auth/signup` creates accounts with GoTrue's admin `generate_link` (`src/features/consent/server.ts:118-133`,
  called from `src/app/api/auth/signup/route.ts:39`).
- When the address already exists **unconfirmed**, GoTrue issues a fresh token and updates `user_metadata`, but
  **keeps the password from the first sign-up**.

**Attack.**
1. The attacker signs up `parent@example.com` with a password they choose. This needs only the victim's email address
   and no inbox access.
2. Later the real parent signs up on Radlic with their own password. The route answers OK and emails them.
3. The parent clicks their link. `/auth/confirm` calls `verifyOtp`, which confirms the account and signs them in, so
   they never type a password again on that device. They add children and use the app.
4. The attacker signs in with **their** password and has the full parent account: children's names, progress,
   consent, deletion.

**Reproduced** with `review-scratch/sec/prehijack.sh` against the local stack:

```
1. attacker pre-registers … (meta first_name Mallory)
2. real owner signs up later … (meta first_name Alice)
3. owner clicks the link … verify -> session
4. password sign-in: attacker's password -> 200 ; owner's password -> 400
RESULT: VULNERABLE
```

**Limits on the attack.**
- The attacker must act before the victim signs up.
- `prune-unconfirmed-users` deletes an unconfirmed account after 3 days, so the attacker has to re-register to keep the
  trap set.
- The victim receives an unsolicited "confirm" email from the attacker's step.

This probably also applied to the old `supabase.auth.signUp` path. That is Suspected: my comparison run was cut short by
GoTrue's own email rate limit (429).

**Could it already have happened?** In principle yes, and the database cannot tell you.
- Two `generate_link` sign-ups leave **no row** in `auth.audit_log_entries`. I measured this locally: only
  `user_signedup` at verification.
- The evidence would be in **Resend's log**: two or more B0/B0t confirmation emails to the same address before its first
  sign-in, especially with different first names. See Q3 in the SQL file.

**Secure fix (rafi, UX change).** Let whoever controls the mailbox set the final password.
- Do not accept a password at sign-up. Or accept it, and on `/auth/confirm`, after `verifyOtp` succeeds, ask for the
  password again and call `updateUser({ password })`.
- "Last sign-up wins" is **not** a fix. The attacker can re-register after the victim, and the newest emailed token then
  belongs to the attacker's call.
- Interim option: in the route, when `generate_link` returns a user created before this request, send nothing and tell
  the person to use "Forgot password". That still breaks the chain, because recovery sets a new password through the
  inbox.

## SEC-02 — Nobody can revoke a viewer's access to a child, and a hand-removed viewer can re-grant themselves (High, Reproduced)

**The DELETE policy errors for everyone.** Every DELETE on `learner_access` by an `authenticated` caller fails with
`42P17 infinite recursion detected in policy for relation "learner_access"`.
- The `learner_access: delete` policy reads `learners`, whose SELECT policy reads `learner_access` again. Postgres
  refuses the expansion.
- Probe P6: the viewer's own "remove myself" (`src/data/repositories/learners.ts:212-229`,
  `removeMyselfFromLearner`) gets 42P17.
- Probe P7: the owner deleting the viewer's row gets 42P17.
- There is no owner UI to remove a viewer at all.
- So a viewer invited once (a grandparent, an ex-partner, a mistyped address that was accepted) keeps reading that
  child's data until the child is deleted.

**A hand-removed viewer can come back** (probe P1). Suppose Rafi removes a viewer with SQL. The viewer's invite is still
`accepted` and inside its 7-day window, and the recipient UPDATE policy allows the `status` column. The viewer:
1. sets `status = 'pending'`;
2. re-inserts `learner_access` as viewer, which `can_self_grant_access` accepts again;
3. reads the child's rows again. The probe shows 0 rows before and 1 after.

**Evidence.**
- `review-scratch/sec/probes.sql` P1/P6/P7 (Reproduced).
- Policy text is in `review-scratch/sec/policies_flat.txt`.
- Whether production has the same recursion: Q1 in the SQL file. It is an EXPLAIN only, which already reproduces the
  error locally.

**Fix (own, one new migration).**
1. Replace the delete policy with `parent_id = auth.uid() and access_role <> 'owner'`, which lets anyone leave.
2. Add an OR on a `SECURITY DEFINER` helper `is_learner_creator(learner_id)` with a pinned `search_path` and EXECUTE
   revoked from public/anon. This breaks the recursion.
3. Add a BEFORE UPDATE trigger on `learner_invites` that allows only `pending → accepted`.
4. Add RLS-suite assertions for all three, each paired with its positive twin (owner can remove, viewer can leave,
   stranger cannot).

An owner "remove viewer" button is a rafi item.

## SEC-03 — Production database dumps (children's data) are artifacts of a PUBLIC repository (High, Measured)

**What is exposed.**
- `backup.yml` uploads `milo-db-backup-<run>` nightly with 30-day retention. `RadlorInc/learn` is **public**
  (`gh api`: `visibility: public`).
- 16 such artifacts exist now, the newest from 2026-09-25 21:24 UTC.
- The listing is readable with **no authentication**: `curl api.github.com/…/actions/artifacts?name=milo-db-backup-36191258056`
  returns it.
- GitHub lets any signed-in account download a public repository's artifacts. That part is Suspected: taken from
  GitHub's documented behaviour, and deliberately **not** tested by downloading.

**What protects it.**
- Confidentiality rests entirely on `BACKUP_PASSPHRASE`, with `openssl enc -aes-256-cbc -pbkdf2 -iter 200000`.
  That is unauthenticated CBC with no integrity check.
- The runbook says to generate the passphrase with `openssl rand -base64 32`. If that was done, brute force is
  infeasible, and this is defence in depth, not an open door.
- If a human-chosen passphrase was used, every child's record is one offline guess-loop away.

**Fix (rafi).**
1. Confirm the passphrase was generated as the runbook says. If not, rotate it and delete the existing artifacts.
2. Move dumps off the public repo. Options: a private `learn-backups` repo written with a fine-grained token, or
   Supabase PITR once on Pro.
3. Encrypt to a public key (`age -r`), so CI never holds the decryption secret.

## SEC-04 — The sign-up route is an open email relay for `noreply@radlor.com` (Medium, Suspected)

- `POST /api/auth/signup` needs no account. For any address it sends a Resend email from our domain, with a
  sender-chosen first name. The name is sanitised to letters (`firstNameOf`).
- Re-posting for an unconfirmed address re-issues and re-sends every time. The idempotency key includes the new token.
- The only limit is `overLimit(…, 5, 10 min)` per IP (`signup/route.ts:26`). That limit is in-memory **per serverless
  instance** (`_rateLimit.ts`), so rotating IPs or instances removes it.
- Supabase's per-address confirmation-email limits no longer apply, because Supabase no longer sends this email.
- Impact: someone can mail-bomb a person, damage the domain's sender reputation (and with it consent-email
  deliverability, which the COPPA flow depends on), and burn the Resend quota.
- **Fix (own):** throttle per address in the database, e.g. at most one send per 60 s and a few per day, recorded in a
  small service-role table or in `app_metadata`.

## SEC-05 — Class temporary passwords are about 15 bits, and child usernames can be enumerated (Medium, Suspected)

- `tempPassword()` (`src/core/classRoster.ts:54`) is one of 38 words plus 3 digits: 38,000 values, about 15.2 bits.
- `must_change_password` is a UX flag the child can clear (`child-login/route.ts:113-116`), so many students will keep
  it.
- Usernames are teacher-chosen and guessable. Any adult with one learner can test whether a username exists: the route
  answers `409 username_taken` (`route.ts:141,151`).
- Online guessing is limited only by Supabase Auth's per-IP sign-in limit, which is a dashboard setting I could not see.
- A takeover exposes one child's name, class, progress and exercise answers, and lets the attacker post as that child.
- **Fix (own):** two words plus 4 digits (about 30 bits), still easy to read aloud. Rafi should also confirm the Auth
  rate limits in the dashboard.

## SEC-06 — Crash reports store URL credentials (consent tokens, email token hashes) for 90 days (Medium, Suspected)

- `reportCrash` sends `url: window.location.href` (`src/infra/reportCrash.ts:45`), which includes the **fragment and
  query**. `toRow` stores it unchanged (`src/infra/errorSink.ts:55`). It lands in `error_events` (90-day TTL), in
  Vercel logs, and in `MONITORING_INGEST_URL` once that is set. Server `onRequestError` logs `request.path` with its
  query too (`src/instrumentation.ts`).
- A render crash on any of these pages persists a credential:
  - `/consent/respond#t=…` and `/consent/withdraw#t=…` — the consent token, which can **withdraw consent and delete
    every child**;
  - `/email/unsubscribe#t=…`;
  - `/auth/confirm?th=…`;
  - `/auth/set-password?token_hash=…`;
  - `/auth/callback#access_token=…&refresh_token=…` — supabase-js uses the implicit flow here; there is no `flowType`
    in `src/data/supabase/client.ts`.
- **Fix (own):** send `location.origin + location.pathname` only, and strip `?…`/`#…` again in `toRow`, because the
  endpoint is public. Q4 in the SQL file counts what is already stored.

## SEC-07 — `learners: delete` RLS lets an owner skip `delete_child_data`, and the app still uses that path (Medium, Measured)

- The known ROUND-2 §3.9 item is still live: consent stays `granted` and reusable, and B3 is not queued.
- ROUND-2 says "the app already deletes through `delete_learner`". That is **not fully true**: the class upload's
  rollback calls `deleteLearner` (`src/features/classes/Classes.tsx:166` → `src/data/repositories/learners.ts:148-155`),
  which is a raw `from('learners').delete()` that also swallows its error.
- **Fix (own):** switch that call to `deleteLearnerPermanently`, then drop the policy in a migration, in that order
  (expand/contract).

## SEC-08 — A child's own login can mint unlimited points (Low, Reproduced)

- `record_lesson_progress` pays 2 points per new `p_event` UUID and 15/10 per new lesson id. Any well-formed id counts,
  including modules that do not exist (`g8m99-t*`).
- Probe P2, as the child's own `self` account: 0 → **1000 points in 50 calls**.
- Integrity only: the parent's daily game minutes still bind, and `/play` is "coming soon".
- **Fix (own, later):** validate `p_lesson` against the real topic list, and cap problem points per lesson per day.

## SEC-09 — `/api/report-error` lets anyone write into a child's record and fill `error_events` (Low, Suspected)

- The route is anonymous and takes `learnerId` from the body (`src/app/api/report-error/route.ts:39`).
- With a child's UUID, anyone can attach arbitrary text that then appears in the parent's "download my child's data"
  export (`export_child_records.crashRecords`).
- Without one, anyone can fill the table at 30/min per IP per instance.
- **Fix (own):** attach `learnerId` only when a bearer token proves access; otherwise store null.

## SEC-10 — Workflows that hold production credentials use third-party actions pinned by tag, not SHA (Low, Measured)

- `supabase/setup-cli@v1` runs in `backup.yml` and `deploy.yml` (`migrate-staging`, `migrate-prod`) next to
  `SUPABASE_ACCESS_TOKEN` (an account-wide personal token) and `PROD_DB_PASSWORD`.
- A moved tag (the tj-actions pattern) exfiltrates both.
- What is fine:
  - `production-db` **has** required reviewers.
  - Default `GITHUB_TOKEN` permissions are `read`.
  - There is no `pull_request_target`.
  - Fork pull requests get no secrets.
- **Fix (own):** pin every `uses:` to a full SHA. Prefer a project-scoped database URL over the account PAT in
  `backup.yml`.

## SEC-11 — Header and CSP gaps on both sites (Low, Measured)

**radlic.com.** The live headers match `next.config.ts` exactly. Three small gaps:
- `connect-src https://*.supabase.co` allows **any** Supabase project, including an attacker's, as an exfiltration
  target if script injection ever lands.
- `Permissions-Policy camera=(self)` is left over from the deleted AR feature.
- `script-src 'unsafe-inline'` is the accepted V15.

**radlor.com.** It serves **no CSP, X-Frame-Options, nosniff or Referrer-Policy**, and HSTS without `includeSubDomains`.
- The page is static with no forms since the waitlist was hidden, so the risk is low.
- The one runtime third-party path is Next's `vercel.live` feedback script, which loads only when a `__vercel_toolbar`
  cookie is present.
- `check:site-claims` passed live (exit 0, controls green). It inspects HTML only, not runtime fetches.

**Fix (own):** pin `connect-src` to the project host, set `camera=()`, and add a header block to radlor-site's
`next.config`.

## SEC-12 — The parent PIN protects only the screen, not the data (Low, Suspected)

- Every action behind the PIN works with the session alone: `delete_learner`, `export_child_records`,
  `set_game_settings`, invites, `/api/child-login`. None of them check the PIN (read from the RPC bodies).
- That is fine for keeping a child out of the dashboard, but it must not be described as a security control in legal or
  help text.
- `delete_my_account` separately requires authentication within the last 10 minutes (`amr`), which is correct.
- **Fix (rafi, wording only).**

## SEC-13 — The admin console has no MFA requirement (Low, Suspected)

- `admin_assert()` checks only membership in `admin_users`.
- **Fix (own):** also require `auth.jwt()->>'aal' = 'aal2'` once an admin has TOTP enrolled.
- Output is cohort-suppressed aggregates, so this is Low.

## SEC-14 — `docs/security.md` is stale in five places (Low, Measured)

1. The quoted CSP is wider than live: it lists jsDelivr, `wasm-unsafe-eval` and `storage.googleapis.com`.
2. V13 is "OPEN — anon INSERT grant", but the catalog built from the migrations gives `diagnostic_leads` INSERT to
   `authenticated` only.
3. "All 12 DEFINER functions" is now **56 DEFINER** functions, 28 of them callable by `authenticated`, **0 by anon**,
   and all 67 public functions pin `search_path`.
4. The "Set `SUPABASE_DB_URL` to activate the CI RLS job" step is obsolete. CI builds a local database and runs 82
   assertions.
5. `/api/lead` no longer exists, but is still cited in `_rateLimit.ts` and `errorSink.ts`.

**Fix (own).**

## SEC-15 — Child data stays on the device after sign-out (Low, Suspected)

- `signOut` (`src/data/repositories/profile.ts:38-55`) clears only the session and `sessionStorage`.
- IndexedDB `milo/kv` keeps, per learner, the practice run (the last 40 question texts and the problem on screen), the
  lessons seen and the nudge dates. `localStorage` keeps plans.
- On a shared or school device the next user's browser still holds them. They are not readable across accounts on the
  server.
- **Fix (own):** clear `milo-*` keys and the `kv` store on sign-out.

## SEC-16 — `entitled_chapters` / `is_chapter_entitled` answer for any learner (Low, Reproduced)

- Probe P4: a stranger's account gets `{"g3m1": true}` for someone else's child. `game_wallet` refuses the same caller
  with 42501, as a control.
- It is a boolean oracle about subscription or plan state. It is meaningless while billing is not enforced.
- **Fix (own, later):** guard with `learner_access`.

## SEC-17 — Error responses name the missing configuration (Low, Measured)

- The consent routes return `missing: <ENV_VAR_NAME>` on 503 (`consent/request/route.ts:62`, `respond/route.ts:91`, `cancel-second-notice/route.ts:24`).
- The Stripe webhook echoes the signature library's error text on 400.
- Harmless now, but it tells a prober which secret is absent.
- **Fix (own):** log the detail and return only the code.

## What is clean (measured, with controls)

**Database (local stack).**
- **0** anon-executable functions in `public`; `search_path` pinned on all 67.
- The consent gate sits on **14** of the 18 `learner_id` tables. The 4 without it are the named exemptions:
  `learner_access`, `learner_invites`, `subscription_seats`, `parental_consents`.
- `diagnostic_items` and `diagnostic_plan_progress` hold child data keyed indirectly and are not gated, but no client can
  write them.
- As anon: `learners=0`, `learner_events=0`; `lesson_progress`, `point_events`, `parental_consents` and `error_events`
  are all DENIED (control: `chapters` returns 72).
- `learner_invites` UPDATE is column-scoped to `status` (V12 still holds).
- A parent pointing their child at another teacher's class is refused by `enforce_grade_ownership` (probe P3).
- `profiles.role` / `is_internal` are client-writable but grant nothing. Admin rights live in `admin_users`, which has
  no policies.

**Live bundle.** Across 31 live chunks there are 0 hits for any of these secret shapes: `service_role`, `sb_secret_`,
`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `STRIPE_SECRET`, `re_…_`, `sk_/rk_ live|test`, `whsec_`, JWT. The only
`NEXT_PUBLIC_*` names in the build are the Supabase URL, the anon/publishable keys and the site URL.

**API routes.**
- Stripe signature verification happens before any write.
- Consent and unsubscribe tokens are 256-bit, stored as hashes, carried in the fragment, and act only on POST.
- Emails escape everything they interpolate, and names are sanitised.
- Every PostgREST filter built from a string uses a UUID-validated or auth-derived value, or `encodeURIComponent`.
- No string-built SQL outside `format('%I')` on trigger args.
- No DOM-XSS sinks.
- No open redirect: confirm, callback and landing all route to fixed paths.
- No CORS headers on `/api/*`.
- The service worker never intercepts `supabase.co` or `/api/*`.
- `signOut` is global by supabase-js default.

**Supply chain and CI.** `npm audit` shows 0 vulnerabilities, prod and dev (550 dependencies). `production-db` has
required reviewers.

**radlor.com.** `check:site-claims` is green live, and `/radlic` HTML loads nothing off-origin. The 7 absolute URLs are
links to radlic.com.

## Could not verify (BLOCKED / needs Rafi)

- Production policy parity for SEC-02 (Q1), and the stored-credential count for SEC-06 (Q4). Both are in
  `docs/review/sql/sec-production-facts.sql`, which was dry-run on the local stack.
- Supabase dashboard settings: Auth rate limits, JWT expiry and refresh-token lifetime, leaked-password protection
  (the code comments say it is on), minimum password length, and MFA availability.
- Whether `BACKUP_PASSPHRASE` is the runbook's 32 random bytes (SEC-03), and when a restore was last rehearsed after the
  2026-09-23 fix.
- Key scopes: the Resend key's permissions (sending-only?) and whether Stripe uses a restricted key. The code does not
  reveal either.
- Whether SEC-01 was ever exploited: this needs Resend's log (see above).

## Findings table

| ID | title | area | severity (Critical/High/Medium/Low) | evidence (Measured/Reproduced/Suspected) | effort (S/M/L) | when | bucket (own/rafi) | files |
|---|---|---|---|---|---|---|---|---|
| SEC-01 | Sign-up pre-account-takeover: attacker's password survives the owner's email confirmation | auth | High | Reproduced | M | fix now — live beta sign-ups, targeted takeover of a parent account | rafi | src/app/api/auth/signup/route.ts, src/features/consent/server.ts, src/app/auth/confirm/page.tsx |
| SEC-02 | Viewer access cannot be revoked (learner_access DELETE → 42P17 for everyone); a hand-removed viewer can re-open the accepted invite | RLS | High | Reproduced | S | fix now — child data, one migration | own | supabase/migrations (new), src/data/repositories/learners.ts, supabase/tests/rls_regression.sql |
| SEC-03 | Encrypted prod dumps with children's data are public-repo artifacts; secrecy rests on one passphrase, CBC without MAC | backups/CI | High | Measured | M | fix now — confirm passphrase today, move storage after beta | rafi | .github/workflows/backup.yml, docs/backup-restore-runbook.md |
| SEC-04 | /api/auth/signup is an anonymous email relay from noreply@radlor.com (per-instance IP limit only) | API | Medium | Suspected | S | fix now — protects consent-email deliverability | own | src/app/api/auth/signup/route.ts, src/app/api/_rateLimit.ts |
| SEC-05 | Class temp passwords ≈15 bits; child usernames enumerable via 409 | auth | Medium | Suspected | S | after beta — few classes yet | own | src/core/classRoster.ts, src/app/api/child-login/route.ts |
| SEC-06 | Crash reports persist URL fragment/query credentials (consent token, token_hash, implicit-flow tokens) | logging | Medium | Suspected | S | fix now — one-line strip, 90-day store | own | src/infra/reportCrash.ts, src/infra/errorSink.ts, src/instrumentation.ts |
| SEC-07 | learners DELETE policy bypasses delete_child_data; Classes rollback still uses it | RLS/consent | Medium | Measured | S | after beta — needs expand/contract order | own | src/features/classes/Classes.tsx, src/data/repositories/learners.ts, supabase/migrations (new) |
| SEC-08 | A child's login can mint unlimited points via record_lesson_progress | RPC integrity | Low | Reproduced | S | later — /play spends nothing today | own | supabase/migrations (new) |
| SEC-09 | Anonymous /api/report-error can attach text to any child's export and fill error_events | API | Low | Suspected | S | after beta | own | src/app/api/report-error/route.ts, src/infra/errorSink.ts |
| SEC-10 | Third-party actions pinned by tag in jobs holding the Supabase PAT and prod DB password | CI | Low | Measured | S | after beta | own | .github/workflows/backup.yml, .github/workflows/deploy.yml, .github/workflows/ci.yml |
| SEC-11 | connect-src *.supabase.co wildcard, camera=(self) leftover; radlor.com sends no security headers | headers | Low | Measured | S | after beta | own | next.config.ts, ../radlor-site next.config |
| SEC-12 | Parent PIN is a UI gate only; must not be described as a data protection | auth/docs | Low | Suspected | S | later — wording check at publication | rafi | src/shared/ui/ParentPinGate.tsx, docs/legal/* |
| SEC-13 | Admin RPCs do not require MFA (aal2) | admin | Low | Suspected | S | later — aggregates only | own | supabase/migrations (new) |
| SEC-14 | docs/security.md stale (CSP, V13, DEFINER count, CI step, /api/lead) | docs | Low | Measured | S | after beta | own | docs/security.md, src/app/api/_rateLimit.ts, src/infra/errorSink.ts |
| SEC-15 | Per-learner practice data stays in IndexedDB/localStorage after sign-out | client privacy | Low | Suspected | S | after beta | own | src/data/repositories/profile.ts, src/infra/storage/kv.ts |
| SEC-16 | entitled_chapters/is_chapter_entitled answer for any learner (no access guard) | RPC | Low | Reproduced | S | later — billing not enforced | own | supabase/migrations (new) |
| SEC-17 | Error responses name missing env vars / echo signature errors | API | Low | Measured | S | later | own | src/app/api/consent/request/route.ts, src/app/api/consent/respond/route.ts, src/app/api/stripe/webhook/route.ts |
