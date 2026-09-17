/**
 * Grade 5 · Module 2 — Adding and subtracting fractions. Practice ladders, easiest style first (see ../adaptive.ts and
 * the reference ladders in ./g5m1.ts). Bottom numbers stay in the lessons' set (2–12, shared sizes up to 24). Answers
 * are written like the lessons write them: in the matched piece size, not simplified, `{ frac }` with no `exact`
 * (so an equal fraction is also right), a `whole` when there is more than 1.
 */
import type { Answer, Picture } from '../script'
import { int, pick, shuffle, type Level, type Rng } from '../adaptive'

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
const lcm = (a: number, b: number) => (a / gcd(a, b)) * b
const until = <T>(gen: () => T, ok: (x: T) => boolean): T => { let x = gen(); while (!ok(x)) x = gen(); return x }
/** A top number for d in simplest form (the question's fractions are written the way a child meets them: 2/3, not 4/6). */
const top = (r: Rng, d: number, lo = 1, hi = d - 1) => until(() => int(r, lo, hi), n => gcd(n, d) === 1)

const f = (n: number, d: number) => `${n}/${d}`
/** A mixed number written exactly as showAnswer writes it. */
const mx = (w: number, n: number, d: number) => (w ? `${w} ${n}/${d}` : f(n, d))
const ans = (w: number, n: number, d: number): Answer => (w ? { frac: [n, d], whole: w } : { frac: [n, d] })

const NAME: Record<number, string> = { 2: 'half', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'eighth', 9: 'ninth', 10: 'tenth', 12: 'twelfth', 15: 'fifteenth', 18: 'eighteenth', 20: 'twentieth', 24: 'twenty-fourth' }
const piece = (d: number) => NAME[d]
const pieces = (d: number) => (d === 2 ? 'halves' : `${NAME[d]}s`)
const nPieces = (n: number, d: number) => `${n} ${n === 1 ? piece(d) : pieces(d)}`
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
const list = (xs: string[]) => (xs.length < 3 ? xs.join(' and ') : `${xs.slice(0, -1).join(', ')}, and ${xs.at(-1)}`)
const UNITS: Record<string, string> = { mile: 'miles', foot: 'feet', inch: 'inches', cup: 'cups', pound: 'pounds', yard: 'yards', hour: 'hours', gallon: 'gallons', quart: 'quarts' }
/** "3/4 mile", "1 1/4 miles": singular up to 1, like the lessons. */
const unit = (u: string, more: boolean) => (more ? UNITS[u] : u)

type Bar = { parts: number; shaded: number; label?: string }
const bar = (parts: number, shaded: number, label?: string): Bar => (label ? { parts, shaded, label } : { parts, shaded })
const bars = (...b: Bar[]): Picture => ({ kind: 'bars', bars: b })
const two = (p1: number, s1: number, p2: number, s2: number): Picture => bars(bar(p1, s1, f(s1, p1)), bar(p2, s2, f(s2, p2)))
const eq = (text: string, lines?: string[]): Picture => (lines ? { kind: 'eq', text, lines } : { kind: 'eq', text })
const wholes = (w: number) => Array.from({ length: w }, () => bar(1, 1, '1'))

const NAMES = [['Mia', 'she'], ['Leo', 'he'], ['Ana', 'she'], ['Sam', 'he'], ['Zoe', 'she'], ['Kai', 'he'], ['Jo', 'she'], ['Ben', 'he']] as const
const who = (r: Rng) => pick(r, NAMES)
const twoNames = (r: Rng) => { const [a, b] = shuffle(r, NAMES); return [a, b] as const }

/** Choices from [text, value] pairs; re-rolled by the caller unless every text and every value differs. */
const choices = (r: Rng, right: [string, number], wrong: [string, number][]) => {
  const all = shuffle(r, [right, ...wrong])
  return { choices: all.map(c => c[0]), correct: all.indexOf(right) }
}
/** Re-roll until `ok`, then drop the flag. */
const reroll = <T extends { ok: boolean }>(gen: () => T): Omit<T, 'ok'> => { const { ok: _, ...p } = until(gen, x => x.ok); return p }
const distinct = (xs: [string, number][]) =>
  new Set(xs.map(x => x[0])).size === xs.length && xs.every((x, i) => xs.every((y, j) => i === j || Math.abs(x[1] - y[1]) > 1e-9))

// Piece sizes. REL: the small one cuts straight into the big one. UNREL: both must be cut (shared size up to 24).
const REL: [number, number][] = [[2, 4], [2, 6], [2, 8], [2, 10], [3, 6], [3, 9], [3, 12], [4, 8], [4, 12], [5, 10], [6, 12]]
const UNREL: [number, number][] = [[2, 3], [2, 5], [3, 4], [4, 6], [3, 5], [4, 5], [6, 8], [3, 8], [4, 10], [8, 12]]
const ALL = [...REL, ...UNREL]
/** A family of three different piece sizes that all cut into L. */
const FAM: Record<number, number[]> = { 6: [2, 3, 6], 8: [2, 4, 8], 10: [2, 5, 10], 12: [2, 3, 4, 6, 12] }

interface Pair { a: number; b: number; c: number; d: number; L: number; A: number; C: number }
const pair = (r: Rng, pairs: [number, number][], swap = true): Pair => {
  const p = pick(r, pairs), [b, d] = swap && r() < 0.5 ? [p[1], p[0]] : p
  const a = top(r, b), c = top(r, d), L = lcm(b, d)
  return { a, b, c, d, L, A: (a * L) / b, C: (c * L) / d }
}
/** Three fractions whose bottom numbers are three different sizes of one family. */
const triple = (r: Rng) => {
  const L = pick(r, [6, 8, 10, 12]), ds = shuffle(r, FAM[L]).slice(0, 3)
  const xs = ds.map(d => { const n = top(r, d); return { n, d, N: (n * L) / d } })
  return { L, xs }
}

/** The "make the pieces match" sentence: only the fractions that need new names. */
const match = (xs: [number, number][], L: number): string => {
  const need = xs.filter(([, d]) => d !== L)
  if (need.length === 1) { const [n, d] = need[0]; return `Cut each ${piece(d)} into ${L / d} pieces. So ${f(n, d)} is ${f((n * L) / d, L)}.` }
  return `Use ${pieces(L)}: ${list(need.map(([n, d]) => `${f(n, d)} is ${f((n * L) / d, L)}`))}.`
}
const half = (d: number) => (d % 2 ? `${(d - 1) / 2} and a half` : `${d / 2}`)

