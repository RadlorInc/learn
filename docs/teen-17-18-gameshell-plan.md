# Plan — Frame the 17–18 band as GameShell "games" (like 12–14 and 15–16)

> Status: **DESIGN** (2026-07-26). Worlds LOCKED (§5). No code written yet. This is the
> blueprint the build sessions execute from, in the same shape as
> [teen-15-16-gameshell-plan.md](teen-15-16-gameshell-plan.md) — which is the closer
> precedent, because that band was also a *migration* off the old Field Lab, not a
> greenfield build.

## 1. Where the band is today

All **13** of the 17–18 chapters are still on the **pre-GameShell "Field Lab"** shape
— the one 15–16 was migrated off on 2026-07-07. Every one of them is a bespoke
wrapper in `BESPOKE_CHAPTERS` ([registry.tsx](../src/features/chapters/registry.tsx)):

```
portal → CaseCard intro → ExploreStep + sim → TeenLessonShell lesson
       → adaptive MCQ practice (ChoiceGrid) → MasteryState
```

That is **~3,829 lines of wrapper + ~4,214 lines of lesson** re-implementing, thirteen
times, the loop `GameShell` already owns. Concretely, what the band does NOT have:

| 12–14 / 15–16 has | 17–18 has |
|---|---|
| `GameShell` — one shared adaptive loop | 13 hand-rolled copies of it |
| chalkboard `QuestionBoard`, 3-zone (`context` · badge · `instruction`) | a prose `promptText` in a bubble |
| overview read-along ("THE PLAN") | `CaseCard` (a static why/question card) |
| baby-step `tutorial` walkthrough + animated `TutorialScene` | `TeenLessonShell` narrated steps |
| answer by **manipulating the scene** (`Instrument`) or `AnswerPad` | `ChoiceGrid` MCQ, every question |
| `padValue` / `sig` / warm-up / tier-linked scaffolding / ScribblePad | — (ScribblePad is inherited; the rest is not) |
| driven by the `question-quality` e2e gate | not in the gate's `CHAPTERS` list |

**Also true and worth stating up front:** every wrapper carries a good
`conceptsConfirmed` list and `nextPointer`, and each has a **working Explore sim**.
Those survive the migration verbatim — see §6.

## 2. Target shape (copy 15–16 exactly)

```
start card → Explore sim ("Play with it →" / "Skip to the game")
           → overview read-along  → baby-step "I do" walkthrough (+ TutorialScene)
           → scored play (8 rounds, your-turn cues, reveal+glide, reteach after 3)
           → MasteryState
```

Follow the **15–16** settings, which are deliberate and were re-confirmed in the
2026-07-26 audit:

| | 12–14 | 15–16 | **17–18 (this plan)** |
|---|---|---|---|
| `guided:` round | 12/12 | 0/12 | **0/13** — every graded gesture is worked in the walkthrough instead |
| `explore:` sim | 0/12 | 12/12 | **13/13** (they all already exist — §6) |
| `tutorial` shape | mixed | always an array | **always an array** (these chapters teach 2–3 gestures each) |
| `padValue` | 0 needed | 8/12 | **~11/13** — V is a tagged union nearly everywhere |

⚠️ **`context` is mandatory on every padded task, from the first line of code.**
`QuestionBoard` switches to structured mode the moment `context` OR `instruction` is
set; structured mode **never renders `prompt`**; and `GameShell` sets `instruction`
from `padInstruction` on every padded question. So a padded task without `context`
shows a badge and a tap-chip over an empty story zone, and its carefully written
sentence is dead code. That shipped in five 15–16 chapters and went unnoticed for
five days. [paddedQuestionContext.test.ts](../src/__tests__/paddedQuestionContext.test.ts)
now fails the build for it — write the `context` first, not last.

## 3. The one real design decision — and it is bigger here than it was for 15–16

15–16's plan asked: the 12–14 games are manipulation-first, but Algebra I has answers
a slider cannot express (factored forms, irrational roots, classifications). Its
answer was: **default to manipulation, fall back to a themed `SpecPicker` only where
the math is genuinely symbolic.**

For 17–18 that fallback is not an edge case — measured across the 13 lesson files:

```
numChoices(...) sites (numeric answers) :  40
textChoices(...) sites (string answers) :  57
```

