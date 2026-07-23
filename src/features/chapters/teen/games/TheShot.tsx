'use client'
/**
 * TheShot — the Quadratics & Parabolas chapter (15–16) as a PLAYABLE GAME.
 * World: a basketball court. The ball's flight IS the parabola — where it touches
 * the floor are the ROOTS, the top of the arc is the VERTEX.
 *
 * ── WHERE ZERO IS, AND WHY IT MATTERS ─────────────────────────────────────────
 * x = 0 is the HALF-COURT LINE, not the shooter. That one naming decision is what
 * makes every sign case a real shot instead of a story strain:
 *   both roots positive  → a shot taken and landed in the far half (the normal one)
 *   roots straddling 0   → released in your own half, lands in the far half (a heave)
 *   both roots negative  → released and landed inside your own half (a short heave)
 * Previously x = 0 meant nothing, so a negative root read as "behind the shooter"
 * and the only way to keep the story straight looked like clamping the roots — which
 * would have thrown away three of the four factoring sign cases. Naming the origin
 * costs nothing and keeps all four.
 *
 * ── EVERY PARABOLA HERE OPENS DOWNWARD ────────────────────────────────────────
 * A thrown ball arcs down (a < 0). The old chapter drew an UPWARD U from the board
 * equation (y = x² − 4) while flying the ball along a separate fabricated ∩ arc —
 * two different curves on one court, sharing only their roots. Now the ball flies
 * along the task's OWN parabola, so the picture and the equation are the same object.
 * Where the algebra wants a monic quadratic, the shot's height is written
 * −(x² + bx + c): the leading minus flips the arc the right way up and does not move
 * a single root, so the factoring skill is untouched and the drawing stops lying.
 *
 * ── HOW YOU ANSWER, gated PER QUESTION (never per chapter) ────────────────────
 *   • BUILD  → PartsBuilder, for answers that are a PAIR: the two roots (where it
 *              touches down) and the vertex (h, k). A pair is not a single number,
 *              so these keep their instrument.
 *   • READ   → L1 questions render the ARC beside the builder, so "read the arc" is
 *              a gesture the child can actually make. Without it the copy described
 *              a picture that was not on screen.
 *   • TAP    → AnswerPad, for the two questions whose answer is a SINGLE NUMBER:
 *              the landing read off factored form, and the height of the peak.
 *              Distractors are real misconceptions (see each generator).
 *   • PICK   → SpecPicker, for the L3 radical form: the answer is an EXPRESSION,
 *              not a number, so it keeps its picker.
 *
 * No guided round — the walkthrough works BOTH graded builder gestures (read the
 * arc, then solve by factoring), so nothing is scored that was never shown.
 */
import { useEffect, useMemo } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react'
import { Game, type BaseTask, type GameConfig, type DemoStep } from './parts/GameShell'
import { Palette, PartsBuilder, SpecPicker, numChoices, type SpecChoice } from './parts/gameKit'

const P: Palette = {
  nightTop: '#2a1c3d', nightBot: '#160f24',
  cream: '#f3edff', creamSoft: 'rgba(243,237,255,0.82)',
  inkOnPaper: '#1e1630', mutedOnPaper: '#7a6d95',
  gold: '#ffb347', goldDeep: '#e08a1e',
  coral: '#ff8a70', coralDeep: '#e05a3f', mint: '#5cd6ac',
  glass: 'rgba(40,26,64,0.6)', glassBorder: 'rgba(243,237,255,0.2)',
}

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pickOne = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]
const shuffle = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5)
const minus = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n))
/** "x − 3" / "x + 2" — one factor, written the way it appears on the board. */
const factorOf = (r: number) => `(x ${r < 0 ? '+' : '−'} ${Math.abs(r)})`

// ── SPOKEN forms ─────────────────────────────────────────────────────────────
// What is shown and what is said are different artifacts. `work` is read ALOUD on
// a reteach, and a U+2212 minus speaks as nothing ("4 − 7" → "four seven"), a
// superscript speaks as "x two", and "√36" speaks as "36". Display keeps the
// glyphs; anything Milo says is built from words.
const spoken = (n: number) => (n < 0 ? `negative ${Math.abs(n)}` : `${n}`)
const spQuad = (a: number, b: number, c: number) => [
  `${a < 0 ? 'negative ' : ''}${Math.abs(a) === 1 ? '' : `${Math.abs(a)} `}x squared`,
  b === 0 ? '' : `${b < 0 ? 'minus' : 'plus'} ${Math.abs(b) === 1 ? '' : `${Math.abs(b)} `}x`,
  c === 0 ? '' : `${c < 0 ? 'minus' : 'plus'} ${Math.abs(c)}`,
].filter(Boolean).join(', ')
const spFactor = (r: number) => `x ${r < 0 ? 'plus' : 'minus'} ${Math.abs(r)}`

// ── value + task types ──────────────────────────────────────────────────────
// roots  → the two touch-down x's (order-independent)
// vertex → the peak coordinates (h, k)
// pick   → a radical-form choice id (irrational quadratic-formula roots)
// (peak / land answer with a single tapped number, so they carry no V of their own)
type V =
  | { k: 'roots'; a: number; b: number }
  | { k: 'vertex'; a: number; b: number }
  | { k: 'pick'; id: string }

interface Task extends BaseTask {
  kind: 'roots' | 'vertex' | 'peak' | 'land' | 'formula'
  /** the shot's height h(x) = pa·x² + pb·x + pc — always pa < 0, so it is an arc */
  pa: number; pb: number; pc: number
  r1?: number; r2?: number     // roots / touch-down x's
  h?: number; kk?: number      // vertex (h, k)
  n?: number                   // the single number a padded question wants
  /** Set → answered by TAPPING. Carries the misconception values that become the
   *  distractors, so a wrong tap names a wrong METHOD, not a slip of the finger. */
  pad?: number[]
  /** Set → render the arc beside the instrument. Only the L1 READING questions get
   *  it: they ask the child to read the court, so the court has to be on screen. */
  showArc?: boolean
  choices?: SpecChoice[]       // formula options
  answerId?: string            // formula correct id
}

