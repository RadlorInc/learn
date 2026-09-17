/**
 * Grade 4 · Module 2 — Place value for multiplication and division. Practice ladders, easiest style first
 * (see ../adaptive.ts and the reference ladders in ./g5m1.ts). A level is a different KIND of question, not bigger numbers.
 */
import type { Picture, Problem } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const choose = (r: Rng, right: string, wrong: string[]) => {
  const choices = shuffle(r, [right, ...new Set(wrong.filter(w => w !== right))])
  return { choices, correct: choices.indexOf(right) }
}
const until = <T>(gen: () => T, ok: (x: T) => boolean): T => { let x = gen(); while (!ok(x)) x = gen(); return x }

/** Every number the picture puts in front of the child (a table row is also read joined up) — the gate's own reading. */
const shown = (p: Picture) => {
  const t: string[] = []
  const walk = (v: unknown) => {
    if (typeof v === 'string' || typeof v === 'number') t.push(String(v))
    else if (Array.isArray(v)) { if (v.every(x => typeof x === 'string')) t.push(v.join('')); v.forEach(walk) }
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  walk(p)
  return new Set(t.flatMap(s => s.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map(s => s.replace(/,/g, '')))
}
/** Re-roll a level's numbers until the picture does not show a number answer of 10 or more. */
const hid = (make: (r: Rng) => Problem) => (r: Rng) =>
  until(() => make(r), p => typeof p.answer !== 'number' || p.answer < 10 || !shown(p.picture).has(String(p.answer)))

const NAMES = ['Ann', 'Sam', 'Mia', 'Leo', 'Ben', 'Zoe', 'Tom', 'Kim', 'Lily', 'Max', 'Ava', 'Raj']
const twoNames = (r: Rng) => { const [a, b] = shuffle(r, NAMES); return [a, b] }
const THINGS = ['stickers', 'shells', 'marbles', 'crayons', 'stamps', 'cards']
const countBy = (s: number, k: number) => Array.from({ length: k }, (_, i) => fmt(s * (i + 1))).join(', ')
const factorPairs = (n: number) => { const out: [number, number][] = []; for (let a = 1; a * a <= n; a++) if (n % a === 0) out.push([a, n / a]); return out }
const isPrime = (n: number) => n > 1 && factorPairs(n).length === 1

// ── t1 · Times as many ──────────────────────────────────────────────────────────────────────────────────────
const copiesTape = (a: string, n: number, b: string, k: number): Picture => ({ kind: 'tape', rows: [
  { label: a, cells: [{ w: n, text: String(n), shade: true }] },
  { label: b, cells: Array.from({ length: k }, () => ({ w: n, text: String(n) })), brace: '?' },
] })

const T1: Level[] = [
  { style: 'tape with the copies drawn', make: hid(r => {
    const [a, b] = twoNames(r), thing = pick(r, THINGS), n = int(r, 2, 9), k = int(r, 2, 9)
    return { text: `${a} has ${n} ${thing}. ${b} has ${k} times as many ${thing} as ${a}. How many ${thing} does ${b} have?`,
      picture: copiesTape(a, n, b, k), answer: k * n,
      steps: [`${b} has ${k} copies of ${a}'s ${n}.`, `Copies means multiply: ${k} × ${n}.`, `So ${b} has ${k * n} ${thing}.`] }
  }) },
  { style: 'bare times as many', make: hid(r => {
    const n = int(r, 2, 9), k = int(r, 2, 9)
    return { text: `What number is ${k} times as many as ${n}?`, picture: eq(`${k} times as many as ${n}`), answer: k * n,
      steps: [`${k} times as many as ${n} means ${k} copies of ${n}.`, `So ${k} × ${n} = ${k * n}.`] }
  }) },
  { style: 'pick the right amount, not the added one', make: r => {
    const [a, b] = twoNames(r), thing = pick(r, THINGS), n = int(r, 2, 9), k = int(r, 3, 9)
    const say = (v: number) => `${v} ${thing}`
    return { text: `${a} has ${n} ${thing}. ${b} has ${k} times as many as ${a}. How many ${thing} does ${b} have?`,
      picture: eq(`${a}: ${n}`, [`${b}: ${k} times as many`]),
      answer: choose(r, say(k * n), [say(k + n), say((k - 1) * n), say((k + 1) * n)]),
      steps: [`Don't add ${k} + ${n}. Times as many means ${k} copies of ${n}.`, `${k} × ${n} = ${k * n}.`, `So ${b} has ${say(k * n)}.`] }
  } },
  { style: 'how many times as many (work backwards)', make: r => {
    const [a, b] = twoNames(r), thing = pick(r, THINGS), n = int(r, 2, 9), k = int(r, 2, 9)
    return { text: `${b} has ${k * n} ${thing}. ${a} has ${n} ${thing}. ${b} has how many times as many ${thing} as ${a}?`,
      picture: { kind: 'tape', rows: [{ label: a, cells: [{ w: n, text: String(n), shade: true }] }, { label: b, cells: [{ w: k * n, text: String(k * n) }] }] },
      answer: k, steps: [`Count copies of ${n} until you reach ${k * n}: ${countBy(n, k)}.`, `That is ${k} copies, and ${k} × ${n} = ${k * n}.`, `So ${b} has ${k} times as many.`] }
  } },
  { style: 'two-step story (both together)', make: hid(r => {
    const [a, b] = twoNames(r), thing = pick(r, THINGS), n = int(r, 2, 9), k = int(r, 2, 9)
    return { text: `${a} has ${n} ${thing}. ${b} has ${k} times as many ${thing} as ${a}. How many ${thing} do they have together?`,
      picture: eq(`${k} × ${n} = ?`, [`? + ${n} = ?`]), answer: k * n + n,
      steps: [`First find ${b}'s ${thing}: ${k} × ${n} = ${k * n}.`, `Then add ${a}'s ${n}: ${k * n} + ${n} = ${k * n + n}.`, `So they have ${k * n + n} ${thing} together.`] }
  }) },
]

// ── t2 · Factor pairs ───────────────────────────────────────────────────────────────────────────────────────
const RICH = [12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 48]

const T2: Level[] = [
  { style: 'finish the factor pair table', make: hid(r => {
    const n = pick(r, RICH), pairs = factorPairs(n), i = int(r, 1, pairs.length - 1), [a, b] = pairs[i]
    const rows = pairs.slice(0, i).map(([x, y]) => [String(x), String(y)])
    return { text: `${n} tiles make rectangles. The table shows the rows so far. With ${a} rows, how many tiles go in each row?`,
      picture: { kind: 'table', head: ['Rows', 'Tiles in each row'], rows: [...rows, [String(a), '?']] }, answer: b,
      steps: [`${a} rows use all ${n} tiles, so think: ${a} × what makes ${n}?`, `Count by ${a}s: ${countBy(a, b)}. That is ${b} jumps.`, `So each row has ${b} tiles.`] }
  }) },
  { style: 'missing factor', make: r => {
    const a = int(r, 2, 9), b = int(r, 2, 9), n = a * b
    return { text: `What number goes in the box? ${a} × ? = ${n}`, picture: eq(`${a} × ? = ${n}`), answer: b,
      steps: [`Count by ${a}s: ${countBy(a, b)}.`, `That is ${b} jumps, so the missing number is ${b}.`] }
  } },
  { style: 'pick the pair that makes the number', make: r => {
    const n = pick(r, RICH), [a, b] = pick(r, factorPairs(n))
    const right = `${a} × ${b}`
    return { text: `Which pair of numbers makes a rectangle with all ${n} tiles?`, picture: eq(`? × ? = ${n}`),
      answer: choose(r, right, [`${a} × ${b + 1}`, `${a + 1} × ${b}`, ...(b > 2 ? [`${a} × ${b - 1}`] : [])]),
      steps: [`Multiply each pair and look for ${n}.`, `${a} × ${b} = ${n}. The other pairs do not make ${n}.`, `So the pair is ${right}.`] }
  } },
  { style: 'count every rectangle', make: r => {
    const n = int(r, 6, 48), pairs = factorPairs(n), m = pairs.length
    return { text: `How many different rectangles can you make with all ${n} tiles? A rectangle turned around is not a new one.`,
      picture: { kind: 'grid', rows: 1, cols: n }, answer: m,
      steps: [`Start with the single long row, then try 2 rows, 3 rows and up.`, `These work: ${pairs.map(([x, y]) => `${x} × ${y}`).join(', ')}. The rest leave a short row or are turned around.`,
        `So there ${m === 1 ? 'is 1 rectangle' : `are ${m} rectangles`}.`] }
  } },
  { style: 'two-step story (find the total, then the rows)', make: r => {
    const x = until(() => {
      const c = int(r, 2, 9), rows = int(r, 2, 9), n = c * rows
      const ways = factorPairs(n).flatMap(([p, q]) => [[p, q], [q, p]]).filter(([p, q]) => p >= 2 && q >= 2 && p <= 9 && q <= 9 && p !== rows && p !== c)
      return { c, rows, n, way: ways.length ? pick(r, ways) : null }
    }, y => y.way !== null)
    const [trays, each] = x.way!
    return { text: `A baker bakes ${trays} trays with ${each} muffins on each tray. She puts all the muffins in ${x.rows} equal rows in the window. How many muffins are in each row?`,
      picture: eq(`${trays} × ${each} = ?`, [`${x.rows} × ? = ?`]), answer: x.c,
      steps: [`First find all the muffins: ${trays} × ${each} = ${x.n}.`, `Then think: ${x.rows} × what makes ${x.n}? ${x.rows} × ${x.c} = ${x.n}.`, `So each row has ${x.c} muffins.`] }
  } },
]

// ── t3 · Prime or composite ─────────────────────────────────────────────────────────────────────────────────
const PC = ['prime', 'composite']
const primeSteps = (n: number) => {
  const pairs = factorPairs(n)
  if (pairs.length === 1) return [`1 row of ${n} works.`, `${n === 2 ? 'There is no other way to make rows' : `Rows of 2 up to ${n - 1} each leave a short row`}.`, `Only one rectangle, so ${n} is prime.`]
  const [a, b] = pairs[1]
  return [`1 row of ${n} works.`, `${a} rows of ${b} also works, because ${a} × ${b} = ${n}.`, `More than one rectangle, so ${n} is composite.`]
}
const pc = (r: Rng, n: number) => choose(r, isPrime(n) ? 'prime' : 'composite', PC)

const T3: Level[] = [
  { style: 'one long row drawn', make: r => {
    const n = int(r, 4, 30)
    return { text: `Is ${n} prime or composite?`, picture: { kind: 'grid', rows: 1, cols: n }, answer: pc(r, n), steps: primeSteps(n) }
  } },
  { style: 'bare number', make: r => {
    const n = int(r, 31, 50)
    return { text: `A number that makes only one rectangle is prime. A number that makes more is composite. Which is ${n}?`,
      picture: eq(String(n), ['One rectangle, or more?']), answer: pc(r, n), steps: primeSteps(n) }
  } },
  { style: 'pick the rows that prove it is composite', make: r => {
    const n = until(() => int(r, 12, 50), v => factorPairs(v).length >= 2)
    const [a, b] = pick(r, factorPairs(n).slice(1)), say = (x: number, y: number) => `${x} rows of ${y}`
    return { text: `${n} is composite. Which rows make a second rectangle with all ${n} chairs?`, picture: { kind: 'grid', rows: 1, cols: n },
      answer: choose(r, say(a, b), [say(a, b + 1), say(a + 1, b), say(a, b - 1)]),
      steps: [`A second rectangle needs rows that use every chair.`, `${a} × ${b} = ${n}, so ${a} rows of ${b} works.`, `So the answer is ${say(a, b)}.`] }
  } },
  { style: 'pick the prime from a list', make: r => {
    const p = pick(r, [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47])
    const comps = shuffle(r, [4, 6, 9, 10, 15, 21, 25, 27, 33, 35, 39, 45, 49].filter(c => c !== p)).slice(0, 3)
    const one = (c: number) => { const [a, b] = factorPairs(c)[1]; return `${c} = ${a} × ${b}` }
    return { text: 'Which number is prime?', picture: eq('Only one rectangle', ['one long row']),
      answer: choose(r, String(p), comps.map(String)),
      steps: [`${comps.map(one).join(', ')}. Each of those makes more than one rectangle.`, `${p} makes only one long row.`, `So ${p} is prime.`] }
  } },
  { style: 'spot the mistake (stopped trying too soon)', make: r => {
    const n = pick(r, [7, 11, 13, 17, 19, 23, 25, 35, 49, 55, 65, 77, 85, 91])
    const right = isPrime(n) ? `Max is right. ${n} is prime.` : `Max is wrong. ${n} is composite.`
    const pairs = factorPairs(n)
    const steps = isPrime(n)
      ? [`Keep trying past 4 rows.`, `Every number of rows from 2 up to ${n - 1} leaves a short row.`, `Only one rectangle, so: ${right}`]
      : [`Keep trying past 4 rows.`, `${pairs[1][0]} rows of ${pairs[1][1]} works, because ${pairs[1][0]} × ${pairs[1][1]} = ${n}.`, `More than one rectangle, so: ${right}`]
    return { text: `Max has ${n} chairs. Rows of 2, 3 and 4 each leave a short row, so Max says ${n} is prime. Is he right?`,
      picture: eq(`${n} chairs`, ['2 rows? 3 rows? 4 rows?']),
      answer: choose(r, right, [`Max is right. ${n} is prime.`, `Max is wrong. ${n} is composite.`]), steps }
  } },
]

// ── t4 · Multiples ──────────────────────────────────────────────────────────────────────────────────────────
const frog = (s: number, extra: Partial<Extract<Picture, { kind: 'numline' }>> = {}): Picture =>
  ({ kind: 'numline', min: 0, max: s * 12, ticks: 12, labels: 'ends', jumps: [{ from: 0, to: s, label: `+${s}` }], ...extra })
const nth = (k: number) => `${k}${k === 1 ? 'st' : k === 2 ? 'nd' : k === 3 ? 'rd' : 'th'}`

const T4: Level[] = [
  { style: 'frog line, find a landing', make: hid(r => {
    const s = int(r, 2, 9), k = int(r, 3, 9)
    return { text: `A frog starts at 0 and jumps ${s} spaces each time. Where is its ${nth(k)} landing?`, picture: frog(s), answer: k * s,
      steps: [`Count by ${s}s, one landing at a time: ${countBy(s, k)}.`, `That matches the times fact ${k} × ${s}.`, `So the ${nth(k)} landing is ${k * s}.`] }
  }) },
  { style: 'bare count-by list', make: hid(r => {
    const s = int(r, 3, 9), k = int(r, 5, 10)
    return { text: `Count by ${s}s from 0: ${countBy(s, 3)}, … What is the ${nth(k)} number you land on?`, picture: eq(`${countBy(s, 3)}, …`), answer: k * s,
      steps: [`Don't count 0. The ${nth(k)} landing is ${k} × ${s}.`, `So the ${nth(k)} number is ${k * s}.`] }
  }) },
  { style: 'yes or no: is it a landing?', make: r => {
    const s = int(r, 3, 9), m = int(r, 4, 11), yes = r() < 0.5, d = int(r, 1, s - 1), n = yes ? m * s : m * s + d
    const steps = yes
      ? [`${n} is a landing if some number times ${s} makes ${n}.`, `${m} × ${s} = ${n}, so the ${nth(m)} landing is ${n}.`, 'So the answer is yes.']
      : [`${m} × ${s} = ${m * s} and ${m + 1} × ${s} = ${(m + 1) * s}.`, `${n} is between them, so the frog jumps right over it.`, 'So the answer is no.']
    return { text: `Count by ${s}s from 0. Do you land on ${n}?`, picture: eq(`${countBy(s, 3)}, …`, [`${n}?`]),
      answer: choose(r, yes ? 'yes' : 'no', ['yes', 'no']), steps }
  } },
  { style: 'which landing is it (work backwards)', make: hid(r => {
    const s = int(r, 2, 9), k = int(r, 3, 11)
    return { text: `A frog jumps ${s} spaces each time, starting at 0. It lands on ${k * s}. Which landing is that?`,
      picture: frog(s, { points: [{ at: k * s, label: String(k * s) }] }), answer: k,
      steps: [`Count by ${s}s until you reach ${k * s}: ${countBy(s, k)}.`, `That is ${k} jumps, and ${k} × ${s} = ${k * s}.`, `So it is landing number ${k}.`] }
  }) },
  { style: 'two-step story (more jumps)', make: hid(r => {
    const s = int(r, 2, 9), a = int(r, 2, 6), b = int(r, 2, 5), k = a + b
    return { text: `A frog jumps ${s} spaces each time, starting at 0. It makes ${a} jumps, rests, then makes ${b} more jumps. Where does it land?`,
      picture: frog(s), answer: k * s,
      steps: [`It makes ${a} + ${b} = ${k} jumps in all.`, `Each jump is ${s}, so find ${k} × ${s}.`, `${k} × ${s} = ${k * s}, so it lands on ${k * s}.`] }
  }) },
]

// ── t5 · Multiply by 10, 100, 1,000 ─────────────────────────────────────────────────────────────────────────
const P = [
  { p: 10, move: 'one place', fill: 'A 0 fills the ones place.' },
  { p: 100, move: 'two places', fill: '0s fill the tens and ones.' },
  { p: 1000, move: 'three places', fill: '0s fill the hundreds, tens and ones.' },
]
const HEAD = ['ten thousands', 'thousands', 'hundreds', 'tens', 'ones']
const chart = (n: number): Picture => ({ kind: 'table', head: HEAD, rows: [String(n).padStart(5, ' ').split('').map(c => (c === ' ' ? '' : c)), ['', '', '', '', '']] })
/** A number and a power whose product fits the 5-place chart. */
const npow = (r: Rng) => until(() => ({ n: int(r, 2, 999), ...pick(r, P) }), x => x.n * x.p <= 99999 && x.n !== 10 && x.n !== 100)
const moveSteps = (n: number, p: number, move: string, fill: string) =>
  [`Times ${fmt(p)} moves every digit ${move} to the left.`, fill, `So ${fmt(n)} × ${fmt(p)} = ${fmt(n * p)}.`]

const T5: Level[] = [
  { style: 'place value chart', make: hid(r => {
    const { n, p, move, fill } = npow(r)
    return { text: `What is ${fmt(n)} × ${fmt(p)}?`, picture: chart(n), answer: n * p, steps: moveSteps(n, p, move, fill) }
  }) },
  { style: 'bare multiplication', make: hid(r => {
    const { n, p, move, fill } = npow(r)
    return { text: `${fmt(n)} × ${fmt(p)} = ?`, picture: eq(`${fmt(n)} × ${fmt(p)} = ?`), answer: n * p, steps: moveSteps(n, p, move, fill) }
  }) },
  { style: 'pick the true sentence (how many 0s)', make: r => {
    const { n, p, move, fill } = npow(r), say = (v: number) => `${fmt(n)} × ${fmt(p)} = ${fmt(v)}`
    return { text: 'Which one is true?', picture: eq(`${fmt(n)} × ${fmt(p)}`),
      answer: choose(r, say(n * p), P.filter(x => x.p !== p).map(x => say(n * x.p))),
      steps: [`Times ${fmt(p)} moves every digit ${move} to the left.`, fill, `So ${say(n * p)}.`] }
  } },
  { style: 'missing number', make: hid(r => {
    const { n, p, move } = npow(r)
    if (r() < 0.5) return { text: `What number goes in the box? ${fmt(n)} × ? = ${fmt(n * p)}`, picture: eq(`${fmt(n)} × ? = ${fmt(n * p)}`), answer: p,
      steps: [`${fmt(n)} became ${fmt(n * p)}: every digit moved ${move} to the left.`, `Moving ${move} is multiplying by ${fmt(p)}.`, `The missing number is ${fmt(p)}.`] }
    return { text: `What number goes in the box? ? × ${fmt(p)} = ${fmt(n * p)}`, picture: eq(`? × ${fmt(p)} = ${fmt(n * p)}`), answer: n,
      steps: [`Times ${fmt(p)} moves digits ${move} to the left, so go back ${move} to the right.`, `The missing number is ${fmt(n)}.`] }
  }) },
  { style: 'two-step story', make: hid(r => {
    const boxes = int(r, 11, 99), per = pick(r, [10, 100]), [thing, pack] = pick(r, [['stickers', 'pack'], ['seeds', 'bag'], ['beads', 'string']] as const)
    const packs = boxes * 10, total = packs * per
    return { text: `A store gets ${boxes} boxes. Each box has 10 ${pack}s. Each ${pack} has ${per} ${thing}. How many ${thing} is that?`,
      picture: eq(`${boxes} × 10 = ?`, [`? × ${per} = ?`]), answer: total,
      steps: [`First find the ${pack}s: ${boxes} × 10 = ${fmt(packs)}.`, `Then the ${thing}: ${fmt(packs)} × ${per} = ${fmt(total)}.`, `So that is ${fmt(total)} ${thing}.`] }
  }) },
]

// ── t6 · Multiply tens by ones ──────────────────────────────────────────────────────────────────────────────
const tensWord = (t: number) => `${t} ${t === 1 ? 'ten' : 'tens'}`

const T6: Level[] = [
  { style: 'base-ten blocks', make: hid(r => {
    const k = int(r, 2, 9), t = int(r, 2, 9)
    return { text: `What is ${k} × ${t * 10}?`, picture: { kind: 'blocks', hundreds: 0, tens: t, ones: 0 }, answer: k * t * 10,
      steps: [`${t * 10} is ${tensWord(t)}.`, `${k} × ${tensWord(t)} = ${tensWord(k * t)}.`, `${tensWord(k * t)} is ${fmt(k * t * 10)}, so ${k} × ${t * 10} = ${fmt(k * t * 10)}.`] }
  }) },
  { style: 'bare multiplication', make: hid(r => {
    const k = int(r, 2, 9), t = int(r, 2, 9)
    return { text: `${k} × ${t * 10} = ?`, picture: eq(`${k} × ${t * 10} = ?`), answer: k * t * 10,
      steps: [`Think in tens: ${k} × ${tensWord(t)} = ${tensWord(k * t)}.`, `So ${k} × ${t * 10} = ${fmt(k * t * 10)}.`] }
  }) },
  { style: 'pick the right product (keep the tens)', make: r => {
    const k = int(r, 2, 9), t = int(r, 2, 9), say = (v: number) => `${k} × ${t * 10} = ${fmt(v)}`
    return { text: 'Which one is right?', picture: eq(`${k} × ${t * 10}`),
      answer: choose(r, say(k * t * 10), [say(k * t), say(k * t * 100)]),
      steps: [`Don't drop the tens. ${k} × ${t} = ${k * t}, but ${k} × ${t * 10} is ${tensWord(k * t)}.`, `So ${say(k * t * 10)}.`] }
  } },
  { style: 'missing number', make: hid(r => {
    const k = int(r, 2, 9), t = int(r, 2, 9), prod = k * t * 10
    if (r() < 0.5) return { text: `What number goes in the box? ? × ${t * 10} = ${fmt(prod)}`, picture: eq(`? × ${t * 10} = ${fmt(prod)}`), answer: k,
      steps: [`${t * 10} is ${tensWord(t)}, and ${fmt(prod)} is ${tensWord(k * t)}.`, `? × ${t} = ${k * t}, and ${k} × ${t} = ${k * t}.`, `So the missing number is ${k}.`] }
    return { text: `What number goes in the box? ${k} × ? = ${fmt(prod)}`, picture: eq(`${k} × ? = ${fmt(prod)}`), answer: t * 10,
      steps: [`${fmt(prod)} is ${tensWord(k * t)}.`, `${k} × ${t} = ${k * t}, so the missing number is ${tensWord(t)}.`, `${tensWord(t)} is ${t * 10}.`] }
  }) },
  { style: 'two-step story (two kinds of packs)', make: hid(r => {
    const a = int(r, 2, 9), t1 = int(r, 2, 9), b = int(r, 2, 9), t2 = until(() => int(r, 2, 9), v => v !== t1)
    const x = a * t1 * 10, y = b * t2 * 10
    return { text: `A game shop has ${a} packs of ${t1 * 10} cards and ${b} packs of ${t2 * 10} cards. How many cards is that in all?`,
      picture: eq(`${a} × ${t1 * 10} = ?`, [`${b} × ${t2 * 10} = ?`]), answer: x + y,
      steps: [`${a} × ${t1 * 10} is ${tensWord(a * t1)}, which is ${fmt(x)}.`, `${b} × ${t2 * 10} is ${tensWord(b * t2)}, which is ${fmt(y)}.`, `${fmt(x)} + ${fmt(y)} = ${fmt(x + y)}, so there are ${fmt(x + y)} cards.`] }
  }) },
]

// ── t7 · Divide tens ────────────────────────────────────────────────────────────────────────────────────────
const shareSteps = (q: number, k: number) => [`${fmt(q * k * 10)} is ${tensWord(q * k)}.`, `${tensWord(q * k)} ÷ ${k} = ${tensWord(q)}.`, `${tensWord(q)} is ${q * 10}, so ${fmt(q * k * 10)} ÷ ${k} = ${q * 10}.`]

const T7: Level[] = [
  { style: 'base-ten blocks, share the tens', make: hid(r => {
    const x = until(() => ({ q: int(r, 1, 9), k: int(r, 2, 9) }), v => v.q * v.k <= 20)
    return { text: `What is ${fmt(x.q * x.k * 10)} ÷ ${x.k}?`, picture: { kind: 'blocks', hundreds: 0, tens: x.q * x.k, ones: 0 }, answer: x.q * 10, steps: shareSteps(x.q, x.k) }
  }) },
  { style: 'bare division', make: hid(r => {
    const q = int(r, 1, 9), k = int(r, 2, 9)
    return { text: `${fmt(q * k * 10)} ÷ ${k} = ?`, picture: eq(`${fmt(q * k * 10)} ÷ ${k} = ?`), answer: q * 10, steps: shareSteps(q, k) }
  }) },
  { style: 'pick the right quotient (keep the tens)', make: r => {
    const q = int(r, 2, 9), k = int(r, 2, 9), n = q * k * 10, say = (v: number) => `${fmt(n)} ÷ ${k} = ${fmt(v)}`
    return { text: 'Which one is right?', picture: eq(`${fmt(n)} ÷ ${k}`),
      answer: choose(r, say(q * 10), [say(q), say(q * 100)]),
      steps: [`Don't drop the tens. ${fmt(n)} is ${tensWord(q * k)}.`, `${tensWord(q * k)} ÷ ${k} = ${tensWord(q)}.`, `So ${say(q * 10)}.`] }
  } },
  { style: 'missing number', make: hid(r => {
    const q = int(r, 2, 9), k = int(r, 2, 9), n = q * k * 10
    if (r() < 0.5) return { text: `What number goes in the box? ? ÷ ${k} = ${q * 10}`, picture: eq(`? ÷ ${k} = ${q * 10}`), answer: n,
      steps: [`Go backwards: ${q * 10} × ${k}.`, `${tensWord(q)} × ${k} = ${tensWord(q * k)}.`, `So the missing number is ${fmt(n)}.`] }
    return { text: `What number goes in the box? ${fmt(n)} ÷ ? = ${q * 10}`, picture: eq(`${fmt(n)} ÷ ? = ${q * 10}`), answer: k,
      steps: [`${fmt(n)} is ${tensWord(q * k)}, and ${q * 10} is ${tensWord(q)}.`, `${tensWord(q * k)} ÷ ? = ${tensWord(q)}, and ${q * k} ÷ ${k} = ${q}.`, `So the missing number is ${k}.`] }
  }) },
  { style: 'two-step story (find the total, then share)', make: hid(r => {
    const x = until(() => {
      const q = int(r, 1, 9), kids = int(r, 2, 9), t = q * kids
      const packs = [2, 3, 4, 5, 6, 7, 8, 9].filter(p => t % p === 0 && p !== kids && t / p >= 2)
      return { q, kids, t, packs: packs.length ? pick(r, packs) : 0 }
    }, v => v.packs > 0)
    const size = (x.t / x.packs) * 10, total = x.t * 10
    return { text: `A teacher has ${x.packs} packs of stickers with ${size} stickers in each pack. She shares all of them equally among ${x.kids} kids. How many stickers does each kid get?`,
      picture: eq(`${x.packs} × ${size} = ?`, [`? ÷ ${x.kids} = ?`]), answer: x.q * 10,
      steps: [`First find all the stickers: ${x.packs} × ${size} = ${fmt(total)}.`, `${fmt(total)} is ${tensWord(x.t)}, and ${tensWord(x.t)} ÷ ${x.kids} = ${tensWord(x.q)}.`, `So each kid gets ${x.q * 10} stickers.`] }
  }) },
]

// ── t8 · Division with a remainder ──────────────────────────────────────────────────────────────────────────
/** n = q × s + left, with 1 ≤ left < s: never comes out even. */
const rem = (r: Rng) => { const s = int(r, 3, 9), q = int(r, 2, 9), left = int(r, 1, s - 1); return { s, q, left, n: q * s + left } }
const fullSteps = ({ s, q, left, n }: ReturnType<typeof rem>) =>
  [`Count by ${s}s: ${countBy(s, q)}. ${(q + 1) * s} would be too many.`, `${q * s} fill the full groups, and ${n} − ${q * s} = ${left} ${left === 1 ? 'is' : 'are'} left over.`]
const bags = (g: number) => `${g} full ${g === 1 ? 'bag' : 'bags'}`

const T8: Level[] = [
  { style: 'rings picture, full groups', make: r => {
    const x = rem(r)
    return { text: `You have ${x.n} stickers. Each page holds ${x.s}. How many pages can you fill all the way?`,
      picture: { kind: 'rings', total: x.n, size: x.s, obj: 'sticker', state: 'start' }, answer: x.q,
      steps: [...fullSteps(x), `So you can fill ${x.q} full pages.`] }
  } },
  { style: 'bare numbers, what is left over', make: r => {
    const x = rem(r)
    return { text: `${x.n} marbles go into groups of ${x.s}. After you make every full group you can, how many marbles are left over?`,
      picture: eq(`${x.n} in groups of ${x.s}`, ['left over: ?']), answer: x.left,
      steps: [`Count by ${x.s}s: ${countBy(x.s, x.q)}. ${(x.q + 1) * x.s} would be too many.`, `The full groups use ${x.q * x.s}.`, `${x.n} − ${x.q * x.s} = ${x.left}, so ${x.left} left over.`] }
  } },
  { style: 'pick the right groups and left over (don\'t stop too soon)', make: r => {
    const x = rem(r), say = (g: number, l: number) => `${bags(g)}, ${l} left over`
    const right = say(x.q, x.left)
    return { text: `Pia puts ${x.n} beads into bags of ${x.s}. Which is right?`, picture: eq(`${x.n} beads`, [`${x.s} in each bag`]),
      answer: choose(r, right, [say(x.q - 1, x.left + x.s), say(x.q + 1, 0), say(x.q, x.left + 1)]),
      steps: [...fullSteps(x), `So it is ${right}.`] }
  } },
  { style: 'work backwards: how many to start', make: hid(r => {
    const x = rem(r), [name] = twoNames(r)
    return { text: `${name} fills ${x.q} pages with ${x.s} stickers on each page. ${x.left === 1 ? '1 sticker is' : `${x.left} stickers are`} left over. How many stickers did ${name} start with?`,
      picture: eq(`${x.q} pages of ${x.s}`, [`${x.left} left over`]), answer: x.n,
      steps: [`The full pages hold ${x.q} × ${x.s} = ${x.q * x.s} stickers.`, `Add the ones left over: ${x.q * x.s} + ${x.left} = ${x.n}.`, `So ${name} started with ${x.n} stickers.`] }
  }) },
  { style: 'story: one more group for what is left', make: hid(r => {
    const x = rem(r)
    return { text: `A van has ${x.s} seats. ${x.n} kids go on a trip. How many vans do they need so every kid gets a seat?`,
      picture: eq(`${x.n} kids`, [`${x.s} seats in each van`]), answer: x.q + 1,
      steps: [`Count by ${x.s}s: ${countBy(x.s, x.q)}. So ${x.q} vans are full and ${x.left} ${x.left === 1 ? 'kid is' : 'kids are'} left.`,
        `The ${x.left === 1 ? 'kid left needs' : `${x.left} kids left need`} one more van.`, `So they need ${x.q + 1} vans.`] }
  }) },
]

export const G4M2_LADDERS: Record<string, Level[]> = {
  'g4m2-t1': T1, 'g4m2-t2': T2, 'g4m2-t3': T3, 'g4m2-t4': T4, 'g4m2-t5': T5, 'g4m2-t6': T6, 'g4m2-t7': T7, 'g4m2-t8': T8,
}
