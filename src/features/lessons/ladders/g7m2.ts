/**
 * Grade 7 · Module 2 — Operations with rational numbers. Practice ladders, easiest style first (see ../adaptive.ts and
 * the reference ladders in ./g5m1.ts and ./g6m4.ts). Negatives are written with the "−" minus sign, as in the lessons.
 * ⚠️ The fraction answer box has no "−" key (AnswerInput), so a typed FRACTION answer is always positive here; negative
 * fractions only appear inside choices, and negative non-whole answers are decimals — the lesson's own rule for t7.
 */
import type { Picture, Problem } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

/** −3 → "−3" */
const m = (v: number) => fmt(v).replace('-', '−')
/** A second operand: negatives in brackets, as the lessons write them. */
const p = (v: number) => (v < 0 ? `(${m(v)})` : m(v))
const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const clean = (x: number) => Math.round(x * 1e6) / 1e6
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
const plural = (n: number, word: string) => `${fmt(n)} ${word}${n === 1 ? '' : 's'}`
/** A whole number from lo to hi in size, either sign. */
const signed = (r: Rng, lo: number, hi: number) => int(r, lo, hi) * (r() < 0.5 ? -1 : 1)
const choose = (r: Rng, right: string, wrong: string[]) => { const choices = shuffle(r, [right, ...wrong]); return { choices, correct: choices.indexOf(right) } }
const side = (v: number) => (v < 0 ? 'left' : 'right')
const signWord = (same: boolean) => (same ? 'Same signs give a positive answer.' : 'Different signs give a negative answer.')

type Pt = { at: number; label?: string }
/** A question line: only the two ends and 0 are labelled, so no tick can read the answer. */
const qline = (min: number, max: number, points?: Pt[]): Picture =>
  ({ kind: 'numline', min, max, ticks: max - min, points,
    labels: Array.from({ length: max - min + 1 }, (_, i) => { const v = min + i; return v === min || v === max || v === 0 ? m(v) : null }) })
const endsLine = (min: number, max: number, ticks: number, points?: Pt[]): Picture => ({ kind: 'numline', min, max, ticks, labels: 'ends', points })
const qfourths = (points: Pt[]): Picture =>
  ({ kind: 'numline', min: -1, max: 1, ticks: 8, labels: ['−1', null, null, null, '0', null, null, null, '1'], points })
const thermo = (value: number | null, min = -10, max = 10, labelEvery = 10): Picture =>
  ({ kind: 'measure', tool: 'thermometer', min, max, step: 1, labelEvery, value, unit: '°C' })

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
    let q = build(r)
    for (let i = 0; i < 200; i++) {
      const a = q.answer, s = shown(q.picture)
      const bad = typeof a === 'number' ? Math.abs(a) >= 10 && s.nums.has(String(Math.abs(a)))
        : a && typeof a === 'object' && 'choices' in a ? s.texts.some(t => t.includes(a.choices[a.correct])) : false
      if (!bad) return q
      q = build(r)
    }
    return q
  },
})

// ── t1 · Opposites ──────────────────────────────────────────────────────────────────────────────────────────
const T1: Level[] = [
  lv('opposite of a point on the line', r => {
    const n = signed(r, 1, 9)
    return { text: `What is the opposite of ${m(n)}?`, picture: qline(-10, 10, [{ at: n, label: m(n) }]), answer: -n,
      steps: [`${m(n)} is ${plural(Math.abs(n), 'step')} to the ${side(n)} of 0.`, `The opposite is the same number of steps to the ${side(-n)} of 0.`, `So the opposite of ${m(n)} is ${m(-n)}.`] }
  }),
  lv('pick the true sentence (spot the sign slip)', r => {
    const v = signed(r, 2, 30)
    const right = `The opposite of ${m(v)} is ${m(-v)}.`
    return { text: 'Which one is true?', picture: eq('opposite: same distance from 0, other side'),
      answer: choose(r, right, [`The opposite of ${m(v)} is ${m(v)}.`, `The opposite of ${m(v)} is 0.`, `${m(v)} and ${m(-v)} are different distances from 0.`]),
      steps: [`${m(v)} is ${Math.abs(v)} steps ${side(v)} of 0. Its opposite is ${Math.abs(v)} steps ${side(-v)} of 0.`, `So the true one is: ${right}`] }
  }),
  lv('flip the sign two or three times', r => {
    const n = signed(r, 1, 9), k = pick(r, [2, 3])
    if (k === 2) return { text: `What is the opposite of the opposite of ${m(n)}?`, picture: qline(-10, 10), answer: n,
      steps: [`The opposite of ${m(n)} is ${m(-n)}.`, `The opposite of ${m(-n)} is ${m(n)}. Two flips bring you back.`, `So the answer is ${m(n)}.`] }
    return { text: `What is the opposite of the opposite of the opposite of ${m(n)}?`, picture: qline(-10, 10), answer: -n,
      steps: [`The opposite of ${m(n)} is ${m(-n)}, and the opposite of ${m(-n)} is ${m(n)}.`, `One more flip: the opposite of ${m(n)} is ${m(-n)}.`, `So the answer is ${m(-n)}.`] }
  }),
  lv('work backwards: the number with a given opposite', r => {
    const v = signed(r, 11, 49)
    return { text: `The opposite of a number is ${m(v)}. What is the number?`, picture: endsLine(-50, 50, 10, [{ at: v }]), answer: -v,
      steps: ['Opposites are the same distance from 0, on different sides.', `${m(v)} is ${Math.abs(v)} steps ${side(v)} of 0, so the number is ${Math.abs(v)} steps ${side(-v)} of 0.`, `So the number is ${m(-v)}.`] }
  }),
  lv('story: above and below the water', r => {
    const d = int(r, 11, 55)
    const [up, down] = pick(r, [['kite', 'crab'], ['bird', 'fish'], ['drone', 'turtle']] as const)
    if (r() < 0.5) return { text: `A ${up} is ${d} feet above the water. A ${down} is the same distance below the water. What number shows where the ${down} is?`,
      picture: endsLine(-60, 60, 12, [{ at: d, label: up }]), answer: -d,
      steps: [`The water is 0. The ${up} is at ${d}.`, `The ${down} is the same distance on the other side of 0, below the water.`, `So the ${down} is at ${m(-d)}.`] }
    return { text: `A ${down} is ${d} feet below the water, at ${m(-d)}. A ${up} is the same distance above the water. How many feet apart are they?`,
      picture: endsLine(-60, 60, 12, [{ at: -d, label: down }]), answer: 2 * d,
      steps: [`The water is 0. The ${up} is the same distance above it, at ${d}.`, `From ${m(-d)} up to 0 is ${d} feet, and from 0 up to ${d} is ${d} more.`, `So they are ${d} + ${d} = ${2 * d} feet apart.`] }
  }),
]

