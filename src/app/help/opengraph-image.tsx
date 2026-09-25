/**
 * The same 1200×630 card as the root. Needed because `/help` declares its own `openGraph` (SEO-05), and a segment
 * that sets `openGraph` without `images` loses the root's file-based image — measured in the built HTML: og:image
 * and twitter:image both disappeared from /help until this file existed.
 */
export { default, size, contentType, alt } from '../opengraph-image'
