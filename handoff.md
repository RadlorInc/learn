# Session Handoff — Milo Story Mode

> 📐 **READ [docs/chapter-craft.md](docs/chapter-craft.md) FIRST, EVERY SESSION, BEFORE TOUCHING ANY 3–11 STORY CHAPTER.**
> It is the standing answer to *how we want the animation, the art and the voice* — the shape of a
> chapter, how cycles and travel must agree, what may be an answer object, how to choose a backdrop,
> how to generate a new drawn cycle, how Milo speaks, and how to verify any of it.
> Everything in it was paid for by a founder catching it on a screenshot. **Most of those rules were
> already learned in chapter 1, forgotten, and re-learned the hard way in a later chapter** — that
> file exists so the next session starts from them instead of rediscovering them.
> When a new correction lands, put the GENERAL rule there, not just the fix.
>
> ---
>
> ## 📍 WHERE THE 9–11 BAND IS — read this before touching it
>
> **The port is FINISHED at TEN** (founder's call, 2026-08-14: treat 9–11 like 12–18, same engine,
> same format, **AR as the thing that makes it its own band**) — eight ported plus **two BUILT NEW on
> 2026-08-22**, The Packing Shed and The Minibus Run, which is what finally closed the
> multiplication/division content hole the diagnostic had been routing children into. And
> **two more are deliberately staying storybook — founder's call, 2026-08-16: *"woh dono chapter
> waise hi rahenge… bina neon mein"***. So this table is the finished state, not a to-do list.
> ⚠️ **The two halves work completely differently — check which kind you are in before you touch
> one.** Do NOT port `OrderDesk` or `LevelRun`; they are storybook `SkillBeat` on purpose, and both
> pass the C7 gate as they are. The band is mixed by design.
>
> | | chapter | file | answers with |
> |---|---|---|---|
> | ✅ | `decimals` | `teen/games/CoinTrayGame.tsx` | two wells · hand or taps |
> | ✅ | `factorsMultiples` | `teen/games/FactorLabGame.tsx` | a count · hand or taps |
> | ✅ | `fractionsCompare` | `teen/games/PizzaCounterGame.tsx` | a count (never 0) |
> | ✅ | `measurementUnits` | `teen/games/HeightBarGame.tsx` | two places · tens then ones |
> | ✅ | `anglesSymmetry` | `teen/games/AngleShopGame.tsx` | a degree OR a set of axes · tilt |
> | ✅ | `wordProblems` | `teen/games/MissionBriefGame.tsx` | the shell's AnswerPad |
> | ✅ | `areaPerimeter` | `teen/games/EmptyPlotGame.tsx` | a PLACE on a plan · **hands apart** |
> | ✅ | `dataGraphs` | `teen/games/LoadingBayGame.tsx` | a stack OR a count · hand or taps |
> | 🆕 | `timesTables` | `teen/games/PackingShedGame.tsx` | a TYPED total · taps only (answers reach 116) |
> | 🆕 | `division` | `teen/games/BusRunGame.tsx` | a count ≤ 10 · **hand** or taps |
> | 🔒 | `bigNumbers` | `story/OrderDesk.tsx` | storybook · SkillBeat — **staying storybook, do not port** |
> | 🔒 | `rounding` | `story/LevelRun.tsx` | storybook · SkillBeat — **staying storybook, do not port** |
>
> **⚠️ THE 3D IS GONE.** `story/FloorPlot.tsx` (1,380 lines of react-three-fiber) and `story/plotSite.ts`
> (628 lines of procedural site) are DELETED — founder's call, 2026-08-15: *"totally remove that 3d
> concept"*. ✅ The four dead dependencies (`three` / `@react-three/fiber` / `@react-three/drei` /
> `@types/three`) were **uninstalled 2026-08-16**; production dependencies are 10 → 7.
>
> **To add or change a ported chapter:** it is a data file — palette, `makeTask` L1/L2/L3, a
> self-running tutorial, a `GameConfig`. Mirror `CoinTrayGame.tsx`. Shared parts are
> `teen/games/parts/kidKit.tsx` (palette · `KeyRow` · `Cue` · `PIP`/`PAD` · `useLatest`) and the
> engine is `teen/games/parts/GameShell.tsx`.
> - `band: '9-11'` is what buys the ten-round loop. ⚠️ It used to also mean *no*
>   resume-at-difficulty; **every band resumes now** — founder's call, 2026-08-20. See 🎚️.
> - `hand: {…}` is the whole AR wiring — the shell owns the camera, both doors, the dwell and the
>   gate. Readings in use: a finger COUNT (five chapters — and in The Loading Bay ONE count means a
>   stack number on one round type and a quantity on another), a TILT (The Angle Shop) and a two-hand
>   SPAN (The Empty Plot, and the first one ever scored — see 🏗️ for the noise arithmetic).
> - `coverage: {…}` withholds the mastery exit until every reading has been asked.
> - ⚠️ **The maths still lives in `story/<module>.ts`** (`cents` · `factors` · `pizza` · `inches` ·
>   `angles` · `words` · `plotMaths` · `cargo` · **`packing`** · **`busRun`**), untouched by the port
>   and still carrying every gate. **Put a rule there, not
>   in the data file** — that split is the only reason ten chapters can share one engine.
> - ⚠️ **Author an instrument BIG.** `FitSlot` runs at `max={1}` on landscape: it only ever shrinks.
> - Previews are **`/teen-preview?c=<id>`**. `/story?ch=` now rejects all EIGHT keys by design; only
>   `bignum` and `round` still resolve there.
>
> **The band-level gate is `src/__tests__/bandOnGameShell.test.ts`** — it holds the rules that used to
> be repeated per chapter (rounds, resume, the fist guard, the dwell key, both doors, coverage).
>
> ⚠️ **Biggest outstanding gaps, in order:** ✅ the camera path has been driven on the shell (The
> Empty Plot, span → dwell → graded) · ✅ the scratch-pad collision is FIXED (2026-08-16) · ✅ the
> walkthrough's missing `FitSlot` is FIXED (2026-08-16 — it had NO scale-to-fit on the legacy path,
> which is the path every 9–11 chapter takes) · **the EXPLORE beats were dropped and not replaced**
> (the largest remaining loss — The Height Bar's span reading now ships in no beat at all) · **the
> re-teach has never been seen fire anywhere in the band** · ⚠️ **AR has never been driven with a
> REAL HAND on a real camera** — MediaPipe is proven to boot on prod under the enforced CSP
> (`Graph successfully started running.`, 0 violations), but the band's defining feature is
> unverified end to end and only the founder can close it. Everything is committed and LIVE; prod is
> on **sw v138** (2026-08-23).
>
> 🔎 **THE DIAGNOSTIC — WHERE IT STANDS (2026-08-22), read before touching it**
>
> It was rebuilt from the answer surface up on 2026-08-22 and now names the exact planted root gap
> **96–98%** of the time (was **26–34%**), telling a child with a real gap they are on track **0%**
> of the time (was 10–38%). The contract is `src/__tests__/diagnosticAccuracy.test.ts` — it plants a
> gap, answers with each item's REAL guess rate, and gates exact-root, missed-gap, false-alarm,
> route and LENGTH. Spec: [docs/diagnostic-engine.md](docs/diagnostic-engine.md).
>
> ⚠️ **THE PRICE IS LENGTH, AND IT IS NOT SMALL.** Every answer is confirmed (a lead of two to pass,
> **three** to fail), so a child with a gap answers **29–50** questions and a child with NO gap still
> answers **20–36**. The intro copy says "about ten minutes" now — it said "2 minutes" while the
> thing was a coin flip. Founder's call, accuracy over length, stated twice.
>
> ⚠️⚠️ **AND THE HONEST CAVEAT: EVERY ONE OF THOSE NUMBERS COMES FROM A SIMULATION.** No real child
> has taken the new probe. It has been driven against seven learner models, five of which it was NOT
> designed for, and it degrades gracefully — see the 🔬 block. **The one thing that would settle it
> is a real child with a known weakness**, and only the founder can do that.
>
> ⚠️ **THE BOTTLENECK IS NOW THE SKILL GRAPH, NOT THE ENGINE.** `skillGraph.ts` is still v0.9 DRAFT:
> 130 prerequisite edges, none teacher-validated, and its own header says *"a wrong edge = a wrong
> root gap; do not ship the guarantee on a band until that band's spine edges are validated."* All
> 130 were measured on 2026-08-22 — **twelve decide a gap, twenty-one decide nothing** →
> [docs/skill-graph-audit.md](docs/skill-graph-audit.md) §1 is the teacher's one-hour list.
> **Until that hour happens, 96–98% means "the engine finds what the graph says", NOT "the engine
> finds the child's real gap."**
>
> 🚪 **AND SINCE 2026-08-25 IT IS OPTIONAL.** Nobody is forced through it: the offer carries a
> one-tap "Skip for now" that issues a `gradeStartPlan`, and it is re-offered exactly once (on the
> menu, after the child finishes a plan chapter) before retiring to the parent dashboard. **The
> probe itself is completely unchanged** — not shortened, no new modes, both 17–18 doors, the
> never-say-"on-track" rule intact. The short pass was measured and REJECTED as a length lever: it
> misses a third to a half of gaps in the bands where it saves any time, and 17–18 has none at all.
> ⚠️ So *"the diagnostic routes a child to their root gap"* is now true only of the children whose
> parents chose it; everybody else walks a grade-start plan that `advanceAfterChapter` refines from
> real play. Both are plans — nobody is handed 72 chapters.
>
> ✅ **AND IT IS LIVE NOW** — pushed 2026-08-23 as part of `9cc7787..6dd9224`. Production serves the
> 96–98% probe; verified on the live site (the door reads *"about 10 minutes"*, 0 console errors).
> The caveats above are unchanged by shipping: the numbers are still simulated and the graph is still
> v0.9 DRAFT.

> 📍 **WHERE THINGS LIVE NOW (2026-08-19).** **TWO repos, two Vercel projects, two hosts.**
>
> | | |
> |---|---|
> | **the product** | `RadlorInc/learn` → **`https://adaptivelearn.radlor.com`** — this repo |
> | **the company site** | `RadlorInc/website` → **`https://radlor.com`** — at `../radlor-site` |
>
> ⚠️ **Both repos must stay PUBLIC until Vercel is Pro** — Hobby refuses a private *org-owned* repo
> through the Git integration. `git remote` here is `https://github.com/RadlorInc/learn.git`.
> ⚠️ **The org was RENAMED `RadlorMain` → `RadlorInc` on 2026-08-20.** Repo ID `1248492657` is
> unchanged, so Vercel's link survives — but GitHub 301s the old name only until somebody claims
> it, so nothing may reference `RadlorMain`. Both remotes were re-pointed and verified.
> Support address **support@radlor.com** (⚠️ may have no mailbox — see 🇺🇸 §⑥); mi2utor is retired.
>
> ⚠️ **THE TWO PROPERTIES DESCRIBE ONE ENTITY AND THAT IS LOAD-BEARING.** Both emit
> `SoftwareApplication` with the identical `@id` `https://adaptivelearn.radlor.com/#app`, and both
> point `publisher` at `https://radlor.com/#organization` — **declared once on radlor.com and only
> REFERENCED here.** Retyping either string silently splits the product in half. They live in
> `src/app/site.ts` (`APP_ID`/`COMPANY_ID`) and `../radlor-site/site.ts`, and
> `src/__tests__/publicSeo.test.ts` asserts the exact values.
>
> ⚠️ **`SOCIAL` IN `../radlor-site/site.ts` IS LOAD-BEARING AND FOUR OF ITS SIX LINKS LIVE IN A
> GODADDY PANEL.** It feeds `Organization.sameAs`, the footer and `llms.txt` from one list. Four go
> through our own `*.radlor.com` forwards, so a forward silently repointed at a platform homepage
> tells every answer engine that the entity called Radlor **is Facebook**. **Run `npm run
> check:social` after any GoDaddy edit and before any deploy that touches it** — ⚠️ that script and its
> npm alias live in **`../radlor-site`, NOT this repo** (verified 2026-08-21: there is no `check:social`
> in this package.json and no `scripts/check-social.sh` here), so run it from there. It follows each
> link to its final URL and fails on a bare homepage.
>
> ⚠️ **radlor.com's production domain is the APEX.** `www` 308s to it. Flipping that breaks every
> canonical, because the `@id` above is the apex. Full story + the traps in the 🇺🇸 and 🏗️ blocks.
>
> ---
>
> _(Everything below is the running session history — newest first, most recent ~5 sessions only.
> Older blocks are in [docs/handoff-archive.md](docs/handoff-archive.md), which is NOT auto-loaded —
> `grep` it. This file is inlined into every session's context, so move blocks out rather than
> letting it grow. The craft rules live in chapter-craft.md, not here.)_

> 🔒 **2026-08-25 (fourth pass) — STAGE 3: THE CHAPTER GATE AND THE SCREENS. A LOCK THAT NAMES WHAT IS BEHIND IT, A CHILD WHO NEVER SEES A PRICE, AND A PAYWALL BUILT INERT BUT TESTED REFUSING.** `tsc` 0 · **1609/1610** (was 1579) · `next build` 0 · **17 mutations planted, 17 caught** · ⚠️ **Step 3 (the watched purchase) DEFERRED, with a hard deadline.**

## ⓪ 🔴 THE DEFERRAL, AND THE RISK IT CARRIES — [docs/billing-stage-3.md](docs/billing-stage-3.md) §0
Founder's call: the test-mode purchase is **deferred, not cancelled**, with a **hard deadline of
BEFORE STAGE 4 STARTS** — not "before live keys", not "before launch". It gates nothing in Stage 3,
because entitlement is applied and tested and the UI drives from seeded state. **The risk, written
at the top of the Stage 3 doc so it cannot quietly become "before launch": nothing has yet watched a
real Stripe event become a seat row.** Each link is tested — `is_chapter_entitled` with the flag
forced ON, `materialize_seats` M1–M7, the webhook C1–C9 — and **the chain is not**. Stage 3's UI is
therefore built against entitlement that was SEEDED rather than entitlement that arrived the way a
real one will. §0 closes by pasting the seat query's output into it, or it stays open.

## ① 🚪 FOUR SOURCES, ONE DEFINITION, ASKED NOT DERIVED
A demo (pre-signup, local, no rows) · B `chapters.is_free` · C the plan's first two unmet steps,
frozen at issue time · D a paid seat. **B, C and D were already one function** and the UI does not
re-implement a word of it — a TypeScript copy would be a FOURTH guard beside the `sessions` policy,
`learner_progress`'s WITH CHECK and `sync_session`, free to disagree silently in the direction of
letting a child into a chapter the database then refuses to save.

## ② ⏱️ THE CHECK IS AT ENTRY, AND THAT IS STRUCTURAL RATHER THAN A PROMISE
The verdict is taken once per chapter id, before the chapter mounts; `/game` does not render the
component at all until it is `allowed`. **There is no later evaluation for a re-render to flip**, so
there is no state in which a child can be interrupted mid-question by money. ⚠️ **It fails OPEN** —
a lost network or an unknown session is `allowed`, because this is a UX gate over a database that
already refuses the WRITE, and locking a paying child out on a dropped packet is the worse failure.
⚠️ **The diagnostic is never gated**, and the check for that COUNTS the call sites rather than
asserting an absence.

## ③ 🧒 WHAT A CHILD SEES — AND THE SWEEP THAT WAS WRONG FIRST
"Ask a grown-up." No price, no checkout link, no upgrade button. ⚠️ **And it NAMES what is behind
the lock** — the chapter's emoji, its name and its catalogue hint, plus "played with your hands" for
a camera chapter — carrying the consent card's principle: *a lock that explains itself is doing
work; one that just refuses is doing none.*
⚠️ **The no-price sweep was a source grep and it was WRONG: `\d+\.\d\d` matched `lineHeight: 1.55`.**
The property is about what a child READS, so it renders the card for **every chapter in the
catalogue** and sweeps the text. ⚠️ Two other checks failed on the gate's own prose (the pricing
page's header quotes the "$12.98" it forbids) — everything runs comment-stripped now, third time in
this repo. ⚠️ And the positive control caught itself: the planted string had no "subscribe" in it,
so it was proving only part of the sweep worked.

## ④ 👛 WHAT A PARENT SEES
`/parent/plan`: first child · each additional · the 4 cap · monthly and annual, **every figure
derived from `core/billing.ts`** so the page cannot quote one number while Stripe charges another.
Driven on screen: **3 children yearly = $143.97**, the founder's hand-computed value, and clean at
375px. No countdown — gated by forbidding a timer in the module at all. A locked chapter in the
dashboard routes here; the child's card never can.

## ⑤ 🧪 17 MUTATIONS, 17 CAUGHT — AND THE TWO THAT SURVIVED THE FIRST PASS WERE THE TWO WORTH HAVING
A **dead** locked branch (`if (false && …)`) passed a `/gate === 'locked'/` check while rendering a
**blank screen** — worse than the refusal it replaced. And **an RPC error turned into `false`**,
which reads as harmless defensiveness and locks a PAYING child out on a dropped packet; the hook's
mock could not see it, so the repository is now driven against a stubbed client.
⚠️ **What is NOT driven, in the doc rather than a footnote:** the browser chain `/menu` → `/game` →
a real RPC. The e2e harness's unsigned JWT makes `getLearnerBootstrap` 401, so the menu never
finishes loading — driving the gate there would be driving it in a world where it cannot be reached,
which is a class this repo has already paid for. §0's watched purchase is the honest coverage.

## ▶ OPEN
1. 🔴 **STEP 3 — THE WATCHED TEST-MODE PURCHASE — IS DEFERRED WITH A HARD DEADLINE: BEFORE STAGE 4.**
   Founder's call. It gates nothing in Stage 3, and the risk it carries is at the TOP of
   [docs/billing-stage-3.md](docs/billing-stage-3.md) §0 so it cannot become "before launch":
   **nothing has watched a real Stripe event become a seat row.** Every link is tested; the chain is
   not. ⚠️ Needs a `sk_test_` key + `SUPABASE_SERVICE_ROLE_KEY` locally, and runs **against
   production, deliberately** — record the ids first, verify the cleanup by query, once.
2. 🔴 **B12 IS STILL THE FOUNDER'S** — Supabase Pro before any live key and before `enforced` is
   ever true.
3. ⏭️ **STAGE 4 IS NEXT, AND ①'s DEADLINE LANDS ON IT.** The customer portal, dunning mail, seat
   management (`reassign_learner_seat` has no UI yet), and cancellation.
4. 🟡 **Stage 3 is INERT in production** because `enforced = false`: every chapter answers entitled,
   no lock renders, `/parent/plan` sells something nobody needs yet. That is the intended state —
   and it is why the gate's tests drive the REFUSING path directly rather than the real one.
5. 🔴 **`DRAFT = true` — the privacy policy and ToS are still placeholders (B1/B2).** You cannot
   charge a parent under a placeholder ToS.
6. ⚠️ **THE FREE SET IS STILL A PROPOSAL, NOT YOUR PICK.** `billing_schema.sql` seeds Option A
   (first chapter of every band + `decimals`) with its own comment saying so. ✅ The consequence
   that made it urgent is CLOSED: source C entitles the plan's first two unmet steps, so a
   diagnostic never routes a child to a locked chapter. The pick is one UPDATE whenever you want it.
7. 🟡 Vercel Web Analytics still off; the funnel all of this hangs off is unmeasured.
8. ⚠️ **NINE DEPENDABOT PRs OPEN AND UNTRIAGED** (#28–#47). Do not merge as a batch.
9. ⚠️ **A contradiction flagged and still unresolved:** `exportCompleteness.test.ts:58` says
   `error_events.learner_id` gains an `ON DELETE SET NULL` fkey in Stage 1;
   `20260817142406_error_events.sql` says it is deliberately NOT a foreign key so a crash is still
   recorded when the learner id is stale. The migration's reasoning is better — the COMMENT is what
   is wrong. Verified still present today.
10. ⚠️ **Prose drift:** `20260817174352_privacy_and_leads_hardening.sql` and
   `src/app/api/lead/route.ts` still say the anon INSERT revoke has not been applied. It was, on
   2026-08-24. Comments only, no behaviour.

> 💳 **2026-08-25 (third pass) — STAGE 2b: THE PRICE LADDER, THE PRODUCTS, CHECKOUT AND THE WEBHOOK. TEST MODE ONLY, ENFORCED BY A THROW RATHER THAN BY A RULE SOMEBODY REMEMBERS. ⚠️⚠️ AND I REPORTED A DEFECT I HAD NOT MEASURED: THE SUITE WAS HALF A CHECK, THE SYSTEM WAS FINE.** `tsc` 0 · **1579/1580** (was 1535) · `next build` 0 · **17 mutations planted, 17 caught** · **`ci / rls-tests` reported `RLS_ASSERTIONS=74`** (73 → 74). **NOT applied, NOT merged.**

**The ask:** the confirmed amounts, *"record them in a constants module first"*, then **Stage 2b — products, checkout, webhook. Test mode only, as specced.**

## ① ✅ THE LADDER IS WRITTEN DOWN, WHICH IS THE THING STAGE 1 FAILED TWICE
`src/core/billing.ts` and nowhere else: **monthly $7.99 then $4.99 · annual $63.99 then $39.99**,
graduated, `up_to: 1` then `up_to: 'inf'` — **the 4-seat cap lives in the app, not in Stripe**, so it
stays changeable without a new product. Development values; the SHAPE does not move.
⚠️ **The totals test types the four numbers out** (`$12.98 / $17.97 / $22.96`, `$103.98 / $143.97 /
$183.96`). Computing `first + extra × (n−1)` would let the ladder *define* what is correct instead of
being *checked against* it — a restatement, not a check. Proven by mutation: `extra: 599` fails three.

## ② ⚠️⚠️ I REPORTED A DEFECT I HAD NOT MEASURED — AND THAT IS #15, NOT #14
**What I said:** `materialize_seats` carried `revoke all … from public, anon, authenticated` with no
grant back, the webhook arrives as `service_role`, therefore the first real purchase would have
seated **nobody** with the suite green.
**What is true:** measured against production, Supabase's default privileges grant
`service_role=X/postgres` explicitly on functions in `public` owned by `postgres`, and a REVOKE from
`public, anon, authenticated` cannot remove it. Four live functions of **identical shape**
(`enforce_learner_cap`, `enforce_grade_cap`, `enforce_grade_ownership`, `prune_error_events`) all read
`{postgres=X,service_role=X}` with `service_role_can_execute = true`. **The webhook could always have
called it. The impact I published was invented**, and M7 passed on its first run for that reason.
- ⚠️ **The real fault was mine, and it is the engagement's own rule turned on the person applying
  it:** I read the repo (*what did we intend*) and shipped a conclusion that only production could
  answer (*what is true*). One query, thirty seconds. **A check-shaped FINDING needs the same
  positive control as a check.**
- ✅ **What still stands, and is why #14 keeps its row:** *a negative assertion is satisfied by total
  absence.* M6 asserts `authenticated` is refused and is equally satisfied by a function nobody at
  all can call — **the SUITE was half a check** even though the system was fine, and no run of it
  could have told you which. Founder's rule, kept: **every REVOKE assertion needs a paired GRANT
  assertion, driven as the REAL caller.**
- The grant and **M7 stay**, relabelled as what they are: redundant today, and worth writing so the
  property stops depending on a platform default nobody in this repo controls. M7 has caught nothing
  and the comment says so.

## ③ 🔁 THE WEBHOOK'S THREE PROPERTIES ARE STRUCTURAL, BECAUSE NONE OF THEM SHOWS IN A GREEN RUN
**Idempotent** — `billing_events.stripe_event_id` is `unique`, so the DATABASE is the authority, not
a Set in a serverless instance's memory. ⚠️ **Keyed on `processed_at`, not on the row existing**: a
delivery that logs the event and then dies would otherwise be skipped for ever having done nothing,
with no error anywhere. **Order-independent** — nothing reads state from the payload; it takes the
subscription id and **re-fetches from Stripe**, so a late-delivered old event writes today's truth.
**Convergent** — upsert + a reconciler given a TARGET.
⚠️ **The grace window is DERIVED (`period_start + 7 days`), never stamped.** `now() + 7 days` moves
the deadline forward on every redelivery — an at-least-once channel quietly turning a 7-day grace
into an unbounded one, invisible on every screen.
⚠️ **`invoice.payment_failed` is deliberately not handled**: a failed renewal already emits
`customer.subscription.updated`, and a second source of truth buys nothing.

## ④ 🪤 `current_period_start` MOVED OFF THE SUBSCRIPTION
From API `2025-03-31.basil` (the SDK pins `2026-07-29.dahlia`) the period fields are on the
**item**. Reading the old place is `undefined` — no error, both periods null — and a null
`current_period_start` silently deletes **both** the grace window and `reassign_learner_seat`'s
one-per-period limit. The fixture puts a *different* value in the old place so the item's has to win.

## ⑤ 🧪 DRIVEN, NOT READ — 40 NEW ASSERTIONS, 12 MUTATIONS, 12 CAUGHT
`src/__tests__/billingStripe.test.ts` drives both routes end to end against a stubbed Stripe and a
stubbed PostgREST, with a **real signature** from the SDK's own `generateTestHeaderString` (so no test
depends on my reading of the scheme). C3 is the one only a drive can see: a stale payload saying
4 seats / `active` against a Stripe currently saying 1 / `past_due` — we write **1**. C8 asserts the
outbound call list is **empty** on a bad signature, because the status alone passes on a handler that
writes first and checks after. Mutations caught include *trust the payload*, *key idempotency on the
row*, *verify after logging*, *take the account from the request body*, and *drop the clamp* — that
last one matters because `seats_paid` has a CHECK, so an unclamped quantity of 7 fails the INSERT and
**loses the whole event**.

## ⑥ 🔒 TEST MODE IS A THROW
`stripeClient()` refuses anything that is not `sk_test_`, and the setup script uses the same
function, so there is one definition rather than a copy that drifts. Watched it fail for the right
reason on the real script. No price id is hard-coded (gated, with a positive control). Unset keys →
**503** everywhere and nothing else in the app notices. ✅ The SDK is **server-only — 0 hits for
`api.stripe.com` in `.next/static`**, with a positive control proving the search works.
📄 [docs/billing-stage-2.md](docs/billing-stage-2.md) §5 is the founder's step-3 runbook: create the
products, `stripe listen`, buy with 4242…, then **check `subscription_seats` has N rows** — the one
thing that would be empty if ②'s grant were missing while everything else looked perfect.

## ⑦ 👤 ONE STRIPE CUSTOMER PER ACCOUNT — THE `ponytail:` THAT WAS NOT HARMLESS
Founder's call, and he was right: the duplicate-customer case is harmless to **us** (everything keys
on `account_id`) and **not to Stripe** — a parent who cancels and resubscribes has their payment
history split across two customer objects, and Stage 4's portal has to pick one to send them to.
*"Which of your two customers is this parent"* has no good answer and gets worse monthly. Checkout
now reuses `subscriptions.stripe_customer_id` (⚠️ there is no `billing_customers` table — the id
lives on the subscription row). ⚠️ Read with **the parent's own token, never the service role** —
RLS already scopes it to their own row, and the key that bypasses every policy stays out of a route
a logged-in stranger can reach; gated by a sentinel that must appear in NO outbound call. ⚠️ A stale
id (deleted, or from the other mode) is retried once as a new customer, because a duplicate beats a
family that cannot buy. **5 more mutations, 5 caught.**

