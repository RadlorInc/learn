# Skill Graph — Teacher Validation Checklist

**Goal:** red-pen the prerequisite claims before the diagnostic ships on any band. You do NOT
need all 74 nodes validated to start — validate the **7 spines + 5 load-bearing nodes** first,
because those carry the diagnostic. A wrong edge → wrong root gap → broken parent trust.

Source of truth: `src/lib/skillGraph.ts`. For each item below, mark:
**✅ correct · ✏️ fix (write the correction) · ❓ unsure (needs a second opinion)**.

## How to read an edge
`X ← [A, B]` means "to succeed at X, a child must already have A and B." Two questions per node:
1. **Are these truly the prerequisites** — is anything listed that *isn't* actually required?
2. **Is anything MISSING** — a skill you'd expect a stuck child to be missing that isn't listed?

## Priority 1 — the 5 load-bearing nodes (validate first)
These are where diagnoses most often bottom out; getting them right matters most.

- [ ] `i.multFacts` (Multiplication facts) ← `p.skipCount`, `p.multConcept`
- [ ] `i.fractionEquiv` (Equivalent fractions) ← `p.fractionsIntro`, `i.multFacts`
      → **High-risk claim:** does equivalent fractions truly require *fact fluency*, or only skip-counting?
- [ ] `i.fractionOps` (Add/subtract fractions) ← `i.fractionEquiv`
- [ ] `m.signedOps` (Signed operations) ← `m.integers`
- [ ] `p.placeValue2` (Tens & ones) ← `p.numbersTo100`

## Priority 2 — the 7 spines (validate the chain, end to end)
For each spine, confirm every hop is a real prerequisite and nothing critical is skipped.

1. **Multiplicative:** `p.skipCount → i.multFacts → i.division / i.factors → i.fractionEquiv → m.ratioProportion → m.percentages`; and `i.multFacts → a.factoring → a.quadratics`.
   - [ ] Is `a.factoring ← i.multFacts` right — does trinomial factoring really trace to fact fluency?
2. **Fraction:** `p.fractionsIntro → i.fractionEquiv → i.fractionOps → m.rationalOps → c.rationalFns`.
   - [ ] Does `c.rationalFns ← i.fractionOps` hold (rational expressions ← fraction ops)?
3. **Signed-number:** `p.compare100 → m.integers → m.signedOps → a.signedFluency → (algebra)`.
4. **Algebra/function:** `m.algExpressions → m.equationsIneq → a.linearEqIneq → a.slopeGraphs → a.functions → c.functionToolkit → c.introCalculus`.
5. **Geometry/measure:** `e.shapes2d → p.shapes2d3d → i.areaPerimeter → m.geomMeasure → a.radicals → a.proofTrig → c.unitCircleTrig`.
6. **Place-value/decimal:** `e.counting10 → p.numbersTo100 → p.placeValue2 → i.bigNumbers → i.decimals → m.exponentsRoots`.
7. **Data/stats:** `i.dataGraphs → c.statsInference` (+ `m.percentages`, `m.ratioProportion`).

## Priority 3 — probe entry points (are we starting at grade level?)
For each band, are these the right "grade-expected" skills to start probing from?
- [ ] 6–8: `p.addTo100`, `p.multConcept`, `p.fractionsIntro`
- [ ] 9–11: `i.multFacts`, `i.fractionEquiv`, `i.division`, `i.decimals`, `i.areaPerimeter`, `i.dataGraphs`
- [ ] 12–14: `m.equationsIneq`, `m.ratioProportion`, `m.signedOps`, `m.rationalOps`
- [ ] 15–16: `a.linearEqIneq`, `a.factoring`, `a.functions`
- [ ] 17–18: `c.functionToolkit`, `c.quadraticAnalysis`, `c.rationalFns`

## Known softest claims (flagged by the author — please scrutinize)
- `i.fractionEquiv ← i.multFacts` (fact fluency as a fraction prereq).
- `a.factoring ← i.multFacts` (cross-band, deep).
- `c.rationalFns ← i.fractionOps` (cross-band, deep).
- `p.fractionsIntro ← p.multConcept` (do unit fractions need equal-groups multiplication first?).
- 3–5 edges are "readiness ordering," not strict prerequisites — treat loosely.

## Sign-off
Validate Priority 1 + 2 before enabling the diagnostic on the **9–11 core band** (the first band we
prove the guarantee on). Then validate each remaining band's within-band edges before enabling it.