// ── t2 · Absolute value ─────────────────────────────────────────────────────────────────────────────────────
const SAME = 'They are the same distance'
const T2: Level[] = [
  lv('bars with the point on the line', r => {
    const n = signed(r, 1, 9), k = Math.abs(n)
    return { text: `What is |${m(n)}|?`, picture: qline(-10, 10, [{ at: n, label: m(n) }]), answer: k,
      steps: [`The bars ask how far ${m(n)} is from 0.`, `Count the steps from ${m(n)} to 0: there ${k === 1 ? 'is 1' : `are ${k}`}.`, `So |${m(n)}| = ${k}.`] }
  }),
  lv('which is farther from 0', r => {
    const a = signed(r, 2, 9)
    let b = -a
    if (r() >= 0.25) { b = signed(r, 2, 9); while (Math.abs(b) === Math.abs(a)) b = signed(r, 2, 9) }
    const [A, B] = [Math.abs(a), Math.abs(b)]
    const right = A === B ? SAME : m(A > B ? a : b)
    return { text: `Which is farther from 0: ${m(a)} or ${m(b)}?`, picture: qline(-10, 10, [{ at: a }, { at: b }]),
      answer: choose(r, right, [m(a), m(b), SAME].filter(c => c !== right)),
      steps: [`${m(a)} is ${A} steps from 0, and ${m(b)} is ${B} steps from 0.`,
        A === B ? `${A} steps and ${B} steps are equal. ${SAME}.` : `${Math.max(A, B)} steps is farther, so the answer is ${right}.`] }
  }),
  lv('both numbers at a given distance', r => {
    const d = int(r, 3, 25)
    const right = `${m(-d)} and ${d}`
    return { text: `Which two numbers are both ${d} steps from 0?`, picture: endsLine(-50, 50, 10),
      answer: choose(r, right, [`${m(-d)} and 0`, `${d} and ${2 * d}`, `${m(-2 * d)} and ${2 * d}`]),
      steps: [`A number ${d} steps from 0 is ${d} steps to the right or ${d} steps to the left.`, `That is ${d} or ${m(-d)}.`, `So the answer is ${right}.`] }
  }),
  lv('bars first, then add or take away', r => {
    let a = signed(r, 2, 20), b = signed(r, 2, 20)
    const add = r() < 0.5
    if (!add) { while (Math.abs(a) === Math.abs(b)) b = signed(r, 2, 20); if (Math.abs(a) < Math.abs(b)) [a, b] = [b, a] }
    const [A, B] = [Math.abs(a), Math.abs(b)], op = add ? '+' : '−', ans = add ? A + B : A - B
    const expr = `|${m(a)}| ${op} |${m(b)}|`
    return { text: `Work it out. ${expr} = ?`, picture: eq(`${expr} = ?`), answer: ans,
      steps: [`|${m(a)}| = ${A} and |${m(b)}| = ${B}.`, `So ${A} ${op} ${B} = ${ans}.`] }
  }),
  lv('story: how far from the surface', r => {
    if (r() < 0.5) {
      const a = int(r, 2, 28), b = int(r, 2, 28)
      return { text: `The surface of a lake is 0. A diver is at ${m(-a)} meters, and a bird flies at ${b} meters. How many meters apart are they?`,
        picture: endsLine(-30, 30, 6, [{ at: -a, label: 'diver' }, { at: b, label: 'bird' }]), answer: a + b,
        steps: [`The diver is |${m(-a)}| = ${a} meters from the surface.`, `The bird is ${b} meters from the surface, on the other side.`, `So they are ${a} + ${b} = ${a + b} meters apart.`] }
    }
    const a = int(r, 2, 28)
    let b = int(r, 2, 28)
    while (b === a) b = int(r, 2, 28)
    const [hi, lo] = [Math.max(a, b), Math.min(a, b)]
    return { text: `The surface of a lake is 0. Ana dives to ${m(-a)} meters and Ben dives to ${m(-b)} meters. How many meters farther from the surface is the deeper diver?`,
      picture: endsLine(-30, 0, 6, [{ at: -a, label: 'Ana' }, { at: -b, label: 'Ben' }]), answer: hi - lo,
      steps: [`|${m(-a)}| = ${a} and |${m(-b)}| = ${b}.`, `The deeper diver is ${hi} meters down, the other ${lo} meters.`, `So the deeper diver is ${hi} − ${lo} = ${hi - lo} meters farther.`] }
  }),
]

