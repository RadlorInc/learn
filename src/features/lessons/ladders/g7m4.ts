/**
 * Grade 7 · Module 4 — Geometry: scale drawings, angles, circles (π ≈ 3.14), surface area and volume. Practice ladders,
 * easiest style first (see ../adaptive.ts and the reference ladders in ./g5m1.ts, ./g6m6.ts).
 * ⚠️ Pictures carry the measures, so every level runs through `lv`, which re-rolls a problem whose picture prints its own
 * answer (a label equal to it, or the right choice's text) or whose choices repeat.
 * ⚠️ π answers: `pi(n)` = 3.14 × n for a WHOLE n, computed in hundredths so there is no float noise. Every circle
 * question keeps its radius and diameter whole, so every answer is exact to the hundredth — no rounding is asked for.
 * The picture helpers are copies of the ones in ../content/g7m4.ts, so a question draws the way its lesson does.
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
const clean = (x: number) => Math.round(x * 1e6) / 1e6
/** 3.14 × n for a whole n, exact to the hundredth. */
const pi = (n: number) => clean((314 * n) / 100)
/** Dollars with cents: 1017.36 → "1,017.36", 2512 → "2,512.00" (both still contain the answer as written). */
const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const NAMES = ['Leo', 'Mia', 'Sam', 'Ava', 'Kai', 'Nina', 'Ben', 'Zoe']
const UNITS = [
  { u: 'cm', w: 'centimeters', sq: 'square centimeters', cu: 'cubic centimeters' },
  { u: 'in', w: 'inches', sq: 'square inches', cu: 'cubic inches' },
  { u: 'ft', w: 'feet', sq: 'square feet', cu: 'cubic feet' },
  { u: 'm', w: 'meters', sq: 'square meters', cu: 'cubic meters' },
] as const

const strings = (v: unknown): string[] =>
  typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : []
/** Does the picture print the answer, or do two choices read the same? */
const shows = (p: Problem) => {
  const s = strings(p.picture), a = p.answer!
  if (typeof a === 'number') return s.some(t => (t.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).some(n => n.replace(/,/g, '') === String(a)))
  if ('choices' in a) return a.choices.length < 3 || new Set(a.choices).size !== a.choices.length || s.some(t => t.includes(a.choices[a.correct]))
  return false
}
const lv = (style: string, make: (r: Rng) => Problem): Level => ({
  style, make: r => { let p = make(r); for (let i = 0; i < 50 && shows(p); i++) p = make(r); return p },
})

// ── Pictures (as in ../content/g7m4.ts) ─────────────────────────────────────────────────────────────────────
const rect = (x: number, y: number, dx: number, dy: number): Pt[] => [[x, y], [x + dx, y], [x + dx, y + dy], [x, y + dy]]
const plan = (w: number, h: number, top: string | null, side: string | null): Picture => ({
  kind: 'poly', shapes: [{ pts: rect(0, 0, w, h), sides: [top, side, null, null], right: [0, 1, 2, 3], tone: 1 }],
})
const circle = (r: number, label: string, show: 'r' | 'd'): Picture => ({ kind: 'poly', shapes: [], circles: [{ c: [0, 0], r, label, show }] })
const corner = (parts: number[], labels: (string | null)[]): Picture => ({ kind: 'angle', deg: parts[0] + parts[1], parts, partLabels: labels })
type Spot = 'r' | 'l' | 't' | 'b'
/** Two straight lines crossing; `deg` is the left/right angle, so top and bottom are 180 − deg. */
function cross(deg: number, lab: Partial<Record<Spot, string>>): Picture {
  const h = (deg * Math.PI) / 360, x = 4 * Math.cos(h), y = 4 * Math.sin(h)
  const at: Record<Spot, Pt> = { r: [2.6, 0], l: [-2.6, 0], t: [0, 2.6], b: [0, -2.6] }
  return {
    kind: 'poly', shapes: [],
    segs: [{ a: [-x, -y], b: [x, y] }, { a: [-x, y], b: [x, -y] }],
    labels: (Object.keys(lab) as Spot[]).map(k => ({ at: at[k], text: lab[k]!, tone: lab[k] === '?' ? 2 : 1 })),
  }
}
const sticks = (ls: number[], u: string): Picture => ({
  kind: 'poly', shapes: [],
  segs: ls.map((l, i) => ({ a: [0, 1.5 * (ls.length - 1 - i)] as Pt, b: [l, 1.5 * (ls.length - 1 - i)] as Pt, dots: true, label: `${l} ${u}` })),
})
/** A prism with a triangle end: base b, height h, top point at x = apex, L long. */
function wedge(b: number, h: number, L: number, u: string, o: { apex?: number; slant?: string; lLabel?: string } = {}): Picture {
  const apex = o.apex ?? 0, off: Pt = [L * 0.35, L * 0.22], front: Pt[] = [[0, 0], [b, 0], [apex, h]]
  return {
    kind: 'poly',
    shapes: [
      { pts: front.map(p => [p[0] + off[0], p[1] + off[1]] as Pt), tone: 0, dashed: true },
      { pts: front, sides: [`${b} ${u}`, o.slant ?? null, null], right: apex === 0 ? [0] : undefined, tone: 1 },
    ],
    segs: [
      { a: [b, 0], b: [b + off[0], off[1]], label: o.lLabel ?? `${L} ${u}` },
      { a: [apex, h], b: [apex + off[0], h + off[1]] },
      { a: [0, 0], b: off, dashed: true },
      { a: [apex, h], b: [apex, 0], dashed: true, label: `${h} ${u}` },
    ],
  }
}
/** A wedge unfolded: triangle legs a (up) and b (along), long side c; rectangles a, b, c wide and L long. */
const triNet = (a: number, b: number, c: number, L: number, u: string): Picture => ({
  kind: 'poly',
  shapes: [
    { pts: [[a, 0], [a + b, 0], [a, -a]], tone: 1 },
    { pts: [[a, L], [a + b, L], [a, L + a]], tone: 1 },
    { pts: rect(0, 0, a, L), sides: [`${a} ${u}`, null, null, `${L} ${u}`], tone: 2 },
    { pts: rect(a, 0, b, L), sides: [null, null, `${b} ${u}`, null], tone: 3 },
    { pts: rect(a + b, 0, c, L), sides: [`${c} ${u}`, null, null, null], tone: 2 },
  ],
})
const boxNet = (l: number, w: number, h: number, u: string): Picture => ({
  kind: 'poly',
  shapes: [
    { pts: rect(w, 0, l, w), sides: [`${l} ${u}`, `${w} ${u}`, null, null], tone: 1 },
    { pts: rect(w, w, l, h), tone: 2 },
    { pts: rect(w, w + h, l, w), tone: 1 },
    { pts: rect(w, 2 * w + h, l, h), tone: 2 },
    { pts: rect(0, w, w, h), tone: 3 },
    { pts: rect(w + l, w, w, h), sides: [null, `${h} ${u}`, null, null], tone: 3 },
  ],
})
const box = (l: string, w: string, h: string): Picture => ({ kind: 'solid', shape: 'prism', labels: { l, w, h } })

