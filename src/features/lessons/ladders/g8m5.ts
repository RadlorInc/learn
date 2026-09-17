/**
 * Grade 8 · Module 5 — volume of cylinders, cones and spheres (π ≈ 3.14). Practice ladders, easiest style first
 * (see ../adaptive.ts and the reference ladders in ./g5m1.ts, ./g7m4.ts).
 * ⚠️ Every answer is EXACT to the hundredth, never rounded: volumes are computed in whole hundredths, so a cone needs
 * r × r × h to be a multiple of 3 and a ball needs its distance across to be a multiple of 3 (or its radius, when the
 * radius goes in only twice or into a can). The generators re-roll until that holds.
 * ⚠️ Pictures carry the measures, so every level runs through `lv`, which re-rolls a problem whose picture prints its own
 * answer or whose choices repeat. A distance ACROSS leaves r unlabelled, as in ../content/g8m5.ts (`solid` draws r on a
 * radius line).
 */
import type { Picture, Problem } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

const cyl = (r?: string, h?: string): Picture => ({ kind: 'solid', shape: 'cylinder', labels: { r, h } })
const cone = (r?: string, h?: string): Picture => ({ kind: 'solid', shape: 'cone', labels: { r, h } })
const ball = (r?: string): Picture => ({ kind: 'solid', shape: 'sphere', labels: { r } })

const choose = (r: Rng, right: string, wrong: string[]) => {
  const choices = shuffle(r, [right, ...wrong])
  return { choices, correct: choices.indexOf(right) }
}
const clean = (x: number) => Math.round(x * 1e6) / 1e6
/** 3.14 × n for a whole n. */
const pi = (n: number) => clean((314 * n) / 100)
/** 1/3 × 3.14 × n, for a whole n that is a multiple of 3. */
const pi3 = (n: number) => clean((314 * n) / 300)
/** A ball of whole radius r: 4/3 × 3.14 × r × r × r (r a multiple of 3). */
const ballR = (r: number) => clean((1256 * r ** 3) / 300)
/** A ball d across: 3.14 × d × d × d ÷ 6 (d a multiple of 3). */
const ballD = (d: number) => clean((314 * d ** 3) / 600)

const NAMES = ['Leo', 'Mia', 'Sam', 'Ava', 'Kai', 'Nina', 'Ben', 'Zoe']
const UNITS = [
  { u: 'cm', w: 'centimeters', cu: 'cubic centimeters' },
  { u: 'in', w: 'inches', cu: 'cubic inches' },
  { u: 'ft', w: 'feet', cu: 'cubic feet' },
  { u: 'm', w: 'meters', cu: 'cubic meters' },
] as const
type Unit = (typeof UNITS)[number]
const SMALL: readonly Unit[] = [UNITS[0], UNITS[1]]
const BIG: readonly Unit[] = [UNITS[2], UNITS[3]]

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
/** A radius and height whose r × r × h is a multiple of 3, so a cone's volume is exact. */
const coneDims = (r: Rng, rLo: number, rHi: number, hLo: number, hHi: number) => {
  for (;;) { const rad = int(r, rLo, rHi), h = int(r, hLo, hHi); if ((rad * rad * h) % 3 === 0) return { rad, h } }
}

// ── t1 · Volume of a cylinder ───────────────────────────────────────────────────────────────────────────────
const CANS = [
  { things: ['can', 'glass', 'jar', 'vase'], units: SMALL },
  { things: ['water tank', 'grain bin'], units: BIG },
] as const
const can = (r: Rng) => { const c = pick(r, CANS); return { thing: pick(r, c.things), ...pick(r, c.units) } }

