/** g6m4-t6's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  True proportion: the $25 price is 450 wide (60..510), so 8% of it, the $2 tax, is 36 (510..546).
 *  Colours: white the price, blue the tax, yellow what you pay, coral the mix-up, dim labels. */
import type { ChalkMark } from '../../../chalk'
import { write, box, wash, arrow, span, cross, ring } from '../../../chalk'
import { warn } from '../g3m1/t1'

type At = [number, string?]
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
/** The price bar, 60..510 at y..y+h. */
const price = (at: At, y: number, h = 60): ChalkMark => box(at, 60, y, 450, h)
/** The 8% tax piece stuck on the end of the price bar. */
const tax = (at: At, y: number, h = 60): ChalkMark[] => [wash(at, 510, y, 36, h, 'b'), box(at, 510, y, 36, h, 'b')]
/** A quarter: a coin with 25¢ in it. */
const quarter = (at: At, x: number, y: number): ChalkMark[] => [
  q({ beat: at[0], at: at[1], c: 'b', d: `M${x - 26} ${y} a26 26 0 1 0 52 0 a26 26 0 1 0 -52 0` }), q(write(at, '25¢', x, y, 20, 'b')),
]

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // The tag is not the total
  [
    { beat: 0, at: 'tag', c: 'd', d: 'M110 40 H330 V120 H110 L75 80 Z' }, q(write([0, 'tag'], 'o', 98, 80, 18, 'd')),
    write([0, '$25'], '$25', 215, 80, 44), write([0, 'pay'], 'you pay = ?', 460, 80, 30, 'y'),
    price([1, 'store'], 190), write([1, 'store'], '$25', 285, 220, 30),
    ...tax([1, '8%'], 190), write([1, '8%'], '8%', 528, 170, 24, 'b'), write([1, 'top'], 'on top', 528, 275, 22, 'b'),
    write([2, 'dollars'], '8% = $ ?', 300, 345, 34, 'b'),
  ],
  // The big idea: tax first, then add it on
  [
    { ...price([0, 'Find'], 150), quick: true }, write([0, 'Find'], 'price', 285, 180, 26, 'd'),
    ...tax([0, 'tax'], 40), write([0, 'tax'], 'tax', 470, 70, 26, 'b'),
    arrow([0, 'add'], [528, 105], [528, 145], 'b'), ...tax([0, 'price'], 150),
    span([0, 'pay'], 60, 546, 250, 'y'), write([0, 'more'], 'you pay more', 300, 285, 30, 'y'),
    span([0, 'tag'], 60, 510, 340, 'd'), write([0, 'tag'], 'the tag', 285, 372, 22, 'd'),
  ],
  // Find 1% first
  [
    price([0, '$25'], 60), write([0, '$25'], '$25', 285, 90, 32),
    span([0, '100%'], 60, 510, 145), write([0, '100%'], '100%', 285, 175, 26, 'd'),
    write([1, '1%'], '1% = ?', 300, 230, 30, 'b'),
    write([1, '25'], '25 ÷ 100 =', 250, 290, 34), write([1, '$0.25'], '$0.25', 400, 290, 34, 'b'),
    ...quarter([1, 'quarter'], 180, 355), write([1, 'quarter'], 'one quarter', 330, 355, 28, 'b'),
  ],
  // Find the tax
  [
    write([0, '8%'], '8%', 45, 60, 26, 'd'),
    ...[110, 170, 230, 290, 350, 410, 470, 530].flatMap(x => quarter([0, 'quarters'], x, 60)),
    write([1, '8'], '8 × $0.25 =', 250, 160, 36), write([1, '$2'], '$2', 380, 160, 36, 'b'),
    price([1, 'tax'], 250), q(write([1, 'tax'], '$25', 285, 280, 30)),
    ...tax([1, 'tax'], 250), write([1, 'tax'], 'tax $2', 520, 335, 26, 'b'),
  ],
  // Add it on
  [
    { ...price([0], 60), quick: true }, q(write([0], '$25', 285, 90, 32)),
    ...tax([0, 'tax'], 60), write([0, 'tax'], '$2', 528, 150, 26, 'b'),
    write([1, '$25'], '$25 + $2 =', 260, 225, 38), write([1, '$27'], '$27', 410, 225, 38, 'y'),
    span([1, '$27'], 60, 546, 270, 'y'),
    write([1, 'pay'], 'you pay $27', 300, 335, 36, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, '8%'], '$25 + $8 = $33', 300, 165, 36, 'r'), cross([1, 'mean'], 170, 140, 260, 50),
    write([2, 'only'], '8% of $25 = $2', 300, 250, 32, 'b'),
    write([2, 'pay'], '$25 + $2 =', 255, 330, 38, 'y'), write([2, '$27'], '$27', 420, 330, 38, 'y'), ring([2, '$27'], 420, 330, 44, 28, 'y'),
  ],
]
