/**
 * Grade 8 · Module 4 — slides, flips, turns, stretches, similar triangles, triangle angles, the Pythagorean theorem and
 * distance on a grid. Practice ladders, easiest style first (see ../adaptive.ts and the reference ladders ./g5m1.ts, ./g7m4.ts).
 * ⚠️ Every level runs through `lv`, which re-rolls a problem whose picture prints its own answer (a label equal to it, or
 * the right choice's text) or whose choices repeat. Axis tick numbers (size 13) are a scale, not a label, and are skipped.
 * ⚠️ A "?" element is never drawn at its answer's size: a missing side, leg or angle is drawn off by a neutral factor
 * (`OFF`, or a few degrees), so the picture cannot be measured for the answer while the known parts stay roughly to scale.
 * On a coordinate grid the positions ARE the question (read a move, count a leg), exactly as in the lessons.
 * The picture helpers are copies of the ones in ../content/g8m4.ts, so a question draws the way its lesson does.
 */
import type { Picture, Problem } from '../script'
import { int, pick, shuffle, fmt, type Level, type Rng } from '../adaptive'

type Pt = [number, number]
type Poly = Extract<Picture, { kind: 'poly' }>
type Shape = Poly['shapes'][number]
type Seg = NonNullable<Poly['segs']>[number]
type Label = NonNullable<Poly['labels']>[number]

const n = (v: number) => fmt(v === 0 ? 0 : v).replace('-', '−')
const P = (x: number, y: number) => `(${n(x)}, ${n(y)})`
const NAMES = ['Leo', 'Mia', 'Sam', 'Ava', 'Kai', 'Nina', 'Ben', 'Zoe']
const sgn = (r: Rng) => (r() < 0.5 ? -1 : 1)
const choose = (r: Rng, right: string, wrong: string[]) => {
  const choices = shuffle(r, [right, ...wrong])
  return { choices, correct: choices.indexOf(right) }
}
/** Spot-the-mistake choices: "Name is right" plus "No, it is …" for every candidate except the one the claim names. */
const verdict = (r: Rng, name: string, ok: boolean, claim: string, truth: string, others: string[]) => {
  const right = ok ? `${name} is right` : `No, it is ${truth}`
  const all = [`${name} is right`, `No, it is ${truth}`, ...others.map(o => `No, it is ${o}`)].filter(c => c !== `No, it is ${claim}`)
  return { right, answer: choose(r, right, all.filter(c => c !== right)) }
}

const strings = (v: unknown): string[] =>
  typeof v === 'string' ? [v]
    : Array.isArray(v) ? v.flatMap(strings)
      : v && typeof v === 'object' ? ((v as { size?: number }).size === 13 ? [] : Object.values(v).flatMap(strings)) : []
/** Does the picture print the answer, or do the choices repeat or run short? */
const shows = (p: Problem) => {
  const s = strings(p.picture), a = p.answer!
  if (typeof a === 'number') return s.some(t => (t.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).some(x => x.replace(/,/g, '') === String(Math.abs(a))))
  if ('choices' in a) return a.choices.length < 3 || new Set(a.choices).size !== a.choices.length || s.some(t => t.includes(a.choices[a.correct]))
  return false
}
const lv = (style: string, make: (r: Rng) => Problem | null): Level => ({
  style, make: r => {
    for (let i = 0; i < 5000; i++) { const p = make(r); if (p && !shows(p)) return p }
    throw new Error(`g8m4 "${style}": no problem found`)
  },
})

// ── Topics 1–4: a coordinate plane drawn with `poly` (as in ../content/g8m4.ts) ────────────────────────────────
function plane(min: number, max: number, shapes: Shape[], more: { segs?: Seg[]; labels?: Label[] } = {}): Picture {
  const nums: Label[] = []
  for (let v = min; v <= max; v++) if (v !== 0) nums.push({ at: [v, -0.45], text: n(v), size: 13 }, { at: [-0.45, v], text: n(v), size: 13 })
  if (min === 0) nums.push({ at: [-0.4, -0.4], text: '0', size: 13 })
  return {
    kind: 'poly', grid: true, shapes,
    segs: [{ a: [min, 0], b: [max, 0] }, { a: [0, min], b: [0, max] }, ...(more.segs ?? [])],
    labels: [...nums, ...(more.labels ?? [])],
  }
}
const ABC = ['A', 'B', 'C'], ABC2 = ['A′', 'B′', 'C′']
const orig = (pts: Pt[], names: (string | null)[] = ABC): Shape => ({ pts, names, tone: 1 })
const img = (pts: Pt[], names: (string | null)[] = ABC2): Shape => ({ pts, names, tone: 2, dashed: true })
const arrow = (a: Pt, b: Pt): Seg => ({ a, b, arrow: 'end', tone: 2 })
const inGrid = (pts: Pt[], lo: number, hi: number) => pts.every(([x, y]) => x >= lo && x <= hi && y >= lo && y <= hi)
/** A right triangle with no symmetry: corner A, one leg along x (w), one along y (h), w ≠ h. */
const tri3 = (A: Pt, w: number, h: number): Pt[] => [A, [A[0] + w, A[1]], [A[0], A[1] + h]]
const legs = (r: Rng): [number, number] => { const w = pick(r, [2, 3]), h = w === 2 ? pick(r, [1, 3]) : pick(r, [1, 2]); return [sgn(r) * w, sgn(r) * h] }
const move = (pts: Pt[], dx: number, dy: number): Pt[] => pts.map(([x, y]) => [x + dx, y + dy])
const dirX = (d: number) => (d > 0 ? 'right' : 'left'), dirY = (d: number) => (d > 0 ? 'up' : 'down')
const slide = (dx: number, dy: number) => `${Math.abs(dx)} ${dirX(dx)} and ${Math.abs(dy)} ${dirY(dy)}`
const plus = (v: number, d: number) => `${n(v)} ${d < 0 ? '−' : '+'} ${Math.abs(d)}`
const nz = (r: Rng, lo: number, hi: number) => { let v = 0; while (v === 0) v = int(r, lo, hi); return v }
const G = 9

