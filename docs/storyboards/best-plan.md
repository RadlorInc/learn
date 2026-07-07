# Storyboard — "Best Plan" (Systems of Equations, 15–16)

> Part of the 15–16 animation upgrade. Medium: **hand-authored SVG + Framer
> Motion** (no generated image assets). The precise math skeleton (axes, GB
> ticks, cost labels, the two exact cost lines, the intersection) stays
> code-drawn and correct; the *stage* around it — the phone-store comparison
> chart, plan chips, the sweeping usage scanner, the answer marker — is vector
> art authored to this board. One continuous compare-and-solve, driven by the
> same `value = {k:'pt', a, b}` protocol GameShell already feeds the scene, so
> nothing about the game loop changes.

## The teaching beat
Worked example: two phone plans as two cost lines — **Plan A: y = x + 1** and
**Plan B: y = −x + 5**. Find the **break-even point**: where the two lines
**cross** and both plans cost the same. Method shown: scan the usage to *see*
which plan is cheaper where, then solve exactly — set the costs equal →
x + 1 = −x + 5 → 2x = 4 → x = 2 → y = 3 → **break-even (2, 3)**.

## Stage (persistent set, drawn once)
A phone-store comparison chart, all vector:
- **Chart frame** — a soft glass panel with a **usage (x) → cost ($, y)** axis
  pair, faint GB ticks along the bottom and dollar ticks up the side. This is
  the load-bearing math; every marker sits on the real coordinate mapping.
- **Plan chips** — a small legend at the top: a gold dot + "Plan A" with a
  **live monthly cost**, and a coral dot + "Plan B" with its live cost. The two
  costs count up/down as the usage scanner moves, so the child *feels* the two
  prices trading places.
- **Plan A line** — gold cost line, `y = x + 1`, draws in from the left.
- **Plan B line** — coral cost line, `y = −x + 5`, draws in the other way.
- **Usage scanner** — a dashed vertical scan line that sweeps across the usage
  axis with a dot riding each plan line, so you can see which line sits lower
  (= cheaper) at that usage.
- **Break-even point** — the exact crossing, springs in and glows mint once we
  reach it; dashed drop-guides fall to the usage axis (x) and across to the
  cost axis (y).
- **Answer marker** — a mint marker that slides along the usage axis to x, then
  rises up to the shared cost y, tracing how the point is built.

## Shot list

| # | beat | on screen | motion | board | caption |
|---|------|-----------|--------|-------|---------|
| 0 | **Establish** (`s0`) | Chart frame fades up, axes + GB/$ ticks draw on; empty comparison chart. | Panel fade; axis strokes draw L→R and bottom→top. | `compare two plans` | "two plans" |
| 1 | **Plan A** (`s1`) | Plan A's gold line draws in from the left; its chip lights up with a live cost. | Line `pathLength` sweep; chip fades in. | `A: y = x + 1` | "plan A" |
| 2 | **Plan B** (`s2`) | Plan B's coral line draws in the other way; its chip lights up. | Line `pathLength` sweep; chip fades in. | `B: y = −x + 5` | "plan B" |
| 3 | **Scan low** (`s3`, a→1) | Scanner parks at low usage; dot on A sits *below* dot on B; costs read A cheaper. | Scanner eases to x≈1; cost chips count to A $2 / B $4. | `low usage → A cheaper` | "who's cheaper?" |
| 4 | **Scan high** (`s4`, a→4) | Scanner glides to high usage; now B's dot sits below A's; costs flip. | Scanner eases to x≈4; costs count to A $5 / B $1. | `high usage → B cheaper` | "who's cheaper?" |
| 5 | **The tie** (`s5`, a→2) | Scanner slides to the middle; the two dots meet — the plans tie. | Scanner eases to x=2; both cost chips converge to $3. | `they meet = break-even` | "they tie here" |
| 6 | **Break-even** (`s6`) | The crossing point **springs in** mint; drop-guides fall to the axes. | Point spring (scale + pulse ring); guides fade in. | `break-even point` | "break-even" |
| 7 | **Set equal** (`s7`) | Both lines glow at the crossing; the equation appears. | Lines pulse-brighten; scanner retires. | `x + 1 = −x + 5` | "set equal" |
| 8 | **Gather x** (`s8`) | — | Board writes the next line; picture holds at the crossing. | `2x + 1 = 5` | "gather the x's" |
| 9 | **Isolate 2x** (`s9`) | — | Hold. | `2x = 4` | "isolate 2x" |
| 10 | **Solve x** (`s10`, a→2,b→0) | Mint answer marker **slides along the usage axis** to x = 2; x-guide highlights. | Marker translate to (2,0); x label springs. | `x = 2` | "x = 2 GB" |
| 11 | **Solve y** (`s11`, a→2,b→3) | The marker **rises** up to the shared cost; y-guide highlights. | Marker translate to (2,3); y label springs. | `y = 2 + 1 = 3` | "y = $3" |
| 12 | **Locked** (`s12`) | Crossing + marker glow mint; `(2, 3)` label; success shimmer. | Recolor mint + pulse; label fade/slide in. | `break-even = (2, 3)` | "locked ✓" |

## Non-walkthrough states (intro pose)
The scene renders only during the intro pose and the walkthrough (scored play
uses the PartsBuilder, not the scene). In the **intro pose** (`frameCount == 1`)
the full picture shows at rest: both plan lines drawn, chips reading $3 / $3, the
break-even crossing glowing mint — a clean preview of what we're about to solve.

## Motion principles (apply to every 15–16 scene)
1. **Continuous, curve-following travel** — the scanner and the answer marker
   ride `useMotionValue` positions animated with `animate()` and mapped through
   `useTransform` onto the coordinate system, so they flow *between* beats
   instead of snapping.
2. **Anticipation + follow-through** — the marker slides across first, *then*
   rises; the crossing springs with a pulse ring. Never a linear pop.
3. **Spring the discrete marks** — the crossing point, x/y labels, and answer
   marker use springs, not fades.
4. **Draw, don't pop, the lines** — axes and both plan lines use `pathLength`.
5. **Math stays exact** — every marker sits on the real `sx`/`sy` mapping; the
   art never displaces a number.
6. **Reduced-motion** — `useReducedMotion` collapses durations to 0 and shows
   the end state (no sweep), same as the reference scene.
