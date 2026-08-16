import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePlan, currentPlanChapter, advancePlan, planProgress, revisePlanDeeper, advanceAfterChapter } from '@/infra/storage/activePlan'
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
      // NB chapters.ts ids, not /story?ch= route keys ('bigNumbers', not 'bignum')
      expect(deeperChapter('bigNumbers')).toBe('placeValue')
      expect(deeperChapter('counting')).toBeNull()      // graph floor — nothing deeper exists
      expect(deeperChapter('not-a-chapter')).toBeNull() // unknown id → no revision, never a guess
      /** ⚠️ A SKILL WITH NO CHAPTER YIELDS NO REVISION, which is the state Times Tables and
       *  Division are in since 2026-08-13 — `i.factors`' only prerequisites are both chapter-less,
       *  so there is nothing deeper to prepend. Pinned so the day a chapter comes back, this
       *  starts returning one and somebody notices. */
      expect(deeperChapter('factorsMultiples')).toBeNull()
    })
  })
})

/**
 * ⚠️⚠️ THE OUTAGE THIS FILE COULD NOT SEE. Every check above drives `advancePlan` directly and they
 * were all green for three months while the pointer never moved once in production — because
 * NOTHING CALLED IT. `advancePlan`'s only caller was `/game`'s `handleComplete`, which reaches a
 * chapter as `ChapterProps.onComplete`, and both registry factories in `ChapterPortal` discard that
 * prop (`StoryChapter(_props)`; `TeenChapter` reads only `props.childName`). The portal calls
 * `finishAndSync` itself, so the session was written and everything else was dead code.
 *
 * Production evidence, three months: 797 `chapter_open`, 40 completed sessions, **0
 * `practice_complete`**, and 77 of 77 `diagnostic_plan_progress` rows still `todo`.
 *
 * This is the same class as "a gate that reads a chapter's DATA cannot see how it INDEXES it": the
 * unit was correct and unreachable. So these drive `advanceAfterChapter` — the decision the
 * completion path actually calls — and a source check pins it to that path, because a test of the
 * decision alone would go green again the moment it is orphaned a second time.
 */
describe('the end-of-chapter plan decision (the path, not just the unit)', () => {
  const deeperNone = () => null

  beforeEach(() => localStorage.clear())

  it('advances the pointer when the plan chapter is completed well', () => {
    setActivePlan('L', '9-11', ['a', 'b', 'c'])
    const moved = advanceAfterChapter('L', 'a', 9, 1, false, deeperNone)
    expect(moved).toEqual({ kind: 'advanced', to: 'b' })
    expect(currentPlanChapter('L')).toBe('b')
  })

  it('revises DEEPER instead of advancing when the child struggled at the root', () => {
    setActivePlan('L', '9-11', ['a', 'b'])
    const moved = advanceAfterChapter('L', 'a', 1, 5, false, () => 'deep')
    expect(moved).toEqual({ kind: 'revised', to: 'deep' })
    // ⚠️ The pointer must rest ON the deeper chapter — advancing as well would skip the very
    // chapter the revision just decided the child needs.
    expect(currentPlanChapter('L')).toBe('deep')
  })

  it('does not revise on a mastered run, however few questions it took', () => {
    // `mastered` is an early finish at the top tier — it requires a correct streak, so it can
    // never coincide with struggling. Guarded explicitly because the ratio alone could qualify.
    setActivePlan('L', '9-11', ['a', 'b'])
    expect(advanceAfterChapter('L', 'a', 1, 5, true, () => 'deep')).toEqual({ kind: 'advanced', to: 'b' })
  })

  it('falls through to advancing when a revision is offered but cannot apply', () => {
    // No deeper chapter exists → the child still moves on. Returning early here would strand
    // them on the root for ever, which is the outage wearing a different hat.
    setActivePlan('L', '9-11', ['a', 'b'])
    expect(advanceAfterChapter('L', 'a', 1, 5, false, deeperNone)).toEqual({ kind: 'advanced', to: 'b' })
    expect(currentPlanChapter('L')).toBe('b')
  })

  it('leaves the pointer alone for an off-plan chapter, and no-ops with no plan', () => {
    setActivePlan('L', '9-11', ['a', 'b'])
    advanceAfterChapter('L', 'zzz', 9, 1, false, deeperNone)
    expect(currentPlanChapter('L')).toBe('a')
    expect(advanceAfterChapter('NOPLAN', 'a', 9, 1, false, deeperNone)).toBeNull()
  })

  it('is WIRED INTO the completion path — the assertion the old suite was missing', async () => {
    // ⚠️ A source check on purpose. The bug was never in the logic; it was that no live path
    // reached it. `finishAndSync` is the one function the portal, CountingStoryChapter and /game
    // all call, so that is where this must stay.
    const { readFileSync } = await import('node:fs')
    const src = readFileSync('src/data/supabase/useChapterSync.ts', 'utf8')
    expect(src, 'finishAndSync no longer advances the plan — the pointer is stranded again').toContain('advanceAfterChapter(')
    expect(src, 'the completion event is not emitted from the path that actually completes').toContain("track('practice_complete'")
    // ...and it must happen BEFORE the network branch, or an offline child never advances.
    // ⚠️ Anchored on the real BRANCH, not the words `navigator.onLine` — the comment above the
    // code says that phrase too, so the loose version matched prose and failed on correct code.
    expect(src.indexOf('advanceAfterChapter('), 'plan advance must precede the offline early-return')
      .toBeLessThan(src.indexOf('if (!navigator.onLine)'))
  })
})
