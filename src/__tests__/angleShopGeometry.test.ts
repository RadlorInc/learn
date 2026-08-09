/**
 * Gate for THE ANGLE SHOP (9–11 · anglesSymmetry).
 *
 * Drives the SAME exported functions the scene renders and grades from — it re-implements nothing.
 * A gate that carries its own copy of a rule cannot see that rule being removed, which is how this
 * repo has shipped a green suite over a broken chapter more than once.
 */
import { describe, it, expect } from 'vitest'
import {
  STEP, MIN_DEG, MAX_DEG, START_GAP, TAP_MIN,
  kindOf, reachable, trueAxes, candidateAxes, isTrueAxis, SHAPE_LINES, SHAPE_LABEL,
  WEEK, makeRound, startFor, grade, heldCount, missFor, verdictFor, sigFor,
  guideShown, shopLayout, armFor, SITE_GEO, ARM_MARGIN,
  handDrivesAngle, snapDeg, nearestAxis,
  type Shape, type Tier, type QType, type Round, type AngleRound, type FoldRound, type Site,
} from '@/features/chapters/story/angles'
import { palmTilt } from '@/infra/ar/fingerCount'

const SHAPES = Object.keys(SHAPE_LINES) as Shape[]
const TIERS: Tier[] = [1, 2, 3]
const SIZES: Array<[number, number]> = [
  [1280, 720], [1024, 620], [1440, 900], [1512, 860], [1800, 870],
  [640, 320], [667, 375], [740, 360], [812, 375], [1024, 400],
  // ⚠️ the tap-floor clamp only BINDS below ~282px of height, so without these two the backstop is
  // never exercised and removing it passes. A 667×375 landscape phone minus iOS Safari's chrome
  // (~95px) really does land here — same shape as MeasureIt's missing narrow-but-tall sizes.
  [667, 290], [640, 270],
]

// ─── the turn ────────────────────────────────────────────────────────────────────────
describe('the angle', () => {
  it('can express a right angle — 90 is reachable on the step', () => {
    expect(reachable()).toContain(90)
    expect((90 - MIN_DEG) % STEP).toBe(0)
  })

  it('classifies every reachable angle, and only 90 is right', () => {
    const right = reachable().filter(d => kindOf(d) === 'right')
    expect(right).toEqual([90])
    for (const d of reachable()) {
      expect(kindOf(d)).toBe(d === 90 ? 'right' : d < 90 ? 'acute' : 'obtuse')
    }
  })

  it('stays inside its own bounds', () => {
    const r = reachable()
    expect(r[0]).toBe(MIN_DEG)
    expect(r[r.length - 1]).toBeLessThanOrEqual(MAX_DEG)
  })

  it('NEVER starts the arm on the answer, at any kind or target', () => {
    for (const want of ['acute', 'right', 'obtuse'] as const) {
      for (let i = 0; i < 200; i++) {
        expect(kindOf(startFor(want))).not.toBe(want)
      }
      for (const target of reachable().filter(d => kindOf(d) === want)) {
        for (let i = 0; i < 20; i++) expect(startFor(want, target)).not.toBe(target)
      }
    }
  })

  it('starts far enough away that the round is travelled, not nudged', () => {
    for (const want of ['acute', 'right', 'obtuse'] as const) {
      const anchor = want === 'acute' ? 50 : want === 'obtuse' ? 130 : 90
      for (let i = 0; i < 200; i++) {
        expect(Math.abs(startFor(want) - anchor)).toBeGreaterThanOrEqual(START_GAP)
      }
    }
  })
})