// ── t3 · Add positive and negative numbers ──────────────────────────────────────────────────────────────────
/** Steps for adding two integers with the counters idea. */
const addSteps = (a: number, b: number, expr: string): string[] => {
  const s = a + b
  if (a < 0 && b < 0) return ['Both numbers are negative, so there are no pairs to take away.',
    `${plural(-a, 'minus counter')} and ${fmt(-b)} more make ${plural(-s, 'minus counter')}.`, `So ${expr} = ${m(s)}.`]
  if (a > 0 && b > 0) return [`Both numbers are positive: ${a} + ${b} = ${s}.`, `So ${expr} = ${m(s)}.`]
  const small = Math.min(Math.abs(a), Math.abs(b)), big = Math.max(Math.abs(a), Math.abs(b))
  const kind = s > 0 ? 'plus' : 'minus'
  return [`Make ${plural(small, 'zero pair')}: each one is a plus counter with a minus counter.`,
    `Take the pairs away. ${big} − ${small} = ${plural(big - small, `${kind} counter`)} ${big - small === 1 ? 'is' : 'are'} left.`, `So ${expr} = ${m(s)}.`]
}
const T3: Level[] = [
  lv('counters: pair them and count what is left', r => {
    const a = int(r, 1, 9)
    let b = int(r, 1, 9)
    while (b === a) b = int(r, 1, 9)
    const [x, y] = r() < 0.5 ? [a, -b] : [-b, a]
    const expr = `${m(x)} + ${p(y)}`
    return { text: `Add. ${expr} = ?`, picture: { kind: 'chips', pos: a, neg: b }, answer: a - b, steps: addSteps(x, y, expr) }
  }),
  lv('bare: add without counters', r => {
    let a = signed(r, 2, 30), b = signed(r, 2, 30)
    while ((a > 0 && b > 0) || a + b === 0) { a = signed(r, 2, 30); b = signed(r, 2, 30) }
    const expr = `${m(a)} + ${p(b)}`
    return { text: `Add. ${expr} = ?`, picture: eq(`${expr} = ?`), answer: a + b, steps: addSteps(a, b, expr) }
  }),
  lv('spot the mistake: which sum is right', r => {
    const x = int(r, 2, 15)
    let y = int(r, 2, 15)
    while (y === x) y = int(r, 2, 15)
    const [a, b] = r() < 0.5 ? [x, -y] : [-y, x]
    const expr = `${m(a)} + ${p(b)}`, s = a + b
    const right = `${expr} = ${m(s)}`
    return { text: `Three students added ${expr}. Only one of them is right. Which one?`, picture: eq('Which one is right?'),
      answer: choose(r, right, [`${expr} = ${m(-s)}`, `${expr} = ${x + y}`]),
      steps: [...addSteps(a, b, expr).slice(0, -1), `So the right one is ${right}.`] }
  }),
  lv('missing number: what was added', r => {
    const a = signed(r, 1, 12)
    let s = signed(r, 1, 12)
    while (s === a) s = signed(r, 1, 12)
    const miss = s - a, dir = miss > 0 ? 'right' : 'left'
    return { text: `What number goes in the box? ${m(a)} + ? = ${m(s)}`, picture: eq(`${m(a)} + ? = ${m(s)}`), answer: miss,
      steps: [`Start at ${m(a)}. To land on ${m(s)} you move ${plural(Math.abs(miss), 'step')} to the ${dir}.`,
        `Moving ${dir} means adding a ${miss > 0 ? 'positive' : 'negative'} number.`, `Check: ${m(a)} + ${p(miss)} = ${m(s)}. The missing number is ${m(miss)}.`] }
  }),
  lv('story: a score over three rounds', r => {
    let c: number[] = []
    do c = [signed(r, 2, 15), signed(r, 2, 15), signed(r, 2, 15)]
    while (c.every(x => x > 0) || c.every(x => x < 0) || c[0] + c[1] + c[2] === 0 || c[0] + c[1] === 0)
    const say = (v: number) => (v > 0 ? `win ${v} points` : `lose ${-v} points`)
    const t1 = c[0] + c[1], total = t1 + c[2]
    return { text: `In a game you start with 0 points. You ${say(c[0])}, then ${say(c[1])}, then ${say(c[2])}. What is your score now?`,
      picture: { kind: 'table', head: ['Round 1', 'Round 2', 'Round 3', 'Score'], rows: [[...c.map(v => (v > 0 ? `+${v}` : m(v))), '?']] },
      answer: total,
      steps: [`Add the rounds in order: ${m(c[0])} + ${p(c[1])} = ${m(t1)}.`, `Then ${m(t1)} + ${p(c[2])} = ${m(total)}.`, `So your score is ${m(total)}.`] }
  }),
]

