/**
 * Grade 5 · Module 4 — Place value for decimal operations. Practice ladders, easiest style first (see ../adaptive.ts
 * and the reference ladders in ./g5m1.ts). Every decimal is an integer count of tenths, hundredths or thousandths,
 * and only turned into a number at the end (`dec`), so float noise never reaches a question or an answer.
 */
import type { Picture } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

// ── shared helpers ─────────────────────────────────────────────────────────────────────────────────────────
/** n counted in units of 10^-p, as a clean number. */
const dec = (n: number, p: number) => Math.round((n / 10 ** p) * 1e6) / 1e6
/** n in units of 10^-p, written with exactly p places ("3.70"). */
const fix = (n: number, p: number) => (n / 10 ** p).toFixed(p)
const pl = (k: number, w: string) => `${k} ${w}${k === 1 ? '' : 's'}`
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
const until = <T>(gen: () => T, ok: (x: T) => boolean): T => { let x = gen(); while (!ok(x)) x = gen(); return x }
const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const choose = (r: Rng, right: string, wrong: string[]) => {
  const choices = shuffle(r, [right, ...wrong])
  return { choices, correct: choices.indexOf(right) }
}
const distinct = (vals: number[]) => vals.every((v, i) => vals.every((w, j) => i === j || Math.abs(v - w) > 1e-9))
/** A count that does not end in 0, so it really needs its last place. */
const notTen = (r: Rng, lo: number, hi: number) => until(() => int(r, lo, hi), n => n % 10 !== 0)

/** Place name of 10^e. */
const PLACE: Record<number, string> = { [-3]: 'thousandths', [-2]: 'hundredths', [-1]: 'tenths', 0: 'ones', 1: 'tens', 2: 'hundreds', 3: 'thousands', 4: 'ten thousands', 5: 'hundred thousands' }
const digit = (n: number, i: number) => Math.floor(n / 10 ** i) % 10

/** Right-aligned column rows, every number written with p places. */
const cols = (ns: number[], p: number, op: '+' | '−'): Picture => {
  const s = ns.map(n => fix(n, p)), w = Math.max(...s.map(x => x.length))
  return { kind: 'columns', rows: s.map(x => x.padStart(w, ' ')), op, answer: null }
}
/** "Hundredths: 5 + 0 = 5. Tenths: 4 + 7 = 11, so write 1 and carry 1. …" for a + b counted in 10^-p. */
const addWords = (a: number, b: number, p: number) => {
  const len = Math.max(String(a).length, String(b).length, p + 1), out: string[] = []
  let c = 0
  const has = (n: number, i: number) => i <= p || i < String(n).length
  for (let i = 0; i < len; i++) {
    const P = cap(PLACE[i - p]), da = digit(a, i), db = digit(b, i)
    if (has(a, i) && has(b, i)) {
      const s = da + db + c
      out.push(`${P}: ${da} + ${db}${c ? ' + 1' : ''} = ${s}${s >= 10 ? `, so write ${s % 10} and carry 1` : ''}`)
      c = s >= 10 ? 1 : 0
    } else {
      const d = has(a, i) ? da : db, s = d + c
      out.push(c ? `${P}: ${d} + 1 = ${s}${s >= 10 ? `, so write ${s % 10} and carry 1` : ''}` : `${P}: ${d}`)
      c = s >= 10 ? 1 : 0
    }
  }
  if (c) out.push(`${cap(PLACE[len - p])}: 1`)
  return out.join('. ') + '.'
}
/** "Hundredths: 0 − 5 needs a trade, so 10 − 5 = 5. …" for a − b (a > b) counted in 10^-p. */
const subWords = (a: number, b: number, p: number) => {
  const len = Math.max(String(a).length, p + 1), out: string[] = []
  let borrow = 0
  for (let i = 0; i < len; i++) {
    const P = cap(PLACE[i - p]), db = digit(b, i)
    let t = digit(a, i) - borrow
    if (t < 0) { // a 0 that was traded from: it gives one away and becomes 9
      t = 9
      if (!(i > p && i >= String(b).length)) { out.push(`${P}: 9 − ${db} = ${9 - db}`); continue }
    }
    if (i > p && i >= String(b).length) {
      if (!(t === 0 && i === len - 1)) out.push(`${P}: ${t}`)
      borrow = 0
    } else if (t < db) { out.push(`${P}: ${t} − ${db} needs a trade, so ${t + 10} − ${db} = ${t + 10 - db}`); borrow = 1 }
    else { if (!(i > p && i === len - 1 && t === db)) out.push(`${P}: ${t} − ${db} = ${t - db}`); borrow = 0 } // no line for a leading 0
  }
  return out.join('. ') + '.'
}

// ── t1 · Thousandths ───────────────────────────────────────────────────────────────────────────────────────
const PV4 = ['Ones', 'Tenths', 'Hundredths', 'Thousandths']
const pvBlank: Picture = { kind: 'table', head: PV4, rows: [['?', '?', '?', '?']] }
/** "1 tenth, 4 hundredths and 5 thousandths" for m thousandths (zero places left out). */
const partsOf = (m: number) => {
  const bits = [[digit(m, 2), 'tenth'], [digit(m, 1), 'hundredth'], [digit(m, 0), 'thousandth']].filter(([d]) => d).map(([d, w]) => pl(d as number, w as string))
  return bits.length === 1 ? bits[0] : `${bits.slice(0, -1).join(', ')} and ${bits.at(-1)}`
}

const T1: Level[] = [
  { style: 'words to a decimal, blank place chart', make: r => {
    const k = notTen(r, 1, 99), x = fmt(dec(k, 3))
    const steps = k < 10
      ? [`${pl(k, 'thousandth')} has no tenths and no hundredths.`, `Put 0 in the first two places after the point and ${k} in the third.`, `So ${pl(k, 'thousandth')} is ${x}.`]
      : [`${k} thousandths is ${partsOf(k)}.`, 'There are no ones and no tenths, so those places are 0.', `So ${k} thousandths is ${x}.`]
    return { text: `Write ${pl(k, 'thousandth')} with a point.`, picture: pvBlank, answer: dec(k, 3), steps }
  } },
  { style: 'wholes and thousandths to a decimal', make: r => {
    const w = int(r, 1, 9), m = notTen(r, 11, 999), n = w * 1000 + m, x = fmt(dec(n, 3))
    const zero = m < 100 ? ' The tenths place is empty, so write a 0 there.' : ''
    return { text: `Write ${w} and ${m} thousandths with a point.`, picture: eq(`${w} and ${m} thousandths`), answer: dec(n, 3),
      steps: [`The ${pl(w, 'whole')} ${w === 1 ? 'goes' : 'go'} before the point.`, `${m} thousandths is ${partsOf(m)}.${zero}`, `So it is ${x}.`] }
  } },
  { style: 'value of a digit in the chart', make: r => {
    const ds = shuffle(r, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4), at = int(r, 1, 3), d = ds[at]
    const name = PV4[at].toLowerCase(), val = dec(d, at)
    const num = `${ds[0]}.${ds[1]}${ds[2]}${ds[3]}`
    return { text: `In ${num}, what is the value of the ${d}?`, picture: { kind: 'table', head: PV4, rows: [ds.map(String)] }, answer: val,
      steps: [`The ${d} is in the ${['', 'first', 'second', 'third'][at]} place after the point.`, `That place is ${name}, so the ${d} means ${pl(d, name.slice(0, -1))}.`, `So the ${d} is worth ${fmt(val)}.`] }
  } },
  { style: 'pick the right way to write it (spot the slip)', make: r => {
    const k = notTen(r, 11, 99), right = fmt(dec(k, 3))
    return { text: `Which one is ${k} thousandths?`, picture: eq(`${k} thousandths = ?`), answer: choose(r, right, [fmt(dec(k, 2)), fmt(dec(k, 1))]),
      steps: ['Thousandths need three places after the point.', `${fmt(dec(k, 2))} is ${k} hundredths, and ${fmt(dec(k, 1))} is ${k} tenths.`, `So ${k} thousandths is ${right}.`] }
  } },
  { style: 'two-step story (add thousandths, then write it)', make: r => {
    const a = int(r, 11, 60), b = int(r, 11, 99 - a), t = a + b
    const [thing, other] = pick(r, [['seed', 'another seed'], ['bead', 'a button'], ['feather', 'a leaf']] as const)
    return { text: `A ${thing} weighs ${a} thousandths of a gram. ${cap(other)} weighs ${b} thousandths of a gram. How much do they weigh together? Write it with a point.`,
      picture: eq(`${a} thousandths + ${b} thousandths`), answer: dec(t, 3),
      steps: [`Together they weigh ${a} + ${b} = ${t} thousandths of a gram.`, 'Thousandths need three places after the point, and the ones and tenths are 0.', `So they weigh ${fmt(dec(t, 3))} grams.`] }
  } },
]

