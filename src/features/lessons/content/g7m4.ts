/**
 * Grade 7 · Module 4 — Geometry.
 * Written to docs/new-flow/AUTHORING.md. Not yet reviewed by the founder.
 * Topics 1, 2, 3, 5, 6, 7 draw with `poly`; topic 4 with `angle`; topic 8 with `solid` (a box) — its triangle-end
 * problems use a `poly` wedge, because `solid` only draws a box.
 */
import type { Lesson, Picture } from '../script'

type Pt = [number, number]
const rect = (x: number, y: number, dx: number, dy: number): Pt[] => [[x, y], [x + dx, y], [x + dx, y + dy], [x, y + dy]]

// ── Topic 1: a rectangle on a map / plan ──
const plan = (w: number, h: number, top: string | null, side: string | null, cuts = false): Picture => ({
  kind: 'poly', motion: cuts,
  shapes: [{ pts: rect(0, 0, w, h), sides: [top, side, null, null], right: [0, 1, 2, 3], tone: 1 }],
  segs: cuts ? Array.from({ length: w - 1 }, (_, i) => ({ a: [i + 1, 0] as Pt, b: [i + 1, h] as Pt, dashed: true })) : [],
})
const mapRule = (drawUnit: string, realUnit: string, per: string, real: string): Picture =>
  ({ kind: 'table', head: [`drawing (${drawUnit})`, '1', '?'], rows: [[`real (${realUnit})`, per, real]], rowHead: true })

// ── Topics 2 and 3: a circle with its distance across (d) or center-to-edge (r) drawn ──
const circle = (r: number, label: string, show: 'r' | 'd'): Picture => ({ kind: 'poly', shapes: [], circles: [{ c: [0, 0], r, label, show }] })

// ── Topic 3: the circle cut into slices and laid side by side ──
function slices(labels: boolean, motion = false): Picture {
  const w = 31.4 / 4, shapes: { pts: Pt[]; tone: 1 | 2 }[] = []
  for (let i = 0; i < 4; i++) {
    shapes.push({ pts: [[w * i, 0], [w * (i + 1), 0], [w * i + w / 2, 10]], tone: 1 })
    shapes.push({ pts: [[w * i + w / 2, 10], [w * (i + 1) + w / 2, 10], [w * (i + 1), 0]], tone: 2 })
  }
  return { kind: 'poly', motion, shapes, segs: labels ? [{ a: [0, -1], b: [31.4, -1], arrow: 'both', label: '31.4 m' }, { a: [-1, 10], b: [-1, 0], arrow: 'both', label: '10 m' }] : [] }
}

// ── Topic 4 ──
const corner = (parts: number[], labels: (string | null)[], motion = false): Picture =>
  ({ kind: 'angle', deg: parts[0] + parts[1], parts, partLabels: labels, motion })

// ── Topic 5: two straight lines crossing; `deg` is the left/right angle ──
function cross(deg: number, lab: { r?: string; l?: string; t?: string; b?: string }, motion = false): Picture {
  const h = (deg * Math.PI) / 360, x = 4 * Math.cos(h), y = 4 * Math.sin(h)
  const at: Record<'r' | 'l' | 't' | 'b', Pt> = { r: [2.6, 0], l: [-2.6, 0], t: [0, 2.6], b: [0, -2.6] }
  return {
    kind: 'poly', motion, shapes: [],
    segs: [{ a: [-x, -y], b: [x, y] }, { a: [-x, y], b: [x, -y] }],
    labels: (Object.keys(lab) as ('r' | 'l' | 't' | 'b')[]).map(k => ({ at: at[k], text: lab[k]!, tone: lab[k] === '?' ? 2 : 1 })),
  }
}

// ── Topic 6: three sticks laid out one above the other ──
const sticks = (a: number, b: number, c: number, u: string): Picture => ({
  kind: 'poly', shapes: [],
  segs: [{ a: [0, 3], b: [a, 3], dots: true, label: `${a} ${u}` }, { a: [0, 1.5], b: [b, 1.5], dots: true, label: `${b} ${u}` }, { a: [0, 0], b: [c, 0], dots: true, label: `${c} ${u}` }],
})

// ── Topics 7 and 8: a prism with a triangle end, drawn in 3D. The front triangle is base b, height h, top point at x = apex ──
function wedge(b: number, h: number, L: number, u: string, apex = 0, slant?: string): Picture {
  const o: Pt = [L * 0.35, L * 0.22], front: Pt[] = [[0, 0], [b, 0], [apex, h]]
  return {
    kind: 'poly',
    shapes: [
      { pts: front.map(p => [p[0] + o[0], p[1] + o[1]] as Pt), tone: 0, dashed: true },
      { pts: front, sides: [`${b} ${u}`, slant ?? null, null], right: apex === 0 ? [0] : undefined, tone: 1 },
    ],
    segs: [
      { a: [b, 0], b: [b + o[0], o[1]], label: `${L} ${u}` },
      { a: [apex, h], b: [apex + o[0], h + o[1]] },
      { a: [0, 0], b: o, dashed: true },
      { a: [apex, h], b: [apex, 0], dashed: true, label: `${h} ${u}` },
    ],
  }
}

// Topic 7: the wedge unfolded. Triangle legs a (up) and b (along), long side c; rectangles a, b, c wide and L long.
function triNet(a: number, b: number, c: number, L: number, u: string, faces: 'names' | 'areas' | 'none' = 'none', motion = false): Picture {
  const t = (name: string, area: number) => faces === 'names' ? name : String(area)
  return {
    kind: 'poly', motion,
    shapes: [
      { pts: [[a, 0], [a + b, 0], [a, -a]], tone: 1 },
      { pts: [[a, L], [a + b, L], [a, L + a]], tone: 1 },
      { pts: rect(0, 0, a, L), sides: [`${a} ${u}`, null, null, `${L} ${u}`], tone: 2 },
      { pts: rect(a, 0, b, L), sides: [null, null, `${b} ${u}`, null], tone: 3 },
      { pts: rect(a + b, 0, c, L), sides: [`${c} ${u}`, null, null, null], tone: 2 },
    ],
    labels: faces === 'none' ? [] : [
      { at: [a + b / 3, -a / 3], text: t('end', (a * b) / 2) },
      { at: [a + b / 3, L + a / 3], text: t('end', (a * b) / 2) },
      { at: [a / 2, L / 2], text: t('side', a * L) },
      { at: [a + b / 2, L / 2], text: t('side', b * L) },
      { at: [a + b + c / 2, L / 2], text: t('side', c * L) },
    ],
  }
}

// Topic 7: a box unfolded. Column: bottom, front, top, back; an end on each side of the front.
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

// Topic 8
const box = (l: string, w: string, h: string): Picture => ({ kind: 'solid', shape: 'prism', labels: { l, w, h } })

const YES_NO = (yes: boolean) => ({ choices: ['yes', 'no'], correct: yes ? 0 : 1 })

