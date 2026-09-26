# Security runbook

How the app is defended, how to keep it that way, and the manual steps that live outside code.

## The layers

| Layer | Where | Notes |
|-------|-------|-------|
| **RLS** | Postgres | The real access boundary. Every public table has RLS on + a policy scoped by `auth.uid()`/JWT email. Snapshot: [`supabase/schema/security_baseline.sql`](../supabase/schema/security_baseline.sql). |
| **SECURITY DEFINER RPCs** | many — e.g. `record_lesson_progress`, `save_practice_run`, `get_parent_dashboard`, the consent functions | Each self-guards on ownership (`learner_access` / `auth.uid()`), pins `search_path`, and has EXECUTE revoked from `anon`. Do not trust a count written here: `src/__tests__/securityDefinerDrift.test.ts` refuses an undeclared DEFINER / `search_path` change in any migration, and `rls_regression.sql` A8c asserts the API cannot reach the retention function. The live inventory is query 3 of *Schema drift check* below, run by Rafi. |
| **Security headers** | [`next.config.ts`](../next.config.ts) | `X-Frame-Options`, `nosniff`, `Referrer-Policy`, **HSTS**, **Permissions-Policy**, **CSP** (see below). |
| **Client guard** | `useAuthGuard` | UX-only gate; RLS is the boundary. |

## RLS regression tests — the guardrail

[`supabase/tests/rls_regression.sql`](../supabase/tests/rls_regression.sql) impersonates an attacker + an owner and asserts the attacker is **denied** (read, forge-invite → V1, self-grant, read sessions/stats) while the owner is allowed. Runs in a rolled-back transaction; a failed assertion exits non-zero.

CI's `rls-tests` job (`.github/workflows/ci.yml`) runs it on **every push**: it starts a throwaway local
Postgres, applies every migration from zero, runs the suite, and fails if the assertion count it prints
(`RLS_ASSERTIONS=`) drops. It needs no secret and cannot skip. Locally, run it only against a local stack
(`127.0.0.1`) — never against production. Add a new assertion whenever you add a table or policy.

## Schema drift check

The base schema lives in the Supabase dashboard, so it can change with no code diff. Regenerate the baseline and diff it:

⚠️ **The generator query used to say "see git history / the audit session" — i.e. it was lost, so the
step was not runnable and the baseline went 6 weeks stale** (it predated `diagnostic_leads`,
`auth_events` and `error_events`). Here it is, in full. ⛔ **Rafi runs all four parts himself in the
Supabase SQL editor** (CLAUDE.md: no agent queries production, not even a read-only SELECT); update
[`security_baseline.sql`](../supabase/schema/security_baseline.sql) from his output:

```sql
-- 1. RLS on + policy count per table (a table with rls=t and policies=0 is deny-all — intentional
--    for error_events, a BUG anywhere else).
select c.relname, c.relrowsecurity as rls,
       (select count(*) from pg_policy p where p.polrelid = c.oid) as policies
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' order by 1;

-- 2. Every access predicate, with the roles it applies to. `roles` empty = PUBLIC (all roles).
select c.relname, p.polname, p.polcmd,
       array(select rolname from pg_roles where oid = any(p.polroles)) as roles,
       pg_get_expr(p.polqual, p.polrelid)      as using_expr,
       pg_get_expr(p.polwithcheck, p.polrelid) as check_expr
from pg_policy p join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' order by 1, 3, 2;

-- 3. Function security posture. Flags the two traps at once: an unpinned search_path, and the
--    PUBLIC-EXECUTE default that made V19 (any anon caller could wipe the crash log).
select p.proname, p.prosecdef as definer,
       (p.proconfig is null or not exists (
          select 1 from unnest(p.proconfig) c where c like 'search_path=%')) as search_path_unpinned,
       coalesce(array_to_string(p.proacl::text[], ' | '), 'DEFAULT = PUBLIC EXECUTE') as acl
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prokind = 'f' order by p.prosecdef desc, 1;

-- 4. COLUMN-level grants. Do not skip this one: the V12 fix (invite repointing) lives ENTIRELY in a
--    column grant, and it is invisible to the table-level grant query.
select table_name, grantee, column_name, privilege_type
from information_schema.column_privileges
where table_schema = 'public' and grantee in ('anon','authenticated')
  and privilege_type in ('INSERT','UPDATE') order by 1, 2, 3;
```

A non-empty diff = the live security posture changed; review why.

## Content-Security-Policy — status & roadmap

