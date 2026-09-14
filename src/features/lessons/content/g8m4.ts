/**
 * Grade 8 · Module 4 — Congruence, similarity and the Pythagorean theorem.
 * Written to docs/new-flow/AUTHORING.md. Not yet reviewed by the founder.
 * Topics 1–8 draw with `poly` (1–4 on a hand-built plane: grid + axes + numbered ticks); topic 9 with `coord`.
 */
import type { Lesson, Picture } from '../script'

type Pt = [number, number]
type Poly = Extract<Picture, { kind: 'poly' }>
type Shape = Poly['shapes'][number]
type Seg = NonNullable<Poly['segs']>[number]
type Label = NonNullable<Poly['labels']>[number]

const n = (v: number) => String(v).replace('-', '−')
const ABC = ['A', 'B', 'C'], ABC2 = ['A′', 'B′', 'C′']

// ── Topics 1–4: a coordinate plane drawn with `poly`, so shapes can be filled, dashed and moved with arrows ──
function plane(min: number, max: number, shapes: Shape[], more: { segs?: Seg[]; labels?: Label[]; motion?: boolean } = {}): Picture {
  const nums: Label[] = []
  for (let v = min; v <= max; v++) if (v !== 0) nums.push({ at: [v, -0.45], text: n(v), size: 13 }, { at: [-0.45, v], text: n(v), size: 13 })
  if (min === 0) nums.push({ at: [-0.4, -0.4], text: '0', size: 13 })
  return {
    kind: 'poly', grid: true, motion: more.motion, shapes,
    segs: [{ a: [min, 0], b: [max, 0] }, { a: [0, min], b: [0, max] }, ...(more.segs ?? [])],
    labels: [...nums, ...(more.labels ?? [])],
  }
}
const orig = (pts: Pt[], names: (string | null)[] = ABC): Shape => ({ pts, names, tone: 1 })
const img = (pts: Pt[], names: (string | null)[] = ABC2): Shape => ({ pts, names, tone: 2, dashed: true })
const arrow = (a: Pt, b: Pt, label?: string): Seg => ({ a, b, arrow: 'end', tone: 2, label })

// ── Topic 5: a small triangle and one twice its drawn size. sides = [bottom, right, left] ──
const TRI: Pt[] = [[0, 0], [4, 0], [1.35, 1.5]]
const TRI_ANGLES = ['48°', '30°', '102°']
const pair = (small: (string | null)[], big: (string | null)[], angles = false, motion = false): Picture => ({
  kind: 'poly', motion,
  shapes: [
    { pts: TRI, sides: small, angles: angles ? TRI_ANGLES : undefined, tone: 1 },
    { pts: TRI.map(([x, y]) => [x * 2 + 6, y * 2] as Pt), sides: big, angles: angles ? TRI_ANGLES : undefined, tone: 2 },
  ],
})

// ── Topic 6: a triangle drawn with its real angles a (left corner) and b (right corner); `outside` stretches the base ──
function tri(a: number, b: number, angles: (string | null)[], outside?: string, motion = false): Picture {
  const L = 6, r = Math.PI / 180, ta = Math.tan(a * r), tb = Math.tan(b * r)
  const c: Pt = a === 90 ? [0, L * tb] : b === 90 ? [L, L * ta] : [(L * tb) / (ta + tb), ((L * tb) / (ta + tb)) * ta]
  const half = ((180 - b) / 2) * r
  return {
    kind: 'poly', motion,
    shapes: [{ pts: [[0, 0], [L, 0], c], angles, tone: 1 }],
    segs: outside ? [{ a: [L, 0], b: [L + 3, 0] }] : [],
    labels: outside ? [{ at: [L + 1.4 * Math.cos(half), 1.4 * Math.sin(half)], text: outside, tone: 1 }] : [],
  }
}

// ── Topics 7 and 8: a right triangle, left side a, bottom b. sides = [bottom, long, left]; sq = labels in the squares, same order ──
function rt(a: number, b: number, sides: (string | null)[], sq?: (string | null)[], motion = false): Picture {
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
  return { kind: 'poly', motion, shapes, labels }
}

// ── Topic 9: two points on a grid; `legs` draws the right triangle between them ──
function dist(min: number, max: number, A: Pt, B: Pt, show: 'points' | 'line' | 'legs' | 'counts', names = ['', ''], motion = false): Picture {
  const corner: Pt = [B[0], A[1]], count = show === 'counts'
  const lab = (p: Pt, i: number) => `${names[i]}(${n(p[0])}, ${n(p[1])})`
  return {
    kind: 'coord', min, max, motion,
    points: [{ x: A[0], y: A[1], label: lab(A, 0) }, { x: B[0], y: B[1], label: lab(B, 1) }],
    lines: show === 'points' ? [] : [
      { a: A, b: B },
      ...(show === 'line' ? [] : [
        { a: A, b: corner, dashed: true, tone: 2 as const, label: count ? String(B[0] - A[0]) : undefined },
        { a: corner, b: B, dashed: true, tone: 2 as const, label: count ? String(B[1] - A[1]) : undefined },
      ]),
    ],
  }
}

