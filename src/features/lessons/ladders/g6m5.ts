/**
 * Grade 6 · Module 5 — algebraic expressions and one-step equations: the practice ladders (see ../adaptive.ts).
 * Every level is a different KIND of question; numbers are picked per problem and the answer computed from them.
 * Expressions are always answered as choices, and no two choices are ever the same expression written two ways.
 */
import type { Picture } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
/** One tape row of labelled cells, each 1 wide unless given as [text, width]. */
const tape = (cells: (string | [string, number])[], brace?: string): Picture =>
  ({ kind: 'tape', rows: [{ cells: cells.map(c => typeof c === 'string' ? { w: 1, text: c } : { w: c[1], text: c[0] }), brace }] })
const bal = (left: string, right: string): Picture => ({ kind: 'balance', left, right })
const line = (min: number, max: number, extra: Partial<Extract<Picture, { kind: 'numline' }>> = {}): Picture =>
  ({ kind: 'numline', min, max, ticks: max - min, ...extra })
const cards = (wrong: string, right: string): Picture => ({ kind: 'cards', wrong, right })

const choose = (r: Rng, right: string, wrong: string[]) => {
  const choices = shuffle(r, [right, ...wrong])
  return { choices, correct: choices.indexOf(right) }
}
/** Re-roll until `ok` — every generator here has plenty of good numbers, so this ends quickly. */
const until = <T>(make: () => T, ok: (t: T) => boolean): T => { let t = make(); while (!ok(t)) t = make(); return t }
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const sup = (n: number) => String(n).split('').map(d => SUP[+d]).join('')
const times = (b: number, e: number) => Array.from({ length: e }, () => String(b)).join(' × ')
const KIDS = [['Mia', 'she'], ['Leo', 'he'], ['Ava', 'she'], ['Ben', 'he'], ['Zoe', 'she'], ['Sam', 'he']] as const
const twoNames = (r: Rng) => { const [x, y] = shuffle(r, KIDS.map(k => k[0])); return [x, y] as const }
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

// ── t1 · A letter stands for a number ────────────────────────────────────────────────────────────────────
const HOLD = [
  { box: 'bag', boxes: 'bags', thing: 'marbles' }, { box: 'box', boxes: 'boxes', thing: 'pencils' },
  { box: 'jar', boxes: 'jars', thing: 'cookies' }, { box: 'cup', boxes: 'cups', thing: 'beads' },
] as const

const T1: Level[] = [
  { style: 'put the number in, with a tape', make: r => {
    const h = pick(r, HOLD), a = int(r, 2, 9), v = int(r, 3, 20)
    return { text: `A ${h.box} holds n ${h.thing}. You also have ${a} more, so you have n + ${a} ${h.thing}. How many ${h.thing} is that when n = ${v}?`,
      picture: tape([['n', 3], String(a)], `n + ${a}`), answer: v + a,
      steps: [`n stands for the ${h.thing} in the ${h.box}, and n = ${v}.`, `Put ${v} where the n is: ${v} + ${a}.`, `So you have ${fmt(v + a)} ${h.thing}.`] }
  } },
  { style: 'what the letter stands for', make: r => {
    const h = pick(r, HOLD), a = int(r, 2, 9)
    const right = `how many ${h.thing} are in the ${h.box}`
    return { text: `A ${h.box} holds n ${h.thing}. You also have ${a} loose ${h.thing}. What does n stand for?`,
      picture: tape([['n', 3], String(a)]),
      answer: choose(r, right, [`the color of the ${h.thing}`, `the ${h.box}`, `how many loose ${h.thing} there are`]),
      steps: ['n is a number, not a thing.', `It tells you how many ${h.thing} are hiding in the ${h.box}.`, `So the answer is: ${right}.`] }
  } },
  { style: 'take away, bare, with two tapes', make: r => {
    const { v, a } = until(() => ({ v: int(r, 10, 40), a: int(r, 2, 9) }), ({ v, a }) => v - a !== a)
    return { text: `What is n − ${a} when n = ${v}?`,
      picture: { kind: 'tape', rows: [{ cells: [{ w: 4, text: 'n' }] }, { cells: [{ w: 3, text: '?', shade: true }, { w: 1, text: String(a) }] }] },
      answer: v - a, steps: [`This time n = ${v}.`, `Put ${v} in place of n: ${v} − ${a}.`, `So n − ${a} is ${fmt(v - a)}.`] }
  } },
  { style: 'the same letter twice', make: r => {
    const h = pick(r, HOLD), a = int(r, 2, 9), v = int(r, 4, 15)
    return { text: `You have two ${h.boxes} with n ${h.thing} in each, and ${a} loose ${h.thing}. That is n + n + ${a}. How many ${h.thing} is that when n = ${v}?`,
      picture: tape([['n', 3], ['n', 3], String(a)], `n + n + ${a}`), answer: 2 * v + a,
      steps: [`Both ${h.boxes} hold n ${h.thing}, and n = ${v}.`, `Put ${v} in place of each n: ${v} + ${v} + ${a}.`, `So you have ${fmt(2 * v + a)} ${h.thing}.`] }
  } },
  { style: 'two amounts with the same n, how many more', make: r => {
    const { v, a } = until(() => ({ v: int(r, 8, 20), a: int(r, 2, 7) }), ({ v, a }) => v - a !== a)
    const [x, y] = twoNames(r), d = v - a
    return { text: `${x} has n + ${a} stickers. ${y} has n + n stickers. When n = ${v}, how many more stickers does ${y} have than ${x}?`,
      picture: { kind: 'tape', rows: [{ label: x, cells: [{ w: 3, text: 'n' }, { w: 1, text: String(a) }] }, { label: y, cells: [{ w: 3, text: 'n' }, { w: 3, text: 'n' }] }] },
      answer: d,
      steps: [`When n = ${v}, ${x} has ${v} + ${a} = ${v + a}.`, `${y} has ${v} + ${v} = ${2 * v}, and ${2 * v} − ${v + a} = ${d}.`, `So ${y} has ${fmt(d)} more.`] }
  } },
]

