/**
 * Grade 6 · Module 6 — Area, surface area, volume, shapes and angles. Practice ladders, easiest style first (see
 * ../adaptive.ts and the reference ladders in ./g5m1.ts, ./g4m5.ts).
 * ⚠️ Pictures carry the measures, so every level runs through `lv`, which re-rolls a problem whose picture prints its
 * own answer (a side label equal to it, or the right choice's text) or whose choices repeat.
 * ⚠️ An `angle` split into `parts` prints each part's degrees unless `partLabels` says otherwise, so every split angle
 * here passes its labels written out. parts[0] sits on the RIGHT of a straight line (it starts at the bottom ray).
 */
import type { Picture, Problem } from '../script'
import { showAnswer } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

type Pt = [number, number]
const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const choose = (r: Rng, right: string, wrong: string[]) => {
  const choices = shuffle(r, [right, ...wrong])
  return { choices, correct: choices.indexOf(right) }
}
const NAMES = ['Leo', 'Mia', 'Sam', 'Ava', 'Kai', 'Nina', 'Ben', 'Zoe']
const UNITS = [
  { u: 'cm', sq: 'square centimeters', cu: 'cubic centimeters' },
  { u: 'in', sq: 'square inches', cu: 'cubic inches' },
  { u: 'ft', sq: 'square feet', cu: 'cubic feet' },
  { u: 'm', sq: 'square meters', cu: 'cubic meters' },
] as const

const strings = (v: unknown): string[] =>
  typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : []
/** Does the picture print the answer, or do two choices read the same? */
const shows = (p: Problem) => {
  const s = strings(p.picture), a = p.answer!
  if (typeof a === 'number') return s.some(t => (t.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).some(n => n.replace(/,/g, '') === String(a)))
  if ('choices' in a) return new Set(a.choices).size !== a.choices.length || s.some(t => t.includes(a.choices[a.correct]))
  if ('frac' in a) return s.some(t => t === showAnswer(a) || t.startsWith(`${showAnswer(a)} `))
  return false
}
/** A size to DRAW an unknown at: picked without looking at the answer, and never equal to it, so the picture
 *  cannot be measured for the answer (a "?" drawn to scale next to labelled sides gives it away). */
const neutral = (r: Rng, lo: number, hi: number, answer: number) => { let n = answer; while (n === answer) n = int(r, lo, hi); return n }
const lv = (style: string, make: (r: Rng) => Problem): Level => ({
  style, make: r => { let p = make(r); for (let i = 0; i < 50 && shows(p); i++) p = make(r); return p },
})

// ── t1 · Area of a parallelogram ────────────────────────────────────────────────────────────────────────────
/** Lean (offset, height, slanted side) — whole-number slanted sides. */
const LEANS = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10]] as const
const para = (b: number, h: number, off: number, u: string, o: { slant?: number; bLabel?: string; hLabel?: string } = {}): Picture => ({
  kind: 'poly',
  shapes: [{ pts: [[0, 0], [b, 0], [b + off, h], [off, h]], sides: [o.bLabel ?? `${b} ${u}`, o.slant ? `${o.slant} ${u}` : null, null, null], tone: 1 }],
  segs: [{ a: [off, h], b: [off, 0], dashed: true, label: o.hLabel ?? `${h} ${u}` }],
})
const leaning = (r: Rng) => { const [off, h, s] = pick(r, LEANS); return { off, h, s, b: int(r, Math.max(5, off + 1), off + 8) } }

