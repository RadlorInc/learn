/**
 * BUG-10: "check your connection" is shown ONLY when the failure is a network failure.
 *
 * Driven end to end through the real repository functions (`correctLearner`, `getPinStatus`) and the real screens that
 * word their result (the "Update <name>'s details" card, the parent PIN gate). Only the Supabase client is faked, to
 * return the exact error a real server sends. Expected words are written out here, not imported.
 *
 * Property checked: for a consent refusal (P0C01), an RLS denial (42501), and an expired sign-in (PGRST301 / 401 /
 * "JWT expired"), the rendered text does not contain "connection"; for `TypeError: Failed to fetch` it still does
 * (the positive control — without it a screen that never says "connection" would pass).
 */
import { describe, it, expect, vi } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'

type Outcome = { data?: unknown; error?: unknown; throws?: unknown }
let next: Outcome = {}
const settle = () => next.throws ? Promise.reject(next.throws) : Promise.resolve({ data: next.data ?? null, error: next.error ?? null })
const fake = {
  from: () => ({ update: () => ({ eq: () => ({ select: settle }) }) }),
  rpc: settle,
  auth: { getUser: async () => ({ data: { user: null } }) },
}
vi.mock('@/data/repositories/_shared', async orig => ({ ...await orig<object>(), db: () => fake }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push() {}, replace() {} }), usePathname: () => '/parent', useSearchParams: () => new URLSearchParams() }))
vi.mock('@/data/auth', async orig => ({ ...await orig<object>(), getCurrentSession: async () => ({ user: { id: 'u' } }) }))
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const EXPIRED = 'Your sign-in has expired. Sign in again, then try this.'
const GENERIC = 'Something went wrong. Please try again.'
const failedFetch = new TypeError('Failed to fetch')

const cases: [string, Outcome, string][] = [
  ['consent refusal P0C01', { error: { code: 'P0C01', message: 'no granted parental consent for this child' } }, GENERIC],
  ['RLS denial 42501', { error: { code: '42501', message: 'new row violates row-level security policy' } }, GENERIC],
  ['expired sign-in PGRST301', { error: { code: 'PGRST301', message: 'JWT expired' } }, EXPIRED],
  ['expired sign-in, HTTP 401 only', { error: { status: 401, message: 'Unauthorized' } }, EXPIRED],
]

async function render(el: ReturnType<typeof createElement>): Promise<{ host: HTMLElement; unmount: () => void }> {
  const host = document.createElement('div'); document.body.appendChild(host)
  const root = createRoot(host)
  await act(async () => { root.render(el) })
  await act(async () => { await new Promise(r => setTimeout(r, 0)) })
  return { host, unmount: () => { act(() => root.unmount()); host.remove() } }
}

async function correctCardText(outcome: Outcome): Promise<string> {
  const { ChildPage } = await import('@/features/dashboard/ChildPage')
  const { correctLearner } = await import('@/data/repositories/learners')
  const { host, unmount } = await render(createElement(ChildPage, {
    id: 'k', name: 'Ana', avatar: '/a.png', avatarIndex: 0, tab: 'login', crumb: { href: '/parent', label: 'Home' }, owner: true,
    lessonIds: null, due: {}, isDone: () => false, login: undefined, wallet: undefined,
    onLaunch() {}, onSaveLessons: async () => 'ok' as never, onSaveGame: async () => {}, onLogin() {}, dataRights: null,
    onCorrect: (display_name: string) => correctLearner('k', { display_name }),
  }))
  const card = host.querySelector('[data-tour="correct-card"]')!
  next = outcome
  await act(async () => { [...card.querySelectorAll('button')].find(b => b.textContent === 'Save')!.click() })
  await act(async () => { await new Promise(r => setTimeout(r, 0)) })
  const text = card.textContent ?? ''
  unmount()
  return text
}

async function pinGateText(outcome: Outcome): Promise<string> {
  const { ParentPinGate } = await import('@/shared/ui/ParentPinGate')
  next = outcome
  const { host, unmount } = await render(createElement(ParentPinGate, null, 'dashboard'))
  const text = host.textContent ?? ''
  unmount()
  return text
}

describe('the right-to-correct card', () => {
  it.each(cases)('%s is not called a connection problem', async (_n, outcome, words) => {
    const text = await correctCardText(outcome)
    expect(text).not.toMatch(/connection/i)
    expect(text).toContain(words)
  })
  it('0 rows updated (RLS refuses by matching nothing) is not a connection problem', async () => {
    const text = await correctCardText({ data: [] })
    expect(text).not.toMatch(/connection/i)
    expect(text).toContain(GENERIC)
  })
  it('control: a real network failure still says check your connection', async () => {
    expect(await correctCardText({ throws: failedFetch })).toContain('Could not save. Check your connection and try again.')
    // supabase-js also reports a failed fetch as an error value with no SQLSTATE
    expect(await correctCardText({ error: { code: '', message: 'TypeError: Failed to fetch' } })).toContain('Could not save. Check your connection and try again.')
  })
  it('control: a save that works says Saved.', async () => {
    expect(await correctCardText({ data: [{ id: 'k' }] })).toContain('Saved.')
  })
})

describe('the parent PIN gate', () => {
  it('an expired sign-in is not called a connection problem', async () => {
    const text = await pinGateText({ error: { code: 'PGRST301', message: 'JWT expired' } })
    expect(text, 'control: the gate is on its error screen').toContain('Could not open the dashboard')
    expect(text).not.toMatch(/connection/i)
    expect(text).toContain(EXPIRED)
  })
  it('control: a real network failure still says check your connection', async () => {
    const text = await pinGateText({ throws: failedFetch })
    expect(text).toContain('Could not open the dashboard')
    expect(text).toContain('Check your connection and try again.')
  })
})
