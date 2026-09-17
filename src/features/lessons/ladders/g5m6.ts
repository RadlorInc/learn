/**
 * Grade 5 · Module 6 — the coordinate plane. Practice ladders, easiest style first (see ../adaptive.ts and the reference
 * ladders in ./g5m1.ts). Every question stays inside its lesson: across first then up, plotting a pair, two patterns
 * from two rules, the top row goes across, subtract the numbers that differ, blocks on a map grid.
 * ⚠️ A "which point" choice is written "Point B", never a bare "B": the picture's own label is the letter, and the gate
 * reads a choice found inside a label as a giveaway. Place choices are "the park" against a "Park" label, for the same reason.
 */
import type { Picture } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

type Pt = { x: number; y: number; label?: string }
const grid = (max: number, points: Pt[]): Picture => ({ kind: 'coord', min: 0, max, points })
const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const P = (x: number, y: number) => `(${x}, ${y})`
const choose = (r: Rng, right: string, wrong: string[]) => {
  const choices = shuffle(r, [right, ...wrong])
  return { choices, correct: choices.indexOf(right) }
}
const until = <T>(gen: () => T, ok: (x: T) => boolean): T => { let x = gen(); while (!ok(x)) x = gen(); return x }
const distinct = (xs: string[]) => new Set(xs).size === xs.length
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'M', 'N', 'P', 'Q', 'R', 'S', 'T']
const letters = (r: Rng, n: number) => shuffle(r, LETTERS).slice(0, n)
const NAMES = ['Kim', 'Ben', 'Zoe', 'Raj', 'Ana', 'Leo', 'Mia', 'Sam']
const ORD = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th']

