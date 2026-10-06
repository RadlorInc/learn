'use client'
/**
 * Lesson progress follows the child's account, not the device (founder, 2026-09-17).
 *
 * The device stays the fast copy the screens read synchronously ([[lessonProgress]], [[lessonStanding]]); every change
 * is also queued for the server, and a queue that cannot send (offline, or the migration not applied yet) keeps its
 * items and sends them later. On opening the child's home, what the account holds is pulled back into the device.
 * Points ride on the uploads: the database decides them from what changed (docs/product/points.md).
 */
import { kv } from '@/infra/storage/kv'
import { lessonDone, markLessonDone } from '@/infra/storage/lessonProgress'
import { loadStanding, saveStanding, standingAt } from '@/infra/storage/lessonStanding'
import { loadRun, saveRun } from '@/infra/storage/lessonRun'
import { FRESH, type Outcome, type SavedRun } from '@/features/lessons/adaptive'
import { recordLessonProgress, recordModulePractice, recordPracticeRun, getLessonRows, sessionUserId, lastSyncErrorCode, type LessonRow } from '@/data/repositories/points'
import { markConsentBlocked, clearConsentBlocked } from '@/features/consent/childPause'
import { recordError } from '@/infra/storage/lastError'
import { noteSync } from '@/infra/storage/syncStatus'
import { reportCrash } from '@/infra/reportCrash'

// `owner` = the account that queued it (stamped by the first flush after it was queued, which is the flush the enqueue
// itself starts). The queue is one per DEVICE, so it can hold items of an account that is not signed in right now.
// `refusedAt` = when the database first refused it for good ('drop', below); absent until then.
type Item = { id: string; learnerId: string; owner?: string; refusedAt?: number } & (
  | { lessonId: string; outcome?: Outcome; event?: string }
  | { moduleId: string; event: string }
  | { runOf: string })

const QUEUE = 'milo-lesson-sync-queue'
// ponytail: oldest dropped past this — a device offline for weeks loses the points of its oldest answers, not its progress
// (progress is re-read from the device on every upload, so the newest item for a topic carries it).
const MAX = 2000

/**
 * How long an item the database refuses "for good" (classifySyncError's 'drop': 23503, 42501, 23502, 23514, 22P02, an
 * RLS message) stays on the device, retried, before it is deleted. Those codes are right for one bad row, but a bad
 * migration or policy answers them for EVERY row — and deleting on the first refusal would erase every family's
 * waiting answers before anyone saw a report. A week is time to see the reports (below) and ship a fix; a row that
 * truly can never succeed (its learner was deleted) still leaves, so nothing waits for ever.
 */
const REFUSED_KEEP_MS = 7 * 24 * 60 * 60 * 1000

const read = (): Item[] => { try { return JSON.parse(kv.get(QUEUE) ?? '[]') } catch { return [] } }
const write = (q: Item[]) => {
  try {
    if (q.length > MAX) recordError(`upload queue full: ${q.length - MAX} oldest dropped`, 'sync')
    kv.set(QUEUE, JSON.stringify(q.slice(-MAX)))
  } catch (e) { recordError(e, 'sync-queue-write') }
}
const uuid = () => crypto.randomUUID()

/** A topic changed on this device (a problem answered, the lesson finished). `outcome` = a problem was answered. */
export function syncLesson(learnerId: string | null, lessonId: string, outcome?: Outcome): void {
  if (!learnerId) return
  write([...read(), { id: uuid(), learnerId, lessonId, ...(outcome ? { outcome, event: uuid() } : {}) }])
  void flushLessonSync()
}

export function syncModulePractice(learnerId: string | null, moduleId: string): void {
  if (!learnerId) return
  write([...read(), { id: uuid(), learnerId, moduleId, event: uuid() }])
  void flushLessonSync()
}

/** Where the child is in a topic's practice changed. One upload per topic is enough: it sends the device's run as it is then. */
export function syncRun(learnerId: string | null, lessonId: string): void {
  if (!learnerId) return
  const q = read()
  if (!q.some(x => 'runOf' in x && x.learnerId === learnerId && x.runOf === lessonId)) write([...q, { id: uuid(), learnerId, runOf: lessonId }])
  void flushLessonSync()
}

// The signed-in account as of the last flush; undefined before the first one on this page.
let me: string | null | undefined
const mine = (x: Item, who: string | null | undefined) => who === undefined || (x.owner ?? who) === who

/** How many of this account's uploads are waiting. The offline banner's number — it used to count `sessions`. */
export const pendingLessonUploads = (): number => read().filter(x => mine(x, me)).length

let flushing: Promise<void> | null = null
/** Sends the signed-in account's queued items in order; a learner stops at its first item to retry, so its order is kept. */
export function flushLessonSync(): Promise<void> {
  // ⚠️ Cleared in `.finally`, never inside `send`: with an empty queue `send` finishes synchronously, and a
  // `finally { flushing = null }` in there ran BEFORE the assignment — leaving a settled promise that every later
  // flush returned, so nothing was ever uploaded again. Caught by lessonSync.test.ts.
  return (flushing ??= send().finally(() => { flushing = null }))
}

