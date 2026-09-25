/**
 * PERF-03 (docs/review/PERFORMANCE.md): one /parent load reads each child's `lesson_progress` ONCE.
 * The pull that brings the account's topics onto the device already reads the rows; the parent's report
 * (the "finding it hard" reminder) must reuse them, not read the table a second time per child.
 *
 * The real dashboard is mounted against a stubbed Supabase client that logs every table read with its learner.
 * Property checked: for 3 children, `lesson_progress` is read exactly 3 times, once per child — and what the
 * dashboard shows from those rows (the stuck reminder, the lessons-done count) is the text written out below,
 * which it also was before the change.
 * ⚠️ The expected strings are written out by hand, never imported: a check that imports its value equals itself.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const reads = vi.hoisted(() => [] as string[])
const nav = vi.hoisted(() => ({ qs: '' }))
const router = vi.hoisted(() => ({ replace: () => {}, push: (u: string) => { nav.qs = u.split('?')[1] ?? '' }, refresh: () => {} }))
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(nav.qs),
  usePathname: () => '/parent',
}))
vi.mock('@/data/auth', async orig => ({
  ...(await orig<Record<string, unknown>>()),
  getCurrentSession: async () => ({ user: { id: 'p1', email: 'p@x.test', user_metadata: { first_name: 'Sam' } } }),
}))

// ── the account the dashboard reads: three children ──
const KIDS = ['kid-a', 'kid-b', 'kid-c']
const NAMES: Record<string, string> = { 'kid-a': 'Ada', 'kid-b': 'Ben', 'kid-c': 'Cy' }
const recent = () => new Date(Date.now() - 3_600_000).toISOString()
// Ada and Ben each missed g3m1-t1 six times on the first try. Only Ben's progress row says he has since mastered it,
// so only Ada is "finding it hard" — the reminder exists only if the report read the lesson_progress rows.
const points = (id: string) => id === 'kid-c' ? [] : Array.from({ length: 6 }, () => ({ lesson_id: 'g3m1-t1', reason: 'problem', points: 1, created_at: recent() }))
const progress = (id: string) =>
  id === 'kid-b' ? [{ lesson_id: 'g3m1-t1', done: true, level: 3, streak: 0, mastered: true, run: null }]
  : id === 'kid-c' ? ['g3m1-t1', 'g3m1-t2'].map(l => ({ lesson_id: l, done: true, level: 3, streak: 0, mastered: false, run: null }))
  : []

vi.mock('@/data/supabase/client', () => {
  // A query builder: every filter returns the builder; awaiting it answers by table and `learner_id`.
  const query = (table: string) => {
    let learner: string | null = null
    const answer = () => {
      if (table === 'lesson_progress' || table === 'point_events') reads.push(`${table}:${learner}`)
      const data = table === 'lesson_progress' ? progress(learner!) : table === 'point_events' ? points(learner!) : table === 'profiles' ? { role: 'parent' } : []
      return { data, error: null }
    }
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
          role: 'owner', stats: null, progress: [], sessions: [] })), error: null }
        if (fn === 'game_wallet') return { data: { balance: 0, points_per_minute: 8, enabled: true, minutes_per_day: 20, time_zone: 'UTC', minutes_used_today: 0, playing_until: null }, error: null }
        return { data: null, error: null }
      },
    }),
  }
})

beforeAll(async () => { await import('@/app/parent/page') }, 120_000)
beforeEach(() => {
  reads.length = 0; nav.qs = ''; localStorage.clear()
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })))
})

const settle = () => act(async () => { for (let i = 0; i < 10; i++) await new Promise(r => setTimeout(r, 0)) })

describe('/parent reads each child\'s lesson_progress once (PERF-03)', () => {
  it('3 children → lesson_progress read 3 times (once each), and the dashboard shows the same things', async () => {
    const { default: Dashboard } = await import('@/app/parent/page')
    const host = document.createElement('div'); document.body.appendChild(host)
    const root = createRoot(host)
    await act(async () => { root.render(createElement(Dashboard)) })
    await settle()

    // Control: the point_events reads happened for each child, so the report ran and the stub sees reads.
    expect(reads.filter(r => r.startsWith('point_events:')).sort()).toEqual(['point_events:kid-a', 'point_events:kid-b', 'point_events:kid-c'])
    expect(reads.filter(r => r.startsWith('lesson_progress:')).sort()).toEqual(['lesson_progress:kid-a', 'lesson_progress:kid-b', 'lesson_progress:kid-c'])

    // What the rows are shown as, written out. The home cards count topics the pull marked done from the account rows.
    const text = host.textContent ?? ''
    expect(text).toContain('Adalast played —Next lessonPlates of cookiesDone0 of 3 lessons')
    expect(text).toContain('Benlast played —Next lessonRows of chairsDone1 of 3 lessons')
    expect(text).toContain('Cylast played —Next lessonTurn the trayDone2 of 3 lessons')
    // The report: Ada is stuck on g3m1-t1; Ben mastered it (his progress row), so he is not — in Up next, Reminders and the recap.
    expect(text).toContain('Ada is finding “Plates of cookies” hard')
    expect(text).toContain('Ada6 problems answered · finding “Plates of cookies” hardOpen')
    expect(text).toContain('Ben6 problems answeredOpen')
    expect(text).not.toContain('Ben is finding')

    await act(async () => root.unmount()); host.remove()
  })
})
