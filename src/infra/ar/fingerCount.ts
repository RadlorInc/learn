/**
 * Extract extended-finger info from MediaPipe Hand landmarks (21 points / hand).
 *
 * Landmark indices: 0 = wrist; thumb 1-4 (4 = tip, 3 = ip); index 5-8 (8 tip,
 * 6 pip, 5 mcp); middle 9-12; ring 13-16; pinky 17-20. Coords are normalised
 * 0..1 in the ORIGINAL (un-mirrored) frame; y grows DOWN.
 *
 * Coarse, forgiving heuristic — good enough to count a child's raised fingers.
 */

export interface Landmark { x: number; y: number; z: number }

/** finger: 0=thumb 1=index 2=middle 3=ring 4=pinky. x,y normalised (tip). */
export interface FingerTip { finger: number; x: number; y: number }

export function extendedFingerTips(lm: Landmark[], handedness: string): FingerTip[] {
  if (!lm || lm.length < 21) return []
  const tips: FingerTip[] = []

  // Index → pinky [fingerId, tip, pip, mcp]. Extended only when the tip is clearly
  // above BOTH the middle joint (pip) AND the base knuckle (mcp) — requiring
  // tip<mcp rejects a relaxed / half-curled finger that clears only the pip.
  const fingers: [number, number, number, number][] = [
    [1, 8, 6, 5], [2, 12, 10, 9], [3, 16, 14, 13], [4, 20, 18, 17],
  ]
  for (const [finger, tip, pip, mcp] of fingers) {
    if (lm[tip].y < lm[pip].y && lm[tip].y < lm[mcp].y) {
      tips.push({ finger, x: lm[tip].x, y: lm[tip].y })
    }
  }

  // Thumb (finger 0): handedness-free — extended when the tip is farther from the
  // pinky knuckle (17) than its IP joint (3) is, i.e. splayed outward not tucked.
  const d = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y)
  if (d(lm[4], lm[17]) > d(lm[3], lm[17])) tips.push({ finger: 0, x: lm[4].x, y: lm[4].y })

  return tips
}

/**
 * 👍 — the four fingers curled and the thumb pointing UP. A COMMIT, not a value.
 *
 * The Order Desk's board used to be put up by pressing a button, and the founder replaced that with
 * this: a child who has carried every digit into its column says so with their hand rather than
 * reaching for a control. It is the right shape for a commit because it is a POSE nobody strikes by
 * accident, unlike a count or a position, which drift through every value on the way to the one they
 * mean.
 *
 * ⚠️ **IT MUST NOT COLLIDE WITH THE FIST THAT GRABS**, and the separation is the thumb's HEIGHT
 * rather than its extension. A fist wraps the thumb across the fingers, so its tip sits level with
 * its own knuckle; a thumbs-up carries it most of a thumb's length clear. `THUMB_UP_LIFT` is set well
 * under a fully vertical thumb (~0.6 of palm length) so a nine-year-old's approximate one still
 * reads, and well over a wrapped one. The chapter adds the other half of the guard for free: the
 * commit is only offered when the board is FULL, i.e. when nothing is left to pick up.
 *
 * ⚠️ AND IT IS A POSE, SO IT IS MEASURED AGAINST THE HAND'S OWN SIZE, never in frame units — a lift
 * threshold in raw normalized units means "commit" at one seating distance and silence at another,
 * which is the whole argument `pinch.ts` opens with.
 *
 * ⚠️ CURL IS TESTED AGAINST EACH FINGER'S OWN KNUCKLE (`tip` at or below `mcp`), which is the exact
 * inverse of the extension test above rather than a second, differently-tuned idea. It is a `y`
 * comparison, so it assumes an upright hand — which a thumbs-up is by definition.
 */
export const THUMB_UP_LIFT = 0.4

// ⚠️ 2-D, like every reading in `pinch.ts` and for its reason: MediaPipe's `z` is wrist-relative and
// by far its noisiest channel, so the parameter asks for no more than this actually uses.
export function thumbsUp(lm: { x: number; y: number }[] | undefined): boolean {
  if (!lm || lm.length < 21) return false
  const palm = Math.hypot(lm[9].x - lm[0].x, lm[9].y - lm[0].y)
  if (palm < 0.06) return false          // too far away to read — same gate as `pinch.ts`
  // every finger curled: a tip ABOVE its knuckle (y grows down) is extended, which this is not
  for (const [tip, mcp] of [[8, 5], [12, 9], [16, 13], [20, 17]]) {
    if (lm[tip].y < lm[mcp].y) return false
  }
  // and the thumb clear of its own knuckle, upward
  return lm[2].y - lm[4].y > palm * THUMB_UP_LIFT
}

