/**
 * THE SIGNUP TICK SENDS B1 BY ITSELF ONLY ONCE IN AN ACCOUNT'S LIFE (consent-once, C2).
 *
 * The tick is stored on the device (and in the email-signup metadata) and outlives the consent it produced. Without
 * this rule, a parent who withdrew permission for every child — or declined, or let the email lapse — would get a
 * fresh consent request emailed to them automatically the next time they opened the dashboard. Found while checking
 * the Round-2 script against the build (2026-09-24); red on the first version of AccountConsent.tsx.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const state = vi.hoisted(() => ({ current: { k: 'none', fresh: true } as Record<string, unknown>, asked: [] as (string | undefined)[] }))
vi.mock('@/features/consent/consentState', async orig => ({
  ...(await orig<typeof import('@/features/consent/consentState')>()),
  readAccountConsent: async () => state.current,
  requestAccountConsent: async (_lang: string, ackAt?: string) => { state.asked.push(ackAt); return { ok: true, email: 'p@example.test', days: 7 } },
}))

async function mount() {
  const React = await import('react')
  const { act } = React
  const { createRoot } = await import('react-dom/client')
  const { AccountConsentCard } = await import('@/features/consent/AccountConsent')
  const host = document.createElement('div'); document.body.appendChild(host)
  await act(async () => { createRoot(host).render(React.createElement(AccountConsentCard, {
    lang: 'en', ack: { noticeVersion: 'notice-v5', at: new Date().toISOString() },
  })) })
  await act(async () => { await new Promise(r => setTimeout(r, 20)) })
  return host
}

describe('the signup tick and the automatic B1', () => {
  beforeEach(() => { state.asked.length = 0 })

  it('a brand-new account with a tick: B1 goes out by itself (the positive twin)', async () => {
    state.current = { k: 'none', fresh: true }
    const host = await mount()
    expect(state.asked).toHaveLength(1)
    expect(host.textContent).toContain('Waiting for your permission')
  })

  it('after a withdrawal (or a decline, or a lapse): no automatic email — the notice, and the parent chooses', async () => {
    state.current = { k: 'none', fresh: false }
    const host = await mount()
    expect(state.asked, 'a consent request was emailed to a parent who had just withdrawn').toEqual([])
    expect(host.textContent).toContain("I'm the parent or legal guardian — continue")
  })
})