// ── t1 · Slides ─────────────────────────────────────────────────────────────────────────────────────────────
const T1: Level[] = [
  lv('one coordinate after a slide, told in words', r => {
    const [w, h] = legs(r), dx = sgn(r) * int(r, 1, 5), dy = sgn(r) * int(r, 1, 5), A: Pt = [int(r, 0, G), int(r, 0, G)], pts = tri3(A, w, h)
    if (!inGrid(pts, 0, G) || !inGrid(move(pts, dx, dy), 0, G)) return null
    const X = r() < 0.5, v = X ? A[0] : A[1], d = X ? dx : dy, c = X ? 'x' : 'y'
    return { text: `Point A is at ${P(...A)}. The triangle slides ${slide(dx, dy)}. What is the ${c}-coordinate of A′?`,
      picture: plane(0, G, [orig(pts)]), answer: v + d,
      steps: [X ? 'Right and left change x, the first number.' : 'Up and down change y, the second number.', `Move ${Math.abs(d)} ${X ? dirX(d) : dirY(d)}: ${plus(v, d)}.`, `So the ${c}-coordinate of A′ is ${n(v + d)}.`] }
  }),
  lv('read the slide off the grid: pick the rule', r => {
    const [w, h] = legs(r), dx = sgn(r) * int(r, 1, 5), dy = sgn(r) * int(r, 1, 5), A: Pt = [int(r, 0, G), int(r, 0, G)], pts = tri3(A, w, h)
    if (Math.abs(dx) === Math.abs(dy) || !inGrid(pts, 0, G) || !inGrid(move(pts, dx, dy), 0, G)) return null
    const rule = (a: number, b: number) => `(x, y) → (x ${a < 0 ? '−' : '+'} ${Math.abs(a)}, y ${b < 0 ? '−' : '+'} ${Math.abs(b)})`
    const right = rule(dx, dy), A2 = move([A], dx, dy)[0]
    return { text: 'Triangle ABC slides to the dashed triangle A′B′C′. Which rule describes the slide?',
      picture: plane(0, G, [orig(pts), img(move(pts, dx, dy))], { segs: [arrow(A, A2)] }),
      answer: choose(r, right, [rule(Math.sign(dx) * Math.abs(dy), Math.sign(dy) * Math.abs(dx)), rule(-dx, -dy)]),
      steps: [`Follow A to A′: the x goes from ${A[0]} to ${A2[0]}, which is ${Math.abs(dx)} ${dirX(dx)}.`, `The y goes from ${A[1]} to ${A2[1]}, which is ${Math.abs(dy)} ${dirY(dy)}.`, `So the rule is ${right}.`] }
  }),
  lv('spot the mistake: x and y mixed up', r => {
    const [w, h] = legs(r), dx = sgn(r) * int(r, 1, 5), dy = sgn(r) * int(r, 1, 5), A: Pt = [int(r, 0, G), int(r, 0, G)], pts = tri3(A, w, h)
    if (Math.abs(dx) === Math.abs(dy) || !inGrid(pts, 0, G) || !inGrid(move(pts, dx, dy), 0, G)) return null
    const name = pick(r, NAMES), ok = r() < 0.35
    const truth = P(A[0] + dx, A[1] + dy), swap = P(A[0] + Math.sign(dx) * Math.abs(dy), A[1] + Math.sign(dy) * Math.abs(dx)), opp = P(A[0] - dx, A[1] - dy)
    const claim = ok ? truth : swap, { right, answer } = verdict(r, name, ok, claim, truth, [swap, opp])
    return { text: `Point P is at ${P(...A)}. The triangle slides ${slide(dx, dy)}. ${name} says P′ is at ${claim}. Which is true?`,
      picture: plane(0, G, [orig(pts, ['P', 'Q', 'R'])]), answer,
      steps: ok
        ? [`Right and left change x: ${plus(A[0], dx)} = ${n(A[0] + dx)}.`, `Up and down change y: ${plus(A[1], dy)} = ${n(A[1] + dy)}. That is just what ${name} says.`, `So the answer is: ${right}.`]
        : [`${name} mixed up the numbers. Right and left change x: ${plus(A[0], dx)} = ${n(A[0] + dx)}.`, `Up and down change y: ${plus(A[1], dy)} = ${n(A[1] + dy)}.`, `So the answer is: ${right}.`] }
  }),
  lv('work backwards: find the slide from one corner, use it on another', r => {
    const [w, h] = legs(r), dx = sgn(r) * int(r, 1, 5), dy = sgn(r) * int(r, 1, 5), A: Pt = [int(r, 0, G), int(r, 0, G)], pts = tri3(A, w, h)
    if (!inGrid(pts, 0, G) || !inGrid(move(pts, dx, dy), 0, G)) return null
    const A2: Pt = [A[0] + dx, A[1] + dy], k = pick(r, [1, 2]), B = pts[k], nm = ABC[k], X = r() < 0.5, c = X ? 'x' : 'y', v = X ? B[0] : B[1], d = X ? dx : dy
    return { text: `A triangle slides so that A ${P(...A)} lands on A′ ${P(...A2)}. Point ${nm} is at ${P(...B)}. What is the ${c}-coordinate of ${nm}′?`,
      picture: plane(0, G, [orig(pts)], { segs: [arrow(A, A2)], labels: [{ at: [A2[0] + 0.5, A2[1] + 0.4], text: 'A′', tone: 2 }] }), answer: v + d,
      steps: [`From A to A′, x goes from ${A[0]} to ${A2[0]}: ${Math.abs(dx)} ${dirX(dx)}. y goes from ${A[1]} to ${A2[1]}: ${Math.abs(dy)} ${dirY(dy)}.`, `${nm} moves the same way, so its ${c} is ${plus(v, d)}.`, `So the ${c}-coordinate of ${nm}′ is ${n(v + d)}.`] }
  }),
  lv('two-step story: two slides in a row', r => {
    const S: Pt = [int(r, 1, 8), int(r, 1, 8)], d1: Pt = [nz(r, -4, 4), nz(r, -4, 4)], d2: Pt = [nz(r, -4, 4), nz(r, -4, 4)]
    const M: Pt = [S[0] + d1[0], S[1] + d1[1]], E: Pt = [M[0] + d2[0], M[1] + d2[1]]
    if (!inGrid([M, E], 0, G)) return null
    const thing = pick(r, ['robot', 'toy car', 'game piece']), X = r() < 0.5, c = X ? 'x' : 'y', i = X ? 0 : 1
    if (d1[i] + d2[i] === 0) return null
    return { text: `A ${thing} on a floor grid is at ${P(...S)}. It moves ${slide(...d1)}, then ${slide(...d2)}, without turning. What is its ${c}-coordinate now?`,
      picture: plane(0, G, [orig([[S[0] - 0.5, S[1] - 0.5], [S[0] + 0.5, S[1] - 0.5], [S[0] + 0.5, S[1] + 0.5], [S[0] - 0.5, S[1] + 0.5]], [])], { labels: [{ at: [S[0], S[1] + 0.9], text: thing }] }),
      answer: E[i],
      steps: [`${X ? 'Right and left change x' : 'Up and down change y'}. First move: ${plus(S[i], d1[i])} = ${n(M[i])}.`, `Second move: ${plus(M[i], d2[i])}.`, `So its ${c}-coordinate now is ${n(E[i])}.`] }
  }),
]

// ── t2 · Flips ──────────────────────────────────────────────────────────────────────────────────────────────
const L2 = 5
/** A triangle with its corner A off both axes, inside −5…5. */
const flipTri = (r: Rng): { A: Pt; pts: Pt[] } | null => {
  const A: Pt = [nz(r, -L2, L2), nz(r, -L2, L2)], [w, h] = legs(r), pts = tri3(A, w, h)
  return inGrid(pts, -L2, L2) && pts.every(([x, y]) => x !== 0 && y !== 0) ? { A, pts } : null
}
const flipX = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [x, -y])
const flipY = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [-x, y])

