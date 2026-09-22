/** g5m2-t7's chalkboards: index = screen index (0 is Screen 1, which has none). A mile is 440 wide, so a fourth is 110 and a half 220. */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, cells, cross, ring, span, ticks } from '../../../chalk'
import { q, fr, row, crossRow, shade, warn, type At, type Tok } from './t5'

const X = 100, M = 440
/** Max's run: 3 fourths, and its label on the right. */
const max = (at: At, y: number, lab: At = at): ChalkMark[] => [
  q(write(at, 'Max', 50, y + 25, 26, 'd')), cells(at, X, y, (3 * M) / 4, 50, 3), shade(at, X, y, (3 * M) / 4, 50, 1, 1),
  ...row([[lab, ['3', '4']], [lab, 'mile']], 500, y + 25, 26)]
/** Lee's run: one half, no cuts yet. */
const lee = (at: At, y: number, lab: At | null = at): ChalkMark[] => [
  q(write(at, 'Lee', 50, y + 25, 26, 'd')), box(at, X, y, M / 2, 50), shade(at, X, y, M / 2, 50, 1, 1),
  ...(lab ? row([[lab, ['1', '2']], [lab, 'mile']], 390, y + 25, 26) : [])]

export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // Add or take away?
  [
    ...fr([0, 'numbers'], '3', '4', 220, 80, 44), ...fr([0, 'numbers'], '1', '2', 380, 80, 44),
    write([0, 'says'], '+  or  −  ?', 300, 175, 34, 'd'),
    ...row([[[1, 'Add'], ['3', '4']], [[1, 'Add'], '+'], [[1, 'Add'], ['1', '2']], [[1, 'together'], '=', 'd'], [[1, 'together'], 'how far together', 'd']], 330, 265, 30),
    write([1, 'No'], 'no', 80, 265, 32, 'r'),
    write([2, 'farther'], 'how much farther?', 300, 355, 34, 'y'),
  ],
  // The big idea: bars, then together or the gap
  [
    box([0, 'bars'], 60, 60, 180, 44), shade([0, 'bars'], 60, 60, 180, 44, 1, 1), box([0, 'bars'], 360, 60, 120, 44), shade([0, 'bars'], 360, 60, 120, 44, 1, 1),
    box([0, 'together'], 30, 200, 180, 44), box([0, 'together'], 210, 200, 120, 44), shade([0, 'together'], 30, 200, 300, 44, 1, 1),
    span([0, 'together'], 30, 330, 170, 'y'), write([0, 'together'], 'together', 180, 290, 28, 'y'),
    box([0, 'gap'], 380, 175, 180, 44), shade([0, 'gap'], 380, 175, 180, 44, 1, 1), box([0, 'gap'], 380, 230, 120, 44), shade([0, 'gap'], 380, 230, 120, 44, 1, 1),
    span([0, 'gap'], 500, 560, 300, 'y'), write([0, 'gap'], 'the gap', 470, 345, 28, 'y'),
  ],
  // Draw it
  [
    ticks([0, 'draw'], X, 330, M, 4, 12, 'd'), write([0, 'draw'], '0', X, 368, 24, 'd'), write([0, 'draw'], '1 mile', X + M, 368, 24, 'd'),
    ...max([1, "Max's"], 70, [1, 'mile']),
    ...lee([1, "Lee's"], 170, [1, '1/2']),
    q(line([2, 'start'], [[X, 40], [X, 250]], 'y', 2.5)), write([2, 'same'], 'same start', X, 275, 24, 'y'),
  ],
  // Find the gap
  [
    ...max([0, 'Now'], 70), ...lee([0, 'Now'], 170, null),
    q(line([0, 'out'], [[X + M / 2, 60], [X + M / 2, 235]], 'd', 2)), ring([0, 'out'], X + (5 * M) / 8, 95, 70, 38, 'y'),
    span([1, 'farther'], X + M / 2, X + (3 * M) / 4, 260, 'y'), write([1, 'farther'], 'how much farther', 380, 300, 26, 'y'),
    ...row([[[2, 'away'], 'take away:'], [[2, '3/4'], ['3', '4']], [[2, '3/4'], '−'], [[2, '1/2'], ['1', '2']]], 300, 355, 30),
  ],
  // Work it out: 1/2 becomes 2/4
  [
    ...max([0, 'Make'], 60), ...lee([0, 'Make'], 160, null),
    q(line([0, 'same'], [[X + M / 4, 160], [X + M / 4, 210]])), ...row([[[0, '1/2'], ['1', '2']], [[0, 'same'], '='], [[0, '2/4'], ['2', '4']]], 495, 185, 26),
    box([1, 'leaves'], X + M / 2, 160, M / 4, 50, 'y'), shade([1, 'leaves'], X + M / 2, 160, M / 4, 50, 1, 1, 0, 'y'),
    ...row([[[1, '3'], ['3', '4']], [[1, 'take'], '−'], [[1, '2'], ['2', '4']], [[1, 'leaves'], '=', 'y'], [[1, '1'], ['1', '4'], 'y']], 300, 280, 32),
    ...row([[[2, '1/4'], ['1', '4'], 'y'], [[2, 'farther'], 'mile farther', 'y']], 300, 355, 30),
  ],
  // One thing not to do: adding just because there are two numbers
  (() => {
    const bad: Tok[] = [[[1, 'ADD'], ['3', '4'], 'r'], [[1, 'ADD'], '+', 'r'], [[1, 'ADD'], ['1', '2'], 'r']]
    return [
      ...warn([0, 'mix']),
      write([1, "Don't"], 'how much farther?', 300, 140, 28, 'd'),
      ...row(bad, 170, 215, 34), crossRow([1, 'numbers'], bad, 170, 215, 0, 2, 34),
      write([1, 'together'], '= together', 320, 215, 28, 'd'),
      write([2, 'gap'], 'farther = the gap', 300, 290, 28, 'y'),
      ...row([[[2, 'take'], ['3', '4'], 'y'], [[2, 'take'], '−', 'y'], [[2, 'take'], ['1', '2'], 'y']], 300, 350, 30),
    ]
  })(),
]
