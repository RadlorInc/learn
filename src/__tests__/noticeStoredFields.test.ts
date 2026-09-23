/**
 * The direct notice (docs/legal/02) must say what a new child's row ACTUALLY stores — not what we
 * meant to store. Until notice-v4 it said "Grade level", and no grade was ever stored: the add-a-child
 * sheet keeps the lessons the parent picks and `age_group`, a band worked out by `bandOf` from the
 * first module's grade, written as the age range '9-11' or '12-14'.
 *
 * ⚠️ The expectations below are written out BY HAND on purpose (CLAUDE.md: a check that imports the
 * value it asserts is tautological). Two things are driven from the code — the fields `createLearner`
 * writes and the bands `bandOf` produces — and compared with that hand-written intent and with the
 * notice's own words. Add a stored field or a band and this goes red: update the notice (and
 * NOTICE_VERSION) in the same change, or stop storing it.
 */
import { describe, it, expect, vi } from 'vitest'

let inserted: Record<string, unknown> | null = null
vi.mock('@/shared/ui/Toast', () => ({ toast: { error: () => {}, success: () => {} } }))
vi.mock('@/data/repositories/_shared', () => ({
  db: () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'parent-1' } } }) },
    from: () => ({
      insert: (p: Record<string, unknown>) => {
        inserted = p
        return { select: () => ({ single: async () => ({ data: { id: 'kid-1', ...p }, error: null }) }) }
      },
    }),
  }),
}))

import { createLearner } from '@/data/repositories/learners'
import { bandOf } from '@/features/classes/Classes'
import { NOTICE, B1, B3 } from '@/features/consent/copy'

describe('the notice names what a new child row stores', () => {
  it('createLearner writes exactly these fields for a child added through consent', async () => {
    await createLearner('Bea', 2, '9-11', { lessonIds: ['g3m1-t1'] }, 'consent-1')
    expect(inserted, 'createLearner never reached the insert — the check saw nothing').not.toBeNull()
    expect(Object.keys(inserted!).sort()).toEqual(
      ['age_group', 'avatar_index', 'consent_id', 'created_by', 'display_name', 'lesson_ids'],
    )
    expect(inserted, 'no exact grade or age is stored').not.toHaveProperty('grade')
  })

  it('the only bands a grade can become are 9-11 (grades 3–5) and 12-14 (grades 6–8)', () => {
    const byBand: Record<string, number[]> = {}
    for (const g of [3, 4, 5, 6, 7, 8]) (byBand[bandOf(g)] ??= []).push(g)
    expect(byBand).toEqual({ '9-11': [3, 4, 5], '12-14': [6, 7, 8] })
  })

  it('the notice row says a grade band and the lessons chosen — and names both stored bands', () => {
    const row = NOTICE.rows.map(r => r[0].en).find(s => /grade/i.test(s))
    expect(row, 'no notice row mentions the grade at all').toBeDefined()
    expect(row).not.toMatch(/^Grade level$/)
    expect(row).toMatch(/lessons you choose/)
    expect(row).toMatch(/grade band/)
    for (const s of ['grades 3–5', 'grades 6–8', '9–11', '12–14']) expect(row).toContain(s)
    expect(row).toMatch(/do not store your child's exact grade or age/)
  })

  it('B1 and B3 say "grade band", never "grade level"', () => {
    const b1 = B1.list.map(x => x.en).join('\n')
    expect(b1).toContain('grade band (grades 3–5 or 6–8)')
    expect(b1).not.toMatch(/grade level/i)
    expect(B3.yesterday.en).toContain('grade band')
    expect(B3.yesterday.en).not.toMatch(/grade level/i)
  })
})
