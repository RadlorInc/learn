/** g5m3-t6's chalkboards: index = screen index (0 is Screen 1, which has none). A yard of ribbon is a bar; both yards the same length. */
import type { ChalkMark } from '../../../chalk'
import { write, span, cross, person, hop, box, wash } from '../../../chalk'
import { row, crossRow, cells, shade, warn, cut, bar, type Tok, yel } from './t5'

/** A small bow: two triangles meeting at (x, y). */
const bow = (at: [number, string?], x: number, y: number): ChalkMark =>
  ({ beat: at[0], at: at[1], c: 'y', d: `M${x} ${y} L${x - 22} ${y - 16} L${x - 22} ${y + 16} Z M${x} ${y} L${x + 22} ${y - 16} L${x + 22} ${y + 16} Z` })
const wrong7: Tok[] = [[[1, '1/2'], '2', 'r'], [[1, '1/2'], '÷', 'r'], [[1, '1/2'], ['1', '4'], 'r'], [[1, '1/2'], '=', 'r'], [[1, '1/2'], ['1', '2'], 'r']]

export const T6: (ChalkMark[] | undefined)[] = [
  undefined,
  // Sharing does not fit
  [
    ...row([[[0, 'dividing'], '2'], [[0, 'dividing'], '÷'], [[0, 'dividing'], ['1', '4']]], 300, 65, 40),
    write([0, 'sharing'], 'usually: share', 300, 140, 26, 'd'),
    { ...cells([1, 'yards'], 50, 190, 150, 45, 1), quick: true }, cells([1, 'yards'], 210, 190, 150, 45, 1),
    write([1, 'yards'], '2 yards', 205, 262, 24, 'd'),
    person([1, 'friend'], 480, 262, 80), ...row([[[1, 'friend'], ['1', '4']], [[1, 'friend'], 'of a friend?']], 470, 320, 24),
    cross([1, 'No'], 385, 172, 175, 185),
    write([2, 'else'], 'a different question', 300, 375, 30, 'y'),
  ],
  // The big idea: how many small pieces fit?
  [
    cells([0, 'Dividing'], 90, 110, 420, 60, 1),
    wash([0, 'small'], 90, 25, 105, 40, 'y'), box([0, 'small'], 90, 25, 105, 40, 'y'), write([0, 'piece'], 'a small piece', 340, 45, 26, 'd'),
    write([0, 'many'], 'how many?', 300, 300, 34, 'y'),
    ...[195, 300, 405].map(cx => cut([0, 'fit'], cx, 110, 170, 'd')),
    ...[90, 195, 300, 405].map(x0 => ({ ...hop([0, 'fit'], x0, x0 + 105, 108, 'y'), quick: true })),
    ...[1, 2, 3, 4].map(i => ({ ...write([0, 'fit'], String(i), 37 + 105 * i, 205, 28, 'y'), quick: true })),
  ],
  // Cut each yard into fourths
  [
    bow([0, 'bow'], 110, 70),
    ...row([[[0, 'bow'], '1 bow ='], [[0, '1/4'], ['1', '4']], [[0, 'yard'], 'yard']], 330, 70, 34),
    { ...cells([1, 'every'], 40, 150, 250, 70, 1), quick: true }, cells([1, 'every'], 310, 150, 250, 70, 1),
    { ...write([1, 'yard'], '1 yard', 165, 250, 22, 'd'), quick: true }, write([1, 'yard'], '1 yard', 435, 250, 22, 'd'),
    ...[102.5, 165, 227.5, 372.5, 435, 497.5].map(cx => cut([1, '4'], cx, 150, 220, 'b')),
    write([1, 'bow'], '1 piece = 1 bow', 300, 320, 30, 'y'),
  ],
  // Count the pieces
  [
    { ...cells([0, 'count'], 40, 90, 250, 70, 4), quick: true }, cells([0, 'count'], 310, 90, 250, 70, 4),
    shade([1, 'first'], 40, 90, 250, 70, 4, 4), span([1, '4'], 40, 290, 190, 'b'), write([1, '4'], '4', 165, 225, 30, 'b'),
    shade([1, 'second'], 310, 90, 250, 70, 4, 4), span([1, 'more'], 310, 560, 190, 'b'), write([1, 'more'], '4 more', 435, 225, 30, 'b'),
    write([2, '8'], '8 pieces', 230, 320, 34, 'y'), write([2, 'bows'], '= 8 bows', 378, 320, 34, 'y'),
  ],
  // Put it together
  [
    ...bar([0, 'fourths'], 90, 45, 200, 45, 4, 4), ...bar([0, 'fourths'], 310, 45, 200, 45, 4, 4),
    write([0, 'fit'], '8 fourths', 230, 128, 30, 'y'), write([0, 'yards'], 'in 2 yards', 390, 128, 30, 'd'),
    ...row([[[1, 'asks'], '2'], [[1, 'asks'], '÷'], [[1, 'asks'], ['1', '4']], [[1, '8'], '=', 'y'], [[1, '8'], '8', 'y']], 300, 212, 40),
    write([2, 'holds'], 'each yard holds 4', 300, 292, 26, 'd'),
    ...row([[[2, 'hold'], '2 × 4 ='], [[2, '8'], '8', 'y']], 300, 350, 34),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...row(wrong7, 300, 172, 40), crossRow([1, 'NOT'], wrong7, 300, 172, 3, 4, 40),
    ...bar([2, 'pieces'], 60, 250, 110, 34, 4, 4), ...bar([2, 'pieces'], 180, 250, 110, 34, 4, 4),
    ...row(([[[2, 'bigger'], '2'], [[2, 'bigger'], '÷'], [[2, 'bigger'], ['1', '4']], [[2, 'bigger'], '='], [[2, 'bigger'], '8']] as Tok[]).map(yel), 440, 267, 32),
    write([2, '2'], 'bigger than 2', 300, 355, 28, 'y'),
  ],
]
