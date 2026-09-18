// @vitest-environment jsdom
/**
 * The dashboard PIN asks a teacher for a "teacher PIN", not a "parent PIN" (reported 2026-09-18). Same PIN, same gate;
 * only the words follow the role. Rendered for real with the account's reads stubbed; expected words written by hand.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'

let role: string | null
let pin: 'set' | 'none'
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: () => {}, push: () => {} }) }))
vi.mock('@/data/auth', () => ({ getCurrentSession: async () => ({ user: { id: 'u' } }) }))
vi.mock('@/data/repositories', () => ({
  getMyRole: async () => role,
  getPinStatus: async () => ({ state: pin }),
  verifyPin: async () => ({ ok: false }), setPin: async () => ({ ok: true }), requestPinReset: async () => ({ ok: true }), signOut: async () => {},
}))

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

async function heading(): Promise<string> {
  const { ParentPinGate } = await import('@/shared/ui/ParentPinGate')
  const el = document.createElement('div')
  document.body.appendChild(el)
  const root = createRoot(el)
  await act(async () => { root.render(createElement(ParentPinGate, null, 'dashboard')) })
  await act(async () => { await new Promise(r => setTimeout(r, 0)) })
  const text = el.querySelector('h1')?.textContent ?? el.textContent ?? ''
  const body = el.textContent ?? ''
  act(() => root.unmount())
  el.remove()
  return `${text} | ${body}`
}

beforeEach(() => { role = null; pin = 'set' })

describe('PIN gate wording', () => {
  it('a teacher is asked for a TEACHER PIN — entering and setting one', async () => {
    role = 'teacher'
    expect(await heading()).toMatch(/^Enter your teacher PIN \|/)
    pin = 'none'
    const created = await heading()
    expect(created).toMatch(/^Set a teacher PIN \|/)
    expect(created).toContain('so a student on this device cannot get in')
  })

  it('a parent is still asked for a PARENT PIN', async () => {
    role = 'parent'
    expect(await heading()).toMatch(/^Enter your parent PIN \|/)
    pin = 'none'
    expect(await heading()).toContain('so a child on this device cannot get in')
  })
})
