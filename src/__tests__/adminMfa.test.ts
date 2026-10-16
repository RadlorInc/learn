/**
 * ADMIN TWO-STEP VERIFICATION — the screens, rendered and clicked against a fake Supabase Auth.
 *
 * The fake keeps one account's state the way Supabase Auth does: a password sign-in gives an aal1 session; a verified
 * authenticator makes aal2 the next level; a right code on a challenge of that factor makes the session aal2 (and, on
 * a new factor, marks it verified). What each screen does with that is the thing under test.
 *
 * ⚠️ Every expected value is written here by hand (the typed code, the factor ids, where the browser is sent). Every
 * refusal has its positive twin: a login that never enters /admin, or a layout that never renders, would pass a
 * refusal-only check.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { Component, createElement, act, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type Factor = { id: string; factor_type: 'totp'; status: 'verified' | 'unverified' }
const st = vi.hoisted(() => ({
  session: null as null | { access_token: string },
  aal: null as null | 'aal1' | 'aal2',
  factors: [] as Factor[],
  admin: true,                // the metrics route: 200 for an admin, 404 for anyone else
  path: '/admin',
}))
const NF = 'NEXT_HTTP_ERROR_FALLBACK;404'
const mfa = vi.hoisted(() => ({
  getAuthenticatorAssuranceLevel: vi.fn(async () => ({
    data: {
      currentLevel: st.session ? st.aal : null,
      nextLevel: !st.session ? null : st.factors.some(f => f.status === 'verified') ? 'aal2' : st.aal,
      currentAuthenticationMethods: [],
    },
    error: null,
  })),
  listFactors: vi.fn(async () => ({
    data: { all: st.factors, totp: st.factors.filter(f => f.status === 'verified'), phone: [], webauthn: [] },
    error: null,
  })),
  enroll: vi.fn(async (_p: { factorType: string; issuer?: string }) => {
    st.factors.push({ id: 'f-new', factor_type: 'totp', status: 'unverified' })
    return {
      data: {
        id: 'f-new', type: 'totp', friendly_name: '',
        totp: { qr_code: 'data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg"><rect fill="#000" width="9" height="9"/></svg>',
                secret: 'JBSWY3DPEHPK3PXP', uri: 'otpauth://totp/x' },
      },
      error: null,
    }
  }),
  challenge: vi.fn(async ({ factorId }: { factorId: string }) => ({ data: { id: `ch-${factorId}`, type: 'totp', expires_at: 0 }, error: null })),
  verify: vi.fn(async ({ factorId, challengeId, code }: { factorId: string; challengeId: string; code: string }) => {
    const f = st.factors.find(x => x.id === factorId)
    if (!f || challengeId !== `ch-${factorId}` || code !== '123456') return { data: null, error: { message: 'Invalid TOTP code entered' } }
    f.status = 'verified'; st.aal = 'aal2'
    return { data: { access_token: 'aal2-token' }, error: null }
  }),
}))
const signIn = vi.hoisted(() => vi.fn(async ({ password }: { email: string; password: string }) => {
  if (password !== 'right-pw') return { data: { session: null }, error: { message: 'Invalid login credentials' } }
  st.session = { access_token: 'aal1-token' }; st.aal = 'aal1'
  return { data: { session: st.session }, error: null }
}))

vi.mock('@/data/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: st.session } }),
      signInWithPassword: signIn,
      signOut: async () => { st.session = null; st.aal = null; return { error: null } },
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      mfa,
    },
  }),
}))
vi.mock('next/navigation', () => ({
  usePathname: () => st.path,
  // What Next's does: it throws, and only a throw DURING RENDER reaches the not-found boundary (modelled below).
  notFound: () => { throw Object.assign(new Error(NF), { digest: NF }) },
}))
vi.mock('next/link', async () => {
  const { createElement: h } = await import('react')
  return { default: ({ href, children, ...p }: { href: string; children: ReactNode }) => h('a', { href, ...p }, children) }
})
vi.mock('@/features/admin/invariants', () => ({ checkPage: () => [] }))
vi.mock('@/infra/reportCrash', () => ({ reportCrash: () => {} }))

/** Stands in for Next's not-found boundary: it catches what a component throws while rendering. */
class Boundary extends Component<{ children: ReactNode }, { caught: string | null }> {
  state = { caught: null as string | null }
  static getDerivedStateFromError(e: Error) { return { caught: e.message } }
  render() { return this.state.caught ? createElement('p', { 'data-caught': this.state.caught }) : this.props.children }
}

