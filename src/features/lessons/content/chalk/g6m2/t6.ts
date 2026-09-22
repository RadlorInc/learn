/**
 * g6m2-t6's chalkboards: index = screen index (0 is Screen 1, which has none).
 * Colours: white = the lists, blue = numbers on both lists / the pairs, yellow = the result, coral = the mistake, dim = labels.
 * Every list stands in the same columns, one column per number, so a number on both lists sits in one column.
 */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, ring, cross } from '../../../chalk'
import { warn, tick, type At } from '../g4m4/t1'

const COLS = [1, 2, 3, 4, 6, 9, 12, 18]
const cx = (n: number) => 160 + 54 * COLS.indexOf(n)
const F12 = [1, 2, 3, 4, 6, 12], F18 = [1, 2, 3, 6, 9, 18]
/** A whole list at one word: its number at the left, then each factor in its column. */
const list = (at: At, n: number, fs: number[], y: number, s = 30, c: ChalkColor = 'w'): ChalkMark[] => [
  ...head(at, n, y, s),
  ...fs.map(f => ({ ...write(at, String(f), cx(f), y, s, c), quick: true })),
]
/** A list's number, dim, behind a short divider. */
const head = (at: At, n: number, y: number, s = 30): ChalkMark[] => [
  { ...write(at, String(n), 80, y, s, 'd'), quick: true }, { ...line(at, [[118, y - s * 0.55], [118, y + s * 0.55]], 'd', 2), quick: true },
]
/** A pair arc under a list, from one factor to its partner. */
const pair = (at: At, a: number, b: number, y: number): ChalkMark => {
  const x1 = cx(a), x2 = cx(b)
  return { beat: at[0], at: at[1], c: 'b', w: 2.5, quick: true, d: `M${x1} ${y} Q${(x1 + x2) / 2} ${y + (x2 - x1) * 0.4} ${x2} ${y}` }
}

// The big idea uses 6 and 9 (not the lesson's numbers, so it does not give the answer away).
const C9 = [1, 2, 3, 6, 9], c9 = (n: number) => 210 + 70 * C9.indexOf(n)

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // Guessing can miss it
  [
    write([0, '2'], '2 bags', 110, 70, 32), write([0, 'works'], '6 pencils, 9 erasers each', 350, 70, 24, 'd'), tick([0, 'works'], 520, 70),
    write([0, '3'], '3 bags', 110, 140, 32), write([0, '3'], '4 pencils, 6 erasers each', 350, 140, 24, 'd'), tick([0, '3'], 520, 140),
    write([1, 'bigger'], '? bags', 110, 215, 32, 'b'), write([1, 'bigger'], 'more than 3?', 350, 215, 26, 'b'),
    write([1, 'stop'], 'stop too soon?', 300, 320, 32, 'r'),
  ],
  // The big idea: list both, take the biggest number on both lists
  [
    { ...write([0, 'List'], '6', 110, 110, 32, 'd'), quick: true }, write([0, 'List'], '9', 110, 190, 32, 'd'), { ...line([0, 'List'], [[155, 85], [155, 215]], 'd', 2), quick: true },
    ...[1, 2, 3, 6].map(f => ({ ...write([0, 'factors'], String(f), c9(f), 110, 32), quick: true })),
    ...[1, 3, 9].map(f => ({ ...write([0, 'numbers'], String(f), c9(f), 190, 32), quick: true })),
    ...[1, 3].map(f => ({ ...ring([0, 'lists'], c9(f), 150, 24, 68, 'b'), quick: true })),
    write([0, 'factor'], '3', c9(3), 285, 40, 'y'),
    write([0, 'share'], 'the biggest on both', 300, 345, 26, 'y'),
  ],
  // Factors of 12, found in pairs
  [
    write([0, 'Start'], '12', 200, 55, 36), write([0, 'divides'], '÷ ?', 262, 55, 36), write([0, 'left'], '→ 0 left over', 420, 55, 28, 'd'),
    write([1, '1'], '1 × 12', 150, 140, 32, 'b'), write([1, '2'], '2 × 6', 300, 140, 32, 'b'), write([1, '3'], '3 × 4', 450, 140, 32, 'b'),
    ...head([2, 'list'], 12, 240),
    ...(['1', '2', '3', '4', '6'] as const).map(w => write([2, w], w, cx(+w), 240, 30)),
    write([2, '12'], '12', cx(12), 240, 30),
    pair([2, '12'], 1, 12, 265), pair([2, '12'], 2, 6, 265), pair([2, '12'], 3, 4, 265),
  ],
  // Factors of 18, in the same columns
  [
    ...list([0, 'Now'], 12, F12, 215),
    write([0, '18'], '18', 300, 45, 34),
    write([1, '1'], '1 × 18', 150, 115, 32, 'b'), write([1, '2'], '2 × 9', 300, 115, 32, 'b'), write([1, '3'], '3 × 6', 450, 115, 32, 'b'),
    ...head([2, 'list'], 18, 280),
    ...(['1', '2', '3', '6', '9'] as const).map(w => write([2, w], w, cx(+w), 280, 30)),
    write([2, '18'], '18', cx(18), 280, 30),
    pair([2, '18'], 1, 18, 305), pair([2, '18'], 2, 9, 305), pair([2, '18'], 3, 6, 305),
  ],
  // The biggest on both lists
  [
    ...list([0, 'Look'], 12, F12, 80), ...list([0, 'Look'], 18, F18, 150),
    ...(['1', '2', '3', '6'] as const).map(w => ring([0, w], cx(+w), 115, 22, 62, 'b')),
    ring([1, '6'], cx(6), 115, 30, 76, 'y'), write([1, '6'], 'biggest', cx(6), 215, 24, 'y'),
    write([2, 'bags'], '6 bags', 300, 275, 40, 'y'),
    write([2, 'each'], 'each bag:', 130, 340, 26, 'd'), write([2, 'pencils'], '2 pencils', 305, 340, 30), write([2, 'erasers'], '3 erasers', 470, 340, 30),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, '3'], 'most bags = 3', 300, 160, 34, 'r'), cross([1, 'works'], 195, 138, 210, 44),
    ...list([2, 'Finish'], 12, F12, 235, 26), ...list([2, 'Finish'], 18, F18, 290, 26),
    ring([2, 'biggest'], cx(6), 262, 24, 52, 'y'),
    write([2, '6'], 'most bags = 6', 300, 358, 34, 'y'),
  ],
]
