# Storyboard — "Power-Ups" (Exponents & Polynomials, 15–16)

> Part of the 15–16 animation upgrade. Medium: **hand-authored SVG + Framer
> Motion** (no generated image assets). The precise math skeleton (the stat
> value, the ×base doubling, the level count, the exponent readout) stays
> code-drawn and correct; the *stage* around it — the arcade charge tower, the
> power meter, the level tiles, the multiplier chips — is vector art authored to
> this board. One continuous charge-up, driven by the same
> `value = {k:'pow', n: currentStat}` protocol GameShell already feeds the scene,
> so nothing about the game loop changes.

## The teaching beat
Worked example: **2⁴ = 16**. An exponent is repeated multiplication: the little
**4** says "multiply by **2**, four times." Every stat starts at **1**; each
**level** cranks it **×2**, so it *leaps*: 1 → 2 → 4 → 8 → 16. Method shown:
crank up one level at a time, counting the four multiplies, then name it as 2⁴.

## Stage (persistent set, drawn once)
A stylised arcade upgrade bench, all vector:
- **Backdrop** — vertical night-arcade gradient with a soft top spotlight pooling
  on the bench; a faint dot grid + scanline sheen high up (very low contrast,
  never competes with the math).
- **Charge tower / power meter** — a tall rounded track on the left; the fill is
  the **stat**, and its height is mapped so each level **doubles** it (cur / 16),
  so a level-up visibly *leaps*. Notch ticks sit at each doubling. This is the
  load-bearing math made physical.
- **Level ladder** — five evenly-spaced tiles on the right (levels 0…4) showing
  the cumulative stat **1, 2, 4, 8, 16**; ×2 connectors run between them. Levels
  spaced *linearly* (you level up one at a time) while the meter grows
  *exponentially* — the contrast is the lesson.
- **Multiplier chip** — a "×2" token that springs in and rides the top of the
  meter on each leap.
- **Exponent readout** — a chalk-white `2ⁿ = value` at the top that updates with
  the level; a running multiply chain `2 × 2 × …` builds one factor per level.

## Shot list

| # | beat | on screen | motion | board | caption |
|---|------|-----------|--------|-------|---------|
| 0 | **Establish** | Bench fades up, spotlight blooms, meter track + ladder tiles draw on, stat rests at 1 (level 0). | Backdrop fade; track + connectors draw via `pathLength`; base tile springs. | `2⁴ = ?` | "stat at 1" |
| 1 | **Read the exponent** | The little 4 highlights; "multiply by 2, four times" reads. | Exponent readout pulses; ladder dims ahead, base tile glows. | `the 4 = multiply ×2, four times` | "start: level 0" |
| 2 | **Base level** | Meter shows the tiny level-0 fill; ladder tile "1" lit. | Meter fill eases to 1/16; tile 1 springs lit. | `every stat starts at 1` | "stat at 1" |
| 3 | **Level 1** | Meter **doubles**, ×2 chip springs at the top, tile "2" lights, chain shows `2`. | Meter spring-overshoots to 2/16; ×2 chip pops; connector 0→1 draws. | `level 1:  1 × 2 = 2` | "×2 → 2" |
| 4 | **Level 2** | Meter doubles again to 4; tile "4" lights; chain `2 × 2`. | Meter leaps to 4/16; chip re-pops; connector 1→2 draws. | `level 2:  2 × 2 = 4` | "×2 → 4" |
| 5 | **Level 3** | Meter doubles to 8; tile "8" lights; chain `2 × 2 × 2`. | Meter leaps to 8/16; connector 2→3 draws. | `level 3:  4 × 2 = 8` | "×2 → 8" |
| 6 | **Level 4 (max)** | Meter fills to the top (16); tile "16" lights; chain `2 × 2 × 2 × 2`. | Meter leaps to full; top tile springs; connector 3→4 draws. | `level 4:  8 × 2 = 16` | "×2 → 16" |
| 7 | **Count the multiplies** | The four 2's in the chain highlight together. | Chain characters pulse; meter holds. | `that is four 2s: 2 × 2 × 2 × 2` | "fully charged" |
| 8 | **Name the power** | The chain collapses to `2⁴`. | Exponent readout springs; chain → power. | `2 × 2 × 2 × 2 = 2⁴` | "fully charged" |
| 9 | **Charged** | Everything recolors mint; `2⁴ = 16` locks in. | Meter + tiles + readout recolor mint + pulse. | `2⁴ = 16 · fully charged` | "charged ✓" |

## Non-walkthrough states (intro preview)
Outside the walkthrough (the intro preview frame, `value = initial`), the same
set stays at its resting state: the meter at the base fill, the ladder showing
level 0 lit, the readout at `2⁰ = 1` — no acted leaps. The scored-play stage
uses the real CrankGear / SlideValue instrument, not this scene.

## Motion principles (shared with every 15–16 scene, see the-shot.md)
1. **Continuous, mapped travel** — the meter fill rides a `useMotionValue`
   animated with a **spring** toward `cur / 16`, so it flows and *overshoots*
   (the "leap") between beats instead of snapping.
2. **Anticipation + follow-through** — spring overshoot on each doubling; the ×2
   chip pops with a slight over-scale; tiles settle after springing.
3. **Spring the discrete marks** — level tiles, the ×2 chip, and the exponent
   readout use springs, not fades.
4. **Draw, don't pop, the lines** — the meter track, ladder connectors, and grid
   use `pathLength`.
5. **Math stays exact** — the fill height is exactly `cur / 16`; each tile sits
   at its true cumulative value; the level count is `log₂(cur)`. Art never
   displaces a number.
6. **Reduced-motion** — `useReducedMotion` collapses durations to 0 and shows the
   current/end state (no leaps), same as the reference scene.
