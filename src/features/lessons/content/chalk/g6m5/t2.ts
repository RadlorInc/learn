/** g6m5-t2's chalkboards: index = screen index (0 is Screen 1, which has none). */
import type { ChalkMark } from '../../../chalk'
import { write, box, arrow, cross, ring } from '../../../chalk'
import { warn, expr } from './t1'

type At = [beat: number, at?: string]
/** A strip labelled `name`, starting at x = 110: `n` cells of width w, each saying n. */
const strip = (at: At, name: string, y: number, w: number, n = 1): ChalkMark[] => [
  write(at, name, 62, y + 25, 24, 'd'),
  ...Array.from({ length: n }, (_, i) => box(at, 110 + i * w, y, w, 50)),
  ...Array.from({ length: n }, (_, i) => write(at, 'n', 110 + i * w + w / 2, y + 25, 30)),
]

// Colours across this topic: the piece added or taken away blue · the written answer yellow · the mix-up coral · labels dim.
export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // The words come in a funny order
  [
    write([0, 'say'], '5 more than n', 300, 55, 38), ring([0, 'first'], 193, 55, 15, 24, 'b'),
    write([0, 'write'], 'write 5 first?', 300, 110, 26, 'd'),
    ...strip([1, 'strips'], 'Mia', 160, 200), ...strip([1, 'strips'], 'Jon', 240, 200),
    box([2, '5'], 310, 240, 70, 50, 'b'), write([2, '5'], '5', 345, 265, 30, 'b'),
    arrow([2, 'end'], [450, 265], [392, 265], 'b'), write([2, 'end'], 'on the end', 500, 300, 22, 'b'),
    write([2, 'end'], 'n first, then 5', 300, 355, 28, 'y'),
  ],
  // The big idea: each phrase is an action
  [
    write([0, 'more'], 'more than', 220, 100, 36), write([0, 'adds'], '→  +', 400, 100, 40, 'y'),
    write([0, 'less'], 'less than', 220, 200, 36), write([0, 'away'], '→  −', 400, 200, 40, 'y'),
    write([0, 'times'], 'times', 220, 300, 36), write([0, 'multiplies'], '→  ×', 400, 300, 40, 'y'),
  ],
  // "More than" means add
  [
    ...strip([0, 'Jon'], 'Jon', 70, 200), box([0, '5'], 310, 70, 70, 50, 'b'), write([0, '5'], '5', 345, 95, 30, 'b'),
    write([1, 'add'], 'more than  →  +', 300, 205, 30),
    ...expr([1, '5'], ['n', '+', '5'], 300, 300, 56).map(m => ({ ...m, c: 'y' as const })),
  ],
  // "Times" means multiply
  [
    ...strip([0, 'Mia'], 'Mia', 50, 130),
    ...strip([0, 'strips'], 'Ali', 130, 130, 3),
    ...expr([1, 'write'], ['3', '×', 'n'], 230, 270, 48), write([1, 'just'], '=', 320, 270, 48),
    write([1, '3n'], '3n', 400, 270, 56, 'y'), write([1, '3n'], 'no sign', 400, 330, 22, 'd'),
  ],
  // "Less than" means take away
  [
    ...strip([0, 'Mia'], 'Mia', 50, 240),
    ...strip([0, 'Start'], 'Zoe', 130, 240),
    box([0, 'take'], 290, 130, 60, 50, 'b'), write([0, 'take'], '2', 320, 155, 30, 'b'), cross([0, 'away'], 297, 136, 46, 38),
    arrow([0, 'away'], [365, 155], [455, 155], 'b'), write([0, 'away'], 'take away', 520, 155, 24, 'b'),
    ...expr([1, 'n'], ['n', '−', '2'], 300, 260, 56).map(m => ({ ...m, c: 'y' as const })),
    ring([2, 'first'], 249, 262, 24, 30, 'b'), write([2, 'first'], 'n goes first', 300, 345, 26, 'b'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'less'], '2 less than n', 300, 150, 34),
    ...expr([1, 'not'], ['2', '−', 'n'], 300, 220, 52).map(m => ({ ...m, c: 'r' as const })), cross([1, 'not'], 222, 222, 156, 20),
    ...expr([2, 'away'], ['n', '−', '2'], 300, 320, 52).map(m => ({ ...m, c: 'y' as const })),
  ],
]
