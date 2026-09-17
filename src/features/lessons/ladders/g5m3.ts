/**
 * Grade 5 · Module 3 — Multiplication and division with fractions. Practice ladders, easiest style first (see
 * ../adaptive.ts and the reference ladders in ./g5m1.ts). Fraction answers are `{ frac }` with no `exact`, like the
 * lessons, so an equal fraction (2/6 for 1/3) is also right. Pictures reuse the lessons' own shapes: whole bars, a tape,
 * a pan grid, one square meter.
 */
import type { Picture } from '../script'
import { int, pick, shuffle, type Level, type Rng } from '../adaptive'

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
const f = (n: number, d: number) => `${n}/${d}`
const pl = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`
const until = <T>(gen: () => T, ok: (x: T) => boolean): T => { let x = gen(); while (!ok(x)) x = gen(); return x }
const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })

/** `n` whole bars, each optionally cut into `split` pieces. */
const wholes = (n: number, split?: number): Picture => ({ kind: 'bars', bars: Array.from({ length: n }, () => ({ parts: 1, shaded: 0, split })) })
/** One bar in `parts`, `shaded` of them shaded, each part optionally cut into `split`. */
const piece = (parts: number, shaded: number, split?: number): Picture => ({ kind: 'bars', bars: [{ parts, shaded, split }] })
/** A tape in `n` equal cells, the first `shade` shaded, under a brace. */
const tape = (n: number, brace?: string, shade = 0): Picture => ({ kind: 'tape', rows: [{ cells: Array.from({ length: n }, (_, i) => ({ w: 1, shade: i < shade })), brace }] })
/** A pan: `rows` × `cols`, the top `have` rows shaded (the part you have). */
const pan = (rows: number, cols: number, have: number): Picture => ({ kind: 'grid', rows, cols, shade: [{ r: 0, c: 0, h: have, w: cols, tone: 1 }] })
/** One square meter in `rows` × `cols`; `covR` × `covC` pieces covered. */
const meter = (rows: number, cols: number, covR = 0, covC = 0): Picture => ({
  kind: 'grid', rows, cols, top: '1 m', left: '1 m', shade: covR ? [{ r: 0, c: 0, h: covR, w: covC, tone: 1 }] : undefined,
})

/** A choice question: the right text among the wrong ones, shuffled; `correct` follows it. */
const choose = (r: Rng, right: string, wrong: string[]) => {
  const choices = shuffle(r, [right, ...wrong])
  return { choices, correct: choices.indexOf(right) }
}
/** All different values? (so no wrong choice is secretly right) */
const distinct = (vals: number[]) => vals.every((v, i) => vals.every((w, j) => i === j || Math.abs(v - w) > 1e-9))
/** A fraction in lowest terms, top 1..d-1. */
const proper = (r: Rng, dLo: number, dHi: number, nLo = 1) => until(() => { const d = int(r, dLo, dHi); return { d, n: int(r, Math.min(nLo, d - 1), d - 1) } }, x => gcd(x.n, x.d) === 1)

// ── t1 · A fraction is a division ──────────────────────────────────────────────────────────────────────────
const T1: Level[] = [
  { style: 'share pizzas, picture of the wholes', make: r => {
    const k = int(r, 3, 10), n = int(r, 2, k - 1)
    return { text: `${n} pizzas are shared equally by ${k} friends. How much pizza does each friend get?`, picture: wholes(n), answer: { frac: [n, k] },
      steps: [`Cut each pizza into ${k} equal slices, one for each friend.`, `Each friend gets 1 slice from each of the ${n} pizzas: ${n} slices of ${f(1, k)}.`, `So ${n} ÷ ${k} = ${f(n, k)}.`] }
  } },
  { style: 'bare division, write the fraction', make: r => {
    const b = int(r, 3, 12), a = int(r, 1, b - 1)
    return { text: `Write ${a} ÷ ${b} as a fraction.`, picture: eq(`${a} ÷ ${b} = ?`), answer: { frac: [a, b] },
      steps: ['A fraction is a share.', `The number being shared, ${a}, goes on top. The ${b} goes on the bottom.`, `So ${a} ÷ ${b} = ${f(a, b)}.`] }
  } },
  { style: 'pick the division that matches (flip trap)', make: r => {
    const { a, b } = until(() => { const b = int(r, 3, 9); return { b, a: int(r, 2, b - 1) } }, x => gcd(x.a, x.b) === 1), right = `${a} ÷ ${b}`
    return { text: `Which one is the same as ${f(a, b)}?`, picture: eq(`${f(a, b)} = ?`), answer: choose(r, right, [`${b} ÷ ${a}`, `${a} × ${b}`, `${b - a} ÷ ${b}`]),
      steps: [`A fraction is a division: the top number is shared by the bottom number.`, `${a} is on top, so ${a} is shared. Don't flip the numbers.`, `So the answer is ${right}.`] }
  } },
  { style: 'work backwards: how many were shared', make: r => {
    const k = int(r, 3, 9), a = int(r, 2, k - 1)
    const [things, thing] = pick(r, [['pizzas', 'pizza'], ['pies', 'pie'], ['cakes', 'cake']] as const)
    return { text: `Some ${things} are shared equally by ${k} friends. Each friend gets ${f(a, k)} of a ${thing}. How many ${things} were shared?`, picture: piece(k, a), answer: a,
      steps: [`Each friend gets ${f(a, k)}, and ${f(a, k)} is the same as ${a} ÷ ${k}.`, `The number being shared is the top number. The ${k} friends are the bottom number.`, `So ${a} ${things} were shared.`] }
  } },
  { style: 'story with a mixed number answer', make: r => {
    const k = int(r, 2, 5), w = int(r, 1, 3), rem = int(r, 1, k - 1), n = w * k + rem
    const [what, share, units, ask] = pick(r, [
      ['yards of ribbon are cut into', 'equal pieces', 'yards', 'How many yards long is each piece?'],
      ['cups of juice are poured equally into', 'bottles', 'cups', 'How many cups go in each bottle?'],
      ['pounds of clay are shared equally by', 'kids', 'pounds', 'How many pounds does each kid get?'],
    ] as const)
    return { text: `${n} ${what} ${k} ${share}. ${ask}`, picture: wholes(n), answer: { frac: [rem, k], whole: w },
      steps: [`${n} ÷ ${k} is ${f(n, k)}.`, `${f(w * k, k)} make ${w === 1 ? '1 whole' : `${w} wholes`}, and ${f(rem, k)} ${rem === 1 ? 'is' : 'are'} left over.`, `So the answer is ${w} ${f(rem, k)} ${units}.`] }
  } },
]

