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
