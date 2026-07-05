# 12–14 Playable-Game Pattern (the "Sale Day" template)

The Percentages chapter (`ShopRush.tsx`) is the reference build. Every other 12–14
chapter is the **same skeleton** with a different **world skin** and different
**physical mechanics**. This doc is the copy-me checklist.

Goal: a chapter should feel like a *game you'd choose to open*, not a slideshow or
a quiz. One continuous themed scene; the kid does the math with their hands; Milo
lives inside the scene; the adaptive engine runs underneath, unchanged.

---

## A. The fixed skeleton (identical in every chapter)

**Files per chapter**
1. `src/features/chapters/teen/games/<Game>.tsx` — the game (the real thing).
2. `src/features/chapters/game/<Chapter>Chapter.tsx` — thin portal wrapper:
   `data-band="12-14"`, renders the game, then `MasteryState` on done, calls
   `finishAndSync('<chapterId>', correct, wrong, 'practice', mastered)`.
3. `public/assets/teen/scene_<world>.png` — one nano_banana_2 backdrop (cozy,
   painted, warm indie-game look; empty area for the UI; NO text/numbers).

**Scene flow (one continuous screen — NO explanation slides)**
`start card → Milo demos order #1 in-scene → the kid plays N orders → done`.
- **start**: a themed "ticket/card" + one friendly line + a big Start button.
- **demo**: Milo narrates the first task while the instrument animates to the
  answer (this replaces the lesson slides — teaching happens by watching him do it).
- **play**: a task arrives on a themed ticket/card; the kid manipulates the
  instrument and commits with one deliberate button.

**Adaptive FOUNDATION — use `useAdaptive('<chapterId>')`, do NOT modify the engine**
- 3 tiers: L1 easy → L2 medium → L3 hard, **invisible** to the kid.
- `ada.record(ok)` each answer → promotes on a streak, **demotes on wrong**.
- **Re-explanation after 3 wrong IN A ROW** (`wrongRun >= 3`): Milo works the
  current task in-scene (glide the instrument to the answer + narrate `task.work`),
  then continue. No popup panel.
- **Mastery early-exit**: `res.mastered` (top tier + clean streak) → finish early,
  full stars.
- Difficulty picks the task pool: `makeTask(ada.difficulty)`.

**Grading loop (copy from ShopRush `submit()`)**
- One deliberate submit per order. `ok = |value − answer| < 1e-6`.
- Correct → themed "done" stamp + `ada.praise`, then next / mastery.
- Wrong → gently glide the instrument to the right answer (mint colour), say
  `It was <answer>. <ada.encouragement>`, count it; if `wrongRun >= 3` run the
  in-scene reteach, else next.
- **Math-without-fear**: no timer, no red X, no score shown.

**No coin economy.** No wallet, no coin rewards. Feedback = the stamp + progress
dots + the order counter. (Coins were explicitly removed.)

**Presentation kit (per chapter, themed palette)**
- Painted backdrop `<img>` + a top→bottom dark scrim for text readability.
- Header: `‹ Menu` · chapter game title · `order n / N`.
- Progress dots (N).
- Themed "ticket/card" that slides in per order (cream paper w/ a done-stamp slot).
- Milo bottom-left, always in the scene.
- A self-contained palette object `P = {...}` (its own colours, NOT the Field Lab
  paper theme). Reuse ShopRush's `P` as the starting palette and re-tint per world.

**The task model (copy this shape)**
```ts
type Mech = 'paint' | 'slide' | /* …chapter's mechanics… */
interface Task {
  mech: Mech
  title: string; badge: string; tone: 'a'|'b'   // ticket dressing
  prompt: string; say: string                    // shown + spoken
  answer: number
  hint: string                                   // (optional first-nudge copy)
  work: string[]                                 // narrated 3-in-a-row reteach
  // + mechanic-specific fields (targetPct, price/max/step, …)
}
function makeTask(d: 1|2|3): Task {
  const pool = d===1 ? [easyA, easyA, easyB]
             : d===2 ? [midA, midB, easyA]
             :         [hardA, hardB, hardC]
  return pick(pool)()
}
```

---

## B. What VARIES per chapter (the only things to design)

1. **World skin** — the real-world scenario + backdrop + palette + ticket name.
2. **Mechanics** — 1–3 *physical* interactions from the library below. NO MCQ.
3. **Task generators** — `makeTask` pools that produce that chapter's math as
   manipulations, with `prompt/say/answer/work` and difficulty ramp.
4. **Demo** — Milo's order #1 script + the instrument animation.
5. **Done copy** — `MasteryState` `conceptsConfirmed` + `nextPointer`.

---

## C. Interaction library (reusable physical mechanics — the action IS the math)

Variety rule: mechanics belong to GESTURE CLASSES. A chapter mixes 2–3 mechanics
from DIFFERENT classes, and neighbouring chapters shouldn't lead with the same
class — so every chapter feels like a different mini-game, not a re-skin.

