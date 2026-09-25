/**
 * SEO-04 / SEO-05 (docs/review/SEO.md): what a crawler and a link-preview scraper are told about `/`, `/help`, `/demo`.
 *
 * ⚠️ THE ASSERTIONS ARE ON THE RESOLVED METADATA, NOT ON ANY ONE FILE'S EXPORT. Each route's metadata is run through
 * Next's OWN `accumulateMetadata` — the function the build uses to merge segments into the `<head>` — with the real
 * root layout, the real segment exports, and `metadataBase` from the root. The defect lived in the MERGE (a page that
 * declares no `openGraph` inherits the root's whole object, og:url included), so a check on `help/page.tsx`'s export
 * alone could not have seen it. The segment list mirrors Next's loader tree: one item per layout (null when a segment
 * has none) then the page — which is also what makes the root title template reach `/help` ("Help · Radlic", the
 * value `next build` emits, measured 2026-09-26).
 *
 * ⚠️ NOT COVERED HERE: the og:image. It comes from `opengraph-image.tsx` files, which the build turns into static
 * metadata; it was checked in the built HTML instead (see the PR — /help lost its og:image when it declared its own
 * `openGraph`, which is why `help/opengraph-image.tsx` exists).
 *
 * Expected strings are written out by hand, on purpose (CLAUDE.md: a check must not import the value it asserts).
 */
import { describe, expect, it, vi } from 'vitest'
import type { Metadata } from 'next'

// The root layout calls next/font/google at module scope, which cannot run under vitest. Fonts are not metadata.
vi.mock('next/font/google', () => {
  const font = () => ({ variable: '', className: '', style: {} })
  return { Fredoka: font, Nunito: font, IBM_Plex_Sans: font, IBM_Plex_Mono: font, Gaegu: font }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Resolved = any

/** Next's resolver `require`s 'server-only', which Next's bundler aliases to its own empty copy; do the same here,
 *  for this one load, then put the resolver back. */
async function loadResolver() {
  const Module = (await import('node:module')).default as unknown as {
    _resolveFilename: (req: string, ...rest: unknown[]) => string
  }
  const { createRequire } = await import('node:module')
  const req = createRequire(import.meta.url)
  const orig = Module._resolveFilename
  Module._resolveFilename = (r, ...rest) =>
    r === 'server-only' ? req.resolve('next/dist/compiled/server-only/empty.js') : orig(r, ...rest)
  try { return req('next/dist/lib/metadata/resolve-metadata.js') }
  finally { Module._resolveFilename = orig }
}

async function resolve(pathname: string, segments: (Metadata | null)[]): Promise<Resolved> {
  const { accumulateMetadata } = await loadResolver()
  const items = segments.map(m => [m, null])
  return accumulateMetadata('', items, pathname, { trailingSlash: false, isStaticMetadataRouteFile: false })
}

async function routes() {
  const { metadata: root } = await import('@/app/layout')
  const { metadata: home } = await import('@/app/page')
  const { metadata: help } = await import('@/app/help/page')
  const { metadata: demoLayout } = await import('@/app/demo/layout')
  return {
    '/': await resolve('/', [root, home]),
    '/help': await resolve('/help', [root, null, help]),
    '/demo': await resolve('/demo', [root, demoLayout, null]),
  }
}

const HOME_TITLE = 'Radlic — math lessons that adapt to your child, KG to grade 8'
const HOME_OG_DESC =
  'Math from KG to grade 8: a lesson that explains one idea step by step, then practice that adapts to your child.'
const HELP_TITLE = 'Help · Radlic'
const HELP_DESC =
  'Answers to the questions parents ask about Radlic: lost progress, how lessons adapt, what we store, child logins, game time, and choosing where a child starts.'

const url = (u: URL | string | undefined | null) => (u ? String(u).replace(/\/$/, '') : u)

describe('SEO-04: /demo is kept out of the index', () => {
  it('/demo resolves to index: false', async () => {
    const r = await routes()
    expect(r['/demo'].robots?.basic).toMatch(/\bnoindex\b/)
  })

  // Positive control: the two public pages must stay indexable — a robots rule that leaked to the root would pass
  // the /demo assertion and de-index the site.
  it.each(['/', '/help'] as const)('%s is NOT noindex', async route => {
    const r = await routes()
    expect(r[route].robots?.basic ?? '').not.toMatch(/noindex/)
  })
})

describe('SEO-05: /help previews as /help, and cards are large', () => {
  it("/help's og:url is its own canonical and its og/twitter title is its own <title>", async () => {
    const h = (await routes())['/help']
    expect(h.title?.absolute).toBe(HELP_TITLE) // the rendered <title>, cross-checked against the build
    expect(url(h.alternates?.canonical?.url)).toBe('https://radlic.com/help')
    expect(url(h.openGraph?.url)).toBe('https://radlic.com/help')
    expect(h.openGraph?.title?.absolute).toBe(HELP_TITLE)
    expect(h.openGraph?.description).toBe(HELP_DESC)
    expect(h.twitter?.title?.absolute).toBe(HELP_TITLE)
    expect(h.twitter?.description).toBe(HELP_DESC)
  })

  it.each(['/', '/help', '/demo'] as const)('%s has twitter:card summary_large_image', async route => {
    expect((await routes())[route].twitter?.card).toBe('summary_large_image')
  })

  // Positive control: the home page's own og tags are what they were before this change.
  it("the home page's og tags are unchanged", async () => {
    const h = (await routes())['/']
    expect(h.openGraph?.title?.absolute).toBe(HOME_TITLE)
    expect(h.openGraph?.description).toBe(HOME_OG_DESC)
    expect(url(h.openGraph?.url)).toBe('https://radlic.com')
    expect(h.openGraph?.type).toBe('website')
    expect(h.openGraph?.siteName).toBe('Radlic')
    expect(h.twitter?.title?.absolute).toBe(HOME_TITLE)
  })
})
