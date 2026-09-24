'use client'

/**
 * Lesson progress on the account, points, and game time (migration 20260917112109; rules in docs/new-flow/points.md).
 * Points are computed by the database from what changed — nothing here sends a number of points.
 */
import { db, classifySyncError, type SyncOutcome } from '@/data/repositories/_shared'

export interface LessonRow { lesson_id: string; done: boolean; level: number; streak: number; mastered: boolean; run?: unknown }
export interface Wallet {
  balance: number; points_per_minute: number; enabled: boolean; minutes_per_day: number; time_zone: string
  minutes_used_today: number; playing_until: string | null
}
export type GameStart = { ok: true; playing_until: string; balance: number } | { ok: false; error: 'off' | 'daily_limit' | 'not_enough_points' | 'bad_minutes' | 'failed' }

/** The functions are not in the database yet (this code deployed before the migration). */
const missing = (e: { code?: string; message?: string }) => e.code === 'PGRST202' || e.code === 'PGRST205' || /Could not find the (function|table)/i.test(e.message ?? '')

/**
 * ⚠️ A CHAPTER ID AGAINST THE OLD CHECK IS A DEPLOY-ORDER SYMPTOM, NOT A BAD ROW.
 *
 * `classifySyncError` classes `23514 check_violation` as **'drop'** — correct for a genuinely
 * malformed row, and catastrophic here: until `20260920120000` is applied, `lesson_progress`
 * rejects every `c:` id, so a child's whole chapter would be silently discarded with no error
 * anywhere. `main` auto-deploys and migrations are applied by hand, so code-first is the DEFAULT
 * order on this repo, which makes this the likely path rather than the unlucky one.
 *
 * Narrow on purpose: only a check violation, and only for a `c:` id — the exact case that
 * migration fixes. A genuinely bad row still drops rather than looping in the queue for ever.
 */
const awaitingChapterIds = (e: { code?: string; message?: string }, args: Record<string, unknown>) =>
  e.code === '23514' && typeof args.p_lesson === 'string' && args.p_lesson.startsWith('c:')

async function send(fn: string, args: Record<string, unknown>): Promise<SyncOutcome> {
  try {
    const { error } = await db().rpc(fn, args)
    // Not applied yet: keep it queued, so nothing earned before the migration is lost.
    return !error ? 'ok'
      : missing(error) || awaitingChapterIds(error, args) ? 'retry'
      : classifySyncError(error)
  } catch { return 'retry' }
}

export const recordLessonProgress = (learnerId: string, lessonId: string, s: Omit<LessonRow, 'lesson_id'>, outcome?: string, event?: string) =>
  send('record_lesson_progress', {
    p_learner: learnerId, p_lesson: lessonId, p_done: s.done, p_level: s.level, p_streak: s.streak, p_mastered: s.mastered,
    p_outcome: outcome ?? null, p_event: event ?? null,
  })

export const recordModulePractice = (learnerId: string, moduleId: string, event: string) =>
  send('record_module_practice', { p_learner: learnerId, p_module: moduleId, p_event: event })

/**
 * Where the child is in a topic's practice (migration 20260925100000). A database without the function answers 'ok',
 * not 'retry': the device keeps its own copy, and progress and points queued behind it must not wait for a resume
 * position — the queue stops at the first 'retry'.
 */
export async function recordPracticeRun(learnerId: string, lessonId: string, run: unknown): Promise<SyncOutcome> {
  try {
    const { error } = await db().rpc('save_practice_run', { p_learner: learnerId, p_lesson: lessonId, p_run: run })
    return !error || missing(error) ? 'ok' : classifySyncError(error)
  } catch { return 'retry' }
}

const COLS = 'lesson_id, done, level, streak, mastered'
/** null = could not read (offline, or not migrated yet). Reads `run` too, and without it on a database that lacks the column. */
export async function getLessonRows(learnerId: string): Promise<LessonRow[] | null> {
  try {
    const read = (cols: string) => db().from('lesson_progress').select(cols).eq('learner_id', learnerId)
    let { data, error } = await read(`${COLS}, run`)
    if (error?.code === '42703') ({ data, error } = await read(COLS))   // the column is not there yet (code deployed first)
    return error ? null : (data as unknown as LessonRow[])
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

