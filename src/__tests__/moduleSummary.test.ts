/**
 * REVIEW 1, Q3 (founder, 2026-09-24): the module summary and Practice again.
 *   · once every topic of a module the child has is done: "Module complete! ⭐", topics done, this module's points,
 *     "You got really good at:" (mastered) and "Let's keep practicing:" (done, not mastered), Practice again per topic;
 *   · the module's last topic leads there; the topic map links there once all are done; a typed link to an unfinished
 *     module's summary shows the topic map instead;
 *   · Practice again opens that topic's practice directly — no teaching screen, no welcome card.
 * ⚠️ Expected words are written out here, never imported from the app.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const noop: object = new Proxy(() => noop, { get: (_t, k) => (k === 'canvas' ? document.createElement('canvas') : noop), apply: () => noop })
HTMLCanvasElement.prototype.getContext = (() => noop) as never
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as never
window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as never

const params = { value: new URLSearchParams() }
const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace: () => {} }), useSearchParams: () => params.value, usePathname: () => '/' }))
vi.mock('@/infra/useMiloSpeaker', () => ({ speak: () => {}, speakSteps: () => () => {}, stopSpeech: () => {} }))
vi.mock('@/infra/voiceClipPlayer', () => ({ setSceneVoice: () => {}, prefetchClips: () => {}, setClipRate: () => {} }))
const ledger: { lesson_id: string | null; reason: string; points: number; created_at: string }[] = []
vi.mock('@/data/repositories/points', () => ({
  recordLessonProgress: async () => 'ok', recordModulePractice: async () => 'ok', recordPracticeRun: async () => 'ok', getLessonRows: async () => null,
  getRecentPoints: async () => ledger,
}))
vi.mock('@/data/supabase/useLearnerSession', () => ({ getActiveLearner: () => ({ id: 'kid-1', lesson_ids: null, lesson_due: null }) }))

const { ModuleSummary } = await import('@/features/lessons/ModuleSummary')
const { LessonPlayer } = await import('@/features/lessons/LessonPlayer')
const { default: LessonPage } = await import('@/app/lesson/page')
const { MODULES } = await import('@/features/lessons/modules')
const { ladderOf, ladderAnswers } = await import('@/features/lessons/ladders')
const { draw, rng } = await import('@/features/lessons/adaptive')
const { solutionOf } = await import('@/features/lessons/script')
const { saveRun, loadRun } = await import('@/infra/storage/lessonRun')
const { saveStanding } = await import('@/infra/storage/lessonStanding')
const { markLessonDone } = await import('@/infra/storage/lessonProgress')

const L = 'kid-1'
const mod = MODULES.find(m => m.id === 'g3m1')!
let host: HTMLDivElement, root: Root
const text = () => { const c = host.cloneNode(true) as HTMLElement; c.querySelectorAll('style').forEach(x => x.remove()); return c.textContent ?? '' }
const section = (name: string) => host.querySelector(`section[aria-label="${name}"]`)
const links = () => [...host.querySelectorAll('a')].map(a => ({ text: a.textContent, href: a.getAttribute('href') }))
async function mount(el: ReturnType<typeof createElement>) {
  host = document.createElement('div'); document.body.append(host)
  root = createRoot(host)
  await act(async () => { root.render(el) })
  await act(async () => { await new Promise(r => setTimeout(r, 0)) })   // the ledger read
}
/** Every topic done; the first two mastered. */
function completeModule() {
  mod.lessons.forEach((l, i) => { markLessonDone(L, l.id); saveStanding(L, l.id, { level: 2, streak: 0, mastered: i < 2 }) })
}

beforeEach(() => {
  localStorage.clear(); document.body.innerHTML = ''; push.mockReset(); ledger.length = 0; params.value = new URLSearchParams()
})

describe('the summary screen', () => {
  it('celebrates: topics done, this module\'s points, what they got good at, what to keep practicing — each with Practice again', async () => {
    completeModule()
    const [a, b, c] = mod.lessons
    ledger.push(
      { lesson_id: a.id, reason: 'problem', points: 2, created_at: '2026-09-01' },
      { lesson_id: c.id, reason: 'lesson_done', points: 10, created_at: '2026-09-02' },
      { lesson_id: 'g4m1-t1', reason: 'problem', points: 50, created_at: '2026-09-03' },   // another module: not counted
      { lesson_id: null, reason: 'game', points: -8, created_at: '2026-09-03' },            // game time: not counted
    )
    await mount(createElement(ModuleSummary, { module: mod, lessons: mod.lessons, learnerId: L }))
    expect(host.querySelector('h1')?.textContent).toBe('Module complete! ⭐')
    expect(text()).toContain(`${mod.lessons.length} topics done · +12 points`)
    expect(section('You got really good at:')?.textContent).toContain(a.title)
    expect(section('You got really good at:')?.textContent).toContain(b.title)
    expect(section('You got really good at:')?.textContent).not.toContain(c.title)
    expect(section("Let's keep practicing:")?.textContent).toContain(c.title)
    for (const l of mod.lessons) expect(links()).toContainEqual({ text: 'Practice again', href: `/lesson?id=${l.id}&practice=1` })
    expect(links()).toContainEqual({ text: 'Back to modules', href: '/modules?grade=3' })
    expect(text()).not.toMatch(/\b\d+ of \d+\b|\d\s*%|wrong|fail|incomplete|not done/i)
  })

  it('every topic mastered: no "keep practicing" list at all; signed out: no points line', async () => {
    mod.lessons.forEach(l => { markLessonDone(null, l.id); saveStanding(null, l.id, { level: 3, streak: 0, mastered: true }) })
    await mount(createElement(ModuleSummary, { module: mod, lessons: mod.lessons, learnerId: null }))
    expect(section("Let's keep practicing:")).toBeNull()
    expect(section('You got really good at:')?.querySelectorAll('li')).toHaveLength(mod.lessons.length)
    expect(text()).not.toContain('points')
  })
})

