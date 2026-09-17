/**
 * Grade 3 · Module 3 — the practice ladders (see ../adaptive.ts). One ladder per topic, easiest style first.
 * ⚠️ A level is a different KIND of question, never the level below with bigger numbers — lessonLadders.test.ts
 * fails a ladder whose levels read the same once the numbers are taken out.
 * Every fact stays inside what the lessons teach: ×0, ×1, 6s as 5s + one group, 7s as 5s + 2s, 8s as double 4s,
 * 9s as 10s − one group, breaking a fact apart, one-digit × tens, and two-step stories.
 */
import type { Picture, Problem } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })

/** A choice question: the right text among the wrong ones (duplicates dropped), shuffled; `correct` follows it. */
const choose = (r: Rng, right: string, wrong: string[]) => {
  const choices = shuffle(r, [...new Set([right, ...wrong])])
  return { choices, correct: choices.indexOf(right) }
}

/** Every number the picture shows, read the way the gate reads it (a string array is also read joined up). */
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
/** The picture does not give the answer away. */
const hides = (p: Problem) => {
  const a = p.answer
  if (typeof a === 'number') return a < 10 || !shown(p.picture).has(String(a))
  if (a && typeof a === 'object' && 'choices' in a) return !JSON.stringify(p.picture).includes(a.choices[a.correct])
  return true
}
/** A level whose numbers are re-picked until the picture hides the answer. */
const lv = (style: string, make: (r: Rng) => Problem): Level => ({
  style, make: r => { let p = make(r); while (!hides(p)) p = make(r); return p },
})
/** "6 × 7" or its turnaround "7 × 6". */
const either = (r: Rng, a: number, b: number) => (r() < 0.5 ? `${a} × ${b}` : `${b} × ${a}`)

// ── t1 · Multiply by 0 ──────────────────────────────────────────────────────────────────────────────────────
const EMPTY = [
  { box: 'plates', on: 'on', obj: 'cookie', things: 'cookies' },
  { box: 'bags', on: 'in', obj: 'apple', things: 'apples' },
  { box: 'boxes', on: 'in', obj: 'crayon', things: 'crayons' },
  { box: 'sheets', on: 'on', obj: 'sticker', things: 'stickers' },
] as const

const T1: Level[] = [
  lv('empty groups picture', r => {
    const n = int(r, 2, 9), c = pick(r, EMPTY)
    return { text: `${n} ${c.box}, 0 ${c.things} ${c.on} each. How many ${c.things}?`,
      picture: { kind: 'groups', groups: n, each: 0, obj: c.obj }, answer: 0,
      steps: [`There are ${n} ${c.box} with 0 ${c.things} ${c.on} each.`, `Count by 0s: ${Array(n).fill(0).join(', ')}.`, `So ${n} × 0 = 0.`] }
  }),
  lv('bare numbers, either order', r => {
    const a = r() < 0.5 ? int(r, 2, 9) : pick(r, [10, 20, 50, 100])
    if (r() < 0.5) return { text: `${a} × 0 = ?`, picture: eq(`${a} × 0 = ?`), answer: 0,
      steps: [`${a} × 0 means ${a} groups of 0.`, 'Every group is empty, so there is nothing to count.', `So ${a} × 0 = 0.`] }
    return { text: `0 × ${a} = ?`, picture: eq(`0 × ${a} = ?`), answer: 0,
      steps: [`0 × ${a} means 0 groups of ${a}.`, 'With no groups, there is nothing to count.', `So 0 × ${a} = 0.`] }
  }),
  lv('pick the true one (not the other number)', r => {
    const a = int(r, 2, 9), right = `${a} × 0 = 0`
    return { text: `Kai says ${a} × 0 = ${a}. Which one is true?`, picture: eq(`Kai: ${a} × 0 = ${a}`),
      answer: choose(r, right, [`${a} × 0 = ${a}`, `0 × ${a} = ${a}`]),
      steps: [`${a} × 0 means ${a} groups with 0 in each.`, `Don't answer with the other number. Empty groups hold nothing.`, `So ${right}.`] }
  }),
  lv('story with a big number', r => {
    const n = int(r, 11, 60)
    const [text, pic, say] = pick(r, [
      [`Ben has ${n} crayon boxes. Every box is empty. How many crayons does Ben have?`, `${n} boxes · 0 in each`, 'Ben has 0 crayons.'],
      [`A farm has ${n} baskets. There are no eggs in any basket. How many eggs are in the baskets?`, `${n} baskets · 0 in each`, 'There are 0 eggs.'],
      [`A pet shop has ${n} fish tanks. No tank has a fish in it yet. How many fish are in the tanks?`, `${n} tanks · 0 in each`, 'There are 0 fish.'],
    ] as const)
    return { text, picture: eq(pic), answer: 0,
      steps: [`There are ${n} groups with 0 in each.`, 'Adding 0 again and again still makes 0.', `So ${n} × 0 = 0. ${say}`] }
  }),
  lv('two-step story (empty and full groups)', r => {
    const e = int(r, 2, 9), f = int(r, 2, 5), c = int(r, 2, 5), total = f * c
    return { text: `A shop has ${e} empty baskets and ${f} baskets with ${c} apples in each. How many apples are there in all?`,
      picture: eq(`${e} baskets · 0 in each`, [`${f} baskets · ${c} in each`]), answer: total,
      steps: [`The empty baskets hold ${e} × 0 = 0 apples.`, `The full baskets hold ${f} × ${c} = ${total} apples.`, `0 + ${total} = ${total}, so there are ${total} apples.`] }
  }),
]

