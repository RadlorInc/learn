/**
 * THE PINCH-GRAB — thumb and index closing on a thing, read as HOLD / RELEASE (reading **E**).
 *
 * The Order Desk's own verb is LOAD THE ORDER: a pledge is picked up and put into the bay for its
 * place. Done with the hand, the child physically carries a hundred into the hundreds bay, so the
 * place-value decision is made with the body instead of watched. That is the test chapter-craft §5
 * sets — *a pinch used as a cursor is a mouse with extra steps and a permission prompt* — and it is
 * passed here only because the DROP CHOOSES THE COLUMN. If the pinch were merely how you press a
 * supply button, it would not ship.
 *
 * ⚠️ A GRAB IS A HELD POSE, so it inherits both guards a pose needs — hold still to commit, and
 * ignore the reading left over from the previous round — and it inherits the Angle Shop's
 * dead-button problem, because a threshold on a continuous distance dithers when a hand sits on it.
 * See `stepPinch`.
 *
 * ⚠️ AND THE READING IS A RATIO, NOT A DISTANCE. This is the single most important thing in the file
 * and it is not an optimisation — an absolute threshold does not work at all. MediaPipe normalizes
 * landmarks to frame width, and frame width at distance d is `2·d·tan(fov/2)`, so ANY length read in
 * normalized units scales as 1/d. On the geometry `sweep.ts` already assumes (a laptop webcam at
 * ~60°, a child sitting 50–70 cm away):
 *
 *     a 2 cm thumb–index gap reads   0.043 at 40 cm · 0.035 at 50 cm · 0.025 at 70 cm · 0.017 at 1 m
 *
 * — 1.75× across a normal seat range, with the hand pose completely unchanged. The comparison that
 * kills the idea outright: **a 2 cm gap at 40 cm and a 3.5 cm gap at 70 cm both read 0.043**, i.e.
 * identical readings for two poses 75% apart in reality. The gesture's whole dynamic range is only
 * about 5× (a pinch closed at the joint centres never reaches zero, ~1.5–2 cm, against ~8–10 cm
 * open), so seating distance alone eats roughly 43% of it. A fixed constant therefore means
 * "grabbing" at arm's length and "open" up close — and a child leaning in to see the screen, which
 * is exactly what they do, has a hand that is permanently holding. That is `SWEEP_ARM`'s failure
 * mode (silence for a given seating position) except it fails in BOTH directions. On top of it, hand
 * SIZE varies 20–25% between a nine- and an eleven-year-old, so the constant would be per-child too.
 *
 * Dividing by a length taken from the SAME landmarks in the SAME frame cancels the 1/d term exactly,
 * because it is in the numerator and the denominator. See `pinchRatio` for which length and why.
 */

/** Thumb tip and index tip — the two points that close. */
const THUMB_TIP = 4
const INDEX_TIP = 8
/** Wrist and middle-finger knuckle — the rigid palm, and the reference length. */
const WRIST = 0
const MID_MCP = 9

const d2 = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

/**
 * The thumb–index gap as a share of PALM LENGTH, or null when there is no usable hand.
 *
 * ⚠️ THE REFERENCE IS WRIST → MIDDLE KNUCKLE, WHICH IS THE PAIR `palmTilt` AND `palmRead` ALREADY USE,
 * and for the identical reason: both points sit on the RIGID palm, so the reference does not change
 * when the fingers curl. That property is the whole point here rather than a nicety — a reference
 * like index-knuckle-to-index-tip would SHRINK as the child pinches and partially cancel the very
 * signal being measured, leaving a reading that barely moves.
 *
 * ⚠️ TWO DIMENSIONS, NEVER THREE. MediaPipe's `z` is wrist-relative and by far its noisiest channel,
 * so `hypot(dx, dy, dz)` makes this reading worse rather than better — the existing distance helper
 * in `fingerCount.ts` is deliberately 2-D for the same reason.
 *
 * ⚠️ AND A MINIMUM PALM LENGTH IS PART OF THE READING, NOT A SEPARATE CHECK. A ratio whose divisor is
 * tiny is mostly noise, and a small palm means the hand is far enough away that neither term is
 * trustworthy — so a hand beyond usable range reports NO READING rather than a confident wrong one.
 * It doubles as this gesture's validity gate, which it badly needs: `sweep.ts` can gate on `y`
 * because its reading is x-only, and `slide.ts` cannot because `y` may BE the value — here `y` is
 * the drop height, so a posture gate on it would clamp which bay the child can reach.
 */
