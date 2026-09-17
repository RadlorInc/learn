/**
 * Grade 5 · Module 1 · Part D (topics 17–20) — practice ladders. See ./g5m1.ts for the reference shape.
 * Every level is a different KIND of question; numbers are picked per problem and the answer computed from them.
 */
import type { Picture } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

type Row = Extract<Picture, { kind: 'tape' }>['rows'][number]
type Cell = Row['cells'][number]
const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const tape = (rows: Row[]): Picture => ({ kind: 'tape', rows })
/** n equal groups of [a][b]; the b part shaded, as in the lesson. */
const groups = (n: number, a: number, b: number): Cell[] =>
  Array.from({ length: n }, (): Cell[] => [{ w: a, text: String(a) }, { w: b, text: String(b), shade: true }]).flat()
/** Three equal cells drawn, the rest named in one long cell. */
const run = (text: string, rest: string): Cell[] => [{ w: 1, text }, { w: 1, text }, { w: 1, text }, { w: 3, text: rest }]
const round2 = (x: number) => Math.round(x * 100) / 100

const choose = (r: Rng, right: string, wrong: string[]) => {
  const choices = shuffle(r, [right, ...wrong])
  return { choices, correct: choices.indexOf(right) }
}
/** Re-roll until `ok` — every generator here has plenty of good numbers, so this ends quickly. */
const until = <T>(make: () => T, ok: (t: T) => boolean): T => { let t = make(); while (!ok(t)) t = make(); return t }
const NAMES = ['Mia', 'Leo', 'Ava', 'Ben', 'Zoe', 'Sam', 'Ruby', 'Omar']
const twoNames = (r: Rng) => { const [x, y] = shuffle(r, NAMES); return [x, y] as const }

// ── t17 · Write, read and compare expressions ──────────────────────────────────────────────────────────────
const PACKS = [
  { who: 'A fruit stand', box: 'bags', one: 'bag', a: 'apples', b: 'pears', all: 'pieces of fruit' },
  { who: 'A toy shop', box: 'boxes', one: 'box', a: 'cars', b: 'trucks', all: 'toys' },
  { who: 'A bakery', box: 'trays', one: 'tray', a: 'muffins', b: 'rolls', all: 'treats' },
] as const

const T17: Level[] = [
  { style: 'find the total from a tape', make: r => {
    const n = int(r, 2, 5), a = int(r, 2, 9), b = int(r, 2, 6), s = pick(r, PACKS), one = a + b
    return { text: `${s.who} packs ${n} ${s.box}. Each one has ${a} ${s.a} and ${b} ${s.b}, so the total is ${n} × (${a} + ${b}). How many ${s.all} is that?`,
      picture: tape([{ label: `${n} ${s.box}`, cells: groups(n, a, b), brace: '?' }]), answer: n * one,
      steps: [`The ( ) keep one together: ${a} + ${b} = ${one}.`, `${n} × (${a} + ${b}) is ${n} times as much: ${n} × ${one}.`, `So there are ${fmt(n * one)} ${s.all}.`] }
  } },
  { style: 'bare expression', make: r => {
    const n = int(r, 4, 12), a = int(r, 6, 25), b = int(r, 3, 15), one = a + b
    return { text: `Find ${n} × (${a} + ${b}).`, picture: eq(`${n} × (${a} + ${b}) = ?`), answer: n * one,
      steps: [`Keep ${a} + ${b} together first: ${a} + ${b} = ${one}.`, `${n} × (${a} + ${b}) is ${n} times as much as ${one}.`, `So ${n} × (${a} + ${b}) = ${fmt(n * one)}.`] }
  } },
  { style: 'pick the expression for words or a tape', make: r => {
    // n must differ from both addends: n = b makes (n + a) × b the same sentence reordered, and n = a muddles the words.
    const { n, a, b } = until(() => ({ n: int(r, 3, 9), a: int(r, 2, 9), b: int(r, 2, 9) }), ({ n, a, b }) => n !== a && n !== b)
    const right = `${n} × (${a} + ${b})`
    const answer = choose(r, right, [`${n} × ${a} + ${b}`, `(${n} + ${a}) × ${b}`])
    const steps = [`${a} + ${b} is one part, so keep it together: (${a} + ${b}).`, `Then ${n} times as much as that part.`, `So the answer is ${right}.`]
    if (r() < 0.5) return { text: `Which number sentence means "add ${a} and ${b}, then multiply by ${n}"?`, picture: eq(`add ${a} and ${b}, then multiply by ${n}`), answer, steps }
    const s = pick(r, PACKS)
    return { text: `${s.who} packs ${n} ${s.box}. Each one has ${a} ${s.a} and ${b} ${s.b}. Which number sentence shows all the ${s.all}?`,
      picture: tape([{ label: `${n} ${s.box}`, cells: groups(n, a, b) }]), answer, steps }
  } },
  { style: 'compare two expressions without working them out', make: r => {
    const n = int(r, 12, 30), a = int(r, 20, 60), b = int(r, 5, 15)
    const withP = `${n} × (${a} + ${b})`, noP = `${n} × ${a} + ${b}`
    const first = r() < 0.5
    const [left, rightE] = first ? [withP, noP] : [noP, withP]
    const sign = first ? '>' : '<'
    return { text: `Compare ${left} and ${rightE} without working them out. Which sign goes between them?`,
      picture: eq(`${left} ? ${rightE}`), answer: choose(r, sign, ['<', '>', '='].filter(x => x !== sign)),
      steps: [`Both start with ${n} groups of ${a}.`, `${withP} also has ${n} groups of ${b}. ${noP} adds just one ${b}.`, `So ${withP} is more. The answer is ${sign}.`] }
  } },
  { style: 'who has more, from a story', make: r => {
    const n = int(r, 8, 20), a = int(r, 5, 12), b = int(r, 2, 6), s = pick(r, PACKS)
    const [x, y] = twoNames(r)
    return { text: `${x} packs ${n} ${s.box}, each with ${a} ${s.a} and ${b} ${s.b}. ${y} packs ${n} ${s.box} of ${a} ${s.a}, then puts ${b} ${s.b} in one more ${s.one}. Without working them out, who packs more?`,
      picture: eq(`${n} × (${a} + ${b})`, [`${n} × ${a} + ${b}`]), answer: choose(r, x, [y, 'They pack the same']),
      steps: [`Both pack ${n} ${s.box} of ${a} ${s.a}.`, `${x} also has ${b} ${s.b} in every one. ${y} has just ${b} ${s.b} in all.`, `So ${x} packs more. The answer is ${x}.`] }
  } },
]