beforeAll(async () => {
  await Promise.all([import('@/app/admin/login/page'), import('@/app/admin/layout'), import('@/app/admin/mfa/page')])
}, 120_000)

const fetched: string[] = []
beforeEach(() => {
  st.session = null; st.aal = null; st.factors = []; st.admin = true; st.path = '/admin'
  fetched.length = 0
  for (const f of Object.values(mfa)) f.mockClear()
  signIn.mockClear()
  // jsdom cannot navigate: every screen here leaves with `window.location.href = …`, so that is what is read.
  Object.defineProperty(window, 'location', { value: { href: '' }, writable: true, configurable: true })
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    fetched.push(url)
    return st.admin
      ? new Response(JSON.stringify({ data: { total_accounts: 1 }, minCohort: 5, rid: 'r1' }), { status: 200 })
      : new Response(JSON.stringify({ error: 'not found', rid: 'r2' }), { status: 404 })
  }))
})

async function mount(el: unknown) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  await act(async () => { root.render(createElement(Boundary, null, el as ReactNode)) })
  await settle()
  return { host, done: async () => { await act(async () => root.unmount()); host.remove() } }
}
const settle = () => act(async () => { for (let i = 0; i < 8; i++) await new Promise(r => setTimeout(r, 0)) })
const click = async (el: Element | null | undefined) => {
  expect(el, 'the control to click is not on the screen').toBeTruthy()
  await act(async () => { (el as HTMLElement).click() }); await settle()
}
const type = async (el: Element | null, value: string) => {
  expect(el, 'the field to type in is not on the screen').toBeTruthy()
  const input = el as HTMLInputElement
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value)
  await act(async () => { input.dispatchEvent(new Event('input', { bubbles: true })) })
}
const submit = async (form: Element | null) => {
  expect(form, 'the form is not on the screen').toBeTruthy()
  await act(async () => { (form as HTMLFormElement).requestSubmit() }); await settle()
}
const button = (host: HTMLElement, text: RegExp) => [...host.querySelectorAll('button')].find(b => text.test(b.textContent ?? ''))
const signInForm = async (host: HTMLElement, pw = 'right-pw') => {
  await type(host.querySelector('input[type="email"]'), 'admin@x.test')
  await type(host.querySelector('input[type="password"]'), pw)
  await submit(host.querySelector('form'))
}

