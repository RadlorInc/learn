import { describe, it, expect } from 'vitest'
import { groupByRootGap, type TriageLearner } from '@/features/triage/groupByRootGap'

// Real skill ids from the graph so labels/chapters resolve.
const GAP_A = 'i.bigNumbers'  // Place value to 10,000 → bigNumbers
const GAP_B = 'i.rounding'    // Rounding → rounding

const L = (name: string, rootGap: string | null, checked: boolean): TriageLearner =>
  ({ learnerId: name, name, band: '9-11', rootGap, checked })

describe('class triage — groupByRootGap', () => {
  it('groups learners who share a root gap', () => {
    const groups = groupByRootGap([L('Ada', GAP_A, true), L('Ben', GAP_A, true), L('Cy', GAP_B, true)])
    const a = groups.find(g => g.key === GAP_A)!
    const b = groups.find(g => g.key === GAP_B)!
    expect(a.learners.map(l => l.name).sort()).toEqual(['Ada', 'Ben'])
    expect(b.learners.map(l => l.name)).toEqual(['Cy'])
    expect(a.kind).toBe('gap')
    expect(a.label.length).toBeGreaterThan(0)   // resolved from the skill/chapter
    expect(a.chapter).toBe('bigNumbers')
  })

  it('orders gap groups biggest-first', () => {
    const groups = groupByRootGap([L('Ada', GAP_B, true), L('Ben', GAP_A, true), L('Cy', GAP_A, true), L('Di', GAP_A, true)])
    expect(groups[0].key).toBe(GAP_A)   // 3 learners
    expect(groups[0].learners).toHaveLength(3)
    expect(groups[1].key).toBe(GAP_B)   // 1 learner
  })

  it('separates on-track (checked, no gap) from not-yet-checked, and always puts no-check last', () => {
    const groups = groupByRootGap([
      L('Ada', GAP_A, true),
      L('Ben', null, true),    // on track
      L('Cy', null, false),    // not checked
      L('Di', null, false),    // not checked
    ])
    const kinds = groups.map(g => g.kind)
    expect(kinds[0]).toBe('gap')
    expect(kinds).toContain('ontrack')
    expect(kinds[kinds.length - 1]).toBe('nocheck')   // no-check bucket always last
    expect(groups.find(g => g.kind === 'nocheck')!.learners).toHaveLength(2)
    expect(groups.find(g => g.kind === 'ontrack')!.learners).toHaveLength(1)
  })

  it('handles an empty class', () => {
    expect(groupByRootGap([])).toEqual([])
  })

  it('falls back gracefully for an unknown skill id', () => {
    const groups = groupByRootGap([L('Ada', 'not.a.real.skill', true)])
    expect(groups[0].kind).toBe('gap')
    expect(groups[0].label).toBe('not.a.real.skill')   // no crash; id used as the label
    expect(groups[0].chapter).toBeNull()
  })
})
