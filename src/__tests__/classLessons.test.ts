/**
 * "Choose modules" reaches EVERY student in the class (bug, 2026-09-18): the second module a teacher gave reached the
 * class row and not the child, because the students were updated from the dashboard's in-memory list, which was stale
 * right after adding them. Production logs showed three PATCHes to /grades and none to /learners.
 *
 * The fix is structural — `setClassLessons` takes no list of students and asks the database for everyone whose
 * `grade_id` is this class — so this test asserts that shape: the students' update is filtered by the class (and the
 * teacher), never by ids the screen supplied. The database is stubbed; every call is recorded.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

type Call = { table: string; op: string; values?: unknown; filters: [string, unknown][] }
let calls: Call[]
let learnersUpdated: { id: string }[]

vi.mock('@/data/repositories/_shared', () => ({
  db: () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'teacher-1' } } }) },
    from: (table: string) => {
      const c: Call = { table, op: 'select', filters: [] }
      calls.push(c)
      const q = {
        update: (values: unknown) => { c.op = 'update'; c.values = values; return q },
        eq: (col: string, v: unknown) => { c.filters.push([col, v]); return q },
        in: (col: string, v: unknown) => { c.filters.push([col, v]); return q },
        select: async () => ({ data: table === 'learners' ? learnersUpdated : [{ id: 'class-1' }], error: null }),
      }
      return q
    },
  }),
}))
vi.mock('@/shared/ui/Toast', () => ({ toast: { error: () => {} } }))

beforeEach(() => { calls = []; learnersUpdated = [{ id: 'kid-a' }, { id: 'kid-b' }] })

describe('setClassLessons', async () => {
  const { setClassLessons } = await import('@/data/repositories/grades')
  const IDS = ['g5m1-t1', 'g5m2-t1']

  it('updates the class AND every student in it, by class — not by a list the screen remembered', async () => {
    expect(await setClassLessons('class-1', IDS)).toBe(2)
    expect(calls.map(c => [c.table, c.op, c.values, c.filters])).toEqual([
      ['grades', 'update', { lesson_ids: IDS }, [['id', 'class-1']]],
      ['learners', 'update', { lesson_ids: IDS }, [['grade_id', 'class-1'], ['created_by', 'teacher-1']]],
    ])
  })

  it('a class with no students yet is a success, not an error', async () => {
    learnersUpdated = []
    expect(await setClassLessons('class-1', IDS)).toBe(0)
  })
})