Four chapters (`quadraticAnalysis`, `rationalFunctions`, `expLogFunctions`,
`unitCircleTrig`) are **100% string answers today**. Taken at face value, a
straight port makes over half the band "tap the right card" — a quiz wearing a themed
frame, which is precisely the failure
[chapter-craft.md §0a](chapter-craft.md) names.

**The finding this design rests on: most of those string answers are not symbolic.
They are structured numbers wearing a string costume, because `ChoiceGrid` takes
strings.** Sampled from the real generators:

| rendered as a string today | what it actually is | so it can be |
|---|---|---|
| `"(3, −4)"` — a vertex | two integers | **built** (`PartsBuilder`) or **tapped** on the grid |
| `"x = 2"` — an axis of symmetry | one integer | **tapped** (`AnswerPad`) |
| `"y ≥ −3"` — a range | a direction chip + one integer | **built** (the `RayLine` idiom) |
| `"5 + 2i"` | two integers in a template | **built** (`PartsBuilder`) |
| `"(2/3)π"` — a radian measure | two integers in a template | **built** |
| `"0" / "1" / "2"` — root count | one integer | **tapped** |
| `"Shift right 2"` — a transformation | a dx / dy / flip setting | **set** on the instrument |
| `"up / down"` — end behaviour | two independent switches | **set** |

So the rule for this band, and it is a three-rung ladder — **reach for the picker
last**:

1. **The answer IS a number** → `AnswerPad` (tap), distractors = real misconceptions.
2. **The answer is a structured value** → **build it**: `PartsBuilder`, a matrix pad,
   dials on a curve, switches, or a tap on the grid. This is the rung that does the
   heavy lifting in 17–18 and the reason the band is buildable at all.
3. **The answer is a genuine classification or an unbuildable form** → `SpecPicker` /
   `StepPicker`, with the same "LOCK IN ✓" commit gesture as every other instrument.

Applying that ladder chapter by chapter (§5) leaves **roughly 10 picker tasks across
the entire band** — log laws, exp↔log rewriting, trig identities, conic type,
recursive vs explicit, independent vs dependent, sampling bias, irrational roots.
Each one is a case where the math really is "which of these is the right form", and
each is defensible on the curriculum's own answer-format policy.

**Headline: the band looks ~60% symbolic and is ~15% symbolic once structured
answers are built instead of picked.**

## 4. Engine work — build ONCE, reuse across the band

15–16 needed three new primitives (`SpecPicker`, `StepPicker`, `PartsBuilder`). This
band needs **three more**, all in
[gameKit.tsx](../src/features/chapters/teen/games/parts/gameKit.tsx):

| New primitive | What it is | `V` | Used by |
|---|---|---|---|
| **`MatrixPad`** | a 2×2 / 2×3 grid of ± steppers; the answer IS a matrix | `number[][]` | #10 (all three tiers — the chapter cannot exist without it) |
| **`CurveMatch`** | 3–4 labelled dials (amplitude · period · midline · phase) that reshape a drawn curve against a target trace; the generalisation of the existing `LineSetter` | `{a,b,h,k}` | #8 (L1–L2), reusable by #2, #3, #6 |
| **`CircleTap`** | tap/drag a position on a circle, reading angle + exact coordinates; promote the existing bespoke `UnitCircleExplorer` from a read-only sim into an answering instrument | `{deg}` or `XY` | #7, and as the quarter-turn corner in #4 |

Everything else is already built and reused verbatim: `AnswerPad` + `numChoices`,
`PartsBuilder`, `SpecPicker`, `StepPicker`, `PlotGrid`, `SlideValue`, `CrankGear`,
`QuestionBoard`, `Blackboard`, `HandCue`, `ScribblePad`, and the whole of
`GameShell`.

**Check before building `CurveMatch`:** `BalanceBench`'s `RayLine` (relation chip +
boundary) already exists for inequality answers and is not currently exported from
gameKit. Lift it rather than writing a second one — #1 (range) and #5 (domain
restriction) both want it.

## 5. The 13 chapters — worlds LOCKED 2026-07-26

**Theme rule for this band.** [curriculum-12-18.md](curriculum-12-18.md) framed 17–18
as *"math studio / analyst"* with professional hooks (signal processing, orbits,
polling). **That framing is amended here, with the founder's call:** the tone stays
sleek and mascot-free, but the WORLDS are **things a 17–18-year-old touches in a
normal week** — a photo app, the house wifi, a running app, a torch — not workplaces
they only read about. An analyst's desk is aspirational; a shared wifi connection is
felt. The curriculum doc carries a matching amendment note so the two do not
disagree silently.

