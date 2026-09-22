/** g5m6-t2's chalkboards: index = screen index (0 is Screen 1, which has none). Across blue, up white, the dot yellow, the mix-up coral. */
import type { ChalkMark } from '../../../chalk'
import { write, line, ring } from '../../../chalk'
import { G, S, q, pair, pairAt, warn, cross, type At } from './t1'

/** Every crossing of the grid, as small dim dots: "all the spots". */
const spots = ([beat, at]: At): ChalkMark => q({ beat, at, c: 'd', w: 7,
  d: Array.from({ length: 49 }, (_, i) => `M${G.X(i % 7) - 1} ${G.Y(Math.floor(i / 7))} h2`).join(' ') })
/** "(4, 2)" at the top right, the 4 and the 2 at known places so either can be ringed. */
const P = { x: 485, y: 110, s: 40 }
const given = (at: At) => pair(at, '4', '2', P.x, P.y, P.s)
const ringNum = (at: At, which: 'a' | 'b', c: 'b' | 'w') => ring(at, pairAt(P.x, P.s)[which], P.y, 15, 23, c)

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // Two numbers, two moves
  [
    ...G.draw([0, 'Look']), spots([0, 'spots']),
    ...given([1, 'Which']),
    write([2, 'moves'], '2 moves', 485, 210, 30),
    write([2, 'order'], 'in order', 485, 260, 30),
  ],
  // The big idea
  [
    ...G.draw([0, 'To']), ...given([0, 'find']), G.corner([0, 'start']),
    G.across([0, 'across'], 0, 4), write([0, 'across'], '4 across', 485, 200, 28, 'b'),
    G.up([0, 'up'], 4, 0, 2), write([0, 'up'], '2 up', 485, 245, 28),
    G.dot([0, 'dot'], 4, 2),
  ],
  // Go 4 across
  [
    ...G.draw([0, 'Put']), ...given([0, 'Put']), G.corner([0, 'corner']),
    ringNum([1, '4'], 'a', 'b'),
    G.stepAcross([2, 'One'], 1), G.stepAcross([2, 'two'], 2), G.stepAcross([2, 'three'], 3), G.stepAcross([2, 'four'], 4),
    G.across([2, 'Stop'], 0, 4), write([2, 'Stop'], '4 across', 485, 200, 30, 'b'),
  ],
  // Go 2 up
  [
    ...G.draw([0, 'The']), ...given([0, 'The']), q(G.across([0, 'The'], 0, 4)), q(write([0, 'The'], '4 across', 485, 200, 30, 'b')),
    ringNum([0, '2'], 'b', 'w'),
    G.stepUp([1, 'One'], 4, 1), G.stepUp([1, 'two'], 4, 2),
    G.up([1, 'again'], 4, 0, 2), write([1, 'again'], '2 up', 485, 250, 30),
  ],
  // Put the dot
  [
    ...G.draw([0, 'Now']), ...given([0, 'Now']), q(G.across([0, 'Now'], 0, 4)), q(G.up([0, 'Now'], 4, 0, 2)),
    G.dot([0, 'dot'], 4, 2),
    ring([1, 'spot'], P.x, P.y, 80, 34, 'y'), write([1, 'one'], 'only one spot', 485, 210, 26, 'y'),
    line([2, 'flag'], [[G.X(4), G.Y(2)], [G.X(4), G.Y(2) - 70]]),
    { beat: 2, at: 'flag', c: 'y', d: `M${G.X(4)} ${G.Y(2) - 70} L${G.X(4) + 40} ${G.Y(2) - 57} L${G.X(4)} ${G.Y(2) - 44}` },
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...S.draw([1, "Don't"]), ...pair([1, "Don't"], '4', '2', 455, 170, 38),
    S.up([1, 'UP'], 0, 0, 4, 'r'), S.across([1, 'lands'], 0, 2, 4, 'r'), S.dot([1, 'lands'], 2, 4, 'r'),
    ...pair([1, 'different'], '2', '4', 455, 240, 34, 'r', 'r'), cross([1, 'spot'], 395, 214, 120, 52),
    S.across([2, 'across'], 0, 4), S.up([2, 'across'], 4, 0, 2), S.dot([2, 'across'], 4, 2),
    write([2, 'across'], 'across first', 455, 320, 32, 'y'),
  ],
]
