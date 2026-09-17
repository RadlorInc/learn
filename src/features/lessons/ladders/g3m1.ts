/**
 * Grade 3 · Module 1 — the practice ladders (see ../adaptive.ts). One ladder per topic, easiest style first.
 * ⚠️ A level is a different KIND of question, never the level below with bigger numbers.
 * Numbers stay inside the module: factors 2, 3, 4, 5 and 10, no remainders. Pictures are the lessons' own
 * code-drawn kinds; a `line` never has `max` (the app draws scratch lines long enough not to give the answer away).
 */
import type { Obj, Picture } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const choose = (r: Rng, right: string, wrong: string[]) => {
  const choices = shuffle(r, [right, ...wrong])
  return { choices, correct: choices.indexOf(right) }
}
/** 3, 6, 9, 12 — the first n stops when counting by s. */
const count = (s: number, n: number, from = 1) => Array.from({ length: n }, (_, k) => fmt((from + k) * s)).join(', ')
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

// ── t1 · Equal groups ──────────────────────────────────────────────────────────────────────────────────────
const HOLDERS = [
  { box: 'plate', boxes: 'plates', things: 'cookies', obj: 'cookie', on: 'on' },
  { box: 'bag', boxes: 'bags', things: 'marbles', obj: 'dot', on: 'in' },
  { box: 'pack', boxes: 'packs', things: 'stickers', obj: 'sticker', on: 'in' },
  { box: 'basket', boxes: 'baskets', things: 'apples', obj: 'apple', on: 'in' },
  { box: 'box', boxes: 'boxes', things: 'crayons', obj: 'crayon', on: 'in' },
] as const
const groups = (g: number, e: number, obj: Obj): Picture => ({ kind: 'groups', groups: g, each: e, obj })

const T1: Level[] = [
  { style: 'groups picture', make: r => {
    const h = pick(r, HOLDERS), g = int(r, 2, 5), e = int(r, 2, 5), t = g * e
    return { text: `${g} ${h.boxes}. ${e} ${h.things} ${h.on} each ${h.box}. How many ${h.things}?`, picture: groups(g, e, h.obj), answer: t,
      steps: [`There are ${g} groups, with ${e} in each group.`, `Count one whole ${h.box} at a time: ${count(e, g)}.`, `${g} × ${e} = ${t}.`] }
  } },
  { style: 'bare groups of', make: r => {
    const g = pick(r, [2, 3, 4, 5, 10]), e = int(r, 2, 5), t = g * e
    return { text: `${g} groups, ${e} in each group. How many in all?`, picture: eq(`${g} × ${e} = ?`), answer: t,
      steps: [`The first number is how many groups: ${g}. The second is how many in each: ${e}.`, `Count by ${e}s: ${count(e, g)}.`, `${g} × ${e} = ${t}.`] }
  } },
  { style: 'pick the times fact for the picture', make: r => {
    const h = pick(r, HOLDERS)
    let g = 2, e = 2
    do { g = int(r, 2, 5); e = int(r, 2, 5) } while (g === 2 && e === 2)
    const right = `${g} × ${e}`
    return { text: `Which one tells how many ${h.things} there are?`, picture: groups(g, e, h.obj),
      answer: choose(r, right, [`${g} + ${e}`, `${g + 1} × ${e}`]),
      steps: [`There are ${g} ${h.boxes} with ${e} ${h.things} ${h.on} each.`, `Adding ${g} + ${e} is only one ${h.box} and ${g} more. Count groups: ${g} groups of ${e}.`, `So it is ${right}.`] }
  } },
  { style: 'fix the added numbers', make: r => {
    const h = pick(r, HOLDERS)
    let g = 2, e = 2
    do { g = int(r, 2, 5); e = pick(r, [2, 3, 4, 5, 10]) } while (g === 2 && e === 2)
    const t = g * e
    return { text: `Ben sees ${g} ${h.boxes} with ${e} ${h.things} ${h.on} each. He says ${g} + ${e} = ${g + e}. How many ${h.things} are there really?`,
      picture: eq(`${g} + ${e} = ${g + e}`, ['Not this!']), answer: t,
      steps: [`Ben added the numbers. That is one ${h.box} of ${e} and ${g} more.`, `There are ${g} whole ${h.boxes} of ${e}: ${count(e, g)}.`, `${g} × ${e} = ${t}.`] }
  } },
  { style: 'two-step story (more groups)', make: r => {
    const h = pick(r, HOLDERS.slice(0, 3)), a = int(r, 2, 4), more = int(r, 1, 3), e = int(r, 2, 5), g = a + more, t = g * e
    return { text: `Sam has ${a} ${h.boxes} with ${e} ${h.things} ${h.on} each. Then he gets ${plural(more, `more ${h.box}`, `more ${h.boxes}`)} just the same. How many ${h.things} does he have now?`,
      picture: eq(`${a} + ${more} = ?`, [`? × ${e} = ?`]), answer: t,
      steps: [`First count the ${h.boxes}: ${a} + ${more} = ${g}.`, `${g} ${h.boxes} of ${e}: ${count(e, g)}.`, `${g} × ${e} = ${t}, so Sam has ${t} ${h.things}.`] }
  } },
]