// ── t1 · Add fractions with different-size pieces ───────────────────────────────────────────────────────────
const addPair = (r: Rng, pairs: [number, number][]) => until(() => pair(r, pairs), p => p.A + p.C < p.L)

const T1: Level[] = [
  { style: 'add with bars, one piece size cuts into the other', make: r => {
    const { a, b, c, d, L, A, C } = addPair(r, REL)
    return { text: `Add. ${f(a, b)} + ${f(c, d)} = ?`, picture: two(b, a, d, c), answer: { frac: [A + C, L] },
      steps: [match([[a, b], [c, d]], L), `Now add the ${pieces(L)}: ${f(A, L)} + ${f(C, L)}.`, `So ${f(a, b)} + ${f(c, d)} = ${f(A + C, L)}.`] }
  } },
  { style: 'bare numbers, both pieces need cutting', make: r => {
    const { a, b, c, d, L, A, C } = addPair(r, UNREL)
    return { text: `Add. ${f(a, b)} + ${f(c, d)} = ?`, picture: eq(`${f(a, b)} + ${f(c, d)} = ?`), answer: { frac: [A + C, L] },
      steps: [`${cap(pieces(b))} and ${pieces(d)} can both be cut into ${pieces(L)}.`, `${f(a, b)} is ${f(A, L)}, and ${f(c, d)} is ${f(C, L)}.`, `${f(A, L)} + ${f(C, L)} = ${f(A + C, L)}.`] }
  } },
  { style: 'spot the mistake: added the bottom numbers', make: r => reroll(() => {
    const { a, b, c, d, L, A, C } = addPair(r, ALL), [name] = who(r)
    const right: [string, number] = [f(A + C, L), (A + C) / L]
    const wrong: [string, number][] = [[f(a + c, b + d), (a + c) / (b + d)], [f(a + c, L), (a + c) / L]]
    const picture = two(b, a, d, c)
    return { ok: distinct([right, ...wrong]) && !JSON.stringify(picture).includes(right[0]),
      text: `${name} says ${f(a, b)} + ${f(c, d)} = ${f(a + c, b + d)}. That is not right. What is the right answer?`, picture, answer: choices(r, right, wrong),
      steps: ['The bottom number is the piece size, so never add the bottom numbers.', match([[a, b], [c, d]], L), `${f(A, L)} + ${f(C, L)} = ${right[0]}.`] }
  }) },
  { style: 'missing top number (work backwards)', make: r => {
    // REL keeps the smaller piece first, so the unknown sits in the bigger bottom number
    const { a, b, c, d, A } = until(() => pair(r, REL, false), p => p.A + p.C < p.L), S = A + c
    return { text: `${f(a, b)} + ?/${d} = ${f(S, d)}. What is the missing top number?`, picture: eq(`${f(a, b)} + ?/${d} = ${f(S, d)}`), answer: c,
      steps: [`Cut each ${piece(b)} into ${d / b} pieces. So ${f(a, b)} is ${f(A, d)}.`, `${f(A, d)} + ?/${d} = ${f(S, d)}, and ${S} − ${A} = ${c}.`, `So the missing top number is ${c}.`] }
  } },
  { style: 'story with three parts', make: r => {
    const { L, xs } = until(() => triple(r), t => t.xs.reduce((s, x) => s + x.N, 0) < t.L)
    const S = xs.reduce((s, x) => s + x.N, 0), [p, q, z] = xs.map(x => f(x.n, x.d)), [name, he] = who(r)
    const [text, tail] = pick(r, [
      [`${name} paints ${p} of a fence on Monday, ${q} on Tuesday, and ${z} on Wednesday. How much of the fence has ${he} painted?`, `${he} has painted ${f(S, L)} of the fence`],
      [`${name} walks ${p} mile to school, ${q} mile to the store, and ${z} mile to the park. How far does ${he} walk in all?`, `${he} walks ${f(S, L)} mile`],
    ])
    return { text, picture: { kind: 'tape', rows: [{ cells: xs.map(x => ({ w: x.N, text: f(x.n, x.d), shade: true })), brace: '?' }] }, answer: { frac: [S, L] },
      steps: [`All three parts go together, so add. ${match(xs.map(x => [x.n, x.d]), L)}`, `${xs.map(x => f(x.N, L)).join(' + ')} = ${f(S, L)}.`, `So ${tail}.`] }
  } },
]

// ── t2 · Find a piece size both fractions can use ───────────────────────────────────────────────────────────
const countTo = (by: number, to: number) => Array.from({ length: to / by }, (_, k) => by * (k + 1)).join(', ')

