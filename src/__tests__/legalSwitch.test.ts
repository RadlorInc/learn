/**
 * THE PUBLISH SWITCH REFUSES — EACH REASON ON ITS OWN, AND NAMED.
 *
 * ⚠️ Six attempts, each on a page that is fine in every way but ONE, so a refusal can only have come
 * from the rule under test — a switch that refused everything would pass a test that only fed it
 * bad pages. A seventh, fine in every way, must be allowed; that is the control that the rules are
 * about their reasons and not about publishing.
 *
 * And the switch is wired: flipping a real page's `published` makes the page component throw at
 * build time with that page's own reasons.
 */
import { describe, it, expect, vi } from 'vitest'
import { publishRefusals, LEGAL_PAGES, type LegalPage } from '@/app/legal/registry'

const CLEAN_MD = '# Doc\n\n> **STATUS: FINAL**\n\n---\n\n## 1. Body\n\nA finished sentence.\n'
const OK: LegalPage = {
  slug: 'x', title: 'X', source: 'x.md', until: '### Notes', published: true,
  signoff: { by: 'Counsel', date: '2026-10-01' }, spanish: { source: 'es/x.md' },
}
/** A Spanish text a reader has signed, and the same text unsigned (the line lives in the file — `legalSpanish.test.ts`). */
const ES_OK = 'REVIEWED-BY: Revisora, 2026-10-01\n\n---\n\nTexto'
const ES_UNREVIEWED = 'REVIEWED-BY:\n\n---\n\nTexto'
const FACTS = { billing: true, deletion: true }

describe('the switch refuses, one reason at a time', () => {
  it('lets a page that is ready through — the control', () => {
    expect(publishRefusals(OK, CLEAN_MD, ES_OK, FACTS)).toEqual([])
  })

  const cases: [string, LegalPage, string, string | null, typeof FACTS, RegExp][] = [
    ['a placeholder', OK, CLEAN_MD + '\n[' + 'PLACEHOLDER — date]\n', ES_OK, FACTS, /^placeholders: /],
    ['a DRAFT banner', OK, CLEAN_MD.replace('STATUS: FINAL', 'STATUS: DRAFT — NOT LEGAL ADVICE'), ES_OK, FACTS, /^draft: /],
    ['no attorney sign-off', { ...OK, signoff: null }, CLEAN_MD, ES_OK, FACTS, /^sign-off: /],
    ['Spanish unreviewed', OK, CLEAN_MD, ES_UNREVIEWED, FACTS, /^spanish: .*not been reviewed/],
    ['parent-rights before deletion', { ...OK, needs: 'deletion' }, CLEAN_MD, ES_OK, { ...FACTS, deletion: false }, /^deletion: /],
    ['refunds before billing', { ...OK, needs: 'billing' }, CLEAN_MD, ES_OK, { ...FACTS, billing: false }, /^billing: /],
  ]
  it.each(cases)('refuses %s, and names only that', (_n, page, md, es, facts, reason) => {
    const why = publishRefusals(page, md, es, facts)
    expect(why).toHaveLength(1)
    expect(why[0]).toMatch(reason)
  })

  it('refuses a missing Spanish version as well as an unreviewed one', () => {
    expect(publishRefusals({ ...OK, spanish: null }, CLEAN_MD, null, FACTS)).toEqual(['spanish: there is no Spanish version'])
  })
})

/**
 * THE PRIVATE BETA (founder, 2026-09-24): a `beta` record stands in for the attorney's sign-off and for the Spanish
 * review — and for NOTHING else. Each case is a beta page wrong in exactly one way.
 */
