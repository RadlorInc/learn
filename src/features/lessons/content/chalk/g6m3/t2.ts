/** g6m3-t2's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, ring, cross, hop, arrow } from '../../../chalk'
import { q, warn, dot, type At } from '../g5m4/t1'

/** A decimal with its point at x = px: digits `s * 0.6` apart, the point a dot between two of them. */
const dec = (at: At, t: string, px: number, y: number, s = 40, c: ChalkColor = 'w'): ChalkMark[] => {
  const step = s * 0.6, gap = s * 0.58, p = t.includes('.') ? t.indexOf('.') : t.length
  return q([...t].map((ch, i) => ch === '.' ? dot(at, px, y + s * 0.22, c)
    : write(at, ch, i < p ? px - gap - step * (p - 1 - i) : px + gap + step * (i - p - 1), y, s, c)))
}
/** "2.4 × 1.3" on one row, the two points at x = a and x = b (to ring them). */
const times = (at: At, a: number, b: number, y: number, s = 40, c: ChalkColor = 'w'): ChalkMark[] =>
  [...dec(at, '2.4', a, y, s, c), write(at, '×', (a + b) / 2, y, s, c), ...dec(at, '1.3', b, y, s, c)]
/** A whole number right-aligned at x = right, digits 30 apart. */
const num = (at: At, t: string, right: number, y: number, c: ChalkColor = 'w', s = 40): ChalkMark[] =>
  q([...t].map((ch, i) => write(at, ch, right - 30 * (t.length - 1 - i), y, s, c)))

// Colours: yellow = the answer and where its point goes, blue = the places after the point, coral = the slip,
// dim = labels and the working.
export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // Where does the point go?
  [
    ...dec([0, 'add'], '2.4', 170, 90), ...dec([0, 'add'], '1.3', 170, 145), write([0, 'add'], '+', 90, 145, 40),
    line([0, 'add'], [[80, 172], [230, 172]]), { ...line([0, 'points'], [[170, 60], [170, 180]], 'y'), w: 2 },
    ...dec([1, 'multiply'], '2.4', 430, 90), ...dec([1, 'multiply'], '1.3', 430, 145), write([1, 'multiply'], '×', 350, 145, 40),
    line([1, 'multiply'], [[340, 172], [490, 172]]), { ...line([1, 'lining'], [[430, 60], [430, 180]], 'd'), w: 2 },
    write([1, 'help'], "doesn't help", 430, 215, 26, 'r'),
    write([2, 'point'], '2.4 × 1.3 =', 270, 310, 38), write([2, 'answer'], '?', 400, 310, 48, 'y'),
  ],
  // The big idea
  [
    ...times([0, 'Multiply'], 240, 360, 55), ring([0, 'no'], 240, 64, 13, 15, 'b'), ring([0, 'no'], 360, 64, 13, 15, 'b'),
    arrow([0, 'points'], [300, 85], [300, 120], 'd'), write([0, 'points'], '24 × 13', 300, 150, 40),
    write([0, 'places'], 'places after the point:', 300, 225, 26, 'd'),
    write([0, 'both'], '1  +  1', 300, 275, 36, 'b'), write([0, 'together'], '= 2 places in the answer', 300, 335, 32, 'y'),
  ],
  // Forget the points
  [
    ...times([0, 'Cover'], 250, 350, 40, 30, 'd'), ring([0, 'points'], 250, 47, 11, 13, 'b'), ring([0, 'points'], 350, 47, 11, 13, 'b'),
    ...num([0, '24'], '24', 330, 105), ...num([0, '13.'], '13', 330, 155), write([0, '13.'], '×', 250, 155, 40), line([0, '13.'], [[235, 182], [350, 182]]),
    ...num([1, '72,'], '72', 330, 220), write([1, '72,'], '24 × 3', 470, 220, 26, 'd'),
    ...num([1, '240.'], '240', 330, 268), write([1, '240.'], '24 × 10', 470, 268, 26, 'd'),
    write([2, 'rows'], '+', 250, 268, 40), line([2, 'rows'], [[235, 295], [350, 295]]),
    ...num([2, '312.'], '312', 330, 335),
  ],
  // Count the places
  [
    ...dec([0, '2.4'], '2.4', 170, 90, 56), ring([0, 'place'], 170 + 56 * 0.58, 90, 22, 28, 'b'), write([0, 'place'], '1 place', 185, 160, 28, 'b'),
    ...dec([1, '1.3'], '1.3', 430, 90, 56), ring([1, 'place'], 430 + 56 * 0.58, 90, 22, 28, 'b'), write([1, 'place'], '1 place', 445, 160, 28, 'b'),
    write([2, '2,'], '1 + 1 = 2', 300, 245, 38), write([2, 'places'], '2 places in the answer', 300, 320, 32, 'y'),
  ],
  // Put the point in
  [
    ...num([0, 'Start'], '312', 330, 60, 'w', 48), hop([0, 'count'], 346, 316, 30, 'y'), hop([0, 'count'], 316, 286, 30, 'y'),
    ...dec([0, '3.12'], '3.12', 280, 140, 44, 'y'),
    write([1, 'right'], '2 × 1 = 2', 170, 205, 30), write([1, '6,'], '3 × 2 = 6', 430, 205, 30),
    line([1, 'between'], [[90, 270], [510, 270]], 'd'),
    ...q([2, 6].flatMap(v => [line([1, 'between'], [[90 + 60 * v, 260], [90 + 60 * v, 280]]), write([1, 'between'], String(v), 90 + 60 * v, 305, 26)])),
    dot([1, 'between'], 277, 270, 'y'), write([1, 'between'], '3.12', 277, 240, 24, 'y'),
    write([2, 'meters'], 'the bed is 3.12 sq m', 300, 360, 32, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'COPY'], '2.4 × 1.3 =', 250, 170, 36), write([1, '31.2'], '31.2', 400, 170, 36, 'r'), cross([1, '31.2'], 350, 140, 100, 60),
    write([2, 'places'], '1 + 1 = 2 places', 300, 245, 28, 'd'),
    write([2, '3.12'], '2.4 × 1.3 = 3.12', 300, 320, 38, 'y'),
  ],
]