const T1: Level[] = [
  lv('labelled cylinder: circle × height', r => {
    const { u, cu } = pick(r, UNITS), rad = int(r, 1, 10), h = int(r, 2, 15), A = pi(rad * rad), V = pi(rad * rad * h)
    return { text: `What is the volume of this cylinder in ${cu}? Use π ≈ 3.14.`, picture: cyl(`${rad} ${u}`, `${h} ${u}`), answer: V,
      steps: [`The circle on the bottom: 3.14 × ${rad} × ${rad} = ${fmt(A)}.`, `Multiply by the height: ${fmt(A)} × ${h}.`, `So the volume is ${fmt(V)} ${cu}.`] }
  }),
  lv('distance across given: halve it first', r => {
    const { thing, u, cu } = can(r), rad = int(r, 2, 10), d = 2 * rad, h = int(r, 2, 15), A = pi(rad * rad), V = pi(rad * rad * h)
    return { text: `A ${thing} is ${d} ${u} across and ${h} ${u} tall. What is its volume in ${cu}? Use π ≈ 3.14.`, picture: cyl(undefined, `${h} ${u}`), answer: V,
      steps: [`Halve the distance across: the radius is ${rad} ${u}.`, `The circle: 3.14 × ${rad} × ${rad} = ${fmt(A)}. Multiply by the height: ${fmt(A)} × ${h}.`, `So the volume is ${fmt(V)} ${cu}.`] }
  }),
  lv('spot the mistake: used the distance across', r => {
    const { thing, u, cu } = can(r), rad = int(r, 2, 8), d = 2 * rad, h = int(r, 2, 12), name = pick(r, NAMES), ok = r() < 0.35
    const V = pi(rad * rad * h), slip = pi(d * d * h), A = pi(rad * rad)
    const claim = ok ? `3.14 × ${rad} × ${rad} × ${h} = ${fmt(V)}` : `3.14 × ${d} × ${d} × ${h} = ${fmt(slip)}`
    const right = ok ? `${name} is right` : `No, it is ${fmt(V)} ${cu}`
    const all = [`${name} is right`, `No, it is ${fmt(ok ? slip : V)} ${cu}`, `No, it is ${fmt(A)} ${cu}`]
    return { text: `A ${thing} is ${d} ${u} across and ${h} ${u} tall. ${name} says its volume is ${claim} ${cu}. Which is true?`,
      picture: cyl(undefined, `${h} ${u}`), answer: choose(r, right, all.filter(c => c !== right)),
      steps: ok
        ? [`${d} ${u} is the distance across, so ${name} halved it first: the radius is ${rad} ${u}.`, `3.14 × ${rad} × ${rad} × ${h} = ${fmt(V)}, just as ${name} says.`, `So the answer is: ${right}.`]
        : [`${d} ${u} is the distance across, but the rule wants the radius: ${d} ÷ 2 = ${rad} ${u}.`, `3.14 × ${rad} × ${rad} × ${h} = ${fmt(V)}.`, `So the answer is: ${right}.`] }
  }),
  lv('work backwards: height from the volume', r => {
    const { u, w, cu } = pick(r, UNITS), rad = int(r, 1, 8), h = int(r, 2, 15), A = pi(rad * rad), V = pi(rad * rad * h)
    return { text: `A cylinder holds ${fmt(V)} ${cu}. Its radius is ${rad} ${u}. How tall is it, in ${w}? Use π ≈ 3.14.`,
      picture: cyl(`${rad} ${u}`, '?'), answer: h,
      steps: [`The circle on the bottom: 3.14 × ${rad} × ${rad} = ${fmt(A)}.`, `The volume is the circle × the height, so go backwards: ${fmt(V)} ÷ ${fmt(A)}.`, `So it is ${h} ${w} tall.`] }
  }),
  lv('two-step story: fill many molds', r => {
    const name = pick(r, NAMES), rad = int(r, 1, 5), d = 2 * rad, h = int(r, 3, 12), n = int(r, 2, 12)
    const V = pi(rad * rad * h), ans = pi(rad * rad * h * n)
    return { text: `${name} pours wax into candle molds shaped like cylinders. Each mold is ${d} cm across and ${h} cm tall. How many cubic centimeters of wax fill ${n} molds? Use π ≈ 3.14.`,
      picture: cyl(undefined, `${h} cm`), answer: ans,
      steps: [`Halve the distance across: the radius is ${rad} cm. One mold: 3.14 × ${rad} × ${rad} × ${h} = ${fmt(V)}.`, `${n} molds: ${fmt(V)} × ${n}.`, `So ${fmt(ans)} cubic centimeters of wax fill them.`] }
  }),
]