const T2: Level[] = [
  { style: 'count by both bottom numbers (told how)', make: r => {
    const p = pick(r, ALL), [b, d] = r() < 0.5 ? p : [p[1], p[0]], L = lcm(b, d)
    return { text: `Count by ${b}s. Then count by ${d}s. What is the first number that is in both lists?`, picture: bars(bar(b, 0), bar(d, 0)), answer: L,
      steps: [`Count by ${b}s: ${countTo(b, L)}.`, `Count by ${d}s: ${countTo(d, L)}.`, `The first number in both lists is ${L}.`] }
  } },
  { style: 'write a fraction with a new bottom number', make: r => {
    const [b, k] = pick(r, [[2, 2], [2, 3], [2, 4], [2, 5], [3, 2], [3, 3], [3, 4], [4, 2], [4, 3], [5, 2], [6, 2]] as const), L = b * k, a = top(r, b)
    return { text: `Write ${f(a, b)} with ${L} on the bottom.`, picture: bars(bar(b, a, f(a, b)), bar(L, 0)), answer: { frac: [a * k, L], exact: true },
      steps: [`${cap(pieces(L))} are ${pieces(b)} cut into ${k} pieces each.`, `So the ${a} shaded ${a === 1 ? 'piece becomes' : 'pieces become'} ${a} × ${k} = ${a * k} pieces.`, `So ${f(a, b)} = ${f(a * k, L)}.`] }
  } },
  { style: 'smallest shared piece size, no lists given', make: r => {
    const { a, b, c, d, L } = pair(r, UNREL)
    return { text: `What is the smallest piece size that ${f(a, b)} and ${f(c, d)} can both be cut into? Type the new bottom number.`, picture: two(b, a, d, c), answer: L,
      steps: [`Count by ${b}s: ${countTo(b, L)}.`, `Count by ${d}s: ${countTo(d, L)}.`, `The first number in both lists is ${L}.`] }
  } },
  { style: 'pick the right renaming (top number left alone)', make: r => {
    const { a, b, c, d, L, A, C } = pair(r, UNREL)
    const right: [string, number] = [`${f(A, L)} and ${f(C, L)}`, 0]
    const wrong: [string, number][] = [[`${f(a, L)} and ${f(c, L)}`, 1], [`${f(a, b + d)} and ${f(c, b + d)}`, 2]]
    return { text: `Which shows ${f(a, b)} and ${f(c, d)} cut into same-size pieces?`, picture: two(b, a, d, c), answer: choices(r, right, wrong),
      steps: [`Count by ${b}s and by ${d}s. The first number in both lists is ${L}.`, `Cut the top the same way as the bottom: ${f(a, b)} is ${f(A, L)}, and ${f(c, d)} is ${f(C, L)}.`, `So the answer is ${right[0]}.`] }
  } },
  { style: 'two-step story: match, then count all the pieces', make: r => {
    const { a, b, c, d, L, A, C } = pair(r, UNREL), [name, he] = who(r), food = pick(r, ['cornbread', 'brownies', 'lasagna'])
    return { text: `${name} has ${f(a, b)} of a pan of ${food} and ${f(c, d)} of another pan the same size. ${cap(he)} cuts both into the biggest pieces that match. How many pieces does ${he} have in all?`,
      picture: bars(bar(b, a), bar(d, c)), answer: A + C,
      steps: [`Count by ${b}s and by ${d}s. The first number in both lists is ${L}, so cut both into ${pieces(L)}.`, `${f(a, b)} is ${f(A, L)}, and ${f(c, d)} is ${f(C, L)}.`, `${A} + ${C} = ${A + C}, so ${he} has ${A + C} pieces.`] }
  } },
]

// ── t3 · Take away different-size pieces ────────────────────────────────────────────────────────────────────
const subPair = (r: Rng, pairs: [number, number][]) => until(() => pair(r, pairs), p => p.A > p.C)

const T3: Level[] = [
  { style: 'take away with bars, one piece size cuts into the other', make: r => {
    const { a, b, c, d, L, A, C } = subPair(r, REL)
    return { text: `Take away. ${f(a, b)} − ${f(c, d)} = ?`, picture: two(b, a, d, c), answer: { frac: [A - C, L] },
      steps: [match([[a, b], [c, d]], L), `Now take away the ${pieces(L)}: ${f(A, L)} − ${f(C, L)}.`, `So ${f(a, b)} − ${f(c, d)} = ${f(A - C, L)}.`] }
  } },
  { style: 'bare numbers, both pieces need cutting', make: r => {
    const { a, b, c, d, L, A, C } = subPair(r, UNREL)
    return { text: `Take away. ${f(a, b)} − ${f(c, d)} = ?`, picture: eq(`${f(a, b)} − ${f(c, d)} = ?`), answer: { frac: [A - C, L] },
      steps: [`${cap(pieces(b))} and ${pieces(d)} can both be cut into ${pieces(L)}.`, `${f(a, b)} is ${f(A, L)}, and ${f(c, d)} is ${f(C, L)}.`, `${f(A, L)} − ${f(C, L)} = ${f(A - C, L)}.`] }
  } },
  { style: 'spot the mistake: took the bottom numbers away', make: r => reroll(() => {
    // the first fraction has the smaller pieces, so the wrong way can take its bottom numbers away
    const { a, b, c, d, L, A, C } = until(() => pair(r, REL.map(([s, t]) => [t, s] as [number, number]), false), p => p.A > p.C), [name] = who(r)
    const right: [string, number] = [f(A - C, L), (A - C) / L]
    const wrong: [string, number][] = [[f(a - c, b - d), (a - c) / (b - d)], [f(a - c, L), (a - c) / L]]
    const picture = two(b, a, d, c)
    return { ok: b > d && a > c && distinct([right, ...wrong]) && !JSON.stringify(picture).includes(right[0]),
      text: `${name} says ${f(a, b)} − ${f(c, d)} = ${f(a - c, b - d)}. That is not right. What is the right answer?`, picture, answer: choices(r, right, wrong),
      steps: ['The bottom number is the piece size, so it never gets taken away.', match([[a, b], [c, d]], L), `${f(A, L)} − ${f(C, L)} = ${right[0]}.`] }
  }) },
  { style: 'missing top number: how much was taken away', make: r => {
    const { a, b, c, d, A, C } = until(() => subPair(r, REL), p => p.b > p.d), k = b / d, R = A - C
    return { text: `${f(a, b)} − ?/${d} = ${f(R, b)}. What is the missing top number?`, picture: eq(`${f(a, b)} − ?/${d} = ${f(R, b)}`), answer: c,
      steps: [`${f(a, b)} − ${f(R, b)} = ${f(C, b)}, so ${f(C, b)} was taken away.`, `Each ${piece(d)} is ${k} ${pieces(b)}, so ${C} ${pieces(b)} make ${C} ÷ ${k} = ${nPieces(c, d)}.`, `So the missing top number is ${c}.`] }
  } },
  { style: 'two-step story: two amounts taken away', make: r => {
    const { L, xs } = until(() => triple(r), t => t.xs[0].N > t.xs[1].N + t.xs[2].N)
    const [x, y, z] = xs, R = x.N - y.N - z.N, [[n1], [n2]] = twoNames(r)
    const [text, u, what] = pick(r, [
      [`A bag has ${f(x.n, x.d)} pound of nuts. ${n1} eats ${f(y.n, y.d)} pound and ${n2} eats ${f(z.n, z.d)} pound. How much is left?`, 'pound', 'of nuts'],
      [`A jug has ${f(x.n, x.d)} gallon of juice. ${n1} pours out ${f(y.n, y.d)} gallon and ${n2} pours out ${f(z.n, z.d)} gallon. How much juice is left?`, 'gallon', 'of juice'],
    ])
    return { text, picture: { kind: 'tape', rows: [{ cells: [{ w: x.N, text: f(x.n, x.d), shade: true }] }] }, answer: { frac: [R, L] },
      steps: [`Both amounts are taken away: ${f(x.n, x.d)} − ${f(y.n, y.d)} − ${f(z.n, z.d)}. ${match(xs.map(e => [e.n, e.d]), L)}`, `${f(x.N, L)} − ${f(y.N, L)} − ${f(z.N, L)} = ${f(R, L)}.`, `So ${f(R, L)} ${u} ${what} is left.`] }
  } },
]

