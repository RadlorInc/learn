# The 9–11 band, answered with the hands — and explained with the child's own week

> **The asks, in the founder's words:** *"unn chapters ko explain karna hai daily real world example
> ke help se… yeh band mein AR with webcam interaction rahega"* → **"tap fallback rehna chahiye"** →
> **"AR limit mat karo sirf counting ke liye"** → then the twelve anchors picked one by one (§3).
>
> So every one of the twelve gets (a) an explanation anchored on something a nine-year-old has done
> themselves, (b) a gesture that IS the skill rather than a hand-shaped mouse, and (c) a pointer path
> that answers the identical question. The teen bands' explanation SHAPE is kept.
>
> Read [chapter-craft.md §0a and §5](chapter-craft.md) before building any of this — it decides *how*,
> and already carries the AR rules FactorLab paid for. The verbs are fixed by
> [story-9-11-rethink.md](story-9-11-rethink.md) and are not reopened here.

---

> ## ⚠️ AMENDMENT — 2026-08-13 · TIMES TABLES AND DIVISION ARE DELETED
>
> Both chapters (`FitOut` / The Fitting Crew, and `SupplyRun` / The Supply Run) were **removed at
> the founder's call**, pending a rethink of *what the child is actually learning*. Everything below
> that describes them as built — §5's "A2 DONE", the Lego anchor, the sweep as A6's gesture — is a
> record of what existed, not of what ships today. It is left rather than rewritten because the
> reasoning is still worth having when they are rebuilt.
>
> **The question that killed them, in the founder's words: *"baccha isme sikh kya raha hai… sirf haath
> hila raha hai."*** Traced honestly on The Supply Run, he is right: the child is TOLD 22 and 4, and
> still never has to divide. The only decision in the round is *"is there still enough in the crate to
> go round again"* — which is answered by LOOKING, not by arithmetic — and the app counts the sweeps
> while the answer is read off the receivers. That is the Empty Plot fault (*the PLOT decided when it
> was full*) with a crate instead of a floor. The modelling was real; the child's own BOOKKEEPING was
> missing, and no gesture fixes that.
>
> **The shape a rebuild should start from** — the one that worked for The Empty Plot: *state what you
> cannot see, then let the physical act CHECK it.* Three options were put to the founder and none is
> yet picked: **(a)** tier-linked — deal freely at L1, predict-then-deal at L2/L3 (cheapest, and the
> hollowness only bites where the numbers are big); **(b)** predict-then-check every round, FitOut's
> shape; **(c)** change the QUESTION to one that needs the quotient — *"how many will be left over?"*
> — so the dealing becomes its check and the gesture stays the answer.
>
> ⚠️ **THE SKILLS SURVIVE AND THE SKILL GRAPH SAYS SO.** `i.multFacts`, `i.multMultiDigit` and
> `i.division` are still probed; only their `chapter` is now `''`. They could not be removed:
> `learner_progress.chapter` and `sessions.chapter` are FK'd to `chapters(id)`, so the DB rows must
> stay, and `i.multFacts` is one of the most load-bearing nodes in the whole 3–18 graph. **The cost,
> stated:** `diagnose()` skips a chapter-less skill, so a child whose ROOT gap is multiplication facts
> now gets a plan starting at its 6–8 prerequisites and never at the gap itself. That is the right
> failure while no chapter exists, and it is a real hole until one does.
>
> Also parked by this: `infra/ar/sweep.ts` and its 37-test gate now have **no chapter consumer**
> (`LevelRun` imports only `SWEEP_MAX_Y`). Kept deliberately — `SWEEP_ARM`, the band-width ergonomics,
> the posture gate and the seen-crossing teleport guard are all measured constants that would have to
> be re-derived.

---

## 0 · The decisions this plan is built on

1. **Tap fallback is REQUIRED, band-wide.** This reverses FactorLab's camera-only call. It is the
   single most consequential decision here — see §1, where it stops being a cost and becomes the
   architecture.
2. **AR is not just finger-counting.** The full vocabulary is §2, and a gesture only ships where it
   *is* the maths.
3. **The twelve daily anchors are chosen and locked** — §3. The filter that produced them:
   ⚠️ **has the child done this THEMSELVES, or only watched an adult do it?** A grocery bill, a
   budget, a recipe and a warehouse are all watched, not lived. That is the same correction the 17–18
   band already took (*"can be more daily life examples"*), applied to a band that predates it.
