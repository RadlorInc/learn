/** g6m7-t2's chalkboards: index = screen index (0 is Screen 1, which has none). Seedlings 7, 3, 9, 4, 6 inches, drawn
 * 18 px an inch. Yellow = the middle, blue = what points at a spot, coral = the slip, dim ✕ = crossed off an end. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, box, arrow, cross, ring, span } from '../../../chalk'
import { warn } from '../g3m1/t1'

type At = [number, string?]
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
const X5 = [180, 240, 300, 360, 420]
/** A row of numbers, one per x, all at one word. */
const nums = (at: At, vs: number[], xs: number[], y: number, s = 36, c: ChalkColor = 'w'): ChalkMark[] =>
  vs.map((v, i) => q(write(at, String(v), xs[i], y, s, c)))
/** A seedling as a bar, `v` inches at 18 px an inch, standing on `base`. */
const bar = (at: At, x: number, v: number, base: number, c: ChalkColor = 'w') => box(at, x - 20, base - v * 18, 40, v * 18, c)
/** Crossed off an end: one slash, so the number still reads. */
const off = (at: At, x: number, y: number) => line(at, [[x - 17, y + 19], [x + 17, y - 19]], 'd', 3)

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // The middle spot is not the middle
  [
    ...nums([0], [7, 3, 9, 4, 6], X5, 60),
    arrow([0, 'spot'], [300, 130], [300, 92], 'b'), write([0, 'spot'], 'middle spot', 300, 150, 22, 'b'),
    ring([0, '9'], 300, 60, 24, 26, 'b'),
    ...[7, 3, 9, 4, 6].map((v, i) => q(bar([1, 'seedling'], X5[i], v, 370))),
    write([1, 'tallest'], 'tallest', 300, 190, 22, 'd'),
    write([1, 'middle'], 'middle = 9?', 510, 200, 24, 'b'), write([1, 'No'], 'no', 510, 240, 26, 'r'),
    write([2, 'jumbled'], 'jumbled', 520, 60, 26, 'd'),
  ],
  // The big idea: in order, the middle one splits them in half
  [
    ...nums([0, 'order'], [3, 4, 6, 7, 9], X5, 70),
    ...[3, 4, 6, 7, 9].map((v, i) => q(bar([0, 'order'], X5[i], v, 320))),
    arrow([0, 'order'], [150, 110], [450, 110], 'd'),
    ring([0, 'middle'], 300, 70, 26, 28, 'y'), box([0, 'middle'], 280, 212, 40, 108, 'y'),
    span([0, 'half'], 160, 260, 355, 'b'), span([0, 'half'], 340, 440, 355, 'b'),
  ],
  // Line them up
  [
    ...nums([0, 'job'], [7, 3, 9, 4, 6], X5, 50, 30, 'd'),
    arrow([0, 'sort'], [300, 76], [300, 112], 'd'), write([0, 'sort'], 'sort', 350, 94, 22, 'd'),
    ...[3, 4, 6, 7, 9].flatMap((v, i) => [write([1, String(v)], String(v), X5[i], 150, 36), bar([1, String(v)], X5[i], v, 370)]),
  ],
  // Find the middle
  [
    ...nums([0, 'Now'], [3, 4, 6, 7, 9], [140, 220, 300, 380, 460], 110, 44),
    arrow([0, 'end'], [90, 110], [116, 110], 'd'), arrow([0, 'end'], [510, 110], [484, 110], 'd'),
    off([1, '3'], 140, 110), off([1, '9'], 460, 110), off([1, '4'], 220, 110), off([1, '7'], 380, 110),
    ring([2, '6'], 300, 110, 30, 34, 'y'), write([2, 'inches'], 'middle: 6 inches', 300, 230, 34, 'y'),
  ],
  // Two in the middle: 6 and 7 share it, halfway is 6.5
  [
    ...nums([0, 'What'], [3, 4, 6, 7, 9], [100, 180, 260, 340, 420], 70),
    write([1, '10'], '10', 500, 70, 36, 'b'),
    off([2, 'Now'], 100, 70), off([2, 'Now'], 500, 70), off([2, 'Now'], 180, 70), off([2, 'Now'], 420, 70),
    ring([2, '6'], 260, 70, 26, 28, 'b'), ring([2, '7'], 340, 70, 26, 28, 'b'),
    q(line([3, 'Halfway'], [[160, 260], [440, 260]])),
    q({ beat: 3, at: 'Halfway', d: 'M180 250 v20 M420 250 v20' }),
    q(write([3, 'Halfway'], '6', 180, 295, 30)), q(write([3, 'Halfway'], '7', 420, 295, 30)),
    span([3, 'between'], 180, 300, 340, 'b'), span([3, 'between'], 300, 420, 340, 'b'),
    line([3, '6.5'], [[300, 246], [300, 274]], 'y', 4), write([3, '6.5'], '6.5', 300, 214, 36, 'y'),
  ],
  // One thing not to do: the middle spot of a jumbled list
  [
    ...warn([0, 'mix']),
    write([1, 'grab'], '7, 3, 9, 4, 6', 230, 180, 34), arrow([1, 'grab'], [356, 180], [404, 180], 'd'),
    write([1, '9'], '9', 440, 180, 38, 'r'), cross([1, '9'], 418, 156, 44, 48),
    write([2, 'Sort'], '3, 4, 6, 7, 9', 230, 290, 34), arrow([2, 'Sort'], [356, 290], [404, 290], 'd'),
    write([2, '6'], '6', 440, 290, 38, 'y'), ring([2, '6'], 440, 290, 26, 28, 'y'),
  ],
]