Two standing rules held while choosing: **no world repeats inside the band or across
12–14 / 15–16**, and **every world is stress-tested against its chapter's HARDEST
operation** — the rule that retired the elevator for signed × in 12–14. Where a world
does not reach, §5.1 says so instead of inventing an anchor.

| # | chapter id | world | motif | why it's daily, and what carries the math |
|---|---|---|---|---|
| 1 | `functionToolkit` | **Photo Filters** | 🎚️ | each filter is a function on a pixel value · **stacking two filters is composition** · undo is the inverse · you can't un-blur = the horizontal-line test |
| 2 | `quadraticAnalysis` | **The Resale Flip** | 👟 | price them too high and nobody buys · vertex = the price that makes most · roots = break-even · **discriminant = can this pair ever make money at all** |
| 3 | `polynomialFunctions` | **Cold Snap** | 🌡️ | a week of temperature · zeros = the crossings below freezing · sign chart = the icy hours · multiplicity = touches 0° and lifts vs plunges through |
| 4 | `complexNumbers` | **The Walk Home** | 🗺️ | grid streets: 3 east 2 north is 3+2*i* · **turning the corner is ×*i*** · modulus = how far you are as the crow flies |
| 5 | `rationalFunctions` | **Share the Wifi** | 📶 | speed per device = capacity ÷ devices · horizontal asymptote = it never quite reaches zero · **vertical = the buffering wall as you approach capacity** |
| 6 | `expLogFunctions` | **The Balance That Grows** | 💳 | paying off a phone on the minimum · the debt compounds up, the handset's value decays · **a log answers "when"** |
| 7 | `unitCircleTrig` | **The Big Wheel** | 🎡 | your pod's angle is the angle, its position is the coordinate, quadrants are quarters of the ride · **the gap between two pods is the law of cosines with the radius as both sides** |
| 8 | `trigGraphsIdentities` | **Daylight Hours** | 🌅 | amplitude = how much day length swings · midline = 12 hours · period = a year · phase = when the longest day lands |
| 9 | `conicSections` | **Torch on the Wall** | 🔦 | straight on = circle, tilt = ellipse, tilt more = parabola, parallel = hyperbola. **It is the definition, performed** — a cone cut by a plane, doable tonight |
| 10 | `systemsMatrices` | **Two Receipts** | 🧾 | 3 of A + 2 of B cost £X; 1 of A + 4 of B cost £Y — **what does one actually cost?** A matrix is the table of quantities |
| 11 | `sequencesSeries` | **The Training Block** | 🏋️ | +2 reps a week vs +10% a week · nth term = this week's set · **sum = total reps in the block** · halving increments = the ceiling you never pass |
| 12 | `statsInference` | **The Reviews** | ⭐ | 4.6 from 12 ratings vs 4.4 from 2,000 · margin of error · **who bothers to leave a review is selection bias, textbook** |
| 13 | `introCalculus` | **Pace** | 🏃 | your running app: average pace for the run is the secant, **the pace showing right now is the tangent** |

Two of these stopped being decoration and became the reason the math exists, which is
the bar every world should clear:

- **#9 Torch on the Wall** — tilting a torch *is* cutting a cone with a plane, so
  "classify the conic" becomes something you do with your hand.
- **#7 The Big Wheel** — the straight-line gap between two pods really is the law of
  cosines with the radius as both sides, so the chapter's hardest item falls out of
  the world instead of being bolted onto it.

Collision avoided during the pass: an earlier "Ticket Price" for #2 sat next to
15–16's **TicketCheckout**; hence the resale flip.

### 5.1 Where the world does NOT reach — five seams, named not papered over

A world that fakes a step is worse than one that admits the step is algebra. These
five have no honest daily anchor **in any world**, so they are algebra done on the
ScribblePad, framed plainly:

1. **#3 synthetic division / remainder theorem** — no temperature meaning. The world
   carries everything else in that chapter.
2. **#4 complex-conjugate roots** — the walk explains position, addition, ×*i* and
   modulus; a conjugate root pair has no walking meaning.
