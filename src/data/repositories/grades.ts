'use client'

/** Grades: a teacher's class (below), and the legacy chapter subset still read by the hidden /menu. */
import { toast } from '@/shared/ui/Toast'
import { db } from '@/data/repositories/_shared'
import type { ChapterType, Learner } from '@/data/supabase/types'
import type { Exercise } from '@/features/classes/exercise'

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
export interface ClassRow { id: string; name: string; grade: number; lesson_ids: string[] | null; exercises: Exercise[] }

export async function getMyClasses(): Promise<ClassRow[]> {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return []
  const { data, error } = await db()
    .from('grades')
    .select('id, name, grade, lesson_ids, exercises')
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
    .select('id, name, grade, lesson_ids, exercises')
    .single()
  if (error) { console.error('[createClass]', error.code, error.message); toast.error('Could not create the class — please try again'); return null }
  return data as unknown as ClassRow
}

export async function updateClass(id: string, patch: { name?: string; grade?: number; lesson_ids?: string[] | null; exercises?: Exercise[] }): Promise<boolean> {
  const { data, error } = await db().from('grades').update(patch as never).eq('id', id).select('id')
  if (error || !data?.length) { console.error('[updateClass]', error?.message ?? 'no row'); toast.error('Could not save the class'); return false }
  return true
}

/**
 * Give a class these lessons: the class row, then EVERY student in it, in one update filtered in the database by
 * `grade_id` (RLS limits it to the teacher's own students). Returns how many students were updated, or null on failure.
 * ⚠️ It deliberately takes no list of students. It used to update the students the dashboard had in memory, and that
 * list was stale right after adding students — so on 2026-09-18 a second module reached the class and not the child,
 * with no error, and the panel (which shows the CLASS's modules) said it had worked. The database knows who is in the
 * class; the screen only remembers who was.
 */
export async function setClassLessons(classId: string, lessonIds: string[] | null): Promise<number | null> {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return null
  if (!(await updateClass(classId, { lesson_ids: lessonIds }))) return null
  const { data, error } = await db().from('learners')
    .update({ lesson_ids: lessonIds } as never).eq('grade_id', classId).eq('created_by', user.id).select('id')
  if (error) { console.error('[setClassLessons]', error.code, error.message); toast.error('Saved for the class, but not for its students — try again'); return null }
  return data?.length ?? 0
}

/** Deleting a class keeps its children and their lessons; they just belong to no class (FK ON DELETE SET NULL). */
export async function deleteClass(id: string): Promise<boolean> {
  const { error } = await db().from('grades').delete().eq('id', id)
  if (error) { console.error('[deleteClass]', error.message); toast.error('Could not delete the class'); return false }
  return true
}

/**
 * Has this teacher paid (founder, 2026-09-18)? A paid teacher's students get the class's modules; a free teacher's get
 * the class's exercises only. `teacher_plans` is read-only to every client — no row = free.
 */
export async function getMyTeacherPaid(): Promise<boolean> {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return false
  const { data, error } = await db().from('teacher_plans' as never).select('paid').eq('teacher_id', user.id).maybeSingle()
  if (error) { console.warn('[getMyTeacherPaid]', error.message); return false }
  return (data as { paid?: boolean } | null)?.paid === true
}

/** `lessons` may still carry the class's exercises: a PAID teacher's students get both (founder, 2026-09-18). */
export type ClassMode = { mode: 'lessons'; className?: string; exercises?: Exercise[] } | { mode: 'exercises'; className: string; exercises: Exercise[] }

/**
 * What a child sees: their lessons (plus the class's exercises, in a paid teacher's class), or — in a class whose
 * teacher has not paid — that class's exercises only.
 * A child in no class (every parent's child) always gets lessons.
 * ⚠️ FAILS OPEN to lessons when it cannot tell (offline, or a deploy ahead of its migration), so a child is never shown
 * an empty screen by a lookup that failed. The gate is a product rule, not a data boundary: lesson content ships in
 * the app bundle regardless.
 */
export async function getClassMode(learner: Pick<Learner, 'grade_id' | 'created_by'> | null): Promise<ClassMode> {
  if (!learner?.grade_id || !learner.created_by) return { mode: 'lessons' }
  const { data: cls, error } = await db().from('grades').select('name, grade, exercises').eq('id', learner.grade_id).maybeSingle()
  const c = cls as { name: string; grade: number | null; exercises: Exercise[] | null } | null
  if (error || !c || c.grade == null) return { mode: 'lessons' }          // a legacy chapter grade is not a class
  const { data: plan, error: pe } = await db().from('teacher_plans' as never).select('paid').eq('teacher_id', learner.created_by).maybeSingle()
  if (pe) { console.warn('[getClassMode]', pe.message); return { mode: 'lessons' } }
  const exercises = c.exercises ?? []
  return (plan as { paid?: boolean } | null)?.paid
    ? { mode: 'lessons', className: c.name, exercises }
    : { mode: 'exercises', className: c.name, exercises }
}
