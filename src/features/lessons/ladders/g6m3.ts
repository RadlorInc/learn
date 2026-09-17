/**
 * Grade 6 · Module 3 — Operations with decimals. Practice ladders, easiest style first (see ../adaptive.ts and the
 * reference ladders in ./g5m1.ts). Every decimal is built from whole thousandths / hundredths / cents, never from float
 * arithmetic, and every picture is re-rolled until it does not print its own answer.
 */
import type { Picture } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

const P10 = [1, 10, 100, 1000]
const clean = (x: number) => Math.round(x * 1e6) / 1e6
/** n units of 10^-p as a clean number. */
const dec = (n: number, p: number) => clean(n / P10[p])
const pl = (k: number, w: string) => `${k} ${w}${k === 1 ? '' : 's'}`
const times = (n: number) => (n === 1 ? '1 time' : `${n} times`)
const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const ld = (divisor: string, dividend: string): Picture => ({ kind: 'longdiv', divisor, dividend })
/** Written sum with the points lined up, empty places left blank (as the lesson draws it). */
const cols = (xs: number[], op: '+' | '−'): Picture => {
  const parts = xs.map(x => String(x).split('.'))
  const I = Math.max(...parts.map(p => p[0].length)), F = Math.max(...parts.map(p => p[1]?.length ?? 0))
  return { kind: 'columns', op, answer: null, rows: parts.map(([i, f]) => i.padStart(I) + (f !== undefined ? `.${f.padEnd(F)}` : ' '.repeat(F ? F + 1 : 0))) }
}
const choose = (r: Rng, right: string, wrong: string[]) => { const choices = shuffle(r, [right, ...wrong]); return { choices, correct: choices.indexOf(right) } }
/** Distinct in VALUE, not just in text (0.5 and 0.50 would be the same choice). */
const distinct = (xs: number[]) => new Set(xs.map(x => Math.round(x * 1e6))).size === xs.length

/** Does the picture print n in a label (a string, or a list of strings read joined up)? Mirrors the gate's reader. */
const shows = (pic: Picture, n: number) => {
  const t: string[] = []
  const w = (v: unknown) => {
    if (typeof v === 'string') t.push(v)
    else if (Array.isArray(v)) { if (v.length && v.every(x => typeof x === 'string')) t.push(v.join('')); v.forEach(w) }
    else if (v && typeof v === 'object') Object.values(v).forEach(w)
  }
  w(pic)
  return t.some(s => (s.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).some(x => x.replace(/,/g, '') === String(n)))
}

/** Long division said out loud, digit by digit (the point is left to the caller). The division must come out exact. */
function walk(dividend: number, d: number): string {
  const digits = String(dividend).replace('.', '').replace(/^0+/, '')
  const said: string[] = []
  let i = 0, cur = +digits[i++]
  while (cur < d && i < digits.length) cur = cur * 10 + +digits[i++]
  let n = Math.floor(cur / d), rem = cur - n * d
  said.push(`${d} fits into ${cur} ${times(n)}${rem ? `, ${rem} left` : ''}`)
  for (; i < digits.length; i++) {
    const dg = digits[i], before = rem
    cur = rem * 10 + +dg; n = Math.floor(cur / d); rem = cur - n * d
    const bring = before ? `bring down the ${dg} to make ${cur}` : `bring down the ${dg}`
    said.push(n ? `${bring}: ${times(n)}${rem ? `, ${rem} left` : ''}` : `${bring}. ${d} does not fit, so write 0 on top`)
  }
  return `${said.map(cap).join('. ')}.`
}

// ── t1 · Add and take away decimals ────────────────────────────────────────────────────────────────────────
/** a has 0 or 1 places, b has 2 or 3 (last digit not 0) and is smaller, so the empty places need 0s. In thousandths too. */
const pairT1 = (r: Rng) => {
  const pa = int(r, 0, 1), pb = int(r, 2, 3)
  let aN = 0
  do aN = pa ? int(r, 61, 480) : int(r, 6, 48); while (pa && aN % 10 === 0)
  const a = dec(aN, pa), A = aN * P10[3 - pa]
  let bN = 0
  do bN = int(r, P10[pb] + 1, (a - 1) * P10[pb]); while (bN % 10 === 0)
  const b = dec(bN, pb), B = bN * P10[3 - pb]
  return { a, b, pa, pb, A, B, diff: dec(A - B, 3), sum: dec(A + B, 3) }
}
const fill = (a: number, pb: number) => `Write ${a} as ${a.toFixed(pb)} so both numbers have ${pl(pb, 'place')} after the point.`