3. **#5 a hole (vs an asymptote)** — a capacity wall is real; a removable
   discontinuity is an artifact of a shared factor. *Extraneous* roots, by contrast,
   map perfectly ("that answer is a negative number of devices").
4. **#8 trig identities** (L3) — daylight explains amplitude and period beautifully
   and `sin²+cos²=1` not at all. Framed as simplifying the formula before you use it.
5. **#10 nonlinear systems** (line + parabola) — the natural story is cost vs revenue,
   which is #2's world. Either accept the adjacency or move the item.

⚠️ **#3 Cold Snap is the weakest of the thirteen** and is on notice. A week of real
temperature is closer to sinusoidal than polynomial, so fitting a polynomial to it is
a stretch; it earns its place because zeros, sign chart, multiplicity and end
behaviour all read clearly and nothing else in daily life crosses zero repeatedly.
Revisit if a better daily candidate appears.

### 5.2 Per-chapter detail

Each row is `tier → question kind → how it is answered`. `V` is the chapter's value
type; every union type needs `padValue`.

**1 · functionToolkit — Photo Filters** 🎚️ · `V = {k:'num',n} | {k:'set',dx,dy,flip} | {k:'ray',dir,at}`
- L1 evaluate `f(a)` → **pad**. Distractors: dropped the constant, applied the ops in the wrong order, `x²`→`2x`.
- L2 identify a transformation → **set the filter sliders** (dx, dy, flip). Performing the shift is what defeats "inside the bracket goes the opposite way"; picking a card does not.
- L2 range of a shifted/reflected square → **relation chip + boundary** (`RayLine`).
- L3 composition `f(g(a))` → **pad**, framed as stacking two filters. L3 inverse `f⁻¹(y)` → **pad**, framed as undo.
- tutorial: [one filter on one pixel (evaluate)] · [drag the brightness slider → the whole image shifts] · [stack two, then undo].

**2 · quadraticAnalysis — The Resale Flip** 👟 · `V = {k:'num',n} | {k:'parts',a,b} | {k:'pick',id}`
- L1 vertex from vertex form → **PartsBuilder** `(h, k)` = the best price and the profit there. Axis of symmetry → **pad**. Opening → falls out of setting `a`'s sign.
- L2 complete the square / standard↔vertex → **PartsBuilder** builds the vertex form.
- L3 discriminant → number of roots → **pad** (distractors are the real sign slips in `b²−4ac`); read as *does this ever break even*. Irrational roots → **SpecPicker**, per the curriculum's answer-format policy.
- ⚠️ Must not read as 15–16's `TheShot` (a basketball arc). Price-vs-profit keeps the parabola and changes the world.

