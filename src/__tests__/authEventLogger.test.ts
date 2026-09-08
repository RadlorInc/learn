/**
 * A recovered session is not a login.
 *
 * supabase-js emits `SIGNED_IN` when it RECOVERS a stored session on page load (GoTrueClient
 * `_recoverAndRefresh`), so a listener keyed on the event alone writes a `login` row per hard
 * reload. Measured 2026-09-07: every chapter load POSTed `auth_events`, which is what turned the
 * nightly E2E red (placeholder Supabase host → ERR_NAME_NOT_RESOLVED) and over-counted logins in
 * /admin. Watched red on the pre-fix listener: case ① inserted.
 *
 * The expected values are written out here, not derived from the component.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

type Handler = (event: string, session: unknown) => void
const inserts: unknown[] = []
let handler: Handler | null = null

vi.mock('@/data/supabase/client', () => ({
  createClient: () => ({
    auth: { onAuthStateChange: (h: Handler) => { handler = h; return { data: { subscription: { unsubscribe: () => {} } } } } },
    from: () => ({ insert: (row: unknown) => { inserts.push(row); return Promise.resolve({ error: null }) } }),
  }),
}))
vi.mock('@/infra/reportCrash', () => ({ reportCrash: () => {} }))

const session = { user: { id: 'u1' }, access_token: 'tok-abc' }
const flush = () => new Promise((r) => setTimeout(r, 0))
let unmount: () => Promise<void> = async () => {}

beforeEach(async () => { await unmount(); inserts.length = 0; handler = null; localStorage.clear() })

async function mount() {
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  const React = await import('react')
  const { act } = React
  const { createRoot } = await import('react-dom/client')
  const { default: AuthEventLogger } = await import('@/infra/AuthEventLogger')
  const host = document.createElement('div'); document.body.appendChild(host)
  const root = createRoot(host)
  await act(async () => { root.render(React.createElement(AuthEventLogger)) })
  unmount = async () => { await act(async () => { root.unmount() }); host.remove(); unmount = async () => {} }
  expect(handler, 'the listener subscribed').not.toBeNull()
}

describe('AuthEventLogger — a recovered session is not a login', () => {
  it('① session already in storage at load + SIGNED_IN (recovery) → writes NOTHING', async () => {
    localStorage.setItem('milo-auth', JSON.stringify(session))
    await mount()
    handler!('SIGNED_IN', session)
    await flush()
    expect(inserts).toEqual([])
  })

  it('② no session at load + SIGNED_IN (a real sign-in) → exactly one login row  [positive control]', async () => {
    await mount()
    handler!('SIGNED_IN', session)
    handler!('SIGNED_IN', session)          // token refresh / tab focus re-emits — still one visit
    await flush()
    expect(inserts).toHaveLength(1)
    expect(inserts[0]).toMatchObject({ user_id: 'u1', event: 'login' })
  })

  it('③ session at load, then SIGNED_OUT, then SIGNED_IN → the second sign-in IS recorded', async () => {
    localStorage.setItem('milo-auth', JSON.stringify(session))
    await mount()
    handler!('SIGNED_IN', session)          // recovery
    handler!('SIGNED_OUT', null)
    handler!('SIGNED_IN', { user: { id: 'u1' }, access_token: 'tok-new' })
    await flush()
    expect(inserts).toHaveLength(1)
  })
})