The policy lives in [`next.config.ts`](../next.config.ts) and is enforced (not Report-Only). **It is not
quoted here on purpose:** a copy in this file drifted wider than the live header for weeks (it still
listed jsDelivr, `storage.googleapis.com` and `wasm-unsafe-eval` after the AR path that needed them was
deleted on 2026-09-20). Read the source, or the live header with `curl -sI https://radlic.com`.
`src/__tests__/cspHeader.test.ts` drives the real `headers()` and gates what must never be in it.

**`script-src 'unsafe-inline'` is an accepted risk (V15), not an oversight**, and the reasoning is
what matters if anyone revisits it:

- Removing it means a **per-request nonce**, which forces Next to render every page dynamically.
  Production currently serves `x-vercel-cache: PRERENDER` — so the cost is static rendering across
  the whole app, for every user, forever.
- `require-trusted-types-for 'script'` is the nonce-free alternative. The original objection — it
  would likely break the AR camera path (MediaPipe from jsDelivr) — is gone with AR (deleted
  2026-09-20), so this is worth re-evaluating; it has not been tried as of 2026-09-26.
- The risk is low **only because the app has no injection sink at all**: zero
  `dangerouslySetInnerHTML`, zero `innerHTML`, zero `eval`, and React escapes by default.

**So the premise is gated instead of the header.** `src/__tests__/security.test.ts` fails the build the
day a DOM-XSS sink appears anywhere in `src/` — at which point `'unsafe-inline'` stops being
acceptable and this decision must be re-opened. **Revisit when user-generated content ships.**

## Monitoring

[`src/instrumentation.ts`](../src/instrumentation.ts) (`onRequestError`) logs structured server errors — visible in Vercel logs today. Set **`MONITORING_INGEST_URL`** to forward them to an external sink; for full Sentry, add `@sentry/nextjs` and swap the `fetch` for `Sentry.captureException` (the seam is marked). Watch for spikes of `42501` (RLS denials) around auth/RPC paths — that's the probing tripwire.

## Audit 2026-08-17 — V13–V20

Continues the V1–V12 numbering from the earlier audit. **No critical or high finding.** Tenant
isolation was re-verified live rather than read off the migrations: as `anon`, `learners`, `sessions`
and `learner_invites` all return **0 rows**, and `diagnostic_leads` / `error_events` are refused
`42501` outright.

| V | finding | severity | status |
|---|---|---|---|
| **V13** | `diagnostic_leads` anon `INSERT` grant bypasses `/api/lead`'s rate limit + validation | Medium | ✅ fixed — `20260823221818_leads_server_only.sql` revokes the anon `INSERT`. `/api/lead` itself was deleted with the placement check (2026-09-20). |
| **V14** | `/api/lead` did `await fetch(...)` with no `res.ok` check — `fetch` does not throw on 4xx/5xx, so a 403 returned `{ok:true}` and the lead vanished with **no signal anywhere** | Medium | ✅ fixed — both server write paths report via `sinkError`; gated |
| **V15** | CSP `script-src 'unsafe-inline'` | Low–Med | 📌 **accepted** — see the CSP section above; premise gated instead |
| **V16** | `error_events` had no retention (holds `url`/`ua`/`stack`/`learner_id` — telemetry linked to a child) | Low | ✅ fixed — `pg_cron` job `prune-error-events`, daily 03:17, 90-day TTL |
| **V17** | `learners.date_of_birth` — an exact birthdate on a child, written `null` by its only caller and **never read**; 0 of 17 rows held a value | Low | ✅ fixed — column dropped, param removed, gated so it cannot return |
| **V18** | Rate limiter called `hits.clear()` when full, so filling the map reset **every** counter | Low | ✅ fixed — evicts oldest 10%; gated |
| **V20** | `netlify.toml` — an unmaintained second deploy config: no security headers of its own, and `/assets/* immutable` contradicting the deliberate 30-day+SWR choice in `next.config.ts` (art is rewritten in place, so `immutable` strands clients). Also the platform whose `x-forwarded-for` handling the rate limiter depends on. | Info | ✅ fixed — deleted |
| **V19** | ⚠️ **Self-inflicted, caught before it settled.** `prune_error_events()` was created `SECURITY DEFINER`, which Postgres gives **`PUBLIC EXECUTE`** by default — and Supabase exposes every public-schema function at `/rest/v1/rpc/<name>`. Any anonymous caller could have wiped the crash log. | High (transient) | ✅ fixed — `revoke all … from public, anon, authenticated`; verified `42501` |

⚠️ **The V19 trap generalises: any new `SECURITY DEFINER` function in `public` is anon-callable until
you revoke it.** Always pair `create function … security definer` with an explicit `revoke`, and check
`proacl` afterwards rather than trusting a successful migration.