const T1: Level[] = [
  lv('labelled base and height', r => {
    const { u, sq } = pick(r, UNITS), b = int(r, 4, 12), h = int(r, 2, 9)
    return { text: `This shape has a base of ${b} ${u} and a height of ${h} ${u}. What is its area in ${sq}?`,
      picture: para(b, h, int(r, 1, 3), u), answer: b * h,
      steps: ['Cut the triangle off one end and slide it over: it makes a rectangle.', `The rectangle is ${b} ${u} by ${h} ${u}: ${b} × ${h}.`, `So the area is ${fmt(b * h)} ${sq}.`] }
  }),
  lv('read the figure, skip the slanted side', r => {
    const { u, sq } = pick(r, UNITS), { off, h, s, b } = leaning(r)
    return { text: `Find the area of this parallelogram in ${sq}.`, picture: para(b, h, off, u, { slant: s }), answer: b * h,
      steps: [`The height is the dashed line, ${h} ${u}. The ${s} ${u} side leans, so leave it out.`, `Multiply the base by the height: ${b} × ${h}.`, `So the area is ${fmt(b * h)} ${sq}.`] }
  }),
  lv('spot the mistake: used the slanted side', r => {
    const { u, sq } = pick(r, UNITS), { off, h, s, b } = leaning(r), name = pick(r, NAMES)
    const right = `No, it is ${fmt(b * h)} ${sq}`
    return { text: `${name} says the area is ${b} × ${s} = ${fmt(b * s)} ${sq}. Which is true?`, picture: para(b, h, off, u, { slant: s }),
      answer: choose(r, right, [`${name} is right`, `No, it is ${fmt((b * h) / 2)} ${sq}`]),
      steps: [`${name} used the slanted side. The shape only stands ${h} ${u} tall.`, `Use the straight-up height: ${b} × ${h} = ${fmt(b * h)}. No halving: this is not a triangle.`, `So the answer is: ${right}.`] }
  }),
  lv('work backwards: height from the area', r => {
    const { u, sq } = pick(r, UNITS), b = int(r, 4, 12), h = int(r, 2, 9)
    return { text: `A parallelogram has an area of ${fmt(b * h)} ${sq}. Its base is ${b} ${u}. How tall is it, in ${u}?`,
      picture: para(b, neutral(r, 3, 8, h), int(r, 1, 3), u, { hLabel: '?' }), answer: h,
      steps: [`Area = base × height, so ${b} × ? = ${fmt(b * h)}.`, `Go backwards: ${fmt(b * h)} ÷ ${b}.`, `So the height is ${h} ${u}.`] }
  }),
  lv('two-step story: area, then cost', r => {
    const { off, h, s, b } = leaning(r), c = int(r, 2, 9)
    const [thing, stuff] = pick(r, [['patio', 'Stone'], ['garden bed', 'Mulch'], ['lawn', 'Grass sod']] as const)
    const cost = b * h * c
    return { text: `A ${thing} is shaped like a parallelogram. ${stuff} costs $${c} for each square foot. How many dollars does it cost to cover the ${thing}?`,
      picture: para(b, h, off, 'ft', { slant: s }), answer: cost,
      steps: [`Area: use the height, ${h} ft, not the ${s} ft slanted side. ${b} × ${h} = ${fmt(b * h)} square feet.`, `Each square foot costs $${c}: ${fmt(b * h)} × ${c}.`, `So it costs $${fmt(cost)}.`] }
  }),
]

// ── t2 · Area of a triangle ─────────────────────────────────────────────────────────────────────────────────
const tri = (b: number, h: number, u: string, o: { bLabel?: string; off?: number } = {}): Picture => {
  const off = o.off ?? Math.round(b / 3)
  return { kind: 'poly',
    shapes: [{ pts: [[0, 0], [b, 0], [off, h]], sides: [o.bLabel ?? `${b} ${u}`, null, null], tone: 1 }],
    segs: [{ a: [off, h], b: [off, 0], dashed: true, label: `${h} ${u}` }] }
}
const RIGHT = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 6, 10], [12, 5, 13]] as const