/** Every number a picture's labels print (a table row also read joined up) — the same reading the gate does. */
const shown = (pic: Picture) => {
  const texts: string[] = []
  const walk = (v: unknown) => {
    if (typeof v === 'string') texts.push(v)
    else if (Array.isArray(v)) { if (v.length && v.every(x => typeof x === 'string')) texts.push(v.join('')); v.forEach(walk) }
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  walk(pic)
  return new Set(texts.flatMap(t => t.match(/\d[\d,]*/g) ?? []).map(t => t.replace(/,/g, '')))
}
const hides = (pic: Picture, a: number) => a < 10 || !shown(pic).has(String(a))

/** `n` different whole-number spots from lo to hi. */
const spots = (r: Rng, n: number, lo: number, hi: number, ok: (ps: [number, number][]) => boolean = () => true) =>
  until(() => Array.from({ length: n }, () => [int(r, lo, hi), int(r, lo, hi)] as [number, number]),
    ps => distinct(ps.map(([x, y]) => P(x, y))) && ok(ps))

// ── t1 · Points on a grid ───────────────────────────────────────────────────────────────────────────────────
const GARDENS = [
  { who: 'A bee', places: ['Flower', 'Rock', 'Tree'] },
  { who: 'A frog', places: ['Pond', 'Log', 'Bush'] },
  { who: 'A bird', places: ['Nest', 'Fence', 'Shed'] },
]

const T1: Level[] = [
  { style: 'how far across or how far up, one point', make: r => {
    const [L] = letters(r, 1), x = int(r, 1, 6), y = int(r, 1, 6), pic = grid(6, [{ x, y, label: L }])
    if (r() < 0.5) return { text: `How far across is point ${L}?`, picture: pic, answer: x,
      steps: ['Start at 0 in the corner.', `Walk along the bottom until you are right under point ${L}.`, `Point ${L} is ${x} across.`] }
    return { text: `How far up is point ${L}?`, picture: pic, answer: y,
      steps: [`Go across until you are right under point ${L}.`, 'Now count up to the point.', `Point ${L} is ${y} up.`] }
  } },
  { style: 'pick the pair for one of three points', make: r => {
    const [[x, y], o1, o2] = spots(r, 3, 1, 9, ([[x, y], [ox, oy]]) => x !== y && P(ox, oy) !== P(y, x))
    const [L, M, N] = letters(r, 3)
    return { text: `Which pair tells where point ${L} is?`,
      picture: grid(10, shuffle(r, [{ x, y, label: L }, { x: o1[0], y: o1[1], label: M }, { x: o2[0], y: o2[1], label: N }])),
      answer: choose(r, P(x, y), [P(y, x), P(o1[0], o1[1])]),
      steps: [`Go across first: point ${L} is ${x} across.`, `Then go up: point ${L} is ${y} up.`, `Across comes first, so ${L} is at ${P(x, y)}.`] }
  } },
  { style: 'spot the mistake: across and up swapped', make: r => {
    const [[x, y], o] = spots(r, 2, 1, 9, ([[x, y]]) => x !== y)
    const [L, M] = letters(r, 2), who = pick(r, NAMES), right = `Point ${L} is at ${P(x, y)}.`
    return { text: `${who} says point ${L} is at ${P(y, x)}. What is true?`,
      picture: grid(10, [{ x, y, label: L }, { x: o[0], y: o[1], label: M }]),
      answer: choose(r, right, [`${who} is right.`, `Point ${L} is at ${P(y, y)}.`]),
      steps: [`${who} wrote the number up first.`, `Go across first: ${L} is ${x} across. Then go up: ${y} up.`, `So: ${right}`] }
  } },
  { style: 'story: a place on a garden map', make: r => {
    const g = pick(r, GARDENS)
    const [[x, y], o1, o2] = spots(r, 3, 1, 9, ([[x, y], [ax, ay], [bx, by]]) => x !== y && P(ax, ay) !== P(y, x) && P(bx, by) !== P(y, x))
    const [place, p1, p2] = shuffle(r, g.places)
    return { text: `A map of the garden is a grid. ${g.who} is at the ${place.toLowerCase()}. Which pair tells where it is?`,
      picture: grid(10, [{ x, y, label: place }, { x: o1[0], y: o1[1], label: p1 }, { x: o2[0], y: o2[1], label: p2 }]),
      answer: choose(r, P(x, y), [P(y, x), P(o1[0], o1[1])]),
      steps: [`Go across first: the ${place.toLowerCase()} is ${x} across.`, `Then go up: it is ${y} up.`, `So it is at ${P(x, y)}.`] }
  } },
  { style: 'two steps: start at a point, move, then name the pair', make: r => {
    const { x0, y0, dx, dy } = until(() => ({ x0: int(r, 1, 5), y0: int(r, 1, 5), dx: int(r, 1, 4), dy: int(r, 1, 4) }),
      m => distinct([P(m.x0 + m.dx, m.y0 + m.dy), P(m.y0 + m.dy, m.x0 + m.dx), P(m.dx, m.dy)]))
    const x = x0 + dx, y = y0 + dy, [L] = letters(r, 1)
    return { text: `Start at point ${L}. Go ${dx} more across and ${dy} more up. Which pair tells where you land?`,
      picture: grid(10, [{ x: x0, y: y0, label: L }]),
      answer: choose(r, P(x, y), [P(y, x), P(dx, dy)]),
      steps: [`Point ${L} is at ${P(x0, y0)}.`, `Across: ${x0} + ${dx} = ${x}. Up: ${y0} + ${dy} = ${y}.`, `Across first, so you land at ${P(x, y)}.`] }
  } },
]

// ── t2 · Plot a point ───────────────────────────────────────────────────────────────────────────────────────
/** Lettered points in random letter order; the choices are "Point A", "Point B", … and `correct` is the target's. */
const lettered = (r: Rng, ps: [number, number][]) => {
  const ls = letters(r, ps.length).sort()
  const order = shuffle(r, ps.map((_, i) => i))
  const label = (i: number) => ls[order.indexOf(i)]
  return { points: ps.map((p, i) => ({ x: p[0], y: p[1], label: label(i) })), label, choices: ls.map(l => `Point ${l}`) }
}
const GAMES = [
  { who: 'Sam hides a toy', it: 'the toy', places: ['Pond', 'Slide', 'Swing', 'Bench'] },
  { who: 'Ava buries a coin', it: 'the coin', places: ['Tent', 'Cave', 'Palm', 'Boat'] },
  { who: 'Eli parks his bike', it: 'the bike', places: ['Gate', 'Shop', 'Well', 'Mill'] },
]

const T2: Level[] = [
  { style: 'which point is at the pair (swap nearby)', make: r => {
    const x = int(r, 1, 6), y = until(() => int(r, 1, 6), v => v !== x), same = pick(r, [x, y])
    const g = lettered(r, [[x, y], [y, x], [same, same]]), L = g.label(0)
    return { text: `Which point is at ${P(x, y)}?`, picture: grid(6, g.points), answer: { choices: g.choices, correct: g.choices.indexOf(`Point ${L}`) },
      steps: [`Start at 0. Go ${x} across.`, `Then go ${y} up.`, `Point ${L} is there.`] }
  } },
  { style: 'a pair with a 0: a point on the edge', make: r => {
    const v = int(r, 1, 8), zeroFirst = r() < 0.5, [x, y] = zeroFirst ? [0, v] : [v, 0]
    const g = lettered(r, [[x, y], [y, x], [v, v]]), L = g.label(0)
    return { text: `Which point is at ${P(x, y)}? Watch the 0.`, picture: grid(8, g.points), answer: { choices: g.choices, correct: g.choices.indexOf(`Point ${L}`) },
      steps: zeroFirst ? ['The first number is 0, so you do not go across at all.', `Go ${v} up the side.`, `Point ${L} is there.`]
        : [`Go ${v} across along the bottom.`, 'The second number is 0, so you do not go up at all.', `Point ${L} is there.`] }
  } },
  { style: 'spot the mistake: went up first', make: r => {
    const [[x, y], o] = spots(r, 2, 1, 9, ([[x, y], [ox, oy]]) => x !== y && P(ox, oy) !== P(y, x))
    const g = lettered(r, [[x, y], [y, x], o]), R = g.label(0), W = g.label(1), O = g.label(2), who = pick(r, NAMES)
    const right = `${who} went up first. The dot goes at point ${R}.`
    return { text: `${who} plotted ${P(x, y)} and put the dot at point ${W}. What is true?`, picture: grid(10, g.points),
      answer: choose(r, right, [`${who} is right.`, `The dot goes at point ${O}.`]),
      steps: [`${P(x, y)} means ${x} across, then ${y} up.`, `Point ${W} is ${y} across and ${x} up, so ${who} went up first.`, `So: ${right}`] }
  } },
  { style: 'story: which place is at the pair', make: r => {
    const s = pick(r, GAMES)
    const [x, y] = spots(r, 1, 1, 9, ([[x, y]]) => x !== y && Math.abs(x - y) > 1)[0]
    const near: [number, number] = pick(r, [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]])
    const [o] = spots(r, 1, 1, 9, ([p]) => distinct([P(x, y), P(y, x), P(...near), P(...p)]))
    const names = shuffle(r, s.places), spotsAll: [number, number][] = [[x, y], [y, x], near, o]
    const by = (n: string) => `by the ${n.toLowerCase()}`
    return { text: `${s.who} on a grid map at ${P(x, y)}. Where is ${s.it}?`,
      picture: grid(10, spotsAll.map((p, i) => ({ x: p[0], y: p[1], label: names[i] }))),
      answer: choose(r, by(names[0]), names.slice(1).map(by)),
      steps: [`Start at 0. Go ${x} across.`, `Then go ${y} up.`, `So ${s.it} is ${by(names[0])}.`] }
  } },
  { style: 'two clues: across from one point, up from another', make: r => {
    const ps = spots(r, 2, 1, 9, ([[ax, ay], [bx, by]]) => ax !== bx && ay !== by && distinct([P(ax, ay), P(bx, by), P(ax, by), P(bx, ay), P(by, ax)]))
    const [[ax, ay], [bx, by]] = ps
    const g = lettered(r, [[ax, by], [bx, ay], [by, ax]])
    const [CA, CB] = shuffle(r, LETTERS.filter(l => !g.points.some(p => p.label === l))).slice(0, 2)
    const L = g.label(0)
    return { text: `The cat is as far across as point ${CA} and as far up as point ${CB}. Which point is the cat?`,
      picture: grid(10, [{ x: ax, y: ay, label: CA }, { x: bx, y: by, label: CB }, ...g.points]),
      answer: { choices: g.choices, correct: g.choices.indexOf(`Point ${L}`) },
      steps: [`Point ${CA} is ${ax} across. Point ${CB} is ${by} up.`, `So the cat is at ${P(ax, by)}: go ${ax} across, then ${by} up.`, `Point ${L} is there.`] }
  } },
]

