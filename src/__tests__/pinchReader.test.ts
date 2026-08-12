/**
 * THE FIST-GRAB READER — reading **E**, the whole hand closing on a thing.
 *
 * A webcam cannot be driven by a gate, so this drives the PURE functions the camera drives and is the
 * only place this reading can be checked at all. Everything here is synthetic landmark sets and
 * synthetic ratio tracks. ⚠️ The tracks below are RATIO values fed straight to the state machine, so
 * some of them (1.3, 2.0) are outside any pose a hand can strike — they are there to exercise the
 * machine and the outlier path, not to describe a hand.
 *
 * The claim each block defends is written down, because a check whose intent is not stated gets
 * "fixed" by loosening it the first time it fails.
 */
import { describe, it, expect } from 'vitest'
import {
  fistRatio, gripPoint, stepPinch, pinchKey, PINCH_START,
  GRAB_ON, GRAB_OFF, PINCH_EMA, PINCH_MIN_PALM, LOST_GRACE,
} from '@/infra/ar/pinch'
import { thumbsUp } from '@/infra/ar/fingerCount'

/**
 * A synthetic hand. `palm` is the wrist→middle-knuckle length and `curl` how far the fingertips sit
 * from the knuckle as a share of it — ~0.35 is a fist, ~0.85 an open hand — both in frame-width
 * units, so a test can pose a hand at any distance from the camera.
 */
function hand(palm: number, curl: number) {
  const lm = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5 }))
  lm[0] = { x: 0.5, y: 0.5 }              // wrist
  lm[9] = { x: 0.5, y: 0.5 - palm }       // middle knuckle
  lm[4] = { x: 0.5 - palm * 0.6, y: 0.5 } // thumb tip, out to the side
  // the four fingertips, fanned around straight up at exactly `curl` palms from the knuckle
  const r = palm * curl
  ;[8, 12, 16, 20].forEach((t, i) => {
    const a = -Math.PI / 2 + (i - 1.5) * 0.25
    lm[t] = { x: lm[9].x + Math.cos(a) * r, y: lm[9].y + Math.sin(a) * r }
  })
  return lm
}

/** Run a constant ratio until the EMA has settled, so a threshold claim is about the pose not the lag. */
const settle = (r: number, from = PINCH_START, n = 40) => {
  let s = from
  for (let k = 0; k < n; k++) s = stepPinch(s, r)
  return s
}

describe('fistRatio — the reading is a RATIO, which is what makes it work at all', () => {
  /**
   * ⚠️ THE CLAIM THE WHOLE MODULE RESTS ON. Landmarks are normalized to frame width, so any raw length
   * scales as 1/d — measured on the geometry sweep.ts assumes, a 2 cm length reads 0.043 at 40 cm and
   * 0.025 at 70 cm, and 2 cm at 40 cm is INDISTINGUISHABLE from 3.5 cm at 70 cm. Dividing by a length
   * from the same hand in the same frame cancels the term exactly.
   */
  it('the same pose at any distance from the camera reads the same', () => {
    // one pose (tips at 30% of palm), four seating distances — the palm shrinks, the ratio must not
    const seen = [0.20, 0.14, 0.10, 0.07].map(palm => fistRatio(hand(palm, 0.3))!)
    for (const r of seen) expect(r).toBeCloseTo(0.3, 6)
  })

  it('a fist and an open hand read differently at the SAME distance', () => {
    const fist = fistRatio(hand(0.14, 0.35))!
    const open = fistRatio(hand(0.14, 0.85))!
    // and they land the two sides of the band, which is the claim the thresholds depend on
    expect(fist).toBeLessThan(GRAB_ON)
    expect(open).toBeGreaterThan(GRAB_OFF)
  })

  /**
   * ⚠️ THE THUMB IS DELIBERATELY NOT IN IT, and this is the check that keeps the two gestures apart.
   * The commit is a 👍 — a closed hand with the thumb raised — so if the thumb were one of the tips
   * being averaged, striking the commit pose would change the grab reading and the two would fight.
   * It is also nearly constant between a fist and an open hand, so including it would only dilute.
   */
  it('the thumb does not move the reading — it is left free to mean 👍', () => {
    const closed = hand(0.14, 0.35)
    const thumbUp = closed.map((p, i) => (i === 4 ? { x: 0.5, y: 0.5 - 0.14 * 1.4 } : p))
    expect(fistRatio(thumbUp)).toBeCloseTo(fistRatio(closed)!, 9)
  })

  /**
   * ⚠️ THE REFERENCE MUST NOT MOVE WHEN THE FINGERS DO. Wrist→middle-knuckle is on the rigid palm, so
   * closing the hand changes the numerator and leaves the divisor alone. A reference taken along a
   * finger would shrink as the child closes and cancel the signal being measured.
   */
  it('the reference length is unaffected by the closing itself', () => {
    const open = fistRatio(hand(0.14, 0.9))!
    const tight = fistRatio(hand(0.14, 0.3))!
    // the divisor is identical, so the readings differ by exactly the curl ratio
    expect(open / tight).toBeCloseTo(0.9 / 0.3, 6)
  })

  it('a hand too far away to read reports NOTHING rather than a confident wrong answer', () => {
    expect(fistRatio(hand(PINCH_MIN_PALM - 0.005, 0.35))).toBeNull()
    expect(fistRatio(hand(PINCH_MIN_PALM + 0.02, 0.35))).not.toBeNull()
  })

  it('no hand, or a truncated landmark set, is null rather than a throw', () => {
    // a throw in the detect loop is unrecoverable — it has no try/catch and never reschedules
    expect(fistRatio(undefined)).toBeNull()
    expect(fistRatio([])).toBeNull()
    expect(fistRatio(Array.from({ length: 5 }, () => ({ x: 0.5, y: 0.5 })))).toBeNull()
    // ⚠️ and a set that stops SHORT OF THE PINKY TIP, which is the one this reading added
    expect(fistRatio(Array.from({ length: 13 }, () => ({ x: 0.5, y: 0.5 })))).toBeNull()
  })
})

