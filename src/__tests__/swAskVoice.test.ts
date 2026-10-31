/**
 * The service worker leaves Ask maths' voice model to the browser. Staging, 2026-10-26: the voice worker's fetches of
 * the model from Hugging Face went through sw.js's network-first branch, whose fetch() runs under the app's CSP
 * (connect-src without huggingface.co) — refused, answered 'Offline' 503, and the made voice fell back to the device's.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8')

function respondsTo(url: string) {
  const listeners: Record<string, ((e: unknown) => void)[]> = {}
  const self = { addEventListener: (t: string, fn: (e: unknown) => void) => { (listeners[t] ||= []).push(fn) }, skipWaiting: async () => {}, clients: { claim: async () => {}, matchAll: async () => [] } }
  const caches = { open: async () => ({ match: async () => undefined, put: async () => {} }), keys: async () => [], delete: async () => true }
  new Function('self', 'caches', 'fetch', SRC)(self, caches, async () => new Response('x'))
  let responded = false
  const request = { url, method: 'GET', mode: 'cors', destination: '', headers: new Headers() }
  for (const fn of listeners.fetch) fn({ request, respondWith: () => { responded = true } })
  return responded
}

describe('sw.js: the Ask maths voice model is not fetched by the service worker', () => {
  it.each([
    'https://huggingface.co/spaces/KevinAHM/pocket-tts-web/resolve/abc/onnx/english_2026-04/flow_lm_main_int8.onnx',
    'https://cdn-lfs-us-1.hf.co/repos/ab/cd/flow_lm_main_int8.onnx',
  ])('%s goes straight to the browser', url => {
    expect(respondsTo(url)).toBe(false)
  })

  it('positive control: an app page still goes through the worker', () => {
    expect(respondsTo('https://radlic.com/modules')).toBe(true)
  })

  it('a look-alike host is not let through', () => {
    expect(respondsTo('https://huggingface.co.evil.example/x.onnx')).toBe(true)
  })
})
