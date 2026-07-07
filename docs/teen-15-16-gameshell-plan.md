# Plan — Frame the 15–16 band as GameShell "games" (like 12–14)

> Status: **PLAN ONLY** (2026-07-07). No code written yet. Object/illustration
> generation (the Nano-Banana explainer art) is deliberately **deferred** to the
> build phase. This doc is the blueprint the next session executes from.

## 1. Goal & scope

Re-frame all **twelve 15–16 chapters** (Algebra I + Geometry) into the same shape
we shipped for 12–14: one continuous real-world game scene on the shared
**GameShell**, with the chalkboard-question layout, a plain-language **overview
read-along**, a **baby-step "I-do" walkthrough**, a **"we-do" guided round**,
**"your-turn" cues**, **tier-linked scaffolding**, an animated **TutorialScene**,
and the **MasteryState** finish — all driven data-only from a `GameConfig`.

**Founder direction (locked 2026-07-07):** make it **exactly** the 12–14
experience — the same way questions are asked (chalkboard question + manipulate the
instrument in the scene), the same explanation flow (overview read-along →
baby-step walkthrough → animated TutorialScene), and the same visuals (soft
illustrated backdrop + themed objects over a precise code-drawn math skeleton).
Nothing new in *how it feels* — only the math and the real-world theme change.

**Also keep the Explore sim** as an **optional pre-game beat** (see §5.1). 12–14
has no sim, but the founder wants 15–16 to keep its play-with-it-first sim in front
of the exact-12–14 game — skippable, not blocking.

### Flow (per chapter)
`start card → (optional Explore sim — "Play with it →" / "Skip to the game") →
overview read-along → baby-step "I-do" walkthrough (+ TutorialScene) → "we-do"
guided round → scored practice (your-turn cues, reveal+glide on wrong,
reteach after 3) → MasteryState`. Everything after the Explore beat is byte-for-byte
the 12–14 GameShell — no behavioral changes.

**In scope now (plan):** per-chapter real-world theme + motif, which instrument
each chapter uses, the answer strategy per difficulty tier, the walkthrough /
overview / guided outline, the TutorialScene concept (code-drawn skeleton only),
and the exact wiring changes.

**Deferred to the build/generation phase (next session):** writing the config
code, and generating the illustrated TutorialScene backdrops/object sprites
(Nano Banana). The plan marks every place art will be needed.

## 2. The one real design decision (and the recommendation)

The 12–14 games are **manipulation-first, no MCQ** — every answer is a number you
dial/drag (`grade(task,value)` compares numbers). But **every 15–16 chapter today
answers via MCQ (`ChoiceGrid`)**, and a lot of its math *cannot* be a slider:
factored forms `(x+2)(x+3)`, radical/irrational roots `(−3±√5)/2`, function
classification, exponent laws, proof steps. The curriculum's own answer-format
policy (`docs/curriculum-12-18.md` §"Answer-format policy") says these **must** be
MCQ or structured entry — never free-typed — because a parser could wrong-mark a
correct answer.

GameShell already supports this cleanly: its `Instrument<V,T>` is generic and the
answer is whatever `V` the instrument commits, graded by `config.grade`. So an
instrument can be a **themed picker** whose `V` is the chosen option.

**Recommendation:** keep the exact 12–14 feel by **manipulating a control in the
scene**, never a quiz screen. Default to real manipulation wherever the answer is a
number or a point (dials, meters, balance beam, coordinate grid — same instruments,
same "set it, then LOCK IN ✓" gesture as 12–14). Only where the math is genuinely
symbolic (factored forms, radical roots, classifications, proof steps) the control
becomes a themed **SpecPicker** (pick the right "spec card / blueprint / part",
then LOCK IN ✓) or **StepPicker** ("pick the next correct move") — still a physical
object in the scene with the same commit gesture, chalkboard question, reveal, and
glide, so the *asking pattern is identical* to 12–14; only the control's face
differs. This is as close to "same as 12–14" as the HS math allows.

## 3. Engine work — build ONCE, reuse across the band

These are the only new shared pieces. Everything else in GameShell
(`overview`, `tutorial`, `guided`, cues, tiers, warm-up, mastery, chalkboard) is
band-agnostic and reused verbatim. Build them in
`src/features/chapters/teen/games/parts/` (gameKit).