/**
 * The angle of the PALM, as an AXIS in [0,180). 0° is flat to the right, 90° is straight up.
 *
 * Measured in MIRRORED screen space, because that is the frame the child is looking at — the
 * self-view is `scaleX(-1)` and handedness is exactly the thing a nine-year-old gets confused by.
 *
 * ⚠️ Wrist (0) → middle-finger KNUCKLE (9), never a fingertip: both of those sit on the rigid palm,
 * so the reading does not swing when the fingers curl. A tilt that moved when you closed your hand
 * would be unusable in a chapter that also wants a fist.
 *
 * ⚠️ FOLDED TO [0,180) BECAUSE AN AXIS HAS NO HEAD OR TAIL, and that is what lets ONE reading serve
 * both instruments this band needs: a beam at 200° IS a beam at 20°, and a fold line at 200° IS the
 * fold line at 20°.
 */
export function palmTilt(lm: Landmark[]): number | null {
  if (!lm || lm.length < 10) return null
  const dx = -(lm[9].x - lm[0].x)   // mirrored
  const dy = -(lm[9].y - lm[0].y)   // y grows DOWN in the frame; flip it for maths orientation
  if (!dx && !dy) return null
  return norm180((Math.atan2(dy, dx) * 180) / Math.PI)
}

export const norm180 = (a: number) => ((a % 180) + 180) % 180

// ─── the two-hand span — reading G, "a length shown with the arms" ─────────────────────
/**
 * How wide the palm is, across the knuckles — index MCP (5) to pinky MCP (17), in frame fractions.
 *
 * ⚠️ THIS IS THE RULER, AND IT IS WHAT MAKES A SPAN MEAN ANYTHING AT ALL. A distance in frame
 * fractions is not a length: lean back and every measurement shrinks together. The hand is measured
 * in the SAME frame and scales with distance identically, so `span ÷ handWidth` is invariant to how
 * far the child is sitting from the camera and needs no calibration step.
 *
 * ⚠️ ACROSS THE KNUCKLES RATHER THAN ALONG A FINGER, for `palmTilt`'s reason: both landmarks sit on
 * the RIGID palm, so the ruler does not change length when the child opens or closes their fingers —
 * and they will, because a hand held up to show a width is not held in any particular pose.
 */
export function handWidth(lm: { x: number; y: number }[] | undefined): number | null {
  if (!lm || lm.length < 18) return null
  const w = Math.hypot(lm[5].x - lm[17].x, lm[5].y - lm[17].y)
  return w > 0 ? w : null
}

/**
 * The gap between two hands, in frame fractions — palm centre to palm centre.
 *
 * ⚠️ MEASURED KNUCKLE TO KNUCKLE (9 ↔ 9), NOT FINGERTIP TO FINGERTIP. The tips are the two noisiest
 * landmarks MediaPipe produces and they move with the pose; the middle knuckle is on the rigid palm.
 * The constant offset that leaves (roughly one palm thickness at each end) is the same on every
 * reading, which is what a nominal hand size absorbs.
 */
export function palmSpan(all: { x: number; y: number }[][] | undefined): number | null {
  if (!all || all.length < 2 || !all[0]?.[9] || !all[1]?.[9]) return null
  return Math.hypot(all[0][9].x - all[1][9].x, all[0][9].y - all[1][9].y)
}

/** The mean width of the hands in frame — the ruler, averaged so one bad hand does not set it. */
export function meanHandWidth(all: { x: number; y: number }[][] | undefined): number | null {
  const ws = (all ?? []).map(handWidth).filter((w): w is number => w !== null)
  return ws.length ? ws.reduce((a, b) => a + b, 0) / ws.length : null
}

/**
 * The whole reading, in one place: the gap between the hands measured in the child's own hand widths.
 *
 * ⚠️ IT IS A FUNCTION RATHER THAN TWO LINES IN THE DETECT LOOP, AND THAT IS WHAT MAKES IT GATEABLE.
 * Written inline, the only way to check the division was for a test to do the division itself — i.e.
 * a gate re-implementing the rule, which cannot see the rule being REMOVED. Mutation-tested: dropping
 * `/ hw` in the loop left the invariance test perfectly green, because the test was proving its own
 * arithmetic rather than the detector's.
 */
export function spanRatio(all: { x: number; y: number }[][] | undefined): number | null {
  const d = palmSpan(all), hw = meanHandWidth(all)
  return d !== null && hw ? d / hw : null
}

/**
 * ⚠️ THE SPAN IS QUANTIZED FOR THE CHANGE TEST AND RAW FOR THE CONSUMER. It is continuous, so an
 * unquantized key fires `onRead` at frame rate and re-renders the chapter ~30×/s for a hand that has
 * not really moved. 40 steps over the reachable range is finer than the noise and coarse enough that
 * a still hand is still.
 */
export const SPAN_STEPS = 40
export const quantSpan = (v: number | null) => (v === null ? '-' : String(Math.round(v * SPAN_STEPS)))
