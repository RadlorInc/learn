# Storyboard — "The Shot" (Quadratics & Parabolas, 15–16)

> Pilot for the 15–16 animation upgrade. Medium: **hand-authored SVG + Framer
> Motion** (no generated image assets). The precise math skeleton (grid, axis,
> the exact parabola, root/vertex markers) stays code-drawn and correct; the
> *stage* around it — court, hoop, shooter, ball, net, crowd, lighting — is
> vector art authored to this board. One continuous shot, driven by the same
> `value = {k:'roots', a: progress 0–100, b: beat}` protocol GameShell already
> feeds the scene, so nothing about the game loop changes.

## The teaching beat
Worked example: **y = x² − 4**. Find the **roots** (where the ball lands): the
curve crosses the floor at **x = −2** and **x = 2**. The **peak** of the arc is
the turning point. Method shown: set y = 0 → x² = 4 → x = ±2.

## Stage (persistent set, drawn once)
A stylised indoor court at dusk, all vector:
- **Arena backdrop** — vertical dusk gradient, a soft radial spotlight pooled on
  the floor, faint tiered crowd silhouette + bokeh dots high up (very low
  contrast, never competes with the math).
- **Court floor** — warm wood plane with a receding perspective seam; the
  **baseline is the x-axis (y = 0)**; a painted key/free-throw arc hint.
- **Math overlay** — chalk-white faint grid + axis with x-labels, sitting *over*
  the court so the numbers stay exact and legible. This is the load-bearing math.
- **Hoop** — pole + backboard + rim + **net** at the right landing (near x = 2).
- **Shooter** — a small vector figure at the left launch (near x = −2); arms
  extend on release.
- **Ball** — vector basketball (disc + seams), capable of spin, squash/stretch,
  and a swish through the net.
- **Trajectory guide** — the exact **y = x² − 4** parabola, drawn as a faint
  chalk trace; the ball's *flight* is a downward arc through the two roots.

## Shot list

| # | beat | on screen | motion | board | caption |
|---|------|-----------|--------|-------|---------|
| 0 | **Establish** (`b0`) | Court fades up, spotlight blooms, grid + axis draw on, shooter set with ball, hoop at right. | Backdrop fade 500ms; grid strokes draw L→R; ball rests, tiny idle bob. | `y = x² − 4` | "the shot" |
| 1 | **Release** (`b1`, a≈8) | Shooter's arms extend; ball launches from the left root, spinning; dotted flight trail begins to grow; the two floor-crossing spots pulse. | Ball squash→stretch on release; `rotate` spins with travel; trail `pathLength` grows to the ball; launch pin (x=−2) springs. | `lands where y = 0` | "rising to the peak" |
| 2 | **Apex** (`b2`, a≈50) | Ball reaches the top of the arc; a **peak** marker springs in; the full arc guide finishes drawing; brief hang-time. | Ball eases into apex with a held beat (hang-time); peak dot + label spring; arc glows. | `peak = turning point` | "rising to the peak" |
| 3 | **Swish** (`b3`, a≈100) | Ball descends to the right root and **drops through the net**; net wobbles; the landing pin (x=2) springs; both floor crossings highlight. | Ball falls, spins faster, net swish (mesh wobble 2 bobs); landing pin springs; crossing dots at −2, 2 glow. | `x² − 4 = 0  →  x² = 4` | "where it lands" |
| 4 | **Solve** (`b4`) | Both root pins glow mint, the ±2 labels count in, success shimmer over the arc. | Root pins recolor mint + pulse; labels fade/slide in; arc shimmer sweep. | `x = ±2  →  x = −2, 2` | "where it lands ✓" |

## Non-walkthrough states (scored play / reveal)
Outside the walkthrough the same set stays, minus the acted flight:
- **roots task** — mark the two crossings the task carries; on reveal, pins glow
  mint and the ball rests at the right landing.
- **vertex task** — show the vertex dot + (h, k) label at the turning point.
- **formula task** — the arc + "irrational landing" caption (answer is picked,
  not built), pins hidden.

## Motion principles (apply to every 15–16 scene)
1. **Continuous, curve-following travel** — the ball rides a `useMotionValue`
   progress mapped through `useTransform` onto the arc, so it flows *between*
   beats instead of snapping (already the pattern; keep it).
2. **Anticipation + follow-through** — squash on release, hang at apex, faster
   spin on descent, net follow-through. Never a linear tween.
3. **Spring the discrete marks** — pins, peak, labels use springs, not fades.
4. **Draw, don't pop, the lines** — grid, axis, arc, trail use `pathLength`.
5. **Math stays exact** — every marker sits on the real coordinate mapping;
   art never displaces a number.
6. **Reduced-motion** — `useReducedMotion` collapses durations to 0 and shows
   the end state (no flight), same as the current scene.
