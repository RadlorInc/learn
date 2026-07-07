# Storyboard — "Follower Growth" (Slope & Linear Graphs, 15–16)

> Part of the 15–16 animation upgrade. Medium: **hand-authored SVG + Framer
> Motion** (no generated image assets). The precise math skeleton (grid, axes,
> the intercept point, the rise/run staircase, the line, week/follower ticks)
> stays code-drawn and correct; the *stage* around it — the creator's phone /
> profile stat card, the analytics backdrop — is vector art authored to this
> board. One continuous build, driven by the same `value = {k:'line', m, b}`
> protocol GameShell already feeds the scene, with `stepIndex` sequencing the
> baby-step reveal, so nothing about the game loop changes.

## The teaching beat
Worked example: **start 1 follower, +2 followers per week → y = 2x + 1**. Plot
the **intercept** (week 0 = 1 follower). Count the **run** (across 1 week) and
the **rise** (up 2 followers). The **slope** m = rise ÷ run = 2. Join the steps
into one straight line and read it as **y = mx + b**.

## Stage (persistent set, drawn once)
An analytics-dashboard vibe, all vector:
- **Backdrop** — deep analytics-green gradient panel, faint grid glow, never
  competing with the math.
- **Profile stat card** (top-left) — a small creator card: avatar, `@creator`,
  a **live follower count** that ticks up as the line climbs, and a green
  `▲ growing` chip. This carries the theme; it sits over the empty (negative-
  week) corner so it never covers a plotted point.
- **Chart** — a square math grid centred on the origin; **across = weeks**,
  **up = followers**; the x- and y-axes are the load-bearing skeleton and draw
  in via `pathLength`.
- **Intercept point** — the start (week 0), springs in at (0, b).
- **Rise/run staircase** — dashed run (right 1 week) + rise (up m followers)
  segments that draw out from the intercept; the first step's run and rise are
  emphasised on their own beats.
- **Growth line** — the exact `y = mx + b`, drawn as a stroke that sweeps in via
  `pathLength` once the steps are joined.
- **Climbing dot** — a marker that rides the finished line from the intercept
  upward, driven by a `useMotionValue` progress so it flows; the profile card's
  follower count is mapped off the same progress.

## Shot list

| # | beat | on screen | motion | board | caption |
|---|------|-----------|--------|-------|---------|
| 0 | **Establish** | Backdrop + grid fade up; profile card shows 0/idle; empty chart. | Backdrop fade; grid settles; card idle. | `y = mx + b` | "followers per week" |
| 1 | **Axes** | x/y axes draw on; "weeks →" / "↑ followers" labels spring in. | Axes `pathLength` L→R / bottom-up; labels spring. | `→ weeks   ↑ followers` | "followers per week" |
| 2 | **Intercept** (b=1) | Start dot springs in at (0, 1); card reads **1** follower. | Dot spring-scale; count sets to 1. | `start b = 1` | "the start" |
| 3 | **Run** (m=2) | First step's **run** (right 1 week) draws + highlights gold. | Run segment `pathLength`; emphasis colour/width. | `run: → 1 week` | "step across" |
| 4 | **Rise** | The **rise** (up 2 followers) draws + highlights green. | Rise segment `pathLength`; emphasis. | `rise: ↑ 2 followers` | "step up" |
| 5 | **One step** | Both run + rise settle to one clean staircase step. | Emphasis relaxes; step holds. | `one step: →1, ↑2` | "one week" |
| 6 | **Slope** | Slope label appears: m = rise ÷ run = 2. | Label spring-in. | `slope m = rise ÷ run = 2` | "growth rate" |
| 7 | **Repeat** | The staircase's second step is present; "same climb, every week". | Second step visible; subtle pulse. | `grow 2 every week` | "every week" |
| 8 | **Join** | Steps join into one straight **line**, sweeping in; the dot starts climbing and the follower count ticks 1 → 5. | Line `pathLength`; progress `animate` climbs dot; count maps off progress. | `join the steps → a line` | "the growth line" |
| 9 | **Read** | Equation reads in at the bottom: y = 2x + 1. | Readout recolours in. | `y = 2x + 1` | "y = mx + b" |
| 10 | **Solve** | Line + dot glow mint; success. | Recolour mint + settle. | `y = 2x + 1 ✓` | "your turn" |

## Non-walkthrough states (intro preview)
`TutorialScene` renders only during the walkthrough and the pre-walkthrough
overview preview (`frameCount = 1`, `value = {m:0, b:0}`). In that preview the
set stays but nothing is constructed: a clean grid + axes + an idle profile card
(0 followers), posed under Milo's read-along plan. Scored play uses the
`LineSetter` / `SlideValue` instruments, not this scene.

## Motion principles (shared across every 15–16 scene)
1. **Continuous, path-following travel** — the climbing dot rides a
   `useMotionValue` progress mapped through `useTransform` onto the line, and the
   follower count reads off the same progress, so both flow *between* beats
   instead of snapping.
2. **Anticipation + follow-through** — springs on the intercept dot and labels;
   the count eases up with the climb.
3. **Spring the discrete marks** — intercept, labels, slope tag use springs.
4. **Draw, don't pop, the lines** — axes, staircase segments, and the growth
   line all use `pathLength`.
5. **Math stays exact** — every marker sits on the real coordinate mapping
   (`toX`/`toY`); the profile card lives in the empty corner and never displaces
   a number.
6. **Reduced-motion** — `useReducedMotion` collapses durations to 0 and shows
   the end state (line drawn, count at 5), same as the current scene.
