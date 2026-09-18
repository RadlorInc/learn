/** g5m1-t19's chalkboards: index = screen index (0 is Screen 1, which has none). Markers/boxes yellow, classes blue. */
import type { ChalkMark } from '../../../chalk'
import { write, box, cells, arrow, span, cross, ring } from '../../../chalk'
import { q, warn } from './t17'

export const T19: (ChalkMark[] | undefined)[] = [
  undefined,
  // The story hides a number
  [
    box([0, 'markers'], 40, 60, 200, 110, 'y'), write([0, 'markers'], 'markers', 140, 85, 24, 'y'),
    cells([0, '18'], 330, 80, 240, 40, 18, 'b'), write([0, 'classes'], '18 classes', 450, 145, 28, 'b'),
    arrow([0, 'classes'], [245, 115], [322, 100], 'd'),
    write([1, 'all'], '?', 140, 130, 60, 'r'), write([1, 'never'], 'the story never says', 140, 200, 22, 'd'),
    arrow([2, 'hidden'], [140, 215], [200, 262], 'r'), write([2, 'hidden'], 'hidden number', 300, 280, 30, 'r'),
    write([2, 'first'], 'find it first', 300, 340, 30, 'y'),
  ],
  // The big idea
  [
    box([0, 'hidden'], 60, 60, 160, 90, 'r'), write([0, 'hidden'], '?', 140, 105, 56, 'r'),
    write([0, 'first'], 'step 1: find it', 140, 200, 26, 'y'),
    arrow([1, 'use'], [230, 105], [350, 105], 'y'), write([1, 'use'], 'step 2: use it', 450, 200, 26, 'b'),
    box([1, 'question'], 360, 60, 180, 90, 'b'), write([1, 'question'], 'the question', 450, 105, 26, 'b'),
  ],
  // Step 1: find the hidden number
  [
    write([0, '24'], '24 boxes', 300, 35, 26, 'y'), cells([0, '24'], 40, 60, 520, 50, 24, 'y'),
    write([0, '36'], '36 markers in each', 300, 145, 26, 'b'), arrow([0, 'each'], [178, 140], [55, 116], 'b'),
    write([1, '24'], '24 × 36 = 864', 300, 220, 40), ring([1, '864'], 400, 220, 36, 26, 'y'),
    span([1, 'all'], 40, 560, 280, 'y'), write([1, 'all'], '864 markers in all', 300, 330, 30, 'y'),
  ],
  // Step 2: use it
  [
    write([0, 'question'], 'How many for each class?', 300, 40, 26, 'b'),
    box([1, '864'], 30, 80, 160, 70, 'y'), write([1, '864'], '864', 110, 115, 34, 'y'),
    arrow([1, 'equally'], [195, 115], [262, 115]),
    cells([1, '18'], 270, 90, 300, 50, 18, 'b'), write([1, 'classes'], '18 classes', 420, 170, 26, 'b'),
    write([1, 'classes'], '864 ÷ 18 =', 270, 250, 40), write([1, '48'], '48', 400, 250, 40, 'y'),
    ring([2, 'class'], 278, 115, 14, 32, 'b'), write([2, '48'], 'each class gets 48', 300, 330, 30, 'y'),
  ],
  // Check it makes sense
  [
    write([0, 'check'], 'check', 300, 35, 26, 'd'),
    cells([0, '18'], 40, 65, 520, 50, 18, 'b'),
    ...Array.from({ length: 18 }, (_, i) => q(write([0, 'each'], '48', 40 + (520 / 18) * (i + 0.5), 90, 20, 'y'))),
    write([0, 'is'], '18 × 48 = 864', 300, 185, 40),
    span([1, 'every'], 40, 560, 135, 'y'),
    cells([1, '24'], 40, 245, 520, 45, 24, 'y'), write([1, 'boxes'], '864 in 24 boxes', 300, 315, 28, 'y'),
    write([2, '48'], 'each class: 48', 300, 365, 32, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'trap']), write([0, 'two-step'], 'step 1 → step 2', 300, 140, 28, 'd'),
    write([1, 'stop'], 'stop at 864', 170, 210, 30, 'r'), cross([1, 'number'], 80, 190, 180, 40),
    write([2, '864'], '864 = all markers', 170, 280, 28, 'y'), write([2, 'class'], 'not for one class', 430, 280, 26, 'r'),
    write([2, 'finish'], 'finish: 864 ÷ 18 = 48', 300, 350, 30, 'y'),
  ],
]
