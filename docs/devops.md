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
                 Supabase (managed): Auth (GoTrue) · Postgres + RLS + RPCs · Storage
                          │
                    (optional) read replica for /insights + parent dashboard
```

⚠️ **PITR was listed in this diagram and is NOT in the stack — the org is on the FREE plan**
(verified 2026-08-17 via the management API: `plan: "free"`). See *Plan reality* below before
trusting any line of this document about backups or staging.

⚠️ **THE DATABASE IS IN THE WRONG HEMISPHERE FOR THE MARKET, AND NOW IS THE CHEAPEST MOMENT TO
DECIDE.** Measured on production: `x-vercel-id: bom1::iad1` — the request enters at a Mumbai edge and
the **function executes in `iad1` (Virginia)**, while Supabase is **`ap-southeast-2` (Sydney)**.
- Server-side hops (`/api/lead`, `errorSink`) cross Virginia→Sydney. Both are best-effort and
  low-frequency, so this costs little **today**.
- The one that matters is the **browser**: this app talks to Supabase **directly** from the client,
  so every auth call, learner bootstrap and session sync from a UK/US child crosses to Australia
  (~250–300 ms RTT, before any query time). That is on the critical path of opening the app.
- A project's region is **fixed at creation**; changing it means a new project plus a data
  migration. With 17 learners that is an afternoon. At 10,000 it is a migration project.
  **Decide the target market's region before launch, not after.**

Three environments, identical topology, isolated data:

| Env | Frontend | Database | Trigger |
|-----|----------|----------|---------|
| **preview** | Vercel preview URL (per-PR) | Supabase preview branch (throwaway) | open a PR |
| **staging** | Vercel staging env | dedicated Supabase "staging" project | merge to `main` |
| **prod** | Vercel production | Supabase prod (`qaymxunzlarwusogwyak`) | approval gate in `deploy.yml` |

## CI/CD

- **`ci.yml`** (PRs + reused by deploy): tsc, unit tests, `next build`, `npm audit --audit-level=high`, RLS suite (when `SUPABASE_DB_URL` set).
- **`deploy.yml`** (push to `main`): CI → apply migrations to **staging** + RLS suite → apply to **prod** behind a **required-reviewer** gate. Migrations are CLI-managed (`supabase db push` over `supabase/migrations/`), replacing the old hand-applied-via-MCP flow.
- **`backup.yml`** (daily 02:30 UTC + manual): `supabase db dump` → **encrypted** → 30-day artifact.
  Exists only because the free plan has no downloadable backup; **delete it the day PITR is on.**
  The encryption is load-bearing, not decoration — the dump holds learner names and every session a
  child has played, and a workflow artifact is readable by anyone with repo access. It self-checks
  that the artifact is not a readable tarball before uploading.
- **`nightly-e2e.yml`** (daily 03:15 UTC + manual): builds, starts `next start -p 3017`, runs
  `all-chapters` — **211 tests, 70 chapters × 3 frames**. It answers the one question that decides
  launch day: *does all of it still open?* **Measured 7.7 min** against a production build (the ~18 min
  figure elsewhere is a DEV-server run — `next start` is about twice as fast); `ci.yml` keeps the fast
  gates where they can block a merge. Runs against a **production build on the runner, never against
  production** — a live sweep trips Vercel's firewall at ~40 navigations and reads as broken chapters.
- **Migrations must stay backward-compatible (expand/contract)** so code (auto-deployed by Vercel on push) and schema can land independently. For strict schema-before-code ordering, disable Vercel git auto-deploy and add a `vercel deploy --prod` step after `migrate-prod`.

- **`weekly-layout.yml`** (Mondays 04:40 UTC + manual): `short-landscape` — the layer-collision
  sweep for the teen shell, ~57 min. **Weekly, not nightly, on purpose:** nightly would be ~29
  runner-hours a month to re-measure layout constants that change a few times a year, and a slow
  gate people stop reading is worse than one that runs less often. Its defects arrive with a LAYOUT
  change, not with time — so dispatch it manually before a release or after touching `FitSlot` /
  `GameShell` / `kidKit`. If it ever starts finding things weekly, promote it to nightly **then**.

⚠️⚠️ **THE TWO E2E JOBS NEED DIFFERENT SERVERS, AND SWAPPING THEM FAILS QUIETLY.**
`nightly-e2e` runs against **`next start`** (production build): it only opens chapters and watches
the console, and a production build is both faster and a truer match for the shipped CSP/React.
`weekly-layout` must run against **`next dev`**, because it drives real questions through
`reachPractice`, which reads the `[data-test-answer]` / `[data-test-phase]` hooks — and those are
emitted **only by `next dev`**, dead-code-eliminated from any production build so the answer can
never ship to a child. Run it against `next start` and every `reachPractice` finds no board, so the
suite measures the wrong screen **and still passes**.

⚠️ **Both workflows hit the same empty-string trap, in two different disguises.** GitHub Actions
passes `''` for an unset `workflow_dispatch` input on a `schedule` run:
- `E2E_ONLY=''` parsed to an empty-but-**truthy** array → **211 chapter tests → 1**, green.
- `E2E_SEED=''` → `??` does not catch `''` and `Number('')` is **0** → the weekly would sweep seed
  `0` while every local and dispatched run used the pinned `20260817`, so a red result would not
  reproduce — which defeats the whole reason the suite was seeded.
Both are fixed **in the specs** (so a shell `export E2E_ONLY=` is safe too) and guarded in the
workflows. **Assume any `${{ inputs.x }}` reaching a spec is `''`, not unset.**

⚠️⚠️ **AND THE FIRST VERSION OF THAT NIGHTLY WOULD HAVE TESTED NOTHING, IN GREEN.** GitHub Actions
passes `''` for an unset `workflow_dispatch` input on a `schedule` run, and the spec parsed
`E2E_ONLY=''` into an **empty-but-truthy array** (`''?.split(',')` is `['']`, not `undefined`, because
optional chaining does not short-circuit on an empty string). Every chapter was then filtered out and
the only surviving test was the list-derivation guard — **211 tests → 1, reporting pass.** Proven by
reverting the fix and re-listing. Fixed at the root in the spec (empty means ALL) *and* in the
workflow (only export when non-empty), plus a new assertion that the selection is non-empty so a
typo'd `E2E_ONLY=decimls` fails loudly instead of sweeping zero chapters.

## One-time manual setup (dashboards — required to activate the above)

### Plan reality — read this before the checklist below

The org is on the **free plan**. Three consequences, from Supabase's own docs, and the first is the
single biggest availability risk this app has:

- ⚠️⚠️ **"We may pause applications on the Free Plan that exhibit low activity in a 7-day period."**
  This app has had **8 children ever play it**, and the last `chapter_open` was 2026-08-15 — so it is
  squarely in the population that gets paused. A paused project means **the app is down**: no auth,
  no sync, a login screen that never resolves. It is restorable from the dashboard, but only once
  somebody notices, and nothing currently watches. **This is why the uptime monitor below is not
  optional.** *"Upgrade to Pro to guarantee that we won't pause your project for inactivity."*
- ⚠️ **"Database backups are not available for download for Free Plan projects."** There is no
  restorable copy of the children's data that you control. Supabase's own recommendation for this
  tier is to *"regularly export their data using the CLI `db dump` command and maintain off-site
  backups"* — which is what `.github/workflows/backup.yml` now does.
- ⚠️ **PITR is a paid add-on.** The checklist below used to say "enable PITR"; on this plan that is
  not a box you can tick. Left in, marked, because it is the right thing to do the day you upgrade.

### Supabase
- [ ] ⚠️ **Decide on Pro (~$25/mo) BEFORE launch** — it is what buys no-pause, downloadable backups
      and PITR. On the free plan the app can be taken offline by its own quietness.
- [ ] Create a **staging project**. ⚠️ Supabase *branching* needs Pro; on free this means a second
      free project, and free orgs are capped at two active projects.
- [ ] ~~Enable **PITR**~~ — **not available on the free plan.** Do this the day you upgrade
      (Settings → Add-ons). Until then `backup.yml` is the only recoverable copy you own.
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

⚠️ **THE UPTIME CHECK MUST HIT THE DATABASE, AND `/api/health` DELIBERATELY DOES NOT.** That route is
a shallow liveness probe with no DB call — correct by design (a brief Supabase hiccup should not make
every instance look unhealthy). But on the free plan the realistic outage is **Supabase pausing for
inactivity**, and in that failure `/api/health` returns a cheerful `200` while no child can sign in.
**A monitor pointed only at `/api/health` would report green through the exact outage this app is
most likely to have.** Point a second check at something that reads the database — a signed-in
journey, or a `HEAD` on the Supabase REST endpoint — and alert on that separately.
| Errors | `instrumentation.ts` + `/api/report-error` → Sentry/Logtail (via `MONITORING_INGEST_URL`) | new error type; rate spike |
| Perf | Vercel Speed Insights | LCP/INP regression, p95 latency |
| DB | Supabase Observability + log drain | pool >80%, `42501` spike, replica lag |

**SLOs:** 99.9% availability · p95 page < 1s · p95 RPC < 300ms · error rate < 0.5%. Alert on SLO burn rate, not raw metrics.

See also [`docs/runbooks/rollback.md`](runbooks/rollback.md) and [`docs/security.md`](security.md).

## The production deploy is not gated by CI — and what it would cost to gate it

**Measured 2026-09-05.** `ci / rls-tests` failed on five consecutive commits to `main`
(`2d55790`, `9b82cea`, `ece7281`, `3e1b9d5`, `020a051`) and **all five deployed to production
anyway**, `state: READY`, `target: production`. There is no branch protection on `main`, no
required status check, and — until `red-main.yml` — nothing that reacted to a failed run.

Vercel's Git integration builds on push, independently of GitHub Actions. CI has never gated a
deploy on this repo.

### What exists now

`red-main.yml` files (or comments on) a GitHub issue when CI fails on `main`. **That is a signal,
not a gate** — it makes a red main impossible to miss; it does not stop the commit going live.
Both of its branches were driven by hand before being trusted (it creates once, comments after),
and its first version could not have fired at all: `gh` needs `-R` in a job with no checkout.

### The cheapest real gate — one Vercel setting plus ~10 lines

Point Vercel's **Production Branch** at `release` instead of `main`, then have `deploy.yml` push
`main` to `release` only after CI passes:

```yaml
  promote:
    needs: ci                     # red CI -> this job never runs -> release never moves
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - run: git push origin HEAD:release
```

Why this shape rather than the alternatives:

- **it needs no Vercel token** — the promotion is a git push, using `GITHUB_TOKEN`;
- **it does not change how anyone works** — you still push to `main`;
- **preview deploys keep working** from `main`, so you can still look at a branch before it is live;
- **branch protection would not work here**: required status checks only gate *merges via PR*, and
  a direct push to `main` runs its checks after the push has already happened;
- **Vercel's "Ignored Build Step" would not work either**: Vercel starts building within seconds of
  the push, while CI takes minutes, so the commit status is almost always still `pending` — treating
  pending as "deploy" makes it useless and as "don't deploy" blocks everything.

⚠️ **Not implemented, deliberately.** It changes what "pushed to main" means, and that is the
founder's call. Until it is, assume every commit on `main` is live within about two minutes,
whatever CI says.