4. ⚠️ **The examples are US-relatable and priced in dollars.** The repo records the users as American
   and carries a completed US-English sweep (colour→color, sweets→candy, maths→math). An earlier draft
   of this document used ₹ and "toffee"; both were wrong.

### The finding all of this has to survive

Counting raised fingers gives 0..10. Audited against what the twelve generators actually produce:

| chapter | its answer today | 0..10? |
|---|---|---|
| FactorLab | rows / a fist | ✅ swept as an invariant |
| SupplyRun | `⌊total / stepCost⌋`, 2..8 | ✅ |
| OrderDesk | a digit per place, 0..5 | ✅ |
| LoadingBay | a stack count / a difference | ✅ |
| FitOut `fit` | the missing factor, ≤ 6 | ✅ |
| **FitOut `order` / `split`** | `rows × per`, **up to 95** | ❌ |
| **RailLine** | a rounded value, **10..100+** | ❌ |
| **DecimalGrid** | a decimal, e.g. `0.55` | ❌ |
| **FractionForge** | a fraction, e.g. `3/4` | ❌ |
| **UnitConverter** | e.g. `3000` mL | ❌ |
| **MissionBrief** | a word-problem total | ❌ |
| **AngleShop** | degrees, or one of three kinds | ❌ — wants a different reading entirely |
| **FloorPlot** | a **place** in a 3D world | ❌ — see §7 |

**Half the band cannot be answered by counting fingers**, which is exactly why decision 2 matters: the
answer was never "count harder", it was "the hand can do more than count".

---

## 1 · The architecture the tap fallback buys us

The instinct is that a fallback doubles the work. It does the opposite, because **7 of the 12
chapters were built tap-first and already own a working pointer instrument.**

> **ONE instrument. TWO input sources. ONE `value`, ONE `onCommit`.**
>
> The AR layer does not answer the question — it *sets the same value the finger already sets*. A
> tilt writes the same `deg` the drag dial writes. A raised hand writes the same number the pad
> writes. Below that line, nothing knows or cares which one moved it.

Four things fall out, and they are why this is the right shape rather than a concession:

- **No duplicated game logic**, so no chance of the two paths grading differently — the class of bug
  that stays invisible until a child hits it.
- **The gate already drives `value` directly**, so every existing sweep keeps working unchanged and
  covers both inputs at once.
- **MediaPipe's ~6 MB of wasm + model loads only when the child opts into the camera.** The app stays
  local-first for everyone who does not, which was an open item and is now closed by construction.
- **The camera stops being a wall.** No device, no permission, a dark room, a parent who says no — the
  chapter is still fully playable, and the legal surface shrinks from *mandatory* to *offered*.

**A camera toggle sits in the chapter chrome**, remembered per device. Ask once on the first chapter,
never nag again.

⚠️ **Both paths obey the same commit rule.** Hold still ~1.2 s (AR) or press commit (pointer), once
per scored round, and the live readout says only WHAT WAS READ — never whether it is right. **This
matters more for the richer gestures than it did for counting**: a hand dragging a marker along a
number line is a continuous input, and a surface that reacts to it is a yes/no oracle at 60 fps. Drag
freely; say nothing until commit.

---

## 2 · What the hand can actually do

MediaPipe gives 21 landmarks per hand, two hands, ~30 fps. Everything below is derived from that —
nothing here needs a model we do not already load.

| | reading | what it answers | pointer equivalent | status |
|---|---|---|---|---|
| **A** | **count** 0..10 + hand presence | a small whole number | tap pad / chips | **shipped** |
| **A2** | ⚠️ **CORRECTED — see below.** two places entered ONE AT A TIME, both hands per digit | **0–99** | two-window pad | ✅ shipped |
| **B** | **point** — index tip over a target | one of ≤ 4 choices | tap it | hook change |
| **C** | **pinch span** — thumb-tip ↔ index-tip | a size / a length | drag handle | hook change |
| **D** | **tilt** — wrist → knuckle angle | **an angle, directly** | drag dial | hook change |
| **E** | **pinch-to-grab** — tips together = hold, apart = drop | **drag and place** | drag | hook change |
| **F** | **hand position** — x or y over a scale | a value on a line / a bar | slider | hook change |
| **G** | **two-hand span** — gap between the hands | **a length shown with the arms** | drag ruler | ⚠️ see §7 |
| **H** | **sweep** — hand travels across | **one round of dealing** | a "Deal" button | ✅ shipped |
| **I** | **mirror** — both hands mirrored about a line | **symmetry** | tap the axis | hook change |
| **J** | **trace** — index tip draws a path | round the outside vs across the inside | drag path | hook change |

