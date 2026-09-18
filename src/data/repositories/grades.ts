'use client'

/** Grades: a teacher's class (below), and the legacy chapter subset still read by the hidden /menu. */
import { toast } from '@/shared/ui/Toast'
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

/**
 * A teacher's CLASS (2026-09-18) is a `grades` row made on the new page: a name, a Grade 3–8 and the lessons it was
 * given. RLS scopes every read and write to its creator. Old chapter grades (no `grade`) are not classes and are
 * never listed. Each child is in at most one class (`learners.grade_id`).
 */
export interface ClassRow { id: string; name: string; grade: number; lesson_ids: string[] | null }

export async function getMyClasses(): Promise<ClassRow[]> {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return []
  const { data, error } = await db()
    .from('grades')
    .select('id, name, grade, lesson_ids')
    .eq('created_by', user.id)          // RLS would also show a class a child of mine is in; a teacher lists only her own
    .not('grade', 'is', null)
    .order('created_at', { ascending: true })
  if (error) { console.warn('[getMyClasses]', error.message); return [] }
  return (data ?? []) as unknown as ClassRow[]
}

export async function createClass(name: string, grade: number): Promise<ClassRow | null> {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return null
  const { data, error } = await db()
    .from('grades')
    .insert({ name: name.trim(), grade, created_by: user.id } as never)
    .select('id, name, grade, lesson_ids')
    .single()
  if (error) { console.error('[createClass]', error.code, error.message); toast.error('Could not create the class — please try again'); return null }
  return data as unknown as ClassRow
}

export async function updateClass(id: string, patch: { name?: string; grade?: number; lesson_ids?: string[] | null }): Promise<boolean> {
  const { data, error } = await db().from('grades').update(patch as never).eq('id', id).select('id')
  if (error || !data?.length) { console.error('[updateClass]', error?.message ?? 'no row'); toast.error('Could not save the class'); return false }
  return true
}

/** Deleting a class keeps its children and their lessons; they just belong to no class (FK ON DELETE SET NULL). */
export async function deleteClass(id: string): Promise<boolean> {
  const { error } = await db().from('grades').delete().eq('id', id)
  if (error) { console.error('[deleteClass]', error.message); toast.error('Could not delete the class'); return false }
  return true
}
