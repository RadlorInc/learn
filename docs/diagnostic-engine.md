# Milo Diagnostic Engine — Spec (Phase 1 build target)

The engine turns the skill graph (`src/lib/skillGraph.ts`) into the product: find a child's
**root gap**, show the parent the gap + downstream cost + plan, and re-check at week N for the
guarantee. Reads the graph in-code; persists results to the DB (see migration
`..._diagnostic_engine_schema.sql`). Reuses the existing adaptive engine (`useAdaptive`,
L1/L2/L3) for item selection.

---

## ⚠️⚠️ v2 (2026-08-22) — WHAT CHANGED, AND WHY THE v1 NUMBERS WERE NOT WHAT ANYONE THOUGHT

The engine below is unchanged and was never the problem. **What was measured for the first time on
2026-08-22 is the thing the product is sold on: given a child with a real gap, does the report name
the right one?** Simulated against learners with a planted gap — broken at one skill and everything
downstream of it, answering with each item's REAL guess rate and a 10% careless slip:

| | v1 (4-choice MCQ) | v2 (typed answers + sweep + bisection) |
|---|---|---|
| names the EXACT root gap | **26–34%** | **96–98%** |
| tells a child with a real gap they are on track | **10–38%** | **0%** |
| names a gap a BAND BELOW for an on-grade child | — | **≤ 4%** |
| a gap on a leaf chapter reaches the route | **impossible** | **83–95%** |
| route starts at the gap when the gap owns no chapter | **never** | always |
| probe length, on-grade child (median) | — | 9–16 |

Three independent causes, all outside the search algorithm:

1. **The answer surface.** One 4-choice MCQ per skill = a 25% lucky pass (50% on four of them, two
   of which were band *entries*). Worse, the fail-confirmation strike re-offers a missed skill, so a
   broken child got **two** shots at the guess: `p + (1−p)p`, i.e. 25% → 44% and 50% → **75%**. And
   a lucky pass on an ENTRY closes that whole branch for ever, which is why a quarter to a third of
   gapped children were told they had none. **Fix: where the answer is a number the child types it**
   (`input: 'num'`), a fraction gets two boxes (`'frac'`), and `'pick'` survives only where the
   answer space is genuinely categorical — widened to six. Driven with clean items the same descent
   resolves the exact root **90–98%** of the time, which is what proved the engine innocent.
2. **Coverage.** The probe only ever walked DOWN from a few entries, so a skill nothing depends on
   was unreachable — **fourteen skills and ten built chapters**, including subtraction, rounding,
   time, money and both word-problem chapters. A 6–8 child's whole check saw 11 of 74 skills and
   could not ask about subtraction. **Fix: `PROBE_SPINE` + `PROBE_SWEEP`** (see skillGraph.ts).
3. **The route.** Three skills own no chapter and `chapterFor` silently dropped them, so a child
   whose root gap was multiplication FACTS was routed to Factors & Primes — downstream of the very
   thing they could not do. **Fix: `remediation`**, the nearest chapter we actually own, stated as a
   stand-in. The route is also **derived from the gap now, not from which questions got asked** —
   `[...failed]` was a fair approximation of the chain while the descent walked every level, and
   became wrong the moment it started bisecting.
4. **Every answer is confirmed, and failing is harder than passing.** Keep asking until one answer
   LEADS — by two to pass, by **three** to fail. The two verdicts do not cost the same thing: a pass
   moves on, a fail sends the search downward and tells a family their child is behind. Measured
   with each item's real guess rate, a symmetric rule made a double-slip almost routine (8% of
   on-grade 12–14 children were told their gap sat a band below them); the asymmetry took the whole
   product to **96–98% exact, 0% missed**. ⚠️ Two intermediate designs were built and measured and
   are recorded in `MAX_TRIES`, because both sound right and neither is: confirming only FAILS
   leaves 12–19% of diagnoses one step too shallow, and confirming only SPINE passes still lets a
   leaf-only gap be lucky-passed away. The cost is questions — see the length note below.