// ── t18 · Make a story for an expression ────────────────────────────────────────────────────────────────────
const T18: Level[] = [
  { style: 'solve the story the board tells', make: r => {
    const n = int(r, 3, 6), a = int(r, 5, 9), b = int(r, 2, 6), one = a + b
    const [box, thing] = pick(r, [['bags', 'marbles'], ['boxes', 'crayons'], ['cups', 'beads']] as const)
    return { text: `The board shows ${n} × (${a} + ${b}). A class makes this story: ${n} ${box}, each with ${a} red ${thing} and ${b} green ${thing}. How many ${thing} are in the story?`,
      picture: tape([{ label: `${n} ${box}`, cells: groups(n, a, b), brace: `? ${thing}` }]), answer: n * one,
      steps: [`The ( ) happen first: one has ${a} + ${b} = ${one} ${thing}.`, `Then ${n} × means ${n} of those: ${n} × ${one}.`, `So there are ${fmt(n * one)} ${thing}.`] }
  } },
  { style: 'a story with − in the ( )', make: r => {
    const { n, a, b } = until(() => { const a = int(r, 8, 15); return { n: int(r, 4, 9), a, b: int(r, 2, a - 3) } },
      ({ n, a, b }) => ![n, a, b].includes(n * (a - b)))
    const [kids, thing] = pick(r, [['kids', 'stickers'], ['friends', 'cards'], ['players', 'tokens']] as const)
    return { text: `The board shows ${n} × (${a} − ${b}). A class makes this story: ${n} ${kids} each get ${a} ${thing}, and each one gives ${b} away. How many ${thing} are left in all?`,
      picture: eq(`${n} × (${a} − ${b})`), answer: n * (a - b),
      steps: [`The ( ) happen first: each keeps ${a} − ${b} = ${a - b} ${thing}.`, `Then ${n} × means ${n} ${kids} with that many each: ${n} × ${a - b}.`, `So ${fmt(n * (a - b))} ${thing} are left.`] }
  } },
  { style: 'pick the story that matches the board', make: r => {
    const { n, a } = until(() => ({ n: int(r, 3, 6), a: int(r, 4, 9) }), ({ n, a }) => n !== a)
    const b = int(r, 2, 6)
    const right = `${n} bags, each with ${a} red and ${b} green marbles`
    return { text: `The board shows ${n} × (${a} + ${b}). Which story matches it?`, picture: eq(`${n} × (${a} + ${b})`),
      answer: choose(r, right, [`${n} bags of ${a} red marbles, plus ${b} green ones`, `${a} bags, each with ${n} red and ${b} green marbles`]),
      steps: [`The ( ) happen first, so ${a} + ${b} is one bag: ${a} red and ${b} green.`, `${n} × means ${n} of that whole bag.`, `So the story is: ${right}.`] }
  } },
  { style: 'pick the number sentence for a story', make: r => {
    const k = int(r, 3, 8), each = int(r, 4, 12)
    if (r() < 0.5) {
      const g = int(r, 3, 15), T = k * each + g, right = `(${T} − ${g}) ÷ ${k}`
      return { text: `Sam has ${T} stickers. He gives ${g} away. Then he shares the rest equally among ${k} friends. Which number sentence tells this story?`,
        picture: tape([{ cells: [{ w: g, text: String(g), shade: true }, ...Array.from({ length: k }, (): Cell => ({ w: each }))], brace: `${T} stickers` }]),
        answer: choose(r, right, [`${T} − (${g} ÷ ${k})`, `(${T} + ${g}) ÷ ${k}`]),
        steps: [`Giving ${g} away happens first, so it goes in the ( ): (${T} − ${g}).`, `Then the rest is shared among ${k} friends: ÷ ${k}.`, `So the answer is ${right}.`] }
    }
    const j = int(r, 2, 5), T = k * each, right = `(${T} ÷ ${k}) + ${j}`
    return { text: `In class, ${T} children sit in ${k} equal rows. Then ${j} more children join each row. Which number sentence shows how many children are in each row now?`,
      picture: tape([{ label: `${k} rows`, cells: Array.from({ length: k }, (): Cell => ({ w: each })), brace: `${T} children` },
        { label: 'One row', cells: [{ w: each }, { w: j, text: String(j), shade: true }] }]),
      answer: choose(r, right, [`${T} ÷ (${k} + ${j})`, `(${T} + ${j}) ÷ ${k}`]),
      steps: [`Sitting in ${k} equal rows happens first, so it goes in the ( ): (${T} ÷ ${k}).`, `Then ${j} more children join each row: + ${j}.`, `So the answer is ${right}.`] }
  } },
  { style: 'solve a bigger story with ÷ after the ( )', make: r => {
    const { k, q } = until(() => ({ k: int(r, 14, 25), q: int(r, 15, 30) }), ({ k, q }) => k !== q), total = k * q
    const p = int(r, Math.round(total * 0.4), Math.round(total * 0.6)), o = total - p
    const [shop, a, b, box] = pick(r, [['a shop', 'red pens', 'green pens', 'boxes'], ['a bakery', 'plain cookies', 'chocolate cookies', 'bags'], ['a farm', 'brown eggs', 'white eggs', 'cartons']] as const)
    return { text: `The board shows (${p} + ${o}) ÷ ${k}. A class makes this story: ${shop} has ${p} ${a} and ${o} ${b}. It packs them all into ${box} of ${k}. How many ${box} does it fill?`,
      picture: eq(`(${p} + ${o}) ÷ ${k} = ?`), answer: q,
      steps: [`The ( ) happen first: ${p} + ${o} = ${fmt(total)}.`, `Then pack them in ${box} of ${k}: ${fmt(total)} ÷ ${k}.`, `So it fills ${fmt(q)} ${box}.`] }
  } },
]

