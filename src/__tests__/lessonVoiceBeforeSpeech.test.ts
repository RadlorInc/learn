/**
 * A LESSON NEVER SPEAKS BEFORE ITS VOICE IS SET (handoff: "LessonPlayer sets its voice in a useEffect; whether a lesson
 * speaks from a mount effect before the voice is set is unmeasured"). If it did, that first line would go to the device
 * voice (or the wrong scene's clips) instead of the grade's recorded voice. This records the order on the REAL
 * LessonPlayer: every speech call, and every setSceneVoice, in one log.
 *
 * Driven: a normal open (Screen 1's line), and "Practice again" (practiceFirst, which starts practice in a layout
 * effect — before any passive effect, so the riskiest path).
 */
import { it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

const log: string[] = []
vi.mock('@/infra/useMiloSpeaker', () => ({
  speak: (t: string) => { log.push(`speak:${t}`) },
  stopSpeech: () => {},
  speakSteps: (lines: string[]) => { log.push(`speak:${lines[0]}`); return () => {} },
}))
vi.mock('@/infra/voiceClipPlayer', () => ({
  setSceneVoice: (v: string | null) => { log.push(v ? 'voice:set' : 'voice:clear') },
  prefetchClips: () => {}, setClipRate: () => {},
}))
vi.mock('@/infra/storage/lessonSync', () => ({ syncLesson: () => {}, syncRun: () => {}, syncModulePractice: () => {} }))
vi.mock('@/features/lessons/ScratchPad', () => ({ ScratchPad: () => null }))

import { LessonPlayer } from '@/features/lessons/LessonPlayer'
import { findLesson } from '@/features/lessons/modules'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let host: HTMLDivElement, root: Root
beforeEach(() => { log.length = 0; localStorage.clear(); host = document.createElement('div'); document.body.append(host); root = createRoot(host) })
afterEach(() => { act(() => root.unmount()); host.remove() })

const firstSpeech = () => log.findIndex(e => e.startsWith('speak:'))

it('a normal open: Screen 1 is spoken, and only after the voice is set', async () => {
  const lesson = findLesson('g5m1-t1')!.lesson
  await act(async () => { root.render(createElement(LessonPlayer, { lesson, onFinish: () => {}, onExit: () => {} })) })
  expect(firstSpeech(), `positive control: the lesson said nothing on open — ${JSON.stringify(log)}`).toBeGreaterThanOrEqual(0)
  expect(log.slice(0, firstSpeech()), 'the lesson spoke before its voice was set').toContain('voice:set')
})

it('Practice again: its first problem is spoken, and only after the voice is set', async () => {
  const lesson = findLesson('g5m1-t1')!.lesson
  await act(async () => { root.render(createElement(LessonPlayer, { lesson, practiceFirst: true, onFinish: () => {}, onExit: () => {} })) })
  // Measured 2026-10-06: practice opens by reading its first problem aloud.
  expect(firstSpeech(), `positive control: practice said nothing on open — ${JSON.stringify(log)}`).toBeGreaterThanOrEqual(0)
  expect(log.slice(0, firstSpeech()), 'practice spoke before the voice was set').toContain('voice:set')
})