const T1: Level[] = [
  { style: 'written columns, points lined up', make: r => {
    const { a, b, pb, diff, sum } = pairT1(r)
    if (r() < 0.5) return { text: `Take away. ${a} − ${b} = ?`, picture: cols([a, b], '−'), answer: diff,
      steps: [fill(a, pb), 'Take away from the right, trading where you need to. Bring the point straight down.', `So ${a} − ${b} = ${fmt(diff)}.`] }
    return { text: `Add. ${a} + ${b} = ?`, picture: cols([a, b], '+'), answer: sum,
      steps: [fill(a, pb), 'Add from the right, carrying where you need to. Bring the point straight down.', `So ${a} + ${b} = ${fmt(sum)}.`] }
  } },
  { style: 'bare numbers, fill the empty places yourself', make: r => {
    const { a, b, pb, diff, sum } = pairT1(r)
    const add = r() < 0.4, op = add ? '+' : '−', ans = add ? sum : diff
    return { text: `Find ${a} ${op} ${b}.`, picture: eq(`${a} ${op} ${b} = ?`), answer: ans,
      steps: [fill(a, pb), `Line up the points and ${add ? 'add' : 'take away'} like whole numbers.`, `So ${a} ${op} ${b} = ${fmt(ans)}.`] }
  } },
  { style: 'pick the right answer (not the bring-down slip, not a slid point)', make: r => {
    for (;;) {
      const { a, b, pa, pb, A, B, diff } = pairT1(r)
      const bTrunc = Math.floor(B / P10[3 - pa]) * P10[3 - pa]
      const slip = dec(A - bTrunc + (B - bTrunc), 3)
      const vals = [diff, clean(diff * 10), clean(diff / 10), slip]
      if (!distinct(vals) || `${a} − ${b}`.includes(fmt(diff))) continue
      return { text: `Which answer is right? ${a} − ${b}`, picture: eq(`${a} − ${b} = ?`), answer: choose(r, fmt(diff), vals.slice(1).map(fmt)),
        steps: [`${fill(a, pb)} Do not just bring the last digits of ${b} straight down.`, `Take away from the right and bring the point straight down: ${a.toFixed(pb)} − ${b} = ${fmt(diff)}.`, `So the answer is ${fmt(diff)}.`] }
    }
  } },
  { style: 'missing number, work backwards', make: r => {
    const { a, b, diff, sum } = pairT1(r)
    if (r() < 0.5) return { text: `What number goes in the box? ? − ${b} = ${fmt(diff)}`, picture: eq(`? − ${b} = ${fmt(diff)}`), answer: a,
      steps: [`Go backwards: add ${b} back on to ${fmt(diff)}.`, 'Line up the points and add.', `The missing number is ${fmt(a)}.`] }
    return { text: `What number goes in the box? ${a} + ? = ${fmt(sum)}`, picture: eq(`${a} + ? = ${fmt(sum)}`), answer: b,
      steps: [`Go backwards: take ${a} away from ${fmt(sum)}.`, 'Line up the points and take away.', `The missing number is ${fmt(b)}.`] }
  } },
  { style: 'two-step story (add two parts, take away from the whole)', make: r => {
    const trail = r() < 0.5
    for (;;) {
      const W = int(r, 8, 20) * 1000, x = int(r, 11, 49) * 100, y = int(r, 1001, 4999)
      if (y % 10 === 0 || W - x - y < 500) continue
      const ans = dec(W - x - y, 3), xs = dec(x, 3), ys = dec(y, 3), ws = W / 1000, unit = trail ? 'kilometers' : 'kilograms'
      const text = trail
        ? `A bike trail is ${ws} kilometers long. You ride ${xs} kilometers before lunch and ${ys} kilometers after lunch. How many kilometers are left to ride?`
        : `A backpack can hold ${ws} kilograms. You pack ${xs} kilograms of books and ${ys} kilograms of food. How many more kilograms can it hold?`
      return { text, picture: eq(`${xs} + ${ys} = ?`, [`${ws} − ? = ?`]), answer: ans,
        steps: [`First add the two parts: ${xs} + ${ys} = ${fmt(dec(x + y, 3))}.`, `Then take that away from ${ws}. Write ${ws} as ${ws}.000 so the points line up.`, `${ws} − ${fmt(dec(x + y, 3))} = ${fmt(ans)} ${unit}.`] }
    }
  } },
]

