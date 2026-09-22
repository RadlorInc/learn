/** g5m1-t5's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, wash, cells, arrow, span, cross, ring, person, clock, ticks } from '../../../chalk'

type At = [number, string?]
const warn = (at: At): ChalkMark[] => [line(at, [[300, 30], [345, 105], [255, 105], [300, 30]], 'r'), write(at, '!', 300, 80, 40, 'r')]

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // A meter is much shorter
  [
    span([0, 'kilometer'], 60, 480, 150), write([0, 'kilometer'], '1 km', 270, 180, 32, 'y'),
    person([0, 'Walking'], 95, 142, 60), arrow([0, 'Walking'], [130, 105], [190, 105], 'd'),
    clock([0, 'while'], 535, 140, 26), write([0, 'while'], 'a while', 535, 190, 22, 'd'),
    span([1, 'meter'], 60, 110, 300, 'b'), write([1, 'meter'], '1 m', 85, 332, 26, 'b'),
    person([1, 'step'], 85, 292, 70, 0.6), write([1, 'step'], '1 big step', 180, 250, 26),
    cells([2, '5'], 290, 235, 270, 40, 5, 'y'), write([2, 'kilometers'], '5 km', 425, 215, 26, 'y'),
    write([2, 'meters'], '5 km = ? m', 425, 368, 30),
    ticks([2, 'lot'], 290, 290, 270, 40), write([2, 'lot'], 'a lot of m', 425, 325, 26, 'b'),
  ],
  // The big idea: one bigger unit is many smaller ones; × going down to them, ÷ going up
  [
    box([0, 'bigger'], 150, 60, 300, 50, 'y'), wash([0, 'bigger'], 150, 60, 300, 50, 'y'), write([0, 'bigger'], 'bigger unit', 300, 85, 28, 'y'),
    line([0, '10'], [[150, 110], [150, 170]], 'd', 2), line([0, '10'], [[450, 110], [450, 170]], 'd', 2),
    cells([0, '10'], 150, 170, 300, 50, 10, 'b'),
    write([0, '10'], '10', 220, 262, 30), write([0, '100'], '100', 300, 262, 30), write([0, '1,000'], '1,000', 395, 262, 30),
    write([0, 'smaller'], 'smaller ones', 300, 298, 24, 'b'),
    arrow([0, 'multiply'], [115, 90], [115, 190], 'r'), write([0, 'multiply'], '×', 88, 140, 36, 'r'),
    write([0, 'multiply'], 'to smaller → ×', 160, 355, 28, 'r'),
    arrow([0, 'divide'], [485, 190], [485, 90], 'b'), write([0, 'divide'], '÷', 512, 140, 36, 'b'),
    write([0, 'divide'], 'to bigger → ÷', 440, 355, 28, 'b'),
  ],
  // One kilometer is 1,000 meters
  [
    write([0, 'bigger'], 'bigger unit', 300, 25, 22, 'd'),
    box([0, 'kilometer'], 100, 50, 400, 50, 'y'), wash([0, 'kilometer'], 100, 50, 400, 50, 'y'), write([0, 'kilometer'], '1 km', 300, 75, 30, 'y'),
    cells([1, '1,000'], 100, 130, 400, 50, 20, 'b'), write([1, '1,000'], '1,000 m', 300, 205, 26, 'b'),
    line([1, 'long'], [[100, 100], [100, 130]]), line([1, 'long'], [[500, 100], [500, 130]]), write([1, 'long'], 'just as long', 300, 240, 24),
    cells([2, 'every'], 60, 295, 480, 40, 5, 'y'), write([2, 'run'], 'the run', 300, 274, 22, 'd'),
    ...[108, 204, 300, 396, 492].map(x => write([2, '1,000'], '1,000 m', x, 315, 20, 'b')),
  ],
  // Smaller unit: multiply
  [
    cells([0, 'Meters'], 80, 130, 440, 45, 25, 'b'), write([0, 'Meters'], 'm', 55, 152, 28, 'b'),
    write([0, 'more'], 'more of them', 300, 200, 24, 'b'),
    span([0, 'distance'], 80, 520, 95), write([0, 'distance'], 'same distance', 300, 70, 24),
    write([1, 'Smaller'], 'smaller unit', 170, 260, 28), arrow([1, 'more'], [255, 260], [315, 260]), write([1, 'more'], 'more', 355, 260, 28),
    arrow([1, 'multiply'], [395, 260], [455, 260]), write([1, 'multiply'], '×', 485, 262, 40, 'r'), ring([1, 'multiply'], 485, 260, 24, 24, 'r'),
    write([2, '5'], '5', 110, 335, 36), write([2, '1,000'], '× 1,000', 200, 335, 36), write([2, '5,000'], '= 5,000', 358, 335, 36),
    box([2, 'run'], 450, 310, 120, 50, 'y'), write([2, 'run'], '5,000 m', 510, 336, 28, 'y'),
  ],
  // Bigger unit: divide
  [
    person([0, 'runner'], 455, 150, 70, 0.45), ticks([0, '3,000'], 60, 160, 360, 30), write([0, '3,000'], '3,000 m', 240, 195, 26, 'b'),
    write([0, 'kilometers'], '? km', 530, 195, 26, 'y'),
    cells([1, 'Kilometers'], 60, 100, 360, 45, 3, 'y'), write([1, 'fewer'], 'fewer of them', 240, 70, 24, 'y'),
    arrow([1, 'divide'], [560, 245], [470, 245], 'r'), write([1, 'divide'], 'divide ÷', 390, 245, 30, 'r'),
    write([2, '3,000'], '3,000', 150, 325, 34), write([2, '1,000'], '÷ 1,000', 270, 325, 34), write([2, '3'], '= 3', 370, 325, 34),
    write([2, 'km'], '3 km', 470, 325, 30, 'y'), ring([2, 'km'], 470, 325, 42, 24, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'bigger'], 'to a bigger unit:', 200, 160, 28), write([1, 'MULTIPLY'], '×', 400, 160, 44), cross([1, 'MULTIPLY'], 380, 140, 40, 40),
    write([2, 'kilogram'], '1 kg', 150, 240, 30, 'y'), write([2, 'grams'], '= 1,000 g', 270, 240, 30),
    write([2, '6,000'], '6,000 g', 170, 320, 34), write([2, '6'], '= 6 kg', 310, 320, 34, 'y'),
    ring([2, 'smaller'], 318, 320, 62, 26, 'y'), write([2, 'smaller'], 'smaller number', 480, 320, 24, 'b'),
  ],
]
