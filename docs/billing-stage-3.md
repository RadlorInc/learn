# Billing — Stage 3: the chapter gate and the screens

Stage 1 put entitlement in the database. Stage 2 put money in front of it. Stage 3 is the part a
family sees: what happens when a child opens a chapter they are not entitled to, and what a parent
sees when they decide to pay.

---

## 0. 🔴 OPEN PREREQUISITE — THE WEBHOOK → SEATS CHAIN HAS NEVER BEEN PROVED END TO END

> **HARD DEADLINE: before Stage 4 starts.** Founder's call, 2026-08-25. Not "before live keys",
> not "before launch" — **before Stage 4**, so that two more days of work are not stacked on an
> unproven chain.

**The risk we are carrying, stated plainly:** nothing has yet watched a real Stripe event become a
seat row. Step 3 of [billing-stage-2.md](billing-stage-2.md) §5 — the test-mode purchase, watched —
is **deferred, not cancelled**.

So **Stage 3's UI is built and tested against SEEDED entitlement, not against entitlement that
arrived the way a real one will.** Every piece of it is honest on its own terms:

- `is_chapter_entitled` is applied to production and driven by `ci / rls-tests` with the flag forced
  ON (74 assertions);
- `materialize_seats` is applied, fingerprint-matched, and driven (M1–M7);
- the webhook is driven end to end against a stubbed Stripe and a stubbed PostgREST (C1–C9).

What is **not** proved is the joint: a real `checkout.session.completed` → our webhook → the real
`materialize_seats` → seat rows that `is_chapter_entitled` then reads. Each link is tested; the
chain is not. That is exactly the shape of *a check that cannot see a call site disappear*, and it
is why this has a deadline rather than a hope.

⚠️ **This section does not get deleted when somebody is busy.** It is closed by pasting the seat
query's output into it, or it is still open.

---

## 1. The four sources of entitlement, in order

| | source | where it lives |
|---|---|---|
| **A** | **the demo** — 2 chapters, pre-signup, no AR, local only | `/demo`; never reaches the database, because a logged-out visitor has no learner and no rows |
| **B** | **the fixed free set** — `chapters.is_free` | data, not code: changing it is one UPDATE |
| **C** | **plan-derived** — the plan's first two UNMET steps, **resolved at issue time** | `diagnostic_plans.free_chapters` (+ at most one `revised_chapter`) |
| **D** | **a paid seat** | `subscription_seats` → `subscriptions.status` (+ the 7-day grace) |

⚠️ **B, C and D are ONE function** — `is_chapter_entitled(learner, chapter)` — and the UI does not
re-implement any of them. It **asks**. That is the whole reason Stage 1 put three call sites behind
one definition: a second copy in TypeScript is a fourth guard that can disagree with the other
three, and it would disagree silently, in the direction of letting a child play something the
database will then refuse to save.

⚠️ **C is frozen at issue time and that is deliberate.** If it meant "the first two steps not yet
done", finishing step 1 would promote step 3 and the whole plan would walk free one chapter at a
time.

---

## 2. Where the check happens — ENTRY, never mid-chapter

**A child who has started finishes.** The verdict is taken once, before the chapter mounts, and is
never revisited for that chapter.

That is **structural, not a promise**: `useChapterGate` resolves once per chapter id and `/game`
does not render the chapter component at all until the verdict is `allowed`. There is no state a
later re-render could flip, because there is no later evaluation.

⚠️ **NEVER INTERRUPT A CHILD MID-QUESTION WITH ANYTHING ABOUT MONEY.** The strongest form of this
rule is the one the database already gives us for free: the paywall is a WRITE guard, so even a
child who somehow gets in plays to the end and only the *saving* is refused. The UI must not be
worse than the database.

### ⚠️ It fails OPEN, and the reason is the same one `billing_config` fails open for

A failed RPC, a lost network, an unknown session → **allowed**. A paywall that fails closed locks a
paying family out of a chapter because their wifi dropped; one that fails open costs us a chapter
nobody paid for, and the write guard in the database still refuses to record it. Different failure
costs, therefore different defaults — the same sentence the camera guard is on the other side of.

