/**
 * g6m7-t8's chalkboards: index = screen index (0 is Screen 1, which has none).
 * One chance line from 0 to 1 at true scale (400 px from x = 100). The bag: 3 red and 1 blue marble, written in words
 * (a coral marble would read as the warning colour). Colours across t8: white = the line, yellow = the chance that
 * answers, blue = the second chance (blue marble, tails), coral = the mistake, dim = labels.
 */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, ring, cross, span, hop } from '../../../chalk'
import { warn } from '../g3m1/t1'

type At = [number, string?]
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
/** Where chance p sits: 0 at x = 100, 1 at x = 500. */
const X = (p: number) => 100 + 400 * p
/** The line from 0 to 1 at y, a tick at each end (and the middle), with 0 and 1 (and 1/2) under it. */
const chanceLine = (at: At, y: number, mid = false): ChalkMark[] => [
  q(line(at, [[X(0) - 20, y], [X(1) + 20, y]])),
  q({ beat: at[0], at: at[1], w: 3, d: `M${X(0)} ${y - 10} v20 M${X(1)} ${y - 10} v20` + (mid ? ` M${X(0.5)} ${y - 10} v20` : '') }),
  q(write(at, '0', X(0), y + 32, 26, 'd')), q(write(at, '1', X(1), y + 32, 26, 'd')),
  ...(mid ? [q(write(at, '1/2', X(0.5), y + 32, 24, 'd'))] : []),
]
/** A dot on the line at chance p. */
const dot = (at: At, p: number, y: number, c: ChalkColor = 'y'): ChalkMark =>
  ({ beat: at[0], at: at[1], c, w: 7, d: `M${X(p) - 6} ${y} a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0` })
const bag = (at: At): ChalkMark[] => [write(at, 'bag: 3 red, 1 blue', 300, 50, 28, 'd')]

export const T8: (ChalkMark[] | undefined)[] = [
  undefined,
  // Words alone are fuzzy
  [
    write([0, 'maybe'], 'maybe?', 170, 70, 32), write([0, 'probably'], 'probably?', 420, 70, 32, 'b'),
    write([1, 'right'], 'which one?', 300, 150, 30, 'r'),
    ...chanceLine([2, 'line'], 270),
  ],
  // The big idea: 0 impossible, 1/2 in the middle, 1 certain
  [
    q(line([0, 'chance'], [[X(0) - 20, 200], [X(1) + 20, 200]])),
    q({ beat: 0, at: 'number', w: 3, d: `M${X(0)} 190 v20 M${X(1)} 190 v20` }),
    write([0, 'impossible'], '0', X(0), 160, 34), write([0, 'impossible'], 'impossible', X(0), 250, 24, 'd'),
    write([0, 'certain'], '1', X(1), 160, 34), write([0, 'certain'], 'certain', X(1), 250, 24, 'd'),
    q({ beat: 0, at: 'middle', w: 3, d: `M${X(0.5)} 190 v20` }),
    write([0, 'middle'], '1/2', X(0.5), 160, 34, 'y'), write([0, 'middle'], 'the middle', X(0.5), 250, 24, 'y'),
  ],
  // The two ends
  [
    ...bag([0, 'Start']),
    write([0, 'green'], 'green?', 300, 115, 30), cross([0, 'No'], 250, 95, 100, 40),
    ...chanceLine([0, 'ends'], 220),
    dot([1, 'chance'], 0, 220), write([1, '0'], '0 out of 4 = 0', 170, 320, 28, 'y'),
    dot([2, 'chance'], 1, 220), write([2, '1'], '4 out of 4 = 1', 430, 320, 28, 'y'),
  ],
  // Right in the middle
  [
    ring([0, 'coin'], 300, 80, 36, 36, 'w'), write([0, 'coin'], 'H', 300, 82, 32),
    write([0, 'way'], '1 out of 2', 300, 160, 28),
    ...chanceLine([0, 'middle'], 250),
    q({ beat: 0, at: '1/2', w: 3, d: `M${X(0.5)} 240 v20` }), dot([0, '1/2'], 0.5, 250),
    write([0, '1/2'], '1/2', X(0.5), 215, 32, 'y'),
    write([1, 'Heads'], 'heads', 180, 80, 28), write([1, 'tails'], 'tails', 420, 80, 28, 'b'),
    span([1, 'same'], X(0), X(0.5), 330, 'y'), span([1, 'same'], X(0.5), X(1), 330, 'b'),
    write([1, 'halfway'], 'halfway', X(0.5), 368, 24, 'y'),
  ],
  // Place red and blue
  [
    ...bag([0, 'bag']),
    ...chanceLine([0, 'bag'], 220, true),
    dot([0, '3/4'], 0.75, 220), write([0, '3/4'], 'red 3/4', X(0.75) + 55, 175, 28, 'y'),
    hop([1, 'past'], X(0.5), X(0.75) - 8, 205, 'y'),
    write([1, 'likely'], 'likely', X(0.75), 310, 30, 'y'),
    dot([2, '1/4'], 0.25, 220, 'b'), write([2, '1/4'], 'blue 1/4', X(0.25), 180, 28, 'b'),
    write([2, 'unlikely'], 'unlikely', X(0.25), 310, 30, 'b'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'likely'], 'blue 1/4 → likely', 300, 160, 30, 'r'), cross([1, 'happen'], 180, 140, 240, 40),
    ...chanceLine([2, '1/4'], 260, true), dot([2, '1/4'], 0.25, 260, 'b'),
    write([2, 'unlikely'], 'blue 1/4 → unlikely', 300, 350, 30, 'y'),
  ],
]
