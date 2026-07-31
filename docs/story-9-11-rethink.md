# The 9–11 band, re-thought as story worlds

**Status: audit + plan. Nothing built.** Written 2026-07-31 after auditing all 12 chapters against
[chapter-craft.md](chapter-craft.md). Read that file first — this document does not restate its
rules, it applies them. It is the 9–11 twin of
[story-6-8-rethink.md](story-6-8-rethink.md), whose closing "Not decided" item was exactly this
question.

**Two founder decisions are taken (2026-07-31):**

1. **The band becomes STORY WORLDS, and the register stays PRE-TEEN.** Not the cozy 3–8 storybook
   (the reason the Mission-HUD look was built in the first place — *"reads too young for
   10–11yos"*), and not the neon HUD with motion bolted on (that is SliceShop's rejected first
   rebuild: an instrument with wallpaper). **A working world**: a depot, a build site, a survey
   crew, a market at scale — real painted places, real characters, real journeys, with a job to do.
   The register comes from the SUBJECT and the JOB, not from the palette.
2. **Landscape-only, like 3–5 and 6–8.** Journeys need horizontal room and every chapter below
   gains one. ⚠️ **This is a behaviour change: 9–11 works in portrait today** — no chapter mounts
   `RotateGate`, they all carry a `short = vh < 470` path instead. Mount the gate (early return
   **below every hook**, or turning the phone changes the hook count and React tears the chapter
   into the error boundary) and delete the `short` path it replaces.

---

## Why the band needs this at all

The 9–11 set was built 2026-07-02 in the pre-teen "Number Lab" look, then the four earlier
storybook chapters were retrofitted into it, so all twelve are uniform. That uniformity is the
problem: **they are uniform in the shell, and the shell is the whole chapter.**

Four greps carry the entire diagnosis.

```
$ grep -oE "@keyframes [a-zA-Z_]+" <each 9-11 chapter>        →  (nothing, all twelve)
$ grep -c "Arrive|journeyOf|SheetCell|critters"               →  0   (all twelve)
$ grep -c "<img|src="                                          →  0   (all twelve)
$ grep -h "PtMilo|LabBackdrop"                                 →  12 × <PtMilo left={9} />
                                                                  12 × <LabBackdrop accent={ACCENT} />
```

| | 3–5 / 6–8 (rebuilt) | 9–11 (as shipped) |
|---|---|---|
| drawn cycles | 24 registered, used across both bands | **0** |
| journeys (`Arrive` / `journeyOf`) | every rebuilt chapter | **0** |
| keyframes in the chapter | derived motion + a nudge | **0** — only the kit's `pt_float`/`pt_pop` |
| images / sprites in the band | painted throughout | **0** — 100% code-drawn |
| answering gesture | a different verb per skill | **`choices` chips, all 12** |
| Milo's job | walks, carries, leads, keeps a shop | `<PtMilo left={9} />` — bottom-left, bobbing, no job |
| scene across the ten rounds | backdrop + cast rotate per round | **one** `LabBackdrop`, never changes |

**Aliveness check ([chapter-craft §1](chapter-craft.md)): 0 of 4, in all twelve.** Nothing arrives
on its own legs; a tap pops a verdict pill rather than sending anyone anywhere; Milo is decoration;
the scene is one backdrop for the whole run. That is the same score BlockYard's rejected first
rebuild got, and the founder's words for it then — *"doesn't look right"* — are what this document
exists to answer.

**And the delete-the-art test fails band-wide.** FactorLab prints *"Is 7 even or odd?"* over chips
`Even` / `Odd`. Delete the entire analyzer — the node grid, the pairing, the whole visual — and all
thirty questions still work. The analyzer is scenery. The same holds for the other eleven: the
question is stated in words, the answer is one of N chips, and the drawn instrument beside it is
never load-bearing. This is §0a from the other side, and the fix is the same one BlockYard needed:
**state the quantity ONLY as the thing, and let the number appear after the commit.**

**The band is TAP-ONLY** — no `onPointerDown` / `onPointerMove` anywhere in 3–11. Every proposal
below is taps. Do not introduce drag; the teen `ScribblePad` is the only pointer surface in the repo.

---

## The one defect that is not a style matter

**A third of this band's questions are coin flips, and the adaptive engine cannot tell a guesser
from a learner.**

| chapter | question type | choices | a guesser scores |
|---|---|---|---|
| FactorLab | `evenOdd` | `['Even','Odd']` | **50%** |
| FactorLab | `prime` | `['Yes','No']` | **50%** |
| AngleScope | `angleType` | `['Acute','Right','Obtuse']` | **33%** |