// ── t2 · Compare decimals to thousandths ───────────────────────────────────────────────────────────────────
const SIGNS = ['<', '>', '=']
/** v thousandths written with p places. */
const th = (v: number, p: number) => (v / 1000).toFixed(p)
const signOf = (a: number, b: number) => ({ choices: SIGNS, correct: a < b ? 0 : a > b ? 1 : 2 })
/** Fewest places (1–3) that write v thousandths. */
const places = (v: number) => (v % 100 === 0 ? 1 : v % 10 === 0 ? 2 : 3)
const PLACE_OF = ['ones', 'tenths', 'hundredths', 'thousandths']
/** Digits of v thousandths: [ones, tenths, hundredths, thousandths]. */
const digs = (v: number) => [Math.floor(v / 1000), digit(v, 2), digit(v, 1), digit(v, 0)]
/** Two numbers (thousandths) and how they are written. */
const pairOf = (r: Rng) => {
  const w = int(r, 0, 5), mode = int(r, 0, 5)
  let a: number, b: number, pa: number, pb: number
  if (mode === 0) { // equal, written with different zeros
    a = b = w * 1000 + (r() < 0.5 ? int(r, 1, 9) * 100 : notTen(r, 11, 99) * 10); pa = places(a); pb = 3
  } else if (mode <= 2) { // tenths decide; the longer one is smaller
    const T = int(r, 1, 9); a = w * 1000 + T * 100; b = w * 1000 + (T - 1) * 100 + notTen(r, 1, 99); pa = 1; pb = 3
  } else if (mode <= 4) { // hundredths decide
    const T = int(r, 0, 9) * 100, h = shuffle(r, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 2)
    a = w * 1000 + T + h[0] * 10; b = w * 1000 + T + h[1] * 10 + int(r, 1, 9); pa = 2; pb = 3
  } else { // thousandths decide
    const base = w * 1000 + notTen(r, 1, 99) * 10, t = shuffle(r, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 2)
    a = base + t[0]; b = base + t[1]; pa = 3; pb = 3
  }
  return r() < 0.5 ? { a, b, pa, pb } : { a: b, b: a, pa: pb, pb: pa }
}
/** The worked steps for "a ? b". */
const compareSteps = (a: number, b: number, end: string) => {
  const da = digs(a), db = digs(b), k = da.findIndex((d, i) => d !== db[i])
  const lined = `Line them up: ${fix(a, 3)} and ${fix(b, 3)}.`
  if (k < 0) return [lined, 'Every place is the same, so no place decides.', end]
  const same = PLACE_OF.slice(0, k), matched = same.length === 1 ? same[0] : `${same.slice(0, -1).join(', ')} and ${same.at(-1)}`
  return [lined, `The ${matched} match. The ${PLACE_OF[k]} are ${da[k]} and ${db[k]}, and ${da[k]} is ${da[k] > db[k] ? 'more' : 'less'}.`, end]
}
const signEnd = (a: number, b: number, sa: string, sb: string) =>
  a === b ? 'They are equal, so the sign is =.' : `So ${sa} ${a < b ? '<' : '>'} ${sb}, and the sign is ${a < b ? '<' : '>'}.`
const row = (v: number, p: number, label: string) => {
  const d = digs(v).map(String)
  return [label, d[0], ...d.slice(1).map((x, i) => (i < p ? x : ''))]
}
/** Three numbers with 1, 2 and 3 places, same whole, tenths close together. */
const threeOf = (r: Rng) => {
  const w = int(r, 0, 4) * 1000, T = int(r, 2, 8), near = () => (T + int(r, -1, 1)) * 100
  return shuffle(r, [w + T * 100, w + near() + int(r, 1, 9) * 10, w + near() + int(r, 1, 9) * 10 + int(r, 1, 9)])
}
const str = (v: number) => th(v, places(v))

const T2: Level[] = [
  { style: 'lined up in the place chart, pick the sign', make: r => {
    const { a, b, pa, pb } = pairOf(r), sa = th(a, pa), sb = th(b, pb)
    return { text: `Both numbers are in the chart. Which sign goes between them? ${sa} ? ${sb}`,
      picture: { kind: 'table', head: ['', ...PV4], rowHead: true, rows: [row(a, pa, sa), row(b, pb, sb)] },
      answer: signOf(a, b), steps: compareSteps(a, b, signEnd(a, b, sa, sb)) }
  } },
  { style: 'bare numbers, pick the sign', make: r => {
    const { a, b, pa, pb } = pairOf(r), sa = th(a, pa), sb = th(b, pb)
    return { text: `Which sign goes between them? ${sa} ? ${sb}`, picture: eq(`${sa} ? ${sb}`), answer: signOf(a, b), steps: compareSteps(a, b, signEnd(a, b, sa, sb)) }
  } },
  { style: 'story, whose is longer', make: r => {
    const { a, b, pa, pb } = pairOf(r), sa = th(a, pa), sb = th(b, pb)
    const [x, y] = pick(r, [['Mia', 'Leo'], ['Ana', 'Sam'], ['Kai', 'Ava']] as const)
    const [thing, word] = pick(r, [['pencil', 'meters long'], ['ribbon', 'meters long'], ['jump', 'meters long']] as const)
    const answer = { choices: [x, y, 'Same length'], correct: a > b ? 0 : a < b ? 1 : 2 }
    const end = a === b ? `So they are the same length. The answer is "Same length".` : `So ${a > b ? `${sa} > ${sb}` : `${sb} > ${sa}`}, and ${a > b ? x : y}'s ${thing} is longer.`
    return { text: `${x}'s ${thing} is ${sa} ${word}. ${y}'s ${thing} is ${sb} ${word}. Whose ${thing} is longer?`, picture: eq(`${sa} ? ${sb}`),
      answer, steps: compareSteps(a, b, end) }
  } },
  { style: 'pick the greatest of three (more digits is a trap)', make: r => {
    const vs = until(() => threeOf(r), x => distinct(x)), sorted = [...vs].sort((p, q) => q - p), [m, s] = sorted
    const dm = digs(m), ds = digs(s), k = dm.findIndex((d, i) => d !== ds[i])
    const right = str(m)
    return { text: 'Which number is the greatest?', picture: eq('the greatest = ?'), answer: choose(r, right, vs.filter(v => v !== m).map(str)),
      steps: [`Write them with three places: ${vs.map(v => fix(v, 3)).join(', ')}.`, `Compare the two biggest from the left. The ${PLACE_OF[k]} are ${dm[k]} and ${ds[k]}, and ${dm[k]} is more.`, `So the greatest is ${right}.`] }
  } },
  { style: 'put three in order, least to greatest', make: r => {
    const vs = until(() => threeOf(r), x => distinct(x)), up = [...vs].sort((p, q) => p - q)
    const list = (xs: number[]) => xs.map(str).join(', ')
    const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].map(p => p.map(i => up[i]))
    const wrong = shuffle(r, perms.slice(1)).slice(0, 2).map(list), right = list(up)
    return { text: 'Which list goes from least to greatest?', picture: eq('least → greatest'), answer: choose(r, right, wrong),
      steps: [`Write them with three places: ${up.map(v => fix(v, 3)).join(', ')}.`, 'Compare place by place from the left. The first place that is different decides.', `So the order is ${right}.`] }
  } },
]

