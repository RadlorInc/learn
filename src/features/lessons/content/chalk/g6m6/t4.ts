/** g6m6-t4's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, arrow, cross } from '../../../chalk'
import { block, DX, DY } from '../g5m5/t1'
import { warn, tick, type At } from '../g3m1/t1'
// Colours across these boards: white = the box and its unfolded sides, blue = the cubes inside (the other rule),
// yellow = the areas and the paper, coral = the mix-up, dim = sizes and names.
// The gift box is 4 long, 3 wide, 2 tall, always drawn to that proportion. Unfolded, its sides are a column
// back, top, front, bottom (each shares a long edge with the next, so the column rolls round the box) with an end
// on each side of the front: every edge that meets matches in length, so it folds back into the box.

const L = 4, W = 3, H = 2
type Face = { x: number; y: number; w: number; h: number }
/** The six sides laid flat, top-left at (x, y), `u` px to a centimeter. */
const faces = (x: number, y: number, u: number): Record<'back' | 'top' | 'front' | 'bottom' | 'endL' | 'endR', Face> => {
  const cx = x + W * u, fy = y + (H + W) * u
  return {
    back: { x: cx, y, w: L * u, h: H * u },
    top: { x: cx, y: y + H * u, w: L * u, h: W * u },
    front: { x: cx, y: fy, w: L * u, h: H * u },
    bottom: { x: cx, y: fy + H * u, w: L * u, h: W * u },
    endL: { x, y: fy, w: W * u, h: H * u },
    endR: { x: cx + L * u, y: fy, w: W * u, h: H * u },
  }
}
const mid = (f: Face): [number, number] => [f.x + f.w / 2, f.y + f.h / 2]
/** The flat box as one stroke, every side outlined. */
const flat = ([beat, at]: At, x: number, y: number, u: number, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat, at, c, d: Object.values(faces(x, y, u)).map(f => `M${f.x} ${f.y} h${f.w} v${f.h} h${-f.w} Z`).join(' ') })
/** A number written in the middle of each named side. */
const inFaces = (at: At, fs: Face[], t: string, s: number, c: ChalkColor): ChalkMark[] =>
  fs.map(f => ({ ...write(at, t, mid(f)[0], mid(f)[1], s, c), quick: true }))

/** The three sides of the box drawn by `block` that can be seen: front, top and the right end, as corners. */
const seen = (x: number, y: number, u: number) => {
  const dx = DX * u * W, dy = DY * u * W, top = y - H * u, R = x + L * u
  return {
    front: [[x, y], [R, y], [R, top], [x, top]],
    top: [[x, top], [R, top], [R + dx, top + dy], [x + dx, top + dy]],
    end: [[R, y], [R, top], [R + dx, top + dy], [R + dx, y + dy]],
    hidden: `M${x + dx} ${y + dy} L${x} ${y} M${x + dx} ${y + dy} L${R + dx} ${y + dy} M${x + dx} ${y + dy} L${x + dx} ${top + dy}`,
  }
}
const centre = (p: number[][]): [number, number] => [p.reduce((a, q) => a + q[0], 0) / 4, p.reduce((a, q) => a + q[1], 0) / 4]
const fill = ([beat, at]: At, p: number[][], c: ChalkColor): ChalkMark =>
  ({ beat, at, c, wash: true, quick: true, d: `M${p.map(q => q.join(' ')).join(' L')} Z` })