// ── t2 · Multiply by 1 ──────────────────────────────────────────────────────────────────────────────────────
const ONE = [
  { box: 'plates', one: 'plate', on: 'on', obj: 'cookie', thing: 'cookie', things: 'cookies' },
  { box: 'bags', one: 'bag', on: 'in', obj: 'apple', thing: 'apple', things: 'apples' },
  { box: 'cups', one: 'cup', on: 'in', obj: 'straw', thing: 'straw', things: 'straws' },
] as const

const T2: Level[] = [
  lv('one in each picture', r => {
    const n = int(r, 2, 9), c = pick(r, ONE)
    if (r() < 0.5) return { text: `${n} ${c.box}, 1 ${c.thing} ${c.on} each. How many ${c.things}?`,
      picture: { kind: 'groups', groups: n, each: 1, obj: c.obj }, answer: n,
      steps: [`There are ${n} ${c.box} with 1 ${c.thing} ${c.on} each.`, `The total is the number of ${c.box}.`, `So ${n} × 1 = ${n}.`] }
    return { text: `1 ${c.one}, ${n} ${c.things} ${c.on} it. How many ${c.things}?`,
      picture: { kind: 'groups', groups: 1, each: n, obj: c.obj }, answer: n,
      steps: [`There is 1 ${c.one} with ${n} ${c.things}.`, `One group of ${n} is just ${n}.`, `So 1 × ${n} = ${n}.`] }
  }),
  lv('bare numbers, either order', r => {
    const n = int(r, 2, 9), e = either(r, n, 1)
    return { text: `${e} = ?`, picture: eq(`${e} = ?`), answer: n,
      steps: [`Any number times 1 is that same number.`, `Don't add 1.`, `So ${e} = ${n}.`] }
  }),
  lv('pick the true one (do not add 1)', r => {
    const n = int(r, 2, 60), e = either(r, n, 1), right = `${e} = ${fmt(n)}`
    return { text: `Mia says ${e} = ${fmt(n + 1)}. Which one is true?`, picture: eq(`Mia: ${e} = ${fmt(n + 1)}`),
      answer: choose(r, right, [`${e} = ${fmt(n + 1)}`, `${e} = 1`]),
      steps: [`${e} is ${n} groups of 1, or 1 group of ${n}.`, `Either way the total is ${n}. Adding 1 makes one extra.`, `So ${right}.`] }
  }),
  lv('missing number', r => {
    const n = int(r, 2, 9)
    if (r() < 0.5) {
      const m = int(r, 2, 60)
      return { text: `What number goes in the box? ${fmt(m)} × ? = ${fmt(m)}`, picture: eq(`${fmt(m)} × ? = ${fmt(m)}`), answer: 1,
        steps: [`${fmt(m)} groups of what make ${fmt(m)}?`, 'Each group must hold just 1.', 'The missing number is 1.'] }
    }
    return { text: `What number goes in the box? ? × 1 = ${n}`, picture: eq(`? × 1 = ${n}`), answer: n,
      steps: [`How many groups of 1 make ${n}?`, 'Any number times 1 is that same number.', `The missing number is ${n}.`] }
  }),
  lv('two-step story', r => {
    const a = int(r, 2, 9), b = int(r, 2, 9), s = a + b
    const [kids, gift] = pick(r, [['children', 'balloon'], ['players', 'cap'], ['campers', 'flashlight']] as const)
    return { text: `${a} ${kids} each get 1 ${gift}. Then ${b} more ${kids} come, and each gets 1 ${gift} too. How many ${gift}s are given out?`,
      picture: eq(`${a} × 1`, [`${b} × 1`]), answer: s,
      steps: [`First, ${a} × 1 = ${a} ${gift}s.`, `Then ${b} × 1 = ${b} more ${gift}s.`, `${a} + ${b} = ${s}, so ${s} ${gift}s are given out.`] }
  }),
]