// ─── the fold ────────────────────────────────────────────────────────────────────────
describe('symmetry axes', () => {
  it('derives the real line count for every shape', () => {
    const expected: Record<Shape, number> = {
      square: 4, rectangle: 2, equilateral: 3, isosceles: 1, pentagon: 5, hexagon: 6,
    }
    for (const s of SHAPES) {
      expect(trueAxes(s)).toHaveLength(expected[s])
      expect(trueAxes(s)).toHaveLength(SHAPE_LINES[s])
    }
  })

  it('every true axis is reachable — it appears in the candidate set', () => {
    for (const s of SHAPES) {
      for (const a of trueAxes(s)) {
        expect(candidateAxes(s).some(c => Math.abs(c - a) < 0.01)).toBe(true)
      }
    }
  })

  it('every shape offers at least one DISTRACTOR, or marking everything would win', () => {
    for (const s of SHAPES) {
      const wrong = candidateAxes(s).filter(c => !isTrueAxis(s, c))
      expect(wrong.length, `${s} has no distractor`).toBeGreaterThanOrEqual(1)
    }
  })

  it("gives the rectangle its diagonals — the classic misconception, as distractors", () => {
    const wrong = candidateAxes('rectangle').filter(c => !isTrueAxis('rectangle', c))
    expect(wrong.sort((a, b) => a - b)).toEqual([45, 135])
  })

  it('candidate axes are distinct and inside [0,180)', () => {
    for (const s of SHAPES) {
      const c = candidateAxes(s)
      expect(new Set(c).size).toBe(c.length)
      for (const a of c) { expect(a).toBeGreaterThanOrEqual(0); expect(a).toBeLessThan(180) }
    }
  })

  it('an axis rotated a full half-turn is the same axis', () => {
    for (const s of SHAPES) for (const a of trueAxes(s)) expect(isTrueAxis(s, a + 180)).toBe(true)
  })
})

// ─── grading ─────────────────────────────────────────────────────────────────────────
describe('grading', () => {
  it('a kind round accepts every angle of that kind and refuses every other', () => {
    for (const want of ['acute', 'right', 'obtuse'] as const) {
      const r: AngleRound = { type: 'angle', tier: 1, job: 'kind', want, start: startFor(want), job_: WEEK[0], ask: '' }
      for (const d of reachable()) expect(grade(r, d)).toBe(kindOf(d) === want)
    }
  })

  it('a degrees round accepts ONLY the exact figure', () => {
    const r: AngleRound = { type: 'angle', tier: 3, job: 'degrees', want: 'acute', target: 65, start: 130, job_: WEEK[0], ask: '' }
    for (const d of reachable()) expect(grade(r, d)).toBe(d === 65)
  })

  it('a fold round wants the whole SET — short, over-marked and wrong-marked all fail', () => {
    for (const shape of SHAPES) {
      const r: FoldRound = { type: 'fold', tier: 2, shape, job_: WEEK[1], ask: '' }
      const truth = trueAxes(shape)
      expect(grade(r, truth)).toBe(true)
      expect(grade(r, [...truth].reverse()), 'order must not matter').toBe(true)
      if (truth.length > 1) expect(grade(r, truth.slice(1)), 'one short must fail').toBe(false)
      const distractor = candidateAxes(shape).find(c => !isTrueAxis(shape, c))!
      expect(grade(r, [...truth, distractor]), 'over-marked must fail').toBe(false)
      expect(grade(r, [distractor]), 'wrong axis must fail').toBe(false)
      expect(grade(r, []), 'marking nothing must fail').toBe(false)
    }
  })

  it('marking EVERY candidate never wins', () => {
    for (const shape of SHAPES) {
      const r: FoldRound = { type: 'fold', tier: 2, shape, job_: WEEK[1], ask: '' }
      expect(grade(r, candidateAxes(shape))).toBe(false)
    }
  })

  it('counts how many held, for the post-commit verdict', () => {
    for (const shape of SHAPES) {
      expect(heldCount(shape, trueAxes(shape))).toBe(SHAPE_LINES[shape])
      expect(heldCount(shape, candidateAxes(shape))).toBe(SHAPE_LINES[shape])
      expect(heldCount(shape, [])).toBe(0)
    }
  })
})

// ─── the scaffold ────────────────────────────────────────────────────────────────────
describe('the set-square guide', () => {
  it('is shown at L1 and L2 and RETIRES at L3', () => {
    expect(guideShown(1)).toBe(true)
    expect(guideShown(2)).toBe(true)
    expect(guideShown(3)).toBe(false)
  })
})

