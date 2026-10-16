'use client'

/**
 * Lesson progress on the account, points, and game time (migration 20260917112109; rules in docs/product/points.md).
 * Points are computed by the database from what changed — nothing here sends a number of points.
 */
import { db, classifySyncError, type SyncOutcome } from '@/data/repositories/_shared'

export interface LessonRow { lesson_id: string; done: boolean; level: number; streak: number; mastered: boolean; run?: unknown; answered_at?: string | null }
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

/** Why the last upload below did not go through: a SQLSTATE / PostgREST code, else the message; 'network' when the
 *  request threw. Read by lessonSync for the device's sync status and its reports — a code, never a payload. */
let lastCode = ''
export const lastSyncErrorCode = () => lastCode
const noted = (e: { code?: string; message?: string }) => { lastCode = e.code || (e.message ?? '').slice(0, 80) || 'unknown'; return e }

// Not applied yet (or a chapter id before 20260920120000): keep it queued, so nothing earned before the migration is lost.
const outcomeOf = (e: { code?: string; message?: string }, args: Record<string, unknown>): SyncOutcome =>
  missing(noted(e)) || awaitingChapterIds(e, args) ? 'retry' : classifySyncError(e)

async function send(fn: string, args: Record<string, unknown>): Promise<SyncOutcome> {
  try {
    const { error } = await db().rpc(fn, args)
    return !error ? 'ok' : outcomeOf(error, args)
  } catch { lastCode = 'network'; return 'retry' }
}

/**
 * `s.at`: when the standing was produced (ms; 0/absent = unknown). The database keeps the newest answered standing, so a
 * stale device cannot roll the account back (BUG-02, migration 20260926100200 — on production since September, so the
 * call no longer repeats itself without p_answered_at).
 */
const lessonArgs = (learnerId: string, lessonId: string, s: Omit<LessonRow, 'lesson_id'> & { at?: number }, outcome?: string, event?: string) => ({
  p_learner: learnerId, p_lesson: lessonId, p_done: s.done, p_level: s.level, p_streak: s.streak, p_mastered: s.mastered,
  p_outcome: outcome ?? null, p_event: event ?? null, p_answered_at: new Date(s.at ?? 0).toISOString(),
})
const moduleArgs = (learnerId: string, moduleId: string, event: string) => ({ p_learner: learnerId, p_module: moduleId, p_event: event })

export const recordLessonProgress = (...p: Parameters<typeof lessonArgs>) => send('record_lesson_progress', lessonArgs(...p))
export const recordModulePractice = (...p: Parameters<typeof moduleArgs>) => send('record_module_practice', moduleArgs(...p))

/** One queued upload as `sync_batch` takes it: which function, and its named arguments. */
export type SyncCall = { k: 'lesson' | 'module' | 'run'; a: Record<string, unknown> }
export const lessonCall = (...p: Parameters<typeof lessonArgs>): SyncCall => ({ k: 'lesson', a: lessonArgs(...p) })
export const moduleCall = (...p: Parameters<typeof moduleArgs>): SyncCall => ({ k: 'module', a: moduleArgs(...p) })
export const runCall = (learnerId: string, lessonId: string, run: unknown): SyncCall => ({ k: 'run', a: { p_learner: learnerId, p_lesson: lessonId, p_run: run } })

// Set once the database answers that sync_batch is not there (code deployed before 20261016120000): this page then
// sends one item per request, as before, instead of asking twice for every item.
let noBatch = false
/**
 * The upload queue in ONE request (migration 20261016120000). The database runs the items in order and stops at the
 * first it refuses, so the answer is an outcome per item it got to: 'ok' for each that went through, then the refused
 * one's — what sending them one at a time would have said. null = no sync_batch yet: send them one at a time.
 */
export async function syncBatch(calls: SyncCall[]): Promise<SyncOutcome[] | null> {
  if (noBatch) return null
  try {
    const { data, error } = await db().rpc('sync_batch', { p_items: calls })
    if (error && missing(error)) { noBatch = true; return null }
    // The whole request refused (an expired sign-in, a server error): the first item's outcome, as its own call's would be.
    if (error) return [classifySyncError(noted(error))]
    const r = data as { done: number; code?: string; message?: string }
    const out: SyncOutcome[] = Array(r.done).fill('ok')
    if (r.code) {
      const e = { code: r.code, message: r.message }, c = calls[r.done]
      // A run behind a database without save_practice_run is 'ok', as recordPracticeRun answers (below).
      out.push(c.k === 'run' ? (missing(noted(e)) ? 'ok' : classifySyncError(e)) : outcomeOf(e, c.a))
    }
    return out
  } catch { lastCode = 'network'; return ['retry'] }
}