// ── t2 · Equal rows (arrays) ───────────────────────────────────────────────────────────────────────────────
const ROWS = [
  { place: 'The hall', things: 'chairs', obj: 'chair' },
  { place: 'The garden', things: 'plants', obj: 'plant' },
  { place: 'The muffin tray', things: 'muffins', obj: 'muffin' },
  { place: 'The sheet of stamps', things: 'stamps', obj: 'sticker' },
] as const
const array = (rows: number, cols: number, obj: Obj, missing = false): Picture => ({ kind: 'array', rows, cols, obj, ...(missing ? { missing } : {}) })

const T2: Level[] = [
  { style: 'array picture, numbers told', make: r => {
    const k = pick(r, ROWS), rows = int(r, 2, 5), cols = int(r, 2, 5), t = rows * cols
    return { text: `${k.place} has ${rows} rows. Each row has ${cols} ${k.things}. How many ${k.things}?`, picture: array(rows, cols, k.obj), answer: t,
      steps: [`There are ${rows} rows, and each row has ${cols}.`, `Count one whole row at a time: ${count(cols, rows)}.`, `${rows} × ${cols} = ${t}.`] }
  } },
  { style: 'read the rows off the picture', make: r => {
    const k = pick(r, ROWS), rows = int(r, 2, 5), cols = int(r, 2, 5), t = rows * cols
    return { text: `How many ${k.things}? Count the rows, count one row, then multiply.`, picture: array(rows, cols, k.obj), answer: t,
      steps: [`Rows go across. There are ${rows} rows.`, `One row has ${cols} ${k.things}. Count by rows: ${count(cols, rows)}.`, `${rows} × ${cols} = ${t}.`] }
  } },
  { style: 'pick the rows that make the fact', make: r => {
    const rows = int(r, 2, 5), cols = int(r, 3, 5)
    const right = `${rows} rows of ${cols}`
    const short = `rows of ${[...Array(rows - 1).fill(cols), cols - 1].join(', ')}`
    return { text: `Which one is ${rows} × ${cols}?`, picture: eq(`${rows} × ${cols}`), answer: choose(r, right, [short, `${rows} rows of ${cols + 1}`]),
      steps: [`${rows} × ${cols} means ${rows} rows, and every row has ${cols}.`, 'Every row must have the same number.', `So it is ${right}.`] }
  } },
  { style: 'story, no picture of the rows', make: r => {
    const [who, thing, rowsWord] = pick(r, [['The class sits', 'desks', 'desks'], ['A box of chocolates has', 'chocolates', 'chocolates'], ['A building has', 'windows', 'windows']] as const)
    const rows = int(r, 2, 5), cols = pick(r, [2, 3, 4, 5, 10]), t = rows * cols
    const text = who === 'The class sits'
      ? `The class sits in ${rows} rows. There are ${cols} desks in each row. How many desks are there?`
      : `${who} ${rows} rows of ${rowsWord}, with ${cols} in each row. How many ${thing} are there?`
    return { text, picture: eq(`${rows} rows · ${cols} in each row`), answer: t,
      steps: [`Count the rows: ${rows}. Count one row: ${cols}.`, `Count by ${cols}s: ${count(cols, rows)}.`, `${rows} × ${cols} = ${t}.`] }
  } },
  { style: 'two-step: one missing from a row', make: r => {
    const k = pick(r, ROWS), rows = int(r, 2, 5), cols = int(r, 3, 5), full = rows * cols, t = full - 1
    return { text: `${k.place} should have ${rows} full rows of ${cols} ${k.things}. But one is missing. How many ${k.things} are there?`,
      picture: array(rows, cols, k.obj, true), answer: t,
      steps: [`If every row were full: ${rows} × ${cols} = ${full}.`, `One is missing, so it is not ${rows} × ${cols} any more: ${full} − 1.`, `There are ${t} ${k.things}.`] }
  } },
]

