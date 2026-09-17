/**
 * Grade 8 · Module 6 — Bivariate data. Practice ladders, easiest style first (see ../adaptive.ts and the reference
 * ladders in ./g5m1.ts, ./g6m7.ts).
 * ⚠️ Every level runs through `lv`, which re-rolls a problem whose picture prints its own answer (the gate's reader: a
 * label, or a list of labels joined up) or whose choices repeat. A `plot` is never `dataShown`, so a scatter plot's
 * labels carry no digits; a two-way table re-rolls whenever a cell happens to equal the answer.
 */
import type { Picture, Problem } from '../script'
import { showAnswer } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const num = (n: number) => fmt(n).replace('-', '−')
const pl = (k: number, one: string, many = `${one}s`) => `${fmt(k)} ${k === 1 ? one : many}`
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
const NAMES = ['Leo', 'Mia', 'Sam', 'Ava', 'Kai', 'Nina', 'Ben', 'Zoe', 'Jay', 'Lily']
const choose = (r: Rng, right: string, wrong: string[]) => { const choices = shuffle(r, [right, ...wrong]); return { choices, correct: choices.indexOf(right) } }
const pt = (p: [number, number]) => `(${num(p[0])}, ${num(p[1])})`

// ── The reveal guard (mirrors the gate's reader) ─────────────────────────────────────────────────────────────────
const labelsOf = (pic: unknown): string[] => {
  const t: string[] = []
  const w = (v: unknown) => {
    if (typeof v === 'string') t.push(v)
    else if (Array.isArray(v)) { if (v.length && v.every(x => typeof x === 'string')) t.push(v.join('')); v.forEach(w) }
    else if (v && typeof v === 'object') Object.values(v).forEach(w)
  }
  w(pic)
  return t
}
const wholeWord = (labels: string[], choice: string) => {
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${choice.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}\\p{N}])`, 'u')
  return labels.some(t => re.test(t)) || labels.includes(choice)
}
const bad = (p: Problem) => {
  const a = p.answer!, labels = labelsOf(p.picture)
  if (typeof a === 'number') return Math.abs(a) >= 10 && labels.some(s => (s.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).some(x => x.replace(/,/g, '') === String(Math.abs(a))))
  if (typeof a === 'object' && 'choices' in a) return new Set(a.choices).size !== a.choices.length || wholeWord(labels, a.choices[a.correct])
  return false
}
const lv = (style: string, make: (r: Rng) => Problem): Level => ({
  style, make: r => { let p = make(r); for (let i = 0; i < 50 && bad(p); i++) p = make(r); return p },
})

// ── t1 · Scatter plot patterns ───────────────────────────────────────────────────────────────────────────────────
type Dir = 'positive' | 'negative' | 'no pattern'
interface Cloud { one: string; many: string; x: string; y: string; about: string; xlo: number; xhi: number; q: number; xMax: number; xStep: number; ylo: number; yhi: number; yMax: number; yStep: number; dir: Dir }
const C = (one: string, many: string, x: string, y: string, about: string, xr: [number, number, number, number, number], yr: [number, number, number, number], dir: Dir): Cloud =>
  ({ one, many, x, y, about, xlo: xr[0], xhi: xr[1], q: xr[2], xMax: xr[3], xStep: xr[4], ylo: yr[0], yhi: yr[1], yMax: yr[2], yStep: yr[3], dir })
const CLOUDS: Cloud[] = [
  C('student', 'students', 'Hours studied', 'Test score', 'hours studied and test score', [0, 8, 1, 8, 1], [45, 95, 100, 10], 'positive'),
  C('player', 'players', 'Hours of practice', 'Free throws made', 'hours of practice and free throws made', [1, 10, 1, 10, 1], [3, 18, 20, 2], 'positive'),
  C('day at a pool', 'days at a pool', 'Temperature (°F)', 'Swimmers', 'temperature and swimmers', [60, 95, 5, 100, 10], [10, 70, 80, 10], 'positive'),
  C('car trip', 'car trips', 'Miles driven', 'Gallons of gas used', 'miles driven and gallons of gas used', [20, 280, 10, 300, 50], [1, 11, 12, 2], 'positive'),
  C('day at a cafe', 'days at a cafe', 'Temperature (°F)', 'Cups of hot chocolate sold', 'temperature and cups of hot chocolate sold', [30, 85, 5, 90, 10], [10, 55, 60, 10], 'negative'),
  C('used car', 'used cars', 'Age (years)', 'Value (thousands of dollars)', 'age and value', [1, 10, 1, 10, 1], [5, 28, 30, 5], 'negative'),
  C('student', 'students', 'Hours of screen time', 'Hours of sleep', 'hours of screen time and hours of sleep', [1, 8, 1, 8, 1], [5, 11, 12, 2], 'negative'),
  C('student', 'students', 'Days absent', 'Test score', 'days absent and test score', [0, 10, 1, 10, 1], [50, 95, 100, 10], 'negative'),
  C('student', 'students', 'Shoe size', 'Test score', 'shoe size and test score', [4, 11, 1, 12, 1], [55, 95, 100, 10], 'no pattern'),
  C('student', 'students', 'Letters in first name', 'Height (inches)', 'letters in first name and height', [3, 9, 1, 10, 1], [55, 70, 80, 10], 'no pattern'),
  C('student', 'students', 'Birth month', 'Math score', 'birth month and math score', [1, 12, 1, 12, 1], [50, 98, 100, 10], 'no pattern'),
  C('dog', 'dogs', 'Letters in its name', 'Weight (pounds)', 'letters in its name and weight', [3, 8, 1, 10, 1], [10, 70, 80, 10], 'no pattern'),
]
const corr = (xs: number[], ys: number[]) => {
  const n = xs.length, mx = sum(xs) / n, my = sum(ys) / n
  let sxy = 0, sxx = 0, syy = 0
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2 }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0
}
const trend = (c: Cloud, x: number) => {
  const t = (x - c.xlo) / (c.xhi - c.xlo), span = c.yhi - c.ylo
  return c.dir === 'negative' ? c.yhi - span * t : c.ylo + span * t
}
/** n dots whose cloud really has the context's pattern, no two dots the same. */
const cloud = (r: Rng, c: Cloud, n: number, noise = 0.3): [number, number][] => {
  for (;;) {
    const xs = Array.from({ length: n }, () => int(r, Math.ceil(c.xlo / c.q), Math.floor(c.xhi / c.q)) * c.q)
    const span = c.yhi - c.ylo
    const ys = xs.map(x => c.dir === 'no pattern' ? int(r, c.ylo, c.yhi) : Math.min(c.yhi, Math.max(c.ylo, Math.round(trend(c, x) + (r() - 0.5) * span * noise))))
    const k = corr(xs, ys)
    const ok = c.dir === 'positive' ? k > 0.8 : c.dir === 'negative' ? k < -0.8 : Math.abs(k) < 0.15
    if (ok && new Set(xs.map((x, i) => `${x},${ys[i]}`)).size === n) return xs.map((x, i) => [x, ys[i]] as [number, number]).sort((a, b) => a[0] - b[0] || a[1] - b[1])
  }
}
const plotOf = (c: Cloud, points: [number, number][]): Picture => ({ kind: 'plot', points, xMax: c.xMax, yMax: c.yMax, xStep: c.xStep, yStep: c.yStep, xLabel: c.x, yLabel: c.y })
const shows = (d: Dir) => (d === 'no pattern' ? 'no pattern' : `a ${d} pattern`)
const how = (c: Cloud) => c.dir === 'positive' ? `As ${c.x.toLowerCase()} goes up, ${c.y.toLowerCase()} goes up too. The cloud rises to the right.`
  : c.dir === 'negative' ? `As ${c.x.toLowerCase()} goes up, ${c.y.toLowerCase()} goes down. The cloud falls to the right.`
  : 'The dots are scattered everywhere. The cloud does not rise and does not fall.'
const DIRS: Dir[] = ['positive', 'negative', 'no pattern']
const SITUATIONS: Record<Dir, string[]> = {
  positive: ['Hours of practice and free throws made', 'Temperature and ice creams sold', 'Miles driven and gas used', 'Pages in a book and time to read it', 'Hours worked and money earned'],
  negative: ['Age of a car and its value', 'Hours of screen time and hours of sleep', 'Days absent and test score', 'Temperature and cups of hot chocolate sold', 'Speed of a runner and time to finish a race'],
  'no pattern': ['Shoe size and test score', 'Birth month and math score', 'Letters in a first name and height', 'Last digit of a phone number and height', 'Letters in a pet’s name and its weight'],
}

const T1: Level[] = [
  lv('read the whole cloud, name the pattern', r => {
    const c = pick(r, CLOUDS), pts = cloud(r, c, int(r, 9, 12))
    return { text: `Each dot is one ${c.one}: ${c.about}. What pattern does the plot show?`, picture: plotOf(c, pts),
      answer: choose(r, c.dir, DIRS.filter(d => d !== c.dir)),
      steps: ['Look at the whole cloud of dots, not just two of them.', how(c), `So the plot shows ${c.dir === 'no pattern' ? 'no pattern' : `a ${c.dir} pattern`}.`] }
  }),
  lv('find the dot far from the rest', r => {
    for (;;) {
      const c = pick(r, CLOUDS.filter(k => k.dir !== 'no pattern')), span = c.yhi - c.ylo
      const pts = cloud(r, c, int(r, 8, 10), 0.2)
      const ox = int(r, Math.ceil(c.xlo / c.q), Math.floor(c.xhi / c.q)) * c.q, t = trend(c, ox)
      const oy = Math.round(t > (c.ylo + c.yhi) / 2 ? Math.max(0, t - 0.65 * span) : Math.min(c.yMax, t + 0.65 * span))
      if (Math.abs(oy - t) < 0.45 * span || pts.some(p => p[0] === ox && p[1] === oy)) continue
      // The dot must stand out from a straight fit of the others, by far more than any of them does.
      const n = pts.length, mx = sum(pts.map(q => q[0])) / n, my = sum(pts.map(q => q[1])) / n
      const sl = sum(pts.map(q => (q[0] - mx) * (q[1] - my))) / sum(pts.map(q => (q[0] - mx) ** 2))
      const res = (q: [number, number]) => Math.abs(q[1] - (my + sl * (q[0] - mx)))
      if (res([ox, oy]) < 3 * Math.max(...pts.map(res)) || res([ox, oy]) < 0.35 * span) continue
      const near = [...pts].sort((a, b) => Math.abs(a[0] - ox) - Math.abs(b[0] - ox)).slice(0, 2)
      const around = Math.round((near[0][1] + near[1][1]) / 2)
      if (Math.abs(around - oy) < 0.35 * span) continue
      const others = shuffle(r, pts).slice(0, 2)
      const out: [number, number] = [ox, oy]
      const right = pt(out)
      return { text: `Each dot is one ${c.one}: ${c.about}. One dot is far from the rest. Which dot is it?`,
        picture: plotOf(c, [...pts, out].sort((a, b) => a[0] - b[0] || a[1] - b[1])), answer: choose(r, right, others.map(pt)),
        steps: [`Most dots follow the cloud as it ${c.dir === 'positive' ? 'rises' : 'falls'} to the right.`, `The dots nearest x = ${num(ox)} sit around ${num(around)}, but one dot there is at ${num(oy)}.`, `So the dot far from the rest is ${right}.`] }
    }
  }),
  lv('is the classmate right about the pattern', r => {
    const c = pick(r, CLOUDS), pts = cloud(r, c, int(r, 9, 12)), who = pick(r, NAMES)
    const claim: Dir = r() < 0.35 ? c.dir : c.dir === 'negative' && r() < 0.6 ? 'no pattern' : pick(r, DIRS.filter(d => d !== c.dir))
    const no = (d: Dir) => (d === 'no pattern' ? 'No, it shows no pattern' : `No, it is a ${d} pattern`)
    const yes = `Yes, ${who} is right`
    const right = claim === c.dir ? yes : no(c.dir)
    return { text: `${who} looks at this plot of ${c.about} and says it shows ${shows(claim)}. Is ${who} right?`, picture: plotOf(c, pts),
      answer: choose(r, right, [yes, ...DIRS.filter(d => d !== claim).map(no)].filter(x => x !== right)),
      steps: ['Judge the whole cloud: does it rise, fall, or neither?', how(c), `So the plot shows ${shows(c.dir)}. ${right}.`] }
  }),
  lv('no plot: read the pattern from a table of values', r => {
    const c = pick(r, CLOUDS), pts = cloud(r, c, 7)
    return { text: `This table lists ${pts.length} ${c.many}: ${c.about}. If you made a scatter plot of them, what pattern would it show?`,
      picture: { kind: 'table', rows: [[c.x, ...pts.map(p => fmt(p[0]))], [c.y, ...pts.map(p => fmt(p[1]))]], rowHead: true },
      answer: choose(r, c.dir, DIRS.filter(d => d !== c.dir)),
      steps: ['The table is already in order of the top row, from smallest to biggest.', c.dir === 'positive' ? 'Read along the bottom row: the values mostly go up as the top row goes up.' : c.dir === 'negative' ? 'Read along the bottom row: the values mostly go down as the top row goes up.' : 'Read along the bottom row: the values jump up and down with no direction.', `So the plot would show ${c.dir === 'no pattern' ? 'no pattern' : `a ${c.dir} pattern`}.`] }
  }),
  lv('real world: which pair of quantities makes this pattern', r => {
    const d = pick(r, DIRS), right = pick(r, SITUATIONS[d])
    const wrong = DIRS.filter(k => k !== d).map(k => pick(r, SITUATIONS[k]))
    const why = d === 'positive' ? 'when one goes up, the other goes up too' : d === 'negative' ? 'when one goes up, the other goes down' : 'one has nothing to do with the other'
    return { text: `Which pair would most likely show ${shows(d)} on a scatter plot?`,
      picture: { kind: 'eq', text: 'More of one →', lines: ['more, less, or neither?'] },
      answer: choose(r, right, wrong),
      steps: ['For each pair, ask: when the first goes up, what happens to the second?', `For the right pair, ${why}.`, `So the answer is: ${right}.`] }
  }),
]

// ── t2 & t3 · Lines of fit ───────────────────────────────────────────────────────────────────────────────────────
interface Rule {
  X: string; Y: string; about: string; xMax: number; m: [number, number]; b: [number, number]; noise: [number, number]
  unit: string; yOne: string; yMany: string; pred: (x: number) => string; back: (y: number) => string
}
const RULES: Rule[] = [
  { X: 'Hours studied', Y: 'Test score', about: 'hours studied and test score', xMax: 8, m: [4, 6], b: [40, 55], noise: [5, 9], unit: 'hour', yOne: 'point', yMany: 'points',
    pred: x => `the test score for ${pl(x, 'hour')} of studying`, back: y => `How many hours of studying does the line predict for a score of ${fmt(y)}?` },
  { X: 'Days', Y: 'Pages read', about: 'days and pages read', xMax: 10, m: [5, 9], b: [8, 20], noise: [5, 9], unit: 'day', yOne: 'page', yMany: 'pages',
    pred: x => `the pages read after ${pl(x, 'day')}`, back: y => `After how many days does the line predict ${fmt(y)} pages read?` },
  { X: 'Hours worked', Y: 'Dollars earned', about: 'hours worked and dollars earned', xMax: 8, m: [10, 15], b: [12, 30], noise: [7, 12], unit: 'hour', yOne: 'dollar', yMany: 'dollars',
    pred: x => `the dollars earned for ${pl(x, 'hour')} of work`, back: y => `How many hours of work does the line predict for ${fmt(y)} dollars earned?` },
  { X: 'Hours of TV', Y: 'Test score', about: 'hours of TV and test score', xMax: 8, m: [-6, -3], b: [85, 95], noise: [5, 9], unit: 'hour', yOne: 'point', yMany: 'points',
    pred: x => `the test score for ${pl(x, 'hour')} of TV`, back: y => `How many hours of TV does the line predict for a score of ${fmt(y)}?` },
  { X: 'Weeks', Y: 'Height (inches)', about: 'weeks and a plant’s height', xMax: 10, m: [2, 3], b: [3, 6], noise: [2, 3], unit: 'week', yOne: 'inch', yMany: 'inches',
    pred: x => `the plant’s height after ${pl(x, 'week')}`, back: y => `After how many weeks does the line predict a height of ${fmt(y)} inches?` },
]
const eqOf = (m: number, b: number) => `y = ${num(m)}x ${b < 0 ? '−' : '+'} ${fmt(Math.abs(b))}`
const lineOf = (r: Rng, k: Rule) => ({ m: int(r, k.m[0], k.m[1]), b: int(r, k.b[0], k.b[1]) })
/** Dots around y = mx + b, none on the line. `above` = how many sit above it (null: at random). */
const dotsAround = (r: Rng, k: Rule, m: number, b: number, n: number, above: number | null): { pic: Picture & { kind: 'plot' }; pts: [number, number][]; up: number } => {
  const top = Math.max(b, b + m * k.xMax) + k.noise[1], yStep = top > 100 ? 20 : 10, yMax = Math.ceil(top / yStep) * yStep
  for (;;) {
    const xs = shuffle(r, Array.from({ length: k.xMax - 1 }, (_, i) => i + 1)).slice(0, Math.ceil(n / 2))
    const at = shuffle(r, [...xs, ...xs]).slice(0, n)
    const signs = above === null ? at.map(() => (r() < 0.5 ? 1 : -1)) : shuffle(r, at.map((_, i) => (i < above ? 1 : -1)))
    const pts = at.map((x, i) => [x, b + m * x + signs[i] * int(r, k.noise[0], k.noise[1])] as [number, number])
    if (pts.some(p => p[1] < 1 || p[1] > yMax - 1) || new Set(pts.map(p => `${p[0]},${p[1]}`)).size !== n) continue
    pts.sort((p, q) => p[0] - q[0] || p[1] - q[1])
    return { pts, up: signs.filter(s => s > 0).length,
      pic: { kind: 'plot', points: pts, xMax: k.xMax, yMax, xStep: 1, yStep, xLabel: k.X, yLabel: k.Y } }
  }
}

const T2: Level[] = [
  lv('count the dots above or below a drawn line', r => {
    const k = pick(r, RULES), { m, b } = lineOf(r, k), n = int(r, 8, 12), { pic, up } = dotsAround(r, k, m, b, n, null)
    const side = pick(r, ['above', 'below'] as const), ans = side === 'above' ? up : n - up
    return { text: `A line is drawn through these ${n} dots of ${k.about}. How many dots sit ${side} the line?`,
      picture: { ...pic, fit: [[0, b], [k.xMax, b + m * k.xMax]] }, answer: ans,
      steps: [`Go along the line from left to right and look at each dot.`, `${pl(up, 'dot')} ${up === 1 ? 'sits' : 'sit'} above it and ${fmt(n - up)} below it.`, `So ${fmt(ans)} ${ans === 1 ? 'dot sits' : 'dots sit'} ${side} the line.`] }
  }),
  lv('pick the line that fits best', r => {
    const k = pick(r, RULES), { m, b } = lineOf(r, k), n = pick(r, [8, 10, 12]), h = n / 2, { pic } = dotsAround(r, k, m, b, n, h)
    const line = (a: number) => `A line with ${pl(a, 'dot')} above it and ${fmt(n - a)} below`
    const hi = int(r, h + 2, n), lo = int(r, 0, h - 2)
    const right = line(h)
    return { text: `Three students each drew a line for these ${n} dots of ${k.about}. None of the dots sits on a line. Which line fits best?`, picture: pic,
      answer: choose(r, right, [line(hi), line(lo)]),
      steps: ['A line that fits goes through the middle of the dots.', `About as many dots sit above it as below it: ${n} ÷ 2 = ${h}.`, `So the best one is: ${right}.`] }
  }),
  lv('slope of the fitted line from two of its points', r => {
    const k = pick(r, RULES), { m, b } = lineOf(r, k), { pic } = dotsAround(r, k, m, b, int(r, 8, 10), null)
    const x1 = int(r, 0, k.xMax - 2), x2 = int(r, x1 + 2, k.xMax), y1 = b + m * x1, y2 = b + m * x2
    return { text: `A line fits these dots of ${k.about} well. It passes through ${pt([x1, y1])} and ${pt([x2, y2])}. What is its slope?`,
      picture: { ...pic, fit: [[0, b], [k.xMax, b + m * k.xMax]] }, answer: m,
      steps: [`The rise is ${num(y2)} − ${num(y1)} = ${num(y2 - y1)}.`, `The run is ${num(x2)} − ${num(x1)} = ${num(x2 - x1)}.`, `${num(y2 - y1)} ÷ ${num(x2 - x1)} = ${showAnswer(m)}. So the slope is ${showAnswer(m)}.`] }
  }),
  lv('is the classmate’s slope right (rise only, or the sign lost)', r => {
    const k = pick(r, RULES), { m, b } = lineOf(r, k), { pic } = dotsAround(r, k, m, b, int(r, 8, 10), null), who = pick(r, NAMES)
    const x1 = int(r, 0, k.xMax - 2), x2 = int(r, x1 + 2, k.xMax), y1 = b + m * x1, y2 = b + m * x2, rise = y2 - y1, run = x2 - x1
    const cands = [m, rise, -m], claim = pick(r, cands)
    const yes = `Yes, ${num(claim)} is right`, no = (v: number) => `No, it is ${num(v)}`
    const right = claim === m ? yes : no(m)
    return { text: `${who} found the slope of this line through ${pt([x1, y1])} and ${pt([x2, y2])}. ${who} says it is ${num(claim)}. Is ${who} right?`,
      picture: { ...pic, fit: [[0, b], [k.xMax, b + m * k.xMax]] },
      answer: choose(r, right, [yes, ...cands.filter(v => v !== claim).map(no)].filter(x => x !== right)),
      steps: [`Slope is rise ÷ run: (${num(y2)} − ${num(y1)}) ÷ (${num(x2)} − ${num(x1)}).`, `That is ${num(rise)} ÷ ${num(run)} = ${num(m)}.`, `${right}.`] }
  }),
  lv('work backwards: a missing point on the line from its slope', r => {
    const k = pick(r, RULES), { m, b } = lineOf(r, k), { pic } = dotsAround(r, k, m, b, int(r, 8, 10), null)
    const x1 = int(r, 1, k.xMax - 3), x2 = int(r, x1 + 2, k.xMax), y1 = b + m * x1, y2 = b + m * x2
    return { text: `A line of best fit for ${k.about} has a slope of ${num(m)}. It passes through ${pt([x1, y1])} and (${fmt(x2)}, ?). What is the missing y value?`,
      picture: pic, answer: y2,
      steps: [`The run from x = ${fmt(x1)} to x = ${fmt(x2)} is ${fmt(x2 - x1)}.`, `The slope is ${num(m)}, so the rise is ${num(m)} × ${fmt(x2 - x1)} = ${num(m * (x2 - x1))}.`, `${num(y1)} ${m < 0 ? '−' : '+'} ${fmt(Math.abs(m * (x2 - x1)))} = ${showAnswer(y2)}. So the missing y value is ${showAnswer(y2)}.`] }
  }),
]

const slopeMeans = (k: Rule, m: number) => `About ${fmt(Math.abs(m))} ${m < 0 ? 'fewer' : 'more'} ${Math.abs(m) === 1 ? k.yOne : k.yMany} for each extra ${k.unit}`
const startMeans = (k: Rule, b: number) => `${pl(b, k.yOne, k.yMany)} at 0 ${k.unit}s`

const T3: Level[] = [
  lv('put x into the equation, predict y', r => {
    const k = pick(r, RULES), { m, b } = lineOf(r, k), x = int(r, 2, k.xMax + 2), y = m * x + b
    return { text: `The line of best fit for ${k.about} is ${eqOf(m, b)}. Predict ${k.pred(x)}.`,
      picture: { kind: 'eq', text: eqOf(m, b), lines: [`x = ${pl(x, k.unit)}`] }, answer: y,
      steps: [`Put ${fmt(x)} in for x: y = ${num(m)} × ${fmt(x)} + ${fmt(b)}.`, `${num(m)} × ${fmt(x)} = ${num(m * x)}, and ${num(m * x)} + ${fmt(b)} = ${num(y)}.`, `So the prediction is ${showAnswer(y)}.`] }
  }),
  lv('read the line off the graph, then predict', r => {
    for (;;) {
      const k = pick(r, RULES), { m, b } = lineOf(r, k), { pic } = dotsAround(r, k, m, b, int(r, 8, 10), null)
      const x1 = int(r, 2, k.xMax), y1 = m * x1 + b, x = int(r, 1, k.xMax + 2), y = m * x + b
      if (x === x1) continue
      return { text: `This line of best fit for ${k.about} starts at ${fmt(b)} at 0 ${k.unit}s and passes through ${pt([x1, y1])}. Use it to predict ${k.pred(x)}.`,
        picture: { ...pic, fit: [[0, b], [k.xMax, b + m * k.xMax]] }, answer: y,
        steps: [`The slope is (${num(y1)} − ${fmt(b)}) ÷ ${fmt(x1)} = ${num(m)}, so the equation is ${eqOf(m, b)}.`, `Put in ${fmt(x)}: ${num(m)} × ${fmt(x)} + ${fmt(b)}.`, `That is ${num(m * x)} + ${fmt(b)} = ${showAnswer(y)}. So the prediction is ${showAnswer(y)}.`] }
    }
  }),
  lv('what the slope or the start of the equation means', r => {
    for (;;) {
      const k = pick(r, RULES), { m, b } = lineOf(r, k)
      if (Math.abs(m) === b) continue
      const aboutSlope = r() < 0.6, v = aboutSlope ? m : b, u = Math.abs(v)
      const right = aboutSlope ? slopeMeans(k, m) : startMeans(k, b)
      const wrong = aboutSlope ? [startMeans(k, u), pl(u, k.unit)] : [slopeMeans(k, b), pl(u, k.unit)]
      return { text: `The line of best fit for ${k.about} is ${eqOf(m, b)}. What does the ${num(v)} mean?`,
        picture: { kind: 'eq', text: eqOf(m, b), lines: [`x = ${k.X.toLowerCase()}, y = ${k.Y.toLowerCase()}`] },
        answer: choose(r, right, wrong),
        steps: aboutSlope
          ? [`${num(m)} is the slope: how much y changes for each 1 more in x.`, `Here x counts ${k.unit}s and y counts ${k.yMany}.`, `So it means: ${right}.`]
          : [`${fmt(b)} is where the line starts, when x is 0.`, `Here x counts ${k.unit}s and y counts ${k.yMany}.`, `So it means: ${right}.`] }
    }
  }),
  lv('is the classmate’s prediction right (forgot the start, or added)', r => {
    for (;;) {
      const k = pick(r, RULES), { m, b } = lineOf(r, k), x = int(r, 2, k.xMax + 2), who = pick(r, NAMES)
      const y = m * x + b, cands = [y, m * x, m + x + b]
      if (new Set(cands).size < 3) continue
      const claim = pick(r, cands)
      const yes = `Yes, ${num(claim)} is right`, no = (v: number) => `No, it is ${num(v)}`
      const right = claim === y ? yes : no(y)
      return { text: `${who} uses the line ${eqOf(m, b)} to predict ${k.pred(x)}. ${who} gets ${num(claim)}. Is ${who} right?`,
        picture: { kind: 'eq', text: eqOf(m, b), lines: [`x = ${pl(x, k.unit)}`] },
        answer: choose(r, right, [yes, ...cands.filter(v => v !== claim).map(no)].filter(z => z !== right)),
        steps: [`Multiply first: ${num(m)} × ${fmt(x)} = ${num(m * x)}.`, `Then add the start: ${num(m * x)} + ${fmt(b)} = ${num(y)}.`, `${right}.`] }
    }
  }),
  lv('work backwards: which x gives this predicted y', r => {
    const k = pick(r, RULES), { m, b } = lineOf(r, k), x = int(r, 2, k.xMax + 2), y = m * x + b
    return { text: `The line of best fit for ${k.about} is ${eqOf(m, b)}. ${k.back(y)}`,
      picture: { kind: 'eq', text: eqOf(m, b), lines: [`y = ${num(y)}`] }, answer: x,
      steps: [`Put ${num(y)} in for y: ${num(y)} = ${num(m)}x + ${fmt(b)}.`, `Take away the start: ${num(y)} − ${fmt(b)} = ${num(y - b)}, so ${num(m)}x = ${num(y - b)}.`, `${num(y - b)} ÷ ${num(m)} = ${showAnswer(x)}. So the answer is ${showAnswer(x)} ${x === 1 ? k.unit : `${k.unit}s`}.`] }
  }),
]

// ── t4 & t5 · Two-way tables ─────────────────────────────────────────────────────────────────────────────────────
interface Two { people: string; rows: [string, string, string][]; cols: [string, string][] }
// rows: [label, noun ("grade 7 students"), "are …" phrase]; cols: [label, verb ("like pizza")]
const TWOS: Two[] = [
  { people: 'students', rows: [['Grade 7', 'grade 7 students', 'in grade 7'], ['Grade 8', 'grade 8 students', 'in grade 8']], cols: [['Likes pizza', 'like pizza'], ['Does not', 'do not like pizza']] },
  { people: 'students', rows: [['Boys', 'boys', 'boys'], ['Girls', 'girls', 'girls']], cols: [['Plays a sport', 'play a sport'], ['Does not', 'do not play a sport']] },
  { people: 'kids', rows: [['Age 11', '11-year-olds', '11-year-olds'], ['Age 12', '12-year-olds', '12-year-olds']], cols: [['Swim', 'picked swimming'], ['Hike', 'picked hiking']] },
  { people: 'students', rows: [['Grade 6', 'grade 6 students', 'in grade 6'], ['Grade 7', 'grade 7 students', 'in grade 7']], cols: [['Walks', 'walk to school'], ['Rides', 'ride to school']] },
  { people: 'customers', rows: [['Adults', 'adults', 'adults'], ['Teens', 'teens', 'teens']], cols: [['Tea', 'ordered tea'], ['Coffee', 'ordered coffee']] },
]
/** cells[i][j], row totals R, column totals Cn, grand total G. */
const tally = (cells: number[][]) => {
  const R = cells.map(row => sum(row)), Cn = [0, 1].map(j => cells[0][j] + cells[1][j])
  return { R, Cn, G: sum(R) }
}
/** The table, every value shown unless `hide(i, j)` (i = 2 is the Total row, j = 2 the Total column). */
const tableOf = (t: Two, cells: number[][], hide: (i: number, j: number) => boolean = () => false): Picture => {
  const { R, Cn, G } = tally(cells)
  const grid = [[...cells[0], R[0]], [...cells[1], R[1]], [...Cn, G]]
  return { kind: 'table', head: ['', t.cols[0][0], t.cols[1][0], 'Total'], rowHead: true,
    rows: grid.map((row, i) => [i < 2 ? t.rows[i][0] : 'Total', ...row.map((v, j) => (hide(i, j) ? '?' : fmt(v)))]) }
}
const cellsOf = (r: Rng, lo = 3, hi = 25) => [[int(r, lo, hi), int(r, lo, hi)], [int(r, lo, hi), int(r, lo, hi)]]
const distinct = (xs: number[]) => new Set(xs).size === xs.length

const T4: Level[] = [
  lv('one missing box: use its row total', r => {
    const t = pick(r, TWOS), cells = cellsOf(r), i = int(r, 0, 1), j = int(r, 0, 1), { R } = tally(cells), o = cells[i][1 - j]
    return { text: `How many ${t.rows[i][1]} ${t.cols[j][1]}?`, picture: tableOf(t, cells, (a, b) => a === i && b === j), answer: cells[i][j],
      steps: [`The ${t.rows[i][0]} row adds up to ${fmt(R[i])}.`, `${fmt(o)} of them ${t.cols[1 - j][1]}, so ${fmt(R[i])} − ${fmt(o)} = ${fmt(cells[i][j])}.`, `So ${fmt(cells[i][j])} ${t.rows[i][1]} ${t.cols[j][1]}.`] }
  }),
  lv('pick the statement the table shows', r => {
    for (;;) {
      const t = pick(r, TWOS), cells = cellsOf(r), i = int(r, 0, 1), j = int(r, 0, 1)
      const v = cells[i][j], sideways = cells[i][1 - j], down = cells[1 - i][j]
      if (!distinct([v, sideways, down])) continue
      const say = (n: number) => `${fmt(n)} of the ${t.rows[i][1]} ${t.cols[j][1]}`
      const right = say(v)
      return { text: 'Which statement does the table show?', picture: tableOf(t, cells), answer: choose(r, right, [say(sideways), say(down)]),
        steps: [`Find the ${t.rows[i][0]} row and the ${t.cols[j][0]} column.`, `The box where they meet says ${fmt(v)}.`, `So the true one is: ${right}.`] }
    }
  }),
  lv('is the classmate’s grand total right (boxes left out, or counted twice as well)', r => {
    // Two numbers from this table can never count a box twice WITHOUT leaving one out (a total covers two boxes, and
    // four boxes need four places), so the slips are: nothing wrong, only left some out, or both at once.
    for (;;) {
      const t = pick(r, TWOS), cells = cellsOf(r), { R, Cn, G } = tally(cells), who = pick(r, NAMES)
      if (!distinct([...cells.flat(), ...R, ...Cn])) continue
      const i = int(r, 0, 1), j = int(r, 0, 1)
      const way = pick(r, ['rows', 'cols', 'out', 'out', 'both', 'both'] as const)
      const pairs: Record<typeof way, [number, number, string][]> = {
        rows: [[R[0], R[1], `${fmt(R[0])} and ${fmt(R[1])} are the two row totals, so every box is counted once.`]],
        cols: [[Cn[0], Cn[1], `${fmt(Cn[0])} and ${fmt(Cn[1])} are the two column totals, so every box is counted once.`]],
        out: [[cells[0][0], cells[1][1], `${fmt(cells[0][0])} and ${fmt(cells[1][1])} are just two of the four boxes. The other two are left out, and no box is counted twice.`],
          [cells[0][1], cells[1][0], `${fmt(cells[0][1])} and ${fmt(cells[1][0])} are just two of the four boxes. The other two are left out, and no box is counted twice.`],
          [R[i], cells[1 - i][j], `${fmt(R[i])} is the ${t.rows[i][0]} row total, and ${fmt(cells[1 - i][j])} is one box of the other row. The box next to it is left out, and no box is counted twice.`]],
        both: [[R[i], Cn[j], `${fmt(R[i])} is a row total and ${fmt(Cn[j])} is a column total. The box where they meet is counted twice, and the box in neither is left out.`],
          [R[i], cells[i][j], `${fmt(R[i])} is the ${t.rows[i][0]} row total, and ${fmt(cells[i][j])} is a box inside that row, so it is counted twice. The other row is left out.`]],
      }
      const [x, y, why] = pick(r, pairs[way])
      const yes = `Yes, ${who} is right`, out = `No, ${who} only left some ${t.people} out`, both = `No, ${who} counted some ${t.people} twice and left some out`
      const right = way === 'out' ? out : way === 'both' ? both : yes
      return { text: `${who} adds ${fmt(x)} and ${fmt(y)} from this table and says ${fmt(x + y)} ${t.people} were asked in all. Is ${who} right?`,
        picture: tableOf(t, cells, (a, b) => a === 2 && b === 2), answer: choose(r, right, [yes, out, both].filter(z => z !== right)),
        steps: [why, `The real total is ${fmt(R[0])} + ${fmt(R[1])} = ${fmt(G)}.`, `${right}.`] }
    }
  }),
  lv('two steps across the table from its totals', r => {
    const t = pick(r, TWOS), cells = cellsOf(r), { R, Cn } = tally(cells), i = int(r, 0, 1), j = int(r, 0, 1), oi = 1 - i, oj = 1 - j
    const mid = cells[oi][j], ans = cells[oi][oj]
    return { text: `How many ${t.rows[oi][1]} ${t.cols[oj][1]}?`, picture: tableOf(t, cells, (a, b) => a < 2 && b < 2 && !(a === i && b === j)), answer: ans,
      steps: [`First the ${t.cols[j][0]} column: ${fmt(Cn[j])} − ${fmt(cells[i][j])} = ${fmt(mid)}. So ${fmt(mid)} ${t.rows[oi][1]} ${t.cols[j][1]}.`,
        `Then the ${t.rows[oi][0]} row: ${fmt(R[oi])} − ${fmt(mid)} = ${fmt(ans)}.`, `So ${fmt(ans)} ${t.rows[oi][1]} ${t.cols[oj][1]}.`] }
  }),
  lv('story: build the table from four facts', r => {
    const t = pick(r, TWOS), cells = cellsOf(r), { R, Cn, G } = tally(cells), i = int(r, 0, 1), j = int(r, 0, 1), oi = 1 - i, oj = 1 - j
    const mid = cells[oi][j], ans = cells[oi][oj]
    return { text: `A survey asked ${fmt(G)} ${t.people}. ${fmt(R[i])} of them are ${t.rows[i][1]}, and ${fmt(Cn[j])} of them ${t.cols[j][1]}. ${fmt(cells[i][j])} of the ${t.rows[i][1]} ${t.cols[j][1]}. How many ${t.rows[oi][1]} ${t.cols[oj][1]}?`,
      picture: tableOf(t, cells, () => true), answer: ans,
      steps: [`${fmt(G)} − ${fmt(R[i])} = ${fmt(R[oi])}, so there are ${fmt(R[oi])} ${t.rows[oi][1]}.`, `${fmt(Cn[j])} − ${fmt(cells[i][j])} = ${fmt(mid)} ${t.rows[oi][1]} ${t.cols[j][1]}.`, `${fmt(R[oi])} − ${fmt(mid)} = ${fmt(ans)}. So ${fmt(ans)} ${t.rows[oi][1]} ${t.cols[oj][1]}.`] }
  }),
]

/** Two rows whose totals come from `totals`. */
const rowsWith = (r: Rng, totals: number[]) => [0, 1].map(() => { const n = pick(r, totals), a = int(r, 2, n - 2); return [a, n - a] })
const pct = (a: number, n: number) => Math.round((a * 100 / n) * 1e6) / 1e6

const T5: Level[] = [
  lv('percent of one row', r => {
    const t = pick(r, TWOS), cells = rowsWith(r, [10, 20, 25, 50]), i = int(r, 0, 1), j = int(r, 0, 1), { R } = tally(cells), a = cells[i][j], p = pct(a, R[i])
    return { text: `What percent of ${t.rows[i][1]} ${t.cols[j][1]}? Type the number without the % sign.`, picture: tableOf(t, cells), answer: p,
      steps: [`Of ${t.rows[i][1]} means out of the ${t.rows[i][0]} row total, ${fmt(R[i])}.`, `${fmt(a)} ÷ ${fmt(R[i])} = ${fmt(a / R[i])}.`, `${fmt(a / R[i])} is ${showAnswer(p)}%. So ${showAnswer(p)}% of ${t.rows[i][1]} ${t.cols[j][1]}.`] }
  }),
  lv('out of whom? a fraction of one column', r => {
    const t = pick(r, TWOS), cells = cellsOf(r, 2, 20), i = int(r, 0, 1), j = int(r, 0, 1), { Cn } = tally(cells), a = cells[i][j], g = gcd(a, Cn[j])
    const f: [number, number] = [a / g, Cn[j] / g]
    return { text: `Of the ${t.people} who ${t.cols[j][1]}, what fraction are ${t.rows[i][2]}? Write it as a fraction.`, picture: tableOf(t, cells), answer: { frac: f },
      steps: [`Out of whom? Out of the ${t.people} who ${t.cols[j][1]}: the ${t.cols[j][0]} column total, ${fmt(Cn[j])}.`, `${fmt(a)} of them are ${t.rows[i][2]}.`, g > 1 ? `${fmt(a)}/${fmt(Cn[j])} = ${f[0]}/${f[1]}. So the fraction is ${f[0]}/${f[1]}.` : `So the fraction is ${f[0]}/${f[1]}.`] }
  }),
  lv('is the classmate right (divided by the wrong total)', r => {
    for (;;) {
      const t = pick(r, TWOS), cells = rowsWith(r, [10, 20, 25, 40, 50]), i = int(r, 0, 1), j = int(r, 0, 1), { R, Cn, G } = tally(cells), a = cells[i][j], who = pick(r, NAMES)
      if (!distinct([R[i], Cn[j], G])) continue
      const way = pick(r, ['row', 'grand', 'col'] as const), den = way === 'row' ? R[i] : way === 'grand' ? G : Cn[j]
      if (!Number.isInteger((a * 1000) / den)) continue
      const yes = `Yes, ${who} is right`, grand = `No, ${who} divided by all ${fmt(G)} ${t.people}`, col = `No, ${who} divided by the ${fmt(Cn[j])} who ${t.cols[j][1]}`
      const right = way === 'row' ? yes : way === 'grand' ? grand : col
      return { text: `${who} says ${fmt(pct(a, den))}% of ${t.rows[i][1]} ${t.cols[j][1]}. Is ${who} right?`, picture: tableOf(t, cells),
        answer: choose(r, right, [yes, grand, col].filter(z => z !== right)),
        steps: [`Of ${t.rows[i][1]} means out of the ${t.rows[i][0]} row total, ${fmt(R[i])}: ${fmt(a)} ÷ ${fmt(R[i])} = ${fmt(pct(a, R[i]))}%.`, `${fmt(pct(a, den))}% is ${fmt(a)} ÷ ${fmt(den)}.`, `${right}.`] }
    }
  }),
  lv('work backwards: from a percent to the count, then the rest of the row', r => {
    for (;;) {
      const t = pick(r, TWOS), cells = rowsWith(r, [20, 25, 40, 50]), i = int(r, 0, 1), j = int(r, 0, 1), { R } = tally(cells), a = cells[i][j], p = pct(a, R[i])
      if (!Number.isInteger(p)) continue
      const ans = R[i] - a
      return { text: `${fmt(p)}% of the ${t.rows[i][1]} ${t.cols[j][1]}. How many ${t.rows[i][1]} ${t.cols[1 - j][1]}?`,
        picture: tableOf(t, cells, (x, y) => (x === i && y < 2) || x === 2), answer: ans,
        steps: [`There are ${fmt(R[i])} ${t.rows[i][1]}. ${fmt(p)}% of ${fmt(R[i])} is ${fmt(p / 100)} × ${fmt(R[i])} = ${fmt(a)}.`, `So ${fmt(a)} of them ${t.cols[j][1]}, and the rest do not.`, `${fmt(R[i])} − ${fmt(a)} = ${fmt(ans)}. So ${fmt(ans)} ${t.rows[i][1]} ${t.cols[1 - j][1]}.`] }
    }
  }),
  lv('compare two groups of different sizes', r => {
    for (;;) {
      const t = pick(r, TWOS), j = int(r, 0, 1)
      const same = r() < 0.2
      const cells = rowsWith(r, [10, 20, 25, 40, 50])
      if (cells[0][0] + cells[0][1] === cells[1][0] + cells[1][1]) continue
      const { R } = tally(cells)
      if (same) { const s = pick(r, [0.2, 0.3, 0.4, 0.6, 0.7, 0.8]); const k0 = Math.round(s * R[0]), k1 = Math.round(s * R[1]); if (k0 / R[0] !== s || k1 / R[1] !== s) continue; cells[0] = j === 0 ? [k0, R[0] - k0] : [R[0] - k0, k0]; cells[1] = j === 0 ? [k1, R[1] - k1] : [R[1] - k1, k1] }
      const p = [0, 1].map(i => pct(cells[i][j], R[i]))
      const trap = (cells[0][j] > cells[1][j]) !== (p[0] > p[1]), wantTrap = r() < 0.5
      if (!same && (p[0] === p[1] || trap !== wantTrap)) continue
      const names = [0, 1].map(i => `The ${t.rows[i][1]}`), tie = 'They have the same share'
      const right = p[0] === p[1] ? tie : p[0] > p[1] ? names[0] : names[1]
      return { text: `Which group has a bigger share of ${t.people} who ${t.cols[j][1]}?`, picture: tableOf(t, cells),
        answer: choose(r, right, [...names, tie].filter(z => z !== right)),
        steps: [`${t.rows[0][0]}: ${fmt(cells[0][j])} ÷ ${fmt(R[0])} = ${fmt(p[0])}%.`, `${t.rows[1][0]}: ${fmt(cells[1][j])} ÷ ${fmt(R[1])} = ${fmt(p[1])}%.`,
          p[0] === p[1] ? `Both are ${fmt(p[0])}%. So the answer is: ${right}.` : `${fmt(Math.max(...p))}% is more than ${fmt(Math.min(...p))}%. So the answer is: ${right}.`] }
    }
  }),
]

export const G8M6_LADDERS: Record<string, Level[]> = {
  'g8m6-t1': T1,
  'g8m6-t2': T2,
  'g8m6-t3': T3,
  'g8m6-t4': T4,
  'g8m6-t5': T5,
}
