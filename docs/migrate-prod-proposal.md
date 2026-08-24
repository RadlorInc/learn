# Proposal — enable `deploy.yml → migrate-prod`, behind a required reviewer

**STATUS: PROPOSAL. NOT ENABLED. All three conditions below are unmet.** Written 2026-08-24 at the
founder's request; nothing in it has been built. `migrate-prod` remains doubly inert — no
`PROD_PROJECT_REF`, and `migrate-staging` is skipped ahead of it.

## Why this is worth doing at all

**Hand-applying is the root cause of the mess this repo spent a morning repairing.** All 58 ledger
mismatches came from by-hand applies through the MCP, each recording a generated version that then
had to be reconciled with a filename. Today added two more, plus two renames, plus 442 lines of SQL
retyped into a tool call. The fingerprint check retired the transcription risk *after the fact*; the
pipeline removes the typing.

## ⚠️ It is not enable-or-don't — the third option is better than both

A **GitHub protected environment with a required reviewer** gives the pipeline's reproducibility,
ledger consistency and end of transcription, while keeping a human between a merge and a production
schema change. The only thing lost is the ability to apply **by accident**, which is the thing we
are trying not to have.

`deploy.yml`'s `migrate-prod` declares `environment: production-db` and carries a comment saying
to create it with its rule. The wiring exists; the environment, the rule and the credentials do not.

---

## Condition 1 — B12 first. Not negotiable, and not merely prudent ordering.

Automatic production migrations against a database with **no backup and no point-in-time recovery**
is the wrong order to do things in. Supabase Pro goes on before the pipeline does.

## Condition 2 — required approval, not automatic on merge

**✅ Available on our plan.** Measured 2026-08-24 via the GitHub API:

| | |
|---|---|
| repo visibility | **public** |
| org plan | free |
| environments that exist | `Preview`, `Production`, `staging` — the first two are **Vercel's**, see below |
| protection rules on any of them | **NONE** |
| repo variables / secrets | **none at all** |

Environment protection rules are free for **public** repositories, so the required reviewer below
costs nothing. (This is another reason the repo staying public is load-bearing — see
the handoff's note about Vercel Hobby.)

⚠️⚠️ **WHAT IS REAL, AND WAS UNDER THE SAME STONE: `Production` IS VERCEL'S.** It holds **68
deployments created by `vercel[bot]`**, the most recent today; `Preview` holds 32. Neither was made
by us, neither is unused, and the environment `migrate-prod` was declared against is the same object
Vercel writes to on every push to `main`.

### ✅ DECIDED — `migrate-prod` uses its own `production-db` environment, never `Production`

Founder's call, 2026-08-24. The reasoning matters more than the name, because the tempting option is
the one that looks tidier:

A required reviewer on `Production` would gate **the site's entire deploy path** in order to protect
a database apply. The guard would then be more expensive than the risk it covers — and the first
time it wedged a hotfix, somebody would remove it under pressure, **taking the database protection
with it.** A protection rule that gets deleted during an incident protects nothing on the day it
matters most.

A second environment costs nothing (rules are free on public repos) and decouples the two
completely: Vercel keeps deploying the site unattended, and the only thing behind a human is the
schema change. So the workflow declares `environment: production-db`.

⚠️ **The environment does not exist yet, deliberately.** It is created *with* its required-reviewer
rule as part of enabling the pipeline — never before. An environment that exists without a rule is a
door standing open in a corridor nobody walks down, and `migrate-prod` referencing a name that is
not there is harmless while the job is inert (`PROD_PROJECT_REF` unset). Creating it early is the
only way to get the worst of both.

⚠️ **THE NAME TRAP THAT SENT US LOOKING HERE WAS WRITTEN DOWN AS A FACT AND IS NOT ONE — MEASURED
2026-08-24.** The claim was that `environment: production` (lower case) would not resolve to the
`Production` that exists, and would silently create a second, ruleless environment. **GitHub matches
environment names case-insensitively:** `GET /repos/RadlorInc/learn/environments/production` returns
`Production`, `created_at 2026-05-25T18:41:45Z` — the same object, not a new one.

*(The general trap is real for a genuinely different name — a typo'd `prod`, a renamed environment,
or `production-db` above before it is created. It just was not the casing. This is the rule at the
top of CLAUDE.md paying out in the other direction: reading the workflow beside the settings page
produced a confident finding that one API call disproved. It was carried into the handoff and
repeated as fact before anybody queried it.)*

> **Do not verify the reviewer by looking at the settings page. Verify it by running the workflow
> and watching the job PAUSE for approval.** A protection rule nobody has watched stop a deploy is
> the same artefact as a rollback nobody has run. That rule is unchanged, and it is the whole reason
> the name question above was answerable at all.

## Condition 3 — the pipeline must be SAFER than the hand-apply, not merely more consistent

This is the condition that decides whether the proposal is worth anything. Today the checks below
live in judgement and instructions. A pipeline that applies without them is faster **and worse**.

Everything that runs before `supabase db push`, all failing the job:

1. **`verify` and `rls-tests`** — already run via `workflow_call`. Between them that is the whole
   vitest suite (including the two derived gates: a function redefinition may not drop a
   `raise exception` an earlier one added; a policy redefinition may not drop a literal), a replay
   from zero against a throwaway Postgres, 64 cross-tenant assertions, and the rollback exercised.
2. 🔨 **The stale-migration diff, against PRODUCTION.** *(to build)* For every PENDING migration —
   local version not in `schema_migrations` — extract the policies and functions it replaces, read
   production's current definitions from the catalog, and apply the same two containment rules with
   **production as the earlier definition**. Fail on any loss. This is the check that caught
   `plan_entitlement` reverting the V5 bounds, and it is the one that exists only in a habit today.
   ⚠️ It must read the CATALOG, not the repo. The repo answers "what did we intend".
3. 🔨 **B12 as a mechanism rather than a memory.** *(to build)* Refuse to apply while
   `billing_config`-style protection is absent **and** a pending migration writes to `sessions`,
   `learner_progress` or `learner_stats`. The standing policy is already in the runbook in the
   founder's words; a grep over pending migrations turns it into something that cannot be forgotten
   at 11pm.
4. 🔨 **Fingerprint the applied schema against the tested one.** *(to build)* `rls-tests` already
   publishes the post-migration fingerprints of the objects it exercised. After `db push`, read the
   same fingerprints from production and fail on any difference. This is exactly what was done by
   hand on 2026-08-24, and it is the only thing that proves the applied schema is the tested one —
   the live smoke test cannot, because the flag makes it succeed either way.
5. 🔨 **Rename-back, or stop renaming.** *(to decide)* `supabase db push` applies migrations under
   **their own filename versions**, so the whole generated-version/rename dance disappears the day
   the pipeline is used. That is the largest single win here and it should be stated as such.

---

## ⚠️ The honest limit of `billing_config.enforced`

It is tempting to describe the flag as the safety net that makes automatic applies acceptable. **It
is not, and it must not be described as one.**

- What it does: makes an accidental apply of **these two migrations** harmless, because the
  entitlement guard short-circuits and nothing observable changes.
- What it does **not** do: anything at all for a future migration. A migration that drops a column,
  rewrites a policy on `learners`, or touches `sessions` / `learner_progress` / `learner_stats` is
  exactly as dangerous with the flag as without it. The flag is scoped to one feature's guard.

The general safety net is B12 plus condition 3, not the flag.

## What is NOT proposed

- Enabling `migrate-staging`. There is no staging project and inventing one is a separate decision.
- Any change to `deploy.yml` today. This document is the proposal; the workflow is untouched.