/**
 * ⚠️ THE CARRY POINT IS ON THE RIGID PALM, WHICH IS THE WHOLE REASON IT IS NOT A FINGERTIP. The pick-up
 * and the drop are decided at the two instants the hand CHANGES SHAPE, so a point taken from the
 * fingers moves exactly when it must not — and with a fist every fingertip travels most of a palm
 * length on the way in.
 */
describe('gripPoint — where the hand is holding', () => {
  it('does not move when the hand opens and closes', () => {
    const a = gripPoint(hand(0.14, 0.35))!
    const b = gripPoint(hand(0.14, 0.9))!
    expect(a.x).toBeCloseTo(b.x, 9)
    expect(a.y).toBeCloseTo(b.y, 9)
  })

  it('is mirrored, so reaching right moves right on the self-view', () => {
    const lm = hand(0.14, 0.35)
    lm[9] = { x: 0.8, y: 0.3 }
    expect(gripPoint(lm)!.x).toBeCloseTo(0.2, 9)
  })

  it('shares the too-far-away gate with the ratio, so state and position appear together', () => {
    expect(gripPoint(hand(PINCH_MIN_PALM - 0.005, 0.35))).toBeNull()
    expect(fistRatio(hand(PINCH_MIN_PALM - 0.005, 0.35))).toBeNull()
  })
})