// ── t4 · Subtract by adding the opposite ────────────────────────────────────────────────────────────────────
const T4: Level[] = [
  lv('number line: change it to adding, then move', r => {
    let a = 0, b = 0, res = 0
    do { a = int(r, -9, 9); b = signed(r, 1, 9); res = a - b } while (res < -9 || res > 9)
    const expr = `${m(a)} − ${p(b)}`
    return { text: `Take away. ${expr} = ?`, picture: qline(-10, 10, [{ at: a, label: 'start' }]), answer: res,
      steps: [`Change it to adding the opposite: ${m(a)} + ${p(-b)}.`, `Start at ${m(a)} and move ${plural(Math.abs(b), 'step')} to the ${b > 0 ? 'left' : 'right'}.`, `So ${expr} = ${m(res)}.`] }
  }),
  lv('pick the adding that means the same', r => {
    const a = signed(r, 2, 20)
    let b = signed(r, 2, 20)
    while (Math.abs(b) === Math.abs(a)) b = signed(r, 2, 20)
    const expr = `${m(a)} − ${p(b)}`, right = `${m(a)} + ${p(-b)}`
    return { text: `Which one means the same as ${expr}?`, picture: eq(expr),
      answer: choose(r, right, [`${m(a)} + ${p(b)}`, `${m(-a)} + ${p(-b)}`, `${m(-a)} + ${p(b)}`]),
      steps: ['Change − to +.', `Change ${m(b)} to its opposite, ${m(-b)}.`, `So ${expr} means the same as ${right}.`] }
  }),
  lv('bare: take away bigger numbers', r => {
    let a = 0, b = 0
    do { a = signed(r, 2, 40); b = signed(r, 2, 40) } while ((a > 0 && b > 0) || a === b)
    const c = -b, res = a + c, expr = `${m(a)} − ${p(b)}`
    const mid = (a < 0) === (c < 0)
      ? `Both are ${a < 0 ? 'negative' : 'positive'}, so ${Math.abs(a)} + ${Math.abs(c)} = ${Math.abs(res)}${a < 0 ? ', and the answer stays left of 0' : ''}.`
      : `The signs are different: ${Math.max(Math.abs(a), Math.abs(c))} − ${Math.min(Math.abs(a), Math.abs(c))} = ${Math.abs(res)}, and the answer is ${res < 0 ? 'negative' : 'positive'}.`
    return { text: `Take away. ${expr} = ?`, picture: eq(`${expr} = ?`), answer: res,
      steps: [`Change it to adding the opposite: ${m(a)} + ${p(c)}.`, mid, `So ${expr} = ${m(res)}.`] }
  }),
  lv('missing number: what was taken away', r => {
    const a = signed(r, 1, 12)
    let res = signed(r, 1, 12)
    while (res === a) res = signed(r, 1, 12)
    const b = a - res, move = res - a
    return { text: `What number goes in the box? ${m(a)} − ? = ${m(res)}`, picture: eq(`${m(a)} − ? = ${m(res)}`), answer: b,
      steps: [`Taking away the box is adding its opposite. From ${m(a)} to ${m(res)} you move ${plural(Math.abs(move), 'step')} to the ${move > 0 ? 'right' : 'left'}.`,
        `So the opposite of the box is ${m(move)}, and the box is ${m(b)}.`, `Check: ${m(a)} − ${p(b)} = ${m(res)}. The missing number is ${m(b)}.`] }
  }),
  lv('story: how far apart two readings are', r => {
    if (r() < 0.5) {
      const hi = int(r, -5, 15), lo = int(r, -15, -1)
      if (hi <= lo) return T4[4].make(r)
      return { text: `At noon it was ${m(hi)} °C. By midnight it was ${m(lo)} °C. How many degrees did the temperature drop?`,
        picture: endsLine(-20, 20, 8, [{ at: hi, label: 'noon' }, { at: lo, label: 'midnight' }]), answer: hi - lo,
        steps: [`The drop is ${m(hi)} − ${p(lo)}.`, `Add the opposite: ${m(hi)} + ${-lo}.`, `So it dropped ${hi - lo} degrees.`] }
    }
    const h = int(r, 10, 60), d = int(r, 5, 40)
    return { text: `A hilltop is ${h} meters above sea level. The bottom of a lake is ${d} meters below sea level. How many meters higher is the hilltop?`,
      picture: endsLine(-50, 60, 11, [{ at: h, label: 'hilltop' }, { at: -d, label: 'lake bottom' }]), answer: h + d,
      steps: [`Sea level is 0, so write it as ${h} − ${p(-d)}.`, `Add the opposite: ${h} + ${d}.`, `So the hilltop is ${h + d} meters higher.`] }
  }),
]