// ── t3 · Round decimals ────────────────────────────────────────────────────────────────────────────────────
const NEAREST: Record<number, string> = { 10: 'hundredth', 100: 'tenth', 1000: 'whole number' }
/** v thousandths rounded to `unit` (10, 100 or 1000 thousandths), with the words for it. */
const roundOf = (v: number, unit: number) => {
  const lo = Math.floor(v / unit) * unit, hi = lo + unit, half = lo + unit / 2, off = v - lo
  const up = off * 2 >= unit, ans = up ? hi : lo, x = fmt(dec(v, 3)), a = fmt(dec(ans, 3))
  return { ans: dec(ans, 3), a,
    steps: [`${x} sits between ${fmt(dec(lo, 3))} and ${fmt(dec(hi, 3))}. Halfway is ${fmt(dec(half, 3))}.`,
      off * 2 < unit ? `${x} is before halfway, so it rounds down.` : off * 2 === unit ? `${x} is exactly halfway, and halfway rounds up.` : `${x} is past halfway, so it rounds up.`] }
}
/** A number (thousandths, 1 to 9.999) that needs rounding to `unit`: never already rounded, sometimes exactly halfway. */
const toRound = (r: Rng, unit: number) => {
  const w = int(r, 1, 9) * 1000
  return r() < 0.2 ? w + int(r, 0, 1000 / unit - 1) * unit + unit / 2 : until(() => w + notTen(r, 1, 999), v => v % unit !== 0)
}

const T3: Level[] = [
  { style: 'number line, round to the tenth', make: r => {
    const L = until(() => int(r, 11, 98), x => x % 10 !== 0), o = r() < 0.2 ? 5 : int(r, 1, 9), n = L * 10 + o
    const { ans, a, steps } = roundOf(n * 10, 100)
    return { text: `Round ${fmt(dec(n, 2))} to the nearest tenth.`, picture: { kind: 'numline', min: dec(L, 1), max: dec(L + 1, 1), ticks: 10, labels: 'none', points: [{ at: dec(n, 2) }] },
      answer: ans, steps: [...steps, `So ${fmt(dec(n, 2))} rounds to ${a}.`] }
  } },
  { style: 'bare number, round to the hundredth or the whole', make: r => {
    const unit = pick(r, [10, 1000])
    const v = toRound(r, unit)
    const { ans, a, steps } = roundOf(v, unit)
    return { text: `Round ${fmt(dec(v, 3))} to the nearest ${NEAREST[unit]}.`, picture: eq(`${fmt(dec(v, 3))} → ?`), answer: ans, steps: [...steps, `So ${fmt(dec(v, 3))} rounds to ${a}.`] }
  } },
  { style: 'which number rounds to it (pick one)', make: r => {
    const T = until(() => int(r, 11, 98), x => x % 10 !== 0), base = T * 10
    const rightOff = until(() => int(r, -5, 4), o => o !== 0)
    const wrongOffs = shuffle(r, [-9, -8, -7, -6, 5, 5, 6, 7, 8, 9]).filter((o, i, xs) => xs.indexOf(o) === i).slice(0, 2)
    const s = (o: number) => fix(base + o, 2), right = s(rightOff), t = fmt(dec(T, 1))
    return { text: `Which number rounds to ${t} to the nearest tenth?`, picture: eq(`? → ${t}`), answer: choose(r, right, wrongOffs.map(s)),
      steps: [`Numbers that round to ${t} start at halfway below it, ${fix(base - 5, 2)}, and stop just before halfway above it, ${fix(base + 5, 2)}.`, `Only one choice is in that stretch.`, `So ${right} rounds to ${t}.`] }
  } },
  { style: 'story, round a measurement', make: r => {
    const unit = pick(r, [10, 100])
    const v = toRound(r, unit)
    const [who, verb, noun] = pick(r, [['A puppy', 'weighs', 'kilogram'], ['A ribbon', 'is', 'meter'], ['A jug', 'holds', 'liter']] as const)
    const { ans, a, steps } = roundOf(v, unit), x = fmt(dec(v, 3))
    const long = noun === 'meter' ? ' long' : ''
    return { text: `${who} ${verb} ${x} ${noun}s${long}. Round it to the nearest ${NEAREST[unit]} of a ${noun}.`, picture: eq(`${x} ${noun}s`),
      answer: ans, steps: [...steps, `So ${who.toLowerCase().replace('a ', 'the ')} ${verb} about ${a} ${noun}s${long}.`] }
  } },
  { style: 'work backwards: smallest or largest that rounds to it', make: r => {
    const T = until(() => int(r, 11, 98), x => x % 10 !== 0), base = T * 10, t = fmt(dec(T, 1)), small = r() < 0.5
    const lo = fmt(dec(T - 1, 1)), hi = fmt(dec(T + 1, 1))
    const ans = dec(small ? base - 5 : base + 4, 2)
    return { text: `What is the ${small ? 'smallest' : 'largest'} number with two places after the point that rounds to ${t} to the nearest tenth?`,
      picture: { kind: 'numline', min: dec(T - 1, 1), max: dec(T + 1, 1), ticks: 20, labels: 'none', points: [{ at: dec(T, 1), label: t }] },
      answer: ans,
      steps: small
        ? [`Halfway between ${lo} and ${t} is ${fix(base - 5, 2)}.`, `Halfway rounds up, so ${fix(base - 5, 2)} rounds to ${t}, but ${fix(base - 6, 2)} rounds down.`, `So the smallest is ${fmt(ans)}.`]
        : [`Halfway between ${t} and ${hi} is ${fix(base + 5, 2)}, and that rounds up to ${hi}.`, `So stop one hundredth before it.`, `So the largest is ${fmt(ans)}.`] }
  } },
]