**Class 1 · Drag-position** (move a thing to a value)
- **SlideDial** — drag a value along a track to a target. *(built)*
- **NumberLineDrag** — drag a marker on a −/+ number line.
- **ThermometerPull** — vertical drag above/below zero.
- **ElevatorRide** — drag a lift between floors incl. basement floors (negatives).
- **LadderBrace** — drag a ladder/brace endpoint until it spans the gap (Pythagoras).
- **StretchCorner** — drag a shape's corner to hit a target area/perimeter.

**Class 2 · Paint / fill by area**
- **PaintGrid** — shade an N/100 grid; live readback %=fraction=decimal. *(built)*
- **TileFloor** — drag unit tiles to cover a room (area), add layers (volume).

**Class 3 · Hold-to-pour** (duration = quantity)
- **PourJug** — hold to pour into a measuring cup with graduations; release to stop
  (fractions of a cup, halve/triple a recipe).
- **TwoTaps** — two faucets filling one tank in a ratio (mix 2:3, scale it up).

**Class 4 · Cut / split**
- **KnifeCut** — drag dividers to slice a bar/pizza into equal parts; tap slices to
  take some ("¾ of…", part-of-part multiplication).
- **ShareOut** — drag one divider to split a quantity into equal groups (division).

**Class 5 · Rotate / crank** (circular drag)
- **CrankGear** — each crank turn multiplies (×2, ×10): repeated multiplication,
  powers, place-value shifts. Crank BACKWARDS for roots/division.
- **DialLock** — rotate number dials to "crack the safe" (set x, evaluate; solve for x).

**Class 6 · Drag-drop / assemble**
- **BracketGrab** — drag physical ( ) brackets around terms in a live expression;
  the result recomputes as they land (order of operations — kinetic!).
- **StepChain** — drag operation tiles into the order you'd compute them.
- **FeedTheMachine** — drag a number card into a function machine's slot; it chews
  and outputs; kid sets the machine's rule dials (expressions, functions).

**Class 7 · Swipe-sort** (fast, arcade-feel)
- **ConveyorSort** — items ride a belt; swipe LEFT/RIGHT into bins (negative vs
  positive, rational vs irrational, solution vs not, > vs <). Self-paced belt,
  no timer — the next item waits.

**Class 8 · Balance**
- **PanBalance** — drag weights on/off two pans until the beam sits level
  (equations; inequality = deliberately tip it the right way).
- **TugTeams** — place the stronger side (comparing magnitudes / absolute value).

**Class 9 · Pull-and-launch** (vector drag)
- **Slingshot** — pull back, aim, release to land on a grid target (coordinate
  plane: launch the paper plane to (3, −2)).
- **JumpCharge** — drag to charge a jump's direction + length on a number line
  (signed addition as motion: −3 + 5 is a jump).

**Class 10 · Draw / trace**
- **DrawTheLine** — drag a straight line through two pins with a finger; graded by
  slope/intercept fit (linear relationships).
- **PlotPin** — tap the map to drop a pin at (x, y).

**Class 11 · Stack / build**
- **StackBuild** — tap/drag unit blocks into rows·columns·layers (arrays, volume,
  squares/cubes as literal shapes).

Grading is always the same: read the manipulated value(s), compare to `answer`.
Build each mechanic ONCE in `teen/games/parts/` and share.

---

## D. The 12 chapters — world + mechanics (fill-in for the fan-out)

Each chapter leads with a DIFFERENT gesture class (column "Lead") so no two
adjacent chapters feel alike.

| # | id | World skin | Lead | Mechanics | Sample tasks |
|---|----|-----------|------|-----------|--------------|
| 1 | `percentages` | **Night Market stall** ✅ DONE | Paint | PaintGrid, SlideDial | paint 25%; slide to sale price / saving / tip / markup / original |
| 2 | `integers` | **Weather Station** | Drag-position | ThermometerPull, ElevatorRide, TugTeams | pull to −3°; ride to basement −2; place the stronger cold snap; distance from 0 |
| 3 | `signedRationalOps` | **Frog Pond Expedition** | Pull-launch | JumpCharge, ConveyorSort | charge a −3+5 jump; sort results pos/neg on the belt; chained jumps for ×/÷ signs |
| 4 | `rationalOps` | **Milo's Kitchen** | Hold-to-pour | PourJug, KnifeCut | pour ¾ cup; cut the bar to take ½ of ¾; ShareOut ¾ ÷ ¼ |
| 5 | `ratioProportion` | **Juice Bar** | Two-tap pour | TwoTaps, SlideDial(scale) | mix mango:lime 2:3; scale the mix to 10 cups; unit-rate better-buy fill |
| 6 | `exponentsRoots` | **Gear Lab** (zoom micro→cosmic) | Rotate/crank | CrankGear, StackBuild | crank ×2 three times = 2³; crank back to √16; ×10 cranks → scientific notation |
| 7 | `orderOfOperations` | **Score Machine** (arcade) | Drag-drop | BracketGrab, StepChain | grab brackets to make 3+2×5 hit 25 vs 13; chain the steps in order |
| 8 | `algebraicExpressions` | **Function Factory** | Feed-machine | FeedTheMachine, DialLock | feed 4 into 2x+1; set the machine dials to match outputs; combine like-term parts |
| 9 | `equationsInequalities` | **Balance Bench** (market scales) | Balance | PanBalance, NumberLineDrag(ray) | load pans till 2x+3=11 levels; drag the x>2 ray |
| 10 | `coordinatePlane` | **Night-Flight Postal** (city map) | Pull-launch | Slingshot, PlotPin | launch the paper plane to (3,−2); pin the drop-zone; reflect a pin across an axis |
| 11 | `linearRelationships` | **Cable Car line** | Draw/trace | DrawTheLine, SlideDial(table) | draw the cable through two pylons; set the fare table; steeper = slope |
| 12 | `geometryMeasurement` | **Build Site** | Stretch + stack | StretchCorner, TileFloor, StackBuild, LadderBrace | stretch to area 15; tile the floor; stack the wall's volume; drag the 3-4-5 brace |

