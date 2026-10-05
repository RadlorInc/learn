/**
 * A clip that falls back to the device voice leaves ONE breadcrumb for the parent's diagnostic block — not one per line.
 * The ring keeps 3 entries (lastError.ts), so a lesson's worth of the same miss would push out the error that matters.
 * Expected values are written out by hand.
 */
import { it, expect, vi, beforeEach } from 'vitest'
import { clipKey, clipCheck } from '@/core/voiceClips'

vi.mock('@/core/audioBase', () => ({ AUDIO_BASE: 'https://bucket.test/lesson-audio' }))

import { speakLine, setSceneVoice } from '@/infra/voiceClipPlayer'
import { getRecentErrors } from '@/infra/storage/lastError'

const LINES = ['Now you try.', 'Count the apples.', 'Well done.']
const err = (name: string) => Object.assign(new Error(name), { name })

beforeEach(() => {
  localStorage.clear()
  setSceneVoice('nzFihrBIvB34imQBuxub', async () =>
    Object.fromEntries(LINES.map((l, i) => [clipKey(l), [`000000000000000${i}`, clipCheck(l)] as [string, string]])))
})

it('three lines refused by the browser fall back three times, and leave exactly one note naming the cause', async () => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.reject(err('NotAllowedError')))
  const fallback = vi.fn()
  for (const line of LINES) { speakLine(line, { fallback }); await new Promise(r => setTimeout(r, 20)) }
  expect(fallback, 'control: every line really fell back').toHaveBeenCalledTimes(3)
  expect(getRecentErrors().map(e => [e.src, e.msg])).toEqual([
    ['audio', 'voice clip fell back to device voice: play refused (NotAllowedError)'],
  ])
})
