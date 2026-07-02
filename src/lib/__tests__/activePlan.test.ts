import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePlan, currentPlanChapter, advancePlan, planProgress } from '../activePlan'

describe('activePlan', () => {
  beforeEach(() => localStorage.clear())

  it('advances the pointer only when the CURRENT plan chapter is completed', () => {
    setActivePlan('L', '9-11', ['a', 'b', 'c'])
    expect(currentPlanChapter('L')).toBe('a')
    expect(advancePlan('L', 'b')).toBe('a')   // off-plan completion → pointer unchanged
    expect(advancePlan('L', 'a')).toBe('b')   // current completed → advance
    expect(planProgress('L')).toEqual({ done: 1, total: 3 })
  })

  it('returns null when the plan is complete', () => {
    setActivePlan('L', '9-11', ['only'])
    expect(advancePlan('L', 'only')).toBeNull()
    expect(currentPlanChapter('L')).toBeNull()
  })
})