/**
 * Where the child is in a topic's practice (migration 20260925100000). A database without the function answers 'ok',
 * not 'retry': the device keeps its own copy, and progress and points queued behind it must not wait for a resume
 * position — the queue stops at the first 'retry'.
 */
export async function recordPracticeRun(learnerId: string, lessonId: string, run: unknown): Promise<SyncOutcome> {
  try {
    const { error } = await db().rpc('save_practice_run', { p_learner: learnerId, p_lesson: lessonId, p_run: run })
    return !error || missing(error) ? 'ok' : classifySyncError(noted(error))
  } catch { lastCode = 'network'; return 'retry' }
}

/** The signed-in account's id, or null with no session. A local read (no network) unless the token needs refreshing. */
export async function sessionUserId(): Promise<string | null> {
  try { const { data } = await db().auth.getSession(); return data.session?.user?.id ?? null } catch { return null }
}

const COLS = 'lesson_id, done, level, streak, mastered, updated_at'   // updated_at: the dashboard's "last played" (N18)
/** null = could not read (offline, or not migrated yet). Reads `run` too, and without it on a database that lacks the column. */
export async function getLessonRows(learnerId: string): Promise<LessonRow[] | null> {
  try {
    const read = (cols: string) => db().from('lesson_progress').select(cols).eq('learner_id', learnerId)
    let { data, error } = await read(`${COLS}, run, answered_at`)
    // A column is not there yet (code deployed first): `answered_at` (20260926100200), then `run` (20260925100000).
    if (error?.code === '42703') ({ data, error } = await read(`${COLS}, run`))
    if (error?.code === '42703') ({ data, error } = await read(COLS))
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

/** When each topic was first mastered, all time: lesson id → timestamp. null = could not read. */
export async function getMasteredDates(learnerId: string): Promise<Record<string, string> | null> {
  try {
    const { data, error } = await db().from('point_events').select('lesson_id, created_at')
      .eq('learner_id', learnerId).eq('reason', 'mastered').order('created_at')
    if (error) return null
    const out: Record<string, string> = {}
    for (const r of data as { lesson_id: string | null; created_at: string }[]) if (r.lesson_id && !out[r.lesson_id]) out[r.lesson_id] = r.created_at
    return out
  } catch { return null }
}

/** 'unavailable' = not migrated yet; null = could not read. */
export async function getWallet(learnerId: string): Promise<Wallet | 'unavailable' | null> {
  try {
    const { data, error } = await db().rpc('game_wallet', { p_learner: learnerId })
    return error ? (missing(error) ? 'unavailable' : null) : (data as Wallet)
  } catch { return null }
}

/** Spends points on game time. The database decides everything (balance, the parent's daily minutes, on/off). */
export async function startGameTime(learnerId: string, minutes: number): Promise<GameStart> {
  try {
    const { data, error } = await db().rpc('start_game_time', { p_learner: learnerId, p_minutes: minutes })
    return error ? { ok: false, error: 'failed' } : (data as GameStart)
  } catch { return { ok: false, error: 'failed' } }
}

/** Stops a running game early; the minutes not played come back (migration 20261001180000). The points given back, or null = not stopped. */
export async function endGameTime(learnerId: string): Promise<number | null> {
  try {
    const { data, error } = await db().rpc('end_game_time', { p_learner: learnerId })
    const r = data as { ok: boolean; refunded: number } | null
    return !error && r?.ok ? r.refunded : null
  } catch { return null }
}

export async function setGameSettings(learnerId: string, enabled: boolean, minutesPerDay: number): Promise<boolean> {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    const { data, error } = await db().rpc('set_game_settings', { p_learner: learnerId, p_enabled: enabled, p_minutes_per_day: minutesPerDay, p_time_zone: timeZone })
    return !error && (data as { ok: boolean }).ok
  } catch { return false }
}

