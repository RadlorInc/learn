# Billing — Stage 1 (schema, RLS, regression tests). No UI, no Stripe calls.

**Status 2026-08-24: built, gated, and APPLIED to production** (ledger versions `20260824133906` and `20260824134125`), **with `billing_config.enforced = false` so the whole surface is inert.** The migration is
`supabase/migrations/20260824133906_billing_schema.sql`; CI replays it from zero against a throwaway
Postgres on every PR, which is where it is being tested. Applying it to production is a separate
decision behind the prod gate — and when it happens the file must be renamed to the version the
ledger records ([runbooks/applying-migrations.md](runbooks/applying-migrations.md)).

> ⚠️ **THE STAGE-1 PLAN NEVER MADE IT INTO THE REPO.** It was agreed in chat on 2026-08-24 and lived
> only there; by the time Stage 1 started, that context had been summarised away and it is not
> recoverable from the session transcripts either. Everything below — including the **B-case
> numbering** and the wording of the **AR constraint** in §4 — is a re-derivation from the decisions
> recorded in `handoff.md`, not a transcription. **Check the numbering against what you remember.**
> This file exists so the next session inherits a document instead of a memory.

---

## 1. The decisions this encodes

All founder's, 2026-08-24, carried forward from the handoff:

| | |
|---|---|
| pricing shape | **graduated tiering, never volume** |
| seats | **4 paid seats**, against the existing **25-profile cap** (`enforce_learner_cap`) |
| teachers | **out of scope** for Stage 1 |
| entitlement follows | **`learners.created_by`** — the account that created the child pays for them |
| trial | **none** |
| dunning | **7-day grace** after a failed payment |
| currency / tax | USD, Stripe Tax off |
| descriptor | `RADLOR MILO` |
| email | Resend |
| proration | `proration_behavior: 'none'` below $1 (replaced the $1 floor) |

---

## 2. ⚠️ What a paywall on this product can and cannot do

**RLS gates the RECORD, not the chapter CONTENT.** Chapters are client-side JavaScript and stay that
way — founder's call: *sell the plan, the diagnostic and the record, not the JS.* Question generation
does **not** move server-side.

So an unentitled child can still open a paid chapter and play it. What they cannot do is have the
session **saved, counted, or appear in the report**. Every guard in Stage 1 is a WRITE guard.

Two consequences, both deliberate:

- **Reads are not gated.** A lapsed subscriber keeps reading their child's whole history. Holding a
  child's record hostage to a card failure is not something this product will do — which is why the
  entitlement sits in `learner_progress`'s `WITH CHECK` and never in its `USING`. Asserted at
  runtime by B11d, because it is the easy mistake to make on a `for all` policy.
- **The refusal must be loud.** `sync_session` RAISES `42501` rather than returning quietly. A
  swallowed refusal is a chapter whose work vanishes with nothing on screen saying why — this repo's
  own *"a tap that does nothing is the worst outcome there is"* wearing a server costume. Stage 2
  owes that error a lock screen.

---

## 3. What Stage 1 built

### ⚠️ The switch — `billing_config.enforced`, and why it ships FALSE

**Without it this schema cannot be applied at all.** Production has zero subscriptions and zero
seats, so the moment `is_chapter_entitled` reaches the `sessions` policy, entitlement collapses to
`is_free` — and **every existing family stops being able to save progress in 65 of the 72 chapters,
instantly.** That is not a deploy risk to manage. It is a migration that is not applicable as
written.

So: one row, `enforced boolean default false`, and `is_chapter_entitled` short-circuits to true
while it is false. The tables, the policies and the functions all land **inert**. The paywall goes
live later by flipping one boolean, with everything already applied and already exercised.

⚠️ **IT FAILS OPEN, AND THE CAMERA GUARD FAILS CLOSED. THAT IS NOT AN INCONSISTENCY — RECORD IT
BEFORE SOMEBODY "FIXES" IT FOR CONSISTENCY.** Founder's words, 2026-08-24:

> a camera without consent harms a child, so that guard fails closed
> a paywall failing closed breaks a working product for every family at once
>
> Different failure costs, therefore different defaults.

