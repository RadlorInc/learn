/**
 * radlic.com (landing) ↔ app.radlic.com (app). Written out by hand: the hosts, the routes, the paths — never read
 * from site.ts's constants. The browser half (a real redirect, a #fragment surviving it) is a live check after the
 * switch: docs/APP-SUBDOMAIN.md step 6.
 */
import { describe, it, expect } from 'vitest'
import { appRoutes, hostSplitRedirects } from '@/app/hostSplit'

const SITE = 'https://radlic.com', APP = 'https://app.radlic.com'

/** How Next matches a `/:path(<re>)` source: the group's regex over the whole pathname after the slash. */
function matches(source: string, pathname: string) {
  const m = source.match(/^\/:path\((.*)\)$/)
  expect(m, `unexpected source shape: ${source}`).toBeTruthy()
  return new RegExp(`^/${m![1]}$`).test(pathname)
}

describe('the radlic.com / app.radlic.com split', () => {
  it('is OFF while the app has no host of its own — merging changes nothing until NEXT_PUBLIC_APP_URL is set', () => {
    expect(hostSplitRedirects(['parent'], SITE, SITE)).toEqual([])
    expect(hostSplitRedirects(['parent'], SITE, `${SITE}/`)).toEqual([])
  })

  it('reads the app routes from src/app: the app is there, the front door is not', () => {
    const r = appRoutes()
    for (const p of ['auth', 'parent', 'modules', 'lesson', 'consent', 'email', 'admin', 'play']) expect(r).toContain(p)
    for (const p of ['help', 'legal', 'api', 'llms.txt']) expect(r).not.toContain(p)
  })

  it('on radlic.com, sends every app path to the same path on app.radlic.com, permanently', () => {
    const [r] = hostSplitRedirects(appRoutes(), SITE, APP)
    expect(r.has).toEqual([{ type: 'host', value: 'radlic.com' }])
    expect(r.destination).toBe('https://app.radlic.com/:path')
    expect(r.destination).not.toContain('#')   // a Location with its own fragment would drop a consent link's #t=
    expect(r.permanent).toBe(true)
    for (const p of ['/auth', '/auth/callback', '/parent', '/parent/account', '/lesson', '/modules', '/consent/respond', '/consent/withdraw', '/email/unsubscribe', '/admin/login'])
      expect(matches(r.source, p), `${p} would stay on radlic.com`).toBe(true)
    for (const p of ['/', '/help', '/legal/privacy', '/api/stripe/webhook', '/api/email/unsubscribe', '/llms.txt', '/robots.txt', '/sitemap.xml', '/sw.js', '/assets/x.webp', '/authors', '/parenting'])
      expect(matches(r.source, p), `${p} would leave radlic.com`).toBe(false)
  })

  it('on app.radlic.com, / goes to sign-in (not permanent: the app may get a home of its own)', () => {
    const [, r] = hostSplitRedirects(appRoutes(), SITE, APP)
    expect(r).toEqual({ source: '/', has: [{ type: 'host', value: 'app.radlic.com' }], destination: 'https://app.radlic.com/auth', permanent: false })
  })
})
