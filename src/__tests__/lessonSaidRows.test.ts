/**
 * Her words on the right of a teaching screen: two sums in one line ("10 − 5 = 5. 9 − 7 = 2.") go on two rows, because
 * on one row "5. 9" reads as the decimal 5.9 (a paid tester, g6m3-t1 Screen 5, 8 Oct 2026). Rendered with the real
 * LessonPlayer and driven to that screen like a child; the speaker is stubbed so the test says when each line is reached.
 */
import { it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

const { steps } = vi.hoisted(() => ({ steps: [] as { lines: string[]; onDone?: () => void; onStep?: (i: number) => void }[] }))
vi.mock('@/infra/useMiloSpeaker', () => ({
  speak: () => {}, stopSpeech: () => {},
  speakSteps: (lines: string[], opts: { onDone?: () => void; onStep?: (i: number) => void }) => { steps.push({ ...opts, lines }); return () => {} },
}))
vi.mock('@/infra/voiceClipPlayer', () => ({ setSceneVoice: () => {}, prefetchClips: () => {}, setClipRate: () => {} }))
vi.mock('@/infra/storage/lessonSync', () => ({ syncLesson: () => {}, syncModulePractice: () => {} }))
vi.mock('@/features/lessons/ScratchPad', () => ({ ScratchPad: () => null }))

import { LessonPlayer } from '@/features/lessons/LessonPlayer'
import { findLesson } from '@/features/lessons/modules'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let host: HTMLDivElement, root: Root
beforeEach(async () => {
  vi.useFakeTimers(); steps.length = 0
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
  await act(async () => { root.render(createElement(LessonPlayer, { lesson: findLesson('g6m3-t1')!.lesson, onFinish: () => {}, onExit: () => {} })) })
})
afterEach(() => { act(() => root.unmount()); host.remove(); vi.useRealTimers() })

const screen = () => Number(host.textContent?.match(/Screen (\d) of 9/)?.[1])
const wait = async (ms: number) => { for (let t = 0; t < ms; t += 250) await act(async () => { vi.advanceTimersByTime(250) }) }
/** The paragraph of hers that holds `words`, as the rows it is drawn in. */
const rowsOf = (words: string) => {
  const p = [...host.querySelectorAll('p')].find(x => x.textContent?.includes(words))
  if (!p) throw new Error(`no line with "${words}" on Screen ${screen()}`)
  return { rows: [...p.children].map(c => [c.textContent, getComputedStyle(c).display]), text: p.textContent }
}

it('g6m3-t1 Screen 5: "10 − 5 = 5." and "9 − 7 = 2." are two rows, and the line still reads as she says it', async () => {
  const b = [...host.querySelectorAll('button')].find(x => /Let's see/.test(x.textContent ?? ''))!
  await act(async () => { b.click() })
  while (screen() < 5) { await act(async () => { steps.at(-1)!.onDone!() }); await wait(1750) }
  expect(screen()).toBe(5)
  await act(async () => { steps.at(-1)!.onStep!(2) })        // she reaches her third line
  const { rows, text } = rowsOf('10 − 5 = 5.')
  expect(rows).toEqual([['10 − 5 = 5.', 'block'], [' 9 − 7 = 2.', 'block']])
  expect(text).toBe('10 − 5 = 5. 9 − 7 = 2.')
  // A sentence that ends on a number and goes on in words stays on its row.
  expect(rowsOf("Start at the right.").rows).toEqual([["Start at the right. 0 − 5 won't go.", 'block']])
})
