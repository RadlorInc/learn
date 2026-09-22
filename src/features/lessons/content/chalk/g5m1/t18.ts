/** g5m1-t18's chalkboards: index = screen index (0 is Screen 1, which has none). Red marbles are coral, green ones blue. */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, wash, arrow, cross, ring } from '../../../chalk'
import { dots, row, q, paren, warn } from './t17'

const B4 = [20, 165, 310, 455]          // four bags across, 130 wide
const L4 = [15, 85, 155, 225]           // the warning board: four small bags each side, 62 wide
const R4 = [312, 381, 450, 519]

export const T18: (ChalkMark[] | undefined)[] = [
  undefined,
  // Numbers alone are not a story
  [
    write([0], '4 × (6 + 3)', 300, 70, 44),
    q(arrow([0, '4'], [190, 98], [150, 145], 'd')), write([0, '4'], '4 what?', 150, 170, 26, 'y'),
    q(arrow([0, '6'], [300, 98], [300, 145], 'd')), write([0, '6'], '6 what?', 300, 170, 26, 'r'),
    q(arrow([0, '3'], [388, 98], [450, 145], 'd')), write([0, '3'], '3 what?', 450, 170, 26, 'b'),
    ring([0, '×'], 234, 70, 16, 24, 'w'), ring([0, '×'], 344, 70, 16, 24, 'w'), write([0, 'do'], 'what do × and + do?', 300, 230, 26, 'd'),
    write([1, 'say'], '?', 300, 285, 44, 'r'),
    write([2, 'job'], 'every part gets a job', 300, 350, 30, 'y'),
  ],
  // The big idea: every part a job, the ( ) part first
  [
    write([0, 'Give'], '4 × (6 + 3)', 300, 80, 44),
    ...[190, 300, 388].map(x => q(line([0, 'number'], [[x - 10, 118], [x + 10, 118]], 'y'))),
    q(ring([0, 'sign'], 234, 80, 16, 24, 'w')), ring([0, 'sign'], 344, 80, 16, 24, 'w'),
    write([0, 'job'], 'every part: a job', 160, 170, 26, 'd'),
    wash([0, 'part'], 262, 52, 164, 56, 'y'), box([0, 'part'], 262, 52, 164, 56, 'y'),
    arrow([0, 'first'], [344, 114], [330, 250], 'y'), write([0, 'first'], '6 + 3 first', 330, 285, 32, 'y'),
  ],
  // Start with the ( )
  [
    paren([0, 'part'], 215, 90, 90, true), paren([0, 'part'], 385, 90, 90, false),
    write([0, 'first'], 'first', 300, 25, 24, 'y'), write([0, 'thing'], 'one thing', 300, 165, 26, 'd'),
    write([1, '6'], '6 + 3', 300, 225, 40),
    box([1, 'bag'], 230, 50, 140, 80),
    dots([1, 'red'], row(250, 75, 6, 20), 7, 'r'), write([1, 'red'], '6 red', 120, 90, 26, 'r'),
    dots([1, 'green'], row(280, 105, 3, 20), 7, 'b'), write([1, 'green'], '3 green', 480, 90, 26, 'b'),
  ],
  // Then the 4 ×
  [
    write([0, '4'], '4 ×', 80, 75, 44, 'y'), write([0, 'means'], '(6 + 3)', 220, 75, 44),
    q(box([0, 'bag'], 340, 35, 220, 80)), q(dots([0, 'bag'], row(375, 60, 6, 24), 8, 'r')), dots([0, 'bag'], row(415, 92, 3, 24), 8, 'b'),
    ...B4.map(x => q(box([1, 'bags'], x, 160, 130, 70))),
    dots([1, 'red'], B4.flatMap(x => row(x + 18, 185, 6, 19)), 6, 'r'),
    dots([1, 'green'], B4.flatMap(x => row(x + 46, 212, 3, 19)), 6, 'b'),
    write([1, 'green'], '4 bags, each 6 red and 3 green', 300, 290, 26, 'd'),
  ],
  // Solve the story
  [
    write([0, 'story'], 'story', 90, 40, 28, 'y'), write([0, 'match'], '?', 180, 40, 32, 'd'),
    write([0, 'board'], '4 × (6 + 3)', 330, 40, 32),
    q(box([1, 'bag'], 30, 80, 170, 70)), q(dots([1, 'bag'], row(50, 105, 6, 22), 7, 'r')), dots([1, 'bag'], row(83, 130, 3, 22), 7, 'b'),
    write([1, '6'], '6 + 3 = 9', 370, 115, 36), ring([1, '9'], 442, 115, 20, 24, 'y'),
    ...B4.map(x => q(box([1, 'bags'], x + 10, 175, 120, 50))),
    ...B4.map(x => q(write([1, 'bags'], '9', x + 70, 200, 26, 'y'))),
    write([1, 'have'], '4 × 9 = 36', 300, 280, 40), ring([1, '36'], 380, 280, 28, 26, 'y'),
    write([2, '36'], '= 36', 490, 40, 32, 'y'),
    write([2, 'match'], 'they match', 300, 355, 32, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'first'], '× first', 280, 150, 32, 'r'), cross([1, 'first'], 350, 132, 36, 36),
    ...L4.map(x => q(box([2, 'bags'], x, 185, 62, 50))),
    dots([2, 'red'], L4.flatMap(x => [...row(x + 17, 200, 3, 14), ...row(x + 17, 220, 3, 14)]), 5, 'r'),
    dots([2, 'green'], row(125, 258, 3, 25), 7, 'b'),
    write([2, 'is'], '4 × 6 + 3', 150, 305, 32, 'r'),
    write([2, 'put'], '4 × (6 + 3)', 452, 305, 32, 'y'),
    ...R4.map(x => q(box([2, 'every'], x, 185, 62, 50))),
    q(dots([2, 'every'], R4.flatMap(x => [...row(x + 17, 197, 3, 14), ...row(x + 17, 211, 3, 14)]), 5, 'r')),
    dots([2, 'every'], R4.flatMap(x => row(x + 17, 225, 3, 14)), 5, 'b'),
  ],
]
