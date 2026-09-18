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
