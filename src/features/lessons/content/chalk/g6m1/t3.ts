/** g6m1-t3's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The $5 as a bar at true scale: $1 = 80 px, so each notebook's $1.25 is 100 px. Yellow is the price of one,
 *  blue the dollar being shared out, coral the mix-up. */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, cells, wash, arrow, span, cross } from '../../../chalk'
import { warn } from './t1'

type At = [number, string?]
const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
/** A notebook: a cover with its spine, centred on x, y. */
export const notebook = (at: At, x: number, y: number, c: 'w' | 'y' | 'b' | 'd' = 'w'): ChalkMark[] =>
  [q(box(at, x - 16, y - 21, 32, 42, c)), q(line(at, [[x - 9, y - 21], [x - 9, y + 21]], c))]
const tag = (at: At, y: number): ChalkMark[] => [box(at, 260, y, 80, 48), write(at, '$5', 300, y + 25, 30)]

export const T3: (ChalkMark[] | undefined)[] = [
  undefined,
  // The tag is for the whole pack
  [
    ...tag([0, 'tag'], 25),
    ...[165, 255, 345, 435].flatMap(x => notebook([0, 'pack'], x, 165)),
    span([0, 'pack'], 140, 460, 210, 'd'), write([0, 'pack'], 'the whole pack', 300, 240, 22, 'd'),
    write([1, 'cost'], '1 notebook = ?', 230, 305, 30), write([1, 'Not'], 'not $5', 470, 305, 30, 'r'),
    ...[165, 255, 345, 435].map(x => arrow([2, 'share'], [300, 78], [x, 138], 'b')),
  ],
  // The big idea: total ÷ how many = one
  [
    box([0, 'divide'], 60, 120, 480, 60),
    span([0, 'total'], 60, 540, 95), write([0, 'total'], 'total', 300, 62, 26),
    cells([0, 'many'], 60, 120, 480, 60, 4), write([0, 'many'], 'how many parts', 420, 212, 22, 'd'),
    wash([0, 'are'], 60, 120, 120, 60, 'y'), write([0, 'are'], 'one', 120, 212, 26, 'y'),
    write([0, 'are'], 'total ÷ how many = one', 300, 300, 32, 'y'),
  ],
  // One part for each notebook
  [
    box([0, 'bar'], 60, 150, 480, 70), span([0, 'bar'], 60, 540, 120), write([0, 'bar'], '$5', 300, 88, 32),
    cells([1, 'cut'], 60, 150, 480, 70, 4), write([1, 'parts'], '4 equal parts', 300, 250, 24, 'd'),
    ...[120, 240, 360, 480].flatMap(x => notebook([2, 'notebook'], x, 315)),
  ],
  // Share out the dollars
  [
    write([0, 'divide'], '$5 ÷ 4', 230, 42, 34),
    cells([0, 'part'], 100, 80, 400, 55, 5),
    ...[140, 220, 300, 380, 460].map(x => q(write([0, 'gets'], '$1', x, 100, 24))),
    wash([0, 'left'], 420, 80, 80, 55, 'b'), write([0, 'left'], 'left over', 460, 158, 20, 'b'),
    { beat: 1, at: 'quarters', c: 'b', d: 'M440 117 v18 M460 117 v18 M480 117 v18' },
    write([1, '25'], '25¢ each', 460, 186, 20, 'b'),
    cells([2, 'part'], 100, 225, 400, 60, 4),
    ...[150, 250, 350, 450].map(x => q(write([2, '$1.25'], '$1.25', x, 255, 26, 'y'))),
    write([2, '$1.25'], '= $1.25', 350, 42, 34, 'y'),
    ...[150, 250, 350, 450].flatMap(x => notebook([2, 'notebook'], x, 330, 'y')),
  ],
  // Check it
  [
    ...tag([0, 'tag'], 22),
    cells([0, 'Check'], 100, 110, 400, 60, 4),
    ...[150, 250, 350, 450].map(x => q(write([0, 'Check'], '$1.25', x, 140, 26, 'y'))),
    write([1, '4'], '4 × $1.25 =', 270, 255, 34), span([1, '$5'], 100, 500, 195), write([1, '$5'], '$5', 405, 255, 34),
    line([1, 'Yes'], [[440, 255], [455, 272], [480, 232]], 'y'),
    write([2, '$1.25'], '1 notebook = $1.25', 300, 335, 32, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, '4'], '4 ÷ 5', 250, 160, 36, 'r'), write([1, '80'], '= 80¢', 370, 160, 36, 'r'),
    cross([1, 'cheap'], 185, 138, 240, 44),
    write([2, 'DOLLARS'], 'dollars ÷ notebooks', 300, 245, 28, 'd'),
    write([2, '$5'], '$5 ÷ 4 =', 250, 320, 38), write([2, '$1.25'], '$1.25', 395, 320, 38, 'y'),
  ],
]