// ── t3 · Turn it around ────────────────────────────────────────────────────────────────────────────────────
/** a ≠ b, small enough that a whole tray still fits. */
const pair = (r: Rng) => { let a = 2, b = 2; do { a = int(r, 2, 5); b = pick(r, [2, 3, 4, 5, 10]) } while (a === b); return { a, b, t: a * b } }
const turned = (rows: number, cols: number): Picture => ({ kind: 'array', rows, cols, obj: 'dot', turn: true })

const T3: Level[] = [
  { style: 'turn the tray', make: r => {
    const { a, b, t } = pair(r)
    return { text: `${a} × ${b} = ${t}. What is ${b} × ${a}?`, picture: turned(a, b), answer: t,
      steps: [`Turn the tray: ${a} rows of ${b} become ${b} rows of ${a}.`, 'Nothing falls off and nothing is added.', `So ${b} × ${a} = ${t}.`] }
  } },
  { style: 'pick the one that is the same', make: r => {
    const { a, b } = pair(r), right = `${b} × ${a}`
    return { text: `Which one is the same as ${a} × ${b}?`, picture: turned(a, b), answer: choose(r, right, [`${b} × ${b}`, `${a} + ${b}`]),
      steps: [`Turning the rows around does not change how many there are.`, `${a} rows of ${b} turn into ${b} rows of ${a}.`, `So ${a} × ${b} is the same as ${right}.`] }
  } },
  { style: 'which sentence is true (times vs take away)', make: r => {
    let a = 2, b = 2; do { a = int(r, 3, 10); b = int(r, 2, 5) } while (a <= b)
    const right = `${a} × ${b} = ${b} × ${a}`
    return { text: 'The turn-around trick works for one of these. Which one is true?', picture: eq('Turn it around?'),
      answer: choose(r, right, [`${a} − ${b} = ${b} − ${a}`, `${a} + ${b} = ${a} × ${b}`]),
      steps: [`${a} − ${b} is not the same as ${b} − ${a}. The trick does not work for take away.`, `Turning rows around works for times: both make ${a * b}.`, `So ${right} is true.`] }
  } },
  { style: 'fill the blank', make: r => {
    let a = 2, b = 2; do { a = int(r, 2, 5); b = int(r, 2, 5) } while (a === b)
    return { text: `${b} × __ = ${a} × ${b}. What number goes in the blank?`, picture: eq(`${b} × ? = ${a} × ${b}`), answer: a,
      steps: [`Turning ${a} × ${b} around gives ${b} × ${a}.`, `Both make ${a * b}.`, `So the blank is ${a}.`] }
  } },
  { style: 'two-step story (both ways, then add)', make: r => {
    let a = 2, b = 2; do { a = int(r, 2, 4); b = pick(r, [2, 3, 4, 5, 10]) } while (a === b || a * b > 30)
    const t = a * b
    return { text: `Ana puts ${b} stickers on each of ${a} pages. Ben puts ${a} stickers on each of ${b} pages. How many stickers do they have together?`,
      picture: eq(`${a} × ${b} + ${b} × ${a} = ?`), answer: 2 * t,
      steps: [`Ana has ${a} × ${b} = ${t} stickers.`, `Ben has ${b} × ${a}. That is the same, so Ben has ${t} too.`, `${t} + ${t} = ${2 * t}, so together they have ${2 * t}.`] }
  } },
]

// ── t4 · Counting by 2s, 5s and 10s ────────────────────────────────────────────────────────────────────────
const SKIPS = [
  { s: 2, one: 'pair', many: 'pairs of socks', units: 'pairs', thing: 'socks', who: '' },
  { s: 5, one: 'hand', many: 'hands', units: 'hands', thing: 'fingers', who: ' Every friend holds up one hand.' },
  { s: 10, one: 'bundle', many: 'bundles of 10 straws', units: 'bundles', thing: 'straws', who: '' },
] as const
const line = (s: number): Picture => ({ kind: 'line', step: s, jumps: 0 })