describe('a beta page: published on the founder\'s decisions, and still refused for everything else', () => {
  const BETA_PAGE: LegalPage = { ...OK, signoff: null, beta: { decidedBy: 'Founder', decided: '2026-09-24', effective: '25 September 2026' } }
  it('control: no attorney sign-off and an UNREVIEWED Spanish draft — allowed, because it is a beta page', () => {
    expect(publishRefusals(BETA_PAGE, CLEAN_MD, ES_UNREVIEWED, FACTS)).toEqual([])
    expect(publishRefusals({ ...BETA_PAGE, beta: undefined }, CLEAN_MD, ES_UNREVIEWED, FACTS).map(w => w.split(':')[0]),
      'control: the same page without the beta record is refused for both').toEqual(['sign-off', 'spanish'])
  })
  it.each([
    ['a PLANTED placeholder', BETA_PAGE, CLEAN_MD + '\n[' + 'PLACEHOLDER — a floor amount]\n', FACTS, /^placeholders: /],
    ['a DRAFT banner', BETA_PAGE, CLEAN_MD.replace('STATUS: FINAL', 'STATUS: DRAFT — NOT LEGAL ADVICE'), FACTS, /^draft: /],
    ['parent-rights before deletion', { ...BETA_PAGE, needs: 'deletion' as const }, CLEAN_MD, { ...FACTS, deletion: false }, /^deletion: /],
    ['refunds before billing', { ...BETA_PAGE, needs: 'billing' as const }, CLEAN_MD, { ...FACTS, billing: false }, /^billing: /],
  ] as const)('refuses %s, and names only that', (_n, page, md, facts, reason) => {
    const why = publishRefusals(page, md, ES_UNREVIEWED, facts)
    expect(why).toHaveLength(1)
    expect(why[0]).toMatch(reason)
  })
})

describe('every real page: the five beta pages publish; terms and refunds are refused, and say why', () => {
  const BETA = ['privacy', 'parent-rights', 'subprocessors', 'cookies', 'retention']
  it.each(LEGAL_PAGES.map(p => [p.slug, p] as const))('%s', async (slug, p) => {
    const { readDoc } = await import('@/app/legal/source')
    const why = publishRefusals(p, readDoc(p.source), p.spanish ? readDoc(p.spanish.source) : null)
    if (BETA.includes(slug)) { expect(why, `${slug} is a beta page and is refused`).toEqual([]); return }
    // Terms: every founder decision made but two (§11 floor, §14 contact) — so placeholders, and only placeholders.
    if (slug === 'terms') { expect(why.map(w => w.split(':')[0])).toEqual(['placeholders']); return }
    for (const r of ['placeholders', 'draft', 'sign-off', 'spanish'])
      expect(why.some(w => w.startsWith(r + ':')), `${slug} is not refused for ${r}`).toBe(true)
    if (p.needs) expect(why.some(w => w.startsWith(p.needs + ':'))).toBe(true)
  })

  it('flipping a real page on stops the build, naming its reasons', async () => {
    vi.resetModules()
    vi.doMock('@/app/legal/registry', async orig => {
      const m = await orig<typeof import('@/app/legal/registry')>()
      return { ...m, pageBySlug: (s: string) => ({ ...m.pageBySlug(s)!, published: true }) }
    })
    const { default: View } = await import('@/app/legal/[slug]/page')
    await expect(View({ params: Promise.resolve({ slug: 'refunds' }) }))
      .rejects.toThrow(/\/legal\/refunds is switched on but must not be published:[\s\S]*billing: /)
    vi.doUnmock('@/app/legal/registry')
  })
})

describe('the published view renders the real documents — so flipping the switch needs nothing built', () => {
  it.each(LEGAL_PAGES.map(p => [p.slug] as const))('%s: tables, headings and emphasis come out as HTML, not markdown', async slug => {
    vi.resetModules()
    // Everything the switch would refuse today is stubbed OUT here — this drives the renderer only.
    vi.doMock('@/app/legal/registry', async orig => {
      const m = await orig<typeof import('@/app/legal/registry')>()
      return { ...m, publishRefusals: () => [], assertRenderable: () => {}, pageBySlug: (s: string) => ({ ...m.pageBySlug(s)!, published: true }) }
    })
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { default: View } = await import('@/app/legal/[slug]/page')
    const html = renderToStaticMarkup(await View({ params: Promise.resolve({ slug }) }))
    vi.doUnmock('@/app/legal/registry')
    expect(html).toContain('data-legal="published"')
    expect(html).not.toContain('DRAFT — NOT IN FORCE')
    const text = html.replace(/<[^>]*>/g, '\n')
    expect(text.length, 'the published view rendered almost nothing').toBeGreaterThan(1500)
    expect(text, 'markdown bold leaked through as asterisks').not.toMatch(/\*\*\S/)
    expect(text.split('\n').filter(l => /^\s*\|.*\|\s*$/.test(l)), 'a markdown table leaked through as pipes').toEqual([])
    expect(html).toMatch(/<h2/)
    const { readDoc } = await import('@/app/legal/source')
    const { pageBySlug, publicBody } = await import('@/app/legal/registry')
    if (/^\|/m.test(publicBody(pageBySlug(slug)!, readDoc(pageBySlug(slug)!.source)))) expect(html).toContain('<table')
  })
})