// ── t4 · Add decimals ──────────────────────────────────────────────────────────────────────────────────────
/** A decimal with p places whose last digit is not 0: [count in 10^-p, p]. */
const decimal = (r: Rng, wLo: number, wHi: number, p: number) => int(r, wLo, wHi) * 10 ** p + notTen(r, 1, 10 ** p - 1)
/** Line up a (pa places) and b (pb places): both as counts of 10^-p, plus the words. */
const lineUp = (a: number, pa: number, b: number, pb: number) => {
  const p = Math.max(pa, pb), A = a * 10 ** (p - pa), B = b * 10 ** (p - pb)
  const pad = pa === pb ? 'The points already line up.' : pa < pb ? `Line up the points: write ${fix(a, pa)} as ${fix(A, p)}.` : `Line up the points: write ${fix(b, pb)} as ${fix(B, p)}.`
  return { p, A, B, pad }
}

const T4: Level[] = [
  { style: 'columns lined up, add', make: r => {
    const pb = pick(r, [1, 2]), a = decimal(r, 10, 49, 2), b = decimal(r, 1, 9, pb)
    const { p, A, B, pad } = lineUp(a, 2, b, pb), ans = dec(A + B, p)
    return { text: `Add. ${fix(a, 2)} + ${fix(b, pb)} = ?`, picture: cols([A, B], p, '+'), answer: ans,
      steps: [pad, addWords(A, B, p), `So ${fix(a, 2)} + ${fix(b, pb)} = ${fmt(ans)}.`] }
  } },
  { style: 'bare numbers with different places', make: r => {
    const [pa, pb] = shuffle(r, pick(r, [[1, 2], [1, 3], [2, 3]])), a = decimal(r, 1, 29, pa), b = decimal(r, 1, 9, pb)
    const { p, A, B, pad } = lineUp(a, pa, b, pb), ans = dec(A + B, p)
    return { text: `Find ${fix(a, pa)} + ${fix(b, pb)}.`, picture: eq(`${fix(a, pa)} + ${fix(b, pb)} = ?`), answer: ans,
      steps: [pad, addWords(A, B, p), `So ${fix(a, pa)} + ${fix(b, pb)} = ${fmt(ans)}.`] }
  } },
  { style: 'pick the right answer (spot the lined-up last digits)', make: r => {
    const { a, b } = until(() => ({ a: decimal(r, 10, 49, 2), b: decimal(r, 1, 9, 1) }), x => digit(x.a, 1) + digit(x.b, 0) >= 10)
    const A = a, B = b * 10, sum = A + B, right = fmt(dec(sum, 2))
    return { text: `Which answer is right? ${fix(a, 2)} + ${fix(b, 1)} = ?`, picture: eq(`${fix(a, 2)} + ${fix(b, 1)}`),
      answer: choose(r, right, [fmt(dec(a + b, 2)), fmt(dec(sum - 100, 2))]),
      steps: [`Line up the points: write ${fix(b, 1)} as ${fix(B, 2)}.`, addWords(A, B, 2), `So ${fix(a, 2)} + ${fix(b, 1)} = ${right}.`] }
  } },
  { style: 'story, add two amounts', make: r => {
    const [pa, pb] = shuffle(r, [1, 2]), a = decimal(r, 1, 19, pa), b = decimal(r, 1, 9, pb)
    const { p, A, B, pad } = lineUp(a, pa, b, pb), ans = dec(A + B, p)
    const [text, unit, end] = pick(r, [
      [`Sam runs ${fix(a, pa)} kilometers on Monday and ${fix(b, pb)} kilometers on Tuesday. How far does he run in all?`, 'km', 'So Sam runs {} kilometers.'],
      [`One bag of apples weighs ${fix(a, pa)} pounds. Another bag weighs ${fix(b, pb)} pounds. How much do they weigh together?`, 'lb', 'So the bags weigh {} pounds.'],
      [`A pot has ${fix(a, pa)} liters of soup. Mia pours in ${fix(b, pb)} liters more. How much soup is in the pot now?`, 'L', 'So the pot has {} liters of soup.'],
    ] as const)
    return { text, picture: eq(`${fix(a, pa)} ${unit} + ${fix(b, pb)} ${unit}`), answer: ans, steps: [pad, addWords(A, B, p), end.replace('{}', fmt(ans))] }
  } },
  { style: 'two-step story, three amounts', make: r => {
    const a = decimal(r, 1, 9, 2), bt = decimal(r, 1, 9, 1), ct = decimal(r, 1, 9, 1)
    const ab = a + bt * 10, all = ab + ct * 10, b = fix(bt, 1), c = fix(ct, 1), [name, he] = pick(r, [['Sam', 'he'], ['Ana', 'she'], ['Leo', 'he']] as const)
    return { text: `${name} runs ${fix(a, 2)} kilometers on Monday, ${b} kilometers on Tuesday and ${c} kilometers on Wednesday. How far does ${he} run in all?`,
      picture: eq(`${fix(a, 2)} + ${b} = ?`, [`? + ${c} = ?`]), answer: dec(all, 2),
      steps: [`First add Monday and Tuesday: ${fix(a, 2)} + ${b} = ${fmt(dec(ab, 2))}.`, `Then add Wednesday: ${fmt(dec(ab, 2))} + ${c} = ${fmt(dec(all, 2))}.`, `So ${name} runs ${fmt(dec(all, 2))} kilometers.`] }
  } },
]

// ── t5 · Take away decimals ────────────────────────────────────────────────────────────────────────────────
/** a (tenths, shown with 1 place) − b (hundredths, last digit not 0), a > b: both as hundredths. */
const subPair = (r: Rng, wHi: number) => until(() => ({ a: decimal(r, 2, wHi, 1) * 10, b: decimal(r, 1, wHi - 1, 2) }), x => x.a - x.b >= 50)

