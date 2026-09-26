/**
 * N19 (founder, 2026-09-26): "keep the new ladder rule only, retire the legacy count rule."
 *
 * One rule decides `mastered` everywhere: right on the first try twice in a row at the TOP level of the ladder
 * (`step` in features/lessons/adaptive.ts). The old chapter rule — top tier AND 6 correct in a row — is deleted.
 *
 * Properties checked:
 *   ① the same answers, given to a topic's practice (`step`, a 3-level ladder) and to a story chapter (the real
 *     `useAdaptive` hook every chapter answer passes through), are mastered on the SAME answer — per-answer
 *     arrays written out by hand below. What the chapter saves for the account (`saveStanding` → lesson_progress)
 *     says the same.
 *   ② a sequence the OLD count rule masters (tier 3 with 6 correct in a row, reached at answer 7) is NOT mastered
 *     there any more; the ladder masters it one answer later.
 * A chapter answer is one attempt: a miss then a right = one 'second'; two misses in a row = 'worked'.
 * ⚠️ Expected arrays are written out by hand, never computed by the code under test.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('@/data/supabase/useLearnerSession', () => ({ getActiveLearner: () => ({ id: 'L1', display_name: 'P', avatar_index: 0, age_group: '3-5' }) }))
vi.mock('@/infra/storage/lessonSync', () => ({ syncLesson: () => {} }))
const store = vi.hoisted(() => new Map<string, string>())
vi.mock('@/infra/storage/kv', () => ({
  kv: { get: (k: string) => store.get(k) ?? null, set: (k: string, v: string) => { store.set(k, v) }, remove: (k: string) => { store.delete(k) }, ready: () => Promise.resolve() },
}))

import { useAdaptive, type AdaptiveState } from '@/shared/hooks/useAdaptive'
import { step, FRESH, type Outcome, type Standing } from '@/features/lessons/adaptive'
import { loadStanding } from '@/infra/storage/lessonStanding'

beforeEach(() => store.clear())

/** A topic's practice: `mastered` after each problem, on a 3-level ladder (a chapter has 3 tiers). */
function topic(outcomes: readonly Outcome[]): boolean[] {
  let s: Standing = FRESH
  return outcomes.map(o => (s = step(s, 3, o)).mastered)
}

/** A story chapter: the real hook, one `record` per answer; `mastered` after each, plus what it saved for the account. */
async function chapter(answers: readonly boolean[]) {
  let ada: AdaptiveState | null = null
  const Probe = () => { ada = useAdaptive('counting'); return null }
  const host = document.createElement('div'); const root = createRoot(host)
  await act(async () => { root.render(createElement(Probe)) })
  const out: boolean[] = [], saved: boolean[] = []
  for (const a of answers) {
    await act(async () => { out.push(ada!.record(a).mastered) })
    saved.push(loadStanding('L1', 'c:counting')?.mastered ?? false)
  }
  await act(async () => root.unmount())
  return { out, saved }
}

const F = false, T = true

describe('① one rule: a topic and a chapter master on the same answer', () => {
  it('six right first time: both mastered on the 6th', async () => {
    expect(topic(['first', 'first', 'first', 'first', 'first', 'first'])).toEqual([F, F, F, F, F, T])
    const c = await chapter([T, T, T, T, T, T])
    expect(c.out).toEqual([F, F, F, F, F, T])
    expect(c.saved.at(-1), 'the chapter did not save mastered for the account').toBe(true)
  })

  it('four right, two misses (worked), then right: both mastered on the same answer', async () => {
    // outcomes: f f f f worked second f f f f
    expect(topic(['first', 'first', 'first', 'first', 'worked', 'second', 'first', 'first', 'first', 'first']))
      .toEqual([F, F, F, F, F, F, F, F, F, T])
    // the same, as chapter answers (the two misses are two answers; saved standing only moves on a right answer)
    expect((await chapter([T, T, T, T, F, F, T, T, T, T, T])).out).toEqual([F, F, F, F, F, F, F, F, F, F, T])
  })
})

describe('② the old count rule alone no longer masters', () => {
  it('a miss then seven rights: the old rule (tier 3 + 6 in a row) mastered at answer 7; now answer 8', async () => {
    const c = await chapter([F, T, T, T, T, T, T, T])
    expect(c.out[6], 'answer 7 is mastered: the retired count rule is still deciding').toBe(false)
    expect(c.out).toEqual([F, F, F, F, F, F, F, T])
    expect(c.saved).toEqual([F, F, F, F, F, F, F, T])
    // …and a topic given the same outcomes (second, then six firsts) masters on the same (7th) outcome.
    expect(topic(['second', 'first', 'first', 'first', 'first', 'first', 'first'])).toEqual([F, F, F, F, F, F, T])
  })
})
