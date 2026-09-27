// @vitest-environment jsdom
/**
 * KG–2: ONE SITTING IS 5 QUESTIONS (founder, 2026-09-25 — "keep everything same [as the lessons' checkpoint] … 5 questions
 * only in one take, no take break or continue option").
 *
 * Driven through the real engine (`SkillBeat`) with a stand-in chapter of 10 questions, answered alternately right and
 * wrong so neither the mastery exit nor the re-teach can end the run early. The expected numbers are written out here.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: () => {}, push: () => {} }) }))
vi.mock('@/infra/useMiloSpeaker', () => ({ speak: () => {}, speakAfterCurrent: () => {}, stopSpeech: () => {}, useMiloSpeaker: () => ({ speak: () => {} }) }))
vi.mock('@/infra/storage/lessonSync', () => ({ syncLesson: () => {}, flushLessonSync: async () => {}, pullLessonProgress: async () => false }))
vi.mock('@/data/supabase/useLearnerSession', () => ({ getActiveLearner: () => ({ id: 'L1', display_name: 'Kid', avatar_index: 0, age_group: '3-5' }) }))

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const ROUNDS = 10
let n = 0
const beat = {
  skillId: 'counting', rounds: ROUNDS,
  make: () => ({ q: n++ }), sig: (d: { q: number }) => String(d.q),
  prompt: () => 'Tap it', say: () => 'Tap it',
  Play: ({ onSubmit }: { onSubmit: (c: boolean) => void }) => createElement('button', { id: 'go', onClick: () => onSubmit(answers.shift() ?? true) }, 'go'),
  Reteach: ({ onDone }: { onDone: () => void }) => createElement('button', { id: 'go', onClick: onDone }, 'go'),
}
let answers: boolean[] = []

async function sitting(withTake: boolean) {
  const { SkillBeat } = await import('@/features/chapters/story/StoryWorld')
  const { ChapterTakeContext } = await import('@/features/chapters/story/take')
  const onComplete = vi.fn(), onTake = vi.fn()
  const el = document.createElement('div'); document.body.appendChild(el)
  const root: Root = createRoot(el)
  const node = createElement(SkillBeat, { beat, onComplete } as never)
  await act(async () => { root.render(withTake ? createElement(ChapterTakeContext.Provider, { value: onTake }, node) : node) })
  let answered = 0
  // Answer until the engine stops offering a question (take over, or run over), with a ceiling.
  while (answered < ROUNDS + 2 && !onComplete.mock.calls.length && !onTake.mock.calls.length) {
    const b = el.querySelector<HTMLButtonElement>('#go')
    if (!b) break
    await act(async () => { b.click() })
    answered++
    await act(async () => { vi.advanceTimersByTime(1400) })
  }
  act(() => root.unmount()); el.remove()
  return { onComplete, onTake, answered }
}

beforeEach(() => { vi.useFakeTimers(); localStorage.clear(); n = 0; answers = Array.from({ length: 20 }, (_, i) => i % 2 === 0) })
afterEach(() => vi.useRealTimers())

describe('a KG–2 sitting is 5 questions', () => {
  it('stops after 5 answers with the run unfinished and the spot saved; the next sitting finishes it', async () => {
    const { getChapterResume } = await import('@/infra/storage/chapterResume')
    const first = await sitting(true)
    expect([first.answered, first.onTake.mock.calls, first.onComplete.mock.calls.length]).toEqual([5, [[5]], 0])
    expect(getChapterResume('L1', 'counting')?.round).toBe(5)

    const second = await sitting(true)
    expect([second.answered, second.onTake.mock.calls.length, second.onComplete.mock.calls.length]).toEqual([5, 0, 1])
    expect(getChapterResume('L1', 'counting'), 'a finished run left a resume point').toBeNull()
  })

  it('control: with no host asking for takes (the /story preview) the run plays straight through', async () => {
    const r = await sitting(false)
    expect([r.answered, r.onComplete.mock.calls.length]).toEqual([ROUNDS, 1])
  })
})
