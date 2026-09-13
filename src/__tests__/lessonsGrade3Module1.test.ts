/**
 * Grade 3 · Module 1 lessons (docs/new-flow/grade3-module1-scripts.md).
 * ⚠️ The expected answers are WRITTEN OUT here from the approved document, never derived from the
 * lesson data — a check that computes its expectation from the thing under test cannot fail.
 */
import { describe, it, expect } from 'vitest'
import { GRADE3_MODULE1 } from '@/features/lessons/grade3Module1'
import {
  answerOf, workedSteps, START, next, check, afterWorked, nextPractice, replayLesson, type Op, type FlowState,
} from '@/features/lessons/script'

// [your turn, twin, practice 1–5] — copied from the "Answers:" lines of the approved scripts.
const ANSWERS: Record<string, number[]> = {
  'g3m1-t1': [15, 10, 6, 10, 20, 20, 12],
  'g3m1-t2': [12, 10, 12, 10, 20, 25, 16],
  'g3m1-t3': [40, 15, 8, 30, 20, 2, 12],
  'g3m1-t4': [35, 60, 8, 50, 40, 18, 30],
  'g3m1-t5': [20, 18, 9, 16, 24, 21, 20],
  'g3m1-t6': [5, 3, 4, 5, 3, 6, 4],
  'g3m1-t7': [3, 4, 5, 2, 3, 6, 5],
  'g3m1-t8': [10, 3, 5, 3, 4, 7, 6],
}
const MODULE_UNITS = [2, 3, 4, 5, 10]

const opsOf = (id: string) => {
  const l = GRADE3_MODULE1.find(x => x.id === id)!
  return [l.turn.op, l.turn.twin.op, ...l.practice.map(p => p.problem.op)]
}

describe('Grade 3 · Module 1 scripts', () => {
  it('has the 8 approved topics, in order', () => {
    expect(GRADE3_MODULE1.map(l => l.title)).toEqual([
      'Plates of cookies', 'Rows of chairs', 'Turn the tray', 'Counting by 2s, 5s and 10s',
      'Counting by 3s and 4s', 'Share the apples fairly', 'How many bags can we fill?', 'The missing number',
    ])
  })

  it.each(Object.keys(ANSWERS))('%s: every answer matches the approved document', id => {
    expect(opsOf(id).map(answerOf)).toEqual(ANSWERS[id])
  })

  it.each(GRADE3_MODULE1.map(l => [l.id, l] as const))('%s: follows the 9-screen structure', (_id, l) => {
    expect(l.screens).toHaveLength(7)
    expect(l.practice).toHaveLength(5)
    expect(l.screens[2].title).toBe('The big idea')
    expect(l.screens[2].text).toBe(l.bigIdea)
    expect(l.screens[6].title).toBe('One thing not to do')
    for (const s of [l.turn.hint1, l.turn.hint2, l.turn.prompt, l.won.text, l.won.sticker]) expect(s.length).toBeGreaterThan(0)
  })

  it('only uses the Module 1 units (2, 3, 4, 5, 10), and every division comes out exact', () => {
    const uses = (op: Op) => op.t === 'div' ? [op.by] : op.t === 'missing' ? [op.a] : [op.a, op.b]
    for (const l of GRADE3_MODULE1) for (const op of opsOf(l.id)) {
      expect(uses(op).some(u => MODULE_UNITS.includes(u)), `${l.id} ${JSON.stringify(op)}`).toBe(true)
      expect(Number.isInteger(answerOf(op)), `${l.id} ${JSON.stringify(op)}`).toBe(true)
    }
  })

  it('the worked steps end on the right answer', () => {
    for (const l of GRADE3_MODULE1) for (const op of opsOf(l.id)) {
      expect(workedSteps(op).at(-1)).toContain(String(answerOf(op)))
    }
  })

  it('no math word appears on Screens 1–7 (they belong on the Screen 9 sticker)', () => {
    for (const l of GRADE3_MODULE1) for (const s of l.screens) {
      expect(`${s.title} ${s.text}`, l.id).not.toMatch(/\barray|commutative|fact family/i)
    }
  })
})

describe('the flow', () => {
  const l = GRADE3_MODULE1[0]   // your turn 15, twin 10, practice 6 10 20 20 12
  const seven = (s: FlowState) => { for (let k = 0; k < 7; k++) s = next(s); return s }

  it('7 taps of Next reach Screen 8, and nothing is asked before it', () => {
    let s = START
    for (let k = 0; k < 6; k++) { s = next(s); expect(s.mode).toBe('lesson') }
    expect(next(s).mode).toBe('turn')
  })

  it('Screen 8: hint, hint, worked steps, then the twin', () => {
    let s = seven(START)
    s = check(l, s, 8);  expect(s.feedback).toBe('hint1')
    s = check(l, s, 8);  expect(s.feedback).toBe('hint2')
    s = check(l, s, 8);  expect(s.feedback).toBe('worked')
    s = afterWorked(s);  expect(s).toMatchObject({ mode: 'turn', twin: true, misses: 0, feedback: null })
    s = check(l, s, 10); expect(s.mode).toBe('won')
  })

  it('practice: a miss shows the big idea, a second shows the worked steps, and the lesson replay comes back to the same problem', () => {
    let s: FlowState = { ...seven(START), mode: 'practice', practice: 2 }
    s = check(l, s, 1);  expect(s.feedback).toBe('idea')
    s = check(l, s, 1);  expect(s.feedback).toBe('worked')
    s = replayLesson(s); expect(s).toMatchObject({ mode: 'lesson', screen: 0 })
    s = seven(s);        expect(s).toMatchObject({ mode: 'practice', practice: 2, feedback: null })
  })

  it('practice counts a problem as solo only when the worked steps were not needed', () => {
    let s: FlowState = { ...START, mode: 'practice', practice: 0 }
    s = check(l, s, 6); expect(s.solo).toEqual([0])
    s = nextPractice(s)
    s = check(l, s, 1); s = check(l, s, 1); s = check(l, s, 10)
    expect(s.solo).toEqual([0])
    for (let k = 0; k < 4; k++) s = nextPractice(s)
    expect(s.mode).toBe('finish')
  })
})
