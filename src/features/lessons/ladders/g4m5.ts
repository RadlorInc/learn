/**
 * Grade 4 · Module 5 — Angle measurements and plane figures. Practice ladders, easiest style first (see ../adaptive.ts
 * and the reference ladders in ./g5m1.ts).
 * ⚠️ Two picture traps this module has:
 *   - an `angle` split into `parts` prints each part's degrees unless `partLabels` says otherwise, so every split angle
 *     here passes its labels written out, and a missing part is always '?'.
 *   - protractor readings stay off the printed big numbers (0, 30, 60 … 180), so the child counts small marks.
 * ⚠️ Four-sided shapes: a rectangle is also a parallelogram and a square is also a rectangle, so no choice list here ever
 * holds two names that both fit the shape drawn (no squares with rectangle/rhombus choices, no parallelogram choice next
 * to a rectangle or a rhombus).
 */
import type { Picture } from '../script'
import { int, pick, shuffle, type Level, type Rng } from '../adaptive'

type Pt = [number, number]
const rd = (v: number) => Math.round(v * 100) / 100
const eq = (text: string, lines?: string[]): Picture => ({ kind: 'eq', text, lines })
const choose = (r: Rng, right: string, wrong: string[]) => {
  const choices = shuffle(r, [right, ...wrong])
  return { choices, correct: choices.indexOf(right) }
}
const art = (s: string) => `${/^[aeiou]/.test(s) ? 'an' : 'a'} ${s}`
const NAMES = ['Leo', 'Mia', 'Sam', 'Ava', 'Kai', 'Nina', 'Ben', 'Zoe']
const YES_NO = ['yes', 'no']
const ALL4 = [0, 1, 2, 3]
/** A point `len` along a ray at `deg` from the bottom ray. */
const at = (deg: number, len: number): Pt => [rd(len * Math.cos((deg * Math.PI) / 180)), rd(len * Math.sin((deg * Math.PI) / 180))]
const rot = (p: Pt, deg: number): Pt => {
  const c = Math.cos((deg * Math.PI) / 180), s = Math.sin((deg * Math.PI) / 180)
  return [rd(p[0] * c - p[1] * s), rd(p[0] * s + p[1] * c)]
}

// ── t1 · Points, lines and rays ─────────────────────────────────────────────────────────────────────────────
const ENDS = ['line', 'ray', 'line segment'] as const
type End = (typeof ENDS)[number]
type Seg = { a: Pt; b: Pt; dots?: boolean; arrow?: 'end' | 'both' }
const path = (k: End, a: Pt, b: Pt): Seg[] =>
  k === 'line segment' ? [{ a, b, dots: true }] : k === 'ray' ? [{ a, b: a, dots: true }, { a, b, arrow: 'end' as const }] : [{ a, b, arrow: 'both' as const }]
const endSteps = (k: End) =>
  k === 'line segment' ? ['Both ends have a dot.', 'So it stops at both ends.', 'So it is a line segment.']
    : k === 'ray' ? ['One end has a dot, so it starts there.', 'The other end has an arrow, so it keeps going forever.', 'So it is a ray.']
      : ['Both ends have arrows.', 'It goes on forever both ways.', 'So it is a line.']
const endChoices = (r: Rng, k: End) => choose(r, k, ENDS.filter(e => e !== k))

const T1: Level[] = [
  { style: 'name it by its ends', make: r => {
    const k = pick(r, ENDS)
    return { text: 'Look at the ends. What is this?', picture: { kind: 'poly', shapes: [], segs: path(k, [0, 0], [int(r, 4, 7), 0]) },
      answer: endChoices(r, k), steps: endSteps(k) }
  } },
  { style: 'find the one that is named', make: r => {
    const want = pick(r, ENDS), order = shuffle(r, ENDS), letters = ['A', 'B', 'C']
    const segs = order.flatMap((k, i) => (r() < 0.5 ? path(k, [0, 4 - 2 * i], [6, 4 - 2 * i]) : path(k, [6, 4 - 2 * i], [0, 4 - 2 * i])))
    const at_ = order.indexOf(want), right = `path ${letters[at_]}`
    return { text: `Look at the ends of every path. Which path is ${art(want)}?`,
      picture: { kind: 'poly', shapes: [], segs, labels: letters.map((t, i) => ({ at: [-1, 4 - 2 * i] as Pt, text: t })) },
      answer: { choices: letters.map(t => `path ${t}`), correct: at_ },
      steps: [`${want === 'ray' ? 'A ray has a dot at one end and an arrow at the other.' : want === 'line' ? 'A line has arrows at both ends.' : 'A line segment has dots at both ends.'}`, `Path ${letters[at_]} is the only one like that.`, `So the answer is ${right}.`] }
  } },
  { style: 'spot the mistake: long or short is not the name', make: r => {
    const name = pick(r, NAMES), top = pick(r, ENDS.filter(e => e !== 'line segment')), bottom = pick(r, ENDS.filter(e => e !== 'line'))
    const short = r() < 0.5
    const actual = short ? top : bottom, claim: End = short ? 'line segment' : 'line'
    const other = ENDS.find(e => e !== actual && e !== claim)!
    const right = `No, it is ${art(actual)}`
    return { text: `${name} says the ${short ? 'short path is a line segment, because it is so short' : 'long path is a line, because it is so long'}. Which is true?`,
      picture: { kind: 'poly', shapes: [], segs: [...path(top, [0, 2], [2, 2]), ...path(bottom, [0, 0], [7, 0])] },
      answer: choose(r, right, [`${name} is right`, `No, it is ${art(other)}`]),
      steps: ["Don't go by how long a path looks. Look at its ends.", endSteps(actual).slice(0, 2).join(' '), `So the answer is: ${right}.`] }
  } },
  { style: 'count the rays among other paths', make: r => {
    const n = int(r, 3, 6), rays = int(r, 1, n)
    const dirs = shuffle(r, [0, 60, 120, 180, 240, 300]).slice(0, n)
    const segs = dirs.map((d, i) => ({ a: [0, 0] as Pt, b: at(d, 4), ...(i < rays ? { arrow: 'end' as const } : { dots: true }) }))
    return { text: 'Every path starts at the middle dot. How many of them are rays?', picture: { kind: 'poly', shapes: [], segs: [{ a: [0, 0], b: [0, 0], dots: true }, ...segs] },
      answer: rays,
      steps: ['A path that ends in an arrow keeps going, so it is a ray.', 'A path that ends in a dot stops, so it is a line segment. Count only the arrows.', `So ${rays} of them ${rays === 1 ? 'is a ray' : 'are rays'}.`] }
  } },
  { style: 'story: choose the drawing from the words', make: r => {
    const [k, story, why] = pick(r, [
      ['ray', 'A flashlight beam starts at the flashlight and shines on and on, forever.', ['It starts at the flashlight, so that end gets a dot.', 'It goes on forever the other way, so that end gets an arrow.']],
      ['ray', 'A laser starts at a laser pen and goes on forever in one direction.', ['It starts at the pen, so that end gets a dot.', 'It goes on forever the other way, so that end gets an arrow.']],
      ['line segment', 'A jump rope is stretched tight from Mia\'s hand to Leo\'s hand.', ['It starts at Mia\'s hand, so that end gets a dot.', 'It stops at Leo\'s hand, so that end gets a dot too.']],
      ['line segment', 'A fence runs from the gate to the big tree and stops there.', ['It starts at the gate, so that end gets a dot.', 'It stops at the tree, so that end gets a dot too.']],
      ['line', 'A magic road has no start and no end. It goes on forever both ways.', ['It has no start, so one end gets an arrow.', 'It has no end, so the other end gets an arrow too.']],
    ] as const)
    return { text: `${story} Which should you draw for it?`,
      picture: { kind: 'poly', shapes: [], segs: [{ a: [0, 0], b: [6, 0] }], labels: [{ at: [0, 0.8], text: '?' }, { at: [6, 0.8], text: '?' }] },
      answer: endChoices(r, k), steps: [...why, `So you draw ${art(k)}.`] }
  } },
]