const T2: Level[] = [
  lv('labelled base and height', r => {
    const { u, sq } = pick(r, UNITS), b = int(r, 3, 14), h = int(r, 2, 10)
    return { text: `A triangle has a base of ${b} ${u} and a height of ${h} ${u}. What is its area in ${sq}?`,
      picture: tri(b, h, u), answer: (b * h) / 2,
      steps: [`${b} × ${h} = ${b * h} is the area of two triangles.`, `One triangle is half of that: ${b * h} ÷ 2.`, `So the area is ${fmt((b * h) / 2)} ${sq}.`] }
  }),
  lv('square corner: pick the height from three sides', r => {
    const { u, sq } = pick(r, UNITS), [b, h, c] = pick(r, RIGHT)
    return { text: `This triangle has a square corner. What is its area in ${sq}?`,
      picture: { kind: 'poly', shapes: [{ pts: [[0, 0], [b, 0], [0, h]], sides: [`${b} ${u}`, `${c} ${u}`, `${h} ${u}`], right: [0], tone: 1 }] },
      answer: (b * h) / 2,
      steps: [`The ${b} ${u} and ${h} ${u} sides meet at the square corner, so one is the base and one is the height. The ${c} ${u} side leans.`, `${b} × ${h} = ${b * h} is two triangles. Take half.`, `So the area is ${fmt((b * h) / 2)} ${sq}.`] }
  }),
  lv('spot the mistake: forgot to halve', r => {
    const { u, sq } = pick(r, UNITS), b = int(r, 3, 14), h = int(r, 2, 10), name = pick(r, NAMES)
    const right = `No, it is ${fmt((b * h) / 2)} ${sq}`
    return { text: `${name} says this triangle's area is ${b} × ${h} = ${b * h} ${sq}. Which is true?`, picture: tri(b, h, u),
      answer: choose(r, right, [`${name} is right`, `No, it is ${fmt(b * h * 2)} ${sq}`]),
      steps: [`${b} × ${h} = ${b * h} is the area of two triangles, not one.`, `Take half: ${b * h} ÷ 2 = ${fmt((b * h) / 2)}.`, `So the answer is: ${right}.`] }
  }),
  lv('work backwards: base from the area', r => {
    const { u, sq } = pick(r, UNITS), b = int(r, 3, 14), h = int(r, 2, 10), a = (b * h) / 2
    return { text: `A triangle has an area of ${fmt(a)} ${sq} and a height of ${h} ${u}. How long is its base, in ${u}?`,
      picture: tri(neutral(r, 4, 12, b), h, u, { bLabel: '?' }), answer: b,
      steps: [`Area is half of base × height, so base × height = ${fmt(a)} × 2 = ${b * h}.`, `Go backwards: ${b * h} ÷ ${h}.`, `So the base is ${b} ${u}.`] }
  }),
  lv('two-step story: many triangles', r => {
    const b = int(r, 4, 12), h = int(r, 5, 12), n = int(r, 3, 9), one = (b * h) / 2
    const [what, thing] = pick(r, [['A banner is made of', 'triangle flags'], ['A quilt has', 'triangle patches'], ['A kite shop sews', 'triangle sails']] as const)
    return { text: `${what} ${n} ${thing}, all the same size. Each one is ${b} inches along the bottom and ${h} inches tall. How many square inches of cloth do they use in all?`,
      picture: tri(b, h, 'in'), answer: n * one,
      steps: [`One is half of ${b} × ${h}: ${b * h} ÷ 2 = ${fmt(one)} square inches.`, `There are ${n} of them: ${n} × ${fmt(one)}.`, `So they use ${fmt(n * one)} square inches.`] }
  }),
]

// ── t3 · Area of a shape made of pieces ─────────────────────────────────────────────────────────────────────
const house = (w: number, h: number, roof: number, u: string, cut = false): Picture => ({
  kind: 'poly',
  shapes: [{ pts: [[0, 0], [w, 0], [w, h], [w / 2, h + roof], [0, h]], sides: [`${w} ${u}`, `${h} ${u}`, null, null, null], tone: 1 }],
  segs: [{ a: [w / 2, h], b: [w / 2, h + roof], dashed: true, label: `${roof} ${u}` }, ...(cut ? [{ a: [0, h] as Pt, b: [w, h] as Pt, dashed: true }] : [])],
})
const houseNums = (r: Rng) => { const w = 2 * int(r, 2, 6), h = int(r, 3, 8), roof = int(r, 2, 5); return { w, h, roof, rect: w * h, top: (w * roof) / 2 } }