// ── t4 · Add mixed numbers ──────────────────────────────────────────────────────────────────────────────────
const D5 = [3, 4, 5, 6, 8, 10]

const T4: Level[] = [
  { style: 'same bottom number, wholes and pieces drawn', make: r => {
    const { d, a, c } = until(() => { const d = pick(r, D5); return { d, a: top(r, d), c: top(r, d) } }, x => x.a + x.c < x.d)
    const w1 = int(r, 1, 2), w2 = int(r, 1, 2)
    return { text: `Add. ${mx(w1, a, d)} + ${mx(w2, c, d)} = ?`, picture: bars(...wholes(w1), bar(d, a, f(a, d)), ...wholes(w2), bar(d, c, f(c, d))), answer: ans(w1 + w2, a + c, d),
      steps: [`Add the wholes: ${w1} + ${w2} = ${w1 + w2}.`, `Add the pieces: ${f(a, d)} + ${f(c, d)} = ${f(a + c, d)}.`, `So the sum is ${mx(w1 + w2, a + c, d)}.`] }
  } },
  { style: 'same bottom number, trade pieces for a whole', make: r => {
    const { d, a, c } = until(() => { const d = pick(r, D5); return { d, a: top(r, d), c: top(r, d) } }, x => x.a + x.c > x.d)
    const w1 = int(r, 1, 5), w2 = int(r, 1, 4), W = w1 + w2, R = a + c - d
    return { text: `Add. ${mx(w1, a, d)} + ${mx(w2, c, d)} = ?`, picture: eq(`${mx(w1, a, d)} + ${mx(w2, c, d)} = ?`), answer: ans(W + 1, R, d),
      steps: [`Add the wholes: ${w1} + ${w2} = ${W}.`, `Add the pieces: ${f(a, d)} + ${f(c, d)} = ${f(a + c, d)}, which is ${mx(1, R, d)}.`, `${W} + ${mx(1, R, d)} = ${mx(W + 1, R, d)}.`] }
  } },
  { style: 'spot the mistake: added the bottom numbers', make: r => reroll(() => {
    const { a, b, c, d, L, A, C } = pair(r, ALL), w1 = int(r, 1, 4), w2 = int(r, 1, 3), W = w1 + w2, S = A + C, [name] = who(r)
    const right: [string, number] = [mx(W + 1, S - L, L), W + S / L]
    const wrong: [string, number][] = [[mx(W, a + c, b + d), W + (a + c) / (b + d)], [mx(W, S - L, L), W + (S - L) / L]]
    const picture = eq(`${mx(w1, a, b)} + ${mx(w2, c, d)} = ?`)
    return { ok: S > L && distinct([right, ...wrong]) && !JSON.stringify(picture).includes(right[0]),
      text: `${name} says ${mx(w1, a, b)} + ${mx(w2, c, d)} = ${mx(W, a + c, b + d)}. That is not right. What is the right answer?`, picture, answer: choices(r, right, wrong),
      steps: [`Add the wholes: ${w1} + ${w2} = ${W}.`, `Match the pieces before you add: ${f(A, L)} + ${f(C, L)} = ${f(S, L)}, which is ${mx(1, S - L, L)}.`, `${W} + ${mx(1, S - L, L)} = ${right[0]}.`] }
  }) },
  { style: 'story: pieces need matching', make: r => {
    const { a, b, c, d, L, A, C } = until(() => pair(r, ALL), p => p.A + p.C !== p.L), w1 = int(r, 1, 4), w2 = int(r, 1, 3), S = A + C
    const W = w1 + w2 + (S > L ? 1 : 0), R = S > L ? S - L : S, x = mx(w1, a, b), y = mx(w2, c, d), [name, he] = who(r)
    const [text, u, tail] = pick(r, [
      [`A plant is ${x} inches tall. It grows ${y} inches more. How tall is it now?`, 'inch', 'the plant is'],
      [`${name} hikes ${x} miles in the morning and ${y} miles after lunch. How far does ${he} hike in all?`, 'mile', `${he} hikes`],
    ])
    return { text, picture: { kind: 'tape', rows: [{ cells: [{ w: w1 * L + A, text: x, shade: true }, { w: w2 * L + C, text: y, shade: true }], brace: '?' }] }, answer: ans(W, R, L),
      steps: [`Add the wholes: ${w1} + ${w2} = ${w1 + w2}.`, `Match the pieces: ${f(A, L)} + ${f(C, L)} = ${f(S, L)}${S > L ? `, which is ${mx(1, R, L)}` : ''}.`, `${w1 + w2} + ${S > L ? mx(1, R, L) : f(R, L)} = ${mx(W, R, L)}, so ${tail} ${mx(W, R, L)} ${unit(u, true)}${u === 'inch' ? ' tall' : ''}.`] }
  } },
  { style: 'two-step story: three mixed numbers', make: r => {
    const { L, xs } = until(() => triple(r), t => t.xs.reduce((s, x) => s + x.N, 0) % t.L !== 0)
    const ws = xs.map(() => int(r, 1, 2)), W = ws.reduce((s, w) => s + w, 0), S = xs.reduce((s, x) => s + x.N, 0)
    const extra = Math.floor(S / L), R = S % L, parts = xs.map((x, i) => mx(ws[i], x.n, x.d)), [name, he] = who(r)
    return { text: `${name} bikes ${parts[0]} miles on Friday, ${parts[1]} miles on Saturday, and ${parts[2]} miles on Sunday. How far does ${he} bike in all?`,
      picture: eq(`${parts.join(' + ')} = ?`), answer: ans(W + extra, R, L),
      steps: [`Add the wholes: ${ws.join(' + ')} = ${W}.`, `Use ${pieces(L)} for the pieces: ${xs.map(x => f(x.N, L)).join(' + ')} = ${f(S, L)}${extra ? `, which is ${mx(extra, R, L)}` : ''}.`, `${W} + ${mx(extra, R, L)} = ${mx(W + extra, R, L)}, so ${he} bikes ${mx(W + extra, R, L)} miles.`] }
  } },
]