// ─── the week ────────────────────────────────────────────────────────────────────────
describe('the week', () => {
  it('is ten jobs and every one says who wants it and why', () => {
    expect(WEEK).toHaveLength(10)
    for (const j of WEEK) {
      expect(j.because.length, `${j.day} has no reason`).toBeGreaterThan(8)
      expect(j.piece.length).toBeGreaterThan(3)
      expect(j.day).toMatch(/^(Mon|Tue|Wed|Thu|Fri) (am|pm)$/)
    }
  })

  it('never runs the same site on consecutive jobs twice in a row across a day boundary', () => {
    // consecutive-differ is the craft rule; all-distinct is what once put a fence on a pond
    let sameRun = 1
    for (let i = 1; i < WEEK.length; i++) {
      sameRun = WEEK[i].site === WEEK[i - 1].site ? sameRun + 1 : 1
      expect(sameRun, `site ${WEEK[i].site} runs ${sameRun} long at ${WEEK[i].day}`).toBeLessThanOrEqual(2)
    }
  })

  it('every angle job FIXES its kind, so the reason and the requirement cannot contradict', () => {
    // ⚠️ Driven on screen before this existed: "Make the approach ramp SHARPER than a square corner
    // — a barrow has to get up it loaded", which is backwards. The story owns the direction and the
    // tier owns only how near 90 it sits.
    for (const j of WEEK) {
      if (j.type === 'angle') expect(j.wants, `${j.day} draws its kind at random`).toBeDefined()
      else expect(j.wants).toBeUndefined()
    }
    expect(new Set(WEEK.filter(j => j.wants).map(j => j.wants!)))
      .toEqual(new Set(['acute', 'right', 'obtuse']))    // all three kinds get a home
  })

  it('every tier can serve every kind a job asks for', () => {
    for (const d of TIERS) {
      for (let i = 0; i < WEEK.length; i++) {
        const j = WEEK[i]
        if (j.type !== 'angle') continue
        for (let n = 0; n < 25; n++) {
          const r = makeRound(d, i)
          if (r.type !== 'angle') continue
          expect(r.want, `${j.day} at L${d}`).toBe(j.wants)
          if (r.job === 'degrees') expect(kindOf(r.target!)).toBe(j.wants)
        }
      }
    }
  })

  it('asks both verbs across the week, roughly evenly', () => {
    const angles = WEEK.filter(j => j.type === 'angle').length
    expect(angles).toBe(5)
    expect(WEEK.length - angles).toBe(5)
  })
})

// ─── generation ──────────────────────────────────────────────────────────────────────
describe('makeRound', () => {
  it('produces a well-posed round at every tier and every slot', () => {
    for (const d of TIERS) {
      for (let i = 0; i < WEEK.length; i++) {
        for (let n = 0; n < 20; n++) {
          const r = makeRound(d, i)
          expect(r.ask.length).toBeGreaterThan(12)
          if (r.type === 'angle') {
            expect(reachable()).toContain(r.start)
            expect(kindOf(r.start)).not.toBe(r.want)
            if (r.job === 'degrees') {
              expect(reachable()).toContain(r.target!)
              expect(kindOf(r.target!)).toBe(r.want)
            }
          } else {
            expect(SHAPES).toContain(r.shape)
          }
        }
      }
    }
  })

  it('carries the tier it was drawn at, so nothing needs a second source for it', () => {
    for (const d of TIERS) {
      for (let i = 0; i < WEEK.length; i++) {
        for (let n = 0; n < 10; n++) expect(makeRound(d, i).tier).toBe(d)
      }
    }
  })

  it('asks for an exact figure only at the top tier, where the guide is gone', () => {
    for (const d of TIERS) {
      for (let i = 0; i < WEEK.length; i++) {
        for (let n = 0; n < 10; n++) {
          const r = makeRound(d, i)
          if (r.type === 'angle' && r.job === 'degrees') {
            expect(d, 'exact figures are L3 only').toBe(3)
            expect(guideShown(d), 'the guide must be gone when an exact figure is asked').toBe(false)
            expect(guideShown(r.tier), 'and the ROUND must agree').toBe(false)
          }
        }
      }
    }
  })

  it('grows the shapes with the tier — pentagon and hexagon are L3 only', () => {
    const seen: Record<Tier, Set<Shape>> = { 1: new Set(), 2: new Set(), 3: new Set() }
    for (const d of TIERS) {
      for (let i = 0; i < WEEK.length; i++) {
        for (let n = 0; n < 60; n++) {
          const r = makeRound(d, i)
          if (r.type === 'fold') seen[d].add(r.shape)
        }
      }
    }
    expect(seen[1].has('pentagon')).toBe(false)
    expect(seen[1].has('hexagon')).toBe(false)
    expect(seen[2].has('pentagon')).toBe(false)
    expect(seen[3].has('pentagon') || seen[3].has('hexagon')).toBe(true)
    expect(seen[3].size).toBeGreaterThan(seen[1].size)
  })

  it('covers the unmet verb when the week would otherwise repeat the other', () => {
    // a run where only 'angle' has been asked must be able to produce a fold on an angle slot
    const angleSlot = WEEK.findIndex(j => j.type === 'angle')
    const r = makeRound(2, angleSlot, ['angle'] as QType[])
    expect(r.type).toBe('fold')
    const foldSlot = WEEK.findIndex(j => j.type === 'fold')
    expect(makeRound(2, foldSlot, ['fold'] as QType[]).type).toBe('angle')
  })

  it('dedupes on the MATH, not on the site', () => {
    const a = makeRound(1, 0)
    const b = makeRound(1, 6)     // a different day and site, same tier
    if (a.type === 'angle' && b.type === 'angle' && a.want === b.want && a.job === b.job) {
      expect(sigFor(a)).toBe(sigFor(b))   // the rotating site must not read as variety
    }
    const f1: FoldRound = { type: 'fold', tier: 3, shape: 'hexagon', job_: WEEK[1], ask: '' }
    const f2: FoldRound = { type: 'fold', tier: 1, shape: 'square', job_: WEEK[9], ask: '' }
    expect(sigFor(f1)).not.toBe(sigFor(f2))
  })
})

