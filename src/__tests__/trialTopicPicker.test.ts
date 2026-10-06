/**
 * The trial picker's dimming rule (TrialTopicPicker.canAdd), written out by hand: what a parent may tick next to what
 * is already ticked. It mirrors choose_free_topics (familyFreeTopics.test.ts), which is the one that decides.
 */
import { describe, it, expect } from 'vitest'
import { canAdd } from '@/features/billing/TrialTopicPicker'

describe('canAdd — two topics of one module, or two stories', () => {
  it('anything is open while nothing is ticked', () => {
    expect(canAdd([], 'g3m1-t1')).toBe(true)
    expect(canAdd([], 'c:counting')).toBe(true)
  })
  it('a second topic of the same module is open; another module\'s is dimmed', () => {
    expect(canAdd(['g3m1-t1'], 'g3m1-t2')).toBe(true)
    expect(canAdd(['g3m1-t1'], 'g3m2-t1')).toBe(false)
    expect(canAdd(['g3m1-t1'], 'g4m1-t1')).toBe(false)
  })
  it('stories go with stories, never with lessons', () => {
    expect(canAdd(['c:counting'], 'c:money')).toBe(true)
    expect(canAdd(['c:counting'], 'g3m1-t1')).toBe(false)
    expect(canAdd(['g3m1-t1'], 'c:counting')).toBe(false)
  })
  it('after two, everything else is dimmed; a ticked one stays tickable (to untick)', () => {
    expect(canAdd(['g3m1-t1', 'g3m1-t2'], 'g3m1-t3')).toBe(false)
    expect(canAdd(['g3m1-t1', 'g3m1-t2'], 'g3m1-t2')).toBe(true)
  })
})
