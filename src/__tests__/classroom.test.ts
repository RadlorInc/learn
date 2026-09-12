// @vitest-environment node
/**
 * The classroom: a teacher's syllabus, her set work, and a child who signs in as themselves.
 *
 * Four properties, and the first is a REGRESSION GUARD rather than a new feature. Until
 * 2026-09-12 `learners.grade_id` did two unrelated jobs — roster membership AND the child's
 * playable chapter list — so a teacher adding a child to her class silently replaced that child's
 * whole app with her own syllabus. Nothing failed; both halves were individually correct.
 *
 * ⚠️ EVERY ASSERTION HERE WAS WATCHED GOING RED ON THE DEFECT IT EXISTS FOR. See the mutation
 * notes on each block: a check that has only ever been green is not evidence.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema } from './_schema'
import { childMode } from '@/features/billing/childMode'
import { parseRoster } from '@/data/repositories/learners'

const SRC = (p: string) => readFileSync(join(process.cwd(), 'src', p), 'utf8')

// ─────────────────────────────────────────────────────────────────────────────

describe('the child plays the PARENT\'s chapters, never the teacher\'s syllabus', () => {
  /**
   * ⚠️ A SOURCE CHECK, AND IT IS ANCHORED ON THE VALUE THE SCREEN READS RATHER THAN ON A BYTE
   * WINDOW. `grade_chapters` reaching the menu is the defect; the menu reading `chapter_ids` is
   * the fix. Both are asserted, because only one of them going wrong is still the bug.
   *
   * Mutation-tested: restoring the `getGradeChapterIds(learner.grade_id)` call fails the first
   * assertion; deleting the `chapter_ids` read fails the second.
   */
  const menu = SRC('app/menu/page.tsx')

  it('the menu never sources chapters from the class', () => {
    expect(menu, 'the menu is reading grade_chapters again — a teacher\'s syllabus is back on the child\'s screen')
      .not.toMatch(/getGradeChapterIds/)
  })

  it('the menu sources chapters from the learner\'s own list', () => {
    expect(menu, 'the menu no longer reads learner.chapter_ids — the parent\'s choice does nothing')
      .toMatch(/learner\.chapter_ids/)
  })

  it('grade_id survives, because the roster still decides whose set work arrives', () => {
    // ⚠️ The lazy over-correction is to delete grade_id from the menu entirely. That would take the
    // exercise list with it — a child's class is exactly how their teacher's work finds them.
    expect(menu).toMatch(/learner\.grade_id/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('childMode', () => {
  // ⚠️ These read as trivial and one of them is the whole "no subscription = exercises only" rule.
  // Mutation-tested: flipping the unknown case to 'exercises' fails the third.
  it('is full while the paywall is off, whatever the entitlement says', () => {
    expect(childMode(0)).toBe('full')     // PAYWALL_ENABLED is false today
  })

  it('is full when the child is entitled to something', () => {
    expect(childMode(12)).toBe('full')
  })

  it('fails OPEN when entitlement is unknown', () => {
    // A child stripped down to a bare exercise list because their wifi blinked is far worse than a
    // non-paying child being shown a chapter the gate then refuses.
    expect(childMode(null)).toBe('full')
    expect(childMode(undefined)).toBe('full')
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('parseRoster', () => {
  it('takes a pasted spreadsheet column', () => {
    expect(parseRoster('Aarav\nBeatriz\nChen')).toEqual(['Aarav', 'Beatriz', 'Chen'])
  })

  it('takes commas too, so one pasted line works', () => {
    expect(parseRoster('Ana, Ben, Cara')).toEqual(['Ana', 'Ben', 'Cara'])
  })

  it('drops blanks — a trailing newline must not create a child called ""', () => {
    expect(parseRoster('Ana\n\n  \nBen\n')).toEqual(['Ana', 'Ben'])
  })

  it('drops duplicates within one paste, case-insensitively', () => {
    expect(parseRoster('Ana\nana\nANA\nBen')).toEqual(['Ana', 'Ben'])
  })

  it('collapses inner whitespace rather than trusting the paste', () => {
    expect(parseRoster('  Ana   Maria  ')).toEqual(['Ana Maria'])
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('a locked exercise is invisible, not merely disabled', () => {
  let db: PGlite
  const TEACHER = '11111111-1111-4111-8111-111111111111'
  const CHILD_U = '22222222-2222-4222-8222-222222222222'
  const OUTSIDE = '33333333-3333-4333-8333-333333333333'
  const GRADE   = '44444444-4444-4444-8444-444444444444'
  let learnerId = ''
  let exerciseId = ''

  /**
   * Act as one signed-in user, with RLS actually enforced.
   *
   * ⚠️⚠️ SESSION SCOPE, NOT `set local`, AND THAT DISTINCTION IS THE WHOLE CHECK. Written with
   * `set local role` + `set_config(..., true)` the settings are TRANSACTION-scoped, so they were
   * gone by the time the next call ran its query — every statement executed as the superuser, who
   * bypasses RLS entirely. The probe reported that everyone could see everything, and the
   * "teacher can see her own exercise" positive control passed happily while measuring nothing.
   * Caught only because the two negative cases went red. A blind probe and a broken policy are the
   * same result unless something is expected to be refused.
   */
  async function as(uid: string, sql: string) {
    await db.exec(`set role authenticated; select set_config('test.uid', '${uid}', false);`)
    try { return (await db.query(sql)).rows as Record<string, unknown>[] }
    finally { await db.exec('reset role') }
  }

  beforeAll(async () => {
    ({ db } = await loadSchema())
    await db.exec(`
      insert into auth.users (id, email, email_confirmed_at) values
        ('${TEACHER}', 't@example.test', now()),
        ('${CHILD_U}', 'c@example.test', now()),
        ('${OUTSIDE}', 'o@example.test', now());
      insert into public.grades (id, created_by, name, age_group)
        values ('${GRADE}', '${TEACHER}', 'Class', '3-5');
      insert into public.learners (display_name, created_by, age_group, grade_id)
        values ('Kid', '${TEACHER}', '3-5', '${GRADE}');
    `)
    learnerId = String((await db.query<{ id: string }>(`select id from public.learners limit 1`)).rows[0].id)
    // The child's own account — the ONE row that makes every existing policy admit them.
    await db.exec(`insert into public.learner_access (learner_id, parent_id, access_role)
                   values ('${learnerId}', '${CHILD_U}', 'self')`)
    await db.exec(`insert into public.exercises (grade_id, created_by, topic, question_count, difficulty)
                   values ('${GRADE}', '${TEACHER}', 'counting', 10, 1)`)
    exerciseId = String((await db.query<{ id: string }>(`select id from public.exercises limit 1`)).rows[0].id)
  })

  it('POSITIVE CONTROL: the teacher can see her own locked exercise', async () => {
    // ⚠️ Without this, "the child sees 0 rows" is equally consistent with the probe being blind.
    expect(await as(TEACHER, `select id from public.exercises`)).toHaveLength(1)
  })

  it('the child cannot see it while it is locked', async () => {
    expect(await as(CHILD_U, `select id from public.exercises`)).toHaveLength(0)
  })

  it('the child CAN see it once the teacher unlocks it', async () => {
    // The other half of the pair. A policy that refuses everyone satisfies the test above
    // completely, and would ship a feature no child can ever use — the M6 trap in CLAUDE.md.
    await db.exec(`update public.exercises set unlocked_at = now() where id = '${exerciseId}'`)
    expect(await as(CHILD_U, `select id from public.exercises`)).toHaveLength(1)
  })

  it('a child on nobody\'s roster still sees nothing, unlocked or not', async () => {
    expect(await as(OUTSIDE, `select id from public.exercises`)).toHaveLength(0)
  })

  it('the child can file their own result, and an outsider cannot', async () => {
    await as(CHILD_U, `insert into public.exercise_results (exercise_id, learner_id, correct_count, wrong_count)
                       values ('${exerciseId}', '${learnerId}', 8, 2)`)
    expect(await as(TEACHER, `select id from public.exercise_results`)).toHaveLength(1)

    await expect(
      as(OUTSIDE, `insert into public.exercise_results (exercise_id, learner_id, correct_count, wrong_count)
                   values ('${exerciseId}', '${learnerId}', 99, 0)`),
    ).rejects.toThrow()
  })
})
