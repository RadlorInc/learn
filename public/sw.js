const VERSION      = 'v237'
const SHELL_CACHE  = `milo-shell-${VERSION}`
const STATIC_CACHE = `milo-static-${VERSION}`
const ASSETS_CACHE = `milo-assets-${VERSION}`

// NOTE: '/' is intentionally NOT pre-cached. The root is a redirect (→ /auth or
// /parent); a service worker cannot return a cached redirected response to a
// navigation (the browser fails it with ERR_FAILED). The root is handled by a
// dedicated passthrough in the fetch handler below.
// Only routes the build serves (/profile and /shop were deleted and answered 404). Gated by swTakeover.test.ts.
const APP_PAGES = ['/game', '/parent', '/auth', '/offline.html', '/manifest.json']

// ─── Install — pre-cache all app pages ───────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => Promise.allSettled(APP_PAGES.map(url => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  )
})

// ─── Activate ─────────────────────────────────────────────────
// ⚠️ This also drops milo-assets-* (voice clips, art) ON PURPOSE. A clip's URL hashes the line's TEXT, not the
// audio, and clips have been re-rendered in place (56 trimmed, 2026-09-19); /assets/ art has been rewritten in place
// too. Both are cache-first, so the bump is the only thing that refreshes them. Keep them across bumps only once
// their URLs change with their bytes. Gated by swTakeover.test.ts.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith('milo-') && !k.endsWith(VERSION)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

// ─── Fetch ────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') return
  if (!url.protocol.startsWith('http')) return
  if (url.hostname.includes('supabase.co')) return
  if (url.pathname.includes('hmr') || url.pathname.includes('webpack')) return
  /**
   * ⚠️ API ROUTES ARE NEVER CACHED, AND THERE WAS NO SUCH RULE UNTIL 2026-09-05.
   *
   * Without this, /api/* fell through to the stale-while-revalidate branch at the bottom, which
   * caches any `r.ok` response into the SHELL cache and then serves it IMMEDIATELY on later loads.
   * For a metrics dashboard that means yesterday's numbers presented as today's, with nothing on
   * screen saying so — the exact defect class the dashboard exists to avoid.
   *
   * It had been latent rather than harmful: the SW only intercepts GET, and until /api/admin/metrics
   * shipped, /api/health was the ONLY GET route (everything else — checkout, lead, report-error,
   * the Stripe webhook — is POST and was always skipped). A cached /api/health would have made a
   * liveness probe answer from cache, which is its own small lie; nothing else was exposed.
   */
  if (url.pathname.startsWith('/api/')) return

  // Root navigations redirect (→ /auth or /parent). A SW must NOT serve a
  // redirected response to a navigation, so pass the request straight through
  // and let the browser follow the redirect itself.
  if (request.mode === 'navigate' && url.pathname === '/') {
    event.respondWith(
      fetch(request, { redirect: 'manual' }).catch(async () => {
        const cache = await caches.open(SHELL_CACHE)
        return (await cache.match('/auth')) ||
               (await caches.match('/offline.html')) ||
               new Response('Offline', { status: 503 })
      })
    )
    return
  }

  // Static chunks — cache first forever
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // RSC payloads — cache first, return empty if nothing cached offline
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async cache => {
        const cached = await cache.match(request)
        // Update cache in background
        fetch(request).then(r => store(cache, request, r)).catch(() => {})
        if (cached) return cached
        // Not cached yet — try network
        try {
          const r = await fetch(request)
          store(cache, request, r)
          return r
        } catch {
          // Return empty RSC response so page renders from client state
          return new Response('', { status: 200, headers: { 'content-type': 'text/x-component' } })
        }
      })
    )
    return
  }

  /**
   * Voice clips. ⚠️ THE TWO HALVES NEED OPPOSITE STRATEGIES AND THAT IS THE WHOLE BUG.
   * An mp3 is content-addressed — its filename IS a hash of the line — so it can be cached for
   * ever and never goes stale. `manifest.json` is the opposite: it is rewritten by every render,
   * and it GATES every lookup. With no branch here it fell to the stale-while-revalidate case
   * below, so a device that had once loaded the app kept serving the OLD key list — the new
   * clips sat on the CDN and were never asked for, every line fell back to browser speech, and
   * on a Chrome with no installed voice that is SILENCE. Found 2026-09-04: 17–18 played in
   * Safari (no service worker) and was mute in Chrome (service worker, cached 433-key manifest),
   * on the same account, same deploy. Nothing was broken but this branch's absence.
   */
  if (url.pathname.startsWith('/audio/')) {
    event.respondWith(
      url.pathname.endsWith('.json')
        ? networkFirst(request, ASSETS_CACHE)
        : cacheFirst(request, ASSETS_CACHE)
    )
    return
  }

  // Images and fonts — cache first
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(request, ASSETS_CACHE))
    return
  }

  /**
   * App pages and their RSC payloads (`/parent?_rsc=…`) — NETWORK FIRST, cache only when offline.
   *
   * ⚠️ THIS WAS STALE-WHILE-REVALIDATE UNTIL 2026-09-23, AND THAT IS HOW A DEPLOY FAILED TO REACH
   * RETURNING PARENTS. The cached HTML came back instantly and named yesterday's content-hashed
   * `/_next/static/` chunks, which are cache-first for ever — so the whole old bundle ran (the old
   * add-child sheet, which the new consent gate then refused). skipWaiting/claim do not help: the
   * worker was new, the page it served was not. Gated by `src/__tests__/swTakeover.test.ts`.
   */
  event.respondWith(
    caches.open(SHELL_CACHE).then(async cache => {
      try {
        const r = await fetch(request)
        // A redirected response cannot be replayed to a navigation (ERR_FAILED) — never cache one (store() refuses it).
        store(cache, request, r)
        return r
      } catch {
        const cached = await cache.match(request)
        if (cached && !cached.redirected) return cached
        if (request.mode === 'navigate') {
          return caches.match('/offline.html').then(r => r || new Response('Offline', { status: 503 }))
        }
        return new Response('Offline', { status: 503 })
      }
    })
  )
})

