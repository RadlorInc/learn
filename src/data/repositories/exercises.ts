'use client'

/**
 * Exercises — a teacher's set work, and the results children send back.
 *
 * An exercise is deliberately thin: a chapter id, a tier and a count. There is no new question
 * engine, because the app already has one per chapter — `topic` says WHICH generator, `difficulty`
 * says which of that chapter's own 1–3 tiers, and the child plays it through the ordinary play
 * path. The whole feature is a row plus a button.
 *
 * ⚠️ LOCKED IS INVISIBLE, NOT DISABLED. A locked exercise is not merely hidden by the client: the
 * RLS policy on `exercises` refuses to SELECT a row whose `unlocked_at` is null to anyone but the
 * owning teacher. A child cannot see set work early by reading the network tab.
 */
import { db } from '@/data/repositories/_shared'
import { toast } from '@/shared/ui/Toast'
import type { ChapterType } from '@/core/chapters'
import type { Exercise } from '@/data/supabase/types'

/** An exercise plus how the class has done on it, for the teacher's list. */
export interface ExerciseSummary extends Exercise {
  doneCount: number
  correctSum: number
  wrongSum: number
}

/** Every exercise on one class, newest first, with its result tally. */
export async function getGradeExercises(gradeId: string): Promise<ExerciseSummary[]> {
  const supabase = db()
  const { data, error } = await supabase
    .from('exercises')
    .select('*, exercise_results(correct_count, wrong_count)')
    .eq('grade_id', gradeId)
    .order('created_at', { ascending: false })
  if (error) { console.warn('[getGradeExercises]', error.message); return [] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map(e => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rs = (e.exercise_results ?? []) as any[]
    return {
      ...e,
      doneCount:  rs.length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      correctSum: rs.reduce((a: number, r: any) => a + (r.correct_count ?? 0), 0),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      wrongSum:   rs.reduce((a: number, r: any) => a + (r.wrong_count   ?? 0), 0),
    }
  }) as ExerciseSummary[]
}

export async function createExercise(
  gradeId: string,
  topic: ChapterType,
  questionCount: number,
  difficulty: 1 | 2 | 3,
): Promise<Exercise | null> {
  const supabase = db()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { console.error('[createExercise] no user'); return null }

  const { data, error } = await supabase
    .from('exercises')
    // ⚠️ No `unlocked_at` — an exercise is born LOCKED. Nothing but the unlock button sets it, so
    // there is no path where a teacher creates work and children see it before she means them to.
    .insert({
      grade_id: gradeId, created_by: user.id, topic,
      question_count: questionCount, difficulty,
    })
    .select()
    .single()

  if (error) { console.error('[createExercise]', error.message); toast.error('Could not create that exercise'); return null }
  return data as Exercise
}

/** The unlock button. Sets `unlocked_at`, which is the only thing that puts work on a child's screen. */
export async function setExerciseUnlocked(exerciseId: string, unlocked: boolean): Promise<boolean> {
  const supabase = db()
  const { error } = await supabase
    .from('exercises')
    .update({ unlocked_at: unlocked ? new Date().toISOString() : null })
    .eq('id', exerciseId)
  if (error) { console.error('[setExerciseUnlocked]', error.message); toast.error('Could not change that exercise'); return false }
  return true
}

export async function deleteExercise(exerciseId: string): Promise<boolean> {
  const supabase = db()
  const { error } = await supabase.from('exercises').delete().eq('id', exerciseId)
  if (error) { console.error('[deleteExercise]', error.message); toast.error('Could not delete that exercise'); return false }
  return true
}

/**
 * The unlocked exercises waiting for one child, with whether they have already been done.
 *
 * Returns [] for a child on no roster, which is the ordinary case for a family that never met a
 * teacher — so every caller can render this unconditionally.
 */
export async function getLearnerExercises(
  learnerId: string,
  gradeId: string | null,
): Promise<{ exercise: Exercise; done: boolean }[]> {
  if (!gradeId) return []
  const supabase = db()
  const { data, error } = await supabase
    .from('exercises')
    .select('*, exercise_results!left(learner_id)')
    .eq('grade_id', gradeId)
    .not('unlocked_at', 'is', null)
    .order('unlocked_at', { ascending: false })
  if (error) { console.warn('[getLearnerExercises]', error.message); return [] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map(e => ({
    exercise: e as Exercise,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    done: ((e.exercise_results ?? []) as any[]).some((r: any) => r.learner_id === learnerId),
  }))
}

/**
 * Record that a child finished a piece of set work.
 *
 * Upsert on (exercise_id, learner_id): replaying set work updates the row rather than stacking
 * duplicates, so the teacher's "how many have done it" is a count of children and not of attempts.
 */
export async function recordExerciseResult(
  exerciseId: string,
  learnerId: string,
  correct: number,
  wrong: number,
): Promise<boolean> {
  const supabase = db()
  const { error } = await supabase
    .from('exercise_results')
    .upsert(
      { exercise_id: exerciseId, learner_id: learnerId, correct_count: correct, wrong_count: wrong,
        completed_at: new Date().toISOString() },
      { onConflict: 'exercise_id,learner_id' },
    )
  if (error) { console.warn('[recordExerciseResult]', error.message); return false }
  return true
}
