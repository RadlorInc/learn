// @vitest-environment jsdom
/**
 * /ask lets no question go while the made voice is still downloading (founder, 26 Oct: a lesson started before it was
 * here stopped at every step to wait for its voice). Ready or failed (the device voice speaks): asking is open.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'

let voice = { state: 'loading', loaded: 40e6, total: 166e6 }
const askMaths = vi.fn(async () => ({ ok: true, left: 5 }))
vi.mock('@/data/repositories/askMaths', () => ({ askMaths: () => askMaths(), getAskQuestions: async () => [] }))
vi.mock('@/data/supabase/useLearnerSession', () => ({ getActiveLearner: () => ({ id: 'kid-1', age_group: '12-14' }) }))
vi.mock('@/features/askMaths/voice', () => ({ unlockSound: () => {}, useVoiceStatus: () => voice }))
vi.mock('@/features/askMaths/AskPlayer', () => ({ AskPlayer: () => null }))

let AskPage: () => React.JSX.Element
beforeAll(async () => {
  vi.stubEnv('NEXT_PUBLIC_ASK_MATHS', 'on')
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  AskPage = (await import('@/app/ask/page')).default
})

async function page() {
  const el = document.createElement('div'); document.body.append(el)
  await act(async () => { createRoot(el).render(createElement(AskPage)) })
  const box = el.querySelector('textarea')!
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(box, '2x + 3 = 11')
    box.dispatchEvent(new Event('input', { bubbles: true }))
  })
  const submit = el.querySelector<HTMLButtonElement>('button[type="submit"]')!
  return { el, box, submit }
}

describe('/ask: no asking until the voice is here', () => {
  it('while loading: Ask is off, Enter sends nothing, ideas are hidden, and the download shows', async () => {
    voice = { state: 'loading', loaded: 40e6, total: 166e6 }; askMaths.mockClear()
    const { el, box, submit } = await page()
    expect(submit.disabled).toBe(true)
    await act(async () => { box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })) })
    expect(askMaths).not.toHaveBeenCalled()
    expect(el.querySelector('[aria-label="Ideas to ask"]')).toBeNull()
    expect(el.textContent).toContain('40 of 166 MB')
  })

  it.each(['ready', 'failed'])('when the voice is %s: Ask is on and asks', async (state) => {
    voice = { state, loaded: 0, total: 0 }; askMaths.mockClear()
    const { submit } = await page()
    expect(submit.disabled).toBe(false)
    await act(async () => { submit.click() })
    expect(askMaths).toHaveBeenCalledTimes(1)
  })
})
