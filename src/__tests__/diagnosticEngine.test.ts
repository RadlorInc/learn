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
    it('a single careless slip is forgiven — no descent, no false root', () => {
      // The learner knows everything but fumbles their FIRST sight of i.multFacts, then gets the
      // retry right. Without confirmation this descended and could report a false root; the slip
      // must leave the diagnosis identical to a clean grade-level run.
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
      expect(state.asked.filter(a => a === 'i.multFacts')).toHaveLength(2)
    })

    it('a real gap is confirmed by the second miss and still resolves to the exact root', () => {
      const { state, result } = runProbe('9-11', oracle('i.multFacts'))
      expect(result.rootGap).toBe('i.multFacts')
      // a fail is never taken on one item, and never needs a third
      const first = state.failed[0]
      expect(state.asked.filter(a => a === first)).toHaveLength(2)
    })

    /**
     * ⚠️⚠️ THIS USED TO ASSERT THE OPPOSITE, AND THE RULE IT PINNED WAS THE BUG. Confirmation
     * stopped after four confirmed fails, on the argument that a child already failing that much is
     * not slipping. True — and it meant the bands that descend furthest burned through four fails on
     * the way DOWN, so most of a 17–18 descent ran unguarded and one slip there planted a root two
     * or three chapters too deep. Measured, the too-deep error tracked the descent distance almost
     * exactly: 1% at one band below the child, 9% at 3.6 bands. Guarding all the way down took
     * 17–18 from 76% to 83–84% exact and its too-deep errors from 10% to 3–4%.
     */
    it('confirms a fail at EVERY depth, however far behind the child is', () => {
      const { state } = runProbe('17-18', () => false)
      const singleAsked = state.failed.filter(f => state.asked.filter(a => a === f).length < 2)
      expect(singleAsked, 'a fail was taken on one item').toEqual([])
      // ⚠️ …and it stays a probe rather than an ordeal. This child fails EVERYTHING, which is the
      // worst case there is, and it is bounded by the band's own item cap.
      expect(state.asked.length).toBeLessThanOrEqual(DEFAULT_CONFIG['17-18'].maxItems)
    })

    /**
     * ⚠️⚠️ A THIRD ITEM IS NEVER SPENT, AND THAT IS A MEASUREMENT RATHER THAN A BUDGET DECISION.
     * "Miss then pass" looks like the genuinely ambiguous case — the child has now said both things
     * — so a tie-breaker sounds obviously right. It was built, and it bought NOTHING: exact-root
     * rate came out flat against two tries in every band, because that pattern is overwhelmingly a
     * real child slipping on a skill they HAVE, and majority-of-three turns about one slip in ten
     * into a false fail. 9–11's false-gap rate for an ON-GRADE child went 14% → 25% for no gain.
     * Five tries measured IDENTICAL to three, because a majority of three can never tie and the
     * fourth item is never reached — a floor on what more evidence per skill is worth buying.
     */
    it('never spends a third item — a pass on the retry settles it', () => {
      const seen: string[] = []
      let slipped = false
      const { state } = runProbe('9-11', id => {
        seen.push(id)
        if (!slipped) { slipped = true; return false }
        return true
      })
      const first = seen[0]
      expect(seen.filter(x => x === first)).toHaveLength(2)
      expect(state.passed, 'the retry forgives the slip').toContain(first)
      for (const id of new Set(seen.filter(x => x !== first))) {
        expect(seen.filter(x => x === id), `${id} was re-asked without cause`).toHaveLength(1)
      }
      expect(Math.max(...Object.values(state.tries).map(t => t.length))).toBeLessThanOrEqual(2)
    })

    it('3-5 readiness does NOT retry — a parent "not yet" is an observation, not a miss', () => {
      const { state } = runProbe('3-5', (id) => id !== 'e.patterns')
      expect(state.failed).toContain('e.patterns')
      expect(state.asked.filter(a => a === 'e.patterns')).toHaveLength(1)
    })

    it('an undecided skill never leaks into the diagnosis', () => {
      // A first PASS settles it, so nothing is left pending on a clean run.
      const clean = runProbe('9-11', () => true, { maxItems: 1, maxFailures: 5 }).state
      expect(clean.passed).toHaveLength(1)
      expect(clean.failed).toHaveLength(0)
      // One miss recorded, probe force-ended → neither passed nor failed, only pending.
      const one = runProbe('9-11', () => false, { maxItems: 1, maxFailures: 5 }).state
      expect(one.tries[one.asked[0]]).toEqual([false])
      expect(one.failed).toHaveLength(0)
      expect(one.passed).toHaveLength(0)
    })
  })
})
