/**
 * Grade 5 · Module 1 · Part B (multiplication) — practice ladders for t7–t11. See ../adaptive.ts and ./g5m1.ts.
 * ⚠️ Each level is a different KIND of question; lessonLadders.test.ts fails two levels that read the same without numbers.
 */
import type { Picture } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const WIDTHS: Record<number, number[]> = { 2: [10, 3], 3: [5, 3, 2], 4: [4, 3, 2, 2] }
const area = (row: string, cols: string[]): Picture => ({ kind: 'area', rows: [row], cols, widths: WIDTHS[cols.length] })
/** Written multiplication with an empty answer box. */
const mul = (top: number, bottom: number): Picture => ({ kind: 'columns', rows: [String(top), String(bottom)], op: '×', answer: null })

const choose = (r: Rng, right: string, wrong: string[]) => {
  const choices = shuffle(r, [right, ...wrong])
  return { choices, correct: choices.indexOf(right) }
}
/** A number with `len` digits, none of them 0, so no place is ever empty. */
const noZeros = (r: Rng, len: number) => Array.from({ length: len }, () => int(r, 1, 9)).reduce((a, d) => a * 10 + d, 0)
/** 3,264 → [3000, 200, 60, 4] */
const places = (n: number) => String(n).split('').map((d, i, all) => +d * 10 ** (all.length - 1 - i))
const plus = (xs: number[]) => xs.map(fmt).join(' + ')
/** Round to the biggest place: 406 → 400, 35 → 40. */
const roundBig = (n: number) => { const p = 10 ** (String(n).length - 1); return Math.round(n / p) * p }

