/** g4m6-t7's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, box, wash, span, ring, cross } from '../../../chalk'
import { grid, chars, coin, bill, warn, tick, type At } from './t5to7'

const q = (ms: ChalkMark[]) => ms.map(m => ({ ...m, quick: true }))
// Dimes are blue (tenths), pennies white (hundredths), the price yellow.
const bills = (at: At) => [...bill(at, 50, 45), ...bill(at, 160, 45)]
const dimes = (at: At) => [305, 350, 395].map(x => coin(at, x, 70, 18, 'b'))
const pennies = (at: At) => [450, 480, 510, 540, 570].map(x => coin(at, x, 70, 12))

export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // What does the tag mean?
  [
    ...bills([0, 'dollars']), write([0, 'dollars'], '2 dollars', 153, 125, 22, 'd'),
    ...dimes([0, 'dimes']), write([0, 'dimes'], '3 dimes', 350, 125, 22, 'b'),
    ...pennies([0, 'pennies']), write([0, 'pennies'], '5 pennies', 510, 125, 22),
    { beat: 1, at: 'tag', c: 'd', d: 'M200 175 H440 V265 H200 L165 220 Z' }, coin([1, 'tag'], 188, 220, 6, 'd'),
    ...chars([1, 'says'], '$2.35', [262, 296, 322, 350, 386], 220, 48, 'y'),
    write([2, 'which'], '?', 350, 315, 34, 'b'), write([2, 'which'], '?', 386, 315, 34),
  ],
  // The big idea: dimes in the first place after the point, pennies in the second
  [
    coin([0, 'Dimes'], 120, 75, 26, 'b'), { ...write([0, 'Dimes'], '10¢', 120, 75, 20, 'b'), quick: true }, write([0, 'tenths'], '= 1/10 of $1', 300, 75, 28, 'b'),
    coin([0, 'pennies'], 120, 150, 21), { ...write([0, 'pennies'], '1¢', 120, 150, 20), quick: true }, write([0, 'hundredths'], '= 1/100 of $1', 300, 150, 28),
    ...q([write([0, 'first'], 'dollars', 170, 245, 20, 'd'), box([0, 'first'], 135, 270, 70, 64, 'd')]),
    write([0, 'first'], '.', 245, 302, 56),
    write([0, 'first'], 'dimes', 310, 245, 20, 'b'), box([0, 'first'], 275, 270, 70, 64, 'b'), coin([0, 'first'], 310, 302, 22, 'b'),
    write([0, 'second'], 'pennies', 405, 245, 20), box([0, 'second'], 370, 270, 70, 64), coin([0, 'second'], 405, 302, 15),
  ],
  // A dime is one tenth
  [
    ...Array.from({ length: 10 }, (_, i) => coin([0, 'dimes'], 75 + 50 * i, 65, 20, 'b')),
    span([0, 'make'], 55, 545, 110), write([0, 'dollar'], '= 1 dollar', 300, 148, 28),
    ring([1, 'dime'], 75, 65, 28, 28, 'y'), write([1, '1/10'], '1 dime = 1/10 of a dollar', 300, 205, 28, 'b'),
    write([2, 'Tenths'], 'tenths', 330, 265, 20, 'd'), box([2, 'first'], 300, 290, 60, 60, 'b'),
    write([2, 'point'], '.', 262, 322, 48), write([2, '3'], '3', 330, 320, 44, 'b'),
  ],
  // A penny is one hundredth
  [
    grid([0, '100'], 60, 40, 150), write([0, 'pennies'], '100 pennies', 410, 80, 28), write([0, 'dollar'], '= 1 dollar', 410, 125, 28),
    { ...wash([1, 'penny'], 60, 40, 15, 15, 'w'), quick: true }, ring([1, 'penny'], 67, 47, 16, 16, 'y'),
    write([1, '1/100'], '1 penny = 1/100 of a dollar', 300, 228, 28),
    ...q([write([2, 'Hundredths'], 'tenths', 330, 285, 20, 'd'), write([2, 'Hundredths'], '.', 262, 337, 48), write([2, 'Hundredths'], '3', 330, 335, 44, 'b')]),
    write([2, 'Hundredths'], 'hundredths', 420, 285, 20, 'd'),
    box([2, 'second'], 390, 305, 60, 60), write([2, '5'], '5', 420, 335, 44),
  ],
  // Read the price
  [
    ...q([...bills([0, 'together']), ...dimes([0, 'together']), ...pennies([0, 'together'])]),
    write([1, 'dollars'], 'dollars', 200, 165, 20, 'd'), write([1, 'dollars'], '2', 200, 222, 56),
    write([1, 'point'], '.', 262, 224, 56),
    write([1, 'dimes'], 'dimes', 320, 165, 20, 'b'), write([1, 'dimes'], '3', 320, 222, 56, 'b'),
    write([1, 'pennies'], 'pennies', 410, 165, 20, 'd'), write([1, 'pennies'], '5', 410, 222, 56),
    write([2, '$2.35'], '$2.35', 280, 305, 44, 'y'), tick([2, 'tag'], 370, 305),
    write([2, 'enough'], 'just enough', 300, 362, 30, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'cents'], '5 cents =', 220, 165, 32), write([1, 'RIGHT'], '$0.5', 380, 165, 32, 'r'),
    cross([1, 'point'], 335, 143, 95, 44),
    write([2, '50'], '$0.5 = 50 cents', 300, 232, 28, 'd'),
    write([2, '$0.05'], '5 cents =', 200, 305, 32, 'y'), ...chars([2, '$0.05'], '$0.05', [300, 330, 356, 384, 414], 305, 40, ['y', 'y', 'y', 'b', 'y']),
    ring([2, '$0.05'], 384, 305, 16, 26, 'b'), write([2, '$0.05'], 'no dimes', 384, 362, 22, 'b'),
  ],
]
