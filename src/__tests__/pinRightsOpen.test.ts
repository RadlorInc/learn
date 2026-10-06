// @vitest-environment jsdom
/**
 * With the parent PIN locked or not yet entered, three things stay reachable — help, withdrawing permission for all
 * children, and a copy of the data — and closing the account does not (founder, 2026-10-06).
 *
 * Rendered for real: the PIN screen (`ParentPinGate`), the page its link points to, and the /parent layout. Only the
 * account's reads are stubbed. Expected words and paths are written by hand.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement, act, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { existsSync } from 'node:fs'

let role: string | null
let session: boolean
let pin: Record<string, unknown>
const replaced: string[] = []
const withdrawAllConsent = vi.fn(async () => ({ ok: true }))
const getLearnerExportExtras = vi.fn(async () => ({ notes: [] }))
const getMyLearners = vi.fn(async () => [{ id: 'kid-1', display_name: 'Ana', created_by: 'u' }])
const verifyPin = vi.fn(async (p: string) => p === '4826' ? { ok: true } : { ok: false, error: 'wrong', tries_left: 4 })

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: (p: string) => { replaced.push(p) }, push: () => {} }) }))
vi.mock('@/data/auth', () => ({ getCurrentSession: async () => session ? { user: { id: 'u', email: 'p@x.test' } } : null }))
vi.mock('@/data/repositories', () => ({
  getMyRole: async () => role,
  getPinStatus: async () => pin,
  verifyPin, setPin: async () => ({ ok: true }), requestPinReset: async () => ({ ok: true }), signOut: async () => true,
  getMyLearners, getRecentSessions: async () => [], enterAsChild: async () => '/modules',
  withdrawAllConsent, getLearnerExportExtras,
}))

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const LOCKED = { state: 'set', locked_until: new Date(Date.now() + 86_400_000).toISOString() }

async function mount(node: ReactNode) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const root = createRoot(el)
  await act(async () => { root.render(node) })
  for (let i = 0; i < 4; i++) await act(async () => { await new Promise(r => setTimeout(r, 0)) })
  return { el, done: () => { act(() => root.unmount()); el.remove() } }
}
const settle = async () => { for (let i = 0; i < 4; i++) await act(async () => { await new Promise(r => setTimeout(r, 0)) }) }
const click = async (b: Element | undefined | null) => { expect(b).toBeTruthy(); await act(async () => { (b as HTMLElement).click() }); await settle() }
const button = (el: Element, text: string) => [...el.querySelectorAll('button')].find(b => b.textContent?.includes(text))

async function gate(child = 'BEHIND-THE-PIN') {
  const { ParentPinGate } = await import('@/shared/ui/ParentPinGate')
  return mount(createElement(ParentPinGate, null, child))
}
async function rightsPage() {
  const { default: Page } = await import('@/app/rights/page')
  return mount(createElement(Page))
}

beforeEach(() => {
  role = 'parent'; session = true; pin = LOCKED; replaced.length = 0
  withdrawAllConsent.mockClear(); getLearnerExportExtras.mockClear(); getMyLearners.mockClear(); verifyPin.mockClear()
  URL.createObjectURL = () => 'blob:x'; URL.revokeObjectURL = () => {}
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
})

describe('the PIN screen links to what stays open', () => {
  it.each([['locked', LOCKED], ['not yet entered', { state: 'set' }], ['not yet set', { state: 'none' }]])('PIN %s: the link is there and goes to /rights', async (_, s) => {
    pin = s
    const g = await gate()
    expect(g.el.textContent).not.toContain('BEHIND-THE-PIN')
    const a = [...g.el.querySelectorAll('a')].find(x => x.textContent === 'Need help, or want to withdraw permission or download your data?')
    expect(a?.getAttribute('href')).toBe('/rights')
    g.done()
  })

  it('/rights is not under app/parent, so the PIN layout does not wrap it; /parent/account is', () => {
    expect(existsSync('src/app/rights/page.tsx')).toBe(true)
    expect(existsSync('src/app/rights/layout.tsx')).toBe(false)
    expect(existsSync('src/app/parent/account/page.tsx')).toBe(true)
    expect(existsSync('src/app/parent/layout.tsx')).toBe(true)
  })
})

describe('/rights with the PIN locked', () => {
  it('a signed-in parent gets help, withdraw-all and the download — and no way to close the account', async () => {
    const p = await rightsPage()
    const text = p.el.textContent ?? ''
    expect([...p.el.querySelectorAll('a')].map(a => a.getAttribute('href'))).toEqual(['/parent', '/help', 'mailto:support@radlor.com'])
    expect(text).not.toMatch(/close your account|delete my account/i)

    // Download: the same DataRights button, fetching that child's extras.
    await click(button(p.el, 'Download a copy'))
    expect(getLearnerExportExtras).toHaveBeenCalledWith('kid-1')

    // Withdraw: the same card and the same repository call as the dashboard, behind its confirm.
    await click(button(p.el, 'Withdraw permission for all your children'))
    expect(withdrawAllConsent).not.toHaveBeenCalled()
    await click(button(p.el, "Withdraw permission and delete my children's data"))
    expect(withdrawAllConsent).toHaveBeenCalledTimes(1)
    expect(p.el.textContent).toContain('We have stopped collecting information about every child on your account')
    p.done()
  })

  it('signed out: sent to sign in, and neither control is shown', async () => {
    session = false
    const p = await rightsPage()
    expect(replaced).toEqual(['/auth'])
    expect(button(p.el, 'Withdraw permission')).toBeUndefined()
    expect(button(p.el, 'Download a copy')).toBeUndefined()
    p.done()
  })

  it("a child's own login: sent to its lessons, nothing read, neither control shown", async () => {
    role = 'learner'
    const p = await rightsPage()
    expect(replaced).toEqual(['/modules'])
    expect(getMyLearners).not.toHaveBeenCalled()
    expect(button(p.el, 'Withdraw permission')).toBeUndefined()
    expect(button(p.el, 'Download a copy')).toBeUndefined()
    p.done()
  })
})

describe('closing the account still needs the PIN', () => {
  it('the /parent layout hides its pages until the PIN is right, then shows them', async () => {
    pin = { state: 'set' }
    const { default: ParentLayout } = await import('@/app/parent/layout')
    const g = await mount(createElement(ParentLayout, null, 'CLOSE-YOUR-ACCOUNT-PAGE'))
    expect(g.el.textContent).not.toContain('CLOSE-YOUR-ACCOUNT-PAGE')
    const input = g.el.querySelector('input[aria-label="PIN"]') as HTMLInputElement
    const type = async (v: string) => act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, v)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await type('1111'); await click(button(g.el, 'Open dashboard'))
    expect(g.el.textContent).not.toContain('CLOSE-YOUR-ACCOUNT-PAGE')
    await type('4826'); await click(button(g.el, 'Open dashboard'))
    expect(g.el.textContent).toContain('CLOSE-YOUR-ACCOUNT-PAGE')
    g.done()
  })
})
