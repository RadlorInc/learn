/** g4m2-t7's chalkboards: index = screen index (0 is Screen 1, which has none). A sheet = 10 stickers. Blue = tens, yellow = the result, coral = the slip. */
import type { ChalkColor, ChalkMark } from '../../../chalk'
import { write, box, ring, cross, person, clock } from '../../../chalk'
import { warn, tick, type At } from '../g3m1/t1'

/** Sheets of 10 stickers: a small box with 10 written in it, each one mark. */
const sheets = (at: At, xs: number[], y: number, c: ChalkColor = 'b'): ChalkMark[] =>
  xs.flatMap(x => [{ ...box(at, x - 22, y, 44, 56, c), quick: true }, { ...write(at, '10', x, y + 28, 22, c), quick: true }])
const row8 = (y: number) => Array.from({ length: 8 }, (_, i) => 90 + i * 60)
const FX = [120, 240, 360, 480]

export const T7: (ChalkMark[] | undefined)[] = [
  undefined,
  // One at a time is slow
  [
    write([0, 'one'], '1, 2, 3, 4, 5, ... 80', 300, 60, 32),
    clock([0, 'while'], 240, 130, 28), write([0, 'while'], 'a long while', 360, 130, 26, 'd'),
    write([1, 'faster'], 'faster way?', 300, 215, 32, 'y'),
    ...sheets([1, 'tens'], row8(0), 270),
  ],
  // The big idea (a smaller example: 6 tens shared by 2)
  [
    ...sheets([0, 'Share'], [130, 190, 250, 350, 410, 470], 40),
    ring([0, 'tens'], 190, 68, 100, 48, 'w'), ring([0, 'tens'], 410, 68, 100, 48, 'w'),
    write([0, 'tens'], '6 tens ÷ 2 = 3 tens', 300, 200, 34, 'b'),
    write([0, 'number'], '3 tens = 30', 300, 290, 40, 'y'),
  ],
  // Count the tens
  [
    write([0, '80'], '80 stickers', 300, 45, 32),
    ...sheets([0, 'sheets'], row8(0), 90),
    write([1, 'tens'], '80 = 8 tens', 300, 220, 38, 'b'),
    write([1, 'share'], 'share sheets, not stickers', 300, 300, 30),
  ],
  // Share the tens
  [
    ...FX.map(x => ({ ...person([0, 'friends'], x, 130, 80), quick: true })),
    ...sheets([0, 'sheet'], FX, 150),
    ...sheets([0, 'again'], FX, 215),
    write([1, 'each'], '2 sheets each', 300, 310, 30),
    write([1, 'So'], '8 tens ÷ 4 = 2 tens', 300, 360, 34, 'y'),
  ],
  // Write the tens
  [
    ...sheets([0, 'tens'], [250, 310], 40),
    write([0, '20'], '2 tens = 20', 300, 150, 38, 'y'),
    write([1, '80'], '80 ÷ 4 = 20', 300, 235, 44, 'y'),
    person([1, 'friend'], 230, 380, 90), write([1, 'stickers'], '20 stickers', 360, 335, 32, 'y'),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, '2'], '80 ÷ 4 = 2', 160, 175, 36, 'r'), cross([1, '2'], 60, 150, 200, 50),
    write([1, 'end'], 'tens dropped', 160, 225, 24, 'r'),
    write([2, 'tens'], '2 tens each', 450, 185, 32, 'b'),
    write([2, '20'], '80 ÷ 4 = 20', 290, 310, 44, 'y'), tick([2, '20'], 440, 310),
  ],
]
