# Storyboard — "Screen Distance" (Radicals & the Pythagorean Theorem, 15–16)

> Part of the 15–16 animation upgrade. Medium: **hand-authored SVG + Framer
> Motion** (no generated image assets). The precise math skeleton (the right
> triangle, the two legs, the a²/b² unit-tile squares, the diagonal) stays
> code-drawn and correct; the *stage* around it — a phone in portrait, its bezel,
> camera notch, glowing screen — is vector art authored to this board. One
> continuous "measure the diagonal" build, driven by the same
> `value = {k:'len', n}` + `stepIndex` protocol GameShell already feeds the scene,
> so nothing about the game loop changes.

## The teaching beat
Worked example: a **3-by-4 phone screen**. Find the **diagonal** (corner to
corner) — the **hypotenuse** of a right triangle. Method shown:
**3² + 4² = c²** → 9 + 16 = 25 → c = √25 = **5**. The squares on the legs are
built as literal unit-tile grids (nine tiles, then sixteen) so "square a side"
is something the learner watches happen, not a symbol.

## Stage (persistent set, drawn once)
A phone standing in portrait, all vector:
- **Phone body** — dark rounded-rect bezel + camera notch; the screen is a soft
  blue gradient with a faint radial glow. The screen *is* the 3×4 rectangle whose
  diagonal we measure (portrait ratio = 3 wide : 4 tall — the exact numbers).
- **Math overlay** — bright chalk-white legs traced over two edges of the screen,
  a right-angle bracket at the square corner, and side labels **3** and **4**.
  This is the load-bearing math and always stays exact.
- **a² square** — a 3×3 grid of tiles grown *below* the width leg (9 tiles).
- **b² square** — a 4×4 grid of tiles grown *beside* the height leg (16 tiles).
- **Diagonal** — the hypotenuse, swept corner-to-corner across the screen in the
  final beats, with a **length readout** that counts up as it draws.

## Shot list (12 baby steps)

| # | beat | on screen | motion | board | caption |
|---|------|-----------|--------|-------|---------|
| 0 | **Screen** | Phone fades up; the two legs trace over the bottom + side edges; labels 3, 4 fade in. | Legs draw via `pathLength`; labels spring; screen glow blooms. | `screen: 3 wide, 4 tall` | "a phone screen" |
| 1 | **Right angle** | The square-corner bracket springs in; the diagonal is named as the hypotenuse. | Right-angle bracket `spring` scale-in. | `diagonal = hypotenuse` | "a phone screen" |
| 2 | **Theorem** | The rule appears; nothing on the triangle moves yet. | Board line only. | `a² + b² = c²` | "square each side" |
| 3 | **Square side 3** | An empty 3×3 outline grows on the width leg. | Square `spring` grows from the leg edge. | `3² = ?` | "square each side" |
| 4 | **9 tiles** | The 3×3 fills with nine tiles, one by one; the "9" label lands. | Tiles stagger in (`spring`, per-tile delay). | `3² = 9` | "square each side" |
| 5 | **Square side 4** | An empty 4×4 outline grows on the height leg. | Square `spring` grows from the leg edge. | `4² = ?` | "square each side" |
| 6 | **16 tiles** | The 4×4 fills with sixteen tiles; the "16" label lands. | Tiles stagger in. | `4² = 16` | "square each side" |
| 7 | **Add** | Both squares pulse; the sum is set up. | Squares glow/pulse together. | `9 + 16 = c²` | "add the squares" |
| 8 | **c² = 25** | Readout resolves to 25. | Readout `sdPop`. | `c² = 25` | "add the squares" |
| 9 | **Square root** | The undo-the-square move appears. | Board line only; diagonal about to draw. | `c = √25` | "take the square root…" |
| 10 | **Sweep** | The diagonal sweeps corner-to-corner; its length counts up from 0. | Diagonal `pathLength` draws; `useMotionValue` length climbs 0→5. | `c = √25 = 5` | "take the square root…" |
| 11 | **Solved** | Diagonal + markers recolor mint; length holds at 5. | Recolor + settle; count lands on 5. | `diagonal = 5` | "diagonal = 5" |

## Non-walkthrough states (intro preview / reduced motion)
The scene only ever carries the fixed 3-4-5 worked example (the walkthrough
task). At the intro preview (`stepIndex 0`) it shows the bare phone + legs. When
`ended` is true it shows the final solved state (diagonal drawn, length 5, mint).

## Motion principles (shared with every 15–16 scene)
1. **Continuous, flowing readouts** — the diagonal length rides a
   `useMotionValue` + `animate()` so it *counts up* between beats instead of
   snapping.
2. **Anticipation + follow-through** — squares grow from the leg edge; tiles
   stagger; the diagonal draws rather than appears. Never a bare linear jump.
3. **Spring the discrete marks** — the right-angle bracket, side labels, and
   tiles use springs, not fades.
4. **Draw, don't pop, the lines** — legs and the diagonal use `pathLength`.
5. **Math stays exact** — every leg, tile, and the diagonal sit on the real 3×4
   coordinate mapping; the phone art never displaces a number.
6. **Reduced-motion** — `useReducedMotion` collapses durations to 0 and shows the
   end state (no build), same as the reference `ArcScene`.
