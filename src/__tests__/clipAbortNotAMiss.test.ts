/**
 * A clip whose play() was ABORTED is not a missing clip.
 *
 * Every line plays through ONE shared <audio>, so the next line replaces the one before it — and the browser rejects
 * the replaced play() with AbortError. Read as "no clip", that fell back to browser speech: measured on production
 * 2026-09-20, Screen 8 said "Now you try…" in the robot voice while its clip was in the manifest and served 200.
 * A real refusal (NotAllowedError, no user gesture yet) must still fall back, or a first line is silent.
 */
import { it, expect, vi, beforeEach } from 'vitest'
import { clipKey } from '@/core/voiceClips'

vi.mock('@/infra/storage/voicePref', () => ({ getVoicePref: () => 'XjGYkUkzth8BPs29fmcV', BAND_VOICE: {} }))
vi.mock('@/data/supabase/useLearnerSession', () => ({ getActiveLearner: () => null }))

import { speakLine } from '@/infra/voiceClipPlayer'

const LINE = 'Now you try.'
const err = (name: string) => Object.assign(new Error(name), { name })

beforeEach(() => {
  vi.stubGlobal('fetch', async () => ({ ok: true, json: async () => [clipKey(LINE)] }))
})

/** The first play() rejects with `reason`; later ones succeed. Returns what happened to the line. */
const play = async (reason: Error) => {
  let plays = 0
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => (++plays === 1 ? Promise.reject(reason) : Promise.resolve()))
  const fallback = vi.fn()
  speakLine(LINE, { fallback })
  await new Promise(r => setTimeout(r, 20))
  return { plays, fellBack: fallback.mock.calls.length > 0 }
}

it('a play() aborted mid-flight plays the clip again instead of falling back to browser speech', async () => {
  expect(await play(err('AbortError'))).toEqual({ plays: 2, fellBack: false })
})

it('autoplay refused (no gesture yet) still falls back, or the first line would be silent', async () => {
  expect(await play(err('NotAllowedError'))).toEqual({ plays: 1, fellBack: true })
})
