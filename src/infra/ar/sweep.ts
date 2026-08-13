/**
 * THE SWEEP — the hand travelling across the frame, read as ONE discrete event.
 *
 * The Supply Run's whole gesture: a hand crossing left→right deals one round out of the crate, and
 * the number of sweeps IS the answer. Division as repeated subtraction, performed with the body.
 *
 * ⚠️ A SWEEP IS AN EVENT, NOT A HELD POSE, AND THAT IS WHY THERE IS NO `useDwell` HERE. The two
 * guards a held reading needs — hold still for DWELL_MS, and ignore the reading left over from the
 * last round — exist because a hand is still in frame when the next question opens. A traversal
 * cannot be "still held": it either happened or it did not. So this reading needs no smoothing
 * constant and no hysteresis band tuned against assumed landmark noise, both of which the Angle
 * Shop's continuous tilt had to derive before its camera stopped being a dead button.
 *
 * ⚠️ IT IS A SCHMITT TRIGGER, AND THE ALTERNATIVES ARE ALL WORSE HERE. Two thresholds with a wide
 * gap give hysteresis, a physical re-arm and immunity to noise for free:
 *
 *       arm        fire
 *   ─────┤            ├─────                x is the palm's MIRRORED screen position, 0..1
 *       .40          .60
 *
 * ⚠️ THE RETURN STROKE MUST FIRE NOTHING, and that is the whole reason only one direction counts.
 * Coming back leftward is a physical necessity of sweeping right again — make it mean "undo" and
 * every second deal cancels the one before it, which is unusable. It arms instead, which is the
 * same motion doing the honest thing.
 *
 * ⚠️ AND THE DIRECTION IS NOT ARBITRARY: the crate is drawn LEFT of the receiving slots at every
 * size and every round (measured — 1800/1800 draws, smallest gap 22px), and the units already fly
 * left→right from the crate into the slots. The hand travels the way the goods travel. A sweep that
 * ran the other way would be a hand-shaped button.
 */

/**
 * Palm reaches here (or further left) to arm.
 *
 * ⚠️ THIS IS THE ONE NUMBER A REAL CHILD WOULD TUNE FIRST, AND ITS FAILURE MODE IS TOTAL SILENCE.
 * It alone decides whether a given child, in a given chair, in front of a given camera, can arm the
 * trigger at all. The geometry: a child centred on a laptop has their midline near x 0.5 and their
 * right hand at rest around 0.63–0.67 — already past the old fire line — so arming is a deliberate
 * move leftward, and every 0.01 further left is a seating position that can never make it. At 0.40
 * the palm need only reach a tenth of the frame left of the camera axis, roughly 6–8 cm, which is
 * reachable cross-body from an off-centre chair.
 */
export const SWEEP_ARM = 0.40
/** …and crosses here to fire. */
export const SWEEP_FIRE = 0.60

/**
 * ⚠️ THE GAP IS BOUNDED FROM BOTH SIDES, AND THE FIRST DRAFT ONLY HAD ONE OF THEM.
 *
 * FLOOR — noise. MediaPipe's palm landmarks jitter by roughly ±0.02 of frame width, so a band ten
 * times that cannot be crossed by a hand held still, however long it is held. ⚠️ That is ALL width
 * buys: it rejects NOISE. It does nothing whatever against a real arm movement that happens not to
 * be an answer — the first draft of this file claimed in a comment that a wide band stopped "an
 * ordinary reach for a mug", and that was simply false. `SWEEP_MAX_Y` is what does that.
 *
 * CEILING — ERGONOMICS, which is what took this from 0.30 to 0.20. `answer` is 2..7 and a run is
 * ten rounds, so a child performs **20–70 sweeps plus a return stroke each — up to ~140 lateral arm
 * traversals in one sitting**, by far the most repetitive gesture in this band (The Fitting Crew
 * asks for two dwells a round; The Angle Shop for one hold). At typical geometry — a laptop webcam
 * at ~60° and 50–70 cm sees a field ~58–81 cm wide — 0.20 is 11–16 cm of palm travel, a forearm
 * flick rather than a whole-arm swing. And a tired sweep is a short sweep, which is a missed sweep,
 * which costs another sweep.
 */
export const SWEEP_SPAN = SWEEP_FIRE - SWEEP_ARM

