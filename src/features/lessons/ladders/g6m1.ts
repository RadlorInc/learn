/**
 * Grade 6 · Module 1 — ratios, rates and proportions — the practice ladders (see ../adaptive.ts and ./g5m1.ts).
 * ⚠️ A level is a different KIND of question, never the level below with bigger numbers. Money is picked in CENTS
 * and only turned into dollars for the answer, so no float noise reaches a child.
 */
import type { Picture, Problem } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

type TapeRow = Extract<Picture, { kind: 'tape' }>['rows'][number]

const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const row = (label: string, n: number, shade = false, brace?: string): TapeRow =>
  ({ label, cells: Array.from({ length: n }, () => ({ w: 1, shade })), brace })
const tape = (rows: TapeRow[]): Picture => ({ kind: 'tape', rows })
const split = (n: number, brace: string, label?: string): Picture =>
  ({ kind: 'tape', rows: [{ label, cells: Array.from({ length: n }, () => ({ w: 1 })), brace }] })
/** A table whose first cell of each row is its name. */
const table = (rows: (string | number)[][], head?: string[]): Picture =>
  ({ kind: 'table', head, rows: rows.map(r => r.map(c => (typeof c === 'number' ? fmt(c) : c))), rowHead: true })
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
/** Cents → "$4", "$4.50", "$0.75". */
const usd = (c: number) => (c % 100 === 0 ? `$${fmt(c / 100)}` : `$${fmt(Math.floor(c / 100))}.${String(c % 100).padStart(2, '0')}`)
const dollars = (c: number) => Math.round(c) / 100
const NAMES = ['Mia', 'Leo', 'Ava', 'Ben', 'Zoe', 'Sam', 'Ruby', 'Omar', 'Jada', 'Kai']

const choose = (r: Rng, right: string, wrong: string[]) => {
  const choices = shuffle(r, [right, ...wrong])
  return { choices, correct: choices.indexOf(right) }
}
const until = <T>(make: () => T, ok: (t: T) => boolean): T => { let t = make(); while (!ok(t)) t = make(); return t }
/** a/b equals c/d, by cross multiplying. */
const same = (a: number, b: number, c: number, d: number) => a * d === b * c

/** Every number a picture's labels print (a table row is also read joined up), as the gate reads it. */
const labels = (v: unknown, out: string[] = []): string[] => {
  if (typeof v === 'string') out.push(v)
  else if (Array.isArray(v)) { if (v.length && v.every(x => typeof x === 'string')) out.push(v.join('')); v.forEach(x => labels(x, out)) }
  else if (v && typeof v === 'object') Object.values(v).forEach(x => labels(x, out))
  return out
}
const shows = (pic: Picture, n: number) => Math.abs(n) >= 10 &&
  labels(pic).some(t => (t.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).some(x => x.replace(/,/g, '') === String(Math.abs(n))))
/** A level whose numbers are re-picked whenever the picture would print the answer. */
const L = (style: string, make: (r: Rng) => Problem): Level => ({ style, make: r => {
  let p = make(r)
  for (let i = 0; i < 500 && typeof p.answer === 'number' && shows(p.picture, p.answer); i++) p = make(r)
  return p
} })

// ── t1 · What a ratio is ────────────────────────────────────────────────────────────────────────────────────
const PATTERNS = [
  { thing: 'A bracelet pattern', a: 'red', b: 'blue', noun: 'beads' },
  { thing: 'A floor pattern', a: 'blue', b: 'gray', noun: 'tiles' },
  { thing: 'A garden border', a: 'yellow', b: 'purple', noun: 'flowers' },
  { thing: 'A necklace pattern', a: 'green', b: 'white', noun: 'beads' },
] as const
const MIXES3 = [
  { what: 'Every scoop of trail mix has', k: ['nuts', 'raisins', 'seeds'], noun: 'pieces' },
  { what: 'Every box of crayons has', k: ['red crayons', 'blue crayons', 'green crayons'], noun: 'crayons' },
  { what: 'Every pack of cards has', k: ['animal cards', 'car cards', 'space cards'], noun: 'cards' },
] as const
const twoParts = (r: Rng) => until(() => ({ a: int(r, 2, 9), b: int(r, 2, 9) }), ({ a, b }) => a !== b)

