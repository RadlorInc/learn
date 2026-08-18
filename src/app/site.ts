/**
 * The canonical public origin, in ONE place — `robots.ts`, `sitemap.ts` and the root layout's
 * `metadataBase` all read it, so a domain move is one edit rather than three that drift.
 *
 * `VERCEL_PROJECT_PRODUCTION_URL` is set by Vercel to the project's stable production host (never
 * the per-deploy preview URL), so preview builds do not advertise themselves as canonical.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://radlor.com')
// ⚠️ ORDER MATTERS AND IT IS DELIBERATE. Once radlor.com is assigned as the project's PRODUCTION
// domain in Vercel, `VERCEL_PROJECT_PRODUCTION_URL` becomes radlor.com on its own and this is
// self-correcting. Until that DNS is live it still resolves to the vercel.app host, so set
// NEXT_PUBLIC_SITE_URL=https://radlor.com explicitly to close the gap — otherwise sitemap, robots
// and every og:image advertise the old origin while the site answers on the new one.

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
 * The only routes that may be crawled. Everything else is a signed-in surface: it renders nothing
 * useful to a crawler, and `/parent` and `/insights` are other people's children.
 *
 * ⚠️ This is NOT the access control — RLS is. It stops a bot spending crawl budget on an app shell
 * and stops those URLs appearing in results; it protects nothing on its own.
 */
export const PUBLIC_ROUTES = ['/', '/diagnostic', '/help', '/legal/privacy', '/legal/terms'] as const

/** Signed-in surfaces, kept out of results. `/api/` is here because an endpoint in an index is
 *  noise for everyone. */
export const PRIVATE_ROUTES = [
  '/api/', '/parent', '/insights', '/profile', '/shop', '/menu', '/game', '/story',
  '/name-entry', '/auth', '/teen-preview', '/sim-preview',
] as const
