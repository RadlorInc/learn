/**
 * The WIRE between the practice screens and the adaptive engine: render the real ModulePractice and LessonPlayer, tap
 * through them like a child, and assert what reaches the engine (the saved standing) and the account (the outcome sent
 * to lessonSync). The engine's own rules are proven elsewhere; nothing there can see a screen that passes the WRONG
 * outcome — a first-try answer after the Hint counted as "first", a review problem's result saved on the wrong topic.
 *
 * The ladders are replaced by a toy one whose answer is always choice 0 and whose text names its level, so a test can
 * answer right or wrong on purpose and see which level was drawn. Speech, voice clips and the scratch pad (canvas) are
 * stubbed: jsdom has neither audio nor a 2D context, and none of them decide anything.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

const { syncLesson, syncModulePractice } = vi.hoisted(() => ({ syncLesson: vi.fn(), syncModulePractice: vi.fn() }))
vi.mock('@/infra/storage/lessonSync', () => ({ syncLesson, syncModulePractice }))
vi.mock('@/features/lessons/ScratchPad', () => ({ ScratchPad: () => null }))
vi.mock('@/infra/useMiloSpeaker', () => ({ speak: () => {}, speakSteps: () => () => {}, stopSpeech: () => {} }))
vi.mock('@/infra/voiceClipPlayer', () => ({ setSceneVoice: () => {} }))
vi.mock('@/features/lessons/ladders', () => {
  const level = (k: number) => ({
    style: `toy${k}`,
    make: (r: () => number) => ({ text: `Toy level ${k} #${Math.floor(r() * 1e9)}`, picture: { kind: 'eq', text: '' }, answer: { choices: ['right', 'wrong'], correct: 0 }, steps: ['Look.', 'right'] }),
  })
  const ladder = [0, 1, 2, 3, 4].map(level)
  return { ladderOf: () => ladder, ladderAnswers: () => [], LADDERS: {} }
})

import { ModulePractice } from '@/features/lessons/ModulePractice'
import { LessonPlayer } from '@/features/lessons/LessonPlayer'
import { MODULES } from '@/features/lessons/modules'
import { loadStanding, saveStanding } from '@/infra/storage/lessonStanding'
import { markLessonDone } from '@/infra/storage/lessonProgress'
import { solutionOf, showAnswer } from '@/features/lessons/script'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const KID = 'kid-1'
const g3m2 = MODULES.find(m => m.id === 'g3m2')!

let host: HTMLDivElement, root: Root
beforeEach(() => {
  localStorage.clear(); syncLesson.mockClear(); syncModulePractice.mockClear()
  host?.remove(); host = document.createElement('div'); document.body.append(host); root = createRoot(host)
})

const buttons = () => [...host.querySelectorAll('button')]
const button = (label: string | RegExp) => {
  const b = buttons().find(x => (typeof label === 'string' ? x.textContent?.trim() === label : label.test(x.textContent ?? '')))
  if (!b) throw new Error(`no button "${label}" — have: ${buttons().map(x => x.textContent?.trim()).join(' | ')}`)
  return b
}
const tap = async (label: string | RegExp) => act(async () => { button(label).click() })
const choose = async (i: 0 | 1) => act(async () => { (host.querySelectorAll('[role=radio]')[i] as HTMLButtonElement).click() })
const text = () => host.textContent ?? ''
/** Answer the problem on screen: right (choice 0) or wrong (choice 1), then Check. */
const answer = async (ok: boolean) => { await choose(ok ? 0 : 1); await tap('Check') }