const T2: Level[] = [
  lv('one coordinate after a flip over an axis', r => {
    const t = flipTri(r); if (!t) return null
    const { A, pts } = t, overX = r() < 0.5
    return overX
      ? { text: `Point A is at ${P(...A)}. The triangle flips over the x-axis. What is the y-coordinate of A′?`, picture: plane(-L2, L2, [orig(pts)]), answer: -A[1],
        steps: ['A flip over the x-axis moves the point straight up or down to the other side.', `The x stays ${n(A[0])}. The y changes sign.`, `So the y-coordinate of A′ is ${n(-A[1])}.`] }
      : { text: `Point A is at ${P(...A)}. The triangle flips over the y-axis. What is the x-coordinate of A′?`, picture: plane(-L2, L2, [orig(pts)]), answer: -A[0],
        steps: ['A flip over the y-axis moves the point straight across to the other side.', `The y stays ${n(A[1])}. The x changes sign.`, `So the x-coordinate of A′ is ${n(-A[0])}.`] }
  }),
  lv('pick where the flipped point lands', r => {
    const t = flipTri(r); if (!t) return null
    const { A: [x, y], pts } = t, overX = r() < 0.5, right = overX ? P(x, -y) : P(-x, y)
    return { text: `Point P is at ${P(x, y)}. The triangle flips over the ${overX ? 'x' : 'y'}-axis. Where is P′?`,
      picture: plane(-L2, L2, [orig(pts, ['P', 'Q', 'R'])]), answer: choose(r, right, [overX ? P(-x, y) : P(x, -y), P(-x, -y)]),
      steps: overX
        ? ['Over the x-axis, only the y changes.', `The x stays ${n(x)}. The y goes from ${n(y)} to ${n(-y)}.`, `So P′ is at ${right}.`]
        : ['Over the y-axis, only the x changes.', `The y stays ${n(y)}. The x goes from ${n(x)} to ${n(-x)}.`, `So P′ is at ${right}.`] }
  }),
  lv('read the picture: which move was it?', r => {
    const t = flipTri(r); if (!t) return null
    const { A, pts } = t, kind = pick(r, ['x', 'y', 'slide'] as const)
    let im: Pt[]
    if (kind === 'x') im = flipX(pts)
    else if (kind === 'y') im = flipY(pts)
    else { const dx = int(r, -4, 4), dy = int(r, -4, 4); if (!dx && !dy) return null; im = move(pts, dx, dy); if (!inGrid(im, -L2, L2)) return null }
    const names = { x: 'a flip over the x-axis', y: 'a flip over the y-axis', slide: 'a slide' }, right = names[kind]
    return { text: 'Triangle ABC moved to the dashed triangle A′B′C′. What move was it?',
      picture: plane(-L2, L2, [orig(pts), img(im)]), answer: choose(r, right, Object.values(names).filter(c => c !== right)),
      steps: kind === 'slide'
        ? [`A ${P(...A)} went to A′ ${P(...im[0])}, and every corner moved the same way.`, 'The triangle did not turn over, so it is not a flip.', `So it was ${right}.`]
        : [`A ${P(...A)} went to A′ ${P(...im[0])}.`, kind === 'x' ? 'Every x stayed the same and every y changed sign, so it turned over top to bottom.' : 'Every y stayed the same and every x changed sign, so it turned over left to right.', `So it was ${right}.`] }
  }),
  lv('spot the mistake: changed the wrong number', r => {
    const t = flipTri(r); if (!t) return null
    const { A: [x, y], pts } = t, overX = r() < 0.5, name = pick(r, NAMES), ok = r() < 0.35
    const truth = overX ? P(x, -y) : P(-x, y), wrongAxis = overX ? P(-x, y) : P(x, -y), both = P(-x, -y)
    const claim = ok ? truth : wrongAxis, { right, answer } = verdict(r, name, ok, claim, truth, [wrongAxis, both])
    const ax = overX ? 'x' : 'y', ch = overX ? 'y' : 'x', keep = overX ? 'x' : 'y'
    return { text: `Point P is at ${P(x, y)}. ${name} flips the triangle over the ${ax}-axis and says P′ is at ${claim}. Which is true?`,
      picture: plane(-L2, L2, [orig(pts, ['P', 'Q', 'R'])]), answer,
      steps: [`A flip over the ${ax}-axis changes only the ${ch}. The ${keep} stays the same.`, `So ${P(x, y)} goes to ${truth}${ok ? `, just as ${name} says` : ''}.`, `So the answer is: ${right}.`] }
  }),
  lv('two flips in a row', r => {
    const t = flipTri(r); if (!t) return null
    const { pts } = t, B = pts[1], firstY = r() < 0.5, askX = r() < 0.5
    const M: Pt = firstY ? [-B[0], B[1]] : [B[0], -B[1]], E: Pt = [-B[0], -B[1]]
    const one = firstY ? 'y' : 'x', two = firstY ? 'x' : 'y', c = askX ? 'x' : 'y'
    return { text: `Point B is at ${P(...B)}. The triangle flips over the ${one}-axis, and then that new triangle flips over the ${two}-axis. Call the last point B″. What is the ${c}-coordinate of B″?`,
      picture: plane(-L2, L2, [orig(pts)]), answer: askX ? E[0] : E[1],
      steps: [`Over the ${one}-axis, only the ${firstY ? 'x' : 'y'} changes: ${P(...B)} becomes ${P(...M)}.`, `Over the ${two}-axis, only the ${firstY ? 'y' : 'x'} changes: ${P(...M)} becomes ${P(...E)}.`, `So the ${c}-coordinate of B″ is ${n(askX ? E[0] : E[1])}.`] }
  }),
]

// ── t3 · Turns around (0, 0) ────────────────────────────────────────────────────────────────────────────────
const quarter = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [0 - y, x])
const half = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [0 - x, 0 - y])

const T3: Level[] = [
  lv('one coordinate after a half turn', r => {
    const t = flipTri(r); if (!t) return null
    const { A, pts } = t, X = r() < 0.5, c = X ? 'x' : 'y', v = X ? A[0] : A[1]
    return { text: `Point A is at ${P(...A)}. The triangle makes a half turn around (0, 0). What is the ${c}-coordinate of A′?`,
      picture: plane(-L2, L2, [orig(pts)]), answer: -v,
      steps: ['A half turn changes the sign of both numbers, and nothing swaps.', `The ${c} is ${n(v)}, so it becomes ${n(-v)}.`, `So the ${c}-coordinate of A′ is ${n(-v)}.`] }
  }),
  lv('pick where a quarter turn lands', r => {
    const t = flipTri(r); if (!t) return null
    const { A: [x, y], pts } = t
    if (Math.abs(x) === Math.abs(y)) return null
    const right = P(-y, x)
    return { text: `Point A is at ${P(x, y)}. The triangle turns a quarter turn counterclockwise around (0, 0). Where is A′?`,
      picture: plane(-L2, L2, [orig(pts)]), answer: choose(r, right, [P(y, -x), P(y, x)]),
      steps: ['A quarter turn counterclockwise sends (x, y) to (−y, x).', `Swap the numbers: ${P(y, x)}. Then change the sign of the new first number.`, `So A′ is at ${right}.`] }
  }),
  lv('read the picture: a turn or a flip?', r => {
    const t = flipTri(r); if (!t) return null
    const { A, pts } = t, kind = pick(r, ['quarter', 'half', 'flip'] as const)
    const im = kind === 'quarter' ? quarter(pts) : kind === 'half' ? half(pts) : flipY(pts)
    const names = { quarter: 'a quarter turn counterclockwise', half: 'a half turn', flip: 'a flip over the y-axis' }, right = names[kind]
    const how = { quarter: 'The numbers swapped, and the new first number changed sign: (x, y) → (−y, x).', half: 'Nothing swapped, and both numbers changed sign: (x, y) → (−x, −y).', flip: 'Only the x changed sign, and the y stayed: (x, y) → (−x, y).' }
    return { text: 'Triangle ABC moved around the grid to the dashed triangle A′B′C′. What move was it?',
      picture: plane(-L2, L2, [orig(pts), img(im)]), answer: choose(r, right, Object.values(names).filter(c => c !== right)),
      steps: [`A ${P(...A)} went to A′ ${P(...im[0])}.`, how[kind], `So it was ${right}.`] }
  }),
  lv('spot the mistake: swapped but kept the signs', r => {
    const t = flipTri(r); if (!t) return null
    const { A: [x, y], pts } = t
    if (Math.abs(x) === Math.abs(y)) return null
    const name = pick(r, NAMES), ok = r() < 0.35, truth = P(-y, x), swap = P(y, x), cw = P(y, -x)
    const claim = ok ? truth : swap, { right, answer } = verdict(r, name, ok, claim, truth, [swap, cw])
    return { text: `Point P is at ${P(x, y)}. ${name} turns the triangle a quarter turn counterclockwise around (0, 0) and says P′ is at ${claim}. Which is true?`,
      picture: plane(-L2, L2, [orig(pts, ['P', 'Q', 'R'])]), answer,
      steps: ok
        ? ['A quarter turn counterclockwise sends (x, y) to (−y, x).', `Swap to ${swap}, then change the sign of the new first number: ${truth}, just as ${name} says.`, `So the answer is: ${right}.`]
        : [`Swapping is only half of it. ${name} forgot to change the sign of the new first number.`, `(x, y) → (−y, x), so ${P(x, y)} goes to ${truth}.`, `So the answer is: ${right}.`] }
  }),
  lv('work backwards: where was it before a quarter turn?', r => {
    const t = flipTri(r); if (!t) return null
    const { A, pts } = t, im = quarter(pts), A2 = im[0], X = r() < 0.5
    return X
      ? { text: `A triangle turned a quarter turn counterclockwise around (0, 0). Corner A landed on A′ at ${P(...A2)}. What was the x-coordinate of A before the turn?`,
        picture: plane(-L2, L2, [img(im)]), answer: A[0],
        steps: ['A quarter turn counterclockwise sends (x, y) to (−y, x).', `So the second number of A′ is the old x, not changed at all.`, `So the x-coordinate of A was ${n(A[0])}.`] }
      : { text: `A triangle turned a quarter turn counterclockwise around (0, 0). Corner A landed on A′ at ${P(...A2)}. What was the y-coordinate of A before the turn?`,
        picture: plane(-L2, L2, [img(im)]), answer: A[1],
        steps: ['A quarter turn counterclockwise sends (x, y) to (−y, x).', `So the first number of A′, ${n(A2[0])}, is the old y with its sign changed.`, `So the y-coordinate of A was ${n(A[1])}.`] }
  }),
]