// ── t2 · Write an expression from words ──────────────────────────────────────────────────────────────────
const four = (a: number) => ({ plus: `n + ${a}`, minus: `n − ${a}`, back: `${a} − n`, times: `${a}n` })

const T2: Level[] = [
  { style: '"more than", with a tape', make: r => {
    const a = int(r, 2, 9), [x, y] = twoNames(r), f = four(a)
    return { text: `${x} has n stickers. ${y} has ${a} more than ${x}. Which shows how many stickers ${y} has?`,
      picture: { kind: 'tape', rows: [{ label: x, cells: [{ w: 3, text: 'n' }] }, { label: y, cells: [{ w: 3, text: 'n' }, { w: 1, text: String(a) }], brace: '?' }] },
      answer: choose(r, f.plus, [f.times, f.minus, f.back]),
      steps: ['"More than" means add.', `Start with ${x}'s n, and add ${a}.`, `So it is ${f.plus}.`] }
  } },
  { style: 'a phrase to letters and signs', make: r => {
    const a = int(r, 2, 9), f = four(a), k = pick(r, ['more', 'less', 'times'] as const)
    const phrase = k === 'times' ? `${a} times n` : `${a} ${k} than n`
    const right = k === 'more' ? f.plus : k === 'less' ? f.minus : f.times
    const steps = k === 'more' ? ['"More than" means add.', `Start with n, and add ${a} to it.`, `So it is ${right}.`]
      : k === 'less' ? ['"Less than" means take away.', `Start with n, then take ${a} away. The n comes first.`, `So it is ${right}.`]
        : ['"Times" means multiply.', `Multiply n by ${a}, and write the number first.`, `So it is ${right}.`]
    return { text: `Which shows "${phrase}"?`, picture: eq(phrase), answer: choose(r, right, [f.plus, f.minus, f.back, f.times].filter(c => c !== right)), steps }
  } },
  { style: 'fix the mistake', make: r => {
    const a = int(r, 2, 9), f = four(a), k = pick(r, ['more', 'less', 'times'] as const), who = pick(r, KIDS)[0]
    const [phrase, wrote, right, why, how] = k === 'more' ? [`${a} more than n`, f.times, f.plus, '"More than" means add, not multiply.', `Start with n, and add ${a}.`]
      : k === 'less' ? [`${a} less than n`, f.back, f.minus, '"Less than" means take away, and the n comes first.', `Start with n, then take ${a} away.`]
        : [`${a} times n`, f.plus, f.times, '"Times" means multiply, not add.', `Multiply n by ${a}, and write the number first.`]
    return { text: `${who} writes "${phrase}" as ${wrote}. Which should it be?`, picture: cards(`${phrase} → ${wrote}`, `${phrase} → ?`),
      answer: choose(r, right, [f.plus, f.minus, f.back, f.times].filter(c => c !== right)),
      steps: [why, how, `So it should be ${right}.`] }
  } },
  { style: 'two actions from words', make: r => {
    const { a, b } = until(() => ({ a: int(r, 2, 9), b: int(r, 2, 9) }), ({ a, b }) => a !== b)
    if (r() < 0.5) {
      const phrase = `${a} more than ${b} times n`, right = `${b}n + ${a}`
      return { text: `Which shows "${phrase}"?`, picture: eq(phrase),
        answer: choose(r, right, [`${b}(n + ${a})`, `${a}n + ${b}`, `${b}n − ${a}`]),
        steps: [`First, ${b} times n is ${b}n.`, `"${a} more than" that means add ${a} to ${b}n.`, `So it is ${right}.`] }
    }
    const phrase = `${a} less than ${b} times n`, right = `${b}n − ${a}`
    return { text: `Which shows "${phrase}"?`, picture: eq(phrase),
      answer: choose(r, right, [`${b}(n − ${a})`, `${a} − ${b}n`, `${b}n + ${a}`]),
      steps: [`First, ${b} times n is ${b}n.`, `"${a} less than" that means start with ${b}n, then take ${a} away.`, `So it is ${right}.`] }
  } },
  { style: 'a story to an expression', make: r => {
    const { c, d } = until(() => ({ c: int(r, 3, 12), d: int(r, 2, 9) }), ({ c, d }) => c !== d)
    if (r() < 0.5) {
      const right = `${c}t + ${d}`
      return { text: `Tickets cost ${c} dollars each. The whole order also has a fee of ${d} dollars. Which shows the cost, in dollars, of t tickets?`,
        picture: eq('t tickets', [`${c} dollars each`, `fee: ${d} dollars`]),
        answer: choose(r, right, [`${c}(t + ${d})`, `${d}t + ${c}`, `t + ${c + d}`]),
        steps: [`t tickets at ${c} dollars each cost ${c}t.`, `The fee is added once, not for every ticket: + ${d}.`, `So it is ${right}.`] }
    }
    const right = `${c}n − ${d}`
    return { text: `A class has ${c} boxes with n crayons in each. Then ${d} crayons get lost. Which shows how many crayons are left?`,
      picture: eq(`${c} boxes of n crayons`, [`${d} lost`]),
      answer: choose(r, right, [`${c}(n − ${d})`, `${d} − ${c}n`, `n − ${c + d}`]),
      steps: [`${c} boxes of n crayons is ${c}n crayons.`, `${d} crayons get lost once, so take ${d} away from ${c}n.`, `So it is ${right}.`] }
  } },
]

