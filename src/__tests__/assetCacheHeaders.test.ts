import { describe, it, expect } from 'vitest'
import config from '../../next.config'

/**
 * The caching rules for 57 MB of static art and audio, driven through the real `headers()` — the
 * same shape as `cspHeader.test.ts`, and for the same reason: `next.config.ts` is otherwise ungated,
 * and every fault here is silent.
 *
 * What this DOES gate: that a request for a backdrop still resolves to a long-lived rule, that
 * `/sw.js` is still excluded from it, and that the values have not been weakened. Those are the
 * realistic regressions — the rule deleted, its `source` renamed so it stops matching, the TTL cut,
 * or the asset rule widened until it swallows the service worker.
 *
 * ⚠️ WHAT IT CANNOT GATE, SAID OUT LOUD SO NOBODY READS THIS AS FULL COVERAGE: what VERCEL'S image
 * optimizer does with these headers. Measured on one commit, same source header, two optimizers —
 * `next start` returns `max-age=31536000, must-revalidate` (its own `minimumCacheTTL` as a floor)
 * while Vercel returns the upstream `max-age=2592000, stale-while-revalidate=31536000`. That
 * behaviour lives on Vercel's side of the wire and is invisible to `headers()`, so it is checked
 * with a `curl -I` against the live origin, not here. See the note on `minimumCacheTTL`.
 */

/** Resolve which rules apply to a path, the way Next's `source` patterns do for the two forms this
 *  config actually uses: an exact path, and a `/prefix/:path*` wildcard. Deliberately tiny — a full
 *  path-to-regexp re-implementation would be a second copy of Next's router that can agree with
 *  nothing, which is the fault this repo keeps recording. The forms in use are asserted below, so a
 *  third one cannot slip in and be silently mis-resolved. */
const matches = (source: string, path: string): boolean => {
  const wild = source.match(/^(.*)\/:[A-Za-z]+\*$/)
  if (wild) return path.startsWith(wild[1] + '/')
  // A single-segment param with a literal tail — `/audio/:voice/manifest.json`. Still not a
  // path-to-regexp: one substitution, anchored, and `[^/]+` cannot cross a segment boundary.
  if (source.includes('/:')) {
    const re = source.split('/').map(seg => (seg.startsWith(':') ? '[^/]+' : seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('/')
    return new RegExp(`^${re}$`).test(path)
  }
  return source === path
}

/**
 * ⚠️ LAST MATCHING RULE WINS, AND THAT WAS MEASURED RATHER THAN ASSUMED. Mutation-testing this file
 * turned up a survivor: widening the asset rule to `/:path*` so it also covers `/sw.js` passed
 * every check. Rather than weaken the gate or call it a hole, the mutation was applied to a real
 * `next start` — which still returned `max-age=0, must-revalidate` for `/sw.js`, because the
 * dedicated `/sw.js` rule sits LATER in the array and overrides it. So the survivor is inert, and
 * the ordering it depends on is the same ordering this resolver implements.
 *
 * That also means the dangerous reordering IS covered: move the asset rule below `/sw.js` and
 * widen it, and `cacheControlFor('/sw.js')` returns the long TTL and the service-worker test fails.
 */
async function cacheControlFor(path: string): Promise<string | undefined> {
  const rules = await config.headers!()
  const hit = rules
    .filter(r => matches(r.source, path))
    .flatMap(r => r.headers)
    .filter(h => h.key.toLowerCase() === 'cache-control')
  return hit.length ? hit[hit.length - 1].value : undefined
}

const maxAge = (v: string) => Number(/max-age=(\d+)/.exec(v)?.[1] ?? -1)

describe('static asset caching', () => {
  it('only uses the two `source` forms this matcher understands', async () => {
    const rules = await config.headers!()
    expect(rules.length).toBeGreaterThan(3)
    for (const r of rules) {
      // `/:path*` (the baseline rule, empty prefix → matches everything), `/prefix/:path*`, or an
      // exact path. It sets no Cache-Control, so it never competes with the rules below.
      // Literal segments, `:param` segments, and an optional trailing `/:param*`.
      expect(r.source, `unrecognised source form: ${r.source}`)
        .toMatch(/^(\/(:?[A-Za-z0-9._-]+))*(\/:[A-Za-z]+\*)?$/)
    }
  })

  /**
   * ⚠️ PINNED TO A MEASUREMENT, NOT TO ITSELF. These four are what production actually returned on
   * `72024c0` (`curl -I` against the live origin), so the matcher above is checked against reality
   * rather than against my own re-derivation of it — otherwise a wrong matcher and a wrong config
   * agree with each other and the gate is decorative.
   */
  it.each([
    ['/assets/backgrounds/garden.png', 'public, max-age=2592000, stale-while-revalidate=31536000'],
    ['/audio/IvUJKFyjVb5hItY9dJAT/1h27o8n.mp3', 'public, max-age=2592000, stale-while-revalidate=31536000'],
    ['/icons/icon-192.png', 'public, max-age=2592000, stale-while-revalidate=31536000'],
    ['/sw.js', 'public, max-age=0, must-revalidate'],
    // ⚠️ The index, not an asset. A stale one is a SHORTER key list, which is a clean miss on
    // every clip it has dropped — silent, and it cost the 17–18 band its whole voice in Chrome
    // while 12–14 and 15–16 played from the same stale copy. See next.config's note.
    ['/audio/IvUJKFyjVb5hItY9dJAT/manifest.json', 'public, max-age=0, must-revalidate'],
    ['/audio/IvUJKFyjVb5hItY9dJAT/frag/fragments.json', 'public, max-age=0, must-revalidate'],
  ])('%s resolves to what production served', async (path, expected) => {
    expect(await cacheControlFor(path)).toBe(expected)
  })

  it('art and audio are cached for weeks, not revalidated per request', async () => {
    // The fault this replaced: Next's default for `public/` is `max-age=0, must-revalidate`, so
    // every backdrop cost a conditional round-trip on every load for any client the service worker
    // was not controlling. A week is the floor below which that is creeping back.
    for (const p of ['/assets/backgrounds/garden.png', '/audio/x.mp3', '/icons/icon-192.png']) {
      expect(maxAge((await cacheControlFor(p))!), p).toBeGreaterThanOrEqual(604800)
    }
  })

  it('but NOT immutable — this repo rewrites art in place', async () => {
    // The 83 MB → 58 MB recompression pass rewrote 86 files under their existing names. `immutable`
    // would strand every client holding one for the full year, with no way to correct it.
    expect(await cacheControlFor('/assets/backgrounds/garden.png')).not.toMatch(/immutable/)
    expect(await cacheControlFor('/assets/backgrounds/garden.png')).toMatch(/stale-while-revalidate/)
  })

  it('⚠️ the service worker is NEVER long-cached — a stale one is permanent', async () => {
    // `sw.js` is how every other cache gets busted. Cache it and there is no lever left: the browser
    // keeps serving the old shell, and a cached response keeps its old HEADERS with it.
    const sw = (await cacheControlFor('/sw.js'))!
    expect(maxAge(sw)).toBe(0)
    expect(sw).toMatch(/must-revalidate/)
    expect(sw).not.toMatch(/stale-while-revalidate/)
  })

  it('the manifest stays revalidating too', async () => {
    expect(maxAge((await cacheControlFor('/manifest.json'))!)).toBe(0)
  })
})