Gesture-class spread: paint → drag → launch → pour → two-pour → crank → drop →
feed → balance → launch(grid) → draw → stretch/stack. No two neighbours share a
lead class. Shared parts (`teen/games/parts/`): SlideDial, NumberLineDrag,
PaintGrid, StackBuild, ConveyorSort, PanBalance reused across chapters.

---

## E. Responsive rules (every screen size, not just a phone)

Verified finding (2026-07-05): at laptop size the portrait backdrop crops to just
the awning and the UI sits phone-sized in empty space. These rules prevent that:

1. **Two backdrop crops per world**: `scene_<world>.png` (9:16, phones/portrait)
   AND `scene_<world>_wide.png` (16:9, tablets-landscape/laptop/desktop). Swap by
   orientation/width (`<picture>` or a `min-aspect-ratio: 1/1` media query).
   ~1.5 credits extra per chapter — always generate both in one batch.
2. **Scale the game UP on big screens** (the FitBox lesson): never a fixed
   `maxWidth: 560` alone. Size the instrument + ticket + type with
   `clamp(min, vmin-based, max)` (or a container scale factor) so a laptop shows
   a BIGGER stall — not a phone UI centred in a void. Target: the instrument
   occupies ≥ 45–60% of viewport height at every size.
3. **Short landscape (phone rotated, ~812×375)**: height-aware sizing — the
   instrument shrinks by `vh`, the header/ticket compress, and the commit button
   keeps a reserved bottom zone. NOTHING may overlap (project-wide rule).
   If truly unplayable, a chapter may show the existing "turn sideways" prompt
   instead — but prefer adapting.
4. **Pointer parity**: every mechanic must work with BOTH touch and mouse —
   pointer events only (`onPointerDown/Enter/Up` + `touchAction: 'none'`),
   nothing hover-dependent, drag targets ≥ 44px.
5. **Reduced motion**: all keyframe animation behind
   `@media (prefers-reduced-motion: reduce)`.

**Verification matrix (run per chapter in preview):**
- 375×812 phone portrait (primary)
- 812×375 phone landscape (the classic overlap-catcher)
- 768×1024 iPad portrait · 1024×768 iPad landscape
- 1280×800 laptop · 1512×860+ wide desktop
Checks at each: backdrop shows the stall (right crop), instrument scaled to the
frame, no overlap/offscreen/scroll-trap, buttons reachable, drag works.

## F. Per-chapter build checklist

- [ ] Generate 2 backdrops (`nano_banana_2`: 9:16 portrait + 16:9 wide, cozy
      painted, empty UI area, no text) → `scene_<world>.png` + `scene_<world>_wide.png`.
- [ ] Copy `ShopRush.tsx` → `<Game>.tsx`; re-tint `P`; set world title + ticket names.
- [ ] Swap in the chapter's mechanics (reuse shared parts where possible).
- [ ] Write `makeTask(d)` pools (L1/L2/L3) with `prompt/say/answer/work`.
- [ ] Write Milo's demo (order #1 script + instrument animation).
- [ ] Point the wrapper `<Chapter>Chapter.tsx` at the new game; set `MasteryState` copy.
- [ ] `npx tsc --noEmit` clean.
- [ ] Verify in preview `/teen-preview?c=<id>`: demo plays → mechanic works → a
      correct answer stamps → 3 wrong in a row triggers the in-scene reteach →
      difficulty drops on wrong. No console errors.
- [ ] **Run the responsive matrix in section E** (all 6 sizes, both backdrops).

---

## G. Non-negotiables (the "why", so the fan-out doesn't drift)

- **No MCQ.** The answer is produced by a manipulation, never picked from 4 boxes.
- **No slides.** Teaching = Milo's demo + the in-scene reteach, not a lesson deck.
- **The adaptive engine is untouched** and used identically everywhere (demote on
  wrong · reteach after 3 wrong in a row · mastery early-exit · invisible tiers).
- **No coins / no timer / no red X / no visible score.** Math-without-fear.
- **Milo is in the scene** and talks with intent (ask → the kid acts → he reacts).
- **Real-world scenario carried through** the whole chapter (skin + tasks + demo),
  not just an intro line.