const T3: Level[] = [
  lv('house, cut drawn: rectangle + triangle', r => {
    const { u, sq } = pick(r, UNITS), { w, h, roof, rect, top } = houseNums(r)
    return { text: `The dashed line cuts this wall into a rectangle and a triangle roof. What is its area in ${sq}?`,
      picture: house(w, h, roof, u, true), answer: rect + top,
      steps: [`The rectangle is ${w} × ${h} = ${rect}.`, `The triangle is 1/2 × ${w} × ${roof} = ${top}.`, `${rect} + ${top} = ${rect + top}. So the area is ${fmt(rect + top)} ${sq}.`] }
  }),
  lv('L shape: cut into two rectangles', r => {
    const { u, sq } = pick(r, UNITS), W = int(r, 6, 12), H = int(r, 5, 10), a = int(r, 2, H - 3), b = int(r, 2, W - 3)
    const bottom = W * a, topR = b * (H - a)
    return { text: `What is the area of this L shape in ${sq}?`,
      picture: { kind: 'poly', shapes: [{ pts: [[0, 0], [W, 0], [W, a], [b, a], [b, H], [0, H]], sides: [`${W} ${u}`, `${a} ${u}`, `${W - b} ${u}`, `${H - a} ${u}`, `${b} ${u}`, `${H} ${u}`], tone: 1 }] },
      answer: bottom + topR,
      steps: ['Cut straight across to make two rectangles.', `The bottom one is ${W} × ${a} = ${bottom}. The top one is ${b} × ${H - a} = ${topR}.`, `${bottom} + ${topR} = ${bottom + topR}. So the area is ${fmt(bottom + topR)} ${sq}.`] }
  }),
  lv('rectangle with a triangle end: find the triangle base', r => {
    const { u, sq } = pick(r, UNITS), [t, h, s] = pick(r, LEANS), R = int(r, 3, 9), W = R + t
    const rect = R * h, end = (t * h) / 2
    return { text: `This shape is a rectangle with a triangle on one end. What is its area in ${sq}?`,
      picture: { kind: 'poly', shapes: [{ pts: [[0, 0], [W, 0], [R, h], [0, h]], sides: [`${W} ${u}`, `${s} ${u}`, `${R} ${u}`, `${h} ${u}`], tone: 1 }], segs: [{ a: [R, 0], b: [R, h], dashed: true }] },
      answer: rect + end,
      steps: [`The dashed line cuts off a rectangle ${R} ${u} by ${h} ${u}: ${R} × ${h} = ${rect}.`, `The triangle has a base of ${W} − ${R} = ${t} ${u} and a height of ${h} ${u}: 1/2 × ${t} × ${h} = ${end}.`, `${rect} + ${end} = ${rect + end}. So the area is ${fmt(rect + end)} ${sq}.`] }
  }),
  lv('spot the mistake: the big box around it', r => {
    const { u, sq } = pick(r, UNITS), { w, h, roof, rect, top } = houseNums(r), name = pick(r, NAMES)
    const right = `No, it is ${fmt(rect + top)} ${sq}`
    return { text: `${name} multiplies the widest across by the tallest up: ${w} × ${h + roof} = ${w * (h + roof)} ${sq}. Which is true?`,
      picture: house(w, h, roof, u), answer: choose(r, right, [`${name} is right`, `No, it is ${fmt(rect)} ${sq}`]),
      steps: [`${w} × ${h + roof} is a big box with empty corners beside the roof. Cut the wall instead.`, `Rectangle: ${w} × ${h} = ${rect}. Roof: 1/2 × ${w} × ${roof} = ${top}.`, `${rect} + ${top} = ${rect + top}. So the answer is: ${right}.`] }
  }),
  lv('multi-step story: two walls, then cost', r => {
    const { w, h, roof, rect, top } = houseNums(r), c = int(r, 2, 5), one = rect + top
    return { text: `A shed has two end walls shaped like this. Paint costs $${c} for each square foot. How many dollars does it cost to paint both walls?`,
      picture: house(w, h, roof, 'ft'), answer: 2 * one * c,
      steps: [`One wall: ${w} × ${h} = ${rect}, plus the roof 1/2 × ${w} × ${roof} = ${top}. That is ${one} square feet.`, `Two walls: ${one} × 2 = ${2 * one} square feet.`, `Cost: ${2 * one} × ${c}. So it costs $${fmt(2 * one * c)}.`] }
  }),
]