// ── t3 · 6s: five groups and one more ────────────────────────────────────────────────────────────────────────
const T3: Level[] = [
  lv('grid split 5 + 1, 5s fact given', r => {
    const c = int(r, 2, 9)
    return { text: `5 × ${c} = ${5 * c}. Use it to find 6 × ${c}.`,
      picture: { kind: 'grid', rows: 6, cols: c, split: { row: 5 }, left: '6 rows', top: `${c} in a row` }, answer: 6 * c,
      steps: [`5 rows of ${c} make ${5 * c}.`, `One more row adds ${c}: ${5 * c} + ${c}.`, `So 6 × ${c} = ${6 * c}.`] }
  }),
  lv('bare fact, either order', r => {
    const c = int(r, 2, 9), e = either(r, 6, c)
    return { text: `${e} = ?`, picture: eq(`${e} = ?`), answer: 6 * c,
      steps: [`5 × ${c} = ${5 * c}.`, `One more group of ${c}: ${5 * c} + ${c}.`, `So ${e} = ${6 * c}.`] }
  }),
  lv('spot the slip (add 1, not a group)', r => {
    const c = int(r, 2, 9), f = 5 * c, right = `${f} + ${c}`
    return { text: `Kai says 6 × ${c} = ${f} + 1. Which one is the same as 6 × ${c}?`, picture: eq(`Kai: 6 × ${c} = ${f} + 1`),
      // Always three choices: slips of adding 1, 6 or 5, never the one that happens to equal the right group.
      answer: choose(r, right, [1, 6, 5].filter(k => k !== c).slice(0, 2).map(k => `${f} + ${k}`)),
      steps: [`6 groups is 5 groups and one more group.`, `One more group is ${c}, not 1.`, `So 6 × ${c} = ${right}.`] }
  }),
  lv('story', r => {
    const c = int(r, 2, 9), t = 6 * c
    const [text, pic, end] = pick(r, [
      [`Sam buys 6 packs of juice boxes. Each pack has ${c} juice boxes. How many juice boxes does he buy?`, `6 packs · ${c} in each`, `Sam buys ${t} juice boxes.`],
      [`A baker fills 6 trays. Each tray holds ${c} muffins. How many muffins are there?`, `6 trays · ${c} on each`, `There are ${t} muffins.`],
      [`6 friends each have ${c} stickers. How many stickers do they have in all?`, `6 friends · ${c} each`, `They have ${t} stickers.`],
    ] as const)
    return { text, picture: eq(pic), answer: t,
      steps: [`Find 6 × ${c}. 5 groups of ${c} make ${5 * c}.`, `One more group adds ${c}: ${5 * c} + ${c} = ${t}.`, `So 6 × ${c} = ${t}. ${end}`] }
  }),
  lv('missing number', r => {
    const c = int(r, 2, 9), t = 6 * c
    return { text: `What number goes in the box? 6 × ? = ${t}`, picture: eq(`6 × ? = ${t}`), answer: c,
      steps: [`Think: 6 groups of what make ${t}?`, `Try ${c}: 5 × ${c} = ${5 * c}, and ${5 * c} + ${c} = ${t}.`, `The missing number is ${c}.`] }
  }),
]