// ── t5 · Take away mixed numbers (break a whole) ────────────────────────────────────────────────────────────
const shortPieces = (r: Rng) => until(() => { const d = pick(r, D5); return { d, a: top(r, d), c: top(r, d) } }, x => x.a < x.c)

const T5: Level[] = [
  { style: 'break a whole: rename the mixed number', make: r => {
    const d = pick(r, D5), a = top(r, d), w = int(r, 2, 4)
    return { text: `${mx(w, a, d)} is the same as ${w - 1} ?/${d}. What is the missing top number?`, picture: bars(...wholes(w), bar(d, a, f(a, d))), answer: d + a,
      steps: [`Break 1 whole into ${nPieces(d, d)}. That leaves ${w - 1} ${w - 1 === 1 ? 'whole' : 'wholes'}.`, `Put them with the ${nPieces(a, d)} you have: ${d} + ${a} = ${d + a}.`, `So ${mx(w, a, d)} is ${mx(w - 1, d + a, d)}, and the missing top number is ${d + a}.`] }
  } },
  { style: 'take away, same bottom number, break a whole', make: r => {
    const { d, a, c } = shortPieces(r), w1 = int(r, 3, 7), w2 = int(r, 1, w1 - 2), res = mx(w1 - 1 - w2, d + a - c, d)
    return { text: `Take away. ${mx(w1, a, d)} − ${mx(w2, c, d)} = ?`, picture: eq(`${mx(w1, a, d)} − ${mx(w2, c, d)} = ?`), answer: ans(w1 - 1 - w2, d + a - c, d),
      steps: [`You cannot take ${nPieces(c, d)} from ${nPieces(a, d)}, so break a whole.`, `${mx(w1, a, d)} is the same as ${mx(w1 - 1, d + a, d)}.`, `${mx(w1 - 1, d + a, d)} − ${mx(w2, c, d)} = ${res}.`] }
  } },
  { style: 'take away from a whole number', make: r => {
    const d = pick(r, D5), c = top(r, d), w1 = int(r, 3, 7), w2 = int(r, 1, w1 - 2), res = mx(w1 - 1 - w2, d - c, d)
    return { text: `Take away. ${w1} − ${mx(w2, c, d)} = ?`, picture: eq(`${w1} − ${mx(w2, c, d)} = ?`), answer: ans(w1 - 1 - w2, d - c, d),
      steps: [`There are no ${pieces(d)} to take from, so break a whole.`, `${w1} is the same as ${mx(w1 - 1, d, d)}.`, `${mx(w1 - 1, d, d)} − ${mx(w2, c, d)} = ${res}.`] }
  } },
  { style: 'spot the mistake: flipped the pieces around', make: r => reroll(() => {
    const { d, a, c } = shortPieces(r), w1 = int(r, 3, 7), w2 = int(r, 1, w1 - 2), [name] = who(r)
    const x = mx(w1, a, d), y = mx(w2, c, d), R = d + a - c
    const right: [string, number] = [mx(w1 - 1 - w2, R, d), w1 - 1 - w2 + R / d]
    const wrong: [string, number][] = [[mx(w1 - w2, c - a, d), w1 - w2 + (c - a) / d], [mx(w1 - w2, R, d), w1 - w2 + R / d]]
    return { ok: distinct([right, ...wrong]) && !`${x} − ${y} = ?`.includes(right[0]),
      text: `${name} says ${x} − ${y} = ${mx(w1 - w2, c - a, d)}. That is not right. What is the right answer?`, picture: eq(`${x} − ${y} = ?`), answer: choices(r, right, wrong),
      steps: [`You are taking away ${f(c, d)}, so do not flip it around to ${f(c - a, d)}.`, `There are not enough ${pieces(d)}, so break a whole: ${x} is ${mx(w1 - 1, d + a, d)}.`, `${mx(w1 - 1, d + a, d)} − ${y} = ${right[0]}.`] }
  }) },
  { style: 'story: match the pieces, then break a whole', make: r => {
    const { a, b, c, d, L, A, C } = until(() => pair(r, ALL), p => p.A < p.C), w1 = int(r, 3, 6), w2 = int(r, 1, w1 - 2)
    const x = mx(w1, a, b), y = mx(w2, c, d), res = mx(w1 - 1 - w2, A + L - C, L), [name, he] = who(r)
    const renamed = [[w1, a, b], [w2, c, d]].filter(([, , q]) => q !== L).map(([w, n, q]) => `${mx(w, n, q)} is ${mx(w, (n * L) / q, L)}`)
    const [text, tail] = pick(r, [
      [`A board is ${x} feet long. ${name} cuts off ${y} feet. How long is the board now?`, `the board is ${res} feet long`],
      [`A rope is ${x} yards long. ${name} cuts off ${y} yards. How much rope is left?`, `${res} yards of rope are left`],
      [`A trail is ${x} miles long. ${name} has hiked ${y} miles. How far does ${he} still have to go?`, `${he} still has ${res} miles to go`],
    ])
    return { text, picture: eq(`${x} − ${y} = ?`), answer: ans(w1 - 1 - w2, A + L - C, L),
      steps: [`Make the pieces match: ${list(renamed)}.`, `You cannot take ${nPieces(C, L)} from ${nPieces(A, L)}, so break a whole: ${mx(w1, A, L)} is ${mx(w1 - 1, A + L, L)}.`, `${mx(w1 - 1, A + L, L)} − ${mx(w2, C, L)} = ${res}, so ${tail}.`] }
  } },
]

