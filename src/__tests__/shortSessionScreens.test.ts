/**
 * SHORT PRACTICE SESSIONS, THE SCREEN (founder, 2026-09-24) — the real LessonPlayer on a real topic, rendered and
 * clicked: a saved run greets the child with a choice; Keep practicing puts back the SAME problem; a checkpoint after
 * the 5th and the 10th answer; Keep going; Take a break celebrates with the points; the topic becomes done at 12.
 * ⚠️ Every expected line is written out here, never imported from sessionCopy.ts (a check that imports the value it
 * asserts passes because the code equals itself). Only the network and the voice are replaced.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
// jsdom has no canvas; the scratch pad beside each problem draws on one. A context whose every method does nothing.
const noop: object = new Proxy(() => noop, { get: (_t, k) => (k === 'canvas' ? document.createElement('canvas') : noop), apply: () => noop })
HTMLCanvasElement.prototype.getContext = (() => noop) as never
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as never

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: () => {}, replace: () => {} }), useSearchParams: () => new URLSearchParams(), usePathname: () => '/' }))
vi.mock('@/infra/useMiloSpeaker', () => ({ speak: () => {}, speakSteps: () => () => {}, stopSpeech: () => {} }))
vi.mock('@/infra/voiceClipPlayer', () => ({ setSceneVoice: () => {}, prefetchClips: () => {}, setClipRate: () => {} }))
vi.mock('@/data/repositories/points', () => ({
  recordLessonProgress: async () => 'ok', recordModulePractice: async () => 'ok', recordPracticeRun: async () => 'ok', getLessonRows: async () => null,
}))

const { LessonPlayer } = await import('@/features/lessons/LessonPlayer')
const { MODULES } = await import('@/features/lessons/modules')
const { ladderOf, ladderAnswers } = await import('@/features/lessons/ladders')
const { draw, rng } = await import('@/features/lessons/adaptive')
const { solutionOf } = await import('@/features/lessons/script')
const { saveRun, loadRun } = await import('@/infra/storage/lessonRun')
const { saveStanding } = await import('@/infra/storage/lessonStanding')

// A topic whose every ladder level answers with a plain number, so the test can type a number that is not the answer.
const lesson = MODULES.flatMap(m => m.lessons).find(l => ladderAnswers(ladderOf(l.id)!).every(a => typeof a === 'number'))!
const L = 'kid-1'
let host: HTMLDivElement, root: Root
const onFinish = vi.fn(), onExit = vi.fn()

/** What a child reads: the page's text without its <style> blocks. */
const text = () => { const c = host.cloneNode(true) as HTMLElement; c.querySelectorAll('style').forEach(x => x.remove()); return c.textContent ?? '' }
const button = (label: string) => {
  const b = [...host.querySelectorAll('button')].filter(x => x.textContent?.trim() === label)
  if (b.length === 0) throw new Error(`no button "${label}" on: ${text().slice(0, 300)}`)
  return b.at(-1)!   // the dialog's, when a dialog is open over the screen
}
const click = async (label: string) => { await act(async () => { button(label).click() }) }
async function type(v: string) {
  const input = host.querySelector('form input') as HTMLInputElement
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, v)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(async () => { host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) })
}
/** Two misses, the worked steps, next — an answer that is never right, so the ladder never moves up. */
async function answerNotRight() {
  const run = loadRun(L, lesson.id)!
  const wrong = String((solutionOf(run.current.problem) as number) + 1)
  await type(wrong); await type(wrong)
  await click('Next problem')
}
const dialog = () => host.querySelector('[role="dialog"]')?.textContent ?? null

beforeAll(() => { expect(lesson, 'control: a topic with plain-number answers exists').toBeTruthy() })
beforeEach(async () => {
  localStorage.clear(); onFinish.mockReset(); onExit.mockReset()
  saveStanding(L, lesson.id, { level: 0, streak: 0, mastered: false })
  const problem = draw(ladderOf(lesson.id)!, 0, rng(7))
  saveRun(L, lesson.id, { asked: 3, recent: [problem.text], current: { problem, from: lesson.id }, review: null })
  host = document.createElement('div'); document.body.append(host)
  root = createRoot(host)
  await act(async () => { root.render(createElement(LessonPlayer, { lesson, learnerId: L, onFinish, onExit })) })
})

describe('short practice sessions', () => {
  it('welcome back → the same problem; checkpoints at 5 and 10; done at 12; the break celebrates', async () => {
    expect(text()).toContain('Welcome back! ⭐')
    expect(text()).toContain('Your spot is saved.')
    const saved = loadRun(L, lesson.id)!.current.problem.text
    await click('Keep practicing')
    expect(text()).toContain(saved)                                  // exactly where the child stopped

    await answerNotRight()                                           // 4
    expect(dialog()).toBeNull()
    await answerNotRight()                                           // 5
    expect(dialog()).toContain('5 questions done! ⭐ Nice work.')
    await click('Keep going')
    expect(dialog()).toBeNull()
    for (let k = 6; k <= 10; k++) await answerNotRight()
    expect(dialog()).toContain('5 questions done! ⭐ Nice work.')
    expect(onFinish).not.toHaveBeenCalled()                          // 10 answers, not mastered: not done yet
    await click('Keep going')
    await answerNotRight(); await answerNotRight()                   // 11, 12
    expect(onFinish).toHaveBeenCalledTimes(1)                        // done after 12 answers across sessions
    expect(loadRun(L, lesson.id)!.asked).toBe(12)

    await click('Take a break')                                      // the top bar's, mid-round
    // Practice is complete, so this is Screen 9 (founder, 2026-09-24): Screen 8's sentence and the math-word sticker —
    // not the break screen, which is for a topic still in progress (next test).
    expect(text()).toContain('Screen 9 of 9')
    expect(text()).toContain('You got it')
    expect(host.querySelector('[data-sticker]')?.textContent).toBe(`⭐ ${lesson.won.sticker}`)
    expect(text()).not.toContain('Your spot is saved.')
    expect(text()).toContain('+19 points')                           // 9 answers × 1, + 10 for the topic becoming done
    expect(text()).not.toMatch(/\b\d+ of \d+\b|%/)
    await click('Back to topics')
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('a right answer says "Right!" and the next problem comes by itself — no Next problem tap (founder, 2026-09-24)', async () => {
    await click('Keep practicing')
    const run = loadRun(L, lesson.id)!
    await type(String(solutionOf(run.current.problem)))
    expect(text()).toContain('Right!')
    expect(text()).not.toContain('The answer is')
    expect(loadRun(L, lesson.id)!.asked).toBe(3)                    // still on it, "Right!" showing
    await act(async () => { await new Promise(r => setTimeout(r, 1600)) })
    expect(loadRun(L, lesson.id)!.asked).toBe(4)                    // moved on without a tap
    expect(text()).not.toContain('Right!')
  })

  it('Take a break from the checkpoint', async () => {
    await click('Keep practicing')
    await answerNotRight(); await answerNotRight()
    expect(dialog()).toContain('5 questions done! ⭐ Nice work.')
    await click('Take a break')
    expect(text()).toContain('Great work, 2 questions done! ⭐')
    expect(text()).not.toContain('Screen 9 of 9')                   // not done yet: the break, not Screen 9
    expect(loadRun(L, lesson.id)!.asked).toBe(5)
  })

  it('Watch the lesson first starts the lesson — never skipped without the child choosing', async () => {
    await click('Watch the lesson first')
    expect(text()).toContain('Screen 1 of 9')
  })
})
