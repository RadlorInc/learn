/**
 * Grade 8 · Module 1 — integer exponents, scientific notation, square and cube roots: the practice ladders (see ../adaptive.ts).
 * Every level is a different KIND of question; numbers are picked per problem and the answer computed from them.
 * As in the lessons, the child types ONE number: a new exponent, a value, a front number, a root — or picks.
 */
import type { Picture } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const cards = (wrong: string, right: string): Picture => ({ kind: 'cards', wrong, right })
const table = (head: string[], rows: string[][]): Picture => ({ kind: 'table', head, rows })
/** One tape row of factors, each 1 wide; the first `shade` cells are shaded. */
const row = (base: number, n: number, label?: string, shade = 0) =>
  ({ label, cells: Array.from({ length: n }, (_, i) => ({ w: 1, text: String(base), shade: i < shade })) })

const choose = (r: Rng, right: string, wrong: string[]) => {
  const choices = shuffle(r, [right, ...wrong])
  return { choices, correct: choices.indexOf(right) }
}
/** Re-roll until `ok` — every generator here has plenty of good numbers, so this ends quickly. */
const until = <T>(make: () => T, ok: (t: T) => boolean): T => { let t = make(); while (!ok(t)) t = make(); return t }
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const sup = (n: number) => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map(d => SUP[+d]).join('')
/** base with a raised exponent, e.g. pw(2, -3) → "2⁻³". */
const pw = (b: number, e: number) => `${b}${sup(e)}`
/** A signed number the way the lessons write it: −3, not -3. */
const num = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n))
const W = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
const KIDS = ['Mia', 'Leo', 'Ava', 'Ben', 'Zoe', 'Sam'] as const
const BASES = [2, 3, 4, 5, 6, 7, 9, 10] as const
const clean = (n: number) => Math.round(n * 1e9) / 1e9

