/**
 * The WIRE from /game to the playing chapter's clip index (KG–2 rebuild, 2026-09-27) — lessonPlayerClipIndex.test.ts's
 * twin for chapters. /game hands the player JOSH and `features/chapters/voice-index[<playing chapter>]`; if that wire is
 * cut (the index dropped, the wrong chapter's, JOSH alone) every line of every KG–2 chapter is device speech while every
 * unit test of the player stays green, because those hand it an index themselves.
 *
 * So this renders the REAL /game page with the REAL speaker, player and generated chapter index. What is stubbed: the
 * route's plumbing (router, auth, entitlement, sync) and the chapter itself — a stand-in that says one real line of the
 * chapter on mount, because mounting MeasureIt needs a canvas and layout jsdom does not have. The drive through a real
 * chapter in a real browser is the Playwright drive in the rebuild's report, not this file.
 * ⚠️ The stand-in mounts in the SAME commit as the page (auth and entitlement answer at once here) — harsher than the real
 * app, where the auth check delays the chapter. It is what showed the wire must be a layout effect: with useEffect the
 * chapter's own mount effect ran first and the line went to the device (measured 2026-09-27).
 *
 * Expected values are written by hand: "4. The sunflower is 4 blocks tall." is measurement's alone (key hsjnug), and its
 * object is 1a11c30ab68a845d.mp3 (looked up 2026-09-27 in scripts/audio/manifest.json).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createElement, act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'

const LINE = '4. The sunflower is 4 blocks tall.'
const OBJECT = 'https://bucket.test/lesson-audio/1a11c30ab68a845d.mp3'
let chapter = 'measurement'
let endCard = false

vi.mock('@/core/audioBase', () => ({ AUDIO_BASE: 'https://bucket.test/lesson-audio' }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: () => {}, replace: () => {} }),
  useSearchParams: () => new URLSearchParams(`c=${chapter}`),
}))
vi.mock('@/data/supabase/useAuthGuard', () => ({ useAuthGuard: () => 'authed' }))
vi.mock('@/features/billing/useTopicGate', () => ({ useTopicGate: () => 'allowed' }))
vi.mock('@/data/supabase/useChapterSync', () => ({ useChapterSync: () => ({ flushQueue: () => {}, finishAndSync: () => {} }) }))
vi.mock('@/data/supabase/useLearnerSession', () => ({ getActiveLearner: () => null }))
vi.mock('@/infra/analytics', () => ({ track: () => {} }))
vi.mock('@/shared/ui/MiloPointer', () => ({ default: () => null }))
vi.mock('@/features/chapters/registry', async () => {
  const { useMiloSpeaker } = await import('@/infra/useMiloSpeaker')
  function SaysOneLine() {
    const { speak } = useMiloSpeaker()
    useEffect(() => { speak(LINE) }, [speak])
    return null
  }
  // The end-card stand-in forwards childName exactly as ChapterPortal and CountingStoryChapter do.
  const { default: ChapterDone } = await import('@/shared/ui/ChapterDone')
  const EndsAtOnce = ({ childName }: { childName: string }) =>
    createElement(ChapterDone, { open: true, childName, onPlayAgain: () => {}, onExit: () => {} })
  return { CHAPTER_COMPONENTS: new Proxy({}, { get: () => (endCard ? EndsAtOnce : SaysOneLine) }) }
})

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let host: HTMLDivElement, root: Root, requests: string[], utterances: string[]
beforeEach(() => {
  requests = []; utterances = []
  vi.stubGlobal('fetch', async (u: string) => { requests.push(String(u)); return { ok: true } })
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) { requests.push(this.src); return Promise.resolve() })
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  // useMiloSpeaker returns before the player when there is no speechSynthesis, which would make "asked for nothing"
  // true for any line — so the device voice is really there.
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: { speak: (u: { text: string }) => { utterances.push(u.text) }, cancel: () => {}, getVoices: () => [{ name: 'Samantha', lang: 'en-US', localService: true }], speaking: false, pending: false, paused: false, addEventListener: () => {} },
  })
  vi.stubGlobal('SpeechSynthesisUtterance', class { text: string; onend: unknown; onerror: unknown; onstart: unknown; onboundary: unknown; constructor(t: string) { this.text = t } })
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
})
afterEach(() => { act(() => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

async function play(id: string, ends = false) {
  chapter = id; endCard = ends
  const { default: GamePage } = await import('@/app/game/page')
  await act(async () => { root.render(createElement(GamePage)) })
}

describe('/game plays a chapter line from the bucket through that chapter’s own index', () => {
  it('measurement: the line is requested as its bucket object, not spoken by the device', async () => {
    await play('measurement')
    await vi.waitFor(() => expect(requests, 'the chapter asked for no clip at all').toEqual([OBJECT]))
    expect(utterances).toEqual([])
  })

  it('twin: the same line in a chapter whose index does not list it is device speech, with no request', async () => {
    // Also what a wire handing every chapter the same index (or the lesson index) would get wrong.
    await play('time')
    await vi.waitFor(() => expect(utterances, 'the device voice said the line (the drive really reached speech)').toContain(LINE))
    expect(requests).toEqual([])
  })

  // The end card with no active learner (getActiveLearner → null above). /game passed childName 'friend', so ChapterDone
  // said "All done, friend! Nice work." — no clip, device speech — and its recorded line "All done! Nice work." (key 441d0t,
  // object 34e9a943972b32ef.mp3, looked up by hand 2026-09-27 in scripts/audio/manifest.json) could never be requested.
  it('the end card with no learner is the recorded line, requested from the bucket', async () => {
    await play('time', true)
    await vi.waitFor(() => expect(requests, 'the end card asked for no clip').toEqual(['https://bucket.test/lesson-audio/34e9a943972b32ef.mp3']))
    expect(utterances).toEqual([])
  })
})