// ── t4 · 7s: 5s and 2s ──────────────────────────────────────────────────────────────────────────────────────
const T4: Level[] = [
  lv('grid split 5 + 2', r => {
    const c = int(r, 2, 9)
    return { text: `7 × ${c} = ? Find 5 × ${c} and 2 × ${c}, then add.`,
      picture: { kind: 'grid', rows: 7, cols: c, split: { row: 5 }, left: '7 rows', top: `${c} in a row` }, answer: 7 * c,
      steps: [`5 × ${c} = ${5 * c}.`, `2 × ${c} = ${2 * c}.`, `${5 * c} + ${2 * c} = ${7 * c}, so 7 × ${c} = ${7 * c}.`] }
  }),
  lv('bare fact, either order', r => {
    const c = int(r, 2, 9), e = either(r, 7, c)
    return { text: `${e} = ?`, picture: eq(`${e} = ?`), answer: 7 * c,
      steps: [`Break 7 into 5 and 2: 5 × ${c} = ${5 * c} and 2 × ${c} = ${2 * c}.`, `Add the parts: ${5 * c} + ${2 * c}.`, `So ${e} = ${7 * c}.`] }
  }),
  lv('spot the slip (only one more row)', r => {
    const c = int(r, 2, 9), f = 5 * c, right = `${f} + ${2 * c}`
    return { text: `Kai says 7 × ${c} = ${f} + ${c}. Which one is the same as 7 × ${c}?`, picture: eq(`Kai: 7 × ${c} = ${f} + ${c}`),
      // Always three choices: Kai's one row, then adding 2 or 7 — skipping any that repeats (c = 2) or is right.
      answer: choose(r, right, [...new Set([c, 2, 7, 5])].filter(k => k !== 2 * c).slice(0, 2).map(k => `${f} + ${k}`)),
      steps: ['7 rows is 5 rows and 2 rows.', `2 rows of ${c} make ${2 * c}, so both rows go in.`, `So 7 × ${c} = ${right}.`] }
  }),
  lv('story: a week', r => {
    const c = int(r, 2, 9), t = 7 * c
    const [text, pic, end] = pick(r, [
      [`Mia gets ${c} stickers every day for a week. How many stickers does she get?`, `1 week · ${c} each day`, `Mia gets ${t} stickers.`],
      [`Leo reads ${c} pages every day for a week. How many pages does he read?`, `1 week · ${c} each day`, `Leo reads ${t} pages.`],
      [`A hen lays eggs for a week. She lays ${c} eggs each day. How many eggs is that?`, `1 week · ${c} each day`, `That is ${t} eggs.`],
    ] as const)
    return { text, picture: eq(pic), answer: t,
      steps: [`A week has 7 days, so find 7 × ${c}.`, `5 × ${c} = ${5 * c} and 2 × ${c} = ${2 * c}.`, `${5 * c} + ${2 * c} = ${t}. ${end}`] }
  }),
  lv('two-step story: how many more', r => {
    const c = int(r, 3, 9), d = int(r, 2, c - 1), a = 7 * c, b = 7 * d, m = a - b
    return { text: `Leo reads ${c} pages every day for 7 days. Ana reads ${d} pages every day for 7 days. How many more pages does Leo read?`,
      picture: eq(`Leo: 7 × ${c}`, [`Ana: 7 × ${d}`]), answer: m,
      steps: [`Leo reads 7 × ${c} = ${a} pages.`, `Ana reads 7 × ${d} = ${b} pages.`, `${a} − ${b} = ${m}, so Leo reads ${m} more pages.`] }
  }),
]

// ── t5 · 8s: double the 4s ──────────────────────────────────────────────────────────────────────────────────
const T5: Level[] = [
  lv('grid split in half, 4s fact given', r => {
    const c = int(r, 2, 9), h = 4 * c
    return { text: `4 × ${c} = ${h}. Double it to find 8 × ${c}.`,
      picture: { kind: 'grid', rows: 8, cols: c, split: { row: 4 }, left: '8 rows', top: `${c} in a row` }, answer: 8 * c,
      steps: [`4 rows of ${c} make ${h}.`, `4 more rows make ${h} more.`, `Double ${h} is ${h} + ${h} = ${8 * c}, so 8 × ${c} = ${8 * c}.`] }
  }),
  lv('bare fact, either order', r => {
    const c = int(r, 2, 9), h = 4 * c, e = either(r, 8, c)
    return { text: `${e} = ?`, picture: eq(`${e} = ?`), answer: 8 * c,
      steps: [`4 × ${c} = ${h}.`, `Double ${h} is ${h} + ${h}.`, `So ${e} = ${8 * c}.`] }
  }),
  lv('spot the slip (doubled the wrong number)', r => {
    const c = int(r, 2, 9), h = 4 * c, right = `${h} + ${h}`
    return { text: `Kai says 8 × ${c} = ${c} + ${c}. Which one is the same as 8 × ${c}?`, picture: eq(`Kai: 8 × ${c} = ${c} + ${c}`),
      answer: choose(r, right, [`${c} + ${c}`, `${h} + ${c}`]),
      steps: [`Don't double the ${c}. Double the answer to 4 × ${c}.`, `4 × ${c} = ${h}.`, `So 8 × ${c} = ${right}.`] }
  }),
  lv('story: things that come in 8s', r => {
    const c = int(r, 2, 9), h = 4 * c, t = 8 * c
    const [text, pic, end] = pick(r, [
      [`A spider has 8 legs. How many legs do ${c} spiders have?`, `${c} spiders · 8 legs each`, `${c} spiders have ${t} legs.`],
      [`An octopus has 8 arms. How many arms do ${c} octopuses have?`, `${c} octopuses · 8 arms each`, `${c} octopuses have ${t} arms.`],
      [`A box holds 8 crayons. How many crayons are in ${c} boxes?`, `${c} boxes · 8 in each`, `There are ${t} crayons.`],
    ] as const)
    return { text, picture: eq(pic), answer: t,
      steps: [`${c} × 8 is the same as 8 × ${c}.`, `4 × ${c} = ${h}, and double ${h} is ${h} + ${h}.`, `That makes ${t}. ${end}`] }
  }),
  lv('two-step story: double the groups', r => {
    const c = int(r, 2, 9), h = 4 * c, t = 8 * c
    return { text: `Ana has 4 packs of stickers with ${c} in each pack. Ben has double the number of packs, with ${c} in each pack too. How many stickers does Ben have?`,
      picture: eq(`Ana: 4 packs · ${c} in each`, ['Ben: double the packs']), answer: t,
      steps: [`Ana has 4 × ${c} = ${h} stickers.`, `Ben has 8 packs, which is double Ana's: ${h} + ${h}.`, `${h} + ${h} = ${t}, so Ben has ${t} stickers.`] }
  }),
]

