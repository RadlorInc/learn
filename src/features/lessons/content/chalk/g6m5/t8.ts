/** g6m5-t8's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  Colours: white = the tape and the working, blue = the "÷ 3" done to both sides, yellow = the result (x = 8), coral = the mistake. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, cells, span, ring, arrow, cross } from '../../../chalk'
import { q, warn } from '../g5m1/t17'

type At = [beat: number, at?: string]

/** Three equal tickets as a tape from x0, each cell `w` wide, with a label written in each. */
const tape3 = (at: At, x0: number, y: number, w: number, h: number, label: string, c: ChalkColor = 'w'): ChalkMark[] => [
  q(cells(at, x0, y, w * 3, h, 3)),
  ...[0, 1, 2].map(i => ({ ...write(at, label, x0 + w * i + w / 2, y + h / 2, 34, c), quick: i < 2 })),
]
const check = (at: At, x: number, y: number): ChalkMark => line(at, [[x - 18, y], [x - 4, y + 16], [x + 22, y - 18]], 'y', 5)

export const T8: (ChalkMark[] | undefined)[] = [
  undefined,
  // Taking away will not work
  [
    q(cells([0, 'tickets,'], 120, 40, 360, 64, 3)),
    ...[180, 300, 420].map((x, i) => ({ ...write([0, 'x'], 'x', x, 70, 36), quick: i < 2 })),
    span([0, '24'], 120, 480, 135), write([0, '24'], '24 dollars', 300, 170, 30),
    write([1, 'taking'], 'take away?', 300, 240, 32, 'd'), cross([1, "won't"], 215, 220, 170, 40),
    ring([2, 'one'], 180, 72, 48, 30, 'y'), write([2, 'x?'], 'one x = ?', 300, 330, 36, 'y'),
  ],
  // The big idea: 3x is three equal parts; ÷ 3 on both sides leaves one x
  [
    write([0, '3x'], '3x', 100, 100, 48),
    write([0, 'parts,'], '=', 160, 100, 40, 'd'), ...tape3([0, 'parts,'], 190, 70, 120, 60, 'x'),
    write([0, 'divide'], '÷ 3', 100, 175, 34, 'b'), write([0, 'sides'], '÷ 3', 370, 175, 34, 'b'),
    ring([0, 'one'], 250, 100, 52, 34, 'y'), arrow([0, 'x.'], [250, 285], [250, 145], 'y'), write([0, 'x.'], 'one x', 250, 315, 32, 'y'),
  ],
  // Three equal parts
  [
    ...tape3([0, 'Draw'], 120, 40, 120, 64, 'x'),
    span([0, '24.'], 120, 480, 135), write([0, '24.'], '24', 300, 168, 32),
    write([1, 'groups'], '3 groups of x', 230, 240, 30, 'd'), write([1, '3x.'], '→  3x', 410, 240, 34),
    q(write([2, '3x'], '3x', 245, 325, 40, 'y')), write([2, '3x'], '=', 300, 325, 40, 'y'), write([2, '24.'], '24', 355, 325, 40, 'y'),
  ],
  // Divide both sides by 3
  [
    ...tape3([0, 'Split'], 120, 30, 110, 56, 'x'), write([0, 'Split'], '= 24', 510, 58, 32),
    q(write([0, 'Split'], '3x', 245, 170, 38)), q(write([0, 'Split'], '=', 300, 170, 38)), write([0, 'Split'], '24', 355, 170, 38),
    write([0, 'both'], '÷ 3', 245, 222, 34, 'b'), write([0, 'sides'], '÷ 3', 355, 222, 34, 'b'),
    line([0, 'parts.'], [[190, 252], [410, 252]], 'd', 2.5),
    write([1, 'x.'], 'x', 245, 295, 38),
    write([2, '8.'], '8', 355, 295, 38, 'y'),
    ...[175, 285, 395].map((x, i) => ({ ...write([2, '8.'], '8', x, 112, 26, 'y'), quick: i < 2 })),
    write([3, 'So'], '=', 300, 295, 38), ring([3, '8.'], 300, 295, 90, 30, 'y'),
  ],
  // Check it
  [
    q(write([0, 'Does'], '3x', 245, 60, 38)), q(write([0, 'Does'], '=', 300, 60, 38)), write([0, 'Does'], '24', 355, 60, 38),
    write([0, 'back'], '8', 268, 150, 38, 'y'), arrow([0, 'x'], [266, 124], [264, 88], 'y'),
    write([1, '3'], '3 ×', 212, 150, 38),
    q(write([1, '24,'], '=', 300, 150, 38)), write([1, '24,'], '24', 355, 150, 38),
    check([1, 'matches.'], 430, 150),
    ...tape3([2, 'ticket'], 120, 215, 120, 56, '8'), span([2, 'ticket'], 120, 480, 295),
    write([2, 'dollars.'], '1 ticket = 8 dollars', 300, 345, 32, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    q(write([1, 'subtract'], 'x', 140, 175, 40, 'r')), q(write([1, 'subtract'], '=', 180, 175, 40, 'r')), write([1, 'subtract'], '24 − 3', 265, 175, 40, 'r'),
    write([2, '21.'], '= 21', 385, 175, 40, 'r'), cross([2, '21.'], 200, 150, 230, 50),
    q(write([3, 'divide'], 'x', 140, 280, 40, 'y')), q(write([3, 'divide'], '=', 180, 280, 40, 'y')), write([3, 'divide'], '24 ÷ 3', 265, 280, 40, 'y'),
    write([3, '8.'], '= 8', 375, 280, 40, 'y'),
  ],
]
