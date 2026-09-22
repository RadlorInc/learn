/** g4m1-t1's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, box, wash, ring, cross, person } from '../../../chalk'

type At = [number, string?]
// Colours: yellow = the part before the comma and its "thousand", blue = the last three digits, dim = labels, coral = the slip.
const warn = (at: At): ChalkMark[] => [line(at, [[300, 25], [345, 100], [255, 100], [300, 25]], 'r'), write(at, '!', 300, 75, 40, 'r')]

// 305,420 written big, one digit to a column: 3 0 5 at 130/190/250, the comma at 300, 4 2 0 at 350/410/470.
const X = [130, 190, 250, 350, 410, 470], COMMA = 300
const big = (at: At, y: number, left: ChalkColor = 'w', right: ChalkColor = 'w', s = 56): ChalkMark[] => [
  ...[...'305'].map((d, i) => ({ ...write(at, d, X[i], y, s, left), quick: true })),
  { ...write(at, ',', COMMA, y, s), quick: true },
  ...[...'420'].map((d, i) => ({ ...write(at, d, X[3 + i], y, s, right), quick: true })),
]
const under = (at: At, from: number, y: number, c: ChalkColor) => line(at, [[X[from] - 28, y], [X[from + 2] + 28, y]], c)

export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // Too many digits at once
  [
    ...big([0, 'Six'], 100),
    ...['three', 'zero', 'five', 'four', 'two', 'zero'].map((w, i) => ({ ...write([1, 'Three'], w, X[i], 160, 20, 'd'), quick: true })),
    write([2, 'how'], 'how many people?', 300, 240, 30, 'r'),
    ring([3, 'comma'], COMMA, 108, 16, 34, 'y'),
  ],
  // The big idea
  [
    ...big([0, 'Read'], 150),
    under([0, 'part'], 0, 188, 'y'),
    line([0, 'thousand'], [[COMMA, 180], [COMMA, 255]], 'y'), write([0, 'thousand'], 'thousand', COMMA, 285, 32, 'y'),
    under([0, 'last'], 3, 188, 'b'), write([0, 'three'], '3 digits', 410, 220, 24, 'b'),
  ],
  // Read the part before the comma
  [
    ...big([0, 'Cover'], 90),
    wash([0, 'after'], 318, 52, 186, 76, 'd'), box([0, 'after'], 318, 52, 186, 76, 'd'),
    under([0, '305'], 0, 128, 'y'),
    write([1, 'Three'], 'three hundred five', 190, 185, 26, 'y'),
    write([2, 'thousand'], 'thousand', 410, 185, 26, 'y'),
    box([2, 'Three'], 60, 160, 420, 50, 'y'),
  ],
  // Read the last three digits
  [
    ...big([0, 'Now'], 90, 'd'),
    under([0, '420'], 3, 128, 'b'),
    write([1, 'Four'], 'four hundred twenty', 410, 185, 26, 'b'),
    write([2, 'extra'], 'no extra word', 410, 240, 22, 'd'),
  ],
  // Put the two parts together
  [
    ...big([0, 'Put'], 80, 'y', 'b'),
    write([1, 'Three'], 'three hundred five thousand,', 300, 170, 30, 'y'),
    write([1, 'four'], 'four hundred twenty', 300, 225, 30, 'b'),
    ...[220, 300, 380].map(x => ({ ...person([2, 'people'], x, 360, 70), quick: true })),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'DROP'], '35,420', 180, 180, 44, 'r'), cross([1, 'zero'], 110, 152, 140, 56),
    ...[...'305'].map((d, i) => ({ ...write([2, '305'], d, 340 + 38 * i, 180, 44, 'y'), quick: true })),
    { ...write([2, '305'], ',', 446, 180, 44, 'y'), quick: true },
    ...[...'420'].map((d, i) => ({ ...write([2, '305'], d, 478 + 38 * i, 180, 44, 'y'), quick: true })),
    ring([2, 'zero'], 378, 182, 17, 30, 'y'), write([2, 'tens'], 'tens', 378, 240, 24, 'd'),
  ],
]
