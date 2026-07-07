# Storyboard — "Build Plot" (Factoring Polynomials, 15–16)

> Part of the 15–16 animation upgrade. Medium: **hand-authored SVG + Framer
> Motion** (no generated image assets). The precise math skeleton — the
> area-model rectangle split into x², x-strips and unit tiles on the exact grid,
> with the two side brackets (x + p) and (x + q) — stays code-drawn and correct;
> the *stage* around it (the build-plot ground grid, the loose blocks, the
> foundation outline) is vector art authored to this board. One continuous
> assembly, driven by the same `value = {a, b}` + `stepIndex` + `ended` protocol
> GameShell already feeds the scene, so nothing about the game loop changes.

## The teaching beat
Worked example: **area = x² + 5x + 6**. Factor it to recover the two side
lengths of the plot: **(x + 2)(x + 3)**. Method shown as an area model: the
whole area breaks into one **x·x square (x²)**, **five x-long strips (5x)**, and
**six unit tiles (6)**. Find two numbers that **multiply to 6** (the corner tile
block is 2 × 3) and **add to 5** (3 strips along one edge + 2 along the other).
Those numbers, 2 and 3, are the "+n" on each side → **(x + 2)(x + 3)**.

## Stage (persistent set, drawn once)
A top-down build plot, all vector:
- **Plot ground** — a dark earth gradient overlaid with a faint square build
  grid (never competes with the math), reading as a sandbox/block-building lot.
- **Foundation outline** — the plot footprint rectangle, drawn in as a dashed
  survey line via `pathLength` before the blocks land.
- **Area model** (the load-bearing math) — the footprint splits into four
  regions on the exact grid mapping:
  - **x² square** (gold) top-left, side length x by x.
  - **x-strips** (coral): 3 columns down the right edge (3x) + 2 rows along the
    bottom (2x) = the 5x.
  - **unit tiles** (mint): a 3 × 2 block of six single tiles in the corner = 6.
- **Loose blocks** — the six unit tiles start scattered in a staging pile below
  the plot and **glide** up into the corner as the area is assembled.
- **Side brackets** — a top bracket spanning the width labelled **(x + 3)** and a
  left bracket spanning the height labelled **(x + 2)**, each with a tick where
  the x-part meets the unit-part; spring in once the sides are read.

## Shot list

| # | beat (`stepIndex`) | on screen | motion | board | caption |
|---|------|-----------|--------|-------|---------|
| 0–1 | **Establish** (0–1) | Ground grid + foundation outline draw on; the area sits as one solid slab labelled x² + 5x + 6. | Grid fades up; foundation `pathLength` draws L→R; slab holds with a faint idle glow. | `area = x² + 5x + 6` | "the plot area" |
| 2 | **Split** (2) | The slab dissolves and the four regions appear: x² square, right + bottom x-strips slide in from the edges, six unit tiles glide up from the pile into the corner. | Slab `opacity`→0; strips translate in (spring); tiles ride a shared `useMotionValue` progress from pile → corner so they FLOW into place. | `x²  +  5x  +  6` | "splitting the area" |
| 3 | **Multiply — 6** (3) | The six corner tiles highlight; we're hunting two numbers that multiply to 6. | Corner glow rect springs on; tile block pulses. | `need: ▢ × ▢ = 6` | "multiply to 6, add to 5" |
| 4 | **Add — 5** (4) | The five x-strips highlight; the same two numbers must add to 5. | Strip glow rect springs on. | `and: ▢ + ▢ = 5` | "multiply to 6, add to 5" |
| 5–6 | **Find 2 & 3** (5–6) | 2 × 3 = 6 — the corner reads as a clean 2 × 3 tile block; the region term labels (x², 3x, 2x, 6) settle in. | Tile grid + labels spring; corner glow recolors toward the answer hue. | `2 × 3 = 6` | "multiply to 6, add to 5" |
| 7 | **Check sum** (7) | 3 strips down one edge + 2 along the other = 5; the strip counts tie to the sides. | Strip group ticks spring; add-glow confirms. | `2 + 3 = 5 ✓` | "reading the sides" |
| 8 | **Side A** (8) | The **left** bracket springs in spanning the height: **(x + 2)** — x plus the two bottom rows. | Left bracket `opacity`+slide (spring); label fades in. | `one side: x + 2` | "reading the sides" |
| 9 | **Side B** (9) | The **top** bracket springs in spanning the width: **(x + 3)** — x plus the three right columns. | Top bracket `opacity`+slide (spring); label fades in. | `other side: x + 3` | "reading the sides" |
| 10 | **Factored** (10, `ended`) | The whole plot glows mint, both side labels lit — the factored rectangle (x + 2)(x + 3). | Regions recolor mint; a soft success shimmer over the plot. | `(x + 2)(x + 3)` | "two sides built ✓" |

## Non-walkthrough states (intro pose / reveal)
The scene renders only in the **intro** (posed with the worked example, `stepIndex 0`,
`ended false`) and the **walkthrough**. During scored play GameShell shows the live
`PartsBuilder` instead. In the intro pose the plot sits as the solid slab with its
area label — the goal on view before the baby steps begin.

## Motion principles (shared with every 15–16 scene)
1. **Continuous, progress-driven assembly** — the unit tiles ride a
   `useMotionValue` mapped through `useTransform` from the staging pile to their
   corner cells, so they flow *between* beats instead of snapping.
2. **Anticipation + follow-through** — strips slide in from off-edge with spring
   overshoot; brackets spring, they never hard-cut.
3. **Spring the discrete marks** — glows, brackets, region labels use springs.
4. **Draw, don't pop, the lines** — the foundation outline and grid draw via
   `pathLength`.
5. **Math stays exact** — every region, strip and tile sits on the real unit
   grid; the area model always sums to x² + 5x + 6 and the sides read (x+2)(x+3).
6. **Reduced-motion** — `useReducedMotion` collapses durations to 0 and shows the
   assembled end state (no fly-in), same as the reference scene.