// ── t19 · Multi-step stories with × and ÷ ───────────────────────────────────────────────────────────────────
/** B boxes of M markers shared by C classes, q each: whole numbers, and q is none of the numbers in the picture. */
const markers = (r: Rng) => until(() => {
  const B = int(r, 12, 25), M = int(r, 12, 48), T = B * M
  const cs = Array.from({ length: 29 }, (_, i) => i + 12).filter(c => T % c === 0 && T / c >= 10 && ![B, M, c].includes(T / c) && c !== B && c !== M)
  return { B, M, T, C: cs.length ? pick(r, cs) : 0 }
}, x => x.C > 0)
const boxTape = (M: number, B: number, C: number): Picture =>
  tape([{ label: 'Boxes', cells: run(String(M), `… ${B} boxes`) }, { label: 'Classes', cells: run('?', `… ${C} classes`) }])

const T19: Level[] = [
  { style: 'hidden number given, then share', make: r => {
    const { B, M, T, C } = markers(r), q = T / C
    return { text: `A school buys ${B} boxes of markers with ${M} in each box. That is ${B} × ${M} = ${fmt(T)} markers. They are shared equally among ${C} classes. How many markers does each class get?`,
      picture: eq(`${fmt(T)} ÷ ${C} = ?`), answer: q,
      steps: [`The hidden number is already found: ${fmt(T)} markers in all.`, `Share them among ${C} classes: ${fmt(T)} ÷ ${C}.`, `So each class gets ${fmt(q)} markers.`] }
  } },
  { style: 'multiply, then divide', make: r => {
    const { B, M, T, C } = markers(r), q = T / C
    return { text: `A school buys ${B} boxes of markers. Each box has ${M} markers. The markers are shared equally among ${C} classes. How many markers does each class get?`,
      picture: boxTape(M, B, C), answer: q,
      steps: [`First find the hidden number, all the markers: ${B} × ${M} = ${fmt(T)}.`, `Then share them equally among ${C} classes: ${fmt(T)} ÷ ${C}.`, `So each class gets ${fmt(q)} markers.`] }
  } },
  { style: 'divide first, then multiply', make: r => {
    const { k, u, m } = until(() => ({ k: int(r, 3, 15), u: int(r, 4, 15), m: int(r, 16, 45) }), ({ k, u, m }) => ![k, m, k * u].includes(m * u))
    const P = k * u, thing = pick(r, ['packs of markers', 'boxes of pencils', 'sets of paints'])
    const unit = thing.split(' ')[0]
    return { text: `${k} ${thing} cost $${P}. Every one costs the same. How many dollars do ${m} ${unit} cost?`,
      picture: tape([{ label: `${k} ${unit}`, cells: [{ w: round2(6 * k / m), text: `$${P}`, shade: true }] }, { label: `${m} ${unit}`, cells: [{ w: 6, text: '? dollars' }] }]),
      answer: m * u,
      steps: [`First find the hidden number, the cost of one: ${P} ÷ ${k} = ${u} dollars.`, `Then find the cost of ${m}: ${m} × ${u}.`, `So ${m} ${unit} cost $${fmt(m * u)}.`] }
  } },
  { style: 'whose answer is right', make: r => {
    const { B, M, T, C } = markers(r), q = T / C
    const [x, y] = twoNames(r), rightFirst = r() < 0.5
    const [first, second] = rightFirst ? [[x, q], [y, T]] : [[y, T], [x, q]]
    return { text: `A school buys ${B} boxes of markers. Each box has ${M} markers. The markers are shared equally among ${C} classes. ${first[0]} says each class gets ${fmt(first[1] as number)} markers. ${second[0]} says each class gets ${fmt(second[1] as number)}. Who is right?`,
      picture: boxTape(M, B, C), answer: choose(r, x, [y]),
      steps: [`All the markers: ${B} × ${M} = ${fmt(T)}. ${y} stopped at this hidden number.`, `Each class gets ${fmt(T)} ÷ ${C} = ${fmt(q)}.`, `So ${x} is right.`] }
  } },
  { style: 'two steps with a bigger number', make: r => {
    const { H, E, G } = until(() => ({ H: int(r, 100, 250), E: int(r, 12, 36), G: int(r, 30, 80) }),
      ({ H, E, G }) => (H * E) % G === 0 && H * E / G >= 10 && ![H, E, G].includes(H * E / G))
    const T = H * E, q = T / G
    return { text: `An art store has ${H} boxes of markers. Each box holds ${E} markers. The store packs all the markers into bags of ${G}. How many bags does it fill?`,
      picture: tape([{ label: 'Boxes', cells: run(String(E), `… ${H} boxes`) }, { label: 'Bags', cells: [{ w: 2, text: String(G) }, { w: 2, text: String(G) }, { w: 2, text: '… ? bags' }] }]),
      answer: q,
      steps: [`First find the hidden number, all the markers: ${H} × ${E} = ${fmt(T)}.`, `Then put them in bags of ${G}: ${fmt(T)} ÷ ${G}.`, `So the store fills ${fmt(q)} bags.`] }
  } },
]

