/**
 * THE SLIDE READER — reading **F**, a hand's position on a scale.
 *
 * A webcam cannot be driven by a gate, so this file drives the PURE functions the camera drives and
 * is the only place this reading can be checked at all. Everything here is synthetic position tracks,
 * exactly as `sweepReader.test.ts` drives synthetic x-tracks.
 *
 * The claim each block defends is stated, because a check whose intent is not written down gets
 * "fixed" by loosening it the first time it fails.
 */
import { describe, it, expect } from 'vitest'
import {
  SLIDE_STEPS, SNAP_HOLD, quantSlide, snapIndex, slideIndex, slideKey,
} from '@/infra/ar/slide'
import { snapDeg, STEP, MIN_DEG, MAX_DEG, reachable } from '@/features/chapters/story/angles'

describe('snapIndex — the hysteresis that stops the camera being a dead button', () => {
  it('picks the nearest step when there is nothing held yet', () => {
    expect(snapIndex(0, null, 6)).toBe(0)
    expect(snapIndex(2.4, null, 6)).toBe(2)
    expect(snapIndex(2.6, null, 6)).toBe(3)
  })

  it('clamps to the scale at both ends, from a raw reading and from a held one', () => {
    expect(snapIndex(-3, null, 6)).toBe(0)
    expect(snapIndex(99, null, 6)).toBe(5)
    expect(snapIndex(99, -4, 6)).toBe(5)
  })

  /**
   * ⚠️ THE CLAIM IS ABOUT A HAND SETTLED ON A STEP, AND WRITING IT ANY WIDER MAKES IT FALSE. The first
   * version of this test swept an arbitrary raw start and jittered by half a step, and it failed at a
   * start sitting exactly ON A BOUNDARY — correctly, because a boundary is half a step from BOTH
   * centres, so half a step of noise genuinely arrives at the neighbouring step's own centre and the
   * reading is SUPPOSED to move there. The honest claim is the physical one: a child aiming at a step
   * holds near its centre, and noise around that centre must not flip it.
   *
   * ⚠️ AND 0.7 IS CHOSEN TO KEEP THE MUTATION POWER, not for realism. It has to be a value a full-step
   * band suppresses and a weaker one does not: at `SNAP_HOLD` 0.62 — the Angle Shop's first guess —
   * 0.7 exceeds the band and the reading flips, so this test fails. Jittering by less than 0.62 would
   * pass with the weakened constant and the check would be defending nothing.
   */
  it('a hand settled on a step, jittering hard, never changes its answer', () => {
    const NOISE = 0.7
    for (let centre = 0; centre <= 5; centre++) {
      let cur = snapIndex(centre, null, 6)
      expect(cur).toBe(centre)
      for (let k = 0; k < 40; k++) {
        // deterministic alternating jitter, so a failure is reproducible rather than flaky
        const raw = centre + (k % 2 ? NOISE : -NOISE) * (k % 4 < 2 ? 1 : 0.55)
        cur = snapIndex(raw, cur, 6)
      }
      expect(cur, `settled on ${centre}, drifted to ${cur}`).toBe(centre)
    }
  })

  /**
   * ⚠️ AND THE BOUNDARY CASE, STATED RATHER THAN AVOIDED — it is the case the craft doc says to find.
   * A hand arriving exactly between two steps has to pick ONE and then be stable there; what it must
   * never do is alternate while the hand does not move. Which side it picks is arbitrary and not
   * asserted; that it then STAYS is the whole property.
   */
  it('a hand on a boundary settles to one side and holds it while the hand is still', () => {
    for (const edge of [0.5, 1.5, 2.5, 3.5, 4.5]) {
      let cur = snapIndex(edge, null, 6)
      const settled = cur
      for (let k = 0; k < 20; k++) cur = snapIndex(edge, cur, 6)
      expect(cur, `boundary ${edge} alternated`).toBe(settled)
    }
  })

  it('but a deliberate move to the next step DOES change it — the band is not a lock', () => {
    let cur = snapIndex(2, null, 6)
    expect(cur).toBe(2)
    cur = snapIndex(3, cur, 6)          // a full step away: the next step's own centre
    expect(cur).toBe(3)
  })

  it('holds through a move of less than a full step, in both directions', () => {
    expect(snapIndex(2.9, 2, 6)).toBe(2)
    expect(snapIndex(1.1, 2, 6)).toBe(2)
    // …and releases at exactly a full step, inclusively, so the reading is deterministic on the edge
    expect(snapIndex(3, 2, 6)).toBe(3)
    expect(snapIndex(1, 2, 6)).toBe(1)
  })

  it('the hold band is a FULL step — a weaker one flips on a boundary', () => {
    // This is the mutation the Angle Shop caught by testing rather than by looking: at 0.62 a hand
    // sitting on a boundary alternates. Asserted as a property of the constant so weakening it fails.
    expect(SNAP_HOLD).toBe(1)
  })
})

