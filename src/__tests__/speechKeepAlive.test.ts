/**
 * PERF-11: the browser-TTS keep-alive interval must never be left running behind a newer one.
 *
 * `_actuallySpeak`'s `onstart` starts a 5 s `setInterval` that nudges a paused `speechSynthesis`.
 * If a second line starts while the first is still flagged as speaking (its `onend` never came —
 * Chrome drops it after `cancel()`), the second `onstart` must replace the interval, not add one.
 * Property checked: after two lines start back to back, exactly ONE keep-alive interval is live.
 * (It does not check what the interval does, only how many exist.)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// No recorded clip: every line takes the browser-speech fallback, which is the path under test.
vi.mock('@/infra/voiceClipPlayer', () => ({
  setClipRate: () => {},
  unlockVoiceClips: () => {},
  stopClip: () => {},
  speakLine: (_t: string, opts: { fallback: () => void }) => { opts.fallback(); return () => {} },
}))

import { speak } from '@/infra/useMiloSpeaker'

const utterances: SpeechSynthesisUtterance[] = []
const live = new Set<unknown>()

beforeEach(() => {
  vi.useFakeTimers()
  utterances.length = 0
  live.clear()
  ;(globalThis as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance =
    class { text: string; constructor(t: string) { this.text = t } }
  ;(window as unknown as { speechSynthesis: unknown }).speechSynthesis = {
    speak: (u: SpeechSynthesisUtterance) => { utterances.push(u) },
    cancel: () => {},   // like Chrome after cancel(): no onend for the line it dropped
    // One ON-DEVICE voice: #237 (MAP-04) refuses to speak without one, and this test is about the interval, not the voice.
    getVoices: () => [{ name: 'Samantha', lang: 'en-US', localService: true, default: true, voiceURI: 'Samantha' }],
    addEventListener: () => {},
    speaking: false, pending: false, paused: false,
  }
  const realSet = globalThis.setInterval
  const realClear = globalThis.clearInterval
  vi.spyOn(globalThis, 'setInterval').mockImplementation(((fn: () => void, ms?: number) => {
    const id = realSet(fn, ms); live.add(id); return id
  }) as typeof setInterval)
  vi.spyOn(globalThis, 'clearInterval').mockImplementation(((id?: unknown) => {
    live.delete(id); realClear(id as ReturnType<typeof setInterval>)
  }) as typeof clearInterval)
})

afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })

describe('speech keep-alive', () => {
  it('two lines starting back to back leave exactly one keep-alive interval', () => {
    speak('First line.')
    vi.advanceTimersByTime(200)
    expect(utterances.length, 'the first line never reached speechSynthesis.speak').toBe(1)
    utterances[0]!.onstart?.({} as SpeechSynthesisEvent)
    expect(live.size).toBe(1)

    speak('Second line.')
    vi.advanceTimersByTime(200)
    expect(utterances.length, 'the second line never reached speechSynthesis.speak').toBe(2)
    utterances[1]!.onstart?.({} as SpeechSynthesisEvent)
    expect(live.size, 'the first keep-alive interval was orphaned').toBe(1)
  })
})
