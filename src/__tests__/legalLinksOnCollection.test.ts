/**
 * THE PRIVACY POLICY MUST BE REACHABLE FROM EVERY SCREEN THAT COLLECTS OR CHARGES.
 *
 * ⚠️ WHY THIS IS A SEPARATE FILE FROM `legalDocs.test.ts`. The two screens are client components
 * behind an auth gate and an i18n provider, so reaching them needs module-scoped `vi.mock` calls —
 * and `vi.mock` is hoisted to the top of the FILE, so putting these here would have quietly
 * replaced Supabase for the document gates too. Same mechanism (vitest, `npm test`), separate file
 * because the mocks are not separable.
 *
 * ⚠️ ASSERTED ON THE RENDERED DOM, NEVER ON THE SOURCE, and that is the whole point of the file.
 * A `<Link href="/legal/privacy">` can sit in the source and never be painted: `/parent/plan` is
 * wrapped in `RoleGate`, which returns `null` until an effect resolves, so a static render of that
 * page produces an empty string — and a source grep would have called it covered. Both defects
 * this file exists for were FOUND by rendering (2026-09-22): checkout linked only to the Terms,
 * and the add-a-child sheet had no links at all while collecting a child's name, avatar and grade.
 *
 * ⚠️ WHAT THIS DOES NOT CLAIM. It asserts the link is present and points at the policy. It does not
 * assert anything about verifiable parental consent — that flow does not exist yet
 * (`docs/legal/03-consent-and-checkout-screen-copy.md`), and a gate implying otherwise would be
 * worse than no gate.
 */
import { describe, it, expect, vi } from 'vitest'

// getMyRole decides whether RoleGate paints its children. Without this the checkout screen renders
// as an empty string and every assertion below would be vacuous.
vi.mock('@/data/repositories', async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  getMyRole: async () => 'parent',
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: () => {}, push: () => {}, refresh: () => {} }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))
vi.mock('@/data/supabase/client', () => ({
  createClient: () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }),
}))

/** Mount a real component in jsdom and hand back the HTML a browser would have painted. */
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

const hrefs = (html: string) => [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1])

describe('every screen that collects a child\'s details or takes money links to the Privacy Policy', () => {
  it('the checkout screen renders a Privacy Policy link beside the Terms', async () => {
    const React = await import('react')
    const { default: PlanPage } = await import('@/app/parent/plan/page')
    const html = await paint(React.createElement(PlanPage))

    /**
     * ⚠️ POSITIVE CONTROL FIRST, AND IT IS LOAD-BEARING HERE. `RoleGate` renders `null` until its
     * effect resolves; if the mock above ever stops matching, this paints an empty string and
     * "no missing link was found" would be indistinguishable from "the screen never rendered".
     * Anchor on copy only the real screen produces.
     */
    expect(html, 'the checkout screen did not render — this gate is blind, not clean')
      .toContain('Radlic for your family')

    expect(hrefs(html), 'the checkout screen has lost its Privacy Policy link. A parent is being ' +
      'asked for money on this screen; the policy covering what is collected about their child ' +
      'must be readable from it, not only the Terms.').toContain('/legal/privacy')
    // The Terms link is what the Privacy link was added beside — if it goes, this gate should say so.
    expect(hrefs(html)).toContain('/legal/terms')
  })

  it('the add-a-child screen renders a Privacy Policy link at the point of collection', async () => {
    const React = await import('react')
    const { AddLearnerModal } = await import('@/app/parent/page')
    const html = await paint(React.createElement(AddLearnerModal, { onClose: () => {}, onAdded: () => {} }))

    expect(html, 'the add-a-child sheet did not render — this gate is blind, not clean')
      .toContain('Child')

    expect(hrefs(html), 'the add-a-child sheet has lost its Privacy Policy link. This screen ' +
      'collects a child\'s name, avatar and grade; until 2026-09-22 it carried no links at all, ' +
      'which is the defect this gate exists for.').toContain('/legal/privacy')
  })
})
