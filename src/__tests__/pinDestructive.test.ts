// @vitest-environment jsdom
/**
 * Deleting a child's profile and closing the account ask for the parent PIN (founder, 6 Nov 2026). The real /parent and
 * /parent/account screens are mounted on a stubbed Supabase client; the assertion is on the database call itself, so it
 * must not be made on a wrong PIN or a Cancel, and must be made on the right PIN.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { createElement, act, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const h = vi.hoisted(() => ({ rpcs: [] as string[], qs: '', router: { replace: () => {}, push: () => {}, refresh: () => {} } }))
vi.mock('next/navigation', () => ({
  useRouter: () => h.router,
  useSearchParams: () => new URLSearchParams(h.qs),
  usePathname: () => '/parent',
}))
vi.mock('@/data/auth', async orig => ({
  ...(await orig<Record<string, unknown>>()),
  getCurrentSession: async () => ({ user: { id: 'p1', email: 'p@x.test', user_metadata: {} } }),
}))
vi.mock('@/data/supabase/client', () => {
  const query = (table: string) => {
    const b: Record<string, unknown> = new Proxy({}, {
      get: (_t, k) => k === 'then'
        ? (res: (x: unknown) => void) => res({ data: table === 'profiles' ? { role: 'parent' } : [], error: null })
        : () => b,
    })
    return b
  }
  const learner = { id: 'kid', display_name: 'Ana', age_group: '9-11', avatar_index: 0, lesson_ids: [], lesson_due: {}, created_at: '2026-09-01T00:00:00Z', created_by: 'p1' }
  return {
    createClient: () => ({
      auth: {
        getSession: async () => ({ data: { session: { access_token: 't', user: { id: 'p1', email: 'p@x.test' } } } }),
        getUser: async () => ({ data: { user: { id: 'p1', email: 'p@x.test' } } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      },
      from: (t: string) => query(t),
      rpc: async (fn: string, args: { p_pin?: string }) => {
        h.rpcs.push(fn)
        if (fn === 'get_parent_dashboard') return { data: [{ learner, role: 'owner', stats: null, progress: [], sessions: [] }], error: null }
        if (fn === 'parent_pin_status') return { data: { state: 'set' }, error: null }
        if (fn === 'verify_parent_pin') return { data: args.p_pin === '4826' ? { ok: true } : { ok: false, error: 'wrong', tries_left: 4 }, error: null }
        return { data: null, error: null }
      },
    }),
  }
})

let host: HTMLElement, root: ReturnType<typeof createRoot>
const settle = () => act(async () => { for (let i = 0; i < 10; i++) await new Promise(r => setTimeout(r, 0)) })
async function show(node: ReactNode) {
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
  await act(async () => { root.render(node) }); await settle()
}
const button = (label: string) => {
  // The last match: the PIN dialog sits after the page, and the delete panel behind it has a Cancel of its own.
  const b = [...host.querySelectorAll('button')].filter(x => x.textContent?.includes(label)).pop()
  expect(b, `no button "${label}" on: ${host.textContent?.slice(0, 300)}`).toBeTruthy()
  return b as HTMLButtonElement
}
const click = async (label: string) => { await act(async () => { button(label).click() }); await settle() }
const type = async (input: HTMLInputElement, v: string) => act(async () => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, v)
  input.dispatchEvent(new Event('input', { bubbles: true }))
})
const pinBox = () => host.querySelector('input[aria-label="PIN"]') as HTMLInputElement | null
const enterPin = async (v: string) => {
  expect(pinBox(), 'the delete did not ask for the PIN').toBeTruthy()
  await type(pinBox()!, v); await click('Confirm')
}

beforeAll(async () => { await import('@/app/parent/page'); await import('@/app/parent/account/page') }, 120_000)
beforeEach(() => { h.rpcs.length = 0; localStorage.clear(); vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 }))) })
afterEach(() => { act(() => root.unmount()); host.remove() })

describe('deleting a child profile asks for the PIN first', () => {
  it('the delete call is made only after the right PIN', async () => {
    h.qs = 'child=kid&tab=login'
    const { default: Dashboard } = await import('@/app/parent/page')
    await show(createElement(Dashboard))
    expect(pinBox(), 'the dashboard opened behind a PIN').toBeNull()
    await click('Delete Ana')
    expect(pinBox(), 'the first "are you sure" step needs no PIN').toBeNull()
    await click('Yes, delete')
    await enterPin('1111')
    expect(h.rpcs).not.toContain('delete_learner')
    await click('Cancel')
    expect(pinBox()).toBeNull()
    expect(h.rpcs).not.toContain('delete_learner')
    await click('Yes, delete')
    await enterPin('4826')
    expect(h.rpcs).toContain('delete_learner')
  })
})

describe('closing the account asks for the PIN first', () => {
  it('the delete call is made only after the right PIN', async () => {
    h.qs = ''
    const { default: AccountPage } = await import('@/app/parent/account/page')
    await show(createElement(AccountPage))
    expect(pinBox(), 'the page opened behind a PIN').toBeNull()
    await type(host.querySelector('input[aria-label^="Type your email"]') as HTMLInputElement, 'p@x.test')
    await click('Delete my account')
    await enterPin('1111')
    expect(h.rpcs).not.toContain('delete_my_account')
    await click('Cancel')
    expect(h.rpcs).not.toContain('delete_my_account')
    await click('Delete my account')
    await enterPin('4826')
    expect(h.rpcs).toContain('delete_my_account')
  })
})