const T1: Level[] = [
  L('tape, part out of the whole', r => {
    const P = pick(r, PATTERNS), { a, b } = twoParts(r)
    return { text: `${P.thing} has ${a} ${P.a} ${P.noun} for every ${b} ${P.b} ${P.noun}. ${cap(P.a)} ${P.noun} are ${a} out of every how many ${P.noun}?`,
      picture: tape([row(cap(P.a), a, true), row(cap(P.b), b)]), answer: a + b,
      steps: [`The question compares ${P.a} ${P.noun} to all the ${P.noun} in one set.`, `One set has ${a} ${P.a} and ${b} ${P.b} ${P.noun}: ${a} + ${b}.`, `So ${P.a} ${P.noun} are ${a} out of every ${a + b} ${P.noun}.`] }
  }),
  L('write the ratio in the order of the words', r => {
    const P = pick(r, PATTERNS), x = int(r, 2, 15), y = until(() => int(r, 2, 15), v => v !== x)
    const firstMissing = r() < 0.5, answer = firstMissing ? y : x
    return { text: `There are ${x} ${P.a} ${P.noun} and ${y} ${P.b} ${P.noun}. What number goes where the ? is?`,
      picture: eq(firstMissing ? `${P.b} to ${P.a} = ? : ${x}` : `${P.b} to ${P.a} = ${y} : ?`), answer,
      steps: [`${cap(P.b)} to ${P.a} means the ${P.b} number comes first.`, `There are ${y} ${P.b} and ${x} ${P.a} ${P.noun}.`, `So ${P.b} to ${P.a} is ${y} : ${x}, and the missing number is ${answer}.`] }
  }),
  L('pick the true sentence', r => {
    const P = pick(r, PATTERNS), { a, b } = twoParts(r)
    const ratio = r() < 0.5
    const right = ratio ? `${cap(P.b)} to ${P.a} is ${b} : ${a}` : `${cap(P.a)} ${P.noun} are ${a} out of every ${a + b} ${P.noun}`
    const wrong = [`${cap(P.b)} to ${P.a} is ${a} : ${b}`, `${cap(P.a)} ${P.noun} are ${a} out of every ${b} ${P.noun}`, `${cap(P.b)} ${P.noun} are ${b} out of every ${a} ${P.noun}`]
    return { text: `${P.thing} has ${a} ${P.a} ${P.noun} for every ${b} ${P.b} ${P.noun}. Which one is true?`,
      picture: tape([row(cap(P.a), a, true), row(cap(P.b), b)]), answer: choose(r, right, wrong),
      steps: ratio
        ? [`${cap(P.b)} to ${P.a} puts the ${P.b} number first.`, `There are ${b} ${P.b} for every ${a} ${P.a}.`, `So the true one is: ${right}.`]
        : [`All the ${P.noun} in one set: ${a} + ${b} = ${a + b}.`, `${a} of those are ${P.a}.`, `So the true one is: ${right}.`] }
  }),
  L('work backwards from part out of the whole', r => {
    const P = pick(r, PATTERNS), { a, b } = twoParts(r), w = a + b
    return { text: `In ${P.thing.toLowerCase()}, ${P.a} ${P.noun} are ${a} out of every ${w} ${P.noun}. The rest are ${P.b}. How many ${P.b} ${P.noun} are in each set?`,
      picture: eq(`${P.a} out of all = ${a} out of ${w}`, [`${P.a} to ${P.b} = ${a} : ?`]), answer: b,
      steps: [`One set has ${w} ${P.noun} in all, and ${a} of them are ${P.a}.`, `The rest are ${P.b}: ${w} − ${a}.`, `So each set has ${b} ${P.b} ${P.noun}.`] }
  }),
  L('three kinds, part out of the whole', r => {
    const M = pick(r, MIXES3), p = int(r, 2, 9), q = int(r, 2, 9), s = int(r, 2, 9), w = p + q + s
    const pic = eq(`${M.k[0]} : ${M.k[1]} : ${M.k[2]} = ${p} : ${q} : ${s}`)
    const text = `${M.what} ${p} ${M.k[0]}, ${q} ${M.k[1]} and ${s} ${M.k[2]}.`
    if (r() < 0.5) return { text: `${text} ${cap(M.k[1])} are ${q} out of every how many ${M.noun}?`, picture: pic, answer: w,
      steps: [`The whole is every one of the ${M.noun}, all three kinds.`, `Add all three parts: ${p} + ${q} + ${s}.`, `So ${M.k[1]} are ${q} out of every ${w} ${M.noun}.`] }
    return { text: `${text} ${cap(M.k[0])} and ${M.k[2]} together are how many out of every ${w} ${M.noun}?`, picture: pic, answer: p + s,
      steps: [`All the ${M.noun}: ${p} + ${q} + ${s} = ${w}.`, `${cap(M.k[0])} and ${M.k[2]} together: ${p} + ${s}.`, `So they are ${p + s} out of every ${w} ${M.noun}.`] }
  }),
]

// ── t2 · Equivalent ratios ──────────────────────────────────────────────────────────────────────────────────
const RECIPES = [
  { what: 'A pancake recipe', A: 'Flour (cups)', a: 'cups of flour', B: 'Eggs', b: 'eggs' },
  { what: 'A lemonade recipe', A: 'Lemons', a: 'lemons', B: 'Water (cups)', b: 'cups of water' },
  { what: 'A trail mix', A: 'Nuts (scoops)', a: 'scoops of nuts', B: 'Raisins (scoops)', b: 'scoops of raisins' },
  { what: 'A paint mix', A: 'Red (cups)', a: 'cups of red paint', B: 'Yellow (cups)', b: 'cups of yellow paint' },
] as const
const PLANS = [
  { what: 'A party plan uses', a: 'pizzas', A: 'Pizzas', b: 'people', B: 'People', need: 'need' },
  { what: 'A camp plan uses', a: 'tents', A: 'Tents', b: 'campers', B: 'Campers', need: 'need' },
  { what: 'A school trip takes', a: 'adults', A: 'Adults', b: 'students', B: 'Students', need: 'need' },
] as const

const T2: Level[] = [
  L('ratio table, scale up', r => {
    const R = pick(r, RECIPES), { a, b } = twoParts(r), k = int(r, 2, 6)
    return { text: `${R.what} uses ${a} ${R.a} for every ${b} ${R.b}. How many ${R.b} go with ${a * k} ${R.a}?`,
      picture: table([[R.A, a, a * k], [R.B, b, '?']]), answer: b * k,
      steps: [`${a * k} is ${a} times ${k}.`, `Multiply the other number by ${k} too: ${b} × ${k}.`, `So you need ${b * k} ${R.b}.`] }
  }),
  L('bare ratios, missing number (up or down)', r => {
    const { a, b } = twoParts(r), k = int(r, 2, 9)
    if (r() < 0.5) return { text: 'These two ratios are the same mix. What number goes where the ? is?', picture: eq(`${a} : ${b} = ? : ${b * k}`), answer: a * k,
      steps: [`${b} became ${b * k}, so it was multiplied by ${k}.`, `Multiply the other number by ${k} too: ${a} × ${k}.`, `So the missing number is ${a * k}.`] }
    return { text: 'These two ratios are the same mix. What number goes where the ? is?', picture: eq(`${a * k} : ${b * k} = ${a} : ?`), answer: b,
      steps: [`${a * k} became ${a}, so it was divided by ${k}.`, `Divide the other number by ${k} too: ${b * k} ÷ ${k}.`, `So the missing number is ${b}.`] }
  }),
  L('pick the equivalent ratio', r => {
    const { a, b, k, wrong } = until(() => {
      const { a, b } = twoParts(r), k = int(r, 2, 6)
      return { a, b, k, wrong: [[a + k, b + k], [b * k, a * k], [a * k, b * (k + 1)]] }
    }, ({ a, b, k, wrong }) => {
      const all = [[a * k, b * k], ...wrong]
      return wrong.every(([x, y]) => !same(x, y, a, b)) && all.every(([x, y], i) => all.every(([u, v], j) => i === j || !same(x, y, u, v)))
    })
    const right = `${a * k} : ${b * k}`
    return { text: `Which ratio is the same mix as ${a} : ${b}?`, picture: eq(`${a} : ${b}`), answer: choose(r, right, wrong.map(([x, y]) => `${x} : ${y}`)),
      steps: ['The same mix means both numbers are multiplied by the same number.', `${a} × ${k} = ${a * k} and ${b} × ${k} = ${b * k}.`, `So the answer is ${right}.`] }
  }),
  L('spot the column that is not the same mix', r => {
    const R = pick(r, RECIPES), { a, b } = twoParts(r)
    const [k1, k2] = shuffle(r, [2, 3, 4, 5]).slice(0, 2).sort((x, y) => x - y), d = int(r, 1, 6)
    const cols: [number, number][] = [[a * k1, b * k1], [a * k2, b * k2]]
    const bad = int(r, 0, 2)
    cols.splice(bad, 0, [a + d, b + d])
    const letter = 'ABC'[bad]
    return { text: `${R.what} uses ${a} ${R.a} for every ${b} ${R.b}. Columns A, B and C should each be the same mix. Which column is not?`,
      picture: table([[R.A, a, ...cols.map(c => c[0])], [R.B, b, ...cols.map(c => c[1])]], ['', 'Recipe', 'A', 'B', 'C']),
      answer: { choices: ['Column A', 'Column B', 'Column C'], correct: bad },
      steps: [`Column ${letter} adds ${d} to both numbers: ${a} + ${d} and ${b} + ${d}. Adding changes the mix.`, 'The other columns multiply both numbers by the same number.', `So the answer is Column ${letter}.`] }
  }),
  L('story: scale down, then up', r => {
    const P = pick(r, PLANS), a = int(r, 2, 5), b = until(() => int(r, 4, 9), v => v >= a + 2), k = int(r, 3, 6), m = until(() => int(r, 2, 9), v => v !== k)
    return { text: `${P.what} ${a * k} ${P.a} for ${b * k} ${P.b}. Keep the same plan. How many ${P.a} do ${b * m} ${P.b} ${P.need}?`,
      picture: table([[P.A, a * k, '?'], [P.B, b * k, b * m]]), answer: a * m,
      steps: [`Divide both by ${k}: ${a} ${P.a} for ${b} ${P.b}.`, `${b * m} ${P.b} is ${b} × ${m}, so multiply the ${P.a} by ${m} too: ${a} × ${m}.`, `So ${b * m} ${P.b} ${P.need} ${a * m} ${P.a}.`] }
  }),
]

