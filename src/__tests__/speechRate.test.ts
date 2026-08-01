import { describe, it, expect, beforeEach, vi } from 'vitest'

// The clip player owns a detached <audio>, so assert on the setter rather than the
// element: the bug worth guarding is the speed choice reaching ONLY the browser-TTS
// path and silently doing nothing for a learner on recorded clips.
const setClipRate = vi.fn()
vi.mock('@/infra/voiceClipPlayer', () => ({ setClipRate: (r: number) => setClipRate(r) }))

const { getSpeechRate, setSpeechRate, nextSpeechRate, speechRateLabel } =
  await import('@/infra/storage/speechRate')

describe('speech speed (a tester asked to slow Milo down / re-hear him)', () => {
  beforeEach(() => { localStorage.clear(); setClipRate.mockClear() })

  it('defaults to normal speed', () => {
    expect(getSpeechRate()).toBe(1)
  })

  it('remembers the choice, so it is picked once and not per chapter', () => {
    setSpeechRate(0.75)
    expect(getSpeechRate()).toBe(0.75)
  })

  it('cycles normal → slower → faster → normal, slower FIRST', () => {
    const a = nextSpeechRate(1)
    expect(a).toBe(0.75)                       // the direction people actually ask for
    const b = nextSpeechRate(a)
    expect(b).toBe(1.25)
    expect(nextSpeechRate(b)).toBe(1)
  })

  it('drives the recorded-clip path too, not just browser speech', () => {
    setSpeechRate(0.75)
    expect(setClipRate).toHaveBeenCalledWith(0.75)
    setClipRate.mockClear()
    getSpeechRate()                            // a returning learner, before any tap
    expect(setClipRate).toHaveBeenCalledWith(0.75)
  })

  it('ignores a junk stored value rather than speaking at NaN', () => {
    localStorage.setItem('milo-speech-rate', '9')
    expect(getSpeechRate()).toBe(1)
    expect(speechRateLabel(1)).toBe('Normal')
  })
})
