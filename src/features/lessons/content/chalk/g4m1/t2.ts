/** g4m1-t2's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, box, cells, arrow, cross, ring } from '../../../chalk'

type At = [number, string?]
// Colours: yellow = what the pieces make (the result), blue = the "× 10" step, white = the pieces, dim = labels.
const warn = (at: At): ChalkMark[] => [line(at, [[300, 25], [345, 100], [255, 100], [300, 25]], 'r'), write(at, '!', 300, 75, 40, 'r')]
const q = (ms: ChalkMark[]): ChalkMark[] => ms.map(m => ({ ...m, quick: true }))

/** A ten stick standing up: w × h, cut into 10 cubes. */
const stick = ([beat, at]: At, x: number, y: number, w: number, h: number, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat, at, c, d: `M${x} ${y} h${w} v${h} h${-w} Z` + Array.from({ length: 9 }, (_, i) => ` M${x} ${y + (h * (i + 1)) / 10} h${w}`).join('') })
/** A hundred flat: an s × s square cut 10 by 10. */
const flat = ([beat, at]: At, x: number, y: number, s: number, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat, at, c, w: 2.4, d: `M${x} ${y} h${s} v${s} h${-s} Z` + Array.from({ length: 9 }, (_, i) => ` M${x + (s * (i + 1)) / 10} ${y} v${s} M${x} ${y + (s * (i + 1)) / 10} h${s}`).join('') })

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // The digits look the same
  [
    ...q([...'440'].map((d, i) => write([0, 'Look'], d, 240 + 60 * i, 110, 70))),
    ring([0, '4'], 240, 112, 26, 42, 'w'), ring([0, '4'], 300, 112, 26, 42, 'w'),
    write([1, 'same'], 'same worth?', 300, 210, 30), cross([1, 'No'], 210, 190, 180, 42),
    write([2, 'more'], 'how much more?', 300, 300, 32),
  ],
  // The big idea
  [
    ...q(Array.from({ length: 10 }, (_, i) => box([0, 'Ten'], 462 + 24 * (i % 2), 150 + 24 * Math.floor(i / 2), 15, 15))),
    ...q([['hundreds', 130], ['tens', 320], ['ones', 480]].map(([t, x]) => write([0, 'place'], t as string, x as number, 90, 22, 'd'))),
    arrow([0, 'make'], [450, 205], [342, 205], 'b'),
    stick([0, 'next'], 310, 130, 20, 150, 'y'),
    arrow([0, 'each'], [298, 205], [217, 205], 'b'),
    flat([0, 'worth'], 55, 130, 150, 'y'),
    ...q([write([0, 'times'], '× 10', 401, 178, 26, 'b'), write([0, 'times'], '× 10', 257, 178, 26, 'b')]),
  ],
  // Ten ones make a ten
  [
    ...q(Array.from({ length: 10 }, (_, i) => box([0, '10'], 120 + 36 * i, 60, 26, 26))),
    write([0, 'cubes'], '10 ones', 540, 73, 22, 'd'),
    arrow([0, 'together'], [300, 105], [300, 160]),
    cells([1, 'ten'], 120, 175, 350, 30, 10, 'y'), write([1, 'ten'], '1 ten', 540, 190, 26, 'y'),
    write([1, 'worth'], '1 ten = 10 ones', 300, 290, 36),
  ],
  // Ten tens make a hundred
  [
    ...q(Array.from({ length: 10 }, (_, i) => stick([0, '10'], 80 + 22 * i, 60, 14, 120))),
    write([0, 'tens'], '10 tens', 186, 210, 22, 'd'),
    arrow([0, 'together'], [315, 120], [385, 120]),
    flat([1, 'hundred'], 400, 60, 120, 'y'), write([1, 'hundred'], '1 hundred', 460, 210, 22, 'y'),
    write([2, 'next'], '10 of a place = 1 of the next', 300, 300, 30),
  ],
  // Back to 440
  [
    ...q([['hundreds', 210], ['tens', 300], ['ones', 390]].map(([t, x]) => write([0, 'Back'], t as string, x as number, 50, 20, 'd'))),
    cells([0, 'Back'], 165, 70, 270, 70, 3),
    ...q([...'440'].map((d, i) => write([0, 'Back'], d, 210 + 90 * i, 105, 44))),
    ring([0, 'second'], 300, 107, 24, 30, 'w'), write([0, '40'], '40', 300, 190, 36),
    ring([1, 'first'], 210, 107, 24, 30, 'y'), write([1, '400'], '400', 210, 270, 40, 'y'),
    arrow([2, '10'], [285, 208], [232, 245], 'b'), write([2, '10'], '× 10', 330, 250, 30, 'b'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'TAKE'], '400 − 40', 230, 170, 36),
    write([2, '360'], '= 360', 370, 170, 36, 'r'), cross([2, '360'], 150, 145, 275, 50),
    write([2, '40s'], '40  40  40  40  40', 300, 245, 28), write([2, '40s'], '40  40  40  40  40', 300, 285, 28),
    write([2, 'groups'], '400 = 10 × 40', 300, 350, 34, 'y'),
  ],
]
