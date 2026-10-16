/**
 * Perf, 2026-10-16: /modules on mount. Each request is ~250 ms from India to the database, so the child's home must not
 * ask twice for the same thing: the learner list is read ONCE (the page passes the child's row to ModuleHome, which
 * used to read every learner again), and a class's 20-second poll asks nothing while the tab is hidden.
 * Driven through the real page and the real ModuleHome; only the network calls are stubbed, and counted.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'

const n = vi.hoisted(() => ({ learners: 0, classMode: 0, wallet: 0, pulls: 0 }))
const kid = vi.hoisted(() => ({ id: 'kid-1', display_name: 'Kid', avatar_index: 0, age_group: '9-11', created_by: 'parent-1', grade_id: 'class-1', lesson_ids: null }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: () => {} }), useSearchParams: () => new URLSearchParams('grade=4') }))
vi.mock('@/data/auth', () => ({ mustChangePassword: async () => false }))
vi.mock('@/data/supabase/useLearnerSession', () => ({ getActiveLearner: () => kid, setActiveLearner: () => {} }))
vi.mock('@/data/repositories', () => ({
  getMyRole: async () => 'parent',
  signOut: async () => true,
  getMyLearners: async () => { n.learners++; return [{ ...kid, accessRole: 'owner' }] },
  getClassMode: async () => { n.classMode++; return { mode: 'lessons', classId: 'class-1', className: 'C', exercises: [] } },
}))
vi.mock('@/data/repositories/points', () => ({ getWallet: async () => { n.wallet++; return { balance: 7 } } }))
vi.mock('@/infra/storage/lessonSync', () => ({ pullLessonProgress: async () => { n.pulls++; return [] }, pendingLessonUploads: () => 0 }))

const { default: ModulesPage } = await import('@/app/modules/page')

let host: HTMLDivElement
beforeEach(() => { Object.assign(n, { learners: 0, classMode: 0, wallet: 0, pulls: 0 }); host = document.createElement('div'); document.body.append(host) })
afterEach(() => { host.remove(); vi.useRealTimers() })

const hidden = (h: boolean) => Object.defineProperty(document, 'hidden', { configurable: true, get: () => h })

describe('/modules mount', () => {
  it('reads the learner list once, the class once, the wallet once and pulls progress once', async () => {
    const root = createRoot(host)
    await act(async () => { root.render(createElement(ModulesPage)) })
    await act(async () => {})
    expect(host.textContent).toContain('7 points')   // the home really rendered, with the wallet it read
    expect(n).toEqual({ learners: 1, classMode: 1, wallet: 1, pulls: 1 })
    act(() => root.unmount())
  })

  it("a class's 20-second poll asks nothing while the tab is hidden; POSITIVE TWIN: it asks when shown", async () => {
    vi.useFakeTimers()
    const root = createRoot(host)
    await act(async () => { root.render(createElement(ModulesPage)) })
    await act(async () => { await vi.advanceTimersByTimeAsync(0) })
    expect(n.classMode).toBe(1)
    hidden(true)
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000) })
    expect(n.classMode).toBe(1)
    hidden(false)
    await act(async () => { await vi.advanceTimersByTimeAsync(20_000) })
    expect(n.classMode).toBe(2)
    act(() => root.unmount())
  })
})