// ── t1 · Scale drawings ─────────────────────────────────────────────────────────────────────────────────────
const SCALES = [
  { u: 'm', w: 'meters', S: [2, 3, 4, 5, 10, 20, 25, 50], things: ['road', 'path', 'field', 'bridge', 'fence'] },
  { u: 'km', w: 'kilometers', S: [5, 10, 20, 25, 50], things: ['river', 'highway', 'lake', 'trail'] },
] as const
const scale = (r: Rng) => { const sc = pick(r, SCALES); return { ...sc, S: pick(r, sc.S), thing: pick(r, sc.things) } }

const T1: Level[] = [
  lv('map length to real length', r => {
    const { u, w, S, thing } = scale(r), n = int(r, 2, 12)
    return { text: `On a map, 1 cm = ${S} ${u}. A ${thing} is ${n} cm long on the map. How many ${w} long is the real ${thing}?`,
      picture: { kind: 'poly', shapes: [], segs: [{ a: [0, 0], b: [n, 0], dots: true, label: `${n} cm` }] }, answer: n * S,
      steps: [`Each 1 cm on the map stands for ${S} ${u}.`, `${n} cm is ${n} pieces of ${S} ${u}: ${n} × ${S}.`, `So the real ${thing} is ${fmt(n * S)} ${w} long.`] }
  }),
  lv('real length back to the plan', r => {
    const { u, w, S, thing } = scale(r), n = int(r, 2, 15), real = n * S
    return { text: `On a plan, 1 cm = ${S} ${u}. A real ${thing} is ${fmt(real)} ${u} long. How many centimeters long is it on the plan?`,
      picture: { kind: 'table', head: ['drawing (cm)', '1', '?'], rows: [[`real (${u})`, String(S), fmt(real)]], rowHead: true }, answer: n,
      steps: [`${fmt(real)} ${u} is the real length, so go back the other way: divide.`, `How many ${S}s make ${fmt(real)}? ${fmt(real)} ÷ ${S}.`, `So it is ${n} cm long on the plan, and 1 cm is ${S} ${w}.`] }
  }),
  lv('spot the mistake: added instead of multiplied', r => {
    const S = pick(r, [2, 3, 4, 5, 10, 20, 25, 50]), n = int(r, 3, 12), name = pick(r, NAMES), ok = r() < 0.35
    const claim = ok ? `${n} × ${S} = ${fmt(n * S)}` : `${n} + ${S} = ${n + S}`
    const right = ok ? `${name} is right` : `No, it is ${fmt(n * S)} m`
    return { text: `On a map, 1 cm = ${S} m. A park is ${n} cm long on the map. ${name} says the real park is ${claim} m long. Which is true?`,
      picture: plan(n, int(r, 2, Math.min(n, 6)), `${n} cm`, null),
      answer: choose(r, right, [`${name} is right`, ok ? `No, it is ${n + S} m` : `No, it is ${fmt(n * S)} m`, `No, it is ${fmt((n + 1) * S)} m`].filter(c => c !== right)),
      steps: ok
        ? [`Every centimeter gets its own ${S} m, so multiply.`, `${n} × ${S} = ${fmt(n * S)}, just as ${name} says.`, `So the answer is: ${right}.`]
        : [`Every centimeter gets its own ${S} m, so multiply. Adding the ${S} to the ${n} is the slip.`, `${n} × ${S} = ${fmt(n * S)}.`, `So the answer is: ${right}.`] }
  }),
  lv('work backwards: find the scale', r => {
    const { u, w, S, thing } = scale(r), n = int(r, 2, 9), real = n * S
    return { text: `On a map, a ${thing} is ${n} cm long. The real ${thing} is ${fmt(real)} ${u} long. How many ${w} does 1 cm on the map stand for?`,
      picture: { kind: 'table', head: ['map (cm)', String(n), '1'], rows: [[`real (${u})`, fmt(real), '?']], rowHead: true }, answer: S,
      steps: [`Every centimeter on the map stands for the same real length, and ${n} cm is ${fmt(real)} ${u}.`, `Share it out: ${fmt(real)} ÷ ${n}.`, `So 1 cm stands for ${S} ${w}.`] }
  }),
  lv('two-step story: fence around a garden on a plan', r => {
    const S = pick(r, [2, 3, 4, 5, 10]), w = int(r, 3, 9), h = int(r, 2, w), ans = 2 * (w + h) * S
    return { text: `A garden is drawn on a plan where 1 cm = ${S} m. On the plan it is ${w} cm by ${h} cm. How many meters of fence go all the way around the real garden?`,
      picture: plan(w, h, `${w} cm`, `${h} cm`), answer: ans,
      steps: [`Real sides: ${w} × ${S} = ${w * S} m and ${h} × ${S} = ${h * S} m.`, `All the way around: ${w * S} + ${h * S} + ${w * S} + ${h * S}.`, `So ${fmt(ans)} m of fence go around the garden.`] }
  }),
]

