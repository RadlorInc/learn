// @vitest-environment jsdom
/**
 * The parent PIN is asked before a game-time setting changes or an invite goes out, not to open the dashboard
 * (founder, 6 Nov 2026; the other changes that ask are in pinDestructive.test.ts). Rendered for real: the child's page
 * with its Game time tab, and the invites page. Only the account's
 * reads are stubbed. Each change must not reach the database until the right PIN is in.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, createElement, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { existsSync, readFileSync } from 'node:fs'

const sendInvite = vi.fn(async () => ({ ok: true }))
const verifyPin = vi.fn(async (p: string) => p === '4826' ? { ok: true } : { ok: false, error: 'wrong', tries_left: 4 })
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: () => {}, push: () => {} }) }))
vi.mock('@/data/auth', () => ({ getCurrentSession: async () => ({ user: { id: 'u' } }) }))
vi.mock('@/data/repositories', () => ({
  getMyRole: async () => 'parent', getPinStatus: async () => ({ state: 'set' }),
  verifyPin, setPin: async () => ({ ok: true }), requestPinReset: async () => ({ ok: true }),
  sendInvite, acceptInvite: vi.fn(), revokeInvite: vi.fn(), declineInvite: vi.fn(),
  getMyLearners: async () => [{ id: 'kid', display_name: 'Ana', avatar_index: 0, age_group: '9-11' }],
  getReceivedInvites: async () => [], getSentInvites: async () => [],
}))
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let host: HTMLElement, root: ReturnType<typeof createRoot>
const settle = () => act(async () => { await new Promise(r => setTimeout(r, 0)) })
async function show(node: ReactNode) {
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
  await act(async () => { root.render(node) }); await settle()
}
const button = (label: string) => [...host.querySelectorAll('button')].find(b => b.textContent?.includes(label)) as HTMLButtonElement
const click = async (label: string) => { await act(async () => { button(label).click() }); await settle() }
async function typePin(v: string) {
  const input = host.querySelector('input[aria-label="PIN"]') as HTMLInputElement
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, v)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await click('Confirm')
}
beforeEach(() => { vi.clearAllMocks() })
afterEach(() => { act(() => root.unmount()); host.remove() })

describe('Game time asks for the PIN first', () => {
  it('the switch saves only after the right PIN, and the tab opens without one', async () => {
    const onSaveGame = vi.fn(async () => {})
    const { ChildPage } = await import('@/features/dashboard/ChildPage')
    const props = { id: 'kid', name: 'Ana', band: '9-11', avatar: 'fox', avatarIndex: 0, tab: 'game', crumb: { href: '/parent', label: 'Home' }, owner: true, lessonIds: [], due: {},
      isDone: () => false, login: null, wallet: { balance: 3, minutes_used_today: 0, minutes_per_day: 20, points_per_minute: 8, enabled: true },
      onLaunch: () => {}, onSaveLessons: async () => {}, onSaveGame, onLogin: () => {} } as unknown as Parameters<typeof ChildPage>[0]
    await show(createElement(ChildPage, props))
    expect(host.querySelector('input[aria-label="PIN"]')).toBeNull()
    await click('Game time:')
    expect(onSaveGame).not.toHaveBeenCalled()
    await typePin('4826')
    expect(onSaveGame).toHaveBeenCalledWith(false, 20)
  })
})

describe('sharing a child with another adult asks for the PIN first', () => {
  it('the invite is sent only after the right PIN', async () => {
    const { default: InvitesPage } = await import('@/app/parent/invites/page')
    await show(createElement(InvitesPage))
    expect(host.querySelector('input[aria-label="PIN"]'), 'the page opened behind a PIN').toBeNull()
    const email = host.querySelector('input[type="email"]') as HTMLInputElement
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(email, 'gran@x.test')
      email.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await click('Send invite for')
    expect(sendInvite).not.toHaveBeenCalled()
    await typePin('1111')
    expect(sendInvite).not.toHaveBeenCalled()
    await typePin('4826')
    expect(sendInvite).toHaveBeenCalledWith('kid', 'gran@x.test')
  })
})

describe('the rest of the dashboard opens without it', () => {
  it('no layout wraps /parent in the gate', () => {
    expect(existsSync('src/app/parent/page.tsx'), 'control: the dashboard moved, so this looks in the wrong place').toBe(true)
    expect(existsSync('src/app/parent/layout.tsx')).toBe(false)
  })
})

describe('a tour never starts by itself', () => {
  it('only a tap on a Help item or "tour again" sets the tour', () => {
    const src = readFileSync('src/app/parent/page.tsx', 'utf8')
    expect(src, 'control: the dashboard still has its tours').toMatch(/<TourRunner tour=\{tour\}/)
    expect(src).not.toMatch(/autoTour|'first' : null/)
  })
})
