import { describe, it, expect } from 'vitest'
import { needsStorage } from '@/shared/ui/StorageGate'
import { PUBLIC_ROUTES, PRIVATE_ROUTES, SITE_URL } from '@/app/site'
import robots from '@/app/robots'
import sitemap from '@/app/sitemap'
import { safeSize, FALLBACK } from '@/shared/hooks/useViewport'

/**
 * The gate that stops the app shipping one emoji per URL again.
 *
 * ⚠️ THE FIRST TWO ASSERTIONS ARE THE ONLY ONES THAT MATTER, and they are here because the failure
 * they guard is INVISIBLE: `StorageGate` is in the root layout, so an exemption that silently stops
 * matching turns every public page's HTML back into "Milo — Help 🦊" with nothing erroring, no
 * test failing and every route still returning 200. It is caught by reading the served bytes or by
 * this file, and by nothing in between.
 */
describe('public routes render without the storage splash', () => {
  it('exempts the pages that read no local state', () => {
    // Both spellings — with and without a trailing segment. `/legal` alone is not a page today,
    // but `/legal/privacy` is the one a regulator reads.
    // `/` is the marketing page: its words must be in the HTML for a crawler and a link preview.
    for (const p of ['/', '/help', '/legal', '/legal/privacy', '/legal/terms']) {
      expect(needsStorage(p), p).toBe(false)
    }
  })

  it('still gates every app route, including the ones that only LOOK public', () => {
    // `/helpful` and `/legalese` must NOT match — an unanchored or un-delimited pattern would
    // exempt them, and an app route rendered before kv hydrates reads empty local state.
    // `/menu` and `/game` must NOT ride the root's exemption — it is matched exactly, not as a
    // prefix. `/helpful` and `/legalese` must not match an unanchored pattern either.
    for (const p of ['/diagnostic', '/parent', '/game', '/menu', '/helpful', '/legalese']) {
      expect(needsStorage(p), p).toBe(true)
    }
  })

  it('every crawlable route is in the sitemap, and every private one is disallowed', () => {
    const urls = sitemap().map(e => e.url)
    expect(urls).toEqual(PUBLIC_ROUTES.map(p => `${SITE_URL}${p}`))

    const { rules, sitemap: ref } = robots()
    expect(ref).toBe(`${SITE_URL}/sitemap.xml`)
    expect(Array.isArray(rules) ? rules[0].disallow : rules.disallow).toEqual([...PRIVATE_ROUTES])
  })

  it('no public route is also disallowed', () => {
    // A route in both lists is indexable-but-blocked: the worst of both, and easy to create by
    // adding a page to one list and forgetting the other. Widened to string on purpose — with the
    // literal types tsc calls the comparison impossible, which is only true of TODAY's two lists.
    const blocked: string[] = [...PRIVATE_ROUTES]
    for (const p of PUBLIC_ROUTES as readonly string[]) {
      expect(blocked.some(d => p === d || p.startsWith(d.endsWith('/') ? d : d + '/')), p).toBe(false)
    }
  })

  it('SITE_URL is an absolute origin with no trailing slash', () => {
    // metadataBase, robots and sitemap all concatenate paths onto it — a trailing slash gives
    // `//help`, and a relative value makes every og:image relative again, which is the bug this
    // whole change exists to fix.
    expect(SITE_URL).toMatch(/^https:\/\/[^/]+$/)
  })
})

/**
 * ⚠️ A ZERO VIEWPORT IS NOT A MEASUREMENT. `window.innerWidth` reads 0 in a frame that has not been
 * laid out (backgrounded tab, hidden iframe, first tick of a headless drive) — measured live on the
 * preview pane. Handed through raw it becomes a real size to 29 consumers and every aspect test
 * built on it flips, so a landscape laptop draws its portrait layout.
 *
 * Drives the SHIPPED `safeSize`, not a copy of the rule — a check that re-implements it cannot see
 * the rule being removed.
 */
describe('useViewport never reports a zero size', () => {
  it('refuses a size that is not a measurement', () => {
    expect(safeSize(0, 0)).toBeNull()
    expect(safeSize(0, 700)).toBeNull()
    expect(safeSize(1280, 0)).toBeNull()
    expect(safeSize(-1, 700)).toBeNull()
  })

  it('passes a real size straight through', () => {
    expect(safeSize(1280, 720)).toEqual({ w: 1280, h: 720 })
    expect(safeSize(390, 844)).toEqual({ w: 390, h: 844 })
  })

  it('the fallback is LANDSCAPE, so an unlaid-out frame never reads as portrait', () => {
    // This is the property the consumers actually depend on: `useLandscape` (>= 1.25) and
    // GameShell's `portrait` (h >= w * 1.2) must both come out landscape on the fallback.
    const { w, h } = FALLBACK
    expect(w / h).toBeGreaterThanOrEqual(1.25)
    expect(h >= w * 1.2).toBe(false)
  })
})