// ── t3 · Two number patterns ────────────────────────────────────────────────────────────────────────────────
const pat = (cols: number, a: string[], b: string[]): Picture =>
  ({ kind: 'table', head: ['', ...ORD.slice(0, cols)], rows: [['A', ...a], ['B', ...b]], rowHead: true })
const terms = (step: number, n: number) => Array.from({ length: n }, (_, i) => String(i * step))
const rules = (r: Rng) => { const a = int(r, 2, 5), k = int(r, 2, 4); return { a, k, b: a * k } }
const rulesText = (a: number, b: number) => `Pattern A: start at 0, add ${a}. Pattern B: start at 0, add ${b}.`
const STORIES3 = [
  { names: ['Mia', 'Leo'], unit: 'dollars', verb: 'saves', has: 'has', time: 'week' },
  { names: ['Ava', 'Ben'], unit: 'pages', verb: 'reads', has: 'has read', time: 'day' },
  { names: ['Kim', 'Raj'], unit: 'stamps', verb: 'gets', has: 'has', time: 'week' },
]

const T3: Level[] = [
  { style: 'table: follow pattern B to the next numbers', make: r => {
    const { a, b } = rules(r), n = int(r, 4, 5), ans = (n - 1) * b
    const pic = pat(5, terms(a, 5), ['0', String(b), String(2 * b), '?', '?'])
    return { text: `${rulesText(a, b)} What is the ${ORD[n - 1]} number in pattern B?`, picture: pic, answer: ans,
      steps: [`Pattern B starts at 0 and adds ${b} each time.`, `Count on from ${2 * b}: ${terms(b, n).slice(3).join(', ')}.`, `So the ${ORD[n - 1]} number is ${ans}.`] }
  } },
  { style: 'one rule in words, no table', make: r => {
    const b = int(r, 3, 12), n = int(r, 5, 8), ans = (n - 1) * b
    return { text: `A pattern starts at 0 and adds ${b} each time. What is the ${ORD[n - 1]} number?`, picture: eq(`0, ${b}, ${2 * b}, …`), answer: ans,
      steps: [`The 1st number is 0, and each new number adds ${b}.`, `Count on: ${terms(b, n).join(', ')}.`, `So the ${ORD[n - 1]} number is ${ans}.`] }
  } },
  { style: 'compare down the columns: how many times', make: r => {
    const { a, k, b } = rules(r)
    return { text: `${rulesText(a, b)} Each number in pattern B is how many times the number above it in pattern A?`,
      picture: pat(5, terms(a, 5), terms(b, 5)), answer: k,
      steps: [`Line them up: ${a} and ${b}, ${2 * a} and ${2 * b}.`, `${a} × ${k} = ${b} and ${2 * a} × ${k} = ${2 * b}.`, `So each number in pattern B is ${k} times the number in pattern A.`] }
  } },
  { style: 'spot the mistake: always the same amount more', make: r => {
    const { a, k, b } = rules(r), who = pick(r, NAMES), d = b - a, right = `B is always ${k} times as much as A.`
    return { text: `${rulesText(a, b)} ${who} says pattern B is always ${d} more than pattern A. What is true?`,
      picture: pat(4, terms(a, 4), terms(b, 4)), answer: choose(r, right, [`${who} is right.`, `B is always ${k + 1} times as much as A.`]),
      steps: [`${b} − ${a} is ${d}, but ${2 * b} − ${2 * a} is ${2 * d}. So it is not always ${d} more.`, `${a} × ${k} = ${b} and ${2 * a} × ${k} = ${2 * b}.`, `So: ${right}`] }
  } },
  { style: 'two-step story: how many more after some weeks', make: r => {
    const s = pick(r, STORIES3)
    const { a, b, n, pic } = until(() => {
      const { a, b } = rules(r), n = int(r, 4, 6)
      const row = (step: number, known: number) => Array.from({ length: n + 1 }, (_, i) => (i <= known ? String(i * step) : '?'))
      const pic: Picture = { kind: 'table', head: [s.time === 'week' ? 'Week' : 'Day', ...Array.from({ length: n + 1 }, (_, i) => String(i))],
        rows: [[s.names[0], ...row(a, 2)], [s.names[1], ...row(b, 1)]], rowHead: true }
      return { a, b, n, pic }
    }, x => hides(x.pic, x.n * (x.b - x.a)))
    const [A, B] = s.names, na = n * a, nb = n * b, ans = nb - na
    return { text: `${A} and ${B} both start with 0 ${s.unit}. Each ${s.time} ${A} ${s.verb} ${a} ${s.unit} and ${B} ${s.verb} ${b} ${s.unit}. After ${s.time} ${n}, how many more ${s.unit} does ${B} have than ${A}?`,
      picture: pic, answer: ans,
      steps: [`After ${s.time} ${n}, ${A} ${s.has} ${n} × ${a} = ${na} ${s.unit}.`, `${B} ${s.has} ${n} × ${b} = ${nb} ${s.unit}.`, `${nb} − ${na} = ${ans}, so ${B} ${s.has} ${ans} more ${s.unit}.`] }
  } },
]

