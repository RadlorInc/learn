/**
 * The service worker never caches a partial (206) or range response, and never lets a refused put escape.
 *
 * Production console, 2026-09-24, on every lesson clip: "Failed to execute 'put' on 'Cache': Partial response (status
 * code 206) is unsupported" (sw.js cacheFirst). An <audio> element asks for a byte range, the CDN answers 206, `r.ok`
 * called that success, and the fake cache below refuses a 206 exactly as the real Cache API does — so the old worker
 * produced an unhandled rejection here too.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ORIGIN = 'https://radlic.com'
const SRC = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8')

type Req = { url: string; method: string; mode: string; destination: string; headers: Headers }
const req = (path: string, headers: Record<string, string> = {}): Req =>
  ({ url: ORIGIN + path, method: 'GET', mode: 'no-cors', destination: 'audio', headers: new Headers(headers) })

function world(network: (r: Req) => Response) {
  const stored = new Map<string, Response>()
  const puts: number[] = []
  const cache = {
    match: async (r: Req | string) => stored.get(typeof r === 'string' ? r : r.url)?.clone(),
    // The real Cache API refuses a partial response. So does this one.
    put: async (r: Req | string, res: Response) => {
      puts.push(res.status)
      if (res.status === 206) throw new TypeError("Failed to execute 'put' on 'Cache': Partial response (status code 206) is unsupported")
      stored.set(typeof r === 'string' ? r : r.url, res)
    },
    add: async () => {},
  }
  const caches = { open: async () => cache, keys: async () => [], delete: async () => true, match: cache.match }
  const listeners: Record<string, ((e: unknown) => void)[]> = {}
  const self = { addEventListener: (t: string, fn: (e: unknown) => void) => { (listeners[t] ||= []).push(fn) }, skipWaiting: async () => {}, clients: { claim: async () => {}, matchAll: async () => [] } }
  new Function('self', 'caches', 'fetch', SRC)(self, caches, (r: Req) => Promise.resolve(network(r)))
  const get = async (r: Req) => {
    let p: Promise<Response> | undefined
    for (const fn of listeners.fetch) fn({ request: r, respondWith: (x: Promise<Response>) => { p = x } })
    const res = await p!
    await new Promise(r => setTimeout(r, 10))      // let the (unawaited) put settle
    return res
  }
  return { get, stored, puts }
}

const unhandled: unknown[] = []
const onUnhandled = (e: unknown) => { unhandled.push(e) }
process.on('unhandledRejection', onUnhandled)
afterEach(() => { unhandled.length = 0 })

const CLIP = '/audio/nzFihrBIvB34imQBuxub/hxmia9.mp3'
const partial = () => new Response('part', { status: 206, headers: { 'content-range': 'bytes 0-3/100' } })
const whole = () => new Response('whole clip', { status: 200 })

describe('sw.js: only whole responses are cached', () => {
  it('a RANGE request answered 206 reaches the page, is not cached, and raises no unhandled rejection', async () => {
    const w = world(r => (r.headers.get('range') ? partial() : whole()))
    const res = await w.get(req(CLIP, { range: 'bytes=0-' }))
    expect(res.status, 'the page still gets its partial response').toBe(206)
    expect(w.puts, 'a partial response was offered to the cache').toEqual([])
    expect(w.stored.size).toBe(0)
    expect(unhandled).toEqual([])
  })

  it('control: the same clip fetched WHOLE (prefetchClips) is cached, and the next request is served from it', async () => {
    let calls = 0
    const w = world(() => { calls++; return whole() })
    await w.get(req(CLIP))
    expect([...w.stored.keys()]).toEqual([ORIGIN + CLIP])
    const again = await w.get(req(CLIP, { range: 'bytes=0-' }))
    expect([await again.text(), calls]).toEqual(['whole clip', 1])
  })

  it('a 206 without a Range header (a proxy\'s doing) is still not cached', async () => {
    const w = world(() => partial())
    await w.get(req(CLIP))
    expect([w.puts, unhandled]).toEqual([[], []])
  })

  it('the shell version moved on, so every device drops caches written by the old worker', () => {
    expect(SRC.match(/const VERSION\s*=\s*'([^']+)'/)![1]).toBe('v235')
  })
})