// ── t2 · Right, acute or obtuse? ────────────────────────────────────────────────────────────────────────────
const OPEN = ['acute', 'right', 'obtuse'] as const
type Open = (typeof OPEN)[number]
const kindOf = (d: number): Open => (d < 90 ? 'acute' : d === 90 ? 'right' : 'obtuse')
const openSteps = (d: number) =>
  d === 90 ? ['The little square in the corner shows a square corner.', 'The angle is exactly the same as a square corner.', 'So the angle is right.']
    : ['Picture a square corner at the point.', `The rays open ${d < 90 ? 'less than' : 'wider than'} a square corner.`, `So the angle is ${kindOf(d)}.`]
const openChoices = (r: Rng, k: Open) => choose(r, k, OPEN.filter(o => o !== k))

const T2: Level[] = [
  { style: 'sort a clear angle', make: r => {
    const d = pick(r, [20, 30, 40, 50, 60, 90, 120, 130, 140, 150, 160])
    return { text: 'Is this angle acute, right or obtuse?', picture: { kind: 'angle', deg: d }, answer: openChoices(r, kindOf(d)), steps: openSteps(d) }
  } },
  { style: 'close to a square corner', make: r => {
    const d = pick(r, [70, 75, 80, 85, 90, 95, 100, 105, 110])
    const steps = d === 90 ? openSteps(d) : ['There is no little square, so it is not a square corner.', `The rays open a little ${d < 90 ? 'less' : 'more'} than a square corner.`, `So the angle is ${kindOf(d)}.`]
    return { text: 'This one is close. Look carefully. Is this angle acute, right or obtuse?', picture: { kind: 'angle', deg: d }, answer: openChoices(r, kindOf(d)), steps }
  } },
  { style: 'story', make: r => {
    const d = pick(r, [30, 40, 50, 60, 90, 110, 120, 130, 140, 150])
    const [what, where] = pick(r, [
      ['Mia opens her laptop this far. Is the angle between the screen and the keyboard', 'where the screen meets the keyboard'],
      ['A door is open this far. Is the angle between the door and the wall', 'where the door meets the wall'],
      ['Sam opens his scissors this far. Is the angle between the blades', 'where the blades meet'],
      ['The hands of a clock make this angle. Is it', 'where the hands meet'],
    ] as const)
    const steps = d === 90 ? ['The little square shows a square corner.', `The angle ${where} is exactly a square corner.`, 'So the angle is right.']
      : [`Picture a square corner ${where}.`, `It opens ${d < 90 ? 'less than' : 'wider than'} a square corner.`, `So the angle is ${kindOf(d)}.`]
    return { text: `${what} acute, right or obtuse?`, picture: { kind: 'angle', deg: d }, answer: openChoices(r, kindOf(d)), steps }
  } },
  { style: 'spot the mistake: long rays', make: r => {
    const name = pick(r, NAMES)
    const [d, claim, len] = pick(r, [
      [pick(r, [30, 40, 50, 60]), 'obtuse', 'long'], [pick(r, [120, 130, 140, 150]), 'acute', 'short'], [90, 'obtuse', 'long'], [90, 'acute', 'short'],
    ] as const)
    const actual = kindOf(d), other = OPEN.find(o => o !== actual && o !== claim)!
    const right = `No, it is ${art(actual)} angle`
    return { text: `${name} says this angle is ${art(claim)} angle, because its rays are so ${len}. Which is true?`, picture: { kind: 'angle', deg: d },
      answer: choose(r, right, [`${name} is right`, `No, it is ${art(other)} angle`]),
      steps: ['Long or short rays do not change an angle. Look at the opening.', openSteps(d).slice(0, 2).join(' '), `So the answer is: ${right}.`] }
  } },
  { style: 'reason about the parts of an angle', make: r => {
    const v = int(r, 0, 2)
    if (v === 0) {
      const x = pick(r, [30, 40, 50, 60])
      return { text: 'The whole angle is a square corner, cut into two parts. Is the part along the bottom ray acute, right or obtuse?',
        picture: { kind: 'angle', deg: 90, parts: [x, 90 - x], partLabels: [null, null] }, answer: openChoices(r, 'acute'),
        steps: ['The whole angle is a square corner.', 'The part along the bottom ray is only a piece of it, so it opens less than a square corner.', 'So that part is acute.'] }
    }
    if (v === 1) {
      const x = pick(r, [20, 30, 40, 50, 60])
      return { text: 'The part along the bottom ray is a whole square corner, and there is more on top. Is the whole angle acute, right or obtuse?',
        picture: { kind: 'angle', deg: 90 + x, parts: [90, x], partLabels: [null, null] }, answer: openChoices(r, 'obtuse'),
        steps: ['The bottom part is already a whole square corner.', 'The other part adds some extra on top, so the whole opens wider than a square corner.', 'So the whole angle is obtuse.'] }
    }
    const x = pick(r, [30, 40, 50, 60])
    return { text: 'These two parts fit together to fill a square corner exactly. Is the whole angle acute, right or obtuse?',
      picture: { kind: 'angle', deg: 90, parts: [x, 90 - x], partLabels: [null, null] }, answer: openChoices(r, 'right'),
      steps: ['The two parts fill a square corner with no gap and nothing sticking out.', 'So the whole angle is exactly a square corner.', 'So the whole angle is right.'] }
  } },
]