// ── t6 · 9s: ten groups minus one ────────────────────────────────────────────────────────────────────────────
const T6: Level[] = [
  lv('grid of 10 rows, 10s fact given', r => {
    const c = int(r, 2, 9), ten = 10 * c
    return { text: `10 × ${c} = ${ten}. Take away one row to find 9 × ${c}.`,
      picture: { kind: 'grid', rows: 10, cols: c, split: { row: 9 } }, answer: 9 * c,
      steps: [`10 rows of ${c} make ${ten}.`, `We only have 9 rows, so take away ${c}: ${ten} − ${c}.`, `${ten} − ${c} = ${9 * c}, so 9 × ${c} = ${9 * c}.`] }
  }),
  lv('bare fact, either order', r => {
    const c = int(r, 2, 9), ten = 10 * c, e = either(r, 9, c)
    return { text: `${e} = ?`, picture: eq(`${e} = ?`), answer: 9 * c,
      steps: [`10 × ${c} = ${ten}.`, `Take away one group of ${c}: ${ten} − ${c}.`, `So ${e} = ${9 * c}.`] }
  }),
  lv('spot the slip (take away 1, not a group)', r => {
    const c = int(r, 2, 9), ten = 10 * c, right = `${ten} − ${c}`
    return { text: `Kai says 9 × ${c} = ${ten} − 1. Which one is the same as 9 × ${c}?`, picture: eq(`Kai: 9 × ${c} = ${ten} − 1`),
      answer: choose(r, right, [`${ten} − 1`, `${ten} + ${c}`]),
      steps: [`9 groups is 10 groups take away one group.`, `One group is ${c}, so take away ${c}, not 1.`, `So 9 × ${c} = ${right}.`] }
  }),
  lv('missing number', r => {
    const c = int(r, 2, 9), ten = 10 * c, t = 9 * c
    return { text: `What number goes in the box? 9 × ? = ${t}`, picture: eq(`9 × ? = ${t}`), answer: c,
      steps: [`Think: 9 groups of what make ${t}?`, `Try ${c}: 10 × ${c} = ${ten}, and ${ten} − ${c} = ${t}.`, `The missing number is ${c}.`] }
  }),
  lv('two-step story: ten groups, give one away', r => {
    const c = int(r, 2, 9), ten = 10 * c, t = 9 * c
    const [who, box, boxes, things] = pick(r, [['Mia', 'box', 'boxes', 'crayons'], ['Sam', 'bag', 'bags', 'marbles'], ['Ana', 'pack', 'packs', 'cards']] as const)
    return { text: `A ${box} holds ${c} ${things}. ${who} has 10 ${boxes}. ${who} gives 1 ${box} to a friend. How many ${things} does ${who} have now?`,
      picture: eq(`10 ${boxes} · ${c} in each`, [`1 ${box} given away`]), answer: t,
      steps: [`10 ${boxes} of ${c} make ${ten} ${things}.`, `Giving 1 ${box} away takes away ${c}: ${ten} − ${c}.`, `${ten} − ${c} = ${t}, so ${who} has ${t} ${things} now.`] }
  }),
]