// ── t5 · Multiply signed numbers ────────────────────────────────────────────────────────────────────────────
/** Three statements with the same sizes and different signs; only `k` has the right sign. */
const signSlip = (r: Rng, x: number, y: number, op: '×' | '÷', result: number) => {
  const combos: [number, number][] = [[-1, -1], [1, -1], [-1, 1]]
  const k = int(r, 0, 2)
  const lines = combos.map(([sx, sy], i) => {
    const same = sx === sy, v = same ? result : -result
    return `${m(sx * x)} ${op} ${p(sy * y)} = ${m(i === k ? v : -v)}`
  })
  return { right: lines[k], wrong: lines.filter((_, i) => i !== k) }
}
const T5: Level[] = [
  lv('continue the sign pattern', r => {
    const a = signed(r, 2, 9)
    const heads = [2, 1, 0, -1, -2, -3].map(k => `${m(a)} × ${p(k)}`)
    return { text: 'Look at the pattern. Each answer changes by the same amount. What number goes where the ? is?',
      picture: { kind: 'table', head: heads, rows: [[m(2 * a), m(a), '0', m(-a), m(-2 * a), '?']] }, answer: -3 * a,
      steps: [`Each time the second number goes down by 1, the answer goes ${a > 0 ? 'down' : 'up'} by ${Math.abs(a)}.`,
        `After ${m(-2 * a)} comes ${m(-2 * a)} ${a > 0 ? '−' : '+'} ${Math.abs(a)}.`, `So ${m(a)} × (−3) = ${m(-3 * a)}.`] }
  }),
  lv('bare: multiply, then the signs', r => {
    let a = 0, b = 0
    do { a = signed(r, 2, 12); b = signed(r, 2, 12) } while (a > 0 && b > 0)
    const expr = `${m(a)} × ${p(b)}`
    return { text: `Multiply. ${expr} = ?`, picture: eq(`${expr} = ?`), answer: a * b,
      steps: [`Multiply the numbers: ${Math.abs(a)} × ${Math.abs(b)} = ${Math.abs(a * b)}.`, signWord((a < 0) === (b < 0)), `So ${expr} = ${m(a * b)}.`] }
  }),
  lv('spot the sign slip: which product is right', r => {
    const x = int(r, 2, 12), y = int(r, 2, 12)
    const { right, wrong } = signSlip(r, x, y, '×', x * y)
    return { text: 'Only one of these is right. Which one?', picture: eq('Check the signs.'), answer: choose(r, right, wrong),
      steps: [`${x} × ${y} = ${x * y}, so each answer should be ${x * y} or ${m(-x * y)}.`, 'Same signs give a positive answer, and different signs give a negative answer.', `So the right one is ${right}.`] }
  }),
  lv('three numbers multiplied', r => {
    let a = 0, b = 0, c = 0
    do { a = signed(r, 2, 6); b = signed(r, 2, 6); c = signed(r, 2, 6) } while (a > 0 && b > 0 && c > 0)
    const ab = a * b, abc = ab * c, expr = `${m(a)} × ${p(b)} × ${p(c)}`
    const same = (u: number, v: number) => ((u < 0) === (v < 0) ? 'the same' : 'different')
    return { text: `Multiply. ${expr} = ?`, picture: eq(`${expr} = ?`), answer: abc,
      steps: [`First, ${m(a)} × ${p(b)} = ${m(ab)}, because the signs are ${same(a, b)}.`,
        `Then ${m(ab)} × ${p(c)}: ${Math.abs(ab)} × ${Math.abs(c)} = ${Math.abs(abc)}, and the signs are ${same(ab, c)}.`, `So ${expr} = ${m(abc)}.`] }
  }),
  lv('story: the same change many times', r => {
    if (r() < 0.5) {
      const d = int(r, 2, 9), n = int(r, 3, 9)
      return { text: `A diver goes down ${d} meters every minute, so her change each minute is ${m(-d)} meters. What is her total change after ${n} minutes, in meters?`,
        picture: endsLine(-90, 0, 9), answer: -d * n,
        steps: [`Her total change is ${n} × ${p(-d)}.`, `${n} × ${d} = ${n * d}, and different signs give a negative answer.`, `So her total change is ${m(-d * n)} meters.`] }
    }
    const s = int(r, 2, 12), d = int(r, 2, 6), n = int(r, 2, 6), ans = s - d * n
    return { text: `It is ${s} °C at 6 p.m. The temperature drops ${d} degrees every hour for ${n} hours. What is the temperature then, in °C?`,
      picture: thermo(s, -40, 20, 10), answer: ans,
      steps: [`Each hour the change is ${m(-d)}, so ${n} hours is ${n} × ${p(-d)} = ${m(-d * n)}.`, `Now add it to the start: ${s} + ${p(-d * n)}.`, `So it is ${m(ans)} °C.`] }
  }),
]

