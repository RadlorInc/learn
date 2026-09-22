/** g6m4-t4's chalkboards: index = screen index (0 is Screen 1, which has none). Colours as t1. */
import type { ChalkMark } from '../../../chalk'
import { write, wash, cells, span, hop, cross } from '../../../chalk'
import { warn } from '../g3m1/t1'
import { q, type At } from './t1'

// The price as a tape of 4 equal pieces, 120 wide, x 60–540. `mid(k)` is the centre of piece k (0–3), `end(k)` its right edge.
const mid = (k: number) => 120 + 120 * k, end = (k: number) => 180 + 120 * k
const tape = (at: At, y: number, h = 80): ChalkMark => cells(at, 60, y, 480, h, 4)

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // The $15 is only a part
  [
    write([0, '15'], '$15', mid(0), 150, 32),
    write([0, 'price'], 'price = ?', 300, 40, 28), span([0, 'price'], 60, 540, 80), tape([0, 'price'], 110),
    wash([0, 'part'], 60, 110, 120, 80, 'b'),
    write([1, 'less'], 'more or less?', 300, 260, 30, 'd'),
    write([2, 'More'], 'more than $15', 300, 340, 36, 'y'),
    write([2, '25%'], '25%', mid(0), 215, 26, 'b'), write([2, '100%'], 'whole = 100%', 390, 215, 26),
  ],
  // The big idea: one piece, then count up to 100%
  [
    tape([0, 'Find'], 140, 60), wash([0, 'piece'], 60, 140, 120, 60, 'b'),
    write([0, 'worth'], '1 piece = ?', 150, 300, 28, 'y'),
    hop([0, 'count'], 60, 180, 135), hop([0, 'pieces'], 180, 300, 135), hop([0, 'way'], 300, 420, 135), hop([0, 'up'], 420, 540, 135),
    ...q(['25%', '50%', '75%'].map((t, k) => write([0, 'up'], t, end(k), 230, 24, 'd'))),
    write([0, '100%'], '100%', 510, 230, 24, 'y'), write([0, '100%'], 'count up to 100%', 400, 300, 28, 'y'),
  ],
  // How many pieces make 100%?
  [
    tape([0, 'How'], 110), write([0, '25%'], '25%', mid(0), 135, 24),
    write([0, '100%'], '100%', 300, 40, 28), span([0, '100%'], 60, 540, 80),
    ...q([1, 2, 3].map(k => write([1, 'Count'], '25%', mid(k), 135, 24))),
    write([1, '25'], '25%', end(0), 220, 24, 'd'), write([1, '50'], '50%', end(1), 220, 24, 'd'),
    write([1, '75'], '75%', end(2), 220, 24, 'd'), write([1, '100'], '100%', 510, 220, 24, 'y'),
    write([1, '4'], '4 pieces', 300, 275, 32, 'y'),
    write([2, 'price'], 'price = 4 pieces', 300, 340, 30),
    wash([2, '15'], 60, 110, 120, 80, 'b'), write([2, '15'], '$15', mid(0), 170, 26),
  ],
  // Every piece is the same
  [
    tape([0, 'pieces'], 110), ...q([0, 1, 2, 3].map(k => write([0, 'equal'], '25%', mid(k), 135, 24))),
    wash([1, '15'], 60, 110, 120, 80, 'b'), write([1, '15'], '$15', mid(0), 170, 26),
    ...q([1, 2, 3].map(k => write([1, 'every'], '$15', mid(k), 170, 26))),
    write([1, 'piece'], 'each piece = $15', 300, 270, 32, 'y'),
  ],
  // Count up to 100%
  [
    tape([0, 'Now'], 110), ...q([0, 1, 2, 3].map(k => write([0, 'Now'], '$15', mid(k), 150, 26))),
    write([0, '15'], '15', end(0), 220, 26), write([0, '30'], '30', end(1), 220, 26),
    write([0, '45'], '45', end(2), 220, 26), write([0, '60'], '60', 515, 220, 26, 'y'),
    span([1, 'helmet'], 60, 540, 80), write([1, 'costs'], '4 × $15 = $60', 300, 300, 38, 'y'),
    write([1, '60'], '$60', 300, 45, 30, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'OF'], '25% of $15', 230, 165, 34),
    write([2, 'gives'], '= $3.75', 430, 165, 34, 'r'), cross([2, 'less'], 365, 140, 130, 50),
    write([2, 'piece'], '$15 = 1 piece', 300, 245, 30, 'b'),
    write([2, 'count'], '4 × $15 = $60', 300, 320, 38, 'y'),
  ],
]
