import type { MetadataRoute } from 'next'
import { SITE_URL, PRIVATE_ROUTES } from './site'

/**
 * /robots.txt — it 404'd until now, which is not neutral: with no robots and no sitemap a crawler
 * has no entry point and no idea which of ~22 routes are worth its budget.
 *
 * Next's file convention, so it is generated at build and served statically. No dependency.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: [...PRIVATE_ROUTES] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