// ── t3 · Work out an expression ──────────────────────────────────────────────────────────────────────────
const T3: Level[] = [
  { style: 'put it in, with a tape', make: r => {
    const a = int(r, 2, 4), b = int(r, 1, 9), v = int(r, 2, 9)
    return { text: `What is ${a}n + ${b} when n = ${v}?`, picture: tape([...Array.from({ length: a }, () => 'n'), String(b)], `${a}n + ${b}`),
      answer: a * v + b, steps: [`${a}n means ${a} × n, and n = ${v}.`, `Put ${v} in: ${a} × ${v} + ${b}.`, `Multiply first: ${a * v} + ${b} = ${fmt(a * v + b)}.`] }
  } },
  { style: 'take away, bare', make: r => {
    const { a, b, v } = until(() => ({ a: int(r, 2, 9), b: int(r, 1, 9), v: int(r, 2, 12) }), ({ a, b, v }) => a * v > b)
    return { text: `What is ${a}n − ${b} when n = ${v}?`, picture: eq(`${a}n − ${b}`),
      answer: a * v - b, steps: [`${a}n means ${a} × n, and n = ${v}.`, `Put ${v} in: ${a} × ${v} − ${b}.`, `Multiply first: ${a * v} − ${b} = ${fmt(a * v - b)}.`] }
  } },
  { style: 'two letters', make: r => {
    const { k, av, bv, plus } = until(() => ({ k: int(r, 2, 5), av: int(r, 2, 12), bv: int(r, 1, 15), plus: r() < 0.5 }), ({ k, av, bv, plus }) => plus || k * av > bv)
    const s = plus ? '+' : '−', ans = plus ? k * av + bv : k * av - bv
    return { text: `What is ${k}a ${s} b when a = ${av} and b = ${bv}?`, picture: eq(`${k}a ${s} b`), answer: ans,
      steps: [`${k}a means ${k} × a. Put ${av} for a and ${bv} for b.`, `That makes ${k} × ${av} ${s} ${bv}.`, `Multiply first: ${k * av} ${s} ${bv} = ${fmt(ans)}.`] }
  } },
  { style: 'fix the stuck-together mistake', make: r => {
    const { a, b, v } = until(() => ({ a: int(r, 2, 9), b: int(r, 1, 9), v: int(r, 2, 9) }), ({ a, b, v }) => a * v + b !== 10 * a + v + b)
    const who = pick(r, KIDS)[0], ans = a * v + b
    return { text: `${who} works out ${a}n + ${b} when n = ${v}. ${cap(who)} writes ${a}${v} + ${b} = ${10 * a + v + b}. What is the right value?`,
      picture: cards(`${a}n = ${a}${v}`, `${a}n = ${a} × ${v}`), answer: ans,
      steps: [`${a}n means ${a} × n, so it is ${a} × ${v} = ${a * v}, not ${a}${v}.`, `Then add: ${a * v} + ${b}.`, `So the right value is ${fmt(ans)}.`] }
  } },
  { style: 'a price rule in a story, compare two', make: r => {
    const { a, b, m1, m2 } = until(() => { const m1 = int(r, 3, 9); return { a: int(r, 2, 5), b: int(r, 2, 6), m1, m2: m1 + int(r, 2, 10) } },
      ({ a, b, m1, m2 }) => a * (m2 - m1) !== b && a * (m2 - m1) !== a)
    const [x, y] = twoNames(r), A = a * m1 + b, B = a * m2 + b, d = B - A
    const taxi = r() < 0.5
    const text = taxi
      ? `A taxi ride costs ${b} dollars to start, plus ${a} dollars for each mile. For m miles it costs ${a}m + ${b} dollars. ${x} rides ${m1} miles and ${y} rides ${m2} miles. How many more dollars does ${y} pay?`
      : `A gym costs ${b} dollars to join, plus ${a} dollars for each visit. For m visits it costs ${a}m + ${b} dollars. ${x} goes ${m1} times and ${y} goes ${m2} times. How many more dollars does ${y} pay?`
    return { text, picture: eq(`${a}m + ${b}`), answer: d,
      steps: [`${x}: ${a} × ${m1} + ${b} = ${A}. ${y}: ${a} × ${m2} + ${b} = ${B}.`, `Take away: ${B} − ${A}.`, `So ${y} pays ${fmt(d)} more dollars.`] }
  } },
]

// ── t4 · Exponents ───────────────────────────────────────────────────────────────────────────────────────
/** Pairs where b^e and e^b differ (2 and 4 are the one pair that match). */
const swapPair = (r: Rng) => until(() => ({ b: int(r, 2, 6), e: int(r, 2, 5) }), ({ b, e }) => b !== e && !(b === 2 && e === 2) && b ** e !== e ** b && b ** e <= 8000 && e ** b <= 8000)

