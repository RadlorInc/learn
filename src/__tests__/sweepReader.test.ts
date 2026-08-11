/**
 * The gate for THE SWEEP (`src/infra/ar/sweep.ts`) — the hand reading The Supply Run is answered
 * with.
 *
 * ⚠️ THIS IS THE ONLY WAY THIS GESTURE CAN BE CHECKED AT ALL. A webcam cannot be driven headlessly,
 * so every AR chapter so far has been verified by feeding synthetic readings through a dev hook and
 * looking at the screen — which proves the WIRING and says nothing about the detector. `stepSweep`
 * is pure precisely so a synthetic x-track can drive the same function the camera drives; a check
 * that carried its own copy of the rule could not see the rule being removed.
 *
 * The tracks below are what a hand actually does: a traversal, a traversal and a return, a hover, a
 * jitter, a hand that leaves frame mid-way, a hand that appears already on the right.
 */
import { describe, it, expect } from 'vitest'
import {
  SWEEP_ARM, SWEEP_FIRE, SWEEP_SPAN, ARM_STEPS, quantArm, sweepKey,
  SWEEP_START, stepSweep, palmRead, SWEEP_MAX_Y, LOST_GRACE, type SweepState,
} from '@/infra/ar/sweep'

/** Feed a track of x readings (null = no hand) and return the final state plus every arm value. */
function run(track: readonly (number | null)[], from: SweepState = SWEEP_START) {
  let s = from
  const arms: number[] = []
  // a RAISED hand — y 0.4 is comfortably above the posture line, which the tracks here are not about
  for (const x of track) { s = stepSweep(s, x === null ? null : { x, y: 0.4 }); arms.push(s.arm) }
  return { s, arms }
}
/** …and the same for the handful of tests that step the machine directly. */
const at = (x: number, y = 0.4) => ({ x, y })

/** A hand travelling from `a` to `b` at a believable rate — ~12 frames for a full crossing. */
const glide = (a: number, b: number, frames = 12) =>
  Array.from({ length: frames + 1 }, (_, i) => a + ((b - a) * i) / frames)

/** One honest sweep: in from the left, across, and out to the right. */
const SWEEP = glide(0.12, 0.9)
/** …and the return stroke that has to happen before the next one. */
const BACK = glide(0.9, 0.12)

