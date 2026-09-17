/**
 * Grade 6 · Module 2 — Operations with fractions and mixed numbers. Practice ladders, easiest style first (see
 * ../adaptive.ts and the reference ladders in ./g5m1.ts, ./g4m4.ts). Fraction answers are written like the lessons write
 * them: `{ frac }` in lowest terms (with `whole` for a mixed number) and no `exact`, so 10/12 for 5/6, or 15/4 for 3 3/4,
 * is also right. A level whose answer is a fraction never lands on a whole number, and one whose answer is a whole number
 * always does — the numbers are picked for it.
 */
import type { Answer, Picture } from '../script'
import { int, pick, shuffle, type Level, type Rng } from '../adaptive'

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
const lcm = (a: number, b: number) => (a * b) / gcd(a, b)
const f = (n: number, d: number) => `${n}/${d}`
const until = <T>(gen: () => T, ok: (x: T) => boolean): T => { let x = gen(); while (!ok(x)) x = gen(); return x }
const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const choose = (r: Rng, right: string, wrong: string[]) => {
  const choices = shuffle(r, [right, ...wrong])
  return { choices, correct: choices.indexOf(right) }
}

const SING: Record<number, string> = { 2: 'half', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 8: 'eighth', 9: 'ninth', 10: 'tenth', 12: 'twelfth', 16: 'sixteenth' }
const PLUR: Record<number, string> = { 2: 'halves', 3: 'thirds', 4: 'fourths', 5: 'fifths', 6: 'sixths', 8: 'eighths', 9: 'ninths', 10: 'tenths', 12: 'twelfths', 16: 'sixteenths' }

/** n/d written the simple way: "3", "3/4", "2 1/2". */
const simple = (n: number, d: number) => {
  const g = gcd(n, d), N = n / g, D = d / g, w = Math.floor(N / D), rest = N - w * D
  return rest === 0 ? `${w}` : w ? `${w} ${rest}/${D}` : `${rest}/${D}`
}
/** A fraction answer in lowest terms. Callers make sure n/d is never a whole number. */
const fracAnswer = (n: number, d: number): Answer => {
  const g = gcd(n, d), N = n / g, D = d / g, w = Math.floor(N / D)
  return w ? { frac: [N - w * D, D], whole: w } : { frac: [N, D] }
}
/** "10/12, the same as 5/6" — or just "5/6" when there is nothing to simplify. */
const sameAs = (n: number, d: number) => (simple(n, d) === f(n, d) ? f(n, d) : `${f(n, d)}, the same as ${simple(n, d)}`)
/** A proper fraction in lowest terms with its bottom from `dens`. */
const proper = (r: Rng, dens: readonly number[], nLo = 1) =>
  until(() => { const d = pick(r, dens); return { n: int(r, Math.min(nLo, d - 1), d - 1), d } }, x => gcd(x.n, x.d) === 1)
/** A mixed number w p/q with p/q in lowest terms; N/q is the same amount as one fraction. */
const mixedNum = (r: Rng, wMax: number, dens: readonly number[]) => {
  const { n: p, d: q } = proper(r, dens), w = int(r, 1, wMax)
  return { w, p, q, N: w * q + p, s: `${w} ${p}/${q}` }
}

const NAMES = ['Ava', 'Mia', 'Nora', 'Zoe', 'Sam', 'Leo', 'Ben', 'Raj', 'Maya', 'Eli'] as const

// ── t1 · How many unit fractions fit ────────────────────────────────────────────────────────────────────────
const PAIRS1 = [[2, 4], [2, 6], [2, 8], [2, 10], [2, 12], [3, 6], [3, 9], [3, 12], [4, 8], [4, 12], [5, 10], [6, 12]] as const
const fit1 = (r: Rng) => {
  const [b, d] = pick(r, PAIRS1), k = d / b, a = until(() => int(r, 1, b - 1), a => gcd(a, b) === 1)
  return { a, b, d, k, N: a * k }
}

