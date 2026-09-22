/** g8m1-t1's chalkboards: index = screen index (0 is Screen 1, which has none). Also the small kit t2–t5 share.
 *  Colours: the first power's 2s white, the second's blue · the new exponent and results yellow · the mix-up coral · labels dim. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, cross, ring, clock, chalkWidth } from '../../../chalk'
import { expr, warn } from '../g6m5/t1'

export { expr, warn }
type At = [beat: number, at?: string]
/** `marks`, with `extra` slotted in before its last `n` marks — so a later word's result is drawn after a mark said before it. */
export const before = (marks: ChalkMark[], n: number, ...extra: ChalkMark[]) => [...marks.slice(0, -n), ...extra, ...marks.slice(-n)]
/** A wrong line struck through (still readable), with a coral ✕ after it. */
export const strike = (at: At, x1: number, x2: number, y: number): ChalkMark[] =>
  [line(at, [[x1, y], [x2, y]], 'r', 3), cross(at, x2 + 14, y - 18, 34, 34)]
/** A tick of approval. */
export const tick = (at: At, x: number, y: number): ChalkMark => line(at, [[x - 18, y], [x - 4, y + 16], [x + 22, y - 26]], 'y', 4.5)
/** A power of a power, (b^e1)^e2, centred on x; `ring` is where its outside exponent sits, for a ring round it. */
export function pp(at: At, b: string, e1: string, e2: string, x: number, y: number, s = 48, c: ChalkColor = 'w', c2: ChalkColor = c) {
  const sm = Math.round(s * 0.6), par = s * 0.32, bw = chalkWidth(b, s), e1w = chalkWidth(e1, sm), e2w = chalkWidth(e2, sm)
  const total = par + bw + e1w + par + e2w
  let cx = x - total / 2
  const put = (t: string, w: number, size: number, dy: number, col: ChalkColor) => { const m = write(at, t, cx + w / 2, y + dy, size, col); cx += w; return m }
  const marks = [put('(', par, s, 0, c), put(b, bw, s, 0, c), put(e1, e1w, sm, -s * 0.42, c), put(')', par, s, 0, c)]
  const ex = cx + e2w / 2, ey = y - s * 0.42
  marks.push(put(e2, e2w, sm, -s * 0.42, c2))
  return { marks, ring: [ex, ey] as [number, number] }
}

// The row 2 × 2 × 2 × 2 × 2 at s = 44, centred on 300: the 2s sit at 168, 234, 300, 366, 432.
const ROW: Parameters<typeof expr>[1] = ['2', '×', '2', '×', '2', ['×', 'b'], ['2', 'b'], ['×', 'b'], ['2', 'b']]

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // The long way: work both out, multiply, hunt for the exponent — then a pair nobody could work out
  [
    ...expr([0, '2³'], ['2^3', '=', '8'], 150, 70, 40), ...expr([0, '2²'], ['2^2', '=', '4'], 150, 140, 40),
    ...expr([0, '32'], ['8', '×', '4', '=', ['32', 'y']], 150, 210, 40),
    ...expr([1, 'hunt'], [['2^?', 'r'], '=', '32'], 430, 140, 44),
    ...expr([2, '2¹⁰'], ['2^10', '×', '2^15', '=', ['?', 'r']], 280, 310, 44), clock([2, 'day'], 480, 305, 28, 'r'),
  ],
  // The big idea: same base kept, the two small numbers added
  [
    ...expr([0, 'multiply'], ['2^3', '×', ['2^2', 'b']], 300, 110, 60),
    ring([0, 'same'], 240, 112, 24, 32, 'd'), ring([0, 'same'], 345, 112, 24, 32, 'd'),
    write([0, 'keep'], '2', 250, 290, 76, 'y'), write([0, 'keep'], 'keep', 250, 360, 24, 'd'),
    write([0, 'add'], '3 + 2', 325, 250, 40, 'y'), write([0, 'add'], 'add', 325, 200, 24, 'd'),
  ],
  // Write out every 2
  [
    ...expr([0, '2³'], ['2^3'], 80, 75, 48), ...expr([0, 'Three'], ['=', '2', '×', '2', '×', '2'], 215, 80, 40),
    ...expr([1, '2²'], [['2^2', 'b']], 80, 165, 48), ...expr([1, 'two'], ['=', ['2', 'b'], '×', ['2', 'b']], 175, 170, 40),
    ...expr([2, 'Line'], ROW, 300, 290, 44), write([2, 'row'], 'one long row', 300, 350, 24, 'd'),
  ],
  // Count the 2s: 3, then 2 more, 5 in all
  [
    ...expr([0, 'Now'], ROW, 300, 90, 44).map(m => ({ ...m, quick: true })),
    line([0, '3'], [[150, 120], [150, 132], [316, 132], [316, 120]]), write([0, '3'], '3', 233, 165, 32),
    line([0, '2'], [[348, 120], [348, 132], [450, 132], [450, 120]], 'b'), write([0, '2'], '2', 399, 165, 32, 'b'),
    write([1, '5'], '5 twos', 300, 220, 36, 'y'),
    ...expr([2, 'So'], ['2^3', '×', ['2^2', 'b'], '=', ['2^5', 'y', '2⁵']], 300, 300, 48),
    write([2, 'added'], '3 + 2 = 5', 300, 365, 30, 'y'),
  ],
  // Check it, then any base
  [
    ...expr([0, '2⁵'], ['2^5', '=', '32'], 200, 80, 44), write([0, 'same'], '8 × 4 = 32', 200, 150, 34, 'd'),
    tick([0, 'before'], 380, 115),
    ...before(expr([1, 'base'], ['5^4', '×', ['5^3', 'b'], '=', ['5^7', 'y', '5⁷']], 300, 250, 48), 2),
    write([1, 'because'], '4 + 3 = 7', 300, 330, 34, 'y'),
  ],
  // One thing not to do: multiplying the small numbers
  [
    ...warn([0, 'mix']),
    ...expr([1, '2³'], ['2^3', '×', '2^2', '=', '2^6'], 300, 170, 48).map(m => ({ ...m, c: 'r' as const })),
    ...strike([1, 'not'], 192, 408, 168),
    ...before(expr([2, 'twos'], ['2^3', '×', ['2^2', 'b'], '=', ['2^5', 'y', '2⁵']], 300, 280, 48), 2,
      write([2, 'make'], '3 + 2 = 5', 300, 350, 30, 'y')),
  ],
]
