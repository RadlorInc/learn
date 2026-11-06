// @vitest-environment jsdom
/**
 * The parent PIN is asked before a game-time or Ask Radlic setting changes, and nowhere else on the dashboard (founder,
 * 6 Nov 2026). Rendered for real: the Ask Radlic card and the child's page with its Game time tab. Only the account's
 * reads are stubbed. Each change must not reach the database until the right PIN is in.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, createElement, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { existsSync, readFileSync } from 'node:fs'

const setAskMaths = vi.fn(async () => ({ ok: true }))
const cancelAddon = vi.fn(async () => ({ ok: true }))
const forgetAskQuestions = vi.fn(async () => 0)
const verifyPin = vi.fn(async (p: string) => p === '4826' ? { ok: true } : { ok: false, error: 'wrong', tries_left: 4 })
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: () => {}, push: () => {} }) }))
vi.mock('@/data/auth', () => ({ getCurrentSession: async () => ({ user: { id: 'u' } }) }))
vi.mock('@/data/repositories', () => ({
  getMyRole: async () => 'parent', getPinStatus: async () => ({ state: 'set' }),
  verifyPin, setPin: async () => ({ ok: true }), requestPinReset: async () => ({ ok: true }),
}))
vi.mock('@/data/repositories/askMaths', () => ({
  addonActive: () => true, setAskMaths, cancelAddon, forgetAskQuestions, startAddonCheckout: vi.fn(),
  getAddon: async () => ({ status: 'active', current_period_end: '2099-01-01T00:00:00Z', cancel_at_period_end: false }),
  getAskSettings: async () => ({ enabled: true, daily_limit: 5, consent_version: 'v', consented_at: null }),
  getAskQuestions: async () => [{ id: 'q', asked_at: '2026-11-01T00:00:00Z', question: 'x', outcome: 'not_maths', script: null }],
}))
vi.mock('@/features/askMaths/AskPlayer', () => ({ AskPlayer: () => null }))
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
async function askCard() {
  const { AskMathsCard } = await import('@/features/dashboard/AskMathsCard')
  await show(createElement(AskMathsCard, { id: 'kid', name: 'Ana', band: '9-11', owner: true }))
}
beforeEach(() => { vi.clearAllMocks() })
afterEach(() => { act(() => root.unmount()); host.remove() })

describe('Ask Radlic settings ask for the PIN first', () => {
  it('Turn off: nothing is saved on a wrong PIN or a Cancel, and it is saved on the right PIN', async () => {
    await askCard()
    expect(host.querySelector('input[aria-label="PIN"]'), 'the card opened behind a PIN').toBeNull()
    await click('Turn off')
    expect(setAskMaths).not.toHaveBeenCalled()
    await typePin('1111')
    expect(setAskMaths).not.toHaveBeenCalled()
    await click('Cancel')
    expect(host.querySelector('input[aria-label="PIN"]')).toBeNull()
    expect(setAskMaths).not.toHaveBeenCalled()

    await click('Turn off')
    await typePin('4826')
    expect(setAskMaths).toHaveBeenCalledTimes(1)
    expect(setAskMaths).toHaveBeenCalledWith('kid', false, 5, null)
  })

  it('stopping the add-on and deleting the questions ask too', async () => {
    await askCard()
    await click('Stop the add-on')
    expect(cancelAddon).not.toHaveBeenCalled()
    expect(host.querySelector('input[aria-label="PIN"]')).not.toBeNull()
    await click('Cancel')
    await click('Delete all of')
    expect(forgetAskQuestions).not.toHaveBeenCalled()
    await typePin('4826')
    expect(forgetAskQuestions).toHaveBeenCalledTimes(1)
  })

  it('a second change straight after a right PIN does not ask again', async () => {
    await askCard()
    await click('Delete all of')
    await typePin('4826')
    expect(verifyPin).toHaveBeenCalledTimes(1)
    await click('Stop the add-on')
    expect(host.querySelector('input[aria-label="PIN"]')).toBeNull()
    expect(cancelAddon).toHaveBeenCalledTimes(1)
  })
})

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

describe('the child\'s homework button', () => {
  it('sits under Start learning, goes to /ask, and shows only when a grown-up switched Ask Radlic on', () => {
    const src = readFileSync('src/features/lessons/ModuleHome.tsx', 'utf8')
    const at = src.indexOf('Help me with homework')
    expect(at).toBeGreaterThan(src.indexOf("'Start learning'"))
    expect(src.slice(at - 120, at)).toMatch(/askOn && <Link href="\/ask"/)
  })
})