// ── t20 · Multi-step stories with all four operations ───────────────────────────────────────────────────────
const T20: Level[] = [
  { style: 'multiply, then take away', make: r => {
    const { R, S, N } = until(() => { const R = int(r, 12, 36), S = int(r, 15, 40); return { R, S, N: int(r, Math.round(R * S * 0.25), Math.round(R * S * 0.75)) } },
      ({ R, S, N }) => ![R, S, N].includes(R * S - N))
    const all = R * S, e = all - N, sold = round2(6 * N / all)
    return { text: `A movie theater has ${R} rows of seats. Each row has ${S} seats. For one show, ${N} tickets are sold. How many seats are still empty?`,
      picture: tape([{ label: 'Rows', cells: run(String(S), `… ${R} rows`) }, { label: 'Seats', cells: [{ w: sold, text: `${N} sold`, shade: true }, { w: round2(6 - sold), text: '? empty' }] }]),
      answer: e,
      steps: [`Part 1, all the seats: ${R} × ${S} = ${fmt(all)}.`, `Part 2: the sold seats are part of them, so take them away: ${fmt(all)} − ${N}.`, `So ${fmt(e)} seats are still empty.`] }
  } },
  { style: 'pick the plan', make: r => {
    const p = int(r, 100, 300), q = int(r, 100, 300), c = int(r, 5, 12)
    const right = `Add ${p} and ${q}, then multiply by ${c}`
    return { text: `The theater sells ${p} tickets for the first show and ${q} tickets for the second show. Each ticket costs $${c}. Which plan finds how many dollars all the tickets cost?`,
      picture: tape([{ label: 'Tickets', cells: [{ w: round2(6 * p / (p + q)), text: String(p), shade: true }, { w: round2(6 * q / (p + q)), text: String(q) }] },
        { label: 'Dollars', cells: run(`$${c}`, '… each ticket'), brace: '? dollars' }]),
      answer: choose(r, right, [`Multiply ${p} by ${c}, then add ${q}`, `Add ${p} and ${q}, then add ${c}`]),
      steps: ['Part 1: all the tickets from both shows, so add.', `Part 2: every ticket costs $${c}, so multiply.`, `So the plan is: ${right}.`] }
  } },
  { style: 'divide, then take away', make: r => {
    const { R, s, t } = until(() => { const s = int(r, 18, 40); return { R: int(r, 12, 24), s, t: int(r, 3, s - 10) } },
      ({ R, s, t }) => ![R, t, R * s].includes(s - t))
    const T = R * s, e = s - t
    return { text: `A theater has ${fmt(T)} seats in ${R} equal rows. In one row, ${t} seats are taken. How many seats in that row are empty?`,
      picture: tape([{ label: 'All seats', cells: run('', `… ${R} rows`), brace: `${fmt(T)} seats` },
        { label: 'One row', cells: [{ w: round2(t / s), text: String(t), shade: true }, { w: round2(e / s), text: '?' }] }]),
      answer: e,
      steps: [`Part 1, the seats in each row: ${fmt(T)} ÷ ${R} = ${s}.`, `Part 2, take away the ${t} taken seats: ${s} − ${t}.`, `So ${fmt(e)} seats in that row are empty.`] }
  } },
  { style: 'three parts: two products, then take away', make: r => {
    const { R, S, c, k } = until(() => ({ R: int(r, 20, 32), S: int(r, 24, 36), c: int(r, 8, 14), k: int(r, 20, 30) }),
      ({ R, S, c, k }) => R * S - c * k >= 50 && ![R, S, c, k].includes(R * S - c * k))
    const all = R * S, kids = c * k, e = all - kids, taken = round2(6 * kids / all)
    return { text: `A theater has ${R} rows of seats with ${S} seats in each row. A school brings ${c} classes of ${k} students, and each student takes one seat. How many seats are still empty?`,
      picture: tape([{ label: 'Rows', cells: run(String(S), `… ${R} rows`) }, { label: 'Seats', cells: [{ w: taken, text: `${c} classes`, shade: true }, { w: round2(6 - taken), text: '? empty' }] }]),
      answer: e,
      steps: [`Part 1, all the seats: ${R} × ${S} = ${fmt(all)}. Part 2, all the students: ${c} × ${k} = ${fmt(kids)}.`, `Part 3, take the students away from the seats: ${fmt(all)} − ${fmt(kids)}.`, `So ${fmt(e)} seats are still empty.`] }
  } },
  { style: 'three parts: add, multiply, find the change', make: r => {
    const { s, a, p, P } = until(() => {
      const s = int(r, 20, 32), a = int(r, 3, 9), p = int(r, 5, 12), cost = (s + a) * p
      return { s, a, p, P: Math.ceil((cost + 1) / 50) * 50 }
    }, ({ s, a, p, P }) => ![s, a, p, P].includes(P - (s + a) * p))
    const people = s + a, cost = people * p, change = P - cost
    return { text: `A class of ${s} students and ${a} adults go to the movies. Each ticket costs $${p}. They pay with $${P}. How many dollars of change do they get?`,
      picture: eq(`${s} students + ${a} adults`, [`$${p} a ticket`, `pay with $${P}`]), answer: change,
      steps: [`Part 1, all the people: ${s} + ${a} = ${people}. Part 2, all the tickets: ${people} × ${p} = ${cost} dollars.`, `Part 3, the change: ${P} − ${cost}.`, `So they get $${fmt(change)} in change.`] }
  } },
]

export const LADDERS_D: Record<string, Level[]> = { 'g5m1-t17': T17, 'g5m1-t18': T18, 'g5m1-t19': T19, 'g5m1-t20': T20 }