const T4: Level[] = [
  { style: 'the multiplication is written out', make: r => {
    const e = pick(r, [2, 3]), b = e === 2 ? int(r, 3, 9) : int(r, 2, 6)
    return { text: `${b}${sup(e)} means ${times(b, e)}. What is ${b}${sup(e)}?`, picture: eq(`${b}${sup(e)} = ${times(b, e)}`), answer: b ** e,
      steps: [`Write the ${b} ${e} times: ${times(b, e)}.`, e === 2 ? `Multiply: ${b} × ${b}.` : `${b} × ${b} = ${b * b}, then ${b * b} × ${b}.`, `So ${b}${sup(e)} = ${fmt(b ** e)}.`] }
  } },
  { style: 'bare exponent', make: r => {
    const [b, e] = pick(r, [() => [2, int(r, 4, 6)], () => [3, int(r, 3, 4)], () => [int(r, 4, 6), 3], () => [10, int(r, 2, 5)], () => [int(r, 7, 12), 2]])()
    return { text: `What is ${b}${sup(e)}?`, picture: eq(`${b}${sup(e)}`), answer: b ** e,
      steps: [`${b}${sup(e)} means ${e} ${b}s multiplied: ${times(b, e)}.`, `Multiply two at a time.`, `So ${b}${sup(e)} = ${fmt(b ** e)}.`] }
  } },
  { style: 'write it with an exponent', make: r => {
    const { b, e } = swapPair(r), right = `${b}${sup(e)}`
    return { text: `Which is the same as ${times(b, e)}?`, picture: eq(times(b, e)),
      answer: choose(r, right, [`${e}${sup(b)}`, `${b} × ${e}`, `${b} + ${e}`]),
      steps: [`Count the ${b}s: there are ${e} of them.`, `The big number is ${b}. The small raised number counts them: ${e}.`, `So it is ${right}.`] }
  } },
  { style: 'a story with squared or cubed', make: r => {
    if (r() < 0.5) {
      const b = int(r, 2, 6)
      return { text: `A store has ${b} shelves. Each shelf has ${b} boxes, and each box holds ${b} toys. That is ${b}³ toys. How many toys is that?`,
        picture: { kind: 'table', head: ['Shelves', 'Boxes on each shelf', 'Toys in each box'], rows: [[String(b), String(b), String(b)]] }, answer: b ** 3,
        steps: [`${b}³ means ${times(b, 3)}.`, `${b} × ${b} = ${b * b}, then ${b * b} × ${b}.`, `So there are ${fmt(b ** 3)} toys.`] }
    }
    const s = int(r, 6, 15)
    return { text: `A square garden is ${s} feet long on each side. Its area in square feet is ${s}². What is the area, in square feet?`,
      picture: eq(`${s} feet by ${s} feet`), answer: s * s,
      steps: [`${s}² means ${s} × ${s}.`, 'A square has the same length on both sides, so multiply the side by itself.', `So the area is ${fmt(s * s)} square feet.`] }
  } },
  { style: 'spot the mistake, then compare two powers', make: r => {
    const { b, e } = swapPair(r), P = b ** e, Q = e ** b, big = Math.max(P, Q), small = Math.min(P, Q), who = pick(r, KIDS)[0]
    return { text: `${who} says ${b}${sup(e)} and ${e}${sup(b)} are the same, because both use a ${b} and a ${e}. Work out both. How much bigger is the bigger one?`,
      picture: eq(`${b}${sup(e)}   and   ${e}${sup(b)}`), answer: big - small,
      steps: [`${b}${sup(e)} = ${times(b, e)} = ${fmt(P)}.`, `${e}${sup(b)} = ${times(e, b)} = ${fmt(Q)}.`, `${fmt(big)} − ${fmt(small)} = ${fmt(big - small)}, so the bigger one is ${fmt(big - small)} more.`] }
  } },
]

