/**
 * Grade 3 · Module 2 — the practice ladders (see ../adaptive.ts). One ladder per topic, easiest style first.
 * ⚠️ A level is a different KIND of question, never the level below with bigger numbers.
 * ⚠️ The gate counts only numbers a picture PRINTS as strings. A number printed FROM numeric data (a number line's `ends`
 * labels, a scale's marks) is invisible to it — so readings sit one mark past a printed number, and a rounding line
 * keeps `labels: 'none'` (the lesson's own turn picture) so the two tens are never printed.
 */
import type { Picture } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const choose = (r: Rng, right: string, wrong: string[]) => {
  const choices = shuffle(r, [right, ...wrong])
  return { choices, correct: choices.indexOf(right) }
}
const until = <T>(gen: () => T, ok: (x: T) => boolean): T => { let x = gen(); while (!ok(x)) x = gen(); return x }
/** Every number a picture prints as a string label — the same reading the gate does (a string row is also read joined). */
const shown = (pic: Picture): Set<string> => {
  const texts: string[] = []
  const walk = (v: unknown) => {
    if (typeof v === 'string') texts.push(v)
    else if (Array.isArray(v)) { if (v.every(x => typeof x === 'string')) texts.push(v.join('')); v.forEach(walk) }
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  walk(pic)
  return new Set(texts.flatMap(t => t.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map(t => t.replace(/,/g, '')))
}
const hides = (pic: Picture, a: number) => a < 10 || !shown(pic).has(String(a))
const pl = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
const NAMES = ['Mia', 'Leo', 'Ava', 'Sam', 'Nia', 'Ben', 'Zoe', 'Max', 'Kim', 'Jon']

// ── clocks ──────────────────────────────────────────────────────────────────────────────────────────────────
const pad = (m: number) => String(m).padStart(2, '0')
const next = (h: number) => (h % 12) + 1
/** A clock time; minutes of 60 or more roll into the next hour. */
const T = (h: number, m: number) => `${m >= 60 ? next(h) : h}:${pad(m % 60)}`
const clock = (h: number, m: number, extra: { fives?: boolean; hands?: boolean } = {}): Picture => ({ kind: 'clock', h, m, ...extra })
const hourStep = (h: number, m: number) => m >= 45
  ? `The short hand is almost on the ${next(h)}. It has not reached it, so the hour is still ${h}.`
  : `The short hand is just past the ${h}, so the hour is ${h}.`
const fives = (k: number) => k <= 4 ? Array.from({ length: k }, (_, i) => (i + 1) * 5).join(', ') : `${k} times, ${k * 5}`

const T1: Level[] = [
  { style: 'clock with the 5s printed', make: r => {
    const h = int(r, 1, 12), k = int(r, 1, 11), m = k * 5
    return { text: 'What time is it? The 5s are written around the clock to help you.', picture: clock(h, m, { fives: true }), answer: { time: [h, m] },
      steps: [hourStep(h, m), `The long hand is on the ${k}. Count by 5s: ${fives(k)}.`, `It is ${T(h, m)}.`] }
  } },
  { style: 'plain clock', make: r => {
    const h = int(r, 1, 12), k = int(r, 1, 11), m = k * 5
    return { text: 'What time does this clock show?', picture: clock(h, m), answer: { time: [h, m] },
      steps: [hourStep(h, m), `The long hand is on the ${k}. Count by 5s: ${fives(k)}.`, `It is ${T(h, m)}.`] }
  } },
  { style: 'fix the mix-up (pick the right time)', make: r => {
    const h = int(r, 1, 12), k = int(r, 1, 11), m = k * 5, name = pick(r, NAMES)
    const wrong = `${h}:${pad(k)}`, right = T(h, m)
    return { text: `${name} reads this clock as ${wrong}. What time does it really show?`, picture: clock(h, m),
      answer: choose(r, right, [wrong, T(next(h), m)]),
      steps: [hourStep(h, m), `The long hand on the ${k} means ${m} minutes, not ${k}.`, `It really shows ${right}.`] }
  } },
  { style: 'work backwards: where does the long hand go?', make: r => {
    const { h, k } = until(() => ({ h: int(r, 1, 12), k: int(r, 1, 11) }), x => x.h !== x.k)
    const m = k * 5
    return { text: `The show starts at ${T(h, m)}. The clock has no hands yet. Which number will the long hand point to?`,
      picture: clock(h, m, { hands: false }), answer: k,
      steps: ['Each number on the clock is 5 more minutes.', `${m} minutes is ${pl(k, 'jump')} of 5.`, `So the long hand points to the ${k}.`] }
  } },
  { style: 'story: count on by 5s', make: r => {
    const h = int(r, 1, 12), k = int(r, 1, 8), j = int(r, 2, Math.min(4, 11 - k)), m = k * 5, end = m + 5 * j, name = pick(r, NAMES)
    const count = Array.from({ length: j }, (_, i) => m + 5 * (i + 1)).join(', ')
    return { text: `${name}'s clock shows this. The bus comes when the long hand has moved ${j} more numbers. What time does the bus come?`,
      picture: clock(h, m), answer: { time: [h, end] },
      steps: [`The clock shows ${T(h, m)}.`, `Each number is 5 more minutes. Count on by 5s: ${count}.`, `The bus comes at ${T(h, end)}.`] }
  } },
]

// t2 · to the minute: m is never a multiple of 5, and the long hand has passed at least the 1.
const minute = (r: Rng) => until(() => ({ h: int(r, 1, 12), m: int(r, 6, 59) }), x => x.m % 5 !== 0)
const ones = (from: number, d: number) => Array.from({ length: d }, (_, i) => from + i + 1).join(', ')
const readMinute = (h: number, m: number) => {
  const k = Math.floor(m / 5), d = m - 5 * k
  return [hourStep(h, m), `The long hand has passed the ${k}. Count by 5s to the ${k}: ${5 * k}. Then count on ${pl(d, 'little mark')}: ${ones(5 * k, d)}.`]
}

const T2: Level[] = [
  { style: 'clock with the 5s printed', make: r => {
    const { h, m } = minute(r)
    return { text: 'What time is it? Count by 5s, then by 1s.', picture: clock(h, m, { fives: true }), answer: { time: [h, m] },
      steps: [...readMinute(h, m), `It is ${T(h, m)}.`] }
  } },
  { style: 'plain clock', make: r => {
    const { h, m } = minute(r)
    return { text: 'What time does this clock show?', picture: clock(h, m), answer: { time: [h, m] },
      steps: [...readMinute(h, m), `It is ${T(h, m)}.`] }
  } },
  { style: 'spot the mistake (pick the right time)', make: r => {
    const { h, m } = minute(r), k = Math.floor(m / 5), name = pick(r, NAMES), right = T(h, m)
    const stopped = `${h}:${pad(5 * k)}`
    return { text: `${name} says this clock shows ${stopped}. What time does it really show?`, picture: clock(h, m),
      answer: choose(r, right, [stopped, `${h}:${pad(k)}`]),
      steps: [`The long hand went past the ${k}, so count by 5s to ${5 * k}.`, `Do not stop there. Count on ${pl(m - 5 * k, 'little mark')}: ${ones(5 * k, m - 5 * k)}.`, `It really shows ${right}.`] }
  } },
  { style: 'time from words', make: r => {
    const { h, m } = minute(r), k = Math.floor(m / 5), d = m - 5 * k
    return { text: `The short hand is between the ${h} and the ${next(h)}. The long hand is ${pl(d, 'little mark')} past the ${k}. What time is it?`,
      picture: clock(h, m, { hands: false, fives: true }), answer: { time: [h, m] },
      steps: [`The short hand has not reached the ${next(h)}, so the hour is ${h}.`, `Count by 5s to the ${k}: ${5 * k}. Count on ${d}: ${ones(5 * k, d)}.`, `It is ${T(h, m)}.`] }
  } },
  { style: 'story: a few minutes later', make: r => {
    const { h, m, d } = until(() => ({ ...minute(r), d: int(r, 2, 9) }), x => x.m + x.d <= 59)
    const name = pick(r, NAMES)
    return { text: `${name}'s clock shows this. ${name} leaves for school ${d} minutes later. What time does ${name} leave?`,
      picture: clock(h, m), answer: { time: [h, m + d] },
      steps: [`First read the clock: it shows ${T(h, m)}.`, `Count on ${d} minutes by 1s: ${ones(m, d)}.`, `${name} leaves at ${T(h, m + d)}.`] }
  } },
]

// ── t3 · elapsed time ───────────────────────────────────────────────────────────────────────────────────────
/** The lesson's timeline: a tick every 5 minutes, a clock-time label every 10. */
const timeline = (h: number, from: number, to: number, extra: Record<string, unknown> = {}): Picture => ({
  kind: 'numline', min: from, max: to, ticks: (to - from) / 5,
  labels: Array.from({ length: (to - from) / 5 + 1 }, (_, i) => {
    const m = from + i * 5
    return m % 10 ? null : `${((h - 1 + Math.floor(m / 60)) % 12) + 1}:${String(m % 60).padStart(2, '0')}`
  }),
  ...extra,
} as Picture)
/** Start and end inside one hour: one ends in 5 and the other in 0, so there is a 5-minute hop and at least one 10. */
const inHour = (r: Rng) => until(() => ({ h: int(r, 1, 12), s: int(r, 1, 10) * 5, e: int(r, 3, 11) * 5 }),
  x => x.e - x.s >= 15 && (x.s % 10 === 0) !== (x.e % 10 === 0))
/** The jumps from s to e: to the next 10, by 10s, then the last 5. */
const hops = (s: number, e: number) => {
  const out: [number, number][] = []
  let at = s
  if (at % 10) { out.push([at, at + 5]); at += 5 }
  while (at + 10 <= e) { out.push([at, at + 10]); at += 10 }
  if (at < e) out.push([at, e])
  return out
}
const hopSteps = (h: number, s: number, e: number) => {
  const js = hops(s, e), parts: number[] = [], lines: string[] = []
  const tens = js.filter(([a, b]) => b - a === 10)
  if (s % 10) { lines.push(`From ${T(h, s)} to ${T(h, s + 5)} is 5 minutes.`); parts.push(5) }
  lines.push(`From ${T(h, tens[0][0])} to ${T(h, tens.at(-1)![1])} is ${pl(tens.length, 'jump')} of 10, so ${tens.length * 10} minutes.`); parts.push(tens.length * 10)
  if (e % 10) { lines.push(`From ${T(h, e - 5)} to ${T(h, e)} is 5 more minutes.`); parts.push(5) }
  return { lines: [lines.join(' ')], sum: `${parts.join(' + ')} = ${e - s}.` }
}
const jumpsPic = (s: number, e: number) => hops(s, e).map(([from, to]) => ({ from, to, label: String(to - from) }))
const EVENTS = ['The game', 'Art class', 'Music', 'Recess', 'The bike ride', 'Swim class']

const T3: Level[] = [
  { style: 'jumps drawn on the timeline', make: r => {
    const { h, s, e } = until(() => inHour(r), x => hides(timeline(x.h, 0, 60, { points: [{ at: x.s, label: 'start' }, { at: x.e, label: 'end' }], jumps: jumpsPic(x.s, x.e) }), x.e - x.s))
    const { lines, sum } = hopSteps(h, s, e)
    return { text: `How many minutes is it from ${T(h, s)} to ${T(h, e)}? Add up the jumps.`,
      picture: timeline(h, 0, 60, { points: [{ at: s, label: 'start' }, { at: e, label: 'end' }], jumps: jumpsPic(s, e) }), answer: e - s,
      steps: [...lines, `Add up the jumps: ${sum} It is ${e - s} minutes.`] }
  } },
  { style: 'start marked, make your own jumps', make: r => {
    const { h, s, e } = until(() => inHour(r), x => hides(timeline(x.h, 0, 60, { points: [{ at: x.s, label: 'start' }] }), x.e - x.s))
    const { lines, sum } = hopSteps(h, s, e)
    return { text: `How many minutes is it from ${T(h, s)} to ${T(h, e)}?`, picture: timeline(h, 0, 60, { points: [{ at: s, label: 'start' }] }), answer: e - s,
      steps: [`Start at ${T(h, s)} and jump to ${T(h, e)}.`, ...lines, `Add up the jumps: ${sum} It is ${e - s} minutes.`] }
  } },
  { style: 'spot the mistake: a time is not a length', make: r => {
    const { h, s, e } = inHour(r), name = pick(r, NAMES), ev = pick(r, EVENTS), right = `${e - s} minutes`
    const { lines, sum } = hopSteps(h, s, e)
    return { text: `${ev} starts at ${T(h, s)} and ends at ${T(h, e)}. ${name} says it is ${T(h, e)} long. How long is it really?`,
      picture: timeline(h, 0, 60, { points: [{ at: s, label: 'start' }, { at: e, label: 'end' }] }),
      answer: choose(r, right, [T(h, e), `${e} minutes`]),
      steps: [`${T(h, e)} is when it ends, not how long it is.`, ...lines, `${sum} It is ${right}.`] }
  } },
  { style: 'work forwards: find the end time', make: r => {
    const { h, s, e } = inHour(r), ev = pick(r, EVENTS)
    const { lines } = hopSteps(h, s, e)
    return { text: `${ev} starts at ${T(h, s)}. It lasts ${e - s} minutes. What time does it end?`,
      picture: timeline(h, 0, 60, { points: [{ at: s, label: 'start' }] }), answer: { time: [h, e] },
      steps: [`Start at ${T(h, s)} and jump until the jumps make ${e - s} minutes.`, ...lines, `It ends at ${T(h, e)}.`] }
  } },
  { style: 'story across the hour', make: r => {
    const { h, s, e } = until(() => ({ h: int(r, 1, 12), s: int(r, 7, 11) * 5, e: int(r, 13, 18) * 5 }),
      x => x.e - x.s >= 15 && hides(timeline(x.h, 30, 90, { points: [{ at: x.s, label: 'start' }] }), x.e - x.s))
    const ev = pick(r, ['A movie', 'A puppet show', 'Soccer practice', 'A bake sale']), a = 60 - s, b = e - 60
    return { text: `${ev} starts at ${T(h, s)}. It ends at ${T(h, e)}. How many minutes long is it?`,
      picture: timeline(h, 30, 90, { points: [{ at: s, label: 'start' }] }), answer: e - s,
      steps: [`From ${T(h, s)} to ${T(h, 60)} is ${a} minutes.`, `From ${T(h, 60)} to ${T(h, e)} is ${b} more minutes.`, `${a} + ${b} = ${e - s}. It is ${e - s} minutes long.`] }
  } },
]

// ── t4 · scales, t5 · jugs ──────────────────────────────────────────────────────────────────────────────────
const tool = (t: 'scale' | 'jug', unit: string, value: number, max: number, step: number, labelEvery: number): Picture =>
  ({ kind: 'measure', tool: t, max, step, labelEvery, value, unit })
/** A small reading (under 10) on a 1-per-mark tool, never on a printed number. */
const small = (r: Rng) => until(() => { const [max, lab] = pick(r, [[10, 2], [20, 5]]); return { max, lab, v: int(r, 1, 9) } }, x => x.v % x.lab !== 0)
/** A big reading on a 100-per-mark or 50-per-mark tool, one mark past a printed number. */
const big = (r: Rng) => pick(r, [
  () => ({ max: 1000, step: 100, lab: 200, v: pick(r, [300, 500, 700, 900]) }),
  () => ({ max: 500, step: 50, lab: 100, v: pick(r, [150, 250, 350, 450]) }),
])()
const G_ITEMS = ['bag of apples', 'bag of flour', 'book', 'box of pasta', 'bag of rice', 'jar of honey']
const KG_ITEMS = ['puppy', 'suitcase', 'bag of dog food', 'watermelon', 'box of books']

const T4: Level[] = [
  { style: 'kilogram scale, 1 per mark', make: r => {
    const { max, lab, v } = small(r), item = pick(r, KG_ITEMS), base = v - (v % lab)
    return { text: `How heavy is the ${item}?`, picture: tool('scale', 'kilograms', v, max, 1, lab), answer: v,
      steps: [`From 0 to ${lab} there are ${lab} jumps, so each mark is 1 kilogram.`, `The needle is ${pl(v - base, 'mark')} past ${base}.`, `So the ${item} weighs ${pl(v, 'kilogram')}.`] }
  } },
  { style: 'gram scale, each mark worth more than 1', make: r => {
    const { max, step, lab, v } = big(r), item = pick(r, G_ITEMS)
    return { text: `How many grams does the ${item} weigh? Find what one mark is worth first.`, picture: tool('scale', 'grams', v, max, step, lab),
      answer: v,
      steps: [`From 0 to ${lab} there are 2 jumps, so each mark is ${step} grams.`, `The needle is 1 mark past ${v - step}.`, `So the ${item} weighs ${v} grams.`] }
  } },
  { style: 'spot the mistake (say what went wrong)', make: r => {
    const { max, step, lab, v } = big(r), item = pick(r, G_ITEMS), name = pick(r, NAMES)
    const kinds = [
      { claim: v, right: 'Yes. That is right.' },
      { claim: v - step + 1, right: `No. Each mark is worth ${step} grams, not 1 gram.` },
      { claim: v - step, right: 'No. The needle is past that number, not on it.' },
    ]
    const { claim, right } = pick(r, kinds)
    return { text: `${name} says the ${item} weighs ${claim} grams. Is that right?`, picture: tool('scale', 'grams', v, max, step, lab),
      answer: choose(r, right, kinds.map(k => k.right).filter(t => t !== right)),
      steps: [`Each mark is ${step} grams, and the needle is 1 mark past ${v - step}.`, `So the ${item} weighs ${v} grams.`, right] }
  } },
  { style: 'how many more to make 1 kilogram', make: r => {
    const item = pick(r, G_ITEMS)
    const v = until(() => pick(r, [100, 300, 500, 700, 900]), x => hides(tool('scale', 'grams', x, 1000, 100, 200), 1000 - x) && x !== 500)
    const n = (1000 - v) / 100
    return { text: `1 kilogram is 1,000 grams. How many more grams does the ${item} need to weigh 1 kilogram?`,
      picture: tool('scale', 'grams', v, 1000, 100, 200), answer: 1000 - v,
      steps: [`Each mark is 100 grams, so the ${item} weighs ${v} grams now.`, `Count up from ${v} to 1,000 by 100s: that is ${pl(n, 'jump')} of 100.`, `So it needs ${1000 - v} more grams.`] }
  } },
  { style: 'two-step story: read, then add', make: r => {
    const v = pick(r, [200, 300, 400, 500, 600]), s = pick(r, [150, 250, 350]), [a, b] = shuffle(r, G_ITEMS).slice(0, 2), name = pick(r, NAMES)
    return { text: `${name} puts a ${a} on the scale. The scale shows the ${a}. Then a ${b} that weighs ${s} grams goes on too. How many grams are on the scale now?`,
      picture: tool('scale', 'grams', v, 1000, 100, 200), answer: v + s,
      steps: [`Each mark is 100 grams, so the ${a} weighs ${v} grams.`, `Add the ${b}: ${v} + ${s}.`, `So there are ${v + s} grams on the scale now.`] }
  } },
]

const ML_ITEMS = ['cup of juice', 'glass of milk', 'bottle of water', 'bowl of soup', 'mug of cocoa']
const L_ITEMS: [string, number[]][] = [['bucket', [8, 10, 12]], ['fish tank', [20, 40, 50, 60]], ['bathtub', [100, 150, 200]], ['kitchen sink', [20, 25, 30]], ['wading pool', [200, 300, 400]]]

const T5: Level[] = [
  { style: 'liter jug, 1 per mark', make: r => {
    const { max, lab, v } = small(r), what = pick(r, ['water are in the bucket', 'soup are in the pot', 'water are in the fish tank']), base = v - (v % lab)
    return { text: `How many liters of ${what}?`, picture: tool('jug', 'liters', v, max, 1, lab), answer: v,
      steps: [`From 0 to ${lab} there are ${lab} jumps, so each mark is 1 liter.`, `The top is ${pl(v - base, 'mark')} above ${base}.`, `So there ${v === 1 ? 'is' : 'are'} ${pl(v, 'liter')}.`] }
  } },
  { style: 'milliliter jug, each mark worth more than 1', make: r => {
    const { max, step, lab, v } = big(r), drink = pick(r, ['juice', 'milk', 'water', 'lemonade'])
    return { text: `How many milliliters of ${drink} are in the jug?`, picture: tool('jug', 'milliliters', v, max, step, lab),
      answer: v,
      steps: [`From 0 to ${lab} there are 2 jumps, so each mark is ${step} milliliters.`, `The ${drink} is 1 mark above ${v - step}. Keep counting up to the top.`, `So there are ${v} milliliters.`] }
  } },
  { style: 'milliliters or liters?', make: r => {
    if (r() < 0.5) {
      const item = pick(r, ML_ITEMS), n = int(r, 3, 10) * 50, right = `${n} milliliters`
      return { text: `About how much does a ${item} hold?`, picture: eq(`${n} ?`, [`a ${item}`]), answer: choose(r, right, [`${n} liters`]),
        steps: [`A ${item} holds a small amount, so we use milliliters.`, `${n} liters would fill many buckets.`, `So it holds about ${right}.`] }
    }
    const [item, amounts] = pick(r, L_ITEMS), n = pick(r, amounts), right = `${n} liters`
    return { text: `About how much does a ${item} hold?`, picture: eq(`${n} ?`, [`a ${item}`]), answer: choose(r, right, [`${n} milliliters`]),
      steps: [`A ${item} holds a big amount, so we use liters.`, `${n} milliliters is far too little for a ${item}.`, `So it holds about ${right}.`] }
  } },
  { style: 'how many cups can it fill', make: r => {
    const { max, step, lab, v } = big(r), n = v / step
    return { text: `Each cup holds ${step} milliliters. How many cups can you fill from this jug?`,
      picture: tool('jug', 'milliliters', v, max, step, lab), answer: n,
      steps: [`From 0 to ${lab} there are 2 jumps, so each mark is ${step} milliliters.`, `A cup holds ${step} milliliters, so every mark up to the top fills 1 cup.`, `Count the marks from 0 to the top: ${n}. You can fill ${n} cups.`] }
  } },
  { style: 'two-step story: read, then pour out twice', make: r => {
    const { v, g } = until(() => ({ v: pick(r, [500, 600, 700, 800, 900]), g: pick(r, [100, 150, 200]) }),
      x => x.v - 2 * x.g >= 100 && hides(tool('jug', 'milliliters', x.v, 1000, 100, 200), x.v - 2 * x.g))
    const name = pick(r, NAMES), a = v - 2 * g
    return { text: `The jug shows how much lemonade there is. ${name} pours ${g} milliliters into each of 2 glasses. How many milliliters are left in the jug?`,
      picture: tool('jug', 'milliliters', v, 1000, 100, 200), answer: a,
      steps: [`Each mark is 100 milliliters, so the jug has ${v} milliliters.`, `The 2 glasses take ${g} + ${g} = ${2 * g} milliliters.`, `${v} − ${2 * g} = ${a}. So ${a} milliliters are left.`] }
  } },
]

// ── t6 · round to 10, t7 · round to 100 ─────────────────────────────────────────────────────────────────────
const round = (n: number, p: number) => Math.floor(n / p) * p + (n % p >= p / 2 ? p : 0)
/** The rounding steps: the two tens (or hundreds), how far each is, and which one wins. */
const roundSteps = (n: number, p: number) => {
  const lo = n - (n % p), hi = lo + p, d = n - lo
  const far = p === 10
    ? (d === 5 ? `${n} is right in the middle: 5 jumps each way. In the middle, it goes up.` : `${n} is ${pl(d, 'jump')} from ${lo} and ${pl(hi - n, 'jump')} from ${hi}.`)
    : (d === 50 ? `${n} is right in the middle: 50 each way. In the middle, it goes up.` : `${n} is ${d} more than ${lo}, and ${hi - n} less than ${hi}.`)
  return [`${n} is between ${fmt(lo)} and ${fmt(hi)}.`, far]
}
/** The lesson's turn picture: the line between the two tens, with only the number itself printed. */
const between = (n: number, p: number): Picture => ({
  kind: 'numline', min: n - (n % p), max: n - (n % p) + p, ticks: 10, labels: 'none', points: [{ at: n, label: String(n) }],
})

const roundLadder = (p: 10 | 100): Level[] => {
  const word = p === 10 ? 'ten' : 'hundred'
  const num = (r: Rng, lo: number, hi: number) => until(() => int(r, lo, hi), n => n % p !== 0)
  const [lo1, hi1, lo2, hi2] = p === 10 ? [11, 99, 15, 199] : [110, 999, 110, 999]
  return [
    { style: 'number line between the two', make: r => {
      // Never halfway: "closer to" has no answer there.
      const n = until(() => num(r, lo1, hi1), x => x % p !== p / 2), a = round(n, p)
      return { text: `Round ${n} to the nearest ${word}. Which ${word} is it closer to?`, picture: between(n, p), answer: a,
        steps: [...roundSteps(n, p), `So ${n} rounds to ${fmt(a)}.`] }
    } },
    { style: 'bare number', make: r => {
      const n = num(r, lo2, hi2), a = round(n, p)
      return { text: `Round ${n} to the nearest ${word}.`, picture: eq(`${n} → ?`), answer: a, steps: [...roundSteps(n, p), `So ${n} rounds to ${fmt(a)}.`] }
    } },
    { style: 'pick the number that rounds to it', make: r => {
      const X = p === 10 ? int(r, 2, 9) * 10 : int(r, 2, 9) * 100, h = p / 2
      const right = until(() => int(r, X - h, X + h - 1), n => n !== X)
      const below = int(r, X - p + 1, X - h - 1), above = int(r, X + h, X + p - 1)
      return { text: `Which number rounds to ${X} when you round to the nearest ${word}?`, picture: eq(`? → ${X}`),
        answer: choose(r, String(right), [String(below), String(above)]),
        steps: [`${below} is closer to ${X - p}, so it rounds to ${X - p}.`, `${above} is at or past the middle, so it rounds up to ${fmt(X + p)}.`, `${right} rounds to ${X}.`] }
    } },
    { style: p === 10 ? 'spot the mistake: dropping the ones' : 'spot the mistake: looking at the last digit', make: r => {
      const name = pick(r, NAMES), wrongCase = r() < 0.6
      let n: number, claim: number
      if (p === 10) {
        // Dropping the ones is right only when the ones are under 5 — so the claim is always the ten below.
        n = until(() => num(r, 15, 199), x => (x % 10 >= 5) === wrongCase)
        claim = n - (n % 10)
      } else {
        const lastUp = (x: number) => (x % 10 >= 5 ? x - (x % 100) + 100 : x - (x % 100))
        n = until(() => num(r, 110, 899), x => (lastUp(x) !== round(x, 100)) === wrongCase && x % 10 !== 0)
        claim = lastUp(n)
      }
      const a = round(n, p), other = a === claim ? (claim === n - (n % p) ? claim + p : claim - p) : a
      const yes = `Yes. ${n} rounds to ${claim}.`, no = `No. ${n} rounds to ${other}.`
      const right = claim === a ? yes : no
      const text = p === 10 ? `${name} drops the ones and says ${n} rounds to ${claim}. Is ${name} right?`
        : `${name} looks at the last digit of ${n} and says it rounds to ${claim}. Is ${name} right?`
      return { text, picture: eq(`${n} → ${claim}`), answer: choose(r, right, [right === yes ? no : yes]),
        steps: [...roundSteps(n, p), right] }
    } },
    { style: 'two-step story: round each, then add', make: r => {
      const [thing, one, two, later] = pick(r, p === 10
        ? [['books', 'A class read', 'in May', 'in June'], ['stickers', 'Mia got', 'on Monday', 'on Tuesday'], ['shells', 'Leo found', 'on Saturday', 'on Sunday']]
        : [['people', 'A fair had', 'on Friday', 'on Saturday'], ['apples', 'A farm picked', 'in June', 'in July'], ['tickets', 'A zoo sold', 'on Saturday', 'on Sunday']])
      const [a, b] = p === 10 ? [num(r, 11, 94), num(r, 11, 94)] : [num(r, 110, 449), num(r, 110, 449)]
      const ra = round(a, p), rb = round(b, p), s = ra + rb
      return { text: `${one} ${a} ${thing} ${two} and ${b} ${thing} ${later}. Round each number to the nearest ${word}, then add. About how many ${thing} is that in all?`,
        picture: eq(`${a} + ${b}`), answer: s,
        steps: [`${a} rounds to ${ra}, and ${b} rounds to ${rb}.`, `${ra} + ${rb} = ${fmt(s)}.`, `So it is about ${fmt(s)} ${thing}.`] }
    } },
  ]
}

// ── t8 · add with a trade, t9 · take away with a break ──────────────────────────────────────────────────────
const cols = (a: number, b: number, op: '+' | '−'): Picture => ({ kind: 'columns', rows: [String(a), String(b)], op, places: ['H', 'T', 'O'], answer: null })
const dig = (n: number) => ({ h: Math.floor(n / 100), t: Math.floor(n / 10) % 10, o: n % 10 })
/** a + b with a ones trade, and a tens trade only when `twice`. */
const addPair = (r: Rng, twice: boolean) => until(() => ({ a: int(r, 101, 599), b: int(r, 101, 399) }), ({ a, b }) => {
  const x = dig(a), y = dig(b), tens = x.t + y.t + 1
  return x.o + y.o >= 10 && (twice ? tens >= 10 : tens <= 9) && a + b <= 999
})
const addSteps = (a: number, b: number) => {
  const x = dig(a), y = dig(b), os = x.o + y.o, ts = x.t + y.t + 1
  const ones = `Ones: ${x.o} + ${y.o} = ${os}. Trade 10 ones for 1 ten, and write ${os - 10}.`
  return ts >= 10
    ? [ones, `Tens: 1 + ${x.t} + ${y.t} = ${ts}. Trade 10 tens for 1 hundred, and write ${ts - 10}.`, `Hundreds: 1 + ${x.h} + ${y.h} = ${x.h + y.h + 1}.`]
    : [ones, `Tens: 1 + ${x.t} + ${y.t} = ${ts}. Hundreds: ${x.h} + ${y.h} = ${x.h + y.h}.`]
}

const T8: Level[] = [
  { style: 'blocks: trade 10 ones', make: r => {
    const h = int(r, 1, 6), t = int(r, 0, 7), o = int(r, 10, 18), n = h * 100 + (t + 1) * 10 + o - 10
    return { text: 'Trade 10 ones for 1 ten. What number do these blocks show?', picture: { kind: 'blocks', hundreds: h, tens: t, ones: o }, answer: n,
      steps: [`There are ${o} ones. Trade 10 of them for 1 ten, so ${pl(o - 10, 'one')} ${o - 10 === 1 ? 'is' : 'are'} left.`, `Now there ${h === 1 ? 'is' : 'are'} ${pl(h, 'hundred')}, ${pl(t + 1, 'ten')} and ${pl(o - 10, 'one')}.`, `That is ${n}.`] }
  } },
  { style: 'column addition, one trade', make: r => {
    const { a, b } = addPair(r, false)
    return { text: `Add. Trade 10 ones for a ten. ${a} + ${b} = ?`, picture: cols(a, b, '+'), answer: a + b, steps: [...addSteps(a, b), `So ${a} + ${b} = ${a + b}.`] }
  } },
  { style: 'pick the right sum (forgot the traded ten)', make: r => {
    const { a, b } = addPair(r, false), s = a + b, x = dig(a), y = dig(b)
    const wrote14 = `${x.h + y.h}${x.t + y.t}${x.o + y.o}`
    return { text: `Three kids added ${a} + ${b}. Which answer is right?`, picture: cols(a, b, '+'),
      answer: choose(r, String(s), [String(s - 10), wrote14]),
      steps: [...addSteps(a, b).slice(0, 1), `Don't forget the traded ten: tens are 1 + ${x.t} + ${y.t} = ${x.t + y.t + 1}.`, `So the right answer is ${s}.`] }
  } },
  { style: 'missing digit', make: r => {
    const { a, b } = addPair(r, false), s = a + b, x = dig(a), y = dig(b)
    return { text: 'One digit is missing. The sum is right. What digit goes where the ? is?',
      picture: { kind: 'columns', rows: [`${x.h}?${x.o}`, String(b)], op: '+', places: ['H', 'T', 'O'], answer: String(s) }, answer: x.t,
      steps: [`Ones: ${x.o} + ${y.o} = ${x.o + y.o}. That trades 1 ten into the tens.`, `Tens: 1 + ? + ${y.t} = ${dig(s).t}. So ? is ${dig(s).t} − ${1 + y.t}.`, `The missing digit is ${x.t}.`] }
  } },
  { style: 'story with two trades', make: r => {
    const { a, b } = addPair(r, true), s = a + b, name = pick(r, NAMES)
    const [q, end] = pick(r, [
      [`${name} has ${a} stamps. A friend gives ${name} ${b} more. How many stamps does ${name} have now?`, `So ${name} has ${s} stamps.`],
      [`A farm has ${a} hens and ${b} ducks. How many birds are there?`, `So there are ${s} birds.`],
      [`A shop sells ${a} red pens and ${b} blue pens. How many pens is that?`, `So that is ${s} pens.`],
    ])
    return { text: q, picture: cols(a, b, '+'), answer: s, steps: [...addSteps(a, b).slice(0, 2), `${addSteps(a, b)[2]} ${end}`] }
  } },
]

/** a − b with a ones break, and a tens break only when `twice`. a always has at least 1 ten to break. */
const subPair = (r: Rng, twice: boolean) => until(() => ({ a: int(r, 210, 999), b: int(r, 101, 899) }), ({ a, b }) => {
  const x = dig(a), y = dig(b)
  return x.o < y.o && x.t >= 1 && (twice ? x.t - 1 < y.t && x.h - 1 > y.h : x.t - 1 >= y.t && x.h > y.h)
})
const subSteps = (a: number, b: number) => {
  const x = dig(a), y = dig(b), d = dig(a - b)
  const ones = `Ones: ${x.o} is less than ${y.o}. Break 1 ten into 10 ones: ${x.o + 10} − ${y.o} = ${d.o}.`
  return x.t - 1 < y.t
    ? [ones, `Tens: ${x.t - 1} is less than ${y.t}. Break 1 hundred into 10 tens: ${x.t + 9} − ${y.t} = ${d.t}.`, `Hundreds: ${x.h - 1} − ${y.h} = ${d.h}.`]
    : [ones, `Tens: ${x.t - 1} − ${y.t} = ${d.t}. Hundreds: ${x.h} − ${y.h} = ${d.h}.`]
}

const T9: Level[] = [
  { style: 'blocks: break a ten, then take away', make: r => {
    const { a, b } = subPair(r, false), x = dig(a)
    return { text: `The blocks show ${a}. Take away ${b}. How many are left?`, picture: { kind: 'blocks', hundreds: x.h, tens: x.t, ones: x.o }, answer: a - b,
      steps: [...subSteps(a, b), `So ${a} − ${b} = ${a - b}.`] }
  } },
  { style: 'column subtraction, one break', make: r => {
    const { a, b } = subPair(r, false)
    return { text: `Take away. Break a ten if you need more ones. ${a} − ${b} = ?`, picture: cols(a, b, '−'), answer: a - b, steps: [...subSteps(a, b), `So ${a} − ${b} = ${a - b}.`] }
  } },
  { style: 'pick the right answer (flipped ones)', make: r => {
    const { a, b, flip } = until(() => {
      const p = subPair(r, false), x = dig(p.a), y = dig(p.b)
      return { ...p, flip: (x.h - y.h) * 100 + (x.t - y.t) * 10 + (y.o - x.o) }
    }, p => new Set([p.a - p.b, p.flip, p.a - p.b + 10]).size === 3)
    const x = dig(a), y = dig(b)
    return { text: `Three kids found ${a} − ${b}. Which answer is right?`, picture: cols(a, b, '−'),
      answer: choose(r, String(a - b), [String(flip), String(a - b + 10)]),
      steps: [`Don't flip the ones: ${x.o} − ${y.o} is not ${y.o} − ${x.o}. Break a ten instead.`, subSteps(a, b)[1], `So the right answer is ${a - b}.`] }
  } },
  { style: 'work backwards: how many at the start?', make: r => {
    const { a, b } = subPair(r, false), d = a - b, name = pick(r, NAMES), x = dig(a), y = dig(b), z = dig(d)
    return { text: `${name} had some stickers. ${name} gave away ${b} and has ${d} left. How many stickers did ${name} have at the start?`,
      picture: eq(`? − ${b} = ${d}`), answer: a,
      steps: [`Put back what was given away: ${d} + ${b}.`, `Ones: ${z.o} + ${y.o} = ${z.o + y.o}. Trade 10 ones for 1 ten. Tens: 1 + ${z.t} + ${y.t} = ${x.t}. Hundreds: ${z.h} + ${y.h} = ${x.h}.`, `So ${name} had ${a} stickers.`] }
  } },
  { style: 'story with two breaks', make: r => {
    const { a, b } = subPair(r, true), d = a - b
    const [q, end] = pick(r, [
      [`A school has ${a} chairs. ${b} are in the hall. How many chairs are not in the hall?`, `So ${d} chairs are not in the hall.`],
      [`A baker made ${a} rolls and sold ${b}. How many rolls are left?`, `So ${d} rolls are left.`],
      [`A library has ${a} books. ${b} are borrowed. How many books are still there?`, `So ${d} books are still there.`],
    ])
    const s = subSteps(a, b)
    return { text: q, picture: cols(a, b, '−'), answer: d, steps: [s[0], s[1], `${s[2]} ${end}`] }
  } },
]

export const G3M2_LADDERS: Record<string, Level[]> = {
  'g3m2-t1': T1, 'g3m2-t2': T2, 'g3m2-t3': T3, 'g3m2-t4': T4, 'g3m2-t5': T5,
  'g3m2-t6': roundLadder(10), 'g3m2-t7': roundLadder(100), 'g3m2-t8': T8, 'g3m2-t9': T9,
}
