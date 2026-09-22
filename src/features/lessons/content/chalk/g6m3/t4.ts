/** g6m3-t4's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, cells, arrow, cross, ring } from '../../../chalk'

type At = [number, string?]
// Blue = a number grown × 10, yellow = the answer, coral = the mix-up.
const q = (ms: ChalkMark[]) => ms.map(m => ({ ...m, quick: true }))
const warn = (at: At): ChalkMark[] => [line(at, [[300, 30], [345, 105], [255, 105], [300, 30]], 'r'), write(at, '!', 300, 80, 40, 'r')]
// Long division 4 ) 96, size 36: the digits 9 · 6 at x 185 · 213; answer row y 42, 96 at y 150, then 195 · 238 · 282 · 325.
const X = [185, 213], S = 36

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // The 0.4 is not whole
  [
    write([0, 'whole'], '÷ whole number', 260, 60, 32), line([0, 'whole'], [[400, 58], [412, 74], [436, 44]], 'y'),
    write([1, '0.4'], '÷ 0.4', 240, 145, 40), ring([1, 'not'], 262, 145, 40, 30, 'r'), write([1, 'whole'], 'not whole', 430, 145, 30, 'r'),
    cells([2, 'fit'], 60, 250, 60, 50, 3, 'b'), write([2, 'fit'], '0.4 m', 90, 228, 20, 'b'),
    box([2, '9.6'], 60, 250, 480, 50), write([2, '9.6'], '9.6 m', 300, 330, 26),
    write([2, 'hard'], 'how many?', 340, 275, 28),
  ],
  // The big idea: grow both, same answer
  [
    ...q([write([0, 'Multiply'], '9.6', 240, 70, 40), write([0, 'Multiply'], '÷', 300, 70, 40), write([0, 'Multiply'], '0.4', 360, 70, 40)]),
    arrow([0, 'both'], [240, 98], [240, 168], 'b'), arrow([0, 'both'], [360, 98], [360, 168], 'b'),
    write([0, '10'], '× 10', 175, 133, 26, 'b'), write([0, '10'], '× 10', 425, 133, 26, 'b'),
    ...q([write([0, 'whole'], '96', 240, 200, 40, 'b'), write([0, 'whole'], '÷', 300, 200, 40), write([0, 'whole'], '4', 360, 200, 40, 'b')]),
    ring([0, 'whole'], 360, 200, 26, 28, 'y'), write([0, 'whole'], 'whole', 450, 200, 24, 'y'),
    write([0, 'same'], 'same answer', 300, 290, 36, 'y'),
  ],
  // Grow both, same answer
  [
    write([0, '6'], '6 ÷ 2', 220, 100, 38), write([0, '3'], '=', 330, 100, 38), write([0, '3'], '3', 385, 100, 38, 'y'),
    arrow([1, 'both'], [120, 118], [120, 190], 'b'), write([1, 'bigger'], '× 10', 65, 155, 26, 'b'),
    write([1, '60'], '60 ÷ 20', 220, 210, 38, 'b'), write([1, 'still'], '=', 330, 210, 38), write([1, 'still'], '3', 385, 210, 38, 'y'),
    write([2, 'same'], 'grow both → same answer', 300, 320, 30, 'y'), ring([2, 'move'], 385, 155, 24, 86, 'y'),
  ],
  // Make it whole
  [
    write([0, '0.4'], '0.4', 150, 110, 40), line([0, 'place'], [[160, 138], [182, 138]], 'd'), write([0, 'place'], '1 place', 150, 160, 22, 'd'),
    write([0, 'times'], '× 10', 280, 110, 34, 'b'), write([0, '4'], '= 4', 410, 110, 40, 'b'), write([0, '4'], 'whole', 510, 110, 24, 'y'),
    write([1, '9.6'], '9.6', 150, 240, 40), write([1, 'becomes'], '× 10', 280, 240, 34, 'b'), write([1, '96'], '= 96', 410, 240, 40, 'b'),
  ],
  // Now divide
  [
    write([0, '9.6'], '9.6 ÷ 0.4', 450, 70, 32), write([0, '96'], '= 96 ÷ 4', 450, 115, 32, 'b'),
    ...q([write([0, '96'], '4', 110, 150, S), { beat: 0, at: '96', d: 'M150 172 Q164 148 150 124 H260' },
      write([0, '96'], '9', X[0], 150, S), write([0, '96'], '6', X[1], 150, S)]),
    write([1, 'two'], '2', X[0], 102, S, 'y'),
    write([1, 'left'], '−', 160, 195, S), write([1, 'left'], '8', X[0], 195, S), line([1, 'left'], [[170, 214], [200, 214]]),
    write([1, 'left'], '1', X[0], 238, S, 'b'),
    arrow([2, 'down'], [X[1], 172], [X[1], 218], 'b'), write([2, '16'], '6', X[1], 238, S, 'b'),
    write([2, 'four'], '4', X[1], 102, S, 'y'),
    write([2, 'nothing'], '−', 160, 282, S), write([2, 'nothing'], '1', X[0], 282, S), write([2, 'nothing'], '6', X[1], 282, S),
    line([2, 'nothing'], [[170, 301], [228, 301]]), write([2, 'nothing'], '0', X[1], 325, S),
    ring([3, '24'], 199, 102, 38, 24, 'y'), write([3, '24'], '9.6 ÷ 0.4 = 24', 450, 230, 30, 'y'),
    write([3, 'pieces'], '24 pieces', 450, 300, 34, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'grow'], '9.6 ÷ 0.4', 230, 155, 36), write([1, 'ONLY'], 'only 0.4 × 10', 230, 200, 24, 'r'),
    write([1, '2.4'], '= 2.4', 380, 155, 36, 'r'), cross([1, 'few'], 332, 135, 96, 42),
    write([2, 'both'], 'grow both × 10', 300, 260, 28, 'b'),
    write([2, '96'], '96 ÷ 4', 250, 320, 38, 'b'), write([2, '24'], '= 24', 390, 320, 38, 'y'),
  ],
]
