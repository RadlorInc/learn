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
 * of `deg` IS `deg`, and a mirror about an axis IS a fold. The art carries the maths.
 *
 * See docs/storyboards/angle-shop.md for the shot list and docs/chapter-craft.md for the rules
 * every number here is obeying.
 */

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
 * ⚠️ HYSTERESIS IS NOT POLISH HERE. Quantizing a continuous reading to 5° puts a boundary every
 * 2.5°, and a still hand's landmark noise is the same order — so without this a hand held ON a
 * boundary dithers between two steps for ever, the "hold still" commit never arms, and the camera
 * is a dead button, which the craft doc calls the worst outcome there is.
 *
 * ⚠️ AND THE NUMBER IS DERIVED, NOT TASTE. A hand settled on step C sees raw values up to
 * `STEP/2 + noise` away from C, so suppressing noise of ±2.5° needs a hold band of at least 5° —
 * i.e. a FULL step. So the reading changes exactly when the hand reaches the next step's own
 * centre, which is also the easiest rule to explain: tilt to where you want it and it goes there.
 * A weaker band (0.62 was the first guess) flips back and forth on a boundary and was caught by
 * mutation-testing the gate, not by looking.
 */
export const SNAP_HOLD = 1

/** The reachable angle a raw hand reading means, holding its current step until clearly past it. */
export function snapDeg(raw: number, current: number | null): number {
  const want = clampDeg(Math.round(raw / STEP) * STEP)
  if (current === null) return want
  const cur = clampDeg(current)
  return Math.abs(raw - cur) < STEP * SNAP_HOLD ? cur : want
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

// ─── the cast ────────────────────────────────────────────────────────────────────────
/**
 * The drawn cycles this chapter consumes. Declared HERE so the scene and the idle-art gate read one
 * source — art registered in sheets.ts and consumed by nobody is art that was paid for and never
 * reached a child, and that gate can only see a chapter that says what it uses.
 */
export const CAST = {
  /** Slate, standing / walking. The 9–11 band's first protagonist cycle. */
  slate: '/assets/characters/slate_side.png',
  /** Slate winding the handle — the pose the child's ◀ ▶ is driving. */
  slateWork: '/assets/characters/slate_work.png',
  /** The foreman, who brings the job and then stops watching. Already generated for this band. */
  foreman: '/assets/objects/foreman_bear_side.png',
} as const

// ─── the week ────────────────────────────────────────────────────────────────────────
export type Site = 'roof' | 'bridge' | 'shelter'
export type QType = 'angle' | 'fold'

export interface Job {
  day: string
  site: Site
  type: QType
  /** what is being made */
  piece: string
  /** who wants it and why — §0a's second half, never decoration */
  because: string
  /**
   * ⚠️ THE STORY FIXES THE KIND; THE TIER PICKS THE DEGREE. Drawn independently they contradict
   * each other and the chapter states something false — driven on screen, a ramp asked to be
   * "SHARPER than a square corner" *because a barrow has to get up it loaded*, which is backwards.
   * A generated sentence must hold for EVERY seed the generator can draw (Leaderboard shipped the
   * same fault: "two moves partly cancel" on a both-positive seed). Angle jobs only.
   */
  wants?: AngleKind
}

/**
 * Slate's first week. The scenario fixes the CONTEXT and the tier picks the DIFFICULTY, so story
 * and difficulty stay independent — TickTock's structure, which is what stopped its day-table
 * making two rounds the same question.
 */
export const WEEK: Job[] = [
  { day: 'Mon am', site: 'roof',    type: 'angle', piece: 'the shed roof',        because: "Mrs Pell's tools are getting wet", wants: 'acute'},
  { day: 'Mon pm', site: 'roof',    type: 'fold',  piece: 'the gable vent',        because: 'it has to sit square in the hole' },
  { day: 'Tue am', site: 'bridge',  type: 'angle', piece: 'the approach ramp',     because: 'a barrow has to get up it loaded', wants: 'obtuse'},
  { day: 'Tue pm', site: 'bridge',  type: 'fold',  piece: 'the deck panel',        because: 'it goes in either way round' },
  { day: 'Wed am', site: 'shelter', type: 'angle', piece: 'the canopy',            because: 'the queue stands under it in the rain', wants: 'acute'},
  { day: 'Wed pm', site: 'shelter', type: 'fold',  piece: 'the side panel',        because: 'it mirrors the one opposite' },
  { day: 'Thu am', site: 'roof',    type: 'angle', piece: 'the bike rack roof',    because: 'bikes underneath, low clearance', wants: 'obtuse'},
  { day: 'Thu pm', site: 'shelter', type: 'fold',  piece: 'the school sign',       because: 'it reads the same from both approaches' },
  { day: 'Fri am', site: 'bridge',  type: 'angle', piece: 'the market awning',     because: 'it has to sit square to the shopfront', wants: 'right'},
  { day: 'Fri pm', site: 'roof',    type: 'fold',  piece: 'the market banner',     because: 'it hangs centred or not at all' },
]

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
  job_: Job
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

/** The set-square guide is a scaffold and it RETIRES at the top tier — TickTock's minute ring. */
export const guideShown = (d: Tier) => d < 3

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

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(a: T[]): T => a[rint(0, a.length - 1)]

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

export function makeRound(d: Tier, roundIdx: number, asked: QType[] = []): Round {
  const job = WEEK[roundIdx % WEEK.length]
  // coverage: if one type has never been asked and the week would repeat the other, force it
  const unmet = (['angle', 'fold'] as QType[]).filter(t => !asked.includes(t))
  const type: QType = unmet.length === 1 && !unmet.includes(job.type) ? unmet[0] : job.type

  if (type === 'fold') {
    const shape = pick(SHAPES[d])
    return { type: 'fold', tier: d, shape, job_: job,
      ask: `${cap(job.piece)} has to be symmetric or it won't sit square. Mark every fold that matches.` }
  }
  const useDegrees = d === 3
  const want: AngleKind = job.wants ?? 'acute'
  const deg = pick(KIND_POOL[d][want])
  return useDegrees
    ? { type: 'angle', tier: d, job: 'degrees', want, target: deg, start: startFor(want, deg), job_: job,
        ask: `Set ${job.piece} to exactly ${deg}°.` }
    : { type: 'angle', tier: d, job: 'kind', want, start: startFor(want), job_: job,
        ask: askForKind(want, job) }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function askForKind(want: AngleKind, job: Job): string {
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
 * ⚠️ The world yields to the tap targets, never the other way round — the ground line is derived
 * from the band left over, not picked as a percentage.
 */
export const TAP_MIN = 44

/**
 * Where each site's piece is actually fitted, and how far the ground line sits down the painting.
 * ⚠️ THIS IS LAYOUT DATA, SO IT LIVES HERE RATHER THAN IN THE SCENE — the arm's reach depends on it
 * and the gate has to be able to sweep it. One shared formula put the roof's rafter across the
 * cottage's FACE like a pole leaning on a house, and then a near-vertical arm ran off the top of
 * the screen; neither was visible to a check that only knew the bands.
 */
export const SITE_GEO: Record<Site, { ground: number; vx: number; vyUp: number }> = {
  roof:    { ground: 0.86, vx: 0.40, vyUp: 0.60 },   // the open gable
  bridge:  { ground: 0.84, vx: 0.30, vyUp: 0.06 },   // the bank, where the ramp starts
  shelter: { ground: 0.86, vx: 0.34, vyUp: 0.52 },   // the bare post tops
}

export const ARM_MARGIN = 16

export interface Arm { vx: number; vy: number; len: number }

/**
 * The turning arm, bounded so it CANNOT leave the frame band at any angle the steppers can reach.
 * ⚠️ Measured on screen before this existed: at 100° on the roof the arm's box topped out at y = −9,
 * i.e. off the screen. The worst case is straight up (90°), which reaches `len` above the vertex,
 * and sideways at the extremes, which reaches `len` either way — so all three are bounded here
 * rather than hoped for.
 */
export function armFor(site: Site, vw: number, vh: number, L: Layout, groundPx: number): Arm {
  const g = SITE_GEO[site]
  const vx = Math.round(vw * g.vx)
  // ⚠️ SIZE THE ARM FIRST, THEN PLACE THE VERTEX. Deriving the length from a vertex the site
  // preferred collapsed it to 21px on a 640×320 frame — the site wants a HIGH vertex and a short
  // frame has no headroom above it, so the two fought and the arm lost. Now the vertex is pushed
  // DOWN as far as it must be for the arm to fit, and only then honours the site's preference.
  const len = Math.round(Math.min(
    vw * 0.30,
    (L.frameH - ARM_MARGIN) * 0.62,
    vw - ARM_MARGIN - vx,                // reaching right must stay on screen
    vx - ARM_MARGIN,                     // reaching left must stay on screen
  ))
  const prefer = groundPx - Math.round(L.frameH * g.vyUp)
  const vy = Math.min(groundPx, Math.max(prefer, L.frameTop + len + ARM_MARGIN))
  return { vx, vy, len }
}

export interface Layout {
  short: boolean
  chromeH: number      // the back chip strip
  bubbleTop: number
  bubbleH: number
  frameTop: number     // the band the turning arm / panel lives in
  frameH: number
  groundY: number      // where the cast's feet land
  controlTop: number
  controlH: number
  btn: number          // tap target edge
}

export function shopLayout(vw: number, vh: number): Layout {
  const short = vh < 470
  const chromeH = Math.round(Math.max(38, Math.min(54, vh * 0.075)))
  // the control band is sized from the BUTTON, which may not shrink below the tap floor
  const btn = Math.max(TAP_MIN, Math.round(Math.min(vw / 8.5, vh / (short ? 6.4 : 7.6))))
  const controlH = Math.round(btn + (short ? 14 : 26))
  const controlTop = vh - controlH
  // ⚠️ MORE reserve on a short frame, not less: the text wraps to more lines exactly where
  // there is least room, and a bubble that overruns its reserve lands on the arm.
  const bubbleH = Math.round(short ? vh * 0.21 : vh * 0.13)
  const bubbleTop = chromeH + (short ? 2 : 8)
  const frameTop = bubbleTop + bubbleH + (short ? 4 : 12)
  const groundY = controlTop - (short ? 8 : 18)
  const frameH = Math.max(60, groundY - frameTop)
  return { short, chromeH, bubbleTop, bubbleH, frameTop, frameH, groundY, controlTop, controlH, btn }
}
