/** g8m2-t7's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Minutes along the bottom, blocks up the side. Ana's line y = x + 2 in white, Ben's y = −x + 6 in blue; they cross at (2, 4). */
import type { ChalkMark } from '../../../chalk'
import { write, line, ring, cross, arrow } from '../../../chalk'
import { q, warn } from './t6'

type At = [number, string?]
const X = (x: number) => 60 + 48 * x
const Y = (y: number) => 350 - 42 * y
const R = 7
const dot = (at: At, x: number, y: number): ChalkMark[] => {
  const d = `M${X(x) - R} ${Y(y)} a${R} ${R} 0 1 0 ${R * 2} 0 a${R} ${R} 0 1 0 ${-R * 2} 0`
  return [{ beat: at[0], at: at[1], d, c: 'y', wash: true, quick: true }, { beat: at[0], at: at[1], d, c: 'y', quick: true }]
}
/** Axes 0–7 each way, then the two walkers' lines. */
const graph = (at: At): ChalkMark[] => [
  line(at, [[X(0), Y(7.4)], [X(0), Y(0)], [X(7.4), Y(0)]], 'd'),
  ...[1, 2, 3, 4, 5, 6, 7].map(n => q(write(at, String(n), X(n), Y(0) + 20, 20, 'd'))),
  ...[1, 2, 3, 4, 5, 6, 7].map(n => q(write(at, String(n), X(0) - 20, Y(n), 20, 'd'))),
  line(at, [[X(0), Y(2)], [X(5.2), Y(7.2)]]), q(write(at, 'Ana', X(5.2) + 30, Y(7.2) + 8, 22)),
  line(at, [[X(0), Y(6)], [X(6.2), Y(-0.2)]], 'b'), q(write(at, 'Ben', X(6.2) + 30, Y(0.6), 22, 'b')),
]
const meet = (at: At) => ring(at, X(2), Y(4), 16, 16)
const down = (at: At) => line(at, [[X(2), Y(4)], [X(2), Y(0)]], 'y')

export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // Two rules at once
  [
    q(write([0, 'list'], 'minute', 150, 60, 22, 'd')), q(write([0, 'list'], 'Ana', 300, 60, 24)), q(write([0, 'list'], 'Ben', 450, 60, 24, 'b')),
    line([0, 'list'], [[90, 82], [510, 82]], 'd'),
    q(write([0, 'minute'], '0', 150, 115, 28, 'd')), q(write([0, 'minute'], '2', 300, 115, 28)), q(write([0, 'minute'], '6', 450, 115, 28, 'b')),
    q(write([0, 'minute'], '1', 150, 160, 28, 'd')), q(write([0, 'minute'], '3', 300, 160, 28)), q(write([0, 'minute'], '5', 450, 160, 28, 'b')),
    write([0, 'comparing'], 'and on, and on', 300, 210, 24, 'd'),
    write([1, 'both'], 'one x, one y, both rules', 300, 275, 30, 'y'),
    write([1, 'Where'], 'where?', 300, 340, 30, 'y'),
  ],
  // The big idea: the crossing is on both lines
  [
    ...graph([0, 'point']),
    meet([0, 'cross']),
    arrow([0, 'both'], [430, 182], [180, 182], 'y'), write([0, 'both'], 'on both lines', 505, 182, 24, 'y'),
    write([0, 'true'], 'fits both rules', 505, 235, 22, 'y'),
  ],
  // Find the crossing: straight down to x = 2
  [
    ...graph([0, 'Follow']),
    meet([0, 'meet']),
    down([1, 'down']),
    ring([2, '2'], X(2), Y(0) + 20, 14, 16), write([2, '2'], 'x = 2', 505, 200, 32, 'y'),
  ],
  // Read the point: across to y = 4
  [
    ...graph([0, 'Now']), q(down([0, 'Now'])),
    line([0, 'across'], [[X(2), Y(4)], [X(0), Y(4)]], 'y'),
    ring([1, '4'], X(0) - 20, Y(4), 14, 16), write([1, '4'], 'y = 4', 505, 150, 32, 'y'),
    ...dot([1, 'point'], 2, 4), write([1, 'point'], '(2, 4)', 505, 210, 36, 'y'),
    write([2, 'home'], '2 min, 4 blocks', 495, 290, 22),
  ],
  // Check both rules
  [
    write([0, 'fit'], '(2, 4)', 300, 60, 36, 'y'),
    write([1, 'Ana'], 'Ana: y = x + 2', 160, 145, 26), write([1, '4'], '2 + 2 = 4', 440, 145, 30),
    write([1, 'Ben'], 'Ben: y = −x + 6', 160, 220, 26, 'b'), write([1, '6'], '−2 + 6 = 4', 440, 220, 30, 'b'),
    write([2, 'Both'], 'both give 4', 300, 310, 34, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, '3'], '(1, 3)', 140, 150, 34), write([1, "Ana's"], 'Ana: 1 + 2 = 3', 410, 150, 26),
    write([2, '5'], 'Ben: −1 + 6 = 5', 410, 210, 26, 'r'), cross([2, 'not'], 225, 133, 34, 34),
    write([2, 'crossing'], '(2, 4) fits both', 300, 300, 32, 'y'),
  ],
]
