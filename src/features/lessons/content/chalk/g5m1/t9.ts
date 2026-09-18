/** g5m1-t9's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark, ChalkColor } from '../../../chalk'
import { write, line, box, arrow, cross, ring } from '../../../chalk'

type At = [number, string]
const q = (ms: ChalkMark[]): ChalkMark[] => ms.map(m => ({ ...m, quick: true }))
/** A number digit by digit in its columns, ones at `ones`, 36 apart; `rtl` writes the ones first, the way it is worked out. */
const num = (at: At, n: string, ones: number, y: number, c: ChalkColor = 'w', s = 40, rtl = false, gap = 36): ChalkMark[] => {
  const ms = [...n].map((d, i) => write(at, d, ones - (n.length - 1 - i) * gap, y, s, c))
  return rtl ? ms.reverse() : ms
}
const warn = (at: At, cx = 300): ChalkMark[] => [line(at, [[cx, 15], [cx + 35, 75], [cx - 35, 75], [cx, 15]], 'r'), write(at, '!', cx, 52, 30, 'r')]
const tick = (at: At, x: number, y: number): ChalkMark => line(at, [[x, y], [x + 12, y + 14], [x + 36, y - 20]], 'b')
/** 124 over × 23 and the rule, ones column at x 330 (tens 294, hundreds 258, thousands 222). */
const setup = (at: At): ChalkMark[] => q([
  ...num(at, '124', 330, 80), write(at, '×', 222, 130, 40), ...num(at, '23', 330, 130), line(at, [[205, 155], [350, 155]]),
])

// Colours: the ones row blue-ringed 3, the tens row yellow; a product's digits yellow as they are worked out.
export const T9: (ChalkMark[] | undefined)[] = [
  undefined,
  // A shorter way to write it
  [
    write([0, '23'], '23', 49, 60, 36), write([0, '20'], '= 20', 121, 60, 36, 'y'), write([0, '3'], '+ 3', 202, 60, 36, 'b'), tick([0, 'fine'], 240, 58),
    write([1, '124'], '124 × 20', 150, 140, 30, 'y'), write([1, '3'], '124 × 3', 143, 190, 30, 'b'),
    box([1, 'space'], 70, 112, 170, 106, 'd'), write([1, 'space'], 'lots of space', 420, 165, 24, 'd'),
    ...q([...num([2, 'Columns'], '124', 540, 255, 'w', 34, false, 30), write([2, 'Columns'], '×', 450, 300, 34), ...num([2, 'Columns'], '23', 540, 300, 'w', 34, false, 30)]),
    line([2, 'Columns'], [[430, 322], [560, 322]]),
    write([2, 'less'], 'less writing', 200, 290, 28, 'b'), arrow([2, 'writing'], [295, 290], [410, 285], 'b'),
  ],
  // The big idea
  [
    ...q([...num([0, 'Multiply'], '124', 400, 50, 'w', 36), write([0, 'Multiply'], '×', 292, 95, 36), ...num([0, 'Multiply'], '23', 400, 95, 'w', 36),
      line([0, 'Multiply'], [[270, 118], [420, 118]])]),
    ring([0, 'ones'], 400, 95, 16, 22, 'b'), write([0, 'ones'], 'ones row', 160, 150, 26, 'b'), arrow([0, 'ones'], [220, 150], [280, 150], 'b'),
    write([0, '0'], '0', 400, 200, 36, 'r'),
    ring([0, 'tens'], 364, 95, 16, 22, 'y'), write([0, 'tens'], 'tens row', 160, 200, 26, 'y'), arrow([0, 'tens'], [220, 200], [280, 200], 'y'),
    write([1, 'Add'], '+', 250, 175, 36), line([1, 'Add'], [[240, 225], [420, 225]]),
    write([1, 'rows'], 'total', 346, 258, 26, 'd'),
  ],
  // Times the 3 ones
  [
    ...num([0, '124'], '124', 330, 80),
    write([0, '3'], '×', 222, 130, 40), ...num([0, '3'], '23', 330, 130), line([0, '3'], [[205, 155], [350, 155]]),
    ring([0, 'ones'], 330, 130, 16, 24, 'b'), write([0, 'ones'], '124 × 3', 110, 195, 24, 'd'),
    write([1, '12'], '4 × 3 = 12', 500, 195, 24, 'd'),
    write([1, '2'], '2', 330, 195, 40, 'y'), write([1, '1'], '1', 294, 40, 24, 'd'),
    write([2, '6'], '2 × 3 = 6', 500, 240, 24, 'd'), ring([2, 'carried'], 294, 40, 12, 16, 'r'),
    write([2, '7'], '6 + 1 = 7', 500, 280, 24, 'd'), write([2, '7'], '7', 294, 195, 40, 'y'),
    write([2, 'And'], '1 × 3 = 3', 500, 320, 24, 'd'), write([2, 'And'], '3', 258, 195, 40, 'y'),
    ring([2, '372'], 294, 195, 62, 28, 'y'),
  ],
  // Times the 2 tens
  [
    ...setup([0, 'Now']), ...q([...num([0, 'Now'], '372', 330, 195), write([0, 'Now'], '124 × 3', 110, 195, 24, 'd')]),
    ring([0, '2'], 294, 130, 16, 24, 'y'), write([0, 'tens'], '2 tens = 20', 500, 130, 24, 'y'),
    write([1, '0'], '0', 330, 240, 40, 'r'), write([1, 'hold'], '0 holds the place', 480, 240, 22, 'd'),
    write([2, '124'], '124 × 2 = 248', 480, 300, 24, 'd'), ...num([2, '248'], '248', 294, 240, 'y', 40, true),
    ring([2, '2,480'], 276, 240, 80, 28, 'y'), write([2, '2,480'], '124 × 20', 110, 240, 24, 'd'),
  ],
  // Add the two rows
  [
    ...num([0, '372'], '372', 330, 75),
    write([0, '2,480'], '+', 186, 125, 40), ...num([0, '2,480'], '2480', 330, 125),
    line([0, '2,852'], [[170, 150], [350, 150]]),
    write([0, '2,852'], '2', 330, 190, 40, 'y'), write([0, '2,852'], '5', 294, 190, 40, 'y'), write([0, '2,852'], '1', 258, 42, 22, 'd'),
    write([0, '2,852'], '8', 258, 190, 40, 'y'), write([0, '2,852'], '2', 222, 190, 40, 'y'),
    write([1, '3'], '= 124 × 3', 470, 75, 26, 'b'), write([1, '20'], '= 124 × 20', 476, 125, 26, 'y'),
    write([1, '23'], '23 = 20 + 3', 300, 260, 28, 'd'),
    write([2, 'chairs'], '2,852 chairs', 300, 335, 34, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'trips']),
    ...num([1, '0'], '248', 222, 150), write([1, '0'], '0', 258, 150, 40, 'r'),
    ring([1, 'tens'], 258, 150, 16, 26, 'r'), write([1, 'tens'], 'tens row', 204, 105, 24, 'd'),
    write([2, '248'], '248', 440, 150, 40, 'r'), cross([2, 'instead'], 405, 128, 70, 44),
    ring([2, '2,480'], 204, 150, 78, 30, 'y'), write([2, '2,480'], '2,480', 440, 235, 40, 'y'),
  ],
]
