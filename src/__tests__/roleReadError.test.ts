// @vitest-environment jsdom
/**
 * BUG-07 (docs/review/LATENT-BUGS.md): "could not read your role" must never read as "you have no role yet".
 * A null role is what shows the one-time Teacher/Parent picker, and a pick there WRITES the role — so a network blip on
 * the profile read used to let a parent become a teacher (or a child's login become a parent).
 *
 * The REAL getMyRole/setMyRole run here; only the Supabase client under them (`db()`) is stubbed, so each screen sees
 * exactly what the repository returns for a failed read. Every "failed" case has a twin where the read SUCCEEDS with
 * no role, which must still get the picker / the role write / the /parent route (the normal first-login path).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'

type Filter = [string, string, unknown]
const s = vi.hoisted(() => ({
  profile: 'ok' as 'ok' | 'fail' | 'norow',
  auth: 'ok' as 'ok' | 'fail' | 'nosession',
  role: null as string | null,
  updates: [] as { values: unknown; filters: Filter[] }[],
  replaced: [] as string[],
  pin: 'none' as string,
}))

vi.mock('@/data/repositories/_shared', async (orig) => ({
  ...(await orig<typeof import('@/data/repositories/_shared')>()),
  db: () => ({
    auth: {
      getUser: async () =>
        s.auth === 'fail' ? { data: { user: null }, error: Object.assign(new Error('Failed to fetch'), { name: 'AuthRetryableFetchError', status: 0 }) }
        : s.auth === 'nosession' ? { data: { user: null }, error: Object.assign(new Error('Auth session missing!'), { name: 'AuthSessionMissingError', status: 400 }) }
        : { data: { user: { id: 'u1' } }, error: null },
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () =>
        s.profile === 'fail' ? { data: null, error: { message: 'TypeError: Failed to fetch', code: '' } }
        : s.profile === 'norow' ? { data: null, error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' } }
        : { data: { role: s.role }, error: null } }) }),
      update: (values: unknown) => {
        const u = { values, filters: [] as Filter[] }
        s.updates.push(u)
        const q = {
          eq: (c: string, v: unknown) => (u.filters.push(['eq', c, v]), q),
          is: (c: string, v: unknown) => (u.filters.push(['is', c, v]), q),
          then: (res: (x: unknown) => void) => res({ error: null }),
        }
        return q
      },
    }),
  }),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: (u: string) => s.replaced.push(u), push: () => {} }),
  useSearchParams: () => new URLSearchParams('th=hash123'),
}))
vi.mock('@/data/auth', () => ({
  getCurrentSession: async () => ({ user: { id: 'u1', user_metadata: { first_name: 'Sam' } } }),
  onAuthStateChange: () => ({ subscription: { unsubscribe: () => {} } }),
  verifyEmailToken: async () => ({ data: { user: { user_metadata: { role: 'parent' } } }, error: null }),
  logAuthEvent: async () => {},
}))
// The screens import the repository barrel; the role calls in it are the REAL ones (profile.ts), the rest answer empty.
vi.mock('@/data/repositories', async () => {
  const p = await import('@/data/repositories/profile')
  return {
    getMyRole: p.getMyRole, setMyRole: p.setMyRole, homeForRole: p.homeForRole, signOut: async () => {},
    getPinStatus: async () => ({ state: s.pin }),
    verifyPin: async () => ({ ok: false }), setPin: async () => ({ ok: true }), requestPinReset: async () => ({ ok: true }),
    // /parent's first load
    getParentDashboard: async () => [], getReceivedInvites: async () => [], getChildLogins: async () => ({}),
    enterAsChild: async () => '/modules', getMyClasses: async () => [], getMyTeacherPaid: async () => false,
  }
})
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

async function render(el: ReturnType<typeof createElement>): Promise<string> {
  const host = document.createElement('div'); document.body.appendChild(host)
  const root = createRoot(host)
  await act(async () => { root.render(el) })
  for (let i = 0; i < 3; i++) await act(async () => { await new Promise(r => setTimeout(r, 0)) })
  const text = host.textContent ?? ''
  act(() => root.unmount()); host.remove()
  return text
}

beforeEach(() => { s.profile = 'ok'; s.auth = 'ok'; s.role = null; s.updates = []; s.replaced = []; s.pin = 'none'; window.location.hash = '' })

describe('getMyRole: a failed read is distinguishable from "no role yet"', () => {
  it('CONTROL: a readable profile with no role answers null; with a role, that role', async () => {
    const { getMyRole } = await import('@/data/repositories/profile')
    expect(await getMyRole()).toBeNull()
    s.role = 'teacher'
    expect(await getMyRole()).toBe('teacher')
  })
  it('CONTROL: signed out, or no profile row at all, is still "no role" (null)', async () => {
    const { getMyRole } = await import('@/data/repositories/profile')
    s.auth = 'nosession'
    expect(await getMyRole()).toBeNull()
    s.auth = 'ok'; s.profile = 'norow'
    expect(await getMyRole()).toBeNull()
  })
  it('a profile read that FAILED rejects instead of answering null', async () => {
    const { getMyRole } = await import('@/data/repositories/profile')
    s.profile = 'fail'
    await expect(getMyRole()).rejects.toBeTruthy()
  })
  it('a user lookup that FAILED (network) rejects instead of answering null', async () => {
    const { getMyRole } = await import('@/data/repositories/profile')
    s.auth = 'fail'
    await expect(getMyRole()).rejects.toBeTruthy()
  })
})

describe('setMyRole only ever FIRST sets a role', () => {
  it('its write is limited to a profile whose role is still null', async () => {
    const { setMyRole } = await import('@/data/repositories/profile')
    await setMyRole('parent')
    expect(s.updates).toEqual([{ values: { role: 'parent' }, filters: [['eq', 'id', 'u1'], ['is', 'role', null]] }])
  })
})

describe('/auth/confirm: the chosen sign-up role is written only when the read SUCCEEDED with no role', () => {
  it('CONTROL: role read OK and empty → the chosen role is written and the parent moves on', async () => {
    const { default: Page } = await import('@/app/auth/confirm/page')
    await render(createElement(Page))
    expect(s.updates.map(u => u.values)).toEqual([{ role: 'parent' }])
    expect(s.replaced).toEqual(['/parent'])
  })
  it('role read FAILED → no role write, no redirect, the page offers Try again', async () => {
    s.profile = 'fail'; s.role = 'teacher'           // the real role is teacher; the read just could not reach it
    const { default: Page } = await import('@/app/auth/confirm/page')
    const text = await render(createElement(Page))
    expect(s.updates, 'setMyRole was reached on a failed read — it would overwrite the real role').toEqual([])
    expect(s.replaced).toEqual([])
    expect(text).toContain('Try again')
  })
})

describe('/auth/callback: a failed read is not routed as a role-less account', () => {
  it('CONTROL: role read OK and empty → /parent (where the one-time picker is)', async () => {
    const { default: Page } = await import('@/app/auth/callback/page')
    await render(createElement(Page))
    expect(s.replaced).toEqual(['/parent'])
  })
  it('role read FAILED → stays (no redirect as if role-less)', async () => {
    s.profile = 'fail'; s.role = 'learner'
    const { default: Page } = await import('@/app/auth/callback/page')
    await render(createElement(Page))
    expect(s.replaced).toEqual([])
  })
})

describe('ParentPinGate: a failed read is not "an adult with no role"', () => {
  it('CONTROL: role read OK and empty, no PIN yet → offers to set a PIN', async () => {
    const { ParentPinGate } = await import('@/shared/ui/ParentPinGate')
    expect(await render(createElement(ParentPinGate, null, 'dashboard'))).toContain('Set a parent PIN')
  })
  it('role read FAILED → the gate\'s could-not-open screen with Try again, never Create a PIN', async () => {
    s.profile = 'fail'; s.role = 'learner'
    const { ParentPinGate } = await import('@/shared/ui/ParentPinGate')
    const text = await render(createElement(ParentPinGate, null, 'dashboard'))
    expect(text).not.toContain('Set a parent PIN')
    expect(text).toContain('Could not open the dashboard')
    expect(text).toContain('Try again')
  })
})

describe('/parent: the one-time Teacher/Parent picker shows only when the read SUCCEEDED with no role', () => {
  it('CONTROL: role read OK and empty → the picker', async () => {
    const { default: Page } = await import('@/app/parent/page')
    expect(await render(createElement(Page))).toContain("I'm a Parent")
  })
  it('role read FAILED → the dashboard\'s load-error screen with Try again, never the picker', async () => {
    s.profile = 'fail'; s.role = 'parent'
    const { default: Page } = await import('@/app/parent/page')
    const text = await render(createElement(Page))
    expect(text, 'a parent whose read blipped is offered "I\'m a Teacher", which would overwrite their role').not.toContain("I'm a Parent")
    expect(text).toContain('Try again')
    expect(s.updates).toEqual([])
  })
})