// ── t5 · Order of operations ─────────────────────────────────────────────────────────────────────────────
const T5: Level[] = [
  { style: 'exponent, then ×, then + or −', make: r => {
    const b = int(r, 2, 5), c = int(r, 2, 5), sq = c * c
    if (r() < 0.5) {
      const a = int(r, 2, 20), ans = a + b * sq
      return { text: `What is ${a} + ${b} × ${c}²?`, picture: eq(`${a} + ${b} × ${c}²`), answer: ans,
        steps: [`Exponent first: ${c}² = ${sq}, so ${a} + ${b} × ${sq}.`, `Multiply next: ${b} × ${sq} = ${b * sq}.`, `Add last: ${a} + ${b * sq} = ${fmt(ans)}.`] }
    }
    const { a, ans } = until(() => { const a = b * sq + int(r, 1, 20); return { a, ans: a - b * sq } }, ({ a, ans }) => ![a, b, c].includes(ans))
    return { text: `What is ${a} − ${b} × ${c}²?`, picture: eq(`${a} − ${b} × ${c}²`), answer: ans,
      steps: [`Exponent first: ${c}² = ${sq}, so ${a} − ${b} × ${sq}.`, `Multiply next: ${b} × ${sq} = ${b * sq}.`, `Subtract last: ${a} − ${b * sq} = ${fmt(ans)}.`] }
  } },
  { style: 'parentheses first', make: r => {
    if (r() < 0.5) {
      const { p, q, d } = until(() => { const p = int(r, 1, 5), q = int(r, 1, 5); return { p, q, d: int(r, 1, (p + q) ** 2 - 1) } },
        ({ p, q, d }) => p + q <= 9 && ![p, q, d].includes((p + q) ** 2 - d))
      const s = p + q, ans = s * s - d
      return { text: `What is (${p} + ${q})² − ${d}?`, picture: eq(`(${p} + ${q})² − ${d}`), answer: ans,
        steps: [`Parentheses first: ${p} + ${q} = ${s}.`, `Exponent next: ${s}² = ${s * s}.`, `Subtract last: ${s * s} − ${d} = ${fmt(ans)}.`] }
    }
    const { x, c, d, e, k } = until(() => { const k = int(r, 2, 6), d = int(r, 1, 9); return { k, d, c: d + k, x: k * int(r, 2, 9), e: int(r, 1, 9) } },
      ({ x, c, d, e, k }) => ![x, c, d, e].includes(x / k + e))
    const ans = x / k + e
    return { text: `What is ${x} ÷ (${c} − ${d}) + ${e}?`, picture: eq(`${x} ÷ (${c} − ${d}) + ${e}`), answer: ans,
      steps: [`Parentheses first: ${c} − ${d} = ${k}.`, `Divide next: ${x} ÷ ${k} = ${x / k}.`, `Add last: ${x / k} + ${e} = ${fmt(ans)}.`] }
  } },
  { style: 'who worked it out right', make: r => {
    const a = int(r, 2, 9), b = int(r, 2, 9), c = int(r, 2, 9), right = a + b * c, wrong = (a + b) * c
    const [x, y] = twoNames(r), rightFirst = r() < 0.5
    const [s1, s2] = rightFirst ? [[x, right], [y, wrong]] : [[y, wrong], [x, right]]
    return { text: `${s1[0]} works out ${a} + ${b} × ${c} and gets ${s1[1]}. ${s2[0]} gets ${s2[1]}. Who is right?`,
      picture: eq(`${a} + ${b} × ${c}`), answer: choose(r, x, [y, 'Both of them']),
      steps: [`Multiply first: ${b} × ${c} = ${b * c}. ${y} went left to right and added first.`, `Add last: ${a} + ${b * c} = ${right}.`, `So ${x} is right.`] }
  } },
  { style: 'where the parentheses go', make: r => {
    const { a, b, c, d } = until(() => { const c = int(r, 3, 9); return { a: int(r, 2, 9), b: int(r, 2, 6), c, d: int(r, 1, c - 1) } }, ({ a, b, c, d }) => {
      const v = [(a + b) * c - d, a + b * (c - d), a + b * c - d]
      return new Set(v).size === 3
    })
    const v1 = (a + b) * c - d, v2 = a + b * (c - d)
    const c1 = `(${a} + ${b}) × ${c} − ${d}`, c2 = `${a} + ${b} × (${c} − ${d})`, c3 = `${a} + (${b} × ${c} − ${d})`
    const first = r() < 0.5, T = first ? v1 : v2, right = first ? c1 : c2
    return { text: `Where do the parentheses go so that ${a} + ${b} × ${c} − ${d} = ${T}?`, picture: eq(`${a} + ${b} × ${c} − ${d} = ${T}`),
      answer: choose(r, right, first ? [c2, c3] : [c1, c3]),
      steps: first
        ? [`Try (${a} + ${b}) first: ${a + b} × ${c} − ${d}.`, `Multiply, then subtract: ${(a + b) * c} − ${d} = ${T}.`, `So it is ${right}.`]
        : [`Try (${c} − ${d}) first: ${a} + ${b} × ${c - d}.`, `Multiply, then add: ${a} + ${b * (c - d)} = ${T}.`, `So it is ${right}.`] }
  } },
  { style: 'a two-step story', make: r => {
    const [name, he] = pick(r, KIDS)
    if (r() < 0.5) {
      const { a, b, c, d } = until(() => ({ a: int(r, 5, 30), b: int(r, 2, 6), c: int(r, 3, 10), d: int(r, 2, 12) }),
        ({ a, b, c, d }) => ![a, b, c, d].includes(a + b * c - d))
      const ans = a + b * c - d
      return { text: `${name} has ${a} stickers. ${cap(he)} buys ${b} sheets with ${c} stickers on each, then gives ${d} to a friend. How many stickers does ${name} have now?`,
        picture: eq(`${a} + ${b} × ${c} − ${d}`), answer: ans,
        steps: [`Multiply first: ${b} sheets of ${c} is ${b * c}.`, `Then add and take away, left to right: ${a} + ${b * c} = ${a + b * c}, and ${a + b * c} − ${d}.`, `So ${name} has ${fmt(ans)} stickers.`] }
    }
    const { p, q, k, e } = until(() => { const k = int(r, 3, 6), each = int(r, 4, 12), p = int(r, 2, k * each - 2); return { p, q: k * each - p, k, e: int(r, 1, 5) } },
      ({ p, q, k, e }) => ![p, q, k, e].includes((p + q) / k + e))
    const ans = (p + q) / k + e
    return { text: `${name} has ${p} red beads and ${q} blue beads. ${cap(he)} shares them equally into ${k} bags, then adds ${e} gold ${e === 1 ? 'bead' : 'beads'} to each bag. How many beads are in each bag?`,
      picture: eq(`(${p} + ${q}) ÷ ${k} + ${e}`), answer: ans,
      steps: [`Parentheses first: ${p} + ${q} = ${p + q}.`, `Divide next: ${p + q} ÷ ${k} = ${(p + q) / k}. Add last: + ${e}.`, `So each bag has ${fmt(ans)} beads.`] }
  } },
]

