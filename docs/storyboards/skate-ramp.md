# Storyboard — "Skate Ramp & Heights" (Triangles, Proof & Right-Triangle Trig, 15–16)

> Second scene in the 15–16 animation upgrade, built to the same spec as the
> pilot (`the-shot.md`). Medium: **hand-authored SVG + Framer Motion** (no
> generated image assets). The precise math skeleton (the right triangle, the
> labelled rise/run/hypotenuse, the angle arc, the right-angle mark) stays
> code-drawn and correct; the *stage* around it — dusk sky, ground, skater, ramp
> fill, sight-line — is vector art authored to this board. One continuous build,
> driven by the same `value = {k:'num', n: angle°}` protocol GameShell already
> feeds the scene, so nothing about the game loop changes.

## The teaching beat
Worked example: a skate ramp **rises 3 m** over a **4 m run**. Find its **angle
of elevation θ**. Method shown: the rise is OPPOSITE θ, the run is ADJACENT →
**tan θ = opp / adj = 3 / 4 = 0.75** → **θ = arctan(0.75) ≈ 37°**.

Because the scene is drawn at a fixed px-per-metre scale (run 4 m = 220 px, rise
3 m = 165 px), the *drawn* triangle's angle at A is exactly arctan(3/4) ≈ 36.9°,
so the picture and the number never disagree.

## Stage (persistent set, drawn once)
A skate spot at dusk, all vector:
- **Sky** — vertical dusk gradient, a soft low sun glow top-right (very low
  contrast, never competes with the math).
- **Ground** — a chalk-white ground line = the run's baseline.
- **The ramp** — the right triangle itself, drawn as a solid concrete ramp:
  - **A** (bottom-left) — the **angle of elevation θ** corner; a small **skater**
    stands here and looks up the ramp.
  - **B** (bottom-right) — the **right angle** (rise ⟂ run); a right-angle square.
  - **C** (top-right) — the **top of the ramp**; a little flag.
  - **run** = A→B (bottom, ADJACENT to θ), **rise** = B→C (right side, OPPOSITE
    θ), **hypotenuse** = A→C (the ramp surface / the skater's sight-line).
- **Angle arc** — a sector at A sweeping open from the ground up to θ, driven
  continuously by the walkthrough `value.n`.
- **Math labels** — `rise 3 m`, `run 4 m`, `opposite` / `adjacent` tags, the
  running `tan θ` readout. Load-bearing; always legible over the art.

## Shot list

| # | beat | on screen | motion | board | caption |
|---|------|-----------|--------|-------|---------|
| 0 | **Establish** | Sky fades up, ground draws L→R, the ramp triangle draws its outline, skater set at A, flag at C. | Triangle edges draw via `pathLength`; fill fades in; skater idle. | `a skate ramp (right triangle)` | "the ramp" |
| 1 | **Rise** | The right (vertical) side highlights; `rise 3 m` springs in. | Rise edge draws gold via `pathLength`; label spring. | `rise = 3 m` | "the ramp" |
| 2 | **Run** | The bottom side highlights; `run 4 m` springs in. | Run edge draws gold; label spring. | `run = 4 m` | "the ramp" |
| 3 | **Name θ** | Right-angle square springs in at B; the angle arc sweeps open at A to an indicative θ; `θ` label appears. | Right-angle spring; **arc `d` rides a `useMotionValue`** 0→16°; θ label spring. | `θ = angle of elevation` | "how steep?" |
| 4 | **Label sides** | `opposite` tag by the rise, `adjacent` tag by the run pulse in. | Tags fade/slide; rise+run briefly pulse. | `opp = 3,  adj = 4` | "how steep?" |
| 5 | **Pick TOA** | The `tan θ = opp / adj` readout appears under the ramp. | Readout fades up. | `tan θ = opp / adj` | "opp ÷ adj = tan" |
| 6 | **Plug in** | Readout becomes `tan θ = 3 / 4`. | Cross-fade readout. | `tan θ = 3 / 4` | "opp ÷ adj = tan" |
| 7 | **Divide** | Readout becomes `tan θ = 0.75`. | Cross-fade readout. | `tan θ = 0.75` | "opp ÷ adj = tan" |
| 8 | **Undo tan** | Arc sweeps a little wider as we prepare to invert. | Arc `useMotionValue` 16°→26°. | `θ = arctan(0.75)` | "undo the tangent" |
| 9 | **Solve** | Arc sweeps to the true **37°**; triangle + arc recolor mint; the sight-line dashes up the ramp from the skater's eye to the flag; θ label reads `37°`. | Arc springs to 37°; sight-line grows via `pathLength`; mint recolor; skater's arm lifts. | `θ ≈ 37°` | "θ ≈ 37° ✓" |
| 10 | **Your turn** | Everything holds solved; a cue to dial 37 on the slider. | Gentle held state. | `dial 37° ✓` | "θ ≈ 37° ✓" |

## Non-walkthrough states (overview / reveal)
The scene renders in the overview (step 0, establishing triangle) and at the end
of the walkthrough (`ended` → the solved 37° pose with the mint sight-line). It
is not used during scored play — there the real dial/proof instrument renders.

## Motion principles (shared with every 15–16 scene)
1. **Continuous, value-following sweep** — the angle arc's `d` is recomputed
   through `useTransform` from a `useMotionValue` that `animate()` drives toward
   `value.n`, so the arc *opens* between beats instead of snapping.
2. **Anticipation + follow-through** — the arc eases open; springs on the
   right-angle mark, θ label, and side labels give them weight.
3. **Spring the discrete marks** — right-angle square, labels, flag use springs.
4. **Draw, don't pop, the lines** — triangle edges, rise/run highlights, and the
   final sight-line use `pathLength`.
5. **Math stays exact** — the drawn angle equals arctan(3/4); every label sits on
   the real corner; art never displaces a number.
6. **Reduced-motion** — `useReducedMotion` collapses durations to 0 and shows the
   solved end state (arc at 37°, sight-line up), no sweep.
