/**
 * A free teacher's class exercise (2026-09-18): the same questions for every child. Expected values written out by hand.
 */
import { describe, it, expect } from 'vitest'
import { exerciseItems, type Exercise } from '@/features/classes/exercise'

const ex = (o: Partial<Exercise> = {}): Exercise => ({ id: 'e1', module: 'g5m2', level: 3, count: 10, seed: 12345, ...o })
const texts = (e: Exercise) => exerciseItems(e).map(x => x.problem.text)

describe('class exercise', () => {
  it('is IDENTICAL for every child: two devices with the same exercise get the same questions in the same order', () => {
    const a = texts(ex()), b = texts(ex())
    expect(a).toHaveLength(10)
    expect(b).toEqual(a)
    // Positive control: the list is not a constant — another seed gives another list.
    expect(texts(ex({ seed: 999 }))).not.toEqual(a)
  })

  it('asks exactly the number the teacher chose, capped at 50', () => {
    expect(exerciseItems(ex({ count: 3 }))).toHaveLength(3)
    expect(exerciseItems(ex({ count: 20 }))).toHaveLength(20)
    expect(exerciseItems(ex({ count: 500 }))).toHaveLength(50)
  })

  it('topics of the module take turns', () => {
    // g5m2 has 8 topics: 10 questions = each topic once, then the first two again.
    const ids = exerciseItems(ex()).map(x => x.lesson.id)
    expect(new Set(ids.slice(0, 8)).size).toBe(8)
    expect(ids.slice(8)).toEqual(ids.slice(0, 2))
    expect(ids.every(id => id.startsWith('g5m2'))).toBe(true)
  })

  it('the level changes the questions (a harder level is a different kind of question)', () => {
    expect(texts(ex({ level: 1 }))).not.toEqual(texts(ex({ level: 5 })))
  })

  it('a module with no practice yet gives no questions rather than throwing', () => {
    expect(exerciseItems(ex({ module: 'g9m1' }))).toEqual([])
  })
})

describe('summarize (the teacher\'s results)', async () => {
  const { summarize } = await import('@/features/classes/exercise')
  const r = (learner_id: string, outcomes: ('first' | 'second' | 'worked')[], created_at: string, exercise_id = 'e1') => ({ learner_id, exercise_id, outcomes, created_at })

  it('the FIRST attempt is the result; later ones only count as attempts', () => {
    const s = summarize('e1', ['a', 'b', 'c'], [
      r('a', ['worked', 'first', 'second'], '2026-09-18T10:05:00Z'),     // a retook it later and got everything —
      r('a', ['first', 'first', 'first'], '2026-09-18T10:20:00Z'),       //   that is practice, not the test
      r('b', ['first', 'first', 'worked'], '2026-09-18T10:07:00Z'),
      r('c', ['first', 'first', 'first'], '2026-09-18T10:09:00Z', 'e2'), // another exercise
    ])
    expect(s.students).toEqual([
      { learnerId: 'a', done: true, right: 1, total: 3, attempts: 2, at: '2026-09-18T10:05:00Z' },
      { learnerId: 'b', done: true, right: 2, total: 3, attempts: 1, at: '2026-09-18T10:07:00Z' },
      { learnerId: 'c', done: false, right: 0, total: 0, attempts: 0, at: null },
    ])
    expect(s.done).toBe(2)
    // Q1: a missed, b right · Q2: both right · Q3: neither right first time.
    expect(s.perQuestion).toEqual([{ right: 1, of: 2 }, { right: 2, of: 2 }, { right: 0, of: 2 }])
  })

  it('reads the order from the timestamps, not the order the rows arrived in', () => {
    const s = summarize('e1', ['a'], [r('a', ['first'], '2026-09-18T11:00:00Z'), r('a', ['worked'], '2026-09-18T10:00:00Z')])
    expect(s.students[0].right).toBe(0)
  })

  it('nobody has taken it: nothing done, no questions to show', () => {
    expect(summarize('e1', ['a'], [])).toEqual({ students: [{ learnerId: 'a', done: false, right: 0, total: 0, attempts: 0, at: null }], done: 0, perQuestion: [] })
  })
})
