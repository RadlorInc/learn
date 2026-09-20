/**
 * A teaching screen moves on by itself once her last line is done (founder, 2026-09-19), Screen 7 runs on into
 * "Your turn" (2026-09-20), and ← Back stops it pulling a child forward. Rendered with the real LessonPlayer and
 * driven like a child; the speaker is stubbed so a test decides when her voice finishes — the case that matters is
 * that the screen waits for the VOICE, not for a clock.
 */
import { it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

const { steps, said } = vi.hoisted(() => ({ steps: [] as { onDone?: () => void }[], said: [] as string[] }))
vi.mock('@/infra/useMiloSpeaker', () => ({
  speak: (t: string) => { said.push(t) }, stopSpeech: () => {},
  speakSteps: (_: string[], opts: { onDone?: () => void }) => { steps.push(opts); return () => {} },
}))
vi.mock('@/infra/voiceClipPlayer', () => ({ setSceneVoice: () => {}, prefetchClips: () => {}, setClipRate: () => {} }))
vi.mock('@/infra/storage/lessonSync', () => ({ syncLesson: () => {}, syncModulePractice: () => {} }))
vi.mock('@/features/lessons/ScratchPad', () => ({ ScratchPad: () => null }))

import { LessonPlayer } from '@/features/lessons/LessonPlayer'
import { findLesson } from '@/features/lessons/modules'
import { SAY } from '@/features/lessons/script'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const lesson = findLesson('g5m1-t1')!.lesson

let host: HTMLDivElement, root: Root
beforeEach(async () => {
  vi.useFakeTimers(); steps.length = 0; said.length = 0
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
  await act(async () => { root.render(createElement(LessonPlayer, { lesson, onFinish: () => {}, onExit: () => {} })) })
})
afterEach(() => { act(() => root.unmount()); host.remove(); vi.useRealTimers() })

const crumb = () => host.textContent?.match(/Screen \d of 9/)?.[0]
const screen = () => Number(crumb()?.match(/\d/)?.[0])
const tap = (label: RegExp) => act(async () => {
  const b = [...host.querySelectorAll('button')].find(x => label.test(x.textContent ?? ''))
  if (!b) throw new Error(`no button ${label} — have: ${[...host.querySelectorAll('button')].map(x => x.textContent).join(' | ')}`)
  b.click()
})
const wait = async (ms: number) => {
  for (let t = 0; t < ms; t += 250) await act(async () => { vi.advanceTimersByTime(Math.min(250, ms - t)) })
}
/** She finishes the line she is on. */
const voiceDone = () => act(async () => { steps.at(-1)!.onDone!() })

it('Screen 1 waits for the child; then each screen waits for her VOICE, not a clock, and moves on a moment later', async () => {
  await wait(60_000)
  expect(screen()).toBe(1)                       // the question on Screen 1 is the child's to tap
  await tap(/Let's see/)
  expect(screen()).toBe(2)
  await wait(60_000)
  expect(screen()).toBe(2)                       // still talking: however long she takes, the screen stays
  await voiceDone()
  await wait(1200)
  expect(screen()).toBe(2)                       // a moment to take in the finished board…
  await wait(500)
  expect(screen()).toBe(3)                       // …then on
})

it('the last teaching screen runs on into Your turn', async () => {
  await tap(/Let's see/)
  for (let i = 2; i <= 7; i++) { expect(screen()).toBe(i); await voiceDone(); await wait(1600) }
  expect(crumb()).toBe('Screen 8 of 9')          // Screen 7 does not stop and wait to be tapped through
})

it('← Back stops the pull forward until the child taps Next', async () => {
  await tap(/Let's see/)
  await voiceDone(); await wait(1600)
  expect(screen()).toBe(3)
  await tap(/Back/)
  expect(screen()).toBe(2)
  await voiceDone(); await wait(60_000)
  expect(screen()).toBe(2)                       // went back to look again: left there
  await tap(/^Next$/)
  expect(screen()).toBe(3)
  await voiceDone(); await wait(1600)
  expect(screen()).toBe(4)                       // Next turned it back on
})

it('the screen shows how far through it she is', async () => {
  await tap(/Let's see/)
  const bar = () => (host.querySelector('[aria-hidden] > div') as HTMLElement | null)?.style.width
  expect(bar()).toBe('33%')                      // 3 lines on this screen, the first one up
  await wait(60_000)
  expect(bar()).toBe('33%')                      // it follows her lines, not a clock
})

it('Screen 1 is spoken on arrival — it has no beats, so nothing else says it', async () => {
  expect(said).toEqual([SAY.screen(lesson.screens[0])])
  await tap(/Let's see/)
  await tap(/Back/)
  expect(screen()).toBe(1)
  expect(said.at(-1)).toBe(SAY.screen(lesson.screens[0]))   // and again when the child comes back to it
})