FactorLab's easiest tier is `pool = ['evenOdd', 'evenOdd', 'multiple']` — **two of three L1 rounds
are a coin flip.** `core/adaptive.ts` promotes on 3 correct in a row at ≥80%, and a child answering
at random hits three `evenOdd`s in a row about one run in eight. So the tier can climb on noise, and
a wrong answer is indistinguishable from a slip.

This is not a wording fix. **A two-way categorical answer is not a question, it is a toss** — and
the craft doc already names the shape of the repair: make the child DO the thing that settles it.
Pair the units and see if one is left over (even/odd). Try to build a rectangle and find only
`1 × n` fits (prime). Open the angle against a square corner (acute/right/obtuse). Each is a
gesture, each is un-guessable, and each is the verb that chapter should have had anyway.

⚠️ **The three-way sign picker in SeesawPark is deliberately NOT this fault** — `>` `<` `=` is a
genuine three-way categorical answer over two quantities the child had to compare first. The test is
whether the choice can be reached without doing the work.

---

## The twelve

Each entry: what it does now → the honest verb → who wants it and why (§0a's second half) → what
moves → template → cost. "Cost" is engine work, not art.

### 1 · NumberVault — `bigNumbers` → **LOAD THE ORDER**
Today: base-ten blocks to 10,000 are drawn for you; tap the digit / the value / the number.

**Who wants it:** a dispatcher has an order to fill — 3,482 units — and the yard holds
thousand-crates, hundred-pallets, ten-boxes and singles. Nobody counts 3,482 things; you load the
biggest unit that fits and work down, which **is** place value.

Milo loads each bay; the child says how many of each unit go in. Overfill a bay past nine and it has
to bundle up — the constraint that makes the next column mean something. The numeral is read off
work the child did, after the commit.

- **Shares its engine with 6–8's BuildingBlocks** (`yard.tsx`, `blockSet`) — extended a place to
  thousands. Build on it, do not fork it: `blockSet(cube)` is deliberately the only place in the app
  that derives a rod from a cube, and a second copy reintroduces the 0.55 lie.
- ⚠️ The tens side is on the LEFT and that is load-bearing (BuildingBlocks' own note).
- Template: BuildingBlocks + MeasureIt (an answer you built). **Cost: low — the engine exists.**

### 2 · RoundingTrail — `rounding` → **ESTIMATE THE RUN**
Today: a number line with two stops and a halfway flag; tap the nearer stop's value.

The line is honest and the gesture is not — with both stops printed and the marker placed for you,
the answer is read off the picture. And more importantly **nothing on screen wants a rounded
number**, so rounding looks like a rule rather than a tool.

**Who wants it:** you are loading a run and the truck holds 100. Three crates weigh 47, 62 and 38 —
will they fit? Nobody multiplies that out at the loading bay; you round each and add. The child
rounds each load, commits, and **then the exact total is weighed** — so they see their estimate was
close enough (or not) rather than being told it was right.

- The estimate is the answer; exactness is the confirmation, after the commit.
- **Round-to-10 and round-to-100 become "which depot / which truck"** — the landmark is a place on
  the route, so the halfway flag is a real fork in the road rather than a tick mark.
- Template: HopAlong's route + HomeTime's commit. **Cost: medium.**

### 3 · TimesGrid — `timesTables` → **LAY IT OUT**
Today: the array is drawn for you; tap the total. (Its skip-count animation is correct — it runs
only after a correct pick, which is post-commit and fine.)

**Who wants it:** a floor has to be tiled and the tiles come in rows. The child lays `a` rows of `b`
and reads what they built. The two-digit area model then splits the same floor into a tens strip and
a ones strip — the same job, seen the way that makes multi-digit multiplication work.

- The rows must be laid one at a time by the child, or it is the current chapter with a longer
  animation. **A lane that will fill must be reserved from empty** (MarketDay's own fix) or the
  floor jumps a row under a child part-way through counting.
- Template: MarketDay's load-the-trays, taken all the way. **Cost: medium.**

### 4 · DivisionShare — `division` → **DEAL IT OUT** (closest to honest already)
Today: nodes are dealt into bays for you; tap how many each / the remainder.

The gesture is right and it is done TO the child rather than BY them. Deal the crates yourself, one
round at a time, and stop when you cannot complete another full round — **the remainder is what is
physically left in your hands**, which is the one thing about division a diagram never conveys.

**Who wants it:** rations for a crew, boxes for a delivery. A remainder of 2 means two people go
without, or one box goes out short — it has a consequence, which is what SliceShop learned.

- ⚠️ **The remainder must have somewhere to BE.** Left as a number in a readout it is an
  afterthought; left in a pile beside the bays it is the answer.
- Template: HomeTime (tap to add, tap to take back, commit, spares remain). **Cost: medium.**

### 5 · FactorLab — `factorsMultiples` → **ARRANGE IT**
Today: four question types, two of which are coin flips (see the defect above).

**Every one of these four ideas is the same physical act: can you arrange `n` into equal rows?**
Factors ARE the rectangles that come out flush. A prime only makes a single line. Even is a
rectangle two deep. A multiple of `b` is a number that makes a flush rectangle `b` wide.

So the chapter is one gesture: **set the number of rows and see whether it comes out flush.** Crates
in a yard, seats in a hall, panels on a wall. Un-guessable by construction, and it collapses four
question types into one honest verb — which is what a chapter with two coin flips in it needs.

- Keep all four *questions*; they become four things to ask about one arrangement.
- Template: MeasureIt (an answer you built that cannot be faked). **Cost: medium.**

### 6 · FractionForge — `fractionsCompare` → **MATCH IT**
Today: bars are drawn pre-shaded; tap the fraction / the greater one / the sum.

⚠️ **6–8's SliceShop now owns SHARING (FIT / TAKE), and a 9–11 chapter may not repeat it** — the
same no-repeat-within-a-band rule that governs backdrops and worlds. What 9–11 genuinely adds is
**equivalence**: that two different cuts can be the same amount.

**Who wants it:** two crews cut the same board differently and the pieces have to be interchangeable
— or a recipe is written in eighths and the only measure on the shelf is quarters. The child cuts a
second whole to MATCH a given piece, and equivalence is the thing that either lines up or does not.

- Comparison and same-denominator ±, laid against each other, fall out of the same board.
- Keep the wholes code-drawn where the math must divide exactly, **but clip the real material by the
  exact geometry** — SliceShop's rule: flat SVG wedges read as a pie chart on a photograph.
- Template: SliceShop's clip-by-geometry, MeasureIt's lay-and-compare. **Cost: medium–high.**

### 7 · DecimalGrid — `decimals` → **DIAL IT IN**
Today: a 10×10 grid is shaded for you; tap the decimal / the greater / the digit.

**Who wants it:** something has to be filled, weighed or cut to an exact figure — and *exact* is why
the decimal exists. A 100-grid is the right manipulative and the wrong posture: the child should be
the one shading it to hit a target, then reading what they made.

- ⚠️ **The readout must not print the value while they shade** — that is the teen month-dial, and it
  turns the chapter into hot/cold. Show the grid, not the number, until commit.
- The 0.3 vs 0.25 misconception pair is the payload and it survives: on the grid, 0.3 is visibly
  thirty cells and 0.25 is twenty-five, so "more digits means bigger" dies where the child can see it.
- Template: MeasureIt (build the answer) + BlockYard's post-commit numeral. **Cost: medium.**

### 8 · UnitConverter — `measurementUnits` → **DOES IT FIT?**
Today: a converter panel with an in/out box; tap the converted number, or the sensible unit.

Conversion as an arithmetic exercise is the driest thing in the band. **Conversion exists because
two measurements written in different units have to be compared** — and a comparison has a
consequence.

**Who wants it:** the beam is 250 cm, the truck bed is 2 m. Does it fit? You cannot answer without
putting both in the same unit, and then the beam either goes on the truck or it does not — on screen.
Sensible-unit questions become the same act one step earlier: you cannot measure a road in
millimetres because the tool does not reach.

- **The conversion is the work; fitting is the answer.** That keeps the arithmetic and gives it a
  reason, without the child ever tapping a bare converted number.
- Template: MeasureIt (lay it against the thing). **Cost: medium.**

### 9 · GridPlotter — `areaPerimeter` → **FLOOR IT / FENCE IT**
Today: the rectangle is drawn; tap the area / perimeter / missing side.

The chapter's one genuine difficulty is that **area and perimeter are two different jobs on the same
rectangle**, and children conflate them. Say so with two different materials: tiles go INSIDE and
you buy them by the square; fence goes AROUND and you buy it by the length. Order the wrong one and
you are short.

**Who wants it:** a build site with a materials order to place. The missing-side question is the
same site read backwards — you have the tiles, how wide can the room be?

- Template: MeasureIt (lay a unit end to end) for the fence, MarketDay's lay-the-rows for the floor.
- **Cost: medium.**

### 10 · AngleScope — `anglesSymmetry` → **SET THE ANGLE / FOLD IT**
Today: an angle is drawn; tap acute / right / obtuse (a 33% guess). Symmetry: tap the line count.

**Who wants it:** a ramp has to clear a step, a roof has to shed rain, a crane arm has to reach.
Milo sets the angle against a square corner and the classification is what he DID rather than what
he was shown — TickTock's SET IT, applied to degrees instead of minutes.

Symmetry is the other half and wants its own act: **fold it.** A shape folds onto itself or it does
not, and counting the folds that work is the answer.

- ⚠️ **The dial must not print the degrees while they set it** — TickTock's own rule, learned the
  hard way. Grade with a tolerance band.
- ⚠️ **A scaffold fades by tier** — show the square-corner guide at L1–L2, retire it at L3, exactly
  as TickTock's minute ring does.
- Template: TickTock (`clock.ts` + its two-stepper control). **Cost: medium — the closest existing
  instrument in the repo.**

### 11 · DataDeck — `dataGraphs` → **RUN THE TALLY**
Today: a four-bar chart is drawn; tap the tallest / a value / a difference / the total.

Reading a chart somebody else made is the skill, but it is the SECOND half of it. A chart only means
anything if you know it came from counting real things — and a child who has never built one reads
it as decoration with numbers on.

**Who wants it:** a count that has to be reported. Things arrive — deliveries, crossings, sightings —
and the child tallies them into bars as they come. Then the chart is theirs, and the four questions
are asked of a picture they made.

- **This is the chapter with the most obvious journey in the whole band** and currently none: the
  things being counted should walk in.
- Arc: the built chart persists across the round, which is the cumulative-arc item the band lacks.
- Template: HomeTime (things arrive and are counted) + the counting parade. **Cost: medium.**

### 12 · MissionBrief — `wordProblems` → the world ACTS THE STORY OUT
Today: a story panel of text with a `?`; tap the number.

This is the chapter that most needs the band's whole change and needs the least new thinking, because
the verb is already right — a word problem ends in a number. What is missing is that **the story is
told in prose and happens nowhere.** Three boxes of six arrive and four are given away; all of that
should be on screen, in the world, with things travelling.

- ⚠️ **Two-step (L3) is the payload and it needs the intermediate to be VISIBLE** — the child should
  see eighteen exist before four leave, or the two steps collapse into one opaque sum.
- ⚠️ **Do not print the arithmetic while the story plays.** The equation is the summary, after commit.
- Template: StoryTime, at 9–11 scale. **Cost: medium.**

---

## The art, honestly

**The engine is free. The cast is not.**

Everything the animation needs already ships and is battle-tested: `critters.tsx` (`Critter`,
`Arrive`, `SheetCell`, `journeyOf`, `hop`), `FitBox`, `SkillBeat`, `RotateGate`, `yard.tsx`'s
base-ten set, `market.ts`'s scene-fitting. **Adopting it is the single biggest win in this plan and
costs no art at all.**

What does not carry over is the cast. All **24 registered drawn cycles are cozy animals** (rabbit,
chick, duckling, lamb, frog, bee, ladybug…) plus Milo and the astronaut/alien pair. A ten-year-old's
working world with a duckling in it is the "too young" problem the HUD was built to avoid, arriving
by a different door.

Three ways out, cheapest first — **and the first is probably enough for most of the band:**

1. **Milo plus things that travel.** A crate, a pallet, a tile, a beam has no legs and does not need
   them — `Arrive`/`CARRY_SPEED` exist for exactly this, and BlockYard's own header records the
   honest cost (*"a block has no legs, nothing walks but Milo"*). In a depot or on a build site that
   is not a weakness, it is what the place looks like. **Zero credits.**
2. **The two space cycles**, which already read grown-up, for any chapter that suits them.
   **Zero credits.**
3. **New art for a crew-mate or two** — a character who arrives, wants something, and leaves with it,
   which is §0a's *who wants this and why*. **~373 Higgsfield credits remain** (confirm live, do not
   trust this line — the handoff has been wrong about credits before). Reference the ORIGINAL art per
   the craft doc, generate on flat chroma so the character can WALK, and measure per-frame bbox to
   find the settle point.

**Backgrounds:** 90 exist. The grown-up-reading ones are `order_depot` · `order_yard` ·
`train_station` · `bus_depot` · `locker_room` · `space_launchpad` · `space_deepspace` ·
`space_moon` · `open_clearing` / `open_hills` / `open_orchard` / `open_river` (BlockYard's, and the
no-repeat rule is per band so 9–11 may take them) · the ten `market_*` stalls (six are CoinShop's).
⚠️ **Check style, then value, then hue before using any of them** — the library mixes painted and
flat-vector, `party_banner`/`party_balloons` are near-empty pale rooms already flagged as too bright,
and the style check is an EYE check with the measurement as the gate behind it.

---

## Build order — cheapest real gain first

**A · the engine adoption, on one chapter, as the template**
1. **DataDeck (#11)** first. It has the most obvious journey and the least bespoke geometry: things
   walk in, a bar grows, four questions are asked of what the child built. It exercises `Arrive`,
   the cumulative arc, `RotateGate`, the post-commit numeral and the world-per-round rotation — i.e.
   every band-wide item — with no new math and no new art. **It is the pattern the other eleven copy.**

**B · the coin-flip defect, which is also a rebuild**
2. **FactorLab (#5)** and **AngleScope (#10)**. Both are gestures replacing guesses, so the
   pedagogy fix and the story rebuild are the same commit. AngleScope has the closest existing
   instrument (TickTock).

**C · one engine, two chapters**
3. **NumberVault (#1)** on `yard.tsx`, then **DecimalGrid (#7)**, which is the same
   build-it-and-read-it-after posture one place to the right of the decimal point.

**D · bespoke verbs, one at a time, finalized and verified before the next**
4. TimesGrid (#3) → GridPlotter (#9) → DivisionShare (#4) → MissionBrief (#12) →
   UnitConverter (#8) → FractionForge (#6) → RoundingTrail (#2).

**Band-wide, do in whichever chapter you touch first and then repeat:**
- mount **`RotateGate`** (early return **below every hook**) and delete the `short` path it replaces
- **a world per round, not one backdrop per chapter** — a flat `RUN` of setting+cast pairs,
  interleaved so consecutive rounds differ, indexed **straight and never modulo**, with the demo and
  guided round taking the first slots off the same array
- **a cumulative arc outside `SkillBeat`**, driven by `onRound` — anything drawn inside a round
  resets every round
- **Milo gets a job.** `<PtMilo left={9} />` is a sticker; he should be doing the thing.
- **the numeral appears after the commit**, never beside the manipulative
- **`sig` on every beat** — math-only dedupe, or the rotating scene reads as variety and the same
  question comes back
- put the fix in [`critters.tsx`](../src/features/chapters/story/critters.tsx), not in the chapter,
  or the next chapter copies the bug back in

## Verifying any of this

Per the craft doc, and specifically:
- a sweep must **import the same layout function the scene renders from**, not re-implement it
- **mutation-test the gate**, and tell an inert mutation from a missed regression
- assert on `getBoundingClientRect()` — real travel distance, real gaps. "The screen moved" is not
  evidence, and **a wrong answer advances too**
- **verify an animation on the SECOND round, never the first** — React reuses those elements
- front the tab before measuring: an entrance animation is a lie for its first few hundred ms
- **play it to the end.** A perfect run exits early on mastery, so the late rounds need an
  err-every-round drive or they are never seen. Every founder catch on the last four chapters was
  something no gate could see.
- gates: `tsc` · `npm test` · `next build`, then bump `public/sw.js` VERSION

## Not decided

- **Whether the pre-teen kit survives.** `story/preteen/kit.tsx` (187 lines) is the HUD: `PT`,
  `ACCENTS`, `LabBackdrop`, `PtMilo`, `PromptCard`, `ChoiceButton`, `IntroCard`, `ExploreScaffold`,
  `PtSlider`/`PtReadout`. The **Explore sim scaffold and the sliders are worth keeping** — a
  play-with-it-first beat is good and the 3–8 bands have nothing like it. The backdrop, the Milo
  sticker and the chip buttons are what the rebuild deletes. Decide when the first chapter lands.
- **Whether the twelve `ACCENTS` mean anything after the rebuild.** A painted world carries its own
  palette; a neon accent over it is the slab fault waiting to happen.
- **How much new art the band actually gets** — see "The art, honestly". Option 1 (Milo plus things
  that travel) may carry most of the band for nothing, and that should be tested on DataDeck before
  any credits are spent.
