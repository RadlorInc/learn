/** g6m3-t6's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, cells, wash, span, cross, ring } from '../../../chalk'

type At = [number, string?]
// Blue = the 4-pack, white = the 6-pack, yellow = the price for one (what decides), coral = the mix-up.
const q = (ms: ChalkMark[]) => ms.map(m => ({ ...m, quick: true }))
const warn = (at: At): ChalkMark[] => [line(at, [[300, 30], [345, 105], [255, 105], [300, 30]], 'r'), write(at, '!', 300, 80, 40, 'r')]

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // The price tag tricks you
  [
    write([0, '4-pack'], '4-pack', 140, 50, 24, 'b'), cells([0, '4-pack'], 60, 75, 160, 60, 4, 'b'),
    write([0, 'lower'], '6-pack', 440, 50, 24), cells([0, 'lower'], 320, 75, 240, 60, 6), write([0, 'lower'], '$4.20', 440, 180, 34),
    write([0, 'tag'], '$3.00', 140, 180, 34, 'b'), write([0, 'tag'], 'lower tag', 140, 225, 24, 'b'),
    write([1, 'fewer'], '4 boxes', 140, 280, 28, 'b'), write([1, 'boxes'], '6 boxes', 440, 280, 28),
    write([2, 'better'], 'better buy?', 300, 350, 32),
  ],
  // The big idea: price for one, the lower one wins
  [
    ...q([write([0, 'Find'], '$3.00', 140, 50, 30, 'b'), cells([0, 'Find'], 60, 75, 160, 60, 4, 'b'),
      write([0, 'Find'], '$4.20', 440, 50, 30), cells([0, 'Find'], 320, 75, 240, 60, 6)]),
    wash([0, 'one'], 60, 75, 40, 60, 'y'), write([0, 'one'], '1 box = ?', 140, 175, 26, 'y'),
    wash([0, 'each'], 320, 75, 40, 60, 'y'), write([0, 'pack'], '1 box = ?', 440, 175, 26, 'y'),
    write([0, 'lower'], 'lower price for one', 300, 260, 30, 'y'), write([0, 'better'], '= better buy', 300, 320, 34, 'y'),
  ],
  // One box in the 4-pack
  [
    write([0, '4-pack'], '4-pack', 300, 45, 26, 'b'), cells([0, '4-pack'], 100, 70, 400, 70, 4, 'b'),
    span([1, 'shared'], 100, 500, 170, 'b'), write([1, 'boxes'], '$3.00', 300, 205, 30, 'b'),
    wash([1, 'one'], 100, 70, 100, 70, 'y'),
    write([2, '3.00'], '3.00 ÷ 4', 240, 270, 34), write([2, '0.75'], '= 0.75', 372, 270, 34, 'y'),
    ...q([150, 250, 350, 450].map(x => write([3, 'costs'], '$0.75', x, 105, 24, 'y'))), write([3, '$0.75'], '1 box = $0.75', 300, 340, 32, 'y'),
  ],
  // One box in the 6-pack
  [
    write([0, 'Now'], '4-pack: 1 box = $0.75', 300, 35, 22, 'd'),
    write([0, '6-pack'], '6-pack', 300, 80, 26), cells([0, '6-pack'], 60, 100, 480, 70, 6),
    span([1, 'shared'], 60, 540, 195, 'w'), write([1, 'boxes'], '$4.20', 300, 230, 30),
    write([2, '4.20'], '4.20 ÷ 6', 240, 290, 34), write([2, '0.70'], '= 0.70', 372, 290, 34, 'y'),
    ...q([100, 180, 260, 340, 420, 500].map(x => write([3, 'costs'], '$0.70', x, 135, 24, 'y'))), write([3, '$0.70'], '1 box = $0.70', 300, 355, 32, 'y'),
  ],
  // Compare
  [
    write([0, 'two'], '4-pack', 170, 90, 30, 'b'), write([0, 'two'], '1 box: $0.75', 390, 90, 30, 'y'),
    write([0, 'side'], '6-pack', 170, 160, 30), write([0, 'side'], '1 box: $0.70', 390, 160, 30, 'y'),
    write([1, 'less'], '$0.70 < $0.75', 300, 240, 36, 'y'),
    ring([2, '6-pack'], 170, 160, 70, 28, 'y'), write([2, 'better'], '6-pack = better buy', 300, 315, 32, 'y'),
    write([2, 'higher'], 'even with the $4.20 tag', 300, 368, 24, 'd'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'LOWER'], '$3.00 < $4.20', 300, 160, 34), write([1, 'tag'], 'so buy the 4-pack', 300, 210, 28, 'r'),
    cross([1, 'fewer'], 330, 190, 94, 40),
    write([2, 'one'], '$0.70 < $0.75', 300, 285, 34, 'y'), write([2, 'beats'], 'so buy the 6-pack', 300, 335, 28, 'y'),
  ],
]