// ── t6 · Divide signed numbers ──────────────────────────────────────────────────────────────────────────────
const T6: Level[] = [
  lv('undo a multiplication', r => {
    const b = signed(r, 2, 9), q = signed(r, 2, 9), a = b * q
    return { text: `Divide. ${m(a)} ÷ ${p(b)} = ?`,
      picture: { kind: 'table', head: ['Divide', 'Check by multiplying'], rows: [[`${m(a)} ÷ ${p(b)} = ?`, `${m(b)} × ? = ${m(a)}`]] }, answer: q,
      steps: [`Turn it around: what do you multiply by ${m(b)} to get ${m(a)}?`, `${m(b)} × ${p(q)} = ${m(a)}.`, `So ${m(a)} ÷ ${p(b)} = ${m(q)}.`] }
  }),
  lv('bare: divide, then the signs', r => {
    let b = 0, q = 0
    do { b = signed(r, 2, 12); q = signed(r, 2, 15) } while (b * q > 0 && b > 0)
    const a = b * q, expr = `${m(a)} ÷ ${p(b)}`
    return { text: `Divide. ${expr} = ?`, picture: eq(`${expr} = ?`), answer: q,
      steps: [`Divide the numbers: ${Math.abs(a)} ÷ ${Math.abs(b)} = ${Math.abs(q)}.`, signWord((a < 0) === (b < 0)), `So ${expr} = ${m(q)}.`] }
  }),
  lv('spot the sign slip: which quotient is right', r => {
    const y = int(r, 2, 12), q = int(r, 2, 12)
    const { right, wrong } = signSlip(r, y * q, y, '÷', q)
    return { text: 'Only one of these divisions is right. Which one?', picture: eq('Check the signs.'), answer: choose(r, right, wrong),
      steps: [`${y * q} ÷ ${y} = ${q}, so each answer should be ${q} or ${m(-q)}.`, 'Same signs give a positive answer, and different signs give a negative answer.', `So the right one is ${right}.`] }
  }),
  lv('missing number: work backwards', r => {
    const b = signed(r, 2, 9), q = signed(r, 2, 9), a = b * q
    const sameSign = (u: number, v: number) => (u < 0) === (v < 0)
    if (r() < 0.5) return { text: `What number goes in the box? ? ÷ ${p(b)} = ${m(q)}`, picture: eq(`? ÷ ${p(b)} = ${m(q)}`), answer: a,
      steps: [`Dividing undoes multiplying, so the box is ${m(q)} × ${p(b)}.`,
        `${Math.abs(q)} × ${Math.abs(b)} = ${Math.abs(a)}, and the signs are ${sameSign(q, b) ? 'the same, so it is positive' : 'different, so it is negative'}.`, `So the missing number is ${m(a)}.`] }
    return { text: `What number goes in the box? ${m(a)} ÷ ? = ${m(q)}`, picture: eq(`${m(a)} ÷ ? = ${m(q)}`), answer: b,
      steps: [`Turn it around: ${m(q)} × ? = ${m(a)}.`,
        `${Math.abs(a)} ÷ ${Math.abs(q)} = ${Math.abs(b)}, and ${m(a)} and ${m(q)} have ${sameSign(a, q) ? 'the same sign, so it is positive' : 'different signs, so it is negative'}.`, `So the missing number is ${m(b)}.`] }
  }),
  lv('story: share a change equally, then use it', r => {
    const n = int(r, 3, 9), each = int(r, 2, 12), t = n * each
    if (r() < 0.5) {
      const [thing, unit, per] = pick(r, [['A hot-air balloon comes down', 'meters', 'minute'], ['A submarine dives down', 'meters', 'minute'], ['The water in a pool drops', 'inches', 'week']] as const)
      return { text: `${thing} ${t} ${unit} in ${n} ${per}s, the same amount each ${per}. Its change is ${m(-t)} ${unit}. What is its change each ${per}, in ${unit}?`,
        picture: { kind: 'table', head: ['Total change', `${per[0].toUpperCase()}${per.slice(1)}s`, `Each ${per}`], rows: [[m(-t), String(n), '?']] }, answer: -each,
        steps: [`The change each ${per} is ${m(-t)} ÷ ${n}.`, `${t} ÷ ${n} = ${each}, and different signs give a negative answer.`, `So its change is ${m(-each)} ${unit} each ${per}.`] }
    }
    let k = int(r, 2, 9)
    while (k === n) k = int(r, 2, 9)
    return { text: `A submarine dives from 0 to ${m(-t)} meters in ${n} minutes, going down the same amount each minute. Where is it after ${k} minutes, in meters?`,
      picture: endsLine(-120, 0, 12, [{ at: -t, label: 'end' }]), answer: -each * k,
      steps: [`Each minute its change is ${m(-t)} ÷ ${n} = ${m(-each)}.`, `After ${k} minutes the change is ${k} × ${p(-each)} = ${m(-each * k)}.`, `Starting from 0, it is at ${m(-each * k)} meters.`] }
  }),
]