/** The shot whose height is h(x) = −(x − r1)(x − r2): a downward arc touching the
 *  floor at r1 and r2. Returns the expanded coefficients and the peak. */
function shotThrough(r1: number, r2: number) {
  if (r1 > r2) [r1, r2] = [r2, r1]
  const pa = -1
  const pb = r1 + r2
  const pc = -r1 * r2
  const h = (r1 + r2) / 2
  const kk = ((r2 - r1) / 2) ** 2       // peak height, always > 0
  return { pa, pb, pc, r1, r2, h, kk }
}

/** Tidy a x² + b x + c into a label. */
function quad(a: number, b: number, c: number): string {
  const aPart = a === 1 ? 'x²' : a === -1 ? '−x²' : `${a < 0 ? '−' : ''}${Math.abs(a)}x²`
  let s = aPart
  if (b !== 0) s += ` ${b < 0 ? '−' : '+'} ${Math.abs(b) === 1 ? 'x' : `${Math.abs(b)}x`}`
  if (c !== 0) s += ` ${c < 0 ? '−' : '+'} ${Math.abs(c)}`
  return s
}

// ── seed pools ────────────────────────────────────────────────────────────────
// Built once, by enumeration, instead of by a retry loop — so "a legal seed exists"
// and "no distractor can collide with the answer" are properties of a list I can
// read and a script can sweep, not of a loop that might spin.

/** L1 READ: both touch-downs in the far half (x ≥ 0, the basket's side) and inside
 *  the drawn court. Spread ≤ 6 keeps the peak (spread/2)² on the visible grid. */
const READ_PAIRS = (() => {
  const out: [number, number][] = []
  for (let r1 = 0; r1 <= 8; r1++) for (let r2 = r1 + 1; r2 <= 8; r2++) if (r2 - r1 <= 6) out.push([r1, r2])
  return out
})()
/** the vertex sub-pool: same parity, so h and k are both whole numbers the
 *  integer PartsBuilder can actually be set to (k ≤ 9 ≤ its ±12 range). */
const VERTEX_PAIRS = READ_PAIRS.filter(([a, b]) => (a + b) % 2 === 0)

/** L2 FACTORING: any two distinct non-zero roots in −6..6. Deliberately NOT clamped
 *  to positives — with half-court at x = 0 all four sign cases are real shots, so
 *  the full factoring ramp survives. */
const FACTOR_PAIRS = (() => {
  const out: [number, number][] = []
  for (let r1 = -6; r1 <= 6; r1++) for (let r2 = r1 + 1; r2 <= 6; r2++) if (r1 !== 0 && r2 !== 0) out.push([r1, r2])
  return out
})()

/** L2 LAND (tapped): the far touch-down read off factored form. Excluded:
 *  a zero root and a symmetric pair (r1 = −r2) — either makes a misconception
 *  distractor collide with the answer and get silently dropped. */
const LAND_PAIRS = FACTOR_PAIRS.filter(([a, b]) => a + b !== 0)

/** L3 PEAK (tapped): the height of the arc, worked from the equation. Kept only
 *  where all three misconception values stay distinct from the answer and from
 *  each other, so none of them can be swallowed by numChoices. */
const PEAK_PAIRS = VERTEX_PAIRS.filter(([r1, r2]) => {
  const { h, kk, pc } = shotThrough(r1, r2)
  return new Set([kk, h, pc, -kk]).size === 4
})

// ── L1: read the roots OR the vertex straight off the arc ───────────────────
function readTask(): Task {
  const wantVertex = Math.random() < 0.5
  const [ra, rb] = pickOne(wantVertex ? VERTEX_PAIRS : READ_PAIRS)
  const q = shotThrough(ra, rb)
  const badge = `y = ${quad(q.pa, q.pb, q.pc)}`
  if (!wantVertex) {
    return {
      kind: 'roots', title: 'The landing', badge, tone: 'a', showEquals: false, showArc: true,
      prompt: 'Read the court — build the two x values where the ball touches the floor.',
      say: `Read the arc on the court. Where does the ball touch the floor — the two x values? Build them.`,
      work: [`The arc meets the floor at x equals ${spoken(q.r1)}, and at x equals ${spoken(q.r2)}. Those two x values are the roots.`],
      pa: q.pa, pb: q.pb, pc: q.pc, r1: q.r1, r2: q.r2,
    }
  }
  return {
    kind: 'vertex', title: 'The peak', badge, tone: 'a', showEquals: false, showArc: true,
    prompt: 'Read the court — build the peak of the arc, the vertex (h, k).',
    say: `Read the arc on the court. Where is the peak — the turning point of the shot? Build the vertex.`,
    work: [`The peak sits halfway between the two touch-downs, at x equals ${spoken(q.h)}, and the height there is ${spoken(q.kk)}. So the vertex is ${spoken(q.h)}, ${spoken(q.kk)}.`],
    pa: q.pa, pb: q.pb, pc: q.pc, h: q.h, kk: q.kk, r1: q.r1, r2: q.r2,
  }
}

// ── L2: solve for the touch-downs ───────────────────────────────────────────
function factorTask(): Task {
  const [ra, rb] = pickOne(FACTOR_PAIRS)
  const q = shotThrough(ra, rb)
  // the monic quadratic the child actually factors: (x − r1)(x − r2) = x² + mb x + mc
  const mb = -(q.r1 + q.r2), mc = q.r1 * q.r2
  return {
    kind: 'roots', title: 'Solve the shot', badge: `−(${quad(1, mb, mc)}) = 0`, tone: 'a', showEquals: false,
    prompt: 'Factor it, then build the two x values where the ball touches the floor.',
    say: `Solve this shot by factoring. Find the two x values where it touches the floor and build them.`,
    work: [
      `The minus out front flips the arc over, but it never moves a touch-down. So solve ${spQuad(1, mb, mc)} equals zero.`,
      `Two numbers that multiply to ${spoken(mc)} and add to ${spoken(mb)} are ${spoken(-q.r1)} and ${spoken(-q.r2)}. So it factors into ${spFactor(q.r1)}, times ${spFactor(q.r2)}.`,
      `Now flip each sign to read the root: x equals ${spoken(q.r1)}, and x equals ${spoken(q.r2)}.`,
    ],
    pa: q.pa, pb: q.pb, pc: q.pc, r1: q.r1, r2: q.r2,
  }
}

