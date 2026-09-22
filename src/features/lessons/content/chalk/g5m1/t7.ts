/** g5m1-t7's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark, ChalkColor } from '../../../chalk'
import { write, line, box, arrow, span, cross, ring, clock } from '../../../chalk'

type At = [number, string]
const q = (ms: ChalkMark[]): ChalkMark[] => ms.map(m => ({ ...m, quick: true }))
/** A number digit by digit in its columns, ones at `ones`, 36 apart; `rtl` writes the ones first, the way it is worked out. */
const num = (at: At, n: string, ones: number, y: number, c: ChalkColor = 'w', s = 40, rtl = false): ChalkMark[] => {
  const ms = [...n].map((d, i) => write(at, d, ones - (n.length - 1 - i) * 36, y, s, c))
  return rtl ? ms.reverse() : ms
}
const warn = (at: At, cx = 300): ChalkMark[] => [line(at, [[cx, 15], [cx + 35, 75], [cx - 35, 75], [cx, 15]], 'r'), write(at, '!', cx, 52, 30, 'r')]

// Colours: the hundreds part yellow, the tens part blue, the ones part white — the same on every screen.
export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // Not in the times tables
  [
    write([0, '6'], '6 × 128', 300, 80, 44), write([0, 'fact'], '= ?', 430, 80, 44, 'r'),
    write([1, 'add'], '128 + 128 + 128 + 128 + 128 + 128', 300, 170, 26),
    span([1, 'six'], 85, 515, 205, 'd'), write([1, 'six'], '6 times', 300, 237, 24, 'd'),
    clock([1, 'slow'], 500, 310, 26),
    write([1, 'slip'], '1 slip changes it', 260, 310, 26, 'r'),
    write([2, 'better'], 'a better way?', 300, 370, 30, 'y'),
  ],
  // The big idea
  [
    write([0, 'number'], '128', 300, 45, 36),
    box([0, 'hundreds'], 60, 80, 270, 60, 'y'), write([0, 'hundreds'], '100', 195, 110, 30, 'y'), write([0, 'hundreds'], 'hundreds', 195, 160, 22, 'd'),
    box([0, 'tens'], 330, 80, 120, 60, 'b'), write([0, 'tens'], '20', 390, 110, 30, 'b'), write([0, 'tens'], 'tens', 390, 160, 22, 'd'),
    box([0, 'ones'], 450, 80, 90, 60), write([0, 'ones'], '8', 495, 110, 30), write([0, 'ones'], 'ones', 495, 160, 22, 'd'),
    ...q([write([0, 'each'], '× 6', 195, 205, 26), write([0, 'each'], '× 6', 390, 205, 26), write([0, 'each'], '× 6', 495, 205, 26)]),
    box([0, 'add'], 165, 245, 60, 44, 'y'), write([0, 'add'], '+', 292, 267, 32),
    box([0, 'add'], 360, 245, 60, 44, 'b'), write([0, 'add'], '+', 442, 267, 32), box([0, 'add'], 465, 245, 60, 44),
    write([0, 'parts'], '= total', 345, 330, 30, 'y'),
  ],
  // Break 128 apart
  [
    ...q([write([0, '128'], '1', 264, 60, 48, 'y'), write([0, '128'], '2', 300, 60, 48, 'b'), write([0, '128'], '8', 336, 60, 48)]),
    arrow([0, 'hundred'], [258, 90], [160, 122], 'y'), write([0, 'hundred'], '1 hundred', 130, 145, 28, 'y'),
    arrow([0, 'tens'], [300, 90], [300, 122], 'b'), write([0, 'tens'], '2 tens', 300, 145, 28, 'b'),
    arrow([0, 'ones'], [342, 90], [440, 122]), write([0, 'ones'], '8 ones', 470, 145, 28),
    box([1, 'row'], 60, 200, 480, 50, 'd'), write([1, 'row'], '1 row = 128', 300, 183, 22, 'd'),
    { beat: 1, at: 'three', d: 'M330 200 v50 M450 200 v50', c: 'w' },
    write([1, 'parts'], '128 =', 189, 320, 34),
    write([1, '100'], '100', 195, 225, 30, 'y'), write([1, '100'], '100', 274, 320, 34, 'y'),
    write([1, '20'], '20', 390, 225, 30, 'b'), write([1, '20'], '+ 20', 351, 320, 34, 'b'),
    write([1, '8'], '8', 495, 225, 30), write([1, '8'], '+ 8', 428, 320, 34),
  ],
  // Multiply each part
  [
    { beat: 0, at: 'Now', d: 'M60 70 h480 v60 h-480 Z M330 70 v60 M450 70 v60', c: 'w', quick: true },
    ...q([write([0, 'Now'], '100', 195, 45, 26, 'y'), write([0, 'Now'], '20', 390, 45, 26, 'b'), write([0, 'Now'], '8', 495, 45, 26), write([0, 'Now'], '6', 35, 100, 30)]),
    write([0, 'hundred'], '6 × 1 hundred = 6 hundreds', 300, 170, 22, 'd'),
    write([0, '100'], '6 × 100 = 600', 300, 205, 30, 'y'), write([0, '600'], '600', 195, 100, 30, 'y'),
    write([1, 'tens'], '6 × 2 tens = 12 tens', 300, 250, 22, 'd'),
    write([1, '20'], '6 × 20 = 120', 300, 285, 30, 'b'), write([1, '120'], '120', 390, 100, 28, 'b'),
    write([2, '8'], '6 × 8 = 48', 300, 345, 30), write([2, '48'], '48', 495, 100, 28),
  ],
  // Add all the parts: in columns, the way it is added at the board
  [
    ...num([0, '600'], '600', 360, 70, 'y'),
    ...num([0, '120'], '120', 360, 120, 'b'),
    write([0, '48'], '+', 252, 170, 40), ...num([0, '48'], '48', 360, 170),
    line([0, '768'], [[235, 195], [385, 195]]), ...num([0, '768'], '768', 360, 235, 'y', 40, true),
    write([1, '6'], '6 × 128', 246, 300, 36), write([1, '768'], '= 768', 372, 300, 36, 'y'),
    write([1, 'corn'], '768 corn plants', 300, 355, 28, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'multiply'], '6 × 128 = 6 + 12 + 48', 300, 140, 30, 'r'), cross([1, 'ones'], 286, 120, 102, 40),
    ...q([write([2, '128'], '1', 84, 240, 44, 'y'), write([2, '128'], '2', 120, 240, 44, 'b'), write([2, '128'], '8', 156, 240, 44)]),
    ring([2, '100'], 84, 240, 16, 26, 'y'), write([2, '100'], '1 → 100', 330, 215, 30, 'y'),
    ring([2, '20'], 120, 240, 16, 26, 'b'), write([2, '20'], '2 → 20', 330, 265, 30, 'b'),
    write([2, 'parts'], 'parts:', 110, 335, 26, 'd'),
    write([2, '600'], '600', 220, 335, 36, 'y'), write([2, '120'], '120', 330, 335, 36, 'b'),
    write([2, '6'], '6, 12', 480, 335, 32, 'r'), cross([2, '12'], 430, 315, 100, 40),
  ],
]
