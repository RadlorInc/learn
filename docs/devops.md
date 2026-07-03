# DevOps / production operations

How Milo is deployed, scaled, and kept up — and the one-time manual setup that lives in
dashboards (Supabase / Vercel / GitHub), which code can't do for you.

## Architecture

```
Users ──HTTPS/HSTS──► Vercel Edge (CDN, WAF, TLS, security headers, image optimizer)
                          │
              ┌───────────┼────────────┐
        static/ISR   RSC + /api/*   instrumentation.ts ──► MONITORING_INGEST_URL / Vercel logs
         (CDN)       (functions)         onRequestError
                          │ supabase-js (bearer JWT over HTTPS/PostgREST — NOT raw pg)
                          ▼
                 Supabase (managed): Auth (GoTrue) · Postgres + RLS + RPCs · Storage · PITR
                          │
                    (optional) read replica for /insights + parent dashboard
```

Three environments, identical topology, isolated data:

| Env | Frontend | Database | Trigger |
|-----|----------|----------|---------|
| **preview** | Vercel preview URL (per-PR) | Supabase preview branch (throwaway) | open a PR |
| **staging** | Vercel staging env | dedicated Supabase "staging" project | merge to `main` |
| **prod** | Vercel production | Supabase prod (`qaymxunzlarwusogwyak`) | approval gate in `deploy.yml` |

## CI/CD

- **`ci.yml`** (PRs + reused by deploy): tsc, unit tests, `next build`, `npm audit --audit-level=high`, RLS suite (when `SUPABASE_DB_URL` set).
- **`deploy.yml`** (push to `main`): CI → apply migrations to **staging** + RLS suite → apply to **prod** behind a **required-reviewer** gate. Migrations are CLI-managed (`supabase db push` over `supabase/migrations/`), replacing the old hand-applied-via-MCP flow.
- **Migrations must stay backward-compatible (expand/contract)** so code (auto-deployed by Vercel on push) and schema can land independently. For strict schema-before-code ordering, disable Vercel git auto-deploy and add a `vercel deploy --prod` step after `migrate-prod`.

## One-time manual setup (dashboards — required to activate the above)

### Supabase
- [ ] Create a **staging project**; note its project-ref + DB password + pooler connection string.
- [ ] Enable **PITR** (Point-in-Time Recovery) on prod (Database → Backups). Verify daily backups.
- [ ] **Auth rate limits** (Auth → Rate Limits): cap sign-in / sign-up / OTP per hour. This is the real API-abuse perimeter — the app talks to Supabase **directly** (supabase-js over HTTPS), so Vercel can't rate-limit auth/RPC traffic; Supabase must.
- [ ] Enable **leaked-password protection** (carried over from the security pass).
- [ ] Add a **log drain** (Project → Logs → drains) → your sink; alert on `42501` (RLS-denial) spikes.

### Vercel
- [ ] Create a **staging environment** (or a `staging` branch mapped to a preview env with staging Supabase env vars).
- [ ] Enable **Speed Insights + Analytics** (Core Web Vitals, route latency).
- [ ] **Firewall / WAF rules** (Vercel Firewall): rate-limit page/asset traffic + add IP rules as needed. (Covers Vercel-fronted traffic only — see the Supabase note above for API abuse.)
- [ ] Set **`MONITORING_INGEST_URL`** env (all envs) to activate error forwarding from `instrumentation.ts` + `/api/report-error`.

### GitHub (repo → Settings)
- [ ] **Environments**: create `staging` and `production`; add a **required reviewer** on `production` (this is the prod migration approval gate).
- [ ] **Secrets**: `SUPABASE_ACCESS_TOKEN`, `STAGING_DB_PASSWORD`, `PROD_DB_PASSWORD`, `STAGING_DB_URL` (pooler URL for the RLS suite), and (existing) `SUPABASE_DB_URL`.
- [ ] **Variables**: `STAGING_PROJECT_REF`, `PROD_PROJECT_REF` (= `qaymxunzlarwusogwyak`).

## Scaling notes (specific to this stack)

- **Connections:** the app uses **supabase-js over PostgREST (HTTPS)**, not raw Postgres connections — so the classic "serverless exhausts the pg pool" problem is largely handled by PostgREST. Raw connections only matter for `supabase db push` (migrations) and any future server-side `pg`; those should use the **Supavisor pooler (transaction mode)**, not port 5432 direct.
- **Reads:** `/insights` + parent dashboard are the heaviest reads and already use the `get_insights_rollup` / `get_parent_dashboard` RPCs (N+1 killed). At scale, add a **read replica** and point those RPCs at it.
- **Static-first:** the whole app is `○ Static` + CDN-cached — keep it that way (it's why nonce-CSP was rejected). Use ISR for semi-dynamic content.
- **Abuse bounds already in place:** ownership-guarded RPCs, `enforce_learner_cap` (≤25/account), event retention, and the derived-server-side scores (V2) — so the RPC surface can't be used to write others' data or inflate the economy even without a rate limiter.

## Monitoring layers

| Layer | Tool | Alert on |
|-------|------|----------|
| Uptime | BetterStack/Pingdom on `/api/health` + a signed-in journey | 2 failed checks |
| Errors | `instrumentation.ts` + `/api/report-error` → Sentry/Logtail (via `MONITORING_INGEST_URL`) | new error type; rate spike |
| Perf | Vercel Speed Insights | LCP/INP regression, p95 latency |
| DB | Supabase Observability + log drain | pool >80%, `42501` spike, replica lag |

**SLOs:** 99.9% availability · p95 page < 1s · p95 RPC < 300ms · error rate < 0.5%. Alert on SLO burn rate, not raw metrics.

See also [`docs/runbooks/rollback.md`](runbooks/rollback.md) and [`docs/security.md`](security.md).
