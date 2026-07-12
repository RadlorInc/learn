# Milo Skill Graph — Phase 0 (ages 3–18)

**Status: DRAFT for teacher validation.** This is the foundation the diagnostic, plan
generator, and re-check engine all depend on. It is one graph spanning 3→18 (not six
graphs) so a diagnosis can walk *down* across band boundaries to a root gap.

> ⚠️ Prerequisite edges are a pedagogical claim. A wrong edge = a wrong root gap =
> broken parent trust. Every edge here must be validated by a teacher per band before we
> ship the guarantee on that band. Treat this as v0.9.

## Conventions

- **Node** = a diagnosable skill. Granularity ≈ one chapter, **split** only where a chapter
  bundles skills at clearly different prerequisite depths (e.g. multiplication *facts* vs
  *multi-digit*). Remediation unit = the mapped chapter, so the plan generator is trivial.
- **id prefix by band:** `e` 3–5 · `p` 6–8 · `i` 9–11 · `m` 12–14 · `a` 15–16 · `c` 17–18.
- Each node lists `← [direct prerequisites]`. To find a root gap, the probe walks *down*
  these edges until the child passes a prerequisite. Cross-band prereqs are marked `⇑`.
- `chapter:` maps the node to an existing chapter id (from `src/lib/chapters.ts`).

## Supabase shape (Phase 1 target)

```
skills(id, band, label, chapter_id)
skill_prereqs(skill_id, prereq_id, cross_band bool)
band_probe_config(band, entry_skill_ids[], max_items, max_failures)
```

---

## The 7 cross-band spines (the strategic core)

These are the load-bearing chains that let the diagnostic connect a struggling teen to a
root gap grades below. **A single-band competitor can't traverse these; we can, and we own
the content at every node.** Ranked by how often they are the true root of later failure.

1. **Multiplicative spine (highest value):**
   `p.skipCount → i.multFacts → {i.multMultiDigit, i.division, i.factors} → i.fractionEquiv →
   m.ratioProportion → m.percentages` **and** `i.multFacts → a.factoring → a.quadratics`.
   `i.multFacts` is the single most load-bearing node in the graph — teen algebra failure
   very often roots here.
2. **Fraction spine:** `p.fractionsIntro → i.fractionEquiv → i.fractionOps → m.rationalOps →
   c.rationalFns`. Rational-expression failure in Pre-Calc usually roots in fraction ops.
3. **Signed-number spine:** `p.compare100 → m.integers → m.signedOps → a.signedFluency →`
   (all of algebra). "Every equation feels random" often roots here.
4. **Algebra/function spine:** `m.algExpressions → m.equationsIneq → a.linearEqIneq →
   a.slopeGraphs → a.functions → c.functionToolkit → c.introCalculus`.
5. **Geometry/measure spine:** `e.shapes2d → p.shapes2d3d → i.areaPerimeter → m.geomMeasure →
   a.radicals → a.proofTrig → c.unitCircleTrig`.
6. **Place-value/decimal spine:** `e.counting10 → p.numbersTo100 → p.placeValue2 →
   i.bigNumbers → i.decimals → m.exponentsRoots`.
7. **Data/stats spine:** `i.dataGraphs → c.statsInference` (+ `m.percentages`, `m.ratioProportion`).

**Most load-bearing nodes (build/validate remediation here first):**
`i.multFacts`, `i.fractionEquiv`, `i.fractionOps`, `m.signedOps`, `p.placeValue2`.

---

## Band 3–5 · Early number sense (readiness, not remediation)

| id | label | chapter | prereqs |
|---|---|---|---|
| e.counting10 | Count to 10 (one-to-one) | counting | — |
| e.numeralRecog | Recognize & name numerals | numberRecognition | — |
| e.matchQty | Match numeral ↔ quantity | matchingQuantities | e.counting10, e.numeralRecog |
| e.numberOrder | Order numbers | numberOrdering | e.counting10 |
| e.compare | More / less / equal | numberComparison | e.matchQty |
| e.addWithin10 | Join groups (add ≤10) | addition | e.counting10, e.matchQty |
| e.subWithin10 | Take away (sub ≤10) | subtraction | e.addWithin10 |
| e.shapes2d | Recognize 2D shapes | shapes | — |
| e.patterns | Repeating patterns | patterns | — |
| e.colors | Colors | colors | — (non-math) |
| e.measureCompare | Compare size/length/weight | measurement | e.compare |

## Band 6–8 · Primary