// ─────────────────────────────── /admin/login ───────────────────────────────
describe('/admin/login: an account with an authenticator gives its code before it enters /admin', () => {
  it('with a verified factor: the password alone does not enter /admin; the right code (challenge → verify on that factor) does', async () => {
    st.factors = [{ id: 'f-1', factor_type: 'totp', status: 'verified' }]
    const { default: Login } = await import('@/app/admin/login/page')
    const m = await mount(createElement(Login))
    await signInForm(m.host)
    expect(signIn).toHaveBeenCalledTimes(1)
    expect(window.location.href, 'entered /admin on the password alone, at aal1').toBe('')
    expect(m.host.querySelector('[data-admin-step="code"]'), 'the code step is not on screen').toBeTruthy()
    expect(m.host.querySelector('input[type="password"]'), 'the password form is still up').toBeNull()
    expect(mfa.verify).not.toHaveBeenCalled()

    // a wrong code: still aal1, still out
    await type(m.host.querySelector('#admin-code'), '000000')
    await submit(m.host.querySelector('[data-admin-step="code"]'))
    expect(mfa.challenge).toHaveBeenLastCalledWith({ factorId: 'f-1' })
    expect(mfa.verify).toHaveBeenLastCalledWith({ factorId: 'f-1', challengeId: 'ch-f-1', code: '000000' })
    expect(window.location.href, 'a wrong code entered /admin').toBe('')
    expect(m.host.textContent).toContain('That code did not work')

    // the right code: aal2, in
    await type(m.host.querySelector('#admin-code'), ' 123 456 ')   // as an app shows it
    await submit(m.host.querySelector('[data-admin-step="code"]'))
    expect(mfa.verify).toHaveBeenLastCalledWith({ factorId: 'f-1', challengeId: 'ch-f-1', code: '123456' })
    expect(st.aal).toBe('aal2')
    expect(window.location.href).toBe('/admin')
    await m.done()
  })

  it('an aal1 session with a factor (sent back by the layout) opens on the code step', async () => {
    st.factors = [{ id: 'f-1', factor_type: 'totp', status: 'verified' }]
    st.session = { access_token: 'aal1-token' }; st.aal = 'aal1'
    const { default: Login } = await import('@/app/admin/login/page')
    const m = await mount(createElement(Login))
    expect(m.host.querySelector('[data-admin-step="code"]')).toBeTruthy()
    // "Sign out" is the way out for someone without the phone: the app's one sign-out, which lands on /auth
    await click(button(m.host, /^Sign out$/))
    expect(st.session).toBeNull()
    expect(window.location.href).toBe('/auth')
    await m.done()
  })

  it('positive control — no factor: signs in exactly as before, straight to /admin, and nothing about a code is shown', async () => {
    const { default: Login } = await import('@/app/admin/login/page')
    const m = await mount(createElement(Login))
    expect(m.host.querySelector('[data-admin-step="code"]')).toBeNull()
    await signInForm(m.host, 'wrong-pw')
    expect(window.location.href).toBe('')
    expect(m.host.textContent).toContain('Sign-in failed.')
    await signInForm(m.host)
    expect(window.location.href).toBe('/admin')
    expect(m.host.querySelector('[data-admin-step="code"]')).toBeNull()
    expect(m.host.textContent).not.toMatch(/code|authenticator|two-step/i)
    expect(mfa.challenge).not.toHaveBeenCalled()
    expect(mfa.verify).not.toHaveBeenCalled()
    await m.done()
  })
})

// ─────────────────────────────── the /admin layout ───────────────────────────────
describe('/admin layout: an aal1 session with a verified authenticator goes to the code step', () => {
  const page = () => createElement('p', { 'data-page': 'admin' }, 'the admin page')

  it('verified factor + aal1: sent to /admin/login, the page never renders; the same account at aal2 sees it', async () => {
    const { default: Layout } = await import('@/app/admin/layout')
    st.factors = [{ id: 'f-1', factor_type: 'totp', status: 'verified' }]
    st.session = { access_token: 'aal1-token' }; st.aal = 'aal1'
    let m = await mount(createElement(Layout, null, page()))
    expect(window.location.href).toBe('/admin/login')
    expect(m.host.querySelector('[data-page]'), 'the admin page rendered at aal1').toBeNull()
    expect(fetched, 'asked for admin data at aal1').toEqual([])
    await m.done()

    window.location.href = ''
    st.aal = 'aal2'
    m = await mount(createElement(Layout, null, page()))
    expect(window.location.href).toBe('')
    expect(m.host.querySelector('[data-page]')?.textContent).toBe('the admin page')
    expect(m.host.querySelector('a[href="/admin/mfa"]')?.textContent, 'an admin sees the link to set it up').toBe('Two-step verification')
    await m.done()
  })

  it('positive control — no factor, aal1: the page renders as before; signed out: sent to /admin/login', async () => {
    const { default: Layout } = await import('@/app/admin/layout')
    st.session = { access_token: 'aal1-token' }; st.aal = 'aal1'
    let m = await mount(createElement(Layout, null, page()))
    expect(window.location.href).toBe('')
    expect(m.host.querySelector('[data-page]')).toBeTruthy()
    await m.done()

    st.session = null; st.aal = null
    m = await mount(createElement(Layout, null, page()))
    expect(window.location.href).toBe('/admin/login')
    expect(m.host.querySelector('[data-page]')).toBeNull()
    await m.done()
  })

  it('a signed-in non-admin is shown no link to two-step verification', async () => {
    const { default: Layout } = await import('@/app/admin/layout')
    st.session = { access_token: 'aal1-token' }; st.aal = 'aal1'; st.admin = false
    const m = await mount(createElement(Layout, null, page()))
    expect(fetched, 'control: the admin check ran').toEqual(['/api/admin/metrics?page=overview'])
    expect(m.host.querySelector('a[href="/admin/mfa"]')).toBeNull()
    expect(m.host.textContent).not.toMatch(/two-step/i)
    await m.done()
  })
})

