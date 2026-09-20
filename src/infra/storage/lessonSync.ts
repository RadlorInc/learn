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
import { FRESH, type Outcome } from '@/features/lessons/adaptive'
import { recordLessonProgress, recordModulePractice, getLessonRows } from '@/data/repositories/points'

type Item = { id: string; learnerId: string } & (
  | { lessonId: string; outcome?: Outcome; event?: string }
  | { moduleId: string; event: string })

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

/** How many uploads are waiting. The offline banner's number — it used to count `sessions`. */
export const pendingLessonUploads = (): number => read().length

let flushing: Promise<void> | null = null
/** Sends the queue in order and stops at the first item that should be retried, so order is kept. */
export function flushLessonSync(): Promise<void> {
  // ⚠️ Cleared in `.finally`, never inside `send`: with an empty queue `send` finishes synchronously, and a
  // `finally { flushing = null }` in there ran BEFORE the assignment — leaving a settled promise that every later
  // flush returned, so nothing was ever uploaded again. Caught by lessonSync.test.ts.
  return (flushing ??= send().finally(() => { flushing = null }))
}

async function send(): Promise<void> {
  const sent = new Set<string>()
  for (;;) {
    const [item] = read()
    // Seen twice = the queue could not be written (storage full): stop rather than send it forever.
    if (!item || sent.has(item.id)) return
    sent.add(item.id)
    const r = 'moduleId' in item
      ? await recordModulePractice(item.learnerId, item.moduleId, item.event)
      : await recordLessonProgress(item.learnerId, item.lessonId,
          { done: lessonDone(item.learnerId, item.lessonId), ...(loadStanding(item.learnerId, item.lessonId) ?? FRESH) },
          item.outcome, item.event)
    if (r === 'retry') return
    // Re-read: something may have been queued while this one was sending.
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
  const pending = new Set(read().flatMap(x => (x.learnerId === learnerId && 'lessonId' in x ? [x.lessonId] : [])))
  const upload: string[] = []
  for (const id of lessonIds) {
    if (pending.has(id)) continue
    const row = server.get(id), localDone = lessonDone(learnerId, id), local = loadStanding(learnerId, id)
    if (!row) { if (localDone || local) upload.push(id); continue }
    if (localDone && !row.done) upload.push(id)
    if (row.done) markLessonDone(learnerId, id)
    saveStanding(learnerId, id, { level: row.level, streak: row.streak, mastered: row.mastered })
  }
  if (upload.length) { write([...read(), ...upload.map(lessonId => ({ id: uuid(), learnerId, lessonId }))]); await flushLessonSync() }
  return true
}
