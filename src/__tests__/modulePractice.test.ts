/**
 * A module's mixed practice. The expected order is written out by hand on purpose: it is the intent (every topic once,
 * first half and second half alternating, each topic's story problem), not a copy of the function under test.
 */
import { describe, expect, it } from 'vitest'
import { MODULES, mixedPractice } from '@/features/lessons/modules'

describe('mixed practice', () => {
  const m1 = MODULES.find(m => m.id === 'g3m1')!

  it('asks every Module 1 topic once, interleaved', () => {
    expect(mixedPractice(m1).map(x => x.lesson.id)).toEqual(
      ['g3m1-t1', 'g3m1-t5', 'g3m1-t2', 'g3m1-t6', 'g3m1-t3', 'g3m1-t7', 'g3m1-t4', 'g3m1-t8'])
  })

  it("uses each topic's story problem", () => {
    for (const { problem, lesson } of mixedPractice(m1)) {
      expect(lesson.practice.find(p => p.problem === problem)?.why, lesson.id).toBe('Same math in a story')
    }
  })

  it('a module with no lessons yet has no practice', () => {
    expect(mixedPractice({ ...m1, lessons: [] })).toEqual([])
  })

  it('every grade 3–8 module from the curriculum is registered, with unique ids', () => {
    expect(MODULES.map(m => m.id)).toEqual([
      'g3m1', 'g3m2', 'g3m3', 'g3m4', 'g3m5', 'g3m6', 'g4m1', 'g4m2', 'g4m3', 'g4m4', 'g4m5', 'g4m6',
      'g5m1', 'g5m2', 'g5m3', 'g5m4', 'g5m5', 'g5m6', 'g6m1', 'g6m2', 'g6m3', 'g6m4', 'g6m5', 'g6m6', 'g6m7',
      'g7m1', 'g7m2', 'g7m3', 'g7m4', 'g7m5', 'g8m1', 'g8m2', 'g8m3', 'g8m4', 'g8m5', 'g8m6'])
  })
})

describe('topics a parent chose', () => {
  it('shows every module when no choice was made, and only the chosen topics otherwise', async () => {
    const { chosenModules, ALL_MODULES } = await import('@/features/lessons/modules')
    expect(chosenModules(null)).toBe(ALL_MODULES)
    expect(chosenModules([])).toBe(ALL_MODULES)
    // A KG–2 story chapter is chosen by its `c:` id, exactly like a topic (founder, 2026-09-25).
    const picked = chosenModules(['g4m2-t3', 'g3m1-t2', 'c:money', 'g4m2-t1', 'c:counting', 'nope'])
    expect(picked.map(m => [m.id, m.lessons.map(l => l.id)])).toEqual([
      ['k0m1', ['c:counting']],
      ['k2m4', ['c:money']],
      ['g3m1', ['g3m1-t2']],
      ['g4m2', ['g4m2-t1', 'g4m2-t3']],
    ])
  })
})
