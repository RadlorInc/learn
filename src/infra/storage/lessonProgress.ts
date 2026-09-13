'use client'
/**
 * Which new-flow lessons a learner has finished. Per-device kv, same shape as [[lessonSeen]].
 * ponytail: device-local only — not synced to Supabase yet (a session row needs a `chapters` row for
 * each lesson id, i.e. a migration). Add that when lessons need to follow a child across devices.
 */
import { kv } from '@/infra/storage/kv'

const key = (learnerId: string | null | undefined, lessonId: string) => `milo-newflow-done-${learnerId || 'device'}-${lessonId}`

export function lessonDone(learnerId: string | null | undefined, lessonId: string): boolean {
  try { return kv.get(key(learnerId, lessonId)) === '1' } catch { return false }
}

export function markLessonDone(learnerId: string | null | undefined, lessonId: string): void {
  try { kv.set(key(learnerId, lessonId), '1') } catch { /* best-effort */ }
}