function squareRootTask(): Task {
  // the shot's height is h(x) = k − x²: peaked exactly over half-court, touching
  // down at ±√k. Solving it IS solving x² = k, unchanged.
  const root = rint(2, 7)
  const k = root * root
  return {
    kind: 'roots', title: 'Solve the shot', badge: `x² = ${k}`, tone: 'a', showEquals: false,
    prompt: 'Take square roots, then build both touch-downs.',
    say: `Solve x squared equals ${k} by taking square roots. Build both touch-down points.`,
    work: [`Take the square root of both sides, and keep BOTH signs, because a positive and a negative both square to ${k}. The square root of ${k} is ${root}, so the ball touches down at ${spoken(-root)} and at ${root}.`],
    pa: -1, pb: 0, pc: k, r1: -root, r2: root,
  }
}

/** L2, ANSWERED BY TAPPING — the answer is one number, so there is nothing to build.
 *  The shot is given in FACTORED form, and the whole skill is flipping the sign
 *  inside a factor: (x + 2) means a touch-down at −2, not +2. The distractors are
 *  exactly the ways that goes wrong:
 *    −rFar  → read the far factor without flipping its sign  ← the named misconception
 *     rNear → gave the near touch-down instead of the landing
 *    −rNear → flipped the wrong one. */
function landTask(): Task {
  const [ra, rb] = pickOne(LAND_PAIRS)
  const q = shotThrough(ra, rb)
  const far = q.r2, near = q.r1
  return {
    kind: 'land', title: 'Where it lands', badge: `h = −${factorOf(near)}${factorOf(far)}`, tone: 'a', showEquals: false,
    prompt: `Tap the x where the ball comes down — the touch-down further down the court.`,
    padInstruction: 'Tap the x value of the far touch-down — the bigger one.',
    say: `Here is the shot in factored form. Each bracket gives one touch-down. Tap the x value of the far one, further down the court.`,
    work: [`A bracket is zero when x makes it zero. ${spFactor(near)} is zero at x equals ${spoken(near)}, and ${spFactor(far)} is zero at x equals ${spoken(far)}. The far one, the bigger x, is ${spoken(far)}.`],
    pa: q.pa, pb: q.pb, pc: q.pc, r1: q.r1, r2: q.r2, n: far,
    pad: [-far, near, -near],
  }
}

/** L3, ANSWERED BY TAPPING — how high the ball gets. One number, and no arc on
 *  screen, so it is worked from the equation: the peak sits at x = −b/2a, and the
 *  answer is the HEIGHT there. The distractors are the three real ways it goes wrong:
 *     h   → gave the peak's x instead of its height  ← the named misconception
 *     pc  → gave the height over half-court (x = 0) instead of at the peak
 *    −kk  → lost the sign flipping a = −1 back. */
function peakTask(): Task {
  const [ra, rb] = pickOne(PEAK_PAIRS)
  const q = shotThrough(ra, rb)
  return {
    kind: 'peak', title: 'How high', badge: `h = ${quad(q.pa, q.pb, q.pc)}`, tone: 'b', showEquals: false,
    context: "This rule gives the ball's height as it flies up and back down.",
    prompt: 'Tap how high the ball gets at the top of its arc.',
    padInstruction: 'Work out the greatest height it reaches, then tap that number.',
    say: `This shot's height is ${spQuad(q.pa, q.pb, q.pc)}. Tap how high the ball gets at the very top.`,
    work: [
      `The peak sits at x equals negative b, divided by 2 a. That is ${spoken(-q.pb)} divided by ${spoken(2 * q.pa)}, so x equals ${spoken(q.h)}.`,
      `But that is WHERE the peak is. The question asks HOW HIGH, so put ${spoken(q.h)} back into the height. The height there is ${spoken(q.kk)}.`,
    ],
    pa: q.pa, pb: q.pb, pc: q.pc, h: q.h, kk: q.kk, n: q.kk,
    pad: [q.h, q.pc, -q.kk],
  }
}

// ── L3: quadratic formula, irrational touch-downs → pick the radical form ────
function formulaTask(): Task {
  let b = 0, c = 0, disc = 0, g = 0
  // b ≠ 0 matters: at b = 0 the "forgot to negate b" option is IDENTICAL to the
  // answer, so the picker showed a duplicate and two options graded correct.
  do { b = rint(-6, 6); c = rint(-5, 5); disc = b * b - 4 * c; g++ }
  while ((b === 0 || disc <= 0 || Number.isInteger(Math.sqrt(disc))) && g < 200)
  const ans = `x = (${minus(-b)} ± √${disc}) / 2`
  const opts = shuffle([
    { id: ans, label: ans },
    { id: `x = (${minus(b)} ± √${disc}) / 2`, label: `x = (${minus(b)} ± √${disc}) / 2` },
    { id: `x = (${minus(-b)} ± √${disc + 4}) / 2`, label: `x = (${minus(-b)} ± √${disc + 4}) / 2` },
    { id: `x = (${minus(-b)} ± √${Math.abs(disc - 4)}) / 2`, label: `x = (${minus(-b)} ± √${Math.abs(disc - 4)}) / 2` },
  ])
  return {
    kind: 'formula', title: 'Long-range shot', badge: `−(${quad(1, b, c)}) = 0`, tone: 'b', showEquals: false,
    prompt: 'The touch-downs are irrational — pick the radical form.',
    say: `This shot touches down at points you cannot count off — they are irrational. Use the quadratic formula and pick the radical form.`,
    work: [
      `The minus out front does not move a touch-down, so solve ${spQuad(1, b, c)} equals zero, with a equals 1, b equals ${spoken(b)}, and c equals ${spoken(c)}.`,
      `The discriminant, b squared minus 4 a c, is ${disc}. So x equals ${spoken(-b)}, plus or minus the square root of ${disc}, all divided by 2.`,
    ],
    pa: -1, pb: -b, pc: -c, choices: opts, answerId: ans,
  }
}

