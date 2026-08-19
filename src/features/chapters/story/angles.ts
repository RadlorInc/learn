/**
 * THE ANGLE SHOP (9–11 · `anglesSymmetry`) — the pure module.
 *
 * Everything the gate needs, outside React. The scene imports from here and adds nothing of its
 * own: a check that re-implements a rule cannot see the rule being removed, and `useFrame`-style
 * component state is not reachable from a test at all.
 *
 * Two verbs, one control shape (TickTock's call):
 *   • TURN IT      — the job names a requirement, the child turns a real thing and commits.
 *   • MARK THE FOLDS — the child marks every axis they believe holds, then folds them all at once.
 *
 * Both are EXACT TRANSFORMS, which is why this chapter can be built from painted art: a rotation
 * of `deg` IS `deg`, and a mirror about an axis IS a fold. The art carries the math.
 *
 * See docs/storyboards/angle-shop.md for the shot list and docs/chapter-craft.md for the rules
 * every number here is obeying.
 */
import { snapIndex } from '@/infra/ar/slide'
import { pick } from '@/core/rand'

// ─── the turn ────────────────────────────────────────────────────────────────────────
/** 5° a tap, so 90 is reachable and a right angle is expressible at all. */
export const STEP = 5
export const MIN_DEG = 15
export const MAX_DEG = 165

export type AngleKind = 'acute' | 'right' | 'obtuse'

export function kindOf(deg: number): AngleKind {
  return deg === 90 ? 'right' : deg < 90 ? 'acute' : 'obtuse'
}

/** Every angle the steppers can actually reach. The gate sweeps this, not a hand-typed list. */
export function reachable(): number[] {
  const out: number[] = []
  for (let d = MIN_DEG; d <= MAX_DEG; d += STEP) out.push(d)
  return out
}

export const clampDeg = (d: number) => Math.max(MIN_DEG, Math.min(MAX_DEG, d))

/**
 * How far past the current step, as a share of STEP, a reading must travel before the step changes.
 *
 * ⚠️ THE RULE NOW LIVES IN `infra/ar/slide.ts` AND THIS IS A RE-EXPORT, because a second copy of one
 * rule is this repo's most-repeated recorded fault: reading **F** (a hand's position on a scale)
 * needs the identical hysteresis, and two chapters deciding it separately is one edit away from
 * disagreeing. The derivation is unchanged and is documented there — a hand settled on a step sees
 * raw values up to half a step plus noise away from it, so suppressing ±2.5° of landmark jitter on a
 * 5° lattice needs a FULL step of hold band. A weaker band (0.62 was the first guess) flips back and
 * forth on a boundary and was caught by mutation-testing the gate, not by looking.
 */
export { SNAP_HOLD } from '@/infra/ar/slide'

/**
 * The reachable angle a raw hand reading means, holding its current step until clearly past it.
 *
 * Degrees in, degrees out; the hysteresis itself is done in STEP UNITS by the shared `snapIndex`, so
 * this function owns only the lattice (where 15° sits, how wide a step is) and never the rule.
 */
export function snapDeg(raw: number, current: number | null): number {
  const steps = (MAX_DEG - MIN_DEG) / STEP + 1
  const idx = snapIndex(
    (raw - MIN_DEG) / STEP,
    current === null ? null : (clampDeg(current) - MIN_DEG) / STEP,
    steps,
  )
  return MIN_DEG + idx * STEP
}


// ─── the fold ────────────────────────────────────────────────────────────────────────
export type Shape = 'square' | 'rectangle' | 'equilateral' | 'isosceles' | 'pentagon' | 'hexagon'

export const SHAPE_LABEL: Record<Shape, string> = {
  square: 'square', rectangle: 'rectangle', equilateral: 'equilateral triangle',
  isosceles: 'isosceles triangle', pentagon: 'regular pentagon', hexagon: 'regular hexagon',
}