⚠️ **A2 AS FIRST WRITTEN IS ARITHMETICALLY IMPOSSIBLE, AND THIS IS THE CORRECTION.** "Leftmost hand =
tens, rightmost = ones → 0–99" reads as obviously right; **a hand has five fingers**, so one hand per
place tops out at **55**. Swept against every answer The Fitting Crew's generator can draw: it reaches
**26 of 55**, only **39%** of `split` — which is that chapter's entire payload — and it cannot state a
plain **6**. A round whose answer the surface cannot express is unanswerable, which is worse than a
wrong one. **The two places are the two WINDOWS, not the two hands:** both hands make one digit
(0..9, i.e. reading **A**), and the child enters the tens and then the ones. 100% of answers
reachable, no generator change, no new primitive — and it is the better teaching, because *show me
the tens, now show me the ones* is place value performed in the chapter whose payload is splitting
12 into 10 and 2. Everything below that assumed a 0–99 simultaneous read should be re-checked the
same way: **sweep the generator's real answers against the surface before building it.**

⚠️ **A–J are ONE change to ONE hook.** `useFingerCounter` already computes the landmarks every frame
and throws all but the count away. Widen its callback to
`onRead({ count, hands, perHand: [{count, x}], tips, pinch, tilt, span })` and every reading above is
available. **That is the only new machinery in this entire plan.**

⚠️ **A gesture ships only where it IS the skill.** chapter-craft §5: *a pinch used as a cursor is a
mouse with extra steps and a permission prompt.* Every entry in §3 states what the gesture measures;
if that reads "it selects the answer", it does not ship.

---

## 3 · The twelve — anchors LOCKED

Each entry: the daily anchor the **explanation** lives in, the worked example THE PLAN is built on,
the AR gesture, and the pointer that answers the same question.

### 1 · `bigNumbers` — LOAD THE ORDER · ✅ built (The Order Desk)

- **Anchor: the school fundraiser total.** A number the whole school watches climb, that the child
  helped make, and that is genuinely four digits.
- **THE PLAN:** *"The fundraiser board says $3,482. That's 3 thousands, 4 hundreds, 8 tens and 2 ones
  — the place a digit sits in is what it is worth."*
- **Worked example:** `$3,482` → how many hundreds? → `4`.
- ⚠️ **Why this anchor is better than it looks:** dollar denominations ARE base ten. A $1,000 pledge,
  a $100 pledge, a $10, a $1 — the bays stop being pallets and become the money that made the total,
  so the manipulative is the thing itself rather than a stand-in for it.
- **AR:** hold up the digit for the named place (**A**) · **pinch-grab a pledge into its bay (E)**,
  which is the chapter's own verb, LOAD THE ORDER, done with the hand instead of watched.
- **Pointer:** the existing bay taps + supply buttons. Unchanged.

### 2 · `rounding` — ESTIMATE THE RUN · ✅ built (**The Long Level** — was The Rail Line)

> ⚠️ **AMENDED 2026-08-12, founder's call: the WORLD is now a game level, not a rail line.** The
> anchor below (a scoreboard) was a BRIDGE from something daily to a world nobody in this band has
> been in; making the world itself the daily thing removes the need for the bridge, so the briefing
> is now one paragraph and names no scoreboard. The physics survives intact — you can only warp to a
> CHECKPOINT, so "the nearest 10" is still the nearest place you can actually land.
> ⚠️ **It is warping, NOT respawning.** "You go back to the nearest checkpoint" is false — you go
> back to the LAST one, which is rounding DOWN, and a world whose own rule contradicts the skill is
> worse than a dull one. See chapter-craft.md §0a.
> The line below about the six stations becoming scoreboard marks is therefore **NOT taken** and is
> superseded: they are checkpoints in a level, and the rounds name what is on screen.

- **Anchor (superseded, kept as the record): points needed to catch up.** A scoreboard is the one
  place a child estimates out loud and at speed, and gets no credit for being exact.
- **THE PLAN:** *"You're 47 points behind. Nobody works out 47 in their head mid-game — you think
  'about 50' and you know what you need."*
