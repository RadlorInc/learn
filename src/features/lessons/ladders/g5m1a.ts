/**
 * Grade 5 · Module 1 · Part A (place value) — practice ladders for t1, t3–t6 (t2 lives in ./g5m1.ts). See ../adaptive.ts.
 * ⚠️ Each level is a different KIND of question; lessonLadders.test.ts fails two levels that read the same without numbers.
 */
import type { Picture } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

const PLACES = ['Millions', 'Hundred thousands', 'Ten thousands', 'Thousands', 'Hundreds', 'Tens', 'Ones']
const chart = (n: number, rows: string[]): Picture => ({
  kind: 'table', head: PLACES.slice(-n), rows: rows.map(r => r.padStart(n, '_').split('').map(d => (d === '_' ? '' : d))),
})
const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const choose = (r: Rng, right: string, wrong: string[]) => {
  const choices = shuffle(r, [right, ...wrong])
  return { choices, correct: choices.indexOf(right) }
}
/** A 2-digit number that does not end in 0. */
const twoDigit = (r: Rng) => int(r, 1, 9) * 10 + int(r, 1, 9)
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

// ── t1 · Relate place value neighbors ─────────────────────────────────────────────────────────────────────
const PL = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands']
const PL1 = ['one', 'ten', 'hundred', 'thousand', 'ten thousand']

const T1: Level[] = [
  { style: 'place chart, slide one place', make: r => {
    const d = int(r, 1, 9), k = int(r, 1, 3), n = d * 10 ** k, left = r() < 0.5
    const ans = left ? n * 10 : n / 10
    return { text: `In ${fmt(n)}, the ${d} is in the ${PL[k]} place. What is the ${d} worth if it slides one place to the ${left ? 'left' : 'right'}?`,
      picture: chart(5, [String(n)]), answer: ans,
      steps: [`The ${d} is in the ${PL[k]} place, so it is worth ${fmt(n)}.`,
        left ? `One place to the left is the ${PL[k + 1]} place. It is worth 10 times as much.` : `One place to the right is the ${PL[k - 1]} place. It is worth 1/10 as much.`,
        `So the ${d} is worth ${fmt(ans)}.`] }
  } },
  { style: 'bare numbers, 10 times or 1/10 of', make: r => {
    const n = twoDigit(r) * 10 ** int(r, 1, 3)
    if (r() < 0.5) return { text: `What number is 10 times as much as ${fmt(n)}?`, picture: eq(`10 × ${fmt(n)} = ?`), answer: n * 10,
      steps: ['10 times as much slides every digit one place to the left.', `So 10 times ${fmt(n)} is ${fmt(n * 10)}.`] }
    return { text: `What number is 1/10 of ${fmt(n)}?`, picture: eq(`1/10 of ${fmt(n)} = ?`), answer: n / 10,
      steps: ['1/10 as much slides every digit one place to the right.', `So 1/10 of ${fmt(n)} is ${fmt(n / 10)}.`] }
  } },
  { style: 'how many of a smaller place', make: r => {
    const d = int(r, 2, 9), b = int(r, 3, 4), s = b - int(r, 1, 2), n = d * 10 ** b, ans = d * 10 ** (b - s)
    return { text: `How many ${PL[s]} make ${fmt(n)}?`, picture: eq(`${fmt(n)} = ? ${PL[s]}`), answer: ans,
      steps: [`${fmt(n)} is ${d} ${PL[b]}.`, `Each ${PL1[b]} is ${fmt(10 ** (b - s))} ${PL[s]}.`, `So ${fmt(ans)} ${PL[s]} make ${fmt(n)}.`] }
  } },
  { style: 'pick the true sentence (not add 10)', make: r => {
    if (r() < 0.5) {
      const n = twoDigit(r) * 10 ** int(r, 1, 2), right = `10 × ${fmt(n)} = ${fmt(n * 10)}`
      return { text: 'Which one is true?', picture: eq(`10 × ${fmt(n)}`),
        answer: choose(r, right, [`10 × ${fmt(n)} = ${fmt(n + 10)}`, `10 × ${fmt(n)} = ${fmt(n * 100)}`]),
        steps: ['Ten times as much does not mean add 10.', 'It slides every digit one place to the left.', `So ${right}.`] }
    }
    const n = twoDigit(r) * 100, right = `1/10 of ${fmt(n)} = ${fmt(n / 10)}`
    return { text: 'Which one is true?', picture: eq(`1/10 of ${fmt(n)}`),
      answer: choose(r, right, [`1/10 of ${fmt(n)} = ${fmt(n - 10)}`, `1/10 of ${fmt(n)} = ${fmt(n / 100)}`]),
      steps: ['1/10 as much does not mean take away 10.', 'It slides every digit one place to the right.', `So ${right}.`] }
  } },
  { style: 'two-step story (two slides)', make: r => {
    const m = twoDigit(r), [thing, one, many] = pick(r, [['stickers', 'pack', 'packs'], ['beads', 'bag', 'bags'], ['crayons', 'tube', 'tubes']] as const)
    if (r() < 0.5) return { text: `A ${one} holds ${m} ${thing}. A box holds 10 ${many}, and a crate holds 10 boxes. How many ${thing} are in a crate?`,
      picture: chart(5, [String(m)]), answer: m * 100,
      steps: [`A box holds 10 ${many}, so it has 10 × ${m} = ${fmt(m * 10)} ${thing}.`, 'A crate holds 10 boxes, so every digit slides one more place to the left.', `So a crate has ${fmt(m * 100)} ${thing}.`] }
    return { text: `A crate holds 10 boxes, and each box holds 10 ${many}. The crate has ${fmt(m * 100)} ${thing}. How many ${thing} are in one ${one}?`,
      picture: chart(5, [String(m * 100)]), answer: m,
      steps: [`One box is 1/10 of the crate: 1/10 of ${fmt(m * 100)} is ${fmt(m * 10)}.`, `One ${one} is 1/10 of a box: 1/10 of ${fmt(m * 10)} is ${m}.`, `So one ${one} has ${m} ${thing}.`] }
  } },
]

