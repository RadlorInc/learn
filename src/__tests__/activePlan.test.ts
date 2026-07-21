import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePlan, currentPlanChapter, advancePlan, planProgress, revisePlanDeeper } from '@/infra/storage/activePlan'
import { deeperChapter } from '@/core/diagnosticEngine'

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

  describe('play-data revision (revisePlanDeeper)', () => {
    it('prepends the deeper chapter as the new current step', () => {
      setActivePlan('L', '9-11', ['times', 'fractions'])
      expect(revisePlanDeeper('L', 'times', 'skipCounting')).toBe('skipCounting')
      expect(currentPlanChapter('L')).toBe('skipCounting')
      expect(planProgress('L')).toEqual({ done: 0, total: 3 })
      // finishing the inserted chapter walks back onto the original plan
      expect(advancePlan('L', 'skipCounting')).toBe('times')
    })

    it('fires at most once and only while the pointer is on step 0', () => {
      setActivePlan('L', '9-11', ['times', 'fractions'])
      expect(revisePlanDeeper('L', 'times', 'skipCounting')).toBe('skipCounting')
      expect(revisePlanDeeper('L', 'skipCounting', 'counting')).toBeNull()   // once only
      const p2 = setActivePlan('M', '9-11', ['times', 'fractions'])
      expect(p2).not.toBeNull()
      advancePlan('M', 'times')
      expect(revisePlanDeeper('M', 'fractions', 'counting')).toBeNull()      // past step 0 → never
    })

    it('rejects a mismatched struggling chapter and duplicates', () => {
      setActivePlan('L', '9-11', ['times', 'fractions'])
      expect(revisePlanDeeper('L', 'other', 'skipCounting')).toBeNull()
      expect(revisePlanDeeper('L', 'times', 'fractions')).toBeNull()  // already in plan
    })
  })

  describe('deeperChapter (graph side)', () => {
    it('returns a prerequisite chapter for a mid-graph root, null at the floor', () => {
      // NB chapters.ts ids, not /story?ch= route keys ('timesTables', not 'times')
      expect(deeperChapter('timesTables')).toBe('skipCounting')
      expect(deeperChapter('counting')).toBeNull()      // graph floor — nothing deeper exists
      expect(deeperChapter('not-a-chapter')).toBeNull() // unknown id → no revision, never a guess
    })
  })
})
