/**
 * ⚠️ THE PATCH FOR THE BLIND SPOT IN VALUE TESTS.
 *
 * The funnel shipped with un-nested steps and SURVIVED a hand-computed fixture — because the person
 * computing the expected values by hand used the same wrong definition the code did. Both sides
 * inherited the error, so the test could only ever confirm it. It then survived two more populations
 * by coincidence and was exposed by an unrelated change.
 *
 * A value test says "this input gives that output". An invariant says "NO input may give an output
 * of this shape" — and that is the only kind that catches a definitional error, because a
 * definitional error is exactly what the expectation shares with the code.
 *
 * Every invariant below is watched FAILING on a payload that violates it. An invariant nobody has
 * seen fire is indistinguishable from one that cannot.
 */
import { describe, it, expect } from 'vitest'
import { checkOverview, checkLearning, checkFunnel } from '@/features/admin/invariants'

const ids = (v: { id: string }[]) => v.map(x => x.id).sort()

/* A payload that is entirely consistent — every check must stay silent on it. */
const GOOD_OVERVIEW = {
  total_accounts: 9, total_learners: 13, internal_flagged: 2,
  daily_signups: [{ d: '2026-09-01', n: 1 }, { d: '2026-09-02', n: 1 }],
  weekly_signups: [{ d: '2026-08-31', n: 2 }],
  dau: [{ d: '2026-09-01', n: 3 }, { d: '2026-09-02', n: 2 }],
  wau: [{ d: '2026-08-31', n: 4 }],
  today: '2026-09-05', events_since: '2026-06-18',
}
const GOOD_LEARNING = {
  chapters_per_learner: { n_all: 13, mean_all: 1.0, median_all: 0, n_engaged: 5, mean_engaged: 2.6, median_engaged: 2 },
  chapters_histogram: [{ done: 0, n: 8 }, { done: 1, n: 2 }, { done: 3, n: 3 }],
  chapter_funnel: [{ chapter: 'counting', started: 4, finished: 2, rate: 0.5 }],
  curriculum_position: [{ band: '3-5', learners: 10, median_done: 0, pct_started: 25 },
                        { band: '6-8', learners: 3, median_done: 3, pct_started: 100 }],
  diagnostic: { completed: 13, in_progress: 0, total: 13 },
}
const GOOD_FUNNEL = {
  steps: [{ step: 'account created', n: 9 }, { step: 'opened a chapter', n: 6 },
          { step: 'completed a chapter', n: 3 }, { step: 'came back another day', n: 3 }],
  returned_without_finishing: 1,
  cohorts: [{ cohort_week: '2026-08-24', size: 5, weeks: [{ offset: 0, n: 3 }, { offset: 1, n: 2 }] }],
  min_cohort: 1,
}

describe('the invariants stay silent on correct data', () => {
  // ⚠️ THE NEGATIVE CONTROL, and it is not optional: a checker that flagged everything would pass
  // every "it fires" test below while making the page permanently cry wolf.
  it('overview', () => expect(checkOverview(GOOD_OVERVIEW)).toEqual([]))
  it('learning', () => expect(checkLearning(GOOD_LEARNING)).toEqual([]))
  it('funnel',   () => expect(checkFunnel(GOOD_FUNNEL)).toEqual([]))
  it('a missing payload is not a violation', () => {
    expect(checkOverview(null)).toEqual([]); expect(checkLearning(undefined)).toEqual([])
  })
})

describe('F1 — the funnel bug that actually shipped', () => {
  it('fires when a later step exceeds an earlier one', () => {
    // The literal production reading on 2026-09-05: 9 -> 6 -> 3 -> 4.
    const bad = { ...GOOD_FUNNEL, steps: [
      { step: 'account created', n: 9 }, { step: 'opened a chapter', n: 6 },
      { step: 'completed a chapter', n: 3 }, { step: 'came back another day', n: 4 }] }
    const v = checkFunnel(bad)
    expect(ids(v)).toEqual(['F1'])
    expect(v[0].detail).toMatch(/came back another day.*4.*completed a chapter.*3/)
  })
})