// ── t3 · Exponents and powers of 10 ───────────────────────────────────────────────────────────────────────
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const pow = (k: number) => `10${[...String(k)].map(c => SUP[+c]).join('')}`
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight']

const T3: Level[] = [
  { style: 'power to a number', make: r => {
    const k = int(r, 2, 7)
    return { text: `Write ${pow(k)} as a number.`, picture: eq(`${pow(k)} = ?`), answer: 10 ** k,
      steps: [`The small ${k} means ${WORDS[k]} 10s multiplied.`, `Each 10 adds one zero, so it is a 1 with ${k} zeros.`, `So ${pow(k)} = ${fmt(10 ** k)}.`] }
  } },
  { style: 'number to its exponent', make: r => {
    const k = int(r, 2, 7)
    return { text: `Write ${fmt(10 ** k)} the short way, as 10 with a small number up top. What is the small number?`,
      picture: eq(`${fmt(10 ** k)}`, ['= 10 with how many 10s?']), answer: k,
      steps: [`${fmt(10 ** k)} is a 1 with ${WORDS[k]} zeros, so it is ${WORDS[k]} 10s multiplied.`, `The small number is ${k}.`] }
  } },
  { style: 'multiply or divide by a power', make: r => {
    const m = twoDigit(r), k = int(r, 1, 4)
    if (r() < 0.5) return { text: `Multiply. ${m} × ${pow(k)} = ?`, picture: eq(`${m} × ${pow(k)} = ?`), answer: m * 10 ** k,
      steps: [`The small ${k} means slide every digit ${k === 1 ? 'one place' : `${k} places`} to the left.`, 'Zeros fill the empty places.', `So ${m} × ${pow(k)} = ${fmt(m * 10 ** k)}.`] }
    return { text: `Divide. ${fmt(m * 10 ** k)} ÷ ${pow(k)} = ?`, picture: eq(`${fmt(m * 10 ** k)} ÷ ${pow(k)} = ?`), answer: m,
      steps: [`The small ${k} means slide every digit ${k === 1 ? 'one place' : `${k} places`} to the right.`, 'The zeros slide off.', `So ${fmt(m * 10 ** k)} ÷ ${pow(k)} = ${m}.`] }
  } },
  { style: 'pick the true sentence (not 10 × the exponent)', make: r => {
    const k = int(r, 2, 6), right = `${pow(k)} = ${fmt(10 ** k)}`
    return { text: 'Which one is true?', picture: eq(pow(k)),
      answer: choose(r, right, [`${pow(k)} = ${10 * k}`, `${pow(k)} = ${fmt(10 ** (k + 1))}`]),
      steps: ['Do not multiply 10 by the small number.', `The small ${k} means ${WORDS[k]} 10s multiplied, so it is a 1 with ${k} zeros.`, `So ${right}.`] }
  } },
  { style: 'two-step story with a power', make: r => {
    const m = twoDigit(r), a = int(r, 2, 3)
    if (r() < 0.5) {
      const day = m * 10 ** a
      return { text: `A farm packs ${m} boxes of seeds each day. Each box holds ${pow(a)} seeds. How many seeds does the farm pack in 10 days?`,
        picture: eq(`${m} × ${pow(a)} = ?`, ['? × 10 = ?']), answer: day * 10,
        steps: [`First find one day: ${m} × ${pow(a)} = ${fmt(day)}.`, `Then 10 days: ${fmt(day)} × 10 slides every digit one more place to the left.`, `So the farm packs ${fmt(day * 10)} seeds.`] }
    }
    const total = m * 10 ** (a + 1), park = total / 10
    return { text: `A city has ${fmt(total)} flowers. It shares them equally among 10 parks. Each park plants its flowers in beds of ${pow(a)}. How many beds does each park fill?`,
      picture: eq(`${fmt(total)} ÷ 10 = ?`, [`? ÷ ${pow(a)} = ?`]), answer: m,
      steps: [`First share among the parks: ${fmt(total)} ÷ 10 = ${fmt(park)}.`, `Then ${fmt(park)} ÷ ${pow(a)} slides every digit ${a} places to the right.`, `So each park fills ${m} beds.`] }
  } },
]

