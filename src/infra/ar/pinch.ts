/**
 * THE FIST-GRAB — the whole hand closing on a thing, read as HOLD / RELEASE (reading **E**).
 *
 * The Order Desk's own verb is LOAD THE ORDER: a digit is picked up and put into the column for its
 * place. Done with the hand, the child physically carries a hundred into the hundreds column, so the
 * place-value decision is made with the body instead of watched. That is the test chapter-craft §5
 * sets — *a grab used as a cursor is a mouse with extra steps and a permission prompt* — and it is
 * passed here only because the DROP CHOOSES THE COLUMN. If the grab were merely how you press a
 * supply button, it would not ship.
 *
 * ⚠️ **IT WAS A THUMB-AND-INDEX PINCH AND THE FOUNDER REPLACED IT — "pinch sahi naii hai".** A pinch
 * is a fine-motor pose: it asks a nine-year-old to hold two specific fingertips within a third of
 * their palm of each other *while moving their whole arm across the screen*, and it is read from the
 * two noisiest landmarks MediaPipe produces. Closing the WHOLE HAND is what a child already does to
 * pick something up, it is unmistakable at any camera distance, and — see `fistRatio` — averaging
 * four fingertips instead of differencing two makes the reading roughly half as noisy for free.
 * Everything else in this file is unchanged: the state machine, the hysteresis, the sustained
 * release and the lost-frame grace were never about which fingers were closing.
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

/** The four fingertips that curl into the palm. The thumb is deliberately not among them — see below. */
const TIPS = [8, 12, 16, 20]
/** Wrist and middle-finger knuckle — the rigid palm, and the reference length. */
const WRIST = 0
const MID_MCP = 9

const d2 = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

/**
 * HOW CLOSED THE HAND IS: the mean fingertip→knuckle distance as a share of PALM LENGTH, or null
 * when there is no usable hand. Small is a fist; large is an open hand.
 *
 * ⚠️ THE REFERENCE IS WRIST → MIDDLE KNUCKLE, WHICH IS THE PAIR `palmTilt` AND `palmRead` ALREADY USE,
 * and for the identical reason: both points sit on the RIGID palm, so the reference does not change
 * when the fingers curl. That property is the whole point here rather than a nicety — a reference
 * taken along a finger would SHRINK as the child closes their hand and partially cancel the very
 * signal being measured, leaving a reading that barely moves.
 *
 * ⚠️ FOUR TIPS AVERAGED, NOT ONE PAIR DIFFERENCED, AND THAT IS WHY THE FIST IS A QUIETER READING THAN
 * THE PINCH IT REPLACED. Fingertips are the noisiest landmarks MediaPipe produces (~±0.02 of frame
 * width). A gap between two of them carries √2 × that; a mean of four carries half of it — so the
 * residual after the EMA is roughly a QUARTER of what the pinch had to survive, on a gesture that is
 * also far easier for a child to hold. The band below did not have to move to buy that.
 *
 * ⚠️ AND THE THUMB IS NOT IN IT. It closes ACROSS the fingers rather than into the palm, so its
 * distance to the middle knuckle barely changes between a fist and an open hand — including it would
 * add a term that is nearly constant and dilute the signal. It is also the one digit that has to stay
 * free to mean something else: see `thumbsUp` in `fingerCount.ts`, which is this chapter's commit.
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
 * the drop height, so a posture gate on it would clamp which column the child can reach.
 */