// ── t2 · Multiply decimals ─────────────────────────────────────────────────────────────────────────────────
/** a × b with 1–2 places each (3 at most together); no trailing 0 in the product, so the place count shows. */
const pairT2 = (r: Rng) => {
  for (;;) {
    const pa = int(r, 1, 2), pb = pa === 2 ? 1 : int(r, 1, 2)
    const A = int(r, 11, 99), B = pb === 1 ? pick(r, [int(r, 2, 9), int(r, 11, 49)]) : int(r, 2, 9)
    const P = A * B
    if (A % 10 === 0 || B % 10 === 0 || P % 10 === 0) continue
    const a = dec(A, pa), b = dec(B, pb), v = dec(P, pa + pb)
    if (`${a} × ${b}`.includes(fmt(v))) continue
    return { A, B, P, a, b, pa, pb, v }
  }
}
const count = (a: number, pa: number, b: number, pb: number) => `${a} has ${pl(pa, 'place')} and ${b} has ${pl(pb, 'place')}, so the answer has ${pa + pb} places.`

const T2: Level[] = [
  { style: 'whole-number product given, put the point in', make: r => {
    const { A, B, P, a, b, pa, pb, v } = pairT2(r)
    return { text: `Without the points, ${A} × ${B} = ${fmt(P)}. Now put the point in. ${a} × ${b} = ?`, picture: { kind: 'columns', rows: [String(a), String(b)], op: '×', answer: null }, answer: v,
      steps: [`Take the points away: ${A} × ${B} = ${fmt(P)}.`, count(a, pa, b, pb), `So ${a} × ${b} = ${fmt(v)}.`] }
  } },
  { style: 'bare numbers', make: r => {
    const { A, B, P, a, b, pa, pb, v } = pairT2(r)
    return { text: `Find ${a} × ${b}.`, picture: eq(`${a} × ${b} = ?`), answer: v,
      steps: [`Multiply as if there were no points: ${A} × ${B} = ${fmt(P)}.`, count(a, pa, b, pb), `So ${a} × ${b} = ${fmt(v)}.`] }
  } },
  { style: 'pick the answer with the point in the right place', make: r => {
    const { A, B, P, a, b, pa, pb, v } = pairT2(r)
    const right = fmt(v)
    return { text: `Only one answer has the point in the right place. Which is ${a} × ${b}?`, picture: eq(`${a} × ${b}`),
      answer: choose(r, right, [clean(v * 10), clean(v * 100), clean(v / 10)].map(fmt)),
      steps: [`${A} × ${B} = ${fmt(P)}.`, `${count(a, pa, b, pb)} Do not copy where the points sit up above.`, `So the answer is ${right}.`] }
  } },
  { style: 'story (area or weight)', make: r => {
    for (;;) {
      const chain = r() < 0.5
      // chain: a long length (1 place) × a light weight per meter (2 places); bed: length × a shorter width (1 place each)
      const A = int(r, 12, 89), pa = 1, [B, pb] = chain ? [int(r, 12, 95), 2] : [int(r, 11, A - 1), 1]
      const P = A * B
      if (A % 10 === 0 || B % 10 === 0 || P % 10 === 0) continue
      const a = dec(A, pa), b = dec(B, pb), v = dec(P, pa + pb)
      const [text, unit] = chain
        ? [`One meter of chain weighs ${b} kilograms. How much do ${a} meters of chain weigh, in kilograms?`, 'kilograms']
        : [`A garden bed is ${a} meters long and ${b} meters wide. What is its area in square meters?`, 'square meters']
      return { text, picture: { kind: 'columns', rows: [String(a), String(b)], op: '×', answer: null }, answer: v,
        steps: [`Find ${a} × ${b}. Without the points, ${A} × ${B} = ${fmt(P)}.`, count(a, pa, b, pb), `So the answer is ${fmt(v)} ${unit}.`] }
    }
  } },
  { style: 'two-step story (two areas, take away)', make: r => {
    const [room, rug] = pick(r, [['A room', 'A rug on its floor'], ['A yard', 'A patio in it']] as const)
    for (;;) {
      const L = int(r, 31, 65), W = int(r, 25, 45), l = int(r, 12, 24), w = int(r, 11, 19)
      if ([L, W, l, w].some(x => x % 10 === 0)) continue
      const big = L * W, small = l * w, left = big - small
      const f = (n: number) => fmt(dec(n, 2)), s = (n: number) => String(dec(n, 1))
      return { text: `${room} is ${s(L)} meters by ${s(W)} meters. ${rug} is ${s(l)} meters by ${s(w)} meters. How many square meters are not covered?`,
        picture: eq(`${s(L)} × ${s(W)} = ?`, [`${s(l)} × ${s(w)} = ?`, '? − ? = ?']), answer: dec(left, 2),
        steps: [`The whole area: ${s(L)} × ${s(W)} = ${f(big)}. The covered part: ${s(l)} × ${s(w)} = ${f(small)}.`, 'Take the covered part away. Line up the points.', `${f(big)} − ${f(small)} = ${f(left)} square meters.`] }
    }
  } },
]

