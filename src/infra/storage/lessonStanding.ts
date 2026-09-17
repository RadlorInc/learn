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
    return s && Number.isInteger(s.level) && Number.isInteger(s.streak) && typeof s.mastered === 'boolean' ? s : null
  } catch { return null }
}

export function saveStanding(learnerId: string | null | undefined, lessonId: string, s: Standing): void {
  try { kv.set(key(learnerId, lessonId), JSON.stringify(s)) } catch { /* best-effort */ }
}
