/**
 * THE SOFT PREREQUISITE NUDGE (founder, 2026-09-24) — the rule, and the real /lesson page driving it.
 * A nudge, never a lock: shown when the previous topic in the module is under halfway (ladder position), never on a
 * module's first topic, never when a parent/teacher chose the topics, never mid-session, at most once per topic per
 * day; "Go anyway" goes straight in with one tap. Expectations are written out here, never imported.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const noop: object = new Proxy(() => noop, { get: (_t, k) => (k === 'canvas' ? document.createElement('canvas') : noop), apply: () => noop })
HTMLCanvasElement.prototype.getContext = (() => noop) as never
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as never

const nav = vi.hoisted(() => ({ qs: '', pushed: [] as string[] }))
const who = vi.hoisted(() => ({ learner: null as null | { id: string; lesson_ids: string[] | null } }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: (u: string) => nav.pushed.push(u), replace: () => {} }),
  useSearchParams: () => new URLSearchParams(nav.qs), usePathname: () => '/lesson',
}))
vi.mock('@/data/supabase/useLearnerSession', () => ({ getActiveLearner: () => who.learner }))
vi.mock('@/infra/useMiloSpeaker', () => ({ speak: () => {}, speakSteps: () => () => {}, stopSpeech: () => {} }))
vi.mock('@/infra/voiceClipPlayer', () => ({ setSceneVoice: () => {}, prefetchClips: () => {}, setClipRate: () => {} }))
vi.mock('@/data/repositories/points', () => ({
  recordLessonProgress: async () => 'ok', recordModulePractice: async () => 'ok', recordPracticeRun: async () => 'ok', getLessonRows: async () => null,
}))

const { nudgeFor, PREREQ_THRESHOLD } = await import('@/features/lessons/nudge')
const { progressOf } = await import('@/features/lessons/adaptive')
const { findModule } = await import('@/features/lessons/modules')
const { saveStanding } = await import('@/infra/storage/lessonStanding')
const { saveRun } = await import('@/infra/storage/lessonRun')
const { nudgeShownToday, markNudgeShown } = await import('@/infra/storage/nudgeSeen')
const { ladderOf } = await import('@/features/lessons/ladders')
const { default: LessonPage } = await import('@/app/lesson/page')

const mod = findModule('g3m2')!
const [first, second] = mod.lessons
const levels = ladderOf(first.id)!.length
const ctx = (o: Partial<Parameters<typeof nudgeFor>[2]> = {}) => ({
  lessonIds: null, standingOf: () => null, levelsOf: (id: string) => ladderOf(id)?.length, started: false, shownToday: false, ...o,
})

describe('the rule', () => {
  it('progress is the ladder position, mastered is all the way, and the threshold is one half', () => {
    expect(PREREQ_THRESHOLD).toBe(0.5)
    expect([0, 1, 2, 3].map(level => progressOf({ level, streak: 0, mastered: false }, 4))).toEqual([0, 0.25, 0.5, 0.75])
    expect(progressOf({ level: 3, streak: 0, mastered: true }, 4)).toBe(1)
    expect(progressOf(null, 4)).toBe(0)
  })

  it('shows under halfway on the previous topic; not at or past it', () => {
    const at = (level: number) => nudgeFor(second, mod, ctx({ standingOf: id => (id === first.id ? { level, streak: 0, mastered: false } : null) }))
    expect(nudgeFor(second, mod, ctx())).toEqual({ prev: first, progress: 0 })
    const half = Math.ceil(levels / 2)
    expect(at(half - 1)?.prev.id).toBe(first.id)
    expect(at(half)).toBeNull()
    expect(nudgeFor(second, mod, ctx({ standingOf: () => ({ level: 0, streak: 0, mastered: true }) }))).toBeNull()
    // Exactly halfway is "past halfway" enough: a 4-level ladder at level 2 is 0.5 → no card; level 1 (0.25) → card.
    const four = (level: number) => nudgeFor(second, mod, ctx({ levelsOf: () => 4, standingOf: () => ({ level, streak: 0, mastered: false }) }))
    expect(four(2)).toBeNull()
    expect(four(1)).toEqual({ prev: first, progress: 0.25 })
  })

  it('never on a module\'s first topic, mid-session, twice in a day, or when the topics were chosen for the child', () => {
    expect(nudgeFor(first, mod, ctx())).toBeNull()
    expect(nudgeFor(second, mod, ctx({ started: true }))).toBeNull()
    expect(nudgeFor(second, mod, ctx({ shownToday: true }))).toBeNull()
    expect(nudgeFor(second, mod, ctx({ lessonIds: [first.id, second.id] }))).toBeNull()   // assigned: they decided
    expect(nudgeFor(second, mod, ctx({ lessonIds: ['g3m3-t1'] }))).toBeNull()            // previous topic not on the child's map
    expect(nudgeFor(second, mod, ctx({ lessonIds: [] }))).not.toBeNull()                  // an empty list is "no choice made"
  })

  it('once a day is the child\'s local day', () => {
    const morning = new Date(2026, 8, 25, 8), night = new Date(2026, 8, 25, 23, 59), next = new Date(2026, 8, 26, 0, 1)
    markNudgeShown('kid', second.id, morning)
    expect(nudgeShownToday('kid', second.id, night)).toBe(true)
    expect(nudgeShownToday('kid', second.id, next)).toBe(false)
    expect(nudgeShownToday('other-kid', second.id, night)).toBe(false)
  })
})

describe('the /lesson page', () => {
  let host: HTMLDivElement, root: Root
  const text = () => { const c = host.cloneNode(true) as HTMLElement; c.querySelectorAll('style').forEach(x => x.remove()); return c.textContent ?? '' }
  const button = (label: string) => [...host.querySelectorAll('button')].find(b => b.textContent?.trim() === label)
  const open = async () => {
    root?.unmount(); host?.remove()
    host = document.createElement('div'); document.body.append(host); root = createRoot(host)
    await act(async () => { root.render(createElement(LessonPage)) })
  }
  const CARD = `You're on your way with ${first.title}! ⭐ Getting a bit further there (past halfway) will make ${second.title} easier.`

  beforeEach(() => {
    localStorage.clear(); nav.pushed.length = 0
    nav.qs = `id=${second.id}`; who.learner = { id: 'kid-1', lesson_ids: null }
  })

  it('shows the card, with a bar and no number; "anyway" goes straight in with one tap; not again today', async () => {
    saveStanding('kid-1', first.id, { level: 0, streak: 0, mastered: false })
    await open()
    expect(text()).toContain(CARD)
    expect(host.querySelector(`[role="img"][aria-label="How far you are with ${first.title}"]`)).not.toBeNull()
    expect(text()).not.toMatch(/\d\s*%/)
    await act(async () => { button(`Go to ${second.title} anyway`)!.click() })
    expect(text()).toContain('Screen 1 of 9')
    await open()
    expect(text()).not.toContain(CARD)
    expect(text()).toContain('Screen 1 of 9')
  })

  it('"Practise first" opens the previous topic', async () => {
    await open()
    await act(async () => { button(`Practise ${first.title} first`)!.click() })
    expect(nav.pushed).toEqual([`/lesson?id=${first.id}`])
  })

  it('no card at halfway, for an assigned topic, or when the child already started this topic', async () => {
    saveStanding('kid-1', first.id, { level: Math.ceil(levels / 2), streak: 0, mastered: false })
    await open()
    expect(text()).toContain('Screen 1 of 9')                 // control: the page rendered the lesson
    expect(text()).not.toContain('on your way with')

    localStorage.clear(); who.learner = { id: 'kid-1', lesson_ids: [first.id, second.id] }
    await open()
    expect(text()).not.toContain('on your way with')

    localStorage.clear(); who.learner = { id: 'kid-1', lesson_ids: null }
    const problem = ladderOf(second.id)![0].make(() => 0.5)
    saveRun('kid-1', second.id, { asked: 2, recent: [problem.text], current: { problem, from: second.id }, review: null })
    await open()
    expect(text()).not.toContain('on your way with')
    expect(text()).toContain('Welcome back! ⭐')
  })
})
