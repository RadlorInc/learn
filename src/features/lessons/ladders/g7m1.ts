/**
 * Grade 7 · Module 1 — Proportional relationships and percent applications. Practice ladders, easiest style first
 * (see ../adaptive.ts and the reference ladders in ./g5m1.ts and ./g6m4.ts). A percent is typed as a number without the
 * % sign, and every question that wants one says so. Money is worked in whole CENTS and only turned into dollars at the
 * end, so no answer carries float noise. Fraction answers are always reduced and never whole (a whole would print "2/1").
 */
import type { Picture, Problem } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const TYPE_PCT = 'Type the number without the % sign.'
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
/** n/d reduced, as [n, d]. */
const red = (n: number, d: number): [number, number] => { const g = gcd(Math.abs(n), Math.abs(d)); return [n / g, d / g] }
/** n/d reduced, written: "3/2", or "3" when it is whole. */
const ft = (n: number, d: number) => { const [a, b] = red(n, d); return b === 1 ? String(a) : `${a}/${b}` }
const clean = (x: number) => Math.round(x * 1e6) / 1e6
const choose = (r: Rng, right: string, wrong: string[]) => { const choices = shuffle(r, [right, ...wrong]); return { choices, correct: choices.indexOf(right) } }
/** Whole cents as dollars: 250 → "$2.50", 3000 → "$30". */
const usd = (c: number) => { const d = Math.floor(c / 100), m = c % 100; return m ? `$${fmt(d)}.${String(m).padStart(2, '0')}` : `$${fmt(d)}` }
const dollars = (c: number) => clean(c / 100)
const row = (head: string, xs: (number | string)[], label: string, ys: (number | string)[]): Picture =>
  ({ kind: 'table', head: [head, ...xs.map(x => (typeof x === 'number' ? fmt(x) : x))], rowHead: true, rows: [[label, ...ys.map(y => (typeof y === 'number' ? fmt(y) : y))]] })
/** k distinct whole numbers from lo to hi, smallest first. */
const distinct = (r: Rng, k: number, lo: number, hi: number) => {
  const s = new Set<number>()
  while (s.size < k) s.add(int(r, lo, hi))
  return [...s].sort((a, b) => a - b)
}

