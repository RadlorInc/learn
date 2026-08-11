/**
 * THE PINCH-GRAB READER — reading **E**, thumb and index closing on a thing.
 *
 * A webcam cannot be driven by a gate, so this drives the PURE functions the camera drives and is the
 * only place this reading can be checked at all. Everything here is synthetic landmark sets and
 * synthetic ratio tracks.
 *
 * The claim each block defends is written down, because a check whose intent is not stated gets
 * "fixed" by loosening it the first time it fails.
 */
import { describe, it, expect } from 'vitest'
import {
  pinchRatio, stepPinch, pinchKey, PINCH_START,
  GRAB_ON, GRAB_OFF, PINCH_EMA, PINCH_MIN_PALM, LOST_GRACE,
} from '@/infra/ar/pinch'

/**
 * A synthetic hand. `palm` is the wrist→middle-knuckle length and `gap` the thumb–index gap, both in
 * frame-width units, so a test can pose a hand at any distance from the camera.
 */
function hand(palm: number, gap: number) {
  const lm = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5 }))
  lm[0] = { x: 0.5, y: 0.5 }              // wrist
  lm[9] = { x: 0.5, y: 0.5 - palm }       // middle knuckle
  lm[4] = { x: 0.5, y: 0.4 }              // thumb tip
  lm[8] = { x: 0.5 + gap, y: 0.4 }        // index tip
  return lm
}

/** Run a constant ratio until the EMA has settled, so a threshold claim is about the pose not the lag. */
const settle = (r: number, from = PINCH_START, n = 40) => {
  let s = from
  for (let k = 0; k < n; k++) s = stepPinch(s, r)
  return s
}

describe('pinchRatio — the reading is a RATIO, which is what makes it work at all', () => {
  /**
   * ⚠️ THE CLAIM THE WHOLE MODULE RESTS ON. Landmarks are normalized to frame width, so any raw length
   * scales as 1/d — measured on the geometry sweep.ts assumes, a 2 cm gap reads 0.043 at 40 cm and
   * 0.025 at 70 cm, and a 2 cm gap at 40 cm is INDISTINGUISHABLE from a 3.5 cm gap at 70 cm. Dividing
   * by a length from the same hand in the same frame cancels the term exactly.
   */
  it('the same pose at any distance from the camera reads the same', () => {
    // one pose (gap = 30% of palm), four seating distances — the palm shrinks, the ratio must not
    const seen = [0.20, 0.14, 0.10, 0.07].map(palm => pinchRatio(hand(palm, palm * 0.3))!)
    for (const r of seen) expect(r).toBeCloseTo(0.3, 6)
  })

  it('and a genuinely different pose reads differently at the SAME distance', () => {
    const closed = pinchRatio(hand(0.14, 0.14 * 0.25))!
    const open = pinchRatio(hand(0.14, 0.14 * 1.2))!
    expect(open).toBeGreaterThan(closed * 3)
  })

  /**
   * ⚠️ THE REFERENCE MUST NOT MOVE WHEN THE FINGERS DO. Wrist→middle-knuckle is on the rigid palm, so
   * pinching changes the numerator and leaves the divisor alone. A reference taken along the index
   * finger would shrink as the child pinches and cancel the signal being measured.
   */
  it('the reference length is unaffected by the pinch itself', () => {
    const wide = pinchRatio(hand(0.14, 0.14))!
    const tight = pinchRatio(hand(0.14, 0.02))!
    // the divisor is identical, so the readings differ by exactly the gap ratio
    expect(wide / tight).toBeCloseTo(0.14 / 0.02, 6)
  })

  it('a hand too far away to read reports NOTHING rather than a confident wrong answer', () => {
    expect(pinchRatio(hand(PINCH_MIN_PALM - 0.005, 0.02))).toBeNull()
    expect(pinchRatio(hand(PINCH_MIN_PALM + 0.02, 0.02))).not.toBeNull()
  })

  it('no hand, or a truncated landmark set, is null rather than a throw', () => {
    // a throw in the detect loop is unrecoverable — it has no try/catch and never reschedules
    expect(pinchRatio(undefined)).toBeNull()
    expect(pinchRatio([])).toBeNull()
    expect(pinchRatio(Array.from({ length: 5 }, () => ({ x: 0.5, y: 0.5 })))).toBeNull()
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
    // and the gap is wide enough to be a real band rather than a rounding difference
    expect(GRAB_OFF - GRAB_ON).toBeGreaterThan(0.2)
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
    for (let k = 0; k < 12; k++) s = stepPinch(s, null)
    expect(s.held, 'still holding for a hand that has gone').toBe(false)
    // …and the grace has to be long enough to cover a blur at the frame rates this loop really runs
    expect(LOST_GRACE).toBeGreaterThanOrEqual(3)
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
    // ±0.2 in ratio units is the jitter this module's own docstring derives for a fingertip pair
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
