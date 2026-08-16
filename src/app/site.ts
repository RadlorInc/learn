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
    : 'https://milo-story-mode.vercel.app')

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
