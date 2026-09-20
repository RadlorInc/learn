/**
 * A 3–8 STORY CHAPTER RECORDS ITSELF THE WAY A NEW-FLOW TOPIC DOES.
 *
 * Founder's call, 2026-09-20: *"unke data ka collection same abhi joh modules waalo ka hai wohi
 * kardo"* — one row per chapter in `lesson_progress`, points from the database, one upload queue.
 * Two things can silently undo that, and neither shows up in a type-check:
 *
 *   ① the WIRE. `useAdaptive.record` is the single function every chapter's every answer passes
 *      through; if its upload is dropped, every chapter still plays perfectly and nothing is
 *      recorded. That is the exact shape of `ChapterProps.onComplete`, which cost this repo three
 *      months — typed, passed, and discarded by the one caller nobody re-read.
 *
 *   ② the DEPLOY ORDER. `lesson_progress.lesson_id` rejects a `c:` id until migration
 *      20260920120000 is applied, and `classifySyncError` classes a check violation as **'drop'**.
 *      `main` auto-deploys and migrations are applied by hand, so code-first is the DEFAULT order
 *      here — without the guard in `points.ts` a child's whole chapter is discarded with no error
 *      anywhere. ② asserts the row is KEPT for a later retry.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'

const rpc = vi.fn()
vi.mock('@/data/repositories/_shared', async () => {
  const actual = await vi.importActual<typeof import('@/data/repositories/_shared')>('@/data/repositories/_shared')
  return { ...actual, db: () => ({ rpc }) }
})

const learner = { id: 'L-drive', display_name: 'Probe', avatar_index: 0, age_group: '3-5' }
vi.mock('@/data/supabase/useLearnerSession', () => ({ getActiveLearner: () => learner }))

const store = new Map<string, string>()
vi.mock('@/infra/storage/kv', () => ({
  kv: {
    get: (k: string) => store.get(k) ?? null,
    set: (k: string, v: string) => { store.set(k, v) },
    remove: (k: string) => { store.delete(k) },
    ready: () => Promise.resolve(),
  },
}))

import { chapterKey } from '@/core/chapters'
import { recordLessonProgress } from '@/data/repositories/points'
import { syncLesson, flushLessonSync, pendingLessonUploads } from '@/infra/storage/lessonSync'

beforeEach(() => { store.clear(); rpc.mockReset() })

describe('① the chapter reaches the SAME record a topic does', () => {
  it('uploads through record_lesson_progress, under a c: id, with the answer that earned it', async () => {
    rpc.mockResolvedValue({ error: null })
    syncLesson('L1', chapterKey('counting'), 'first')
    await flushLessonSync()

    expect(rpc, 'a chapter answer did not reach the lesson RPC at all').toHaveBeenCalledTimes(1)
    const [fn, args] = rpc.mock.calls[0]
    expect(fn, 'a chapter is writing somewhere a topic does not').toBe('record_lesson_progress')
    expect(args.p_lesson, 'the chapter id is not namespaced — it would read as a topic').toBe('c:counting')
    // 'first' is what earns 2 points rather than 1 (docs/new-flow/points.md).
    expect(args.p_outcome, 'the answer was sent with no outcome, so it earns nothing').toBe('first')
    expect(args.p_event, 'no event id — the database cannot make the points once-only').toBeTruthy()
    expect(pendingLessonUploads(), 'the upload landed but stayed in the queue').toBe(0)
  })

  it('the two id namespaces cannot collide', () => {
    // The `c:` prefix is what keeps a chapter out of every "how is this child doing on g5m1" read.
    expect(chapterKey('counting')).toBe('c:counting')
    expect(chapterKey('counting')).not.toMatch(/^g[3-8]m/)
  })
})

describe('② a chapter row is KEPT when the migration has not been applied yet', () => {
  it('a check violation on a c: id retries instead of dropping the child’s work', async () => {
    rpc.mockResolvedValue({ error: { code: '23514', message: 'violates check constraint' } })
    expect(await recordLessonProgress('L1', 'c:counting', { done: true, level: 2, streak: 1, mastered: false }))
      .toBe('retry')
  })

  it('…and the queue holds it rather than discarding it', async () => {
    rpc.mockResolvedValue({ error: { code: '23514', message: 'violates check constraint' } })
    syncLesson('L1', chapterKey('shapes'), 'first')
    await flushLessonSync()
    expect(pendingLessonUploads(), 'the chapter was thrown away before the migration landed').toBe(1)
  })

  it('a check violation on a TOPIC id still drops — the guard is narrow, not a blanket retry', async () => {
    // A genuinely malformed row must not loop in the queue for ever. Only the case the migration
    // fixes is retried; everything else keeps the old classification.
    rpc.mockResolvedValue({ error: { code: '23514', message: 'violates check constraint' } })
    expect(await recordLessonProgress('L1', 'g5m1-t1', { done: true, level: 2, streak: 1, mastered: false }))
      .toBe('drop')
  })
})

/**
 * ③ THE WIRE, DRIVEN RATHER THAN READ. `useAdaptive.record` is where a chapter's answer enters the
 * system; this renders the REAL hook and calls it the way `StoryWorld.onSubmit` does.
 *
 * ⚠️ A source check would not do. "`onSubmit` calls `ada.record`" was true the whole time the
 * upload was missing, and the screen looks identical either way — that is precisely the shape of
 * `ChapterProps.onComplete`, which was typed, passed and dropped for three months.
 */
import { useAdaptive } from '@/shared/hooks/useAdaptive'
import { loadStanding } from '@/infra/storage/lessonStanding'

describe('③ answering a chapter question records it, through the real hook', () => {
  const drive = (answers: boolean[]) => {
    let api: ReturnType<typeof useAdaptive> | null = null
    const Probe = () => { api = useAdaptive('counting'); return null }
    const host = document.createElement('div')
    const root = createRoot(host)
    act(() => { root.render(createElement(Probe)) })
    for (const a of answers) act(() => { api!.record(a) })
    act(() => { root.unmount() })
  }

  it('a correct answer queues an upload under the chapter’s c: id, with its standing', async () => {
    rpc.mockResolvedValue({ error: null })
    drive([true])
    await flushLessonSync()

    expect(rpc, 'answering a chapter question recorded nothing at all').toHaveBeenCalledTimes(1)
    const [fn, args] = rpc.mock.calls[0]
    expect(fn).toBe('record_lesson_progress')
    expect(args.p_lesson).toBe('c:counting')
    expect(args.p_outcome, 'a first-try answer must earn the first-try points').toBe('first')
    expect(args.p_level, 'the tier the child is on was not carried').toBe(1)
    // …and the device copy the next run resumes from agrees with what was sent.
    expect(loadStanding('L-drive', 'c:counting')).toMatchObject({ level: 1, streak: 1, mastered: false })
  })

  it('a correct answer AFTER a miss is worth less — the same distinction a topic makes', async () => {
    rpc.mockResolvedValue({ error: null })
    drive([false, true])
    await flushLessonSync()

    const outcomes = rpc.mock.calls.map(([, a]) => a.p_outcome)
    expect(outcomes, 'a miss should not upload, and the recovery should not count as first-try').toEqual(['second'])
  })
})
