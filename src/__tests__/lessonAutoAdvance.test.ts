/**
 * A teaching screen moves on by itself once her last line is done (founder, 2026-09-19), and ← Back stops it pulling a
 * child forward. Rendered with the real LessonPlayer and driven like a child; the speaker is stubbed so a test decides
 * when her voice finishes — the case that matters is that the screen waits for the VOICE, not for a clock, when
 * audio is on.
 */
import { it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

const { steps } = vi.hoisted(() => ({ steps: [] as { onDone?: () => void }[] }))
vi.mock('@/infra/useMiloSpeaker', () => ({
  speak: () => {}, stopSpeech: () => {},
  speakSteps: (_: string[], opts: { onDone?: () => void }) => { steps.push(opts); return () => {} },
}))
vi.mock('@/infra/voiceClipPlayer', () => ({ setSceneVoice: () => {}, prefetchClips: () => {}, setClipRate: () => {} }))
vi.mock('@/infra/storage/lessonSync', () => ({ syncLesson: () => {}, syncModulePractice: () => {} }))
vi.mock('@/features/lessons/ScratchPad', () => ({ ScratchPad: () => null }))

import { LessonPlayer } from '@/features/lessons/LessonPlayer'
import { findLesson } from '@/features/lessons/modules'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const lesson = findLesson('g5m1-t1')!.lesson

let host: HTMLDivElement, root: Root
beforeEach(async () => {
  vi.useFakeTimers(); steps.length = 0
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
  await act(async () => { root.render(createElement(LessonPlayer, { lesson, onFinish: () => {}, onExit: () => {} })) })
})
afterEach(() => { act(() => root.unmount()); host.remove(); vi.useRealTimers() })

const screen = () => Number(host.textContent?.match(/Screen (\d) of 9/)?.[1])
const tap = (label: RegExp) => act(async () => {
  const b = [...host.querySelectorAll('button')].find(x => label.test(x.textContent ?? ''))
  if (!b) throw new Error(`no button ${label}`)
  b.click()
})
const wait = async (ms: number) => {
  // In steps: a screen's timers start when React renders it, so one jump of the clock would only ever move one screen.
  for (let t = 0; t < ms; t += 500) await act(async () => { vi.advanceTimersByTime(Math.min(500, ms - t)) })
}
const MINUTE = 60_000

it('Screen 1 waits for the child; a silent teaching screen moves on after its lines, and so does the next', async () => {
  await wait(MINUTE)
  expect(screen()).toBe(1)                       // the question on Screen 1 is the child's to tap
  await tap(/Let's see/)
  expect(screen()).toBe(2)
  await wait(3 * MINUTE)
  expect(screen()).toBe(7)                       // 2 → 3 → … → 7 on its own, one screen after another
  await wait(MINUTE)
  expect(screen()).toBe(7)                       // …and not on into "Your turn", which the child starts
})

it('with her voice on, the screen waits for the VOICE to finish, not for a clock', async () => {
  await tap(/Let's see/)
  await tap(/Read it to me/)
  await wait(MINUTE)
  expect(screen()).toBe(2)                       // still talking: however long it takes, the screen stays
  await act(async () => { steps.at(-1)!.onDone!() })
  await wait(2500)
  expect(screen()).toBe(2)                       // a moment to take in the finished board…
  await wait(1000)
  expect(screen()).toBe(3)                       // …then on
})

it('← Back stops the pull forward until the child taps Next', async () => {
  await tap(/Let's see/)
  await tap(/^Next$/)
  expect(screen()).toBe(3)
  await tap(/Back/)
  expect(screen()).toBe(2)
  await wait(MINUTE)
  expect(screen()).toBe(2)                       // went back to look again: left there
  await tap(/^Next$/)
  await wait(3 * MINUTE)
  expect(screen()).toBe(7)                       // Next turned it back on
})
