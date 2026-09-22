/** g7m2-t4's chalkboards: index = screen index (0 is Screen 1, which has none). Same number line as t1. */
import type { ChalkMark } from '../../../chalk'
import { write, arrow, cross, ring } from '../../../chalk'
import { nx, numLine, under, dot, jump, countHops, warn } from './t1'

export const T4: (ChalkMark[] | undefined)[] = [
  undefined,
  // Two minus signs, two jobs
  [
    write([0, 'write'], '−3', 225, 85, 56), write([0, 'write'], '−', 315, 85, 56), write([0, 'write'], '5', 385, 85, 56),
    ring([1, 'two'], 206, 85, 15, 24, 'y'), ring([1, 'signs'], 315, 85, 18, 24, 'y'),
    write([1, 'same'], 'same job?', 490, 85, 26, 'r'),
    arrow([2, 'first'], [175, 165], [205, 120], 'b'), write([2, 'first'], 'part of the number', 160, 190, 22, 'b'),
    arrow([2, 'second'], [390, 165], [325, 120], 'r'), write([2, 'second'], 'take away', 420, 190, 22, 'r'),
    write([3, 'adding'], 'take away  →  add', 300, 300, 36, 'y'),
  ],
  // The big idea: −3 − 5 is −3 + (−5)
  [
    write([0, 'Taking'], '−3 − 5', 300, 80, 44), write([0, 'away'], 'take away 5', 300, 130, 22, 'd'),
    write([0, 'same'], 'same as', 300, 190, 26, 'd'),
    write([0, 'adding'], '−3 + (−5)', 300, 255, 44, 'y'), write([0, 'opposite'], 'add the opposite, −5', 300, 305, 22, 'y'),
  ],
  // Change it to adding
  [
    write([0, 'First'], '−3', 220, 80, 50), write([0, 'First'], '−', 310, 80, 50), write([0, 'First'], '5', 385, 80, 50),
    arrow([0, 'plus'], [310, 110], [310, 175], 'y'), write([0, 'plus'], '+', 310, 205, 50, 'y'),
    arrow([1, 'opposite'], [385, 110], [395, 175], 'y'), write([1, 'opposite'], '(−5)', 400, 205, 50, 'y'),
    arrow([2, 'stays'], [220, 110], [220, 175], 'd'), write([2, 'stays'], '−3', 220, 205, 50),
    write([2, 'it'], '−3 − 5  =  −3 + (−5)', 300, 320, 34, 'y'),
  ],
  // Add on the number line
  [
    write([0, 'adding'], '−3 + (−5)', 300, 60, 40),
    ...numLine([1, 'Start'], 240), ...dot([1, 'Start'], -3, 240), under([1, 'Start'], -3, 240, 'w'),
    write([1, 'Start'], 'start', nx(-3), 300, 20, 'd'),
    write([2, 'Which'], 'which way?', 460, 150, 26, 'd'),
    jump([2, 'Left'], -3, -8, 240, 'b'), write([2, 'steps'], '5 steps', nx(-5.5), 150, 26, 'b'),
  ],
  // Where you land
  [
    ...numLine([0, 'Count'], 150), ...dot([0, 'Count'], -3, 150), under([0, 'Count'], -3, 150, 'w'),
    ...countHops(0, -3, -8, 150, 'b').map(k => ({ ...k, at: 'off' })),
    ...dot([0, 'land'], -8, 150, 'y'), under([0, 'land'], -8, 150, 'y'),
    write([1, 'So'], '−3 − 5 = −8', 300, 265, 48, 'y'),
    write([2, 'floor'], 'the elevator: floor −8', 300, 345, 28),
  ],
  // One thing not to do
  [
    ...warn([0, 'mix']),
    write([1, 'TAKE'], '−3 − 5 = 2', 300, 160, 40, 'r'), cross([1, 'big'], 352, 140, 60, 42),
    write([2, 'adding'], '−3 − 5 = −3 + (−5)', 300, 255, 34),
    write([2, 'line'], '= −8', 300, 330, 40, 'y'),
  ],
]
