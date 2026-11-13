/**
 * What a child sees: a teacher's class → lessons AND the class's exercises (every teacher since Radlic went free,
 * 13 Nov 2026; before, a free teacher's class got exercises only); a child in no class → lessons. And when it cannot tell, lessons (fail open), never nothing.
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

  it('any teacher\'s class: lessons AND the class\'s exercises (Radlic is free, 13 Nov 2026)', async () => {
    rows.teacher_plans = { data: null, error: null }   // no paid row: before 13 Nov this was "exercises only"
    expect(await getClassMode(kid)).toEqual({ mode: 'lessons', classId: 'class-1', className: '5-A', exercises: EX })
  })

  it('fails OPEN to lessons when the class lookup fails, and treats a legacy chapter grade as no class', async () => {
    rows.grades = { data: null, error: { message: 'network' } }
    expect(await getClassMode(kid)).toEqual({ mode: 'lessons' })
    rows = { grades: { data: { name: 'old', grade: null, exercises: [] }, error: null } }
    expect(await getClassMode(kid)).toEqual({ mode: 'lessons' })
  })
})