export function fistRatio(lm: { x: number; y: number }[] | undefined): number | null {
  if (!lm || lm.length <= TIPS[TIPS.length - 1]) return null
  const palm = d2(lm[WRIST], lm[MID_MCP])
  if (palm < PINCH_MIN_PALM) return null
  return TIPS.reduce((s, t) => s + d2(lm[t], lm[MID_MCP]), 0) / (TIPS.length * palm)
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
 * ⚠️ SMOOTHED BEFORE THE THRESHOLD. Fingertips are the noisiest landmarks MediaPipe produces — the
 * palm points `sweep.ts` is sized against jitter by ~±0.02 of frame width and tips are worse.
 * Averaging four of them halves that to ~±0.01, and dividing by a palm of ~0.13 leaves ~±0.08 in
 * ratio units raw; the EMA takes the residual to ~±0.02, which the 0.18 band clears many times over.
 * ⚠️ **THOSE NUMBERS ARE THE FIST'S, NOT THE PINCH'S** — the pinch differenced two tips and arrived
 * at ~±0.2 raw, so this constant used to be carrying the whole band on its own. It is kept because it
 * still costs one multiply and there is no reason to make the reading twitchier than it needs to be.
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
 * ⚠️ **THE TWO NUMBERS DID NOT MOVE WHEN THE GESTURE CHANGED FROM A PINCH TO A FIST, AND THAT IS
 * ARITHMETIC RATHER THAN LUCK.** The physical range is simply different in the same place. A fist
 * curls every fingertip down onto the palm, ~0.3–0.4 of palm length from the middle knuckle; a
 * relaxed half-open hand sits ~0.55–0.65; a flat open hand ~0.8–0.9 (the middle finger is about as
 * long as the palm). So 0.50 is reached by a decent curl rather than a clenched one — a child who
 * closes their hand and believes they have grabbed something gets it, which is the whole point of the
 * change — and 0.68 needs a genuine open. A RESTING hand falls between the two, which is exactly
 * right: it neither picks anything up nor drops what it is carrying.
 *
 * ⚠️ **AND THE BAND'S COVER IS BETTER THAN IT WAS**, because `fistRatio` averages four tips instead of
 * differencing two — the EMA's residual is ~±0.02 in ratio units against the pinch's ~±0.09, so the
 * 0.18 band is now roughly nine residuals wide rather than two. What still makes the ASYMMETRY safe
 * is unchanged: `RELEASE_FRAMES` requires three consecutive open frames, so the expensive failure (a
 * digit dropped mid-carry into the wrong column) needs a sustained open, while the cheap one (a grab
 * that closes a little eagerly) costs one more attempt.
 */
export const GRAB_ON = 0.50
export const GRAB_OFF = 0.68

/**
 * ⚠️ DETECTION LOSS IS CORRELATED WITH THE GESTURE, which is `sweep.ts`'s finding applying verbatim:
 * a hand carrying a piece across the frame is precisely the motion-blurred one whose landmarks
 * MediaPipe drops, and the moment it drops is the moment a grab would be released — into the wrong
 * bay. So a held grab rides out a few lost frames. An OPEN hand needs no such grace: nothing is
 * being carried, so losing it costs nothing.
 *
 * ⚠️ **IT IS 12 RATHER THAN 5 AND THE NUMBER WAS DERIVED FOR A PEN, WHICH NO LONGER EXISTS.** The
 * chapter that needed it wrote digits in the air, and writing is fast, so the hand was blurred for
 * most of a numeral; at the 10–30 fps this loop really runs, 5 frames is only ~170–500 ms of cover,
 * and past it the pen LIFTED — which did not merely stop the ink, it ENDED THE STROKE and the
 * numeral came out as a row of disconnected pieces. That was the founder's *"dotted stroke"*.
 *
 * ⚠️ THE VERB IS NOW A CARRY, WHICH IS A GENTLER CASE, AND 12 IS KEPT DELIBERATELY: a carried piece
 * dropped mid-flight lands in whatever column the hand was over, which is the wrong answer this
 * whole file is asymmetric to avoid. 12 frames is ~0.4–1.2 s of holding on through a lost hand; a
 * child who genuinely opens their fingers is caught by `RELEASE_FRAMES` on a hand that is still
 * THERE, so the grace never delays a real release. **It has not been checked against a real hand.**
 */
export const LOST_GRACE = 12

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
 * ⚠️ THE HELD FLAG IS IN IT BECAUSE THE CHAPTER'S INSTRUCTION BRANCHES ON IT — *"close your hand on a
 * digit"* against *"open your hand to drop it"* — and a child who cannot see which state they are in
 * gets silence, which is The Fitting Crew's `handHint` lesson.
 *
 * ⚠️ THE RATIO IS NOT IN IT, and that is deliberate rather than an omission. It is continuous, so
 * keying on it fires the chapter's whole tree at frame rate for a hand that is merely open — the
 * cost `useFingerCounter` documents for the tilt and `quantArm`/`quantSlide` exist to avoid. Nothing
 * downstream consumes the raw ratio: what the chapter needs is *are you holding* and *where*, and
 * the position arrives on its own key.
 */
export const pinchKey = (s: PinchState) => `${s.held ? 1 : 0}/${s.grabs}`

/**
 * THE GRIP POINT — where the hand is holding, MIRRORED to match the self-view, or null when there is
 * no usable hand. It is the middle-finger KNUCKLE, i.e. the centre of the palm.
 *
 * ⚠️ **IT IS ON THE RIGID PALM, WHICH IS THE WHOLE REASON IT IS NOT A FINGERTIP.** The old pen point
 * was the thumb/index midpoint, and this chapter's own `handPoint` already documents the consequence:
 * closing the fingers MOVES the carry point, so the pick-up landed a few percent away from where the
 * child was aiming. With a fist that is far worse — every fingertip travels most of a palm length on
 * the way in — so a carry point taken from the fingers would jump the moment the grab closed and
 * again the moment it opened, which is precisely the two instants that decide WHICH TILE and WHICH
 * COLUMN. The knuckle does not move when the hand closes, so the aim is the same before, during and
 * after the grab.
 *
 * ⚠️ MIRRORED HERE, ONCE, exactly like `palmRead`. The preview is flipped so a child moving their
 * hand right sees the mark go right; left unmirrored, reaching for the thousands moves toward the
 * ones and the gesture reads as broken rather than as backwards.
 *
 * ⚠️ IT SHARES `PINCH_MIN_PALM` WITH `fistRatio` deliberately. A hand too small in frame to give a
 * trustworthy grab reading is also too small to aim with — two thresholds for one "is this hand
 * usable" question would drift, and the grab state and the grab position must appear and disappear
 * together or a carry starts before there is anywhere to carry from.
 */
export function gripPoint(lm: { x: number; y: number }[] | undefined): { x: number; y: number } | null {
  if (!lm || lm.length <= MID_MCP) return null
  if (d2(lm[WRIST], lm[MID_MCP]) < PINCH_MIN_PALM) return null
  return { x: 1 - lm[MID_MCP].x, y: lm[MID_MCP].y }
}