// ── t4 · Nets and surface area ──────────────────────────────────────────────────────────────────────────────
function net(l: number, w: number, h: number, u: string, areas = false): Picture {
  const rect = (x: number, y: number, dx: number, dy: number): Pt[] => [[x, y], [x + dx, y], [x + dx, y + dy], [x, y + dy]]
  return {
    kind: 'poly',
    shapes: [
      { pts: rect(w, 0, l, w), sides: [`${l} ${u}`, `${w} ${u}`, null, null], tone: 1 },
      { pts: rect(w, w, l, h), tone: 2 },
      { pts: rect(w, w + h, l, w), tone: 1 },
      { pts: rect(w, 2 * w + h, l, h), tone: 2 },
      { pts: rect(0, w, w, h), tone: 3 },
      { pts: rect(w + l, w, w, h), sides: [null, `${h} ${u}`, null, null], tone: 3 },
    ],
    labels: areas ? [
      { at: [w + l / 2, w / 2], text: String(l * w) },
      { at: [w + l / 2, w + h / 2], text: String(l * h) },
      { at: [w + l / 2, w + h + w / 2], text: String(l * w) },
      { at: [w + l / 2, 2 * w + h + h / 2], text: String(l * h) },
      { at: [w / 2, w + h / 2], text: String(w * h) },
      { at: [w + l + w / 2, w + h / 2], text: String(w * h) },
    ] : [],
  }
}
const dims = (r: Rng) => { const l = int(r, 3, 10), w = int(r, 2, 6), h = int(r, 1, 6); return { l, w, h, tb: l * w, fb: l * h, ends: w * h } }
const box = (l: string, w: string, h: string): Picture => ({ kind: 'solid', shape: 'prism', labels: { l, w, h } })
const pairSteps = (l: number, w: number, h: number) => {
  const tb = l * w, fb = l * h, ends = w * h
  return [`Top and bottom: ${l} × ${w} = ${tb} each. Front and back: ${l} × ${h} = ${fb} each.`, `The two ends: ${w} × ${h} = ${ends} each. One of each: ${tb} + ${fb} + ${ends} = ${tb + fb + ends}.`]
}

const T4: Level[] = [
  lv('net with each area written: add all six', r => {
    const { u, sq } = pick(r, UNITS), { l, w, h, tb, fb, ends } = dims(r), sa = 2 * (tb + fb + ends)
    return { text: `A box is unfolded flat. The number on each flat side is its area. How many ${sq} of paper cover the box?`,
      picture: net(l, w, h, u, true), answer: sa,
      steps: ['There are 6 flat sides, and every one gets paper.', `${tb} + ${tb} + ${fb} + ${fb} + ${ends} + ${ends}.`, `So ${fmt(sa)} ${sq} of paper cover it.`] }
  }),
  lv('net with edges only: find each area, then add', r => {
    const { u, sq } = pick(r, UNITS), { l, w, h, tb, fb, ends } = dims(r), sa = 2 * (tb + fb + ends)
    return { text: `This box is unfolded flat below. How many ${sq} of paper cover it?`,
      picture: net(l, w, h, u), answer: sa,
      steps: [...pairSteps(l, w, h), `Each has a partner: ${tb + fb + ends} × 2. So ${fmt(sa)} ${sq}.`] }
  }),
  lv('spot the mistake: only the sides you can see', r => {
    const { u, sq } = pick(r, UNITS), name = pick(r, NAMES)
    let d = dims(r)
    // the cubes-inside choice must not equal the claim or the right answer (4 × 4 × 2 = 16 + 8 + 8)
    while ([d.tb + d.fb + d.ends, 2 * (d.tb + d.fb + d.ends)].includes(d.l * d.w * d.h)) d = dims(r)
    const { l, w, h, tb, fb, ends } = d, half = tb + fb + ends
    const right = `No, it is ${fmt(2 * half)} ${sq}`
    return { text: `${name} adds the three sides you can see: ${tb} + ${fb} + ${ends} = ${half} ${sq}. ${name} says that is all the paper this box needs. Which is true?`,
      picture: box(`${l} ${u}`, `${w} ${u}`, `${h} ${u}`),
      answer: choose(r, right, [`${name} is right`, `No, it is ${fmt(l * w * h)} ${sq}`]),
      steps: [`Every side has a partner hiding at the back or underneath. The paper covers those too.`, `So double it: ${half} × 2 = ${2 * half}. (${l} × ${w} × ${h} counts cubes inside, not paper.)`, `So the answer is: ${right}.`] }
  }),
  lv('work backwards: a cube edge from its surface area', r => {
    const { u, sq } = pick(r, UNITS), e = int(r, 2, 12), face = e * e
    return { text: `A cube has a surface area of ${fmt(6 * face)} ${sq}. How long is each edge, in ${u}?`,
      picture: box('?', '?', '?'), answer: e,
      steps: [`A cube has 6 flat sides, all the same: ${fmt(6 * face)} ÷ 6 = ${face} for one side.`, `One side is a square, edge × edge = ${face}. ${e} × ${e} = ${face}.`, `So each edge is ${e} ${u}.`] }
  }),
  lv('two-step story: paper left over', r => {
    const { l, w, h, tb, fb, ends } = dims(r), sa = 2 * (tb + fb + ends), have = Math.ceil((sa + 1) / 50) * 50 + 50
    const name = pick(r, NAMES)
    return { text: `${name} has a sheet of wrapping paper with ${fmt(have)} square inches. ${name} covers every side of this gift box with no overlap. How many square inches of paper are left?`,
      picture: box(`${l} in`, `${w} in`, `${h} in`), answer: have - sa,
      steps: [...pairSteps(l, w, h).slice(0, 1), `The two ends: ${w} × ${h} = ${ends} each. All six: (${tb} + ${fb} + ${ends}) × 2 = ${sa} square inches.`, `Left over: ${fmt(have)} − ${sa} = ${fmt(have - sa)} square inches.`] }
  }),
]