/**
 * ⚠️ THE POSTURE GATE, AND IT IS WHAT ACTUALLY STOPS A REACH FOR A DRINK DEALING A ROUND. Everything
 * above reads only x, and a hand crossing the desk — left of the keyboard to the mouse, out to a
 * cup and back — is a perfectly good left→right traversal of far more than the band. That is a spurious
 * deal, which is the one failure this whole reading is biased against, arriving through the door
 * nobody was watching.
 *
 * A sweep is a RAISED hand. y grows DOWN in the frame, so the palm has to be above the bottom fifth
 * — generous enough that a child sitting close and low still clears it, strict enough that a hand
 * resting on the desk does not. One comparison, and it is the second knob a real child would tune.
 */
export const SWEEP_MAX_Y = 0.8

/**
 * ⚠️ DETECTION LOSS IS CORRELATED WITH THE GESTURE, WHICH IS WHY DISARMING ON ONE NULL FRAME IS THE
 * WRONG BIAS. A hand moving fast under indoor light on a rolling-shutter webcam is motion-blurred,
 * MediaPipe's confidence collapses, and it falls back to a full re-detection — so a dropped frame is
 * most likely precisely DURING a brisk sweep. Disarming instantly throws away the gesture the child
 * did best, which is a dead button on the only thing they can do.
 *
 * A few frames of grace covers a blur without covering a hand that has actually gone away: at the
 * 10–30 fps this loop really runs at (inference-bound, not vsync-bound) four frames is ~130–400 ms.
 */
export const LOST_GRACE = 4

/**
 * The arming bar is quantized before it reaches the hook's change test, or a hand hovering
 * mid-band re-renders the chapter's whole tree at frame rate for a gesture that is not progressing
 * — the exact cost `useFingerCounter` documents for the continuous tilt.
 *
 * ⚠️ IF A CROSSING IS EVER MADE TO DEAL AS IT PASSES rather than firing once at the far side, this
 * also becomes the resolution units land at, and the measurement is recorded so it is not re-derived:
 * at 6 steps a step cost of 2..6 still lands strictly ONE AT A TIME. Raising it to 12 buys only EVEN
 * SPACING on cost 4 (0.25·0.25·0.25·0.25 instead of 0.333·0.167·0.333·0.167) and a touch on cost 5,
 * and it costs a hand held still one extra key change — see `sweepReader.test.ts`. Not worth it
 * until a real child reads the stutter as the gesture stalling.
 */
export const ARM_STEPS = 6
export const quantArm = (a: number) => Math.round(a * ARM_STEPS) / ARM_STEPS

/** The palm, in the frame the child is looking at. */
export interface Palm { x: number; y: number }

export interface SweepState {
  /** the hand has reached the left side and a crossing would now count */
  armed: boolean
  /** how many sweeps have fired since the reader started — MONOTONE, never reset */
  sweeps: number
  /** 0..1 through the band, for the arming bar. Says only WHAT WAS READ.
   *  ⚠️ Also the teleport guard: `arm > 0` means the hand was SEEN crossing, not merely seen on both
   *  sides of the frame, which is the only thing separating a traversal from a re-acquisition. */
  arm: number
  /** consecutive frames with no usable palm, so a motion blur is not mistaken for a hand leaving */
  lost: number
}

export const SWEEP_START: SweepState = { armed: false, sweeps: 0, arm: 0, lost: 0 }

/**
 * One frame. PURE, so the gate drives the same function the camera drives — a check that carries
 * its own copy of a rule cannot see the rule being removed, which is this repo's own recorded fault.
 *
 * `p === null` means NO USABLE PALM — no hand, or a hand below the posture line. Past `LOST_GRACE`
 * it disarms. That is a deliberate false-negative bias: a spurious deal is both wrong and something
 * the child then has to undo, while a missed sweep costs one more sweep.
 *
 * ⚠️ FIRING NEEDS `armed` AND `arm > 0`, i.e. the hand must have been SEEN INSIDE THE BAND. A
 * per-frame distance ceiling was tried first and thrown away: a teleport from 0.2 to 0.9 is a step
 * of 0.70 and a brisk one-frame crossing from 0.15 to 0.85 is 0.70 as well, so no ceiling separates
 * them — and one low enough to reject the artefact rejects a fast child on a throttled loop, which
 * is a dead button. (The first draft shipped a `MAX_STEP` of 0.25 sitting UNDER the band it was
 * guarding, so a hand crossing from one threshold to the other in a single frame was refused. Three tests
 * caught it.) Being seen crossing separates them cleanly and needs no constant at all.
 *
 * ⚠️ `arm` IS MONOTONE WITHIN ONE ARMING, which is not decoration. A bar that slid backwards on
 * landmark noise reads as broken, AND a hand hovering mid-band would change the quantized value up
 * and down for ever, which is the frame-rate re-render this file exists to avoid. It resets to 0
 * only by re-arming on the left, which is a real gesture rather than noise.
 *
 * Boundaries are inclusive on both ends (`x <= ARM` arms, `x >= FIRE` fires), so the reading is
 * deterministic on a value sitting exactly on a threshold.
 */
