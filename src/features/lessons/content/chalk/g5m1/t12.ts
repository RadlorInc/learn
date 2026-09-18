/** g5m1-t12's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, wash, cells, arrow, span, hop, cross, ring, ticks } from '../../../chalk'

// A number line 0 … 240 from x 60 to 540: 2 px a unit, one small step (10) is 20 px.
const X = (n: number) => 60 + n * 2

export const T12: (ChalkMark[] | undefined)[] = [
  undefined,
  // Not a fact you know
  [
    write([0, '240'], '240 ÷ 60', 300, 70, 44, 'y'), write([0, 'facts'], 'not a fact', 300, 125, 26, 'r'),
    line([1, 'Counting'], [[50, 250], [550, 250]]), write([1, 'Counting'], '0', X(0), 280, 24),
    hop([1, '60s'], X(0), X(60), 250, 'b'), write([1, '60s'], '60', X(60), 280, 24, 'b'),
    hop([1, 'way'], X(60), X(120), 250, 'b'), hop([1, 'way'], X(120), X(180), 250, 'b'), hop([1, 'way'], X(180), X(240), 250, 'b'),
    write([1, '240'], '240', X(240), 280, 24, 'y'),
    write([1, 'slow'], 'slow...', 200, 340, 26, 'd'),
    cross([1, 'slip'], 345, 199, 30, 30), write([1, 'answer'], 'wrong answer?', 420, 340, 26, 'r'),
  ],
  // The big idea
  [
    write([0, 'tens'], 'think in tens', 300, 60, 34, 'y'),
    write([1, '240'], '240', 160, 140, 40), write([1, 'tens'], '= 24 tens', 330, 140, 40, 'b'),
    write([1, '60'], '60', 160, 210, 40), write([1, '6'], '= 6 tens', 320, 210, 40, 'b'),
    write([1, 'so'], '240 ÷ 60', 180, 300, 40), write([1, 'same'], '=', 300, 300, 40),
    write([1, 'same'], '24 ÷ 6', 410, 300, 40, 'y'), ring([1, 'same'], 410, 300, 80, 32, 'y'),
  ],
  // 240 is 24 tens
  [
    ticks([0, 'small'], X(0), 220, 480, 24, 12), write([0, 'small'], '0', X(0), 250, 24),
    wash([0, 'step'], X(0), 220, 20, 12, 'y'), write([0, '10'], '1 step = 10', 300, 50, 26, 'b'),
    hop([1, 'Jump'], X(0), X(100), 220, 'y'), write([1, 'tens'], '10 tens', 160, 140, 24, 'y'), write([1, '100'], '100', X(100), 250, 24),
    hop([1, 'more'], X(100), X(200), 220, 'y'), write([1, 'more'], '10 tens', 360, 140, 24, 'y'), write([1, '200'], '200', X(200), 250, 24),
    hop([1, '4'], X(200), X(240), 220, 'y'), write([1, '4'], '4 tens', 500, 172, 24, 'y'), write([1, '240'], '240', X(240), 250, 24),
    span([2, 'all'], X(0), X(240), 290, 'd'), write([2, '24'], '240 = 24 tens', 300, 345, 38, 'y'),
  ],
  // 60 is 6 tens
  [
    box([0, 'bus'], 60, 30, 160, 70), cells([0, 'bus'], 75, 40, 130, 25, 4, 'd'),
    ring([0, 'bus'], 95, 105, 12, 12), ring([0, 'bus'], 185, 105, 12, 12),
    write([0, '60'], '60 seats', 380, 65, 32, 'y'),
    ticks([1, '60'], X(0), 260, 480, 24, 12), write([1, 'small'], '0', X(0), 290, 24), write([1, 'small'], '60', X(60), 290, 24, 'y'),
    write([1, 'small'], '240', X(240), 290, 24), wash([1, 'steps'], X(0), 260, 120, 12, 'b'),
    write([1, 'tens'], '60 = 6 tens', 300, 345, 36, 'y'),
    write([2, 'busload'], '1 bus', 120, 160, 24), hop([2, 'jump'], X(0), X(60), 260, 'y'), write([2, '6'], '6 tens', 120, 205, 24, 'y'),
  ],
  // Count the jumps
  [
    ticks([0, 'So'], X(0), 200, 480, 24, 12),
    hop([0, 'jump'], X(0), X(60), 200, 'y'), write([0, 'tens'], '6 tens', 120, 110, 24, 'y'),
    hop([0, 'time'], X(60), X(120), 200, 'y'), hop([0, 'way'], X(120), X(180), 200, 'y'),
    write([0, '0'], '0', X(0), 230, 24), hop([0, '240'], X(180), X(240), 200, 'y'), write([0, '240'], '240', X(240), 230, 24),
    ...[1, 2, 3, 4].map(n => ({ ...write([1, '4'], String(n), X(60 * n - 30), 145, 26, 'b'), quick: true })),
    write([1, 'because'], '24 ÷ 6 = 4', 300, 285, 38),
    write([2, '240'], '240 ÷ 60 = 4', 260, 350, 38, 'y'), write([2, 'buses'], '4 buses', 500, 350, 30, 'y'), ring([2, 'buses'], 500, 350, 62, 26, 'y'),
  ],
  // One thing not to do
  [
    line([0, 'warning'], [[300, 30], [345, 105], [255, 105], [300, 30]], 'r'), write([0, 'warning'], '!', 300, 80, 40, 'r'),
    write([1, 'take'], '240 ÷ 60', 170, 170, 40), line([1, 'only'], [[232, 190], [252, 150]], 'r', 4.5),
    arrow([2, 'turns'], [285, 170], [355, 170], 'r'), write([2, 'into'], '240 ÷ 6', 450, 170, 40, 'r'), cross([2, '6'], 380, 150, 140, 40),
    write([2, 'both'], '24 tens ÷ 6 tens', 300, 290, 34, 'y'),
  ],
]