// ── t3 · Divide a decimal by a whole number ────────────────────────────────────────────────────────────────
/** q (hundredths, 1.01–9.99) × d; neither q nor the dividend ends in 0, so both show 2 places. */
const divT3 = (r: Rng) => {
  for (;;) {
    const d = int(r, 2, 9), Q = int(r, 101, 999), N = Q * d
    if (Q % 10 === 0 || N % 10 === 0) continue
    return { d, q: dec(Q, 2), D: dec(N, 2), Q, N }
  }
}
const pointUp = (D: number) => `Put the point on top, right above the point in ${fmt(D)}.`

const T3: Level[] = [
  { style: 'long division frame', make: r => {
    const { d, q, D } = divT3(r)
    return { text: `Divide. ${fmt(D)} ÷ ${d} = ?`, picture: ld(String(d), String(D)), answer: q,
      steps: [pointUp(D), walk(D, d), `So ${fmt(D)} ÷ ${d} = ${fmt(q)}.`] }
  } },
  { style: 'pick where the point goes', make: r => {
    for (;;) {
      const { d, q, D } = divT3(r)
      if (`${fmt(D)} ÷ ${d}`.includes(fmt(q))) continue
      return { text: `The digits are right in every answer, but only one has the point in the right place. Which is ${fmt(D)} ÷ ${d}?`, picture: eq(`${fmt(D)} ÷ ${d}`),
        answer: choose(r, fmt(q), [clean(q * 10), clean(q * 100), clean(q / 10)].map(fmt)),
        steps: [pointUp(D), `${d} × ${Math.floor(q)} = ${d * Math.floor(q)} and ${d} × ${Math.floor(q) + 1} = ${d * (Math.floor(q) + 1)}. ${fmt(D)} is between them, so the answer is between ${Math.floor(q)} and ${Math.floor(q) + 1}.`, `So the answer is ${fmt(q)}.`] }
    }
  } },
  { style: 'missing number, work backwards', make: r => {
    const { d, q, D, Q, N } = divT3(r)
    return { text: `What number goes in the box? ? ÷ ${d} = ${fmt(q)}`, picture: eq(`? ÷ ${d} = ${fmt(q)}`), answer: D,
      steps: [`Go backwards: multiply ${fmt(q)} × ${d}.`, `${Q} × ${d} = ${fmt(N)}, and ${fmt(q)} has 2 places, so the answer has 2 places.`, `The missing number is ${fmt(D)}.`] }
  } },
  { style: 'story (share a length or weight equally)', make: r => {
    const { d, q, D } = divT3(r)
    const [text, unit] = pick(r, [
      [`A rope ${fmt(D)} meters long is cut into ${d} equal pieces. How long is each piece, in meters?`, 'meters'],
      [`${d} friends share ${fmt(D)} kilograms of rice equally. How many kilograms does each friend get?`, 'kilograms'],
    ] as const)
    return { text, picture: ld(String(d), String(D)), answer: q,
      steps: [`Find ${fmt(D)} ÷ ${d}. ${pointUp(D)}`, walk(D, d), `So each one is ${fmt(q)} ${unit}.`] }
  } },
  { style: 'two-step story (cut some off, share the rest)', make: r => {
    const { d, q, D, N } = divT3(r)
    const C = pick(r, [int(r, 11, 39) * 10, int(r, 101, 399)])
    if (C % 100 === 0) return T3[4].make(r)
    const c = dec(C, 2), L = dec(N + C, 2)
    return { text: `A ribbon is ${fmt(L)} meters long. You cut off ${fmt(c)} meters. Then you cut the rest into ${d} equal pieces. How long is each piece, in meters?`,
      picture: eq(`${fmt(L)} − ${fmt(c)} = ?`, [`? ÷ ${d} = ?`]), answer: q,
      steps: [`First take away: ${fmt(L)} − ${fmt(c)} = ${fmt(D)}.`, `Then share it: ${fmt(D)} ÷ ${d}. ${pointUp(D)} ${walk(D, d)}`, `So each piece is ${fmt(q)} meters.`] }
  } },
]