describe('the sweep', () => {
  it('fires exactly once for one crossing, and only after the hand has been to the left', () => {
    const { s } = run(SWEEP)
    expect(s.sweeps).toBe(1)
  })

  it('fires NOTHING on the return stroke — coming back is how you sweep again, not an undo', () => {
    const { s } = run([...SWEEP, ...BACK])
    expect(s.sweeps).toBe(1)
  })

  it('counts one sweep per crossing over a whole deal, and never one more', () => {
    for (let n = 1; n <= 8; n++) {
      const track: number[] = []
      for (let k = 0; k < n; k++) track.push(...SWEEP, ...BACK)
      expect(run(track).s.sweeps).toBe(n)
    }
  })

  it('CANNOT fire twice without going back to the left first', () => {
    // across, then wobble about on the right-hand side for a long time
    const wobble = Array.from({ length: 400 }, (_, i) => 0.7 + 0.18 * Math.sin(i / 3))
    const { s } = run([...SWEEP, ...wobble])
    expect(s.sweeps).toBe(1)
  })

  it('never fires for a hand that appears ALREADY on the right — it was never armed', () => {
    expect(run(glide(0.7, 0.98)).s.sweeps).toBe(0)
    expect(run([0.95, 0.95, 0.95]).s.sweeps).toBe(0)
  })

  /**
   * ⚠️ THE PROPERTY THE WHOLE BAND WIDTH EXISTS FOR. A hand held still anywhere, jittering by the
   * landmark noise, must never deal a round — a spurious deal is wrong AND the child then has to
   * undo it, which is worse than having to sweep twice.
   */
  it('cannot be faked by landmark noise, held anywhere across the frame, for ever', () => {
    for (let c = 0.05; c <= 0.95; c += 0.025) {
      const jitter = Array.from({ length: 600 }, (_, i) => c + 0.02 * Math.sin(i * 1.7) + 0.02 * Math.cos(i * 0.9))
      expect(run(jitter).s.sweeps, `held at ${c.toFixed(3)}`).toBe(0)
    }
  })

  it('keeps a band far wider than the noise it has to reject', () => {
    expect(SWEEP_SPAN).toBeGreaterThanOrEqual(0.02 * 10 - 1e-9)   // ten times the landmark noise
    expect(SWEEP_FIRE).toBeGreaterThan(SWEEP_ARM)
  })

  /**
   * ⚠️ THE JITTER MUST SIT ON A THRESHOLD, NOT BETWEEN TWO. The Angle Shop's first hysteresis test
   * jittered around a bucket CENTRE, which crosses nothing and passed with the hysteresis deleted —
   * it was caught only by mutation-testing the gate. A hand parked exactly on the fire line is the
   * case that matters: it must deal ONE round, not one per frame.
   */
  it('deals ONE round for a hand parked exactly on the fire line, not one per frame', () => {
    let s = SWEEP_START
    for (const x of glide(0.15, SWEEP_FIRE, 8)) s = stepSweep(s, at(x))   // a real approach
    for (let i = 0; i < 400; i++) s = stepSweep(s, at(SWEEP_FIRE + 0.02 * Math.sin(i * 1.7)))
    expect(s.sweeps).toBe(1)
  })

  it('deals NOTHING for a hand parked exactly on the arming line', () => {
    let s = SWEEP_START
    for (let i = 0; i < 400; i++) s = stepSweep(s, at(SWEEP_ARM + 0.02 * Math.sin(i * 1.7)))
    expect(s.sweeps).toBe(0)
  })

  it('fires exactly once per pass wherever the sweep starts from', () => {
    for (let a = 0; a <= SWEEP_ARM; a += 0.005) {
      expect(run(glide(a, 0.98, 20)).s.sweeps, `from ${a.toFixed(3)}`).toBe(1)
    }
  })

  it('DISARMS when the hand leaves frame, so a re-acquired hand cannot land mid-sweep', () => {
    // armed on the left, hand lost, then re-acquired on the right — a tracking drop, not a sweep
    const { s } = run([0.2, 0.2, null, null, 0.8, 0.9])
    expect(s.sweeps).toBe(0)
  })

  it('lets the child simply lower their hand and start again', () => {
    const { s } = run([0.2, null, ...SWEEP])
    expect(s.sweeps).toBe(1)
  })

  it('is deterministic on a value sitting exactly on either threshold', () => {
    const armed = stepSweep(SWEEP_START, at(SWEEP_ARM))
    expect(armed.armed).toBe(true)
    const crossing = stepSweep(armed, at(0.5))                   // seen inside the band
    expect(stepSweep(crossing, at(SWEEP_FIRE)).sweeps).toBe(1)
    expect(stepSweep(crossing, at(SWEEP_FIRE)).armed).toBe(false)
    // a hair under the fire line is not yet a sweep
    expect(stepSweep(crossing, at(SWEEP_FIRE - 1e-9)).sweeps).toBe(0)
  })
})

/**
 * ⚠️ THE GUARD THE BAND WIDTH DOES NOT PROVIDE, and the first draft of the module claimed in a
 * comment that it did. Width rejects NOISE (±0.02). It does nothing against a real twenty-centimetre
 * arm movement that happens not to be an answer — a hand crossing the desk from the keyboard to the
 * mouse, or out to a drink and back, is a perfectly good left→right traversal. That is a spurious
 * deal, which is the one failure this whole reading is biased against.
 */