| id | label | chapter | prereqs |
|---|---|---|---|
| p.numbersTo100 | Read/write numbers to 100 | numbersTo100 | ⇑e.counting10 |
| p.placeValue2 | Tens & ones | placeValue | p.numbersTo100 |
| p.compare100 | Compare to 100 | compareNumbers | p.placeValue2 |
| p.skipCount | Skip count 2s/5s/10s | skipCounting | ⇑e.counting10 |
| p.addTo100 | Add within 100 (regroup) | additionTo100 | p.placeValue2, ⇑e.addWithin10 |
| p.subTo100 | Subtract within 100 (regroup) | subtractionTo100 | p.addTo100 |
| p.multConcept | Multiply as equal groups | multiplication | p.skipCount |
| p.fractionsIntro | Unit fractions / equal parts | fractions | p.numbersTo100 |
| p.wordProbAddSub | 1-step add/sub story problems | storyProblems | p.addTo100, p.subTo100 |
| p.money | Money & coins | money | p.skipCount, p.addTo100 |
| p.time | Telling time | time | p.skipCount |
| p.shapes2d3d | 2D/3D shapes & attributes | shapes2d3d | ⇑e.shapes2d |

## Band 9–11 · Intermediate (remediation core)

| id | label | chapter | prereqs |
|---|---|---|---|
| i.bigNumbers | Place value to 10,000+ | bigNumbers | ⇑p.placeValue2 |
| i.rounding | Rounding | rounding | i.bigNumbers |
| i.multFacts | Multiplication facts fluency | timesTables | ⇑p.skipCount, ⇑p.multConcept |
| i.multMultiDigit | Multi-digit multiplication | timesTables | i.multFacts, ⇑p.placeValue2 |
| i.division | Division w/ remainders | division | i.multFacts, ⇑p.subTo100 |
| i.factors | Factors, multiples, primes | factorsMultiples | i.multFacts, i.division |
| i.fractionEquiv | Equivalent fractions & compare | fractionsCompare | ⇑p.fractionsIntro, i.multFacts |
| i.fractionOps | Add/subtract fractions | fractionsCompare | i.fractionEquiv |
| i.decimals | Decimals (tenths/hundredths) | decimals | i.bigNumbers, i.fractionEquiv |
| i.measureUnits | Units & conversion | measurementUnits | i.multFacts, i.decimals |
| i.areaPerimeter | Area & perimeter | areaPerimeter | i.multFacts, ⇑p.shapes2d3d |
| i.anglesSymmetry | Angles & symmetry | anglesSymmetry | ⇑p.shapes2d3d |
| i.dataGraphs | Data & graphs | dataGraphs | i.bigNumbers, i.division |
| i.wordProbMulti | Multi-step word problems | wordProblems | i.division, i.multMultiDigit, i.fractionOps |

## Band 12–14 · Middle

| id | label | chapter | prereqs |
|---|---|---|---|
| m.integers | Integers & number line | integers | ⇑p.compare100, ⇑p.subTo100 |
| m.signedOps | Signed number operations | signedRationalOps | m.integers |
| m.rationalOps | Fraction/decimal ×÷ | rationalOps | ⇑i.fractionOps, ⇑i.decimals, ⇑i.multFacts |
| m.ratioProportion | Ratios & proportions | ratioProportion | ⇑i.fractionEquiv, ⇑i.division |
| m.percentages | Percentages | percentages | m.ratioProportion, ⇑i.decimals |
| m.exponentsRoots | Exponents, roots, sci notation | exponentsRoots | ⇑i.multFacts, ⇑i.factors, ⇑i.decimals |
| m.orderOps | Order of operations | orderOfOperations | m.signedOps, m.exponentsRoots |
| m.algExpressions | Algebraic expressions | algebraicExpressions | m.orderOps, m.signedOps |
| m.equationsIneq | Equations & inequalities (1-var) | equationsInequalities | m.algExpressions, m.signedOps |
| m.coordinatePlane | Coordinate plane | coordinatePlane | m.integers, ⇑e.numberOrder |
| m.linearRel | Linear relationships (tables/slope) | linearRelationships | m.coordinatePlane, m.ratioProportion, m.equationsIneq |
| m.geomMeasure | Area, volume & Pythagoras | geometryMeasurement | ⇑i.areaPerimeter, ⇑i.multMultiDigit, m.exponentsRoots |

## Band 15–16 · Algebra I / Geometry

