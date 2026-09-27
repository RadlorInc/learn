/**
 * ONE LINE, ONE VOICE. Production, 2026-09-24 (lesson g3m1-t1): the browser's speech said the start of a line, then
 * the recorded clip said the same line. A line settles once — clip or browser speech — and never both.
 *
 * `fallback` is what starts browser speech for the line, so "TTS played" = fallback was called. Expectations are
 * written out by hand; keys and checks come from `clipKey` / `clipCheck`, the functions the corpus is built with.
 * (2026-09-26: the clip list is a per-module index handed over with the scene voice, and clips live on the audio
 * bucket — AUDIO_BASE is mocked to a hand-written base here, since jsdom has no Supabase env.)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { clipKey, clipCheck } from '@/core/voiceClips'

vi.mock('@/core/audioBase', () => ({ AUDIO_BASE: 'https://bucket.test/storage/v1/object/public/lesson-audio' }))

const JOSH = 'nzFihrBIvB34imQBuxub'
const LINE = 'Four plates, three cookies on each.'
const NAME = '0123456789abcdef'   // an object name, written by hand
const tick = (ms = 0) => new Promise(r => setTimeout(r, ms))
const indexOf = (lines: string[], delay = 0) => async () => { if (delay) await tick(delay); return Object.fromEntries(lines.map(t => [clipKey(t), [NAME, clipCheck(t)] as [string, string]])) }

let fetched: string[]
let tts: { cancel: ReturnType<typeof vi.fn>; speak: ReturnType<typeof vi.fn> }
let play: ReturnType<typeof vi.spyOn>, pause: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.resetModules()                       // a fresh player: its indexes and its <audio> are per module
  fetched = []
  vi.stubGlobal('fetch', async (url: string) => { fetched.push(url); return { ok: true } })
  tts = { cancel: vi.fn(), speak: vi.fn() }
  Object.defineProperty(window, 'speechSynthesis', { value: tts, configurable: true })
  pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

async function player(index = indexOf([LINE])) {
  const p = await import('@/infra/voiceClipPlayer')
  p.setSceneVoice(JOSH, index)
  return p
}
function run(speakLine: (t: string, o: never) => () => void) {
  const out = { fallback: vi.fn(), onStart: vi.fn(), onDone: vi.fn() }
  speakLine(LINE, out as never)
  return out
}

describe('one line, one voice', () => {
  it('a SLOW clip is waited for: only the recorded voice plays, browser speech never starts', async () => {
    play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => new Promise(r => setTimeout(r, 400)))
    const { speakLine } = await player()
    const out = run(speakLine as never)
    await tick(150)
    expect(out.fallback, 'browser speech started while the clip was still loading').not.toHaveBeenCalled()
    await tick(400)
    expect([out.onStart.mock.calls.length, out.fallback.mock.calls.length]).toEqual([1, 0])
    expect(String((play.mock.contexts[0] as HTMLAudioElement).src)).toBe(`https://bucket.test/storage/v1/object/public/lesson-audio/${NAME}.mp3`)
  })

  it('a MISSING clip: only browser speech — no play(), and no request of any kind', async () => {
    play = vi.spyOn(HTMLMediaElement.prototype, 'play')
    const { speakLine } = await player(indexOf(['Some other line.']))
    const out = run(speakLine as never)
    await tick(20)
    expect([out.fallback.mock.calls.length, play.mock.calls.length]).toEqual([1, 0])
    expect(fetched, 'a miss asks for nothing (no manifest, no /frag/fragments.json, no clip)').toEqual([])
  })

  it('when the clip starts, any browser speech still sounding is cancelled — before the line reports it started', async () => {
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
    play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    const { speakLine } = await player()
    const out = run(speakLine as never)
    await tick(20)
    expect(out.onStart).toHaveBeenCalledTimes(1)
    ;(play.mock.contexts[0] as HTMLAudioElement).onerror?.(new Event('error'))
    expect([out.fallback.mock.calls.length, out.onDone.mock.calls.length]).toEqual([0, 1])
  })

  it("a SLOW index for another module cannot replace this module's clips (the race behind the 2026-09-24 404s)", async () => {
    const slowOther = indexOf([], 200), mine = indexOf([LINE])   // the previous module's index, slowly; this one's, quickly
    play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    const { speakLine, setSceneVoice } = await player(slowOther)
    const before = run(speakLine as never)                          // under the previous module
    setSceneVoice(JOSH, mine)
    const lesson = run(speakLine as never)                          // under this module
    await tick(300)                                                 // the other index lands LAST
    expect(before.fallback, 'control: the other module has no clip for this line').toHaveBeenCalledTimes(1)
    expect([lesson.onStart.mock.calls.length, lesson.fallback.mock.calls.length]).toEqual([1, 0])
    const next = run(speakLine as never)                            // a later line, after the slow index landed
    await tick(20)
    expect([next.onStart.mock.calls.length, next.fallback.mock.calls.length], 'a later line fell back to browser speech').toEqual([1, 0])
  })
})
