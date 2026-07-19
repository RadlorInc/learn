# Math-Mentor Audit — 12–14 Band (12 chapters)

_Date: 2026-07-10. Method: one auditor per chapter, read-only, assessed on 7 dimensions
(math correctness · curriculum fit for US Grade 6–8 · concept coverage · teaching quality ·
question clarity · difficulty ramp · answer fidelity). Severity: 🔴 critical · 🟠 major · 🟡 minor._

## Headline

- **Math is correct across all 12 chapters.** Every live question generator produces well-formed
  problems with correct, reachable answers. No wrong answers found in any shipping chapter. (Two
  *latent* code risks only — see Tile Factory scene bug and Room Reno hypotenuse rounding — both
  dormant today.)
- **The real gaps are pedagogical, not arithmetic:** curriculum coverage, teaching-vs-practice
  mismatch, weak difficulty ramps, and question clarity.
- **The clarity spec (context/instruction) is adopted in only 1 of 12 chapters (Sky Tower).** The
  other 11 still cram story + math + action into one prose line — i.e. the partner's "confusing"
  complaint is **systemic**, and the pilot rollout is the fix.

## Grades

| # | Chapter (theme) | File | Grade | Top issue |
|---|---|---|---|---|
| 1 | integers (Bank Account) | WeatherStation.tsx | B− | L3 not harder than L2; clarity not adopted |
| 2 | signedRationalOps (Sky Tower) | SkyTower.tsx | B | integer-only (no rationals) despite the name; only subtraction gets a walkthrough |
| 3 | rationalOps (Cutting Bench) | KitchenCounter.tsx | B | no decimal ÷ decimal; fraction÷fraction only whole answers |
| 4 | ratioProportion (Paint Studio) | JuiceBar.tsx | B− | no unit rate; L2==L3 identical; demo scale-factor = 1 |
| 5 | percentages (Store Checkout) | StoreCheckout.tsx | B | nice-numbers only; no "find the percent"; 50% "tax" |
| 6 | exponentsRoots (Tile Factory) | GearLab.tsx | **C** | no scientific notation / cube roots / exponent rules |
| 7 | orderOfOperations (Event Budget) | ScoreMachine.tsx | B | exponents in 1 item; brackets/exponents never taught |
| 8 | algebraicExpressions (Taxi Meter) | FunctionFactory.tsx | B | evaluate-only; no "write expression from words" |
| 9 | equationsInequalities (Baggage Scale) | BalanceBench.tsx | **C** | zero inequalities; taught by guess-and-check |
| 10 | coordinatePlane (Delivery Drone) | NightFlight.tsx | B | only plotting, never reading a point |
| 11 | linearRelationships (Water Tank) | CableCar.tsx | B | negatives break the "filling tank" metaphor |
| 12 | geometryMeasurement (Room Reno) | BuildSite.tsx | **C** | teaches only rectangle area; volume/Pythagoras cold; fixed 1-question pools |

**Distribution:** 0 × A · 9 × B/B− · 3 × C. No chapter is broken; three under-deliver their named standard.

## Cross-cutting themes (fix these once, help every chapter)

### 1. Clarity spec not rolled out (11/12) — the partner's complaint, systemic
Only Sky Tower sets `task.context` / `task.instruction`. Every other chapter ships a single prose
`prompt` that fuses story + math + UI-verb and often duplicates the `badge`. Rolling the pilot
format to the other 11 is the direct fix.

### 2. Curriculum coverage gaps vs the chapter's own name / grade standard
- **exponentsRoots** — no scientific notation (8.EE.3/4), no cube roots (8.EE.2), no exponent
  properties (8.EE.1). It's a "perfect powers + perfect square roots" drill.
