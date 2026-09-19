/**
 * A lesson speaks in its RECORDED voice even on a device that once picked "device voice".
 *
 * Founder, 2026-09-19: "modules mein voice abhi bhi robotic sound kar rahi hai". The voice picker was deleted on
 * 2026-09-17, but a stored 'device' pick still won over the lesson's voice. That sent every line to browser speech,
 * and nothing left in the app could clear the setting.
 */
import { it, expect, vi } from 'vitest'
import { clipKey } from '@/core/voiceClips'

vi.mock('@/infra/storage/voicePref', () => ({ getVoicePref: () => 'device', BAND_VOICE: {} }))
vi.mock('@/data/supabase/useLearnerSession', () => ({ getActiveLearner: () => null }))

import { speakLine, setSceneVoice } from '@/infra/voiceClipPlayer'

it("a stored 'device' pick does not replace a lesson's recorded voice with browser speech", async () => {
  const line = 'Some numbers are bigger.'
  vi.stubGlobal('fetch', async () => ({ ok: true, json: async () => [clipKey(line)] }))
  const srcs: string[] = []
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) {
    srcs.push(this.src); return Promise.resolve()
  })
  const fallback = vi.fn()
  setSceneVoice('XjGYkUkzth8BPs29fmcV')
  speakLine(line, { fallback })
  await new Promise(r => setTimeout(r, 20))
  expect(fallback).not.toHaveBeenCalled()
  expect(srcs.some(s => s.endsWith(`/audio/XjGYkUkzth8BPs29fmcV/${clipKey(line)}.mp3`))).toBe(true)
})

it("outside a lesson, a stored 'device' pick still means browser speech (the control)", () => {
  const fallback = vi.fn()
  setSceneVoice(null)
  speakLine('Hello.', { fallback })
  expect(fallback).toHaveBeenCalled()
})
