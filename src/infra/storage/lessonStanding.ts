'use client'
/**
 * Where a learner stands on each topic's ladder (see features/lessons/adaptive.ts). Per-device kv, same shape as [[lessonProgress]].
 * ponytail: device-local only, like lesson progress — a child who switches tablet starts each topic fresh. Sync it with
 * lesson progress when that gets its migration.
 */
import { kv } from '@/infra/storage/kv'
import type { Standing } from '@/features/lessons/adaptive'

const key = (learnerId: string | null | undefined, lessonId: string) => `milo-newflow-standing-${learnerId || 'device'}-${lessonId}`

export function loadStanding(learnerId: string | null | undefined, lessonId: string): Standing | null {
  try {
    const s = JSON.parse(kv.get(key(learnerId, lessonId)) ?? 'null')
    return s && Number.isInteger(s.level) && Number.isInteger(s.streak) && typeof s.mastered === 'boolean'
      ? { level: s.level, streak: s.streak, mastered: s.mastered } : null
  } catch { return null }
}

/**
 * When this device's standing was produced (ms), so the account keeps the NEWEST answered standing rather than the last
 * upload (BUG-02: a stale tablet rolled a child back). 0 = unknown / never answered here — older than anything stamped.
 */
export function standingAt(learnerId: string | null | undefined, lessonId: string): number {
  try { const t = JSON.parse(kv.get(key(learnerId, lessonId)) ?? 'null')?.at; return Number.isFinite(t) ? t : 0 } catch { return 0 }
}

/** `at` defaults to now (an answer just produced it); the pull passes the account's own time. Signed out, no time is kept. */
export function saveStanding(learnerId: string | null | undefined, lessonId: string, s: Standing, at = Date.now()): void {
  const { level, streak, mastered } = s
  try { kv.set(key(learnerId, lessonId), JSON.stringify(learnerId ? { level, streak, mastered, at } : { level, streak, mastered })) } catch { /* best-effort */ }
}
