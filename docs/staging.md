# Staging

A second Supabase project holding **fake data only**, so migrations are tried somewhere before
production and nobody has to run the app against real children's records.

> ⚠️ **As of 2026-09-23 there is no staging project, and `.env.local` in the founder's checkouts points at
> PRODUCTION.** Anyone running `npm run dev` there reads and writes the live database. That is a risk to
> fix by following this page, not by editing anyone's file for them.

What exists in the repo today (none of it needs production):

| | |
|---|---|
| `scripts/seed-staging.mjs` | fills a staging database with fake parents, a teacher, a class, children (each under a granted consent) and lesson progress. Refuses production before it connects. |
| `.github/workflows/deploy.yml` | `migrate-staging` applies migrations to staging on every push to `main` once `STAGING_PROJECT_REF` is set; `migrate-prod` then waits for it to succeed. |
| `src/__tests__/stagingPrep.test.ts` | proves both of the above: the seed's refusals, and the deploy order with `STAGING_PROJECT_REF` unset vs set. |

## 1. Create staging (founder, once)

Things to **confirm** on Supabase's pricing page before starting, not facts from here: a free organisation
allows **2 active free projects**; a free project is **paused after ~7 days without activity** and must be
restored from the dashboard. A paused staging project makes `migrate-staging` fail, and that blocks every
production migration until it is restored (that is the staging-first rule working, not a bug).

1. **supabase.com/dashboard → your account menu → New organization.** Name it e.g. `Radlor Staging`, plan **Free**.
   (A separate free organisation keeps staging off the production organisation's bill.)
2. **New project** in that organisation. Name `adaptivelearn-staging`. Set a strong database password and
   keep it in your password manager (it becomes `STAGING_DB_PASSWORD`). **Region: East US (North Virginia),
   `us-east-1`** — the same region as production.
3. When it is ready: **Project Settings → General → Reference ID** — that is the staging ref. Check it is
   **not** `wrnjqjhrbnqxornmfisf` (production).
4. **Build the base schema BEFORE the first migration run.** Seven tables (`profiles`, `learners`, …) were
   made in production's dashboard and are in no migration, so `supabase db push` on an empty project fails.
   In the **staging** project: **SQL Editor → New query →** paste all of `supabase/schema/baseline_schema.sql`
   from the repo → **Run**. This is exactly what CI does before its RLS suite
   (`.github/workflows/ci.yml`, "Stage baseline schema as the first migration"). Never run that file on production.
   ⚠️ To confirm on first run: it creates a trigger on `auth.users`; if the hosted project refuses that,
   stop and ask — do not edit the file.
5. **Authentication → URL Configuration:** Site URL `http://localhost:3000`, add `http://localhost:3000/**`
   to Redirect URLs.
6. **GitHub → RadlorInc/learn → Settings → Secrets and variables → Actions:**
   - **Variables tab → New repository variable:** `STAGING_PROJECT_REF` = the staging ref.
     ⚠️ It must be a **repository** variable, not an environment one: it is read in the jobs' `if:`
     conditions, which are evaluated before any environment is selected.
   - **Settings → Environments → `staging`** (create it if absent) **→ Add environment secret:**
     `STAGING_DB_PASSWORD` (the password from step 2) and `STAGING_DB_URL` (staging's
     **Project Settings → Database → Connection string → Session pooler** URI, with the password filled in;
     it lets the RLS regression suite run against staging — optional, the step skips without it).
   - `SUPABASE_ACCESS_TOKEN` already exists for production. It is a personal access token, so it works
     for staging only if the same Supabase user is a member of the staging organisation — confirm.
7. **Apply the migrations — through the workflow, never a local CLI.** Nothing is dispatched by hand:
   the next push to `main` (any merged PR) runs `migrate-staging`, which links to staging and runs
   `supabase db push`. Watch it in **Actions → Deploy**. From then on every production migration waits
   for staging to succeed first.
   ⛔ Never `supabase link` / `supabase db push` from a laptop (CLAUDE.md hard rule).

## 2. Seed it

From a checkout, with the **staging** values (Project Settings → API; the service-role / secret key):

```bash
STAGING_PROJECT_REF=<staging ref> \
STAGING_SUPABASE_URL=https://<staging ref>.supabase.co \
STAGING_SERVICE_ROLE_KEY=<staging service-role key> \
SEED_PASSWORD=<any 12+ characters> \
node scripts/seed-staging.mjs
```

It creates `parent.one@example.test`, `parent.two@example.test` and `teacher.one@example.test`
(pre-confirmed, password = `SEED_PASSWORD`), five obviously fake children, each under its own
granted consent (the database refuses a child without one), a class "Fake Class 4B" with two of them,
and some `lesson_progress`. Running it again reuses what is there.

It refuses (exit 2, **before any network call**) when `STAGING_PROJECT_REF` is missing or is production's
ref (read from `scripts/assert-prod-ref.sh`), when the URL names production, or when the URL is not
`https://<STAGING_PROJECT_REF>.supabase.co`. Its variable names are deliberately not the app's, so a shell
that has loaded a production `.env.local` cannot aim it at production.

The consents it writes carry `notice_version = 'seed'` and provider ids `seed-fake-b1` / `seed-fake-b3`:
no email was sent, and they are not evidence of anything.

## 3. Point a local checkout at staging

`.env.local` (never committed) — the same names the app reads, with **staging** values:

```
NEXT_PUBLIC_SUPABASE_URL=https://<staging ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging anon / publishable key>
SUPABASE_SERVICE_ROLE_KEY=<staging service-role key>
```

- Before `npm run dev`, check it: `grep SUPABASE_URL .env.local` must show the staging ref, never
  `wrnjqjhrbnqxornmfisf`.
- Leave `RESEND_API_KEY` unset unless you mean to send real email: the add-a-child flow then stops with a
  clear error before writing anything, and the seeded children are there to use instead.
- Leave `STRIPE_*` unset, or use Stripe **test-mode** keys only.
- Keep the old production file somewhere else only if you must; better, do not keep it at all.

## 4. Tear it down

1. **GitHub:** delete the repository variable `STAGING_PROJECT_REF` **first**. `migrate-prod` then goes back
   to running without staging (tested in `stagingPrep.test.ts`). Deleting the project while the variable is
   still set blocks every production migration.
2. Delete the `staging` environment's secrets (or the environment).
3. **Supabase:** staging project → **Project Settings → General → Delete project**; then the organisation
   if it holds nothing else.
4. Point any `.env.local` that used staging somewhere else.