**IT FAILS OPEN, AND THE STAKES ARE WHY.** A camera
offered without consent harms a child, so that guard fails closed. A paywall that fails closed
breaks a working product for every family at once; one that fails open costs money. Missing row,
missing table, unreadable value → not enforced.

⚠️ **AND IT CLOSES A SECOND, UNRELATED HAZARD.** `deploy.yml`'s `migrate-prod` is inert only because
`PROD_PROJECT_REF` is unset — one variable away from applying whatever is on `main`, unattended.
With the flag, that accident applies a paywall that does nothing rather than one that silently stops
65 chapters from saving. The flag closes the standing hazard as well as the one it was written for.

⚠️ **THE CONDITION THAT MAKES IT SAFE RATHER THAN A HOLE: the RLS suite turns it ON in setup, and
ASSERTS that it did** (F0). A flag defaulting off with a suite that inherits the default is a
paywall that silently never turns on and a suite that passes anyway — the same shape as the CI job
that skipped and reported success, the bundle grep that could not have found the key, and the
failure-text read that ran before the screen existed. Three of those in one day is why this one is
asserted rather than noted. `billingSchema.test.ts` gates the set AND the assertion, because setting
alone is silently removable.

`billing_config` is **service-role only**: RLS on, zero policies, no grant at all. A client that can
write the row has turned the paywall off for everybody in one statement; a client that can read it
learns nothing it needs, because what a UI wants is `is_chapter_entitled`, per chapter. F1/F1b/F2
drive write, read-back and read.

⚠️ **B12 IS NOW ON THE CRITICAL PATH, NOT BESIDE IT.** Supabase Pro must be on **before `enforced` is
ever flipped true** — the day we start taking money is the day losing that database stops being
recoverable by apology.

### Tables

| table | RLS | policies | notes |
|---|---|---|---|
| `subscriptions` | on | **1, SELECT only** | one row per account. No write policy exists, and the default grants are REVOKED. |
| `subscription_seats` | on | **1, SELECT only** | a seat is a ROW. Moved only by `reassign_learner_seat`. |
| `billing_events` | on | **0** | the `error_events` precedent: RLS on with zero policies = deny-all, service-role only. Stripe's webhook log; `stripe_event_id` is the idempotency key. |

⚠️ **The REVOKEs are not decoration — they change the failure mode.** Supabase's default privileges
hand `anon` and `authenticated` ALL on new public tables. With the grant left in place and no UPDATE
policy, an attempted self-upgrade matches **no rows and returns quietly** — a silent no-op the client
cannot tell from success. Revoked, the same statement raises 42501. B4 asserts both halves: that it
raised, *and* that `seats_paid` is still what it was.

⚠️ **SELECT-only is expressed as the ABSENCE of a policy**, not as a restrictive one. A policy that
exists can be widened in a one-word diff; one that does not exist cannot.

### `is_chapter_entitled(learner_id, chapter) → boolean`

The single definition of *may this be recorded*: the chapter is free, **or** the learner occupies a
seat on a subscription that is `active` (or `past_due`/`unpaid` inside `grace_until`), **and** that
subscription's account is the learner's `created_by`.

**One function, three call sites, on purpose** — the `sessions` INSERT policy, the
`learner_progress` WITH CHECK, and inside `sync_session`. `sync_session` is SECURITY DEFINER, so it
runs as the table owner and RLS does not apply to it: the policy alone leaves the RPC wide open, and
the RPC alone leaves the direct writes open. **The only way to make two guards unable to diverge is
to make them the same guard.**

- `status` has **no CHECK constraint**, deliberately. It holds whatever Stripe last said. A CHECK
  would make a webhook carrying an unfamiliar status ERROR, and losing the event is worse than
  storing a word we do not recognise — the function allow-lists, so an unknown status fails
  **closed**.
