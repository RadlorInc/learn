/** g6m1-t4's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Every bag is a cell of the same width on a board, so 3 bags and 5 bags stand at true proportion. Yellow is the
 *  price of one bag and what it leads to, blue the 2 extra bags, coral the mix-up. */
import type { ChalkMark } from '../../../chalk'
import { write, box, cells, wash, arrow, span, cross } from '../../../chalk'
import { warn } from './t1'

const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
const mids = (x0: number, w: number, n: number) => Array.from({ length: n }, (_, i) => x0 + w * i + w / 2)

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // 2 more bags is not $2 more
  [
    write([0, 'bags'], '3 bags', 65, 85, 22), cells([0, 'bags'], 130, 60, 240, 50, 3), write([0, '$12'], '$12', 420, 85, 30),
    write([0, '5'], '5 bags', 65, 155, 22), cells([0, '5'], 130, 130, 400, 50, 5),
    wash([0, 'more'], 370, 130, 160, 50, 'b'), write([0, 'more'], '2 more', 450, 200, 22, 'b'),
    write([1, '$2'], '$12 + $2', 300, 255, 32, 'r'), cross([1, 'No'], 225, 235, 150, 40),
    write([1, 'lot'], '1 bag > $1', 300, 312, 26, 'd'),
    write([2, 'one'], '1 bag = ?', 300, 365, 30, 'y'),
  ],
  // The big idea: ÷ down to one, then × up to how many
  [
    cells([0, 'Find'], 195, 40, 210, 50, 3), write([0, 'Find'], 'total', 470, 65, 24, 'd'),
    arrow([0, 'one'], [300, 95], [300, 145]), write([0, 'one'], '÷', 330, 120, 28),
    box([0, 'one'], 265, 150, 70, 50, 'y'), wash([0, 'one'], 265, 150, 70, 50, 'y'), write([0, 'one'], 'one', 385, 175, 26, 'y'),
    arrow([0, 'multiply'], [300, 205], [300, 255]), write([0, 'multiply'], '×', 330, 230, 28),
    cells([0, 'many'], 125, 260, 350, 50, 5, 'y'),
    write([0, 'want'], 'how many you want', 300, 345, 26, 'd'),
  ],
  // Find one bag
  [
    box([0, '$12'], 120, 100, 360, 60), span([0, '$12'], 120, 480, 75), write([0, '$12'], '$12', 300, 45, 30),
    cells([0, 'parts'], 120, 100, 360, 60, 3),
    ...mids(120, 120, 3).map(x => q(write([0, 'bag'], 'bag', x, 185, 22, 'd'))),
    write([1, '12'], '$12 ÷ 3 =', 270, 260, 34), write([1, '4'], '$4', 385, 260, 34, 'y'),
    ...mids(120, 120, 3).map(x => q(write([2, '$4'], '$4', x, 130, 30, 'y'))),
    write([2, '$4'], '1 bag = $4', 300, 340, 32, 'y'),
  ],
  // Line up 5 bags
  [
    write([0, 'Now'], '3 bags', 60, 75, 22), cells([0, 'Now'], 110, 50, 270, 50, 3),
    ...mids(110, 90, 3).map(x => q(write([0, 'Now'], '$4', x, 75, 26))),
    write([0, '5'], '5 bags', 60, 155, 22), cells([0, '5'], 110, 130, 450, 50, 5),
    ...mids(110, 90, 5).map(x => q(write([1, '$4'], '$4', x, 155, 26, 'y'))),
    write([2, 'change'], 'the price stays $4', 300, 270, 28, 'y'),
    wash([2, 'more'], 380, 130, 180, 50, 'b'), write([2, 'more'], '2 more bags', 470, 210, 22, 'b'),
  ],
  // Multiply
  [
    write([0, 'multiply'], 'price of one × how many', 300, 50, 26, 'd'),
    cells([1, 'bags'], 100, 100, 400, 60, 5),
    ...mids(100, 80, 5).map(x => q(write([1, '$4'], '$4', x, 130, 26))),
    write([1, 'is'], '5 × $4 =', 265, 275, 34),
    span([1, '$20'], 100, 500, 185), write([1, '$20'], '$20', 300, 215, 26, 'y'), write([1, '$20'], '$20', 385, 275, 34, 'y'),
    write([2, 'night'], 'movie night = $20', 300, 345, 30, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, '$12'], '5 × $12', 240, 150, 34, 'r'), write([1, '$60'], '= $60', 370, 150, 34, 'r'),
    cross([1, 'too'], 160, 128, 270, 44),
    write([2, 'bags'], '$12 = 3 bags', 300, 220, 28, 'd'),
    write([2, 'first'], '$12 ÷ 3 = $4', 300, 280, 30),
    write([2, '$20'], '5 × $4 = $20', 300, 340, 34, 'y'),
  ],
]