// ── t2 · A fraction of a whole number ──────────────────────────────────────────────────────────────────────
const fracOf = (r: Rng, nLo = 1) => { const { d, n } = proper(r, 3, 8, nLo); const part = int(r, 2, 9); return { d, n, part, N: d * part, X: n * part } }

const T2: Level[] = [
  { style: 'tape cut into parts', make: r => {
    const { d, n, part, N, X } = fracOf(r)
    return { text: `What is ${f(n, d)} of ${N}? The tape is cut into ${d} equal parts.`, picture: tape(d, `${N}`), answer: X,
      steps: [`Cut ${N} into ${d} equal parts: ${N} ÷ ${d} = ${part}.`, `Take ${n} of the parts: ${n} × ${part}.`, `So ${f(n, d)} of ${N} is ${X}.`] }
  } },
  { style: 'bare numbers, of means times', make: r => {
    const { d, n, part, N, X } = fracOf(r)
    return { text: `Find ${f(n, d)} × ${N}.`, picture: eq(`${f(n, d)} × ${N} = ?`), answer: X,
      steps: [`${f(n, d)} × ${N} means ${f(n, d)} of ${N}. ${N} ÷ ${d} = ${part}, so each part is ${part}.`, `Take ${n} parts: ${n} × ${part}.`, `So ${f(n, d)} × ${N} = ${X}.`] }
  } },
  { style: 'pick the true one (stopped at one part)', make: r => {
    const { d, n, part, N, X } = fracOf(r, 2), right = `${f(n, d)} of ${N} = ${X}`
    return { text: 'Which one is true?', picture: eq(`${f(n, d)} of ${N}`), answer: choose(r, right, [`${f(n, d)} of ${N} = ${part}`, `${f(n, d)} of ${N} = ${n * N}`]),
      steps: [`One part is ${N} ÷ ${d} = ${part}. That is only ${f(1, d)} of ${N}.`, `We want ${n} parts: ${n} × ${part} = ${X}.`, `So the answer is ${right}.`] }
  } },
  { style: 'work backwards: find the whole', make: r => {
    const { d, n, part, N, X } = fracOf(r, 2)
    return { text: `${f(n, d)} of a number is ${X}. What is the number?`, picture: eq(`${f(n, d)} of ? = ${X}`), answer: N,
      steps: [`${n} equal parts make ${X}, so one part is ${X} ÷ ${n} = ${part}.`, `The whole number has ${d} parts: ${d} × ${part}.`, `So the number is ${N}.`] }
  } },
  { style: 'two-step story (the rest)', make: r => {
    const { d, n, part, N, X } = fracOf(r)
    const R = N - X
    const [start, did, end] = pick(r, [
      [`A class has ${N} students.`, 'of them walk to school. The rest ride the bus. How many students ride the bus?', 'students ride the bus'],
      [`You have ${N} stickers.`, 'of them go to your sister. You keep the rest. How many stickers do you keep?', 'stickers are yours to keep'],
      [`A farm has ${N} chickens.`, 'of them are brown. The rest are white. How many chickens are white?', 'chickens are white'],
    ] as const)
    return { text: `${start} ${f(n, d)} ${did}`, picture: tape(d, `${N}`), answer: R,
      steps: [`One part is ${N} ÷ ${d} = ${part}, so ${f(n, d)} of ${N} is ${n} × ${part} = ${X}.`, `The rest is ${N} − ${X}.`, `So ${R} ${end}.`] }
  } },
]

