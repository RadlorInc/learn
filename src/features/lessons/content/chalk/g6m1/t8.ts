/** g6m1-t8's chalkboards: index = screen index (0 is Screen 1, which has none). The ride is a line from 0 to 36 miles,
 *  x 60 to 540, so each hour's 12 miles is 160 px. One hour's jump is yellow, the other hours blue, the wrong move coral. */
import type { ChalkMark } from '../../../chalk'
import { write, line, hop, cross } from '../../../chalk'
import { q, warn } from './t5'

type At = [number, string?]
/** The ride's line at height y, with its end stops and the 0 and 36 labels under it. */
const ride = (at: At, y: number, c: 'w' | 'b' = 'w'): ChalkMark[] => [
  line(at, [[60, y], [540, y]], c), line(at, [[60, y - 10], [60, y + 10]], c), line(at, [[540, y - 10], [540, y + 10]], c),
  q(write(at, '0', 60, y + 30, 24, c)), q(write(at, '36 miles', 520, y + 30, 24, c)),
]
const cuts = (at: At, y: number): ChalkMark => ({ beat: at[0], at: at[1], c: 'w', d: `M220 ${y - 10} v20 M380 ${y - 10} v20` })

export const T8: (ChalkMark[] | undefined)[] = [
  undefined,
  // The total hides how fast
  [
    ...ride([0, '36'], 120), write([0, 'hours'], 'in 3 hours', 300, 80, 28),
    write([1, 'one'], '1 hour = ? miles', 300, 210, 30, 'y'),
    write([2, '2'], 'in 2 hours', 300, 265, 26, 'b'), ...ride([2, 'faster'], 300, 'b'),
  ],
  // The big idea: one hour's distance; divide the distance by the hours
  [
    ...ride([0, 'far'], 170), cuts([0, 'one'], 170),
    hop([0, 'one'], 60, 220, 170, 'y'), write([0, 'hour'], '1 hour', 140, 100, 24, 'y'),
    hop([0, 'divide'], 220, 380, 170, 'b'), hop([0, 'divide'], 380, 540, 170, 'b'),
    write([0, 'hours'], 'distance ÷ hours', 300, 300, 34, 'y'),
  ],
  // One jump for each hour
  [
    ...ride([0, 'ride'], 220), cuts([0, 'hours'], 220),
    write([1, 'jumps'], '3 hours = 3 jumps', 300, 60, 30),
    hop([1, 'equal'], 60, 220, 220, 'b'), hop([1, 'equal'], 220, 380, 220, 'b'), hop([1, 'equal'], 380, 540, 220, 'b'),
    ...[140, 300, 460].map(x => q(write([1, 'each'], '1 hour', x, 145, 22, 'b'))),
  ],
  // How long is one jump?
  [
    ...ride([0, 'long'], 180), cuts([0, 'long'], 180),
    hop([0, 'jump'], 60, 220, 180, 'y'), hop([0, 'jump'], 220, 380, 180, 'b'), hop([0, 'jump'], 380, 540, 180, 'b'),
    write([0, '12'], '36 ÷ 3 = 12', 300, 290, 36),
    q(write([1, '12'], '12', 220, 210, 24)), q(write([1, '12'], '24', 380, 210, 24)),
    write([1, 'miles'], '12 miles', 140, 110, 24, 'y'),
    write([1, 'hour'], '12 miles in one hour', 300, 355, 30, 'y'),
  ],
  // Say it as miles per hour
  [
    write([0, 'each'], '12 miles in each hour', 300, 60, 30),
    write([0, 'per'], '= 12 miles per hour', 300, 120, 34, 'y'),
    ...ride([1, 'Check'], 250), cuts([1, 'Check'], 250),
    hop([1, '3'], 60, 220, 250, 'b'), hop([1, '3'], 220, 380, 250, 'b'), hop([1, '3'], 380, 540, 250, 'b'),
    ...[140, 300, 460].map(x => q(write([1, '12'], '12', x, 190, 24, 'b'))),
    write([1, '36'], '3 × 12 = 36 miles', 300, 345, 32), line([1, 'whole'], [[465, 345], [480, 360], [505, 325]], 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'divide'], '3 ÷ 36', 300, 165, 38, 'r'), cross([1, 'miles'], 235, 143, 130, 44),
    write([1, 'HOURS'], 'hours', 255, 212, 22, 'r'), write([1, 'miles'], 'miles', 345, 212, 22, 'r'),
    write([2, 'first'], 'miles ÷ hours', 300, 275, 30, 'b'),
    write([2, '36'], '36 ÷ 3', 300, 340, 40, 'y'),
  ],
]
