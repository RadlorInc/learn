/** g7m1-t5's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The map scale as a two-row table (inches over miles); yellow is what the numbers are multiplied by and the answer,
 *  blue the check, coral the mix-up. */
import type { ChalkMark, ChalkColor } from '../../../chalk'
import { write, line, hop, cross, ring } from '../../../chalk'

type At = [number, string?]
export const warn = (at: At): ChalkMark[] => [line(at, [[300, 22], [340, 90], [260, 90], [300, 22]], 'r'), write(at, '!', 300, 68, 36, 'r')]

/** The scale table, top at y = 100: inches row 100–160, miles row 160–220; columns at x = 260 and 380. */
const table = (at: At, miles2 = '?'): ChalkMark[] => [
  { ...line(at, [[70, 100], [440, 100], [440, 220], [70, 220], [70, 100]], 'd'), quick: true },
  { ...line(at, [[70, 160], [440, 160]], 'd'), quick: true },
  { ...line(at, [[200, 100], [200, 220]], 'd'), quick: true },
  { ...line(at, [[320, 100], [320, 220]], 'd'), quick: true },
  { ...write(at, 'inches', 135, 130, 24, 'd'), quick: true },
  { ...write(at, 'miles', 135, 190, 24, 'd'), quick: true },
  { ...write(at, '2', 260, 130, 32), quick: true }, { ...write(at, '6', 380, 130, 32), quick: true },
  { ...write(at, '15', 260, 190, 32), quick: true }, ...(miles2 ? [{ ...write(at, miles2, 380, 190, 32), quick: true }] : []),
]
/** A hop under the miles row, from x1 to x2 (the mirror of `hop`). */
const dip = ([beat, at]: At, x1: number, x2: number, y: number, c: ChalkColor = 'y'): ChalkMark =>
  ({ beat, at, c, d: `M${x1} ${y} Q${(x1 + x2) / 2} ${y + Math.abs(x2 - x1) * 0.6} ${x2} ${y} M${x2 - 9} ${y + 10} L${x2} ${y} L${x2 + 3} ${y + 12}` })

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // Adding does not work
  [
    ...table([0, 'first']),
    hop([1, '4'], 260, 380, 95, 'r'), write([1, '4'], '+ 4', 320, 38, 26, 'r'),
    write([1, '15'], '15 + 4 = 19 ?', 300, 275, 32, 'r'),
    ring([2, 'already'], 260, 190, 38, 24, 'b'),
    cross([2, 'only'], 200, 255, 200, 40),
    write([3, 'stop'], 'the map stops matching', 300, 345, 26, 'd'),
  ],
  // The big idea: whatever one number is multiplied by, so is the other
  [
    write([0, 'ratios'], '2', 180, 120, 40), write([0, 'ratios'], '15', 180, 260, 40),
    arrow2([0, 'multiplied'], 120), write([0, 'multiplied'], '× ?', 300, 80, 30, 'y'),
    write([0, 'multiplied'], '6', 420, 120, 40),
    arrow2([0, 'other'], 260), write([0, 'other'], '× the same', 300, 220, 28, 'y'),
    write([0, 'other'], '?', 420, 260, 40),
  ],
  // Look along the inches
  [
    ...table([0, 'Look']), ring([0, 'row'], 320, 130, 108, 22, 'b'),
    hop([1, 'turned'], 260, 380, 95, 'y'),
    write([2, '3'], '× 3', 320, 38, 28, 'y'), write([2, '3'], '2 × 3 = 6', 300, 285, 34),
    ring([3, 'multiplied'], 320, 38, 36, 22, 'y'),
  ],
  // Do the same to the miles
  [
    ...table([0], ''), hop([0], 260, 380, 95, 'y'), write([0], '× 3', 320, 38, 28, 'y'),
    dip([0, 'same'], 260, 380, 225), write([0, 'same'], '× 3', 320, 290, 28, 'y'),
    write([1, '15'], '15 × 3 =', 290, 345, 32), write([1, '45'], '45', 380, 190, 32, 'y'), write([1, '45'], '45', 395, 345, 32, 'y'),
    write([2, 'miles'], '45 miles', 520, 190, 30, 'y'),
  ],
  // Check by crossing
  [
    write([1, '2/15'], '2', 190, 75, 40), line([1, '2/15'], [[160, 102], [220, 102]]), write([1, '2/15'], '15', 190, 132, 40),
    write([1, '6/45'], '6', 410, 75, 40, 'w'), line([1, '6/45'], [[380, 102], [440, 102]]), write([1, '6/45'], '45', 410, 132, 40),
    ring([2, 'across'], 190, 75, 26, 24, 'y'), ring([2, 'across'], 410, 132, 34, 24, 'y'),
    ring([2, 'middle'], 190, 132, 34, 24, 'b'), ring([2, 'middle'], 410, 75, 26, 24, 'b'),
    write([3, '2'], '2 × 45 =', 270, 215, 32, 'y'), write([3, '90'], '90', 370, 215, 32, 'y'),
    write([4, '15'], '15 × 6 =', 270, 280, 32, 'b'), write([4, '90'], '90', 370, 280, 32, 'b'),
    write([5, 'equal'], 'same, so the ratios are equal', 300, 350, 26),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'ADD'], '+ 4', 300, 140, 30, 'r'),
    write([1, '19'], '15 + 4 = 19 miles', 300, 190, 32, 'r'), cross([1, 'short'], 170, 170, 260, 40),
    write([2, 'multiplied'], '2 × 3 = 6 inches', 300, 260, 30, 'd'),
    write([2, '45'], '15 × 3 = 45 miles', 300, 325, 34, 'y'),
  ],
]

/** A left-to-right arrow between the two numbers of a row at height y. */
function arrow2([beat, at]: At, y: number): ChalkMark {
  return { beat, at, c: 'y', d: `M225 ${y} L375 ${y} M361 ${y - 8} L375 ${y} L361 ${y + 8}` }
}