// ─────────────────────────────── /admin/mfa ───────────────────────────────
describe('/admin/mfa: an admin sets up an authenticator (enroll → challenge → verify with the typed code)', () => {
  it('shows the QR code and the secret, and turns it on only with the right code', async () => {
    st.session = { access_token: 'aal1-token' }; st.aal = 'aal1'; st.path = '/admin/mfa'
    const { default: Mfa } = await import('@/app/admin/mfa/page')
    const m = await mount(createElement(Mfa))
    expect(m.host.textContent).toContain('Off.')
    expect(mfa.enroll).not.toHaveBeenCalled()
    await click(button(m.host, /^Set up an authenticator app$/))
    expect(mfa.enroll).toHaveBeenCalledTimes(1)
    expect(mfa.enroll.mock.calls[0][0]).toMatchObject({ factorType: 'totp' })

    const img = m.host.querySelector('img[data-mfa="qr"]') as HTMLImageElement
    expect(img, 'no QR code').toBeTruthy()
    const src = img.getAttribute('src')!
    expect(src.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true)
    expect(src, 'a raw # would end the data: URL early').not.toContain('#')
    expect(decodeURIComponent(src.slice(src.indexOf(',') + 1)))
      .toBe('<svg xmlns="http://www.w3.org/2000/svg"><rect fill="#000" width="9" height="9"/></svg>')
    expect(m.host.querySelector('[data-mfa="secret"]')?.textContent).toBe('JBSWY3DPEHPK3PXP')

    await type(m.host.querySelector('#mfa-code'), '999999')
    await submit(m.host.querySelector('form'))
    expect(mfa.challenge).toHaveBeenLastCalledWith({ factorId: 'f-new' })
    expect(mfa.verify).toHaveBeenLastCalledWith({ factorId: 'f-new', challengeId: 'ch-f-new', code: '999999' })
    expect(m.host.querySelector('[data-mfa="on"]'), 'turned on with a wrong code').toBeNull()
    expect(m.host.textContent).toContain('That code did not work')

    await type(m.host.querySelector('#mfa-code'), '123456')
    await submit(m.host.querySelector('form'))
    expect(mfa.verify).toHaveBeenLastCalledWith({ factorId: 'f-new', challengeId: 'ch-f-new', code: '123456' })
    expect(st.factors).toEqual([{ id: 'f-new', factor_type: 'totp', status: 'verified' }])
    expect(m.host.querySelector('[data-mfa="on"]')).toBeTruthy()
    expect(m.host.querySelector('img[data-mfa="qr"]'), 'the QR code stayed up after it was used').toBeNull()
    await m.done()
  })

  it('an admin who already has one sees "On" and is not offered a second', async () => {
    st.session = { access_token: 'aal2-token' }; st.aal = 'aal2'; st.path = '/admin/mfa'
    st.factors = [{ id: 'f-1', factor_type: 'totp', status: 'verified' }]
    const { default: Mfa } = await import('@/app/admin/mfa/page')
    const m = await mount(createElement(Mfa))
    expect(m.host.querySelector('[data-mfa="on"]')).toBeTruthy()
    expect(button(m.host, /Set up/)).toBeUndefined()
    await m.done()
  })

  it('a signed-in non-admin gets the 404 and nothing about two-step verification', async () => {
    st.session = { access_token: 'aal1-token' }; st.aal = 'aal1'; st.path = '/admin/mfa'; st.admin = false
    const { default: Mfa } = await import('@/app/admin/mfa/page')
    const m = await mount(createElement(Mfa))
    expect(fetched, 'control: the admin check ran').toEqual(['/api/admin/metrics?page=overview'])
    expect(m.host.querySelector('[data-caught]')?.getAttribute('data-caught'), `the not-found boundary was not reached; the screen said: ${m.host.textContent}`).toBe(NF)
    expect(m.host.textContent).not.toMatch(/two-step|authenticator|QR/i)
    expect(mfa.enroll).not.toHaveBeenCalled()
    expect(mfa.listFactors).not.toHaveBeenCalled()
    await m.done()
  })
})