const B2 = seen(60, 320, 60)
const B7 = seen(40, 300, 45)
const F3 = faces(290, 60, 28), F4 = faces(250, 40, 32), F5 = faces(20, 50, 30), F6 = faces(30, 30, 20)

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // This is not the inside
  [
    block([0, 'Length'], 60, 320, L, W, H, 60, 'w', false),
    write([0, 'Length'], '4 cm', 180, 350, 22, 'd'), write([0, 'width'], '3 cm', 385, 305, 22, 'd'), write([0, 'height'], '2 cm', 34, 260, 22, 'd'),
    block([0, 'cubes'], 60, 320, L, W, H, 60, 'b'),
    write([0, 'inside'], 'cubes inside', 500, 110, 26, 'b'),
    block([1, 'wraps'], 60, 320, L, W, H, 60, 'y', false),
    write([1, 'outside'], 'paper outside', 500, 170, 26, 'y'),
    write([2, 'what'], 'add up?', 500, 240, 30),
    fill([2, 'Every'], B2.front, 'y'), fill([2, 'Every'], B2.top, 'y'), fill([2, 'side'], B2.end, 'y'),
  ],
  // The big idea: unfold it flat, add the areas of all 6
  [
    block([0, 'box'], 40, 240, L, W, H, 40, 'w', false),
    arrow([0, 'flat'], [185, 275], [280, 275]),
    flat([0, 'flat'], 290, 60, 28),
    ...Object.values(F3).map(f => ({ ...fill([0, 'areas'], [[f.x, f.y], [f.x + f.w, f.y], [f.x + f.w, f.y + f.h], [f.x, f.y + f.h]], 'y') })),
    ...Object.values(F3).map((f, i) => ({ ...write([0, '6'], String(i + 1), mid(f)[0], mid(f)[1], 26), quick: true })),
  ],
  // Unfold it
  [
    block([0, 'Cut'], 30, 150, L, W, H, 36, 'w', false),
    arrow([0, 'open'], [150, 185], [240, 185]),
    flat([0, 'flat'], 250, 40, 32),
    write([1, 'bottom'], 'bottom', ...mid(F4.bottom), 24, 'd'),
    write([1, 'front'], 'front', ...mid(F4.front), 24, 'd'),
    write([1, 'top'], 'top', ...mid(F4.top), 24, 'd'),
    write([1, 'back'], 'back', ...mid(F4.back), 24, 'd'),
    { ...write([1, 'end'], 'end', ...mid(F4.endL), 24, 'd'), quick: true }, write([1, 'side'], 'end', ...mid(F4.endR), 24, 'd'),
    write([2, '6'], '6 flat sides', 125, 250, 30, 'y'),
  ],
  // Area of each flat side
  [
    flat([0], 20, 50, 30),
    write([0, 'top'], 'top, bottom', 460, 75, 22, 'd'),
    write([0, '4'], '4', 170, 373, 22, 'd'), write([0, '3'], '3', 96, 305, 22, 'd'),
    write([0, '4'], '4 × 3', 430, 115, 30), write([0, '12'], '= 12', 505, 115, 30, 'y'),
    ...inFaces([0, '12'], [F5.top, F5.bottom], '12', 30, 'y'),
    write([1, 'front'], 'front, back', 460, 185, 22, 'd'),
    write([1, '2'], '2', 96, 80, 22, 'd'),
    write([1, '4'], '4 × 2', 430, 225, 30), write([1, '8'], '= 8', 497, 225, 30, 'y'),
    ...inFaces([1, '8'], [F5.front, F5.back], '8', 30, 'y'),
    write([2, 'ends'], 'ends', 460, 295, 22, 'd'),
    write([2, '3'], '3 × 2', 430, 335, 30), write([2, '6'], '= 6', 497, 335, 30, 'y'),
    ...inFaces([2, '6'], [F5.endL, F5.endR], '6', 30, 'y'),
  ],
  // Add all six
  [
    flat([0], 30, 30, 20),
    ...inFaces([0], [F6.top, F6.bottom], '12', 20, 'y'), ...inFaces([0], [F6.front, F6.back], '8', 20, 'y'),
    ...inFaces([0], [F6.endL, F6.endR], '6', 20, 'y'),
    write([0, 'add'], '12 + 12 + 8 + 8 + 6 + 6', 270, 300, 32),
    write([0, '52'], '= 52', 510, 300, 32, 'y'),
    write([1, 'square'], '52 square cm', 420, 130, 36, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    block([1, 'sides'], 40, 300, L, W, H, 45, 'w', false),
    write([1, 'SEE'], '12', ...centre(B7.top), 26), write([1, 'SEE'], '8', 160, 272, 26), write([1, 'SEE'], '6', ...centre(B7.end), 26),
    write([2, '26'], '12 + 8 + 6 = 26', 450, 200, 30, 'r'), cross([2, 'half'], 335, 180, 230, 40),
    { beat: 3, at: 'partner', c: 'd', w: 2, d: B7.hidden },
    write([3, '52'], '12 + 12 + 8 + 8 + 6 + 6 = 52', 290, 360, 30, 'y'), tick([3, '52'], 520, 360),
  ],
]