// ── t2 · Circumference ──────────────────────────────────────────────────────────────────────────────────────
const ROUND = ['round table', 'clock', 'round pond', 'round rug', 'plate', 'round window']

const T2: Level[] = [
  lv('diameter drawn: multiply by 3.14', r => {
    const { u, w } = pick(r, UNITS), d = int(r, 2, 40), C = pi(d)
    return { text: `How far is it around this circle, in ${w}? Use 3.14.`, picture: circle(d / 2, `${d} ${u}`, 'd'), answer: C,
      steps: [`The line straight across is the diameter, ${d} ${u}.`, `Around is about 3.14 times across: ${d} × 3.14.`, `So it is ${fmt(C)} ${w} around.`] }
  }),
  lv('radius drawn: double it first', r => {
    const { u, w } = pick(r, UNITS), rad = int(r, 2, 20), C = pi(2 * rad)
    return { text: `What is the circumference of this circle, in ${w}? Use 3.14.`, picture: circle(rad, `${rad} ${u}`, 'r'), answer: C,
      steps: [`The line from the center to the edge is the radius. Double it: the diameter is ${2 * rad} ${u}.`, `Multiply by 3.14: ${2 * rad} × 3.14.`, `So the circumference is ${fmt(C)} ${w}.`] }
  }),
  lv('spot the mistake: used the radius', r => {
    const { u } = pick(r, UNITS), rad = int(r, 3, 15), name = pick(r, NAMES), thing = pick(r, ROUND), ok = r() < 0.35
    const C = pi(2 * rad), slip = pi(rad), claim = ok ? `${2 * rad} × 3.14 = ${fmt(C)}` : `${rad} × 3.14 = ${fmt(slip)}`
    const right = ok ? `${name} is right` : `No, it is ${fmt(C)} ${u}`
    const all = [`${name} is right`, `No, it is ${fmt(ok ? slip : C)} ${u}`, `No, it is ${fmt(pi(rad * rad))} ${u}`]
    return { text: `A ${thing} has a radius of ${rad} ${u}. ${name} says it is ${claim} ${u} around. Which is true?`,
      picture: circle(rad, `${rad} ${u}`, 'r'), answer: choose(r, right, all.filter(c => c !== right)),
      steps: ok
        ? [`${rad} ${u} is the radius, so ${name} doubled it first: ${2 * rad} ${u} across.`, `${2 * rad} × 3.14 = ${fmt(C)}, just as ${name} says.`, `So the answer is: ${right}.`]
        : [`${rad} ${u} is the radius, only half the way across. Double it first: ${2 * rad} ${u}.`, `${2 * rad} × 3.14 = ${fmt(C)}.`, `So the answer is: ${right}.`] }
  }),
  lv('work backwards: distance across from distance around', r => {
    const { u, w } = pick(r, UNITS), d = int(r, 3, 30), C = pi(d), thing = pick(r, ROUND)
    return { text: `A ${thing} is ${fmt(C)} ${u} around. How far is it straight across, in ${w}? Use 3.14.`,
      picture: circle(d === 10 ? 6 : 5, '?', 'd'), answer: d, // a neutral size: the drawn width must not be the answer
      steps: ['Around is 3.14 times across, so go backwards: divide by 3.14.', `${fmt(C)} ÷ 3.14 = ${d}.`, `So it is ${d} ${w} across.`] }
  }),
  lv('two-step story: many turns or laps', r => {
    const name = pick(r, NAMES), n = int(r, 2, 9)
    const [rad, u, w, text] = r() < 0.5
      ? (() => { const k = int(r, 8, 16); return [k, 'in', 'inches', `A bike wheel has a radius of ${k} inches. It turns all the way around ${n} times. How many inches does the bike roll? Use 3.14.`] as const })()
      : (() => { const k = int(r, 10, 50); return [k, 'm', 'meters', `A round track has a radius of ${k} m. ${name} runs ${n} laps around it. How many meters does ${name} run? Use 3.14.`] as const })()
    const one = pi(2 * rad), ans = pi(2 * rad * n)
    return { text, picture: circle(rad, `${rad} ${u}`, 'r'), answer: ans,
      steps: [`Double the radius: the diameter is ${2 * rad} ${u}. Once around is ${2 * rad} × 3.14 = ${fmt(one)} ${u}.`, `${n} times around: ${fmt(one)} × ${n}.`, `So that is ${fmt(ans)} ${w}.`] }
  }),
]