/** Every number a picture's labels print (a list of strings is also read joined up, the way a table row reads). */
const shown = (pic: Picture) => {
  const texts: string[] = []
  const walk = (v: unknown) => {
    if (typeof v === 'string') texts.push(v)
    else if (Array.isArray(v)) { if (v.length && v.every(x => typeof x === 'string')) texts.push(v.join('')); v.forEach(walk) }
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  walk(pic)
  return { texts, nums: new Set(texts.flatMap(t => t.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map(t => t.replace(/,/g, ''))) }
}
/** A level whose numbers are re-picked whenever the picture would print the answer. */
const lv = (style: string, build: (r: Rng) => Problem): Level => ({
  style, make: r => {
    let p = build(r)
    for (let i = 0; i < 200; i++) {
      const a = p.answer, s = shown(p.picture)
      const bad = typeof a === 'number' ? Math.abs(a) >= 10 && s.nums.has(String(Math.abs(a)))
        : a && typeof a === 'object' && 'choices' in a ? s.texts.some(t => t.includes(a.choices[a.correct])) : false
      if (!bad) return p
      p = build(r)
    }
    return p
  },
})

// ── t1 · Proportional or not? ───────────────────────────────────────────────────────────────────────────────
const TABLES = [['Hours', 'Pay ($)'], ['Tickets', 'Cost ($)'], ['Hours', 'Miles'], ['Pounds', 'Cost ($)']] as const
/** Three x values that are NOT evenly spaced, so "goes up by the same amount" cannot be what makes it proportional. */
const uneven = (r: Rng) => { for (;;) { const xs = distinct(r, 3, 1, 9); if (xs[1] - xs[0] !== xs[2] - xs[1]) return xs } }
const T1: Level[] = [
  lv('table: proportional or not (check every y ÷ x)', r => {
    const [hx, hy] = pick(r, TABLES)
    const text = 'Divide each bottom number by the top number above it. Which one is true about this table?'
    if (r() < 0.5) {
      const k = int(r, 2, 12), xs = uneven(r), ys = xs.map(x => k * x), right = `Proportional: every y ÷ x is ${k}`
      return { text, picture: row(hx, xs, hy, ys), answer: choose(r, right, [`Proportional: every y ÷ x is ${k + 1}`, 'Not proportional: y ÷ x changes']),
        steps: [`${ys[0]} ÷ ${xs[0]} = ${k}, ${ys[1]} ÷ ${xs[1]} = ${k} and ${ys[2]} ÷ ${xs[2]} = ${k}.`, `Every one is ${k}. So the true one is: ${right}.`] }
    }
    const m = int(r, 2, 9), b = 2 * int(r, 1, 4), ys = [1, 2, 3].map(x => m * x + b), right = 'Not proportional: y ÷ x changes'
    return { text, picture: row(hx, [1, 2, 3], hy, ys), answer: choose(r, right, [`Proportional: every y ÷ x is ${m + b}`, `Proportional: every y ÷ x is ${m}`]),
      steps: [`${ys[0]} ÷ 1 = ${ys[0]}, but ${ys[1]} ÷ 2 = ${fmt(ys[1] / 2)}.`, `Those two are already different, so there is no steady rate. The true one is: ${right}.`] }
  }),
  lv('bare pairs: find the pair that breaks the rate', r => {
    const k = int(r, 3, 9), xs = distinct(r, 4, 1, 10), bad = int(r, 0, 3), d = pick(r, [-2, -1, 1, 2])
    const ys = xs.map((x, i) => k * x + (i === bad ? d : 0))
    const pairs = xs.map((x, i) => `(${x}, ${ys[i]})`), right = pairs[bad]
    const good = xs.map((x, i) => i).filter(i => i !== bad)
    const choices = shuffle(r, pairs)
    return { text: 'Three of these pairs (x, y) come from the same proportional table. One pair does not. Which pair breaks the steady rate?',
      picture: eq('y ÷ x = the same number?'), answer: { choices, correct: choices.indexOf(right) },
      steps: [`For three pairs, y ÷ x is ${k}: ${good.map(i => `${ys[i]} ÷ ${xs[i]} = ${k}`).join(', ')}.`,
        `The last one: ${xs[bad]} × ${k} = ${k * xs[bad]}, not ${ys[bad]}. So the pair that breaks it is ${right}.`] }
  }),
  lv('spot the mistake: the same step up is not proportional', r => {
    const [hx, hy] = pick(r, TABLES), name = pick(r, ['Kai', 'Rosa', 'Eli', 'Nina'])
    const m = int(r, 2, 9), b = int(r, 1, 9), ys = [1, 2, 3].map(x => m * x + b)
    const right = `No: ${ys[0]} ÷ 1 = ${ys[0]}, but ${ys[1]} ÷ 2 = ${fmt(ys[1] / 2)}`
    return { text: `${name} says this table is proportional because the bottom row goes up by the same amount each time. Is ${name} right?`,
      picture: row(hx, [1, 2, 3], hy, ys), answer: choose(r, right, [`Yes: it goes up by ${m} each time`, `Yes: every y ÷ x is ${m}`]),
      steps: [`Going up by the same amount is not the test. Divide each bottom number by the top number.`, `${ys[0]} ÷ 1 = ${ys[0]} and ${ys[1]} ÷ 2 = ${fmt(ys[1] / 2)}, which are different. So the answer is: ${right}.`] }
  }),
  lv('work backwards: fill the missing number so the table is proportional', r => {
    const [hx, hy] = pick(r, TABLES)
    const k = pick(r, [1.5, 2.5, 3.5, 2, 3, 4, 5, 6, 7, 8, 12])
    let xs = distinct(r, 3, 1, 6)
    if (k % 1) xs = xs.map(x => 2 * x)
    const j = int(r, 1, 2), full = j === 1 ? 2 : 1, ys = xs.map(x => k * x), ans = ys[j]
    return { text: 'This table is proportional. What number goes where the ? is?', picture: row(hx, xs, hy, ys.map((y, i) => (i === j ? '?' : y))), answer: ans,
      steps: [`Use a full column: ${fmt(ys[full])} ÷ ${xs[full]} = ${fmt(k)}.`, `Every y is ${fmt(k)} times its x: ${xs[j]} × ${fmt(k)} = ${fmt(ans)}.`, `So the missing number is ${fmt(ans)}.`] }
  }),
  lv('compare two plans: which cost is proportional', r => {
    const xs = [1, 2, 4], thing = pick(r, [['phone plans', 'Plan'], ['gyms', 'Gym'], ['storage units', 'Unit']] as const)
    const plan = (prop: boolean) => {
      const m = int(r, 3, 15)
      return prop ? { prop, m, b: 0, ys: xs.map(x => m * x) } : { prop, m, b: int(r, 2, 12), ys: [] as number[] }
    }
    const A = plan(r() < 0.5), B = plan(r() < 0.5)
    for (const p of [A, B]) if (!p.prop) p.ys = xs.map(x => p.m * x + p.b)
    if (A.prop && B.prop && A.m === B.m) B.ys = xs.map(x => (B.m + 1) * x)
    const [a, b] = [`${thing[1]} A`, `${thing[1]} B`]
    const right = A.prop && B.prop ? 'Both' : A.prop ? `Only ${a}` : B.prop ? `Only ${b}` : 'Neither'
    const choices = [`Only ${a}`, `Only ${b}`, 'Both', 'Neither']
    const say = (n: string, p: typeof A) => `${n}: ${p.ys.map((y, i) => `${y} ÷ ${xs[i]} = ${fmt(y / xs[i])}`).join(', ')}${p.prop ? ' — the same every time.' : ' — it changes.'}`
    return { text: `The table shows what two ${thing[0]} cost in all. Which one has a cost proportional to the months?`,
      picture: { kind: 'table', head: ['Months', ...xs.map(String)], rowHead: true, rows: [[`${a} ($)`, ...A.ys.map(String)], [`${b} ($)`, ...B.ys.map(String)]] },
      answer: { choices, correct: choices.indexOf(right) },
      steps: [say(a, A), say(b, B), `So the answer is: ${right}.`] }
  }),
]

// ── t2 · The constant of proportionality ────────────────────────────────────────────────────────────────────
/** k and three x values that make every y whole. */
const kTable = (r: Rng, ks: readonly number[]) => {
  const k = pick(r, ks)
  const base = [1, 2, 4, 5, 10].find(b => Number.isInteger(k * b))!
  const xs = distinct(r, 3, 1, 6).map(x => x * base)
  return { k, xs, ys: xs.map(x => clean(k * x)) }
}
const T2: Level[] = [
  lv('table: divide y by x to find k', r => {
    const { k, xs, ys } = kTable(r, [0.5, 1.5, 2.5, 3.5, 4.5, 2, 3, 4, 5, 6, 7, 8, 9])
    return { text: 'This table is proportional. What is k in y = kx?', picture: row('x', xs, 'y', ys), answer: k,
      steps: [`Divide each y by its x: ${xs.map((x, i) => `${fmt(ys[i])} ÷ ${x} = ${fmt(k)}`).join(', ')}.`, `It is the same number every time, so k = ${fmt(k)}.`] }
  }),
  lv('one pair in words: the amount for each one unit', r => {
    const [what, xu, yu] = pick(r, [['A printer prints', 'minutes', 'pages'], ['A car goes', 'gallons', 'miles'], ['A faucet pours', 'minutes', 'liters'], ['A baker uses', 'cakes', 'cups of flour']] as const)
    const k = pick(r, [2, 3, 4, 6, 8, 12, 15, 1.5, 2.5, 3.5]), x = 2 * int(r, 2, 6), y = k * x
    const text = what === 'A baker uses' ? `${what} ${fmt(y)} ${yu} for ${x} ${xu}.` : `${what} ${fmt(y)} ${yu} in ${x} ${xu}.`
    return { text: `${text} The rate stays steady. In y = kx, x is the ${xu} and y is the ${yu}. What is k?`, picture: eq('y = kx', [`x = ${x} ${xu}`, `y = ${fmt(y)} ${yu}`]), answer: k,
      steps: [`k is y ÷ x, so keep the ${yu} on top.`, `${fmt(y)} ÷ ${x} = ${fmt(k)}. So k = ${fmt(k)}.`] }
  }),
  lv('pick the equation (y ÷ x, not x ÷ y)', r => {
    const { k, xs, ys } = kTable(r, [2, 4, 5, 2.5, 1.25, 0.5, 0.25, 0.2, 0.4, 0.8])
    const inv = clean(1 / k), d = ys[0] - xs[0], right = `y = ${fmt(k)}x`
    return { text: 'This table is proportional. Which equation matches it?', picture: row('x', xs, 'y', ys),
      answer: choose(r, right, [`y = ${fmt(inv)}x`, d > 0 ? `y = x + ${fmt(d)}` : `y = x − ${fmt(-d)}`]),
      steps: [`Keep y on top: ${fmt(ys[0])} ÷ ${xs[0]} = ${fmt(k)}. (${xs[0]} ÷ ${fmt(ys[0])} = ${fmt(inv)} is x for each y, the wrong way round.)`,
        `Check another column: ${xs[1]} × ${fmt(k)} = ${fmt(ys[1])}.`, `So the equation is ${right}.`] }
  }),
  lv('use k for an x far past the table', r => {
    const { k, xs, ys } = kTable(r, [1.5, 2.5, 3.5, 2, 3, 4, 5, 6])
    const X = 10 * int(r, 2, 12), ans = clean(k * X)
    return { text: `A hose fills a pool at a steady rate. How many gallons are in the pool after ${X} minutes?`,
      picture: row('Minutes (x)', [...xs, X], 'Gallons (y)', [...ys, '?']), answer: ans,
      steps: [`Find k from the table: ${fmt(ys[0])} ÷ ${xs[0]} = ${fmt(k)}, so y = ${fmt(k)}x.`, `Put in x = ${X}: ${fmt(k)} × ${X} = ${fmt(ans)}.`, `So there are ${fmt(ans)} gallons after ${X} minutes.`] }
  }),
  lv('compare two rates: how much more for each unit', r => {
    for (;;) {
      const A = kTable(r, [1.5, 2.5, 3.5, 4.5, 2, 3, 4, 5, 6]), kB = pick(r, [1.5, 2.5, 3.5, 4.5, 2, 3, 4, 5, 6])
      if (kB === A.k) continue
      const xB = 2 * int(r, 2, 8), yB = kB * xB, diff = clean(Math.abs(A.k - kB)), fast = A.k > kB ? 'Hose A' : 'Hose B'
      return { text: `Hose A fills a tank at the steady rate in the table. Hose B pours ${fmt(yB)} gallons in ${xB} minutes. How many more gallons each minute does the faster hose pour?`,
        picture: row('Minutes', A.xs, 'Hose A (gallons)', A.ys), answer: diff,
        steps: [`Hose A: ${fmt(A.ys[0])} ÷ ${A.xs[0]} = ${fmt(A.k)} gallons each minute. Hose B: ${fmt(yB)} ÷ ${xB} = ${fmt(kB)} gallons each minute.`,
          `${fast} is faster: ${fmt(Math.max(A.k, kB))} − ${fmt(Math.min(A.k, kB))} = ${fmt(diff)}.`, `So the faster hose pours ${fmt(diff)} more gallons each minute.`] }
    }
  }),
]

// ── t3 · Proportional graphs ────────────────────────────────────────────────────────────────────────────────
const through = (x: number, y: number, max = 10, step?: number, label = true): Picture =>
  ({ kind: 'coord', min: 0, max, ...(step ? { step } : {}), points: [{ x, y, ...(label ? { label: `(${fmt(x)}, ${fmt(y)})` } : {}) }], lines: [{ a: [0, 0], b: [x, y], extend: true }] })
const T3: Level[] = [
  lv('graph: read y at x = 1', r => {
    const k = int(r, 2, 5), a = int(r, 2, Math.floor(10 / k))
    return { text: 'This graph is proportional. It goes through (0, 0) and the point shown. What is y when x = 1?', picture: through(a, k * a), answer: k,
      steps: ['A proportional line goes through (0, 0), so y ÷ x is the same all along it.', `At the point shown, ${k * a} ÷ ${a} = ${k}. So when x = 1, y = ${k}.`] }
  }),
  lv('one point in words: k as a fraction', r => {
    for (;;) {
      const a = int(r, 2, 9), b = int(r, 1, 9)
      if (b % a === 0) continue
      const [n, d] = red(b, a)
      return { text: `A proportional graph is a straight line through (0, 0) and (${a}, ${b}). What is k in y = kx? A fraction is fine.`, picture: eq('y = kx', ['k = y ÷ x']), answer: { frac: [n, d] },
        steps: ['On a proportional graph, k is y ÷ x at any point on the line.', `${b} ÷ ${a} = ${b}/${a}${gcd(a, b) > 1 ? ` = ${n}/${d}` : ''}.`, `So k = ${n}/${d}.`] }
    }
  }),
  lv('pick the true statement about a straight line', r => {
    const text = 'Which one is true about this graph?', no = 'Not proportional: it does not go through (0, 0)'
    if (r() < 0.5) {
      const k = int(r, 2, 4), a = int(r, 2, Math.floor(10 / k)), right = `Proportional: y = ${k}x`
      return { text, picture: through(a, k * a), answer: choose(r, right, [no, `Proportional: y = ${k * a}x`]),
        steps: ['The line is straight and goes through (0, 0), so it is proportional.', `k = ${k * a} ÷ ${a} = ${k}. So the true one is: ${right}.`] }
    }
    const b = int(r, 1, 4), m = int(r, 1, 2), a = int(r, 2, Math.floor((10 - b) / m))
    return { text, picture: { kind: 'coord', min: 0, max: 10, points: [{ x: 0, y: b, label: `(0, ${b})` }, { x: a, y: b + m * a, label: `(${a}, ${b + m * a})` }], lines: [{ a: [0, b], b: [a, b + m * a], extend: true }] },
      answer: choose(r, no, [`Proportional: y = ${m}x`, `Proportional: y = ${m + b}x`]),
      steps: [`The line is straight, but it crosses the side at (0, ${b}), not at (0, 0).`, `That head start keeps y ÷ x changing. So the true one is: ${no}.`] }
  }),
  lv('work backwards: y at another x on the line', r => {
    for (;;) {
      const k = pick(r, [0.5, 1.5, 2, 2.5, 3]), a = 2 * int(r, 1, Math.floor(10 / k)), c = 2 * int(r, 1, 10)
      if (c === a || a > 20 || k * a > 20 || k * c > 20) continue
      return { text: `This graph is proportional. It goes through the point shown. What is y when x = ${c}?`, picture: through(a, k * a, 20, 2), answer: clean(k * c),
        steps: [`k = y ÷ x at the point: ${fmt(k * a)} ÷ ${a} = ${fmt(k)}.`, `So y = ${fmt(k)}x. When x = ${c}, y = ${fmt(k)} × ${c} = ${fmt(k * c)}.`, `So y is ${fmt(k * c)}.`] }
    }
  }),
  lv('two lines in a story: how much more each hour', r => {
    for (;;) {
      const [kA, kB] = [pick(r, [1.5, 2, 2.5, 3, 4, 5]), pick(r, [1.5, 2, 2.5, 3, 4, 5])]
      if (kA === kB) continue
      const aA = 2 * int(r, 1, Math.floor(10 / kA)), aB = 2 * int(r, 1, Math.floor(10 / kB))
      if (aA === aB) continue
      const [na, nb] = pick(r, [['Mia', 'Leo'], ['Ava', 'Sam'], ['Zoe', 'Ben']] as const)
      const diff = clean(Math.abs(kA - kB)), fast = kA > kB ? na : nb
      return { text: `${na} and ${nb} each earn money at a steady rate. On the graph, x is hours and y is dollars. Line A is ${na} and line B is ${nb}. How many more dollars an hour does the one who earns faster make?`,
        picture: { kind: 'coord', min: 0, max: 20, step: 2,
          points: [{ x: aA, y: kA * aA, label: `A (${aA}, ${fmt(kA * aA)})` }, { x: aB, y: kB * aB, label: `B (${aB}, ${fmt(kB * aB)})` }],
          lines: [{ a: [0, 0], b: [aA, kA * aA], extend: true }, { a: [0, 0], b: [aB, kB * aB], extend: true, tone: 2 }] },
        answer: diff,
        steps: [`${na}: ${fmt(kA * aA)} ÷ ${aA} = ${fmt(kA)} dollars an hour. ${nb}: ${fmt(kB * aB)} ÷ ${aB} = ${fmt(kB)} dollars an hour.`,
          `${fast} earns faster: ${fmt(Math.max(kA, kB))} − ${fmt(Math.min(kA, kB))} = ${fmt(diff)}.`, `So ${fast} makes ${usd(Math.round(diff * 100))} more an hour.`] }
    }
  }),
]

// ── t4 · Unit rates with fractions ──────────────────────────────────────────────────────────────────────────
/** A proper fraction in lowest terms with bottom from lo to hi. */
const proper = (r: Rng, lo = 2, hi = 8): [number, number] => {
  for (;;) { const d = int(r, lo, hi), n = int(r, 1, d - 1); if (gcd(n, d) === 1) return [n, d] }
}
const f = ([n, d]: [number, number]) => `${n}/${d}`
/** a/b ÷ c/d, reduced. */
const divide = ([a, b]: [number, number], [c, d]: [number, number]) => red(a * d, b * c)
const T4: Level[] = [
  lv('tape: count the pieces that fill one hour', r => {
    for (;;) {
      const n = int(r, 2, 6), [p, q] = proper(r, 2, 6), rate = (n * p) / q
      if (!Number.isInteger(rate) || rate < 2) continue
      return { text: `You walk ${p}/${q} mile in 1/${n} hour. At that pace, how many miles do you walk in one hour?`,
        picture: { kind: 'tape', rows: [
          { label: 'Time', cells: Array.from({ length: n }, (_, i) => ({ w: 1, text: `1/${n} h`, shade: i === 0 })), brace: '1 hour' },
          { label: 'Miles', cells: Array.from({ length: n }, (_, i) => (i === 0 ? { w: 1, text: `${p}/${q}`, shade: true } : { w: 1 })), brace: '?' },
        ] },
        answer: rate,
        steps: [`One hour is ${n} pieces of 1/${n} hour.`, `Each piece adds ${p}/${q} mile: ${n} × ${p}/${q} = ${n * p}/${q} = ${rate}.`, `So you walk ${rate} miles in one hour.`] }
    }
  }),
  lv('bare fractions: amount ÷ time', r => {
    for (;;) {
      const amt = proper(r), time = proper(r), [n, d] = divide(amt, time)
      if (d === 1 || time[0] === 1) continue
      return { text: `A snail crawls ${f(amt)} meter in ${f(time)} minute. How many meters does it crawl in one minute? A fraction is fine.`,
        picture: eq(`${f(amt)} ÷ ${f(time)} = ?`), answer: { frac: [n, d] },
        steps: [`Divide the distance by the time: ${f(amt)} ÷ ${f(time)}.`, `Dividing by ${f(time)} is the same as multiplying by ${time[1]}/${time[0]}: ${f(amt)} × ${time[1]}/${time[0]} = ${amt[0] * time[1]}/${amt[1] * time[0]}.`,
          `So the snail crawls ${n}/${d} ${n > d ? 'meters' : 'meter'} in one minute.`] }
    }
  }),
  lv('pick the right division (miles on top)', r => {
    for (;;) {
      const amt = proper(r), time = proper(r)
      const R = divide(amt, time), W = divide(time, amt), P = red(amt[0] * time[0], amt[1] * time[1])
      const vals = [R, W, P].map(([n, d]) => n / d)
      if (new Set(vals).size < 3) continue
      const name = pick(r, ['Ray', 'Lena', 'Omar', 'Tess'])
      const right = `${f(amt)} ÷ ${f(time)} = ${ft(...R)}`
      return { text: `${name} jogs ${f(amt)} mile in ${f(time)} hour. Which one finds the speed in miles per hour?`, picture: eq(`${f(amt)} mile in ${f(time)} hour`),
        answer: choose(r, right, [`${f(time)} ÷ ${f(amt)} = ${ft(...W)}`, `${f(amt)} × ${f(time)} = ${ft(...P)}`]),
        steps: ['Miles per hour means miles for each one hour, so the miles go on top.', `${f(time)} ÷ ${f(amt)} would be hours for each mile.`, `So the right one is ${right}.`] }
    }
  }),
  lv('work backwards: the time for one whole job', r => {
    for (;;) {
      const part = proper(r, 2, 6), time = proper(r, 2, 6), [n, d] = divide(time, part)
      if (d === 1) continue
      const name = pick(r, ['Sam', 'Ivy', 'Noah', 'June'])
      return { text: `${name} paints ${f(part)} of a fence in ${f(time)} hour. At that pace, how many hours does the whole fence take? A fraction is fine.`,
        picture: { kind: 'tape', rows: [
          { label: 'Fence', cells: [{ w: part[0], text: f(part), shade: true }, { w: part[1] - part[0] }], brace: '1 fence' },
          { label: 'Hours', cells: [{ w: part[0], text: f(time), shade: true }, { w: part[1] - part[0] }], brace: '?' },
        ] },
        answer: { frac: [n, d] },
        steps: [`Hours for one whole fence = the hours ÷ the part of the fence done.`, `${f(time)} ÷ ${f(part)} = ${f(time)} × ${part[1]}/${part[0]} = ${time[0] * part[1]}/${time[1] * part[0]}.`,
          `So the whole fence takes ${n}/${d} ${n > d ? 'hours' : 'hour'}.`] }
    }
  }),
  lv('compare two paces: how much faster', r => {
    for (;;) {
      const aA = proper(r, 2, 6), tA = proper(r, 2, 6), aB = proper(r, 2, 6), tB = proper(r, 2, 6)
      const RA = divide(aA, tA), RB = divide(aB, tB)
      const [n, d] = red(Math.abs(RA[0] * RB[1] - RB[0] * RA[1]), RA[1] * RB[1])
      if (n === 0 || d === 1) continue
      const fast = RA[0] * RB[1] > RB[0] * RA[1] ? 'Ana' : 'Ben', [hi, lo] = fast === 'Ana' ? [RA, RB] : [RB, RA]
      return { text: `Ana walks ${f(aA)} mile in ${f(tA)} hour. Ben walks ${f(aB)} mile in ${f(tB)} hour. How many more miles per hour does the faster walker go? A fraction is fine.`,
        picture: eq(`Ana: ${f(aA)} mile in ${f(tA)} hour`, [`Ben: ${f(aB)} mile in ${f(tB)} hour`]), answer: { frac: [n, d] },
        steps: [`Ana: ${f(aA)} ÷ ${f(tA)} = ${ft(...RA)} miles per hour. Ben: ${f(aB)} ÷ ${f(tB)} = ${ft(...RB)} miles per hour.`,
          `${fast} is faster: ${ft(...hi)} − ${ft(...lo)} = ${n}/${d}.`, `So the faster walker goes ${n}/${d} ${n > d ? 'miles' : 'mile'} per hour more.`] }
    }
  }),
]

// ── t5 · Solve a proportion ─────────────────────────────────────────────────────────────────────────────────
const T5: Level[] = [
  lv('table: find the factor, then do the same', r => {
    const [top, bottom] = pick(r, [['Inches', 'Miles'], ['Notebooks', 'Cost ($)'], ['Cups of flour', 'Cookies'], ['Laps', 'Minutes']] as const)
    const a = int(r, 2, 6), b = int(r, 3, 30), k = int(r, 2, 6), ans = b * k
    return { text: 'The two columns are equal ratios. What number goes where the ? is?',
      picture: { kind: 'table', rows: [[top, String(a), String(a * k)], [bottom, String(b), '?']], rowHead: true }, answer: ans,
      steps: [`Along the top row, ${a} × ${k} = ${a * k}. The factor is ${k}.`, `Do the same to the bottom row: ${b} × ${k} = ${ans}.`, `So the missing number is ${ans}.`] }
  }),
  lv('bare proportion with a factor that is not whole', r => {
    for (;;) {
      const [p, q] = proper(r, 2, 7), u = int(r, 2, 6), v = int(r, 2, 8)
      if (v % u === 0 || u === v) continue
      const a = p * u, b = q * u, d = q * v, ans = p * v
      return { text: `Solve the proportion ${a}/${b} = ?/${d}.`, picture: eq(`${a}/${b} = ?/${d}`), answer: ans,
        steps: [`${b} does not go into ${d} a whole number of times, so simplify first: ${a}/${b} = ${p}/${q}.`, `${q} × ${v} = ${d}, so the top is ${p} × ${v} = ${ans}.`, `So ? = ${ans}.`] }
    }
  }),
  lv('pick the right way: multiply, do not add', r => {
    for (;;) {
      const a = int(r, 2, 5), k = int(r, 2, 5), b = 5 * int(r, 2, 8), c = a * k, add = c - a
      if (add === k || new Set([b * k, b + add, b * add]).size < 3) continue
      const right = `${b} × ${k} = ${b * k} miles`
      return { text: `On a map, ${a} inches stands for ${b} miles. Two towns are ${c} inches apart. Which one finds how far apart they really are?`,
        picture: { kind: 'table', head: ['', 'Scale', 'Towns'], rows: [['Inches', String(a), String(c)], ['Miles', String(b), '?']], rowHead: true },
        answer: choose(r, right, [`${b} + ${add} = ${b + add} miles`, `${b} × ${add} = ${b * add} miles`]),
        steps: [`${a} inches became ${c} inches: ${a} × ${k} = ${c}. That is a factor, not an add.`, `The miles get the same factor. So the right one is ${right}.`] }
    }
  }),
  lv('work backwards: find the first amount through one unit', r => {
    for (;;) {
      const rate = 5 * int(r, 4, 8), g = int(r, 2, 8), G = int(r, 3, 15)
      if (G % g === 0 || G === g) continue
      const m = rate * g, M = rate * G
      return { text: `A car goes ${m} miles on ${g} gallons of gas. How many gallons does it need to go ${M} miles?`,
        picture: { kind: 'table', rows: [['Miles', String(m), String(M)], ['Gallons', String(g), '?']], rowHead: true }, answer: G,
        steps: [`Find one gallon first: ${m} ÷ ${g} = ${rate} miles per gallon.`, `${M} miles needs ${M} ÷ ${rate} gallons.`, `${M} ÷ ${rate} = ${G}, so the car needs ${G} gallons.`] }
    }
  }),
  lv('two stores: how much you save on the cheaper deal', r => {
    for (;;) {
      const pA = int(r, 2, 6), pB = int(r, 2, 6), uA = 25 * int(r, 2, 12), uB = 25 * int(r, 2, 12)
      if (pA === pB || uA === uB) continue
      const l = (pA * pB) / gcd(pA, pB), N = l * int(r, 1, Math.max(1, Math.floor(30 / l)))
      if (N === pA || N === pB) continue
      const thing = pick(r, ['pens', 'juice boxes', 'notebooks'])
      const costA = N * uA, costB = N * uB, save = Math.abs(costA - costB)
      return { text: `At Store A, ${pA} ${thing} cost ${usd(pA * uA)}. At Store B, ${pB} ${thing} cost ${usd(pB * uB)}. You need ${N} ${thing}. How many dollars do you save at the cheaper store?`,
        picture: { kind: 'table', head: ['', 'Store A', 'Store B'], rows: [[thing[0].toUpperCase() + thing.slice(1), String(pA), String(pB)], ['Cost', usd(pA * uA), usd(pB * uB)]], rowHead: true },
        answer: dollars(save),
        steps: [`Store A: ${N} is ${N / pA} × ${pA}, so ${N / pA} × ${usd(pA * uA)} = ${usd(costA)}.`, `Store B: ${N} is ${N / pB} × ${pB}, so ${N / pB} × ${usd(pB * uB)} = ${usd(costB)}.`,
          `${usd(Math.max(costA, costB))} − ${usd(Math.min(costA, costB))} = ${usd(save)}. So you save ${usd(save)}.`] }
    }
  }),
]

// ── t6 · Percent increase and decrease ──────────────────────────────────────────────────────────────────────
/** An original amount and a percent whose change is whole. */
const change = (r: Rng, ps: readonly number[] = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75]) => {
  for (;;) { const p = pick(r, ps), O = int(r, 8, 200); if ((O * p) % 100 === 0) return { p, O, c: (O * p) / 100 } }
}
const T6: Level[] = [
  lv('tape: percent increase', r => {
    const { p, O, c } = change(r), N = O + c, item = pick(r, ['concert ticket', 'video game', 'pair of shoes', 'bike'])
    return { text: `A ${item} cost $${O}. Now it costs $${N}. By what percent did the price go up? ${TYPE_PCT}`,
      picture: { kind: 'tape', rows: [{ label: 'Before', cells: [{ w: O, text: `$${O}` }] }, { label: 'After', cells: [{ w: O, text: `$${O}` }, { w: c, shade: true }], brace: `$${N}` }] },
      answer: p, steps: [`The change: ${N} − ${O} = ${c}.`, `Compare it to the original: ${c} ÷ ${O} = ${fmt(p / 100)}.`, `${fmt(p / 100)} × 100 = ${p}, so the price went up ${p}%.`] }
  }),
  lv('bare numbers: percent decrease', r => {
    const { p, O, c } = change(r, [5, 10, 15, 20, 25, 30, 40, 50, 60, 75]), N = O - c
    return { text: `An amount drops from ${O} to ${N}. What is the percent decrease? ${TYPE_PCT}`, picture: eq(`${O} → ${N}`), answer: p,
      steps: [`The change: ${O} − ${N} = ${c}.`, `Divide by the original, ${O}: ${c} ÷ ${O} × 100 = ${p}.`, `So it is a ${p}% decrease.`] }
  }),
  lv('pick the right calculation (divide by the original)', r => {
    for (;;) {
      const up = r() < 0.5, { O, c } = change(r), N = up ? O + c : O - c
      const vals = [c / O, c / N, N / O]
      if (new Set(vals).size < 3) continue
      const [thing, unit] = pick(r, [['A class', ' students'], ['A town', ' people'], ['A team', ' fans'], ['A jar', ' coins']] as const)
      const right = `${c} ÷ ${O} × 100`
      return { text: `${thing} went from ${O}${unit} to ${N}${unit}. Which calculation finds the percent ${up ? 'increase' : 'decrease'}?`,
        picture: eq(`${O} → ${N}`, [`change: ${c}`]), answer: choose(r, right, [`${c} ÷ ${N} × 100`, `${N} ÷ ${O} × 100`]),
        steps: [`The change is ${c}.`, `A percent change compares the change to the amount you started with, ${O}.`, `So the right one is ${right}.`] }
    }
  }),
  lv('reverse: use the percent to find the new amount', r => {
    const up = r() < 0.5, { p, O, c } = change(r), N = up ? O + c : O - c
    const [thing, unit] = up ? pick(r, [['A plant was', 'inches tall'], ['A school had', 'students'], ['A library had', 'books']] as const)
      : pick(r, [['A bike cost', 'dollars'], ['A pond had', 'fish'], ['A store had', 'shirts']] as const)
    return { text: `${thing} ${O} ${unit}. Then it went ${up ? 'up' : 'down'} by ${p}%. What is the new amount?`, picture: eq(`${O}, ${up ? 'up' : 'down'} ${p}%`), answer: N,
      steps: [`${p}% of ${O} is ${fmt(p / 100)} × ${O} = ${c}.`, `${up ? 'Add it on' : 'Take it away'}: ${O} ${up ? '+' : '−'} ${c} = ${N}.`, `So the new amount is ${N}.`] }
  }),
  lv('compare two changes: the greater percent increase', r => {
    for (;;) {
      const A = change(r, [5, 10, 15, 20, 25, 30, 40]), B = change(r, [5, 10, 15, 20, 25, 30, 40])
      if (A.p === B.p || A.c === B.c || (A.c > B.c) === (A.p > B.p)) continue
      const O1 = A.O * 10, O2 = B.O * 10, c1 = A.c * 10, c2 = B.c * 10
      const [n1, n2] = pick(r, [['Oak Hill', 'Pine Lake'], ['River Bend', 'Maple Park'], ['Cedar Falls', 'Fox Run']] as const)
      const best = Math.max(A.p, B.p)
      return { text: `${n1} grew from ${fmt(O1)} to ${fmt(O1 + c1)} people. ${n2} grew from ${fmt(O2)} to ${fmt(O2 + c2)} people. Which town grew by the greater percent? Type that percent without the % sign.`,
        picture: { kind: 'table', head: ['Town', 'Before', 'After'], rows: [[n1, fmt(O1), fmt(O1 + c1)], [n2, fmt(O2), fmt(O2 + c2)]], rowHead: true },
        answer: best,
        steps: [`${n1}: grew by ${fmt(c1)}, and ${fmt(c1)} ÷ ${fmt(O1)} × 100 = ${A.p}%. ${n2}: grew by ${fmt(c2)}, and ${fmt(c2)} ÷ ${fmt(O2)} × 100 = ${B.p}%.`,
          `The town that added more people is not the one with the greater percent.`, `So the greater percent increase is ${best}%.`] }
    }
  }),
]

// ── t7 · Markup, tax and tip ────────────────────────────────────────────────────────────────────────────────
const addOn = (base: string, pct: string, brace: string, more?: string): Picture =>
  ({ kind: 'tape', rows: [{ cells: [{ w: 10, text: base }, { w: 3, text: pct, shade: true }, ...(more ? [{ w: 3, text: more, shade: true }] : [])], brace }] })
const T7: Level[] = [
  lv('tape: add the markup to the cost', r => {
    for (;;) {
      const C = 5 * int(r, 2, 16), p = 10 * int(r, 2, 8)
      if ((C * p) % 100) continue
      const extra = (C * p) / 100, item = pick(r, ['T-shirt', 'cap', 'mug', 'lamp'])
      return { text: `A shop pays $${C} for a ${item} and adds ${p}% on top. What is the price, in dollars?`, picture: addOn(`$${C}`, `${p}%`, 'Price: ?'), answer: C + extra,
        steps: [`10% of $${C} is ${usd(C * 10)}, so ${p}% is ${p / 10} × ${usd(C * 10)} = $${extra}.`, `Add it on: ${C} + ${extra} = ${C + extra}.`, `So the price is $${C + extra}.`] }
    }
  }),
  lv('one step: multiply by 100% plus the tax', r => {
    const P = int(r, 12, 90), t = int(r, 3, 9), totalC = P * (100 + t), item = pick(r, ['pair of headphones', 'backpack', 'board game', 'soccer ball'])
    return { text: `A ${item} costs $${P}. The sales tax is ${t}%. Find the total with ONE multiplication. What is the total, in dollars?`, picture: eq(`$${P} + ${t}% tax`, ['Total: ?']),
      answer: dollars(totalC),
      steps: [`The total is 100% of the price plus ${t}% more: ${100 + t}%, which is ${fmt((100 + t) / 100)}.`, `${fmt((100 + t) / 100)} × ${P} = ${fmt(dollars(totalC))}.`, `So the total is ${usd(totalC)}.`] }
  }),
  lv('pick the total (the tip is not the bill)', r => {
    for (;;) {
      const M = int(r, 12, 80), p = pick(r, [10, 15, 18, 20, 25]), tipC = M * p
      if (M === 100) continue
      const right = usd(M * 100 + tipC)
      return { text: `A meal costs $${M}. You leave ${p === 18 ? 'an' : 'a'} ${p}% tip. Which one is what you pay in all?`, picture: addOn(`$${M}`, `${p}%`, 'Total: ?'),
        answer: choose(r, right, [usd(tipC), usd(M * 100 + p * 100)]),
        steps: [`${p}% is not $${p}. ${p}% of $${M} is ${usd(tipC)}.`, `Do not stop at the tip. Add it on: $${M} + ${usd(tipC)} = ${right}.`, `So you pay ${right}.`] }
    }
  }),
  lv('work backwards: what percent was the markup', r => {
    for (;;) {
      const C = 5 * int(r, 2, 20), p = 5 * int(r, 2, 16)
      if ((C * p) % 100) continue
      const S = C + (C * p) / 100, item = pick(r, ['jacket', 'vase', 'skateboard', 'phone case'])
      return { text: `A store pays $${C} for a ${item} and sells it for $${S}. What percent markup is that? ${TYPE_PCT}`, picture: addOn(`$${C}`, '?%', `Price: $${S}`), answer: p,
        steps: [`The markup is ${S} − ${C} = $${S - C}.`, `Compare it to what the store paid: ${S - C} ÷ ${C} × 100 = ${p}.`, `So the markup is ${p}%.`] }
    }
  }),
  lv('multi-step: two percents on one price', r => {
    if (r() < 0.5) {
      for (;;) {
        const C = 10 * int(r, 2, 8), p = 10 * int(r, 2, 6), t = int(r, 3, 9), price = C + (C * p) / 100
        if ((C * p) % 100) continue
        const totalC = price * (100 + t)
        return { text: `A store pays $${C} for shoes and adds ${p}% on top. Then ${t}% sales tax is added to that price. What is the total, in dollars?`,
          picture: addOn(`$${C}`, `${p}%`, 'Total: ?', `${t}%`), answer: dollars(totalC),
          steps: [`The markup: ${p}% of $${C} is $${(C * p) / 100}, so the price is $${price}.`, `The tax is on that price: ${t}% of $${price} is ${usd(price * t)}.`,
            `$${price} + ${usd(price * t)} = ${usd(totalC)}. So the total is ${usd(totalC)}.`] }
      }
    }
    const M = int(r, 20, 90), t = int(r, 5, 9), q = pick(r, [15, 18, 20]), totalC = M * (100 + t + q), name = pick(r, ['Kim', 'Diaz', 'Patel', 'Ross'])
    return { text: `The ${name} family's dinner costs $${M}. They pay ${t}% tax and leave a ${q}% tip, both on the $${M}. What do they pay in all, in dollars?`,
      picture: addOn(`$${M}`, `${t}%`, 'Total: ?', `${q}%`), answer: dollars(totalC),
      steps: [`Tax: ${t}% of $${M} is ${usd(M * t)}. Tip: ${q}% of $${M} is ${usd(M * q)}.`, `Add all three: $${M} + ${usd(M * t)} + ${usd(M * q)}.`, `That is ${usd(totalC)}, so they pay ${usd(totalC)} in all.`] }
  }),
]

// ── t8 · Percent error ──────────────────────────────────────────────────────────────────────────────────────
/** A real amount, a percent error, and a whole-number gap. */
const miss = (r: Rng, As: readonly number[], ps: readonly number[]) => {
  for (;;) { const A = pick(r, As), p = pick(r, ps); if ((A * p) % 100 === 0) return { A, p, gap: (A * p) / 100, high: r() < 0.5 } }
}
const T8: Level[] = [
  lv('tape: guess against the real count', r => {
    const { A, p, gap, high } = miss(r, [20, 25, 40, 50, 60, 80, 120, 150, 200], [2, 4, 5, 10, 15, 20, 25, 30]), G = high ? A + gap : A - gap
    const things = pick(r, ['jelly beans', 'marbles', 'buttons', 'beads'])
    return { text: `You guess a jar holds ${G} ${things}. The real count is ${A}. By what percent was your guess off? ${TYPE_PCT}`,
      picture: { kind: 'tape', rows: [{ label: 'Guess', cells: [{ w: G, text: String(G) }] }, { label: 'Real', cells: [{ w: A, text: String(A) }] }] }, answer: p,
      steps: [`How far off: ${Math.max(A, G)} − ${Math.min(A, G)} = ${gap}.`, `Divide by the real count: ${gap} ÷ ${A} = ${fmt(p / 100)}.`, `${fmt(p / 100)} × 100 = ${p}, so the guess was ${p}% off.`] }
  }),
  lv('bare measurement with a decimal', r => {
    for (;;) {
      const A = int(r, 4, 40), p = pick(r, [2.5, 5, 7.5, 10, 12.5, 15, 20]), gap = clean((A * p) / 100)
      if (!Number.isInteger(gap * 10) || Number.isInteger(gap)) continue
      const G = clean(r() < 0.5 ? A + gap : A - gap), [what, u] = pick(r, [['a board', 'cm'], ['a room', 'meters'], ['a rope', 'feet']] as const)
      return { text: `You measure ${what} as ${fmt(G)} ${u}. It is really ${A} ${u}. What is the percent error? ${TYPE_PCT}`, picture: eq(`Measured: ${fmt(G)} ${u}`, [`Real: ${A} ${u}`]), answer: p,
        steps: [`How far off: the gap between ${fmt(G)} and ${A} is ${fmt(gap)}.`, `Divide by the real length and multiply by 100: ${fmt(gap)} ÷ ${A} × 100 = ${fmt(p)}.`, `So the percent error is ${fmt(p)}%.`] }
    }
  }),
  lv('pick the percent error (not the gap, not the guess over the real)', r => {
    for (;;) {
      const { A, p, gap, high } = miss(r, [20, 25, 40, 50, 60, 80, 120, 200], [5, 10, 15, 20, 25, 30]), G = high ? A + gap : A - gap, ratio = high ? 100 + p : 100 - p
      if (new Set([p, gap, ratio]).size < 3) continue
      const name = pick(r, ['Zoe', 'Luis', 'Maya', 'Theo']), right = `${p}%`
      return { text: `${name} guessed ${G} people would come to a game. The real count was ${A}. Which one is ${name}'s percent error?`, picture: eq(`Guess: ${G}`, [`Real: ${A}`]),
        answer: choose(r, right, [`${gap}%`, `${ratio}%`]),
        steps: [`The gap is ${gap}, but a gap is not a percent.`, `Compare the gap to the real count: ${gap} ÷ ${A} × 100 = ${p}.`, `So the percent error is ${right}.`] }
    }
  }),
  lv('work backwards: find the measurement from the percent error', r => {
    const { A, p, gap, high } = miss(r, [20, 30, 40, 50, 60, 80, 120], [5, 10, 15, 20, 25]), G = high ? A + gap : A - gap
    const name = pick(r, ['Kai', 'Ella', 'Jin', 'Rosa'])
    return { text: `A rope is really ${A} feet long. ${name}'s measurement was ${p}% too ${high ? 'long' : 'short'}. What did ${name} measure, in feet?`,
      picture: { kind: 'tape', rows: [{ label: 'Real', cells: [{ w: A, text: `${A} ft` }] }, { label: 'Measured', cells: [{ w: G, text: '?' }] }] }, answer: G,
      steps: [`The error is ${p}% of the real length: ${fmt(p / 100)} × ${A} = ${gap} feet.`, `Too ${high ? 'long, so add' : 'short, so take away'}: ${A} ${high ? '+' : '−'} ${gap} = ${G}.`, `So ${name} measured ${G} feet.`] }
  }),
  lv('compare two guesses: the smaller percent error', r => {
    for (;;) {
      const X = miss(r, [20, 25, 40, 50, 60, 80], [5, 10, 15, 20, 25]), Y = miss(r, [200, 250, 300, 400, 500], [2, 4, 5, 6, 8, 10])
      if (Y.p >= X.p || X.gap >= Y.gap) continue
      const G1 = X.high ? X.A + X.gap : X.A - X.gap, G2 = Y.high ? Y.A + Y.gap : Y.A - Y.gap
      const flip = r() < 0.5, [n1, n2] = ['Liam', 'Mia']
      const rows = flip ? [[n1, String(G2), String(Y.A)], [n2, String(G1), String(X.A)]] : [[n1, String(G1), String(X.A)], [n2, String(G2), String(Y.A)]]
      const [a, b] = flip ? [Y, X] : [X, Y], [ga, gb] = flip ? [G2, G1] : [G1, G2], best = Math.min(X.p, Y.p)
      return { text: `${n1} guessed ${ga} for a real count of ${a.A}. ${n2} guessed ${gb} for a real count of ${b.A}. Which guess has the smaller percent error? Type that percent without the % sign.`,
        picture: { kind: 'table', head: ['', 'Guess', 'Real'], rows, rowHead: true }, answer: best,
        steps: [`${n1}: off by ${a.gap}, and ${a.gap} ÷ ${a.A} × 100 = ${a.p}%. ${n2}: off by ${b.gap}, and ${b.gap} ÷ ${b.A} × 100 = ${b.p}%.`,
          'A bigger gap can still be a smaller percent, when the real count is bigger.', `So the smaller percent error is ${best}%.`] }
    }
  }),
]

export const G7M1_LADDERS: Record<string, Level[]> = {
  'g7m1-t1': T1, 'g7m1-t2': T2, 'g7m1-t3': T3, 'g7m1-t4': T4, 'g7m1-t5': T5, 'g7m1-t6': T6, 'g7m1-t7': T7, 'g7m1-t8': T8,
}