const T4: Level[] = [
  { style: 'jump on the number line', make: r => {
    const k = pick(r, SKIPS), n = int(r, 2, 9), t = n * k.s
    return { text: `${n} ${k.many}.${k.who} How many ${k.thing}?`, picture: line(k.s), answer: t,
      steps: [`Each ${k.one} is a jump of ${k.s}.`, `Make ${n} jumps: ${count(k.s, n)}.`, `${n} × ${k.s} = ${t}.`] }
  } },
  { style: 'bare times fact', make: r => {
    const s = pick(r, [2, 5, 10]), n = int(r, 2, 9), t = n * s
    return { text: `What is ${n} × ${s}?`, picture: eq(`${n} × ${s} = ?`), answer: t,
      steps: [`Count by ${s}s, one jump for each group.`, `${n} jumps: ${count(s, n)}.`, `${n} × ${s} = ${t}.`] }
  } },
  { style: 'missing number in the count', make: r => {
    const s = pick(r, [2, 5, 10]), from = int(r, 1, 5), gap = int(r, 1, 3), t = (from + gap) * s
    const shown = Array.from({ length: 5 }, (_, k) => (k === gap ? '?' : fmt((from + k) * s))).join(', ')
    return { text: `Count by ${s}s. What number is missing?`, picture: eq(shown), answer: t,
      steps: [`Each jump adds ${s}.`, `${fmt((from + gap - 1) * s)} + ${s} = ${fmt(t)}.`, `The missing number is ${fmt(t)}.`] }
  } },
  { style: 'spot the count that stopped too early', make: r => {
    const k = pick(r, SKIPS), n = int(r, 3, 9), t = n * k.s
    return { text: `${n} ${k.many}.${k.who} Kai counts ${count(k.s, n - 1)}. How many ${k.thing} are there really?`, picture: eq(count(k.s, n - 1), ['Did he count them all?']), answer: t,
      steps: [`${n} ${k.units} means ${n} jumps. Kai made only ${n - 1}.`, `One more jump: ${fmt((n - 1) * k.s)} + ${k.s} = ${t}.`, `There are ${t} ${k.thing}.`] }
  } },
  { style: 'two-step story (nickels and dimes)', make: r => {
    const n = int(r, 2, 6), d = int(r, 2, 5), t = n * 5 + d * 10
    return { text: `A nickel is worth 5 cents. A dime is worth 10 cents. Mia has ${n} nickels and ${d} dimes. How many cents does she have?`,
      picture: eq(`${n} × 5 = ?`, [`${d} × 10 = ?`]), answer: t,
      steps: [`Nickels: count by 5s ${n} times: ${count(5, n)}. That is ${n * 5} cents.`, `Dimes: count by 10s ${d} times: ${count(10, d)}. That is ${d * 10} cents.`, `${n * 5} + ${d * 10} = ${t}, so Mia has ${t} cents.`] }
  } },
]

// ── t5 · Counting by 3s and 4s ─────────────────────────────────────────────────────────────────────────────
const WHEELS = [
  { s: 3, one: 'tricycle', many: 'tricycles', thing: 'wheels' },
  { s: 4, one: 'car', many: 'cars', thing: 'wheels' },
  { s: 4, one: 'table', many: 'tables', thing: 'legs' },
  { s: 3, one: 'bike rack', many: 'bike racks', thing: 'bikes' },
] as const

