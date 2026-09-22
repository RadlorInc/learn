/** g8m6-t2's chalkboards: index = screen index (0 is Screen 1, which has none).
 *  The ten study dots (hours 0–6, scores 40–100) on the left; words on the right.
 *  Yellow is the line that fits and the dots above it, blue the dots below and the run, coral the mix-up. */
import type { ChalkMark } from '../../../chalk'
import { write, line, arrow, cross } from '../../../chalk'
import { warn } from '../g7m1/t1'
import { scatter } from './t1'

type At = [number, string?]
type Pt = [number, number]
const ABOVE: Pt[] = [[1, 62], [2, 68], [3, 72], [4, 82], [5, 88]]
const BELOW: Pt[] = [[1, 55], [2, 60], [3, 68], [4, 75], [5, 82]]
const ALL = [...ABOVE, ...BELOW]
const S = scatter(70, 320, 270, 260, 6, 40, 100)
const cloud = (at: At): ChalkMark[] => [...S.axes(at, [1, 2, 3, 4, 5, 6], [50, 70, 90], 'hours studied', 'score'), ...S.dots(at, ALL)]
const fit = (at: At) => S.seg(at, [0, 50], [6, 92], 'y', 4)
const C = 475

/** A small rising cloud (no numbers) with a line through it, bottom-left at (x0, y0), 200 × 150. */
const mini = (at: At, x0: number, y0: number, lineAt: At, high: boolean): ChalkMark[] => {
  const m = scatter(x0, y0, 200, 150, 6, 40, 100)
  return [line(at, [[x0, y0 - 160], [x0, y0], [x0 + 210, y0]], 'd'), ...m.dots(at, ALL, 'w', 4),
    high ? m.seg(lineAt, [0, 70], [6, 100], 'w') : m.seg(lineAt, [0, 50], [6, 92], 'y', 4)]
}

export const T2: (ChalkMark[] | undefined)[] = [
  undefined,
  // A line that rises is not enough
  [
    ...cloud([0, 'Here']), S.seg([0, 'rises'], [0, 70], [6, 100], 'b'),
    write([0, 'fit'], 'a good fit?', C, 100, 28),
    write([1, 'below'], '10 dots below', C, 165, 28, 'b'), write([1, 'below'], '0 above', C, 210, 28, 'b'),
    write([2, 'misses'], 'misses the cloud', C, 285, 28, 'r'),
  ],
  // The big idea: through the middle, as many above as below
  [
    ...cloud([0, 'line']), fit([0, 'middle']),
    ...S.dots([0, 'above'], ABOVE, 'y'), write([0, 'above'], 'above', C, 130, 30, 'y'),
    write([0, 'as'], '=', C, 180, 32), ...S.dots([0, 'below'], BELOW, 'b'), write([0, 'below'], 'below', C, 230, 30, 'b'),
  ],
  // Tilt it, then slide it in
  [
    ...cloud([0, "Let's"]), S.seg([0, 'tilt'], [0, 62], [6, 104], 'd'), write([0, 'tilt'], 'tilt it', C, 100, 30),
    arrow([1, 'slide'], [360, 60], [360, 108], 'b'), write([1, 'slide'], 'slide it down', C, 170, 30, 'b'),
    fit([1, 'middle']), write([1, 'middle'], 'through the middle', C, 240, 26, 'y'),
  ],
  // Count above and below
  [
    ...cloud([0, 'Now']), fit([0, 'Now']),
    ...S.dots([0, 'above'], ABOVE, 'y'), write([0, '5'], '5 above', C, 110, 32, 'y'),
    ...S.dots([1, 'below'], BELOW, 'b'), write([1, '5'], '5 below', C, 170, 32, 'b'),
    write([2, 'balanced'], 'balanced', C, 250, 36, 'y'),
  ],
  // How steep is it?
  [
    ...S.axes([0, 'Our'], [1, 2, 3, 4, 5, 6], [50, 70, 90], 'hours studied', 'score'), ...S.dots([0, 'Our'], ALL, 'd'), fit([0, 'line']),
    ...S.dots([0, '50'], [[0, 50]], 'y', 6), write([0, '50'], '(0, 50)', 125, 300, 20, 'y'),
    ...S.dots([0, '92'], [[6, 92]], 'y', 6), write([0, '92'], '(6, 92)', 290, 72, 20, 'y'),
    write([0, 'steep'], 'how steep?', C, 70, 28),
    S.seg([1, 'rise'], [6, 50], [6, 92], 'y'), write([1, '42'], 'rise 92 − 50 = 42', C, 130, 24, 'y'),
    S.seg([1, 'run'], [0, 50], [6, 50], 'b'), write([1, 'run'], 'run 6 − 0 = 6', C, 180, 24, 'b'),
    write([2, '7'], '42 ÷ 6 = 7', C, 250, 36, 'y'), write([2, 'hour'], '7 points an hour', C, 305, 26),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...mini([1, "Don't"], 60, 290, [1, 'line'], true), write([1, 'rises'], 'it rises', 170, 340, 28, 'r'),
    cross([1, 'JUST'], 284, 132, 30, 30),
    ...mini([2, 'Count'], 340, 290, [2, 'move'], false), write([2, 'balance'], '5 above, 5 below', 450, 340, 26, 'y'),
  ],
]
