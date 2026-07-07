# Storyboard — "Map Maker" (Geometry: Mensuration & Transformations, 15–16)

> Part of the 15–16 animation upgrade. Medium: **hand-authored SVG + Framer
> Motion** (no generated image assets). The precise math skeleton (blueprint
> grid, the exact zone radius, the r² tile lattice, the signed coordinate map)
> stays code-drawn and correct; the *stage* around it — the level-editor canvas,
> crosshair anchor, radar sweep, HUD readout — is vector chrome authored to this
> board. One continuous "size the zone" build, driven by the same
> `value = {k:'measure', n}` protocol GameShell already feeds the scene (n climbs
> toward the answer across beats), plus `stepIndex` for the keyed cue reveals, so
> nothing about the game loop changes.

## The teaching beat
Worked example: a **round zone, radius 3**, on a game map. Size it by its
**area**: `A = πr²`. Square the radius (3² = 9), multiply by π (≈ 3.14), land on
**≈ 28.3** — the number the player dials to lock the zone in.

## Stage (persistent set, drawn once)
A stylised **level-editor canvas**, all vector:
- **Editor frame** — a rounded blueprint panel that draws itself in on mount
  (pathLength), a faint "LEVEL EDITOR" tag in the corner.
- **Blueprint grid** — faint chalk-cyan lattice, the load-bearing map plane; a
  brighter **crosshair anchor** marks the zone's centre (its origin).
- **Round zone** — the circle being sized. Its outline radius grows continuously
  with the dialled value; a **radar fill wedge** sweeps around from the top,
  shading the zone's area as it fills (a satisfying "computing the size" read).
- **Sweep tip** — a bright dot rides the leading edge of the fill wedge.
- **Radius guide** — a horizontal line from the anchor to the rim with an
  `r = 3` tag, shown while the radius/square is taught.
- **HUD readout** — a big tabular `ZONE SIZE` counter under the canvas that
  counts up continuously with the fill (mint on land).

## Shot list (MEASURE walkthrough)

| # | idea | on screen | motion | board |
|---|------|-----------|--------|-------|
| 0 | **Drop a zone** | Editor draws in; small round zone seeded on the anchor. | Frame pathLength; zone springs to seed radius; readout ticks up from 0. | `round zone,  r = 3` |
| 1 | **We need its area** | Zone glows; "how much ground" framing. | Fill wedge begins to sweep. | `need: area` |
| 2 | **The rule** | `A = πr²` reads on the board; zone keeps filling. | Wedge sweeps further; radius guide fades in. | `A = π r²` |
| 3 | **Take the radius** | Radius guide extends to the rim, `r = 3` tag. | Guide line grows (motion length); tag springs. | `r = 3` |
| 4 | **Square it** | A 3×3 lattice of unit tiles blooms inside the zone. | Tiles pop (spring, staggered); `3² =` cue. | `r² = 3²` |
| 5 | **…is nine** | Lattice holds; the nine tiles read as the area units. | Count settles; zone ~half filled. | `r² = 9` |
| 6 | **Bring in π** | `× π` cue blooms at the centre. | π cue springs; wedge sweeps on. | `π ≈ 3.14` |
| 7 | **Multiply** | Nine × π computes; zone nearly full. | Wedge sweeps toward 360°; readout races up. | `A = 9 × π` |
| 8 | **≈ 28.3** | Zone completes; wedge closes the full circle. | Outline + fill recolor mint; success shimmer. | `A ≈ 28.3` |
| 9 | **Ground covered** | Full mint zone; readout rests on 28.3. | Gentle pulse. | `area ≈ 28.3` |
| 10 | **Lock it in** | "Dial 28.3" prompt; zone confirmed. | Checkmark shimmer over the readout. | `size = 28.3 ✓` |

## Non-walkthrough states (scored play / reveal)
Outside the walkthrough the same editor set stays:
- **MEASURE task** — the zone outline + fill track the *dialled* value
  continuously (frac = dialled / answer); the HUD reads the live number; on
  reveal the zone completes and recolors mint on the exact answer.
- **POINT task** (translate / reflect / rotate / midpoint) — a signed coordinate
  map: a **ghost** square marks the origin, a dashed **travel arrow** flies to
  the image spot, and the placed object **springs** onto its lattice coordinate
  (mint on reveal). The `(x, y)` reads below.

## Motion principles (shared with every 15–16 scene)
1. **Continuous, value-following growth** — the zone radius, fill sweep, and the
   count-up all ride a `useMotionValue` frac mapped through `useTransform`, so
   they flow *between* beats instead of snapping.
2. **Anticipation + follow-through** — springs on the seed, the radius guide, the
   tile lattice, and the placed point; never a bare linear tween.
3. **Spring the discrete marks** — tiles, π cue, coordinate point use springs.
4. **Draw, don't pop, the lines** — the editor frame and radius guide use
   pathLength / motion length.
5. **Math stays exact** — the readout equals dialled × frac = the real number;
   the coordinate point sits on the true lattice mapping; art never displaces it.
6. **Reduced-motion** — `useReducedMotion` collapses durations to 0 and shows the
   end state (full zone / placed point), no sweep.