// ── t4 · Estimate products and quotients ──────────────────────────────────────────────────────────────────
const PRODUCT_RULE = 'Round each number to its biggest place, then multiply.'
const QUOTIENT_RULE = 'Round the number you divide by to the nearest ten and the other number to the nearest hundred, then divide.'
/** A 2-digit number and a 3-digit number, each with the round number it goes to (never a 5 on the rounding digit). */
const nearPair = (r: Rng) => {
  const a = int(r, 2, 9), b = int(r, 1, 9), A = a * 10, B = b * 100
  const x = A + pick(r, [-3, -2, -1, 1, 2, 3, 4])
  const y = B + (b === 1 ? 1 : pick(r, [-1, 1])) * (int(r, 0, 4) * 10 + int(r, 1, 9))
  return { a, b, A, B, x, y, P: A * B }
}

const T4: Level[] = [
  { style: 'round numbers given: a fact, then the zeros', make: r => {
    const { a, b, A, B, x, y } = nearPair(r)
    return { text: `${x} × ${fmt(y)} is close to ${A} × ${fmt(B)}. Use a fact you know, then write the zeros. What is ${A} × ${fmt(B)}?`,
      picture: eq(`${a} × ${b} = ${a * b}`, [`${A} × ${fmt(B)} = ?`]), answer: A * B,
      steps: [`${a} × ${b} = ${a * b}.`, `${A} has one zero and ${fmt(B)} has two, so write three zeros after the ${a * b}.`, `So ${A} × ${fmt(B)} = ${fmt(A * B)}.`] }
  } },
  { style: 'pick the right estimate (keep every zero)', make: r => {
    const { a, b, A, B, x, y, P } = nearPair(r), right = `about ${fmt(P)}`
    return { text: `${PRODUCT_RULE} Which is the best estimate for ${x} × ${fmt(y)}?`, picture: eq(`${x} × ${fmt(y)}`, ['about how much?']),
      answer: choose(r, right, [`about ${fmt(P / 10)}`, `about ${fmt(P * 10)}`]),
      steps: [`${x} rounds to ${A}, and ${fmt(y)} rounds to ${fmt(B)}.`, `${a} × ${b} = ${a * b}, and the round numbers have three zeros in all.`, `So the best estimate is ${right}.`] }
  } },
  { style: 'estimate a product', make: r => {
    const { a, b, A, B, x, y, P } = nearPair(r)
    return { text: `${PRODUCT_RULE} About how much is ${x} × ${fmt(y)}?`, picture: eq(`${x} × ${fmt(y)}`), answer: P,
      steps: [`${x} rounds to ${A}, and ${fmt(y)} rounds to ${fmt(B)}.`, `${a} × ${b} = ${a * b}. Then write the three zeros from ${A} and ${fmt(B)}.`, `So ${x} × ${fmt(y)} is about ${fmt(P)}.`] }
  } },
  { style: 'story, estimate a quotient', make: r => {
    const d = int(r, 2, 9), q = int(r, 2, 9), D = d * 10, R = d * q * 100
    const x = D + pick(r, [-3, -2, -1, 1, 2, 3, 4]), T = R + pick(r, [-40, -30, -20, -10, 10, 20, 30, 40])
    const [start, group] = pick(r, [[`A library has ${fmt(T)} books to put on shelves. Each shelf holds ${x} books.`, 'shelves can the library fill'],
      [`A farm has ${fmt(T)} eggs to pack. Each crate holds ${x} eggs.`, 'crates can the farm fill'],
      [`A class has ${fmt(T)} stickers to put in albums. Each album holds ${x} stickers.`, 'albums can the class fill']] as const)
    return { text: `${start} ${QUOTIENT_RULE} About how many ${group}?`, picture: eq(`${fmt(T)} ÷ ${x}`), answer: q * 10,
      steps: [`${x} rounds to ${D}, and ${fmt(T)} rounds to ${fmt(R)}.`, `${d * q} ÷ ${d} = ${q}, and ${D} × ${q * 10} = ${fmt(R)}.`, `So it is about ${q * 10}.`] }
  } },
  { style: 'two-step story (estimate two products, then add)', make: r => {
    const p1 = nearPair(r), p2 = nearPair(r), sum = p1.P + p2.P
    return { text: `A school buys ${p1.x} boxes with ${fmt(p1.y)} pencils in each, and ${p2.x} boxes with ${fmt(p2.y)} erasers in each. ${PRODUCT_RULE} About how many pencils and erasers is that in all?`,
      picture: eq(`${p1.x} × ${fmt(p1.y)}`, [`${p2.x} × ${fmt(p2.y)}`]), answer: sum,
      steps: [`Pencils: ${p1.x} × ${fmt(p1.y)} is about ${p1.A} × ${fmt(p1.B)} = ${fmt(p1.P)}.`, `Erasers: ${p2.x} × ${fmt(p2.y)} is about ${p2.A} × ${fmt(p2.B)} = ${fmt(p2.P)}.`, `${fmt(p1.P)} + ${fmt(p2.P)} = ${fmt(sum)}, so it is about ${fmt(sum)} in all.`] }
  } },
]