// ── t4 · Graph the pattern pairs ────────────────────────────────────────────────────────────────────────────
const PAIRS4 = [[1, 2], [1, 3], [1, 4], [1, 5], [2, 3], [2, 5], [3, 4], [2, 4]] as const
const PACKS = [
  { pack: 'pack', packs: 'packs', thing: 'cards' },
  { pack: 'box', packs: 'boxes', thing: 'crayons' },
  { pack: 'bag', packs: 'bags', thing: 'apples' },
]

const T4: Level[] = [
  { style: 'table: how far up is the dot for a column', make: r => {
    const { a, b, j, pic } = until(() => {
      const [a, b] = pick(r, PAIRS4), j = int(r, 2, 3)
      return { a, b, j, pic: pat(4, terms(a, 4), ['0', String(b), '?', '?']) }
    }, x => hides(x.pic, x.j * x.b))
    const ans = j * b
    return { text: `${rulesText(a, b)} Pattern A goes across. When the dot is ${j * a} across, how far up is it?`, picture: pic, answer: ans,
      steps: [`Pattern A is ${j * a} in the ${ORD[j]} column.`, `Pattern B in that column: ${terms(b, j + 1).join(', ')}.`, `The pair is ${P(j * a, ans)}, so the dot is ${ans} up.`] }
  } },
  { style: 'pick the pair that is a dot', make: r => {
    const [a, b] = pick(r, PAIRS4), j = int(r, 1, 2), x = j * a, y = j * b
    return { text: `${rulesText(a, b)} Pattern A goes across. Which pair is a dot on this graph?`, picture: pat(3, terms(a, 3), terms(b, 3)),
      answer: choose(r, P(x, y), [P(y, x), P(x, y + b)]),
      steps: [`Take the ${ORD[j]} column: pattern A has ${x} and pattern B has ${y}.`, 'Pattern A goes across, and pattern B goes up.', `So the dot is at ${P(x, y)}.`] }
  } },
  { style: 'dots on a grid: how far up is the next dot', make: r => {
    const [a, b] = pick(r, [[1, 2], [1, 3], [2, 3], [1, 4], [2, 4]] as const), m = int(r, 3, 4), ans = m * b
    return { text: `These dots come from two patterns that both start at 0. Each dot is ${a} more across than the one before. The next dot is ${m * a} across. How far up is it?`,
      picture: grid(Math.max(12, ans), Array.from({ length: m }, (_, i) => ({ x: i * a, y: i * b }))), answer: ans,
      steps: [`Read the dots: each one is ${a} more across and ${b} more up.`, `The last dot is ${(m - 1) * a} across and ${(m - 1) * b} up. Go ${a} more across and ${b} more up.`, `So the next dot is ${ans} up.`] }
  } },
  { style: 'spot the mistake: bottom number put first', make: r => {
    const [a, b] = pick(r, PAIRS4), j = int(r, 1, 3), x = j * a, y = j * b, who = pick(r, NAMES)
    const right = `Pattern A goes across. The dot is at ${P(x, y)}.`
    return { text: `${rulesText(a, b)} ${who} takes the ${ORD[j]} column and plots the dot at ${P(y, x)}. What is true?`,
      picture: pat(4, terms(a, 4), terms(b, 4)), answer: choose(r, right, [`${who} is right.`, `The dot is at ${P(y, y)}.`]),
      steps: [`In the ${ORD[j]} column, pattern A has ${x} and pattern B has ${y}.`, `The top number goes across and the bottom number goes up. ${who} put the bottom number first.`, `So: ${right}`] }
  } },
  { style: 'story, work backwards: how far across is the dot', make: r => {
    const s = pick(r, PACKS), b = int(r, 3, 6), n = int(r, 2, 9), up = n * b
    return { text: `Every ${s.pack} holds ${b} ${s.thing}. Pattern A counts ${s.packs}: start at 0, add 1. Pattern B counts ${s.thing}: start at 0, add ${b}. A dot on the graph is ${up} up. How far across is it?`,
      picture: eq(`${s.packs} go across, ${s.thing} go up`, [`? ${s.packs} → ${up} ${s.thing}`]), answer: n,
      steps: [`The dot is ${up} up, so it stands for ${up} ${s.thing}.`, `Count by ${b}s to ${up}: ${terms(b, n + 1).slice(1).join(', ')}. That is ${n} ${s.packs}.`, `So the dot is ${n} across.`] }
  } },
]