// ── t3 · Unit rate ──────────────────────────────────────────────────────────────────────────────────────────
const ITEMS = [
  { many: 'notebooks', one: 'notebook', box: 'pack' }, { many: 'pens', one: 'pen', box: 'pack' },
  { many: 'muffins', one: 'muffin', box: 'box' }, { many: 'folders', one: 'folder', box: 'pack' },
  { many: 'juice boxes', one: 'juice box', box: 'case' },
] as const
/** A unit price in cents, a multiple of 25 from $0.50 to $9.75. */
const unitCents = (r: Rng, lo = 2, hi = 39) => int(r, lo, hi) * 25
const RATES = [
  { say: (Q: number, n: number) => `A printer prints ${Q} pages in ${n} minutes.`, ask: 'How many pages does it print in one minute?', q: 'pages', t: 'minutes', one: 'minute', did: 'it prints' },
  { say: (Q: number, n: number) => `A machine packs ${Q} boxes in ${n} hours.`, ask: 'How many boxes does it pack in one hour?', q: 'boxes', t: 'hours', one: 'hour', did: 'it packs' },
  { say: (Q: number, n: number) => `A hose fills ${Q} gallons in ${n} minutes.`, ask: 'How many gallons does it fill in one minute?', q: 'gallons', t: 'minutes', one: 'minute', did: 'it fills' },
] as const

const T3: Level[] = [
  L('tape split into equal parts, price of one', r => {
    const I = pick(r, ITEMS), n = int(r, 2, 6), u = unitCents(r, 2, 19), T = n * u
    return { text: `A ${I.box} of ${n} ${I.many} costs ${usd(T)}. How much does one ${I.one} cost?`, picture: split(n, usd(T)), answer: dollars(u),
      steps: [`The ${usd(T)} pays for ${n} ${I.many}, so split it into ${n} equal parts.`, `${usd(T)} ÷ ${n}.`, `So one ${I.one} costs ${usd(u)}.`] }
  }),
  L('a rate that is not money', r => {
    const R = pick(r, RATES), n = int(r, 3, 9), u = int(r, 6, 40), Q = n * u
    return { text: `${R.say(Q, n)} ${R.ask}`, picture: eq(`${Q} ${R.q} in ${n} ${R.t}`, [`? ${R.q} in 1 ${R.one}`]), answer: u,
      steps: [`The ${Q} ${R.q} are shared by ${n} ${R.t}.`, `${Q} ÷ ${n} = ${u}.`, `So ${R.did} ${u} ${R.q} in one ${R.one}.`] }
  }),
  L('pick the right division', r => {
    const I = pick(r, ITEMS)
    const { n, u } = until(() => ({ n: int(r, 2, 6), u: unitCents(r, 6, 39) }), ({ n, u }) => {
      const T = n * u, vals = [u, T * n, T - 100 * n, T + 100 * n]
      return new Set(vals).size === vals.length
    })
    const T = n * u, right = `${usd(T)} ÷ ${n} = ${usd(u)}`
    return { text: `A ${I.box} of ${n} ${I.many} costs ${usd(T)}. Which one finds the cost of one ${I.one}?`, picture: split(n, usd(T)),
      answer: choose(r, right, [`${usd(T)} × ${n} = ${usd(T * n)}`, `${usd(T)} − ${n} = ${usd(T - 100 * n)}`, `${usd(T)} + ${n} = ${usd(T + 100 * n)}`]),
      steps: [`The ${usd(T)} is for all ${n} ${I.many}, so share it out into ${n} equal parts.`, 'Divide the dollars by how many there are.', `So the answer is ${right}.`] }
  }),
  L('work backwards: how many are in the pack', r => {
    const I = pick(r, ITEMS), n = int(r, 2, 9), u = until(() => unitCents(r, 3, 39), v => v % 100 !== 0), T = n * u
    return { text: `Each ${I.one} costs ${usd(u)}. A ${I.box} of them costs ${usd(T)}. How many ${I.many} are in the ${I.box}?`,
      picture: eq(`? × ${usd(u)} = ${usd(T)}`), answer: n,
      steps: [`Find how many ${usd(u)} parts make ${usd(T)}: ${usd(T)} ÷ ${usd(u)}.`, `Check it: ${n} × ${usd(u)} = ${usd(T)}.`, `So there are ${n} ${I.many} in the ${I.box}.`] }
  }),
  L('compare two stores', r => {
    const I = pick(r, ITEMS), n1 = int(r, 2, 6), n2 = until(() => int(r, 2, 6), v => v !== n1)
    const u1 = unitCents(r, 4, 30), u2 = r() < 0.2 ? u1 : until(() => u1 + 25 * int(r, -2, 2), v => v !== u1 && v >= 50)
    const T1 = n1 * u1, T2 = n2 * u2, correct = u1 === u2 ? 2 : u1 < u2 ? 0 : 1
    const choices = ['Store A', 'Store B', 'They cost the same']
    return { text: `Store A sells ${n1} ${I.many} for ${usd(T1)}. Store B sells ${n2} ${I.many} for ${usd(T2)}. Which store has the lower price for one ${I.one}?`,
      picture: table([['A', n1, usd(T1)], ['B', n2, usd(T2)]], ['Store', cap(I.many), 'Cost']), answer: { choices, correct },
      steps: [`Store A: ${usd(T1)} ÷ ${n1} = ${usd(u1)} for one.`, `Store B: ${usd(T2)} ÷ ${n2} = ${usd(u2)} for one.`,
        correct === 2 ? `Both are ${usd(u1)} for one. They cost the same.` : `${usd(Math.min(u1, u2))} is less, so the answer is ${choices[correct]}.`] }
  }),
]

