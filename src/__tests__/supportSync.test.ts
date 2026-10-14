/**
 * What support can see, and what is kept, when uploads fail (docs/runbooks/support.md, the diagnostic table).
 * Driven through the real lessonSync queue, the real kv (its localStorage mode — jsdom has no IndexedDB), the real
 * diagnostics block and the real sign-out; only Supabase, fetch and `confirm` are stubbed. Expected strings are written
 * out by hand.
 *  - a refusal classifySyncError calls 'drop' (42501 here) keeps the item for a week and reports it — a bad migration
 *    answered that for EVERY row, and the queue deleted them all on the first refusal, silently;
 *  - the block shows the last upload and the last sync error, and a store write that failed;
 *  - a failed upload is retried on a timer while online, not only on the next answer;
 *  - page errors reach /api/report-error, once per message;
 *  - sign-out with work still waiting asks first;
 *  - the queue overflowing leaves a breadcrumb.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const world = vi.hoisted(() => ({ rpc: (async () => ({ error: null })) as (fn: string, a: Record<string, unknown>) => Promise<unknown>, signedOut: 0 }))
vi.mock('@/data/repositories/_shared', async (orig) => {
  const actual = await orig<typeof import('@/data/repositories/_shared')>()
  const auth = {
    getSession: async () => ({ data: { session: { user: { id: 'parent' } } } }),
    signOut: async () => { world.signedOut++; return { error: null } },
  }
  return { ...actual, db: () => ({ rpc: (fn: string, a: Record<string, unknown>) => world.rpc(fn, a), auth }) }
})
vi.mock('@/data/auth', () => ({ logAuthEvent: async () => {}, getCurrentSession: async () => null }))

const { syncLesson, flushLessonSync, pendingLessonUploads } = await import('@/infra/storage/lessonSync')
const { collectDiagnostics, formatDiagnostics } = await import('@/infra/diagnostics')
const { getRecentErrors } = await import('@/infra/storage/lastError')
const { installErrorCapture } = await import('@/infra/reportCrash')
const { signOut } = await import('@/data/repositories/profile')

const L1 = '11111111-1111-4111-8111-111111111111', L2 = '22222222-2222-4222-8222-222222222222'
let reports: string[]
const block = async () => formatDiagnostics(await collectDiagnostics())

beforeEach(async () => {
  vi.useRealTimers()
  localStorage.clear()
  world.rpc = async () => ({ error: null })
  await flushLessonSync()          // an empty queue: clears any retry timer a test left and resets its back-off
  reports = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string }) => {
    if (url === '/api/report-error') reports.push(JSON.parse(init?.body ?? '{}').message)
    return { ok: true }
  }))
})
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('a refusal the queue used to delete on sight', () => {
  it('is kept, reported, and does not hold the other children; after a week it is deleted and reported again', async () => {
    world.rpc = async (_fn, a) => (a.p_learner === L1 ? { error: { code: '42501', message: 'permission denied' } } : { error: null })
    syncLesson(L1, 'g3m2-t1', 'first')
    syncLesson(L2, 'g3m2-t1', 'first')
    await flushLessonSync()
    expect(pendingLessonUploads()).toBe(1)                    // L1's answer is still on the device; L2's went up
    expect(reports).toEqual(['upload refused 42501: kept on the device, retrying'])

    await flushLessonSync()
    expect(pendingLessonUploads()).toBe(1)                    // still kept inside the week

    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 8 * 24 * 60 * 60 * 1000)
    await flushLessonSync()
    expect(pendingLessonUploads()).toBe(0)
    expect(reports).toContain('upload refused 42501 for 7 days: deleted from the device')
  })
})

describe('the diagnostic block', () => {
  it('names the last sync error and the last upload', async () => {
    expect(await block()).toContain('last sent never on this device')
    world.rpc = async () => ({ error: { code: '23514', message: 'check' } })
    syncLesson(L1, 'g3m2-t2', 'first')
    await flushLessonSync()
    expect(await block()).toMatch(/sync err {2}23514 at \d{4}-/)

    world.rpc = async () => ({ error: null })
    syncLesson(L1, 'g3m2-t3', 'first')
    await flushLessonSync()
    expect(await block()).toMatch(/last sent \d{4}-/)
  })

  it('shows a store write that failed', async () => {
    // On the prototype: jsdom's Storage turns an own-property assignment into a stored item.
    const real = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, k: string, v: string) {
      if (k === 'milo-lesson-sync-queue') throw new Error('QuotaExceededError')
      real.call(this, k, v)
    })
    syncLesson(L1, 'g3m2-t4', 'first')
    expect(await block()).toMatch(/save err {2}\S+ milo-lesson-sync-queue: QuotaExceededError/)
  })
})

describe('retrying while online', () => {
  it('a failed upload is sent again on a timer, with nobody answering anything', async () => {
    vi.useFakeTimers()
    let fail = true
    world.rpc = async () => { if (fail) throw new TypeError('Failed to fetch'); return { error: null } }
    syncLesson(L1, 'g3m2-t5', 'first')
    await flushLessonSync()
    expect(pendingLessonUploads()).toBe(1)
    fail = false
    // No flush is called from here on: calling one would do the retry itself and hide a missing timer.
    await vi.advanceTimersByTimeAsync(29_000)
    expect(pendingLessonUploads()).toBe(1)                    // not before the first 30 s
    await vi.advanceTimersByTimeAsync(2_000)
    await vi.waitFor(() => expect(pendingLessonUploads()).toBe(0))
  })
})

describe('page errors', () => {
  it('reach /api/report-error, once per message', () => {
    installErrorCapture()
    for (let i = 0; i < 3; i++) window.dispatchEvent(new ErrorEvent('error', { message: 'chunk failed to load' }))
    expect(reports).toEqual(['chunk failed to load'])
  })

  // Seen on production 5–6 Oct: six of these from /test in two days, each one a digest `!!` with nothing wrong.
  it("Chrome's ResizeObserver notice stays on the device and is not reported", async () => {
    installErrorCapture()
    window.dispatchEvent(new ErrorEvent('error', { message: 'ResizeObserver loop completed with undelivered notifications.' }))
    window.dispatchEvent(new ErrorEvent('error', { message: 'ResizeObserver loop limit exceeded' }))
    expect(reports).toEqual([])
    expect(await block()).toContain('[window] ResizeObserver loop completed with undelivered notifications.')
  })
})

describe('signing out', () => {
  it('with an answer still waiting asks first, and staying signed in signs nothing out', async () => {
    world.rpc = async () => { throw new TypeError('Failed to fetch') }
    syncLesson(L1, 'g3m2-t6', 'first')
    await flushLessonSync()
    const ask = vi.spyOn(window, 'confirm').mockReturnValue(false)
    expect(await signOut()).toBe(false)
    expect(ask).toHaveBeenCalledOnce()
    expect(world.signedOut).toBe(0)
  })

  it('CONTROL: with nothing waiting it signs out without asking', async () => {
    const ask = vi.spyOn(window, 'confirm').mockReturnValue(false)
    await signOut()
    expect(ask).not.toHaveBeenCalled()
    expect(world.signedOut).toBe(1)
  })
})

describe('the queue overflowing', () => {
  it('leaves a breadcrumb', () => {
    localStorage.setItem('milo-lesson-sync-queue', JSON.stringify(Array.from({ length: 2000 }, (_, i) => ({ id: `x${i}`, learnerId: L2, lessonId: 't', owner: 'other' }))))
    syncLesson(L1, 'g3m2-t7', 'first')
    expect(getRecentErrors().map(e => e.msg)).toContain('upload queue full: 1 oldest dropped')
  })
})