const T1: Level[] = [
  { style: 'bar already cut into the small pieces, count them', make: r => {
    const { a, b, d, k, N } = fit1(r)
    return { text: `Each ${SING[b]} in the bar is cut into ${k} equal pieces. How many 1/${d} pieces fit in ${f(a, b)}? Find ${f(a, b)} ÷ 1/${d}.`,
      picture: { kind: 'bars', bars: [{ parts: b, shaded: a, split: k, label: f(a, b) }] }, answer: N,
      steps: [`Each ${SING[b]} is cut into ${k} pieces, so every piece is 1/${d}.`, `${f(a, b)} is the same as ${f(N, d)}. Count the 1/${d} pieces in the shaded part.`, `So ${f(a, b)} ÷ 1/${d} = ${N}.`] }
  } },
  { style: 'bare numbers, make the pieces match', make: r => {
    const { a, b, d, k, N } = fit1(r)
    return { text: `Find ${f(a, b)} ÷ 1/${d}.`, picture: eq(`${f(a, b)} ÷ 1/${d} = ?`), answer: N,
      steps: [`Cut each ${SING[b]} into ${k} equal pieces. Every piece is now 1/${d}.`, `So ${f(a, b)} is the same as ${f(N, d)}. Count the 1/${d} pieces.`, `So ${f(a, b)} ÷ 1/${d} = ${N}.`] }
  } },
  { style: 'pick the true one (tiny answer trap)', make: r => {
    const { a, b, d, N } = fit1(r), q = `${f(a, b)} ÷ 1/${d}`, right = `${q} = ${N}`
    return { text: 'Which one is true?', picture: { kind: 'bars', bars: [{ parts: b, shaded: a, label: f(a, b) }, { parts: d, shaded: 1, label: `1/${d}` }] },
      answer: choose(r, right, [`${q} = ${f(a, b * d)}`, `${q} = ${f(N, d)}`, `${q} = ${a}`]),
      steps: [`Dividing by 1/${d} asks how many 1/${d} pieces fit, so the answer is more than 1.`, `${f(a, b)} is the same as ${f(N, d)}, and that is ${N} pieces of 1/${d}.`, `So ${right}.`] }
  } },
  { style: 'work backwards: the size of the piece', make: r => {
    const { a, b, d, k, N } = fit1(r), q = `${f(a, b)} ÷ 1/? = ${N}`
    return { text: `What number goes in the box? ${q}`, picture: eq(q), answer: d,
      steps: [`${N} equal pieces fit in ${f(a, b)}. So write ${f(a, b)} with ${N} on top: ${a} × ${k} = ${N}.`, `Multiply the bottom by ${k} too: ${b} × ${k} = ${d}. So ${f(a, b)} = ${f(N, d)}, and each piece is 1/${d}.`, `The missing number is ${d}.`] }
  } },
  { style: 'two-step story (how many fit, then some are used)', make: r => {
    const { a, b, d, N } = until(() => fit1(r), x => x.N >= 3), g = int(r, 1, N - 1), left = N - g
    const [start, each, use, one, many, end] = pick(r, [
      [`You have ${f(a, b)} of a pan of lasagna.`, `Each serving is 1/${d} of the pan.`, `You give ${g === 1 ? '1 serving' : `${g} servings`} to your neighbors. How many servings are left for you?`, 'serving', 'servings', 'left for you'],
      [`You have ${f(a, b)} yard of ribbon.`, `Each bow uses 1/${d} yard.`, `You make ${g === 1 ? '1 bow' : `${g} bows`} for your team. How many more bows can you make?`, 'more bow', 'more bows', 'you can make'],
      [`You have ${f(a, b)} gallon of juice.`, `Each glass holds 1/${d} gallon.`, `You pour ${g === 1 ? '1 glass' : `${g} glasses`} for your friends. How many more glasses can you pour?`, 'more glass', 'more glasses', 'you can pour'],
    ] as const)
    return { text: `${start} ${each} ${use}`, picture: { kind: 'bars', bars: [{ parts: b, shaded: a, label: f(a, b) }] }, answer: left,
      steps: [`First find ${f(a, b)} ÷ 1/${d}. ${f(a, b)} is the same as ${f(N, d)}, so ${N} fit.`, `${g} ${g === 1 ? 'is' : 'are'} used: ${N} − ${g} = ${left}.`, `So there ${left === 1 ? 'is' : 'are'} ${left} ${left === 1 ? one : many} ${end}.`] }
  } },
]

// ── t2 · Flip and multiply ──────────────────────────────────────────────────────────────────────────────────
/** Two different proper fractions in lowest terms, the first the smaller one. */
const twoFracs = (r: Rng, dens: readonly number[]) => until(() => ({ x: proper(r, dens), y: proper(r, dens) }), ({ x, y }) => x.n * y.d < y.n * x.d)

