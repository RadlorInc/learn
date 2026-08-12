/**
 * THE SLIDE — the palm's position on an axis, read as a POSITION ON A SCALE (reading **F**).
 *
 * Three chapters in the 9–11 plan want this and each wants it because the position IS the maths, not
 * because a slider was convenient:
 *   · The Rail Line — slide along the track to say where 47 sits, then commit at the nearer halt.
 *     Rounding *is* "which end is it nearer", so a hand travelling the line is the question.
 *   · The Loading Bay — raise your hand to set each bar, so the child builds the season's chart
 *     before reading one.
 *   · Decimals — place a value on a 0–1 line.
 *
 * ⚠️ A SLIDE IS A HELD POSE, NOT AN EVENT, WHICH MAKES IT THE OPPOSITE OF `sweep.ts`. A sweep either
 * happened or it did not, so it needs no dwell, no smoothing and no hysteresis. A slide is a reading
 * the child HOLDS, so it inherits both of the guards a held pose needs — hold still to commit, and
 * ignore the reading left over from the previous question — and, because it is quantized to a small
 * number of steps, it inherits the Angle Shop's dead-button problem too. See `snapIndex`.
 *
 * ⚠️ THERE IS NO POSTURE GATE IN HERE, AND THAT IS DELIBERATE RATHER THAN AN OMISSION. `sweep.ts`
 * gates on `y` because its reading is x-only, so a hand crossing the desk to a mug is otherwise a
 * perfectly good traversal. Here `y` may BE the value (the Loading Bay raises a hand to set a bar),
 * so a gate on it would clamp the answer range. The consumer applies whichever gate its own axis
 * leaves free — Rail Line reuses `SWEEP_MAX_Y`, the Loading Bay cannot.
 */

/**
 * How finely the raw palm is quantized before the hook's change test sees it.
 *
 * ⚠️ THIS IS A RE-RENDER BUDGET, NOT A RESOLUTION. A continuous reading keyed directly fires the
 * chapter's whole tree at frame rate — the exact cost `useFingerCounter` documents for the tilt, and
 * what `quantArm` exists to avoid in the sweep. 24 is deliberately FINER than any consumer's own
 * scale (six stations, eight bars, ten tenths), so no chapter loses a step it could have used, while
 * a hand held still stops re-rendering entirely.
 */
export const SLIDE_STEPS = 24
export const quantSlide = (v: number) => Math.round(v * SLIDE_STEPS) / SLIDE_STEPS

/**
 * How far past the current step, as a share of one step, a reading must travel before the step
 * changes. Shared by every discrete reading taken off a continuous hand.
 *
 * ⚠️ HYSTERESIS IS NOT POLISH AND THE NUMBER IS DERIVED, NOT CHOSEN. Quantizing to n steps puts a
 * boundary every half-step, and a still hand's landmark jitter is the same order — so without this a
 * hand held ON a boundary dithers between two answers for ever, the hold-still commit never arms,
 * and the camera is a dead button, which chapter-craft calls the worst outcome there is. A hand
 * settled on step C sees raw values up to half a step plus noise away from C, so suppressing that
 * noise needs a hold band of a FULL step: the reading changes exactly when the hand reaches the next
 * step's own centre, which is also the only rule that is easy to say out loud — move it to where you
 * want it and it goes there.
 *
 * The Angle Shop derived this first (its `SNAP_HOLD`, where a weaker 0.62 flipped on a boundary and
 * was caught by mutation-testing the gate rather than by looking). It lives here now because a
 * second copy of a rule is this repo's most-repeated recorded fault, and `snapDeg` delegates to it.
 */
export const SNAP_HOLD = 1

/**
 * The step a raw reading means, holding the current step until the reading is clearly past it.
 *
 * `raw` is in STEP UNITS — a continuous index, not a 0..1 share — so one caller can be degrees over
 * a 5° lattice and another six stations along a line without either of them re-deriving the rule.
 * `current` may be null (nothing read yet) or off-lattice (an echo of a previous reading), and both
 * are handled: with nothing to hold, the nearest step wins.
 */
export function snapIndex(raw: number, current: number | null, steps: number): number {
  const clamp = (v: number) => Math.max(0, Math.min(steps - 1, v))
  const want = clamp(Math.round(raw))
  if (current === null) return want
  const cur = clamp(current)
  return Math.abs(raw - cur) < SNAP_HOLD ? Math.round(cur) : want
}

/**
 * How much of the frame's width a scale is spread across, before `slideIndex` maps it.
 *
 * ⚠️ THE FULL FRAME IS NOT REACHABLE, AND MAPPING A SCALE TO IT IS SILENCE AT THE ENDS — which is the
 * opposite of what this file said until the Rail Line was actually wired. The old comment argued that
 * the full frame is "the full reach, so the ends are reachable from any seating position"; measured on
 * The Fundraiser (its `REACH`, same 0.72), a seated child moves a hand comfortably through the MIDDLE
 * of the picture and has to lean out of shot to touch either edge. So a station mapped to x ≈ 0 is a
 * station they can never dwell on, and on this chapter the outer stations are half of what stops the
 * question being a coin flip. `SWEEP_ARM`'s failure mode, arriving on a third reading.
 *
 * ⚠️ IT IS A SEPARATE FUNCTION RATHER THAN FOLDED INTO `slideIndex`, so the lattice mapping the gate
 * already pins stays byte-identical — and so a chapter whose scale genuinely IS the whole frame can
 * skip it. Everything past the band clamps to the nearest end rather than going dead.
 */
export const SLIDE_REACH = 0.72
export const reachSpan = (v: number) => {
  const m = (1 - SLIDE_REACH) / 2
  return Math.max(0, Math.min(1, (v - m) / SLIDE_REACH))
}

/**
 * Map a 0..1 position on one axis to a continuous index over `steps` positions.
 *
 * ⚠️ FEED IT `reachSpan(palm.x)`, NOT THE RAW PALM — see above. Raw in, and the two end steps sit
 * where a seated arm does not go.
 */
export const slideIndex = (v: number, steps: number) => Math.max(0, Math.min(steps - 1, v * (steps - 1)))

/**
 * What the hook's change test compares for a slide.
 *
 * ⚠️ BOTH AXES ARE IN IT even though no single chapter reads both, because the alternative is a hook
 * that has to be told which axis a chapter cares about — and a reading whose shape depends on its
 * consumer is the coupling `onRead` was widened to avoid. Quantized, a hand held still is one key.
 */
export const slideKey = (p: { x: number; y: number } | null) =>
  p ? `${quantSlide(p.x)}/${quantSlide(p.y)}` : 'none'