- ⚠️ **Accepted, written down:** `authenticated` must hold EXECUTE or the policies cannot call it (a
  policy predicate is evaluated with the caller's privileges). That makes it a **one-bit oracle** for
  anyone who already knows a learner UUID: *is this family paying?* Learner ids are non-enumerable —
  the same argument that bounded V1's severity — and the bit carries no child data. Not free, and
  cheaper than the alternatives.

### `reassign_learner_seat(seat_id, learner_id)`

The only billing write a parent may make. Checks `subscriptions.account_id = auth.uid()`, checks
`learners.created_by = auth.uid()` (entitlement follows `created_by`, so you cannot seat a child you
merely have viewer access to), refuses a second reassignment inside the same billing period, and
**its single write is an UPDATE of one existing row — no INSERT, no DELETE.** That is what makes it
structurally unable to raise the active count, rather than merely checked not to.

⚠️ **The fail-closed half of the period limit is `coalesce(current_period_start, '-infinity')`.**
Without it, a NULL period start makes the comparison NULL, the `if` never fires, and the limit
silently does not exist — which is exactly the state someone would engineer by suppressing a webhook.
Against `-infinity`, an unknown period allows the first assignment and nothing after it.

⚠️ **A no-op does not burn the allowance** (B13f): re-pointing a seat at the child already in it
returns early. Otherwise a double-tap in the UI costs a parent their month.

### The free set

`chapters.is_free boolean` — data, not code, so changing the set is one UPDATE. See §4.

---

## 4. The free set — proposal, and the AR constraint answered plainly

### The constraint, as re-derived

> *A free chapter must be one the child answers with the camera.*

The reasoning: the free set protects nothing (the JavaScript is public — §2), so its only job is to
**sell**. The one thing a screenshot cannot convey, a competitor cannot copy, and a parent cannot
evaluate without trying, is answering with your hands through the camera.

### Measured against the app, today

**Eight chapters carry AR wiring. All eight are in 9–11.**

| reading | chapters |
|---|---|
| finger **count** | `decimals`, `factorsMultiples`, `fractionsCompare`, `measurementUnits`, `dataGraphs`, `division` |
| **tilt** | `anglesSymmetry` |
| two-hand **span** | `areaPerimeter` |

(The handoff says "five" for the count reading; measured from the `hand: { reads: … }` blocks today
it is six — it predates The Minibus Run and does not count The Height Bar's two-place reading.)

### So, plainly

**The constraint is satisfiable in exactly one band out of six.** `3-5`, `6-8`, `12-14`, `15-16` and
`17-18` contain **zero** AR chapters. There is no honest reading of "answers with the camera" that
reaches them, and stretching it to "is interactive" makes it vacuous — every chapter in this app is
interactive.

### The closest honest alternative for the other bands

Name what AR was standing in for. It is doing two jobs at once:

- **(a) it cannot be copied** — a defensibility argument; and
- **(b) it cannot be evaluated from a screenshot** — a conversion argument: you have to try it.

(a) is unavailable outside 9–11 and no substitute exists. **(b) is available in every band, and (b)
is the half that actually sells.** So for the other five the rule becomes: *the free chapter is one
whose answering GESTURE cannot be conveyed by a screenshot* — where the child does something physical
to an instrument rather than choosing from options.

### Two candidate sets

**Option A — first chapter of every band, plus the AR showcase. ⬅ recommended.**
`counting` · `numbersTo100` · `bigNumbers` · **`decimals`** · `integers` · `signedNumberFluency` ·
`functionToolkit`. Seven of 72. Every band is visibly open; 9–11 additionally reaches the camera
without paying. One sentence on a pricing page: *the first chapter of every level is free, plus the
camera one.* **This is what the migration seeds** — so the system is coherent and the tests have
something true to assert, not because it is settled.

**Option B — the gesture rule, one per band.** A stronger showcase (each band's most physical
chapter) and it loses on the thing that matters: the free chapter is buried mid-band, so a parent who
opens the band and meets chapter 1 locked bounces before finding it. **A free chapter a parent has to
hunt for converts nobody.**

### ⚠️ The consequence nobody has costed yet — this one needs your answer before the UI

**The diagnostic routes a child to their root gap, and a root gap is almost never chapter 1 of a
band.** Under Option A, a child whose probe names `fractionsCompare` gets a plan whose **first step
is locked** — after a 20–50 question check that just promised them a route. That is the worst
possible first impression, and it is created by the free set, not by the paywall.

Two ways out, both product calls:

1. **Make the plan's first step always free** — `is_chapter_entitled` also returns true for the first
   unmet step of the learner's active diagnostic plan. Honest, and a strong story: *we will always
   let you start where the check said to start.* Costs one more branch in one function.
2. **Move the paywall to the plan, not the chapter** — the whole plan is visible and the first step
   is playable; the wall appears at step two. Bigger UI change, no schema change.

Recommend **1**. Not built: it changes what is sold, so it is yours to pick.

---

## 5. The regression cases

`supabase/tests/rls_regression.sql`, **46 assertions** (was 17). The suite stands up its own Postgres
in CI and **fails if it reports zero assertions**, so an emptied file cannot pass as a green one.

| case | what it proves |
|---|---|
| **B0** | the fixture itself has a free/paid split — without it every entitlement assertion below passes vacuously |
| **B1** | a stranger cannot read another account's subscription |
| **B2** | the owner CAN read their own (positive control) |
| **B3** | nobody can INSERT a subscription from the API |
| **B4** | nor UPDATE one — the self-upgrade — and `seats_paid` is still 2 afterwards |
| **B5** | nor DELETE one |
| **B6** | `billing_events` is unreadable |
| **B7** | and unwritable |
| **B8** | a stranger cannot read another account's seats |
| **B9** | nobody can INSERT a seat — a seat a client can create is a seat nobody paid for |
| **B10** | nor UPDATE one directly, which would route around the period limit |
| **B11** | a-d: a FREE chapter records with no subscription · a PAID one does not, on `sessions` and on `learner_progress` · **reads are not gated** |
| **B12** | **the two write paths cannot diverge** — drives BOTH and asserts the verdicts are EQUAL, on an unentitled chapter and on a free one, plus the VALUE each time (equality alone is a tautology if both are broken open) |
| **B13** | a-g: not your seat · not a learner you created · a legitimate reassignment works · **the seat COUNT is unchanged** · a second reassignment in one period is refused and did not move the seat · a no-op does not burn the allowance · a seated learner IS entitled and an unseated one on the same account is not |

### The source gate — `src/__tests__/billingSchema.test.ts`

Because a driven test proves behaviour at one moment and **cannot see a call site disappear**. That
is the fault that cost this repo three months on the plan pointer: six passing unit tests on
`advancePlan` and nothing calling it.

Two of its nine checks are **general rules**, not billing-specific, and both were measured to pass on
all existing objects before being written:

- **every table any migration creates is named in `security_baseline.sql`** — a table absent from the
  baseline is a table whose RLS nobody reviewed;
- **every SECURITY DEFINER function a migration creates carries an explicit REVOKE** — the V19 lesson
  as a standing rule. Postgres creates a function with PUBLIC EXECUTE and Supabase exposes every
  public-schema function at `/rest/v1/rpc/<name>`, so one without a REVOKE is an unauthenticated
  privilege-escalating endpoint from the moment it exists.

**13 mutations planted against the SOURCE; 13 caught.** ⚠️ One of them survived the first version and
is the reason the file reads the way it does: the sessions-policy check used a character budget
(`[\s\S]{0,800}?`), so deleting the guard from that policy let the window run on into the **next**
policy, which still had one — green, with the most important guard gone. It is `[^;]*` now, because a
policy statement contains no semicolon of its own.

---

## 6. Not built, and why

- **The seat materialiser.** Nothing creates seat rows from `seats_paid`; the tests insert them
  directly during setup, where RLS is bypassed. Stage 2's Stripe webhook is the only thing that
  should ever create one, and building a webhook-shaped function before the webhook is guessing at
  its shape.
- **An `ON DELETE SET NULL` fkey on `error_events.learner_id`.** `exportCompleteness.test.ts` says
  Stage 1 adds it. ⚠️ **That contradicts `20260817142406_error_events.sql`**, whose header states the
  column is deliberately NOT a foreign key *"so a crash is still recorded when the learner id is
  stale, absent, or from a device whose row was deleted."* The migration's reasoning is the better
  one, so the fkey is NOT added and the note in the test is the thing that is wrong. Flagged rather
  than silently resolved.
- **Anything Stripe.** No SDK, no webhook route, no checkout session, no customer portal. Stage 2.
- **Any UI.** No lock screen, no pricing page, no seat manager. Stage 3.