/** How many lines of symmetry each shape really has. The geometry, not a lookup the scene invents. */
export const SHAPE_LINES: Record<Shape, number> = {
  square: 4, rectangle: 2, equilateral: 3, isosceles: 1, pentagon: 5, hexagon: 6,
}

const norm = (a: number) => ((a % 180) + 180) % 180

/**
 * The axes that genuinely fold the shape onto itself, as angles in [0,180).
 * Derived from the shape, never typed out — so SHAPE_LINES and this cannot drift apart.
 */
export function trueAxes(shape: Shape): number[] {
  if (shape === 'rectangle') return [0, 90]
  if (shape === 'isosceles') return [90]
  const n = SHAPE_LINES[shape]              // square 4, equilateral 3, pentagon 5, hexagon 6
  // a square sits flat (axes 0/45/90/135); the odd shapes and the hexagon are drawn apex-up,
  // so one axis is vertical and the rest step round by 180/n.
  const base = shape === 'square' ? 0 : 90
  const out: number[] = []
  for (let i = 0; i < n; i++) out.push(norm(base + (i * 180) / n))
  return out.sort((a, b) => a - b)
}

/**
 * What the fold bar can snap to — the true axes with a near-miss interleaved BETWEEN each
 * neighbouring pair.
 *
 * ⚠️ The obvious candidate set (the shape's own vertices + edge midpoints) is WRONG, and it is
 * worth knowing why: for a regular polygon every one of those IS a line of symmetry, so the set
 * would contain zero distractors and a child who marks everything wins. Interleaving instead gives
 * a genuine near-miss beside every real axis — and for the RECTANGLE the interleaved pair are its
 * diagonals, which is the classic misconception, arriving for free.
 *
 * Not a leak that half of them hold: the answer is graded as a SET, so knowing the count still
 * leaves you having to pick WHICH, and picking which is the whole skill.
 */
export function candidateAxes(shape: Shape): number[] {
  const t = trueAxes(shape)
  if (t.length === 1) return [0, 45, 90, 135]        // one axis needs its own distractors
  const gap = 180 / t.length
  const out = t.flatMap(a => [a, norm(a + gap / 2)])
  return [...new Set(out.map(a => Math.round(a * 100) / 100))].sort((a, b) => a - b)
}

export const isTrueAxis = (shape: Shape, axis: number) =>
  trueAxes(shape).some(a => Math.abs(norm(axis) - a) < 0.01)

/**
 * The candidate fold axis nearest a raw hand reading. Measured as an AXIS — 175° and 5° are 10°
 * apart, not 170° — because a fold line has no head or tail and neither does a hand held along it.
 */
export function nearestAxis(cands: number[], raw: number): number {
  const away = (a: number) => { const d = Math.abs(norm(a) - norm(raw)); return Math.min(d, 180 - d) }
  return cands.reduce((best, a) => (away(a) < away(best) ? a : best), cands[0])
}

// ─── the anchor ──────────────────────────────────────────────────────────────────────
/**
 * The daily thing this chapter is a name for.
 *
 * ⚠️ IT IS A CLAUSE, NEVER A SENTENCE, EVERYWHERE EXCEPT THE BRIEFING. Spent as a whole sentence in
 * Factor Lab it took a card from two lines to three at 640×320 and drove the bench 15px into the
 * button below it — the anchor breaking the reserved-band rule it was written under.
 */
export const ANCHOR = 'how steep the ramp at the park is'

// ─── the day ─────────────────────────────────────────────────────────────────────────
export type Site = 'ramp' | 'play' | 'table'
export type QType = 'angle' | 'fold'

/**
 * ⚠️ A DISCRIMINATED UNION RATHER THAN OPTIONAL FIELDS, AND THAT IS THE POINT. `wants?: AngleKind`
 * with a `?? 'acute'` behind it is one refactor away from asking a child to make the paper plane
 * "SHARPER than a square corner — because the picture has to line up when it shuts". A fold job
 * genuinely has no wanted kind, so it may not carry a slot for one.
 */
