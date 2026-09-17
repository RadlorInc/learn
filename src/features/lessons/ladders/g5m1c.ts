/**
 * Grade 5 · Module 1 · Part C — division by two-digit numbers (t13–t16). Practice ladders, easiest style first
 * (see ../adaptive.ts and the reference ladders t2/t12 in ./g5m1.ts). Every problem divides exactly: the dividend
 * is built as divisor × quotient, so there is never a remainder.
 */
import type { Picture } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const ld = (d: number, n: number): Picture => ({ kind: 'longdiv', divisor: String(d), dividend: String(n) })

const choose = (r: Rng, right: string, wrong: string[]) => {
  const choices = shuffle(r, [right, ...wrong])
  return { choices, correct: choices.indexOf(right) }
}
/** True when the picture does not show `a` as a whole number (the same test the gate runs). */
const hides = (p: Picture, a: number) => !new RegExp(`(^|[^\\d,.])${fmt(a)}(?![\\d,.]*\\d)`).test(JSON.stringify(p))
/** Draw from `gen` until `ok` holds. */
const until = <T>(gen: () => T, ok: (x: T) => boolean): T => { let x = gen(); while (!ok(x)) x = gen(); return x }
const roundTen = (d: number) => Math.round(d / 10) * 10
const times = (g: number) => (g === 1 ? 'one time' : `${g} times`)

/** Work backwards from ? ÷ d = q: multiply, splitting the two-digit (or bigger) factor into tens and ones. */
const backSteps = (q: number, d: number) => {
  const n = q * d
  if (q >= 10) {
    const t = q - (q % 10), o = q % 10
    return [`Go backwards: ${fmt(q)} × ${d}.`, `${fmt(t)} × ${d} = ${fmt(t * d)}, and ${o} × ${d} = ${fmt(o * d)}.`,
      `${fmt(t * d)} + ${fmt(o * d)} = ${fmt(n)}, so the missing number is ${fmt(n)}.`]
  }
  const t = d - (d % 10), o = d % 10
  return [`Go backwards: ${q} × ${d}.`, `${q} × ${t} = ${fmt(q * t)}, and ${q} × ${o} = ${fmt(q * o)}.`,
    `${fmt(q * t)} + ${fmt(q * o)} = ${fmt(n)}, so the missing number is ${fmt(n)}.`]
}

// ── t13 · 2-digit ÷ 2-digit, one-digit answer ───────────────────────────────────────────────────────────────
/** d is not a multiple of 10, n = q × d is two digits, and the round guess is never too big (this lesson only adds). */
const nums13 = (r: Rng) => until(() => {
  const d = int(r, 11, 49), q = int(r, 2, 9)
  const R = roundTen(d), n = q * d
  return { d, q, n, R, g: Math.floor(n / R) }
}, x => x.d % 10 !== 0 && x.n <= 99 && x.g <= x.q)

const guess13 = ({ d, q, n, R, g }: ReturnType<typeof nums13>, end = `So ${n} ÷ ${d} = ${q}.`) => {
  const first = `${d} is close to ${R}. ${R}s fit into ${n} ${times(g)}, so guess ${g}.`
  const left = n - g * d
  if (g === q) return [first, `Check: ${g} × ${d} = ${n}, and ${n} − ${n} = 0. No whole group is left.`, `The guess was right. ${end}`]
  if (q - g === 1) return [first, `Check: ${g} × ${d} = ${g * d}, and ${n} − ${g * d} = ${left}. A whole ${d} still fits.`, `Add one: ${q} × ${d} = ${n}. ${end}`]
  return [first, `Check: ${g} × ${d} = ${g * d}, and ${n} − ${g * d} = ${left}. ${q - g} more ${d}s fit into ${left}, so the guess was ${q - g} too small.`,
    `${g} + ${q - g} = ${q}, and ${q} × ${d} = ${n}. ${end}`]
}

