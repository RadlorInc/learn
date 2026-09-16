/**
 * Grade 6 · Module 6 — Area, surface area, volume, shapes and angles.
 * Written to docs/new-flow/AUTHORING.md. Not yet reviewed by the founder.
 * Topics 1–4 draw with `poly` (topic 4 opens on a `solid` box, then unfolds it), topic 5 with `solid`, topic 6 with `angle`.
 */
import type { Lesson, Picture } from '../script'

type Pt = [number, number]

// ── Topic 1: a leaning four-sided shape, base along the bottom, dashed height, optional slanted-side label ──
const para = (b: number, h: number, off: number, u: string, slant = false, grid = false): Picture => ({
  kind: 'poly', grid,
  shapes: [{ pts: [[0, 0], [b, 0], [b + off, h], [off, h]], sides: [`${b} ${u}`, slant ? `${Math.hypot(off, h)} ${u}` : null, null, null], tone: 1 }],
  segs: [{ a: [off, h], b: [off, 0], dashed: true, label: `${h} ${u}` }],
})

// ── Topic 2: a triangle, base along the bottom, dashed height to the top point ──
const tri = (b: number, h: number, off: number, u: string, grid = false): Picture => ({
  kind: 'poly', grid,
  shapes: [{ pts: [[0, 0], [b, 0], [off, h]], sides: [`${b} ${u}`, null, null], tone: 1 }],
  segs: [{ a: [off, h], b: [off, 0], dashed: true, label: `${h} ${u}` }],
})

// ── Topic 3: a house (rectangle + triangle roof), dashed roof height ──
const house = (w: number, h: number, roof: number, u: string, cut = false): Picture => ({
  kind: 'poly',
  shapes: [{ pts: [[0, 0], [w, 0], [w, h], [w / 2, h + roof], [0, h]], sides: [`${w} ${u}`, `${h} ${u}`, null, null, null], tone: 1 }],
  segs: [{ a: [w / 2, h], b: [w / 2, h + roof], dashed: true, label: `${roof} ${u}` }, ...(cut ? [{ a: [0, h] as Pt, b: [w, h] as Pt, dashed: true }] : [])],
})
const shape = (pts: Pt[], sides: string[], segs: { a: Pt; b: Pt; dashed: boolean }[] = []): Picture =>
  ({ kind: 'poly', shapes: [{ pts, sides, tone: 1 }], segs })

// ── Topic 4: a box unfolded flat. Column: bottom, front, top, back; an end on each side of the front ──
function net(l: number, w: number, h: number, u: string, faces: 'names' | 'areas' | 'none' = 'none', motion = false): Picture {
  const rect = (x: number, y: number, dx: number, dy: number): Pt[] => [[x, y], [x + dx, y], [x + dx, y + dy], [x, y + dy]]
  const text = (name: string, area: number) => faces === 'names' ? name : String(area)
  return {
    kind: 'poly', motion,
    shapes: [
      { pts: rect(w, 0, l, w), sides: [`${l} ${u}`, `${w} ${u}`, null, null], tone: 1 },
      { pts: rect(w, w, l, h), tone: 2 },
      { pts: rect(w, w + h, l, w), tone: 1 },
      { pts: rect(w, 2 * w + h, l, h), tone: 2 },
      { pts: rect(0, w, w, h), tone: 3 },
      { pts: rect(w + l, w, w, h), sides: [null, `${h} ${u}`, null, null], tone: 3 },
    ],
    labels: faces === 'none' ? [] : [
      { at: [w + l / 2, w / 2], text: text('bottom', l * w) },
      { at: [w + l / 2, w + h / 2], text: text('front', l * h) },
      { at: [w + l / 2, w + h + w / 2], text: text('top', l * w) },
      { at: [w + l / 2, 2 * w + h + h / 2], text: text('back', l * h) },
      { at: [w / 2, w + h / 2], text: text('end', w * h) },
      { at: [w + l + w / 2, w + h / 2], text: text('end', w * h) },
    ],
  }
}

// ── Topic 5 ──
const box = (l: string, w: string, h: string): Picture => ({ kind: 'solid', shape: 'prism', labels: { l, w, h } })

// ── Topic 6 ──
const line = (known: number[], motion = false): Picture => {
  const rest = 180 - known.reduce((a, b) => a + b, 0)
  return { kind: 'angle', deg: 180, parts: [...known, rest], partLabels: [...known.map(k => `${k}°`), '?'], motion }
}

