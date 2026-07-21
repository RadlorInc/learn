import { describe, it, expect } from 'vitest'
import { runProbe, prereqClosure, recheckSkills } from '@/core/diagnosticEngine'

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

  describe('fail confirmation (strikes)', () => {
    it('a single careless slip is forgiven — no descent, no false root', () => {
      // The learner knows everything but fumbles their FIRST sight of i.multFacts, then gets the
      // retry right. Before confirmation this descended and could report a false root; now the
      // slip must leave the diagnosis identical to a clean grade-level run.
      let fumbled = false
      const slip = (id: string) => {
        if (id === 'i.multFacts' && !fumbled) { fumbled = true; return false }
        return true
      }
      const { state, result } = runProbe('9-11', slip)
      expect(result.rootGap).toBeNull()
      expect(state.failed).toHaveLength(0)
      expect(state.passed).toContain('i.multFacts')
      expect(fumbled).toBe(true)                       // the slip actually happened
      // the retry consumed exactly one extra ask
      expect(state.asked.filter(a => a === 'i.multFacts')).toHaveLength(2)
    })

    it('a real gap is confirmed by the second miss and still resolves to the exact root', () => {
      const { state, result } = runProbe('9-11', oracle('i.multFacts'))
      expect(result.rootGap).toBe('i.multFacts')
      // the EARLY fails (where a slip would fabricate a false root) are confirmed by a retry;
      // past CONFIRM_UNTIL_FAILS the pattern is the signal and fails are single-ask
      const first = state.failed[0]
      expect(state.asked.filter(a => a === first)).toHaveLength(2)
    })

    it('confirmation stops once the failure pattern is established (deep descent is not doubled)', () => {
      // A deeply-behind 17-18 learner (fails everything): only the first 4 fails cost a retry.
      const { state } = runProbe('17-18', () => false)
      const doubleAsked = state.failed.filter(f => state.asked.filter(a => a === f).length >= 2)
      expect(doubleAsked.length).toBeLessThanOrEqual(4)
      // and the probe stays a probe, not an ordeal
      expect(state.asked.length).toBeLessThanOrEqual(28)
    })

    it('3-5 readiness does NOT retry — a parent "not yet" is an observation, not a miss', () => {
      const { state } = runProbe('3-5', (id) => id !== 'e.patterns')
      expect(state.failed).toContain('e.patterns')
      expect(state.asked.filter(a => a === 'e.patterns')).toHaveLength(1)
    })

    it('strikes never leak into the diagnosis', () => {
      // End the probe with an outstanding strike by capping items right after a first miss.
      let s = (() => { const st = runProbe('9-11', () => true, { maxItems: 1, maxFailures: 5 }).state; return st })()
      expect(s.strikes).toHaveLength(0)   // pass path never strikes
      // Direct check: one miss recorded, probe force-ended → skill is neither passed nor failed.
      const one = runProbe('9-11', () => false, { maxItems: 1, maxFailures: 5 }).state
      expect(one.strikes).toHaveLength(1)
      expect(one.failed).toHaveLength(0)
    })
  })
})
