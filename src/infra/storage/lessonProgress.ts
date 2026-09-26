'use client'
/**
 * Which new-flow lessons a learner has finished. Per-device kv, same shape as [[lessonSeen]] — the fast
 * copy the screens read synchronously. It IS synced to the account: [[lessonSync]] queues each change for
 * `lesson_progress` (sent when online) and pulls the account's rows back into it.
 */
import { kv } from '@/infra/storage/kv'

const key = (learnerId: string | null | undefined, lessonId: string) => `milo-newflow-done-${learnerId || 'device'}-${lessonId}`

export function lessonDone(learnerId: string | null | undefined, lessonId: string): boolean {
  try { return kv.get(key(learnerId, lessonId)) === '1' } catch { return false }
}

export function markLessonDone(learnerId: string | null | undefined, lessonId: string): void {
  try { kv.set(key(learnerId, lessonId), '1') } catch { /* best-effort */ }
}
