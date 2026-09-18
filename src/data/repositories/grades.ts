'use client'

/** Grade (teacher-defined chapter subset) data access — read-only, for the legacy chapter menu.
 *  Teachers no longer create grades (the Grades page was removed 2026-09-18); lessons are assigned
 *  per child through `learners.lesson_ids`. */
import { db } from '@/data/repositories/_shared'
import type { ChapterType } from '@/data/supabase/types'

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