## ▶ OPEN
1. ✅ **MERGED AND APPLIED.** #60 (Stage 2a + 2b) merged; #59 closed as superseded; #61 captured the
   rollback and made CI run it; #62 recorded the apply. **`materialize_seats` is LIVE in production**
   as ledger version `20260825030558`, verified from the catalog and **fingerprint-matched to the
   artefact CI tested** — body `5ee877cc8970db10a0d6b8daac5082f3` and
   `service_role=true authenticated=false anon=false` on **both** sides. Advisors: **no new
   findings**, and `materialize_seats` is absent from the SECURITY-DEFINER-executable WARN list — a
   third instrument agreeing that `authenticated` cannot call it.
   ⚠️ **B12 did not block it and the rule was APPLIED, not skipped:** one function created, zero rows
   mutated, none of `sessions` / `learner_progress` / `learner_stats` touched.
2. 🔴 **B12 IS STILL THE FOUNDER'S AND STILL BLOCKS EVERYTHING FROM STEP 1.** Supabase Pro before any
   live key and before `enforced` is ever true.
3. ✅ **THE SQL HALF RAN, THREE TIMES.** `RLS_ASSERTIONS=74` on every run since. ⚠️ Read ② for what
   that green is and is not worth.
4. ⏭️ **STEP 3 IS NOW BLOCKED ON THE FOUNDER ONLY — the Stripe side.** ✅ Step 0 returns **1**.
   ✅ Both routes driven on a real dev server (`/api/checkout` 401 with no token,
   `/api/stripe/webhook` 503 unconfigured). Still needs: a `sk_test_` key (I must not create
   accounts or handle credentials) · `stripe listen`'s `whsec_…` · and
   `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, without which the webhook 503s before doing anything.
5. ⚠️⚠️ **THE PURCHASE RUNS AGAINST PRODUCTION, DELIBERATELY — founder's call, and the reason is this
   session's own principle.** *The point of the test is the PRODUCTION schema, function and grants; a
   throwaway project is a database nobody will ever pay against* — i.e. verifying where the failure
   cannot occur. **Three conditions, none optional:** ① record the Stripe customer and subscription
   ids BEFORE buying, so cleanup targets known rows rather than "everything that looks like a test"
   · ② clean up immediately after and **verify the cleanup by query** — not "ran the delete" but
   "queried and the rows are gone" · ③ **once**; needing to repeat it is the signal to reconsider.
   All three billing tables are **empty today** (measured), so the after-state is the same number
   rather than a judgement call. **Watch, in order: `stripe listen` → 200 · `subscriptions` one row
   `active` with `seats_paid = N` · `subscription_seats` N rows.** The third is the one that would be
   empty while the first two looked perfect. I read all three back from production myself afterwards.
6. ⏭️ **Then Stage 3 = UI**: the lock screen `sync_session`'s 42501 has been owed since Stage 1, a
   pricing page, the seat manager, and the customer portal.
7. 🔴 **`DRAFT = true` — the privacy policy and ToS are still placeholders (B1/B2).** You cannot
   charge a parent under a placeholder ToS, so this blocks going live as hard as B12 does.
8. 🟡 Vercel Web Analytics still off; the funnel this all hangs off is unmeasured.
9. ⚠️ **NINE DEPENDABOT PRs OPEN AND UNTRIAGED** (#28–#47). Do not merge as a batch.
10. ⚠️ **Prose drift, rescued from the block archived today rather than lost with it:**
   `20260817174352_privacy_and_leads_hardening.sql` and `src/app/api/lead/route.ts` still say the
   anon INSERT revoke has not been applied. It was, on 2026-08-24. Comments only, no behaviour.

> 🧾 **2026-08-25 (second pass) — STAGE 2a: THE SEAT MATERIALISER, THE ONE THING STAGE 1 LEFT DEAD. AND THE WHOLE OF STAGE 2 IS TEST-MODE-ONLY BY FOUNDER'S ORDER — NOTHING IN IT CAN TAKE A REAL CARD.** `tsc` 0 · **1535/1536** · **`ci / rls-tests` 64 → 73 assertions, green on a real Postgres** · **PR [#59](https://github.com/RadlorInc/learn/pull/59) OPEN, NOT MERGED, NOT APPLIED.** 🔴 **BLOCKED on the price ladder — see ▶2.**

## ① 🪑 `materialize_seats` — A RECONCILER, NOT AN INSERTER, AND THAT IS THE WHOLE DESIGN
Stage 1 created `subscription_seats` and never wrote a row to it: the tests insert seats by hand, so
entitlement was structurally correct and **practically dead**. This is the function the webhook will
call. ⚠️ **The Stripe webhook is at-least-once AND out-of-order**, so "add N seats" is wrong under
both — a replay costs a seat every single time. Given a TARGET it makes the world match, so replaying
changes nothing and any delivery order converges on whatever the last event said.
- ⚠️ **A downgrade takes EMPTY seats first, then the highest occupied ones.** 4 → 2 must not evict a
  seated child while an unoccupied seat sits beside them. Deterministic: the same downgrade always
  frees the same seat.
- ⚠️ **It CLAMPS an over-quantity rather than raising.** Stripe owns the quantity and losing a
  webhook is worse than clamping one — the same reasoning `subscriptions.status` carries no CHECK
  for. The column's own `check (seat_index between 1 and 4)` still makes a fifth row unwritable.
- **Nine assertions, DRIVEN against a real Postgres** (`ci / rls-tests`, `RLS_ASSERTIONS=73`): lowest
  indexes filled, a replay changes nothing, a seated child survives a downgrade, 7 clamps to 4,
  cancelling frees every seat without touching the child's record, and **`authenticated` cannot call
  it — asserted by ATTEMPTING it**, because a grant handed back by a later migration is invisible to
  the REVOKE in the source.
⚠️ **I cannot run that suite locally** (no psql, no Docker, no CLI on this machine). The PR exists so
CI runs it; nothing here was believed before the job reported 73.

## ② 🔒 TEST MODE FOR THE WHOLE STAGE — [docs/billing-stage-2.md](docs/billing-stage-2.md)
Founder's hard constraint: **no live keys, no live products, no live webhook, nothing that can charge
a real person, for all of Stage 2.** Two reasons, both outranking convenience: **B12 is still open**
(the first real payment is when losing that database stops being recoverable by apology), and
**checkout is the one piece that can charge someone before `enforced` has any say** — the flag gates
ACCESS, not PAYMENT, so `enforced = false` is *not* a safety net here and must not be sold as one.
**The go-live sequence, ordered, no step skipped:** ① B12 → ② the applied-schema fingerprint check
re-run against production → ③ **a test-mode purchase the founder watches end to end** → ④ live keys
→ ⑤ `enforced = true`. ⚠️ **④ and ⑤ are separate on purpose**: prove the payment path on real cards
BEFORE removing anyone's access. Enforced in code, not discipline — a gate asserts the configured key
is `sk_test_`, because a rule somebody has to remember is not a constraint.

## ▶ OPEN
1. ⏸️ **PR #59 is green and waiting** (`rls-tests` 73, `verify` green). Not merged, not applied.
2. ✅ ~~**THE PRICE LADDER IS RECORDED NOWHERE**~~ — **CONFIRMED AND WRITTEN DOWN 2026-08-25**, in
   `src/core/billing.ts`; see the 💳 block above. What follows is why it mattered. The SHAPE is settled and written down (graduated never volume · 4 seats · USD · tax off);
   the AMOUNTS exist only in the founder's head. Needed to finish products, checkout and the totals:
   the monthly ladder per tier, the annual equivalent, and how the annual discount is expressed (its
   own price object, or a % off monthly). **Write them into `billing-stage-2.md` the moment they are
   said.** ⚠️ The totals test hand-computes its expectations rather than deriving them from the
   ladder — otherwise a typo redefines "correct" instead of failing.
3. ⏭️ **Next, and unblocked:** the webhook + `billing_events` idempotency (`stripe_event_id` is
   already `unique`, so the DB is the idempotency authority, not application memory). Will add the
   `stripe` SDK — signature verification is a security path, not a place to save a dependency; it is
   server-only, so no client-bundle cost.
4. 🔴 **B12 remains the founder's and now blocks two things**: the pipeline, and every step of §② from
   ④ onward.
5. 🔴 **`DRAFT = true` — THE PRIVACY POLICY AND ToS ARE STILL PLACEHOLDERS (B1/B2).** A hard blocker
   for marketing maths to under-13s, and it now also blocks taking money: you cannot charge a parent
   under a placeholder ToS. ⚠️ **Carried up here on 2026-08-25 because it was about to be archived
   with the 🔐 block and existed nowhere else** — the same way "Vercel Web Analytics is still off"
   (⑥ below) was quietly lost when the 🚦 block was archived earlier the same day.
6. 🟡 **Production is still half-blind: Vercel Web Analytics is NOT enabled** (404 when checked
   2026-08-23). `error_events` receives rows since the service-role key landed, so crashes are
   captured; nothing measures traffic or the funnel this session just built. ⚠️ Which means **the two
   numbers in [docs/checkup-optional-metrics.md](docs/checkup-optional-metrics.md) are answerable
   from `learner_events` and nothing else is.**
7. ⚠️ **NINE DEPENDABOT PRs OPEN AND UNTRIAGED** (#28–#47). Do not merge as a batch — the standing
   warning about TypeScript 7 / eslint 10 / jsdom 30 still applies.

> 🚪 **2026-08-25 — THE FUNNEL: THE CHECK BECAME OPTIONAL, THE DEMO ROUTE SHIPPED, AND SIGNING UP NOW CARRIES THE PLAY ONTO THE ACCOUNT. ⚠️⚠️ AND THE THREE-MONTH `onComplete` P0 TURNED OUT TO HAVE LEFT ITS CORPSE IN PLACE — I WAS THE NEXT CALLER TO TRUST IT.** `tsc` 0 · **1535/1536** · `next build` 0 · e2e demo **3/3** + adaptive **2/2** · **9 commits, pushed** · prod **sw v145**.

**The asks, in order:** the pipeline decision · door 2 · durable resume · *"the check stays exactly as it is, unchanged, and becomes optional"* · the demo route · the local→server adopt.

## ⓪ 🧯 THE CHECK-SHAPED DEFECT CLASS IS NOW THE TOP OF CLAUDE.md, AND IT GREW TO THIRTEEN
Founder's call: the through-line is the organising principle, not a list. **A check is not a check
until you have watched it fail for the right reason. Green is not evidence. Present is not
enforcing. Found-nothing is not clean.** The instances are keyed on MECHANISM — a skip, a shape, a
moment, an order, a flag, a dead clause, a wrong target, a one-valued metric, an artefact without
the feature, a world without the bug, a proxy boundary, a drifted fixture — because *the point is
that pattern-matching will not find the next one.* **The table is meant to grow.**
⚠️ **#11 IS A DIFFERENT ANIMAL AND HAS ITS OWN SECTION**: not a check that cannot fail but **a wire
that is not connected while both ends read as connected** — see ②.

## ① 🎚️ THE CHECK IS OPTIONAL, AND THE SHORT PASS WAS MEASURED AND REJECTED
The founder had argued FOR forcing it, and reversed himself on the numbers: forcing was defensible
only while a MIDDLE option existed. Measured, the spine-only short pass is a bad trade in every band
— 6–8 halves the length and misses **45%** of gaps (exact 95% → 53%), 9–11 misses 32%, and **17–18
has no short pass at all** (`PROBE_SWEEP['17-18']` is empty, so spine IS the full agenda; a "quick
check" button there is a control that changes nothing).
So: **the check is untouched — not shortened, no new modes** — and skipping is one tap with no
confirmation. ⚠️ **OPTIONAL MUST NOT MEAN PLANLESS**: a skip issues `gradeStartPlan(band)`, and
`ActivePlan.source` now records where a plan came from, because *"Milo picked this to close the gap"*
is a straight falsehood after a skip. Re-offered ONCE, on the menu, after the child finishes a plan
chapter; a second decline retires it to the parent dashboard for good.
📊 Metrics + **pre-registered interpretations** in [docs/checkup-optional-metrics.md](docs/checkup-optional-metrics.md).

## ② ⚠️⚠️ THE `onComplete` P0 LEFT A CORPSE, AND IT WAS STILL WARM
`ChapterProps.onComplete` has been in every chapter's signature since the beginning; both registry
factories took it as `_props` and dropped it. **That is the P0 that stalled every child's plan for
three months.** It was fixed by moving the pointer into `finishAndSync` — correct — **and left the
prop in place, still typed, still passed, still discarded.** `/demo` is the next caller, and cannot
use `finishAndSync` at all (a logged-out visitor has no learner: `if (!learner) return`).
**What makes it its own class is that it is invisible from BOTH ends.** The caller believes it passed
a handler; the chapter shows its end screen either way. Only an e2e that plays a chapter to its end
and asserts *the demo advanced* can see it.
⚠️⚠️ **AND WAKING IT WOULD HAVE BROKEN ALL 72 CHAPTERS.** `/game`'s dormant `handleComplete` set
`chapterDone`, and the mount read `{!chapterDone && playingChapter && …}` — so the moment the wire
was connected, every chapter would have **unmounted the instant a child finished it**, taking its
own end screen with it. **Dead code is a trap with a timer somebody else starts.** Flag deleted.

## ③ 🚪 THE DEMO ROUTE, AND THE ADOPT THAT MAKES IT WORTH ANYTHING
`/demo`: band picker → the first two chapters of that band's `gradeStartPlan` (**the same plan a
skipper gets — no second curriculum to drift**), minus anything AR → then the account. No email, no
name, no account up front. The wall says what an account BUYS, never that the demo is spent.
`adoptDemoRun` runs at learner creation beside the pending-diagnostic replay it is modelled on: a
session per played chapter with stars/XP recomputed via the pure `scoreChapter`, and the plan's
pointer walked past what they played. ⚠️ **Peek-then-consume-on-match** — a band mismatch LEAVES the
run stashed. ⚠️ **A diagnosis outranks the demo for the PLAN**; the sessions are adopted either way.
⚠️ `GuardedChapter` gives `/demo` and `/teen-preview` **one** camera guard — two copies is the day
they disagree, and the disagreement shows a logged-out child a camera button.

## ④ 💾 DURABLE RESUME + 17–18's DOOR 2
The probe's resume moved from per-tab sessionStorage to **kv, per learner, 7-day TTL** — the old
comment argued for sessionStorage and was right when the probe was short; at 20–50 questions
"abandoned" means "ran out of evening". ⚠️ Across sittings it is **OFFERED, never applied** (silently
reopening question 26 leaves no route to a fresh check). Door 2 seeds the probe at a strand the
student names — `strandChoices` derives them from the spine, 17–18 only.

## ⑤ 🚦 THE PIPELINE: DECIDED, NOT BUILT
✅ **`migrate-prod` gets its own `production-db` environment**, created WITH its reviewer rule at
enable time and not before. ⚠️ **The casing trap in the last handoff was NOT REAL** — GitHub matches
environment names case-insensitively (measured). What IS real: `Production` is **Vercel's** (68
deployments), so a reviewer there would gate the whole site's deploy path to protect a schema apply,
and the first wedged hotfix removes it — taking the database protection with it.

## ⑥ 🧹 EVERY CHARACTER WINDOW IS GONE FROM THE GATES
Three in one session reported on text they never saw. Swept all 12 sites onto
`src/__tests__/_window.ts` (`balanced` / `element` / `strip`). ⚠️ **A negated class is also a proxy**
— `[^>]*` is a real bound in SQL and a lie in JSX, because `=>` contains a `>`.

## ▶ OPEN
1. 🔴 **B12 IS THE ONLY THING BLOCKING, AND IT IS THE FOUNDER'S.** Supabase Pro before `enforced` is
   ever flipped true and before any live Stripe key exists. It also gates the pipeline (⑤).
2. ✅ **The smoke test passed** (2026-08-25): a chapter played to completion on an established
   account, stars saved — progress writes survive the billing guard with the flag off. First time
   anybody had watched it.
3. ⏭️ **STAGE 2 — STRIPE, TEST MODE ONLY.** Founder's hard constraint: no live keys, no live
   products, no live webhook, nothing that can take a real card, for the WHOLE stage. Live keys are
   a deliberate later step — after B12, after the fingerprint check, and after the founder has
   watched a test-mode purchase end to end.
4. ⚠️ **NINE DEPENDABOT PRs STILL OPEN AND UNTRIAGED** (#28–#47). Do not merge as a batch.
5. ⚠️ Accepted limitation, unchanged: RLS gates the RECORD, not chapter CONTENT.

> 💳 **2026-08-24 (fourth pass) — THE BILLING SCHEMA IS APPLIED TO PRODUCTION AND COMPLETELY INERT. ⚠️⚠️ CAPTURING THE ROLLBACK CAUGHT MY OWN MIGRATION SILENTLY REVERTING A SECURITY FIX, FOUR HOURS AFTER I WROTE THE RULE THAT CATCHES IT.** `tsc` 0 · **1477/1478** · `ci / rls-tests` **64 assertions** · ledger **74 → 76**. **6 PRs merged** (#51–#56).

## ⓪ ⚠️⚠️ THE MIGRATION WAS NOT APPLICABLE AS WRITTEN, AND "RISKY" WOULD HAVE BEEN THE WRONG WORD
Production has zero subscriptions, so the moment `is_chapter_entitled` reached the `sessions`
policy, entitlement would collapse to `is_free` and **every existing family would stop being able to
save progress in 65 of the 72 chapters, instantly.** `billing_config.enforced` (default **false**)
makes the whole surface land inert; the paywall goes live by flipping one boolean later.
⚠️ **IT FAILS OPEN AND THE CAMERA GUARD FAILS CLOSED — NOT AN INCONSISTENCY.** Founder's words: *a
camera without consent harms a child; a paywall failing closed breaks a working product for every
family at once.* Different failure costs, different defaults. Recorded in the doc so nobody
reconciles them.
⚠️ **A DEFAULT-OFF FLAG IS A HOLE UNLESS THE SUITE FORCES IT ON *AND ASSERTS IT DID*** (F0). Setting
alone is silently removable. It also closes an unrelated hazard: an accidental `PROD_PROJECT_REF`
waking `deploy.yml` now applies a paywall that does nothing.

## ① ⚠️⚠️ THE ROLLBACK CAPTURE CAUGHT A REVERTED SECURITY FIX — MINE
`plan_entitlement.sql` rebuilt `sync_diagnostic` from `20260702131627_diagnostic_idempotency`, which
is OLDER than `20260703014331_harden_rpc_inputs` — so it silently dropped the **V5 payload bounds**.
The `leads_server_only` class exactly, on the same day, by the person who wrote the runbook rule.
⚠️ **READING THE REPO DID NOT FIND IT: my grep was CASE-SENSITIVE and the hardening file writes
`CREATE OR REPLACE FUNCTION` in capitals.** `pg_get_functiondef` found it in one query. Founder's
sentence, now in the runbook: *reading the repo answers "what did we intend", querying production
answers "what is true" — only the second one is a check.*

## ② 🧪 TWO DERIVED GATES, BOTH MEASURED BEFORE BEING WRITTEN
- **functions** — the newest definition must keep every `raise exception` an earlier one added.
  Exactly 1 violation across the 18 redefined functions; it was mine.
- **policies** — the newest must keep every LITERAL an earlier one used (a policy's guard is one
  anonymous expression, so there is no named condition to compare; a regex/status/bound survives a
  rewrite). **0 violations today; replayed to the corpus as it stood when `leads_server_only`
  shipped, exactly 1 — that one.** The restore's `between 3 and 254` → `>= 3 and <= 254` is
  correctly NOT flagged.
  ⚠️⚠️ **`baseline_schema.sql` MUST BE ORDERED FIRST.** It is migration-zero but is GENERATED FROM
  LIVE PRODUCTION — ordered last it supplies the very predicate a regression just removed. Ordered
  last: zero findings. Ordered first: it finds the regression. **Fourth "check that silently finds
  nothing" today**, hence the new standing habit in CLAUDE.md.

## ③ ♻️ THE ROLLBACK IS RUN, NOT READ
`ci / rls-tests` applies the billing migrations, runs `supabase/schema/rollback_20260824_billing.sql`
and asserts production's captured fingerprints come back — with a **positive control first**, or the
step passes on a database where the migrations never applied. Reading it had already caught one
defect (`pg_policies` reports a null qual for an INSERT policy, so the capture emitted `using
(true)` — invalid DDL). Reading is not running.

## ④ ✅ APPLIED, AND VERIFIED BY FINGERPRINT RATHER THAN BY A LIVE WRITE
| | |
|---|---|
| `20260824133906` | `billing_schema` |
| `20260824134125` | `plan_entitlement` |
⚠️ **THE POST-APPLY WRITE PROVES NOTHING ABOUT THE GUARD** — with `enforced = false` it succeeds
either way. So `ci / rls-tests` PUBLISHES the fingerprints of the schema it tested with the
enforcing path on, and **all five matched production exactly** (2 policy predicates,
`is_chapter_entitled`, `sync_session(11)`, `sync_diagnostic`). That is the proof; the live write is
only a smoke test — **and it could not be run: `execute_sql` connects as `supabase_read_only_user`.**
It needs a real signed-in session. ⚠️ Still owed.
`active` backfill touched **0 rows** as predicted (14 plans, none doubled); 9 gained `free_chapters`.
Advisors: no new problems — three `rls_enabled_no_policy` INFOs are the intended deny-all design.

## ⑤ 📷 AND THE COPPA FIX SHIPPED FIRST, ALONE (#53)
`/teen-preview?c=<AR id>&taste=1` rendered a camera chapter to a logged-out child — 12–30% of report
links in four bands. Guard at the ROUTE, not a picker: the live leak had no picker, the URL *is* the
picker. `e2e/ar-consent.spec.ts` drives the real URL for all eight and asserts `getUserMedia` is
never called, with three controls. ⚠️ And the fix blinded `all-chapters` until that was fixed too.

## ⑥ 🚦 THE PIPELINE PROPOSAL — WRITTEN, NOT BUILT ([docs/migrate-prod-proposal.md](docs/migrate-prod-proposal.md))
Hand-applying is the ROOT CAUSE of the 58-file drift repaired this morning, and today added two
more plus 442 lines retyped into a tool call. ⚠️ **It is not enable-or-don't** — founder's framing:
a GitHub **protected environment with a required reviewer** keeps a human between a merge and a
schema change while ending the transcription. Three conditions, all unmet: **B12 first** · required
approval · **and the pipeline must be SAFER, not merely more consistent** (it must run the stale
diff against PRODUCTION, turn B12 into a grep over pending migrations, and fingerprint the applied
schema — or it is faster and worse).
✅ **Condition 2 is available**, measured via the API: repo **public**, org plan **free**, so
environment rules cost nothing. Three environments exist and **none has a protection rule**; there
are no repo variables or secrets at all.
⚠️⚠️ **AND A TRAP IN THE NAMES.** `deploy.yml` says `environment: production`; the environment that
exists is `Production`. **A workflow referencing an environment that does not exist CREATES it,
unprotected** — so the gate can be bypassed while the settings page looks right. **Verify the
reviewer by watching a job PAUSE, never by reading a settings page.**
⚠️ **The flag's limit is written down** so nobody sells it as the net: `enforced` makes an accidental
apply of THESE TWO migrations harmless and does **nothing** for a future one. The net is B12 + ③.

## ⑦ 🎚️ FUNNEL ITEM ONE: A NARROWED PROBE MAY NEVER SAY "ON TRACK" (PR #58)
The constraint is in the ENGINE, not the copy — copy is where it rots. `startProbe(band, config,
agenda?)` narrows the investigated entries (the short pass; 17–18's door 2), and
`Diagnosis.coverage` is `'full'` only when the whole band was investigated **and finished**. The
report BRANCHES on it: the on-track card is unreachable from a partial pass, which offers the full
check in one tap instead.
⚠️⚠️ **SIX MUTATIONS, THREE SURVIVED, AND THE THREE WERE THREE DIFFERENT LESSONS.**
- the cap clauses (`asked < maxItems`) were **INERT** — a cap always leaves the agenda or a frame
  open — and in the one case they were not redundant they were **wrong**, reporting a FINISHED
  search as partial. Deleted. *An inert clause in a load-bearing rule is worse than none, because it
  reads as protection.*
- the `frames` term was a **MISSED REGRESSION**: it matters when the last entry fails and the cap
  cuts the descent, a state no driven test reached. Built as a fixture, with a positive control.
- the `agenda` term was missed for the mirror reason — every case used a FAILING answerer, which
  always opens a frame, so the frames term caught it instead.
Each term now has a state where it is the only one that says no.
⚠️ And the report's source gate first matched a bounded window that stopped at the first `) : (` —
inside the very ternary it checks. **Third time today a window ended at the wrong place.**

## ▶ OPEN
1. ⏸️ **THE FOUNDER IS RUNNING THE SMOKE TEST** — sign in, play a non-free chapter, confirm it
   saves. The one step of the apply sequence I cannot perform: `execute_sql` connects as
   `supabase_read_only_user`. **Nothing else touches production until it comes back.**
2. 🔴 **B12 IS ON THE CRITICAL PATH AND IS THE FOUNDER'S.** Supabase Pro before `enforced` is ever
   flipped true — the day we take money is the day losing that database stops being recoverable by
   apology. It also gates the pipeline proposal (⑥).
3. ⏸️ **TWO PRs OF MINE OPEN:** #57 (the applied migrations, renamed, + the pipeline proposal) ·
   #58 (probe coverage). Six merged today: #51–#56.
   ⚠️ **AND NINE DEPENDABOT PRs ARE OPEN AND UNTRIAGED** (#28–#47), the oldest from weeks ago —
   including `actions/checkout 4 → 7`, `setup-node 4 → 7` and `supabase/setup-cli 1 → 3`, all of
   which touch the CI that this session has been leaning on. Do NOT merge them as a batch (the
   standing warning about TypeScript 7 / eslint 10 / jsdom 30 still applies).
4. ⏭️ **THE REST OF THE FUNNEL, in order:** 17–18's door 2 as a seeded probe on top of #58 · the
   short pass (spine prefix) · durable resume (the probe resume is sessionStorage, per-tab — "comes
   back tomorrow" needs kv, per learner) · the demo route (band picker → 2 chapters, local only) ·
   the local→server adopt at signup (`progressMerge` is server→local only; demo runs never reach
   the server, so a second device shows nothing).
5. ⚠️ **17–18 IS TWO DOORS, NOT A CUT** — measured: a 20-item cut names a root **3 levels too
   shallow 63%** of the time and the true chapter is absent from the plan **2 times in 3**, while
   only 4% announce themselves as empty. Door 2 (seeded at the named strand) is **94% at 28
   questions**; a wrong self-report costs 2 questions and is caught by ⑦.
6. ⚠️ **Accepted limitation, unchanged:** RLS gates the RECORD, not chapter CONTENT.

_Older sessions (2026-06-15 → **2026-08-24**, including 🧾💳 **the Stage-1 day** (the paywall's schema, RLS and entitlement, the guard at all three write paths, and the free-set proposal against the AR constraint), moved 2026-08-25 — ⚠️ its two still-live items (the free set is a PROPOSAL not a pick; the `error_events` fkey contradiction) were lifted into the current ▶ OPEN rather than archived with it; including 🧾 **the ledger-repair day** (58 repo migrations relabelled to the versions production recorded, `perf_advisors` applied, and the dry-run computed rather than credentialled), moved 2026-08-25 — ⚠️ its one still-live item (the anon-INSERT prose drift) was lifted into the current ▶ OPEN rather than archived with it; including 🔐 **the road-to-a-paywall day** (the RLS suite that had never run once, three privacy gaps between the published copy and the system, the anon INSERT closed, and the security regression caught four minutes after shipping), moved 2026-08-25 — ⚠️ its still-live blockers (B1/B2 `DRAFT = true`) were lifted into the current ▶ OPEN rather than archived with it; including 🚦 **the production-readiness day** (three workflows green while doing nothing, the dead error sink, eight chapters unstartable on a landscape phone), moved 2026-08-25; including 🔬 the seven-learner-models day (moved 2026-08-24), 🕸️ the skill-graph sensitivity audit and 🎯 the diagnostic's 96–98% rebuild, both moved 2026-08-24; plus 🇺🇸 the US-spelling / SEO / region-migration day, 🔗 the social-handles day, ❓ the question-quality sweep and 🎚️ the adaptive-loop day, all moved 2026-08-22) live in [docs/handoff-archive.md](docs/handoff-archive.md) — not loaded at session start. `grep` it for a chapter or a decision. Moved there to keep this file inside its size budget: the two 2026-08-14 blocks (🧱 all six neon chapters onto GameShell · 🎛️ the band moving onto the 12–18 engine) on 2026-08-16, 🏗️ **The Empty Plot** (the last neon chapter + the 3D deletion + the explainer-film pipeline) on 2026-08-17, 📊 **The Loading Bay** (the first storybook chapter onto GameShell, and the mastery exit finally seen to fire) and 🚀 **the first launch-hardening day** (0 security advisories, crash screens, self-hosted fonts, the enforced CSP, legal plumbing, the launch runbook) both on 2026-08-17, and 🔒 **launch hardening round two** (the walkthrough dead end, the CSP gate that had been red for a day, `media-src` silently killing the recorded voice on mobile) on 2026-08-18, and 🕳️ **the plan-pointer P0** (`ChapterPortal` dropping `onComplete`, so no child's diagnostic plan advanced for three months — plus the one-emoji-to-crawlers SEO fix and the inert short-landscape gate) on 2026-08-18, and 🧭 **the 2026-08-18 architecture/security/devops day** (the layering refactor, V13–V20, the two vacuous scheduled sweeps) on 2026-08-19, and ⚡ **the performance pass** (57 MB of art revalidated on every request, every backdrop shipped as full-size PNG, every creature journey relaying out the document — plus the /game fit controller that turned out to be dead code) on 2026-08-19, and 🛡️ **the five-role red-team day** (the AR camera door that could strand a child for ever, the placement check dying on one Back press, and the regression I shipped inside my own fix) on 2026-08-20, and — moved 2026-08-24 — 🚚 **The Packing Shed + The Minibus Run** (the two 9–11 chapters that closed the multiplication/division content hole) and 🎯 **the diagnostic rebuild** (26–34% → 81–87%, the answer-surface fix and the first accuracy gate), and — moved 2026-08-23 — 📐 **the tester's-four-bugs / responsiveness-sweep / `useOnceGuard` day** (the StrictMode ref guard that froze ten chapters' demos in dev only, 683 → 2 sub-44px tap targets, and 20/20 storybook coverage), and — on 2026-08-21 — ⚡ **the font pass** (Gaegu preloading 90 subsets), 🔎 **the public-SEO pass**, 🏷️ **the AdaptiveLearn rename**, and 🏗️ **the move onto the company account** (whose still-open items were carried forward into the 🧭 block rather than archived with it)._
