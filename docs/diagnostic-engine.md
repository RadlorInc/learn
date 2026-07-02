# Milo Diagnostic Engine — Spec (Phase 1 build target)

The engine turns the skill graph (`src/lib/skillGraph.ts`) into the product: find a child's
**root gap**, show the parent the gap + downstream cost + plan, and re-check at week N for the
guarantee. Reads the graph in-code; persists results to the DB (see migration
`..._diagnostic_engine_schema.sql`). Reuses the existing adaptive engine (`useAdaptive`,
L1/L2/L3) for item selection.

## Design constraint (non-negotiable): it must not feel like a test
The taker is often an anxious/struggling child. Violate this and you re-traumatize the exact
buyer you're serving. Rules:
- No timer, no visible score to the child, no wall of red X's (consistent with math-without-fear).
- **Stop-on-struggle:** ≥2 misses in a row → immediately branch down (never let them fail repeatedly).
- Cap total failures experienced per session (`band_probe_config.max_failures`).
- Items are existing interactive sims/story rounds tagged to a skill — it plays like Milo, not an exam.
- Length: ~8–12 items, 5–8 min. The *report* is rich; the child's *experience* is light.

## Inputs
- `learner` (id, band from age/grade).
- `SKILL_NODES`, `PROBE_ENTRY`, `prereqsOf`, `dependentsOf`, `blockedBy`, `chapterFor` from `skillGraph.ts`.
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
- **`probeSkill`** = run 1–2 items at L2 for that skill via `useAdaptive`; "pass" = correct without
  reteach. Keep it light; this is triage, not psychometric scoring — **do not report a precise grade level.**
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
ordered list of skills → their `chapter` ids (dedup, topological order). That's the plan: existing
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
