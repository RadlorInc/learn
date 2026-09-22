/** g3m3-t5's chalkboards (8s): index = screen index (0 is Screen 1, which has none). A juice box is a small box with a straw; a row is a pack. */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, cross, clock } from '../../../chalk'
import { warn, tick } from '../g3m1/t1'
import { rows, type Shape } from './t3'

const juice = (k: number): Shape => ([beat, at], pts, c) => ({ beat, at, c,
  d: pts.map(([x, y]) => `M${x - 8 * k} ${y - 11 * k} h${16 * k} v${22 * k} h${-16 * k} Z M${x + 3 * k} ${y - 11 * k} l${3 * k} ${-7 * k}`).join(' ') })
const J = juice(0.85)

export const T5: (ChalkMark[] | undefined)[] = [
  undefined,
  // 8 is a lot of groups
  [
    ...rows(juice(0.8), [0, 'groups'], 90, 50, 38, 0, 8),
    ...Array.from({ length: 8 }, (_, i) => ({ ...write([0, 'one'], String(i + 1), 45, 50 + i * 38, 20, 'd'), quick: true })),
    clock([0, 'long'], 300, 110, 28), write([0, 'long'], 'a long count', 440, 110, 26, 'd'),
    write([1, 'slips'], 'lost count?', 380, 200, 30, 'r'),
    write([2, '4s'], 'a shortcut: your 4s', 380, 300, 30, 'y'),
  ],
  // The big idea: 4 groups and 4 more, then double
  [
    write([0, '8'], '8 groups', 450, 40, 26, 'd'),
    ...rows(juice(0.9), [0, '4'], 150, 45, 38, 0, 4, 'b'), write([0, '4'], '4 groups', 450, 102, 30, 'b'),
    line([0, 'more'], [[120, 176], [260, 176]], 'd', 2),
    ...rows(juice(0.9), [0, 'more'], 150, 45, 38, 4, 8), write([0, 'more'], '4 more groups', 450, 254, 28),
    write([0, 'double'], 'then double', 450, 330, 30, 'y'),
  ],
  // Four packs
  [
    ...rows(J, [0, 'Look'], 120, 45, 36, 0, 8, 'd'),
    box([0, 'top'], 100, 24, 112, 148, 'b'),
    write([1, 'packs'], '4 packs of 3', 420, 80, 32, 'b'),
    write([1, "What's"], '4 × 3', 380, 150, 40, 'b'), write([2, '12'], '= 12', 490, 150, 40, 'b'),
  ],
  // Four more packs
  [
    ...rows(J, [0, 'Now'], 120, 45, 36, 0, 4, 'b'), write([0, 'Now'], '12', 280, 99, 32, 'b'),
    ...rows(J, [0, 'bottom'], 120, 45, 36, 4, 8), box([0, 'bottom'], 100, 168, 112, 144),
    write([1, 'Same'], '4 packs of 3', 420, 230, 32),
    write([2, 'make'], '4 × 3', 380, 300, 36), write([2, '12'], '= 12', 475, 300, 36),
  ],
  // Double it
  [
    ...rows(juice(0.7), [0, 'halves'], 90, 50, 30, 0, 4, 'b'), ...rows(juice(0.7), [0, 'halves'], 90, 50, 30, 4, 8),
    write([0, '12'], '12', 210, 95, 30, 'b'), write([0, 'each'], '12', 210, 215, 30),
    write([1, 'double'], 'double', 380, 80, 30, 'y'),
    write([1, '12'], '12 + 12', 380, 140, 40), write([1, '24'], '= 24', 495, 140, 40, 'y'),
    write([2, '8'], '8 × 3', 380, 260, 48), write([2, '24'], '= 24', 490, 260, 48, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'double'], '3 + 3', 170, 175, 40, 'r'), cross([1, '3'], 105, 150, 130, 50),
    write([2, 'ANSWER'], '4 × 3 = 12', 430, 175, 34, 'b'),
    write([2, "it's"], '12 + 12', 300, 290, 44, 'y'), tick([2, "it's"], 405, 288),
  ],
]