const T2: Level[] = [
  { style: 'whole number ÷ fraction, the three moves written out', make: r => {
    const { p, q, m } = until(() => { const { n: p, d: q } = proper(r, [3, 4, 5, 6, 8], 2); return { p, q, m: int(r, 1, 3) } }, x => x.p * x.m <= 12)
    const W = p * m
    return { text: `Find ${W} ÷ ${f(p, q)}. Keep ${W}, change ÷ to ×, and flip ${f(p, q)}.`, picture: eq(`${W} ÷ ${f(p, q)}`, [`= ${W} × ?/?`, '= ?']), answer: m * q,
      steps: [`Keep ${W}. Change ÷ to ×. Flip ${f(p, q)} to ${f(q, p)}.`, `${W} × ${f(q, p)} = ${f(W * q, p)}.`, `${f(W * q, p)} is ${m * q} wholes. So ${W} ÷ ${f(p, q)} = ${m * q}.`] }
  } },
  { style: 'bare fraction ÷ fraction', make: r => {
    // Re-rolled when the answer is the divisor itself (1/4 ÷ 1/2 = 1/2): the picture would print it.
    const { x, y } = until(() => twoFracs(r, [2, 3, 4, 5, 6, 8, 9, 10]), o => o.x.n * o.y.d * o.y.d !== o.x.d * o.y.n * o.y.n), n = x.n * y.d, d = x.d * y.n
    return { text: `Find ${f(x.n, x.d)} ÷ ${f(y.n, y.d)}.`, picture: eq(`${f(x.n, x.d)} ÷ ${f(y.n, y.d)} = ?`), answer: fracAnswer(n, d),
      steps: [`Keep ${f(x.n, x.d)}. Change ÷ to ×. Flip ${f(y.n, y.d)} to ${f(y.d, y.n)}.`, `Multiply the tops and the bottoms: ${f(x.n, x.d)} × ${f(y.d, y.n)} = ${f(n, d)}.`, `So ${f(x.n, x.d)} ÷ ${f(y.n, y.d)} = ${sameAs(n, d)}.`] }
  } },
  { style: 'pick the true one (which fraction gets flipped)', make: r => {
    const { x, y } = twoFracs(r, [2, 3, 4, 5, 6, 8])
    const [a, b] = r() < 0.5 ? [x, y] : [y, x]
    const right = `${f(a.n, a.d)} × ${f(b.d, b.n)}`
    return { text: `Which one is the same as ${f(a.n, a.d)} ÷ ${f(b.n, b.d)}?`, picture: eq(`${f(a.n, a.d)} ÷ ${f(b.n, b.d)}`),
      answer: choose(r, right, [`${f(a.d, a.n)} × ${f(b.n, b.d)}`, `${f(a.d, a.n)} × ${f(b.d, b.n)}`, `${f(a.n, a.d)} × ${f(b.n, b.d)}`]),
      steps: [`Only the fraction you divide by gets flipped. ${f(a.n, a.d)} stays the same.`, `Change ÷ to × and flip ${f(b.n, b.d)} to ${f(b.d, b.n)}.`, `So the answer is ${right}.`] }
  } },
  { style: 'work backwards: what was divided', make: r => {
    const { n: c, d } = proper(r, [3, 4, 5, 6], 2), m = int(r, 2, 4), n = d * m, X = c * m, q = `? ÷ ${f(c, d)} = ${n}`
    return { text: `What number goes in the box? ${q}`, picture: eq(q), answer: X,
      steps: [`Dividing by ${f(c, d)} counts how many ${f(c, d)}s fit, and ${n} of them fit.`, `So the number is ${n} × ${f(c, d)} = ${f(n * c, d)}.`, `${f(n * c, d)} is ${X} wholes. The missing number is ${X}.`] }
  } },
  { style: 'story, how many fit (set up the division)', make: r => {
    const { c, d, m } = until(() => { const { n: c, d } = proper(r, [5, 8, 10, 12, 16], 2); return { c, d, m: int(r, 2, 6) } }, x => x.m * x.c < x.d)
    const g = gcd(m * c, d), an = (m * c) / g, ad = d / g, A = f(an, ad)
    const [start, each, ask, unit, end] = pick(r, [
      [`A jug holds ${A} gallon of lemonade.`, `Each glass holds ${f(c, d)} gallon.`, 'How many glasses can you fill?', 'gal', `you can fill ${m} glasses`],
      [`A bag holds ${A} pound of rice.`, `Each serving is ${f(c, d)} pound.`, 'How many servings are in the bag?', 'lb', `there are ${m} servings in the bag`],
      [`A roll has ${A} yard of tape left.`, `Each strip uses ${f(c, d)} yard.`, 'How many strips can you cut?', 'yd', `you can cut ${m} strips`],
    ] as const)
    return { text: `${start} ${each} ${ask}`, picture: { kind: 'bars', bars: [{ parts: ad, shaded: an, label: `${A} ${unit}` }] }, answer: m,
      steps: [`The story asks how many ${f(c, d)}s fit in ${A}, so find ${A} ÷ ${f(c, d)}.`, `Flip and multiply: ${A} × ${f(d, c)} = ${f(an * d, ad * c)}.`, `So ${end}.`] }
  } },
]

// ── t3 · Multiply mixed numbers ─────────────────────────────────────────────────────────────────────────────
type Mixed = ReturnType<typeof mixedNum>
/** Two mixed numbers whose product is not a whole number. */
const product3 = (r: Rng) => until(() => { const x = mixedNum(r, 3, [2, 3, 4, 5]), y = mixedNum(r, 3, [2, 3, 4, 5]); return { x, y, n: x.N * y.N, d: x.q * y.q } }, o => o.n % o.d !== 0)
const toFracs = (x: Mixed, y: Mixed) => (x.s === y.s ? `${x.s} = ${f(x.N, x.q)}` : `${x.s} = ${f(x.N, x.q)} and ${y.s} = ${f(y.N, y.q)}`)
const mulSteps = (x: Mixed, y: Mixed, n: number, d: number, lead = 'So the answer is') => [
  `Change to fractions: ${toFracs(x, y)}.`,
  `Multiply the tops and the bottoms: ${f(x.N, x.q)} × ${f(y.N, y.q)} = ${f(n, d)}.`,
  `${f(n, d)} = ${simple(n, d)}. ${lead} ${simple(n, d)}.`,
]
const mixedBars = (m: Mixed): Picture => ({ kind: 'bars', bars: [...Array.from({ length: m.w }, () => ({ parts: 1, shaded: 1 })), { parts: m.q, shaded: m.p }] })