describe('a sweep is a RAISED hand', () => {
  const low = (x: number) => ({ x, y: SWEEP_MAX_Y + 0.05 })

  it('deals nothing for a hand crossing the desk below the posture line', () => {
    let s = SWEEP_START
    for (const x of glide(0.1, 0.95, 16)) s = stepSweep(s, low(x))
    expect(s.sweeps).toBe(0)
  })

  it('deals nothing for a reach OUT and BACK across the desk, which is two traversals', () => {
    let s = SWEEP_START
    for (const x of [...glide(0.9, 0.1, 10), ...glide(0.1, 0.9, 10)]) s = stepSweep(s, low(x))
    expect(s.sweeps).toBe(0)
  })

  it('still deals for a hand raised anywhere above the line, high or low in shot', () => {
    for (const y of [0.05, 0.3, 0.55, SWEEP_MAX_Y]) {
      let s = SWEEP_START
      for (const x of SWEEP) s = stepSweep(s, { x, y })
      expect(s.sweeps, `raised at y ${y}`).toBe(1)
    }
  })

  it('leaves the line generous enough for a child sitting low and close', () => {
    expect(SWEEP_MAX_Y).toBeGreaterThanOrEqual(0.75)
    expect(SWEEP_MAX_Y).toBeLessThan(1)
  })

  it('DISARMS a hand that drops to the desk, rather than banking its progress', () => {
    let s = SWEEP_START
    s = stepSweep(s, at(0.2))
    s = stepSweep(s, at(0.5))                                   // armed and crossing
    for (let i = 0; i < LOST_GRACE + 2; i++) s = stepSweep(s, low(0.5))
    s = stepSweep(s, at(0.9))
    expect(s.sweeps).toBe(0)
  })
})