// ── t3 · A fraction of a fraction ──────────────────────────────────────────────────────────────────────────
const T3: Level[] = [
  { style: 'pan picture, a piece of a piece', make: r => {
    const c = int(r, 2, 5), b = int(r, 2, 5)
    return { text: `You have ${f(1, c)} of a pan. You eat ${f(1, b)} of that part. How much of the whole pan is that?`, picture: pan(c, b, 1), answer: { frac: [1, b * c] },
      steps: [`Your part is the top row. The pan has ${b} columns, so your part has ${b} pieces.`, `You eat 1 of those ${b} pieces. The whole pan has ${c} × ${b} = ${b * c} pieces.`, `So ${f(1, b)} × ${f(1, c)} = ${f(1, b * c)}.`] }
  } },
  { style: 'pan picture, take more than one piece', make: r => {
    const { d: b, n: a } = proper(r, 3, 6, 2), c = int(r, 2, 5)
    return { text: `Find ${f(a, b)} × ${f(1, c)}. The shaded row is ${f(1, c)} of the pan.`, picture: pan(c, b, 1), answer: { frac: [a, b * c] },
      steps: [`The shaded row is ${f(1, c)} of the pan, cut into ${b} pieces.`, `Take ${a} of the ${b} pieces. The whole pan has ${c} × ${b} = ${b * c} pieces.`, `So ${f(a, b)} × ${f(1, c)} = ${f(a, b * c)}.`] }
  } },
  { style: 'bare numbers, tops and bottoms', make: r => {
    const { a, b, m, c } = until(() => { const x = proper(r, 2, 6), y = proper(r, 2, 6); return { a: x.n, b: x.d, m: y.n, c: y.d } }, x => x.a * x.m > 1)
    return { text: `Find ${f(a, b)} × ${f(m, c)}.`, picture: eq(`${f(a, b)} × ${f(m, c)} = ?`), answer: { frac: [a * m, b * c] },
      steps: [`Multiply the tops: ${a} × ${m} = ${a * m} pieces taken.`, `Multiply the bottoms: ${b} × ${c} = ${b * c} pieces in the whole.`, `So ${f(a, b)} × ${f(m, c)} = ${f(a * m, b * c)}.`] }
  } },
  { style: 'pick the true one (add trap, bigger trap)', make: r => {
    const { a, b, m, c } = until(() => { const x = proper(r, 2, 5), y = proper(r, 2, 5); return { a: x.n, b: x.d, m: y.n, c: y.d } },
      x => distinct([(x.a * x.m) / (x.b * x.c), (x.a + x.m) / (x.b + x.c), (x.a * x.m) / x.b]))
    const ex = `${f(a, b)} × ${f(m, c)}`, right = `${ex} = ${f(a * m, b * c)}`
    return { text: 'Which one is true?', picture: eq(ex), answer: choose(r, right, [`${ex} = ${f(a + m, b + c)}`, `${ex} = ${f(a * m, b)}`]),
      steps: [`Multiply the tops: ${a} × ${m} = ${a * m}. Multiply the bottoms: ${b} × ${c} = ${b * c}.`, 'A piece of a piece is smaller than both fractions. Adding tops and bottoms does not work.', `So the answer is ${right}.`] }
  } },
  { style: 'story, part of a part', make: r => {
    const { d: c, n: m } = proper(r, 2, 5), { d: b, n: a } = proper(r, 2, 6)
    const [whole, part, piece2, ask] = pick(r, [
      ['a garden', 'has flowers', 'of the flower part has red flowers', 'What part of the whole garden has red flowers?'],
      ['a pan of brownies', 'is left', 'of what is left gets eaten', 'What part of the whole pan gets eaten?'],
      ['a field', 'is planted with corn', 'of the corn part is watered today', 'What part of the whole field is watered today?'],
    ] as const)
    return { text: `${f(m, c)} of ${whole} ${part}. ${f(a, b)} ${piece2}. ${ask}`, picture: piece(c, m), answer: { frac: [a * m, b * c] },
      steps: [`Find ${f(a, b)} of ${f(m, c)}: ${f(a, b)} × ${f(m, c)}.`, `Tops: ${a} × ${m} = ${a * m}. Bottoms: ${b} × ${c} = ${b * c}.`, `So the answer is ${f(a * m, b * c)}.`] }
  } },
]

// ── t4 · Area with fraction sides ──────────────────────────────────────────────────────────────────────────
/** Width n1/d1 (rows, measured down the left side, like the lesson), length n2/d2 (columns, along the top). */
const sides = (r: Rng) => { const w = proper(r, 2, 5), l = proper(r, 2, 5); return { n1: w.n, d1: w.d, n2: l.n, d2: l.d } }

