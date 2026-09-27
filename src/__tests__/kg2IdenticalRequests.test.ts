/**
 * THE FOUNDER'S TEST (2026-09-27, docs/legal/AUDIO-ROUND2.md §1.5): the audio requests are IDENTICAL whichever option
 * the child taps. Driven end to end — the real SkillBeat, the real Nest Tree round, the real speaker, the real player and
 * the chapter's REAL clip index — so what is compared is what the storage bucket would see from this device.
 *
 * For each of the four nests, on the same round (same seed): mount, let the question load and speak, tap the nest,
 * press Ready, and record every request up to just before the next question is built (SkillBeat moves on 1300 ms after
 * a verdict). The four records must be equal, as lists.
 *
 * ⚠️ AND THE OTHER HALF, OR "IDENTICAL" COULD MEAN "NOTHING WAS SAID": a wrong nest's line must really be spoken by Josh
 * (a held clip, played from memory), and no line that HAS a clip may fall to the device voice. A player that made no
 * requests at all would pass the first half and fail this one.
 */
import { it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { clipKey, clipCheck } from '@/core/voiceClips'

vi.mock('@/core/audioBase', () => ({ AUDIO_BASE: 'https://bucket.test/lesson-audio' }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: () => {}, push: () => {} }) }))
vi.mock('@/data/supabase/useLearnerSession', () => ({ getActiveLearner: () => null }))
vi.mock('@/infra/storage/lessonSync', () => ({ syncLesson: () => {}, flushLessonSync: async () => {}, pullLessonProgress: async () => false }))
// The top tier, so the round offers FOUR nests (tier 1 offers two).
vi.mock('@/infra/storage/lessonStanding', async (orig) => ({ ...(await orig<object>()), loadStanding: () => ({ level: 3 }) }))
vi.mock('@/shared/ui/MiloPointer', () => ({ default: () => null }))

import { SkillBeat } from '@/features/chapters/story/StoryWorld'
import { makeNestBeat, WORLDS } from '@/features/chapters/story/NestTree'
import { setSceneVoice } from '@/infra/voiceClipPlayer'
import { JOSH } from '@/infra/storage/voicePref'
import { VOICE_INDEX } from '@/features/chapters/voice-index'
import { polyfillResizeObserver, seedRandom } from './_voiceCorpusKit'
import { WALK_TIMEOUT } from './_questionWalk'

vi.setConfig({ testTimeout: WALK_TIMEOUT })   // real renders; several times slower with the full suite in parallel

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
polyfillResizeObserver()

let host: HTMLDivElement, root: Root, requests: string[], memory: string[], device: string[]
const wait = (ms: number) => act(async () => { await new Promise(r => setTimeout(r, ms)) })

beforeEach(() => {
  requests = []; memory = []; device = []
  vi.stubGlobal('fetch', async (u: string) => { requests.push(String(u)); return { ok: true, blob: async () => new Blob([String(u)]) } })
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) {
    if (this.src.startsWith('data:')) memory.push(this.src); else requests.push(this.src)
    setTimeout(() => this.onended?.(new Event('ended')), 20)   // a clip that plays and ends, so the queue moves on
    return Promise.resolve()
  })
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {
      speak: (u: { text: string; onstart?: () => void; onend?: () => void }) => { device.push(u.text); setTimeout(() => { u.onstart?.(); u.onend?.() }, 20) },
      cancel: () => {}, getVoices: () => [{ name: 'Samantha', lang: 'en-US', localService: true }],
      speaking: false, pending: false, paused: false, addEventListener: () => {}, removeEventListener: () => {},
    },
  })
  vi.stubGlobal('SpeechSynthesisUtterance', class { text: string; onend: unknown; onerror: unknown; onstart: unknown; onboundary: unknown; constructor(t: string) { this.text = t } })
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
})
afterEach(() => { act(() => root.unmount()); host.remove(); setSceneVoice(null); vi.restoreAllMocks(); vi.unstubAllGlobals() })

const nests = () => [...host.querySelectorAll<HTMLButtonElement>('button[aria-label^="nest "]')]
const click = (el: Element) => act(async () => { (el as HTMLElement).click() })

/** One run: the same round, tapping nest `pick`. Returns every request, and what was said after the tap and how. */
async function answer(pick: number) {
  seedRandom(20260927)
  setSceneVoice(JOSH, VOICE_INDEX.numberRecognition)
  requests = []; memory = []; device = []
  await act(async () => { root.render(createElement(SkillBeat, { key: pick, beat: makeNestBeat(WORLDS[0]), onComplete: () => {} })) })
  await wait(1500)                                   // the question loads, its clips are fetched, the prompt is said
  const options = nests().map(b => b.getAttribute('aria-label'))
  const [heldBefore, deviceBefore] = [memory.length, device.length]
  await click(nests()[pick])
  const ready = [...host.querySelectorAll('button')].find(b => /Ready/.test(b.textContent ?? ''))
  if (ready) await click(ready)
  await wait(1200)                                   // < 1300 ms: the next question has not been built yet
  const r = { options, requests: [...requests], heldAfterTap: memory.length - heldBefore, deviceAfterTap: device.slice(deviceBefore) }
  await act(async () => { root.render(null) })
  return r
}

it('the requests are identical whichever of the four nests is tapped', async () => {
  const runs = [await answer(0), await answer(1), await answer(2), await answer(3)]
  // Positive controls: it really is one round with four options, and the question really asked for its clips.
  expect(runs[0].options).toHaveLength(4)
  for (const r of runs) expect(r.options).toEqual(runs[0].options)
  expect(runs[0].requests.length).toBeGreaterThan(4)
  for (const r of runs) expect(r.requests).toEqual(runs[0].requests)
})

it('…and Josh says the wrong nests\' lines from memory — no line that has a clip falls to the device voice', async () => {
  const index = await VOICE_INDEX.numberRecognition()
  const hasClip = (t: string) => index[clipKey(t)]?.[1] === clipCheck(t)
  let wrongRuns = 0
  for (const pick of [0, 1, 2, 3]) {
    const r = await answer(pick)
    expect(r.deviceAfterTap.filter(hasClip), `nest ${pick}: lines with a clip spoken by the device voice`).toEqual([])
    if (r.heldAfterTap > 0) wrongRuns++
  }
  // Three of the four nests are wrong, and each says "That's N. Find nest number T!" — in Josh, from memory.
  expect(wrongRuns).toBeGreaterThanOrEqual(3)
})
