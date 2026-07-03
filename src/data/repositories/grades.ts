'use client'

/** Grade (teacher-defined chapter subset) data access. */
import { toast } from '@/shared/ui/Toast'
import { db } from '@/data/repositories/_shared'
import type { ChapterType, Grade } from '@/data/supabase/types'
import type { AgeGroup } from '@/core/chapters'

export interface GradeSummary extends Grade {
  chapterCount: number
  learnerCount: number
}

/** Grades owned by the current account, with chapter + learner counts. */
export async function getMyGrades(): Promise<GradeSummary[]> {
  const supabase = db()
  const { data, error } = await supabase
    .from('grades')
    .select('*, grade_chapters(count), learners(count)')
    .order('created_at', { ascending: true })
  if (error) {
    // Pre-migration the tables don't exist yet — degrade to "no grades" rather
    // than throwing, so the dashboard still renders.
    console.warn('[getMyGrades]', error.message)
    return []
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map(g => ({
    ...g,
    chapterCount: g.grade_chapters?.[0]?.count ?? 0,
    learnerCount: g.learners?.[0]?.count ?? 0,
  })) as GradeSummary[]
}

/** A grade's chapter ids, in the teacher's chosen order. */
export async function getGradeChapterIds(gradeId: string): Promise<ChapterType[]> {
  const supabase = db()
  const { data, error } = await supabase
    .from('grade_chapters')
    .select('chapter_id, sort_order')
    .eq('grade_id', gradeId)
    .order('sort_order', { ascending: true })
  if (error) { console.warn('[getGradeChapterIds]', error.message); return [] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map(r => r.chapter_id as ChapterType)
}

/** Create a grade for one band with a chosen chapter subset (in order). */
export async function createGrade(
  name: string,
  ageGroup: AgeGroup,
  chapterIds: ChapterType[],
): Promise<Grade | null> {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { console.error('[createGrade] no user'); return null }

  const { data: grade, error } = await supabase
    .from('grades')
    .insert({ name: name.trim(), age_group: ageGroup, created_by: user.id })
    .select()
    .single()

  if (error || !grade) {
    console.error('[createGrade]', error?.code, error?.message)
    toast.error('Could not create grade — please try again')
    return null
  }

  if (chapterIds.length) {
    const rows = chapterIds.map((id, i) => ({ grade_id: grade.id, chapter_id: id, sort_order: i }))
    const { error: ce } = await supabase.from('grade_chapters').insert(rows)
    if (ce) console.error('[createGrade] chapters', ce.message)
  }
  return grade as Grade
}

/** Rename a grade and/or replace its chapter set (delete + re-insert in order). */
export async function updateGrade(
  gradeId: string,
  opts: { name?: string; chapterIds?: ChapterType[] },
): Promise<boolean> {
  const supabase = db()

  if (opts.name !== undefined) {
    const { error } = await supabase.from('grades').update({ name: opts.name.trim() }).eq('id', gradeId)
    if (error) { console.error('[updateGrade] name', error.message); toast.error('Could not save grade'); return false }
  }

  if (opts.chapterIds) {
    const { error: de } = await supabase.from('grade_chapters').delete().eq('grade_id', gradeId)
    if (de) { console.error('[updateGrade] clear', de.message); toast.error('Could not save chapters'); return false }
    if (opts.chapterIds.length) {
      const rows = opts.chapterIds.map((id, i) => ({ grade_id: gradeId, chapter_id: id, sort_order: i }))
      const { error: ie } = await supabase.from('grade_chapters').insert(rows)
      if (ie) { console.error('[updateGrade] chapters', ie.message); toast.error('Could not save chapters'); return false }
    }
  }
  return true
}

/** Delete a grade. Its children revert to the band default (FK ON DELETE SET NULL). */
export async function deleteGrade(gradeId: string): Promise<boolean> {
  const supabase = db()
  const { error } = await supabase.from('grades').delete().eq('id', gradeId)
  if (error) { console.error('[deleteGrade]', error.message); toast.error('Could not delete grade'); return false }
  return true
}
