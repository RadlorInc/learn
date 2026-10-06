const VERSION      = 'v251'
const SHELL_CACHE  = `milo-shell-${VERSION}`
const STATIC_CACHE = `milo-static-${VERSION}`
const ASSETS_CACHE = `milo-assets-${VERSION}`
/**
 * The recorded lesson clips from the audio bucket (2026-09-26). NOT versioned, so a deploy does not throw them away:
 * each object is named by the hash of its bytes, so a cached clip can never be stale — a re-render is a new name.
 * CAPPED at AUDIO_CAP clips, oldest-stored first out: about one whole grade of lessons (932–1,330 clips, 19–27 MB) plus
 * the previous grade's review, ≈ 40 MB at the ~20 KB a Josh clip averages — well inside what a phone's browser gives an
 * origin, and never unbounded (every Josh clip would be 262 MB). Named under `milo-assets` because that is the storage the
 * cookie notice already lists for "its audio" (docs/legal/08-cookie-and-tracking-notice.md). swAudioCache.test.ts.
 */
const AUDIO_CACHE  = 'milo-assets-audio'
const AUDIO_CAP    = 2000

// ⚠️ NO PAGE LIST (N26, 2026-09-26). Until v238 this precached a hand-kept APP_PAGES list for offline use; it went
// stale twice (/profile and /shop answered 404, /modules and /lesson were never in it) and nothing promised it. The
// founder's call: keep the offline ANSWER queue (IndexedDB, useOfflineSync — not this file), make no offline promise
// beyond it. So install fetches ONE file: the page shown when a navigation fails with no network. A page the child
// already opened online is still served from the cache when the network fails (the network-first branch below) —
// best effort, not a promise. Gated by swTakeover.test.ts.
const OFFLINE_PAGE = '/offline.html'

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.add(OFFLINE_PAGE).catch(() => {}))
      .then(() => self.skipWaiting())
  )
})

// ─── Activate ─────────────────────────────────────────────────
// ⚠️ This also drops the versioned milo-assets-* cache (art) ON PURPOSE: /assets/ art is rewritten in place under the
// same name, so the bump is what refreshes it.
// The bucket's clips (AUDIO_CACHE) are the exception the old comment asked for — "keep them across bumps only once their
// URLs change with their bytes": a bucket object's name IS the hash of its bytes. Gated by swTakeover / swAudioCache.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith('milo-') && !k.endsWith(VERSION) && k !== AUDIO_CACHE).map(k => caches.delete(k))
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
  // Recorded clips from the audio bucket, matched by their content-hash NAME rather than a host, so this keeps working
  // if the bucket moves (src/core/audioBase.ts). BEFORE the Supabase bypass below — the bucket is on supabase.co today.
  if (/\/[0-9a-f]{16}\.mp3$/.test(url.pathname)) {
    event.respondWith(audioFirst(request))
    return
  }
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
  // and let the browser follow the redirect itself. Offline: the offline page (no precached /auth — no page list).
  if (request.mode === 'navigate' && url.pathname === '/') {
    event.respondWith(
      fetch(request, { redirect: 'manual' }).catch(offlinePage)
    )
    return
  }

  // The game (built into public/blockcraft). Its page names its code by content hash, so the page must come from the
  // network (a stale page would ask for code the new deploy no longer has) and the hashed files can be cached for ever.
  if (url.pathname.startsWith('/blockcraft/')) {
    event.respondWith(url.pathname.endsWith('.html') ? networkFirst(request, ASSETS_CACHE) : cacheFirst(request, ASSETS_CACHE))
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
          return offlinePage()
        }
        return new Response('Offline', { status: 503 })
      }
    })
  )
})

async function offlinePage() {
  return (await caches.match(OFFLINE_PAGE)) || new Response('Offline', { status: 503 })
}

/** Network first, falling back to the cached copy — for a small file whose CONTENT changes
 *  and whose staleness is silent. */
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

/**
 * Cache-first for a bucket clip. ⚠️ Two requests arrive for one clip and only one can be kept:
 *   · prefetchClips' fetch() — CORS, no Range → a whole 200 with the bucket's CORS header: KEPT;
 *   · the <audio> element's own request — no-cors with a Range header → an opaque or 206 answer: NEVER kept (a 206 is
 *     not the file, and an opaque response is padded to megabytes of quota in Chrome). On a hit it is answered from the
 *     kept 200, exactly as same-origin clips were before the move. ignoreVary: the two requests differ in their Origin
 *     header, and a `Vary: Origin` from the bucket would otherwise turn every hit into a miss.
 */
async function audioFirst(request) {
  const cache = await caches.open(AUDIO_CACHE)
  const hit = await cache.match(request, { ignoreVary: true })
  if (hit) return hit
  try {
    const r = await fetch(request)
    if (r.status === 200 && !r.redirected && !(request.headers && typeof request.headers.get === 'function' && request.headers.get('range'))) {
      await cache.put(request, r.clone()).then(() => trimAudio(cache)).catch(() => {})
    }
    return r
  } catch {
    return new Response('', { status: 503 })
  }
}

/** Keep the newest AUDIO_CAP clips; Cache.keys() lists them in the order they were stored. */
async function trimAudio(cache) {
  const keys = await cache.keys()
  if (keys.length > AUDIO_CAP) await Promise.all(keys.slice(0, keys.length - AUDIO_CAP).map(k => cache.delete(k)))
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