const T13: Level[] = [
  { style: 'round guess given', make: r => {
    const x = nums13(r)
    return { text: `Find ${x.n} ÷ ${x.d}. Start with the guess, then multiply to check.`,
      picture: eq(`${x.n} ÷ ${x.d} = ?`, [`${x.d} is close to ${x.R}`, `Guess: ${x.g}`]), answer: x.q, steps: guess13(x) }
  } },
  { style: 'bare division', make: r => {
    const x = nums13(r)
    return { text: `Find ${x.n} ÷ ${x.d}.`, picture: eq(`${x.n} ÷ ${x.d} = ?`), answer: x.q, steps: guess13(x) }
  } },
  { style: 'too small, too big or right', make: r => {
    const { d, q, n } = nums13(r)
    const gg = pick(r, [q - 1, q, q + 1].filter(v => v >= 1 && v <= 9))
    const [small, big, right] = ['Her guess is too small.', 'Her guess is too big.', 'Her guess is right.']
    const steps = gg < q ? [`Check: ${gg} × ${d} = ${gg * d}, and ${n} − ${gg * d} = ${n - gg * d}.`, `A whole ${d} still fits in what is left.`, small]
      : gg > q ? [`Check: ${gg} × ${d} = ${gg * d}.`, `That is more than ${n}.`, big]
      : [`Check: ${gg} × ${d} = ${n}, and ${n} − ${n} = 0.`, 'No whole group is left.', right]
    return { text: `Maya guesses that ${n} ÷ ${d} is ${gg}. Is her guess too small, too big, or right?`,
      picture: eq(`${n} ÷ ${d}`, [`Maya's guess: ${gg}`]), answer: choose(r, steps[2], [small, big, right].filter(c => c !== steps[2])), steps }
  } },
  { style: 'missing divisor', make: r => {
    const { d, q, n } = nums13(r)
    const t = d - (d % 10), o = d % 10
    return { text: `What number goes in the box? ${n} ÷ ? = ${q}`, picture: eq(`${n} ÷ ? = ${q}`), answer: d,
      steps: [`Think: ${q} × ? = ${n}.`, `${q} × ${t} = ${q * t}, and ${n} − ${q * t} = ${n - q * t}, which is ${q} × ${o}.`, `So the missing number is ${t} + ${o} = ${d}.`] }
  } },
  { style: 'two-step story', make: r => {
    const x = nums13(r), a = int(r, 5, x.n - 5), b = x.n - a
    return { text: `${a} girls and ${b} boys come to the sports field. The coach puts ${x.d} kids on each team. How many teams can she make?`,
      picture: eq(`${a} + ${b} = ?`, [`? ÷ ${x.d} = ?`]), answer: x.q,
      steps: [`First find all the kids: ${a} + ${b} = ${x.n}.`, `Then find ${x.n} ÷ ${x.d}: guess with ${x.R}s, then multiply to check. ${x.q} × ${x.d} = ${x.n}.`, `So the coach makes ${x.q} teams.`] }
  } },
]

// ── t14 · 3-digit ÷ 2-digit, one-digit answer ───────────────────────────────────────────────────────────────
/** n = q × d is three digits; the round guess is one too big (mostly — this lesson tries one less) or right. */
const nums14 = (r: Rng) => { const tooBig = r() < 0.6; return until(() => {
  const d = int(r, 12, 94), q = int(r, 2, 9)
  const R = roundTen(d), n = q * d
  return { d, q, n, R, g: Math.floor(n / R) }
}, x => x.d % 10 !== 0 && x.n >= 100 && x.n <= 999 && x.g === x.q + (tooBig ? 1 : 0) && x.g <= 9) }

const guess14 = ({ d, q, n, R, g }: ReturnType<typeof nums14>, end = `So ${n} ÷ ${d} = ${q}.`) => {
  const first = `${d} does not fit into ${Math.floor(n / 10)}, so the answer has one digit.`
  if (g > q) return [first, `${d} is close to ${R}, and ${R}s fit into ${n} ${g} times. But ${g} × ${d} = ${g * d}, which is too big.`, `Try one less: ${q} × ${d} = ${n}. ${end}`]
  return [first, `${d} is close to ${R}, and ${R}s fit into ${n} ${g} times. Check: ${g} × ${d} = ${n}.`, `It fits with 0 left. ${end}`]
}