const T3: Level[] = [
  { style: 'area model with all four parts', make: r => {
    const { x, y, n, d } = product3(r)
    return { text: `Find ${x.s} × ${y.s}. The area model shows all four parts.`,
      picture: { kind: 'area', cols: [String(x.w), f(x.p, x.q)], rows: [String(y.w), f(y.p, y.q)], widths: [x.w * x.q, x.p], heights: [y.w * y.q, y.p] },
      answer: fracAnswer(n, d), steps: mulSteps(x, y, n, d) }
  } },
  { style: 'bare mixed numbers', make: r => {
    const { x, y, n, d } = product3(r)
    return { text: `Find ${x.s} × ${y.s}.`, picture: eq(`${x.s} × ${y.s} = ?`), answer: fracAnswer(n, d), steps: mulSteps(x, y, n, d) }
  } },
  { style: 'spot the mistake (wholes and fractions multiplied on their own)', make: r => {
    const { x, y, n, d } = product3(r), name = pick(r, NAMES)
    const wrong = `${x.w * y.w} ${simple(x.p * y.p, x.q * y.q)}`, said = `${x.s} × ${y.s} = ${wrong}`
    return { text: `${name} says ${said}. That is not right. What is the right answer?`, picture: eq(said), answer: fracAnswer(n, d),
      steps: [`${name} multiplied the wholes and the fractions on their own, and lost two parts.`, `Change to fractions first: ${f(x.N, x.q)} × ${f(y.N, y.q)} = ${f(n, d)}.`, `${f(n, d)} = ${simple(n, d)}. So the right answer is ${simple(n, d)}.`] }
  } },
  { style: 'story, one product', make: r => {
    const { x, y, n, d } = product3(r), s = simple(n, d)
    const [text, end] = pick(r, [
      [`A garden bed is ${x.s} yards long and ${y.s} yards wide. How many square yards does it cover?`, `So the bed covers ${s} square yards.`],
      [`A recipe uses ${x.s} cups of flour. You make ${y.s} batches. How many cups of flour do you need?`, `So you need ${s} cups of flour.`],
      [`You walk ${x.s} miles each hour. How many miles do you walk in ${y.s} hours?`, `So you walk ${s} miles.`],
    ] as const)
    return { text, picture: mixedBars(x), answer: fracAnswer(n, d),
      steps: [`Find ${x.s} × ${y.s}. Change to fractions: ${f(x.N, x.q)} and ${f(y.N, y.q)}.`, `Multiply: ${f(x.N, x.q)} × ${f(y.N, y.q)} = ${f(n, d)}, which is ${s}.`, end] }
  } },
  { style: 'two-step story (multiply, then how much more)', make: r => {
    // Re-rolled when what is left equals a factor: the picture prints both factors.
    const { x, y, n, d, C } = until(() => { const o = product3(r); return { ...o, C: int(r, 1, Math.floor(o.n / o.d)) } },
      o => ![o.x.N * o.d / o.x.q, o.y.N * o.d / o.y.q].includes(o.n - o.C * o.d))
    const more = n - C * d, s = simple(n, d), m = simple(more, d)
    const [text, unit] = pick(r, [
      [`A recipe uses ${x.s} cups of flour. You make ${y.s} batches. You have ${C} ${C === 1 ? 'cup' : 'cups'} of flour. How many more cups do you need?`, 'cups'],
      [`A wall is ${x.s} yards long and ${y.s} yards tall. You have paint for ${C} square ${C === 1 ? 'yard' : 'yards'}. How many more square yards do you need paint for?`, 'square yards'],
    ] as const)
    return { text, picture: eq(`${x.s} × ${y.s} = ?`, [`? − ${C} = ?`]), answer: fracAnswer(more, d),
      steps: [`First multiply: ${f(x.N, x.q)} × ${f(y.N, y.q)} = ${f(n, d)}, which is ${s} ${unit}.`, `Take away what you have: ${s} − ${C} = ${m}.`, `So you need ${m} more ${unit}.`] }
  } },
]

// ── t4 · Divide mixed numbers ───────────────────────────────────────────────────────────────────────────────
/** A mixed number that is exactly m times a mixed-number divisor: the answer is the whole number m. */
const exactDiv = (r: Rng, mLo: number, mHi: number) => until(() => {
  const y = mixedNum(r, 2, [2, 3, 4]), m = int(r, mLo, mHi), g = gcd(m * y.N, y.q)
  return { y, m, xn: (m * y.N) / g, xd: y.q / g, xs: simple(m * y.N, y.q) }
}, o => o.xn % o.xd !== 0)