export function pinchRatio(lm: { x: number; y: number }[] | undefined): number | null {
  if (!lm || lm.length <= MID_MCP) return null
  const palm = d2(lm[WRIST], lm[MID_MCP])
  if (palm < PINCH_MIN_PALM) return null
  return d2(lm[THUMB_TIP], lm[INDEX_TIP]) / palm
}

/**
 * Below this palm length (a share of frame width) the hand is too far away to read.
 *
 * Derived from the same geometry as the numbers above: a nine-to-eleven-year-old's palm is roughly
 * 7–8 cm, and the field is ~58 cm wide at 50 cm, so a palm at a normal seat reads ~0.12–0.14 and at
 * a metre ~0.07. 0.06 sits just under the far end, so it rejects a hand across the room without
 * rejecting a child who has leaned back.
 */
export const PINCH_MIN_PALM = 0.06

/**
 * ⚠️ SMOOTHED BEFORE THE THRESHOLD, AND WITHOUT THIS THE BAND BELOW WOULD NOT BE AFFORDABLE.
 * Fingertips are the noisiest landmarks MediaPipe produces — the palm points `sweep.ts` is sized
 * against jitter by ~±0.02 of frame width and tips are worse. A gap of two of them carries roughly
 * √2 × that, and dividing by a palm of ~0.13 turns ±0.028 of frame width into **±0.2 in ratio
 * units** — wider than any Schmitt gap this gesture could spare. An EMA costs one multiply and takes
 * the residual to something a 0.26 band clears comfortably.
 *
 * 0.35 rather than the tilt's 0.3: a grab must feel immediate, because the child is about to move
 * their hand and a lagging pick-up reads as the gesture having failed.
 */
export const PINCH_EMA = 0.35

/**
 * The Schmitt pair. Close below `GRAB_ON` to hold; open past `GRAB_OFF` to let go.
 *
 * ⚠️ HYSTERESIS IS MANDATORY, for the Angle Shop's reason: one threshold means a hand held near it
 * dithers for ever, so the piece is picked up and dropped repeatedly and nothing can be placed.
 *
 * ⚠️ AND THE ASYMMETRY IS SPECIFIC TO THIS GESTURE, unlike the sweep's. The two failures are not
 * equal: a false RELEASE mid-carry drops the pledge into whatever bay the hand happens to be over,
 * which is **a wrong answer the chapter caused** — the worst thing in chapter-craft — while a false
 * GRAB merely picks up nothing and costs one more pinch. So the release threshold is deliberately
 * generous and sits far from the grab one: once you are holding, it takes a decisive open to drop.
 *
 * The band in ratio units, against the physical range: a closed pinch measured at the joint centres
 * is ~0.2–0.3 of palm length and a comfortably open hand ~1.0–1.4, so 0.42/0.68 sits inside the gap
 * with room both sides. ⚠️ These are the two numbers a real child would tune first, and unlike an
 * absolute threshold they are at least the SAME two numbers for every child and every chair.
 */
export const GRAB_ON = 0.42
export const GRAB_OFF = 0.68

/**
 * ⚠️ DETECTION LOSS IS CORRELATED WITH THE GESTURE, which is `sweep.ts`'s finding applying verbatim:
 * a hand carrying a piece across the frame is precisely the motion-blurred one whose landmarks
 * MediaPipe drops, and the moment it drops is the moment a grab would be released — into the wrong
 * bay. So a held grab rides out a few lost frames. An OPEN hand needs no such grace: nothing is
 * being carried, so losing it costs nothing.
 */
export const LOST_GRACE = 5

