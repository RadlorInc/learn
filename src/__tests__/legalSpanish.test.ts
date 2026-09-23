/**
 * A SPANISH LEGAL TEXT CANNOT GO LIVE UNTIL A NAMED PERSON HAS REVIEWED IT.
 *
 * The seven Spanish drafts in `docs/legal/es/` are machine-prepared and unreviewed. The registry reads
 * them as each page's Spanish version, and `publishRefusals` must keep refusing for Spanish until the
 * draft's own `REVIEWED-BY:` line names a reviewer AND a date. The line lives in the file, so the person
 * who signs is signing the words in front of them.
 *
 * ⚠️ The guard is driven on a page that is ready in EVERY other way (signed off, final, no placeholder,
 * billing and deletion true), so the one refusal left can only come from the Spanish rule — and then the
 * same text with the line filled in (in this test only) must go through. A rule that refused every
 * Spanish text would fail the second half; one that accepted any file would fail the first.
 *
 * ⚠️ The expected file list is WRITTEN OUT here, not read from the registry it checks.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { LEGAL_PAGES, publicBody, publishRefusals, MARKER, type LegalPage } from '@/app/legal/registry'

const DIR = resolve(__dirname, '../../docs/legal')
const read = (f: string) => readFileSync(resolve(DIR, f), 'utf8')
const holes = (s: string) => s.split(MARKER).length - 1
const sign = (es: string, line: string) => es.replace(/^REVIEWED-BY:.*$/m, line)

const SPANISH: Record<string, string> = {
  privacy: 'es/11-privacy-policy.md',
  terms: 'es/12-terms-of-service.md',
  refunds: 'es/01-refund-and-cancellation-policy.md',
  'parent-rights': 'es/06-parent-rights-procedure.md',
  subprocessors: 'es/07-subprocessors.md',
  cookies: 'es/08-cookie-and-tracking-notice.md',
  retention: 'es/04-data-retention-policy.md',
}

const READY: LegalPage = {
  slug: 'x', title: 'X', source: 'x.md', until: '### Notes', published: true,
  signoff: { by: 'Counsel', date: '2026-10-01' }, spanish: { source: 'es/11-privacy-policy.md' },
}
const CLEAN_MD = '# Doc\n\n> **STATUS: FINAL**\n\n---\n\n## 1. Body\n\nA finished sentence.\n'
const FACTS = { billing: true, deletion: true }

describe('every legal page has a Spanish draft, wired in and marked unreviewed', () => {
  it('the registry reads each page\'s Spanish from docs/legal/es/', () => {
    expect(Object.fromEntries(LEGAL_PAGES.map(p => [p.slug, p.spanish?.source ?? null]))).toEqual(SPANISH)
  })

  it.each(Object.entries(SPANISH))('%s: %s says it is an unreviewed draft, and its REVIEWED-BY line is empty', (_slug, file) => {
    expect(existsSync(resolve(DIR, file)), `${file} is missing`).toBe(true)
    const es = read(file)
    const header = es.slice(0, es.indexOf('\n---\n'))
    expect(header).toMatch(/NO REVISADO/)
    expect(header).toMatch(/NOT REVIEWED/)
    expect(header).toMatch(/NOT IN FORCE/)
    expect(header).toMatch(/STATUS: DRAFT/)
    expect(es.match(/^REVIEWED-BY:.*$/gm), `${file} must carry exactly one REVIEWED-BY line`).toEqual(['REVIEWED-BY:'])
  })

  it.each(Object.entries(SPANISH))('%s: the Spanish keeps every placeholder of the English public text', (slug, file) => {
    const page = LEGAL_PAGES.find(p => p.slug === slug)!
    const en = holes(publicBody(page, read(page.source)))
    expect(en, `positive control: the English public text of ${slug} was expected to carry placeholders`).toBeGreaterThan(0)
    expect(holes(read(file)), `${file} dropped or added a placeholder`).toBe(en)
  })
})

describe('an unreviewed Spanish text is refused; a named, dated review lets it through', () => {
  const draft = read('es/11-privacy-policy.md')
  const spanishOnly = (es: string) => publishRefusals(READY, CLEAN_MD, es, FACTS)

  it('refuses the real, unreviewed draft on a page that is otherwise ready — for Spanish and nothing else', () => {
    const why = spanishOnly(draft)
    expect(why).toHaveLength(1)
    expect(why[0]).toMatch(/^spanish: .*not been reviewed/)
  })

  it('lets the same text through once REVIEWED-BY names a person and a date', () => {
    expect(spanishOnly(sign(draft, 'REVIEWED-BY: Ana Ruiz, 2026-09-24'))).toEqual([])
  })

  it.each([
    ['a name with no date', 'REVIEWED-BY: Ana Ruiz'],
    ['a date with no name', 'REVIEWED-BY: 2026-09-24'],
    ['a date with only punctuation for a name', 'REVIEWED-BY: -, 2026-09-24'],
    ['a malformed date', 'REVIEWED-BY: Ana Ruiz, 24/09/2026'],
  ])('still refuses %s', (_n, line) => {
    expect(spanishOnly(sign(draft, line))).toEqual([expect.stringMatching(/^spanish: .*not been reviewed/)])
  })

  it('only counts a REVIEWED-BY line in the header, not one that appears in the body', () => {
    const planted = draft + '\nREVIEWED-BY: Ana Ruiz, 2026-09-24\n'
    expect(spanishOnly(planted)).toEqual([expect.stringMatching(/^spanish: /)])
  })

  it.each(LEGAL_PAGES.map(p => [p.slug, p] as const))('%s: its real draft is refused for Spanish today, and only a filled line lifts that', (_s, p) => {
    const es = read(p.spanish!.source)
    expect(publishRefusals(p, read(p.source), es).filter(w => w.startsWith('spanish:'))).toHaveLength(1)
    const signed = publishRefusals(p, read(p.source), sign(es, 'REVIEWED-BY: Ana Ruiz, 2026-09-24'))
    expect(signed.filter(w => w.startsWith('spanish:'))).toEqual([])
    expect(signed.length, 'signing the Spanish must not clear the page\'s other refusals').toBeGreaterThan(0)
  })
})