const T4: Level[] = [
  { style: 'bars cut into pieces, mixed number ÷ fraction', make: r => {
    const { d, W, p, c, N } = until(() => {
      const d = pick(r, [3, 4, 5, 6]), W = int(r, 1, 3), p = int(r, 1, d - 1), c = int(r, 2, d - 1)
      return { d, W, p, c, N: W * d + p }
    }, o => gcd(o.p, o.d) === 1 && gcd(o.c, o.d) === 1 && o.N % o.c === 0)
    return { text: `Find ${W} ${f(p, d)} ÷ ${f(c, d)}. Every whole in the picture is cut into ${PLUR[d]}.`,
      picture: { kind: 'bars', bars: [...Array.from({ length: W }, () => ({ parts: d, shaded: d })), { parts: d, shaded: p }] }, answer: N / c,
      steps: [`Change ${W} ${f(p, d)} to a fraction: ${W} ${W === 1 ? 'whole is' : 'wholes are'} ${W * d} ${PLUR[d]}, and ${p} more makes ${f(N, d)}.`, `Flip ${f(c, d)} and multiply: ${f(N, d)} × ${f(d, c)} = ${f(N * d, d * c)}.`, `So ${W} ${f(p, d)} ÷ ${f(c, d)} = ${N / c}.`] }
  } },
  { style: 'bare, both mixed numbers', make: r => {
    const { y, m, xn, xd, xs } = exactDiv(r, 2, 4)
    return { text: `Find ${xs} ÷ ${y.s}.`, picture: eq(`${xs} ÷ ${y.s} = ?`), answer: m,
      steps: [`Change both: ${xs} = ${f(xn, xd)} and ${y.s} = ${f(y.N, y.q)}.`, `Flip ${f(y.N, y.q)} and multiply: ${f(xn, xd)} × ${f(y.q, y.N)} = ${f(xn * y.q, xd * y.N)}.`, `So ${xs} ÷ ${y.s} = ${m}.`] }
  } },
  { style: 'spot the mistake (whole and fraction divided separately)', make: r => {
    const { d, W, p, c, N } = until(() => {
      const d = pick(r, [4, 5, 6, 8]), W = int(r, 1, 4), p = int(r, 1, d - 2), c = int(r, p + 1, d - 1)
      return { d, W, p, c, N: W * d + p }
    }, o => gcd(o.p, o.d) === 1 && gcd(o.c, o.d) === 1 && o.N % o.c !== 0)
    const name = pick(r, NAMES), said = `${W} ${f(p, d)} ÷ ${f(c, d)} = ${W} ${simple(p, c)}`, s = simple(N, c)
    return { text: `${name} says ${said}. That is not right. What is the right answer?`, picture: eq(said), answer: fracAnswer(N, c),
      steps: [`${name} divided the whole number and the fraction separately. But ${W} ${f(p, d)} is one amount: ${f(N, d)}.`, `Flip ${f(c, d)} and multiply: ${f(N, d)} × ${f(d, c)} = ${f(N * d, d * c)}.`, `${f(N * d, d * c)} = ${s}. So the right answer is ${s}.`] }
  } },
  { style: 'pick the right way to start', make: r => {
    const { x, y } = until(() => ({ x: mixedNum(r, 3, [2, 3, 4, 5]), y: mixedNum(r, 2, [2, 3, 4]) }), o => o.x.N * o.y.q !== o.y.N * o.x.q)
    const right = `${f(x.N, x.q)} × ${f(y.q, y.N)}`
    return { text: `Which one is the same as ${x.s} ÷ ${y.s}?`, picture: eq(`${x.s} ÷ ${y.s}`),
      answer: choose(r, right, [`${f(x.N, x.q)} × ${f(y.N, y.q)}`, `${f(x.q, x.N)} × ${f(y.N, y.q)}`]),
      steps: [`Change both mixed numbers to fractions: ${f(x.N, x.q)} and ${f(y.N, y.q)}.`, `Keep the first fraction. Change ÷ to ×. Flip ${f(y.N, y.q)} to ${f(y.q, y.N)}.`, `So the answer is ${right}.`] }
  } },
  { style: 'story, how many equal parts', make: r => {
    const { y, m, xn, xd, xs } = exactDiv(r, 3, 6)
    const [text, unit, end] = pick(r, [
      [`A trail is ${xs} miles long. It is split into equal sections of ${y.s} miles. How many sections are there?`, 'miles', `So there are ${m} sections.`],
      [`A rope is ${xs} feet long. You cut it into pieces that are each ${y.s} feet long. How many pieces do you get?`, 'feet', `So you get ${m} pieces.`],
      [`You have ${xs} cups of flour. Each batch of muffins uses ${y.s} cups. How many batches can you make?`, 'cups', `So you can make ${m} batches.`],
    ] as const)
    return { text, picture: { kind: 'tape', rows: [{ cells: [{ w: 1 }], brace: `${xs} ${unit}` }] }, answer: m,
      steps: [`Find ${xs} ÷ ${y.s}. Change both: ${f(xn, xd)} and ${f(y.N, y.q)}.`, `Flip and multiply: ${f(xn, xd)} × ${f(y.q, y.N)} = ${f(xn * y.q, xd * y.N)}.`, end] }
  } },
]

// ── t5 · Fraction division stories ──────────────────────────────────────────────────────────────────────────
type Ctx = { stuff: string; one: string; many: string; piece: string; pieces: string; verb: string }
const CTX5: Ctx[] = [
  { stuff: 'trail mix', one: 'cup', many: 'cups', piece: 'serving', pieces: 'servings', verb: 'pack' },
  { stuff: 'ribbon', one: 'yard', many: 'yards', piece: 'bow', pieces: 'bows', verb: 'make' },
  { stuff: 'rice', one: 'cup', many: 'cups', piece: 'serving', pieces: 'servings', verb: 'make' },
  { stuff: 'rope', one: 'foot', many: 'feet', piece: 'piece', pieces: 'pieces', verb: 'cut' },
]
const have = (c: Ctx, amt: string, plural: boolean) => `You have ${amt} ${plural ? c.many : c.one} of ${c.stuff}.`
const eachUses = (c: Ctx, size: string) =>
  c.piece === 'serving' ? `Each serving is ${size} ${c.one}.` : c.piece === 'piece' ? `Each piece is ${size} ${c.one} long.` : `Each ${c.piece} uses ${size} ${c.one}.`
const unitTape = (n: number, c: Ctx): Picture => ({ kind: 'tape', rows: [{ cells: Array.from({ length: n }, () => ({ w: 1, text: `1 ${c.one}` })), brace: `${n} ${c.many}` }] })