// ── t6 · Equivalent expressions ──────────────────────────────────────────────────────────────────────────
const bags = (a: number, b: number): Picture => ({ kind: 'area', cols: ['x', String(b)], rows: [String(a)], widths: [3, 1] })

const T6: Level[] = [
  { style: 'multiply out, with an area model', make: r => {
    const a = int(r, 2, 9), b = int(r, 1, 9), right = `${a}x + ${a * b}`
    return { text: `Which is the same as ${a}(x + ${b})?`, picture: bags(a, b),
      answer: choose(r, right, [`${a}x + ${b}`, `x + ${a * b}`, `${a + b}x`]),
      steps: [`Multiply the ${a} by each part inside the parentheses.`, `${a} × x = ${a}x and ${a} × ${b} = ${a * b}.`, `So it is ${right}.`] }
  } },
  { style: 'multiply out a take away, bare', make: r => {
    const a = int(r, 2, 9), b = int(r, 1, 9), right = `${a}x − ${a * b}`
    return { text: `Which is the same as ${a}(x − ${b})?`, picture: eq(`${a}(x − ${b})`),
      answer: choose(r, right, [`${a}x − ${b}`, `${a}x + ${a * b}`, `x − ${a * b}`]),
      steps: [`Multiply the ${a} by each part, and keep the take away.`, `${a} × x = ${a}x and ${a} × ${b} = ${a * b}.`, `So it is ${right}.`] }
  } },
  { style: 'join the x parts', make: r => {
    const { p, q } = until(() => ({ p: int(r, 2, 9), q: int(r, 2, 9) }), ({ p, q }) => !(p === 2 && q === 2))
    const right = `${p + q}x`
    return { text: `Which is the same as ${p}x + ${q}x?`, picture: { kind: 'area', cols: [String(p), String(q)], rows: ['x'], widths: [p, q] },
      answer: choose(r, right, [`${p * q}x`, `${p + q} + x`, `${p + q}x²`]),
      steps: [`${p}x is ${p} groups of x, and ${q}x is ${q} more groups of x.`, `Together that is ${p} + ${q} groups of x.`, `So it is ${right}.`] }
  } },
  { style: 'a story, and fix the mistake', make: r => {
    const a = int(r, 2, 9), b = int(r, 1, 3), who = pick(r, KIDS)[0], right = `${a}x + ${a * b}`
    return { text: `Each of ${a} teams has x players and ${b} ${b === 1 ? 'coach' : 'coaches'}. ${who} says all the people is ${a}x + ${b}. Which shows the right total, with no parentheses?`,
      picture: bags(a, b), answer: choose(r, right, [`${a}x + ${b}`, `x + ${a * b}`, `${a + b}x`]),
      steps: [`One team is x + ${b} people, so ${a} teams is ${a}(x + ${b}). ${who} forgot to multiply the ${b}.`, `Multiply the ${a} by each part: ${a}x and ${a * b}.`, `So it is ${right}.`] }
  } },
  { style: 'multiply out, then join the x parts', make: r => {
    const { a, b, c } = until(() => ({ a: int(r, 2, 6), b: int(r, 1, 9), c: int(r, 2, 6) }), ({ a, c }) => !(a === 2 && c === 2))
    const right = `${a + c}x + ${a * b}`
    return { text: `Which is the same as ${a}(x + ${b}) + ${c}x?`, picture: eq(`${a}(x + ${b}) + ${c}x`),
      answer: choose(r, right, [`${a + c}x + ${b}`, `${a * c}x + ${a * b}`, `${a}x + ${a * b + c}`]),
      steps: [`Multiply the ${a} by each part: ${a}x + ${a * b}.`, `Now join the x parts: ${a}x + ${c}x = ${a + c}x.`, `So it is ${right}.`] }
  } },
]

// ── t7 · Solve x + a = b ─────────────────────────────────────────────────────────────────────────────────
/** a and b with x = b − a a whole number bigger than 0 that is not a itself. */
const addPair = (r: Rng, lo: number, hi: number, top: number) => until(() => { const a = int(r, lo, hi); return { a, b: a + int(r, 3, top) } }, ({ a, b }) => b - a !== a)