- **equationsInequalities** — **no inequalities at all**; the instrument can't express `x > 3`.
- **geometryMeasurement** — "Area, Volume & Pythagoras" but teaching covers only rectangle area.
- **signedRationalOps** — integer-only; no fraction/decimal signed ops.
- **rationalOps** — no decimal÷decimal; fraction÷fraction only ever gives whole answers.
- **ratioProportion** — no unit rate (the headline 6.RP skill).
- **algebraicExpressions** — evaluate-only; never write/translate an expression from words.
- **percentages** — never "what percent is X of Y"; percents skew to easy quarters/halves.
- **coordinatePlane** — only plotting; never read a shown point's coordinates.
- **orderOfOperations** — exponents in a single item; same-precedence left-to-right never exercised.

### 3. Teaching ≠ practice (walkthrough teaches a narrower case than the scored questions)
The most important pedagogy bug. A learner is shown one case, then tested on harder/other cases cold:
- **geometryMeasurement** — area taught; volume + Pythagoras appear cold (🔴).
- **equationsInequalities** — one-step taught; two-step (subtract *then* divide) tested cold.
- **signedRationalOps** — subtraction taught; ×, ÷, and chains appear cold at L2/L3.
- **orderOfOperations** — only "× before +" taught; brackets and exponents tested cold.
- **ratioProportion** — demo uses scale factor 1, so the "multiply each part" reasoning practice needs is never modeled.
- **integers** / **rationalOps** — guided round reinforces only one of the taught operations.

Fix pattern: GameShell already accepts an **array of `TutorialScript`s** — add a second (and third)
worked example so every case a chapter tests has been taught first.

### 4. Difficulty ramps that don't ramp
- **ratioProportion** — L2 and L3 pools are byte-identical.
- **integers** — L3 (opposite/distance) is arguably easier than L2.
- **rationalOps** — tiers only shuffle *which* operation, never make an item harder.
- **geometryMeasurement** — L2/L3 pools overlap; magnitudes don't rise.
- **algebraicExpressions** — L2/L3 pools overlap heavily.

### 5. Metaphor breaks on negatives (math right, story wrong)
- **equationsInequalities** — `5x = −15 → x = −3` is a −3 kg suitcase.
- **linearRelationships** — negative slope = a "filling" tank with a −2 L/min rate; negative
  intercept = a tank that starts at −2 litres.
Fix: reframe (draining tank / net balance) or move signed cases to a signed-number context.

### 6. Thin question pools + glyph polish
- Several chapters have 1–4 fixed items per tier, so an 8-question run repeats (percentages,
  orderOfOperations, geometry singles, algebra L1). Widen the pools.
- Mixed minus glyphs (ASCII `-` in badges vs U+2212 `−` in tutorials) in Sky Tower, Delivery
  Drone, and others — cosmetic but visible.

## Latent code risks (dormant, worth fixing)
- 🟡 **GearLab.tsx:142** — `exp` is reconstructed as `answer===base² ? 2 : answer===base³ ? 3 : 2`,
  so 2⁴/2⁵/2⁶/3⁴ mislabel as `exp=2`. Harmless only because the scene is fed just the 3² demo;
  a landmine if reused. Carry the real `exp` on the task.
- 🟡 **BuildSite.tsx:64-66** — `hypotenuse()` uses `Math.round(√…)` on an integer slider; safe only
  because inputs are Pythagorean triples. Any non-triple leg pair would teach a wrong hypotenuse.
  Keep to triples, or allow decimal answers + tolerance.

## Recommended priority order
1. **Fix the 3 C-grade chapters** — they under-deliver their named standard: add inequalities
   (equations), add a volume + Pythagoras walkthrough (geometry), add scientific notation + cube
   roots (exponents).
2. **Roll the clarity spec to the other 11 chapters** — directly answers the partner; mechanical
   per-chapter work (add `context`/`instruction`, trim `prompt`).
3. **Close teaching-vs-practice gaps** — add the missing walkthrough examples (theme #3).
4. **Fix the non-increasing difficulty ramps** (theme #4).
5. **Repair the negative-value metaphors** (theme #5) + pool/glyph polish (theme #6).
6. **Patch the two latent code risks.**