// ── t5 · Volume with fraction edges ─────────────────────────────────────────────────────────────────────────
type Fr = [number, number]
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
/** 15/2 → "7 1/2", 3/4 → "3/4", 6/2 → "3". */
const mixed = ([n, d]: Fr) => { const g = gcd(n, d), N = n / g, D = d / g, w = Math.floor(N / D), k = N % D; return D === 1 ? String(N) : w ? `${w} ${k}/${D}` : `${k}/${D}` }
const frAns = ([n, d]: Fr) => { const g = gcd(n, d), N = n / g, D = d / g, w = Math.floor(N / D); return w ? { frac: [N % D, D] as Fr, whole: w } : { frac: [N, D] as Fr } }
const whole = (n: number): Fr => [n, 1]
const half = (k: number): Fr => [2 * k + 1, 2]
const asFrac = ([n, d]: Fr) => (d === 1 ? String(n) : `${n}/${d}`)
const times = (xs: Fr[]): Fr => [xs.reduce((a, x) => a * x[0], 1), xs.reduce((a, x) => a * x[1], 1)]
const isWhole = ([n, d]: Fr) => n % d === 0
const conv = (xs: Fr[]) => xs.filter(x => x[1] > 1).map(x => `${mixed(x)} = ${asFrac(x)}`).filter((s, i, a) => a.indexOf(s) === i).join(' and ')
const volSteps = (xs: Fr[], unit: string, what = 'the volume is') => {
  const v = times(xs)
  return [`Write each edge as a fraction: ${conv(xs)}.`, `Multiply: ${xs.map(asFrac).join(' × ')} = ${v[0]}/${v[1]}.`, `${v[0]}/${v[1]} = ${mixed(v)}. So ${what} ${mixed(v)} ${unit}.`]
}
/** Three edges with `halves` of them mixed numbers (in a shuffled order), and a volume that is not whole. */
const edges = (r: Rng, halves: number): Fr[] => {
  for (;;) {
    const xs = shuffle(r, [0, 1, 2].map(i => (i < halves ? half(int(r, 1, 4)) : whole(int(r, 2, 6)))))
    if (!isWhole(times(xs))) return xs
  }
}
const label = (x: Fr, u: string) => `${mixed(x)} ${u}`