// ── t3 · Measure an angle in degrees ────────────────────────────────────────────────────────────────────────
/** Readings off the big numbers, so the protractor never prints the answer. */
const READ = [10, 20, 40, 50, 70, 80, 100, 110, 130, 140, 160, 170]
const marks = (k: number) => (k === 1 ? 'one small mark' : 'two small marks')
const readSteps = (d: number) => {
  const base = Math.floor(d / 30) * 30, k = (d - base) / 10
  return base === 0
    ? ['Start at the 0 on the bottom ray.', `Count the small marks up to the other ray: ${k === 1 ? '10' : '10, 20'}.`, `So the angle is ${d}°.`]
    : ['The bottom ray sits on 0.', `The other ray is ${marks(k)} past the ${base}.`, `${base} + ${k * 10} = ${d}, so the angle is ${d}°.`]
}
const near = (d: number) => (d === 170 ? 160 : d === 10 ? 20 : d + 10)

const T3: Level[] = [
  { style: 'count on from a big number', make: r => {
    const base = pick(r, [30, 60, 90, 120, 150]), k = base === 150 ? 1 : int(r, 1, 2), d = base + 10 * k
    return { text: `On a protractor, the other ray is ${marks(k)} past the ${base}. Each small mark is 10 more. How many degrees is the angle?`,
      picture: eq(`start at ${base}`, [k === 1 ? '+ 1 small mark' : '+ 2 small marks']), answer: d,
      steps: [`Start at ${base}.`, `Count on by 10s: ${k === 1 ? d : `${base + 10}, ${d}`}.`, `So the angle is ${d}°.`] }
  } },
  { style: 'read the protractor', make: r => {
    const d = pick(r, READ)
    return { text: 'The angle is drawn on a protractor. How many degrees is it?', picture: { kind: 'angle', deg: d, protractor: true }, answer: d, steps: readSteps(d) }
  } },
  { style: 'no protractor: narrow or wide picks the measure', make: r => {
    const d = pick(r, [20, 30, 40, 50, 60, 120, 130, 140, 150, 160])
    const right = `${d}°`
    return { text: 'There is no protractor this time. Is the angle narrower or wider than a square corner? Use that to pick its measure.',
      picture: { kind: 'angle', deg: d }, answer: choose(r, right, [`${180 - d}°`, '90°']),
      steps: ['A square corner is 90°.', `This angle opens ${d < 90 ? 'less' : 'more'} than a square corner, so it is ${d < 90 ? 'less' : 'more'} than 90°.`, `Of the choices, only ${right} is ${d < 90 ? 'less' : 'more'} than 90°, so it is ${right}.`] }
  } },
  { style: 'spot the mistake: counted from the far end', make: r => {
    const d = pick(r, READ), name = pick(r, NAMES)
    const right = `${name} counted from the far end. It is ${d}°.`
    return { text: `${name} says this angle is ${180 - d}°. Which is true?`, picture: { kind: 'angle', deg: d, protractor: true },
      answer: choose(r, right, [`${name} is right. It is ${180 - d}°.`, `${name} counted from the far end. It is ${near(d)}°.`]),
      steps: ['A protractor has two sets of numbers. Start at the 0 that sits on the bottom ray.', readSteps(d).slice(1).join(' '), `So: ${right}`] }
  } },
  { style: 'two-step story: read it, then it moves', make: r => {
    let d = 0, c = 0, up = true, n = 0
    do { d = pick(r, READ); c = pick(r, [10, 20, 30, 40]); up = r() < 0.5; n = up ? d + c : d - c } while (n < 10 || n > 170 || n % 30 === 0)
    const [thing, verbUp, verbDown, open] = pick(r, [
      ['drawbridge', 'opens', 'closes', 'open'], ['ramp', 'is lifted', 'is lowered', 'tilted up'], ['book cover', 'opens', 'closes', 'open'],
    ] as const)
    return { text: `A ${thing} is ${open} this far. Then it ${up ? verbUp : verbDown} ${c}°${up ? ' more' : ''}. How many degrees is it ${open} now?`,
      picture: { kind: 'angle', deg: d, protractor: true }, answer: n,
      steps: [`Read the protractor first: the ${thing} is ${open} ${d}°.`, up ? `It ${verbUp} ${c}° more, so add: ${d} + ${c} = ${n}.` : `It ${verbDown} ${c}°, so take away: ${d} − ${c} = ${n}.`, `So it is ${open} ${n}° now.`] }
  } },
]

// ── t4 · Angles add up ──────────────────────────────────────────────────────────────────────────────────────
/** The lesson's split angle: shaded parts side by side. Every label is written out, because a part with no label draws its own degrees. */
const fan = (parts: number[], labels: (string | null)[]): Picture => ({ kind: 'angle', deg: parts.reduce((x, y) => x + y, 0), parts, partLabels: labels })
const deg5 = (r: Rng, lo: number, hi: number) => 5 * int(r, lo / 5, hi / 5)
const wholeWords = (w: number) => (w === 90 ? 'a right angle, 90°' : 'a straight line, 180°')