const T7: Level[] = [
  { style: 'balance', make: r => {
    const { a, b } = addPair(r, 2, 9, 20), x = b - a
    return { text: `Solve x + ${a} = ${b}. What is x?`, picture: bal(`x + ${a}`, String(b)), answer: x,
      steps: [`Take ${a} off both sides to keep it balanced.`, `Left: x. Right: ${b} − ${a}.`, `So x = ${fmt(x)}.`] }
  } },
  { style: 'number first, both sides written out', make: r => {
    const { a, b } = addPair(r, 5, 30, 40), x = b - a
    return { text: `Solve ${a} + x = ${b}. What is x?`, picture: eq(`${a} + x = ${b}`, [`${a} + x − ${a} = ${b} − ${a}`, 'x = ?']), answer: x,
      steps: [`The ${a} is with x on the left. Take ${a} off both sides.`, `Left: x. Right: ${b} − ${a}.`, `So x = ${fmt(x)}.`] }
  } },
  { style: 'which value makes it true', make: r => {
    const { a, b } = until(() => addPair(r, 3, 25, 40), ({ a, b }) => !`x + ${a} = ${b}`.includes(String(b - a)))
    const x = b - a, right = fmt(x)
    return { text: `Which value of x makes x + ${a} = ${b} true?`, picture: eq(`x + ${a} = ${b}`),
      answer: choose(r, right, [fmt(b + a), fmt(a), fmt(b)]),
      steps: [`Take ${a} off both sides: x = ${b} − ${a}.`, `Check: ${x} + ${a} = ${b}.`, `So the answer is ${right}.`] }
  } },
  { style: 'fix the slip', make: r => {
    const { a, b } = addPair(r, 5, 30, 60), x = b - a, who = pick(r, KIDS)[0]
    return { text: `${who} solves x + ${a} = ${b} and says x = ${b} + ${a} = ${b + a}. What is x really?`,
      picture: cards(`x = ${b} + ${a} = ${b + a}`, `x = ${b} − ${a} = ?`), answer: x,
      steps: [`${a} is added to x, so take ${a} away from both sides. Adding it makes the scale tip.`, `x = ${b} − ${a}.`, `So x = ${fmt(x)}.`] }
  } },
  { style: 'a story with two amounts added', make: r => {
    const [name, he] = pick(r, KIDS), thing = pick(r, ['stickers', 'marbles', 'cards'])
    const { a, c, b } = until(() => { const a = int(r, 3, 20), c = int(r, 3, 20); return { a, c, b: a + c + int(r, 3, 40) } },
      ({ a, c, b }) => ![a, c, b].includes(b - a - c))
    const x = b - a - c
    return { text: `${name} had x ${thing}. ${cap(he)} got ${a} from a friend and ${c} more at school. Now ${he} has ${b}. How many ${thing} did ${name} have at first?`,
      picture: tape([['x', 3], String(a), String(c)], `${b} ${thing}`), answer: x,
      steps: [`So x + ${a} + ${c} = ${b}, and ${a} + ${c} = ${a + c}.`, `Take ${a + c} off both sides: x = ${b} − ${a + c}.`, `So ${name} had ${fmt(x)} ${thing} at first.`] }
  } },
]

// ── t8 · Solve ax = b ────────────────────────────────────────────────────────────────────────────────────
const T8: Level[] = [
  { style: 'a tape of equal parts', make: r => {
    const a = int(r, 2, 8), q = int(r, 2, 12), b = a * q
    return { text: `Solve ${a}x = ${b}. What is x?`, picture: tape(Array.from({ length: a }, () => 'x'), String(b)), answer: q,
      steps: [`${a}x means ${a} equal parts make ${b}.`, `Divide both sides by ${a}: ${b} ÷ ${a}.`, `So x = ${fmt(q)}.`] }
  } },
  { style: 'pick the move', make: r => {
    const a = int(r, 2, 9), b = a * int(r, 2, 12), right = `divide both sides by ${a}`
    return { text: `To solve ${a}x = ${b}, what do you do to both sides?`, picture: eq(`${a}x = ${b}`),
      answer: choose(r, right, [`take ${a} off both sides`, `multiply both sides by ${a}`, `divide both sides by ${b}`]),
      steps: [`${a}x means ${a} equal parts of x.`, `To get one x, undo the × ${a} by dividing.`, `So the answer is: ${right}.`] }
  } },
  { style: 'fix the trap', make: r => {
    const { a, q } = until(() => ({ a: int(r, 3, 9), q: int(r, 3, 15) }), ({ a, q }) => q !== a && q !== a * q - a)
    const b = a * q, who = pick(r, KIDS)[0]
    return { text: `${who} solves ${a}x = ${b} and says x = ${b} − ${a} = ${b - a}. What is x really?`,
      picture: cards(`x = ${b} − ${a} = ${b - a}`, `x = ${b} ÷ ${a} = ?`), answer: q,
      steps: [`The ${a} is multiplying x, so undo it by dividing, not by taking away.`, `x = ${b} ÷ ${a}.`, `So x = ${fmt(q)}.`] }
  } },
  { style: 'a story', make: r => {
    const a = int(r, 2, 9), q = int(r, 3, 15), b = a * q
    const [text, brace, end] = pick(r, [
      [`${a} movie tickets cost ${b} dollars in all. Every ticket costs the same. How many dollars is one ticket?`, `${b} dollars`, `So one ticket costs ${fmt(q)} dollars.`],
      [`${a} packs hold ${b} cards in all, with the same number in each pack. How many cards are in one pack?`, `${b} cards`, `So one pack has ${fmt(q)} cards.`],
      [`${b} chairs are set out in ${a} equal rows. How many chairs are in one row?`, `${b} chairs`, `So one row has ${fmt(q)} chairs.`],
    ] as const)
    return { text, picture: tape(Array.from({ length: a }, () => 'x'), brace), answer: q,
      steps: [`${a} equal parts make ${b}, so ${a}x = ${b}.`, `Divide both sides by ${a}: ${b} ÷ ${a}.`, end] }
  } },
  { style: 'find one, then use it', make: r => {
    const { a, q, c } = until(() => ({ a: int(r, 2, 9), q: int(r, 2, 12), c: int(r, 2, 12) }), ({ a, q, c }) => c !== a && ![a, a * q, c].includes(c * q))
    const b = a * q, ans = c * q
    return { text: `${a} notebooks cost ${b} dollars. Each one costs the same. How many dollars do ${c} notebooks cost?`,
      picture: eq(`${a}x = ${b}`, [`${c} notebooks: ? dollars`]), answer: ans,
      steps: [`Solve ${a}x = ${b}: x = ${b} ÷ ${a} = ${q} dollars for one.`, `Then ${c} notebooks cost ${c} × ${q}.`, `So they cost ${fmt(ans)} dollars.`] }
  } },
]

