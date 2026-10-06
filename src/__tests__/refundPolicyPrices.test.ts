import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { LADDER } from '@/core/billing'

/**
 * The Refund and Cancellation Policy states the prices a parent agrees to; Stripe bills from `LADDER`. They must never
 * disagree (PLACEHOLDERS.md, resolved 2026-10-01). The prices are written out by hand here, and BOTH sides are checked
 * against them, so a change to either one alone fails.
 */
const CENTS = { monthly: { first: 799, extra: 499 }, annual: { first: 7599, extra: 4800 } }
const TEXT = {
  en: { monthly: '$7.99 for the first child, $4.99 for each additional child', annual: '$75.99 for the first child, $48.00 for each additional child' },
  es: { monthly: '$7.99 por el primer hijo, $4.99 por cada hijo adicional', annual: '$75.99 por el primer hijo, $48.00 por cada hijo adicional' },
}
const read = (f: string) => readFileSync(f, 'utf8')

describe('the refund policy states the prices Stripe charges', () => {
  it('LADDER is the hand-written price', () => {
    expect({ first: LADDER.monthly.first, extra: LADDER.monthly.extra }).toEqual(CENTS.monthly)
    expect({ first: LADDER.annual.first, extra: LADDER.annual.extra }).toEqual(CENTS.annual)
  })

  it('the English policy states them', () => {
    const doc = read('docs/legal/01-refund-and-cancellation-policy.md')
    expect(doc).toContain(TEXT.en.monthly)
    expect(doc).toContain(TEXT.en.annual)
  })

  it('the Spanish draft states them', () => {
    const doc = read('docs/legal/es/01-refund-and-cancellation-policy.md')
    expect(doc).toContain(TEXT.es.monthly)
    expect(doc).toContain(TEXT.es.annual)
  })
})
