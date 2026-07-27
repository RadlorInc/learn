# The 6–8 band, re-thought against the 3–5 criteria

**Status: A1 (SeesawPark) and A2 (StoryTime + MarketDay) are built; the rest is a plan.** Written
2026-07-27 after auditing all 12 chapters against
[chapter-craft.md](chapter-craft.md). Read that file first — this document does not restate its
rules, it applies them.

**One founder decision is already taken (2026-07-27): the 6–8 band goes LANDSCAPE-ONLY,**
like 3–5. Journeys need horizontal room, and every chapter below gains one. Every 6–8 chapter
therefore mounts [`RotateGate`](../src/features/chapters/story/RotateGate.tsx) — with the early
return **below every hook**, or turning the phone changes the hook count and React tears the
chapter into the error boundary (this crashed chapter 2 the first time it was wired).

⚠️ This is a behaviour change, not just a layout one: **6–8 works in portrait today.** Its
chapters were built with a `short = vh < 470` responsive path instead of a gate. Going
landscape-only makes that path dead weight in the chapters that get rebuilt, and it is worth one
pass afterwards to delete what it was protecting.

---

## Why the band needs this at all

The 6–8 set was converted to story mode on 2026-07-01. The 3–5 band was **rebuilt** over
2026-07-24 → 26 — creature engine, drawn walk cycles, per-skill verbs, cumulative arcs, §0a. So
6–8 is on the *older* pattern, and it is the pattern §0a exists to name.

Two greps carry the whole diagnosis.

```
$ grep -oE "@keyframes [a-z_]+" <each 6-8 chapter>
NumberTown      nt_float nt_pop        SliceShop     sl_float sl_pop
BuildingBlocks  bb_float bb_pop        CoinShop      cs_float cs_pop
HopAlong        ha_hop   ha_pop        TickTock      tt_float
StoryTime       st_float st_pop        SeesawPark    sp_float
MarketDay       md_float md_pop        BlockYard     by_float by_pop
                                       ShapeStudio   ss_float
```

**The band's entire animation vocabulary is two keyframes: `_float` (Milo bobs in place) and
`_pop` (an object scales in).** Nothing travels. Nothing has a cycle. The rebuilt 3–5 chapters
have *fewer* keyframes than this, because their motion is derived — `Critter` drives real travel
from a drawn sheet and what is left over is a nudge.

| | 3–5 (rebuilt) | 6–8 (as shipped) |
|---|---|---|
| drawn cycles (`critters.tsx`) | 5 chapters + 4 test suites | **0 chapters** |
| journeys (`journeyOf` / `cycleScale`) | every chapter | **0** |
| answering gesture | a different verb per skill | **tap 1 of 3 chips, all 12** |
| teaching | in-world | a **modal white card** over the scene |
| cumulative arc outside `SkillBeat` | strip · tray · build | `onRound` swaps the **backdrop only** |
| `RotateGate` | all | **none** (decided above) |
| emoji in the painted world | none | Milo → 🦊+✉️, objects → 🏠 (404 fallbacks) |

So the band is where Group B was before its rebuild: **one surface with twelve nouns on it.**

**The band is TAP-ONLY** — no `onPointerDown` / `onPointerMove` anywhere in 3–11. Every proposal
below is taps. Do not introduce drag here; a 6-year-old on a tablet and an app with no drag
precedent are two reasons, and the teen `ScribblePad` is the only pointer surface in the repo.

---

## The one defect that is not a style matter

**SeesawPark (compareNumbers) is hot/cold, in production.**
[SeesawPark.tsx:235](../src/features/chapters/story/SeesawPark.tsx) —
`setTimeout(() => setTilt(true), 400)`. The beam tips toward the bigger side 400ms after the
question loads, **before the child answers**, and the winning pan additionally gets
`glow={tilt && big}` ([:173](../src/features/chapters/story/SeesawPark.tsx)). The answer is handed
over twice. A child wins the entire chapter by reading the tilt and tapping the matching sign,
without ever comparing two numbers — and comparing two numbers is the only thing the chapter
exists to teach.

This is the rejected teen live-tilt balance beam and chapter 4's green Ready button. The rule was
already in the craft doc when this chapter shipped: *nothing may signal that the answer is right
BEFORE the child commits it.*