const T5: Level[] = [
  { style: 'jump on the number line', make: r => {
    const k = pick(r, WHEELS), n = int(r, 2, 8), t = n * k.s
    return { text: `${n} ${k.many}. Each ${k.one} has ${k.s} ${k.thing}. How many ${k.thing}?`, picture: line(k.s), answer: t,
      steps: [`Each ${k.one} is a jump of ${k.s}.`, `Make ${n} jumps: ${count(k.s, n)}.`, `${n} × ${k.s} = ${t}.`] }
  } },
  { style: 'bare times fact', make: r => {
    const s = pick(r, [3, 4]), n = int(r, 2, 9), t = n * s
    return { text: `What is ${n} × ${s}?`, picture: eq(`${n} × ${s} = ?`), answer: t,
      steps: [`Count by ${s}s. Add ${s} every jump.`, `${n} jumps: ${count(s, n)}.`, `${n} × ${s} = ${t}.`] }
  } },
  { style: 'pick the real count by 3s or 4s', make: r => {
    const s = pick(r, [3, 4]), from = int(r, 1, 4), start = from * s
    const right = count(s, 4, from)
    const byOne = [0, 1, 2, 3].map(k => start + k).join(', ')
    const tooBig = [0, 1, 2, 3].map(k => start + k * (s + 1)).join(', ')
    return { text: `Which one counts by ${s}s?`, picture: eq(`Jump by ${s}s`), answer: choose(r, right, [byOne, tooBig]),
      steps: [`Every jump adds a whole group of ${s}, not 1.`, `${start} + ${s} = ${start + s}, then ${start + 2 * s}, then ${start + 3 * s}.`, `So it is ${right}.`] }
  } },
  { style: 'how many jumps (work backwards)', make: r => {
    const s = pick(r, [3, 4]), n = int(r, 3, 9), t = n * s
    return { text: `How many jumps of ${s} land on ${t}?`, picture: line(s), answer: n,
      steps: [`Count by ${s}s until you reach ${t}: ${count(s, n)}.`, `Count the jumps you made.`, `That is ${n} jumps, because ${n} × ${s} = ${t}.`] }
  } },
  { style: 'two-step story (3s and 4s together)', make: r => {
    const a = int(r, 2, 6), b = int(r, 2, 6), t = a * 3 + b * 4
    return { text: `A park has ${a} tricycles and ${b} cars. A tricycle has 3 wheels and a car has 4. How many wheels are there in all?`,
      picture: eq(`${a} × 3 = ?`, [`${b} × 4 = ?`]), answer: t,
      steps: [`Tricycles: ${count(3, a)}. That is ${a * 3} wheels.`, `Cars: ${count(4, b)}. That is ${b * 4} wheels.`, `${a * 3} + ${b * 4} = ${t} wheels in all.`] }
  } },
]

// ── t6 · Share fairly (how many in each) ───────────────────────────────────────────────────────────────────
const SHARE = [
  { things: 'apples', obj: 'apple' }, { things: 'cookies', obj: 'cookie' }, { things: 'stickers', obj: 'sticker' }, { things: 'crayons', obj: 'crayon' },
] as const
/** g friends, e each, total up to 30. */
const fair = (r: Rng) => { const g = pick(r, [2, 3, 4, 5]), e = int(r, 2, g === 2 ? 10 : 6); return { g, e, t: g * e } }
const share = (t: number, g: number, obj: Obj): Picture => ({ kind: 'share', total: t, groups: g, state: 'start', obj })

const T6: Level[] = [
  { style: 'deal them out', make: r => {
    const k = pick(r, SHARE), { g, e, t } = fair(r)
    return { text: `${t} ${k.things} are shared fairly by ${g} friends. How many does each friend get?`, picture: share(t, g, k.obj), answer: e,
      steps: [`Give one to each friend, then go round again.`, `Keep going until the basket is empty. ${g} friends with ${e} each make ${t}.`, `${t} ÷ ${g} = ${e}.`] }
  } },
  { style: 'bare division', make: r => {
    const { g, e, t } = fair(r)
    return { text: `${t} ÷ ${g} = ?`, picture: eq(`${t} ÷ ${g} = ?`), answer: e,
      steps: [`Share ${t} into ${g} equal groups.`, `${g} groups of ${e} make ${t}.`, `${t} ÷ ${g} = ${e}.`] }
  } },
  { style: 'pick how to write the sharing', make: r => {
    const k = pick(r, SHARE)
    let x = fair(r); while (x.t - x.g === x.e) x = fair(r)
    const { g, e, t } = x, right = `${t} ÷ ${g} = ${e}`
    return { text: `${t} ${k.things} are shared fairly by ${g} friends. Which one shows how many each friend gets?`, picture: share(t, g, k.obj),
      answer: choose(r, right, [`${g} ÷ ${t} = ${e}`, `${t} ÷ ${g} = ${t - g}`]),
      steps: [`We are sharing, so it is division. The first number is the total, ${t}.`, `Don't flip it. Sharing fairly is not taking away: ${g} friends with ${e} each make ${t}.`, `So it is ${right}.`] }
  } },
  { style: 'work backwards to the total', make: r => {
    const k = pick(r, SHARE), { g, e, t } = fair(r)
    return { text: `Some ${k.things} were shared fairly by ${g} friends. Each friend got ${e}. How many ${k.things} were there?`, picture: eq(`? ÷ ${g} = ${e}`), answer: t,
      steps: [`Put the shares back together: ${g} friends with ${e} each.`, `${g} × ${e} = ${t}.`, `There were ${t} ${k.things}.`] }
  } },
  { style: 'two-step story (add, then share)', make: r => {
    const { g, e, t } = fair(r), a = int(r, 2, t - 2), b = t - a
    return { text: `Lea has ${a} beads. She gets ${b} more. She puts the same number of beads on ${g} bracelets. How many beads are on each bracelet?`,
      picture: eq(`${a} + ${b} = ?`, [`? ÷ ${g} = ?`]), answer: e,
      steps: [`First find all the beads: ${a} + ${b} = ${t}.`, `Share ${t} fairly onto ${g} bracelets: ${g} × ${e} = ${t}.`, `${t} ÷ ${g} = ${e}, so each bracelet has ${e} beads.`] }
  } },
]