// ── t4 · Divide by a decimal ───────────────────────────────────────────────────────────────────────────────
/** dividend ÷ divisor = Q (whole). The divisor has pd places; multiplying both by 10^pd gives A ÷ D. */
const divT4 = (r: Rng, lo = 3, hi = 24) => {
  for (;;) {
    const pd = int(r, 1, 2), D = pd === 1 ? pick(r, [2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 25]) : pick(r, [4, 5, 6, 8, 12, 15, 25, 75])
    const Q = int(r, lo, hi)
    if (Q === 10 || Q === D) continue
    const A = Q * D, m = P10[pd]
    return { pd, m, D, Q, A, ds: fmt(dec(D, pd)), dv: fmt(dec(A, pd)), dvN: dec(A, pd) }
  }
}
const grow = (dv: string, ds: string, pd: number, m: number, A: number, D: number) => `${ds} has ${pl(pd, 'place')} after the point, so multiply both numbers by ${m}: ${fmt(A)} ÷ ${D}.`

const T4: Level[] = [
  { style: 'both numbers grown for you, then divide', make: r => {
    const { pd, m, D, Q, A, ds, dv } = divT4(r)
    return { text: `Both numbers were made ${m} times bigger. Use that to find ${dv} ÷ ${ds}.`, picture: eq(`${dv} ÷ ${ds}`, [`${dv} × ${m} = ${fmt(A)}`, `${ds} × ${m} = ${D}`]), answer: Q,
      steps: [grow(dv, ds, pd, m, A, D), `${D} × ${Q} = ${fmt(A)}.`, `So ${dv} ÷ ${ds} = ${Q}.`] }
  } },
  { style: 'long division frame with a decimal outside', make: r => {
    for (;;) {
      const { pd, m, D, Q, A, ds, dv } = divT4(r)
      const pic = ld(ds, dv)
      if (shows(pic, Q)) continue
      return { text: `Divide. ${dv} ÷ ${ds} = ?`, picture: pic, answer: Q,
        steps: [grow(dv, ds, pd, m, A, D), walk(A, D), `So ${dv} ÷ ${ds} = ${Q}.`] }
    }
  } },
  { style: 'pick the division with the same answer (both, or neither)', make: r => {
    for (;;) {
      const { pd, m, D, A, ds, dv, dvN } = divT4(r)
      const right = `${fmt(A)} ÷ ${D}`
      if (`${dv} ÷ ${ds}`.includes(right)) continue
      const wrong = [`${dv} ÷ ${D}`, `${fmt(A)} ÷ ${ds}`, `${fmt(clean(dvN / m))} ÷ ${D}`]
      return { text: `Which division has the same answer as ${dv} ÷ ${ds}?`, picture: eq(`${dv} ÷ ${ds}`), answer: choose(r, right, wrong),
        steps: [`${ds} has ${pl(pd, 'place')} after the point, so multiply both numbers by ${m}.`, `${dv} × ${m} = ${fmt(A)} and ${ds} × ${m} = ${D}. Both numbers grow, or neither.`, `So the answer is ${right}.`] }
    }
  } },
  { style: 'missing number, work backwards', make: r => {
    for (;;) {
      const { pd, D, Q, A, ds, dv, dvN } = divT4(r)
      if (A % 10 === 0) continue
      return { text: `What number goes in the box? ? ÷ ${ds} = ${Q}`, picture: eq(`? ÷ ${ds} = ${Q}`), answer: dvN,
        steps: [`Go backwards: multiply ${Q} × ${ds}.`, `${Q} × ${D} = ${fmt(A)}, and ${ds} has ${pl(pd, 'place')} after the point, so the answer does too.`, `The missing number is ${dv}.`] }
    }
  } },
  { style: 'story (how many pieces or bottles)', make: r => {
    for (;;) {
      const ribbon = r() < 0.5
      const [D, pd] = pick(r, ribbon ? [[2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [15, 1], [25, 2], [75, 2]] : [[25, 2], [5, 1], [75, 2], [15, 1]] as [number, number][])
      const Q = int(r, 6, 40), A = Q * D, m = P10[pd], ds = fmt(dec(D, pd)), dv = fmt(dec(A, pd))
      const pic = ld(ds, dv)
      if (Q === 10 || shows(pic, Q)) continue
      const [text, what] = ribbon
        ? [`A ribbon is ${dv} meters long. You cut it into pieces that are ${ds} meters long. How many pieces do you get?`, 'pieces']
        : [`A bottle holds ${ds} liters. How many bottles can you fill from ${dv} liters of water?`, 'bottles']
      return { text, picture: pic, answer: Q,
        steps: [`Find ${dv} ÷ ${ds}. ${grow(dv, ds, pd, m, A, D)}`, `${D} × ${Q} = ${fmt(A)}.`, `So you get ${Q} ${what}.`] }
    }
  } },
]

// ── t5 · Long division with big numbers ────────────────────────────────────────────────────────────────────
const divisor2 = (r: Rng) => { let d = 0; do d = int(r, 12, 59); while (d % 10 === 0); return d }

const T5: Level[] = [
  { style: 'with a table of the divisor to guess from', make: r => {
    for (;;) {
      const d = divisor2(r), Q = int(r, 102, 399), N = Q * d
      const pic: Picture = { kind: 'table', head: ['Try', `× ${d}`], rows: Array.from({ length: 9 }, (_, k) => [String(k + 1), String((k + 1) * d)]) }
      if (shows(pic, Q)) continue
      return { text: `Use the table to guess each digit. Find ${fmt(N)} ÷ ${d}.`, picture: pic, answer: Q,
        steps: ['Divide, multiply, take away, bring down, one digit at a time.', walk(N, d), `So ${fmt(N)} ÷ ${d} = ${Q}.`] }
    }
  } },
  { style: 'long division frame, no help', make: r => {
    const d = divisor2(r), Q = int(r, 102, 899), N = Q * d
    return { text: `Find ${fmt(N)} ÷ ${d}.`, picture: ld(String(d), String(N)), answer: Q,
      steps: [`Round ${d} to guess each digit.`, walk(N, d), `So ${fmt(N)} ÷ ${d} = ${Q}.`] }
  } },
  { style: 'pick the right answer (the skipped 0)', make: r => {
    for (;;) {
      const d = divisor2(r), a = int(r, 1, 9), b = int(r, 1, 9), Q = a * 100 + b, N = Q * d
      const right = fmt(Q)
      if (`${fmt(N)} ÷ ${d}`.includes(right)) continue
      return { text: `Four students found ${fmt(N)} ÷ ${d} and got different answers. Which answer is right?`, picture: eq(`${fmt(N)} ÷ ${d} = ?`),
        answer: choose(r, right, [a * 10 + b, a * 100 + b * 10, Q * 10].map(fmt)),
        steps: [walk(N, d), 'When the divisor does not fit, write 0 on top so no place is skipped.', `So the answer is ${right}.`] }
    }
  } },
  { style: 'missing number, work backwards', make: r => {
    const d = divisor2(r), Q = int(r, 102, 899), N = Q * d, t = Math.floor(d / 10), o = d % 10
    return { text: `What number goes in the box? ? ÷ ${d} = ${Q}`, picture: eq(`? ÷ ${d} = ${Q}`), answer: N,
      steps: [`Go backwards: multiply ${Q} × ${d}.`, `${Q} × ${o} = ${fmt(Q * o)} and ${Q} × ${t * 10} = ${fmt(Q * t * 10)}.`, `${fmt(Q * o)} + ${fmt(Q * t * 10)} = ${fmt(N)}, so the missing number is ${fmt(N)}.`] }
  } },
  { style: 'two-step story (add two days, then pack)', make: r => {
    const [thing, box, place] = pick(r, [['eggs', 'box', 'A farm collects'], ['cans', 'case', 'A store gets']] as const)
    for (;;) {
      const d = divisor2(r), Q = int(r, 120, 480), N = Q * d
      const e1 = int(r, Math.round(N * 0.35), Math.round(N * 0.65)), e2 = N - e1
      const pic = eq(`${fmt(e1)} + ${fmt(e2)} = ?`, [`? ÷ ${d} = ?`])
      if (shows(pic, Q)) continue
      return { text: `${place} ${fmt(e1)} ${thing} on Monday and ${fmt(e2)} ${thing} on Tuesday. Each ${box} holds ${d} ${thing}. How many ${box === 'box' ? 'boxes' : 'cases'} can it fill with all of them?`,
        picture: pic, answer: Q,
        steps: [`First add: ${fmt(e1)} + ${fmt(e2)} = ${fmt(N)} ${thing}.`, `Then divide ${fmt(N)} ÷ ${d}. ${walk(N, d)}`, `So it can fill ${Q} ${box === 'box' ? 'boxes' : 'cases'}.`] }
    }
  } },
]

// ── t6 · Money stories ─────────────────────────────────────────────────────────────────────────────────────
const GOODS = [['juice box', 'juice boxes'], ['pen', 'pens'], ['granola bar', 'granola bars'], ['yogurt cup', 'yogurt cups']] as const
const PACK = ['Pack', 'Price', 'Price for one']
const money = (c: number) => (c / 100).toFixed(2)

const T6: Level[] = [
  { style: 'price for one', make: r => {
    const [one, many] = pick(r, GOODS), n = int(r, 3, 8), u = int(r, 35, 150), t = n * u
    return { text: `${n === 8 ? 'An' : 'A'} ${n}-pack of ${many} costs ${usd(t)}. What is the price for one ${one}?`, picture: { kind: 'table', head: PACK, rows: [[`${n} ${many}`, usd(t), '?']] }, answer: dec(u, 2),
      steps: [`Share the price between ${n} ${many}: ${money(t)} ÷ ${n}.`, `Check it: ${n} × ${money(u)} = ${money(t)}.`, `So one ${one} costs ${usd(u)}.`] }
  } },
  { style: 'pick the better buy of three packs', make: r => {
    const [, many] = pick(r, GOODS)
    const ns = shuffle(r, [3, 4, 5, 6, 8, 10, 12]).slice(0, 3)
    let us: number[] = []
    const u0 = int(r, 50, 130)
    do us = ns.map(() => u0 + int(r, -12, 12)); while (Math.min(...us.map((u, i) => Math.min(...us.filter((_, j) => j !== i).map(v => Math.abs(u - v))))) < 3)
    const packs = ns.map((n, i) => ({ n, u: us[i], t: n * us[i], label: `${n} for ${usd(n * us[i])}` }))
    const best = packs.reduce((x, y) => (y.u < x.u ? y : x))
    return { text: `${cap(many)} come ${packs[0].label}, ${packs[1].label}, or ${packs[2].label}. Which is the better buy?`,
      picture: { kind: 'table', head: PACK, rows: packs.map(p => [`${p.n} ${many}`, usd(p.t), '?']) },
      answer: choose(r, best.label, packs.filter(p => p !== best).map(p => p.label)),
      steps: [`Price for one: ${packs.map(p => `${money(p.t)} ÷ ${p.n} = ${money(p.u)}`).join(', ')}.`, `The lowest price for one is ${usd(best.u)}.`, `So ${best.label} is the better buy.`] }
  } },
  { style: 'change from a bill (multiply, then take away)', make: r => {
    for (;;) {
      const [, many] = pick(r, [['notebook', 'notebooks'], ['sandwich', 'sandwiches'], ['ticket', 'tickets']] as const)
      const k = int(r, 2, 5), p = int(r, 149, 599), t = k * p, bill = pick(r, [20, 50])
      if (p % 10 === 0 || t >= bill * 100) continue
      const change = bill * 100 - t
      const pic: Picture = { kind: 'table', head: ['', 'Amount'], rows: [[`${k} ${many} at ${usd(p)} each`, '?'], ['You pay', usd(bill * 100)], ['Change', '?']] }
      if (shows(pic, dec(change, 2))) continue
      return { text: `You buy ${k} ${many} at ${usd(p)} each and pay with a $${bill} bill. How much change do you get, in dollars?`, picture: pic, answer: dec(change, 2),
        steps: [`${k} ${many} cost ${k} × ${money(p)} = ${money(t)}, so ${usd(t)}.`, `Take it away from ${usd(bill * 100)}: ${money(bill * 100)} − ${money(t)} = ${money(change)}.`, `So your change is ${usd(change)}.`] }
    }
  } },
  { style: 'two-step story (add the bill, then split it)', make: r => {
    for (;;) {
      const n = int(r, 2, 6), s = int(r, 450, 1500), T = n * s
      const c1 = int(r, Math.round(T * 0.3), Math.round(T * 0.7)), c2 = T - c1
      const pic: Picture = { kind: 'table', head: ['', 'Amount'], rows: [['Pizza', usd(c1)], ['Drinks', usd(c2)], [`Each of ${n} friends pays`, '?']] }
      if (shows(pic, dec(s, 2))) continue
      return { text: `${n} friends buy pizza for ${usd(c1)} and drinks for ${usd(c2)}. They split the bill equally. How much does each friend pay, in dollars?`, picture: pic, answer: dec(s, 2),
        steps: [`The whole bill is ${money(c1)} + ${money(c2)} = ${money(T)}.`, `Share it between ${n} friends: ${money(T)} ÷ ${n} = ${money(s)}.`, `So each friend pays ${usd(s)}.`] }
    }
  } },
  { style: 'work backwards from the change (how many did you buy)', make: r => {
    for (;;) {
      const p = int(r, 3, 19) * 5, c = int(r, 4, 20), spent = p * c
      const bill = [5, 10, 20].find(b => b * 100 > spent)!, change = bill * 100 - spent
      if (change === 0) continue
      const pic: Picture = { kind: 'table', head: ['', 'Amount'], rows: [['One pencil', usd(p)], ['You pay', usd(bill * 100)], ['Change', usd(change)], ['Pencils', '?']] }
      if (shows(pic, c)) continue
      return { text: `Pencils cost ${usd(p)} each. You pay with a $${bill} bill and get ${usd(change)} in change. How many pencils did you buy?`, picture: pic, answer: c,
        steps: [`You spent ${money(bill * 100)} − ${money(change)} = ${money(spent)}.`, `Divide by the price for one: ${money(spent)} ÷ ${money(p)}. Multiply both by 100 to get ${spent} ÷ ${p} = ${c}.`, `So you bought ${c} pencils.`] }
    }
  } },
]

export const G6M3_LADDERS: Record<string, Level[]> = { 'g6m3-t1': T1, 'g6m3-t2': T2, 'g6m3-t3': T3, 'g6m3-t4': T4, 'g6m3-t5': T5, 'g6m3-t6': T6 }
