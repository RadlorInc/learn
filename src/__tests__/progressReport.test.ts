/**
 * The parent's Assign lessons / Performance numbers (src/features/lessons/progressReport.ts). Expected values are written
 * out by hand here, never derived from the module.
 */
import { describe, it, expect } from 'vitest'
import { assign, unassign, assignmentStatus, buildReport, type PointRow } from '@/features/lessons/progressReport'

const at = (y: number, m: number, d: number, h = 15) => new Date(y, m - 1, d, h).toISOString()
const prob = (lesson: string, points: number, when: string): PointRow => ({ lesson_id: lesson, reason: 'problem', points, created_at: when })

describe('assigning and removing', () => {
  const ORDER = ['g3m2-t1', 'g3m2-t2', 'g3m2-t3', 'g4m1-t1']

  it('adds in teaching order, dates the picked ones, and re-assigning without a date clears the old date', () => {
    const a = assign(ORDER, { ids: ['g4m1-t1'], due: { 'g4m1-t1': '2026-09-30' } }, ['g3m2-t2', 'g3m2-t1'], '2026-09-20')
    expect(a).toEqual({ ids: ['g3m2-t1', 'g3m2-t2', 'g4m1-t1'], due: { 'g3m2-t1': '2026-09-20', 'g3m2-t2': '2026-09-20', 'g4m1-t1': '2026-09-30' } })
    expect(assign(ORDER, a, ['g3m2-t1'], '')).toEqual({ ids: ['g3m2-t1', 'g3m2-t2', 'g4m1-t1'], due: { 'g3m2-t2': '2026-09-20', 'g4m1-t1': '2026-09-30' } })
    expect(assign(ORDER, { ids: null, due: {} }, ['g3m2-t3'], '')).toEqual({ ids: ['g3m2-t3'], due: {} })
  })

  it('removing the last lesson means every topic again (null), never an empty list', () => {
    expect(unassign({ ids: ['g3m2-t1', 'g3m2-t2'], due: { 'g3m2-t1': '2026-09-20' } }, 'g3m2-t1')).toEqual({ ids: ['g3m2-t2'], due: {} })
    expect(unassign({ ids: ['g3m2-t2'], due: { 'g3m2-t2': '2026-09-20' } }, 'g3m2-t2')).toEqual({ ids: null, due: {} })
  })
})

describe('assignment status', () => {
  it('done wins; past its day is late; today and later are due; no date is open', () => {
    expect(assignmentStatus(true, '2026-09-01', '2026-09-17')).toBe('done')
    expect(assignmentStatus(false, '2026-09-16', '2026-09-17')).toBe('late')
    expect(assignmentStatus(false, '2026-09-17', '2026-09-17')).toBe('due')
    expect(assignmentStatus(false, '2026-09-30', '2026-09-17')).toBe('due')
    expect(assignmentStatus(false, undefined, '2026-09-17')).toBe('open')
  })
})

describe('the performance report', () => {
  const now = new Date(2026, 8, 17, 18)   // Sep 17, 6pm local

  it('counts problems per local day for the last 7 days, ending today, and ignores non-problem rows', () => {
    const r = buildReport([
      prob('g3m2-t1', 2, at(2026, 9, 17, 9)), prob('g3m2-t1', 1, at(2026, 9, 17, 10)),
      prob('g3m2-t1', 2, at(2026, 9, 11)),                       // first day of the window
      prob('g3m2-t1', 2, at(2026, 9, 10)),                       // one day too old
      { lesson_id: 'g3m2-t1', reason: 'level_up', points: 3, created_at: at(2026, 9, 17) },
      { lesson_id: null, reason: 'game', points: -40, created_at: at(2026, 9, 17) },
    ], [], now)
    expect(r.week.map(d => d.day)).toEqual(['2026-09-11', '2026-09-12', '2026-09-13', '2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17'])
    expect(r.week.map(d => d.problems)).toEqual([1, 0, 0, 0, 0, 0, 2])
    expect(r.problemsThisWeek).toBe(3)
    expect(r.firstTryPct).toBe(75)   // 3 of the 4 problem rows scored 2
  })

  it('no problems answered is "no data", not 0%', () => {
    expect(buildReport([], [], now).firstTryPct).toBeNull()
  })

  it('stuck = practised 6+ times, not mastered, right first try under half the time; worst first', () => {
    const rows = [
      ...Array.from({ length: 6 }, (_, i) => prob('g3m2-t1', i < 2 ? 2 : 1, at(2026, 9, 15))),   // 33% → stuck
      ...Array.from({ length: 8 }, (_, i) => prob('g3m2-t2', i < 1 ? 2 : 1, at(2026, 9, 15))),   // 13% → stuck, worst
      ...Array.from({ length: 5 }, () => prob('g3m2-t3', 1, at(2026, 9, 15))),                   // 0%, but only 5 tries
      ...Array.from({ length: 6 }, () => prob('g3m2-t4', 1, at(2026, 9, 15))),                   // 0%, but mastered since
      ...Array.from({ length: 6 }, (_, i) => prob('g3m2-t5', i < 3 ? 2 : 1, at(2026, 9, 15))),   // exactly 50% → not stuck
    ]
    const r = buildReport(rows, [
      { lesson_id: 'g3m2-t4', done: true, mastered: true },
      { lesson_id: 'g3m2-t1', done: true, mastered: false },
    ], now)
    expect(r.stuck).toEqual([
      { lessonId: 'g3m2-t2', problems: 8, firstTryPct: 13 },
      { lessonId: 'g3m2-t1', problems: 6, firstTryPct: 33 },
    ])
    expect([r.mastered, r.done]).toEqual([1, 2])
  })
})
