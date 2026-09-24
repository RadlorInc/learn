/**
 * The parent's calm line about the prerequisite nudge (founder, 2026-09-24): "<name> started “<next>” before getting
 * far with “<prev>”." — only after the child chose "Go anyway", one per topic, newest first. Written out, not imported.
 */
import { describe, it, expect, vi } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const rows = vi.hoisted(() => ({ events: [] as unknown[] }))
vi.mock('@/data/repositories/_shared', async orig => {
  const actual = await orig<typeof import('@/data/repositories/_shared')>()
  // select → eq(learner) → eq(event) → gte → order → limit, as getRecentNudges calls it
  const q = { select: () => q, eq: () => q, gte: () => q, order: () => q, limit: async () => ({ data: rows.events }) }
  return { ...actual, db: () => ({ from: () => q }) }
})

const { getRecentNudges } = await import('@/data/repositories/points')
const { findModule } = await import('@/features/lessons/modules')
const [first, second, third] = findModule('g3m2')!.lessons

describe('the parent line', () => {
  it('one per topic, newest first; a malformed event is skipped', async () => {
    rows.events = [
      { props: { lesson: second.id, prereq: first.id }, created_at: '2026-09-26T10:00:00Z' },
      { props: { lesson: second.id, prereq: first.id }, created_at: '2026-09-25T10:00:00Z' },
      { props: { lesson: 7 }, created_at: '2026-09-25T09:00:00Z' },
      { props: { lesson: third.id, prereq: second.id }, created_at: '2026-09-24T10:00:00Z' },
    ]
    expect(await getRecentNudges('kid', 30)).toEqual([
      { lesson: second.id, prereq: first.id, at: '2026-09-26T10:00:00Z' },
      { lesson: third.id, prereq: second.id, at: '2026-09-24T10:00:00Z' },
    ])
  })

  it('shows on the Progress tab in calm words, and not at all when there is nothing to say', async () => {
    vi.doMock('@/data/repositories/points', async orig => ({
      ...(await orig<Record<string, unknown>>()),
      getRecentPoints: async () => [], getLessonRows: async () => [],
      getRecentNudges: async () => rows.events.length ? [{ lesson: second.id, prereq: first.id, at: 'x' }] : [],
    }))
    const { Performance } = await import('@/features/lessons/Performance')
    const render = async () => {
      const host = document.createElement('div'); document.body.append(host)
      await act(async () => { createRoot(host).render(createElement(Performance, { learners: [{ id: 'kid', name: 'Ava', lessonIds: null, due: {} }] })) })
      await act(async () => { await new Promise(r => setTimeout(r, 0)) })
      return host.textContent ?? ''
    }
    const line = `Ava started “${second.title}” before getting far with “${first.title}”.`
    const shown = await render()
    expect(shown).toContain('Topics mastered')                    // control: the tab rendered its report
    expect(shown).toContain(line)
    rows.events = []
    const quiet = await render()
    expect(quiet).toContain('Topics mastered')
    expect(quiet).not.toContain('Worth knowing')
  })
})