/** One square meter with its sides named: the left side is the WIDE way (rows), the top the LONG way (columns). */
const sideMeter = (rows: number, cols: number, covR = 0, covC = 0): Picture => ({
  kind: 'grid', rows, cols, top: '1 m long', left: '1 m wide', shade: covR ? [{ r: 0, c: 0, h: covR, w: covC, tone: 1 }] : undefined,
})

const T4: Level[] = [
  { style: 'rug laid on one square meter', make: r => {
    const { n1, d1, n2, d2 } = sides(r)
    return { text: `A rug is ${f(n1, d1)} meter wide and ${f(n2, d2)} meter long. Count the pieces it covers out of all the pieces. What is its area, in square meters?`,
      picture: sideMeter(d1, d2, n1, n2), answer: { frac: [n1 * n2, d1 * d2] },
      steps: [`One square meter is cut into ${d1} rows and ${d2} columns: ${d1 * d2} equal pieces.`, `The rug covers ${pl(n1, 'row', 'rows')} and ${pl(n2, 'column', 'columns')}: ${n1} × ${n2} = ${n1 * n2} pieces.`, `So the area is ${f(n1 * n2, d1 * d2)} square meter.`] }
  } },
  { style: 'square meter cut, cover it yourself', make: r => {
    const { n1, d1, n2, d2 } = sides(r), thing = pick(r, ['mat', 'napkin', 'shelf board', 'poster'])
    return { text: `A ${thing} is ${f(n1, d1)} meter wide and ${f(n2, d2)} meter long. What is its area, in square meters?`,
      picture: sideMeter(d1, d2), answer: { frac: [n1 * n2, d1 * d2] },
      steps: [`Cut 1 square meter into ${d1} rows and ${d2} columns: ${d1 * d2} equal pieces.`, `The ${thing} covers ${n1} of the rows and ${n2} of the columns: ${n1 * n2} pieces.`, `So the area is ${f(n1 * n2, d1 * d2)} square meter.`] }
  } },
  { style: 'bare rectangle, side times side', make: r => {
    const { n1, d1, n2, d2 } = sides(r)
    return { text: 'What is the area of this rectangle, in square meters?', picture: { kind: 'grid', rows: 1, cols: 1, top: `${f(n2, d2)} m`, left: `${f(n1, d1)} m` },
      answer: { frac: [n1 * n2, d1 * d2] },
      steps: [`Area is side × side: ${f(n1, d1)} × ${f(n2, d2)}.`, `Tops: ${n1} × ${n2} = ${n1 * n2}. Bottoms: ${d1} × ${d2} = ${d1 * d2}.`, `So the area is ${f(n1 * n2, d1 * d2)} square meter.`] }
  } },
  { style: 'pick how to find the area (add trap)', make: r => {
    const { n1, d1, n2, d2 } = sides(r), s1 = f(n1, d1), s2 = f(n2, d2), right = `${s1} × ${s2}`
    return { text: 'Which one gives the area of this rectangle, in square meters?', picture: { kind: 'grid', rows: 1, cols: 1, top: `${s2} m`, left: `${s1} m` },
      answer: choose(r, right, [`${s1} + ${s2}`, `2 × ${s1} + 2 × ${s2}`]),
      steps: ['Area is how much floor is covered: side × side, even when the sides are fractions.', 'Adding the sides only tells how far it is along the edges.', `So the answer is ${right}.`] }
  } },
  { style: 'work backwards: the missing side', make: r => {
    const { n1, d1, n2, d2 } = sides(r), g = gcd(n1 * n2, d1 * d2), area = f(n1 * n2 / g, d1 * d2 / g)
    return { text: `A rug covers ${area} square meter. It is ${f(n1, d1)} meter wide. How long is it, in meters?`,
      picture: eq(`${f(n1, d1)} × ? = ${area}`), answer: { frac: [n2, d2] },
      steps: [`Area is side × side, so ${f(n1, d1)} × ? = ${area}.`, `Try ${f(n2, d2)}: tops ${n1} × ${n2} = ${n1 * n2}, bottoms ${d1} × ${d2} = ${d1 * d2}${g > 1 ? `, and ${f(n1 * n2, d1 * d2)} is the same as ${area}` : ''}.`, `So the rug is ${f(n2, d2)} meter long.`] }
  } },
]