- **Worked example:** 47 behind → nearest ten → `50`.
- **AR:** ⚠️ **slide your hand along the line (F on x) to put the marker where 47 sits, then commit at
  the nearer mark.** Rounding *is* "which end is it nearer", so a hand travelling the line is the
  maths, not a cursor. Simpler at L1: how many whole tens (**A**).
- **Pointer:** the six existing boards. Unchanged.
- ⚠️ **The six stations become scoreboard marks** (10, 20, 30…), which the rail line already draws as
  a straight painted track. Copy change only.

### 3 · `timesTables` — LAY IT OUT · ✅ built (The Fitting Crew)

- **Anchor: a Lego brick's studs.** A 2×4 brick is an array a child has held. They already know
  "two by four" is a name for a shape *and* a number.
- **THE PLAN:** *"A 2×4 brick has 8 studs. You don't count studs one at a time — two rows of four."*
- **Worked example:** 2×4 = 8 · then 4×6 = 24 · missing factor: *"how many rows of 5 make 35?"* → `7`.
- **AR:** ⚠️ **two hands BUILD the brick — left hand sets the rows, right hand sets the studs per row,
  and it fills as you hold.** The child composes `4 × 6` with their body before any answer exists.
  Products answer with **A2**.
- **Pointer:** the existing rails + number pad. Unchanged.
- ⚠️ **Constraint, see §7.2:** `split` draws `rows 2–5 × per 11–19`, and there is no 5×19 brick.

### 4 · `division` — DEAL IT OUT · ✅ built (The Supply Run)

- **Anchor: sharing a bag of candy with friends** — and who ends up short.
- **THE PLAN:** *"22 pieces, 4 friends. One each, again, again — you stop when you can't go round, and
  what's left in your hand is the remainder."*
- **Worked example:** 22 ÷ 4 = 5 each, 2 left over.
- **AR:** ✅ **SHIPPED — sweep your hand across to deal one round to everybody (H); the number of
  sweeps IS the answer.** Division as repeated subtraction, performed. A sweep the bag cannot cover
  still fires and visibly leaves somebody short, exactly as the button does today.
- **Pointer:** the existing **Deal** button + ↩ Take it back. ⚠️ **NOT replaced on the camera path —
  the lane IS that button.** Replacing it makes a round unsubmittable the moment a working camera
  fails to read a child's gesture (commit and undo are both disabled at zero, `SkillBeat` has no
  round timeout, and `CamGate` only shows when the camera did not START). See chapter-craft §5.
- ⚠️ **Corrections this build made to the rows above:** a per-frame jump reject cannot separate a
  re-acquired hand from a fast one and was replaced by "was it seen crossing"; band width rejects
  NOISE only, so a posture gate is what stops a reach across the desk; and the band is 0.20 rather
  than 0.30 on ERGONOMICS — `answer ∈ 2..7` over ten rounds is up to ~140 arm traversals a run.
- ✅ Answers are already 2..8 with `stepCost × answer ≤ 24` — a bag of candy is the right size by
  construction, no reframe needed.

### 5 · `factorsMultiples` — ARRANGE IT · ✅ **built, with AR**

- **Anchor: arranging desks in equal rows.** Every child has been moved into rows for an exam or an
  assembly, and has watched the last few desks not fit.
- **THE PLAN:** *"36 desks. 6 rows of 6, or 4 rows of 9 — they all work. 37 won't go into equal rows
  at all, however you push them."*
- **Worked example:** 12 desks → 2, 3, 4 or 6 rows · 13 desks → a fist, nothing fits.
- **AR:** fingers = rows · **a fist = nothing fits, so it is prime.** Shipped.
- **Pointer:** ⚠️ **does not exist — this chapter shipped camera-only and the fallback decision makes
  that a live defect.** A row-count pad plus a "nothing fits" chip. Item #1 in the build order.
- ⚠️ **Constraint, see §7.3:** `n` reaches 100, which is a hall rather than a classroom.

### 6 · `fractionsCompare` — MATCH IT · ❌ neon

- **Anchor: a pizza shared with friends** — the one fraction context every child in this band has
  actually argued about.
- **THE PLAN:** *"One pizza, 3 friends — bigger slices. One pizza, 4 friends — smaller. The more
  people share it, the smaller each piece gets."*