// ── t4 · Use a unit rate ────────────────────────────────────────────────────────────────────────────────────
const BUYS = [
  { many: 'bags of popcorn', lab: 'bags', one: 'bag' }, { many: 'movie tickets', lab: 'tickets', one: 'ticket' },
  { many: 'notebooks', lab: 'notebooks', one: 'notebook' }, { many: 'yards of fabric', lab: 'yards', one: 'yard' },
] as const
const RATES4 = [
  { say: (Q: number, n: number) => `A printer prints ${Q} pages in ${n} minutes.`, ask: (m: number) => `How many pages does it print in ${m} minutes?`,
    has: (Q: number | string, n: number) => `${Q} pages in ${n} minutes`, done: (m: number, x: number) => `it prints ${x} pages in ${m} minutes`, per: 'minute', q: 'pages' },
  { say: (Q: number, n: number) => `Sam's car uses ${n} gallons of gas to drive ${Q} miles.`, ask: (m: number) => `How far can it drive on ${m} gallons?`,
    has: (Q: number | string, n: number) => `${Q} miles on ${n} gallons`, done: (m: number, x: number) => `the car can drive ${x} miles on ${m} gallons`, per: 'gallon', q: 'miles' },
  { say: (Q: number, n: number) => `A machine fills ${Q} bottles in ${n} hours.`, ask: (m: number) => `How many bottles does it fill in ${m} hours?`,
    has: (Q: number | string, n: number) => `${Q} bottles in ${n} hours`, done: (m: number, x: number) => `it fills ${x} bottles in ${m} hours`, per: 'hour', q: 'bottles' },
] as const

const T4: Level[] = [
  L('tape: one first, then multiply', r => {
    const B = pick(r, BUYS), n = int(r, 2, 6), u = int(r, 2, 18) * 50, m = until(() => int(r, 2, 12), v => v !== n), T = n * u
    return { text: `${n} ${B.many} cost ${usd(T)}. How much do ${m} ${B.lab} cost?`, picture: split(n, usd(T), `${n} ${B.lab}`), answer: dollars(m * u),
      steps: [`Find one ${B.one}: ${usd(T)} ÷ ${n} = ${usd(u)}.`, `Multiply by the ${m} ${B.lab} you want: ${m} × ${usd(u)}.`, `So ${m} ${B.lab} cost ${usd(m * u)}.`] }
  }),
  L('a rate that is not money', r => {
    const R = pick(r, RATES4), n = int(r, 2, 8), u = int(r, 4, 35), m = until(() => int(r, 2, 12), v => v !== n)
    return { text: `${R.say(n * u, n)} ${R.ask(m)}`, picture: eq(R.has(n * u, n), [R.has('?', m)]), answer: m * u,
      steps: [`Find one ${R.per}: ${n * u} ÷ ${n} = ${u} ${R.q}.`, `Multiply by ${m}: ${m} × ${u}.`, `So ${R.done(m, m * u)}.`] }
  }),
  L('pick the right way (one first)', r => {
    const B = pick(r, BUYS)
    const { n, u, m } = until(() => ({ n: int(r, 2, 6), u: int(r, 3, 18) * 50, m: int(r, 2, 12) }), ({ n, u, m }) => {
      if (m === n) return false
      const T = n * u, vals = [m * u, m * T, T + (m - n) * 100]
      return T + (m - n) * 100 > 0 && new Set(vals).size === 3
    })
    const T = n * u, right = `${usd(T)} ÷ ${n} = ${usd(u)}, then ${m} × ${usd(u)} = ${usd(m * u)}`
    const off = m > n ? `${usd(T)} + ${usd((m - n) * 100)} = ${usd(T + (m - n) * 100)}` : `${usd(T)} − ${usd((n - m) * 100)} = ${usd(T + (m - n) * 100)}`
    return { text: `${n} ${B.many} cost ${usd(T)}. Which way finds the cost of ${m} ${B.lab}?`, picture: split(n, usd(T), `${n} ${B.lab}`),
      answer: choose(r, right, [`${m} × ${usd(T)} = ${usd(m * T)}`, off]),
      steps: [`${usd(T)} is the price of ${n} ${B.lab}, not the price of one ${B.one}.`, `Find one ${B.one} first, then multiply by ${m}.`, `So the answer is ${right}.`] }
  }),
  L('work backwards: how many can you buy', r => {
    const B = pick(r, BUYS), n = int(r, 2, 6), u = int(r, 3, 18) * 50, m = until(() => int(r, 2, 12), v => v !== n), T = n * u
    return { text: `${n} ${B.many} cost ${usd(T)}. How many ${B.lab} can you buy with ${usd(m * u)}?`, picture: split(n, usd(T), `${n} ${B.lab}`), answer: m,
      steps: [`Find one ${B.one}: ${usd(T)} ÷ ${n} = ${usd(u)}.`, `See how many ${usd(u)} parts make ${usd(m * u)}: ${usd(m * u)} ÷ ${usd(u)}.`, `So you can buy ${m} ${B.lab}.`] }
  }),
  L('two-step story: cost, then change', r => {
    const B = pick(r, BUYS), who = pick(r, NAMES), n = int(r, 2, 6), u = int(r, 3, 39) * 25, m = until(() => int(r, 2, 9), v => v !== n)
    const T = n * u, C = m * u, P = (Math.floor(C / 1000) + 1) * 1000 + pick(r, [0, 1000])
    return { text: `${n} ${B.many} cost ${usd(T)}. ${who} buys ${m} ${B.lab} and pays with ${usd(P)}. How much change does ${who} get?`,
      picture: eq(`${n} ${B.lab} cost ${usd(T)}`, [`buy ${m} ${B.lab}`, `pay with ${usd(P)}`]), answer: dollars(P - C),
      steps: [`One ${B.one}: ${usd(T)} ÷ ${n} = ${usd(u)}.`, `${m} ${B.lab}: ${m} × ${usd(u)} = ${usd(C)}.`, `The change is ${usd(P)} − ${usd(C)} = ${usd(P - C)}.`] }
  }),
]