const T14: Level[] = [
  { style: 'table with the first try', make: r => {
    const x = nums14(r)
    return { text: `Find ${x.n} ÷ ${x.d}. The table shows a first try with round numbers.`,
      picture: { kind: 'table', head: ['Try', `× ${x.d}`, `Fits into ${x.n}?`], rows: [[String(x.g), String(x.g * x.d), x.g > x.q ? 'no' : 'yes']] },
      answer: x.q, steps: guess14(x) }
  } },
  { style: 'bare long division', make: r => {
    const x = nums14(r)
    return { text: `Find ${x.n} ÷ ${x.d}.`, picture: ld(x.d, x.n), answer: x.q, steps: guess14(x) }
  } },
  { style: 'keep, one less or one more', make: r => {
    const { d, q, n } = nums14(r)
    const gg = pick(r, [q - 1, q, q + 1].filter(v => v >= 1 && v <= 9))
    const [keep, less, more] = [`Keep ${gg}.`, 'Try one less.', 'Try one more.']
    const steps = gg > q ? [`Check: ${gg} × ${d} = ${gg * d}.`, `${gg * d} is more than ${n}, so the guess is too big.`, less]
      : gg < q ? [`Check: ${gg} × ${d} = ${gg * d}, and ${n} − ${gg * d} = ${d}.`, `A whole ${d} still fits.`, more]
      : [`Check: ${gg} × ${d} = ${n}.`, 'It fits with 0 left.', keep]
    return { text: `Sam guesses that ${n} ÷ ${d} is ${gg}. What should he do next?`,
      picture: eq(`${n} ÷ ${d}`, [`Sam's guess: ${gg}`]), answer: choose(r, steps[2], [keep, less, more].filter(c => c !== steps[2])), steps }
  } },
  { style: 'missing dividend', make: r => {
    const { d, q, n } = nums14(r)
    return { text: `What number goes in the box? ? ÷ ${d} = ${q}`, picture: eq(`? ÷ ${d} = ${q}`), answer: n, steps: backSteps(q, d) }
  } },
  { style: 'two-step story', make: r => {
    const x = nums14(r)
    const s = int(r, 11, Math.min(99, 999 - x.n))
    return { text: `A flower shop has ${x.n + s} roses. It sells ${s} of them. It puts the rest in bunches of ${x.d}. How many bunches can it make?`,
      picture: eq(`${x.n + s} − ${s} = ?`, [`? ÷ ${x.d} = ?`]), answer: x.q,
      steps: [`First find the roses left: ${x.n + s} − ${s} = ${x.n}.`, `${x.d} is close to ${x.R}. Guess, then check: ${x.q} × ${x.d} = ${x.n}.`, `So the shop makes ${x.q} bunches.`] }
  } },
]

// ── t15 · 3-digit ÷ 2-digit, two-digit answer ───────────────────────────────────────────────────────────────
/** d is not a multiple of 10 (that is t12), q is two digits with no 0 and differs from d; n = q × d is three digits. */
const nums15 = (r: Rng) => until(() => {
  const d = int(r, 11, 49), q = int(r, 11, 90)
  const n = q * d, t = Math.floor(q / 10), o = q % 10, first = Math.floor(n / 10), rem = first - t * d
  return { d, q, n, t, o, first, rem, bring: rem * 10 + (n % 10) }
}, x => x.d % 10 !== 0 && x.n <= 999 && x.o !== 0 && x.q !== x.d)

const place15 = (x: ReturnType<typeof nums15>) => [
  `Tens: ${x.t} × ${x.d} = ${x.t * x.d} fits into ${x.first}. Write ${x.t}, and ${x.first} − ${x.t * x.d} = ${x.rem}.`,
  `Bring down the ${x.n % 10} to make ${x.bring}. Ones: ${x.o} × ${x.d} = ${x.bring}, with 0 left.`,
]