**Fix: the beam stays LEVEL until commit, then tips to confirm.** The teen `BalanceBeam` does
exactly this and for exactly this reason (it shows `2x`, not its value). The sign chips are *not*
the problem — `>` `<` `=` is a genuine three-way categorical answer, the one place in the band
where a picker is the right instrument (same argument as the teen SpecPicker exception). The
defect is the timing.

---

## The twelve

Each entry: what the chapter does now → the honest verb → what moves → the template to copy.
"Cost" is engine work, not art; **no proposal below needs new art.**

### 1 · NumberTown — `numbersTo100` → **DELIVER IT**
Today: three numbered houses in a row, tap the one matching the spoken number.

The story already names the verb — Milo *is* the postman — and he never goes anywhere. The
journey is written into the intro copy and absent from the code.

Milo stands at the kerb holding a letter with the number on it. Tap a house → **he walks to it**
and posts it. Tap the wrong one → he sets off, checks the number at the gate, and walks back
(HomeTime's repair journey: a miscount is a journey too, facing the other way). His
`milo_walk.png` sheet already exists and this is the chapter it was drawn for.

- **The number stays written on the letter**, not only spoken. Reading a two-digit number is the
  skill; remembering one you heard is not, and the band has no voice clips.
- Arc: posted letters accumulate — a satchel that empties, or mail visible in the boxes he's done.
- Template: `Critter` + `journeyOf`, HomeTime for the two-way journey. **Cost: medium.**

### 2 · BuildingBlocks — `placeValue` → **BUNDLE IT**
Today: 3 stacks of ten + 4 loose are drawn for you; tap "3" from three chips.

The bundling **is** place value, and it arrives already done. Tap ten loose items and they fly
into a crate which snaps shut as a ten; the leftovers are the ones; the two-digit number is read
off work the child did. Same shape as MeasureIt (an answer you built) and HomeTime (deciding when
to stop — nothing on screen says "that's enough" until you commit).

- Template: MeasureIt for lay-and-count, Shape House for the flight-into-place.
- **Shares its whole engine with #10/#11 — build it once.** **Cost: high, amortised over three.**

### 3 · HopAlong — `skipCounting` → **HOP IT**
Today: groups sit still with every running total printed above them and one blank.

Two faults. The pads never move (`ha_hop` fires in the demo only), and **printing every total
hands over the pattern** — the blank is derivable from its neighbours without skip-counting once.

Milo hops pad to pad for real, and a total appears **only where he has been**. The child taps the
pad he should land on next; he hops there. The blank is not a gap in a printed row, it is
somewhere he hasn't got to yet.

- Best fit in the band for `critters.tsx` unchanged.
- Template: FollowTheLeader (tap → that one travels). **Cost: medium.**

### 4 · StoryTime — `storyProblems` → keep the verb, **make the operation move** ✅ DONE
**⚠️ AND THE CAST IS NOW ENTIRELY DRAWN CYCLES — founder call, and it was the right one.** The
chapter used to be about apples, balloons and flags. **A fruit cannot arrive**: it can only be slid
across the picture like a cut-out being dragged, which is precisely what "the operation moves" was
asking it to do. A creature walks in on its own legs, and the sum IS the journey — so the verb and
the art finally agree. The generalised rule is the one SeesawPark's cast re-pick already found: a
still object beside a living one reads as broken art, so the cast is all-or-nothing.
Settings became habitats to match: 🐠 **Coral Reef** (fish · crab · shark) · 🏖️ **Sandy Shore**
(duck · turtle · eagle) · 🌙 **Moon Base** (astronaut · alien) — the last of which finally spends the
two space cycles that were generated with no chapter to put them in.
Joiners now **travel in from off-frame** and leavers **travel out**, each staggered so a group files
in rather than swarming. The verb is unchanged (a story problem ends in a number, so tap-the-total
stays) — what changed is that the arithmetic no longer happens in a jump cut.

**Direction is the whole trick, mirrored from PlayTime's slot order.** There the movers own the
LEFTMOST slots and travel left→right; here the movers own the RIGHT-hand end of the row (group B in
an addition, the trailing few in a take-away), so **arrivals come from off-frame right and
departures leave the same way** — the only direction that never walks something through the group
the child is counting. A leaver turns round before it goes, or the cycle contradicts the travel.

**The reef cast is now ALIVE**: its items are the `_side` sprites, every one of which has a drawn
cycle, so fish/crabs/turtles swim in and out rather than being dragged sideways as cut-outs. The
octopus was dropped for having no cycle — a still creature beside a living one reads as broken art,
the same call SeesawPark's cast re-pick made. Picnic and Fun Fair stay objects and simply travel;
an apple being carried on has no feet to skate.

Compare deliberately still has nobody travelling: both piles are the story's opening state, and its
movement is the surplus lighting up as it is counted.

- **The choreography is now derived, not picked**: the question opens when the last mover has
  actually landed (`storyLayout` → `inFlowJourney`), where a fixed 700ms used to offer the answer
  buttons while the take-away was still happening.
- **Cost: low–medium** — as predicted, and it landed one shared primitive (`Arrive`) that #5 and any
  later in-flow chapter reuses.

### 4a · The two defects this turned up in shared code
- ⚠️ **`SheetSprite`'s walk-in was skating, from the day it was written.** `arrived` gated BOTH the
  transform target and the leg cycle, and it flipped once at `delayMs + ms` — so a creature walked
  on the spot for the whole delay, then **slid the entire distance with its legs parked**. That is
  the cardinal "cycle and travel must be given the same number" rule broken inside the helper that
  exists to enforce it. Travel now lives in `Arrive`, which hands its child a `moving` flag, and
  `SheetCell` runs the cycle on exactly that flag. Verified by measurement, hidden-tab safe: legs
  `paused` at the off-frame start, `running` while the transform target is in flight, `paused` on
  arrival — and again on a late scored round, not just round 1.
- **`SheetCell` was split out of `SheetSprite`** so a caller that draws something UNDER the sprite (a
  contact shadow) can wrap `Arrive` around the pair and travel them as one element. A shadow left
  outside the travel is the sibling-shadow bug this repo has already shipped once.

### 5 · MarketDay — `multiplication` → **LOAD THE TRAYS** (cheap option taken)
Today: `g` clusters of `per`, pre-filled; tap the total.

Put `per` on each of `g` trays yourself, then read the total — "equal groups" becomes something
the child did rather than something they were shown. The array view earns its place as the second
representation of the same act. **The full verb is still open.**

**⚠️ THE CAST IS ALSO NOW ENTIRELY DRAWN CYCLES** (same founder call as #4): equal groups made of
cupcakes and beads were a grid of dead stickers — the one thing on screen that never moved. Settings
became habitats with a group noun each: 🐔 **The Farm** (PENS of chicks · ducklings · lambs) · 🌸
**The Garden** (PATCHES of bees · ladybugs · ants) · 🌲 **The Woods** (NESTS of birds · squirrels ·
eagles). A pen of chicks breathes.

✅ **The cheap middle option is DONE:** each tray is now **lowered onto its place** one at a time
instead of scale-popping into existence, and an **empty socket waits there for it** — a soft shadow
with light on its rim, never a hairline outline. The array view lays its rows down the same way; its
frame is already full-size, so the lane every row will fill is reserved from the start and nothing
shuffles under a child part-way through counting. The demo's running total still climbs as each one
lands; the scored round still shows `?`, because a total that climbs before the commit is the answer
handed over.

- The lift is a **share of the tray's own height**, not px — see the FitBox trap in
  [chapter-craft.md](chapter-craft.md).
- **Cost: low, as predicted.** Load-the-trays remains the real verb whenever it is wanted.
- ⚠️ **SIZE A CREATURE BY AREA, NOT BY HEIGHT.** Once the cast is drawn cycles their aspects run
  from **0.457** (the alien: tall and thin) to **1.746** (the shark), and a size chain that only sets
  HEIGHT drew ten aliens as 18px slivers — fatal in a chapter about counting them — while making a
  shark hog its row. Dividing the height by `√aspect` holds the drawn AREA roughly constant, so every
  creature reads at the same weight whatever shape it was drawn. Both chapters do this now.

### 6 · SliceShop — `fractions` → **CUT IT**
Today: an SVG whole arrives pre-cut into `den` equal parts with one shaded; tap 1/2 · 1/3 · 1/4.

**Equal** parts is the entire idea, and equality is exactly what is pre-supplied. Tap the cut
lines until the whole is in equal parts, then take one. The construction cannot be faked, which
is the MeasureIt property.

Group type ("one half of 6") → **SHARE IT**: deal the group into `den` equal little groups, the
DivisionShare gesture, and count one.

- Keep the code-drawn wholes — any denominator divides cleanly and it is the "SVG where the math
  must be exact" call the clock and the fraction wholes already make.
- **Cost: medium.**

### 7 · CoinShop — `money` → **PAY IT**
Today: a handful of coins someone else chose; tap what it comes to.

Reading a pile is not the money skill — **making an amount is.** Price on the tag; tap coins onto
the counter; commit with "Pay". The pile always holds more coins than needed and nothing says
"that's enough" until they commit — HomeTime's rule, and the reason the current form is the
weaker one.

- Keep read-the-pile as the L1 rung, pay-it at L2/L3.
- Template: HomeTime almost exactly (tap to add, tap to take back, commit, spares remain).
- **Cost: medium.**

### 8 · TickTock — `time` → **SET IT**
Today: an exact code-drawn clock with sweeping hands; tap "3 o'clock" from four pills.

Four labels is winnable by elimination. Milo says when something happens; the child taps the
hands round to it. Reading and setting are the same skill from both ends, and setting cannot be
eliminated into.

- ⚠️ **The clock must not print the time in digits while they set it** — that is the teen month
  dial: a readout that confirms the answer before commit turns it into hot/cold. Grade with a
  tolerance band per hand.
- Keep read-the-clock as the other question type; both directions is genuinely better pedagogy
  than either alone.
- Template: the teen `CircleTap` (step round a circle and stop) is the closest instrument.
- **Cost: medium.**

### 9 · SeesawPark — `compareNumbers` → **hold the beam LEVEL until commit** ✅ DONE
`tilt` is now `picked !== null`, so the beam tips only once the child commits, and the pre-commit
`glow` goes with it. Verified by measurement, not by the screen moving: pan bottoms Δ0px and beam
`rotate(0deg)` while the question is open (2 vs 3 — the answer nowhere on screen), then
`rotate(7deg)` toward the heavier side on commit.

**A level beam needed a BEAM ARREST to read as deliberate.** A scale showing 6 against 3 dead level
just looks faulty, and that exact "reads as broken" risk is what deferred the measurement chapter's
weight world. Two props now hold the beam and drop away on commit (verified 2 → 0) — physically what
a real balance does, so the held state is legible instead of alarming. **This is the pattern to reuse
if weight ever becomes a MeasureIt world.**

Also landed here: `RotateGate` + landscape-only for the band, with the early return below every hook.
Verified at 390×844 (gate shows) and recovering cleanly back to 1024×620 (no error boundary).

**AND THE ANIMALS ARE ALIVE.** New shared `SheetSprite` in
[critters.tsx](../src/features/chapters/story/critters.tsx) — an in-flow living sprite for the many
6–8 chapters that lay creatures out in a grid rather than at screen coordinates (`Critter` is
`position: fixed` and cannot serve them). The pan occupants **walk on with the drawn cycle playing,
then pause and breathe**: they are being weighed, so a looping walk cycle would be skating on the
spot. Walk-in duration comes from each creature's own gait via `groundSpeed` (turtle: 533ms), so one
cycle still carries one stride.

**The cast was re-picked so every animal has a sheet** — a pan of stills beside a pan of living
creatures reads as broken art, not as a choice. cat / fox / bear are gone (no drawn cycle); each
world's replacements were chosen to BELONG in it rather than merely to be available:
playground **rabbit · duck · ladybug**, forest **squirrel · butterfly · ant**, pond
**frog · fish · turtle**. Verified live: 9 live sprites per round, `everAStill: []` across five
forest rounds, and a static check that all 9 items resolve to a registered sheet.

⚠️ **The bug this turned up is the one worth carrying:** the walk-in played on round 1 and was DEAD
for rounds 2–10, because React reuses those sprite elements across rounds so `arrived` survived. It
looks perfectly fine the one time anybody checks. `SheetSprite` now takes a **required-in-practice
`resetKey`**; the general rule ("verify an animation on the SECOND round, never the first") is in
[chapter-craft.md](chapter-craft.md).

### 10 & 11 · BlockYard — `additionTo100` / `subtractionTo100` → **REGROUP IT**
Today: base-ten blocks are drawn, tap the sum.

Carrying **is** the skill of two-digit arithmetic, and tapping a chip skips it entirely. This is
the pair where the current gesture costs the most. Combine the two piles; when the ones column
reaches ten, bundle it into a rod. Subtraction breaks a rod back into ten ones to take from. The
answer is read off the result they built.

- **Shares its engine with #2.** Build bundling once, spend it in three chapters.
- Keep the base-ten model — you cannot lay out 87 apples, and this is the standard,
  always-correct manipulative.
- **Cost: high, shared.**

### 12 · ShapeStudio — `shapes2d3d` → **BUILD IT**
Today: tap the triangle among shapes / tap the side count.

3–5 already owns **FIT** (Shape House), and a 6–8 chapter may not repeat it — same
no-repeat-within-a-band rule that governs backdrops and worlds. What 6–8 adds is *sides* and
*solids*, so the question should be a **property**, not a name: Milo needs "the one with five
sides" for the build, and choosing it means counting sides. A solid is tested by **what it does** —
a cylinder rolls, a cube stacks, a cone won't — not by whether the child recalls its name.

- Keep 2D as exact SVG, solids as the existing generated sprites.
- Template: Shape House's socket-flight, but the chapter must not *look* like it.
- **Cost: medium.**

---

## Build order — cheapest real gain first

**A · small diffs, no new engine**
1. ~~**SeesawPark's pre-commit tilt** (#9)~~ ✅ **DONE** — see #9 above. `tsc` · 142/142 vitest ·
   0 console errors in a fresh tab. Not committed.
2. ~~**StoryTime + MarketDay arrivals/departures** onto `critters` (#4, #5-cheap)~~ ✅ **DONE** —
   see #4, #4a and #5 above. `tsc` · 142/142 vitest · `next build` · 0 console errors in a fresh
   tab · driven at 1024×620 and 640×320 in every world. Not committed.
   **It also cleared three collisions that were already in production**, all the same class — a
   percentage of the height guessing at a gap it should have measured: StoryTime's answer box 29px
   inside the button row, MarketDay's equation box 33px inside it, and BOTH chapters drawing a
   second prompt pill on top of `SkillBeat`'s. The rules are in
   [chapter-craft.md](chapter-craft.md).
3. **HopAlong: Milo actually hops** (#3), FollowTheLeader engine.

**B · one engine, three chapters**
4. The **bundling / regrouping** surface → placeValue (#2), additionTo100 + subtractionTo100
   (#10/#11).

**C · bespoke verbs, one at a time**
5. CoinShop (#7, HomeTime template) → TickTock (#8) → SliceShop (#6) → NumberTown (#1) →
   ShapeStudio (#12).

**Band-wide, do in whichever chapter you touch first and then repeat:**
- ⚠️ **DELETE THE WORLD PICKER — all of a chapter's settings belong in ONE run.** A picker asks a
  child to choose before they know what they are choosing, and then spends the whole chapter in one
  backdrop; merging them means the place changes every round, so consecutive questions differ in
  scene as well as in number. Founder call, and the same one chapter 2 took when its three biomes
  were merged. **Done in SeesawPark · StoryTime · MarketDay**; the shape to copy is a flat `PLAN` of
  item+setting pairs, interleaved so consecutive rounds change setting, with the SETTING carried on
  the round (`data.w`) rather than held in component state. Everything that used to be per-world —
  the backdrop, Milo's sprite, the group noun, the friend's name — then follows the round.
  `WorldSelect` itself stays: nine other chapters still use it until they are rebuilt.
- mount `RotateGate` (early return **below every hook**), and delete the `short` path it replaces
- move teaching **out of the modal white card and into the world**
- give the chapter a **cumulative arc outside `SkillBeat`**, driven by `onRound` — anything drawn
  inside a round resets every round
- **delete the emoji 404-fallbacks that render in the painted world** (`cfg.item`, Milo's
  🦊+accessory); emoji belong in the UI layer only
- put the fix in [`critters.tsx`](../src/features/chapters/story/critters.tsx), not in the
  chapter, or the next chapter copies the bug back in

## Verifying any of this

Per the craft doc, and specifically:
- a sweep must **import the same layout function the scene renders from**, not re-implement it
- **mutation-test the gate**, and tell an inert mutation from a missed regression
- assert on `getBoundingClientRect()` — real travel distance, real gaps. "The screen moved" is not
  evidence, and **a wrong answer advances too**
- front the tab before measuring: an entrance animation is a lie for its first few hundred ms, and
  a backgrounded tab freezes it there
- gates: `tsc` · `npm test` · `next build`, then bump `public/sw.js` VERSION

## Not decided

- Whether **9–11** wants the same treatment. It is on the pre-teen Mission-HUD design language,
  which is a deliberate and different look — the §0a verb question still applies to it, but the
  animation criteria here mostly do not.
- Whether the three chapters in **B** should literally share a component (like BlockYard already
  serves two skills) or just an engine module.
