/**
 * What a child sees (founder, 2026-09-18): a paid teacher's class → lessons AND the class's exercises; a free teacher's
 * class → exercises only; a child in no class → lessons. And when it cannot tell, lessons (fail open), never nothing.
 * The database is stubbed; the answers it gives are written out by hand.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

let rows: Record<string, { data: unknown; error: unknown }>
vi.mock('@/data/repositories/_shared', () => ({
  db: () => ({
    from: (table: string) => {
      const q = { select: () => q, eq: () => q, maybeSingle: async () => rows[table] ?? { data: null, error: null } }
      return q
    },
  }),
}))
vi.mock('@/shared/ui/Toast', () => ({ toast: { error: () => {} } }))

const EX = [{ id: 'x', module: 'g5m2', level: 2, count: 10, seed: 7 }]
const kid = { grade_id: 'class-1', created_by: 'teacher-1' }

beforeEach(() => {
  rows = { grades: { data: { name: '5-A', grade: 5, exercises: EX }, error: null } }
})

describe('getClassMode', async () => {
  const { getClassMode } = await import('@/data/repositories/grades')

  it('a child in no class (every parent\'s child) gets lessons, without asking anything', async () => {
    rows = {}
    expect(await getClassMode({ grade_id: null, created_by: 'parent-1' })).toEqual({ mode: 'lessons' })
  })

  it('a PAID teacher\'s class: lessons AND the class\'s exercises', async () => {
    rows.teacher_plans = { data: { paid: true }, error: null }
    expect(await getClassMode(kid)).toEqual({ mode: 'lessons', className: '5-A', exercises: EX })
  })

  it('a FREE teacher\'s class (no paid row): the exercises only', async () => {
    rows.teacher_plans = { data: null, error: null }
    expect(await getClassMode(kid)).toEqual({ mode: 'exercises', className: '5-A', exercises: EX })
    rows.teacher_plans = { data: { paid: false }, error: null }
    expect((await getClassMode(kid)).mode).toBe('exercises')
  })

  it('fails OPEN to lessons when the paid lookup fails, and treats a legacy chapter grade as no class', async () => {
    rows.teacher_plans = { data: null, error: { message: 'relation "teacher_plans" does not exist' } }
    expect(await getClassMode(kid)).toEqual({ mode: 'lessons' })
    rows = { grades: { data: { name: 'old', grade: null, exercises: [] }, error: null } }
    expect(await getClassMode(kid)).toEqual({ mode: 'lessons' })
  })
})
