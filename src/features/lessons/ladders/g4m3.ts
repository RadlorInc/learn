/**
 * Grade 4 · Module 3 — multiplication and division of multi-digit numbers. Practice ladders, easiest style first
 * (see ../adaptive.ts and the reference ladders in ./g5m1.ts). Every division here comes out even except t7, the
 * remainder topic, which says exactly what to answer.
 */
import type { Picture } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })

const choose = (r: Rng, right: string, wrong: string[]) => {
  const choices = shuffle(r, [right, ...wrong])
  return { choices, correct: choices.indexOf(right) }
}
/** Draw from `gen` until `ok` holds. */
const until = <T>(gen: () => T, ok: (x: T) => boolean): T => { let x = gen(); while (!ok(x)) x = gen(); return x }

/** Every number a picture shows, read the way the gate reads it (string arrays joined too, commas dropped). */
const shown = (pic: Picture) => {
  const texts: string[] = []
  const walk = (v: unknown) => {
    if (typeof v === 'string' || typeof v === 'number') texts.push(String(v))
    else if (Array.isArray(v)) { if (v.every(x => typeof x === 'string')) texts.push(v.join('')); v.forEach(walk) }
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  walk(pic)
  return new Set(texts.flatMap(t => t.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map(t => t.replace(/,/g, '')))
}
const hides = (p: Picture, a: number) => a < 10 || !shown(p).has(String(a))
const once = (k: number) => (k === 1 ? 'once' : `${k} times`)

// ── t1 · Two-digit × one digit, break it apart ──────────────────────────────────────────────────────────────
const nums1 = (r: Rng) => { const t = int(r, 1, 9) * 10, o = int(r, 1, 9), m = int(r, 2, 9); return { n: t + o, t, o, m, a: (t + o) * m } }
const break1 = ({ n, t, o, m, a }: ReturnType<typeof nums1>, end: string) =>
  [`Break ${n} into ${t} and ${o}.`, `${t} × ${m} = ${t * m} and ${o} × ${m} = ${o * m}.`, `${t * m} + ${o * m} = ${fmt(a)}, ${end}`]

const T1: Level[] = [
  { style: 'area model, already cut', make: r => {
    const pic = (x: ReturnType<typeof nums1>): Picture => ({ kind: 'area', cols: [String(x.t), String(x.o)], rows: [String(x.m)], widths: [x.t, x.o] })
    const x = until(() => nums1(r), y => hides(pic(y), y.a))
    return { text: `Find ${x.n} × ${x.m}. Break ${x.n} into ${x.t} and ${x.o}.`, picture: pic(x), answer: x.a, steps: break1(x, `so ${x.n} × ${x.m} = ${fmt(x.a)}.`) }
  } },
  { style: 'bare numbers', make: r => {
    const x = nums1(r)
    return { text: `Find ${x.n} × ${x.m}.`, picture: eq(`${x.n} × ${x.m} = ?`), answer: x.a, steps: break1(x, `so ${x.n} × ${x.m} = ${fmt(x.a)}.`) }
  } },
  { style: 'pick the right working (a part left out)', make: r => {
    const { n, t, o, m, a } = nums1(r)
    const right = `${n} × ${m} = ${t * m} + ${o * m} = ${fmt(a)}`
    const wrong = [`${n} × ${m} = ${t * m}`, `${n} × ${m} = ${t * m} + ${o} = ${t * m + o}`]
    return { text: `Which one is right?`, picture: eq(`${n} × ${m}`, [`${n} = ${t} + ${o}`]), answer: choose(r, right, wrong),
      steps: [`Multiply both parts: ${t} × ${m} = ${t * m} and ${o} × ${m} = ${o * m}.`, `Then add both parts. So the right one is ${right}.`] }
  } },
  { style: 'missing part', make: r => {
    const { n, t, o, m, a } = nums1(r)
    return { text: `What number goes in the box? ${n} × ${m} = ${t * m} + ?`, picture: eq(`${n} × ${m} = ${t * m} + ?`), answer: o * m,
      steps: [`Break ${n} into ${t} and ${o}. The first part is ${t} × ${m} = ${t * m}.`, `The other part is ${o} × ${m}.`, `${o} × ${m} = ${o * m}, so the missing number is ${o * m}.`] }
  } },
  { style: 'two-step story (multiply, then add)', make: r => {
    const x = nums1(r), k = int(r, 2, 9)
    return { text: `A store gets ${x.m} boxes of crayons with ${x.n} crayons in each box. It also has ${k} loose crayons. How many crayons does it have in all?`,
      picture: eq(`${x.n} × ${x.m} = ?`, [`? + ${k} = ?`]), answer: x.a + k,
      steps: [`First find the crayons in the boxes: ${x.t} × ${x.m} = ${x.t * x.m} and ${x.o} × ${x.m} = ${x.o * x.m}, so ${x.n} × ${x.m} = ${fmt(x.a)}.`,
        `Then add the loose ones: ${fmt(x.a)} + ${k} = ${fmt(x.a + k)}.`, `So the store has ${fmt(x.a + k)} crayons.`] }
  } },
]

// ── t2 · Three- or four-digit × one digit, every place ──────────────────────────────────────────────────────
/** No zero digit, so every place makes a part. Parts are the place values, biggest first. */
const nums2 = (r: Rng, four = false) => {
  const digits = Array.from({ length: four ? 4 : 3 }, () => int(r, 1, 9))
  const parts = digits.map((d, i) => d * 10 ** (digits.length - 1 - i))
  const m = int(r, 2, four ? 4 : 9), n = parts.reduce((s, p) => s + p, 0)
  return { n, m, parts, prods: parts.map(p => p * m), a: n * m }
}
const list = (xs: string[]) => `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`
const place2 = ({ n, m, parts, prods, a }: ReturnType<typeof nums2>, end: string) => [
  `Break ${fmt(n)} into ${list(parts.map(fmt))}.`,
  `${list(parts.map((p, i) => `${fmt(p)} × ${m} = ${fmt(prods[i])}`))}.`,
  `${prods.map(fmt).join(' + ')} = ${fmt(a)}, ${end}`,
]

const T2: Level[] = [
  { style: 'area model, already cut', make: r => {
    const pic = (x: ReturnType<typeof nums2>): Picture => ({ kind: 'area', cols: x.parts.map(fmt), rows: [String(x.m)], widths: [5, 3, 2] })
    const x = until(() => nums2(r), y => hides(pic(y), y.a))
    return { text: `Find ${fmt(x.n)} × ${x.m}. Break ${fmt(x.n)} into ${list(x.parts.map(fmt))}.`, picture: pic(x), answer: x.a,
      steps: place2(x, `so ${fmt(x.n)} × ${x.m} = ${fmt(x.a)}.`) }
  } },
  { style: 'bare numbers, three or four digits', make: r => {
    const x = nums2(r, r() < 0.4)
    return { text: `Find ${fmt(x.n)} × ${x.m}.`, picture: eq(`${fmt(x.n)} × ${x.m} = ?`), answer: x.a, steps: place2(x, `so ${fmt(x.n)} × ${x.m} = ${fmt(x.a)}.`) }
  } },
  { style: 'pick the right sum (a part left out)', make: r => {
    const { n, m, parts, prods, a } = nums2(r)
    const ones = parts[2]
    const right = `${prods.map(fmt).join(' + ')} = ${fmt(a)}`
    const wrong = [`${fmt(prods[0])} + ${fmt(prods[1])} = ${fmt(prods[0] + prods[1])}`, `${fmt(prods[0])} + ${fmt(prods[1])} + ${ones} = ${fmt(prods[0] + prods[1] + ones)}`]
    return { text: `Which sum finds ${fmt(n)} × ${m}?`, picture: eq(`${fmt(n)} × ${m}`), answer: choose(r, right, wrong),
      steps: [`Every part gets multiplied: ${list(parts.map((p, i) => `${fmt(p)} × ${m} = ${fmt(prods[i])}`))}.`, `Every part gets added. So the right one is ${right}.`] }
  } },
  { style: 'missing partial product', make: r => {
    const gen = () => nums2(r)
    const pic = (x: ReturnType<typeof gen>) => eq(`${fmt(x.n)} × ${x.m} = ${fmt(x.prods[0])} + ? + ${x.prods[2]}`)
    const x = until(gen, y => hides(pic(y), y.prods[1]))
    return { text: `What number goes in the box? ${fmt(x.n)} × ${x.m} = ${fmt(x.prods[0])} + ? + ${x.prods[2]}`, picture: pic(x), answer: x.prods[1],
      steps: [`Break ${fmt(x.n)} into ${list(x.parts.map(fmt))}. The box is the tens part.`, `${x.parts[1]} × ${x.m} = ${fmt(x.prods[1])}.`, `So the missing number is ${fmt(x.prods[1])}.`] }
  } },
  { style: 'two-step story (multiply, then take away)', make: r => {
    const x = nums2(r), e = int(r, 11, 99)
    return { text: `A train has ${x.m} cars. Each car has ${fmt(x.n)} seats. ${e} seats are empty. How many people are sitting on the train?`,
      picture: eq(`${fmt(x.n)} × ${x.m} = ?`, [`? − ${e} = ?`]), answer: x.a - e,
      steps: [`First find all the seats: ${x.prods.map(fmt).join(' + ')} = ${fmt(x.a)}.`, `Then take away the empty seats: ${fmt(x.a)} − ${e} = ${fmt(x.a - e)}.`, `So ${fmt(x.a - e)} people are sitting on the train.`] }
  } },
]

// ── t3 · The standard way, carrying ─────────────────────────────────────────────────────────────────────────
/** Column steps from the ones, as the lesson says them. At least one carry, so forgetting it changes the answer. */
const nums3 = (r: Rng, four = false) => until(() => {
  const n = four ? int(r, 1000, 2499) : int(r, 102, 999), m = int(r, 2, four ? 4 : 9)
  return { n, m, a: n * m }
}, x => String(x.n).split('').some(d => +d * x.m >= 10) && +String(x.n).slice(-1) * x.m >= 10)

const PLACE = ['Ones', 'Tens', 'Hundreds', 'Thousands']
const columns3 = (n: number, m: number) => {
  const ds = String(n).split('').reverse().map(Number)
  let c = 0
  return ds.map((d, i) => {
    const p = d * m, s = p + c, last = i === ds.length - 1
    const say = `${PLACE[i]}: ${d} × ${m} = ${p}${c ? `, plus the ${c} carried is ${s}` : ''}.`
    const out = last ? `${say} Write ${s}.` : s >= 10 ? `${say} Write ${s % 10}, carry ${Math.floor(s / 10)}.` : `${say} Write ${s}.`
    c = Math.floor(s / 10)
    return out
  })
}
/** The lesson's steps, fitted into three: the lower places share a line when there are four. */
const steps3 = (n: number, m: number, end: string) => {
  const cs = columns3(n, m)
  const lines = cs.length === 4 ? [`${cs[0]} ${cs[1]}`, cs[2], cs[3]] : cs
  lines[lines.length - 1] += ` ${end}`
  return lines
}

const T3: Level[] = [
  { style: 'columns with the ones done', make: r => {
    const x = nums3(r), o = (x.n % 10) * x.m
    const pic: Picture = { kind: 'columns', rows: [String(x.n), String(x.m)], op: '×', places: ['H', 'T', 'O'], carry: `${Math.floor(o / 10)} `, answer: String(o % 10) }
    return { text: `Multiply the standard way: ${x.n} × ${x.m}. The ones are done. Finish the tens and hundreds.`, picture: pic, answer: x.a,
      steps: steps3(x.n, x.m, `So ${x.n} × ${x.m} = ${fmt(x.a)}.`) }
  } },
  { style: 'empty columns, three or four digits', make: r => {
    const x = nums3(r, r() < 0.4)
    return { text: `Multiply the standard way: ${fmt(x.n)} × ${x.m}.`, picture: { kind: 'columns', rows: [String(x.n), String(x.m)], op: '×', answer: null }, answer: x.a,
      steps: steps3(x.n, x.m, `So ${fmt(x.n)} × ${x.m} = ${fmt(x.a)}.`) }
  } },
  { style: 'spot the forgotten carry', make: r => {
    const { n, m, a } = nums3(r)
    // Forgot every carry: each place writes only its ones, the last place writes all of it (the lesson's 164 × 3 = 382).
    const ds = String(n).split('').map(Number)
    const noCarry = +ds.map((d, i) => (i === 0 ? String(d * m) : String((d * m) % 10))).join('')
    const say = (v: number) => `${n} × ${m} = ${fmt(v)}`
    const extra = a + (pick(r, [1, -1]) * 10)
    const wrong = [...new Set([noCarry, extra])].filter(v => v !== a).map(say)
    return { text: 'One of these is right. Which one?', picture: { kind: 'columns', rows: [String(n), String(m)], op: '×', answer: null },
      answer: choose(r, say(a), wrong), steps: [...columns3(n, m).slice(0, 2), `Add every carry after you multiply. So ${say(a)}.`] }
  } },
  { style: 'story', make: r => {
    const x = nums3(r)
    const [place, groups, group, verb, thing] = pick(r, [['theater', 'sections', 'section', 'has', 'seats'], ['store', 'boxes', 'box', 'holds', 'crayons'], ['farm', 'crates', 'crate', 'holds', 'apples']] as const)
    return { text: `A ${place} has ${x.m} ${groups}. Each ${group} ${verb} ${x.n} ${thing}. How many ${thing} are there?`,
      picture: { kind: 'columns', rows: [String(x.n), String(x.m)], op: '×', answer: null }, answer: x.a,
      steps: steps3(x.n, x.m, `So there are ${fmt(x.a)} ${thing}.`) }
  } },
  { style: 'missing digit (work backwards)', make: r => {
    // Tens digit hidden. m is 3, 7 or 9, so only one digit can make the tens place come out right.
    const x = until(() => { const n = int(r, 111, 999), m = pick(r, [3, 7, 9]); return { n, m, a: n * m } }, y => Math.floor(y.n / 10) % 10 !== 0)
    const s = String(x.n), d = +s[1], hid = `${s[0]}?${s[2]}`
    const onesP = (x.n % 10) * x.m, c = Math.floor(onesP / 10), tensDigit = Math.floor(x.a / 10) % 10
    return { text: `What digit goes in the box? ${hid} × ${x.m} = ${fmt(x.a)}`,
      picture: { kind: 'columns', rows: [hid, String(x.m)], op: '×', answer: String(x.a) }, answer: d,
      steps: [`Ones: ${s[2]} × ${x.m} = ${onesP}. Write ${onesP % 10}, carry ${c}.`,
        `The tens digit of ${fmt(x.a)} is ${tensDigit}. So ? × ${x.m} + ${c} must end in ${tensDigit}: ${d} × ${x.m} + ${c} = ${d * x.m + c}.`,
        `The missing digit is ${d}.`] }
  } },
]

// ── t4 · Two-digit × two-digit, four pieces ─────────────────────────────────────────────────────────────────
const nums4 = (r: Rng, big = false) => {
  const a = int(r, 1, big ? 8 : 5) * 10 + int(r, 1, 9), b = int(r, 1, big ? 5 : 3) * 10 + int(r, 1, 9)
  const [at, ao, bt, bo] = [a - (a % 10), a % 10, b - (b % 10), b % 10]
  return { a, b, at, ao, bt, bo, pieces: [at * bt, ao * bt, at * bo, ao * bo], p: a * b }
}
const four4 = (x: ReturnType<typeof nums4>, end: string) => [
  `Break ${x.a} into ${x.at} and ${x.ao}, and ${x.b} into ${x.bt} and ${x.bo}.`,
  `${x.at} × ${x.bt} = ${fmt(x.pieces[0])}, ${x.ao} × ${x.bt} = ${x.pieces[1]}, ${x.at} × ${x.bo} = ${x.pieces[2]} and ${x.ao} × ${x.bo} = ${x.pieces[3]}.`,
  `${x.pieces.map(fmt).join(' + ')} = ${fmt(x.p)}, ${end}`,
]
const area4 = (x: ReturnType<typeof nums4>, cells = false): Picture => ({ kind: 'area', cols: [String(x.at), String(x.ao)], rows: [String(x.bt), String(x.bo)],
  widths: [3, 1], heights: [2, 1], ...(cells ? { cells: [[fmt(x.pieces[0]), String(x.pieces[1])], [String(x.pieces[2]), String(x.pieces[3])]] } : {}) })

const T4: Level[] = [
  { style: 'four pieces found, add them', make: r => {
    const x = until(() => nums4(r), y => hides(area4(y, true), y.p))
    return { text: `The four pieces of ${x.a} × ${x.b} are done. Add them to find ${x.a} × ${x.b}.`, picture: area4(x, true), answer: x.p,
      steps: [`The four pieces are ${list(x.pieces.map(fmt))}.`, `Add all four: ${x.pieces.map(fmt).join(' + ')} = ${fmt(x.p)}.`, `So ${x.a} × ${x.b} = ${fmt(x.p)}.`] }
  } },
  { style: 'area model cut both ways, find the pieces', make: r => {
    const x = until(() => nums4(r, true), y => hides(area4(y), y.p))
    return { text: `Find ${x.a} × ${x.b}.`, picture: area4(x), answer: x.p, steps: four4(x, `so ${x.a} × ${x.b} = ${fmt(x.p)}.`) }
  } },
  { style: 'pick the right sum (two pieces left out)', make: r => {
    const x = nums4(r)
    const right = `${x.pieces.map(fmt).join(' + ')} = ${fmt(x.p)}`
    const wrong = [`${fmt(x.pieces[0])} + ${x.pieces[3]} = ${fmt(x.pieces[0] + x.pieces[3])}`, `${fmt(x.pieces[0])} + ${x.pieces[1]} = ${fmt(x.pieces[0] + x.pieces[1])}`]
    return { text: `Which sum finds ${x.a} × ${x.b}?`, picture: eq(`${x.a} × ${x.b}`), answer: choose(r, right, wrong),
      steps: [`There are four pieces: ${x.at} × ${x.bt}, ${x.ao} × ${x.bt}, ${x.at} × ${x.bo} and ${x.ao} × ${x.bo}.`, `Every piece gets added. So the right one is ${right}.`] }
  } },
  { style: 'missing piece', make: r => {
    const gen = () => { const x = nums4(r, true), k = int(r, 1, 2); return { x, k } }
    const text = ({ x, k }: ReturnType<typeof gen>) => `${x.a} × ${x.b} = ${x.pieces.map((p, i) => (i === k ? '?' : fmt(p))).join(' + ')}`
    const v = until(gen, y => hides(eq(text(y)), y.x.pieces[y.k])), { x, k } = v
    const [f1, f2] = k === 1 ? [x.ao, x.bt] : [x.at, x.bo]
    return { text: `What number goes in the box? ${text(v)}`, picture: eq(text(v)), answer: x.pieces[k],
      steps: [`Break ${x.a} into ${x.at} and ${x.ao}, and ${x.b} into ${x.bt} and ${x.bo}.`, `The missing piece is ${f1} × ${f2}.`, `${f1} × ${f2} = ${x.pieces[k]}, so the missing number is ${x.pieces[k]}.`] }
  } },
  { style: 'two-step story (four pieces, then take away)', make: r => {
    const x = nums4(r, true), e = int(r, 5, 40)
    return { text: `A school hall has ${x.a} rows of chairs. Each row has ${x.b} chairs. ${e} chairs are broken. How many chairs can children sit on?`,
      picture: eq(`${x.a} × ${x.b} = ?`, [`? − ${e} = ?`]), answer: x.p - e,
      steps: [`First find all the chairs: ${x.pieces.map(fmt).join(' + ')} = ${fmt(x.p)}.`, `Then take away the broken ones: ${fmt(x.p)} − ${e} = ${fmt(x.p - e)}.`, `So children can sit on ${fmt(x.p - e)} chairs.`] }
  } },
]

// ── t5 · Divide by breaking the number apart ────────────────────────────────────────────────────────────────
/** n = q × m, split into (tens of q) × m and (ones of q) × m, so both parts share evenly. */
const nums5 = (r: Rng) => {
  const m = int(r, 2, 9), qt = int(r, 1, m <= 4 ? 4 : 2) * 10, qo = int(r, 1, 9)
  return { m, q: qt + qo, qt, qo, A: qt * m, B: qo * m, n: (qt + qo) * m }
}
const share5 = (x: ReturnType<typeof nums5>, end: string) => [
  `Break ${x.n} into ${x.A} and ${x.B}.`, `${x.A} ÷ ${x.m} = ${x.qt} and ${x.B} ÷ ${x.m} = ${x.qo}.`, `${x.qt} + ${x.qo} = ${x.q}, ${end}`,
]

const T5: Level[] = [
  { style: 'area model, parts given', make: r => {
    const pic = (x: ReturnType<typeof nums5>): Picture => ({ kind: 'area', cols: ['?', '?'], rows: [String(x.m)], widths: [3, 1], cells: [[String(x.A), String(x.B)]] })
    const x = until(() => nums5(r), y => hides(pic(y), y.q))
    return { text: `Find ${x.n} ÷ ${x.m}. Break ${x.n} into ${x.A} and ${x.B}.`, picture: pic(x), answer: x.q, steps: share5(x, `so ${x.n} ÷ ${x.m} = ${x.q}.`) }
  } },
  { style: 'bare numbers, choose your own parts', make: r => {
    const x = nums5(r)
    return { text: `Find ${x.n} ÷ ${x.m}.`, picture: eq(`${x.n} ÷ ${x.m} = ?`), answer: x.q, steps: share5(x, `so ${x.n} ÷ ${x.m} = ${x.q}.`) }
  } },
  { style: 'pick the parts that share evenly', make: r => {
    const gen = () => {
      const x = nums5(r)
      const cands = [[x.n - (x.n % 10), x.n % 10], [x.A + 10, x.B - 10], [x.A - 10, x.B + 10], [x.A + 5, x.B - 5], [x.A - 5, x.B + 5]]
        .filter(([p, s]) => p > 0 && s > 0 && (p % x.m !== 0 || s % x.m !== 0))
      return { x, wrong: [...new Set(cands.map(([p, s]) => `${p} and ${s}`))].slice(0, 2) }
    }
    const { x, wrong } = until(gen, v => v.wrong.length === 2)
    const right = `${x.A} and ${x.B}`
    return { text: `You want to find ${x.n} ÷ ${x.m}. Which parts are both easy to share by ${x.m}?`, picture: eq(`${x.n} ÷ ${x.m}`),
      answer: choose(r, right, wrong), steps: [`${x.A} ÷ ${x.m} = ${x.qt} and ${x.B} ÷ ${x.m} = ${x.qo}, so both parts share evenly.`, `So break it into ${right}.`] }
  } },
  { style: 'missing part', make: r => {
    const x = nums5(r)
    const t = `${x.n} ÷ ${x.m} = ${x.A} ÷ ${x.m} + ? ÷ ${x.m}`
    return { text: `What number goes in the box? ${t}`, picture: eq(t), answer: x.B,
      steps: [`The two parts must add up to ${x.n}.`, `${x.n} − ${x.A} = ${x.B}, and ${x.B} ÷ ${x.m} = ${x.qo}, so it shares evenly.`, `So the missing number is ${x.B}.`] }
  } },
  { style: 'two-step story (add, then share)', make: r => {
    const gen = () => { const x = nums5(r), a = int(r, 5, x.n - 5); return { x, a, b: x.n - a } }
    const pic = (v: ReturnType<typeof gen>) => eq(`${v.a} + ${v.b} = ?`, [`? ÷ ${v.x.m} = ?`])
    const v = until(gen, y => hides(pic(y), y.x.q)), { x, a, b } = v
    return { text: `A baker makes ${a} muffins in the morning and ${b} muffins in the afternoon. She shares all of them equally onto ${x.m} trays. How many muffins go on each tray?`,
      picture: pic(v), answer: x.q,
      steps: [`First find all the muffins: ${a} + ${b} = ${x.n}.`, `Break ${x.n} into ${x.A} and ${x.B}: ${x.A} ÷ ${x.m} = ${x.qt} and ${x.B} ÷ ${x.m} = ${x.qo}.`, `${x.qt} + ${x.qo} = ${x.q}, so ${x.q} muffins go on each tray.`] }
  } },
]

// ── t6 · Long division by one digit ─────────────────────────────────────────────────────────────────────────
/** n = q × m divides evenly; q has three digits and no 0. A four-digit n starts with a digit smaller than m. */
const nums6 = (r: Rng, four = false) => until(() => {
  const m = int(r, 2, 9), q = int(r, 111, 999), n = q * m
  return { m, q, n }
}, x => !String(x.q).includes('0') && (four ? x.n >= 1000 && x.n <= 9999 : x.n <= 999))

/** The lesson's long division: one sentence per digit on top, the end added to the last. */
const long6 = (n: number, m: number, end: string) => {
  const s = String(n)
  let idx = +s[0] >= m ? 1 : 2, part = +s.slice(0, idx)
  const out: string[] = []
  const lead = idx === 1 ? '' : `${m} does not go into ${s[0]}, so start with ${part}. `
  let first = true
  for (;;) {
    const k = Math.floor(part / m), rem = part - k * m
    let line = `${first ? lead : ''}${m} goes into ${part} ${once(k)}, and ${part} − ${k * m} = ${rem}.`
    first = false
    if (idx < s.length) { const next = rem * 10 + +s[idx]; line += ` Bring down the ${s[idx]} to make ${next}.`; part = next; idx++ ; out.push(line) }
    else { out.push(`${line} ${end}`); break }
  }
  return out
}

const T6: Level[] = [
  { style: 'first place done in a table', make: r => {
    const pic = (x: ReturnType<typeof nums6>): Picture => {
      const s = String(x.n), h = +s[0], k = Math.floor(h / x.m)
      return { kind: 'table', head: ['Divide', 'Multiply', 'Take away', 'Bring down'], rows: [[`${h} ÷ ${x.m} = ${k}`, `${k} × ${x.m} = ${k * x.m}`, `${h} − ${k * x.m} = ${h - k * x.m}`, `the ${s[1]}`]] }
    }
    const x = until(() => nums6(r), y => hides(pic(y), y.q))
    return { text: `Find ${x.n} ÷ ${x.m}. The hundreds are done. Keep going, one place at a time.`, picture: pic(x), answer: x.q,
      steps: long6(x.n, x.m, `So ${x.n} ÷ ${x.m} = ${x.q}.`) }
  } },
  { style: 'bare long division', make: r => {
    const x = nums6(r, r() < 0.4)
    return { text: `Find ${fmt(x.n)} ÷ ${x.m}.`, picture: { kind: 'longdiv', divisor: String(x.m), dividend: String(x.n) }, answer: x.q,
      steps: long6(x.n, x.m, `So ${fmt(x.n)} ÷ ${x.m} = ${x.q}.`) }
  } },
  { style: 'spot the skipped place', make: r => {
    const x = until(() => nums6(r), y => { const s = String(y.q); return s[1] !== s[2] })
    const s = String(x.q), say = (v: string) => `${x.n} ÷ ${x.m} = ${v}`
    const wrong = [say(s.slice(1)), say(`${s[0]}${s[2]}${s[1]}`)]
    return { text: `Which one is right?`, picture: eq(`${x.n} ÷ ${x.m}`), answer: choose(r, say(s), wrong),
      steps: [`Every place gets its own number on top, so the answer has 3 digits.`, `Check by multiplying: ${x.q} × ${x.m} = ${x.n}.`, `So ${say(s)}.`] }
  } },
  { style: 'missing dividend (work backwards)', make: r => {
    const x = nums6(r, r() < 0.5)
    return { text: `What number goes in the box? ? ÷ ${x.m} = ${x.q}`, picture: eq(`? ÷ ${x.m} = ${x.q}`), answer: x.n,
      steps: steps3(x.q, x.m, `So the missing number is ${fmt(x.n)}.`).map((l, i) => (i ? l : `Go backwards: multiply ${x.q} × ${x.m}. ${l}`)) }
  } },
  { style: 'two-step story (add, then long divide)', make: r => {
    const gen = () => { const x = nums6(r, true), a = int(r, 100, x.n - 100); return { x, a, b: x.n - a } }
    const pic = (v: ReturnType<typeof gen>) => eq(`${fmt(v.a)} + ${fmt(v.b)} = ?`, [`? ÷ ${v.x.m} = ?`])
    const v = until(gen, y => hides(pic(y), y.x.q)), { x, a, b } = v
    return { text: `A farmer collects ${fmt(a)} eggs one week and ${fmt(b)} eggs the next week. He packs all of them equally into ${x.m} crates. How many eggs go in each crate?`,
      picture: pic(v), answer: x.q,
      steps: [`First find all the eggs: ${fmt(a)} + ${fmt(b)} = ${fmt(x.n)}.`, `Then divide one place at a time: ${fmt(x.n)} ÷ ${x.m} = ${x.q}. Check: ${x.q} × ${x.m} = ${fmt(x.n)}.`, `So ${x.q} eggs go in each crate.`] }
  } },
]

// ── t7 · What to do with the remainder ──────────────────────────────────────────────────────────────────────
/** n ÷ m leaves a remainder of at least 1; q + 1, q and r are three different numbers. */
const nums7 = (r: Rng, lo = 10, hi = 59) => until(() => {
  const m = int(r, 3, 9), n = int(r, lo, hi), q = Math.floor(n / m)
  return { m, n, q, rem: n % m }
}, x => x.rem > 0 && x.q >= 2 && x.rem !== x.q && x.rem !== x.q + 1)
const leftQ = (per: string, total: string): Picture => ({ kind: 'tape', rows: [{ cells: [{ w: 2, text: per, shade: true }, { w: 4, text: '?' }], brace: total }] })
const kids = (k: number) => (k === 1 ? '1 child' : `${k} children`)
const div7 = ({ n, m, q, rem }: ReturnType<typeof nums7>) => `${n} ÷ ${m} is ${q} with ${rem} left over, because ${m} × ${q} = ${m * q}.`

const T7: Level[] = [
  { style: 'division given, round up', make: r => {
    const x = nums7(r)
    return { text: `${x.n} children are going to the zoo. Each van holds ${x.m} children. ${x.n} ÷ ${x.m} is ${x.q} with ${x.rem} left over. How many vans do they need?`,
      picture: leftQ(`${x.m} per van`, `${x.n} children`), answer: x.q + 1,
      steps: [`The ${kids(x.rem)} left over still ${x.rem === 1 ? 'needs' : 'need'} a ride.`, `So add one more van: ${x.q} + 1 = ${x.q + 1}. They need ${x.q + 1} vans.`] }
  } },
  { style: 'divide yourself, drop the leftover', make: r => {
    const x = nums7(r)
    return { text: `A baker has ${x.n} cookies. Each box holds ${x.m} cookies. How many boxes can she fill?`,
      picture: leftQ(`${x.m} per box`, `${x.n} cookies`), answer: x.q,
      steps: [div7(x), `The question asks for full boxes. ${x.rem} ${x.rem === 1 ? 'cookie' : 'cookies'} cannot fill a box, so leave ${x.rem === 1 ? 'it' : 'them'} out.`, `She can fill ${x.q} boxes.`] }
  } },
  { style: 'which question has this answer', make: r => {
    const x = nums7(r)
    const qs = [[x.q + 1, 'How many tables do they need?', `the ${x.rem === 1 ? 'person' : 'people'} left over still ${x.rem === 1 ? 'needs' : 'need'} a seat, so add one more table`],
      [x.q, 'How many tables are full?', `the ${x.rem === 1 ? 'person' : 'people'} left over cannot fill a table, so leave ${x.rem === 1 ? 'that one' : 'them'} out`],
      [x.rem, 'How many people are left over?', 'that is the remainder']] as const
    const [val, right, why] = pick(r, qs)
    return { text: `${x.n} people come to a party. Each table seats ${x.m} people. Which question has the answer ${val}?`,
      picture: leftQ(`${x.m} per table`, `${x.n} people`), answer: choose(r, right, qs.map(q => q[1]).filter(q => q !== right)),
      steps: [div7(x), `${val} fits because ${why}. So the question is: ${right}`] }
  } },
  { style: 'the leftover is the answer', make: r => {
    const x = nums7(r)
    return { text: `Sam shares ${x.n} stickers equally among ${x.m} friends, giving each friend as many as he can. How many stickers are left over?`,
      picture: { kind: 'tape', rows: [{ cells: [...Array.from({ length: x.m }, () => ({ w: 1, text: '?' })), { w: 1, text: '?', shade: true }], brace: `${x.n} stickers` }] },
      answer: x.rem,
      steps: [`${x.m} × ${x.q} = ${x.m * x.q}, and ${x.m} more would be too many.`, `The question asks what is left over: ${x.n} − ${x.m * x.q} = ${x.rem}.`, `So ${x.rem} ${x.rem === 1 ? 'sticker is' : 'stickers are'} left over.`] }
  } },
  { style: 'three-digit story, decide for yourself', make: r => {
    const x = nums7(r, 100, 400)
    if (r() < 0.5) return { text: `${x.n} people wait for a ferry. The ferry carries ${x.m} people on each trip. How many trips does it need to carry everyone?`,
      picture: leftQ(`${x.m} per trip`, `${x.n} people`), answer: x.q + 1,
      steps: [div7(x), `The ${x.rem} left over still need a ride, so add one more trip.`, `The ferry needs ${x.q + 1} trips.`] }
    return { text: `A farmer has ${x.n} eggs. Each carton holds ${x.m} eggs. How many cartons can the farmer fill?`,
      picture: leftQ(`${x.m} per carton`, `${x.n} eggs`), answer: x.q,
      steps: [div7(x), `The question asks for full cartons. ${x.rem} ${x.rem === 1 ? 'egg' : 'eggs'} cannot fill a carton, so leave ${x.rem === 1 ? 'it' : 'them'} out.`, `The farmer can fill ${x.q} cartons.`] }
  } },
]

// ── t8 · Multi-step stories ─────────────────────────────────────────────────────────────────────────────────
const boxes = (n: number, each: string) => Array.from({ length: n }, () => ({ w: 1, text: each }))
/** b boxes of e, s sold (less than the total, and more than one box so it is a real take-away). */
const nums8 = (r: Rng) => until(() => {
  const b = int(r, 3, 6), e = pick(r, [12, 15, 20, 24, 25, 30, 36, 40, 45, 50]), T = b * e, s = int(r, 11, T - 11)
  return { b, e, T, s, left: T - s }
}, x => x.s > x.e)
const tape8 = (x: ReturnType<typeof nums8>, what: string): Picture => ({ kind: 'tape', rows: [{ label: 'Boxes', cells: boxes(x.b, String(x.e)) },
  { label: what, cells: [{ w: +(x.b * x.s / x.T).toFixed(2), text: `${x.s} sold`, shade: true }, { w: +(x.b * x.left / x.T).toFixed(2), text: '? left' }] }] })

const T8: Level[] = [
  { style: 'hidden number given, one step left', make: r => {
    const x = until(() => nums8(r), y => hides(tape8(y, 'Pencils'), y.left))
    return { text: `A shop has ${x.b} boxes of pencils with ${x.e} in each box. That is ${x.T} pencils. The shop sells ${x.s} pencils. How many pencils are left?`,
      picture: tape8(x, 'Pencils'), answer: x.left,
      steps: [`The shop started with ${x.T} pencils.`, `Take away the pencils sold: ${x.T} − ${x.s} = ${x.left}. So ${x.left} pencils are left.`] }
  } },
  { style: 'two steps with a tape', make: r => {
    const x = until(() => nums8(r), y => hides(tape8(y, 'Markers'), y.left))
    return { text: `A shop has ${x.b} boxes of markers. Each box holds ${x.e} markers. The shop sells ${x.s} markers. How many markers are left?`,
      picture: tape8(x, 'Markers'), answer: x.left,
      steps: [`First find all the markers: ${x.b} × ${x.e} = ${x.T}.`, `Then take away the markers sold: ${x.T} − ${x.s} = ${x.left}.`, `So ${x.left} markers are left.`] }
  } },
  { style: 'spot who stopped too soon', make: r => {
    const x = nums8(r)
    const say = (v: number) => `${v} juice boxes are left`
    return { text: `A class has ${x.b} packs of juice boxes with ${x.e} in each pack. The children drink ${x.s}. Which answer is right?`,
      picture: eq(`${x.b} × ${x.e} = ?`, [`? − ${x.s} = ?`]), answer: choose(r, say(x.left), [say(x.T), say(x.T + x.s)]),
      steps: [`First find all the juice boxes: ${x.b} × ${x.e} = ${x.T}. That is not the answer yet.`, `Then take away the ones they drink: ${x.T} − ${x.s} = ${x.left}.`, `So ${say(x.left)}.`] }
  } },
  { style: 'divide first, then add', make: r => {
    const gen = () => { const k = int(r, 3, 6), each = int(r, 11, 29), add = int(r, 2, 9); return { k, each, add, T: k * each } }
    const pic = (v: ReturnType<typeof gen>): Picture => ({ kind: 'tape', rows: [{ label: 'All', cells: [{ w: v.k, text: `${v.T} muffins` }] },
      { label: 'Trays', cells: boxes(v.k, '?') }, { label: 'That tray', cells: [{ w: 1, text: '?' }, { w: 0.5, text: `+${v.add}`, shade: true }] }] })
    const v = until(gen, y => hides(pic(y), y.each + y.add)), { k, each, add, T } = v
    return { text: `A baker packs ${T} muffins equally onto ${k} trays. Then she adds ${add} more muffins to one tray. How many muffins are on that tray now?`,
      picture: pic(v), answer: each + add,
      steps: [`First find how many go on each tray: ${T} ÷ ${k} = ${each}.`, `Then add the extra muffins: ${each} + ${add} = ${each + add}.`, `So that tray has ${each + add} muffins.`] }
  } },
  { style: 'money story: cost, then change back', make: r => {
    const x = until(() => { const p = int(r, 3, 9), c = int(r, 11, 29), P = pick(r, [100, 200, 300]); return { p, c, P, cost: p * c } },
      y => y.cost < y.P - 5 && ![y.p, y.c, y.P].includes(y.P - y.cost))
    return { text: `Movie tickets cost $${x.p} each. A group buys ${x.c} tickets and pays with $${x.P}. How many dollars do they get back?`,
      picture: { kind: 'tape', rows: [{ label: 'Tickets', cells: [{ w: 1, text: `$${x.p}` }, { w: 1, text: `$${x.p}` }, { w: 2, text: `… ${x.c} tickets` }] },
        { label: `Paid $${x.P}`, cells: [{ w: 4, text: 'cost', shade: true }, { w: 1.8, text: '? back' }] }] },
      answer: x.P - x.cost,
      steps: [`First find what the tickets cost: ${x.c} × ${x.p} = ${x.cost} dollars.`, `Then take the cost away from what they paid: ${x.P} − ${x.cost} = ${x.P - x.cost}.`, `So they get $${x.P - x.cost} back.`] }
  } },
]

export const G4M3_LADDERS: Record<string, Level[]> = {
  'g4m3-t1': T1, 'g4m3-t2': T2, 'g4m3-t3': T3, 'g4m3-t4': T4, 'g4m3-t5': T5, 'g4m3-t6': T6, 'g4m3-t7': T7, 'g4m3-t8': T8,
}