export interface AngleJob {
  /** the place, as the question card's chip — a tag, never a second copy of the question */
  where: string
  site: Site
  type: 'angle'
  /** what is being set */
  piece: string
  /** who wants it and why — §0a's second half, never decoration */
  because: string
  /**
   * ⚠️ THE STORY FIXES THE KIND; THE TIER PICKS THE DEGREE. Drawn independently they contradict
   * each other and the chapter states something false — driven on screen, a ramp asked to be
   * "SHARPER than a square corner" *because a barrow has to get up it loaded*, which is backwards.
   * A generated sentence must hold for EVERY seed the generator can draw.
   *
   * ⚠️⚠️ AND THE KIND IS CHOSEN AGAINST THE OBJECT, NOT SPRINKLED FOR VARIETY. **Obtuse means the
   * beam swung PAST vertical, and no slope is ever obtuse** — the shipped week asked for an obtuse
   * *approach ramp* "because a barrow has to get up it loaded", which drew a plank leaning backwards
   * over the bank at 75° above the horizontal while the words said "shallower". Real ramps live
   * between about 5° and 40°, i.e. always acute. So the slopes here (ramp, slide) are acute, the
   * things that OPEN past square (gate, barrier) are obtuse, and the one upright is right.
   */
  wants: AngleKind
}
/** A fold job carries only a place: the PAPER decides the piece, because the shape decides the paper. */
export interface FoldJob { where: string; site: 'table'; type: 'fold' }
export type Job = AngleJob | FoldJob

/**
 * A Saturday: the park in the morning, the kitchen table for the fair's paper.
 *
 * The scenario fixes the CONTEXT and the tier picks the DIFFICULTY, so story and difficulty stay
 * independent — TickTock's structure, which is what stopped its day-table making two rounds the
 * same question. ⚠️ It ALTERNATES, and `makeRound`'s coverage nudge leans on that.
 */
export const WEEK: Job[] = [
  /**
   * ⚠️ THE REASON HAS TO ARGUE FOR THE KIND, NOT FOR A MAGNITUDE — and every tier can draw a very
   * different magnitude. Driven on screen: *"Make the slide SHARPER than a square corner — any
   * steeper and it is a drop, not a slide"*, which says both things at once. Its sibling was *"push
   * your bike up it, loaded"*, true at the L1 pool's 30° and plainly false at L3's 85°, which is
   * still acute. A reason about how STEEP begs the question the round is asking; a reason about
   * which SIDE of square holds at every angle the tier can draw.
   */
  { where: 'Ramp',     site: 'ramp',  type: 'angle', piece: 'the bike ramp',   because: 'past square it is a wall, not a ramp', wants: 'acute'  },
  { where: 'Table',    site: 'table', type: 'fold' },
  { where: 'Slide',    site: 'play', type: 'angle', piece: 'the slide',     because: 'a slide leans forwards, never back', wants: 'acute'  },
  { where: 'Table',    site: 'table', type: 'fold' },
  { where: 'Gate',     site: 'play',  type: 'angle', piece: 'the park gate',   because: 'so two bikes fit through at once',  wants: 'obtuse' },
  { where: 'Table',    site: 'table', type: 'fold' },
  { where: 'Barrier',  site: 'ramp',  type: 'angle', piece: 'the barrier arm', because: 'or you clip your head going under', wants: 'obtuse' },
  { where: 'Table',    site: 'table', type: 'fold' },
  { where: 'Hoop',     site: 'play',  type: 'angle', piece: 'the hoop post',   because: 'or every shot goes wide', wants: 'right'  },
  { where: 'Table',    site: 'table', type: 'fold' },
]

/**
 * What is being folded, keyed by the SHAPE that is drawn.
 *
 * ⚠️ THE PIECE COMES FROM THE SHAPE, NOT FROM THE JOB, BECAUSE THE TIER PICKS THE SHAPE. Named on
 * the job instead, "the paper plane" would be drawn as a regular pentagon a third of the time — the
 * readout-names-an-arrangement-the-picture-is-not-showing fault, on the one object the round is
 * about. A plane really does have exactly one line of symmetry and a snowflake really has six, so
 * this table has to agree with `SHAPE_LINES` and the gate checks that it does.
 */