// ── t5 · Convert metric units ─────────────────────────────────────────────────────────────────────────────
interface Unit { big: string; small: string; bs: string; ss: string; f: number }
const UNITS: Unit[] = [
  { big: 'kilometer', small: 'meter', bs: 'km', ss: 'm', f: 1000 },
  { big: 'meter', small: 'centimeter', bs: 'm', ss: 'cm', f: 100 },
  { big: 'centimeter', small: 'millimeter', bs: 'cm', ss: 'mm', f: 10 },
  { big: 'kilogram', small: 'gram', bs: 'kg', ss: 'g', f: 1000 },
  { big: 'liter', small: 'milliliter', bs: 'L', ss: 'mL', f: 1000 },
]
/** Stories for each unit: [to the smaller unit, to the bigger unit], by the bs of the unit. */
const STORY5: Record<string, [(q: number) => string, (n: string) => string]> = {
  km: [q => `The bike trail is ${q} kilometers long. How many meters long is it?`, n => `A bus drives ${n} meters to school. How many kilometers is that?`],
  m: [q => `A rope is ${q} meters long. How many centimeters long is it?`, n => `A hallway is ${n} centimeters long. How many meters long is it?`],
  cm: [q => `A crayon is ${q} centimeters long. How many millimeters long is it?`, n => `A pencil is ${n} millimeters long. How many centimeters long is it?`],
  kg: [q => `A bag of apples weighs ${q} kilograms. How many grams does it weigh?`, n => `A box of books weighs ${n} grams. How many kilograms does it weigh?`],
  L: [q => `A fish tank holds ${q} liters of water. How many milliliters does it hold?`, n => `A pot holds ${n} milliliters of soup. How many liters does it hold?`],
}
const smaller = (u: Unit, q: number) => [`${cap(u.small)}s are smaller, so there are more of them. Multiply.`, `1 ${u.big} is ${fmt(u.f)} ${u.small}s, so find ${q} × ${fmt(u.f)}.`]
const bigger = (u: Unit, n: number) => [`${cap(u.big)}s are bigger, so there are fewer of them. Divide.`, `${fmt(u.f)} ${u.small}s is 1 ${u.big}, so find ${fmt(n)} ÷ ${fmt(u.f)}.`]

