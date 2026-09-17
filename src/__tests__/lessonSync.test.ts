/**
 * Lesson progress follows the account (src/infra/storage/lessonSync.ts), against a stubbed Supabase.
 * What must hold: nothing earned is lost while the migration is not applied or the device is offline; a retry reuses its
 * event id (so the database pays once); another device's progress arrives; this device's older progress goes up; and a
 * topic with an upload still waiting is not overwritten by the older server copy.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const rpc = vi.fn()
let rows: unknown = []
vi.mock('@/data/repositories/_shared', async (orig) => {
  const actual = await orig<typeof import('@/data/repositories/_shared')>()
  return { ...actual, db: () => ({ rpc, from: () => ({ select: () => ({ eq: async () => (rows === null ? { error: { code: 'x' } } : { data: rows }) }) }) }) }
})

const { syncLesson, flushLessonSync, pullLessonProgress } = await import('@/infra/storage/lessonSync')
const { lessonDone, markLessonDone } = await import('@/infra/storage/lessonProgress')
const { loadStanding, saveStanding } = await import('@/infra/storage/lessonStanding')

const PGRST202 = { code: 'PGRST202', message: 'Could not find the function public.record_lesson_progress in the schema cache' }
const calls = () => rpc.mock.calls.map(c => c[1] as Record<string, unknown>)

beforeEach(() => { rpc.mockReset(); localStorage.clear(); rows = [] })

describe('uploads', () => {
  it('keep waiting while the database lacks the function, then go up with the device\'s state and the SAME event id', async () => {
    rpc.mockResolvedValue({ error: PGRST202 })
    saveStanding('L', 'g3m2-t1', { level: 1, streak: 0, mastered: false })
    syncLesson('L', 'g3m2-t1', 'first')
    await flushLessonSync()
    await flushLessonSync()
    expect(rpc).toHaveBeenCalledTimes(2)
    const [a, b] = calls()
    expect(a.p_event).toBeTruthy()
    expect(b.p_event).toBe(a.p_event)

    rpc.mockReset(); rpc.mockResolvedValue({ error: null })
    await flushLessonSync()
    expect(calls()).toEqual([expect.objectContaining({ p_learner: 'L', p_lesson: 'g3m2-t1', p_level: 1, p_outcome: 'first', p_event: a.p_event })])
    rpc.mockReset()
    await flushLessonSync()
    expect(rpc).not.toHaveBeenCalled()   // the queue emptied
  })

  it('a device with no learner (not signed in) queues nothing', async () => {
    syncLesson(null, 'g3m2-t1', 'first')
    await flushLessonSync()
    expect(rpc).not.toHaveBeenCalled()
  })
})

describe('pulling the account onto a device', () => {
  it('brings another device\'s progress here, and sends up what only this device has', async () => {
    rpc.mockResolvedValue({ error: null })
    rows = [{ lesson_id: 'g3m2-t1', done: true, level: 3, streak: 1, mastered: true }]
    markLessonDone('L', 'g3m2-t2')   // done here before sync existed
    expect(await pullLessonProgress('L', ['g3m2-t1', 'g3m2-t2', 'g3m2-t3'])).toBe(true)
    expect(lessonDone('L', 'g3m2-t1')).toBe(true)
    expect(loadStanding('L', 'g3m2-t1')).toEqual({ level: 3, streak: 1, mastered: true })
    await flushLessonSync()
    expect(calls().map(c => [c.p_lesson, c.p_done])).toEqual([['g3m2-t2', true]])
  })

  it('does not overwrite a topic whose own upload is still waiting', async () => {
    rpc.mockResolvedValue({ error: PGRST202 })
    saveStanding('L', 'g3m2-t1', { level: 4, streak: 0, mastered: true })
    syncLesson('L', 'g3m2-t1', 'first')
    rows = [{ lesson_id: 'g3m2-t1', done: false, level: 0, streak: 0, mastered: false }]
    await pullLessonProgress('L', ['g3m2-t1'])
    expect(loadStanding('L', 'g3m2-t1')).toEqual({ level: 4, streak: 0, mastered: true })
  })

  it('leaves the device alone when the account cannot be read', async () => {
    saveStanding('L', 'g3m2-t1', { level: 2, streak: 0, mastered: false })
    rows = null
    expect(await pullLessonProgress('L', ['g3m2-t1'])).toBe(false)
    expect(loadStanding('L', 'g3m2-t1')).toEqual({ level: 2, streak: 0, mastered: false })
  })
})