// ── t5 · Times less than 1 makes it smaller ────────────────────────────────────────────────────────────────
/** A multiplier: less than 1, exactly 1 (d/d), or more than 1 (an improper fraction below 2). */
const multiplier = (r: Rng, kinds: readonly ('less' | 'one' | 'more')[]) => {
  const kind = pick(r, kinds)
  return until(() => { const d = int(r, 2, 6); return { kind, d, n: kind === 'less' ? int(r, 1, d - 1) : kind === 'one' ? d : int(r, d + 1, 2 * d - 1) } },
    x => x.kind === 'one' || gcd(x.n, x.d) === 1)
}
/** n/d shaded on whole bars of d parts (a second bar when n > d). */
const fracBars = (n: number, d: number): Picture => ({ kind: 'bars', bars: n <= d ? [{ parts: d, shaded: n }] : [{ parts: d, shaded: d }, { parts: d, shaded: n - d }] })
const WHY = { less: (n: number, d: number) => `${f(n, d)} is less than 1`, one: (n: number, d: number) => `${f(n, d)} is exactly 1 whole`, more: (n: number, d: number) => `${f(d, d)} is 1 whole, so ${f(n, d)} is more than 1` }

const T5: Level[] = [
  { style: 'is the fraction more or less than 1 (bars)', make: r => {
    const { kind, n, d } = multiplier(r, ['less', 'one', 'more'])
    const picture = fracBars(n, d)
    const right = { less: 'less than 1', one: 'equal to 1', more: 'more than 1' }[kind]
    return { text: `Is ${f(n, d)} more than 1, less than 1, or equal to 1? Each bar is 1 whole.`, picture,
      answer: { choices: ['more than 1', 'less than 1', 'equal to 1'], correct: ['more than 1', 'less than 1', 'equal to 1'].indexOf(right) },
      steps: [`${f(d, d)} fill 1 whole bar.`, n < d ? `${n} is fewer than ${d}, so ${f(n, d)} does not fill the bar.` : n === d ? `${n} is the same as ${d}, so ${f(n, d)} fills exactly 1 bar.` : `${n} is more than ${d}, so ${f(n, d)} fills 1 bar and more.`, `So the answer is ${right}.`] }
  } },
  { style: 'compare the product to the number, no working', make: r => {
    const { kind, n, d } = multiplier(r, ['less', 'more', 'one']), N = int(r, 4, 20)
    const choices = [`bigger than ${N}`, `smaller than ${N}`, `equal to ${N}`], right = choices[kind === 'more' ? 0 : kind === 'less' ? 1 : 2]
    return { text: `Without working it out: is ${f(n, d)} × ${N} bigger than ${N}, smaller than ${N}, or equal to ${N}?`, picture: fracBars(n, d), answer: { choices, correct: choices.indexOf(right) },
      steps: [`Look at the number you multiply by: ${f(n, d)}.`, `${WHY[kind](n, d)}.`, `So ${f(n, d)} × ${N} is ${right}.`] }
  } },
  { style: 'work it out, then check the size', make: r => {
    const { kind, n, d } = multiplier(r, ['less', 'more']), p = int(r, 2, 6), N = d * p, X = n * p
    return { text: `Work it out: what is ${f(n, d)} × ${N}?`, picture: tape(d, `${N}`), answer: X,
      steps: [`${N} ÷ ${d} = ${p}, so ${f(1, d)} of ${N} is ${p}.`, `${WHY[kind](n, d)}, so the answer must be ${kind === 'less' ? 'smaller' : 'bigger'} than ${N}.`, `${n} × ${p} = ${X}, so ${f(n, d)} × ${N} = ${X}.`] }
  } },
  { style: 'story, more or less (mixed numbers)', make: r => {
    const less = r() < 0.5, N = int(r, 4, 20)
    const d = int(r, 2, 5), n = int(r, 1, d - 1), w = int(r, 1, 2)
    const fr = less ? f(n, d) : `${w} ${f(n, d)}`
    const [lead, say, unit, how] = pick(r, [
      [`A puppy weighs ${N} pounds.`, 'The kitten weighs', 'pounds', (x: string) => `A kitten weighs ${x}${less ? '' : ' times'} as much as the puppy. Does the kitten weigh more than ${N} pounds, less than ${N} pounds, or exactly ${N} pounds?`],
      [`A recipe uses ${N} cups of flour.`, 'You use', 'cups', (x: string) => `You make ${x}${less ? ' of the recipe' : ' times the recipe'}. Will you use more than ${N} cups, less than ${N} cups, or exactly ${N} cups?`],
    ] as const)
    const choices = [`more than ${N} ${unit}`, `less than ${N} ${unit}`, `exactly ${N} ${unit}`], right = choices[less ? 1 : 0]
    return { text: `${lead} ${how(fr)}`, picture: tape(1, `${N} ${unit}`), answer: { choices, correct: choices.indexOf(right) },
      steps: [`${say} ${fr} × ${N} ${unit}.`, less ? `${fr} is less than 1, so it is only part of ${N}.` : `${fr} is more than 1, so it is all of ${N} and more.`, `So the answer is ${right}.`] }
  } },
  { style: 'which number goes in the box', make: r => {
    const want = pick(r, ['smaller', 'bigger', 'equal'] as const), N = int(r, 4, 20)
    const { p, q } = until(() => { const q = int(r, 3, 6); return { q, p: int(r, 2, q - 1) } }, x => gcd(x.p, x.q) === 1), k = int(r, 2, 6)
    const lessF = f(p, q), oneF = f(k, k), moreF = f(q, p)
    const right = want === 'smaller' ? lessF : want === 'bigger' ? moreF : oneF
    const phrase = want === 'equal' ? `equal to ${N}` : `${want} than ${N}`
    return { text: `? × ${N} is ${phrase}. Which number goes in the box?`, picture: eq(`? × ${N}`), answer: choose(r, right, [lessF, oneF, moreF].filter(x => x !== right)),
      steps: [want === 'smaller' ? 'To get less than you started with, multiply by a number less than 1.' : want === 'bigger' ? 'To get more than you started with, multiply by a number more than 1.' : 'To keep the number the same, multiply by exactly 1.',
        `${lessF} is less than 1, ${oneF} is exactly 1, and ${moreF} is more than 1.`, `So the answer is ${right}.`] }
  } },
]