// ── t5 · Distance along a grid line ─────────────────────────────────────────────────────────────────────────
/** Two points on one grid line, at least `minD` apart: `across` = they share the number up. */
const onLine = (r: Rng, minD = 2) => {
  const across = r() < 0.5, s = int(r, 1, 9)
  const [p, q] = until(() => [int(r, 0, 10), int(r, 0, 10)], ([p, q]) => Math.abs(p - q) >= minD && Math.abs(p - q) < 10)
  const A: [number, number] = across ? [p, s] : [s, p], B: [number, number] = across ? [q, s] : [s, q]
  return { across, s, A, B, d: Math.abs(p - q), hi: Math.max(p, q), lo: Math.min(p, q) }
}
type Line = ReturnType<typeof onLine>
const shareSay = (l: Line, what = 'points') => l.across ? `Both ${what} are ${l.s} up, so they are on the same line going across.` : `Both ${what} are ${l.s} across, so they are on the same line going up.`
const subSay = (l: Line) => `Subtract the numbers ${l.across ? 'across' : 'up'}: ${l.hi} − ${l.lo} = ${l.d}.`
const twoPts = (l: Line, M: string, N: string, max = 10) => grid(max, [{ x: l.A[0], y: l.A[1], label: M }, { x: l.B[0], y: l.B[1], label: N }])

