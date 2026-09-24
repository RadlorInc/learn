/**
 * ONE LINE, ONE VOICE. Production, 2026-09-24 (lesson g3m1-t1): the browser's speech said the start of a line, then
 * the recorded clip said the same line. A line settles once — clip or browser speech — and never both.
 *
 * `fallback` is what starts browser speech for the line, so "TTS played" = fallback was called. Expectations are
 * written out by hand; the clip keys come from `clipKey`, the same function the renderer used to name the files.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { clipKey } from '@/core/voiceClips'

const BAND = 'bandVoiceAAAAAAAAAAA', LESSON = 'lessonVoiceBBBBBBBBBB'
vi.mock('@/infra/storage/voicePref', () => ({ getVoicePref: () => 'bandVoiceAAAAAAAAAAA', BAND_VOICE: {} }))
vi.mock('@/data/supabase/useLearnerSession', () => ({ getActiveLearner: () => null }))

const LINE = 'Four plates, three cookies on each.'
const tick = (ms = 0) => new Promise(r => setTimeout(r, ms))

let fetched: string[]
let manifests: Record<string, { keys: string[]; delay?: number }>
let tts: { cancel: ReturnType<typeof vi.fn>; speak: ReturnType<typeof vi.fn> }
let play: ReturnType<typeof vi.spyOn>, pause: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.resetModules()                       // a fresh player: its manifests and its <audio> are per module
  fetched = []
  manifests = {}
  vi.stubGlobal('fetch', async (url: string) => {
    fetched.push(url)
    const voice = url.match(/^\/audio\/([^/]+)\/manifest\.json$/)?.[1]
    const m = voice ? manifests[voice] : undefined
    if (m?.delay) await tick(m.delay)
    return m ? { ok: true, json: async () => m.keys } : { ok: false, json: async () => [] }
  })
  tts = { cancel: vi.fn(), speak: vi.fn() }
  Object.defineProperty(window, 'speechSynthesis', { value: tts, configurable: true })
  pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

async function player() { return import('@/infra/voiceClipPlayer') }
function run(speakLine: (t: string, o: never) => () => void) {
  const out = { fallback: vi.fn(), onStart: vi.fn(), onDone: vi.fn() }
  speakLine(LINE, out as never)
  return out
}

describe('one line, one voice', () => {
  it('a SLOW clip is waited for: only the recorded voice plays, browser speech never starts', async () => {
    manifests[BAND] = { keys: [clipKey(LINE)] }
    play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => new Promise(r => setTimeout(r, 400)))
    const { speakLine } = await player()
    const out = run(speakLine as never)
    await tick(150)
    expect(out.fallback, 'browser speech started while the clip was still loading').not.toHaveBeenCalled()
    await tick(400)
    expect([out.onStart.mock.calls.length, out.fallback.mock.calls.length]).toEqual([1, 0])
  })

  it('a MISSING clip: only browser speech — no play(), and no request for stitching fragments', async () => {
    manifests[BAND] = { keys: ['somethingElse'] }
    play = vi.spyOn(HTMLMediaElement.prototype, 'play')
    const { speakLine } = await player()
    const out = run(speakLine as never)
    await tick(20)
    expect([out.fallback.mock.calls.length, play.mock.calls.length]).toEqual([1, 0])
    expect(fetched, 'the only request is the manifest (no /frag/fragments.json, no fragment-templates.json)').toEqual([`/audio/${BAND}/manifest.json`])
  })

  it('when the clip starts, any browser speech still sounding is cancelled — before the line reports it started', async () => {
    manifests[BAND] = { keys: [clipKey(LINE)] }
    const order: string[] = []
    tts.cancel.mockImplementation(() => { order.push('tts.cancel') })
    play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    const { speakLine } = await player()
    const out = { fallback: vi.fn(), onStart: vi.fn(() => { order.push('clip started') }) }
    speakLine(LINE, out)
    await tick(20)
    expect(order).toEqual(['tts.cancel', 'clip started'])
  })

  it('a clip that starts AFTER the line fell back to browser speech is stopped, never played over it', async () => {
    manifests[BAND] = { keys: [clipKey(LINE)] }
    let resolvePlay!: () => void
    play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => new Promise<void>(r => { resolvePlay = r }))
    const { speakLine } = await player()
    const out = run(speakLine as never)
    await tick(20)
    const el = play.mock.contexts[0] as HTMLAudioElement
    el.onerror?.(new Event('error'))           // a clear failure: the line goes to browser speech…
    expect(out.fallback).toHaveBeenCalledTimes(1)
    pause.mockClear()
    resolvePlay()                               // …and then the element starts anyway
    await tick(20)
    expect(out.onStart, 'the clip reported it started after the line was already spoken by the browser').not.toHaveBeenCalled()
    expect(pause).toHaveBeenCalled()
    expect(out.fallback).toHaveBeenCalledTimes(1)
  })

  it('a clip that fails AFTER it started has spoken: the line ends — it is not said again in browser speech', async () => {
    manifests[BAND] = { keys: [clipKey(LINE)] }
    play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    const { speakLine } = await player()
    const out = run(speakLine as never)
    await tick(20)
    expect(out.onStart).toHaveBeenCalledTimes(1)
    ;(play.mock.contexts[0] as HTMLAudioElement).onerror?.(new Event('error'))
    expect([out.fallback.mock.calls.length, out.onDone.mock.calls.length]).toEqual([0, 1])
  })

  it('a SLOW manifest for another voice cannot replace the lesson voice\'s keys (the race behind the 404s)', async () => {
    manifests[BAND] = { keys: [], delay: 200 }              // the child's home asked for the band voice first, slowly
    manifests[LESSON] = { keys: [clipKey(LINE)] }            // then the lesson's own voice, quickly
    play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    const { speakLine, setSceneVoice } = await player()
    const home = run(speakLine as never)                     // under the band voice
    setSceneVoice(LESSON)
    const lesson = run(speakLine as never)                   // under the lesson voice
    await tick(300)                                          // the band manifest lands LAST
    expect(home.fallback, 'control: the band voice has no clip for this line').toHaveBeenCalledTimes(1)
    expect([lesson.onStart.mock.calls.length, lesson.fallback.mock.calls.length]).toEqual([1, 0])
    expect(String((play.mock.contexts.at(-1) as HTMLAudioElement).src)).toContain(`/audio/${LESSON}/${clipKey(LINE)}.mp3`)
  })
})