describe('stepPinch — hysteresis, and its asymmetry', () => {
  it('a decisive close grabs, and a decisive open releases', () => {
    const held = settle(0.25)
    expect(held.held).toBe(true)
    expect(settle(1.2, held).held).toBe(false)
  })

  /**
   * ⚠️ THE DEAD-BUTTON CASE, and the reason there are two thresholds rather than one. A hand held at a
   * single threshold dithers for ever, so the piece is picked up and dropped repeatedly and nothing
   * can ever be placed. Swept across the whole band so the claim is not about one lucky value.
   */
  it('a hand held anywhere inside the band never changes state on its own', () => {
    for (let r = GRAB_ON + 0.01; r < GRAB_OFF; r += 0.01) {
      for (const start of [settle(0.2), settle(1.3)]) {
        const was = start.held
        let s = start
        for (let k = 0; k < 40; k++) s = stepPinch(s, r)
        expect(s.held, `held=${was} at ratio ${r.toFixed(2)}`).toBe(was)
      }
    }
  })

  /**
   * ⚠️ THE ASYMMETRY IS THE POINT, AND IT IS NOT THE SWEEP'S. The two failures are not equal: a false
   * RELEASE mid-carry drops the pledge into whatever bay the hand is over — a wrong answer the chapter
   * caused — while a false GRAB picks up nothing and costs one more pinch. So once holding, it takes a
   * decisively wider opening to let go than it took to close.
   */
  it('is biased toward holding on: the release threshold is well above the grab one', () => {
    expect(GRAB_OFF).toBeGreaterThan(GRAB_ON)
    /**
     * And the gap is wide enough to be a real band rather than a rounding difference.
     *
     * ⚠️ **0.2 → 0.15 WHEN `GRAB_ON` WENT 0.42 → 0.50 (founder: pinching was too hard), AND THE
     * FLOOR IS NOW STATED AGAINST THE THING IT PROTECTS RATHER THAN AS A ROUND NUMBER.** What a band
     * has to clear is the EMA's steady-state residual — ~±0.09 in ratio units at `PINCH_EMA` 0.35 —
     * or a hand sitting in it dithers and nothing can be placed. 0.15 keeps a clear margin over that.
     * ⚠️ This literal was only ever a PROXY: the property itself is checked empirically two tests
     * down, where a settled hold at the band's centre survives 400 frames of the ±0.2 jitter this
     * module's own docstring derives. Loosening the proxy without that would be the "gate that moves
     * with the mutation" fault; the real check is the one that did not move.
     */
    expect(GRAB_OFF - GRAB_ON).toBeGreaterThan(0.15)
  })

  it('a hand at the grab threshold does not release, and one at the release threshold does not grab', () => {
    expect(settle(GRAB_ON).held).toBe(true)
    expect(settle(GRAB_OFF, PINCH_START).held).toBe(false)
  })

  /**
   * ⚠️ DETECTION LOSS IS CORRELATED WITH THE GESTURE — a hand carrying a piece across the frame is
   * precisely the motion-blurred one MediaPipe drops, so the moment it drops is the moment a grab
   * would release, into the wrong bay.
   */
  it('a held grab rides out a blur, but a hand that has really gone does release', () => {
    // ⚠️ CONCRETE FRAME COUNTS, NOT `LOST_GRACE - 1`. Written in terms of the constant, this test
    // MOVES WITH the mutation — setting LOST_GRACE to 1 makes the loop run zero times and the check
    // passes while a single dropped frame throws the piece away. A gate that re-derives the rule it
    // is guarding cannot see the rule change; that is this repo's own most-repeated recorded fault,
    // met here in miniature.
    let s = settle(0.25)
    expect(s.held).toBe(true)
    for (let k = 0; k < 3; k++) s = stepPinch(s, null)
    expect(s.held, 'dropped the piece on a 3-frame motion blur').toBe(true)
    for (let k = 0; k < 30; k++) s = stepPinch(s, null)
    expect(s.held, 'still holding for a hand that has gone').toBe(false)
    // …and the grace has to be long enough to cover a blur at the frame rates this loop really runs
    expect(LOST_GRACE).toBeGreaterThanOrEqual(3)
  })

  /**
   * ⚠️ THE PEN'S OWN CASE, AND IT IS STRICTER THAN THE CARRY'S. A lift does not just stop the ink,
   * it ENDS THE STROKE — so every dropped-frame burst longer than the grace cuts the numeral into a
   * separate piece and the line comes out dotted. Writing is fast, so the hand is blurred for most
   * of a digit; at the 10–30 fps this loop really runs, a 10-frame burst is only ~0.3–1 s.
   */
  it('a pen stroke survives a 10-frame blur burst mid-digit', () => {
    let s = settle(0.25)
    for (let k = 0; k < 10; k++) s = stepPinch(s, null)
    expect(s.held, 'the stroke broke on a blur — the numeral draws as dots').toBe(true)
    // and it carries straight on writing when the hand comes back, in the SAME stroke
    s = stepPinch(s, 0.25)
    expect(s.held).toBe(true)
  })

  it('one wild outlier frame cannot drop the piece', () => {
    const held = settle(0.25)
    // a fingertip mis-detection — the noisiest landmark MediaPipe produces
    expect(stepPinch(held, 2.0).held).toBe(true)
  })

  /**
   * ⚠️ THE SMOOTHING EARNS ITS PLACE ON A LONG CARRY, NOT ON ONE SPIKE — and the first version of this
   * test could not see that, so removing the EMA entirely SURVIVED it. The sustained-release rule
   * already covers a single outlier by itself; what only the EMA covers is a hand held part-way
   * through the band while realistic jitter runs for the length of a carry, where an unsmoothed
   * reading eventually throws three consecutive highs and drops the pledge into the wrong bay.
   *
   * Deterministic pseudo-random rather than alternating, because strict alternation can never produce
   * a run of three and would pass with the smoothing deleted — the run is the whole hazard.
   */
  it('a hand held mid-band survives a carry-long run of realistic jitter', () => {
    let seed = 12345
    const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296
    // ⚠️ CLOSE FIRST, THEN RELAX — you cannot be "holding mid-band" from a standing start, because
    // mid-band is above GRAB_ON and never grabs. The first version of this test settled straight to
    // 0.58, so `held` was false from the first line and the check failed for every run — INCLUDING
    // every mutation, which a permanently-failing test reports as "caught". That made a 9/9 mutation
    // score worthless evidence. The physical sequence is: pinch shut, then let the fingers relax a
    // little while carrying, which is where the band's slack is actually spent.
    let s = settle(0.58, settle(0.25))
    expect(s.held).toBe(true)
    // ⚠️ ±0.2 raw is the PINCH's jitter — a difference of two tips. The fist averages four and runs
    // at about a quarter of that, so this is now a deliberately harsher floor than the reading
    // actually faces. Left as it is: a check is not loosened because the code got better at it.
    for (let k = 0; k < 400; k++) {
      s = stepPinch(s, 0.58 + (rnd() - 0.5) * 0.4)
      if (!s.held) break
    }
    expect(s.held, 'jitter alone released the grab mid-carry').toBe(true)
    expect(PINCH_EMA).toBeLessThan(1)
  })

  it('the counter rises once per CLOSE, never per frame held', () => {
    let s = settle(0.25)
    expect(s.grabs).toBe(1)
    for (let k = 0; k < 30; k++) s = stepPinch(s, 0.25)
    expect(s.grabs, 'a held grab counted more than once').toBe(1)
    s = settle(1.3, s)
    s = settle(0.25, s)
    expect(s.grabs).toBe(2)
  })

  it('a camera restart resets it — which is why a consumer must clamp backwards', () => {
    const s = settle(0.25)
    expect(s.grabs).toBe(1)
    expect(PINCH_START.grabs).toBe(0)
  })
})

