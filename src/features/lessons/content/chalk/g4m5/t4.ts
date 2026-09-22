/** g4m5-t4's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, cross, ring } from '../../../chalk'
import { warn } from '../g3m1/t1'
import { angle, arc, ray, sq, pt, type At } from './t2'
// Colours across these boards: white = the whole angle, blue = the part we know, yellow = what we work out, coral = the mix-up.

// The square corner cut 40° + 50°, corner at (80, 330), rays 210 long; each part's label sits in its middle.
const X = 80, Y = 330, L = 210
const in40 = pt(X, Y, 20, 120), in50 = pt(X, Y, 65, 120)
const corner = (at: At): ChalkMark[] => [{ ...angle(at, X, Y, 90, L), quick: true }, { ...ray(at, X, Y, 40, L), quick: true }]

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // No need to measure again
  [
    { ...angle([0], 150, 330, 90, 240), quick: true }, ray([0], 150, 330, 40, 240),
    { ...arc([0, 'part'], 150, 330, 60, 0, 40, 'd'), quick: true }, arc([0, 'part'], 150, 330, 70, 40, 90, 'd'),
    sq([1, 'whole'], 150, 330, 0, 22, 'w'), write([1, 'whole'], 'whole: 90°', 450, 120, 30),
    write([1, 'part'], '40°', ...pt(150, 330, 20, 150), 26, 'b'), write([1, 'part'], 'one part: 40°', 450, 175, 30, 'b'),
    write([1, 'need'], '?', ...pt(150, 330, 65, 150), 36, 'y'),
    write([1, 'work'], 'work it out', 450, 250, 32, 'y'),
  ],
  // The big idea: part + part = whole
  [
    angle([0, 'angle'], 100, 320, 100, 210), ray([0, 'split'], 100, 320, 45, 210),
    { ...arc([0, 'parts'], 100, 320, 60, 0, 45, 'b'), quick: true }, arc([0, 'parts'], 100, 320, 70, 45, 100, 'b'),
    write([0, 'add'], 'part + part', 450, 170, 34),
    arc([0, 'whole'], 100, 320, 110, 0, 100, 'y', 4), write([0, 'whole'], '= whole', 450, 230, 34, 'y'),
  ],
  // Parts side by side
  [
    ray([0], 170, 330, 0, 250),
    ray([0, '40'], 170, 330, 40, 250), arc([0, '40'], 170, 330, 70, 0, 40, 'b'), write([0, '40'], '40°', ...pt(170, 330, 20, 135), 26, 'b'),
    ray([0, '50'], 170, 330, 90, 250), arc([0, '50'], 170, 330, 80, 40, 90), write([0, '50'], '50°', ...pt(170, 330, 65, 135), 26),
    sq([1, 'corner'], 170, 330, 0, 24, 'w'),
  ],
  // Add the parts
  [
    ...corner([0]), { ...write([0], '40°', ...in40, 24, 'b'), quick: true }, write([0], '50°', ...in50, 24),
    write([0, 'whole'], 'whole = ?', 450, 110, 32),
    write([1, '40'], '40° + 50°', 450, 180, 34), write([1, '90'], '= 90°', 450, 240, 38, 'y'),
    sq([2, 'right'], X, Y, 0, 24, 'y'), write([2, 'right'], 'right angle', 450, 310, 30, 'y'),
  ],
  // Find a missing part
  [
    ...corner([0]),
    write([0, 'turn'], '?', ...in50, 34, 'y'),
    sq([0, 'whole'], X, Y, 0, 22, 'w'), write([0, 'whole'], 'whole: 90°', 440, 90, 30),
    arc([0, '40'], X, Y, 60, 0, 40, 'b'), write([0, '40'], '40°', ...in40, 24, 'b'), write([0, '40'], 'part: 40°', 440, 145, 30, 'b'),
    write([1, 'away'], 'whole − part', 440, 205, 28, 'd'),
    write([2, '90'], '90° − 40°', 440, 260, 34), write([2, '50'], '= 50°', 440, 315, 38, 'y'),
    ring([2, 'missing'], ...in50, 22, 22, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'add'], '? = 90° + 40°', 300, 170, 34, 'r'), cross([1, 'on'], 180, 150, 240, 42),
    write([2, 'bigger'], 'bigger than the whole 90°', 300, 235, 26, 'd'),
    write([2, 'away'], '? = 90° − 40° = 50°', 300, 310, 34, 'y'),
  ],
]
