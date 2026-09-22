/** g7m4-t7's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The 3-4-5 wedge, 10 cm long, and its net: three strips 3, 4 and 5 wide and 10 long, a triangle end on each side of
 *  the 4 strip. Yellow is the triangle ends and the total, blue the sides, coral the mix-up. */
import type { ChalkMark, ChalkColor } from '../../../chalk'
import { write, line, cross } from '../../../chalk'

type At = [number, string?]
type Pt = [number, number]
const path = (pts: Pt[]) => `M${pts.map(p => p.join(' ')).join(' L')} Z`
const shape = ([beat, at]: At, pts: Pt[], c: ChalkColor = 'w'): ChalkMark => ({ beat, at, c, d: path(pts) })
const fill = ([beat, at]: At, pts: Pt[], c: ChalkColor): ChalkMark => ({ beat, at, c, d: path(pts), wash: true })

/** The net at scale k from (ox, oy): its faces as point lists. */
const net = (k: number, ox: number, oy: number) => {
  const x0 = ox + 3 * k, x1 = ox + 13 * k, y = (n: number) => oy + n * k
  const strip = (a: number, b: number): Pt[] => [[x0, y(a)], [x1, y(a)], [x1, y(b)], [x0, y(b)]]
  return {
    A: strip(0, 3), B: strip(3, 7), C: strip(7, 12),
    // the right angle sits at the 3 strip, so the 3 leg meets strip A and the long side faces strip C, as it folds
    L: [[x0, y(3)], [x0, y(7)], [ox, y(3)]] as Pt[],
    R: [[x1, y(3)], [x1, y(7)], [ox + 16 * k, y(3)]] as Pt[],
    mid: (n: number): Pt => [ox + 8 * k, y(n)],
    tri: (side: 'L' | 'R'): Pt => [side === 'L' ? ox + 2 * k : ox + 14 * k, oy + 4.3 * k],
  }
}
const drawNet = (at: At, k: number, ox: number, oy: number): ChalkMark[] => {
  const n = net(k, ox, oy)
  return [shape(at, n.A), shape(at, n.B), shape(at, n.C), shape(at, n.L), shape(at, n.R)]
}
/** The small net used on Screens 5 and 6, with each face's area written in. */
const S = net(16, 24, 100)
const small = (at: At): ChalkMark[] => [
  ...drawNet(at, 16, 24, 100),
  write(at, '10 cm', S.mid(0)[0], 86, 20, 'd'), write(at, '3 cm', 45, 124, 20, 'd'), write(at, '5 cm', 45, 252, 20, 'd'),
]
const area = (at: At, p: Pt, t: string, c: ChalkColor): ChalkMark => write(at, t, p[0], p[1], 24, c)
const col = (at: At, y: number, t: string, c: ChalkColor = 'w', s = 30): ChalkMark => write(at, t, 440, y, s, c)

// The wedge on Screen 2: front triangle, right angle bottom-left; back triangle pushed up and to the right.
const F: Pt[] = [[110, 300], [270, 300], [110, 180]], D: Pt = [200, -110]
const B = F.map(([x, y]) => [x + D[0], y + D[1]] as Pt)
const Big = net(24, 108, 60)

export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // Not the space inside
  [
    shape([0, 'Paint'], F), line([0, 'Paint'], [F[1], B[1]]), line([0, 'Paint'], [F[2], B[2]]), line([0, 'Paint'], [B[2], B[1]]),
    write([0, 'Paint'], '4 cm', 190, 326, 22, 'd'), write([0, 'Paint'], '3 cm', 72, 240, 22, 'd'),
    write([0, 'Paint'], '5 cm', 238, 226, 22, 'd'), write([0, 'Paint'], '10 cm', 405, 268, 22, 'd'),
    fill([0, 'outside'], F, 'y'), fill([0, 'outside'], [F[2], F[1], B[1], B[2]], 'y'),
    write([1, 'inside'], 'the space inside', 150, 368, 24, 'd'), cross([1, 'No'], 60, 358, 180, 20),
    write([1, 'faces'], 'the faces', 390, 368, 28, 'y'),
    write([2, 'many'], 'how many?', 530, 110, 26, 'y'),
  ],
  // The big idea: unfold, both ends and every side, add
  [
    ...drawNet([0, 'Unfold'], 24, 108, 60),
    fill([0, 'ends'], Big.L, 'y'), fill([0, 'ends'], Big.R, 'y'),
    fill([0, 'side'], Big.A, 'b'), fill([0, 'side'], Big.B, 'b'), fill([0, 'side'], Big.C, 'b'),
  ],
  // Unfold it
  [
    ...drawNet([0, 'flat'], 24, 108, 60),
    write([0, 'flat'], '10 cm', Big.mid(0)[0], 44, 22, 'd'),
    area([1, 'triangle'], Big.tri('L'), '1', 'y'), area([1, 'triangle'], Big.tri('R'), '2', 'y'),
    area([1, 'rectangle'], Big.mid(1.5), '1', 'b'), area([1, 'rectangle'], Big.mid(5), '2', 'b'), area([1, 'rectangle'], Big.mid(9.5), '3', 'b'),
  ],
  // Area of each face
  [
    ...small([0, 'face']),
    col([1, 'triangle'], 110, '1/2 × 4 × 3 = 6', 'y'), area([1, '6'], S.tri('L'), '6', 'y'), area([1, '6'], S.tri('R'), '6', 'y'),
    col([2, '30'], 180, '3 × 10 = 30', 'b'), area([2, '30'], S.mid(1.5), '30', 'b'),
    col([2, '40'], 240, '4 × 10 = 40', 'b'), area([2, '40'], S.mid(5), '40', 'b'),
    col([2, '50'], 300, '5 × 10 = 50', 'b'), area([2, '50'], S.mid(9.5), '50', 'b'),
  ],
  // Add every face
  [
    ...small([0, 'Count']),
    ...[S.tri('L'), S.tri('R')].map(p => ({ ...area([0, 'Count'], p, '6', 'y'), quick: true })),
    ...([[1.5, '30'], [5, '40'], [9.5, '50']] as const).map(([n, t]) => ({ ...area([0, 'Count'], S.mid(n), t, 'b'), quick: true })),
    col([0, '5'], 110, '5 faces', 'd', 26),
    col([1, '6'], 190, '6 + 6 + 30 + 40 + 50', 'w', 26), col([1, '132'], 245, '= 132', 'y', 38),
    col([2, 'square'], 320, '132 square cm', 'y', 28),
  ],
  // One thing not to do
  [
    line([0, 'mix'], [[300, 22], [340, 90], [260, 90], [300, 22]], 'r'), write([0, 'mix'], '!', 300, 68, 36, 'r'),
    write([1, 'ONE'], '6 + 30 + 40 + 50', 260, 160, 32), write([1, 'both'], 'two ends', 300, 215, 24, 'd'),
    write([2, 'twice'], '6 + 6 + 30 + 40 + 50 = 132', 300, 290, 32, 'y'),
    write([2, 'not'], '= 126', 450, 160, 32, 'r'), cross([2, 'not'], 412, 140, 80, 40),
  ],
]