// ── t5 · Ratio tables ───────────────────────────────────────────────────────────────────────────────────────
const MIXES5 = [
  { what: 'A smoothie', A: 'Berries (cups)', a: 'cups of berries', B: 'Yogurt (cups)', b: 'cups of yogurt', sa: 'berries', sb: 'yogurt', more: 'too much', less: 'too little', be: 'is' },
  { what: 'A salad', A: 'Tomatoes', a: 'tomatoes', B: 'Cucumbers', b: 'cucumbers', sa: 'tomatoes', sb: 'cucumbers', more: 'too many', less: 'too few', be: 'are' },
  { what: 'Trail mix', A: 'Nuts (cups)', a: 'cups of nuts', B: 'Cereal (cups)', b: 'cups of cereal', sa: 'nuts', sb: 'cereal', more: 'too much', less: 'too little', be: 'is' },
  { what: 'A paint mix', A: 'White (cups)', a: 'cups of white', B: 'Red (cups)', b: 'cups of red', sa: 'white', sb: 'red', more: 'too much', less: 'too little', be: 'is' },
] as const

const T5: Level[] = [
  L('table with columns ready, add two columns', r => {
    const M = pick(r, MIXES5), a = int(r, 2, 6), b = until(() => int(r, 2, 9), v => v !== a), f = pick(r, [4, 5]), x = f - 3
    return { text: `${M.what} uses ${a} ${M.a} for every ${b} ${M.b}. How many ${M.b} go with ${f * a} ${M.a}?`,
      picture: table([[M.A, a, 2 * a, 3 * a, f * a], [M.B, b, 2 * b, 3 * b, '?']]), answer: f * b,
      steps: [`Two columns add up to ${f * a}: ${x * a} + ${3 * a} = ${f * a}.`, `Add the ${M.b} in those same columns: ${x * b} + ${3 * b}.`, `So you need ${f * b} ${M.b}.`] }
  }),
  L('scale down, then up', r => {
    const M = pick(r, MIXES5), a = int(r, 2, 6), b = until(() => int(r, 2, 9), v => v !== a), k = int(r, 3, 6), m = until(() => int(r, 2, 9), v => v !== k)
    return { text: `${M.what} uses ${a * k} ${M.a} for ${b * k} ${M.b}. At the same ratio, how many ${M.a} go with ${b * m} ${M.b}?`,
      picture: table([[M.A, a * k, '?'], [M.B, b * k, b * m]]), answer: a * m,
      steps: [`Divide both by ${k}: ${a} ${M.a} for ${b} ${M.b}.`, `Multiply both by ${m}: ${a} × ${m}.`, `So ${a * m} ${M.a} go with ${b * m} ${M.b}.`] }
  }),
  L('pick the pair that could be a new column', r => {
    const M = pick(r, MIXES5)
    const { a, b, k, w } = until(() => {
      const a = int(r, 2, 6), b = int(r, 2, 9), k = int(r, 5, 8)
      return { a, b, k, w: [[a * k, 3 * b + (a * k - 3 * a)], [b * k, a * k], [a * k, b * (k - 1)]] }
    }, ({ a, b, k, w }) => a !== b && w.every(([x, y]) => !same(x, y, a, b)) && new Set(w.map(([x, y]) => `${x}:${y}`)).add(`${a * k}:${b * k}`).size === 4)
    const say = (x: number, y: number) => `${x} ${M.a} and ${y} ${M.b}`
    const right = say(a * k, b * k)
    return { text: `Every column in this table is the same ${M.what.replace(/^A /, '').toLowerCase()}. Which pair could go in a new column?`,
      picture: table([[M.A, a, 2 * a, 3 * a], [M.B, b, 2 * b, 3 * b]]), answer: choose(r, right, w.map(([x, y]) => say(x, y))),
      steps: [`Every column is ${a} : ${b} with both numbers multiplied by the same number.`, `${a} × ${k} = ${a * k} and ${b} × ${k} = ${b * k}.`, `So the answer is ${right}.`] }
  }),
  L('halve a column, then add columns', r => {
    const M = pick(r, MIXES5), p = int(r, 1, 4), q = until(() => int(r, 1, 4), v => v !== p), k = int(r, 2, 4)
    const a = 2 * p, b = 2 * q, target = a * k + p, ans = b * k + q
    return { text: `${M.what} uses ${a} ${M.a} for every ${b} ${M.b}. How many ${M.b} go with ${target} ${M.a}?`,
      picture: table([[M.A, a, p, target], [M.B, b, q, '?']]), answer: ans,
      steps: [`Halve the first column: ${p} : ${q}.`, `${target} is ${k} × ${a} + ${p}, so do the same to the ${M.b}: ${k} × ${b} + ${q}.`, `So you need ${ans} ${M.b}.`] }
  }),
  L('story: is it the same mix?', r => {
    const M = pick(r, MIXES5), who = pick(r, NAMES), a = int(r, 2, 6), b = until(() => int(r, 2, 9), v => v !== a), k = int(r, 2, 6)
    const d = pick(r, [-1, 0, 1]) * int(r, 1, 3), C = b * k + d
    const choices = ['The right amount', `${cap(M.more)} ${M.sb}`, `${cap(M.less)} ${M.sb}`]
    const correct = d === 0 ? 0 : d > 0 ? 1 : 2
    return { text: `${M.what} uses ${a} ${M.a} for every ${b} ${M.b}. ${who} uses ${a * k} ${M.a} and ${C} ${M.b}. Compared with the ${M.sa}, ${M.be} there ${M.more} ${M.sb}, ${M.less} ${M.sb}, or the right amount?`,
      picture: table([[M.A, a, a * k], [M.B, b, C]]), answer: { choices, correct },
      steps: [`${a * k} ${M.a} is ${a} × ${k}.`, `The same mix needs ${b} × ${k} = ${b * k} ${M.b}.`, `${who} used ${C}, so the answer is: ${choices[correct]}.`] }
  }),
]