// ── t7 · Break a fact apart ─────────────────────────────────────────────────────────────────────────────────
/** a × b with a from 6 to 9, broken into 5 and k = a − 5. */
const fact7 = (r: Rng) => { const a = int(r, 6, 9), b = int(r, 3, 9); return { a, b, k: a - 5, big: 5 * b, small: (a - 5) * b, t: a * b } }
const rowsWord = (k: number) => (k === 1 ? 'row' : 'rows')

const T7: Level[] = [
  lv('area model, parts found', r => {
    const { a, b, k, big, small, t } = fact7(r)
    return { text: `${a} × ${b} = ? The two parts are already found. Add them.`,
      picture: { kind: 'area', cols: [String(b)], rows: ['5', String(k)], heights: [5, k], cells: [[String(big)], [String(small)]] }, answer: t,
      steps: [`${a} rows break into 5 rows and ${k} ${rowsWord(k)}.`, `5 × ${b} = ${big} and ${k} × ${b} = ${small}.`, `${big} + ${small} = ${t}, so ${a} × ${b} = ${t}.`] }
  }),
  lv('area model, find each part', r => {
    const { a, b, k, big, small, t } = fact7(r)
    return { text: `${a} × ${b} = ? Solve each part, then add.`,
      picture: { kind: 'area', cols: [String(b)], rows: ['5', String(k)], heights: [5, k] }, answer: t,
      steps: [`Break ${a} into 5 and ${k}.`, `5 × ${b} = ${big} and ${k} × ${b} = ${small}.`, `${big} + ${small} = ${t}, so ${a} × ${b} = ${t}.`] }
  }),
  lv('pick the right break-apart', r => {
    const { a, b, k } = fact7(r), right = `5 × ${b} + ${k} × ${b}`
    return { text: `Which one is the same as ${a} × ${b}?`, picture: eq(`${a} × ${b}`),
      answer: choose(r, right, [`5 × ${b} + ${k}`, `5 × ${b} + ${k + 1} × ${b}`]),
      steps: [`${a} rows break into 5 rows and ${k} ${rowsWord(k)}.`, `Every row holds ${b}, so multiply both parts.`, `So ${a} × ${b} = ${right}.`] }
  }),
  lv('missing part', r => {
    const { a, b, k } = fact7(r)
    return { text: `What number goes in the box? ${a} × ${b} = 5 × ${b} + ? × ${b}`, picture: eq(`${a} × ${b} = 5 × ${b} + ? × ${b}`), answer: k,
      steps: [`The two parts must add up to ${a} rows of ${b}.`, `5 + ${k} = ${a}.`, `So the missing number is ${k}.`] }
  }),
  lv('story, break it yourself', r => {
    const { a, b, k, big, small, t } = fact7(r)
    const [text, pic, end] = pick(r, [
      [`A theater has ${a} rows of seats. Each row has ${b} seats. How many seats are there?`, `${a} rows · ${b} seats in each`, `there are ${t} seats`],
      [`A garden has ${a} rows of carrots. Each row has ${b} carrots. How many carrots are there?`, `${a} rows · ${b} carrots in each`, `there are ${t} carrots`],
      [`A box of chocolates has ${a} rows. Each row has ${b} chocolates. How many chocolates are in the box?`, `${a} rows · ${b} in each`, `there are ${t} chocolates`],
    ] as const)
    return { text, picture: eq(pic), answer: t,
      steps: [`Break the ${a} rows into 5 rows and ${k} ${rowsWord(k)}.`, `5 × ${b} = ${big} and ${k} × ${b} = ${small}.`, `${big} + ${small} = ${t}, so ${end}.`] }
  }),
]

// ── t8 · Multiply by tens ───────────────────────────────────────────────────────────────────────────────────
const tens = (r: Rng) => { const a = int(r, 2, 9), t = int(r, 2, 9); return { a, t, n: 10 * t, p: a * t, total: 10 * a * t } }