/** Network first, falling back to the cached copy — for a small file whose CONTENT changes
 *  and whose staleness is silent (see the /audio/ branch). */
/**
 * Keep a response only if it is the WHOLE thing, and never let a refusal escape.
 *
 * ⚠️ A media element asks for byte RANGES and gets 206 Partial Content, which `r.ok` calls success and `Cache.put`
 * refuses — "Failed to execute 'put' on 'Cache': Partial response (status code 206) is unsupported", an unhandled
 * rejection on every clip (production console, 2026-09-24). A range request's answer is never the whole file, so it is
 * never kept; the whole file is kept when it is fetched whole (prefetchClips). A redirected response cannot be replayed
 * to a navigation (ERR_FAILED), so it is not kept either. Any other put failure (quota) is swallowed: the page already
 * has its response, and a cache miss next time is the right cost.
 */
function store(cache, request, r) {
  if (r.status !== 200 || r.redirected) return
  if (request.headers && typeof request.headers.get === 'function' && request.headers.get('range')) return
  cache.put(request, r.clone()).catch(() => {})
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const r = await fetch(request)
    store(cache, request, r)
    return r
  } catch {
    return (await cache.match(request)) || new Response('', { status: 503 })
  }
}

async function cacheFirst(request, cacheName) {
  const cache  = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached
  try {
    const r = await fetch(request)
    store(cache, request, r)
    return r
  } catch {
    return new Response('', { status: 503 })
  }
}

self.addEventListener('message', event => {
  // Report which shell version is actually controlling this device. A parent running an old
  // VERSION while prod serves a newer one IS the stale-shell bug class — and it is invisible
  // from the server, so support has no other way to find out. Replies to the asking client only.
  if (event.data?.type === 'VERSION') {
    event.source?.postMessage({ type: 'VERSION', version: VERSION })
  }
  if (event.data?.type === 'CHECK_ONLINE') {
    fetch('/manifest.json', { cache: 'no-store' })
      .then(() => self.clients.matchAll().then(cs => cs.forEach(c => c.postMessage({ type: 'ONLINE' }))))
      .catch(() => self.clients.matchAll().then(cs => cs.forEach(c => c.postMessage({ type: 'OFFLINE' }))))
  }
})