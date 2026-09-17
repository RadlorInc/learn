/**
 * Grade 5 · Module 1 — the practice ladders (see ../adaptive.ts). One ladder per topic, easiest style first.
 * ⚠️ A level is a different KIND of question, never the level below with bigger numbers — lessonLadders.test.ts
 * fails a ladder whose neighbouring levels read the same once the numbers are taken out.
 * t2 and t12 are the reference ladders; the other topics come from ./g5m1a … ./g5m1d (one writer per part).
 */
import type { Picture } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'
import { LADDERS_A } from './g5m1a'
import { LADDERS_B } from './g5m1b'
import { LADDERS_C } from './g5m1c'
import { LADDERS_D } from './g5m1d'

const PLACES = ['Millions', 'Hundred thousands', 'Ten thousands', 'Thousands', 'Hundreds', 'Tens', 'Ones']
const chart = (n: number, rows: string[]): Picture => ({
  kind: 'table', head: PLACES.slice(-n), rows: rows.map(r => r.padStart(n, '_').split('').map(d => (d === '_' ? '' : d))),
})
const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })

/** A choice question: the right sentence among the wrong ones, shuffled; `correct` follows it. */
const choose = (r: Rng, right: string, wrong: string[]) => {
  const choices = shuffle(r, [right, ...wrong])
  return { choices, correct: choices.indexOf(right) }
}

// ── t2 · Multiply and divide by 10, 100, 1,000 ──────────────────────────────────────────────────────────────
const POWERS = [{ p: 10, zeros: 'one zero', k: 'one place' }, { p: 100, zeros: 'two zeros', k: 'two places' }, { p: 1000, zeros: 'three zeros', k: 'three places' }]
/** A 2-digit number that does not end in 0, so its own zeros never muddle the count. */
const twoDigit = (r: Rng) => int(r, 1, 9) * 10 + int(r, 1, 9)

const T2: Level[] = [
  { style: 'place chart, multiply', make: r => {
    const n = twoDigit(r), { p, zeros, k } = pick(r, POWERS.slice(0, 2))
    return { text: `Multiply. ${n} × ${fmt(p)} = ?`, picture: chart(5, [String(n)]), answer: n * p,
      steps: [`${fmt(p)} has ${zeros}, so every digit slides ${k} to the left.`, 'Zeros fill the empty places.', `So ${n} × ${fmt(p)} = ${fmt(n * p)}.`] }
  } },
  { style: 'bare numbers, multiply or divide', make: r => {
    const n = twoDigit(r), { p, zeros, k } = pick(r, POWERS)
    if (r() < 0.5) return { text: `${fmt(n)} × ${fmt(p)} = ?`, picture: eq(`${fmt(n)} × ${fmt(p)} = ?`), answer: n * p,
      steps: [`${fmt(p)} has ${zeros}. Multiplying slides every digit ${k} to the left.`, `So ${fmt(n)} × ${fmt(p)} = ${fmt(n * p)}.`] }
    return { text: `${fmt(n * p)} ÷ ${fmt(p)} = ?`, picture: eq(`${fmt(n * p)} ÷ ${fmt(p)} = ?`), answer: n,
      steps: [`${fmt(p)} has ${zeros}. Dividing slides every digit ${k} to the right.`, `So ${fmt(n * p)} ÷ ${fmt(p)} = ${fmt(n)}.`] }
  } },
  { style: 'pick the true sentence (which way, how far)', make: r => {
    const n = twoDigit(r), { p, zeros, k } = pick(r, POWERS.slice(1))
    const right = `${fmt(n * p)} ÷ ${fmt(p)} = ${fmt(n)}`
    const answer = choose(r, right, [`${fmt(n * p)} ÷ ${fmt(p)} = ${fmt(n * p * p)}`, `${fmt(n * p)} ÷ ${fmt(p)} = ${fmt(n * 10)}`])
    return { text: 'Which one is true?', picture: eq(`${fmt(n * p)} ÷ ${fmt(p)}`), answer,
      steps: ['Dividing makes the number smaller, so the digits slide to the right.', `${fmt(p)} has ${zeros}, so they slide ${k}.`, `So ${right}.`] }
  } },
  { style: 'missing number', make: r => {
    const n = twoDigit(r), { p, zeros, k } = pick(r, POWERS)
    if (r() < 0.5) return { text: `What number goes in the box? ? × ${fmt(p)} = ${fmt(n * p)}`, picture: eq(`? × ${fmt(p)} = ${fmt(n * p)}`), answer: n,
      steps: [`Go backwards: ${fmt(n * p)} ÷ ${fmt(p)}.`, `${fmt(p)} has ${zeros}, so slide every digit ${k} to the right.`, `The missing number is ${fmt(n)}.`] }
    return { text: `What number goes in the box? ${fmt(n * p)} ÷ ? = ${fmt(n)}`, picture: eq(`${fmt(n * p)} ÷ ? = ${fmt(n)}`), answer: p,
      steps: [`${fmt(n)} became ${fmt(n * p)} by sliding ${k}.`, `Sliding ${k} is dividing by the number with ${zeros}.`, `The missing number is ${fmt(p)}.`] }
  } },
  { style: 'two-step story', make: r => {
    const each = twoDigit(r), boxes = pick(r, [100, 1000]), bags = pick(r, [10, 100].filter(b => b < boxes))
    const [thing, box, boxesWord] = pick(r, [['beads', 'box', 'boxes'], ['stickers', 'sheet', 'sheets'], ['seeds', 'packet', 'packets']] as const)
    const total = each * boxes
    return { text: `A shop has ${fmt(boxes)} ${boxesWord} of ${thing} with ${each} ${thing} in each ${box}. It shares all the ${thing} equally into ${bags} bags. How many ${thing} go in each bag?`,
      picture: eq(`${each} × ${fmt(boxes)} = ?`, [`? ÷ ${bags} = ?`]), answer: total / bags,
      steps: [`First find all the ${thing}: ${each} × ${fmt(boxes)} = ${fmt(total)}.`, `Then share them: ${fmt(total)} ÷ ${bags} = ${fmt(total / bags)}.`, `So ${fmt(total / bags)} ${thing} go in each bag.`] }
  } },
]