const T8: Level[] = [
  lv('bundles picture', r => {
    const { a, t, n, p, total } = tens(r)
    return { text: `${a} cups. Each cup holds ${n} straws. Each straw in the picture is a bundle of 10. So each cup shows ${t} bundles. How many straws?`,
      picture: { kind: 'groups', groups: a, each: t, obj: 'straw' }, answer: total,
      steps: [`${n} is ${t} tens.`, `${a} × ${t} tens = ${p} tens.`, `${p} tens is ${fmt(total)}, so ${a} × ${n} = ${fmt(total)}.`] }
  }),
  lv('bare numbers, either order', r => {
    const { a, t, n, p, total } = tens(r), e = either(r, a, n)
    return { text: `${e} = ?`, picture: eq(`${e} = ?`), answer: total,
      steps: [`${n} is ${t} tens.`, `${a} × ${t} tens = ${p} tens.`, `${p} tens is ${fmt(total)}, so ${e} = ${fmt(total)}.`] }
  }),
  lv('spot the slip (stopped at the tens)', r => {
    const { a, t, n, p, total } = tens(r), right = `${a} × ${n} = ${fmt(total)}`
    return { text: `Kai says ${a} × ${n} = ${p}. Which one is right?`, picture: eq(`Kai: ${a} × ${n} = ${p}`),
      answer: choose(r, right, [`${a} × ${n} = ${p}`, `${a} × ${n} = ${fmt(total * 10)}`]),
      steps: [`${n} is ${t} tens, so ${a} × ${t} tens = ${p} tens.`, `${p} tens is ${fmt(total)}, not ${p}.`, `So ${right}.`] }
  }),
  lv('missing number', r => {
    const { a, t, n, p, total } = tens(r)
    return { text: `What number goes in the box? ${a} × ? = ${fmt(total)}`, picture: eq(`${a} × ? = ${fmt(total)}`), answer: n,
      steps: [`${fmt(total)} is ${p} tens.`, `${a} × ${t} = ${p}, so it is ${t} tens.`, `The missing number is ${n}.`] }
  }),
  lv('two-step story: two kinds of boxes', r => {
    const a = int(r, 2, 5), c = int(r, 2, 4), t = int(r, 2, 9), u = int(r, 2, 9)
    const x = 10 * a * t, y = 10 * c * u, s = x + y
    return { text: `A school buys ${a} boxes with ${10 * t} pencils in each, and ${c} boxes with ${10 * u} pencils in each. How many pencils does it buy in all?`,
      picture: eq(`${a} boxes · ${10 * t} in each`, [`${c} boxes · ${10 * u} in each`]), answer: s,
      steps: [`${a} × ${10 * t} is ${a * t} tens, which is ${fmt(x)}.`, `${c} × ${10 * u} is ${c * u} tens, which is ${fmt(y)}.`, `${fmt(x)} + ${fmt(y)} = ${fmt(s)}, so the school buys ${fmt(s)} pencils.`] }
  }),
]

// ── t9 · Two-step stories ──────────────────────────────────────────────────────────────────────────────────
const BUY = [
  { who: 'Mia', pack: 'pack', packs: 'Packs', items: 'stickers', verb: 'uses', ask: 'use' },
  { who: 'Ana', pack: 'bag', packs: 'Bags', items: 'apples', verb: 'eats', ask: 'eat' },
  { who: 'Sam', pack: 'box', packs: 'Boxes', items: 'pencils', verb: 'gives away', ask: 'give away' },
  { who: 'Leo', pack: 'tray', packs: 'Trays', items: 'muffins', verb: 'sells', ask: 'sell' },
] as const
const tape = (label: string, g: number, e: number, brace: string, money = false): Picture =>
  ({ kind: 'tape', rows: [{ label, cells: Array.from({ length: g }, () => ({ w: e, text: money ? `$${e}` : String(e) })), brace }] })
/** g packs of e, then d taken away; always at least 2 left. */
const buy = (r: Rng) => { const g = int(r, 3, 9), e = int(r, 2, 9), p = g * e, d = int(r, 2, p - 2); return { g, e, p, d, left: p - d } }