// ─── words ───────────────────────────────────────────────────────────────────────────
describe('what it says', () => {
  it('a miss line NEVER names the answer', () => {
    for (const d of TIERS) {
      for (let i = 0; i < WEEK.length; i++) {
        for (let n = 0; n < 15; n++) {
          const r = makeRound(d, i)
          const wrong: number[] = []
          const line = r.type === 'angle'
            ? missFor(r, reachable().find(x => !grade(r, x))!)
            : missFor(r, wrong)
          if (r.type === 'angle') {
            if (r.job === 'degrees') {
              expect(line, `leaked ${r.target}`).not.toContain(String(r.target))
            }
            expect(line.toLowerCase()).not.toContain(r.want)
          } else {
            expect(line, `leaked the count`).not.toMatch(new RegExp(`\\b${SHAPE_LINES[r.shape]}\\b`))
            expect(line.toLowerCase()).not.toContain(SHAPE_LABEL[r.shape])
          }
          expect(line.length).toBeGreaterThan(12)
        }
      }
    }
  })

  it('the ask states the requirement without stating the angle, except at L3', () => {
    for (let i = 0; i < WEEK.length; i++) {
      for (let n = 0; n < 20; n++) {
        const r = makeRound(1, i)
        if (r.type === 'angle') {
          expect(r.ask).not.toMatch(/\d+°/)          // L1 names a KIND, never a figure
        }
      }
    }
  })

  it('the verdict states the figure — but only ever after the commit', () => {
    const r: AngleRound = { type: 'angle', tier: 1, job: 'kind', want: 'acute', start: 130, job_: WEEK[0], ask: '' }
    expect(verdictFor(r, 62)).toContain('62°')
    expect(verdictFor(r, 62)).toContain('acute')
    const f: FoldRound = { type: 'fold', tier: 3, shape: 'hexagon', job_: WEEK[1], ask: '' }
    expect(verdictFor(f, trueAxes('hexagon'))).toContain('6 lines')
    expect(verdictFor(f, trueAxes('hexagon').slice(0, 5))).toContain('You found 5')
  })
})