| id | label | chapter | prereqs |
|---|---|---|---|
| a.signedFluency | Signed & real number fluency | signedNumberFluency | ⇑m.signedOps, ⇑m.rationalOps |
| a.expressions | Expressions & variables | expressionsVariables | ⇑m.algExpressions, ⇑m.orderOps |
| a.linearEqIneq | Linear equations & inequalities | linearEquationsInequalities | ⇑m.equationsIneq, a.expressions, a.signedFluency |
| a.slopeGraphs | Slope & linear graphs | slopeLinearGraphs | ⇑m.linearRel, ⇑m.coordinatePlane, a.linearEqIneq |
| a.functions | Functions (f(x), domain/range) | functionsFamilies | a.slopeGraphs, a.linearEqIneq |
| a.systems | Systems of equations | systemsOfEquations | a.linearEqIneq, a.slopeGraphs |
| a.expPolynomials | Exponents & polynomials | exponentsPolynomials | ⇑m.exponentsRoots, a.expressions |
| a.radicals | Radicals & Pythagoras | radicalsPythagorean | ⇑m.exponentsRoots, ⇑m.geomMeasure |
| a.factoring | Factoring | factoringPolynomials | a.expPolynomials, ⇑i.multFacts |
| a.quadratics | Quadratics & parabolas | quadraticsParabolas | a.factoring, a.expPolynomials, a.functions |
| a.geomTransform | Geometry & transformations | geometryTransformations | ⇑m.geomMeasure, ⇑m.coordinatePlane |
| a.proofTrig | Proof & right-triangle trig | geometryProofTrig | a.radicals, ⇑m.ratioProportion |

## Band 17–18 · Algebra II / Pre-Calc / Stats / Calc

| id | label | chapter | prereqs |
|---|---|---|---|
| c.functionToolkit | Function notation/domain/transform | functionToolkit | ⇑a.functions |
| c.quadraticAnalysis | Vertex/roots/discriminant | quadraticAnalysis | ⇑a.quadratics, c.functionToolkit |
| c.polynomialFns | Polynomial functions | polynomialFunctions | ⇑a.factoring, c.functionToolkit, c.quadraticAnalysis |
| c.complex | Complex numbers | complexNumbers | ⇑a.quadratics, ⇑a.radicals |
| c.rationalFns | Rational functions | rationalFunctions | c.polynomialFns, ⇑a.factoring, ⇑i.fractionOps |
| c.expLog | Exponential & log | expLogFunctions | ⇑a.expPolynomials, c.functionToolkit |
| c.unitCircleTrig | Unit circle & trig | unitCircleTrig | ⇑a.proofTrig, ⇑m.ratioProportion |
| c.trigGraphsId | Trig graphs & identities | trigGraphsIdentities | c.unitCircleTrig, c.functionToolkit |
| c.conics | Conic sections | conicSections | ⇑a.quadratics, ⇑a.geomTransform |
| c.systemsMatrices | Systems & matrices | systemsMatrices | ⇑a.systems |
| c.sequencesSeries | Sequences & series | sequencesSeries | ⇑a.functions, ⇑a.expPolynomials |
| c.statsInference | Statistics & inference | statsInference | ⇑i.dataGraphs, ⇑m.percentages, ⇑m.ratioProportion |
| c.introCalculus | Limits / derivative intro | introCalculus | c.functionToolkit, ⇑a.slopeGraphs, c.rationalFns |

---

## Diagnostic entry points (probe config, per band)

Start probing at grade-expected nodes; branch down on failure. Suggested entries:

| Band | entry nodes |
|---|---|
| 3–5 | e.matchQty, e.addWithin10 |
| 6–8 | p.addTo100, p.multConcept, p.fractionsIntro |
| 9–11 | i.multFacts, i.fractionEquiv, i.division, i.decimals, i.areaPerimeter, i.dataGraphs |
| 12–14 | m.equationsIneq, m.ratioProportion, m.signedOps, m.rationalOps |
| 15–16 | a.linearEqIneq, a.factoring, a.functions |
| 17–18 | c.functionToolkit, c.quadraticAnalysis, c.rationalFns |

## Worked example — the cross-band payoff

A 16-year-old (band 15–16) fails `a.quadratics`. Probe walks down:
`a.quadratics ← a.factoring` (fail) `← i.multFacts` (fail) `← p.skipCount` (pass).
**Root gap = `i.multFacts` (band 9–11).** Report to parent: *"Noah's quadratics struggle
roots in multiplication-fact fluency from grade 4 — we found the exact node and already have
the chapter (`timesTables`) that fixes it."* Plan = sequence `timesTables → factoring →
quadratics`. No single-band tool can do this; we can because the graph + content span 3–18.

## Deferred to later passes (not Phase 0)
- **Sub-skill decomposition** of high-traffic nodes (e.g. `i.multFacts` → ×2..×12 lanes) for
  finer root-gap precision. v2.
- **Teacher validation** of every edge, per band — required before the guarantee ships on
  that band.
- **Weight/centrality scores** per node (how many upstream skills it unlocks) to prioritize
  which remediation content to harden first.
- **Per-child generation** (v2) — generating bespoke items at the gap vs. sequencing chapters.
