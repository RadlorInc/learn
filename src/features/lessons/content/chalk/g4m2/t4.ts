/** g4m2-t4's chalkboards: index = screen index (0 is Screen 1, which has none). Line white, jumps blue, landings yellow. */
import type { ChalkMark } from '../../../chalk'
import { write, line, hop, clock, cross, ticks } from '../../../chalk'
import { warn, tick, type At } from '../g3m1/t1'

// The frog's line starts at x = 60 and is 480 px long: `n` spaces of 480 / n px (24 spaces = 20 px each).
const X0 = 60, L = 480
const at = (n: number, spaces: number) => X0 + (n * L) / spaces
/** The line with a tick every `every` spaces and 0 labelled. */
const frogLine = (a: At, y: number, spaces: number, every = 4): ChalkMark[] => [
  { ...ticks(a, X0, y - 6, L, spaces / every, 12, 'w'), w: 3 }, write(a, '0', X0, y + 28, 24, 'd'),
]
const jump = (a: At, from: number, to: number, y: number, spaces: number, c: 'b' | 'd' | 'w' = 'b') => hop(a, at(from, spaces), at(to, spaces), y - 8, c)

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // Counting by 1s is slow — 12 spaces, 40 px each
  [
    ...frogLine([0, 'space'], 270, 12, 1), write([0, 'space'], '12', at(12, 12), 298, 24, 'd'),
    ...['1', '2', '3', '4'].flatMap((n, i) => [jump([0, n], i, i + 1, 270, 12, 'w'), write([0, n], n, at(i + 1, 12), 298, 22, 'd')]),
    ...[4, 5, 6, 7].map(i => ({ ...jump([0, 'again'], i, i + 1, 270, 12, 'd'), quick: true })),
    clock([1, 'slow'], 110, 95, 26), write([1, 'lose'], 'lose your place?', 330, 95, 30, 'r'),
    jump([2, 'skips'], 0, 4, 262, 12),
    write([2, 'between'], 'skip these', at(2, 12), 350, 26, 'b'),
  ],
  // The big idea — 16 spaces, 30 px each
  [
    ...frogLine([0, 'Each'], 270, 16),
    ...[0, 1, 2].flatMap(i => [jump([0, 'jump'], 4 * i, 4 * i + 4, 270, 16), write([0, 'jump'], '4', at(4 * i + 2, 16), 170, 24, 'b')]),
    write([0, 'jumps'], '3 jumps of 4', 180, 80, 30, 'b'),
    write([0, 'far'], '12', at(12, 16), 300, 28, 'y'),
    write([0, 'far'], '3 × 4 = 12', 430, 80, 34, 'y'),
  ],
  // Jump by 4
  [
    ...frogLine([0], 220, 16), write([0, 'starts'], 'start', X0, 160, 22, 'd'),
    jump([0, 'jumps'], 0, 4, 220, 16),
    jump([1, 'again'], 4, 8, 220, 16), jump([1, 'and'], 8, 12, 220, 16),
    write([2, '4'], '4', at(4, 16), 252, 30, 'y'), write([2, '8'], '8', at(8, 16), 252, 30, 'y'), write([2, '12'], '12', at(12, 16), 252, 30, 'y'),
  ],
  // Each landing is a times fact
  [
    ...frogLine([0], 200, 16),
    ...[0, 1, 2].map(i => ({ ...jump([0], 4 * i, 4 * i + 4, 200, 16), quick: true })),
    ...['4', '8', '12'].map((n, i) => ({ ...write([0], n, at(4 * i + 4, 16), 232, 26, 'y'), quick: true })),
    write([0, 'lands'], '1 × 4', at(4, 16), 282, 28),
    write([1, 'land'], '2 × 4', at(8, 16), 282, 28), write([1, '3'], '3 × 4', at(12, 16), 282, 28),
    write([2, 'jumps'], 'jumps × 4 = the landing', 300, 350, 30, 'y'),
  ],
  // Skip to the 6th — 24 spaces, 20 px each
  [
    ...frogLine([0], 200, 24),
    write([0, '6th'], '?', at(24, 24), 140, 40, 'y'),
    ...[0, 1, 2, 3, 4, 5].map(i => ({ ...jump([0, 'jump'], 4 * i, 4 * i + 4, 200, 24, 'd'), quick: true })),
    write([1, 'jumps'], '6 jumps of 4', 220, 285, 30, 'b'), write([1, 'is'], '= 6 × 4', 395, 285, 30),
    write([2, '24'], '6 × 4 = 24', 300, 350, 36, 'y'), write([2, 'lands'], '24', at(24, 24), 232, 26, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, '0'], '1st landing: 0', 160, 170, 30, 'r'), cross([1, 'NOT'], 45, 145, 230, 50),
    line([2, 'frog'], [[100, 290], [500, 290]]), write([2, 'starts'], '0', 100, 322, 24, 'd'), write([2, 'starts'], 'start', 100, 250, 22, 'd'),
    hop([2, 'jumps'], 100, 200, 282, 'b'),
    write([2, '4'], '4', 200, 322, 26, 'y'), write([2, '4'], '1st landing: 4', 430, 170, 30, 'y'), tick([2, '4'], 548, 170),
  ],
]