/** Does the picture print `n` as a number in any of its labels? (Mirrors the gate, so a re-roll can avoid it.) */
const shows = (pic: Picture, n: number) => {
  const texts: string[] = []
  const walk = (v: unknown) => {
    if (typeof v === 'string') texts.push(v)
    else if (Array.isArray(v)) { if (v.length && v.every(x => typeof x === 'string')) texts.push(v.join('')); v.forEach(walk) }
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  walk(pic)
  return texts.some(t => (t.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).some(m => m.replace(/,/g, '') === String(Math.abs(n))))
}
type P = { text: string; picture: Picture; answer: number; steps: string[] }
/** Re-roll a number problem until its picture does not print its answer. */
const hidden = (make: () => P) => until(make, p => Math.abs(p.answer) < 10 || !shows(p.picture, p.answer))

// ── t1 · Multiply powers: add the exponents ──────────────────────────────────────────────────────────────
const T1: Level[] = [
  { style: 'every factor written out', make: r => {
    const b = int(r, 2, 9), a = int(r, 2, 4), c = int(r, 2, 4), s = a + c
    return { text: `${pw(b, a)} × ${pw(b, c)} is ${W[a]} ${b}s multiplied, then ${W[c]} more. Written as ${b} with one exponent, what is the exponent?`,
      picture: { kind: 'tape', rows: [row(b, a, pw(b, a)), row(b, c, pw(b, c))] }, answer: s,
      steps: [`${pw(b, a)} is ${W[a]} ${b}s, and ${pw(b, c)} is ${W[c]} more ${b}s.`, `Count them all: ${a} + ${c} = ${s}.`, `So the exponent is ${s}.`] }
  } },
  { style: 'bare, same base', make: r => hidden(() => {
    const b = pick(r, BASES), a = int(r, 2, 12), c = int(r, 2, 12), s = a + c
    return { text: `Write ${pw(b, a)} × ${pw(b, c)} as ${b} with one exponent. What is the exponent?`,
      picture: eq(`${pw(b, a)} × ${pw(b, c)} = ${b}^?`), answer: s,
      steps: [`Both parts have base ${b}, so the base stays ${b}.`, `Add the exponents: ${a} + ${c}.`, `So the exponent is ${s}.`] }
  }) },
  { style: 'pick the equal one, past the traps', make: r => {
    const { b, a, c } = until(() => ({ b: int(r, 2, 9), a: int(r, 2, 9), c: int(r, 2, 9) }), ({ a, c }) => a * c !== a + c && a * c !== 2 * (a + c))
    const right = pw(b, a + c)
    return { text: `Which is the same as ${pw(b, a)} × ${pw(b, c)}?`, picture: eq(`${pw(b, a)} × ${pw(b, c)}`),
      answer: choose(r, right, [pw(b, a * c), pw(b * b, a + c), pw(b * b, a * c)]),
      steps: [`The base is ${b} in both parts, so keep the ${b}. Don't multiply the bases.`, `Add the exponents, don't multiply them: ${a} + ${c} = ${a + c}.`, `So it is ${right}.`] }
  } },
  { style: 'missing exponent, work backwards', make: r => hidden(() => {
    const b = pick(r, BASES), a = int(r, 2, 9), m = int(r, 2, 9), t = a + m
    return { text: `Fill in the missing exponent: ${pw(b, a)} × ${b}^? = ${pw(b, t)}. What number goes in place of the ?`,
      picture: eq(`${pw(b, a)} × ${b}^? = ${pw(b, t)}`), answer: m,
      steps: [`Same base, so the exponents add: ${a} + ? = ${t}.`, `Work backwards: ${t} − ${a} = ${m}.`, `So the missing exponent is ${m}.`] }
  }) },
  { style: 'three factors in a story, one of them a lone base', make: r => hidden(() => {
    if (r() < 0.5) {
      const a = int(r, 2, 6), b = int(r, 2, 8), c = int(r, 3, 10), s = a + b + c
      return { text: `A data center has ${pw(2, a)} racks. Each rack holds ${pw(2, b)} drives, and each drive holds ${pw(2, c)} folders. Written as 2 with one exponent, how many folders is that? Type the exponent.`,
        picture: eq(`${pw(2, a)} × ${pw(2, b)} × ${pw(2, c)} = 2^?`), answer: s,
        steps: ['Every rack and every drive holds the same number, so multiply all three.', `Same base 2: add the exponents, ${a} + ${b} + ${c}.`, `So the exponent is ${s}.`] }
    }
    const a = int(r, 2, 6), b = int(r, 2, 5), s = a + b + 1
    return { text: `A factory fills ${pw(10, a)} crates. Each crate holds ${pw(10, b)} boxes, and each box holds 10 paper clips. Written as 10 with one exponent, how many paper clips is that? Type the exponent.`,
      picture: eq(`${pw(10, a)} × ${pw(10, b)} × 10 = 10^?`), answer: s,
      steps: ['A lone 10 is 10¹, one 10.', `Same base 10: add the exponents, ${a} + ${b} + 1.`, `So the exponent is ${s}.`] }
  }) },
]

// ── t2 · Divide powers: subtract the exponents ───────────────────────────────────────────────────────────
const T2: Level[] = [
  { style: 'cancel in pairs on a tape', make: r => {
    const b = int(r, 2, 9), a = int(r, 4, 7), c = int(r, 2, a - 1), d = a - c
    return { text: `In ${pw(b, a)} ÷ ${pw(b, c)}, each ${b} on the bottom cancels one ${b} on the top. Written as ${b} with one exponent, what is the exponent?`,
      picture: { kind: 'tape', rows: [row(b, a, 'top', c), row(b, c, 'bottom', c)] }, answer: d,
      steps: [`${W[c][0].toUpperCase() + W[c].slice(1)} pairs cancel, one for each ${b} on the bottom.`, `That leaves ${a} − ${c} = ${d} on top.`, `So the exponent is ${d}.`] }
  } },
  { style: 'bare, top minus bottom', make: r => hidden(() => {
    const b = pick(r, BASES), a = int(r, 5, 20), c = int(r, 2, a - 2), d = a - c
    return { text: `Write ${pw(b, a)} ÷ ${pw(b, c)} as ${b} with one exponent. What is the exponent?`,
      picture: eq(`${pw(b, a)} ÷ ${pw(b, c)} = ${b}^?`), answer: d,
      steps: [`The base is ${b} on top and bottom, so it stays ${b}.`, `Subtract the exponents, top minus bottom: ${a} − ${c}.`, `So the exponent is ${d}.`] }
  }) },
  { style: 'fix the divided-exponents mistake', make: r => hidden(() => {
    const { c, q } = until(() => ({ c: int(r, 2, 5), q: int(r, 2, 6) }), ({ c, q }) => q !== c * q - c)
    const b = pick(r, BASES), a = c * q, d = a - c, who = pick(r, KIDS)
    return { text: `${who} says ${pw(b, a)} ÷ ${pw(b, c)} = ${pw(b, q)}, because ${a} ÷ ${c} = ${q}. What should the exponent really be?`,
      picture: cards(`${pw(b, a)} ÷ ${pw(b, c)} = ${pw(b, q)}`, `${pw(b, a)} ÷ ${pw(b, c)} = ${b}^?`), answer: d,
      steps: ['Dividing powers subtracts the exponents. It does not divide them.', `Top minus bottom: ${a} − ${c} = ${d}.`, `So the exponent is ${d}.`] }
  }) },
  { style: 'missing bottom exponent', make: r => hidden(() => {
    const b = pick(r, BASES), a = int(r, 6, 15), k = int(r, 2, a - 2), m = a - k
    return { text: `Fill in the missing exponent: ${pw(b, a)} ÷ ${b}^? = ${pw(b, k)}. What number goes in place of the ?`,
      picture: eq(`${pw(b, a)} ÷ ${b}^? = ${pw(b, k)}`), answer: m,
      steps: [`Top minus bottom makes ${k}: ${a} − ? = ${k}.`, `Work backwards: ${a} − ${k} = ${m}.`, `So the missing exponent is ${m}.`] }
  }) },
  { style: 'multiply on top, then divide', make: r => hidden(() => {
    const a = int(r, 2, 9), c = int(r, 2, 9), d = int(r, 2, a + c - 1), s = a + c - d
    const steps = [`Multiply on top first: ${a} + ${c} = ${a + c}.`, `Now divide: top minus bottom, ${a + c} − ${d}.`, `So the exponent is ${s}.`]
    if (r() < 0.5) {
      return { text: `A file has ${pw(2, a)} bytes. It is copied ${pw(2, c)} times, and all the copies together are split into ${pw(2, d)} equal pieces. Written as 2 with one exponent, how many bytes are in each piece? Type the exponent.`,
        picture: eq(`(${pw(2, a)} × ${pw(2, c)}) ÷ ${pw(2, d)} = 2^?`), answer: s, steps }
    }
    const b = pick(r, BASES)
    return { text: `Write (${pw(b, a)} × ${pw(b, c)}) ÷ ${pw(b, d)} as ${b} with one exponent. What is the exponent?`,
      picture: eq(`(${pw(b, a)} × ${pw(b, c)}) ÷ ${pw(b, d)} = ${b}^?`), answer: s, steps }
  }) },
]

// ── t3 · A power of a power ──────────────────────────────────────────────────────────────────────────────
const T3: Level[] = [
  { style: 'copies written out', make: r => hidden(() => {
    const b = int(r, 2, 9), a = int(r, 2, 4), n = int(r, 2, 3), s = a * n
    return { text: `(${pw(b, a)})${sup(n)} is ${W[n]} copies of ${pw(b, a)} multiplied. Written as ${b} with one exponent, what is the exponent?`,
      picture: { kind: 'tape', rows: Array.from({ length: n }, (_, k) => row(b, a, `copy ${k + 1}`)) }, answer: s,
      steps: [`Each copy has ${W[a]} ${b}s, and there are ${W[n]} copies.`, `Count every ${b}: ${a} × ${n} = ${s}.`, `So the exponent is ${s}.`] }
  }) },
  { style: 'bare, multiply the exponents', make: r => hidden(() => {
    const b = pick(r, BASES), a = int(r, 2, 9), n = int(r, 2, 6), s = a * n
    return { text: `Write (${pw(b, a)})${sup(n)} as ${b} with one exponent. What is the exponent?`,
      picture: eq(`(${pw(b, a)})${sup(n)} = ${b}^?`), answer: s,
      steps: [`(${pw(b, a)})${sup(n)} is ${W[n]} copies of ${pw(b, a)}.`, `Multiply the exponents: ${a} × ${n}.`, `So the exponent is ${s}.`] }
  }) },
  { style: 'pick: add, multiply or power the exponents', make: r => {
    const { b, a, n } = until(() => ({ b: int(r, 2, 9), a: int(r, 2, 4), n: int(r, 2, 4) }), ({ a, n }) => !(a === 2 && n === 2) && a ** n <= 81)
    const right = pw(b, a * n)
    return { text: `Which is the same as (${pw(b, a)})${sup(n)}?`, picture: eq(`(${pw(b, a)})${sup(n)}`),
      answer: choose(r, right, [pw(b, a + n), pw(b, a ** n)]),
      steps: [`The outside exponent ${n} counts copies of ${pw(b, a)}. Adding the exponents is the trap.`, `Copies of the same power: multiply the exponents, ${a} × ${n} = ${a * n}.`, `So it is ${right}.`] }
  } },
  { style: 'missing exponent, work backwards', make: r => hidden(() => {
    const b = pick(r, BASES), a = int(r, 2, 9), n = int(r, 2, 5), t = a * n
    if (r() < 0.5) {
      return { text: `Fill in the missing exponent: (${b}^?)${sup(n)} = ${pw(b, t)}. What number goes in place of the ?`,
        picture: eq(`(${b}^?)${sup(n)} = ${pw(b, t)}`), answer: a,
        steps: [`The exponents multiply: ? × ${n} = ${t}.`, `Work backwards: ${t} ÷ ${n} = ${a}.`, `So the missing exponent is ${a}.`] }
    }
    return { text: `Fill in the missing exponent: (${pw(b, a)})^? = ${pw(b, t)}. What number goes in place of the ?`,
      picture: eq(`(${pw(b, a)})^? = ${pw(b, t)}`), answer: n,
      steps: [`The exponents multiply: ${a} × ? = ${t}.`, `Work backwards: ${t} ÷ ${a} = ${n}.`, `So the missing exponent is ${n}.`] }
  }) },
  { style: 'area or volume story, then multiply', make: r => hidden(() => {
    if (r() < 0.5) {
      const a = int(r, 2, 6), c = int(r, 2, 9), s = 2 * a + c
      return { text: `A square tile is ${pw(2, a)} millimeters on each side, so its area is (${pw(2, a)})² square millimeters. A wall uses ${pw(2, c)} of these tiles. Written as 2 with one exponent, what is the wall's tiled area? Type the exponent.`,
        picture: eq(`(${pw(2, a)})² × ${pw(2, c)} = 2^?`), answer: s,
        steps: [`First the power of a power: (${pw(2, a)})² = ${pw(2, 2 * a)}, because ${a} × 2 = ${2 * a}.`, `Then ${pw(2, 2 * a)} × ${pw(2, c)} has the same base, so add: ${2 * a} + ${c}.`, `So the exponent is ${s}.`] }
    }
    const a = int(r, 1, 3), c = int(r, 2, 6), s = 3 * a + c
    const side = a === 1 ? '10' : pw(10, a), vol = a === 1 ? '10³' : `(${side})³`
    return { text: `A box shaped like a cube is ${side} centimeters on each side, so its volume is ${vol} cubic centimeters. A truck carries ${pw(10, c)} of these boxes. Written as 10 with one exponent, what is the volume of all the boxes? Type the exponent.`,
      picture: eq(`${vol} × ${pw(10, c)} = 10^?`), answer: s,
      steps: [a === 1 ? `First, 10 is 10¹, so ${vol} = ${pw(10, 3)}.` : `First the power of a power: ${vol} = ${pw(10, 3 * a)}, because ${a} × 3 = ${3 * a}.`, `Then ${pw(10, 3 * a)} × ${pw(10, c)} has the same base, so add: ${3 * a} + ${c}.`, `So the exponent is ${s}.`] }
  }) },
]

// ── t4 · Zero and negative exponents ─────────────────────────────────────────────────────────────────────
const T4: Level[] = [
  { style: 'keep dividing along a table', make: r => {
    const b = pick(r, [2, 3, 4, 5, 6, 10]), k = int(r, 1, 2), P = b ** k
    return { text: `Each step to the right divides by ${b}. What is ${pw(b, -k)}? Write it as a fraction.`,
      picture: table([pw(b, 2), pw(b, 1), pw(b, 0), pw(b, -1), pw(b, -2)], [[String(b * b), String(b), '1', '?', '?']]),
      answer: { frac: [1, P] },
      steps: k === 1
        ? [`${pw(b, 0)} = 1.`, `One step to the right divides by ${b}: 1 ÷ ${b}.`, `So ${pw(b, -1)} = 1/${P}.`]
        : [`${pw(b, 0)} = 1, and one step to the right divides by ${b}: ${pw(b, -1)} = 1/${b}.`, `One more step divides by ${b} again.`, `So ${pw(b, -2)} = 1/${P}.`] }
  } },
  { style: 'bare negative exponent to a fraction', make: r => {
    const { b, k } = until(() => ({ b: int(r, 2, 10), k: int(r, 1, 3) }), ({ b, k }) => b ** k <= 1000)
    const P = b ** k
    return { text: `What is ${pw(b, -k)}? Write it as a fraction.`, picture: eq(`${pw(b, -k)} = ?`), answer: { frac: [1, P] },
      steps: [`A negative exponent means 1 over the positive one: ${pw(b, -k)} = 1/${pw(b, k)}.`,
        k === 1 ? `${pw(b, 1)} is just ${b}.` : `${pw(b, k)} = ${Array.from({ length: k }, () => b).join(' × ')} = ${fmt(P)}.`, `So ${pw(b, -k)} = 1/${P}.`] }
  } },
  { style: 'pick the value, past the negative-answer trap', make: r => {
    const b = int(r, 2, 6)
    if (r() < 0.3) {
      return { text: `Which is equal to ${pw(b, 0)}?`, picture: eq(pw(b, 0)), answer: choose(r, '1', ['0', String(b)]),
        steps: [`${pw(b, 1)} = ${b}, and one step down divides by ${b}.`, `${b} ÷ ${b} = 1.`, `So it is 1.`] }
    }
    const k = until(() => int(r, 2, 3), k => b * k !== b ** k), P = b ** k, right = `1/${P}`
    return { text: `Which is equal to ${pw(b, -k)}?`, picture: eq(pw(b, -k)),
      answer: choose(r, right, [`−${P}`, `−${b * k}`, `1/${b * k}`]),
      steps: ['A negative exponent does not make a negative answer.', `It means 1 over the positive one: 1/${pw(b, k)} = 1/${P}.`, `So it is ${right}.`] }
  } },
  { style: 'work backwards: 1 over a number as a power', make: r => {
    const { b, k } = until(() => ({ b: int(r, 2, 10), k: int(r, 1, 4) }), ({ b, k }) => b ** k <= 10000)
    const P = b ** k
    return { text: `1/${fmt(P)} = ${b}^?. What is the exponent?`, picture: eq(`1/${fmt(P)} = ${b}^?`), answer: -k,
      steps: [`${fmt(P)} = ${pw(b, k)}.`, `1 over a power is the same power with a negative exponent: 1/${pw(b, k)} = ${pw(b, -k)}.`, `So the exponent is ${num(-k)}.`] }
  } },
  { style: 'divide powers below zero, then a fraction', make: r => {
    const { b, k } = until(() => ({ b: pick(r, [2, 3, 4, 5, 10]), k: int(r, 1, 3) }), ({ b, k }) => b ** k <= 1000)
    const a = int(r, 2, 6), c = a + k, P = b ** k
    return { text: `Work out ${pw(b, a)} ÷ ${pw(b, c)}. Write the answer as a fraction.`, picture: eq(`${pw(b, a)} ÷ ${pw(b, c)} = ?`), answer: { frac: [1, P] },
      steps: [`Same base, so subtract, top minus bottom: ${a} − ${c} = ${num(-k)}.`, `So it is ${pw(b, -k)}, which is 1/${pw(b, k)}.`, `So the answer is 1/${P}.`] }
  } },
]

// ── t5 · Scientific notation for big numbers ─────────────────────────────────────────────────────────────
const PLACES_BIG = ['100,000,000', '10,000,000', '1,000,000', '100,000', '10,000', '1,000', '100', '10', '1']
/** A big number from its digits and exponent: digits "405", e 7 → 40,500,000 and front "4.05". */
const big = (digits: string, e: number) => {
  const all = digits + '0'.repeat(e + 1 - digits.length)
  const tail = digits.slice(1).replace(/0+$/, '')
  return { N: Number(all), all, front: tail ? `${digits[0]}.${tail}` : digits[0] }
}
const nz = (r: Rng) => String(int(r, 1, 9))

const T5: Level[] = [
  { style: 'place chart, count the jumps', make: r => {
    const e = int(r, 3, 8), { N, all, front } = big(nz(r) + String(int(r, 0, 9)), e)
    return { text: `${fmt(N)} = ${front} × 10^?. What is the exponent?`,
      picture: table(PLACES_BIG.slice(-all.length), [all.split('')]), answer: e,
      steps: [`Put the point after the first digit to make ${front}.`, `From there, the point jumps ${e} places to the end of ${fmt(N)}.`, `So the exponent is ${e}.`] }
  } },
  { style: 'find the front number', make: r => {
    const e = int(r, 3, 10), { N, front } = big(nz(r) + String(int(r, 0, 9)) + String(int(r, 0, 9)), e)
    return { text: `${fmt(N)} = ? × ${pw(10, e)}. What is the front number?`, picture: eq(`${fmt(N)} = ? × ${pw(10, e)}`), answer: Number(front),
      steps: ['The front number must be from 1 up to 10.', `Put the point after the first digit: from there it jumps ${e} places to the end.`, `So the front number is ${front}.`] }
  } },
  { style: 'pick the right form, past the digit-count trap', make: r => {
    const d1 = nz(r), d3 = nz(r), e = int(r, 4, 9), { N, front } = big(`${d1}0${d3}`, e)
    const right = `${front} × ${pw(10, e)}`
    return { text: `Which is ${fmt(N)} written in scientific notation?`, picture: eq(fmt(N)),
      answer: choose(r, right, [`${front} × ${pw(10, e + 1)}`, `${front} × ${pw(10, e - 1)}`, `${d1}.${d3} × ${pw(10, e)}`]),
      steps: [`Put the point after the ${d1}, and keep the 0 and the ${d3}: ${front}.`, `There are ${e} digits after the ${d1}, so the point jumps ${e} places. Counting all ${e + 1} digits is the trap.`, `So it is ${right}.`] }
  } },
  { style: 'work backwards to the full number', make: r => hidden(() => {
    const e = int(r, 3, 8), { N, front } = big(nz(r) + nz(r), e), dec = front.length - 2
    return { text: `Write ${front} × ${pw(10, e)} as an ordinary number. What is it?`, picture: eq(`${front} × ${pw(10, e)} = ?`), answer: N,
      steps: [`× ${pw(10, e)} moves the point ${e} places to the right.`, `${front} has ${W[dec]} digit after the point, so ${W[e - dec]} more places fill up with zeros.`, `So it is ${fmt(N)}.`] }
  }) },
  { style: 'a science story with a long number', make: r => hidden(() => {
    const [what, lo, hi] = pick(r, [
      ['A galaxy has about # stars.', 9, 11], ['A beach has about # grains of sand.', 10, 13],
      ['A big storm cloud holds about # drops of water.', 11, 14], ['A space probe has traveled about # kilometers.', 10, 12],
    ] as const)
    const e = int(r, lo, hi), digits = r() < 0.5 ? `${nz(r)}0${nz(r)}` : nz(r) + nz(r), { N, front } = big(digits, e)
    return { text: `${what.replace('#', fmt(N))} ${fmt(N)} = ${front} × 10^?. What is the exponent?`,
      picture: eq(fmt(N), [`${front} × 10^?`]), answer: e,
      steps: [`Put the point after the first digit to make ${front}.`, `There are ${e} digits after the first one, so the point jumps ${e} places.`, `So the exponent is ${e}.`] }
  }) },
]

// ── t6 · Scientific notation for small numbers ───────────────────────────────────────────────────────────
const PLACES_SMALL = ['1', '0.1', '0.01', '0.001', '0.0001', '0.00001', '0.000001']
/** A small number from its digits and exponent: digits "52", e 4 → 0.00052 and front "5.2". */
const small = (digits: string, e: number) => {
  const S = `0.${'0'.repeat(e - 1)}${digits}`
  const tail = digits.slice(1)
  return { S, n: Number(S), front: tail ? `${digits[0]}.${tail}` : digits[0] }
}
/** 1 or 2 digits, the last one never 0. */
const digs = (r: Rng, two: boolean) => (two ? nz(r) + nz(r) : nz(r))

const T6: Level[] = [
  { style: 'place chart, count the jumps', make: r => {
    const e = int(r, 2, 4), { S, front } = small(digs(r, r() < 0.6), e)
    const cells = S.replace('.', '').split('')
    return { text: `${S} = ${front} × 10^?. What is the exponent?`,
      picture: table(PLACES_SMALL.slice(0, cells.length), [cells]), answer: -e,
      steps: [`Move the point right until it is just past the ${S.replace(/[0.]/g, '')[0]}, making ${front}.`, `That is ${e} jumps, and the number is less than 1, so the exponent is negative.`, `So the exponent is ${num(-e)}.`] }
  } },
  { style: 'find the front number', make: r => {
    const e = int(r, 2, 4), { S, front } = small(digs(r, true), e)
    return { text: `${S} = ? × ${pw(10, -e)}. What is the front number?`, picture: eq(`${S} = ? × ${pw(10, -e)}`), answer: Number(front),
      steps: ['The front number must be from 1 up to 10.', `Move the point ${e} places right: ${S} becomes ${front}.`, `So the front number is ${front}.`] }
  } },
  { style: 'pick the right form, past the zero-count trap', make: r => {
    const d1 = nz(r), d3 = nz(r), e = int(r, 2, 4), { S, front } = small(`${d1}0${d3}`, e)
    const right = `${front} × ${pw(10, -e)}`
    return { text: `Which is ${S} written in scientific notation?`, picture: eq(S),
      answer: choose(r, right, [`${front} × ${pw(10, -(e - 1))}`, `${front} × ${pw(10, e)}`, `${d1}.${d3} × ${pw(10, -e)}`]),
      steps: [`Move the point right to just past the ${d1}, and keep the 0 and the ${d3}: ${front}.`, `That is ${e} jumps, not just the ${e - 1} zeros, and the number is less than 1, so the exponent is negative.`, `So it is ${right}.`] }
  } },
  { style: 'work backwards to the decimal', make: r => {
    const e = int(r, 2, 5), { S, n, front } = small(digs(r, r() < 0.5), e)
    return { text: `Write ${front} × ${pw(10, -e)} as a decimal. What is it?`, picture: eq(`${front} × ${pw(10, -e)} = ?`), answer: n,
      steps: [`× ${pw(10, -e)} divides by 10 ${W[e]} times, so the point moves ${e} places to the left.`, `Fill the empty places after the point with zeros.`, `So it is ${fmt(n)}.`] }
  } },
  { style: 'a science story with a tiny number', make: r => {
    // e per thing keeps the sizes real: pollen ~10⁻⁵, dust ~10⁻⁵, a blood cell and a bacterium ~10⁻⁶.
    const [what, lo, hi] = pick(r, [['A grain of pollen is about # meters wide.', 4, 5], ['A red blood cell is about # meters wide.', 6, 6], ['A bacterium is about # meters long.', 6, 6], ['A speck of dust is about # meters wide.', 5, 5]] as const)
    const e = int(r, lo, hi), { S, front } = small(digs(r, r() < 0.5), e)
    return { text: `${what.replace('#', S)} ${S} = ${front} × 10^?. What is the exponent?`,
      picture: eq(S, [`${front} × 10^?`]), answer: -e,
      steps: [`Move the point right until it is just past the first digit that is not 0, making ${front}.`, `That is ${e} jumps, and the width is less than 1 meter, so the exponent is negative.`, `So the exponent is ${num(-e)}.`] }
  } },
]

// ── t7 · Multiply in scientific notation ─────────────────────────────────────────────────────────────────
const MUL_HEAD = ['problem', 'front numbers', 'powers of 10', 'result']
const sci = (a: number | string, e: number) => `${a} × ${pw(10, e)}`

const T7: Level[] = [
  { style: 'a table, one column at a time', make: r => hidden(() => {
    const { a, b } = until(() => ({ a: int(r, 2, 4), b: int(r, 2, 4) }), ({ a, b }) => a * b < 10)
    const p = int(r, 2, 9), q = int(r, 2, 9), s = p + q, prob = `(${sci(a, p)}) × (${sci(b, q)})`
    return { text: `${prob} = ${a * b} × 10^?. What is the exponent?`,
      picture: table(MUL_HEAD, [[prob, `${a} × ${b} = ${a * b}`, '?', '?']]), answer: s,
      steps: [`Multiply the front numbers: ${a} × ${b} = ${a * b}, which is under 10.`, `Add the exponents of 10: ${p} + ${q}.`, `So the exponent is ${s}.`] }
  }) },
  { style: 'find the front number, with a decimal', make: r => {
    const { a10, b, p, q } = until(() => ({ a10: int(r, 11, 45), b: int(r, 2, 8), p: int(r, -4, 8), q: int(r, 2, 8) }),
      ({ a10, b, p, q }) => a10 % 10 !== 0 && a10 * b < 100 && p !== 0 && p !== 1 && p + q >= 2)
    const a = a10 / 10, ans = clean((a10 * b) / 10)
    return { text: `(${sci(fmt(a), p)}) × (${sci(b, q)}) = ? × ${pw(10, p + q)}. What is the front number?`,
      picture: eq(`(${sci(fmt(a), p)}) × (${sci(b, q)}) = ? × ${pw(10, p + q)}`), answer: ans,
      steps: [`The exponents of 10 add up: ${num(p)} + ${q} = ${p + q}.`, `Multiply the front numbers: ${fmt(a)} × ${b}, and that is under 10.`, `So the front number is ${fmt(ans)}.`] }
  } },
  { style: 'pick the fixed answer when the front is 10 or more', make: r => {
    const { a, b } = until(() => ({ a: int(r, 2, 9), b: int(r, 2, 9) }), ({ a, b }) => a * b >= 10)
    const p = int(r, 2, 8), q = int(r, 2, 8), E = p + q, f = fmt(clean((a * b) / 10)), right = sci(f, E + 1)
    return { text: `Which is (${sci(a, p)}) × (${sci(b, q)}) written in scientific notation?`, picture: eq(`(${sci(a, p)}) × (${sci(b, q)})`),
      answer: choose(r, right, [sci(f, E), sci(f, E - 1), sci(a * b, E + 1)]),
      steps: [`${a} × ${b} = ${a * b}, and ${pw(10, p)} × ${pw(10, q)} = ${pw(10, E)}.`, `${a * b} is 10 or more: ${a * b} = ${f} × 10¹, so add 1 to the exponent.`, `So it is ${right}.`] }
  } },
  { style: 'missing exponent, work backwards', make: r => hidden(() => {
    const { a, b } = until(() => ({ a: int(r, 2, 4), b: int(r, 2, 4) }), ({ a, b }) => a * b < 10)
    const { p, q } = until(() => ({ p: int(r, -6, 9), q: int(r, -6, 9) }), ({ p, q }) => p !== 0 && q !== 0 && p + q !== 0)
    const t = p + q
    return { text: `Fill in the missing exponent: (${sci(a, p)}) × (${b} × 10^?) = ${sci(a * b, t)}. What number goes in place of the ?`,
      picture: eq(`(${sci(a, p)}) × (${b} × 10^?) = ${sci(a * b, t)}`), answer: q,
      steps: [`The front numbers already make ${a * b}, and the exponents of 10 add: ${num(p)} + ? = ${num(t)}.`, `Work backwards: ${num(t)} − ${p < 0 ? `(${num(p)})` : p} = ${num(q)}.`, `So the missing exponent is ${num(q)}.`] }
  }) },
  { style: 'a story where the front number needs fixing', make: r => hidden(() => {
    const { a, b } = until(() => ({ a: int(r, 2, 9), b: int(r, 2, 9) }), ({ a, b }) => a * b >= 10 && a * b % 10 !== 0)
    const p = int(r, 2, 6), q = int(r, 2, 6), E = p + q, f = fmt(clean((a * b) / 10))
    const [text, unit] = pick(r, [
      [`A warehouse has ${sci(a, p)} boxes. Each box holds ${sci(b, q)} screws.`, 'screws'],
      [`A farm plants ${sci(a, p)} rows. Each row gets ${sci(b, q)} seeds.`, 'seeds'],
      [`A printer makes ${sci(a, p)} books. Each book has ${sci(b, q)} letters in it.`, 'letters'],
    ] as const)
    return { text: `${text} In scientific notation, there are ${f} × 10^? ${unit} in all. What is the exponent?`,
      picture: eq(`(${sci(a, p)}) × (${sci(b, q)}) = ${f} × 10^?`), answer: E + 1,
      steps: [`${a} × ${b} = ${a * b}, and ${pw(10, p)} × ${pw(10, q)} = ${pw(10, E)}.`, `${a * b} is 10 or more: ${a * b} = ${f} × 10¹, so add 1 to the exponent.`, `So it is ${sci(f, E + 1)}, and the exponent is ${E + 1}.`] }
  }) },
]

// ── t8 · Square roots and cube roots ─────────────────────────────────────────────────────────────────────
const T8: Level[] = [
  { style: 'count the side of a square or a cube', make: r => {
    if (r() < 0.5) {
      const l = int(r, 3, 9)
      return { text: `A square patio is covered by ${l * l} square tiles. How many tiles long is each side?`, picture: { kind: 'cubes', l, w: l, h: 1 }, answer: l,
        steps: [`The patio is a square, so side × side = ${l * l}.`, `${l} × ${l} = ${l * l}.`, `So each side is ${l} tiles long.`] }
    }
    const l = int(r, 2, 5)
    return { text: `A box shaped like a cube is packed with ${l ** 3} small cubes. How many cubes long is each side?`, picture: { kind: 'cubes', l, w: l, h: l }, answer: l,
      steps: [`The box is a cube, so side × side × side = ${l ** 3}.`, `${l} × ${l} × ${l} = ${l ** 3}.`, `So each side is ${l} cubes long.`] }
  } },
  { style: 'bare root', make: r => hidden(() => {
    if (r() < 0.6) {
      const n = int(r, 4, 15), N = n * n
      return { text: `What is √${N}?`, picture: eq(`√${N} = ?`), answer: n,
        steps: [`√${N} asks: which number times itself makes ${N}?`, `${n - 1} × ${n - 1} = ${(n - 1) ** 2} is too small, so try the next number.`, `${n} × ${n} = ${N}, so √${N} = ${n}.`] }
    }
    const n = int(r, 2, 10), N = n ** 3
    return { text: `What is ∛${fmt(N)}?`, picture: eq(`∛${fmt(N)} = ?`), answer: n,
      steps: [`∛${fmt(N)} asks: which number, used three times, makes ${fmt(N)}?`, `${n} × ${n} = ${n * n}, and ${n * n} × ${n} = ${fmt(N)}.`, `So ∛${fmt(N)} = ${n}.`] }
  }) },
  { style: 'fix the divide-it mistake', make: r => hidden(() => {
    const who = pick(r, KIDS)
    if (r() < 0.6) {
      const n = 2 * int(r, 2, 7), N = n * n
      return { text: `${who} says √${N} = ${N / 2}, because ${N} ÷ 2 = ${N / 2}. What is √${N} really?`,
        picture: cards(`√${N} = ${N} ÷ 2 = ${N / 2}`, `? × ? = ${N}`), answer: n,
        steps: [`A square root is not half the number: ${N / 2} × ${N / 2} is far more than ${N}.`, `Find the number that times itself makes ${N}: ${n} × ${n} = ${N}.`, `So √${N} = ${n}.`] }
    }
    const n = pick(r, [3, 6, 9]), N = n ** 3
    return { text: `${who} says ∛${N} = ${N / 3}, because ${N} ÷ 3 = ${N / 3}. What is ∛${N} really?`,
      picture: cards(`∛${N} = ${N} ÷ 3 = ${N / 3}`, `? × ? × ? = ${N}`), answer: n,
      steps: [`A cube root is not a third of the number: ${N / 3} used three times is far more than ${N}.`, `Find the number that, used three times, makes ${N}: ${n} × ${n} × ${n} = ${N}.`, `So ∛${N} = ${n}.`] }
  }) },
  { style: 'work backwards from the root', make: r => hidden(() => {
    if (r() < 0.5) {
      const n = int(r, 4, 20)
      return { text: `The square root of a number is ${n}. What is the number?`, picture: eq(`√? = ${n}`), answer: n * n,
        steps: [`√? = ${n} means ${n} times itself makes the number.`, `${n} × ${n} = ${n * n}.`, `So the number is ${n * n}.`] }
    }
    const n = int(r, 2, 10)
    return { text: `The cube root of a number is ${n}. What is the number?`, picture: eq(`∛? = ${n}`), answer: n ** 3,
      steps: [`∛? = ${n} means ${n} used three times makes the number.`, `${n} × ${n} = ${n * n}, and ${n * n} × ${n} = ${fmt(n ** 3)}.`, `So the number is ${fmt(n ** 3)}.`] }
  }) },
  { style: 'find the side, then use it', make: r => hidden(() => {
    if (r() < 0.5) {
      const n = int(r, 5, 15), N = n * n
      return { text: `A square garden has an area of ${N} square meters. A fence goes all the way around it. How many meters of fence is that?`,
        picture: eq(`side × side = ${N} square meters`, ['fence = ?']), answer: 4 * n,
        steps: [`The garden is a square, so side × side = ${N}. √${N} = ${n}, because ${n} × ${n} = ${N}.`, `The fence goes along all 4 sides: 4 × ${n}.`, `So the fence is ${4 * n} meters long.`] }
    }
    const n = int(r, 2, 9), N = n ** 3
    return { text: `A box shaped like a cube holds ${N} cubic inches. What is the area of one face of the box, in square inches?`,
      picture: eq(`side × side × side = ${N} cubic inches`, ['one face = ?']), answer: n * n,
      steps: [`The box is a cube, so side × side × side = ${N}. ∛${N} = ${n}.`, `One face is a square: ${n} × ${n}.`, `So one face is ${n * n} square inches.`] }
  }) },
]

// ── t9 · Estimate a square root ──────────────────────────────────────────────────────────────────────────
/** A whole number strictly between n² and (n+1)². */
const between = (r: Rng, lo: number, hi: number) => { const n = int(r, lo, hi); return { n, x: n * n + int(r, 1, 2 * n), lo2: n * n, hi2: (n + 1) ** 2 } }
/** A number line from 0 to the next ten past x, labelled only at its ends and at x: names no root. */
const scratch = (x: number): Picture => { const max = Math.ceil((x + 1) / 10) * 10; return { kind: 'numline', min: 0, max, ticks: max / 10, labels: 'ends', points: [{ at: x, label: String(x) }] } }
const pair = (k: number) => `${k} and ${k + 1}`

const T9: Level[] = [
  { style: 'between, with the squares marked', make: r => {
    const { n, x, lo2, hi2 } = between(r, 3, 9), s = int(r, 0, 2), right = pair(n)
    const labels: (string | null)[] = Array.from({ length: hi2 - lo2 + 1 }, () => null)
    labels[0] = `${lo2} = ${n}²`; labels[hi2 - lo2] = `${hi2} = ${n + 1}²`
    return { text: `The perfect squares ${lo2} and ${hi2} are marked. Between which two whole numbers is √${x}?`,
      picture: { kind: 'numline', min: lo2, max: hi2, ticks: hi2 - lo2, labels, points: [{ at: x, label: String(x) }] },
      answer: { choices: [0, 1, 2].map(i => pair(n - s + i)), correct: s },
      steps: [`${x} is between the perfect squares ${lo2} = ${n}² and ${hi2} = ${n + 1}².`, 'So its square root is between their roots.', `So √${x} is between ${right}.`] }
  } },
  { style: 'name the smaller or bigger whole number', make: r => {
    const { n, x, lo2, hi2 } = between(r, 2, 12), bigger = r() < 0.5, ans = bigger ? n + 1 : n
    return { text: `√${x} is between two whole numbers. What is the ${bigger ? 'bigger' : 'smaller'} one?`, picture: scratch(x), answer: ans,
      steps: [`The perfect squares around ${x} are ${lo2} = ${n}² and ${hi2} = ${n + 1}².`, `So √${x} is between ${n} and ${n + 1}.`, `So the ${bigger ? 'bigger' : 'smaller'} one is ${ans}.`] }
  } },
  { style: 'which is the greatest: a root or whole numbers', make: r => {
    const { n, x, lo2, hi2 } = between(r, 3, 10), ks = shuffle(r, [n - 1, n, n + 1]).slice(0, 2)
    const top = ks.includes(n + 1), right = top ? String(n + 1) : `√${x}`
    return { text: `Which is the greatest: √${x}, ${ks[0]} or ${ks[1]}?`, picture: scratch(x),
      answer: choose(r, right, [`√${x}`, ...ks.map(String)].filter(c => c !== right)),
      steps: [`${x} is between ${lo2} = ${n}² and ${hi2} = ${n + 1}², so √${x} is between ${n} and ${n + 1}.`,
        top ? `That makes √${x} less than ${n + 1}.` : `That makes √${x} more than ${n}.`, `So the greatest is ${right}.`] }
  } },
  { style: 'round to the nearest whole number', make: r => {
    const { n, x, lo2, hi2 } = between(r, 3, 12), near = x - lo2 < hi2 - x, ans = near ? n : n + 1
    return { text: `What is √${x}, rounded to the nearest whole number?`, picture: scratch(x), answer: ans,
      steps: [`${x} is between the perfect squares ${lo2} = ${n}² and ${hi2} = ${n + 1}².`,
        `${x} is ${x - lo2} away from ${lo2}, but ${hi2 - x} away from ${hi2}, so it is closer to ${near ? lo2 : hi2}.`, `So √${x} is about ${ans}.`] }
  } },
  { style: 'a square story, rounded', make: r => hidden(() => {
    const { n, x, lo2, hi2 } = between(r, 6, 19), near = x - lo2 < hi2 - x, ans = near ? n : n + 1
    const [thing, units, unit] = pick(r, [['photo', 'square inches', 'inch'], ['garden', 'square meters', 'meter'], ['rug', 'square feet', 'foot'], ['patio', 'square yards', 'yard']] as const)
    return { text: `A square ${thing} has an area of ${x} ${units}. How long is each side, rounded to the nearest whole ${unit}?`,
      picture: eq(`side × side = ${x} ${units}`), answer: ans,
      steps: [`Each side is √${x}. ${x} is between ${lo2} = ${n}² and ${hi2} = ${n + 1}².`,
        `${x} is ${x - lo2} away from ${lo2}, but ${hi2 - x} away from ${hi2}, so it is closer to ${near ? lo2 : hi2}.`, `So each side is about ${ans}.`] }
  }) },
]

export const G8M1_LADDERS: Record<string, Level[]> = {
  'g8m1-t1': T1, 'g8m1-t2': T2, 'g8m1-t3': T3, 'g8m1-t4': T4, 'g8m1-t5': T5,
  'g8m1-t6': T6, 'g8m1-t7': T7, 'g8m1-t8': T8, 'g8m1-t9': T9,
}