// ─── layout ──────────────────────────────────────────────────────────────────────────
describe('layout', () => {
  it('keeps every band in order and never overlapping, at ten sizes', () => {
    for (const [vw, vh] of SIZES) {
      const L = shopLayout(vw, vh)
      const why = `${vw}x${vh}`
      expect(L.bubbleTop, why).toBeGreaterThanOrEqual(L.chromeH)
      expect(L.frameTop, why).toBeGreaterThanOrEqual(L.bubbleTop + L.bubbleH)
      expect(L.groundY, why).toBeGreaterThan(L.frameTop)
      expect(L.groundY, why).toBeLessThanOrEqual(L.controlTop)
      expect(L.controlTop + L.controlH, why).toBe(vh)
    }
  })

  it('never shrinks a tap target below the operable floor', () => {
    for (const [vw, vh] of SIZES) {
      expect(shopLayout(vw, vh).btn, `${vw}x${vh}`).toBeGreaterThanOrEqual(TAP_MIN)
    }
  })

  it('leaves the turning arm a band it can actually be read in', () => {
    for (const [vw, vh] of SIZES) {
      const L = shopLayout(vw, vh)
      expect(L.frameH, `${vw}x${vh} frame band`).toBeGreaterThanOrEqual(60)
    }
  })

  it('the ARM never leaves the frame, at any reachable angle, site or size', () => {
    // ⚠️ Measured on screen before this existed: at 100° on the roof the arm's box topped out at
    // y = -9 — off the screen. The bands were all correct; the arm's REACH depends on the angle,
    // which shopLayout cannot see, so it has to be bounded here.
    const SITES = Object.keys(SITE_GEO) as Site[]
    for (const [vw, vh] of SIZES) {
      const L = shopLayout(vw, vh)
      for (const site of SITES) {
        const groundPx = Math.round(vh * SITE_GEO[site].ground)
        const a = armFor(site, vw, vh, L, Math.min(groundPx, L.groundY))
        // ⚠️ a floor in ABSOLUTE px is not enough — 46px on a 320-tall frame passed and was
        // unreadable on screen. The arm must be a real share of the band it lives in.
        expect(a.len, `${site} ${vw}x${vh} arm too short to read`).toBeGreaterThanOrEqual(48)
        expect(a.len / L.frameH, `${site} ${vw}x${vh} arm is a sliver of its band`).toBeGreaterThanOrEqual(0.35)
        expect(a.vy, `${site} ${vw}x${vh} vertex below the ground`).toBeLessThanOrEqual(vh)
        for (const deg of reachable()) {
          const rad = (deg * Math.PI) / 180
          const tx = a.vx + a.len * Math.cos(rad)
          const ty = a.vy - a.len * Math.sin(rad)
          const why = `${site} ${vw}x${vh} @${deg}°`
          expect(ty, `${why} above the frame`).toBeGreaterThanOrEqual(L.frameTop - 1)
          expect(ty, `${why} below the ground`).toBeLessThanOrEqual(vh)
          expect(tx, `${why} off the left`).toBeGreaterThanOrEqual(0)
          expect(tx, `${why} off the right`).toBeLessThanOrEqual(vw)
        }
      }
    }
  })

  it('the world yields to the controls, not the other way round', () => {
    // a shorter frame must not push the controls off — the ground moves up instead
    const tall = shopLayout(1280, 900), short = shopLayout(1280, 360)
    expect(short.controlH).toBeLessThanOrEqual(tall.controlH)
    expect(short.groundY).toBeLessThan(tall.groundY)
    expect(short.controlTop + short.controlH).toBe(360)
  })
})

// ─── the hand ────────────────────────────────────────────────────────────────────────
/**
 * The camera path cannot be driven by a gate at all — no test can hold a hand up. So the pure
 * maths under it carries the weight: what a palm reading MEANS, what a jittering reading is allowed
 * to do to the committed value, and which rounds the hand is permitted to answer.
 */
describe('the tilt', () => {
  /** 21 landmarks; only the wrist (0) and the middle knuckle (9) carry the palm axis. */
  const hand = (dx: number, dy: number) => {
    const lm = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }))
    lm[9] = { x: 0.5 + dx, y: 0.5 + dy, z: 0 }
    return lm
  }

  it('reads a flat hand as 0° and a raised one as 90°, in MIRRORED screen space', () => {
    // the self-view is scaleX(-1), so a knuckle LEFT of the wrist in the frame points RIGHT on screen
    expect(palmTilt(hand(-0.2, 0))).toBeCloseTo(0, 6)
    expect(palmTilt(hand(0, -0.2))).toBeCloseTo(90, 6)
    expect(palmTilt(hand(-0.2, -0.2))).toBeCloseTo(45, 6)
    expect(palmTilt(hand(0.2, -0.2))).toBeCloseTo(135, 6)
  })

  it('is an AXIS — a hand reversed end for end reads the same, which is what lets one reading serve a beam AND a fold line', () => {
    for (let a = 0; a < 180; a += 7) {
      const r = (a * Math.PI) / 180
      const fwd = palmTilt(hand(-0.2 * Math.cos(r), -0.2 * Math.sin(r)))!
      const back = palmTilt(hand(0.2 * Math.cos(r), 0.2 * Math.sin(r)))!
      expect(fwd).toBeCloseTo(a, 5)
      expect(back).toBeCloseTo(a, 5)
    }
  })

  it('has no reading at all without a hand', () => {
    expect(palmTilt([])).toBeNull()
    expect(palmTilt(hand(0, 0))).toBeNull()   // wrist and knuckle on one point is no axis
  })
})