export const PAPER: Record<Shape, { piece: string; because: string }> = {
  square:      { piece: 'the napkin',          because: 'it folds flat whichever way you pick it up' },
  rectangle:   { piece: 'the birthday card',   because: 'the picture lines up when it shuts' },
  equilateral: { piece: 'the bunting flag',    because: 'every flag on the string is cut the same' },
  isosceles:   { piece: 'the paper plane',     because: 'it veers off unless both wings match' },
  pentagon:    { piece: 'the paper rosette',   because: 'the folds fall the same way all round' },
  hexagon:     { piece: 'the paper snowflake', because: 'cut folded, so every side matches' },
}

// ─── rounds ──────────────────────────────────────────────────────────────────────────
export type Tier = 1 | 2 | 3
export type AngleJobKind = 'kind' | 'degrees'

export interface AngleRound {
  type: 'angle'
  /** The tier this round was drawn at. On the ROUND, not a module-level global — a proxy for a
   *  value is a second place deciding it, and the guide's visibility depends on this. */
  tier: Tier
  job: AngleJobKind
  want: AngleKind          // the kind the job asks for (also the kind of `target`)
  target?: number          // set only when job === 'degrees'
  start: number            // where the arm begins — never already correct
  /** ⚠️ AN ANGLE ROUND CAN ONLY COME FROM AN ANGLE JOB, and the type says so rather than a comment. */
  job_: AngleJob
  ask: string
}
export interface FoldRound {
  type: 'fold'
  tier: Tier
  shape: Shape
  job_: Job
  ask: string
}
export type Round = AngleRound | FoldRound

/**
 * ⚠️ THE HAND OWNS THE CONTINUOUS VALUE; TAPS OWN THE DISCRETE ACTIONS. That is the whole rule for
 * mixing the two inputs, and it exists because they cannot share one: a live hand writes `deg` every
 * frame, so a ◀ turn pressed beside it is overwritten before the child's finger leaves the button.
 * With the camera on, whichever control writes the value the hand is writing is HIDDEN — the turn
 * steppers on an angle round, the sweep steppers on a fold round — while Mark ✓ and Fold ✓ stay,
 * because they are ACTIONS rather than values.
 *
 * ⚠️ AND THE HAND DOES NOT DRIVE AN EXACT-DEGREES ROUND. `job: 'degrees'` asks for exactly 85°, at
 * tier 3, where the set-square guide has already retired — so there is nothing on screen to aim at
 * and no readout to aim by (rule 1 forbids one while turning). A tilt held inside ±2.5° of an
 * unmarked target for over a second is luck, not knowledge. Those rounds keep the steppers, which
 * ARE the exact instrument: each tap is a countable 5°. The tilt answers the KIND question, which is
 * what the chapter's anchor is about — too steep to push a bike up, too shallow to get any speed.
 */
export const handDrivesAngle = (r: Round) => r.type === 'angle' && r.job === 'kind'

/**
 * The set-square guide is a scaffold and it RETIRES at the top tier — TickTock's minute ring.
 *
 * ⚠️⚠️ EXCEPT ON AN EXACT-DEGREES ROUND, WHERE IT IS NOT THE ANSWER — IT IS THE ONLY REFERENCE THERE
 * IS, AND WITHOUT IT THAT ROUND CANNOT BE ANSWERED BY KNOWING ANYTHING. `useDegrees` fires at tier 3
 * and this retired at tier 3, so **every** exact round asked for a figure with no readout (rule 1
 * forbids one while turning), no scale, and nothing at 90° to judge against — then graded it on
 * `deg === target`. A strong child gets ~2 rounds at L3 and half the rounds are angle rounds, so the
 * chapter ended on a lottery. FitOut's dead-button shape: the child works it out, acts, and the app
 * refuses. **On a KIND round the guide gives the ANSWER away and must go; on a DEGREES round it gives
 * a REFERENCE away, which is the entire job of a set square.**
 */