const T5: Level[] = [
  { style: 'tape of the whole amount cut to the serving size', make: r => {
    const { W, c, d } = until(() => { const { n: c, d } = proper(r, [2, 3, 4, 5, 6]); return { W: int(r, 2, 5), c, d } }, o => o.c <= 3 && o.W % o.c === 0 && o.W * o.d <= 24)
    const k = (W * d) / c, x = pick(r, CTX5)
    return { text: `${have(x, String(W), true)} ${eachUses(x, f(c, d))} The tape shows the ${W} ${x.many} cut into ${PLUR[d]}. How many ${x.pieces} can you ${x.verb}?`,
      picture: { kind: 'tape', rows: [{ cells: Array.from({ length: W * d }, () => ({ w: 1 })), brace: `${W} ${x.many}` }] }, answer: k,
      steps: [`${W} ${x.many} make ${W * d} ${PLUR[d]}. One ${x.piece} is ${c} of them.`, `Find ${W} ÷ ${f(c, d)}: ${W} × ${f(d, c)} = ${f(W * d, c)}.`, `So you can ${x.verb} ${k} ${x.pieces}.`] }
  } },
  { style: 'pick the division that matches the story (order trap)', make: r => {
    const W = int(r, 2, 6), { n: c, d } = proper(r, [2, 3, 4, 5, 6, 8]), x = pick(r, CTX5), right = `${W} ÷ ${f(c, d)}`
    return { text: `${have(x, String(W), true)} ${eachUses(x, f(c, d))} Which one tells how many ${x.pieces} you can ${x.verb}?`,
      picture: unitTape(W, x), answer: choose(r, right, [`${f(c, d)} ÷ ${W}`, `${W} × ${f(c, d)}`]),
      steps: [`The story asks how many ${f(c, d)}-${x.one} ${x.pieces} fit in ${W} ${x.many}.`, 'Start with the amount you have, then divide by the size of one piece.', `So the answer is ${right}.`] }
  } },
  { style: 'story starting from a mixed number', make: r => {
    const { c, d, m } = until(() => { const { n: c, d } = proper(r, [2, 3, 4, 6, 8]); return { c, d, m: int(r, 3, 10) } }, o => (o.m * o.c) % o.d !== 0 && o.m * o.c > o.d)
    const g = gcd(m * c, d), an = (m * c) / g, ad = d / g, w = Math.floor(an / ad), rn = an - w * ad, A = `${w} ${f(rn, ad)}`
    const x = pick(r, CTX5.filter(c => c.stuff !== 'trail mix'))
    return { text: `${have(x, A, true)} ${eachUses(x, f(c, d))} How many ${x.pieces} can you ${x.verb}?`,
      picture: { kind: 'tape', rows: [{ cells: [...Array.from({ length: w }, () => ({ w: ad, text: `1 ${x.one}` })), { w: rn }], brace: `${A} ${x.many}` }] }, answer: m,
      steps: [`Find ${A} ÷ ${f(c, d)}. Change ${A} to ${f(an, ad)}.`, `Flip and multiply: ${f(an, ad)} × ${f(d, c)} = ${f(an * d, ad * c)}.`, `So you can ${x.verb} ${m} ${x.pieces}.`] }
  } },
  { style: 'story with part of a piece left (mixed-number answer)', make: r => {
    const { W, c, d } = until(() => { const { n: c, d } = proper(r, [3, 4, 5, 6, 8], 2); return { W: int(r, 2, 6), c, d } }, o => (o.W * o.d) % o.c !== 0)
    const x = pick(r, CTX5), s = simple(W * d, c)
    return { text: `${have(x, String(W), true)} ${eachUses(x, f(c, d))} How many ${x.pieces} is that? Part of one counts too.`,
      picture: unitTape(W, x), answer: fracAnswer(W * d, c),
      steps: [`Find how many ${f(c, d)}s fit in ${W}: ${W} ÷ ${f(c, d)}.`, `Flip and multiply: ${W} × ${f(d, c)} = ${f(W * d, c)}.`, `${f(W * d, c)} = ${s}. So that is ${s} ${x.pieces}.`] }
  } },
  { style: 'two-step story (find the total, then how many fit)', make: r => {
    const { c, d, n, j } = until(() => { const { n: c, d } = proper(r, [3, 4, 6, 8]); return { c, d, n: int(r, 2, 4), j: int(r, 2, 5) } }, o => (o.j * o.c) % o.d !== 0)
    const A = simple(j * c, d), k = n * j, T = f(n * j * c, d), big = j * c > d
    const [text, end] = pick(r, [
      [`You have ${n} bags of trail mix. Each bag holds ${A} ${big ? 'cups' : 'cup'}. Each serving is ${f(c, d)} cup. How many servings can you pack?`, `So you can pack ${k} servings.`],
      [`You have ${n} rolls of ribbon. Each roll is ${A} ${big ? 'yards' : 'yard'} long. Each bow uses ${f(c, d)} yard. How many bows can you make?`, `So you can make ${k} bows.`],
    ] as const)
    return { text, picture: { kind: 'tape', rows: [{ cells: Array.from({ length: n }, () => ({ w: 1, text: A })), brace: '?' }] }, answer: k,
      steps: [`First find the total: ${n} × ${A} = ${T}.`, `Then find how many ${f(c, d)}s fit: ${T} × ${f(d, c)} = ${f(n * j * c * d, d * c)}.`, end] }
  } },
]