describe('the arming bar', () => {
  it('stays 0 while the hand has never been to the left — it says what was READ', () => {
    const { arms } = run(glide(SWEEP_ARM + 0.05, SWEEP_FIRE - 0.01))
    expect(Math.max(...arms)).toBe(0)
  })

  it('rises 0 → 1 across the band once armed, and never above it', () => {
    const { arms } = run(SWEEP)
    expect(arms[0]).toBe(0)
    expect(Math.max(...arms)).toBeLessThanOrEqual(1)
    expect(arms.some(a => a > 0.4 && a < 1)).toBe(true)
  })

  /**
   * ⚠️ MONOTONE WITHIN ONE ARMING, and it is doing two jobs. A bar that slid backwards on noise
   * reads as broken; and a value that ticks up and down re-renders the chapter's whole tree at
   * frame rate for a gesture that is not progressing, which is exactly the cost `useFingerCounter`
   * records for the continuous tilt.
   */
  it('never slides BACKWARDS within one arming', () => {
    // stops SHORT of the fire line — a fire legitimately resets the bar, which is not a slide back
    const shaky = [0.2, 0.35, 0.46, 0.43, 0.5, 0.47, 0.55, 0.51, 0.58]
    const { arms } = run(shaky)
    for (let i = 1; i < arms.length; i++) expect(arms[i]).toBeGreaterThanOrEqual(arms[i - 1])
  })

  it('resets to 0 when the hand goes back to arm again', () => {
    expect(run([0.2, 0.55, 0.2]).arms.at(-1)).toBe(0)
  })

  /**
   * ⚠️ ONE DROPPED FRAME MUST NOT THROW THE GESTURE AWAY, because detection loss is CORRELATED with
   * the gesture: a hand moving fast under indoor light is motion-blurred, MediaPipe's confidence
   * collapses and it falls back to a full re-detection. Disarming instantly punishes exactly the
   * brisk sweep the child did best. Past the grace it does disarm, because by then the hand really
   * has gone.
   */
  it('rides out a blur, and disarms once the hand has genuinely gone', () => {
    const brief = Array(LOST_GRACE - 1).fill(null)
    expect(run([0.2, 0.5, ...brief, 0.9]).s.sweeps).toBe(1)
    const gone = Array(LOST_GRACE + 2).fill(null)
    expect(run([0.2, 0.5, ...gone, 0.9]).s.sweeps).toBe(0)
    expect(run([0.2, 0.55, ...gone]).arms.at(-1)).toBe(0)
  })

  /**
   * ⚠️ THE RE-RENDER BUDGET, AND IT IS WHAT `sweepKey` IS FOR. The hook compares that key, not the
   * object, and a hand held still anywhere — jittering by the landmark noise — must barely move it,
   * or a bench carrying two dozen units repaints thirty times a second for a gesture that is not
   * progressing. That is the exact cost `useFingerCounter` records for the continuous tilt.
   */
  it('a hand held still costs the chapter NOTHING, wherever it is held', () => {
    for (const c of [0.1, 0.3, SWEEP_ARM, 0.5, 0.62, SWEEP_FIRE, 0.8]) {
      let s = stepSweep(SWEEP_START, at(c))
      const first = sweepKey(s)
      const keys = new Set<string>([first])
      for (let i = 0; i < 300; i++) {
        s = stepSweep(s, at(c + 0.02 * Math.sin(i * 1.7) + 0.02 * Math.cos(i * 0.9)))
        keys.add(sweepKey(s))
      }
      /**
       * ⚠️ NOT "exactly one key", which the first draft asserted and which is not true: a hand
       * hovering ON the arming line dips below it (arm resets to 0) and back inside it (arm ticks
       * to one quantum), so it alternates between two. TWO keys over three hundred frames is the
       * property that matters — the fault being guarded against is thirty a second.
       */
      expect(keys.size, `held at ${c}`).toBeLessThanOrEqual(2)
      expect(s.sweeps, `held at ${c}`).toBe(0)
    }
  })

  /**
   * ⚠️ THE KEY MUST MOVE ON THE FIRE ITSELF, AND A GATE THAT ONLY WATCHES A TIDY SWEEP CANNOT SEE
   * IT. Found by mutation: dropping `sweeps` from `sweepKey` survived every other check here,
   * because on an unhurried traversal the bar is high just before the fire and 0 just after, so the
   * bar alone happens to change. It does NOT on a fast one whose only in-band sample sits near the
   * arming line — the bar quantizes to 0 on both sides of the fire, the key never changes, `onRead`
   * never fires, and the deal never reaches the chapter. A dead button, on the only gesture.
   */
  it('changes the key on the fire even when the bar never left its first quantum', () => {
    let s = stepSweep(stepSweep(SWEEP_START, at(0.2)), at(SWEEP_ARM + 0.01))
    expect(quantArm(s.arm)).toBe(0)                // the bar has not visibly moved
    const before = sweepKey(s)
    s = stepSweep(s, at(0.95))
    expect(s.sweeps).toBe(1)
    expect(sweepKey(s)).not.toBe(before)
  })

  /**
   * ⚠️ ARMING IS A KEY CHANGE EVEN THOUGH NOTHING ELSE MOVED, and dropping it from the key is a
   * REAL defect rather than an inert one — found by mutation. The chapter's instruction branches on
   * `armed` ("bring your hand back to the left" against "sweep across"), and it only ever hears a
   * reading when the key changes. A hand travelling from the right side to the arming zone changes
   * neither the counter nor the quantized bar, so without `armed` in the key the chapter never
   * learns the child has done the thing it just asked for, and the lane keeps telling them to bring
   * a hand back that is already back — for the whole arming phase, every single sweep.
   */
  it('changes the key the moment the hand arms, with no sweep and no bar movement', () => {
    const parked = stepSweep(SWEEP_START, at(0.85))
    expect(parked.armed).toBe(false)
    const armed = stepSweep(parked, at(0.1))
    expect(armed.armed).toBe(true)
    expect(armed.sweeps).toBe(parked.sweeps)
    expect(quantArm(armed.arm)).toBe(quantArm(parked.arm))
    expect(sweepKey(armed)).not.toBe(sweepKey(parked))
  })

  it('costs a handful of renders for a whole traversal, not one per frame', () => {
    let s = SWEEP_START
    const keys = new Set<string>()
    for (const x of glide(0.12, 0.9, 40)) { s = stepSweep(s, at(x)); keys.add(sweepKey(s)) }
    expect(keys.size).toBeLessThanOrEqual(ARM_STEPS + 2)
  })
})

