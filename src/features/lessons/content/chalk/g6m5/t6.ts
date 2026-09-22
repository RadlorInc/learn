/** g6m5-t6's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Colours: white = x and the working, blue = the 2 erasers in a bag, yellow = the result (3x + 6), coral = the mistake. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, box, hop, ring, cross } from '../../../chalk'
import { dots, q, warn } from '../g5m1/t17'

type At = [beat: number, at?: string]

/** A gift bag: a box with an x (the pens) and two blue erasers. */
const bag = (at: At, x: number, y: number, w = 110, h = 64): ChalkMark[] => [
  q(box(at, x, y, w, h)), q(write(at, 'x', x + 32, y + h / 2 - 3, 38)),
  dots(at, [[x + 66, y + h / 2], [x + 88, y + h / 2]], 8, 'b'),
]
/** "3(x + 2)" written piece by piece so a hop can land on the x and on the 2. `x0` is the 3. */
const P3 = (x0: number) => ({ three: x0, open: x0 + 30, x: x0 + 58, plus: x0 + 92, two: x0 + 126, close: x0 + 154 })
const paren3 = (at: At, x0: number, y: number, s = 40, c: ChalkColor = 'w', two: ChalkColor = 'b'): ChalkMark[] => {
  const p = P3(x0)
  return [q(write(at, '3', p.three, y, s, c)), q(write(at, '(', p.open, y, s, c)), q(write(at, 'x', p.x, y, s, c)),
    q(write(at, '+', p.plus, y, s, c)), q(write(at, '2', p.two, y, s, two)), write(at, ')', p.close, y, s, c)]
}

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // x and 2 do not join
  [
    ...bag([0, 'bag'], 245, 30),
    write([0, "That's"], 'x + 2', 300, 135, 38),
    write([1, 'know'], 'x = ?', 300, 195, 30, 'd'),
    write([1, 'join'], "can't join into one number", 300, 240, 26, 'd'),
    ...[45, 185, 325].flatMap(x => bag([2, 'three'], x, 290)),
    write([2, 'bags'], '= ?', 520, 322, 36, 'y'),
  ],
  // The big idea: the 3 reaches every part inside
  [
    ...[45, 245, 445].flatMap(x => bag([0], x, 20, 110, 60)),
    write([0, 'outside'], '3', P3(170).three, 190, 44),
    q(write([0, 'parentheses'], '(', P3(170).open, 190, 44)), write([0, 'parentheses'], ')', P3(170).close, 190, 44),
    q(write([0, 'parentheses'], 'x', P3(170).x, 190, 44)), q(write([0, 'parentheses'], '+', P3(170).plus, 190, 44)),
    write([0, 'parentheses'], '2', P3(170).two, 190, 44, 'b'),
    hop([0, 'multiplies'], P3(170).three, P3(170).x, 160), hop([0, 'every'], P3(170).three, P3(170).two, 160),
    write([0, 'same'], '=', 300, 290, 44),
    write([0, '3x'], '3x', 360, 290, 44, 'y'), write([0, '6'], '+ 6', 428, 290, 44, 'y'),
  ],
  // Keep the bag together
  [
    q(write([0, 'x'], 'x', P3(200).x, 80, 44)), q(write([0, 'x'], '+', P3(200).plus, 80, 44)), write([0, 'x'], '2', P3(200).two, 80, 44, 'b'),
    q(write([0, '2'], '(', P3(200).open, 80, 44)), write([0, '2'], ')', P3(200).close, 80, 44),
    ...bag([1, 'bag'], 245, 150),
    ...[95, 395].flatMap(x => bag([2, 'Three'], x, 150)),
    write([2, 'bags?'], '3 bags', 300, 250, 26, 'd'),
    write([2, '3'], '3', P3(200).three, 80, 44),
    write([2, '3(x'], '3 bags = 3(x + 2)', 300, 330, 36, 'y'),
  ],
  // Open the bags
  [
    ...[45, 245, 445].flatMap(x => bag([0, 'bags'], x, 25, 110, 60)),
    q(ring([1, 'x,'], 77, 53, 16, 20, 'w')), q(ring([1, 'x,'], 277, 53, 16, 20, 'w')), ring([1, 'x,'], 477, 53, 16, 20, 'w'),
    write([1, "x's,"], 'x + x + x', 200, 160, 34), write([1, '3x'], '=', 300, 160, 34), write([1, '3x'], '3x', 360, 160, 34),
    q(ring([2, 'erasers,'], 122, 55, 25, 16, 'b')), q(ring([2, 'erasers,'], 322, 55, 25, 16, 'b')), ring([2, 'erasers,'], 522, 55, 25, 16, 'b'),
    write([2, '3'], '3 × 2', 200, 230, 34, 'b'), write([2, '6'], '=', 300, 230, 34), write([2, '6'], '6', 360, 230, 34, 'b'),
    ...paren3([3, '3(x'], 95, 320, 38, 'y', 'y'),
    write([3, '3(x'], '=', 300, 320, 38, 'y'), write([3, '3x'], '3x + 6', 385, 320, 38, 'y'),
  ],
  // Test it
  [
    write([0, 'x'], 'x = 4', 300, 45, 38),
    write([1, 'One'], 'one bag', 150, 110, 24, 'd'),
    write([1, '4'], '4 + 2 = 6', 150, 170, 34), write([1, '3'], '3 × 6 =', 125, 235, 34), write([1, '18'], '18', 228, 235, 34, 'y'),
    write([2, 'other'], 'the other way', 450, 110, 24, 'd'),
    write([2, '4'], '3 × 4 = 12', 450, 170, 34), write([2, '12'], '12 + 6 =', 418, 235, 34), write([2, '18'], '18', 528, 235, 34, 'y'),
    ring([3, 'Same'], 228, 235, 30, 24, 'y'), ring([3, 'Same'], 528, 235, 30, 24, 'y'),
    write([3, 'amount'], 'same amount', 300, 330, 36, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...paren3([1, 'multiply'], 100, 165),
    hop([1, 'only'], P3(100).three, P3(100).x, 138, 'r'),
    write([1, 'x'], '=', 300, 165, 40), write([1, 'x'], '3x + 2', 395, 165, 40, 'r'),
    cross([2, 'not'], 335, 142, 120, 46),
    ...paren3([2, 'multiplies'], 100, 300),
    hop([2, 'too,'], P3(100).three, P3(100).x, 272), hop([2, 'too,'], P3(100).three, P3(100).two, 272),
    write([2, "it's"], '=', 300, 300, 40, 'y'), write([2, '6'], '3x + 6', 395, 300, 40, 'y'),
  ],
]
