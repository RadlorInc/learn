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

`deploy.yml`'s `migrate-prod` already declares `environment: production` and already carries a
comment saying to add the rule. The wiring exists; the rule and the credentials do not.

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
| environments that exist | `Preview`, `Production`, `staging` |
| protection rules on any of them | **NONE** |
| repo variables / secrets | **none at all** |

Environment protection rules are free for **public** repositories, so a required reviewer on
`Production` costs nothing. (This is another reason the repo staying public is load-bearing — see
the handoff's note about Vercel Hobby.)

⚠️⚠️ **AND THERE IS A TRAP IN THE NAMES, WHICH IS EXACTLY THE CLASS OF THING THAT BITES US.** The
workflow says `environment: production` (lower case) and the environment that exists is
`Production`. **A workflow referencing an environment that does not exist CREATES it, unprotected.**
If the reference resolves to a new, ruleless `production` rather than the `Production` somebody
added a reviewer to, the gate is bypassed and everything looks configured. So:

> **Do not verify the reviewer by looking at the settings page. Verify it by running the workflow
> and watching the job PAUSE for approval.** A protection rule nobody has watched stop a deploy is
> the same artefact as a rollback nobody has run.

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