const T5: Level[] = [
  { style: 'unit table, to the smaller unit', make: r => {
    const u = pick(r, UNITS), q = int(r, 2, 9)
    return { text: `How many ${u.small}s is ${q} ${u.big}s?`, picture: { kind: 'table', head: [u.bs, u.ss], rows: [['1', fmt(u.f)], [String(q), '?']] },
      answer: q * u.f, steps: [...smaller(u, q), `So ${q} ${u.big}s is ${fmt(q * u.f)} ${u.small}s.`] }
  } },
  { style: 'bare numbers, to the bigger unit', make: r => {
    const u = pick(r, UNITS), q = u.f === 1000 ? int(r, 2, 20) : int(r, 11, 60), n = q * u.f
    return { text: `How many ${u.big}s is ${fmt(n)} ${u.small}s?`, picture: eq(`${fmt(n)} ${u.ss} = ? ${u.bs}`), answer: q,
      steps: [...bigger(u, n), `So ${fmt(n)} ${u.small}s is ${q} ${u.big}s.`] }
  } },
  { style: 'story, either way', make: r => {
    const u = pick(r, UNITS), [toSmall, toBig] = STORY5[u.bs]
    if (r() < 0.5) {
      const q = int(r, 2, 9)
      return { text: toSmall(q), picture: eq(`${q} ${u.bs}`, [`1 ${u.bs} = ${fmt(u.f)} ${u.ss}`]), answer: q * u.f,
        steps: [...smaller(u, q), `So it is ${fmt(q * u.f)} ${u.small}s.`] }
    }
    const q = u.f === 1000 ? int(r, 2, 9) : int(r, 11, 19), n = q * u.f
    return { text: toBig(fmt(n)), picture: eq(`${fmt(n)} ${u.ss}`, [`${fmt(u.f)} ${u.ss} = 1 ${u.bs}`]), answer: q,
      steps: [...bigger(u, n), `So it is ${q} ${u.big}s.`] }
  } },
  { style: 'pick the true sentence (multiply or divide?)', make: r => {
    const u = pick(r, UNITS), q = int(r, 2, 9), n = q * u.f
    if (r() < 0.5) {
      const right = `${fmt(n)} ${u.ss} = ${q} ${u.bs}`
      return { text: 'Which one is true?', picture: eq(`${fmt(n)} ${u.ss} in ${u.big}s`),
        answer: choose(r, right, [`${fmt(n)} ${u.ss} = ${fmt(n * u.f)} ${u.bs}`, `${fmt(n)} ${u.ss} = ${fmt(n)} ${u.bs}`]),
        steps: [`${cap(u.big)}s are bigger, so there are fewer of them. Divide, do not multiply.`, `${fmt(n)} ÷ ${fmt(u.f)} = ${q}.`, `So ${right}.`] }
    }
    const right = `${q} ${u.bs} = ${fmt(n)} ${u.ss}`
    return { text: 'Which one is true?', picture: eq(`${q} ${u.bs} in ${u.small}s`),
      answer: choose(r, right, [`${q} ${u.bs} = ${q} ${u.ss}`, `${q} ${u.bs} = ${fmt(n * u.f)} ${u.ss}`]),
      steps: [`${cap(u.small)}s are smaller, so there are more of them. Multiply once.`, `${q} × ${fmt(u.f)} = ${fmt(n)}.`, `So ${right}.`] }
  } },
  { style: 'missing number, work backwards', make: r => {
    const u = pick(r, UNITS), q = int(r, 2, 40), n = q * u.f
    if (r() < 0.5) return { text: `What number goes in the box? ? ${u.ss} = ${q} ${u.bs}`, picture: eq(`? ${u.ss} = ${q} ${u.bs}`), answer: n,
      steps: [`The box counts ${u.small}s, the smaller unit, so there are more of them.`, `1 ${u.big} is ${fmt(u.f)} ${u.small}s, so find ${q} × ${fmt(u.f)}.`, `The missing number is ${fmt(n)}.`] }
    return { text: `What number goes in the box? ? ${u.bs} = ${fmt(n)} ${u.ss}`, picture: eq(`? ${u.bs} = ${fmt(n)} ${u.ss}`), answer: q,
      steps: [`The box counts ${u.big}s, the bigger unit, so there are fewer of them.`, `${fmt(u.f)} ${u.small}s is 1 ${u.big}, so find ${fmt(n)} ÷ ${fmt(u.f)}.`, `The missing number is ${q}.`] }
  } },
]

