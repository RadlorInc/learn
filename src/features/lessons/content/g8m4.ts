/**
 * Grade 8 · Module 4 — Congruence, similarity and the Pythagorean theorem.
 * Written to docs/new-flow/AUTHORING.md. Not yet reviewed by the founder.
 * Topics 1–8 draw with `poly` (1–4 on a hand-built plane: grid + axes + numbered ticks); topic 9 with `coord`.
 */
import type { Lesson, Picture } from '../script'
import { attachChalk } from '../chalk'
import { G8M4_CHALK } from './chalk/g8m4'

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
    bigIdea: "In a slide, every point moves the same distance in the same direction.",
    screens: [
      { title: 'Move the sticker', text: 'A triangle sticker sits on a grid. You slide it 4 squares right and 2 squares up, without turning it. Where does it land?',
        pictures: [plane(0, 8, [orig([[1, 1], [3, 1], [1, 3]])])] },
      { title: "Dragging is not exact", text: "You could just drag it across and hope it lands right. But where exactly does it land? Hoping can't tell you. You need the new spot of every single corner.",
        beats: [
          { say: "You could just drag it across and hope it lands right.", pic: 0 },
          { say: "But where exactly does it land? Hoping can't tell you." },
          { say: "You need the new spot of every single corner." },
        ],
        pictures: [plane(0, 8, [orig([[1, 1], [3, 1], [1, 3]])], { segs: [arrow([2, 2], [6, 4], '?')] })] },
      { title: "The big idea", text: "In a slide, every point moves the same distance in the same direction.",
        beats: [
          { say: "In a slide, every point moves the same distance in the same direction.", pic: 0 },
        ],
        pictures: [plane(0, 8, [orig([[1, 1], [3, 1], [1, 3]]), img([[5, 3], [7, 3], [5, 5]])], { segs: [arrow([1, 1], [5, 3])] })] },
      { title: "Follow one corner", text: "Take corner A. It starts at (1, 1). Move it 4 to the right, and x goes from 1 up to 5. Move it 2 up, and y goes from 1 up to 3. So A lands on (5, 3). We call that new point A prime.",
        beats: [
          { say: "Take corner A. It starts at (1, 1).", pic: 0 },
          { say: "Move it 4 to the right, and x goes from 1 up to 5." },
          { say: "Move it 2 up, and y goes from 1 up to 3." },
          { say: "So A lands on (5, 3). We call that new point A prime." },
        ],
        pictures: [plane(0, 8, [orig([[1, 1], [3, 1], [1, 3]])], { motion: true, segs: [arrow([1, 1], [5, 1], '4 right'), arrow([5, 1], [5, 3], '2 up')], labels: [{ at: [5.5, 3.4], text: 'A′', tone: 2 }] })] },
      { title: "Every corner moves the same", text: "The other two corners do the same thing. B at (3, 1) goes to (7, 3). C at (1, 3) goes to (5, 5). Every corner went 4 right and 2 up. Nothing stretched and nothing turned, so it is the same triangle, just moved.",
        beats: [
          { say: "The other two corners do the same thing.", pic: 0 },
          { say: "B at (3, 1) goes to (7, 3). C at (1, 3) goes to (5, 5).", pic: 1 },
          { say: "Every corner went 4 right and 2 up." },
          { say: "Nothing stretched and nothing turned, so it is the same triangle, just moved." },
        ],
        pictures: [plane(0, 8, [orig([[1, 1], [3, 1], [1, 3]]), img([[5, 3], [7, 3], [5, 5]])], { motion: true, segs: [arrow([1, 1], [5, 3]), arrow([3, 1], [7, 3]), arrow([1, 3], [5, 5])] }),
          { kind: 'eq', text: 'A (1, 1) → A′ (5, 3)', lines: ['B (3, 1) → B′ (7, 3)', 'C (1, 3) → C′ (5, 5)'] }] },
      { title: "Right and up add", text: "Is there a rule that works for every point? Yes. Right adds to x, and left takes away from x. Up adds to y, and down takes away from y. So for 4 right and 2 up, every point (x, y) becomes (x + 4, y + 2).",
        beats: [
          { say: "Is there a rule that works for every point? Yes.", pic: 0 },
          { say: "Right adds to x, and left takes away from x." },
          { say: "Up adds to y, and down takes away from y." },
          { say: "So for 4 right and 2 up, every point (x, y) becomes (x + 4, y + 2).", pic: 1 },
        ],
        pictures: [plane(0, 8, [orig([[1, 1], [3, 1], [1, 3]]), img([[5, 3], [7, 3], [5, 5]])]), { kind: 'eq', text: '(x, y) → (x + 4, y + 2)' }] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't add the right move to y. Right and left change x, the FIRST number. Up and down change y, the second one. So 4 right and 2 up takes (1, 1) to (5, 3). Not to (3, 5). Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't add the right move to y. Right and left change x, the FIRST number.", pic: 0 },
          { say: "Up and down change y, the second one." },
          { say: "So 4 right and 2 up takes (1, 1) to (5, 3). Not to (3, 5)." },
          { say: "Okay. Your turn." },
        ],
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
    bigIdea: "Flip over the x-axis and the y changes sign, flip over the y-axis and the x changes sign.",
    screens: [
      { title: 'A picture in the lake', text: 'A triangle sits above the edge of a lake, and the edge is the x-axis. Its picture in the water is upside down. Where is each corner of the picture?',
        pictures: [plane(-5, 5, [orig([[2, 1], [4, 1], [2, 3]])])] },
      { title: "A slide will not match", text: "Could we just slide the triangle straight down? Look. It comes out the same way up. But the picture in the water is upside down, so a slide can't make it.",
        beats: [
          { say: "Could we just slide the triangle straight down?", pic: 0 },
          { say: "Look. It comes out the same way up." },
          { say: "But the picture in the water is upside down, so a slide can't make it." },
        ],
        pictures: [plane(-5, 5, [orig([[2, 1], [4, 1], [2, 3]]), { pts: [[2, -3], [4, -3], [2, -1]], tone: 3, dashed: true }])] },
      { title: "The big idea", text: "Flip over the x-axis and the y changes sign, flip over the y-axis and the x changes sign.",
        beats: [
          { say: "Flip over the x-axis and the y changes sign, flip over the y-axis and the x changes sign.", pic: 0 },
        ],
        pictures: [plane(-5, 5, [orig([[2, 1], [4, 1], [2, 3]]), img([[2, -1], [4, -1], [2, -3]])])] },
      { title: "Same distance, other side", text: "Look at corner A, at (2, 1). It sits 1 square above the x-axis. Its picture sits 1 square below, straight down. Same distance, other side. So A at (2, 1) becomes A′ at (2, −1).",
        beats: [
          { say: "Look at corner A, at (2, 1). It sits 1 square above the x-axis.", pic: 0 },
          { say: "Its picture sits 1 square below, straight down. Same distance, other side." },
          { say: "So A at (2, 1) becomes A′ at (2, −1)." },
        ],
        pictures: [plane(-5, 5, [orig([[2, 1], [4, 1], [2, 3]])], { motion: true, segs: [{ a: [2, 1], b: [2, -1], arrow: 'end', dashed: true, tone: 2 }], labels: [{ at: [1.4, -1.4], text: 'A′', tone: 2 }] })] },
      { title: "Only y changes", text: "The other corners do the same. B at (4, 1) drops to (4, −1). C at (2, 3) drops to (2, −3). Look down the list. Every x stayed the same, and every y flipped its sign.",
        beats: [
          { say: "The other corners do the same.", pic: 0 },
          { say: "B at (4, 1) drops to (4, −1). C at (2, 3) drops to (2, −3).", pic: 1 },
          { say: "Look down the list. Every x stayed the same, and every y flipped its sign." },
        ],
        pictures: [plane(-5, 5, [orig([[2, 1], [4, 1], [2, 3]]), img([[2, -1], [4, -1], [2, -3]])], { motion: true }),
          { kind: 'eq', text: 'A (2, 1) → A′ (2, −1)', lines: ['B (4, 1) → B′ (4, −1)', 'C (2, 3) → C′ (2, −3)'] }] },
      { title: "Flip over the y-axis", text: "Now flip the same triangle the other way, over the y-axis. It swings across to the left. A at (2, 1) lands on (−2, 1). This time y stays put, and it is x that changes sign.",
        beats: [
          { say: "Now flip the same triangle the other way, over the y-axis.", pic: 0 },
          { say: "It swings across to the left. A at (2, 1) lands on (−2, 1)." },
          { say: "This time y stays put, and it is x that changes sign.", pic: 1 },
        ],
        pictures: [plane(-5, 5, [orig([[2, 1], [4, 1], [2, 3]]), img([[-2, 1], [-4, 1], [-2, 3]])], { motion: true }), { kind: 'eq', text: '(x, y) → (−x, y)' }] },
      { title: "One thing not to do", text: "Here's the part people mix up. A flip over the x-axis does NOT change x. The point moves straight down, so only the y changes. So (2, 1) becomes (2, −1), not (−2, 1). Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "A flip over the x-axis does NOT change x.", pic: 0 },
          { say: "The point moves straight down, so only the y changes." },
          { say: "So (2, 1) becomes (2, −1), not (−2, 1)." },
          { say: "Okay. Your turn." },
        ],
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
    bigIdea: "A quarter turn counterclockwise around (0, 0) sends (x, y) to (−y, x).",
    screens: [
      { title: 'Spin the board', text: 'A triangle is drawn on a board pinned at (0, 0). The board turns a quarter turn counterclockwise. Where does the triangle land?',
        pictures: [plane(-5, 5, [orig([[3, 1], [4, 1], [3, 3]])], { segs: [{ a: [0, 0], b: [3, 1], dashed: true }] })] },
      { title: "Counting squares will not work", text: "Can we just count squares, like a slide? No. Each corner swings around (0, 0) on its own circle. A corner far from the center travels farther than a close one, so no single count works.",
        beats: [
          { say: "Can we just count squares, like a slide?", pic: 0 },
          { say: "No. Each corner swings around (0, 0) on its own circle." },
          { say: "A corner far from the center travels farther than a close one, so no single count works." },
        ],
        pictures: [plane(-5, 5, [orig([[3, 1], [4, 1], [3, 3]])], { segs: [{ a: [0, 0], b: [3, 1], dashed: true }, { a: [0, 0], b: [3, 3], dashed: true }] })] },
      { title: "The big idea", text: "A quarter turn counterclockwise around (0, 0) sends (x, y) to (−y, x).",
        beats: [
          { say: "A quarter turn counterclockwise around (0, 0) sends (x, y) to (−y, x).", pic: 0 },
        ],
        pictures: [plane(-5, 5, [orig([[3, 1], [4, 1], [3, 3]]), img([[-1, 3], [-1, 4], [-3, 3]])], { segs: [{ a: [0, 0], b: [3, 1], dashed: true }, { a: [0, 0], b: [-1, 3], dashed: true, tone: 2 }] })] },
      { title: "Follow A", text: "Follow corner A, at (3, 1). That is 3 right and 1 up from the center. Turn that arm a quarter turn, the way a clock hand goes backward. Now it points 1 left and 3 up. So A′ is at (−1, 3).",
        beats: [
          { say: "Follow corner A, at (3, 1). That is 3 right and 1 up from the center.", pic: 0 },
          { say: "Turn that arm a quarter turn, the way a clock hand goes backward." },
          { say: "Now it points 1 left and 3 up. So A′ is at (−1, 3)." },
        ],
        pictures: [plane(-5, 5, [orig([[3, 1], [4, 1], [3, 3]])], { motion: true, segs: [{ a: [0, 0], b: [3, 1], dashed: true }, { a: [0, 0], b: [-1, 3], dashed: true, tone: 2 }], labels: [{ at: [-1.5, 3.5], text: 'A′', tone: 2 }] })] },
      { title: "Swap, then change a sign", text: "Look at what happened to the numbers. They swapped places, and then the new first number changed sign. Check B. (4, 1) swaps to (1, 4), and the sign change gives (−1, 4). C at (3, 3) goes to (−3, 3). Same rule.",
        beats: [
          { say: "Look at what happened to the numbers.", pic: 0 },
          { say: "They swapped places, and then the new first number changed sign." },
          { say: "Check B. (4, 1) swaps to (1, 4), and the sign change gives (−1, 4).", pic: 1 },
          { say: "C at (3, 3) goes to (−3, 3). Same rule." },
        ],
        pictures: [plane(-5, 5, [orig([[3, 1], [4, 1], [3, 3]]), img([[-1, 3], [-1, 4], [-3, 3]])], { motion: true }),
          { kind: 'eq', text: 'A (3, 1) → A′ (−1, 3)', lines: ['B (4, 1) → B′ (−1, 4)', 'C (3, 3) → C′ (−3, 3)'] }] },
      { title: "A half turn", text: "Now turn twice as far, until the board faces the other way. That is a half turn, 180°. Nothing swaps this time. Both signs change. So A at (3, 1) goes to (−3, −1).",
        beats: [
          { say: "Now turn twice as far, until the board faces the other way.", pic: 0 },
          { say: "That is a half turn, 180°." },
          { say: "Nothing swaps this time. Both signs change.", pic: 1 },
          { say: "So A at (3, 1) goes to (−3, −1)." },
        ],
        pictures: [plane(-5, 5, [orig([[3, 1], [4, 1], [3, 3]]), img([[-3, -1], [-4, -1], [-3, -3]])], { motion: true, segs: [{ a: [3, 1], b: [-3, -1], dashed: true }] }),
          { kind: 'eq', text: '(x, y) → (−x, −y)' }] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't just swap the numbers and STOP. A swap is only half the job. Change the sign of the new first number, so (3, 1) goes to (−1, 3). Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't just swap the numbers and STOP.", pic: 0 },
          { say: "A swap is only half the job." },
          { say: "Change the sign of the new first number, so (3, 1) goes to (−1, 3)." },
          { say: "Okay. Your turn." },
        ],
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
    bigIdea: "To stretch a shape from (0, 0), multiply both coordinates of every point by the same number.",
    screens: [
      { title: 'Make the photo bigger', text: 'You make a triangle picture twice as big, and the corner (0, 0) stays put. Where do the triangle\'s corners go?',
        pictures: [plane(0, 8, [orig([[2, 1], [4, 1], [2, 3]])])] },
      { title: "Adding does not stretch", text: "What if we just add 2 to every number? Look. The triangle only slides over. It is the same size as before. But we want every side twice as long.",
        beats: [
          { say: "What if we just add 2 to every number?", pic: 0 },
          { say: "Look. The triangle only slides over. It is the same size as before." },
          { say: "But we want every side twice as long." },
        ],
        pictures: [plane(0, 8, [orig([[2, 1], [4, 1], [2, 3]]), { pts: [[4, 3], [6, 3], [4, 5]], tone: 3, dashed: true }])] },
      { title: "The big idea", text: "To stretch a shape from (0, 0), multiply both coordinates of every point by the same number.",
        beats: [
          { say: "To stretch a shape from (0, 0), multiply both coordinates of every point by the same number.", pic: 0 },
        ],
        pictures: [plane(0, 8, [orig([[2, 1], [4, 1], [2, 3]]), img([[4, 2], [8, 2], [4, 6]])])] },
      { title: "Multiply one corner", text: "Start with corner A, at (2, 1). Multiply both numbers by 2, and you get (4, 2). A′ lands on the same straight line out from (0, 0), just twice as far along it.",
        beats: [
          { say: "Start with corner A, at (2, 1).", pic: 0 },
          { say: "Multiply both numbers by 2, and you get (4, 2)." },
          { say: "A′ lands on the same straight line out from (0, 0), just twice as far along it." },
        ],
        pictures: [plane(0, 8, [orig([[2, 1], [4, 1], [2, 3]])], { motion: true, segs: [{ a: [0, 0], b: [4, 2], dashed: true, arrow: 'end', tone: 2 }], labels: [{ at: [4.3, 2.6], text: 'A′', tone: 2 }] })] },
      { title: "Every corner", text: "Do the same to the other two. B at (4, 1) doubles to (8, 2). C at (2, 3) doubles to (4, 6). Now measure a side. The bottom was 2 squares long, and now it is 4. Every side is twice as long.",
        beats: [
          { say: "Do the same to the other two.", pic: 0 },
          { say: "B at (4, 1) doubles to (8, 2). C at (2, 3) doubles to (4, 6).", pic: 1 },
          { say: "Now measure a side. The bottom was 2 squares long, and now it is 4." },
          { say: "Every side is twice as long." },
        ],
        pictures: [plane(0, 8, [orig([[2, 1], [4, 1], [2, 3]]), img([[4, 2], [8, 2], [4, 6]])], { motion: true, segs: [{ a: [0, 0], b: [8, 2], dashed: true }, { a: [0, 0], b: [4, 6], dashed: true }] }),
          { kind: 'eq', text: 'A (2, 1) → A′ (4, 2)', lines: ['B (4, 1) → B′ (8, 2)', 'C (2, 3) → C′ (4, 6)'] }] },
      { title: "Shrinking works the same way", text: "Can the same move shrink a shape? Yes. Multiply by 1/2, and (8, 2) goes right back to (4, 1). A number bigger than 1 grows the shape. A number smaller than 1 shrinks it.",
        beats: [
          { say: "Can the same move shrink a shape? Yes.", pic: 0 },
          { say: "Multiply by 1/2, and (8, 2) goes right back to (4, 1).", pic: 1 },
          { say: "A number bigger than 1 grows the shape. A number smaller than 1 shrinks it." },
        ],
        pictures: [plane(0, 8, [orig([[2, 1], [4, 1], [2, 3]]), img([[4, 2], [8, 2], [4, 6]])]), { kind: 'eq', text: '(x, y) → (2x, 2y)', lines: ['(8, 2) × 1/2 → (4, 1)'] }] },
      { title: "One thing not to do", text: "Here's the part people mix up. Twice as big does NOT mean add 2. Adding 2 to (2, 1) gives (4, 3), and that only slides it. Multiply both numbers, so (2, 1) becomes (4, 2). Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Twice as big does NOT mean add 2.", pic: 0 },
          { say: "Adding 2 to (2, 1) gives (4, 3), and that only slides it." },
          { say: "Multiply both numbers, so (2, 1) becomes (4, 2)." },
          { say: "Okay. Your turn." },
        ],
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
    bigIdea: "Triangles with the same angles have every side multiplied by the same number.",
    screens: [
      { title: 'Two signs', text: 'Two triangle signs have the same shape, and one is bigger. The small one has sides 4, 3 and 2 feet. The big one has sides 8, 6 and ? feet. How long is the missing side?',
        pictures: [pair(['4 ft', '3 ft', '2 ft'], ['8 ft', '6 ft', '? ft'])] },
      { title: "Adding does not match", text: "Did every side just grow by the same amount? Let's test it. The bottom went from 4 to 8. That is 4 more. But the 3 foot side went to 6, and that is only 3 more. Different amounts, so adding is not what happened.",
        beats: [
          { say: "Did every side just grow by the same amount? Let's test it.", pic: 0 },
          { say: "The bottom went from 4 to 8. That is 4 more." },
          { say: "But the 3 foot side went to 6, and that is only 3 more." },
          { say: "Different amounts, so adding is not what happened." },
        ],
        pictures: [pair(['4 ft', '3 ft', '2 ft'], ['8 ft', '6 ft', '? ft'])] },
      { title: "The big idea", text: "Triangles with the same angles have every side multiplied by the same number.",
        beats: [
          { say: "Triangles with the same angles have every side multiplied by the same number.", pic: 0 },
        ],
        pictures: [pair(['4 ft', '3 ft', '2 ft'], ['8 ft', '6 ft', '? ft'], true)] },
      { title: "Match the corners", text: "Look at the corners first, not the sides. Each corner of the big sign has the same angle as a corner of the small one. So each big side matches the small side in the same place.",
        beats: [
          { say: "Look at the corners first, not the sides.", pic: 0 },
          { say: "Each corner of the big sign has the same angle as a corner of the small one." },
          { say: "So each big side matches the small side in the same place." },
        ],
        pictures: [pair([null, null, null], [null, null, null], true, true)] },
      { title: "Find the number", text: "Pick a pair where you know both sides, the bottoms, 4 and 8. 8 ÷ 4 = 2, so the big side is 2 times as long. Check a second pair. 3 × 2 = 6, and the big sign says 6.",
        beats: [
          { say: "Pick a pair where you know both sides, the bottoms, 4 and 8.", pic: 0 },
          { say: "8 ÷ 4 = 2, so the big side is 2 times as long." },
          { say: "Check a second pair. 3 × 2 = 6, and the big sign says 6.", pic: 1 },
        ],
        pictures: [pair(['4 ft', '3 ft', '2 ft'], ['8 ft', '6 ft', '? ft'], false, true), { kind: 'eq', text: '8 ÷ 4 = 2', lines: ['3 × 2 = 6 ✓'] }] },
      { title: "Multiply", text: "Now the side we came for. It matches the 2 foot side on the small sign. So 2 × 2 = 4. The missing side is 4 feet.",
        beats: [
          { say: "Now the side we came for.", pic: 0 },
          { say: "It matches the 2 foot side on the small sign." },
          { say: "So 2 × 2 = 4. The missing side is 4 feet.", pic: 1 },
        ],
        pictures: [pair(['4 ft', '3 ft', '2 ft'], ['8 ft', '6 ft', '4 ft']), { kind: 'eq', text: '2 × 2 = 4', lines: ['4 feet'] }] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't ADD the difference you saw. 2 + 4 = 6 feet gives a sign with a different shape. Multiply by 2 every time, so 2 × 2 = 4 feet. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't ADD the difference you saw.", pic: 0 },
          { say: "2 + 4 = 6 feet gives a sign with a different shape." },
          { say: "Multiply by 2 every time, so 2 × 2 = 4 feet." },
          { say: "Okay. Your turn." },
        ],
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
      { title: 'No way to measure', text: 'Now, you cannot just go and measure that one. The top corner is way up on the roof, and nobody is holding a protractor up there. So we need a rule that finds the angle without measuring it at all.',
        beats: [
          { say: 'Now, you cannot just go and measure that one.', pic: 0 },
          { say: 'The top corner is way up on the roof, and nobody is holding a protractor up there.' },
          { say: 'So we need a rule that finds the angle without measuring it at all.', write: 'find it, do not measure it' },
        ],
        pictures: [tri(50, 60, ['50°', '60°', '?'])] },
      { title: 'The big idea', text: 'The three angles inside a triangle always add to 180°. The angle outside one corner equals the two far inside angles added.',
        beats: [
          { say: 'The three angles inside a triangle always add to 180°.', pic: 0 },
          { say: 'The angle outside one corner equals the two far inside angles added.' },
        ],
        pictures: [tri(50, 60, ['50°', '60°', '?'])] },
      { title: 'Tear off the corners', text: 'Here is something you can try with paper. Tear the three corners off a paper triangle, then push their points together. They line up. Every time, they make one straight line, and a straight line is 180°.',
        beats: [
          { say: 'Here is something you can try with paper.' },
          { say: 'Tear the three corners off a paper triangle, then push their points together.', pic: 0 },
          { say: 'They line up. Every time, they make one straight line, and a straight line is 180°.', write: 'straight line = 180°' },
        ],
        pictures: [{ kind: 'poly', motion: true, shapes: [], segs: [
          { a: [-4, 0], b: [4, 0] },
          { a: [0, 0], b: [3.5 * Math.cos(50 * Math.PI / 180), 3.5 * Math.sin(50 * Math.PI / 180)], tone: 2 },
          { a: [0, 0], b: [3.5 * Math.cos(120 * Math.PI / 180), 3.5 * Math.sin(120 * Math.PI / 180)], tone: 2 },
        ], labels: [
          { at: [1.6 * Math.cos(25 * Math.PI / 180), 1.6 * Math.sin(25 * Math.PI / 180)], text: '50°', tone: 1 },
          { at: [1.6 * Math.cos(85 * Math.PI / 180), 1.6 * Math.sin(85 * Math.PI / 180)], text: '70°', tone: 1 },
          { at: [1.6 * Math.cos(150 * Math.PI / 180), 1.6 * Math.sin(150 * Math.PI / 180)], text: '60°', tone: 1 },
        ] }] },
      { title: 'Take away from 180', text: 'So back to the roof. Add up the two angles you were given. 50 + 60 = 110, and the third one is whatever is left over out of 180. 180 − 110 = 70. The top angle is 70°.',
        beats: [
          { say: 'So back to the roof. Add up the two angles you were given.' },
          { say: '50 + 60 = 110, and the third one is whatever is left over out of 180.', pic: 1 },
          { say: '180 − 110 = 70. The top angle is 70°.', pic: 0 },
        ],
        pictures: [tri(50, 60, ['50°', '60°', '70°'], undefined, true), { kind: 'eq', text: '50 + 60 = 110', lines: ['180 − 110 = 70'] }] },
      { title: 'The angle outside', text: 'Now stretch the bottom side out past the 60° corner. The angle that opens up outside is 180 − 60 = 120°. Here is the neat part. That is exactly the two far angles added together: 50 + 70 = 120.',
        beats: [
          { say: 'Now stretch the bottom side out past the 60° corner.', pic: 0 },
          { say: 'The angle that opens up outside is 180 − 60 = 120°.' },
          { say: 'Here is the neat part. That is exactly the two far angles added together: 50 + 70 = 120.', pic: 1, write: 'outside angle = the two far angles' },
        ],
        pictures: [tri(50, 60, ['50°', '60°', '70°'], '120°', true), { kind: 'eq', text: '50 + 70 = 120' }] },
      { title: 'One thing not to do', text: "This is the one that catches people out. Don't stop after adding the two angles you know. That total is not the answer. Take it away from 180° first.",
        beats: [
          { say: 'This is the one that catches people out.' },
          { say: "Don't stop after adding the two angles you know.", pic: 0 },
          { say: 'That total is not the answer. Take it away from 180° first.' },
        ],
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
      { title: 'Adding the sides is too long', text: 'Your first thought might be to add: 4 + 3 = 7. But look at what 7 really is. That is the long way, around the corner. The straight path has to be shorter than 7, so adding is not the rule we want.',
        beats: [
          { say: 'Your first thought might be to add: 4 + 3 = 7.', pic: 0 },
          { say: 'But look at what 7 really is. That is the long way, around the corner.' },
          { say: 'The straight path has to be shorter than 7, so adding is not the rule we want.', write: 'straight across is shorter than 7' },
        ],
        pictures: [rt(3, 4, ['4 blocks', '?', '3 blocks'])] },
      { title: 'The big idea', text: 'In a right triangle, square the two short sides and add them. That makes the square of the long side.',
        beats: [
          { say: 'In a right triangle, square the two short sides and add them.', pic: 0 },
          { say: 'That makes the square of the long side.' },
        ],
        pictures: [rt(3, 4, ['4', null, '3'], [null, null, null])] },
      { title: 'Build a square on each side', text: 'Watch this. Draw a square out from each side of the triangle. The square sitting on the 3 side holds 3 × 3 = 9 little squares. The one on the 4 side holds 4 × 4 = 16.',
        beats: [
          { say: 'Watch this. Draw a square out from each side of the triangle.', pic: 0 },
          { say: 'The square sitting on the 3 side holds 3 × 3 = 9 little squares.' },
          { say: 'The one on the 4 side holds 4 × 4 = 16.' },
        ],
        pictures: [rt(3, 4, [null, null, null], ['16', '?', '9'], true)] },
      { title: 'The small squares fill the big one', text: 'Now tip those two squares into the big one on the long side. 9 + 16 = 25. The big square holds exactly 25 little squares. Not one over, not one short.',
        beats: [
          { say: 'Now tip those two squares into the big one on the long side.', pic: 0 },
          { say: '9 + 16 = 25.', pic: 1 },
          { say: 'The big square holds exactly 25 little squares. Not one over, not one short.' },
        ],
        pictures: [rt(3, 4, [null, null, null], ['16', '25', '9'], true), { kind: 'eq', text: '9 + 16 = 25' }] },
      { title: 'Undo the square', text: 'So the long side, squared, is 25. Now work backward. Which number times itself makes 25? 5 × 5 = 25. So the path straight across the park is 5 blocks.',
        beats: [
          { say: 'So the long side, squared, is 25. Now work backward. Which number times itself makes 25?', write: '? × ? = 25' },
          { say: '5 × 5 = 25.', pic: 0 },
          { say: 'So the path straight across the park is 5 blocks.', pic: 1 },
        ],
        pictures: [rt(3, 4, ['4', '5', '3'], ['16', '25', '9']), { kind: 'eq', text: '3² + 4² = 25', lines: ['5 × 5 = 25, so 5 blocks'] }] },
      { title: 'One thing not to do', text: "One last time, because this is the whole point. Don't add the sides themselves. Add their squares, and then find the number that times itself gives you that total.",
        beats: [
          { say: 'One last time, because this is the whole point.' },
          { say: "Don't add the sides themselves.", pic: 0 },
          { say: 'Add their squares, and then find the number that times itself gives you that total.' },
        ],
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
      { title: 'This time the long side is known', text: 'Careful here, because something has changed. Last time you added the squares to find the long side. This time the ladder is the long side, and it is the one you already know. If you added, you would get a height longer than the ladder itself, and that cannot happen.',
        beats: [
          { say: 'Careful here, because something has changed.', pic: 0 },
          { say: 'Last time you added the squares to find the long side. This time the ladder is the long side, and it is the one you already know.', write: 'the long side is the one we know' },
          { say: 'If you added, you would get a height longer than the ladder itself, and that cannot happen.' },
        ],
        pictures: [rt(4, 3, ['3 m', '5 m', '?'])] },
      { title: 'The big idea', text: 'When you know the long side, square it and take away the square of the short side you know. Then undo the square.',
        beats: [
          { say: 'When you know the long side, square it and take away the square of the short side you know.', pic: 0 },
          { say: 'Then undo the square.' },
        ],
        pictures: [rt(4, 3, ['3 m', '5 m', '?'], [null, null, null])] },
      { title: 'The squares again', text: 'Build the squares again, the same way you did before. The square on the 5 meter ladder holds 5 × 5 = 25. The square on the 3 meter side holds 3 × 3 = 9. And the third one is the square we are hunting for.',
        beats: [
          { say: 'Build the squares again, the same way you did before.', pic: 0 },
          { say: 'The square on the 5 meter ladder holds 5 × 5 = 25. The square on the 3 meter side holds 3 × 3 = 9.' },
          { say: 'And the third one is the square we are hunting for.' },
        ],
        pictures: [rt(4, 3, [null, null, null], ['9', '25', '?'], true)] },
      { title: 'Take away', text: 'Remember the rule: the two small squares together fill the big one exactly. So the missing square is whatever is left when you take 9 out of 25. 25 − 9 = 16.',
        beats: [
          { say: 'Remember the rule: the two small squares together fill the big one exactly.', write: 'big square − the small square we know' },
          { say: 'So the missing square is whatever is left when you take 9 out of 25.', pic: 0 },
          { say: '25 − 9 = 16.', pic: 1 },
        ],
        pictures: [rt(4, 3, [null, null, null], ['9', '25', '16'], true), { kind: 'eq', text: '25 − 9 = 16' }] },
      { title: 'Undo the square', text: 'Now undo the square, just like last lesson. Which number times itself makes 16? 4 × 4 = 16. So the ladder reaches 4 meters up the wall.',
        beats: [
          { say: 'Now undo the square, just like last lesson.', write: '? × ? = 16' },
          { say: 'Which number times itself makes 16? 4 × 4 = 16.', pic: 0 },
          { say: 'So the ladder reaches 4 meters up the wall.', pic: 1 },
        ],
        pictures: [rt(4, 3, ['3 m', '5 m', '4 m'], ['9', '25', '16']), { kind: 'eq', text: '5² − 3² = 16', lines: ['4 × 4 = 16, so 4 m'] }] },
      { title: 'One thing not to do', text: "Here is the mix-up between these last two lessons. Don't add when the long side is already the one you know. Its square is the total, so this time you take away.",
        beats: [
          { say: 'Here is the mix-up between these last two lessons.' },
          { say: "Don't add when the long side is already the one you know.", pic: 0 },
          { say: 'Its square is the total, so this time you take away.' },
        ],
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
      { title: 'The path is on a slant', text: 'Draw the straight path in and look at it closely. It cuts across the squares on a slant, right through their middles. So counting squares along that line will not tell you how long it is.',
        beats: [
          { say: 'Draw the straight path in and look at it closely.', pic: 0 },
          { say: 'It cuts across the squares on a slant, right through their middles.' },
          { say: 'So counting squares along that line will not tell you how long it is.', write: 'you cannot count a slant' },
        ],
        pictures: [dist(0, 8, [1, 1], [4, 5], 'line')] },
      { title: 'The big idea', text: 'Draw a right triangle between the two points. Count its legs on the grid, then find the hypotenuse.',
        beats: [
          { say: 'Draw a right triangle between the two points.', pic: 0 },
          { say: 'Count its legs on the grid, then find the hypotenuse.' },
        ],
        pictures: [dist(0, 8, [1, 1], [4, 5], 'legs')] },
      { title: 'Draw the legs', text: 'Start at (1, 1) and go straight across, then turn and go straight up to (4, 5). Now look at that corner where the two paths meet. It is a square corner, so what you have drawn is a right triangle.',
        beats: [
          { say: 'Start at (1, 1) and go straight across, then turn and go straight up to (4, 5).', pic: 0 },
          { say: 'Now look at that corner where the two paths meet.' },
          { say: 'It is a square corner, so what you have drawn is a right triangle.', write: 'across, then up → a right triangle' },
        ],
        pictures: [dist(0, 8, [1, 1], [4, 5], 'legs', ['', ''], true)] },
      { title: 'Count the legs', text: 'Now measure the two legs. You can do that with subtraction instead of counting. Across: 4 − 1 = 3. Up: 5 − 1 = 4. So the legs are 3 miles and 4 miles.',
        beats: [
          { say: 'Now measure the two legs. You can do that with subtraction instead of counting.', pic: 0 },
          { say: 'Across: 4 − 1 = 3. Up: 5 − 1 = 4.', pic: 1 },
          { say: 'So the legs are 3 miles and 4 miles.' },
        ],
        pictures: [dist(0, 8, [1, 1], [4, 5], 'counts', ['', ''], true), { kind: 'eq', text: '4 − 1 = 3', lines: ['5 − 1 = 4'] }] },
      { title: 'Find the hypotenuse', text: 'Now it is the same job as last lesson. Square the legs and add: 3 × 3 + 4 × 4 = 9 + 16 = 25. Then undo the square. 5 × 5 = 25, so the two towns are 5 miles apart.',
        beats: [
          { say: 'Now it is the same job as last lesson.', pic: 0 },
          { say: 'Square the legs and add: 3 × 3 + 4 × 4 = 9 + 16 = 25.', write: 'legs squared, then added' },
          { say: 'Then undo the square. 5 × 5 = 25, so the two towns are 5 miles apart.', pic: 1 },
        ],
        pictures: [dist(0, 8, [1, 1], [4, 5], 'counts'), { kind: 'eq', text: '3² + 4² = 25', lines: ['5 × 5 = 25, so 5 miles'] }] },
      { title: 'One thing not to do', text: "And the trap is the same one as before. Don't add the legs. 3 + 4 = 7 is the walk along the grid lines, around the corner, not the straight line across.",
        beats: [
          { say: 'And the trap is the same one as before.' },
          { say: "Don't add the legs.", pic: 0 },
          { say: '3 + 4 = 7 is the walk along the grid lines, around the corner, not the straight line across.' },
        ],
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

attachChalk(G8M4, G8M4_CHALK)