// ── t6 · Greatest common factor ─────────────────────────────────────────────────────────────────────────────
const factors = (n: number) => Array.from({ length: n }, (_, i) => i + 1).filter(k => n % k === 0)
/** a < b, with a shared factor g of at least 2 that is neither number itself. */
const gcfPair = (r: Rng, lo: number, hi: number, ok: (g: number) => boolean = () => true) => until(() => {
  const a = int(r, lo, hi), b = int(r, lo, hi)
  return { a: Math.min(a, b), b: Math.max(a, b), g: gcd(a, b) }
}, o => o.a !== o.b && o.g >= 2 && o.g !== o.a && ok(o.g))
const factorQ = (a: number, b: number): Picture => ({ kind: 'table', head: ['Number', 'Factors'], rows: [[String(a), '?'], [String(b), '?']], rowHead: true })
const listSteps = (a: number, b: number) => [`Factors of ${a}: ${factors(a).join(', ')}.`, `Factors of ${b}: ${factors(b).join(', ')}.`]

const T6: Level[] = [
  { style: 'factor lists given, find the biggest on both', make: r => {
    const { a, b, g } = gcfPair(r, 8, 40, g => g <= 9)
    const both = factors(a).filter(k => b % k === 0)
    return { text: `The table lists every factor of ${a} and of ${b}. What is the biggest number on both lists?`,
      picture: { kind: 'table', head: ['Number', 'Factors'], rows: [[String(a), factors(a).join(', ')], [String(b), factors(b).join(', ')]], rowHead: true }, answer: g,
      steps: [`The numbers on both lists are ${both.join(', ')}.`, `The biggest one is ${g}.`] }
  } },
  { style: 'bare: list both, find the biggest shared', make: r => {
    const { a, b, g } = gcfPair(r, 8, 60)
    return { text: `What is the biggest number that is a factor of both ${a} and ${b}?`, picture: factorQ(a, b), answer: g,
      steps: [...listSteps(a, b), `The biggest number on both lists is ${g}.`] }
  } },
  { style: 'spot the mistake (stopped at the first shared factor)', make: r => {
    const { a, b, g } = gcfPair(r, 12, 72, g => factors(g).length > 2)
    const s = factors(g)[1], name = pick(r, NAMES)
    return { text: `${name} says the biggest factor ${a} and ${b} share is ${s}, because ${s} goes into both. What is the biggest factor they share?`, picture: factorQ(a, b), answer: g,
      steps: [`${s} is a factor of both, but ${name} stopped at the first one that works.`, `${listSteps(a, b).join(' ')}`, `The biggest number on both lists is ${g}.`] }
  } },
  { style: 'pick the pair that has this greatest common factor', make: r => {
    const g = int(r, 2, 12)
    const pair = (ok: (x: number) => boolean) => until(() => { const p = int(r, 4, 60), q = int(r, 4, 60); return { p: Math.min(p, q), q: Math.max(p, q) } }, o => o.p !== o.q && ok(gcd(o.p, o.q)))
    const right = pair(x => x === g && x !== 0)
    const big = pair(x => x > g && x % g === 0), other = pair(x => x % g !== 0 && x !== gcd(big.p, big.q))
    const say = (o: { p: number; q: number }) => `${o.p} and ${o.q}`
    const said = (o: { p: number; q: number }) => `The biggest factor ${o.p} and ${o.q} share is ${gcd(o.p, o.q)}.`
    return { text: `Which pair of numbers has ${g} as the biggest factor they share?`, picture: eq(`biggest shared factor = ${g}`),
      answer: choose(r, say(right), [say(big), say(other)]),
      steps: [said(big), said(other), `${said(right)} So the answer is ${say(right)}.`] }
  } },
  { style: 'two-step story (largest number of groups, then what goes in each)', make: r => {
    const { a, b, g } = gcfPair(r, 8, 60, g => g <= 12)
    const [A, B, groups, group] = pick(r, [['pencils', 'erasers', 'gift bags', 'bag'], ['roses', 'tulips', 'bunches', 'bunch'], ['apples', 'oranges', 'baskets', 'basket']] as const)
    const k = b / g
    return { text: `You have ${a} ${A} and ${b} ${B}. You make identical ${groups} that use them all, with nothing left over. You make as many ${groups} as you can. How many ${B} go in each ${group}?`,
      picture: { kind: 'table', head: ['Item', 'How many'], rows: [[A[0].toUpperCase() + A.slice(1), String(a)], [B[0].toUpperCase() + B.slice(1), String(b)]], rowHead: true }, answer: k,
      steps: [`The biggest factor ${a} and ${b} share is ${g}, so you make ${g} ${groups}.`, `Each ${group} gets ${b} ÷ ${g} = ${k} ${B}.`, `So ${k} ${B} go in each ${group}.`] }
  } },
]

