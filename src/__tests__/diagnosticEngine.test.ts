import { describe, it, expect } from 'vitest'
import { runProbe, prereqClosure, recheckSkills, DEFAULT_CONFIG } from '@/core/diagnosticEngine'

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

  describe('evidence per skill', () => {
    /**
     * ⚠️ THE RULE: keep asking until one answer LEADS — by two to pass, by **three** to fail.
     * The two verdicts do not cost the same thing. A pass moves on; a fail sends the search downward
     * and, at an entry, tells a family their child is behind. Measured with each item's real guess
     * rate, a symmetric rule made a double-slip almost routine — 8% of ON-GRADE 12–14 children were
     * told their gap sat a whole band below them. The asymmetry took the whole band to 96–98% exact.
     */
    it('a single careless slip is forgiven — no descent, no false root', () => {
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
      // miss, then three passes to reach a lead of two — and every other skill settles in two
      expect(state.asked.filter(a => a === 'i.multFacts')).toHaveLength(4)
    })

    it('a skill the child really has settles in two, not more', () => {
      const { state } = runProbe('9-11', () => true)
      for (const id of new Set(state.asked)) {
        expect(state.asked.filter(a => a === id), `${id}`).toHaveLength(2)
      }
    })

    it('a real gap needs three misses, and still resolves to the exact root', () => {
      const { state, result } = runProbe('9-11', oracle('i.multFacts'))
      expect(result.rootGap).toBe('i.multFacts')
      const first = state.failed[0]
      expect(state.asked.filter(a => a === first)).toHaveLength(3)
    })

    /**
     * ⚠️⚠️ THIS USED TO ASSERT THE OPPOSITE, AND THE RULE IT PINNED WAS THE BUG. Confirmation
     * stopped after four confirmed fails, on the argument that a child already failing that much is
     * not slipping. True — and it meant the bands that descend furthest burned through four fails on
     * the way DOWN, so most of a 17–18 descent ran unguarded and one slip there planted a root two
     * or three chapters too deep. Measured, the too-deep error tracked descent distance almost
     * exactly: 1% at one band below the child, 9% at 3.6 bands.
     */
    it('confirms at EVERY depth, however far behind the child is', () => {
      const { state } = runProbe('17-18', () => false)
      const thin = state.failed.filter(f => state.asked.filter(a => a === f).length < 3)
      expect(thin, 'a fail was taken on fewer than three items').toEqual([])
      // ⚠️ …and it stays bounded. This child fails EVERYTHING, the worst case there is.
      expect(state.asked.length).toBeLessThanOrEqual(DEFAULT_CONFIG['17-18'].maxItems)
    })

    it('3-5 readiness does NOT retry — a parent "not yet" is an observation, not a miss', () => {
      const { state } = runProbe('3-5', (id) => id !== 'e.patterns')
      expect(state.failed).toContain('e.patterns')
      expect(state.asked.filter(a => a === 'e.patterns')).toHaveLength(1)
    })

    it('an undecided skill never leaks into the diagnosis', () => {
      // One answer is never enough now, in either direction, so a probe cut off after one item has
      // decided nothing at all.
      for (const answer of [true, false]) {
        const st = runProbe('9-11', () => answer, { maxItems: 1, maxFailures: 9 }).state
        expect(st.passed, `answering ${answer}`).toHaveLength(0)
        expect(st.failed, `answering ${answer}`).toHaveLength(0)
        expect(st.tries[st.asked[0]]).toEqual([answer])
      }
    })
  })
})