// ── t6 · Part-part-whole ratios ─────────────────────────────────────────────────────────────────────────────
const GROUPS = [
  { whole: 'A class', A: 'boys', B: 'girls', all: 'students' }, { whole: 'A club', A: 'boys', B: 'girls', all: 'members' },
  { whole: 'A fruit bowl', A: 'apples', B: 'oranges', all: 'pieces of fruit' }, { whole: 'A pet shelter', A: 'cats', B: 'dogs', all: 'pets' },
] as const
const PARTS3 = [
  { what: 'Paint is mixed', k: ['blue', 'white', 'black'] }, { what: 'A fruit punch is mixed', k: ['juice', 'soda water', 'lemonade'] },
  { what: 'A green paint is mixed', k: ['yellow', 'blue', 'white'] },
] as const
const partsWord = (n: number) => (n === 1 ? 'part' : 'parts')
const boxes = (n: number) => (n === 1 ? '1 box' : `${n} boxes`)

const T6: Level[] = [
  L('tape boxes, share the whole', r => {
    const G = pick(r, GROUPS), a = int(r, 2, 6), b = until(() => int(r, 2, 6), v => v !== a), u = int(r, 2, 12), T = (a + b) * u
    const askB = r() < 0.5, ask = askB ? G.B : G.A, c = askB ? b : a
    return { text: `${G.whole} has ${a} ${G.A} for every ${b} ${G.B}. There are ${T} ${G.all} in all. How many ${ask} are there?`,
      picture: tape([row(cap(G.A), a, !askB), row(cap(G.B), b, askB)]), answer: c * u,
      steps: [`There are ${a} + ${b} = ${a + b} boxes for ${T} ${G.all}.`, `One box holds ${T} ÷ ${a + b} = ${u}.`, `The ${ask} have ${c} boxes: ${c} × ${u}, so there are ${c * u} ${ask}.`] }
  }),
  L('pick the right way (all the boxes)', r => {
    const G = pick(r, GROUPS)
    const { a, b, u, w } = until(() => {
      const a = int(r, 2, 6), b = int(r, 2, 6), u = int(r, 2, 12), T = (a + b) * u
      const w1: [string, number] = T % b === 0 ? [`${T} ÷ ${b}`, T / b] : [`${T} − ${b}`, T - b]
      const w2: [string, number] = T % a === 0 ? [`${T} ÷ ${a}`, T / a] : [`${T} − ${a}`, T - a]
      return { a, b, u, w: [w1, w2] }
    }, ({ a, b, u, w }) => a !== b && new Set([b * u, w[0][1], w[1][1]]).size === 3)
    const T = (a + b) * u, right = `${T} ÷ ${a + b} = ${u}, then ${b} × ${u} = ${b * u} ${G.B}`
    return { text: `${G.whole} has ${a} ${G.A} for every ${b} ${G.B}. There are ${T} ${G.all}. Which way finds the number of ${G.B}?`,
      picture: eq(`${G.A} : ${G.B} = ${a} : ${b}`, [`${T} ${G.all} in all`]),
      answer: choose(r, right, w.map(([s, v]) => `${s} = ${v} ${G.B}`)),
      steps: [`Use all the boxes, the ${G.A} and the ${G.B}: ${a} + ${b} = ${a + b}.`, `One box holds ${T} ÷ ${a + b} = ${u}, and the ${G.B} have ${b} boxes.`, `So the answer is ${right}.`] }
  }),
  L('three parts', r => {
    const P = pick(r, PARTS3), p = int(r, 1, 5), q = int(r, 1, 5), s = int(r, 1, 5), w = p + q + s, u = int(r, 2, 6), T = w * u
    const i = int(r, 0, 2), c = [p, q, s][i], ask = P.k[i]
    return { text: `${P.what} ${p} ${partsWord(p)} ${P.k[0]}, ${q} ${partsWord(q)} ${P.k[1]} and ${s} ${partsWord(s)} ${P.k[2]}. You mix ${T} cups. How many cups of ${ask} do you use?`,
      picture: tape([row(cap(P.k[0]), p, i === 0), row(cap(P.k[1]), q, i === 1), row(cap(P.k[2]), s, i === 2)]), answer: c * u,
      steps: [`There are ${p} + ${q} + ${s} = ${w} boxes for ${T} cups.`, `One box holds ${T} ÷ ${w} = ${u} cups.`, `${cap(ask)} has ${boxes(c)}: ${c} × ${u}, so you use ${c * u} cups of ${ask}.`] }
  }),
  L('work backwards: one part known, find the whole', r => {
    const G = pick(r, GROUPS), a = int(r, 2, 6), b = until(() => int(r, 2, 6), v => v !== a), u = int(r, 2, 12), T = (a + b) * u
    return { text: `${G.whole} has ${a} ${G.A} for every ${b} ${G.B}. There are ${b * u} ${G.B}. How many ${G.all} are there in all?`,
      picture: tape([row(cap(G.A), a), row(cap(G.B), b, true, `${b * u} ${G.B}`)]), answer: T,
      steps: [`The ${G.B} fill ${b} boxes, so one box holds ${b * u} ÷ ${b} = ${u}.`, `All the boxes: ${a} + ${b} = ${a + b}, and ${a + b} × ${u}.`, `So there are ${T} ${G.all} in all.`] }
  }),
  L('difference given, find the whole', r => {
    const G = pick(r, GROUPS), a = int(r, 2, 5), b = until(() => int(r, 3, 9), v => v > a), u = int(r, 3, 15), diff = (b - a) * u, T = (a + b) * u
    return { text: `${G.whole} has ${a} ${G.A} for every ${b} ${G.B}. There are ${diff} more ${G.B} than ${G.A}. How many ${G.all} are there in all?`,
      picture: eq(`${G.A} : ${G.B} = ${a} : ${b}`, [`${diff} more ${G.B}`]), answer: T,
      steps: [`The ${G.B} have ${b} − ${a} = ${boxes(b - a)} more, and that is ${diff}. One box holds ${diff} ÷ ${b - a} = ${u}.`, `All the boxes: ${a} + ${b} = ${a + b}, so ${a + b} × ${u}.`, `So there are ${T} ${G.all} in all.`] }
  }),
]

