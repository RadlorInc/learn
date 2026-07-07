# Storyboard — "Leaderboard" (Signed Numbers & Real-Number Fluency, 15–16)

> Part of the 15–16 animation upgrade. Medium: **hand-authored SVG + Framer
> Motion** (no generated image assets). The precise math skeleton (the vertical
> signed score meter, the zero line, the integer tick labels, the marker on the
> exact coordinate mapping) stays code-drawn and correct; the *stage* around it —
> the arcade scoreboard, the rank rows, the WIN/LOSS zones, the glow — is vector
> art authored to this board. One continuous score swing, driven by the same
> `value = {k:'num', n}` protocol GameShell already feeds the scene, so nothing
> about the game loop changes.

## The teaching beat
Worked example: **3 − 5**. You won 3 points, then lost 5. On the score meter a
win pushes the marker **up** (above the zero line = positive) and a loss pushes
it **down** (below the zero line = negative). Start at **+3**, drop **5** notches
one at a time, cross the zero line, and land on **−2**. Method shown:
`3 − 5 = 3 + (−5)` → count 5 down from 3 → **−2, below the line**.

## Stage (persistent set, drawn once)
A stylised arcade / e-sports scoreboard, all vector:
- **Backdrop** — vertical night gradient with a soft radial scoreboard glow up
  top and a faint pixel/scanline dot field (very low contrast, never competes
  with the math).
- **Leaderboard panel** (left) — a glass "LEADERBOARD" card with rank rows
  (`1 ACE`, `2 NOVA`, `▸ YOU`). The **YOU** row is highlighted and its score
  reads the live meter value, going green above the line and red below it.
- **Score meter** (right) — the load-bearing math: a vertical notched track,
  a faint green **WIN zone** above and red **LOSS zone** below, the **zero line
  in gold** labelled `0`, integer tick labels down the side, and `▲ WIN +` /
  `▼ LOSS −` legends capping the track.
- **Marker** — a glowing score chip that rides the track, carrying the current
  number; green when at/above zero, red when below.
- **Operation arrow** — a `↓ −1` cue that rides beside the marker during the
  loss, pushing it notch by notch; ticks light as they are passed.
- **Result bracket** — a measuring bracket from the zero line down to the marker
  showing how far below the line the final score sits.

## Shot list

| # | beat | board | on screen | motion |
|---|------|-------|-----------|--------|
| 0 | **Hook** | `won +3, lost −5` | Board fades up, rank rows spring in, meter draws on, marker parked on the zero line. | Backdrop fade; zero line `pathLength` draws; rank rows spring stagger; WIN/LOSS legends glow. |
| 1 | **Legend** | `up = win · down = loss` | WIN zone (green, top) and LOSS zone (red, bottom) name themselves; legends brighten. | Zone opacities ease in; legend pulse. |
| 2 | **Combine** | `3 − 5` | The two swings read as one expression; marker still at zero. | Board line writes; marker idle bob. |
| 3 | **Start** (n=3) | `start at +3` | Marker springs **up** to +3, three notches above the line; YOU row turns green. | Marker `useMotionValue` glides up with overshoot; +3 notch pings. |
| 4 | **Down 1** (n=2) | `down 1 → 2` | Loss begins: `↓ −1` arrow rides the marker down one notch to 2; passed tick lights. | Marker flows down continuously; arrow bob; tick glow. |
| 5 | **Down 2** (n=1) | `down 2 → 1` | Another notch down to 1. | Continuous glide; tally `2 of 5`. |
| 6 | **Down 3** (n=0) | `down 3 → 0` | Marker lands **on the zero line** — level. | Glide to zero; zero line flash. |
| 7 | **Down 4** (n=−1) | `down 4 → −1` | Marker slips **below the line** into the red to −1; LOSS zone deepens. | Glide under zero; red zone opacity swells; marker recolors coral. |
| 8 | **Down 5** (n=−2) | `down 5 → −2` | Final notch — marker settles on −2. | Glide to −2; tally `5 of 5`. |
| 9 | **Recap** (n=−2) | `3 − 5 = −2` | Measuring bracket spans zero → marker, "2 below" reads out. | Bracket springs/scales in from the zero line; label fades. |
| 10 | **Post** (n=−2) | `score = −2` | Final score locks; YOU row shows −2 in red, meter settles. | Marker pulse; success shimmer over the track. |

## Non-walkthrough states (scored play / reveal)
The `TutorialScene` renders only on the intro card + walkthrough; scored play
swaps in the real `ElevatorShaft` instrument. On the **intro card**
(`frameCount === 1`) the scene shows the idle establish state: rank rows, meter
drawn, WIN/LOSS zones + legends, marker resting on the zero line. On **reduced
motion**, all durations collapse to 0 and every beat shows its end state (marker
snaps to the beat's `n`, no glide).

## Motion principles (apply to every 15–16 scene)
1. **Continuous, meter-following travel** — the marker rides a `useMotionValue`
   score animated with `animate()` and mapped through `useTransform` onto the
   track's coordinate `syScore(n)`, so it flows *between* beats instead of
   snapping.
2. **Anticipation + follow-through** — the +3 jump overshoots and settles; the
   drop accelerates through the notches; the marker recolors as it crosses zero.
3. **Spring the discrete marks** — rank rows, notch pings, the result bracket,
   and labels use springs, not fades.
4. **Draw, don't pop, the lines** — the zero line and track outline use
   `pathLength`.
5. **Math stays exact** — every marker, notch, and label sits on the real
   `syScore` coordinate mapping; the arcade art never displaces a number.
6. **Reduced-motion** — `useReducedMotion` collapses durations to 0 and shows
   the end state (no glide), same as the reference scene.