// ── t3 · Area of a circle ───────────────────────────────────────────────────────────────────────────────────
const T3: Level[] = [
  lv('radius drawn: radius × radius × 3.14', r => {
    const { u, sq } = pick(r, UNITS), rad = int(r, 2, 15), A = pi(rad * rad)
    return { text: `What is the area of this circle in ${sq}? Use π ≈ 3.14.`, picture: circle(rad, `${rad} ${u}`, 'r'), answer: A,
      steps: [`Radius × radius: ${rad} × ${rad} = ${rad * rad}.`, `Multiply by 3.14: ${rad * rad} × 3.14.`, `So the area is ${fmt(A)} ${sq}.`] }
  }),
  lv('diameter drawn: halve it first', r => {
    const { u, sq } = pick(r, UNITS), rad = int(r, 2, 12), A = pi(rad * rad)
    return { text: `Find the area of this circle in ${sq}. Use π ≈ 3.14.`, picture: circle(rad, `${2 * rad} ${u}`, 'd'), answer: A,
      steps: [`The line goes all the way across, so it is the diameter. Halve it: the radius is ${rad} ${u}.`, `Radius × radius: ${rad} × ${rad} = ${rad * rad}. Then ${rad * rad} × 3.14.`, `So the area is ${fmt(A)} ${sq}.`] }
  }),
  lv('spot the mistake: used the diameter', r => {
    const { u, sq } = pick(r, UNITS), rad = int(r, 3, 10), d = 2 * rad, name = pick(r, NAMES), thing = pick(r, ROUND), ok = r() < 0.35
    const A = pi(rad * rad), slip = pi(d * d), claim = ok ? `3.14 × ${rad} × ${rad} = ${fmt(A)}` : `3.14 × ${d} × ${d} = ${fmt(slip)}`
    const right = ok ? `${name} is right` : `No, it is ${fmt(A)} ${sq}`
    const all = [`${name} is right`, `No, it is ${fmt(ok ? slip : A)} ${sq}`, `No, it is ${fmt(pi(d))} ${sq}`]
    return { text: `A ${thing} is ${d} ${u} across. ${name} says its area is ${claim} ${sq}. Which is true?`,
      picture: circle(rad, `${d} ${u}`, 'd'), answer: choose(r, right, all.filter(c => c !== right)),
      steps: ok
        ? [`The rule wants the radius. ${name} halved ${d} ${u} to get ${rad} ${u}.`, `3.14 × ${rad} × ${rad} = ${fmt(A)}, just as ${name} says.`, `So the answer is: ${right}.`]
        : [`${d} ${u} is the distance across. The rule wants the radius: ${d} ÷ 2 = ${rad} ${u}.`, `3.14 × ${rad} × ${rad} = ${fmt(A)}.`, `So the answer is: ${right}.`] }
  }),
  lv('work backwards: radius from the area', r => {
    const { u, w, sq } = pick(r, UNITS), rad = int(r, 2, 12), A = pi(rad * rad)
    return { text: `A circle covers ${fmt(A)} ${sq}. What is its radius, in ${w}? Use π ≈ 3.14.`, picture: circle(rad === 5 ? 6 : 5, '?', 'r'), answer: rad, // a neutral size: the drawn radius must not be the answer
      steps: [`Area = 3.14 × radius × radius, so go backwards: ${fmt(A)} ÷ 3.14 = ${rad * rad}.`, `Which number times itself makes ${rad * rad}? ${rad} × ${rad} = ${rad * rad}.`, `So the radius is ${rad} ${u}.`] }
  }),
  lv('two-step story: cost to cover a circle', r => {
    const rad = int(r, 2, 10), d = 2 * rad, c = int(r, 2, 9), A = pi(rad * rad), ans = pi(rad * rad * c)
    const [thing, stuff] = pick(r, [['round patio', 'Stone'], ['round garden', 'Grass sod'], ['round stage', 'Carpet']] as const)
    return { text: `A ${thing} is ${d} ft across. ${stuff} costs $${c} for each square foot. How many dollars does it cost to cover the whole ${thing}? Use π ≈ 3.14.`,
      picture: circle(rad, `${d} ft`, 'd'), answer: ans,
      steps: [`Halve the diameter: the radius is ${rad} ft. Area: 3.14 × ${rad} × ${rad} = ${fmt(A)} square feet.`, `Each square foot costs $${c}: ${fmt(A)} × ${c}.`, `So it costs $${money(ans)}.`] }
  }),
]

// ── t4 · Complementary and supplementary angles ─────────────────────────────────────────────────────────────
const split = (r: Rng, whole: number, a: number): Picture =>
  r() < 0.5 ? corner([whole - a, a], ['?', `${a}°`]) : corner([a, whole - a], [`${a}°`, '?'])

const T4: Level[] = [
  lv('square corner, told in words', r => {
    const a = int(r, 10, 80)
    return { text: `Two angles make a square corner. One is ${a}°. How many degrees is the other?`, picture: split(r, 90, a), answer: 90 - a,
      steps: ['Together they make a square corner, so they add up to 90°.', `Take away the part you know: 90 − ${a}.`, `So the other angle is ${90 - a}°.`] }
  }),
  lv('read the picture: corner or straight line?', r => {
    const whole = pick(r, [90, 180]), a = int(r, 10, whole - 10)
    return { text: 'Look at the picture first: is it a square corner or a straight line? How many degrees is the missing angle?',
      picture: split(r, whole, a), answer: whole - a,
      steps: [whole === 90 ? 'The two angles fill a square corner, so they add up to 90°.' : 'The two angles sit on a straight line, so they add up to 180°.', `Take away the part you know: ${whole} − ${a}.`, `So the missing angle is ${whole - a}°.`] }
  }),
  lv('the words: complementary or supplementary', r => {
    const comp = r() < 0.5, whole = comp ? 90 : 180
    let a = int(r, 5, whole - 5)
    while (a === 90) a = int(r, 5, whole - 5)
    const word = comp ? 'complementary' : 'supplementary'
    return { text: `Two angles are ${word}. One is ${a}°. How many degrees is the other?`, picture: eq(`${a}° and ?`, [word]), answer: whole - a,
      steps: [`${comp ? 'Complementary' : 'Supplementary'} angles add up to ${whole}°.`, `Take away the part you know: ${whole} − ${a}.`, `So the other angle is ${whole - a}°.`] }
  }),
  lv('spot the mistake: started from the wrong whole', r => {
    const whole = pick(r, [90, 180]), name = pick(r, NAMES), ok = r() < 0.35
    let a = int(r, 10, 80)
    while (a === 45) a = int(r, 10, 80)
    const said = ok ? whole : 270 - whole, right = ok ? `${name} is right` : `No, it is ${whole - a}°`
    // Wrong choices sit close to the true size, so the drawn angle cannot pick the answer by eye (only the arithmetic can).
    const T = whole - a, close = T < 20 ? [T + 10, T + 20] : [T - 10, T + 10]
    const all = [`${name} is right`, ...(ok ? close : [T, pick(r, close)]).map(v => `No, it is ${v}°`)]
    return { text: `Two angles make ${whole === 90 ? 'a square corner' : 'a straight line'}. One is ${a}°. ${name} says the other is ${said} − ${a} = ${said - a}°. Which is true?`,
      picture: split(r, whole, a), answer: choose(r, right, all.filter(c => c !== right)),
      steps: [`${whole === 90 ? 'A square corner' : 'A straight line'} is ${whole}°, so start from ${whole}.`, `${whole} − ${a} = ${whole - a}.`, `So the answer is: ${right}.`] }
  }),
  lv('two steps: complement, then supplement', r => {
    const fromA = r() < 0.5, A = int(r, 10, 80), B = 90 - A, C = 180 - B
    return fromA
      ? { text: `Angles A and B are complementary. Angles B and C are supplementary. Angle A is ${A}°. How many degrees is angle C?`,
          picture: eq(`A = ${A}°`, ['A + B = 90°', 'B + C = 180°', 'C = ?']), answer: C,
          steps: [`A and B add up to 90°: B = 90 − ${A} = ${B}°.`, `B and C add up to 180°: C = 180 − ${B}.`, `So angle C is ${C}°.`] }
      : { text: `Angles A and B are complementary. Angles B and C are supplementary. Angle C is ${C}°. How many degrees is angle A?`,
          picture: eq(`C = ${C}°`, ['A + B = 90°', 'B + C = 180°', 'A = ?']), answer: A,
          steps: [`B and C add up to 180°: B = 180 − ${C} = ${B}°.`, `A and B add up to 90°: A = 90 − ${B}.`, `So angle A is ${A}°.`] }
  }),
]

