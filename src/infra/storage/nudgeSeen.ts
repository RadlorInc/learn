'use client'
/**
 * The day a child last saw the prerequisite nudge on a topic, so it shows at most once per topic per day. Per-device kv.
 * ponytail: per device — a second tablet can show it once more the same day. Move to the account if that matters.
 */
import { kv } from '@/infra/storage/kv'

const key = (learnerId: string, lessonId: string) => `milo-nudge-${learnerId}-${lessonId}`
/** The device's local date, YYYY-MM-DD: "today" as the child lives it, not UTC. */
export const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function nudgeShownToday(learnerId: string, lessonId: string, now = new Date()): boolean {
  try { return kv.get(key(learnerId, lessonId)) === today(now) } catch { return false }
}
export function markNudgeShown(learnerId: string, lessonId: string, now = new Date()): void {
  try { kv.set(key(learnerId, lessonId), today(now)) } catch { /* best-effort */ }
}
