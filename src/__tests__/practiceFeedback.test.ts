/**
 * REVIEW 1, Q1 + Q2 (founder, 2026-09-24) — the real practice screens, rendered and clicked:
 *   Q1 five dots show where the child is in the current set of five; they fill as answers finish, show all five while
 *      the checkpoint is up, and start again after it. A resumed run continues its set. No count of a total, no %.
 *   Q2 a right answer is green + ✓ + a short cheer that changes from problem to problem; a first miss is warm yellow
 *      (never red) + ↻ + "Try again!" words, with the big idea — never colour alone. Module practice the same.
 * ⚠️ Expected words and colours are written out here, never imported from the app.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
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
const { ModulePractice } = await import('@/features/lessons/ModulePractice')
const { MODULES } = await import('@/features/lessons/modules')
const { ladderOf, ladderAnswers } = await import('@/features/lessons/ladders')
const { draw, rng } = await import('@/features/lessons/adaptive')
const { solutionOf } = await import('@/features/lessons/script')
const { saveRun, loadRun } = await import('@/infra/storage/lessonRun')
const { saveStanding } = await import('@/infra/storage/lessonStanding')

const lesson = MODULES.flatMap(m => m.lessons).find(l => ladderAnswers(ladderOf(l.id)!).every(a => typeof a === 'number'))!
const L = 'kid-1'
const CHEERS = ['Right!', 'Nice!', 'You got it!', 'Great thinking!']
const YELLOW = 'rgb(255, 209, 102)', GREEN_BOX = 'rgb(183, 240, 198)'
let host: HTMLDivElement, root: Root

const text = () => { const c = host.cloneNode(true) as HTMLElement; c.querySelectorAll('style').forEach(x => x.remove()); return c.textContent ?? '' }
const click = async (label: string) => {
  const b = [...host.querySelectorAll('button')].filter(x => x.textContent?.trim() === label).at(-1)
  if (!b) throw new Error(`no button "${label}" on: ${text().slice(0, 300)}`)
  await act(async () => { b.click() })
}
async function type(v: string) {
  const input = host.querySelector('form input') as HTMLInputElement
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, v)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(async () => { host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) })
}
const wrongFor = (answer: unknown) => String((answer as number) + 1)
async function answerNotRight() {
  const w = wrongFor(solutionOf(loadRun(L, lesson.id)!.current.problem))
  await type(w); await type(w)
  await click('Next problem')
}
/** The dots as the child sees them: how many are filled, and what a screen reader hears. */
const dots = () => {
  const d = host.querySelector('[data-testid="set-dots"]')
  if (!d) return null
  return { filled: d.querySelectorAll('[data-filled]').length, total: d.children.length, label: d.getAttribute('aria-label') }
}
const status = () => [...host.querySelectorAll('[role="status"]')] as HTMLElement[]

async function mount(el: ReturnType<typeof createElement>) {
  host = document.createElement('div'); document.body.append(host)
  root = createRoot(host)
  await act(async () => { root.render(el) })
}

beforeEach(() => {
  localStorage.clear(); document.body.innerHTML = ''
})

describe('Q1: five dots for the current set', () => {
  beforeEach(async () => {
    saveStanding(L, lesson.id, { level: 0, streak: 0, mastered: false })
    const problem = draw(ladderOf(lesson.id)!, 0, rng(7))
    saveRun(L, lesson.id, { asked: 3, recent: [problem.text], current: { problem, from: lesson.id }, review: null })
    await mount(createElement(LessonPlayer, { lesson, learnerId: L, onFinish: () => {}, onExit: () => {} }))
    await click('Keep practicing')
  })

  it('a resumed run continues its set, fills as answers finish, all five at the checkpoint, then starts again', async () => {
    expect(dots()).toEqual({ filled: 3, total: 5, label: '3 questions done in this set' })
    await answerNotRight()
    expect(dots()).toEqual({ filled: 4, total: 5, label: '4 questions done in this set' })
    await answerNotRight()
    expect(host.querySelector('[role="dialog"]')?.textContent).toContain('5 questions done!')
    expect(dots()!.filled).toBe(5)
    await click('Keep going')
    expect(dots()).toEqual({ filled: 0, total: 5, label: '0 questions done in this set' })
  })

  it('the dot fills the moment an answer is right, before the next problem comes', async () => {
    await type(String(solutionOf(loadRun(L, lesson.id)!.current.problem)))
    expect(dots()!.filled).toBe(4)
    expect(loadRun(L, lesson.id)!.asked).toBe(3)   // still on this problem
  })

  it('never a count of a total or a percentage on the practice screen', () => {
    expect(text()).not.toMatch(/\b\d+ of \d+\b|\d\s*%/)
  })
})

describe('Q2: gentle answer feedback', () => {
  beforeEach(async () => {
    saveStanding(L, lesson.id, { level: 0, streak: 0, mastered: false })
    const problem = draw(ladderOf(lesson.id)!, 0, rng(7))
    saveRun(L, lesson.id, { asked: 0, recent: [problem.text], current: { problem, from: lesson.id }, review: null })
    await mount(createElement(LessonPlayer, { lesson, learnerId: L, onFinish: () => {}, onExit: () => {} }))
    await click('Keep practicing')
  })

  it('a first miss: warm yellow, a ↻ and "Try again!" in words, with the big idea — announced, never red', async () => {
    await type(wrongFor(solutionOf(loadRun(L, lesson.id)!.current.problem)))
    const s = status()
    expect(s).toHaveLength(1)
    expect(s[0].textContent).toContain('↻')
    expect(s[0].textContent).toContain('Try again!')
    expect(s[0].textContent).toContain(lesson.bigIdea)
    expect(s[0].style.background).toBe(YELLOW)
    expect(host.innerHTML).not.toMatch(/#c1121f|rgb\(193, 18, 31\)|✗|❌/i)
  })

  it('a right answer: green, a ✓ and a cheer — and the cheer changes from one problem to the next', async () => {
    const seen: string[] = []
    for (let k = 0; k < 2; k++) {
      await type(String(solutionOf(loadRun(L, lesson.id)!.current.problem)))
      const s = status()
      expect(s).toHaveLength(1)
      expect(s[0].style.background).toBe(GREEN_BOX)
      expect(s[0].textContent).toContain('✓')
      const cheer = s[0].textContent!.replace('✓', '')
      expect(CHEERS).toContain(cheer)
      seen.push(cheer)
      await click('Next problem')
    }
    expect(seen[0]).not.toBe(seen[1])
  })
})

describe('Q2 in module practice (a class exercise, so the problems are fixed)', () => {
  it('a first miss says Try again with the ↻; a right answer cheers with the ✓', async () => {
    const problems = [0, 1].map(k => draw(ladderOf(lesson.id)!, 0, rng(11 + k)))
    const mod = MODULES.find(m => m.lessons.includes(lesson))!
    await mount(createElement(ModulePractice, { module: mod, onExit: () => {}, exercise: { title: 'Set A', items: problems.map(problem => ({ problem, lesson })) } }))
    await type(wrongFor(solutionOf(problems[0])))
    expect(status().map(x => x.textContent).join('|')).toContain('Try again!')
    expect(status()[0].textContent).toContain('↻')
    expect(status()[0].textContent).toContain('Try again!')
    expect(status()[0].style.background).toBe(YELLOW)
    await type(String(solutionOf(problems[0])))
    expect(status()[0].textContent).toContain('✓')
    expect(CHEERS).toContain(status()[0].textContent!.replace('✓', ''))
  })
})