const T15: Level[] = [
  { style: 'tens done in a table', make: r => {
    const pic = (x: ReturnType<typeof nums15>): Picture => ({ kind: 'table', head: ['Place', 'Multiply', 'Take away'], rowHead: true,
      rows: [['Tens', `${x.t} × ${x.d} = ${x.t * x.d}`, `${x.first} − ${x.t * x.d} = ${x.rem}`], ['Ones', '?', '?']] })
    const x = until(() => nums15(r), y => hides(pic(y), y.q))
    return { text: `Find ${x.n} ÷ ${x.d}. The tens are done. Bring down the ones and finish.`, picture: pic(x), answer: x.q,
      steps: [...place15(x), `So ${x.n} ÷ ${x.d} = ${x.q}.`] }
  } },
  { style: 'bare long division', make: r => {
    const x = nums15(r)
    return { text: `Find ${x.n} ÷ ${x.d}.`, picture: ld(x.d, x.n), answer: x.q, steps: [...place15(x), `So ${x.n} ÷ ${x.d} = ${x.q}.`] }
  } },
  { style: 'pick the right answer among the usual mistakes', make: r => {
    const x = nums15(r)
    const say = (v: number) => `${x.n} ÷ ${x.d} = ${v}`
    const right = say(x.q)
    const wrong = [...new Set([x.t, x.q * 10, x.o * 10 + x.t].filter(v => v !== x.q))].map(say)
    return { text: `Which one is right?`, picture: eq(`${x.n} ÷ ${x.d}`), answer: choose(r, right, wrong), steps: [...place15(x), `So ${right}.`] }
  } },
  { style: 'missing dividend', make: r => {
    const x = nums15(r)
    return { text: `What number goes in the box? ? ÷ ${x.d} = ${x.q}`, picture: eq(`? ÷ ${x.d} = ${x.q}`), answer: x.n, steps: backSteps(x.q, x.d) }
  } },
  { style: 'two-step story', make: r => {
    const gen = () => { const x = nums15(r), a = int(r, 20, x.n - 20); return { x, a, b: x.n - a } }
    const pic = (v: ReturnType<typeof gen>) => eq(`${v.a} + ${v.b} = ?`, [`? ÷ ${v.x.d} = ?`])
    const v = until(gen, y => hides(pic(y), y.x.q)), { x, a, b } = v
    return { text: `A farm store has ${a} brown eggs and ${b} white eggs. Each carton holds ${x.d} eggs. How many cartons can the store fill?`,
      picture: pic(v), answer: x.q,
      steps: [`First find all the eggs: ${a} + ${b} = ${x.n}.`, `Divide the tens, then bring down the ones: ${x.t} × ${x.d} = ${x.t * x.d}, then ${x.o} × ${x.d} = ${x.bring}.`, `So the store fills ${x.q} cartons.`] }
  } },
]

// ── t16 · 4-digit ÷ 2-digit ─────────────────────────────────────────────────────────────────────────────────
/** n = q × d is four digits and q has no 0 digit; about half start with the first three digits (a two-digit answer). */
const nums16 = (r: Rng) => {
  const twoDigit = r() < 0.6
  return until(() => {
    const d = int(r, 12, 49), q = twoDigit ? int(r, 21, 99) : int(r, 100, 833)
    return { d, q, n: q * d }
  }, x => x.d % 10 !== 0 && x.n >= 1000 && x.n <= 9999 && !String(x.q).includes('0') && x.q !== x.d)
}

/** Long division as the lesson walks it: where to start, then one digit at a time. */
const long16 = (n: number, d: number, end: string) => {
  const digits = String(n), first2 = +digits.slice(0, 2)
  let idx = first2 >= d ? 2 : 3
  let part = +digits.slice(0, idx)
  const out: string[] = []
  const round = (lead: string) => {
    const k = Math.floor(part / d), rem = part - k * d
    out.push(`${lead} ${k} × ${d} = ${fmt(k * d)}, and ${fmt(part)} − ${fmt(k * d)} = ${rem}.`)
    return rem
  }
  let rem = round(idx === 2 ? `${d} fits into ${first2}, so start with the first two digits.` : `${d} does not fit into ${first2}, so start with ${part}.`)
  for (; idx < digits.length; idx++) {
    part = rem * 10 + +digits[idx]
    rem = round(`Bring down the ${digits[idx]} to make ${part}.`)
  }
  if (out.length === 2) return [...out, end]
  out[out.length - 1] += ` ${end}`
  return out
}

