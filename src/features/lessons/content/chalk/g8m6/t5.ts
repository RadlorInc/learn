/** g8m6-t5's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Same table grid as t4 (the SHARE table: grade 8 has 30 students); a share is worked out under it,
 *  yellow for the share she lands on, blue for the total she divides by, coral for the mix-up. */
import type { ChalkMark } from '../../../chalk'
import { write, line, ring, cross } from '../../../chalk'
import { frame, val, rowWash, colWash, colX, rowY, warn } from './t4'

const Y = 20   // table top (bottom at 195)

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // The bigger count can fool you
  [
    ...frame([0], Y),
    val([0, '15'], Y, 1, 0, '15'), val([0, '12,'], Y, 0, 0, '12'),
    val([1, '30'], Y, 1, 2, '30', 'b'), val([1, '20.'], Y, 0, 2, '20', 'b'),
    write([2, 'really'], '15 out of 30', 150, 260, 28), write([2, 'more'], '?', 300, 260, 34, 'b'),
    write([2, 'more'], '12 out of 20', 450, 260, 28),
    write([2, 'alone'], 'the counts alone cannot tell', 300, 335, 28, 'r'),
  ],
  // The big idea: a count over its own group's total
  [
    write([0, 'count'], 'count', 300, 90, 34),
    line([0, 'by'], [[210, 125], [390, 125]]),
    write([0, 'group,'], 'its own group total', 300, 165, 34, 'b'),
    write([0, 'different'], '12 ÷ 20', 170, 270, 32), write([0, 'different'], '15 ÷ 30', 430, 270, 32),
    write([0, 'fairly'], 'now they compare fairly', 300, 345, 30, 'y'),
  ],
  // Grade 7's share
  [
    ...frame([0], Y),
    rowWash([0, 'grade'], Y, 0, 'b'),
    val([0, '12'], Y, 0, 0, '12'), val([0, '20'], Y, 0, 2, '20'),
    write([1, 'Divide'], '12 ÷ 20', 200, 260, 34), write([1, '0.6.'], '= 0.6', 330, 260, 34),
    write([2, '100,'], '60 out of 100', 200, 335, 30), write([2, 'so'], '= 60%', 360, 335, 36, 'y'),
  ],
  // Grade 8's share
  [
    ...frame([0], Y),
    rowWash([0, 'grade'], Y, 1, 'b'),
    val([0, '15'], Y, 1, 0, '15'), val([0, '30'], Y, 1, 2, '30'),
    write([1, 'Divide'], '15 ÷ 30', 180, 245, 34), write([1, '0.5,'], '= 0.5', 310, 245, 34), write([1, '50%.'], '= 50%', 430, 245, 34),
    write([2, 'more?'], 'grade 7: 60%', 170, 315, 28), write([2, 'more?'], 'grade 8: 50%', 430, 315, 28),
    ring([2, '7,'], 170, 315, 100, 28, 'y'),
    write([2, 'smaller'], 'the smaller count, the bigger share', 300, 370, 24, 'y'),
  ],
  // Ask: out of whom?
  [
    ...frame([0], Y),
    colWash([0, 'like'], Y, 0, 'b'),
    val([0, 'like'], Y, 0, 0, '12'), val([0, 'like'], Y, 1, 0, '15'),
    val([1, '27.'], Y, 2, 0, '27', 'b'), ring([1, '27.'], colX(0), rowY(Y, 2), 34, 20, 'b'),
    write([2, 'out'], '12 ÷ 27', 230, 285, 36), write([2, '4/9.'], '= 4/9', 355, 285, 36, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'ALL'], '12 ÷ 50 = 24%', 300, 160, 36), cross([1, '50'], 175, 120, 250, 80),
    write([2, 'Grade'], 'of grade 7 students: out of 20', 300, 245, 28, 'b'),
    write([2, '60%.'], '12 ÷ 20 = 60%', 300, 315, 36, 'y'),
  ],
]