// ── t6 · Is it more or less than 1? ─────────────────────────────────────────────────────────────────────────
const D6 = [3, 4, 5, 6, 7, 8, 9, 10, 12]
/** A fraction on one side of 1/2 (never exactly 1/2). */
const side = (r: Rng, over: boolean) => until(() => { const d = pick(r, D6); return { n: top(r, d), d } }, x => (over ? 2 * x.n > x.d : 2 * x.n < x.d))
const vs = ({ n, d }: { n: number; d: number }, over: boolean) => `Half of ${d} is ${half(d)}. ${n} is ${over ? 'more' : 'less'}, so ${f(n, d)} is ${over ? 'more' : 'less'} than 1/2.`
const HALF1 = ['more than 1', 'less than 1']

const T6: Level[] = [
  { style: 'one fraction against 1/2, half bar drawn', make: r => {
    const over = r() < 0.5, x = side(r, over)
    return { text: `Is ${f(x.n, x.d)} more or less than 1/2?`, picture: bars(bar(2, 1, '1/2'), bar(x.d, x.n, f(x.n, x.d))), answer: { choices: ['more than 1/2', 'less than 1/2'], correct: over ? 0 : 1 },
      steps: [`Half of ${x.d} pieces is ${half(x.d)} pieces.`, `You have ${x.n}, which is ${over ? 'more' : 'less'}. So ${f(x.n, x.d)} is ${over ? 'more' : 'less'} than 1/2.`] }
  } },
  { style: 'sum against 1, both parts on the same side of 1/2', make: r => {
    const over = r() < 0.5, x = side(r, over), y = side(r, over), w = over ? 'more' : 'less'
    return { text: `Is ${f(x.n, x.d)} + ${f(y.n, y.d)} more or less than 1?`, picture: two(x.d, x.n, y.d, y.n), answer: { choices: HALF1, correct: over ? 0 : 1 },
      steps: [vs(x, over), vs(y, over), `Both are ${w} than 1/2, so the sum is ${w} than 1.`] }
  } },
  { style: 'one part is exactly a half', make: r => {
    const over = r() < 0.5, k = int(r, 1, 5), x = side(r, over), w = over ? 'more' : 'less', h = f(k, 2 * k)
    const [p, q] = r() < 0.5 ? [h, f(x.n, x.d)] : [f(x.n, x.d), h]
    return { text: `Is ${p} + ${q} more or less than 1?`, picture: eq(`${p} + ${q}`), answer: { choices: HALF1, correct: over ? 0 : 1 },
      steps: [...(k > 1 ? [`${h} is exactly 1/2, because half of ${2 * k} is ${k}.`] : []), vs(x, over), `1/2 + 1/2 is exactly 1, and ${f(x.n, x.d)} is ${w} than 1/2. So ${p} + ${q} is ${w} than 1.`] }
  } },
  { style: 'pick the sum that is more (or less) than 1', make: r => reroll(() => {
    const more = r() < 0.5, sum = (o: boolean): [string, number] => { const x = side(r, o), y = side(r, o); return [`${f(x.n, x.d)} + ${f(y.n, y.d)}`, x.n / x.d + y.n / y.d] }
    const R = sum(more), W = [sum(!more), sum(!more)], right = R[0], all = shuffle(r, [R, ...W].map(c => c[0])), w = more ? 'more' : 'less'
    return { ok: distinct([R, ...W]),
      text: `Which sum is ${w} than 1?`, picture: bars(bar(2, 1, '1/2')), answer: { choices: all, correct: all.indexOf(right) },
      steps: ['Compare each part to 1/2.', `In ${right}, both parts are ${w} than 1/2. In the other sums, both parts are ${more ? 'less' : 'more'} than 1/2.`, `So the answer is ${right}.`] }
  }) },
  { style: 'story: is there enough?', make: r => {
    const over = r() < 0.5, x = side(r, over), [name, he] = who(r), w = over ? 'more' : 'less'
    const [thing, u, box, need] = pick(r, [['paint', 'gallon', 'bucket', 'to paint a fence'], ['flour', 'cup', 'bag', 'for the bread'], ['juice', 'quart', 'jug', 'for the party']] as const)
    // half the time one part is exactly a half, which decides it the same way as the other part
    const y = r() < 0.5 ? side(r, over) : (() => { const k = int(r, 1, 4); return { n: k, d: 2 * k } })()
    const exact = 2 * y.n === y.d
    return { text: `${name} needs 1 ${u} of ${thing} ${need}. ${cap(he)} has ${f(x.n, x.d)} ${u} in one ${box} and ${f(y.n, y.d)} ${u} in another. Does ${he} have enough?`,
      picture: bars(bar(x.d, x.n), bar(y.d, y.n)), answer: { choices: ['yes', 'no'], correct: over ? 0 : 1 },
      steps: [vs(x, over), exact ? (y.n === 1 ? '1/2 + 1/2 is exactly 1.' : `${f(y.n, y.d)} is exactly 1/2, and 1/2 + 1/2 is exactly 1.`) : vs(y, over), `So together ${he} has ${w} than 1 ${u}, and the answer is ${over ? 'yes' : 'no'}.`] }
  } },
]

// ── t7 · Fraction stories: put together, or find the gap ───────────────────────────────────────────────────
type Story = { text: string; why: string; tail: (a: string) => string }
const together = (r: Rng, x: string, y: string): Story => {
  const [name, he] = who(r)
  return pick(r, [
    { text: `${name} walks ${x} mile to the store and then ${y} mile to the park. How far does ${he} walk in all?`, why: '"In all" means put the parts together, so add', tail: a => `${he} walks ${a} mile` },
    { text: `${name} paints ${x} of a fence in the morning and ${y} of it after lunch. How much of the fence has ${he} painted?`, why: 'Both parts of the fence go together, so add', tail: a => `${he} has painted ${a} of the fence` },
    { text: `A plant grows ${x} inch one week and ${y} inch the next week. How much does it grow in the two weeks?`, why: 'Both weeks go together, so add', tail: a => `it grows ${a} inch` },
  ])
}
const gap = (r: Rng, x: string, y: string): Story => {
  const [[n1, he], [n2]] = twoNames(r)
  return pick(r, [
    { text: `${n1} runs ${x} mile. ${n2} runs ${y} mile. How much farther does ${n1} run?`, why: '"How much farther" means find the gap, so take away', tail: a => `${n1} runs ${a} mile farther` },
    { text: `${n1} has ${x} yard of ribbon. ${n2} has ${y} yard. How much more ribbon does ${n1} have?`, why: '"How much more" means find the gap, so take away', tail: a => `${n1} has ${a} yard more` },
    { text: `${n1} reads for ${x} hour. ${n2} reads for ${y} hour. How much longer does ${n1} read?`, why: '"How much longer" means find the gap, so take away', tail: a => `${he} reads ${a} hour longer` },
  ])
}
const storyPair = (r: Rng, add: boolean) => until(() => pair(r, ALL), p => p.A > p.C && (!add || p.A + p.C < p.L))

