/**
 * Grade 4 · Module 4 — Foundations for fraction operations. Practice ladders, easiest style first (see ../adaptive.ts
 * and the reference ladders in ./g5m1.ts, ./g3m5.ts). Fraction answers are written like the lessons write them:
 * `{ frac }` (with `whole` for a mixed number) and no `exact`, so an equal fraction is also right — except where the
 * question asks for wholes and a fraction, where typing the fraction back would not be an answer.
 */
import type { Picture } from '../script'
import { int, pick, shuffle, type Level, type Rng } from '../adaptive'

const f = (n: number, d: number) => `${n}/${d}`
const pl = (k: number, w: string) => `${k} ${w}${k === 1 ? '' : 's'}`
const until = <T>(gen: () => T, ok: (x: T) => boolean): T => { let x = gen(); while (!ok(x)) x = gen(); return x }

const SING: Record<number, string> = { 2: 'half', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 8: 'eighth', 10: 'tenth', 12: 'twelfth', 100: 'hundredth' }
const PLUR: Record<number, string> = { 2: 'halves', 3: 'thirds', 4: 'fourths', 5: 'fifths', 6: 'sixths', 8: 'eighths', 10: 'tenths', 12: 'twelfths', 100: 'hundredths' }
/** "1 fourth", "3 fourths". */
const pieces = (n: number, d: number) => `${n} ${n === 1 ? SING[d] : PLUR[d]}`

type Bar = { parts: number; shaded: number; label?: string; split?: number; shade2?: number }
const bars = (...b: Bar[]): Picture => ({ kind: 'bars', bars: b })
const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
/** Two labelled, unshaded bars — the lessons' compare picture. */
const pair = (n1: number, d1: number, n2: number, d2: number) => bars({ parts: d1, shaded: n1, label: f(n1, d1) }, { parts: d2, shaded: n2, label: f(n2, d2) })
const copies = (n: number, parts: number, shaded = 1): Picture => ({ kind: 'bars', bars: Array.from({ length: n }, () => ({ parts, shaded })) })

const inOrder = (choices: string[], right: string) => ({ choices, correct: choices.indexOf(right) })
const choose = (r: Rng, right: string, wrong: string[]) => inOrder(shuffle(r, [right, ...wrong]), right)
const SIGNS = ['<', '>', '=']
const sign = (x: number, y: number) => (x < y ? '<' : x > y ? '>' : '=')
const YES_NO = (yes: boolean) => ({ choices: ['yes', 'no'], correct: yes ? 0 : 1 })

const GIRLS = ['Ava', 'Mia', 'Nora', 'Kim', 'Zoe', 'Ella'] as const
const BOYS = ['Sam', 'Leo', 'Ben', 'Jay', 'Max', 'Raj'] as const
const KIDS = [...GIRLS, ...BOYS] as const
const twoKids = (r: Rng) => until(() => [pick(r, KIDS), pick(r, KIDS)] as const, ([a, b]) => a !== b)