⚠️ **NEVER GATED: the diagnostic.** It is how a parent decides to buy. The gate lives in the chapter
mount and nowhere else; `src/__tests__/chapterGate.test.ts` counts its call sites so a third one
cannot appear quietly.

---

## 3. What a CHILD sees — no prices, ever

A locked chapter in a learner session shows **"ask a grown-up"**. No price, no checkout link, no
upgrade button. **Pricing exists only on the parent side.**

⚠️ **AND IT NAMES WHAT IS BEHIND THE LOCK RATHER THAN SAYING "LOCKED".** Carried over from the
camera consent card, which taught a parent that hand-tracking exists in the same breath as refusing
them. **A lock that explains itself is doing work; one that just refuses is doing none.** So the
card shows the chapter's own emoji, its name, and its `hint` — the one line that says what the
chapter actually does — and for an AR chapter it adds that this one is played with your hands.

Gated: `src/__tests__/chapterGate.test.ts` asserts the card's module contains **no currency, no
digits that could be a price, no checkout link and no `/parent/plan` link** — with a positive
control, because a search that finds nothing proves nothing until it has been shown finding
something.

---

## 4. What a PARENT sees

From the parent side a locked chapter routes to **`/parent/plan`**, which states the ladder plainly:

- **first child**, **each additional child**, the **4-child cap**, **monthly and annual**;
- the exact total for 1–4 children, **derived from `src/core/billing.ts`** so the page cannot drift
  from what Stripe bills;
- **no countdown, no fake scarcity, no dark patterns.** Gated: no timers in the module, and the
  totals are read from `totalCents` rather than typed.

⚠️ The parent dashboard asks `is_chapter_entitled` per chapter in the learner's own scoped list
(about a dozen, in parallel) rather than deriving a locked set locally. Same rule as §1: one
definition, asked.

---

## 5. Built with `enforced = false`, tested with it ON

Production still has `billing_config.enforced = false`, so **everything in Stage 3 is inert today**:
every chapter answers entitled, no lock renders, and the pricing page is reachable but sells
something nobody needs yet.

### ⚠️ What is driven, and what is NOT — stated rather than implied

| | |
|---|---|
| the verdict, every branch including fail-open | **driven** (`chapterGate.test.ts`) |
| the hook: `checking` → `locked`, never flashing `allowed` | **driven**, rendered with `react-dom/client` |
| the repository's fail-open on an RPC error / throw / missing function | **driven** against a stubbed client |
| the RPC's name and both parameter names vs the real migration signature | **derived from the migrations**, not typed |
| the lock's words, across every chapter in the catalogue | **rendered**, then swept |
| `/game` mounting only on `allowed`, and the locked branch not being dead | source, anchored on the whole statement |
| **the browser chain — `/menu` → `/game` → a real RPC** | ❌ **NOT DRIVEN** |

⚠️ **The last row is a real gap and it is here rather than in a footnote.** The e2e harness signs in
with an unsigned JWT, so `getLearnerBootstrap` 401s and the menu never finishes loading — driving
the gate there would be driving it **in a world where it cannot be reached**, which is a class this
repo has already paid for (a browser drive of the plan card, green, against a rejected JWT). The
honest coverage for that chain is §0's watched purchase, which exercises the same path with a real
session. **17 mutations planted against the source; 17 caught** — including the two that survived
the first pass and were the two worth having: a locked branch made DEAD (which renders a blank
screen, worse than the refusal it replaced), and an RPC error turned into `false` (which locks a
PAYING child out on a dropped packet).

⚠️ **WHICH IS EXACTLY HOW A PAYWALL NOBODY HAS WATCHED REFUSE ANYTHING SHIPS.** So the gate's tests
drive the refusing path directly — the verdict is injected as `false`, which is the state the flag
produces — and the e2e drives `/game` with the RPC answering `false` and asserts the chapter
component **never mounts**. Same discipline as the RLS suite forcing the flag on in setup and
asserting that it did.
