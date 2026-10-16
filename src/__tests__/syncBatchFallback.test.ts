/**
 * Code deploys before migrations here (docs/runbooks/migrations.md), so the app meets a database WITHOUT sync_batch
 * (20261016120000) first. It must then upload exactly as before — one request per item — and ask for sync_batch once,
 * not before every item. Its own file: the "no sync_batch" answer is remembered for the page.
 */
import { describe, it, expect, vi } from 'vitest'

const rpc = vi.fn()
vi.mock('@/data/repositories/_shared', async (orig) => {
  const actual = await orig<typeof import('@/data/repositories/_shared')>()
  return { ...actual, db: () => ({ rpc, auth: { getSession: async () => ({ data: { session: { user: { id: 'parent' } } } }) } }) }
})
const { syncLesson, syncRun, flushLessonSync, pendingLessonUploads } = await import('@/infra/storage/lessonSync')

describe('a database without sync_batch', () => {
  it('sends each item on its own, in order, and asks for sync_batch only once', async () => {
    rpc.mockImplementation(async (fn: string) => ({ error: fn === 'sync_batch' ? { code: 'PGRST202', message: 'Could not find the function public.sync_batch(p_items) in the schema cache' } : null }))
    syncLesson('L', 'g3m2-t1', 'first'); syncRun('L', 'g3m2-t1')
    await flushLessonSync()
    syncLesson('L', 'g3m2-t2', 'second')
    await flushLessonSync()
    expect(rpc.mock.calls.map(c => c[0])).toEqual(['sync_batch', 'record_lesson_progress', 'save_practice_run', 'record_lesson_progress'])
    expect(pendingLessonUploads()).toBe(0)
  })
})