// ── t7 · Change units with a rate ───────────────────────────────────────────────────────────────────────────
const UNITS = [
  { big: 'yard', bigs: 'yards', small: 'foot', smalls: 'feet', f: 3, things: ['fence', 'rug'], an: 'a' },
  { big: 'foot', bigs: 'feet', small: 'inch', smalls: 'inches', f: 12, things: ['board', 'ribbon'], an: 'a' },
  { big: 'hour', bigs: 'hours', small: 'minute', smalls: 'minutes', f: 60, things: ['train trip', 'bus trip'], an: 'an' },
  { big: 'kilometer', bigs: 'kilometers', small: 'meter', smalls: 'meters', f: 1000, things: ['bike trail', 'race'], an: 'a' },
] as const
const LEFT = [
  { u: 0, say: (n: number, x: number, who: string) => `A ribbon is ${n} yards long. ${who} cuts off ${x} feet.`, ask: 'How many feet of ribbon are left?' },
  { u: 1, say: (n: number, x: number, who: string) => `A board is ${n} feet long. ${who} saws off ${x} inches.`, ask: 'How many inches of board are left?' },
  { u: 2, say: (n: number, x: number, who: string) => `A road trip takes ${n} hours. ${who}'s family has driven for ${x} minutes.`, ask: 'How many minutes of the trip are left?' },
  { u: 3, say: (n: number, x: number, who: string) => `A race is ${n} kilometers long. ${who} has run ${fmt(x)} meters.`, ask: 'How many meters of the race are left?' },
] as const

const T7: Level[] = [
  L('table from one, change to the smaller unit', r => {
    const U = pick(r, UNITS), thing = U.things[0], n = int(r, 2, 9)
    return { text: `A ${thing} is ${n} ${U.bigs} long. 1 ${U.big} is ${fmt(U.f)} ${U.smalls}. How many ${U.smalls} long is the ${thing}?`,
      picture: table([[cap(U.bigs), '1', n], [cap(U.smalls), U.f, '?']]), answer: n * U.f,
      steps: [`1 ${U.big} is ${fmt(U.f)} ${U.smalls}, and ${U.smalls} are smaller, so multiply.`, `${n} × ${fmt(U.f)}.`, `So the ${thing} is ${fmt(n * U.f)} ${U.smalls} long.`] }
  }),
  L('bare, change to the bigger unit', r => {
    const U = pick(r, UNITS), thing = U.things[1], n = int(r, 2, 9), N = n * U.f
    return { text: `A ${thing} is ${fmt(N)} ${U.smalls} long. How many ${U.bigs} long is it?`,
      picture: eq(`${fmt(N)} ${U.smalls} = ? ${U.bigs}`, [`${fmt(U.f)} ${U.smalls} = 1 ${U.big}`]), answer: n,
      steps: [`${cap(U.bigs)} are bigger than ${U.smalls}, so divide by ${fmt(U.f)}.`, `${fmt(N)} ÷ ${fmt(U.f)} = ${n}.`, `So the ${thing} is ${n} ${U.bigs} long.`] }
  }),
  L('multiply or divide? pick the right one', r => {
    if (r() < 0.5) {
      const U = pick(r, [UNITS[0], UNITS[1], UNITS[3]])
      const n = until(() => U.f === 3 ? 3 * int(r, 2, 5) : U.f === 12 ? 12 * int(r, 2, 3) : int(r, 2, 9), v => new Set([v * U.f, v / U.f, v + U.f]).size === 3)
      const right = `${n} × ${fmt(U.f)} = ${fmt(n * U.f)} ${U.smalls}`
      return { text: `Change ${n} ${U.bigs} to ${U.smalls}. Which one is right?`, picture: eq(`${n} ${U.bigs} = ? ${U.smalls}`, [`1 ${U.big} = ${fmt(U.f)} ${U.smalls}`]),
        answer: choose(r, right, [`${n} ÷ ${fmt(U.f)} = ${fmt(n / U.f)} ${U.smalls}`, `${n} + ${fmt(U.f)} = ${fmt(n + U.f)} ${U.smalls}`]),
        steps: [`${cap(U.smalls)} are smaller than ${U.bigs}, so you need more of them.`, `More of them means multiply by ${fmt(U.f)}.`, `So the answer is ${right}.`] }
    }
    const U = pick(r, UNITS), n = until(() => int(r, 2, 9), v => new Set([v, v * U.f * U.f, v * U.f - U.f]).size === 3), N = n * U.f
    const right = `${fmt(N)} ÷ ${fmt(U.f)} = ${n} ${U.bigs}`
    return { text: `Change ${fmt(N)} ${U.smalls} to ${U.bigs}. Which one is right?`, picture: eq(`${fmt(N)} ${U.smalls} = ? ${U.bigs}`, [`${fmt(U.f)} ${U.smalls} = 1 ${U.big}`]),
      answer: choose(r, right, [`${fmt(N)} × ${fmt(U.f)} = ${fmt(N * U.f)} ${U.bigs}`, `${fmt(N)} − ${fmt(U.f)} = ${fmt(N - U.f)} ${U.bigs}`]),
      steps: [`${cap(U.bigs)} are bigger than ${U.smalls}, so you need fewer of them.`, `Fewer of them means divide by ${fmt(U.f)}.`, `So the answer is ${right}.`] }
  }),
  L('a leftover half makes a decimal', r => {
    const U = pick(r, [UNITS[1], UNITS[2], UNITS[3]]), k = int(r, 1, 9), h = U.f / 2, thing = U.things[1]
    if (r() < 0.5) {
      const N = k * U.f + h
      return { text: `A ${thing} is ${fmt(N)} ${U.smalls} long. How many ${U.bigs} long is it?`,
        picture: table([[cap(U.bigs), '1', '?'], [cap(U.smalls), U.f, N]]), answer: k + 0.5,
        steps: [`${cap(U.bigs)} are bigger, so divide by ${fmt(U.f)}.`, `${fmt(k * U.f)} ${U.smalls} is ${k} ${k === 1 ? U.big : U.bigs}, and the other ${fmt(h)} ${U.smalls} is half ${U.an} ${U.big}.`, `So the ${thing} is ${fmt(k + 0.5)} ${U.bigs} long.`] }
    }
    const n = k + 0.5, ans = k * U.f + h
    return { text: `A ${thing} is ${fmt(n)} ${U.bigs} long. How many ${U.smalls} long is it?`,
      picture: table([[cap(U.bigs), '1', n], [cap(U.smalls), U.f, '?']]), answer: ans,
      steps: [`${cap(U.smalls)} are smaller, so multiply by ${fmt(U.f)}.`, `${k} × ${fmt(U.f)} = ${fmt(k * U.f)}, and half of ${fmt(U.f)} is ${fmt(h)}.`, `So the ${thing} is ${fmt(ans)} ${U.smalls} long.`] }
  }),
  L('two-step story: change units, then take away', r => {
    const S = pick(r, LEFT), U = UNITS[S.u], who = pick(r, NAMES), n = int(r, 2, 6), all = n * U.f
    const x = U.f === 1000 ? 100 * int(r, 11, all / 100 - 1) : int(r, U.f + 1, all - 1)
    return { text: `${S.say(n, x, who)} ${S.ask}`, picture: eq(`${n} ${U.bigs} − ${fmt(x)} ${U.smalls}`), answer: all - x,
      steps: [`Change to ${U.smalls} first: ${n} × ${fmt(U.f)} = ${fmt(all)} ${U.smalls}.`, `Take away: ${fmt(all)} − ${fmt(x)}.`, `So ${fmt(all - x)} ${U.smalls} are left.`] }
  }),
]