// ── t2 · Volume of a cone ───────────────────────────────────────────────────────────────────────────────────
const T2: Level[] = [
  lv('labelled cone: cylinder ÷ 3', r => {
    const { u, cu } = pick(r, UNITS), { rad, h } = coneDims(r, 1, 9, 2, 15), C = pi(rad * rad * h), V = pi3(rad * rad * h)
    return { text: `What is the volume of this cone in ${cu}? Use π ≈ 3.14.`, picture: cone(`${rad} ${u}`, `${h} ${u}`), answer: V,
      steps: [`The cylinder with the same bottom and height: 3.14 × ${rad} × ${rad} × ${h} = ${fmt(C)}.`, `The cone is 1/3 of it: ${fmt(C)} ÷ 3.`, `So the volume is ${fmt(V)} ${cu}.`] }
  }),
  lv('distance across given: halve, then one third', r => {
    const { u, cu } = pick(r, UNITS), { rad, h } = coneDims(r, 2, 9, 2, 15), d = 2 * rad, C = pi(rad * rad * h), V = pi3(rad * rad * h)
    return { text: `A cone is ${d} ${u} across its bottom and ${h} ${u} tall. What is its volume in ${cu}? Use π ≈ 3.14.`,
      picture: cone(undefined, `${h} ${u}`), answer: V,
      steps: [`Halve the distance across: the radius is ${rad} ${u}.`, `The cylinder: 3.14 × ${rad} × ${rad} × ${h} = ${fmt(C)}. The cone is 1/3 of it: ${fmt(C)} ÷ 3.`, `So the volume is ${fmt(V)} ${cu}.`] }
  }),
  lv('spot the mistake: forgot the 1/3', r => {
    const { u, cu } = pick(r, UNITS), { rad, h } = coneDims(r, 2, 8, 2, 12), name = pick(r, NAMES), ok = r() < 0.35
    const C = pi(rad * rad * h), V = pi3(rad * rad * h), across = pi3(4 * rad * rad * h)
    const claim = ok ? `1/3 × 3.14 × ${rad} × ${rad} × ${h} = ${fmt(V)}` : `3.14 × ${rad} × ${rad} × ${h} = ${fmt(C)}`
    const right = ok ? `${name} is right` : `No, it is ${fmt(V)} ${cu}`
    const all = [`${name} is right`, `No, it is ${fmt(ok ? C : V)} ${cu}`, `No, it is ${fmt(across)} ${cu}`]
    return { text: `A cone has a radius of ${rad} ${u} and a height of ${h} ${u}. ${name} says its volume is ${claim} ${cu}. Which is true?`,
      picture: cone(`${rad} ${u}`, `${h} ${u}`), answer: choose(r, right, all.filter(c => c !== right)),
      steps: ok
        ? [`The cylinder with the same bottom and height is 3.14 × ${rad} × ${rad} × ${h} = ${fmt(C)}, and ${name} took 1/3 of it.`, `${fmt(C)} ÷ 3 = ${fmt(V)}, just as ${name} says.`, `So the answer is: ${right}.`]
        : [`${fmt(C)} is the whole cylinder. A cone holds only 1/3 of it.`, `${fmt(C)} ÷ 3 = ${fmt(V)}.`, `So the answer is: ${right}.`] }
  }),
  lv('work backwards: height from the volume', r => {
    const { u, w, cu } = pick(r, UNITS), { rad, h } = coneDims(r, 1, 8, 2, 15), A = pi(rad * rad), C = pi(rad * rad * h), V = pi3(rad * rad * h)
    return { text: `A cone holds ${fmt(V)} ${cu}. Its radius is ${rad} ${u}. How tall is it, in ${w}? Use π ≈ 3.14.`,
      picture: cone(`${rad} ${u}`, '?'), answer: h,
      steps: [`A cone is 1/3 of its cylinder, so the cylinder with the same bottom and height holds ${fmt(V)} × 3 = ${fmt(C)}.`, `The circle: 3.14 × ${rad} × ${rad} = ${fmt(A)}. Then ${fmt(C)} ÷ ${fmt(A)}.`, `So the cone is ${h} ${w} tall.`] }
  }),
  lv('story: how many cones fill a taller can', r => {
    const { u, cu } = pick(r, SMALL), { rad, h } = coneDims(r, 2, 6, 2, 8), k = int(r, 1, 4), H = k * h
    const V = pi3(rad * rad * h), C = pi(rad * rad * H)
    return { text: `A cone-shaped paper cup has a radius of ${rad} ${u} and a height of ${h} ${u}. How many full cups of water does it take to fill a can with the same radius and a height of ${H} ${u}? Use π ≈ 3.14.`,
      picture: cone(`${rad} ${u}`, `${h} ${u}`), answer: 3 * k,
      steps: [`One cup: 1/3 × 3.14 × ${rad} × ${rad} × ${h} = ${fmt(V)} ${cu}.`, `The can: 3.14 × ${rad} × ${rad} × ${H} = ${fmt(C)} ${cu}.`, `${fmt(C)} ÷ ${fmt(V)} = ${3 * k}, so it takes ${3 * k} cups.`] }
  }),
]