// ── t6 · How many small pieces fit? ────────────────────────────────────────────────────────────────────────
const T6: Level[] = [
  { style: 'wholes cut into pieces, count them', make: r => {
    const N = int(r, 2, 5), d = int(r, 2, 6)
    const [whole, wholes2, use, ask] = pick(r, [
      ['yard', 'yards of ribbon', 'Each bow uses', 'How many bows can you make?'],
      ['cup', 'cups of rice', 'Each bowl gets', 'How many bowls can you fill?'],
    ] as const)
    return { text: `You have ${N} ${wholes2}. ${use} ${f(1, d)} ${whole}. ${ask} Each ${whole} is cut into pieces that size.`, picture: wholes(N, d), answer: N * d,
      steps: [`Each ${whole} holds ${d} pieces of ${f(1, d)}.`, `${N} ${whole}s with ${d} pieces each is ${N} × ${d}.`, `So ${N} ÷ ${f(1, d)} = ${N * d}.`] }
  } },
  { style: 'bare numbers', make: r => {
    const N = int(r, 2, 9), d = int(r, 2, 8)
    return { text: `Find ${N} ÷ ${f(1, d)}.`, picture: eq(`${N} ÷ ${f(1, d)} = ?`), answer: N * d,
      steps: [`Each whole holds ${d} pieces of ${f(1, d)}.`, `${N} wholes with ${d} pieces each is ${N} × ${d}.`, `So ${N} ÷ ${f(1, d)} = ${N * d}.`] }
  } },
  { style: 'pick the true one (smaller trap)', make: r => {
    const { N, d } = until(() => ({ N: int(r, 2, 9), d: int(r, 2, 8) }), x => distinct([x.N * x.d, x.N / x.d, x.N + x.d]))
    const ex = `${N} ÷ ${f(1, d)}`, right = `${ex} = ${N * d}`
    return { text: 'Which one is true?', picture: eq(ex), answer: choose(r, right, [`${ex} = ${f(N, d)}`, `${ex} = ${N + d}`]),
      steps: [`Dividing by ${f(1, d)} asks how many pieces of ${f(1, d)} fit in ${N}.`, `Each whole holds ${d}, so ${N} wholes hold ${N} × ${d} = ${N * d}. The answer is bigger than ${N}.`, `So the answer is ${right}.`] }
  } },
  { style: 'missing number', make: r => {
    const N = int(r, 2, 9), d = int(r, 2, 8), X = N * d
    if (r() < 0.5) return { text: `What number goes in the box? ? ÷ ${f(1, d)} = ${X}`, picture: eq(`? ÷ ${f(1, d)} = ${X}`), answer: N,
      steps: [`Each whole holds ${d} pieces of ${f(1, d)}.`, `${X} pieces make ${X} ÷ ${d} wholes.`, `So the missing number is ${N}.`] }
    return { text: `What number goes in the box? ${N} ÷ 1/? = ${X}`, picture: eq(`${N} ÷ 1/? = ${X}`), answer: d,
      steps: [`${X} pieces fit in ${N} wholes, so each whole holds ${X} ÷ ${N} = ${d} pieces.`, `${d} pieces in a whole means each piece is ${f(1, d)}.`, `So the missing number is ${d}.`] }
  } },
  { style: 'two-step story (some already used)', make: r => {
    const N = int(r, 2, 6), d = int(r, 3, 8), E = int(r, 2, N * d - 2), L = N * d - E
    const [things, per, used, ask] = pick(r, [
      ['pizzas', 'Each slice is', `A party eats ${E} slices.`, 'How many slices are left?'],
      ['sandwiches', 'Each piece is', `The team eats ${E} pieces.`, 'How many pieces are left?'],
    ] as const)
    return { text: `A shop cuts ${N} ${things} into pieces. ${per} ${f(1, d)} of one. ${used} ${ask}`, picture: wholes(N), answer: L,
      steps: [`First find all the pieces: ${N} ÷ ${f(1, d)} = ${N} × ${d} = ${N * d}.`, `Then take away the ${E} eaten: ${N * d} − ${E}.`, `So ${L} are left.`] }
  } },
]