const T5: Level[] = [
  lv('one mixed-number edge, written out', r => {
    const { u, cu } = pick(r, UNITS), xs = edges(r, 1)
    return { text: `A box is ${label(xs[0], u)} long, ${label(xs[1], u)} wide and ${label(xs[2], u)} tall. What is its volume in ${cu}?`,
      picture: box(label(xs[0], u), label(xs[1], u), label(xs[2], u)), answer: frAns(times(xs)), steps: volSteps(xs, cu) }
  }),
  lv('two or three mixed-number edges, read the box', r => {
    const { u, cu } = pick(r, UNITS), xs = edges(r, int(r, 2, 3))
    return { text: `What is the volume of this box in ${cu}?`,
      picture: box(label(xs[0], u), label(xs[1], u), label(xs[2], u)), answer: frAns(times(xs)), steps: volSteps(xs, cu) }
  }),
  lv('spot the mistake: dropped the halves', r => {
    const { u, cu } = pick(r, UNITS), xs = edges(r, int(r, 1, 2)), name = pick(r, NAMES), v = times(xs)
    const lo = xs.map(x => Math.floor(x[0] / x[1])), hi = xs.map(x => Math.ceil(x[0] / x[1]))
    const right = `No, it is ${mixed(v)} ${cu}`
    return { text: `${name} drops the halves and says the volume is ${lo.join(' × ')} = ${lo[0] * lo[1] * lo[2]} ${cu}. Which is true?`,
      picture: box(label(xs[0], u), label(xs[1], u), label(xs[2], u)),
      answer: choose(r, right, [`${name} is right`, `No, it is ${hi[0] * hi[1] * hi[2]} ${cu}`]),
      steps: [`${name} left out the halves, and that leaves out space inside. Use the whole edges: ${conv(xs)}.`, `${xs.map(asFrac).join(' × ')} = ${v[0]}/${v[1]} = ${mixed(v)}.`, `So the answer is: ${right}.`] }
  }),
  lv('work backwards: height from the volume', r => {
    const { u, cu } = pick(r, UNITS), l = int(r, 2, 6), w = int(r, 2, 5), h = half(int(r, 1, 4)), base = l * w, v = times([whole(base), h])
    return { text: `A box holds ${mixed(v)} ${cu}. It is ${l} ${u} long and ${w} ${u} wide. How tall is it, in ${u}?`,
      picture: box(`${l} ${u}`, `${w} ${u}`, '?'), answer: frAns(h),
      steps: [`Volume = length × width × height. Length × width = ${l} × ${w} = ${base}.`, `So ${base} × height = ${mixed(v)} = ${v[0]}/2. Go backwards: ${v[0]}/2 ÷ ${base} = ${h[0]}/2.`, `${h[0]}/2 = ${mixed(h)}. So the box is ${mixed(h)} ${u} tall.`] }
  }),
  lv('two-step story: how much more one box holds', r => {
    for (;;) {
      const a = edges(r, int(r, 1, 2)), b = edges(r, int(r, 1, 2)), va = times(a), vb = times(b)
      const d: Fr = [va[0] * vb[1] - vb[0] * va[1], va[1] * vb[1]]
      if (d[0] <= 0 || isWhole(d)) continue
      const [thing, one, two] = pick(r, [['planter', 'The tall planter', 'the short planter'], ['toy chest', 'The red chest', 'the blue chest'], ['fish tank', 'The big tank', 'the small tank']] as const)
      const dims3 = (xs: Fr[]) => `${mixed(xs[0])} ft long, ${mixed(xs[1])} ft wide and ${mixed(xs[2])} ft tall`
      return { text: `${one} is ${dims3(a)}. ${two[0].toUpperCase()}${two.slice(1)} is ${dims3(b)}. How many more cubic feet does ${one[0].toLowerCase()}${one.slice(1)} hold than ${two}?`,
        picture: { kind: 'table', head: [thing, 'length', 'width', 'height'], rows: [[one.split(' ')[1], ...a.map(x => `${mixed(x)} ft`)], [two.split(' ')[1], ...b.map(x => `${mixed(x)} ft`)]] },
        answer: frAns(d),
        steps: [`${one}: ${a.map(asFrac).join(' × ')} = ${va[0]}/${va[1]} cubic feet.`, `${two[0].toUpperCase()}${two.slice(1)}: ${b.map(asFrac).join(' × ')} = ${vb[0]}/${vb[1]} cubic feet.`, `Take away: ${va[0]}/${va[1]} − ${vb[0]}/${vb[1]} = ${mixed(d)}. So it holds ${mixed(d)} cubic feet more.`] }
    }
  }),
]

