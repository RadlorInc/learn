/**
 * NO CHILD'S NAME CAN REACH AN AUDIO REQUEST (founder, 2026-09-26: "lines with {name} never reach the manifest").
 *
 * ⚠️ WHY "the named line is not in the corpus" IS NOT ENOUGH. clipKey is a 32-bit hash, and runtime lines collide with
 * real clips: 'All done, Carlos Tyler! Nice work.' — what ChapterDone says to a child called Carlos Tyler — has the key
 * f8ftt3, which is a REAL Grade 8 clip in g8m2's index (measured 2026-09-26). With key-only lookup that child would hear
 * a stranger's sentence and the device would request its object: a request made BECAUSE of the child's name. The player
 * therefore also compares clipCheck (a second, independent hash) before it requests anything.
 *
 * What is driven, and its twin (a blind instrument and a clean result must not look the same):
 *   A. the player, with the REAL g8m2 index: the real line that owns f8ftt3 plays its object (twin); the named line
 *      with the SAME key asks for nothing and is spoken by the device;
 *   B. the real screen — ChapterDone → useMiloSpeaker → the player — for a child called Carlos Tyler: nothing is
 *      requested, the device says the line; then, in the same world, a real lesson line IS requested (twin);
 *   C. every audio URL the player produced in A and B is `<base>/<16 hex>.mp3` — no voice, learner, grade or query.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { clipKey } from '@/core/voiceClips'
import { MODULES } from '@/features/lessons/modules'
import { SAY, START, hintsFor, wonFor, type Lesson } from '@/features/lessons/script'

vi.mock('@/core/audioBase', () => ({ AUDIO_BASE: 'https://bucket.test/lesson-audio' }))

const JOSH = 'nzFihrBIvB34imQBuxub'
const NAMED = 'All done, Carlos Tyler! Nice work.'
const KEY = 'f8ftt3'                              // measured 2026-09-26, written by hand
const OBJECT = 'https://bucket.test/lesson-audio/fb01327b488a22cb.mp3'   // g8m2's object for that key, by hand

const spoken = (l: Lesson): string[] => [
  ...l.screens.slice(1).flatMap(s => (s.beats ?? []).map(b => b.say)), l.bigIdea,
  SAY.screen(l.screens[0]), SAY.turn(l), SAY.twin(l), SAY.right, SAY.worked,
  ...hintsFor(l, { ...START, mode: 'turn' }), ...hintsFor(l, { ...START, mode: 'turn', twin: true }),
  wonFor(l, { ...START, mode: 'won' }).text, wonFor(l, { ...START, mode: 'won', twin: true }).text,
  wonFor(l, { ...START, mode: 'won', twin: true, misses: 3 }).text,
]
const REAL = MODULES.find(m => m.id === 'g8m2')!.lessons.flatMap(spoken).find(t => clipKey(t) === KEY)!

let requests: string[]
let utterances: string[]
const tick = (ms = 30) => new Promise(r => setTimeout(r, ms))

beforeEach(() => {
  vi.resetModules()
  requests = []; utterances = []
  vi.stubGlobal('fetch', async (u: string) => { requests.push(String(u)); return { ok: true } })
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) { requests.push(this.src); return Promise.resolve() })
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  // useMiloSpeaker returns before the player when there is no speechSynthesis, which would make every "asked for
  // nothing" below true for any line — so the device voice is really there.
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: { speak: (u: { text: string }) => { utterances.push(u.text) }, cancel: () => {}, getVoices: () => [{ name: 'Samantha', lang: 'en-US', localService: true }], speaking: false, pending: false, paused: false, addEventListener: () => {} },
  })
  vi.stubGlobal('SpeechSynthesisUtterance', class { text: string; onend: unknown; onerror: unknown; onstart: unknown; onboundary: unknown; constructor(t: string) { this.text = t } })
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('no child data in any audio request', () => {
  it('precondition: the named line really collides with a real clip (else this test would prove nothing)', () => {
    expect(clipKey(NAMED)).toBe(KEY)
    expect(REAL, 'the real g8m2 line that owns the key').toBeTruthy()
    expect(REAL).not.toBe(NAMED)
  })

  it('A. the real line plays its object; the named line with the SAME key asks for nothing', async () => {
    const { VOICE_INDEX } = await import('@/features/lessons/voice-index')
    const p = await import('@/infra/voiceClipPlayer')
    p.setSceneVoice(JOSH, VOICE_INDEX.g8m2)

    const real = vi.fn()
    p.speakLine(REAL, { fallback: real }); await tick()
    expect([requests, real.mock.calls.length], 'twin: the real line is requested and plays').toEqual([[OBJECT], 0])

    requests = []
    const named = vi.fn()
    p.speakLine(NAMED, { fallback: named })
    p.prefetchClips([NAMED]); await tick()
    expect(requests, 'a line carrying a name produced a request').toEqual([])
    expect(named).toHaveBeenCalledTimes(1)          // spoken by the device instead
  })

  it('B. ChapterDone for a child called Carlos Tyler requests nothing; a lesson line in the same world does', async () => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    const React = await import('react')
    const { createRoot } = await import('react-dom/client')
    const { VOICE_INDEX } = await import('@/features/lessons/voice-index')
    const p = await import('@/infra/voiceClipPlayer')
    const { useMiloSpeaker } = await import('@/infra/useMiloSpeaker')
    const { default: ChapterDone } = await import('@/shared/ui/ChapterDone')
    p.setSceneVoice(JOSH, VOICE_INDEX.g8m2)

    const host = document.createElement('div'); document.body.appendChild(host)
    const root = createRoot(host)
    await React.act(async () => {
      root.render(React.createElement(ChapterDone, { open: true, childName: 'Carlos Tyler', onPlayAgain: () => {}, onExit: () => {} }))
    })
    await tick(300)   // the browser path waits 100 ms after cancel() before it speaks (useMiloSpeaker._doSpeakBrowser)
    expect(requests, 'ChapterDone made an audio request for a named line').toEqual([])
    expect(utterances.some(t => t.includes('Carlos Tyler')), 'the device voice said the line (the drive really reached speech)').toBe(true)

    function Say() { const { speak } = useMiloSpeaker(); React.useEffect(() => { speak(REAL) }, [speak]); return null }
    await React.act(async () => { root.render(React.createElement(Say)) })
    await tick(80)
    expect(requests, 'twin: the same player, same index, a real line — it IS requested').toEqual([OBJECT])
    await React.act(async () => { root.unmount() }); host.remove()
  })

  it('C. an audio URL is the base and a 16-hex object name — nothing else', async () => {
    const { VOICE_INDEX } = await import('@/features/lessons/voice-index')
    const p = await import('@/infra/voiceClipPlayer')
    p.setSceneVoice(JOSH, VOICE_INDEX.g8m2)
    const lines = MODULES.find(m => m.id === 'g8m2')!.lessons.slice(0, 2).flatMap(spoken)
    p.prefetchClips(lines); await tick(80)
    expect(requests.length, 'positive control: it really prefetched').toBeGreaterThan(10)
    expect(requests.filter(u => !/^https:\/\/bucket\.test\/lesson-audio\/[0-9a-f]{16}\.mp3$/.test(u))).toEqual([])
  })
})