export const guideShown = (r: Round) => r.tier < 3 || (r.type === 'angle' && r.job === 'degrees')

/**
 * Difficulty is HOW NEAR 90 the angle sits — never which side of it, because the story owns that.
 * Every tier must offer every kind, or a job whose `wants` is unreachable at that tier has no round.
 */
const KIND_POOL: Record<Tier, Record<AngleKind, number[]>> = {
  1: { acute: [30, 40, 45], right: [90], obtuse: [135, 150] },        // obvious
  2: { acute: [70, 75, 85], right: [90], obtuse: [95, 105, 110] },    // near 90
  3: { acute: [80, 85],     right: [90], obtuse: [95, 100] },         // near 90, guide gone
}
const SHAPES: Record<Tier, Shape[]> = {
  1: ['square', 'rectangle'],
  2: ['square', 'rectangle', 'equilateral', 'isosceles'],
  3: ['equilateral', 'isosceles', 'pentagon', 'hexagon'],
}


/** A start angle that is NEVER already the answer — otherwise a round is won by doing nothing. */
export const START_GAP = 25

export function startFor(want: AngleKind, target?: number): number {
  // never already correct: a round won by leaving the arm alone is not a question
  const wrong = reachable().filter(d => kindOf(d) !== want && d !== target)
  const anchor = target ?? (want === 'acute' ? 50 : want === 'obtuse' ? 130 : 90)
  // and far enough away that the child has to travel, not nudge
  const far = wrong.filter(d => Math.abs(d - anchor) >= START_GAP)
  return pick(far.length ? far : wrong)
}

/** What is being made, and why anybody wants it. ONE source for the ask, the demo and the verdict. */
export function pieceOf(r: Round): { piece: string; because: string } {
  return r.type === 'fold' ? PAPER[r.shape] : { piece: r.job_.piece, because: r.job_.because }
}

/**
 * ⚠️ A CHARACTER BUDGET ON THE ASK, BECAUSE NOTHING CAN SEE A WRAP. The bubble's reserve is a share
 * of the height and its content is prose, so the two can only be held together by counting. Measured
 * at 640x320: the bubble renders ~17.5px a line inside 14px of padding against a 67px reserve, so
 * TWO lines fit and three do not — and three overran onto the turning arm, which is the one thing
 * the child has to read. 90 characters is two lines at that width. The chalkboard's `PLAN_BUDGET`,
 * one chapter along.
 */
export const ASK_BUDGET = 90