| New instrument | What it is | `V` type | Grades | Used by |
|---|---|---|---|---|
| **SpecPicker** | Themed single-choice selector — renders 3–4 options as physical "spec cards / blueprints / parts" laid in the scene; tap one, then **LOCK IN ✓**. The game-scene replacement for `ChoiceGrid`. | `string` (option id) | `v === answerId` | symbolic answers: #1(L3), #2, #5, #7, #8(L2–3), #9, #10, #11(rule) |
| **StepPicker** | Themed `stepSelect` — "pick the next correct move" from a stack of move-cards (common-error distractors). Reused for proofs. | `string` (step id) | `v === correctStep` | #3(multi-step), #6(subst/elim), #12(proofs) |
| **CoordScene** | GameShell-native coordinate grid generalizing `PlotGrid`+`LineSetter`: (a) tap-plot a point / intersection, (b) app-renders lines & parabolas **read-only** for reading features. Tap-only, no free curve-drawing (matches the `coordGrid` primitive spec). | `XY` or `Line` or option | numeric/coord compare or MCQ | #4, #5, #6, #10, #11 |

**Reused as-is from gameKit:** `SlideValue` (evaluate/measure numeric), `VThermo`
or `ElevatorShaft` (signed meter), `BalanceBeam` (solve-for-x), `CrankGear`
(powers). Plus all presentation kit (`QuestionBoard`, `Blackboard`, `Says`,
`HandCue`, `CommitBtn`, `glideNumber`), the `GameConfig`/`TutorialScript`/
`DemoStep` types, and `MasteryState`.

**Math-without-fear answer policy (enforced by instrument choice):**
- clean number → `SlideValue`/dial/`BalanceBeam`, `grade` with a tolerance band.
- coordinate/point → `CoordScene` tap, exact integer compare.
- symbolic / irrational / radical / classification / rule / proof step →
  `SpecPicker`/`StepPicker` (choose, never type).

## 4. Band theme & palette

**Theme:** "Design Studio / City-Builder" — the learner is a junior
engineer/architect; Milo is a low-key lab partner. Calm dark-mode studio,
blueprint/graph motifs, real-world framings (ramps, budgets, trajectories,
structures, surveys). Reuse the existing `data-band="15-16"` token block for
theming; give each chapter its own accent inside one cool "blueprint" palette
family (blueprint blue + graph-grid, warm accent for the active/correct state),
mirroring how each 12–14 game has its own `Palette`.

## 5. Per-chapter plan

Each row: chapterId · real-world theme · motif · instrument(s) by tier · answer
strategy. The **overview** (one-line problem + read-along), **baby-step
walkthrough**, **guided round**, and **TutorialScene** follow the 12–14 template;
the concept for each is sketched below the table. Full scripts are written in the
build phase.

Framings are pitched at what a 15–16-year-old actually cares about — money, phones,
social media, gaming, sports — while keeping each chapter's **exact math** (only the
wrapper theme changes). See §5.2 for why each scenario fits the math.

