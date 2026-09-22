/** g4m3-t1's chalkboards: index = screen index (0 is Screen 1, which has none). Also the helpers t2–t4 draw with.
 *  Colours: the 10 piece blue, the 6 piece white, the answer yellow, the mistake coral. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, box, wash, span, cross, arrow } from '../../../chalk'
import { warn, tick, type At } from '../g3m1/t1'

export { warn, tick, type At }
export const q = (ms: ChalkMark[]): ChalkMark[] => ms.map(m => ({ ...m, quick: true }))
/** One line of writing in pieces, each at its own word, laid out as if written in one go, centred on `cx`. */
export const seq = (y: number, s: number, parts: [At, string, ChalkColor?][], cx = 300): ChalkMark[] => {
  const all = parts.map(p => p[1]).join(' '), cw = s * 0.5
  let i = 0
  return parts.map(([at, t, c]) => {
    const x = cx - (all.length * cw) / 2 + (i + t.length / 2) * cw
    i += t.length + 1
    return write(at, t, Math.round(x), y, s, c ?? 'w')
  })
}
/** A number digit by digit in fixed columns, ones at `ones`, `gap` apart; `rtl` writes the ones first. */
export const num = (at: At, n: string, ones: number, y: number, c: ChalkColor = 'w', s = 40, rtl = false, gap = 36): ChalkMark[] => {
  const ms = [...n].map((d, i) => write(at, d, ones - (n.length - 1 - i) * gap, y, s, c))
  return rtl ? ms.reverse() : ms
}

// The floor: 16 by 3, 30 px a foot, top-left (60, 100); the cut is after 10 feet, at x 360.
const X = 60, Y = 100, U = 30
const floor = (at: At, x = X, y = Y, u = U): ChalkMark => box(at, x, y, 16 * u, 3 * u)
const cut = (at: At, x = X, y = Y, u = U): ChalkMark => line(at, [[x + 10 * u, y - 10], [x + 10 * u, y + 3 * u + 10]], 'w', 5)
const pieces = (a: At, b: At, x = X, y = Y, u = U): ChalkMark[] => [wash(a, x, y, 10 * u, 3 * u, 'b'), wash(b, x + 10 * u, y, 6 * u, 3 * u, 'w')]

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // 16 is awkward
  [
    floor([0, 'floor']), write([0, '16'], '16', 300, 72, 28, 'd'), write([0, '3'], '3', 38, 145, 28, 'd'),
    write([0, 'need'], '16 × 3', 250, 240, 44),
    write([1, 'heart'], '= ?', 375, 240, 44, 'r'),
    write([2, '10'], '10 × 3', 190, 330, 36, 'b'), write([2, '6'], '6 × 3', 420, 330, 36),
  ],
  // The big idea: tens and ones, each times 3, then add
  [
    write([0, 'Break'], '16', 300, 45, 40),
    arrow([0, 'tens'], [285, 70], [200, 112], 'b'), box([0, 'tens'], 100, 120, 200, 60, 'b'), write([0, 'tens'], '10', 200, 150, 32, 'b'),
    write([0, 'tens'], 'tens', 200, 200, 22, 'd'),
    arrow([0, 'ones'], [315, 70], [390, 112]), box([0, 'ones'], 330, 120, 120, 60), write([0, 'ones'], '6', 390, 150, 32),
    write([0, 'ones'], 'ones', 390, 200, 22, 'd'),
    ...q([write([0, 'multiply'], '× 3', 200, 245, 30, 'b'), write([0, 'multiply'], '× 3', 390, 245, 30)]),
    box([0, 'add'], 170, 285, 60, 44, 'b'), write([0, 'add'], '+', 295, 307, 34), box([0, 'add'], 360, 285, 60, 44),
    write([0, 'parts'], '= 16 × 3', 300, 365, 30, 'y'),
  ],
  // Break 16 apart
  [
    floor([0, '16']), write([0, '16'], '16', 300, 72, 28, 'd'), write([0, '16'], '3', 38, 145, 28, 'd'),
    ...seq(270, 40, [[[0, '16'], '16 ='], [[0, '10'], '10', 'b'], [[0, '6'], '+ 6']]),
    cut([1, 'cut']), write([1, 'feet'], '10 feet', 210, 220, 24, 'b'),
    ...pieces([2, 'pieces'], [2, 'pieces']),
    write([2, '10'], '10 by 3', 210, 145, 28, 'b'), write([2, '6'], '6 by 3', 450, 145, 28),
  ],
  // Multiply each part
  [
    floor([0]), cut([0]), ...pieces([0], [0]),
    ...q([write([0], '10', 210, 72, 28, 'b'), write([0], '6', 450, 72, 28), write([0], '3', 38, 145, 28, 'd')]),
    ...seq(270, 32, [[[1, '10'], '10 × 3', 'b'], [[1, '30'], '= 30', 'b']], 210), write([1, '30'], '30', 210, 145, 36, 'b'),
    ...seq(270, 32, [[[2, '6'], '6 × 3'], [[2, '18'], '= 18']], 450), write([2, '18'], '18', 450, 145, 36),
  ],
  // Add the parts
  [
    floor([0], 140, 40, 20), cut([0], 140, 40, 20), ...pieces([0], [0], 140, 40, 20),
    ...q([write([0], '30', 240, 70, 28, 'b'), write([0], '18', 400, 70, 28)]),
    span([0, 'together'], 140, 460, 125, 'y'),
    ...seq(200, 40, [[[1, '30'], '30', 'b'], [[1, '18'], '+ 18'], [[1, '48'], '= 48', 'y']]),
    write([1, 'So'], '16 × 3 = 48', 300, 270, 40, 'y'),
    write([2, 'feet'], '48 square feet', 300, 345, 34, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'STOP'], '16 × 3 = 30', 150, 170, 34, 'r'), cross([1, '30'], 58, 145, 184, 50),
    box([2, 'part'], 340, 150, 224, 42), wash([2, 'part'], 340, 150, 140, 42, 'r'), write([2, 'part'], '30', 410, 171, 24, 'r'), write([2, 'part'], 'only part', 410, 215, 22, 'r'),
    wash([2, 'other'], 480, 150, 84, 42, 'w'), write([2, 'other'], '18', 522, 171, 24),
    write([2, '48'], '16 × 3 = 30 + 18 = 48', 300, 300, 34, 'y'), tick([2, '48'], 505, 300),
  ],
]