function makeTask(d: 1 | 2 | 3): Task {
  if (d === 1) return readTask()
  if (d === 2) {
    const r = Math.random()
    return r < 0.4 ? factorTask() : r < 0.7 ? squareRootTask() : landTask()
  }
  return Math.random() < 0.5 ? formulaTask() : peakTask()
}

// ── worked example 1 (walkthrough): READ the arc → build the roots ──────────
// h(x) = −(x − 1)(x − 5) = −x² + 6x − 5. A real downward arc, both touch-downs in
// the far half, peak (3, 4) — the picture and the equation are the same curve.
const DEMO_READ: Task = {
  kind: 'roots', title: 'The landing', badge: 'y = −x² + 6x − 5', tone: 'a', showEquals: false,
  prompt: '', say: '', work: ['The arc meets the floor at x = 1 and x = 5 — those two x values are the roots.'],
  pa: -1, pb: 6, pc: -5, r1: 1, r2: 5, h: 3, kk: 4,
}
// `a` carries the ball's progress along the arc (0 = release, 100 = touch-down);
// `b` is a beat flag the scene reads to reveal markers as they are spoken:
//   b=0 idle · b=1 launched, rising · b=2 at the peak · b=3 down · b=4 solved
const DEMO_READ_STEPS: DemoStep<V>[] = [
  { say: "Here's a shot. The ball's flight traces a curve called a parabola, and this one is y equals negative x squared, plus six x, minus five.", value: { k: 'roots', a: 0, b: 0 }, board: 'y = −x² + 6x − 5' },
  { say: 'The gold line marked zero is half-court. To the right of it is the far half, where the basket is. To the left is your own half.', value: { k: 'roots', a: 0, b: 0 }, board: '0 = half-court' },
  { say: 'Watch it go. The ball leaves the floor and starts to arc down the court.', value: { k: 'roots', a: 12, b: 1 }, board: 'it leaves the floor' },
  { say: 'Up to the top of the arc — the turning point, four metres high, three metres past half-court.', value: { k: 'roots', a: 50, b: 2 }, board: 'peak (3, 4)' },
  { say: 'Then it curves back down and touches the floor again, further down the court.', value: { k: 'roots', a: 100, b: 3 }, board: 'it touches down' },
  { say: 'Those two touch-down spots are the roots: the x values where the height is zero.', value: { k: 'roots', a: 100, b: 3 }, board: 'roots: where y = 0' },
  { say: 'Read the first one off the floor. The ball left the ground at x equals one.', value: { k: 'roots', a: 100, b: 3 }, board: 'leaves at x = 1' },
  { say: 'And read the second. It comes down at x equals five.', value: { k: 'roots', a: 100, b: 3 }, board: 'comes down at x = 5' },
  { say: 'So the roots are one and five. Build those two numbers.', value: { k: 'roots', a: 100, b: 4 }, board: 'x = 1, 5' },
]

// ── worked example 2: SOLVE by factoring, on a shot that crosses half-court ──
// h(x) = −(x² − 2x − 8) = −x² + 2x + 8. Touch-downs at −2 and 4: released two
// metres inside your own half, comes down four metres past half-court. This is the
// example that has to carry a negative root, so it is the one that names what a
// negative x means.
const DEMO_SOLVE: Task = {
  kind: 'roots', title: 'Solve the shot', badge: '−(x² − 2x − 8) = 0', tone: 'a', showEquals: false,
  prompt: '', say: '', work: ['x² − 2x − 8 = (x + 2)(x − 4), so x = −2 and x = 4.'],
  pa: -1, pb: 2, pc: 8, r1: -2, r2: 4, h: 1, kk: 9,
}
const DEMO_SOLVE_STEPS: DemoStep<V>[] = [
  { say: "Now one you can't just read off the floor — you have to solve it. Negative, bracket, x squared minus two x minus eight, equals zero.", value: { k: 'roots', a: 0, b: 0 }, board: '−(x² − 2x − 8) = 0' },
  { say: 'That minus out front flips the whole arc over so it opens downward, like a real shot. But flipping an arc never moves where it touches the floor, so we can set it aside and solve the inside.', value: { k: 'roots', a: 0, b: 0 }, board: 'x² − 2x − 8 = 0' },
  { say: 'Factor it. We need two numbers that multiply to negative eight and add to negative two.', value: { k: 'roots', a: 0, b: 0 }, board: '× = −8   + = −2' },
  { say: 'Two and negative four. Two times negative four is negative eight, and two plus negative four is negative two.', value: { k: 'roots', a: 0, b: 0 }, board: '2 and −4' },
  { say: 'So it factors into x plus two, times x minus four.', value: { k: 'roots', a: 0, b: 0 }, board: '(x + 2)(x − 4) = 0' },
  { say: 'Now read the touch-downs, and flip each sign as you go. X plus two is zero when x is negative two — not plus two.', value: { k: 'roots', a: 0, b: 0 }, board: 'x + 2 = 0 → x = −2' },
  { say: 'And x minus four is zero when x is four.', value: { k: 'roots', a: 0, b: 0 }, board: 'x − 4 = 0 → x = 4' },
  { say: 'Check it on the court. The ball leaves the ground at negative two — two metres inside your own half — arcs over half-court, and comes down four metres the other side.', value: { k: 'roots', a: 100, b: 3 }, board: 'over half-court' },
  { say: 'So the touch-downs are negative two and four. Build those two numbers.', value: { k: 'roots', a: 100, b: 4 }, board: 'x = −2, 4' },
]