const T9: Level[] = [
  lv('tape, hidden question named', r => {
    const { g, e, p, d, left } = buy(r), c = pick(r, BUY)
    const packs = c.pack === 'box' ? 'boxes' : `${c.pack}s`
    return { text: `${c.who} buys ${g} ${packs} of ${c.items}. Each ${c.pack} has ${e} ${c.items}. ${c.who} ${c.verb} ${d}. How many ${c.items} are left? First find how many ${c.who} bought.`,
      picture: tape(c.packs, g, e, `? ${c.items}`), answer: left,
      steps: [`Step 1: ${g} ${packs} of ${e} is ${g} × ${e} = ${p} ${c.items}.`, `Step 2: take away ${d}: ${p} − ${d}.`, `${p} − ${d} = ${left}, so ${left} ${c.items} are left.`] }
  }),
  lv('bare two-step number sentence', r => {
    const { g, e, p, d, left } = buy(r)
    if (r() < 0.5) return { text: `${g} × ${e} − ${d} = ?`, picture: eq(`${g} × ${e} − ${d} = ?`), answer: left,
      steps: [`Multiply first: ${g} × ${e} = ${p}.`, `Then take away ${d}: ${p} − ${d}.`, `${p} − ${d} = ${left}.`] }
    const s = p + d
    return { text: `${g} × ${e} + ${d} = ?`, picture: eq(`${g} × ${e} + ${d} = ?`), answer: s,
      steps: [`Multiply first: ${g} × ${e} = ${p}.`, `Then add ${d}: ${p} + ${d}.`, `${p} + ${d} = ${s}.`] }
  }),
  lv('pick the number sentence for the story', r => {
    // g ≥ 3 always: with g = e = 2, g + e equals g × e and two choices would be the same number.
    const g = int(r, 3, 9), e = int(r, 2, 9), p = g * e
    if (r() < 0.5) {
      // d < g + e keeps the "add, don't multiply" choice from going below 0; g ≥ 3 keeps it from equalling the right value.
      const d = int(r, 2, Math.min(p - 2, g + e - 1)), right = `${g} × ${e} − ${d}`
      return { text: `Sam buys ${g} packs of pencils. Each pack has ${e} pencils. He gives ${d} pencils to friends. Which one finds how many pencils he has left?`,
        picture: tape('Packs', g, e, '? pencils'),
        answer: choose(r, right, [`${g} + ${e} − ${d}`, `${g} × ${e} + ${d}`]),
        steps: [`First find all the pencils: ${g} packs of ${e} is ${g} × ${e}.`, `Then he gives ${d} away, so take away ${d}.`, `So ${right}.`] }
    }
    const d = int(r, 2, Math.min(15, p - 1)), right = `${g} × ${e} + ${d}`
    return { text: `A class has ${g} tables with ${e} children at each table. Then ${d} more children come in. Which one finds how many children there are now?`,
      picture: tape('Tables', g, e, '? children'),
      // Two slips whose values differ from the answer and each other: g + e + d can equal g × e − d (4 + 8 + 10 = 4 × 8 − 10),
      // so then the next slip (the numbers multiplied the wrong way) stands in.
      answer: choose(r, right, ([[`${g} × ${e} − ${d}`, p - d], [`${g} + ${e} + ${d}`, g + e + d], [`${g} × ${d} + ${e}`, g * d + e], [`${e} + ${d}`, e + d]] as const)
        .filter(([, v], k, all) => v !== p + d && all.findIndex(([, w]) => w === v) === k).slice(0, 2).map(([t]) => t)),
      steps: [`First find the children at the tables: ${g} × ${e}.`, `Then ${d} more come in, so add ${d}.`, `So ${right}.`] }
  }),
  lv('money story: change', r => {
    const g = int(r, 2, 9), e = int(r, 2, 9), cost = g * e, pay = cost < 48 ? pick(r, [50, 100]) : 100, ch = pay - cost
    const [things, thing] = pick(r, [['tickets', 'ticket'], ['books', 'book'], ['kites', 'kite']] as const)
    return { text: `${thing[0].toUpperCase()}${thing.slice(1)}s cost $${e} each. A family buys ${g} ${things} and pays with $${pay}. How many dollars of change do they get?`,
      picture: tape(things[0].toUpperCase() + things.slice(1), g, e, `$${pay} paid`, true), answer: ch,
      steps: [`Step 1: ${g} ${things} at $${e} each cost ${g} × ${e} = $${cost}.`, `Step 2: take the cost away from $${pay}: ${pay} − ${cost}.`, `${pay} − ${cost} = ${ch}, so the change is $${ch}.`] }
  }),
  lv('work backwards: how many were used', r => {
    const { g, e, p, d, left } = buy(r), c = pick(r, BUY)
    const packs = c.pack === 'box' ? 'boxes' : `${c.pack}s`
    return { text: `${c.who} buys ${g} ${packs} of ${c.items} with ${e} in each ${c.pack}. ${c.who} ${c.verb} some of them. Now ${left} ${c.items} are left. How many did ${c.who} ${c.ask}?`,
      picture: eq(`${g} ${packs} · ${e} in each`, [`${left} left`]), answer: d,
      steps: [`Step 1: at the start there are ${g} × ${e} = ${p} ${c.items}.`, `Step 2: ${p} − ? = ${left}. Think: ${left} + ? = ${p}.`, `${p} − ${left} = ${d}, so the answer is ${d} ${c.items}.`] }
  }),
]

export const G3M3_LADDERS: Record<string, Level[]> = {
  'g3m3-t1': T1, 'g3m3-t2': T2, 'g3m3-t3': T3, 'g3m3-t4': T4, 'g3m3-t5': T5,
  'g3m3-t6': T6, 'g3m3-t7': T7, 'g3m3-t8': T8, 'g3m3-t9': T9,
}