// ── t6 · Angles on a straight line ──────────────────────────────────────────────────────────────────────────
const line = (known: number[]): Picture => {
  const rest = 180 - known.reduce((a, b) => a + b, 0)
  return { kind: 'angle', deg: 180, parts: [...known, rest], partLabels: [...known.map(k => `${k}°`), '?'] }
}
const deg5 = (r: Rng, lo: number, hi: number) => 5 * int(r, lo / 5, hi / 5)

const T6: Level[] = [
  lv('one angle known', r => {
    let a = 90
    while (a === 90) a = deg5(r, 25, 155)
    return { text: 'Two angles sit side by side on a straight line. How many degrees is the missing angle?', picture: line([a]), answer: 180 - a,
      steps: ['The two angles fill a straight line, so they add up to 180°.', `Take away the part you know: 180 − ${a}.`, `So the other angle is ${180 - a}°.`] }
  }),
  lv('three angles, one missing', r => {
    const a = deg5(r, 20, 80), b = deg5(r, 20, 140 - a)
    return { text: 'Three angles sit side by side on a straight line. How many degrees is the missing angle?', picture: line([a, b]), answer: 180 - a - b,
      steps: ['All three angles fill the straight line, so they add up to 180°.', `The two you know: ${a} + ${b} = ${a + b}. Then 180 − ${a + b}.`, `So the missing angle is ${180 - a - b}°.`] }
  }),
  lv('spot the mistake: took it from 90', r => {
    const a = deg5(r, 20, 75), name = pick(r, NAMES)
    const right = `No, it is ${180 - a}°`
    // drawn split picked without the answer: to scale, the "?" part would pick the choice by its size alone
    const shown = neutral(r, 14, 22, a / 5) * 5
    return { text: `${name} says the missing angle is 90 − ${a} = ${90 - a}°. Which is true?`,
      picture: { kind: 'angle', deg: 180, parts: [shown, 180 - shown], partLabels: [`${a}°`, '?'] },
      answer: choose(r, right, [`${name} is right`, `No, it is ${360 - a}°`]),
      steps: ['A square corner is 90°, and a full turn is 360°. A straight line is a half turn: 180°.', `So take it away from 180: 180 − ${a} = ${180 - a}.`, `So the answer is: ${right}.`] }
  }),
  lv('work backwards: two equal angles', r => {
    const a = 2 * int(r, 10, 60), x = (180 - a) / 2
    return { text: `A straight line is split into three angles. One is ${a}°. The other two are equal. How many degrees is each equal angle?`,
      picture: { kind: 'angle', deg: 180, parts: [a, x, x], partLabels: [`${a}°`, '?', '?'] }, answer: x,
      steps: [`All three add up to 180°, so the two equal angles make 180 − ${a} = ${180 - a}.`, `Split that into two equal parts: ${180 - a} ÷ 2.`, `So each equal angle is ${x}°.`] }
  }),
  lv('story: one angle is more than the other', r => {
    const d = 10 * int(r, 1, 8), x = (180 - d) / 2
    const [thing, where] = pick(r, [['A board leans on a flat floor.', 'the floor'], ['A ladder leans on flat ground.', 'the ground'], ['A ramp rests on a flat road.', 'the road']] as const)
    return { text: `${thing} The angle on its right side is ${d}° bigger than the angle on its left side. How many degrees is the angle on the left side?`,
      picture: { kind: 'angle', deg: 180, parts: [x + d, x], partLabels: [null, '?'] }, answer: x,
      steps: [`${where[0].toUpperCase()}${where.slice(1)} is a straight line, so the two angles add up to 180°. Take away the extra ${d}°: 180 − ${d} = ${180 - d}.`, `What is left is two equal angles: ${180 - d} ÷ 2 = ${x}.`, `So the angle on the left side is ${x}°.`] }
  }),
]

export const G6M6_LADDERS: Record<string, Level[]> = {
  'g6m6-t1': T1, 'g6m6-t2': T2, 'g6m6-t3': T3, 'g6m6-t4': T4, 'g6m6-t5': T5, 'g6m6-t6': T6,
}
