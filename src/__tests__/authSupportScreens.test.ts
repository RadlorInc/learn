/**
 * The signed-out screens a parent hits when something goes wrong — each one rendered, driven, and read back AFTER the
 * action. Every expected string and route is written out here by hand, never imported from the screen.
 *   · /auth and a failed consent link show the support address (a signed-out parent's only way to a person)
 *   · an unconfirmed account's sign-in says how to get a fresh link, not Supabase's bare "Email not confirmed"
 *   · a Google sign-in that comes back with ?error lands on /auth with a message, not a silent 5 s bounce
 *   · a dead reset link does not tell a parent resetting a password to "ask for a fresh invite"
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const replaced = vi.hoisted(() => [] as string[])
const router = vi.hoisted(() => ({ replace: (u: string) => { replaced.push(u) }, push: () => {}, refresh: () => {} }))
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(''),
  usePathname: () => '/',
}))
const signIn = vi.hoisted(() => vi.fn(async (_e: string, _p: string) => ({ error: null as null | { message: string; code?: string } })))
vi.mock('@/data/auth', async orig => ({
  ...(await orig<Record<string, unknown>>()),
  signInWithEmail: signIn,
  getCurrentSession: async () => null,
  onAuthStateChange: () => ({ subscription: { unsubscribe() {} } }),
}))

beforeAll(async () => {
  await Promise.all([import('@/app/auth/page'), import('@/app/auth/callback/page'), import('@/app/auth/set-password/page'), import('@/features/consent/ConsentLink')])
}, 120_000)

beforeEach(() => {
  replaced.length = 0; signIn.mockClear(); localStorage.clear()
  window.history.replaceState(null, '', '/')
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 500 })))
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
const support = (host: HTMLElement) => [...host.querySelectorAll('a')].find(a => a.getAttribute('href') === 'mailto:support@radlor.com')

describe('a signed-out parent can reach support', () => {
  it('/auth shows the support address', async () => {
    const { default: AuthPage } = await import('@/app/auth/page')
    const m = await mount(createElement(AuthPage))
    expect(m.host.textContent, 'control: this is the sign-in page').toContain('Forgot password?')
    expect(support(m.host)?.textContent).toBe('support@radlor.com')
    await m.done()
  })

  it('a consent link whose request failed (a withdrawal, say) shows the support address under the error', async () => {
    const { ConsentLink } = await import('@/features/consent/ConsentLink')
    const m = await mount(createElement(ConsentLink, { mode: 'withdraw' }))
    expect(m.host.querySelector('[data-consent="error"]'), 'control: the request failed').toBeTruthy()
    expect(support(m.host)?.textContent).toBe('support@radlor.com')
    await m.done()
  })
})

describe('sign-in errors say what to do next', () => {
  it('an unconfirmed account is told to sign up again with the same email for a fresh link', async () => {
    signIn.mockResolvedValueOnce({ error: { message: 'Email not confirmed', code: 'email_not_confirmed' } })
    const { default: AuthPage } = await import('@/app/auth/page')
    const m = await mount(createElement(AuthPage))
    const set = (sel: string, v: string) => {
      const el = m.host.querySelector(sel) as HTMLInputElement
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, v)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }
    await act(async () => { set('#auth-email', 'pat@example.test'); set('#auth-password', 'correct-horse-1') })
    await act(async () => { (m.host.querySelector('[data-auth="email"]') as HTMLButtonElement).click() })
    await settle()
    expect(signIn, 'control: the sign-in was attempted').toHaveBeenCalledTimes(1)
    const alert = m.host.querySelector('[role="alert"]')?.textContent
    expect(alert).toContain('sign up again with the same email')
    expect(alert).not.toBe('Email not confirmed')
    await m.done()
  })

  it('a Google sign-in that came back with an error goes to /auth?error=oauth, and /auth says so', async () => {
    window.history.replaceState(null, '', '/auth/callback?error=access_denied&error_description=denied')
    const { default: Callback } = await import('@/app/auth/callback/page')
    const c = await mount(createElement(Callback))
    expect(replaced).toEqual(['/auth?error=oauth'])
    await c.done()

    window.history.replaceState(null, '', '/auth?error=oauth')
    const { default: AuthPage } = await import('@/app/auth/page')
    const m = await mount(createElement(AuthPage))
    expect(m.host.querySelector('[role="alert"]')?.textContent).toBe('Google sign-in did not finish. Please try again, or sign in with your email and password.')
    await m.done()
  })

  it('positive twin: plain /auth shows no error', async () => {
    const { default: AuthPage } = await import('@/app/auth/page')
    const m = await mount(createElement(AuthPage))
    expect(m.host.querySelector('[role="alert"]')).toBeNull()
    await m.done()
  })
})

describe('/help', () => {
  it('its report email carries the diagnostic block, read after the click', async () => {
    const { default: HelpPage } = await import('@/app/help/page')
    const m = await mount(createElement(HelpPage))
    const open = [...m.host.querySelectorAll('button')].find(b => b.textContent === 'Report a problem')
    expect(open, 'the Report a problem control is not on /help').toBeTruthy()
    await act(async () => { open!.click() }); await settle()
    const mail = [...m.host.querySelectorAll('a')].find(a => a.textContent === 'Email support')?.getAttribute('href') ?? ''
    expect(mail.startsWith('mailto:support@radlor.com?')).toBe(true)
    expect(decodeURIComponent(mail)).toContain('--- Radlic diagnostics (please keep this in your email) ---')
    await m.done()
  })
})

describe('a dead reset link', () => {
  it('tells a parent resetting a password to use "Forgot password?", not to ask for an invite', async () => {
    const { default: SetPassword } = await import('@/app/auth/set-password/page')
    const m = await mount(createElement(SetPassword))
    expect(m.host.textContent, 'control: the dead-link screen').toContain('This link can no longer be used')
    expect(m.host.textContent).toContain('Resetting your password? On the sign-in page, tap “Forgot password?” for a new link.')
    expect(m.host.textContent).not.toContain('Ask for a fresh invite.')
    await m.done()
  })
})