const T4: Level[] = [
  { style: 'find the whole: add the labelled parts', make: r => {
    const a = deg5(r, 25, 85), b = deg5(r, 25, 85), w = a + b
    return { text: 'Two angles sit side by side. How many degrees is the whole angle?', picture: fan([a, b], [`${a}°`, `${b}°`]), answer: w,
      steps: ['The parts add up to the whole.', `Add them: ${a} + ${b} = ${w}.`, `So the whole angle is ${w}°.`] }
  } },
  { style: 'missing part of a right angle', make: r => {
    let k = 0
    do k = deg5(r, 25, 65); while (k === 45)
    const x = 90 - k, first = r() < 0.5
    return { text: `The whole angle is a right angle, 90°. One part is ${k}°. How many degrees is the other part?`,
      picture: first ? fan([k, x], [`${k}°`, '?']) : fan([x, k], ['?', `${k}°`]), answer: x,
      steps: ['The two parts add up to the whole, 90°.', `Take away the part you know: 90 − ${k} = ${x}.`, `So the other part is ${x}°.`] }
  } },
  { style: 'spot the mistake: added the part onto the whole', make: r => {
    const w = pick(r, [90, 180])
    let k = 0
    do k = w === 90 ? deg5(r, 25, 65) : deg5(r, 30, 150); while (2 * k === w)
    // The '?' part is drawn at its true size, so a wrong choice sits 10° from it: the eye cannot tell them apart.
    const x = w - k, name = pick(r, NAMES), right = `${x}°: take ${k} away from ${w}`, slip = x + pick(r, x + 10 < w ? [10, -10] : [-10])
    return { text: `The whole angle is ${wholeWords(w)}. One part is ${k}°. ${name} says the other part is ${w + k}°. What is the other part?`,
      picture: fan([k, x], [`${k}°`, '?']),
      answer: choose(r, right, [`${w + k}°: add ${k} onto ${w}`, `${slip}°: take ${k} away from ${w}`]),
      steps: ['The part is already inside the whole, so adding makes the answer bigger than the whole.', `Take it away instead: ${w} − ${k} = ${x}.`, `So the answer is ${right}.`] }
  } },
  { style: 'three parts, one missing', make: r => {
    let w = 0, a = 0, b = 0, c = 0
    do { w = pick(r, [90, 180]); a = deg5(r, 20, w === 90 ? 40 : 80); b = deg5(r, 20, w === 90 ? 40 : 80); c = w - a - b } while (c < 20 || c === a || c === b)
    const miss = int(r, 0, 2), parts = [a, b, c], order = [...parts.slice(0, miss), c, ...parts.slice(miss, 2)]
    return { text: `The three parts make ${wholeWords(w)}. How many degrees is the part marked with a question mark?`,
      picture: fan(order, order.map((d, i) => (i === miss ? '?' : `${d}°`))), answer: c,
      steps: [`The three parts add up to ${w}°.`, `Add the parts you know: ${a} + ${b} = ${a + b}. Take that away: ${w} − ${a + b} = ${c}.`, `So the missing part is ${c}°.`] }
  } },
  { style: 'two-step story', make: r => {
    if (r() < 0.5) {
      let a = 0, b = 0, c = 0
      do { a = deg5(r, 30, 80); b = deg5(r, 30, 80); c = 180 - a - b } while (c < 20)
      const s = a + b
      return { text: `A sprinkler sprays across a straight edge of lawn, 180° from one end to the other. First it turns ${a}°. Then it turns ${b}° more. How many more degrees does it turn to reach the other end?`,
        picture: fan([a, b, c], ['first', 'then', '?']), answer: c,
        steps: [`First add the turns: ${a} + ${b} = ${s}.`, `The whole edge is 180°, so take that away: 180 − ${s} = ${c}.`, `So it turns ${c}° more.`] }
    }
    const a = deg5(r, 25, 60), b = deg5(r, 25, 60), c = deg5(r, 25, 55), w = a + b + c, name = pick(r, NAMES)
    return { text: `${name} opens a paper fan. The first part opens ${a}°, the next ${b}°, and the last ${c}°. How many degrees is the whole fan open?`,
      picture: fan([a, b, c], [null, null, null]), answer: w,
      steps: ['The parts add up to the whole angle.', `${a} + ${b} = ${a + b}, and ${a + b} + ${c} = ${w}.`, `So the fan is open ${w}°.`] }
  } },
]

// ── t5 · Parallel and perpendicular lines ───────────────────────────────────────────────────────────────────
const PAIR = ['parallel', 'perpendicular', 'neither'] as const
type Pair = (typeof PAIR)[number] | 'narrowing'
const line = (a: Pt, b: Pt, label?: string) => ({ a, b, arrow: 'both' as const, ...(label ? { label } : {}) })
/** Two lines of a kind, turned by t degrees. */
const pairPic = (r: Rng, k: Pair, t: number): Picture => {
  const R = (p: Pt) => rot(p, t)
  if (k === 'parallel') { const g = pick(r, [1.2, 1.6, 2]); return { kind: 'poly', shapes: [], segs: [line(R([-3, 0]), R([3, 0])), line(R([-3, g]), R([3, g]))] } }
  if (k === 'narrowing') { const g = pick(r, [0.6, 0.9]); return { kind: 'poly', shapes: [], segs: [line(R([-3, 0]), R([3, g])), line(R([-3, 3]), R([3, 3 - g]))] } }
  if (k === 'perpendicular') {
    const x = pick(r, [-1, 0, 1])
    return { kind: 'poly', shapes: [{ pts: [R([x + 0.6, 0]), R([x, 0]), R([x, 0.6])], open: true, right: [1] }], segs: [line(R([-3, 0]), R([3, 0])), line(R([x, -2.5]), R([x, 2.5]))] }
  }
  const p = pick(r, [35, 50, 130, 145])
  return { kind: 'poly', shapes: [], segs: [line(R([-3, 0]), R([3, 0])), line(R(at(p + 180, 3)), R(at(p, 3)))] }
}
const pairSteps = (k: Pair) =>
  k === 'parallel' ? ['The lines do not cross.', 'The gap between them is the same the whole way.', 'So the lines are parallel.']
    : k === 'perpendicular' ? ['The lines cross.', 'The little square shows they cross at a square corner.', 'So the lines are perpendicular.']
      : k === 'narrowing' ? ['The gap is wider at one end and narrower at the other, so they would meet farther along.', 'They would not meet at a square corner either.', 'So the answer is neither.']
        : ['The lines cross, so they are not parallel.', 'There is no little square, so they do not cross at a square corner.', 'So the answer is neither.']
const named = (k: Pair) => (k === 'narrowing' ? 'neither' : k)
const pairChoices = (r: Rng, k: Pair) => choose(r, named(k), PAIR.filter(p => p !== named(k)))
const PAIR_Q = 'Are these lines parallel, perpendicular or neither?'

