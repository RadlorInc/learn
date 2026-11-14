/**
 * The old domains (adaptivelearn.radlor.com until 2026-09-24, radlic.com until 2026-11-14) → the current origin. This is the half CI runs; the browser half — the one that
 * watches a #fragment survive — is e2e/old-domain-redirect.spec.ts, run against a local app (no CI job runs e2e).
 *
 * Written out by hand: the old host, the new origin, the paths. Never read from site.ts's own constants.
 */
import { describe, it, expect } from 'vitest'
import { oldDomainRedirects } from '@/app/site'

/** How Next matches a `/:path(<re>)` source — the named group's regex over the whole pathname after the slash. */
function matches(source: string, pathname: string) {
  const m = source.match(/^\/:path\((.*)\)$/)
  expect(m, `unexpected source shape: ${source}`).toBeTruthy()
  return new RegExp(`^/${m![1]}$`).test(pathname)
}

describe('the old-domain redirect', () => {
  it('never redirects the host SITE_URL names — so merging changes nothing for radlic.com until the switch', () => {
    const hosts = (u: string) => oldDomainRedirects(u).map(r => r.has[0].value)
    expect(hosts('https://radlic.com')).toEqual(['adaptivelearn.radlor.com', 'www.radlic.com'])
    expect(hosts('https://adaptivelearn.radlor.com')).toEqual(['radlic.com', 'www.radlic.com'])
  })

  it('is ON once SITE_URL is app.radlor.com: permanent, only for the old HOST, to the same path on the new origin', () => {
    const rules = oldDomainRedirects('https://app.radlor.com')
    expect(rules.map(r => r.has)).toEqual([[{ type: 'host', value: 'adaptivelearn.radlor.com' }],
      [{ type: 'host', value: 'radlic.com' }], [{ type: 'host', value: 'www.radlic.com' }]])
    for (const r of rules) {
      expect(r.permanent).toBe(true)                 // 308: keeps the method and tells caches it moved for good
      expect(r.destination).toBe('https://app.radlor.com/:path')
      // ⚠️ No fragment of its own: a Location WITH one would replace the email's #t= token (RFC 9110 §10.2.2).
      expect(r.destination).not.toContain('#')
    }
    // A trailing slash on SITE_URL must not become '//'.
    expect(oldDomainRedirects('https://app.radlor.com/')[0].destination).toBe('https://app.radlor.com/:path')
  })

  it('covers every page, and NOT /api/* (webhooks, one-click unsubscribe POSTs and the cron hold the old URL)', () => {
    const { source } = oldDomainRedirects('https://app.radlor.com')[0]
    for (const p of ['/', '/consent/respond', '/consent/withdraw', '/email/unsubscribe', '/legal/privacy', '/parent', '/apiary', '/help/api'])
      expect(matches(source, p), `${p} would not redirect`).toBe(true)
    for (const p of ['/api', '/api/', '/api/stripe/webhook', '/api/email/unsubscribe', '/api/consent/cancel-second-notice'])
      expect(matches(source, p), `${p} would redirect`).toBe(false)
  })
})
