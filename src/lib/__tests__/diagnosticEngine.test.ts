import { describe, it, expect } from 'vitest'
import { runProbe, prereqClosure, recheckSkills } from '../diagnosticEngine'

// Oracle (the documented headless recipe): a learner who fails exactly `gap` and everything that
// transitively depends on it, but passes everything else — the engine must descend to `gap`.
const oracle = (gap: string) => (id: string) => id !== gap && !prereqClosure(id).has(gap)

describe('diagnosticEngine', () => {
  it('a grade-level learner (passes everything) has no root gap', () => {
    expect(runProbe('9-11', () => true).result.rootGap).toBeNull()
  })

  it('a planted single gap resolves to the exact root (9-11 band)', () => {
    for (const gap of ['i.multFacts', 'p.placeValue2', 'e.counting10']) {
      expect(runProbe('9-11', oracle(gap)).result.rootGap).toBe(gap)
    }
  })

  it('finds a deep cross-band root (a 15-16 learner rooting in grade-school skills)', () => {
    expect(runProbe('15-16', oracle('i.multFacts')).result.rootGap).toBe('i.multFacts')
  })

  it('recheckSkills always starts with the root skill', () => {
    expect(recheckSkills('i.multFacts')[0]).toBe('i.multFacts')
  })
})
