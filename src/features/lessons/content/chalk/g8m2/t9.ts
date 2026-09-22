/** g8m2-t9's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  a = adult tickets (white), k = kid tickets (blue). The tickets equation and the dollars equation stay on their own rows. */
import type { ChalkMark } from '../../../chalk'
import { write, cross, arrow } from '../../../chalk'
import { warn } from './t6'

export const T9: (ChalkMark[] | undefined)[] = [
  undefined,
  // Two things you do not know
  [
    write([0, 'adult'], 'adult ?', 190, 60, 32), write([0, 'kid'], 'kid ?', 410, 60, 32, 'b'),
    write([1, 'guess'], '5 + 5 → $35', 300, 140, 28, 'd'), write([1, 'check'], '3 + 7 → $29', 300, 195, 28, 'd'),
    write([1, 'slow'], 'slow', 300, 255, 28, 'r'),
    write([2, 'faster'], 'a faster way?', 300, 330, 32, 'y'),
  ],
  // The big idea: a letter each, an equation per fact, solve together
  [
    write([0, 'letter'], 'adult → a', 180, 70, 30), write([0, 'letter'], 'kid → k', 420, 70, 30, 'b'),
    write([0, 'fact'], 'fact 1 → an equation', 300, 160, 28), write([0, 'fact'], 'fact 2 → an equation', 300, 215, 28),
    write([0, 'together'], 'solve them together', 300, 310, 32, 'y'),
  ],
  // One equation for each fact
  [
    write([0, 'a'], 'a = adult tickets', 180, 60, 26), write([0, 'k'], 'k = kid tickets', 430, 60, 26, 'b'),
    write([1, 'one'], 'tickets:', 115, 160, 24, 'd'), write([1, 'k'], 'a + k = 10', 340, 160, 36, 'y'),
    write([2, 'two'], 'dollars:', 115, 250, 24, 'd'), write([2, '5a'], '5a + 2k = 32', 340, 250, 36, 'y'),
  ],
  // Get one letter alone
  [
    write([0, 'easier'], 'a + k = 10', 300, 55, 32),
    write([0, 'then'], 'k = 10 − a', 300, 115, 32, 'y'),
    write([1, 'Put'], '5a + 2k = 32', 300, 190, 32),
    arrow([1, 'place'], [360, 132], [315, 170], 'b'),
    write([2, 'gives'], '5a + 2(10 − a) = 32', 300, 260, 32),
    write([2, 'or'], '5a + 20 − 2a = 32', 300, 330, 32),
  ],
  // Solve and check
  [
    write([0, 'Tidy'], '3a + 20 = 32', 300, 55, 32),
    write([0, '12'], '3a = 12', 300, 115, 32),
    write([1, '4'], 'a = 4', 200, 190, 38, 'y'), write([1, '6'], 'k = 6', 400, 190, 38, 'y'),
    write([2, '$20'], '$20 + $12 = $32', 300, 270, 32),
    write([2, 'fits'], 'it fits', 300, 340, 30, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'mix'], 'a + k = 32', 270, 150, 34, 'r'), cross([1, 'ONE'], 400, 132, 36, 36),
    write([2, 'tickets'], 'tickets', 170, 295, 22, 'd'), write([2, '10'], 'a + k = 10', 170, 250, 32, 'y'),
    write([2, 'dollars'], 'dollars', 430, 295, 22, 'd'), write([2, 'own'], '5a + 2k = 32', 430, 250, 32, 'y'),
  ],
]
