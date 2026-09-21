'use client'

import { db } from '@/data/repositories/_shared'

/** The reasons a child can tap — the same keys the table's check constraint allows (migration 20260921053233). */
export const FEEDBACK_REASONS = ['fast', 'words', 'picture', 'hear', 'math', 'broken'] as const
export type FeedbackReason = typeof FEEDBACK_REASONS[number]

/** One "I didn't get this screen" send. Resolves false on any failure, so the screen can say it did not go. */
export async function sendLessonFeedback(learnerId: string, lessonId: string, screen: string, reasons: FeedbackReason[]): Promise<boolean> {
  try {
    const { error } = await db().from('lesson_feedback' as never)
      .insert({ learner_id: learnerId, lesson_id: lessonId, screen, reasons } as never)
    if (error) console.warn('[sendLessonFeedback]', error.code, error.message)
    return !error
  } catch { return false }
}