// ── t7 · one digit × a three- or four-digit number, by hundreds, tens and ones ────────────────────────────────
const T7: Level[] = [
  { style: 'area model with the parts drawn', make: r => {
    const d = int(r, 2, 9), n = noZeros(r, 3), ps = places(n), parts = ps.map(p => d * p)
    return { text: `Find ${d} × ${fmt(n)}.`, picture: area(String(d), ps.map(fmt)), answer: d * n,
      steps: [`Break ${fmt(n)} into ${ps.slice(0, -1).map(fmt).join(', ')} and ${ps.at(-1)}.`,
        `${ps.map((p, i) => `${d} × ${fmt(p)} = ${fmt(parts[i])}`).join(', ')}.`, `${plus(parts)} = ${fmt(d * n)}, so ${d} × ${fmt(n)} = ${fmt(d * n)}.`] }
  } },
  { style: 'bare numbers, four digits', make: r => {
    const d = int(r, 2, 9), n = noZeros(r, 4), ps = places(n), parts = ps.map(p => d * p)
    return { text: `${d} × ${fmt(n)} = ?`, picture: eq(`${d} × ${fmt(n)} = ?`), answer: d * n,
      steps: [`Break ${fmt(n)} into ${plus(ps)} and multiply each part by ${d}.`, `${plus(parts)} = ${fmt(d * n)}, so ${d} × ${fmt(n)} = ${fmt(d * n)}.`] }
  } },
  { style: 'pick the right partial products', make: r => {
    const d = int(r, 2, 9), n = noZeros(r, 3), [h, t, o] = places(n)
    const right = plus([d * h, d * t, d * o])
    const answer = choose(r, right, [plus([d * h / 100, d * t / 10, d * o]), plus([d * h, t, o])])
    return { text: `Which one shows ${d} × ${fmt(n)} the right way?`, picture: eq(`${d} × ${fmt(n)}`), answer,
      steps: [`${fmt(n)} is ${plus([h, t, o])}, and every part gets multiplied by ${d}.`, `${d} × ${fmt(h)} = ${fmt(d * h)}, ${d} × ${t} = ${fmt(d * t)} and ${d} × ${o} = ${d * o}.`, `So the right one is ${right}.`] }
  } },
  { style: 'missing partial product', make: r => {
    const d = int(r, 2, 9), n = noZeros(r, 3), [h, t, o] = places(n)
    const shown = `${d} × ${fmt(n)} = ${fmt(d * h)} + ? + ${d * o}`
    return { text: `What number goes in the box? ${shown}`, picture: eq(shown), answer: d * t,
      steps: [`The box is the tens part. ${fmt(n)} has ${t / 10} tens, which is ${t}.`, `${d} × ${t} = ${fmt(d * t)}, so the missing number is ${fmt(d * t)}.`] }
  } },
  { style: 'two-step story (two products, then add)', make: r => {
    const [a, b] = shuffle(r, [2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 2), n = noZeros(r, 3), m = noZeros(r, 3)
    const [first, second] = pick(r, [['corn', 'beans'], ['carrots', 'potatoes'], ['tulips', 'daisies']] as const)
    const total = a * n + b * m
    return { text: `A farmer plants ${a} rows of ${first} with ${fmt(n)} plants in each row, and ${b} rows of ${second} with ${fmt(m)} plants in each row. How many plants is that in all?`,
      picture: eq(`${a} × ${fmt(n)} = ?`, [`${b} × ${fmt(m)} = ?`]), answer: total,
      steps: [`The ${first}: ${a} × ${fmt(n)} = ${fmt(a * n)}.`, `The ${second}: ${b} × ${fmt(m)} = ${fmt(b * m)}.`, `${fmt(a * n)} + ${fmt(b * m)} = ${fmt(total)}, so there are ${fmt(total)} plants in all.`] }
  } },
]

// ── t8 · a number × a two-digit number, by its tens and ones ───────────────────────────────────────────────
/** A two-digit number with a tens digit 2–9 and a ones digit 2–9. */
const twoDigit = (r: Rng) => { const t = int(r, 2, 9), o = int(r, 2, 9); return { m: t * 10 + o, t, T: t * 10, o } }

const T8: Level[] = [
  { style: 'area model with the tens and ones drawn', make: r => {
    const n = int(r, 101, 299), { m, T, o } = twoDigit(r)
    return { text: `Find ${fmt(n)} × ${m}.`, picture: area(fmt(n), [String(T), String(o)]), answer: n * m,
      steps: [`Break ${m} into ${T} and ${o}.`, `${fmt(n)} × ${T} = ${fmt(n * T)} and ${fmt(n)} × ${o} = ${fmt(n * o)}.`, `${fmt(n * T)} + ${fmt(n * o)} = ${fmt(n * m)}, so ${fmt(n)} × ${m} = ${fmt(n * m)}.`] }
  } },
  { style: 'bare numbers', make: r => {
    const n = int(r, 12, 399), { m, T, o } = twoDigit(r)
    return { text: `${fmt(n)} × ${m} = ?`, picture: eq(`${fmt(n)} × ${m} = ?`), answer: n * m,
      steps: [`Break ${m} into ${T} and ${o}: ${fmt(n)} × ${T} = ${fmt(n * T)} and ${fmt(n)} × ${o} = ${fmt(n * o)}.`, `${fmt(n * T)} + ${fmt(n * o)} = ${fmt(n * m)}, so ${fmt(n)} × ${m} = ${fmt(n * m)}.`] }
  } },
  { style: 'pick the right way to break it apart', make: r => {
    const n = int(r, 12, 299), { m, t, T, o } = twoDigit(r)
    const right = `${fmt(n)} × ${T} + ${fmt(n)} × ${o}`
    const answer = choose(r, right, [`${fmt(n)} × ${t} + ${fmt(n)} × ${o}`, `${fmt(n)} × ${T} + ${o}`])
    return { text: `Which one is the same as ${fmt(n)} × ${m}?`, picture: eq(`${fmt(n)} × ${m}`), answer,
      steps: [`${m} is ${t} tens and ${o} ones, which is ${T} + ${o}.`, `Multiply ${fmt(n)} by each part, then add.`, `So the right one is ${right}.`] }
  } },
  { style: 'missing partial product', make: r => {
    const n = int(r, 12, 299), { m, t, T, o } = twoDigit(r)
    if (r() < 0.5) {
      const shown = `${fmt(n)} × ${m} = ${fmt(n * T)} + ?`
      return { text: `What number goes in the box? ${shown}`, picture: eq(shown), answer: n * o,
        steps: [`${fmt(n * T)} is ${fmt(n)} × ${T}, so the box is ${fmt(n)} times the ${o} ones.`, `${fmt(n)} × ${o} = ${fmt(n * o)}, so the missing number is ${fmt(n * o)}.`] }
    }
    const shown = `${fmt(n)} × ${m} = ? + ${fmt(n * o)}`
    return { text: `What number goes in the box? ${shown}`, picture: eq(shown), answer: n * T,
      steps: [`${fmt(n * o)} is ${fmt(n)} × ${o}, so the box is ${fmt(n)} times the ${t} tens, which is ${T}.`, `${fmt(n)} × ${t} = ${fmt(n * t)}, so ${fmt(n)} × ${T} = ${fmt(n * T)}. The missing number is ${fmt(n * T)}.`] }
  } },
  { style: 'two-step story (multiply, then take away)', make: r => {
    const each = int(r, 104, 249), { m, T, o } = twoDigit(r), total = each * m, sold = int(r, 2, Math.floor(total / 1000)) * 500
    const [box, boxes, things] = pick(r, [['box', 'boxes', 'books'], ['crate', 'crates', 'apples'], ['carton', 'cartons', 'eggs']] as const)
    return { text: `A shop gets ${m} ${boxes} of ${things}. Each ${box} holds ${fmt(each)} ${things}. The shop sells ${fmt(sold)} ${things}. How many ${things} are left?`,
      picture: eq(`${fmt(each)} × ${m} = ?`, [`? − ${fmt(sold)} = ?`]), answer: total - sold,
      steps: [`Break ${m} into ${T} and ${o}: ${fmt(each)} × ${T} = ${fmt(each * T)} and ${fmt(each)} × ${o} = ${fmt(each * o)}.`, `So the shop gets ${fmt(each * T)} + ${fmt(each * o)} = ${fmt(total)} ${things}.`, `${fmt(total)} − ${fmt(sold)} = ${fmt(total - sold)}, so ${fmt(total - sold)} ${things} are left.`] }
  } },
]

// ── t9 · the standard way: two or three digits × two digits ──────────────────────────────────────────────────
const T9: Level[] = [
  { style: 'find the tens row', make: r => {
    const n = int(r, 21, 99), { m, t } = twoDigit(r)
    return { text: `You multiply ${n} × ${m} the standard way. What number is the tens row?`, picture: mul(n, m), answer: n * t * 10,
      steps: [`The ${t} in ${m} means ${t} tens, so write a 0 first.`, `${n} × ${t} = ${fmt(n * t)}, so the tens row is ${fmt(n * t * 10)}.`] }
  } },
  { style: 'columns, the whole product', make: r => {
    const n = int(r, 102, 499), { m, t, o } = twoDigit(r)
    return { text: `Multiply the standard way. ${fmt(n)} × ${m} = ?`, picture: mul(n, m), answer: n * m,
      steps: [`Ones row: ${fmt(n)} × ${o} = ${fmt(n * o)}.`, `Tens row: write a 0, then ${fmt(n)} × ${t} = ${fmt(n * t)}. The row is ${fmt(n * t * 10)}.`, `${fmt(n * o)} + ${fmt(n * t * 10)} = ${fmt(n * m)}, so ${fmt(n)} × ${m} = ${fmt(n * m)}.`] }
  } },
  { style: 'pick the right answer (a lost 0)', make: r => {
    const n = int(r, 102, 499), { m, t, o } = twoDigit(r), right = fmt(n * m)
    const answer = choose(r, right, [fmt(n * o + n * t), fmt(n * o + n * t * 100)])
    return { text: `Two of these answers to ${fmt(n)} × ${m} have a slip in the tens row. Which answer is right?`, picture: eq(`${fmt(n)} × ${m} = ?`), answer,
      steps: [`Ones row: ${fmt(n)} × ${o} = ${fmt(n * o)}. Tens row: one 0, then ${fmt(n)} × ${t}, so ${fmt(n * t * 10)}.`, `${fmt(n * o)} + ${fmt(n * t * 10)} = ${right}.`, `So the right answer is ${right}.`] }
  } },
  { style: 'work backwards from the two rows', make: r => {
    let n = 0, d = twoDigit(r)
    do { n = int(r, 12, 99); d = twoDigit(r) } while (n * d.o === d.m) // a row that equals the answer would give it away
    const { m, t, o } = d
    return { text: `The two rows of ${n} × ? are ${fmt(n * o)} and ${fmt(n * t * 10)}. What is the missing number?`,
      picture: { kind: 'columns', rows: [String(n * o), String(n * t * 10)], op: '+', answer: null }, answer: m,
      steps: [`The ones row is ${n} × ${o} = ${fmt(n * o)}, so the ones digit is ${o}.`, `The tens row is ${n} × ${t} = ${fmt(n * t)} with a 0, so the tens digit is ${t}.`, `The missing number is ${m}.`] }
  } },
  { style: 'two-step story (multiply, then take away)', make: r => {
    const each = int(r, 104, 249), { m, t, o } = twoDigit(r), total = each * m, taken = int(r, 1, Math.floor(total / 1000)) * 350
    return { text: `A school hall has ${m} rows of chairs with ${fmt(each)} chairs in each row. ${fmt(taken)} chairs are taken. How many chairs are empty?`,
      picture: eq(`${fmt(each)} × ${m} = ?`, [`? − ${fmt(taken)} = ?`]), answer: total - taken,
      steps: [`Ones row: ${fmt(each)} × ${o} = ${fmt(each * o)}. Tens row: ${fmt(each * t * 10)}.`, `${fmt(each * o)} + ${fmt(each * t * 10)} = ${fmt(total)} chairs in the hall.`, `${fmt(total)} − ${fmt(taken)} = ${fmt(total - taken)}, so ${fmt(total - taken)} chairs are empty.`] }
  } },
]

// ── t10 · the standard way: three or four digits × three digits ──────────────────────────────────────────────
/** A three-digit number with no 0 digits, split into its digits. */
const threeDigit = (r: Rng) => { const m = noZeros(r, 3); const [h, t, o] = String(m).split('').map(Number); return { m, h, t, o } }
const rows3 = (n: number, { h, t, o }: { h: number; t: number; o: number }) => [n * o, n * t * 10, n * h * 100]

const T10: Level[] = [
  { style: 'find the hundreds row', make: r => {
    const n = int(r, 102, 499), b = threeDigit(r)
    return { text: `You multiply ${fmt(n)} × ${b.m} the standard way. What number is the hundreds row?`, picture: mul(n, b.m), answer: n * b.h * 100,
      steps: [`The ${b.h} in ${b.m} means ${b.h} ${b.h === 1 ? 'hundred' : 'hundreds'}, so write two 0s first.`, `${fmt(n)} × ${b.h} = ${fmt(n * b.h)}, so the hundreds row is ${fmt(n * b.h * 100)}.`] }
  } },
  { style: 'columns, the whole product', make: r => {
    const n = int(r, 102, 499), b = threeDigit(r), [a, c, e] = rows3(n, b)
    return { text: `Multiply the standard way. ${fmt(n)} × ${b.m} = ?`, picture: mul(n, b.m), answer: n * b.m,
      steps: [`Ones row: ${fmt(a)}. Tens row: one 0, then ${fmt(n)} × ${b.t}, so ${fmt(c)}.`, `Hundreds row: two 0s, then ${fmt(n)} × ${b.h}, so ${fmt(e)}.`, `${plus([a, c, e])} = ${fmt(n * b.m)}, so ${fmt(n)} × ${b.m} = ${fmt(n * b.m)}.`] }
  } },
  { style: 'pick the right answer (lost 0s in the hundreds row)', make: r => {
    const n = int(r, 1011, 2999), b = threeDigit(r), [a, c, e] = rows3(n, b), right = fmt(n * b.m)
    const answer = choose(r, right, [fmt(a + c + e / 100), fmt(a + c + e / 10)])
    return { text: `Only one of these answers to ${fmt(n)} × ${b.m} is right. Which one?`, picture: eq(`${fmt(n)} × ${b.m}`), answer,
      steps: [`The rows are ${fmt(a)}, ${fmt(c)} and ${fmt(e)}. The hundreds row needs two 0s.`, `${plus([a, c, e])} = ${right}.`, `So the right answer is ${right}.`] }
  } },
  { style: 'work backwards from the three rows', make: r => {
    let n = 0, b = threeDigit(r)
    do { n = int(r, 102, 299); b = threeDigit(r) } while (n * b.o === b.m) // a row that equals the answer would give it away
    const [a, c, e] = rows3(n, b)
    return { text: `The three rows of ${fmt(n)} × ? are ${fmt(a)}, ${fmt(c)} and ${fmt(e)}. What is the missing number?`,
      picture: { kind: 'columns', rows: [String(a), String(c), String(e)], op: '+', answer: null }, answer: b.m,
      steps: [`${fmt(n)} × ${b.o} = ${fmt(a)}, so the ones digit is ${b.o}. ${fmt(n)} × ${b.t} = ${fmt(n * b.t)}, so the tens digit is ${b.t}.`, `${fmt(n)} × ${b.h} = ${fmt(n * b.h)}, so the hundreds digit is ${b.h}.`, `The missing number is ${b.m}.`] }
  } },
  { style: 'two-step story (two products, then add)', make: r => {
    const p = int(r, 112, 399), q = threeDigit(r), s = int(r, 112, 399), u = threeDigit(r)
    const one = p * q.m, two = s * u.m, total = one + two
    return { text: `A juice factory fills ${q.m} crates with ${fmt(p)} bottles each on Monday, and ${u.m} crates with ${fmt(s)} bottles each on Tuesday. How many bottles is that in all?`,
      picture: eq(`${fmt(p)} × ${q.m} = ?`, [`${fmt(s)} × ${u.m} = ?`]), answer: total,
      steps: [`Monday: ${fmt(p)} × ${q.m} = ${fmt(one)}.`, `Tuesday: ${fmt(s)} × ${u.m} = ${fmt(two)}.`, `${fmt(one)} + ${fmt(two)} = ${fmt(total)}, so there are ${fmt(total)} bottles in all.`] }
  } },
]

// ── t11 · estimate, multiply, check ────────────────────────────────────────────────────────────────────────
/** Numbers whose round-to-the-biggest-place estimate stays close: a leading digit 1–8, the next digit 0–2 or 8–9. */
const closeTo = (r: Rng, len: number) => {
  const lead = int(r, 1, 8), next = pick(r, [0, 1, 2]), rest = len > 2 ? int(r, 1, 10 ** (len - 2) - 1) : 0
  return lead * 10 ** (len - 1) + next * 10 ** (len - 2) + rest
}
const bottom2 = (r: Rng) => { const t = int(r, 2, 8), o = pick(r, [1, 2, 8, 9]); return { m: t * 10 + o, t, o } }

const T11: Level[] = [
  { style: 'estimate only', make: r => {
    const n = closeTo(r, 3), m = int(r, 12, 88), a = roundBig(n), b = roundBig(m)
    return { text: `Estimate ${fmt(n)} × ${m}. Round each number to its biggest place, then multiply.`, picture: eq(`about ? × ?`, [`${fmt(n)} × ${m}`]), answer: a * b,
      steps: [`${fmt(n)} rounds to ${fmt(a)}, and ${m} rounds to ${b}.`, `${fmt(a)} × ${b} = ${fmt(a * b)}, so the estimate is ${fmt(a * b)}.`] }
  } },
  { style: 'estimate, then the exact product', make: r => {
    const n = closeTo(r, 3), { m, t, o } = bottom2(r), a = roundBig(n), b = roundBig(m)
    return { text: `Estimate ${fmt(n)} × ${m} first. Then multiply the standard way to find the exact answer.`, picture: mul(n, m), answer: n * m,
      steps: [`Estimate: ${fmt(a)} × ${b} = ${fmt(a * b)}.`, `Ones row: ${fmt(n * o)}. Tens row: write a 0, then ${fmt(n)} × ${t}, so ${fmt(n * t * 10)}.`, `${fmt(n * o)} + ${fmt(n * t * 10)} = ${fmt(n * m)}. That is close to ${fmt(a * b)}, so ${fmt(n)} × ${m} = ${fmt(n * m)}.`] }
  } },
  { style: 'pick the answer close to the estimate', make: r => {
    const n = closeTo(r, 3), { m, t, o } = bottom2(r), a = roundBig(n), b = roundBig(m), right = fmt(n * m)
    const answer = choose(r, right, [fmt(n * o + n * t), fmt(n * o + n * t * 100)])
    return { text: `Estimate ${fmt(n)} × ${m} with round numbers. Which answer is close to your estimate?`, picture: eq(`${fmt(n)} × ${m}`), answer,
      steps: [`Estimate: ${fmt(a)} × ${b} = ${fmt(a * b)}.`, `Only one answer is close to ${fmt(a * b)}. The others lost a 0 or got an extra one.`, `So the right answer is ${right}.`] }
  } },
  { style: 'fix an answer far from the estimate', make: r => {
    const n = closeTo(r, 4), { m, t, o } = bottom2(r), a = roundBig(n), b = roundBig(m), wrong = n * o + n * t
    const name = pick(r, ['Leo', 'Maya', 'Sam', 'Ava'])
    return { text: `${name} says ${fmt(n)} × ${m} = ${fmt(wrong)}. Estimate to check, then find the right answer.`, picture: eq(`${fmt(n)} × ${m} = ${fmt(wrong)}`, ['about ? × ?']), answer: n * m,
      steps: [`Estimate: ${fmt(a)} × ${b} = ${fmt(a * b)}. ${fmt(wrong)} is far away, so the tens row lost its 0.`, `The tens row is ${fmt(n)} × ${t} with a 0: ${fmt(n * t * 10)}.`, `${fmt(n * o)} + ${fmt(n * t * 10)} = ${fmt(n * m)}, so ${fmt(n)} × ${m} = ${fmt(n * m)}.`] }
  } },
  { style: 'story with a three-digit estimate', make: r => {
    const n = closeTo(r, 3), q = { h: int(r, 1, 8), t: int(r, 1, 2), o: int(r, 1, 9) }, b3 = q.h * 100 + q.t * 10 + q.o
    const [a, c, e] = rows3(n, q), ea = roundBig(n), eb = roundBig(b3), total = n * b3
    return { text: `A warehouse sends out ${fmt(n)} packages every day. Estimate first, then find exactly how many packages it sends out in ${b3} days.`,
      picture: mul(n, b3), answer: total,
      steps: [`Estimate: ${fmt(ea)} × ${eb} = ${fmt(ea * eb)}.`, `The rows are ${fmt(a)}, ${fmt(c)} and ${fmt(e)}.`, `${plus([a, c, e])} = ${fmt(total)}. That is close to ${fmt(ea * eb)}, so it sends out ${fmt(total)} packages.`] }
  } },
]

export const LADDERS_B: Record<string, Level[]> = { 'g5m1-t7': T7, 'g5m1-t8': T8, 'g5m1-t9': T9, 'g5m1-t10': T10, 'g5m1-t11': T11 }
