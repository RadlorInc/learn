/**
 * Grade 8 · Module 2 — Linear relationships, slope and systems. Practice ladders, easiest style first
 * (see ../adaptive.ts and the reference ladders in ./g5m1.ts and ./g7m1.ts). Negative numbers are written with "−".
 * A slope that is not whole is a reduced fraction; a whole slope is a number — never both in one level.
 * Nothing asks the child to type an equation: answers are one number, a fraction, or a pick (as in the lessons).
 */
import type { Picture, Problem } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

type Line = NonNullable<Extract<Picture, { kind: 'coord' }>['lines']>[number]
type Pt = { x: number; y: number; label?: string }

const NAMES = ['Kai', 'Rosa', 'Eli', 'Nina', 'Leo', 'Ava', 'Sam', 'Maya']
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
/** A signed number as the child reads it: −3. */
const sn = (n: number) => fmt(n).replace('-', '−')
/** A number to subtract: (−3) in brackets when negative. */
const par = (n: number) => (n < 0 ? `(${sn(n)})` : sn(n))
const sub = (a: number, b: number) => `${sn(a)} − ${par(b)}`
/** n/d reduced, sign on top. */
const red = (n: number, d: number): [number, number] => { const g = gcd(Math.abs(n), Math.abs(d)) * (d < 0 ? -1 : 1); return [n / g, d / g] }
/** n/d written: "−3/4", or "3" when whole. */
const ft = (n: number, d: number) => { const [a, b] = red(n, d); return b === 1 ? sn(a) : `${sn(a)}/${b}` }
/** The x part: x, −x, 3x, (1/2)x, −(3/2)x. */
const xT = (n: number, d = 1) => {
  const [a, b] = red(n, d)
  if (b === 1) return a === 1 ? 'x' : a === -1 ? '−x' : `${sn(a)}x`
  return a < 0 ? `−(${-a}/${b})x` : `(${a}/${b})x`
}
const plus = (b: number) => (b === 0 ? '' : b > 0 ? ` + ${fmt(b)}` : ` − ${fmt(-b)}`)
const ex = (a: number, b: number) => `${xT(a)}${plus(b)}`
const lineEq = (m: number, b: number, d = 1) => `y = ${xT(m, d)}${plus(b)}`
const pt = (x: number, y: number) => `(${sn(x)}, ${sn(y)})`
const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const bal = (left: string, right: string): Picture => ({ kind: 'balance', left, right })
const P = (x: number, y: number): Pt => ({ x, y, label: pt(x, y) })
const plane = (max: number, points: Pt[] = [], lines: Line[] = [], min = 0): Picture => ({ kind: 'coord', min, max, points, lines })
const dash = (a: [number, number], b: [number, number], label: string, tone?: 2): Line => ({ a, b, dashed: true, label, ...(tone ? { tone } : {}) })
const pts = (x1: string, y1: string, x2: string, y2: string): Picture =>
  ({ kind: 'table', head: ['', 'Point 1', 'Point 2'], rows: [['x', x1, x2], ['y', y1, y2]], rowHead: true })
const choose = (r: Rng, right: string, wrong: string[]) => { const choices = shuffle(r, [right, ...wrong]); return { choices, correct: choices.indexOf(right) } }
/** A line y = mx + b drawn across a grid from lo to hi, anchored on two grid points inside it; null if it barely shows. */
const gridLine = (m: number, b: number, lo: number, hi: number, tone?: 2): Line | null => {
  const xs: number[] = []
  for (let x = lo; x <= hi; x++) { const y = m * x + b; if (y >= lo && y <= hi) xs.push(x) }
  if (xs.length < 3) return null
  const [x1, x2] = [xs[0], xs[xs.length - 1]]
  return { a: [x1, m * x1 + b], b: [x2, m * x2 + b], extend: true, ...(tone ? { tone } : {}) }
}