// ── hand-authored SVG basketball court ──────────────────────────────────────
// A stylised arena — dusk backdrop, crowd, spotlight, wood floor on the x-axis, a
// chalk math grid over it, the shooter standing at the near touch-down and the
// basket standing at a FIXED spot in the far half (it is a landmark, not the answer;
// pinning it to the landing was what made a negative root look impossible).
// During the walkthrough the ball ACTS OUT the shot along the task's OWN parabola —
// the flight and the graphed curve are one and the same line.
function ArcScene({ palette, task, value, walk, ended }: {
  palette: Palette; task: Task; value: V; walk?: boolean; ended: boolean
}) {
  const p = palette
  const reduce = useReducedMotion()
  const W = 340, H = 300, R = 10 // grid half-range in x; floor (y = 0) sits mid-frame
  const sx = (x: number) => ((x + R) / (2 * R)) * W
  const sy = (y: number) => H - ((y + R) / (2 * R)) * H
  const floorY = sy(0)
  const HOOP_X = 7   // the basket: a fixed landmark in the far half

  const shot = (x: number) => task.pa * x * x + task.pb * x + task.pc

  // the graphed parabola — the SAME curve the ball flies along
  const graphD = useMemo(() => {
    const f = (x: number) => task.pa * x * x + task.pb * x + task.pc
    // Pen-up flag, not bare 'M' markers: a run of off-frame samples used to push one
    // 'M' each and the `replace(/M M/g)` only collapsed non-overlapping PAIRS, so a
    // steep parabola emitted "M M M M M" (and a trailing 'M') — an invalid `d`.
    const pts: string[] = []
    let up = true
    for (let i = 0; i <= 120; i++) {
      const x = -R + (i / 120) * (2 * R)
      const y = f(x)
      if (y < -R - 2 || y > R + 2) { up = true; continue }
      pts.push(`${up ? 'M' : 'L'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`)
      up = false
    }
    return pts.join(' ')
  }, [task.pa, task.pb, task.pc])

  const hasRoots = task.r1 !== undefined && task.r2 !== undefined
  const hasVertex = task.h !== undefined && task.kk !== undefined
  const inBox = (x: number, y: number) => Math.abs(x) <= R && Math.abs(y) <= R

  // `acting` is walkthrough-only: outside it, value.a is the child's first BUILDER
  // number, not the ball's progress, and reading it as progress would fly the ball
  // to nonsense.
  const acting = !!walk && value.k === 'roots' && hasRoots
  const targetProg = acting ? Math.max(0, Math.min(100, value.a)) / 100 : 0
  const beat = acting ? value.b : 0

  const rL = hasRoots ? Math.min(task.r1!, task.r2!) : -2
  const rR = hasRoots ? Math.max(task.r1!, task.r2!) : 2
  const vx = task.h ?? (rL + rR) / 2
  const vy = task.kk ?? shot(vx)

  // ── CONTINUOUS ball travel along the real curve, driven at 60fps ──
  const progress = useMotionValue(0)
  useEffect(() => {
    const controls = animate(progress, targetProg, { duration: reduce ? 0 : (acting ? 1.5 : 0.3), ease: [0.33, 0.02, 0.2, 1] })
    return () => controls.stop()
  }, [targetProg, acting, reduce, progress])
  const ballCX = useTransform(progress, (t) => sx(rL + (rR - rL) * t))
  const ballCY = useTransform(progress, (t) => sy(shot(rL + (rR - rL) * t)))
  const ballSpin = useTransform(progress, (t) => -t * 760)
  const squashX = useTransform(progress, [0, 0.12, 0.86, 1], [0.78, 1, 1, 1.16])
  const squashY = useTransform(progress, [0, 0.12, 0.86, 1], [1.22, 1, 1, 0.82])
  const trailD = useTransform(progress, (t) => {
    const out: string[] = []
    const N = 44
    for (let i = 0; i <= N; i++) {
      const x = rL + (rR - rL) * (i / N) * t
      out.push(`${i === 0 ? 'M' : 'L'}${sx(x).toFixed(1)},${sy(shot(x)).toFixed(1)}`)
    }
    return out.join(' ')
  })

  const rising = beat === 1 || beat === 2
  const landed = beat >= 3
  const released = acting && beat >= 1
  // Outside the walkthrough the markers stay HIDDEN until the reveal — they are the
  // answer to the L1 reading questions, so showing them would answer the question.
  const showRoots = acting ? beat >= 3 : ended
  const showVertex = acting ? beat >= 2 : ended
  const showPeak = acting && beat >= 2
  const done = ended || (acting && beat >= 4)
  const graphCol = done ? p.mint : p.gold
  const spring = { type: 'spring' as const, stiffness: 320, damping: 18 }
  const B = 12 // ball radius (svg units)
  const shX = sx(rL)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1vh, 12px)' }}>
      <svg viewBox={`0 0 ${W} ${H}`}  style={{ width: 'clamp(230px, 32vw, 360px)', height: 'auto', borderRadius: 14, border: `1px solid ${p.glassBorder}`, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', display: 'block' }}>
        <defs>
          <linearGradient id="ts_sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#241634" />
            <stop offset="0.55" stopColor="#1b1029" />
            <stop offset="1" stopColor="#140b1f" />
          </linearGradient>
          <radialGradient id="ts_spot" cx="0.5" cy="0.16" r="0.75">
            <stop offset="0" stopColor="#fff3d6" stopOpacity="0.30" />
            <stop offset="0.45" stopColor="#ffd98a" stopOpacity="0.08" />
            <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ts_wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7a4a24" />
            <stop offset="1" stopColor="#5a3418" />
          </linearGradient>
          <radialGradient id="ts_ball" cx="0.36" cy="0.32" r="0.75">
            <stop offset="0" stopColor="#ffb765" />
            <stop offset="0.55" stopColor="#f08a2e" />
            <stop offset="1" stopColor="#c9631a" />
          </radialGradient>
        </defs>

        {/* ── arena backdrop ── */}
        <rect x={0} y={0} width={W} height={H} fill="url(#ts_sky)" />
        <g opacity={0.5}>
          {[18, 30, 42].map((cy, r) => (
            <g key={`crowd${r}`} opacity={0.16 + r * 0.03}>
              <rect x={0} y={cy} width={W} height={9} fill="#0c0716" />
              {Array.from({ length: 20 }).map((_, i) => (
                <circle key={i} cx={8 + i * (W / 19)} cy={cy + 3} r={2.2} fill={i % 3 === 0 ? p.gold : p.cream} opacity={0.35} />
              ))}
            </g>
          ))}
        </g>
        <rect x={0} y={0} width={W} height={H} fill="url(#ts_spot)" />

        {/* ── court floor at the x-axis + dim apron below ── */}
        <rect x={0} y={floorY} width={W} height={H - floorY} fill="url(#ts_wood)" opacity={0.9} />
        <rect x={0} y={floorY} width={W} height={H - floorY} fill="#0c0716" opacity={0.34} />
        <ellipse cx={W / 2} cy={floorY} rx={W * 0.46} ry={10} fill="#ffe6b0" opacity={0.06} />

        {/* ── chalk math grid (over the court, load-bearing) ── */}
        {[-R, -5, 5, R].map((gx) => (
          <line key={`v${gx}`} x1={sx(gx)} y1={0} x2={sx(gx)} y2={H} stroke={p.glassBorder} strokeWidth={0.6} opacity={0.5} />
        ))}
        {[5, R].map((gy) => (
          <g key={`h${gy}`}>
            <line x1={0} y1={sy(gy)} x2={W} y2={sy(gy)} stroke={p.glassBorder} strokeWidth={0.6} strokeDasharray="3 4" opacity={0.4} />
            <line x1={0} y1={sy(-gy)} x2={W} y2={sy(-gy)} stroke={p.glassBorder} strokeWidth={0.6} strokeDasharray="3 4" opacity={0.4} />
          </g>
        ))}
        <motion.line x1={0} y1={floorY} x2={W} y2={floorY} stroke={p.creamSoft} strokeWidth={1.8}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 0.7, ease: 'easeInOut' }} />

        {/* ── THE HALF-COURT LINE — this is what x = 0 means, so it is drawn and named ── */}
        <line x1={sx(0)} y1={0} x2={sx(0)} y2={H} stroke={p.gold} strokeWidth={1.6} opacity={0.75} strokeDasharray="5 4" />
        <text x={sx(0)} y={14} textAnchor="middle" fill={p.gold} fontSize={9} fontFamily="var(--font-numeric)" fontWeight={800} letterSpacing="0.08em">HALF-COURT</text>
        <text x={sx(0) - 6} y={floorY + 26} textAnchor="end" fill={p.mutedOnPaper} fontSize={8} fontFamily="var(--font-numeric)">your half</text>
        <text x={sx(0) + 6} y={floorY + 26} fill={p.mutedOnPaper} fontSize={8} fontFamily="var(--font-numeric)">far half</text>

        {/* every-metre ticks so a touch-down can actually be READ off the floor */}
        {Array.from({ length: 2 * R + 1 }, (_, i) => i - R).map((n) => (
          <line key={`t${n}`} x1={sx(n)} y1={floorY - (n % 2 === 0 ? 5 : 3)} x2={sx(n)} y2={floorY} stroke={p.creamSoft} strokeWidth={0.9} opacity={n % 2 === 0 ? 0.75 : 0.4} />
        ))}
        {[-8, -6, -4, -2, 2, 4, 6, 8].map((n) => (
          <text key={`xl${n}`} x={sx(n)} y={floorY + 15} textAnchor="middle" fill={p.mutedOnPaper} fontSize={9} fontFamily="var(--font-numeric)">{minus(n)}</text>
        ))}

        {/* the shot's own curve */}
        <motion.path d={graphD} fill="none" stroke={graphCol} strokeWidth={acting ? 1.6 : 2.6} strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: acting ? 0.42 : 0.95 }} transition={{ duration: reduce ? 0 : 0.9, ease: 'easeInOut' }} />

        {/* ── the basket: a FIXED landmark in the far half, not the answer ── */}
        <g opacity={0.95}>
          <line x1={sx(HOOP_X) + 14} y1={floorY} x2={sx(HOOP_X) + 14} y2={sy(7)} stroke="#3b2b52" strokeWidth={3} />
          <rect x={sx(HOOP_X) + 2} y={sy(8.4)} width={13} height={16} rx={2} fill="none" stroke={p.creamSoft} strokeOpacity={0.5} strokeWidth={1.4} />
          <line x1={sx(HOOP_X) - 9} y1={sy(7)} x2={sx(HOOP_X) + 8} y2={sy(7)} stroke="#ff5a3c" strokeWidth={2.6} />
          {[-7, -3, 1, 5].map((dx, i) => (
            <line key={`net${i}`} x1={sx(HOOP_X) + dx} y1={sy(7)} x2={sx(HOOP_X) + dx * 0.55} y2={sy(7) + 12} stroke={p.cream} strokeOpacity={0.5} strokeWidth={0.9} />
          ))}
        </g>

        {/* ── shooter, standing at the near touch-down ── */}
        <g opacity={0.92}>
          <line x1={shX - 3} y1={floorY} x2={shX - 3} y2={floorY - 12} stroke="#2a1a3d" strokeWidth={3.4} strokeLinecap="round" />
          <line x1={shX + 3} y1={floorY} x2={shX + 3} y2={floorY - 12} stroke="#2a1a3d" strokeWidth={3.4} strokeLinecap="round" />
          <line x1={shX} y1={floorY - 11} x2={shX} y2={floorY - 26} stroke={p.coralDeep} strokeWidth={5} strokeLinecap="round" />
          <circle cx={shX} cy={floorY - 31} r={5} fill="#f0c9a0" stroke="#2a1a3d" strokeWidth={1} />
          {/* initial={false} — motion has no read-from value for the x2/y2 SVG
              attributes on mount and wrote `undefined` into them for a frame
              ("<line> attribute x2: Expected length"). Snap to the animate state. */}
          <motion.line x1={shX} y1={floorY - 22} x2={shX + 9} y2={released ? floorY - 34 : floorY - 20}
            stroke={p.coralDeep} strokeWidth={3.2} strokeLinecap="round" initial={false}
            animate={{ y2: released ? floorY - 34 : floorY - 20, x2: released ? shX + 11 : shX + 9 }} transition={reduce ? { duration: 0 } : spring} />
          <motion.line x1={shX} y1={floorY - 22} x2={shX - 9} y2={released ? floorY - 34 : floorY - 20}
            stroke={p.coralDeep} strokeWidth={3.2} strokeLinecap="round" initial={false}
            animate={{ y2: released ? floorY - 34 : floorY - 20, x2: released ? shX - 11 : shX - 9 }} transition={reduce ? { duration: 0 } : spring} />
        </g>

        {/* ── the acted-out shot flight (walkthrough only) ── */}
        {acting && (
          <>
            <line x1={sx(rL)} y1={floorY} x2={sx(rL)} y2={floorY - 8} stroke={p.creamSoft} strokeWidth={1.6} opacity={0.6} />
            <motion.path d={trailD} fill="none" stroke={p.gold} strokeWidth={2.4} strokeLinecap="round" strokeDasharray="1 6" opacity={0.85} />
            <motion.g initial={false} animate={{ opacity: showPeak ? 1 : 0, scale: showPeak ? 1 : 0.5 }} transition={reduce ? { duration: 0 } : spring} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
              <line x1={sx(vx)} y1={sy(vy)} x2={sx(vx)} y2={floorY} stroke={p.gold} strokeWidth={0.8} strokeDasharray="2 4" opacity={0.5} />
              <circle cx={sx(vx)} cy={sy(vy)} r={4.5} fill={p.gold} stroke={p.cream} strokeWidth={1.3} />
              <text x={sx(vx)} y={sy(vy) - 9} textAnchor="middle" fill={p.gold} fontSize={11} fontFamily="var(--font-numeric)" fontWeight={800}>peak</text>
            </motion.g>
            {released && (
              <motion.g style={{ x: ballCX, y: ballCY }}>
                <motion.g style={{ rotate: ballSpin, scaleX: squashX, scaleY: squashY, transformBox: 'fill-box', transformOrigin: 'center' }}>
                  <circle r={B} fill="url(#ts_ball)" stroke="#8f4712" strokeWidth={1} />
                  <path d={`M${-B},0 A ${B} ${B} 0 0 0 ${B},0`} fill="none" stroke="#7a3d0e" strokeWidth={1} opacity={0.8} />
                  <line x1={0} y1={-B} x2={0} y2={B} stroke="#7a3d0e" strokeWidth={1} opacity={0.8} />
                  <path d={`M${-B * 0.86},${-B * 0.5} Q 0 ${-B * 0.1} ${B * 0.86},${-B * 0.5}`} fill="none" stroke="#7a3d0e" strokeWidth={0.9} opacity={0.7} />
                </motion.g>
              </motion.g>
            )}
          </>
        )}

        {/* touch-down markers */}
        {hasRoots && [task.r1!, task.r2!].map((rx, i) => inBox(rx, 0) && (
          <motion.g key={`r${i}`} initial={false} animate={{ opacity: showRoots ? 1 : 0, scale: showRoots ? 1 : 0.5 }} transition={reduce ? { duration: 0 } : { ...spring, delay: showRoots ? i * 0.08 : 0 }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <circle cx={sx(rx)} cy={floorY} r={5.5} fill={done ? p.mint : p.coralDeep} stroke={p.cream} strokeWidth={1.5} />
            <text x={sx(rx)} y={floorY + 27} textAnchor="middle" fill={done ? p.mint : p.creamSoft} fontSize={13} fontFamily="var(--font-numeric)" fontWeight={700}>{minus(rx)}</text>
          </motion.g>
        ))}

        {/* vertex marker */}
        {hasVertex && inBox(task.h!, task.kk!) && (
          <motion.g initial={false} animate={{ opacity: showVertex && !acting ? 1 : 0, scale: showVertex ? 1 : 0.5 }} transition={reduce ? { duration: 0 } : spring} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <circle cx={sx(task.h!)} cy={sy(task.kk!)} r={6.5} fill={p.gold} stroke={p.cream} strokeWidth={1.5} />
            <text x={sx(task.h!) + 8} y={sy(task.kk!) - 8} fill={p.gold} fontSize={13} fontFamily="var(--font-numeric)" fontWeight={700}>({minus(task.h!)}, {minus(task.kk!)})</text>
          </motion.g>
        )}
      </svg>
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(10px, 1vw, 13px)', letterSpacing: '0.12em', textTransform: 'uppercase', color: p.mutedOnPaper }}>
        {acting
          ? (landed ? (done ? 'where it touches down ✓' : 'where it touches down') : rising ? 'rising to the peak' : 'the shot')
          : task.kind === 'vertex' ? 'read the peak' : 'read where it touches down'}
      </div>
    </div>
  )
}