describe('module practice → engine', () => {
  const mount = async () => act(async () => { root.render(createElement(ModulePractice, { module: g3m2, learnerId: KID, onExit: () => {} })) })
  const lastSync = () => syncLesson.mock.calls.at(-1)!

  it('right first try is sent as "first" for the topic that was asked, and moves that topic\'s standing', async () => {
    await mount()
    await answer(true)
    await tap('Next problem')
    const [learner, lessonId, outcome] = lastSync()
    expect([learner, outcome]).toEqual([KID, 'first'])
    expect(g3m2.lessons.map(l => l.id)).toContain(lessonId)
    expect(loadStanding(KID, lessonId)).toEqual({ level: 0, streak: 1, mastered: false })
  })

  it('tapping Hint and then answering right is "second", not "first"', async () => {
    await mount()
    await tap('Hint')
    await answer(true)
    await tap('Next problem')
    expect(lastSync()[2]).toBe('second')
    expect(loadStanding(KID, lastSync()[1])).toEqual({ level: 0, streak: 0, mastered: false })
  })

  it('a miss then right is "second"; two misses show the worked steps and send "worked"', async () => {
    await mount()
    await answer(false)
    expect(text()).toContain(g3m2.lessons.find(l => text().includes(l.bigIdea))?.bigIdea ?? '<<no big idea shown>>')
    await answer(true)
    await tap('Next problem')
    expect(lastSync()[2]).toBe('second')
    await answer(false); await answer(false)
    expect(text()).toContain("Here's how this one works")
    await tap('Next problem')
    expect(lastSync()[2]).toBe('worked')
  })

  it('after the tenth problem the module practice is sent once, with the module id', async () => {
    await mount()
    for (let i = 0; i < 10; i++) { await answer(true); await tap(i === 9 ? 'Finish' : 'Next problem') }
    expect(syncLesson).toHaveBeenCalledTimes(10)
    expect(syncModulePractice.mock.calls).toEqual([[KID, 'g3m2']])
    expect(text()).toContain('Practice done!')
  })

  it('a topic already standing at level 3 is asked at level 3 (the standing is read, not assumed fresh)', async () => {
    for (const l of g3m2.lessons) saveStanding(KID, l.id, { level: 3, streak: 0, mastered: false })
    await mount()
    expect(text()).toMatch(/Toy level 3 #/)
  })
})

describe('a lesson\'s practice → engine', () => {
  const lesson = g3m2.lessons[2]
  const earlier = g3m2.lessons.slice(0, 2).map(l => l.id)
  const typeInto = async (value: string) => act(async () => {
    const input = host.querySelector('input') as HTMLInputElement
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    set.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  /** Through Screens 1–7, Screen 8 answered right, and into practice. */
  const toPractice = async () => {
    await act(async () => { root.render(createElement(LessonPlayer, { lesson, learnerId: KID, earlier, onFinish: () => {}, onExit: () => {} })) })
    for (let i = 0; i < 7; i++) await tap(i === 0 ? /Let.s see/ : 'Next')
    expect(text()).toContain('Now you try')
    const a = solutionOf(lesson.turn)
    if (typeof a === 'object' && 'choices' in a) await choose(a.correct as 0 | 1)
    else await typeInto(showAnswer(a).replace('−', '-'))
    await tap('Check')
    await tap('Keep practicing')
  }

  it('a first-try Screen 8 starts practice one level up, and a right answer after the Hint is sent as "second"', async () => {
    await toPractice()
    expect(text()).toMatch(/Toy level 1 #/)
    await tap('Hint')
    await answer(true)
    await tap('Next problem')
    expect(syncLesson.mock.calls.at(-1)).toEqual([KID, lesson.id, 'second'])
    expect(loadStanding(KID, lesson.id)).toEqual({ level: 1, streak: 0, mastered: false })
  })

  it('the review problem (third) comes from the weak earlier topic, and ITS standing moves — not this lesson\'s', async () => {
    markLessonDone(KID, earlier[0]); saveStanding(KID, earlier[0], { level: 2, streak: 0, mastered: false })
    markLessonDone(KID, earlier[1]); saveStanding(KID, earlier[1], { level: 4, streak: 0, mastered: true })
    await toPractice()
    await answer(true); await tap('Next problem')
    await answer(true); await tap('Next problem')
    expect(text()).toMatch(/Toy level 2 #/)              // the review, at the earlier topic's own level
    await answer(false); await answer(false)             // worked steps on the review problem
    expect(text()).toContain(`Watch the lesson: ${g3m2.lessons[0].title}`)
    await tap('Next problem')
    expect(syncLesson.mock.calls.at(-1)).toEqual([KID, earlier[0], 'worked'])
    expect(loadStanding(KID, earlier[0])).toEqual({ level: 1, streak: 0, mastered: false })
    expect(loadStanding(KID, lesson.id)).toEqual({ level: 2, streak: 0, mastered: false })   // two first tries at level 1
  })
})