// ── t8 · Speed ──────────────────────────────────────────────────────────────────────────────────────────────
const RIDES = [{ who: 'train', v: 'goes' }, { who: 'bus', v: 'goes' }, { who: 'boat', v: 'travels' }, { who: 'truck', v: 'drives' }] as const
const WALKERS = [
  { who: 'runner', v: 'runs', lo: 6, hi: 12 }, { who: 'horse', v: 'trots', lo: 10, hi: 16 }, { who: 'drone', v: 'flies', lo: 20, hi: 60 },
] as const
/** A trip as a number line, every tick labeled with its time, so counting ticks never misreads the hours. */
const line = (D: number, ticks: number, half = false): Picture => ({ kind: 'numline', min: 0, max: D, ticks,
  labels: Array.from({ length: ticks + 1 }, (_, i) => !half ? `${i} hr` : i % 2 === 0 ? `${i / 2} hr` : i === 1 ? '½ hr' : `${(i - 1) / 2}½ hr`) })

const T8: Level[] = [
  L('number line, one jump for each hour', r => {
    const R = pick(r, RIDES), h = int(r, 2, 6), s = int(r, 8, 60), D = s * h
    return { text: `A ${R.who} ${R.v} ${D} miles in ${h} hours. How many miles does it go in one hour?`, picture: line(D, h), answer: s,
      steps: [`Split the ${D} miles into ${h} equal jumps, one for each hour.`, `${D} ÷ ${h} = ${s}.`, `So the ${R.who} goes ${s} miles in one hour.`] }
  }),
  L('kilometers per hour, no line', r => {
    const W = pick(r, WALKERS), h = int(r, 2, 5), s = int(r, W.lo, W.hi), D = s * h
    return { text: `A ${W.who} ${W.v} ${D} kilometers in ${h} hours. What is its speed in kilometers per hour?`,
      picture: eq(`${D} kilometers in ${h} hours`, ['? kilometers per hour']), answer: s,
      steps: ['Speed is the distance divided by the hours.', `${D} ÷ ${h} = ${s}.`, `So the ${W.who}'s speed is ${s} kilometers per hour.`] }
  }),
  L('pick the right way to find speed', r => {
    const R = pick(r, RIDES), { h, s } = until(() => ({ h: int(r, 2, 6), s: int(r, 8, 60) }), ({ h, s }) => new Set([s, s * h * h, s * h - h]).size === 3), D = s * h
    const right = `${D} ÷ ${h} = ${s} miles per hour`
    return { text: `A ${R.who} ${R.v} ${D} miles in ${h} hours. Which one finds its speed?`, picture: line(D, h),
      answer: choose(r, right, [`${D} × ${h} = ${D * h} miles per hour`, `${D} − ${h} = ${D - h} miles per hour`]),
      steps: ['Speed is how far in one hour, so the distance goes first.', `Divide the miles by the hours: ${D} ÷ ${h}.`, `So the answer is ${right}.`] }
  }),
  L('half hours', r => {
    const R = pick(r, RIDES), k = int(r, 1, 3), s = 2 * int(r, 4, 30), halves = 2 * k + 1, D = (s / 2) * halves
    return { text: `A ${R.who} ${R.v} ${D} miles in ${fmt(k + 0.5)} hours. What is its speed in miles per hour?`, picture: line(D, halves, true), answer: s,
      steps: [`${fmt(k + 0.5)} hours is ${halves} half hours. ${D} ÷ ${halves} = ${s / 2} miles in each half hour.`, `Two half hours make one hour: ${s / 2} × 2.`, `So its speed is ${s} miles per hour.`] }
  }),
  L('compare two speeds', r => {
    const h1 = int(r, 2, 6), h2 = until(() => int(r, 2, 6), v => v !== h1), s1 = int(r, 30, 70)
    const s2 = r() < 0.2 ? s1 : until(() => s1 + int(r, -8, 8), v => v !== s1)
    const D1 = s1 * h1, D2 = s2 * h2
    const choices = ['The car', 'The bus', 'They go the same speed'], correct = s1 === s2 ? 2 : s1 > s2 ? 0 : 1
    return { text: `A car goes ${D1} miles in ${h1} hours. A bus goes ${D2} miles in ${h2} hours. Which one is faster?`,
      picture: table([['Car', D1, h1], ['Bus', D2, h2]], ['', 'Miles', 'Hours']), answer: { choices, correct },
      steps: [`Car: ${D1} ÷ ${h1} = ${s1} miles per hour.`, `Bus: ${D2} ÷ ${h2} = ${s2} miles per hour.`,
        correct === 2 ? `Both go ${s1} miles per hour, so the answer is: They go the same speed.` : `${Math.max(s1, s2)} is more. ${choices[correct]} is faster.`] }
  }),
]

export const G6M1_LADDERS: Record<string, Level[]> = {
  'g6m1-t1': T1, 'g6m1-t2': T2, 'g6m1-t3': T3, 'g6m1-t4': T4, 'g6m1-t5': T5, 'g6m1-t6': T6, 'g6m1-t7': T7, 'g6m1-t8': T8,
}
