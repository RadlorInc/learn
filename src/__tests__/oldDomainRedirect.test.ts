/**
 * The old domain (adaptivelearn.radlor.com) → radlic.com. This is the half CI runs; the browser half — the one that
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
  it('is OFF while SITE_URL still names the old domain — merging it changes nothing until the switch', () => {
    expect(oldDomainRedirects('https://adaptivelearn.radlor.com')).toEqual([])
  })

  it('is ON once SITE_URL is radlic.com: permanent, only for the old HOST, to the same path on the new origin', () => {
    const rules = oldDomainRedirects('https://radlic.com')
    expect(rules).toHaveLength(1)
    const [r] = rules
    expect(r.permanent).toBe(true)                 // 308: keeps the method and tells caches it moved for good
    expect(r.has).toEqual([{ type: 'host', value: 'adaptivelearn.radlor.com' }])
    expect(r.destination).toBe('https://radlic.com/:path')
    // ⚠️ No fragment of its own: a Location WITH one would replace the email's #t= token (RFC 9110 §10.2.2).
    expect(r.destination).not.toContain('#')
    // A trailing slash on SITE_URL must not become '//'.
    expect(oldDomainRedirects('https://radlic.com/')[0].destination).toBe('https://radlic.com/:path')
  })

  it('covers every page, and NOT /api/* (webhooks, one-click unsubscribe POSTs and the cron hold the old URL)', () => {
    const { source } = oldDomainRedirects('https://radlic.com')[0]
    for (const p of ['/', '/consent/respond', '/consent/withdraw', '/email/unsubscribe', '/legal/privacy', '/parent', '/apiary', '/help/api'])
      expect(matches(source, p), `${p} would not redirect`).toBe(true)
    for (const p of ['/api', '/api/', '/api/stripe/webhook', '/api/email/unsubscribe', '/api/consent/cancel-second-notice'])
      expect(matches(source, p), `${p} would redirect`).toBe(false)
  })
})
