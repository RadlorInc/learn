/**
 * Screen 9's sticker, one sentence a row: "The fair share is called the mean. Mean = total ÷ how many." ran on as one
 * line, the rule starting mid-row (a paid tester, g6m7-t1 Screen 9, 11 Oct 2026). The real LessonPlayer is driven to
 * Screen 9 like a child (the 12th practice answer, then Take a break); the expected rows are written out by hand.
 * Only the network and the voice are replaced.
 */
import { it, expect, vi } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
// jsdom has no canvas; the scratch pad beside each problem draws on one. A context whose every method does nothing.
const noop: object = new Proxy(() => noop, { get: (_t, k) => (k === 'canvas' ? document.createElement('canvas') : noop), apply: () => noop })
HTMLCanvasElement.prototype.getContext = (() => noop) as never
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as never

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: () => {}, replace: () => {} }), useSearchParams: () => new URLSearchParams(), usePathname: () => '/' }))
vi.mock('@/infra/useMiloSpeaker', () => ({ speak: () => {}, speakSteps: () => () => {}, stopSpeech: () => {} }))
vi.mock('@/infra/voiceClipPlayer', () => ({ setSceneVoice: () => {}, prefetchClips: () => {}, setClipRate: () => {} }))
vi.mock('@/data/repositories/points', () => ({
  sessionUserId: async () => 'u-test',
  syncBatch: async (c: unknown[]) => c.map(() => 'ok'), lessonCall: () => ({}), moduleCall: () => ({}), runCall: () => ({}),   // the queue's one request (sync_batch)
  recordLessonProgress: async () => 'ok', recordModulePractice: async () => 'ok', recordPracticeRun: async () => 'ok', getLessonRows: async () => null,
}))

const { LessonPlayer } = await import('@/features/lessons/LessonPlayer')
const { findLesson } = await import('@/features/lessons/modules')
const { ladderOf } = await import('@/features/lessons/ladders')
const { draw, rng } = await import('@/features/lessons/adaptive')
const { solutionOf } = await import('@/features/lessons/script')
const { saveRun } = await import('@/infra/storage/lessonRun')
const { saveStanding } = await import('@/infra/storage/lessonStanding')

const L = 'kid-1'

it('g6m7-t1 Screen 9: the sticker\'s two sentences are two rows, and it still reads as one line', async () => {
  const lesson = findLesson('g6m7-t1')!.lesson
  saveStanding(L, lesson.id, { level: 0, streak: 0, mastered: false })
  const problem = draw(ladderOf(lesson.id)!, 0, rng(7))           // level 1: towers, a number to type
  saveRun(L, lesson.id, { asked: 11, recent: [problem.text], current: { problem, from: lesson.id }, review: null })
  const host = document.createElement('div'); document.body.append(host)
  const root = createRoot(host)
  await act(async () => { root.render(createElement(LessonPlayer, { lesson, learnerId: L, onFinish: () => {}, onExit: () => {} })) })
  const click = async (label: string) => {
    const b = [...host.querySelectorAll('button')].filter(x => x.textContent?.trim() === label).at(-1)
    if (!b) throw new Error(`no button "${label}" on: ${host.textContent?.slice(0, 300)}`)
    await act(async () => { b.click() })
  }
  const type = async (v: string) => {
    const input = host.querySelector('form input') as HTMLInputElement
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, v)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => { host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) })
  }

  await click('Keep practicing')
  const wrong = String((solutionOf(problem) as number) + 1)
  await type(wrong); await type(wrong)                             // the 12th answer: the topic is done
  await click('Next problem')
  await click('Finish for today 🎉')
  expect(host.textContent).toContain('Screen 9 of 9')
  const sticker = host.querySelector('[data-sticker]')!
  expect([...sticker.children].map(c => [c.textContent, getComputedStyle(c).display])).toEqual([
    ['⭐ The fair share is called the mean.', 'block'],
    [' Mean = total ÷ how many.', 'block'],
  ])
  expect(sticker.textContent).toBe('⭐ The fair share is called the mean. Mean = total ÷ how many.')
  act(() => root.unmount()); host.remove()
})