async function send(): Promise<void> {
  me = await sessionUserId()
  // ⚠️ No session, or another account: its items are NOT sent. Sent, they come back 42501 (anon has no EXECUTE; the
  // function refuses a learner the caller cannot reach) and 42501 is 'drop' — the child's answers and points were
  // deleted on the /auth page after a sign-out, or under the next account on a shared device (BUG-01). They wait for
  // their owner instead. For the owner itself, 42501 does mean "never": the learner was deleted or access removed.
  if (!me) return
  const who = me
  if (read().some(x => !x.owner)) write(read().map(x => x.owner ? x : { ...x, owner: who }))
  const tried = new Set<string>(), held = new Set<string>()
  let left = false
  for (;;) {
    // Re-read each time: something may have been queued while the last one was sending. A learner with an item to
    // retry is held, so that learner's order is kept, but nobody else's uploads wait behind it (BUG-04).
    const item = read().find(x => !tried.has(x.id) && (x.owner ?? who) === who && !held.has(x.learnerId))
    // Tried already = the queue could not be written (storage full): stop rather than send it forever.
    if (!item) break
    tried.add(item.id)
    const r = 'runOf' in item
      ? await recordPracticeRun(item.learnerId, item.runOf, loadRun(item.learnerId, item.runOf))
      : 'moduleId' in item
      ? await recordModulePractice(item.learnerId, item.moduleId, item.event)
      : await recordLessonProgress(item.learnerId, item.lessonId,
          { done: lessonDone(item.learnerId, item.lessonId), ...(loadStanding(item.learnerId, item.lessonId) ?? FRESH),
            at: standingAt(item.learnerId, item.lessonId) },
          item.outcome, item.event)
    noteSync(r === 'ok' ? undefined : r === 'blocked' ? 'P0C01' : lastSyncErrorCode())
    // 'blocked' (no consent the gate accepts yet) is held like a retry — the answer waits on this device, never deleted —
    // and the child's screen is told, which asks the adult who added them for consent (features/consent/childPause).
    if (r === 'retry' || r === 'blocked') { left = true; held.add(item.learnerId); if (r === 'blocked') markConsentBlocked(item.learnerId); continue }
    if (r === 'drop') {
      // Refused for good: kept and retried for REFUSED_KEEP_MS (see there), without holding the learner's later items
      // (each re-reads the device when it sends, so order does not matter for them). Reported both times, so a bad
      // migration shows up in error_events while the answers are still on the devices.
      const code = lastSyncErrorCode()
      if (!item.refusedAt) {
        write(read().map(x => x.id === item.id ? { ...x, refusedAt: Date.now() } : x))
        reportCrash(new Error(`upload refused ${code}: kept on the device, retrying`), 'sync')
        left = true
        continue
      }
      if (Date.now() - item.refusedAt < REFUSED_KEEP_MS) { left = true; continue }
      reportCrash(new Error(`upload refused ${code} for 7 days: deleted from the device`), 'sync')
    }
    write(read().filter(x => x.id !== item.id))
    if (r === 'ok') clearConsentBlocked(item.learnerId)
  }
  retryLater(left)
}

/**
 * While this account has uploads that did not go through, try again on a timer: 30 s, doubling to 10 min, and stop when
 * nothing is left. Before this, a failed upload waited for the next answer, an `online` event or a reload — a family
 * that stopped playing kept its work on the device until it came back. Offline, the `online` event retries instead.
 */
const RETRY_FIRST = 30_000, RETRY_MAX = 600_000
let retryIn = RETRY_FIRST
let retryTimer: ReturnType<typeof setTimeout> | undefined
function retryLater(left: boolean): void {
  clearTimeout(retryTimer)
  retryTimer = undefined
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('lesson-sync'))   // the offline bar re-counts
  if (!left) { retryIn = RETRY_FIRST; return }
  if (typeof navigator !== 'undefined' && !navigator.onLine) return
  retryTimer = setTimeout(() => { retryTimer = undefined; void flushLessonSync() }, retryIn)
  retryIn = Math.min(retryIn * 2, RETRY_MAX)
}

/**
 * Brings the account's progress for `lessonIds` onto this device, and uploads what only this device has (progress made
 * before sync existed). A topic with an upload still queued keeps the device's copy — it is the newer one.
 * Returns the account's rows as read (so a caller that also needs them does not read `lesson_progress` again — PERF-03),
 * or null when the account could not be read (the device copy is left as it is).
 */
