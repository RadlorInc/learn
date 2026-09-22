/** g4m1-t8's chalkboards: index = screen index (0 is Screen 1, which has none). Bars drawn to scale: 3,750 books = 480 px. */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, wash, arrow, cross, span } from '../../../chalk'
import { q, warn, type At } from './t5'

const k = 480 / 3750, X0 = 60
const px = (n: number) => Math.round(X0 + n * k)   // x of the end of `n` books from the bar's start
const H = 50

/** The 3,750 bar with its 820 piece marked off (washed dim), top at y. */
const outBar = (at: At, y: number, label = true): ChalkMark[] => [
  box(at, X0, y, 480, H, 'b'),
  line(at, [[px(2930), y], [px(2930), y + H]], 'b'), wash(at, px(2930), y, 540 - px(2930), H, 'd'),
  ...(label ? [write(at, '820', (px(2930) + 540) / 2, y + H / 2, 26, 'd')] : []),
]

// Colours: white = the books the library started with and the books that came in, blue = the step 1 answer that step 2
// starts from, dim = the books that went out, yellow = the answer, coral = the warning.
export const T8: (ChalkMark[] | undefined)[] = [
  undefined,
  // One step is not enough
  [
    box([0, 'books'], X0, 60, px(2450) - X0, H), write([0, 'books'], '2,450', (X0 + px(2450)) / 2, 85, 26),
    box([1, 'in'], px(2450), 60, px(3750) - px(2450), H), write([1, 'in'], '+ 1,300', (px(2450) + px(3750)) / 2, 85, 26),
    arrow([1, 'in'], [460, 160], [460, 118], 'w'), write([1, 'in'], 'in', 500, 150, 24),
    ...outBar([1, 'out'], 200, false), write([1, 'out'], '− 820', (px(2930) + 540) / 2, 225, 24, 'd'),
    arrow([1, 'out'], [487, 258], [487, 300]), write([1, 'out'], 'out', 530, 290, 24, 'd'),
    write([2, 'two'], '1', 30, 85, 28, 'd'), write([2, 'two'], '2', 30, 225, 28, 'd'),
    write([2, 'step'], 'one step is not enough', 280, 350, 30, 'r'),
  ],
  // The big idea: first step, then its answer starts the second
  [
    write([0, 'first'], 'step 1', 60, 40, 22, 'd'),
    ...q([box([0, 'first'], X0, 60, px(2450) - X0, H), write([0, 'first'], '2,450', (X0 + px(2450)) / 2, 85, 26),
      box([0, 'first'], px(2450), 60, px(3750) - px(2450), H), write([0, 'first'], '1,300', (px(2450) + px(3750)) / 2, 85, 26)]),
    span([0, 'answer'], X0, 540, 140, 'b'), write([0, 'answer'], '3,750', 300, 170, 28, 'b'),
    arrow([0, 'start'], [300, 192], [300, 238], 'b'),
    write([0, 'second'], 'step 2', 60, 245, 22, 'd'),
    ...outBar([0, 'second'], 265), write([0, 'second'], '?', (X0 + px(2930)) / 2, 290, 30, 'y'),
  ],
  // Step 1: books come in
  [
    write([0, 'Step'], 'step 1', 60, 40, 22, 'd'),
    box([0, 'books'], X0, 60, px(2450) - X0, H), write([0, 'books'], '2,450', (X0 + px(2450)) / 2, 85, 26),
    box([0, 'in'], px(2450), 60, px(3750) - px(2450), H), write([0, 'in'], '1,300', (px(2450) + px(3750)) / 2, 85, 26),
    write([1, '2,450'], '2,450 + 1,300 =', 230, 250, 34), write([1, '3,750'], '3,750', 440, 250, 34, 'b'),
    span([2, 'library'], X0, 540, 140, 'b'), write([2, 'books'], '3,750 books', 300, 175, 30, 'b'),
  ],
  // Step 2: books go out
  [
    write([0, 'Step'], 'step 2', 60, 40, 22, 'd'),
    box([0, '3,750'], X0, 60, 480, H, 'b'), write([0, '3,750'], '3,750', 300, 85, 28, 'b'),
    write([0, 'not'], 'not 2,450', 300, 170, 30, 'r'), cross([0, '2,450'], 222, 150, 156, 40),
    line([1, '820'], [[px(2930), 60], [px(2930), 60 + H]], 'b'), wash([1, '820'], px(2930), 60, 540 - px(2930), H, 'd'),
    write([1, 'books'], '820', (px(2930) + 540) / 2, 135, 26, 'd'),
    arrow([1, 'out'], [487, 155], [487, 215]), write([1, 'out'], 'go out', 487, 240, 24, 'd'),
  ],
  // Find the answer
  [
    write([0, 'So'], 'step 2', 60, 40, 22, 'd'), ...q(outBar([0, 'So'], 60)), write([0, 'So'], '3,750', 300, 35, 24, 'b'),
    cross([0, 'away'], px(2930) + 20, 68, 540 - px(2930) - 40, H - 16),
    write([1, '3,750'], '3,750 − 820 =', 235, 230, 34), write([1, '2,930'], '2,930', 435, 230, 34, 'y'),
    write([2, 'books'], '2,930 books', (X0 + px(2930)) / 2, 85, 28, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'step'], 'step 1', 150, 140, 24, 'd'), write([1, 'STOP'], '3,750 books', 150, 185, 34, 'r'),
    cross([1, '1'], 55, 160, 190, 50),
    write([2, 'before'], 'before any go out', 150, 240, 24, 'd'),
    arrow([2, 'Keep'], [260, 185], [340, 185], 'y'),
    write([2, 'going'], 'step 2', 450, 140, 24, 'd'), write([2, '2,930'], '2,930 books', 450, 185, 34, 'y'),
  ],
]
