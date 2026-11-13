/**
 * Practice always offers the way back to the explanation (founder, 8 Nov 2026): a child unsure can go back to the lesson
 * on any problem, not only after two misses. The real LessonPlayer and ModulePractice are rendered and clicked.
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
  sessionUserId: async () => 'u-test',   // #239: the queue stamps each item with its account
  syncBatch: async (c: unknown[]) => c.map(() => 'ok'), lessonCall: () => ({}), moduleCall: () => ({}), runCall: () => ({}),   // the queue's one request (sync_batch)
  recordLessonProgress: async () => 'ok', recordModulePractice: async () => 'ok', recordPracticeRun: async () => 'ok', getLessonRows: async () => null,
}))

const { LessonPlayer } = await import('@/features/lessons/LessonPlayer')
const { ModulePractice } = await import('@/features/lessons/ModulePractice')
const { MODULES } = await import('@/features/lessons/modules')
const { ladderOf, ladderAnswers } = await import('@/features/lessons/ladders')
const { draw, rng } = await import('@/features/lessons/adaptive')
const { saveRun } = await import('@/infra/storage/lessonRun')
const { saveStanding } = await import('@/infra/storage/lessonStanding')

const lesson = MODULES.flatMap(m => m.lessons).find(l => ladderAnswers(ladderOf(l.id)!).every(a => typeof a === 'number'))!
const mod = MODULES.find(m => m.lessons.includes(lesson))!
const L = 'kid-1'
let host: HTMLDivElement, root: Root

async function mount(el: ReturnType<typeof createElement>) {
  host = document.createElement('div'); document.body.append(host)
  root = createRoot(host)
  await act(async () => { root.render(el) })
}
const buttons = (label: string) => [...host.querySelectorAll('button')].filter(x => x.textContent?.trim() === label)
const lessonLinks = () => [...host.querySelectorAll('a')].filter(a => a.getAttribute('href')?.startsWith('/lesson?id='))
const answerBox = () => host.querySelector('form input')
beforeEach(() => { localStorage.clear(); document.body.innerHTML = '' })

describe('a lesson\'s practice: the way back to the explanation is there on every problem', () => {
  beforeEach(async () => {
    saveStanding(L, lesson.id, { level: 0, streak: 0, mastered: false })
    const problem = draw(ladderOf(lesson.id)!, 0, rng(7))
    saveRun(L, lesson.id, { asked: 0, recent: [problem.text], current: { problem, from: lesson.id }, review: null })
    await mount(createElement(LessonPlayer, { lesson, learnerId: L, onFinish: () => {}, onExit: () => {} }))
    const keep = [...host.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Keep practicing')!
    await act(async () => { keep.click() })
  })

  it('before any answer it shows "Watch the lesson again", and a tap opens the lesson instead of the problem', async () => {
    expect(answerBox(), 'control: this is the practice screen with a problem to answer').not.toBeNull()
    const back = buttons('Watch the lesson again')
    expect(back, 'one way back, before any wrong answer').toHaveLength(1)
    await act(async () => { back[0].click() })
    expect(answerBox(), 'the problem is gone: the lesson is on screen').toBeNull()
    expect(host.querySelector('[data-testid="set-dots"]')).toBeNull()
  })
})

describe('a module\'s practice', () => {
  it('links to the problem\'s own lesson before any answer', async () => {
    await mount(createElement(ModulePractice, { module: mod, learnerId: L, onExit: () => {} }))
    expect(answerBox(), 'control: a problem is on screen').not.toBeNull()
    const links = lessonLinks()
    expect(links).toHaveLength(1)
    expect(links[0].textContent).toMatch(/^Watch the lesson: /)
    const id = links[0].getAttribute('href')!.slice('/lesson?id='.length)
    expect(mod.lessons.map(l => l.id)).toContain(id)
  })

  it('a class exercise has no link out (a teacher\'s fixed set)', async () => {
    const problems = [0, 1].map(k => draw(ladderOf(lesson.id)!, 0, rng(11 + k)))
    await mount(createElement(ModulePractice, { module: mod, onExit: () => {}, exercise: { title: 'Set A', items: problems.map(problem => ({ problem, lesson })) } }))
    expect(answerBox(), 'control: a problem is on screen').not.toBeNull()
    expect(lessonLinks()).toHaveLength(0)
  })
})