// ── t5 · Vertical angles ────────────────────────────────────────────────────────────────────────────────────
const ACROSS: Record<Spot, Spot> = { r: 'l', l: 'r', t: 'b', b: 't' }
const NEXT: Record<Spot, Spot[]> = { r: ['t', 'b'], l: ['t', 'b'], t: ['r', 'l'], b: ['r', 'l'] }
/** A crossing and the size of the angle at a spot. */
const crossing = (r: Rng) => {
  let deg = int(r, 25, 155)
  while (Math.abs(deg - 90) < 6) deg = int(r, 25, 155)
  return { deg, at: (s: Spot) => (s === 'r' || s === 'l' ? deg : 180 - deg) }
}

const T5: Level[] = [
  lv('straight across: copy it', r => {
    const { deg, at } = crossing(r), k = pick(r, ['r', 'l', 't', 'b'] as const), v = at(k)
    return { text: `Two straight lines cross. Angle A is ${v}°. How many degrees is the angle marked ?`, picture: cross(deg, { [k]: 'A', [ACROSS[k]]: '?' }), answer: v,
      steps: ['The ? angle is straight across from angle A, not next door.', 'Angles straight across from each other are equal.', `So the angle is ${v}°.`] }
  }),
  lv('next door: take it from 180', r => {
    const { deg, at } = crossing(r), k = pick(r, ['r', 'l', 't', 'b'] as const), v = at(k), n = pick(r, NEXT[k])
    return { text: `Two straight lines cross. How many degrees is the angle marked ?`, picture: cross(deg, { [k]: `${v}°`, [n]: '?' }), answer: 180 - v,
      steps: [`The ? angle is next door to the ${v}° angle. Together they make a straight line.`, `So they add up to 180°: 180 − ${v}.`, `So the angle is ${180 - v}°.`] }
  }),
  lv('spot the mistake: took the angle across from 180', r => {
    const { deg, at } = crossing(r), k = pick(r, ['r', 'l', 't', 'b'] as const), v = at(k), name = pick(r, NAMES), ok = r() < 0.35
    const claim = ok ? `the same as the ${v}° angle across from it` : `180 − ${v} = ${180 - v}°`
    const right = ok ? `${name} is right` : `No, it is ${v}°`
    // Wrong choices sit close to the true size, so the drawn angle cannot pick the answer by eye (only the rule can).
    const close = [v - 10, v + 10]
    const all = [`${name} is right`, ...(ok ? close : [v, pick(r, close)]).map(x => `No, it is ${x}°`)]
    return { text: `Two straight lines cross. ${name} says the angle marked ? is ${claim}. Which is true?`,
      picture: cross(deg, { [k]: `${v}°`, [ACROSS[k]]: '?' }), answer: choose(r, right, all.filter(c => c !== right)),
      steps: ok
        ? ['The ? angle is straight across from the one you know.', `Straight-across angles are equal, so it is ${v}°, just as ${name} says.`, `So the answer is: ${right}.`]
        : [`180 − ${v} gives the angle next door. The ? angle is straight across.`, `Straight-across angles are equal, so it is ${v}°.`, `So the answer is: ${right}.`] }
  }),
  lv('work backwards: an equal pair adds to a total', r => {
    const { deg } = crossing(r), top = 180 - deg
    return { text: `Two straight lines cross. The left angle and the right angle add up to ${2 * deg}°. How many degrees is the top angle?`,
      picture: cross(deg, { t: '?' }), answer: top,
      steps: [`The left and right angles are straight across from each other, so they are equal: ${2 * deg} ÷ 2 = ${deg}.`, `The top angle is next door to the right angle, on a straight line: 180 − ${deg}.`, `So the top angle is ${top}°.`] }
  }),
  lv('story: one angle is bigger than its neighbor', r => {
    const d = 10 * int(r, 1, 8), x = (180 - d) / 2, top = x + d
    const where = pick(r, ['Two straight paths cross in a park.', 'Two straight roads cross at a corner.', 'Two straight ropes cross on a ship.'])
    return { text: `${where} The top angle is ${d}° bigger than the right angle. How many degrees is the bottom angle?`,
      picture: cross(x, { b: '?' }), answer: top,
      steps: [`The top and right angles are next door, so they add up to 180°. Take away the extra ${d}°: 180 − ${d} = ${180 - d}, and ${180 - d} ÷ 2 = ${x}.`, `So the right angle is ${x}° and the top angle is ${x} + ${d} = ${top}°.`, `The bottom angle is straight across from the top angle, so it is ${top}°.`] }
  }),
]