/**
 * How many CONSECUTIVE frames past `GRAB_OFF` it takes to actually let go.
 *
 * ⚠️ THE BAND ALONE DOES NOT SURVIVE A SINGLE BAD FRAME, AND A TEST CAUGHT THAT RATHER THAN A REVIEW.
 * Settled on a firm pinch at 0.25, one outlier frame reading 2.0 — an ordinary fingertip
 * mis-detection, which is the noisiest landmark MediaPipe produces — moves the EMA to
 * `0.25 + (2.0 − 0.25) × 0.35 = 0.86`, past `GRAB_OFF`, and the piece is dropped. Into whichever bay
 * the hand happened to be over, which is a WRONG ANSWER THE CHAPTER CAUSED.
 *
 * ⚠️ AND THE FIX IS NOT A SLOWER EMA. Slowing the smoothing to survive an outlier makes the pick-up
 * lag, and a grab that does not close the instant the fingers do reads as the gesture having failed —
 * so the child pinches again, and now there are two grabs. Confirming only the RELEASE is the honest
 * expression of the asymmetry this reading is built around: closing is immediate because a false grab
 * costs one extra pinch, and opening is deliberate because a false release costs the answer.
 *
 * Three frames is ~100–300 ms at the 10–30 fps this loop really runs at — far below any intentional
 * open, far above a one-frame spike.
 */
export const RELEASE_FRAMES = 3

export interface PinchState {
  /** whether the child is currently holding a piece */
  held: boolean
  /** consecutive frames read as open while holding — a release must be SUSTAINED, see RELEASE_FRAMES */
  opening: number
  /** the smoothed ratio, or null when nothing has been read yet */
  ema: number | null
  /** consecutive frames with no usable hand, so a blur mid-carry does not drop the piece */
  lost: number
  /**
   * How many times a grab has CLOSED since the reader started — monotone within a detector session.
   *
   * ⚠️ MONOTONE WITHIN A SESSION, NOT ACROSS A CHAPTER, exactly like `sweeps`: `useTaps()` and a
   * camera restart both reset the reading, so a consumer diffs it against a baseline and MUST clamp
   * a backwards jump, or one "Try the camera again" strands the baseline above the counter and the
   * gesture is dead for the rest of the run.
   */
  grabs: number
}

export const PINCH_START: PinchState = { held: false, opening: 0, ema: null, lost: 0, grabs: 0 }

/**
 * One frame. PURE, so the gate drives the same function the camera drives — a check carrying its own
 * copy of a rule cannot see the rule being removed, which is this repo's own recorded fault.
 *
 * `r === null` means no usable hand (none in frame, or too far to read). Past `LOST_GRACE` a held
 * grab is released, which is the deliberate bias: continuing to "hold" a piece for a hand that has
 * genuinely gone leaves the chapter waiting for a drop that can never come.
 */
export function stepPinch(s: PinchState, r: number | null): PinchState {
  if (r === null) {
    const lost = s.lost + 1
    if (lost < LOST_GRACE) return s.lost === lost ? s : { ...s, lost }
    return s.held || s.ema !== null ? { held: false, opening: 0, ema: null, lost, grabs: s.grabs } : { ...s, lost }
  }
  const ema = s.ema === null ? r : s.ema + (r - s.ema) * PINCH_EMA
  // Boundaries inclusive, so a value sitting exactly on a threshold reads deterministically.
  if (!s.held) {
    const held = ema <= GRAB_ON
    return { held, opening: 0, ema, lost: 0, grabs: held ? s.grabs + 1 : s.grabs }
  }
  // Holding: an open reading only counts once it has been SUSTAINED, and any frame back inside the
  // grab resets the count — so a spike is forgotten rather than accumulated across a whole carry.
  const opening = ema >= GRAB_OFF ? s.opening + 1 : 0
  return { held: opening < RELEASE_FRAMES, opening, ema, lost: 0, grabs: s.grabs }
}

/**
 * What the hook's change test compares.
 *
 * ⚠️ THE HELD FLAG IS IN IT BECAUSE THE CHAPTER'S INSTRUCTION BRANCHES ON IT — *"pinch to pick one
 * up"* against *"open your fingers to drop it"* — and a child who cannot see which state they are in
 * gets silence, which is The Fitting Crew's `handHint` lesson.
 *
 * ⚠️ THE RATIO IS NOT IN IT, and that is deliberate rather than an omission. It is continuous, so
 * keying on it fires the chapter's whole tree at frame rate for a hand that is merely open — the
 * cost `useFingerCounter` documents for the tilt and `quantArm`/`quantSlide` exist to avoid. Nothing
 * downstream consumes the raw ratio: what the chapter needs is *are you holding* and *where*, and
 * the position arrives on its own key.
 */
export const pinchKey = (s: PinchState) => `${s.held ? 1 : 0}/${s.grabs}`