// ── template renderers ──────────────────────────────────────────────────────
const rootsTemplate = (a: number, b: number) => `x = ${a > 0 ? `+${a}` : a}, ${b > 0 ? `+${b}` : b}`
const vertexTemplate = (a: number, b: number) => `(${a > 0 ? `+${a}` : a}, ${b > 0 ? `+${b}` : b})`

const CONFIG: GameConfig<V, Task> = {
  chapterId: 'quadraticsParabolas',
  title: 'THE SHOT',
  ticketLabel: 'shot chart',
  palette: P,
  motif: '🏀',
  makeTask,
  // PER-TASK gating: a question shows the pad only when its answer is ONE number.
  // The roots and the vertex are PAIRS, so they keep the builder; the L3 radical
  // form is an EXPRESSION, so it keeps its picker.
  answerPad: (t) => (t.pad ? numChoices(t.n ?? 0, t.pad) : []),
  initialValue: (t) =>
    t.kind === 'formula' ? { k: 'pick', id: '' }
      : t.kind === 'vertex' ? { k: 'vertex', a: 0, b: 0 }
        : { k: 'roots', a: 0, b: 0 },
  grade: (t, v) => {
    // AnswerPad hands back the tapped raw number, not a V.
    if (typeof (v as unknown) === 'number') return (v as unknown as number) === t.n
    if (t.kind === 'formula') return v.k === 'pick' && v.id === t.answerId
    if (t.kind === 'vertex') return v.k === 'vertex' && v.a === t.h && v.b === t.kk
    // roots — order-independent
    return v.k === 'roots' && ((v.a === t.r1 && v.b === t.r2) || (v.a === t.r2 && v.b === t.r1))
  },
  // Every task here sets showEquals:false (the badge already contains an "="), so the
  // board never prints this string — it is ONLY what Milo SAYS on a wrong answer.
  // Written for the ear: the pad marks its own correct choice and the picker lights
  // its own option, so the eye is already served.
  revealText: (t) =>
    t.pad ? spoken(t.n ?? 0)
      // stored as pa=−1, pb=−b, pc=−c, so −b is pb and the discriminant is pb² + 4·pc
      : t.kind === 'formula' ? `${spoken(t.pb)}, plus or minus the square root of ${t.pb * t.pb + 4 * t.pc}, all over 2`
        : t.kind === 'vertex' ? `the peak at ${spoken(t.h ?? 0)}, ${spoken(t.kk ?? 0)}`
          : `x equals ${spoken(t.r1 ?? 0)}, and x equals ${spoken(t.r2 ?? 0)}`,
  glide: (t, _from, setValue, later) => later(() => {
    // A padded question has no instrument to glide — the pad itself stays on screen
    // and marks the right choice, so there is never a blank stage.
    if (t.pad) return
    if (t.kind === 'formula') setValue({ k: 'pick', id: t.answerId ?? '' })
    else if (t.kind === 'vertex') setValue({ k: 'vertex', a: t.h ?? 0, b: t.kk ?? 0 })
    else setValue({ k: 'roots', a: t.r1 ?? 0, b: t.r2 ?? 0 })
  }, 320),
  Instrument: ({ task, value, setValue, disabled, reveal, palette, onCommit }) => {
    if (task.kind === 'formula') {
      const id = value.k === 'pick' ? value.id : ''
      return <SpecPicker P={palette} choices={task.choices ?? []} value={id} setValue={(x) => setValue({ k: 'pick', id: x })}
        correct={task.answerId} disabled={disabled} reveal={reveal} onCommit={(x) => onCommit({ k: 'pick', id: x })}
        commitLabel="CALL THE SHOT ✓" prompt="Where does it touch down?" />
    }
    // The L1 questions ask the child to READ the court, so the court is rendered
    // above the builder. Without it the instruction names a picture that is not there.
    // gk-scene-cap: on a short frame the court is capped so the builder's ▲▼ and
    // commit button keep a finger-sized share of the scaled column (see GameShell).
    const arc = task.showArc
      ? <div className="gk-scene-cap" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <ArcScene palette={palette} task={task} value={value} ended={!!reveal} />
        </div>
      : null
    if (task.kind === 'vertex') {
      const a = value.k === 'vertex' ? value.a : 0, b = value.k === 'vertex' ? value.b : 0
      return (
        <>
          {arc}
          <PartsBuilder P={palette} value={{ a, b }} setValue={(pr) => setValue({ k: 'vertex', a: pr.a, b: pr.b })} min={-12} max={12}
            template={vertexTemplate} labels={['x of peak', 'height of peak']}
            disabled={disabled} reveal={reveal} onCommit={(pr) => onCommit({ k: 'vertex', a: pr.a, b: pr.b })} commitLabel="MARK THE PEAK ✓" />
        </>
      )
    }
    const a = value.k === 'roots' ? value.a : 0, b = value.k === 'roots' ? value.b : 0
    return (
      <>
        {arc}
        <PartsBuilder P={palette} value={{ a, b }} setValue={(pr) => setValue({ k: 'roots', a: pr.a, b: pr.b })} min={-12} max={12}
          template={rootsTemplate} labels={['touches down at', 'and at']}
          disabled={disabled} reveal={reveal} onCommit={(pr) => onCommit({ k: 'roots', a: pr.a, b: pr.b })} commitLabel="TAKE THE SHOT ✓" />
      </>
    )
  },
  TutorialScene: ({ palette, task, value, ended }) => (
    <ArcScene palette={palette} task={task} value={value} walk ended={ended} />
  ),
  start: {
    blurb: <><strong>Every shot traces a parabola.</strong> Zero is the <strong>half-court line</strong>: the ball can leave the floor on your side and come down on the far side. Where it <strong>touches down</strong> are the roots; the <strong>top of the arc</strong> is the vertex.</>,
    ticket: { title: 'The shot', badge: 'y = −x² + 6x − 5', tone: 'a' },
    startLabel: 'Step to the line →',
  },
  overview: {
    say: "Here is the plan. A basketball shot flies in a downward curve called a parabola. The two spots where it touches the floor are the roots, and the top of the arc is the vertex. Zero on the floor is the half-court line, so a touch-down can sit on either side of it. We can read them straight off the court, or solve the quadratic to find them. Let us do two together, nice and slow.",
    problem: <>Where does the shot <strong>y = −x² + 6x − 5</strong> touch down?</>,
    points: [
      <>Zero is <strong>half-court</strong> — your half is negative, the far half positive.</>,
      <>It <strong>touches down</strong> where the arc meets the floor (y = 0).</>,
      <>A minus out front <strong>flips the arc</strong> but never moves a touch-down.</>,
      <>The <strong>peak</strong> sits halfway between the two touch-downs.</>,
    ],
  },
  // Two examples: READ the arc, then SOLVE by factoring. Between them they work
  // both graded builder gestures, which is why there is no guided round.
  tutorial: [
    { task: DEMO_READ, initial: { k: 'roots', a: 0, b: 0 }, hand: 'tap', steps: DEMO_READ_STEPS },
    { task: DEMO_SOLVE, initial: { k: 'roots', a: 0, b: 0 }, hand: 'tap', steps: DEMO_SOLVE_STEPS },
  ],
  sig: (t) => `${t.kind}|${t.badge}`,
}

export default function TheShot(props: { childName: string; onFinish: (c: number, w: number, mastered?: boolean) => void; onExit: () => void }) {
  return <Game config={CONFIG} {...props} />
}