// ── t6 · Metric word problems ─────────────────────────────────────────────────────────────────────────────
const [KM, M, , KG, L] = UNITS
/** Filling equal parts: the whole in the big unit, each part in the small unit. */
const FILL = [
  { u: L, sizes: [100, 200, 250, 500], whole: (a: number) => `A jug holds ${a} liters of juice.`, each: (c: number) => `Each cup holds ${c} milliliters.`, parts: 'cups', verb: 'fill', pic: (a: number, c: number) => eq(`${a} L of juice`, [`${c} mL in each cup`]) },
  { u: KG, sizes: [100, 200, 250, 500], whole: (a: number) => `A sack holds ${a} kilograms of rice.`, each: (c: number) => `Each small bag holds ${c} grams.`, parts: 'small bags', verb: 'fill', pic: (a: number, c: number) => eq(`${a} kg of rice`, [`${c} g in each small bag`]) },
  { u: M, sizes: [20, 25, 50], whole: (a: number) => `A ribbon is ${a} meters long.`, each: (c: number) => `Each bow needs ${c} centimeters.`, parts: 'bows', verb: 'make', pic: (a: number, c: number) => eq(`${a} m of ribbon`, [`${c} cm for each bow`]) },
]

const T6: Level[] = [
  { style: 'tape story, add or take away after changing unit', make: r => {
    const [u, add, story] = pick(r, [
      [KG, true, (a: number, b: string) => `A bowl has ${a} kilograms of flour. You pour in ${b} grams more. How many grams of flour are in the bowl now?`],
      [M, false, (a: number, b: string) => `A ribbon is ${a} meters long. You cut off ${b} centimeters. How many centimeters of ribbon are left?`],
      [L, false, (a: number, b: string) => `A pot has ${a} liters of soup. You ladle out ${b} milliliters. How many milliliters of soup are left?`],
      [KM, true, (a: number, b: string) => `Ben walks ${a} kilometers, then ${b} meters more. How many meters does he walk in all?`],
    ] as const)
    const a = int(r, 2, 6), b = u.f === 100 ? int(r, 11, 95) : int(r, 11, 95) * 10, whole = a * u.f, ans = add ? whole + b : whole - b
    const picture: Picture = add
      ? { kind: 'tape', rows: [{ label: u.ss, cells: [{ w: 3, text: `${a} ${u.bs}` }, { w: 1, text: `${fmt(b)} ${u.ss}`, shade: true }], brace: `? ${u.ss}` }] }
      : { kind: 'tape', rows: [{ label: u.ss, cells: [{ w: 5, text: '?' }, { w: 2, text: `${fmt(b)} ${u.ss}`, shade: true }], brace: `${a} ${u.bs}` }] }
    return { text: story(a, fmt(b)), picture, answer: ans,
      steps: [`${a} ${u.big}s is ${fmt(whole)} ${u.small}s.`, `Now both are in ${u.small}s, so ${add ? `add: ${fmt(whole)} + ${fmt(b)}` : `take away: ${fmt(whole)} − ${fmt(b)}`}.`, `So the answer is ${fmt(ans)} ${u.small}s.`] }
  } },
  { style: 'pick the number sentence (same unit first)', make: r => {
    const s = pick(r, FILL), a = int(r, 2, 6), c = pick(r, s.sizes), right = `${fmt(a * s.u.f)} ÷ ${c}`
    return { text: `${s.whole(a)} ${s.each(c)} Which number sentence finds how many ${s.parts} you can ${s.verb}?`, picture: s.pic(a, c),
      answer: choose(r, right, [`${a} ÷ ${c}`, `${a} × ${c}`]),
      steps: [`The two numbers are in different units, so change first: ${a} ${s.u.big}s is ${fmt(a * s.u.f)} ${s.u.small}s.`, 'Then divide by the size of one part.', `So the number sentence is ${right}.`] }
  } },
  { style: 'how many fit (change unit, then divide)', make: r => {
    const s = pick(r, FILL), a = int(r, 2, 6), c = pick(r, s.sizes), per = s.u.f / c, ans = a * per
    return { text: `${s.whole(a)} ${s.each(c)} How many ${s.parts} can you ${s.verb}?`, picture: s.pic(a, c), answer: ans,
      steps: [`${a} ${s.u.big}s is ${fmt(a * s.u.f)} ${s.u.small}s.`, `${per} parts of ${c} make ${fmt(s.u.f)} ${s.u.small}s, so ${fmt(a * s.u.f)} ${s.u.small}s make ${a} × ${per}.`, `So you can ${s.verb} ${ans} ${s.parts}.`] }
  } },
  { style: 'the same amount each day (change unit, then multiply)', make: r => {
    const [u, story] = pick(r, [
      [L, (a: number, d: number) => `A kitchen makes ${a} liters of soup each day. How many milliliters of soup does it make in ${d} days?`],
      [KM, (a: number, d: number) => `A runner runs ${a} kilometers each day. How many meters does she run in ${d} days?`],
      [KG, (a: number, d: number) => `A bakery uses ${a} kilograms of flour each day. How many grams of flour does it use in ${d} days?`],
    ] as const)
    const a = int(r, 2, 9), d = int(r, 2, 7), ans = a * u.f * d
    return { text: story(a, d), picture: { kind: 'tape', rows: [{ label: u.ss, cells: Array.from({ length: d }, () => ({ w: 1, text: `${a} ${u.bs}` })), brace: `? ${u.ss}` }] },
      answer: ans,
      steps: [`${a} ${u.big}s is ${fmt(a * u.f)} ${u.small}s.`, `It is the same each day for ${d} days: ${d} × ${fmt(a * u.f)}.`, `So it is ${fmt(ans)} ${u.small}s.`] }
  } },
  { style: 'three-step story (change, multiply, take away)', make: r => {
    const [u, sizes, as, story, pieces] = pick(r, [
      [L, [150, 200, 250, 300], [2, 3], (a: number, n: number, c: number) => `A bottle holds ${a} liters of water. You pour ${n} glasses of ${c} milliliters each. How many milliliters of water are left?`, 'glasses'],
      [M, [15, 20, 25, 30, 35], [2, 4], (a: number, n: number, c: number) => `A ribbon is ${a} meters long. You cut ${n} pieces of ${c} centimeters each. How many centimeters of ribbon are left?`, 'pieces'],
      [KG, [200, 250, 300, 400], [3, 5], (a: number, n: number, c: number) => `A sack holds ${a} kilograms of rice. You fill ${n} bags of ${c} grams each. How many grams of rice are left?`, 'bags'],
    ] as const)
    let a = 0, n = 0, c = 0, used = 0, ans = 0
    do { a = int(r, as[0], as[1]); n = int(r, 2, 5); c = pick(r, sizes); used = n * c; ans = a * u.f - used } while (ans === c || ans <= 0)
    return { text: story(a, n, c), picture: eq(`${a} ${u.bs} to start`, [`${n} ${pieces} of ${c} ${u.ss}`]), answer: ans,
      steps: [`${a} ${u.big}s is ${fmt(a * u.f)} ${u.small}s.`, `The ${n} ${pieces} use ${n} × ${c} = ${fmt(used)} ${u.small}s.`, `${fmt(a * u.f)} − ${fmt(used)} = ${fmt(ans)}, so ${fmt(ans)} ${u.small}s are left.`] }
  } },
]

export const LADDERS_A: Record<string, Level[]> = { 'g5m1-t1': T1, 'g5m1-t3': T3, 'g5m1-t4': T4, 'g5m1-t5': T5, 'g5m1-t6': T6 }