// ── t4 · Stretches from (0, 0) ──────────────────────────────────────────────────────────────────────────────
const stretchTri = (r: Rng, lo: number, hi: number): { A: Pt; pts: Pt[] } => {
  const A: Pt = [int(r, lo, hi), int(r, lo, hi)], w = pick(r, [1, 2]), h = w === 1 ? 2 : 1
  return { A, pts: tri3(A, w, h) }
}
const times = (pts: Pt[], k: number): Pt[] => pts.map(([x, y]) => [x * k, y * k])

const T4: Level[] = [
  lv('one coordinate after a stretch', r => {
    const { A, pts } = stretchTri(r, 1, 4), k = int(r, 2, 5), X = r() < 0.5, c = X ? 'x' : 'y', v = X ? A[0] : A[1]
    return { text: `Point A is at ${P(...A)}. The triangle is stretched from (0, 0) by a scale factor of ${k}. What is the ${c}-coordinate of A′?`,
      picture: plane(0, G, [orig(pts)]), answer: v * k,
      steps: [`A scale factor of ${k} multiplies both coordinates by ${k}.`, `The ${c} is ${v}, so ${v} × ${k}.`, `So the ${c}-coordinate of A′ is ${v * k}.`] }
  }),
  lv('shrink by a fraction: pick the new point', r => {
    const k = pick(r, [2, 3]), p = int(r, 1, k === 2 ? 4 : 3), q = int(r, 1, k === 2 ? 4 : 3), B: Pt = [p * k, q * k]
    const pts: Pt[] = [B, [B[0] - pick(r, [1, 2]), B[1]], [B[0], B[1] - pick(r, [1, 2])]]
    const right = P(p, q)
    return { text: `Corner B of a triangle is at ${P(...B)}. The triangle shrinks from (0, 0) by a scale factor of 1/${k}. Where is B′?`,
      picture: plane(0, G, [orig(pts, ['B', 'A', 'C'])]), answer: choose(r, right, [P(B[0] - k, B[1] - k), P(B[0] * k, B[1] * k)]),
      steps: [`A scale factor of 1/${k} multiplies both coordinates by 1/${k}, which is the same as dividing by ${k}.`, `${B[0]} ÷ ${k} = ${p} and ${B[1]} ÷ ${k} = ${q}.`, `So B′ is at ${right}.`] }
  }),
  lv('spot the mistake: added instead of multiplied', r => {
    const { A: [x, y], pts } = stretchTri(r, 1, 4), k = int(r, 2, 4), name = pick(r, NAMES), ok = r() < 0.35
    const truth = P(x * k, y * k), added = P(x + k, y + k), onlyX = P(x * k, y)
    if (added === truth) return null
    const claim = ok ? truth : added, { right, answer } = verdict(r, name, ok, claim, truth, [added, onlyX])
    return { text: `Point A is at ${P(x, y)}. ${name} stretches the triangle from (0, 0) by a scale factor of ${k} and says A′ is at ${claim}. Which is true?`,
      picture: plane(0, G, [orig(pts)]), answer,
      steps: ok
        ? [`A stretch multiplies both coordinates by ${k}.`, `${x} × ${k} = ${x * k} and ${y} × ${k} = ${y * k}, just as ${name} says.`, `So the answer is: ${right}.`]
        : [`Adding ${k} only slides the triangle. A stretch multiplies both coordinates by ${k}.`, `${x} × ${k} = ${x * k} and ${y} × ${k} = ${y * k}.`, `So the answer is: ${right}.`] }
  }),
  lv('work backwards: read the scale factor off the grid', r => {
    const { A, pts } = stretchTri(r, 1, 3), k = int(r, 2, 4), big = times(pts, k)
    if (!inGrid(big, 0, G)) return null
    return { text: 'The dashed triangle is triangle ABC stretched from (0, 0). What is the scale factor?',
      picture: plane(0, G, [orig(pts), img(big)], { segs: [{ a: [0, 0], b: big[0], dashed: true, tone: 2 }] }), answer: k,
      steps: [`Read one corner: A is at ${P(...A)} and A′ is at ${P(...big[0])}.`, `${big[0][0]} ÷ ${A[0]} = ${k}, and ${big[0][1]} ÷ ${A[1]} = ${k}.`, `So the scale factor is ${k}.`] }
  }),
  lv('two-step story: find the scale factor, then use it', r => {
    const A: Pt = [int(r, 1, 4), int(r, 1, 4)], B: Pt = [int(r, 1, 8), int(r, 1, 8)], C: Pt = [int(r, 1, 8), int(r, 1, 8)], k = int(r, 2, 5)
    const area = (B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1])
    if (Math.abs(area) < 6) return null
    const X = r() < 0.5, c = X ? 'x' : 'y', i = X ? 0 : 1, cx = (A[0] + B[0] + C[0]) / 3, cy = (A[1] + B[1] + C[1]) / 3
    return { text: `A designer stretches a logo from (0, 0). Corner A at ${P(...A)} moves to ${P(A[0] * k, A[1] * k)}. Corner B is at ${P(...B)}. What is the ${c}-coordinate of B′?`,
      picture: plane(0, G, [orig([A, B, C])], { labels: [{ at: [cx, cy], text: 'logo' }] }), answer: B[i] * k,
      steps: [`Find the scale factor from A: ${A[i] * k} ÷ ${A[i]} = ${k}.`, `B moves the same way, so multiply: ${B[i]} × ${k}.`, `So the ${c}-coordinate of B′ is ${B[i] * k}.`] }
  }),
]

// ── t5 · Similar triangles ──────────────────────────────────────────────────────────────────────────────────
const UNITS = [{ u: 'cm', w: 'cm' }, { u: 'in', w: 'inches' }, { u: 'ft', w: 'feet' }, { u: 'm', w: 'meters' }] as const
const SMALL = [[4, 3, 2], [5, 4, 2], [6, 5, 3], [7, 6, 3], [8, 6, 4], [6, 4, 3], [5, 4, 3], [7, 5, 4], [9, 7, 4], [8, 7, 5], [6, 5, 4]]
/** "Off" factors for a "?" side: far enough from its real length that the drawing cannot be measured for the answer. */
const OFF = [0.72, 1.3]
const r3 = (v: number) => Math.round(v * 1000) / 1000
/** Corners of a triangle with sides [bottom, right, left]; null if the sides cannot close. */
function corners(s: number[]): Pt[] | null {
  const [a, b, c] = s
  if (a >= b + c || b >= a + c || c >= a + b) return null
  const x = (a * a + c * c - b * b) / (2 * a)
  return [[0, 0], [a, 0], [r3(x), r3(Math.sqrt(c * c - x * x))]]
}
/** The drawn lengths: the real ones, with the "?" side (index `miss`) pushed off its real length. */
const drawn = (r: Rng, s: number[], miss: number | null) => {
  if (miss === null) return corners(s)
  for (const f of shuffle(r, OFF)) { const d = corners(s.map((v, i) => (i === miss ? v * f : v))); if (d) return d }
  return null
}
function pairPic(small: Pt[], big: Pt[], ls: (string | null)[], lb: (string | null)[]): Picture {
  const off = Math.max(...small.map(p => p[0])) + 2
  return { kind: 'poly', shapes: [{ pts: small, sides: ls, tone: 1 }, { pts: big.map(([x, y]) => [r3(x + off), y] as Pt), sides: lb, tone: 2 }] }
}
const list = (xs: string[]) => `${xs[0]}, ${xs[1]} and ${xs[2]}`
const similar = (r: Rng) => {
  const s = shuffle(r, pick(r, SMALL)), k = int(r, 2, 4), m = int(r, 0, 2), j = m === 0 ? 1 : 0
  return { s, k, m, j, big: s.map(v => v * k), ...pick(r, UNITS) }
}

