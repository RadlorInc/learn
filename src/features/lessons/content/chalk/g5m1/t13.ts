/** g5m1-t13's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, wash, cells, arrow, hop, cross, ring } from '../../../chalk'

type At = [number, string]
// The 68 kids as a tape, 6 px a kid (x 60 … 468), cut into teams of 17 (102 px each), labelled.
const teams = (at: At, y: number, n: number, c: 'w' | 'b' = 'w'): ChalkMark[] => [
  cells(at, 60, y, 102 * n, 50, n, c),
  ...Array.from({ length: Math.min(n, 3) }, (_, i) => ({ ...write(at, '17', 111 + 102 * i, y + 25, 26, c), quick: true })),
]

export const T13: (ChalkMark[] | undefined)[] = [
  undefined,
  // No facts for 17s
  [
    write([0, 'facts'], 'my facts:', 150, 50, 26, 'd'), write([0, '10'], '1 × 1 to 10 × 10', 150, 100, 30),
    write([0, '17s'], '17s ?', 440, 80, 40, 'r'),
    line([1, 'counting'], [[50, 270], [540, 270]]), write([1, 'counting'], '0', 60, 300, 24),
    hop([1, '17'], 60, 162, 270, 'b'), write([1, '17'], '17', 162, 300, 24, 'b'),
    hop([1, '34'], 162, 264, 270, 'b'), write([1, '34'], '34', 264, 300, 24, 'b'),
    hop([1, '51'], 264, 366, 270, 'b'), write([1, '51'], '51', 366, 300, 24, 'b'),
    hop([1, 'on'], 366, 468, 270, 'd'), write([1, 'on'], '...', 468, 300, 24, 'd'),
    write([1, 'slow'], 'slow...', 160, 360, 26, 'd'), write([1, 'hard'], 'hard to track', 430, 360, 26, 'r'),
  ],
  // The big idea
  [
    write([0, 'number'], '17', 100, 90, 40), arrow([0, 'nearest'], [140, 90], [210, 90], 'd'), write([0, 'ten'], '20', 250, 90, 40, 'y'),
    write([0, 'guess'], 'guess ?', 420, 90, 34, 'y'),
    write([1, 'Multiply'], 'multiply to check', 300, 170, 30, 'b'),
    box([1, 'group'], 100, 235, 120, 50, 'y'), write([1, 'group'], 'a group', 160, 260, 24, 'y'),
    arrow([1, 'fits'], [225, 260], [290, 260], 'y'),
    box([1, 'left'], 300, 230, 170, 60), write([1, 'left'], 'what is left', 385, 260, 24),
    write([1, 'small'], 'guess too small', 300, 345, 30, 'r'),
  ],
  // Make a guess
  [
    write([0, '17'], '17', 100, 60, 40), arrow([0, 'close'], [130, 60], [190, 60], 'd'), write([0, '20'], '20', 230, 60, 40, 'y'),
    write([0, 'guess'], 'guess with 20s', 420, 60, 28, 'y'),
    box([1, '68'], 60, 110, 408, 50), write([1, '68'], '68', 264, 135, 30),
    cells([1, '3'], 60, 175, 360, 45, 3, 'y'), ...[120, 240, 360].map(x => ({ ...write([1, '3'], '20', x, 197, 24, 'y'), quick: true })),
    write([1, '60'], '3 × 20 = 60', 190, 255, 30),
    box([1, '4'], 420, 175, 120, 45, 'r'), write([1, '80'], '4 × 20 = 80', 450, 255, 30, 'r'), cross([1, 'too'], 430, 182, 100, 31),
    write([2, 'guess'], 'guess: 3 teams', 300, 330, 36, 'y'), ring([2, 'teams'], 300, 330, 140, 30, 'y'),
  ],
  // Check the guess
  [
    box([0, 'check'], 60, 90, 408, 50), write([0, 'check'], '68', 500, 115, 30),
    ...teams([0, 'team'], 90, 3, 'b'), wash([0, 'size'], 60, 90, 306, 50, 'b'),
    write([0, '3'], '3 × 17 = 51', 200, 190, 34, 'b'),
    write([1, '68'], '68 − 51 = 17', 200, 260, 34), wash([1, 'kids'], 366, 90, 102, 50, 'y'), write([1, 'left'], '17 left', 417, 115, 24, 'y'),
  ],
  // One more team
  [
    ...teams([0, 'Wait'], 80, 4), write([0, '17'], '17 left', 417, 105, 24, 'y'), ring([0, 'whole'], 417, 105, 62, 36, 'y'),
    write([0, 'small'], '3 teams: too small', 260, 185, 28, 'r'),
    wash([1, 'Add'], 366, 80, 102, 50, 'b'), write([1, 'more'], '+ 1 team', 470, 185, 26, 'b'),
    write([1, '4'], '4 × 17 = 68', 200, 255, 36), write([1, 'no'], 'none left', 450, 255, 28, 'b'),
    write([2, '68'], '68 ÷ 17 = 4', 220, 335, 40, 'y'), write([2, 'teams'], '4 teams', 470, 335, 32, 'y'), ring([2, 'teams'], 470, 335, 70, 26, 'y'),
  ],
  // One thing not to do
  [
    line([0, 'mistake'], [[300, 30], [345, 105], [255, 105], [300, 30]], 'r'), write([0, 'mistake'], '!', 300, 80, 40, 'r'),
    write([1, 'stop'], '68 ÷ 17 = 3 and 17 left', 300, 170, 30, 'r'), ring([1, 'group'], 420, 170, 62, 24, 'y'),
    arrow([2, 'make'], [420, 196], [420, 240], 'b'), cross([2, 'more'], 273, 155, 24, 30),
    write([2, 'team'], '+ 1 team', 420, 265, 28, 'b'), write([2, 'team'], '68 ÷ 17 = 4', 300, 340, 40, 'y'),
  ],
]
