// @vitest-environment jsdom
/**
 * /ask lists the child's own answered lessons (founder, 26 Oct: "the child's portal should show what they asked"), and
 * a tap plays that stored lesson. Refused questions (not maths, personal, failed) are not listed.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'

const LESSON = { els: [], steps: [{ say: 'Three quarters times one third.' }] }
const getAskQuestions = vi.fn(async (_id: string) => [
  { id: 'a', asked_at: '2026-10-26T06:00:00Z', question: 'Ali has 3/4 of a pizza', outcome: 'answered', script: LESSON },
  { id: 'b', asked_at: '2026-10-26T05:00:00Z', question: 'Write a dragon story', outcome: 'not_maths', script: null },
  { id: 'c', asked_at: '2026-10-26T04:00:00Z', question: null, outcome: 'personal', script: null },
])
vi.mock('@/data/repositories/askMaths', () => ({ askMaths: vi.fn(), getAskQuestions: (id: string) => getAskQuestions(id) }))
vi.mock('@/data/supabase/useLearnerSession', () => ({ getActiveLearner: () => ({ id: 'kid-1', age_group: '12-14' }) }))
vi.mock('@/features/askMaths/voice', () => ({ unlockSound: () => {}, useVoiceStatus: () => ({ state: 'idle' }) }))
const played: unknown[] = []
vi.mock('@/features/askMaths/AskPlayer', () => ({
  AskPlayer: ({ script }: { script?: unknown }) => { if (script) played.push(script); return null },
}))

let AskPage: () => React.JSX.Element
beforeAll(async () => {
  vi.stubEnv('NEXT_PUBLIC_ASK_MATHS', 'on')
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  AskPage = (await import('@/app/ask/page')).default
})

describe('/ask: the child sees their past lessons', () => {
  it('lists only answered questions, for this child, and a tap plays the stored lesson', async () => {
    const el = document.createElement('div'); document.body.append(el)
    await act(async () => { createRoot(el).render(createElement(AskPage)) })
    expect(getAskQuestions).toHaveBeenCalledWith('kid-1')
    const list = el.querySelector('section[aria-label="Your questions"]')
    expect(list).not.toBeNull()
    const items = [...list!.querySelectorAll('button')].map(b => b.textContent)
    expect(items).toEqual(['▶ Ali has 3/4 of a pizza'])

    await act(async () => { list!.querySelector('button')!.click() })
    expect(played).toEqual([LESSON])
  })
})