const T5: Level[] = [
  lv('missing side on the big triangle: multiply', r => {
    const { s, k, m, j, big, u, w } = similar(r), sd = corners(s), bd = drawn(r, big, m)
    if (!sd || !bd) return null
    const lb = big.map((v, i) => (i === m ? `? ${u}` : `${v} ${u}`))
    return { text: `These two triangles have the same angles. The small one has sides ${list(s.map(String))} ${u}. The big one has sides ${list(big.map((v, i) => (i === m ? '?' : String(v))))} ${u}. How long is the missing side, in ${w}?`,
      picture: pairPic(sd, bd, s.map(v => `${v} ${u}`), lb), answer: big[m],
      steps: [`Match a pair you know: ${big[j]} ÷ ${s[j]} = ${k}, so the scale factor is ${k}.`, `The missing side matches the ${s[m]} ${u} side: ${s[m]} × ${k}.`, `So the missing side is ${big[m]} ${u}.`] }
  }),
  lv('missing side on the small triangle: divide', r => {
    const { s, k, m, j, big, u, w } = similar(r), sd = drawn(r, s, m), bd = corners(big)
    if (!sd || !bd) return null
    return { text: `These two triangles have the same angles. The big one has sides ${list(big.map(String))} ${u}. The small one has sides ${list(s.map((v, i) => (i === m ? '?' : String(v))))} ${u}. How long is the missing side, in ${w}?`,
      picture: pairPic(sd, bd, s.map((v, i) => (i === m ? `? ${u}` : `${v} ${u}`)), big.map(v => `${v} ${u}`)), answer: s[m],
      steps: [`Match a pair you know: ${big[j]} ÷ ${s[j]} = ${k}, so the big sides are ${k} times as long.`, `Go back down: the missing side matches the ${big[m]} ${u} side, so ${big[m]} ÷ ${k}.`, `So the missing side is ${s[m]} ${u}.`] }
  }),
  lv('spot the mistake: added the difference', r => {
    const { s, k, m, j, big, u } = similar(r), sd = corners(s), bd = drawn(r, big, m)
    if (!sd || !bd) return null
    const name = pick(r, NAMES), ok = r() < 0.35, added = s[m] + big[j] - s[j]
    if (added === big[m] || s.includes(big[m])) return null
    const truth = `${big[m]} ${u}`, claim = ok ? truth : `${added} ${u}`
    const { right, answer } = verdict(r, name, ok, claim, truth, [`${added} ${u}`, `${big[m] + s[m]} ${u}`])
    return { text: `These two triangles have the same angles. ${name} says the missing side is ${claim}. Which is true?`,
      picture: pairPic(sd, bd, s.map(v => `${v} ${u}`), big.map((v, i) => (i === m ? `? ${u}` : `${v} ${u}`))), answer,
      steps: ok
        ? [`Scale factor: ${big[j]} ÷ ${s[j]} = ${k}.`, `The missing side matches ${s[m]} ${u}: ${s[m]} × ${k} = ${big[m]}, just as ${name} says.`, `So the answer is: ${right}.`]
        : [`${name} added the difference ${big[j]} − ${s[j]} = ${big[j] - s[j]}. Similar triangles grow by multiplying, not adding.`, `Scale factor: ${big[j]} ÷ ${s[j]} = ${k}. The missing side is ${s[m]} × ${k} = ${big[m]}.`, `So the answer is: ${right}.`] }
  }),
  lv('pick the triangle with the same angles', r => {
    const s = shuffle(r, pick(r, SMALL)), k = int(r, 2, 4), { u } = pick(r, UNITS), sd = corners(s)
    if (!sd) return null
    const d = s[0] * (k - 1), side = (xs: number[]) => `${list(xs.map(String))} ${u}`
    const right = side(s.map(v => v * k))
    return { text: `A triangle has sides of ${list(s.map(String))} ${u}. Which triangle has the same angles?`,
      picture: { kind: 'poly', shapes: [{ pts: sd, sides: s.map(v => `${v} ${u}`), tone: 1 }] },
      answer: choose(r, right, [side(s.map(v => v + d)), side([s[0] * k, s[1] * k, s[2] * k + 1])]),
      steps: ['Same angles means every side is multiplied by the same scale factor. Adding the same amount changes the shape.', `${s[0] * k} ÷ ${s[0]}, ${s[1] * k} ÷ ${s[1]} and ${s[2] * k} ÷ ${s[2]} all make ${k}.`, `So the answer is: ${right}.`] }
  }),
  lv('story: a shadow and a height', r => {
    const [a, b] = pick(r, [['pole', 'tree'], ['fence post', 'flagpole'], ['mailbox', 'lamppost']] as const)
    const h = int(r, 2, 8), s = int(r, 2, 6), k = int(r, 2, 6)
    if (h === s) return null
    const H = h * k, S = s * k, o = s + 2, dh = H * pick(r, OFF)
    return { text: `A ${a} ${h} ft tall casts a shadow ${s} ft long. At the same time, a ${b} casts a shadow ${S} ft long. The two right triangles have the same angles. How tall is the ${b}, in feet?`,
      picture: { kind: 'poly', shapes: [
        { pts: [[0, 0], [s, 0], [0, h]], sides: [`${s} ft`, null, `${h} ft`], right: [0], tone: 1 },
        { pts: [[o, 0], [o + S, 0], [o, r3(dh)]], sides: [`${S} ft`, null, '? ft'], right: [0], tone: 2 },
      ] }, answer: H,
      steps: [`Match the shadows: ${s} ft grew to ${S} ft, and ${S} ÷ ${s} = ${k}.`, `The ${b} matches the ${h} ft ${a}, so ${h} × ${k}.`, `So the ${b} is ${H} feet tall.`] }
  }),
]

// ── t6 · Angles in a triangle ───────────────────────────────────────────────────────────────────────────────
/** As in the lesson: a triangle drawn with angles a (left corner) and b (right corner); `outside` stretches the base. */
function tri(a: number, b: number, angles: (string | null)[], outside?: string): Picture {
  const L = 6, rad = Math.PI / 180, ta = Math.tan(a * rad), tb = Math.tan(b * rad)
  const c: Pt = a === 90 ? [0, L * tb] : b === 90 ? [L, L * ta] : [(L * tb) / (ta + tb), ((L * tb) / (ta + tb)) * ta]
  const hf = ((180 - b) / 2) * rad
  return {
    kind: 'poly',
    shapes: [{ pts: [[0, 0], [L, 0], [r3(c[0]), r3(c[1])]], angles, tone: 1 }],
    segs: outside ? [{ a: [L, 0], b: [L + 3, 0] }] : [],
    labels: outside ? [{ at: [r3(L + 1.4 * Math.cos(hf)), r3(1.4 * Math.sin(hf))], text: outside, tone: 1 }] : [],
  }
}
/** A nudge of a few degrees, so a "?" angle is not drawn at its size. */
const nudge = (r: Rng) => sgn(r) * int(r, 6, 9)
const five = (r: Rng, lo: number, hi: number) => 5 * int(r, lo / 5, hi / 5)

