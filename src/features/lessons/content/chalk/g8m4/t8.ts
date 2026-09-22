/** g8m4-t8's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The ladder triangle: the wall 4 up (the side we want), the ground 3 across, the ladder 5 (the long side, known). */
import type { ChalkMark } from '../../../chalk'
import { write, line, box, cross, ring, wash } from '../../../chalk'
import { warn } from '../g7m3/t1'
import { squares, q, type At } from './helpers-t6-t9'

// Right angle at (140, 240), 30 px a meter: the wall (4) runs up, the ground (3) runs right. Writing at x ≈ 480.
const F = squares(140, 240, 30, 4, 3)
const figure = (at: At): ChalkMark[] => [
  q(F.triangle(at)), q(F.corner(at)), q(F.square(at, 'left')), q(F.square(at, 'bottom')), q(F.square(at, 'long')),
]
/** A ladder from its foot to its top: two rails and the rungs between them. */
const ladder = ([beat, at]: At, foot: [number, number], top: [number, number]): ChalkMark => {
  const dx = top[0] - foot[0], dy = top[1] - foot[1], L = Math.hypot(dx, dy), px = (-dy / L) * 7, py = (dx / L) * 7
  const d = [`M${foot[0] + px} ${foot[1] + py} L${top[0] + px} ${top[1] + py}`, `M${foot[0] - px} ${foot[1] - py} L${top[0] - px} ${top[1] - py}`]
  for (let t = 0.12; t < 0.95; t += 0.12) {
    const x = foot[0] + dx * t, y = foot[1] + dy * t
    d.push(`M${Math.round(x + px)} ${Math.round(y + py)} L${Math.round(x - px)} ${Math.round(y - py)}`)
  }
  return { beat, at, c: 'y', d: d.join(' ') }
}

export const T8: (ChalkMark[] | undefined)[] = [
  undefined,
  // This time the long side is known: the wall, the ground and the ladder
  [
    line([0], [[120, 60], [120, 340], [380, 340]]), ladder([0, 'Careful'], [300, 340], [120, 100]),
    write([0, 'changed'], '3 m', 210, 372, 24), write([0, 'changed'], '5 m', 252, 212, 24, 'y'), write([0, 'changed'], '?', 92, 220, 30),
    write([1, 'long'], 'ladder = long side', 480, 110, 26, 'y'), write([1, 'know'], 'known: 5 m', 480, 160, 26, 'y'),
    write([2, 'add'], 'add the squares?', 480, 240, 26, 'r'), cross([2, 'No'], 385, 222, 190, 36),
    write([2, 'taller'], 'wall > ladder', 480, 300, 28, 'r'),
  ],
  // The big idea: yellow square − blue square = the white square, then its side
  [
    F.triangle([0]), F.corner([0]),
    F.fill([0, 'long'], 'long', 'y'), F.square([0, 'long'], 'long', 'y'),
    F.fill([0, 'short'], 'bottom', 'b'), F.square([0, 'short'], 'bottom', 'b'),
    wash([0, 'away'], 385, 70, 70, 70, 'y'), box([0, 'away'], 385, 70, 70, 70, 'y'), write([0, 'away'], '−', 480, 105, 34),
    wash([0, 'away'], 510, 85, 40, 40, 'b'), box([0, 'away'], 510, 85, 40, 40, 'b'),
    write([0, 'then'], '=', 420, 215, 34), box([0, 'then'], 455, 185, 58, 58), F.square([0, 'then'], 'left'),
    line([0, 'undo'], [[455, 262], [513, 262]], 'y', 5), line([0, 'undo'], [[140, 240], [140, 120]], 'y', 5),
  ],
  // The squares again
  [
    ...figure([0, 'Build']),
    F.label([1, '25'], 'long', '25', 40), write([1, '25'], '5 × 5 = 25', 480, 110, 30),
    F.label([1, '9'], 'bottom', '9', 40), write([1, '9'], '3 × 3 = 9', 480, 175, 30),
    F.label([2, 'wall'], 'left', '?', 44, 'w'), ring([2, 'hunting'], F.centre('left')[0], F.centre('left')[1], 34, 34, 'y'),
  ],
  // Take away
  [
    ...figure([0]), q(F.label([0], 'long', '25', 40, 'w')), q(F.label([0], 'bottom', '9', 40, 'w')),
    write([0, 'fill'], '? + 9 = 25', 480, 110, 30),
    write([1, 'left'], '25 − 9', 468, 185, 30),
    write([2, '16'], '= 16', 548, 185, 30, 'y'), F.label([2, '16'], 'left', '16', 40),
  ],
  // Undo the square
  [
    ...figure([0]), q(F.label([0], 'long', '25', 40, 'w')), q(F.label([0], 'bottom', '9', 40, 'w')), q(F.label([0], 'left', '16', 40, 'w')),
    write([0, 'Which'], '? × ? = 16', 480, 110, 30),
    write([1, '4'], '4 × 4 = 16', 480, 175, 30, 'y'),
    line([2, 'wall'], [[140, 240], [140, 120]], 'y', 6), write([2, 'meters'], '4 m up the wall', 480, 260, 26, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'ADD'], '25 + 9 = 34', 300, 150, 36),
    cross([2, 'taller'], 190, 128, 220, 44),
    write([2, 'away'], '25 − 9 = 16', 300, 235, 36, 'y'),
  ],
]