// ── t7 · Share a small piece ───────────────────────────────────────────────────────────────────────────────
const T7: Level[] = [
  { style: 'shaded piece already cut for the friends', make: r => {
    const d = int(r, 2, 5), k = int(r, 2, 4)
    return { text: `${f(1, d)} of a pie is left. ${k} friends share it equally. The shaded piece is cut into ${k}. How much of the whole pie does each friend get?`, picture: piece(d, 1, k), answer: { frac: [1, d * k] },
      steps: [`The ${f(1, d)} is cut into ${k} equal pieces, one for each friend.`, `Give every part the same cuts. The whole pie has ${d} × ${k} = ${d * k} pieces.`, `So ${f(1, d)} ÷ ${k} = ${f(1, d * k)}.`] }
  } },
  { style: 'bare numbers', make: r => {
    const d = int(r, 2, 8), k = int(r, 2, 6)
    return { text: `Find ${f(1, d)} ÷ ${k}.`, picture: eq(`${f(1, d)} ÷ ${k} = ?`), answer: { frac: [1, d * k] },
      steps: [`Cut the ${f(1, d)} into ${k} equal pieces.`, `Give every ${d === 2 ? 'half' : 'part'} the same cuts. The whole has ${d} × ${k} = ${d * k} pieces.`, `So ${f(1, d)} ÷ ${k} = ${f(1, d * k)}.`] }
  } },
  { style: 'pick the true one (bigger trap)', make: r => {
    const { d, k } = until(() => ({ d: int(r, 2, 6), k: int(r, 2, 5) }), x => distinct([1 / (x.d * x.k), x.k / x.d, 1 / (x.d + x.k)]))
    const ex = `${f(1, d)} ÷ ${k}`, right = `${ex} = ${f(1, d * k)}`
    return { text: 'Which one is true?', picture: eq(ex), answer: choose(r, right, [`${ex} = ${f(k, d)}`, `${ex} = ${f(1, d + k)}`]),
      steps: [`Sharing ${f(1, d)} makes smaller pieces, so the answer is less than ${f(1, d)}.`, `Cut it into ${k}, and give the whole the same cuts: ${d} × ${k} = ${d * k} pieces.`, `So the answer is ${right}.`] }
  } },
  { style: 'missing number', make: r => {
    const d = int(r, 2, 6), k = int(r, 2, 5), Q = d * k
    if (r() < 0.5) return { text: `What number goes in the box? ${f(1, d)} ÷ ? = ${f(1, Q)}`, picture: eq(`${f(1, d)} ÷ ? = ${f(1, Q)}`), answer: k,
      steps: [`The whole ends up in ${Q} pieces, and it started in ${d} parts.`, `So each part was cut into ${Q} ÷ ${d} = ${k} pieces.`, `So the missing number is ${k}.`] }
    return { text: `What number goes in the box? 1/? ÷ ${k} = ${f(1, Q)}`, picture: eq(`1/? ÷ ${k} = ${f(1, Q)}`), answer: d,
      steps: [`Each part was cut into ${k}, and the whole ends up in ${Q} pieces.`, `So the whole had ${Q} ÷ ${k} = ${d} parts to start.`, `So the missing number is ${d}.`] }
  } },
  { style: 'two-step story (put shares together)', make: r => {
    const d = int(r, 2, 4), k = int(r, 3, 5), t = int(r, 2, k - 1), Q = d * k
    const [food, who] = pick(r, [['pizza', 'friends'], ['pan of cornbread', 'kids'], ['cake', 'cousins']] as const)
    return { text: `${f(1, d)} of a ${food} is left. ${k} ${who} share it equally. ${t} of the ${who} put their shares together. How much of the whole ${food} is that?`,
      picture: piece(d, 1), answer: { frac: [t, Q] },
      steps: [`Cut the ${f(1, d)} into ${k} equal pieces, and give the whole the same cuts: ${d} × ${k} = ${Q} pieces. Each share is ${f(1, Q)}.`, `${t} shares of ${f(1, Q)} are ${t} of those pieces.`, `So that is ${f(t, Q)} of the ${food}.`] }
  } },
]

