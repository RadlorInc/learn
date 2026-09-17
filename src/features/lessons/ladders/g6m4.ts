/**
 * Grade 6 · Module 4 — Percentages. Practice ladders, easiest style first (see ../adaptive.ts and the reference ladders in
 * ./g5m1.ts). A percent is typed as a number without the % sign, and every question that wants one says so. Money is
 * worked in whole CENTS and only turned into dollars at the end, so no answer carries float noise.
 */
import type { Picture, Problem } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const blank: Picture = { kind: 'grid', rows: 10, cols: 10 }
const hund = (n: number): Picture => {
  const cols = Math.floor(n / 10), extra = n % 10
  const shade: { r: number; c: number; h: number; w: number; tone?: 1 | 2 }[] = []
  if (cols) shade.push({ r: 0, c: 0, h: 10, w: cols, tone: 1 })
  if (extra) shade.push({ r: 0, c: cols, h: extra, w: 1, tone: 2 })
  return { kind: 'grid', rows: 10, cols: 10, shade }
}
/** The lesson's tape: `n` equal percent pieces over the amounts, the first `shade` shaded. */
const pct = (n: number, brace: string, shade = 0, each?: string | (string | undefined)[], label = 'Amount'): Picture => ({
  kind: 'tape', rows: [
    { label: 'Percent', cells: Array.from({ length: n }, (_, i) => ({ w: 1, shade: i < shade, text: `${100 / n}%` })), brace: '100%' },
    { label, cells: Array.from({ length: n }, (_, i) => ({ w: 1, shade: i < shade, text: Array.isArray(each) ? each[i] : each })), brace },
  ],
})
/** The shaded first `k` of `n` pieces drawn as ONE amount (the part you know), the rest empty. */
const partTape = (n: number, k: number, part: string, label = 'Amount'): Picture => ({
  kind: 'tape', rows: [
    { label: 'Percent', cells: Array.from({ length: n }, (_, i) => ({ w: 1, shade: i < k, text: `${100 / n}%` })), brace: '100%' },
    { label, cells: [{ w: k, text: part, shade: true }, ...Array.from({ length: n - k }, () => ({ w: 1 }))], brace: '?' },
  ],
})
const taxTape = (price: string, tax: string, brace = 'Total: ?'): Picture =>
  ({ kind: 'tape', rows: [{ cells: [{ w: 10, text: price }, { w: 1, text: tax, shade: true }], brace }] })
const years = (n: number, pays: string): Picture => ({
  kind: 'table', head: ['Year', ...Array.from({ length: n }, (_, i) => String(i + 1))], rowHead: true, rows: [['Bank pays', ...Array(n).fill(pays)]],
})

/** Whole cents as dollars: 250 → "$2.50", 3000 → "$30". */
const usd = (c: number) => { const d = Math.floor(c / 100), m = c % 100; return m ? `$${fmt(d)}.${String(m).padStart(2, '0')}` : `$${fmt(d)}` }
const dollars = (c: number) => Math.round((c / 100) * 1e6) / 1e6
const TYPE_PCT = 'Type the number without the % sign.'
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
const choose = (r: Rng, right: string, wrong: string[]) => { const choices = shuffle(r, [right, ...wrong]); return { choices, correct: choices.indexOf(right) } }
const countBy = (step: number, n: number) => Array.from({ length: n }, (_, k) => fmt(step * (k + 1))).join(', ')