5. **Confirmation stopped too early.** A first miss was re-asked — but only while confirmed fails
   were below four, on the argument that a child failing that much is not slipping. True, and it
   meant the bands that descend furthest burned through four fails on the way DOWN, so most of a
   17–18 descent ran unguarded and one slip there planted a root two or three chapters too deep.
   Measured, the too-deep error tracked the descent distance almost exactly — 1% at one band below
   the child, 9% at 3.6 bands. Guarding at every depth took 17–18 from 76% to **83%** and its
   too-deep errors from 10% to 5%. ⚠️ A THIRD item on the ambiguous "miss then pass" was built and
   measured and bought **nothing** (exact flat, on-grade false alarms 14% → 25%); five tries came
   out identical to three. See `MAX_TRIES`.
6. **The descent walked; now it BISECTS.** One question per LEVEL, and the chains are nine deep — the
   17–18 band spent **11.3 of its 20.2 questions on the descent alone**, and each of those is another
   chance for a slip to plant a false deeper root. Halving the candidate set instead is shorter *and*
   more accurate. ⚠️ It opens in direct-prerequisite mode and only starts bisecting once something
   under the node fails: bisecting from the start took a grade-level 17–18 child from 9 questions to
   22, because with nothing broken the cheap question is "do this skill's own prerequisites hold?".
7. **The leaf sweep reaches one band DOWN.** A 9–11 child who cannot tell the time was invisible.
   Each band now also sweeps the previous band's **standalone topics** (money, time, story problems,
   rounding, units, angles, charts) — the ones nothing else can reveal — and deliberately not its
   foundational skills, which any failure above already routes the descent through.
8. **The week-6 re-check is surfaced to the CHILD.** It had fired zero times on production with five
   children 45–50 days overdue: the nudge lived only on the parent dashboard, for whichever learner
   happened to be selected. It is now a card on `/menu`, which the child opens every session.

**The gate is `src/__tests__/diagnosticAccuracy.test.ts`** and it is the contract: exact-root rate,
missed-gap rate, false-alarm rate, leaf coverage, route-starts-at-the-gap, and probe LENGTH. It is
seeded, so it is not a coin flip. ⚠️ The eleven engine tests that existed before it all drive a
PERFECT ORACLE ("knows it ⇒ correct"), which is why they were green throughout.

⚠️ **STILL OPEN, STATED RATHER THAN HIDDEN.**
- **Length.** An on-grade child answers 9–16 (9–11 is the longest, because it sweeps the most leaf
  chapters); a gapped one reaches 16–27 at p95. That is above this spec's "~8–12 items" and inside
  its "5–8 min", because a typed arithmetic answer is quick. **Coverage is what costs it** — the
  sweep is 3–4 questions and it is the only thing that can find a money, time or rounding gap.
  Trading it back is a product decision, not an oversight.
- **17–18 and 15–16 sit at 81%**, the lowest bands: its descents cross the most bands, so a slip has the most
  room to land on a wrong-but-deeper root. Their 10–11% "other" is almost entirely that.
- ⚠️⚠️ **A CONTENT HOLE THE DIAGNOSTIC CANNOT FIX: ~10% of diagnosed 9–11 children root on a skill
  with no chapter** (`i.multFacts`, `i.multMultiDigit`, `i.division`; 5–8% for the teen bands). The
  stand-in is weaker than it sounds — a child whose root gap is multiplication FACTS has, by the
  definition of a root, already PASSED equal-groups multiplication, so the plan sends them to a
  chapter they can already do. `i.multFacts` is the most load-bearing node in the whole graph.
  **This needs a Times Tables (fluency) chapter and a Division chapter; nothing in the engine can
  substitute for them.** Gated so it cannot silently widen.

---