const T5: Level[] = [
  { style: 'straight-on lines', make: r => {
    const k = pick(r, ['parallel', 'perpendicular', 'neither'] as const)
    return { text: PAIR_Q, picture: pairPic(r, k, 0), answer: pairChoices(r, k), steps: pairSteps(k) }
  } },
  { style: 'measure the gap at both ends', make: r => {
    const g1 = int(r, 2, 5), same = r() < 0.5, g2 = same ? g1 : g1 + pick(r, [-1, 1].filter(d => g1 + d >= 2 && g1 + d <= 5)), t = pick(r, [0, 20, -25, 35])
    const u = 0.6, R = (p: Pt) => rot(p, t)
    const picture: Picture = { kind: 'poly', shapes: [], segs: [
      line(R([-3.5, 0]), R([3.5, 0])), line(R([-3.5, (g1 - (g2 - g1) / 5) * u]), R([3.5, (g2 + (g2 - g1) / 5) * u])),
      { a: R([-2.5, 0]), b: R([-2.5, g1 * u]), dashed: true, tone: 2 as const, label: `${g1} cm` }, { a: R([2.5, 0]), b: R([2.5, g2 * u]), dashed: true, tone: 2 as const, label: `${g2} cm` },
    ] }
    return { text: 'The gap between these lines is measured near both ends. Are the lines parallel?', picture, answer: { choices: YES_NO, correct: same ? 0 : 1 },
      steps: same ? [`The gap is ${g1} cm at one end and ${g2} cm at the other.`, 'The gap stays the same, so the lines never meet.', 'Parallel lines keep the same gap, so the answer is yes.']
        : [`The gap is ${g1} cm at one end and ${g2} cm at the other.`, 'The gap changes, so the lines would meet farther along.', 'Parallel lines keep the same gap, so the answer is no.'] }
  } },
  { style: 'spot the mistake', make: r => {
    const name = pick(r, NAMES)
    const [k, claim, because] = pick(r, [
      ['narrowing', 'parallel', 'they do not touch'], ['neither', 'perpendicular', 'they cross'], ['perpendicular', 'neither', 'they cross'], ['parallel', 'neither', 'they never cross'],
    ] as const)
    const actual = named(k), say = (p: string) => (p === 'neither' ? 'neither parallel nor perpendicular' : p)
    const other = PAIR.find(p => p !== actual && p !== claim)!, right = `No, they are ${say(actual)}`
    return { text: `${name} says these lines are ${say(claim)}, because ${because}. Which is true?`, picture: pairPic(r, k, pick(r, [0, 20, -35])),
      answer: choose(r, right, [`${name} is right`, `No, they are ${say(other)}`]),
      steps: [...pairSteps(k).slice(0, 2), `So the answer is: ${right}.`] }
  } },
  { style: 'a street map: which two streets', make: r => {
    const [A, B, C] = shuffle(r, ['Oak St', 'Elm St', 'Pine St', 'Main St', 'Park Ave']).slice(0, 3)
    const t = pick(r, [0, 15, -20]), R = (p: Pt) => rot(p, t)
    if (r() < 0.5) {
      return { text: 'Here is a map of three streets. Which two streets are parallel?',
        picture: { kind: 'poly', shapes: [], segs: [line(R([-4, 0]), R([4, 0]), A), line(R([-4, 2.2]), R([4, 2.2]), B), line(R([-3.5, -1.5]), R([-0.5, 3.7]), C)] },
        answer: choose(r, `${A} and ${B}`, [`${A} and ${C}`, `${B} and ${C}`]),
        steps: [`${A} and ${B} never meet, and the gap between them stays the same.`, `${C} crosses them, so it is not parallel to either one.`, `So the answer is ${A} and ${B}.`] }
    }
    return { text: 'Here is a map of three streets. Which two streets are perpendicular?',
      picture: { kind: 'poly', shapes: [{ pts: [R([-1.4, 0]), R([-2, 0]), R([-2, 0.6])], open: true, right: [1] }],
        segs: [line(R([-4, 0]), R([6, 0]), A), line(R([-2, -1]), R([-2, 4]), C), line(R([1.2, -1.06]), R([5.5, 3.8]), B)] },
      answer: choose(r, `${A} and ${C}`, [`${A} and ${B}`, `${B} and ${C}`]),
      steps: [`${A} and ${C} cross, and the little square shows a square corner.`, `${B} crosses at a slant, with no square corner.`, `So the answer is ${A} and ${C}.`] }
  } },
  { style: 'two sides of a shape', make: r => {
    const w = int(r, 5, 7), h = int(r, 2, 3), names = ['A', 'B', 'C', 'D']
    if (r() < 0.5) {
      const top = int(r, 2, w - 2)
      const pic: Picture = { kind: 'poly', shapes: [{ pts: [[0, 0], [w, 0], [top, h], [0, h]], names, right: [0, 3], tone: 1 }] }
      const [p, q, k, v] = pick(r, [['AB', 'DC', 'parallel', ''], ['AB', 'AD', 'perpendicular', 'A'], ['AB', 'BC', 'neither', 'B']] as const)
      return { text: `Look at side ${p} and side ${q}. Are they parallel, perpendicular or neither?`, picture: pic, answer: choose(r, k, PAIR.filter(x => x !== k)),
        steps: k === 'parallel' ? [`Side ${p} and side ${q} never meet.`, 'The gap between them stays the same.', 'So they are parallel.']
          : k === 'perpendicular' ? [`Side ${p} and side ${q} meet at corner ${v}.`, 'The little square shows a square corner.', 'So they are perpendicular.']
            : [`Side ${p} and side ${q} meet at corner ${v}, so they are not parallel.`, 'There is no little square there, so it is not a square corner.', 'So the answer is neither.'] }
    }
    const dx = int(r, 1, 2)
    const pic: Picture = { kind: 'poly', shapes: [{ pts: [[0, 0], [w, 0], [w + dx, h], [dx, h]], names, tone: 2 }] }
    const [p, q, k, v] = pick(r, [['AB', 'DC', 'parallel', ''], ['AD', 'BC', 'parallel', ''], ['AB', 'AD', 'neither', 'A'], ['BC', 'CD', 'neither', 'C']] as const)
    return { text: `Look at side ${p} and side ${q}. Are they parallel, perpendicular or neither?`, picture: pic, answer: choose(r, k, PAIR.filter(x => x !== k)),
      steps: k === 'parallel' ? [`Side ${p} and side ${q} never meet.`, 'The gap between them stays the same.', 'So they are parallel.']
        : [`Side ${p} and side ${q} meet at corner ${v}, so they are not parallel.`, 'There is no little square there, so it is not a square corner.', 'So the answer is neither.'] }
  } },
]

// ── t6 · Sort triangles ─────────────────────────────────────────────────────────────────────────────────────
const TRI = ['acute triangle', 'right triangle', 'obtuse triangle'] as const
type Tri = (typeof TRI)[number]
/** A triangle on a base of 6 with angle a at the left corner and b at the right (as in the lesson). */
const tri = (a: number, b: number): Pt[] => {
  const ta = Math.tan((a * Math.PI) / 180), tb = Math.tan((b * Math.PI) / 180), x = (6 * tb) / (ta + tb)
  return [[0, 0], [6, 0], [rd(x), rd(x * ta)]]
}
/** Three angles (multiples of 5) of a triangle of kind k, in a random corner order; wide keeps them far from 90°. */
const angles = (r: Rng, k: Tri, wide = false): number[] => {
  let t: number[]
  if (k === 'right triangle') { const x = deg5(r, 25, 65); t = [90, x, 90 - x] }
  else if (k === 'obtuse triangle') { const c = wide ? deg5(r, 115, 140) : deg5(r, 95, 140), a = deg5(r, 15, 180 - c - 15); t = [c, a, 180 - c - a] }
  else { let a = 0, b = 0; do { a = deg5(r, wide ? 50 : 35, wide ? 75 : 85); b = deg5(r, wide ? 50 : 35, wide ? 75 : 85) } while (180 - a - b >= (wide ? 76 : 90) || 180 - a - b < (wide ? 50 : 35)); t = [a, b, 180 - a - b] }
  return shuffle(r, t)
}
const triKind = (t: number[]): Tri => (Math.max(...t) === 90 ? 'right triangle' : Math.max(...t) > 90 ? 'obtuse triangle' : 'acute triangle')
const triPic = (t: number[], labels: boolean, mark = true): Picture => {
  const i90 = t.indexOf(90)
  return { kind: 'poly', shapes: [{ pts: tri(t[0], t[1]), tone: 1, ...(mark && i90 >= 0 ? { right: [i90] } : {}),
    ...(labels ? { angles: t.map(d => (d === 90 && mark ? null : `${d}°`)) } : {}) }] }
}
const triSteps = (t: number[]) => {
  const k = triKind(t), m = Math.max(...t)
  if (k === 'right triangle') return ['The little square shows a right angle.', 'The other two angles are smaller, so the right angle is the biggest.', 'So it is a right triangle.']
  return [`The angles are ${t[0]}°, ${t[1]}° and ${t[2]}°.`, `The biggest is ${m}°, which is ${m > 90 ? 'wider' : 'narrower'} than a right angle.`, `So it is ${art(k)}.`]
}
const triChoices = (r: Rng, k: Tri) => choose(r, k, TRI.filter(x => x !== k))
const TRI_Q = 'Is this an acute triangle, a right triangle or an obtuse triangle?'

