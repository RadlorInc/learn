/** g7m4-t8's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The 5 by 3 by 4 box drawn in 3D (Screens 2–3), from above (4) and from the front (5); then a 4-3-5 wedge 10 long.
 *  Yellow is a layer / the answer, blue the height, coral the mix-up. */
import type { ChalkMark, ChalkColor } from '../../../chalk'
import { write, line, arrow, cross } from '../../../chalk'

type At = [number, string?]
type Pt = [number, number]
const path = (pts: Pt[]) => `M${pts.map(p => p.join(' ')).join(' L')} Z`
const shape = ([beat, at]: At, pts: Pt[], c: ChalkColor = 'w'): ChalkMark => ({ beat, at, c, d: path(pts) })
const fill = ([beat, at]: At, pts: Pt[], c: ChalkColor): ChalkMark => ({ beat, at, c, d: path(pts), wash: true })
/** Straight lines, one stroke. */
const lines = ([beat, at]: At, segs: [Pt, Pt][], c: ChalkColor = 'w', w?: number): ChalkMark =>
  ({ beat, at, c, w, d: segs.map(([a, b]) => `M${a.join(' ')} L${b.join(' ')}`).join(' ') })

// The box in 3D: front face 200 × 160 (5 by 4, 40 a centimeter), pushed back 3 cm up and to the right.
const DX = 84, DY = -60
const front: Pt[] = [[120, 150], [320, 150], [320, 310], [120, 310]]
const top: Pt[] = [[120, 150], [320, 150], [320 + DX, 150 + DY], [120 + DX, 150 + DY]]
const side: Pt[] = [[320, 150], [320 + DX, 150 + DY], [320 + DX, 310 + DY], [320, 310]]
const box3d = (at: At): ChalkMark[] => [
  shape(at, front), shape(at, top), shape(at, side),
  write(at, '5 cm', 220, 336, 22, 'd'), write(at, '4 cm', 78, 230, 22, 'd'), write(at, '3 cm', 396, 302, 22, 'd'),
]
const frontGrid = (at: At): ChalkMark =>
  lines(at, [...[160, 200, 240, 280].map(x => [[x, 150], [x, 310]] as [Pt, Pt]), ...[190, 230, 270].map(y => [[120, y], [320, y]] as [Pt, Pt])], 'd', 2)

// Screen 4: the base from above, 5 by 3, 60 a centimeter.
const G = { x: 90, y: 110, k: 60 }
const baseGrid = (at: At): ChalkMark[] => [
  shape(at, [[G.x, G.y], [G.x + 5 * G.k, G.y], [G.x + 5 * G.k, G.y + 3 * G.k], [G.x, G.y + 3 * G.k]]),
  lines(at, [...[1, 2, 3, 4].map(i => [[G.x + i * G.k, G.y], [G.x + i * G.k, G.y + 3 * G.k]] as [Pt, Pt]),
    ...[1, 2].map(i => [[G.x, G.y + i * G.k], [G.x + 5 * G.k, G.y + i * G.k]] as [Pt, Pt])], 'w', 2),
]

// Screen 5: the box from the front, 5 wide and 4 layers of 55.
const L = { x: 80, y: 105, w: 250, h: 55 }
const rowY = (i: number) => L.y + L.h * (3 - i) + L.h / 2   // i = 0 is the bottom layer

// Screens 6–7: the wedge, front triangle 4 along the bottom and 3 up (30 a centimeter), 10 long.
const WF: Pt[] = [[80, 310], [200, 310], [80, 220]], WD: Pt = [170, -110]
const WB = WF.map(([x, y]) => [x + WD[0], y + WD[1]] as Pt)
const col = (at: At, y: number, t: string, c: ChalkColor = 'w', s = 28): ChalkMark => write(at, t, 480, y, s, c)