| # | chapterId | Theme (teen-relatable) | Motif | Instrument(s) |
|---|---|---|---|---|
| 1 | signedNumberFluency | **Game Leaderboard** (score up for wins, down for losses; combo × multipliers, penalty debuffs) | 🎮 | signed meter (VThermo/ElevatorShaft) L1–2; SpecPicker L3 (exact vs never-ending decimal = rational/irrational) |
| 2 | expressionsVariables | **Ticket Checkout** (booking fee + price × number of tickets) | 🎟️ | SlideValue (evaluate at a value); SpecPicker (match phrase↔expr, combine like terms, distribute) |
| 3 | linearEquationsInequalities | **Saving-Up Goal** (save $/week until you can afford the thing you want) | 🎯 | BalanceBeam (solve-for-x, L1); StepPicker (multi-step L2); SpecPicker + read-only number-line reveal (inequalities / \|x\|, L3) |
| 4 | slopeLinearGraphs | **Follower Growth** (starting count + followers gained per week) | 📈 | LineSetter (set m & b); CoordScene (read slope/intercept, slope from two points); SpecPicker (standard form) |
| 5 | functionsFamilies | **Going Viral** (steady posting vs a video that doubles each day — which wins, when?) | 🚀 | SpecPicker (is-a-function? classify linear/exponential); SlideValue (evaluate f(x)); CoordScene (domain/range/intercepts) |
| 6 | systemsOfEquations | **Best Phone Plan** (two plans that cross at some amount of usage) | 📱 | CoordScene (tap the intersection, L1); StepPicker (substitution / elimination, L2–3); SpecPicker (classify one/none/infinite) |
| 7 | exponentsPolynomials | **Power-Ups** (game upgrades multiply your stat each level; huge/tiny numbers → sci-notation) | ⚡ | CrankGear (build a power, L1 numeric); SpecPicker (exponent laws, zero/neg exp, sci-notation, add/mult polynomials — area model shown) |
| 8 | radicalsPythagorean | **Screen & Map Distance** (a phone/TV diagonal; straight-line distance across a game map) | 📐 | SlideValue (missing side, integer/decimal); SpecPicker (simplify radicals, add like radicals, irrational diagonal in √-form) |
| 9 | factoringPolynomials | **Build Plot** (a sandbox/block-building game plot: area → its length × width) | 🟩 | SpecPicker (GCF, trinomial, difference of squares, ax²+bx+c) with an animated area-model rectangle; SpecPicker for zero-product roots |
| 10 | quadraticsParabolas | **The Shot** (a basketball shot / game-projectile arc — vertex = peak, roots = launch & landing) | 🏀 | CoordScene (read roots/vertex/axis off the parabola); SpecPicker (solve by factoring / square-roots / quadratic formula → radical-form roots) |
| 11 | geometryTransformations | **Map Maker** (a game level editor: zone sizes + moving/flipping/rotating objects on the grid) | 🗺️ | SlideValue (circumference/area/SA/volume, tolerance); CoordScene (plot the transformed image, midpoint); SpecPicker (name the rule) |
| 12 | geometryProofTrig | **Skate Ramp & Heights** (a ramp's steepness; how tall a building is from your phone-tilt angle) | 🛹 | SlideValue/dial (angle°, side, ratio — with FigureDiagram context); StepPicker (congruence proof steps L2); SpecPicker (inverse-trig angle, rounded) |

> Copyright note: use the **generic** "sandbox / block-building game" framing for #9
> — do **not** name any specific game (e.g. Minecraft) in copy, assets, or code.

### 5.1 Optional Explore sim (kept, per founder)

Each chapter already has an interactive sim (`teen/sims/*Explorer.tsx` —
`LineExplorer`, `ParabolaExplorer`, `BalanceExplorer`, `SystemExplorer`,
`PythagorasExplorer`, `TransformExplorer`, `GrowthExplorer`, etc.). Keep it as an
**optional pre-game beat**: the wrapper shows the sim first with **"Play with it →"**
and a **"Skip to the game →"** control, then mounts `<Game>`. Reuses the existing
sims as-is, needs **no** GameShell change (GameShell starts at its own `start` card
either way). The sim is a warm-up to poke at the idea; the graded 12–14-style game
follows.

### Per-chapter detail (build-phase outline)

For **every** chapter, replicate the 12–14 structure:
- **`overview`**: one-line `problem` (the real-world goal), a `say` read-along that
  states what we're solving + which calculation, and 2–3 `points` bullets.
- **`tutorial`** (I-do): ~8–12 baby steps, each a `DemoStep` with `say` (slow),
  a `board` line that accumulates on the chalkboard, an instrument `value` (or a
  SpecPicker highlight), a `hand` cue, and an `art` placeholder (deferred asset).
  Use a **`tutorial` array** for chapters that teach several operations (e.g. #7
  exponent-laws then polynomials; #8 simplify then Pythagoras; #12 angles then
  trig) — GameShell flattens the array into one timeline.
- **`guided`** (we-do): one coached, non-scored task at the easy tier.
- **`TutorialScene`**: a **code-drawn animated skeleton** (the precise math:
  meters, number lines, coord axes, parabola, area rectangle, right-triangle,
  balance beam) that glides on the narration timeline. The **illustrated
  backdrop + themed objects are the deferred assets** — wire them in later exactly
  like `BankAccountScene`/`SkyTowerScene` (soft backdrop + object sprites over the
  code skeleton).
- **`makeTask(d)`**: reuse the existing math from each chapter's current
  `*TeenLesson.tsx` `makeRound(d)` (the L1/L2/L3 pools already exist and are
  correct) — repackage its output into a `BaseTask` (`badge`, `prompt`, `say`,
  `work[]`, `tone`) + the instrument's `answer`. This preserves the vetted
  curriculum and the difficulty ramp; only the *presentation* changes.
- **your-turn cues, tiers, warm-up, mastery**: free from GameShell — no per-chapter
  work.

Notes on the trickier chapters (from the answer-type audit):
- **#3, #6, #12** lean on **StepPicker** for multi-step/proof work — distractors
  must be *common-error* steps (pedagogically meaningful), per the `stepSelect`
  spec.
- **#10 (L3 quadratic formula)** and **#8 (irrational diagonal)** are the
  canonical "must be a picker" cases — never numeric entry; SpecPicker with the
  radical-form options.
- **#4 standard form** and **#11 transformation-rule** are visual/multi-field →
  SpecPicker (choose the correct form/rule) rather than typing.

### 5.2 Why each scenario fits the math

1. **Game Leaderboard** — points rise/fall and combos multiply / debuffs subtract: signed +/− and the ×/÷ sign rules, in a leaderboard they already read.
2. **Ticket Checkout** — booking fee + price × tickets; the number of tickets is the variable `x`, so working out the total *is* evaluating the expression.
3. **Saving-Up Goal** — "$40 now, save $15/week, when can I buy the $130 thing?" → solve `40 + 15w = 130`; "at *least* enough" is the inequality.
4. **Follower Growth** — followers over weeks: slope = gain-per-week, intercept = starting count; read/write `y = mx + b` off a growth chart.
5. **Going Viral** — steady +100/day (line) vs doubling/day (curve): linear vs exponential, and you feel the curve blow past the line.
6. **Best Phone Plan** — "Plan A $10 + $1/GB vs Plan B $20 flat — which is cheaper?" Two lines; the crossing point is the switch-over = solving a system.
7. **Power-Ups** — each upgrade multiplies your stat: repeated multiplication = exponent laws; huge view counts / tiny file sizes = scientific notation.
8. **Screen & Map Distance** — a "6.1-inch phone" is the *diagonal* → Pythagoras from width & height; same move gives straight-line distance across a game map (often irrational √).
9. **Build Plot** — a sandbox-game plot of area `x² + 5x + 6` has sides `(x+2)(x+3)`: factoring recovers the dimensions, shown as a rearranging area rectangle.
10. **The Shot** — a basketball / thrown-object arc is a parabola: vertex = top of the arc, roots = launch & landing; reading vertex/roots and solving quadratics = analyzing the shot.
11. **Map Maker** — a level editor: size round zones (area/circumference), loot-crate volume, and translate/reflect/rotate objects on the grid. (Circle area also powers the classic "is the large pizza the better deal?")
12. **Skate Ramp & Heights** — measure a ramp's two sides → its angle via SOH-CAH-TOA; tilt your phone to a building's top → angle of elevation gives its height.

## 6. Wiring changes (per chapter)

Registration is already done — **no changes** to `src/app/game/page.tsx`
dispatch, `src/core/chapters.ts` (rows 109–120), or the `/teen-preview?c=` map
(they already point at the 12 chapters). Migration = swap each chapter's
*internals*:

1. **New game file** `src/features/chapters/teen/games/<Theme>.tsx` — the pure
   `GameConfig` + its `TutorialScene` (like `WeatherStation.tsx`). Keep `chapterId`
   unchanged (e.g. `'slopeLinearGraphs'`).
2. **Rewrite the wrapper** `src/features/chapters/game/<Name>Chapter.tsx` to the
   IntegersChapter shape: portal with `data-band="15-16"`, an **optional Explore
   beat** (`ExploreStep` sim with "Play with it →" / "Skip to the game →"), then
   render `<Game config=… />`, `finishAndSync(chapterId, …)`, then `MasteryState
   band="15-16"`. (Today these wrappers render `CaseCard → ExploreStep → TeenLesson
   → practice`; the `CaseCard → TeenLesson → practice` part is replaced by `<Game>`;
   `ExploreStep` is retained as the pre-game beat.)
3. **Reuse** each chapter's existing `*TeenLesson.tsx` `makeRound` as the math
   source for `makeTask` (import it; don't rewrite the math).
4. **Retained:** the per-chapter `ExploreStep` sim (`teen/sims/*Explorer.tsx`) — now
   the optional pre-game beat (step 2). **Newly-unused after migration:** the
   `CaseCard` intro and the `TeenLessonShell` lesson *rendering* (the `makeRound`
   math is still used). Leave them in place during the migration; prune in a later
   cleanup pass once all 12 are verified.

## 7a. Build progress

> **ALL 12 CHAPTERS BUILT (2026-07-07).** Every 15–16 chapter is now on GameShell
> with a **themed, non-MCQ** interaction (build/produce/manipulate; SpecPicker/
> StepPicker only for the categorical classification/proof sub-types, reframed as
> sort/assemble). Full-project `tsc` clean · `npm test` 26/26 · `next build` green.
> 5 spot-verified live (Ticket, BuildPlot, FollowerGrowth, SkateRamp, Leaderboard) —
> correct themed instrument in guided/play, zero console errors; the other 7 mirror
> the same verified pattern + are tsc/build-clean. **Uncommitted** (bump `public/sw.js`
> before committing/deploying).
>
> | chapter | game file | themed interaction |
> |---|---|---|
> | signedNumberFluency | Leaderboard | signed score meter (ElevatorShaft) + rational/irrational bin-sort |
> | expressionsVariables | TicketCheckout | ring-up dial (SlideValue) + price-formula builder (PartsBuilder) |
> | linearEquationsInequalities | SavingGoal | balance beam + week-dial |
> | slopeLinearGraphs | FollowerGrowth | line builder (LineSetter) + slope dial |
> | functionsFamilies | GoingViral | value dial + steady/viral sorter |
> | systemsOfEquations | BestPlan | build the crossing point (PartsBuilder pair) + solution-count sort |
> | exponentsPolynomials | PowerUps | crank a power (CrankGear) + result dial |
> | radicalsPythagorean | ScreenDistance | side dial + radical builder (`a√b`) |
> | factoringPolynomials | BuildPlot | build the two plot sides (PartsBuilder) |
> | quadraticsParabolas | TheShot | roots/vertex builder + radical picker (irrational L3) |
> | geometryTransformations | MapMaker | measurement dial (tolerance) + coordinate builder |
> | geometryProofTrig | SkateRamp | angle/side dial + proof assembler (StepPicker) |
>
> **ANIMATION PASS (2026-07-07, founder feedback "visuals lag — when Milo talks, the
> scene should show what he's saying").** Rewrote all 10 TutorialScenes to ACT OUT the
> worked example step-by-step against the `SkyTowerScene` bar: object glides on `value`,
> distinct overlays keyed to `stepIndex`, moving cues, and walkthrough `value`s tuned so
> the scene builds up rather than snapping. Examples: The Shot — the 🏀 launches, rises to
> the peak (vertex marks), lands at a root; Follower Growth — intercept drops in then a
> rise/run staircase steps the line out; Power-Ups — the bar leaps ×base per level;
> Screen Distance — legs draw, a²/b² tiles fill, diagonal sweeps; Saving Goal — the fee
> peels off, the bar climbs week-by-week. `tsc` + `npm test` 26/26 + `next build` green;
> 2 spot-verified live (The Shot ball-arc + Follower Growth staircase) — scenes visibly
> animate through the beats, zero console errors.
>
> New shared instruments in gameKit: **SpecPicker, StepPicker, PartsBuilder**.
> Deferred (per founder): illustrated TutorialScene assets (scenes are code-drawn now);
> CoordScene (not needed — coordinate answers use PartsBuilder pairs); cleanup of the
> now-unused CaseCard/lesson-render paths.


- **DONE (2026-07-07):** shared **SpecPicker** + **StepPicker** instruments in
  `gameKit.tsx` (game-scene MCQ for symbolic answers; `V` = chosen option id, `''` =
  unpicked). Pilot chapter **#2 expressionsVariables → "Ticket Checkout"** fully on
  GameShell + verified live end-to-end (optional Explore beat → start → overview on
  the chalkboard + code-drawn ticket scene → auto-walkthrough → guided → scored
  SpecPicker play; correct advances, wrong reveals+highlights). Files: new
  `teen/games/TicketCheckout.tsx`; rewrote `game/ExpressionsVariablesChapter.tsx`.
  `tsc` + `npm test` 26/26 + `next build` green; zero console errors. **The pattern
  proven here — GameShell + SpecPicker over the chapter's existing `makeRound` —
  is the template for every SpecPicker-dominant chapter (#1, #5, #7, #9, and the
  symbolic tiers of the rest).**
- **DONE (2026-07-07, prod-input pass):** **PartsBuilder** instrument in `gameKit.tsx`
  — a "build-the-answer" input (two steppers assemble a live template, e.g.
  `(x + ▢)(x + ▢)`; `V = {a,b}`, order-independent grade). Chapter **#9
  factoringPolynomials → "Build Plot"** built on it + verified live end-to-end
  (build the two plot sides → grade → advance). Files: new `teen/games/BuildPlot.tsx`;
  rewrote `game/FactoringPolynomialsChapter.tsx`. Production, not MCQ — the student
  constructs the factors. Founder-requested "build-the-answer for the chapters where
  production matters most."
- **TODO (build-the-answer, remaining):** #10 quadratics roots (PartsBuilder, template
  `x = ▢, ▢`; irrational L3 stays SpecPicker); #4 slope→equation (reuse existing
  **LineSetter** — set m & b); #1 signed numbers (production numeric input — signed
  meter VThermo/ElevatorShaft — keep review-level math unless pushed harder).