const T6: Level[] = [
  { style: 'every angle labelled', make: r => {
    const t = angles(r, pick(r, TRI))
    return { text: `Look at the angles. ${TRI_Q}`, picture: triPic(t, true), answer: triChoices(r, triKind(t)), steps: triSteps(t) }
  } },
  { style: 'no numbers: look at the biggest corner', make: r => {
    const t = angles(r, pick(r, TRI), true), k = triKind(t)
    const steps = k === 'right triangle' ? triSteps(t) : ['Find the biggest corner.', `It opens ${k === 'obtuse triangle' ? 'wider than' : 'less than'} a square corner.`, `So it is ${art(k)}.`]
    return { text: `There are no numbers this time. Look at the biggest corner. ${TRI_Q}`, picture: triPic(t, false), answer: triChoices(r, k), steps }
  } },
  { style: 'story: the angles in words', make: r => {
    const t = angles(r, pick(r, TRI)), k = triKind(t), m = Math.max(...t)
    const thing = pick(r, ['The side of a ramp', 'A sail on a boat', 'A pennant flag', 'The front of a tent', 'A roof beam'])
    return { text: `${thing} is a triangle with angles of ${t[0]}°, ${t[1]}° and ${t[2]}°. Is it an acute triangle, a right triangle or an obtuse triangle?`,
      picture: triPic(t, false, false), answer: triChoices(r, k),
      steps: [`Find the biggest angle: ${m}°.`, m === 90 ? '90° is a right angle.' : `${m}° is ${m > 90 ? 'wider' : 'narrower'} than a right angle, 90°.`, `So it is ${art(k)}.`] }
  } },
  { style: 'spot the mistake: sorted by a small angle', make: r => {
    const k = pick(r, ['right triangle', 'obtuse triangle'] as const), t = angles(r, k), small = Math.min(...t), name = pick(r, NAMES)
    const other = k === 'right triangle' ? 'obtuse triangle' : 'right triangle', right = `No, it is ${art(k)}`
    return { text: `${name} says this is an acute triangle, because it has a ${small}° angle. Which is true?`, picture: triPic(t, true),
      answer: choose(r, right, [`${name} is right`, `No, it is ${art(other)}`]),
      steps: ['Every triangle has narrow angles, so one small angle tells you nothing. Look at the biggest angle.', triSteps(t).slice(0, 2).join(' '), `So the answer is: ${right}.`] }
  } },
  { style: 'pick the triangle from lists of angles', make: r => {
    const want = pick(r, TRI)
    const lists = TRI.map(k => {
      let t: number[]
      if (k === 'obtuse triangle') { const c = deg5(r, 95, 110), a = deg5(r, 25, 180 - c - 25); t = [a, 180 - c - a, c] }
      else if (k === 'acute triangle') { let a = 0, b = 0; do { a = deg5(r, 45, 85); b = deg5(r, 45, 85) } while (180 - a - b < 20 || Math.max(a, b) < 75); t = [a, b, 180 - a - b] }
      else { const x = deg5(r, 25, 65); t = [x, 90 - x, 90] }
      const s = shuffle(r, t)
      return { k, text: `${s[0]}°, ${s[1]}°, ${s[2]}°`, big: Math.max(...s) }
    })
    const right = lists.find(l => l.k === want)!
    return { text: `Each list shows the three angles of a triangle. Which one is ${art(want)}?`, picture: eq('Find the biggest angle in each.'),
      answer: choose(r, right.text, lists.filter(l => l !== right).map(l => l.text)),
      steps: [`The biggest angles are ${lists.map(l => `${l.big}°`).join(', ')}.`,
        want === 'right triangle' ? 'A right triangle has a 90° angle.' : want === 'obtuse triangle' ? 'An obtuse triangle has an angle wider than 90°.' : 'An acute triangle has every angle narrower than 90°.',
        `So the answer is ${right.text}.`] }
  } },
]

// ── t7 · Sort four-sided shapes ─────────────────────────────────────────────────────────────────────────────
type Quad = { pts: Pt[]; kind: 'rectangle' | 'rhombus' | 'parallelogram' | 'trapezoid' | 'none'; pairs: number; w?: number; h?: number }
const rect = (r: Rng): Quad => { let w = 0, h = 0; do { w = int(r, 3, 7); h = int(r, 2, 5) } while (w === h); return { pts: [[0, 0], [w, 0], [w, h], [0, h]], kind: 'rectangle', pairs: 2, w, h } }
const rhombus = (r: Rng): Quad => {
  const [dx, h] = pick(r, [[3, 4], [4, 3]]), m = pick(r, [1, -1])
  return { pts: [[0, 0], [5, 0], [5 + m * dx, h], [m * dx, h]], kind: 'rhombus', pairs: 2 }
}
const para = (r: Rng): Quad => { const b = int(r, 4, 7), dx = pick(r, [1, 2, -1, -2]), h = int(r, 2, 3); return { pts: [[0, 0], [b, 0], [b + dx, h], [dx, h]], kind: 'parallelogram', pairs: 2 } }
const trap = (r: Rng): Quad => { const b = int(r, 6, 8), t = int(r, 2, b - 3), o = pick(r, [1, (b - t) / 2, b - t - 1]), h = int(r, 2, 3); return { pts: [[0, 0], [b, 0], [o + t, h], [o, h]], kind: 'trapezoid', pairs: 1 } }
const none = (r: Rng): Quad => { const b = int(r, 5, 6), h = int(r, 3, 4); return { pts: [[0, 0], [b, 0], [b - 1, h], [1, h - 1]], kind: 'none', pairs: 0 } }
const quadPic = (q: Quad, tone = 2): Picture => ({ kind: 'poly', shapes: [{ pts: q.pts, tone: tone as 1 | 2 | 3 | 4,
  ...(q.kind === 'rectangle' ? { right: ALL4 } : {}), ...(q.kind === 'rhombus' ? { ticks: ALL4 } : {}) }] })
