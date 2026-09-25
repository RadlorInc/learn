// @vitest-environment jsdom
/**
 * /auth/confirm — where the one sign-up email lands (founder, 2026-09-25). Found by driving it in a browser: when the
 * confirmation call could not reach the auth server, the page moved on to the consent page anyway, so a parent could give
 * consent on an account that was never confirmed and then could not sign in. A USED link may move on (the first click
 * confirmed the address); an UNREACHED server may not. Rendered for real; the auth call and the router are stubbed.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'

const nav = vi.hoisted(() => ({ replaced: [] as string[] }))
const verify = vi.hoisted(() => ({ result: null as unknown }))
const role = vi.hoisted(() => ({ set: [] as string[], current: null as string | null }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: (u: string) => nav.replaced.push(u), push: () => {} }),
  useSearchParams: () => new URLSearchParams('th=hash123'),
}))
vi.mock('@/data/auth', () => ({ verifyEmailToken: async () => verify.result }))
vi.mock('@/data/repositories', () => ({
  getMyRole: async () => role.current,
  setMyRole: async (r: string) => { role.set.push(r); role.current = r; return true },
  homeForRole: (r: string | null) => (r === 'learner' ? '/modules' : '/parent'),
}))
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

async function open(hash: string) {
  window.location.hash = hash
  const { default: Page } = await import('@/app/auth/confirm/page')
  const el = document.createElement('div'); document.body.appendChild(el)
  const root = createRoot(el)
  await act(async () => { root.render(createElement(Page)) })
  await act(async () => { await new Promise(r => setTimeout(r, 0)) })
  const text = el.textContent ?? ''
  act(() => root.unmount()); el.remove()
  return text
}

beforeEach(() => { nav.replaced = []; role.set = []; role.current = null })

describe('/auth/confirm', () => {
  it('confirmed: sets the role chosen at sign-up, then a parent goes to the consent page', async () => {
    verify.result = { data: { user: { user_metadata: { role: 'parent' } } }, error: null }
    await open('#t=' + 'a'.repeat(43))
    expect(role.set).toEqual(['parent'])
    expect(nav.replaced).toEqual([`/consent/respond#t=${'a'.repeat(43)}`])
  })

  it('a teacher (no consent token) goes home', async () => {
    verify.result = { data: { user: { user_metadata: { role: 'teacher' } } }, error: null }
    await open('')
    expect([role.set, nav.replaced]).toEqual([['teacher'], ['/parent']])
  })

  it('a USED or expired link still takes a parent to the consent page (the first click confirmed the address)', async () => {
    verify.result = { data: { user: null }, error: { status: 403, code: 'otp_expired' } }
    await open('#t=' + 'b'.repeat(43))
    expect(nav.replaced).toEqual([`/consent/respond#t=${'b'.repeat(43)}`])
  })

  it('the auth server NOT REACHED: stays, says so, offers a retry — never the consent page', async () => {
    verify.result = { data: { user: null }, error: { name: 'AuthRetryableFetchError', status: 0 } }
    const text = await open('#t=' + 'c'.repeat(43))
    expect(nav.replaced, 'moved on without confirming the address').toEqual([])
    expect(text).toContain('Try again')
  })
})