export function makeRound(d: Tier, roundIdx: number, asked: QType[] = []): Round {
  const job = WEEK[roundIdx % WEEK.length]
  /**
   * Coverage nudge: spend a scarce round on the type that has not been asked.
   * ⚠️ ONE DIRECTION ONLY. A fold round needs nothing but a shape, so any job can be asked as one —
   * but an angle round needs a piece, a reason and a wanted kind, and a fold job has none of them.
   * Inventing them is how a chapter states something false. The week alternates, so with `coverage`
   * declared this is belt-and-braces rather than the mechanism.
   */
  const type: QType =
    job.type === 'angle' && asked.includes('angle') && !asked.includes('fold') ? 'fold' : job.type

  // the second half of the `||` is what narrows `job` to an AngleJob below, and it is not redundant
  // belt: `type === 'angle'` already implies it, and only the compiler needs telling.
  if (type === 'fold' || job.type === 'fold') {
    const shape = pick(SHAPES[d])
    const p = PAPER[shape]
    return { type: 'fold', tier: d, shape, job_: job,
      ask: `${cap(p.piece)} — ${p.because}. Mark every fold that matches.` }
  }
  const useDegrees = d === 3
  const want: AngleKind = job.wants
  const deg = pick(KIND_POOL[d][want])
  return useDegrees
    ? { type: 'angle', tier: d, job: 'degrees', want, target: deg, start: startFor(want, deg), job_: job,
        ask: `Set ${job.piece} to exactly ${deg}°.` }
    : { type: 'angle', tier: d, job: 'kind', want, start: startFor(want), job_: job,
        ask: askForKind(want, job) }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function askForKind(want: AngleKind, job: AngleJob): string {
  const how = want === 'acute' ? 'SHARPER than a square corner'
    : want === 'obtuse' ? 'SHALLOWER than a square corner'
    : 'exactly SQUARE'
  return `Make ${job.piece} ${how} — ${job.because}.`
}

// ─── grading ─────────────────────────────────────────────────────────────────────────
export type Answer = number | number[]

export function grade(r: Round, a: Answer): boolean {
  if (r.type === 'angle') {
    const deg = a as number
    return r.job === 'degrees' ? deg === r.target : kindOf(deg) === r.want
  }
  const marked = [...new Set((a as number[]).map(norm))].sort((x, y) => x - y)
  const truth = trueAxes(r.shape)
  return marked.length === truth.length &&
    marked.every((m, i) => Math.abs(m - truth[i]) < 0.01)
}

/** How many of the marked axes actually held — for the post-commit verdict, never before it. */
export function heldCount(shape: Shape, marked: number[]): number {
  return [...new Set(marked.map(norm))].filter(m => isTrueAxis(shape, m)).length
}

// ─── words ───────────────────────────────────────────────────────────────────────────
/** A miss reveals the RULE, never the answer. Written as well as spoken. */
export function missFor(r: Round, a: Answer): string {
  if (r.type === 'angle') {
    const deg = a as number
    if (r.job === 'degrees') {
      return deg < (r.target ?? 90)
        ? "Not open enough yet — keep turning."
        : "That's gone too far — bring it back."
    }
    if (r.want === 'right') return "Nearly. The square corner has to sit flush — no gap, no overlap."
    if (r.want === 'acute') return "That's past the square corner — bring it in."
    return "That's still inside the square corner. Open it wider."
  }
  const marked = (a as number[])
  const held = heldCount(r.shape, marked)
  const wrong = marked.length - held
  if (wrong > 0) return "One of those didn't match. Fold it in your head before you mark it."
  return `${held === 0 ? 'None' : held === 1 ? 'One' : 'Only ' + held} held. Look again — there are more places the halves match.`
}

export function verdictFor(r: Round, a: Answer): string {
  if (r.type === 'angle') {
    const deg = a as number
    const k = kindOf(deg)
    const why = k === 'acute' ? 'sharper than the square corner'
      : k === 'obtuse' ? 'shallower than the square corner' : 'flush with the square corner'
    return `${deg}° — ${k}, ${why}.`
  }
  const n = SHAPE_LINES[r.shape]
  const held = heldCount(r.shape, a as number[])
  return `${cap(SHAPE_LABEL[r.shape])} — ${n} line${n === 1 ? '' : 's'} of symmetry. You found ${held}.`
}

/** Math-only dedupe key, so a rotating site never reads as variety. */
export function sigFor(r: Round): string {
  return r.type === 'angle'
    ? `angle|${r.job}|${r.job === 'degrees' ? r.target : r.want}`
    : `fold|${r.shape}`
}

// ─── layout ──────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ THERE IS NONE ANY MORE, AND THAT IS THE POINT OF THE PORT. This module used to carry
 * `shopLayout`, `armFor`, `TOP_BAND`/`BOT_BAND`, `ARM_MARGIN`, `TAP_MIN` and the Menu chip's own
 * metrics — every one of them a copy of arithmetic three other chapters also carried, and every one
 * of them a thing that had to be swept at ten viewport sizes. GameShell owns the bands now and
 * `FitSlot` scales the instrument into whatever is left, so all of it went with the bespoke scene
 * (2026-08-14) rather than being kept alive for a gate to test.
 *
 * What did NOT go is everything above this line: the week, the paper table, the axis sets, the
 * grader and the words. That split — math and words here, layout in the shell — is the whole
 * reason ten chapters can share one engine.
 */
export {}