export const G8M4: Lesson[] = [
  // ── Topic 1 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g8m4-t1', title: 'Slides (translations)', skill: 'Translate a figure on the coordinate plane and find the coordinates of a moved point',
    bigIdea: 'In a slide, every point moves the same distance in the same direction. Change every x by the same amount, and every y by the same amount.',
    screens: [
      { title: 'Move the sticker', text: 'A triangle sticker sits on a grid. You slide it 4 squares right and 2 squares up, without turning it. Where does it land?',
        pictures: [plane(0, 8, [orig([[1, 1], [3, 1], [1, 3]])])] },
      { title: 'Dragging is not exact', text: 'You could drag it and hope. But to say exactly where it lands, you need the new spot of every corner.',
        pictures: [plane(0, 8, [orig([[1, 1], [3, 1], [1, 3]])], { segs: [arrow([2, 2], [6, 4], '?')] })] },
      { title: 'The big idea', text: 'In a slide, every point moves the same distance in the same direction. Change every x by the same amount, and every y by the same amount.',
        pictures: [plane(0, 8, [orig([[1, 1], [3, 1], [1, 3]]), img([[5, 3], [7, 3], [5, 5]])], { segs: [arrow([1, 1], [5, 3])] })] },
      { title: 'Follow one corner', text: 'A is at (1, 1). Move it 4 right: x goes from 1 to 5. Move it 2 up: y goes from 1 to 3. The new point is (5, 3). Call it A′, said "A prime".',
        pictures: [plane(0, 8, [orig([[1, 1], [3, 1], [1, 3]])], { motion: true, segs: [arrow([1, 1], [5, 1], '4 right'), arrow([5, 1], [5, 3], '2 up')], labels: [{ at: [5.5, 3.4], text: 'A′', tone: 2 }] })] },
      { title: 'Every corner moves the same', text: 'B (3, 1) goes to B′ (7, 3). C (1, 3) goes to C′ (5, 5). Each corner goes 4 right and 2 up, so the triangle keeps its size and shape.',
        pictures: [plane(0, 8, [orig([[1, 1], [3, 1], [1, 3]]), img([[5, 3], [7, 3], [5, 5]])], { motion: true, segs: [arrow([1, 1], [5, 3]), arrow([3, 1], [7, 3]), arrow([1, 3], [5, 5])] }),
          { kind: 'eq', text: 'A (1, 1) → A′ (5, 3)', lines: ['B (3, 1) → B′ (7, 3)', 'C (1, 3) → C′ (5, 5)'] }] },
      { title: 'Right and up add', text: 'Right adds to x, and left takes away from x. Up adds to y, and down takes away from y.',
        pictures: [plane(0, 8, [orig([[1, 1], [3, 1], [1, 3]]), img([[5, 3], [7, 3], [5, 5]])]), { kind: 'eq', text: '(x, y) → (x + 4, y + 2)' }] },
      { title: 'One thing not to do', text: "Don't mix up the two numbers. Right and left change x, the first number. Up and down change y, the second number.",
        pictures: [{ kind: 'cards', wrong: '4 right, 2 up: (1, 1) → (3, 5)', right: '4 right, 2 up: (1, 1) → (5, 3)' }] },
    ],
    turn: {
      text: 'Point A is at (2, 1). The triangle slides 5 right and 3 up. What is the x-coordinate of A′?',
      picture: plane(0, 10, [orig([[2, 1], [4, 1], [2, 4]])]),
      answer: 7, steps: ['Right changes x, the first number.', 'Move 5 right: 2 + 5.', 'So the x-coordinate of A′ is 7.'],
      prompt: 'Right and left change x. Up and down change y.',
      hint1: 'Does moving right change the first number or the second?',
      hint2: 'Start at x = 2 and count 5 squares to the right.',
      twin: { text: 'Point B is at (6, 5). The triangle slides 4 left and 2 down. What is the y-coordinate of B′?',
        picture: plane(0, 10, [orig([[4, 5], [6, 5], [6, 8]])]),
        answer: 3, steps: ['Down changes y, the second number.', 'Move 2 down: 5 − 2.', 'So the y-coordinate of B′ is 3.'],
        hint1: 'Which number does moving down change?', hint2: 'Start at y = 5 and count 2 squares down.' },
    },
    won: { text: 'You added the slide to the right number, and left the other one alone.', sticker: 'A slide is called a translation. The new shape has the same size and shape.' },
    twinWon: { text: 'You took 2 away from the y-coordinate to slide down.', sticker: 'A slide is called a translation. The new shape has the same size and shape.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'Point A is at (1, 2). The triangle slides 3 right and 4 up. What is the y-coordinate of A′?',
        picture: plane(0, 10, [orig([[1, 2], [4, 2], [1, 4]])]), answer: 6,
        steps: ['Up changes y, the second number.', 'Move 4 up: 2 + 4.', 'So the y-coordinate of A′ is 6.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Point C is at (3, 6). The triangle slides 5 right and 2 down. What is the x-coordinate of C′?',
        picture: plane(0, 10, [orig([[1, 2], [5, 2], [3, 6]])]), answer: 8,
        steps: ['Right changes x, the first number.', 'Move 5 right: 3 + 5.', 'So the x-coordinate of C′ is 8.'] } },
      { why: 'Still "every point moves the same"', problem: { text: 'A square has a corner P at (7, 4). The square slides 6 left and 3 up. Where is P′?',
        picture: plane(0, 10, [orig([[5, 2], [7, 2], [7, 4], [5, 4]], [null, null, 'P', null])]),
        answer: { choices: ['(1, 7)', '(13, 7)', '(1, 1)'], correct: 0 },
        steps: ['Left takes away from x: 7 − 6 = 1.', 'Up adds to y: 4 + 3 = 7.', 'So P′ is at (1, 7).'] } },
      { why: 'A little harder', problem: { text: 'A triangle slides so that A (2, 3) lands on A′ (6, 1). Point B is at (5, 7). What is the x-coordinate of B′?',
        picture: plane(0, 10, [orig([[2, 3], [5, 7], [2, 7]])], { segs: [arrow([2, 3], [6, 1])], labels: [{ at: [6.5, 1.4], text: 'A′', tone: 2 }] }), answer: 9,
        steps: ['From A to A′, x goes from 2 to 6: that is 4 right. y goes from 3 to 1: that is 2 down.', 'B moves the same way, so its x is 5 + 4.', 'So the x-coordinate of B′ is 9.'] } },
      { why: 'Same math in a story', problem: { text: 'A robot on a floor grid is at (3, 2). It rolls 6 squares right and 5 squares up, without turning. What is its new y-coordinate?',
        picture: plane(0, 10, [orig([[2.5, 1.5], [3.5, 1.5], [3.5, 2.5], [2.5, 2.5]], [])], { labels: [{ at: [3, 3.1], text: 'robot' }] }), answer: 7,
        steps: ['Up changes y, the second number.', 'Move 5 up: 2 + 5.', 'So its new y-coordinate is 7.'] } },
    ],
  },

  // ── Topic 2 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g8m4-t2', title: 'Flips (reflections)', skill: 'Reflect a figure over the x-axis or the y-axis and find the coordinates of a flipped point',
    bigIdea: 'Flip over the x-axis and the y changes sign. Flip over the y-axis and the x changes sign.',
    screens: [
      { title: 'A picture in the lake', text: 'A triangle sits above the edge of a lake, and the edge is the x-axis. Its picture in the water is upside down. Where is each corner of the picture?',
        pictures: [plane(-5, 5, [orig([[2, 1], [4, 1], [2, 3]])])] },
      { title: 'A slide will not match', text: 'Slide the triangle straight down and it stays the same way up. The picture in the water is upside down, so a slide cannot make it.',
        pictures: [plane(-5, 5, [orig([[2, 1], [4, 1], [2, 3]]), { pts: [[2, -3], [4, -3], [2, -1]], tone: 3, dashed: true }])] },
      { title: 'The big idea', text: 'Flip over the x-axis and the y changes sign. Flip over the y-axis and the x changes sign.',
        pictures: [plane(-5, 5, [orig([[2, 1], [4, 1], [2, 3]]), img([[2, -1], [4, -1], [2, -3]])])] },
      { title: 'Same distance, other side', text: 'A is 1 square above the x-axis. Its flip is 1 square below, straight down. So A (2, 1) goes to A′ (2, −1).',
        pictures: [plane(-5, 5, [orig([[2, 1], [4, 1], [2, 3]])], { motion: true, segs: [{ a: [2, 1], b: [2, -1], arrow: 'end', dashed: true, tone: 2 }], labels: [{ at: [1.4, -1.4], text: 'A′', tone: 2 }] })] },
      { title: 'Only y changes', text: 'B (4, 1) goes to B′ (4, −1). C (2, 3) goes to C′ (2, −3). Each x stays the same. Each y changes sign.',
        pictures: [plane(-5, 5, [orig([[2, 1], [4, 1], [2, 3]]), img([[2, -1], [4, -1], [2, -3]])], { motion: true }),
          { kind: 'eq', text: 'A (2, 1) → A′ (2, −1)', lines: ['B (4, 1) → B′ (4, −1)', 'C (2, 3) → C′ (2, −3)'] }] },
      { title: 'Flip over the y-axis', text: 'Now flip the same triangle over the y-axis, from right to left. A (2, 1) goes to (−2, 1). This time the y stays and the x changes sign.',
        pictures: [plane(-5, 5, [orig([[2, 1], [4, 1], [2, 3]]), img([[-2, 1], [-4, 1], [-2, 3]])], { motion: true }), { kind: 'eq', text: '(x, y) → (−x, y)' }] },
      { title: 'One thing not to do', text: "Don't change the wrong number. A flip over the x-axis moves a point up or down, so only the y changes.",
        pictures: [{ kind: 'cards', wrong: 'over the x-axis: (2, 1) → (−2, 1)', right: 'over the x-axis: (2, 1) → (2, −1)' }] },
    ],
    turn: {
      text: 'Point A is at (3, 2). The triangle flips over the x-axis. What is the y-coordinate of A′?',
      picture: plane(-5, 5, [orig([[3, 2], [5, 2], [3, 4]])]),
      answer: -2, steps: ['A flip over the x-axis moves the point straight down to the other side.', 'The x stays 3. The y changes sign.', 'So the y-coordinate of A′ is −2.'],
      prompt: 'Over the x-axis, the y changes sign. Over the y-axis, the x changes sign.',
      hint1: 'A flip over the x-axis moves a point up or down. Which number changes?',
      hint2: 'Count how far A is above the x-axis. Go the same distance below it.',
      twin: { text: 'Point B is at (4, −3). The triangle flips over the y-axis. What is the x-coordinate of B′?',
        picture: plane(-5, 5, [orig([[1, -1], [4, -3], [1, -3]])]),
        answer: -4, steps: ['A flip over the y-axis moves the point straight across to the other side.', 'The y stays −3. The x changes sign.', 'So the x-coordinate of B′ is −4.'],
        hint1: 'A flip over the y-axis moves a point left or right. Which number changes?', hint2: 'Count how far B is from the y-axis. Go the same distance on the other side.' },
    },
    won: { text: 'You kept the x and changed the sign of the y.', sticker: 'A flip is called a reflection. The axis you flip over is the line of reflection.' },
    twinWon: { text: 'You kept the y and changed the sign of the x.', sticker: 'A flip is called a reflection. The axis you flip over is the line of reflection.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'Point A is at (4, 1). The triangle flips over the x-axis. What is the y-coordinate of A′?',
        picture: plane(-5, 5, [orig([[4, 1], [4, 3], [2, 3]])]), answer: -1,
        steps: ['Over the x-axis, only the y changes.', 'The y is 1, so it becomes its opposite.', 'So the y-coordinate of A′ is −1.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Point C is at (2, 5). The triangle flips over the y-axis. What is the x-coordinate of C′?',
        picture: plane(-5, 5, [orig([[1, 1], [4, 1], [2, 5]])]), answer: -2,
        steps: ['Over the y-axis, only the x changes.', 'The x is 2, so it becomes its opposite.', 'So the x-coordinate of C′ is −2.'] } },
      { why: 'Still "one number changes sign"', problem: { text: 'Point P is at (−3, 4). The triangle flips over the x-axis. Where is P′?',
        picture: plane(-5, 5, [orig([[-3, 4], [-1, 4], [-1, 2]], ['P', 'Q', 'R'])]),
        answer: { choices: ['(−3, −4)', '(3, 4)', '(3, −4)'], correct: 0 },
        steps: ['Over the x-axis, only the y changes.', 'The x stays −3. The y goes from 4 to −4.', 'So P′ is at (−3, −4).'] } },
      { why: 'A little harder', problem: { text: 'Point B is at (−4, −2). The triangle flips over the y-axis, and then that new triangle flips over the x-axis. Call the last point B″. What is the y-coordinate of B″?',
        picture: plane(-5, 5, [orig([[-1, -2], [-4, -2], [-1, -4]], ['A', 'B', 'C'])]), answer: 2,
        steps: ['Over the y-axis, only the x changes: (−4, −2) becomes (4, −2).', 'Over the x-axis, only the y changes: (4, −2) becomes (4, 2).', 'So the y-coordinate of B″ is 2.'] } },
      { why: 'Same math in a story', problem: { text: 'A kite is drawn at (5, 3) on a map grid. The map is folded along the y-axis, and the wet ink prints the kite on the other side. What is the x-coordinate of the printed kite?',
        picture: plane(-5, 5, [orig([[5, 4], [5.6, 3], [5, 2], [4.4, 3]], [])], { labels: [{ at: [5, 4.6], text: 'kite' }] }), answer: -5,
        steps: ['Folding along the y-axis flips the kite from right to left.', 'The y stays 3. The x changes sign.', 'So the x-coordinate of the printed kite is −5.'] } },
    ],
  },

  // ── Topic 3 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g8m4-t3', title: 'Turns (rotations)', skill: 'Rotate a point 90° counterclockwise or 180° about the origin',
    bigIdea: 'A quarter turn counterclockwise around (0, 0) sends (x, y) to (−y, x). A half turn sends (x, y) to (−x, −y).',
    screens: [
      { title: 'Spin the board', text: 'A triangle is drawn on a board pinned at (0, 0). The board turns a quarter turn counterclockwise. Where does the triangle land?',
        pictures: [plane(-5, 5, [orig([[3, 1], [4, 1], [3, 3]])], { segs: [{ a: [0, 0], b: [3, 1], dashed: true }] })] },
      { title: 'Counting squares will not work', text: 'Each corner swings around (0, 0) on its own circle. A corner far from the center travels farther than a near one, so no single count of squares fits them all.',
        pictures: [plane(-5, 5, [orig([[3, 1], [4, 1], [3, 3]])], { segs: [{ a: [0, 0], b: [3, 1], dashed: true }, { a: [0, 0], b: [3, 3], dashed: true }] })] },
      { title: 'The big idea', text: 'A quarter turn counterclockwise around (0, 0) sends (x, y) to (−y, x). A half turn sends (x, y) to (−x, −y).',
        pictures: [plane(-5, 5, [orig([[3, 1], [4, 1], [3, 3]]), img([[-1, 3], [-1, 4], [-3, 3]])], { segs: [{ a: [0, 0], b: [3, 1], dashed: true }, { a: [0, 0], b: [-1, 3], dashed: true, tone: 2 }] })] },
      { title: 'Follow A', text: 'A is at (3, 1): 3 right and 1 up from the center. Turn that arm a quarter turn. Now it goes 1 left and 3 up. So A′ is at (−1, 3).',
        pictures: [plane(-5, 5, [orig([[3, 1], [4, 1], [3, 3]])], { motion: true, segs: [{ a: [0, 0], b: [3, 1], dashed: true }, { a: [0, 0], b: [-1, 3], dashed: true, tone: 2 }], labels: [{ at: [-1.5, 3.5], text: 'A′', tone: 2 }] })] },
      { title: 'Swap, then change a sign', text: 'The two numbers swap places, and the new first number changes sign. B (4, 1) goes to B′ (−1, 4). C (3, 3) goes to C′ (−3, 3).',
        pictures: [plane(-5, 5, [orig([[3, 1], [4, 1], [3, 3]]), img([[-1, 3], [-1, 4], [-3, 3]])], { motion: true }),
          { kind: 'eq', text: 'A (3, 1) → A′ (−1, 3)', lines: ['B (4, 1) → B′ (−1, 4)', 'C (3, 3) → C′ (−3, 3)'] }] },
      { title: 'A half turn', text: 'Turn twice as far, so the board faces the other way. That is 180°. Nothing swaps, but both signs change. A (3, 1) goes to (−3, −1).',
        pictures: [plane(-5, 5, [orig([[3, 1], [4, 1], [3, 3]]), img([[-3, -1], [-4, -1], [-3, -3]])], { motion: true, segs: [{ a: [3, 1], b: [-3, -1], dashed: true }] }),
          { kind: 'eq', text: '(x, y) → (−x, −y)' }] },
      { title: 'One thing not to do', text: "Don't only swap the numbers. After a quarter turn counterclockwise, the new first number also changes sign.",
        pictures: [{ kind: 'cards', wrong: '(3, 1) → (1, 3)', right: '(3, 1) → (−1, 3)' }] },
    ],
    turn: {
      text: 'Point A is at (4, 2). The triangle turns a quarter turn counterclockwise around (0, 0). What is the x-coordinate of A′?',
      picture: plane(-5, 5, [orig([[4, 2], [5, 2], [4, 4]])]),
      answer: -2, steps: ['A quarter turn counterclockwise sends (x, y) to (−y, x).', 'Here y is 2, so the new x is the opposite of 2.', 'So the x-coordinate of A′ is −2.'],
      prompt: 'Swap the two numbers. Then change the sign of the new first number.',
      hint1: 'After a quarter turn, which number of (4, 2) moves into the first place?',
      hint2: 'Swap the numbers, then change the sign of the first one.',
      twin: { text: 'Point B is at (3, −5). The triangle makes a half turn around (0, 0). What is the y-coordinate of B′?',
        picture: plane(-5, 5, [orig([[1, -2], [3, -5], [1, -5]])]),
        answer: 5, steps: ['A half turn sends (x, y) to (−x, −y).', 'Nothing swaps. The y is −5, and its sign changes.', 'So the y-coordinate of B′ is 5.'],
        hint1: 'In a half turn, do the numbers swap, or only change sign?', hint2: 'Change the sign of both numbers of B.' },
    },
    won: { text: 'You swapped the numbers and changed the sign of the new first one.', sticker: 'A turn is called a rotation. Slides, flips and turns keep size and shape, so the new shape is congruent to the old one.' },
    twinWon: { text: 'You changed the sign of both numbers for a half turn.', sticker: 'A turn is called a rotation. Slides, flips and turns keep size and shape, so the new shape is congruent to the old one.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'Point A is at (2, 1). The triangle turns a quarter turn counterclockwise around (0, 0). What is the x-coordinate of A′?',
        picture: plane(-5, 5, [orig([[2, 1], [4, 1], [2, 3]])]), answer: -1,
        steps: ['A quarter turn counterclockwise sends (x, y) to (−y, x).', 'Here y is 1, so the new x is its opposite.', 'So the x-coordinate of A′ is −1.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Point C is at (1, 4). The triangle turns a quarter turn counterclockwise around (0, 0). What is the x-coordinate of C′?',
        picture: plane(-5, 5, [orig([[1, 1], [3, 1], [1, 4]])]), answer: -4,
        steps: ['A quarter turn counterclockwise sends (x, y) to (−y, x).', 'Here y is 4, so the new x is its opposite.', 'So the x-coordinate of C′ is −4.'] } },
      { why: 'Still "turn around (0, 0)"', problem: { text: 'Point P is at (−2, 5). The triangle makes a half turn around (0, 0). Where is P′?',
        picture: plane(-5, 5, [orig([[-2, 5], [-2, 3], [-4, 3]], ['P', 'Q', 'R'])]),
        answer: { choices: ['(2, −5)', '(−5, −2)', '(5, −2)'], correct: 0 },
        steps: ['A half turn changes both signs, and nothing swaps.', '−2 becomes 2, and 5 becomes −5.', 'So P′ is at (2, −5).'] } },
      { why: 'A little harder', problem: { text: 'Point B is at (−3, −4). The triangle turns a quarter turn counterclockwise around (0, 0). What is the x-coordinate of B′?',
        picture: plane(-5, 5, [orig([[-1, -2], [-3, -4], [-1, -4]])]), answer: 4,
        steps: ['A quarter turn counterclockwise sends (x, y) to (−y, x).', 'Here y is −4, and its opposite is 4.', 'So the x-coordinate of B′ is 4.'] } },
      { why: 'Same math in a story', problem: { text: 'The tip of a fan blade is at (5, 2), and the center of the fan is at (0, 0). The fan turns a quarter turn counterclockwise. What is the y-coordinate of the tip now?',
        picture: plane(-5, 5, [], { segs: [{ a: [0, 0], b: [5, 2], dots: true }], labels: [{ at: [4.2, 2.8], text: 'tip' }] }), answer: 5,
        steps: ['A quarter turn counterclockwise sends (x, y) to (−y, x).', 'So the new y is the old x.', 'So the y-coordinate of the tip is now 5.'] } },
    ],
  },

  // ── Topic 4 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g8m4-t4', title: 'Stretches (dilations)', skill: 'Dilate a figure from the origin by a scale factor, and find a scale factor',
    bigIdea: 'To stretch a shape from (0, 0), multiply both coordinates of every point by the same number.',
    screens: [
      { title: 'Make the photo bigger', text: 'You make a triangle picture twice as big, and the corner (0, 0) stays put. Where do the triangle\'s corners go?',
        pictures: [plane(0, 8, [orig([[2, 1], [4, 1], [2, 3]])])] },
      { title: 'Adding does not stretch', text: 'Add 2 to every number and the triangle only slides. It gets no bigger. Every side has to become twice as long.',
        pictures: [plane(0, 8, [orig([[2, 1], [4, 1], [2, 3]]), { pts: [[4, 3], [6, 3], [4, 5]], tone: 3, dashed: true }])] },
      { title: 'The big idea', text: 'To stretch a shape from (0, 0), multiply both coordinates of every point by the same number.',
        pictures: [plane(0, 8, [orig([[2, 1], [4, 1], [2, 3]]), img([[4, 2], [8, 2], [4, 6]])])] },
      { title: 'Multiply one corner', text: 'A is at (2, 1). Multiply both numbers by 2: (4, 2). A′ lands on the same line from (0, 0), twice as far out.',
        pictures: [plane(0, 8, [orig([[2, 1], [4, 1], [2, 3]])], { motion: true, segs: [{ a: [0, 0], b: [4, 2], dashed: true, arrow: 'end', tone: 2 }], labels: [{ at: [4.3, 2.6], text: 'A′', tone: 2 }] })] },
      { title: 'Every corner', text: 'B (4, 1) goes to B′ (8, 2). C (2, 3) goes to C′ (4, 6). Every side of the new triangle is twice as long.',
        pictures: [plane(0, 8, [orig([[2, 1], [4, 1], [2, 3]]), img([[4, 2], [8, 2], [4, 6]])], { motion: true, segs: [{ a: [0, 0], b: [8, 2], dashed: true }, { a: [0, 0], b: [4, 6], dashed: true }] }),
          { kind: 'eq', text: 'A (2, 1) → A′ (4, 2)', lines: ['B (4, 1) → B′ (8, 2)', 'C (2, 3) → C′ (4, 6)'] }] },
      { title: 'Shrinking works the same way', text: 'Multiply by 1/2 and the shape shrinks: (8, 2) goes back to (4, 1). A number more than 1 makes it bigger. A number less than 1 makes it smaller.',
        pictures: [plane(0, 8, [orig([[2, 1], [4, 1], [2, 3]]), img([[4, 2], [8, 2], [4, 6]])]), { kind: 'eq', text: '(x, y) → (2x, 2y)', lines: ['(8, 2) × 1/2 → (4, 1)'] }] },
      { title: 'One thing not to do', text: "Don't add the number. A stretch multiplies both coordinates.",
        pictures: [{ kind: 'cards', wrong: 'twice as big: (2, 1) → (4, 3)', right: 'twice as big: (2, 1) → (4, 2)' }] },
    ],
    turn: {
      text: 'Point A is at (3, 1). The triangle is stretched from (0, 0), multiplying by 2. What is the x-coordinate of A′?',
      picture: plane(0, 10, [orig([[3, 1], [4, 1], [3, 3]])]),
      answer: 6, steps: ['Stretching by 2 multiplies both coordinates by 2.', 'The x is 3, so 3 × 2.', 'So the x-coordinate of A′ is 6.'],
      prompt: 'Multiply both coordinates by the stretch number.',
      hint1: 'Do you add 2 or multiply by 2?',
      hint2: 'Multiply the x-coordinate of A by 2.',
      twin: { text: 'Point B is at (2, 4). The triangle is stretched from (0, 0), multiplying by 3. What is the y-coordinate of B′?',
        picture: plane(0, 10, [orig([[1, 1], [2, 4], [1, 4]])]),
        answer: 12, steps: ['Stretching by 3 multiplies both coordinates by 3.', 'The y is 4, so 4 × 3.', 'So the y-coordinate of B′ is 12.'],
        hint1: 'Which number of (2, 4) is the y-coordinate?', hint2: 'Multiply the y-coordinate of B by 3.' },
    },
    won: { text: 'You multiplied the coordinate by the stretch number.', sticker: 'A stretch from a point is called a dilation. The number you multiply by is the scale factor.' },
    twinWon: { text: 'You multiplied the y-coordinate 4 by 3.', sticker: 'A stretch from a point is called a dilation. The number you multiply by is the scale factor.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'Point A is at (4, 5). The triangle is stretched from (0, 0) by a scale factor of 2. What is the y-coordinate of A′?',
        picture: plane(0, 10, [orig([[4, 5], [5, 5], [4, 3]])]), answer: 10,
        steps: ['A scale factor of 2 multiplies both coordinates by 2.', 'The y is 5, so 5 × 2.', 'So the y-coordinate of A′ is 10.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Point C is at (3, 2). The triangle is stretched from (0, 0) by a scale factor of 4. What is the x-coordinate of C′?',
        picture: plane(0, 10, [orig([[1, 1], [2, 1], [3, 2]])]), answer: 12,
        steps: ['A scale factor of 4 multiplies both coordinates by 4.', 'The x is 3, so 3 × 4.', 'So the x-coordinate of C′ is 12.'] } },
      { why: 'Still "multiply both numbers"', problem: { text: 'Corner B of a triangle is at (8, 6). The triangle shrinks from (0, 0) by a scale factor of 1/2. Where is B′?',
        picture: plane(0, 10, [orig([[4, 2], [8, 6], [4, 6]])]),
        answer: { choices: ['(4, 3)', '(6, 4)', '(16, 12)'], correct: 0 },
        steps: ['A scale factor of 1/2 multiplies both coordinates by 1/2.', '8 × 1/2 = 4 and 6 × 1/2 = 3.', 'So B′ is at (4, 3).'] } },
      { why: 'A little harder', problem: { text: 'A stretch from (0, 0) sends A (2, 3) to A′ (10, 15). What is the scale factor?',
        picture: { kind: 'table', head: ['point', 'x', 'y'], rows: [['A', '2', '3'], ['A′', '10', '15']], rowHead: true }, answer: 5,
        steps: ['Both coordinates were multiplied by the same number.', '2 × ? = 10, and 3 × ? = 15. Check: 10 ÷ 2 and 15 ÷ 3 give the same number.', 'So the scale factor is 5.'] } },
      { why: 'Same math in a story', problem: { text: 'A designer shrinks a logo from (0, 0) by a scale factor of 1/3. Corner P of the logo is at (9, 6). What is the x-coordinate of the new corner P′?',
        picture: plane(0, 10, [orig([[3, 3], [9, 3], [9, 6], [3, 6]], [null, null, 'P', null])], { labels: [{ at: [6, 4.5], text: 'logo' }] }), answer: 3,
        steps: ['A scale factor of 1/3 multiplies both coordinates by 1/3.', 'The x is 9, and 9 × 1/3 = 9 ÷ 3.', 'So the x-coordinate of P′ is 3.'] } },
    ],
  },

  // ── Topic 5 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g8m4-t5', title: 'Similar triangles', skill: 'Use the scale factor between similar triangles to find a missing side',
    bigIdea: 'Triangles with the same angles have sides that all grow by the same scale factor. Find it from one matching pair, then multiply.',
    screens: [
      { title: 'Two signs', text: 'Two triangle signs have the same shape, and one is bigger. The small one has sides 4, 3 and 2 feet. The big one has sides 8, 6 and ? feet. How long is the missing side?',
        pictures: [pair(['4 ft', '3 ft', '2 ft'], ['8 ft', '6 ft', '? ft'])] },
      { title: 'Adding does not match', text: 'The bottom went from 4 to 8, that is 4 more. But the side of 3 went to 6, only 3 more. The sides do not grow by adding the same amount.',
        pictures: [pair(['4 ft', '3 ft', '2 ft'], ['8 ft', '6 ft', '? ft'])] },
      { title: 'The big idea', text: 'Triangles with the same angles have sides that all grow by the same scale factor. Find it from one matching pair, then multiply.',
        pictures: [pair(['4 ft', '3 ft', '2 ft'], ['8 ft', '6 ft', '? ft'], true)] },
      { title: 'Match the corners', text: 'Each corner of the big sign has the same angle as a corner of the small one. So each side of the big sign matches the side in the same place on the small one.',
        pictures: [pair([null, null, null], [null, null, null], true, true)] },
      { title: 'Find the scale factor', text: 'Match the bottoms: 4 grew to 8, and 8 ÷ 4 = 2. Check another pair: 3 × 2 = 6. Every side is 2 times as long.',
        pictures: [pair(['4 ft', '3 ft', '2 ft'], ['8 ft', '6 ft', '? ft'], false, true), { kind: 'eq', text: '8 ÷ 4 = 2', lines: ['3 × 2 = 6 ✓'] }] },
      { title: 'Multiply', text: 'The missing side matches the side of 2 feet. 2 × 2 = 4, so the missing side is 4 feet.',
        pictures: [pair(['4 ft', '3 ft', '2 ft'], ['8 ft', '6 ft', '4 ft']), { kind: 'eq', text: '2 × 2 = 4', lines: ['4 feet'] }] },
      { title: 'One thing not to do', text: "Don't add the difference. The sides grow by multiplying, so multiply by the scale factor.",
        pictures: [{ kind: 'cards', wrong: '2 + 4 = 6 ft', right: '2 × 2 = 4 ft' }] },
    ],
    turn: {
      text: 'These two triangles have the same angles. The small one has sides 6, 5 and 3 cm. The big one has sides 18, 15 and ? cm. How long is the missing side, in cm?',
      picture: pair(['6 cm', '5 cm', '3 cm'], ['18 cm', '15 cm', '? cm']),
      answer: 9, steps: ['Match the bottoms: 6 cm grew to 18 cm, and 18 ÷ 6 = 3.', 'The missing side matches the 3 cm side, so 3 × 3.', 'So the missing side is 9 cm.'],
      prompt: 'Find the scale factor from a matching pair. Then multiply.',
      hint1: 'How many times bigger is 18 than 6?',
      hint2: 'Multiply the matching small side, 3 cm, by that number.',
      twin: { text: 'These two triangles have the same angles. The small one has sides 8, 6 and 4 in. The big one has sides 32, ? and 16 in. How long is the missing side, in inches?',
        picture: pair(['8 in', '6 in', '4 in'], ['32 in', '? in', '16 in']),
        answer: 24, steps: ['Match the short sides: 4 in grew to 16 in, and 16 ÷ 4 = 4.', 'The missing side matches the 6 in side, so 6 × 4.', 'So the missing side is 24 inches.'],
        hint1: 'Which pair of matching sides do you know both of?', hint2: 'Find how many times bigger 16 is than 4. Then multiply 6 by it.' },
    },
    won: { text: 'You found the scale factor, then multiplied the matching side.', sticker: 'Triangles with the same angles are called similar triangles.' },
    twinWon: { text: 'You found that 16 is 4 times 4, then multiplied 6 by 4.', sticker: 'Triangles with the same angles are called similar triangles.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'These two triangles have the same angles. The small one has sides 4, 3 and 2 m. The big one has sides 12, 9 and ? m. How long is the missing side, in meters?',
        picture: pair(['4 m', '3 m', '2 m'], ['12 m', '9 m', '? m']), answer: 6,
        steps: ['Match the bottoms: 12 ÷ 4 = 3.', 'The missing side matches the 2 m side, so 2 × 3.', 'So the missing side is 6 meters.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'These two triangles have the same angles. The small one has sides 5, 4 and 2 ft. The big one has sides 15, ? and 6 ft. How long is the missing side, in feet?',
        picture: pair(['5 ft', '4 ft', '2 ft'], ['15 ft', '? ft', '6 ft']), answer: 12,
        steps: ['Match the bottoms: 15 ÷ 5 = 3.', 'The missing side matches the 4 ft side, so 4 × 3.', 'So the missing side is 12 feet.'] } },
      { why: 'Still "find the scale factor"', problem: { text: 'These two triangles have the same angles. The small one has sides 7, 6 and 3 cm. The big one has sides ?, 12 and 6 cm. How long is the missing side, in cm?',
        picture: pair(['7 cm', '6 cm', '3 cm'], ['? cm', '12 cm', '6 cm']), answer: 14,
        steps: ['Match the short sides: 6 ÷ 3 = 2.', 'The missing side matches the 7 cm side, so 7 × 2.', 'So the missing side is 14 cm.'] } },
      { why: 'A little harder', problem: { text: 'These two triangles have the same angles. The big one has sides 18, 12 and 9 cm. The small one has sides ?, 8 and 6 cm. How long is the missing side, in cm?',
        picture: pair(['? cm', '8 cm', '6 cm'], ['18 cm', '12 cm', '9 cm']), answer: 12,
        steps: ['Match the short sides: 9 cm shrank to 6 cm, so the scale factor is 6/9 = 2/3.', 'The missing side matches the 18 cm side, so 18 × 2/3.', 'So the missing side is 12 cm.'] } },
      { why: 'Same math in a story', problem: { text: 'A pole 6 ft tall casts a shadow 4 ft long. At the same time, a tree casts a shadow 20 ft long. The two right triangles have the same angles. How tall is the tree, in feet?',
        picture: { kind: 'poly', shapes: [
          { pts: [[0, 0], [4, 0], [0, 6]], sides: ['4 ft', null, '6 ft'], right: [0], tone: 1 },
          { pts: [[7, 0], [15, 0], [7, 12]], sides: ['20 ft', null, '? ft'], right: [0], tone: 2 },
        ] }, answer: 30,
        steps: ['Match the shadows: 4 ft grew to 20 ft, and 20 ÷ 4 = 5.', 'The tree matches the 6 ft pole, so 6 × 5.', 'So the tree is 30 feet tall.'] } },
    ],
  },

  // ── Topic 6 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g8m4-t6', title: 'Angles in a triangle', skill: 'Use the 180° angle sum and the exterior angle rule to find a missing angle',
    bigIdea: 'The three angles inside a triangle always add to 180°. The angle outside one corner equals the two far inside angles added.',
    screens: [
      { title: 'A roof frame', text: 'A roof frame is a triangle. Two of its angles are 50° and 60°. What is the third angle, at the top?',
        pictures: [tri(50, 60, ['50°', '60°', '?'])] },
      { title: 'No way to measure', text: 'The top corner is high up on the roof, and nobody can hold a protractor there. You need a rule that finds it without measuring.',
        pictures: [tri(50, 60, ['50°', '60°', '?'])] },
      { title: 'The big idea', text: 'The three angles inside a triangle always add to 180°. The angle outside one corner equals the two far inside angles added.',
        pictures: [tri(50, 60, ['50°', '60°', '?'])] },
      { title: 'Tear off the corners', text: 'Tear the three corners off a paper triangle and put their points together. They always make a straight line, and a straight line is 180°.',
        pictures: [{ kind: 'poly', motion: true, shapes: [], segs: [
          { a: [-4, 0], b: [4, 0] },
          { a: [0, 0], b: [3.5 * Math.cos(50 * Math.PI / 180), 3.5 * Math.sin(50 * Math.PI / 180)], tone: 2 },
          { a: [0, 0], b: [3.5 * Math.cos(120 * Math.PI / 180), 3.5 * Math.sin(120 * Math.PI / 180)], tone: 2 },
        ], labels: [
          { at: [1.6 * Math.cos(25 * Math.PI / 180), 1.6 * Math.sin(25 * Math.PI / 180)], text: '50°', tone: 1 },
          { at: [1.6 * Math.cos(85 * Math.PI / 180), 1.6 * Math.sin(85 * Math.PI / 180)], text: '70°', tone: 1 },
          { at: [1.6 * Math.cos(150 * Math.PI / 180), 1.6 * Math.sin(150 * Math.PI / 180)], text: '60°', tone: 1 },
        ] }] },
      { title: 'Take away from 180', text: '50 + 60 = 110. The third angle is what is left: 180 − 110 = 70. The top angle is 70°.',
        pictures: [tri(50, 60, ['50°', '60°', '70°'], undefined, true), { kind: 'eq', text: '50 + 60 = 110', lines: ['180 − 110 = 70'] }] },
      { title: 'The angle outside', text: 'Stretch the bottom side past the 60° corner. The angle outside is 180 − 60 = 120°. That is the same as the two far angles added: 50 + 70 = 120.',
        pictures: [tri(50, 60, ['50°', '60°', '70°'], '120°', true), { kind: 'eq', text: '50 + 70 = 120' }] },
      { title: 'One thing not to do', text: "Don't stop after adding the two angles you know. Take their total away from 180°.",
        pictures: [{ kind: 'cards', wrong: '50 + 60 = 110°', right: '180 − 110 = 70°' }] },
    ],
    turn: {
      text: 'A triangle has angles of 40° and 75°. What is the third angle, in degrees?',
      picture: tri(40, 75, ['40°', '75°', '?']),
      answer: 65, steps: ['The three angles add to 180°.', 'The two you know: 40 + 75 = 115.', 'So the third angle is 180 − 115 = 65°.'],
      prompt: 'Add the two angles you know. Take that away from 180°.',
      hint1: 'What do all three angles inside a triangle add to?',
      hint2: 'Add 40 and 75. Then take that away from 180.',
      twin: { text: 'A triangle has angles of 35° and 90°. What is the third angle, in degrees?',
        picture: tri(35, 90, ['35°', '90°', '?']),
        answer: 55, steps: ['The three angles add to 180°.', 'The two you know: 35 + 90 = 125.', 'So the third angle is 180 − 125 = 55°.'],
        hint1: 'The angles inside add to 180°. Which two do you know?', hint2: 'Add the two angles you know, then take the total away from 180.' },
    },
    won: { text: 'You took the two angles you know away from 180°.', sticker: 'The angles inside are interior angles, and they add to 180°. The angle outside a corner is an exterior angle.' },
    twinWon: { text: 'You took 35° and 90° away from 180°.', sticker: 'The angles inside are interior angles, and they add to 180°. The angle outside a corner is an exterior angle.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'A triangle has angles of 55° and 65°. What is the third angle, in degrees?',
        picture: tri(55, 65, ['55°', '65°', '?']), answer: 60,
        steps: ['The three angles add to 180°.', '55 + 65 = 120.', 'So the third angle is 180 − 120 = 60°.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'A triangle has angles of 30° and 110°. What is the third angle, in degrees?',
        picture: tri(30, 110, ['30°', '110°', '?']), answer: 40,
        steps: ['The three angles add to 180°.', '30 + 110 = 140.', 'So the third angle is 180 − 140 = 40°.'] } },
      { why: 'Still "180° in all"', problem: { text: 'A triangle has two angles of 45°. What is the third angle, in degrees?',
        picture: tri(45, 45, ['45°', '45°', '?']), answer: 90,
        steps: ['The three angles add to 180°.', '45 + 45 = 90.', 'So the third angle is 180 − 90 = 90°.'] } },
      { why: 'A little harder', problem: { text: 'One side of this triangle is stretched past a corner. The two inside angles far from that corner are 35° and 80°. What is the angle outside, in degrees?',
        picture: tri(35, 65, ['35°', null, '80°'], '?'), answer: 115,
        steps: ['The angle outside equals the two far inside angles added.', 'The far angles are 35° and 80°.', 'So the angle outside is 35 + 80 = 115°.'] } },
      { why: 'Same math in a story', problem: { text: 'A slice of pizza is a triangle. The angle at the tip is 30°, and the other two angles are the same size. How many degrees is each of the other two angles?',
        picture: tri(75, 75, ['?', '?', '30°']), answer: 75,
        steps: ['The three angles add to 180°.', 'The other two together: 180 − 30 = 150.', 'They are the same size, so 150 ÷ 2. Each one is 75°.'] } },
    ],
  },

  // ── Topic 7 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g8m4-t7', title: 'The Pythagorean theorem', skill: 'Find the longest side of a right triangle from the two shorter sides',
    bigIdea: 'In a right triangle, square the two short sides and add them. That makes the square of the long side.',
    screens: [
      { title: 'A shortcut across the park', text: 'A park is a rectangle. You can walk 4 blocks along one edge and 3 blocks along the next, or cut straight across. How long is the path across?',
        pictures: [rt(3, 4, ['4 blocks', '?', '3 blocks'])] },
      { title: 'Adding the sides is too long', text: '4 + 3 = 7 is the long way around the corner. The straight path is shorter than 7, so you need a different rule.',
        pictures: [rt(3, 4, ['4 blocks', '?', '3 blocks'])] },
      { title: 'The big idea', text: 'In a right triangle, square the two short sides and add them. That makes the square of the long side.',
        pictures: [rt(3, 4, ['4', null, '3'], [null, null, null])] },
      { title: 'Build a square on each side', text: 'Draw a square on each side of the triangle. The square on the 3 side holds 3 × 3 = 9 small squares. The square on the 4 side holds 4 × 4 = 16.',
        pictures: [rt(3, 4, [null, null, null], ['16', '?', '9'], true)] },
      { title: 'The small squares fill the big one', text: '9 + 16 = 25. The square on the long side holds exactly 25 small squares.',
        pictures: [rt(3, 4, [null, null, null], ['16', '25', '9'], true), { kind: 'eq', text: '9 + 16 = 25' }] },
      { title: 'Undo the square', text: 'Which number times itself makes 25? 5 × 5 = 25. So the path across is 5 blocks.',
        pictures: [rt(3, 4, ['4', '5', '3'], ['16', '25', '9']), { kind: 'eq', text: '3² + 4² = 25', lines: ['5 × 5 = 25, so 5 blocks'] }] },
      { title: 'One thing not to do', text: "Don't add the sides. Add their squares, then find the number that squares to the total.",
        pictures: [{ kind: 'cards', wrong: '3 + 4 = 7', right: '3² + 4² = 25, so 5' }] },
    ],
    turn: {
      text: 'A right triangle has short sides of 6 cm and 8 cm. How long is the long side, in cm?',
      picture: rt(6, 8, ['8 cm', '?', '6 cm']),
      answer: 10, steps: ['Square the short sides: 6 × 6 = 36 and 8 × 8 = 64.', 'Add them: 36 + 64 = 100. That is the square of the long side.', '10 × 10 = 100, so the long side is 10 cm.'],
      prompt: 'Square the two short sides, add, then undo the square.',
      hint1: 'Square each short side first.',
      hint2: 'Add 36 and 64. Which number times itself makes the total?',
      twin: { text: 'A right triangle has short sides of 5 m and 12 m. How long is the long side, in meters?',
        picture: rt(5, 12, ['12 m', '?', '5 m']),
        answer: 13, steps: ['Square the short sides: 5 × 5 = 25 and 12 × 12 = 144.', 'Add them: 25 + 144 = 169.', '13 × 13 = 169, so the long side is 13 meters.'],
        hint1: 'Multiply each short side by itself.', hint2: 'Add the two squares. Which number times itself makes that total?' },
    },
    won: { text: 'You squared the short sides, added, then undid the square.', sticker: 'This is the Pythagorean theorem: a² + b² = c². The long side c is the hypotenuse, and the short sides are the legs.' },
    twinWon: { text: 'You squared 5 and 12, added them, and found 13.', sticker: 'This is the Pythagorean theorem: a² + b² = c². The long side c is the hypotenuse, and the short sides are the legs.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'A right triangle has short sides of 9 in and 12 in. How long is the long side, in inches?',
        picture: rt(9, 12, ['12 in', '?', '9 in']), answer: 15,
        steps: ['9 × 9 = 81 and 12 × 12 = 144.', '81 + 144 = 225.', '15 × 15 = 225, so the long side is 15 inches.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'A right triangle has short sides of 8 cm and 15 cm. How long is the long side, in cm?',
        picture: rt(8, 15, ['15 cm', '?', '8 cm']), answer: 17,
        steps: ['8 × 8 = 64 and 15 × 15 = 225.', '64 + 225 = 289.', '17 × 17 = 289, so the long side is 17 cm.'] } },
      { why: 'Still "add the squares"', problem: { text: 'A right triangle has short sides of 12 ft and 16 ft. How long is the long side, in feet?',
        picture: rt(12, 16, ['16 ft', '?', '12 ft']), answer: 20,
        steps: ['12 × 12 = 144 and 16 × 16 = 256.', '144 + 256 = 400.', '20 × 20 = 400, so the long side is 20 feet.'] } },
      { why: 'A little harder', problem: { text: 'A right triangle has short sides of 7 m and 24 m. How long is the long side, in meters?',
        picture: rt(7, 24, ['24 m', '?', '7 m']), answer: 25,
        steps: ['7 × 7 = 49 and 24 × 24 = 576.', '49 + 576 = 625.', '25 × 25 = 625, so the long side is 25 meters.'] } },
      { why: 'Same math in a story', problem: { text: 'A garden is a rectangle 20 m long and 15 m wide. A path runs straight from one corner to the opposite corner. How long is the path, in meters?',
        picture: rt(15, 20, ['20 m', '?', '15 m']), answer: 25,
        steps: ['The path is the long side of a right triangle with short sides 20 m and 15 m.', '20 × 20 = 400 and 15 × 15 = 225. 400 + 225 = 625.', '25 × 25 = 625, so the path is 25 meters long.'] } },
    ],
  },

  // ── Topic 8 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g8m4-t8', title: 'Find a missing leg', skill: 'Find a leg of a right triangle from the hypotenuse and the other leg',
    bigIdea: 'When you know the long side, square it and take away the square of the short side you know. Then undo the square.',
    screens: [
      { title: 'A ladder on a wall', text: 'A ladder 5 m long leans on a wall. Its foot is 3 m from the wall. How high up the wall does it reach?',
        pictures: [rt(4, 3, ['3 m', '5 m', '?'])] },
      { title: 'This time the long side is known', text: 'Last time you added the squares to find the long side. Here the ladder is the long side. Adding would give a height longer than the ladder.',
        pictures: [rt(4, 3, ['3 m', '5 m', '?'])] },
      { title: 'The big idea', text: 'When you know the long side, square it and take away the square of the short side you know. Then undo the square.',
        pictures: [rt(4, 3, ['3 m', '5 m', '?'], [null, null, null])] },
      { title: 'The squares again', text: 'The square on the 5 m ladder holds 5 × 5 = 25. The square on the 3 m side holds 3 × 3 = 9.',
        pictures: [rt(4, 3, [null, null, null], ['9', '25', '?'], true)] },
      { title: 'Take away', text: 'The two small squares fill the big one. So the missing square is 25 − 9 = 16.',
        pictures: [rt(4, 3, [null, null, null], ['9', '25', '16'], true), { kind: 'eq', text: '25 − 9 = 16' }] },
      { title: 'Undo the square', text: '4 × 4 = 16. The ladder reaches 4 m up the wall.',
        pictures: [rt(4, 3, ['3 m', '5 m', '4 m'], ['9', '25', '16']), { kind: 'eq', text: '5² − 3² = 16', lines: ['4 × 4 = 16, so 4 m'] }] },
      { title: 'One thing not to do', text: "Don't add when the long side is the one you know. Its square is the total, so take away.",
        pictures: [{ kind: 'cards', wrong: '5² + 3² = 34', right: '5² − 3² = 16, so 4' }] },
    ],
    turn: {
      text: 'A right triangle has a long side of 10 cm and a short side of 6 cm. How long is the other short side, in cm?',
      picture: rt(8, 6, ['6 cm', '10 cm', '?']),
      answer: 8, steps: ['Square the long side: 10 × 10 = 100. Square the short side: 6 × 6 = 36.', 'Take away: 100 − 36 = 64.', '8 × 8 = 64, so the other short side is 8 cm.'],
      prompt: 'Square the long side, take away the square of the short side, then undo the square.',
      hint1: 'Which side is the long one? Square it, and square the short side.',
      hint2: 'Find 100 − 36. Which number times itself makes that?',
      twin: { text: 'A right triangle has a long side of 13 ft and a short side of 12 ft. How long is the other short side, in feet?',
        picture: rt(5, 12, ['12 ft', '13 ft', '?']),
        answer: 5, steps: ['Square the long side: 13 × 13 = 169. Square the short side: 12 × 12 = 144.', 'Take away: 169 − 144 = 25.', '5 × 5 = 25, so the other short side is 5 feet.'],
        hint1: 'Square the long side and the short side you know.', hint2: 'Take the smaller square away from the bigger one. Then undo the square.' },
    },
    won: { text: 'You took the square of the short side away from the square of the long side.', sticker: 'To find a missing leg: leg² = hypotenuse² − other leg².' },
    twinWon: { text: 'You took 12 squared away from 13 squared, and found 5.', sticker: 'To find a missing leg: leg² = hypotenuse² − other leg².' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'A right triangle has a hypotenuse of 15 cm and a leg of 9 cm. How long is the other leg, in cm?',
        picture: rt(12, 9, ['9 cm', '15 cm', '?']), answer: 12,
        steps: ['15 × 15 = 225 and 9 × 9 = 81.', '225 − 81 = 144.', '12 × 12 = 144, so the other leg is 12 cm.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'A right triangle has a hypotenuse of 17 m and a leg of 8 m. How long is the other leg, in meters?',
        picture: rt(8, 15, ['?', '17 m', '8 m']), answer: 15,
        steps: ['17 × 17 = 289 and 8 × 8 = 64.', '289 − 64 = 225.', '15 × 15 = 225, so the other leg is 15 meters.'] } },
      { why: 'Still "take away the squares"', problem: { text: 'A right triangle has a hypotenuse of 25 in and a leg of 24 in. How long is the other leg, in inches?',
        picture: rt(7, 24, ['24 in', '25 in', '?']), answer: 7,
        steps: ['25 × 25 = 625 and 24 × 24 = 576.', '625 − 576 = 49.', '7 × 7 = 49, so the other leg is 7 inches.'] } },
      { why: 'A little harder', problem: { text: 'A right triangle has a hypotenuse of 29 cm and a leg of 20 cm. How long is the other leg, in cm?',
        picture: rt(21, 20, ['20 cm', '29 cm', '?']), answer: 21,
        steps: ['29 × 29 = 841 and 20 × 20 = 400.', '841 − 400 = 441.', '21 × 21 = 441, so the other leg is 21 cm.'] } },
      { why: 'Same math in a story', problem: { text: 'A ladder 26 ft long leans against a wall. Its foot is 10 ft from the wall. How high up the wall does the ladder reach, in feet?',
        picture: rt(24, 10, ['10 ft', '26 ft', '?']), answer: 24,
        steps: ['The ladder is the hypotenuse, and the ground is one leg.', '26 × 26 = 676 and 10 × 10 = 100. 676 − 100 = 576.', '24 × 24 = 576, so the ladder reaches 24 feet up the wall.'] } },
    ],
  },

  // ── Topic 9 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g8m4-t9', title: 'Distance between two points', skill: 'Find the distance between two points on the coordinate plane with the Pythagorean theorem',
    bigIdea: 'Draw a right triangle between the two points. Count its legs on the grid, then find the hypotenuse.',
    screens: [
      { title: 'Two towns on a map', text: 'Two towns are at (1, 1) and (4, 5) on a map grid. Each square is 1 mile. How far apart are they in a straight line?',
        pictures: [dist(0, 8, [1, 1], [4, 5], 'points')] },
      { title: 'The path is on a slant', text: 'The straight path cuts across squares on a slant. Counting squares along it does not give its length.',
        pictures: [dist(0, 8, [1, 1], [4, 5], 'line')] },
      { title: 'The big idea', text: 'Draw a right triangle between the two points. Count its legs on the grid, then find the hypotenuse.',
        pictures: [dist(0, 8, [1, 1], [4, 5], 'legs')] },
      { title: 'Draw the legs', text: 'Go straight across from (1, 1), then straight up to (4, 5). The path across and the path up meet at a square corner, so this is a right triangle.',
        pictures: [dist(0, 8, [1, 1], [4, 5], 'legs', ['', ''], true)] },
      { title: 'Count the legs', text: 'Across: 4 − 1 = 3. Up: 5 − 1 = 4. The legs are 3 and 4 miles.',
        pictures: [dist(0, 8, [1, 1], [4, 5], 'counts', ['', ''], true), { kind: 'eq', text: '4 − 1 = 3', lines: ['5 − 1 = 4'] }] },
      { title: 'Find the hypotenuse', text: '3 × 3 + 4 × 4 = 9 + 16 = 25, and 5 × 5 = 25. The towns are 5 miles apart.',
        pictures: [dist(0, 8, [1, 1], [4, 5], 'counts'), { kind: 'eq', text: '3² + 4² = 25', lines: ['5 × 5 = 25, so 5 miles'] }] },
      { title: 'One thing not to do', text: "Don't add the legs. 3 + 4 = 7 is the walk along the grid lines, not the straight line.",
        pictures: [{ kind: 'cards', wrong: '3 + 4 = 7 miles', right: '3² + 4² = 25, so 5 miles' }] },
    ],
    turn: {
      text: 'How far apart are the points (2, 1) and (8, 9), in units?',
      picture: dist(0, 9, [2, 1], [8, 9], 'points'),
      answer: 10, steps: ['Across: 8 − 2 = 6. Up: 9 − 1 = 8.', 'Square the legs and add: 36 + 64 = 100.', '10 × 10 = 100, so the distance is 10 units.'],
      prompt: 'Find how far across and how far up. Those are the legs.',
      hint1: 'How far across and how far up is it from one point to the other?',
      hint2: 'Square the across and up numbers, then add. Which number times itself makes the total?',
      twin: { text: 'How far apart are the points (1, 2) and (6, 14), in units?',
        picture: dist(0, 14, [1, 2], [6, 14], 'points'),
        answer: 13, steps: ['Across: 6 − 1 = 5. Up: 14 − 2 = 12.', 'Square the legs and add: 25 + 144 = 169.', '13 × 13 = 169, so the distance is 13 units.'],
        hint1: 'Subtract the x-coordinates. Then subtract the y-coordinates.', hint2: 'Square those two numbers and add. Which number times itself makes the total?' },
    },
    won: { text: 'You drew a right triangle and found its hypotenuse.', sticker: 'The distance between two points is the hypotenuse of the right triangle drawn between them.' },
    twinWon: { text: 'You made a right triangle from (1, 2) to (6, 14) and found its hypotenuse, 13.', sticker: 'The distance between two points is the hypotenuse of the right triangle drawn between them.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'How far apart are the points (1, 2) and (4, 6), in units?',
        picture: dist(0, 8, [1, 2], [4, 6], 'points'), answer: 5,
        steps: ['Across: 4 − 1 = 3. Up: 6 − 2 = 4.', '9 + 16 = 25.', '5 × 5 = 25, so the distance is 5 units.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'How far apart are the points (1, 0) and (10, 12), in units?',
        picture: dist(0, 12, [1, 0], [10, 12], 'points'), answer: 15,
        steps: ['Across: 10 − 1 = 9. Up: 12 − 0 = 12.', '81 + 144 = 225.', '15 × 15 = 225, so the distance is 15 units.'] } },
      { why: 'Still "a right triangle on the grid"', problem: { text: 'How far apart are the points (3, 2) and (11, 17), in units?',
        picture: dist(0, 18, [3, 2], [11, 17], 'points'), answer: 17,
        steps: ['Across: 11 − 3 = 8. Up: 17 − 2 = 15.', '64 + 225 = 289.', '17 × 17 = 289, so the distance is 17 units.'] } },
      { why: 'A little harder', problem: { text: 'How far apart are the points (−4, −3) and (2, 5), in units?',
        picture: dist(-6, 6, [-4, -3], [2, 5], 'points'), answer: 10,
        steps: ['Across: 2 − (−4) = 6. Up: 5 − (−3) = 8.', '36 + 64 = 100.', '10 × 10 = 100, so the distance is 10 units.'] } },
      { why: 'Same math in a story', problem: { text: 'On a city map, the school is at (2, 3) and the library is at (14, 8). Each square is 1 block. How many blocks apart are they in a straight line?',
        picture: dist(0, 14, [2, 3], [14, 8], 'points', ['school ', 'library ']), answer: 13,
        steps: ['Across: 14 − 2 = 12. Up: 8 − 3 = 5.', '144 + 25 = 169.', '13 × 13 = 169, so they are 13 blocks apart.'] } },
    ],
  },
]
