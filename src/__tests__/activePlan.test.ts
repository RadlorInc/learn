import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePlan, currentPlanChapter, advancePlan, planProgress, revisePlanDeeper, advanceAfterChapter, reconcilePlan } from '@/infra/storage/activePlan'
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
      /** ⚠️ THE PIN FIRED, EXACTLY AS IT WAS WRITTEN TO. This used to assert `null` with the note
       *  *"pinned so the day a chapter comes back, this starts returning one and somebody
       *  notices"* — because `i.factors`' only prerequisites (`i.multFacts`, `i.division`) were
       *  BOTH chapter-less from 2026-08-13, so a child struggling in Factors & Primes had nothing
       *  deeper to be revised to. The Packing Shed exists now, so the play-data revision can send
       *  them to the multiplication facts underneath it — which is the whole point of the revision.
       *  ⚠️ It resolves to `timesTables` rather than `division` because `deeperChapter` ranks
       *  most-unlocking first, and multiplication facts sit under division as well. */
      expect(deeperChapter('factorsMultiples')).toBe('timesTables')
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

/**
 * ⚠️ THE PLAN USED TO DIE WITH THE BROWSER. The pointer is localStorage, so a parent who ran the
 * check on their phone and handed the child a tablet got NO plan card at all — the diagnostic's
 * entire output existed only on the device that produced it.
 *
 * `reconcilePlan` derives the position from data already synced (the plan's chapter_sequence on the
 * server + `learner_progress`), so there is no second write path to disagree with the first. These
 * pin the two properties that make that safe: it only moves FORWARD, and it never overwrites a
 * locally revised plan with the pre-revision remote copy.
 */
describe('the plan pointer survives a device switch', () => {
  beforeEach(() => localStorage.clear())

  it('seeds a plan on a device that has never seen one, at the right step', () => {
    expect(currentPlanChapter('L')).toBeNull()                       // fresh device
    const p = reconcilePlan('L', ['a', 'b', 'c'], ['a'])
    expect(p?.chapters).toEqual(['a', 'b', 'c'])
    expect(currentPlanChapter('L')).toBe('b')
  })

  it('counts only the LEADING run of finished chapters', () => {
    // 'c' played out of order must not drag the pointer past the unfinished 'b' — the same rule
    // advancePlan enforces locally.
    reconcilePlan('L', ['a', 'b', 'c'], ['a', 'c'])
    expect(currentPlanChapter('L')).toBe('b')
  })

  it('NEVER moves the pointer backwards', () => {
    // The device that is behind must not drag a child back to a chapter they finished. This is the
    // property that makes deriving safe at all.
    setActivePlan('L', '9-11', ['a', 'b', 'c'])
    advancePlan('L', 'a'); advancePlan('L', 'b')          // local is at 'c'
    reconcilePlan('L', ['a', 'b', 'c'], [])               // a server that knows nothing
    expect(currentPlanChapter('L')).toBe('c')
  })

  it('keeps a REVISED local plan rather than the pre-revision remote copy', () => {
    // The revision prepended a deeper chapter; the remote sequence predates it, so adopting remote
    // would silently undo the very thing the play-data revision decided the child needs.
    setActivePlan('L', '9-11', ['a', 'b'])
    revisePlanDeeper('L', 'a', 'deep')
    reconcilePlan('L', ['a', 'b'], [])
    expect(currentPlanChapter('L')).toBe('deep')
    expect(JSON.parse(localStorage.getItem('milo_active_plan_L')!).revised).toBe(true)
  })

  it('no local plan and no remote plan is a no-op, not an empty plan', () => {
    expect(reconcilePlan('L', [], [])).toBeNull()
    expect(currentPlanChapter('L')).toBeNull()
  })

  it('a completed plan reports its end rather than looping', () => {
    reconcilePlan('L', ['a', 'b'], ['a', 'b'])
    expect(currentPlanChapter('L')).toBeNull()
    expect(planProgress('L')).toEqual({ done: 2, total: 2 })
  })
})
