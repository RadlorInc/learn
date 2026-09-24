/**
 * CONSENT-ONCE, THE SCREENS (C2 signup, C3 add a child, C4 withdraw all) — RENDERED, CLICKED, READ BACK.
 *
 * ⚠️ Every expectation is written out here by hand (the notice version, the button words), never imported
 * from copy.ts: a check that imports the value it asserts passes because the code equals itself.
 * ⚠️ Every refusal has its positive twin in the same test — a sheet that can never add, or signup buttons
 * that are always disabled, would pass a refusal-only check.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// ── the world the screens read ──
const log: string[] = []
const st = vi.hoisted(() => ({
  consents: [] as Record<string, unknown>[],
  current: true,
  withdrawErr: null as null | { code?: string; message: string },
}))
const signUp = vi.hoisted(() => vi.fn(async () => ({ data: { user: { identities: [{}] } }, error: null })))
const google = vi.hoisted(() => vi.fn(async () => ({ error: null })))
const created = vi.hoisted(() => vi.fn(async () => ({ id: 'kid-1', age_group: '9-11' })))

// ONE router object: the account page's effect depends on `router`, and a new object per render re-runs it for ever.
// `push` moves the (fake) URL, so the dashboard re-renders on the page the route names — the route is what is asserted.
const nav = vi.hoisted(() => ({ qs: '', pushed: [] as string[] }))
const router = vi.hoisted(() => ({ replace: () => {}, push: (u: string) => { nav.pushed.push(u); nav.qs = u.split('?')[1] ?? '' }, refresh: () => {} }))
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(nav.qs),
  usePathname: () => '/',
}))
vi.mock('@/data/auth', async orig => ({
  ...(await orig<Record<string, unknown>>()),
  signUpWithEmail: signUp,
  signInWithGoogleOAuth: google,
  getCurrentSession: async () => ({ user: { id: 'p1', email: 'p@x.test', user_metadata: {} } }),
}))
vi.mock('@/data/repositories', async orig => ({
  ...(await orig<Record<string, unknown>>()),
  createLearner: created,
  getMyLearners: async () => [],
  getMyRole: async () => 'parent',
}))
vi.mock('@/data/supabase/client', () => {
  const thenable = (v: () => unknown): unknown => new Proxy(() => {}, {
    get: (_t, k) => (k === 'then' ? (r: (x: unknown) => void) => r(v()) : thenable(v)),
    apply: () => thenable(v),
  })
  return {
    createClient: () => ({
      auth: {
        getSession: async () => ({ data: { session: { access_token: 't', user: { id: 'p1' } } } }),
        getUser: async () => ({ data: { user: { id: 'p1' } } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      },
      from: (t: string) => { log.push(`from:${t}`); return thenable(() => ({ data: t === 'parental_consents' ? st.consents : [], error: null })) },
      rpc: async (fn: string) => {
        log.push(`rpc:${fn}`)
        if (fn === 'consent_is_current') return { data: st.current, error: null }
        if (fn === 'withdraw_my_consent') return { data: 'withdrawn', error: st.withdrawErr }
        return { data: null, error: null }
      },
    }),
  }
})

// The pages are big modules: importing them cold on a loaded machine has taken >20s once, and a timeout
// inside an act() leaves React mid-render and fails every test after it for the wrong reason. Pay it once, here.
beforeAll(async () => {
  await Promise.all([import('@/app/parent/page'), import('@/app/auth/page'), import('@/app/parent/account/page'), import('@/features/consent/ConsentLink')])
}, 120_000)

const fetchLog: { url: string; body: unknown }[] = []
let fetchAnswer: (url: string, body: Record<string, unknown>) => unknown = () => ({})
beforeEach(() => {
  log.length = 0; fetchLog.length = 0
  st.consents = []; st.current = true; st.withdrawErr = null
  nav.qs = ''; nav.pushed.length = 0
  signUp.mockClear(); google.mockClear(); created.mockClear()
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string }) => {
    const body = init?.body ? JSON.parse(init.body) : null
    fetchLog.push({ url, body }); log.push(`fetch:${url}`)
    return new Response(JSON.stringify(fetchAnswer(url, body ?? {})), { status: 200 })
  }))
})

async function mount(el: unknown) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  await act(async () => { root.render(el as never) })
  await settle()
  return { host, done: async () => { await act(async () => root.unmount()); host.remove() } }
}
const settle = () => act(async () => { for (let i = 0; i < 5; i++) await new Promise(r => setTimeout(r, 0)) })
const click = async (el: Element | null | undefined) => {
  expect(el, 'the control to click is not on the screen').toBeTruthy()
  await act(async () => { (el as HTMLElement).click() }); await settle()
}
const type = async (el: Element | null, value: string) => {
  const input = el as HTMLInputElement
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value)
  await act(async () => { input.dispatchEvent(new Event('input', { bubbles: true })) })
}
const button = (host: HTMLElement, text: RegExp) => [...host.querySelectorAll('button')].find(b => text.test(b.textContent ?? ''))

// ─────────────────────────────── C2 — signup ───────────────────────────────
describe('signup: both buttons wait for the tick', () => {
  async function signup() {
    const { default: AuthPage } = await import('@/app/auth/page')
    const m = await mount(createElement(AuthPage))
    await click(button(m.host, /^Create account$/))            // the mode toggle
    const email = () => m.host.querySelector('[data-auth="email"]') as HTMLButtonElement
    const google = () => m.host.querySelector('[data-auth="google"]') as HTMLButtonElement
    return { ...m, email, google, box: () => m.host.querySelector('[data-consent="signup"] input[type="checkbox"]') as HTMLInputElement }
  }

  it('disabled until ticked, enabled after — and the tick is kept with its notice version and time', async () => {
    const s = await signup()
    expect(s.host.textContent, 'the signup notice is not on the screen').toContain('Before you create an account: what we collect about your children')
    expect(s.box().checked, 'the box must start UNTICKED').toBe(false)
    expect(s.email().disabled, '"Create account" works without the tick').toBe(true)
    expect(s.google().disabled, '"Continue with Google" works without the tick').toBe(true)
    await click(s.google())
    expect(google, 'Google sign-up ran without the tick').not.toHaveBeenCalled()

    const before = Date.now()
    await click(s.box())
    expect(s.email().disabled).toBe(false)
    expect(s.google().disabled).toBe(false)
    const ack = JSON.parse(localStorage.getItem('consent-signup-ack') ?? 'null')
    expect(ack?.noticeVersion).toBe('notice-v5')
    expect(Date.parse(ack?.at)).toBeGreaterThanOrEqual(before - 1000)
    expect(Date.parse(ack?.at)).toBeLessThanOrEqual(Date.now())

    await click(s.box())                                         // untick: the buttons go back, the record goes
    expect(s.email().disabled).toBe(true)
    expect(s.google().disabled).toBe(true)
    expect(localStorage.getItem('consent-signup-ack')).toBeNull()
    await s.done()
  })

  it('email signup carries the tick into the account metadata (survives another device)', async () => {
    const s = await signup()
    await click(s.box())
    await type(s.host.querySelector('#auth-email'), 'p@x.test')
    await type(s.host.querySelector('#auth-password'), 'secret123')
    await type(s.host.querySelector('#auth-confirm'), 'secret123')
    await click(s.email())
    expect(signUp).toHaveBeenCalledTimes(1)
    const data = (signUp.mock.calls[0] as unknown[])[3] as { consent_ack?: { noticeVersion: string; at: string } }
    expect(data?.consent_ack?.noticeVersion).toBe('notice-v5')
    expect(typeof data?.consent_ack?.at).toBe('string')
    await s.done()
  })

  it('"Continue as a teacher" enables both buttons without the tick, and records nothing', async () => {
    const s = await signup()
    await click(button(s.host, /^Continue as a teacher$/))
    expect(s.email().disabled).toBe(false)
    expect(s.google().disabled).toBe(false)
    expect(localStorage.getItem('consent-signup-ack')).toBeNull()
    await click(s.google())
    expect(google).toHaveBeenCalledTimes(1)
    await s.done()
  })

  it('sign-in mode is unchanged: both buttons work with no tick', async () => {
    const { default: AuthPage } = await import('@/app/auth/page')
    const m = await mount(createElement(AuthPage))
    expect(m.host.querySelector('[data-consent="signup"]')).toBeNull()
    expect((m.host.querySelector('[data-auth="email"]') as HTMLButtonElement).disabled).toBe(false)
    expect((m.host.querySelector('[data-auth="google"]') as HTMLButtonElement).disabled).toBe(false)
    await m.done()
  })
})

// ─────────────────────────────── C3 — add a child ───────────────────────────────
const granted = (over: Record<string, unknown> = {}) => ({
  id: 'acct-1', state: 'granted', notice_version: 'notice-v4', confirmed_at: '2026-09-20T12:00:00Z',
  expires_at: '2026-09-27T12:00:00Z', email_address: 'p@x.test', ...over,
})

describe('add a child: the sheet opens only on a granted, current account consent', () => {
  async function flow() {
    const React = await import('react')
    const { AddChildFlow } = await import('@/features/consent/AddChildFlow')
    const { AddLearnerModal } = await import('@/app/parent/page')
    return mount(React.createElement(AddChildFlow, {
      lang: 'en', onClose() {},
      renderAdd: a => React.createElement(AddLearnerModal, { attest: a, onClose() {}, onAdded() {} }),
    }))
  }

  it('granted: Add stays disabled until the attestation is ticked; the child then carries THAT consent\'s notice version', async () => {
    st.consents = [granted()]
    const m = await flow()
    const box = m.host.querySelector('[data-consent="attest"] input[type="checkbox"]') as HTMLInputElement
    expect(box, 'the attestation is not on the sheet').toBeTruthy()
    expect(m.host.textContent).toContain("I'm this child's parent or legal guardian. The permission I gave on September 20, 2026 applies to this child too.")
    expect(box.checked).toBe(false)

    await type(m.host.querySelector('#learner-name'), 'Bea')
    const mod = [...m.host.querySelectorAll('input[type="checkbox"]')].find(i => !i.closest('[data-consent="attest"]') && !(i as HTMLInputElement).disabled)
    await click(mod)
    const add = () => button(m.host, /^Add learner/) as HTMLButtonElement
    expect(add().disabled, '"Add" works before the attestation is ticked').toBe(true)
    await click(add())
    expect(created, 'a child was created without the attestation').not.toHaveBeenCalled()

    await click(box)
    expect(add().disabled).toBe(false)
    await click(add())
    expect(created).toHaveBeenCalledTimes(1)
    expect((created.mock.calls[0] as unknown[])[4]).toEqual({ id: 'acct-1', noticeVersion: 'notice-v4' })
    await m.done()
  })

  it('no account consent: the notice, never the sheet', async () => {
    const m = await flow()
    expect(m.host.querySelector('[data-consent="account-notice"]')).toBeTruthy()
    expect(m.host.textContent).toContain('Before your child starts: what we collect, and your choice')
    expect(m.host.querySelector('#learner-name'), 'the add sheet opened without consent').toBeNull()
    // …and "continue" asks for an ACCOUNT consent for the current notice.
    fetchAnswer = () => ({ ok: true, email: 'p@x.test', days: 7 })
    await click(button(m.host, /legal guardian — continue/))
    expect(fetchLog[0]?.url).toBe('/api/consent/request')
    expect(fetchLog[0]?.body).toMatchObject({ noticeVersion: 'notice-v5', lang: 'en' })
    expect(m.host.textContent).toContain('Waiting for your permission')
    await m.done()
  })

  it('pending: WAITING with the address and a resend, never the sheet', async () => {
    st.consents = [granted({ state: 'pending', confirmed_at: null, expires_at: new Date(Date.now() + 3 * 86_400_000).toISOString() })]
    const m = await flow()
    expect(m.host.textContent).toContain('We have emailed p@x.test.')
    expect(m.host.textContent).toContain('The link works for 3 days.')
    expect(button(m.host, /^Send the email again$/)).toBeTruthy()
    expect(m.host.querySelector('#learner-name')).toBeNull()
    await m.done()
  })

  it('granted but no longer current: the re-ask and the notice, never the sheet', async () => {
    st.consents = [granted()]; st.current = false
    const m = await flow()
    expect(m.host.textContent).toContain("We've changed what we collect")
    expect(m.host.querySelector('#learner-name')).toBeNull()
    expect(log).toContain('rpc:consent_is_current')
    await m.done()
  })
})

describe('the dashboard sends B1 by itself when the signup tick is for the current notice', () => {
  it('a current tick → one request with its time; a stale tick → the notice and no request', async () => {
    const React = await import('react')
    const { AccountConsentCard } = await import('@/features/consent/AccountConsent')
    fetchAnswer = () => ({ ok: true, email: 'p@x.test', days: 7 })
    const at = new Date(Date.now() - 60_000).toISOString()
    let m = await mount(React.createElement(AccountConsentCard, { lang: 'en', ack: { noticeVersion: 'notice-v5', at } }))
    expect(fetchLog.map(f => f.url)).toEqual(['/api/consent/request'])
    expect(fetchLog[0].body).toMatchObject({ noticeVersion: 'notice-v5', ackAt: at })
    expect(m.host.textContent).toContain('Waiting for your permission')
    await m.done()

    fetchLog.length = 0
    const { currentAck } = await import('@/features/consent/consentState')
    expect(currentAck({ consent_ack: { noticeVersion: 'notice-v4', at } }), 'a tick for an older notice counts').toBeNull()
    expect(currentAck({ consent_ack: { noticeVersion: 'notice-v5', at } })).toEqual({ noticeVersion: 'notice-v5', at })
    m = await mount(React.createElement(AccountConsentCard, { lang: 'en', ack: null }))
    expect(fetchLog, 'B1 went out without a tick').toEqual([])
    expect(m.host.querySelector('[data-consent="account-notice"]')).toBeTruthy()
    await m.done()
  })
})

// ─────────────────────────────── C4 — withdraw all ───────────────────────────────
describe('withdraw permission for all my children', () => {
  // Prod check 2.8 (2026-09-24): it lived at the top of /parent/account, and a parent who withdrew went on, still on
  // that page, to close the whole account. It is now its own card in the dashboard's Account view.
  async function accountView() {
    nav.qs = 'view=account'
    const { default: Dashboard } = await import('@/app/parent/page')
    const m = await mount(createElement(Dashboard))
    return { ...m, card: () => m.host.querySelector('[data-tour="withdraw-all-card"]') as HTMLElement | null }
  }

  it('the Account view has its own card, beside "Close your account" and not part of it', async () => {
    const m = await accountView()
    expect(m.host.querySelector('[data-tour="close-card"]'), 'control: the Account view rendered').toBeTruthy()
    expect(m.card(), 'no withdraw-all card in the Account view').toBeTruthy()
    expect(m.card()!.querySelector('h2')?.textContent).toBe('Withdraw permission for all your children')
    expect(m.card()!.textContent).toContain('Your account stays open.')
    expect(m.card()!.textContent).not.toContain('Close your account')
    await m.done()
  })

  it('confirm → withdraw_my_consent → the cancel route, then back to /parent with the result as the banner', async () => {
    const m = await accountView()
    await click(button(m.card()!, /^Withdraw permission for all your children$/))
    expect(m.host.textContent).toContain('Your account stays open.')
    expect(log.filter(l => /withdraw|cancel/.test(l)), 'withdrew before the confirm').toEqual([])
    await click(button(m.host, /^Withdraw permission and delete my children's data$/))
    expect(log.filter(l => /withdraw_my_consent|cancel-second-notice/.test(l)))
      .toEqual(['rpc:withdraw_my_consent', 'fetch:/api/consent/cancel-second-notice'])
    expect(nav.pushed).toEqual(['/parent'])
    expect(m.card(), 'still on the Account view after withdrawing').toBeNull()
    expect(m.host.textContent).toContain('We have stopped collecting information about every child on your account and deleted what we held about them. Your account stays open.')
    // …and ABOVE the notice that now follows it: the full notice is long, and a banner under it is not seen.
    const text = m.host.textContent ?? ''
    expect(text.indexOf('Before your child starts: what we collect'), 'control: the notice is on the dashboard').toBeGreaterThan(-1)
    expect(text.indexOf('We have stopped collecting'), 'the result banner is below the notice').toBeLessThan(text.indexOf('Before your child starts: what we collect'))
    await m.done()
  })

  it('a failed withdrawal says so, cancels nothing and goes nowhere', async () => {
    st.withdrawErr = { code: '42501', message: 'boom' }
    const m = await accountView()
    await click(button(m.card()!, /^Withdraw permission for all your children$/))
    await click(button(m.host, /^Withdraw permission and delete my children's data$/))
    expect(log).not.toContain('fetch:/api/consent/cancel-second-notice')
    expect(nav.pushed).toEqual([])
    expect(m.card()!.textContent).toContain('Something went wrong. Please try again.')
    await m.done()
  })

  it('/parent/account is only for closing: no withdraw-all on it', async () => {
    const { default: AccountPage } = await import('@/app/parent/account/page')
    const m = await mount(createElement(AccountPage))
    expect(m.host.querySelector('h1')?.textContent, 'control: the close page rendered').toBe('Close your account')
    expect(m.host.textContent).not.toMatch(/withdraw/i)
    await m.done()
  })

  async function withdrawPage(scope: 'account' | 'child') {
    fetchAnswer = (_u, b) => b.action === 'lookup' ? { status: 'granted', lang: 'en', name: null, scope } : { status: 'withdrawn', lang: 'en' }
    window.location.hash = `#t=${'A'.repeat(43)}`
    const { ConsentLink } = await import('@/features/consent/ConsentLink')
    return mount(createElement(ConsentLink, { mode: 'withdraw' }))
  }
  it('B3\'s link on an ACCOUNT consent shows the "all your children" screen, and says so after', async () => {
    const m = await withdrawPage('account')
    expect(m.host.querySelector('h2')?.textContent).toBe('Withdraw permission for all your children')
    await click(button(m.host, /^Withdraw permission and delete my children's data$/))
    expect(fetchLog.at(-1)?.body).toMatchObject({ action: 'withdraw' })
    expect(m.host.textContent).toContain('every child on your account')
    await m.done()
  })
  it('…and the per-child screen for a legacy per-child consent', async () => {
    const m = await withdrawPage('child')
    expect(m.host.querySelector('h1')?.textContent).toBe('Withdraw permission')
    expect(button(m.host, /^Withdraw permission and delete my child's data$/)).toBeTruthy()
    expect(m.host.textContent).not.toContain('all your children')
    await m.done()
  })
})