const T6: Level[] = [
  lv('two angles labelled: find the third', r => {
    const a = five(r, 25, 95), b = five(r, 25, 95), c = 180 - a - b
    if (c < 25 || c === a || c === b) return null
    const da = a + nudge(r), db = b + nudge(r)
    if (Math.abs(180 - da - db - c) < 8) return null
    return { text: 'What is the missing angle of this triangle, in degrees?', picture: tri(da, db, [`${a}°`, `${b}°`, '?']), answer: c,
      steps: ['The three angles inside a triangle add to 180°.', `Add the two you know: ${a} + ${b} = ${a + b}. Then 180 − ${a + b}.`, `So the missing angle is ${c}°.`] }
  }),
  lv('the angle outside a corner', r => {
    const a = five(r, 25, 85), b = five(r, 30, 100), c = 180 - a - b
    if (c < 25) return null
    const db = b + sgn(r) * int(r, 9, 12)
    return { text: `One side of this triangle is stretched past a corner. The two inside angles far from that corner are ${a}° and ${c}°. What is the angle outside, in degrees?`,
      picture: tri(a, db, [`${a}°`, null, `${c}°`], '?'), answer: a + c,
      steps: ['The angle outside a corner equals the two far inside angles added.', `${a} + ${c}.`, `So the angle outside is ${a + c}°.`] }
  }),
  lv('story: two equal angles', r => {
    const t = 10 * int(r, 2, 14), x = (180 - t) / 2
    if (t === 60 || x < 20) return null
    const d = sgn(r) * int(r, 5, 7), what = pick(r, [
      ['A slice of pizza is a triangle. The angle at the tip is', 'other two angles'],
      ['A roof frame is a triangle. The angle at the top is', 'two bottom angles'],
      ['A tent door is a triangle. The angle at the top is', 'two bottom angles'],
    ] as const)
    return { text: `${what[0]} ${t}°, and the ${what[1]} are the same size. How many degrees is each of the ${what[1]}?`,
      picture: tri(x + d, x + d, ['?', '?', `${t}°`]), answer: x,
      steps: [`The three angles add to 180°, so the two equal ones make 180 − ${t} = ${180 - t}.`, `They are the same size, so share it: ${180 - t} ÷ 2.`, `So each one is ${x}°.`] }
  }),
  lv('spot the mistake: stopped after adding', r => {
    const a = five(r, 25, 95), b = five(r, 25, 95), c = 180 - a - b
    if (c < 25 || c === a || c === b || a + b === 90) return null
    const da = a + nudge(r), db = b + nudge(r)
    if (Math.abs(180 - da - db - c) < 8) return null
    const name = pick(r, NAMES), ok = r() < 0.35, claim = ok ? `${c}°` : `${a + b}°`
    const { right, answer } = verdict(r, name, ok, claim, `${c}°`, [`${a + b}°`, `${360 - a - b}°`])
    return { text: `A triangle has angles of ${a}° and ${b}°. ${name} says the third angle is ${claim}. Which is true?`,
      picture: tri(da, db, [`${a}°`, `${b}°`, '?']), answer,
      steps: ok
        ? [`Add the two you know: ${a} + ${b} = ${a + b}.`, `180 − ${a + b} = ${c}, just as ${name} says.`, `So the answer is: ${right}.`]
        : [`${a} + ${b} = ${a + b} is only the total of the two you know. ${name} stopped there.`, `Take it away from 180: 180 − ${a + b} = ${c}.`, `So the answer is: ${right}.`] }
  }),
  lv('work backwards from the angle outside', r => {
    const a = five(r, 25, 80), E = five(r, 50, 160), top = E - a
    if (top < 25 || 180 - E < 20 || top === a) return null
    const da = a + nudge(r)
    return { text: `The angle outside the right corner of this triangle is ${E}°. The angle at the left corner is ${a}°. What is the angle at the top, in degrees?`,
      picture: tri(da, 180 - E, [`${a}°`, null, '?'], `${E}°`), answer: top,
      steps: [`The angle outside a corner equals the two far inside angles added: ${a} + top = ${E}.`, `So the top is ${E} − ${a}.`, `So the angle at the top is ${top}°.`] }
  }),
]

// ── t7 and t8 · The Pythagorean theorem ─────────────────────────────────────────────────────────────────────
const PRIM = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]]
/** A right triangle [leg, leg, long side] with whole sides, the long side at most `max`, legs in either order. */
const triple = (r: Rng, max: number, legMax = Infinity): [number, number, number] => {
  for (;;) {
    const p = pick(r, PRIM), k = int(r, 1, Math.max(1, Math.floor(max / p[2])))
    if (p[2] * k > max || p[1] * k > legMax) continue
    return r() < 0.5 ? [p[0] * k, p[1] * k, p[2] * k] : [p[1] * k, p[0] * k, p[2] * k]
  }
}
/** As in the lesson: left side a, bottom b; sides = [bottom, long, left]; sq = labels in the squares, same order. */
function rt(a: number, b: number, sides: (string | null)[], sq?: (string | null)[]): Picture {
  const shapes: Shape[] = [{ pts: [[0, 0], [b, 0], [0, a]], sides, right: [0], tone: 1 }]
  const labels: Label[] = []
  if (sq) {
    shapes.push(
      { pts: [[0, 0], [b, 0], [b, -b], [0, -b]], tone: 2 },
      { pts: [[b, 0], [0, a], [a, a + b], [a + b, b]], tone: 4 },
      { pts: [[0, 0], [0, a], [-a, a], [-a, 0]], tone: 3 },
    )
    const at: Pt[] = [[b / 2, -b / 2], [(a + b) / 2, (a + b) / 2], [-a / 2, a / 2]]
    sq.forEach((t, i) => { if (t) labels.push({ at: at[i], text: t, size: 24 }) })
  }
  return { kind: 'poly', shapes: shapes.map(s => ({ ...s, pts: s.pts.map(([x, y]) => [r3(x), r3(y)] as Pt) })), labels: labels.map(l => ({ ...l, at: [r3(l.at[0]), r3(l.at[1])] as Pt })) }
}
/**
 * Legs to DRAW so the unknown ("long", or leg a or b) is at least 10% off its real size measured against every known
 * side, while the known sides stay within 35% of each other's real proportion (a hypotenuse barely moves when a leg does,
 * so a tighter bound leaves no drawing at all for a 3-4-5). Null when no drawing can do both (a
 * 7-24-25 triangle asked for its 24 leg: the only long leg of a triangle with a 25 hypotenuse is nearly 25) — re-roll.
 */
const F = Array.from({ length: 19 }, (_, i) => 0.6 + i * 0.05)
function skew(r: Rng, a: number, b: number, unknown: 'long' | 'a' | 'b'): [number, number] | null {
  const real = { a, b, long: Math.hypot(a, b) }, ks = (['a', 'b', 'long'] as const).filter(k => k !== unknown)
  const ok: [number, number][] = []
  for (const fa of F) for (const fb of F) {
    const got = { a: a * fa, b: b * fb, long: Math.hypot(a * fa, b * fb) }
    const rel = (x: 'a' | 'b' | 'long', y: 'a' | 'b' | 'long') => got[x] / got[y] / (real[x] / real[y])
    if (Math.abs(Math.log(rel(ks[0], ks[1]))) <= Math.log(1.35) && ks.every(k => Math.abs(Math.log(rel(unknown, k))) >= Math.log(1.1))) ok.push([r3(a * fa), r3(b * fb)])
  }
  return ok.length ? pick(r, ok) : null
}
const rect = (w: number, h: number, sides: (string | null)[], diag?: string): Picture => ({
  kind: 'poly', shapes: [{ pts: [[0, 0], [r3(w), 0], [r3(w), r3(h)], [0, r3(h)]], sides, right: [0, 1, 2, 3], tone: 1 }],
  segs: [{ a: [0, 0], b: [r3(w), r3(h)], dashed: true, tone: 2, label: diag }],
})
const sq = (v: number) => `${v} × ${v}`