## Design constraint (non-negotiable): it must not feel like a test
The taker is often an anxious/struggling child. Violate this and you re-traumatize the exact
buyer you're serving. Rules:
- No timer, no visible score to the child, no wall of red X's (consistent with math-without-fear).
- **Stop-on-struggle:** ≥2 misses in a row → immediately branch down (never let them fail repeatedly).
- Cap total failures experienced per session (`band_probe_config.max_failures`).
- Items are existing interactive sims/story rounds tagged to a skill — it plays like Milo, not an exam.
  ⚠️ **NOT BUILT THAT WAY.** The probe is its own lightweight item set (`core/diagnosticItems.ts`),
  not chapter rounds. v2 narrows the gap where it matters most: the answer is TYPED on the same kind
  of pad the chapters use, rather than picked off a multiple choice — which is both less exam-like
  and the single change that took root-gap accuracy from ~30% to ~80%.
- Length: ~8–12 items, 5–8 min. The *report* is rich; the child's *experience* is light.
  ⚠️ **Measured p95 is 14–27.** See the v2 block above — this is the live trade, not a solved problem.

## Inputs
- `learner` (id, band from age/grade).
- `SKILL_NODES`, `PROBE_SPINE` + `PROBE_SWEEP` (concatenated as `PROBE_ENTRY`), `prereqsOf`,
  `dependentsOf`, `blockedBy`, `chapterFor`, `routeChapterFor` from `skillGraph.ts`.
- `band_probe_config` (entry nodes, max_items, max_failures) — starts from `PROBE_ENTRY`.

## Algorithm — branch-down-to-root

```
frontier = PROBE_ENTRY[band]           // grade-expected skills
visited  = {}
result   = { passed: [], failed: [], root: null }

while frontier not empty and items < max_items and failures < max_failures:
    skill = next(frontier)
    if skill in visited: continue
    visited.add(skill)
    ok = probeSkill(skill)             // 1–2 adaptive items at L2 of that skill (early-exit)
    if ok:
        result.passed.push(skill)
        // passing a prereq bounds the search below it — do not descend
    else:
        result.failed.push(skill)
        frontier.push(...prereqsOf(skill))   // DESCEND toward the root

// Root gap = the DEEPEST failed skill whose every prerequisite PASSED (or has no prereqs).
result.root = deepestFailedWithPassingPrereqs(result.failed, result.passed)
```

- **Root gap** = the lowest broken skill that isn't itself blocked by a lower broken skill. That's
  the single highest-leverage thing to fix — everything above it is downstream of it.
- **`probeSkill`** = one item for that skill. "pass" = correct; a first miss is a STRIKE (a fresh item
  is offered, a pass forgives the slip). Keep it light; this is triage, not psychometric scoring —
  **do not report a precise grade level.**
- **A sweep entry whose prerequisite has already FAILED is not asked** — the edge already answers it.
  It is recorded as failed so its chapter still reaches the route, and it can never become the root
  (a root has no failed prerequisite by definition). Worth ~a quarter of the probe's length.
- **Multiple independent root gaps** are possible (e.g. a signed-number gap AND a fractions gap on
  different spines). Report the top 1–2 by `blockedBy(root).length` (how much each unlocks).
- **No gap found** (all entries pass) → child is at/above grade → switch to "get-ahead" framing
  (band 3–5 default), or probe one level up.

## Outputs (persisted to diagnostic_sessions / diagnostic_results)
- `root_gap_skill` (id) + optional 2nd.
- `blocked_skills` = `blockedBy(root)` → writes the **downstream-cost** copy.
- `strengths` = 2–3 `passed` skills at/near grade → the report **leads with these**.
- `working_level` (coarse band label, never a decimal grade).

## Plan generation
From `root_gap_skill`, walk **up** the dependency chain toward the child's grade node, emitting an
ordered list of skills → their `routeChapterFor` ids (dedup, topological order). ⚠️ `routeChapterFor`,
not `chapter`: three skills own no chapter and dropping them started the child downstream of their
own gap. That's the plan: existing
chapters, L1→L3 + reteach, sequenced per child. **v1 = sequence the catalog (no new content).**
v2 = generate bespoke items at the gap.