// ── t12 · Divide by a multiple of 10 ───────────────────────────────────────────────────────────────────────
/** A fact q × d with d 2–9 and q 2–9: the problem is (q·d·10) ÷ (d·10). */
const fact = (r: Rng) => ({ q: int(r, 2, 9), d: int(r, 2, 9) })

const T12: Level[] = [
  { style: 'tens written out', make: r => {
    const { q, d } = fact(r), a = q * d * 10, b = d * 10
    return { text: `Find ${fmt(a)} ÷ ${b}.`, picture: eq(`${fmt(a)} ÷ ${b} = ?`, [`${q * d} tens ÷ ${d} tens`]), answer: q,
      steps: [`${fmt(a)} is ${q * d} tens, and ${b} is ${d} tens.`, `So ${fmt(a)} ÷ ${b} is the same as ${q * d} ÷ ${d}.`, `${q * d} ÷ ${d} = ${q}, so ${fmt(a)} ÷ ${b} = ${q}.`] }
  } },
  { style: 'bare division', make: r => {
    const { q, d } = fact(r), a = q * d * 10, b = d * 10
    return { text: `Find ${fmt(a)} ÷ ${b}.`, picture: eq(`${fmt(a)} ÷ ${b} = ?`), answer: q,
      steps: [`Think in tens: ${fmt(a)} is ${q * d} tens and ${b} is ${d} tens.`, `${q * d} ÷ ${d} = ${q}.`, `So ${fmt(a)} ÷ ${b} = ${q}.`] }
  } },
  { style: 'story', make: r => {
    const { q, d } = fact(r), a = q * d * 10, b = d * 10
    const [whole, group] = pick(r, [['students ride buses that each seat', 'buses'], ['pencils go into boxes of', 'boxes'], ['apples are packed in crates of', 'crates']] as const)
    return { text: `${fmt(a)} ${whole} ${b}. How many ${group} are filled?`, picture: eq(`${fmt(a)} ÷ ${b} = ?`), answer: q,
      steps: [`Find ${fmt(a)} ÷ ${b}. That is ${q * d} tens ÷ ${d} tens.`, `${q * d} ÷ ${d} = ${q}.`, `So ${q} ${group} are filled.`] }
  } },
  { style: 'missing number', make: r => {
    const { q, d } = fact(r), a = q * d * 10, b = d * 10
    if (r() < 0.5) return { text: `What number goes in the box? ? ÷ ${b} = ${q}`, picture: eq(`? ÷ ${b} = ${q}`), answer: a,
      steps: [`Go backwards: ${q} × ${b}.`, `${q} × ${d} = ${q * d}, and ${b} is ${d} tens, so the product is ${q * d} tens.`, `The missing number is ${fmt(a)}.`] }
    return { text: `What number goes in the box? ${fmt(a)} ÷ ? = ${q}`, picture: eq(`${fmt(a)} ÷ ? = ${q}`), answer: b,
      steps: [`Think: ${q} times what makes ${fmt(a)}?`, `${fmt(a)} is ${q * d} tens, and ${q * d} ÷ ${q} = ${d}, so it is ${d} tens.`, `The missing number is ${b}.`] }
  } },
  { style: 'two-step story (find the total first)', make: r => {
    // classes × 30 students must fill whole buses: pick the buses and seats, keep only totals that are whole classes of 30.
    let b = 0, q = 0
    do { b = pick(r, [20, 40, 50, 60, 90]); q = int(r, 2, 9) } while ((q * b) % 30 !== 0)
    const total = q * b, classes = total / 30
    return { text: `A school has ${classes} classes with 30 students in each. Every bus seats ${b} students. How many buses does the school fill?`,
      picture: eq(`${classes} × 30 = ?`, [`? ÷ ${b} = ?`]), answer: q,
      steps: [`First find all the students: ${classes} × 30 = ${fmt(total)}.`, `Then think in tens: ${fmt(total)} ÷ ${b} is ${total / 10} ÷ ${b / 10}.`, `${total / 10} ÷ ${b / 10} = ${q}, so the school fills ${q} buses.`] }
  } },
]

export const G5M1_LADDERS: Record<string, Level[]> = { ...LADDERS_A, 'g5m1-t2': T2, ...LADDERS_B, 'g5m1-t12': T12, ...LADDERS_C, ...LADDERS_D }
