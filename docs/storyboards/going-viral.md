# Storyboard — "Going Viral" (Functions: Linear & Exponential, 15–16)

> Part of the 15–16 animation upgrade. Medium: **hand-authored SVG + Framer
> Motion** (no generated image assets). The precise math skeleton — axes, day
> ticks, the steady **line** `f(x) = 3x + 4`, the viral **curve** `y = 2ˣ`, their
> **crossover**, and the value readouts — stays code-drawn and correct; the
> *stage* around it — the two-video race, the scoreboard, the sweeping day-scan —
> is vector motion authored to this board. Driven by the same
> `value = {k:'num', n}` + `stepIndex` protocol GameShell already feeds the scene,
> so nothing about the game loop changes.

## The teaching beat
Two videos post the same day. The **steady** channel adds the same 3 views daily
(a straight **line**, `f(x) = 3x + 4`); the **viral** one doubles daily (a
**curve**, `y = 2ˣ`). Early on the line leads; on **day 4 they meet at 16 views**;
after that the curve **rockets past** — that is exponential growth. Then we
**evaluate the steady model on day 5**: `f(5) = 3(5) + 4 = 15 + 4 = 19`. Worked
answer: **19 views**.

## Stage (persistent set, drawn once)
A dark "analytics screen", all vector:
- **Backdrop** — deep panel gradient with a faint screen glow; never competes
  with the plot.
- **Chart** — chalk-faint gridlines, a **day →** x-axis (0–5) with ticks, a
  **views** y-axis. This is the load-bearing math; every mark sits on the exact
  `gx/gy` coordinate mapping.
- **Steady line** — gold polyline `f(x) = 3x + 4`, with small day-dots.
- **Viral curve** — mint curve `y = 2ˣ`, smooth-sampled, bending upward.
- **Scoreboard** — two live pills above the chart: **📸 steady** (gold) and
  **🚀 viral** (mint), their counts ticking as the day-scan sweeps.
- **Day-scan** — a vertical sweep line with a dot riding each graph, so the two
  counts can be read off at the same day and the curve is *seen* overtaking.
- **Crossover** — a springy marker at **(day 4, 16 views)** where line = curve.
- **Evaluate marker** — in the solve phase, a dot climbs the day-5 column
  `4 → 15 → 19` with guide lines, landing on the steady line's endpoint.

## Shot list

| # | beat | on screen | motion | board | caption |
|---|------|-----------|--------|-------|---------|
| 0 | **Establish** (`s0`, n=4) | Empty chart fades up: axes, day ticks, the two creators idle. | Backdrop fade; axes draw on. | `two videos, day 0` | "the race" |
| 1 | **Steady line** (`s1`) | Gold line `f(x)=3x+4` draws L→R; day-dots pop on. | Line `pathLength` 0→1; dots spring, staggered. | `steady: f(x) = 3x + 4` | "steady vs viral" |
| 2 | **Viral curve** (`s2`) | Mint curve `y=2ˣ` draws in low, bending up; scoreboard appears (4 vs 1). | Curve `pathLength` 0→1. | `viral: y = 2ˣ` | "steady vs viral" |
| 3 | **Early lead** (`s3`) | Day-scan sweeps to **day 2**; dots ride each graph; steady count leads (10 vs 4). | Scan `x` eases to day 2; counts tick via motion value. | `early days → steady leads` | "steady leads" |
| 4 | **They meet** (`s4`) | Scan sweeps to **day 4**; a crossover marker springs in at 16 — both equal. | Scan to day 4; crossover `scale` spring. | `day 4 → they meet at 16` | "they meet · 16" |
| 5 | **Overtake** (`s5`) | Scan sweeps to **day 5**; viral (32) rockets past steady (19); curve glows. | Scan to day 5; curve emphasis; counts tick apart. | `viral overtakes → exponential` | "viral wins" |
| 6 | **Pick the model** (`s6`, n=4) | Race dims; focus on the steady line. Evaluate marker appears at day-5 column, low. | Curve dims to background; marker fades in at n=4. | `steady on day 5 → f(5)` | "day 5" |
| 7 | **Substitute** (`s7`) | Board rewrites `f(5) = 3(5) + 4`; marker holds. | Guide lines settle at day 5. | `f(5) = 3(5) + 4` | "day 5" |
| 8 | **Multiply** (`s8`, n=15) | Marker climbs to **15**; value label rides it up. | Marker `y` glides to 15; count ticks 4→15. | `= 15 + 4` | "day 5" |
| 9 | **Add** (`s9`, n=19) | Marker climbs to **19**, landing on the steady line's day-5 endpoint. | Marker `y` glides to 19; count ticks 15→19. | `= 19` | "day 5" |
| 10 | **Answer** (`s10`, n=19) | Marker + endpoint glow mint; big `19 views` readout confirms. | Recolor mint + pulse. | `day 5 → 19 views` | "day 5 · 19 views ✓" |

## Non-walkthrough states
The scene renders once more OUTSIDE the walkthrough — on the pre-walkthrough
overview card (`stepIndex = 0`, `ended = false`), where it shows the **establish**
state: the idle chart with axes and day ticks, before either graph is drawn. The
interactive scored play uses the `SlideValue`/`SpecPicker` instrument, not this
scene.

## Motion principles (shared across every 15–16 scene)
1. **Continuous, curve-following travel** — the day-scan dots and the evaluate
   marker ride `useMotionValue` progress through `useTransform` onto `gx/gy`, so
   they flow *between* beats instead of snapping; the two counts tick via
   `useMotionValueEvent`.
2. **Anticipation + follow-through** — eased sweeps, a held meeting beat, the
   curve visibly pulling away. Never a linear jump.
3. **Spring the discrete marks** — day-dots, the crossover, the answer glow use
   springs, not fades.
4. **Draw, don't pop, the lines** — axes, the steady line, the viral curve use
   `pathLength`.
5. **Math stays exact** — every marker sits on the real `gx/gy` mapping; the
   crossover is the true `(4, 16)`, the answer the true `19`.
6. **Reduced-motion** — `useReducedMotion` collapses durations to 0 and shows the
   end state of each beat (no sweeping), same as the reference scene.
