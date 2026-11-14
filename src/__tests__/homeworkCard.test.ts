// @vitest-environment jsdom
/**
 * The child's Ask Radlor card ("Ask any math homework", founder 13 Nov 2026; was "Help with homework") is its own
 * card under Practice, not a second button inside Learn (founder, 8 Nov 2026), and it shows only when a grown-up switched Ask Radlor on for that child (no offer on a child's screen).
 * The real ModuleHome is rendered; only the network reads are stubbed.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'

const ask = vi.hoisted(() => ({ enabled: true }))
vi.stubEnv('NEXT_PUBLIC_ASK_MATHS', 'on')
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: () => {}, push: () => {} }) }))
vi.mock('@/data/repositories/points', () => ({ getWallet: async () => null }))
vi.mock('@/infra/storage/lessonSync', () => ({ pullLessonProgress: async () => false, pendingLessonUploads: () => 0 }))
vi.mock('@/data/repositories/askMaths', () => ({ getAskSettings: async () => ({ enabled: ask.enabled, daily_limit: 5 }) }))
vi.mock('@/data/supabase/useLearnerSession', () => ({
  getActiveLearner: () => ({ id: 'kid', display_name: 'Kid', avatar_index: 0, age_group: '12-14', lesson_ids: null }), setActiveLearner: () => {},
}))
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let host: HTMLElement, root: ReturnType<typeof createRoot>
async function home() {
  const { ModuleHome } = await import('@/features/lessons/ModuleHome')
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
  await act(async () => { root.render(createElement(ModuleHome, { learnerId: 'kid', grade: 6 })) })
  await act(async () => { await new Promise(r => setTimeout(r, 0)) })
}
const links = () => [...host.querySelectorAll('a')]
afterEach(() => { act(() => root.unmount()); host.remove() })

describe('the homework card on the child\'s module page', () => {
  it('Ask Radlor on: a card of its own, after Practice, going to /ask, and not inside the Learn card', async () => {
    ask.enabled = true
    await home()
    const hw = links().find(a => a.textContent === 'Ask any math homework')
    expect(hw, 'the homework button is on the page').toBeDefined()
    expect(hw!.getAttribute('href')).toBe('/ask')
    const practice = links().find(a => a.textContent === 'Practice')!
    const learn = links().find(a => /^(Start|Keep) learning$|^Learn again$/.test(a.textContent ?? ''))!
    expect(practice.compareDocumentPosition(hw!) & Node.DOCUMENT_POSITION_FOLLOWING, 'homework comes after Practice').toBeTruthy()
    expect(learn.parentElement!.contains(hw!), 'not inside the Learn card').toBe(false)
    expect(practice.parentElement!.contains(hw!), 'not inside the Practice card').toBe(false)
    expect(host.textContent).not.toContain('Help me with homework')
  })

  it('Ask Radlor off: no homework card, and Practice still shows (positive control)', async () => {
    ask.enabled = false
    await home()
    expect(links().some(a => a.textContent === 'Practice')).toBe(true)
    expect(links().some(a => a.getAttribute('href') === '/ask'), 'no link to /ask').toBe(false)
  })
})
