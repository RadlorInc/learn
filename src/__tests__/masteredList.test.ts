/**
 * REVIEW 1, Q4 (founder, 2026-09-24): on the parent's Progress tab the "Topics mastered" tile opens the list of those
 * topics, grouped by module in teaching order, each with the day it was first mastered. Honest where the record is
 * missing ("date not recorded" — the ledger was emptied on 2026-09-17), and never a list that disagrees with the tile.
 * ⚠️ Expected words and dates are written out here, never imported from the app.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const db = {
  rows: [] as { lesson_id: string; done: boolean; mastered: boolean; level: number; streak: number }[],
  dates: {} as Record<string, string>,
}
vi.mock('@/data/repositories/points', () => ({
  getRecentPoints: async () => [],
  getLessonRows: async () => db.rows,
  getMasteredDates: async () => db.dates,
}))

const { masteredByModule } = await import('@/features/lessons/progressReport')
const { Performance } = await import('@/features/lessons/Performance')
const { MODULES } = await import('@/features/lessons/modules')

const g3m1 = MODULES.find(m => m.id === 'g3m1')!, g4m1 = MODULES.find(m => m.id === 'g4m1')!
const row = (id: string, mastered: boolean) => ({ lesson_id: id, done: true, mastered, level: 2, streak: 0 })

describe('masteredByModule', () => {
  it('groups by module in teaching order, topics in order, with the day or null; counts ids that are not a topic', () => {
    const progress = [row(g4m1.lessons[0].id, true), row(g3m1.lessons[2].id, true), row(g3m1.lessons[0].id, true), row(g3m1.lessons[1].id, false), row('c:old-chapter', true)]
    const out = masteredByModule(progress, { [g3m1.lessons[0].id]: '2026-09-20T15:00:00Z' }, MODULES)
    expect(out.groups.map(g => g.moduleId)).toEqual(['g3m1', 'g4m1'])
    expect(out.groups[0].topics.map(t => t.id)).toEqual([g3m1.lessons[0].id, g3m1.lessons[2].id])
    expect(out.groups[0].topics[0].day).toBe('2026-09-20')
    expect(out.groups[0].topics[1].day).toBeNull()
    expect(out.other).toBe(1)
  })
})

describe('the Progress tab', () => {
  let host: HTMLDivElement, root: Root
  const text = () => host.textContent ?? ''
  const tile = () => [...host.querySelectorAll('button')].find(b => b.textContent?.includes('Topics mastered'))
  async function mount() {
    host = document.createElement('div'); document.body.append(host)
    root = createRoot(host)
    await act(async () => { root.render(createElement(Performance, { learners: [{ id: 'kid', name: 'Ava', lessonIds: null, due: {} }] })) })
    await act(async () => { await new Promise(r => setTimeout(r, 0)) })
  }
  beforeEach(() => { document.body.innerHTML = ''; db.rows = []; db.dates = {} })

  it('the tile opens the list: module headings, topics, the day mastered, and "date not recorded" where there is none', async () => {
    db.rows = [row(g3m1.lessons[0].id, true), row(g3m1.lessons[1].id, true), row(g4m1.lessons[0].id, true), row(g4m1.lessons[1].id, false)]
    db.dates = { [g3m1.lessons[0].id]: '2026-09-20T15:00:00Z', [g4m1.lessons[0].id]: '2026-09-22T15:00:00Z' }
    await mount()
    const b = tile()!
    expect(b, 'the tile is a button').toBeTruthy()
    expect(b.getAttribute('aria-expanded')).toBe('false')
    expect(b.textContent).toContain('Show the list')
    expect(host.querySelector('#mastered-list')).toBeNull()

    await act(async () => { b.click() })
    expect(tile()!.getAttribute('aria-expanded')).toBe('true')
    const list = host.querySelector('#mastered-list')!
    expect(list.getAttribute('aria-label')).toBe('Mastered topics')
    expect([...list.querySelectorAll('h3')].map(h => h.textContent)).toEqual([`Grade 3 · ${g3m1.title}`, `Grade 4 · ${g4m1.title}`])
    const items = [...list.querySelectorAll('li')].map(li => li.textContent)
    expect(items).toEqual([
      `⭐ ${g3m1.lessons[0].title}Mastered Sep 20`,
      `⭐ ${g3m1.lessons[1].title}Mastered, date not recorded`,
      `⭐ ${g4m1.lessons[0].title}Mastered Sep 22`,
    ])
    expect(text()).not.toContain(g4m1.lessons[1].title)   // done, not mastered: not on this list

    await act(async () => { tile()!.click() })
    expect(host.querySelector('#mastered-list')).toBeNull()
  })

  it('nothing mastered: the tile is a plain number, not a button to an empty list', async () => {
    db.rows = [row(g3m1.lessons[0].id, false)]
    await mount()
    expect(text()).toContain('Topics mastered')
    expect(tile()).toBeUndefined()
  })
})