export function stepSweep(s: SweepState, p: Palm | null): SweepState {
  if (!p || p.y > SWEEP_MAX_Y) {
    const lost = s.lost + 1
    if (lost < LOST_GRACE) return s.lost === lost ? s : { ...s, lost }
    return s.armed || s.arm ? { armed: false, sweeps: s.sweeps, arm: 0, lost } : { ...s, lost }
  }
  const x = p.x
  const same = (n: SweepState) => (n.armed === s.armed && n.arm === s.arm && n.sweeps === s.sweeps && s.lost === 0 ? s : n)

  if (x <= SWEEP_ARM) return same({ armed: true, sweeps: s.sweeps, arm: 0, lost: 0 })

  if (x >= SWEEP_FIRE) {
    if (s.armed && s.arm > 0) return { armed: false, sweeps: s.sweeps + 1, arm: 0, lost: 0 }
    return same({ armed: false, sweeps: s.sweeps, arm: 0, lost: 0 })
  }

  if (!s.armed) return same({ armed: false, sweeps: s.sweeps, arm: 0, lost: 0 })
  return same({ armed: true, sweeps: s.sweeps, arm: Math.max(s.arm, (x - SWEEP_ARM) / SWEEP_SPAN), lost: 0 })
}

/**
 * What the hook's change test compares. ⚠️ The raw `arm` is continuous, so keying on it directly
 * fires the chapter's re-render at frame rate for a gesture that has not progressed. Quantized, one
 * whole traversal is a handful.
 *
 * ⚠️ `armed` is in it because the chapter's INSTRUCTION is a function of it — "bring your hand back
 * to the left" versus "sweep across" — and a child who cannot see which state they are in gets
 * silence, which is FitOut's `handHint` lesson.
 *
 * ⚠️ `sweeps` IS THEREFORE REDUNDANT TODAY, AND IT STAYS ANYWAY — stated because a mutation proving
 * it is guilty until you have decided which it is. Dropping `sweeps` from this key was a genuine
 * dead button when the key was `sweeps/arm`: on a fast sweep whose only in-band sample sits near the
 * arming line the bar quantizes to 0 on both sides of the fire, so nothing changed, `onRead` never
 * fired, and the deal never reached the chapter. Adding `armed` closed that by accident, since a
 * fire always flips armed true→false. The mutation now SURVIVES and is inert. It is left in because
 * the redundancy is the wrong way round to rely on: the counter is the thing the chapter actually
 * consumes, and `armed` is here for a caption that a later pass could reasonably delete.
 */
export const sweepKey = (s: SweepState) => `${s.sweeps}/${quantArm(s.arm)}/${s.armed ? 1 : 0}`

/**
 * The palm's position in the frame, or null when there is no hand.
 *
 * ⚠️ MIRRORED, because the self-view is `scaleX(-1)` and that is the frame the child is looking at
 * — the same convention `palmTilt` uses, and for the same reason: handedness is exactly the thing a
 * nine-year-old gets confused by. Moving your own hand to your right moves the reading toward 1.
 *
 * ⚠️ Wrist (0) and middle-finger KNUCKLE (9), the two points on the rigid palm, never a fingertip:
 * the reading must not swing when the fingers curl, because a child sweeping is not thinking about
 * their fingers at all.
 */
export function palmRead(lm: { x: number; y: number }[] | undefined): Palm | null {
  if (!lm || lm.length < 10) return null
  return { x: 1 - (lm[0].x + lm[9].x) / 2, y: (lm[0].y + lm[9].y) / 2 }
}