// ── t7 · Negative fractions and decimals ────────────────────────────────────────────────────────────────────
/** n/d in lowest terms with the minus sign: −2/4 → "−1/2", 4/4 → "1". */
const frac = (n: number, d: number) => { const g = gcd(Math.abs(n), d); return d / g === 1 ? m(n / g) : `${m(n / g)}/${d / g}` }
const T7: Level[] = [
  lv('fourths line: jump right from a negative fraction', r => {
    let s = 0, res = 0
    do { s = int(r, -4, -1); res = int(r, 1, 3) } while (res - s > 4)
    const k = res - s
    const sStr = frac(s, 4), kStr = frac(k, 4), g = gcd(res, 4)
    return { text: `Add. ${sStr} + ${kStr} = ?`, picture: qfourths([{ at: s / 4, label: sStr }]), answer: { frac: [res / g, 4 / g] },
      steps: [`In fourths, that is ${m(s)}/4 + ${k}/4.`, `Start at ${sStr} and jump ${plural(k, 'fourth')} to the right.`, `So ${sStr} + ${kStr} = ${frac(res, 4)}.`] }
  }),
  lv('decimal line: add with a negative decimal', r => {
    let a = 0, b = 0
    do { a = -int(r, 1, 19) / 4; b = signed(r, 1, 12) / 4 } while (a + b === 0)
    const res = clean(a + b), expr = `${m(a)} + ${p(b)}`
    const mid = b < 0
      ? ['Both numbers are negative, so you move left both times.', `${m(-a)} + ${m(-b)} = ${m(-res)}, and the answer stays left of 0.`]
      : [`The signs are different, so take the smaller size from the bigger: ${m(Math.max(-a, b))} − ${m(Math.min(-a, b))} = ${m(Math.abs(res))}.`,
        `The ${-a > b ? 'negative' : 'positive'} number is farther from 0, so the answer is ${res < 0 ? 'negative' : 'positive'}.`]
    return { text: `Add. ${expr} = ?`, picture: endsLine(-8, 4, 12, [{ at: a, label: m(a) }]), answer: res, steps: [...mid, `So ${expr} = ${m(res)}.`] }
  }),
  lv('multiply a decimal, then the signs', r => {
    let a = 0, b = 0
    do { a = pick(r, [0.25, 0.5, 0.75, 1.25, 1.5, 2.5]) * (r() < 0.5 ? -1 : 1); b = signed(r, 2, 8) } while (a > 0 && b > 0)
    const ab = clean(a * b), expr = `${m(a)} × ${p(b)}`
    return { text: `Multiply. ${expr} = ?`, picture: eq(`${expr} = ?`), answer: ab,
      steps: [`${m(Math.abs(a))} × ${Math.abs(b)} = ${m(Math.abs(ab))}.`, signWord((a < 0) === (b < 0)), `So ${expr} = ${m(ab)}.`] }
  }),
  lv('pick the true one: multiply negative fractions', r => {
    const F = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [1, 5]] as const
    const [a, b] = pick(r, F), [c, d] = pick(r, F)
    const combos: [number, number][] = [[-1, -1], [1, -1], [-1, 1]], k = int(r, 0, 2)
    const lines = combos.map(([sx, sy], i) => {
      const v = sx * sy * (i === k ? 1 : -1)
      const y = frac(sy * c, d)
      return `${frac(sx * a, b)} × ${sy < 0 ? `(${y})` : y} = ${frac(v * a * c, b * d)}`
    })
    const right = lines[k], g = gcd(a * c, b * d)
    return { text: 'Only one of these is right. Which one?', picture: eq('Keep the minus sign all the way through.'),
      answer: choose(r, right, lines.filter((_, i) => i !== k)),
      steps: [`Multiply the tops and the bottoms: ${a} × ${c} = ${a * c} and ${b} × ${d} = ${b * d}, so ${a * c}/${b * d}${g > 1 ? `, which is ${frac(a * c, b * d)}` : ''}.`,
        'Same signs give a positive answer, and different signs give a negative answer.', `So the right one is ${right}.`] }
  }),
  lv('story: a decimal change, repeated', r => {
    const d = pick(r, [0.25, 0.5, 0.75, 1.25, 1.5]), n = int(r, 2, 6), dn = clean(d * n)
    if (r() < 0.5) return { text: `The water in a tank drops ${m(d)} meters each week, so each week the change is ${m(-d)} meters. What is the total change after ${n} weeks, in meters?`,
      picture: endsLine(-10, 0, 10), answer: -dn,
      steps: [`The total change is ${n} × ${p(-d)}.`, `${n} × ${m(d)} = ${m(dn)}, and different signs give a negative answer.`, `So the total change is ${m(-dn)} meters.`] }
    const s = -int(r, 1, 6) / 2, ans = clean(s - dn)
    return { text: `A diver is at ${m(s)} meters. She goes down ${m(d)} meters each minute for ${n} minutes. Where is she then, in meters?`,
      picture: endsLine(-15, 0, 15, [{ at: s, label: 'start' }]), answer: ans,
      steps: [`Each minute the change is ${m(-d)}, so ${n} minutes is ${n} × ${p(-d)} = ${m(-dn)}.`, `Now add it to where she started: ${m(s)} + ${p(-dn)}.`, `So she is at ${m(ans)} meters.`] }
  }),
]