// ── t3 · Volume of a sphere ─────────────────────────────────────────────────────────────────────────────────
/** Radii that keep a ball exact: half of a multiple of 3. */
const RADII = [1.5, 3, 4.5, 6, 7.5, 9, 12]

const T3: Level[] = [
  lv('labelled ball: radius three times', r => {
    const { u, cu } = pick(r, UNITS), rad = pick(r, RADII), c = clean(rad ** 3), q = clean((c / 3) * 4), V = ballD(2 * rad)
    return { text: `What is the volume of this ball in ${cu}? Use π ≈ 3.14.`, picture: ball(`${fmt(rad)} ${u}`), answer: V,
      steps: [`Radius × radius × radius: ${fmt(rad)} × ${fmt(rad)} × ${fmt(rad)} = ${fmt(c)}.`, `Take 4/3 of it: ${fmt(c)} ÷ 3 × 4 = ${fmt(q)}. Then ${fmt(q)} × 3.14.`, `So the volume is ${fmt(V)} ${cu}.`] }
  }),
  lv('distance across given: halve it first', r => {
    const { u, cu } = pick(r, SMALL), thing = pick(r, ['ball', 'globe', 'round lamp']), d = 3 * int(r, 1, 8), rad = d / 2
    const c = clean(rad ** 3), q = clean((c / 3) * 4), V = ballD(d)
    return { text: `A ${thing} is ${d} ${u} across. What is its volume in ${cu}? Use π ≈ 3.14.`, picture: ball(), answer: V,
      steps: [`Halve the distance across: the radius is ${fmt(rad)} ${u}. ${fmt(rad)} × ${fmt(rad)} × ${fmt(rad)} = ${fmt(c)}.`, `Take 4/3 of it: ${fmt(c)} ÷ 3 × 4 = ${fmt(q)}. Then ${fmt(q)} × 3.14.`, `So the volume is ${fmt(V)} ${cu}.`] }
  }),
  lv('leave the answer as a number times π', r => {
    const { u, cu } = pick(r, UNITS), rad = pick(r, RADII), c = clean(rad ** 3), q = clean((c / 3) * 4)
    return { text: `A ball has a radius of ${fmt(rad)} ${u}. Leave the answer as a number times π. How many π ${cu} is its volume? Type only the number in front of π.`,
      picture: ball(`${fmt(rad)} ${u}`), answer: q,
      steps: [`${fmt(rad)} × ${fmt(rad)} × ${fmt(rad)} = ${fmt(c)}.`, `Take 4/3 of it: ${fmt(c)} ÷ 3 × 4 = ${fmt(q)}.`, `So the volume is ${fmt(q)}π ${cu}. The answer is ${fmt(q)}.`] }
  }),
  lv('spot the mistake: radius only twice', r => {
    const { u, cu } = pick(r, UNITS), rad = 3 * int(r, 1, 4), name = pick(r, NAMES), ok = r() < 0.35
    const V = ballR(rad), slip = clean((1256 * rad * rad) / 300), across = ballR(2 * rad)
    const claim = ok ? `4/3 × 3.14 × ${rad} × ${rad} × ${rad} = ${fmt(V)}` : `4/3 × 3.14 × ${rad} × ${rad} = ${fmt(slip)}`
    const right = ok ? `${name} is right` : `No, it is ${fmt(V)} ${cu}`
    const all = [`${name} is right`, `No, it is ${fmt(ok ? slip : V)} ${cu}`, `No, it is ${fmt(across)} ${cu}`]
    return { text: `A ball has a radius of ${rad} ${u}. ${name} says its volume is ${claim} ${cu}. Which is true?`,
      picture: ball(`${rad} ${u}`), answer: choose(r, right, all.filter(c => c !== right)),
      steps: ok
        ? [`A ball is round in every direction, so the radius goes in three times, and ${name} used it three times.`, `4/3 × 3.14 × ${rad} × ${rad} × ${rad} = ${fmt(V)}, just as ${name} says.`, `So the answer is: ${right}.`]
        : [`${name} used the radius only twice, the way you would for a flat circle. A ball needs it three times.`, `4/3 × 3.14 × ${rad} × ${rad} × ${rad} = ${fmt(V)}.`, `So the answer is: ${right}.`] }
  }),
  lv('story: the water left when a ball goes into its can', r => {
    const { u, cu } = pick(r, SMALL), rad = 3 * int(r, 1, 4), H = 2 * rad, C = pi(rad * rad * H), left = pi3(rad * rad * H)
    return { text: `A can fits snugly around a ball with a radius of ${rad} ${u}. So the can is as tall and as wide as the ball. It is filled to the top with water, then the ball is pushed in. How many ${cu} of water stay in the can? Use π ≈ 3.14.`,
      picture: ball(`${rad} ${u}`), answer: left,
      steps: [`The can has the ball's radius, ${rad} ${u}, and is ${H} ${u} tall: 3.14 × ${rad} × ${rad} × ${H} = ${fmt(C)}.`, `The ball pushes out 2/3 of the can, so 1/3 stays in: ${fmt(C)} ÷ 3.`, `So ${fmt(left)} ${cu} of water stay in the can.`] }
  }),
]

