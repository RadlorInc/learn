/** g6m7-t3's chalkboards: index = screen index (0 is Screen 1, which has none). The pets line plot, 12 kids, one ✕ each:
 * 3 above 0, 5 above 1, 2 above 2, 1 above 3, 1 above 4. Yellow = the tallest stack and the number under it,
 * blue = one kid's ✕, coral = the slip. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, box, arrow, cross, ring, person } from '../../../chalk'
import { warn } from '../g3m1/t1'

type At = [number, string?]
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
const PETS = [3, 5, 2, 1, 1]
const XS = [80, 150, 220, 290, 360]
const BASE = 300
/** The centre of the k-th ✕ (from the bottom) in column i. */
const yAt = (k: number) => BASE - 20 - k * 32
/** One ✕, drawn as two strokes. */
const ex = (at: At, i: number, k: number, c: ChalkColor = 'w') => q(cross(at, XS[i] - 11, yAt(k) - 11, 22, 22, c))
/** The line and the numbers under it. */
const axis = (at: At): ChalkMark[] => [
  q(line(at, [[50, BASE], [400, BASE]], 'd')),
  ...XS.map((x, i) => q(write(at, String(i), x, BASE + 30, 26, 'd'))),
  q(write(at, 'pets', 440, BASE + 30, 22, 'd')),
]
/** Every ✕ on the plot. */
const allEx = (at: At, skip?: [number, number]): ChalkMark[] =>
  PETS.flatMap((n, i) => Array.from({ length: n }, (_, k) => k).filter(k => !(skip && skip[0] === i && skip[1] === k)).map(k => ex(at, i, k)))
const plot = (at: At) => [...axis(at), ...allEx(at)]
/** The box round the tallest stack, the one above 1. */
const tallest = (at: At) => box(at, 130, 130, 40, 165, 'y')

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // Adding them up does not help
  [
    ...plot([0]),
    write([0, 'add'], 'add up all the pets', 300, 50, 24, 'd'),
    write([1, 'most'], 'most often?', 510, 180, 22, 'b'), write([1, 'No'], 'no', 510, 220, 26, 'r'),
    write([2, 'all'], '= 16 pets in all', 300, 90, 28),
  ],
  // The big idea: the tallest stack, and the number under it
  [
    ...plot([0]),
    tallest([0, 'tallest']),
    ring([0, 'under'], 150, BASE + 30, 18, 18, 'y'),
  ],
  // Build the stacks
  [
    ...axis([0, 'picture']),
    person([1, 'kid'], 510, 260, 90, 0.25, 'b'),
    ex([1, 'one'], 0, 0, 'b'),
    ...allEx([2, 'stacks'], [0, 0]),
  ],
  // Find the tallest stack
  [
    ...plot([0]),
    ...PETS.map((n, i) => q(write([1, String(n)], String(n), XS[i], yAt(n - 1) - 40, 24, 'd'))),
    tallest([2, 'tallest']),
  ],
  // Read the number under it
  [
    ...plot([0]), q(tallest([0])),
    arrow([0, 'under'], [230, 372], [170, 340], 'd'),
    ring([1, '1'], 150, BASE + 30, 18, 18, 'y'),
    write([2, 'common'], 'most common: 1 pet', 300, 60, 30, 'y'),
  ],
  // One thing not to do: the height of the stack is not the answer
  [
    ...warn([0, 'mix']),
    write([1, 'answer'], 'most common: 5', 270, 170, 30, 'r'), cross([1, 'stack'], 400, 153, 34, 34),
    write([2, 'kids'], '5 is how many kids', 300, 245, 26, 'd'),
    write([2, 'pet'], 'most common: 1 pet', 300, 320, 32, 'y'),
  ],
]
