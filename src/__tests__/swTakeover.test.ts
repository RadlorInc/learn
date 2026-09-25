// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * A returning parent must get the NEW bundle after a deploy, and a child offline must still get a page.
 *
 * Runs the REAL `public/sw.js` inside a fake ServiceWorkerGlobalScope (self / caches / fetch) — no
 * copy of its logic lives here. The shell cache is primed exactly as an earlier visit would have left
 * it: yesterday's `/parent` HTML, which names yesterday's content-hashed chunk. Then the network
 * serves today's HTML and we ask the worker for `/parent`.
 *
 * ⚠️ The HTML strings are written out by hand, not derived from anything in sw.js — the assertion is
 * "the parent sees chunk B", and that is the intent, independent of how the worker is written.
 */

const ORIGIN = 'https://radlic.com'
const SRC = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8')
const VERSION = SRC.match(/const VERSION\s*=\s*'([^']+)'/)![1]

const OLD_HTML = '<html><script src="/_next/static/chunks/app-AAAA.js"></script>old add-child sheet</html>'
const NEW_HTML = '<html><script src="/_next/static/chunks/app-BBBB.js"></script>consent notice</html>'
const OFFLINE_HTML = '<html>You are offline</html>'

type Req = { url: string; method: string; mode: string; destination: string }
const req = (path: string, mode = 'navigate', destination = mode === 'navigate' ? 'document' : ''): Req =>
  ({ url: ORIGIN + path, method: 'GET', mode, destination })
const key = (r: Req | string) => (typeof r === 'string' ? new URL(r, ORIGIN).href : r.url)

function makeWorld(
  network: (url: string) => Promise<Response>,
  opts: { src?: string; stores?: Map<string, Map<string, Response>>; requested?: string[] } = {},
) {
  // `stores` can be shared by two worlds: that is two worker VERSIONS on one device, one Cache Storage.
  const stores = opts.stores ?? new Map<string, Map<string, Response>>()
  const open = async (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map())
    const m = stores.get(name)!
    return {
      match: async (r: Req | string) => m.get(key(r))?.clone(),
      put: async (r: Req | string, res: Response) => { m.set(key(r), res) },
      // Like the real Cache.add: a non-OK answer REJECTS and nothing is stored.
      add: async (r: string) => {
        opts.requested?.push(new URL(key(r)).pathname)
        const res = await network(key(r))
        if (!res.ok) throw new TypeError('Request failed')
        m.set(key(r), res)
      },
    }
  }
  const caches = {
    open,
    keys: async () => [...stores.keys()],
    delete: async (n: string) => stores.delete(n),
    match: async (r: Req | string) => {
      for (const m of stores.values()) { const hit = m.get(key(r)); if (hit) return hit.clone() }
      return undefined
    },
  }
  const listeners: Record<string, ((e: unknown) => void)[]> = {}
  const self = {
    addEventListener: (t: string, fn: (e: unknown) => void) => { (listeners[t] ||= []).push(fn) },
    skipWaiting: async () => {},
    clients: { claim: async () => {}, matchAll: async () => [] },
  }
  const fetch = (r: Req | string) => network(key(r))
  new Function('self', 'caches', 'fetch', opts.src ?? SRC)(self, caches, fetch)

  /** Dispatch install / activate and wait for everything passed to waitUntil. */
  const lifecycle = async (type: 'install' | 'activate') => {
    const waits: Promise<unknown>[] = []
    for (const fn of listeners[type] ?? []) fn({ waitUntil: (p: Promise<unknown>) => waits.push(p) })
    await Promise.all(waits)
  }

  const prime = async (cacheName: string, path: string, body: string) =>
    (await open(cacheName)).put(ORIGIN + path, new Response(body, { status: 200 }))

  /** Dispatch one fetch event; returns the body the page receives, or null if the SW let it pass. */
  const get = async (r: Req): Promise<string | null> => {
    let responded: Promise<Response> | undefined
    for (const fn of listeners.fetch) fn({ request: r, respondWith: (p: Promise<Response>) => { responded = p } })
    return responded ? (await responded).text() : null
  }
  return { prime, get, open, lifecycle, stores }
}

const online = (url: string) => {
  if (url.endsWith('/parent') || url.includes('/parent?_rsc=')) return Promise.resolve(new Response(NEW_HTML))
  return Promise.resolve(new Response('fresh ' + url))
}
const offline = () => Promise.reject(new TypeError('Failed to fetch'))