export const G7M4: Lesson[] = [
  // ── Topic 1 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g7m4-t1', title: 'Scale drawings', skill: 'Use the scale of a drawing or map to find a real length or a drawing length',
    bigIdea: 'Each 1 cm on the drawing stands for the same real length. Multiply by it to get the real length, and divide to go back.',
    screens: [
      { title: 'A park on a map', text: 'On a map, a park is 6 cm long and 4 cm wide. The map says 1 cm = 50 m. How long is the real park?',
        pictures: [plan(6, 4, '6 cm', '4 cm')] },
      { title: 'The map is shrunk', text: "Now, the real park is not 6 cm long. You couldn't walk across a whole park in 6 centimeters. A park will never fit on a sheet of paper, so the mapmaker shrank every length by the same amount.",
        beats: [
          { say: 'Now, the real park is not 6 cm long.', pic: 0 },
          { say: "You couldn't walk across a whole park in 6 centimeters." },
          { say: 'A park will never fit on a sheet of paper, so the mapmaker shrank every length by the same amount.', write: 'every length shrank the same' },
        ],
        pictures: [plan(6, 4, '6 cm', '4 cm')] },
      { title: 'The big idea', text: 'Each 1 cm on the drawing stands for the same real length. Multiply by it to get the real length, and divide to go back.',
        beats: [
          { say: 'Each 1 cm on the drawing stands for the same real length.', pic: 0 },
          { say: 'Multiply by it to get the real length, and divide to go back.' },
        ],
        pictures: [plan(6, 4, '6 cm', '4 cm')] },
      { title: 'Read the rule', text: 'Look at what the map tells us: 1 cm = 50 m. So every single centimeter on this map is 50 meters of real ground. That makes 2 cm 100 m, and 3 cm 150 m.',
        beats: [
          { say: 'Look at what the map tells us: 1 cm = 50 m.', pic: 0 },
          { say: 'So every single centimeter on this map is 50 meters of real ground.', write: 'each cm gets its own 50 m' },
          { say: 'That makes 2 cm 100 m, and 3 cm 150 m.' },
        ],
        pictures: [{ kind: 'table', head: ['map (cm)', '1', '2', '3'], rows: [['real (m)', '50', '100', '150']], rowHead: true, motion: true }] },
      { title: 'Count the centimeters', text: 'Back to the park. It is 6 cm long on the map. I will cut that into 6 pieces, and each piece is worth 50 m. 6 × 50 = 300. The real park is 300 m long.',
        beats: [
          { say: 'Back to the park. It is 6 cm long on the map.', pic: 0 },
          { say: 'I will cut that into 6 pieces, and each piece is worth 50 m.', write: '6 pieces of 50 m' },
          { say: '6 × 50 = 300. The real park is 300 m long.', pic: 1 },
        ],
        pictures: [plan(6, 4, '6 cm', '4 cm', true), { kind: 'eq', text: '6 × 50 = 300', lines: ['300 meters'] }] },
      { title: 'Go back the other way', text: "Now let's go the other way, starting from real life. A real path is 200 m long. How many 50s fit into 200? 200 ÷ 50 = 4. So that path is only 4 cm on the map.",
        beats: [
          { say: "Now let's go the other way, starting from real life.", pic: 0 },
          { say: 'A real path is 200 m long. How many 50s fit into 200?', write: 'real → map: divide' },
          { say: '200 ÷ 50 = 4. So that path is only 4 cm on the map.', pic: 1 },
        ],
        pictures: [plan(6, 4, '6 cm', '? cm'), { kind: 'eq', text: '200 ÷ 50 = 4', lines: ['4 cm on the map'] }] },
      { title: 'One thing not to do', text: "One last thing, and this is the slip almost everybody makes. Don't add the 50 to the 6. Every centimeter gets its own 50 m, so we multiply.",
        beats: [
          { say: 'One last thing, and this is the slip almost everybody makes.' },
          { say: "Don't add the 50 to the 6.", pic: 0 },
          { say: 'Every centimeter gets its own 50 m, so we multiply.' },
        ],
        pictures: [{ kind: 'cards', wrong: '6 + 50 = 56 m', right: '6 × 50 = 300 m' }] },
    ],
    turn: {
      text: 'On a map, 1 cm = 50 m. A road is 8 cm long on the map. How many meters long is the real road?',
      picture: plan(8, 1, '8 cm', null),
      answer: 400, steps: ['Each 1 cm on the map stands for 50 m.', '8 cm is 8 pieces of 50 m: 8 × 50.', 'So the real road is 400 meters long.'],
      prompt: 'Find what 1 cm stands for. Then multiply by the map length.',
      hint1: 'How many real meters does 1 cm on the map stand for?',
      hint2: 'Multiply 8 by 50.',
      twin: { text: 'On a plan, 1 cm = 3 m. A real pool is 21 m long. How many centimeters long is it on the plan?',
        picture: mapRule('cm', 'm', '3', '21'),
        answer: 7, steps: ['Each 1 cm on the plan stands for 3 m.', 'How many 3s make 21? 21 ÷ 3.', 'So the pool is 7 cm long on the plan.'],
        hint1: 'Is 21 m the plan length or the real length?', hint2: 'Go back the other way: divide the real length by 3.' },
    },
    won: { text: 'You multiplied the map length by what each centimeter stands for.', sticker: 'A rule like 1 cm = 50 m is called the scale of a drawing.' },
    twinWon: { text: 'You divided 21 m by 3 to find the length on the plan.', sticker: 'A rule like 1 cm = 3 m is called the scale of a drawing.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'On a map, 1 cm = 50 m. A field is 5 cm long on the map. How many meters long is the real field?',
        picture: plan(5, 3, '5 cm', null), answer: 250,
        steps: ['Each 1 cm stands for 50 m.', '5 cm is 5 × 50.', 'So the real field is 250 meters long.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'On a map, 1 cm = 20 km. Two towns are 7 cm apart on the map. How many kilometers apart are the real towns?',
        picture: { kind: 'poly', shapes: [], segs: [{ a: [0, 0], b: [7, 0], dots: true, label: '7 cm' }] }, answer: 140,
        steps: ['Each 1 cm stands for 20 km.', '7 cm is 7 × 20.', 'So the towns are 140 kilometers apart.'] } },
      { why: 'Still "each cm is the same real length"', problem: { text: 'On a floor plan, 1 cm = 2 m. A room is 9 cm long on the plan. How many meters long is the real room?',
        picture: plan(9, 5, '9 cm', null), answer: 18,
        steps: ['Each 1 cm stands for 2 m.', '9 cm is 9 × 2.', 'So the real room is 18 meters long.'] } },
      { why: 'A little harder', problem: { text: 'On a map, 1 cm = 25 km. A real lake is 175 km long. How many centimeters long is it on the map?',
        picture: mapRule('cm', 'km', '25', '175'), answer: 7,
        steps: ['175 km is the real length, so go back the other way.', 'How many 25s make 175? 175 ÷ 25.', 'So the lake is 7 cm long on the map.'] } },
      { why: 'Same math in a story', problem: { text: 'Ava builds a model of a bridge. On her model, 1 cm = 6 m. The real bridge is 90 m long. How many centimeters long is her model bridge?',
        picture: mapRule('cm', 'm', '6', '90'), answer: 15,
        steps: ['90 m is the real length, so divide.', 'How many 6s make 90? 90 ÷ 6.', 'So her model bridge is 15 cm long.'] } },
    ],
  },

  // ── Topic 2 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g7m4-t2', title: 'Circumference', skill: 'Circumference of a circle: C = π × d, using π ≈ 3.14',
    bigIdea: 'The distance around a circle is always about 3.14 times the distance across it.',
    screens: [
      { title: 'Around the wheel', text: 'A toy wheel is 10 cm across. How far does it roll in one full turn?',
        pictures: [circle(5, '10 cm', 'd')] },
      { title: 'Across is not around', text: 'See that line straight across, right through the center? That one is the diameter. Half of it, center out to the edge, is the radius. But neither one is the distance around the outside, and that is what we want.',
        beats: [
          { say: 'See that line straight across, right through the center? That one is the diameter.', pic: 0 },
          { say: 'Half of it, center out to the edge, is the radius.', write: 'radius = half the diameter' },
          { say: 'But neither one is the distance around the outside, and that is what we want.' },
        ],
        pictures: [circle(5, '10 cm', 'd')] },
      { title: 'The big idea', text: 'The distance around a circle is always about 3.14 times the distance across it.',
        beats: [
          { say: 'The distance around a circle is always about 3.14 times the distance across it.', pic: 0 },
        ],
        pictures: [circle(5, '10 cm', 'd')] },
      { title: 'Roll it out', text: 'Watch this. Mark a spot on the wheel, then roll it one whole turn. The track it leaves behind is the distance around.',
        beats: [
          { say: 'Watch this. Mark a spot on the wheel, then roll it one whole turn.', pic: 0 },
          { say: 'The track it leaves behind is the distance around.', write: 'one full turn = the distance around' },
        ],
        pictures: [{ kind: 'poly', motion: true, shapes: [], circles: [{ c: [5, 5], r: 5, show: 'd', label: '10 cm' }],
          segs: [{ a: [0, -0.5], b: [31.4, -0.5], arrow: 'end', label: 'one full turn' }] }] },
      { title: 'A little more than 3', text: 'Now lay the 10 cm width along that track and count how many times it fits. It goes 3 whole times, and then there is a small piece left over. And that is true for every circle: about 3.14 times.',
        beats: [
          { say: 'Now lay the 10 cm width along that track and count how many times it fits.', pic: 0 },
          { say: 'It goes 3 whole times, and then there is a small piece left over.' },
          { say: 'And that is true for every circle: about 3.14 times.', write: 'around ≈ 3.14 × across' },
        ],
        pictures: [{ kind: 'poly', motion: true, shapes: [], segs: [
          { a: [0, 0], b: [10, 0], dots: true, label: '10 cm' },
          { a: [10, 0], b: [20, 0], dots: true, label: '10 cm' },
          { a: [20, 0], b: [30, 0], dots: true, label: '10 cm' },
          { a: [30, 0], b: [31.4, 0], tone: 2 },
        ] }] },
      { title: 'Multiply', text: "So let's multiply. The wheel is 10 cm across. 10 × 3.14 = 31.4. That wheel rolls 31.4 cm in one turn.",
        beats: [
          { say: "So let's multiply. The wheel is 10 cm across.", pic: 0 },
          { say: '10 × 3.14 = 31.4. That wheel rolls 31.4 cm in one turn.', pic: 1 },
        ],
        pictures: [circle(5, '10 cm', 'd'), { kind: 'eq', text: '10 × 3.14 = 31.4', lines: ['31.4 cm around'] }] },
      { title: 'One thing not to do', text: "Here is the one to watch out for. Don't multiply the radius by 3.14. It is only half the way across, so double it first.",
        beats: [
          { say: 'Here is the one to watch out for.', pic: 0 },
          { say: "Don't multiply the radius by 3.14.", pic: 1 },
          { say: 'It is only half the way across, so double it first.' },
        ],
        pictures: [circle(5, '5 cm', 'r'), { kind: 'cards', wrong: '5 × 3.14 = 15.7 cm', right: '10 × 3.14 = 31.4 cm' }] },
    ],
    turn: {
      text: 'A plate has a diameter of 20 cm. How far is it around the edge, in centimeters? Use 3.14.',
      picture: circle(10, '20 cm', 'd'),
      answer: 62.8, steps: ['The distance around is about 3.14 times the distance across.', 'The diameter is 20 cm, so multiply: 20 × 3.14.', 'So it is 62.8 cm around.'],
      prompt: 'Multiply the distance across by 3.14.',
      hint1: 'Which number tells you the distance straight across?',
      hint2: 'Multiply 20 by 3.14.',
      twin: { text: 'A round table has a radius of 4 ft. How far is it around the edge, in feet? Use 3.14.',
        picture: circle(4, '4 ft', 'r'),
        answer: 25.12, steps: ['The radius is half the way across, so the diameter is 4 × 2 = 8 ft.', 'Multiply the diameter by 3.14: 8 × 3.14.', 'So it is 25.12 feet around.'],
        hint1: 'Is 4 ft the whole way across, or only half?', hint2: 'Double the radius first. Then multiply by 3.14.' },
    },
    won: { text: 'You multiplied the distance across by 3.14.', sticker: 'The distance around a circle is its circumference. C = π × d, and π is about 3.14.' },
    twinWon: { text: 'You doubled the 4 ft radius, then multiplied by 3.14.', sticker: 'The distance around a circle is its circumference. C = π × d, and π is about 3.14.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'A clock has a diameter of 30 cm. How far is it around the edge, in centimeters? Use 3.14.',
        picture: circle(15, '30 cm', 'd'), answer: 94.2,
        steps: ['The diameter is 30 cm.', 'Multiply by 3.14: 30 × 3.14.', 'So it is 94.2 cm around.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'A jar lid has a diameter of 7 in. How far is it around the edge, in inches? Use 3.14.',
        picture: circle(3.5, '7 in', 'd'), answer: 21.98,
        steps: ['The diameter is 7 in.', 'Multiply by 3.14: 7 × 3.14.', 'So it is 21.98 inches around.'] } },
      { why: 'Still "3.14 times across"', problem: { text: 'A round pond has a radius of 6 m. How far is it around the edge, in meters? Use 3.14.',
        picture: circle(6, '6 m', 'r'), answer: 37.68,
        steps: ['The radius is half the way across, so the diameter is 12 m.', 'Multiply by 3.14: 12 × 3.14.', 'So it is 37.68 meters around.'] } },
      { why: 'A little harder', problem: { text: 'A round cake has a radius of 12.5 cm. How far is it around the edge, in centimeters? Use 3.14.',
        picture: circle(12.5, '12.5 cm', 'r'), answer: 78.5,
        steps: ['Double the radius: the diameter is 25 cm.', 'Multiply by 3.14: 25 × 3.14.', 'So it is 78.5 cm around.'] } },
      { why: 'Same math in a story', problem: { text: 'A bike wheel has a diameter of 60 cm. How far does the bike move when the wheel turns once, in centimeters? Use 3.14.',
        picture: circle(30, '60 cm', 'd'), answer: 188.4,
        steps: ['One turn rolls out the distance around the wheel.', 'Multiply the diameter by 3.14: 60 × 3.14.', 'So the bike moves 188.4 cm.'] } },
    ],
  },

  // ── Topic 3 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g7m4-t3', title: 'Area of a circle', skill: 'Area of a circle: A = π × r × r, using π ≈ 3.14',
    bigIdea: 'The area of a circle is 3.14 × radius × radius. Use the radius, not the diameter.',
    screens: [
      { title: 'A round pond', text: 'A round pond reaches 10 m from its center to its edge. How much ground does it cover?',
        pictures: [circle(10, '10 m', 'r')] },
      { title: 'Squares do not fit', text: 'You might think about covering it with square tiles and counting them. But those squares leave little curved gaps all the way around the edge. So counting tiles will never give us an exact answer.',
        beats: [
          { say: 'You might think about covering it with square tiles and counting them.', pic: 0 },
          { say: 'But those squares leave little curved gaps all the way around the edge.' },
          { say: 'So counting tiles will never give us an exact answer.', write: 'tiles leave gaps → not exact' },
        ],
        pictures: [circle(10, '10 m', 'r')] },
      { title: 'The big idea', text: 'The area of a circle is 3.14 × radius × radius. Use the radius, not the diameter.',
        beats: [
          { say: 'The area of a circle is 3.14 × radius × radius.', pic: 0 },
          { say: 'Use the radius, not the diameter.' },
        ],
        pictures: [circle(10, '10 m', 'r')] },
      { title: 'Cut it into slices', text: 'So we do something clever. Cut the circle into thin slices, like a pizza. Then lay them side by side: one point up, the next point down.',
        beats: [
          { say: 'So we do something clever. Cut the circle into thin slices, like a pizza.', pic: 0 },
          { say: 'Then lay them side by side: one point up, the next point down.' },
        ],
        pictures: [slices(false, true)] },
      { title: 'Almost a rectangle', text: 'Look what that turns into. It is almost a rectangle. The long side is half the way around the circle: 3.14 × 10 = 31.4 m. And the short side is just the radius, 10 m.',
        beats: [
          { say: 'Look what that turns into. It is almost a rectangle.', pic: 0 },
          { say: 'The long side is half the way around the circle: 3.14 × 10 = 31.4 m.' },
          { say: 'And the short side is just the radius, 10 m.' },
        ],
        pictures: [slices(true)] },
      { title: 'Multiply', text: 'Now multiply the two sides, the way we always do with a rectangle: 31.4 × 10 = 314. And that is exactly the same as 3.14 × 10 × 10. So the pond covers 314 square meters.',
        beats: [
          { say: 'Now multiply the two sides, the way we always do with a rectangle: 31.4 × 10 = 314.', pic: 0 },
          { say: 'And that is exactly the same as 3.14 × 10 × 10.', pic: 1 },
          { say: 'So the pond covers 314 square meters.' },
        ],
        pictures: [slices(true), { kind: 'eq', text: '3.14 × 10 × 10 = 314', lines: ['314 square meters'] }] },
      { title: 'One thing not to do', text: "One thing to be careful about here. Don't reach for the distance across. The pond is 20 m across, but this rule wants the radius, 10 m.",
        beats: [
          { say: 'One thing to be careful about here.' },
          { say: "Don't reach for the distance across.", pic: 0 },
          { say: 'The pond is 20 m across, but this rule wants the radius, 10 m.' },
        ],
        pictures: [{ kind: 'cards', wrong: '3.14 × 20 × 20 = 1,256', right: '3.14 × 10 × 10 = 314' }] },
    ],
    turn: {
      text: 'A round rug has a radius of 3 m. What is its area in square meters? Use π ≈ 3.14.',
      picture: circle(3, '3 m', 'r'),
      answer: 28.26, steps: ['Radius × radius: 3 × 3 = 9.', 'Multiply by 3.14: 9 × 3.14.', 'So the area is 28.26 square meters.'],
      prompt: 'Multiply the radius by itself. Then multiply by 3.14.',
      hint1: 'Which length does the rule use: across, or center to edge?',
      hint2: 'Find 3 × 3 first. Then multiply by 3.14.',
      twin: { text: 'A round clock face has a diameter of 10 in. What is its area in square inches? Use π ≈ 3.14.',
        picture: circle(5, '10 in', 'd'),
        answer: 78.5, steps: ['Halve the diameter: the radius is 5 in.', 'Radius × radius: 5 × 5 = 25. Then 25 × 3.14.', 'So the area is 78.5 square inches.'],
        hint1: 'The rule needs the radius. Is 10 in the radius?', hint2: 'Take half of 10 first. Multiply that by itself, then by 3.14.' },
    },
    won: { text: 'You multiplied the radius by itself, then by 3.14.', sticker: 'The area of a circle is A = π × r × r, and π is about 3.14.' },
    twinWon: { text: 'You halved the 10 in diameter before using the rule.', sticker: 'The area of a circle is A = π × r × r, and π is about 3.14.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'A round mat has a radius of 4 cm. What is its area in square centimeters? Use π ≈ 3.14.',
        picture: circle(4, '4 cm', 'r'), answer: 50.24,
        steps: ['Radius × radius: 4 × 4 = 16.', 'Multiply by 3.14: 16 × 3.14.', 'So the area is 50.24 square centimeters.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'A round table top has a radius of 6 ft. What is its area in square feet? Use π ≈ 3.14.',
        picture: circle(6, '6 ft', 'r'), answer: 113.04,
        steps: ['Radius × radius: 6 × 6 = 36.', 'Multiply by 3.14: 36 × 3.14.', 'So the area is 113.04 square feet.'] } },
      { why: 'Still "radius × radius × 3.14"', problem: { text: 'A circle has a radius of 7 in. What is its area in square inches? Use π ≈ 3.14.',
        picture: circle(7, '7 in', 'r'), answer: 153.86,
        steps: ['Radius × radius: 7 × 7 = 49.', 'Multiply by 3.14: 49 × 3.14.', 'So the area is 153.86 square inches.'] } },
      { why: 'A little harder', problem: { text: 'A round garden has a diameter of 18 m. What is its area in square meters? Use π ≈ 3.14.',
        picture: circle(9, '18 m', 'd'), answer: 254.34,
        steps: ['Halve the diameter: the radius is 9 m.', 'Radius × radius: 9 × 9 = 81. Then 81 × 3.14.', 'So the area is 254.34 square meters.'] } },
      { why: 'Same math in a story', problem: { text: 'A sprinkler waters the grass up to 8 m away in every direction. How many square meters of grass does it water? Use π ≈ 3.14.',
        picture: circle(8, '8 m', 'r'), answer: 200.96,
        steps: ['It waters a circle with a radius of 8 m.', 'Radius × radius: 8 × 8 = 64. Then 64 × 3.14.', 'So it waters 200.96 square meters.'] } },
    ],
  },

  // ── Topic 4 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g7m4-t4', title: 'Complementary and supplementary angles', skill: 'Find a missing angle when two angles make a right angle (90°) or a straight line (180°)',
    bigIdea: 'Two angles that make a square corner add up to 90°. Two angles that make a straight line add up to 180°.',
    screens: [
      { title: 'A shelf bracket', text: 'A brace splits the square corner of a shelf bracket into two angles. One is 35°. What is the other?',
        pictures: [corner([55, 35], ['?', '35°'])] },
      { title: 'What is the whole?', text: 'To find a missing part, you always need to know the whole first. And a square corner and a straight line are two very different wholes.',
        beats: [
          { say: 'To find a missing part, you always need to know the whole first.', pic: 0 },
          { say: 'And a square corner and a straight line are two very different wholes.', pic: 1 },
        ],
        pictures: [corner([55, 35], ['?', '35°']), corner([145, 35], ['?', '35°'])] },
      { title: 'The big idea', text: 'Two angles that make a square corner add up to 90°. Two angles that make a straight line add up to 180°.',
        beats: [
          { say: 'Two angles that make a square corner add up to 90°.', pic: 0 },
          { say: 'Two angles that make a straight line add up to 180°.', pic: 1 },
        ],
        pictures: [{ kind: 'angle', deg: 90, label: '90°' }, { kind: 'angle', deg: 180, label: '180°' }] },
      { title: 'The parts fill the corner', text: 'Back to our bracket. Watch the two angles fill that square corner with no gap at all. So together, those two have to make 90°.',
        beats: [
          { say: 'Back to our bracket. Watch the two angles fill that square corner with no gap at all.', pic: 0 },
          { say: 'So together, those two have to make 90°.', write: 'square corner = 90°' },
        ],
        pictures: [corner([55, 35], [null, '35°'], true)] },
      { title: 'Take away the part you know', text: 'So take away the part we already know. 90 − 35 = 55. That other angle is 55°.',
        beats: [
          { say: 'So take away the part we already know.', pic: 0 },
          { say: '90 − 35 = 55. That other angle is 55°.', pic: 1 },
        ],
        pictures: [corner([55, 35], ['?', '35°']), { kind: 'eq', text: '90° − 35° = 55°' }] },
      { title: 'A straight line starts at 180', text: 'Now, if those two angles made a straight line instead, we start from 180. Same move, different whole. 180 − 35 = 145.',
        beats: [
          { say: 'Now, if those two angles made a straight line instead, we start from 180.', pic: 0 },
          { say: 'Same move, different whole. 180 − 35 = 145.', pic: 1, write: 'straight line = 180°' },
        ],
        pictures: [corner([145, 35], ['?', '35°']), { kind: 'eq', text: '180° − 35° = 145°' }] },
      { title: 'One thing not to do', text: "Here is the mix-up to avoid. Don't start from 180 when the two angles make a square corner. Always look at the whole first.",
        beats: [
          { say: 'Here is the mix-up to avoid.' },
          { say: "Don't start from 180 when the two angles make a square corner.", pic: 0 },
          { say: 'Always look at the whole first.' },
        ],
        pictures: [{ kind: 'cards', wrong: 'square corner: 180° − 35° = 145°', right: 'square corner: 90° − 35° = 55°' }] },
    ],
    turn: {
      text: 'Two angles make a square corner. One is 28°. How many degrees is the other?',
      picture: corner([62, 28], ['?', '28°']),
      answer: 62, steps: ['Together they make a square corner, so they add up to 90°.', 'Take away the part you know: 90 − 28.', 'So the other angle is 62°.'],
      prompt: 'Find the whole first. Then take away the angle you know.',
      hint1: 'Do the two angles make a square corner or a straight line?',
      hint2: 'Start at 90 and take away 28.',
      twin: { text: 'Two angles make a straight line. One is 47°. How many degrees is the other?',
        picture: corner([133, 47], ['?', '47°']),
        answer: 133, steps: ['Together they make a straight line, so they add up to 180°.', 'Take away the part you know: 180 − 47.', 'So the other angle is 133°.'],
        hint1: 'A straight line is a half turn. What do the two angles add up to?', hint2: 'Start at 180 and take away 47.' },
    },
    won: { text: 'You saw the square corner and took the angle you know away from 90°.', sticker: 'Angles that add up to 90° are complementary. Angles that add up to 180° are supplementary.' },
    twinWon: { text: 'You saw the straight line and took 47° away from 180°.', sticker: 'Angles that add up to 90° are complementary. Angles that add up to 180° are supplementary.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'Two angles make a square corner. One is 40°. How many degrees is the other?',
        picture: corner([50, 40], ['?', '40°']), answer: 50,
        steps: ['A square corner is 90°.', 'Take away the part you know: 90 − 40.', 'So the other angle is 50°.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Two angles make a straight line. One is 65°. How many degrees is the other?',
        picture: corner([115, 65], ['?', '65°']), answer: 115,
        steps: ['A straight line is 180°.', 'Take away the part you know: 180 − 65.', 'So the other angle is 115°.'] } },
      { why: 'Still "find the whole first"', problem: { text: 'Two angles make a square corner. One is 72°. How many degrees is the other?',
        picture: corner([18, 72], ['?', '72°']), answer: 18,
        steps: ['A square corner is 90°.', 'Take away the part you know: 90 − 72.', 'So the other angle is 18°.'] } },
      { why: 'A little harder', problem: { text: 'Two angles are supplementary. One is 104°. How many degrees is the other?',
        picture: corner([76, 104], ['?', '104°']), answer: 76,
        steps: ['Supplementary angles add up to 180°.', 'Take away the part you know: 180 − 104.', 'So the other angle is 76°.'] } },
      { why: 'Same math in a story', problem: { text: 'A window frame has a square corner. A brace across the corner makes a 38° angle with the bottom of the frame. What is the other angle in that corner?',
        picture: corner([38, 52], ['38°', '?']), answer: 52,
        steps: ['The two angles fill the square corner, so they add up to 90°.', 'Take away the part you know: 90 − 38.', 'So the other angle is 52°.'] } },
    ],
  },

  // ── Topic 5 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g7m4-t5', title: 'Vertical angles', skill: 'Angles straight across from each other where two lines cross are equal',
    bigIdea: 'When two straight lines cross, the angles straight across from each other are equal.',
    screens: [
      { title: 'Crossing roads', text: 'Two straight roads cross. One angle between them is 50°. What is the angle straight across from it?',
        pictures: [cross(50, { r: '50°', l: '?' })] },
      { title: 'Four angles at one crossing', text: 'A crossing like this makes four angles. You could get out a protractor and measure every one of them. But both lines are straight, and that already tells us a lot.',
        beats: [
          { say: 'A crossing like this makes four angles.', pic: 0 },
          { say: 'You could get out a protractor and measure every one of them.' },
          { say: 'But both lines are straight, and that already tells us a lot.', write: 'a straight line = 180°' },
        ],
        pictures: [cross(50, { r: '50°' })] },
      { title: 'The big idea', text: 'When two straight lines cross, the angles straight across from each other are equal.',
        beats: [
          { say: 'When two straight lines cross, the angles straight across from each other are equal.', pic: 0 },
        ],
        pictures: [cross(50, { r: '50°', l: '50°' })] },
      { title: 'Next door makes a straight line', text: 'Look at the 50° angle and the one at the top. They sit side by side on one straight line. So the top angle has to be 180 − 50, which is 130°.',
        beats: [
          { say: 'Look at the 50° angle and the one at the top. They sit side by side on one straight line.', pic: 0 },
          { say: 'So the top angle has to be 180 − 50, which is 130°.' },
        ],
        pictures: [cross(50, { r: '50°', t: '130°' }, true)] },
      { title: 'Across comes out the same', text: 'Now the left angle. It sits on a straight line with that top angle too. So it is 180 − 130, which is 50°, the very same as the angle across from it.',
        beats: [
          { say: 'Now the left angle. It sits on a straight line with that top angle too.', pic: 0 },
          { say: 'So it is 180 − 130, which is 50°, the very same as the angle across from it.', pic: 1 },
        ],
        pictures: [cross(50, { r: '50°', t: '130°', l: '50°' }), { kind: 'eq', text: '180° − 130° = 50°' }] },
      { title: 'Copy it across', text: 'And that is the whole thing: the angles straight across always match. Left and right are both 50°. Top and bottom are both 130°.',
        beats: [
          { say: 'And that is the whole thing: the angles straight across always match.', pic: 0 },
          { say: 'Left and right are both 50°. Top and bottom are both 130°.', write: 'across → equal' },
        ],
        pictures: [cross(50, { r: '50°', l: '50°', t: '130°', b: '130°' })] },
      { title: 'One thing not to do', text: "One warning before your turn. Don't take the angle away from 180. That gives you the angle next door, not the one straight across.",
        beats: [
          { say: 'One warning before your turn.' },
          { say: "Don't take the angle away from 180.", pic: 0 },
          { say: 'That gives you the angle next door, not the one straight across.' },
        ],
        pictures: [{ kind: 'cards', wrong: 'across from 50°: 180° − 50° = 130°', right: 'across from 50°: 50°' }] },
    ],
    turn: {
      text: 'Two straight lines cross. One angle is 65°. What is the angle straight across from it?',
      picture: cross(65, { r: '65°', l: '?' }),
      answer: 65, steps: ['The ? angle is straight across from the 65° angle, not next door.', 'Angles straight across from each other are equal.', 'So the angle is 65°.'],
      prompt: 'Is the missing angle straight across, or next door?',
      hint1: 'Is the ? angle next door, or straight across?',
      hint2: 'Straight-across angles match. Look at the angle opposite the ?.',
      twin: { text: 'Two straight lines cross. The top angle is 118°. What is the bottom angle?',
        picture: cross(62, { t: '118°', b: '?' }),
        answer: 118, steps: ['The bottom angle is straight across from the top angle.', 'Angles straight across from each other are equal.', 'So the bottom angle is 118°.'],
        hint1: 'Where is the ? angle: next door, or straight across?', hint2: 'Angles straight across from each other are equal.' },
    },
    won: { text: 'You saw the angle was straight across, so it matched.', sticker: 'Angles straight across from each other at a crossing are vertical angles. They are always equal.' },
    twinWon: { text: 'You saw the bottom angle was straight across from the 118° angle.', sticker: 'Angles straight across from each other at a crossing are vertical angles. They are always equal.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'Two straight lines cross. One angle is 72°. What is the angle straight across from it?',
        picture: cross(72, { r: '72°', l: '?' }), answer: 72,
        steps: ['The ? angle is straight across from the 72° angle.', 'Straight-across angles are equal.', 'So the angle is 72°.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Two straight lines cross. The top angle is 135°. What is the bottom angle?',
        picture: cross(45, { t: '135°', b: '?' }), answer: 135,
        steps: ['The bottom angle is straight across from the top angle.', 'Straight-across angles are equal.', 'So the bottom angle is 135°.'] } },
      { why: 'Still "across means equal"', problem: { text: 'Two straight lines cross. The right angle is 81°. What is the left angle?',
        picture: cross(81, { r: '81°', l: '?' }), answer: 81,
        steps: ['The left angle is straight across from the right angle.', 'Straight-across angles are equal.', 'So the left angle is 81°.'] } },
      { why: 'A little harder', problem: { text: 'Two straight lines cross. The right angle is 58°. What is the bottom angle?',
        picture: cross(58, { r: '58°', b: '?' }), answer: 122,
        steps: ['The bottom angle is next door to the 58° angle, on a straight line.', 'So the two add up to 180°: 180 − 58.', 'So the bottom angle is 122°.'] } },
      { why: 'Same math in a story', problem: { text: 'Open scissors make an X. The blades make a 34° angle between them. What is the angle between the handles, straight across from it?',
        picture: cross(34, { r: '34°', l: '?' }), answer: 34,
        steps: ['The handles are straight across from the blades.', 'Straight-across angles are equal.', 'So the angle between the handles is 34°.'] } },
    ],
  },

  // ── Topic 6 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g7m4-t6', title: 'Can these sides make a triangle?', skill: 'Three lengths make a triangle only when the two shorter add up to more than the longest',
    bigIdea: 'Three sides make a triangle only if the two shorter sides add up to more than the longest side.',
    screens: [
      { title: 'Three sticks', text: 'You have sticks 3 cm, 4 cm and 9 cm long. Can you join their ends to make a triangle?',
        pictures: [sticks(3, 4, 9, 'cm')] },
      { title: 'Some sets do not close', text: 'It feels like any three sticks ought to work. But lay the long one down and try to join the other two up above it. Look at that. They do not meet.',
        beats: [
          { say: 'It feels like any three sticks ought to work.', pic: 0 },
          { say: 'But lay the long one down and try to join the other two up above it.' },
          { say: 'Look at that. They do not meet.', write: 'the two ends must meet' },
        ],
        pictures: [{ kind: 'poly', shapes: [], segs: [
          { a: [0, 0], b: [9, 0], dots: true, label: '9 cm' },
          { a: [0, 0], b: [1.5, 2.6], dots: true, label: '3 cm' },
          { a: [9, 0], b: [7, 3.46], dots: true, label: '4 cm' },
        ] }] },
      { title: 'The big idea', text: 'Three sides make a triangle only if the two shorter sides add up to more than the longest side.',
        beats: [
          { say: 'Three sides make a triangle only if the two shorter sides add up to more than the longest side.', pic: 0 },
        ],
        pictures: [{ kind: 'poly', shapes: [{ pts: [[0, 0], [5, 0], [1.8, 2.4]], sides: ['5 cm', '4 cm', '3 cm'], tone: 1 }] }] },
      { title: 'Lay them flat', text: 'Watch. Swing the 3 cm and the 4 cm stick down flat onto the 9 cm one. Together they only reach 7 cm, so there is no way they can meet.',
        beats: [
          { say: 'Watch. Swing the 3 cm and the 4 cm stick down flat onto the 9 cm one.', pic: 0 },
          { say: 'Together they only reach 7 cm, so there is no way they can meet.', pic: 1 },
        ],
        pictures: [{ kind: 'poly', motion: true, shapes: [], segs: [
          { a: [0, 0], b: [9, 0], dots: true, label: '9 cm' },
          { a: [0, 1.2], b: [3, 1.2], dots: true, tone: 2, label: '3 cm' },
          { a: [5, 1.2], b: [9, 1.2], dots: true, tone: 2, label: '4 cm' },
        ] }, { kind: 'eq', text: '3 + 4 = 7', lines: ['7 is less than 9, so no'] }] },
      { title: 'When it works', text: 'Now try 3 cm, 4 cm and 5 cm instead. 3 + 4 = 7, and 7 is more than 5. The two short sticks reach past each other, and up they lift into a point.',
        beats: [
          { say: 'Now try 3 cm, 4 cm and 5 cm instead. 3 + 4 = 7, and 7 is more than 5.', pic: 1 },
          { say: 'The two short sticks reach past each other, and up they lift into a point.', pic: 0 },
        ],
        pictures: [{ kind: 'poly', motion: true, shapes: [{ pts: [[0, 0], [5, 0], [1.8, 2.4]], sides: ['5 cm', '4 cm', '3 cm'], tone: 1 }] },
          { kind: 'eq', text: '3 + 4 = 7', lines: ['7 is more than 5, so yes'] }] },
      { title: 'Just enough is not enough', text: 'One more. Try 3 cm, 4 cm and 7 cm. This time 3 + 4 = 7 exactly. The sticks do meet, but only lying flat, and flat is not a triangle.',
        beats: [
          { say: 'One more. Try 3 cm, 4 cm and 7 cm.', pic: 0 },
          { say: 'This time 3 + 4 = 7 exactly.', pic: 1 },
          { say: 'The sticks do meet, but only lying flat, and flat is not a triangle.', write: 'equal is not enough' },
        ],
        pictures: [{ kind: 'poly', shapes: [], segs: [
          { a: [0, 0], b: [7, 0], dots: true, label: '7 cm' },
          { a: [0, 1.2], b: [3, 1.2], dots: true, tone: 2, label: '3 cm' },
          { a: [3, 1.2], b: [7, 1.2], dots: true, tone: 2, label: '4 cm' },
        ] }, { kind: 'eq', text: '3 + 4 = 7', lines: ['7 is not more than 7, so no'] }] },
      { title: 'One thing not to do', text: "And here is how people get tricked. Don't add the longest side to a short one. Add the two shorter sides, then compare that with the longest.",
        beats: [
          { say: 'And here is how people get tricked.' },
          { say: "Don't add the longest side to a short one.", pic: 0 },
          { say: 'Add the two shorter sides, then compare that with the longest.' },
        ],
        pictures: [{ kind: 'cards', wrong: '9 + 3 = 12, more than 4, so yes', right: '3 + 4 = 7, less than 9, so no' }] },
    ],
    turn: {
      text: 'Can sticks 2 cm, 5 cm and 8 cm long make a triangle?',
      picture: sticks(2, 5, 8, 'cm'),
      answer: YES_NO(false), steps: ['The two shorter sticks are 2 cm and 5 cm. 2 + 5 = 7.', '7 is not more than the longest stick, 8 cm.', 'So the answer is no.'],
      prompt: 'Add the two shorter sides. Is that more than the longest?',
      hint1: 'Which two sticks are the shortest?',
      hint2: 'Add 2 and 5. Is that more than 8?',
      twin: { text: 'Can sticks 6 in, 7 in and 10 in long make a triangle?',
        picture: sticks(6, 7, 10, 'in'),
        answer: YES_NO(true), steps: ['The two shorter sticks are 6 in and 7 in. 6 + 7 = 13.', '13 is more than the longest stick, 10 in.', 'So the answer is yes.'],
        hint1: 'Find the two shorter sticks and add them.', hint2: 'Compare 6 + 7 with the longest stick, 10 in.' },
    },
    won: { text: 'You added the two shorter sides and compared them with the longest.', sticker: 'The rule that the two shorter sides must add to more than the longest is the triangle inequality.' },
    twinWon: { text: 'You checked that 6 + 7 is more than 10, so they make a triangle.', sticker: 'The rule that the two shorter sides must add to more than the longest is the triangle inequality.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'Can sticks 3 cm, 5 cm and 9 cm long make a triangle?',
        picture: sticks(3, 5, 9, 'cm'), answer: YES_NO(false),
        steps: ['The two shorter sticks: 3 + 5 = 8.', '8 is not more than 9.', 'So the answer is no.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'Can sticks 4 cm, 6 cm and 8 cm long make a triangle?',
        picture: sticks(4, 6, 8, 'cm'), answer: YES_NO(true),
        steps: ['The two shorter sticks: 4 + 6 = 10.', '10 is more than 8.', 'So the answer is yes.'] } },
      { why: 'Still "short + short more than longest"', problem: { text: 'Can sticks 5 in, 5 in and 10 in long make a triangle?',
        picture: sticks(5, 5, 10, 'in'), answer: YES_NO(false),
        steps: ['The two shorter sticks: 5 + 5 = 10.', '10 is not more than 10. They would only meet lying flat.', 'So the answer is no.'] } },
      { why: 'A little harder', problem: { text: 'Can sides 12 m, 5 m and 8 m long make a triangle?',
        picture: sticks(12, 5, 8, 'm'), answer: YES_NO(true),
        steps: ['The longest side is 12 m, so the two shorter are 5 m and 8 m.', '5 + 8 = 13, and 13 is more than 12.', 'So the answer is yes.'] } },
      { why: 'Same math in a story', problem: { text: 'Jo has fence pieces 4 ft, 11 ft and 6 ft long. Can she make a triangle pen with them?',
        picture: sticks(4, 11, 6, 'ft'), answer: YES_NO(false),
        steps: ['The longest piece is 11 ft. The two shorter: 4 + 6 = 10.', '10 is not more than 11, so the ends will not meet.', 'So the answer is no.'] } },
    ],
  },

  // ── Topic 7 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g7m4-t7', title: 'Surface area of prisms', skill: 'Surface area of rectangular and triangular prisms: unfold into a net and add every face',
    bigIdea: 'Unfold the prism flat. Find the area of every face, both ends and every side, then add them all.',
    screens: [
      { title: 'A doorstop wedge', text: 'A wooden doorstop has a triangle at each end, with sides 3 cm, 4 cm and 5 cm. It is 10 cm long. How much paint covers every face?',
        pictures: [wedge(4, 3, 10, 'cm', 0, '5 cm')] },
      { title: 'Not the space inside', text: 'Paint only touches the outside of the wedge. So working out the space inside will not help us here. What we need is every flat face.',
        beats: [
          { say: 'Paint only touches the outside of the wedge.', pic: 0 },
          { say: 'So working out the space inside will not help us here.' },
          { say: 'What we need is every flat face.', write: 'paint → the faces, not the inside' },
        ],
        pictures: [wedge(4, 3, 10, 'cm', 0, '5 cm')] },
      { title: 'The big idea', text: 'Unfold the prism flat. Find the area of every face, both ends and every side, then add them all.',
        beats: [
          { say: 'Unfold the prism flat.', pic: 0 },
          { say: 'Find the area of every face, both ends and every side, then add them all.' },
        ],
        pictures: [triNet(3, 4, 5, 10, 'cm')] },
      { title: 'Unfold it', text: "Let's actually do it. Cut along a few edges and lay the wedge out flat. Count what you get: 2 triangle ends and 3 rectangle sides.",
        beats: [
          { say: "Let's actually do it. Cut along a few edges and lay the wedge out flat.", pic: 0 },
          { say: 'Count what you get: 2 triangle ends and 3 rectangle sides.', write: '2 ends + 3 sides' },
        ],
        pictures: [triNet(3, 4, 5, 10, 'cm', 'names', true)] },
      { title: 'Area of each face', text: 'Now the area of each one, and I will write them on as I go. Each triangle end is 1/2 × 4 × 3, which is 6. And the three sides: 3 × 10 = 30, 4 × 10 = 40, and 5 × 10 = 50.',
        beats: [
          { say: 'Now the area of each one, and I will write them on as I go.', pic: 0 },
          { say: 'Each triangle end is 1/2 × 4 × 3, which is 6.' },
          { say: 'And the three sides: 3 × 10 = 30, 4 × 10 = 40, and 5 × 10 = 50.' },
        ],
        pictures: [triNet(3, 4, 5, 10, 'cm', 'areas')] },
      { title: 'Add every face', text: 'Last step. Add every single face. 6 + 6 + 30 + 40 + 50 = 132. So the paint covers 132 square centimeters.',
        beats: [
          { say: 'Last step. Add every single face.', pic: 0 },
          { say: '6 + 6 + 30 + 40 + 50 = 132. So the paint covers 132 square centimeters.', pic: 1 },
        ],
        pictures: [triNet(3, 4, 5, 10, 'cm', 'areas'), { kind: 'eq', text: '6 + 6 + 30 + 40 + 50 = 132', lines: ['132 square centimeters'] }] },
      { title: 'One thing not to do', text: "The slip here is a quiet one. Don't count just one end. The wedge has a triangle at both ends, so that 6 goes in twice.",
        beats: [
          { say: 'The slip here is a quiet one.' },
          { say: "Don't count just one end.", pic: 0 },
          { say: 'The wedge has a triangle at both ends, so that 6 goes in twice.' },
        ],
        pictures: [{ kind: 'cards', wrong: '6 + 30 + 40 + 50 = 126', right: '6 + 6 + 30 + 40 + 50 = 132' }] },
    ],
    turn: {
      text: 'A wedge has triangle ends with sides 3 cm, 4 cm and 5 cm, and it is 8 cm long. It is unfolded flat below. What is the area of all its faces in square centimeters?',
      picture: triNet(3, 4, 5, 8, 'cm'),
      answer: 108, steps: ['Two triangle ends: 1/2 × 4 × 3 = 6 each, so 12.', 'Three sides: 3 × 8 = 24, 4 × 8 = 32 and 5 × 8 = 40.', '12 + 24 + 32 + 40 = 108. So 108 square centimeters.'],
      prompt: 'Find the area of both ends and all three sides. Then add.',
      hint1: 'How many faces are there? Count the triangles and the rectangles.',
      hint2: 'Each triangle is 1/2 × 4 × 3. Each rectangle is one triangle side × 8.',
      twin: { text: 'A wedge has triangle ends with sides 6 in, 8 in and 10 in, and it is 5 in long. It is unfolded flat below. What is the area of all its faces in square inches?',
        picture: triNet(6, 8, 10, 5, 'in'),
        answer: 168, steps: ['Two triangle ends: 1/2 × 8 × 6 = 24 each, so 48.', 'Three sides: 6 × 5 = 30, 8 × 5 = 40 and 10 × 5 = 50.', '48 + 30 + 40 + 50 = 168. So 168 square inches.'],
        hint1: 'There are 2 triangles and 3 rectangles.', hint2: 'Each triangle is 1/2 × 8 × 6. The rectangles are 6 × 5, 8 × 5 and 10 × 5.' },
    },
    won: { text: 'You added both triangle ends and all three sides.', sticker: 'The total area of all the faces of a prism is its surface area.' },
    twinWon: { text: 'You added both ends and all three sides of the 5 in wedge.', sticker: 'The total area of all the faces of a prism is its surface area.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'A wedge has triangle ends with sides 3 cm, 4 cm and 5 cm, and it is 6 cm long. What is the area of all its faces in square centimeters?',
        picture: triNet(3, 4, 5, 6, 'cm'), answer: 84,
        steps: ['Two triangle ends: 1/2 × 4 × 3 = 6 each, so 12.', 'Three sides: 3 × 6 = 18, 4 × 6 = 24 and 5 × 6 = 30.', '12 + 18 + 24 + 30 = 84. So 84 square centimeters.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'A box is 4 cm long, 3 cm wide and 5 cm tall. It is unfolded flat below. What is the area of all its faces in square centimeters?',
        picture: boxNet(4, 3, 5, 'cm'), answer: 94,
        steps: ['Top and bottom: 4 × 3 = 12 each. Front and back: 4 × 5 = 20 each.', 'The two ends: 3 × 5 = 15 each. One of each: 12 + 20 + 15 = 47.', 'Each face has a partner: 47 × 2. So 94 square centimeters.'] } },
      { why: 'Still "add every face"', problem: { text: 'A wedge has triangle ends with sides 6 m, 8 m and 10 m, and it is 10 m long. What is the area of all its faces in square meters?',
        picture: triNet(6, 8, 10, 10, 'm'), answer: 288,
        steps: ['Two triangle ends: 1/2 × 8 × 6 = 24 each, so 48.', 'Three sides: 6 × 10 = 60, 8 × 10 = 80 and 10 × 10 = 100.', '48 + 60 + 80 + 100 = 288. So 288 square meters.'] } },
      { why: 'A little harder', problem: { text: 'A wedge has triangle ends with sides 5 in, 12 in and 13 in, and it is 7 in long. What is the area of all its faces in square inches?',
        picture: triNet(5, 12, 13, 7, 'in'), answer: 270,
        steps: ['Two triangle ends: 1/2 × 12 × 5 = 30 each, so 60.', 'Three sides: 5 × 7 = 35, 12 × 7 = 84 and 13 × 7 = 91.', '60 + 35 + 84 + 91 = 270. So 270 square inches.'] } },
      { why: 'Same math in a story', problem: { text: 'Maya wraps a cereal box that is 8 inches long, 2 inches wide and 12 inches tall. How many square inches of paper cover every face?',
        picture: boxNet(8, 2, 12, 'in'), answer: 272,
        steps: ['Top and bottom: 8 × 2 = 16 each. Front and back: 8 × 12 = 96 each.', 'The two ends: 2 × 12 = 24 each. One of each: 16 + 96 + 24 = 136.', 'Each face has a partner: 136 × 2. So 272 square inches.'] } },
    ],
  },

  // ── Topic 8 ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'g7m4-t8', title: 'Volume of prisms', skill: 'Volume of a prism = base area × height, for rectangular and triangular prisms',
    bigIdea: 'Find the area of the base. Then multiply it by the height: volume = base area × height.',
    screens: [
      { title: 'Filling a box', text: 'A box is 5 cm long, 3 cm wide and 4 cm tall. How many 1 cm cubes fill it?',
        pictures: [box('5 cm', '3 cm', '4 cm')] },
      { title: 'Too many to count', text: 'You could stack the cubes in and count them one at a time. But most of them would end up hidden inside, where you cannot see them. We need a faster way.',
        beats: [
          { say: 'You could stack the cubes in and count them one at a time.', pic: 0 },
          { say: 'But most of them would end up hidden inside, where you cannot see them.' },
          { say: 'We need a faster way.', write: 'count layers, not cubes' },
        ],
        pictures: [box('5 cm', '3 cm', '4 cm')] },
      { title: 'The big idea', text: 'Find the area of the base. Then multiply it by the height: volume = base area × height.',
        beats: [
          { say: 'Find the area of the base.', pic: 0 },
          { say: 'Then multiply it by the height: volume = base area × height.' },
        ],
        pictures: [box('5 cm', '3 cm', '4 cm')] },
      { title: 'The bottom layer', text: 'Start at the bottom. The base is 5 cm by 3 cm. Its area is 5 × 3 = 15, so 15 cubes cover that floor.',
        beats: [
          { say: 'Start at the bottom. The base is 5 cm by 3 cm.', pic: 0 },
          { say: 'Its area is 5 × 3 = 15, so 15 cubes cover that floor.', pic: 1 },
        ],
        pictures: [box('5 cm', '3 cm', '4 cm'), { kind: 'eq', text: '5 × 3 = 15', lines: ['15 cubes in one layer'] }] },
      { title: 'Stack the layers', text: 'Now stack them up. The box is 4 cm tall, so we get 4 layers of 15. Count them along: 15 × 4 = 60 cubic centimeters.',
        beats: [
          { say: 'Now stack them up. The box is 4 cm tall, so we get 4 layers of 15.', pic: 0 },
          { say: 'Count them along: 15 × 4 = 60 cubic centimeters.', pic: 1 },
        ],
        pictures: [box('5 cm', '3 cm', '4 cm'),
          { kind: 'table', head: ['layers', '1', '2', '3', '4'], rows: [['cubes', '15', '30', '45', '60']], rowHead: true, motion: true }] },
      { title: 'A triangle base works too', text: "And this works for a wedge too, where the base is a triangle. Find the triangle's area first, then multiply by how far the wedge goes. Same move.",
        beats: [
          { say: 'And this works for a wedge too, where the base is a triangle.', pic: 0 },
          { say: "Find the triangle's area first, then multiply by how far the wedge goes. Same move." },
        ],
        pictures: [{ kind: 'eq', text: 'base area × height', lines: ['triangle base: 1/2 × 4 × 3 = 6', '6 × 10 = 60 cubic centimeters'] }] },
      { title: 'One thing not to do', text: "One last caution. Don't just multiply all three edges of a wedge together. Its triangle base is only half a rectangle, so find that base area first.",
        beats: [
          { say: 'One last caution.' },
          { say: "Don't just multiply all three edges of a wedge together.", pic: 0 },
          { say: 'Its triangle base is only half a rectangle, so find that base area first.' },
        ],
        pictures: [{ kind: 'cards', wrong: '4 × 3 × 10 = 120', right: '1/2 × 4 × 3 × 10 = 60' }] },
    ],
    turn: {
      text: 'A box is 6 cm long, 3 cm wide and 4 cm tall. What is its volume in cubic centimeters?',
      picture: box('6 cm', '3 cm', '4 cm'),
      answer: 72, steps: ['The base is 6 × 3 = 18 square centimeters.', 'There are 4 layers of 18: 18 × 4.', 'So the volume is 72 cubic centimeters.'],
      prompt: 'Find the area of the base. Then multiply by the height.',
      hint1: 'What is the area of the base?',
      hint2: 'Find 6 × 3, then multiply by the height, 4.',
      twin: { text: 'A box is 7 m long, 2 m wide and 5 m tall. What is its volume in cubic meters?',
        picture: box('7 m', '2 m', '5 m'),
        answer: 70, steps: ['The base is 7 × 2 = 14 square meters.', 'There are 5 layers of 14: 14 × 5.', 'So the volume is 70 cubic meters.'],
        hint1: 'Find the area of the bottom first.', hint2: 'The base is 7 × 2. Multiply that by 5.' },
    },
    won: { text: 'You found the base area, then multiplied by the height.', sticker: 'The volume of any prism is V = B × h: the base area times the height.' },
    twinWon: { text: 'You found the 7 by 2 base, then multiplied by the 5 m height.', sticker: 'The volume of any prism is V = B × h: the base area times the height.' },
    practice: [
      { why: 'Almost a copy of the lesson', problem: { text: 'A box is 4 cm long, 2 cm wide and 6 cm tall. What is its volume in cubic centimeters?',
        picture: box('4 cm', '2 cm', '6 cm'), answer: 48,
        steps: ['The base is 4 × 2 = 8.', 'Multiply by the height: 8 × 6.', 'So the volume is 48 cubic centimeters.'] } },
      { why: 'Same idea, new numbers', problem: { text: 'A box is 8 in long, 5 in wide and 3 in tall. What is its volume in cubic inches?',
        picture: box('8 in', '5 in', '3 in'), answer: 120,
        steps: ['The base is 8 × 5 = 40.', 'Multiply by the height: 40 × 3.', 'So the volume is 120 cubic inches.'] } },
      { why: 'Still "base area × height"', problem: { text: 'A wedge has a triangle base with a bottom of 6 cm and a height of 4 cm. The wedge is 9 cm long. What is its volume in cubic centimeters?',
        picture: wedge(6, 4, 9, 'cm'), answer: 108,
        steps: ['The triangle base is 1/2 × 6 × 4 = 12.', 'Multiply by how long the wedge is: 12 × 9.', 'So the volume is 108 cubic centimeters.'] } },
      { why: 'A little harder', problem: { text: 'A wedge has a triangle base with a bottom of 8 m and a height of 5 m. The wedge is 12 m long. What is its volume in cubic meters?',
        picture: wedge(8, 5, 12, 'm'), answer: 240,
        steps: ['The triangle base is 1/2 × 8 × 5 = 20.', 'Multiply by how long the wedge is: 20 × 12.', 'So the volume is 240 cubic meters.'] } },
      { why: 'Same math in a story', problem: { text: 'A tent has a triangle at each end. The triangle is 6 ft across the bottom and 4 ft tall. The tent is 7 ft long. How many cubic feet of space are inside?',
        picture: wedge(6, 4, 7, 'ft', 3), answer: 84,
        steps: ['The triangle end is 1/2 × 6 × 4 = 12 square feet.', 'Multiply by how long the tent is: 12 × 7.', 'So there are 84 cubic feet of space inside.'] } },
    ],
  },
]