- **Worked example:** is 1/3 more than 1/4? · 3/8 + 2/8 = 5/8.
- **AR:** ⚠️ **CHOP the pizza — hold your hand flat and place cuts, which have to come out EQUAL.**
  Equal parts is the entire definition of a fraction, and a child placing uneven cuts sees the
  fraction fail rather than being told it did. Then **pinch (C) to show how big one slice is** for
  comparison. Numerators answer with **A**.
- **Pointer:** tap to place cuts · a drag handle for the slice size.
- ⚠️ Per chapter-craft: the pizza is a **real sprite clipped by the exact wedge** — arithmetic
  division AND real food, not a choice. Flat SVG wedges are the pie chart this chapter is escaping.

### 7 · `decimals` — DIAL IT IN · ❌ neon

- **Anchor: money — $12.50 vs $12.05.** Their own money, at a register, where being wrong costs them.
- **THE PLAN:** *"$12.50 and $12.05 aren't the same money. The first place after the point is worth
  ten times the one after it."*
- **Worked example:** $12.50 vs $12.05 · which is more, $0.6 or $0.55?
- ⚠️ **Why this anchor is better than it looks: 100 cents ARE the hundredths grid.** The chapter's
  10×10 grid stops being a diagram of a decimal and becomes a dollar, so tenths are dimes and
  hundredths are pennies. The manipulative and the anchor are the same object.
- **AR:** ⚠️ **A2 reads the two places directly** — left hand tenths (dimes), right hand hundredths
  (pennies) — so `0.55` is five and five while `0.6` is six and a closed fist. **The misconception
  `0.6 < 0.55` dies in the hands.** Placing a value on a 0–1 line uses **F**; shading the grid uses **E**.
- **Pointer:** the existing two-window pad + the grid. Unchanged.

### 8 · `measurementUnits` — DOES IT FIT? · ❌ neon

- **Anchor: height marked on the doorframe.** The one measurement a child checks on themselves,
  repeatedly, and cares about.
- **THE PLAN:** *"The pencil mark says you're 4 foot 6. That's 54 inches — same height, different ruler."*
- **Worked example:** 4 ft 6 in → 54 in · how many cups fill your water bottle → `4`.
- **AR:** ⚠️ **hold your hands apart to SHOW a length (G)** — "show me a foot", "show me 6 inches" —
  against a reference on screen. It is how a child estimates length in life. Unit choice is a
  **point (B)**; "how many small fill the big" is **A**.
- **Pointer:** a drag ruler + tap chips. **This is also G's fallback if the calibration does not
  survive a real child** (§7.2).
- ⚠️ **Constraint, see §7.1: the chapter is METRIC in code and the doorframe is feet and inches.**
  This one needs a decision before any copy is written.

### 9 · `areaPerimeter` — FLOOR IT / FENCE IT · ✅ built (3D) · ⚠️ see §7.4

- **Anchor: your own bedroom floor.** The child knows its size by walking it, and has seen it
  carpeted or tiled.
- **THE PLAN:** *"Carpet covers the INSIDE of your room. The baseboard goes ROUND the outside. Same
  room, two different sums — and you buy two different things."*
- **Worked example:** a 4 × 3 room → 12 carpet tiles · 14 feet of baseboard.
- **AR:** ⚠️ **the two readings become two physically different gestures — TRACE round the outside (J)
  for perimeter, SWEEP across the inside (H) for area.** That is the distinction the chapter exists to
  teach, made with the body, and it opens a way past the 3D conflict — §7.4 option (d).
- **Pointer:** the existing walk + peg. Unchanged.

### 10 · `anglesSymmetry` — SET THE ANGLE / FOLD IT · ✅ built (The Angle Shop)

- **Anchor: how steep the ramp or the slide is.** A child judges steepness with their body before
  they can name it, and has been wrong about it at speed.
- **THE PLAN:** *"Too steep and you can't push your bike up it. Too shallow and you don't get any
  speed. A square corner is 90° — sharper is acute, wider is obtuse."*
- **Worked example:** set the ramp to 60° · is the slide acute, right or obtuse?
- **AR:** ⚠️ **TILT YOUR HAND — your forearm IS the ramp (D).** The strongest gesture in the band: the
  answer is not described, it is *held*. Symmetry: **both hands mirrored about the fold (I)**, and
  **trace the fold line (J)**.