// ── t8 · Times-and-share stories ───────────────────────────────────────────────────────────────────────────
const T8: Level[] = [
  { style: 'story: part of an amount (of means times)', make: r => {
    const { d, n } = proper(r, 2, 6), part = int(r, 1, 6), N = d * part, X = n * part
    const [what, ask, unit] = pick(r, [
      [`A trail is ${N} miles long. You walk ${f(n, d)} of it before lunch.`, 'How many miles do you walk before lunch?', 'miles'],
      [`A rope is ${N} feet long. You use ${f(n, d)} of it to tie up a tent.`, 'How many feet of rope do you use?', 'feet'],
    ] as const)
    return { text: `${what} ${ask}`, picture: tape(d, `${N} ${unit}`), answer: X,
      steps: [`The story takes part of ${N}, so find ${f(n, d)} of ${N}.`, `${N} ÷ ${d} = ${part}. Take ${n} parts: ${n} × ${part}.`, `So the answer is ${X}.`] }
  } },
  { style: 'story: how many pieces fit (divide)', make: r => {
    const N = int(r, 2, 8), d = int(r, 2, 5), X = N * d
    const [what, ask] = pick(r, [
      [`A board is ${N} feet long. You cut it into pieces that are each ${f(1, d)} foot long.`, 'How many pieces do you get?'],
      [`A path is ${N} miles long. Each lap is ${f(1, d)} mile.`, `How many ${f(1, d)}-mile laps is the path?`],
    ] as const)
    return { text: `${what} ${ask}`, picture: tape(N, `${N}`), answer: X,
      steps: [`The story counts how many ${f(1, d)} pieces fit, so divide: ${N} ÷ ${f(1, d)}.`, `Each whole holds ${d}, so ${N} wholes hold ${N} × ${d}.`, `So the answer is ${X}.`] }
  } },
  { style: 'pick the number sentence that fits the story', make: r => {
    if (r() < 0.5) {
      const N = int(r, 2, 8), d = int(r, 2, 5), right = `${N} ÷ ${f(1, d)}`
      return { text: `A ribbon is ${N} yards long. Each bow uses ${f(1, d)} yard. Which one tells how many bows you can make?`, picture: tape(N, 'ribbon'),
        answer: choose(r, right, [`${f(1, d)} × ${N}`, `${f(1, d)} ÷ ${N}`]),
        steps: ['The story counts how many pieces fit.', 'How many fit means divide the whole amount by the size of one piece.', `So the answer is ${right}.`] }
    }
    const { d, n } = proper(r, 3, 6, 2), N = d * int(r, 1, 5), right = `${f(n, d)} × ${N}`
    return { text: `A jar holds ${N} marbles. ${f(n, d)} of them are blue. Which one tells how many marbles are blue?`, picture: tape(d, 'marbles'),
      answer: choose(r, right, [`${N} ÷ ${f(n, d)}`, `${f(n, d)} ÷ ${N}`]),
      steps: ['The story takes part of an amount.', '"Of" in a story means multiply.', `So the answer is ${right}.`] }
  } },
  { style: 'story: share a piece (fraction answer)', make: r => {
    const d = int(r, 2, 4), k = int(r, 2, 5), Q = d * k
    const [what, ask, unit] = pick(r, [
      [`${f(1, d)} pound of cheese is shared equally by ${k} kids.`, 'How many pounds does each kid get?', 'pound'],
      [`A farmer has ${f(1, d)} acre of land. She splits it into ${k} equal gardens.`, 'What part of an acre is each garden?', 'acre'],
    ] as const)
    return { text: `${what} ${ask}`, picture: { kind: 'tape', rows: [{ cells: Array.from({ length: d }, (_, i) => ({ w: 1, shade: i === 0 })), brace: `1 ${unit}` }] }, answer: { frac: [1, Q] },
      steps: [`The story shares a piece, so divide: ${f(1, d)} ÷ ${k}.`, `Cut the ${f(1, d)} into ${k} and give every part the same cuts: ${d} × ${k} = ${Q} pieces.`, `So the answer is ${f(1, Q)} ${unit}.`] }
  } },
  { style: 'two-step story: use part, then count pieces that fit', make: r => {
    const { d, n, s, N, used, left, X } = until(() => {
      const { d, n } = proper(r, 2, 5), N = d * int(r, 1, 4), s = int(r, 2, 4), used = (n * N) / d, left = N - used
      return { d, n, s, N, used, left, X: left * s }
    }, x => x.X !== x.N)
    return { text: `A bag has ${N} cups of flour. You use ${f(n, d)} of it. You scoop the rest into ${f(1, s)}-cup scoops. How many scoops do you get?`,
      picture: tape(d, `${N} cups`), answer: X,
      steps: [`${f(n, d)} of ${N}: ${N} ÷ ${d} = ${N / d}, and ${n} × ${N / d} = ${used} cups are used. That leaves ${N} − ${used} = ${left} ${left === 1 ? 'cup' : 'cups'}.`, `Each cup holds ${s} scoops of ${f(1, s)} cup, so ${left} × ${s}.`, `So you get ${X} scoops.`] }
  } },
]

export const G5M3_LADDERS: Record<string, Level[]> = {
  'g5m3-t1': T1, 'g5m3-t2': T2, 'g5m3-t3': T3, 'g5m3-t4': T4, 'g5m3-t5': T5, 'g5m3-t6': T6, 'g5m3-t7': T7, 'g5m3-t8': T8,
}