const T7: Level[] = [
  { style: 'put the parts together, bar drawn', make: r => {
    const { a, b, c, d, L, A, C } = storyPair(r, true), s = together(r, f(a, b), f(c, d))
    return { text: s.text, picture: { kind: 'tape', rows: [{ cells: [{ w: A, text: f(a, b), shade: true }, { w: C, text: f(c, d), shade: true }], brace: '?' }] }, answer: { frac: [A + C, L] },
      steps: [`${s.why}: ${f(a, b)} + ${f(c, d)}.`, match([[a, b], [c, d]], L), `${f(A, L)} + ${f(C, L)} = ${f(A + C, L)}, so ${s.tail(f(A + C, L))}.`] }
  } },
  { style: 'find the gap, bars drawn', make: r => {
    const { a, b, c, d, L, A, C } = storyPair(r, false), s = gap(r, f(a, b), f(c, d))
    return { text: s.text, picture: { kind: 'tape', rows: [{ cells: [{ w: A, text: f(a, b), shade: true }] }, { cells: [{ w: C, text: f(c, d), shade: true }, { w: A - C, text: '?' }] }] }, answer: { frac: [A - C, L] },
      steps: [`${s.why}: ${f(a, b)} − ${f(c, d)}.`, match([[a, b], [c, d]], L), `${f(A, L)} − ${f(C, L)} = ${f(A - C, L)}, so ${s.tail(f(A - C, L))}.`] }
  } },
  { style: 'pick the number sentence: add or take away?', make: r => {
    const { a, b, c, d } = storyPair(r, true), add = r() < 0.5, x = f(a, b), y = f(c, d), s = add ? together(r, x, y) : gap(r, x, y)
    const plus = `${x} + ${y}`, minus = `${x} − ${y}`
    return { text: `${s.text} Which number sentence answers it?`, picture: eq(x, [y]), answer: { choices: [plus, minus], correct: add ? 0 : 1 },
      steps: [`${s.why}.`, `So the number sentence is ${add ? plus : minus}.`] }
  } },
  { style: 'how much more is needed (take away, though it says more)', make: r => {
    const { a, b, c, d, L, A, C } = storyPair(r, false), x = f(a, b), y = f(c, d), R = f(A - C, L), [name, he] = who(r)
    const [text, tail] = pick(r, [
      [`A recipe needs ${x} cup of milk. ${name} has ${y} cup. How much more milk does ${he} need?`, `${he} needs ${R} cup more`],
      [`${name} wants to walk ${x} mile. ${cap(he)} has walked ${y} mile so far. How much farther does ${he} need to walk?`, `${he} needs to walk ${R} mile more`],
    ])
    return { text, picture: eq(`need ${x}`, [`have ${y}`]), answer: { frac: [A - C, L] },
      steps: [`${name} has part and needs the rest. The rest is the gap, so take away: ${x} − ${y}.`, match([[a, b], [c, d]], L), `${f(A, L)} − ${f(C, L)} = ${R}, so ${tail}.`] }
  } },
  { style: 'two-step story', make: r => {
    const eat = r() < 0.5
    const { L, xs } = until(() => triple(r), t => { const [x, y, z] = t.xs; const R = eat ? x.N - y.N - z.N : x.N + y.N - z.N; return R > 0 && R < t.L })
    const [x, y, z] = xs, R = eat ? x.N - y.N - z.N : x.N + y.N - z.N, [[n1, he], [n2]] = twoNames(r), F = (e: { n: number; d: number }) => f(e.n, e.d)
    const s = eat
      ? { text: `A bag has ${F(x)} pound of nuts. ${n1} eats ${F(y)} pound and ${n2} eats ${F(z)} pound. How much is left?`, why: `Both amounts are eaten, so take both away: ${F(x)} − ${F(y)} − ${F(z)}.`, sum: `${f(x.N, L)} − ${f(y.N, L)} − ${f(z.N, L)}`, tail: `${f(R, L)} pound is left` }
      : { text: `${n1} has ${F(x)} cup of flour. ${cap(he)} buys ${F(y)} cup more, then uses ${F(z)} cup in a cake. How much flour is left?`, why: `Add what ${he} buys, then take away what ${he} uses: ${F(x)} + ${F(y)} − ${F(z)}.`, sum: `${f(x.N, L)} + ${f(y.N, L)} − ${f(z.N, L)}`, tail: `${f(R, L)} cup is left` }
    return { text: s.text, picture: eq(F(x), [F(y), F(z)]), answer: { frac: [R, L] },
      steps: [s.why, match(xs.map(e => [e.n, e.d]), L), `${s.sum} = ${f(R, L)}, so ${s.tail}.`] }
  } },
]

// ── t8 · Line plots with fractions ──────────────────────────────────────────────────────────────────────────
const dot = (labels: string[], values: number[], xLabel: string): Picture => ({ kind: 'chart', type: 'dot', labels, values, xLabel })
/** k/d in its simplest name: 2/8 → 1/4, 8/8 → 1. */
const simple = (k: number, d: number) => { const g = gcd(k, d); return d / g === 1 ? `${k / g}` : f(k / g, d / g) }
/** 3–4 evenly spaced tops from 1..max, so the plot's marks sit on a real number line. */
const tops = (r: Rng, max: number, want = int(r, 3, 4)) => until(() => {
  const n = Math.min(want, max), s = n * 2 - 1 <= max ? pick(r, [1, 2]) : 1, lo = int(r, 1, Math.max(1, max - s * (n - 1)))
  return Array.from({ length: n }, (_, i) => lo + s * i)
}, ks => ks.at(-1)! <= max)
const counts = (r: Rng, n: number) => Array.from({ length: n }, () => int(r, 1, 3))
const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0)

