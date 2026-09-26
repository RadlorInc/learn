/**
 * BUG-05 (docs/review/LATENT-BUGS.md): one failed voice-manifest fetch must not silence the recorded voice for the rest
 * of the session. The manifest promise was memoised per voice INCLUDING its failure, so after one blip every line was
 * "not in the manifest" until a reload.
 *
 * Properties checked (and no stronger ones):
 *  - after a failed manifest load, a call made once the retry window has passed fetches the manifest again and asks
 *    for the clip;
 *  - a call made INSIDE the window does not re-fetch (an offline device is not asked on every line);
 *  - a successful manifest is fetched once and reused.
 */
import { it, expect, vi, beforeEach, afterEach } from 'vitest'
import { clipKey } from '@/core/voiceClips'

vi.mock('@/infra/storage/voicePref', () => ({ getVoicePref: () => 'device', BAND_VOICE: {} }))
vi.mock('@/data/supabase/useLearnerSession', () => ({ getActiveLearner: () => null }))

const LINE = 'Let us count the tens.'
const MANIFEST = '/audio/josh/manifest.json'
const CLIP = `/audio/josh/${clipKey(LINE)}.mp3`
const tick = () => new Promise(r => setTimeout(r, 0))

let now = 1_000_000
let online = true
let status = 200
const f = vi.fn(async (url: string) => {
  if (!online) throw new TypeError('Failed to fetch')
  if (url.endsWith('manifest.json')) return new Response(JSON.stringify([clipKey(LINE)]), { status })
  return new Response('mp3')
})
const calls = (u: string) => f.mock.calls.filter(c => String(c[0]) === u).length

let prefetchClips: (t: string[]) => void
beforeEach(async () => {
  vi.resetModules()
  now = 1_000_000; online = true; status = 200; f.mockClear()
  vi.spyOn(Date, 'now').mockImplementation(() => now)
  vi.stubGlobal('fetch', f)
  const m = await import('@/infra/voiceClipPlayer')
  m.setSceneVoice('josh')
  prefetchClips = m.prefetchClips
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

it('a network failure is retried by a later call once the window has passed, and the clip is asked for', async () => {
  online = false
  prefetchClips([LINE]); await tick()
  online = true
  now += 15_000
  prefetchClips([LINE]); await tick()
  expect(calls(MANIFEST)).toBe(2)
  expect(calls(CLIP)).toBe(1)
})

it('a non-OK manifest response (the service worker 503) is retried too', async () => {
  status = 503
  prefetchClips([LINE]); await tick()
  status = 200
  now += 15_000
  prefetchClips([LINE]); await tick()
  expect(calls(MANIFEST)).toBe(2)
  expect(calls(CLIP)).toBe(1)
})

it('inside the window a failure is not re-fetched on every line', async () => {
  online = false
  prefetchClips([LINE]); await tick()
  now += 2_000
  prefetchClips([LINE]); await tick()
  prefetchClips([LINE]); await tick()
  expect(calls(MANIFEST)).toBe(1)
})

it('POSITIVE CONTROL: a successful manifest is fetched once and reused, even long after', async () => {
  prefetchClips([LINE]); await tick()
  now += 60_000
  prefetchClips([LINE]); await tick()
  prefetchClips([LINE]); await tick()
  expect(calls(MANIFEST)).toBe(1)
  expect(calls(CLIP)).toBe(3)
})