const T5: Level[] = [
  { style: 'columns with the zero written in', make: r => {
    const { a, b } = subPair(r, 9), ans = dec(a - b, 2)
    return { text: `Take away. ${fix(a / 10, 1)} − ${fix(b, 2)} = ?`, picture: cols([a, b], 2, '−'), answer: ans,
      steps: [`Write ${fix(a / 10, 1)} as ${fix(a, 2)} so every place has a digit.`, subWords(a, b, 2), `So ${fix(a / 10, 1)} − ${fix(b, 2)} = ${fmt(ans)}.`] }
  } },
  { style: 'bare numbers, a whole or a tenth on top', make: r => {
    const whole = r() < 0.5
    const { a, b } = whole ? until(() => ({ a: int(r, 2, 15) * 100, b: decimal(r, 1, 9, 2) }), x => x.a - x.b >= 50) : subPair(r, 19)
    const top = whole ? String(a / 100) : fix(a / 10, 1), ans = dec(a - b, 2)
    return { text: `Find ${top} − ${fix(b, 2)}.`, picture: eq(`${top} − ${fix(b, 2)} = ?`), answer: ans,
      steps: [`${top} is the same as ${fix(a, 2)}.`, subWords(a, b, 2), `So ${top} − ${fix(b, 2)} = ${fmt(ans)}.`] }
  } },
  { style: 'pick the right answer (spot the digit brought down)', make: r => {
    const pickIt = () => {
      const { a, b } = subPair(r, 9), right = a - b, slip = right + 2 * digit(b, 0)
      const abs = [0, 1, 2].reduce((s, i) => s + Math.abs(digit(a, i) - digit(b, i)) * 10 ** i, 0)
      return { a, b, vals: [right, slip, abs] }
    }
    const { a, b, vals } = until(pickIt, x => distinct(x.vals))
    const right = fmt(dec(vals[0], 2))
    return { text: `Which answer is right? ${fix(a / 10, 1)} − ${fix(b, 2)} = ?`, picture: eq(`${fix(a / 10, 1)} − ${fix(b, 2)}`),
      answer: choose(r, right, vals.slice(1).map(v => fmt(dec(v, 2)))),
      steps: [`Write ${fix(a / 10, 1)} as ${fix(a, 2)}, so the empty place has a 0 to trade from.`, subWords(a, b, 2), `So ${fix(a / 10, 1)} − ${fix(b, 2)} = ${right}.`] }
  } },
  { style: 'missing number, work backwards', make: r => {
    const { a, b } = subPair(r, 9), c = a - b, top = fix(a / 10, 1)
    if (r() < 0.5) return { text: `What number goes in the box? ${top} − ? = ${fmt(dec(c, 2))}`, picture: eq(`${top} − ? = ${fmt(dec(c, 2))}`), answer: dec(b, 2),
      steps: [`Go backwards: the missing number is ${top} − ${fmt(dec(c, 2))}.`, `Write ${top} as ${fix(a, 2)} and take away: ${fix(a, 2)} − ${fix(c, 2)} = ${fix(b, 2)}.`, `So the missing number is ${fmt(dec(b, 2))}.`] }
    return { text: `What number goes in the box? ? − ${fix(b, 2)} = ${fmt(dec(c, 2))}`, picture: eq(`? − ${fix(b, 2)} = ${fmt(dec(c, 2))}`), answer: dec(a, 2),
      steps: [`Go backwards: the missing number is ${fmt(dec(c, 2))} + ${fix(b, 2)}.`, `Line up the points and add: ${fix(c, 2)} + ${fix(b, 2)} = ${fix(a, 2)}.`, `So the missing number is ${fmt(dec(a, 2))}.`] }
  } },
  { style: 'two-step story, take away twice', make: r => {
    const { a, b, c } = until(() => ({ a: decimal(r, 4, 9, 1) * 10, b: decimal(r, 1, 2, 2), c: decimal(r, 0, 1, 1) * 10 }), x => x.a - x.b - x.c >= 20)
    const mid = a - b, left = mid - c, ans = dec(left, 2)
    const [start, one, two, end] = pick(r, [
      [`A jug holds ${fix(a / 10, 1)} liters of juice.`, 'You pour out', 'Then you pour out', 'liters of juice are left'],
      [`A board is ${fix(a / 10, 1)} meters long.`, 'Kai cuts off', 'Then he cuts off', 'meters of board are left'],
      [`A rope is ${fix(a / 10, 1)} meters long.`, 'Ana cuts off', 'Then she cuts off', 'meters of rope are left'],
    ] as const)
    const unit = end.split(' ')[0]
    return { text: `${start} ${one} ${fix(b, 2)} ${unit}. ${two} ${fix(c / 10, 1)} ${unit}. How many ${unit} are left?`,
      picture: eq(`${fix(a / 10, 1)} − ${fix(b, 2)} = ?`, [`? − ${fix(c / 10, 1)} = ?`]), answer: ans,
      steps: [`First take away: ${fix(a, 2)} − ${fix(b, 2)} = ${fmt(dec(mid, 2))}.`, `Then take away again: ${fix(mid, 2)} − ${fix(c, 2)} = ${fmt(ans)}.`, `So ${fmt(ans)} ${end}.`] }
  } },
]

// ── t6 · Multiply a decimal by a whole number ──────────────────────────────────────────────────────────────
/** m × x, x in hundredths (w.th), with the part-by-part words. */
const mulOf = (r: Rng, wHi: number) => {
  const m = int(r, 2, 9), w = int(r, 0, wHi), t = int(r, 1, 9), h = int(r, 1, 9), X = w * 100 + t * 10 + h
  const partsS = [...(w ? [String(w)] : []), `0.${t}`, `0.0${h}`]
  const prods = [...(w ? [m * w * 100] : []), m * t * 10, m * h]
  const x = fix(X, 2), P = m * X, ans = dec(P, 2)
  return { m, w, X, x, P, ans, partsS,
    split: `${x} is ${partsS.join(' + ')}.`,
    each: `${partsS.map((s, i) => `${m} × ${s} = ${fmt(dec(prods[i], 2))}`).join(', ')}.`,
    added: `${prods.map(p => fmt(dec(p, 2))).join(' + ')} = ${fmt(ans)}` }
}

const T6: Level[] = [
  { style: 'area model, multiply each part', make: r => {
    const o = mulOf(r, 4)
    return { text: `Multiply. ${o.m} × ${o.x} = ?`, picture: { kind: 'area', cols: o.partsS, rows: [String(o.m)], cells: [o.partsS.map(() => null)] },
      answer: o.ans, steps: [o.split, o.each, `${o.added}, so ${o.m} × ${o.x} = ${fmt(o.ans)}.`] }
  } },
  { style: 'bare numbers', make: r => {
    const o = mulOf(r, 6)
    return { text: `Find ${o.m} × ${o.x}.`, picture: eq(`${o.m} × ${o.x} = ?`), answer: o.ans, steps: [o.split, o.each, `${o.added}, so ${o.m} × ${o.x} = ${fmt(o.ans)}.`] }
  } },
  { style: 'place the point (pick the sensible size)', make: r => {
    const o = until(() => mulOf(r, 4), q => q.P % 10 !== 0 && !`${q.m} × ${q.X} = ${fmt(q.P)} ${q.m} × ${q.x}`.includes(fmt(q.ans)))
    const right = fmt(o.ans), picture = eq(`${o.m} × ${o.X} = ${fmt(o.P)}`, [`${o.m} × ${o.x} = ?`])
    return { text: `${o.m} × ${o.X} = ${fmt(o.P)}. So what is ${o.m} × ${o.x}?`, picture,
      answer: choose(r, right, [fmt(dec(o.P, 1)), fmt(o.P)]),
      steps: [`${o.x} is between ${o.w} and ${o.w + 1}, so ${o.m} × ${o.x} is between ${o.m * o.w} and ${o.m * (o.w + 1)}.`, `Only one choice is in that range.`, `So ${o.m} × ${o.x} = ${right}.`] }
  } },
  { style: 'missing whole number, work backwards', make: r => {
    const o = mulOf(r, 3)
    return { text: `What number goes in the box? ? × ${o.x} = ${fmt(o.ans)}`, picture: eq(`? × ${o.x} = ${fmt(o.ans)}`), answer: o.m,
      steps: [`Think: how many groups of ${o.x} make ${fmt(o.ans)}?`, `${o.split} ${o.each} ${o.added}.`, `So the missing number is ${o.m}.`] }
  } },
  { style: 'two-step story, buy two things', make: r => {
    const m = int(r, 2, 5), n = int(r, 2, 4), x = int(r, 1, 4) * 100 + notTen(r, 1, 99), y = int(r, 1, 3) * 100 + int(r, 1, 9) * 10
    const mx = m * x, ny = n * y, all = mx + ny, $ = (c: number) => `$${fix(c, 2)}`
    const [one, two, who] = pick(r, [['notebook', 'pen', 'Kai'], ['smoothie', 'muffin', 'Mia'], ['comic', 'bookmark', 'Leo']] as const)
    return { text: `A ${one} costs ${$(x)} and a ${two} costs ${$(y)}. ${who} buys ${m} ${one}s and ${n} ${two}s. How much does ${who} pay?`,
      picture: eq(`${m} × ${$(x)}`, [`${n} × ${$(y)}`]), answer: dec(all, 2),
      steps: [`${cap(one)}s: ${m} × ${$(x)} = ${$(mx)}. ${cap(two)}s: ${n} × ${$(y)} = ${$(ny)}.`, `Add them: ${$(mx)} + ${$(ny)} = ${$(all)}.`, `So ${who} pays ${$(all)}.`] }
  } },
]