// ── t7 · How many groups ───────────────────────────────────────────────────────────────────────────────────
const BAGS = [
  { things: 'apples', bag: 'bag', bags: 'bags', obj: 'apple' },
  { things: 'stickers', bag: 'pack', bags: 'packs', obj: 'sticker' },
  { things: 'crayons', bag: 'box', bags: 'boxes', obj: 'crayon' },
  { things: 'flowers', bag: 'vase', bags: 'vases', obj: 'plant' },
] as const
/** s in each, g groups, total up to 30 (s = 10 only with 2 or 3 groups). */
const fill = (r: Rng) => { const s = pick(r, [2, 3, 4, 5, 10]), g = int(r, 2, s === 10 ? 3 : 6); return { s, g, t: s * g } }

const T7: Level[] = [
  { style: 'ring the groups', make: r => {
    const k = pick(r, BAGS), { s, g, t } = fill(r)
    return { text: `${t} ${k.things}. ${s} ${k.things} go in each ${k.bag}. How many ${k.bags}?`, picture: { kind: 'rings', total: t, size: s, obj: k.obj, state: 'start' }, answer: g,
      steps: [`Take ${s} ${k.things} for one ${k.bag}. Keep going until none are left.`, `${g} ${k.bags} of ${s} make ${t}.`, `${t} ÷ ${s} = ${g}.`] }
  } },
  { style: 'bare: how many groups of this size', make: r => {
    const { s, g, t } = fill(r)
    return { text: `How many groups of ${s} can you make from ${t}?`, picture: eq(`${t} ÷ ${s} = ?`), answer: g,
      steps: [`Count by ${s}s until you reach ${t}: ${count(s, g)}.`, `That is ${g} groups.`, `${t} ÷ ${s} = ${g}.`] }
  } },
  { style: "pick the answer (not the size of a group)", make: r => {
    const k = pick(r, BAGS)
    let x = fill(r); while (x.g === x.s) x = fill(r)
    const { s, g, t } = x, right = `${g} ${k.bags}`
    return { text: `${t} ${k.things} are put into ${k.bags} of ${s}. How many ${k.bags} are filled?`, picture: { kind: 'rings', total: t, size: s, obj: k.obj, state: 'start' },
      answer: choose(r, right, [`${s} ${k.bags}`, `${t} ${k.bags}`]),
      steps: [`We already know ${s} go in each ${k.bag}. The question is how many ${k.bags}.`, `${g} ${k.bags} of ${s} make ${t}.`, `So it is ${right}.`] }
  } },
  { style: 'work backwards to the total', make: r => {
    const k = pick(r, BAGS), { s, g, t } = fill(r)
    return { text: `Mia puts ${k.things} in ${k.bags} of ${s}. She fills ${g} ${k.bags}. How many ${k.things} did she have?`, picture: eq(`? ÷ ${s} = ${g}`), answer: t,
      steps: [`${g} ${k.bags} with ${s} in each.`, `Count by ${s}s: ${count(s, g)}.`, `${g} × ${s} = ${t}, so she had ${t} ${k.things}.`] }
  } },
  { style: 'two-step story (fill, then give away)', make: r => {
    const k = pick(r, BAGS), s = pick(r, [2, 3, 4, 5]), g = int(r, 3, 6), t = s * g, away = int(r, 1, g - 1), left = g - away
    return { text: `Sam has ${t} ${k.things}. He puts ${s} in each ${k.bag}. Then he gives ${plural(away, k.bag, k.bags)} away. How many ${k.bags} does he have left?`,
      picture: eq(`${t} ÷ ${s} = ?`, [`? − ${away} = ?`]), answer: left,
      steps: [`First find the ${k.bags}: ${t} ÷ ${s} = ${g}, because ${g} × ${s} = ${t}.`, `Then take away the ones he gave: ${g} − ${away} = ${left}.`, `Sam has ${plural(left, k.bag, k.bags)} left.`] }
  } },
]