- **DIRECTION CHANGE (founder, 2026-07-07): NO MCQ.** Each chapter gets its own
  *produce/manipulate* interaction (in practice AND explanation), not a 4-option
  pick. SpecPicker/StepPicker are reserved only for genuinely categorical cases and
  even then reframed as **sort-into-bins / assemble-in-order**, not a quiz. Per-chapter
  interaction map:
  1 signed meter + rational/irrational bin-sorter · 2 number dial + expression builder
  (`▢x + ▢`) · 3 balance beam + number-line drag · 4 line builder (slope+intercept) ·
  5 point plotter + growth-factor dial · 6 tap-the-intersection · 7 crank + exponent
  steppers · 8 side-length dial + radical builder (`▢√▢`) · 9 PartsBuilder ✓ · 10 roots
  builder (`x = ▢, ▢`) + vertex plotter · 11 measurement dial + drag-the-image ·
  12 angle/side dial + proof assembler.
  - **DONE:** pilot **#2 expressionsVariables** converted OFF MCQ → **number dial
    (SlideValue) for evaluate + expression builder (PartsBuilder `▢x + ▢`) for
    simplify** (two non-MCQ interactions in one chapter). Verified live. **#9 factoring**
    already non-MCQ. New instruments still needed for the rest: bin-sorter, number-line
    drag, point plotter, growth-factor dial, radical builder, vertex plotter, proof
    assembler, CoordScene (tap-intersection / graph reads).
