/**
 * THE PARENT IS TOLD BEFORE CONFIRMING (founder, 6 Oct 2026): withdrawing for every child cancels a paid plan today and
 * refunds the unused part; deleting one child takes that child's seat off a paid plan and refunds it (the last child:
 * the whole plan). A free family is shown no billing words.
 *
 * The real /parent page, mounted against a stubbed Supabase client with the paywall on; each line is read AFTER the
 * click that opens its confirmation, with the confirmation's own words as the control. Expected strings are written
 * out by hand, never imported from copy.ts or i18n.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const w = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_PAYWALL = 'on'   // read once, when useTopicGate loads
  return { qs: '', plan: null as null | { status: string; seats_paid: number }, kids: ['kid-a', 'kid-b'] }
})
const router = vi.hoisted(() => ({ replace: () => {}, push: () => {}, refresh: () => {} }))
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(w.qs),
  usePathname: () => '/parent',
}))
vi.mock('@/data/auth', async orig => ({
  ...(await orig<Record<string, unknown>>()),
  getCurrentSession: async () => ({ user: { id: 'p1', email: 'p@x.test', user_metadata: { first_name: 'Sam' } } }),
}))
const NAMES: Record<string, string> = { 'kid-a': 'Ada', 'kid-b': 'Ben' }
vi.mock('@/data/supabase/client', () => {
  const query = (table: string) => {
    const answer = () => ({ data: table === 'subscriptions' ? w.plan : table === 'profiles' ? { role: 'parent' } : [], error: null })
    const b: Record<string, unknown> = new Proxy({}, {
      get: (_t, k) => k === 'then' ? (res: (x: unknown) => void) => res(answer()) : () => b,
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
        if (fn === 'get_parent_dashboard') return { data: w.kids.map(id => ({
          learner: { id, display_name: NAMES[id], age_group: '9-11', avatar_index: 0, lesson_ids: ['g3m1-t1'], lesson_due: {}, created_at: '2026-09-01T00:00:00Z' },
          role: 'owner', stats: null, progress: [], sessions: [] })), error: null }
        if (fn === 'game_wallet') return { data: { balance: 0, points_per_minute: 8, enabled: true, minutes_per_day: 20, time_zone: 'UTC', minutes_used_today: 0, playing_until: null }, error: null }
        return { data: null, error: null }
      },
    }),
  }
})

beforeAll(async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })))
  await import('@/app/parent/page')
}, 120_000)

const settle = () => act(async () => { for (let i = 0; i < 10; i++) await new Promise(r => setTimeout(r, 0)) })

/** Mount /parent?<qs>, click the button whose text is `button`, return the page text before and after. */
async function confirmScreen(qs: string, button: string) {
  w.qs = qs
  localStorage.clear()
  const { default: Dashboard } = await import('@/app/parent/page')
  const host = document.createElement('div'); document.body.appendChild(host)
  const root = createRoot(host)
  await act(async () => { root.render(createElement(Dashboard)) })
  await settle()
  const before = host.textContent ?? ''
  const b = [...host.querySelectorAll('button')].find(x => x.textContent?.includes(button))
  if (!b) throw new Error(`no button "${button}" on /parent?${qs} — the page did not render what the test drives`)
  await act(async () => { b.click() })
  await settle()
  const after = host.textContent ?? ''
  await act(async () => root.unmount()); host.remove()
  return { before, after }
}

const WITHDRAW_ALL_LINE = 'If you have a paid plan, this also cancels it today and refunds the part you have not used to your card.'
const SEAT_LINE = 'Their seat comes off your paid plan today, and the part of it you have not used is refunded to your card.'
const LAST_LINE = 'This is your last child, so your paid plan is cancelled today and the part you have not used is refunded to your card.'
const PAID = { status: 'active', seats_paid: 2 }

describe('withdraw for every child: the plan line, before the parent confirms', () => {
  it('a paid family sees that the plan is cancelled today and refunded — after the click, not before', async () => {
    w.plan = PAID; w.kids = ['kid-a', 'kid-b']
    const { before, after } = await confirmScreen('view=account', 'Withdraw permission for all your children')
    expect(after, 'control: the confirmation opened').toContain("Withdraw permission and delete my children's data")
    expect(before).not.toContain(WITHDRAW_ALL_LINE)
    expect(after).toContain(WITHDRAW_ALL_LINE)
  })
  it('a free family sees the same confirmation with no billing words', async () => {
    w.plan = null; w.kids = ['kid-a', 'kid-b']
    const { after } = await confirmScreen('view=account', 'Withdraw permission for all your children')
    expect(after, 'control: the confirmation opened').toContain("Withdraw permission and delete my children's data")
    expect(after).not.toMatch(/refund|paid plan/i)
  })
})

describe('delete one child: the seat line, before the parent confirms', () => {
  it('a paid family with every child seated sees the seat come off and be refunded', async () => {
    w.plan = PAID; w.kids = ['kid-a', 'kid-b']
    const { before, after } = await confirmScreen('child=kid-a&tab=login', 'Delete Ada’s profile')
    expect(after, 'control: the confirmation opened').toContain('Permanently delete Ada?')
    expect(before).not.toContain(SEAT_LINE)
    expect(after).toContain(SEAT_LINE)
    expect(after).not.toContain(LAST_LINE)
  })
  it('the last child: the whole plan is cancelled and refunded, as withdrawing for every child is', async () => {
    w.plan = { status: 'active', seats_paid: 1 }; w.kids = ['kid-a']
    const { after } = await confirmScreen('child=kid-a&tab=login', 'Delete Ada’s profile')
    expect(after).toContain(LAST_LINE)
    expect(after).not.toContain(SEAT_LINE)
  })
  it('more children than seats: a sibling takes the seat, so nothing about billing is promised', async () => {
    w.plan = { status: 'active', seats_paid: 1 }; w.kids = ['kid-a', 'kid-b']
    const { after } = await confirmScreen('child=kid-a&tab=login', 'Delete Ada’s profile')
    expect(after, 'control: the confirmation opened').toContain('Permanently delete Ada?')
    expect(after).not.toMatch(/refund|paid plan/i)
  })
  it('a free family\'s only child: no billing words either', async () => {
    w.plan = null; w.kids = ['kid-a']
    const { after } = await confirmScreen('child=kid-a&tab=login', 'Delete Ada’s profile')
    expect(after, 'control: the confirmation opened').toContain('Permanently delete Ada?')
    expect(after).not.toMatch(/refund|paid plan/i)
  })
  it('a free family: no billing words', async () => {
    w.plan = null; w.kids = ['kid-a', 'kid-b']
    const { after } = await confirmScreen('child=kid-a&tab=login', 'Delete Ada’s profile')
    expect(after, 'control: the confirmation opened').toContain('Permanently delete Ada?')
    expect(after).not.toMatch(/refund|paid plan/i)
  })
})
