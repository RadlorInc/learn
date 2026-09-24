/**
 * The canonical public origin, in ONE place — `robots.ts`, `sitemap.ts`, the root layout's `metadataBase`, every
 * link in an email and the old-domain redirect all read it, so a domain move is one edit rather than many that drift.
 *
 * `VERCEL_PROJECT_PRODUCTION_URL` is set by Vercel to the project's stable production host (never
 * the per-deploy preview URL), so preview builds do not advertise themselves as canonical.
 *
 * ⚠️ ORDER MATTERS AND IT IS DELIBERATE: `NEXT_PUBLIC_SITE_URL` first. It is set in Vercel Production, and it is THE
 * SWITCH for the move to radlic.com (2026-09-24): while it names the old domain, the old domain serves the app exactly
 * as before and nothing redirects; set it to https://radlic.com and redeploy, and canonical URLs, email links and the
 * old-domain 308 all move together. See docs/RENAME-MANUAL.md §A.5.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://radlic.com')

/**
 * The app's own origin (app.radlic.com) — radlic.com keeps the landing, /help and /legal. Unset = the same as
 * `SITE_URL`, and then there is no split at all (`hostSplit.ts`). Set `NEXT_PUBLIC_APP_URL` only after
 * docs/APP-SUBDOMAIN.md steps 1–4.
 */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? SITE_URL

/** The product's domain until 2026-09-24. It keeps working, as a permanent redirect to `SITE_URL`. */
export const OLD_HOST = 'adaptivelearn.radlor.com'

/**
 * The old domain's redirect, for `next.config.ts`. A 308 keeps the method, Next keeps the path and the query, and the
 * browser keeps the `#fragment` (RFC 9110 §10.2.2: a Location with no fragment inherits the request's) — which is what
 * keeps a consent link's `#t=` token working from an email sent before the move.
 *
 * ⚠️ OFF while `SITE_URL` still names the old domain, so merging this changes nothing until the new domain is live.
 * ⚠️ `/api/*` is NOT redirected: the callers are machines holding the old URL — Stripe's webhook, a mail client's
 * one-click unsubscribe POST, the daily cron — and a POST that meets a redirect is dropped by most of them. The same
 * deployment answers the API on both hosts.
 */
export function oldDomainRedirects(siteUrl: string = SITE_URL) {
  if (new URL(siteUrl).host === OLD_HOST) return []
  return [{
    source: '/:path((?!api(?:/|$)).*)',
    has: [{ type: 'host' as const, value: OLD_HOST }],
    destination: `${siteUrl.replace(/\/$/, '')}/:path`,
    permanent: true,
  }]
}

/**
 * The address a parent writes to, in ONE place for the same reason `SITE_URL` is.
 *
 * ⚠️ It lived as a literal in FOUR files (here it was only in `infra/diagnostics.ts`, with
 * `page.tsx`, `help/page.tsx` and `legal/[slug]/page.tsx` each repeating the string). Dropping the
 * mi2utor domain meant editing four places and hoping none was missed — which is precisely the
 * drift this module was created to stop. It lives HERE rather than in `diagnostics.ts` because that
 * file is `'use client'` and three of the four consumers are Server Components.
 */
export const SUPPORT_EMAIL = 'support@radlor.com'

/**
 * The company, and the ONE `@id` both properties use for it.
 *
 * ⚠️ THIS IS THE WHOLE POINT AND IT IS EASY TO BREAK BY RETYPING A URL. radlor.com's own JSON-LD
 * declares the Organization at `https://radlor.com/#organization`; this app REFERENCES that same id
 * rather than declaring a second Organization of its own. Two declarations would be two entities
 * with the same name, which is exactly the problem the product's first rename (2026-08) existed to fix —
 * one product, one company, one node, described from two sites.
 *
 * ⚠️ "AdaptiveLearn", the product's name until 2026-09-24, was a GENERIC phrase in a crowded category (measured 2026-08-19: the search
 * returns "adaptive learning" the concept, plus AdaptedMind / bettermarks / DreamBox / Prodigy).
 * "Radlor" is distinctive and effectively unclaimed. So the distinctive token has to do the entity
 * work: the app names Radlor as its publisher in schema AND links to it visibly in the footer.
 * Do not remove either — a generic product name with no brand attached resolves to the category.
 */
export const COMPANY = 'Radlor'
export const COMPANY_URL = 'https://radlor.com'
export const COMPANY_ID = `${COMPANY_URL}/#organization`
export const APP_NAME = 'Radlic'
/** The app's own entity id. radlor.com's product page references this exact string — change both together
 *  (RENAME-MANUAL.md §D: radlor.com still names the pre-rename id until it is updated). */
export const APP_ID = 'https://radlic.com/#app'

/**
 * The only routes that may be crawled. Everything else is a signed-in surface: it renders nothing
 * useful to a crawler, and `/parent` and `/admin` are other people's children.
 *
 * ⚠️ This is NOT the access control — RLS is. It stops a bot spending crawl budget on an app shell
 * and stops those URLs appearing in results; it protects nothing on its own.
 */
export const PUBLIC_ROUTES = ['/', '/help'] as const
// ⚠️ The legal pages join these only once PUBLISHED (`PUBLISHED_LEGAL_ROUTES` in app/legal/registry.ts):
// a dark page is noindex and must not be advertised by the sitemap or llms.txt.

/** Signed-in surfaces, kept out of results. `/api/` is here because an endpoint in an index is
 *  noise for everyone. */
export const PRIVATE_ROUTES = [
  '/api/', '/parent', '/admin', '/play', '/shop', '/menu', '/game', '/story',
  '/auth', '/practice', '/lesson', '/modules',
  '/consent',   // token-bearing pages reached from a consent email; also noindex in their layout
] as const