// ── t6 · Can these sides make a triangle? ───────────────────────────────────────────────────────────────────
type Fate = 'yes' | 'flat' | 'short'
const YES = 'Yes, they make a triangle', FLAT = 'No, the two shorter sides only meet lying flat', SHORT = 'No, the two shorter sides do not reach'
const fate = (ls: number[]): Fate => { const [a, b, c] = [...ls].sort((x, y) => x - y); return a + b > c ? 'yes' : a + b === c ? 'flat' : 'short' }
/** Three different whole lengths with the given outcome. */
const sides = (r: Rng, want: Fate): number[] => {
  for (;;) {
    const ls = [int(r, 2, 15), int(r, 2, 15), int(r, 2, 15)]
    if (new Set(ls).size === 3 && fate(ls) === want) return ls.sort((x, y) => x - y)
  }
}
const verdict = (ls: number[], u: string) => {
  const [a, b, c] = [...ls].sort((x, y) => x - y), f = fate(ls), s = a + b
  const right = f === 'yes' ? YES : f === 'flat' ? FLAT : SHORT
  return { a, b, c, s, f, right, cmp: `${s} is ${f === 'yes' ? 'more than' : f === 'flat' ? 'exactly' : 'less than'} the longest, ${c} ${u}.` }
}

const T6: Level[] = [
  lv('shortest first: add the two shorter', r => {
    const u = pick(r, ['cm', 'in']), ls = sides(r, pick(r, ['yes', 'flat', 'short'] as const)), v = verdict(ls, u)
    return { text: `Can sticks ${ls[0]} ${u}, ${ls[1]} ${u} and ${ls[2]} ${u} long make a triangle?`, picture: sticks(ls, u),
      answer: choose(r, v.right, [YES, FLAT, SHORT].filter(c => c !== v.right)),
      steps: [`The two shorter sticks are ${v.a} ${u} and ${v.b} ${u}. ${v.a} + ${v.b} = ${v.s}.`, v.cmp, `So the answer is: ${v.right}.`] }
  }),
  lv('mixed order: find the longest first', r => {
    const u = pick(r, ['m', 'ft']), sorted = sides(r, pick(r, ['yes', 'flat', 'short'] as const))
    let ls = shuffle(r, sorted)
    while (ls[2] === sorted[2]) ls = shuffle(r, sorted)
    const v = verdict(ls, u)
    return { text: `Can sides ${ls[0]} ${u}, ${ls[1]} ${u} and ${ls[2]} ${u} long make a triangle? Find the longest side first.`, picture: sticks(ls, u),
      answer: choose(r, v.right, [YES, FLAT, SHORT].filter(c => c !== v.right)),
      steps: [`The longest side is ${v.c} ${u}, so the two shorter are ${v.a} ${u} and ${v.b} ${u}: ${v.a} + ${v.b} = ${v.s}.`, v.cmp, `So the answer is: ${v.right}.`] }
  }),
  lv('spot the mistake: added the longest side', r => {
    const u = pick(r, ['cm', 'in', 'ft']), name = pick(r, NAMES), ok = r() < 0.4
    const ls = shuffle(r, sides(r, ok ? 'yes' : pick(r, ['flat', 'short'] as const))), v = verdict(ls, u)
    const claim = ok ? `${v.a} + ${v.b} = ${v.s}. That is more than ${v.c}` : `${v.c} + ${v.a} = ${v.c + v.a}. That is more than ${v.b}`
    const right = ok ? `${name} is right` : 'No, they cannot make a triangle'
    return { text: `${name} checks sides ${ls[0]} ${u}, ${ls[1]} ${u} and ${ls[2]} ${u}: "${claim}, so they make a triangle." Which is true?`,
      picture: sticks(ls, u),
      answer: choose(r, right, [`${name} is right`, 'No, they cannot make a triangle', 'No, all three sides must be the same length'].filter(c => c !== right)),
      steps: ok
        ? [`${name} added the two shorter sides, which is the rule.`, `${v.s} is more than ${v.c}, so the ends meet above the longest side.`, `So the answer is: ${right}.`]
        : [`${name} added the longest side. Add the two shorter sides instead: ${v.a} + ${v.b} = ${v.s}.`, `${v.s} is not more than ${v.c}, so the ends cannot lift into a point.`, `So the answer is: ${right}.`] }
  }),
  lv('work backwards: how long can the third side be?', r => {
    const { u, w } = pick(r, UNITS.slice(0, 3)), longest = r() < 0.5
    let a = int(r, 3, 12), b = int(r, 3, 12)
    while (a >= b || (!longest && b > 2 * a - 2)) { a = int(r, 3, 12); b = int(r, 3, 12) }
    const ans = longest ? a + b - 1 : b - a + 1
    // the ? stick is drawn a half unit past the longer given stick (or short of the shorter one): it keeps its role, but a
    // half is never the whole-number answer, so the answer cannot be read off by comparing sticks
    const unknown = longest ? b + 0.5 : a - 0.5
    return { text: longest
        ? `Two sticks are ${a} ${u} and ${b} ${u} long. A third stick is the longest of the three, and a whole number of ${w}. They make a triangle. What is the longest the third stick can be, in ${w}?`
        : `Two sticks are ${a} ${u} and ${b} ${u} long. A third stick is the shortest of the three, and a whole number of ${w}. They make a triangle. What is the shortest the third stick can be, in ${w}?`,
      picture: { kind: 'poly', shapes: [], segs: [{ a: [0, 3], b: [a, 3], dots: true, label: `${a} ${u}` }, { a: [0, 1.5], b: [b, 1.5], dots: true, label: `${b} ${u}` }, { a: [0, 0], b: [unknown, 0], dots: true, dashed: true, label: '?' }] },
      answer: ans,
      steps: longest
        ? [`The two shorter sticks must add up to more than the longest: ${a} + ${b} = ${a + b}.`, `So the third stick must be less than ${a + b}.`, `So the longest it can be is ${ans} ${u}.`]
        : [`Now ${b} ${u} is the longest. The two shorter, ${a} and the new stick, must add up to more than ${b}.`, `So the new stick must be more than ${b} − ${a} = ${b - a}.`, `So the shortest it can be is ${ans} ${u}.`] }
  }),
  lv('story: which three pieces make a pen?', r => {
    const name = pick(r, NAMES)
    for (;;) {
      const ls = [int(r, 2, 15), int(r, 2, 15), int(r, 2, 15), int(r, 2, 15)]
      if (new Set(ls).size < 4) continue
      const sets = [0, 1, 2, 3].map(skip => ls.filter((_, i) => i !== skip).sort((x, y) => x - y))
      const good = sets.filter(s => fate(s) === 'yes')
      if (good.length !== 1) continue
      const say = (s: number[]) => `${s[0]} ft, ${s[1]} ft and ${s[2]} ft`
      const [a, b, c] = good[0], right = say(good[0])
      return { text: `${name} has four fence pieces: ${ls.map(l => `${l} ft`).join(', ')}. ${name} uses three of them for a triangle pen. Which three work?`,
        picture: sticks(ls, 'ft'), answer: choose(r, right, sets.filter(s => s !== good[0]).map(say)),
        steps: ['For each set of three, add the two shorter pieces and compare with the longest.', `${a} + ${b} = ${a + b}, which is more than ${c}. In every other set the two shorter pieces are not more than the longest.`, `So the answer is: ${right}.`] }
    }
  }),
]