- **Pointer:** the existing drag dial + tap axes. Unchanged.
- ✅ The shop already builds ramps (its bridge site's "approach ramp"), so this is close to a copy pass.

### 11 · `dataGraphs` — RUN THE TALLY · ✅ built (The Loading Bay)

- **Anchor: goals each friend scored.** Named friends, a real season, and an argument the child
  already wants to settle.
- **THE PLAN:** *"Sam 8, Alex 5, Jordan 6, Riley 3. You can SEE who scored most without counting —
  but 'how many more than Alex' needs the subtraction."*
- **Worked example:** Sam 8, Alex 5 → how many more? → `3`.
- **AR:** value or difference with **A** · point at the tallest with **B** · and in the explore beat,
  **raise your hand to set each bar (F)** so the child builds the chart from the season before reading
  one.
- **Pointer:** the existing stack taps. Unchanged.
- ✅ The cargo stacks already ARE a pictograph — four named friends replace four goods, copy only.

### 12 · `wordProblems` — ACT IT OUT · ❌ neon

- **Anchor: deliberately DIFFERENT every round** (founder's call, and it is right — the point of a
  word problem is that maths turns up anywhere, so one fixed world would teach the opposite).
- ⚠️ **The rotation must not collide with the other eleven.** chapter-craft forbids repeating a
  storytelling inside an age band, and this chapter is the one at risk of eating everybody's world.
  **Off-limits:** fundraiser · scoreboard · Lego · candy · desks · pizza · money · doorframe ·
  bedroom · ramp · goals.
  **The pool, ten clear of those:** field trip vans · birthday party · bake sale · library reading log ·
  feeding a pet · a camping trip · a sleepover · planting a garden · a class store · a game tournament.
- **THE PLAN:** *"26 of us, 5 per van. Six vans, and the last one isn't full — that's why nobody gets
  left behind."*
- **Worked example:** 26 children, 5 per van → 6 vans.
- **AR:** ⚠️ **the gesture IS the operation, which is the actual skill in a word problem** — hold up
  to collect (+), sweep away to give (−), two hands to build groups (×), sweep to deal (÷). Choosing
  the right gesture *is* choosing the operation. Totals answer with **A2**.
- **Pointer:** tap the operation + the pad.

---

## 4 · The explanation structure — what "same as 12–18" means here

The teen shape, kept verbatim:

```
start card → THE PLAN (read-along chalkboard, one line + short bullets)
           → walkthrough (animated scene + 9–14 BABY steps, each writing one board line as spoken)
           → guided (unscored, coached)
           → practice (adaptive L1/L2/L3 · reteach after 3 wrong · mastery early-exit · coverage)
           → mastery state
```

Plus the **3-zone question board** the 12–14 band paid for and the AR FactorLab already uses:

| zone | rule |
|---|---|
| **context** | what the numbers ARE + the rule that applies · plain language · **no UI verbs** |
| **the math** | the hero — the manipulative itself, not text |
| **instruction** | ONE verb-led action, in its own chip |

⚠️ **The instruction chip is now input-dependent** — *"hold up how many rows"* vs *"tap how many
rows"* — and it is the one place the two paths legitimately differ. Everything else about the
question is identical, and the gate must assert that two round types sharing a prompt also share a
byte-identical chip *per input mode*.

**The walkthrough teaches the gesture, and it teaches BOTH.** The teen kit's `HandCue` — the 👆 that
acts out a gesture — becomes a drawn hand performing the AR reading when the camera is on, and the
existing pointer cue when it is off. Same component, one branch.

⚠️ **Recommendation: do NOT move these chapters onto `GameShell`.** Seven of the twelve are painted
working worlds with journeys and drawn cycles; `GameShell` would flatten them into the teen chalkboard
layout, and it hardcodes `BAND='12-14'` internally. `SkillBeat` already gives the adaptive loop,
reteach, mastery and coverage. **Take the teen EXPLANATION pieces into the story chapters** — same
structure for the child, a fraction of the work, nothing lost.

⚠️ **A good question is TALLER than a bad one.** Measured on FactorLab: a three-zone card is **265px**
against the 36px one-liner it replaced, and it landed on the instrument. Reserve from the card's
**measured** bottom (`useLayoutEffect`, never a `ResizeObserver` — frozen in a backgrounded tab), and
remember the bottom is **two stacks**: the readout and the self-view.

---

## 5 · The world question — anchor the EXPLANATION, keep the world

Four of the built chapters are painted **workplaces** — a depot, a rail line, a fitting crew, a supply
run — and against the "has the child done this" filter those are the weakest worlds in the band.

**The decision is to change the EXPLANATION, not the world.** THE PLAN, the walkthrough's worked
example and each question's `context` line anchor on the twelve above; the painted world stays. A
child who hears *"this is like your 2×4 brick"* relates immediately, and does not care that the
background is a workshop. Re-theming four shipped, working chapters would reopen all of them for a
gain the copy already delivers.

This is the same fix the 17–18 band took for the same complaint.

---

## 6 · What actually has to be built

| # | thing | size |
|---|---|---|
| 1 | ✅ **DONE — FactorLab's tap path.** See §8 | shipped |
| 2 | ✅ **DONE — `useFingerCounter` reports one `onRead({count, hands, tilt, sweeps, sweepArm, sweepArmed})`.** ⚠️ Only the readings with a CONSUMER were built: `count` (A) and `tilt` (D). The callback is an object, so `perHand`/`tips`/`pinch`/`span` are each a field and a few lines when their chapter arrives — building them blind would be six unused readings and a `reads` change test nobody could tune. | shipped |
| 3 | ✅ **DONE — `infra/ar/HandInput.tsx`**: the device pick, camera lifecycle, lazy MediaPipe, `useDwell`, `CamView`, `CamGate`, `DwellRing` and the dev drive hooks, skinned per band. FactorLab re-pointed at it; The Angle Shop is its second consumer. | shipped |
| 4 | **THE PLAN + baby-step walkthrough** in the story shell | one shared component, then per-chapter copy |
| 5 | Per chapter: the anchor's copy, the AR reading, the instruction chip per input mode | 12 × small |
| 6 | **4 full rebuilds** — FractionForge · DecimalGrid · UnitConverter · MissionBrief | 4 × large |

**Build order — cheapest real gain first:**

1. ✅ **#1 DONE.** FactorLab was live and camera-only; the fallback decision made that a defect and it is fixed.
2. **#2 + #3**, then re-point FactorLab at the shared input. Nothing new is claimed; the template
   becomes shared and the camera becomes optional.
3. **The four copy-only chapters** — Order Desk (fundraiser), Supply Run (candy), Loading Bay (goals),
   Rail Line (scoreboard). Fastest proof the band reads differently.
4. ✅ **DONE — The Angle Shop answers by tilt (D).** ⚠️ Not on every round, and the exception is
   principled rather than a shortcut: `job: 'degrees'` at tier 3 asks for exactly 85° with the
   set-square guide already retired and no readout permitted while turning, so a tilt held inside
   ±2.5° of an unmarked target is luck. Those keep the steppers. Fold rounds get the tilt for AIMING
   the bar (Mark/Fold stay taps) — the hand owns the continuous value, taps own the actions.
5. ⚠️ **A2 DONE — The Fitting Crew enters its answers by hand, one place at a time.** The two-place
   primitive's first real test is what found that the plan's own encoding could not reach half the
   chapter (§2). ✅ **The Lego anchor copy is WRITTEN (2026-08-12)** — the intro card leads with it and
   `ANCHOR` rides the FIRST demo beat only, gated 3/3 on mutations; §7.2 is decided (see below). Still
   owed: the **two-hand array build** for the explore beat.
6. **The four neon rebuilds**: Fractions → Decimals → Word Problems → Measurement.
7. **The Empty Plot**, last, once §7.4 is decided.

---

## 7 · Open — three constraints the anchors turned up, and one carried

These came out of checking each anchor against what its generator actually draws. All three need an
answer before that chapter's copy is written.

1. ⚠️ **Measurement is METRIC in code and the doorframe is FEET AND INCHES.** `UnitConverter`'s items
   are cm / m / km / g / kg / mL / L throughout, and a US child's height on a doorframe is 4 ft 6.
   **(a)** switch the chapter to US customary (feet · inches · pounds · cups · gallons), which matches
   the anchor and the audience but rewrites every item; **(b)** keep metric and anchor on the water
   bottle instead of the doorframe; **(c)** teach both, which is what US schools actually do and is
   also the most work. **Recommend (a)** — the audience is American and the anchor was chosen for
   being lived.
2. ✅ **DECIDED 2026-08-12 — there is no 5 × 19 Lego brick, so L3 says nothing about the anchor.**
   `FitOut`'s `split` draws `rows 2–5 × per 11–19`, i.e. arrays far bigger than any brick. Founder
   picked neither (a) a baseplate at L3 nor (b) narrowing `per` — both cost something for a rule
   chapter-craft already gives free: **the anchor lives in the explanation, as a simile, once.** So
   `ANCHOR` is passed to demo 1 (`order`, 3×4) alone; demo 2 (`split`) and every re-teach get
   `undefined` and name only what is drawn. The 2-digit × 1-digit rung is untouched, and no anchor
   line can ever be spliced into a generated beat. Gated + mutation-proven in
   `fitOutTimesTables.test.ts` (anchor on every demo · anchor on the re-teach · anchor past the
   86-char spoken-line budget — 3/3 caught).
3. ⚠️ **100 desks is a hall, not a classroom.** `FactorLab`'s range was deliberately raised to 100 in
   the AR session (every composite ≤ 100 has a factor ≤ 10, which is what made the ten-finger ceiling
   free). Say **"the hall"** at the top tier rather than narrowing the range — one word, and the range
   is load-bearing.
4. ⚠️ **The Empty Plot still needs your call.** First-person 3D where the answer is a *place*; hands
   cannot drive a walk. **(a)** the band's one AR-free chapter · **(b)** the walk goes, the gesture
   replaces the pacing · **(c)** AR answers only its arithmetic beats · **(d)** **keep the walk, and
   make the ANSWER a trace round the outside / a sweep across the inside (J/H)** — the two gestures
   are physically the distinction the chapter teaches. **Recommend (d), fall back to (a).**

Carried, unchanged:

5. ⚠️ **Two-hand span (G) may not survive a real child.** Hand separation in pixels scales with
   distance from the camera, so "show me a foot" needs a reference — the child's own hand width is the
   cheapest, an on-screen object the most reliable. The handoff already records this as the reason
   UnitConverter was *not* the first AR chapter. **Build it last, behind the drag ruler, and be
   willing to drop it.**
6. ⚠️ **The camera is a founder/legal item even as an option.** No privacy policy, ToS or COPPA
   content exists anywhere in the repo. Opt-in lowers the stakes; it does not remove them.
7. **Nobody has held a real hand up to any of it.** Every FactorLab drive fed synthetic readings — the
   whole detection layer is eyeball-only. **A2 and the continuous gestures multiply that dependence**,
   so the shared `<HandInput>` should go in front of a child before eleven chapters are built on it.

---

## 8 · Built so far — FactorLab's tap path

`tsc` 0 · **713/713** vitest (was 706, +7) · `next build` 0 · dev hook 0 hits in the emitted JS
(verified against a control string) · 0 console errors in a fresh tab · driven at 1280×720, 640×320
and 667×375, on **both** input paths.

**What it does.** The intro offers both doors every time and remembers the pick per device
(`infra/storage/handInput`, the `voicePref` pattern); the remembered pick decides which is the big
button, never which is the only one. `CamGate` stops being a dead end — it now leads with
**"Tap instead →"**, because at that point the child has already tried the camera and it failed.
The tap path never calls `start()`, so there is no permission prompt and no ~6 MB MediaPipe fetch.
`padChoices()` is derived from `MAX_FINGERS`, so the pad offers exactly what two hands can hold.

**5/5 planted regressions caught**, including the two that matter: a pad narrower than the hand
(rounds answerable by camera and not by tap), and a renderer that ignores its input.

⚠️ **Two faults the drive found that the gate could not**, both now general rules in
[chapter-craft.md §5](chapter-craft.md):
- **Every chip and spoken line still said "hold up that many fingers"** on the tap path. The wording
  was not wrong, it addressed the wrong child — so nothing failed. Zone 3 now renders from one
  input-aware function and the gate sweeps both modes with positive assertions in each direction.
- **Milo sat on the ✊ button at 640×320** — the prime answer, i.e. the one button a child must find.
  The tap still landed (he is `pointerEvents: none`), so no probe could see it; only crossing his box
  with the pad's did. Same measurement caught an eleven-button row wrapping and clearing the bench by
  luck rather than by reserve.

⚠️ **Still true:** nobody has held a real hand up to it, and the CAMERA path's grading was driven
through the dev hook rather than a real webcam — the pane blocks capture. The tap path, by contrast,
is now fully drivable end to end, which is a verification win the fallback bought for free.