// ── t7 · Multiply and divide by 10, 100, 1,000 ─────────────────────────────────────────────────────────────
const PV5 = ['Hundreds', 'Tens', 'Ones', 'Tenths', 'Hundredths']
/** v hundredths in the hundreds-to-hundredths chart: zeros left of the first digit and after the last are blank. */
const chart5 = (v: number): Picture => {
  const s = String(v).padStart(5, '0').split(''), first = s.findIndex(d => d !== '0'), last = 4 - [...s].reverse().findIndex(d => d !== '0')
  return { kind: 'table', head: PV5, rows: [s.map((d, i) => (i < Math.min(first, 2) || i > Math.max(last, 2) ? '' : d))] }
}
const zeros = (k: number) => (k === 1 ? 'one zero' : k === 2 ? 'two zeros' : 'three zeros')
const placesW = (k: number) => (k === 1 ? 'one place' : k === 2 ? 'two places' : 'three places')
/** A number d / 10^s: d has 2–3 digits, no 0 at either end. Returns the number and where its first digit sits. */
const numOf = (r: Rng, s: number) => {
  const d = until(() => int(r, 11, 999), x => x % 10 !== 0), e = String(d).length - 1 - s
  return { d, s, x: dec(d, s), e, lead: String(d)[0] }
}
const moveStep = (lead: string, e: number, k: number, left: boolean) => `The ${lead} moves from the ${PLACE[e]} to the ${PLACE[left ? e + k : e - k]}.`

const T7: Level[] = [
  { style: 'place chart, one or two places', make: r => {
    const kind = pick(r, ['×10', '÷10', '÷100'] as const)
    if (kind === '×10') {
      const v = int(r, 1, 9) * 100 + notTen(r, 1, 99), ans = dec(v, 1)
      return { text: `Multiply. ${fix(v, 2)} × 10 = ?`, picture: chart5(v), answer: ans,
        steps: ['Times 10 moves every digit one place left.', moveStep(String(v)[0], 0, 1, true), `So ${fix(v, 2)} × 10 = ${fmt(ans)}.`] }
    }
    const k = kind === '÷10' ? 1 : 2, v = kind === '÷10' ? notTen(r, 11, 99) * 10 + int(r, 1, 9) * 10 : notTen(r, 11, 99) * 100
    const x = fmt(dec(v, 2)), ans = dec(v, 2 + k)
    return { text: `Divide. ${x} ÷ ${10 ** k} = ?`, picture: chart5(v), answer: ans,
      steps: [`Divide by ${10 ** k} moves every digit ${placesW(k)} right.`, moveStep(String(v)[0], String(v).length - 3, k, false), `So ${x} ÷ ${10 ** k} = ${fmt(ans)}.`] }
  } },
  { style: 'bare numbers, 10, 100 or 1,000 either way', make: r => {
    const k = int(r, 1, 3), times = r() < 0.5, n = numOf(r, times ? int(r, 1, 2) : int(r, 0, 3 - k)), p = fmt(10 ** k)
    const ans = times ? dec(n.d * 10 ** k, n.s) : dec(n.d, n.s + k), op = times ? '×' : '÷'
    return { text: `${fmt(n.x)} ${op} ${p} = ?`, picture: eq(`${fmt(n.x)} ${op} ${p} = ?`), answer: ans,
      steps: [`${p} has ${zeros(k)}, so every digit moves ${placesW(k)} to the ${times ? 'left' : 'right'}.`, moveStep(n.lead, n.e, k, times), `So ${fmt(n.x)} ${op} ${p} = ${fmt(ans)}.`] }
  } },
  { style: 'pick the true sentence (zeros on the end, wrong way, wrong distance)', make: r => {
    const times = r() < 0.5, k = int(r, 1, 2), k2 = 3 - k, p = fmt(10 ** k)
    const n = numOf(r, times ? int(r, 1, 2) : int(r, 0, 1)), xs = fmt(n.x)
    if (times) {
      const right = `${xs} × ${p} = ${fmt(dec(n.d * 10 ** k, n.s))}`
      return { text: 'Which one is true?', picture: eq(`${xs} × ${p}`),
        answer: choose(r, right, [`${xs} × ${p} = ${xs}${'0'.repeat(k)}`, `${xs} × ${p} = ${fmt(dec(n.d, n.s + k))}`, `${xs} × ${p} = ${fmt(dec(n.d * 10 ** k2, n.s))}`]),
        steps: ['Multiplying makes the number bigger, so every digit moves left. Zeros on the end after the point change nothing.', `${p} has ${zeros(k)}, so the digits move ${placesW(k)}.`, `So ${right}.`] }
    }
    const right = `${xs} ÷ ${p} = ${fmt(dec(n.d, n.s + k))}`
    return { text: 'Which one is true?', picture: eq(`${xs} ÷ ${p}`),
      answer: choose(r, right, [`${xs} ÷ ${p} = ${fmt(dec(n.d * 10 ** k, n.s))}`, `${xs} ÷ ${p} = ${fmt(dec(n.d, n.s + k2))}`]),
      steps: ['Dividing makes the number smaller, so every digit moves right.', `${p} has ${zeros(k)}, so the digits move ${placesW(k)}.`, `So ${right}.`] }
  } },
  { style: 'missing number, work backwards', make: r => {
    const k = int(r, 1, 3), p = fmt(10 ** k), form = int(r, 0, 2)
    if (form === 0) {
      const n = numOf(r, int(r, 1, 2)), y = fmt(dec(n.d * 10 ** k, n.s))
      return { text: `What number goes in the box? ${fmt(n.x)} × ? = ${y}`, picture: eq(`${fmt(n.x)} × ? = ${y}`), answer: 10 ** k,
        steps: [`${fmt(n.x)} became ${y}: every digit moved ${placesW(k)} to the left.`, `Moving ${placesW(k)} left is multiplying by the number with ${zeros(k)}.`, `The missing number is ${p}.`] }
    }
    if (form === 1) {
      const n = numOf(r, int(r, 0, 3 - k)), y = fmt(dec(n.d, n.s + k))
      return { text: `What number goes in the box? ${fmt(n.x)} ÷ ? = ${y}`, picture: eq(`${fmt(n.x)} ÷ ? = ${y}`), answer: 10 ** k,
        steps: [`${fmt(n.x)} became ${y}: every digit moved ${placesW(k)} to the right.`, `Moving ${placesW(k)} right is dividing by the number with ${zeros(k)}.`, `The missing number is ${p}.`] }
    }
    const n = numOf(r, int(r, 1, 2))
    const kk = Math.min(k, 3 - n.s), pp = fmt(10 ** kk), yy = fmt(dec(n.d, n.s + kk))
    return { text: `What number goes in the box? ? ÷ ${pp} = ${yy}`, picture: eq(`? ÷ ${pp} = ${yy}`), answer: n.x,
      steps: [`Go backwards: multiply ${yy} by ${pp}.`, `Every digit moves ${placesW(kk)} to the left.`, `The missing number is ${fmt(n.x)}.`] }
  } },
  { style: 'two-step story, two powers of ten', make: r => {
    if (r() < 0.5) {
      const v = notTen(r, 11, 99), s = int(r, 1, 2), x = dec(v, s), bag = dec(v, s - 1), ans = dec(v * 100, s - 1)
      const [thing, unit, small, big] = pick(r, [['bead', 'grams', 'bag', 'box'], ['seed', 'grams', 'packet', 'crate'], ['marble', 'ounces', 'bag', 'tub']] as const)
      return { text: `Each ${thing} weighs ${fmt(x)} ${unit}. A ${small} holds 10 ${thing}s, and a ${big} holds 100 ${small}s. How many ${unit} of ${thing}s are in a ${big}?`,
        picture: eq(`${thing} × 10 = ${small}`, [`${small} × 100 = ${big}`]), answer: ans,
        steps: [`One ${small}: ${fmt(x)} × 10 = ${fmt(bag)} ${unit}.`, `One ${big}: ${fmt(bag)} × 100 = ${fmt(ans)} ${unit}.`, `So a ${big} holds ${fmt(ans)} ${unit} of ${thing}s.`] }
    }
    const c = notTen(r, 11, 99), one = dec(c, 2), ans = dec(c, 1)
    const [thing, packs] = pick(r, [['sticker', 'stickers'], ['eraser', 'erasers'], ['balloon', 'balloons']] as const)
    return { text: `A box of 100 ${packs} costs $${c}. Each ${thing} costs the same. How much do 10 ${packs} cost?`,
      picture: eq('box ÷ 100 = one', ['one × 10 = ?']), answer: ans,
      steps: [`One ${thing}: $${c} ÷ 100 = $${fix(c, 2)}.`, `10 ${packs}: $${fix(c, 2)} × 10 = $${fix(c, 1)}0.`, `So 10 ${packs} cost $${fix(c, 1)}0.`] }
  } },
]