// ── t7 · Surface area of prisms ─────────────────────────────────────────────────────────────────────────────
const TRIPLES = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13]] as const

const T7: Level[] = [
  lv('box net: each face, then add', r => {
    const { u, sq } = pick(r, UNITS), l = int(r, 3, 10), w = int(r, 2, 6), h = int(r, 2, 8)
    const one = l * w + l * h + w * h, sa = 2 * one
    return { text: `This box is unfolded flat. What is the area of all its faces in ${sq}?`, picture: boxNet(l, w, h, u), answer: sa,
      steps: [`Top and bottom: ${l} × ${w} = ${l * w} each. Front and back: ${l} × ${h} = ${l * h} each.`, `The two ends: ${w} × ${h} = ${w * h} each. One of each: ${l * w} + ${l * h} + ${w * h} = ${one}.`, `Each face has a partner: ${one} × 2. So ${fmt(sa)} ${sq}.`] }
  }),
  lv('wedge net: both ends and three sides', r => {
    const { u, sq } = pick(r, UNITS), [a, b, c] = pick(r, TRIPLES), L = int(r, 2, 12), end = (a * b) / 2, sa = a * b + (a + b + c) * L
    return { text: `This wedge is unfolded flat. Its two ends are triangles with a square corner. What is the area of all its faces in ${sq}?`,
      picture: triNet(a, b, c, L, u), answer: sa,
      steps: [`Two triangle ends: 1/2 × ${b} × ${a} = ${end} each, so ${a * b}.`, `Three sides: ${a} × ${L} = ${a * L}, ${b} × ${L} = ${b * L} and ${c} × ${L} = ${c * L}.`, `${a * b} + ${a * L} + ${b * L} + ${c * L} = ${fmt(sa)}. So ${fmt(sa)} ${sq}.`] }
  }),
  lv('spot the mistake: counted one end only', r => {
    const { u, sq } = pick(r, UNITS), [a, b, c] = pick(r, TRIPLES), L = int(r, 3, 12), name = pick(r, NAMES), ok = r() < 0.35
    const end = (a * b) / 2, sides3 = `${a * L} + ${b * L} + ${c * L}`, sa = a * b + (a + b + c) * L, slip = sa - end
    const claim = ok ? `${end} + ${end} + ${sides3} = ${fmt(sa)}` : `${end} + ${sides3} = ${fmt(slip)}`
    const right = ok ? `${name} is right` : `No, it is ${fmt(sa)} ${sq}`
    const all = [`${name} is right`, `No, it is ${fmt(ok ? slip : sa)} ${sq}`, `No, it is ${fmt(sa + end)} ${sq}`]
    return { text: `${name} adds up the faces of this wedge: ${claim} ${sq}. Which is true?`,
      picture: wedge(b, a, L, u, { slant: `${c} ${u}` }), answer: choose(r, right, all.filter(c2 => c2 !== right)),
      steps: [`The wedge has 2 triangle ends of 1/2 × ${b} × ${a} = ${end}, and 3 sides: ${sides3}.`, `${end} + ${end} + ${sides3} = ${fmt(sa)}.`, `So the answer is: ${right}.`] }
  }),
  lv('work backwards: box height from the faces', r => {
    const { u, w: word, sq } = pick(r, UNITS), l = int(r, 3, 9), w = int(r, 2, 6), h = int(r, 2, 9)
    const sa = 2 * (l * w + l * h + w * h), rest = sa - 2 * l * w, around = 2 * (l + w)
    return { text: `A box is ${l} ${u} long and ${w} ${u} wide. The area of all its faces is ${fmt(sa)} ${sq}. How tall is it, in ${word}?`,
      picture: box(`${l} ${u}`, `${w} ${u}`, '?'), answer: h,
      steps: [`Top and bottom: ${l} × ${w} = ${l * w} each, so ${2 * l * w}. The four sides make the rest: ${fmt(sa)} − ${2 * l * w} = ${rest}.`, `The four sides wrap ${l} + ${w} + ${l} + ${w} = ${around} ${u} around the box, and each is as tall as the box: ${rest} ÷ ${around}.`, `So the box is ${h} ${word} tall.`] }
  }),
  lv('story: a tent with no floor', r => {
    const [half, h, s] = pick(r, [[3, 4, 5], [4, 3, 5], [6, 8, 10]] as const), b = 2 * half, L = int(r, 5, 12)
    const ends = b * h, sides2 = 2 * s * L, ans = ends + sides2
    return { text: `A tent has a triangle at each end, ${b} ft across the bottom and ${h} ft tall. Its two slanted sides are ${s} ft from top to bottom, and it is ${L} ft long. The tent has no floor. How many square feet of cloth make the tent?`,
      picture: wedge(b, h, L, 'ft', { apex: half, slant: `${s} ft` }), answer: ans,
      steps: [`Two triangle ends: 1/2 × ${b} × ${h} = ${ends / 2} each, so ${ends}.`, `Two slanted sides: ${s} × ${L} = ${s * L} each, so ${sides2}. There is no floor, so leave out the ${b} × ${L} bottom.`, `${ends} + ${sides2} = ${ans}. So ${fmt(ans)} square feet of cloth.`] }
  }),
]