const T16: Level[] = [
  { style: 'where-to-start table', make: r => {
    const pic = (x: ReturnType<typeof nums16>): Picture => {
      const s = String(x.n), f2 = +s.slice(0, 2)
      const rows = [[s[0], 'no'], [String(f2), f2 >= x.d ? 'yes' : 'no']]
      if (f2 < x.d) rows.push([s.slice(0, 3), 'yes'])
      return { kind: 'table', head: ['Start with', `Does ${x.d} fit?`], rows }
    }
    const x = until(() => nums16(r), y => hides(pic(y), y.q))
    return { text: `Find ${fmt(x.n)} ÷ ${x.d}. The table shows where to start.`, picture: pic(x), answer: x.q,
      steps: long16(x.n, x.d, `So ${fmt(x.n)} ÷ ${x.d} = ${fmt(x.q)}.`) }
  } },
  { style: 'bare long division', make: r => {
    const x = nums16(r)
    return { text: `Find ${fmt(x.n)} ÷ ${x.d}.`, picture: ld(x.d, x.n), answer: x.q, steps: long16(x.n, x.d, `So ${fmt(x.n)} ÷ ${x.d} = ${fmt(x.q)}.`) }
  } },
  { style: 'how many digits in the answer', make: r => {
    const x = nums16(r), s = String(x.n), f2 = +s.slice(0, 2)
    const right = `${String(x.q).length} digits`
    const steps = f2 < x.d
      ? [`${x.d} does not fit into ${f2}, so start with ${s.slice(0, 3)}.`, `The first digit of the answer goes over the ${s[2]}, and one more digit comes down after it.`, `So the answer has ${right}.`]
      : [`${x.d} fits into ${f2}, so start there.`, `The first digit of the answer goes over the ${s[1]}, and two more digits come down after it.`, `So the answer has ${right}.`]
    return { text: `How many digits does the answer to ${fmt(x.n)} ÷ ${x.d} have?`, picture: eq(`${fmt(x.n)} ÷ ${x.d} = ?`),
      answer: choose(r, right, ['2 digits', '3 digits', '4 digits'].filter(c => c !== right)), steps }
  } },
  { style: 'missing dividend', make: r => {
    const x = nums16(r)
    return { text: `What number goes in the box? ? ÷ ${x.d} = ${fmt(x.q)}`, picture: eq(`? ÷ ${x.d} = ${fmt(x.q)}`), answer: x.n, steps: backSteps(x.q, x.d) }
  } },
  { style: 'two-step story', make: r => {
    const gen = () => { const x = nums16(r), y = int(r, 10, 90) * 10; return { x, y, have: x.n - y } }
    const pic = (v: ReturnType<typeof gen>) => eq(`${fmt(v.have)} + ${v.y} = ?`, [`? ÷ ${v.x.d} = ?`])
    const v = until(gen, w => hides(pic(w), w.x.q)), { x, y, have } = v
    return { text: `A teacher has ${fmt(have)} stickers and buys ${y} more. She shares all of them equally among ${x.d} kids. How many stickers does each kid get?`,
      picture: pic(v), answer: x.q,
      steps: [`First find all the stickers: ${fmt(have)} + ${y} = ${fmt(x.n)}.`, `Find where to start, then bring down one digit at a time: ${fmt(x.n)} ÷ ${x.d} = ${fmt(x.q)}.`, `So each kid gets ${fmt(x.q)} stickers.`] }
  } },
]

export const LADDERS_C: Record<string, Level[]> = { 'g5m1-t13': T13, 'g5m1-t14': T14, 'g5m1-t15': T15, 'g5m1-t16': T16 }
