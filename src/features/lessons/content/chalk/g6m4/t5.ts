/** g6m4-t5's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The $40 tape runs 60..540, four 25% pieces of 120. Colours: white the price, blue the money saved,
 *  yellow what you pay, coral the mix-up, dim labels. */
import type { ChalkMark } from '../../../chalk'
import { write, box, wash, cells, arrow, span, cross } from '../../../chalk'
import { warn } from '../g3m1/t1'

type At = [number, string?]
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
const X = [120, 240, 360, 480]   // centres of the four pieces
/** The $40 tape, four pieces, at y..y+70, with 25% dim at the top of each piece. */
const tape = (at: At, y: number): ChalkMark[] => [cells(at, 60, y, 480, 70, 4), ...X.map(x => q(write(at, '25%', x, y + 22, 20, 'd')))]
const tens = (at: At, y: number, from = 0): ChalkMark[] => X.slice(from).map(x => q(write(at, '$10', x, y + 50, 28)))

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // Off, but how much?
  [
    { beat: 0, at: 'sign', c: 'w', d: 'M190 30 H410 V110 H190 Z' }, write([0, 'percent'], '25% off', 300, 70, 44),
    write([0, 'dollars'], 'not dollars', 300, 140, 24, 'd'),
    box([1, '$40'], 60, 180, 480, 70), write([1, '$40'], '$40', 300, 215, 34),
    write([1, 'off'], '$ ? off', 300, 290, 32, 'b'),
    write([2, 'find'], 'first find it', 190, 355, 26, 'b'), write([2, 'pay'], 'then pay', 440, 355, 26, 'y'),
  ],
  // The big idea: find the saving, take it away
  [
    write([0, 'First'], 'the price', 300, 45, 24, 'd'), box([0, 'First'], 60, 70, 480, 70),
    wash([0, 'save'], 60, 70, 120, 70, 'b'), write([0, 'save'], 'save', 120, 105, 26, 'b'),
    arrow([0, 'away'], [120, 145], [120, 215], 'b'), write([0, 'away'], 'off', 120, 245, 26, 'b'),
    wash([0, 'price'], 180, 70, 360, 70, 'y'), span([0, 'price'], 180, 540, 170, 'y'), write([0, 'price'], 'you pay', 360, 205, 28, 'y'),
  ],
  // Four equal pieces
  [
    span([0, '$40'], 60, 540, 50), write([0, '$40'], '$40', 300, 25, 28),
    cells([0, 'pieces'], 60, 80, 480, 70, 4),
    ...X.map(x => q(write([1, '25%'], '25%', x, 115, 28))),
    write([1, 'four'], '25% + 25% + 25% + 25%', 300, 230, 32), write([1, '100%'], '= 100%', 300, 290, 36),
  ],
  // Find what you save
  [
    q(write([0, '40'], '$40', 300, 30, 26)), ...tape([0, '40'], 60),
    write([0, '40'], '40 ÷ 4 = 10', 300, 200, 36), ...tens([0, 'piece'], 60),
    wash([1, 'one'], 60, 60, 120, 70, 'b'), write([1, 'save'], 'you save $10', 300, 290, 34, 'b'),
  ],
  // Take it away
  [
    q(write([0], '$40', 300, 30, 26)), ...tape([0], 60), q(wash([0], 60, 60, 120, 70, 'b')), ...tens([0], 60),
    arrow([0, 'off'], [120, 135], [120, 195], 'b'), write([0, 'off'], '$10 off', 120, 225, 26, 'b'),
    write([0, '$40'], '$40 − $10 =', 350, 225, 34), write([0, '$30'], '$30', 500, 225, 34, 'y'),
    wash([0, '$30'], 180, 60, 360, 70, 'y'),
    write([1, 'pay'], 'you pay $30', 300, 320, 40, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, '25%'], '$40 − $25', 300, 165, 36, 'r'), cross([1, 'mean'], 220, 140, 160, 50),
    write([2, 'every'], '25 out of every $100', 300, 245, 30, 'b'),
    write([2, '$10'], '$40 − $10 = $30', 300, 325, 38, 'y'),
  ],
]
