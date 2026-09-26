/**
 * A lesson speaks in its RECORDED voice — and ONLY Josh is recorded (founder, 2026-09-26: Stevie and Teddy deleted).
 *
 * History: founder, 2026-09-19, "modules mein voice abhi bhi robotic sound kar rahi hai" — a stored 'device' pick beat
 * the lesson's voice, and the picker that set it had been deleted. The pick itself is gone now (voicePref.ts); what is
 * left to hold is below, each with its twin:
 *   · a Josh lesson with its index plays its clip (not device speech);
 *   · a deleted voice (Teddy, Stevie) as the scene voice, or no scene voice at all, is device speech with NO request of
 *     any kind — nothing may ever ask for a deleted voice's files (founder: "no 404s in the console").
 * Expectations are written out by hand.
 */
import { it, expect, vi, beforeEach, afterEach } from 'vitest'
import { clipKey, clipCheck } from '@/core/voiceClips'

vi.mock('@/core/audioBase', () => ({ AUDIO_BASE: 'https://bucket.test/lesson-audio' }))

import { speakLine, prefetchClips, setSceneVoice } from '@/infra/voiceClipPlayer'

const LINE = 'Some numbers are bigger.'
const index = async () => ({ [clipKey(LINE)]: ['fedcba9876543210', clipCheck(LINE)] as [string, string] })
let fetched: string[]
let srcs: string[]

beforeEach(() => {
  fetched = []; srcs = []
  vi.stubGlobal('fetch', async (u: string) => { fetched.push(String(u)); return { ok: true } })
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) { srcs.push(this.src); return Promise.resolve() })
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); setSceneVoice(null) })

it("a Josh lesson plays its recorded clip, from the bucket, and prefetches it (the positive twin)", async () => {
  const fallback = vi.fn()
  setSceneVoice('nzFihrBIvB34imQBuxub', index)
  speakLine(LINE, { fallback })
  prefetchClips([LINE])
  await new Promise(r => setTimeout(r, 20))
  expect(fallback).not.toHaveBeenCalled()
  expect(srcs).toEqual(['https://bucket.test/lesson-audio/fedcba9876543210.mp3'])
  expect(fetched).toEqual(['https://bucket.test/lesson-audio/fedcba9876543210.mp3'])
})

it.each([
  ['Teddy', 'XjGYkUkzth8BPs29fmcV'],
  ['Stevie', 'IvUJKFyjVb5hItY9dJAT'],
])('a deleted voice (%s) as the scene voice is device speech, and asks for nothing', async (_n, id) => {
  const fallback = vi.fn()
  setSceneVoice(id, index)
  speakLine(LINE, { fallback })
  prefetchClips([LINE])
  await new Promise(r => setTimeout(r, 20))
  expect(fallback).toHaveBeenCalledTimes(1)
  expect([fetched, srcs]).toEqual([[], []])
})

it('outside a lesson (no scene voice — a 3–5 child, a stale stored pick, anything) it is device speech, and asks for nothing', async () => {
  const fallback = vi.fn()
  setSceneVoice(null)
  speakLine('Hello.', { fallback })
  prefetchClips(['Hello.'])
  await new Promise(r => setTimeout(r, 20))
  expect(fallback).toHaveBeenCalledTimes(1)
  expect([fetched, srcs]).toEqual([[], []])
})