export const G6M6: Lesson[] = [
  // ── Topic 1 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g6m6-t1', title: 'Area of a parallelogram', skill: 'Area of a parallelogram = base × height, by cutting and moving a triangle to make a rectangle',
    bigIdea: 'Cut a triangle off one end and move it to the other end. It makes a rectangle, so the area is base × height.',
    screens: [
      { title: 'A leaning garden bed', text: 'On a plan, a garden bed leans to one side. It is 6 cm along the bottom and stands 4 cm tall. How much ground does it cover?',
        pictures: [para(6, 4, 3, 'cm', true)] },
      { title: 'Squares do not fit', text: "Let's try covering this with square tiles. Now watch the two ends. They lean, so the tiles there break into pieces. Counting broken bits one at a time gets messy fast.",
        beats: [
          { say: "Let's try covering this with square tiles.", pic: 0, effect: 'draw' },
          { say: 'Now watch the two ends. They lean, so the tiles there break into pieces.', write: 'broken pieces at both ends' },
          { say: 'Counting broken bits one at a time gets messy fast.' },
        ],
        pictures: [para(6, 4, 3, 'cm', false, true)] },
      { title: 'The big idea', text: 'Cut a triangle off one end and move it to the other end. It makes a rectangle, so the area is base × height.',
        beats: [
          { say: 'Cut a triangle off one end and move it to the other end.', pic: 0, effect: 'draw' },
          { say: 'It makes a rectangle, so the area is base × height.' },
        ],
        pictures: [para(6, 4, 3, 'cm')] },
      { title: 'Base and height', text: "Let's name the two sides we need. The base is the bottom edge. The height is how tall the shape stands, measured straight up. That is the dashed line. Straight up, never along the lean.",
        beats: [
          { say: "Let's name the two sides we need. The base is the bottom edge.", pic: 0, effect: 'draw' },
          { say: 'The height is how tall the shape stands, measured straight up. That is the dashed line.' },
          { say: 'Straight up, never along the lean.', write: 'height = straight up' },
        ],
        pictures: [para(6, 4, 3, 'cm')] },
      { title: 'Cut and slide', text: 'Watch this. I cut along the dashed line, right here. Then I slide that triangle over to the other end. Nothing is lost and nothing is added. It covers the same ground.',
        beats: [
          { say: 'Watch this. I cut along the dashed line, right here.', pic: 0, effect: 'draw' },
          { say: 'Then I slide that triangle over to the other end.' },
          { say: 'Nothing is lost and nothing is added. It covers the same ground.', write: 'cut and slide, same area' },
        ],
        pictures: [{ kind: 'poly', motion: true, shapes: [
          { pts: [[3, 0], [6, 0], [9, 4], [3, 4]], tone: 1 },
          { pts: [[0, 0], [3, 0], [3, 4]], tone: 2 },
          { pts: [[6, 0], [9, 0], [9, 4]], tone: 2, dashed: true },
        ], segs: [{ a: [3, 4], b: [3, 0], dashed: true }] }] },
      { title: 'Now it is a rectangle', text: 'And look what we have now. A plain rectangle, 6 cm long and 4 cm tall. Same base, same height as the leaning bed. So I just multiply: 6 × 4 = 24. The bed covers 24 square centimeters.',
        beats: [
          { say: 'And look what we have now. A plain rectangle, 6 cm long and 4 cm tall.', pic: 0, effect: 'draw' },
          { say: 'Same base, same height as the leaning bed.' },
          { say: 'So I just multiply: 6 × 4 = 24. The bed covers 24 square centimeters.', pic: 1 },
        ],
        pictures: [{ kind: 'poly', shapes: [{ pts: [[3, 0], [9, 0], [9, 4], [3, 4]], sides: ['6 cm', '4 cm', null, null], right: [0, 1, 2, 3], tone: 1 }] },
          { kind: 'eq', text: '6 × 4 = 24', lines: ['24 square centimeters'] }] },
      { title: 'One thing not to do', text: "Here is the trap almost everybody falls into. Don't use the slanted side. It is 5 cm long, but the shape only stands 4 cm tall. Always use the straight-up height.",
        beats: [
          { say: 'Here is the trap almost everybody falls into.', pic: 0, effect: 'draw' },
          { say: "Don't use the slanted side. It is 5 cm long, but the shape only stands 4 cm tall.", pic: 1 },
          { say: 'Always use the straight-up height.' },
        ],
        pictures: [para(6, 4, 3, 'cm', true), { kind: 'cards', wrong: '6 × 5 = 30', right: '6 × 4 = 24' }] },
    ],
    turn: {
      text: 'This shape has a base of 7 cm and a height of 4 cm. Its slanted side is 5 cm. What is its area in square centimeters?',
      picture: para(7, 4, 3, 'cm', true),
      answer: 28, steps: ['Cut the triangle off and slide it over: it makes a rectangle 7 cm by 4 cm.', 'Use the straight-up height, 4 cm, not the slanted side.', '7 × 4 = 28. So the area is 28 square centimeters.'],
      prompt: 'Multiply the base by the straight-up height.',
      hint1: 'Which line shows how tall the shape stands? Look for the dashed one.',
      hint2: 'The base is 7 cm and the height is 4 cm. Leave the slanted side out.',
      twin: { text: 'This shape has a base of 10 ft and a height of 6 ft. Its slanted side is 10 ft. What is its area in square feet?',
        picture: para(10, 6, 8, 'ft', true),
        answer: 60, steps: ['Cut the triangle off and slide it over: it makes a rectangle 10 ft by 6 ft.', 'Use the straight-up height, 6 ft, not the slanted side.', '10 × 6 = 60. So the area is 60 square feet.'],
        hint1: 'Find the dashed line. That is how tall the shape stands.', hint2: 'The base is 10 ft. The height is 6 ft. Multiply those two.' },
    },
    won: { text: 'You used the base and the straight-up height, and skipped the slanted side.', sticker: 'A four-sided shape with two pairs of parallel sides is a parallelogram. Its area = base × height.' },
    twinWon: { text: 'You used the 6 ft height, not the slanted side, and got 60 square feet.', sticker: 'A four-sided shape with two pairs of parallel sides is a parallelogram. Its area = base × height.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'This shape has a base of 5 cm and a height of 4 cm. Its slanted side is 5 cm. What is its area in square centimeters?',
        picture: para(5, 4, 3, 'cm', true), answer: 20,
        steps: ['Sliding the triangle makes a rectangle 5 cm by 4 cm.', 'Use the height, 4 cm.', '5 × 4 = 20. So the area is 20 square centimeters.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'This shape has a base of 9 in and a height of 3 in. Its slanted side is 5 in. What is its area in square inches?',
        picture: para(9, 3, 4, 'in', true), answer: 27,
        steps: ['Sliding the triangle makes a rectangle 9 in by 3 in.', 'Use the height, 3 in, not the 5 in slanted side.', '9 × 3 = 27. So the area is 27 square inches.'] } },
      { why: 'Still "base × straight-up height"', problem: { text: 'This shape has a base of 12 cm and a height of 8 cm. Its slanted side is 10 cm. What is its area in square centimeters?',
        picture: para(12, 8, 6, 'cm', true), answer: 96,
        steps: ['The height is the dashed line, 8 cm. The 10 cm side leans, so leave it out.', 'Multiply the base by the height: 12 × 8.', 'So the area is 96 square centimeters.'] } },
      { why: 'A little harder', problem: { text: 'This shape has a base of 14 m and a height of 12 m. Its slanted side is 13 m. What is its area in square meters?',
        picture: para(14, 12, 5, 'm', true), answer: 168,
        steps: ['The height is 12 m. The 13 m side leans, so leave it out.', 'Multiply the base by the height: 14 × 12 = 140 + 28.', 'So the area is 168 square meters.'] } },
      { why: 'Same math in a story', problem: { text: 'A patio is shaped like a parallelogram. Its base is 11 feet and its height is 6 feet. Its slanted side is 10 feet. How many square feet of stone cover the patio?',
        picture: para(11, 6, 8, 'ft', true), answer: 66,
        steps: ['Sliding the triangle makes a rectangle 11 feet by 6 feet.', 'Use the height, 6 feet, not the 10-foot slanted side.', '11 × 6 = 66. So 66 square feet of stone cover it.'] } },
    ],
  },

  // ── Topic 2 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g6m6-t2', title: 'Area of a triangle', skill: 'Area of a triangle = 1/2 × base × height',
    bigIdea: 'Two copies of a triangle fit together to make a leaning four-sided shape. So a triangle is half of it: area = 1/2 × base × height.',
    screens: [
      { title: 'A triangle flag', text: 'A triangle flag is 6 inches along the bottom and 4 inches tall. How much cloth does it need?',
        pictures: [tri(6, 4, 2, 'in')] },
      { title: 'Base × height is too big', text: 'You might reach for base × height. That rule works for a rectangle, or for a leaning four-sided shape. But look at the flag on the grid. It does not fill that space. The squares up top are half empty, so 6 × 4 would buy way too much cloth.',
        beats: [
          { say: 'You might reach for base × height. That rule works for a rectangle, or for a leaning four-sided shape.', pic: 0, effect: 'draw' },
          { say: 'But look at the flag on the grid. It does not fill that space.' },
          { say: 'The squares up top are half empty, so 6 × 4 would buy way too much cloth.', write: 'base × height is too much' },
        ],
        pictures: [tri(6, 4, 2, 'in', true)] },
      { title: 'The big idea', text: 'Two copies of a triangle fit together to make a leaning four-sided shape. So a triangle is half of it: area = 1/2 × base × height.',
        beats: [
          { say: 'Two copies of a triangle fit together to make a leaning four-sided shape.', pic: 0, effect: 'draw' },
          { say: 'So a triangle is half of it: area = 1/2 × base × height.' },
        ],
        pictures: [tri(6, 4, 2, 'in')] },
      { title: 'Base and height', text: 'Same two words as always: base and height. The base is the bottom edge. The height goes straight up from the base to the top point. Straight up, not along a slanted edge.',
        beats: [
          { say: 'Same two words as always: base and height. The base is the bottom edge.', pic: 0, effect: 'draw' },
          { say: 'The height goes straight up from the base to the top point.' },
          { say: 'Straight up, not along a slanted edge.', write: 'height = straight up' },
        ],
        pictures: [tri(6, 4, 2, 'in')] },
      { title: 'Make a copy', text: 'Here is the trick. I make a copy of the flag. Then I turn the copy upside down and fit it onto the slanted edge. Look at that. Two triangles make one leaning shape, with the very same base and height.',
        beats: [
          { say: 'Here is the trick. I make a copy of the flag.', pic: 0, effect: 'draw' },
          { say: 'Then I turn the copy upside down and fit it onto the slanted edge.' },
          { say: 'Look at that. Two triangles make one leaning shape, with the very same base and height.', write: '2 triangles = 1 leaning shape' },
        ],
        pictures: [{ kind: 'poly', motion: true, shapes: [
          { pts: [[0, 0], [6, 0], [2, 4]], sides: ['6 in', null, null], tone: 1 },
          { pts: [[6, 0], [8, 4], [2, 4]], tone: 2, dashed: true },
        ], segs: [{ a: [2, 4], b: [2, 0], dashed: true, label: '4 in' }] }] },
      { title: 'Take half', text: 'The whole leaning shape is 6 × 4 = 24 square inches. But that is cloth for two flags, and I only need one. So I take half: 24 ÷ 2 = 12 square inches.',
        beats: [
          { say: 'The whole leaning shape is 6 × 4 = 24 square inches.' },
          { say: 'But that is cloth for two flags, and I only need one.', pic: 0, effect: 'draw', write: 'one triangle = half' },
          { say: 'So I take half: 24 ÷ 2 = 12 square inches.', pic: 1 },
        ],
        pictures: [tri(6, 4, 2, 'in'), { kind: 'eq', text: '6 × 4 = 24', lines: ['1/2 × 24 = 12 square inches'] }] },
      { title: 'One thing not to do', text: "And here is the slip almost everybody makes. Don't forget to take half. 6 × 4 is the cloth for two flags, not one.",
        beats: [
          { say: 'And here is the slip almost everybody makes.' },
          { say: "Don't forget to take half.", pic: 0 },
          { say: '6 × 4 is the cloth for two flags, not one.' },
        ],
        pictures: [{ kind: 'cards', wrong: '6 × 4 = 24', right: '1/2 × 6 × 4 = 12' }] },
    ],
    turn: {
      text: 'A triangle has a base of 8 cm and a height of 5 cm. What is its area in square centimeters?',
      picture: tri(8, 5, 3, 'cm'),
      answer: 20, steps: ['8 × 5 = 40 is the area of two triangles.', 'One triangle is half of that: 40 ÷ 2.', 'So the area is 20 square centimeters.'],
      prompt: 'Multiply the base by the height. Then take half.',
      hint1: 'Base × height gives two triangles. What do you do next?',
      hint2: 'Find 8 × 5, then take half of it.',
      twin: { text: 'A triangle has a base of 7 in and a height of 4 in. What is its area in square inches?',
        picture: tri(7, 4, 2, 'in'),
        answer: 14, steps: ['7 × 4 = 28 is the area of two triangles.', 'One triangle is half of that: 28 ÷ 2.', 'So the area is 14 square inches.'],
        hint1: 'Base × height makes two triangles. You only need one.', hint2: 'Multiply 7 × 4. Then split it in half.' },
    },
    won: { text: 'You found base × height, then took half for one triangle.', sticker: 'The area of a triangle = 1/2 × base × height.' },
    twinWon: { text: 'You took half of 7 × 4 and got 14 square inches.', sticker: 'The area of a triangle = 1/2 × base × height.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'A triangle has a base of 6 cm and a height of 6 cm. What is its area in square centimeters?',
        picture: tri(6, 6, 2, 'cm'), answer: 18,
        steps: ['6 × 6 = 36 is two triangles.', 'Take half: 36 ÷ 2.', 'So the area is 18 square centimeters.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'A triangle has a base of 12 ft and a height of 5 ft. What is its area in square feet?',
        picture: tri(12, 5, 4, 'ft'), answer: 30,
        steps: ['12 × 5 = 60 is two triangles.', 'Take half: 60 ÷ 2.', 'So the area is 30 square feet.'] } },
      { why: 'Still "half of base × height"', problem: { text: 'A triangle has a base of 7 cm and a height of 5 cm. What is its area in square centimeters?',
        picture: tri(7, 5, 2, 'cm'), answer: 17.5,
        steps: ['7 × 5 = 35 is two triangles.', 'Take half: 35 ÷ 2. Half of 35 is 17 and a half.', 'So the area is 17.5 square centimeters.'] } },
      { why: 'A little harder', problem: { text: 'This triangle has a square corner. Its sides are 9 m, 12 m and 15 m. What is its area in square meters?',
        picture: { kind: 'poly', shapes: [{ pts: [[0, 0], [9, 0], [0, 12]], sides: ['9 m', '15 m', '12 m'], right: [0], tone: 1 }] }, answer: 54,
        steps: ['The 9 m and 12 m sides meet at the square corner, so 12 m is the height. The 15 m side leans.', '9 × 12 = 108 is two triangles.', 'Take half. So the area is 54 square meters.'] } },
      { why: 'Same math in a story', problem: { text: 'A boat sail is a triangle. It is 3 meters along the bottom and 5 meters tall. How many square meters of cloth is the sail?',
        picture: tri(3, 5, 0.5, 'm'), answer: 7.5,
        steps: ['3 × 5 = 15 is two sails.', 'One sail is half: 15 ÷ 2.', 'So the sail is 7.5 square meters.'] } },
    ],
  },

  // ── Topic 3 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g6m6-t3', title: 'Area of a shape made of pieces', skill: 'Area of a composite figure: split into rectangles and triangles, then add',
    bigIdea: 'Cut the shape into pieces you know. Find the area of each piece, then add them.',
    screens: [
      { title: 'A wall to paint', text: 'The end wall of a shed is shaped like a house: a rectangle with a triangle roof on top. How much wall is there to paint?',
        pictures: [house(6, 4, 3, 'm')] },
      { title: 'No one rule fits', text: 'Take a good look at this wall. It is not a rectangle, and it is not a triangle. So there is no one rule you can use on the whole thing at once.',
        beats: [
          { say: 'Take a good look at this wall.', pic: 0, effect: 'draw' },
          { say: 'It is not a rectangle, and it is not a triangle.' },
          { say: 'So there is no one rule you can use on the whole thing at once.', write: 'no single rule fits' },
        ],
        pictures: [house(6, 4, 3, 'm')] },
      { title: 'The big idea', text: 'Cut the shape into pieces you know. Find the area of each piece, then add them.',
        beats: [
          { say: 'Cut the shape into pieces you know.', pic: 0, effect: 'draw' },
          { say: 'Find the area of each piece, then add them.' },
        ],
        pictures: [house(6, 4, 3, 'm', true)] },
      { title: 'Cut it', text: "So let's cut. One line straight across, right where the roof starts. And now look. A rectangle at the bottom, a triangle on top. Two shapes I already know how to do.",
        beats: [
          { say: "So let's cut. One line straight across, right where the roof starts.", pic: 0, effect: 'draw' },
          { say: 'And now look. A rectangle at the bottom, a triangle on top.', write: 'rectangle + triangle' },
          { say: 'Two shapes I already know how to do.' },
        ],
        pictures: [house(6, 4, 3, 'm', true)] },
      { title: 'Find each piece', text: 'Now I do them one at a time. The rectangle is 6 × 4 = 24 square meters. The triangle is half of 6 × 3, which is 9 square meters. Hold on to both of those numbers. We need them in a second.',
        beats: [
          { say: 'Now I do them one at a time. The rectangle is 6 × 4 = 24 square meters.', pic: 0, effect: 'draw' },
          { say: 'The triangle is half of 6 × 3, which is 9 square meters.', pic: 1 },
          { say: 'Hold on to both of those numbers. We need them in a second.' },
        ],
        pictures: [{ kind: 'poly', motion: true, shapes: [
          { pts: [[0, 0], [6, 0], [6, 4], [0, 4]], sides: ['6 m', '4 m', null, null], tone: 1 },
          { pts: [[0, 4.6], [6, 4.6], [3, 7.6]], tone: 2 },
        ], segs: [{ a: [3, 4.6], b: [3, 7.6], dashed: true, label: '3 m' }] },
          { kind: 'eq', text: '6 × 4 = 24', lines: ['1/2 × 6 × 3 = 9'] }] },
      { title: 'Add the pieces', text: 'Last step. Put the pieces back together. 24 and 9 make 33. So there are 33 square meters of wall to paint.',
        beats: [
          { say: 'Last step. Put the pieces back together.', pic: 0, effect: 'draw' },
          { say: '24 and 9 make 33.', pic: 1 },
          { say: 'So there are 33 square meters of wall to paint.' },
        ],
        pictures: [house(6, 4, 3, 'm', true), { kind: 'eq', text: '24 + 9 = 33', lines: ['33 square meters'] }] },
      { title: 'One thing not to do', text: "Here is the shortcut that does not work. Don't multiply the widest across by the tallest up. 6 × 7 draws a big box around the house, and that box has empty corners beside the roof.",
        beats: [
          { say: 'Here is the shortcut that does not work.' },
          { say: "Don't multiply the widest across by the tallest up.", pic: 0 },
          { say: '6 × 7 draws a big box around the house, and that box has empty corners beside the roof.' },
        ],
        pictures: [{ kind: 'cards', wrong: '6 × 7 = 42', right: '24 + 9 = 33' }] },
    ],
    turn: {
      text: 'A wall is a rectangle 8 ft wide and 5 ft tall with a triangle roof 3 ft tall on top. What is its area in square feet?',
      picture: house(8, 5, 3, 'ft'),
      answer: 52, steps: ['Cut where the roof starts. The rectangle is 8 × 5 = 40.', 'The triangle is 1/2 × 8 × 3 = 12.', '40 + 12 = 52. So the area is 52 square feet.'],
      prompt: 'Cut it into a rectangle and a triangle. Find each area, then add.',
      hint1: 'Where can you cut the shape into a rectangle and a triangle?',
      hint2: 'The rectangle is 8 × 5. The triangle is half of 8 × 3. Add them.',
      twin: { text: 'An L-shaped rug is drawn below. What is its area in square feet?',
        picture: shape([[0, 0], [7, 0], [7, 3], [3, 3], [3, 6], [0, 6]], ['7 ft', '3 ft', '4 ft', '3 ft', '3 ft', '6 ft']),
        answer: 30, steps: ['Cut straight across to make two rectangles.', 'The bottom one is 7 × 3 = 21. The top one is 3 × 3 = 9.', '21 + 9 = 30. So the area is 30 square feet.'],
        hint1: 'Cut the L into two rectangles.', hint2: 'The bottom piece is 7 ft by 3 ft. The top piece is 3 ft by 3 ft.' },
    },
    won: { text: 'You cut the shape into a rectangle and a triangle, then added their areas.', sticker: 'A shape made of simpler pieces is a composite figure. Its area is the pieces added together.' },
    twinWon: { text: 'You cut the L into two rectangles and added them to get 30 square feet.', sticker: 'A shape made of simpler pieces is a composite figure. Its area is the pieces added together.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'A wall is a rectangle 5 m wide and 4 m tall with a triangle roof 2 m tall on top. What is its area in square meters?',
        picture: house(5, 4, 2, 'm'), answer: 25,
        steps: ['The rectangle is 5 × 4 = 20.', 'The triangle is 1/2 × 5 × 2 = 5.', '20 + 5 = 25. So the area is 25 square meters.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'What is the area of this L shape in square centimeters?',
        picture: shape([[0, 0], [8, 0], [8, 2], [2, 2], [2, 5], [0, 5]], ['8 cm', '2 cm', '6 cm', '3 cm', '2 cm', '5 cm']), answer: 22,
        steps: ['Cut straight across to make two rectangles.', 'The bottom one is 8 × 2 = 16. The top one is 2 × 3 = 6.', '16 + 6 = 22. So the area is 22 square centimeters.'] } },
      { why: 'Still "cut it, then add"', problem: { text: 'This shape is a rectangle with a triangle on one end. What is its area in square inches?',
        picture: shape([[0, 0], [9, 0], [6, 4], [0, 4]], ['9 in', '5 in', '6 in', '4 in'], [{ a: [6, 0], b: [6, 4], dashed: true }]), answer: 30,
        steps: ['The dashed line cuts off a rectangle 6 in by 4 in: 6 × 4 = 24.', 'The triangle has a base of 9 − 6 = 3 in and a height of 4 in: 1/2 × 3 × 4 = 6.', '24 + 6 = 30. So the area is 30 square inches.'] } },
      { why: 'A little harder', problem: { text: 'What is the area of this L shape in square meters?',
        picture: shape([[0, 0], [12, 0], [12, 4], [5, 4], [5, 10], [0, 10]], ['12 m', '4 m', '7 m', '6 m', '5 m', '10 m']), answer: 78,
        steps: ['Cut straight across to make two rectangles.', 'The bottom one is 12 × 4 = 48. The top one is 5 × 6 = 30.', '48 + 30 = 78. So the area is 78 square meters.'] } },
      { why: 'Same math in a story', problem: { text: 'Leo cuts a poster board into a house shape: a rectangle 12 inches wide and 9 inches tall, with a triangle roof 5 inches tall. How many square inches is his house?',
        picture: house(12, 9, 5, 'in'), answer: 138,
        steps: ['The rectangle is 12 × 9 = 108.', 'The roof is 1/2 × 12 × 5 = 30.', '108 + 30 = 138. So his house is 138 square inches.'] } },
    ],
  },

  // ── Topic 4 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g6m6-t4', title: 'Nets and surface area', skill: 'Surface area of a rectangular prism: unfold it into a net and add the areas of the 6 faces',
    bigIdea: 'Unfold the box so it lies flat. Find the area of each of its 6 flat sides, then add them all.',
    screens: [
      { title: 'Wrapping a gift', text: 'A gift box is 4 cm long, 3 cm wide and 2 cm tall. How much paper covers the outside, with no overlap?',
        pictures: [{ kind: 'solid', shape: 'prism', labels: { l: '4 cm', w: '3 cm', h: '2 cm' } }] },
      { title: 'This is not the inside', text: 'Careful here. Length × width × height counts the cubes that fit inside the box. But paper does not go inside. Paper wraps around the outside, so that is the wrong rule today.',
        beats: [
          { say: 'Careful here. Length × width × height counts the cubes that fit inside the box.', pic: 0, effect: 'draw' },
          { say: 'But paper does not go inside.' },
          { say: 'Paper wraps around the outside, so that is the wrong rule today.', write: 'paper covers the outside' },
        ],
        pictures: [{ kind: 'solid', shape: 'prism', labels: { l: '4 cm', w: '3 cm', h: '2 cm' } }] },
      { title: 'The big idea', text: 'Unfold the box so it lies flat. Find the area of each of its 6 flat sides, then add them all.',
        beats: [
          { say: 'Unfold the box so it lies flat.', pic: 0, effect: 'draw' },
          { say: 'Find the area of each of its 6 flat sides, then add them all.' },
        ],
        pictures: [net(4, 3, 2, 'cm')] },
      { title: 'Unfold it', text: "So let's actually do it. I cut along some edges and fold the box open, flat on the table. There they all are. A bottom, a front, a top, a back, and an end on each side. Count them up. 6 flat sides.",
        beats: [
          { say: "So let's actually do it. I cut along some edges and fold the box open, flat on the table.", pic: 0, effect: 'draw' },
          { say: 'There they all are. A bottom, a front, a top, a back, and an end on each side.' },
          { say: 'Count them up. 6 flat sides.', write: '6 flat sides' },
        ],
        pictures: [net(4, 3, 2, 'cm', 'names', true)] },
      { title: 'Area of each flat side', text: 'Now the areas, and I do them in pairs. The top and the bottom are both 4 × 3 = 12. The front and the back are both 4 × 2 = 8. The two ends are both 3 × 2 = 6. See how every side has a partner exactly its size?',
        beats: [
          { say: 'Now the areas, and I do them in pairs. The top and the bottom are both 4 × 3 = 12.', pic: 0, effect: 'draw' },
          { say: 'The front and the back are both 4 × 2 = 8. The two ends are both 3 × 2 = 6.' },
          { say: 'See how every side has a partner exactly its size?', write: 'every side has a partner' },
        ],
        pictures: [net(4, 3, 2, 'cm', 'areas')] },
      { title: 'Add all six', text: 'Now add every single one of them. 12 + 12 + 8 + 8 + 6 + 6 = 52. So the paper is 52 square centimeters.',
        beats: [
          { say: 'Now add every single one of them.', pic: 0, effect: 'draw' },
          { say: '12 + 12 + 8 + 8 + 6 + 6 = 52.', pic: 1 },
          { say: 'So the paper is 52 square centimeters.' },
        ],
        pictures: [net(4, 3, 2, 'cm', 'areas'), { kind: 'eq', text: '12 + 12 + 8 + 8 + 6 + 6 = 52', lines: ['52 square centimeters'] }] },
      { title: 'One thing not to do', text: "And here is the mistake to watch for. Don't add only the three sides you can see. Every side has a partner hiding at the back or underneath, and the paper has to cover those too.",
        beats: [
          { say: 'And here is the mistake to watch for.' },
          { say: "Don't add only the three sides you can see.", pic: 0 },
          { say: 'Every side has a partner hiding at the back or underneath, and the paper has to cover those too.' },
        ],
        pictures: [{ kind: 'cards', wrong: '12 + 8 + 6 = 26', right: '12 + 12 + 8 + 8 + 6 + 6 = 52' }] },
    ],
    turn: {
      text: 'This box is 5 cm long, 3 cm wide and 2 cm tall. It is unfolded flat below. How many square centimeters of paper cover it?',
      picture: net(5, 3, 2, 'cm'),
      answer: 62, steps: ['Top and bottom: 5 × 3 = 15 each. Front and back: 5 × 2 = 10 each.', 'The two ends: 3 × 2 = 6 each.', '15 + 15 + 10 + 10 + 6 + 6 = 62. So 62 square centimeters of paper cover it.'],
      prompt: 'Find the area of every flat side, then add all six.',
      hint1: 'Unfold the box. How many flat sides are there?',
      hint2: 'Top and bottom are 5 × 3. Front and back are 5 × 2. The ends are 3 × 2. Count each one twice.',
      twin: { text: 'This box is 6 in long, 2 in wide and 3 in tall. It is unfolded flat below. How many square inches of paper cover it?',
        picture: net(6, 2, 3, 'in'),
        answer: 72, steps: ['Top and bottom: 6 × 2 = 12 each. Front and back: 6 × 3 = 18 each.', 'The two ends: 2 × 3 = 6 each.', '12 + 12 + 18 + 18 + 6 + 6 = 72. So 72 square inches of paper cover it.'],
        hint1: 'There are 6 flat sides. They come in matching pairs.', hint2: 'Top and bottom are 6 × 2. Front and back are 6 × 3. The ends are 2 × 3.' },
    },
    won: { text: 'You unfolded the box and added the areas of all six flat sides.', sticker: 'A box unfolded flat is a net. The total area of all its faces is the surface area.' },
    twinWon: { text: 'You added all six sides of the 6 by 2 by 3 box and got 72 square inches.', sticker: 'A box unfolded flat is a net. The total area of all its faces is the surface area.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'This box is 3 cm long, 2 cm wide and 1 cm tall, unfolded flat. How many square centimeters of paper cover it?',
        picture: net(3, 2, 1, 'cm'), answer: 22,
        steps: ['Top and bottom: 3 × 2 = 6 each. Front and back: 3 × 1 = 3 each.', 'The two ends: 2 × 1 = 2 each.', '6 + 6 + 3 + 3 + 2 + 2 = 22. So 22 square centimeters.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'This box is 5 in long, 4 in wide and 2 in tall, unfolded flat. How many square inches of paper cover it?',
        picture: net(5, 4, 2, 'in'), answer: 76,
        steps: ['Top and bottom: 5 × 4 = 20 each. Front and back: 5 × 2 = 10 each.', 'The two ends: 4 × 2 = 8 each.', '20 + 20 + 10 + 10 + 8 + 8 = 76. So 76 square inches.'] } },
      { why: 'Still "add all six sides"', problem: { text: 'A cube is 3 cm on every edge. It is unfolded flat. How many square centimeters of paper cover it?',
        picture: net(3, 3, 3, 'cm'), answer: 54,
        steps: ['Every flat side is 3 × 3 = 9.', 'A cube has 6 flat sides: 9 × 6.', 'So 54 square centimeters.'] } },
      { why: 'A little harder', problem: { text: 'This box is 10 m long, 6 m wide and 4 m tall, unfolded flat. What is the area of all its flat sides in square meters?',
        picture: net(10, 6, 4, 'm'), answer: 248,
        steps: ['Top and bottom: 10 × 6 = 60 each. Front and back: 10 × 4 = 40 each.', 'The two ends: 6 × 4 = 24 each. One of each: 60 + 40 + 24 = 124.', 'Each has a partner: 124 × 2. So 248 square meters.'] } },
      { why: 'Same math in a story', problem: { text: 'Maya covers a cereal box with paper. The box is 8 inches long, 3 inches wide and 10 inches tall. How many square inches of paper does she need?',
        picture: net(8, 3, 10, 'in'), answer: 268,
        steps: ['Top and bottom: 8 × 3 = 24 each. Front and back: 8 × 10 = 80 each.', 'The two ends: 3 × 10 = 30 each. One of each: 24 + 80 + 30 = 134.', 'Each has a partner: 134 × 2. So she needs 268 square inches.'] } },
    ],
  },

  // ── Topic 5 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g6m6-t5', title: 'Volume with fraction edges', skill: 'Volume of a rectangular prism with fraction edge lengths: V = l × w × h',
    bigIdea: 'Multiply length × width × height, even when the edges are fractions.',
    screens: [
      { title: 'A toy chest', text: 'A toy chest is 2 1/2 feet long, 2 feet wide and 1 1/2 feet tall. How much space is inside?',
        pictures: [box('2 1/2 ft', '2 ft', '1 1/2 ft')] },
      { title: 'Whole cubes do not fit', text: "Let's try filling it with 1-foot cubes. Along the length, 2 of them fit, and then half a foot is left over. No cube fits in that gap. So counting whole cubes would miss space, and we want all of it.",
        beats: [
          { say: "Let's try filling it with 1-foot cubes.", pic: 0, effect: 'draw' },
          { say: 'Along the length, 2 of them fit, and then half a foot is left over. No cube fits in that gap.' },
          { say: 'So counting whole cubes would miss space, and we want all of it.', write: 'whole cubes miss the halves' },
        ],
        pictures: [box('2 1/2 ft', '2 ft', '1 1/2 ft')] },
      { title: 'The big idea', text: 'Multiply length × width × height, even when the edges are fractions.',
        beats: [
          { say: 'Multiply length × width × height, even when the edges are fractions.', pic: 0, effect: 'draw' },
        ],
        pictures: [box('length', 'width', 'height')] },
      { title: 'Write each edge as a fraction', text: 'Mixed numbers are awkward to multiply, so first I rewrite them. 2 1/2 becomes 5/2, and 1 1/2 becomes 3/2. Same chest, same edges. Just easier to multiply now.',
        beats: [
          { say: 'Mixed numbers are awkward to multiply, so first I rewrite them.' },
          { say: '2 1/2 becomes 5/2, and 1 1/2 becomes 3/2.', pic: 1 },
          { say: 'Same chest, same edges. Just easier to multiply now.', pic: 0, effect: 'draw' },
        ],
        pictures: [box('5/2 ft', '2 ft', '3/2 ft'), { kind: 'eq', text: '2 1/2 = 5/2', lines: ['1 1/2 = 3/2'] }] },
      { title: 'Multiply one step at a time', text: 'Now I multiply, two edges at a time. Length times width first: 5/2 × 2 = 10/2 = 5. Then that answer times the height: 5 × 3/2 = 15/2.',
        beats: [
          { say: 'Now I multiply, two edges at a time.', pic: 0, effect: 'draw' },
          { say: 'Length times width first: 5/2 × 2 = 10/2 = 5.', pic: 1 },
          { say: 'Then that answer times the height: 5 × 3/2 = 15/2.' },
        ],
        pictures: [box('5/2 ft', '2 ft', '3/2 ft'),
          { kind: 'table', head: ['step', 'multiply', 'result'], rows: [['length × width', '5/2 × 2', '5'], ['× height', '5 × 3/2', '15/2']], motion: true }] },
      { title: 'Back to a mixed number', text: 'One last move. 15/2 means 15 halves, and that is 7 wholes with 1 half left over. So the chest holds 7 1/2 cubic feet.',
        beats: [
          { say: 'One last move. 15/2 means 15 halves, and that is 7 wholes with 1 half left over.', pic: 0, effect: 'draw' },
          { say: 'So the chest holds 7 1/2 cubic feet.', pic: 1 },
        ],
        pictures: [box('2 1/2 ft', '2 ft', '1 1/2 ft'), { kind: 'eq', text: '15/2 = 7 1/2', lines: ['7 1/2 cubic feet'] }] },
      { title: 'One thing not to do', text: "And here is the one to avoid. Don't drop the halves. 2 × 2 × 1 only uses the whole feet, and that leaves out a big chunk of the space inside.",
        beats: [
          { say: 'And here is the one to avoid.' },
          { say: "Don't drop the halves.", pic: 0 },
          { say: '2 × 2 × 1 only uses the whole feet, and that leaves out a big chunk of the space inside.' },
        ],
        pictures: [{ kind: 'cards', wrong: '2 × 2 × 1 = 4', right: '5/2 × 2 × 3/2 = 7 1/2' }] },
    ],
    turn: {
      text: 'A box is 3 1/2 ft long, 2 ft wide and 1 1/2 ft tall. What is its volume in cubic feet?',
      picture: box('3 1/2 ft', '2 ft', '1 1/2 ft'),
      answer: { frac: [1, 2], whole: 10 },
      steps: ['3 1/2 = 7/2 and 1 1/2 = 3/2.', '7/2 × 2 = 7. Then 7 × 3/2 = 21/2.', '21/2 = 10 1/2. So the volume is 10 1/2 cubic feet.'],
      prompt: 'Change the mixed numbers to fractions. Then multiply all three edges.',
      hint1: 'Write each mixed number as a fraction first.',
      hint2: '3 1/2 is 7/2 and 1 1/2 is 3/2. Multiply them with the 2.',
      twin: { text: 'A box is 1 1/2 in long, 4 in wide and 2 1/2 in tall. What is its volume in cubic inches?',
        picture: box('1 1/2 in', '4 in', '2 1/2 in'),
        answer: 15, steps: ['1 1/2 = 3/2 and 2 1/2 = 5/2.', '3/2 × 4 = 6. Then 6 × 5/2 = 30/2.', '30/2 = 15. So the volume is 15 cubic inches.'],
        hint1: 'Change the mixed numbers into fractions.', hint2: '1 1/2 is 3/2 and 2 1/2 is 5/2. Multiply them with the 4.' },
    },
    won: { text: 'You changed the edges to fractions and multiplied all three.', sticker: 'The volume of a rectangular prism is V = l × w × h, for fraction edges too.' },
    twinWon: { text: 'You changed 1 1/2 and 2 1/2 into fractions and got 15 cubic inches.', sticker: 'The volume of a rectangular prism is V = l × w × h, for fraction edges too.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'A box is 2 1/2 ft long, 2 ft wide and 2 1/2 ft tall. What is its volume in cubic feet?',
        picture: box('2 1/2 ft', '2 ft', '2 1/2 ft'), answer: { frac: [1, 2], whole: 12 },
        steps: ['2 1/2 = 5/2.', '5/2 × 2 = 5. Then 5 × 5/2 = 25/2.', '25/2 = 12 1/2. So the volume is 12 1/2 cubic feet.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'A box is 1 1/2 cm long, 3 cm wide and 1 1/2 cm tall. What is its volume in cubic centimeters?',
        picture: box('1 1/2 cm', '3 cm', '1 1/2 cm'), answer: { frac: [3, 4], whole: 6 },
        steps: ['1 1/2 = 3/2.', '3/2 × 3 = 9/2. Then 9/2 × 3/2 = 27/4.', '27/4 = 6 3/4. So the volume is 6 3/4 cubic centimeters.'] } },
      { why: 'Still "multiply all three edges"', problem: { text: 'A box is 1/2 m long, 4 m wide and 3 m tall. What is its volume in cubic meters?',
        picture: box('1/2 m', '4 m', '3 m'), answer: 6,
        steps: ['1/2 × 4 = 2.', 'Then multiply by the height: 2 × 3.', 'So the volume is 6 cubic meters.'] } },
      { why: 'A little harder', problem: { text: 'A box is 2 1/2 in long, 1 1/2 in wide and 3 1/2 in tall. What is its volume in cubic inches?',
        picture: box('2 1/2 in', '1 1/2 in', '3 1/2 in'), answer: { frac: [1, 8], whole: 13 },
        steps: ['2 1/2 = 5/2, 1 1/2 = 3/2 and 3 1/2 = 7/2.', '5/2 × 3/2 = 15/4. Then 15/4 × 7/2 = 105/8.', '105/8 = 13 1/8. So the volume is 13 1/8 cubic inches.'] } },
      { why: 'Same math in a story', problem: { text: 'A planter box is 4 1/2 feet long, 2 feet wide and 1 1/2 feet deep. How many cubic feet of soil fill it?',
        picture: box('4 1/2 ft', '2 ft', '1 1/2 ft'), answer: { frac: [1, 2], whole: 13 },
        steps: ['4 1/2 = 9/2 and 1 1/2 = 3/2.', '9/2 × 2 = 9. Then 9 × 3/2 = 27/2.', '27/2 = 13 1/2. So 13 1/2 cubic feet of soil fill it.'] } },
    ],
  },

  // ── Topic 6 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g6m6-t6', title: 'Angles on a straight line', skill: 'Adjacent angles on a straight line add up to 180°',
    bigIdea: 'Angles that sit side by side on a straight line add up to 180°.',
    screens: [
      { title: 'A board on the floor', text: 'A board leans on a flat floor. On one side it makes a 55° angle with the floor. What is the angle on the other side?',
        pictures: [line([55])] },
      { title: 'No protractor needed', text: 'You could go get a protractor and measure that other angle. But you do not need to. The floor is a straight line, and a straight line already tells you the answer.',
        beats: [
          { say: 'You could go get a protractor and measure that other angle.', pic: 0, effect: 'draw' },
          { say: 'But you do not need to.' },
          { say: 'The floor is a straight line, and a straight line already tells you the answer.', write: 'the floor is the clue' },
        ],
        pictures: [line([55])] },
      { title: 'The big idea', text: 'Angles that sit side by side on a straight line add up to 180°.',
        beats: [
          { say: 'Angles that sit side by side on a straight line add up to 180°.', pic: 0, effect: 'draw' },
        ],
        pictures: [{ kind: 'angle', deg: 180, label: '180°' }] },
      { title: 'A straight line is a half turn', text: 'Here is why. Face one way, then turn until you are facing the opposite way. That is a half turn, and a half turn is 180°. A straight line opens up to exactly that much.',
        beats: [
          { say: 'Here is why. Face one way, then turn until you are facing the opposite way.', pic: 0, effect: 'draw' },
          { say: 'That is a half turn, and a half turn is 180°.', write: 'straight line = half turn' },
          { say: 'A straight line opens up to exactly that much.' },
        ],
        pictures: [{ kind: 'angle', deg: 180, protractor: true }] },
      { title: 'The parts fill the line', text: 'Now watch the board. It splits that straight line into two angles, side by side. See how they fill the whole line, edge to edge, with no gap and no overlap? So the two of them together have to make 180°.',
        beats: [
          { say: 'Now watch the board. It splits that straight line into two angles, side by side.', pic: 0, effect: 'draw' },
          { say: 'See how they fill the whole line, edge to edge, with no gap and no overlap?' },
          { say: 'So the two of them together have to make 180°.', write: 'the two parts add to 180°' },
        ],
        pictures: [{ kind: 'angle', deg: 180, parts: [55, 125], partLabels: ['55°', null], motion: true }] },
      { title: 'Take away the part you know', text: 'One part is 55°, so the other part is whatever is left of the 180. I take it away: 180 − 55 = 125. The angle on the other side of the board is 125°.',
        beats: [
          { say: 'One part is 55°, so the other part is whatever is left of the 180.', pic: 0, effect: 'draw' },
          { say: 'I take it away: 180 − 55 = 125.', pic: 1 },
          { say: 'The angle on the other side of the board is 125°.' },
        ],
        pictures: [line([55]), { kind: 'eq', text: '180° − 55° = 125°' }] },
      { title: 'One thing not to do', text: "And here is the mix-up to dodge. Don't take it away from 90. A square corner is 90°, but a straight line is twice that. It is 180°.",
        beats: [
          { say: 'And here is the mix-up to dodge.' },
          { say: "Don't take it away from 90.", pic: 0 },
          { say: 'A square corner is 90°, but a straight line is twice that. It is 180°.' },
        ],
        pictures: [{ kind: 'cards', wrong: '90° − 55° = 35°', right: '180° − 55° = 125°' }] },
    ],
    turn: {
      text: 'Two angles sit side by side on a straight line. One is 65°. How many degrees is the other?',
      picture: line([65]),
      answer: 115, steps: ['The two angles fill a straight line, so they add up to 180°.', 'Take away the part you know: 180 − 65.', 'So the other angle is 115°.'],
      prompt: 'The angles on a straight line add up to 180°. Take away the one you know.',
      hint1: 'What do angles on a straight line add up to?',
      hint2: 'Start at 180 and take away 65.',
      twin: { text: 'Two angles sit side by side on a straight line. One is 130°. How many degrees is the other?',
        picture: line([130]),
        answer: 50, steps: ['The two angles fill a straight line, so they add up to 180°.', 'Take away the part you know: 180 − 130.', 'So the other angle is 50°.'],
        hint1: 'A straight line is a half turn. How many degrees is that?', hint2: 'Start at 180 and take away 130.' },
    },
    won: { text: 'You took the angle you know away from 180°.', sticker: 'Two angles that add up to 180° are called supplementary angles.' },
    twinWon: { text: 'You took 130° away from 180° to find the other angle.', sticker: 'Two angles that add up to 180° are called supplementary angles.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'Two angles sit side by side on a straight line. One is 40°. How many degrees is the other?',
        picture: line([40]), answer: 140,
        steps: ['They add up to 180°.', 'Take away the part you know: 180 − 40.', 'So the other angle is 140°.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Two angles sit side by side on a straight line. One is 105°. How many degrees is the other?',
        picture: line([105]), answer: 75,
        steps: ['They add up to 180°.', 'Take away the part you know: 180 − 105.', 'So the other angle is 75°.'] } },
      { why: 'Still "they add up to 180°"', problem: { text: 'Three angles sit side by side on a straight line: 60°, 50° and one more. How many degrees is the missing angle?',
        picture: line([60, 50]), answer: 70,
        steps: ['All three angles fill the straight line, so they add up to 180°.', 'The two you know: 60 + 50 = 110. Then 180 − 110.', 'So the missing angle is 70°.'] } },
      { why: 'A little harder', problem: { text: 'Three angles sit side by side on a straight line: 35°, 72° and one more. How many degrees is the missing angle?',
        picture: line([35, 72]), answer: 73,
        steps: ['All three add up to 180°.', 'The two you know: 35 + 72 = 107. Then 180 − 107.', 'So the missing angle is 73°.'] } },
      { why: 'Same math in a story', problem: { text: 'A ladder leans on flat ground. On one side it makes a 68° angle with the ground. What is the angle on the other side of the ladder?',
        picture: line([68]), answer: 112,
        steps: ['The ground is a straight line, so the two angles add up to 180°.', 'Take away the part you know: 180 − 68.', 'So the other angle is 112°.'] } },
    ],
  },
]