## Report (4 slots, band-specific templates)
`strengths → root gap → downstream cost (from blocked_skills) → plan + guarantee`. Emotional core:
*"not broken — one fixable snag."* Every "loss" stated is true (gap, compounding, window). No fake scarcity.

## Guarantee / re-check (the efficacy loop)
At week N (6 for 6–11), re-probe `root_gap_skill` (+ the next 1–2 upstream). `gap_closed` = now passes.
Store in `rechecks`. This is simultaneously: the guarantee test, the retention proof (weekly parent
signal), and the **efficacy dataset** that later opens schools. One mechanism, three jobs.

## Per-band adaptations
| band | entry depth | item UX | report framing | guarantee |
|---|---|---|---|---|
| 3–5 | shallow | parent-guided/observational | readiness milestones | soft ("kindergarten-ready") |
| 6–8, 9–11 | full descend | kid-driven playful sims | "one fixable snag" | measurable gap closed in 6 wks or free |
| 12–14 | full, crosses down | teen, fast/straight | "here's the unlock" | close blocking gap in N wks |
| 15–16, 17–18 | full, often roots grades below | teen, respects time | "the block isn't algebra, it's X from grade Y" | targeted gap / grade-strand |

## Edge cases
- Child bails mid-probe → save partial; if ≥1 fail with descend, still surface a provisional gap.
- Entry node has no items yet → skip to prereqs (log content gap).
- Cyclic/`dangling` prereq id → must be impossible; guarded by the integrity check on `skillGraph.ts`.
- At-grade child (no gap) → "get-ahead" path, not remediation.

## Open questions (decide before building)
1. Items per skill for a reliable pass (1 vs 2)? Start at 2, tune on real data.
2. Week-N for the guarantee per band (6 assumed for 6–11; teens may be shorter/skill-scoped).
3. Do teens self-serve the probe or is there a parent report handoff? (Likely both: teen takes it, parent gets the report + guarantee.)

---

## Retention, and why the "how Milo worked it out" trace expires at 90 days

**Decided 2026-08-24, alongside the `diagnostic_items` retention job.** Written here rather than
only in a migration comment because the wrong fix is the easy one, and somebody will reach for it.

The diagnostic's data splits in two, and the split is a privacy decision as much as a schema one:

| | what it is | retention |
|---|---|---|
| `diagnostic_items` | the child's **individual answers**, one row per question | **90 days** — this is analytics, and keeping raw responses for ever fails data minimisation |
| `diagnostic_sessions`, `_plans`, `_plan_progress`, `_rechecks` | the **conclusion** — root gap, blocked skills, strengths, working level, and the chapter route built from them | kept until the parent deletes the profile — this is progress |

Verified before the job was written: **nothing in the app reads `diagnostic_items`.** It is written
by `sync_diagnostic` and never selected. The plan is materialised on `diagnostic_plans`
(`skill_sequence` / `chapter_sequence`) and the conclusion on `diagnostic_sessions`, so pruning the
answers cannot cost a child their plan.

### The consequence for the trace

The proposed **"how Milo worked it out"** trace — showing a parent each question, its verdict, and
why the search descended where it did — needs the per-question rows. So it is only constructible
for **90 days after the check**. That is acceptable: the trace is most valuable in the days after a
diagnosis, when a parent is deciding whether to believe it.

### ⚠️ If we later want it to outlive 90 days

**Materialise the trace at diagnosis time. Do not extend the retention on the raw answers.**

Storing a short, derived explanation — the ordered list of skills probed, each verdict, and the
descent decisions — is a handful of rows or one JSON column on `diagnostic_sessions`. It is the
*conclusion*, so it lives under the same "kept until you delete" rule as the plan.

Keeping `diagnostic_items` longer instead would mean retaining every raw response a child ever
gave, for ever, to power a UI feature. That is the option that looks cheaper in a sprint and is a
data-minimisation failure the moment it is written down in a privacy policy — and ours now says,
in as many words, that we keep what the check concluded and not every answer they gave.