**3 · polynomialFunctions — Cold Snap** 🌡️ · `V = {k:'ends',l,r} | {k:'num',n} | {k:'signs',s[]}`
- L1 end behaviour → **two switches** (what it's doing at each end of the week), not a 4-card grid. y-intercept → **pad**.
- L2 real zeros from factored form → **tap the freezing crossings** on the trace. Multiplicity → **pad**. Sign chart → **a row of ± toggles**, one per interval (the icy hours).
- L3 synthetic division remainder → **pad** (seam §5.1 — plain algebra). Build from zeros → **PartsBuilder**.

**4 · complexNumbers — The Walk Home** 🗺️ · `V = {k:'parts',a,b} | {k:'num',n} | {k:'turn',q}`
- L1 powers of *i* → **turn the corner** (4 headings). This is the gesture that makes `i⁴ = 1` obvious rather than memorised.
- L1 add/subtract `a+bi` → **PartsBuilder**, template `a + bi` = two legs of the walk. Plot → **tap the map**.
- L2 multiply / divide by the conjugate → **PartsBuilder**.
- L3 modulus → **pad** = as the crow flies. Conjugate roots from a negative discriminant → **PartsBuilder** (`a ± bi`) (seam §5.1).
- **Zero pickers, from 8 string-answer sites today** — the sharpest proof of §3, which is why it is the pilot (§8).

**5 · rationalFunctions — Share the Wifi** 📶 · `V = {k:'num',n} | {k:'mark',x,kind} | {k:'check',id}`
- L1 domain restriction / vertical asymptote → **pad** (the capacity is a number).
- L2 horizontal asymptote → **pad**. Solve a basic rational equation → **pad**.
- L3 hole vs asymptote → **mark the x-value on the trace and label it** (chip + number), not a card (seam §5.1).
- L3 extraneous solutions → **substitute to check**: tap a candidate and watch the denominator go to zero, or the answer come out as a negative number of devices. A *verification* gesture, which is what "extraneous" means — strictly better than picking the survivor from a list.
- From **0 numeric answers today** to almost entirely produced.

**6 · expLogFunctions — The Balance That Grows** 💳 · `V = {k:'num',n} | {k:'pick',id}`
- L1 evaluate `bˣ` → **pad**. Growth vs decay → falls out of setting the rate dial (the debt climbs, the handset's value falls).
- L1 log as the missing exponent → **pad**. (`log₂8 = 3` is a number, and it is the whole idea.)
- L2 log laws · exp↔log form → **SpecPicker** ×2. Genuinely symbolic; keep them short.
- L3 solve an exponential equation with logs → **pad** = *when* does it double / halve.
- L3 half-life / compound growth → **dial the months until the balance hits the target**, so the answer is read off the curve.

**7 · unitCircleTrig — The Big Wheel** 🎡 · `V = {k:'deg',d} | {k:'parts',a,b} | {k:'num',n} | {k:'pick',id}`
- L1 degree↔radian → **PartsBuilder**, template `(a/b)π`. Arc length / sector → **pad, answered in terms of π** (the decimal-free trick 15–16's MapMaker uses).
- L2 unit-circle coordinates → **tap the pod's angle** (`CircleTap`); the exact coordinate pair is a **SpecPicker** where it must be (`(√3/2, 1/2)` is not buildable on steppers). Reference angle → **pad**.
- L3 sign by quadrant → **a ± toggle per function** (which quarter of the ride). Trig equations on `[0,2π)` → **tap every pod position that fits**. Law of sines/cosines → **pad**: the straight-line gap between two pods.

**8 · trigGraphsIdentities — Daylight Hours** 🌅 · `V = {k:'wave',a,b,h,k} | {k:'num',n} | {k:'pick',id}`
- L1 amplitude / period / midline → **CurveMatch dials**: shape your curve until it lies on the given year of daylight. The best gesture in the band — the answer *is* the match.
- L2 transform `a·sin(b(x−h))+k`, match a graph → **CurveMatch**, all four dials.
- L3 Pythagorean / reciprocal / quotient identities · verify equivalence → **SpecPicker** ×2 (seam §5.1).

**9 · conicSections — Torch on the Wall** 🔦 · `V = {k:'parts',a,b} | {k:'num',n} | {k:'pick',id}`
- L1 circle centre → **PartsBuilder** `(h, k)`; radius → **pad**.
- L2 classify the conic → **tilt the torch** and read the shape, committed on a **SpecPicker** (4 cards) — the only picker here, and the tilt makes it a performed answer rather than a recalled one. Parabola / ellipse features → **pad**.
- L3 complete the square to standard form → **build `h`, `k`, `r`**. Centre / vertices / foci → **tap on the wall**; the focus is anchored by a headlight reflector, where the beam converges.

**10 · systemsMatrices — Two Receipts** 🧾 · `V = {k:'mat',m} | {k:'num',n} | {k:'parts',a,b}`
- L1 matrix +/− / scalar → **`MatrixPad`** (build the result). Determinant → **pad**.
- L2 matrix multiplication → **`MatrixPad`** = quantities × prices. Solve a 2-var system by the matrix method → **PartsBuilder** `(price of A, price of B)`.
- L3 3-var linear (three receipts, three items) → **`MatrixPad`**. Nonlinear (line + parabola) → **tap the crossings** (seam §5.1).
- **Zero pickers, and the only chapter blocked on new engine work.**

**11 · sequencesSeries — The Training Block** 🏋️ · `V = {k:'num',n} | {k:'step',op,d} | {k:'pick',id}`
- L1 arithmetic vs geometric → **set the step switch (+ or ×) and its size** — the classification, performed. Next term / common difference or ratio → **pad**.
- L2 explicit nth term → **pad**. Recursive vs explicit → **SpecPicker** (1). Pascal / binomial coefficients → **pad** (a curriculum seam, not a world one).
- L3 finite series sum → **pad** = total reps in the block. Limit of a convergent geometric series → **pad** = the ceiling you never pass when each week's increase halves.
- The most numeric chapter in the band (9 numeric sites already) and the cheapest to migrate.

**12 · statsInference — The Reviews** ⭐ · `V = {k:'num',n} | {k:'band',sigma} | {k:'pick',id}`
- L1 single / compound / conditional probability → **pad** (as a percent, to stay decimal-clean). Mean / spread / shape of the ratings → **pad**.
- L2 permutations vs combinations → **pad**, with the *other one* as the distractor. That is the exact misconception, so the pad does the teaching.
- L2 independent vs dependent → **SpecPicker** (genuine).
- L3 normal distribution / 68-95-99.7 → **drag the boundary on the curve to ±1σ and read the percent**. Margin of error → **pad** (4.6 from 12 vs 4.4 from 2,000). Bias → **SpecPicker** (genuine — who bothers to leave a review).

**13 · introCalculus — Pace** 🏃 · `V = {k:'secant',h} | {k:'num',n} | {k:'parts',a,b}`
- L1 average rate of change → **drag the second point and read the average pace**. The instrument IS the concept, so it keeps it rather than getting a pad.
- L1 read a limit from a table / graph → **pad**.
- L2 evaluate simple limits → **pad**. Instantaneous rate as the limit of the average → **shrink the time window until the secant becomes the tangent**, i.e. until the average pace becomes the pace on screen. The chapter's whole argument, so it must be a gesture.
- L3 power rule → the derivative is an expression → **PartsBuilder**, template `ax + b`. Increasing/decreasing, max/min → **tap the fastest point of the run**.
- The existing bespoke `SecantExplorer` already does the secant→tangent drag; it becomes both the Explore sim and the shape of the L1/L2 instrument.

## 6. Wiring — what changes, file by file

**Keep, verbatim.** Each of the 13 wrappers already contains the `conceptsConfirmed`
list and the `nextPointer` copy. **Lift them into the registry row unchanged** — they
were written with the curriculum open and re-deriving them is pure risk.

**Extract the sims — do not lose them.** 5 of the 13 already point at a shared sim in
`teen/sims/`; the other **8 are bespoke functions defined inline in the wrapper that
is about to be deleted**:

| chapter | sim | today |
|---|---|---|
| functionToolkit | `TransformExplorer` | shared ✅ |
| quadraticAnalysis | `ParabolaExplorer` | shared ✅ |
| expLogFunctions | `GrowthExplorer` | shared ✅ |
| systemsMatrices | `SystemExplorer` | shared ✅ |
| polynomialFunctions | `PolynomialExplorer` | **inline — extract** |
| complexNumbers | `ComplexPlaneExplorer` | **inline — extract** |
| rationalFunctions | `RationalExplorer` | **inline — extract** |
| unitCircleTrig | `UnitCircleExplorer` | **inline — extract** (and promote to `CircleTap`) |
| trigGraphsIdentities | `WaveExplorer` | **inline — extract** |
| conicSections | `ConicExplorer` | **inline — extract** |
| sequencesSeries | `SequenceExplorer` | **inline — extract** |
| statsInference | `MeanShiftSim` | **inline — extract** |
| introCalculus | `SecantExplorer` | **inline — extract** (and reuse as the L1/L2 instrument) |

Extraction is mechanical (move to `teen/sims/<Name>.tsx`, default-export, take
`band`), but it must happen **before** the wrapper is deleted or the sim goes with it.

**Then, per chapter:**
1. New `teen/games/<World>.tsx` — a data-only `GameConfig`, math ported from that
   chapter's `makeRound` as **structured generators** that expose the numeric or
   built answer (exactly how 15–16 reused its lesson math).
2. Move its registry row from `BESPOKE_CHAPTERS` → `PORTAL_CHAPTERS` as
   `teen({...}, () => import(game), () => import(sim))`.
3. Delete `game/<X>Chapter.tsx` and `lessons/<X>TeenLesson.tsx`.
   **Verified: nothing else imports the 13 lesson files** — the nine cross-references
   to `FunctionToolkitTeenLesson` are all header *comments* ("Mirrors …"), not
   imports. Re-check with a grep at delete time anyway.

**Expected net — CORRECTED from the pilot.** The first estimate here was a large net
deletion (−8,000 against +5,000). The `complexNumbers` pilot came out **roughly
even**: 633 lines of wrapper + lesson deleted, 652 of game + extracted sim added.
The saving is not line count — it is that the loop, the board, the tiers, the cues
and the gates all become shared instead of re-implemented thirteen times. Budget
about **13 × 650 ≈ 8,500 new against ~8,000 deleted**, plus the three primitives.

No DB work: the 13 chapter rows and the `age_group` CHECK were seeded in
`20260702140000_seed_chapters_17_18.sql` and are live.

## 7. Gates

- **`e2e/question-quality.spec.ts`** — add the 13 ids to `CHAPTERS` (currently 24 →
  **37**). This is the gate that catches the `padValue` defect class that reached
  production in 15–16, and with ~11 of 13 chapters needing `padValue` it matters more
  here than in either band before it. Budget the runtime: 25 chapters take ~13.7m, so
  37 will take ~20m.
- **`src/__tests__/paddedQuestionContext.test.ts`** — picks up the new files
  automatically and fails the build on any padded task missing `context`.
- **A new source check worth adding:** *every chapter whose `V` is a union declares
  `padValue`*. That is a one-rule static check over the game files and it closes the
  exact hole that shipped once already, rather than relying on the e2e to notice.
- `tsc` · `vitest` · `next build` · 0 console errors per chapter · then a live drive.

## 8. Build order

**Pilot one chapter, get sign-off, then fan out** — the 15–16 precedent, and it is
what caught the grading bug there.

**Pilot: `complexNumbers` — The Walk Home (#4).** It is the sharpest test of the claim
this whole design rests on: 8 string-answer sites today, **0 pickers** proposed,
everything built or tapped. If the reclassification does not hold up on screen there,
the design needs revisiting before twelve more chapters are written against it. It
also exercises `PartsBuilder` (existing) and the corner-turn dial (new-ish) without
the math itself being hard to verify.

After sign-off, in dependency order:

1. **Engine wave** — `MatrixPad`, `CurveMatch`, `CircleTap`, plus lifting `RayLine`
   out of BalanceBench. Nothing else can start on #7, #8 or #10.
2. **Sim extraction wave** — the 8 inline sims → `teen/sims/`.
3. **Cheap chapters** (mostly pad, no new primitive): #11 The Training Block,
   #13 Pace, #5 Share the Wifi, #1 Photo Filters, #2 The Resale Flip.
4. **Rest**: #3 Cold Snap, #6 The Balance That Grows, #9 Torch on the Wall,
   #12 The Reviews, then #7 The Big Wheel, #8 Daylight Hours, #10 Two Receipts (the
   primitive-dependent three).

## 9. Deliberately out of scope

- **Illustrated backdrops.** 17–18 is code-drawn + a faint motif, per the band's own
  "sleek, no mascot" framing. No Nano Banana spend planned.
- **The voice corpus.** 17–18 has no recorded clips and this plan does not add any;
  the whole 3–11 band is ahead of it in the queue.
- **A guided round.** Following 15–16: every graded gesture is worked in the
  walkthrough instead. Revisit only if a live drive shows a chapter whose walkthrough
  cannot cover all its gestures.

## 10. Known risks, named rather than discovered later

1. **A sentence must be true for every seed its generator can draw.** The 15–16 pass
   shipped "the two moves partly cancel" for a seed where both were positive, and
   three more sign-dependent claims were found in the same audit. This band has more
   sign-dependent language than any before it (discriminants, decay rates, negative
   leading coefficients, phase shifts, temperatures below zero). Audit each written
   `context` against the full range of its generator, and leave the reason as a
   comment.
2. **`padValue` on ~11 of 13 chapters.** The one defect that reached production in
   15–16, and this band has nearly twice the exposure. §7's static check, not
   vigilance.
3. **Nothing here has been checked at short-landscape.** Three new instruments and
   thirteen new scenes; this repo has shipped short-landscape collisions before.
   `640×320 · 667×375 · 740×360 · 1024×400` is the matrix.
4. **A picker count that creeps.** Every time a structured answer is "easier as a
   SpecPicker", the band drifts back toward the quiz it is being migrated out of.
   The ~10-picker budget in §3 is the number to hold, and it is worth counting at the
   end.
5. **A daily world can drift out of date faster than a professional one.** Photo
   filters, running apps and review scores are current now; they are also the kind of
   reference that ages. Nothing here depends on a specific brand or product, which is
   the mitigation — keep it that way.