// ── t8 · Divide a decimal by a whole number ────────────────────────────────────────────────────────────────
/** x ÷ d with a quotient q counted in tenths (or hundredths when p = 2); x is below 10. */
const divOf = (r: Rng, p: number) => until(() => {
  const d = int(r, 2, 9), q = int(r, 2, Math.floor((10 ** (p + 1) - 1) / d)), N = q * d
  return { d, q, N, x: fmt(dec(N, p)), ans: dec(q, p), unit: p === 1 ? 'tenths' : 'hundredths' }
}, o => o.N % 10 !== 0 && o.q % 10 !== 0)

const T8: Level[] = [
  { style: 'count in tenths first (said for you)', make: r => {
    const o = divOf(r, 1)
    return { text: `${o.x} is ${o.N} tenths. Share them into ${o.d} equal parts. What is ${o.x} ÷ ${o.d}?`, picture: { kind: 'tape', rows: [{ cells: Array.from({ length: o.d }, () => ({ w: 1, text: '?' })), brace: o.x }] },
      answer: o.ans, steps: [`${o.x} is ${o.N} tenths.`, `${o.N} ÷ ${o.d} = ${o.q}, so each part is ${o.q} tenths.`, `${o.q} tenths is ${fmt(o.ans)}, so ${o.x} ÷ ${o.d} = ${fmt(o.ans)}.`] }
  } },
  { style: 'bare division, tenths or hundredths', make: r => {
    const o = divOf(r, pick(r, [1, 2]))
    return { text: `Find ${o.x} ÷ ${o.d}.`, picture: eq(`${o.x} ÷ ${o.d} = ?`), answer: o.ans,
      steps: [`${o.x} is ${o.N} ${o.unit}.`, `${o.N} ÷ ${o.d} = ${o.q}, so each part is ${o.q} ${o.unit}.`, `${o.q} ${o.unit} is ${fmt(o.ans)}, so ${o.x} ÷ ${o.d} = ${fmt(o.ans)}.`] }
  } },
  { style: 'put the point back (pick one)', make: r => {
    const o = until(() => divOf(r, pick(r, [1, 2])), q => !JSON.stringify(eq(`${q.N} ÷ ${q.d} = ${q.q}`, [`${q.x} ÷ ${q.d} = ?`])).includes(fmt(q.ans)))
    const right = fmt(o.ans), p = o.unit === 'tenths' ? 1 : 2
    return { text: `${o.N} ÷ ${o.d} = ${o.q}. So what is ${o.x} ÷ ${o.d}?`, picture: eq(`${o.N} ÷ ${o.d} = ${o.q}`, [`${o.x} ÷ ${o.d} = ?`]),
      answer: choose(r, right, [String(o.q), fmt(dec(o.q, p + 1))]),
      steps: [`${o.x} is ${o.N} ${o.unit}.`, `So ${o.x} ÷ ${o.d} is ${o.q} ${o.unit}, not ${o.q}.`, `${o.q} ${o.unit} is ${right}.`] }
  } },
  { style: 'missing number shared, work backwards', make: r => {
    const o = divOf(r, 1), y = fmt(o.ans)
    return { text: `What number goes in the box? ? ÷ ${o.d} = ${y}`, picture: { kind: 'tape', rows: [{ cells: Array.from({ length: o.d }, () => ({ w: 1, text: y })), brace: '?' }] },
      answer: dec(o.N, 1), steps: [`Go backwards: the missing number is ${o.d} × ${y}.`, `${y} is ${o.q} tenths, and ${o.d} × ${o.q} tenths = ${o.N} tenths.`, `${o.N} tenths is ${o.x}, so the missing number is ${o.x}.`] }
  } },
  { style: 'two-step story, cut off then share', make: r => {
    const o = divOf(r, 1), c = notTen(r, 3, 29), L = o.N + c
    const [thing, who] = pick(r, [['rope', 'Ana'], ['ribbon', 'Sam'], ['board', 'Kai']] as const)
    return { text: `A ${thing} is ${fmt(dec(L, 1))} meters long. ${who} cuts off ${fmt(dec(c, 1))} meters. Then the rest is cut into ${o.d} equal pieces. How long is each piece?`,
      picture: eq(`${fmt(dec(L, 1))} − ${fmt(dec(c, 1))} = ?`, [`? ÷ ${o.d} = ?`]), answer: o.ans,
      steps: [`First take away: ${fmt(dec(L, 1))} − ${fmt(dec(c, 1))} = ${o.x}.`, `${o.x} is ${o.N} tenths, and ${o.N} ÷ ${o.d} = ${o.q} tenths.`, `So each piece is ${fmt(o.ans)} meters long.`] }
  } },
]

