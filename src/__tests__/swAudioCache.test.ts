/**
 * The service worker's cache for recorded clips from the audio bucket (2026-09-26), run on the REAL public/sw.js.
 *
 *   · a bucket clip is handled by the worker even though the bucket is on supabase.co (every OTHER supabase.co request
 *     is still left alone), and it is matched by its content-hash NAME, so a move to another host keeps working;
 *   · the prefetch's whole 200 is kept; the <audio> element's own Range request (206) and an opaque answer are not —
 *     and the element is then answered from the kept 200, ignoring Vary (the two requests differ in their Origin);
 *   · at most AUDIO_CAP clips, oldest-stored first out;
 *   · a VERSION bump does not throw clips away (a content-hash name can never be stale), but still clears the rest.
 * Expected values are written out by hand.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8')
const BUCKET = 'https://proj.supabase.co/storage/v1/object/public/lesson-audio'
const name = (i: number) => i.toString(16).padStart(16, '0')

type Req = { url: string; method: string; mode: string; destination: string; headers: Headers }
const req = (url: string, headers: Record<string, string> = {}, mode = 'no-cors'): Req =>
  ({ url, method: 'GET', mode, destination: 'audio', headers: new Headers(headers) })

function world(network: (r: Req) => Response, existing: string[] = []) {
  const caches: Map<string, Map<string, Response>> = new Map(existing.map(n => [n, new Map()]))
  const matchOpts: unknown[] = []
  const open = async (n: string) => {
    if (!caches.has(n)) caches.set(n, new Map())
    const c = caches.get(n)!
    return {
      match: async (r: Req | string, o?: unknown) => { matchOpts.push(o); return c.get(typeof r === 'string' ? r : r.url)?.clone() },
      put: async (r: Req | string, res: Response) => {
        if (res.status === 206) throw new TypeError('Partial response (status code 206) is unsupported')
        c.set(typeof r === 'string' ? r : r.url, res)
      },
      keys: async () => [...c.keys()].map(url => ({ url })),
      delete: async (r: { url: string }) => c.delete(r.url),
      add: async () => {},
    }
  }
  const cachesApi = { open, keys: async () => [...caches.keys()], delete: async (n: string) => caches.delete(n), match: async () => undefined }
  const listeners: Record<string, ((e: unknown) => void)[]> = {}
  const self = { addEventListener: (t: string, fn: (e: unknown) => void) => { (listeners[t] ||= []).push(fn) }, skipWaiting: async () => {}, clients: { claim: async () => {}, matchAll: async () => [] } }
  let calls = 0
  new Function('self', 'caches', 'fetch', SRC)(self, cachesApi, (r: Req) => { calls++; return Promise.resolve(network(r)) })
  const get = async (r: Req) => {
    let p: Promise<Response> | undefined
    for (const fn of listeners.fetch) fn({ request: r, respondWith: (x: Promise<Response>) => { p = x } })
    if (!p) return undefined                              // the worker left the request alone
    const res = await p
    await new Promise(t => setTimeout(t, 5))
    return res
  }
  const activate = async () => { let w: Promise<unknown> | undefined; for (const fn of listeners.activate) fn({ waitUntil: (x: Promise<unknown>) => { w = x } }); await w }
  const audio = () => caches.get('milo-assets-audio') ?? new Map()
  return { get, activate, caches, audio, matchOpts, network: () => calls }
}

const whole = () => new Response('whole clip', { status: 200 })
const partial = () => new Response('part', { status: 206, headers: { 'content-range': 'bytes 0-3/100' } })

describe('sw.js: recorded clips from the audio bucket', () => {
  it('a bucket clip is handled; every other supabase.co request is still left alone', async () => {
    const w = world(whole)
    expect(await w.get(req(`${BUCKET}/${name(1)}.mp3`, {}, 'cors'))).toBeDefined()
    expect(await w.get(req('https://proj.supabase.co/rest/v1/lesson_progress?select=*', {}, 'cors'))).toBeUndefined()
    expect(await w.get(req('https://proj.supabase.co/storage/v1/object/public/lesson-audio/not-a-hash.mp3', {}, 'cors'))).toBeUndefined()
  })

  it('it is matched by the content-hash name, not the host — so a move to another host keeps working', async () => {
    const w = world(whole)
    expect(await w.get(req(`https://audio.example.org/${name(2)}.mp3`, {}, 'cors'))).toBeDefined()
    expect(w.audio().size).toBe(1)
  })

  it("keeps the prefetch's whole 200; never the element's 206 or an opaque answer; then answers the element from the kept copy", async () => {
    let answer = partial
    const w = world(() => answer())
    const url = `${BUCKET}/${name(3)}.mp3`
    await w.get(req(url, { range: 'bytes=0-' }))                     // the element first: 206 — not kept
    expect(w.audio().size).toBe(0)
    answer = () => { const r = new Response('x'); Object.defineProperty(r, 'status', { value: 0 }); return r }
    await w.get(req(url))                                             // opaque — not kept
    expect(w.audio().size).toBe(0)
    answer = whole
    await w.get(req(url, {}, 'cors'))                                 // the prefetch: whole 200 — kept
    expect(w.audio().size).toBe(1)
    const before = w.network()
    const hit = await w.get(req(url, { range: 'bytes=0-' }))          // the element again: from the cache
    expect([w.network() - before, await hit!.text()]).toEqual([0, 'whole clip'])
    expect(w.matchOpts.at(-1)).toEqual({ ignoreVary: true })
  })

  it('holds at most 2,000 clips, oldest-stored first out', async () => {
    const w = world(whole)
    for (let i = 0; i < 2001; i++) await w.get(req(`${BUCKET}/${name(100 + i)}.mp3`, {}, 'cors'))
    const kept = [...w.audio().keys()]
    expect(kept.length).toBe(2000)
    expect(kept).not.toContain(`${BUCKET}/${name(100)}.mp3`)          // the first stored is the one that went
    expect(kept).toContain(`${BUCKET}/${name(101)}.mp3`)
    expect(kept).toContain(`${BUCKET}/${name(2100)}.mp3`)
  }, 60_000)

  it("a VERSION bump keeps the clips and still clears the old version's other caches", async () => {
    const w = world(whole, ['milo-assets-audio', 'milo-assets-v239', 'milo-shell-v239', 'milo-static-v239'])
    await w.activate()
    expect([...w.caches.keys()].sort()).toEqual(['milo-assets-audio'])
  })
})