export const T8: (ChalkMark[] | undefined)[] = [
  undefined,
  // Too many to count
  [
    ...box3d([0, 'box']), frontGrid([0, 'cubes']),
    write([1, 'hidden'], 'hidden inside', 470, 360, 24, 'd'), write([1, 'see'], '?', 530, 200, 44, 'r'),
    fill([2, 'layer'], [[120, 270], [320, 270], [320, 310], [120, 310]], 'y'),
    fill([2, 'layer'], [[320, 270], [320 + DX, 270 + DY], [320 + DX, 310 + DY], [320, 310]], 'y'),
    arrow([2, 'layers'], [450, 250], [450, 95], 'b'),
  ],
  // The big idea: base, then height
  [
    ...box3d([0, 'Find']),
    lines([0, 'base'], [[[120, 310], [120 + DX, 310 + DY]], [[120 + DX, 310 + DY], [320 + DX, 310 + DY]]], 'd', 2),
    fill([0, 'base'], [[120, 310], [320, 310], [320 + DX, 310 + DY], [120 + DX, 310 + DY]], 'y'),
    arrow([0, 'height'], [30, 310], [30, 150], 'b'),
  ],
  // The bottom layer
  [
    ...baseGrid([0, 'base']),
    write([0, '5'], '5 cm', G.x + 2.5 * G.k, 322, 24, 'd'), write([0, '3'], '3 cm', 50, G.y + 1.5 * G.k, 24, 'd'),
    write([1, '15'], '5 × 3 = 15', 495, 150, 32),
    fill([1, '15'], [[G.x, G.y], [G.x + 5 * G.k, G.y], [G.x + 5 * G.k, G.y + 3 * G.k], [G.x, G.y + 3 * G.k]], 'y'),
    write([2, 'cubes'], '15 cubes', 495, 220, 30, 'y'), write([2, 'layer'], 'one layer', 495, 270, 24, 'd'),
  ],
  // Stack the layers
  [
    shape([0, 'stack'], [[L.x, L.y], [L.x + L.w, L.y], [L.x + L.w, L.y + 4 * L.h], [L.x, L.y + 4 * L.h]]),
    write([0, 'tall'], '4 cm', 42, L.y + 2 * L.h, 22, 'd'),
    lines([0, 'layers'], [1, 2, 3].map(i => [[L.x, L.y + i * L.h], [L.x + L.w, L.y + i * L.h]] as [Pt, Pt])),
    fill([1, 'layer'], [[L.x, L.y + 3 * L.h], [L.x + L.w, L.y + 3 * L.h], [L.x + L.w, L.y + 4 * L.h], [L.x, L.y + 4 * L.h]], 'y'),
    write([1, 'count'], '15', 372, rowY(0), 28, 'y'), write([1, '30'], '30', 372, rowY(1), 28, 'y'),
    write([1, '45'], '45', 372, rowY(2), 28, 'y'), write([1, '60'], '60', 372, rowY(3), 28, 'y'),
    write([2, '60'], '15 × 4 = 60', 495, 215, 32, 'y'), write([2, 'cubes'], '60 cubes', 495, 270, 28, 'y'),
  ],
  // A triangle base works too
  [
    shape([0, 'base'], WF), line([0, 'base'], [WF[1], WB[1]]), line([0, 'base'], [WF[2], WB[2]]), line([0, 'base'], [WB[2], WB[1]]),
    fill([0, 'triangle'], WF, 'y'),
    write([1, '10'], '10 cm', 318, 272, 22, 'd'), write([1, '4'], '4 cm', 140, 336, 22, 'd'), write([1, '3'], '3 cm', 45, 265, 22, 'd'),
    col([2, '1/2'], 150, '1/2 × 4 × 3 = 6'), col([2, 'Then'], 220, '6 × 10 = 60', 'y', 32), col([2, 'cubic'], 290, '60 cubic cm', 'y'),
  ],
  // One thing not to do
  [
    line([0, 'mix'], [[300, 22], [340, 90], [260, 90], [300, 22]], 'r'), write([0, 'mix'], '!', 300, 68, 36, 'r'),
    write([1, '4'], '4 × 3 × 10 = 120', 300, 150, 34), cross([1, 'big'], 362, 130, 66, 40),
    shape([2, 'rectangle'], [[60, 220], [200, 220], [200, 320], [60, 320]], 'd'),
    fill([2, 'rectangle'], [[60, 220], [60, 320], [200, 320]], 'y'), line([2, 'rectangle'], [[60, 220], [200, 320]], 'y'),
    write([2, 'area'], '1/2 × 4 × 3 = 6', 410, 240, 28, 'y'), write([2, 'then'], '6 × 10 = 60', 410, 300, 34, 'y'),
  ],
]
