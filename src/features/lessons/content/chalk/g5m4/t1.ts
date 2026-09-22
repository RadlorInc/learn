/** g5m4-t1's chalkboards: index = screen index (0 is Screen 1, which has none). Also the decimal chart t2 draws with. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, line, cells, wash, cross } from '../../../chalk'
import { q, warn, type At } from '../g4m1/t5'

export { q, warn, type At }

/** A decimal chart: ones, tenths, hundredths, thousandths — four columns 105 wide from x = 120 to 540. */
export const CX = [172, 277, 382, 487]
export const PLACES = ['ones', 'tenths', 'hundredths', 'thousandths']
/** The decimal point: a round dot on the line between the ones and the tenths, sitting low like a written point. */
export const dot = (at: At, x: number, y: number, c: ChalkColor = 'w'): ChalkMark =>
  ({ beat: at[0], at: at[1], c, w: 6, d: `M${x - 4} ${y} a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0` })
export const heads = (at: At, y: number, n = 4, c: ChalkColor = 'd'): ChalkMark[] =>
  q(PLACES.slice(0, n).map((h, i) => write(at, h, CX[i], y, 20, c)))
/** One row of the chart, top at y, 60 high, with its point. */
export const grid = (at: At, y: number, n = 4, h = 60): ChalkMark[] => [cells(at, 120, y, 105 * n, h, n), dot(at, 225, y + h / 2 + 14)]
/** One digit into column i of a row whose middle is y. */
export const dig = (at: At, d: string, i: number, y: number, c: ChalkColor = 'w'): ChalkMark => write(at, d, CX[i], y, 40, c)
/** A number written digit by digit, `dx` apart from x0, its point a dot — so two numbers line up exactly. */
export const numAt = (at: At, t: string, x0: number, y: number, s = 44, c: ChalkColor = 'w', dx = s * 0.55): ChalkMark[] => {
  const out: ChalkMark[] = []
  let x = x0
  for (const ch of t) {
    if (ch === '.') { out.push(dot(at, x - dx * 0.2, y + s * 0.17, c)); x += dx * 0.6; continue }
    out.push(write(at, ch, x, y, s, c)); x += dx
  }
  return q(out)
}

// Colours: yellow = the thousandths and the number they make, blue = a 0 put in an empty place, coral = too heavy / the slip.
export const T1: (ChalkMark[] | undefined)[] = [
  undefined,
  // Hundredths are too big
  [
    ...grid([0, 'know'], 65, 3), ...heads([0, 'tenths'], 45, 2), ...heads([0, 'hundredths'], 45, 3).slice(2),
    write([1, 'hundredth'], '1 hundredth of a gram', 300, 185, 30),
    write([1, 'heavy'], 'too heavy for the seed', 300, 232, 30, 'r'),
    write([2, '47'], '47 thousandths', 300, 300, 34, 'y'),
    { ...line([2, 'smaller'], [[435, 65], [540, 65], [540, 125], [435, 125]], 'b') },
    write([2, 'smaller'], '?', CX[3], 95, 40, 'b'),
  ],
  // The big idea: the third place after the point is thousandths
  [
    ...heads([0, 'third'], 60, 3), ...grid([0, 'third'], 80),
    ...q(['1st', '2nd', '3rd'].map((t, i) => write([0, 'third'], t, CX[i + 1], 175, 22, i === 2 ? 'y' : 'd'))),
    write([0, 'thousandths'], 'thousandths', CX[3], 60, 20, 'y'),
    write([0, '47'], '47 thousandths', 210, 280, 32),
    ...q([dig([0, '0.047'], '0', 0, 110, 'y'), dig([0, '0.047'], '0', 1, 110, 'y'), dig([0, '0.047'], '4', 2, 110, 'y'), dig([0, '0.047'], '7', 3, 110, 'y')]),
    write([0, '0.047'], '= 0.047', 410, 280, 36, 'y'),
  ],
  // Cut it smaller
  [
    { ...line([0, 'hundredth'], [[60, 70], [540, 70], [540, 140], [60, 140], [60, 70]]) }, write([0, 'hundredth'], '1 hundredth', 300, 42, 24, 'd'),
    { ...line([0, '10'], [[0, 0]], 'w'), d: Array.from({ length: 9 }, (_, i) => `M${60 + 48 * (i + 1)} 70 v70`).join(' ') },
    wash([1, 'piece'], 60, 70, 48, 70, 'y'), write([1, 'thousandth'], '1 thousandth', 130, 175, 26, 'y'),
    write([1, '0.001'], '= 0.001', 300, 175, 30, 'y'),
    write([2, '1,000'], '1,000 thousandths', 220, 265, 32), write([2, 'whole'], '= 1 whole', 450, 265, 32),
  ],
  // Build 47 thousandths
  [
    write([0, '47'], '47 thousandths', 300, 50, 36, 'y'),
    write([1, '4'], '4 hundredths', 190, 115, 30), write([1, 'and'], '+', 325, 115, 30), write([1, '7'], '7 thousandths', 450, 115, 30),
    ...heads([2, 'So'], 180), ...grid([2, 'So'], 200),
    dig([2, '4'], '4', 2, 230, 'y'), dig([2, '7'], '7', 3, 230, 'y'),
  ],
  // Write it with a point
  [
    ...heads([0, 'There'], 50), ...grid([0, 'There'], 70), ...q([dig([0, 'There'], '4', 2, 100), dig([0, 'There'], '7', 3, 100)]),
    dig([0, 'ones'], '0', 0, 100, 'b'), dig([0, 'tenths'], '0', 1, 100, 'b'),
    { ...line([1, 'across'], [[140, 165], [520, 165]], 'd'), d: 'M140 165 H520 M506 157 L520 165 L506 173', w: 2.5 },
    ...numAt([1, '0.047'], '0.047', 205, 250, 56, 'y'), write([1, 'grams'], 'grams', 440, 250, 36, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    ...numAt([1, '0.47'], '0.47', 262, 160, 44, 'r'), cross([1, '0.47'], 240, 132, 110, 56),
    write([1, 'HUNDREDTHS'], '= 47 hundredths', 300, 212, 24, 'r'),
    write([2, 'Thousandths'], '47 thousandths', 170, 300, 30),
    ...numAt([2, 'Thousandths'], '0.047', 330, 300, 44, 'y'),
    { ...line([2, 'three'], [[0, 0]], 'b'), d: 'M355 335 h22 M379 335 h22 M404 335 h22', w: 3 }, write([2, 'places'], '3 places', 390, 365, 22, 'b'),
  ],
]
