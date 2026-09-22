/**
 * g6m7-t5's chalkboards: index = screen index (0 is Screen 1, which has none).
 * The party's ages on a line from 0 to 40 at true scale (12 px a year). Colours across t5: white = the ages,
 * blue = the mean, yellow = the median (the one that fits), coral = the mistake, dim = labels.
 */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, ring, cross, arrow, hop } from '../../../chalk'
import { warn } from '../g3m1/t1'

type At = [number, string?]
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
/** Where age v sits: 0 at x = 60, 40 at x = 540. */
export const X = (v: number) => 60 + 12 * v
/** The line from 0 to 40, a tick every 5, and (optionally) 0, 10, 20, 30, 40 under it. */
const ageLine = (at: At, y: number, labels = true): ChalkMark[] => [
  q(line(at, [[40, y], [560, y]])),
  q({ beat: at[0], at: at[1], w: 2, d: Array.from({ length: 9 }, (_, i) => `M${X(5 * i)} ${y - 7} v14`).join(' ') }),
  ...(labels ? [0, 10, 20, 30, 40].map(v => q(write(at, String(v), X(v), y + 30, 22, 'd'))) : []),
]
/** A dot for age v, the k-th one stacked above that age. */
const dot = (at: At, v: number, y: number, k = 0, c: ChalkColor = 'w'): ChalkMark =>
  q({ beat: at[0], at: at[1], c, w: 6, d: `M${X(v) - 5} ${y - 12 - 13 * k} a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0` })
const kids = (at: At, y: number) => [dot(at, 9, y), dot(at, 10, y), dot(at, 10, y, 1), dot(at, 11, y)]
const party = (at: At, y: number) => [...kids(at, y), dot(at, 40, y)]
/** An arrow pointing down at age v, from y1 to y2, with a word over it. */
const pin = (at: At, v: number, y1: number, y2: number, word: string, c: ChalkColor): ChalkMark[] =>
  [arrow(at, [X(v), y1], [X(v), y2], c), write(at, word, X(v), y1 - 18, 24, c)]

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // The mean says 16
  [
    ...ageLine([0, 'ages'], 120), ...party([0, 'ages'], 120),
    write([0, '80'], '9 + 10 + 10 + 11 + 40 = 80', 300, 220, 30),
    write([1, 'Share'], '80 ÷ 5', 250, 280, 32), write([1, '16'], '= 16', 345, 280, 32, 'b'),
    ...pin([2, '16'], 16, 55, 98, '16?', 'b'),
    write([2, 'Nobody'], 'nobody is near 16', 440, 45, 26, 'r'),
  ],
  // The big idea: one far number pulls the mean; the median stays with the group
  [
    ...ageLine([0, 'One'], 230, false), ...kids([0, 'One'], 230), dot([0, 'far'], 40, 230),
    ring([0, 'far'], X(40), 218, 22, 22, 'w'),
    hop([0, 'pulls'], X(10), X(16), 205, 'b'), ...pin([0, 'mean'], 16, 110, 155, 'mean', 'b'),
    arrow([0, 'median'], [X(10), 330], [X(10), 250], 'y'), write([0, 'median'], 'median', X(10), 355, 26, 'y'),
    ring([0, 'group'], X(10), 216, 40, 26, 'y'),
  ],
  // Watch the mean get pulled
  [
    ...ageLine([0, 'kids'], 170), ...kids([0, 'kids'], 170),
    write([0, '9'], '9 + 10 + 10 + 11', 220, 265, 30), write([0, '40'], '= 40', 380, 265, 30),
    write([1, '40'], '40 ÷ 4', 220, 320, 30), write([1, '10'], '= 10', 330, 320, 30, 'b'),
    ...pin([1, 'mean'], 10, 85, 128, 'mean 10', 'b'),
    dot([2, 'grown-up'], 40, 170), ring([2, 'person'], X(40), 158, 22, 22, 'w'),
    hop([2, 'jumps'], X(10), X(16), 148, 'b'), write([2, '16'], 'mean 16', X(16) + 70, 110, 26, 'b'),
  ],
  // The median stays put
  [
    ...[9, 10, 10, 11, 40].map((v, i) => q(write([0, 'order'], String(v), 160 + 70 * i, 90, 36))),
    ring([1, 'middle'], 300, 90, 30, 28, 'y'),
    ring([2, '40'], 440, 90, 30, 28, 'd'),
    ...ageLine([2, 'list'], 280), ...party([2, 'list'], 280),
    ...pin([2, 'median'], 10, 200, 245, 'median 10', 'y'),
  ],
  // Pick the one that fits
  [
    ...ageLine([0, 'party'], 200), ...party([0, 'party'], 200),
    ring([0, 'everyone'], X(10), 186, 40, 28, 'y'),
    ...pin([1, 'median'], 10, 100, 150, 'median 10', 'y'),
    arrow([1, 'mean'], [X(16), 290], [X(16), 212], 'b'), write([1, 'mean'], 'mean 16', X(16), 312, 24, 'b'),
    write([1, 'nobody'], 'fits nobody', 400, 312, 24, 'r'),
    write([2, 'pick'], 'one far number → pick the median', 300, 365, 28, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'mean'], 'always the mean', 300, 160, 34, 'r'), cross([1, 'time'], 175, 138, 250, 44),
    ...ageLine([2, 'far'], 290, false), ...party([2, 'far'], 290),
    hop([2, 'pulls'], X(10), X(16), 250, 'b'), write([2, 'pulls'], 'mean', X(16) + 40, 222, 24, 'b'),
    arrow([2, 'median'], [X(10), 350], [X(10), 305], 'y'), write([2, 'median'], 'median', X(10) + 80, 350, 26, 'y'),
  ],
]
