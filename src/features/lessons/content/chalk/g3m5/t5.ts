/** g3m5-t5's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, cells, arrow, cross, ring } from '../../../chalk'
import { shade, warn, tick, type At } from './t5to8'

// Every bar is the same length, so the amounts can be compared by eye: x 150–510.
const X = 150, W = 360, H = 56
const bar = (at: At, y: number, n: number, k: number, h = H, x = X, w = W): ChalkMark[] => [cells(at, x, y, w, h, n), shade(at, x, y, w, h, n, k)]
const label = (at: At, t: string, y: number, x = 90): ChalkMark => ({ ...write(at, t, x, y, 28, 'd'), quick: true })

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // The names look different
  [
    ...bar([0, '1/2'], 60, 2, 1), label([0, '1/2'], '1/2', 88),
    ...bar([0, '2/4'], 150, 4, 2), label([0, '2/4'], '2/4', 178),
    ring([1, 'different'], 90, 88, 36, 26, 'r'), ring([1, 'different'], 90, 178, 36, 26, 'r'),
    write([1, 'more'], 'more chocolate?', 300, 262, 30, 'r'),
    write([2, 'bars'], 'look at the bars', 300, 335, 30, 'y'), arrow([2, 'bars'], [440, 320], [470, 222], 'y'),
  ],
  // The big idea
  [
    ...bar([0, 'same'], 70, 2, 1),
    arrow([0, 'smaller'], [420, 136], [420, 196], 'd'), write([0, 'smaller'], 'smaller pieces', 505, 166, 20, 'd'),
    ...bar([0, 'smaller'], 205, 4, 2),
    line([0, 'stays'], [[330, 50], [330, 282]], 'y', 4),
    write([0, 'stays'], 'same amount', 330, 330, 32, 'y'),
  ],
  // Half a bar
  [
    { ...line([0, 'bar'], [[120, 110], [480, 110], [480, 190], [120, 190], [120, 110]]) },
    line([0, '2'], [[300, 110], [300, 190]]),
    write([0, 'equal'], '2 equal pieces', 300, 225, 24, 'd'),
    { ...shade([1, 'Shade'], 120, 110, 360, 80, 2, 1), quick: false },
    write([1, '1/2'], '1/2', 210, 305, 44, 'y'), arrow([1, '1/2'], [210, 275], [210, 200], 'y'),
  ],
  // Cut each piece again
  [
    ...bar([0, 'Now'], 70, 2, 1, 80, 120), label([0, 'Now'], '1/2', 110, 60),
    line([0, 'cut'], [[210, 70], [210, 150]], 'y'), line([0, 'cut'], [[390, 70], [390, 150]], 'y'),
    write([1, '4'], '4 pieces', 300, 190, 24, 'd'),
    ring([1, 'shaded'], 210, 110, 102, 52, 'y'),
    write([1, '2/4'], '2/4', 210, 250, 44, 'y'),
    write([2, 'add'], 'nothing added', 300, 330, 28), write([2, 'eaten'], 'nothing eaten', 300, 370, 28),
  ],
  // They match
  [
    ...bar([0, 'bars'], 60, 2, 1), label([0, 'bars'], '1/2', 88),
    ...bar([0, 'above'], 150, 4, 2), label([0, 'above'], '2/4', 178),
    line([1, 'stops'], [[330, 40], [330, 226]], 'y', 4),
    write([1, 'same'], 'same place', 330, 256, 24, 'y'),
    write([2, 'amount'], '1/2 = 2/4', 300, 316, 42, 'y'),
    write([2, 'Nobody'], 'nobody has more', 300, 368, 24, 'd'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'ONE'], '1/2 = 1/4', 160, 150, 34, 'r'),
    ...bar([1, 'not'], 190, 2, 1, 30, 60, 200), ...bar([1, 'not'], 232, 4, 1, 30, 60, 200),
    cross([1, 'not'], 85, 128, 150, 44),
    write([2, '2/4'], '1/2 = 2/4', 440, 150, 34, 'y'),
    ...bar([2, '2/4'], 190, 2, 1, 30, 340, 200), ...bar([2, '2/4'], 232, 4, 2, 30, 340, 200),
    tick([2, '2/4'], 425, 300),
  ],
]