/** Every number a picture's labels print (a list of strings is also read joined up, the way a table row reads). */
const shown = (pic: Picture) => {
  const texts: string[] = []
  const walk = (v: unknown) => {
    if (typeof v === 'string') texts.push(v)
    else if (Array.isArray(v)) { if (v.length && v.every(x => typeof x === 'string')) texts.push(v.join('')); v.forEach(walk) }
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  walk(pic)
  return { texts, nums: new Set(texts.flatMap(t => t.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map(t => t.replace(/,/g, ''))) }
}
/** A level whose numbers are re-picked whenever the picture would print the answer. */
const lv = (style: string, build: (r: Rng) => Problem): Level => ({
  style, make: r => {
    let p = build(r)
    for (let i = 0; i < 200; i++) {
      const a = p.answer, s = shown(p.picture)
      const bad = typeof a === 'number' ? Math.abs(a) >= 10 && s.nums.has(String(Math.abs(a)))
        : a && typeof a === 'object' && 'choices' in a ? s.texts.some(t => t.includes(a.choices[a.correct])) : false
      if (!bad) return p
      p = build(r)
    }
    return p
  },
})

// ── t1 · Percent means out of 100 ───────────────────────────────────────────────────────────────────────────
const countGrid = (n: number) => {
  const cols = Math.floor(n / 10), extra = n % 10
  return extra ? `Count the full columns by 10s: ${countBy(10, cols)}. Then ${extra} more makes ${n}.` : `Count the full columns by 10s: ${countBy(10, cols)}.`
}
const T1: Level[] = [
  lv('shaded 100-grid to a percent', r => {
    const n = int(r, 11, 99)
    return { text: `This grid has 100 equal squares. What percent of the grid is shaded? ${TYPE_PCT}`, picture: hund(n), answer: n,
      steps: ['The grid has 100 equal squares, so each square is 1%.', countGrid(n), `${n} out of 100 is ${n}%, so ${n}% is shaded.`] }
  }),
  lv('bare "out of 100" to a percent', r => {
    const n = int(r, 3, 97)
    const [place, things, verb] = pick(r, [['theater', 'seats', 'are taken'], ['school wall', 'tiles', 'are painted'], ['stamp book', 'stamps', 'are used'], ['playlist', 'songs', 'are pop songs']] as const)
    return { text: `A ${place} has 100 ${things}. ${n} of them ${verb}. What percent of the ${things} ${verb}? ${TYPE_PCT}`, picture: blank, answer: n,
      steps: ['Percent means out of 100.', `${n} ${things} out of 100 is ${n}%.`] }
  }),
  lv('grid: the percent NOT shaded', r => {
    const n = int(r, 11, 89)
    return { text: `This grid has 100 equal squares. What percent of the grid is NOT shaded? ${TYPE_PCT}`, picture: hund(n), answer: 100 - n,
      steps: [`${n} squares are shaded.`, `The rest are not: 100 − ${n} = ${100 - n} squares.`, `So ${100 - n}% is not shaded.`] }
  }),
  lv('pick the true sentence (count the shaded, not the empty)', r => {
    let n = int(r, 11, 89)
    while (n === 50) n = int(r, 11, 89)
    const right = `${n}% is shaded`
    return { text: 'This grid has 100 equal squares. Which one is true?', picture: hund(n),
      answer: choose(r, right, [`${100 - n}% is shaded`, `${Math.floor(n / 10)}% is shaded`]),
      steps: ['Count the shaded squares, not the empty ones, and count every square, not just the columns.', `${n} squares out of 100 are shaded.`, `So the true one is: ${right}.`] }
  }),
  lv('two-step story (what percent is left)', r => {
    const a = int(r, 10, 45), b = int(r, 10, 45), left = 100 - a - b
    if (r() < 0.5) {
      const [x, y] = pick(r, [['a snack', 'a pencil'], ['a sticker', 'a juice box'], ['a bookmark', 'an eraser']] as const)
      return { text: `You have one dollar. You spend ${a} cents on ${x} and ${b} cents on ${y}. What percent of your dollar is left? ${TYPE_PCT}`, picture: blank, answer: left,
        steps: ['A dollar is 100 cents.', `You spend ${a} + ${b} = ${a + b} cents, so 100 − ${a + b} = ${left} cents are left.`, `${left} out of 100 is ${left}%, so ${left}% of your dollar is left.`] }
    }
    return { text: `A wall has 100 equal tiles. One class paints ${a} tiles and another class paints ${b} tiles. What percent of the wall is still not painted? ${TYPE_PCT}`, picture: blank, answer: left,
      steps: [`The two classes paint ${a} + ${b} = ${a + b} tiles.`, `100 − ${a + b} = ${left} tiles are not painted.`, `${left} out of 100 is ${left}%, so ${left}% of the wall is not painted.`] }
  }),
]

// ── t2 · Fraction, decimal, percent ─────────────────────────────────────────────────────────────────────────
/** a/d in lowest terms with d a factor of 100. */
const fraction = (r: Rng, ds: readonly number[]) => {
  const d = pick(r, ds)
  let a = int(r, 1, d - 1)
  while (gcd(a, d) !== 1) a = int(r, 1, d - 1)
  return { a, d, p: (a * 100) / d, each: 100 / d }
}
const T2: Level[] = [
  lv('fraction to a percent on the 100 squares', r => {
    const { a, d, p, each } = fraction(r, [2, 4, 5, 10, 20, 25])
    return { text: `What percent is ${a}/${d}? Cut the 100 squares into ${d} equal parts first. ${TYPE_PCT}`, picture: blank, answer: p,
      steps: [`Cut 100 squares into ${d} equal parts: 100 ÷ ${d} = ${each}.`,
        a === 1 ? `1/${d} is 1 of those parts, so 1/${d} = ${p}/100.` : `${a}/${d} is ${a} of those parts: ${a} × ${each} squares, so ${a}/${d} = ${p}/100.`,
        `So ${a}/${d} is ${p}%.`] }
  }),
  lv('bare decimal and percent, either way', r => {
    const n = int(r, 1, 99), d = fmt(n / 100), hs = n === 1 ? 'hundredth' : 'hundredths'
    if (r() < 0.5) return { text: `Write ${d} as a percent. ${TYPE_PCT}`, picture: eq(`${d} = ?%`), answer: n,
      steps: [`${d} is ${n} ${hs}.`, `${n} ${hs} is ${n} out of 100.`, `So ${d} is ${n}%.`] }
    return { text: `Write ${n}% as a decimal.`, picture: eq(`${n}% = ?`), answer: n / 100,
      steps: [`${n}% is ${n} out of 100, or ${n} ${hs}.`, 'Hundredths take two places after the point.', `So ${n}% is ${d}.`] }
  }),
  lv('pick the same amount (do not push the numbers together)', r => {
    for (;;) {
      const { a, d, p, each } = fraction(r, [2, 4, 5, 20, 25])
      const wrong = [a * 10 ** String(d).length + d, a]
      if (new Set([p, ...wrong]).size < 3) continue
      const right = `${p}%`
      return { text: `Which percent is the same amount as ${a}/${d}?`, picture: eq(`${a}/${d} = ?%`), answer: choose(r, right, wrong.map(w => `${w}%`)),
        steps: [`Make it out of 100 first: 100 ÷ ${d} = ${each}, so ${a}/${d} = ${p}/100.`, 'Do not push the top and bottom numbers together.', `So ${a}/${d} is ${right}.`] }
    }
  }),
  lv('work backwards: a percent to a fraction with a given bottom', r => {
    const { a, d, p, each } = fraction(r, [4, 5, 20, 25, 50])
    return { text: `${p}% is the same as a fraction with ${d} on the bottom. What number goes on top?`, picture: eq(`${p}% = ?/${d}`), answer: a,
      steps: [`${p}% is ${p}/100.`, `100 ÷ ${d} = ${each}, so divide the top by ${each} too: ${p} ÷ ${each} = ${a}.`, `So ${p}% = ${a}/${d}, and the top number is ${a}.`] }
  }),
  lv('two-step story (take away the misses, then a percent)', r => {
    const d = pick(r, [10, 20, 25, 50]), w = int(r, 2, Math.floor(d / 2)), c = d - w, k = 100 / d, p = c * k
    const [who, total, got] = pick(r, [
      ['Jo', `A quiz has ${d} questions. Jo gets ${w} wrong.`, 'of the questions does Jo get right'],
      ['Mia', `Mia takes ${d} free throws. She misses ${w} of them.`, 'of her free throws does Mia make'],
      ['Sam', `Sam plants ${d} seeds. ${w} of them do not sprout.`, 'of the seeds sprout'],
    ] as const)
    return { text: `${total} What percent ${got}? ${TYPE_PCT}`, picture: blank, answer: p,
      steps: [`${d} − ${w} = ${c}, so it is ${c} out of ${d}${who === 'Sam' ? ' seeds' : ''}.`, `To make ${d} into 100, multiply by ${k}: ${c} × ${k} = ${p}, so ${c}/${d} = ${p}/100.`, `So the answer is ${p}%.`] }
  }),
]

// ── t3 · Percent of a number ────────────────────────────────────────────────────────────────────────────────
const T3: Level[] = [
  lv('tape with every 10% part filled in', r => {
    const part = int(r, 2, 20), W = part * 10, k = int(r, 2, 9)
    return { text: `What is ${k * 10}% of ${W}? Each 10% part is filled in.`, picture: pct(10, String(W), k, String(part)), answer: k * part,
      steps: [`Each 10% part is ${part}.`, `${k * 10}% is ${k} parts: ${k} × ${part}.`, `So ${k * 10}% of ${W} is ${k * part}.`] }
  }),
  lv('bare numbers (find one part yourself)', r => {
    if (r() < 0.5) {
      const part = int(r, 2, 30), W = part * 10, k = int(r, 1, 9), p = k * 10
      return { text: `What is ${p}% of ${W}?`, picture: eq(`${p}% of ${W} = ?`), answer: k * part,
        steps: [`${W} ÷ 10 = ${part}, so each 10% part is ${part}.`, `${p}% is ${k} ${k === 1 ? 'part' : 'parts'}: ${k} × ${part}.`, `So ${p}% of ${W} is ${k * part}.`] }
    }
    const q = int(r, 3, 40), W = q * 4, k = int(r, 1, 3), p = k * 25
    return { text: `What is ${p}% of ${W}?`, picture: eq(`${p}% of ${W} = ?`), answer: k * q,
      steps: [`4 parts of 25% make 100%, so cut ${W} into 4: ${W} ÷ 4 = ${q}.`, `${p}% is ${k} ${k === 1 ? 'part' : 'parts'}: ${k} × ${q}.`, `So ${p}% of ${W} is ${k * q}.`] }
  }),
  lv('pick the true sentence (30% of $80 is not $30)', r => {
    for (;;) {
      const part = int(r, 2, 20), W = part * 10, k = int(r, 2, 9), p = k * 10, ans = k * part
      const wrong = [...new Set([p, W - ans, part])].filter(x => x !== ans)
      if (wrong.length < 2) continue
      const right = `${p}% of ${W} = ${ans}`
      return { text: 'Which one is true?', picture: eq(`${p}% of ${W}`), answer: choose(r, right, wrong.slice(0, 2).map(x => `${p}% of ${W} = ${x}`)),
        steps: [`${W} ÷ 10 = ${part}, so each 10% part is ${part}.`, `${p}% is ${k} parts: ${k} × ${part} = ${ans}.`, `So the true one is: ${right}.`] }
    }
  }),
  lv('work backwards: what percent of the whole', r => {
    const part = int(r, 2, 25), W = part * 10, k = int(r, 2, 9), x = k * part
    return { text: `${x} is what percent of ${W}? ${TYPE_PCT}`, picture: pct(10, String(W)), answer: k * 10,
      steps: [`Cut ${W} into 10 equal parts: ${W} ÷ 10 = ${part}. Each part is 10%.`, `${x} is ${k} of those parts: ${x} ÷ ${part} = ${k}.`, `${k} parts of 10% is ${k * 10}%, so ${x} is ${k * 10}% of ${W}.`] }
  }),
  lv('two-step story (a percent, then the rest)', r => {
    const [place, noun, a, b] = pick(r, [
      ['school', 'students', 'take the bus', 'walk'], ['pet shop', 'fish', 'are goldfish', 'are guppies'],
      ['library', 'books', 'are comics', 'are novels'], ['farm', 'animals', 'are sheep', 'are cows'],
    ] as const)
    const t = int(r, 5, 40), W = t * 10, k = int(r, 1, 9), p = k * 10, part = k * t, rest = W - part
    return { text: `A ${place} has ${W} ${noun}. ${p}% of them ${a}. The rest ${b}. How many ${noun} ${b}?`, picture: pct(10, `${W} ${noun}`), answer: rest,
      steps: [`${W} ÷ 10 = ${t}, so 10% is ${t} ${noun}. ${p}% is ${k} × ${t} = ${part}.`, `The rest: ${W} − ${part} = ${rest}.`, `So ${rest} ${noun} ${b}.`] }
  }),
]

// ── t4 · Find the whole from a part ─────────────────────────────────────────────────────────────────────────
/** k of n equal pieces, each `piece`: the part, the whole and the percent. */
const pieces = (r: Rng, ns: readonly number[], kLo = 1) => {
  const n = pick(r, ns), k = int(r, kLo, n - 1), piece = int(r, 3, n === 2 ? 45 : n === 4 ? 25 : 15)
  return { n, k, piece, part: k * piece, whole: n * piece, p: (k * 100) / n }
}
const T4: Level[] = [
  lv('tape with one piece known', r => {
    const { n, piece, whole } = pieces(r, [2, 4, 5, 10]), p = 100 / n
    return { text: `${piece} is ${p}% of what number?`, picture: pct(n, '?', 1, [String(piece)]), answer: whole,
      steps: [`${p}% is 1 of the ${n} equal pieces that make 100%.`, `That piece is ${piece}, so every piece is ${piece}. All ${n} pieces: ${n} × ${piece}.`, `So ${piece} is ${p}% of ${whole}.`] }
  }),
  lv('tape with several pieces known together', r => {
    const { n, k, piece, part, whole, p } = pieces(r, [4, 5, 10], 2)
    return { text: `The shaded pieces are ${p}% of a number, and together they are ${part}. What is the number?`, picture: partTape(n, k, String(part)), answer: whole,
      steps: [`${p}% is ${k} of the ${n} equal pieces, and those ${k} pieces are ${part}.`, `One piece is ${part} ÷ ${k} = ${piece}. All ${n} pieces: ${n} × ${piece}.`, `So ${part} is ${p}% of ${whole}.`] }
  }),
  lv('bare numbers, no tape', r => {
    const { n, k, piece, part, whole, p } = pieces(r, [2, 4, 5, 10])
    return { text: `Find the missing number: ${part} is ${p}% of ?`, picture: eq(`${part} = ${p}% of ?`), answer: whole,
      steps: [`${p}% is ${k} of ${n} equal pieces of ${100 / n}%, and ${n} pieces make 100%.`,
        k === 1 ? `So one piece is ${part}, and all ${n} pieces are ${n} × ${piece}.` : `One piece is ${part} ÷ ${k} = ${piece}, so all ${n} pieces are ${n} × ${piece}.`,
        `So ${part} is ${p}% of ${whole}.`] }
  }),
  lv('pick the true sentence (the whole is bigger than the part)', r => {
    for (;;) {
      const { n, k, piece, part, whole, p } = pieces(r, [2, 4, 5, 10])
      const slip = Math.round((part * p / 100) * 1e6) / 1e6
      const wrong = [...new Set([slip, whole - piece, whole + piece])].filter(x => x !== whole && x > 0).slice(0, 2)
      if (wrong.length < 2) continue
      const right = `${part} is ${p}% of ${whole}`
      return { text: 'Which one is true?', picture: eq(`${part} is ${p}% of ?`), answer: choose(r, right, wrong.map(x => `${part} is ${p}% of ${fmt(x)}`)),
        steps: [`${part} is only a part, so the whole must be bigger than ${part}.`,
          `${p}% is ${k} of ${n} equal pieces, so one piece is ${part} ÷ ${k} = ${piece} and the whole is ${n} × ${piece} = ${whole}.`, `So the true one is: ${right}.`] }
    }
  }),
  lv('two-step story (find the whole, then what is left)', r => {
    let q = pieces(r, [4, 5, 10])
    while (2 * q.k === q.n) q = pieces(r, [4, 5, 10])
    const { n, k, piece, part, whole, p } = q, rest = whole - part
    const [text, label, end] = pick(r, [
      [`Leo has read ${part} pages of a book. That is ${p}% of the book. How many pages are left to read?`, 'Pages', `${rest} pages are left to read`],
      [`You have saved $${part}. That is ${p}% of the price of a bike. How many more dollars do you need?`, 'Dollars', `you need $${rest} more`],
      [`A bus has gone ${part} miles. That is ${p}% of the trip. How many miles are left?`, 'Miles', `${rest} miles are left`],
    ] as const)
    return { text, picture: partTape(n, k, String(part), label), answer: rest,
      steps: [k === 1 ? `${p}% is 1 of the ${n} equal pieces, so one piece is ${piece}.` : `${p}% is ${k} of the ${n} equal pieces, and they are ${part}. One piece is ${part} ÷ ${k} = ${piece}.`,
        `The whole is ${n} × ${piece} = ${whole}.`, `${whole} − ${part} = ${rest}, so ${end}.`] }
  }),
]

// ── t5 · Discounts ──────────────────────────────────────────────────────────────────────────────────────────
const ITEMS = ['jacket', 'hat', 'backpack', 'lamp', 'board game', 'skateboard'] as const
/** A price cut into n equal pieces (10% or 25%), k of them off. */
const sale = (r: Rng, kLo = 1) => {
  const n = pick(r, [4, 10]), piece = n === 4 ? int(r, 3, 30) : int(r, 2, 15), k = int(r, kLo, n - 1)
  const W = n * piece, save = k * piece
  return { n, piece, k, W, save, sale: W - save, p: (k * 100) / n }
}
const T5: Level[] = [
  lv('tape with the pieces filled in: how much you save', r => {
    const { n, piece, k, W, save, p } = sale(r, 2), item = pick(r, ITEMS)
    return { text: `A ${item} costs $${W}. It is ${p}% off. How many dollars do you save?`, picture: pct(n, `$${W}`, 0, `$${piece}`), answer: save,
      steps: [`Each ${100 / n}% piece is $${piece}.`, `${p}% is ${k} pieces: ${k} × ${piece} = ${save}.`, `So you save $${save}.`] }
  }),
  lv('tape: the sale price (save, then take away)', r => {
    const { n, piece, k, W, save, sale: s, p } = sale(r), item = pick(r, ITEMS)
    return { text: `A ${item} costs $${W}. It is ${p}% off. What is the sale price, in dollars?`, picture: pct(n, `$${W}`), answer: s,
      steps: [k === 1 ? `${p}% of $${W} is ${W} ÷ ${n} = $${save}, so you save $${save}.` : `${100 / n}% of $${W} is ${W} ÷ ${n} = $${piece}, so ${p}% off is ${k} × ${piece} = $${save} off.`,
        `Take it away from the price: ${W} − ${save}.`, `So the sale price is $${s}.`] }
  }),
  lv('pick the true sentence (do not stop at the saving)', r => {
    for (;;) {
      const { W, save, sale: s, p } = sale(r), item = pick(r, ITEMS)
      if (new Set([s, save, W - p]).size < 3 || W - p <= 0) continue
      const right = `You pay $${s}`
      return { text: `A ${item} costs $${W}. It is ${p}% off. Which one is true?`, picture: eq(`$${W}, ${p}% off`), answer: choose(r, right, [`You pay $${save}`, `You pay $${W - p}`]),
        steps: [`${p}% of $${W} is $${save}, so you save $${save}. The % is out of 100, not dollars.`, `Take the saving away: ${W} − ${save} = ${s}.`, `So the true one is: ${right}.`] }
    }
  }),
  lv('work backwards: what percent off', r => {
    const t = int(r, 2, 20), W = t * 10, k = int(r, 1, 9), save = k * t, S = W - save, item = pick(r, ITEMS)
    return { text: `A ${item} was $${W}. On sale it costs $${S}. What percent off is that? ${TYPE_PCT}`, picture: eq(`$${W} → $${S}`), answer: k * 10,
      steps: [`You save ${W} − ${S} = $${save}.`, `10% of $${W} is $${t}, and ${save} ÷ ${t} = ${k}, so the saving is ${k} × 10%.`, `So it is ${k * 10}% off.`] }
  }),
  lv('two-item story with 5% pieces (cents)', r => {
    const [name, a, b] = pick(r, [['Maya', 'skateboard', 'helmet'], ['Leo', 'tent', 'sleeping bag'], ['Ana', 'jacket', 'scarf']] as const)
    const A = int(r, 20, 90), B = int(r, 8, 40), T = A + B, t = int(r, 1, 4), p = 10 * t + 5
    const ten = T * 10, five = T * 5, saveC = ten * t + five, payC = T * 100 - saveC
    return { text: `${name} buys a ${a} for $${A} and a ${b} for $${B}. The store takes ${p}% off everything. How many dollars does ${name} pay?`,
      picture: { kind: 'tape', rows: [{ cells: [{ w: A, text: `$${A}` }, { w: B, text: `$${B}` }], brace: `${p}% off` }] }, answer: dollars(payC),
      steps: [`Together the price is $${A} + $${B} = $${T}.`,
        `10% of $${T} is ${usd(ten)}${t > 1 ? `, so ${10 * t}% is ${usd(ten * t)}` : ''}. 5% is half of 10%: ${usd(five)}. So ${p}% off is ${usd(saveC)} off.`,
        `Take it away: $${T} − ${usd(saveC)}. So ${name} pays ${usd(payC)}.`] }
  }),
]

// ── t6 · Sales tax ──────────────────────────────────────────────────────────────────────────────────────────
const TAX_ITEMS = ['soccer ball', 'lamp', 'bike helmet', 'board game', 'backpack', 'jacket'] as const
/** A whole-dollar price whose p% tax is whole dollars. */
const taxed = (r: Rng) => {
  const p = int(r, 2, 9)
  const Ws = Array.from({ length: 60 }, (_, i) => 5 * (i + 2)).filter(W => (W * p) % 100 === 0)
  const W = pick(r, Ws)
  return { p, W, tax: (W * p) / 100, item: pick(r, TAX_ITEMS) }
}
const T6: Level[] = [
  lv('tape: find the tax', r => {
    const { p, W, tax, item } = taxed(r)
    return { text: `A ${item} costs $${W}. The sales tax is ${p}%. How many dollars is the tax?`, picture: taxTape(`$${W}`, `${p}%`, 'Tax: ?'), answer: tax,
      steps: [`1% of $${W} is ${W} ÷ 100 = ${usd(W)}.`, `The tax is ${p} of those: ${p} × ${usd(W)} = $${tax}. So the tax is $${tax}.`] }
  }),
  lv('tape: the total (find the tax, then add)', r => {
    const { p, W, tax, item } = taxed(r)
    return { text: `A ${item} costs $${W}. The sales tax is ${p}%. What is the total, in dollars?`, picture: taxTape(`$${W}`, `${p}%`), answer: W + tax,
      steps: [`1% of $${W} is ${usd(W)}, so ${p}% is ${p} × ${usd(W)} = $${tax} of tax.`, `Add the tax to the price: ${W} + ${tax}.`, `So the total is $${W + tax}.`] }
  }),
  lv('pick the true total (8% is not $8)', r => {
    let q = taxed(r)
    while (q.W === 100) q = taxed(r)
    const { p, W, tax, item } = q, right = `Total: $${W + tax}`
    return { text: `A ${item} costs $${W}. The sales tax is ${p}%. Which one is true?`, picture: eq(`$${W} + ${p}% tax`), answer: choose(r, right, [`Total: $${W + p}`, `Total: $${W - tax}`]),
      steps: [`${p}% does not mean $${p}. ${p}% of $${W} is $${tax}.`, `Tax is added on top of the price: ${W} + ${tax} = ${W + tax}.`, `So the true one is: ${right}.`] }
  }),
  lv('work backwards: what is the tax rate', r => {
    const { p, W, tax, item } = taxed(r)
    return { text: `A ${item} costs $${W}. With sales tax, the total is $${W + tax}. What percent is the sales tax? ${TYPE_PCT}`, picture: taxTape(`$${W}`, '?%', `Total: $${W + tax}`), answer: p,
      steps: [`The tax is ${W + tax} − ${W} = $${tax}.`, `1% of $${W} is ${usd(W)}, and $${tax} ÷ ${usd(W)} = ${p}.`, `So the sales tax is ${p}%.`] }
  }),
  lv('two-item story with tax in cents', r => {
    const [name, x, y] = pick(r, [['Nia', 'pair of headphones', 'case'], ['Omar', 'soccer ball', 'pump'], ['Lily', 'paint set', 'sketchbook']] as const)
    const A = int(r, 12, 60), B = int(r, 5, 30), T = A + B, p = int(r, 3, 9), taxC = T * p, totalC = T * 100 + taxC
    return { text: `${name} buys a ${x} for $${A} and a ${y} for $${B}. The sales tax is ${p}%. How many dollars does ${name} pay in all?`,
      picture: { kind: 'tape', rows: [{ cells: [{ w: A, text: `$${A}` }, { w: B, text: `$${B}` }, { w: Math.max(3, Math.round(T / 10)), text: `${p}%`, shade: true }], brace: 'Total: ?' }] },
      answer: dollars(totalC),
      steps: [`The price is $${A} + $${B} = $${T}.`, `1% of $${T} is ${usd(T)}, so ${p}% is ${p} × ${usd(T)} = ${usd(taxC)} of tax.`, `Add it: $${T} + ${usd(taxC)}. So ${name} pays ${usd(totalC)}.`] }
  }),
]

// ── t7 · Simple interest ────────────────────────────────────────────────────────────────────────────────────
const T7: Level[] = [
  lv('table with each year filled in: count up the years', r => {
    const y = int(r, 5, 40), n = int(r, 2, 5)
    return { text: `A bank pays you $${y} of interest every year. How many dollars does the bank pay you in ${n} years in all?`, picture: years(n, `$${y}`), answer: n * y,
      steps: [`Every year pays the same $${y}.`, `Count up ${n} years: ${countBy(y, n)}.`, `So the bank pays $${n * y} in ${n} years.`] }
  }),
  lv('table: find one year, then times the years', r => {
    const P = 100 * int(r, 1, 9), rate = int(r, 2, 9), n = int(r, 2, 5), one = P / 100, y = rate * one
    return { text: `You put $${P} in a bank that pays ${rate}% a year. How many dollars does the bank pay you in ${n} years? (Just what the bank pays, not the $${P}.)`, picture: years(n, '?'), answer: n * y,
      steps: [`1% of $${P} is $${one}, so ${rate}% is ${rate} × $${one} = $${y} each year.`, `Every year pays the same $${y}, so ${n} years is ${n} × ${y}.`, `So the bank pays $${n * y}.`] }
  }),
  lv('pick the true sentence (not one year, not the % as dollars)', r => {
    for (;;) {
      const P = 100 * int(r, 2, 9), rate = int(r, 2, 9), n = int(r, 2, 5), one = P / 100, y = rate * one, I = n * y
      if (new Set([I, y, rate * n]).size < 3) continue
      const right = `In ${n} years: $${I}`
      return { text: `You put $${P} in a bank that pays ${rate}% a year for ${n} years. Which one is true about the interest?`, picture: eq(`$${P} at ${rate}% a year, ${n} years`),
        answer: choose(r, right, [`In ${n} years: $${y}`, `In ${n} years: $${rate * n}`]),
        steps: [`${rate}% does not mean $${rate}. 1% of $${P} is $${one}, so ${rate}% is $${y} a year.`, `Do not stop at one year: ${n} × ${y} = ${I}.`, `So the true one is: ${right}.`] }
    }
  }),
  lv('in all: the money put in plus the interest', r => {
    const P = 100 * int(r, 1, 15), rate = int(r, 2, 9), n = int(r, 2, 6), one = P / 100, y = rate * one, I = n * y
    return { text: `You put $${fmt(P)} in a bank that pays ${rate}% a year. How much money do you have IN ALL after ${n} years (the $${fmt(P)} and the interest), in dollars?`, picture: years(n, '?'), answer: P + I,
      steps: [`1% of $${fmt(P)} is $${one}, so ${rate}% is ${rate} × $${one} = $${y} each year.`, `${n} years of interest is ${n} × ${y} = $${I}.`, `Add it to $${fmt(P)}. So you have $${fmt(P + I)} in all.`] }
  }),
  lv('work backwards: how many years (cents a year)', r => {
    const name = pick(r, ['Omar', 'Zoe', 'Ben', 'Ava'])
    const P = 50 * int(r, 3, 19), rate = int(r, 2, 8), n = int(r, 2, 8), yC = P * rate, IC = yC * n
    return { text: `${name} puts $${P} in a savings account that pays ${rate}% a year. How many years until the bank has paid ${name} ${usd(IC)} in interest?`,
      picture: eq(`$${P} at ${rate}% a year`, [`Interest: ${usd(IC)}`]), answer: n,
      steps: [`1% of $${P} is ${usd(P)}, so ${rate}% is ${rate} × ${usd(P)} = ${usd(yC)} each year.`, `Every year pays the same, so ${usd(IC)} ÷ ${usd(yC)} = ${n}.`, `So it takes ${n} years.`] }
  }),
]

export const G6M4_LADDERS: Record<string, Level[]> = {
  'g6m4-t1': T1, 'g6m4-t2': T2, 'g6m4-t3': T3, 'g6m4-t4': T4, 'g6m4-t5': T5, 'g6m4-t6': T6, 'g6m4-t7': T7,
}