describe('snapping a continuous reading', () => {
  it('only ever produces an angle the steppers could also reach — one value, two inputs', () => {
    for (let raw = -30; raw <= 220; raw += 0.5) {
      expect(reachable(), `raw ${raw}`).toContain(snapDeg(raw, null))
      for (const cur of reachable()) expect(reachable()).toContain(snapDeg(raw, cur))
    }
  })

  it('HOLDS ITS STEP through the jitter of a still hand — without this the commit never arms', () => {
    // ⚠️ THE CASE THAT MATTERS IS A HAND SITTING ON A STEP BOUNDARY, not on a step. Jitter around a
    // centre never crosses anything and passes with the hysteresis deleted — that version of this
    // test was written first and proved nothing. A boundary is where a still hand really does flip
    // between two answers, the dwell resets on every flip, and the camera becomes a dead button.
    const NOISE = 2.5   // the landmark noise the hold band is sized against — see SNAP_HOLD
    for (let raw0 = MIN_DEG; raw0 <= MAX_DEG - STEP; raw0 += 0.5) {
      let cur = snapDeg(raw0, null)
      const first = cur
      for (let i = 0; i < 120; i++) {
        cur = snapDeg(raw0 + Math.sin(i * 1.7) * NOISE, cur)
        expect(cur, `a still hand at ${raw0}° changed its answer`).toBe(first)
      }
    }
  })

  it('but still MOVES when the hand really does — the hysteresis is a hold, not a lock', () => {
    let cur = snapDeg(90, null)
    expect(cur).toBe(90)
    cur = snapDeg(105, cur); expect(cur).toBe(105)
    cur = snapDeg(60, cur); expect(cur).toBe(60)
    // and every step of the lattice is still reachable by travelling to it
    for (const d of reachable()) expect(snapDeg(d, 90)).toBe(d)
  })

  it('clamps to the shop\'s own range at both ends', () => {
    expect(snapDeg(-40, null)).toBe(MIN_DEG)
    expect(snapDeg(400, null)).toBe(MAX_DEG)
    expect(snapDeg(2, MIN_DEG)).toBe(MIN_DEG)
    expect(snapDeg(178, MAX_DEG)).toBe(MAX_DEG)
  })
})

describe('aiming the fold bar by hand', () => {
  it('always lands on a real candidate, for every shape', () => {
    for (const shape of SHAPES) {
      const c = candidateAxes(shape)
      for (let raw = 0; raw < 180; raw += 0.5) expect(c).toContain(nearestAxis(c, raw))
    }
  })

  it('measures the gap as an AXIS, so 175° is nearer 0° than it is to 90°', () => {
    expect(nearestAxis([0, 90], 175)).toBe(0)
    expect(nearestAxis([0, 90], 5)).toBe(0)
    expect(nearestAxis([0, 90], 100)).toBe(90)
  })

  it('picks the nearest one, which is what makes laying your hand along the fold work', () => {
    for (const shape of SHAPES) {
      const c = candidateAxes(shape)
      for (const a of c) {
        expect(nearestAxis(c, a), `${shape} @${a}`).toBe(a)
        // and a hand a couple of degrees off still snaps home
        expect(nearestAxis(c, a + 2)).toBe(a)
        expect(nearestAxis(c, a - 2)).toBe(a)
      }
    }
  })
})

describe('which rounds the hand may answer', () => {
  it('drives a KIND round and never an exact-degrees one — there is nothing to aim at at tier 3', () => {
    for (const d of TIERS) {
      for (let i = 0; i < 200; i++) {
        for (let round = 0; round < WEEK.length; round++) {
          const r = makeRound(d, round, [])
          if (r.type === 'fold') { expect(handDrivesAngle(r)).toBe(false); continue }
          expect(handDrivesAngle(r)).toBe(r.job === 'kind')
        }
      }
    }
  })

  it('leaves the hand a real job at every tier — a camera that answers nothing is a dead camera', () => {
    for (const d of TIERS) {
      const drawn = Array.from({ length: WEEK.length }, (_, i) => makeRound(d, i, []))
      // either the beam follows the tilt, or the fold bar does; no tier is all pointer
      expect(drawn.some(r => handDrivesAngle(r) || r.type === 'fold'), `tier ${d}`).toBe(true)
    }
  })
})