Regressions are gated by [`src/__tests__/security.test.ts`](../src/__tests__/security.test.ts)
(no DOM-XSS sinks · `res.ok` on server writes · no `hits.clear()` · no date-of-birth collection).
All four were mutation-tested — each defect planted and watched fail.

## Manual steps (dashboard — not codeable)

- [x] ~~**V13 — close the anon lead-insert bypass.**~~ Done: `20260823221818_leads_server_only.sql`.
- [ ] **Leaked-password protection** (V6): Auth → Password → enable HaveIBeenPwned check.
- [ ] **Refresh-token lifetime**: Auth → shorten (mitigates the localStorage-token exposure, since the app stores the session in `localStorage`).
- [ ] **Set `MONITORING_INGEST_URL`** (or wire Sentry) to activate error forwarding.

## `/api/stripe/webhook` — a public endpoint that is NOT rate-limited, deliberately

Added 2026-08-25 (billing Stage 2b). It is the one public POST in the app with no IP rate limit, and
that is a decision rather than an omission:

- **It authenticates by SIGNATURE, not by origin.** `stripe.webhooks.constructEvent` verifies an
  HMAC over the raw body with `STRIPE_WEBHOOK_SECRET` and rejects anything else with a 400 **before
  a single byte is written anywhere** — driven, not read (`billingStripe.test.ts` asserts the
  outbound call list is empty on a bad signature).
- **A rate limit here drops real events.** Stripe delivers from a wide, changing IP range and gives
  up after ~3 days of retries; a limiter that sheds a burst of legitimate deliveries loses money
  quietly. The other public POSTs (e.g. `/api/report-error`) are limited because an anonymous caller
  can write a row; here they cannot.
- **The unsigned case is not logged as a crash**, on purpose: an unsigned POST to a public URL is a
  scan, and routing it to `sinkError` would fill the crash sink exactly when somebody starts probing.

⚠️ Its service-role key writes `subscriptions`, `subscription_seats` and `billing_events` — all three
deny-all to `anon`/`authenticated`. There is **no anon fallback** (the deleted `/api/lead` had one, for
an unrelated reason): if it ever worked, it would mean the paywall's own tables were writable
from a browser.

## Known accepted items

- Session JWT in `localStorage` (standard Supabase-SPA tradeoff; mitigated by CSP + short refresh token).
- `chapters` SELECT `using(true)` — public, non-sensitive catalog.
- ~~`touch_grades_updated_at()` retains anon/authenticated EXECUTE~~ ✅ **FIXED 2026-08-17** — revoked.
  It was the last function in `public` still callable from the API. "Low risk because it returns
  `trigger`" is a worse guarantee than "not callable", and it is the same class as V19.
  **As measured 2026-08-17** no function in `public` retained PUBLIC/anon EXECUTE and the 12 DEFINER
  functions of that day all pinned `search_path`. The count has grown several-fold since (the
  2026-09-26 review counted 56 DEFINER functions from the migrations); do not quote a number — query 3
  of *Schema drift check* (run by Rafi) is the live answer, `securityDefinerDrift.test.ts` gates
  undeclared changes, and A8c gates the V19 function.
- **CSP `script-src 'unsafe-inline'` (V15)** — cost of removing it is static rendering app-wide plus
  (before 2026-09-20) a likely AR break; premise (zero DOM-XSS sinks) is gated instead. Re-open when UGC ships.
- **(As of 2026-08-17; these RPCs belong to the chapter/placement write path, and new-flow lessons write through `record_lesson_progress` / `save_practice_run` instead.)** **The four `SECURITY DEFINER` advisor WARNs are intentional, not findings.** `sync_session`,
  `sync_recheck`, `sync_diagnostic` and `can_self_grant_access` each verify ownership
  (`learner_access.parent_id = auth.uid()` / `created_by`) and each pins `SET search_path`, closing
  the classic hijack. Re-verified 2026-08-17 — do not "fix" these by revoking EXECUTE; the app calls them.
- **`sync_session` clamps and derives server-side** (`stars 0–3`, `correct/wrong 0–200`, XP/coins
  computed in the function), so a tampered client cannot inflate the economy. Verified, worth keeping.
- **The rate limiter's IP key is Vercel-specific.** `callerKey` trusts `x-forwarded-for`, which is
  safe *because Vercel overwrites it and does not forward external IPs* (confirmed against Vercel's
  docs). On a host that passes client XFF through, the limiter becomes bypassable with one header.
  `netlify.toml` was deleted (V20) partly for this reason — do not reintroduce a second deploy
  target without revisiting this.