// ── t7 · Least common multiple ──────────────────────────────────────────────────────────────────────────────
/** a < b, neither a multiple of the other, smallest shared multiple at most `max`. */
const lcmPair = (r: Rng, lo: number, hi: number, max: number, ok: (a: number, b: number) => boolean = () => true) => until(() => {
  const a = int(r, lo, hi), b = int(r, lo, hi)
  return { a: Math.min(a, b), b: Math.max(a, b) }
}, o => o.a !== o.b && o.b % o.a !== 0 && lcm(o.a, o.b) <= max && ok(o.a, o.b))
const countList = (step: number, upTo: number) => Array.from({ length: upTo / step }, (_, i) => step * (i + 1)).join(', ')
/** The lessons' scratch line: one jump of each from 0, ends labelled only. */
const countQ = (a: number, b: number): Picture => {
  const l = lcm(a, b), M = l + b, g = gcd(a, b)
  let step = g
  while (M / step > 24 || M % step !== 0) step += g
  return { kind: 'numline', min: 0, max: M, ticks: M / step, labels: 'ends', jumps: [{ from: 0, to: a, label: `+${a}` }, { from: 0, to: b, label: `+${b}` }] }
}

const T7: Level[] = [
  { style: 'jumps of one count drawn on a labelled line', make: r => {
    const { a, b } = lcmPair(r, 2, 12, 40, (a, b) => (lcm(a, b) + b) / gcd(a, b) <= 24), l = lcm(a, b), M = l + b
    return { text: `The jumps count by ${b}s. What is the smallest number that is a multiple of both ${a} and ${b}?`,
      picture: { kind: 'numline', min: 0, max: M, ticks: M / gcd(a, b), jumps: Array.from({ length: M / b }, (_, i) => ({ from: b * i, to: b * (i + 1) })) }, answer: l,
      steps: [`The jumps land on ${countList(b, M)}.`, `Check each one: is it a multiple of ${a}?`, `The first one that is, is ${l}.`] }
  } },
  { style: 'bare: count by each', make: r => {
    const { a, b } = lcmPair(r, 2, 15, 60), l = lcm(a, b)
    return { text: `What is the smallest number that is a multiple of both ${a} and ${b}?`, picture: countQ(a, b), answer: l,
      steps: [`Count by ${a}s: ${countList(a, l)}.`, `Count by ${b}s: ${countList(b, l)}.`, `The first number on both counts is ${l}.`] }
  } },
  { style: 'spot the mistake (just multiplied the two numbers)', make: r => {
    const { a, b } = lcmPair(r, 4, 15, 60, (a, b) => gcd(a, b) > 1), l = lcm(a, b), name = pick(r, NAMES)
    return { text: `${name} says the smallest multiple of both ${a} and ${b} is ${a * b}, because ${a} × ${b} = ${a * b}. What is the smallest one?`,
      picture: eq(`${a} × ${b} = ${a * b}`), answer: l,
      steps: [`${a * b} is a multiple of both, but it is not the smallest one.`, `Count by ${b}s: ${countList(b, l)}. Check each one against ${a}s.`, `The first number on both counts is ${l}.`] }
  } },
  { style: 'pick the one number that is a multiple of both', make: r => {
    const { a, b } = lcmPair(r, 3, 12, 60), l = lcm(a, b), right = l * int(r, 1, 2)
    const onlyA = until(() => a * int(r, 2, Math.ceil((right + a * 3) / a)), x => x % b !== 0 && x > b)
    const onlyB = until(() => b * int(r, 2, Math.ceil((right + b * 3) / b)), x => x % a !== 0)
    const sum = a + b
    return { text: `Which number is a multiple of both ${a} and ${b}?`, picture: countQ(a, b),
      answer: choose(r, String(right), [String(onlyA), String(onlyB), String(sum)]),
      steps: [`${onlyA} is a multiple of ${a} but not of ${b}. ${onlyB} is a multiple of ${b} but not of ${a}.`, `${sum} is a multiple of neither.`, `${right} = ${right / a} × ${a} = ${right / b} × ${b}. So the answer is ${right}.`] }
  } },
  { style: 'two-step story (same number of each, how many packs)', make: r => {
    // A shared factor, or the answer is just the other pack size, which the table prints.
    const { a, b } = lcmPair(r, 3, 12, 60, (a, b) => gcd(a, b) > 1), l = lcm(a, b)
    const [X, Y, xs, ys] = pick(r, [['Hot dogs', 'Buns', 'hot dogs', 'buns'], ['Paper plates', 'Cups', 'paper plates', 'cups'], ['Juice boxes', 'Granola bars', 'juice boxes', 'granola bars']] as const)
    const [pa, pb] = r() < 0.5 ? [a, b] : [b, a]
    const askFirst = r() < 0.5, askN = askFirst ? pa : pb, askWord = askFirst ? xs : ys
    return { text: `${X} come in packs of ${pa}. ${Y} come in packs of ${pb}. You want the same number of ${xs} and ${ys}, and as few as you can. How many packs of ${askWord} do you buy?`,
      picture: { kind: 'table', head: ['Item', 'Pack size'], rows: [[X, String(pa)], [Y, String(pb)]], rowHead: true }, answer: l / askN,
      steps: [`Count by ${pa}s and by ${pb}s. The first number on both counts is ${l}, so you buy ${l} of each.`, `${l} ÷ ${askN} = ${l / askN}.`, `So you buy ${l / askN} packs of ${askWord}.`] }
  } },
]

export const G6M2_LADDERS: Record<string, Level[]> = {
  'g6m2-t1': T1, 'g6m2-t2': T2, 'g6m2-t3': T3, 'g6m2-t4': T4, 'g6m2-t5': T5, 'g6m2-t6': T6, 'g6m2-t7': T7,
}
