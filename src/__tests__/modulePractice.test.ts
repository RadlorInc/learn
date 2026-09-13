/**
 * A module's mixed practice. The expected order is written out by hand on purpose: it is the intent (every topic once,
 * first half and second half alternating, each topic's story problem), not a copy of the function under test.
 */
import { describe, expect, it } from 'vitest'
import { GRADE3_MODULES, mixedPractice } from '@/features/lessons/modules'

describe('mixed practice', () => {
  const m1 = GRADE3_MODULES.find(m => m.id === 'g3m1')!

  it('asks every Module 1 topic once, interleaved', () => {
    expect(mixedPractice(m1).map(x => x.lesson.id)).toEqual(
      ['g3m1-t1', 'g3m1-t5', 'g3m1-t2', 'g3m1-t6', 'g3m1-t3', 'g3m1-t7', 'g3m1-t4', 'g3m1-t8'])
  })

  it("uses each topic's story problem", () => {
    for (const { problem, lesson } of mixedPractice(m1)) {
      expect(lesson.practice.find(p => p.problem === problem)?.why, lesson.id).toBe('Same math in a story')
    }
  })

  it('offers practice only for a built module', () => {
    expect(GRADE3_MODULES.filter(m => m.lessons.length > 0).map(m => m.id)).toEqual(['g3m1'])
    expect(mixedPractice(GRADE3_MODULES.find(m => m.id === 'g3m2')!)).toEqual([])
  })
})
