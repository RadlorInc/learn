/**
 * MAP-04 — A CHILD'S NAME IS NEVER SPOKEN BY A NETWORK VOICE.
 *
 * `/menu` says "Welcome back, <first name>!" and ChapterDone says "All done, <first name>!". Neither
 * has a recorded clip, so both go to the browser's `speechSynthesis`. A voice with
 * `localService: false` (Chrome's "Google US English", Edge's "… Online (Natural)") is synthesised
 * on the vendor's server, i.e. the name leaves the device to a party not in our subprocessor list.
 *
 * PROPERTY CHECKED: every utterance handed to `speechSynthesis.speak` carries a voice whose
 * `localService` is true — on all three browser paths (speak, speakSeq, speakWithHighlight).
 * An utterance with NO voice set also fails it, because the engine then uses its default voice,
 * which on a network-only device is a network voice. Not checked: what a real browser's default is.
 *
 * Red on the old picker: with only a network voice listed it chose "Google US English".
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

// No clips in this world: every line falls through to browser speech, which is where the name goes.
vi.mock('@/infra/voiceClipPlayer', () => ({
  setClipRate: () => {},
  unlockVoiceClips: () => {},
  stopClip: () => {},
  speakLine: (_t: string, o: { fallback: () => void }) => { o.fallback(); return () => {} },
}))

type FakeVoice = { name: string; lang: string; localService: boolean; default: boolean; voiceURI: string }
const voice = (name: string, localService: boolean): FakeVoice =>
  ({ name, lang: 'en-US', localService, default: false, voiceURI: name })

const NETWORK = voice('Google US English', false)
const LOCAL = voice('Samantha', true)

type Utt = { text: string; voice: FakeVoice | null }
let SPOKEN: Utt[] = []

class FakeUtterance {
  text: string; voice: FakeVoice | null = null
  rate = 1; pitch = 1; volume = 1; lang = ''
  onstart?: () => void; onend?: () => void; onerror?: () => void; onboundary?: () => void
  constructor(t: string) { this.text = t }
}

function install(voices: FakeVoice[]) {
  SPOKEN = []
  ;(globalThis as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = FakeUtterance
  ;(window as unknown as { speechSynthesis: unknown }).speechSynthesis = {
    speak: (u: FakeUtterance) => { SPOKEN.push({ text: u.text, voice: u.voice }); setTimeout(() => u.onend?.(), 5) },
    cancel: () => {}, getVoices: () => voices, addEventListener: () => {}, removeEventListener: () => {},
    resume: () => {}, speaking: false, pending: false, paused: false,
  }
}

// Fresh module per test: the speaker caches the voice list at module level.
async function speaker() {
  vi.resetModules()
  return import('@/infra/useMiloSpeaker')
}

const wait = (ms: number) => new Promise(r => setTimeout(r, ms))
const NAME_LINE = 'Welcome back, Ava! Ready to continue Counting?'

beforeEach(() => { SPOKEN = [] })

describe('only an on-device voice ever speaks (MAP-04)', () => {
  it('speak(): with only a network voice, the name line is not handed to it (nor to the default voice)', async () => {
    install([NETWORK])
    const s = await speaker()
    s.speak(NAME_LINE)
    await wait(400)
    expect(SPOKEN.filter(u => !u.voice?.localService)).toEqual([])
  })

  it('speakSeq(): same rule', async () => {
    install([NETWORK])
    const s = await speaker()
    s.speakSeq(['All done, Ava!', 'Nice work.'])
    await wait(3000)
    expect(SPOKEN.filter(u => !u.voice?.localService)).toEqual([])
  }, 10000)

  it('speakWithHighlight(): same rule', async () => {
    install([NETWORK])
    const s = await speaker()
    s.speakWithHighlight('All done, Ava!', { onWord: () => {} })
    await wait(400)
    expect(SPOKEN.filter(u => !u.voice?.localService)).toEqual([])
  })

  it('a voice list that is still loading is not treated as "speak with the default"', async () => {
    install([])
    const s = await speaker()
    s.speak(NAME_LINE)
    await wait(1500)
    expect(SPOKEN).toEqual([])
  })

  // ── positive controls: the fix must not silence a device that HAS a local voice ──
  it('control: a local voice is chosen over a network one, and the line IS spoken', async () => {
    install([NETWORK, LOCAL])
    const s = await speaker()
    s.speak(NAME_LINE)
    await wait(400)
    expect(SPOKEN.map(u => [u.text, u.voice?.name])).toEqual([[NAME_LINE, 'Samantha']])
  })

  it('a list that arrives late is still used once it arrives (not spoken early with the default voice)', async () => {
    const list: FakeVoice[] = []
    install(list)
    const s = await speaker()
    s.speak(NAME_LINE)
    await wait(250)
    list.push(LOCAL)
    await wait(400)
    expect(SPOKEN.map(u => [u.text, u.voice?.name])).toEqual([[NAME_LINE, 'Samantha']])
  })
})
