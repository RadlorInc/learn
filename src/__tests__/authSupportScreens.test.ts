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
type AuthErr = null | { message: string; code?: string }
const signIn = vi.hoisted(() => vi.fn(async (_e: string, _p: string) => ({ error: null as AuthErr })))
// Signed out by default — the screens here are the signed-out ones. The two password screens need a session, so
// they set one for their own test. `isWeakPassword` is NOT stubbed: it comes from the real module below, so the
// pages' own predicate is what decides the wording.
const session = vi.hoisted(() => vi.fn(async () => null as null | { user: { email: string } }))
const setPwd = vi.hoisted(() => vi.fn(async (_p: string) => ({ error: null as AuthErr })))
const setOwnPwd = vi.hoisted(() => vi.fn(async (_p: string) => ({ error: null as AuthErr })))
vi.mock('@/data/auth', async orig => ({
  ...(await orig<Record<string, unknown>>()),
  signInWithEmail: signIn,
  getCurrentSession: session,
  setPassword: setPwd,
  setOwnPassword: setOwnPwd,
  mustChangePassword: async () => true,
  onAuthStateChange: () => ({ subscription: { unsubscribe() {} } }),
}))

beforeAll(async () => {
  await Promise.all([import('@/app/auth/page'), import('@/app/auth/callback/page'), import('@/app/auth/set-password/page'), import('@/app/auth/new-password/page'), import('@/features/consent/ConsentLink')])
}, 120_000)

beforeEach(() => {
  replaced.length = 0; signIn.mockClear(); localStorage.clear()
  session.mockClear(); session.mockResolvedValue(null)
  setPwd.mockClear(); setPwd.mockResolvedValue({ error: null })
  setOwnPwd.mockClear(); setOwnPwd.mockResolvedValue({ error: null })
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

/**
 * THE OTHER TWO SCREENS THAT SET A PASSWORD. Supabase refuses a breached password whatever its length, and without
 * this each screen showed `error.message` — the auth server's own English, which a Spanish-reading parent cannot
 * read and which no screen here is allowed to print. Driven for real: a session, a long password, the click, then
 * the alert read back. The child's screen says it without the data-breach half (`/auth/new-password` is a child's).
 */
const fill = async (host: HTMLElement, ids: string[], value: string) => {
  await act(async () => {
    for (const id of ids) {
      const el = host.querySelector(id) as HTMLInputElement
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, value)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }
  })
  await settle()
}
const press = async (host: HTMLElement, text: RegExp) => {
  const b = [...host.querySelectorAll('button')].find(x => text.test(x.textContent ?? ''))
  expect(b, `the control ${text} is not on the screen`).toBeTruthy()
  await act(async () => { b!.click() }); await settle()
}
const WEAK = { message: 'Password is known to be weak and easy to guess, please choose a different one.', code: 'weak_password' }

describe('a password Supabase refuses, on the screens that set one', () => {
  it('/auth/set-password: our words, not the auth server’s English, and nothing about the length', async () => {
    session.mockResolvedValue({ user: { email: 'pat@example.test' } })
    setPwd.mockResolvedValueOnce({ error: WEAK })
    const { default: SetPassword } = await import('@/app/auth/set-password/page')
    const m = await mount(createElement(SetPassword))
    expect(m.host.textContent, 'control: the form is on screen, not the dead-link page').toContain('Setting a password for')
    await fill(m.host, ['#sp-new', '#sp-confirm'], 'horsebeach')     // 10 characters: over the minimum
    await press(m.host, /^Set password/)
    expect(setPwd, 'control: 10 characters passed the form and really was sent').toHaveBeenCalledTimes(1)
    const alert = m.host.querySelector('[role="alert"]')?.textContent ?? ''
    expect(alert).toBe('This password is too easy to guess, or it has appeared in a data breach. Please choose a different one.')
    expect(alert, 'Supabase’s own English reached the parent').not.toContain('known to be weak')
    expect(alert, 'a refused password is still read as a short one').not.toMatch(/at least/)
    await m.done()
  })

  it('POSITIVE TWIN: /auth/set-password still says the length itself for a short password, and sends nothing', async () => {
    session.mockResolvedValue({ user: { email: 'pat@example.test' } })
    const { default: SetPassword } = await import('@/app/auth/set-password/page')
    const m = await mount(createElement(SetPassword))
    await fill(m.host, ['#sp-new', '#sp-confirm'], 'short1')         // 6 characters
    await press(m.host, /^Set password/)
    expect(setPwd, 'a password under the minimum left the browser').not.toHaveBeenCalled()
    expect(m.host.querySelector('[role="alert"]')?.textContent).toBe('Password must be at least 8 characters')
    await m.done()
  })

  it('/auth/new-password (a child’s): “too easy to guess”, with no data-breach wording and no length claim', async () => {
    session.mockResolvedValue({ user: { email: 'aarav7@learner.radlic.invalid' } })
    setOwnPwd.mockResolvedValueOnce({ error: WEAK })
    const { default: NewPassword } = await import('@/app/auth/new-password/page')
    const m = await mount(createElement(NewPassword))
    const boxes = [...m.host.querySelectorAll('input[type="password"]')] as HTMLInputElement[]
    expect(boxes, 'control: the child’s two password boxes are on screen').toHaveLength(2)
    await act(async () => {
      for (const el of boxes) {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, 'horsebeach')
        el.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })
    await settle()
    await press(m.host, /^Save and start$/)
    expect(setOwnPwd, 'control: the child’s 10-character password really was sent').toHaveBeenCalledTimes(1)
    const alert = m.host.querySelector('[role="alert"]')?.textContent ?? ''
    expect(alert).toBe('That password is too easy to guess. Pick a different one.')
    expect(alert, 'Supabase’s own English reached the child').not.toContain('known to be weak')
    expect(alert, 'a refused password is still read as a short one').not.toMatch(/at least/)
    await m.done()
  })
})
