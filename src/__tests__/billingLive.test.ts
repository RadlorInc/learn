/**
 * BILLING IS LIVE (founder, 2026-10-01: the paid launch, with beta legal pages). Until then the private beta was free
 * (2026-09-24) and this file asserted the opposite: no price, no checkout, no refund link anywhere a parent could reach.
 * Now /parent/plan is the checkout, it links the published Refund policy, and Help walks a parent to the plan card.
 *
 * ⚠️ The beta screen still ships, for a rollback (BILLING_LIVE back to false): the absence of its words is checked
 * against the source that still carries them, so the search is not blind.
 */
import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'

vi.mock('@/data/repositories', async (orig) => ({ ...(await orig<Record<string, unknown>>()), getMyRole: async () => 'parent' }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: () => {}, push: () => {}, refresh: () => {} }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))
vi.mock('@/data/supabase/client', () => ({ createClient: () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }) }))

async function paint(el: unknown): Promise<string> {
  const { act } = await import('react')
  const { createRoot } = await import('react-dom/client')
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  await act(async () => { root.render(el as never) })
  const html = host.innerHTML
  await act(async () => { root.unmount() })
  host.remove()
  return html
}
const price = /\$\d/
const refunds = /\/legal\/refunds/

describe('billing is live: a parent can see the plans and buy', () => {
  it('the switch every other check here depends on', async () => {
    const { BILLING_LIVE } = await import('@/app/legal/registry')
    expect(BILLING_LIVE).toBe(true)
  })

  it('/parent/plan is the checkout: prices, the Continue button and the refund link — not the beta screen', async () => {
    const React = await import('react')
    const { default: PlanPage } = await import('@/app/parent/plan/page')
    const html = await paint(React.createElement(PlanPage))
    expect(html).toMatch(price)
    expect(html).toMatch(refunds)
    expect(html).toContain('Continue —')
    expect(html).not.toContain('Radlic is free during the beta')
    expect(readFileSync('src/app/parent/plan/page.tsx', 'utf8'), 'control: the beta screen is still in the source').toContain('Radlic is free during the beta')
    expect(html, 'production shows no TEST MODE note (that is the staging env var only)').not.toContain('TEST MODE')
  })

  it('the Account view\'s "Plan & billing" card is still behind BILLING_LIVE (for a rollback)', () => {
    const src = readFileSync('src/app/parent/page.tsx', 'utf8')
    const card = src.match(/[^\n]*<section[^\n]*data-tour="plan-card"[^\n]*href="\/parent\/plan"[^\n]*/)
    expect(card, 'control: the parent plan card is in the source').not.toBeNull()
    expect(card![0]).toMatch(/BILLING_LIVE && <section/)
  })

  it('Help walks a parent to the plan card', async () => {
    const { helpGoals } = await import('@/features/dashboard/helpGoals')
    const parentSteps = helpGoals({ tea: false, paid: false, c: 'c1', k: undefined, lang: 'en' }).flatMap(g => g.items).flatMap(i => i.tour.steps)
    expect(parentSteps.some(s => s.target === 'plan-card')).toBe(true)
  })
})
