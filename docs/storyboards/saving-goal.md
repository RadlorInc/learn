# Storyboard — "Saving-Up Goal" (Linear Equations & Inequalities, 15–16)

> Part of the 15–16 animation upgrade. Medium: **hand-authored SVG + Framer
> Motion** (no generated image assets), matching the gold-standard pilot
> `docs/storyboards/the-shot.md`. The precise math skeleton (the savings column
> mapped exactly to dollars, the goal line, the $5 week ticks, the equation
> terms) stays code-drawn and correct; the *stage* around it — glass money jar,
> the skateboard prize on its shelf, coins, the "$25-to-save" brace — is vector
> art authored to this board. One continuous save-up, driven by the same
> `value = {k:'x', x: weeks}` + `stepIndex` protocol GameShell already feeds the
> scene, so nothing about the game loop changes.

## The teaching beat
Worked example: **5x + 3 = 28**. You want a **$28** skateboard, you already have
**$3**, and you save **$5/week**. Find **x = weeks**. Method shown as inverse
operations: set 5x + 3 = 28 → **subtract 3** (peel off the head start) → 5x = 25
→ **divide by 5** → x = **5 weeks**.

## Stage (persistent set, drawn once)
A cosy bedroom-shelf scene at night, all vector:
- **Backdrop** — soft night gradient + a faint shelf plane the jar and prize sit
  on (very low contrast, never competes with the math).
- **Money jar** — a glass column, centre-frame. Its **inside is the number line
  in dollars**: bottom = $0, top = the $28 goal. This is the load-bearing math —
  every fill height maps exactly to dollars saved.
- **Head-start fill** — a small mint band at the base = the **$3** already saved.
- **Weekly fill** — a warm gold column that climbs on top of the head start, $5
  per week; a **week-marker** rides its surface.
- **Goal line + prize** — a coral line across the jar at **$28** with the
  **skateboard** 🛹 resting on a shelf just above it; it glows/hops when reached.
- **$5 week ticks** — faint rules inside the jar at $8, $13, $18, $23, $28 (i.e.
  head start + 5·k), labelled wk 1…5, appearing when we divide into weeks.
- **"$25 to save" brace** — a bracket on the jar's right from $3 up to $28,
  naming the amount that must come purely from weekly saving.

## Shot list

| # | beat (`stepIndex`) | on screen | motion | board | caption |
|---|------|-----------|--------|-------|---------|
| 0 | **Goal** (`s0`, x=0) | Jar empty, goal line + skateboard on the shelf. | Backdrop fade; jar outline draws; goal line draws L→R; prize idle bob. | `goal = $28` | "the goal" |
| 1 | **Head start** (`s1`, x=0) | The $3 mint band springs in at the base; "$3 you had" tag. | Mint band scales up from the floor; tag pops. | `have $3` | "head start" |
| 2 | **Weekly rate** (`s2`, x=0) | A $5 coin appears at the jar mouth: "+$5 / week". | Coin springs + tiny spin. | `+ $5 each week` | "$5 a week" |
| 3 | **Expression** (`s3`, x=0) | The saved amount is named 5x + 3. | Expression fades up under the jar. | `5x + 3` | "$5 a week" |
| 4 | **Equation** (`s4`, x=0) | Goal line pulses; 5x + 3 = 28 set. | Goal line glow pulse; equals snaps in. | `5x + 3 = 28` | "the equation" |
| 5 | **Undo +3** (`s5`, x=0) | "$25 to save" brace springs from $3→$28; "− $3 both sides". | Brace draws in; head-start tag crosses out. | `−3 both sides` | "peel the $3" |
| 6 | **5x = 25** (`s6`, x=0) | The brace reads $25; equation strip → 5x = 25. | 25 label counts in; strip swap. | `5x = 25` | "peel the $3" |
| 7 | **Divide by 5** (`s7`, x=0) | Week ticks (wk 1…5) rule across the brace region. | Ticks draw bottom→top in sequence. | `x = 25 ÷ 5` | "into $5 weeks" |
| 8 | **Climb** (`s8`, x=5) | Gold column climbs continuously past each tick; week-marker + $ readout count up 5,10,15,20,25. | `useMotionValue` fill 0→25 over ~1.6s, curve eased; marker rides the surface; ticks light as passed. | `5, 10, 15, 20, 25` | "filling up" |
| 9 | **x = 5** (`s9`, x=5) | Marker lands on wk 5; "= 5 weeks" bracket. | Marker settles with a spring; bracket springs. | `x = 5` | "5 weeks" |
| 10 | **Unlocked** (`s10`, x=5) | Head start counts back in → jar hits $28; skateboard glows mint + hops; sparkles. | Fill tops out at goal; prize spring-hop; goal line mint; shimmer. | `= 5 weeks ✓` | "skateboard unlocked ✓" |

## Non-walkthrough states (scored play / reveal)
Outside the walkthrough the same jar stays, minus the acted climb — it marks the
task as **today**:
- **equation task** — jar scaled to the task's goal; on reveal the fill glides to
  the solved height, goal line mint, "reached in N weeks ✓".
- **inequality task** — same jar; the goal line reads the "at least" threshold and
  the boundary week is marked (the dial is the answer, not built here).

## Motion principles (apply to every 15–16 scene)
1. **Continuous, mapping-following travel** — the savings fill rides a
   `useMotionValue` progress mapped through `useTransform` onto the exact dollar
   scale, so it flows *between* beats instead of snapping.
2. **Anticipation + follow-through** — the fill eases (not linear); the prize
   hops on arrival; the marker springs into its final week.
3. **Spring the discrete marks** — head-start band, coin, brace, week-marker and
   prize use springs, not fades.
4. **Draw, don't pop, the lines** — jar outline, goal line and week ticks use
   `pathLength`.
5. **Math stays exact** — every fill height and tick sits on the real
   dollar→pixel mapping; art never displaces a number.
6. **Reduced-motion** — `useReducedMotion` collapses durations to 0 and shows the
   end state (no climb), same as the pilot scene.
