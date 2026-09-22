/** g8m3-t6's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Hours 0–10 along the bottom, miles from home 0–8 up the side; Sam's ride is (0, 0) (2, 6) (4, 6) (6, 8) (10, 0).
 *  Colours: dim = the whole ride, yellow = the piece being read and what it means, blue = the gentle climb, coral = the mix-up. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, arrow, cross } from '../../../chalk'
import { warn } from '../g5m1/t17'
import { q } from './t4'

type At = [beat: number, at?: string]
const X = (x: number) => 70 + 42 * x
const Y = (y: number) => 345 - 27 * y
const RIDE: [number, number][] = [[0, 0], [2, 6], [4, 6], [6, 8], [10, 0]]
const pt = ([x, y]: [number, number]): [number, number] => [X(x), Y(y)]

/** The axes with hours 0–10 and miles 2–8 marked. */
const axes = (at: At): ChalkMark[] => [
  q(line(at, [[X(0), Y(8.8)], [X(0), Y(0)], [X(10.5), Y(0)]], 'd')),
  ...[0, 2, 4, 6, 8, 10].map(n => q(write(at, String(n), X(n), Y(0) + 22, 20, 'd'))),
  ...[2, 4, 6, 8].map(n => q(write(at, String(n), X(0) - 20, Y(n), 20, 'd'))),
  q(write(at, 'hours', 548, Y(0), 20, 'd')), q(write(at, 'miles', X(0) + 34, Y(8.8) - 6, 20, 'd')),
]
/** Piece i of the ride (0 = hour 0 to 2 … 3 = hour 6 to 10). */
const piece = (at: At, i: number, c: ChalkColor, w = 5): ChalkMark => line(at, [pt(RIDE[i]), pt(RIDE[i + 1])], c, w)
const ride = (at: At, c: ChalkColor = 'd'): ChalkMark[] => [...axes(at), q(line(at, RIDE.map(pt), c))]

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // No rule to use
  [
    write([0, 'rule'], 'no rule', 300, 45, 32, 'r'),
    ...ride([1, 'graph'], 'w'),
    ...([[92, 250], [196, 162], [262, 138], [432, 225]] as const).map(([x, y], i) => q(write([2, 'piece'], String(i + 1), x, y, 24, 'b'))),
  ],
  // The big idea: read left to right — up growing, down shrinking, flat the same
  [
    q(write([0, 'left'], 'left', 75, 70, 22, 'd')), arrow([0, 'left'], [110, 70], [480, 70], 'b'), write([0, 'right,'], 'right', 525, 70, 22, 'd'),
    line([0, 'up'], [[90, 280], [190, 170]], 'y', 5), write([0, 'growing,'], 'growing', 140, 320, 28, 'y'),
    line([0, 'down'], [[250, 170], [350, 280]], 'b', 5), write([0, 'shrinking,'], 'shrinking', 300, 320, 28, 'b'),
    line([0, 'flat'], [[410, 225], [510, 225]], 'w', 5), write([0, 'same.'], 'the same', 460, 320, 28),
  ],
  // Going up
  [
    ...ride([0, 'Start']),
    piece([0, 'climbs'], 0, 'y'), write([0, 'miles.'], '6 miles', 180, 158, 22, 'y'),
    write([2, 'away.'], 'up = riding away from home', 300, 45, 28, 'y'),
  ],
  // Flat
  [
    ...ride([0, 'Next']),
    piece([0, 'flat'], 1, 'y'), write([0, 'miles.'], '6 miles', 196, 158, 22, 'y'),
    write([2, 'rest.'], 'flat = stopped', 300, 45, 30, 'y'),
  ],
  // Steep, gentle, and down
  [
    ...ride([0, 'From']),
    piece([0, 'climbs'], 2, 'b'), write([0, 'miles.'], '+2', 262, 136, 22, 'b'),
    piece([1, 'climbed'], 0, 'y'), write([1, '6.'], '+6', 92, 250, 22, 'y'),
    write([1, 'faster.'], 'steeper = faster', 300, 45, 30, 'y'),
    piece([2, 'down'], 3, 'w'), write([2, 'home.'], 'riding home', 470, 170, 24),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    { beat: 1, at: 'picture', c: 'r', d: 'M50 320 Q170 110 290 320' },
    cross([1, 'hill.'], 120, 190, 100, 100),
    q(line([2, 'Going'], [[340, 140], [340, 320], [570, 320]], 'd')), q(write([2, 'Going'], 'miles from home', 440, 130, 20, 'd')),
    line([2, 'down'], [[350, 160], [550, 305]], 'y', 5),
    write([2, 'downhill.'], 'rides downhill', 170, 355, 24, 'r'),
    write([2, 'closer'], 'closer to home', 455, 355, 24, 'y'),
  ],
]
