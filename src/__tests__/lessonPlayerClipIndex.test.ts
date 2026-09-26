/**
 * The WIRE from a lesson to its module's clip index (review, 2026-09-26). LessonPlayer hands the player
 * `VOICE_INDEX[<module of the lesson>]` with the scene voice; if that wire is wrong — the full lesson id instead of the
 * module, the argument dropped — `_indexLoad` is null and EVERY line of EVERY lesson is device speech, with every unit
 * test of the player still green (they hand it an index themselves). So this renders the REAL LessonPlayer with the REAL
 * player and the REAL generated index, and watches what it asks the network for.
 *
 * Expected values are written by hand: the first teaching beat of g5m1-t1 is "You could add 40, ten times." and its
 * object is fe4f42466b64dbc8.mp3 (looked up 2026-09-26 from scripts/audio/manifest.json).
 */
import { it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

vi.mock('@/infra/useMiloSpeaker', () => ({ speak: () => {}, stopSpeech: () => {}, speakSteps: () => () => {} }))
vi.mock('@/infra/storage/lessonSync', () => ({ syncLesson: () => {}, syncModulePractice: () => {} }))
vi.mock('@/features/lessons/ScratchPad', () => ({ ScratchPad: () => null }))
vi.mock('@/core/audioBase', () => ({ AUDIO_BASE: 'https://bucket.test/lesson-audio' }))

import { LessonPlayer } from '@/features/lessons/LessonPlayer'
import { findLesson } from '@/features/lessons/modules'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let host: HTMLDivElement, root: Root, requests: string[]
beforeEach(() => {
  requests = []
  vi.stubGlobal('fetch', async (u: string) => { requests.push(String(u)); return { ok: true } })
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
})
afterEach(() => { act(() => root.unmount()); host.remove(); vi.unstubAllGlobals() })

it("a lesson prefetches its clips from the bucket through its own module's index", async () => {
  const lesson = findLesson('g5m1-t1')!.lesson
  await act(async () => { root.render(createElement(LessonPlayer, { lesson, onFinish: () => {}, onExit: () => {} })) })
  await vi.waitFor(() => expect(requests, 'the lesson asked for no clip at all').toContain('https://bucket.test/lesson-audio/fe4f42466b64dbc8.mp3'))
  expect(requests.length, 'positive control: the whole lesson was prefetched, not one line').toBeGreaterThan(15)
  expect(requests.filter(u => !/^https:\/\/bucket\.test\/lesson-audio\/[0-9a-f]{16}\.mp3$/.test(u))).toEqual([])
})
