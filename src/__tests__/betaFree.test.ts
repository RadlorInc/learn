/**
 * THE PRIVATE BETA IS FREE (founder, 2026-09-24): no plans, no prices, no checkout and no link to the refund policy —
 * which is not published while billing is off — anywhere a parent can reach.
 *
 * ⚠️ Each absence has its control: the same search finds a price and the refund link on the checkout screen, which
 * still ships for the day billing is switched on.
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

describe('the beta is free: nothing to buy anywhere a parent can reach', () => {
  it('billing is off — the switch every other check here depends on', async () => {
    const { BILLING_LIVE } = await import('@/app/legal/registry')
    expect(BILLING_LIVE).toBe(false)
  })

  it('/parent/plan says the beta is free, with no price, no checkout button and no refund link', async () => {
    const React = await import('react')
    const { default: PlanPage, PlanCheckout } = await import('@/app/parent/plan/page')
    const html = await paint(React.createElement(PlanPage))
    expect(html).toContain('Radlic is free during the beta')
    expect(html).not.toMatch(price)
    expect(html).not.toMatch(refunds)
    expect(html).not.toContain('Continue —')
    // Control: the same searches find both on the checkout screen, so they are not blind.
    const checkout = await paint(React.createElement(PlanCheckout))
    expect(checkout, 'control: the checkout screen shows a price').toMatch(price)
    expect(checkout, 'control: the checkout screen links the refund policy').toMatch(refunds)
  })

  it('the Account view shows the parent no "Plan & billing" card while billing is off (and a teacher keeps theirs)', () => {
    const src = readFileSync('src/app/parent/page.tsx', 'utf8')
    // The parent's card is the one that links /parent/plan; it must be behind BILLING_LIVE.
    const card = src.match(/[^\n]*<section[^\n]*data-tour="plan-card"[^\n]*href="\/parent\/plan"[^\n]*/)
    expect(card, 'control: the parent plan card is still in the source').not.toBeNull()
    expect(card![0]).toMatch(/BILLING_LIVE && <section/)
  })

  it('no Help walkthrough sends a parent to the hidden plan card', async () => {
    const { helpGoals } = await import('@/features/dashboard/helpGoals')
    const parentSteps = helpGoals({ tea: false, paid: false, c: 'c1', k: undefined, lang: 'en' }).flatMap(g => g.items).flatMap(i => i.tour.steps)
    expect(parentSteps.length, 'control: parents have walkthroughs').toBeGreaterThan(5)
    expect(parentSteps.filter(s => s.target === 'plan-card')).toEqual([])
    const teacherSteps = helpGoals({ tea: true, paid: false, c: undefined, k: 'k1', lang: 'en' }).flatMap(g => g.items).flatMap(i => i.tour.steps)
    expect(teacherSteps.some(s => s.target === 'plan-card'), 'control: a teacher still has the plan step (it is not billing)').toBe(true)
  })
})