const T5: Level[] = [
  { style: 'read two points off the grid, then subtract', make: r => {
    const l = onLine(r), [M, N] = letters(r, 2)
    return { text: `How many units apart are point ${M} and point ${N}?`, picture: twoPts(l, M, N), answer: l.d,
      steps: [`${M} is at ${P(...l.A)} and ${N} is at ${P(...l.B)}. ${shareSay(l)}`, subSay(l), `So they are ${l.d} units apart.`] }
  } },
  { style: 'pairs only, no grid', make: r => {
    const l = onLine(r), [M, N] = letters(r, 2)
    return { text: `Point ${M} is at ${P(...l.A)}. Point ${N} is at ${P(...l.B)}. How many units apart are they?`, picture: eq(`${M} ${P(...l.A)}`, [`${N} ${P(...l.B)}`]), answer: l.d,
      steps: [shareSay(l), subSay(l), `So they are ${l.d} units apart.`] }
  } },
  { style: 'spot the mistake: subtracted the matching numbers', make: r => {
    const l = onLine(r), [M, N] = letters(r, 2), who = pick(r, NAMES), right = `They are ${l.d} units apart.`
    return { text: `Point ${M} is at ${P(...l.A)} and point ${N} is at ${P(...l.B)}. ${who} does ${l.s} − ${l.s} and says they are 0 units apart. What is true?`,
      picture: twoPts(l, M, N), answer: choose(r, right, [`${who} is right.`, `They are ${l.d + 1} units apart.`]),
      steps: [`${shareSay(l)} The matching ${l.s}s are not subtracted.`, subSay(l), `So: ${right}`] }
  } },
  { style: 'work backwards: the missing number of a point', make: r => {
    const { x, y, d, dir } = until(() => ({ x: int(r, 0, 10), y: int(r, 0, 10), d: int(r, 2, 7), dir: pick(r, ['right', 'left', 'up', 'down'] as const) }),
      m => { const t = m.dir === 'right' ? m.x + m.d : m.dir === 'left' ? m.x - m.d : m.dir === 'up' ? m.y + m.d : m.y - m.d; return t >= 0 && t <= 10 })
    const [M, N] = letters(r, 2), sideways = dir === 'right' || dir === 'left'
    const ans = dir === 'right' ? x + d : dir === 'left' ? x - d : dir === 'up' ? y + d : y - d
    const where = sideways ? `to the ${dir} of` : dir === 'up' ? 'above' : 'below'
    const was = sideways ? x : y, sign = dir === 'right' || dir === 'up' ? '+' : '−'
    return { text: `Point ${N} is ${d} units ${where} point ${M}. What is the ${sideways ? 'first' : 'second'} number of point ${N}?`,
      picture: grid(10, [{ x, y, label: M }]), answer: ans,
      steps: [`Moving ${sideways ? `${dir} changes only the number across. The ${y} up` : `${dir} changes only the number up. The ${x} across`} stays the same.`,
        `${M} is at ${P(x, y)}. ${was} ${sign} ${d} = ${ans}.`, `So ${N} is at ${sideways ? P(ans, y) : P(x, ans)}, and its ${sideways ? 'first' : 'second'} number is ${ans}.`] }
  } },
  { style: 'two-step story: units to meters', make: r => {
    const l = onLine(r, 3), k = int(r, 2, 5), [M, N] = letters(r, 2), m = l.d * k
    return { text: `A fence runs in a straight line from post ${M} to post ${N}. Each unit on the grid is ${k} meters. How many meters long is the fence?`,
      picture: twoPts(l, M, N), answer: m,
      steps: [shareSay(l, 'posts'), `${subSay(l)} That is ${l.d} units.`, `Each unit is ${k} meters: ${l.d} × ${k} = ${m}. So the fence is ${fmt(m)} meters long.`] }
  } },
]