const pairsSteps = (n: number) =>
  n === 2 ? ['The top and bottom run side by side and never meet: that is one pair.', 'The left and right sides do the same: that is a second pair.']
    : n === 1 ? ['The top and bottom run side by side and never meet: that is one pair.', 'The other two sides lean toward each other, so they would meet.']
      : ['The top and bottom get closer at one end, so they would meet.', 'The other two sides lean toward each other, so they would meet too.']

const T7: Level[] = [
  { style: 'count the pairs of parallel sides', make: r => {
    const q = pick(r, [para, trap, none, rect])(r)
    return { text: 'How many pairs of parallel sides does this shape have?', picture: quadPic(q), answer: q.pairs,
      steps: [...pairsSteps(q.pairs), `So it has ${q.pairs} ${q.pairs === 1 ? 'pair' : 'pairs'} of parallel sides.`] }
  } },
  { style: 'parallelogram or trapezoid', make: r => {
    const q = pick(r, [para, trap])(r)
    return { text: 'Count the pairs of parallel sides. Which name fits this shape?', picture: quadPic(q, 3), answer: choose(r, q.kind, ['parallelogram', 'trapezoid', 'rectangle'].filter(x => x !== q.kind)),
      steps: [...pairsSteps(q.pairs), q.pairs === 2 ? 'There are no square corners, so it is a parallelogram.' : 'Only one pair is parallel, so it is a trapezoid.'] }
  } },
  { style: 'use the marks: rectangle or rhombus', make: r => {
    const q = pick(r, [rect, rhombus])(r)
    return { text: 'The little squares show square corners. The little marks show equal sides. Which name fits this shape best?', picture: quadPic(q, 1),
      answer: choose(r, q.kind, ['rectangle', 'rhombus', 'trapezoid'].filter(x => x !== q.kind)),
      steps: ['It has two pairs of parallel sides.',
        q.kind === 'rectangle' ? 'It has 4 square corners, but the sides are not all the same length.' : 'The marks show all 4 sides are the same length, but there are no square corners.',
        `So the best name is ${q.kind}.`] }
  } },
  { style: 'spot the mistake: the wrong name', make: r => {
    const name = pick(r, NAMES), v = int(r, 0, 2)
    if (v === 0) {
      const q = rect(r), right = 'No, it is a rectangle'
      return { text: `${name} says this is a square, because it has 4 square corners. Which is true?`,
        picture: { kind: 'poly', shapes: [{ pts: q.pts, tone: 1, right: ALL4, sides: [`${q.w} ft`, `${q.h} ft`, `${q.w} ft`, `${q.h} ft`] }] },
        answer: choose(r, right, [`${name} is right`, 'No, it is a trapezoid']),
        steps: ['A square needs 4 square corners and 4 sides the same length.', `These sides are ${q.w} feet and ${q.h} feet, so they are not all the same length.`, `So the answer is: ${right}.`] }
    }
    if (v === 1) {
      const q = para(r), right = 'No, it is a parallelogram'
      return { text: `${name} says this is a rhombus, because it leans. Which is true?`, picture: quadPic(q),
        answer: choose(r, right, [`${name} is right`, 'No, it is a trapezoid']),
        steps: ['A rhombus needs all 4 sides the same length, not just a lean.', 'It has two pairs of parallel sides, but no marks show equal sides and the sides are not all the same length.', `So the answer is: ${right}.`] }
    }
    const q = trap(r), right = 'No, it is a trapezoid'
    return { text: `${name} says this is a parallelogram, because its top and bottom are parallel. Which is true?`, picture: quadPic(q, 3),
      answer: choose(r, right, [`${name} is right`, 'No, it is a rhombus']),
      steps: ['A parallelogram needs two pairs of parallel sides.', 'Only the top and bottom are parallel. The other two sides lean toward each other.', `So the answer is: ${right}.`] }
  } },
  { style: 'story: name it from the clues', make: r => {
    const thing = pick(r, ['garden bed', 'floor tile', 'window', 'road sign'])
    const k = pick(r, ['rectangle', 'rhombus', 'trapezoid'] as const)
    let facts: string[], why: string[]
    if (k === 'rectangle') {
      const { w, h } = rect(r)
      facts = ['2 pairs of parallel sides', '4 square corners', `sides of ${w} ft, ${h} ft, ${w} ft and ${h} ft`]
      why = ['It has 2 pairs of parallel sides and 4 square corners.', `The sides are ${w} feet and ${h} feet, so they are not all the same length.`]
    } else if (k === 'rhombus') {
      const s = int(r, 2, 9)
      facts = ['2 pairs of parallel sides', 'no square corners', `all 4 sides ${s} ft long`]
      why = ['It has 2 pairs of parallel sides and no square corners.', 'All 4 sides are the same length.']
    } else {
      const a = int(r, 6, 9), b = int(r, 2, 5), c = int(r, 3, 5)
      facts = ['only 1 pair of parallel sides', 'no square corners', `sides of ${a} ft, ${c} ft, ${b} ft and ${c} ft`]
      why = ['Only 1 pair of sides is parallel.', 'A shape with two pairs would be a rectangle or a rhombus, and this one has just one.']
    }
    return { text: `A ${thing} has ${facts[0]}, ${facts[1]}, and ${facts[2]}. Which name fits it best?`, picture: eq(`the ${thing}`, facts),
      answer: choose(r, k, ['rectangle', 'rhombus', 'trapezoid'].filter(x => x !== k)), steps: [...why, `So the best name is ${k}.`] }
  } },
]

// ── t8 · Lines of symmetry ──────────────────────────────────────────────────────────────────────────────────
const fold = (a: Pt, b: Pt) => ({ a, b, dashed: true, tone: 2 as const })
type Shape = { name: string; pts: Pt[]; lines: number; w: number; h: number; ticks?: number[]; right?: number[] }
const sRect = (r: Rng): Shape => { let w = 0, h = 0; do { w = int(r, 4, 7); h = int(r, 2, 4) } while (w === h || w < h + 2); return { name: 'rectangle', pts: [[0, 0], [w, 0], [w, h], [0, h]], lines: 2, w, h } }
const sSquare = (r: Rng): Shape => { const s = int(r, 3, 5); return { name: 'square', pts: [[0, 0], [s, 0], [s, s], [0, s]], lines: 4, w: s, h: s, ticks: ALL4, right: ALL4 } }
const sTri = (r: Rng): Shape => { const w = pick(r, [4, 6]), h = pick(r, [2, 6]); return { name: 'triangle', pts: [[0, 0], [w, 0], [w / 2, h]], lines: 1, w, h, ticks: [1, 2] } }
const sKite = (r: Rng): Shape => { const k = int(r, 2, 3), t = int(r, 1, 2), u = t + int(r, 2, 3); return { name: 'kite', pts: [[k, 0], [2 * k, u], [k, u + t], [0, u]], lines: 1, w: 2 * k, h: u + t } }
const sHouse = (r: Rng): Shape => { const w = pick(r, [4, 6]), wall = int(r, 2, 3); return { name: 'house', pts: [[0, 0], [w, 0], [w, wall], [w / 2, wall + 2], [0, wall]], lines: 1, w, h: wall + 2 } }
const drawn = (s: Shape, dx = 0, tone: 1 | 2 | 3 | 4 = 1) =>
  ({ pts: s.pts.map(([x, y]) => [x + dx, y] as Pt), tone, ...(s.ticks ? { ticks: s.ticks } : {}), ...(s.right ? { right: s.right } : {}) })