- **TODO (rest):** the other chapters + those instruments + per-chapter code-drawn
  TutorialScenes.

## 7. Build sequence (next session)

1. **Build the 3 new instruments** (SpecPicker, StepPicker, CoordScene) in gameKit,
   with a tiny preview harness. This unblocks every chapter.
2. **Pilot ONE chapter end-to-end** as the gold standard — recommend
   **#4 slopeLinearGraphs** (exercises LineSetter + CoordScene + SpecPicker, the
   widest instrument mix) or **#3 Break-Even Bench** (BalanceBeam + StepPicker,
   closest to the 12–14 feel). Verify live at `/teen-preview?c=…`.
3. **Fan out the remaining 11** — one focused pass per chapter (parallelizable),
   each mirroring the pilot, each `tsc`-clean and self-verified live.
4. **Generation phase (assets):** per-chapter illustrated TutorialScene backdrop +
   object sprites (Nano Banana), wired over the code skeletons — same recipe as the
   12–14 illustrated-explainer batch. This is the part explicitly deferred.
5. **Cleanup pass:** remove the now-dead `CaseCard` intro + `TeenLessonShell`
   lesson-rendering once all 12 are on GameShell. **Keep** the `*Explorer.tsx` sims
   (retained as the optional pre-game beat).

## 8. Verification (per chapter)

