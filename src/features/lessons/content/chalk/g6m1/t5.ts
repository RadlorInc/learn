/** g6m1-t5's chalkboards: index = screen index (0 is Screen 1, which has none). A two-row table (nuts on top, cereal
 *  underneath); the moves between columns are blue, a new column she has just worked out is yellow, the wrong move coral. */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, arrow, hop, cross, ring } from '../../../chalk'

type At = [number, string?]
export const q = (m: ChalkMark): ChalkMark => ({ ...m, quick: true })
export const warn = (at: At): ChalkMark[] => [line(at, [[300, 25], [340, 95], [260, 95], [300, 25]], 'r'), write(at, '!', 300, 72, 36, 'r')]
/** The two row names of a table, at x, on rows y1 and y2. */
export const rows = (at: At, a: string, b: string, x: number, y1: number, y2: number): ChalkMark[] =>
  [q(write(at, a, x, y1, 24, 'd')), q(write(at, b, x, y2, 24, 'd'))]
/** A number in a table cell. */
export const n = (at: At, t: string, x: number, y: number, c: 'w' | 'y' | 'b' | 'r' = 'w'): ChalkMark => q(write(at, t, x, y, 36, c))

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // A big jump is hard to see
  [
    n([0, '15'], '15', 500, 200), q(write([0, 'nuts'], 'nuts', 70, 200, 24, 'd')),
    q(write([0, 'cereal'], 'cereal', 70, 280, 24, 'd')), n([0, 'cereal'], '?', 500, 280, 'y'),
    n([1, '3'], '3', 190, 200), n([1, '5'], '5', 190, 280),
    hop([1, 'jump'], 190, 500, 165, 'r'), write([1, 'jump'], 'one big jump', 345, 45, 24, 'r'),
    arrow([1, 'steps'], [205, 335], [280, 335], 'b'), arrow([1, 'steps'], [305, 335], [380, 335], 'b'), arrow([1, 'steps'], [405, 335], [485, 335], 'b'),
    write([1, 'steps'], 'small steps', 345, 372, 24, 'b'),
    { beat: 1, at: 'table', c: 'w', w: 2, d: 'M40 240 H560 M128 175 V305 M245 175 V305 M345 175 V305 M445 175 V305' },
  ],
  // The big idea: every column is the same mix; × and ÷ a column, or add two
  [
    ...rows([0, 'column'], 'nuts', 'cereal', 70, 190, 270), n([0, 'column'], '3', 190, 190), n([0, 'column'], '5', 190, 270),
    box([0, 'column'], 155, 155, 70, 150),
    write([0, 'same'], 'the same mix in every column', 300, 35, 28, 'y'),
    hop([0, 'multiply'], 190, 330, 145, 'b'), write([0, 'multiply'], '× 2', 260, 85, 28, 'b'),
    n([0, 'multiply'], '6', 330, 190), n([0, 'multiply'], '10', 330, 270),
    arrow([0, 'divide'], [320, 335], [200, 335], 'b'), write([0, 'divide'], '÷ 2', 260, 365, 26, 'b'),
    n([0, 'add'], '+', 260, 190, 'b'), n([0, 'add'], '+', 260, 270, 'b'),
    n([0, 'add'], '=', 405, 190, 'b'), n([0, 'add'], '=', 405, 270, 'b'),
    n([0, 'add'], '9', 480, 190, 'y'), n([0, 'add'], '15', 480, 270, 'y'),
  ],
  // Double it
  [
    { beat: 0, at: 'Start', c: 'w', w: 2, d: 'M30 180 H540 M128 90 V270' },
    q(write([0, 'nuts'], 'nuts', 70, 130, 24, 'd')), n([0, '3'], '3', 200, 130),
    q(write([0, 'cereal'], 'cereal', 70, 230, 24, 'd')), n([0, '5'], '5', 200, 230),
    arrow([1, 'Double'], [235, 130], [395, 130], 'b'), write([1, 'Double'], '× 2', 315, 105, 24, 'b'),
    arrow([1, 'both'], [235, 230], [395, 230], 'b'), write([1, 'both'], '× 2', 315, 205, 24, 'b'),
    n([1, '6'], '6', 440, 130, 'y'), n([1, '10'], '10', 440, 230, 'y'),
    box([2, 'Same'], 400, 95, 80, 170, 'y'), write([2, 'twice'], 'same mix, twice as much', 300, 330, 30, 'y'),
  ],
  // Add two columns
  [
    ...rows([0, 'add'], 'nuts', 'cereal', 70, 150, 250),
    n([0, 'add'], '3', 190, 150), n([0, 'add'], '5', 190, 250), n([0, 'add'], '6', 330, 150), n([0, 'add'], '10', 330, 250),
    box([0, 'columns'], 155, 105, 70, 190, 'd'), box([0, 'columns'], 290, 105, 80, 190, 'd'),
    n([1, '3'], '+', 260, 150, 'b'), n([1, '9'], '=', 405, 150, 'b'), n([1, '9'], '9', 480, 150, 'y'),
    n([1, '5'], '+', 260, 250, 'b'), n([1, '15'], '=', 405, 250, 'b'), n([1, '15'], '15', 480, 250, 'y'),
    box([2, 'same'], 445, 105, 70, 190, 'y'), write([2, 'mix'], 'same mix', 480, 340, 26, 'y'),
  ],
  // Reach 15 cups of nuts
  [
    { beat: 0, at: 'look', c: 'w', w: 2, d: 'M30 140 H545 M115 65 V215' },
    ...rows([0, 'look'], 'nuts', 'cereal', 65, 100, 180),
    ...[[165, '3', '5'], [270, '6', '10'], [375, '9', '15']].flatMap(([x, a, b]) =>
      [n([0, 'look'], a as string, x as number, 100), n([0, 'look'], b as string, x as number, 180)]),
    ring([0, '6'], 270, 100, 26, 24, 'b'), ring([0, '9'], 375, 100, 26, 24, 'b'),
    n([0, '15'], '15', 490, 100, 'y'), write([0, '15'], '6 + 9 = 15', 300, 265, 32),
    ring([1, 'Underneath'], 270, 180, 32, 24, 'b'), ring([1, 'Underneath'], 375, 180, 32, 24, 'b'),
    n([1, '25'], '25', 490, 180, 'y'), write([1, '25'], '10 + 15 = 25', 300, 320, 32),
    box([2, 'need'], 455, 65, 70, 150, 'y'), write([2, 'cereal'], '25 cups of cereal', 300, 370, 28, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    n([1, 'ADD'], '3', 60, 170), arrow([1, 'ADD'], [85, 170], [205, 170], 'r'), write([1, 'ADD'], '+ 12', 145, 145, 24, 'r'), n([1, 'ADD'], '15', 240, 170),
    n([1, 'both'], '5', 60, 250), arrow([1, 'both'], [85, 250], [205, 250], 'r'), write([1, 'both'], '+ 12', 145, 225, 24, 'r'),
    n([1, '17'], '17', 240, 250, 'r'), cross([1, 'different'], 210, 228, 60, 45),
    write([1, 'different'], 'a different mix', 160, 315, 24, 'r'),
    n([2, '3'], '3', 350, 170), arrow([2, '15'], [375, 170], [495, 170], 'b'), write([2, '15'], '× 5', 435, 145, 24, 'b'), n([2, '15'], '15', 535, 170),
    n([2, 'multiply'], '5', 350, 250), arrow([2, 'multiply'], [375, 250], [495, 250], 'b'), write([2, 'multiply'], '× 5', 435, 225, 24, 'b'),
    n([2, '25'], '25', 535, 250, 'y'), ring([2, '25'], 535, 250, 32, 26, 'y'),
  ],
]
