/** g3m4-t1's chalkboards: index = screen index (0 is Screen 1, which has none). Also the tile shapes t2–t4 draw with. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, box, wash, ticks, cross, ring } from '../../../chalk'
import { warn, tick, type At } from '../g3m1/t1'

export { warn, tick, type At }
const sq = (x: number, y: number, u: number) => `M${x} ${y} h${u} v${u} h${-u} Z`
/** `rows` × `cols` square tiles of `u` px, top-left at (x, y), as one stroke; `skip(r, c)` leaves a tile out. */
export const tiles = ([beat, at]: At, x: number, y: number, rows: number, cols: number, u: number, c: ChalkColor = 'w',
  skip: (r: number, c: number) => boolean = () => false): ChalkMark => ({
  beat, at, c, d: Array.from({ length: rows * cols }, (_, i) => [Math.floor(i / cols), i % cols])
    .filter(([r, k]) => !skip(r, k)).map(([r, k]) => sq(x + k * u, y + r * u, u)).join(' '),
})
/** Loose squares (a gap, an overlap), one stroke. */
export const loose = ([beat, at]: At, pts: [number, number][], u: number, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat, at, c, d: pts.map(([x, y]) => sq(x, y, u)).join(' ') })

// The playroom: 3 rows of 4 tiles.
export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // A ruler is not enough
  [
    box([0], 180, 100, 240, 180),
    box([0, 'ruler'], 180, 40, 240, 28, 'd'), ticks([0, 'ruler'], 180, 40, 240, 12, 10, 'd'),
    line([0, 'side'], [[180, 100], [420, 100]], 'b', 6), write([0, 'side'], 'one side', 100, 100, 24, 'b'),
    wash([1, 'inside'], 180, 100, 240, 180, 'y'), write([1, 'inside'], 'the whole inside', 300, 330, 30, 'y'),
    write([2, 'how'], 'how?', 510, 190, 30, 'd'),
    tiles([2, 'tiles'], 180, 100, 3, 4, 60),
  ],
  // The big idea: cover it all, no gaps, no overlaps
  [
    box([0, 'floor'], 60, 80, 240, 180),
    tiles([0, 'tiles'], 60, 80, 3, 4, 60),
    wash([0, 'cover'], 60, 80, 240, 180, 'y'),
    loose([0, 'gaps'], [[370, 90], [480, 90]], 50), write([0, 'gaps'], 'gap', 450, 172, 20, 'r'),
    cross([0, 'gaps'], 360, 80, 180, 70),
    loose([0, 'overlaps'], [[385, 200], [415, 228]], 50), write([0, 'overlaps'], 'overlap', 525, 240, 20, 'r'),
    cross([0, 'overlaps'], 370, 190, 110, 100),
  ],
  // Every tile is the same
  [
    box([0, 'tile'], 80, 130, 140, 140, 'b'),
    write([1, 'foot'], '1 ft', 150, 108, 24, 'b'),
    ...[[45, 200], [255, 200], [150, 294]].map(([x, y]) => ({ ...write([1, 'every'], '1 ft', x, y, 24, 'b'), quick: true })),
    tiles([2, 'Every'], 330, 110, 3, 4, 56), wash([2, 'same'], 330, 110, 56, 56, 'b'),
  ],
  // Count the tiles, a row at a time
  [
    tiles([0], 150, 60, 3, 4, 60),
    ...['4', '8', '12'].flatMap((n, r) => [
      { ...wash([1, n], 150, 60 + r * 60, 240, 60, 'y'), quick: true }, write([1, n], n, 440, 90 + r * 60, 36, 'y')]),
    write([2, 'tiles'], '12 tiles', 270, 325, 44, 'y'),
  ],
  // 1 square foot
  [
    tiles([0], 60, 80, 3, 4, 60),
    write([0, 'big'], 'how big?', 180, 42, 26, 'd'),
    wash([1, 'tile'], 60, 80, 60, 60, 'b'),
    { ...write([1, 'foot'], '1 ft', 90, 64, 20, 'b'), quick: true }, write([1, 'foot'], '1 ft', 34, 110, 20, 'b'),
    write([1, 'square'], '1 square foot', 450, 130, 30, 'b'),
    wash([2, 'cover'], 60, 80, 240, 180, 'y'),
    write([2, 'feet'], '12 square feet', 450, 230, 32, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    tiles([1, 'GAP'], 40, 150, 3, 4, 32, 'w', (r, k) => r === 1 && k === 2), ring([1, 'GAP'], 120, 198, 20, 20, 'r'),
    loose([1, 'overlap'], [[225, 160], [252, 187]], 44),
    write([2, 'gap'], 'gap', 104, 280, 24, 'r'), cross([2, 'misses'], 30, 140, 148, 116),
    write([2, 'overlap'], 'overlap', 272, 280, 24, 'r'), cross([2, 'twice'], 215, 150, 92, 92),
    tiles([2, 'Cover'], 410, 150, 3, 4, 32, 'y'), tick([2, 'once'], 460, 285),
  ],
]