const shapePic = (s: Shape, segs: ReturnType<typeof fold>[] = [], tone: 1 | 2 | 3 | 4 = 1): Picture => ({ kind: 'poly', shapes: [drawn(s, 0, tone)], segs })
const down = (s: Shape, x = s.w / 2) => fold([x, -0.5], [x, s.h + 0.5])
const across = (s: Shape, y = s.h / 2) => fold([-0.5, y], [s.w + 0.5, y])
const countSteps = (s: Shape) =>
  s.name === 'rectangle' ? ['Down the middle matches, and across the middle matches.', 'Corner to corner does not match on a long rectangle.']
    : s.name === 'square' ? ['Down the middle and across the middle both match.', 'All the sides are the same length, so both corner to corner lines match too.']
      : s.name === 'kite' ? ['From the top point to the bottom point, the left and right halves match.', 'Across, the top part is shorter than the bottom part, so that does not match.']
        : [`Down the middle, the left and right halves of the ${s.name} match.`, 'Across, the top part has the point and the bottom part does not, so that does not match.']
const FOLD_Q = 'Fold along the dashed line. Do the two halves match exactly?'
const yes = (s: Shape) => ({ choices: YES_NO, correct: 0, steps: [`Fold the ${s.name} along the dashed line.`, 'Each part lands exactly on a matching part, with nothing sticking out.', 'The halves match, so the answer is yes.'] })

const T8: Level[] = [
  { style: 'fold along a line: middle or not', make: r => {
    const s = pick(r, [sRect, sTri, sKite, sHouse])(r), v = int(r, 0, 2)
    if (v === 0) { const y = yes(s); return { text: FOLD_Q, picture: shapePic(s, [down(s)]), answer: { choices: y.choices, correct: y.correct }, steps: y.steps } }
    if (v === 1) return { text: FOLD_Q, picture: shapePic(s, [down(s, s.w / 2 - 1)]), answer: { choices: YES_NO, correct: 1 },
      steps: ['The dashed line is not in the middle.', 'One part is wider than the other, so parts stick out.', 'The halves do not match, so the answer is no.'] }
    if (s.name === 'rectangle') { const y = yes(s); return { text: FOLD_Q, picture: shapePic(s, [across(s)]), answer: { choices: y.choices, correct: y.correct }, steps: y.steps } }
    return { text: FOLD_Q, picture: shapePic(s, [across(s, s.name === 'kite' ? s.pts[1][1] : s.h / 2)]), answer: { choices: YES_NO, correct: 1 },
      steps: ['Fold the top down onto the bottom.', s.name === 'kite' ? 'The top part is shorter than the bottom part.' : 'The top part has the point, and the bottom part does not.', 'The halves do not match, so the answer is no.'] }
  } },
  { style: 'same size is not enough: corner to corner', make: r => {
    const text = 'The dashed line cuts this shape into two parts the same size. Fold along it. Do the two halves match exactly?'
    const flip = r() < 0.5
    const diag = (s: Shape) => (flip ? fold([0, 0], [s.w, s.h]) : fold([0, s.h], [s.w, 0]))
    if (r() < 0.5) {
      const s = sRect(r)
      return { text, picture: shapePic(s, [diag(s)]), answer: { choices: YES_NO, correct: 1 },
        steps: ['Fold the rectangle along the corner to corner line.', 'The parts are the same size, but the corners do not land on each other. They stick out.', 'The halves do not match, so the answer is no.'] }
    }
    const s = sSquare(r)
    return { text, picture: shapePic(s, [diag(s)]), answer: { choices: YES_NO, correct: 0 },
      steps: ['Fold the square along the corner to corner line.', 'All 4 sides are the same length, so each corner lands on a corner.', 'The halves match, so the answer is yes.'] }
  } },
  { style: 'count the fold lines', make: r => {
    const s = pick(r, [sRect, sSquare, sTri, sKite, sHouse])(r)
    return { text: 'How many matching fold lines does this shape have?', picture: shapePic(s, [], pick(r, [1, 2, 3, 4] as const)), answer: s.lines,
      steps: [...countSteps(s), `So the ${s.name} has ${s.lines}.`] }
  } },
  { style: 'spot the mistake: how many fold lines', make: r => {
    const s = pick(r, [sRect, sSquare, sKite, sHouse])(r), name = pick(r, NAMES)
    const claim = s.lines === 2 ? 4 : 2, other = [1, 2, 4].find(n => n !== s.lines && n !== claim)!, right = `No, it has ${s.lines}`
    return { text: `${name} says this ${s.name} has ${claim} matching fold lines. Which is true?`, picture: shapePic(s, [], 2),
      answer: choose(r, right, [`${name} is right`, `No, it has ${other}`]),
      steps: [...countSteps(s), `So the answer is: ${right}.`] }
  } },
  { style: 'two-step story: two shapes', make: r => {
    const [a, b] = shuffle(r, [sRect, sSquare, sKite, sHouse]).slice(0, 2).map(f => f(r)), name = pick(r, NAMES)
    const pic: Picture = { kind: 'poly', shapes: [drawn(a, 0, 1), drawn(b, a.w + 2, 3)] }
    const tell = `The ${a.name} has ${a.lines}. The ${b.name} has ${b.lines}.`
    if (a.lines !== b.lines && r() < 0.5) {
      const [big, small] = a.lines > b.lines ? [a, b] : [b, a], d = big.lines - small.lines
      return { text: `${name} cuts out a ${a.name} and a ${b.name}. How many more matching fold lines does the ${big.name} have than the ${small.name}?`, picture: pic, answer: d,
        steps: [tell, `${big.lines} − ${small.lines} = ${d}.`, `So the ${big.name} has ${d} more.`] }
    }
    const t = a.lines + b.lines
    return { text: `${name} cuts out a ${a.name} and a ${b.name}. How many matching fold lines do they have altogether?`, picture: pic, answer: t,
      steps: [tell, `${a.lines} + ${b.lines} = ${t}.`, `So they have ${t} altogether.`] }
  } },
]

export const G4M5_LADDERS: Record<string, Level[]> = {
  'g4m5-t1': T1, 'g4m5-t2': T2, 'g4m5-t3': T3, 'g4m5-t4': T4, 'g4m5-t5': T5, 'g4m5-t6': T6, 'g4m5-t7': T7, 'g4m5-t8': T8,
}
