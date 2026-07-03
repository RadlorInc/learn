# Security runbook

How the app is defended, how to keep it that way, and the manual steps that live outside code.

## The layers

| Layer | Where | Notes |
|-------|-------|-------|
| **RLS** | Postgres | The real access boundary. Every public table has RLS on + a policy scoped by `auth.uid()`/JWT email. Snapshot: [`supabase/schema/security_baseline.sql`](../supabase/schema/security_baseline.sql). |
| **SECURITY DEFINER RPCs** | `sync_session`/`sync_diagnostic`/`sync_recheck` | Each self-guards on `learner_access` ownership + pins `search_path`; anon EXECUTE revoked. `sync_session` **derives** xp/coins server-side (clients can't inflate them). |
| **Security headers** | [`next.config.ts`](../next.config.ts) | `X-Frame-Options`, `nosniff`, `Referrer-Policy`, **HSTS**, **Permissions-Policy**, **CSP** (see below). |
| **Client guard** | `useAuthGuard` | UX-only gate; RLS is the boundary. |

## RLS regression tests — the guardrail

[`supabase/tests/rls_regression.sql`](../supabase/tests/rls_regression.sql) impersonates an attacker + an owner and asserts the attacker is **denied** (read, forge-invite → V1, self-grant, read sessions/stats) while the owner is allowed. Runs in a rolled-back transaction; a failed assertion exits non-zero.

```bash
# Point at a TEST/branch database, never prod:
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_regression.sql
```

CI runs this automatically **when the `SUPABASE_DB_URL` secret is set** (see `.github/workflows/ci.yml`). Recommended: create a [Supabase preview branch](https://supabase.com/docs/guides/platform/branching) or a throwaway test project and set its pooler connection string as the repo secret. Add a new assertion here whenever you add a table or policy.

## Schema drift check

The base schema lives in the Supabase dashboard, so it can change with no code diff. Regenerate the baseline and diff it:

```sql
-- Run against prod, save output over supabase/schema/security_baseline.sql, then `git diff`.
-- (Full generator query: see git history of this file / the audit session. Short form:)
select relname, relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and relkind='r' order by 1;
select tablename, policyname, cmd, qual, with_check from pg_policies where schemaname='public' order by 1,3,2;
```

A non-empty diff = the live security posture changed; review why.

## Content-Security-Policy — status & roadmap

The app is **fully static-rendered**, so a nonce-based strict CSP isn't viable (Next requires dynamic rendering on every page for nonces — killing static/CDN caching + risking AR/OAuth). Current split in `next.config.ts`:

- **Enforced** (`Content-Security-Policy`): the zero-risk subset — `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, `form-action`, `upgrade-insecure-requests`. Deliberately **no `default-src`** (would cascade and break scripts/fetch).
- **Report-Only** (`…-Report-Only`): the full strict policy, collecting violations.

**To finish enforcement:** (1) add a `report-uri`/`report-to` endpoint and watch the Report-Only violations for a week; (2) the app already ships no inline scripts of its own (SW registration is in `public/sw-register.js`), so the only script-src gap is Next's static-hydration inline scripts — clear those with experimental [`sri`](https://nextjs.org/docs/app/guides/content-security-policy#subresource-integrity-experimental) (`experimental.sri`, keeps static rendering); (3) then move the strict policy from `-Report-Only` to enforced.

## Monitoring

[`src/instrumentation.ts`](../src/instrumentation.ts) (`onRequestError`) logs structured server errors — visible in Vercel logs today. Set **`MONITORING_INGEST_URL`** to forward them to an external sink; for full Sentry, add `@sentry/nextjs` and swap the `fetch` for `Sentry.captureException` (the seam is marked). Watch for spikes of `42501` (RLS denials) around auth/RPC paths — that's the probing tripwire.

## Manual steps (dashboard — not codeable)

- [ ] **Leaked-password protection** (V6): Auth → Password → enable HaveIBeenPwned check.
- [ ] **Refresh-token lifetime**: Auth → shorten (mitigates the localStorage-token exposure, since the app stores the session in `localStorage`).
- [ ] **Set `SUPABASE_DB_URL`** repo secret (test/branch DB) to activate the CI RLS job.
- [ ] **Set `MONITORING_INGEST_URL`** (or wire Sentry) to activate error forwarding.

## Known accepted items

- Session JWT in `localStorage` (standard Supabase-SPA tradeoff; mitigated by CSP + short refresh token).
- `chapters` SELECT `using(true)` — public, non-sensitive catalog.
- `touch_grades_updated_at()` retains anon/authenticated EXECUTE — harmless INVOKER trigger fn; minor cleanup.