// ── t9 · Inequalities on a number line ───────────────────────────────────────────────────────────────────
const SIGNS = [
  { s: '>', dir: 'right', open: true, word: 'greater than' },
  { s: '<', dir: 'left', open: true, word: 'less than' },
  { s: '≥', dir: 'right', open: false, word: 'greater than or equal to' },
  { s: '≤', dir: 'left', open: false, word: 'less than or equal to' },
] as const
type Sign = typeof SIGNS[number]
const desc = (k: number, open: boolean, dir: string) => `${open ? 'open' : 'filled'} dot at ${k}, arrow ${dir}`
const flip = (dir: string) => (dir === 'right' ? 'left' : 'right')
const lineChoices = (r: Rng, k: number, g: Sign) =>
  choose(r, desc(k, g.open, g.dir), [desc(k, !g.open, g.dir), desc(k, g.open, flip(g.dir))])
const dotStep = (k: number, g: Sign) => g.open ? `${k} is not ${g.word} ${k}, so its dot is open.` : `${k} works too, so its dot is filled in.`

const T9: Level[] = [
  { style: 'pick the number line for an inequality', make: r => {
    const g = pick(r, SIGNS), k = int(r, 2, 8), a = lineChoices(r, k, g)
    return { text: `Which number line shows x ${g.s} ${k}?`, picture: line(0, 10), answer: a,
      steps: [`"${g.s}" means ${g.word}, so the arrow goes ${g.dir}.`, dotStep(k, g), `So it is ${a.choices[a.correct]}.`] }
  } },
  { style: 'which number is a solution', make: r => {
    const g = pick(r, SIGNS), k = int(r, 5, 15), [d1, d2] = shuffle(r, [1, 2, 3, 4]), toward = g.dir === 'right' ? 1 : -1
    const right = g.open ? k + toward * d1 : k
    const wrong = g.open ? [k, k - toward * d2] : [k - toward * d1, k - toward * d2]
    return { text: `Which number is a solution of x ${g.s} ${k}?`, picture: line(k - 5, k + 5),
      answer: choose(r, fmt(right), wrong.map(fmt)),
      steps: [`x ${g.s} ${k} means numbers ${g.word} ${k}.`,
        g.open ? `${k} itself does not work, and ${k - toward * d2} is on the wrong side.` : `${k} itself works, because ${k} is equal to ${k}. The other two are on the wrong side.`,
        `So the answer is ${fmt(right)}.`] }
  } },
  { style: 'read a number line', make: r => {
    const g = pick(r, SIGNS), k = int(r, 2, 8), right = `x ${g.s} ${k}`
    return { text: 'Which inequality does this number line show?', picture: line(0, 10, { ray: { from: k, dir: g.dir, open: g.open } }),
      answer: choose(r, right, SIGNS.filter(o => o !== g).map(o => `x ${o.s} ${k}`)),
      steps: [`The dot is ${g.open ? 'open' : 'filled'}, so ${k} ${g.open ? 'does not work' : 'works too'}.`, `The arrow goes ${g.dir}, toward ${g.dir === 'right' ? 'bigger' : 'smaller'} numbers.`, `So it is ${right}.`] }
  } },
  { style: 'the least or greatest whole number', make: r => {
    const g = pick(r, SIGNS), k = int(r, 5, 40), up = g.dir === 'right'
    const ans = g.open ? k + (up ? 1 : -1) : k
    return { text: `What is the ${up ? 'least' : 'greatest'} whole number that makes x ${g.s} ${k} true?`, picture: line(k - 5, k + 5), answer: ans,
      steps: [`x ${g.s} ${k} means numbers ${g.word} ${k}.`,
        g.open ? `${k} itself does not work, so go one whole number ${up ? 'up' : 'down'}.` : `${k} itself works, and it is the ${up ? 'smallest' : 'biggest'} number that does.`,
        `So the answer is ${fmt(ans)}.`] }
  } },
  { style: 'a story to a number line', make: r => {
    const k = int(r, 3, 10), s = pick(r, ['≤', '≥', '>', '<'] as const), g = SIGNS.find(o => o.s === s)!
    const [text, phrase, v] = {
      '≤': [`A suitcase may weigh at most ${k} pounds. Which number line shows the weights w that are allowed?`, `at most ${k}`, 'w'],
      '≥': [`You must be at least ${k} years old to go on a ride. Which number line shows the ages a that can go?`, `at least ${k}`, 'a'],
      '>': [`A club is for kids more than ${k} years old. Which number line shows the ages a that can join?`, `more than ${k}`, 'a'],
      '<': [`A small box must weigh less than ${k} pounds. Which number line shows the weights w that are allowed?`, `less than ${k}`, 'w'],
    }[s]
    const a = lineChoices(r, k, g)
    return { text, picture: line(0, 15), answer: a,
      steps: [`"${phrase}" means ${v} ${s} ${k}, so the arrow goes ${g.dir}.`, dotStep(k, g), `So it is ${a.choices[a.correct]}.`] }
  } },
]

export const G6M5_LADDERS: Record<string, Level[]> = {
  'g6m5-t1': T1, 'g6m5-t2': T2, 'g6m5-t3': T3, 'g6m5-t4': T4, 'g6m5-t5': T5,
  'g6m5-t6': T6, 'g6m5-t7': T7, 'g6m5-t8': T8, 'g6m5-t9': T9,
}
