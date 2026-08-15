/**
 * Gate for THE ANGLE SHOP (9–11 · anglesSymmetry).
 *
 * Drives the SAME exported functions the scene renders and grades from — it re-implements nothing.
 * A gate that carries its own copy of a rule cannot see that rule being removed, which is how this
 * repo has shipped a green suite over a broken chapter more than once.
 */
import { describe, it, expect } from 'vitest'
import {
  STEP, MIN_DEG, MAX_DEG, START_GAP,
  kindOf, reachable, trueAxes, candidateAxes, isTrueAxis, SHAPE_LINES, SHAPE_LABEL,
  WEEK, PAPER, ANCHOR, ASK_BUDGET, pieceOf, makeRound, startFor, grade, heldCount, missFor, verdictFor, sigFor,
  guideShown,
  handDrivesAngle, snapDeg, nearestAxis,
  type Shape, type Tier, type QType, type Round, type AngleRound, type FoldRound,
  type AngleJob,
} from '@/features/chapters/story/angles'
import { readFileSync } from 'node:fs'
import { NO_HAND } from '@/infra/ar/HandInput'
import { ANGLE_SHOP_CONFIG, toTask } from '@/features/chapters/teen/games/AngleShopGame'

const SCENE = readFileSync('src/features/chapters/teen/games/AngleShopGame.tsx', 'utf8')
/** the first angle job and the first fold job, so a fixture never has to name a slot by number */
const AJOB = WEEK.find(j => j.type === 'angle') as AngleJob
const FJOB = WEEK.find(j => j.type === 'fold')!
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
      const r: AngleRound = { type: 'angle', tier: 1, job: 'kind', want, start: startFor(want), job_: AJOB, ask: '' }
      for (const d of reachable()) expect(grade(r, d)).toBe(kindOf(d) === want)
    }
  })

  it('a degrees round accepts ONLY the exact figure', () => {
    const r: AngleRound = { type: 'angle', tier: 3, job: 'degrees', want: 'acute', target: 65, start: 130, job_: AJOB, ask: '' }
    for (const d of reachable()) expect(grade(r, d)).toBe(d === 65)
  })

  it('a fold round wants the whole SET — short, over-marked and wrong-marked all fail', () => {
    for (const shape of SHAPES) {
      const r: FoldRound = { type: 'fold', tier: 2, shape, job_: FJOB, ask: '' }
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
      const r: FoldRound = { type: 'fold', tier: 2, shape, job_: FJOB, ask: '' }
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
  const kind = (tier: Tier): AngleRound =>
    ({ type: 'angle', tier, job: 'kind', want: 'acute', start: 130, job_: AJOB, ask: '' })

  it('is shown at L1 and L2 and RETIRES at L3 on a KIND round', () => {
    expect(guideShown(kind(1))).toBe(true)
    expect(guideShown(kind(2))).toBe(true)
    expect(guideShown(kind(3))).toBe(false)
  })

  it('⚠️ STAYS on an exact-degrees round, which is the only reference that round has', () => {
    // The shipped chapter retired the guide at L3 and asked for exact figures ONLY at L3, so every
    // exact round was: no readout (rule 1 forbids one while turning), no scale, nothing at 90° to
    // judge against — and then graded on `deg === target`. A dead round, met by every strong child,
    // since a good run spends its last two rounds at L3.
    const exact: AngleRound =
      { type: 'angle', tier: 3, job: 'degrees', want: 'acute', target: 85, start: 130, job_: AJOB, ask: '' }
    expect(guideShown(exact)).toBe(true)
  })

  it('and no exact round anywhere in the generator is ever asked without it', () => {
    for (const d of TIERS) for (let i = 0; i < WEEK.length; i++) for (let n = 0; n < 20; n++) {
      const r = makeRound(d, i)
      if (r.type === 'angle' && r.job === 'degrees')
        expect(guideShown(r), `an exact ${r.target}° at L${d} with nothing to judge against`).toBe(true)
    }
  })

  it('a fold round never wants it — there is no angle being set', () => {
    for (const d of TIERS) expect(guideShown({ type: 'fold', tier: d, shape: 'square', job_: FJOB, ask: '' }))
      .toBe(d < 3)
  })
})

// ─── the week ────────────────────────────────────────────────────────────────────────
describe('the week', () => {
  it('is ten jobs and every angle job says who wants it and why', () => {
    expect(WEEK).toHaveLength(10)
    for (const j of WEEK) {
      expect(j.where.length, 'every job says where it happens').toBeGreaterThan(3)
      if (j.type === 'angle') {
        expect(j.because.length, `${j.where} has no reason`).toBeGreaterThan(8)
        expect(j.piece.length).toBeGreaterThan(3)
      }
    }
  })

  it('splits the world by VERB: slopes in the park, folds at the table', () => {
    // ⚠️ The separation is a property of the SCREEN, not a sentence. A slope is something you have
    // felt in your legs and a fold is something you have done with your hands; one world forced to
    // carry both is what produced a building site nobody nine years old has stood on.
    for (const j of WEEK) {
      if (j.type === 'fold') expect(j.site, `${j.where} folds paper somewhere else`).toBe('table')
      else expect(j.site, `${j.where} sets an angle at the table`).not.toBe('table')
    }
    expect(new Set(WEEK.map(j => j.site))).toEqual(new Set(['ramp', 'play', 'table']))
  })

  it('⚠️ the reason argues for the KIND, never for a magnitude the tier is free to change', () => {
    // Driven on screen: "Make the slide SHARPER than a square corner — any steeper and it is a drop,
    // not a slide", i.e. the requirement and the reason contradicting each other in one sentence.
    // Its sibling, "push your bike up it, loaded", is true of L1's 30° and false of L3's 85° — and
    // both are acute. A magnitude word in the reason begs the question the round is asking.
    const AGAINST: Record<string, string[]> = {
      acute:  ['steeper', 'shallow', 'up it'],
      obtuse: ['sharp', 'steep'],
      right:  ['sharp', 'shallow'],
    }
    for (const j of WEEK) {
      if (j.type !== 'angle') continue
      for (const word of AGAINST[j.wants])
        expect(j.because.toLowerCase(), `${j.piece} wants ${j.wants} and its reason says "${word}"`)
          .not.toContain(word)
      // and the whole sentence has to survive both ends of the pool it will be drawn against
      const ask = makeRound(1, WEEK.indexOf(j)).ask
      expect(ask, `${j.piece}`).toContain(j.because)
    }
  })

  it('⚠️ never asks a SLOPE to be obtuse — obtuse is past vertical, and no ramp is', () => {
    // Shipped: an obtuse "approach ramp" *because a barrow has to get up it loaded*, which drew a
    // plank leaning backwards over the bank at 75° above the horizontal while the words said
    // "shallower". Real ramps live between about 5° and 40°, i.e. always acute. So obtuse belongs
    // only to the things in this world that genuinely OPEN past square, named here — a new obtuse
    // job fails this and has to argue its case.
    const OPENS = ['the park gate', 'the barrier arm']
    for (const j of WEEK) {
      if (j.type === 'angle' && j.wants === 'obtuse')
        expect(OPENS, `${j.piece} is a slope, and a slope is never obtuse`).toContain(j.piece)
    }
  })

  it('never runs the same site on consecutive jobs twice in a row across a day boundary', () => {
    // consecutive-differ is the craft rule; all-distinct is what once put a fence on a pond
    let sameRun = 1
    for (let i = 1; i < WEEK.length; i++) {
      sameRun = WEEK[i].site === WEEK[i - 1].site ? sameRun + 1 : 1
      expect(sameRun, `site ${WEEK[i].site} runs ${sameRun} long at ${WEEK[i].where}`).toBeLessThanOrEqual(2)
    }
  })

  it('every angle job FIXES its kind, so the reason and the requirement cannot contradict', () => {
    // ⚠️ Driven on screen before this existed: "Make the approach ramp SHARPER than a square corner
    // — a barrow has to get up it loaded", which is backwards. The story owns the direction and the
    // tier owns only how near 90 it sits.
    // ⚠️ The type makes the fold half UNWRITABLE rather than merely unwritten: `wants?: AngleKind`
    // behind a `?? 'acute'` is one refactor away from asking for a paper plane "SHARPER than a
    // square corner — because the picture has to line up when it shuts".
    for (const j of WEEK) if (j.type === 'angle') expect(j.wants, `${j.where} draws its kind at random`).toBeDefined()
    expect(new Set(WEEK.filter(j => j.type === 'angle').map(j => (j as AngleJob).wants)))
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
          expect(r.want, `${j.where} at L${d}`).toBe(j.wants)
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

  it('asks for an exact figure only at the top tier', () => {
    for (const d of TIERS) {
      for (let i = 0; i < WEEK.length; i++) {
        for (let n = 0; n < 10; n++) {
          const r = makeRound(d, i)
          if (r.type === 'angle' && r.job === 'degrees') expect(d, 'exact figures are L3 only').toBe(3)
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

  it('covers the unmet verb ONE WAY — a fold job can never be pressed into an angle round', () => {
    // a run where only 'angle' has been asked must be able to produce a fold on an angle slot
    const angleSlot = WEEK.findIndex(j => j.type === 'angle')
    expect(makeRound(2, angleSlot, ['angle'] as QType[]).type).toBe('fold')
    // ⚠️ AND NOT THE REVERSE, deliberately. A fold round needs nothing but a shape; an angle round
    // needs a piece, a reason and a wanted kind, and a fold job has none of the three — the old
    // code invented them with `job.wants ?? 'acute'`, which is how a chapter ends up asking for a
    // birthday card "SHARPER than a square corner". The week alternates, so with `coverage`
    // declared on the beat this direction is never needed.
    const foldSlot = WEEK.findIndex(j => j.type === 'fold')
    expect(makeRound(2, foldSlot, ['fold'] as QType[]).type).toBe('fold')
  })

  it('dedupes on the MATH, not on the site', () => {
    const a = makeRound(1, 0)
    const b = makeRound(1, 6)     // a different day and site, same tier
    if (a.type === 'angle' && b.type === 'angle' && a.want === b.want && a.job === b.job) {
      expect(sigFor(a)).toBe(sigFor(b))   // the rotating site must not read as variety
    }
    const f1: FoldRound = { type: 'fold', tier: 3, shape: 'hexagon', job_: FJOB, ask: '' }
    const f2: FoldRound = { type: 'fold', tier: 1, shape: 'square', job_: FJOB, ask: '' }
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

  it('⚠️ every ask fits the bubble in two lines — a budget, because nothing can see a wrap', () => {
    // Measured at 640x320: the bubble is ~17.5px a line in a 67px reserve, so two lines fit and
    // three do not. Three overran onto the turning arm — the one thing the child has to read, and
    // already only 69px there. The lever is the PROSE, per chapter-craft: shorten what is said
    // twice (the reason is stated again in the demo and the re-teach) rather than buying pixels
    // from the band.
    for (const d of TIERS) for (let i = 0; i < WEEK.length; i++) for (let n = 0; n < 15; n++) {
      const r = makeRound(d, i)
      expect(r.ask.length, `${r.ask}`).toBeLessThanOrEqual(ASK_BUDGET)
    }
    // ⚠️ AND THE BUDGET ITSELF IS PINNED TO THE MEASUREMENT, or the assertion above moves with it:
    // loosening the constant to 400 left the gate perfectly green while the bubble grew back onto
    // the arm. The only thing a re-derivation cannot move is a number read off the screen.
    expect(ASK_BUDGET, 'two lines at 640 wide, measured').toBe(90)
  })

  it('the verdict states the figure — but only ever after the commit', () => {
    const r: AngleRound = { type: 'angle', tier: 1, job: 'kind', want: 'acute', start: 130, job_: AJOB, ask: '' }
    expect(verdictFor(r, 62)).toContain('62°')
    expect(verdictFor(r, 62)).toContain('acute')
    const f: FoldRound = { type: 'fold', tier: 3, shape: 'hexagon', job_: FJOB, ask: '' }
    expect(verdictFor(f, trueAxes('hexagon'))).toContain('6 lines')
    expect(verdictFor(f, trueAxes('hexagon').slice(0, 5))).toContain('You found 5')
  })
})

// ─── layout ──────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ THE LAYOUT SUITE IS GONE, DELIBERATELY, AND NOT BECAUSE IT WAS FAILING. `shopLayout`, `armFor`,
 * the band constants and the arm's never-leaves-the-frame sweep all tested arithmetic this chapter
 * no longer owns: GameShell owns the bands and `FitSlot` scales the instrument into whatever is
 * left. Keeping them would have been a gate driving dead code — which is worse than no gate, because
 * it reads as coverage. What replaced them is `bandOnGameShell.test.ts`, which holds the same rules
 * ONCE for all ten chapters instead of once per chapter.
 */

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

// ─── the daily world ─────────────────────────────────────────────────────────────────
describe('the anchor and the paper', () => {
  it('the chapter has an anchor at all, and the briefing states it', () => {
    // ⚠️ The AR plan recorded this anchor and it had never reached the code — `grep -i anchor` over
    // both files returned nothing, and the briefing said "Slate's first week on the crew", which is
    // a job rather than a thing a nine-year-old has done. Factor Lab's desks, verbatim.
    expect(ANCHOR.length).toBeGreaterThan(10)
    // ⚠️ `toContain('{ANCHOR}')` ALSO MATCHES `${ANCHOR}` IN THE DEMO'S TEMPLATE STRING, so deleting
    // it from the briefing walked straight through — the `alt={` / `x_alt={` shape from The Height
    // Bar's gate, one session on. Anchor on the JSX form only, and count it.
    // ⚠️ DRIVEN FROM THE CONFIG, NOT GREPPED. The briefing is data now, so the check can read the
    // real string the child sees instead of a source pattern that has to be kept in step with JSX.
    expect(String(ANGLE_SHOP_CONFIG.start.blurb), 'the briefing must state the anchor').toContain(ANCHOR)
  })

  it('every fold round names the PAPER the shape is, not a piece the job invented', () => {
    // ⚠️ Named on the JOB, "the paper plane" would be drawn as a regular pentagon a third of the
    // time — a readout naming an arrangement the picture is not showing, on the one object the
    // round is about.
    for (const d of TIERS) for (let i = 0; i < WEEK.length; i++) for (let n = 0; n < 20; n++) {
      const r = makeRound(d, i)
      if (r.type !== 'fold') continue
      expect(pieceOf(r)).toEqual(PAPER[r.shape])
      expect(r.ask.toLowerCase()).toContain(PAPER[r.shape].piece.replace(/^the /, ''))
    }
  })

  it('the paper table covers every shape and no two share a name', () => {
    for (const s of SHAPES) {
      expect(PAPER[s].piece.length, s).toBeGreaterThan(3)
      expect(PAPER[s].because.length, s).toBeGreaterThan(10)
    }
    expect(new Set(SHAPES.map(s => PAPER[s].piece)).size).toBe(SHAPES.length)
  })

  it('a paper plane really does have ONE line of symmetry and a snowflake SIX', () => {
    // the table has to agree with the geometry, or the world is telling the child something false
    expect(SHAPE_LINES[Object.keys(PAPER).find(s => PAPER[s as Shape].piece.includes('plane')) as Shape]).toBe(1)
    expect(SHAPE_LINES[Object.keys(PAPER).find(s => PAPER[s as Shape].piece.includes('snowflake')) as Shape]).toBe(6)
  })

  it('an angle round still names its own piece and reason', () => {
    for (let i = 0; i < WEEK.length; i++) for (let n = 0; n < 10; n++) {
      const r = makeRound(1, i)
      if (r.type === 'angle') expect(pieceOf(r)).toEqual({ piece: r.job_.piece, because: r.job_.because })
    }
  })
})

// ─── what the scene actually reaches for ────────────────────────────────────────────
describe('the board never prints the answer', () => {
  it('⚠️ the badge names the PIECE — never the angle, never the line count', () => {
    // Both are the answer. The bespoke chapter's own gate could see this because the board was JSX
    // it could grep; on the shell the board is DATA, so the check reads the task the shell is handed.
    for (const d of TIERS) for (let i = 0; i < WEEK.length; i++) for (let n = 0; n < 10; n++) {
      const t = toTask(makeRound(d, i, []))
      expect(t.badge, `${t.badge}`).toBe(pieceOf(t.r).piece)
      if (t.r.type === 'fold') {
        expect(t.badge, 'no line count').not.toMatch(new RegExp(`\\b${SHAPE_LINES[t.r.shape]}\\b`))
      } else {
        expect(t.badge, 'no degrees').not.toMatch(/\d+\s*°?$/)
      }
    }
  })
})

describe("the hand's two meanings", () => {
  const H = ANGLE_SHOP_CONFIG.hand!

  it('⚠️ a FOLD round never commits on the reading — the child has a SET to mark', () => {
    // The tilt only AIMS the bar on a fold round; `Mark ✓` is still the deliberate act, and the
    // answer is every axis that holds. A `commits: () => true` would score the first axis the hand
    // happened to point at, which is a round answered by waving.
    const fold = toTask(makeRound(1, 1, []))
    if (fold.r.type === 'fold') expect(H.commits!(fold, { deg: 90, marked: [], bar: 0 })).toBe(false)
    const angle = toTask(makeRound(1, 0, []))
    if (angle.r.type === 'angle') expect(H.commits!(angle, { deg: 60, marked: [], bar: 0 })).toBe(true)
  })

  it('⚠️ the hand does NOT drive an exact-degrees round', () => {
    // Those ask for exactly 85° at the top tier with nothing on screen to aim at and no readout
    // (rule 1 forbids one while turning), so a tilt held inside ±2.5° of an unmarked target is luck
    // rather than knowledge. Those rounds keep the steppers, which ARE the exact instrument.
    for (const d of TIERS) for (let i = 0; i < WEEK.length; i++) for (let n = 0; n < 10; n++) {
      const t = toTask(makeRound(d, i, []))
      if (t.r.type === 'angle' && t.r.job === 'degrees')
        expect(H.when!(t), 'an exact round must not take a tilt').toBe(false)
    }
  })

  it('one reading, two meanings — a tilt is a DEGREE or a FOLD AXIS, chosen by the round', () => {
    const angle = toTask(makeRound(1, 0, []))
    const fold = toTask(makeRound(1, 1, []))
    const read = { ...NO_HAND, tilt: 44 }
    if (angle.r.type === 'angle') expect(reachable()).toContain(H.value!(read, angle))
    if (fold.r.type === 'fold') expect(candidateAxes(fold.r.shape)).toContain(H.value!(read, fold))
  })
})

describe('the scene uses the module', () => {
  it('⚠️ draws no painted scene and no cast — the pre-teen lab, like the neon chapters beside it', () => {
    // founder's call: match The Coin Tray and The Pizza Counter. A backdrop or a sprite creeping
    // back in is also a whole class of fault returning (a share of an IMAGE used as a share of the
    // VIEWPORT), which had already cost this chapter one 3.6x blow-up.
    expect(SCENE, 'no painted backdrop').not.toMatch(/assets\/backgrounds/)
    expect(SCENE, 'no sprite cast').not.toMatch(/assets\/characters\/(slate|milo_side)/)
    expect(SCENE, 'no sprite sheet cells').not.toMatch(/SheetCell/)
    // ⚠️ `toContain('LabBackdrop')` PASSES ON A LOCAL `const LabBackdrop = () => null` — a name check
    // cannot tell the kit's component from a shadow of it. Assert the IMPORT LINE.
    const imp = SCENE.match(/import \{([^}]+)\} from '\.\/parts\/kidKit'/)
    expect(imp, 'the chapter must import the shared band kit').toBeTruthy()
    // ⚠️ NOT `KeyRow` — this is the one 9–11 chapter whose answer is not a number off a key row.
    // It turns an arm and marks folds, so it takes the palette, the action cue and the batch guard.
    for (const piece of ['KID_P', 'Cue', 'useLatest'])
      expect(imp![1], `the band kit's ${piece}`).toContain(piece)
  })

  it('⚠️ asks the MODULE whether the guide shows — both places it is drawn', () => {
    // `const guide = false` in the scene restores the dead L3 round with every module test green:
    // a gate that only drives the pure function cannot see the scene refusing to call it.
    expect(SCENE, 'the instrument asks the module').toMatch(/guideShown\(r\)/)
    expect(SCENE, 'and never decides it locally').not.toMatch(/guide=\{(true|false)\}/)
  })
})

// ─── the consequence ─────────────────────────────────────────────────────────────────
describe('the consequence shot', () => {
  it('reveals a missed angle by GLIDING the arm to it, in the child\'s own instrument', () => {
    // The bespoke scene had a code-drawn "puck gets through or is stopped" shot. On the shell the
    // reveal is `config.glide`, which walks the arm to the answer — the same job, owned once for
    // every chapter instead of hand-drawn per chapter.
    expect(ANGLE_SHOP_CONFIG.glide).toBeTruthy()
    const seen: number[] = []
    const t = toTask(makeRound(1, 0, []))
    ANGLE_SHOP_CONFIG.glide(t, { deg: 30, marked: [], bar: 0 }, v => seen.push(v.deg), fn => fn())
    if (t.r.type === 'angle') expect(seen.length, 'it animates rather than jumping').toBeGreaterThan(4)
  })

  it('the walkthrough teaches the anchor, and no beat is left in the old painted world', () => {
    const said = (ANGLE_SHOP_CONFIG.tutorial as { steps: { say: string }[] }).steps.map(s => s.say).join(' ')
    expect(said).toContain(ANCHOR)
    for (const dead of ['rain', 'foreman', 'the crew', 'drain'])
      expect(said.toLowerCase(), `a beat still says "${dead}"`).not.toContain(dead)
  })
})
