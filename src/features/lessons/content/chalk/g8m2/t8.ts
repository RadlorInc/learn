/** g8m2-t8's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Clue 1 (y = 2x) on top, clue 2 (x + y = 12) under it; blue arrows carry 2x into y's place, yellow is what comes out. */
import type { ChalkMark } from '../../../chalk'
import { write, ring, cross, arrow } from '../../../chalk'
import { warn } from './t6'

export const T8: (ChalkMark[] | undefined)[] = [
  undefined,
  // One clue is not enough
  [
    write([0, 'own'], 'x + y = 12', 300, 70, 40),
    write([1, '1'], '1 + 11', 150, 160, 30), write([1, '5'], '5 + 7', 300, 160, 30), write([1, '6'], '6 + 6', 450, 160, 30),
    write([2, 'which'], 'which pair?', 300, 250, 32, 'y'),
    write([2, 'alone'], "one clue can't tell", 300, 320, 24, 'd'),
  ],
  // The big idea: write what y equals in y's place
  [
    write([0, 'equals'], 'y = 2x', 300, 60, 36),
    write([0, 'write'], 'x + y = 12', 300, 150, 36),
    arrow([0, 'place'], [335, 82], [296, 124], 'b'),
    write([0, 'only'], 'x + 2x = 12', 300, 240, 36, 'y'),
    write([0, 'solve'], 'only x left', 300, 310, 24, 'd'),
  ],
  // Swap y for 2x
  [
    write([0, 'same'], 'y = 2x', 300, 60, 36),
    write([1, 'see'], 'x + y = 12', 300, 150, 36),
    arrow([1, 'write'], [335, 82], [296, 124], 'b'),
    write([2, 'becomes'], 'x + 2x = 12', 300, 240, 36, 'y'),
    write([2, 'letter'], 'one letter left', 300, 310, 24, 'd'),
  ],
  // Solve for x
  [
    write([0, 'An'], 'x + 2x = 12', 300, 60, 36),
    write([0, 'makes'], 'x + 2x = 3x', 300, 125, 28, 'b'),
    write([1, 'So'], '3x = 12', 300, 190, 36),
    write([1, 'What'], '3 × ? = 12', 300, 255, 28, 'd'),
    write([2, '4'], 'x = 4', 300, 330, 40, 'y'),
  ],
  // Find y, then check
  [
    write([0, 'done'], 'x = 4', 150, 60, 32), write([0, 'need'], 'y = ?', 450, 60, 32, 'y'),
    write([1, 'says'], 'y = 2x', 300, 140, 32),
    write([1, '8'], 'y = 2 × 4 = 8', 300, 200, 36, 'y'),
    write([2, '12'], '4 + 8 = 12', 300, 280, 36),
    write([2, 'work'], 'both clues work', 300, 345, 28, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'goes'], 'x + y = 12', 300, 145, 32), ring([1, 'y'], 292, 145, 16, 20),
    write([2, 'becomes'], 'x + 2x = 12', 300, 220, 32, 'y'),
    write([2, 'never'], '2x + y = 12', 270, 295, 32, 'r'), cross([2, 'never'], 420, 277, 36, 36),
  ],
]