describe('slideIndex — the full frame is the full scale', () => {
  it('the ends of the frame reach the ends of the scale', () => {
    expect(slideIndex(0, 6)).toBe(0)
    expect(slideIndex(1, 6)).toBe(5)
  })

  /**
   * ⚠️ THE REACHABILITY CLAIM, AND IT IS `SWEEP_ARM`'S FAILURE MODE ON A DIFFERENT READING. If only
   * the middle of the frame mapped onto the scale, the outer steps would sit past where a seated arm
   * goes and a child would simply never be able to answer with them — silence, at one end only.
   */
  it('every step on the scale is reachable from somewhere in the frame', () => {
    for (const steps of [4, 6, 8, 10]) {
      const hit = new Set<number>()
      for (let x = 0; x <= 1; x += 0.002) hit.add(snapIndex(slideIndex(x, steps), null, steps))
      expect(hit.size, `${steps} steps`).toBe(steps)
    }
  })

  /**
   * ⚠️ REACHABILITY ALONE IS NOT ENOUGH, AND A MUTATION PROVED IT. Compressing the mapping into the
   * middle 60% of the frame still leaves every step reachable — the clamp rescues both ends — so the
   * check above passes while the outer 40% of the child's reach does nothing and every step becomes
   * proportionally harder to hit. The property that actually matters is PROPORTIONALITY: a hand a
   * quarter of the way across the frame is a quarter of the way along the line, which is also the only
   * version of this gesture anyone could predict.
   */
  it('maps the frame to the scale proportionally, not just onto it', () => {
    for (const [frac, want] of [[0, 0], [0.25, 1.25], [0.5, 2.5], [0.75, 3.75], [1, 5]] as const) {
      expect(slideIndex(frac, 6), `x ${frac}`).toBeCloseTo(want, 6)
    }
  })

  it('is monotone, so moving your hand one way never moves the marker the other', () => {
    let prev = -1
    for (let x = 0; x <= 1; x += 0.01) {
      const v = slideIndex(x, 6)
      expect(v).toBeGreaterThanOrEqual(prev)
      prev = v
    }
  })

  it('clamps a reading from outside the frame rather than running off the scale', () => {
    expect(slideIndex(-0.2, 6)).toBe(0)
    expect(slideIndex(1.4, 6)).toBe(5)
  })
})

describe('the change test — a held hand must not re-render the chapter at frame rate', () => {
  it('quantizes finely enough that no consumer loses a step it could have used', () => {
    // six stations, eight bars, ten tenths — the scales named in the plan
    for (const steps of [6, 8, 10]) expect(SLIDE_STEPS).toBeGreaterThan(steps)
  })

  it('a hand held still inside one quantum is ONE key', () => {
    const keys = new Set<string>()
    for (let k = 0; k < 30; k++) keys.add(slideKey({ x: 0.5 + (k % 2 ? 0.004 : -0.004), y: 0.5 }))
    expect(keys.size).toBe(1)
  })

  it('but a real traversal reports a handful of keys, not one and not thirty', () => {
    const keys = new Set<string>()
    for (let x = 0; x <= 1; x += 0.02) keys.add(slideKey({ x, y: 0.5 }))
    expect(keys.size).toBeGreaterThan(6)
    expect(keys.size).toBeLessThanOrEqual(SLIDE_STEPS + 1)
  })

  /**
   * ⚠️ BOTH AXES IN THE KEY. Dropping y would make the Loading Bay's gesture — raising a hand to set
   * a bar — report nothing at all, because its x never changes. That is the hook's own recorded
   * "three arms, not two" dead button, one reading along.
   */
  it('moving on EITHER axis changes the key', () => {
    const base = slideKey({ x: 0.5, y: 0.5 })
    expect(slideKey({ x: 0.9, y: 0.5 })).not.toBe(base)
    expect(slideKey({ x: 0.5, y: 0.9 })).not.toBe(base)
  })

  it('no hand is its own key, distinct from any position', () => {
    expect(slideKey(null)).toBe('none')
    for (let x = 0; x <= 1; x += 0.05) expect(slideKey({ x, y: 0.5 })).not.toBe('none')
  })

  it('quantSlide never leaves 0..1', () => {
    for (let v = 0; v <= 1; v += 0.01) {
      expect(quantSlide(v)).toBeGreaterThanOrEqual(0)
      expect(quantSlide(v)).toBeLessThanOrEqual(1)
    }
  })
})

/**
 * ⚠️ THE DELEGATION IS GATED, because the whole point of moving the rule was that ONE place decides
 * it — and a re-export that silently stopped being used would leave two copies again with nothing
 * failing. These assert the Angle Shop's shipped behaviour through the shared function.
 */
describe('snapDeg still behaves, now that the rule lives in the AR layer', () => {
  it('lands only on angles the steppers can reach', () => {
    const ok = new Set(reachable())
    for (let raw = MIN_DEG - 20; raw <= MAX_DEG + 20; raw += 0.5) {
      expect(ok.has(snapDeg(raw, null)), `raw ${raw} → ${snapDeg(raw, null)}`).toBe(true)
    }
  })

  it('clamps outside the shop\'s range', () => {
    expect(snapDeg(-90, null)).toBe(MIN_DEG)
    expect(snapDeg(400, null)).toBe(MAX_DEG)
  })

  it('a hand held on a 2.5° boundary does not flip, at any angle in range', () => {
    for (let start = MIN_DEG; start <= MAX_DEG; start += 0.5) {
      let cur = snapDeg(start, null)
      const settled = cur
      for (let k = 0; k < 30; k++) cur = snapDeg(start + (k % 2 ? 2.5 : -2.5), cur)
      expect(cur, `raw ${start}`).toBe(settled)
    }
  })

  it('a deliberate turn of a full step still moves it', () => {
    const from = snapDeg(60, null)
    expect(from).toBe(60)
    expect(snapDeg(60 + STEP, from)).toBe(60 + STEP)
    expect(snapDeg(60 - STEP, from)).toBe(60 - STEP)
  })
})
