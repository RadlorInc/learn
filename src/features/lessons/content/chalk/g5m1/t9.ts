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
/** Short dim dashes where a row's digits will go. */
const dashes = (at: At, xs: number[], y: number): ChalkMark => ({ ...line(at, [[0, 0]], 'd'), d: xs.map(x => `M${x - 11} ${y} h22`).join(' '), w: 3 })

// Colours: the ones row blue, the tens row yellow, its 0 coral; a row's digits yellow as they are worked out.
export const T9: (ChalkMark[] | undefined)[] = [
  undefined,
  // A shorter way to write it
  [
    write([0, '23'], '23', 49, 60, 36), write([0, '20'], '= 20', 121, 60, 36, 'y'), write([0, '3'], '+ 3', 202, 60, 36, 'b'),
    write([0, '124'], '124 × 20', 150, 140, 30, 'y'), write([0, '124'], '124 × 3', 143, 190, 30, 'b'),
    tick([1, 'works'], 240, 58), box([1, 'lot'], 70, 112, 170, 106, 'd'), write([1, 'write'], 'a lot to write', 410, 165, 26, 'd'),
    write([2, 'shorter'], 'shorter way?', 170, 300, 28, 'y'),
    ...q([...num([2, 'Stack'], '124', 520, 255, 'w', 34, false, 30), write([2, 'Stack'], '×', 430, 300, 34), ...num([2, 'Stack'], '23', 520, 300, 'w', 34, false, 30)]),
    line([2, 'Stack'], [[410, 322], [540, 322]]), arrow([2, 'columns'], [270, 300], [395, 290], 'y'),
  ],
  // The big idea
  [
    ...q([...num([0, 'Make'], '124', 400, 50, 'w', 36), write([0, 'Make'], '×', 292, 95, 36), ...num([0, 'Make'], '23', 400, 95, 'w', 36),
      line([0, 'Make'], [[270, 118], [420, 118]])]),
    ring([0, 'ones'], 400, 95, 16, 22, 'b'), write([0, 'ones'], 'ones row', 160, 155, 26, 'b'), arrow([0, 'ones'], [220, 155], [300, 155], 'b'),
    dashes([0, 'ones'], [328, 364, 400], 168),
    ring([0, 'tens'], 364, 95, 16, 22, 'y'), write([0, 'tens'], 'tens row', 160, 210, 26, 'y'), arrow([0, 'tens'], [220, 210], [270, 210], 'y'),
    dashes([0, 'tens'], [292, 328, 364], 223), write([0, '0'], '0', 400, 210, 36, 'r'),
    write([0, 'add'], '+', 250, 185, 36), line([0, 'rows'], [[240, 245], [420, 245]]),
  ],
  // Times the 3 ones
  [
    ...setup([0, 'Start']),
    ring([0, 'ones'], 330, 130, 16, 24, 'b'),
    write([0, '12'], '4 × 3 = 12', 500, 195, 24, 'd'),
    write([0, '2'], '2', 330, 195, 40, 'y'), write([0, 'carry'], '1', 294, 40, 24, 'd'),
    write([1, '6'], '2 × 3 = 6', 500, 240, 24, 'd'), ring([1, 'carried'], 294, 40, 12, 16, 'r'),
    write([1, '7'], '6 + 1 = 7', 500, 280, 24, 'd'), write([1, '7'], '7', 294, 195, 40, 'y'),
    write([2, '1'], '1 × 3 = 3', 500, 320, 24, 'd'), write([2, '1'], '3', 258, 195, 40, 'y'),
    ring([2, '372'], 294, 195, 62, 28, 'y'), write([2, 'row'], 'ones row', 110, 195, 24, 'b'),
  ],
  // Times the 2 tens
  [
    ...setup([0, 'Now']), ...q([...num([0, 'Now'], '372', 330, 195), write([0, 'Now'], 'ones row', 110, 195, 24, 'b')]),
    ring([0, '2'], 294, 130, 16, 24, 'y'), write([0, 'tens'], '2 tens', 480, 130, 30, 'y'),
    write([1, '0'], '0', 330, 240, 40, 'r'), write([1, 'place'], 'a 0 in the ones place', 470, 290, 20, 'd'),
    write([2, '124'], '124 × 2 = 248', 460, 335, 24, 'd'), ...num([2, '248'], '248', 294, 240, 'y', 40, true),
    ring([2, '2,480'], 276, 240, 80, 28, 'y'), write([2, 'row'], 'tens row', 110, 240, 24, 'y'),
  ],
  // Add the two rows
  [
    ...num([0, '372'], '372', 330, 75),
    write([0, '2,480'], '+', 186, 125, 40), ...num([0, '2,480'], '2480', 330, 125),
    line([0, '2,852'], [[170, 150], [350, 150]]),
    write([0, '2,852'], '2', 330, 190, 40, 'y'), write([0, '2,852'], '5', 294, 190, 40, 'y'), write([0, '2,852'], '1', 258, 42, 22, 'd'),
    write([0, '2,852'], '8', 258, 190, 40, 'y'), write([0, '2,852'], '2', 222, 190, 40, 'y'),
    write([1, '3'], '= 124 × 3', 470, 75, 26, 'b'), write([1, '20'], '= 124 × 20', 476, 125, 26, 'y'),
    write([1, 'parts'], '23 = 20 + 3', 300, 260, 28, 'd'),
    write([2, 'chairs'], '2,852 chairs', 300, 335, 34, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'tens'], 'tens row', 204, 105, 24, 'd'), ...num([1, 'tens'], '248', 222, 150),
    write([1, '0'], '0', 258, 150, 40, 'r'), ring([1, '0'], 258, 150, 16, 26, 'r'),
    write([2, '248'], '248', 440, 150, 40, 'r'), cross([2, 'not'], 402, 116, 76, 68),
    ring([2, '2,480'], 204, 150, 78, 30, 'y'), write([2, '2,480'], '2,480', 440, 235, 40, 'y'),
  ],
]
