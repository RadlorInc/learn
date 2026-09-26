/**
 * N18 (founder, 2026-09-26): "last played" on the parent's child card is the child's newest `lesson_progress.updated_at`.
 * It used to read `learner_stats.last_played_at`, which only the deleted chapter sync wrote, so every card said "—".
 *
 * The real /parent page is mounted against a stubbed Supabase client. Property checked, on the rendered card text:
 *   - Ben has one progress row (updated 2026-09-20)         → "last played 9/20/2026"
 *   - Cy has two rows (updated 2026-09-22 and 2026-09-24)   → the NEWER one, "last played 9/24/2026"
 *   - Ada has no progress row but a legacy `learner_stats.last_played_at` (2026-09-10) → "last played —":
 *     the legacy column is no longer read.
 * Dates are noon UTC so the local calendar day is the same in every time zone from UTC−11 to UTC+11. The rendered form
 * is `toLocaleDateString` in the runner's default locale (en-US here and on CI).
 * ⚠️ Expected strings are written out by hand, never imported: a check that imports its value equals itself.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const router = vi.hoisted(() => ({ replace: () => {}, push: () => {}, refresh: () => {} }))
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(''),
  usePathname: () => '/parent',
}))
vi.mock('@/data/auth', async orig => ({
  ...(await orig<Record<string, unknown>>()),
  getCurrentSession: async () => ({ user: { id: 'p1', email: 'p@x.test', user_metadata: { first_name: 'Sam' } } }),
}))

const KIDS = ['kid-a', 'kid-b', 'kid-c']
const NAMES: Record<string, string> = { 'kid-a': 'Ada', 'kid-b': 'Ben', 'kid-c': 'Cy' }
const row = (lesson_id: string, updated_at: string) => ({ lesson_id, done: false, level: 0, streak: 0, mastered: false, run: null, updated_at })
const progress = (id: string) =>
  id === 'kid-b' ? [row('g3m1-t1', '2026-09-20T12:00:00+00:00')]
  : id === 'kid-c' ? [row('g3m1-t1', '2026-09-22T12:00:00+00:00'), row('g3m1-t2', '2026-09-24T12:00:00+00:00')]
  : []

vi.mock('@/data/supabase/client', () => {
  const query = (table: string) => {
    let learner: string | null = null
    const answer = () => ({ data: table === 'lesson_progress' ? progress(learner!) : table === 'profiles' ? { role: 'parent' } : [], error: null })
    const b: Record<string, unknown> = new Proxy({}, {
      get: (_t, k) => k === 'then' ? (res: (x: unknown) => void) => res(answer())
        : (...args: unknown[]) => { if (k === 'eq' && args[0] === 'learner_id') learner = args[1] as string; return b },
    })
    return b
  }
  return {
    createClient: () => ({
      auth: {
        getSession: async () => ({ data: { session: { access_token: 't', user: { id: 'p1', email: 'p@x.test' } } } }),
        getUser: async () => ({ data: { user: { id: 'p1', email: 'p@x.test' } } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      },
      from: (t: string) => query(t),
      rpc: async (fn: string) => {
        if (fn === 'get_parent_dashboard') return { data: KIDS.map(id => ({
          learner: { id, display_name: NAMES[id], age_group: '9-11', avatar_index: 0, lesson_ids: ['g3m1-t1', 'g3m1-t2', 'g3m1-t3'], lesson_due: {}, created_at: '2026-09-01T00:00:00Z' },
          role: 'owner',
          // The legacy column, set only for Ada: it must not reach her card.
          stats: id === 'kid-a' ? { learner_id: id, total_xp: 0, total_coins: 0, current_level: 1, last_played_at: '2026-09-10T12:00:00+00:00' } : null,
          progress: [], sessions: [] })), error: null }
        if (fn === 'game_wallet') return { data: { balance: 0, points_per_minute: 8, enabled: true, minutes_per_day: 20, time_zone: 'UTC', minutes_used_today: 0, playing_until: null }, error: null }
        return { data: null, error: null }
      },
    }),
  }
})

beforeAll(async () => { await import('@/app/parent/page') }, 120_000)
beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })))
})

const settle = () => act(async () => { for (let i = 0; i < 10; i++) await new Promise(r => setTimeout(r, 0)) })

describe('/parent "last played" comes from lesson_progress.updated_at (N18)', () => {
  it('newest row per child; no row → "—" even when the legacy column holds a date', async () => {
    const { default: Dashboard } = await import('@/app/parent/page')
    const host = document.createElement('div'); document.body.appendChild(host)
    const root = createRoot(host)
    await act(async () => { root.render(createElement(Dashboard)) })
    await settle()

    const text = host.textContent ?? ''
    expect(text).toContain('Adalast played —Next lesson')
    expect(text).toContain('Benlast played 9/20/2026Next lesson')
    expect(text).toContain('Cylast played 9/24/2026Next lesson')

    await act(async () => root.unmount()); host.remove()
  })
})