const T8: Level[] = [
  { style: 'read the line plot: how many at one number', make: r => {
    const d = pick(r, [4, 6, 8]), ks = tops(r, d - 1), vals = counts(r, ks.length), labels = ks.map(k => f(k, d)), i = int(r, 0, ks.length - 1), n = vals[i]
    return { text: `The line plot shows how much ${sum(vals)} bean plants grew, in inches. How many plants grew ${labels[i]} inch?`, picture: dot(labels, vals, 'inches grown'), answer: n,
      steps: ['Each ✕ is one plant.', `Count the ✕ above ${labels[i]}: ${Array.from({ length: n }, (_, k) => k + 1).join(', ')}.`, `So ${n} ${n === 1 ? 'plant' : 'plants'} grew ${labels[i]} inch.`] }
  } },
  { style: 'gap between the farthest and the shortest', make: r => {
    const { d, ks } = until(() => { const d = pick(r, [4, 6, 8, 10]); return { d, ks: tops(r, d - 1) } }, x => !x.ks.includes(x.ks.at(-1)! - x.ks[0]))
    const vals = counts(r, ks.length), labels = ks.map(k => f(k, d)), hi = labels.at(-1)!, lo = labels[0], R = f(ks.at(-1)! - ks[0], d)
    return { text: `The line plot shows how far ${sum(vals)} snails crawled, in feet. How much farther did the snail that went farthest crawl than the one that went the shortest?`, picture: dot(labels, vals, 'feet crawled'), answer: { frac: [ks.at(-1)! - ks[0], d] },
      steps: [`Each ✕ is one snail. The ✕ farthest right is above ${hi}, and the ✕ farthest left is above ${lo}.`, `Take away: ${hi} − ${lo}.`, `${hi} − ${lo} = ${R}, so it crawled ${R} foot farther.`] }
  } },
  { style: 'add up everything at one number', make: r => {
    const { d, ks, vals, i } = until(() => {
      const d = pick(r, [3, 4, 6, 8]), ks = tops(r, d - 1, Math.min(d - 1, int(r, 3, 4))), vals = counts(r, ks.length).map(v => v + 1), i = int(r, 0, ks.length - 1)
      return { d, ks, vals, i }
    }, x => { const T = x.vals[x.i] * x.ks[x.i]; return T % x.d !== 0 && !x.ks.includes(T) })
    const k = vals[i], n = ks[i], T = k * n, lab = f(n, d), W = Math.floor(T / d), R = T % d, a = mx(W, R, d)
    return { text: `The line plot shows how much juice ${sum(vals)} kids drank, in cups. How much did the kids who drank ${lab} cup drink in all?`, picture: dot(ks.map(q => f(q, d)), vals, 'cups of juice'), answer: ans(W, R, d),
      steps: [`There are ${k} ✕ above ${lab}, so ${k} kids drank ${lab} cup each.`, `Add: ${Array(k).fill(lab).join(' + ')} = ${f(T, d)}.`, W ? `${f(T, d)} is ${a}, so they drank ${a} ${unit('cup', true)}.` : `So they drank ${a} cup.`] }
  } },
  { style: 'gap between two numbers written in different-size pieces', make: r => {
    const { d, ks } = until(() => { const d = pick(r, [4, 6, 8, 10]); return { d, ks: tops(r, d) } }, x => {
      const hi = x.ks.at(-1)!, lo = x.ks[0]
      return !x.ks.includes(hi - lo) && (simple(hi, x.d) !== f(hi, x.d) || simple(lo, x.d) !== f(lo, x.d))
    })
    const vals = counts(r, ks.length), labels = ks.map(k => simple(k, d)), hi = ks.at(-1)!, lo = ks[0], R = f(hi - lo, d)
    const renamed = [hi, lo].filter(k => simple(k, d) !== f(k, d)).map(k => `${simple(k, d)} is ${f(k, d)}`)
    return { text: `The line plot shows how long ${sum(vals)} worms are, in inches. How much longer is the longest worm than the shortest worm?`, picture: dot(labels, vals, 'inches long'), answer: { frac: [hi - lo, d] },
      steps: [`The longest worm is the ✕ above ${simple(hi, d)}. The shortest is the ✕ above ${simple(lo, d)}.`, `Use ${pieces(d)}: ${list(renamed)}.`, `${f(hi, d)} − ${f(lo, d)} = ${R}, so it is ${R} inch longer.`] }
  } },
  { style: 'two-step: add every ✕ on the plot', make: r => {
    const { d, ks, vals } = until(() => {
      const d = pick(r, [4, 6, 8]), ks = tops(r, d - 1, 3), vals = ks.map(() => int(r, 1, 2))
      return { d, ks, vals }
    }, x => { const T = sum(x.ks.map((k, i) => k * x.vals[i])); return T % x.d !== 0 && !x.ks.includes(T) })
    const all = ks.flatMap((k, i) => Array(vals[i]).fill(k) as number[]), T = sum(all), N = all.length, W = Math.floor(T / d), R = T % d, a = mx(W, R, d)
    return { text: `The line plot shows the weights of ${N} apples, in pounds. How much do all ${N} apples weigh together?`, picture: dot(ks.map(k => simple(k, d)), vals, 'pounds'), answer: ans(W, R, d),
      steps: [`Each ✕ is one apple: ${list(all.map(k => simple(k, d)))}.`, `Use ${pieces(d)}: ${all.map(k => f(k, d)).join(' + ')} = ${f(T, d)}.`, W ? `${f(T, d)} is ${a}, so the apples weigh ${a} ${unit('pound', true)}.` : `So the apples weigh ${a} pound.`] }
  } },
]

export const G5M2_LADDERS: Record<string, Level[]> = {
  'g5m2-t1': T1, 'g5m2-t2': T2, 'g5m2-t3': T3, 'g5m2-t4': T4, 'g5m2-t5': T5, 'g5m2-t6': T6, 'g5m2-t7': T7, 'g5m2-t8': T8,
}
