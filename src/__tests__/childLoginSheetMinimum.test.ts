// @vitest-environment jsdom
/**
 * The adult's "{name}'s login" sheet asks for at least 8 characters (founder, 2026-09-28: Supabase Auth's minimum is
 * 8). Rendered for real; only the save call is stubbed. A 7-character password is refused on the sheet with the minimum
 * named, and nothing is sent; an 8-character one is sent as typed. Expected text written out by hand.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'

const sent = vi.hoisted(() => ({ calls: [] as [string, string, string][] }))
vi.mock('@/data/repositories', () => ({
  setChildLogin: async (learnerId: string, username: string, password: string) => { sent.calls.push([learnerId, username, password]); return { ok: true } },
  removeChildLogin: async () => ({ ok: true }),
}))
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!

async function tryPassword(password: string) {
  const { ChildLoginSheet } = await import('@/shared/ui/ChildLoginSheet')
  const el = document.createElement('div'); document.body.appendChild(el)
  const root = createRoot(el)
  await act(async () => { root.render(createElement(ChildLoginSheet, { learnerId: 'L1', name: 'Aarav', current: null, onClose: () => {}, onChanged: () => {} })) })
  const [user, pass] = [...el.querySelectorAll('input')]
  const placeholder = pass.placeholder
  await act(async () => { setValue.call(user, 'aarav7'); user.dispatchEvent(new Event('input', { bubbles: true })) })
  await act(async () => { setValue.call(pass, password); pass.dispatchEvent(new Event('input', { bubbles: true })) })
  const create = [...el.querySelectorAll('button')].find(b => b.textContent === 'Create login')!
  await act(async () => { create.click() })
  await act(async () => { await new Promise(r => setTimeout(r, 0)) })
  const alert = el.querySelector('[role="alert"]')?.textContent ?? null
  act(() => root.unmount()); el.remove()
  return { placeholder, alert }
}

beforeEach(() => { sent.calls = [] })

describe('the child login sheet: at least 8 characters', () => {
  it('the password box says the minimum', async () => {
    expect((await tryPassword('abcdefgh')).placeholder).toBe('At least 8 characters')
  })

  it('a 7-character password is refused on the sheet, naming the minimum, and nothing is sent', async () => {
    const { alert } = await tryPassword('abcdefg')
    expect(alert).toBe('Make the password at least 8 characters.')
    expect(sent.calls, 'a 7-character password was sent').toEqual([])
  })

  it('POSITIVE TWIN: an 8-character password is sent as typed', async () => {
    const { alert } = await tryPassword('abcdefgh')
    expect(alert).toBeNull()
    expect(sent.calls).toEqual([['L1', 'aarav7', 'abcdefgh']])
  })
})
