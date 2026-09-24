'use client'
/**
 * Where a child is in a topic's practice (a saved `Run`, see features/lessons/adaptive.ts), so Take a break — or closing
 * the app — continues from exactly there next time. Per-device kv, same shape as [[lessonStanding]]; synced to
 * `lesson_progress.run` by [[lessonSync]].
 * Signed-in children only: a signed-out visitor's practice is not kept (doc 08: nothing is stored about a child who is
 * not signed in).
 */
import { kv } from '@/infra/storage/kv'
import type { SavedRun } from '@/features/lessons/adaptive'

const key = (learnerId: string, lessonId: string) => `milo-newflow-run-${learnerId}-${lessonId}`

/** The shape check a run read from the device OR the account must pass; anything else is treated as no run. */
export function validRun(x: unknown): x is SavedRun {
  const r = x as SavedRun | null
  return !!r && Number.isInteger(r.asked) && r.asked >= 0 && Array.isArray(r.recent) && r.recent.every(t => typeof t === 'string')
    && !!r.current && typeof r.current.from === 'string' && !!r.current.problem && typeof r.current.problem.text === 'string'
    && (r.review === null || typeof r.review === 'string')
}

export function loadRun(learnerId: string | null | undefined, lessonId: string): SavedRun | null {
  if (!learnerId) return null
  try {
    const r = JSON.parse(kv.get(key(learnerId, lessonId)) ?? 'null')
    return validRun(r) ? r : null
  } catch { return null }
}

export function saveRun(learnerId: string | null | undefined, lessonId: string, r: SavedRun): void {
  if (!learnerId) return
  try { kv.set(key(learnerId, lessonId), JSON.stringify(r)) } catch { /* best-effort */ }
}