// ── The reveal guard (the same reading the gate does) ──────────────────────────────────────────────────────
function labelsOf(pic: unknown): string[] {
  const texts: string[] = []
  const walk = (v: unknown) => {
    if (typeof v === 'string') texts.push(v)
    else if (Array.isArray(v)) { if (v.length && v.every(x => typeof x === 'string')) texts.push(v.join('')); v.forEach(walk) }
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  walk(pic)
  return texts
}
function choiceShown(pic: unknown, choice: string): boolean {
  const single: string[] = []
  const walk = (v: unknown) => {
    if (typeof v === 'string') single.push(v)
    else if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  walk(pic)
  const esc = choice.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const word = new RegExp(`(^|[^\\p{L}\\p{N}])${esc}($|[^\\p{L}\\p{N}])`, 'u')
  return single.some(t => word.test(t)) || labelsOf(pic).includes(choice)
}
const shownNums = (pic: unknown) => new Set(labelsOf(pic).flatMap(t => t.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map(t => t.replace(/,/g, '')))

/** A level whose numbers are re-picked when a build gives up (null), repeats a choice, or shows the answer. */
const lv = (style: string, build: (r: Rng) => Problem | null): Level => ({
  style, make: r => {
    for (let i = 0; i < 2000; i++) {
      const p = build(r)
      if (!p) continue
      const a = p.answer
      if (typeof a === 'number' && Math.abs(a) >= 10 && shownNums(p.picture).has(String(Math.abs(a)))) continue
      if (a && typeof a === 'object' && 'choices' in a && (new Set(a.choices).size !== a.choices.length || choiceShown(p.picture, a.choices[a.correct]))) continue
      return p
    }
    throw new Error(`${style}: no numbers found`)
  },
})

// ── t1 · Slope: rise over run ──────────────────────────────────────────────────────────────────────────────
const T1: Level[] = [
  lv('grid with the stair drawn: rise ÷ run is whole', r => {
    const run = int(r, 1, 3), k = int(r, 1, Math.floor(9 / run)), rise = run * k
    const x1 = int(r, 0, 10 - run), y1 = int(r, 0, 10 - rise), x2 = x1 + run, y2 = y1 + rise
    return { text: 'The dashed lines show the run and the rise between the two points. What is rise ÷ run?',
      picture: plane(10, [P(x1, y1), P(x2, y2)], [{ a: [x1, y1], b: [x2, y2], extend: true }, dash([x1, y1], [x2, y1], `run ${run}`), dash([x2, y1], [x2, y2], `rise ${rise}`, 2)]),
      answer: k,
      steps: [`The run is ${run} across and the rise is ${rise} up.`, `Rise ÷ run = ${rise} ÷ ${run} = ${k}.`] }
  }),
  lv('two labelled points, count it yourself: a fraction', r => {
    const run = int(r, 2, 6), rise = int(r, 1, 9)
    if (rise % run === 0) return null
    const x1 = int(r, 0, 10 - run), y1 = int(r, 0, 10 - rise), x2 = x1 + run, y2 = y1 + rise
    return { text: 'The line goes through the two points. How steep is it? Type rise ÷ run as a fraction.',
      picture: plane(10, [P(x1, y1), P(x2, y2)], [{ a: [x1, y1], b: [x2, y2], extend: true }]),
      answer: { frac: red(rise, run) },
      steps: [`Go across from ${pt(x1, y1)} to straight under ${pt(x2, y2)}: ${x2} − ${x1} = ${run}. That is the run.`,
        `Go up to ${pt(x2, y2)}: ${y2} − ${y1} = ${rise}. That is the rise.`, `Rise ÷ run = ${rise} ÷ ${run} = ${ft(rise, run)}.`] }
  }),
  lv('spot the mistake: rise and run turned upside down', r => {
    const run = int(r, 1, 6), rise = int(r, 1, 9)
    if (rise === run) return null
    const x1 = int(r, 0, 10 - run), y1 = int(r, 0, 10 - rise), x2 = x1 + run, y2 = y1 + rise
    const name = pick(r, NAMES), right0 = ft(rise, run), flipped = ft(run, rise), said = r() < 0.5 ? right0 : flipped
    const alt = ft(rise + run, run)
    if (alt === right0 || alt === flipped) return null
    const A = `Yes, it is ${said}`, B = `No, it is ${said === right0 ? flipped : right0}`, C = `No, it is ${alt}`
    const right = said === right0 ? A : B
    return { text: `${name} says this line is ${said} steep. Is ${name} right?`,
      picture: plane(10, [P(x1, y1), P(x2, y2)], [{ a: [x1, y1], b: [x2, y2], extend: true }]),
      answer: choose(r, right, [A, B, C].filter(c => c !== right)),
      steps: [`The run is ${run} across and the rise is ${rise} up.`, `The rise goes on top: ${rise} ÷ ${run} = ${right0}.`, `So the answer is: ${right}.`] }
  }),
  lv('work backwards: the missing y for a given slope', r => {
    const [a, b] = pick(r, [[1, 1], [2, 1], [3, 1], [1, 2], [3, 2], [2, 3], [1, 3], [4, 3], [3, 4]] as const)
    const s = int(r, 1, 2), run = b * s, rise = a * s
    if (run > 8 || rise > 9) return null
    const x1 = int(r, 0, 10 - run), y1 = int(r, 0, 10 - rise), x2 = x1 + run, y2 = y1 + rise
    return { text: `A line has a slope of ${ft(a, b)}. It goes through ${pt(x1, y1)} and (${x2}, ?). What is the missing y?`,
      picture: plane(10, [P(x1, y1)], [dash([x1, y1], [x2, y1], `run ${run}`)]),
      answer: y2,
      steps: [`The run is ${x2} − ${x1} = ${run}.`, `Rise ÷ run must be ${ft(a, b)}, so the rise is ${rise}: ${rise} ÷ ${run} = ${ft(a, b)}.`, `The missing y is ${y1} + ${rise} = ${y2}.`] }
  }),
  lv('real world: which ramp is steeper', r => {
    const SL = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [1, 10], [3, 10]] as const
    const ramp = (n: number, d: number) => { const run = d * (d === 10 ? int(r, 1, 2) : int(r, 1, 4)); return { run, rise: (n * run) / d, s: n / d } }
    const [na, da] = pick(r, SL)
    const A = ramp(na, da)
    const same = r() < 0.25
    const [nb, db] = same ? [na, da] : pick(r, SL)
    const B = ramp(nb, db)
    if (same ? A.run === B.run : A.s === B.s) return null
    const right = A.s > B.s ? 'Ramp A is steeper' : A.s < B.s ? 'Ramp B is steeper' : 'They are just as steep'
    return { text: 'Two skate ramps are built with the rise and run in the table. Which ramp is steeper?',
      picture: { kind: 'table', head: ['', 'Rise (ft)', 'Run (ft)'], rows: [['Ramp A', fmt(A.rise), fmt(A.run)], ['Ramp B', fmt(B.rise), fmt(B.run)]], rowHead: true },
      answer: choose(r, right, ['Ramp A is steeper', 'Ramp B is steeper', 'They are just as steep'].filter(c => c !== right)),
      steps: [`Ramp A: rise ÷ run = ${fmt(A.rise)} ÷ ${fmt(A.run)} = ${fmt(A.s)}.`, `Ramp B: rise ÷ run = ${fmt(B.rise)} ÷ ${fmt(B.run)} = ${fmt(B.s)}.`, `So the answer is: ${right}.`] }
  }),
]

// ── t2 · Slope from two points ─────────────────────────────────────────────────────────────────────────────
const T2: Level[] = [
  lv('table of two points: a whole slope, up or down', r => {
    const m = pick(r, [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]), x1 = int(r, 0, 6), x2 = x1 + int(r, 1, 4), y1 = int(r, -5, 15), y2 = y1 + m * (x2 - x1)
    return { text: 'A line goes through these two points. What is its slope?', picture: pts(sn(x1), sn(y1), sn(x2), sn(y2)), answer: m,
      steps: [`Subtract the y-values: ${sub(y2, y1)} = ${sn(y2 - y1)}.`, `Subtract the x-values in the same order: ${sub(x2, x1)} = ${x2 - x1}.`, `Divide: ${sn(y2 - y1)} ÷ ${x2 - x1} = ${sn(m)}. The slope is ${sn(m)}.`] }
  }),
  lv('two points in words, negatives: a fraction', r => {
    const x1 = int(r, -6, 6), x2 = int(r, -6, 8), y1 = int(r, -6, 8), y2 = int(r, -6, 8)
    const dx = x2 - x1, dy = y2 - y1
    if (!dx || !dy || dy % dx === 0) return null
    return { text: `A line goes through ${pt(x1, y1)} and ${pt(x2, y2)}. What is its slope? Type it as a fraction.`,
      picture: eq('(y₂ − y₁) ÷ (x₂ − x₁)'), answer: { frac: red(dy, dx) },
      steps: [`Subtract the y-values: ${sub(y2, y1)} = ${sn(dy)}.`, `Subtract the x-values in the same order: ${sub(x2, x1)} = ${sn(dx)}.`, `Divide: ${sn(dy)} ÷ ${sn(dx)} = ${ft(dy, dx)}.`] }
  }),
  lv('spot the mistake: the order flipped halfway', r => {
    const x1 = int(r, -3, 6), x2 = int(r, -3, 8), y1 = int(r, -5, 12), y2 = int(r, -5, 12)
    const dx = x2 - x1, dy = y2 - y1
    if (!dx || !dy || Math.abs(dx) === Math.abs(dy)) return null
    const name = pick(r, NAMES), T = ft(dy, dx), good = r() < 0.5, said = good ? T : ft(-dy, dx)
    const work = `(${sub(y2, y1)}) ÷ (${good ? sub(x2, x1) : sub(x1, x2)})`
    const A = `Yes, the slope is ${said}`, B = `No, the slope is ${good ? ft(-dy, dx) : T}`, C = `No, the slope is ${ft(dx, dy)}`
    const right = good ? A : B
    return { text: `${name} finds the slope of the line through ${pt(x1, y1)} and ${pt(x2, y2)} like this, and gets ${said}. Is ${name} right?`,
      picture: eq(work), answer: choose(r, right, [A, B, C].filter(c => c !== right)),
      steps: [`Point 2 comes first on the top AND on the bottom: (${sub(y2, y1)}) ÷ (${sub(x2, x1)}).`, `That is ${sn(dy)} ÷ ${sn(dx)} = ${T}.`, `So the answer is: ${right}.`] }
  }),
  lv('work backwards: the missing coordinate for a given slope', r => {
    const m = pick(r, [-4, -3, -2, -1, 1, 2, 3, 4]), x1 = int(r, -4, 5), dx = int(r, 1, 4), x2 = x1 + dx, y1 = int(r, -6, 10), y2 = y1 + m * dx
    if (r() < 0.6) return { text: `This line has a slope of ${sn(m)}. What number goes where the ? is?`, picture: pts(sn(x1), sn(y1), sn(x2), '?'), answer: y2,
      steps: [`The run is ${sub(x2, x1)} = ${dx}.`, `Rise ÷ run is ${sn(m)}, so the rise is ${sn(m)} × ${dx} = ${sn(m * dx)}.`, `The missing y is ${sn(y1)} + ${par(m * dx)} = ${sn(y2)}.`] }
    return { text: `This line has a slope of ${sn(m)}. What number goes where the ? is?`, picture: pts(sn(x1), sn(y1), '?', sn(y2)), answer: x2,
      steps: [`The rise is ${sub(y2, y1)} = ${sn(m * dx)}.`, `Rise ÷ run is ${sn(m)}, so the run is ${sn(m * dx)} ÷ ${par(m)} = ${dx}.`, `The missing x is ${sn(x1)} + ${dx} = ${sn(x2)}.`] }
  }),
  lv('real world: a rate of change from two readings', r => {
    const C = pick(r, [
      { intro: 'A hot-air balloon rises at a steady rate.', xh: 'Minutes', yh: 'Feet up', xs: 'minutes', ys: 'heights', what: 'height, in feet,', unit: 'minute', rate: pick(r, [25, 50, 75, 100, 150]), start: 50 * int(r, 2, 12) },
      { intro: 'A tank drains at a steady rate.', xh: 'Minutes', yh: 'Gallons', xs: 'minutes', ys: 'gallons', what: 'water, in gallons,', unit: 'minute', rate: -5 * int(r, 1, 6), start: 10 * int(r, 20, 50) },
      { intro: 'A phone battery runs down at a steady rate.', xh: 'Hours', yh: 'Battery (%)', xs: 'hours', ys: 'battery readings', what: 'battery, in percent,', unit: 'hour', rate: -int(r, 4, 12), start: int(r, 80, 100) },
      { intro: 'Jo saves money at a steady rate.', xh: 'Weeks', yh: 'Savings ($)', xs: 'weeks', ys: 'savings', what: 'savings, in dollars,', unit: 'week', rate: 5 * int(r, 1, 5), start: 5 * int(r, 4, 30) },
    ])
    const t1 = int(r, 1, 4), dt = int(r, 2, 5), t2 = t1 + dt, v1 = C.start + C.rate * t1, v2 = C.start + C.rate * t2
    if (v2 < 0) return null
    return { text: `${C.intro} The table shows two readings. How much does the ${C.what} change each ${C.unit}? Type a negative number if it goes down.`,
      picture: { kind: 'table', head: ['', 'Point 1', 'Point 2'], rows: [[C.xh, fmt(t1), fmt(t2)], [C.yh, fmt(v1), fmt(v2)]], rowHead: true },
      answer: C.rate,
      steps: [`Subtract the ${C.ys}: ${sub(v2, v1)} = ${sn(v2 - v1)}.`, `Subtract the ${C.xs} in the same order: ${t2} − ${t1} = ${dt}.`, `Divide: ${sn(v2 - v1)} ÷ ${dt} = ${sn(C.rate)} each ${C.unit}.`] }
  }),
]

// ── t3 · y = mx + b ────────────────────────────────────────────────────────────────────────────────────────
const T3: Level[] = [
  lv('read m or b from the equation', r => {
    const m = pick(r, [-9, -7, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 8, 9]), b = pick(r, [-9, -6, -4, -3, -2, -1, 1, 2, 3, 5, 7, 8, 9])
    if (m === b) return null
    const E = lineEq(m, b)
    if (r() < 0.5) return { text: `A line has the equation ${E}. What is its slope?`, picture: eq(E), answer: m,
      steps: [`The slope is the number in front of x.${Math.abs(m) === 1 ? ` An x on its own means ${m === 1 ? '1x' : '−1x'}.` : ''}`, `The plain number ${sn(b)} is where the line crosses, so it is not the slope. The slope is ${sn(m)}.`] }
    return { text: `A line has the equation ${E}. Where does it cross the y-axis? Give the y-value.`, picture: eq(E), answer: b,
      steps: ['On the y-axis x is 0, so the x part becomes 0.', `Only the plain number is left, so the line crosses at y = ${sn(b)}.`] }
  }),
  lv('graph through (0, b): find m', r => {
    const b = int(r, 1, 9), m = pick(r, [-3, -2, -1, 1, 2, 3]), x2 = int(r, 1, 4), y2 = b + m * x2
    if (y2 < 0 || y2 > 10) return null
    return { text: `This line crosses the y-axis at (0, ${b}). Its equation is y = mx + ${b}. What is m?`,
      picture: plane(10, [P(0, b), P(x2, y2)], [{ a: [0, b], b: [x2, y2], extend: true }]), answer: m,
      steps: [`From (0, ${b}) to ${pt(x2, y2)}: the rise is ${sub(y2, b)} = ${sn(y2 - b)} and the run is ${x2} − 0 = ${x2}.`, `The slope is ${sn(y2 - b)} ÷ ${x2}, so m is ${sn(m)}.`] }
  }),
  lv('pick the equation that matches the graph', r => {
    const b = int(r, 1, 9), m = pick(r, [-3, -2, -1, 1, 2, 3]), x2 = int(r, 1, 4), y2 = b + m * x2
    if (y2 < 0 || y2 > 10 || b === m) return null
    const right = lineEq(m, b)
    return { text: 'Which equation matches this line?',
      picture: plane(10, [P(0, b), P(x2, y2)], [{ a: [0, b], b: [x2, y2], extend: true }]),
      answer: choose(r, right, [lineEq(b, m), lineEq(-m, b), lineEq(m, y2)]),
      steps: [`It crosses the y-axis at (0, ${b}), so b is ${b}.`, `From (0, ${b}) to ${pt(x2, y2)}: ${sn(y2 - b)} ÷ ${x2} = ${sn(m)}, so the slope is ${sn(m)}.`, `So it is ${right}.`] }
  }),
  lv('spot the mistake: slope and crossing swapped', r => {
    const m = pick(r, [-8, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7]), b = pick(r, [-9, -7, -5, -3, -2, -1, 1, 2, 4, 6, 8, 9])
    if (m === b) return null
    const E = lineEq(m, b), name = pick(r, NAMES), good = r() < 0.5
    const [sm, sb] = good ? [m, b] : [b, m]
    const A = `Yes: the slope is ${sn(sm)} and it crosses at ${sn(sb)}`, B = `No: the slope is ${sn(good ? b : m)} and it crosses at ${sn(good ? m : b)}`, C = `No: the slope is ${sn(m)} and it crosses at ${sn(-b)}`
    const right = good ? A : B
    return { text: `${name} says the line ${E} has a slope of ${sn(sm)} and crosses the y-axis at ${sn(sb)}. Is ${name} right?`,
      picture: eq(E), answer: choose(r, right, [A, B, C].filter(c => c !== right)),
      steps: [`The slope is the number in front of x: ${sn(m)}.`, `The plain number is where it crosses the y-axis: ${sn(b)}.`, `So the answer is: ${right}.`] }
  }),
  lv('real world: pick the equation from a fee and a rate', r => {
    const [story, start, each, unit] = pick(r, [
      ['A gym charges a sign-up fee of $F plus $R each month.', 'Sign-up fee', 'Each month', 'month'],
      ['A taxi charges $F to get in plus $R for each mile.', 'To get in', 'Each mile', 'mile'],
      ['A plumber charges $F to come out plus $R for each hour.', 'To come out', 'Each hour', 'hour'],
      ['A bike rental costs $F for the helmet plus $R for each hour.', 'Helmet', 'Each hour', 'hour'],
    ] as const)
    const f = int(r, 3, 40), k = int(r, 2, 15)
    if (f === k) return null
    const right = `y = ${k}x + ${f}`
    return { text: `${story.replace('$F', `$${f}`).replace('$R', `$${k}`)} Let x be the number of ${unit}s and y the cost in dollars. Which equation gives the cost?`,
      picture: { kind: 'table', head: ['', 'Dollars'], rows: [[start, fmt(f)], [each, fmt(k)]], rowHead: true },
      answer: choose(r, right, [`y = ${f}x + ${k}`, `y = ${k + f}x`, `y = ${k}x − ${f}`]),
      steps: [`The $${f} is paid once, even when x = 0, so it is b.`, `The $${k} is added for each ${unit}, so it is the slope m.`, `So the equation is ${right}.`] }
  }),
]

// ── t4 · Graph a line from its equation ────────────────────────────────────────────────────────────────────
const T4: Level[] = [
  lv('start at b and step by the slope on the grid', r => {
    const d = pick(r, [1, 1, 2, 3]), a = int(r, 1, 3), b = int(r, 0, 4), n = int(r, 2, 3)
    if (gcd(a, d) !== 1 || d * n > 10 || b + a * n > 10) return null
    const land = Array.from({ length: n }, (_, i) => pt(d * (i + 1), b + a * (i + 1)))
    return { text: `You graph ${lineEq(a, b, d)}. You start at (0, ${b}) and step ${d} across and ${a} up, ${n} times. What is the y of the dot you land on?`,
      picture: plane(10, [P(0, b)]), answer: b + a * n,
      steps: [`Start at (0, ${b}). Each step adds ${a} to y.`, `The steps land on ${land.join(', then ')}.`, `So the dot is at y = ${b + a * n}.`] }
  }),
  lv('put x in: find y', r => {
    const m = pick(r, [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]), b = int(r, -9, 9), x = pick(r, [-4, -3, -2, -1, 1, 2, 3, 4, 5, 6]), y = m * x + b
    const E = lineEq(m, b)
    return { text: `What is y on the line ${E} when x = ${sn(x)}?`, picture: eq(E), answer: y,
      steps: [`Put ${sn(x)} in for x: y = ${sn(m)} × ${par(x)}${plus(b)}.`, `${sn(m)} × ${par(x)} = ${sn(m * x)}${b ? `, then ${b > 0 ? 'add' : 'take away'} ${Math.abs(b)}` : ''}.`, `So y = ${sn(y)}.`] }
  }),
  lv('pick the point that is on the line', r => {
    const d = pick(r, [1, 1, 2]), a = d === 1 ? pick(r, [-3, -2, -1, 1, 2, 3]) : pick(r, [-3, -1, 1, 3])
    const x = d === 1 ? int(r, 1, 6) : pick(r, [2, 4, 6]), b = int(r, -5, 8), y = (a * x) / d + b
    const E = lineEq(a, b, d), on = (px: number, py: number) => py * d === a * px + b * d
    const right = pt(x, y)
    const wrong = [pt(x, y + pick(r, [-2, -1, 1, 2])), pt(x + 1, y), x !== y && !on(y, x) ? pt(y, x) : pt(x + 2, y)]
    if (new Set([right, ...wrong]).size !== 4) return null
    const mt = d === 1 ? sn(a) : `(${sn(a)}/${d})`
    return { text: `Which point is on the line ${E}?`, picture: eq(E), answer: choose(r, right, wrong),
      steps: [`Put in x = ${x}: y = ${mt} × ${x}${plus(b)} = ${sn(y)}.`, 'That is the only point whose y matches. The other points do not make the equation true.', `So ${right} is on the line.`] }
  }),
  lv('spot the mistake: the first dot put at the slope', r => {
    const m = int(r, 1, 5), b = int(r, 0, 9)
    if (m === b) return null
    const E = lineEq(m, b), name = pick(r, NAMES), said = r() < 0.5 ? b : m
    const A = `Yes, the first dot goes at (0, ${said})`, B = `No, it goes at (0, ${said === b ? m : b})`, C = `No, it goes at (0, ${b + m + 1})`
    const right = said === b ? A : B
    return { text: `${name} starts to graph ${E}. ${name}'s first dot is at (0, ${said}). Is that right?`,
      picture: plane(10, [P(0, said)]), answer: choose(r, right, [A, B, C].filter(c => c !== right)),
      steps: ['The first dot goes at b, the plain number, on the y-axis.', `In ${E}, b is ${b}, so the first dot is (0, ${b}).`, `So the answer is: ${right}.`] }
  }),
  lv('real world: write y = mx + b from a story, then find y', r => {
    const C = pick(r, [
      { s: 'A plant is S cm tall and grows G cm each week.', q: 'How many cm tall is it after T weeks?', start: `S cm`, each: 'Each week', u: 'cm', start0: int(r, 2, 12), g: int(r, 1, 4), t: int(r, 2, 8), say: 'The plant is' },
      { s: 'A candle is S inches tall and burns down G inches each hour.', q: 'How many inches tall is it after T hours?', start: `S in`, each: 'Each hour', u: 'in', start0: int(r, 10, 24), g: -int(r, 1, 3), t: int(r, 2, 6), say: 'The candle is' },
      { s: 'A pool has S gallons in it. A hose adds G gallons each minute.', q: 'How many gallons are in the pool after T minutes?', start: `S gal`, each: 'Each minute', u: 'gal', start0: 5 * int(r, 4, 12), g: int(r, 5, 15), t: int(r, 2, 9), say: 'The pool has' },
      { s: 'A phone battery is at S percent and drops G percent each hour.', q: 'What percent is it at after T hours?', start: `S %`, each: 'Each hour', u: '%', start0: int(r, 70, 100), g: -int(r, 5, 12), t: int(r, 2, 5), say: 'The battery is at' },
    ])
    const { start0: s, g, t } = C, y = g * t + s
    if (y <= 0) return null
    const fill = (x: string) => x.replace('S', String(s)).replace('G', String(Math.abs(g))).replace('T', String(t)).replace(/\b1 inches/, '1 inch')
    return { text: `${fill(C.s)} ${fill(C.q)}`,
      picture: { kind: 'table', head: ['', ''], rows: [['At the start', fill(C.start)], [C.each, `${g > 0 ? '+' : '−'}${Math.abs(g)} ${C.u}`]], rowHead: true },
      answer: y,
      steps: [`The start is b = ${s} and the change each time is m = ${sn(g)}, so ${lineEq(g, s)}.`, `Put ${t} in for x: y = ${sn(g)} × ${t} + ${s} = ${y}.`, `So ${C.say} ${y} ${C.u === '%' ? 'percent' : C.u === 'in' ? 'inches' : C.u === 'gal' ? 'gallons' : 'cm'}.`] }
  }),
]

// ── t5 · Variables on both sides ───────────────────────────────────────────────────────────────────────────
/** A·x + P on the "big" side, C·x + Q on the other, with Q chosen so x is the answer. */
const both = (r: Rng, xLo: number, xHi: number, pLo: number, pHi: number) => {
  const C = int(r, 1, 6), A = C + int(r, 1, 4), x = int(r, xLo, xHi), P = int(r, pLo, pHi)
  return { A, C, x, P, Q: (A - C) * x + P }
}
const T5: Level[] = [
  lv('balance: take the smaller x part off, then solve', r => {
    const { A, C, x, P, Q } = both(r, 1, 9, 1, 15)
    if (Q > 60) return null
    const bigLeft = r() < 0.5, D = A - C
    const L = bigLeft ? ex(A, P) : ex(C, Q), R = bigLeft ? ex(C, Q) : ex(A, P)
    const after = bigLeft ? `${ex(D, P)} = ${Q}` : `${Q} = ${ex(D, P)}`, left = bigLeft ? `${xT(D)} = ${Q - P}` : `${Q - P} = ${xT(D)}`
    return { text: `Solve ${L} = ${R}. What is x?`, picture: bal(L, R), answer: x,
      steps: [`The smaller x part is ${xT(C)}. Take it off both sides: ${after}.`, `Take ${P} off both sides: ${left}.${D > 1 ? ` Divide both sides by ${D}.` : ''}`, `So x = ${x}.`] }
  }),
  lv('which x makes both sides equal: put each one in', r => {
    const { A, C, x, P, Q } = both(r, -5, 8, -10, 15)
    if (!P || !Q) return null
    const L = ex(A, P), R = ex(C, Q), ok = `x = ${sn(x)}`
    return { text: 'Which value of x makes both sides equal? Put each one in to check.',
      picture: { kind: 'table', head: ['Left side', '', 'Right side'], rows: [[L, '=', R]] },
      answer: choose(r, ok, [`x = ${sn(x + 1)}`, `x = ${sn(x + pick(r, [-1, 2]))}`]),
      steps: [`Put in x = ${sn(x)}: the left side is ${sn(A * x + P)} and the right side is ${sn(C * x + Q)}.`, 'They match. The other values give two different sides.', `So the answer is ${ok}.`] }
  }),
  lv('spot the mistake: the x parts added across the equals sign', r => {
    const { A, C, P, Q } = both(r, 1, 9, 1, 12)
    const D = A - C, name = pick(r, NAMES), good = r() < 0.5
    const correct = `${ex(D, P)} = ${Q}`, mistake = `${ex(A + C, P)} = ${Q}`, alt = `${ex(D, P)} = ${ex(C, Q)}`
    const claimed = good ? correct : mistake
    const Y = 'Yes, that is the right first step', B = `No, it should be ${good ? mistake : correct}`, Cc = `No, it should be ${alt}`
    const right = good ? Y : B
    return { text: `${name} solves ${ex(A, P)} = ${ex(C, Q)}. ${name}'s first step is ${claimed}. Is that right?`,
      picture: eq(`${ex(A, P)} = ${ex(C, Q)}`, [`${name}: ${claimed}`]), answer: choose(r, right, [Y, B, Cc].filter(c => c !== right)),
      steps: [`Take the smaller x part, ${xT(C)}, off BOTH sides. Never add the x parts together.`, `${xT(A)} − ${xT(C)} = ${xT(D)}, and no x is left on the right: ${correct}.`, `So the answer is: ${right}.`] }
  }),
  lv('work backwards: the missing number for a given answer', r => {
    const { A, C, x, P, Q } = both(r, 1, 8, 1, 25)
    if (Q > 60) return null
    return { text: `In ${xT(A)} + ? = ${ex(C, Q)}, the answer is x = ${x}. What number goes where the ? is?`,
      picture: bal(`${xT(A)} + ?`, ex(C, Q)), answer: P,
      steps: [`Put x = ${x} into the right side: ${C} × ${x} + ${Q} = ${C * x + Q}.`, `The left side must match: ${A} × ${x} = ${A * x}, and ${A * x} + ? = ${C * x + Q}.`, `So the missing number is ${P}.`] }
  }),
  lv('real world: when do two plans come out the same', r => {
    const r1 = int(r, 2, 8), r2 = r1 + int(r, 2, 5), x = int(r, 2, 12), f2 = int(r, 2, 20), f1 = f2 + (r2 - r1) * x
    const [text, unit, done] = pick(r, [
      [`Gym A costs $${f1} to join plus $${r1} a class. Gym B costs $${f2} to join plus $${r2} a class. After how many classes do they cost the same?`, 'class', 'classes'],
      [`Ana has $${f1} and saves $${r1} a week. Ben has $${f2} and saves $${r2} a week. After how many weeks do they have the same amount?`, 'week', 'weeks'],
      [`Tank A holds ${f1} gallons and fills ${r1} gallons a minute. Tank B holds ${f2} gallons and fills ${r2} gallons a minute. After how many minutes do they hold the same amount?`, 'minute', 'minutes'],
    ] as const)
    return { text: `${text} Let x be the number of ${unit === 'class' ? 'classes' : `${unit}s`}.`, picture: bal(ex(r1, f1), ex(r2, f2)), answer: x,
      steps: [`They are the same, so ${ex(r1, f1)} = ${ex(r2, f2)}.`, `Take ${xT(r1)} off both sides: ${f1} = ${ex(r2 - r1, f2)}. Take ${f2} off both sides: ${f1 - f2} = ${xT(r2 - r1)}.`, `Divide both sides by ${r2 - r1}: after ${x} ${done}.`] }
  }),
]

// ── t6 · One, none or many solutions ───────────────────────────────────────────────────────────────────────
const SOL = ['one solution', 'no solution', 'infinitely many solutions']
const sol = (k: number) => ({ choices: SOL, correct: k })
const T6: Level[] = [
  lv('balance, no brackets: do the x parts vanish?', r => {
    const a = int(r, 2, 8), b = int(r, 1, 12), kind = int(r, 0, 2)
    if (kind === 1) {
      const d = int(r, 1, 12)
      if (d === b) return null
      return { text: `How many solutions does ${ex(a, b)} = ${ex(a, d)} have?`, picture: bal(ex(a, b), ex(a, d)), answer: sol(1),
        steps: [`Take ${xT(a)} off both sides: ${b} = ${d}.`, `${b} = ${d} is never true, whatever x is.`, 'So there is no solution.'] }
    }
    if (kind === 2) return { text: `How many solutions does ${ex(a, b)} = ${b} + ${xT(a)} have?`, picture: bal(ex(a, b), `${b} + ${xT(a)}`), answer: sol(2),
      steps: [`Take ${xT(a)} off both sides: ${b} = ${b}.`, 'That is always true, so every number works.', 'So there are infinitely many solutions.'] }
    const c = int(r, 1, 8), d = int(r, 1, 12)
    if (c === a) return null
    return { text: `How many solutions does ${ex(a, b)} = ${ex(c, d)} have?`, picture: bal(ex(a, b), ex(c, d)), answer: sol(0),
      steps: [`Take ${xT(Math.min(a, c))} off both sides. The x parts are different, so ${xT(Math.abs(a - c))} is still there.`, 'An x is left, so only one number works.', 'So there is one solution.'] }
  }),
  lv('brackets: multiply out first', r => {
    const k = int(r, 2, 5), s = pick(r, [1, 2]), p = pick(r, [-5, -3, -2, -1, 1, 2, 3, 4, 6]), kind = int(r, 0, 2)
    const L = `${k}(${ex(s, p)})`, open = ex(k * s, k * p)
    if (kind === 2) return { text: `Multiply out first. How many solutions does ${L} = ${open} have?`, picture: bal(L, open), answer: sol(2),
      steps: [`Multiply out: ${open} = ${open}.`, `Take ${xT(k * s)} off both sides: ${sn(k * p)} = ${sn(k * p)}, which is always true.`, 'So there are infinitely many solutions.'] }
    if (kind === 1) {
      const q = k * p + pick(r, [-4, -3, -1, 2, 5]), R = ex(k * s, q)
      return { text: `Multiply out first. How many solutions does ${L} = ${R} have?`, picture: bal(L, R), answer: sol(1),
        steps: [`Multiply out: ${open} = ${R}.`, `Take ${xT(k * s)} off both sides: ${sn(k * p)} = ${sn(q)}, which is never true.`, 'So there is no solution.'] }
    }
    const c = int(r, 1, 9), q = int(r, 1, 12), R = ex(c, q)
    if (c === k * s) return null
    return { text: `Multiply out first. How many solutions does ${L} = ${R} have?`, picture: bal(L, R), answer: sol(0),
      steps: [`Multiply out: ${open} = ${R}.`, `The x parts, ${xT(k * s)} and ${xT(c)}, are different, so an x is still there after you take the smaller one off.`, 'So there is one solution.'] }
  }),
  lv('spot the mistake: "x = 0" when the x parts vanish', r => {
    const name = pick(r, NAMES), many = r() < 0.5
    let E: string, left: string
    if (many) { const k = int(r, 2, 6), p = int(r, 1, 6); E = `${k}(x + ${p}) = ${ex(k, k * p)}`; left = `${k * p} = ${k * p}` }
    else { const a = int(r, 2, 8), b = int(r, 1, 12), d = int(r, 1, 12); if (b === d) return null; E = `${ex(a, b)} = ${ex(a, d)}`; left = `${b} = ${d}` }
    const claims = ['the only answer is x = 0', 'every number works', 'there is no solution'], claim = pick(r, claims)
    const truth = many ? 'every number works' : 'there is no solution'
    const Y = `Yes, ${name} is right`, B = 'No: every number works', C = 'No: there is no solution'
    const right = claim === truth ? Y : many ? B : C
    return { text: `${name} takes the x parts off both sides of ${E} and gets ${left}. ${name} says ${claim}. Is ${name} right?`,
      picture: eq(E, [left]), answer: choose(r, right, [Y, B, C].filter(c => c !== right)),
      steps: [`${left} is ${many ? 'always' : 'never'} true, whatever x is.`, many ? 'So every number works. It does not mean x is 0.' : 'So no number works at all.', `So the answer is: ${right}.`] }
  }),
  lv('work backwards: the number that makes none or many', r => {
    const k = int(r, 2, 5), s = int(r, 1, 3), p = int(r, 1, 6), L = `${k}(${ex(s, p)})`
    if (r() < 0.5) {
      const q = k * p + pick(r, [-3, -1, 1, 2, 4])
      return { text: `What number goes where the ? is, so that ${L} = ?x${plus(q)} has NO solution?`, picture: bal(L, `?x${plus(q)}`), answer: k * s,
        steps: [`Multiply out: ${L} = ${ex(k * s, k * p)}.`, `For no solution the x parts must vanish, so both sides need ${xT(k * s)}. Then ${k * p} = ${sn(q)} is left, which is never true.`, `So the missing number is ${k * s}.`] }
    }
    return { text: `What number goes where the ? is, so that ${L} = ${xT(k * s)} + ? has INFINITELY MANY solutions?`, picture: bal(L, `${xT(k * s)} + ?`), answer: k * p,
      steps: [`Multiply out: ${L} = ${ex(k * s, k * p)}.`, 'For infinitely many solutions, both sides must be exactly the same.', `So the missing number is ${k * p}.`] }
  }),
  lv('real world: will two rentals ever cost the same', r => {
    const [item, A, B] = pick(r, [['bike', 'Shop A', 'Shop B'], ['kayak', 'Dock A', 'Dock B'], ['parking', 'Garage A', 'Garage B']] as const)
    const kind = int(r, 0, 2), NEVER = 'Never', ONE = 'For exactly one number of hours', ALL = 'For every number of hours'
    let a: string, b: string, story: string, steps: string[], right: string
    if (kind === 2) {
      const k = int(r, 2, 6), p = int(r, 1, 3)
      a = ex(k, k * p); b = `${k}(x + ${p})`; right = ALL
      story = `${A} charges $${k * p} plus $${k} an hour. ${B} charges $${k} an hour for the hours you rent plus ${p} more hour${p > 1 ? 's' : ''}.`
      steps = [`Multiply out: ${b} = ${a}, which is exactly ${A}'s cost.`, 'Both sides are the same, so every number of hours works.', `So the answer is: ${right}.`]
    } else if (kind === 1) {
      const k = int(r, 2, 6), f1 = int(r, 1, 12), f2 = int(r, 1, 12)
      if (f1 === f2) return null
      a = ex(k, f1); b = ex(k, f2); right = NEVER
      story = `${A} charges $${f1} plus $${k} an hour. ${B} charges $${f2} plus $${k} an hour.`
      steps = [`Set them equal: ${a} = ${b}. Take ${xT(k)} off both sides: ${f1} = ${f2}.`, 'That is never true.', `So the answer is: ${right}.`]
    } else {
      const k1 = int(r, 2, 5), k2 = k1 + int(r, 1, 3), X = int(r, 1, 6), f2 = int(r, 1, 10), f1 = f2 + (k2 - k1) * X
      a = ex(k1, f1); b = ex(k2, f2); right = ONE
      story = `${A} charges $${f1} plus $${k1} an hour. ${B} charges $${f2} plus $${k2} an hour.`
      steps = [`Set them equal: ${a} = ${b}. The x parts are different, so an x is left after you take ${xT(k1)} off.`, `Only one number works: at ${X} hour${X > 1 ? 's' : ''} both cost $${k1 * X + f1}.`, `So the answer is: ${right}.`]
    }
    return { text: `Two places rent ${item === 'parking' ? 'parking spaces' : `${item}s`}. ${story} Is there a number of hours when the two cost the same?`,
      picture: eq(`${A}: ${a}`, [`${B}: ${b}`]), answer: choose(r, right, [NEVER, ONE, ALL].filter(c => c !== right)), steps }
  }),
]

// ── t7 · Where two lines cross ─────────────────────────────────────────────────────────────────────────────
/** Two lines with different whole slopes crossing at (X, Y), both drawn on the grid; null if either barely shows. */
const crossing = (r: Rng, lo: number, hi: number, ms: readonly number[]) => {
  const X = int(r, lo + 1, hi - 1), Y = int(r, lo + 1, hi - 1), m1 = pick(r, ms), m2 = pick(r, ms)
  if (m1 === m2) return null
  const b1 = Y - m1 * X, b2 = Y - m2 * X, l1 = gridLine(m1, b1, lo, hi), l2 = gridLine(m2, b2, lo, hi, 2)
  return l1 && l2 ? { X, Y, m1, m2, b1, b2, E1: lineEq(m1, b1), E2: lineEq(m2, b2), pic: plane(hi, [], [l1, l2], lo) } : null
}
const at = (m: number, b: number, x: number) => `${sn(m)} × ${par(x)}${plus(b)} = ${sn(m * x + b)}`
const T7: Level[] = [
  lv('read the crossing from the graph', r => {
    const c = crossing(r, 0, 10, [-2, -1, 1, 2, 3])
    if (!c) return null
    const askX = r() < 0.5
    return { text: `The two lines cross at one point. What is its ${askX ? 'x' : 'y'}-value?`, picture: c.pic, answer: askX ? c.X : c.Y,
      steps: ['Follow both lines to the one place where they meet.', askX ? `Look straight down from the crossing to the x-axis: it is above x = ${c.X}.` : `Look straight across from the crossing to the y-axis: it is at y = ${c.Y}.`, `So the ${askX ? 'x' : 'y'}-value is ${askX ? c.X : c.Y}.`] }
  }),
  lv('no graph: pick the point that is on both lines', r => {
    const X = int(r, -3, 6), Y = int(r, -5, 9), m1 = pick(r, [-3, -2, -1, 1, 2, 3]), m2 = pick(r, [-3, -2, -1, 1, 2, 3])
    if (m1 === m2 || X === Y) return null
    const b1 = Y - m1 * X, b2 = Y - m2 * X, E1 = lineEq(m1, b1), E2 = lineEq(m2, b2), right = pt(X, Y)
    const onBoth = (x: number, y: number) => y === m1 * x + b1 && y === m2 * x + b2
    if (onBoth(Y, X)) return null
    return { text: `Which point is on both ${E1} and ${E2}?`, picture: eq(E1, [E2]),
      answer: choose(r, right, [pt(X + 1, Y + m1), pt(X - 1, Y - m2), pt(Y, X)]),
      steps: [`${right}: ${at(m1, b1, X)} and ${at(m2, b2, X)}. Both rules give ${sn(Y)}.`, 'Each other point fails at least one of the rules.', `So ${right} is on both lines.`] }
  }),
  lv('spot the mistake: a point on only one line', r => {
    const c = crossing(r, -6, 6, [-3, -2, -1, 1, 2, 3])
    if (!c) return null
    const name = pick(r, NAMES), k = int(r, 0, 2)
    const [px, py] = k === 0 ? [c.X, c.Y] : k === 1 ? [c.X + 1, c.Y + c.m1] : [c.X - 1, c.Y - c.m2]
    if (Math.abs(py) > 6 || Math.abs(px) > 6) return null
    const Y = 'Yes, it is on both lines', B = `No, it is only on ${c.E1}`, C = `No, it is only on ${c.E2}`
    const right = [Y, B, C][k], v1 = c.m1 * px + c.b1, v2 = c.m2 * px + c.b2
    const check = (E: string, v: number) => `In ${E}, x = ${sn(px)} gives y = ${sn(v)}${v === py ? ', which matches' : `, not ${sn(py)}`}.`
    return { text: `${name} says the lines ${c.E1} and ${c.E2} cross at ${pt(px, py)}. Is ${name} right?`, picture: c.pic,
      answer: choose(r, right, [Y, B, C].filter(x => x !== right)),
      steps: [check(c.E1, v1), check(c.E2, v2), `So the answer is: ${right}.`] }
  }),
  lv('work backwards: the missing number for a given crossing', r => {
    const X = int(r, 1, 6), m1 = pick(r, [-3, -2, -1, 1, 2, 3, 4]), m2 = pick(r, [-2, -1, 1, 2, 3]), b2 = int(r, -4, 12)
    const Y = m2 * X + b2, b1 = Y - m1 * X
    if (m1 === m2 || b1 < 1) return null
    const E2 = lineEq(m2, b2)
    return { text: `The lines y = ${xT(m1)} + ? and ${E2} cross at x = ${X}. What number goes where the ? is?`,
      picture: eq(`y = ${xT(m1)} + ?`, [E2]), answer: b1,
      steps: [`At the crossing both rules give the same y. In ${E2}, x = ${X} gives y = ${sn(Y)}.`, `So ${sn(m1)} × ${X} + ? = ${sn(Y)}, and ${sn(m1)} × ${X} = ${sn(m1 * X)}.`, `So the missing number is ${b1}.`] }
  }),
  lv('real world: the cost where two plans meet on a graph', r => {
    const [what, unit] = pick(r, [['phone plans', 'GB'], ['bowling alleys', 'game'], ['game arcades', 'token pack']] as const)
    const k1 = int(r, 1, 2), k2 = k1 + int(r, 1, 2), X = int(r, 1, 5), f2 = int(r, 0, 2), f1 = f2 + (k2 - k1) * X, Y = k1 * X + f1
    if (Y > 10) return null
    const l1 = gridLine(k1, f1, 0, 10), l2 = gridLine(k2, f2, 0, 10, 2)
    if (!l1 || !l2) return null
    const each = unit === 'GB' ? 'each GB' : `each ${unit}`
    const plan = (n: string, f: number, k: number) => `${n} costs ${f ? `$${f} plus ` : ''}$${k} for ${each}: ${lineEq(k, f)}.`
    return { text: `Two ${what} charge like this. ${plan('Plan A', f1, k1)} ${plan('Plan B', f2, k2)} The graph shows both. How many dollars do they cost when they cost the same?`,
      picture: plane(10, [], [l1, l2]), answer: Y,
      steps: ['They cost the same where the lines cross.', `Try x = ${X}: ${at(k1, f1, X)} and ${at(k2, f2, X)}. Both are ${Y}.`, `So they both cost ${Y} dollars.`] }
  }),
]

// ── t8 · Solve a system by substitution ────────────────────────────────────────────────────────────────────
const T8: Level[] = [
  lv('y = kx and x + y = s: find x', r => {
    const k = int(r, 2, 6), x = int(r, 1, 9), s = (k + 1) * x
    return { text: `y = ${k}x and x + y = ${s}. What is x?`, picture: eq(`y = ${k}x`, [`x + y = ${s}`]), answer: x,
      steps: [`Put ${k}x in place of y: x + ${k}x = ${s}.`, `x + ${k}x = ${k + 1}x, so ${k + 1}x = ${s}. Divide both sides by ${k + 1}.`, `So x = ${x}.`] }
  }),
  lv('y = x ± p: find x, then y', r => {
    const x = int(r, 1, 12), p = pick(r, [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8]), y = x + p, s = 2 * x + p
    if (s < 1) return null
    const E = `y = ${ex(1, p)}`
    return { text: `${E} and x + y = ${s}. What is y?`, picture: eq(E, [`x + y = ${s}`]), answer: y,
      steps: [`Put ${ex(1, p)} in place of y: x + ${ex(1, p)} = ${s}.`, `2x${plus(p)} = ${s}, so 2x = ${s - p} and x = ${x}.`, `Then y = ${x}${plus(p)}, so y = ${sn(y)}.`] }
  }),
  lv('spot the mistake: the expression put where x was', r => {
    const k = int(r, 2, 5), x = int(r, 2, 8), s = (k + 1) * x, name = pick(r, NAMES), good = r() < 0.5
    const correct = `x + ${k}x = ${s}`, wrongStep = `${k}x + y = ${s}`, claimed = good ? correct : wrongStep
    const Y = 'Yes, that is the right first step', B = `No, it should be ${good ? wrongStep : correct}`, C = `No, it should be x + ${k} = ${s}`
    const right = good ? Y : B
    return { text: `To solve y = ${k}x and x + y = ${s}, ${name}'s first step is ${claimed}. Is that right?`,
      picture: eq(`y = ${k}x`, [`x + y = ${s}`, `${name}: ${claimed}`]), answer: choose(r, right, [Y, B, C].filter(c => c !== right)),
      steps: [`y is the same as ${k}x, so ${k}x goes where the y was, never where the x was.`, `That makes ${correct}.`, `So the answer is: ${right}.`] }
  }),
  lv('work backwards: the missing total for a given x', r => {
    const k = int(r, 2, 5), b = pick(r, [-4, -3, -2, -1, 1, 2, 3, 4, 5]), X = int(r, 1, 8), Y = k * X + b, s = X + Y
    const E = lineEq(k, b)
    return { text: `${E} and x + y = ?. The two equations are both true when x = ${X}. What number goes where the ? is?`,
      picture: eq(E, ['x + y = ?']), answer: s,
      steps: [`Put x = ${X} into ${E}: y = ${k} × ${X}${plus(b)} = ${sn(Y)}.`, `Then x + y = ${X} + ${par(Y)}.`, `So the missing number is ${sn(s)}.`] }
  }),
  lv('real world: two clues in a story', r => {
    const x = int(r, 2, 12), kind = int(r, 0, 2)
    if (kind === 1) {
      const p = int(r, 2, 9), y = x + p, s = x + y
      return { text: `Sam has ${p} more stickers than Leo. Together they have ${s} stickers. How many stickers does Sam have?`,
        picture: eq(`Clue 1: Sam = Leo + ${p}`, [`Clue 2: Sam + Leo = ${s}`]), answer: y,
        steps: [`Let x be Leo's stickers and y be Sam's: y = x + ${p} and x + y = ${s}.`, `Put x + ${p} in place of y: 2x + ${p} = ${s}, so 2x = ${s - p} and x = ${x}.`, `Then y = ${x} + ${p} = ${y}. Sam has ${y} stickers.`] }
    }
    const k = int(r, 2, 5), y = k * x, s = x + y
    const [text, c1, c2, small, big, say] = kind === 0
      ? [`Mia is ${k} times as old as her brother. Their ages add up to ${s}. How old is Mia?`, `Mia = ${k} × brother`, `Mia + brother = ${s}`, "her brother's age", "Mia's age", `Mia is ${y} years old.`]
      : [`A ${s}-foot rope is cut into a long piece and a short piece. The long piece is ${k} times as long as the short piece. How many feet long is the long piece?`, `long = ${k} × short`, `long + short = ${s}`, 'the short piece', 'the long piece', `The long piece is ${y} feet long.`]
    return { text, picture: eq(`Clue 1: ${c1}`, [`Clue 2: ${c2}`]), answer: y,
      steps: [`Let x be ${small} and y be ${big}: y = ${k}x and x + y = ${s}.`, `Put ${k}x in place of y: ${k + 1}x = ${s}, so x = ${x}.`, `Then y = ${k} × ${x} = ${y}. ${say}`] }
  }),
]

// ── t9 · System stories ────────────────────────────────────────────────────────────────────────────────────
type Mix = { one: string; two: string; A: string; B: string; h1: string; h2: string; count: string; value: string; p1: number; p2: number; story: (n: number, v: number) => string; each: (p: number) => string; part: string; partSay: (n: number) => string }
const mix = (r: Rng): Mix => {
  const p2 = int(r, 2, 5), p1 = p2 + int(r, 1, 4)
  return pick(r, [
    { one: 'adult tickets', two: 'kid tickets', A: 'a', B: 'k', h1: 'Adult', h2: 'Kid', count: 'Tickets', value: 'Cost ($)', p1, p2,
      story: (n, v) => `A family buys ${n} tickets. Adult tickets cost $${p1} and kid tickets cost $${p2}. They pay $${v}.`, each: p => `${p} each`,
      part: 'How many dollars did the kid tickets cost in all?', partSay: n => `The kid tickets cost $${n} in all.` },
    { one: 'cows', two: 'hens', A: 'c', B: 'h', h1: 'Cows', h2: 'Hens', count: 'Animals', value: 'Legs', p1: 4, p2: 2,
      story: (n, v) => `A farm has cows and hens: ${n} animals and ${v} legs. A cow has 4 legs and a hen has 2.`, each: p => `${p} each`,
      part: 'How many legs do the hens have in all?', partSay: n => `The hens have ${n} legs in all.` },
    { one: 'notebooks', two: 'pens', A: 'n', B: 'p', h1: 'Notebooks', h2: 'Pens', count: 'Items', value: 'Cost ($)', p1, p2,
      story: (n, v) => `Notebooks cost $${p1} and pens cost $${p2}. Leo buys ${n} items and pays $${v}.`, each: p => `${p} each`,
      part: 'How many dollars did Leo spend on pens?', partSay: n => `Leo spent $${n} on pens.` },
    { one: 'cars', two: 'bikes', A: 'c', B: 'b', h1: 'Cars', h2: 'Bikes', count: 'Vehicles', value: 'Wheels', p1: 4, p2: 2,
      story: (n, v) => `A lot has cars and bikes: ${n} vehicles and ${v} wheels. A car has 4 wheels and a bike has 2.`, each: p => `${p} each`,
      part: 'How many wheels do the bikes have in all?', partSay: n => `The bikes have ${n} wheels in all.` },
  ])
}
/** Pick the counts, and the two worked steps every ticket-style problem shares. */
const counts = (r: Rng, M: Mix) => {
  const n = int(r, 6, 20), a = int(r, 2, n - 2), b = n - a, v = M.p1 * a + M.p2 * b, d = M.p1 - M.p2
  const setUp = `${M.A} + ${M.B} = ${n} and ${M.p1}${M.A} + ${M.p2}${M.B} = ${v}.`
  const solve = `Put ${M.B} = ${n} − ${M.A} into the second: ${M.p1}${M.A} + ${M.p2 * n} − ${M.p2}${M.A} = ${v}, so ${xT(d).replace('x', M.A)} = ${v - M.p2 * n}${d > 1 ? ` and ${M.A} = ${a}` : ''}.`
  const table: Picture = { kind: 'table', head: ['', M.h1, M.h2, 'Total'], rows: [[M.count, '?', '?', fmt(n)], [M.value, M.each(M.p1), M.each(M.p2), fmt(v)]], rowHead: true }
  return { n, a, b, v, setUp, solve, table }
}
const T9: Level[] = [
  lv('two kinds in a table: how many of the first kind', r => {
    const M = mix(r), c = counts(r, M)
    return { text: `${M.story(c.n, c.v)} How many ${M.one} are there?`, picture: c.table, answer: c.a,
      steps: [c.setUp, c.solve, `So there are ${c.a} ${M.one}.`] }
  }),
  lv('two plans in a table: when do they cost the same', r => {
    const [A, B, start, per, unit, units] = pick(r, [['Plan A', 'Plan B', 'Start ($)', 'Each month ($)', 'a month', 'months'], ['Gym A', 'Gym B', 'Join ($)', 'Each visit ($)', 'a visit', 'visits']] as const)
    const r1 = int(r, 2, 8), r2 = r1 + int(r, 2, 4), x = int(r, 2, 15), f2 = int(r, 2, 15), f1 = f2 + (r2 - r1) * x
    return { text: `${A} costs $${f1} to ${start === 'Join ($)' ? 'join' : 'start'} plus $${r1} ${unit}. ${B} costs $${f2} to ${start === 'Join ($)' ? 'join' : 'start'} plus $${r2} ${unit}. After how many ${units} do they cost the same?`,
      picture: { kind: 'table', head: ['', start, per], rows: [[A, fmt(f1)], [B, fmt(f2)]].map((row, i) => [...row, fmt(i ? r2 : r1)]), rowHead: true },
      answer: x,
      steps: [`${A}: y = ${ex(r1, f1)}. ${B}: y = ${ex(r2, f2)}.`, `Both are y, so ${ex(r1, f1)} = ${ex(r2, f2)}. Take ${xT(r1)} and ${f2} off both sides: ${f1 - f2} = ${xT(r2 - r1)}.`, `So they cost the same after ${x} ${units}.`] }
  }),
  lv('pick the two equations that fit the story', r => {
    const M = mix(r), c = counts(r, M)
    const sys = (t1: number, t2: number, q1: number, q2: number) => `${M.A} + ${M.B} = ${t1} and ${q1}${M.A} + ${q2}${M.B} = ${t2}`
    const right = sys(c.n, c.v, M.p1, M.p2)
    return { text: `${M.story(c.n, c.v)} Let ${M.A} be the ${M.one} and ${M.B} the ${M.two}. Which pair of equations fits the story?`,
      picture: c.table,
      answer: choose(r, right, [sys(c.v, c.n, M.p1, M.p2), sys(c.n, c.v, M.p2, M.p1), `${M.A} + ${M.B} = ${c.n} and ${M.A} + ${M.B} = ${c.v}`]),
      steps: [`One equation counts the ${M.count.toLowerCase()}: ${M.A} + ${M.B} = ${c.n}.`, `The other counts the ${M.value === 'Cost ($)' ? 'dollars' : M.value.toLowerCase()}: ${M.p1}${M.A} + ${M.p2}${M.B} = ${c.v}.`, `So the answer is: ${right}.`] }
  }),
  lv('no table: find the second kind', r => {
    const M = mix(r), c = counts(r, M)
    return { text: `${M.story(c.n, c.v)} How many ${M.two} are there?`,
      picture: { kind: 'table', head: ['Fact', 'In all'], rows: [[M.count, fmt(c.n)], [M.value, fmt(c.v)]], rowHead: true }, answer: c.b,
      steps: [c.setUp, c.solve, `Then ${M.B} = ${c.n} − ${c.a}, so there are ${c.b} ${M.two}.`] }
  }),
  lv('two-step: solve the system, then answer a new question', r => {
    const M = mix(r), c = counts(r, M), ans = M.p2 * c.b
    return { text: `${M.story(c.n, c.v)} ${M.part}`, picture: c.table, answer: ans,
      steps: [`${c.setUp} ${c.solve}`, `So ${M.B} = ${c.n} − ${c.a} = ${c.b}.`, `${c.b} × ${M.p2} = ${ans}. ${M.partSay(ans)}`] }
  }),
]

export const G8M2_LADDERS: Record<string, Level[]> = {
  'g8m2-t1': T1, 'g8m2-t2': T2, 'g8m2-t3': T3, 'g8m2-t4': T4, 'g8m2-t5': T5, 'g8m2-t6': T6, 'g8m2-t7': T7, 'g8m2-t8': T8, 'g8m2-t9': T9,
}