`tsc` clean → `/teen-preview?c=<chapterId>` drives: start → overview read-along →
baby-step walkthrough (board fills, scene animates) → "I've got it" skip →
guided → scored practice (correct→cue, wrong→reveal+glide, 3-wrong→reteach) →
mastery. Zero console errors. Responsive at 1440×900 + 375×812. Then `npm test` +
`next build` before commit; bump `public/sw.js` VERSION per deploy.

## 9. Decisions & remaining questions

**Resolved (founder, 2026-07-07):**
- **Exact 12–14 experience** — same question-asking, explanation flow, and visuals.
  Manipulate-in-the-scene is the default; SpecPicker/StepPicker only where the math
  is symbolic, and even then it keeps the same commit/chalkboard/reveal/glide pattern.
- **Keep the Explore sim** as an optional, skippable pre-game beat.

- **Teen-relatable framings LOCKED** (founder, 2026-07-07) — the §5 table
  (Game Leaderboard, Ticket Checkout, Saving-Up Goal, Follower Growth, Going Viral,
  Best Phone Plan, Power-Ups, Screen & Map Distance, Build Plot, The Shot, Map Maker,
  Skate Ramp & Heights). **No brand names** — #9 uses the generic
  "sandbox / block-building game" (do not name Minecraft or any specific title).
