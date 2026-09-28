/**
 * BUG-05 (fbf193280:docs/review/LATENT-BUGS.md): one failed clip-index load must not silence the recorded voice for the rest of
 * the session. The index promise was memoised INCLUDING its failure, so after one blip every line was "not in the
 * manifest" until a reload. (2026-09-26: the index is now a module chunk loaded with import(), not /audio/…/manifest.json
 * — an offline device fails that import exactly as it failed the fetch, so the property is the same.)
 *
 * Properties checked (and no stronger ones):
 *  - after a failed index load, a call made once the retry window has passed loads it again and asks for the clip;
 *  - a call made INSIDE the window does not reload (an offline device is not asked on every line);
 *  - a successful index is loaded once and reused.
 */
import { it, expect, vi, beforeEach, afterEach } from 'vitest'
import { clipKey, clipCheck } from '@/core/voiceClips'

vi.mock('@/core/audioBase', () => ({ AUDIO_BASE: 'https://bucket.test/lesson-audio' }))

const LINE = 'Let us count the tens.'
const CLIP = 'https://bucket.test/lesson-audio/00112233445566ff.mp3'
const tick = () => new Promise(r => setTimeout(r, 0))

let now = 1_000_000
let online = true
const load = vi.fn(async () => {
  if (!online) throw new TypeError('Failed to fetch dynamically imported module')
  return { [clipKey(LINE)]: ['00112233445566ff', clipCheck(LINE)] as [string, string] }
})
const f = vi.fn(async (_u: string) => new Response('mp3'))
const clipCalls = () => f.mock.calls.filter(c => String(c[0]) === CLIP).length

let prefetchClips: (t: string[]) => void
beforeEach(async () => {
  vi.resetModules()
  now = 1_000_000; online = true; load.mockClear(); f.mockClear()
  vi.spyOn(Date, 'now').mockImplementation(() => now)
  vi.stubGlobal('fetch', f)
  const m = await import('@/infra/voiceClipPlayer')
  m.setSceneVoice('nzFihrBIvB34imQBuxub', load)
  prefetchClips = m.prefetchClips
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

it('a failed index load is retried by a later call once the window has passed, and the clip is asked for', async () => {
  online = false
  prefetchClips([LINE]); await tick()
  online = true
  now += 15_000
  prefetchClips([LINE]); await tick()
  expect(load).toHaveBeenCalledTimes(2)
  expect(clipCalls()).toBe(1)
})

it('inside the window a failure is not reloaded on every line', async () => {
  online = false
  prefetchClips([LINE]); await tick()
  now += 2_000
  prefetchClips([LINE]); await tick()
  prefetchClips([LINE]); await tick()
  expect(load).toHaveBeenCalledTimes(1)
})

it('POSITIVE CONTROL: a successful index is loaded once and reused, even long after', async () => {
  prefetchClips([LINE]); await tick()
  now += 60_000
  prefetchClips([LINE]); await tick()
  prefetchClips([LINE]); await tick()
  expect(load).toHaveBeenCalledTimes(1)
  expect(clipCalls()).toBe(3)
})