export async function pullLessonProgress(learnerId: string, lessonIds: readonly string[]): Promise<LessonRow[] | null> {
  await flushLessonSync()
  const rows = await getLessonRows(learnerId)
  if (!rows) return null
  const server = new Map(rows.map(r => [r.lesson_id, r]))
  const pending = new Set(read().flatMap(x => (x.learnerId === learnerId && 'lessonId' in x ? [x.lessonId] : x.learnerId === learnerId && 'runOf' in x ? [x.runOf] : [])))
  const upload: string[] = [], runs: string[] = []
  for (const id of lessonIds) {
    if (pending.has(id)) continue
    const row = server.get(id), localDone = lessonDone(learnerId, id), local = loadStanding(learnerId, id), localRun = loadRun(learnerId, id)
    if (!row) { if (localDone || local) upload.push(id); if (localRun) runs.push(id); continue }
    if (localDone && !row.done) upload.push(id)
    if (row.done) markLessonDone(learnerId, id)
    saveStanding(learnerId, id, { level: row.level, streak: row.streak, mastered: row.mastered }, row.answered_at ? Date.parse(row.answered_at) : 0)
    // Where the child is in practice: the account's copy wins, as the standing does; one only this device has goes up.
    // (Stored as it came: `loadRun` checks the shape of every run it reads, from whichever side it came.)
    if (row.run) saveRun(learnerId, id, row.run as SavedRun)
    else if (localRun && row.run === null) runs.push(id)
  }
  const items = [...upload.map(lessonId => ({ id: uuid(), learnerId, lessonId })), ...runs.map(runOf => ({ id: uuid(), learnerId, runOf }))]
  if (items.length) { write([...read(), ...items]); await flushLessonSync() }
  return rows
}

/** Class-exercise answers that could not be sent yet (features/classes/ExerciseHome), in localStorage — the device's
 *  second upload queue. Named here because sign-out must know who is still waiting in it. */
export const EXERCISE_PENDING = 'exercise-results-pending'

/** Uploads waiting on this device for the signed-in account: the lesson queue plus the class-exercise answers.
 *  Sign-out warns when this is above 0 (data/repositories/profile.ts). */
export function unsentOnDevice(): number {
  let exercises = 0
  try { const p: unknown = JSON.parse(localStorage.getItem(EXERCISE_PENDING) ?? '[]'); exercises = Array.isArray(p) ? p.length : 0 } catch { /* unreadable */ }
  return pendingLessonUploads() + exercises
}

/**
 * EVERY key on this device that belongs to one child; group 1 is the child. The one place that knows these shapes — a
 * new per-child key that is not added here stays on the device after sign-out.
 *  kv: topic done / standing / practice run (lessonProgress, lessonStanding, lessonRun), a chapter's lesson seen
 *  (lessonSeen), the nudge day (nudgeSeen), a chapter's unfinished run (chapterResume), the last chapter (lastPlayed).
 *  localStorage: the older plan record (activePlan), a class exercise marked done (ExerciseHome).
 *  No longer written, still on devices used before 20 September 2026: kv `milo-profile-` (the old profile store, the
 *  child's name included), `milo-chlvl-` (chapter level), `milo-diag-resume-` (placement check); localStorage
 *  `milo_checkup_done_` / `milo_checkup_skips_` (placement check).
 * Not here, on purpose: the two queues; the signed-out `…-device-…` and `exercise-done:none:…` keys (doc 08); and
 * `al-dash-prefs:<account id>`, which is the ADULT's own dashboard choices, not a child's.
 */
const CHILD_KEY = /^(?:milo-newflow-(?:done|standing|run)-|milo-lesson-|milo-nudge-|milo-chres-|milo-last-played-|milo-profile-|milo-chlvl-|milo-diag-resume-|milo_active_plan_|milo_checkup_(?:done|skips)_|exercise-done:)([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:[-:]|$)/i

/**
 * Sign-out (N16 / ARC-02; founder, 2026-09-28): removes every child's keys from this device, so a shared or school
 * computer does not keep every child the dashboard ever showed. The account holds what matters and the next sign-in
 * pulls it back.
 * ⚠️ A child with ANY upload still waiting — in the lesson queue or in the pending class-exercise answers — keeps all
 * of its keys: an upload re-reads the device's copy when it sends (`send` above), so clearing them would upload an
 * empty topic, or nothing. The queues themselves are never touched here.
 */
export function clearChildrenFromDevice(): void {
  let pending: unknown = []
  try { pending = JSON.parse(localStorage.getItem(EXERCISE_PENDING) ?? '[]') } catch { /* unreadable: it cannot be sent either */ }
  const waiting = new Set([...read(), ...(Array.isArray(pending) ? pending : [])].map(x => x?.learnerId))
  const sweep = (keys: string[], remove: (k: string) => void) => {
    for (const k of keys) { const m = CHILD_KEY.exec(k); if (m && !waiting.has(m[1])) remove(k) }
  }
  sweep(kv.keys(), k => kv.remove(k))
  // kv is IndexedDB on most devices, so the localStorage keys are a second sweep, not the same one.
  try { sweep(Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)!), k => localStorage.removeItem(k)) } catch { /* no localStorage */ }
}