const T7: Level[] = [
  lv('squares drawn: add the two small squares', r => {
    const [a, b, c] = triple(r, 17, 15), sk = skew(r, a, b, 'long')
    if (!sk) return null
    return { text: `Squares are drawn on the sides of this right triangle. The two small squares hold ${a * a} and ${b * b} little squares. How many little squares does the big square hold?`,
      picture: rt(sk[0], sk[1], [null, null, null], [`${b * b}`, '?', `${a * a}`]), answer: c * c,
      steps: ['The two small squares together fill the big one exactly.', `${a * a} + ${b * b}.`, `So the big square holds ${c * c} little squares.`] }
  }),
  lv('short sides labelled: find the long side', r => {
    const [a, b, c] = triple(r, 50), { u, w } = pick(r, UNITS), sk = skew(r, a, b, 'long')
    if (!sk) return null
    return { text: `A right triangle has short sides of ${a} ${u} and ${b} ${u}. How long is the long side, in ${w}?`,
      picture: rt(sk[0], sk[1], [`${b} ${u}`, '?', `${a} ${u}`]), answer: c,
      steps: [`Square the short sides and add: ${sq(a)} + ${sq(b)} = ${a * a} + ${b * b} = ${c * c}.`, `Undo the square: ${sq(c)} = ${c * c}.`, `So the long side is ${c} ${u}.`] }
  }),
  lv('spot the mistake: added the sides, or forgot to undo the square', r => {
    const [a, b, c] = triple(r, 30), { u } = pick(r, UNITS), sk = skew(r, a, b, 'long'), name = pick(r, NAMES)
    if (!sk) return null
    const slip = pick(r, ['ok', 'add', 'square'] as const), claimV = slip === 'ok' ? c : slip === 'add' ? a + b : c * c
    const { right, answer } = verdict(r, name, slip === 'ok', `${claimV} ${u}`, `${c} ${u}`, [`${a + b} ${u}`, `${c * c} ${u}`])
    return { text: `A right triangle has short sides of ${a} ${u} and ${b} ${u}. ${name} says the long side is ${claimV} ${u}. Which is true?`,
      picture: rt(sk[0], sk[1], [`${b} ${u}`, '?', `${a} ${u}`]), answer,
      steps: slip === 'ok'
        ? [`Add the squares: ${a * a} + ${b * b} = ${c * c}.`, `${sq(c)} = ${c * c}, so the long side is ${c}, just as ${name} says.`, `So the answer is: ${right}.`]
        : slip === 'add'
          ? [`${a} + ${b} = ${a + b} is the long way around the corner. Add the squares, not the sides.`, `${a * a} + ${b * b} = ${c * c}, and ${sq(c)} = ${c * c}.`, `So the answer is: ${right}.`]
          : [`${c * c} is the square of the long side. ${name} forgot to undo the square.`, `${sq(c)} = ${c * c}, so the long side is ${c}.`, `So the answer is: ${right}.`] }
  }),
  lv('story: straight across a rectangle', r => {
    const [a, b, c] = triple(r, 50), ctx = pick(r, [
      { t: (x: number, y: number) => `A garden is a rectangle ${x} m long and ${y} m wide. A path runs straight from one corner to the opposite corner. How long is the path, in meters?`, u: 'm', end: 'the path is', max: 50 },
      { t: (x: number, y: number) => `A TV screen is ${x} in wide and ${y} in tall. How long is the line from one corner to the opposite corner, in inches?`, u: 'in', end: 'the line is', max: 50 },
      { t: (x: number, y: number) => `A park is a rectangle ${x} blocks long and ${y} blocks wide. How many blocks long is the straight path from one corner to the opposite corner?`, u: 'blocks', end: 'the path is', max: 15 },
    ])
    if (c > ctx.max) return null
    const w = Math.max(a, b), h = Math.min(a, b), sk = skew(r, h, w, 'long')
    if (!sk) return null
    return { text: ctx.t(w, h), picture: rect(sk[1], sk[0], [`${w} ${ctx.u}`, `${h} ${ctx.u}`, null, null], '?'), answer: c,
      steps: ['The straight path and two sides make a right triangle, and the path is the long side.', `${sq(w)} + ${sq(h)} = ${w * w} + ${h * h} = ${c * c}, and ${sq(c)} = ${c * c}.`, `So ${ctx.end} ${c} ${ctx.u}.`] }
  }),
  lv('two-step story: how much shorter is the shortcut?', r => {
    const [a, b, c] = triple(r, 50), name = pick(r, NAMES), w = Math.max(a, b), h = Math.min(a, b), sk = skew(r, h, w, 'long')
    if (!sk) return null
    const ans = w + h - c
    return { text: `${name} crosses a rectangular field ${w} m long and ${h} m wide, from one corner to the opposite corner. How many meters shorter is it to cut straight across than to walk along the two edges?`,
      picture: rect(sk[1], sk[0], [`${w} m`, `${h} m`, null, null]), answer: ans,
      steps: [`Along the edges: ${w} + ${h} = ${w + h} m.`, `Straight across: ${sq(w)} + ${sq(h)} = ${c * c}, and ${sq(c)} = ${c * c}, so ${c} m. Then ${w + h} − ${c}.`, `So cutting across is ${ans} meters shorter.`] }
  }),
]

const T8: Level[] = [
  lv('squares drawn: take the small square from the big one', r => {
    const [a, b, c] = triple(r, 17, 15), sk = skew(r, a, b, 'b')
    if (!sk) return null
    return { text: `Squares are drawn on the sides of this right triangle. The square on the long side holds ${c * c} little squares, and the square on the left side holds ${a * a}. How many little squares does the bottom square hold?`,
      picture: rt(sk[0], sk[1], [null, null, null], ['?', `${c * c}`, `${a * a}`]), answer: b * b,
      steps: ['The two small squares together fill the big one, so take away.', `${c * c} − ${a * a}.`, `So the bottom square holds ${b * b} little squares.`] }
  }),
  lv('long side and one short side labelled: find the other', r => {
    const [a, b, c] = triple(r, 50), { u, w } = pick(r, UNITS), sk = skew(r, a, b, 'a')
    if (!sk) return null
    return { text: `A right triangle has a long side of ${c} ${u} and a short side of ${b} ${u}. How long is the other short side, in ${w}?`,
      picture: rt(sk[0], sk[1], [`${b} ${u}`, `${c} ${u}`, '?']), answer: a,
      steps: [`The long side is the one you know, so take away: ${sq(c)} − ${sq(b)} = ${c * c} − ${b * b} = ${a * a}.`, `Undo the square: ${sq(a)} = ${a * a}.`, `So the other short side is ${a} ${u}.`] }
  }),
  lv('pick the right first step: take away, not add', r => {
    const [a, b, c] = triple(r, 30), { u } = pick(r, UNITS), sk = skew(r, a, b, 'a')
    if (!sk) return null
    const right = `${c}² − ${b}² = ${c * c - b * b}`
    return { text: `A right triangle has a hypotenuse of ${c} ${u} and a leg of ${b} ${u}. Which is the right way to start finding the other leg?`,
      picture: rt(sk[0], sk[1], [`${b} ${u}`, `${c} ${u}`, '?']), answer: choose(r, right, [`${c}² + ${b}² = ${c * c + b * b}`, `${c} − ${b} = ${c - b}`]),
      steps: [`The hypotenuse is the long side, and you already know it. Its square is the total, so take away.`, `Then undo the square: ${sq(a)} = ${a * a}, so the other leg is ${a} ${u}.`, `So the right start is ${right}.`] }
  }),
  lv('story: a ladder or a ramp', r => {
    const [p, q, L] = triple(r, 30), lo = Math.min(p, q), hi = Math.max(p, q)
    if (r() < 0.5) {
      const sk = skew(r, hi, lo, 'a')
      if (!sk) return null
      return { text: `A ladder ${L} ft long leans against a wall. Its foot is ${lo} ft from the wall. How high up the wall does the ladder reach, in feet?`,
        picture: rt(sk[0], sk[1], [`${lo} ft`, `${L} ft`, '?']), answer: hi,
        steps: [`The ladder is the long side: ${sq(L)} − ${sq(lo)} = ${L * L} − ${lo * lo} = ${hi * hi}.`, `Undo the square: ${sq(hi)} = ${hi * hi}.`, `So the ladder reaches ${hi} feet up the wall.`] }
    }
    const sk = skew(r, lo, hi, 'b')
    if (!sk) return null
    return { text: `A ramp is ${L} ft long and rises ${lo} ft. How far along the ground does it go, in feet?`,
      picture: rt(sk[0], sk[1], ['?', `${L} ft`, `${lo} ft`]), answer: hi,
      steps: [`The ramp is the long side: ${sq(L)} − ${sq(lo)} = ${L * L} − ${lo * lo} = ${hi * hi}.`, `Undo the square: ${sq(hi)} = ${hi * hi}.`, `So the ramp goes ${hi} feet along the ground.`] }
  }),
  lv('two-step story: fence around a rectangle from its corner path', r => {
    const [a, b, c] = triple(r, 50), w = Math.max(a, b), h = Math.min(a, b), sk = skew(r, h, w, 'a'), ans = 2 * (w + h)
    if (!sk) return null
    const thing = pick(r, ['garden', 'yard', 'playground'])
    return { text: `A rectangular ${thing} has a straight path from one corner to the opposite corner that is ${c} m long. One side of the ${thing} is ${w} m. How many meters of fence go all the way around the ${thing}?`,
      picture: rect(sk[1], sk[0], [`${w} m`, '? m', null, null], `${c} m`), answer: ans,
      steps: [`The path is the long side of a right triangle: ${sq(c)} − ${sq(w)} = ${c * c} − ${w * w} = ${h * h}, so the other side is ${h} m.`, `All the way around: ${w} + ${h} + ${w} + ${h}.`, `So ${ans} meters of fence go around the ${thing}.`] }
  }),
]