// ── t4 · Volume stories ─────────────────────────────────────────────────────────────────────────────────────
const OBJECTS = [
  { shape: 'cylinder', rule: 'circle × height', things: ['soup can', 'paint can', 'drinking glass', 'round cake pan'] },
  { shape: 'cone', rule: '1/3 of the cylinder with the same bottom and height', things: ['party hat', 'funnel', 'traffic cone', 'snow cone cup'] },
  { shape: 'ball', rule: 'the radius three times, 4/3 and 3.14', things: ['basketball', 'globe', 'gumball', 'soccer ball'] },
] as const
const compareLine = (a: string, x: number, b: string, y: number, cu: string) =>
  x === y ? `Both are ${fmt(x)} ${cu}, so the answer is they hold the same.`
    : x > y ? `${fmt(x)} is more than ${fmt(y)}, so the answer is ${a}.` : `${fmt(y)} is more than ${fmt(x)}, so the answer is ${b}.`

const T4: Level[] = [
  lv('name the shape: pick its rule', r => {
    const o = pick(r, OBJECTS), thing = pick(r, o.things), { u } = pick(r, SMALL), rad = int(r, 2, 6), h = int(r, rad + 1, 15)
    const cylR = `3.14 × ${rad} × ${rad} × ${h}`, coneR = `1/3 × 3.14 × ${rad} × ${rad} × ${h}`, ballRule = `4/3 × 3.14 × ${rad} × ${rad} × ${rad}`
    const [right, wrong] = o.shape === 'cylinder' ? [cylR, [coneR, ballRule]]
      : o.shape === 'cone' ? [coneR, [cylR, ballRule]]
      : [ballRule, [`3.14 × ${rad} × ${rad} × ${rad}`, `4/3 × 3.14 × ${rad} × ${rad}`]]
    const isBall = o.shape === 'ball'
    return { text: isBall ? `A ${thing} has a radius of ${rad} ${u}. Which one finds its volume?` : `A ${thing} has a radius of ${rad} ${u} and a height of ${h} ${u}. Which one finds its volume?`,
      picture: { kind: 'table', rows: isBall ? [['radius', `${rad} ${u}`]] : [['radius', `${rad} ${u}`], ['height', `${h} ${u}`]], rowHead: true },
      answer: choose(r, right, wrong),
      steps: [`A ${thing} is shaped like a ${o.shape}.`, `A ${o.shape} uses ${o.rule}.`, `So the answer is: ${right}.`] }
  }),
  lv('two shapes: add the pieces', r => {
    if (r() < 0.5) {
      const rad = pick(r, [3, 6]), h = int(r, 2, 12), X = pi3(rad * rad * h), B = ballR(rad), half = clean(B / 2), T = clean(X + half)
      return { text: `An ice-cream cone has a radius of ${rad} cm and a height of ${h} cm. Half a ball of ice cream with a radius of ${rad} cm sits on top. How many cubic centimeters is that in all? Use π ≈ 3.14.`,
        picture: cone(`${rad} cm`, `${h} cm`), answer: T,
        steps: [`The cone: 1/3 × 3.14 × ${rad} × ${rad} × ${h} = ${fmt(X)}.`, `The half ball: 4/3 × 3.14 × ${rad} × ${rad} × ${rad} = ${fmt(B)}, and half of that is ${fmt(half)}.`, `Add them: ${fmt(X)} + ${fmt(half)}. So ${fmt(T)} cubic centimeters in all.`] }
    }
    const { u, cu } = pick(r, BIG), rad = pick(r, [3, 6, 9]), h = int(r, 5, 20), X = pi(rad * rad * h), B = ballR(rad), half = clean(B / 2), T = clean(X + half)
    return { text: `A farm silo is a cylinder with a radius of ${rad} ${u} and a height of ${h} ${u}, with half a ball of radius ${rad} ${u} on top. How many ${cu} of grain can it hold? Use π ≈ 3.14.`,
      picture: cyl(`${rad} ${u}`, `${h} ${u}`), answer: T,
      steps: [`The cylinder: 3.14 × ${rad} × ${rad} × ${h} = ${fmt(X)}.`, `The half ball: 4/3 × 3.14 × ${rad} × ${rad} × ${rad} = ${fmt(B)}, and half of that is ${fmt(half)}.`, `Add them: ${fmt(X)} + ${fmt(half)}. So it can hold ${fmt(T)} ${cu} of grain.`] }
  }),
  lv('compare two shapes: which holds more', r => {
    const { u, cu } = pick(r, SMALL), same = 'they hold the same'
    if (r() < 0.5) {
      const r1 = int(r, 2, 6), h1 = int(r, 2, 12), r2 = pick(r, [3, 6]), X = pi(r1 * r1 * h1), Y = ballR(r2)
      const right = X === Y ? same : X > Y ? 'the can' : 'the ball'
      return { text: `A can has a radius of ${r1} ${u} and a height of ${h1} ${u}. A ball has a radius of ${r2} ${u}. Which holds more? Use π ≈ 3.14.`,
        picture: { kind: 'table', head: ['', 'radius', 'height'], rows: [['can', `${r1} ${u}`, `${h1} ${u}`], ['ball', `${r2} ${u}`, '']], rowHead: true },
        answer: choose(r, right, ['the can', 'the ball', same].filter(c => c !== right)),
        steps: [`The can: 3.14 × ${r1} × ${r1} × ${h1} = ${fmt(X)} ${cu}.`, `The ball: 4/3 × 3.14 × ${r2} × ${r2} × ${r2} = ${fmt(Y)} ${cu}.`, compareLine('the can', X, 'the ball', Y, cu)] }
    }
    const rad = pick(r, [3, 6]), h = int(r, 2, 6), H = r() < 0.4 ? 3 * h : int(r, 2, 20)
    const X = pi3(rad * rad * H), Y = pi(rad * rad * h), right = X === Y ? same : X > Y ? 'the funnel' : 'the can'
    return { text: `A funnel is a cone with a radius of ${rad} ${u} and a height of ${H} ${u}. A can has a radius of ${rad} ${u} and a height of ${h} ${u}. Which holds more? Use π ≈ 3.14.`,
      picture: { kind: 'table', head: ['', 'radius', 'height'], rows: [['funnel (cone)', `${rad} ${u}`, `${H} ${u}`], ['can', `${rad} ${u}`, `${h} ${u}`]], rowHead: true },
      answer: choose(r, right, ['the funnel', 'the can', same].filter(c => c !== right)),
      steps: [`The funnel: 1/3 × 3.14 × ${rad} × ${rad} × ${H} = ${fmt(X)} ${cu}.`, `The can: 3.14 × ${rad} × ${rad} × ${h} = ${fmt(Y)} ${cu}.`, compareLine('the funnel', X, 'the can', Y, cu)] }
  }),
  lv('take away: the space left around a shape', r => {
    const { u, cu } = pick(r, UNITS)
    if (r() < 0.5) {
      const rad = pick(r, [3, 6, 9]), s = 2 * rad, box = s ** 3, B = ballR(rad), ans = clean(box - B)
      return { text: `A ball with a radius of ${rad} ${u} fits exactly inside a box that is ${s} ${u} long, ${s} ${u} wide and ${s} ${u} tall. How many ${cu} of the box are empty space? Use π ≈ 3.14.`,
        picture: { kind: 'solid', shape: 'prism', labels: { l: `${s} ${u}`, w: `${s} ${u}`, h: `${s} ${u}` } }, answer: ans,
        steps: [`The box: ${s} × ${s} × ${s} = ${fmt(box)} ${cu}.`, `The ball: 4/3 × 3.14 × ${rad} × ${rad} × ${rad} = ${fmt(B)} ${cu}.`, `Take the ball away from the box: ${fmt(box)} − ${fmt(B)}. So ${fmt(ans)} ${cu} are empty.`] }
    }
    const { rad, h } = coneDims(r, 2, 8, 3, 15), C = pi(rad * rad * h), V = pi3(rad * rad * h), ans = clean(C - V)
    return { text: `A block of clay is a cylinder with a radius of ${rad} ${u} and a height of ${h} ${u}. A cone with the same bottom and height is dug out of it. How many ${cu} of clay are left? Use π ≈ 3.14.`,
      picture: cyl(`${rad} ${u}`, `${h} ${u}`), answer: ans,
      steps: [`The cylinder: 3.14 × ${rad} × ${rad} × ${h} = ${fmt(C)} ${cu}.`, `The cone is 1/3 of it: ${fmt(C)} ÷ 3 = ${fmt(V)} ${cu}.`, `Take the cone away: ${fmt(C)} − ${fmt(V)}. So ${fmt(ans)} ${cu} of clay are left.`] }
  }),
  lv('work backwards: the silo height from what it holds', r => {
    const { u, w, cu } = pick(r, BIG), rad = pick(r, [3, 6, 9]), h = int(r, 2, 20)
    const B = ballR(rad), half = clean(B / 2), A = pi(rad * rad), C = pi(rad * rad * h), T = clean(C + half)
    return { text: `A farm silo is a cylinder with half a ball on top. Both have a radius of ${rad} ${u}. The silo holds ${fmt(T)} ${cu} in all. How tall is the cylinder part, in ${w}? Use π ≈ 3.14.`,
      picture: cyl(`${rad} ${u}`, '?'), answer: h,
      steps: [`The half ball: 4/3 × 3.14 × ${rad} × ${rad} × ${rad} = ${fmt(B)}, and half of that is ${fmt(half)}.`, `The cylinder holds ${fmt(T)} − ${fmt(half)} = ${fmt(C)}. Its circle is 3.14 × ${rad} × ${rad} = ${fmt(A)}, so ${fmt(C)} ÷ ${fmt(A)}.`, `So the cylinder part is ${h} ${w} tall.`] }
  }),
]

export const G8M5_LADDERS: Record<string, Level[]> = {
  'g8m5-t1': T1,
  'g8m5-t2': T2,
  'g8m5-t3': T3,
  'g8m5-t4': T4,
}