describe('service worker: a deploy takes over, offline still works', () => {
  it('an OLD client asking for /parent gets the NEW html, not the cached copy', async () => {
    const w = makeWorld(online)
    await w.prime(`milo-shell-${VERSION}`, '/parent', OLD_HTML)
    expect(await w.get(req('/parent'))).toBe(NEW_HTML)
  })

  it('a client-side (RSC) GET for /parent gets the NEW payload too', async () => {
    const w = makeWorld(online)
    await w.prime(`milo-shell-${VERSION}`, '/parent?_rsc=x1', OLD_HTML)
    expect(await w.get(req('/parent?_rsc=x1', 'cors'))).toBe(NEW_HTML)
  })

  it('the fresh page replaces the cached one, so the NEXT offline load is the new one', async () => {
    const shell = `milo-shell-${VERSION}`
    const w = makeWorld(online)
    await w.prime(shell, '/parent', OLD_HTML)
    await w.get(req('/parent'))
    await new Promise(r => setTimeout(r, 0))
    expect(await (await (await w.open(shell)).match(ORIGIN + '/parent'))!.text()).toBe(NEW_HTML)
  })

  it('offline: the cached page is served when the network fails', async () => {
    const w = makeWorld(offline)
    await w.prime(`milo-shell-${VERSION}`, '/parent', OLD_HTML)
    expect(await w.get(req('/parent'))).toBe(OLD_HTML)
  })

  it('offline with nothing cached: /offline.html', async () => {
    const w = makeWorld(offline)
    await w.prime(`milo-shell-${VERSION}`, '/offline.html', OFFLINE_HTML)
    expect(await w.get(req('/modules'))).toBe(OFFLINE_HTML)
  })

  it('content-hashed chunks stay cache-first (served with no network at all)', async () => {
    const w = makeWorld(offline)
    await w.prime(`milo-static-${VERSION}`, '/_next/static/chunks/app-AAAA.js', 'chunk A')
    expect(await w.get(req('/_next/static/chunks/app-AAAA.js', 'no-cors', 'script'))).toBe('chunk A')
  })

  it('/api is never intercepted', async () => {
    const w = makeWorld(online)
    expect(await w.get(req('/api/health', 'cors'))).toBeNull()
  })
})

/**
 * Two review findings, one of them turned down by measurement (docs/review/PERFORMANCE.md PERF-07/PERF-12,
 * LATENT-BUGS.md BUG-11, DEVOPS.md OPS-19).
 *
 * ⚠️ WHY THE BUMP STILL DROPS THE CLIP CACHE. A clip's URL is a hash of the line's TEXT (`clipKey`), not of the
 * audio. The audio has been rewritten under the same URL: f5a7694f3 (2026-09-19, sw v209) trimmed 56 Stevie clips
 * in place, and the VERSION bump was what got the trimmed audio onto devices, because `/audio/*.mp3` is cache-first
 * and never revalidates. Keeping that cache across bumps would pin the old audio on a device for ever. The test
 * below runs two worker VERSIONS against one Cache Storage and asserts the re-rendered clip arrives.
 */
const CLIP = '/audio/nzFihrBIvB34imQBuxub/3z57ji.mp3'
const clipReq = () => req(CLIP, 'no-cors', 'audio')
const PREV_SRC = SRC.replace(/const VERSION\s*=\s*'[^']+'/, "const VERSION = 'vPREV'")
const tick = () => new Promise(r => setTimeout(r, 0))

describe('service worker: precache list and VERSION bump', () => {
  it('install precaches only routes the build serves (measured with next build + next start, 2026-09-26)', async () => {
    const requested: string[] = []
    const w = makeWorld(online, { requested })
    await w.lifecycle('install')
    // Written out by hand. /profile and /shop were deleted and answer 404; /menu /game /parent /auth answer 200.
    expect(requested).toEqual(['/menu', '/game', '/parent', '/auth', '/offline.html', '/manifest.json'])
  })

  it('a clip re-rendered under the SAME url reaches the device after a VERSION bump', async () => {
    const stores = new Map<string, Map<string, Response>>()
    const prev = makeWorld(url => Promise.resolve(new Response(url.endsWith(CLIP) ? 'old audio' : 'x')), { src: PREV_SRC, stores })
    expect(await prev.get(clipReq())).toBe('old audio')
    await tick()
    // Positive control: the previous worker really kept it, and serves it with no network.
    const prevOffline = makeWorld(offline, { src: PREV_SRC, stores })
    expect(await prevOffline.get(clipReq())).toBe('old audio')

    const next = makeWorld(url => Promise.resolve(new Response(url.endsWith(CLIP) ? 'new audio' : 'x')), { stores })
    await next.lifecycle('activate')
    expect(await next.get(clipReq())).toBe('new audio')
  })

  it('activate removes the previous VERSION\'s page cache; pages stay network-first', async () => {
    const stores = new Map<string, Map<string, Response>>()
    const prev = makeWorld(online, { src: PREV_SRC, stores })
    await prev.prime('milo-shell-vPREV', '/parent', OLD_HTML)
    const next = makeWorld(offline, { stores })
    await next.lifecycle('activate')
    expect([...stores.keys()].filter(k => k.endsWith('vPREV'))).toEqual([])
    expect(await next.get(req('/parent'))).not.toBe(OLD_HTML)
    const nextOnline = makeWorld(online, { stores })
    await nextOnline.prime(`milo-shell-${VERSION}`, '/parent', OLD_HTML)
    expect(await nextOnline.get(req('/parent'))).toBe(NEW_HTML)
  })
})
