'use client'

/**
 * Lesson progress on the account, points, and game time (migration 20260917112109; rules in docs/new-flow/points.md).
 * Points are computed by the database from what changed — nothing here sends a number of points.
 */
import { db, classifySyncError, type SyncOutcome } from '@/data/repositories/_shared'

export interface LessonRow { lesson_id: string; done: boolean; level: number; streak: number; mastered: boolean }
export interface Wallet {
  balance: number; points_per_minute: number; enabled: boolean; minutes_per_day: number; time_zone: string
  minutes_used_today: number; playing_until: string | null
}
export type GameStart = { ok: true; playing_until: string; balance: number } | { ok: false; error: 'off' | 'daily_limit' | 'not_enough_points' | 'bad_minutes' | 'failed' }

/** The functions are not in the database yet (this code deployed before the migration). */
const missing = (e: { code?: string; message?: string }) => e.code === 'PGRST202' || e.code === 'PGRST205' || /Could not find the (function|table)/i.test(e.message ?? '')

async function send(fn: string, args: Record<string, unknown>): Promise<SyncOutcome> {
  try {
    const { error } = await db().rpc(fn, args)
    // Not applied yet: keep it queued, so nothing earned before the migration is lost.
    return !error ? 'ok' : missing(error) ? 'retry' : classifySyncError(error)
  } catch { return 'retry' }
}

export const recordLessonProgress = (learnerId: string, lessonId: string, s: Omit<LessonRow, 'lesson_id'>, outcome?: string, event?: string) =>
  send('record_lesson_progress', {
    p_learner: learnerId, p_lesson: lessonId, p_done: s.done, p_level: s.level, p_streak: s.streak, p_mastered: s.mastered,
    p_outcome: outcome ?? null, p_event: event ?? null,
  })

export const recordModulePractice = (learnerId: string, moduleId: string, event: string) =>
  send('record_module_practice', { p_learner: learnerId, p_module: moduleId, p_event: event })

/** null = could not read (offline, or not migrated yet). */
export async function getLessonRows(learnerId: string): Promise<LessonRow[] | null> {
  try {
    const { data, error } = await db().from('lesson_progress').select('lesson_id, done, level, streak, mastered').eq('learner_id', learnerId)
    return error ? null : (data as LessonRow[])
  } catch { return null }
}

/** The last `days` days of the points ledger, for the Performance screen. null = could not read. */
export async function getRecentPoints(learnerId: string, days: number): Promise<{ lesson_id: string | null; reason: string; points: number; created_at: string }[] | null> {
  try {
    const since = new Date(Date.now() - days * 86_400_000).toISOString()
    const { data, error } = await db().from('point_events').select('lesson_id, reason, points, created_at')
      .eq('learner_id', learnerId).gte('created_at', since).order('created_at')
    return error ? null : data
  } catch { return null }
}

/** 'unavailable' = not migrated yet; null = could not read. */
export async function getWallet(learnerId: string): Promise<Wallet | 'unavailable' | null> {
  try {
    const { data, error } = await db().rpc('game_wallet', { p_learner: learnerId })
    return error ? (missing(error) ? 'unavailable' : null) : (data as Wallet)
  } catch { return null }
}

export async function startGameTime(learnerId: string, minutes: number): Promise<GameStart> {
  try {
    const { data, error } = await db().rpc('start_game_time', { p_learner: learnerId, p_minutes: minutes })
    return error ? { ok: false, error: 'failed' } : (data as GameStart)
  } catch { return { ok: false, error: 'failed' } }
}

export async function setGameSettings(learnerId: string, enabled: boolean, minutesPerDay: number): Promise<boolean> {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    const { data, error } = await db().rpc('set_game_settings', { p_learner: learnerId, p_enabled: enabled, p_minutes_per_day: minutesPerDay, p_time_zone: timeZone })
    return !error && (data as { ok: boolean }).ok
  } catch { return false }
}
