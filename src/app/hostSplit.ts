/**
 * radlic.com is the front door (landing, help, legal); app.radlic.com is the app. ONE deployment answers both hosts,
 * and these redirects keep each host to its own half. Node-only (reads the filesystem): imported by `next.config.ts`.
 *
 * ⚠️ OFF while `APP_URL` equals `SITE_URL` — i.e. until `NEXT_PUBLIC_APP_URL` is set in Vercel — so merging changes
 * nothing. The founder's steps are in docs/APP-SUBDOMAIN.md, and they must be done BEFORE that variable is set.
 *
 * Why redirects rather than rewriting every link: an app page on radlic.com (a relative `/auth` link, a consent email's
 * `/consent/respond#t=…`, Stripe's `success_url`, an old-domain 308) simply moves on to the same path on the app host.
 * A 308 keeps the method and the browser keeps the `#fragment`, so no link anywhere has to know about the split.
 */
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

/** Top-level folders of src/app that stay on radlic.com. `api` too: webhooks, one-click unsubscribe POSTs and the
 *  cron hold fixed URLs, and a POST that meets a redirect is dropped — both hosts answer the API. */
export const SITE_ONLY = ['help', 'legal', 'api', 'llms.txt'] as const

/** Every other top-level route folder is the app. Read from the tree so a new route cannot be forgotten. */
export function appRoutes(appDir = join(process.cwd(), 'src/app')): string[] {
  return readdirSync(appDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && !(SITE_ONLY as readonly string[]).includes(e.name) && !/^[_(@[]/.test(e.name))
    .map(e => e.name)
    .sort()
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function hostSplitRedirects(routes: string[], siteUrl: string, appUrl: string) {
  const site = new URL(siteUrl).hostname, app = new URL(appUrl).hostname
  if (site === app || !routes.length) return []
  const appOrigin = appUrl.replace(/\/$/, '')
  return [
    {
      // radlic.com/parent/... → app.radlic.com/parent/...
      source: `/:path((?:${routes.map(esc).join('|')})(?:/.*)?)`,
      has: [{ type: 'host' as const, value: site }],
      destination: `${appOrigin}/:path`,
      permanent: true,
    },
    {
      // app.radlic.com/ has no landing page of its own: straight to sign-in (which sends a signed-in user home).
      source: '/',
      has: [{ type: 'host' as const, value: app }],
      destination: `${appOrigin}/auth`,
      permanent: false,
    },
  ]
}