// ── t6 · Maps on a grid ─────────────────────────────────────────────────────────────────────────────────────
const TOWN = ['School', 'Park', 'Library', 'Pool', 'Store', 'Bank', 'Farm', 'Zoo', 'Bakery', 'Barn']
const the = (p: string) => `the ${p.toLowerCase()}`
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
/** Two places on one street plus a third place elsewhere. */
const street = (r: Rng) => {
  const l = onLine(r)
  const [p, q, o] = shuffle(r, TOWN)
  const other = spots(r, 1, 0, 10, ([[x, y]]) => distinct([P(x, y), P(...l.A), P(...l.B)]))[0]
  const pic = grid(10, [{ x: l.A[0], y: l.A[1], label: p }, { x: l.B[0], y: l.B[1], label: q }, { x: other[0], y: other[1], label: o }])
  return { l, p, q, pic }
}

const T6: Level[] = [
  { style: 'blocks between two places on one street', make: r => {
    const { l, p, q, pic } = street(r)
    return { text: `How many blocks is it from ${the(p)} to ${the(q)}?`, picture: pic, answer: l.d,
      steps: [`${cap(the(p))} is at ${P(...l.A)} and ${the(q)} is at ${P(...l.B)}. ${shareSay(l, 'places').replace('on the same line', 'on one straight street')}`, subSay(l), `So they are ${l.d} blocks apart.`] }
  } },
  { style: 'which place is at the pair', make: r => {
    const [[x, y], near] = spots(r, 2, 1, 9, ([[x, y], n]) => x !== y && Math.abs(n[0] - x) + Math.abs(n[1] - y) <= 2 && P(...n) !== P(y, x))
    const [p, q, o] = shuffle(r, TOWN)
    return { text: `Which place is at ${P(x, y)}?`, picture: grid(10, shuffle(r, [{ x, y, label: p }, { x: y, y: x, label: q }, { x: near[0], y: near[1], label: o }])),
      answer: choose(r, the(p), [the(q), the(o)]),
      steps: [`Start at 0. Go ${x} across.`, `Then go ${y} up.`, `The place there is ${the(p)}.`] }
  } },
  { style: 'spot the mistake: counted the corners', make: r => {
    const { l, p, q, pic } = until(() => street(r), x => x.l.d >= 3)
    const who = pick(r, NAMES), right = `It is ${l.d} blocks.`
    return { text: `${who} walks from ${the(p)} to ${the(q)}. ${who} counts every corner from ${l.lo} to ${l.hi} and says it is ${l.d + 1} blocks. What is true?`,
      picture: pic, answer: choose(r, right, [`${who} is right.`, `It is ${l.d - 1} blocks.`]),
      steps: ['Count the blocks between the corners, not the corners.', subSay(l), `So: ${right}`] }
  } },
  { style: 'work backwards: where is the new place', make: r => {
    const { x, y, d, dir } = until(() => ({ x: int(r, 1, 7), y: int(r, 1, 7), d: int(r, 2, 3), dir: pick(r, ['up', 'right'] as const) }),
      m => distinct([P(m.x, m.y + m.d), P(m.x + m.d, m.y), P(m.y + m.d, m.x), P(m.x, m.d), P(m.d, m.y)]))
    const [home, place] = shuffle(r, TOWN), up = dir === 'up'
    const [tx, ty] = up ? [x, y + d] : [x + d, y]
    const wrong = up ? [P(x + d, y), P(x, d)] : [P(x, y + d), P(d, y)]
    return { text: `${cap(the(place))} is ${d} blocks ${up ? 'up from' : 'to the right of'} ${the(home)}, on the same street. Which pair tells where ${the(place)} is?`,
      picture: grid(10, [{ x, y, label: home }]), answer: choose(r, P(tx, ty), wrong),
      steps: [`${cap(the(home))} is at ${P(x, y)}. Going ${dir} changes only the number ${up ? 'up' : 'across'}.`, `${up ? y : x} + ${d} = ${up ? ty : tx}.`, `So ${the(place)} is at ${P(tx, ty)}.`] }
  } },
  { style: 'two-step walk: turn a corner', make: r => {
    const { h, s, k } = until(() => ({ h: [int(r, 0, 10), int(r, 0, 10)], s: int(r, 0, 10), k: int(r, 0, 10) }),
      m => Math.abs(m.s - m.h[1]) >= 2 && Math.abs(m.k - m.h[0]) >= 2)
    const [store, park] = shuffle(r, TOWN)
    const home: [number, number] = [h[0], h[1]], mid: [number, number] = [h[0], s], end: [number, number] = [k, s]
    const d1 = Math.abs(s - h[1]), d2 = Math.abs(k - h[0]), ans = d1 + d2
    return { text: `You walk from home to ${the(store)}, then on to ${the(park)}. How many blocks do you walk?`,
      picture: grid(10, [{ x: home[0], y: home[1], label: 'Home' }, { x: mid[0], y: mid[1], label: store }, { x: end[0], y: end[1], label: park }]), answer: ans,
      steps: [`Home to ${the(store)}: both are ${h[0]} across, so ${Math.max(s, h[1])} − ${Math.min(s, h[1])} = ${d1} blocks.`,
        `${cap(the(store))} to ${the(park)}: both are ${s} up, so ${Math.max(k, h[0])} − ${Math.min(k, h[0])} = ${d2} blocks.`, `${d1} + ${d2} = ${ans}, so you walk ${ans} blocks.`] }
  } },
]

export const G5M6_LADDERS: Record<string, Level[]> = {
  'g5m6-t1': T1, 'g5m6-t2': T2, 'g5m6-t3': T3, 'g5m6-t4': T4, 'g5m6-t5': T5, 'g5m6-t6': T6,
}
