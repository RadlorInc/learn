/**
 * WITHDRAWAL DELETES ONE CHILD — AND EVERY PUBLIC DOCUMENT MUST SAY SO (Round 1, R8).
 *
 * The build (`consent_withdraw` → `delete_child_data`, proven in consentDeletion.test.ts and on production in D5)
 * deletes only the child the consent covers; the account and other children stay. The withdrawal screen and B3 have
 * said so since notice-v3 — but the Parent Rights page (doc 06 Part A) and the Terms (doc 12 §4) still promised that
 * withdrawal "closes the whole account". Two public texts contradicting the product on the one right a parent uses
 * when something has gone wrong.
 *
 * Reads the PUBLIC part of each page exactly as the registry would render it (`readPublic`), not the whole file:
 * the attorney notes below each document legitimately discuss the old rule.
 */
import { describe, it, expect } from 'vitest'
import { pageBySlug } from '@/app/legal/registry'
import { readPublic } from '@/app/legal/source'
import { WITHDRAW, B3 } from '@/features/consent/copy'

const pub = (slug: string) => readPublic(pageBySlug(slug)!)

describe('withdrawal scope — the public documents match the product', () => {
  it('reads the public parts at all (control)', () => {
    expect(pub('parent-rights')).toContain('Withdraw your permission')
    expect(pub('terms')).toContain('If you withdraw consent')
  })

  it('the product itself says: this child only, the account stays open', () => {
    expect(WITHDRAW.body.map(b => b.en).join(' ')).toContain('This applies only to this child.')
    expect(B3.ifNot.en).toContain('Your account stays open.')
  })

  it.each(['parent-rights', 'terms'])('/legal/%s never says withdrawal closes the whole account', slug => {
    const text = pub(slug)
    expect(text).not.toMatch(/closes the whole account/i)
    expect(text).not.toMatch(/Remove this child/)
    expect(text).toMatch(/only to that child/)
    expect(text).toMatch(/account stays open/)
  })

  it.each(['parent-rights', 'terms'])('/legal/%s promises no subscription cancellation or refund on withdrawal (none is built)', slug => {
    expect(pub(slug)).not.toMatch(/subscription is cancelled and we refund/i)
  })
})