describe('the change test', () => {
  it('a hand held still is ONE key', () => {
    let s = settle(0.25)
    const keys = new Set<string>()
    for (let k = 0; k < 30; k++) { s = stepPinch(s, 0.25 + (k % 2 ? 0.01 : -0.01)); keys.add(pinchKey(s)) }
    expect(keys.size).toBe(1)
  })

  /**
   * ⚠️ THE HELD FLAG IS IN THE KEY BECAUSE THE CHAPTER'S INSTRUCTION BRANCHES ON IT — "pinch to pick
   * one up" against "open your fingers to drop it". A child who cannot see which state they are in
   * gets silence, which is The Fitting Crew's handHint lesson.
   */
  it('picking up and putting down are different keys', () => {
    const open = settle(1.3)
    const held = settle(0.25, open)
    expect(pinchKey(held)).not.toBe(pinchKey(open))
  })

  it('the raw ratio is NOT in the key — an open hand must not re-render at frame rate', () => {
    // two clearly different open positions, both released: same key, because nothing has happened
    const a = settle(1.0)
    const b = settle(1.4, a)
    expect(a.held).toBe(false); expect(b.held).toBe(false)
    expect(pinchKey(b)).toBe(pinchKey(a))
  })
})

/**
 * 👍 — THE COMMIT POSE.
 *
 * ⚠️ THE ONE CLAIM THAT MATTERS IS SEPARATION FROM THE FIST THAT GRABS. Both are closed hands, so if
 * a grabbing fist read as a thumbs-up the chapter would put a half-built board up while the child was
 * still carrying a digit. The chapter adds the other half of the guard (the commit is only offered
 * when the board is FULL), but a pose that cannot be told apart is not something to lean on.
 */
describe('thumbsUp — a pose used as a commit', () => {
  /** A hand posed upright: `curl` as above, and `thumb` how far the thumb tip sits ABOVE its knuckle. */
  const pose = (curl: number, thumb: number) => {
    const palm = 0.14
    const lm = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5 }))
    lm[0] = { x: 0.5, y: 0.5 }                    // wrist
    lm[9] = { x: 0.5, y: 0.5 - palm }             // middle knuckle
    lm[2] = { x: 0.42, y: 0.5 - palm * 0.4 }      // thumb knuckle
    lm[4] = { x: 0.42, y: lm[2].y - palm * thumb } // thumb tip
    // each finger's knuckle on the palm's knuckle row, its tip `curl` palms further up (or down)
    ;[[8, 5], [12, 9], [16, 13], [20, 17]].forEach(([tip, mcp], i) => {
      const x = 0.44 + i * 0.04
      lm[mcp] = { x, y: 0.5 - palm }
      lm[tip] = { x, y: lm[mcp].y - palm * curl }
    })
    return lm
  }

  it('a thumbs-up reads as one', () => {
    expect(thumbsUp(pose(-0.1, 0.7))).toBe(true)   // fingers curled under their knuckles, thumb high
  })

  it('a GRABBING fist does not — the thumb is wrapped, not raised', () => {
    expect(thumbsUp(pose(-0.1, 0.05))).toBe(false)
  })

  it('an open hand does not, however high the thumb is', () => {
    expect(thumbsUp(pose(0.85, 0.7))).toBe(false)
  })

  it('a hand too far away to read is not a commit', () => {
    const far = pose(-0.1, 0.7).map(p => ({ x: 0.5 + (p.x - 0.5) * 0.3, y: 0.5 + (p.y - 0.5) * 0.3 }))
    expect(thumbsUp(far)).toBe(false)
  })

  it('no hand, or a truncated landmark set, is false rather than a throw', () => {
    expect(thumbsUp(undefined)).toBe(false)
    expect(thumbsUp([])).toBe(false)
    expect(thumbsUp(Array.from({ length: 12 }, () => ({ x: 0.5, y: 0.5, z: 0 })))).toBe(false)
  })
})
