/**
 * g5m3-t3's chalkboards: index = screen index (0 is Screen 1, which has none).
 * Colours: white = the pan and its cuts, blue wash = your half, yellow = the piece you eat and the result,
 * coral = the mistake, dim = labels and counts. The pan is 2 equal rows by 3 equal columns, every piece the same size.
 */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, wash, cross } from '../../../chalk'
import { fr, expr, warn, type At } from '../g4m4/t1'

type Pan = { x: number; y: number; w: number; h: number }
const outline = (at: At, p: Pan): ChalkMark => box(at, p.x, p.y, p.w, p.h)
const middle = (at: At, p: Pan): ChalkMark => line(at, [[p.x, p.y + p.h / 2], [p.x + p.w, p.y + p.h / 2]])
const half = (at: At, p: Pan): ChalkMark => ({ ...wash(at, p.x, p.y, p.w, p.h / 2, 'b'), quick: true })
/** The two cuts into 3, through the top row (or the bottom row). */
const cols = (at: At, p: Pan, row: 0 | 1, c: 'w' | 'd' = 'w'): ChalkMark[] =>
  [1, 2].map(k => ({ ...line(at, [[p.x + (p.w * k) / 3, p.y + (row * p.h) / 2], [p.x + (p.w * k) / 3, p.y + ((row + 1) * p.h) / 2]], c), quick: k < 2 }))
const eaten = (at: At, p: Pan): ChalkMark[] => [{ ...wash(at, p.x, p.y, p.w / 3, p.h / 2, 'y'), quick: true }, { ...box(at, p.x, p.y, p.w / 3, p.h / 2, 'y'), w: 4.5 }]
const counts = (at: At, p: Pan, s = 24): ChalkMark[] =>
  Array.from({ length: 6 }, (_, i) => ({ ...write(at, String(i + 1), p.x + (p.w / 3) * ((i % 3) + 0.5), p.y + (p.h / 2) * (Math.floor(i / 3) + 0.5), s, 'd'), quick: i < 5 }))

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // A third of what?
  (() => {
    const p = { x: 150, y: 50, w: 300, h: 200 }
    return [
      outline([0, 'eat'], p), middle([0, 'eat'], p),
      ...fr([0, '1/3'], '1/3', 530, 100, 36), write([0, 'what'], 'of what?', 530, 175, 24),
      write([1, 'whole'], 'not the whole pan', 300, 295, 26, 'd'),
      half([1, 'half'], p), ...fr([1, 'half'], '1/2', 90, 100, 30, 'b'),
      write([2, 'whole'], '? of the whole pan', 300, 355, 30, 'y'),
    ]
  })(),
  // The big idea: cut the half into 3, count how many fill the pan
  (() => {
    const p = { x: 150, y: 60, w: 300, h: 200 }
    return [
      outline([0, 'half'], p), middle([0, 'half'], p), half([0, 'half'], p), ...fr([0, 'half'], '1/2', 90, 110, 30, 'b'),
      ...cols([0, '3'], p, 0), ...eaten([0, 'pieces'], p),
      ...cols([0, 'count'], p, 1, 'd'),
      ...counts([0, 'fill'], p),
      write([0, 'pan'], 'how many fill the pan?', 300, 320, 28, 'y'),
    ]
  })(),
  // Shade the half
  (() => {
    const p = { x: 150, y: 60, w: 330, h: 220 }
    return [
      outline([0, 'pan'], p), write([0, 'pan'], 'the whole pan', 315, 320, 26, 'd'),
      middle([1, 'rows'], p),
      half([1, 'half'], p), ...fr([1, 'half'], '1/2', 90, 115, 32, 'b'), write([1, 'half'], 'your half', 315, 115, 26, 'b'),
    ]
  })(),
  // Take 1/3 of the half
  (() => {
    const p = { x: 150, y: 50, w: 330, h: 220 }
    return [
      outline([0, 'Now'], p), middle([0, 'Now'], p), half([0, 'Now'], p), ...fr([0, 'Now'], '1/2', 90, 105, 32, 'b'),
      ...cols([0, '3'], p, 0),
      ...cols([1, 'down'], p, 1),
      ...eaten([2, 'eat'], p),
      ...expr([2, 'half'], '1/3 of your half', 315, 330, 32, 'y'),
    ]
  })(),
  // Count on the whole pan
  (() => {
    const p = { x: 50, y: 40, w: 240, h: 160 }
    return [
      outline([0, 'Now'], p), middle([0, 'Now'], p), half([0, 'Now'], p), ...cols([0, 'Now'], p, 0), ...cols([0, 'Now'], p, 1),
      ...eaten([0, 'Now'], p),
      write([0, 'fill'], 'how many?', 440, 70, 28, 'd'),
      ...counts([1, '6'], p, 26),
      write([1, '6'], '2 × 3 = 6 pieces', 440, 125, 28),
      write([1, 'ate'], 'you ate 1', 440, 175, 28, 'y'),
      ...expr([2, '1/6'], '1/3 of 1/2 = 1/6', 300, 265, 36, 'y'),
      ...expr([2, '1/6'], '1/3 × 1/2 = 1/6', 300, 345, 36, 'y'),
    ]
  })(),
  // One thing not to do
  (() => {
    const p = { x: 370, y: 150, w: 150, h: 100 }
    return [
      ...warn([0, 'mix']),
      ...expr([1, 'BIGGER'], '1/3 × 1/2 > 1/2', 160, 195, 32, 'r'),
      cross([1, 'BIGGER'], 50, 155, 220, 80),
      outline([2, 'piece'], p), middle([2, 'piece'], p), half([2, 'piece'], p), ...cols([2, 'piece'], p, 0), ...cols([2, 'piece'], p, 1),
      ...eaten([2, 'smaller'], p),
      ...expr([2, '1/2'], '1/6 < 1/2', 445, 320, 36, 'y'),
    ]
  })(),
]