// ── t8 · Volume of prisms ───────────────────────────────────────────────────────────────────────────────────
const T8: Level[] = [
  lv('box: base area × height', r => {
    const { u, cu } = pick(r, UNITS), l = int(r, 2, 12), w = int(r, 2, 9), h = int(r, 2, 10), v = l * w * h
    return { text: `What is the volume of this box in ${cu}?`, picture: box(`${l} ${u}`, `${w} ${u}`, `${h} ${u}`), answer: v,
      steps: [`The base is ${l} × ${w} = ${l * w}.`, `There are ${h} layers of ${l * w}: ${l * w} × ${h}.`, `So the volume is ${fmt(v)} ${cu}.`] }
  }),
  lv('wedge: triangle base first', r => {
    const { u, cu } = pick(r, UNITS), b = 2 * int(r, 2, 6), h = int(r, 2, 9), L = int(r, 3, 12), B = (b * h) / 2, v = B * L
    return { text: `This wedge has a triangle base with a square corner. What is its volume in ${cu}?`, picture: wedge(b, h, L, u), answer: v,
      steps: [`The triangle base is 1/2 × ${b} × ${h} = ${B}.`, `Multiply by how long the wedge is: ${B} × ${L}.`, `So the volume is ${fmt(v)} ${cu}.`] }
  }),
  lv('spot the mistake: multiplied all three edges', r => {
    const { u, cu } = pick(r, UNITS), b = 2 * int(r, 1, 6), h = 2 * int(r, 1, 5), L = int(r, 3, 12), name = pick(r, NAMES), ok = r() < 0.35
    const all3 = b * h * L, v = all3 / 2
    const claim = ok ? `1/2 × ${b} × ${h} × ${L} = ${fmt(v)}` : `${b} × ${h} × ${L} = ${fmt(all3)}`
    const right = ok ? `${name} is right` : `No, it is ${fmt(v)} ${cu}`
    const all = [`${name} is right`, `No, it is ${fmt(ok ? all3 : v)} ${cu}`, `No, it is ${fmt(v / 2)} ${cu}`]
    return { text: `${name} says this wedge holds ${claim} ${cu}. Which is true?`, picture: wedge(b, h, L, u), answer: choose(r, right, all.filter(c => c !== right)),
      steps: [`The base is a triangle, only half a rectangle: 1/2 × ${b} × ${h} = ${(b * h) / 2}.`, `Multiply by how long the wedge is: ${(b * h) / 2} × ${L} = ${fmt(v)}.`, `So the answer is: ${right}.`] }
  }),
  lv('work backwards: wedge length from the volume', r => {
    const { u, w, cu } = pick(r, UNITS), b = 2 * int(r, 2, 6), h = int(r, 2, 9), L = int(r, 3, 12), B = (b * h) / 2, v = B * L
    return { text: `A wedge holds ${fmt(v)} ${cu}. Its triangle base is ${b} ${u} along the bottom and ${h} ${u} tall. How long is the wedge, in ${w}?`,
      picture: wedge(b, h, L === 6 ? 7 : 6, u, { lLabel: '?' }), answer: L, // drawn at a neutral length, not the answer
      steps: [`Volume = base area × length. The triangle base is 1/2 × ${b} × ${h} = ${B}.`, `So ${B} × length = ${fmt(v)}. Go backwards: ${fmt(v)} ÷ ${B}.`, `So the wedge is ${L} ${w} long.`] }
  }),
  lv('multi-step story: bags of concrete for a ramp', r => {
    for (;;) {
      const b = int(r, 6, 12), h = int(r, 1, 4), L = int(r, 3, 10), k = pick(r, [2, 3, 4, 5]), v = (b * h * L) / 2
      if (!Number.isInteger(v) || v % k) continue
      const B = (b * h) / 2
      return { text: `A concrete ramp is shaped like a wedge. Its triangle end is ${b} ft along the ground and ${h} ft tall, and the ramp is ${L} ft wide. One bag of concrete fills ${k} cubic feet. How many bags does the ramp need?`,
        picture: wedge(b, h, L, 'ft'), answer: v / k,
        steps: [`The triangle end: 1/2 × ${b} × ${h} = ${fmt(B)} square feet. The ramp holds ${fmt(B)} × ${L} = ${fmt(v)} cubic feet.`, `Each bag fills ${k} cubic feet: ${fmt(v)} ÷ ${k}.`, `So the ramp needs ${fmt(v / k)} bags.`] }
    }
  }),
]

export const G7M4_LADDERS: Record<string, Level[]> = {
  'g7m4-t1': T1, 'g7m4-t2': T2, 'g7m4-t3': T3, 'g7m4-t4': T4, 'g7m4-t5': T5, 'g7m4-t6': T6, 'g7m4-t7': T7, 'g7m4-t8': T8,
}