describe('getting there', () => {
  it('/lesson?module=…&summary=1 shows the summary only when every topic is done; otherwise the topic map', async () => {
    params.value = new URLSearchParams(`module=${mod.id}&summary=1`)
    markLessonDone(L, mod.lessons[0].id)
    await mount(createElement(LessonPage))
    expect(text()).not.toContain('Module complete! ⭐')
    expect(text()).toContain(`1 of ${mod.lessons.length} done`)
    await act(async () => root.unmount()); document.body.innerHTML = ''

    completeModule()
    await mount(createElement(LessonPage))
    expect(host.querySelector('h1')?.textContent).toBe('Module complete! ⭐')
  })

  it('the topic map, all done: its chip leads to the summary', async () => {
    completeModule()
    params.value = new URLSearchParams(`module=${mod.id}`)
    await mount(createElement(LessonPage))
    expect(links()).toContainEqual({ text: 'See what you learned ⭐', href: `/lesson?module=${mod.id}&summary=1` })
  })

  it('the module\'s last topic finishing leads to the summary, not the topic map', async () => {
    const lesson = MODULES.flatMap(m => m.lessons).find(l => ladderAnswers(ladderOf(l.id)!).every(a => typeof a === 'number'))!
    saveStanding(L, lesson.id, { level: 0, streak: 0, mastered: false })
    const problem = draw(ladderOf(lesson.id)!, 0, rng(7))
    saveRun(L, lesson.id, { asked: 11, recent: [problem.text], current: { problem, from: lesson.id }, review: null })
    const onModuleComplete = vi.fn(), onExit = vi.fn()
    await mount(createElement(LessonPlayer, { lesson, learnerId: L, onFinish: () => markLessonDone(L, lesson.id), onExit, moduleDone: () => true, onModuleComplete }))
    const click = async (label: string) => { const b = [...host.querySelectorAll('button')].filter(x => x.textContent?.trim() === label).at(-1)!; await act(async () => { b.click() }) }
    await click('Keep practicing')
    await act(async () => { const i = host.querySelector('form input') as HTMLInputElement
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(i, String(solutionOf(loadRun(L, lesson.id)!.current.problem)))
      i.dispatchEvent(new Event('input', { bubbles: true })) })
    await act(async () => { host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) })
    await click('Next problem')                                    // the 12th answer: the topic is done
    await click('Take a break')
    expect(text()).toContain('Module complete!')
    await click('See what you learned ⭐')
    expect(onModuleComplete).toHaveBeenCalledTimes(1)
    expect(onExit).not.toHaveBeenCalled()
  })
})

describe('Practice again', () => {
  it('opens the topic\'s practice straight away — no teaching screen, no welcome card, even with a saved run', async () => {
    const lesson = mod.lessons[0]
    const problem = draw(ladderOf(lesson.id)!, 1, rng(3))
    saveStanding(L, lesson.id, { level: 1, streak: 0, mastered: true })
    saveRun(L, lesson.id, { asked: 14, recent: [problem.text], current: { problem, from: lesson.id }, review: null })
    await mount(createElement(LessonPlayer, { lesson, learnerId: L, onFinish: () => {}, onExit: () => {}, practiceFirst: true }))
    expect(text()).not.toContain('Welcome back')
    expect(text()).not.toMatch(/Screen \d of 9/)
    expect(text()).toContain(problem.text)
    expect(host.querySelector('form input')).not.toBeNull()
  })

  it('without the flag, the same saved run still greets the child first (unchanged)', async () => {
    const lesson = mod.lessons[0]
    const problem = draw(ladderOf(lesson.id)!, 1, rng(3))
    saveRun(L, lesson.id, { asked: 14, recent: [problem.text], current: { problem, from: lesson.id }, review: null })
    await mount(createElement(LessonPlayer, { lesson, learnerId: L, onFinish: () => {}, onExit: () => {} }))
    expect(text()).toContain('Welcome back')
  })
})
