/**
 * The answer check for every kind of answer a lesson can ask for. Each case is written out by hand.
 * Both halves matter: a checker that refuses everything and one that accepts everything each pass half of these.
 */
import { describe, it, expect } from 'vitest'
import { isCorrect, showAnswer, parseRational, type Answer } from '@/features/lessons/script'
import { ready } from '@/features/lessons/AnswerInput'

const cases: [Answer, string[], string[]][] = [
  // answer, accepted, refused
  [12, ['12', ' 12 ', '12.0'], ['13', '1 2', '', '12/0']],
  [1250, ['1250', '1,250'], ['125', '12500']],
  [-3, ['-3', '−3'], ['3', '-30']],
  [0.5, ['0.5', '.5', '1/2', '0.50'], ['0.05', '5']],
  [3.14, ['3.14'], ['3.1', '3.141']],
  [{ frac: [3, 4] }, ['3/4', '6/8', '0.75'], ['4/3', '3/8', '3']],
  [{ frac: [3, 4], exact: true }, ['3/4'], ['6/8', '0.75']],
  [{ frac: [1, 2], whole: 2 }, ['2 1/2', '5/2', '2 2/4'], ['2 1/3', '1/2', '2']],
  [{ frac: [-1, 4] }, ['-1/4', '−1/4'], ['1/4']],
  [{ time: [7, 35] }, ['7:35'], ['7:53', '735', '8:35']],
  [{ time: [3, 5] }, ['3:05', '3:5'], ['3:50']],
  [{ choices: ['acute', 'right', 'obtuse'], correct: 2 }, ['2'], ['0', '1', 'obtuse']],
]

describe('isCorrect', () => {
  it.each(cases)('%j', (answer, yes, no) => {
    for (const r of yes) expect(isCorrect(answer, r), `should accept "${r}"`).toBe(true)
    for (const r of no) expect(isCorrect(answer, r), `should refuse "${r}"`).toBe(false)
  })
})

describe('showAnswer', () => {
  it('writes each kind back the way a child reads it', () => {
    expect([12, 1250, -3, 0.25, { frac: [3, 4] }, { frac: [1, 2], whole: 2 }, { time: [9, 5] }, { choices: ['yes', 'no'], correct: 1 }]
      .map(a => showAnswer(a as Answer))).toEqual(['12', '1,250', '−3', '0.25', '3/4', '2 1/2', '9:05', 'no'])
  })
})

describe('parseRational', () => {
  it('reads whole, decimal, fraction and mixed numbers, and refuses anything else', () => {
    expect(parseRational('7')).toEqual([7, 1])
    expect(parseRational('-2.5')).toEqual([-25, 10])
    expect(parseRational('1 3/4')).toEqual([7, 4])
    for (const bad of ['', 'abc', '1/', '/2', '3/0', '1..2']) expect(parseRational(bad), bad).toBeNull()
  })
})

describe('ready (when Check becomes available)', () => {
  it('waits for a whole fraction and a whole time', () => {
    expect(ready({ frac: [1, 2] }, '1/')).toBe(false)
    expect(ready({ frac: [1, 2] }, '1/2')).toBe(true)
    expect(ready({ time: [1, 2] }, '7:')).toBe(false)
    expect(ready({ time: [1, 2] }, '7:30')).toBe(true)
    expect(ready(5, '-')).toBe(false)
    expect(ready(5, '5')).toBe(true)
  })
})