// ── t9 · Distance between two points ────────────────────────────────────────────────────────────────────────
/** As in the lesson: two points on a grid; `legs` draws the right triangle between them, `counts` labels its legs. */
function dist(min: number, max: number, A: Pt, B: Pt, show: 'points' | 'legs' | 'counts', names = ['', '']): Picture {
  const corner: Pt = [B[0], A[1]], count = show === 'counts'
  const lab = (p: Pt, i: number) => `${names[i]}(${n(p[0])}, ${n(p[1])})`
  return {
    kind: 'coord', min, max,
    points: [{ x: A[0], y: A[1], label: lab(A, 0) }, { x: B[0], y: B[1], label: lab(B, 1) }],
    lines: show === 'points' ? [] : [
      { a: A, b: B },
      { a: A, b: corner, dashed: true, tone: 2 as const, label: count ? String(Math.abs(B[0] - A[0])) : undefined },
      { a: corner, b: B, dashed: true, tone: 2 as const, label: count ? String(Math.abs(B[1] - A[1])) : undefined },
    ],
  }
}
const SMALLT = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]]
const minus = (p: number, q: number) => `${n(p)} − ${q < 0 ? `(${n(q)})` : n(q)}`
/** A point A and B = A + (across, up or down), inside a grid whose range holds both. */
const twoPoints = (r: Rng, lo: number, hi: number, down: boolean) => {
  const t = pick(r, SMALLT), [a, b] = r() < 0.5 ? [t[0], t[1]] : [t[1], t[0]], c = t[2], dy = down && r() < 0.4 ? -b : b
  const A: Pt = [int(r, lo, hi), int(r, lo, hi) + (dy < 0 && lo >= 0 ? b : 0)], B: Pt = [A[0] + a, A[1] + dy]
  const min = Math.min(0, A[0], A[1], B[0], B[1]) - (Math.min(A[0], A[1], B[0], B[1]) < 0 ? 1 : 0), max = Math.max(A[0], A[1], B[0], B[1]) + 1
  return { a, b, c, dy, A, B, min, max }
}
const legSteps = (A: Pt, B: Pt, a: number, b: number) =>
  `Across: ${minus(B[0], A[0])} = ${a}. ${B[1] > A[1] ? `Up: ${minus(B[1], A[1])}` : `Down: ${minus(A[1], B[1])}`} = ${b}.`

const T9: Level[] = [
  lv('legs drawn and counted: find the slanted side', r => {
    const { a, b, c, A, B, min, max } = twoPoints(r, 0, 3, false)
    return { text: 'The legs of a right triangle are drawn between these two points. How far apart are the points, in units?',
      picture: dist(min, max, A, B, 'counts'), answer: c,
      steps: [`The legs are ${a} and ${b} units.`, `${sq(a)} + ${sq(b)} = ${a * a} + ${b * b} = ${c * c}, and ${sq(c)} = ${c * c}.`, `So the points are ${c} units apart.`] }
  }),
  lv('two points only: find the legs yourself', r => {
    const { a, b, c, A, B, min, max } = twoPoints(r, 0, 4, true)
    return { text: `How far apart are the points ${P(...A)} and ${P(...B)}, in units?`,
      picture: dist(min, max, A, B, 'points'), answer: c,
      steps: [legSteps(A, B, a, b), `${sq(a)} + ${sq(b)} = ${a * a + b * b}, and ${sq(c)} = ${c * c}.`, `So the points are ${c} units apart.`] }
  }),
  lv('spot the mistake: added the legs', r => {
    const { a, b, c, A, B, min, max } = twoPoints(r, -5, 2, true), name = pick(r, NAMES)
    const slip = pick(r, ['ok', 'add', 'square'] as const), claimV = slip === 'ok' ? c : slip === 'add' ? a + b : c * c
    const { right, answer } = verdict(r, name, slip === 'ok', `${claimV} units`, `${c} units`, [`${a + b} units`, `${c * c} units`])
    return { text: `${name} finds the distance between ${P(...A)} and ${P(...B)} and says it is ${claimV} units. Which is true?`,
      picture: dist(min, max, A, B, 'legs'), answer,
      steps: [legSteps(A, B, a, b), slip === 'add' ? `Adding the legs is the walk around the corner. ${sq(a)} + ${sq(b)} = ${c * c}, and ${sq(c)} = ${c * c}.` : `${sq(a)} + ${sq(b)} = ${c * c}, and ${sq(c)} = ${c * c}, so the distance is ${c}.`, `So the answer is: ${right}.`] }
  }),
  lv('work backwards: a missing coordinate from the distance', r => {
    const { a, b, c, A, B, min, max } = twoPoints(r, -6, 2, false)
    return { text: `Point A is at ${P(...A)}. Point B is up and to the right of A, on the dashed line x = ${n(B[0])}. A and B are ${c} units apart. What is the y-coordinate of B?`,
      picture: { kind: 'coord', min, max, points: [{ x: A[0], y: A[1], label: `A${P(...A)}` }], lines: [{ a: [B[0], min], b: [B[0], max], dashed: true, tone: 2 }] },
      answer: B[1],
      steps: [`Across from A to the line: ${minus(B[0], A[0])} = ${a}. That leg is ${a}, and the long side is ${c}.`, `The other leg: ${sq(c)} − ${sq(a)} = ${c * c - a * a} = ${sq(b)}, so it is ${b}. Go ${b} up from y = ${n(A[1])}.`, `So the y-coordinate of B is ${n(B[1])}.`] }
  }),
  lv('two-step story: how much shorter than the streets?', r => {
    const { a, b, c, A, B, min, max } = twoPoints(r, 0, 4, true), [p, q] = pick(r, [['school', 'library'], ['park', 'pool'], ['house', 'store']])
    const ans = a + b - c
    return { text: `On a city map, the ${p} is at ${P(...A)} and the ${q} is at ${P(...B)}. Each square is 1 block. How many blocks shorter is the straight line than walking along the streets, across and then ${B[1] > A[1] ? 'up' : 'down'}?`,
      picture: dist(min, max, A, B, 'points', [`${p} `, `${q} `]), answer: ans,
      steps: [`${legSteps(A, B, a, b)} The streets are ${a} + ${b} = ${a + b} blocks.`, `Straight line: ${sq(a)} + ${sq(b)} = ${c * c}, and ${sq(c)} = ${c * c}, so ${c} blocks. Then ${a + b} − ${c}.`, `So the straight line is ${ans} blocks shorter.`] }
  }),
]

export const G8M4_LADDERS: Record<string, Level[]> = {
  'g8m4-t1': T1, 'g8m4-t2': T2, 'g8m4-t3': T3, 'g8m4-t4': T4, 'g8m4-t5': T5,
  'g8m4-t6': T6, 'g8m4-t7': T7, 'g8m4-t8': T8, 'g8m4-t9': T9,
}