// ── t8 · Signed number stories ──────────────────────────────────────────────────────────────────────────────
const T8: Level[] = [
  lv('thermometer: warmer or colder', r => {
    let s = 0, d = 0, warm = true, res = 0
    do { s = int(r, -9, 9); d = int(r, 2, 12); warm = r() < 0.5; res = warm ? s + d : s - d } while (res < -10 || res > 10)
    const up = warm ? 'up' : 'down'
    const crosses = (s < 0 && res > 0) || (s > 0 && res < 0)
    return { text: `It is ${m(s)} °C. It gets ${d} degrees ${warm ? 'warmer' : 'colder'}. What is the temperature now, in °C?`, picture: thermo(s), answer: res,
      steps: [`${warm ? 'Warmer means up' : 'Colder means down'}, so write ${m(s)} ${warm ? '+' : '−'} ${d}.`,
        crosses ? `Go ${up} ${plural(Math.abs(s), 'degree')} to reach 0. That leaves ${d - Math.abs(s)} more to go ${up}.` : `Go ${up} ${d} degrees from ${m(s)}.`,
        `So it is ${m(res)} °C.`] }
  }),
  lv('pick the math that matches the story', r => {
    const a = signed(r, 2, 20)
    let d = int(r, 2, 20)
    while (d === Math.abs(a)) d = int(r, 2, 20)
    const up = r() < 0.5
    const [story, word] = pick(r, [
      [`It is ${m(a)} °C. It gets ${d} degrees ${up ? 'warmer' : 'colder'}. Which math finds the temperature now?`, up ? 'Warmer' : 'Colder'],
      [`A hiker is at ${m(a)} meters. She ${up ? 'climbs up' : 'walks down'} ${d} meters. Which math finds her elevation now?`, up ? 'Climbing up' : 'Walking down'],
      [`A game score is ${m(a)} points. Then the player ${up ? 'wins' : 'loses'} ${d} points. Which math finds the score now?`, up ? 'Winning' : 'Losing'],
    ] as const)
    const right = `${m(a)} ${up ? '+' : '−'} ${d}`
    return { text: story, picture: { kind: 'table', head: ['Start', 'Change', 'Now'], rows: [[m(a), '?', '?']] },
      answer: choose(r, right, [`${m(a)} ${up ? '−' : '+'} ${d}`, `${m(-a)} + ${d}`, `${m(-a)} − ${d}`]),
      steps: [`${word} means ${up ? 'up, so the change is positive' : 'down, so the change is negative'}.`, `Start at ${m(a)}, keep its sign, and ${up ? 'add' : 'take away'} ${d}.`, `So the math is ${right}.`] }
  }),
  lv('money: a balance after two changes', r => {
    const s = int(r, 5, 40), x = int(r, 10, 60), y = int(r, 5, 40)
    const name = pick(r, ['Sam', 'Mia', 'Leo', 'Ana'])
    const mid = s - x, ans = mid + y
    if (ans === 0) return T8[2].make(r)
    return { text: `${name} has $${s} in the bank, spends $${x}, and later puts in $${y}. What is the balance now, in dollars?`,
      picture: { kind: 'table', head: ['Start', 'Spend', 'Put in', 'Now'], rows: [[`$${s}`, `−$${x}`, `+$${y}`, '?']] }, answer: ans,
      steps: [`Spending is money lost: ${s} − ${x} = ${m(mid)}.`, `Putting in is money gained: ${m(mid)} + ${y} = ${m(ans)}.`, `So the balance is ${m(ans)} dollars.`] }
  }),
  lv('work backwards: find the start', r => {
    let e = 0, d = 0, colder = true, start = 0
    do { e = int(r, -9, 9); d = int(r, 2, 12); colder = r() < 0.5; start = colder ? e + d : e - d } while (start < -10 || start > 10)
    return { text: `After it got ${d} degrees ${colder ? 'colder' : 'warmer'}, it was ${m(e)} °C. What was the temperature before, in °C?`, picture: thermo(e), answer: start,
      steps: ['Work backwards: undo the change.', `It got ${colder ? 'colder, so go back up' : 'warmer, so go back down'} ${d}: ${m(e)} ${colder ? '+' : '−'} ${d}.`, `So it was ${m(start)} °C before.`] }
  }),
  lv('two steps: a change repeated, then the new reading', r => {
    if (r() < 0.5) {
      const s = int(r, 12, 24), d = int(r, 2, 4), n = int(r, 2, 6), dn = d * n, ans = -s + dn
      return { text: `A freezer is at ${m(-s)} °C. The power goes out, and it warms up ${d} degrees every hour for ${n} hours. What is the temperature then, in °C?`,
        picture: thermo(-s, -30, 20, 10), answer: ans,
        steps: [`${d} degrees every hour for ${n} hours is ${n} × ${d} = ${dn} degrees warmer.`, `Warmer means up, so write ${m(-s)} + ${dn}.`, `So it is ${m(ans)} °C.`] }
    }
    const s = int(r, 2, 10), d = int(r, 2, 6), n = int(r, 2, 5), ans = -s - d * n
    return { text: `A diver starts at ${m(-s)} meters. She goes down ${d} meters every minute for ${n} minutes. Where is she then, in meters?`,
      picture: endsLine(-50, 0, 10, [{ at: -s, label: 'start' }]), answer: ans,
      steps: [`Going down is negative: ${n} × ${p(-d)} = ${m(-d * n)}.`, `Add it to the start: ${m(-s)} + ${p(-d * n)}.`, `So she is at ${m(ans)} meters.`] }
  }),
]

export const G7M2_LADDERS: Record<string, Level[]> = {
  'g7m2-t1': T1, 'g7m2-t2': T2, 'g7m2-t3': T3, 'g7m2-t4': T4, 'g7m2-t5': T5, 'g7m2-t6': T6, 'g7m2-t7': T7, 'g7m2-t8': T8,
}
