# Runbook: capacity

**Use this when:** you want to know how many children the app can carry, whether it is time to buy more of something,
or you want to re-run the load test and compare it with the last one.

Every number below is dated. A number is true on the day it was measured; re-measure before you rely on an old one.

## What carries what

| Piece | What it serves | Plan (16 Oct 2026) |
|---|---|---|
| Vercel | the pages (static, from the CDN) and a few small API routes | Pro, functions in iad1 |
| Supabase | the database, sign-in, lesson audio | Pro, **Micro** compute (1 GB RAM, 2 shared cores, 60 connections) |
| Resend | every email (sign-up, consent, password reset) | **Free: 100 emails a day** |
| Cloudflare (inside Supabase Storage) | the audio clips, cached at the edge | included |

The browser talks to Supabase directly for nearly everything a child does, so **the database is what a crowd of
children loads**. Vercel only hands out pages and a handful of API calls.

## Measured on 16 Oct 2026

### Pages and API (production, from India)

- Pages come from Vercel's Mumbai edge (`bom1`): first byte in **25–50 ms** when warm, about 500 ms on a cold first hit.
  The HTML is a few KB; each page loads about 0.8–1 MB of JavaScript.
- API routes over 7 days (Vercel observability, median): `/api/child-login` 259 ms, `/api/auth/signup` 550 ms,
  `/api/game-time` 95 ms, `/api/health/db` 170 ms. The daily consent cron takes about 2.7 s.
- App database queries averaged **2.3 ms** inside Postgres (`pg_stat_statements`, one read the day of the audit).
- Audio clips came from Cloudflare's Mumbai edge as cache HITs (`cf-ray …-BOM`, `cf-cache-status: HIT`).

### Load test (staging, `scripts/load-staging.mjs`)

Staging is on Supabase's **free plan (Nano compute: 0.5 GB RAM)**, a weaker machine than production's Micro. So what
staging carries, production carries at least as well. That makes this a floor, not a ceiling.

Each fake child is a real parent account with one child under a granted consent, and does what the app does: opens
`/modules` (learners, progress, wallet), then sends one answer through `sync_batch` about every 8 seconds, with a
wallet check every fifth answer. Times are measured on a Mac in India, so each includes about 250 ms of network to
us-east-1.

| Children at once | Requests/s | Answer p50 / p95 / p99 | Wallet p95 | App open p95 | Errors |
|---|---|---|---|---|---|
| 50 | 7.5 | 293 / 424 / 796 ms | 462 ms | 1,018 ms | 0 / 1,419 |
| 100 | 14.9 | 293 / 422 / 765 ms | 398 ms | 872 ms | 0 / 2,829 |
| 250 | 37.4 | 295 / 420 / 540 ms | 405 ms | 800 ms | 1 / 7,113 (a client connect timeout) |
| 500 | 74.7 | 298 / 424 / 521 ms | 430 ms | 788 ms | 0 / 14,194 |
| **1,000** | **148.6** | **328 / 513 / 860 ms** | 605 ms | 1,285 ms | **0 / 28,240** |

What the database showed during the 1,000 step (Supabase → Observability → Database):

- CPU peaked at about **40%**, and sat near 2% otherwise.
- Connections stayed at **17 of 60** for the whole test, because PostgREST pools them.
- Disk IOPS and throughput stayed near zero, so the work stayed in memory.
- **Memory** commitment reached its limit at the end. On Nano this is the first resource to run out.
- Database size went from about 0.03 GB to 0.04 GB. `point_events` is the largest table, at about 11 MB after the test.

**Reading.** At 1,000 children the server itself added about 80 ms per answer (328 ms median minus about 250 ms of
network), with no errors. Production has twice staging's memory and more CPU, so it should carry **about 2,000
children at once** before a compute upgrade. That is an estimate from these numbers, not a measurement on production.
Children are rarely all online at the same moment, so 1,000–2,000 at once means roughly 10,000–20,000 families.

**Not tested:** Vercel under load (pages are CDN-cached; this test did not touch Vercel); sign-up and email (Resend
limits those, see below); the teacher dashboard (hidden); audio egress at scale.

## What runs out first, and when to act

| Limit | Where to look | Act at | What to do |
|---|---|---|---|
| Emails (Resend free, 100/day ≈ 40–50 sign-ups) | Resend → Usage | 50 a day | Resend Pro (50,000 a month) |
| Database memory and CPU | Supabase → Observability → Database | memory commitment at its limit, or CPU 60%+ for long | Supabase → Compute → Small (each step roughly doubles) |
| Database connections | the same report | 70% of max | a compute step (connections come with it) |
| Slow queries | Supabase → Observability → Query Performance | an app query averaging 100 ms+ | an index or a query fix |
| Audio and cached egress | Supabase → Usage | 50% of the plan by mid-month | accept the overage, or move audio to R2 (`docs/runbooks/audio-upload.md`) |
| Spend | Vercel budget alerts (50/75/100%), Supabase spend cap | an alert email | read what grew before raising anything |

Rule of thumb: when a limit is close, buy the next size first (one click), then optimise at leisure.

## Re-run the load test (staging only)

The script refuses to run against production. It reads production's ref from `scripts/assert-prod-ref.sh` and
refuses before it contacts anything if the target or a key names production.

1. **Founder:**
   - Open `radlic-staging` and check it is not paused.
   - Go to Authentication → Rate Limits. Note the value of "sign-ups and sign-ins", then raise it to 2000.
     Sign-ins are metered as a rate of about 6–7 a second, so the script signs in about 4 a second.
2. **Founder, in one terminal.** `read -s` keeps the values off the screen. The anon key is the staging project's
   public key.
   ```bash
   read -rs STAGING_SERVICE_ROLE_KEY && export STAGING_SERVICE_ROLE_KEY
   read -rs SEED_PASSWORD && export SEED_PASSWORD            # any 12+ characters; the fake accounts' password
   export STAGING_PROJECT_REF=<staging ref> STAGING_ANON_KEY=<staging anon/publishable key>
   node scripts/load-staging.mjs setup 1000
   node scripts/load-staging.mjs run                          # STEPS=50,100 STEP_SECONDS=60 for a short trial
   node scripts/load-staging.mjs cleanup                      # must end "fake accounts left: 0"
   ```
3. **Founder:** while it runs, screenshot Supabase → Observability → Database (CPU, memory, connections). Afterwards,
   set the rate limit back to its old value.
4. **Agent:** add a dated row to the table above. Never edit an old row: the history is the point.

The script prints counts and milliseconds only, never a key, a token or an email. It stops by itself once errors pass
5% or the answer p95 passes 3 s, because that step is past the limit.
