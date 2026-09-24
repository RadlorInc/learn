/**
 * The parent's calm line about going ahead (founder, 2026-09-24, option (a)): "<name> started “<next>” before getting
 * far with “<prev>”." — derived from PROGRESS ALONE (lesson_progress), which the notice already covers. No event is
 * read or written for it. Expected lines are written out here, not imported.
 */
import { describe, it, expect, vi } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const data = vi.hoisted(() => ({ rows: [] as { lesson_id: string; done: boolean; level: number; streak: number; mastered: boolean }[], tables: [] as string[] }))
vi.mock('@/data/repositories/_shared', async orig => {
  const actual = await orig<typeof import('@/data/repositories/_shared')>()
  const q = (t: string) => { data.tables.push(t); const x = { select: () => x, eq: () => x, gte: () => x, order: async () => ({ data: [] }), then: (r: (v: unknown) => void) => r({ data: t === 'lesson_progress' ? data.rows : [] }) }; return x }
  return { ...actual, db: () => ({ from: q, rpc: async () => ({ data: null }) }) }
})

const { startedAhead } = await import('@/features/lessons/nudge')
const { findModule } = await import('@/features/lessons/modules')
const { Performance } = await import('@/features/lessons/Performance')
const m = findModule('g3m2')!
const [first, second, third] = m.lessons
const row = (id: string, level: number, mastered = false) => ({ lesson_id: id, done: mastered, level, streak: 0, mastered })

describe('the parent line, from progress', () => {
  it('a started topic whose previous topic is under halfway — and only that (a 4-level ladder: ¼ per level)', () => {
    const four = () => 4
    const ids = (r: ReturnType<typeof startedAhead>) => r.map(x => [x.lesson.id, x.prev.id])
    expect(ids(startedAhead([row(second.id, 0)], [m], four))).toEqual([[second.id, first.id]])                        // previous never started
    expect(ids(startedAhead([row(first.id, 1), row(second.id, 0)], [m], four))).toEqual([[second.id, first.id]])      // ¼
    expect(startedAhead([row(first.id, 2), row(second.id, 0)], [m], four)).toEqual([])                               // exactly halfway
    expect(startedAhead([row(first.id, 0, true), row(second.id, 0)], [m], four)).toEqual([])                         // previous mastered
    expect(startedAhead([row(first.id, 0)], [m], four)).toEqual([])                                                  // nothing started ahead
    expect(ids(startedAhead([row(first.id, 3), row(second.id, 0), row(third.id, 0)], [m], four))).toEqual([[third.id, second.id]])
    // A chosen list: a previous topic not on it is never named; one on it still is.
    expect(startedAhead([row(second.id, 0)], [m], four, [second.id])).toEqual([])
    expect(ids(startedAhead([row(second.id, 0)], [m], four, [first.id, second.id]))).toEqual([[second.id, first.id]])
  })

  it('shows on the Progress tab in calm words; nothing when there is nothing to say; no event table is read', async () => {
    const render = async (lessonIds: string[] | null = null) => {
      const host = document.createElement('div'); document.body.append(host)
      await act(async () => { createRoot(host).render(createElement(Performance, { learners: [{ id: 'kid', name: 'Ava', lessonIds, due: {} }] })) })
      await act(async () => { await new Promise(r => setTimeout(r, 0)) })
      return host.textContent ?? ''
    }
    data.rows = [row(second.id, 1)]
    const shown = await render()
    expect(shown).toContain('Topics mastered')                        // control: the report rendered
    expect(shown).toContain(`Ava started “${second.title}” before getting far with “${first.title}”.`)
    expect(data.tables).not.toContain('learner_events')
    // The child's list does not include the previous topic: it is not on their map, so no line.
    const listed = await render([second.id])
    expect(listed).toContain('Topics mastered')
    expect(listed).not.toContain('Worth knowing')
    data.rows = [row(first.id, 0, true), row(second.id, 1)]
    const quiet = await render()
    expect(quiet).toContain('Topics mastered')
    expect(quiet).not.toContain('Worth knowing')
  })
})
