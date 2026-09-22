/**
 * Grade 7 · Module 4 — Geometry.
 * Written to docs/new-flow/AUTHORING.md. Not yet reviewed by the founder.
 * Topics 1, 2, 3, 5, 6, 7 draw with `poly`; topic 4 with `angle`; topic 8 with `solid` (a box) — its triangle-end
 * problems use a `poly` wedge, because `solid` only draws a box.
 */
import type { Lesson, Picture } from '../script'
import { attachChalk } from '../chalk'
import { G7M4_CHALK } from './chalk/g7m4'

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
    bigIdea: "Every 1 cm on the drawing stands for the same real length, so multiply to get the real length, and divide to go back.",
    screens: [
      { title: 'A park on a map', text: 'On a map, a park is 6 cm long and 4 cm wide. The map says 1 cm = 50 m. How long is the real park?',
        pictures: [plan(6, 4, '6 cm', '4 cm')] },
      { title: "The map is shrunk", text: "The park on the map is 6 cm long. So is the real park just 6 cm long? No. You could step right over that. The mapmaker shrank every length by the same amount, so the whole park fits on the page.",
        beats: [
          { say: "The park on the map is 6 cm long.", pic: 0 },
          { say: "So is the real park just 6 cm long? No. You could step right over that." },
          { say: "The mapmaker shrank every length by the same amount, so the whole park fits on the page." },
        ],
        pictures: [plan(6, 4, '6 cm', '4 cm')] },
      { title: "The big idea", text: "Every 1 cm on the drawing stands for the same real length, so multiply to get the real length, and divide to go back.",
        beats: [
          { say: "Every 1 cm on the drawing stands for the same real length, so multiply to get the real length, and divide to go back.", pic: 0 },
        ],
        pictures: [plan(6, 4, '6 cm', '4 cm')] },
      { title: "Read the rule", text: "Look at what the map says. 1 cm = 50 m. So every centimeter on this map is 50 meters of real ground. What is 2 cm, then? 100 m. And 3 cm is 150 m.",
        beats: [
          { say: "Look at what the map says. 1 cm = 50 m.", pic: 0 },
          { say: "So every centimeter on this map is 50 meters of real ground." },
          { say: "What is 2 cm, then? 100 m. And 3 cm is 150 m." },
        ],
        pictures: [{ kind: 'table', head: ['map (cm)', '1', '2', '3'], rows: [['real (m)', '50', '100', '150']], rowHead: true, motion: true }] },
      { title: "Count the centimeters", text: "Back to the park. It is 6 cm long on the map. That's 6 pieces, and each piece stands for 50 m. 6 × 50 = 300. So the real park is 300 m long.",
        beats: [
          { say: "Back to the park. It is 6 cm long on the map.", pic: 0 },
          { say: "That's 6 pieces, and each piece stands for 50 m." },
          { say: "6 × 50 = 300. So the real park is 300 m long.", pic: 1 },
        ],
        pictures: [plan(6, 4, '6 cm', '4 cm', true), { kind: 'eq', text: '6 × 50 = 300', lines: ['300 meters'] }] },
      { title: "Go back the other way", text: "Now go the other way, from real life to the map. A real path is 200 m long. How many 50s fit into 200? 200 ÷ 50 = 4. So the path is 4 cm on the map.",
        beats: [
          { say: "Now go the other way, from real life to the map.", pic: 0 },
          { say: "A real path is 200 m long. How many 50s fit into 200?" },
          { say: "200 ÷ 50 = 4. So the path is 4 cm on the map.", pic: 1 },
        ],
        pictures: [plan(6, 4, '6 cm', '? cm'), { kind: 'eq', text: '200 ÷ 50 = 4', lines: ['4 cm on the map'] }] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't ADD the 50 to the 6. That gives 56 m, a tiny park. Each of the 6 centimeters is 50 m, so multiply. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't ADD the 50 to the 6.", pic: 0 },
          { say: "That gives 56 m, a tiny park. Each of the 6 centimeters is 50 m, so multiply." },
          { say: "Okay. Your turn." },
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
      { title: "Across is not around", text: "The line straight across, through the center, is the diameter. Here it's 10 cm. Half of it, from the center out to the edge, is the radius. But we want the distance around the outside. Can a ruler bend around a curve? Not really.",
        beats: [
          { say: "The line straight across, through the center, is the diameter. Here it's 10 cm.", pic: 0 },
          { say: "Half of it, from the center out to the edge, is the radius." },
          { say: "But we want the distance around the outside. Can a ruler bend around a curve? Not really." },
        ],
        pictures: [circle(5, '10 cm', 'd')] },
      { title: "The big idea", text: "The distance around a circle is always about 3.14 times the distance across it.",
        beats: [
          { say: "The distance around a circle is always about 3.14 times the distance across it.", pic: 0 },
        ],
        pictures: [circle(5, '10 cm', 'd')] },
      { title: "Roll it out", text: "Watch this. Mark a spot on the wheel, and roll it one whole turn. The track it leaves on the ground is exactly the distance around.",
        beats: [
          { say: "Watch this. Mark a spot on the wheel, and roll it one whole turn.", pic: 0 },
          { say: "The track it leaves on the ground is exactly the distance around." },
        ],
        pictures: [{ kind: 'poly', motion: true, shapes: [], circles: [{ c: [5, 5], r: 5, show: 'd', label: '10 cm' }],
          segs: [{ a: [0, -0.5], b: [31.4, -0.5], arrow: 'end', label: 'one full turn' }] }] },
      { title: "A little more than 3", text: "Now, how many times does the 10 cm width fit along that track? 3 whole times, and then a small piece is left over. That's true for every circle, big or small. About 3.14 times.",
        beats: [
          { say: "Now, how many times does the 10 cm width fit along that track?", pic: 0 },
          { say: "3 whole times, and then a small piece is left over." },
          { say: "That's true for every circle, big or small. About 3.14 times." },
        ],
        pictures: [{ kind: 'poly', motion: true, shapes: [], segs: [
          { a: [0, 0], b: [10, 0], dots: true, label: '10 cm' },
          { a: [10, 0], b: [20, 0], dots: true, label: '10 cm' },
          { a: [20, 0], b: [30, 0], dots: true, label: '10 cm' },
          { a: [30, 0], b: [31.4, 0], tone: 2 },
        ] }] },
      { title: "Multiply", text: "So what do we multiply? The distance across, 10 cm. 10 × 3.14 = 31.4. So the wheel rolls 31.4 cm in one full turn.",
        beats: [
          { say: "So what do we multiply? The distance across, 10 cm.", pic: 0 },
          { say: "10 × 3.14 = 31.4.", pic: 1 },
          { say: "So the wheel rolls 31.4 cm in one full turn." },
        ],
        pictures: [circle(5, '10 cm', 'd'), { kind: 'eq', text: '10 × 3.14 = 31.4', lines: ['31.4 cm around'] }] },
      { title: "One thing not to do", text: "Here's the part people mix up. If you're told the radius, don't put it straight into the rule. DOUBLE it first. A radius of 5 cm is only half the way across. Double it to 10 cm, then 10 × 3.14 = 31.4. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "If you're told the radius, don't put it straight into the rule. DOUBLE it first.", pic: 0 },
          { say: "A radius of 5 cm is only half the way across. Double it to 10 cm, then 10 × 3.14 = 31.4.", pic: 1 },
          { say: "Okay. Your turn." },
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
    bigIdea: "The area of a circle is 3.14 × radius × radius, and it uses the radius, not the distance across.",
    screens: [
      { title: 'A round pond', text: 'A round pond reaches 10 m from its center to its edge. How much ground does it cover?',
        pictures: [circle(10, '10 m', 'r')] },
      { title: "Squares do not fit", text: "For a rectangle, we count the square tiles, or just multiply its sides. But how do square tiles cover a round pond? They leave little curved gaps all around the edge, so counting them never comes out exact.",
        beats: [
          { say: "For a rectangle, we count the square tiles, or just multiply its sides." },
          { say: "But how do square tiles cover a round pond?", pic: 0 },
          { say: "They leave little curved gaps all around the edge, so counting them never comes out exact." },
        ],
        pictures: [circle(10, '10 m', 'r')] },
      { title: "The big idea", text: "The area of a circle is 3.14 × radius × radius, and it uses the radius, not the distance across.",
        beats: [
          { say: "The area of a circle is 3.14 × radius × radius, and it uses the radius, not the distance across.", pic: 0 },
        ],
        pictures: [circle(10, '10 m', 'r')] },
      { title: "Cut it into slices", text: "So here's a clever trick. Cut the pond into thin slices, like a pizza. Then lay the slices in a row, one point up, the next point down. What shape does that start to look like?",
        beats: [
          { say: "So here's a clever trick. Cut the pond into thin slices, like a pizza.", pic: 0 },
          { say: "Then lay the slices in a row, one point up, the next point down." },
          { say: "What shape does that start to look like?" },
        ],
        pictures: [slices(false, true)] },
      { title: "Almost a rectangle", text: "It's almost a rectangle. The long side is half the way around the pond. That's 3.14 × 10 = 31.4 m. And the short side is the height of one slice. That's the radius, 10 m.",
        beats: [
          { say: "It's almost a rectangle.", pic: 0 },
          { say: "The long side is half the way around the pond. That's 3.14 × 10 = 31.4 m." },
          { say: "And the short side is the height of one slice. That's the radius, 10 m." },
        ],
        pictures: [slices(true)] },
      { title: "Multiply", text: "Now multiply the two sides, like any rectangle. 31.4 × 10 = 314. That's the same as 3.14 × 10 × 10. So the pond covers 314 square meters.",
        beats: [
          { say: "Now multiply the two sides, like any rectangle. 31.4 × 10 = 314.", pic: 0 },
          { say: "That's the same as 3.14 × 10 × 10.", pic: 1 },
          { say: "So the pond covers 314 square meters." },
        ],
        pictures: [slices(true), { kind: 'eq', text: '3.14 × 10 × 10 = 314', lines: ['314 square meters'] }] },
      { title: "One thing not to do", text: "Here's the part people mix up. The pond is 20 m ACROSS, but don't put the 20 into the rule. That gives 1,256, four times too big. The rule wants the radius, 10 m. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "The pond is 20 m ACROSS, but don't put the 20 into the rule.", pic: 0 },
          { say: "That gives 1,256, four times too big. The rule wants the radius, 10 m." },
          { say: "Okay. Your turn." },
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
    bigIdea: "Two angles that fill a square corner add up to 90°, and two that make a straight line add up to 180°.",
    screens: [
      { title: 'A shelf bracket', text: 'A brace splits the square corner of a shelf bracket into two angles. One is 35°. What is the other?',
        pictures: [corner([55, 35], ['?', '35°'])] },
      { title: "What is the whole?", text: "The brace splits the corner into two angles, 35° and one we don't know. So what is the whole corner worth? We need that before we can find the missing part. And a square corner and a straight line are two very different wholes.",
        beats: [
          { say: "The brace splits the corner into two angles, 35° and one we don't know.", pic: 0 },
          { say: "So what is the whole corner worth? We need that before we can find the missing part." },
          { say: "And a square corner and a straight line are two very different wholes.", pic: 1 },
        ],
        pictures: [corner([55, 35], ['?', '35°']), corner([145, 35], ['?', '35°'])] },
      { title: "The big idea", text: "Two angles that fill a square corner add up to 90°, and two that make a straight line add up to 180°.",
        beats: [
          { say: "Two angles that fill a square corner add up to 90°, and two that make a straight line add up to 180°.", pic: 0 },
        ],
        pictures: [{ kind: 'angle', deg: 90, label: '90°' }, { kind: 'angle', deg: 180, label: '180°' }] },
      { title: "The parts fill the corner", text: "Back to the bracket. The brace splits the square corner, with no gap and no overlap. So the two angles together make 90°.",
        beats: [
          { say: "Back to the bracket. The brace splits the square corner, with no gap and no overlap.", pic: 0 },
          { say: "So the two angles together make 90°." },
        ],
        pictures: [corner([55, 35], [null, '35°'], true)] },
      { title: "Take away the part you know", text: "So what do we do with the 35? We take it away from the whole. 90 − 35 = 55. The other angle is 55°.",
        beats: [
          { say: "So what do we do with the 35? We take it away from the whole.", pic: 0 },
          { say: "90 − 35 = 55. The other angle is 55°.", pic: 1 },
        ],
        pictures: [corner([55, 35], ['?', '35°']), { kind: 'eq', text: '90° − 35° = 55°' }] },
      { title: "A straight line starts at 180", text: "Now picture the same 35° on a straight line instead. Same move, different whole. This time we start from 180. 180 − 35 = 145. That angle would be 145°.",
        beats: [
          { say: "Now picture the same 35° on a straight line instead.", pic: 0 },
          { say: "Same move, different whole. This time we start from 180." },
          { say: "180 − 35 = 145. That angle would be 145°.", pic: 1 },
        ],
        pictures: [corner([145, 35], ['?', '35°']), { kind: 'eq', text: '180° − 35° = 145°' }] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't start from 180 for a SQUARE corner. That gives 145°, bigger than the whole corner. Look at the whole first, then take away. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't start from 180 for a SQUARE corner.", pic: 0 },
          { say: "That gives 145°, bigger than the whole corner. Look at the whole first, then take away." },
          { say: "Okay. Your turn." },
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
      { title: "Four angles at one crossing", text: "Where two roads cross, you get four angles. Do we need a protractor to find the one across from 50°? No. Both roads are straight, and a straight line is 180°. That's all we need.",
        beats: [
          { say: "Where two roads cross, you get four angles.", pic: 0 },
          { say: "Do we need a protractor to find the one across from 50°?" },
          { say: "No. Both roads are straight, and a straight line is 180°. That's all we need." },
        ],
        pictures: [cross(50, { r: '50°' })] },
      { title: "The big idea", text: "When two straight lines cross, the angles straight across from each other are equal.",
        beats: [
          { say: "When two straight lines cross, the angles straight across from each other are equal.", pic: 0 },
        ],
        pictures: [cross(50, { r: '50°', l: '50°' })] },
      { title: "Next door makes a straight line", text: "Look at the 50° angle and the top angle. They sit side by side on one straight road, so together they make 180°. 180 − 50 is 130, so the top angle is 130°.",
        beats: [
          { say: "Look at the 50° angle and the top angle.", pic: 0 },
          { say: "They sit side by side on one straight road, so together they make 180°." },
          { say: "180 − 50 is 130, so the top angle is 130°." },
        ],
        pictures: [cross(50, { r: '50°', t: '130°' }, true)] },
      { title: "Across comes out the same", text: "Now the left angle. It sits next to the top angle, on the other road. Together they make 180° too. 180 − 130 is 50, so the left angle is 50°. Wait. That's the same as the angle across from it.",
        beats: [
          { say: "Now the left angle. It sits next to the top angle, on the other road.", pic: 0 },
          { say: "Together they make 180° too." },
          { say: "180 − 130 is 50, so the left angle is 50°.", pic: 1 },
          { say: "Wait. That's the same as the angle across from it." },
        ],
        pictures: [cross(50, { r: '50°', t: '130°', l: '50°' }), { kind: 'eq', text: '180° − 130° = 50°' }] },
      { title: "Copy it across", text: "So is there a faster way next time? Yes. Copy each angle straight across. Left and right are both 50°. Top and bottom are both 130°.",
        beats: [
          { say: "So is there a faster way next time? Yes. Copy each angle straight across.", pic: 0 },
          { say: "Left and right are both 50°." },
          { say: "Top and bottom are both 130°." },
        ],
        pictures: [cross(50, { r: '50°', l: '50°', t: '130°', b: '130°' })] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't take the angle away from 180. That gives you the angle NEXT door, not the one across. The angle straight across just copies it, so it's 50°. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't take the angle away from 180. That gives you the angle NEXT door, not the one across.", pic: 0 },
          { say: "The angle straight across just copies it, so it's 50°." },
          { say: "Okay. Your turn." },
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
      { title: "Some sets do not close", text: "Can any three sticks make a triangle? Lay the 9 cm stick down, and stand the other two up at its ends. Look. The 3 cm and the 4 cm sticks can't reach each other.",
        beats: [
          { say: "Can any three sticks make a triangle?", pic: 0 },
          { say: "Lay the 9 cm stick down, and stand the other two up at its ends." },
          { say: "Look. The 3 cm and the 4 cm sticks can't reach each other." },
        ],
        pictures: [{ kind: 'poly', shapes: [], segs: [
          { a: [0, 0], b: [9, 0], dots: true, label: '9 cm' },
          { a: [0, 0], b: [1.5, 2.6], dots: true, label: '3 cm' },
          { a: [9, 0], b: [7, 3.46], dots: true, label: '4 cm' },
        ] }] },
      { title: "The big idea", text: "Three sides make a triangle only if the two shorter sides add up to more than the longest side.",
        beats: [
          { say: "Three sides make a triangle only if the two shorter sides add up to more than the longest side.", pic: 0 },
        ],
        pictures: [{ kind: 'poly', shapes: [{ pts: [[0, 0], [5, 0], [1.8, 2.4]], sides: ['5 cm', '4 cm', '3 cm'], tone: 1 }] }] },
      { title: "Lay them flat", text: "Why not? Lay both short sticks flat on the 9 cm one. 3 + 4 = 7, so together they only reach 7 cm. 7 is less than 9. There's a gap of 2 cm, so they can never meet.",
        beats: [
          { say: "Why not? Lay both short sticks flat on the 9 cm one.", pic: 0 },
          { say: "3 + 4 = 7, so together they only reach 7 cm.", pic: 1 },
          { say: "7 is less than 9. There's a gap of 2 cm, so they can never meet." },
        ],
        pictures: [{ kind: 'poly', motion: true, shapes: [], segs: [
          { a: [0, 0], b: [9, 0], dots: true, label: '9 cm' },
          { a: [0, 1.2], b: [3, 1.2], dots: true, tone: 2, label: '3 cm' },
          { a: [5, 1.2], b: [9, 1.2], dots: true, tone: 2, label: '4 cm' },
        ] }, { kind: 'eq', text: '3 + 4 = 7', lines: ['7 is less than 9, so no'] }] },
      { title: "When it works", text: "Now swap the 9 cm stick for a 5 cm one. 3 + 4 is still 7, and 7 is more than 5. So they reach past each other, and lift up into a point.",
        beats: [
          { say: "Now swap the 9 cm stick for a 5 cm one.", pic: 0 },
          { say: "3 + 4 is still 7, and 7 is more than 5.", pic: 1 },
          { say: "So they reach past each other, and lift up into a point.", pic: 0 },
        ],
        pictures: [{ kind: 'poly', motion: true, shapes: [{ pts: [[0, 0], [5, 0], [1.8, 2.4]], sides: ['5 cm', '4 cm', '3 cm'], tone: 1 }] },
          { kind: 'eq', text: '3 + 4 = 7', lines: ['7 is more than 5, so yes'] }] },
      { title: "Just enough is not enough", text: "What if they add up to exactly the longest? Try 3 cm, 4 cm and 7 cm. 3 + 4 = 7. The sticks meet, but only lying flat on the 7 cm one. Flat is not a triangle, so the answer is no.",
        beats: [
          { say: "What if they add up to exactly the longest? Try 3 cm, 4 cm and 7 cm.", pic: 0 },
          { say: "3 + 4 = 7. The sticks meet, but only lying flat on the 7 cm one.", pic: 1 },
          { say: "Flat is not a triangle, so the answer is no." },
        ],
        pictures: [{ kind: 'poly', shapes: [], segs: [
          { a: [0, 0], b: [7, 0], dots: true, label: '7 cm' },
          { a: [0, 1.2], b: [3, 1.2], dots: true, tone: 2, label: '3 cm' },
          { a: [3, 1.2], b: [7, 1.2], dots: true, tone: 2, label: '4 cm' },
        ] }, { kind: 'eq', text: '3 + 4 = 7', lines: ['7 is not more than 7, so no'] }] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't add the LONGEST side to a short one. 9 + 3 is more than 4, but that tells you nothing. Add the two shorter sides, and check them against the longest. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't add the LONGEST side to a short one. 9 + 3 is more than 4, but that tells you nothing.", pic: 0 },
          { say: "Add the two shorter sides, and check them against the longest." },
          { say: "Okay. Your turn." },
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
    bigIdea: "Unfold the shape flat, find the area of every face, both ends and every side, and add them all up.",
    screens: [
      { title: 'A doorstop wedge', text: 'A wooden doorstop has a triangle at each end, with sides 3 cm, 4 cm and 5 cm. It is 10 cm long. How much paint covers every face?',
        pictures: [wedge(4, 3, 10, 'cm', 0, '5 cm')] },
      { title: "Not the space inside", text: "Paint only covers the outside of the wedge. So is it the space inside that we need? No, just the flat faces the brush touches. How many faces are there?",
        beats: [
          { say: "Paint only covers the outside of the wedge.", pic: 0 },
          { say: "So is it the space inside that we need? No, just the flat faces the brush touches." },
          { say: "How many faces are there?" },
        ],
        pictures: [wedge(4, 3, 10, 'cm', 0, '5 cm')] },
      { title: "The big idea", text: "Unfold the shape flat, find the area of every face, both ends and every side, and add them all up.",
        beats: [
          { say: "Unfold the shape flat, find the area of every face, both ends and every side, and add them all up.", pic: 0 },
        ],
        pictures: [triNet(3, 4, 5, 10, 'cm')] },
      { title: "Unfold it", text: "Let's do it. Cut along a few edges, and lay the wedge out flat. What do we get? 2 triangle ends, and 3 rectangle sides.",
        beats: [
          { say: "Let's do it. Cut along a few edges, and lay the wedge out flat.", pic: 0 },
          { say: "What do we get? 2 triangle ends, and 3 rectangle sides." },
        ],
        pictures: [triNet(3, 4, 5, 10, 'cm', 'names', true)] },
      { title: "Area of each face", text: "Now the area of each face, one at a time. Each triangle end is 1/2 × 4 × 3, which is 6. Then the sides. 3 × 10 = 30, 4 × 10 = 40, and 5 × 10 = 50.",
        beats: [
          { say: "Now the area of each face, one at a time.", pic: 0 },
          { say: "Each triangle end is 1/2 × 4 × 3, which is 6." },
          { say: "Then the sides. 3 × 10 = 30, 4 × 10 = 40, and 5 × 10 = 50." },
        ],
        pictures: [triNet(3, 4, 5, 10, 'cm', 'areas')] },
      { title: "Add every face", text: "Count them again. 2 ends and 3 sides, so 5 faces to add. 6 + 6 + 30 + 40 + 50 = 132. So the paint covers 132 square centimeters.",
        beats: [
          { say: "Count them again. 2 ends and 3 sides, so 5 faces to add.", pic: 0 },
          { say: "6 + 6 + 30 + 40 + 50 = 132.", pic: 1 },
          { say: "So the paint covers 132 square centimeters." },
        ],
        pictures: [triNet(3, 4, 5, 10, 'cm', 'areas'), { kind: 'eq', text: '6 + 6 + 30 + 40 + 50 = 132', lines: ['132 square centimeters'] }] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't count just ONE end. The wedge has a triangle at both ends. So the 6 goes in twice, and the total is 132, not 126. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't count just ONE end. The wedge has a triangle at both ends.", pic: 0 },
          { say: "So the 6 goes in twice, and the total is 132, not 126." },
          { say: "Okay. Your turn." },
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
    bigIdea: "Find the area of the base, then multiply it by the height.",
    screens: [
      { title: 'Filling a box', text: 'A box is 5 cm long, 3 cm wide and 4 cm tall. How many 1 cm cubes fill it?',
        pictures: [box('5 cm', '3 cm', '4 cm')] },
      { title: "Too many to count", text: "You could fill the box with cubes and count them one by one. But most of them end up hidden inside. How do you count what you can't see? Count one layer, then count the layers.",
        beats: [
          { say: "You could fill the box with cubes and count them one by one.", pic: 0 },
          { say: "But most of them end up hidden inside. How do you count what you can't see?" },
          { say: "Count one layer, then count the layers." },
        ],
        pictures: [box('5 cm', '3 cm', '4 cm')] },
      { title: "The big idea", text: "Find the area of the base, then multiply it by the height.",
        beats: [
          { say: "Find the area of the base, then multiply it by the height.", pic: 0 },
        ],
        pictures: [box('5 cm', '3 cm', '4 cm')] },
      { title: "The bottom layer", text: "Start at the bottom. The base is 5 cm by 3 cm. How many cubes cover it? 5 × 3 = 15. So 15 cubes make one layer.",
        beats: [
          { say: "Start at the bottom. The base is 5 cm by 3 cm.", pic: 0 },
          { say: "How many cubes cover it? 5 × 3 = 15.", pic: 1 },
          { say: "So 15 cubes make one layer." },
        ],
        pictures: [box('5 cm', '3 cm', '4 cm'), { kind: 'eq', text: '5 × 3 = 15', lines: ['15 cubes in one layer'] }] },
      { title: "Stack the layers", text: "Now stack them. The box is 4 cm tall, so there are 4 layers. Each layer has 15, so count by 15. 15, 30, 45, 60. 15 × 4 = 60, so 60 cubes fill the box.",
        beats: [
          { say: "Now stack them. The box is 4 cm tall, so there are 4 layers.", pic: 0 },
          { say: "Each layer has 15, so count by 15. 15, 30, 45, 60.", pic: 1 },
          { say: "15 × 4 = 60, so 60 cubes fill the box." },
        ],
        pictures: [box('5 cm', '3 cm', '4 cm'),
          { kind: 'table', head: ['layers', '1', '2', '3', '4'], rows: [['cubes', '15', '30', '45', '60']], rowHead: true, motion: true }] },
      { title: "A triangle base works too", text: "Does this work when the base is a triangle? Yes. Take a wedge 10 cm long. Its triangle is 4 cm along the bottom and 3 cm tall. The triangle is 1/2 × 4 × 3, which is 6. Then 6 × 10 = 60 cubic centimeters.",
        beats: [
          { say: "Does this work when the base is a triangle? Yes.", pic: 0 },
          { say: "Take a wedge 10 cm long. Its triangle is 4 cm along the bottom and 3 cm tall." },
          { say: "The triangle is 1/2 × 4 × 3, which is 6. Then 6 × 10 = 60 cubic centimeters." },
        ],
        pictures: [{ kind: 'eq', text: 'base area × height', lines: ['triangle base: 1/2 × 4 × 3 = 6', '6 × 10 = 60 cubic centimeters'] }] },
      { title: "One thing not to do", text: "Here's the part people mix up. Don't multiply ALL three edges of a wedge. 4 × 3 × 10 gives 120, which is too big. The triangle is only half a rectangle. Find its area first, 6, then 6 × 10 = 60. Okay. Your turn.",
        beats: [
          { say: "Here's the part people mix up." },
          { say: "Don't multiply ALL three edges of a wedge. 4 × 3 × 10 gives 120, which is too big.", pic: 0 },
          { say: "The triangle is only half a rectangle. Find its area first, 6, then 6 × 10 = 60." },
          { say: "Okay. Your turn." },
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

attachChalk(G7M4, G7M4_CHALK)