// ── t8 · The missing number ────────────────────────────────────────────────────────────────────────────────
/** a is a module number, b from 2 to 10, never 10 × 10. */
const fact = (r: Rng) => { let a = 2, b = 2; do { a = pick(r, [2, 3, 4, 5, 10]); b = int(r, 2, 10) } while (a === 10 && b === 10); return { a, b, t: a * b } }
const tri = (t: number, a: number, b: number | null): Picture => ({ kind: 'triangle', total: t, a, b })

const T8: Level[] = [
  { style: 'number triangle, missing factor', make: r => {
    const { a, b, t } = fact(r)
    return { text: `${a} × ? = ${t}`, picture: tri(t, a, null), answer: b,
      steps: [`Count by ${a}s until you reach ${t}: ${count(a, b)}.`, `That is ${b} jumps.`, `${a} × ${b} = ${t}, so the missing number is ${b}.`] }
  } },
  { style: 'divide with the partner times fact', make: r => {
    const { a, b, t } = fact(r)
    return { text: `Use a times fact. ${t} ÷ ${a} = ?`, picture: eq(`${a} × ? = ${t}`), answer: b,
      steps: [`Think: ${a} times what makes ${t}?`, `${a} × ${b} = ${t}.`, `So ${t} ÷ ${a} = ${b}.`] }
  } },
  { style: 'pick the partner division fact', make: r => {
    let x = fact(r); while (x.a === x.b) x = fact(r)
    const { a, b, t } = x, right = `${t} ÷ ${a} = ${b}`
    return { text: `${a} × ${b} = ${t}. Which division fact is its partner?`, picture: tri(t, a, b),
      answer: choose(r, right, [`${b} ÷ ${t} = ${a}`, `${a} ÷ ${b} = ${t}`]),
      steps: [`The biggest number, ${t}, is the total.`, 'When you divide, the total comes first.', `So the partner is ${right}.`] }
  } },
  { style: 'story, find the missing number', make: r => {
    const { a, b, t } = fact(r)
    if (r() < 0.5) return { text: `${t} chairs are set out in ${a} equal rows. How many chairs go in each row?`, picture: tri(t, a, null), answer: b,
      steps: [`Think: ${a} rows of how many make ${t}? ${a} × ? = ${t}.`, `${a} × ${b} = ${t}.`, `So each row has ${b} chairs.`] }
    return { text: `Tom has ${t} cookies. He puts ${a} cookies in each bag. How many bags does he fill?`, picture: tri(t, a, null), answer: b,
      steps: [`Think: ${a} × ? = ${t}.`, `${a} × ${b} = ${t}.`, `So Tom fills ${b} bags.`] }
  } },
  { style: 'two-step story (multiply, then divide)', make: r => {
    let x = 2, y = 2, c = 2
    do { x = int(r, 2, 5); y = pick(r, [2, 4, 5, 10]); c = pick(r, [2, 3, 4, 5, 10]) } while ((x * y) % c !== 0 || c === x || c === y || x * y / c < 2 || x * y / c > 10)
    const t = x * y, q = t / c
    return { text: `Mia bakes ${x} trays with ${y} cookies on each tray. She puts the cookies in bags of ${c}. How many bags does she fill?`,
      picture: eq(`${x} × ${y} = ?`, [`? ÷ ${c} = ?`]), answer: q,
      steps: [`First find all the cookies: ${x} × ${y} = ${t}.`, `Then ${c} × ? = ${t}. ${c} × ${q} = ${t}.`, `So she fills ${q} bags.`] }
  } },
]

export const G3M1_LADDERS: Record<string, Level[]> = {
  'g3m1-t1': T1, 'g3m1-t2': T2, 'g3m1-t3': T3, 'g3m1-t4': T4, 'g3m1-t5': T5, 'g3m1-t6': T6, 'g3m1-t7': T7, 'g3m1-t8': T8,
}
