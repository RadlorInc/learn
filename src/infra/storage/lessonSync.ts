'use client'
/**
 * Lesson progress follows the child's account, not the device (founder, 2026-09-17).
 *
 * The device stays the fast copy the screens read synchronously ([[lessonProgress]], [[lessonStanding]]); every change
 * is also queued for the server, and a queue that cannot send (offline, or the migration not applied yet) keeps its
 * items and sends them later. On opening the child's home, what the account holds is pulled back into the device.
 * Points ride on the uploads: the database decides them from what changed (docs/new-flow/points.md).
 */
import { kv } from '@/infra/storage/kv'
import { lessonDone, markLessonDone } from '@/infra/storage/lessonProgress'
import { loadStanding, saveStanding } from '@/infra/storage/lessonStanding'
import { loadRun, saveRun } from '@/infra/storage/lessonRun'
import { FRESH, type Outcome, type SavedRun } from '@/features/lessons/adaptive'
import { recordLessonProgress, recordModulePractice, recordPracticeRun, getLessonRows, sessionUserId } from '@/data/repositories/points'

// `owner` = the account that queued it (stamped by the first flush after it was queued, which is the flush the enqueue
// itself starts). The queue is one per DEVICE, so it can hold items of an account that is not signed in right now.
type Item = { id: string; learnerId: string; owner?: string } & (
  | { lessonId: string; outcome?: Outcome; event?: string }
  | { moduleId: string; event: string }
  | { runOf: string })

const QUEUE = 'milo-lesson-sync-queue'
// ponytail: oldest dropped past this — a device offline for weeks loses the points of its oldest answers, not its progress
// (progress is re-read from the device on every upload, so the newest item for a topic carries it).
const MAX = 2000

const read = (): Item[] => { try { return JSON.parse(kv.get(QUEUE) ?? '[]') } catch { return [] } }
const write = (q: Item[]) => { try { kv.set(QUEUE, JSON.stringify(q.slice(-MAX))) } catch { /* best-effort */ } }
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
  for (;;) {
    // Re-read each time: something may have been queued while the last one was sending. A learner with an item to
    // retry is held, so that learner's order is kept, but nobody else's uploads wait behind it (BUG-04).
    const item = read().find(x => !tried.has(x.id) && (x.owner ?? who) === who && !held.has(x.learnerId))
    // Tried already = the queue could not be written (storage full): stop rather than send it forever.
    if (!item) return
    tried.add(item.id)
    const r = 'runOf' in item
      ? await recordPracticeRun(item.learnerId, item.runOf, loadRun(item.learnerId, item.runOf))
      : 'moduleId' in item
      ? await recordModulePractice(item.learnerId, item.moduleId, item.event)
      : await recordLessonProgress(item.learnerId, item.lessonId,
          { done: lessonDone(item.learnerId, item.lessonId), ...(loadStanding(item.learnerId, item.lessonId) ?? FRESH) },
          item.outcome, item.event)
    if (r === 'retry') { held.add(item.learnerId); continue }
    write(read().filter(x => x.id !== item.id))
  }
}

/**
 * Brings the account's progress for `lessonIds` onto this device, and uploads what only this device has (progress made
 * before sync existed). A topic with an upload still queued keeps the device's copy — it is the newer one.
 * Returns false when the account could not be read (the device copy is left as it is).
 */
export async function pullLessonProgress(learnerId: string, lessonIds: readonly string[]): Promise<boolean> {
  await flushLessonSync()
  const rows = await getLessonRows(learnerId)
  if (!rows) return false
  const server = new Map(rows.map(r => [r.lesson_id, r]))
  const pending = new Set(read().flatMap(x => (x.learnerId === learnerId && 'lessonId' in x ? [x.lessonId] : x.learnerId === learnerId && 'runOf' in x ? [x.runOf] : [])))
  const upload: string[] = [], runs: string[] = []
  for (const id of lessonIds) {
    if (pending.has(id)) continue
    const row = server.get(id), localDone = lessonDone(learnerId, id), local = loadStanding(learnerId, id), localRun = loadRun(learnerId, id)
    if (!row) { if (localDone || local) upload.push(id); if (localRun) runs.push(id); continue }
    if (localDone && !row.done) upload.push(id)
    if (row.done) markLessonDone(learnerId, id)
    saveStanding(learnerId, id, { level: row.level, streak: row.streak, mastered: row.mastered })
    // Where the child is in practice: the account's copy wins, as the standing does; one only this device has goes up.
    // (Stored as it came: `loadRun` checks the shape of every run it reads, from whichever side it came.)
    if (row.run) saveRun(learnerId, id, row.run as SavedRun)
    else if (localRun && row.run === null) runs.push(id)
  }
  const items = [...upload.map(lessonId => ({ id: uuid(), learnerId, lessonId })), ...runs.map(runOf => ({ id: uuid(), learnerId, runOf }))]
  if (items.length) { write([...read(), ...items]); await flushLessonSync() }
  return true
}

/**
 * Sign-out (N16 / ARC-02): removes the children's progress copies — done, standing, practice run — from this device, so
 * a shared or school computer does not keep every child the dashboard ever showed. The account holds them and the next
 * sign-in pulls them back.
 * ⚠️ A learner with ANY item still in the queue keeps its copies: an upload re-reads the device's copy when it sends
 * (`send` above), so clearing them would upload an empty topic, or nothing. The queue itself is never touched here.
 * Signed-out keys (`…-device-…`, doc 08) are not a learner's and are left alone.
 */
export function clearSyncedProgress(): void {
  const waiting = new Set(read().map(x => x.learnerId))
  const mirror = /^milo-newflow-(?:done|standing|run)-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-/i
  for (const k of kv.keys()) {
    const m = mirror.exec(k)
    if (m && !waiting.has(m[1])) kv.remove(k)
  }
}