/**
 * ⚠️ THE ARTEFACT THE NULL-DISARM DOES NOT COVER. MediaPipe drops a detection and picks the SAME
 * hand up somewhere else with no empty frame between, so an armed hand on the left can reappear on
 * the right — and without this it deals a round the child never performed, which they then have to
 * undo with a tap. That is strictly worse than making them sweep again.
 */
describe('a teleport is not a sweep', () => {
  it('refuses a hand that jumps the band in one frame, having never been seen crossing it', () => {
    expect(run([0.2, 0.2, 0.9]).s.sweeps).toBe(0)
  })

  it('still accepts a hand moving as fast as an arm really can', () => {
    // a brisk crossing in four frames — one sample lands inside the band, which is all it takes
    expect(run([0.15, 0.45, 0.55, 0.85]).s.sweeps).toBe(1)
    // and even a three-sample crossing, which is a throttled loop rather than a fast child
    expect(run([0.15, 0.5, 0.85]).s.sweeps).toBe(1)
  })

  it('recovers rather than wedging, so the next real sweep still counts', () => {
    expect(run([0.2, 0.9, ...SWEEP]).s.sweeps).toBe(1)
  })

  it('rejects a jump in EITHER direction — a teleport leftward must not arm a free sweep', () => {
    expect(run([0.9, 0.1, 0.9]).s.sweeps).toBe(0)
  })

  it('quantizes to a handful of steps, so one sweep is a handful of re-renders', () => {
    const seen = new Set(run(SWEEP).arms.map(quantArm))
    expect(seen.size).toBeLessThanOrEqual(ARM_STEPS + 1)
    for (const q of seen) expect(q).toBeGreaterThanOrEqual(0)
    for (const q of seen) expect(q).toBeLessThanOrEqual(1)
  })
})

describe('reading the palm', () => {
  const hand = (wristX: number, knuckleX: number) =>
    Array.from({ length: 21 }, (_, i) => ({ x: i === 0 ? wristX : i === 9 ? knuckleX : 0.5, y: 0.5 }))

  it('is MIRRORED, so moving your own hand right moves the reading toward 1', () => {
    // raw x grows toward the camera's right, which is the child's LEFT
    const own_left = palmRead(hand(0.8, 0.8))!.x
    const own_right = palmRead(hand(0.2, 0.2))!.x
    expect(own_right).toBeGreaterThan(own_left)
  })

  it('reads the palm, not a fingertip — the midpoint of the wrist and the middle knuckle', () => {
    expect(palmRead(hand(0.4, 0.6))!.x).toBeCloseTo(0.5, 6)
    expect(palmRead(hand(0.2, 0.4))!.x).toBeCloseTo(0.7, 6)
  })

  it('returns null rather than a number when there is no usable hand', () => {
    expect(palmRead(undefined)).toBeNull()
    expect(palmRead([])).toBeNull()
    expect(palmRead([{ x: 0.5, y: 0.5 }])).toBeNull()
  })

  /**
   * ⚠️ MEDIAPIPE DOES NOT PROMISE 0..1. A hand held half out of shot returns landmarks slightly
   * outside the frame, and the first draft of this test asserted a clamp that does not exist — it
   * failed on `-2.2e-16`, which is the honest reading of a hand at the very edge. Nothing needs
   * clamping: a value below ARM arms and a value above FIRE fires, which is exactly right for a
   * hand leaving the frame on the correct side. What matters is that the reading stays MONOTONE in
   * the landmarks, so a hand moving right always reads as moving right.
   */
  it('tracks the landmarks monotonically, including past the edges of the frame', () => {
    let prev = Infinity
    for (let a = -0.1; a <= 1.1001; a += 0.05) {
      const v = palmRead(hand(a, a))!.x
      expect(v).toBeLessThan(prev)
      prev = v
    }
  })

  it('still reads a hand at the very edge of shot, rather than refusing it', () => {
    // raw landmarks running past both edges: 1.03 → −0.02, i.e. a full crossing and then some
    const track = glide(1.03, -0.02, 12).map(v => palmRead(hand(v, v))!.x)
    expect(run(track).s.sweeps).toBe(1)
  })
})