// ── t1 · Same amount, smaller pieces ────────────────────────────────────────────────────────────────────────
/** n/d = N/D with D = d × k and D at most 12. */
const equal1 = (r: Rng) => {
  const [d, k] = pick(r, [[2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [3, 2], [3, 3], [3, 4], [4, 2], [4, 3], [5, 2], [6, 2]] as const)
  const n = int(r, 1, d - 1)
  return { d, k, n, D: d * k, N: n * k }
}

const T1: Level[] = [
  { style: 'bars, missing top number', make: r => {
    const { d, k, n, D, N } = equal1(r)
    return { text: `Cut the whole bar into ${D} equal pieces instead of ${d}. ${f(n, d)} = ?/${D}. What is the missing top number?`,
      picture: bars({ parts: d, shaded: n, label: f(n, d) }, { parts: D, shaded: 0, label: `?/${D}` }), answer: N,
      steps: [`To go from ${d} pieces to ${D} pieces, cut each piece into ${k}.`, `Multiply the top by ${k} too: ${n} × ${k}.`, `So ${f(n, d)} = ${f(N, D)}. The missing number is ${N}.`] }
  } },
  { style: 'bare numbers, missing top or bottom', make: r => {
    const { d, k, n, D, N } = r() < 0.25 ? (() => { const n = int(r, 2, 9); return { d: 10, k: 10, n, D: 100, N: n * 10 } })() : equal1(r)
    if (r() < 0.5) {
      const q = `${f(n, d)} = ?/${D}`
      return { text: `What number goes in the box? ${q}`, picture: eq(q), answer: N,
        steps: [`The bottom went from ${d} to ${D}, so it was multiplied by ${k}.`, `Multiply the top by ${k} too: ${n} × ${k}.`, `So ${f(n, d)} = ${f(N, D)}. The missing number is ${N}.`] }
    }
    const q = `${f(n, d)} = ${N}/?`
    return { text: `What number goes in the box? ${q}`, picture: eq(q), answer: D,
      steps: [`The top went from ${n} to ${N}, so it was multiplied by ${k}.`, `Multiply the bottom by ${k} too: ${d} × ${k}.`, `So ${f(n, d)} = ${f(N, D)}. The missing number is ${D}.`] }
  } },
  { style: 'pick the true one (change only one number trap)', make: r => {
    const { d, k, n, D, N } = equal1(r), right = `${f(n, d)} = ${f(N, D)}`
    return { text: 'Which one is true?', picture: bars({ parts: d, shaded: n }, { parts: D, shaded: 0 }),
      answer: choose(r, right, [`${f(n, d)} = ${f(n, D)}`, `${f(n, d)} = ${f(N, d)}`]),
      steps: ['Whatever you multiply the bottom by, multiply the top by it too.', `${d} × ${k} = ${D}, so the top is ${n} × ${k} = ${N}.`, `So ${right}.`] }
  } },
  { style: 'story, same amount in smaller slices', make: r => {
    const { d, k, n, D, N } = equal1(r), [a, b] = twoKids(r)
    return { text: `${a} eats ${f(n, d)} of a pizza. ${b} eats the same amount of a same-size pizza, but that pizza is cut into ${D} equal slices. How many slices does ${b} eat?`,
      picture: bars({ parts: d, shaded: n, label: f(n, d) }, { parts: D, shaded: 0 }), answer: N,
      steps: [`${D} slices is every piece of ${d} cut into ${k}.`, `Multiply the top by ${k} too: ${n} × ${k} = ${N}.`, `So ${f(n, d)} = ${f(N, D)}. ${b} eats ${pl(N, 'slice')}.`] }
  } },
  { style: 'two-step story (how many more pieces)', make: r => {
    const { d, k, n, D, N } = equal1(r), e = int(r, 1, N - 1), more = N - e, [a, b] = twoKids(r)
    return { text: `${a} eats ${f(n, d)} of a pan of cornbread. ${b} has a same-size pan cut into ${D} equal pieces and has eaten ${pl(e, 'piece')}. How many more pieces must ${b} eat to eat the same amount as ${a}?`,
      picture: bars({ parts: d, shaded: n, label: f(n, d) }, { parts: D, shaded: e }), answer: more,
      steps: [`${f(n, d)} = ${f(N, D)}, because each piece of ${d} is cut into ${k}, and ${n} × ${k} = ${N}.`, `${b} has eaten ${e}, and ${N} − ${e} = ${more}.`, `So ${b} must eat ${pl(more, 'more piece')}.`] }
  } },
]

// ── t2 · Compare with one half ──────────────────────────────────────────────────────────────────────────────
const halfOf = (d: number) => (d % 2 === 0 ? `${d / 2}` : `${(d - 1) / 2} and a half`)
/** -1 below half, 0 exactly half, 1 above half. */
const vsHalf = (n: number, d: number) => Math.sign(2 * n - d)
const side = (n: number, d: number) => {
  const s = vsHalf(n, d)
  if (s === 0) return `Half of ${d} is ${halfOf(d)}, so ${f(n, d)} is exactly 1/2.`
  return `Half of ${d} is ${halfOf(d)}. ${n} is ${s < 0 ? 'less' : 'more'} than ${halfOf(d)}, so ${f(n, d)} is ${s < 0 ? 'less' : 'more'} than 1/2.`
}
const DEN2 = [4, 5, 6, 8, 10, 12] as const
const aboveHalf = (r: Rng, d: number) => int(r, Math.floor(d / 2) + 1, d - 1)
const belowHalf = (r: Rng, d: number) => int(r, 1, Math.ceil(d / 2) - 1)
/** Two fractions with different bottoms: one above half and one below (or, sometimes, both exactly half). */
const across = (r: Rng) => {
  const [d1, d2] = until(() => [pick(r, DEN2), pick(r, DEN2)], ([a, b]) => a !== b)
  if (d1 % 2 === 0 && d2 % 2 === 0 && r() < 0.2) return { a: d1 / 2, b: d1, c: d2 / 2, d: d2 }
  return r() < 0.5 ? { a: aboveHalf(r, d1), b: d1, c: belowHalf(r, d2), d: d2 } : { a: belowHalf(r, d1), b: d1, c: aboveHalf(r, d2), d: d2 }
}

const T2: Level[] = [
  { style: 'bar next to 1/2: more, less or exactly', make: r => {
    const d = pick(r, DEN2), kind = d % 2 === 0 && r() < 0.2 ? 0 : r() < 0.5 ? 1 : -1
    const n = kind === 0 ? d / 2 : kind > 0 ? aboveHalf(r, d) : belowHalf(r, d)
    const right = kind === 0 ? 'exactly 1/2' : kind > 0 ? 'more than 1/2' : 'less than 1/2'
    return { text: `Look at the bars. Is ${f(n, d)} more than 1/2, less than 1/2, or exactly 1/2?`,
      picture: bars({ parts: d, shaded: n, label: f(n, d) }, { parts: 2, shaded: 1, label: '1/2' }),
      answer: inOrder(['more than 1/2', 'less than 1/2', 'exactly 1/2'], right),
      steps: ['Find half of the bottom number, and compare the top to it.', side(n, d), `So the answer is ${right}.`] }
  } },
  { style: 'which sign goes in the middle', make: r => {
    const { a, b, c, d } = across(r), s = sign(a * d, c * b)
    return { text: `Which sign goes in the middle? ${f(a, b)} ? ${f(c, d)}`, picture: pair(a, b, c, d), answer: inOrder(SIGNS, s),
      steps: [side(a, b), side(c, d), `So ${f(a, b)} ${s} ${f(c, d)}. The answer is ${s}.`] }
  } },
  { style: 'pick the one fraction above half', make: r => {
    const ds = shuffle(r, DEN2).slice(0, 3)
    const up = { n: aboveHalf(r, ds[0]), d: ds[0] }
    const [lo1, lo2] = until(() => [{ n: belowHalf(r, ds[1]), d: ds[1] }, { n: belowHalf(r, ds[2]), d: ds[2] }], ([x, y]) => x.n * y.d !== y.n * x.d)
    const right = f(up.n, up.d)
    return { text: 'Which fraction is more than 1/2?', picture: bars({ parts: 2, shaded: 1, label: '1/2' }),
      answer: choose(r, right, [f(lo1.n, lo1.d), f(lo2.n, lo2.d)]),
      steps: [side(lo1.n, lo1.d), side(lo2.n, lo2.d), `${side(up.n, up.d)} So the answer is ${right}.`] }
  } },
  { style: 'check a claim (bigger bottom number trap)', make: r => {
    const { a, b, c, d } = until(() => across(r), x => x.b !== x.d && vsHalf(x.a, x.b) !== 0)
    // The claim always names the fraction with the bigger bottom number as the bigger fraction.
    const [x, y] = b > d ? [{ n: a, d: b }, { n: c, d }] : [{ n: c, d }, { n: a, d: b }]
    const yes = vsHalf(x.n, x.d) > 0, name = pick(r, KIDS)
    return { text: `${name} says ${f(x.n, x.d)} is more than ${f(y.n, y.d)}. Is ${name} right?`, picture: pair(x.n, x.d, y.n, y.d), answer: YES_NO(yes),
      steps: [side(x.n, x.d), side(y.n, y.d), `So ${f(x.n, x.d)} is ${yes ? 'more' : 'less'} than ${f(y.n, y.d)}, and the answer is ${yes ? 'yes' : 'no'}.`] }
  } },
  { style: 'two-step story (who has more left)', make: r => {
    const { a, b, c, d } = until(() => across(r), x => vsHalf(x.a, x.b) !== 0)
    const [p, q] = twoKids(r), winner = vsHalf(a, b) > 0 ? p : q
    const ea = b - a, ec = d - c
    return { text: `${p} and ${q} each have a same-size pizza. ${p}'s pizza is cut into ${b} slices, and ${p} eats ${ea}. ${q}'s pizza is cut into ${d} slices, and ${q} eats ${ec}. Who has more pizza left?`,
      picture: bars({ parts: b, shaded: a, label: "shaded: slices left" }, { parts: d, shaded: c, label: "shaded: slices left" }), answer: inOrder([p, q], winner),
      steps: [`${p} has ${b} − ${ea} = ${pl(a, 'slice')} left, so ${f(a, b)}. ${side(a, b)}`, `${q} has ${d} − ${ec} = ${pl(c, 'slice')} left, so ${f(c, d)}. ${side(c, d)}`, `So ${winner} has more pizza left.`] }
  } },
]

// ── t3 · Compare by making pieces match ─────────────────────────────────────────────────────────────────────
const FAMILY = [[2, 4], [2, 6], [2, 8], [2, 10], [3, 6], [3, 12], [4, 8], [4, 12], [5, 10], [6, 12]] as const
/** a/d against c/D, where D is a multiple of d; about one time in five they are equal. */
const match3 = (r: Rng) => {
  const [d, D] = pick(r, FAMILY), k = D / d, a = int(r, 1, d - 1)
  const c = r() < 0.2 ? a * k : until(() => int(r, 1, D - 1), c => c !== a * k)
  return { d, D, k, a, c, A: a * k }
}
const words = (x: number, y: number) => (x < y ? 'less than' : x > y ? 'more than' : 'the same as')
const matchSteps = (d: number, D: number, k: number, a: number, c: number, x: string, y: string, s: string) => [
  `Cut each ${SING[d]} into ${k} pieces: ${f(a, d)} = ${f(a * k, D)}.`,
  `Now both are ${PLUR[D]}: ${f(a * k, D)} is ${words(a * k, c)} ${f(c, D)}.`,
  `So ${x} ${s} ${y}. The answer is ${s}.`,
]

const T3: Level[] = [
  { style: 'bar already cut to match, which sign', make: r => {
    const { d, D, k, a, c, A } = match3(r), s = sign(A, c)
    return { text: `The top bar's pieces are cut to match the bottom bar. Which sign goes in the middle? ${f(a, d)} ? ${f(c, D)}`,
      picture: bars({ parts: d, shaded: a, split: k, label: f(a, d) }, { parts: D, shaded: c, label: f(c, D) }), answer: inOrder(SIGNS, s),
      steps: matchSteps(d, D, k, a, c, f(a, d), f(c, D), s) }
  } },
  { style: 'bare fractions, which sign', make: r => {
    const { d, D, k, a, c, A } = match3(r)
    const flip = r() < 0.5, [x, y] = flip ? [f(c, D), f(a, d)] : [f(a, d), f(c, D)], s = flip ? sign(c, A) : sign(A, c)
    return { text: `Which sign goes in the middle? ${x} ? ${y}`, picture: flip ? pair(c, D, a, d) : pair(a, d, c, D), answer: inOrder(SIGNS, s),
      steps: matchSteps(d, D, k, a, c, x, y, s) }
  } },
  { style: 'biggest of three', make: r => {
    const D = pick(r, [6, 8, 10, 12] as const)
    const divs = { 6: [2, 3, 6], 8: [2, 4, 8], 10: [2, 5, 10], 12: [2, 3, 4, 6, 12] }[D]
    const ds = shuffle(r, divs).slice(0, 3)
    const fr = until(() => ds.map(d => ({ n: int(r, 1, d - 1), d })), xs => new Set(xs.map(x => x.n * D / x.d)).size === 3)
    const big = fr.reduce((m, x) => (x.n * D / x.d > m.n * D / m.d ? x : m)), right = f(big.n, big.d)
    const shown = fr.map(x => (x.d === D ? f(x.n, D) : `${f(x.n, x.d)} = ${f(x.n * D / x.d, D)}`))
    return { text: `Which is the biggest: ${f(fr[0].n, fr[0].d)}, ${f(fr[1].n, fr[1].d)} or ${f(fr[2].n, fr[2].d)}?`,
      picture: bars(...fr.map(x => ({ parts: x.d, shaded: x.n }))), answer: inOrder(fr.map(x => f(x.n, x.d)), right),
      steps: [`Make the pieces match: write them all as ${PLUR[D]}.`, `${shown.join(', ')}.`, `The most ${PLUR[D]} is ${big.n * D / big.d}, so the biggest is ${right}.`] }
  } },
  { style: 'story: who has more, or the same', make: r => {
    const { d, D, k, a, c, A } = match3(r), [p, q] = twoKids(r)
    const [thing, unit] = pick(r, [['ribbon', 'of a ribbon'], ['bottle of water', 'of a bottle of water'], ['granola bar', 'of a granola bar']] as const)
    const right = A > c ? p : A < c ? q : 'the same amount'
    return { text: `${p} has ${f(a, d)} ${unit}. ${q} has ${f(c, D)} of the same size ${thing}. Who has more, or do they have the same amount?`,
      picture: pair(a, d, c, D), answer: inOrder([p, q, 'the same amount'], right),
      steps: [`Cut each ${SING[d]} into ${k} pieces: ${f(a, d)} = ${f(A, D)}.`, `Now both are ${PLUR[D]}: ${f(A, D)} is ${words(A, c)} ${f(c, D)}.`,
        A === c ? `${f(A, D)} and ${f(c, D)} match, so they have the same amount.` : `So ${right} has more.`] }
  } },
  { style: 'work backwards: the top number that makes it true', make: r => {
    const [d, D] = pick(r, FAMILY), k = D / d, a = int(r, 1, d - 1), A = a * k
    if (r() < 0.5 || A < 2) {
      const q = `${f(a, d)} < ?/${D}`
      return { text: `What is the smallest top number that makes this true? ${q}`, picture: eq(q), answer: A + 1,
        steps: [`Cut each ${SING[d]} into ${k} pieces: ${f(a, d)} = ${f(A, D)}.`, `The pieces match now, so the top must be more than ${A}.`, `The smallest top number is ${A + 1}.`] }
    }
    const q = `?/${D} < ${f(a, d)}`
    return { text: `What is the biggest top number that makes this true? ${q}`, picture: eq(q), answer: A - 1,
      steps: [`Cut each ${SING[d]} into ${k} pieces: ${f(a, d)} = ${f(A, D)}.`, `The pieces match now, so the top must be less than ${A}.`, `The biggest top number is ${A - 1}.`] }
  } },
]

// ── t4 · Break a fraction apart ─────────────────────────────────────────────────────────────────────────────
const DEN4 = [4, 5, 6, 8, 10, 12] as const
const breakSteps = (n: number, d: number, used: number, filled: string, m: number) => [
  `${f(n, d)} is ${pieces(n, d)}. ${used === 1 ? '1 of them is' : `${used} of them are`} used already.`,
  `${pl(n, 'piece')} take away ${pl(used, 'piece')} leaves ${pl(m, 'piece')}. They are still ${PLUR[d]}.`,
  `So ${filled}. The missing fraction is ${f(m, d)}.`,
]

const T4: Level[] = [
  { style: 'bars, missing part', make: r => {
    const { d, n, a } = until(() => { const d = pick(r, DEN4), n = int(r, 3, d - 1); return { d, n, a: int(r, 1, n - 1) } }, x => x.n !== 2 * x.a)
    return { text: `Break ${f(n, d)} apart. ${f(n, d)} = ${f(a, d)} + ? What fraction is missing?`,
      picture: bars({ parts: d, shaded: n, label: f(n, d) }, { parts: d, shaded: a, label: f(a, d) }), answer: { frac: [n - a, d] },
      steps: breakSteps(n, d, a, `${f(n, d)} = ${f(a, d)} + ${f(n - a, d)}`, n - a) }
  } },
  { style: 'bare numbers, missing part in any place', make: r => {
    if (r() < 0.5) {
      const { d, n, a } = until(() => { const d = pick(r, DEN4), n = int(r, 3, d - 1); return { d, n, a: int(r, 1, n - 1) } }, x => x.n !== 2 * x.a)
      const q = `${f(n, d)} = ? + ${f(a, d)}`
      return { text: `What fraction is missing? ${q}`, picture: eq(q), answer: { frac: [n - a, d] },
        steps: breakSteps(n, d, a, `${f(n, d)} = ${f(n - a, d)} + ${f(a, d)}`, n - a) }
    }
    const { d, n, a, b } = until(() => { const d = pick(r, [6, 8, 10, 12] as const), n = int(r, 4, d - 1), a = int(r, 1, n - 2); return { d, n, a, b: int(r, 1, n - a - 1) } },
      x => { const m = x.n - x.a - x.b; return m !== x.a && m !== x.b })
    const m = n - a - b, q = `${f(n, d)} = ${f(a, d)} + ${f(b, d)} + ?`
    return { text: `What fraction is missing? ${q}`, picture: eq(q), answer: { frac: [m, d] },
      steps: breakSteps(n, d, a + b, `${f(n, d)} = ${f(a, d)} + ${f(b, d)} + ${f(m, d)}`, m) }
  } },
  { style: 'pick the true one (split the bottom trap)', make: r => {
    const d = pick(r, [4, 6, 8, 10, 12] as const), n = int(r, 2, d - 1), a = int(r, 1, n - 1), b = n - a
    const right = `${f(n, d)} = ${f(a, d)} + ${f(b, d)}`
    return { text: 'Which one is true?', picture: bars({ parts: d, shaded: n }),
      answer: choose(r, right, [`${f(n, d)} = ${f(a, d / 2)} + ${f(b, d / 2)}`, `${f(n, d)} = ${f(a, d)} + ${f(b + 1, d)}`]),
      steps: ['When you split the pieces into groups, the bottom number never splits.', `${pieces(a, d)} and ${pieces(b, d)} make ${pieces(n, d)}.`, `So ${right}.`] }
  } },
  { style: 'story, the rest goes in a bowl', make: r => {
    const { d, n, a } = until(() => { const d = pick(r, DEN4), n = int(r, 3, d - 1); return { d, n, a: int(r, 1, n - 1) } }, x => x.n !== 2 * x.a)
    const name = pick(r, GIRLS), m = n - a
    return { text: `${name} has ${f(n, d)} of a pound of grapes. She puts ${f(a, d)} of a pound in her lunch bag and the rest in a bowl. How much goes in the bowl?`,
      picture: bars({ parts: d, shaded: n, label: f(n, d) }), answer: { frac: [m, d] },
      steps: [`${f(n, d)} is ${pieces(n, d)}. The lunch bag gets ${a} of them.`, `${pl(n, 'piece')} take away ${pl(a, 'piece')} leaves ${pl(m, 'piece')}.`, `So ${f(n, d)} = ${f(a, d)} + ${f(m, d)}. The bowl gets ${f(m, d)} of a pound.`] }
  } },
  { style: 'two-step story (three plates)', make: r => {
    const d = pick(r, [6, 8, 10, 12] as const), n = int(r, 3, d - 1), a = int(r, 1, n - 2), b = int(r, 1, n - a - 1), m = n - a - b
    return { text: `A pan of cornbread is cut into ${d} equal pieces, and ${f(n, d)} of the pan is left. You put ${f(a, d)} of the pan on one plate and ${f(b, d)} on a second plate. The rest goes on a third plate. How much of the pan is on the third plate?`,
      picture: bars({ parts: d, shaded: n }), answer: { frac: [m, d] },
      steps: [`The first two plates hold ${a} + ${b} = ${pl(a + b, 'piece')}.`, `${n} − ${a + b} = ${m}, and they are still ${PLUR[d]}.`, `So ${f(n, d)} = ${f(a, d)} + ${f(b, d)} + ${f(m, d)}. The third plate has ${f(m, d)} of the pan.`] }
  } },
]

// ── t5 · Add fractions with the same bottom number ──────────────────────────────────────────────────────────
const DEN5 = [3, 4, 5, 6, 8, 10, 12] as const
const addTwo = (r: Rng, dens: readonly number[]) => {
  const d = pick(r, dens)
  if (d === 100) { const a = int(r, 11, 60); return { d, a, b: int(r, 11, 98 - a) } }
  const a = int(r, 1, d - 2)
  return { d, a, b: int(r, 1, d - 1 - a) }
}
const addSteps = (a: number, b: number, d: number) => [
  `Both are ${PLUR[d]}, so the pieces are the same size.`,
  `Add the pieces: ${a} + ${b} = ${a + b}. Keep the bottom number ${d}.`,
  `So ${f(a, d)} + ${f(b, d)} = ${f(a + b, d)}.`,
]

const T5: Level[] = [
  { style: 'bars, add the pieces', make: r => {
    const { d, a, b } = addTwo(r, DEN5)
    return { text: `What is ${f(a, d)} + ${f(b, d)}?`, picture: bars({ parts: d, shaded: a, label: f(a, d) }, { parts: d, shaded: b, label: f(b, d) }),
      answer: { frac: [a + b, d] }, steps: addSteps(a, b, d) }
  } },
  { style: 'bare numbers, hundredths too', make: r => {
    const { d, a, b } = addTwo(r, [5, 8, 10, 12, 100])
    return { text: `Add. ${f(a, d)} + ${f(b, d)} = ?`, picture: eq(`${f(a, d)} + ${f(b, d)} = ?`), answer: { frac: [a + b, d] }, steps: addSteps(a, b, d) }
  } },
  { style: 'spot the mistake (added the bottoms)', make: r => {
    const { d, a, b } = addTwo(r, DEN5), name = pick(r, KIDS), wrong = `${f(a, d)} + ${f(b, d)} = ${f(a + b, 2 * d)}`
    return { text: `${name} says ${wrong}. That is not right. What is the right answer?`, picture: eq(wrong), answer: { frac: [a + b, d] },
      steps: [`${name} added the bottom numbers, but the pieces are still ${PLUR[d]}.`, `Add only the pieces: ${a} + ${b} = ${a + b}. Keep the bottom number ${d}.`, `So the right answer is ${f(a + b, d)}.`] }
  } },
  { style: 'missing number, work backwards', make: r => {
    const { d, a, b } = until(() => addTwo(r, DEN5), x => x.a !== x.b), c = a + b, q = `${f(a, d)} + ? = ${f(c, d)}`
    return { text: `What fraction is missing? ${q}`, picture: eq(q), answer: { frac: [b, d] },
      steps: [`Both are ${PLUR[d]}, so count pieces: ${a} and how many more make ${c}?`, `${c} − ${a} = ${b}. Keep the bottom number ${d}.`, `So ${f(a, d)} + ${f(b, d)} = ${f(c, d)}. The missing fraction is ${f(b, d)}.`] }
  } },
  { style: 'two-step story (three amounts)', make: r => {
    const d = pick(r, [5, 6, 8, 10, 12] as const), a = int(r, 1, d - 3), b = int(r, 1, d - 2 - a), c = int(r, 1, d - 1 - a - b), s = a + b + c
    const name = pick(r, KIDS)
    return { text: `${name} paints ${f(a, d)} of a fence in the morning, ${f(b, d)} after lunch, and ${f(c, d)} in the evening. How much of the fence does ${name} paint in all?`,
      picture: bars({ parts: d, shaded: 0 }), answer: { frac: [s, d] },
      steps: [`All three are ${PLUR[d]} of the same fence, so the pieces are the same size.`, `Add the pieces: ${a} + ${b} + ${c} = ${s}. Keep the bottom number ${d}.`, `So ${name} paints ${f(s, d)} of the fence.`] }
  } },
]

// ── t6 · Take away fractions with the same bottom number ────────────────────────────────────────────────────
const takeTwo = (r: Rng, dens: readonly number[]) => {
  const d = pick(r, dens)
  if (d === 100) { const a = int(r, 40, 99); return { d, a, b: int(r, 11, a - 11) } }
  const a = int(r, 2, d - 1)
  return { d, a, b: int(r, 1, a - 1) }
}
const takeSteps = (a: number, b: number, d: number, start = f(a, d)) => [
  `Both are ${PLUR[d]}, so the pieces are the same size.`,
  `Take away the pieces: ${a} − ${b} = ${a - b}. Keep the bottom number ${d}.`,
  `So ${start} − ${f(b, d)} = ${f(a - b, d)}.`,
]

const T6: Level[] = [
  { style: 'bar, take away pieces', make: r => {
    const { d, a, b } = takeTwo(r, DEN5)
    return { text: `What is ${f(a, d)} − ${f(b, d)}?`, picture: bars({ parts: d, shaded: a, label: f(a, d) }), answer: { frac: [a - b, d] }, steps: takeSteps(a, b, d) }
  } },
  { style: 'bare numbers, hundredths too', make: r => {
    const { d, a, b } = takeTwo(r, [5, 8, 10, 12, 100])
    return { text: `Subtract. ${f(a, d)} − ${f(b, d)} = ?`, picture: eq(`${f(a, d)} − ${f(b, d)} = ?`), answer: { frac: [a - b, d] }, steps: takeSteps(a, b, d) }
  } },
  { style: 'take away from 1 whole', make: r => {
    const d = pick(r, DEN5), b = int(r, 1, d - 1)
    return { text: `What is 1 − ${f(b, d)}?`, picture: bars({ parts: d, shaded: d, label: '1' }), answer: { frac: [d - b, d] },
      steps: [`1 whole cut into ${PLUR[d]} is ${f(d, d)}.`, `Take away the pieces: ${d} − ${b} = ${d - b}. Keep the bottom number ${d}.`, `So 1 − ${f(b, d)} = ${f(d - b, d)}.`] }
  } },
  { style: 'missing number, work backwards', make: r => {
    const { d, a, b } = until(() => takeTwo(r, DEN5), x => x.a - x.b !== x.b), c = a - b
    if (r() < 0.5) {
      const q = `${f(a, d)} − ? = ${f(c, d)}`
      return { text: `What fraction is missing? ${q}`, picture: eq(q), answer: { frac: [b, d] },
        steps: [`Both are ${PLUR[d]}. Start with ${pl(a, 'piece')} and end with ${c}.`, `${a} − ${c} = ${b}, so ${pl(b, 'piece')} were taken away.`, `So ${f(a, d)} − ${f(b, d)} = ${f(c, d)}. The missing fraction is ${f(b, d)}.`] }
    }
    const q = `? − ${f(b, d)} = ${f(c, d)}`
    return { text: `What fraction is missing? ${q}`, picture: eq(q), answer: { frac: [a, d] },
      steps: [`Go backwards: put the ${pl(b, 'piece')} back with the ${c} left.`, `${c} + ${b} = ${a}. Keep the bottom number ${d}.`, `So ${f(a, d)} − ${f(b, d)} = ${f(c, d)}. The missing fraction is ${f(a, d)}.`] }
  } },
  { style: 'two-step story (poured out twice)', make: r => {
    const d = pick(r, [5, 6, 8, 10, 12] as const), a = int(r, 3, d - 1), b = int(r, 1, a - 2), c = int(r, 1, a - b - 1), left = a - b - c
    const [p, q] = twoKids(r)
    return { text: `A jug holds ${f(a, d)} of a gallon of juice. ${p} pours out ${f(b, d)} of a gallon. Then ${q} pours out ${f(c, d)} of a gallon. How much juice is left in the jug?`,
      picture: bars({ parts: d, shaded: a, label: f(a, d) }), answer: { frac: [left, d] },
      steps: [`All the amounts are ${PLUR[d]} of a gallon, so the pieces are the same size.`, `Take away both: ${a} − ${b} − ${c} = ${left}. Keep the bottom number ${d}.`, `So ${f(left, d)} of a gallon is left.`] }
  } },
]

// ── t7 · Mixed numbers and fractions ────────────────────────────────────────────────────────────────────────
const mixed7 = (r: Rng, wMax: number, dens: readonly number[] = [2, 3, 4, 5, 6, 8, 10]) => {
  const d = pick(r, dens), w = int(r, 1, wMax), p = int(r, 1, d - 1)
  return { d, w, p, N: w * d + p }
}
const wholesSteps = (w: number, p: number, d: number) => [
  w === 1 ? `1 whole is ${f(d, d)}, which is ${d} ${PLUR[d]}.` : `Each whole is ${d} ${PLUR[d]}. ${w} wholes is ${w} × ${d} = ${w * d} ${PLUR[d]}.`,
  `Add the extra ${pieces(p, d)}: ${w * d} + ${p} = ${w * d + p}.`,
]
const fullBars = (w: number, p: number, d: number) => bars(...Array.from({ length: w }, () => ({ parts: d, shaded: d })), { parts: d, shaded: p })

const T7: Level[] = [
  { style: 'bars, count the pieces in the wholes', make: r => {
    const { d, w, p, N } = mixed7(r, 3)
    return { text: `Write ${w} ${f(p, d)} as ${PLUR[d]}. ${w} ${f(p, d)} = ?/${d}. What is the missing top number?`, picture: fullBars(w, p, d), answer: N,
      steps: [...wholesSteps(w, p, d), `So ${w} ${f(p, d)} = ${f(N, d)}. The missing number is ${N}.`] }
  } },
  { style: 'bare numbers, mixed number to a fraction', make: r => {
    const { d, w, p, N } = mixed7(r, 5), q = `${w} ${f(p, d)} = ?/${d}`
    return { text: `What number goes in the box? ${q}`, picture: eq(q), answer: N,
      steps: [...wholesSteps(w, p, d), `So ${w} ${f(p, d)} = ${f(N, d)}. The missing number is ${N}.`] }
  } },
  { style: 'pick the true one (push the numbers together trap)', make: r => {
    const { d, w, p, N } = until(() => mixed7(r, 3), x => x.w + x.p !== x.w * x.d)
    const right = `${w} ${f(p, d)} = ${f(N, d)}`
    return { text: 'Which one is true?', picture: fullBars(w, p, d), answer: choose(r, right, [`${w} ${f(p, d)} = ${f(w + p, d)}`, `${w} ${f(p, d)} = ${f(w * d, d)}`]),
      steps: [`Each whole is ${d} ${PLUR[d]}, so ${w === 1 ? '1 whole is' : `${w} wholes are`} ${w * d} ${PLUR[d]}.`, `Add the extra ${pieces(p, d)}: ${w * d} + ${p} = ${N}.`, `So ${right}.`] }
  } },
  { style: 'fraction to wholes and a fraction', make: r => {
    const { d, w, p, N } = mixed7(r, 4)
    return { text: `Write ${f(N, d)} as wholes and a fraction.`, picture: eq(`${f(N, d)} = ?`), answer: { frac: [p, d], whole: w, exact: true },
      steps: [`Each whole is ${d} ${PLUR[d]}.`, `${w} × ${d} = ${w * d}, so ${N} ${PLUR[d]} is ${w === 1 ? '1 whole' : `${w} wholes`} with ${pieces(p, d)} left over.`, `So ${f(N, d)} = ${w} ${f(p, d)}.`] }
  } },
  { style: 'two-step story (slices sold)', make: r => {
    const { d, w, p, N, s } = until(() => { const m = mixed7(r, 3, [3, 4, 6, 8]); return { ...m, s: int(r, 2, m.N - 1) } },
      x => ![x.w, x.p, x.d].includes(x.N - x.s))
    const left = N - s
    return { text: `A baker has ${pl(w, 'whole pie')} and ${f(p, d)} of another pie. Each pie is cut into ${d} slices. She sells ${pl(s, 'slice')}. How many slices are left?`,
      picture: fullBars(w, p, d), answer: left,
      steps: [`${w === 1 ? '1 pie is' : `${w} pies are`} ${w} × ${d} = ${w * d} slices, and ${p} more makes ${N} slices.`, `She sells ${s}: ${N} − ${s} = ${left}.`, `So ${pl(left, 'slice')} ${left === 1 ? 'is' : 'are'} left.`] }
  } },
]

// ── t8 · Add mixed numbers ──────────────────────────────────────────────────────────────────────────────────
const DEN8 = [3, 4, 5, 6, 8, 10, 12] as const
/** Two mixed numbers with one bottom; `trade` asks for pieces that add past 1 whole. */
const mixPair = (r: Rng, trade: boolean) => until(() => {
  const d = pick(r, DEN8), w1 = int(r, 1, 4), w2 = int(r, 1, 4)
  const p1 = trade ? int(r, 2, d - 1) : int(r, 1, d - 2)
  const p2 = trade ? int(r, d - p1 + 1, d - 1) : int(r, 1, d - 1 - p1)
  return { d, w1, w2, p1, p2, W: w1 + w2, P: p1 + p2 }
}, x => x.p2 >= 1 && x.p2 <= x.d - 1 && (trade ? x.P > x.d : x.P < x.d))
const mx = (w: number, p: number, d: number) => `${w} ${f(p, d)}`

const T8: Level[] = [
  { style: 'wholes and pieces written out', make: r => {
    const { d, w1, w2, p1, p2, W, P } = mixPair(r, false)
    return { text: `What is ${mx(w1, p1, d)} + ${mx(w2, p2, d)}? Add the wholes, then add the pieces.`,
      picture: eq(`${mx(w1, p1, d)} + ${mx(w2, p2, d)} = ?`, [`wholes: ${w1} + ${w2} = ?`, `pieces: ${f(p1, d)} + ${f(p2, d)} = ?`]), answer: { frac: [P, d], whole: W },
      steps: [`Add the wholes: ${w1} + ${w2} = ${W}.`, `Add the pieces: ${f(p1, d)} + ${f(p2, d)} = ${f(P, d)}.`, `So ${mx(w1, p1, d)} + ${mx(w2, p2, d)} = ${mx(W, P, d)}.`] }
  } },
  { style: 'bare mixed numbers', make: r => {
    const { d, w1, w2, p1, p2, W, P } = mixPair(r, false)
    return { text: `What is ${mx(w1, p1, d)} + ${mx(w2, p2, d)}?`, picture: eq(`${mx(w1, p1, d)} + ${mx(w2, p2, d)} = ?`), answer: { frac: [P, d], whole: W },
      steps: [`Add the wholes: ${w1} + ${w2} = ${W}.`, `Add the pieces: ${f(p1, d)} + ${f(p2, d)} = ${f(P, d)}.`, `So ${mx(w1, p1, d)} + ${mx(w2, p2, d)} = ${mx(W, P, d)}.`] }
  } },
  { style: 'spot the mistake (added the bottoms)', make: r => {
    const { d, w1, w2, p1, p2, W, P } = mixPair(r, false), name = pick(r, KIDS)
    const wrong = `${mx(w1, p1, d)} + ${mx(w2, p2, d)} = ${mx(W, P, 2 * d)}`
    return { text: `${name} says ${wrong}. That is not right. What is the right answer?`, picture: eq(wrong), answer: { frac: [P, d], whole: W },
      steps: [`The wholes are right: ${w1} + ${w2} = ${W}. But ${name} added the bottom numbers of the pieces.`, `The pieces are still ${PLUR[d]}: ${f(p1, d)} + ${f(p2, d)} = ${f(P, d)}.`, `So the right answer is ${mx(W, P, d)}.`] }
  } },
  { style: 'missing mixed number, work backwards', make: r => {
    const { d, w1, w2, p1, p2, W, P } = until(() => mixPair(r, false), x => x.w1 !== x.w2 || x.p1 !== x.p2)
    const q = `${mx(w1, p1, d)} + ? = ${mx(W, P, d)}`
    return { text: `What goes in the box? ${q}`, picture: eq(q), answer: { frac: [p2, d], whole: w2 },
      steps: [`Wholes: ${w1} and how many more make ${W}? ${W} − ${w1} = ${w2}.`, `Pieces: ${f(p1, d)} and how many more make ${f(P, d)}? ${P} − ${p1} = ${p2}, so ${f(p2, d)}.`, `So the missing number is ${mx(w2, p2, d)}.`] }
  } },
  { style: 'two-step story (trade pieces for a whole)', make: r => {
    const { d, w1, w2, p1, p2, W, P } = mixPair(r, true), name = pick(r, KIDS), rest = P - d
    return { text: `${name} walks ${mx(w1, p1, d)} miles to the park. Then ${name} walks ${mx(w2, p2, d)} miles home a longer way. How far does ${name} walk in all?`,
      picture: eq(`${mx(w1, p1, d)} + ${mx(w2, p2, d)}`), answer: { frac: [rest, d], whole: W + 1 },
      steps: [`Add the wholes: ${w1} + ${w2} = ${W}. Add the pieces: ${f(p1, d)} + ${f(p2, d)} = ${f(P, d)}.`, `${f(P, d)} is ${f(d, d)}, which is 1 whole, and ${f(rest, d)} more.`, `Trade ${f(d, d)} for 1 whole: ${W} + 1 = ${W + 1}, with ${f(rest, d)} left. So ${name} walks ${mx(W + 1, rest, d)} miles.`] }
  } },
]

// ── t9 · A whole number times a fraction ────────────────────────────────────────────────────────────────────
const T9: Level[] = [
  { style: 'copies of a unit piece, pictured', make: r => {
    const d = pick(r, [3, 4, 5, 6, 8] as const), n = int(r, 2, Math.min(5, d - 1))
    return { text: `What is ${n} × ${f(1, d)}?`, picture: copies(n, d), answer: { frac: [n, d] },
      steps: [`${n} × ${f(1, d)} means ${n} copies of ${f(1, d)}.`, `Count the pieces: ${n} pieces, and each one is a ${SING[d]}.`, `So ${n} × ${f(1, d)} = ${f(n, d)}.`] }
  } },
  { style: 'bare numbers, unit fraction', make: r => {
    const d = pick(r, [5, 6, 8, 10, 12] as const), n = int(r, 2, Math.min(9, d - 1))
    return { text: `Multiply. ${n} × ${f(1, d)} = ?`, picture: eq(`${n} × ${f(1, d)} = ?`), answer: { frac: [n, d] },
      steps: [`${n} × ${f(1, d)} means ${n} copies of ${f(1, d)}.`, `Count the pieces: ${n} pieces. The size stays ${PLUR[d]}.`, `So ${n} × ${f(1, d)} = ${f(n, d)}.`] }
  } },
  { style: 'pick the true one (multiply the bottom trap)', make: r => {
    const d = pick(r, [3, 4, 5, 6, 8] as const), n = int(r, 2, Math.min(5, d - 1)), right = `${n} × ${f(1, d)} = ${f(n, d)}`
    return { text: 'Which one is true?', picture: copies(n, d),
      answer: choose(r, right, [`${n} × ${f(1, d)} = ${f(n, n * d)}`, `${n} × ${f(1, d)} = ${f(1, n * d)}`]),
      steps: [`${n} × ${f(1, d)} means ${n} copies of ${f(1, d)}.`, 'Multiplying gives more pieces, not smaller ones, so the bottom number stays the same.', `So ${right}.`] }
  } },
  { style: 'story, copies of a bigger piece', make: r => {
    const d = pick(r, [3, 4, 5, 6, 8] as const), a = int(r, 2, d - 1), n = int(r, 2, 4), N = n * a
    return { text: `A recipe uses ${f(a, d)} of a cup of milk. You make the recipe ${n} times. How much milk do you use?`, picture: copies(n, d, a), answer: { frac: [N, d] },
      steps: [`${n} times ${f(a, d)} means ${n} copies of ${f(a, d)}.`, `Each copy is ${a} ${PLUR[d]}. Count the pieces: ${Array(n).fill(a).join(' + ')} = ${N} ${PLUR[d]}.`, `So ${n} × ${f(a, d)} = ${f(N, d)} of a cup of milk.`] }
  } },
  { style: 'two-step story (use copies, then find what is left)', make: r => {
    const { d, a, n, c } = until(() => { const d = pick(r, [6, 8, 10, 12] as const), n = int(r, 2, 3), a = int(r, 1, 3); return { d, a, n, c: int(r, n * a + 1, d - 1) } },
      x => x.n * x.a <= x.d - 2)
    const used = n * a, left = c - used
    return { text: `You have ${f(c, d)} of a cup of milk. You make a recipe ${n} times, and it uses ${f(a, d)} of a cup each time. How much milk is left?`,
      picture: eq(`${n} × ${f(a, d)} = ?`, [`${f(c, d)} − ? = ?`]), answer: { frac: [left, d] },
      steps: [`${n} × ${f(a, d)} is ${n} copies of ${pieces(a, d)}, so you use ${used} ${PLUR[d]} of a cup.`, `Take them away: ${c} − ${used} = ${left}. Keep the bottom number ${d}.`, `So ${f(left, d)} of a cup of milk is left.`] }
  } },
]

export const G4M4_LADDERS: Record<string, Level[]> = {
  'g4m4-t1': T1, 'g4m4-t2': T2, 'g4m4-t3': T3, 'g4m4-t4': T4, 'g4m4-t5': T5, 'g4m4-t6': T6, 'g4m4-t7': T7, 'g4m4-t8': T8, 'g4m4-t9': T9,
}