describe('page 1 invariants', () => {
  it('O1 — daily signups cannot exceed total accounts', () => {
    expect(ids(checkOverview({ ...GOOD_OVERVIEW, total_accounts: 1 }))).toContain('O1')
  })
  it('O3 — DAU cannot exceed the number of learners that exist', () => {
    expect(ids(checkOverview({ ...GOOD_OVERVIEW, dau: [{ d: '2026-09-01', n: 99 }] }))).toContain('O3')
  })
  it('O6a — a week cannot have fewer distinct learners than its biggest day', () => {
    const bad = { ...GOOD_OVERVIEW, dau: [{ d: '2026-08-31', n: 9 }], wau: [{ d: '2026-08-31', n: 2 }] }
    expect(ids(checkOverview(bad))).toContain('O6a')
  })
  it('O6b — a week cannot exceed the sum of its days, and is only checked when all 7 are known', () => {
    const days = Array.from({ length: 7 }, (_, i) =>
      ({ d: new Date(Date.UTC(2026, 7, 31) + i * 86400000).toISOString().slice(0, 10), n: 1 }))
    expect(ids(checkOverview({ ...GOOD_OVERVIEW, dau: days, wau: [{ d: '2026-08-31', n: 8 }] }))).toContain('O6b')
    // one day missing -> the upper bound is unknowable, so it must NOT fire
    expect(ids(checkOverview({ ...GOOD_OVERVIEW, dau: days.slice(0, 6), wau: [{ d: '2026-08-31', n: 8 }] }))).not.toContain('O6b')
  })
  it('suppressed buckets (null) are skipped, not treated as zero', () => {
    expect(checkOverview({ ...GOOD_OVERVIEW, dau: [{ d: '2026-09-01', n: null }] })).toEqual([])
  })
})

describe('page 2 invariants', () => {
  it('L1 — completed≥1 cannot exceed all learners', () => {
    expect(ids(checkLearning({ ...GOOD_LEARNING, chapters_per_learner: { ...GOOD_LEARNING.chapters_per_learner, n_engaged: 99 } }))).toContain('L1')
  })
  it('L2 — the engaged mean cannot be below the all-learners mean', () => {
    expect(ids(checkLearning({ ...GOOD_LEARNING, chapters_per_learner: { ...GOOD_LEARNING.chapters_per_learner, mean_all: 9, mean_engaged: 1 } }))).toContain('L2')
  })
  it('L3 — the median must lie inside the distribution', () => {
    expect(ids(checkLearning({ ...GOOD_LEARNING, chapters_per_learner: { ...GOOD_LEARNING.chapters_per_learner, median_all: 99 } }))).toContain('L3')
  })
  it('L4 — the histogram must account for every learner', () => {
    expect(ids(checkLearning({ ...GOOD_LEARNING, chapters_histogram: [{ done: 0, n: 1 }] }))).toContain('L4')
  })
  it('L5/L6 — finished cannot exceed started, and a rate cannot exceed 1', () => {
    const v = ids(checkLearning({ ...GOOD_LEARNING, chapter_funnel: [{ chapter: 'counting', started: 1, finished: 3, rate: 3 }] }))
    expect(v).toContain('L5'); expect(v).toContain('L6')
  })
  it('L7 — the band counts must sum to the learner total', () => {
    expect(ids(checkLearning({ ...GOOD_LEARNING, curriculum_position: [{ band: '3-5', learners: 1, median_done: 0, pct_started: 0 }] }))).toContain('L7')
  })
  it('L8 — an unmodelled diagnostic status shows up as a broken sum', () => {
    expect(ids(checkLearning({ ...GOOD_LEARNING, diagnostic: { completed: 5, in_progress: 1, total: 13 } }))).toContain('L8')
  })
})

describe('page 3 invariants', () => {
  it('F3 — a cohort cannot have more returning learners than members', () => {
    expect(ids(checkFunnel({ ...GOOD_FUNNEL, cohorts: [{ cohort_week: 'w', size: 2, weeks: [{ offset: 0, n: 5 }] }] }))).toContain('F3')
  })
  it('F4 — week offsets outside 0–3 would be rendered nowhere', () => {
    expect(ids(checkFunnel({ ...GOOD_FUNNEL, cohorts: [{ cohort_week: 'w', size: 5, weeks: [{ offset: 9, n: 1 }] }] }))).toContain('F4')
  })
  it('a suppressed cohort cell is skipped, not read as zero', () => {
    expect(checkFunnel({ ...GOOD_FUNNEL, cohorts: [{ cohort_week: 'w', size: 5, weeks: [{ offset: 0, n: null }] }] })).toEqual([])
  })
})
