import type { MetadataRoute } from 'next'
import { SITE_URL, PUBLIC_ROUTES } from './site'

/** /sitemap.xml — the five routes that have something to say to someone who is not signed in. */
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map(path => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: 'monthly' as const,
    priority: path === '/' ? 1 : path === '/diagnostic' ? 0.9 : 0.5,
  }))
}