// ── t9 · Change metric units ───────────────────────────────────────────────────────────────────────────────
const UNITS = [
  { big: 'kilometer', small: 'meter', k: 1000, bs: 'km', ss: 'm', same: 'length', has: (x: string) => `A trail is ${x} long.`, used: 'Mia has walked' },
  { big: 'meter', small: 'centimeter', k: 100, bs: 'm', ss: 'cm', same: 'length', has: (x: string) => `A ribbon is ${x} long.`, used: 'Leo cuts off' },
  { big: 'kilogram', small: 'gram', k: 1000, bs: 'kg', ss: 'g', same: 'weight', has: (x: string) => `A bag holds ${x} of flour.`, used: 'Ava uses' },
  { big: 'liter', small: 'milliliter', k: 1000, bs: 'L', ss: 'mL', same: 'amount', has: (x: string) => `A jug holds ${x} of juice.`, used: 'Sam pours out' },
] as const
/** A big-unit amount with 1 or 2 places (hundredths), never whole: [hundredths, places]. */
const bigAmount = (r: Rng, k: number) => {
  const p = k === 100 ? 2 : pick(r, [1, 2]), h = p === 1 ? decimal(r, 1, 9, 1) * 10 : decimal(r, 1, 9, 2)
  return { h, x: fmt(dec(h, 2)), smallN: (h * k) / 100 }
}
/** A small-unit amount that is not a whole number of big units. */
const smallAmount = (r: Rng, k: number) => (k === 100 ? notTen(r, 101, 999) : until(() => int(r, 11, 999) * 10, n => n % 1000 !== 0))

const T9: Level[] = [
  { style: 'to the smaller unit, with the table', make: r => {
    const u = pick(r, UNITS), { x, smallN } = bigAmount(r, u.k)
    return { text: `How many ${u.small}s is ${x} ${u.big}s?`, picture: { kind: 'table', head: [`${cap(u.big)}s`, `${cap(u.small)}s`], rows: [['1', fmt(u.k)], [x, '?']] },
      answer: smallN, steps: [`${cap(u.small)}s are smaller, so there will be more of them. Multiply.`, `1 ${u.big} is ${fmt(u.k)} ${u.small}s, so find ${x} × ${fmt(u.k)}.`, `So ${x} ${u.big}s is ${fmt(smallN)} ${u.small}s.`] }
  } },
  { style: 'to the bigger unit, with the table', make: r => {
    const u = pick(r, UNITS), n = smallAmount(r, u.k), ans = Math.round((n / u.k) * 1e6) / 1e6
    return { text: `How many ${u.big}s is ${fmt(n)} ${u.small}s?`, picture: { kind: 'table', head: [`${cap(u.small)}s`, `${cap(u.big)}s`], rows: [[fmt(u.k), '1'], [fmt(n), '?']] },
      answer: ans, steps: [`${cap(u.big)}s are bigger, so there will be fewer of them. Divide.`, `${fmt(u.k)} ${u.small}s is 1 ${u.big}, so find ${fmt(n)} ÷ ${fmt(u.k)}.`, `So ${fmt(n)} ${u.small}s is ${fmt(ans)} ${u.big}s.`] }
  } },
  { style: 'bare, either way, with unit symbols', make: r => {
    const u = pick(r, UNITS)
    if (r() < 0.5) {
      const { x, smallN } = bigAmount(r, u.k)
      return { text: `Change the units. ${x} ${u.bs} = ? ${u.ss}`, picture: eq(`${x} ${u.bs} = ? ${u.ss}`), answer: smallN,
        steps: [`${u.ss} is the smaller unit, so multiply by ${fmt(u.k)}.`, `Every digit moves ${placesW(Math.log10(u.k))} to the left.`, `So ${x} ${u.bs} = ${fmt(smallN)} ${u.ss}.`] }
    }
    const n = smallAmount(r, u.k), ans = Math.round((n / u.k) * 1e6) / 1e6
    return { text: `Change the units. ${fmt(n)} ${u.ss} = ? ${u.bs}`, picture: eq(`${fmt(n)} ${u.ss} = ? ${u.bs}`), answer: ans,
      steps: [`${u.bs} is the bigger unit, so divide by ${fmt(u.k)}.`, `Every digit moves ${placesW(Math.log10(u.k))} to the right.`, `So ${fmt(n)} ${u.ss} = ${fmt(ans)} ${u.bs}.`] }
  } },
  { style: 'pick the one that is the same (spot multiply vs divide)', make: r => {
    const u = pick(r, UNITS)
    if (r() < 0.5) {
      const { h, x, smallN } = bigAmount(r, u.k), right = `${fmt(smallN)} ${u.small}s`
      return { text: `${u.has(`${x} ${u.big}s`)} Which is the same ${u.same}?`, picture: eq(`${x} ${u.bs} = ? ${u.ss}`),
        answer: choose(r, right, [`${fmt(dec(h, u.k === 100 ? 4 : 5))} ${u.small}s`, `${fmt(smallN / 10)} ${u.small}s`]),
        steps: [`${cap(u.small)}s are smaller, so there are more of them. Multiply by ${fmt(u.k)}.`, `${x} × ${fmt(u.k)} = ${fmt(smallN)}.`, `So it is ${right}.`] }
    }
    const n = smallAmount(r, u.k), ans = Math.round((n / u.k) * 1e6) / 1e6, right = `${fmt(ans)} ${u.big}s`
    return { text: `${u.has(`${fmt(n)} ${u.small}s`)} Which is the same ${u.same}?`, picture: eq(`${fmt(n)} ${u.ss} = ? ${u.bs}`),
      answer: choose(r, right, [`${fmt(n * u.k)} ${u.big}s`, `${fmt(Math.round(ans * 10 * 1e6) / 1e6)} ${u.big}s`]),
      steps: [`${cap(u.big)}s are bigger, so there are fewer of them. Divide by ${fmt(u.k)}.`, `${fmt(n)} ÷ ${fmt(u.k)} = ${fmt(ans)}.`, `So it is ${right}.`] }
  } },
  { style: 'two-step story, change units then take away', make: r => {
    const u = pick(r, UNITS)
    const { x, smallN, used } = until(() => {
      const b = bigAmount(r, u.k), used = u.k === 100 ? int(r, 10, b.smallN - 10) : int(r, 1, Math.floor(b.smallN / 50) - 1) * 50
      return { ...b, used }
    }, o => o.used > 0 && o.smallN - o.used >= 10 && o.smallN - o.used !== o.used)
    const ans = smallN - used, walk = u.k === 1000 && u.small === 'meter'
    const leftWords = walk ? `${u.small}s are left to walk` : `${u.small}s are left`
    return { text: `${u.has(`${x} ${u.big}s`)} ${u.used} ${fmt(used)} ${u.small}s. How many ${leftWords.replace(`${u.small}s `, `${u.small}s `)}?`,
      picture: eq(`${x} ${u.bs} − ${fmt(used)} ${u.ss}`), answer: ans,
      steps: [`First change to ${u.small}s: ${x} × ${fmt(u.k)} = ${fmt(smallN)}.`, `Then take away: ${fmt(smallN)} − ${fmt(used)} = ${fmt(ans)}.`, `So ${fmt(ans)} ${leftWords}.`] }
  } },
]

export const G5M4_LADDERS: Record<string, Level[]> = {
  'g5m4-t1': T1, 'g5m4-t2': T2, 'g5m4-t3': T3, 'g5m4-t4': T4, 'g5m4-t5': T5, 'g5m4-t6': T6, 'g5m4-t7': T7, 'g5m4-t8': T8, 'g5m4-t9': T9,
}
